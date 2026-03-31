import { Card, CardContent, CardHeader, CardTitle } from "@workspace/shared-ui/ui/card";
import { Badge } from "@workspace/shared-ui/ui/badge";
import { Target, TrendingDown, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from "recharts";

const slos = [
  { service: "API Gateway", slo: "99.9% Availability", current: 99.97, budget: 100, budgetUsed: 3, errorBudgetHours: 43.2, status: "Healthy", trend: "stable" },
  { service: "Payment Service", slo: "99.95% Availability", current: 99.82, budget: 100, budgetUsed: 164, errorBudgetHours: -50.4, status: "Burning", trend: "down" },
  { service: "Auth Service", slo: "200ms p95 Latency", current: 187, budget: 200, budgetUsed: 12, errorBudgetHours: 38.1, status: "Healthy", trend: "up" },
  { service: "Search Service", slo: "500ms p99 Latency", current: 423, budget: 500, budgetUsed: 7, errorBudgetHours: 41.8, status: "Healthy", trend: "stable" },
  { service: "Checkout Flow", slo: "99.9% Success Rate", current: 99.73, budget: 100, budgetUsed: 270, errorBudgetHours: -97.2, status: "Critical", trend: "down" },
  { service: "Notification Worker", slo: "< 30s Delivery", current: 127, budget: 30, budgetUsed: 423, errorBudgetHours: -214.1, status: "Critical", trend: "down" },
];

const burnRateData = Array.from({ length: 24 }, (_, i) => ({
  hour: `${i}:00`,
  payment: Math.max(0, 100 - i * 4 - Math.random() * 5),
  checkout: Math.max(0, 100 - i * 6 - Math.random() * 8),
  api: Math.max(0, 100 - i * 0.5 - Math.random() * 2),
}));

export default function SLOTracking() {
  const critical = slos.filter(s => s.status === "Critical").length;
  const burning = slos.filter(s => s.status === "Burning").length;
  const healthy = slos.filter(s => s.status === "Healthy").length;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Target className="w-6 h-6 text-cyan-400" />
          SLA / SLO Tracking & Error Budgets
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Error budget burn rates, SLO compliance, and reliability targets per service</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Critical SLO Breach", value: critical, color: "text-[#c45a4a]" },
          { label: "Burning Budget", value: burning, color: "text-[#c8953c]" },
          { label: "Healthy SLOs", value: healthy, color: "text-[#6b8f71]" },
          { label: "Avg SLO Compliance", value: "99.81%", color: "text-cyan-400" },
        ].map(({ label, value, color }) => (
          <Card key={label}><CardContent className="p-4"><p className="text-xs text-muted-foreground">{label}</p><p className={`text-2xl font-bold ${color}`}>{value}</p></CardContent></Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Error Budget Burn Rate — 24h Window</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={burnRateData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="hour" tick={{ fontSize: 10, fill: "#94a3b8" }} interval={3} />
              <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} domain={[0, 100]} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
              <ReferenceLine y={0} stroke="#c45a4a" strokeDasharray="3 3" label={{ value: "Budget Exhausted", fill: "#c45a4a", fontSize: 10 }} />
              <Area type="monotone" dataKey="payment" name="Payment Service" stroke="#c45a4a" fill="#c45a4a" fillOpacity={0.1} />
              <Area type="monotone" dataKey="checkout" name="Checkout Flow" stroke="#c8953c" fill="#c8953c" fillOpacity={0.1} />
              <Area type="monotone" dataKey="api" name="API Gateway" stroke="#6b8f71" fill="#6b8f71" fillOpacity={0.1} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {slos.map((slo) => (
          <Card key={slo.service} className={slo.status === "Critical" ? "border-[#c45a4a]/30" : slo.status === "Burning" ? "border-[#c8953c]/20" : ""}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm">{slo.service}</span>
                    <Badge variant="outline" className="text-[10px]">{slo.slo}</Badge>
                    <Badge variant="outline" className={`text-[10px] ${slo.status === "Critical" ? "text-[#c45a4a] bg-[#c45a4a]/10 border-[#c45a4a]/20" : slo.status === "Burning" ? "text-[#c8953c] bg-[#c8953c]/10 border-[#c8953c]/20" : "text-[#6b8f71] bg-[#6b8f71]/10 border-[#6b8f71]/20"}`}>{slo.status}</Badge>
                  </div>
                  <div className="flex gap-4 mt-1.5 text-xs text-muted-foreground">
                    <span>Current: <span className={slo.status !== "Healthy" ? "text-[#c45a4a] font-bold" : "text-foreground"}>{slo.current}{typeof slo.current === "number" && slo.current > 100 ? "ms" : "%"}</span></span>
                    <span>Budget Used: <span className={slo.budgetUsed > 100 ? "text-[#c45a4a] font-bold" : "text-foreground"}>{slo.budgetUsed}%</span></span>
                    <span>Remaining: <span className={slo.errorBudgetHours < 0 ? "text-[#c45a4a]" : "text-[#6b8f71]"}>{slo.errorBudgetHours < 0 ? `OVER by ${Math.abs(slo.errorBudgetHours)}h` : `${slo.errorBudgetHours}h`}</span></span>
                  </div>
                  <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${slo.budgetUsed >= 200 ? "bg-[#c45a4a]" : slo.budgetUsed >= 100 ? "bg-[#c8953c]" : "bg-[#6b8f71]"}`} style={{ width: `${Math.min(slo.budgetUsed, 100)}%` }} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
