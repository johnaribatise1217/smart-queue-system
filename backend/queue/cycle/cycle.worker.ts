import 'dotenv/config'
import { generateQueue, generateWorker } from "../config";
import { Cycle } from "backend/model/cycle";
import { Queue } from "backend/model/queueModel";
import { QueueHistory } from "backend/model/queueHistory";
import dbConnect from "backend/config/dbConnect";

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
          await Cycle.findByIdAndUpdate(cycleId, {
            $addToSet: { waitingList: userId }
          })
          await QueueHistory.findOneAndUpdate(
            { userId, cycleId },
            { isOnWaitingList: true, cycleStatus: "waiting" },
            { upsert: true, new: true }
          )
          console.log(`User ${userId} added to cycle waiting list`)
          return { status: "waiting" }
        }

        // get the first queue in the cycle
        const firstQueue = await Queue.findOne({ cycleId, order: 1, isActive: true })
        if (!firstQueue) throw new Error("No active queues found in this cycle")

        const isQueueFull = firstQueue.inProgressUsers.length >= firstQueue.maxUsers
        if(isQueueFull){
          // add to queue waiting list, enroll in cycle
          await Cycle.findByIdAndUpdate(cycleId, {
            $addToSet: { enrolledUsers: userId }
          })
          await Queue.findByIdAndUpdate(firstQueue._id, {
            $addToSet: { waitingList: userId }
          })
          await QueueHistory.findOneAndUpdate(
            { userId, cycleId },
            {
              currentQueueId: firstQueue._id,
              cycleStatus: "waiting",
              isOnWaitingList: false,
              position: firstQueue.waitingList.length + 1,
            },
            { upsert: true, new: true }
          )
          console.log(`User ${userId} added to queue waiting list`)
          return { status: "queue-waiting" }
        }

        // enroll user into cycle and first queue
        const position = firstQueue.inProgressUsers.length + 1

        await Cycle.findByIdAndUpdate(cycleId, {
          $addToSet: { enrolledUsers: userId }
        })
        await Queue.findByIdAndUpdate(firstQueue._id, {
          $addToSet: { inProgressUsers: userId }
        })
        await QueueHistory.findOneAndUpdate(
          { userId, cycleId },
          {
            currentQueueId: firstQueue._id,
            cycleStatus: "inprogress",
            isOnWaitingList: false,
            position,
          },
          { upsert: true, new: true }
        )

        console.log(`User ${userId} joined cycle at queue position ${position}`)
        return { status: "joined", position }
      }

      // ── ADVANCE TO NEXT QUEUE
      if (job.name === "advance-queue") {
        const { userId, cycleId, completedQueueId } = job.data as AdvanceQueueJob

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
        const completedQueue = await Queue.findById(completedQueueId)
        const nextQueue = await Queue.findOne({
          cycleId,
          order: (completedQueue?.order ?? 0) + 1,
          isActive: true,
        })

        if (!nextQueue) {
          // no more queues — cycle complete
          await QueueHistory.findOneAndUpdate(
            { userId, cycleId },
            {
              cycleStatus: "completed",
              currentQueueId: null,
              position: 0,
              completedAt: new Date(),
            }
          )

          // remove from cycle enrolledUsers
          await Cycle.findByIdAndUpdate(cycleId, {
            $pull: { enrolledUsers: userId }
          })

          // process cycle waiting list — slot just freed
          await cycleQueue.add("process-cycle-waiting", { cycleId })

          console.log(`User ${userId} completed the full cycle`)
          return { status: "cycle-completed" }
        }
        // push to next queue
        const isNextQueueFull = nextQueue.inProgressUsers.length >= nextQueue.maxUsers
        if (isNextQueueFull) {
          await Queue.findByIdAndUpdate(nextQueue._id, {
            $addToSet: { waitingList: userId }
          })
          await QueueHistory.findOneAndUpdate(
            { userId, cycleId },
            { currentQueueId: nextQueue._id, cycleStatus: "waiting", position: nextQueue.waitingList.length + 1 }
          )
          console.log(`User ${userId} added to next queue waiting list`)
          return { status: "next-queue-waiting" }
        }

        const position = nextQueue.inProgressUsers.length + 1
        await Queue.findByIdAndUpdate(nextQueue._id, {
          $addToSet: { inProgressUsers: userId }
        })
        await QueueHistory.findOneAndUpdate(
          { userId, cycleId },
          { currentQueueId: nextQueue._id, cycleStatus: "inprogress", position }
        )

        console.log(`User ${userId} advanced to queue ${nextQueue.name} at position ${position}`)
        return { status: "advanced", nextQueue: nextQueue.name, position }
      }

      //PROCESS QUEUE WAITING
      if (job.name === "process-queue-waiting") {
        const { queueId } = job.data
        const queue = await Queue.findById(queueId)
        if (!queue) return

        const availableSlots = queue.maxUsers - queue.inProgressUsers.length
        if (availableSlots <= 0 || queue.waitingList.length === 0) return

        // take users from waiting list to fill slots (FIFO)
        const usersToPromote = queue.waitingList.slice(0, availableSlots)

        await Queue.findByIdAndUpdate(queueId, {
          $pull:      { waitingList: { $in: usersToPromote } },
          $addToSet:  { inProgressUsers: { $each: usersToPromote } },
        })

        // update their history
        for (let i = 0; i < usersToPromote.length; i++) {
          await QueueHistory.findOneAndUpdate(
            { userId: usersToPromote[i], currentQueueId: queueId },
            { cycleStatus: "inprogress", position: queue.inProgressUsers.length + i + 1 }
          )
        }

        console.log(`Promoted ${usersToPromote.length} users from queue waiting list`)
      }

      //PROCESS CYCLE WAITING
      if (job.name === "process-cycle-waiting") {
        const { cycleId } = job.data as ProcessWaitingListJob
        const cycle = await Cycle.findById(cycleId)
        if (!cycle) return

        const availableSlots = cycle.maxUsers - cycle.enrolledUsers.length
        if (availableSlots <= 0 || cycle.waitingList.length === 0) return

        const usersToPromote = cycle.waitingList.slice(0, availableSlots)

        await Cycle.findByIdAndUpdate(cycleId, {
          $pull:     { waitingList: { $in: usersToPromote } },
          $addToSet: { enrolledUsers: { $each: usersToPromote } },
        })

        // queue a join-cycle job for each promoted user
        for (const userId of usersToPromote) {
          await cycleQueue.add("join-cycle", { userId, cycleId })
          await QueueHistory.findOneAndUpdate(
            { userId, cycleId },
            { isOnWaitingList: false }
          )
        }

        console.log(`Promoted ${usersToPromote.length} users from cycle waiting list`)
      }
    } catch (error) {
      console.error(`Cycle job [${job.name}] id:${job.id} failed:`, error)
      throw error
    }
  }
)