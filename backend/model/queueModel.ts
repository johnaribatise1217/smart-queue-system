import mongoose, { Document, Model, model, Schema, Types } from "mongoose";

export interface IDeliverable {
  name: string;
  description: string;
  type: "hardcopy" | "uploadable";
  required: boolean;
  acceptedFormats?: string[]; // ["pdf", "jpg", "png"] for uploadable
}

export interface IQueue extends Document {
  _id: Types.ObjectId;
  cycleId: Types.ObjectId;
  name: string;
  description: string;
  location: string;           
  deliverables: IDeliverable[];
  maxUsers: number;           
  inProgressUsers: Types.ObjectId[];
  waitingList: Types.ObjectId[];
  order: number;              
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const DeliverableSchema = new Schema<IDeliverable>({
  name:            { type: String, required: true },
  description:     { type: String, required: true },
  type:            { type: String, enum: ["hardcopy", "uploadable"], required: true },
  required:        { type: Boolean, default: true },
  acceptedFormats: [{ type: String }],
}, { _id: false })

const QueueSchema = new Schema<IQueue>({
  cycleId:          { type: Schema.Types.ObjectId, ref: "Cycle", required: true, index: true },
  name:             { type: String, required: [true, "Queue name is required"], trim: true },
  description:      { type: String, required: true },
  location:         { type: String, required: [true, "Queue location is required"] },
  deliverables:     [DeliverableSchema],
  maxUsers:         { type: Number, required: true, default: 20 },
  inProgressUsers:  [{ type: Schema.Types.ObjectId, ref: "User" }],
  waitingList:      [{ type: Schema.Types.ObjectId, ref: "User" }],
  order:            { type: Number, required: true },
  isActive:         { type: Boolean, default: true },
}, { timestamps: true })

QueueSchema.index({ cycleId: 1, order: 1 })
QueueSchema.index({ cycleId: 1, isActive: 1 })

export const Queue = (mongoose.models.Queue as Model<IQueue>) || model<IQueue>("Queue", QueueSchema)