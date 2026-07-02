import 'dotenv/config'
import { generateQueue, generateWorker } from "../config";
import { Cycle } from "backend/model/cycle";
import { Queue } from "backend/model/queueModel";
import { QueueHistory } from "backend/model/queueHistory";
import dbConnect from "backend/config/dbConnect";
import { notificationQueue } from '../notification/notification.worker';

export interface JoinCycleJob {
  userId: string;
  cycleId: string;
}

export interface AdvanceQueueJob {
  userId: string;
  cycleId: string;
  completedQueueId: string;
}

export interface ProcessWaitingListJob {
  cycleId: string;
}

export const cycleQueue = generateQueue("cycleQueue")

export const cycleWorker = generateWorker(
  "cycleQueue",
  async (job: any) => {
    await dbConnect()

    try {
      console.log(`Processing cycle job [${job.name}] id:${job.id}`)
      //JOIN CYCLE
      if(job.name === "join-cycle"){
        const { userId, cycleId } = job.data as JoinCycleJob
        const cycle = await Cycle.findById(cycleId)
        if (!cycle) throw new Error("Cycle not found")

        const isFull = cycle.enrolledUsers.length >= cycle.maxUsers

        if (isFull) {
          // push to waiting list
          await Promise.all([
            Cycle.findByIdAndUpdate(cycleId, {
              $addToSet: { waitingList: userId }
            }),
            QueueHistory.findOneAndUpdate(
              { userId, cycleId },
              { isOnWaitingList: true, cycleStatus: "waiting" },
              { upsert: true, new: true }
            ),
            notificationQueue.add("notify", {
              userId,
              type: "waiting_list_promoted",
              title: "Added to Waiting List",
              message: `The cycle "${cycle.name}" is full. You've been added to the waiting list and will be notified when a spot opens.`,
              metadata: { cycleId, cycleName: cycle.name },
              sendEmail: true,
            }),
          ])
          console.log(`User ${userId} added to cycle waiting list`)
          return { status: "waiting" }
        }

        // get the first queue in the cycle
        const firstQueue = await Queue.findOne({ cycleId, order: 1, isActive: true })
        if (!firstQueue) throw new Error("No active queues found in this cycle")

        const isQueueFull = firstQueue.inProgressUsers.length >= firstQueue.maxUsers
        if(isQueueFull){
          // add to queue waiting list, enroll in cycle
          const waitingPosition = firstQueue.waitingList.length + 1
          await Promise.all([
            Cycle.findByIdAndUpdate(cycleId, { $addToSet: { enrolledUsers: userId } }),
            Queue.findByIdAndUpdate(firstQueue._id, { $addToSet: { waitingList: userId } }),
            QueueHistory.findOneAndUpdate(
              { userId, cycleId },
              {
                currentQueueId: firstQueue._id,
                cycleStatus: "waiting",
                isOnWaitingList: false,
                position: waitingPosition,
              },
              { upsert: true, new: true }
            ),
            notificationQueue.add("notify", {
              userId,
              type: "queue_advanced",
              title: "Joined Queue Waiting List",
              message: `You've been added to the waiting list for "${firstQueue.name}" in "${cycle.name}". Your position is #${waitingPosition}.`,
              metadata: { cycleId, cycleName: cycle.name, queueId: firstQueue._id.toString(), queueName: firstQueue.name, position: waitingPosition },
              sendEmail: true,
            }),
          ])
          console.log(`User ${userId} added to queue waiting list`)
          return { status: "queue-waiting" }
        }

        // enroll user into cycle and first queue
        const position = firstQueue.inProgressUsers.length + 1

        await Promise.all([
          Cycle.findByIdAndUpdate(cycleId, { $addToSet: { enrolledUsers: userId } }),
          Queue.findByIdAndUpdate(firstQueue._id, { $addToSet: { inProgressUsers: userId } }),
          QueueHistory.findOneAndUpdate(
            { userId, cycleId },
            {
              currentQueueId: firstQueue._id,
              cycleStatus: "inprogress",
              isOnWaitingList: false,
              position,
            },
            { upsert: true, new: true }
          ),
          notificationQueue.add("notify", {
            userId,
            type: "queue_advanced",
            title: `You've Joined "${cycle.name}"`,
            message: `You are now in "${firstQueue.name}" at position #${position}. Head to ${firstQueue.location}.`,
            metadata: { cycleId, cycleName: cycle.name, queueId: firstQueue._id.toString(), queueName: firstQueue.name, position },
            sendEmail: true,
          }),
        ])

        console.log(`User ${userId} joined cycle at queue position ${position}`)
        return { status: "joined", position }
      }

      // ADVANCE TO NEXT QUEUE
      if (job.name === "advance-queue") {
        const { userId, cycleId, completedQueueId } = job.data as AdvanceQueueJob

        const [completedQueue, cycle] = await Promise.all([
          Queue.findById(completedQueueId),
          Cycle.findById(cycleId).select("name cycleCode"),
        ])

        if (!completedQueue || !cycle) throw new Error("Queue or cycle not found")

        const history = await QueueHistory.findOne({ userId, cycleId })
        if (!history) throw new Error("Queue history not found")

        // remove user from current queue's inProgressUsers
        await Queue.findByIdAndUpdate(completedQueueId, {
          $pull: { inProgressUsers: userId }
        })

        // mark this queue as completed in history
        await QueueHistory.findOneAndUpdate(
          { userId, cycleId },
          { $addToSet: { completedQueues: completedQueueId } }
        )

        // process waiting list for the completed queue
        await cycleQueue.add("process-queue-waiting", {
          queueId: completedQueueId,
        })

        // find the next queue in the cycle
        const nextQueue = await Queue.findOne({
          cycleId,
          order: (completedQueue?.order ?? 0) + 1,
          isActive: true,
        })

        // recalculate positions for remaining users in completed queue
        // and process its waiting list — both in parallel
        await Promise.all([
          recalculatePositions(completedQueueId.toString()),
          processQueueWaitingList(completedQueueId.toString(), cycle.name),
        ])

        if (!nextQueue) {
          // no more queues — cycle complete
          await Promise.all([
            QueueHistory.findOneAndUpdate(
              { userId, cycleId },
              {
                cycleStatus: "completed",
                currentQueueId: null,
                position: 0,
                completedAt: new Date(),
              }
            ),
            Cycle.findByIdAndUpdate(cycleId, { $pull: { enrolledUsers: userId } }),
            cycleQueue.add("process-cycle-waiting", { cycleId }),
            notificationQueue.add("notify", {
              userId,
              type: "cycle_completed",
              title: "Cycle Completed! 🎉",
              message: `You've successfully completed all queues in "${cycle.name}". Well done!`,
              metadata: { cycleId, cycleName: cycle.name },
              sendEmail: true,
            }),
          ])
          return { status: "cycle-completed" }
        }

        // push to next queue
        const isNextQueueFull = nextQueue.inProgressUsers.length >= nextQueue.maxUsers
        if (isNextQueueFull) {
          const waitingPosition = nextQueue.waitingList.length + 1
          await Promise.all([
            Queue.findByIdAndUpdate(nextQueue._id, { $addToSet: { waitingList: userId } }),
            QueueHistory.findOneAndUpdate(
              { userId, cycleId },
              { currentQueueId: nextQueue._id, cycleStatus: "waiting", position: waitingPosition }
            ),
            notificationQueue.add("notify", {
              userId,
              type: "queue_advanced",
              title: "Added to Next Queue Waiting List",
              message: `"${nextQueue.name}" is currently full. You're #${waitingPosition} on the waiting list.`,
              metadata: { cycleId, cycleName: cycle.name, queueId: nextQueue._id.toString(), queueName: nextQueue.name, position: waitingPosition },
              sendEmail: false,
            }),
          ])
          console.log(`User ${userId} added to next queue waiting list`)
          return { status: "next-queue-waiting" }
        }

        const position = nextQueue.inProgressUsers.length + 1
        
        await Promise.all([
          Queue.findByIdAndUpdate(nextQueue._id, { $addToSet: { inProgressUsers: userId } }),
          QueueHistory.findOneAndUpdate(
            { userId, cycleId },
            { currentQueueId: nextQueue._id, cycleStatus: "inprogress", position }
          ),
          notificationQueue.add("notify", {
            userId,
            type: "queue_advanced",
            title: `Moved to "${nextQueue.name}"`,
            message: `You've been advanced to "${nextQueue.name}" in "${cycle.name}". Your position is #${position}. Head to ${nextQueue.location}.`,
            metadata: { cycleId, cycleName: cycle.name, queueId: nextQueue._id.toString(), queueName: nextQueue.name, position },
            sendEmail: true,
          }),
        ])

        console.log(`User ${userId} advanced to queue ${nextQueue.name} at position ${position}`)
        return { status: "advanced", nextQueue: nextQueue.name, position }
      }

      //PROCESS QUEUE WAITING
      if (job.name === "process-queue-waiting") {
        await processQueueWaitingList(job.data.queueId, job.data.cycleName ?? "")
      }

      //PROCESS CYCLE WAITING
      if (job.name === "process-cycle-waiting") {
        const { cycleId } = job.data as ProcessWaitingListJob
        const cycle = await Cycle.findById(cycleId)
        if (!cycle) return

        const availableSlots = cycle.maxUsers - cycle.enrolledUsers.length
        if (availableSlots <= 0 || cycle.waitingList.length === 0) return

        const usersToPromote = cycle.waitingList.slice(0, availableSlots).map((id) => id.toString())

        await Promise.all([
          Cycle.findByIdAndUpdate(cycleId, {
            $pull:     { waitingList: { $in: usersToPromote } },
            $addToSet: { enrolledUsers: { $each: usersToPromote } },
          }),
          QueueHistory.updateMany(
            { userId: { $in: usersToPromote }, cycleId },
            { isOnWaitingList: false }
          ),
          // queue join-cycle job for each promoted user
          ...usersToPromote.map((userId: string) =>
            cycleQueue.add("join-cycle", { userId, cycleId })
          ),
          // notify all promoted users at once
          ...usersToPromote.map((userId: string) =>
            notificationQueue.add("notify", {
              userId,
              type: "waiting_list_promoted",
              title: "You're Off the Waiting List!",
              message: `A spot opened up in "${cycle.name}". You're now being placed in the queue.`,
              metadata: { cycleId, cycleName: cycle.name },
              sendEmail: true,
            })
          ),
        ])

        console.log(`Promoted ${usersToPromote.length} users from cycle waiting list`)
      }
    } catch (error) {
      console.error(`Cycle job [${job.name}] id:${job.id} failed:`, error)
      throw error
    }
  }
)

// Recalculate positions for all inProgress users in a queue after someone leaves
async function recalculatePositions(queueId: string) {
  const queue = await Queue.findById(queueId).select("inProgressUsers").lean()
  if (!queue || queue.inProgressUsers.length === 0) return

  // bulk update positions in one updateMany with individual position values
  // we sort by joinedAt to maintain FIFO order
  const histories = await QueueHistory.find({
    userId: { $in: queue.inProgressUsers },
    currentQueueId: queueId,
    cycleStatus: "inprogress",
  })
  .select("userId")
  .sort({ joinedAt: 1 }) // FIFO
  .lean()

  if (histories.length === 0) return

  // bulk write — one round trip to MongoDB
  const bulkOps = histories.map((h, index) => ({
    updateOne: {
      filter: { _id: h._id },
      update: { $set: { position: index + 1 } },
    },
  }))

  await QueueHistory.bulkWrite(bulkOps)

  // check threshold notifications — 5 away and 1 away
  await Promise.all(
    histories.map(async (h, index) => {
      const position = index + 1
      if (position === 5) {
        await notificationQueue.add("notify", {
          userId: h.userId.toString(),
          type: "near_advance",
          title: "Almost Your Turn!",
          message: `You are 5 positions away from moving to the next queue in your cycle.`,
          metadata: { queueId, position },
          sendEmail: false,
        })
      }
      if (position === 1) {
        await notificationQueue.add("notify", {
          userId: h.userId.toString(),
          type: "immediate_advance",
          title: "You're Next!",
          message: `You are next in line. Get ready to move to the next queue step!`,
          metadata: { queueId, position: 1 },
          sendEmail: false,
        })
      }
    })
  )
}

// Promote users from a queue's waiting list into inProgress slots
async function processQueueWaitingList(queueId: string, cycleName: string) {
  const queue = await Queue.findById(queueId).select("maxUsers inProgressUsers waitingList name location")
  if (!queue) return

  const availableSlots = queue.maxUsers - queue.inProgressUsers.length
  if (availableSlots <= 0 || queue.waitingList.length === 0) return

  const usersToPromote = queue.waitingList.slice(0, availableSlots).map((id) => id.toString())

  await Promise.all([
    Queue.findByIdAndUpdate(queueId, {
      $pull:     { waitingList: { $in: usersToPromote } },
      $addToSet: { inProgressUsers: { $each: usersToPromote } },
    }),
    QueueHistory.updateMany(
      { userId: { $in: usersToPromote }, currentQueueId: queueId },
      { cycleStatus: "inprogress" }
    ),
    ...usersToPromote.map((userId: string, index: number) =>
      notificationQueue.add("notify", {
        userId,
        type: "waiting_list_promoted",
        title: `Moved into "${queue.name}"`,
        message: `You've been moved from the waiting list into "${queue.name}". Head to ${queue.location}.`,
        metadata: { queueId, queueName: queue.name, cycleName, position: queue.inProgressUsers.length + index + 1 },
        sendEmail: false,
      })
    ),
  ])

  // recalculate positions after promotion
  await recalculatePositions(queueId)
  console.log(`Promoted ${usersToPromote.length} users from queue ${queueId} waiting list`)
}