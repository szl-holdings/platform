import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@szl-holdings/shared-ui/ui/card";
import { Badge } from "@szl-holdings/shared-ui/ui/badge";
import { DollarSign, TrendingUp, Sparkles, Zap } from "lucide-react";
import { usePageMeta } from "@/hooks/usePageMeta";

const revenueStreams = [
  { id: "speaking", label: "Speaking Fees", ytd: 284000, q1: 92000, q2Forecast: 118000, q3Forecast: 134000, q4Forecast: 156000, color: "bg-primary", textColor: "text-primary", pct: 38, delta: "+28%", attribution: "LinkedIn content → speaking inquiries" },
  { id: "consulting", label: "Advisory & Consulting", ytd: 186000, q1: 64000, q2Forecast: 72000, q3Forecast: 80000, q4Forecast: 88000, color: "bg-sky-500", textColor: "text-sky-400", pct: 25, delta: "+19%", attribution: "Published articles → consulting outreach" },
  { id: "products", label: "Digital Products", ytd: 94000, q1: 18000, q2Forecast: 31000, q3Forecast: 42000, q4Forecast: 54000, color: "bg-emerald-500", textColor: "text-emerald-400", pct: 13, delta: "+142%", attribution: "Newsletter → product sales" },
  { id: "sponsorships", label: "Brand Sponsorships", ytd: 68000, q1: 24000, q2Forecast: 26000, q3Forecast: 28000, q4Forecast: 32000, color: "bg-amber-500", textColor: "text-amber-400", pct: 9, delta: "+64%", attribution: "Audience reach & engagement metrics" },
  { id: "affiliate", label: "Affiliate & Referral", ytd: 41000, q1: 12000, q2Forecast: 14000, q3Forecast: 16000, q4Forecast: 18000, color: "bg-violet-500", textColor: "text-violet-400", pct: 5, delta: "+87%", attribution: "Content recommendations" },
  { id: "content", label: "Content Monetization", ytd: 32000, q1: 8000, q2Forecast: 10000, q3Forecast: 12000, q4Forecast: 14000, color: "bg-rose-500", textColor: "text-rose-400", pct: 4, delta: "+34%", attribution: "Newsletter & articles" },
  { id: "licensing", label: "IP Licensing", ytd: 46000, q1: 11000, q2Forecast: 14000, q3Forecast: 16000, q4Forecast: 18000, color: "bg-cyan-500", textColor: "text-cyan-400", pct: 6, delta: "+18%", attribution: "Frameworks & methodology" },
];

const attributionMap = [
  { content: "HBR Article — 6 Lenses of Observability", reach: "94.7K", revenue: "$42K", streams: ["consulting", "speaking"] },
  { content: "LinkedIn — AIOps Revolution Thread", reach: "350K", revenue: "$38K", streams: ["speaking", "sponsorships"] },
  { content: "Newsletter — Q1 Ecosystem Update", reach: "41K subscribers", revenue: "$28K", streams: ["products", "consulting"] },
  { content: "Forbes — AI Leaders 2026 Feature", reach: "47.2K", revenue: "$24K", streams: ["speaking", "consulting"] },
  { content: "SaaStr Keynote — AIOps at Scale", reach: "18K live", revenue: "$36K", streams: ["speaking", "consulting"] },
];

const monthlyTotals = [
  { month: "Apr", rev: 42 }, { month: "May", rev: 51 }, { month: "Jun", rev: 48 },
  { month: "Jul", rev: 63 }, { month: "Aug", rev: 57 }, { month: "Sep", rev: 72 },
  { month: "Oct", rev: 68 }, { month: "Nov", rev: 84 }, { month: "Dec", rev: 91 },
  { month: "Jan", rev: 76 }, { month: "Feb", rev: 88 }, { month: "Mar", rev: 104 },
];

const forecastScenarios = [
  { name: "Conservative", annual: 892000, yoy: "+18%", q2: 261000, color: "text-muted-foreground" },
  { name: "Base Case", annual: 1140000, yoy: "+51%", q2: 310000, color: "text-primary" },
  { name: "Accelerated", annual: 1480000, yoy: "+96%", q2: 382000, color: "text-emerald-400" },
];

export default function RevenueIntelligence() {
  usePageMeta({
    title: "Revenue Intelligence | Stephen Lutar — Income Streams & Attribution",
    description: "Unified revenue intelligence dashboard: multi-stream tracking, content attribution, and forecasting for Stephen Lutar's creator business.",
    canonical: "https://szlholdings.com/stephen/revenue",
  });

  const [activeTab, setActiveTab] = useState<"overview" | "attribution" | "forecast" | "optimization">("overview");
  const [selectedStream, setSelectedStream] = useState<string | null>(null);

  const totalYTD = revenueStreams.reduce((s, r) => s + r.ytd, 0);
  const totalQ1 = revenueStreams.reduce((s, r) => s + r.q1, 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-primary" />
            Revenue Intelligence
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Multi-stream income tracking, content attribution, and AI-powered forecasting</p>
        </div>
        <Badge variant="outline" className="text-xs text-emerald-400 border-emerald-500/30">
          <TrendingUp className="w-3 h-3 mr-1" />
          +51% YoY Run Rate
        </Badge>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Revenue YTD", value: `$${(totalYTD / 1000).toFixed(0)}K`, color: "text-emerald-400", sub: "7 active streams" },
          { label: "Q1 Revenue", value: `$${(totalQ1 / 1000).toFixed(0)}K`, color: "text-primary", sub: "Best quarter ever" },
          { label: "Annual Run Rate", value: "$1.14M", color: "text-sky-400", sub: "Base case forecast" },
          { label: "Revenue Streams", value: "7", color: "text-amber-400", sub: "All growing YoY" },
        ].map(({ label, value, color, sub }) => (
          <Card key={label} className="bg-card/50 border-border/40">
            <CardContent className="p-4">
              <div className={`text-2xl font-bold ${color}`}>{value}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
              <div className="text-xs text-muted-foreground/60 mt-1">{sub}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex gap-2 border-b border-border/40">
        {(["overview", "attribution", "forecast", "optimization"] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors ${
              activeTab === tab ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <div className="space-y-6">
          <Card className="bg-card/50 border-border/40">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Revenue by Stream (YTD)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {revenueStreams.map(stream => (
                <div
                  key={stream.id}
                  className={`cursor-pointer p-3 rounded-lg border transition-all ${selectedStream === stream.id ? "border-primary/40 bg-primary/5" : "border-border/20 hover:border-border/40"}`}
                  onClick={() => setSelectedStream(selectedStream === stream.id ? null : stream.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-2.5 h-2.5 rounded-full ${stream.color}`} />
                      <span className="text-sm font-medium">{stream.label}</span>
                      <Badge variant="outline" className={`text-xs ${stream.textColor}`}>{stream.delta}</Badge>
                    </div>
                    <div className="flex items-center gap-4 text-right">
                      <span className="text-xs text-muted-foreground">{stream.pct}%</span>
                      <span className={`text-sm font-bold ${stream.textColor}`}>${(stream.ytd / 1000).toFixed(0)}K</span>
                    </div>
                  </div>
                  <div className="mt-2 h-1.5 bg-muted/30 rounded-full overflow-hidden">
                    <div className={`h-full ${stream.color} rounded-full`} style={{ width: `${stream.pct * 2.5}%` }} />
                  </div>
                  {selectedStream === stream.id && (
                    <div className="mt-3 pt-3 border-t border-border/20 text-xs text-muted-foreground">
                      <span className="text-primary font-medium">Attribution: </span>{stream.attribution}
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-border/40">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Monthly Revenue Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-1 h-28">
                {monthlyTotals.map((m, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full flex flex-col justify-end" style={{ height: "100px" }}>
                      <div
                        className={`w-full rounded-sm ${i >= 9 ? "bg-primary" : "bg-primary/30"} hover:opacity-80 transition-opacity`}
                        style={{ height: `${(m.rev / 110) * 100}%` }}
                        title={`${m.month}: $${m.rev}K`}
                      />
                    </div>
                    <span className="text-[9px] text-muted-foreground/60">{m.month}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "attribution" && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Track which content and activities drive revenue across all streams.</p>
          <div className="space-y-3">
            {attributionMap.map((item, i) => (
              <Card key={i} className="bg-card/50 border-border/40">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="text-sm font-semibold">{item.content}</div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span>{item.reach} reach</span>
                        <span>→</span>
                        <span className="text-emerald-400 font-semibold">{item.revenue} attributed revenue</span>
                      </div>
                      <div className="flex gap-1.5 mt-2">
                        {item.streams.map(s => {
                          const stream = revenueStreams.find(r => r.id === s);
                          return stream ? (
                            <Badge key={s} variant="outline" className={`text-xs ${stream.textColor}`}>{stream.label}</Badge>
                          ) : null;
                        })}
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-primary">{item.revenue}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {activeTab === "forecast" && (
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            {forecastScenarios.map(s => (
              <Card key={s.name} className={`bg-card/50 border-border/40 ${s.name === "Base Case" ? "border-primary/40" : ""}`}>
                <CardContent className="p-4 text-center">
                  <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">{s.name}</div>
                  <div className={`text-2xl font-bold ${s.color}`}>${(parseInt(s.annual.toString()) / 1000000).toFixed(2)}M</div>
                  <div className="text-xs text-muted-foreground mt-1">Annual 2026</div>
                  <div className={`text-sm font-semibold mt-1 ${s.color}`}>{s.yoy} YoY</div>
                  <div className="mt-3 pt-3 border-t border-border/20">
                    <div className="text-xs text-muted-foreground">Q2 Forecast</div>
                    <div className={`text-lg font-bold ${s.color}`}>${(s.q2 / 1000).toFixed(0)}K</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="bg-card/50 border-border/40">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Stream-Level Quarterly Forecast</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="grid grid-cols-5 text-xs text-muted-foreground font-medium border-b border-border/30 pb-2">
                  <span className="col-span-2">Stream</span>
                  <span className="text-right">Q1 Actual</span>
                  <span className="text-right">Q2 Forecast</span>
                  <span className="text-right">Q3 Forecast</span>
                </div>
                {revenueStreams.map(s => (
                  <div key={s.id} className="grid grid-cols-5 text-xs py-2 border-b border-border/10 hover:bg-muted/10 rounded">
                    <span className="col-span-2 font-medium">{s.label}</span>
                    <span className={`text-right ${s.textColor}`}>${(s.q1 / 1000).toFixed(0)}K</span>
                    <span className="text-right text-foreground">${(s.q2Forecast / 1000).toFixed(0)}K</span>
                    <span className="text-right text-muted-foreground">${(s.q3Forecast / 1000).toFixed(0)}K</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "optimization" && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 p-3 bg-primary/5 border border-primary/20 rounded-lg">
            <Sparkles className="w-4 h-4 text-primary shrink-0" />
            <p className="text-xs text-muted-foreground">AI-powered recommendations based on market data, demand signals, and your revenue patterns.</p>
          </div>
          <div className="space-y-3">
            {[
              { title: "Raise keynote speaking fee by 20%", detail: "Speaking demand signals (3 inbound requests in 30 days, avg waitlist 6 weeks) support a $35K base fee vs. current $29K. Comparable speakers at your profile level command $32–45K.", impact: "+$48K annually", confidence: 94, type: "pricing", stream: "Speaking Fees" },
              { title: "Launch a $997 AIOps Masterclass", detail: "Your newsletter open rate (42%) and HBR article engagement (94.7K reads) indicate strong demand for structured learning. 10K audience × 4% conversion = 400 units.", impact: "+$399K at launch", confidence: 88, type: "product", stream: "Digital Products" },
              { title: "Introduce retainer advisory packages", detail: "Three consulting inquiries this month came from companies wanting ongoing access, not one-off projects. A $12K/month retainer at 4 slots = $576K ARR.", impact: "+$288K ARR", confidence: 82, type: "pricing", stream: "Advisory & Consulting" },
              { title: "Negotiate Q3 sponsorship minimums up 15%", detail: "Audience engagement rate (6.8%) exceeds industry benchmark (2.1%) by 3.2x. Current sponsorship rates undervalue your audience quality.", impact: "+$18K in H2", confidence: 91, type: "pricing", stream: "Brand Sponsorships" },
              { title: "Bundle speaking + consulting packages", detail: "Post-event consulting conversion is running at 31%. A speaking + 2-day workshop bundle at $85K could increase deal value for events.", impact: "+$127K annually", confidence: 79, type: "product", stream: "Multi-stream" },
            ].map((rec, i) => (
              <Card key={i} className="bg-card/50 border-border/40">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                      {rec.type === "pricing" ? <TrendingUp className="w-4 h-4 text-primary" /> : <Zap className="w-4 h-4 text-primary" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold">{rec.title}</span>
                        <Badge variant="outline" className="text-xs text-emerald-400 border-emerald-500/30">{rec.impact}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{rec.detail}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-xs text-muted-foreground">Stream: <span className="text-primary">{rec.stream}</span></span>
                        <span className="text-xs text-muted-foreground">AI Confidence: <span className={rec.confidence >= 90 ? "text-emerald-400" : "text-amber-400"}>{rec.confidence}%</span></span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
