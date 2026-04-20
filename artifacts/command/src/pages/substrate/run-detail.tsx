import { useState } from "react";
import { Link, useParams } from "wouter";
import {
  ChevronLeft, CheckCircle2, XCircle, Loader2, Pause, Clock,
  Eye, EyeOff, BookOpen, GitBranch, Shield, AlertTriangle,
  ChevronDown, ChevronRight, Activity, Layers, RotateCcw, Database,
} from "lucide-react";
import { formatAge } from "./layout";
import type { RunStage, EvidenceRef, TraceSpan, RollbackCheckpoint, ApprovalEvent, RetrieverSource, RetrieverSourceMeta } from "./types";
import { useRunDetail } from "./use-substrate";

const ACCENT = "#22d3ee";
const SUB = "/substrate";

const STAGE_ICONS: Record<string, React.ElementType> = {
  signal: Activity, context: Database, recommendation: BookOpen,
  simulation: GitBranch, policy: Shield, execution: Layers,
  proof: CheckCircle2, outcome: Activity, learning: RotateCcw,
};

const RETRIEVER_SOURCE_STYLE: Record<RetrieverSource, { label: string; color: string; bg: string; border: string; tip: string }> = {
  adapter:    { label: "LIVE INDEX",    color: "#34d399", bg: "rgba(16,185,129,0.10)", border: "rgba(16,185,129,0.40)", tip: "Backed by the configured live retriever adapter." },
  synthetic:  { label: "SYNTHETIC",     color: "#fbbf24", bg: "rgba(251,191,36,0.10)", border: "rgba(251,191,36,0.45)", tip: "Demo-only synthetic corpus — not real evidence." },
  inline:     { label: "INLINE CORPUS", color: "#38bdf8", bg: "rgba(56,189,248,0.10)", border: "rgba(56,189,248,0.40)", tip: "Caller supplied an inline corpus instead of querying an index." },
  "dry-run":  { label: "DRY-RUN",       color: "#38bdf8", bg: "rgba(56,189,248,0.10)", border: "rgba(56,189,248,0.40)", tip: "Dry-run — no retrieval was performed." },
};

function RetrievalBadge({ retriever }: { retriever: RetrieverSourceMeta }) {
  const s = RETRIEVER_SOURCE_STYLE[retriever.source];
  return (
    <span
      title={s.tip}
      className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-mono font-bold"
      style={{ color: s.color, background: s.bg, border: `1px solid ${s.border}` }}
    >
      RETRIEVAL · {s.label}
      {retriever.adapterId && (
        <span className="ml-1 opacity-70">· {retriever.adapterId}</span>
      )}
    </span>
  );
}

const STATUS_CONFIG: Record<string, { color: string; icon: React.ElementType }> = {
  completed: { color: "#22c55e", icon: CheckCircle2 },
  running: { color: "#22d3ee", icon: Loader2 },
  failed: { color: "#ef4444", icon: XCircle },
  pending: { color: "rgba(255,255,255,0.2)", icon: Clock },
  skipped: { color: "rgba(255,255,255,0.15)", icon: Clock },
};

function StageTimeline({ stages, selectedStage, onSelect }: { stages: RunStage[]; selectedStage: string | null; onSelect: (id: string) => void }) {
  return (
    <div className="relative">
      {stages.map((stage, i) => {
        const cfg = STATUS_CONFIG[stage.status] || STATUS_CONFIG.pending;
        const Icon = cfg.icon;
        const KindIcon = STAGE_ICONS[stage.kind] || Activity;
        const isSelected = selectedStage === stage.id;
        const isLast = i === stages.length - 1;
        return (
          <div key={stage.id} className="flex gap-3">
            {/* Spine */}
            <div className="flex flex-col items-center">
              <button
                onClick={() => onSelect(stage.id)}
                className="w-7 h-7 rounded-full flex items-center justify-center border-2 flex-shrink-0 transition-all z-10"
                style={{
                  background: isSelected ? cfg.color : `${cfg.color}20`,
                  borderColor: cfg.color,
                  boxShadow: isSelected ? `0 0 12px ${cfg.color}40` : "none",
                }}
              >
                <Icon className={`w-3 h-3 ${stage.status === "running" ? "animate-spin" : ""}`} style={{ color: isSelected ? "#000" : cfg.color }} />
              </button>
              {!isLast && <div className="w-px flex-1 mt-1" style={{ background: "hsla(0,0%,100%,0.08)", minHeight: "24px" }} />}
            </div>
            {/* Content */}
            <div className="pb-4 flex-1 min-w-0">
              <button
                onClick={() => onSelect(stage.id)}
                className="w-full text-left rounded-lg p-3 border transition-all"
                style={{
                  background: isSelected ? `${ACCENT}08` : "hsl(214,12%,8%)",
                  borderColor: isSelected ? `${ACCENT}30` : "hsla(0,0%,100%,0.06)",
                }}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <KindIcon className="w-3.5 h-3.5" style={{ color: cfg.color }} />
                    <span className="text-xs font-medium" style={{ color: "hsl(38,8%,92%)" }}>{stage.name}</span>
                    {stage.redacted && (
                      <span className="flex items-center gap-1 text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: "rgba(239,68,68,0.12)", color: "#ef4444" }}>
                        <EyeOff className="w-2.5 h-2.5" /> REDACTED
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {stage.confidence !== null && (
                      <span className="text-[10px] font-mono" style={{ color: stage.confidence >= 0.85 ? "#22c55e" : stage.confidence >= 0.7 ? "#f59e0b" : "#ef4444" }}>
                        {Math.round(stage.confidence * 100)}%
                      </span>
                    )}
                    {stage.durationMs !== null && (
                      <span className="text-[10px] font-mono" style={{ color: "hsl(214,7%,35%)" }}>{stage.durationMs < 1000 ? `${stage.durationMs}ms` : `${(stage.durationMs / 1000).toFixed(1)}s`}</span>
                    )}
                  </div>
                </div>
                {isSelected && (
                  <div className="mt-2 space-y-2">
                    {(() => {
                      const out = stage.output as { retrieverSource?: string; retrieverAdapterId?: string | null } | null;
                      if (!out || !out.retrieverSource) return null;
                      const src = out.retrieverSource as RetrieverSource;
                      if (!RETRIEVER_SOURCE_STYLE[src]) return null;
                      return <RetrievalBadge retriever={{ source: src, adapterId: out.retrieverAdapterId ?? null }} />;
                    })()}
                    {stage.policyResult && (
                      <div className="rounded p-2 text-[11px]" style={{ background: stage.policyResult.result === "pass" ? "#22c55e10" : "#ef444410", border: `1px solid ${stage.policyResult.result === "pass" ? "#22c55e30" : "#ef444430"}` }}>
                        <p className="font-medium mb-0.5" style={{ color: stage.policyResult.result === "pass" ? "#22c55e" : "#ef4444" }}>
                          Policy: {stage.policyResult.policyName} — {stage.policyResult.result.toUpperCase()}
                        </p>
                        {stage.policyResult.blockedReason && <p style={{ color: "rgba(255,255,255,0.5)" }}>{stage.policyResult.blockedReason}</p>}
                        {stage.policyResult.violatedPolicies.length > 0 && (
                          <p className="mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>Violated: {stage.policyResult.violatedPolicies.join(", ")}</p>
                        )}
                      </div>
                    )}
                    {stage.output && !stage.redacted && (
                      <div className="rounded p-2" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                        <p className="text-[9px] font-mono uppercase tracking-wider mb-1" style={{ color: "hsl(214,7%,35%)" }}>Output</p>
                        <pre className="text-[10px] font-mono whitespace-pre-wrap break-words" style={{ color: "hsl(38,8%,92%)" }}>
                          {JSON.stringify(stage.output, null, 2)}
                        </pre>
                      </div>
                    )}
                    {stage.redacted && (
                      <div className="flex items-center gap-2 text-[11px] p-2 rounded" style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.12)", color: "rgba(255,255,255,0.4)" }}>
                        <EyeOff className="w-3 h-3" />
                        Stage I/O redacted — insufficient approval level for this view
                      </div>
                    )}
                    {stage.evidenceRefs.length > 0 && (
                      <EvidenceDrawer refs={stage.evidenceRefs} />
                    )}
                    {stage.traceSpanId && (
                      <p className="text-[9px] font-mono" style={{ color: "hsl(214,7%,35%)" }}>OTel span: {stage.traceSpanId}</p>
                    )}
                  </div>
                )}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function EvidenceDrawer({ refs }: { refs: EvidenceRef[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button onClick={() => setOpen(v => !v)} className="flex items-center gap-2 text-[11px] transition-colors hover:opacity-80" style={{ color: ACCENT }}>
        <BookOpen className="w-3 h-3" />
        {refs.length} evidence reference{refs.length !== 1 ? "s" : ""}
        {open ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
      </button>
      {open && (
        <div className="mt-2 space-y-2">
          {refs.map(ref => (
            <div key={ref.refId} className="rounded p-2.5 border" style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.08)" }}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-semibold" style={{ color: "hsl(38,8%,92%)" }}>{ref.source}</span>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: `${ACCENT}15`, color: ACCENT }}>{ref.sourceType}</span>
                  <span className="text-[9px] font-mono" style={{ color: ref.relevanceScore >= 0.9 ? "#22c55e" : "#f59e0b" }}>rel {Math.round(ref.relevanceScore * 100)}%</span>
                </div>
              </div>
              <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.6)" }}>{ref.content}</p>
              {ref.citations.length > 0 && (
                <div className="mt-2 space-y-1">
                  {ref.citations.map(cit => (
                    <div key={cit.id} className="flex items-start gap-1.5 text-[10px]" style={{ color: "rgba(255,255,255,0.4)" }}>
                      <span className="mt-0.5 flex-shrink-0" style={{ color: ACCENT }}>›</span>
                      <span>{cit.text}</span>
                      <span className="flex-shrink-0 font-mono" style={{ color: "hsl(214,7%,35%)" }}>[{Math.round(cit.confidence * 100)}%]</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TraceViewer({ spans }: { spans: TraceSpan[] }) {
  if (spans.length === 0) return <p className="text-xs" style={{ color: "hsl(214,7%,35%)" }}>No trace spans captured for this run.</p>;
  const maxDuration = Math.max(...spans.map(s => s.durationMs));
  return (
    <div className="space-y-1">
      {spans.map(span => {
        const pct = Math.min(100, (span.durationMs / Math.max(maxDuration, 1)) * 100);
        return (
          <div key={span.spanId} className="rounded p-2.5 border" style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.06)" }}>
            <div className="flex items-center justify-between mb-1">
              <div>
                <span className="text-[11px] font-mono font-medium" style={{ color: "hsl(38,8%,92%)" }}>{span.operationName}</span>
                <span className="ml-2 text-[9px]" style={{ color: "hsl(214,7%,35%)" }}>{span.service}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono tabular-nums" style={{ color: span.status === "ok" ? "#22c55e" : span.status === "error" ? "#ef4444" : "hsl(214,7%,55%)" }}>
                  {span.durationMs < 1000 ? `${span.durationMs}ms` : `${(span.durationMs / 1000).toFixed(1)}s`}
                </span>
                <span className="text-[9px] font-mono" style={{ color: "hsl(214,7%,35%)" }}>{span.spanId}</span>
              </div>
            </div>
            <div className="w-full h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
              <div className="h-full rounded-full" style={{ width: `${pct}%`, background: span.status === "ok" ? ACCENT : span.status === "error" ? "#ef4444" : "#f59e0b" }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ApprovalHistory({ events }: { events: ApprovalEvent[] }) {
  if (events.length === 0) return <p className="text-xs" style={{ color: "hsl(214,7%,35%)" }}>No approval events recorded for this run.</p>;
  return (
    <div className="space-y-2">
      {events.map(ev => (
        <div key={ev.id} className="rounded p-2.5 border" style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.06)" }}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium" style={{ color: ev.verdict === "approved" ? "#22c55e" : ev.verdict === "rejected" ? "#ef4444" : "#f59e0b" }}>{ev.verdict.toUpperCase()}</span>
            <span className="text-[10px] font-mono" style={{ color: "hsl(214,7%,35%)" }}>{new Date(ev.timestamp).toLocaleTimeString()}</span>
          </div>
          <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.6)" }}>{ev.justification}</p>
          <p className="text-[9px] font-mono mt-1" style={{ color: "hsl(214,7%,35%)" }}>Actor: {ev.actor} · Proof: {ev.proofRef}</p>
        </div>
      ))}
    </div>
  );
}

function Checkpoints({ checkpoints }: { checkpoints: RollbackCheckpoint[] }) {
  if (checkpoints.length === 0) return <p className="text-xs" style={{ color: "hsl(214,7%,35%)" }}>No rollback checkpoints captured.</p>;
  return (
    <div className="space-y-2">
      {checkpoints.map(ck => (
        <div key={ck.id} className="rounded p-2.5 border flex items-start justify-between gap-4" style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.06)" }}>
          <div>
            <p className="text-xs font-medium" style={{ color: "hsl(38,8%,92%)" }}>{ck.description}</p>
            <p className="text-[9px] font-mono mt-0.5" style={{ color: "hsl(214,7%,35%)" }}>hash: {ck.worldStateHash} · stage: {ck.stageId}</p>
            <p className="text-[9px] font-mono" style={{ color: "hsl(214,7%,35%)" }}>{new Date(ck.capturedAt).toLocaleString()}</p>
          </div>
          {ck.restorable ? (
            <button className="flex-shrink-0 text-[10px] px-2.5 py-1 rounded border transition-colors hover:bg-white/5" style={{ borderColor: "hsla(0,0%,100%,0.12)", color: "hsl(38,8%,92%)" }}>
              <RotateCcw className="w-3 h-3 inline mr-1" />Restore
            </button>
          ) : (
            <span className="flex-shrink-0 text-[9px] font-mono" style={{ color: "hsl(214,7%,35%)" }}>archived</span>
          )}
        </div>
      ))}
    </div>
  );
}

type Tab = "timeline" | "trace" | "approvals" | "checkpoints";

export function RunDetail() {
  const params = useParams<{ id: string }>();
  const { run, loading } = useRunDetail(params.id ?? "");
  const [selectedStage, setSelectedStage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("timeline");

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: ACCENT }} />
      </div>
    );
  }

  if (!run) {
    return (
      <div className="p-6">
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <AlertTriangle className="w-8 h-8" style={{ color: "#f59e0b" }} />
          <div className="text-center">
            <p className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.6)" }}>Run not found</p>
            <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.3)" }}>Run ID {params.id} does not exist or has been archived</p>
          </div>
          <Link href={SUB}>
            <a className="text-xs px-3 py-1.5 rounded border transition-colors hover:bg-white/5" style={{ borderColor: "hsla(0,0%,100%,0.12)", color: "hsl(38,8%,92%)" }}>
              ← Back to Trajectory Map
            </a>
          </Link>
        </div>
      </div>
    );
  }

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: "timeline", label: "Stage Timeline", icon: Activity },
    { id: "trace", label: "OTel Trace", icon: GitBranch },
    { id: "approvals", label: "Approval History", icon: Shield },
    { id: "checkpoints", label: "Checkpoints", icon: RotateCcw },
  ];

  return (
    <div className="p-6 max-w-5xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-5 text-xs" style={{ color: "hsl(214,7%,35%)" }}>
        <Link href={SUB}><a className="hover:text-white/60 transition-colors">Trajectory Map</a></Link>
        <ChevronRight className="w-3 h-3" />
        <span style={{ color: "hsl(38,8%,92%)" }}>{run.workflow}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold" style={{ color: "hsl(38,8%,92%)" }}>{run.workflow}</h1>
          <p className="text-xs font-mono mt-0.5" style={{ color: "hsl(214,7%,35%)" }}>{run.id} · {run.tenant}</p>
          {run.retriever && (
            <div className="mt-2"><RetrievalBadge retriever={run.retriever} /></div>
          )}
          <p className="text-sm mt-2 max-w-2xl" style={{ color: "hsl(214,7%,55%)" }}>{run.objectiveText}</p>
        </div>
        <Link href={`${SUB}/counterfactual?runId=${run.id}`}>
          <a className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded border transition-colors hover:bg-white/5" style={{ borderColor: `${ACCENT}40`, color: ACCENT }}>
            <GitBranch className="w-3.5 h-3.5" />
            Counterfactual Replay
          </a>
        </Link>
      </div>

      {/* Meta grid */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: "Status", value: run.status.replace("-", " "), color: run.status === "completed" ? "#22c55e" : run.status === "failed" ? "#ef4444" : run.status === "awaiting-approval" ? "#f59e0b" : ACCENT },
          { label: "Confidence", value: `${Math.round(run.confidence * 100)}%`, color: run.confidence >= 0.85 ? "#22c55e" : run.confidence >= 0.7 ? "#f59e0b" : "#ef4444" },
          { label: "Risk Level", value: run.riskLevel, color: { low: "#22c55e", medium: "#f59e0b", high: "#f97316", critical: "#ef4444" }[run.riskLevel] || ACCENT },
          { label: "Age", value: formatAge(run.ageMs), color: "hsl(38,8%,92%)" },
        ].map(m => (
          <div key={m.label} className="rounded-lg p-3 border" style={{ background: "hsl(214,12%,8%)", borderColor: "hsla(0,0%,100%,0.08)" }}>
            <p className="text-[10px] mb-1" style={{ color: "hsl(214,7%,55%)" }}>{m.label}</p>
            <p className="text-base font-semibold capitalize" style={{ color: m.color }}>{m.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b mb-5" style={{ borderColor: "hsla(0,0%,100%,0.08)" }}>
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-1.5 px-4 py-2.5 text-xs transition-colors border-b-2 -mb-px"
              style={{
                borderColor: activeTab === tab.id ? ACCENT : "transparent",
                color: activeTab === tab.id ? ACCENT : "hsl(214,7%,55%)",
              }}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === "timeline" && (
        <StageTimeline stages={run.stages} selectedStage={selectedStage} onSelect={setSelectedStage} />
      )}
      {activeTab === "trace" && <TraceViewer spans={run.traceSpans} />}
      {activeTab === "approvals" && <ApprovalHistory events={run.approvalHistory} />}
      {activeTab === "checkpoints" && <Checkpoints checkpoints={run.checkpoints} />}
    </div>
  );
}
