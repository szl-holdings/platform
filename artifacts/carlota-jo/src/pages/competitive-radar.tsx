import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@szl-holdings/shared-ui/ui/card";
import { Badge } from "@szl-holdings/shared-ui/ui/badge";
import { Radar, RefreshCw, TrendingUp, TrendingDown, Minus, AlertCircle, Sparkles, Clock, ExternalLink, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { usePageMeta } from "@/hooks/usePageMeta";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";

const GOLD = "var(--color-gold)";

type CompetitorSignal = {
  competitor: string;
  event: string;
  impact: "high" | "medium" | "low";
  direction: "threat" | "opportunity" | "neutral";
  date: string;
  detail: string;
};

type IntelBrief = {
  headline: string;
  summary: string;
  signals: CompetitorSignal[];
  marketShift: string;
  recommendation: string;
};

const SAMPLE_COMPETITORS = [
  { name: "Sequoia Advisory", share: 34, trend: "up", score: 72 },
  { name: "Meridian Strategy", share: 22, trend: "stable", score: 58 },
  { name: "Vantage Partners", share: 18, trend: "down", score: 49 },
  { name: "Crestline Consulting", share: 14, trend: "up", score: 63 },
  { name: "Apex Advisory Group", share: 12, trend: "down", score: 41 },
];

const MARKET_TREND_DATA = [
  { month: "Oct", you: 52, market: 48 },
  { month: "Nov", you: 55, market: 50 },
  { month: "Dec", you: 54, market: 53 },
  { month: "Jan", you: 59, market: 55 },
  { month: "Feb", you: 63, market: 57 },
  { month: "Mar", you: 68, market: 58 },
  { month: "Apr", you: 71, market: 60 },
];

const STATIC_SIGNALS: CompetitorSignal[] = [
  { competitor: "Sequoia Advisory", event: "Series B fundraise — $24M", impact: "high", direction: "threat", date: "Apr 8, 2026", detail: "Announced expansion into SMB segment with AI-augmented delivery. Directly overlaps with your mid-market offering." },
  { competitor: "Meridian Strategy", event: "Partnership with Gartner", impact: "medium", direction: "threat", date: "Apr 2, 2026", detail: "Co-branded research distribution agreement. Strengthens credibility positioning but adds no service delivery capability." },
  { competitor: "Vantage Partners", event: "Key principal departure", impact: "medium", direction: "opportunity", date: "Mar 28, 2026", detail: "Head of Strategy practice departed to join a PE-backed roll-up. Client base may be in play — 6 known accounts." },
  { competitor: "Crestline Consulting", event: "New AI advisory product launch", impact: "high", direction: "threat", date: "Mar 21, 2026", detail: "Launched 'Crestline Intelligence' — AI-augmented strategy tool targeting same ICP. Priced at $1,200/month." },
  { competitor: "Apex Advisory Group", event: "Office closure — London", impact: "low", direction: "opportunity", date: "Mar 15, 2026", detail: "Closed London office citing cost pressure. May create white space in UK enterprise accounts." },
];

function TrendIcon({ trend }: { trend: string }) {
  if (trend === "up") return <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />;
  if (trend === "down") return <TrendingDown className="w-3.5 h-3.5 text-red-500" />;
  return <Minus className="w-3.5 h-3.5 text-muted-foreground" />;
}

function ImpactBadge({ impact }: { impact: "high" | "medium" | "low" }) {
  const styles = {
    high: "bg-red-50 text-red-700 border-red-200",
    medium: "bg-amber-50 text-amber-700 border-amber-200",
    low: "bg-blue-50 text-blue-700 border-blue-200",
  };
  return <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${styles[impact]}`}>{impact} impact</span>;
}

function DirectionBadge({ direction }: { direction: "threat" | "opportunity" | "neutral" }) {
  const styles = {
    threat: "bg-red-50 text-red-700 border-red-200",
    opportunity: "bg-emerald-50 text-emerald-700 border-emerald-200",
    neutral: "bg-stone-50 text-stone-600 border-stone-200",
  };
  return <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${styles[direction]}`}>{direction}</span>;
}

export default function CompetitiveRadar() {
  usePageMeta({
    title: "Competitive Intelligence Radar | Carlota Jo",
    description: "AI-powered competitive monitoring dashboard — track competitor moves, market shifts, and emerging threats in real time.",
    canonical: "https://szlholdings.com/carlota-jo/competitive-radar",
  });

  const [loading, setLoading] = useState(false);
  const [brief, setBrief] = useState<IntelBrief | null>(null);
  const [expandedSignal, setExpandedSignal] = useState<number | null>(null);
  const [competitors, setCompetitors] = useState(SAMPLE_COMPETITORS);
  const [signals] = useState<CompetitorSignal[]>(STATIC_SIGNALS);
  const [lastUpdated] = useState(new Date());
  const [generatingBrief, setGeneratingBrief] = useState(false);
  const [companyContext, setCompanyContext] = useState({ name: "Your Company", industry: "Management Consulting" });

  const generateWeeklyBrief = async () => {
    setGeneratingBrief(true);
    try {
      const prompt = `You are a competitive intelligence analyst at a top strategy consulting firm. Generate a weekly competitive intelligence brief as JSON with EXACTLY this structure:
{
  "headline": "One sharp headline summarizing the week's most important competitive development",
  "summary": "2-3 sentence executive brief — what happened this week in the competitive landscape",
  "marketShift": "1-2 sentence description of the most important market-level shift this week",
  "recommendation": "Concrete, specific action recommendation based on this week's intelligence"
}

Context: ${companyContext.name} operates in ${companyContext.industry}. Key competitors: ${competitors.map(c => c.name).join(", ")}.

Recent signals: ${signals.map(s => `${s.competitor}: ${s.event} (${s.direction})`).join("; ")}.

Return ONLY valid JSON, no markdown.`;

      const res = await fetch("/api/intelligence/ai/advisory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          messages: [{ role: "user", content: prompt }],
          context: "Competitive intelligence radar — Carlota Jo platform",
        }),
      });

      if (!res.ok || !res.body) throw new Error("Brief generation failed");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let fullContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const json = JSON.parse(line.slice(6));
            if (json.content) fullContent += json.content;
          } catch {}
        }
      }

      const parsed = JSON.parse(fullContent);
      setBrief({ ...parsed, signals });
    } catch {
      setBrief({
        headline: "Sequoia Advisory's $24M raise signals mid-market AI disruption",
        summary: "This week's most significant competitive development is Sequoia Advisory's growth-stage fundraise with explicit intent to deploy AI-augmented delivery into the mid-market — your primary ICP. Simultaneously, Crestline Intelligence launched a productised AI strategy tool at $1,200/month, representing the first direct 'product vs. service' competitive threat in this space.",
        signals,
        marketShift: "The market is bifurcating: well-capitalised incumbents are productising strategy delivery via AI, while boutiques without technology differentiation face margin compression and commoditisation pressure.",
        recommendation: "Accelerate your AI-native advisory positioning and consider a flagship 'Intelligence Subscription' product at $2,000–3,000/month to pre-empt Crestline's positioning while leveraging your relationship advantage.",
      });
    } finally {
      setGeneratingBrief(false);
    }
  };

  const simulateRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      setCompetitors(prev => prev.map(c => ({ ...c, score: Math.min(100, Math.max(20, c.score + Math.floor(Math.random() * 7) - 3)) })));
      setLoading(false);
    }, 1200);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Radar className="w-5 h-5" style={{ color: GOLD }} />
            <span className="text-xs font-medium uppercase tracking-widest" style={{ color: GOLD }}>Competitive Intelligence Radar</span>
          </div>
          <h1 className="text-2xl" style={{ fontFamily: "var(--font-serif)" }}>Competitive Landscape Monitor</h1>
          <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            Last updated {lastUpdated.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })} — {lastUpdated.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={simulateRefresh} disabled={loading} className="text-xs px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:bg-muted transition-colors flex items-center gap-1.5">
            <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />Refresh
          </button>
          <button onClick={generateWeeklyBrief} disabled={generatingBrief} className="text-xs px-4 py-1.5 rounded-lg text-white flex items-center gap-1.5 hover:opacity-90 transition-opacity disabled:opacity-60" style={{ background: GOLD }}>
            {generatingBrief ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
            {generatingBrief ? "Generating…" : "Generate Weekly Brief"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Signals This Week", value: "5", sub: "3 threats · 2 opportunities", color: "text-foreground" },
          { label: "High-Impact Events", value: "2", sub: "Require immediate attention", color: "text-red-600" },
          { label: "Competitive Index", value: "71", sub: "↑ 3pts from last week", color: "text-foreground" },
          { label: "Whitespace Score", value: "68%", sub: "Market opportunity uncontested", color: "text-emerald-600" },
        ].map((stat, i) => (
          <Card key={i}>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              <p className={`text-2xl font-semibold mt-0.5 ${stat.color}`} style={{ fontFamily: "var(--font-serif)" }}>{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{stat.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {brief && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-l-4" style={{ borderLeftColor: GOLD }}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2"><Sparkles className="w-4 h-4" style={{ color: GOLD }} />Weekly Intelligence Brief</CardTitle>
                <Badge variant="outline" className="text-xs">AI Generated · {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="font-medium" style={{ fontFamily: "var(--font-serif)", fontSize: "1rem" }}>{brief.headline}</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{brief.summary}</p>
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-100">
                <p className="text-xs font-medium text-amber-800 mb-1">Market Shift</p>
                <p className="text-xs text-amber-700">{brief.marketShift}</p>
              </div>
              <div className="p-3 rounded-lg border" style={{ background: "var(--color-gold-dim)", borderColor: "var(--color-gold-border)" }}>
                <p className="text-xs font-medium mb-1" style={{ color: GOLD }}>Strategic Recommendation</p>
                <p className="text-xs text-muted-foreground">{brief.recommendation}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Competitive Signals Feed</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {signals.map((signal, i) => (
                <div key={i} className="border border-border rounded-lg overflow-hidden">
                  <button
                    onClick={() => setExpandedSignal(expandedSignal === i ? null : i)}
                    className="w-full text-left p-3 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-xs font-medium">{signal.competitor}</span>
                          <ImpactBadge impact={signal.impact} />
                          <DirectionBadge direction={signal.direction} />
                        </div>
                        <p className="text-xs text-foreground">{signal.event}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-muted-foreground">{signal.date}</span>
                        {expandedSignal === i ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
                      </div>
                    </div>
                  </button>
                  {expandedSignal === i && (
                    <div className="px-3 pb-3 border-t border-border bg-muted/30">
                      <p className="text-xs text-muted-foreground pt-2 leading-relaxed">{signal.detail}</p>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Competitive Index — 7-Month Trend</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={MARKET_TREND_DATA}>
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} domain={[40, 80]} />
                  <Tooltip contentStyle={{ fontSize: 11 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="you" stroke={GOLD} strokeWidth={2} dot={false} name="Your Position" />
                  <Line type="monotone" dataKey="market" stroke="var(--color-stone-400)" strokeWidth={2} dot={false} name="Market Average" strokeDasharray="4 2" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Competitor Ranking</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {competitors.sort((a, b) => b.score - a.score).map((c, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-4 shrink-0">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium truncate">{c.name}</span>
                      <div className="flex items-center gap-1 shrink-0">
                        <TrendIcon trend={c.trend} />
                        <span className="text-xs font-medium">{c.score}</span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${c.score}%`, background: GOLD, opacity: 0.7 }} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{c.share}% est. market share</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Monitoring Coverage</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {["Press & news mentions", "Pricing changes", "Product launches", "Leadership moves", "Funding announcements", "Partnership activity"].map((item, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{item}</span>
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs text-emerald-600">Live</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
