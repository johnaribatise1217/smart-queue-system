import {Document, Model,model, models, Schema} from "mongoose";

export interface IOTP extends Document{
  email : string
  code : string
  expireAt : Date
  createdAt : Date
}

export interface IOTPModel extends Model<IOTP>{
  findOTPByEmail(email : string) : Promise<IOTP|null>
}

const otpSchema : Schema<IOTP> = new Schema({
  email : {
    type : String,
    required : [true, "Please enter user email"],
    unique : true,
    match : [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Please enter a valid email address"],
  },
  code : {
    type : String,
    required : [true, "OTP is required"],
    length : 6
  },
  expireAt : {
    type : Date,
    default : Date.now,
  },
  createdAt : {
    type : Date,
    default : Date.now,
    expires: 300 // OTP expires after 5 minutes
  }
})

export const OTP = (models.OTP as Model<IOTP>) || model<IOTP>("OTP", otpSchema)