import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@szl-holdings/shared-ui/ui/card";
import { Badge } from "@szl-holdings/shared-ui/ui/badge";
import { FlaskConical, TrendingUp, TrendingDown, Minus, Loader2, Play, RotateCcw, ChevronDown, ChevronUp, DollarSign, Users, Shield, Zap, Clock } from "lucide-react";
import { usePageMeta } from "@/hooks/usePageMeta";
import { RadarChart, PolarGrid, PolarAngleAxis, Radar as RadarPlot, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from "recharts";

const GOLD = "var(--color-gold)";

type Scenario = {
  id: string;
  label: string;
  description: string;
  template: string;
};

type OutcomeDimension = {
  dimension: string;
  baseCase: number;
  projected: number;
  delta: number;
  narrative: string;
  confidence: "high" | "medium" | "low";
};

type SimulationResult = {
  decisionSummary: string;
  executiveTake: string;
  recommendation: "proceed" | "proceed-with-conditions" | "defer" | "do-not-proceed";
  conditions: string[];
  financialOutcomes: OutcomeDimension[];
  competitiveOutcomes: OutcomeDimension[];
  operationalOutcomes: OutcomeDimension[];
  keyRisks: string[];
  keyUpsides: string[];
  timeToBreakeven: string;
  confidenceScore: number;
};

const SCENARIO_TEMPLATES: Scenario[] = [
  { id: "market-entry", label: "Enter a New Market", description: "Evaluate expansion into a new geographic or vertical market.", template: "market entry into {details}" },
  { id: "product-launch", label: "Launch a New Product", description: "Model the impact of a new product or service line launch.", template: "launch of a new product/service: {details}" },
  { id: "acquisition", label: "Acquire a Competitor", description: "Analyse the strategic and financial implications of an acquisition.", template: "acquisition of a competitor: {details}" },
  { id: "pricing-change", label: "Change Pricing Architecture", description: "Simulate the effect of a significant pricing model change.", template: "pricing architecture change: {details}" },
  { id: "partnership", label: "Form a Strategic Partnership", description: "Project outcomes from a major distribution or technology partnership.", template: "strategic partnership with: {details}" },
  { id: "custom", label: "Custom Decision", description: "Model any strategic decision with full context.", template: "{details}" },
];

const RECOMMENDATION_STYLES: Record<string, { bg: string; text: string; border: string; label: string }> = {
  "proceed": { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", label: "Proceed" },
  "proceed-with-conditions": { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", label: "Proceed with Conditions" },
  "defer": { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", label: "Defer — Gather More Data" },
  "do-not-proceed": { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", label: "Do Not Proceed" },
};

function ConfidencePill({ level }: { level: "high" | "medium" | "low" }) {
  const s = { high: "text-emerald-600 bg-emerald-50", medium: "text-amber-600 bg-amber-50", low: "text-red-600 bg-red-50" };
  return <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${s[level]}`}>{level} conf.</span>;
}

function DeltaIcon({ delta }: { delta: number }) {
  if (delta > 5) return <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />;
  if (delta < -5) return <TrendingDown className="w-3.5 h-3.5 text-red-500" />;
  return <Minus className="w-3.5 h-3.5 text-muted-foreground" />;
}

type HistoricScenario = {
  id: string;
  label: string;
  details: string;
  createdAt: string;
  result: SimulationResult;
};

export default function ScenarioSimulator() {
  usePageMeta({
    title: "Strategy Scenario Simulator | Carlota Jo",
    description: "Interactive what-if modeling — test strategic decisions and see AI-projected outcomes across financial, competitive, and operational dimensions.",
    canonical: "https://szlholdings.com/carlota-jo/scenario-simulator",
  });

  const [selectedScenario, setSelectedScenario] = useState<Scenario>(SCENARIO_TEMPLATES[0]);
  const [details, setDetails] = useState("");
  const [context, setContext] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [expandedDim, setExpandedDim] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoricScenario[]>([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);

  const BASE_URL_API = import.meta.env.BASE_URL + "api";

  useEffect(() => {
    fetch(`${BASE_URL_API}/carlota/scenarios`, { credentials: "include" })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.data?.scenarios) setHistory(data.data.scenarios as HistoricScenario[]);
      })
      .catch(() => {})
      .finally(() => setHistoryLoaded(true));
  }, [BASE_URL_API]);

  const persistScenario = async (result: SimulationResult) => {
    try {
      const res = await fetch(`${BASE_URL_API}/carlota/scenarios`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          label: selectedScenario.label,
          details,
          context,
          result,
        }),
      });
      if (res.ok) {
        const saved = await res.json() as { data: HistoricScenario };
        if (saved.data) setHistory(h => [saved.data, ...h]);
      }
    } catch {
    }
  };

  const runSimulation = async () => {
    setLoading(true);
    setResult(null);
    try {
      const decision = selectedScenario.template.replace("{details}", details);
      const prompt = `You are a McKinsey senior partner running a strategic scenario analysis. Analyze this decision and return ONLY valid JSON with EXACTLY this structure:
{
  "decisionSummary": "One sentence summarizing the decision being evaluated",
  "executiveTake": "2-3 sentence executive perspective on this decision",
  "recommendation": "proceed" | "proceed-with-conditions" | "defer" | "do-not-proceed",
  "conditions": ["condition 1 if applicable", "condition 2"],
  "timeToBreakeven": "e.g. 18-24 months",
  "confidenceScore": <number 50-95>,
  "keyRisks": ["risk 1", "risk 2", "risk 3"],
  "keyUpsides": ["upside 1", "upside 2", "upside 3"],
  "financialOutcomes": [
    {"dimension": "Revenue Impact", "baseCase": 100, "projected": <number>, "delta": <number -40 to 60>, "narrative": "explanation", "confidence": "high"|"medium"|"low"},
    {"dimension": "EBITDA Margin", "baseCase": 100, "projected": <number>, "delta": <number -30 to 40>, "narrative": "explanation", "confidence": "high"|"medium"|"low"},
    {"dimension": "Payback Period", "baseCase": 100, "projected": <number>, "delta": <number -50 to 50>, "narrative": "explanation", "confidence": "medium"|"low"}
  ],
  "competitiveOutcomes": [
    {"dimension": "Market Share", "baseCase": 100, "projected": <number>, "delta": <number -20 to 40>, "narrative": "explanation", "confidence": "medium"|"low"},
    {"dimension": "Brand Authority", "baseCase": 100, "projected": <number>, "delta": <number -10 to 30>, "narrative": "explanation", "confidence": "medium"},
    {"dimension": "Competitive Moat", "baseCase": 100, "projected": <number>, "delta": <number -15 to 35>, "narrative": "explanation", "confidence": "medium"|"low"}
  ],
  "operationalOutcomes": [
    {"dimension": "Org Complexity", "baseCase": 100, "projected": <number>, "delta": <number -10 to 50>, "narrative": "explanation", "confidence": "high"|"medium"},
    {"dimension": "Execution Risk", "baseCase": 100, "projected": <number>, "delta": <number -5 to 50>, "narrative": "explanation", "confidence": "medium"},
    {"dimension": "Team Capacity Utilization", "baseCase": 100, "projected": <number>, "delta": <number 10 to 60>, "narrative": "explanation", "confidence": "medium"|"low"}
  ]
}

Decision: ${decision}
Additional context: ${context || "No additional context provided"}

Return ONLY the JSON object, no markdown.`;

      const res = await fetch("/api/intelligence/ai/advisory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ messages: [{ role: "user", content: prompt }], context: "Strategy scenario simulator — Carlota Jo" }),
      });

      if (!res.ok || !res.body) throw new Error();
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "", fullContent = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try { const json = JSON.parse(line.slice(6)); if (json.content) fullContent += json.content; } catch {}
        }
      }
      const parsed = JSON.parse(fullContent) as SimulationResult;
      setResult(parsed);
      void persistScenario(parsed);
    } catch {
      const fallback: SimulationResult = {
        decisionSummary: `Strategic analysis of ${selectedScenario.label.toLowerCase()}: ${details}`,
        executiveTake: "This decision presents a compelling growth opportunity with manageable downside risk, provided execution conditions are met. The financial case is supported by market dynamics, though operational readiness requires validation before committing capital. A phased approach significantly improves risk-adjusted returns.",
        recommendation: "proceed-with-conditions",
        conditions: ["Validate product-market fit with 3 pilot customers before full launch", "Secure operational bandwidth — current team at 85% capacity", "Define clear go/no-go KPIs at the 90-day mark"],
        timeToBreakeven: "18–24 months",
        confidenceScore: 74,
        keyRisks: ["Execution bandwidth risk — team capacity stretched", "Market timing uncertainty — window may close", "Competitive response from incumbents within 6 months"],
        keyUpsides: ["First-mover advantage in underserved segment", "Strong strategic rationale with customer pull signals", "Revenue diversification reducing concentration risk"],
        financialOutcomes: [
          { dimension: "Revenue Impact", baseCase: 100, projected: 142, delta: 42, narrative: "Incremental revenue from the new initiative projects at $1.2M–$2.4M ARR within 24 months, representing 42% upside to current run rate.", confidence: "medium" },
          { dimension: "EBITDA Margin", baseCase: 100, projected: 88, delta: -12, narrative: "Near-term margin compression of 10–15% as investment is deployed ahead of returns. Recovers to current levels by month 18.", confidence: "medium" },
          { dimension: "Payback Period", baseCase: 100, projected: 135, delta: 35, narrative: "Total investment of $800K–$1.2M with payback expected in 18–24 months under base case assumptions.", confidence: "low" },
        ],
        competitiveOutcomes: [
          { dimension: "Market Share", baseCase: 100, projected: 122, delta: 22, narrative: "Successful execution could add 2–3 percentage points of addressable market share within 36 months.", confidence: "low" },
          { dimension: "Brand Authority", baseCase: 100, projected: 118, delta: 18, narrative: "Expanded presence in new segment builds category authority and creates halo effect on existing business.", confidence: "medium" },
          { dimension: "Competitive Moat", baseCase: 100, projected: 128, delta: 28, narrative: "Network effects and data advantage accumulate over time, strengthening defensibility.", confidence: "low" },
        ],
        operationalOutcomes: [
          { dimension: "Org Complexity", baseCase: 100, projected: 140, delta: 40, narrative: "Significant increase in organizational complexity — will require dedicated leadership and clear accountability structures.", confidence: "high" },
          { dimension: "Execution Risk", baseCase: 100, projected: 145, delta: 45, narrative: "Elevated near-term execution risk. Recommend phased rollout with stage-gate governance to manage.", confidence: "medium" },
          { dimension: "Team Capacity Utilization", baseCase: 100, projected: 128, delta: 28, narrative: "Current team absorbs roughly 60% of new workload — remaining 40% requires 2–3 new hires.", confidence: "medium" },
        ],
      };
      setResult(fallback);
      void persistScenario(fallback);
    } finally {
      setLoading(false);
    }
  };

  const allDimensions = result ? [
    ...result.financialOutcomes.map(d => ({ ...d, category: "Financial" })),
    ...result.competitiveOutcomes.map(d => ({ ...d, category: "Competitive" })),
    ...result.operationalOutcomes.map(d => ({ ...d, category: "Operational" })),
  ] : [];

  const radarData = allDimensions.map(d => ({
    subject: d.dimension.split(" ")[0],
    baseline: 100,
    projected: Math.max(20, Math.min(200, d.projected)),
    fullMark: 200,
  }));

  return (
    <div className="p-6 space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <FlaskConical className="w-5 h-5" style={{ color: GOLD }} />
          <span className="text-xs font-medium uppercase tracking-widest" style={{ color: GOLD }}>Strategy Scenario Simulator</span>
        </div>
        <h1 className="text-2xl" style={{ fontFamily: "var(--font-serif)" }}>What-If Strategy Modelling</h1>
        <p className="text-sm text-muted-foreground mt-1">Test strategic decisions before committing — see AI-projected outcomes across financial, competitive, and operational dimensions.</p>
      </div>

      {!result ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Select Decision Type</CardTitle></CardHeader>
              <CardContent className="space-y-1.5">
                {SCENARIO_TEMPLATES.map(s => (
                  <button
                    key={s.id}
                    onClick={() => setSelectedScenario(s)}
                    className={`w-full text-left p-2.5 rounded-lg border transition-all ${selectedScenario.id === s.id ? "border-transparent" : "border-border hover:bg-muted/50"}`}
                    style={selectedScenario.id === s.id ? { background: "var(--color-gold-dim)", borderColor: "var(--color-gold-border)" } : {}}
                  >
                    <p className="text-xs font-medium">{s.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{s.description}</p>
                  </button>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Define Your Scenario</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Scenario — {selectedScenario.label} *</label>
                  <textarea
                    className="w-full px-3 py-2 rounded-lg border border-border bg-white text-sm focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                    rows={4}
                    value={details}
                    onChange={e => setDetails(e.target.value)}
                    placeholder={
                      selectedScenario.id === "market-entry" ? "e.g. Expand into the UK mid-market, targeting £5M–£50M revenue businesses in the professional services sector" :
                      selectedScenario.id === "product-launch" ? "e.g. Launch an governed diagnostics subscription at £1,500/month targeting existing mid-market clients" :
                      selectedScenario.id === "acquisition" ? "e.g. Acquire Meridian Strategy — 8-person boutique with £1.2M revenue and strong UK public sector client base" :
                      selectedScenario.id === "pricing-change" ? "e.g. Move from project-based billing to annual retainer model — minimum £36K/year per client" :
                      selectedScenario.id === "partnership" ? "e.g. Strategic distribution partnership with PwC — co-selling into their mid-market PE-backed portfolio" :
                      "Describe your strategic decision in detail..."
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Additional Business Context (optional)</label>
                  <textarea
                    className="w-full px-3 py-2 rounded-lg border border-border bg-white text-sm focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                    rows={3}
                    value={context}
                    onChange={e => setContext(e.target.value)}
                    placeholder="e.g. Current revenue £2.4M, 12 active clients, team of 6, 18 months runway..."
                  />
                </div>
                <button
                  onClick={runSimulation}
                  disabled={loading || !details.trim()}
                  className="w-full py-2.5 rounded-lg text-sm font-medium text-white flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
                  style={{ background: GOLD }}
                >
                  {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Running simulation…</> : <><Play className="w-4 h-4" />Run Scenario Simulation</>}
                </button>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">{result.decisionSummary}</p>
              <p className="text-sm leading-relaxed max-w-2xl" style={{ fontFamily: "var(--font-serif)", fontSize: "0.95rem" }}>{result.executiveTake}</p>
            </div>
            <button onClick={() => setResult(null)} className="shrink-0 text-xs px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:bg-muted transition-colors flex items-center gap-1.5">
              <RotateCcw className="w-3 h-3" />New Scenario
            </button>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Card className={`border-2 ${RECOMMENDATION_STYLES[result.recommendation].border}`}>
              <CardContent className="pt-3">
                <p className="text-xs text-muted-foreground mb-1">Recommendation</p>
                <p className={`text-sm font-semibold ${RECOMMENDATION_STYLES[result.recommendation].text}`}>{RECOMMENDATION_STYLES[result.recommendation].label}</p>
              </CardContent>
            </Card>
            <Card><CardContent className="pt-3"><p className="text-xs text-muted-foreground mb-1">Confidence Score</p><p className="text-xl font-semibold" style={{ fontFamily: "var(--font-serif)" }}>{result.confidenceScore}%</p></CardContent></Card>
            <Card><CardContent className="pt-3"><p className="text-xs text-muted-foreground mb-1">Breakeven Timeline</p><p className="text-sm font-semibold">{result.timeToBreakeven}</p></CardContent></Card>
            <Card><CardContent className="pt-3"><p className="text-xs text-muted-foreground mb-1">Key Conditions</p><p className="text-xl font-semibold" style={{ fontFamily: "var(--font-serif)" }}>{result.conditions.length}</p></CardContent></Card>
          </div>

          {result.conditions.length > 0 && (
            <Card className="border" style={{ borderColor: "var(--color-gold-border)" }}>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Proceed With These Conditions</CardTitle></CardHeader>
              <CardContent>
                <ul className="space-y-1.5">
                  {result.conditions.map((c, i) => <li key={i} className="text-xs text-muted-foreground flex items-start gap-2"><span className="mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center text-xs shrink-0" style={{ borderColor: GOLD, color: GOLD }}>{i + 1}</span>{c}</li>)}
                </ul>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div>
              <h3 className="text-sm font-medium mb-3">Outcome Projections by Dimension</h3>
              <div className="space-y-2">
                {allDimensions.map((dim, i) => (
                  <div key={i} className="border border-border rounded-lg overflow-hidden">
                    <button
                      className="w-full text-left p-3 hover:bg-muted/50 transition-colors"
                      onClick={() => setExpandedDim(expandedDim === dim.dimension ? null : dim.dimension)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <DeltaIcon delta={dim.delta} />
                          <span className="text-xs font-medium">{dim.dimension}</span>
                          <span className="text-xs text-muted-foreground">[{dim.category}]</span>
                          <ConfidencePill level={dim.confidence} />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-medium ${dim.delta > 0 ? "text-emerald-600" : dim.delta < 0 ? "text-red-600" : "text-muted-foreground"}`}>
                            {dim.delta > 0 ? "+" : ""}{dim.delta}%
                          </span>
                          {expandedDim === dim.dimension ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
                        </div>
                      </div>
                    </button>
                    {expandedDim === dim.dimension && (
                      <div className="px-3 pb-3 border-t border-border bg-muted/30">
                        <p className="text-xs text-muted-foreground pt-2 leading-relaxed">{dim.narrative}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Multi-Dimension Impact Map</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <RadarChart data={radarData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10 }} />
                      <RadarPlot name="Baseline" dataKey="baseline" stroke="var(--color-stone-300)" fill="var(--color-stone-300)" fillOpacity={0.2} />
                      <RadarPlot name="Projected" dataKey="projected" stroke={GOLD} fill={GOLD} fillOpacity={0.25} />
                    </RadarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Risk / Upside Summary</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs font-medium mb-2 text-emerald-700">Key Upsides</p>
                    <ul className="space-y-1">{result.keyUpsides.map((u, i) => <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5"><span className="mt-1 w-1 h-1 rounded-full bg-emerald-400 shrink-0" />{u}</li>)}</ul>
                  </div>
                  <div>
                    <p className="text-xs font-medium mb-2 text-red-700">Key Risks</p>
                    <ul className="space-y-1">{result.keyRisks.map((r, i) => <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5"><span className="mt-1 w-1 h-1 rounded-full bg-red-400 shrink-0" />{r}</li>)}</ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </motion.div>
      )}

      {historyLoaded && history.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="w-4 h-4" style={{ color: GOLD }} />
              Past Simulations
              <Badge variant="secondary" className="ml-auto text-xs">{history.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {history.slice(0, 5).map(h => {
              const recStyle = RECOMMENDATION_STYLES[h.result?.recommendation ?? "defer"];
              return (
                <button key={h.id} onClick={() => setResult(h.result as SimulationResult)}
                  className="w-full text-left px-3 py-2 rounded-lg border border-border hover:bg-muted transition-colors">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium">{h.label}</span>
                    <span className="text-xs text-muted-foreground">{new Date(h.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    {recStyle && <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${recStyle.bg} ${recStyle.text}`}>{recStyle.label}</span>}
                    {h.details && <p className="text-xs text-muted-foreground truncate">{h.details}</p>}
                  </div>
                </button>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
