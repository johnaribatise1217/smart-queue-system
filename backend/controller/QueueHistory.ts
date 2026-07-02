import { NextRequest, NextResponse } from "next/server"
import { catchAsyncErrors } from "backend/middleware/catchAsyncErrors"
import { QueueHistory } from "backend/model/queueHistory"
import { Cycle } from "backend/model/cycle"
import { cycleQueue } from "backend/queue/cycle/cycle.worker"

// GET /api/queue-history/user?userId=xxx
// Get all queue history for a specific user — their personal journey
export const getUserQueueHistory = catchAsyncErrors(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url)
  const userId = searchParams.get("userId")
  const status = searchParams.get("status")

  if (!userId) {
    return NextResponse.json(
      { success: false, message: "userId is required" },
      { status: 400 }
    )
  }

  const query: Record<string, any> = { userId }
  if (status && ["waiting", "inprogress", "completed"].includes(status)) {
    query.cycleStatus = status
  }

  const history = await QueueHistory.find(query)
    .populate("cycleId", "name description isActive schedule")
    .populate("currentQueueId", "name location order")
    .populate("completedQueues", "name location order")
    .sort({ joinedAt: -1 })
    .lean()

  // derive summary stats
  const total     = history.length
  const waiting   = history.filter((h) => h.cycleStatus === "waiting").length
  const inprogress = history.filter((h) => h.cycleStatus === "inprogress").length
  const completed = history.filter((h) => h.cycleStatus === "completed").length

  return NextResponse.json({
    success: true,
    data: history,
    stats: { total, waiting, inprogress, completed },
    message: "Queue history retrieved successfully",
  })
})

// GET /api/queue-history/user/active?userId=xxx
// Get the user's currently active queue entry — for the dashboard status cards
export const getUserActiveQueue = catchAsyncErrors(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url)
  const userId = searchParams.get("userId")

  if (!userId) {
    return NextResponse.json(
      { success: false, message: "userId is required" },
      { status: 400 }
    )
  }

  const active = await QueueHistory.findOne({
    userId,
    cycleStatus: { $in: ["waiting", "inprogress"] },
  })
    .populate("cycleId", "name description schedule maxUsers")
    .populate("currentQueueId", "name location order maxUsers")
    .populate("completedQueues", "name order")
    .lean()

  return NextResponse.json({
    success: true,
    data: active ?? null,
    message: active ? "Active queue found" : "No active queue",
  })
})

// GET /api/queue-history/admin?adminId=xxx&cycleId=xxx&status=xxx
// Get all queue history across admin's cycles — operational view
export const getAdminQueueHistory = catchAsyncErrors(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url)
  const adminId = searchParams.get("adminId")
  const cycleId = searchParams.get("cycleId") // optional — filter by specific cycle
  const status  = searchParams.get("status")  // optional — filter by status

  if (!adminId) {
    return NextResponse.json(
      { success: false, message: "adminId is required" },
      { status: 400 }
    )
  }

  // get all cycles belonging to this admin
  const adminCycles = await Cycle.find({ adminId }).select("_id").lean()
  const adminCycleIds = adminCycles.map((c) => c._id)

  if (adminCycleIds.length === 0) {
    return NextResponse.json({
      success: true,
      data: [],
      stats: { total: 0, waiting: 0, inprogress: 0, completed: 0 },
      message: "No cycles found for this admin",
    })
  }

  const query: Record<string, any> = {
    cycleId: cycleId ? cycleId : { $in: adminCycleIds },
  }

  if (status && ["waiting", "inprogress", "completed"].includes(status)) {
    query.cycleStatus = status
  }

  const history = await QueueHistory.find(query)
    .populate("userId", "name email phoneNumber avatar")
    .populate("cycleId", "name description")
    .populate("currentQueueId", "name location order")
    .populate("completedQueues", "name order")
    .sort({ joinedAt: 1 })
    .lean()

  const total      = history.length
  const waiting    = history.filter((h) => h.cycleStatus === "waiting").length
  const inprogress = history.filter((h) => h.cycleStatus === "inprogress").length
  const completed  = history.filter((h) => h.cycleStatus === "completed").length

  if(history.length === 0) {
    return NextResponse.json({
      success: true,
      data: [],
      stats: { total: 0, waiting: 0, inprogress: 0, completed: 0 },
      message: "No queue history found for the specified criteria",
    })
  }

  return NextResponse.json({
    success: true,
    data: history,
    stats: { total, waiting, inprogress, completed },
    message: "Admin queue history retrieved successfully",
  })
})

// POST /api/queue-history/admin/advance
// Admin manually advances a user to the next queue step
export const adminAdvanceUser = catchAsyncErrors(async (req: NextRequest) => {
  const { userId, cycleId, completedQueueId, adminId } = await req.json()

  if (!userId || !cycleId || !completedQueueId || !adminId) {
    return NextResponse.json(
      { success: false, message: "userId, cycleId, completedQueueId and adminId are required" },
      { status: 400 }
    )
  }

  // verify admin owns this cycle
  const cycle = await Cycle.findById(cycleId).select("adminId").lean()
  if (!cycle) {
    return NextResponse.json(
      { success: false, message: "Cycle not found" },
      { status: 404 }
    )
  }

  if (cycle.adminId.toString() !== adminId) {
    return NextResponse.json(
      { success: false, message: "You are not authorized to manage this cycle" },
      { status: 403 }
    )
  }

  const history = await QueueHistory.findOne({ userId, cycleId })
  if (!history) {
    return NextResponse.json(
      { success: false, message: "Queue history not found for this user" },
      { status: 404 }
    )
  }

  if (history.cycleStatus === "completed") {
    return NextResponse.json(
      { success: false, message: "User has already completed this cycle" },
      { status: 400 }
    )
  }

  // hand off to BullMQ worker
  const job = await cycleQueue.add("advance-queue", {
    userId, cycleId, completedQueueId,
  })

  return NextResponse.json({
    success: true,
    message: "User is being advanced to the next queue",
    jobId: job.id,
  })
})

// DELETE /api/queue-history/admin/remove
// Admin removes a user from a cycle entirely
export const adminRemoveUser = catchAsyncErrors(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url)
  const userId  = searchParams.get("userId")
  const cycleId = searchParams.get("cycleId")
  const adminId = searchParams.get("adminId")

  if (!userId || !cycleId || !adminId) {
    return NextResponse.json(
      { success: false, message: "userId, cycleId and adminId are required" },
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

  if (cycle.adminId.toString() !== adminId) {
    return NextResponse.json(
      { success: false, message: "You are not authorized to manage this cycle" },
      { status: 403 }
    )
  }

  // remove from cycle enrolledUsers and waitingList
  await Cycle.findByIdAndUpdate(cycleId, {
    $pull: {
      enrolledUsers: userId,
      waitingList: userId,
    },
  })

  // delete their history for this cycle
  await QueueHistory.findOneAndDelete({ userId, cycleId })

  // trigger waiting list processing — a slot just freed
  await cycleQueue.add("process-cycle-waiting", { cycleId })

  return NextResponse.json({
    success: true,
    message: "User removed from cycle successfully",
  })
})