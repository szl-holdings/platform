import { Card, CardContent, CardHeader, CardTitle } from "@workspace/shared-ui/ui/card";
import { Badge } from "@workspace/shared-ui/ui/badge";
import { DollarSign, TrendingUp, TrendingDown, Users, Clock, BarChart3 } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar } from "recharts";

const mrrTrend = [
  { month: "Oct", mrr: 87400, new: 8200, churn: 2100 }, { month: "Nov", mrr: 93500, new: 9100, churn: 3000 },
  { month: "Dec", mrr: 99600, new: 8200, churn: 2100 }, { month: "Jan", mrr: 105800, new: 9400, churn: 3200 },
  { month: "Feb", mrr: 112200, new: 8800, churn: 2400 }, { month: "Mar", mrr: 118650, new: 9100, churn: 2650 },
];

const clients = [
  { name: "Apex Tech Corp", mrr: 8400, contracts: 3, margin: 68, utilization: 92, health: "Green" },
  { name: "Meridian Financial", mrr: 12200, contracts: 5, margin: 74, utilization: 87, health: "Green" },
  { name: "Blue Sky Design", mrr: 4100, contracts: 2, margin: 61, utilization: 78, health: "Yellow" },
  { name: "Harbor Legal", mrr: 6800, contracts: 3, margin: 71, utilization: 95, health: "Green" },
  { name: "Coastal Properties", mrr: 3200, contracts: 1, margin: 54, utilization: 62, health: "Red" },
  { name: "Summit Healthcare", mrr: 9400, contracts: 4, margin: 66, utilization: 89, health: "Green" },
];

const techMetrics = [
  { name: "J. Martinez", billable: 142, nonBillable: 18, utilization: 88, revenue: "$14,200" },
  { name: "S. Park", billable: 128, nonBillable: 32, utilization: 80, revenue: "$12,800" },
  { name: "K. Wilson", billable: 156, nonBillable: 12, utilization: 93, revenue: "$18,720" },
  { name: "A. Patel", billable: 118, nonBillable: 42, utilization: 74, revenue: "$11,800" },
];

const healthColor: Record<string, string> = {
  Green: "text-emerald-400", Yellow: "text-amber-400", Red: "text-red-400",
};

export default function MRRDashboard() {
  const currentMRR = mrrTrend[mrrTrend.length - 1].mrr;
  const prevMRR = mrrTrend[mrrTrend.length - 2].mrr;
  const growth = (((currentMRR - prevMRR) / prevMRR) * 100).toFixed(1);
  const arr = currentMRR * 12;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <DollarSign className="w-6 h-6 text-primary" />
          Financial Dashboard — MRR & Profitability
        </h1>
        <p className="text-sm text-muted-foreground mt-1">MRR, contract profitability, technician utilization, and client revenue analytics</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Monthly Recurring Revenue", value: `$${(currentMRR / 1000).toFixed(1)}k`, sub: `+${growth}% MoM`, color: "text-emerald-400" },
          { label: "Annual Run Rate (ARR)", value: `$${(arr / 1000000).toFixed(2)}M`, sub: "Contracted", color: "text-sky-400" },
          { label: "Avg Gross Margin", value: `${Math.round(clients.reduce((a, c) => a + c.margin, 0) / clients.length)}%`, sub: "Across all clients", color: "text-primary" },
          { label: "Tech Utilization", value: "84%", sub: "Target: 80% — Achieved", color: "text-amber-400" },
        ].map(({ label, value, sub, color }) => (
          <Card key={label}><CardContent className="p-4"><p className="text-xs text-muted-foreground">{label}</p><p className={`text-2xl font-bold ${color}`}>{value}</p><p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p></CardContent></Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">MRR Growth — 6 Month Trend</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={mrrTrend} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} />
                  <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} formatter={(v: number | string) => [`$${Number(v).toLocaleString()}`, ""]} />
                  <Area type="monotone" dataKey="mrr" name="MRR" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.15} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Technician Utilization & Revenue</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {techMetrics.map((t) => (
                  <div key={t.name} className="flex items-center gap-4">
                    <div className="w-24 shrink-0">
                      <p className="text-xs font-semibold">{t.name}</p>
                      <p className="text-[10px] text-muted-foreground">{t.billable}h billable</p>
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between text-[10px] mb-0.5">
                        <span className="text-muted-foreground">Utilization</span>
                        <span className={t.utilization >= 85 ? "text-emerald-400 font-bold" : t.utilization >= 75 ? "text-amber-400" : "text-red-400"}>{t.utilization}%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${t.utilization >= 85 ? "bg-emerald-500" : t.utilization >= 75 ? "bg-amber-500" : "bg-red-500"}`} style={{ width: `${t.utilization}%` }} />
                      </div>
                    </div>
                    <span className="text-sm font-bold text-emerald-400 shrink-0">{t.revenue}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Client MRR & Margin</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {clients.map((c) => (
                <div key={c.name} className="p-2.5 rounded-lg bg-muted/40">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold truncate flex-1">{c.name}</p>
                    <span className={`text-xs font-bold ${healthColor[c.health]} ml-2`}>●</span>
                  </div>
                  <div className="flex justify-between mt-1 text-[10px]">
                    <span className="text-emerald-400 font-semibold">${c.mrr.toLocaleString()}/mo</span>
                    <span className="text-muted-foreground">Margin: {c.margin}%</span>
                    <span className="text-muted-foreground">Util: {c.utilization}%</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
