import { TrendingUp, DollarSign, Building2, BarChart3, ArrowUp, ArrowDown, Target, PieChart, Calculator, Lock } from "lucide-react";
import { useRole } from "@szl-holdings/shared-ui";

const investmentMetrics = [
  { label: "Portfolio Value", value: "$47.2M", change: "+8.4%", trend: "up" },
  { label: "Avg Cap Rate", value: "6.8%", change: "+0.3%", trend: "up" },
  { label: "Occupancy Rate", value: "94.2%", change: "-0.8%", trend: "down" },
  { label: "NOI (Annual)", value: "$3.2M", change: "+12%", trend: "up" },
];

const properties = [
  { name: "Meridian Tower", type: "Office", value: 12500000, noi: 850000, capRate: 6.8, occupancy: 96, sqft: 45000 },
  { name: "Harbor View Residences", type: "Multi-Family", value: 8900000, noi: 624000, capRate: 7.0, occupancy: 98, sqft: 32000 },
  { name: "Tech Park Plaza", type: "Office", value: 15200000, noi: 988000, capRate: 6.5, occupancy: 88, sqft: 62000 },
  { name: "Sunset Retail Center", type: "Retail", value: 6400000, noi: 480000, capRate: 7.5, occupancy: 92, sqft: 18000 },
  { name: "Industrial Commons", type: "Industrial", value: 4200000, noi: 378000, capRate: 9.0, occupancy: 100, sqft: 28000 },
];

const marketComps = [
  { area: "Downtown Core", avgPrice: 425, avgRent: 32, capRate: 6.2, vacancy: 8.5, trend: "up" },
  { area: "Midtown", avgPrice: 380, avgRent: 28, capRate: 6.8, vacancy: 6.2, trend: "up" },
  { area: "Suburban Office", avgPrice: 220, avgRent: 18, capRate: 7.5, vacancy: 12.1, trend: "down" },
  { area: "Industrial District", avgPrice: 150, avgRent: 12, capRate: 8.2, vacancy: 3.8, trend: "up" },
];

export default function InvestmentAnalysis() {
  const { isInvestor, isAdmin, isLoading } = useRole();
  const totalValue = properties.reduce((a, p) => a + p.value, 0);
  const totalNOI = properties.reduce((a, p) => a + p.noi, 0);

  if (!isLoading && !isInvestor && !isAdmin) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3 max-w-xs">
          <div className="w-12 h-12 rounded-xl bg-muted border border-border flex items-center justify-center mx-auto">
            <Lock className="w-5 h-5 text-muted-foreground" />
          </div>
          <h2 className="font-display font-semibold text-foreground">Investor Access Required</h2>
          <p className="text-sm text-muted-foreground">Portfolio analysis is restricted to verified investors. Contact your account manager for access.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-primary" /> Investment Analysis
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Portfolio performance, cap rates, and market comparables</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {investmentMetrics.map((m) => (
          <div key={m.label} className="rounded-xl border border-border bg-card p-5">
            <div className="text-xs text-muted-foreground mb-2">{m.label}</div>
            <div className="text-2xl font-display font-bold">{m.value}</div>
            <div className={`flex items-center gap-1 text-xs mt-1 ${m.trend === "up" ? "text-emerald-400" : "text-red-400"}`}>
              {m.trend === "up" ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
              {m.change}
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="p-4 border-b border-border">
          <h2 className="font-display font-semibold flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-400" /> Property Portfolio
          </h2>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-border text-xs text-muted-foreground uppercase tracking-wider">
              <th className="text-left p-4">Property</th>
              <th className="text-right p-4">Value</th>
              <th className="text-right p-4">NOI</th>
              <th className="text-right p-4">Cap Rate</th>
              <th className="text-right p-4">Occupancy</th>
              <th className="text-right p-4">Sq Ft</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {properties.map((p) => (
              <tr key={p.name} className="hover:bg-muted/30">
                <td className="p-4">
                  <div className="text-sm font-medium">{p.name}</div>
                  <div className="text-xs text-muted-foreground">{p.type}</div>
                </td>
                <td className="p-4 text-right text-sm font-mono">${(p.value / 1000000).toFixed(1)}M</td>
                <td className="p-4 text-right text-sm font-mono">${(p.noi / 1000).toFixed(0)}K</td>
                <td className="p-4 text-right text-sm font-mono text-emerald-400">{p.capRate}%</td>
                <td className="p-4 text-right text-sm">{p.occupancy}%</td>
                <td className="p-4 text-right text-sm text-muted-foreground">{p.sqft.toLocaleString()}</td>
              </tr>
            ))}
            <tr className="bg-muted/30 font-semibold">
              <td className="p-4 text-sm">Total Portfolio</td>
              <td className="p-4 text-right text-sm font-mono">${(totalValue / 1000000).toFixed(1)}M</td>
              <td className="p-4 text-right text-sm font-mono">${(totalNOI / 1000).toFixed(0)}K</td>
              <td className="p-4 text-right text-sm font-mono text-emerald-400">{((totalNOI / totalValue) * 100).toFixed(1)}%</td>
              <td className="p-4 text-right text-sm">{Math.round(properties.reduce((a, p) => a + p.occupancy, 0) / properties.length)}%</td>
              <td className="p-4 text-right text-sm text-muted-foreground">{properties.reduce((a, p) => a + p.sqft, 0).toLocaleString()}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="font-display font-semibold mb-4 flex items-center gap-2">
          <Target className="w-4 h-4 text-amber-400" /> Market Comparables
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {marketComps.map((comp) => (
            <div key={comp.area} className="rounded-lg border border-border p-4">
              <h3 className="text-sm font-semibold mb-2">{comp.area}</h3>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between"><span className="text-muted-foreground">Avg $/sqft:</span><span className="font-mono">${comp.avgPrice}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Avg Rent:</span><span className="font-mono">${comp.avgRent}/sqft</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Cap Rate:</span><span className="font-mono text-emerald-400">{comp.capRate}%</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Vacancy:</span><span className={`font-mono ${comp.vacancy > 10 ? "text-red-400" : "text-emerald-400"}`}>{comp.vacancy}%</span></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
