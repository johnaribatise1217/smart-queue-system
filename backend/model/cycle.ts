import { Document, Model, model, models, Schema, Types } from "mongoose";

export interface IScheduleDay {
  day: "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday";
  startTime: string;
  endTime: string; 
  isActive: boolean;
}

export interface ICycle extends Document {
  _id: Types.ObjectId;
  name: string;
  description: string
  adminId: Types.ObjectId;        // who created this cycle
  queues: Types.ObjectId[];       // ordered queue steps
  schedule: IScheduleDay[];       // available days + time windows
  maxUsers: number;               // max users allowed per cycle
  enrolledUsers: Types.ObjectId[]; // users who have joined
  waitingList: Types.ObjectId[];  // overflow users
  isActive: boolean;              // admin can open/close cycle
  createdAt: Date;
  updatedAt: Date;
}

const ScheduleDaySchema = new Schema<IScheduleDay>({
  day: {
    type: String,
    enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
    required: true,
  },
  startTime: { type: String, required: true },
  endTime:   { type: String, required: true },
  isActive:  { type: Boolean, default: true },
}, { _id: false })

const CycleSchema = new Schema<ICycle>({
  name:        { type: String, required: [true, "Cycle name is required"], trim: true },
  description: { type: String, required: [true, "Cycle description is required"] },
  adminId:     { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  queues:      [{ type: Schema.Types.ObjectId, ref: "Queue" }],
  schedule:    [ScheduleDaySchema],
  maxUsers:    { type: Number, required: true, default: 100 },
  enrolledUsers: [{ type: Schema.Types.ObjectId, ref: "User" }],
  waitingList:   [{ type: Schema.Types.ObjectId, ref: "User" }],
  isActive:    { type: Boolean, default: false },
}, { timestamps: true })

CycleSchema.index({ adminId: 1, isActive: 1 })
CycleSchema.index({ isActive: 1, "schedule.day": 1 })

export const Cycle = (models.Cycle as Model<ICycle>) || model<ICycle>("Cycle", CycleSchema)