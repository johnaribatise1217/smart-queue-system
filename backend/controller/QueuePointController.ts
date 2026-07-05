import dbConnect from "backend/config/dbConnect"
import { catchAsyncErrors } from "backend/middleware/catchAsyncErrors"
import { QueueHistory } from "backend/model/queueHistory"
import { Queue } from "backend/model/queueModel"
import { User } from "backend/model/user"
import { cycleQueue } from "backend/queue/cycle/cycle.worker"
import { emailQueue } from "backend/queue/email/email.worker"
import { NextRequest, NextResponse } from "next/server"

// Admin creates a queue point account linked to a specific queue
export const createQueuePointAccount = catchAsyncErrors(async (req: NextRequest) => {
  const body = await req.json()
  const { adminId, queueId, name, email, password } = body

  // verify admin owns the queue
  const queue = await Queue.findById(queueId).populate("cycleId", "adminId name")
  if (!queue) {
    return NextResponse.json({ success: false, message: "Queue not found" }, { status: 404 })
  }

  const cycleAdminId = (queue.cycleId as any)?.adminId?.toString()
  if (cycleAdminId !== adminId) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 403 })
  }

  const existing = await User.findOne({ email })
  if (existing) {
    return NextResponse.json(
      { success: false, message: "Email already registered" },
      { status: 400 }
    )
  }

  const sessionId = crypto.randomUUID()

  const queuePointUser = await User.create({
    name,
    email,
    password,
    phoneNumber: "",
    role: "queue_point",
    sessionId,
    isVerified: true,
    assignedQueueId: queueId,
    assignedAdminId: adminId,
  })

  await emailQueue.add('welcome', { email, name })

  return NextResponse.json({
    success: true,
    message: "Queue point account created",
    data: {
      _id: queuePointUser._id,
      name: queuePointUser.name,
      email: queuePointUser.email,
      role: queuePointUser.role,
      assignedQueueId: queueId,
    },
  }, { status: 201 })
})

// GET /api/admin/queue-point?adminId=xxx
export const getQueuePointAccounts = catchAsyncErrors(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url)
  const adminId = searchParams.get("adminId")

  const accounts = await User.find({ role: "queue_point", assignedAdminId: adminId })
    .select("name email assignedQueueId createdAt")
    .populate("assignedQueueId", "name location cycleId")
    .lean()

  return NextResponse.json({ success: true, data: accounts })
})

export const getQueuePointDashboard = catchAsyncErrors(async (req: NextRequest) => {
  await dbConnect()
  const { searchParams } = new URL(req.url)
  const userId = searchParams.get("userId")

  const queuePointUser = await User.findById(userId)
    .select("assignedQueueId assignedAdminId name")
    .lean()

  if (!queuePointUser?.assignedQueueId) {
    return NextResponse.json(
      { success: false, message: "No queue assigned to this account" },
      { status: 400 }
    )
  }

  const queueId = queuePointUser.assignedQueueId

  const [queue, inProgressHistories, waitingHistories] = await Promise.all([
    Queue.findById(queueId)
      .populate("cycleId", "name cycleCode isActive")
      .lean(),

    // users actively being served at this queue point
    QueueHistory.find({
      currentQueueId: queueId,
      cycleStatus: "inprogress",
    })
      .populate("userId", "name email phoneNumber avatar")
      .populate("cycleId", "name")
      .sort({ position: 1 })
      .lean(),

    // users waiting in line at this queue point (not cycle waiting list)
    QueueHistory.find({
      currentQueueId: queueId,
      cycleStatus: "waiting",
      isOnWaitingList: false,
    })
      .populate("userId", "name email phoneNumber avatar")
      .populate("cycleId", "name")
      .sort({ position: 1 })
      .lean(),
  ])

  if (!queue) {
    return NextResponse.json({ success: false, message: "Queue not found" }, { status: 404 })
  }

  return NextResponse.json({
    success: true,
    data: {
      queue,
      assignedAdminId: queuePointUser.assignedAdminId?.toString(),
      inProgress: inProgressHistories,
      waiting: waitingHistories,
      inProgressCount: inProgressHistories.length,
      waitingCount: waitingHistories.length,
      maxUsers: queue.maxUsers,
    },
  })
})

// POST /api/queue-point/advance
export const queuePointAdvanceUser = catchAsyncErrors(async (req: NextRequest) => {
  const { queuePointUserId, userId, cycleId, completedQueueId } = await req.json()

  // verify queue point user is assigned to this queue
  const queuePointUser = await User.findById(queuePointUserId)
    .select("assignedQueueId assignedAdminId role")
    .lean()

  if (!queuePointUser || queuePointUser.role !== "queue_point") {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 403 }
    )
  }

  if (queuePointUser.assignedQueueId?.toString() !== completedQueueId) {
    return NextResponse.json(
      { success: false, message: "You can only advance users in your assigned queue" },
      { status: 403 }
    )
  }

  const history = await QueueHistory.findOne({ userId, cycleId })
  if (!history) {
    return NextResponse.json(
      { success: false, message: "Queue history not found" },
      { status: 404 }
    )
  }

  if (history.cycleStatus === "completed") {
    return NextResponse.json(
      { success: false, message: "User has already completed this cycle" },
      { status: 400 }
    )
  }

  const job = await cycleQueue.add("advance-queue", {
    userId, cycleId, completedQueueId,
  })

  return NextResponse.json({
    success: true,
    message: "User is being advanced to the next queue",
    jobId: job.id,
  })
})

// GET /api/queue-point/eta?queueId=xxx
export const getQueueETA = catchAsyncErrors(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url)
  const queueId  = searchParams.get("queueId")
  const position = parseInt(searchParams.get("position") ?? "1")

  // get last 20 completed histories for this queue to calculate avg processing time
  const completedHistories = await QueueHistory.find({
    completedQueues: queueId,
    cycleStatus: "completed",
    completedAt: { $exists: true },
  })
    .select("joinedAt completedAt")
    .sort({ completedAt: -1 })
    .limit(20)
    .lean()

  let avgMinutes = 10 // fallback default

  if (completedHistories.length > 0) {
    const durations = completedHistories
      .filter((h) => h.completedAt && h.joinedAt)
      .map((h) => (new Date(h.completedAt!).getTime() - new Date(h.joinedAt).getTime()) / 60000)

    if (durations.length > 0) {
      avgMinutes = durations.reduce((a, b) => a + b, 0) / durations.length
    }
  }

  const queue = await Queue.findById(queueId)
    .select("name maxUsers inProgressUsers waitingList")
    .lean()

  if (!queue) {
    return NextResponse.json({ success: false, message: "Queue not found" }, { status: 404 })
  }

  // simple calculation — no need for AI here
  const estimatedMinutes = Math.round((position - 1) * avgMinutes)
  const estimatedTime    = estimatedMinutes < 60
    ? `${estimatedMinutes} minutes`
    : `${Math.round(estimatedMinutes / 60 * 10) / 10} hours`

  // use AI only when we have enough data to give a better narrative
  let aiSummary = `Based on current queue activity, estimated wait is ~${estimatedTime}.`

  if (completedHistories.length >= 5 && process.env.OPENAI_API_KEY) {
    try {
      const openai  = new (await import("openai")).default({ apiKey: process.env.OPENAI_API_KEY })
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{
          role: "user",
          content: `Queue "${queue.name}" has ${queue.inProgressUsers.length} users being served and ${queue.waitingList.length} waiting.
          Average processing time per user: ${Math.round(avgMinutes)} minutes.
          This user is at position ${position}.
          Write a single friendly sentence (max 20 words) telling them their estimated wait time. Be precise.`,
        }],
        max_tokens: 50,
      })
      aiSummary = response.choices[0]?.message?.content?.trim() ?? aiSummary
    } catch {
      // use fallback
    }
  }

  return NextResponse.json({
    success: true,
    data: {
      position,
      avgProcessingMinutes: Math.round(avgMinutes),
      estimatedMinutes,
      estimatedTime,
      aiSummary,
      basedOnSamples: completedHistories.length,
    },
  })
})
