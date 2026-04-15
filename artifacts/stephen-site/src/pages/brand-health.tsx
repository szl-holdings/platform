import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@szl-holdings/shared-ui/ui/card";
import { Badge } from "@szl-holdings/shared-ui/ui/badge";
import { Shield, TrendingUp, CheckCircle, Activity } from "lucide-react";
import { usePageMeta } from "@/hooks/usePageMeta";

const sentimentData = [
  { topic: "AI Strategy & Enterprise", positive: 96, neutral: 3, negative: 1, mentions: "4.2K", trend: "up", delta: "+3 pts" },
  { topic: "AIOps & Platform Engineering", positive: 93, neutral: 5, negative: 2, mentions: "3.4K", trend: "up", delta: "+2 pts" },
  { topic: "Maritime Intelligence", positive: 94, neutral: 4, negative: 2, mentions: "1.8K", trend: "up", delta: "+4 pts" },
  { topic: "Ecosystem Investing", positive: 91, neutral: 7, negative: 2, mentions: "2.1K", trend: "stable", delta: "0 pts" },
  { topic: "SZL Holdings", positive: 89, neutral: 8, negative: 3, mentions: "2.8K", trend: "up", delta: "+2 pts" },
  { topic: "Cybersecurity", positive: 88, neutral: 9, negative: 3, mentions: "1.4K", trend: "stable", delta: "+1 pt" },
  { topic: "Personal Brand / Leadership", positive: 92, neutral: 6, negative: 2, mentions: "1.1K", trend: "up", delta: "+5 pts" },
];

const competitorSoV = [
  { name: "Stephen Lutar", pct: 9.1, color: "bg-primary", textColor: "text-primary", delta: "+1.4pp" },
  { name: "Competitor A", pct: 14.2, color: "bg-zinc-600", textColor: "text-zinc-400", delta: "-0.8pp" },
  { name: "Competitor B", pct: 11.8, color: "bg-zinc-600", textColor: "text-zinc-400", delta: "-0.3pp" },
  { name: "Competitor C", pct: 7.4, color: "bg-zinc-600", textColor: "text-zinc-400", delta: "+0.2pp" },
  { name: "Others", pct: 57.5, color: "bg-muted/30", textColor: "text-muted-foreground", delta: "" },
];

const recentMentions = [
  { source: "Financial Times", text: "Stephen Lutar's Lyte platform has emerged as a genuine enterprise AIOps challenger...", sentiment: "positive", time: "2h ago", reach: "1.2M" },
  { source: "LinkedIn", text: "Thread on 'ecosystem moats' is getting huge traction — Lutar's framework is genuinely insightful", sentiment: "positive", time: "4h ago", reach: "284K" },
  { source: "Hacker News", text: "SZL Holdings portfolio approach is interesting — reminds me of Berkshire but for tech startups", sentiment: "neutral", time: "6h ago", reach: "450K" },
  { source: "Twitter", text: "Just finished the AIOps Masterclass — @stephenlutar this is the best content on the space, period", sentiment: "positive", time: "8h ago", reach: "38K" },
  { source: "Reddit r/startups", text: "Anyone know if Vessels is actually profitable? Claims seem aggressive for maritime AI...", sentiment: "neutral", time: "12h ago", reach: "180K" },
  { source: "LinkedIn", text: "Stephen Lutar's maritime piece doesn't account for regulatory complexity — oversimplified", sentiment: "negative", time: "1d ago", reach: "12K" },
];

const crisisPlaybook = [
  { trigger: "Negative coverage in Tier 1 outlet", response: "Personal statement within 4 hours + LinkedIn post addressing directly", escalation: "Low" },
  { trigger: "Factual inaccuracy in media coverage", response: "Direct outreach to journalist with correction + public clarification post", escalation: "Medium" },
  { trigger: "Coordinated negative campaign on social", response: "Legal review + statement + activate relationships with Tier 1 journalists", escalation: "High" },
  { trigger: "Product failure covered publicly", response: "Radical transparency post + roadmap update + personal accountability statement", escalation: "High" },
  { trigger: "Competitor misrepresentation", response: "Data-led rebuttal post + brief journalist contacts with facts", escalation: "Low" },
];

const weeklyMentions = [42, 58, 51, 74, 68, 91, 84, 108, 96, 124, 112, 141];

export default function BrandHealth() {
  usePageMeta({
    title: "Brand Health Monitor | Stephen Lutar — Reputation Intelligence",
    description: "Real-time brand health monitoring: sentiment analysis, share of voice, mention tracking, and crisis detection for Stephen Lutar.",
    canonical: "https://szlholdings.com/stephen/brand-health",
  });

  const [activeTab, setActiveTab] = useState<"overview" | "mentions" | "sov" | "crisis">("overview");
  const [selectedSentiment, setSelectedSentiment] = useState<string | null>(null);

  const overallSentiment = Math.round(sentimentData.reduce((s, d) => s + d.positive, 0) / sentimentData.length);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            Brand Health Monitor
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Real-time mention tracking, sentiment analysis, share of voice, and crisis detection</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs text-emerald-400 border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block mr-1.5 animate-pulse" />
            Live Monitoring
          </Badge>
          <Badge variant="outline" className="text-xs text-emerald-400 border-emerald-500/20">No Active Risks</Badge>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Brand Sentiment", value: `${overallSentiment}/100`, color: "text-emerald-400", sub: "+4 pts vs. last month" },
          { label: "Monthly Mentions", value: "16.8K", color: "text-primary", sub: "+41% MoM growth" },
          { label: "Share of Voice", value: "9.1%", color: "text-sky-400", sub: "+1.4pp vs. Q4 2025" },
          { label: "Crisis Risk Level", value: "Low", color: "text-emerald-400", sub: "No active incidents" },
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
        {(["overview", "mentions", "sov", "crisis"] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors ${
              activeTab === tab ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab === "sov" ? "Share of Voice" : tab === "crisis" ? "Crisis Playbook" : tab}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <div className="space-y-6">
          <Card className="bg-card/50 border-border/40">
            <CardHeader className="pb-3"><CardTitle className="text-sm">Sentiment by Topic</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {sentimentData.map(d => (
                <div
                  key={d.topic}
                  onClick={() => setSelectedSentiment(selectedSentiment === d.topic ? null : d.topic)}
                  className={`cursor-pointer p-3 rounded-lg border transition-all ${selectedSentiment === d.topic ? "border-primary/40 bg-primary/5" : "border-border/20 hover:border-border/40"}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{d.topic}</span>
                      <Badge variant="outline" className={`text-xs ${d.trend === "up" ? "text-emerald-400 border-emerald-500/20" : "text-zinc-400"}`}>
                        {d.trend === "up" ? <TrendingUp className="w-2.5 h-2.5 mr-0.5 inline" /> : "—"}{d.delta}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{d.mentions} mentions</span>
                      <span className="text-emerald-400 font-bold">{d.positive}%</span>
                    </div>
                  </div>
                  <div className="flex h-2 rounded-full overflow-hidden gap-0.5">
                    <div className="bg-emerald-500/60 rounded-l-full" style={{ width: `${d.positive}%` }} />
                    <div className="bg-zinc-500/40" style={{ width: `${d.neutral}%` }} />
                    <div className="bg-red-500/60 rounded-r-full" style={{ width: `${d.negative}%` }} />
                  </div>
                  {selectedSentiment === d.topic && (
                    <div className="flex gap-4 mt-2 text-xs">
                      <span className="text-emerald-400">Positive: {d.positive}%</span>
                      <span className="text-zinc-400">Neutral: {d.neutral}%</span>
                      <span className="text-red-400">Negative: {d.negative}%</span>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-border/40">
            <CardHeader className="pb-3"><CardTitle className="text-sm">Mention Volume (12 Weeks)</CardTitle></CardHeader>
            <CardContent>
              <div className="flex items-end gap-1 h-20">
                {weeklyMentions.map((v, i) => (
                  <div key={i} className="flex-1">
                    <div
                      className={`w-full rounded-sm ${i >= 9 ? "bg-primary" : "bg-primary/30"}`}
                      style={{ height: `${(v / 145) * 80}px` }}
                      title={`Week ${i + 1}: ${v} mentions`}
                    />
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-xs text-muted-foreground/60 mt-1">
                <span>12 weeks ago</span><span>This week</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "mentions" && (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex gap-2">
              {(["All", "Positive", "Neutral", "Negative"] as const).map(f => (
                <button key={f} className="px-3 py-1 text-xs bg-muted/30 border border-border/40 rounded-full hover:bg-muted/50 transition-colors">{f}</button>
              ))}
            </div>
          </div>
          {recentMentions.map((m, i) => (
            <Card key={i} className="bg-card/50 border-border/40">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${m.sentiment === "positive" ? "bg-emerald-400" : m.sentiment === "negative" ? "bg-red-400" : "bg-zinc-400"}`} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-xs font-bold text-primary">{m.source}</span>
                      <span className="text-xs text-muted-foreground">{m.time}</span>
                      <span className="text-xs text-muted-foreground">Reach: {m.reach}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">"{m.text}"</p>
                  </div>
                  <Badge variant="outline" className={`text-xs shrink-0 ${m.sentiment === "positive" ? "text-emerald-400 border-emerald-500/20" : m.sentiment === "negative" ? "text-red-400 border-red-500/20" : "text-zinc-400"}`}>
                    {m.sentiment}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {activeTab === "sov" && (
        <div className="space-y-6">
          <Card className="bg-card/50 border-border/40">
            <CardHeader className="pb-3"><CardTitle className="text-sm">Share of Voice vs. Peers</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {competitorSoV.map(c => (
                <div key={c.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className={`font-medium ${c.textColor}`}>{c.name}</span>
                    <div className="flex items-center gap-2">
                      {c.delta && <span className={`${c.delta.startsWith("+") ? "text-emerald-400" : "text-red-400"}`}>{c.delta}</span>}
                      <span className={`font-bold ${c.textColor}`}>{c.pct}%</span>
                    </div>
                  </div>
                  <div className="h-2 bg-muted/20 rounded-full overflow-hidden">
                    <div className={`h-full ${c.color} rounded-full transition-all`} style={{ width: `${c.pct}%` }} />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Topics Where #1", value: "3 of 7", sub: "AI Strategy, AIOps, Maritime", color: "text-emerald-400" },
              { label: "Topics Gaining Ground", value: "5 of 7", sub: "Positive SoV trend", color: "text-primary" },
              { label: "Closest Competitor Gap", value: "+5.1pp", sub: "vs. 3rd place in AI topics", color: "text-sky-400" },
            ].map(m => (
              <Card key={m.label} className="bg-card/50 border-border/40">
                <CardContent className="p-4">
                  <div className={`text-xl font-bold ${m.color}`}>{m.value}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{m.label}</div>
                  <div className="text-xs text-muted-foreground/60 mt-1">{m.sub}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {activeTab === "crisis" && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-lg">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <p className="text-xs text-muted-foreground">No active crisis incidents. Monitoring 14 signals in real time. Last scan: 4 minutes ago.</p>
          </div>

          <div className="space-y-3">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Response Playbooks</div>
            {crisisPlaybook.map((play, i) => (
              <Card key={i} className="bg-card/50 border-border/40">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${play.escalation === "High" ? "bg-red-400" : play.escalation === "Medium" ? "bg-amber-400" : "bg-emerald-400"}`} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-sm font-semibold">{play.trigger}</span>
                        <Badge variant="outline" className={`text-xs ${play.escalation === "High" ? "text-red-400 border-red-500/20" : play.escalation === "Medium" ? "text-amber-400 border-amber-500/20" : "text-emerald-400 border-emerald-500/20"}`}>
                          {play.escalation} escalation
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{play.response}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="bg-card/50 border-border/40">
            <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><Activity className="w-4 h-4 text-primary" />Monitored Signals</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {["LinkedIn mentions", "Twitter/X mentions", "Reddit threads", "News articles", "Hacker News", "Quora", "Facebook groups", "YouTube comments", "Podcast mentions", "Competitor comparisons", "Product reviews", "Brand keyword variants", "Executive name variants", "Company name variants"].map(signal => (
                  <div key={signal} className="flex items-center gap-2 text-xs text-muted-foreground py-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                    {signal}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
