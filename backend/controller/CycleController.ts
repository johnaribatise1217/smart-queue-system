import { NextRequest, NextResponse } from "next/server";
import { catchAsyncErrors } from "backend/middleware/catchAsyncErrors"
import { Cycle } from "backend/model/cycle"
import { Queue } from "backend/model/queueModel"
import { QueueHistory } from "backend/model/queueHistory"
import { cycleQueue } from "backend/queue/cycle/cycle.worker"
import { User } from "backend/model/user";

export const createCycle = catchAsyncErrors(
  async (req: NextRequest) => {
    const body = await req.json()
    const { name, description, adminId, schedule, maxUsers } = body

    const cycle = await Cycle.create({
      name, description, adminId, schedule,
      maxUsers: maxUsers ?? 100,
    })

    return NextResponse.json(
      { success: true, message: "Cycle created successfully", data: cycle },
      { status: 201 }
    )
  }
)

export const addQueueToCycle = catchAsyncErrors(
  async (req: NextRequest) => {
    const body = await req.json()
    const { cycleId, name, description, location, deliverables, maxUsers } = body

    const cycle = await Cycle.findById(cycleId)
    if (!cycle) {
      return NextResponse.json(
        { success: false, message: "Cycle not found" },
        { status: 404 }
      )
    }

    // order is next in sequence
    const order = cycle.queues.length + 1

    const queue = await Queue.create({
      cycleId, name, description, location,
      deliverables: deliverables ?? [],
      maxUsers: maxUsers ?? 20,
      order,
    })

    // push queueId into cycle
    await Cycle.findByIdAndUpdate(cycleId, {
      $push: { queues: queue._id }
    })

    return NextResponse.json(
      { success: true, message: "Queue added to cycle", data: queue },
      { status: 201 }
    )
  }
)

export const joinCycle = catchAsyncErrors(async (req: NextRequest) => {
  const { userId, cycleId } = await req.json()

  const cycle = await Cycle.findById(cycleId)
  if (!cycle) {
    return NextResponse.json(
      { success: false, message: "Cycle not found" },
      { status: 404 }
    )
  }

  if (!cycle.isActive) {
    return NextResponse.json(
      { success: false, message: "This cycle is not currently active" },
      { status: 400 }
    )
  }

  // check if user already joined
  const existingHistory = await QueueHistory.findOne({ userId, cycleId })
  if (existingHistory) {
    return NextResponse.json(
      { success: false, message: "You have already joined this cycle" },
      { status: 400 }
    )
  }

  // validate cycle schedule — is today an available day and within time window?
  const now = new Date()
  const days = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"]
  const todayName = days[now.getDay()]
  const currentTime = `${now.getHours().toString().padStart(2,"0")}:${now.getMinutes().toString().padStart(2,"0")}`

  const todaySchedule = cycle.schedule.find(
    (s) => s.day === todayName && s.isActive
  )

  if (!todaySchedule) {
    return NextResponse.json(
      { success: false, message: `This cycle is not available on ${todayName}` },
      { status: 400 }
    )
  }

  if (currentTime < todaySchedule.startTime || currentTime > todaySchedule.endTime) {
    return NextResponse.json(
      {
        success: false,
        message: `This cycle is only available between ${todaySchedule.startTime} and ${todaySchedule.endTime} on ${todayName}`,
      },
      { status: 400 }
    )
  }

  // hand off to BullMQ — non-blocking
  const job = await cycleQueue.add("join-cycle", { userId, cycleId })

  return NextResponse.json(
    { success: true, message: "Joining cycle, please wait...", jobId: job.id },
    { status: 202 }
  )
})

export const advanceQueue = catchAsyncErrors(async (req: NextRequest) => {
  const { userId, cycleId, completedQueueId } = await req.json()

  const history = await QueueHistory.findOne({ userId, cycleId })
  if (!history) {
    return NextResponse.json(
      { success: false, message: "Queue history not found" },
      { status: 404 }
    )
  }

  if (history.cycleStatus === "completed") {
    return NextResponse.json(
      { success: false, message: "You have already completed this cycle" },
      { status: 400 }
    )
  }

  const job = await cycleQueue.add("advance-queue", {
    userId, cycleId, completedQueueId,
  })

  return NextResponse.json(
    { success: true, message: "Advancing to next queue...", jobId: job.id },
    { status: 202 }
  )
})

export const getUserQueueStatus = catchAsyncErrors(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url)
  const userId = searchParams.get("userId")
  const cycleId = searchParams.get("cycleId")

  const history = await QueueHistory.findOne({ userId, cycleId })
    .populate("currentQueueId", "name location description deliverables order")
    .populate("completedQueues", "name location order")
    .populate("joinedAt position completedAt")
    .lean()

  if (!history) {
    return NextResponse.json(
      { success: false, message: "No queue history found" },
      { status: 404 }
    )
  }

  return NextResponse.json({ success: true, data: history })
})

export const getAllBusinessCyclesForUser = catchAsyncErrors(async (
  req: NextRequest,
  { params }: { params: { adminId: string }}
) => {
  const cycles = await Cycle.find({adminId: params.adminId })
    .populate("queues", "name location order deliverables")
    .populate("adminId", "businessName businessAddress")
    .select("isActive schedule name description isActive")
    .lean()

  return NextResponse.json({ success: true, data: cycles })
})

export const getAllCyclesForAdmin = catchAsyncErrors(async (
  req: NextRequest,
) => {
  const { searchParams } = new URL(req.url)
  const adminId = searchParams.get("adminId")
  const cycles = await Cycle.find({ adminId: adminId })
    .select("name description isActive schedule maxUsers enrolledUsers waitingList queues createdAt")
    .sort({ createdAt: -1 })
    .lean()

  return NextResponse.json({ success: true, data: cycles, message: "Cycles retrieved successfully" })
})

export const getActiveCycles = catchAsyncErrors(async (req: NextRequest) => {
  const cycles = await Cycle.find({ isActive: true })
    .populate("queues")
    .populate("adminId", "name businessName")
    .lean()

  return NextResponse.json({ success: true, data: cycles })
})

export const getCycleDetails = catchAsyncErrors(async (
  req: NextRequest,
  { params }: { params: { cycleId: string } }
) => {
  const { cycleId } = params

  if (!cycleId) {
    return NextResponse.json(
      { success: false, message: "cycleId is required" },
      { status: 400 }
    )
  }

  const cycle = await Cycle.findById(cycleId)
    .populate({
      path: "queues",
      select: "name description location maxUsers inProgressUsers waitingList deliverables order isActive",
      options: { sort: { order: 1 } },
    })
    .populate("adminId", "name businessName email")
    .lean()

  if (!cycle) {
    return NextResponse.json(
      { success: false, message: "Cycle not found" },
      { status: 404 }
    )
  }

  console.log("Cycle details retrieved:", cycle)

  return NextResponse.json({ success: true, data: cycle })
})

export const toggleCycleStatus = catchAsyncErrors(async (
  req: NextRequest,
  { params }: { params: { cycleId: string } }
) => {
  const { cycleId } = params
  const { searchParams } = new URL(req.url)
  const adminId = searchParams.get("adminId")
  const { isActive } = await req.json()

  if (!adminId) {
    return NextResponse.json(
      { success: false, message: "adminId is required" },
      { status: 400 }
    )
  }

  if (typeof isActive !== "boolean") {
    return NextResponse.json(
      { success: false, message: "isActive must be a boolean" },
      { status: 400 }
    )
  }

  const cycle = await Cycle.findById(cycleId)

  if (!cycle) {
    return NextResponse.json(
      { success: false, message: "Cycle not found" },
      { status: 404 }
    )
  }

  // ownership check — only the admin who created the cycle can toggle it
  if (cycle.adminId.toString() !== adminId) {
    return NextResponse.json(
      { success: false, message: "You are not authorized to modify this cycle" },
      { status: 403 }
    )
  }

  cycle.isActive = isActive
  await cycle.save()

  return NextResponse.json({
    success: true,
    message: `Cycle ${isActive ? "activated" : "deactivated"} successfully`,
    data: { _id: cycle._id, isActive: cycle.isActive },
  })
})

// GET /api/cycles/join?adminId=xxx&cycleId=xxx
// Called when user scans QR code — gets business info + specific cycle
export const getCycleByAdminIdForUser = catchAsyncErrors(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url)
  const adminId = searchParams.get("adminId")
  const cycleId = searchParams.get("cycleId")

  if (!adminId || !cycleId) {
    return NextResponse.json(
      { success: false, message: "adminId and cycleId are required" },
      { status: 400 }
    )
  }

  const [cycle, admin] = await Promise.all([
    Cycle.findOne({ _id: cycleId, adminId, isActive: true })
      .populate({
        path: "queues",
        select: "name description location maxUsers deliverables order isActive",
        options: { sort: { order: 1 } },
      })
      .select("name description isActive schedule maxUsers cycleCode queues createdAt")
      .lean(),
    User.findById(adminId)
      .select("businessName businessAddress email")
      .lean(),
  ])

  if (!cycle) {
    return NextResponse.json(
      { success: false, message: "Cycle not found or is not active" },
      { status: 404 }
    )
  }

  if (!admin) {
    return NextResponse.json(
      { success: false, message: "Business not found" },
      { status: 404 }
    )
  }

  return NextResponse.json({
    success: true,
    data: { cycle, business: admin },
    message: "Cycle retrieved successfully",
  })
})

// GET /api/cycles/details?cycleId=xxx
// OR GET /api/cycles/details?cycleCode=SMQ1234
// Called when user enters a cycle code manually
export const getCycleDetailsForUser = catchAsyncErrors(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url)
  const cycleId   = searchParams.get("cycleId")
  const cycleCode = searchParams.get("cycleCode")

  if (!cycleId && !cycleCode) {
    return NextResponse.json(
      { success: false, message: "cycleId or cycleCode is required" },
      { status: 400 }
    )
  }

  const query = cycleId ? { _id: cycleId } : { cycleCode: cycleCode?.toUpperCase() }

  const cycle = await Cycle.findOne({ ...query, isActive: true })
    .populate({
      path: "queues",
      select: "name description location maxUsers deliverables order isActive",
      options: { sort: { order: 1 } },
    })
    .select("name description isActive schedule maxUsers cycleCode queues createdAt")
    .lean()

  if (!cycle) {
    return NextResponse.json(
      { success: false, message: "Cycle not found or is not active" },
      { status: 404 }
    )
  }

  // fetch the business info from adminId
  const admin = await User.findById(cycle.adminId)
    .select("businessName businessAddress email")
    .lean()

  return NextResponse.json({
    success: true,
    data: { cycle, business: admin },
    message: "Cycle retrieved successfully",
  })
})

// GET /api/cycles/business?adminId=xxx
// All active cycles from a specific business — for "view other cycles" feature
export const getAllCyclesByAdminId = catchAsyncErrors(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url)
  const adminId = searchParams.get("adminId")

  if (!adminId) {
    return NextResponse.json(
      { success: false, message: "adminId is required" },
      { status: 400 }
    )
  }

  const [cycles, admin] = await Promise.all([
    Cycle.find({ adminId, isActive: true })
      .select("name description isActive schedule maxUsers cycleCode queues createdAt")
      .sort({ createdAt: -1 })
      .lean(),
    User.findById(adminId)
      .select("businessName businessAddress email")
      .lean(),
  ])

  if (!admin) {
    return NextResponse.json(
      { success: false, message: "Business not found" },
      { status: 404 }
    )
  }

  return NextResponse.json({
    success: true,
    data: { cycles, business: admin },
    message: "Business cycles retrieved successfully",
  })
})