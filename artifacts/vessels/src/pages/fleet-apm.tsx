import { useQuery } from "@tanstack/react-query";
import { dataProvider } from "@/data/data-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, DollarSign, BarChart3, Ship, Activity, Gauge, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend, Area, AreaChart } from "recharts";

export default function FleetAPMPage() {
  const { data: vessels = [] } = useQuery({ queryKey: ["apm-vessels"], queryFn: () => dataProvider.getVessels() });
  const { data: kpis } = useQuery({ queryKey: ["fleet-kpis"], queryFn: () => dataProvider.getFleetKPIs() });

  const activeVessels = vessels.filter(v => v.tce > 0);
  const avgTCE = activeVessels.length > 0 ? Math.round(activeVessels.reduce((s, v) => s + v.tce, 0) / activeVessels.length) : 0;
  const avgUtil = vessels.length > 0 ? Math.round(vessels.reduce((s, v) => s + v.utilization, 0) / vessels.length * 10) / 10 : 0;
  const topPerformers = [...vessels].sort((a, b) => b.tce - a.tce).slice(0, 5);
  const bottomPerformers = [...vessels].filter(v => v.tce > 0).sort((a, b) => a.tce - b.tce).slice(0, 5);

  const utilizationData = vessels.filter(v => v.utilization > 0).map(v => ({
    name: v.name,
    utilization: v.utilization,
    target: 90,
  }));

  const tceByType: Record<string, { count: number; total: number }> = {};
  vessels.forEach(v => {
    if (!tceByType[v.vesselType]) tceByType[v.vesselType] = { count: 0, total: 0 };
    if (v.tce > 0) { tceByType[v.vesselType].count++; tceByType[v.vesselType].total += v.tce; }
  });
  const marketTrendData = Object.entries(tceByType).filter(([, d]) => d.count > 0).map(([type, d]) => ({
    type: type.charAt(0).toUpperCase() + type.slice(1),
    avgTCE: Math.round(d.total / d.count),
    benchmark: type === "container" ? 22000 : type === "tanker" ? 28000 : type === "bulk" ? 14000 : 16000,
  }));

  const monthlyTrend = [
    { month: "Oct", tce: 19800, market: 18500 },
    { month: "Nov", tce: 20100, market: 19200 },
    { month: "Dec", tce: 20500, market: 19800 },
    { month: "Jan", tce: 21000, market: 20100 },
    { month: "Feb", tce: 21200, market: 20400 },
    { month: "Mar", tce: avgTCE, market: 20800 },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="animate-fade-in-up">
        <h1 className="font-display text-2xl font-bold flex items-center gap-2 tracking-tight uppercase">
          <BarChart3 className="w-6 h-6 text-primary" /> Fleet Performance Monitor
        </h1>
        <p className="text-xs text-muted-foreground mt-1 tracking-wider font-mono">TCE ANALYTICS // UTILIZATION TRACKING // MARKET BENCHMARKS // VOYAGE P&L</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-fade-in-up stagger-1">
        <Card className="bg-card border-border hover:border-emerald-500/20 transition-all group">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Avg TCE</p>
                <p className="text-2xl font-bold font-display mt-1 text-emerald-400">${avgTCE.toLocaleString()}</p>
                <div className="flex items-center gap-1 mt-1">
                  <ArrowUpRight className="w-3 h-3 text-emerald-400" />
                  <span className="text-xs text-emerald-400">+3.2% vs last month</span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center group-hover:scale-110 transition-transform"><DollarSign className="w-5 h-5 text-emerald-400" /></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border hover:border-primary/20 transition-all group">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Fleet Utilization</p>
                <p className="text-2xl font-bold font-display mt-1">{avgUtil}%</p>
                <div className="flex items-center gap-1 mt-1">
                  <ArrowUpRight className="w-3 h-3 text-emerald-400" />
                  <span className="text-xs text-emerald-400">+0.5% vs last month</span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform"><Gauge className="w-5 h-5 text-primary" /></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border hover:border-chart-3/20 transition-all group">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Active Vessels</p>
                <p className="text-2xl font-bold font-display mt-1">{activeVessels.length}/{vessels.length}</p>
                <div className="flex items-center gap-1 mt-1">
                  <Ship className="w-3 h-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{vessels.filter(v => v.status === "at_sea").length} at sea</span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-lg bg-chart-3/10 flex items-center justify-center group-hover:scale-110 transition-transform"><Activity className="w-5 h-5 text-chart-3" /></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border hover:border-amber-500/20 transition-all group">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Avg EEXI</p>
                <p className="text-2xl font-bold font-display mt-1">{vessels.length > 0 ? (vessels.reduce((s, v) => s + v.eexi, 0) / vessels.length).toFixed(1) : 0}</p>
                <div className="flex items-center gap-1 mt-1">
                  <ArrowDownRight className="w-3 h-3 text-emerald-400" />
                  <span className="text-xs text-emerald-400">-2.1% improving</span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center group-hover:scale-110 transition-transform"><TrendingDown className="w-5 h-5 text-amber-400" /></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card border-border animate-fade-in-up stagger-2">
          <CardHeader className="pb-2">
            <CardTitle className="font-display text-base flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" /> TCE Trend vs Market
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" stroke="rgba(255,255,255,0.4)" fontSize={12} />
                <YAxis stroke="rgba(255,255,255,0.4)" fontSize={12} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} formatter={(v: number) => [`$${v.toLocaleString()}/day`, ""]} />
                <Legend />
                <Area type="monotone" dataKey="tce" name="Fleet TCE" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.1} strokeWidth={2} />
                <Area type="monotone" dataKey="market" name="Market Avg" stroke="hsl(var(--muted-foreground))" fill="hsl(var(--muted-foreground))" fillOpacity={0.05} strokeWidth={1} strokeDasharray="5 5" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-card border-border animate-fade-in-up stagger-3">
          <CardHeader className="pb-2">
            <CardTitle className="font-display text-base flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-chart-2" /> TCE by Vessel Type vs Benchmark
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={marketTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="type" stroke="rgba(255,255,255,0.4)" fontSize={12} />
                <YAxis stroke="rgba(255,255,255,0.4)" fontSize={12} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} formatter={(v: number) => [`$${v.toLocaleString()}/day`, ""]} />
                <Legend />
                <Bar dataKey="avgTCE" name="Fleet Avg" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="benchmark" name="Market Benchmark" fill="rgba(255,255,255,0.15)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border-border animate-fade-in-up stagger-4">
        <CardHeader className="pb-2">
          <CardTitle className="font-display text-base flex items-center gap-2">
            <Gauge className="w-5 h-5 text-chart-3" /> Vessel Utilization Rates
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={utilizationData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis type="number" domain={[0, 100]} stroke="rgba(255,255,255,0.4)" fontSize={12} tickFormatter={v => `${v}%`} />
              <YAxis type="category" dataKey="name" stroke="rgba(255,255,255,0.4)" fontSize={11} width={120} />
              <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} formatter={(v: number) => [`${v}%`, ""]} />
              <Bar dataKey="utilization" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              <Bar dataKey="target" fill="rgba(255,255,255,0.08)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card border-border animate-fade-in-up stagger-5">
          <CardHeader className="pb-2">
            <CardTitle className="font-display text-base flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-400" /> Top Performers (TCE)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topPerformers.map((v, i) => (
                <div key={v.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-background/50 hover:border-emerald-500/20 transition-all">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold flex items-center justify-center">{i + 1}</span>
                    <div>
                      <p className="text-sm font-semibold">{v.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">{v.vesselType} · {v.flag}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-emerald-400">${v.tce.toLocaleString()}/day</p>
                    <p className="text-xs text-muted-foreground">{v.utilization}% util</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border animate-fade-in-up stagger-6">
          <CardHeader className="pb-2">
            <CardTitle className="font-display text-base flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-amber-400" /> Underperformers (TCE)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {bottomPerformers.map((v, i) => (
                <div key={v.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-background/50 hover:border-amber-500/20 transition-all">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-amber-500/10 text-amber-400 text-xs font-bold flex items-center justify-center">{i + 1}</span>
                    <div>
                      <p className="text-sm font-semibold">{v.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">{v.vesselType} · {v.flag}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-amber-400">${v.tce.toLocaleString()}/day</p>
                    <Badge variant="outline" className={`text-xs ${v.utilization < 85 ? "bg-red-500/10 text-red-400" : "bg-amber-500/10 text-amber-400"}`}>{v.utilization}%</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
