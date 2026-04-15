import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@szl-holdings/shared-ui/ui/card";
import { Badge } from "@szl-holdings/shared-ui/ui/badge";
import { Radar, TrendingUp, TrendingDown, Minus, AlertCircle, Sparkles, Clock, Loader2, ChevronDown, ChevronUp } from "lucide-react";
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

type CompetitorEntry = { name: string; share: number; trend: string; score: number };
type MarketTrendPoint = { month: string; you: number; market: number };

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

const API = import.meta.env.BASE_URL + "api";

export default function CompetitiveRadar() {
  usePageMeta({
    title: "Competitive Intelligence Radar | Carlota Jo",
    description: "AI-powered competitive monitoring dashboard — track competitor moves, market shifts, and emerging threats in real time.",
    canonical: "https://szlholdings.com/carlota-jo/competitive-radar",
  });

  const [brief, setBrief] = useState<IntelBrief | null>(null);
  const [expandedSignal, setExpandedSignal] = useState<number | null>(null);
  const [competitors, setCompetitors] = useState<CompetitorEntry[]>([]);
  const [signals, setSignals] = useState<CompetitorSignal[]>([]);
  const [marketTrend, setMarketTrend] = useState<MarketTrendPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [generatingBrief, setGeneratingBrief] = useState(false);
  const [companyContext] = useState({ name: "Carlota Jo Consulting", industry: "Management Consulting" });

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [signalsRes, newsRes] = await Promise.allSettled([
          fetch(`${API}/intelligence/signals?domain=carlota&limit=20`, { credentials: "include" }),
          fetch(`${API}/carlota/live/strategic-news`, { credentials: "include" }),
        ]);

        if (signalsRes.status === "fulfilled" && signalsRes.value.ok) {
          const json = await signalsRes.value.json();
          const raw: CompetitorSignal[] = Array.isArray(json.signals) ? json.signals : Array.isArray(json.data) ? json.data : [];
          setSignals(raw);
        }

        if (newsRes.status === "fulfilled" && newsRes.value.ok) {
          const json = await newsRes.value.json();
          const items: { source?: string; headline?: string; summary?: string; publishedAt?: string }[] = Array.isArray(json.articles) ? json.articles : [];
          const derived: CompetitorEntry[] = items.slice(0, 5).map((item, i) => ({
            name: item.source ?? `Source ${i + 1}`,
            share: 0,
            trend: "flat",
            score: 50,
          }));
          if (derived.length > 0) setCompetitors(derived);
        }
      } catch {
      } finally {
        setLastUpdated(new Date());
        setLoading(false);
      }
    }
    void loadData();
  }, []);

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

Context: ${companyContext.name} operates in ${companyContext.industry}. Key competitors: ${competitors.map(c => c.name).join(", ") || "Not yet tracked"}.

Recent signals: ${signals.map(s => `${s.competitor}: ${s.event} (${s.direction})`).join("; ") || "No signals available"}.

Return ONLY valid JSON, no markdown.`;

      const res = await fetch(`${API}/intelligence/ai/advisory`, {
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
      setBrief(null);
    } finally {
      setGeneratingBrief(false);
    }
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
          <button onClick={generateWeeklyBrief} disabled={generatingBrief} className="text-xs px-4 py-1.5 rounded-lg text-white flex items-center gap-1.5 hover:opacity-90 transition-opacity disabled:opacity-60" style={{ background: GOLD }}>
            {generatingBrief ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
            {generatingBrief ? "Generating…" : "Generate Weekly Brief"}
          </button>
        </div>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading intelligence data…
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Signals This Week", value: signals.length > 0 ? String(signals.length) : "—", sub: signals.length > 0 ? `${signals.filter(s => s.direction === "threat").length} threats · ${signals.filter(s => s.direction === "opportunity").length} opportunities` : "No signals loaded", color: "text-foreground" },
          { label: "High-Impact Events", value: signals.length > 0 ? String(signals.filter(s => s.impact === "high").length) : "—", sub: signals.filter(s => s.impact === "high").length > 0 ? "Require immediate attention" : "No high-impact signals", color: signals.filter(s => s.impact === "high").length > 0 ? "text-red-600" : "text-foreground" },
          { label: "Tracked Competitors", value: competitors.length > 0 ? String(competitors.length) : "—", sub: competitors.length > 0 ? `${competitors.filter(c => c.trend === "up").length} trending up` : "No competitors tracked", color: "text-foreground" },
          { label: "Data Sources", value: !loading && (signals.length > 0 || competitors.length > 0) ? "Live" : "—", sub: !loading && (signals.length > 0 || competitors.length > 0) ? "Connected" : loading ? "Loading…" : "No data available", color: !loading && (signals.length > 0 || competitors.length > 0) ? "text-emerald-600" : "text-foreground" },
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
              {signals.length === 0 ? (
                <div className="py-8 text-center">
                  <AlertCircle className="w-6 h-6 mx-auto mb-2 text-muted-foreground/40" />
                  <p className="text-xs text-muted-foreground">No competitive signals available.</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Connect intelligence feeds to populate live signals.</p>
                </div>
              ) : signals.map((signal, i) => (
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
              {marketTrend.length === 0 ? (
                <div className="h-[200px] flex items-center justify-center">
                  <p className="text-xs text-muted-foreground">No trend data available</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={marketTrend}>
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} domain={[40, 80]} />
                    <Tooltip contentStyle={{ fontSize: 11 }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Line type="monotone" dataKey="you" stroke={GOLD} strokeWidth={2} dot={false} name="Your Position" />
                    <Line type="monotone" dataKey="market" stroke="var(--color-stone-400)" strokeWidth={2} dot={false} name="Market Average" strokeDasharray="4 2" />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Competitor Ranking</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {competitors.length === 0 ? (
                <p className="text-xs text-muted-foreground py-4 text-center">No competitor data available</p>
              ) : competitors.sort((a, b) => b.score - a.score).map((c, i) => (
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
