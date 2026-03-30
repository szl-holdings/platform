import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/shared-ui/ui/card";
import { Badge } from "@workspace/shared-ui/ui/badge";
import { Users, TrendingUp, AlertCircle, CheckCircle, Star, MessageSquare, BarChart3, Search, Globe, Flame, Target, Award } from "lucide-react";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar } from "recharts";

const clients = [
  {
    name: "Luminary Cosmetics", industry: "Beauty & Personal Care", tier: "Enterprise",
    nps: 87, churnRisk: "Low", arr: "$84K", engagementScore: 94, lastContact: "2 days ago",
    phase: "Expansion", sentiment: "Positive", openItems: 1,
    radarData: [
      { axis: "Brand Clarity", value: 92 }, { axis: "Market Fit", value: 88 },
      { axis: "Content Perf.", value: 76 }, { axis: "Team Align", value: 95 }, { axis: "ROI Delivery", value: 89 },
    ],
  },
  {
    name: "Velas Agency", industry: "Creative Services", tier: "Growth",
    nps: 71, churnRisk: "Medium", arr: "$36K", engagementScore: 67, lastContact: "8 days ago",
    phase: "Delivery", sentiment: "Neutral", openItems: 4,
    radarData: [
      { axis: "Brand Clarity", value: 74 }, { axis: "Market Fit", value: 61 },
      { axis: "Content Perf.", value: 82 }, { axis: "Team Align", value: 58 }, { axis: "ROI Delivery", value: 71 },
    ],
  },
  {
    name: "Oasis Wellness", industry: "Health & Wellness", tier: "Enterprise",
    nps: 93, churnRisk: "Low", arr: "$120K", engagementScore: 98, lastContact: "Today",
    phase: "Expansion", sentiment: "Positive", openItems: 0,
    radarData: [
      { axis: "Brand Clarity", value: 97 }, { axis: "Market Fit", value: 94 },
      { axis: "Content Perf.", value: 91 }, { axis: "Team Align", value: 99 }, { axis: "ROI Delivery", value: 96 },
    ],
  },
  {
    name: "Kova Spirits", industry: "Beverage", tier: "Growth",
    nps: 62, churnRisk: "High", arr: "$28K", engagementScore: 48, lastContact: "14 days ago",
    phase: "At Risk", sentiment: "Negative", openItems: 7,
    radarData: [
      { axis: "Brand Clarity", value: 55 }, { axis: "Market Fit", value: 42 },
      { axis: "Content Perf.", value: 61 }, { axis: "Team Align", value: 38 }, { axis: "ROI Delivery", value: 57 },
    ],
  },
];

const npsHistory = [
  { month: "Oct", score: 72 }, { month: "Nov", score: 76 }, { month: "Dec", score: 74 },
  { month: "Jan", score: 79 }, { month: "Feb", score: 82 }, { month: "Mar", score: 85 },
];

const churnColor: Record<string, string> = {
  Low: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  Medium: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  High: "text-red-400 bg-red-500/10 border-red-500/20",
};

const sentimentIcon: Record<string, React.ReactNode> = {
  Positive: <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />,
  Neutral: <AlertCircle className="w-3.5 h-3.5 text-amber-400" />,
  Negative: <AlertCircle className="w-3.5 h-3.5 text-red-400" />,
};

export default function ClientIntel() {
  const [selected, setSelected] = useState(clients[0]);

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground flex items-center gap-3">
            <Users className="w-7 h-7 text-primary" />
            Client Intelligence Hub
          </h1>
          <p className="text-muted-foreground mt-2">NPS tracking, churn risk, engagement scores, and health signals across your client portfolio.</p>
        </div>

        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "Portfolio NPS", value: "85", sub: "+6 pts vs last quarter", color: "text-emerald-400" },
            { label: "Avg Engagement", value: "76.8", sub: "Score out of 100", color: "text-primary" },
            { label: "At-Risk Clients", value: "1", sub: "Require immediate attention", color: "text-red-400" },
            { label: "Portfolio ARR", value: "$268K", sub: "Across 4 active clients", color: "text-foreground" },
          ].map(({ label, value, sub, color }) => (
            <Card key={label}>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className={`text-2xl font-bold ${color}`}>{value}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-1 space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Client Roster</p>
            {clients.map(c => (
              <button
                key={c.name}
                onClick={() => setSelected(c)}
                className={`w-full text-left p-3 rounded-xl border transition-all ${selected.name === c.name ? "border-primary/50 bg-primary/5" : "border-border hover:border-border/80 bg-card"}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">{c.name}</p>
                    <p className="text-[11px] text-muted-foreground">{c.industry}</p>
                  </div>
                  <Badge variant="outline" className={`text-[10px] ${churnColor[c.churnRisk]}`}>{c.churnRisk} Risk</Badge>
                </div>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-[11px] text-muted-foreground">NPS <span className="text-foreground font-medium">{c.nps}</span></span>
                  <span className="text-[11px] text-muted-foreground">ARR <span className="text-foreground font-medium">{c.arr}</span></span>
                </div>
              </button>
            ))}
          </div>

          <div className="col-span-2 space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{selected.name}</CardTitle>
                  <div className="flex items-center gap-2">
                    {sentimentIcon[selected.sentiment]}
                    <span className="text-xs text-muted-foreground">{selected.sentiment}</span>
                    <Badge variant="outline" className="text-[10px] ml-2">{selected.tier}</Badge>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">{selected.phase} phase · Last contact: {selected.lastContact}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-muted/30 rounded-lg p-3 text-center">
                    <p className="text-[10px] text-muted-foreground">NPS Score</p>
                    <p className="text-xl font-bold text-emerald-400">{selected.nps}</p>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-3 text-center">
                    <p className="text-[10px] text-muted-foreground">Engagement</p>
                    <p className="text-xl font-bold text-primary">{selected.engagementScore}</p>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-3 text-center">
                    <p className="text-[10px] text-muted-foreground">Open Items</p>
                    <p className={`text-xl font-bold ${selected.openItems > 3 ? "text-red-400" : selected.openItems > 0 ? "text-amber-400" : "text-emerald-400"}`}>{selected.openItems}</p>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground mb-2">Health Radar</p>
                  <ResponsiveContainer width="100%" height={200}>
                    <RadarChart data={selected.radarData}>
                      <PolarGrid stroke="rgba(255,255,255,0.08)" />
                      <PolarAngleAxis dataKey="axis" tick={{ fontSize: 10, fill: "rgba(255,255,255,0.5)" }} />
                      <Radar dataKey="value" stroke="#ec4899" fill="#ec4899" fillOpacity={0.2} strokeWidth={2} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><TrendingUp className="w-4 h-4 text-primary" /> Portfolio NPS Trend (6 months)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={140}>
              <AreaChart data={npsHistory}>
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "rgba(255,255,255,0.4)" }} axisLine={false} tickLine={false} />
                <YAxis domain={[60, 100]} tick={{ fontSize: 11, fill: "rgba(255,255,255,0.4)" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }} />
                <Area type="monotone" dataKey="score" stroke="#ec4899" fill="#ec4899" fillOpacity={0.15} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <SocialListeningPanel />
        <CompetitiveBenchmarkPanel />
        <CampaignROIPanel />
      </div>
    </div>
  );
}

// ─── Social Listening (Brandwatch-style) ──────────────────────────────────────
const mentions = [
  { brand: "Luminary Cosmetics", platform: "Instagram", sentiment: "positive", volume: 2847, change: "+18%", topTopic: "Summer Campaign", timestamp: "Live" },
  { brand: "Oasis Wellness", platform: "Twitter/X", sentiment: "positive", volume: 1204, change: "+31%", topTopic: "Mindfulness Series", timestamp: "Live" },
  { brand: "Kova Spirits", platform: "Reddit", sentiment: "negative", volume: 389, change: "-8%", topTopic: "Packaging Complaints", timestamp: "Live" },
  { brand: "Velas Agency", platform: "LinkedIn", sentiment: "neutral", volume: 612, change: "+4%", topTopic: "Team Highlights", timestamp: "Live" },
];

const sentimentColor: Record<string, string> = {
  positive: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  neutral: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  negative: "text-red-400 bg-red-500/10 border-red-500/20",
};

function SocialListeningPanel() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2"><Globe className="w-4 h-4 text-primary" /> Social Listening Dashboard</CardTitle>
          <Badge variant="outline" className="text-[10px] bg-primary/5 text-primary border-primary/20">Simulated Brandwatch Feed</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {mentions.map(m => (
            <div key={m.brand} className="p-3 rounded-xl border border-border bg-muted/20">
              <div className="flex items-center justify-between mb-1.5">
                <div>
                  <p className="text-xs font-semibold text-foreground">{m.brand}</p>
                  <p className="text-[10px] text-muted-foreground">{m.platform} · {m.timestamp}</p>
                </div>
                <Badge variant="outline" className={`text-[9px] ${sentimentColor[m.sentiment]}`}>{m.sentiment}</Badge>
              </div>
              <div className="flex items-center gap-3 text-[11px]">
                <span className="text-muted-foreground">Mentions: <span className="text-foreground font-bold">{m.volume.toLocaleString()}</span></span>
                <span className={m.change.startsWith("+") ? "text-emerald-400" : "text-red-400"}>{m.change}</span>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">Top topic: <span className="text-foreground">{m.topTopic}</span></p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Competitive Benchmarking ─────────────────────────────────────────────────
const benchmarkData = [
  { metric: "Avg NPS", carlotaJo: 85, industry: 61, topQuartile: 80 },
  { metric: "Engagement Rate", carlotaJo: 76, industry: 52, topQuartile: 70 },
  { metric: "Churn Rate", carlotaJo: 12, industry: 28, topQuartile: 15 },
  { metric: "Campaign ROI", carlotaJo: 340, industry: 180, topQuartile: 260 },
];

function CompetitiveBenchmarkPanel() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2"><Target className="w-4 h-4 text-primary" /> Competitive Benchmarking</CardTitle>
          <Badge variant="outline" className="text-[10px] bg-muted text-muted-foreground">Industry Benchmark</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {benchmarkData.map(b => (
            <div key={b.metric}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium text-foreground">{b.metric}</span>
                <div className="flex items-center gap-3 text-[10px]">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary inline-block" />Carlota Jo: <strong className="text-primary">{b.carlotaJo}</strong></span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-muted-foreground inline-block" />Industry: {b.industry}</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />Top 25%: {b.topQuartile}</span>
                </div>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden relative">
                <div className="h-full rounded-full bg-muted-foreground/30" style={{ width: `${Math.min(b.industry / (b.carlotaJo > b.industry ? b.carlotaJo * 1.2 : b.industry * 1.2) * 100, 100)}%` }} />
                <div className="absolute top-0 h-full rounded-full bg-amber-400/50" style={{ width: `${Math.min(b.topQuartile / (b.carlotaJo > b.topQuartile ? b.carlotaJo * 1.2 : b.topQuartile * 1.2) * 100, 100)}%` }} />
                <div className="absolute top-0 h-full rounded-full bg-primary" style={{ width: `${Math.min(100, 83)}%` }} />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Campaign ROI Attribution ─────────────────────────────────────────────────
const roiData = [
  { channel: "Paid Social", spend: 12000, revenue: 51600, roi: 330 },
  { channel: "Email", spend: 3400, revenue: 21420, roi: 530 },
  { channel: "Influencer", spend: 8000, revenue: 28800, roi: 260 },
  { channel: "Organic Search", spend: 2200, revenue: 13200, roi: 500 },
];

function CampaignROIPanel() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2"><Award className="w-4 h-4 text-primary" /> Campaign ROI Attribution</CardTitle>
          <Badge variant="outline" className="text-[10px] bg-muted text-muted-foreground">Simulated</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {roiData.map(r => (
            <div key={r.channel} className="p-3 rounded-xl border border-border bg-muted/20 text-center">
              <p className="text-[10px] text-muted-foreground mb-1">{r.channel}</p>
              <p className="text-lg font-bold text-emerald-400">{r.roi}%</p>
              <p className="text-[10px] text-muted-foreground">ROI</p>
              <div className="mt-2 pt-2 border-t border-border/50 flex justify-between text-[9px] text-muted-foreground">
                <span>Spend ${(r.spend / 1000).toFixed(1)}K</span>
                <span>Rev ${(r.revenue / 1000).toFixed(1)}K</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
