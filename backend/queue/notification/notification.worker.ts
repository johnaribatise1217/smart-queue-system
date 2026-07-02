import dbConnect from "backend/config/dbConnect"
import { generateQueue, generateWorker } from "../config"
import { Notification } from "backend/model/notification"
import { redisPublisher } from "backend/config/redis"
import { User } from "backend/model/user"

export interface NotificationJob {
  userId: string
  type: string
  title: string
  message: string
  metadata?: {
    cycleId?: string
    cycleCode?: string
    cycleName?: string
    queueId?: string
    queueName?: string
    position?: number
  }
  sendEmail?: boolean
}

export const notificationQueue = generateQueue("notificationQueue")

export const notificationWorker = generateWorker(
  "notificationQueue",
  async (job: any) => {
    await dbConnect()
    const data = job.data as NotificationJob

    // 1. save to DB
    const notification = await Notification.create({
      userId:   data.userId,
      type:     data.type,
      title:    data.title,
      message:  data.message,
      metadata: data.metadata ?? {},
    })

    // 2. push via Redis pub/sub so SSE picks it up
    await redisPublisher.publish(
      `notifications:${data.userId}`,
      JSON.stringify({
        _id:      notification._id,
        type:     notification.type,
        title:    notification.title,
        message:  notification.message,
        metadata: notification.metadata,
        isRead:   false,
        createdAt: notification.createdAt,
      })
    )

    // 3. send email if requested
    if (data.sendEmail) {
      const user = await User.findById(data.userId).select("email name").lean()
      if (user) {
        await sendNotificationEmail(user.email, user.name, data.title, data.message)
      }
    }
  }
)

async function sendNotificationEmail(
  email: string,
  name: string,
  title: string,
  message: string
) {
  const nodemailer = await import("nodemailer")
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === "true",
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  })

  await transporter.sendMail({
    from: `"Queue" <${process.env.SMTP_FROM}>`,
    to: email,
    subject: title,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;">
        <div style="background:#2347C5;border-radius:12px;padding:20px 24px;margin-bottom:24px;">
          <span style="color:#fff;font-size:18px;font-weight:700;">Queue</span>
        </div>
        <h2 style="color:#111827;font-size:18px;margin:0 0 8px;">${title}</h2>
        <p style="color:#6b7280;font-size:14px;line-height:1.6;margin:0 0 24px;">${message}</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/user/history"
           style="background:#2347C5;color:#fff;padding:12px 24px;border-radius:10px;text-decoration:none;font-size:14px;font-weight:600;">
          View Queue Status
        </a>
        <p style="color:#9ca3af;font-size:12px;margin-top:32px;">
          &copy; Queue 2025 · <a href="#" style="color:#3DBFA0;">Unsubscribe</a>
        </p>
      </div>
    `,
  })
}