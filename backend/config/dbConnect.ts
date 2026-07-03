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

async function dbConnect() {
  if (cached.conn) {
    return cached.conn;
  }

  let DB_URI = "";

  if (process.env.NODE_ENV === "development") {
    DB_URI = process.env.MONGODB_LOCAL_URI!;
  } else {
    DB_URI = process.env.MONGODB_URI!;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(DB_URI, {
      serverSelectionTimeoutMS: 10000,
    });
  }

  cached.conn = await cached.promise;

  return cached.conn;
}

mongoose.connection.on("connected", () => {
  console.log("Mongo connected");
});

mongoose.connection.on("error", (err) => {
  console.error("Mongo error:", err);
});

mongoose.connection.on("disconnected", () => {
  console.log("Mongo disconnected");
});

export default dbConnect;