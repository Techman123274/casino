import mongoose from "mongoose";

if (!process.env.MONGODB_URI) {
  throw new Error(
    "\x1b[31m[RAPID ROLE :: FATAL]\x1b[0m MONGODB_URI is not defined in environment variables"
  );
}

const MONGODB_URI = process.env.MONGODB_URI;

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var _mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global._mongooseCache ?? {
  conn: null,
  promise: null,
};

if (!global._mongooseCache) {
  global._mongooseCache = cached;
}

export async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGODB_URI, { dbName: "RapidRole" })
      .then((m) => {
        console.log(
          "\x1b[32m[RAPID ROLE :: SYSTEM]\x1b[0m Mongoose connected to RapidRole DB"
        );
        return m;
      })
      .catch((err) => {
        console.error(
          "\x1b[31m[RAPID ROLE :: FATAL]\x1b[0m Mongoose connection failed:",
          err.message
        );
        cached.promise = null;
        throw err;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    cached.promise = null;
    throw err;
  }

  return cached.conn;
}
