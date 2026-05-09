import mongoose from "mongoose";

const dbConnect = async() => {
  if(mongoose.connection.readyState >=1){
    return
  }

  let DB_URI : string = ""

  if(process.env.NODE_ENV === "development") DB_URI = process.env.MONGODB_LOCAL_URI!
  if(process.env.NODE_ENV === "production") DB_URI = process.env.MONGODB_URI!

  await mongoose.connect(DB_URI).then((con) => console.log('DB connected')).
  catch((error) => console.log("DB failed to connect"))
}

export default dbConnect