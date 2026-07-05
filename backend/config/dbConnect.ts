import "dotenv/config";
import mongoose from "mongoose";

declare global {
  var mongooseCache:
    | {
        conn: typeof mongoose | null;
        promise: Promise<typeof mongoose> | null;
      }
    | undefined;
}

const cached = global.mongooseCache ?? {
  conn: null,
  promise: null,
};

global.mongooseCache = cached;

mongoose.set("bufferCommands", false);

async function dbConnect() {
  if (cached.conn?.connection?.readyState === 1) {
    return cached.conn;
  }

  if (!cached.promise) {
    const DB_URI =
      process.env.NODE_ENV === "development"
        ? process.env.MONGODB_LOCAL_URI!
        : process.env.MONGODB_URI!;

    cached.promise = mongoose
      .connect(DB_URI, {
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 45000,
      })
      .catch((err) => {
        cached.promise = null;
        throw err;
      });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

export default dbConnect;