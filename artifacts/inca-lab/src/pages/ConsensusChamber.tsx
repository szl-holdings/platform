import { useState, useRef, useEffect } from "react";
import { cn } from "../lib/utils";
import {
  Brain, Shield, BarChart3, MessageSquare, ThumbsUp, ThumbsDown, Loader2, Play, RotateCcw,
  ChevronDown, ChevronUp, Users, TrendingUp, AlertTriangle, CheckCircle, XCircle,
  Pin, GitFork, Upload, Check, Zap, Eye
} from "lucide-react";
import { AIInsightCard } from "@szl-holdings/shared-ui/ai-insight-card";

// ─── Debate Simulation data (interactive mode) ────────────────────────────────

function AnchorIcon(props: { className?: string }) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="5" r="3"/><line x1="12" y1="22" x2="12" y2="8"/><path d="M5 12H2a10 10 0 0 0 20 0h-3"/>
    </svg>
  );
}

const DEBATERS = [
  { id: "alloy", name: "Alloy", domain: "Orchestrator", icon: Brain, color: "#7c3aed", model: "gpt-5.2" },
  { id: "helmsman", name: "Helmsman", domain: "Maritime Intel", icon: AnchorIcon, color: "#3b82f6", model: "claude-sonnet-4-6" },
  { id: "sentinel", name: "Sentinel", domain: "Security", icon: Shield, color: "#f43f5e", model: "claude-sonnet-4-6" },
  { id: "beacon", name: "Beacon", domain: "Analytics", icon: BarChart3, color: "#10b981", model: "gemini-3.1-pro-preview" },
];

const PRESET_QUESTIONS = [
  "Is vessel MV Kairos Star a sanctions risk based on current AIS data and ownership patterns?",
  "Should SZL Holdings deploy GPT-5.2 for high-stakes legal document analysis given current model benchmarks?",
  "Is the detected network intrusion pattern consistent with an advanced persistent threat (APT)?",
  "Is the proposed real estate acquisition of 400 Maritime Blvd a viable investment at current market conditions?",
];

interface DebateMessage {
  agentId: string;
  round: number;
  position: "support" | "oppose" | "neutral" | "abstain";
  argument: string;
  evidence: string[];
  confidence: number;
  vote: "yes" | "no" | "abstain";
}

interface ConsensusResult {
  verdict: "consensus-yes" | "consensus-no" | "split" | "requires-review";
  confidence: number;
  supporting: string[];
  dissenting: string[];
  abstaining: string[];
  summary: string;
}

const SAMPLE_DEBATES: Record<string, DebateMessage[][]> = {
  sanctions: [
    [
      { agentId: "helmsman", round: 1, position: "support", argument: "AIS data shows 14 dark periods in restricted zones over the past 90 days. Vessel ownership traces to a shell company registered in Panama with no verifiable ultimate beneficial owner. Flag-state compliance score is 23/100.", evidence: ["AIS dark periods: 14 (90d)", "Ownership: Shell Co. Panama", "Flag compliance: 23/100"], confidence: 0.82, vote: "yes" },
      { agentId: "sentinel", round: 1, position: "support", argument: "Cross-referencing ownership entities against OFAC SDN list reveals secondary connection through a third-party shipping agent last updated on the list in March 2025. Risk score computed at 0.87 — above our CRITICAL threshold of 0.75.", evidence: ["OFAC secondary match", "Risk score: 0.87", "Threshold: 0.75"], confidence: 0.91, vote: "yes" },
      { agentId: "beacon", round: 1, position: "neutral", argument: "Anomaly detection on port call frequency shows 3-sigma deviation from baseline behavior for similar vessel class in the same corridor. However, 23% of similar vessels show comparable dark periods without confirmed sanctions violations. Requires additional evidence.", evidence: ["Port anomaly: 3σ", "Baseline deviation: 23%", "False positive rate: 23%"], confidence: 0.61, vote: "abstain" },
      { agentId: "alloy", round: 1, position: "support", argument: "Aggregating all signals: maritime behavior anomalies, ownership opacity, secondary OFAC match, and flag compliance failure. The weight of evidence exceeds the threshold for sanctions flagging per SZL risk policy §4.2. Recommend escalation.", evidence: ["Policy §4.2 threshold met", "4 independent risk signals", "Aggregated confidence: 0.87"], confidence: 0.87, vote: "yes" },
    ],
    [
      { agentId: "helmsman", round: 2, position: "support", argument: "Additional AIS cross-reference confirms the vessel transited Iranian waters on two occasions in the last 180 days, both during dark periods. Port authority records at Khor Fakkan confirm cargo manifest discrepancies.", evidence: ["Iran transit: 2 confirmed", "Khor Fakkan manifest discrepancy"], confidence: 0.91, vote: "yes" },
      { agentId: "beacon", round: 2, position: "support", argument: "With the additional data from Helmsman, the false positive probability drops to 4.2%. Statistical confidence for sanctions flagging now exceeds the 90% threshold required for action.", evidence: ["False positive: 4.2%", "Confidence: 94%", "Threshold met"], confidence: 0.94, vote: "yes" },
      { agentId: "sentinel", round: 2, position: "support", argument: "Standing by Round 1 assessment. No new exculpatory evidence received. Maintaining CRITICAL risk classification.", evidence: ["No exculpatory evidence"], confidence: 0.91, vote: "yes" },
      { agentId: "alloy", round: 2, position: "support", argument: "Consensus achieved. All agents now aligned. Recommending immediate sanctions risk flag and human escalation per SZL policy.", evidence: ["Full consensus", "Human escalation required"], confidence: 0.93, vote: "yes" },
    ],
  ],
};

const CONSENSUS_RESULTS: Record<string, ConsensusResult> = {
  sanctions: {
    verdict: "consensus-yes",
    confidence: 0.93,
    supporting: ["alloy", "helmsman", "sentinel", "beacon"],
    dissenting: [],
    abstaining: [],
    summary: "All four agents reached consensus that MV Kairos Star meets the threshold for sanctions risk flagging. Evidence from AIS dark periods, OFAC secondary match, flag compliance failure, and Iranian transit during dark periods collectively exceed SZL risk policy §4.2 thresholds. Immediate human escalation recommended.",
  },
};

function ConfidenceBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${value * 100}%`, backgroundColor: color }} />
      </div>
      <div className="text-xs font-mono text-muted-foreground w-8 text-right">{Math.round(value * 100)}%</div>
    </div>
  );
}

// ─── Session Analytics data (analytics mode) ──────────────────────────────────

interface AgentVote {
  agentId: string;
  agentName: string;
  domain: string;
  position: "agree" | "disagree" | "abstain";
  reasoning: string;
  evidenceCited: number;
  contributionScore: number;
  rubberStamping: boolean;
  dissenting: boolean;
  latencyMs: number;
  wordCount: number;
}

interface ConsensusSession {
  id: string;
  title: string;
  question: string;
  status: "active" | "resolved" | "escalated";
  startedAt: string;
  resolvedAt: string | null;
  outcome: "consensus" | "split" | "escalated" | "pending";
  votes: AgentVote[];
}

const SESSIONS: ConsensusSession[] = [
  {
    id: "cs-001",
    title: "Route MV Kestrel Bay via Cape of Good Hope",
    question: "Should MV Kestrel Bay reroute via Cape of Good Hope given current Red Sea threat advisory?",
    status: "resolved",
    startedAt: "2026-04-13T08:30:00Z",
    resolvedAt: "2026-04-13T08:34:21Z",
    outcome: "consensus",
    votes: [
      { agentId: "alloy", agentName: "Alloy", domain: "orchestration", position: "agree", reasoning: "Advisory severity warrants precautionary reroute. Align with Helmsman recommendation.", evidenceCited: 1, contributionScore: 42, rubberStamping: true, dissenting: false, latencyMs: 320, wordCount: 18 },
      { agentId: "helmsman", agentName: "Helmsman", domain: "maritime", position: "agree", reasoning: "AIS data confirms 3 high-severity incidents in Bab-el-Mandeb strait in the past 72h. Cape route adds 7 days but eliminates threat corridor. Crew safety and cargo value (~$42M) justify the extension. Full risk matrix attached.", evidenceCited: 8, contributionScore: 97, rubberStamping: false, dissenting: false, latencyMs: 1240, wordCount: 52 },
      { agentId: "sentinel", agentName: "Sentinel", domain: "security", position: "agree", reasoning: "Threat intelligence confirms Houthi naval drone activity. MSC advisory from 2026-04-12 classifies this as HIGH risk zone. Reroute is correct. Recommend additional satellite comms check-in protocol.", evidenceCited: 6, contributionScore: 88, rubberStamping: false, dissenting: false, latencyMs: 980, wordCount: 38 },
      { agentId: "beacon", agentName: "Beacon", domain: "analytics", position: "disagree", reasoning: "Cape route cost increase is $380K in fuel and 7 days charter delay. P&I club coverage applies for Red Sea. Financial exposure through the strait is lower than reroute cost if no incident occurs. Recommend waiting 24h for threat re-assessment.", evidenceCited: 5, contributionScore: 79, rubberStamping: false, dissenting: true, latencyMs: 870, wordCount: 47 },
      { agentId: "muse", agentName: "Muse", domain: "creative", position: "agree", reasoning: "Agree with reroute.", evidenceCited: 0, contributionScore: 18, rubberStamping: true, dissenting: false, latencyMs: 210, wordCount: 4 },
      { agentId: "zeus", agentName: "Zeus", domain: "infrastructure", position: "abstain", reasoning: "Outside my domain. Abstaining.", evidenceCited: 0, contributionScore: 5, rubberStamping: false, dissenting: false, latencyMs: 180, wordCount: 5 },
    ],
  },
  {
    id: "cs-002",
    title: "Escalate CVE-2026-1847 to Emergency Patch",
    question: "Does CVE-2026-1847 (nginx RCE) warrant emergency patch protocol activation across all SZL infrastructure?",
    status: "active",
    startedAt: "2026-04-13T10:20:00Z",
    resolvedAt: null,
    outcome: "pending",
    votes: [
      { agentId: "sentinel", agentName: "Sentinel", domain: "security", position: "agree", reasoning: "CVSS 9.8 (Critical). Remote code execution, no auth required, public PoC available. Emergency patch protocol is mandatory per SZL SecOps policy §4.2. All internet-facing nginx instances must be patched within 4 hours.", evidenceCited: 9, contributionScore: 99, rubberStamping: false, dissenting: false, latencyMs: 1420, wordCount: 44 },
      { agentId: "zeus", agentName: "Zeus", domain: "infrastructure", position: "agree", reasoning: "Confirmed 14 nginx instances in prod across 3 Azure regions. Auto-patch pipeline ready. Estimated downtime: 4 min per instance with rolling deploy. Recommend green-blue deployment to minimize exposure window.", evidenceCited: 7, contributionScore: 94, rubberStamping: false, dissenting: false, latencyMs: 1180, wordCount: 38 },
      { agentId: "alloy", agentName: "Alloy", domain: "orchestration", position: "agree", reasoning: "Sentinel and Zeus aligned. Proceed.", evidenceCited: 0, contributionScore: 31, rubberStamping: true, dissenting: false, latencyMs: 290, wordCount: 5 },
      { agentId: "beacon", agentName: "Beacon", domain: "analytics", position: "agree", reasoning: "Agree. SLO impact of downtime is within acceptable bounds for emergency response.", evidenceCited: 1, contributionScore: 38, rubberStamping: true, dissenting: false, latencyMs: 340, wordCount: 14 },
    ],
  },
];

function contributionColor(score: number) {
  if (score >= 80) return "text-emerald-400";
  if (score >= 50) return "text-amber-400";
  if (score >= 30) return "text-orange-400";
  return "text-red-400";
}

function positionIcon(pos: AgentVote["position"]) {
  if (pos === "agree") return <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />;
  if (pos === "disagree") return <XCircle className="w-3.5 h-3.5 text-red-400" />;
  return <AlertTriangle className="w-3.5 h-3.5 text-muted-foreground" />;
}

function positionBadge(pos: AgentVote["position"]) {
  if (pos === "agree") return "bg-emerald-500/10 border-emerald-500/25 text-emerald-400";
  if (pos === "disagree") return "bg-red-500/10 border-red-500/25 text-red-400";
  return "bg-secondary border-border text-muted-foreground";
}

function outcomeStyle(outcome: ConsensusSession["outcome"]) {
  if (outcome === "consensus") return "badge-running";
  if (outcome === "split") return "badge-warning";
  if (outcome === "escalated") return "badge-error";
  return "badge-idle";
}

function InlineOutputActions({ agentId, position }: { agentId: string; position: AgentVote["position"] }) {
  const [done, setDone] = useState<string | null>(null);

  function act(a: string) {
    setDone(a);
    setTimeout(() => setDone(null), 2000);
  }

  const actions = [
    { id: "escalate", label: "Escalate", className: "text-red-400 bg-red-500/10 border-red-500/20 hover:bg-red-500/15" },
    { id: "rerun", label: "Re-run", className: "text-blue-400 bg-blue-500/10 border-blue-500/20 hover:bg-blue-500/15" },
    { id: "fork", label: "Fork", className: "text-amber-400 bg-amber-500/10 border-amber-500/20 hover:bg-amber-500/15" },
    { id: "pin", label: "Pin to Memory", className: "text-primary bg-primary/10 border-primary/20 hover:bg-primary/15" },
    { id: "export", label: "Export Trace", className: "text-muted-foreground bg-secondary border-border hover:text-foreground" },
  ];

  return (
    <div className="flex flex-wrap gap-1 mt-2">
      {actions.map(a => (
        <button
          key={a.id}
          onClick={() => act(a.id)}
          className={cn("px-2 py-1 rounded border text-xs font-medium transition-all", a.className, done === a.id && "opacity-60")}
        >
          {done === a.id ? <span className="flex items-center gap-1"><Check className="w-3 h-3" /> Done</span> : a.label}
        </button>
      ))}
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export function ConsensusChamber() {
  const [mode, setMode] = useState<"sessions" | "convene">("sessions");

  // Sessions mode state
  const [selectedSession, setSelectedSession] = useState<string>(SESSIONS[0]!.id);
  const [expandedVote, setExpandedVote] = useState<string | null>(null);

  // Convene mode state
  const [question, setQuestion] = useState("");
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);
  const [debateMode, setDebateMode] = useState<"idle" | "running" | "complete">("idle");
  const [displayedRound, setDisplayedRound] = useState(0);
  const [expandedMsg, setExpandedMsg] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const debateData = SAMPLE_DEBATES["sanctions"]!;
  const consensusResult = CONSENSUS_RESULTS["sanctions"]!;

  function startDebate() {
    if (!question.trim()) return;
    setDebateMode("running");
    setDisplayedRound(0);

    let round = 0;
    intervalRef.current = setInterval(() => {
      round++;
      setDisplayedRound(round);
      if (round >= debateData.length) {
        clearInterval(intervalRef.current!);
        setTimeout(() => setDebateMode("complete"), 800);
      }
    }, 2000);
  }

  function resetDebate() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setDebateMode("idle");
    setDisplayedRound(0);
    setQuestion("");
    setSelectedPreset(null);
  }

  const allMessages = debateData.slice(0, displayedRound).flat();

  const verdictColor = {
    "consensus-yes": "text-green-400 border-green-500/25 bg-green-500/10",
    "consensus-no": "text-red-400 border-red-500/25 bg-red-500/10",
    "split": "text-amber-400 border-amber-500/25 bg-amber-500/10",
    "requires-review": "text-blue-400 border-blue-500/25 bg-blue-500/10",
  };

  const session = SESSIONS.find(s => s.id === selectedSession)!;
  const votes = session.votes;
  const agreeCount = votes.filter(v => v.position === "agree").length;
  const disagreeCount = votes.filter(v => v.position === "disagree").length;
  const abstainCount = votes.filter(v => v.position === "abstain").length;
  const rubberStampers = votes.filter(v => v.rubberStamping);
  const dissenters = votes.filter(v => v.dissenting);
  const avgContrib = Math.round(votes.reduce((s, v) => s + v.contributionScore, 0) / votes.length);
  const totalEvidence = votes.reduce((s, v) => s + v.evidenceCited, 0);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-1.5 h-5 rounded-full bg-primary" />
          <h1 className="text-xl font-display font-semibold text-foreground">Consensus Chamber</h1>
        </div>
        <p className="text-sm text-muted-foreground ml-3.5">
          Multi-agent debate with contribution scoring, rubber-stamp detection, minority dissent, and interactive deliberation.
        </p>
      </div>

      <div className="mb-4">
        <AIInsightCard domain="inca" accentColor="hsl(160, 70%, 50%)" maxInsights={2} compact title="Consensus Intelligence" />
      </div>

      {/* Mode tabs */}
      <div className="flex gap-1 mb-5 p-1 bg-secondary rounded-lg w-fit">
        <button
          onClick={() => setMode("sessions")}
          className={cn("flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all", mode === "sessions" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
        >
          <Users className="w-3.5 h-3.5" /> Sessions
        </button>
        <button
          onClick={() => setMode("convene")}
          className={cn("flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all", mode === "convene" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
        >
          <MessageSquare className="w-3.5 h-3.5" /> Convene Chamber
        </button>
      </div>

      {/* ── Sessions mode ── */}
      {mode === "sessions" && (
        <>
          {/* Session selector */}
          <div className="flex gap-2 mb-5 flex-wrap">
            {SESSIONS.map(s => (
              <button
                key={s.id}
                onClick={() => setSelectedSession(s.id)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium transition-all border",
                  selectedSession === s.id
                    ? "bg-primary/15 text-primary border-primary/30"
                    : "bg-secondary text-muted-foreground border-border hover:text-foreground"
                )}
              >
                {s.title.slice(0, 40)}{s.title.length > 40 ? "…" : ""}
                <span className={cn("ml-2 px-1.5 py-0.5 rounded text-xs", outcomeStyle(s.outcome))}>{s.outcome}</span>
              </button>
            ))}
          </div>

          {/* Level 1: Session KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
            <div className="kpi-tile p-3 text-center lg:col-span-1">
              <div className="text-xl font-display font-bold text-emerald-400">{agreeCount}</div>
              <div className="text-xs text-muted-foreground">Agree</div>
            </div>
            <div className="kpi-tile p-3 text-center">
              <div className="text-xl font-display font-bold text-red-400">{disagreeCount}</div>
              <div className="text-xs text-muted-foreground">Disagree</div>
            </div>
            <div className="kpi-tile p-3 text-center">
              <div className="text-xl font-display font-bold text-muted-foreground">{abstainCount}</div>
              <div className="text-xs text-muted-foreground">Abstain</div>
            </div>
            <div className="kpi-tile p-3 text-center">
              <div className={cn("text-xl font-display font-bold", rubberStampers.length > 1 ? "text-amber-400" : "text-foreground")}>{rubberStampers.length}</div>
              <div className="text-xs text-muted-foreground">Lazy Agents</div>
            </div>
            <div className="kpi-tile p-3 text-center">
              <div className="text-xl font-display font-bold text-foreground">{avgContrib}</div>
              <div className="text-xs text-muted-foreground">Avg Score</div>
            </div>
          </div>

          {/* Question */}
          <div className="inca-panel p-4 mb-4 bg-primary/3 border-primary/15">
            <div className="flex items-start gap-3">
              <MessageSquare className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <div className="text-xs text-muted-foreground mb-1">Debate Question</div>
                <div className="text-sm text-foreground font-medium">{session.question}</div>
                <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                  <span>{session.startedAt.replace("T", " ").slice(0, 16)}</span>
                  {session.resolvedAt && <span>→ {session.resolvedAt.replace("T", " ").slice(0, 16)}</span>}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Left: analysis panels */}
            <div className="space-y-3">
              {/* Lazy agent warning */}
              {rubberStampers.length > 0 && (
                <div className="inca-panel p-4 bg-amber-500/5 border-amber-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <div className="text-sm font-medium text-amber-400">Lazy Agent Detected</div>
                  </div>
                  <div className="text-xs text-muted-foreground mb-2">
                    {rubberStampers.length} agent{rubberStampers.length > 1 ? "s" : ""} agreed without substantive reasoning or evidence.
                  </div>
                  <div className="space-y-1">
                    {rubberStampers.map(v => (
                      <div key={v.agentId} className="text-xs flex items-center gap-2">
                        <span className="text-amber-400">·</span>
                        <span className="text-foreground">{v.agentName}</span>
                        <span className="text-muted-foreground">{v.wordCount} words, {v.evidenceCited} citations</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Minority dissent */}
              {dissenters.length > 0 && (
                <div className="inca-panel p-4 bg-primary/3 border-primary/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Eye className="w-4 h-4 text-primary" />
                    <div className="text-sm font-medium text-foreground">Minority Dissent</div>
                  </div>
                  <div className="text-xs text-muted-foreground mb-2">
                    Dissenting views below — do not suppress without review.
                  </div>
                  {dissenters.map(v => (
                    <div key={v.agentId} className="bg-secondary/50 rounded-lg p-2.5 text-xs">
                      <div className="font-medium text-foreground mb-1">{v.agentName} ({v.domain})</div>
                      <div className="text-muted-foreground leading-relaxed">{v.reasoning}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Evidence summary */}
              <div className="inca-panel p-4">
                <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-3">Evidence Summary</div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total citations</span>
                    <span className="text-foreground font-mono">{totalEvidence}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Avg per agent</span>
                    <span className="text-foreground font-mono">{(totalEvidence / votes.length).toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Zero-citation agents</span>
                    <span className={cn("font-mono", votes.filter(v => v.evidenceCited === 0).length > 0 ? "text-amber-400" : "text-foreground")}>
                      {votes.filter(v => v.evidenceCited === 0).length}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Vote Detail Cards */}
            <div className="lg:col-span-2 space-y-2">
              {votes.map(vote => (
                <div key={vote.agentId} className={cn("inca-panel overflow-hidden", vote.dissenting && "border-primary/20")}>
                  <button
                    onClick={() => setExpandedVote(expandedVote === vote.agentId ? null : vote.agentId)}
                    className="w-full px-4 py-3 hover:bg-secondary/20 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      {positionIcon(vote.position)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-sm font-medium text-foreground">{vote.agentName}</span>
                          <span className={cn("text-xs px-1.5 py-0.5 rounded border", positionBadge(vote.position))}>{vote.position}</span>
                          {vote.rubberStamping && <span className="badge-warning text-xs px-1.5 py-0.5 rounded">rubber-stamp</span>}
                          {vote.dissenting && <span className="badge-error text-xs px-1.5 py-0.5 rounded">dissent</span>}
                        </div>
                        <div className="text-xs text-muted-foreground capitalize">{vote.domain} · {vote.latencyMs}ms · {vote.evidenceCited} citations · score {vote.contributionScore}</div>
                      </div>
                      {expandedVote === vote.agentId
                        ? <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        : <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      }
                    </div>
                  </button>

                  {expandedVote === vote.agentId && (
                    <div className="px-4 pb-4 animate-fade-in">
                      <div className="bg-secondary/40 rounded-lg p-3 text-xs text-muted-foreground leading-relaxed mb-3 border border-border/50">
                        {vote.reasoning}
                      </div>
                      <div className="grid grid-cols-4 gap-2 text-xs mb-3">
                        <div className="bg-secondary rounded-md p-2 text-center">
                          <div className={cn("font-bold font-mono", contributionColor(vote.contributionScore))}>{vote.contributionScore}</div>
                          <div className="text-muted-foreground">score</div>
                        </div>
                        <div className="bg-secondary rounded-md p-2 text-center">
                          <div className="font-bold text-foreground">{vote.evidenceCited}</div>
                          <div className="text-muted-foreground">citations</div>
                        </div>
                        <div className="bg-secondary rounded-md p-2 text-center">
                          <div className="font-bold text-foreground">{vote.wordCount}</div>
                          <div className="text-muted-foreground">words</div>
                        </div>
                        <div className="bg-secondary rounded-md p-2 text-center">
                          <div className="font-bold text-foreground">{vote.latencyMs}ms</div>
                          <div className="text-muted-foreground">latency</div>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-1.5">Actions</div>
                      <InlineOutputActions agentId={vote.agentId} position={vote.position} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ── Convene mode (interactive debate simulation) ── */}
      {mode === "convene" && (
        <>
          {debateMode === "idle" ? (
            <div className="max-w-3xl mx-auto space-y-4">
              <div className="inca-panel p-5">
                <div className="text-sm font-medium text-foreground mb-3">Pose a Question to the Chamber</div>
                <textarea
                  value={question}
                  onChange={(e) => { setQuestion(e.target.value); setSelectedPreset(null); }}
                  rows={3}
                  placeholder="Enter a high-stakes question for agent deliberation..."
                  className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40 resize-none mb-3"
                />
                <div className="text-xs text-muted-foreground mb-2">Quick presets:</div>
                <div className="space-y-1.5 mb-4">
                  {PRESET_QUESTIONS.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => { setQuestion(q); setSelectedPreset(i); }}
                      className={cn(
                        "w-full text-left px-3 py-2 rounded-lg border text-xs transition-all",
                        selectedPreset === i
                          ? "border-primary/40 bg-primary/5 text-foreground"
                          : "border-border hover:border-primary/20 text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {q}
                    </button>
                  ))}
                </div>
                <button
                  onClick={startDebate}
                  disabled={!question.trim()}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Play className="w-4 h-4" />
                  Convene Chamber
                </button>
              </div>

              <div className="inca-panel p-4">
                <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-3">Deliberating Agents</div>
                <div className="grid grid-cols-2 gap-2">
                  {DEBATERS.map(d => {
                    const Icon = d.icon;
                    return (
                      <div key={d.id} className="flex items-center gap-2.5 p-2.5 rounded-lg bg-secondary">
                        <div className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0" style={{ background: `${d.color}18`, border: `1px solid ${d.color}30` }}>
                          <Icon className="w-3.5 h-3.5" style={{ color: d.color }} />
                        </div>
                        <div>
                          <div className="text-xs font-medium text-foreground">{d.name}</div>
                          <div className="text-xs text-muted-foreground">{d.domain}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Question header */}
              <div className="inca-panel-active p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <MessageSquare className="w-4 h-4 text-primary" />
                      <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Question Under Deliberation</div>
                    </div>
                    <div className="text-sm text-foreground font-medium">{question}</div>
                  </div>
                  <button onClick={resetDebate} className="text-muted-foreground hover:text-foreground flex items-center gap-1.5 text-xs transition-colors flex-shrink-0">
                    <RotateCcw className="w-3.5 h-3.5" /> Reset
                  </button>
                </div>
                {debateMode === "running" && (
                  <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                    Round {displayedRound} of {debateData.length} in progress...
                  </div>
                )}
                {debateMode === "complete" && (
                  <div className="flex items-center gap-2 mt-3 text-xs text-green-400">
                    <ThumbsUp className="w-3.5 h-3.5" />
                    Deliberation complete — {debateData.length} rounds completed
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Debate timeline */}
                <div className="lg:col-span-2 space-y-3">
                  {debateData.slice(0, displayedRound).map((roundMsgs, roundIdx) => (
                    <div key={roundIdx} className="inca-panel overflow-hidden">
                      <div className="px-4 py-2 bg-secondary/50 border-b border-border">
                        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Round {roundIdx + 1}</div>
                      </div>
                      <div className="divide-y divide-border/30">
                        {roundMsgs.map((msg) => {
                          const agent = DEBATERS.find(d => d.id === msg.agentId)!;
                          const Icon = agent?.icon ?? Brain;
                          const msgKey = `${roundIdx}-${msg.agentId}`;
                          const isExpanded = expandedMsg === msgKey;
                          return (
                            <div key={msg.agentId} className="p-4 animate-fade-in">
                              <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0" style={{ background: `${agent?.color}18`, border: `1px solid ${agent?.color}30` }}>
                                  <Icon className="w-4 h-4" style={{ color: agent?.color }} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <div className="text-sm font-medium text-foreground">{agent?.name}</div>
                                    <span className={cn("px-1.5 py-0 rounded text-xs border", {
                                      "badge-running": msg.position === "support",
                                      "badge-error": msg.position === "oppose",
                                      "badge-idle": msg.position === "neutral" || msg.position === "abstain",
                                    })}>
                                      {msg.position}
                                    </span>
                                    <div className="ml-auto flex items-center gap-1.5">
                                      {msg.vote === "yes" ? <ThumbsUp className="w-3.5 h-3.5 text-green-400" /> : msg.vote === "no" ? <ThumbsDown className="w-3.5 h-3.5 text-red-400" /> : <span className="text-xs text-muted-foreground">—</span>}
                                    </div>
                                  </div>
                                  <div className="text-xs text-muted-foreground leading-relaxed mb-2">{msg.argument}</div>
                                  <ConfidenceBar value={msg.confidence} color={agent?.color ?? "#888"} />
                                  <button
                                    onClick={() => setExpandedMsg(isExpanded ? null : msgKey)}
                                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mt-2 transition-colors"
                                  >
                                    Evidence Citations {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                  </button>
                                  {isExpanded && (
                                    <div className="mt-2 flex flex-wrap gap-1 animate-fade-in">
                                      {msg.evidence.map((e, i) => (
                                        <span key={i} className="badge-staged px-2 py-0.5 rounded text-xs font-mono">{e}</span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                  {debateMode === "running" && displayedRound < debateData.length && (
                    <div className="inca-panel p-4 flex items-center gap-3">
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                      <div className="text-sm text-muted-foreground">Agents deliberating...</div>
                    </div>
                  )}
                </div>

                {/* Right panel: vote tracker + result */}
                <div className="space-y-3">
                  <div className="inca-panel p-4">
                    <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-3">Vote Tracker</div>
                    <div className="space-y-2">
                      {DEBATERS.map(d => {
                        const Icon = d.icon;
                        const latestMsg = allMessages.filter(m => m.agentId === d.id).at(-1);
                        return (
                          <div key={d.id} className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0" style={{ background: `${d.color}18`, border: `1px solid ${d.color}30` }}>
                              <Icon className="w-3.5 h-3.5" style={{ color: d.color }} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-medium text-foreground">{d.name}</div>
                              {latestMsg ? (
                                <ConfidenceBar value={latestMsg.confidence} color={d.color} />
                              ) : (
                                <div className="text-xs text-muted-foreground">Waiting...</div>
                              )}
                            </div>
                            <div className="flex-shrink-0">
                              {latestMsg?.vote === "yes" ? <ThumbsUp className="w-3.5 h-3.5 text-green-400" /> : latestMsg?.vote === "no" ? <ThumbsDown className="w-3.5 h-3.5 text-red-400" /> : <div className="w-3.5 h-3.5 rounded-full bg-secondary" />}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {debateMode === "complete" && (
                    <div className="inca-panel-active p-4 animate-scale-in">
                      <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-3">Consensus Verdict</div>
                      <div className={cn("inline-block px-3 py-1.5 rounded-lg border text-sm font-medium mb-3", verdictColor[consensusResult.verdict])}>
                        {consensusResult.verdict === "consensus-yes" ? "✓ Consensus: YES" : consensusResult.verdict === "consensus-no" ? "✗ Consensus: NO" : consensusResult.verdict === "split" ? "⚠ Split Verdict" : "⚑ Requires Review"}
                      </div>
                      <div className="mb-3">
                        <div className="text-xs text-muted-foreground mb-1">Overall Confidence</div>
                        <ConfidenceBar value={consensusResult.confidence} color="#7c3aed" />
                      </div>
                      <div className="text-xs text-muted-foreground leading-relaxed">{consensusResult.summary}</div>
                      {consensusResult.dissenting.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-border/50">
                          <div className="text-xs text-muted-foreground mb-1">Dissenting</div>
                          <div className="flex flex-wrap gap-1">
                            {consensusResult.dissenting.map(id => (
                              <span key={id} className="badge-error px-1.5 py-0.5 rounded text-xs capitalize">{id}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
