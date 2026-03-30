import { Card, CardContent, CardHeader, CardTitle } from "@workspace/shared-ui/ui/card";
import { Badge } from "@workspace/shared-ui/ui/badge";
import { Building2, TrendingUp, DollarSign, BarChart3, Globe, Shield, Zap, Brain } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const companies = [
  { name: "Firestorm", vertical: "Cybersecurity", stage: "Growth", arr: "$2.4M", growth: "+84%", employees: 28, valuation: "$18M", status: "Performing", icon: Shield, color: "#ef4444" },
  { name: "INCA", vertical: "AI / ML Research", stage: "Series A", arr: "$1.8M", growth: "+112%", employees: 19, valuation: "$22M", status: "Outperforming", icon: Brain, color: "#8b5cf6" },
  { name: "Terra", vertical: "PropTech", stage: "Growth", arr: "$3.1M", growth: "+61%", employees: 34, valuation: "$28M", status: "Performing", icon: Building2, color: "#10b981" },
  { name: "Vessels", vertical: "Maritime Tech", stage: "Series A", arr: "$1.2M", growth: "+48%", employees: 22, valuation: "$14M", status: "Performing", icon: Globe, color: "#3b82f6" },
  { name: "Lyte", vertical: "AIOps", stage: "Growth", arr: "$4.2M", growth: "+93%", employees: 41, valuation: "$35M", status: "Outperforming", icon: Zap, color: "#f59e0b" },
  { name: "Dreamscape", vertical: "Creative AI", stage: "Seed+", arr: "$680K", growth: "+220%", employees: 11, valuation: "$8M", status: "Scaling", icon: Brain, color: "#ec4899" },
];

const portfolioValue = [
  { year: "2021", value: 24 }, { year: "2022", value: 41 }, { year: "2023", value: 67 },
  { year: "2024", value: 98 }, { year: "2025", value: 142 }, { year: "2026E", value: 185 },
];

const sectorAllocation = [
  { name: "AIOps", value: 28, color: "#f59e0b" },
  { name: "PropTech", value: 22, color: "#10b981" },
  { name: "Cybersecurity", value: 18, color: "#ef4444" },
  { name: "AI Research", value: 17, color: "#8b5cf6" },
  { name: "Maritime", value: 10, color: "#3b82f6" },
  { name: "Creative AI", value: 5, color: "#ec4899" },
];

const statusStyle: Record<string, string> = {
  Outperforming: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  Performing: "text-sky-400 bg-sky-500/10 border-sky-500/20",
  Scaling: "text-violet-400 bg-violet-500/10 border-violet-500/20",
};

export default function PortfolioIntel() {
  const totalARR = companies.reduce((a, c) => a + parseFloat(c.arr.replace(/[$M]/g, "")), 0);

  return (
    <div className="min-h-screen bg-szl-bg text-szl-text p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-szl-text flex items-center gap-3">
            <BarChart3 className="w-7 h-7 text-szl-accent" />
            Portfolio Intelligence
          </h1>
          <p className="text-szl-text-secondary mt-2">Real-time performance, valuation, and growth metrics across the SZL Holdings venture portfolio.</p>
        </div>

        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "Portfolio Value", value: "$185M", sub: "2026 estimate", color: "text-szl-accent" },
            { label: "Total ARR", value: `$${totalARR.toFixed(1)}M`, sub: "Across 6 companies", color: "text-emerald-400" },
            { label: "Avg Growth Rate", value: "103%", sub: "YoY ARR growth", color: "text-emerald-400" },
            { label: "Portfolio Employees", value: "155", sub: "+42 this year", color: "text-szl-text" },
          ].map(({ label, value, sub, color }) => (
            <Card key={label} className="bg-szl-surface border-szl-border">
              <CardContent className="p-4">
                <p className="text-xs text-szl-text-secondary">{label}</p>
                <p className={`text-2xl font-bold ${color}`}>{value}</p>
                <p className="text-[10px] text-szl-text-secondary mt-0.5">{sub}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-6">
          <Card className="col-span-2 bg-szl-surface border-szl-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-szl-text">Portfolio Value Growth ($M)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={portfolioValue}>
                  <XAxis dataKey="year" tick={{ fontSize: 11, fill: "rgba(255,255,255,0.4)" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "rgba(255,255,255,0.4)" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: "#0a0f1e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }} />
                  <Area type="monotone" dataKey="value" stroke="#6c63ff" fill="#6c63ff" fillOpacity={0.15} strokeWidth={2} name="Value ($M)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="col-span-1 bg-szl-surface border-szl-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-szl-text">Sector Allocation</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={120}>
                <PieChart>
                  <Pie data={sectorAllocation} cx="50%" cy="50%" innerRadius={35} outerRadius={55} dataKey="value">
                    {sectorAllocation.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1 mt-2">
                {sectorAllocation.map(s => (
                  <div key={s.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                      <span className="text-[11px] text-szl-text-secondary">{s.name}</span>
                    </div>
                    <span className="text-[11px] font-medium text-szl-text">{s.value}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {companies.map(company => {
            const Icon = company.icon;
            return (
              <Card key={company.name} className="bg-szl-surface border-szl-border hover:border-szl-accent/30 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${company.color}20` }}>
                        <Icon className="w-4 h-4" style={{ color: company.color }} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-szl-text">{company.name}</p>
                        <p className="text-[10px] text-szl-text-secondary">{company.vertical}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className={`text-[9px] ${statusStyle[company.status]}`}>{company.status}</Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-black/20 rounded-lg p-2">
                      <p className="text-[9px] text-szl-text-secondary">ARR</p>
                      <p className="text-sm font-bold text-szl-text">{company.arr}</p>
                    </div>
                    <div className="bg-black/20 rounded-lg p-2">
                      <p className="text-[9px] text-szl-text-secondary">Growth</p>
                      <p className="text-sm font-bold text-emerald-400">{company.growth}</p>
                    </div>
                    <div className="bg-black/20 rounded-lg p-2">
                      <p className="text-[9px] text-szl-text-secondary">Val.</p>
                      <p className="text-sm font-bold text-szl-text">{company.valuation}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-szl-border">
                    <span className="text-[10px] text-szl-text-secondary">{company.stage}</span>
                    <span className="text-[10px] text-szl-text-secondary">{company.employees} employees</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
