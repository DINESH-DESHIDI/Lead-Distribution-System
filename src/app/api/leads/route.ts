import { NextResponse } from "next/server";
import { allocateLead } from "@/lib/allocation";
import { notifyClients } from "@/lib/sse";
import { Prisma } from "@prisma/client";
import { addLog } from "@/lib/logger";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { customerName, phoneNumber, city, description, serviceId } = body;

    // 1. Basic validation
    if (!customerName || !phoneNumber || !city || !serviceId) {
      return NextResponse.json(
        { error: "Missing required fields: customerName, phoneNumber, city, and serviceId are mandatory." },
        { status: 400 }
      );
    }

    // Standardize phone number formatting (digits only, e.g., 9999999999)
    const cleanPhone = phoneNumber.replace(/\D/g, "");
    if (cleanPhone.length < 7 || cleanPhone.length > 15) {
      return NextResponse.json(
        { error: "Invalid phone number format. Must be between 7 and 15 digits." },
        { status: 400 }
      );
    }

    // 2. Perform transactional lead allocation
    const result = await allocateLead({
      customerName: customerName.trim(),
      phoneNumber: cleanPhone,
      city: city.trim(),
      description: (description || "").trim(),
      serviceId,
    });

    // 3. Emit real-time notification
    notifyClients({
      type: "LEAD_ASSIGNED",
      data: result,
    });

    return NextResponse.json(
      {
        message: "Lead created and successfully allocated.",
        leadId: result.leadId,
        assignedProviders: result.assignedProviders,
      },
      { status: 201 }
    );
  } catch (error: any) {
    // 4. Handle DB Level Unique Constraint Duplication Exception
    if (
      error.code === "P2002" ||
      (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002")
    ) {
      addLog(`[DUPLICATE REJECT] Blocked duplicate lead for phoneNumber + serviceId`);
      return NextResponse.json(
        {
          error: "Duplicate submission. Same phone number cannot create another lead for the SAME service.",
          code: "DUPLICATE_LEAD",
        },
        { status: 409 }
      );
    }

    console.error("Lead creation failed:", error);
    addLog(`[ERROR] Allocation failed: ${error.message || error}`);
    return NextResponse.json(
      { error: error.message || "An unexpected error occurred during lead allocation." },
      { status: 500 }
    );
  }
}
