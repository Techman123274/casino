import { MongoClient, type MongoClientOptions } from "mongodb";

if (!process.env.MONGODB_URI) {
  throw new Error(
    "\x1b[31m[RAPID ROLE :: FATAL]\x1b[0m MONGODB_URI is not defined in environment variables"
  );
}

const uri = process.env.MONGODB_URI;
const options: MongoClientOptions = {};

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

function createClientPromise(): Promise<MongoClient> {
  const client = new MongoClient(uri, options);
  return client.connect().catch((err) => {
    console.error(
      "\x1b[31m[RAPID ROLE :: FATAL]\x1b[0m MongoDB client failed to connect:",
      err.message
    );
    throw err;
  });
}

/**
 * Singleton MongoDB client: one connection per Node process in all environments.
 * Prevents "zombie" connections under high traffic (no new client per request).
 */
function getClientPromise(): Promise<MongoClient> {
  if (!global._mongoClientPromise) {
    global._mongoClientPromise = createClientPromise();
    if (process.env.NODE_ENV === "development") {
      console.log(
        "\x1b[32m[RAPID ROLE :: SYSTEM]\x1b[0m MongoDB client initialized (singleton)"
      );
    }
  }
  return global._mongoClientPromise;
}

const clientPromise = getClientPromise();
export default clientPromise;
