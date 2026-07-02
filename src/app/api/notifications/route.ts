import { NextRequest, NextResponse } from "next/server"
import { catchAsyncErrors } from "backend/middleware/catchAsyncErrors"
import { Notification } from "backend/model/notification"
import dbConnect from "backend/config/dbConnect"

// GET /api/notifications?userId=xxx&unreadOnly=true
export const GET = catchAsyncErrors(async (req: NextRequest) => {
  await dbConnect()
  const { searchParams } = new URL(req.url)
  const userId     = searchParams.get("userId")
  const unreadOnly = searchParams.get("unreadOnly") === "true"

  if (!userId) {
    return NextResponse.json({ success: false, message: "userId is required" }, { status: 400 })
  }

  const query: any = { userId }
  if (unreadOnly) query.isRead = false

  const [notifications, unreadCount] = await Promise.all([
    Notification.find(query).sort({ createdAt: -1 }).limit(30).lean(),
    Notification.countDocuments({ userId, isRead: false }),
  ])

  return NextResponse.json({ success: true, data: notifications, unreadCount })
})

// PATCH /api/notifications — mark all as read
export const PATCH = catchAsyncErrors(async (req: NextRequest) => {
  await dbConnect()
  const { userId, notificationId } = await req.json()

  if (notificationId) {
    await Notification.findByIdAndUpdate(notificationId, { isRead: true })
  } else {
    await Notification.updateMany({ userId, isRead: false }, { isRead: true })
  }

  return NextResponse.json({ success: true, message: "Marked as read" })
})