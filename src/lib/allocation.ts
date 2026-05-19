import { getDb } from "./mongodb";
import { addLog } from "./logger";
import { notifyClients } from "./sse";
import { acquireLock } from "./locks";
import { ObjectId } from "mongodb";

export interface LeadInput {
  customerName: string;
  phoneNumber: string;
  city: string;
  description: string;
  serviceId: string;
}

export async function allocateLead(input: LeadInput) {
  const { customerName, phoneNumber, city, description, serviceId } = input;
  const timeStart = Date.now();

  // Wrap inside in-memory lock per serviceId to serialize index updates in Node.
  return await acquireLock(serviceId, async () => {
    addLog(`[START] Thread allocation initialized for Customer: ${customerName} (Service: ${serviceId})`);
    
    const db = await getDb();

    // 1. Enforce unique index (phoneNumber + serviceId)
    // Query manually or let insertOne throw. We query first for clear logging.
    const duplicate = await db.collection("Lead").findOne({ phoneNumber, serviceId });
    if (duplicate) {
      addLog(`[DUPLICATE REJECT] Phone number: ${phoneNumber} already registered for Service: ${serviceId}. Request rejected.`);
      const prismaError = new Error("Unique constraint failed on the fields: (`phoneNumber`,`serviceId`)") as any;
      prismaError.code = "P2002";
      prismaError.name = "PrismaClientKnownRequestError";
      throw prismaError;
    }

    // 2. Insert Lead record using native MongoDB insertOne (transactionless!)
    const leadResult = await db.collection("Lead").insertOne({
      customerName,
      phoneNumber,
      city,
      description,
      serviceId,
      createdAt: new Date(),
    });
    
    const leadId = leadResult.insertedId.toString();
    addLog(`[LEAD CREATED] Lead created successfully with ID: ${leadId}`);

    // 3. Retrieve service structure
    const service = await db.collection("Service").findOne({ _id: serviceId });
    if (!service) {
      throw new Error(`Service with ID ${serviceId} not found.`);
    }

    // 4. Define mandatory and pool providers based on service rules
    let mandatoryIds: string[] = [];
    let poolIds: string[] = [];

    if (serviceId === "srv-1") {
      mandatoryIds = ["prov-1"];
      poolIds = ["prov-2", "prov-3", "prov-4"];
    } else if (serviceId === "srv-2") {
      mandatoryIds = ["prov-5"];
      poolIds = ["prov-6", "prov-7", "prov-8"];
    } else if (serviceId === "srv-3") {
      mandatoryIds = ["prov-1", "prov-4"];
      poolIds = ["prov-2", "prov-3", "prov-5", "prov-6", "prov-7", "prov-8"];
    } else {
      throw new Error(`Unknown service classification: ${serviceId}`);
    }

    const assignedProviderIds: string[] = [];

    // 5. Assign mandatory providers atomically using findOneAndUpdate
    for (const pId of mandatoryIds) {
      const result = await db.collection("Provider").findOneAndUpdate(
        { _id: pId, remainingQuota: { $gt: 0 } },
        { $inc: { remainingQuota: -1, totalAssigned: 1 } },
        { returnDocument: "after" }
      );

      const updatedDoc = (result as any).value || result;

      if (updatedDoc) {
        assignedProviderIds.push(pId);
        addLog(`[MANDATORY] Assigned Provider: ${updatedDoc.name} (Quota left: ${updatedDoc.remainingQuota}/10)`);
      } else {
        addLog(`[MANDATORY SKIP] Provider ${pId} has no quota or is unavailable. Skipping.`);
      }
    }

    // 6. Check if we need more pool providers to reach exactly 3 allocations
    let slotsNeeded = 3 - assignedProviderIds.length;

    if (slotsNeeded > 0 && poolIds.length > 0) {
      const state = await db.collection("AllocationState").findOne({ serviceId });
      if (!state) {
        throw new Error(`AllocationState tracker not found for service: ${serviceId}`);
      }

      let currentPoolIndex = state.currentIndex || 0;
      const poolLength = poolIds.length;
      let checkedCount = 0;

      addLog(`[POOL SCAN] Start pool scan at index: ${currentPoolIndex} (Candidates: ${poolIds.join(", ")})`);

      while (slotsNeeded > 0 && checkedCount < poolLength) {
        const candidateId = poolIds[currentPoolIndex];

        if (!assignedProviderIds.includes(candidateId)) {
          const result = await db.collection("Provider").findOneAndUpdate(
            { _id: candidateId, remainingQuota: { $gt: 0 } },
            { $inc: { remainingQuota: -1, totalAssigned: 1 } },
            { returnDocument: "after" }
          );

          const updatedDoc = (result as any).value || result;

          if (updatedDoc) {
            assignedProviderIds.push(candidateId);
            slotsNeeded--;
            addLog(`[POOL ASSIGN] Assigned Pool Provider: ${updatedDoc.name} (Quota left: ${updatedDoc.remainingQuota}/10)`);
          } else {
            addLog(`[POOL SKIP] Provider ${candidateId} skipped (quota exhausted)`);
          }
        } else {
          addLog(`[POOL SKIP] Provider ${candidateId} already assigned as mandatory.`);
        }

        currentPoolIndex = (currentPoolIndex + 1) % poolLength;
        checkedCount++;
      }

      // Update round-robin index pointer
      await db.collection("AllocationState").updateOne(
        { serviceId },
        { $set: { currentIndex: currentPoolIndex, updatedAt: new Date() } }
      );
      addLog(`[POOL STATE] Advanced rotation index to: ${currentPoolIndex}`);
    }

    // 7. Record assignment links
    if (assignedProviderIds.length > 0) {
      const assignments = assignedProviderIds.map((pId) => ({
        leadId: new ObjectId(leadId),
        providerId: pId,
        assignedAt: new Date(),
      }));
      
      await db.collection("LeadAssignment").insertMany(assignments);
      addLog(`[COMMIT] Assignment rows linked successfully for Lead: ${leadId}`);
    }

    const elapsed = Date.now() - timeStart;
    addLog(`[COMMIT] Lead successfully allocated in ${elapsed}ms. Providers: ${assignedProviderIds.join(", ")}`);

    // Fetch assigned provider names
    const assignedProviders = await db
      .collection("Provider")
      .find({ _id: { $in: assignedProviderIds } })
      .toArray();

    const assignedProviderNames = assignedProviders.map((p) => p.name);

    // Emit live real-time server-sent notification
    notifyClients({
      type: "LEAD_ASSIGNED",
      leadId,
      assignedProviders: assignedProviderNames,
    });

    return {
      message: "Lead created and successfully allocated.",
      leadId,
      assignedProviders: assignedProviderNames,
    };
  });
}
