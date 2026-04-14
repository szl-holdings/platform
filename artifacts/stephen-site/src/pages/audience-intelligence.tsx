import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@szl-holdings/shared-ui/ui/card";
import { Badge } from "@szl-holdings/shared-ui/ui/badge";
import { Users, TrendingUp, Globe, Briefcase, Building2, BarChart3, ArrowUpRight, Star } from "lucide-react";
import { usePageMeta } from "@/hooks/usePageMeta";

const industryData = [
  { name: "Technology", pct: 38, count: "108K", color: "#6366f1", change: "+4.2%" },
  { name: "Financial Services", pct: 22, count: "62K", color: "#0ea5e9", change: "+2.8%" },
  { name: "Consulting", pct: 12, count: "34K", color: "#f59e0b", change: "+1.4%" },
  { name: "Maritime & Logistics", pct: 9, count: "25K", color: "#10b981", change: "+6.1%" },
  { name: "Private Equity / VC", pct: 7, count: "20K", color: "#ec4899", change: "+3.3%" },
  { name: "Media & Publishing", pct: 5, count: "14K", color: "#8b5cf6", change: "+0.9%" },
  { name: "Other", pct: 7, count: "19K", color: "#6b7280", change: "+1.1%" },
];

const seniorityData = [
  { level: "C-Suite / Founder", pct: 24, count: "68K", icon: "◆" },
  { level: "VP / Director", pct: 31, count: "88K", icon: "▲" },
  { level: "Senior Manager", pct: 22, count: "62K", icon: "●" },
  { level: "Manager / Lead", pct: 14, count: "40K", icon: "◎" },
  { level: "Individual Contributor", pct: 9, count: "26K", icon: "○" },
];

const geographyData = [
  { region: "North America", pct: 52, flag: "🇺🇸", count: "148K" },
  { region: "United Kingdom", pct: 14, flag: "🇬🇧", count: "40K" },
  { region: "Europe (Other)", pct: 11, flag: "🇪🇺", count: "31K" },
  { region: "Asia Pacific", pct: 13, flag: "🌏", count: "37K" },
  { region: "Middle East", pct: 6, flag: "🌍", count: "17K" },
  { region: "Rest of World", pct: 4, flag: "🌎", count: "11K" },
];

const monthlyGrowth = [
  { month: "Oct", followers: 201 },
  { month: "Nov", followers: 218 },
  { month: "Dec", followers: 228 },
  { month: "Jan", followers: 241 },
  { month: "Feb", followers: 259 },
  { month: "Mar", followers: 284 },
];

const topEngagers = [
  { name: "CIOs in Enterprise Tech", engagement: "8.4%", size: "28K", quality: 97, trend: "up" },
  { name: "Maritime Executives", engagement: "7.9%", size: "22K", quality: 94, trend: "up" },
  { name: "VC & PE Partners", engagement: "6.8%", size: "18K", quality: 96, trend: "up" },
  { name: "AI/ML Practitioners", engagement: "5.6%", size: "34K", quality: 82, trend: "stable" },
  { name: "Strategy Consultants", engagement: "5.1%", size: "29K", quality: 78, trend: "up" },
  { name: "Startup Founders", engagement: "4.8%", size: "41K", quality: 75, trend: "stable" },
];

const expansionOpportunities = [
  { area: "Legal & Compliance Tech", penetration: 14, opportunity: "High", rationale: "Regulatory AI wave" },
  { area: "Real Estate Investment", penetration: 8, opportunity: "High", rationale: "Terra brand halo" },
  { area: "Sovereign Wealth Funds", penetration: 3, opportunity: "Medium", rationale: "Speaking pipeline" },
  { area: "Defense & Government", penetration: 5, opportunity: "Medium", rationale: "Aegis adjacency" },
];

type Period = "7d" | "30d" | "90d" | "1y";

const periodStats: Record<Period, { impressions: string; reach: string; engagements: string; newFollowers: string }> = {
  "7d": { impressions: "412K", reach: "298K", engagements: "24.8K", newFollowers: "+2.1K" },
  "30d": { impressions: "1.8M", reach: "1.1M", engagements: "89K", newFollowers: "+8.4K" },
  "90d": { impressions: "4.9M", reach: "2.8M", engagements: "241K", newFollowers: "+24K" },
  "1y": { impressions: "14.2M", reach: "8.1M", engagements: "784K", newFollowers: "+83K" },
};

export default function AudienceIntelligence() {
  usePageMeta({
    title: "Audience Intelligence | Stephen Lutar",
    description: "Living map of influence — tracking who's engaging, from which industries, at what seniority level.",
    canonical: "https://szlholdings.com/stephen/audience",
  });

  const [period, setPeriod] = useState<Period>("30d");
  const stats = periodStats[period];
  const maxGrowth = Math.max(...monthlyGrowth.map(m => m.followers));

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" />
            Audience Intelligence
          </h1>
          <p className="text-sm text-muted-foreground mt-1">A living map of influence — who engages, from where, and at what seniority</p>
        </div>
        <div className="flex gap-1.5">
          {(["7d", "30d", "90d", "1y"] as Period[]).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${period === p ? "bg-primary text-primary-foreground" : "bg-muted/40 text-muted-foreground hover:bg-muted/60"}`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Impressions", value: stats.impressions, icon: BarChart3, color: "text-primary" },
          { label: "Unique Reach", value: stats.reach, icon: Globe, color: "text-sky-400" },
          { label: "Engagements", value: stats.engagements, icon: Star, color: "text-amber-400" },
          { label: "New Followers", value: stats.newFollowers, icon: TrendingUp, color: "text-emerald-400" },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Icon className={`w-3.5 h-3.5 ${color}`} />
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
              Industry Penetration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {industryData.map(item => (
              <div key={item.name}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-foreground/80">{item.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">{item.count}</span>
                    <span className="text-emerald-400 text-[10px]">{item.change}</span>
                  </div>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${item.pct}%`, backgroundColor: item.color, opacity: 0.7 }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Briefcase className="w-3.5 h-3.5 text-muted-foreground" />
              Seniority Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {seniorityData.map((item, i) => {
              const colors = ["text-primary", "text-sky-400", "text-emerald-400", "text-amber-400", "text-muted-foreground"];
              const bgColors = ["bg-primary", "bg-sky-400", "bg-emerald-400", "bg-amber-400", "bg-muted-foreground"];
              return (
                <div key={item.level}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className={`flex items-center gap-1.5 ${colors[i]}`}>
                      <span className="text-[11px]">{item.icon}</span>
                      {item.level}
                    </span>
                    <span className="text-muted-foreground">{item.pct}% · {item.count}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full ${bgColors[i]} opacity-50 rounded-full`}
                      style={{ width: `${item.pct * 2.5}%` }}
                    />
                  </div>
                </div>
              );
            })}
            <div className="pt-2 border-t border-border">
              <p className="text-[10px] text-muted-foreground">55% of audience holds VP level or above — strong signal quality for advisory and partnership outreach.</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              Follower Growth — 6 Month Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-3 h-28">
              {monthlyGrowth.map(m => (
                <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[9px] text-muted-foreground">{m.followers}K</span>
                  <div
                    className="w-full bg-primary/40 rounded-sm"
                    style={{ height: `${(m.followers / maxGrowth) * 80}px` }}
                  />
                  <span className="text-[9px] text-muted-foreground">{m.month}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-border text-xs text-muted-foreground">
              <span>Total LinkedIn Followers</span>
              <span className="text-primary font-bold text-base">284K</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Globe className="w-3.5 h-3.5 text-muted-foreground" />
              Geographic Reach
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {geographyData.map(geo => (
              <div key={geo.region} className="flex items-center gap-2">
                <span className="text-base">{geo.flag}</span>
                <div className="flex-1">
                  <div className="flex justify-between text-[10px] mb-0.5">
                    <span className="text-foreground/70">{geo.region}</span>
                    <span className="text-muted-foreground">{geo.count}</span>
                  </div>
                  <div className="h-1 bg-muted rounded-full">
                    <div className="h-full bg-primary/50 rounded-full" style={{ width: `${geo.pct}%` }} />
                  </div>
                </div>
                <span className="text-[10px] text-muted-foreground w-6 text-right">{geo.pct}%</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Star className="w-3.5 h-3.5 text-amber-400" />
            Top Engaging Segments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {topEngagers.map(seg => (
              <div key={seg.name} className="p-3 rounded-lg bg-muted/20 border border-border">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs font-semibold leading-snug">{seg.name}</p>
                  <Badge
                    variant="outline"
                    className={`text-[9px] shrink-0 ${seg.trend === "up" ? "text-emerald-400 border-emerald-500/20 bg-emerald-500/10" : "text-muted-foreground border-border"}`}
                  >
                    {seg.trend === "up" ? <ArrowUpRight className="w-2.5 h-2.5 inline mr-0.5" /> : "—"}
                    {seg.trend}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
                  <span>Audience: <span className="text-foreground/70">{seg.size}</span></span>
                  <span>Eng: <span className="text-primary font-semibold">{seg.engagement}</span></span>
                </div>
                <div className="mt-2 flex items-center gap-1.5">
                  <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary/60 rounded-full" style={{ width: `${seg.quality}%` }} />
                  </div>
                  <span className="text-[10px] text-primary font-semibold">{seg.quality}</span>
                  <span className="text-[9px] text-muted-foreground">quality</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-amber-500/20 bg-amber-500/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <ArrowUpRight className="w-3.5 h-3.5 text-amber-400" />
            Expansion Opportunities — Underserved Segments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {expansionOpportunities.map(opp => (
              <div key={opp.area} className="flex items-center justify-between gap-4 p-3 rounded-lg bg-black/20 border border-white/5">
                <div>
                  <p className="text-xs font-semibold">{opp.area}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{opp.rationale}</p>
                </div>
                <div className="text-right shrink-0">
                  <Badge
                    variant="outline"
                    className={`text-[9px] mb-1 ${opp.opportunity === "High" ? "text-amber-400 border-amber-500/30 bg-amber-500/10" : "text-sky-400 border-sky-500/30 bg-sky-500/10"}`}
                  >
                    {opp.opportunity}
                  </Badge>
                  <p className="text-[10px] text-muted-foreground">{opp.penetration}% penetration</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
