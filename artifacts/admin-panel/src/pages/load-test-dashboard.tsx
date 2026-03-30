import { useState } from "react";
import { Gauge, Play, Square, BarChart3, Activity, Clock, Users, Zap, TrendingUp, AlertTriangle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

const testProfiles = [
  { id: "LT-SMOKE", name: "Smoke Test", description: "Quick validation of all endpoints", duration: "2 min", vus: 10, rps: 50, status: "ready" },
  { id: "LT-LOAD", name: "Standard Load", description: "Sustained load at expected traffic levels", duration: "15 min", vus: 200, rps: 500, status: "ready" },
  { id: "LT-STRESS", name: "Stress Test", description: "Push beyond capacity to find breaking points", duration: "30 min", vus: 1000, rps: 2000, status: "ready" },
  { id: "LT-SPIKE", name: "Spike Test", description: "Sudden traffic spike simulation", duration: "10 min", vus: 500, rps: 1500, status: "ready" },
  { id: "LT-SOAK", name: "Soak Test", description: "Extended duration for memory leak detection", duration: "2 hr", vus: 100, rps: 200, status: "ready" },
];

const recentRuns = [
  { profile: "Smoke Test", date: "Mar 29, 14:32", duration: "2m 12s", status: "passed", avgLatency: 42, p95: 125, p99: 245, errorRate: 0, rps: 48 },
  { profile: "Standard Load", date: "Mar 28, 10:00", duration: "15m 03s", status: "passed", avgLatency: 89, p95: 210, p99: 450, errorRate: 0.02, rps: 487 },
  { profile: "Stress Test", date: "Mar 27, 22:00", duration: "30m 15s", status: "warning", avgLatency: 245, p95: 890, p99: 1250, errorRate: 0.8, rps: 1842 },
  { profile: "Spike Test", date: "Mar 25, 16:30", duration: "10m 08s", status: "passed", avgLatency: 156, p95: 420, p99: 780, errorRate: 0.1, rps: 1380 },
  { profile: "Smoke Test", date: "Mar 24, 09:15", duration: "2m 08s", status: "passed", avgLatency: 38, p95: 112, p99: 198, errorRate: 0, rps: 50 },
];

const endpoints = [
  { path: "GET /api/health", avgMs: 12, p99: 45, calls: 5000, errors: 0 },
  { path: "GET /api/apps", avgMs: 34, p99: 120, calls: 3200, errors: 0 },
  { path: "POST /api/auth/login", avgMs: 89, p99: 320, calls: 1500, errors: 2 },
  { path: "GET /api/analytics", avgMs: 156, p99: 890, calls: 2800, errors: 8 },
  { path: "GET /api/users", avgMs: 28, p99: 95, calls: 4100, errors: 0 },
  { path: "POST /api/webhooks", avgMs: 45, p99: 180, calls: 890, errors: 1 },
];

export default function LoadTestDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground flex items-center gap-3">
          <Gauge className="w-5 h-5 text-primary" />
          Load Test Dashboard
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Configure and run load tests against the platform API</p>
      </div>

      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">Test Profiles</h3>
        <div className="grid grid-cols-5 gap-3">
          {testProfiles.map(p => (
            <div key={p.id} className="border border-border rounded-lg p-4 hover:border-primary/20 transition-all">
              <h4 className="text-sm font-medium text-foreground">{p.name}</h4>
              <p className="text-xs text-muted-foreground mt-1">{p.description}</p>
              <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                <p><Clock className="w-3 h-3 inline mr-1" />{p.duration}</p>
                <p><Users className="w-3 h-3 inline mr-1" />{p.vus} VUs</p>
                <p><Zap className="w-3 h-3 inline mr-1" />{p.rps} RPS</p>
              </div>
              <button className="mt-3 w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors">
                <Play className="w-3 h-3" /> Run
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">Recent Test Runs</h3>
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider pb-3">Profile</th>
              <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider pb-3">Date</th>
              <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider pb-3">Duration</th>
              <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider pb-3">Avg Latency</th>
              <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider pb-3">P95</th>
              <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider pb-3">P99</th>
              <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider pb-3">Error Rate</th>
              <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider pb-3">RPS</th>
              <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider pb-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {recentRuns.map((run, i) => (
              <tr key={i} className="border-b border-border/50 hover:bg-muted/20">
                <td className="py-3 text-sm text-foreground">{run.profile}</td>
                <td className="py-3 text-xs text-muted-foreground">{run.date}</td>
                <td className="py-3 text-xs font-mono text-muted-foreground">{run.duration}</td>
                <td className="py-3 text-xs font-mono text-foreground">{run.avgLatency}ms</td>
                <td className="py-3 text-xs font-mono text-foreground">{run.p95}ms</td>
                <td className="py-3 text-xs font-mono text-foreground">{run.p99}ms</td>
                <td className="py-3 text-xs font-mono">
                  <span className={cn(run.errorRate > 0.5 ? "text-red-400" : run.errorRate > 0 ? "text-amber-400" : "text-emerald-400")}>
                    {run.errorRate}%
                  </span>
                </td>
                <td className="py-3 text-xs font-mono text-foreground">{run.rps}</td>
                <td className="py-3">
                  <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-medium capitalize",
                    run.status === "passed" ? "bg-emerald-400/10 text-emerald-400" :
                    run.status === "warning" ? "bg-amber-400/10 text-amber-400" :
                    "bg-red-400/10 text-red-400"
                  )}>{run.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">Endpoint Performance (Last Load Test)</h3>
        <div className="space-y-2">
          {endpoints.map((ep, i) => (
            <div key={i} className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/20 transition-colors">
              <span className="text-sm font-mono text-foreground w-48">{ep.path}</span>
              <div className="flex-1">
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className={cn("h-full rounded-full",
                    ep.avgMs < 50 ? "bg-emerald-400" : ep.avgMs < 100 ? "bg-cyan-400" : ep.avgMs < 200 ? "bg-amber-400" : "bg-red-400"
                  )} style={{ width: `${Math.min(100, (ep.avgMs / 200) * 100)}%` }} />
                </div>
              </div>
              <span className="text-xs font-mono text-foreground w-20">{ep.avgMs}ms avg</span>
              <span className="text-xs font-mono text-muted-foreground w-20">{ep.p99}ms p99</span>
              <span className="text-xs text-muted-foreground w-20">{ep.calls.toLocaleString()} calls</span>
              <span className={cn("text-xs w-16 text-right", ep.errors > 0 ? "text-red-400" : "text-emerald-400")}>
                {ep.errors} errors
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
