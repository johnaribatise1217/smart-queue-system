import mongoose, { Document, Model, model, Schema, Types } from "mongoose";

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
  cycleCode: string;              // unique code for users to join
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
  cycleCode: {
    type: String,
    unique: true,
    index: true,
    default: ""
  },
}, { timestamps: true })

CycleSchema.index({ adminId: 1, isActive: 1 })
CycleSchema.index({ isActive: 1, "schedule.day": 1 })

const generateCycleCode = async (model: any): Promise<string> => {
  const chars = "0123456789"
  let code: string
  let exists: boolean

  do {
    const suffix = Array.from({ length: 4 }, () =>
      chars[Math.floor(Math.random() * chars.length)]
    ).join("")
    code = `SMQ${suffix}`
    exists = !!(await model.findOne({ cycleCode: code }))
  } while (exists)

  return code
}

CycleSchema.pre("save", async function (next) {
  if (!this.cycleCode) {
    this.cycleCode = await generateCycleCode(this.constructor)
  }
  next()
})

export const Cycle = (mongoose.models.Cycle as Model<ICycle>) || model<ICycle>("Cycle", CycleSchema)
