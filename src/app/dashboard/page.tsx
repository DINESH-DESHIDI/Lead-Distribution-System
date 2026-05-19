"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/toast";

interface Service {
  id: string;
  name: string;
}

interface Lead {
  id: string;
  customerName: string;
  phoneNumber: string;
  city: string;
  description: string;
  service: Service;
  createdAt: string;
}

interface LeadAssignment {
  id: string;
  leadId: string;
  assignedAt: string;
  lead: Lead;
}

interface Provider {
  id: string;
  name: string;
  monthlyQuota: number;
  remainingQuota: number;
  totalAssigned: number;
  createdAt: string;
  assignments: LeadAssignment[];
}

export default function Dashboard() {
  const { toast } = useToast();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<"connecting" | "live" | "polling">("connecting");

  // Fetch all providers from the database
  const fetchProviderData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const res = await fetch("/api/providers");
      if (!res.ok) throw new Error("Failed to load metrics");
      const data = await res.ok ? await res.json() : [];
      setProviders(data);
    } catch (err) {
      console.error(err);
      toast("Error synchronizing dashboard metrics from PostgreSQL.", "error");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Hook up SSE and fallback polling
  useEffect(() => {
    fetchProviderData();

    // 1. Establish Server-Sent Events Connection
    const eventSource = new EventSource("/api/realtime");

    eventSource.onopen = () => {
      console.log("[SSE] Connection established.");
      setConnectionStatus("live");
    };

    eventSource.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        if (parsed.type === "ping") return; // Heartbeat ignore

        console.log(`[SSE] Real-time event received: ${parsed.type}`);
        
        // Trigger dashboard re-sync
        fetchProviderData(true);
        
        if (parsed.type === "LEAD_ASSIGNED") {
          toast("New lead assigned! Dashboard updated in real-time.", "info");
        } else if (parsed.type === "QUOTAS_RESET") {
          toast("Provider remaining quotas reset to 10!", "info");
        }
      } catch (e) {
        console.error("[SSE] Failed to parse event stream payload:", e);
      }
    };

    eventSource.onerror = (err) => {
      console.error("[SSE] Stream disconnected. Switching to polling mode.", err);
      setConnectionStatus("polling");
      eventSource.close();
    };

    // 2. Client-Side Backup Polling (Every 3 seconds)
    // Ensures real-time responsiveness even on serverless deployments like Vercel
    const pollingInterval = setInterval(() => {
      fetchProviderData(true);
    }, 3000);

    return () => {
      eventSource.close();
      clearInterval(pollingInterval);
    };
  }, [fetchProviderData, toast]);

  // Summary Metrics calculations
  const totalLeadsAssigned = providers.reduce((acc, p) => acc + p.totalAssigned, 0) / 3; // divide by 3 because each lead gets assigned to 3 providers
  const activeProvidersCount = providers.filter((p) => p.remainingQuota > 0).length;

  return (
    <div className="space-y-8 py-2">
      {/* Dashboard Top Header & Status Metrics */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border/40 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            Real-Time Provider Dashboard
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${
                connectionStatus === "live"
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  : connectionStatus === "polling"
                  ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                  : "bg-neutral-800 text-neutral-400 animate-pulse"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  connectionStatus === "live"
                    ? "bg-emerald-500 animate-ping"
                    : connectionStatus === "polling"
                    ? "bg-amber-500 animate-pulse"
                    : "bg-neutral-500"
                }`}
              />
              {connectionStatus === "live" ? "SSE Stream Active" : connectionStatus === "polling" ? "Polling (3s Interval)" : "Syncing..."}
            </span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Visual metrics panel of all 8 allocated service providers synced instantly via PostgreSQL transactions.
          </p>
        </div>
      </div>

      {/* Aggregate Overview Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-neutral-950/20 border border-border/80 p-6 flex flex-col justify-between">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
            Total Unique Leads Allocated
          </span>
          <span className="text-3xl font-extrabold text-white mt-2">
            {loading ? "..." : Math.ceil(totalLeadsAssigned)}
          </span>
          <span className="text-xs text-muted-foreground/60 mt-1">
            Total assignment rows: {loading ? "..." : providers.reduce((acc, p) => acc + p.assignments.length, 0)}
          </span>
        </Card>

        <Card className="bg-neutral-950/20 border border-border/80 p-6 flex flex-col justify-between">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
            Active Provider Pools
          </span>
          <span className="text-3xl font-extrabold text-white mt-2">
            {loading ? "..." : `${activeProvidersCount} / 8`}
          </span>
          <span className="text-xs text-muted-foreground/60 mt-1">
            Providers with positive remaining quota
          </span>
        </Card>

        <Card className="bg-neutral-950/20 border border-border/80 p-6 flex flex-col justify-between">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
            Average Remaining Quota
          </span>
          <span className="text-3xl font-extrabold text-white mt-2">
            {loading
              ? "..."
              : (providers.reduce((acc, p) => acc + p.remainingQuota, 0) / 8).toFixed(1)}
          </span>
          <span className="text-xs text-muted-foreground/60 mt-1">
            Base allocation limit: 10 per provider
          </span>
        </Card>
      </div>

      {/* Providers Cards Grid */}
      {loading && providers.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-64 border border-border/40 rounded-xl bg-neutral-950/10 animate-pulse flex items-center justify-center text-xs text-muted-foreground">
              Loading Provider {i + 1} metadata...
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {providers.map((p) => {
            const consumedPercent = ((p.monthlyQuota - p.remainingQuota) / p.monthlyQuota) * 100;
            const remainingQuotaPercent = (p.remainingQuota / p.monthlyQuota) * 100;

            return (
              <Card key={p.id} className="border border-border/80 bg-neutral-950/40 flex flex-col overflow-hidden h-[420px]">
                {/* Provider Card Header */}
                <div className="p-5 border-b border-border/40 bg-neutral-950/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-base tracking-tight">{p.name}</span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                      p.remainingQuota > 5
                        ? "bg-emerald-500/10 text-emerald-400"
                        : p.remainingQuota > 2
                        ? "bg-amber-500/10 text-amber-400"
                        : "bg-rose-500/10 text-rose-400 animate-pulse"
                    }`}>
                      Quota: {p.remainingQuota} / {p.monthlyQuota}
                    </span>
                  </div>

                  {/* Quota Progress Fill */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Consumed Quota</span>
                      <span>{Math.round(consumedPercent)}%</span>
                    </div>
                    <Progress value={remainingQuotaPercent} />
                  </div>
                </div>

                {/* Assigned Leads Sublist */}
                <div className="flex-1 p-5 overflow-y-auto space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    <span>Leads Received ({p.assignments.length})</span>
                    <span>Total: {p.totalAssigned}</span>
                  </div>

                  {p.assignments.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center text-xs text-muted-foreground/50 border border-dashed border-border/40 rounded-lg p-4">
                      <svg className="h-6 w-6 text-muted-foreground/30 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0a2 2 0 01-2 2H6a2 2 0 01-2-2m16 0V9a2 2 0 00-2-2H6a2 2 0 00-2 2v2m16 4h-3.88l-.512 2H8.4l-.512-2H4" />
                      </svg>
                      No leads allocated yet
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {p.assignments.map((assignment) => {
                        const { lead } = assignment;
                        const date = new Date(assignment.assignedAt);
                        const timeStr = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });

                        return (
                          <div
                            key={assignment.id}
                            className="p-3 bg-muted/20 border border-border/60 hover:border-white/10 rounded-lg transition-all space-y-1.5"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-white text-xs truncate max-w-[100px]">
                                {lead.customerName}
                              </span>
                              <span className="text-[10px] text-muted-foreground/80 font-mono">
                                {timeStr}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                              <span className="bg-white/5 border border-white/10 rounded px-1.5 py-0.5 text-[10px] text-white/80">
                                {lead.service?.name || "Service"}
                              </span>
                              <span>{lead.city}</span>
                            </div>
                            <div className="text-[10px] font-mono text-muted-foreground/60 select-all border-t border-border/20 pt-1 flex justify-between">
                              <span>Phone:</span>
                              <span>{lead.phoneNumber.slice(0, 3)}***{lead.phoneNumber.slice(-4)}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
