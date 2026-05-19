import { MongoClient } from "mongodb";
import fs from "fs";
import path from "path";
import { allocateLead } from "./src/lib/allocation";

// 🛠️ Pure Native Node.js .env File Parser (Bypasses dependency on 'dotenv' library)
try {
  const envPath = path.resolve(process.cwd(), ".env");
  if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, "utf-8");
    envConfig.split(/\r?\n/).forEach((line) => {
      // Ignore comments and empty lines
      if (line.trim() && !line.startsWith("#")) {
        const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
        if (match) {
          const key = match[1];
          let value = match[2] || "";
          // Remove surrounding quotes if they exist
          if (value.startsWith('"') && value.endsWith('"')) {
            value = value.slice(1, -1);
          } else if (value.startsWith("'") && value.endsWith("'")) {
            value = value.slice(1, -1);
          }
          process.env[key] = value.trim();
        }
      }
    });
  }
} catch (e: any) {
  console.warn("⚠️  Unable to parse .env file natively:", e.message);
}

const uri = process.env.DATABASE_URL || "mongodb://localhost:27017/prowider_db";
const cleanUri = uri.split("?")[0];

async function resetDatabase() {
  console.log("==================================================");
  console.log("♻️  RESETTING DATABASE FOR FAIRNESS VERIFICATION...");
  console.log("==================================================");

  const client = new MongoClient(cleanUri);
  try {
    await client.connect();
    
    const urlParts = cleanUri.split("/");
    const dbName = urlParts[urlParts.length - 1] || "prowider_db";
    const db = client.db(dbName);

    // 1. Clear existing leads and assignments to start fresh
    await Promise.all([
      db.collection("LeadAssignment").deleteMany({}),
      db.collection("Lead").deleteMany({}),
      db.collection("WebhookEvent").deleteMany({}),
    ]);

    // 2. Reset all provider quotas to 10 and assignment counts to 0
    await db.collection("Provider").updateMany({}, {
      $set: {
        remainingQuota: 10,
        totalAssigned: 0,
      },
    });

    // 3. Reset all AllocationState indexes to 0
    await db.collection("AllocationState").updateMany({}, {
      $set: {
        currentIndex: 0,
        updatedAt: new Date(),
      },
    });

    console.log("✅ Database reset complete!");
  } catch (error: any) {
    console.error("❌ Resetting failed:", error);
    throw error;
  } finally {
    await client.close();
  }
}

async function runFairnessTest() {
  try {
    await resetDatabase();
  } catch (e) {
    console.error("❌ Aborting test due to database reset failure.");
    process.exit(1);
  }

  console.log("\n==================================================");
  console.log("🚀 STARTING FAIRNESS & SEQUENTIAL TRACE TESTS...");
  console.log("==================================================");

  // Submit 4 consecutive leads for Service 1
  // Service 1 pool: Provider 2, Provider 3, Provider 4
  // Service 1 mandatory: Provider 1
  const serviceId = "srv-1";
  
  for (let i = 0; i < 4; i++) {
    console.log(`\n👉 Submitting Lead #${i + 1} for Service 1...`);
    try {
      const result = await allocateLead({
        customerName: `Test Lead ${i + 1}`,
        phoneNumber: `999000111${i}`, // Unique numbers to bypass unique index blocks
        city: "San Francisco",
        description: "Programmatic trace lead",
        serviceId,
      });

      console.log(`✅ Success! Lead #${i + 1} created.`);
      console.log(`   Assigned to Providers: [${result.assignedProviders.join(", ")}]`);
    } catch (e: any) {
      console.error(`❌ Lead allocation failed:`, e.message);
    }
  }

  // Print final allocations summary
  console.log("\n==================================================");
  console.log("📊 FINAL ALLOCATION METRICS & INTEGRITY REPORT");
  console.log("==================================================");

  const client = new MongoClient(cleanUri);
  try {
    await client.connect();
    
    const urlParts = cleanUri.split("/");
    const dbName = urlParts[urlParts.length - 1] || "prowider_db";
    const db = client.db(dbName);

    const providers = await db
      .collection("Provider")
      .find()
      .sort({ _id: 1 })
      .toArray();
      
    console.log("Final Provider Quotas Status (Service 1 Pool):");
    console.table(
      providers.map((p) => ({
        ID: p._id,
        Name: p.name,
        "Total Assigned": p.totalAssigned,
        "Remaining Quota": p.remainingQuota,
      }))
    );

    const state = await db.collection("AllocationState").findOne({ serviceId });
    console.log(`\nAllocation Tracker Index for Service 1: ${state?.currentIndex}`);
    console.log("--------------------------------------------------");
    console.log("🌟 Rotation trace expected: Provider 2, 3 -> Provider 4, 2 -> Provider 3, 4 -> Provider 2, 3");
    console.log("🌟 Checking metrics: Provider 1 (mandatory) should have 4 assignments.");
    console.log("🌟 Candidates Provider 2, 3, 4 should have 3, 3, 2 assignments respectively.");
    console.log("==================================================");
  } catch (error) {
    console.error("Failed to print report:", error);
  } finally {
    await client.close();
  }
}

runFairnessTest();
