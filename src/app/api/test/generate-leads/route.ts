import { NextResponse } from "next/server";
import { allocateLead } from "@/lib/allocation";
import { notifyClients } from "@/lib/sse";
import { addLog } from "@/lib/logger";

export async function POST() {
  addLog("[TEST SYSTEM] Initiating concurrency stress-test: Generating 10 leads simultaneously...");

  const firstNames = ["Oliver", "Emma", "Liam", "Ava", "Noah", "Sophia", "Lucas", "Isabella", "Ethan", "Mia"];
  const lastNames = ["Smith", "Jones", "Brown", "Taylor", "Miller", "Davis", "Wilson", "Anderson", "Thomas", "White"];
  const cities = ["Dallas", "Seattle", "Austin", "Denver", "Miami", "Boston", "Chicago", "Phoenix"];
  const services = ["srv-1", "srv-2", "srv-3"];

  // Prepare 10 concurrent lead generation promises
  const leadPromises = Array.from({ length: 10 }, (_, index) => {
    const customerName = `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${
      lastNames[Math.floor(Math.random() * lastNames.length)]
    }`;
    const city = cities[Math.floor(Math.random() * cities.length)];
    const serviceId = services[Math.floor(Math.random() * services.length)];
    
    // We generate a unique phone number format so we don't trigger the duplicate prevention constraint,
    // ensuring we are specifically stress testing database concurrency and lock performance.
    const phoneNumber = `555${String(Date.now()).slice(-6)}${index}`;

    return allocateLead({
      customerName,
      phoneNumber,
      city,
      description: `High-concurrency load testing lead #${index + 1}`,
      serviceId,
    });
  });

  try {
    // Fire all 10 requests concurrently
    const results = await Promise.all(leadPromises);
    addLog(`[TEST SYSTEM] Successfully completed concurrent execution. All 10 leads created & allocated.`);

    // Push refresh trigger to dashboard
    notifyClients({
      type: "LEAD_ASSIGNED",
      data: results,
    });

    return NextResponse.json({
      message: "Successfully generated 10 concurrent leads.",
      results: results.map((r) => ({
        leadId: r.leadId,
        assignedProviders: r.assignedProviders,
      })),
    });
  } catch (error: any) {
    console.error("Concurrency test execution failed:", error);
    addLog(`[TEST SYSTEM ERROR] Concurrency generation failed: ${error.message || error}`);
    return NextResponse.json(
      { error: "Concurrency simulation failed.", details: error.message || error },
      { status: 500 }
    );
  }
}
