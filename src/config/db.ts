import { MongoClient } from "mongodb";
// import dns from "node:dns";

// // Force Node.js to use public DNS servers
// dns.setServers(["8.8.8.8", "1.1.1.1"]);

const mongoURI = process.env.MONGO_URI;

if (!mongoURI) {
  throw new Error("MONGO_URI is not defined");
}

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

if (process.env.NODE_ENV === "development") {
  if (!global._mongoClientPromise) {
    client = new MongoClient(mongoURI);

    global._mongoClientPromise = client.connect();
  }

  clientPromise = global._mongoClientPromise;
} else {
  client = new MongoClient(mongoURI);

  clientPromise = client.connect();
}

export async function connectDb() {
  try {
    const mongoClient = await clientPromise;

    await mongoClient.db("admin").command({
      ping: 1,
    });

    console.log("MongoDB connected successfully");

    return mongoClient;
  } catch (error) {
    console.error("MongoDB connection failed:", error);

    throw error;
  }
}

export async function getClient() {
  return await clientPromise;
}
