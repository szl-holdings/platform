import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@szl-holdings/shared-ui/ui/card";
import { DollarSign, TrendingUp, Target, Zap, ArrowRight, Calculator } from "lucide-react";
import { usePageMeta } from "@/hooks/usePageMeta";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

const benchmarks = [
  { metric: "Brand Awareness Lift", before: 18, after: 54, unit: "%" },
  { metric: "Social Engagement Rate", before: 1.2, after: 4.8, unit: "%" },
  { metric: "Conversion Rate", before: 2.1, after: 5.6, unit: "%" },
  { metric: "Customer Lifetime Value", before: 840, after: 1920, unit: "$" },
  { metric: "Content Production Speed", before: 12, after: 4, unit: "days/campaign", inverse: true },
];

const caseStudies = [
  { client: "Luminary Cosmetics", investment: "$84K", returnVal: "$312K", roi: "271%", timeframe: "12 months", driver: "DTC conversion lift + retention" },
  { client: "Oasis Wellness", investment: "$120K", returnVal: "$610K", roi: "408%", timeframe: "18 months", driver: "Category authority + earned media" },
  { client: "Velas Agency", investment: "$36K", returnVal: "$98K", roi: "172%", timeframe: "8 months", driver: "Referral pipeline + pricing confidence" },
];

const projectionData = [
  { month: "M1", cumulative: 0, investment: -10 },
  { month: "M2", cumulative: -5, investment: -10 },
  { month: "M3", cumulative: 8, investment: -10 },
  { month: "M4", cumulative: 28, investment: -10 },
  { month: "M5", cumulative: 52, investment: -10 },
  { month: "M6", cumulative: 78, investment: -10 },
];

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
        className="w-full h-1.5 bg-muted rounded-full appearance-none cursor-pointer accent-pink-500"
      />
    </div>
  );
}

export default function ROICalculator() {
  usePageMeta({
    title: "ROI Calculator | Carlota Jo Consulting – Brand Investment Returns",
    description: "Calculate the return on investment from brand strategy consulting. See how improved brand positioning translates to revenue lift and engagement growth.",
    canonical: "https://szlholdings.com/carlota-jo/roi-calculator",
  });
  const [monthlyRevenue, setMonthlyRevenue] = useState(150000);
  const [conversionLift, setConversionLift] = useState(35);
  const [engagementLift, setEngagementLift] = useState(80);
  const [investment, setInvestment] = useState(7000);

  const annualRevLift = monthlyRevenue * 12 * (conversionLift / 100) * 0.4;
  const brandValue = monthlyRevenue * 12 * (engagementLift / 100) * 0.15;
  const totalReturn = annualRevLift + brandValue;
  const annualInvestment = investment * 12;
  const roi = ((totalReturn - annualInvestment) / annualInvestment * 100).toFixed(0);
  const payback = Math.round(annualInvestment / (totalReturn / 12));

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground flex items-center gap-3">
            <Calculator className="w-7 h-7 text-primary" />
            ROI & Value Calculator
          </h1>
          <p className="text-muted-foreground mt-2">Quantify the return on brand investment. Powered by Carlota Jo benchmark data from 40+ client engagements.</p>
        </div>

        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-1">
            <Card className="h-full">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-muted-foreground uppercase tracking-wider">Your Numbers</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <RangeInput label="Monthly Revenue" value={monthlyRevenue} min={10000} max={1000000} step={10000} prefix="$" onChange={setMonthlyRevenue} />
                <RangeInput label="Expected Conversion Lift" value={conversionLift} min={5} max={80} suffix="%" onChange={setConversionLift} />
                <RangeInput label="Expected Engagement Lift" value={engagementLift} min={20} max={200} suffix="%" onChange={setEngagementLift} />
                <RangeInput label="Monthly Investment" value={investment} min={1000} max={20000} step={500} prefix="$" onChange={setInvestment} />

                <div className="pt-4 border-t border-border space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Annual Investment</span>
                    <span className="font-medium">${annualInvestment.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Projected Return</span>
                    <span className="font-medium text-emerald-400">${Math.round(totalReturn).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Payback Period</span>
                    <span className="font-medium">{payback} months</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="col-span-2 space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <Card className="border-emerald-500/20 bg-emerald-500/5">
                <CardContent className="p-4 text-center">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Projected ROI</p>
                  <p className="text-3xl font-bold text-emerald-400 mt-1">{roi}%</p>
                  <p className="text-[10px] text-muted-foreground mt-1">First 12 months</p>
                </CardContent>
              </Card>
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="p-4 text-center">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Revenue Lift</p>
                  <p className="text-3xl font-bold text-primary mt-1">${(annualRevLift / 1000).toFixed(0)}K</p>
                  <p className="text-[10px] text-muted-foreground mt-1">Conversion-driven</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Brand Value</p>
                  <p className="text-3xl font-bold text-foreground mt-1">${(brandValue / 1000).toFixed(0)}K</p>
                  <p className="text-[10px] text-muted-foreground mt-1">Intangible equity</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Benchmark vs. Industry Average</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {benchmarks.map(b => {
                    const improvement = b.inverse
                      ? Math.round((1 - b.after / b.before) * 100)
                      : Math.round((b.after / b.before - 1) * 100);
                    return (
                      <div key={b.metric} className="flex items-center gap-4">
                        <p className="text-xs text-muted-foreground w-44 shrink-0">{b.metric}</p>
                        <div className="flex-1 flex items-center gap-2">
                          <span className="text-xs text-muted-foreground w-16 text-right">{b.before}{b.unit}</span>
                          <ArrowRight className="w-3 h-3 text-muted-foreground shrink-0" />
                          <span className="text-xs font-medium text-emerald-400 w-16">{b.after}{b.unit}</span>
                          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div className="h-full rounded-full bg-gradient-to-r from-pink-500 to-emerald-400" style={{ width: `${Math.min(100, improvement)}%` }} />
                          </div>
                          <span className="text-[10px] text-emerald-400 w-12 text-right">+{improvement}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Client ROI Case Studies</p>
          <div className="grid grid-cols-3 gap-4">
            {caseStudies.map(cs => (
              <Card key={cs.client}>
                <CardContent className="p-4">
                  <p className="text-sm font-medium text-foreground">{cs.client}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 mb-3">{cs.timeframe} engagement</p>
                  <div className="flex gap-4 mb-2">
                    <div>
                      <p className="text-[10px] text-muted-foreground">Investment</p>
                      <p className="text-sm font-semibold">{cs.investment}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground">Return</p>
                      <p className="text-sm font-semibold text-emerald-400">{cs.returnVal}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground">ROI</p>
                      <p className="text-sm font-bold text-primary">{cs.roi}</p>
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground border-t border-border pt-2 mt-2">{cs.driver}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
