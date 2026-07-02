import { NextRequest, NextResponse } from "next/server"
import { catchAsyncErrors } from "backend/middleware/catchAsyncErrors"
import { DeliverableSubmission } from "backend/model/deliverableSubmission"
import { notificationQueue } from "backend/queue/notification/notification.worker"

// GET /api/deliverables?queueId=xxx&userId=xxx
// User sees their own submission status for a specific queue
export const getUserDeliverables = catchAsyncErrors(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url)
  const userId  = searchParams.get("userId")
  const queueId = searchParams.get("queueId")

  if (!userId || !queueId) {
    return NextResponse.json(
      { success: false, message: "userId and queueId are required" },
      { status: 400 }
    )
  }

  const submissions = await DeliverableSubmission.find({ userId, queueId })
    .sort({ createdAt: -1 })
    .lean()

  return NextResponse.json({ success: true, data: submissions })
})

// GET /api/deliverables/queue?queueId=xxx
// Queue point user sees all pending submissions for their queue
export const getQueueDeliverables = catchAsyncErrors(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url)
  const queueId = searchParams.get("queueId")
  const status  = searchParams.get("status") // optional filter

  if (!queueId) {
    return NextResponse.json(
      { success: false, message: "queueId is required" },
      { status: 400 }
    )
  }

  const query: any = { queueId }
  if (status) query.status = status

  const submissions = await DeliverableSubmission.find(query)
    .populate("userId", "name email phoneNumber avatar")
    .sort({ createdAt: -1 })
    .lean()

  const pending  = submissions.filter((s) => s.status === "pending").length
  const approved = submissions.filter((s) => s.status === "approved").length
  const rejected = submissions.filter((s) => s.status === "rejected").length

  return NextResponse.json({
    success: true,
    data: submissions,
    stats: { pending, approved, rejected, total: submissions.length },
  })
})

// PATCH /api/deliverables/review
export const reviewDeliverable = catchAsyncErrors(async (req: NextRequest) => {
  const { submissionId, reviewedBy, status, rejectionReason } = await req.json()

  if (!["approved", "rejected"].includes(status)) {
    return NextResponse.json(
      { success: false, message: "status must be approved or rejected" },
      { status: 400 }
    )
  }

  const submission = await DeliverableSubmission.findByIdAndUpdate(
    submissionId,
    { status, reviewedBy, rejectionReason: rejectionReason ?? "" },
    { new: true }
  )

  if (!submission) {
    return NextResponse.json(
      { success: false, message: "Submission not found" },
      { status: 404 }
    )
  }

  await notificationQueue.add("notify", {
    userId:  submission.userId.toString(),
    type:    status === "approved" ? "queue_advanced" : "position_moved",
    title:   status === "approved" ? "Document Approved ✓" : "Document Rejected",
    message: status === "approved"
      ? `Your "${submission.deliverableName}" has been approved.`
      : `Your "${submission.deliverableName}" was rejected. Reason: ${rejectionReason}. Please resubmit.`,
    metadata: { queueId: submission.queueId.toString() },
    sendEmail: true,
  })

  return NextResponse.json({
    success: true,
    message: `Document ${status}`,
    data: submission,
  })
})