import { BarChart3, Activity, Server, Database, Clock, TrendingUp } from "lucide-react";

const MOCK_METRICS = [
  { label: "Req/s", value: "143", trend: "+12%", color: "emerald" },
  { label: "P99 Latency", value: "187ms", trend: "-8%", color: "blue" },
  { label: "Error Rate", value: "0.3%", trend: "+0.1%", color: "amber" },
  { label: "DB Queries/s", value: "42", trend: "+5%", color: "violet" },
];

export default function SystemObservability() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Observability</h1>
        <p className="text-sm text-muted-foreground mt-1">System metrics, traces, and performance data</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {MOCK_METRICS.map(m => (
          <div key={m.label} className="bg-card border border-border rounded-xl p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">{m.label}</p>
            <p className="text-2xl font-bold mt-1">{m.value}</p>
            <p className={`text-xs mt-0.5 ${m.trend.startsWith("-") && m.label !== "Error Rate" ? "text-emerald-400" : m.trend.startsWith("+") && m.label === "Error Rate" ? "text-amber-400" : "text-muted-foreground"}`}>
              {m.trend} vs. last hour
            </p>
          </div>
        ))}
      </div>

      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Request Volume (Demo)</h3>
        </div>
        <div className="flex items-end gap-1.5 h-24">
          {Array.from({ length: 24 }, (_, i) => {
            const h = Math.round(60 + Math.sin(i / 3) * 40 + Math.random() * 20);
            return (
              <div key={i} className="flex-1 bg-primary/20 rounded-t hover:bg-primary/40 transition-colors" style={{ height: `${h}%` }} />
            );
          })}
        </div>
        <div className="flex justify-between mt-2 text-xs text-muted-foreground">
          <span>24h ago</span>
          <span>Now</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Server className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold">Top Endpoints</h3>
          </div>
          <div className="space-y-2 text-sm">
            {[
              { path: "/api/cms/ventures", calls: 2840 },
              { path: "/api/admin/overview", calls: 1204 },
              { path: "/api/cms/sites", calls: 984 },
              { path: "/api/cms/articles", calls: 751 },
              { path: "/api/admin/connectors", calls: 612 },
            ].map(e => (
              <div key={e.path} className="flex items-center gap-2">
                <span className="font-mono text-xs text-muted-foreground flex-1 truncate">{e.path}</span>
                <span className="text-xs font-medium">{e.calls.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Database className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold">Slow Queries</h3>
          </div>
          <div className="space-y-2 text-sm">
            {[
              { query: "SELECT * FROM articles WHERE...", ms: 142 },
              { query: "SELECT COUNT(*) FROM audit_events", ms: 89 },
              { query: "SELECT * FROM vessels JOIN...", ms: 67 },
            ].map((q, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="font-mono text-xs text-muted-foreground flex-1 truncate">{q.query}</span>
                <span className={`text-xs font-medium shrink-0 ${q.ms > 100 ? "text-amber-400" : "text-muted-foreground"}`}>{q.ms}ms</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
