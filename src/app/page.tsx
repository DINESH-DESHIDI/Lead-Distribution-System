import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="space-y-12 py-4">
      {/* Hero Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          Engine Operational
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white">
          Prowider Mini Lead Distribution System
        </h1>
        <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          A production-quality full-stack solution featuring database-level locking, 
          strictly serialized round-robin allocations, webhook idempotency protection, and instant push updates.
        </p>
      </div>

      {/* Access Panels Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        {/* Form Panel */}
        <Card className="flex flex-col justify-between hover:scale-[1.02] transition-transform duration-300">
          <CardHeader>
            <div className="w-10 h-10 rounded-lg bg-neutral-900 border border-white/15 flex items-center justify-center mb-2">
              <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <CardTitle>Public Service Booking</CardTitle>
            <CardDescription>
              Client-facing service enquiry portal. Prevents duplicates at the database level.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Enables customers to request Service 1, 2, or 3. Validates details in real time and automatically triggers provider locking.
            </p>
            <Link href="/request-service" className="inline-flex w-full items-center justify-center rounded-lg bg-white text-black font-semibold h-10 px-4 py-2 hover:bg-neutral-200 transition-colors">
              Submit Lead Form &rarr;
            </Link>
          </CardContent>
        </Card>

        {/* Dashboard Panel */}
        <Card className="flex flex-col justify-between hover:scale-[1.02] transition-transform duration-300">
          <CardHeader>
            <div className="w-10 h-10 rounded-lg bg-neutral-900 border border-white/15 flex items-center justify-center mb-2">
              <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" />
              </svg>
            </div>
            <CardTitle>Real-Time Dashboard</CardTitle>
            <CardDescription>
              Live provider metric cards. Refreshes instantly using Server-Sent Events.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Displays remaining quotas, allocation progress, and a scrollable table of assigned customers for all 8 providers.
            </p>
            <Link href="/dashboard" className="inline-flex w-full items-center justify-center rounded-lg bg-neutral-900 border border-border text-white font-semibold h-10 px-4 py-2 hover:bg-accent transition-colors">
              Open Live Dashboard &rarr;
            </Link>
          </CardContent>
        </Card>

        {/* Test Console Panel */}
        <Card className="flex flex-col justify-between hover:scale-[1.02] transition-transform duration-300">
          <CardHeader>
            <div className="w-10 h-10 rounded-lg bg-neutral-900 border border-white/15 flex items-center justify-center mb-2">
              <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <CardTitle>Simulation Console</CardTitle>
            <CardDescription>
              QA tools to stress-test high loads, check webhooks, and audit logs.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Generate 10 concurrent requests to test database row locks, submit duplicates, reset quotas via webhooks, and read trace logs.
            </p>
            <Link href="/test-tools" className="inline-flex w-full items-center justify-center rounded-lg bg-neutral-900 border border-border text-white font-semibold h-10 px-4 py-2 hover:bg-accent transition-colors">
              Access QA Sandbox &rarr;
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Business and Technical Overview Panel */}
      <div className="border border-border/80 bg-neutral-950/40 p-8 rounded-2xl max-w-5xl mx-auto space-y-6">
        <h2 className="text-xl font-bold text-white tracking-wide border-b border-border/40 pb-2">
          Engine Specifications & Assignment Rules
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm text-muted-foreground">
          <div className="space-y-3">
            <h3 className="font-semibold text-white">1. Mandatory Providers Rule</h3>
            <p className="leading-relaxed">
              When a new service enquiry is booked, the system automatically checks and assigns mandatory providers based on service classification:
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong className="text-white/80">Service 1:</strong> Assigned to <strong className="text-white/80">Provider 1</strong></li>
              <li><strong className="text-white/80">Service 2:</strong> Assigned to <strong className="text-white/80">Provider 5</strong></li>
              <li><strong className="text-white/80">Service 3:</strong> Assigned to <strong className="text-white/80">Provider 1</strong> and <strong className="text-white/80">Provider 4</strong></li>
            </ul>
          </div>
          <div className="space-y-3">
            <h3 className="font-semibold text-white">2. Fair Round-Robin Allocation</h3>
            <p className="leading-relaxed">
              To reach exactly <strong className="text-white/80">3 assigned providers</strong> per lead, remaining slots are allocated sequentially from persistent service pools:
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong className="text-white/80">Service 1 pool:</strong> Provider 2, 3, 4</li>
              <li><strong className="text-white/80">Service 2 pool:</strong> Provider 6, 7, 8</li>
              <li><strong className="text-white/80">Service 3 pool:</strong> Provider 2, 3, 5, 6, 7, 8</li>
            </ul>
            <p className="leading-relaxed text-xs">
              Providers with 0 remaining monthly quota are safely skipped. The traversal index persists in the database across server restarts to ensure perfect fairness.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
