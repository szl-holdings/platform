import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { Activity, Shield, User, Zap, Brain, AlertTriangle, ChevronRight, UserCheck, CheckCircle2, UserCog, Clock } from "lucide-react";
import { type ReplayEvent, type ReplayScenario } from "@/data/seed";
import { useInterventions, bootstrapInterventions, formatTimestamp, type Intervention } from "@/data/interventions";
import { useDecisionReplay } from "@/data/api";

const INTERVENTION_ICON: Record<Intervention["type"], React.ReactNode> = {
  claim: <UserCheck className="w-3 h-3 text-amber-300" />,
  resolve: <CheckCircle2 className="w-3 h-3 text-emerald-300" />,
  reassign: <UserCog className="w-3 h-3 text-sky-300" />,
  address: <CheckCircle2 className="w-3 h-3 text-emerald-300" />,
};

const INTERVENTION_LABEL: Record<Intervention["type"], string> = {
  claim: "Claimed ownership",
  resolve: "Resolved drift item",
  reassign: "Reassigned owner",
  address: "Flagged as addressed",
};

const INTERVENTION_TONE: Record<Intervention["type"], string> = {
  claim: "border-amber-500/30 bg-amber-500/5",
  resolve: "border-emerald-500/30 bg-emerald-500/5",
  reassign: "border-sky-500/30 bg-sky-500/5",
  address: "border-emerald-500/30 bg-emerald-500/5",
};

const EVIDENCE_ICONS: Record<ReplayEvent["evidenceType"], React.ReactNode> = {
  alloy: <Zap className="w-3 h-3 text-amber-400" />,
  human: <User className="w-3 h-3 text-sky-400" />,
  system: <Brain className="w-3 h-3 text-violet-400" />,
  escalation: <AlertTriangle className="w-3 h-3 text-red-400" />,
};

const EVIDENCE_COLORS: Record<ReplayEvent["evidenceType"], string> = {
  alloy: "border-amber-500/30 bg-amber-500/5",
  human: "border-sky-500/30 bg-sky-500/5",
  system: "border-violet-500/30 bg-violet-500/5",
  escalation: "border-red-500/30 bg-red-500/5",
};

const CONNECTOR_COLORS: Record<ReplayEvent["evidenceType"], string> = {
  alloy: "bg-amber-500/30",
  human: "bg-sky-500/30",
  system: "bg-violet-500/30",
  escalation: "bg-red-500/30",
};

function EventNode({ event, isLast }: { event: ReplayEvent; isLast: boolean }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="flex gap-3">
      {/* Timeline */}
      <div className="flex flex-col items-center">
        <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 z-10 ${EVIDENCE_COLORS[event.evidenceType].replace("bg-", "bg-").replace("/5", "/15")}`}
          style={{ borderColor: event.evidenceType === "alloy" ? "rgba(245,158,11,0.4)" : event.evidenceType === "human" ? "rgba(14,165,233,0.4)" : event.evidenceType === "escalation" ? "rgba(239,68,68,0.4)" : "rgba(167,139,250,0.4)" }}
        >
          {EVIDENCE_ICONS[event.evidenceType]}
        </div>
        {!isLast && <div className={`w-px flex-1 mt-1 min-h-[24px] ${CONNECTOR_COLORS[event.evidenceType]}`} />}
      </div>

      {/* Content */}
      <div className={`flex-1 pb-5 border rounded-lg p-3 mb-3 cursor-pointer hover:opacity-90 transition-opacity ${EVIDENCE_COLORS[event.evidenceType]}`}
        onClick={() => setExpanded(v => !v)}
      >
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[10px] font-mono text-amber-400/50">{event.timestamp}</span>
              {event.signal && (
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400">
                  {event.signal}
                </span>
              )}
            </div>
            <p className="text-xs font-semibold text-amber-100">{event.actor}</p>
            <p className="text-[10px] text-amber-400/55">{event.role} · {event.action}</p>
          </div>
          <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${EVIDENCE_COLORS[event.evidenceType]} uppercase`}
            style={{ color: event.evidenceType === "alloy" ? "#f59e0b" : event.evidenceType === "human" ? "#38bdf8" : event.evidenceType === "escalation" ? "#f87171" : "#c4b5fd" }}
          >
            {event.evidenceType}
          </span>
        </div>

        {expanded && (
          <div className="mt-2 pt-2 border-t space-y-2"
            style={{ borderColor: event.evidenceType === "alloy" ? "rgba(245,158,11,0.15)" : event.evidenceType === "human" ? "rgba(14,165,233,0.15)" : "rgba(239,68,68,0.15)" }}
          >
            <p className="text-xs text-amber-100/70 leading-relaxed">{event.detail}</p>
            <div className="flex items-center gap-2">
              <span className="proof-badge text-[9px]">
                <Shield className="w-2 h-2" />
                {event.proofRef}
              </span>
              <span className="text-[9px] font-mono text-amber-400/35">LEDGER-ANCHORED</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ScenarioCard({ scenario, selected, onClick }: { scenario: ReplayScenario; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left cockpit-panel p-4 hover:border-amber-500/30 transition-all ${selected ? "border-amber-500/40 bg-amber-500/5" : ""}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-semibold text-amber-100">{scenario.title}</p>
          <p className="text-[10px] font-mono text-amber-400/45 mt-0.5">{scenario.dateRange}</p>
        </div>
        <ChevronRight className={`w-3.5 h-3.5 shrink-0 mt-0.5 transition-transform ${selected ? "rotate-90 text-amber-400" : "text-amber-400/30"}`} />
      </div>
      <p className="text-[11px] text-amber-100/55 mt-2 leading-snug">{scenario.decision}</p>
      <div className="mt-2 flex items-center gap-2">
        <span className="text-[9px] font-mono text-amber-400/40">{scenario.events.length} events</span>
        <span className="text-[9px] font-mono text-amber-400/30">·</span>
        <span className="proof-badge text-[9px]"><Shield className="w-2 h-2" />{scenario.events.at(-1)?.proofRef}</span>
      </div>
    </button>
  );
}

export default function DecisionReplayPage() {
  useEffect(() => { void bootstrapInterventions(); }, []);

  const params = useParams<{ id?: string }>();
  const { data, isLoading, error } = useDecisionReplay();
  const [activeScenario, setActiveScenario] = useState<ReplayScenario | null>(null);
  const [activeEvent, setActiveEvent] = useState<string | null>(null);
  const { log: interventionLog } = useInterventions();

  useEffect(() => {
    if (!data?.scenarios?.length) return;
    const initial = params.id
      ? (data.scenarios.find(s => s.id === params.id) ?? data.scenarios[0])
      : data.scenarios[0];
    setActiveScenario(prev => prev?.id === initial.id ? prev : initial);
  }, [data, params.id]);

  if (isLoading) {
    return <div className="p-6 text-xs font-mono text-amber-400/50">Loading decision replay…</div>;
  }
  if (error || !data || !activeScenario) {
    return <div className="p-6 text-xs font-mono text-red-400/70">Failed to load decision replay data.</div>;
  }
  const replayScenarios = data.scenarios;
  const alloyEvents = activeScenario.events.filter(e => e.evidenceType === "alloy").length;
  const humanEvents = activeScenario.events.filter(e => e.evidenceType === "human").length;

  return (
    <div className="p-6 space-y-6 max-w-6xl">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Activity className="w-4 h-4 text-amber-400" />
          <h1 className="text-xl font-display font-bold text-amber-50">Decision Replay</h1>
        </div>
        <p className="text-sm text-amber-100/50">Reconstruct who knew what, when — with the full proof chain anchored to the Alloy ledger.</p>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 flex-wrap">
        <span className="text-[10px] font-mono text-amber-400/40">EVENT TYPES:</span>
        {[
          { type: "alloy", label: "Alloy Signal / System", color: "#f59e0b" },
          { type: "human", label: "Human Actor", color: "#38bdf8" },
          { type: "escalation", label: "Escalation", color: "#f87171" },
        ].map(l => (
          <div key={l.type} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full border-2" style={{ borderColor: l.color, background: l.color + "30" }} />
            <span className="text-[10px] font-mono" style={{ color: l.color }}>{l.label}</span>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {/* Scenario list */}
        <div className="space-y-2">
          <p className="text-[10px] font-mono text-amber-400/40 uppercase mb-3">Scenarios</p>
          {replayScenarios.map(s => (
            <ScenarioCard
              key={s.id}
              scenario={s}
              selected={activeScenario.id === s.id}
              onClick={() => setActiveScenario(s)}
            />
          ))}

          {/* Operator interventions */}
          <div className="cockpit-panel p-4 mt-4 space-y-2" data-testid="panel-intervention-log">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-mono text-amber-400/40 uppercase">Operator Interventions</p>
              <span className="text-[9px] font-mono text-amber-400/40">{interventionLog.length} logged</span>
            </div>
            {interventionLog.length === 0 ? (
              <p className="text-[10px] text-amber-100/40 italic">
                Claim, reassign, or close items from the Drift / Debt surfaces — entries land here, ledger-anchored.
              </p>
            ) : (
              <ul className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {interventionLog.slice(0, 8).map(entry => (
                  <li
                    key={entry.id}
                    data-testid={`intervention-${entry.type}-${entry.itemId}`}
                    className={`rounded border px-2.5 py-2 ${INTERVENTION_TONE[entry.type]}`}
                  >
                    <div className="flex items-start gap-2">
                      <div className="mt-0.5">{INTERVENTION_ICON[entry.type]}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-mono text-amber-400/55">{formatTimestamp(entry.timestamp)}</p>
                        <p className="text-[11px] text-amber-100/80 leading-snug">
                          <span className="text-amber-200">{entry.actor}</span> · {INTERVENTION_LABEL[entry.type]}
                          {entry.newOwner && <> → <span className="text-sky-300">{entry.newOwner}</span></>}
                        </p>
                        <p className="text-[10px] text-amber-100/45 truncate">{entry.itemTitle}</p>
                        {entry.notes && (
                          <p className="text-[10px] text-amber-100/55 mt-0.5 italic">"{entry.notes}"</p>
                        )}
                        <span className="proof-badge text-[9px] mt-1">
                          <Shield className="w-2 h-2" />{entry.proofRef}
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Proof stats for active */}
          <div className="cockpit-panel p-4 mt-4 space-y-2">
            <p className="text-[10px] font-mono text-amber-400/40 uppercase">Proof Coverage</p>
            <div className="space-y-2">
              {[
                { label: "Alloy Signals", value: alloyEvents, color: "#f59e0b" },
                { label: "Human Actions", value: humanEvents, color: "#38bdf8" },
                { label: "Total Events", value: activeScenario.events.length, color: "#a78bfa" },
              ].map(m => (
                <div key={m.label} className="flex items-center justify-between">
                  <span className="text-[10px] text-amber-400/55">{m.label}</span>
                  <span className="text-sm font-mono font-bold" style={{ color: m.color }}>{m.value}</span>
                </div>
              ))}
            </div>
            <div className="proof-badge mt-1">
              <Shield className="w-2.5 h-2.5" />
              FULLY ANCHORED
            </div>
          </div>
        </div>

        {/* Replay timeline */}
        <div className="md:col-span-2">
          {/* Scenario header */}
          <div className="cockpit-panel p-4 mb-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-mono text-amber-400/50 mb-1">{activeScenario.dateRange}</p>
                <p className="text-sm font-semibold text-amber-100">{activeScenario.title}</p>
                <p className="text-xs text-amber-100/55 mt-1">{activeScenario.decision}</p>
              </div>
              <span className="proof-badge shrink-0">
                <Shield className="w-2.5 h-2.5" />
                {activeScenario.events.at(-1)?.proofRef}
              </span>
            </div>
            <div className="mt-3 pt-3 border-t border-amber-500/10 flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400/60" />
              <p className="text-[11px] text-amber-100/55"><span className="text-amber-300 font-medium">Outcome:</span> {activeScenario.outcome}</p>
            </div>
          </div>

          {/* Timeline */}
          <div className="px-2">
            <p className="text-[10px] font-mono text-amber-400/40 uppercase mb-4">
              Proof Chain — {activeScenario.events.length} events · Click any event to expand
            </p>
            {activeScenario.events.map((event, i) => (
              <EventNode
                key={event.id}
                event={event}
                isLast={i === activeScenario.events.length - 1}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
