import mongoose, { Document, Model, model, Schema, Types } from "mongoose"

export type NotificationType =
  | "position_moved"
  | "queue_advanced"
  | "near_advance"     // 5 positions away
  | "immediate_advance" // 1 position away
  | "cycle_completed"
  | "waiting_list_promoted"

export interface INotification extends Document {
  _id: Types.ObjectId
  userId: Types.ObjectId
  type: NotificationType
  title: string
  message: string
  isRead: boolean
  metadata: {
    cycleId?: string
    cycleCode?: string
    cycleName?: string
    queueId?: string
    queueName?: string
    position?: number
  }
  createdAt: Date
}

const NotificationSchema = new Schema<INotification>({
  userId:  { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  type:    { type: String, required: true },
  title:   { type: String, required: true },
  message: { type: String, required: true },
  isRead:  { type: Boolean, default: false, index: true },
  metadata: {
    cycleId:   { type: String },
    cycleCode: { type: String },
    cycleName: { type: String },
    queueId:   { type: String },
    queueName: { type: String },
    position:  { type: Number },
  },
}, { timestamps: true })

NotificationSchema.index({ userId: 1, isRead: 1 })
NotificationSchema.index({ userId: 1, createdAt: -1 })

export const Notification = (mongoose.models.Notification as Model<INotification>) || model<INotification>("Notification", NotificationSchema)