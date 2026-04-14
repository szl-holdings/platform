import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@szl-holdings/shared-ui/ui/card";
import { Badge } from "@szl-holdings/shared-ui/ui/badge";
import { BarChart3, TrendingUp, Heart, MessageSquare, Eye, Globe, ArrowUpRight, Zap, Radio } from "lucide-react";
import { usePageMeta } from "@/hooks/usePageMeta";

type Period = "7d" | "30d" | "90d";

const kpisByPeriod: Record<Period, {
  totalReach: string; engagementRate: string; shareOfVoice: string; brandSentiment: string;
  reachDelta: string; engDelta: string; sovDelta: string; sentDelta: string;
}> = {
  "7d": { totalReach: "412K", engagementRate: "6.2%", shareOfVoice: "8.4%", brandSentiment: "94", reachDelta: "+12%", engDelta: "+0.4pp", sovDelta: "+0.8pp", sentDelta: "+2" },
  "30d": { totalReach: "1.8M", engagementRate: "6.8%", shareOfVoice: "9.1%", brandSentiment: "92", reachDelta: "+24%", engDelta: "+1.2pp", sovDelta: "+1.4pp", sentDelta: "+4" },
  "90d": { totalReach: "4.9M", engagementRate: "5.9%", shareOfVoice: "7.8%", brandSentiment: "91", reachDelta: "+61%", engDelta: "+2.1pp", sovDelta: "+2.9pp", sentDelta: "+7" },
};

const platformBreakdown = [
  { platform: "LinkedIn", reach: "284K followers", posts: 18, avgEng: "6.8%", topPost: "94.7K views", color: "bg-sky-500", pct: 68 },
  { platform: "Newsletter", reach: "41K subscribers", posts: 12, avgEng: "42% open rate", topPost: "41K opens", color: "bg-amber-500", pct: 14 },
  { platform: "Twitter / X", reach: "38K followers", posts: 24, avgEng: "4.1%", topPost: "28.3K impressions", color: "bg-blue-500", pct: 10 },
  { platform: "Published Articles", reach: "Various publications", posts: 6, avgEng: "7.4%", topPost: "HBR · 94.7K reads", color: "bg-emerald-500", pct: 8 },
];

const topContent = [
  { title: "The 6 Lenses of Business Observability", platform: "HBR", date: "Mar 20", reach: "94.7K", eng: "4.0%", shares: 1840, type: "Article" },
  { title: "Why I Bet Everything on the AIOps Revolution", platform: "LinkedIn", date: "Jan 12", reach: "350K", eng: "9.2%", shares: 4100, type: "Post" },
  { title: "The AI-Native Company in 2026", platform: "Forbes", date: "Mar 15", reach: "47.2K", eng: "3.9%", shares: 920, type: "Article" },
  { title: "Maritime AI Thread — Dark Vessel Activity", platform: "Twitter", date: "Feb 28", reach: "28.3K", eng: "7.1%", shares: 380, type: "Thread" },
  { title: "SZL Ecosystem Investing Playbook", platform: "Substack", date: "Dec 5", reach: "28.9K", eng: "5.8%", shares: 640, type: "Newsletter" },
];

const sentimentTopics = [
  { topic: "AI Strategy & Enterprise", sentiment: 96, mentions: "4.2K", trend: "up" },
  { topic: "Maritime Intelligence", sentiment: 94, mentions: "1.8K", trend: "up" },
  { topic: "Ecosystem Investing", sentiment: 91, mentions: "2.1K", trend: "up" },
  { topic: "AIOps & Platform Eng", sentiment: 93, mentions: "3.4K", trend: "stable" },
  { topic: "Personal Brand / Leadership", sentiment: 88, mentions: "1.1K", trend: "up" },
  { topic: "SZL Holdings", sentiment: 89, mentions: "2.8K", trend: "stable" },
];

const weeklyReach = [
  { week: "W1", reach: 310 },
  { week: "W2", reach: 280 },
  { week: "W3", reach: 420 },
  { week: "W4", reach: 370 },
  { week: "W5", reach: 490 },
  { week: "W6", reach: 380 },
  { week: "W7", reach: 520 },
  { week: "W8", reach: 440 },
];

const competitorSoV = [
  { name: "Stephen Lutar", pct: 9.1, color: "bg-primary" },
  { name: "Peer A", pct: 14.2, color: "bg-muted-foreground" },
  { name: "Peer B", pct: 11.8, color: "bg-muted-foreground" },
  { name: "Peer C", pct: 7.4, color: "bg-muted-foreground" },
  { name: "Others", pct: 57.5, color: "bg-muted/20" },
];

export default function InfluenceMetrics() {
  usePageMeta({
    title: "Influence Metrics | Stephen Lutar",
    description: "The KPIs of thought leadership — content reach, audience growth, engagement quality, and brand sentiment presented as a business dashboard.",
    canonical: "https://szlholdings.com/stephen/influence",
  });

  const [period, setPeriod] = useState<Period>("30d");
  const kpis = kpisByPeriod[period];
  const maxReach = Math.max(...weeklyReach.map(w => w.reach));

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-primary" />
            Influence Metrics
          </h1>
          <p className="text-sm text-muted-foreground mt-1">The KPIs of thought leadership — reach, engagement quality, share of voice, and brand sentiment</p>
        </div>
        <div className="flex gap-1.5">
          {(["7d", "30d", "90d"] as Period[]).map(p => (
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
          { label: "Total Content Reach", value: kpis.totalReach, delta: kpis.reachDelta, icon: Eye, color: "text-primary" },
          { label: "Avg Engagement Rate", value: kpis.engagementRate, delta: kpis.engDelta, icon: Heart, color: "text-rose-400" },
          { label: "Share of Voice", value: kpis.shareOfVoice, delta: kpis.sovDelta, icon: Radio, color: "text-sky-400" },
          { label: "Brand Sentiment Score", value: kpis.brandSentiment, delta: kpis.sentDelta, icon: Zap, color: "text-amber-400" },
        ].map(({ label, value, delta, icon: Icon, color }) => (
          <Card key={label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Icon className={`w-3.5 h-3.5 ${color}`} />
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
              <div className="flex items-end gap-2">
                <p className={`text-2xl font-bold ${color}`}>{value}</p>
                <span className="text-[10px] text-emerald-400 mb-0.5 flex items-center gap-0.5">
                  <ArrowUpRight className="w-3 h-3" />{delta}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              Weekly Content Reach (8-Week Trend)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2 h-32">
              {weeklyReach.map(w => (
                <div key={w.week} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[9px] text-muted-foreground">{w.reach}K</span>
                  <div
                    className="w-full bg-primary/40 hover:bg-primary/60 transition-colors rounded-sm cursor-default"
                    style={{ height: `${(w.reach / maxReach) * 96}px` }}
                  />
                  <span className="text-[9px] text-muted-foreground">{w.week}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
              <span>Average weekly reach</span>
              <span className="font-bold text-foreground">401K</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Globe className="w-3.5 h-3.5 text-muted-foreground" />
              Share of Voice
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-[10px] text-muted-foreground">AI Strategy & Enterprise Leadership — public intellectual category</p>
            {competitorSoV.map(item => (
              <div key={item.name}>
                <div className="flex justify-between text-[10px] mb-1">
                  <span className={item.name === "Stephen Lutar" ? "text-primary font-semibold" : "text-muted-foreground"}>{item.name}</span>
                  <span className={item.name === "Stephen Lutar" ? "text-primary font-bold" : "text-muted-foreground"}>{item.pct}%</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className={`h-full ${item.color} rounded-full opacity-70`} style={{ width: `${item.pct}%` }} />
                </div>
              </div>
            ))}
            <div className="pt-2 text-[10px] text-muted-foreground border-t border-border">
              SoV up 1.4pp in 30 days — strong upward momentum.
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <BarChart3 className="w-3.5 h-3.5 text-muted-foreground" />
            Platform Performance Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {platformBreakdown.map(p => (
              <div key={p.platform} className="flex gap-4 p-3 rounded-lg bg-muted/20 border border-border">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-semibold">{p.platform}</p>
                    <span className="text-[10px] text-muted-foreground">{p.pct}% of total reach</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full mb-2 overflow-hidden">
                    <div className={`h-full ${p.color} opacity-50 rounded-full`} style={{ width: `${p.pct}%` }} />
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-[10px] text-muted-foreground">
                    <div><span className="text-foreground/70 font-medium">{p.posts}</span><br />pieces</div>
                    <div><span className="text-foreground/70 font-medium">{p.avgEng}</span><br />avg eng.</div>
                    <div><span className="text-emerald-400 font-medium">↑ Top</span><br />{p.topPost}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              Brand Sentiment by Topic
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {sentimentTopics.map(topic => (
              <div key={topic.topic}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-foreground/80">{topic.topic}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground text-[10px]">{topic.mentions} mentions</span>
                    <span className={`font-bold text-sm ${topic.sentiment >= 93 ? "text-emerald-400" : topic.sentiment >= 88 ? "text-amber-400" : "text-red-400"}`}>
                      {topic.sentiment}
                    </span>
                  </div>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${topic.sentiment >= 93 ? "bg-emerald-500/60" : "bg-amber-500/60"}`}
                    style={{ width: `${topic.sentiment}%` }}
                  />
                </div>
              </div>
            ))}
            <p className="text-[10px] text-muted-foreground pt-1 border-t border-border">Overall brand sentiment: <span className="text-emerald-400 font-semibold">92/100</span> · Industry benchmark: 74/100</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Heart className="w-3.5 h-3.5 text-rose-400" />
              Top Performing Content
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {topContent.map((c, i) => (
              <div key={c.title} className="flex items-start gap-3 p-2.5 rounded-lg bg-muted/20 border border-border">
                <span className="text-xs font-bold text-muted-foreground w-4 shrink-0 mt-0.5">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium leading-snug line-clamp-1">{c.title}</p>
                  <div className="flex gap-3 mt-1 text-[10px] text-muted-foreground">
                    <span className="text-primary">{c.platform}</span>
                    <span className="flex items-center gap-0.5"><Eye className="w-2.5 h-2.5" />{c.reach}</span>
                    <span className="text-emerald-400">{c.eng}</span>
                    <span className="flex items-center gap-0.5"><MessageSquare className="w-2.5 h-2.5" />{c.shares}</span>
                  </div>
                </div>
                <Badge variant="outline" className="text-[9px] shrink-0">{c.type}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
