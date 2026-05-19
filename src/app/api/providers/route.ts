import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = await getDb();

    // Query collections in parallel using highly efficient native driver calls
    const [providers, assignments, leads, services] = await Promise.all([
      db.collection("Provider").find().sort({ _id: 1 }).toArray(),
      db.collection("LeadAssignment").find().toArray(),
      db.collection("Lead").find().toArray(),
      db.collection("Service").find().toArray(),
    ]);

    // Create rapid O(1) hash maps for relations
    const serviceMap = new Map(services.map((s) => [s._id, s]));
    const leadMap = new Map(
      leads.map((l) => [
        l._id.toString(),
        {
          id: l._id.toString(),
          customerName: l.customerName,
          phoneNumber: l.phoneNumber,
          city: l.city,
          description: l.description,
          serviceId: l.serviceId,
          createdAt: l.createdAt,
          service: serviceMap.get(l.serviceId)
            ? {
                id: serviceMap.get(l.serviceId)!._id,
                name: serviceMap.get(l.serviceId)!.name,
                createdAt: serviceMap.get(l.serviceId)!.createdAt,
              }
            : null,
        },
      ])
    );

    // Map lead records into assignments and sort descending by time
    const assignmentsWithLeads = assignments
      .map((a) => ({
        id: a._id.toString(),
        leadId: a.leadId.toString(),
        providerId: a.providerId,
        assignedAt: a.assignedAt,
        lead: leadMap.get(a.leadId.toString()) || null,
      }))
      .sort(
        (a, b) =>
          new Date(b.assignedAt).getTime() - new Date(a.assignedAt).getTime()
      );

    // Group mapped assignments under their respective providers
    const result = providers.map((p) => ({
      id: p._id,
      name: p.name,
      monthlyQuota: p.monthlyQuota,
      remainingQuota: p.remainingQuota,
      totalAssigned: p.totalAssigned,
      createdAt: p.createdAt,
      assignments: assignmentsWithLeads.filter((a) => a.providerId === p._id),
    }));

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Failed to fetch providers:", error);
    return NextResponse.json(
      { error: "Failed to load provider metrics from database." },
      { status: 500 }
    );
  }
}
