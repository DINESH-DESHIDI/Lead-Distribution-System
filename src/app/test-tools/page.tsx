"use client";

import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

export default function TestTools() {
  const { toast } = useToast();
  const [logs, setLogs] = useState<string[]>([]);
  const [activeConsole, setActiveConsole] = useState<string>("Click a test action to view terminal outputs.");
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  // Poll system logs every 1.5 seconds to display database transactions in real-time
  const fetchLogs = async () => {
    try {
      const res = await fetch("/api/logs");
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (e) {
      console.error("Failed to load logs:", e);
    }
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 15000); // 1.5 second log trace interval (1500ms -> let's make it 1500ms actually for extremely snappy tracing!)
    return () => clearInterval(interval);
  }, []);

  const triggerFetchLogs = async () => {
    await fetchLogs();
  };

  const handleAction = async (actionName: string, apiEndpoint: string, method = "POST", payload?: any) => {
    setLoadingAction(actionName);
    setActiveConsole(`[EXECUTING] Sending ${method} request to ${apiEndpoint}...\n`);
    
    try {
      const response = await fetch(apiEndpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: payload ? JSON.stringify(payload) : undefined,
      });

      const data = await response.json();
      
      setActiveConsole((prev) => 
        prev + 
        `[STATUS] HTTP ${response.status} ${response.statusText}\n` +
        `[RESPONSE BODY]\n${JSON.stringify(data, null, 2)}`
      );

      if (response.ok) {
        toast(`${actionName} completed successfully!`, "success");
      } else {
        toast(`Error: ${data.error || "Simulation action failed."}`, "error");
      }
    } catch (error: any) {
      console.error(error);
      setActiveConsole((prev) => prev + `[CONNECTION ERROR] ${error.message || error}`);
      toast("A connection error occurred.", "error");
    } finally {
      setLoadingAction(null);
      await fetchLogs();
    }
  };

  // 1. Reset Quotas Webhook (Fresh Event ID)
  const triggerResetQuotas = () => {
    const eventId = `webhook-evt-${crypto.randomUUID().slice(0, 8)}`;
    handleAction("Reset Provider Quotas", "/api/webhooks/reset-quota", "POST", { eventId });
  };

  // 2. Webhook Idempotency (Same Event ID 3 times)
  const triggerIdempotencyTest = async () => {
    const eventId = `webhook-idem-${crypto.randomUUID().slice(0, 8)}`;
    setLoadingAction("Webhook Idempotency Test");
    setActiveConsole(`[START IDEMPOTENCY TEST] Firing 3 sequential requests with same eventId: "${eventId}"\n\n`);

    for (let i = 1; i <= 3; i++) {
      setActiveConsole((prev) => prev + `[CALL #${i}] Sending webhook event (eventId: ${eventId})...\n`);
      try {
        const response = await fetch("/api/webhooks/reset-quota", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ eventId }),
        });
        const data = await response.json();
        
        setActiveConsole((prev) => 
          prev + 
          `[CALL #${i} RESPONSE] Status: ${response.status} | processed: ${data.processed}\n` +
          `Message: ${data.message}\n` +
          `--------------------------------------------------\n`
        );
      } catch (err: any) {
        setActiveConsole((prev) => prev + `[CALL #${i} ERROR] ${err.message}\n`);
      }
    }

    setLoadingAction(null);
    toast("Idempotency sequence complete!", "success");
    await fetchLogs();
  };

  // 3. Generate 10 Leads Concurrently
  const triggerConcurrencyTest = () => {
    handleAction("Concurrency Test", "/api/test/generate-leads", "POST");
  };

  // 4. Test Duplicate Prevention Unique Constraint
  const triggerDuplicateTest = () => {
    handleAction("Duplicate Prevention Test", "/api/test/generate-duplicates", "POST");
  };

  // 5. Clear Local Logs array
  const handleClearLogs = () => {
    setLogs([]);
    toast("Logs view cleared locally.", "info");
  };

  return (
    <div className="space-y-8 py-2">
      {/* Page Header */}
      <div className="border-b border-border/40 pb-6">
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          System Simulation & QA Sandbox
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Internal simulation tools designed to test concurrency row-locks, duplicate database constraints, and webhook idempotency rules.
        </p>
      </div>

      {/* Main Control Panel and Terminal Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: Simulation Buttons */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Action Trigger Card */}
          <Card className="border border-border/80 bg-neutral-950/40">
            <CardHeader className="border-b border-border/40 pb-4 mb-4">
              <CardTitle>Trigger Test Cases</CardTitle>
              <CardDescription>Launch specific test routines against the PostgreSQL engine.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              
              {/* Action 1: Reset Quotas Webhook */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs text-muted-foreground">
                  <span className="font-semibold text-white/80">1. RESET PROVIDER QUOTAS</span>
                  <span>Webhook Simulation</span>
                </div>
                <Button
                  className="w-full text-xs font-semibold py-2.5 h-10 border border-border bg-card/60 text-white hover:bg-accent"
                  variant="outline"
                  onClick={triggerResetQuotas}
                  isLoading={loadingAction === "Reset Provider Quotas"}
                >
                  Post Quota Reset Webhook
                </Button>
              </div>

              {/* Action 2: Webhook Idempotency Test */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs text-muted-foreground">
                  <span className="font-semibold text-white/80">2. TEST WEBHOOK IDEMPOTENCY</span>
                  <span>Same eventId 3 times</span>
                </div>
                <Button
                  className="w-full text-xs font-semibold py-2.5 h-10 border border-border bg-card/60 text-white hover:bg-accent"
                  variant="outline"
                  onClick={triggerIdempotencyTest}
                  isLoading={loadingAction === "Webhook Idempotency Test"}
                >
                  Fire Duplicate Webhook Sequence
                </Button>
              </div>

              {/* Action 3: Stress Test Concurrency */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs text-muted-foreground">
                  <span className="font-semibold text-white/80">3. HIGH CONCURRENCY GENERATION</span>
                  <span>10 Parallel allocations</span>
                </div>
                <Button
                  className="w-full text-xs font-semibold py-2.5 h-10 border border-border bg-card/60 text-white hover:bg-accent"
                  variant="outline"
                  onClick={triggerConcurrencyTest}
                  isLoading={loadingAction === "Concurrency Test"}
                >
                  Simulate 10 Leads Instantly
                </Button>
              </div>

              {/* Action 4: Duplicate Leads Constraint */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs text-muted-foreground">
                  <span className="font-semibold text-white/80">4. COMPOSITE UNIQUE CONSTRAINT</span>
                  <span>Same phone + same service</span>
                </div>
                <Button
                  className="w-full text-xs font-semibold py-2.5 h-10 border border-border bg-card/60 text-white hover:bg-accent"
                  variant="outline"
                  onClick={triggerDuplicateTest}
                  isLoading={loadingAction === "Duplicate Prevention Test"}
                >
                  Attempt Duplicate Lead Write
                </Button>
              </div>

            </CardContent>
          </Card>

          {/* Test Action Output Console */}
          <Card className="border border-border/80 bg-neutral-950/40">
            <CardHeader className="border-b border-border/40 pb-4 mb-4">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                Action Output Feedback
              </CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="w-full h-44 overflow-y-auto p-4 rounded-lg bg-neutral-950 text-emerald-400 font-mono text-[11px] leading-relaxed border border-border/60 select-text whitespace-pre-wrap">
                {activeConsole}
              </pre>
            </CardContent>
          </Card>

        </div>

        {/* Right Side: Glow Neon System Log Console */}
        <div className="lg:col-span-7 flex flex-col">
          <Card className="border border-border/80 bg-neutral-950/40 flex-1 flex flex-col h-[670px] overflow-hidden">
            <CardHeader className="border-b border-border/40 pb-4 mb-4 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-white">Allocation System Trace Logger</CardTitle>
                <CardDescription>
                  Real-time database triggers, row locking records, and pointer state updates.
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={triggerFetchLogs}
                  className="text-xs px-3 py-1 h-8 bg-neutral-900 border border-border hover:bg-accent"
                  variant="outline"
                >
                  Refresh
                </Button>
                <Button
                  onClick={handleClearLogs}
                  className="text-xs px-3 py-1 h-8 bg-neutral-900 border border-border hover:bg-accent"
                  variant="outline"
                >
                  Clear Logs
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col px-6 pb-6 overflow-hidden">
              {/* Terminal Frame */}
              <div className="flex-grow rounded-xl bg-neutral-950 border border-border/80 flex flex-col overflow-hidden font-mono shadow-2xl relative">
                {/* Header Strip */}
                <div className="flex items-center gap-2 px-4 py-2.5 bg-neutral-900 border-b border-border/40 text-xs text-muted-foreground select-none">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                  <span className="ml-2 font-semibold text-[10px] tracking-widest uppercase">
                    psql_logger@prowider_engine
                  </span>
                </div>
                {/* Scrollable Trace */}
                <div className="flex-1 overflow-y-auto p-5 space-y-2 select-text leading-relaxed text-[11px]">
                  {logs.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-muted-foreground/30 text-xs">
                      No trace transactions captured. Submit leads or run simulator tools to populate system logs.
                    </div>
                  ) : (
                    logs.map((log, index) => {
                      let textColor = "text-muted-foreground"; // Default debug log
                      if (log.includes("[START]") || log.includes("[COMMIT]")) {
                        textColor = "text-cyan-400 font-bold";
                      } else if (log.includes("[MANDATORY]") || log.includes("[POOL ASSIGN]")) {
                        textColor = "text-emerald-400";
                      } else if (log.includes("[LOCK]")) {
                        textColor = "text-amber-400 font-semibold";
                      } else if (log.includes("[DUPLICATE REJECT]") || log.includes("[WEBHOOK IDEMPOTENT]")) {
                        textColor = "text-rose-400";
                      } else if (log.includes("[ERROR]")) {
                        textColor = "text-red-500 font-bold animate-pulse";
                      }

                      return (
                        <div key={index} className={`border-b border-border/20 pb-1 ${textColor}`}>
                          {log}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
