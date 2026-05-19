import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { addLog } from "@/lib/logger";
import { notifyClients } from "@/lib/sse";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { eventId } = body;

    if (!eventId) {
      return NextResponse.json({ error: "Missing required eventId parameter" }, { status: 400 });
    }

    addLog(`[WEBHOOK RECEIVED] Processing quota-reset event: "${eventId}"`);

    const db = await getDb();

    // 1. Enforce Webhook Idempotency by inserting into WebhookEvent collection.
    // Unique constraints in MongoDB will block duplicates by throwing a 11000 exception.
    try {
      // First, check manually to ensure robust standalone reporting
      const existing = await db.collection("WebhookEvent").findOne({ eventId });
      if (existing) {
        addLog(`[WEBHOOK IDEMPOTENT] Event "${eventId}" has already been processed. Skipping quota reset.`);
        return NextResponse.json({
          message: "Webhook event was already processed. Skipped.",
          processed: false,
        });
      }

      await db.collection("WebhookEvent").insertOne({
        eventId,
        processedAt: new Date(),
      });
      
      addLog(`[WEBHOOK OK] Event "${eventId}" registered successfully.`);
    } catch (dbError: any) {
      if (dbError.code === 11000 || dbError.message?.includes("duplicate")) {
        addLog(`[WEBHOOK IDEMPOTENT] Event "${eventId}" has already been processed. Skipping quota reset.`);
        return NextResponse.json({
          message: "Webhook event was already processed. Skipped.",
          processed: false,
        });
      }
      throw dbError;
    }

    // 2. Perform the quota reset operation for all providers
    await db.collection("Provider").updateMany({}, {
      $set: { remainingQuota: 10 }
    });

    addLog(`[WEBHOOK RESET] All provider remaining quotas reset back to 10.`);

    // 3. Notify real-time clients
    notifyClients({
      type: "QUOTAS_RESET",
      message: "Quotas successfully reset to 10 via idempotent webhook",
    });

    return NextResponse.json({
      message: "All provider remaining quotas successfully reset to 10.",
      processed: true,
    });
  } catch (error: any) {
    console.error("Webhook processing error:", error);
    addLog(`[WEBHOOK ERROR] Failed to process event: ${error.message}`);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
