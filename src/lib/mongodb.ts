import { MongoClient } from "mongodb";

const uri = process.env.DATABASE_URL || "mongodb://localhost:27017/prowider_db";

// Strip any Prisma query parameters (like ?relationMode=...) if they exist
const cleanUri = uri.split("?")[0];

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === "development") {
  // In development mode, use a global variable so the MongoClient is not
  // repeatedly created and connected during Next.js hot-reloading.
  const globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
  };

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(cleanUri);
    globalWithMongo._mongoClientPromise = client.connect();
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(cleanUri);
  clientPromise = client.connect();
}

export async function getDb() {
  const conn = await clientPromise;
  
  // Extract database name from the path, defaulting to prowider_db
  const urlParts = cleanUri.split("/");
  const dbName = urlParts[urlParts.length - 1] || "prowider_db";
  
  return conn.db(dbName);
}

export default clientPromise;
