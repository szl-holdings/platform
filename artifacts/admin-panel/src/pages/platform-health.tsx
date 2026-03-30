import { useState } from "react";
import { HeartPulse, CheckCircle2, AlertTriangle, XCircle, Clock, Activity, BarChart3, FileText, TrendingUp } from "lucide-react";
import { cn } from "@workspace/shared-ui/utils";

const healthReports = [
  {
    id: "RPT-001", date: "2026-03-29", type: "Smoke Test", status: "passed",
    results: { total: 48, passed: 48, failed: 0, skipped: 0 },
    duration: "2m 34s", coverage: ["API endpoints", "Auth flows", "Database queries", "WebSocket connections"],
    details: "All 48 smoke test assertions passed. API response times within SLA. Database connectivity verified across all regions."
  },
  {
    id: "RPT-002", date: "2026-03-28", type: "Stress Test", status: "passed",
    results: { total: 12, passed: 11, failed: 1, skipped: 0 },
    duration: "15m 12s", coverage: ["Concurrent users (1000)", "API throughput", "Database connection pool", "Memory pressure"],
    details: "System sustained 1000 concurrent users with avg response time 89ms. One timeout at peak load on /api/analytics endpoint (non-critical)."
  },
  {
    id: "RPT-003", date: "2026-03-27", type: "Smoke Test", status: "passed",
    results: { total: 48, passed: 48, failed: 0, skipped: 0 },
    duration: "2m 28s", coverage: ["API endpoints", "Auth flows", "Database queries", "WebSocket connections"],
    details: "Clean pass across all test suites. No regressions detected from v4.2.0 deployment."
  },
  {
    id: "RPT-004", date: "2026-03-25", type: "Load Test", status: "warning",
    results: { total: 24, passed: 20, failed: 2, skipped: 2 },
    duration: "32m 45s", coverage: ["Sustained load (500 RPS)", "Memory leak detection", "Connection pool exhaustion", "Cache invalidation"],
    details: "2 failures: Connection pool near-exhaustion at 500 RPS sustained for 20min. Memory growth detected in analytics worker (non-critical leak, ~2MB/hr)."
  },
  {
    id: "RPT-005", date: "2026-03-22", type: "Stress Test", status: "passed",
    results: { total: 12, passed: 12, failed: 0, skipped: 0 },
    duration: "14m 56s", coverage: ["Concurrent users (1000)", "API throughput", "Database connection pool", "Memory pressure"],
    details: "Full pass. System handled peak load gracefully with auto-scaling from 2 to 6 replicas. P99 latency: 245ms."
  },
  {
    id: "RPT-006", date: "2026-03-20", type: "Smoke Test", status: "failed",
    results: { total: 48, passed: 44, failed: 4, skipped: 0 },
    duration: "2m 51s", coverage: ["API endpoints", "Auth flows", "Database queries", "WebSocket connections"],
    details: "4 failures in auth flow tests due to expired OAuth token in test environment. Fixed and re-run successfully at 16:00."
  },
];

export default function PlatformHealth() {
  const [typeFilter, setTypeFilter] = useState("all");
  const filtered = healthReports.filter(r => typeFilter === "all" || r.type.toLowerCase().includes(typeFilter));

  const passRate = ((healthReports.filter(r => r.status === "passed").length / healthReports.length) * 100).toFixed(0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground flex items-center gap-3">
          <FileText className="w-5 h-5 text-primary" />
          Platform Health Reports
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Smoke test, stress test, and load test results history</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total Reports</p>
          <p className="text-2xl font-semibold text-foreground">{healthReports.length}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Pass Rate</p>
          <p className="text-2xl font-semibold text-emerald-400">{passRate}%</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Last Run</p>
          <p className="text-2xl font-semibold text-foreground">Today</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Avg Duration</p>
          <p className="text-2xl font-semibold text-foreground">11m</p>
        </div>
      </div>

      <div className="flex gap-2">
        {["all", "smoke", "stress", "load"].map(t => (
          <button key={t} onClick={() => setTypeFilter(t)}
            className={cn("px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors",
              typeFilter === t ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"
            )}>{t === "all" ? "All Tests" : `${t} Tests`}</button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map(report => (
          <div key={report.id} className="bg-card border border-border rounded-xl p-5 hover:border-primary/20 transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center",
                  report.status === "passed" ? "bg-emerald-400/10" :
                  report.status === "warning" ? "bg-amber-400/10" : "bg-red-400/10"
                )}>
                  {report.status === "passed" ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> :
                   report.status === "warning" ? <AlertTriangle className="w-4 h-4 text-amber-400" /> :
                   <XCircle className="w-4 h-4 text-red-400" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-muted-foreground">{report.id}</span>
                    <span className="text-sm font-semibold text-foreground">{report.type}</span>
                    <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-medium capitalize",
                      report.status === "passed" ? "bg-emerald-400/10 text-emerald-400" :
                      report.status === "warning" ? "bg-amber-400/10 text-amber-400" :
                      "bg-red-400/10 text-red-400"
                    )}>{report.status}</span>
                  </div>
                  <p className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                    <Clock className="w-3 h-3" /> {report.date} · {report.duration}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-emerald-400 font-mono">{report.results.passed} passed</span>
                {report.results.failed > 0 && <span className="text-red-400 font-mono">{report.results.failed} failed</span>}
                {report.results.skipped > 0 && <span className="text-muted-foreground font-mono">{report.results.skipped} skipped</span>}
                <span className="text-muted-foreground font-mono">/ {report.results.total}</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">{report.details}</p>
            <div className="flex gap-1 mt-3">
              {report.coverage.map(c => (
                <span key={c} className="text-[10px] px-2 py-0.5 rounded bg-muted text-muted-foreground">{c}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
