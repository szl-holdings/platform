import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@szl-holdings/shared-ui/ui/card";
import { ArrowRight, Calculator, TrendingUp, Loader2 } from "lucide-react";
import { usePageMeta } from "@/hooks/usePageMeta";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from "recharts";

const GOLD = "var(--color-gold)";
const API = import.meta.env.BASE_URL + "api";

type CaseStudy = {
  client: string;
  investment: string;
  returnValue: string;
  roi: string;
  timeframe: string;
  driver: string;
  contractedValue?: number;
  returnNumeric?: number;
};

type RoiMetrics = {
  caseStudies: CaseStudy[];
  portfolioBenchmarks: {
    avgRoi: number;
    avgPaybackMonths: number;
    avgRateRealisationPct: number;
    blendedMarginPct: number;
    clientRetentionPct: number;
    npsScore: number;
  };
  roiTrendData: { month: string; avgRoi: number }[];
};

const STATIC_METRICS: RoiMetrics = {
  caseStudies: [
    { client: "Luminary Brands", investment: "£84,000", returnValue: "£312,000", roi: "271%", timeframe: "12 months", driver: "DTC conversion lift + brand authority", contractedValue: 84000, returnNumeric: 312000 },
    { client: "Oasis Wellness", investment: "£120,000", returnValue: "£610,000", roi: "408%", timeframe: "18 months", driver: "Category authority + earned media", contractedValue: 120000, returnNumeric: 610000 },
    { client: "Aurelius PE", investment: "£16,800", returnValue: "£98,000", roi: "483%", timeframe: "6 months", driver: "Portfolio value creation + leadership uplift", contractedValue: 16800, returnNumeric: 98000 },
    { client: "Vertex Capital", investment: "£120,000", returnValue: "£420,000+", roi: "250%+", timeframe: "24 months (projected)", driver: "M&A advisory — deal value & risk mitigation", contractedValue: 120000, returnNumeric: 420000 },
  ],
  portfolioBenchmarks: { avgRoi: 353, avgPaybackMonths: 11, avgRateRealisationPct: 94, blendedMarginPct: 47, clientRetentionPct: 88, npsScore: 72 },
  roiTrendData: [
    { month: "Oct 2025", avgRoi: 210 },
    { month: "Nov 2025", avgRoi: 265 },
    { month: "Dec 2025", avgRoi: 288 },
    { month: "Jan 2026", avgRoi: 310 },
    { month: "Feb 2026", avgRoi: 342 },
    { month: "Mar 2026", avgRoi: 353 },
    { month: "Apr 2026", avgRoi: 371 },
  ],
};

function RangeInput({ label, value, min, max, step = 1, prefix = "", suffix = "", onChange }: {
  label: string; value: number; min: number; max: number; step?: number;
  prefix?: string; suffix?: string; onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex justify-between mb-1">
        <label className="text-xs text-muted-foreground">{label}</label>
        <span className="text-xs font-medium text-foreground">{prefix}{value.toLocaleString()}{suffix}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-1.5 bg-muted rounded-full appearance-none cursor-pointer"
        style={{ accentColor: GOLD }}
      />
    </div>
  );
}

export default function ROICalculator() {
  usePageMeta({
    title: "ROI Tracker | Carlota Jo Consulting — Engagement Returns",
    description: "Track and calculate the return on advisory investment. See how Carlota Jo engagements translate to real revenue, margin, and value creation.",
    canonical: "https://szlholdings.com/carlota-jo/roi-calculator",
  });

  const [metrics, setMetrics] = useState<RoiMetrics>(STATIC_METRICS);
  const [loading, setLoading] = useState(true);
  const [monthlyRevenue, setMonthlyRevenue] = useState(150000);
  const [conversionLift, setConversionLift] = useState(35);
  const [engagementLift, setEngagementLift] = useState(80);
  const [investment, setInvestment] = useState(7000);

  useEffect(() => {
    async function loadMetrics() {
      try {
        const res = await fetch(`${API}/carlota/roi-metrics`, { credentials: "include" });
        if (res.ok) {
          const json = await res.json();
          if (json.data?.caseStudies?.length > 0) {
            setMetrics(json.data);
          }
        }
      } catch {
      } finally {
        setLoading(false);
      }
    }
    void loadMetrics();
  }, []);

  const annualRevLift = monthlyRevenue * 12 * (conversionLift / 100) * 0.4;
  const brandValue = monthlyRevenue * 12 * (engagementLift / 100) * 0.15;
  const totalReturn = annualRevLift + brandValue;
  const annualInvestment = investment * 12;
  const roi = ((totalReturn - annualInvestment) / annualInvestment * 100).toFixed(0);
  const payback = Math.round(annualInvestment / (totalReturn / 12));

  const barData = metrics.caseStudies
    .filter(cs => cs.contractedValue && cs.returnNumeric)
    .map(cs => ({
      name: cs.client.split(" ")[0],
      investment: cs.contractedValue!,
      returns: cs.returnNumeric!,
    }));

  return (
    <div className="p-6 space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Calculator className="w-5 h-5" style={{ color: GOLD }} />
          <span className="text-xs font-medium uppercase tracking-widest" style={{ color: GOLD }}>ROI Tracker</span>
          {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: GOLD }} />}
        </div>
        <h1 className="text-2xl" style={{ fontFamily: "var(--font-serif)" }}>Engagement Returns & Value Creation</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Track ROI across the portfolio and model your own engagement projections. Powered by {metrics.caseStudies.length} client case studies.
        </p>
      </div>

      {/* Portfolio benchmarks */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {[
          { label: "Average Portfolio ROI", value: `${metrics.portfolioBenchmarks.avgRoi}%`, sub: "Across all closed engagements" },
          { label: "Avg Payback Period", value: `${metrics.portfolioBenchmarks.avgPaybackMonths} months`, sub: "Time to positive ROI" },
          { label: "Client Retention Rate", value: `${metrics.portfolioBenchmarks.clientRetentionPct}%`, sub: "12-month retention" },
          { label: "Blended Margin", value: `${metrics.portfolioBenchmarks.blendedMarginPct}%`, sub: "Across portfolio" },
          { label: "Rate Realisation", value: `${metrics.portfolioBenchmarks.avgRateRealisationPct}%`, sub: "vs target billing rate" },
          { label: "Net Promoter Score", value: `${metrics.portfolioBenchmarks.npsScore}`, sub: "Client satisfaction" },
        ].map(kpi => (
          <Card key={kpi.label}>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground">{kpi.label}</p>
              <p className="text-2xl font-semibold mt-0.5" style={{ fontFamily: "var(--font-serif)", color: GOLD }}>{kpi.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{kpi.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ROI trend chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4" style={{ color: GOLD }} />
              Average Client ROI Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={metrics.roiTrendData}>
                <XAxis dataKey="month" tick={{ fontSize: 10 }} tickFormatter={v => v.split(" ")[0]} />
                <YAxis tick={{ fontSize: 11 }} unit="%" domain={[150, 500]} />
                <Tooltip formatter={(v: number) => [`${v}%`, "Avg ROI"]} contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                <Line type="monotone" dataKey="avgRoi" stroke={GOLD} strokeWidth={2} dot={{ fill: GOLD, r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Investment vs returns chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Investment vs Returns by Client</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={barData} barCategoryGap="30%">
                <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `£${(v / 1000).toFixed(0)}K`} />
                <Tooltip formatter={(v: number) => [`£${v.toLocaleString()}`, ""]} contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                <Bar dataKey="investment" name="Investment" fill="var(--color-stone-300)" radius={[3, 3, 0, 0]} />
                <Bar dataKey="returns" name="Return" fill={GOLD} radius={[3, 3, 0, 0]} opacity={0.85} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* ROI Calculator */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Project Your ROI</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <RangeInput label="Monthly Revenue" value={monthlyRevenue} min={10000} max={1000000} step={10000} prefix="£" onChange={setMonthlyRevenue} />
              <RangeInput label="Expected Conversion Lift" value={conversionLift} min={5} max={80} suffix="%" onChange={setConversionLift} />
              <RangeInput label="Expected Engagement Lift" value={engagementLift} min={20} max={200} suffix="%" onChange={setEngagementLift} />
              <RangeInput label="Monthly Investment" value={investment} min={1000} max={20000} step={500} prefix="£" onChange={setInvestment} />
              <div className="pt-3 border-t border-border space-y-2">
                {[
                  { label: "Annual Investment", val: `£${annualInvestment.toLocaleString()}` },
                  { label: "Projected Return", val: `£${Math.round(totalReturn).toLocaleString()}`, highlight: true },
                  { label: "Payback Period", val: `${payback} months` },
                ].map(row => (
                  <div key={row.label} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{row.label}</span>
                    <span className={`font-medium ${row.highlight ? "text-emerald-600" : ""}`}>{row.val}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <div className="grid grid-cols-3 gap-3 mb-4">
            <Card className="border-2" style={{ borderColor: "var(--color-gold-border)" }}>
              <CardContent className="p-4 text-center">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Projected ROI</p>
                <p className="text-3xl font-bold mt-1" style={{ color: GOLD, fontFamily: "var(--font-serif)" }}>{roi}%</p>
                <p className="text-[10px] text-muted-foreground mt-1">First 12 months</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Revenue Lift</p>
                <p className="text-3xl font-bold mt-1 text-emerald-600" style={{ fontFamily: "var(--font-serif)" }}>£{(annualRevLift / 1000).toFixed(0)}K</p>
                <p className="text-[10px] text-muted-foreground mt-1">Conversion-driven</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Brand Value</p>
                <p className="text-3xl font-bold mt-1" style={{ fontFamily: "var(--font-serif)" }}>£{(brandValue / 1000).toFixed(0)}K</p>
                <p className="text-[10px] text-muted-foreground mt-1">Intangible equity</p>
              </CardContent>
            </Card>
          </div>

          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Client ROI Case Studies</p>
          <div className="grid grid-cols-2 gap-3">
            {metrics.caseStudies.map(cs => (
              <Card key={cs.client}>
                <CardContent className="p-4">
                  <p className="text-sm font-medium">{cs.client}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 mb-3">{cs.timeframe} engagement</p>
                  <div className="flex gap-4 mb-2">
                    <div><p className="text-[10px] text-muted-foreground">Investment</p><p className="text-sm font-semibold">{cs.investment}</p></div>
                    <div><p className="text-[10px] text-muted-foreground">Return</p><p className="text-sm font-semibold text-emerald-600">{cs.returnValue}</p></div>
                    <div><p className="text-[10px] text-muted-foreground">ROI</p><p className="text-sm font-bold" style={{ color: GOLD }}>{cs.roi}</p></div>
                  </div>
                  <div className="flex items-center gap-1 border-t border-border pt-2 mt-2">
                    <ArrowRight className="w-3 h-3 text-muted-foreground shrink-0" />
                    <p className="text-[10px] text-muted-foreground">{cs.driver}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
