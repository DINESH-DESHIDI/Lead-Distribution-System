import { NextResponse } from "next/server";
import { allocateLead } from "@/lib/allocation";
import { Prisma } from "@prisma/client";
import { notifyClients } from "@/lib/sse";
import { addLog } from "@/lib/logger";

export async function POST() {
  addLog("[TEST SYSTEM] Initiating duplicate-lead prevention verification test...");

  // Generate a random phone number to start fresh
  const duplicatePhone = `777${String(Date.now()).slice(-7)}`;
  const serviceId = "srv-1";

  const leadPayload = {
    customerName: "Duplicate Test Customer",
    phoneNumber: duplicatePhone,
    city: "San Francisco",
    description: "Testing composite unique constraint",
    serviceId,
  };

  try {
    // 1. Submit First Lead (Should Succeed)
    addLog(`[TEST SYSTEM] Submitting first lead for service '${serviceId}' with phone: ${duplicatePhone}`);
    const firstResult = await allocateLead(leadPayload);
    addLog(`[TEST SYSTEM] First lead created successfully. ID: ${firstResult.leadId}`);

    // Notify clients of the first lead creation
    notifyClients({ type: "LEAD_ASSIGNED" });

    // 2. Submit Second Lead (Should Fail on Unique Constraint)
    addLog(`[TEST SYSTEM] Submitting identical second lead for service '${serviceId}' with phone: ${duplicatePhone}`);
    let secondResultError: string | null = null;
    let duplicateBlocked = false;

    try {
      await allocateLead(leadPayload);
    } catch (error: any) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        duplicateBlocked = true;
        secondResultError = "Blocked by composite UNIQUE constraint: (phoneNumber, serviceId)";
        addLog(`[TEST SYSTEM SUCCESS] Second lead blocked successfully by composite UNIQUE constraint!`);
      } else {
        secondResultError = error.message || "Failed with unexpected error";
        addLog(`[TEST SYSTEM ERROR] Second lead failed with unexpected error: ${secondResultError}`);
      }
    }

    return NextResponse.json({
      phoneTested: duplicatePhone,
      serviceTested: serviceId,
      firstLead: {
        status: "SUCCESS",
        leadId: firstResult.leadId,
        assignedProviders: firstResult.assignedProviders,
      },
      secondLead: {
        status: duplicateBlocked ? "BLOCKED_AS_EXPECTED" : "FAILED_TO_BLOCK",
        feedback: secondResultError,
      },
    });
  } catch (error: any) {
    console.error("Duplicate test failed:", error);
    return NextResponse.json(
      { error: "Duplicate lead test suite failed.", details: error.message || error },
      { status: 500 }
    );
  }
}
