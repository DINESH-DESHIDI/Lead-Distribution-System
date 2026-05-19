import { MongoClient } from "mongodb";

const uri = process.env.DATABASE_URL || "mongodb://localhost:27017/prowider_db";
const cleanUri = uri.split("?")[0];

async function main() {
  console.log("🌱 Starting native MongoDB database seeding...");
  
  const client = new MongoClient(cleanUri);
  
  try {
    await client.connect();
    
    const urlParts = cleanUri.split("/");
    const dbName = urlParts[urlParts.length - 1] || "prowider_db";
    const db = client.db(dbName);

    console.log(`📡 Connected successfully to MongoDB database: "${dbName}"`);

    // 1. Clear all existing collections to start completely fresh
    console.log("🧹 Cleaning up old collections...");
    await Promise.all([
      db.collection("Service").deleteMany({}),
      db.collection("Provider").deleteMany({}),
      db.collection("Lead").deleteMany({}),
      db.collection("LeadAssignment").deleteMany({}),
      db.collection("AllocationState").deleteMany({}),
      db.collection("WebhookEvent").deleteMany({}),
    ]);
    console.log("✅ Cleanup complete.");

    // 2. Seed Services (Cast as any to bypass strict ObjectId type validation in TypeScript)
    const services = [
      { _id: "srv-1", name: "Service 1", createdAt: new Date() },
      { _id: "srv-2", name: "Service 2", createdAt: new Date() },
      { _id: "srv-3", name: "Service 3", createdAt: new Date() },
    ];
    await db.collection("Service").insertMany(services as any);
    console.log("✅ Services seeded successfully.");

    // 3. Seed Providers (Provider 1 to 8, cast as any to bypass strict ObjectId validation)
    const providers = Array.from({ length: 8 }, (_, i) => ({
      _id: `prov-${i + 1}`,
      name: `Provider ${i + 1}`,
      monthlyQuota: 10,
      remainingQuota: 10,
      totalAssigned: 0,
      createdAt: new Date(),
    }));
    await db.collection("Provider").insertMany(providers as any);
    console.log("✅ Providers seeded successfully.");

    // 4. Seed AllocationState trackers (initial index = 0, cast as any to bypass strict ObjectId validation)
    const allocationStates = services.map((s) => ({
      serviceId: s._id,
      currentIndex: 0,
      updatedAt: new Date(),
    }));
    await db.collection("AllocationState").insertMany(allocationStates as any);
    console.log("✅ Allocation states seeded successfully.");

    console.log("🎉 Database native seeding completed successfully!");
  } catch (error: any) {
    console.error("❌ Seeding failed with database error:", error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

main();
