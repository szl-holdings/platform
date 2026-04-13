import { useState, useRef, useEffect } from "react";
import { cn } from "../lib/utils";
import { Brain, Shield, BarChart3, MessageSquare, ThumbsUp, ThumbsDown, Loader2, Play, RotateCcw, ChevronDown, ChevronUp } from "lucide-react";

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

export function ConsensusChamber() {
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

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-1.5 h-5 rounded-full bg-primary" />
          <h1 className="text-xl font-display font-semibold text-foreground">Consensus Chamber</h1>
        </div>
        <p className="text-sm text-muted-foreground ml-3.5">
          High-stakes deliberation engine. Agents debate, present evidence, and vote to reach consensus on critical decisions.
        </p>
      </div>

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
    </div>
  );
}
