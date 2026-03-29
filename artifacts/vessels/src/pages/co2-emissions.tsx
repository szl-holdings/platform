import { useQuery } from "@tanstack/react-query";
import { dataProvider } from "@/data/data-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Leaf, Fuel, TrendingDown, BarChart3, Ship, ArrowDownRight, ArrowUpRight } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend, AreaChart, Area, PieChart, Pie, Cell } from "recharts";
import { useState } from "react";

const ciiColors: Record<string, string> = {
  A: "#22c55e",
  B: "#84cc16",
  C: "#eab308",
  D: "#f97316",
  E: "#ef4444",
};

const ciiBadgeColors: Record<string, string> = {
  A: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  B: "bg-lime-500/10 text-lime-400 border-lime-500/20",
  C: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  D: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  E: "bg-red-500/10 text-red-400 border-red-500/20",
};

export default function CO2EmissionsPage() {
  const { data: vessels = [] } = useQuery({ queryKey: ["co2-vessels"], queryFn: () => dataProvider.getVessels() });
  const { data: emissions = [] } = useQuery({ queryKey: ["emissions"], queryFn: () => dataProvider.getEmissionRecords() });
  const [selectedVessel, setSelectedVessel] = useState<number | null>(null);

  const filteredEmissions = selectedVessel ? emissions.filter(e => e.vesselId === selectedVessel) : emissions;

  const monthlyTotals: Record<string, { co2: number; fuel: number; distance: number }> = {};
  filteredEmissions.forEach(e => {
    if (!monthlyTotals[e.month]) monthlyTotals[e.month] = { co2: 0, fuel: 0, distance: 0 };
    monthlyTotals[e.month].co2 += e.co2Emissions;
    monthlyTotals[e.month].fuel += e.fuelConsumed;
    monthlyTotals[e.month].distance += e.distanceTraveled;
  });
  const monthlyData = Object.entries(monthlyTotals).sort(([a], [b]) => a.localeCompare(b)).map(([month, d]) => ({
    month: month.slice(5),
    co2: Math.round(d.co2 / 1000),
    fuel: Math.round(d.fuel / 1000),
  }));

  const totalCO2 = filteredEmissions.reduce((s, e) => s + e.co2Emissions, 0);
  const totalFuel = filteredEmissions.reduce((s, e) => s + e.fuelConsumed, 0);

  const ciiDistribution: Record<string, number> = {};
  vessels.forEach(v => { ciiDistribution[v.ciiRating] = (ciiDistribution[v.ciiRating] || 0) + 1; });
  const ciiPieData = Object.entries(ciiDistribution).map(([rating, count]) => ({ name: rating, value: count }));

  const vesselEmissions = vessels.map(v => ({
    name: v.name,
    co2Daily: v.co2EmissionsDaily,
    ciiRating: v.ciiRating,
    eexi: v.eexi,
  })).filter(v => v.co2Daily > 0).sort((a, b) => b.co2Daily - a.co2Daily);

  const compliancePathway = [
    { year: "2023", target: 100, actual: 100 },
    { year: "2024", target: 95, actual: 97 },
    { year: "2025", target: 89, actual: 91 },
    { year: "2026", target: 83, actual: 85 },
    { year: "2027", target: 77, actual: null },
    { year: "2028", target: 72, actual: null },
    { year: "2030", target: 60, actual: null },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between animate-fade-in-up">
        <div>
          <h1 className="font-display text-2xl font-bold flex items-center gap-2 tracking-tight uppercase">
            <Leaf className="w-6 h-6 text-emerald-400" /> Emissions & CII Monitoring
          </h1>
          <p className="text-xs text-muted-foreground mt-1 tracking-wider font-mono">MARPOL ANNEX VI REG. 28 // IMO DCS // EU MRV 2015/757 // EU ETS MARITIME</p>
        </div>
        <select
          className="bg-card border border-border rounded-lg px-3 py-1.5 text-sm text-foreground"
          value={selectedVessel ?? ""}
          onChange={e => setSelectedVessel(e.target.value ? Number(e.target.value) : null)}
        >
          <option value="">All Vessels</option>
          {vessels.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-fade-in-up stagger-1">
        <Card className="bg-card border-border hover:border-emerald-500/20 transition-all group">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Total CO2 (9mo)</p>
                <p className="text-2xl font-bold font-display mt-1">{(totalCO2 / 1000).toFixed(0)}K<span className="text-sm text-muted-foreground"> MT</span></p>
                <div className="flex items-center gap-1 mt-1">
                  <ArrowDownRight className="w-3 h-3 text-emerald-400" />
                  <span className="text-xs text-emerald-400">-2.8% vs prior period</span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center group-hover:scale-110 transition-transform"><Leaf className="w-5 h-5 text-emerald-400" /></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border hover:border-primary/20 transition-all group">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Fuel (9mo)</p>
                <p className="text-2xl font-bold font-display mt-1">{(totalFuel / 1000).toFixed(0)}K<span className="text-sm text-muted-foreground"> MT</span></p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform"><Fuel className="w-5 h-5 text-primary" /></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border hover:border-amber-500/20 transition-all group">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Fleet Avg CII</p>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-2xl font-bold font-display">{vessels.length > 0 ? (() => {
                    const ciiMap: Record<string, number> = { A: 1, B: 2, C: 3, D: 4, E: 5 };
                    const avg = vessels.reduce((s, v) => s + (ciiMap[v.ciiRating] || 3), 0) / vessels.length;
                    return avg.toFixed(1);
                  })() : "—"}</p>
                  <Badge variant="outline" className={ciiBadgeColors[Object.entries(ciiDistribution).sort((a, b) => b[1] - a[1])[0]?.[0] || "B"]}>
                    {Object.entries(ciiDistribution).sort((a, b) => b[1] - a[1])[0]?.[0] || "B"}
                  </Badge>
                </div>
              </div>
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center group-hover:scale-110 transition-transform"><BarChart3 className="w-5 h-5 text-amber-400" /></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border hover:border-chart-3/20 transition-all group">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">CII A+B Rated</p>
                <p className="text-2xl font-bold font-display mt-1 text-emerald-400">{((ciiDistribution["A"] || 0) + (ciiDistribution["B"] || 0))}/{vessels.length}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-chart-3/10 flex items-center justify-center group-hover:scale-110 transition-transform"><Ship className="w-5 h-5 text-chart-3" /></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card border-border animate-fade-in-up stagger-2">
          <CardHeader className="pb-2">
            <CardTitle className="font-display text-base flex items-center gap-2">
              <Leaf className="w-5 h-5 text-emerald-400" /> Monthly CO2 & Fuel Consumption
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" stroke="rgba(255,255,255,0.4)" fontSize={12} />
                <YAxis stroke="rgba(255,255,255,0.4)" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                <Legend />
                <Bar dataKey="co2" name="CO2 (K MT)" fill="#22c55e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="fuel" name="Fuel (K MT)" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-card border-border animate-fade-in-up stagger-3">
          <CardHeader className="pb-2">
            <CardTitle className="font-display text-base flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-amber-400" /> CII Rating Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-8">
              <ResponsiveContainer width="50%" height={220}>
                <PieChart>
                  <Pie data={ciiPieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                    {ciiPieData.map((entry) => <Cell key={entry.name} fill={ciiColors[entry.name] || "#666"} />)}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-3 flex-1">
                {["A", "B", "C", "D", "E"].filter(r => ciiDistribution[r]).map(rating => (
                  <div key={rating} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: ciiColors[rating] }} />
                      <span className="text-sm font-medium">CII {rating}</span>
                    </div>
                    <span className="text-sm font-bold">{ciiDistribution[rating]} vessel{ciiDistribution[rating] > 1 ? "s" : ""}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border-border animate-fade-in-up stagger-4">
        <CardHeader className="pb-2">
          <CardTitle className="font-display text-base flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-primary" /> IMO Compliance Pathway (CII Reference Line Index)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={compliancePathway}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="year" stroke="rgba(255,255,255,0.4)" fontSize={12} />
              <YAxis stroke="rgba(255,255,255,0.4)" fontSize={12} domain={[40, 110]} />
              <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
              <Legend />
              <Area type="monotone" dataKey="target" name="IMO Target" stroke="#22c55e" fill="#22c55e" fillOpacity={0.1} strokeWidth={2} />
              <Line type="monotone" dataKey="actual" name="Fleet Actual" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: "hsl(var(--primary))", r: 4 }} connectNulls={false} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="bg-card border-border animate-fade-in-up stagger-5">
        <CardHeader className="pb-2">
          <CardTitle className="font-display text-base flex items-center gap-2">
            <Ship className="w-5 h-5 text-primary" /> Vessel Emissions Ranking
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {vesselEmissions.map((v, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-border bg-background/50 hover:border-primary/20 transition-all">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-6 text-right">{i + 1}</span>
                  <p className="text-sm font-semibold">{v.name}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-mono">{v.co2Daily} MT/day</span>
                  <Badge variant="outline" className={`text-xs ${ciiBadgeColors[v.ciiRating]}`}>CII {v.ciiRating}</Badge>
                  <span className="text-xs text-muted-foreground">EEXI: {v.eexi}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
