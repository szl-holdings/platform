import { Card, CardContent, CardHeader, CardTitle } from "@szl-holdings/shared-ui/ui/card";
import { Badge } from "@szl-holdings/shared-ui/ui/badge";
import { Brain, Activity, AlertTriangle, TrendingUp, Zap, Eye } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { MicroFeedbackWidget } from "@szl-holdings/shared-ui";

const anomalies = [
  { id: "ANO-001", service: "payment-service", metric: "Latency p99", value: "847ms", baseline: "120ms", deviation: "+606%", severity: "Critical", detected: "4 min ago", rootCause: "DB connection pool exhaustion", impact: "Checkout degraded for 12% of users" },
  { id: "ANO-002", service: "auth-service", metric: "Error Rate", value: "8.4%", baseline: "0.2%", deviation: "+4100%", severity: "Critical", detected: "11 min ago", rootCause: "OAuth token validation failures", impact: "Login failures for SSO users" },
  { id: "ANO-003", service: "inventory-api", metric: "CPU Utilization", value: "94%", baseline: "45%", deviation: "+109%", severity: "High", detected: "23 min ago", rootCause: "Batch job runaway process", impact: "Increased response times" },
  { id: "ANO-004", service: "notification-worker", metric: "Queue Depth", value: "14,231", baseline: "200", deviation: "+7016%", severity: "High", detected: "41 min ago", rootCause: "Consumer group lag — Kafka partition", impact: "Delayed notifications" },
  { id: "ANO-005", service: "cdn-edge", metric: "Cache Miss Rate", value: "67%", baseline: "8%", deviation: "+738%", severity: "Medium", detected: "1h ago", rootCause: "Cache invalidation storm", impact: "Increased origin load" },
];

const timeSeriesData = Array.from({ length: 30 }, (_, i) => ({
  t: `${i}m`,
  normal: Math.floor(Math.random() * 20 + 100),
  anomaly: i >= 20 ? Math.floor(Math.random() * 300 + 400) : null,
}));

const sevColor: Record<string, string> = {
  Critical: "bg-[#c45a4a]/10 text-[#c45a4a] border-[#c45a4a]/20",
  High: "bg-[#c8953c]/10 text-[#c8953c] border-[#c8953c]/20",
  Medium: "bg-[#d4a054]/10 text-[#d4a054] border-[#d4a054]/20",
};

export default function AnomalyDetection() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Brain className="w-6 h-6 text-cyan-400" />
          Watchdog AI Anomaly Detection
        </h1>
        <p className="text-sm text-muted-foreground mt-1">ML-powered anomaly detection — 98% noise reduction with behavioral baselines</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Active Anomalies", value: "5", color: "text-[#c45a4a]" },
          { label: "Noise Suppressed", value: "98.2%", color: "text-[#6b8f71]" },
          { label: "Signals Monitored", value: "12,847", color: "text-cyan-400" },
          { label: "Avg Detect Time", value: "47s", color: "text-[#d4a054]" },
        ].map(({ label, value, color }) => (
          <Card key={label}><CardContent className="p-4"><p className="text-xs text-muted-foreground">{label}</p><p className={`text-2xl font-bold ${color}`}>{value}</p></CardContent></Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">payment-service — Latency p99 (30 min window)</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={timeSeriesData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="t" tick={{ fontSize: 10, fill: "#94a3b8" }} interval={4} />
              <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
              <Area type="monotone" dataKey="normal" stroke="#4a90b8" fill="#4a90b8" fillOpacity={0.15} connectNulls />
              <Area type="monotone" dataKey="anomaly" stroke="#c45a4a" fill="#c45a4a" fillOpacity={0.2} connectNulls />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {anomalies.map((a) => (
          <Card key={a.id} className={a.severity === "Critical" ? "border-[#c45a4a]/30" : ""}>
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${a.severity === "Critical" ? "bg-[#c45a4a]/10" : a.severity === "High" ? "bg-[#c8953c]/10" : "bg-[#d4a054]/10"}`}>
                  <AlertTriangle className={`w-5 h-5 ${a.severity === "Critical" ? "text-[#c45a4a]" : a.severity === "High" ? "text-[#c8953c]" : "text-[#d4a054]"}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm font-mono">{a.service}</span>
                    <Badge variant="outline" className="text-[10px]">{a.metric}</Badge>
                    <Badge variant="outline" className={`text-[10px] ${sevColor[a.severity]}`}>{a.severity}</Badge>
                    <span className="text-[10px] text-muted-foreground">{a.detected}</span>
                  </div>
                  <div className="flex gap-4 mt-1.5 text-xs">
                    <span>Current: <span className="font-bold text-[#c45a4a]">{a.value}</span></span>
                    <span>Baseline: <span className="text-muted-foreground">{a.baseline}</span></span>
                    <span>Deviation: <span className="font-bold text-[#c45a4a]">{a.deviation}</span></span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Root cause: {a.rootCause}</p>
                  <p className="text-xs text-[#d4a054] mt-0.5">Impact: {a.impact}</p>
                </div>
                <button className="text-xs px-3 py-1.5 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors shrink-0">Investigate</button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-end pt-2">
        <MicroFeedbackWidget
          featureId="lyte-anomaly-detection"
          featureName="Lyte AIOps Metric Spike & Anomaly Cards"
          app="lyte"
          compact
          prompt="Were these anomaly cards useful?"
        />
      </div>
    </div>
  );
}
