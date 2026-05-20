import mongoose from "mongoose";

const dbConnect = async() => {
  if(mongoose.connection.readyState >= 1){
    return
  }

  let DB_URI : string = ""

  if(process.env.NODE_ENV === "development") DB_URI = process.env.MONGODB_LOCAL_URI!
  if(process.env.NODE_ENV === "production") DB_URI = process.env.MONGODB_URI!

  try {
    await mongoose.connect(DB_URI)
    console.log('DB connected')
  } catch (error) {
    console.error("DB failed to connect:", error)
    throw error
  }
}

export default dbConnect