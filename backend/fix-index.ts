import mongoose from "mongoose"
import dbConnect from "./config/dbConnect"

async function fix() {
  await dbConnect()
  await mongoose.connection.collection("users").dropIndex("phoneNumber_1")
  console.log("Index dropped")
  process.exit(0)
}

fix()