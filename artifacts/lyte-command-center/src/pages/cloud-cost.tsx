import { Card, CardContent, CardHeader, CardTitle } from "@workspace/shared-ui/ui/card";
import { Badge } from "@workspace/shared-ui/ui/badge";
import { DollarSign, TrendingUp, TrendingDown, Cloud, AlertTriangle, Zap } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from "recharts";

const costByService = [
  { service: "EC2 Instances", monthly: 48420, waste: 12800, provider: "AWS", trend: "+8%" },
  { service: "RDS Databases", monthly: 23100, waste: 3200, provider: "AWS", trend: "+2%" },
  { service: "S3 Storage", monthly: 8930, waste: 1200, provider: "AWS", trend: "+15%" },
  { service: "GKE Clusters", monthly: 31200, waste: 8400, provider: "GCP", trend: "-3%" },
  { service: "CloudFront CDN", monthly: 4200, waste: 800, provider: "AWS", trend: "+1%" },
  { service: "Lambda Functions", monthly: 2100, waste: 400, provider: "AWS", trend: "+22%" },
];

const monthlyTrend = [
  { month: "Oct", cost: 98400 }, { month: "Nov", cost: 102100 }, { month: "Dec", cost: 108300 },
  { month: "Jan", cost: 112800 }, { month: "Feb", cost: 109200 }, { month: "Mar", cost: 117950 },
];

const recommendations = [
  { action: "Right-size 23 over-provisioned EC2 instances", saving: "$12,800/mo", effort: "Low", confidence: 94 },
  { action: "Switch 8 RDS instances to Aurora Serverless v2", saving: "$6,200/mo", effort: "Medium", confidence: 87 },
  { action: "Enable S3 Intelligent-Tiering on 3 buckets", saving: "$2,100/mo", effort: "Low", confidence: 99 },
  { action: "Consolidate 4 underutilized GKE node pools", saving: "$8,400/mo", effort: "Medium", confidence: 82 },
  { action: "Delete 47 idle Elastic IPs", saving: "$340/mo", effort: "Low", confidence: 100 },
];

const COLORS = ["#3b82f6", "#06b6d4", "#22c55e", "#8b5cf6", "#f97316", "#eab308"];

const pieData = costByService.map(s => ({ name: s.service.split(" ")[0], value: s.monthly }));

export default function CloudCost() {
  const totalMonthly = costByService.reduce((a, s) => a + s.monthly, 0);
  const totalWaste = costByService.reduce((a, s) => a + s.waste, 0);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <DollarSign className="w-6 h-6 text-cyan-400" />
          Cloud Cost Monitoring
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Cloud spend tracking, waste identification, and optimization recommendations</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Monthly Cloud Spend", value: `$${(totalMonthly / 1000).toFixed(0)}k`, color: "text-foreground" },
          { label: "Identified Waste", value: `$${(totalWaste / 1000).toFixed(0)}k`, color: "text-red-400" },
          { label: "Savings Opportunity", value: `$${(recommendations.reduce((a, r) => a + parseFloat(r.saving.replace(/[$,\/mo]/g, "")), 0) / 1000).toFixed(1)}k/mo`, color: "text-emerald-400" },
          { label: "MoM Change", value: "+7.9%", color: "text-amber-400" },
        ].map(({ label, value, color }) => (
          <Card key={label}><CardContent className="p-4"><p className="text-xs text-muted-foreground">{label}</p><p className={`text-2xl font-bold ${color}`}>{value}</p></CardContent></Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Monthly Spend Trend</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={monthlyTrend} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#94a3b8" }} />
                  <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} formatter={(v: number | string) => [`$${Number(v).toLocaleString()}`, "Cost"]} />
                  <Bar dataKey="cost" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Cost Optimization Recommendations</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {recommendations.map((r, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/40 hover:bg-muted transition-colors">
                  <div className="flex-1">
                    <p className="text-xs font-medium">{r.action}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-[10px]">{r.effort} Effort</Badge>
                      <span className="text-[10px] text-muted-foreground">{r.confidence}% confidence</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    <p className="text-sm font-bold text-emerald-400">{r.saving}</p>
                    <button className="text-[10px] text-primary hover:underline mt-0.5">Apply</button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Spend by Service</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" outerRadius={70} dataKey="value">
                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} formatter={(v: number | string) => [`$${Number(v).toLocaleString()}`, "Monthly"]} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Service Breakdown</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {costByService.map((s, i) => (
                <div key={s.service} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: COLORS[i] }} />
                    <span className="text-muted-foreground">{s.service.split(" ")[0]}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">${(s.monthly / 1000).toFixed(1)}k</span>
                    <span className={`text-[10px] ${s.trend.startsWith("+") ? "text-red-400" : "text-emerald-400"}`}>{s.trend}</span>
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
