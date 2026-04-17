import { useState } from "react";
import { Eye, Star, Sparkles, Brain, ChevronDown, ChevronUp, BarChart3, Zap, Activity, CheckCircle2, HelpCircle } from "lucide-react";
import { cn } from "@szl-holdings/shared-ui/utils";

const ORACLES = [
  {
    id: "willaq-70b", name: "Primary AI Model", subtitle: "General Reasoning — Cross-Domain Analysis",
    description: "The most capable model in the platform. Handles complex multi-domain reasoning, strategic synthesis, and long-context analysis.",
    accuracy: 96.2, latency: "420ms", cost: "$0.0018/req", context: "128K tokens",
    domains: ["Strategy", "Research", "Synthesis", "Cross-domain"],
    specialty: "Deep reasoning, report generation, scenario modeling",
    mystique: "Highest-capability model for complex analytical tasks",
    color: "text-amber-400", bg: "bg-amber-400/10", border: "border-amber-400/20",
    confidence: 94, available: true,
  },
  {
    id: "maritime-oracle", name: "Maritime Oracle", subtitle: "Domain Oracle — Sea & Trade",
    description: "Specialized in maritime logistics, vessel behavior, trade route analysis, and port operations forecasting.",
    accuracy: 94.8, latency: "95ms", cost: "$0.0004/req", context: "32K tokens",
    domains: ["Maritime", "Logistics", "Trade routes", "Port operations"],
    specialty: "Fleet intelligence, disruption prediction, vessel anomaly detection",
    mystique: "Domain specialist for maritime logistics and fleet operations",
    color: "text-cyan-400", bg: "bg-cyan-400/10", border: "border-cyan-400/20",
    confidence: 91, available: true,
  },
  {
    id: "financial-oracle", name: "Financial Oracle", subtitle: "Domain Oracle — Capital & Markets",
    description: "Specialized in financial modeling, investment analysis, portfolio optimization, and market regime detection.",
    accuracy: 93.7, latency: "210ms", cost: "$0.0012/req", context: "64K tokens",
    domains: ["Finance", "Investment", "Risk", "Portfolio"],
    specialty: "DCF modeling, market sentiment, risk-adjusted returns",
    mystique: "Specialized for investment analysis and market regime detection",
    color: "text-yellow-400", bg: "bg-yellow-400/10", border: "border-yellow-400/20",
    confidence: 89, available: true,
  },
  {
    id: "security-oracle", name: "Security Oracle", subtitle: "Domain Oracle — Threat & Defense",
    description: "Specialized in cybersecurity threat analysis, attack pattern detection, compliance assessment, and policy evaluation.",
    accuracy: 97.1, latency: "140ms", cost: "$0.0006/req", context: "32K tokens",
    domains: ["Security", "Compliance", "Threat intel", "Policy"],
    specialty: "Threat classification, IOC analysis, policy enforcement",
    mystique: "Specialized for threat classification and compliance assessment",
    color: "text-orange-400", bg: "bg-orange-400/10", border: "border-orange-400/20",
    confidence: 96, available: true,
  },
  {
    id: "creative-oracle", name: "Creative Oracle", subtitle: "Domain Oracle — Story & Brand",
    description: "Specialized in content strategy, brand voice analysis, creative brief generation, and campaign performance interpretation.",
    accuracy: 88.4, latency: "320ms", cost: "$0.0014/req", context: "64K tokens",
    domains: ["Creative", "Marketing", "Brand", "Content"],
    specialty: "Content ideation, voice consistency, campaign optimization",
    mystique: "Specialized for content strategy and brand voice consistency",
    color: "text-violet-400", bg: "bg-violet-400/10", border: "border-violet-400/20",
    confidence: 84, available: true,
  },
  {
    id: "code-oracle", name: "Code Oracle", subtitle: "Domain Oracle — Logic & Systems",
    description: "Specialized in code analysis, system architecture review, technical debt assessment, and engineering strategy.",
    accuracy: 95.9, latency: "380ms", cost: "$0.0015/req", context: "64K tokens",
    domains: ["Engineering", "Architecture", "Code review", "Systems"],
    specialty: "Code quality, architecture patterns, technical strategy",
    mystique: "Specialized for code analysis and architecture review",
    color: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400/20",
    confidence: 88, available: false,
  },
];

const EXAMPLE_CONSULTATIONS = [
  { question: "What maritime disruptions should we anticipate in the next 30 days based on current geopolitical signals?", oracle: "Maritime Oracle", confidence: 87, summary: "El Niño weather pattern will increase Suez Canal delays by 15–22%. Red Sea tensions remain elevated — recommend rerouting 3 key fleet segments via Cape of Good Hope. Panama Canal water levels critical through April." },
  { question: "What is the SZL Holdings portfolio's greatest systemic risk in Q2 2026?", oracle: "Primary AI Model", confidence: 91, summary: "Cross-portfolio talent concentration risk is highest — 4 of 9 apps rely on the same 3 engineers for critical path work. Secondary risk: MSP's customer concentration (top 3 clients = 62% of ARR). Recommend: talent redundancy planning and MSP diversification initiative." },
  { question: "Which Dreamscape campaign targeting segments show highest predicted ROAS for Q2?", oracle: "Creative Oracle", confidence: 78, summary: "B2B SaaS decision-makers aged 35–44 in the US Southeast show 2.8x predicted ROAS based on Q1 engagement data. LinkedIn video format outperforms display by 3.1x for this cohort. Recommend shifting 40% of Q2 budget to this segment and format combination." },
];

interface ComparisonResult {
  oracle: string;
  answer: string;
  confidence: number;
  reasoning: string[];
  caveats: string;
}

const COMPARISON_QUESTION = "What is the single highest-leverage action SZL Holdings could take in the next 90 days?";
const COMPARISON_RESULTS: ComparisonResult[] = [
  { oracle: "Primary AI Model", answer: "Deploy automated cross-domain anomaly correlation — connecting Vessels, MSP, and Terra signals into a unified early warning system would reduce MTTD by an estimated 60%.", confidence: 91, reasoning: ["Each app currently operates in isolation", "Cross-domain signals show 3 unrealized correlations", "MSP ticket data predicts Terra market disruptions with 2-week lead time"], caveats: "Requires API bridge between Vessels and MSP data layers." },
  { oracle: "Financial Oracle", answer: "Instrument the portfolio intelligence layer with real-time cash flow correlation across all portfolio companies — enabling proactive capital allocation 45-90 days ahead of need.", confidence: 84, reasoning: ["Portfolio companies share seasonal patterns", "Capital allocation timing gap costs ~$340K/yr in opportunity cost", "AI-driven allocation has 2.1x better outcomes in comparable portfolios"], caveats: "Financial data sensitivity requires Adaptive Defense escalation review." },
  { oracle: "Security Oracle", answer: "Implement continuous agent action auditing across all agent network nodes — current visibility gap means 23% of agent actions are unaudited, creating compliance and security exposure.", confidence: 96, reasoning: ["Compliance frameworks require full audit trails by Q3 2026", "3 incidents last quarter traced to unaudited agent actions", "Audit infrastructure reduces investigation time by 80%"], caveats: "Performance overhead estimated at 4–7ms per action." },
];

export default function AiAdvisor() {
  const [selectedOracle, setSelectedOracle] = useState<string | null>(null);
  const [question, setQuestion] = useState("");
  const [consulting, setConsulting] = useState(false);
  const [consultResult, setConsultResult] = useState<typeof EXAMPLE_CONSULTATIONS[0] | null>(null);
  const [showComparison, setShowComparison] = useState(false);

  const handleConsult = () => {
    if (!selectedOracle || !question.trim()) return;
    setConsulting(true);
    setTimeout(() => {
      const oracle = ORACLES.find(o => o.id === selectedOracle);
      setConsultResult({
        question,
        oracle: oracle?.name || "",
        confidence: oracle?.confidence || 80,
        summary: "The AI Advisor has processed your question against its domain knowledge and cross-referenced signals from across the SZL ecosystem. Based on current intelligence patterns, the recommendation carries high confidence. Prioritizing this action in the next 14-day operational cycle is advised. Multiple supporting signals from the intelligence network corroborate this interpretation.",
      });
      setConsulting(false);
    }, 2800);
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-[1600px]">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 rounded-lg bg-amber-400/15 flex items-center justify-center">
            <Eye className="w-4 h-4 text-amber-400" />
          </div>
          <h1 className="text-xl font-display font-bold text-foreground tracking-tight">AI Advisor</h1>
        </div>
        <p className="text-xs text-muted-foreground">
          Consult domain-specific AI models, compare their reasoning, and receive confidence-scored interpretations.
        </p>
      </div>

      {/* Oracle fleet */}
      <div>
        <h3 className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-3">AI Model Fleet</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {ORACLES.map(oracle => (
            <button key={oracle.id}
              disabled={!oracle.available}
              onClick={() => setSelectedOracle(oracle.available ? oracle.id : null)}
              className={cn(
                "text-left p-4 rounded-xl border transition-all",
                !oracle.available ? "opacity-40 cursor-not-allowed border-border" :
                  selectedOracle === oracle.id
                    ? cn("border-primary/40 bg-primary/5", oracle.border.replace("border-", "border-"))
                    : cn("hover:border-primary/20 bg-card/40", oracle.border)
              )}>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className={cn("text-xs font-bold", oracle.color)}>{oracle.name}</p>
                  <p className="text-[10px] text-muted-foreground">{oracle.subtitle}</p>
                </div>
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", oracle.bg)}>
                  <Star className={cn("w-4 h-4", oracle.color)} />
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground/70 leading-relaxed mb-3 line-clamp-2">{oracle.description}</p>
              <div className="flex flex-wrap gap-1 mb-2">
                {oracle.domains.map(d => (
                  <span key={d} className={cn("px-1.5 py-0.5 rounded text-[9px] font-mono", oracle.bg, oracle.color)}>{d}</span>
                ))}
              </div>
              <div className="flex items-center justify-between text-[10px]">
                <div className="flex items-center gap-3 text-muted-foreground font-mono">
                  <span>{oracle.accuracy}% acc</span>
                  <span>{oracle.latency}</span>
                </div>
                {!oracle.available && <span className="text-amber-400/60 font-mono">Degraded</span>}
              </div>
              <div className="mt-2">
                <div className="h-1 bg-border rounded-full overflow-hidden">
                  <div className={cn("h-full rounded-full", oracle.bg.replace("bg-", "bg-").replace("/10", ""))}
                    style={{ width: `${oracle.confidence}%`, background: oracle.color.includes("amber") ? "#f59e0b" : oracle.color.includes("cyan") ? "#06b6d4" : oracle.color.includes("yellow") ? "#eab308" : oracle.color.includes("orange") ? "#f97316" : oracle.color.includes("violet") ? "#8b5cf6" : "#22c55e" }} />
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Consultation interface */}
      <div className="bg-card/60 border border-border rounded-xl p-5">
        <h3 className="text-sm font-display font-semibold text-foreground mb-4 flex items-center gap-2">
          <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
          Consult the Oracle
        </h3>
        <div className="space-y-3">
          <div>
            <label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground block mb-1.5">
              Oracle Selected
            </label>
            <div className={cn("px-3 py-2 rounded-lg border text-xs font-mono",
              selectedOracle ? "border-primary/30 text-foreground bg-primary/5" : "border-border text-muted-foreground"
            )}>
              {selectedOracle ? ORACLES.find(o => o.id === selectedOracle)?.name : "— Select an oracle above —"}
            </div>
          </div>
          <div>
            <label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground block mb-1.5">
              Your Question
            </label>
            <textarea
              value={question}
              onChange={e => setQuestion(e.target.value)}
              rows={3}
              placeholder="Ask the oracle anything within its domain..."
              className="w-full bg-muted/20 border border-border rounded-lg px-3 py-2.5 text-xs text-foreground resize-none focus:outline-none focus:border-primary/50 font-mono"
            />
          </div>
          <button
            onClick={handleConsult}
            disabled={!selectedOracle || !question.trim() || consulting}
            className={cn(
              "px-6 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2",
              !selectedOracle || !question.trim()
                ? "bg-muted/20 text-muted-foreground cursor-not-allowed"
                : consulting
                  ? "bg-amber-400/10 text-amber-400 cursor-wait"
                  : "bg-amber-400/15 text-amber-400 hover:bg-amber-400/25 border border-amber-400/30"
            )}>
            {consulting ? (
              <><div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> Oracle is interpreting...</>
            ) : (
              <><Eye className="w-4 h-4" /> Consult Oracle</>
            )}
          </button>

          {consultResult && (
            <div className="bg-amber-400/5 border border-amber-400/20 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Oracle Interpretation
                </span>
                <span className="text-[10px] font-mono text-amber-400/70">Confidence: {consultResult.confidence}%</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{consultResult.summary}</p>
              <div className="mt-2 h-1.5 bg-border rounded-full overflow-hidden">
                <div className="h-full bg-amber-400/80 rounded-full" style={{ width: `${consultResult.confidence}%` }} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Example consultations */}
      <div>
        <h3 className="text-sm font-display font-semibold text-foreground mb-3 flex items-center gap-2">
          <Brain className="w-3.5 h-3.5 text-primary" />
          Recent Oracle Consultations
        </h3>
        <div className="space-y-3">
          {EXAMPLE_CONSULTATIONS.map((c, i) => (
            <div key={i} className="bg-card/60 border border-border rounded-xl p-4">
              <div className="flex items-start gap-2 mb-2">
                <HelpCircle className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground italic">{c.question}</p>
              </div>
              <div className="bg-muted/10 rounded-lg p-3 border border-border/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-primary">{c.oracle}</span>
                  <span className="text-[10px] font-mono text-muted-foreground">{c.confidence}% confidence</span>
                </div>
                <p className="text-[11px] text-foreground/90 leading-relaxed">{c.summary}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Multi-oracle comparison */}
      <div className="bg-card/60 border border-border rounded-xl overflow-hidden">
        <button
          onClick={() => setShowComparison(s => !s)}
          className="w-full px-5 py-4 flex items-center justify-between hover:bg-muted/10 transition-colors">
          <h3 className="text-sm font-display font-semibold text-foreground flex items-center gap-2">
            <BarChart3 className="w-3.5 h-3.5 text-primary" />
            Multi-Oracle Comparison — Example
          </h3>
          {showComparison ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </button>
        {showComparison && (
          <div className="border-t border-border">
            <div className="px-5 py-3 bg-muted/10">
              <p className="text-xs text-muted-foreground italic">"{COMPARISON_QUESTION}"</p>
            </div>
            <div className="divide-y divide-border/40">
              {COMPARISON_RESULTS.map((result, i) => (
                <div key={i} className="p-5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-foreground">{result.oracle}</span>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-20 bg-border rounded-full overflow-hidden">
                        <div className={cn("h-full rounded-full",
                          result.confidence >= 90 ? "bg-emerald-400" : result.confidence >= 80 ? "bg-amber-400" : "bg-blue-400"
                        )} style={{ width: `${result.confidence}%` }} />
                      </div>
                      <span className="text-[10px] font-mono text-muted-foreground">{result.confidence}%</span>
                    </div>
                  </div>
                  <p className="text-xs text-foreground/90 mb-3">{result.answer}</p>
                  <div className="space-y-1 mb-2">
                    {result.reasoning.map((r, j) => (
                      <div key={j} className="flex items-start gap-1.5 text-[10px] text-muted-foreground">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400/60 shrink-0 mt-0.5" />
                        {r}
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-amber-400/70 font-mono">⚠ {result.caveats}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
