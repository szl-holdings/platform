import { Card, CardContent, CardHeader, CardTitle } from "@szl-holdings/shared-ui/ui/card";
import { Badge } from "@szl-holdings/shared-ui/ui/badge";
import { Network, TrendingUp, DollarSign, BarChart3, ArrowUpRight, Globe } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { usePageMeta } from "@/hooks/usePageMeta";

const portfolio = [
  { name: "FORGE", sector: "Execution Fabric · ENGINE", stage: "Core", ownership: 100, arr: "$5.1M", growth: "+148%", headcount: 22, color: "#6366f1", status: "Hypergrowth" },
  { name: "KORA", sector: "Decision Intelligence · PRISM", stage: "Growth", ownership: 100, arr: "$3.1M", growth: "+28%", headcount: 21, color: "#f59e0b", status: "Scaling" },
  { name: "SEXTANT", sector: "Maritime Intelligence", stage: "Growth", ownership: 100, arr: "$1.8M", growth: "+51%", headcount: 12, color: "#06b6d4", status: "Scaling" },
  { name: "DOMAINE", sector: "Property Intelligence · OBSERVE", stage: "Growth", ownership: 100, arr: "$2.4M", growth: "+34%", headcount: 18, color: "#4d7c0f", status: "Scaling" },
  { name: "PARAGON", sector: "Defense & Intelligence", stage: "Growth", ownership: 100, arr: "$2.4M", growth: "+84%", headcount: 28, color: "#6366f1", status: "Hypergrowth" },
  { name: "SZL Cortex", sector: "AI Research · MLOps", stage: "Early", ownership: 100, arr: "$0.4M", growth: "+93%", headcount: 6, color: "#a855f7", status: "Hypergrowth" },
  { name: "Carlota Jo", sector: "Consulting", stage: "Mature", ownership: 100, arr: "$4.4M", growth: "+18%", headcount: 14, color: "#64748b", status: "Profitable" },
];

const totalARR = portfolio.reduce((a, p) => {
  const val = parseFloat(p.arr.replace(/[$M]/g, ""));
  return a + val;
}, 0);

const combinedGrowthData = [
  { month: "Oct", arr: 15.2 }, { month: "Nov", arr: 16.8 }, { month: "Dec", arr: 17.4 },
  { month: "Jan", arr: 19.1 }, { month: "Feb", arr: 20.3 }, { month: "Mar", arr: 21.8 },
];

const statusColor: Record<string, string> = {
  Scaling: "text-sky-400 bg-sky-500/10 border-sky-500/20",
  Hypergrowth: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  Profitable: "text-amber-400 bg-amber-500/10 border-amber-500/20",
};

export default function EcosystemViz() {
  const __pageMeta = usePageMeta({
    title: "Ecosystem | SZL Holdings – Portfolio Visualization & Analytics",
    description: "Interactive visualization of the SZL Holdings technology ecosystem. Explore portfolio companies, revenue metrics, growth trajectories, and organizational data.",
    canonical: "https://szlholdings.com/ecosystem",
  });
  const totalHeadcount = portfolio.reduce((a, p) => a + p.headcount, 0);

  return (
    <>
      {__pageMeta}
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Network className="w-6 h-6 text-primary" />
            SZL Ecosystem Overview
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Combined performance metrics across all portfolio companies — real-time ecosystem intelligence</p>
        </div>
  
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Combined ARR", value: `$${totalARR.toFixed(1)}M`, color: "text-emerald-400" },
            { label: "Portfolio Companies", value: portfolio.length, color: "text-sky-400" },
            { label: "Total Headcount", value: totalHeadcount, color: "text-primary" },
            { label: "Fastest Growth", value: "Alloy +148%", color: "text-indigo-400" },
          ].map(({ label, value, color }) => (
            <Card key={label}><CardContent className="p-4"><p className="text-xs text-muted-foreground">{label}</p><p className={`text-xl font-bold ${color}`}>{value}</p></CardContent></Card>
          ))}
        </div>
  
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Combined ARR Growth Trajectory ($M)</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={combinedGrowthData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} />
                    <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} tickFormatter={v => `$${v}M`} />
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} formatter={(v: number | string) => [`$${v}M`, "Combined ARR"]} />
                    <Area type="monotone" dataKey="arr" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.15} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
  
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">ARR by Company</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {portfolio.sort((a, b) => parseFloat(b.arr.replace(/[$M]/g,"")) - parseFloat(a.arr.replace(/[$M]/g,""))).map((p) => (
                <div key={p.name} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ background: p.color }} />
                  <span className="text-xs text-muted-foreground flex-1">{p.name}</span>
                  <span className="text-xs font-semibold">{p.arr}</span>
                  <span className={`text-[10px] ${parseFloat(p.growth) >= 50 ? "text-emerald-400" : "text-sky-400"}`}>{p.growth}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
  
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {portfolio.map((p) => (
            <Card key={p.name} className="hover:border-primary/30 transition-colors cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="w-8 h-8 rounded-lg mb-2 flex items-center justify-center" style={{ background: `${p.color}20` }}>
                      <Globe className="w-4 h-4" style={{ color: p.color }} />
                    </div>
                    <p className="font-bold text-sm">{p.name}</p>
                    <p className="text-[10px] text-muted-foreground">{p.sector}</p>
                  </div>
                  <Badge variant="outline" className={`text-[10px] ${statusColor[p.status]}`}>{p.status}</Badge>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div><p className="text-muted-foreground text-[10px]">ARR</p><p className="font-semibold text-emerald-400">{p.arr}</p></div>
                  <div><p className="text-muted-foreground text-[10px]">Growth</p><p className="font-semibold text-sky-400">{p.growth}</p></div>
                  <div><p className="text-muted-foreground text-[10px]">Stage</p><p className="font-semibold">{p.stage}</p></div>
                  <div><p className="text-muted-foreground text-[10px]">Team</p><p className="font-semibold">{p.headcount}</p></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
        </>
  );
}
