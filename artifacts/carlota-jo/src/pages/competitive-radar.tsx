import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@szl-holdings/shared-ui/ui/card";
import { Badge } from "@szl-holdings/shared-ui/ui/badge";
import { Radar, TrendingUp, TrendingDown, Minus, AlertCircle, Sparkles, Clock, Loader2, ChevronDown, ChevronUp, Settings2, X, Plus, RefreshCw, ExternalLink } from "lucide-react";
import { usePageMeta } from "@/hooks/usePageMeta";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import ClientScopeSwitcher, { useClientScope } from "@/components/ClientScopeSwitcher";

const GOLD = "var(--color-gold)";

type CompetitorSignal = {
  competitor: string;
  event: string;
  impact: "high" | "medium" | "low";
  direction: "threat" | "opportunity" | "neutral";
  date: string;
  detail: string;
  source?: string;
  url?: string;
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

const DEFAULT_COMPETITOR_NAMES = ["McKinsey & Company", "BCG", "Bain & Company", "Oliver Wyman", "Roland Berger", "Kearney"];
const COMPETITORS_STORAGE_KEY = "carlota-radar-competitors";
const REFRESH_INTERVAL_STORAGE_KEY = "carlota-radar-refresh-interval";

const REFRESH_OPTIONS: Array<{ label: string; value: number }> = [
  { label: "Off", value: 0 },
  { label: "1 min", value: 60_000 },
  { label: "5 min", value: 5 * 60_000 },
  { label: "15 min", value: 15 * 60_000 },
  { label: "1 hr", value: 60 * 60_000 },
];

function loadCompetitorList(): string[] {
  if (typeof window === "undefined") return DEFAULT_COMPETITOR_NAMES;
  try {
    const raw = localStorage.getItem(COMPETITORS_STORAGE_KEY);
    if (!raw) return DEFAULT_COMPETITOR_NAMES;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.every((s) => typeof s === "string") && parsed.length > 0) return parsed;
  } catch {}
  return DEFAULT_COMPETITOR_NAMES;
}

function loadRefreshInterval(): number {
  if (typeof window === "undefined") return 5 * 60_000;
  try {
    const raw = localStorage.getItem(REFRESH_INTERVAL_STORAGE_KEY);
    if (raw == null) return 5 * 60_000;
    const n = Number(raw);
    if (REFRESH_OPTIONS.some((o) => o.value === n)) return n;
  } catch {}
  return 5 * 60_000;
}

export default function CompetitiveRadar() {
  usePageMeta({
    title: "Competitive Intelligence Radar | Carlota Jo",
    description: "Evidence-backed competitive monitoring dashboard — track competitor moves, market shifts, and emerging threats in real time.",
    canonical: "https://szlholdings.com/carlota-jo/competitive-radar",
  });

  const [brief, setBrief] = useState<IntelBrief | null>(null);
  const [expandedSignal, setExpandedSignal] = useState<number | null>(null);
  const [competitors, setCompetitors] = useState<CompetitorEntry[]>([]);
  const [signals, setSignals] = useState<CompetitorSignal[]>([]);
  const [marketTrend, setMarketTrend] = useState<MarketTrendPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [generatingBrief, setGeneratingBrief] = useState(false);
  const { clientId, setClientId, clients } = useClientScope();
  const activeClient = clients.find(c => c.id === clientId) ?? null;
  const [companyContext, setCompanyContext] = useState({ name: "Carlota Jo Consulting", industry: "Management Consulting" });
  const [tracked, setTracked] = useState<string[]>(() => loadCompetitorList());
  const [refreshIntervalMs, setRefreshIntervalMs] = useState<number>(() => loadRefreshInterval());
  const [showSettings, setShowSettings] = useState(false);
  const [newCompetitor, setNewCompetitor] = useState("");
  const [liveData, setLiveData] = useState<boolean>(false);
  const [sourceLabel, setSourceLabel] = useState<string>("");
  const [liveSignalCount, setLiveSignalCount] = useState<number>(0);
  const trackedRef = useRef(tracked);
  trackedRef.current = tracked;
  const clientIdRef = useRef(clientId);
  clientIdRef.current = clientId;

  useEffect(() => {
    setCompanyContext(activeClient
      ? { name: activeClient.name, industry: activeClient.industry }
      : { name: "Carlota Jo Consulting", industry: "Management Consulting" });
  }, [activeClient]);

  useEffect(() => {
    try { localStorage.setItem(COMPETITORS_STORAGE_KEY, JSON.stringify(tracked)); } catch {}
  }, [tracked]);

  useEffect(() => {
    try { localStorage.setItem(REFRESH_INTERVAL_STORAGE_KEY, String(refreshIntervalMs)); } catch {}
  }, [refreshIntervalMs]);

  const loadData = useCallback(async (opts: { silent?: boolean } = {}) => {
    if (opts.silent) setRefreshing(true); else setLoading(true);
    try {
      const list = trackedRef.current;
      const params = new URLSearchParams();
      if (list.length > 0) params.set("competitors", list.join(","));
      if (clientIdRef.current) params.set("clientId", clientIdRef.current);
      const qs = params.toString() ? `?${params.toString()}` : "";
      const radarRes = await fetch(`${API}/carlota/radar-signals${qs}`, { credentials: "include" });
      if (radarRes.ok) {
        const json = await radarRes.json();
        const data = json.data ?? json;
        if (Array.isArray(data.signals)) setSignals(data.signals);
        if (Array.isArray(data.competitors)) setCompetitors(data.competitors);
        if (Array.isArray(data.marketTrend)) setMarketTrend(data.marketTrend);
        setLiveData(Boolean(data.liveData));
        setSourceLabel(typeof data.sourceLabel === "string" ? data.sourceLabel : "");
        setLiveSignalCount(typeof data.liveSignalCount === "number" ? data.liveSignalCount : 0);
      }
    } catch {
    } finally {
      setLastUpdated(new Date());
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { void loadData(); }, [loadData, tracked, clientId]);

  useEffect(() => {
    if (refreshIntervalMs <= 0) return;
    const id = window.setInterval(() => { void loadData({ silent: true }); }, refreshIntervalMs);
    return () => window.clearInterval(id);
  }, [refreshIntervalMs, loadData]);

  const addCompetitor = () => {
    const name = newCompetitor.trim();
    if (!name) return;
    if (tracked.some((c) => c.toLowerCase() === name.toLowerCase())) { setNewCompetitor(""); return; }
    if (tracked.length >= 12) return;
    setTracked([...tracked, name]);
    setNewCompetitor("");
  };

  const removeCompetitor = (name: string) => {
    if (tracked.length <= 1) return;
    setTracked(tracked.filter((c) => c !== name));
  };

  const resetCompetitors = () => setTracked(DEFAULT_COMPETITOR_NAMES);

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
          <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5 flex-wrap">
            <Clock className="w-3.5 h-3.5" />
            Last updated {lastUpdated.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })} — {lastUpdated.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            {refreshing && <Loader2 className="w-3 h-3 animate-spin" />}
            {sourceLabel && (
              <span className="text-xs px-2 py-0.5 rounded-full border" style={{ borderColor: liveData ? "var(--color-gold-border)" : "var(--color-stone-300)", background: liveData ? "var(--color-gold-dim)" : "transparent", color: liveData ? GOLD : "var(--color-muted-foreground)" }}>
                {sourceLabel}
              </span>
            )}
          </p>
          {activeClient && (
            <p className="text-xs mt-1" style={{ color: GOLD }}>
              Scoped to <strong>{activeClient.name}</strong> · {activeClient.industry}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <ClientScopeSwitcher clientId={clientId} onChange={setClientId} clients={clients} />
          <select
            value={refreshIntervalMs}
            onChange={(e) => setRefreshIntervalMs(Number(e.target.value))}
            className="text-xs px-2 py-1.5 rounded-lg border border-border bg-background"
            title="Auto-refresh interval"
          >
            {REFRESH_OPTIONS.map((o) => <option key={o.value} value={o.value}>Auto: {o.label}</option>)}
          </select>
          <button onClick={() => loadData()} disabled={loading || refreshing} className="text-xs px-3 py-1.5 rounded-lg border border-border hover:bg-muted/50 transition-colors flex items-center gap-1.5 disabled:opacity-60" title="Refresh now">
            <RefreshCw className={`w-3 h-3 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button onClick={() => setShowSettings((s) => !s)} className="text-xs px-3 py-1.5 rounded-lg border border-border hover:bg-muted/50 transition-colors flex items-center gap-1.5" title="Configure tracked competitors">
            <Settings2 className="w-3 h-3" />
            Competitors
          </button>
          <button onClick={generateWeeklyBrief} disabled={generatingBrief} className="text-xs px-4 py-1.5 rounded-lg text-white flex items-center gap-1.5 hover:opacity-90 transition-opacity disabled:opacity-60" style={{ background: GOLD }}>
            {generatingBrief ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
            {generatingBrief ? "Generating…" : "Generate Weekly Brief"}
          </button>
        </div>
      </div>

      {showSettings && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Settings2 className="w-4 h-4" style={{ color: GOLD }} />
              Tracked Competitors ({tracked.length}/12)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground">Add or remove competitors to monitor. Live news is pulled per-competitor and refreshed at the chosen interval. Saved locally to this browser.</p>
            <div className="flex flex-wrap gap-2">
              {tracked.map((name) => (
                <span key={name} className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border" style={{ borderColor: "var(--color-gold-border)", background: "var(--color-gold-dim)" }}>
                  {name}
                  <button onClick={() => removeCompetitor(name)} disabled={tracked.length <= 1} className="hover:opacity-70 disabled:opacity-30" title={tracked.length <= 1 ? "At least one competitor required" : `Remove ${name}`}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={newCompetitor}
                onChange={(e) => setNewCompetitor(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCompetitor(); } }}
                placeholder="Add a competitor (e.g. EY-Parthenon)"
                maxLength={80}
                className="flex-1 text-xs px-3 py-1.5 rounded-lg border border-border bg-background"
              />
              <button onClick={addCompetitor} disabled={!newCompetitor.trim() || tracked.length >= 12} className="text-xs px-3 py-1.5 rounded-lg text-white flex items-center gap-1.5 hover:opacity-90 transition-opacity disabled:opacity-60" style={{ background: GOLD }}>
                <Plus className="w-3 h-3" /> Add
              </button>
              <button onClick={resetCompetitors} className="text-xs px-3 py-1.5 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                Reset to defaults
              </button>
            </div>
          </CardContent>
        </Card>
      )}

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
          { label: "Live News Signals", value: !loading ? String(liveSignalCount) : "—", sub: liveData ? `From ${tracked.length} tracked competitor${tracked.length === 1 ? "" : "s"}` : loading ? "Loading…" : "Live news unavailable — using curated intel", color: liveData ? "text-emerald-600" : "text-foreground" },
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
                    <div className="px-3 pb-3 border-t border-border bg-muted/30 space-y-2">
                      <p className="text-xs text-muted-foreground pt-2 leading-relaxed">{signal.detail}</p>
                      {(signal.source || signal.url) && (
                        <div className="flex items-center justify-between gap-2 text-xs">
                          {signal.source ? <span className="text-muted-foreground">Source: {signal.source}</span> : <span />}
                          {signal.url && signal.url !== "#" && (
                            <a
                              href={signal.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 hover:underline"
                              style={{ color: GOLD }}
                            >
                              Open article <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      )}
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
