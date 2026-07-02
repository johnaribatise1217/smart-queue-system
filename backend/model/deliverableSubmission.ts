import mongoose, { Document, Model, model, Schema, Types } from "mongoose"

export interface IDeliverableSubmission extends Document {
  userId:       Types.ObjectId
  cycleId:      Types.ObjectId
  queueId:      Types.ObjectId
  deliverableName: string
  type:         "hardcopy" | "uploadable"
  fileUrl?:     string
  publicId?:    string
  status:       "pending" | "approved" | "rejected"
  rejectionReason?: string
  reviewedBy?:  Types.ObjectId // queue point user
  aiVerified?:  boolean
  aiNotes?:     string
  createdAt:    Date
}

const DeliverableSubmissionSchema = new Schema<IDeliverableSubmission>({
  userId:          { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  cycleId:         { type: Schema.Types.ObjectId, ref: "Cycle", required: true },
  queueId:         { type: Schema.Types.ObjectId, ref: "Queue", required: true, index: true },
  deliverableName: { type: String, required: true },
  type:            { type: String, enum: ["hardcopy", "uploadable"], required: true },
  fileUrl:         { type: String },
  publicId:        { type: String },
  status:          { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
  rejectionReason: { type: String },
  reviewedBy:      { type: Schema.Types.ObjectId, ref: "User" },
  aiVerified:      { type: Boolean, default: false },
  aiNotes:         { type: String },
}, { timestamps: true })

DeliverableSubmissionSchema.index({ userId: 1, queueId: 1 })
DeliverableSubmissionSchema.index({ queueId: 1, status: 1 })

export const DeliverableSubmission = (mongoose.models.DeliverableSubmission as Model<IDeliverableSubmission>)
  || model<IDeliverableSubmission>("DeliverableSubmission", DeliverableSubmissionSchema)