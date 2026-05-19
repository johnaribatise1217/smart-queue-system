import { Document, Model, model, models, Schema, Types } from "mongoose";

export type CycleStatus = "waiting" | "inprogress" | "completed"

export interface IQueueHistory extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  cycleId: Types.ObjectId;
  currentQueueId: Types.ObjectId | null;  // which queue step they are currently at
  position: number;                        // position in the current queue
  cycleStatus: CycleStatus;
  isOnWaitingList: boolean;               // waiting for cycle slot
  completedQueues: Types.ObjectId[];      // queue steps they have finished
  joinedAt: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const QueueHistorySchema = new Schema<IQueueHistory>({
  userId:          { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  cycleId:         { type: Schema.Types.ObjectId, ref: "Cycle", required: true, index: true },
  currentQueueId:  { type: Schema.Types.ObjectId, ref: "Queue", default: null },
  position:        { type: Number, default: 0 },
  cycleStatus:     {
    type: String,
    enum: ["waiting", "inprogress", "completed"],
    default: "waiting",
  },
  isOnWaitingList:   { type: Boolean, default: false },
  completedQueues:   [{ type: Schema.Types.ObjectId, ref: "Queue" }],
  joinedAt:          { type: Date, default: Date.now },
  completedAt:       { type: Date },
}, { timestamps: true })

QueueHistorySchema.index({ userId: 1, cycleId: 1 }, { unique: true })
QueueHistorySchema.index({ cycleId: 1, cycleStatus: 1 })
QueueHistorySchema.index({ userId: 1, cycleStatus: 1 })

export const QueueHistory = (models.QueueHistory as Model<IQueueHistory>) || model<IQueueHistory>("QueueHistory", QueueHistorySchema)