import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = await getDb();
    
    // 1. Fetch collection names in the active database
    const collectionsInfo = await db.listCollections().toArray();
    const collectionNames = collectionsInfo.map((c) => c.name);

    // 2. Fetch document counts per collection (with safe fallbacks if collections don't exist yet)
    const [servicesCount, providersCount, leadsCount, assignmentsCount] = await Promise.all([
      db.collection("Service").countDocuments().catch(() => 0),
      db.collection("Provider").countDocuments().catch(() => 0),
      db.collection("Lead").countDocuments().catch(() => 0),
      db.collection("LeadAssignment").countDocuments().catch(() => 0),
    ]);

    // 3. Retrieve service list to verify contents and primary key structures
    const rawServices = await db.collection("Service").find().toArray();

    return NextResponse.json({
      success: true,
      activeDatabaseName: db.databaseName,
      availableCollections: collectionNames,
      documentCounts: {
        Service: servicesCount,
        Provider: providersCount,
        Lead: leadsCount,
        LeadAssignment: assignmentsCount,
      },
      rawServices,
    });
  } catch (error: any) {
    console.error("Database diagnostic failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || error,
        stack: error.stack,
      },
      { status: 500 }
    );
  }
}
