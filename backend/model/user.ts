import {Document, Model,model, models, Schema} from "mongoose";
import bycrypt from 'bcryptjs'
import crypto from 'crypto'

export interface IUser extends Document{
  name : string,
  email : string
  password : string
  googleId: string
  avatar : {
    public_id : string,
    url : string
  },
  sessionId: string
  businessName?: string;
  businessAddress?: string;
  phoneNumber: string
  isVerified: boolean
  role : string
  createdAt : Date
  resetPasswordToken : string
  resetPasswordExpire : string
  comparePassword(enteredPassword : string) : Promise<boolean>
  getResetPasswordToken() : string
}

export interface IUserModel extends Model<IUser>{
  findUserByEmail(email : string) : Promise<IUser|null>
}

const userSchema : Schema<IUser> = new Schema({
  name : {
    type : String,
    required : [true, "Please enter user name"]
  },
  email : {
    type : String,
    required : [true, "Please enter user email"],
    unique : true,
    match : [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Please enter a valid email address"],
  },
  password : {
    type : String,
    // required : [true, "Please enter password"],
    minlength : [8, "your password must be longer than 8 characters"],
    select : false
  },
  phoneNumber: {
    type : String,
    unique : true,
  },
  businessName: {
    type : String,
    default: ""
  },
  businessAddress: {
    type: String,
    default: ""
  },
  googleId : {
    type : String,
    unique : true,
    sparse : true
  },
  avatar : {
    public_id : {
      type : String,
      default : "default_avatar"
    },
    url : {
      type : String,
      default : "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_640.png"
    }
  },
  sessionId : {
    type : String,
    default : "",
    unique : true
  },
  role : {
    type : String,
    default : 'user'
  },
  isVerified : {
    type : Boolean,
    default : false
  },
  createdAt : {
    type : Date,
    default : Date.now
  },
  resetPasswordExpire : String,
  resetPasswordToken : String
})

userSchema.pre("save", async function(next) {
  //we first check if the password has been modified 
  if(!this.isModified('password')){
    next()
  }

  this.password = await bycrypt.hash(this.password, 12)
})

//Compare user password
userSchema.methods.comparePassword = async function(enteredPassword : string) : Promise<boolean>{
  return await bycrypt.compare(enteredPassword, this.password)
}

//Generate reset password token
userSchema.methods.getResetPasswordToken = function() : string{
  //Generate the token
  const resetToken = crypto.randomBytes(20).toString('hex')
  //hash the token using the sha256 algorithm 
  this.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex')
  //set the token expire time to 15 mins
  this.resetPasswordExpire = Date.now() + 15 * 60 * 1000

  return resetToken
}

//use static method to find user by email
userSchema.statics.findUserByEmail = async function (email : string):Promise<IUser | null> {
  return await this.find({email}).select('-password')
}
userSchema.statics.findUserBySessionId = async function(sessionId : string):Promise<IUser | null> {
  return await this.find({sessionId}).select('-password')
}

export const User = (models.User as Model<IUser>) || model<IUser>('User', userSchema);