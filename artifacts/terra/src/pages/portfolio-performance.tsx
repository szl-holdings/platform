import { lazy, Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@szl-holdings/shared-ui/ui/card";
import { Badge } from "@szl-holdings/shared-ui/ui/badge";
import { TrendingUp, DollarSign, BarChart3, Target, Building2, Percent, Map } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar } from "recharts";
import { Link } from "wouter";
import { properties } from "@/data/portfolio";
import { useMapboxToken } from "@/hooks/use-mapbox-token";

const PropertyMap = lazy(() => import("@/components/property-map"));

const portfolio = [
  { property: "One Market Plaza", type: "Office", acquisition: "$124M", currentValue: "$156M", irr: 18.4, cashOnCash: 7.2, equityMultiple: 2.1, noi: "$8.4M", status: "Performing" },
  { property: "Pacific Heights Apts", type: "Multifamily", acquisition: "$67M", currentValue: "$89M", irr: 22.1, cashOnCash: 5.8, equityMultiple: 2.8, noi: "$4.1M", status: "Outperforming" },
  { property: "South Beach Retail", type: "Retail", acquisition: "$41M", currentValue: "$38M", irr: -2.3, cashOnCash: 2.1, equityMultiple: 0.9, noi: "$1.8M", status: "Underperforming" },
  { property: "Silicon Valley Industrial", type: "Industrial", acquisition: "$88M", currentValue: "$127M", irr: 31.2, cashOnCash: 9.4, equityMultiple: 3.2, noi: "$11.2M", status: "Outperforming" },
  { property: "Austin Mixed-Use Tower", type: "Mixed-Use", acquisition: "$103M", currentValue: "$118M", irr: 12.7, cashOnCash: 6.1, equityMultiple: 1.7, noi: "$6.8M", status: "Performing" },
];

const cashflowData = [
  { year: "2022", noi: 28.4, distributions: 18.2 }, { year: "2023", noi: 30.1, distributions: 21.4 },
  { year: "2024", noi: 31.8, distributions: 22.7 }, { year: "2025", noi: 34.2, distributions: 25.1 },
  { year: "2026E", noi: 36.8, distributions: 27.3 },
];

const statusStyle: Record<string, string> = {
  Outperforming: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  Performing: "text-sky-400 bg-sky-500/10 border-sky-500/20",
  Underperforming: "text-red-400 bg-red-500/10 border-red-500/20",
};

export default function PortfolioPerformance() {
  const { token } = useMapboxToken();
  const totalValue = 128;
  const avgIRR = portfolio.reduce((a, p) => a + p.irr, 0) / portfolio.length;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-primary" />
          Portfolio Performance
        </h1>
        <p className="text-sm text-muted-foreground mt-1">IRR, cash-on-cash, equity multiples, and NOI tracking across all portfolio assets</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Portfolio Value", value: "$528M", sub: "+$86M unrealized", color: "text-emerald-400" },
          { label: "Avg IRR", value: `${avgIRR.toFixed(1)}%`, sub: "Blended across holdings", color: "text-sky-400" },
          { label: "Total NOI (Ann.)", value: "$32.3M", sub: "+8.4% YoY", color: "text-primary" },
          { label: "DSCR Average", value: "1.47x", sub: "Well above 1.25x covenant", color: "text-emerald-400" },
        ].map(({ label, value, sub, color }) => (
          <Card key={label}><CardContent className="p-4"><p className="text-xs text-muted-foreground">{label}</p><p className={`text-2xl font-bold ${color}`}>{value}</p><p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p></CardContent></Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Portfolio NOI & Distribution History</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={cashflowData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="year" tick={{ fontSize: 11, fill: "#94a3b8" }} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} tickFormatter={v => `$${v}M`} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} formatter={(v: number | string) => [`$${v}M`, ""]} />
              <Bar dataKey="noi" name="NOI" fill="#06b6d4" radius={[4, 4, 0, 0]} />
              <Bar dataKey="distributions" name="Distributions" fill="#22c55e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader className="pb-0 flex flex-row items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Map className="w-4 h-4 text-primary" />
            Portfolio Geographic Distribution
          </CardTitle>
          <Link href="/property-map" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            Full map →
          </Link>
        </CardHeader>
        <CardContent className="p-0 mt-3">
          <div className="h-[300px] relative">
            {token ? (
              <Suspense fallback={
                <div className="absolute inset-0 flex items-center justify-center bg-[#08101e]">
                  <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                </div>
              }>
                <PropertyMap properties={properties} token={token} height="300px" showPanel={false} />
              </Suspense>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-[#08101e]">
                <p className="text-xs text-muted-foreground">Loading map…</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {portfolio.map((p) => (
          <Card key={p.property}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm">{p.property}</span>
                    <Badge variant="outline" className="text-[10px]">{p.type}</Badge>
                    <Badge variant="outline" className={`text-[10px] ${statusStyle[p.status]}`}>{p.status}</Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-4 mt-3 text-xs">
                    <div><p className="text-muted-foreground">Acquisition</p><p className="font-semibold">{p.acquisition}</p></div>
                    <div><p className="text-muted-foreground">Current Value</p><p className={`font-semibold ${parseFloat(p.currentValue.replace(/[$M]/g,"")) > parseFloat(p.acquisition.replace(/[$M]/g,"")) ? "text-emerald-400" : "text-red-400"}`}>{p.currentValue}</p></div>
                    <div><p className="text-muted-foreground">Annual NOI</p><p className="font-semibold">{p.noi}</p></div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 text-center shrink-0">
                  {[
                    { label: "IRR", value: `${p.irr}%`, color: p.irr > 0 ? "text-emerald-400" : "text-red-400" },
                    { label: "CoC", value: `${p.cashOnCash}%`, color: "text-sky-400" },
                    { label: "EM", value: `${p.equityMultiple}x`, color: "text-primary" },
                  ].map(({ label, value, color }) => (
                    <div key={label}>
                      <p className={`text-sm font-bold ${color}`}>{value}</p>
                      <p className="text-[10px] text-muted-foreground">{label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
