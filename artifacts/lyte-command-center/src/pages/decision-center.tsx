import { useState } from "react";
import {
  Shield, Brain, CheckCircle2, XCircle, AlertTriangle, Clock, Eye,
  ChevronRight, Activity, Database, FileText, Globe, User, Cpu, Zap,
  Layers, BarChart3, RefreshCw, ArrowUpRight, Scale, Target,
} from "lucide-react";
import {
  useDecisions, useDecision, useDecisionApprove, useDecisionReject, useDecisionRequestChanges,
  type DecisionCard, type DecisionStatus, type ValidationCheck, type RunStep, type EvidenceItem, type AuditEvent,
  type Severity, type AutonomyMode, type PolicyState, type Freshness, type Domain,
} from "@/data/decisions-api";

// ─── Config maps ─────────────────────────────────────────────────────────────

const SEVERITY_CFG: Record<Severity, { color: string; bg: string; border: string; label: string }> = {
  critical: { color: "text-red-400", bg: "bg-red-500/8", border: "border-red-500/25", label: "CRITICAL" },
  high:     { color: "text-orange-400", bg: "bg-orange-500/8", border: "border-orange-500/25", label: "HIGH" },
  medium:   { color: "text-amber-400", bg: "bg-amber-500/8", border: "border-amber-500/25", label: "MEDIUM" },
  low:      { color: "text-sky-400", bg: "bg-sky-500/8", border: "border-sky-500/25", label: "LOW" },
};

const AUTONOMY_CFG: Record<AutonomyMode, { color: string; bg: string; label: string; icon: string }> = {
  "observe":               { color: "text-slate-400", bg: "bg-slate-500/10", label: "Observe", icon: "👁" },
  "recommend":             { color: "text-sky-400",   bg: "bg-sky-500/10",   label: "Recommend", icon: "💡" },
  "draft":                 { color: "text-violet-400", bg: "bg-violet-500/10", label: "Draft", icon: "✏️" },
  "execute-with-approval": { color: "text-amber-400", bg: "bg-amber-500/10", label: "Exec + Approval", icon: "🔒" },
  "auto-execute":          { color: "text-emerald-400", bg: "bg-emerald-500/10", label: "Auto-Execute", icon: "⚡" },
};

const POLICY_CFG: Record<PolicyState, { color: string; label: string }> = {
  cleared:     { color: "text-emerald-400", label: "Cleared" },
  conditional: { color: "text-amber-400",   label: "Conditional" },
  blocked:     { color: "text-red-400",     label: "Blocked" },
  flagged:     { color: "text-orange-400",  label: "Flagged" },
  pending:     { color: "text-sky-400",     label: "Pending" },
};

const FRESHNESS_CFG: Record<Freshness, { color: string; dot: string; label: string }> = {
  live:    { color: "text-emerald-400", dot: "bg-emerald-400", label: "Live" },
  recent:  { color: "text-amber-400",   dot: "bg-amber-400",   label: "Recent" },
  stale:   { color: "text-orange-400",  dot: "bg-orange-400",  label: "Stale" },
  expired: { color: "text-red-400",     dot: "bg-red-400",     label: "Expired" },
};

const DOMAIN_CFG: Record<Domain, { color: string; label: string }> = {
  lyte:         { color: "text-amber-400",   label: "Lyte" },
  aegis:        { color: "text-red-400",     label: "Aegis" },
  vessels:      { color: "text-sky-400",     label: "Vessels" },
  terra:        { color: "text-emerald-400", label: "Terra" },
  counsel:      { color: "text-violet-400",  label: "Counsel" },
  carlota:      { color: "text-pink-400",    label: "Carlota" },
  cross_domain: { color: "text-slate-400",   label: "Cross-Domain" },
};

const STATUS_CFG: Record<string, { color: string; label: string }> = {
  "ready-for-review":   { color: "text-amber-400",   label: "Ready for Review" },
  "approved":           { color: "text-emerald-400", label: "Approved" },
  "rejected":           { color: "text-red-400",     label: "Rejected" },
  "changes-requested":  { color: "text-orange-400",  label: "Changes Requested" },
  "validation-pending": { color: "text-sky-400",     label: "Validation Pending" },
  "draft":              { color: "text-slate-400",   label: "Draft" },
  "executed":           { color: "text-violet-400",  label: "Executed" },
  "superseded":         { color: "text-slate-500",   label: "Superseded" },
};

const SOURCE_TYPE_ICONS: Record<string, React.ReactNode> = {
  signal:   <Activity className="w-3 h-3" />,
  database: <Database className="w-3 h-3" />,
  document: <FileText className="w-3 h-3" />,
  api:      <Globe className="w-3 h-3" />,
  human:    <User className="w-3 h-3" />,
  model:    <Cpu className="w-3 h-3" />,
};

// ─── Badges ───────────────────────────────────────────────────────────────────

function SeverityBadge({ severity }: { severity: Severity }) {
  const cfg = SEVERITY_CFG[severity];
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider border ${cfg.color} ${cfg.bg} ${cfg.border}`}>
      {cfg.label}
    </span>
  );
}

function AutonomyBadge({ mode }: { mode: AutonomyMode }) {
  const cfg = AUTONOMY_CFG[mode];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-medium ${cfg.color} ${cfg.bg}`}>
      <span>{cfg.icon}</span>
      {cfg.label}
    </span>
  );
}

function FreshnessDot({ freshness }: { freshness: Freshness }) {
  const cfg = FRESHNESS_CFG[freshness];
  return (
    <span className="inline-flex items-center gap-1">
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} animate-pulse`} />
      <span className={`text-[9px] font-medium ${cfg.color}`}>{cfg.label.toUpperCase()}</span>
    </span>
  );
}

function ValidationBadge({ summary }: { summary: DecisionCard["validationSummary"] }) {
  if (!summary) return <span className="text-[9px] text-slate-500">—</span>;
  if (summary.blockingFailures > 0) {
    return (
      <span className="inline-flex items-center gap-1 text-[9px] text-red-400">
        <XCircle className="w-3 h-3" />
        {summary.blockingFailures} blocking
      </span>
    );
  }
  if (summary.warnings > 0) {
    return (
      <span className="inline-flex items-center gap-1 text-[9px] text-amber-400">
        <AlertTriangle className="w-3 h-3" />
        {summary.warnings} warning
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[9px] text-emerald-400">
      <CheckCircle2 className="w-3 h-3" />
      All passed
    </span>
  );
}

// ─── Card Row ─────────────────────────────────────────────────────────────────

function CardRow({ card, onClick, selected }: { card: DecisionCard; onClick: () => void; selected: boolean }) {
  const statusCfg = STATUS_CFG[card.status] ?? { color: "text-slate-400", label: card.status };
  const domainCfg = DOMAIN_CFG[card.domain];

  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-4 border-b border-amber-500/8 transition-all duration-150 hover:bg-amber-500/4 ${selected ? "bg-amber-500/6 border-l-2 border-l-amber-400" : "border-l-2 border-l-transparent"}`}
    >
      <div className="flex items-start gap-3">
        {/* Severity indicator */}
        <div className={`w-1 h-full min-h-[40px] rounded-full shrink-0 mt-0.5 ${SEVERITY_CFG[card.severity].color.replace("text-", "bg-")}`} style={{ background: undefined }}>
          <SeverityBadge severity={card.severity} />
        </div>

        <div className="flex-1 min-w-0">
          {/* Top row */}
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <SeverityBadge severity={card.severity} />
            <span className={`text-[9px] font-medium ${domainCfg.color}`}>{domainCfg.label.toUpperCase()}</span>
            <FreshnessDot freshness={card.freshness} />
            <span className={`text-[9px] font-medium ${statusCfg.color}`}>{statusCfg.label}</span>
            <ValidationBadge summary={card.validationSummary} />
          </div>

          {/* Title */}
          <p className="text-sm font-semibold text-amber-100 leading-snug line-clamp-2 mb-1.5">{card.title}</p>

          {/* Meta row */}
          <div className="flex items-center gap-3 flex-wrap">
            <AutonomyBadge mode={card.autonomyMode} />
            <span className={`text-[9px] font-medium ${POLICY_CFG[card.policyState]?.color ?? "text-slate-400"}`}>
              Policy: {POLICY_CFG[card.policyState]?.label ?? card.policyState}
            </span>
            <span className="text-[9px] text-amber-400/40">
              Conf: <span className="text-amber-400/70">{(card.confidence * 100).toFixed(0)}%</span>
            </span>
            <span className="text-[9px] text-amber-400/40">
              Evidence: <span className="text-amber-400/70">{card.evidenceCount}</span>
            </span>
            {card.owner && (
              <span className="text-[9px] text-amber-400/40">
                Owner: <span className="text-amber-400/70">{card.owner}</span>
              </span>
            )}
          </div>

          {/* Entity scope */}
          {Array.isArray(card.entityScope) && card.entityScope.length > 0 && (
            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
              {(card.entityScope as string[]).slice(0, 4).map((e, i) => (
                <span key={i} className="px-1.5 py-0.5 rounded bg-amber-500/6 border border-amber-500/15 text-[9px] text-amber-300/60">
                  {e}
                </span>
              ))}
            </div>
          )}

          {/* Recommended action */}
          {card.recommendedAction && (
            <p className="mt-1.5 text-[10px] text-emerald-400/70 line-clamp-1">
              ↳ {card.recommendedAction}
            </p>
          )}
        </div>

        <ChevronRight className="w-4 h-4 text-amber-500/30 shrink-0 mt-1" />
      </div>
    </button>
  );
}

// ─── Evidence Tab ─────────────────────────────────────────────────────────────

function EvidenceTab({ evidence }: { evidence: EvidenceItem[] }) {
  return (
    <div className="space-y-3">
      {evidence.map((ev) => {
        const freshCfg = FRESHNESS_CFG[ev.freshness] ?? { color: "text-slate-400", label: ev.freshness };
        return (
          <div key={ev.id} className="p-3 rounded-lg bg-white/3 border border-amber-500/10">
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <div className="flex items-center gap-1.5">
                <span className="text-amber-400/50">{SOURCE_TYPE_ICONS[ev.sourceType] ?? <Activity className="w-3 h-3" />}</span>
                <span className="text-[10px] font-semibold text-amber-200">{ev.label}</span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <FreshnessDot freshness={ev.freshness} />
                <span className="text-[9px] text-amber-400/50">
                  Conf: <span className="text-amber-400/80">{(ev.confidence * 100).toFixed(0)}%</span>
                </span>
              </div>
            </div>
            <p className="text-[11px] text-amber-100/80 mb-1">{ev.value}</p>
            {ev.excerpt && (
              <p className="text-[10px] text-amber-400/50 italic border-l border-amber-500/20 pl-2 mb-1">{ev.excerpt}</p>
            )}
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[9px] text-amber-400/40 font-mono">{ev.source}</span>
              <span className="text-[9px] text-amber-400/30">·</span>
              <span className="text-[9px] text-amber-400/40">{new Date(ev.capturedAt).toLocaleDateString()}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Validation Tab ───────────────────────────────────────────────────────────

const CHECK_LABELS: Record<string, { label: string; desc: string }> = {
  "contradiction":    { label: "Contradiction Check", desc: "ACH — does any evidence contradict the recommendation?" },
  "stale-data":       { label: "Stale-Data Check", desc: "I&W freshness — is any critical evidence expired?" },
  "missing-evidence": { label: "Missing Evidence", desc: "Key assumptions — are required evidence types absent?" },
  "policy":           { label: "Policy Check", desc: "Constitution — does the action fall within workspace policy?" },
  "confidence-floor": { label: "Confidence Floor", desc: "Uncertainty — is composite confidence above workspace minimum?" },
  "falsification":    { label: "Falsification Prompt", desc: "Devil's advocacy — what would invalidate this recommendation?" },
};

function ValidationTab({ validations }: { validations: ValidationCheck[] }) {
  return (
    <div className="space-y-3">
      <p className="text-[10px] text-amber-400/40 leading-relaxed">
        Six structured adversarial checks run before every card is promoted to "ready for review". Based on intelligence tradecraft: Analysis of Competing Hypotheses (ACH), Indicators & Warnings (I&W), Key Assumptions Check, and Devil's Advocacy.
      </p>
      {validations.map((v) => {
        const info = CHECK_LABELS[v.checkType] ?? { label: v.checkType, desc: "" };
        return (
          <div
            key={v.id}
            className={`p-3 rounded-lg border ${
              !v.passed && v.severity === "blocking"
                ? "bg-red-500/5 border-red-500/25"
                : v.severity === "warning"
                  ? "bg-amber-500/5 border-amber-500/20"
                  : "bg-emerald-500/4 border-emerald-500/15"
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              {!v.passed && v.severity === "blocking" ? (
                <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
              ) : v.severity === "warning" ? (
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              )}
              <span className={`text-[10px] font-semibold ${!v.passed && v.severity === "blocking" ? "text-red-300" : v.severity === "warning" ? "text-amber-300" : "text-emerald-300"}`}>
                {info.label}
              </span>
              <span className={`ml-auto text-[9px] px-1.5 py-0.5 rounded font-bold ${
                !v.passed && v.severity === "blocking" ? "bg-red-500/20 text-red-400" :
                v.severity === "warning" ? "bg-amber-500/15 text-amber-400" : "bg-emerald-500/15 text-emerald-400"
              }`}>
                {!v.passed && v.severity === "blocking" ? "BLOCKING" : v.severity === "warning" ? "WARNING" : "PASS"}
              </span>
            </div>
            {info.desc && <p className="text-[9px] text-amber-400/40 mb-1.5 italic">{info.desc}</p>}
            <p className="text-[11px] text-amber-100/70">{v.explanation}</p>
          </div>
        );
      })}
    </div>
  );
}

// ─── Run Trace Tab ────────────────────────────────────────────────────────────

function RunTraceTab({ run }: { run: NonNullable<import("@/data/decisions-api").DecisionDetail["runTrace"]> }) {
  const steps = (run.steps as RunStep[]) ?? [];

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          { label: "Total Latency", value: run.totalLatencyMs ? `${run.totalLatencyMs.toLocaleString()}ms` : "—" },
          { label: "Input Tokens", value: run.totalInputTokens?.toLocaleString() ?? "—" },
          { label: "Output Tokens", value: run.totalOutputTokens?.toLocaleString() ?? "—" },
          { label: "Est. Cost", value: run.estimatedCostUsd ? `$${run.estimatedCostUsd.toFixed(4)}` : "—" },
        ].map(({ label, value }) => (
          <div key={label} className="p-2.5 rounded-lg bg-white/3 border border-amber-500/10">
            <p className="text-[9px] text-amber-400/40 mb-0.5">{label}</p>
            <p className="text-sm font-semibold text-amber-100">{value}</p>
          </div>
        ))}
      </div>

      {/* Models and tools used */}
      <div className="flex items-center gap-3 flex-wrap">
        {(run.modelsCalled as string[]).map((m) => (
          <span key={m} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] bg-violet-500/10 text-violet-300 border border-violet-500/20">
            <Cpu className="w-2.5 h-2.5" /> {m}
          </span>
        ))}
        {(run.toolsCalled as string[]).map((t) => (
          <span key={t} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] bg-sky-500/10 text-sky-300 border border-sky-500/20">
            <Zap className="w-2.5 h-2.5" /> {t}
          </span>
        ))}
      </div>

      {/* Step-by-step trace */}
      <div className="space-y-2">
        <p className="text-[9px] font-mono text-amber-400/30 uppercase tracking-wider">Step Trace</p>
        {steps.map((step, idx) => (
          <div key={idx} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-white/2 border border-amber-500/8">
            <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 mt-0.5 ${
              step.stepType === "model-call" ? "bg-violet-500/15 text-violet-400" :
              step.stepType === "tool-call" ? "bg-sky-500/15 text-sky-400" :
              "bg-amber-500/15 text-amber-400"
            }`}>
              {step.stepType === "model-call" ? <Cpu className="w-2.5 h-2.5" /> :
               step.stepType === "tool-call" ? <Zap className="w-2.5 h-2.5" /> :
               <ArrowUpRight className="w-2.5 h-2.5" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[10px] font-medium text-amber-100">{step.name}</span>
                <span className="text-[9px] text-amber-400/40">{step.latencyMs}ms</span>
                {step.model && <span className="text-[9px] text-violet-400/60">{step.model}</span>}
                {step.tool && <span className="text-[9px] text-sky-400/60">{step.tool}</span>}
                {step.status === "failed" && <span className="text-[9px] text-red-400">FAILED</span>}
              </div>
              {step.outputSummary && (
                <p className="text-[10px] text-amber-400/50">{step.outputSummary}</p>
              )}
              {step.inputTokens !== undefined && (
                <p className="text-[9px] text-amber-400/30 mt-0.5">
                  in: {step.inputTokens} tokens · out: {step.outputTokens ?? 0} tokens
                  {step.costUsd ? ` · $${step.costUsd.toFixed(4)}` : ""}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Audit Trail Tab ──────────────────────────────────────────────────────────

function AuditTrailTab({ events }: { events: AuditEvent[] }) {
  return (
    <div className="space-y-2">
      {events.map((evt) => (
        <div key={evt.eventId} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-white/2 border border-amber-500/8">
          <div className="w-1.5 h-1.5 rounded-full bg-amber-500/50 shrink-0 mt-1.5" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              <span className="text-[10px] font-medium text-amber-200">{evt.eventType}</span>
              <span className="text-[9px] text-amber-400/40">{new Date(evt.occurredAt).toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] text-amber-400/60">{evt.actorDisplay ?? evt.actorId}</span>
              {evt.reason && <span className="text-[9px] text-amber-400/40 italic">"{evt.reason}"</span>}
            </div>
            {evt.previousStatus && (
              <p className="text-[9px] text-amber-400/30 mt-0.5 font-mono">
                {evt.previousStatus} → {evt.newStatus}
              </p>
            )}
            <p className="text-[9px] text-amber-400/25 font-mono mt-0.5">{evt.eventId}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Detail Drawer ────────────────────────────────────────────────────────────

type DrawerTab = "evidence" | "validations" | "run-trace" | "audit";

function DetailDrawer({ cardId, onClose }: { cardId: string; onClose: () => void }) {
  const [tab, setTab] = useState<DrawerTab>("evidence");
  const [actionNote, setActionNote] = useState("");
  const [actionPending, setActionPending] = useState<string | null>(null);

  const { data, isLoading, error } = useDecision(cardId);
  const approve = useDecisionApprove();
  const reject = useDecisionReject();
  const requestChanges = useDecisionRequestChanges();

  const detail = data?.data;
  const card = detail?.card;

  async function handleAction(action: "approve" | "reject" | "request-changes") {
    if (!cardId || !card) return;
    setActionPending(action);
    try {
      if (action === "approve") await approve.mutateAsync({ cardId, reason: actionNote });
      if (action === "reject") await reject.mutateAsync({ cardId, reason: actionNote });
      if (action === "request-changes") await requestChanges.mutateAsync({ cardId, reason: actionNote });
      setActionNote("");
      onClose();
    } finally {
      setActionPending(null);
    }
  }

  const tabs: { id: DrawerTab; label: string; count?: number }[] = [
    { id: "evidence", label: "Evidence", count: detail?.evidence.length },
    { id: "validations", label: "Validation", count: detail?.validations.length },
    { id: "run-trace", label: "Run Trace" },
    { id: "audit", label: "Audit Trail", count: detail?.auditTrail.length },
  ];

  const canAct = card && (card.status === "ready-for-review" || card.status === "validation-pending" || card.status === "draft");

  return (
    <div className="fixed inset-0 z-50 flex" onClick={onClose}>
      <div className="flex-1" />
      <div
        className="w-full max-w-2xl h-full bg-[hsl(220_30%_4%)] border-l border-amber-500/15 flex flex-col overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-amber-500/10 shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              {card && (
                <div className="flex items-center gap-2 flex-wrap mb-1.5">
                  <SeverityBadge severity={card.severity} />
                  <AutonomyBadge mode={card.autonomyMode} />
                  <span className={`text-[9px] ${DOMAIN_CFG[card.domain]?.color ?? "text-slate-400"}`}>
                    {DOMAIN_CFG[card.domain]?.label.toUpperCase()}
                  </span>
                </div>
              )}
              <p className="text-sm font-semibold text-amber-100 leading-snug">
                {isLoading ? "Loading…" : card?.title ?? "Decision Card"}
              </p>
              {card?.auditEventId && (
                <p className="text-[9px] font-mono text-amber-400/25 mt-1">{card.auditEventId}</p>
              )}
            </div>
            <button onClick={onClose} className="text-amber-400/40 hover:text-amber-300 transition-colors text-lg leading-none shrink-0">✕</button>
          </div>
        </div>

        {/* Card summary area */}
        {card && (
          <div className="px-5 py-3 border-b border-amber-500/8 shrink-0">
            <p className="text-[11px] text-amber-400/60 leading-relaxed mb-2">{card.summary}</p>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <p className="text-[9px] text-amber-400/30 mb-0.5">Policy State</p>
                <p className={`text-[10px] font-medium ${POLICY_CFG[card.policyState]?.color ?? "text-slate-400"}`}>
                  {POLICY_CFG[card.policyState]?.label}
                </p>
              </div>
              <div>
                <p className="text-[9px] text-amber-400/30 mb-0.5">Confidence</p>
                <p className="text-[10px] font-medium text-amber-300">{(card.confidence * 100).toFixed(0)}%</p>
              </div>
              <div>
                <p className="text-[9px] text-amber-400/30 mb-0.5">Freshness</p>
                <FreshnessDot freshness={card.freshness} />
              </div>
            </div>
            {card.recommendedAction && (
              <div className="mt-2 p-2 rounded bg-emerald-500/5 border border-emerald-500/15">
                <p className="text-[9px] text-emerald-400/50 mb-0.5">Recommended Action</p>
                <p className="text-[10px] text-emerald-300/80">{card.recommendedAction}</p>
              </div>
            )}
            {card.policyEvaluation && (
              <div className="mt-2 p-2 rounded bg-amber-500/5 border border-amber-500/10">
                <div className="flex items-center gap-2">
                  <Scale className="w-3 h-3 text-amber-400/50" />
                  <p className="text-[9px] text-amber-400/50">
                    Policy: <span className={`font-medium ${card.policyEvaluation.decision === "allow" ? "text-emerald-400" : card.policyEvaluation.decision === "block" ? "text-red-400" : "text-amber-400"}`}>
                      {card.policyEvaluation.decision.toUpperCase()}
                    </span>
                    {card.policyEvaluation.requiredApproverRoles && card.policyEvaluation.requiredApproverRoles.length > 0 && (
                      <span className="text-amber-400/40 ml-2">
                        Requires: {card.policyEvaluation.requiredApproverRoles.join(", ")}
                      </span>
                    )}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-amber-500/10 shrink-0">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 px-3 py-2.5 text-[10px] font-medium transition-colors ${
                tab === t.id
                  ? "text-amber-300 border-b-2 border-amber-400 bg-amber-500/5"
                  : "text-amber-400/40 hover:text-amber-400/70"
              }`}
            >
              {t.label}
              {t.count !== undefined && (
                <span className="ml-1 text-[9px] opacity-60">({t.count})</span>
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-5 h-5 text-amber-400/40 animate-spin" />
            </div>
          )}
          {error && (
            <div className="text-center py-8">
              <XCircle className="w-8 h-8 text-red-400/40 mx-auto mb-2" />
              <p className="text-[11px] text-red-400/60">Failed to load proof-chain</p>
            </div>
          )}
          {detail && !isLoading && (
            <>
              {tab === "evidence" && <EvidenceTab evidence={detail.evidence} />}
              {tab === "validations" && <ValidationTab validations={detail.validations} />}
              {tab === "run-trace" && (
                detail.runTrace
                  ? <RunTraceTab run={detail.runTrace} />
                  : <p className="text-[11px] text-amber-400/40 text-center py-8">No run trace recorded</p>
              )}
              {tab === "audit" && <AuditTrailTab events={detail.auditTrail} />}
            </>
          )}
        </div>

        {/* Action panel */}
        {canAct && (
          <div className="px-5 py-4 border-t border-amber-500/10 shrink-0 space-y-3">
            <textarea
              value={actionNote}
              onChange={e => setActionNote(e.target.value)}
              placeholder="Add a note (optional)…"
              rows={2}
              className="w-full bg-white/3 border border-amber-500/15 rounded-lg px-3 py-2 text-[11px] text-amber-100 placeholder-amber-400/30 resize-none focus:outline-none focus:border-amber-500/40"
            />
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleAction("approve")}
                disabled={actionPending !== null}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[11px] font-medium hover:bg-emerald-500/20 transition-colors disabled:opacity-40"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                {actionPending === "approve" ? "Approving…" : "Approve"}
              </button>
              <button
                onClick={() => handleAction("request-changes")}
                disabled={actionPending !== null}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/25 text-amber-400 text-[11px] font-medium hover:bg-amber-500/15 transition-colors disabled:opacity-40"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                {actionPending === "request-changes" ? "Sending…" : "Request Changes"}
              </button>
              <button
                onClick={() => handleAction("reject")}
                disabled={actionPending !== null}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/25 text-red-400 text-[11px] font-medium hover:bg-red-500/15 transition-colors disabled:opacity-40"
              >
                <XCircle className="w-3.5 h-3.5" />
                {actionPending === "reject" ? "Rejecting…" : "Reject"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const DOMAIN_FILTERS = [
  { value: undefined, label: "All Domains" },
  { value: "lyte" as const, label: "Lyte" },
  { value: "aegis" as const, label: "Aegis" },
  { value: "vessels" as const, label: "Vessels" },
];

const STATUS_FILTERS = [
  { value: undefined, label: "All Status" },
  { value: "ready-for-review" as const, label: "Ready for Review" },
  { value: "approved" as const, label: "Approved" },
  { value: "rejected" as const, label: "Rejected" },
  { value: "changes-requested" as const, label: "Changes Requested" },
];

const SEVERITY_FILTERS = [
  { value: undefined, label: "All Severity" },
  { value: "critical" as const, label: "Critical" },
  { value: "high" as const, label: "High" },
  { value: "medium" as const, label: "Medium" },
  { value: "low" as const, label: "Low" },
];

const AUTONOMY_FILTERS: Array<{ value: AutonomyMode | undefined; label: string }> = [
  { value: undefined, label: "All Modes" },
  { value: "auto-execute", label: "Auto-Execute" },
  { value: "execute-with-approval", label: "Exec + Approval" },
  { value: "draft", label: "Draft" },
  { value: "recommend", label: "Recommend" },
  { value: "observe", label: "Observe" },
];

export default function DecisionCenter() {
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [domainFilter, setDomainFilter] = useState<Domain | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<DecisionStatus | undefined>(undefined);
  const [severityFilter, setSeverityFilter] = useState<Severity | undefined>(undefined);
  const [autonomyFilter, setAutonomyFilter] = useState<AutonomyMode | undefined>(undefined);

  const { data, isLoading, error, refetch } = useDecisions({
    domain: domainFilter,
    status: statusFilter,
    severity: severityFilter,
    autonomyMode: autonomyFilter,
  });

  const cards = data?.data ?? [];
  const total = data?.total ?? 0;

  // Derived stats
  const criticalCount = cards.filter(c => c.severity === "critical").length;
  const readyCount = cards.filter(c => c.status === "ready-for-review").length;
  const avgConfidence = cards.length > 0 ? cards.reduce((s, c) => s + c.confidence, 0) / cards.length : 0;
  const blockingFailures = cards.filter(c => (c.validationSummary?.blockingFailures ?? 0) > 0).length;

  return (
    <div className="min-h-screen bg-[hsl(220_30%_3%)] text-amber-50">
      {/* Page header */}
      <div className="border-b border-amber-500/10 px-6 py-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5">
              <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <Brain className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <h1 className="text-lg font-bold text-amber-100 tracking-tight">Decision Center</h1>
              <span className="text-[9px] font-mono text-amber-400/30 bg-amber-500/5 border border-amber-500/15 px-1.5 py-0.5 rounded">v1 · DB-backed</span>
            </div>
            <p className="text-[11px] text-amber-400/50 max-w-xl">
              Every card carries a full proof-chain — evidence, adversarial validation, run trace, and audit trail — backed by a real Postgres runtime with workspace constitution governance.
            </p>
          </div>
          <button
            onClick={() => refetch()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/8 border border-amber-500/20 text-amber-400 text-[11px] hover:bg-amber-500/12 transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            Refresh
          </button>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
          {[
            { label: "Total Cards", value: isLoading ? "—" : String(total), icon: <Layers className="w-3.5 h-3.5" />, color: "text-amber-400" },
            { label: "Critical", value: isLoading ? "—" : String(criticalCount), icon: <AlertTriangle className="w-3.5 h-3.5" />, color: "text-red-400" },
            { label: "Ready for Review", value: isLoading ? "—" : String(readyCount), icon: <Target className="w-3.5 h-3.5" />, color: "text-amber-400" },
            { label: "Avg Confidence", value: isLoading ? "—" : `${(avgConfidence * 100).toFixed(0)}%`, icon: <BarChart3 className="w-3.5 h-3.5" />, color: "text-sky-400" },
          ].map(({ label, value, icon, color }) => (
            <div key={label} className="p-3 rounded-lg bg-white/2 border border-amber-500/8">
              <div className={`flex items-center gap-1.5 mb-1 ${color} opacity-70`}>
                {icon}
                <span className="text-[9px] font-medium">{label}</span>
              </div>
              <p className={`text-xl font-bold ${color}`}>{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 px-6 py-3 border-b border-amber-500/8 flex-wrap">
        {DOMAIN_FILTERS.map(f => (
          <button
            key={String(f.value)}
            onClick={() => setDomainFilter(f.value)}
            className={`px-3 py-1.5 rounded-full text-[10px] font-medium transition-colors border ${
              domainFilter === f.value
                ? "bg-amber-500/15 border-amber-500/30 text-amber-300"
                : "bg-transparent border-amber-500/15 text-amber-400/50 hover:text-amber-400/80"
            }`}
          >
            {f.label}
          </button>
        ))}
        <div className="h-3 w-px bg-amber-500/15 mx-1" />
        {STATUS_FILTERS.map(f => (
          <button
            key={String(f.value)}
            onClick={() => setStatusFilter(f.value)}
            className={`px-3 py-1.5 rounded-full text-[10px] font-medium transition-colors border ${
              statusFilter === f.value
                ? "bg-amber-500/15 border-amber-500/30 text-amber-300"
                : "bg-transparent border-amber-500/15 text-amber-400/50 hover:text-amber-400/80"
            }`}
          >
            {f.label}
          </button>
        ))}
        <div className="h-3 w-px bg-amber-500/15 mx-1" />
        {SEVERITY_FILTERS.map(f => (
          <button
            key={String(f.value)}
            onClick={() => setSeverityFilter(f.value)}
            className={`px-3 py-1.5 rounded-full text-[10px] font-medium transition-colors border ${
              severityFilter === f.value
                ? "bg-amber-500/15 border-amber-500/30 text-amber-300"
                : "bg-transparent border-amber-500/15 text-amber-400/50 hover:text-amber-400/80"
            }`}
          >
            {f.label}
          </button>
        ))}
        <div className="h-3 w-px bg-amber-500/15 mx-1" />
        {AUTONOMY_FILTERS.map(f => (
          <button
            key={String(f.value)}
            onClick={() => setAutonomyFilter(f.value)}
            className={`px-3 py-1.5 rounded-full text-[10px] font-medium transition-colors border ${
              autonomyFilter === f.value
                ? "bg-amber-500/15 border-amber-500/30 text-amber-300"
                : "bg-transparent border-amber-500/15 text-amber-400/50 hover:text-amber-400/80"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Card list */}
      <div className="divide-y divide-amber-500/5">
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <RefreshCw className="w-6 h-6 text-amber-400/30 animate-spin" />
          </div>
        )}
        {error && (
          <div className="text-center py-12">
            <XCircle className="w-10 h-10 text-red-400/30 mx-auto mb-3" />
            <p className="text-sm text-red-400/60">Failed to load decision cards</p>
            <p className="text-[10px] text-red-400/40 mt-1">{error.message}</p>
          </div>
        )}
        {!isLoading && !error && cards.length === 0 && (
          <div className="text-center py-16">
            <Shield className="w-10 h-10 text-amber-400/20 mx-auto mb-3" />
            <p className="text-sm text-amber-400/40">No decision cards found</p>
            <p className="text-[10px] text-amber-400/25 mt-1">Try changing the filters or wait for the seed to complete</p>
          </div>
        )}
        {cards.map(card => (
          <CardRow
            key={card.cardId}
            card={card}
            onClick={() => setSelectedCardId(card.cardId === selectedCardId ? null : card.cardId)}
            selected={card.cardId === selectedCardId}
          />
        ))}
      </div>

      {/* Detail drawer */}
      {selectedCardId && (
        <DetailDrawer
          cardId={selectedCardId}
          onClose={() => setSelectedCardId(null)}
        />
      )}
    </div>
  );
}
