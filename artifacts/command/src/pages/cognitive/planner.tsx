import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Toaster } from "@szl-holdings/shared-ui/ui/sonner";

import { CognitiveLayout } from "./cognitive-layout";
import { useStandardMutation, useStandardQuery } from "@szl-holdings/api-client-react";
import { apiUrl, fetchJson } from "./shared";
type PlanStepStatus = "pending" | "ready" | "running" | "blocked" | "completed" | "failed" | "skipped";
type PlanStatus = "draft" | "ready" | "executing" | "completed" | "failed" | "cancelled";
type RiskLevel = "low" | "medium" | "high" | "critical";

interface RouteDecision {
  modelProvider?: string;
  model?: string;
  routeClass: "reasoning" | "triage" | "extraction" | "planning" | "embedding" | "classification" | "summarization" | "generation";
  toolId?: string;
  toolVersion?: string;
  estimatedCostUsd: number;
  selectedBy: "eval" | "cost" | "priority" | "preferred" | "manual";
  fallbackChain: { provider: string; model: string }[];
}

interface PlanStep {
  stepId: string;
  index: number;
  title: string;
  description: string;
  dependsOn: string[];
  status: PlanStepStatus;
  route: RouteDecision;
  estimatedValue: number;
  estimatedRisk: number;
  riskLevel: RiskLevel;
  requiredEvidence: string[];
  requiredApproval: boolean;
  approvalReason?: string;
  inputs: Record<string, unknown>;
  metadata: Record<string, unknown>;
}

interface PlanGraph {
  planId: string;
  parentPlanId?: string;
  fallbackOf?: string;
  rank: number;
  title: string;
  objective: string;
  status: PlanStatus;
  steps: PlanStep[];
  executionOrder: string[];
  estimatedCostUsd: number;
  estimatedValue: number;
  estimatedRisk: number;
  riskLevel: RiskLevel;
  confidence: number;
  fallbacks: string[];
  context: Record<string, unknown>;
  metadata: Record<string, unknown>;
  createdAt: number;
  updatedAt: number;
}

const ACCENT = "#8b7ac8";

const RISK_COLORS: Record<RiskLevel, string> = {
  low: "#22c55e",
  medium: "#eab308",
  high: "#f59e0b",
  critical: "#ef4444",
};

const STATUS_COLORS: Record<PlanStepStatus, string> = {
  pending: "#64748b",
  ready: "#0ea5e9",
  running: "#22c55e",
  blocked: "#ef4444",
  completed: "#10b981",
  failed: "#ef4444",
  skipped: "#475569",
};

const PLAN_STATUS_COLORS: Record<PlanGraph["status"], string> = {
  draft: "#64748b",
  ready: "#0ea5e9",
  executing: "#22c55e",
  completed: "#10b981",
  failed: "#ef4444",
  cancelled: "#475569",
};

interface PlanListResponse {
  items: PlanGraph[];
  total: number;
}

interface PlanFallbackResponse {
  items: PlanGraph[];
  total: number;
}

interface ReplayResponse {
  plan: PlanGraph;
  steps: Array<{
    stepId: string;
    title: string;
    routeProvider?: string;
    routeModel?: string;
    requiredApproval: boolean;
    riskLevel: RiskLevel;
  }>;
}

function fmtMoney(usd: number): string {
  if (usd <= 0) return "—";
  if (usd < 0.01) return `$${usd.toFixed(4)}`;
  return `$${usd.toFixed(2)}`;
}

function fmtTime(ms: number): string {
  if (!ms) return "";
  const d = new Date(ms);
  return d.toLocaleString();
}

function progressOf(plan: PlanGraph): { done: number; total: number; pct: number } {
  const total = plan.steps.length;
  const done = plan.steps.filter(
    (s) => s.status === "completed" || s.status === "skipped",
  ).length;
  return { done, total, pct: total === 0 ? 0 : done / total };
}

function StepNode({
  step,
  isSelected,
  onClick,
}: {
  step: PlanStep;
  isSelected: boolean;
  onClick: () => void;
}) {
  const risk = RISK_COLORS[step.riskLevel];
  const status = STATUS_COLORS[step.status];
  return (
    <div
      onClick={onClick}
      style={{
        background: isSelected ? `${ACCENT}14` : "rgba(255,255,255,0.03)",
        border: isSelected ? `1px solid ${ACCENT}66` : "1px solid rgba(255,255,255,0.07)",
        borderRadius: 10,
        padding: "12px 14px",
        cursor: "pointer",
        display: "grid",
        gridTemplateColumns: "auto 1fr auto",
        gap: 12,
        alignItems: "center",
      }}
    >
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: 8,
          background: `${risk}18`,
          color: risk,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 700,
          fontSize: 11,
        }}
      >
        {step.index + 1}
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: "#e2e8f0" }}>{step.title}</span>
          {step.requiredApproval && (
            <span
              style={{
                fontSize: 9,
                fontWeight: 700,
                color: "#f59e0b",
                background: "#f59e0b18",
                padding: "1px 6px",
                borderRadius: 3,
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              Approval gated
            </span>
          )}
        </div>
        <div style={{ fontSize: 11, color: "#64748b" }}>
          {step.route.modelProvider ?? "—"}
          {step.route.model ? ` · ${step.route.model}` : ""}
          {step.route.toolId ? ` · ${step.route.toolId}` : ""}
          {step.dependsOn.length > 0 && ` · depends on ${step.dependsOn.length}`}
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: status, textTransform: "uppercase", letterSpacing: 0.5 }}>
          {step.status}
        </span>
        <span style={{ fontSize: 10, color: risk, fontWeight: 600 }}>risk: {step.riskLevel}</span>
      </div>
    </div>
  );
}

function PlanSummaryCard({ plan, dim }: { plan: PlanGraph; dim?: boolean }) {
  const prog = progressOf(plan);
  const gated = plan.steps.filter((s) => s.requiredApproval).length;
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 10,
        padding: 14,
        opacity: dim ? 0.85 : 1,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
        <span
          style={{
            fontSize: 9,
            fontWeight: 700,
            color: PLAN_STATUS_COLORS[plan.status],
            background: `${PLAN_STATUS_COLORS[plan.status]}18`,
            padding: "1px 6px",
            borderRadius: 3,
            textTransform: "uppercase",
            letterSpacing: 0.5,
          }}
        >
          {plan.status}
        </span>
        <span
          style={{
            fontSize: 9,
            fontWeight: 700,
            color: RISK_COLORS[plan.riskLevel],
            background: `${RISK_COLORS[plan.riskLevel]}18`,
            padding: "1px 6px",
            borderRadius: 3,
            textTransform: "uppercase",
            letterSpacing: 0.5,
          }}
        >
          risk: {plan.riskLevel}
        </span>
      </div>
      <div style={{ fontSize: 12, fontWeight: 600, color: "#e2e8f0", marginBottom: 6, lineHeight: 1.3 }}>
        {plan.title}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, fontSize: 10, color: "#64748b" }}>
        <div>
          <div style={{ color: "#94a3b8", fontWeight: 600 }}>{prog.done}/{prog.total}</div>
          <div>steps</div>
        </div>
        <div>
          <div style={{ color: "#94a3b8", fontWeight: 600 }}>{fmtMoney(plan.estimatedCostUsd)}</div>
          <div>est. cost</div>
        </div>
        <div>
          <div style={{ color: gated ? "#f59e0b" : "#94a3b8", fontWeight: 600 }}>{gated}</div>
          <div>gated</div>
        </div>
      </div>
    </div>
  );
}

function FallbackCompare({ plan, fallback }: { plan: PlanGraph; fallback: PlanGraph }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
      {[plan, fallback].map((p, idx) => (
        <div
          key={p.planId}
          style={{
            background: idx === 0 ? "rgba(139,122,200,0.05)" : "rgba(245,158,11,0.05)",
            border: `1px solid ${idx === 0 ? `${ACCENT}30` : "#f59e0b30"}`,
            borderRadius: 10,
            padding: 14,
          }}
        >
          <div
            style={{
              fontSize: 9,
              fontWeight: 700,
              color: idx === 0 ? ACCENT : "#f59e0b",
              textTransform: "uppercase",
              letterSpacing: 0.5,
              marginBottom: 6,
            }}
          >
            {idx === 0 ? "Primary" : `Fallback (rank ${fallback.rank})`}
          </div>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#e2e8f0", marginBottom: 8 }}>{p.title}</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, fontSize: 10, color: "#64748b", marginBottom: 10 }}>
            <div><span style={{ color: "#94a3b8" }}>{p.steps.length}</span> steps</div>
            <div><span style={{ color: "#94a3b8" }}>{fmtMoney(p.estimatedCostUsd)}</span> cost</div>
            <div><span style={{ color: RISK_COLORS[p.riskLevel] }}>{p.riskLevel}</span> risk</div>
            <div><span style={{ color: "#94a3b8" }}>{(p.confidence * 100).toFixed(0)}%</span> confidence</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {p.steps.slice(0, 8).map((s) => (
              <div key={s.stepId} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11 }}>
                <span
                  style={{
                    width: 4,
                    height: 4,
                    borderRadius: 2,
                    background: RISK_COLORS[s.riskLevel],
                    flexShrink: 0,
                  }}
                />
                <span style={{ color: "#94a3b8", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.title}</span>
                {s.requiredApproval && <span style={{ fontSize: 9, color: "#f59e0b" }}>gated</span>}
              </div>
            ))}
            {p.steps.length > 8 && (
              <div style={{ fontSize: 10, color: "#475569" }}>+{p.steps.length - 8} more steps</div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

interface ApprovalDecision {
  decision: "approved" | "denied";
  actorId?: number | string | null;
  actorRole?: string | null;
  note?: string;
  at: number;
}

function StepDetailPanel({
  plan,
  step,
  onClose,
  onApprove,
  onDeny,
  pending,
  decisionError,
}: {
  plan: PlanGraph;
  step: PlanStep;
  onClose: () => void;
  onApprove: (note: string) => void;
  onDeny: (note: string) => void;
  pending: boolean;
  decisionError: string | null;
}) {
  const [note, setNote] = useState("");
  const decisionsRecord = (plan.metadata["stepDecisions"] as Record<string, ApprovalDecision> | undefined) ?? {};
  const auditFromMetadata = (step.metadata["approvalDecision"] as ApprovalDecision | undefined) ?? undefined;
  const audit = auditFromMetadata ?? decisionsRecord[step.stepId];
  const dependsOn = step.dependsOn
    .map((id) => plan.steps.find((s) => s.stepId === id)?.title ?? id)
    .join(", ");

  return (
    <div
      style={{
        background: "rgba(255,255,255,0.02)",
        border: `1px solid ${ACCENT}30`,
        borderRadius: 12,
        padding: 18,
        alignSelf: "flex-start",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: 1 }}>
          Step Detail
        </div>
        <button
          onClick={onClose}
          style={{ background: "none", border: "none", color: "#475569", cursor: "pointer", fontSize: 16 }}
          aria-label="Close step detail"
        >
          ✕
        </button>
      </div>
      <div style={{ fontSize: 14, fontWeight: 700, color: "#e2e8f0", marginBottom: 4 }}>{step.title}</div>
      {step.description && (
        <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.5, marginBottom: 14 }}>{step.description}</div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
        {[
          { label: "Status", value: step.status, color: STATUS_COLORS[step.status] },
          { label: "Risk", value: step.riskLevel, color: RISK_COLORS[step.riskLevel] },
          { label: "Risk score", value: step.estimatedRisk.toFixed(2), color: undefined },
          { label: "Value", value: step.estimatedValue.toFixed(2), color: "#0ea5e9" },
          { label: "Route class", value: step.route.routeClass, color: "#8b7ac8" },
          { label: "Provider", value: step.route.modelProvider ?? "—", color: undefined },
          { label: "Model", value: step.route.model ?? "—", color: undefined },
          { label: "Tool", value: step.route.toolId ?? "—", color: undefined },
          { label: "Est. cost", value: fmtMoney(step.route.estimatedCostUsd), color: undefined },
          { label: "Depends on", value: dependsOn || "None", color: undefined },
          { label: "Selected by", value: step.route.selectedBy, color: undefined },
        ].map((row) => (
          <div key={row.label} style={{ display: "flex", justifyContent: "space-between", fontSize: 11, gap: 8 }}>
            <span style={{ color: "#475569" }}>{row.label}</span>
            <span
              style={{
                color: row.color ?? "#94a3b8",
                fontWeight: row.color ? 600 : 400,
                textAlign: "right",
                wordBreak: "break-word",
              }}
            >
              {row.value}
            </span>
          </div>
        ))}
      </div>

      {step.route.fallbackChain.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 9, color: "#475569", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>
            Route fallbacks
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {step.route.fallbackChain.map((fc, i) => (
              <div key={i} style={{ fontSize: 11, color: "#94a3b8" }}>
                {i + 1}. {fc.provider} · {fc.model}
              </div>
            ))}
          </div>
        </div>
      )}

      {step.requiredEvidence.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 9, color: "#475569", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>
            Required evidence
          </div>
          {step.requiredEvidence.map((e) => (
            <div key={e} style={{ fontSize: 11, color: "#94a3b8" }}>• {e}</div>
          ))}
        </div>
      )}

      <div
        style={{
          padding: "12px 14px",
          background: step.requiredApproval ? "rgba(245,158,11,0.08)" : "rgba(255,255,255,0.03)",
          border: step.requiredApproval ? "1px solid #f59e0b40" : "1px solid rgba(255,255,255,0.06)",
          borderRadius: 8,
          marginBottom: 12,
        }}
      >
        <div style={{ fontSize: 9, color: "#475569", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>
          Approval
        </div>
        {audit ? (
          <div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: audit.decision === "approved" ? "#22c55e" : "#ef4444",
                marginBottom: 4,
              }}
            >
              {audit.decision === "approved" ? "✓ Approved" : "✕ Rejected"}
            </div>
            <div style={{ fontSize: 10, color: "#64748b" }}>
              by {audit.actorId ?? "operator"}{audit.actorRole ? ` · ${audit.actorRole}` : ""} · {fmtTime(audit.at)}
            </div>
            {audit.note && (
              <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 6, fontStyle: "italic" }}>
                "{audit.note}"
              </div>
            )}
          </div>
        ) : step.requiredApproval ? (
          <>
            <div style={{ fontSize: 11, color: "#f59e0b", marginBottom: 8 }}>
              ⏳ Awaiting operator decision{step.approvalReason ? ` — ${step.approvalReason}` : ""}
            </div>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Optional note for the audit log…"
              rows={2}
              style={{
                width: "100%",
                background: "rgba(0,0,0,0.3)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 6,
                color: "#e2e8f0",
                padding: 8,
                fontSize: 11,
                resize: "vertical",
                marginBottom: 8,
                fontFamily: "inherit",
              }}
            />
            <div style={{ display: "flex", gap: 6 }}>
              <button
                onClick={() => onApprove(note)}
                disabled={pending}
                style={{
                  flex: 1,
                  background: "#22c55e",
                  color: "#fff",
                  border: "none",
                  borderRadius: 6,
                  padding: "8px 0",
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: pending ? "wait" : "pointer",
                  opacity: pending ? 0.6 : 1,
                }}
              >
                {pending ? "Saving…" : "Approve"}
              </button>
              <button
                onClick={() => onDeny(note)}
                disabled={pending}
                style={{
                  flex: 1,
                  background: "rgba(239,68,68,0.1)",
                  color: "#ef4444",
                  border: "1px solid rgba(239,68,68,0.4)",
                  borderRadius: 6,
                  padding: "8px 0",
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: pending ? "wait" : "pointer",
                  opacity: pending ? 0.6 : 1,
                }}
              >
                Reject
              </button>
            </div>
            {decisionError && (
              <div style={{ fontSize: 10, color: "#ef4444", marginTop: 6 }}>{decisionError}</div>
            )}
          </>
        ) : (
          <div style={{ fontSize: 11, color: "#64748b" }}>No approval required for this step.</div>
        )}
      </div>
    </div>
  );
}

export default function PlannerStudio() {
  const plansQuery = useStandardQuery<PlanListResponse>({
    queryKey: ["planner-studio", "plans"],
    queryFn: () => fetchJson<PlanListResponse>(apiUrl("/plans?limit=50")),
    retry: 0,
    staleTime: 15_000,
  });

  const plans = useMemo(() => plansQuery.data?.items ?? [], [plansQuery.data]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  const [selectedFallbackId, setSelectedFallbackId] = useState<string | null>(null);
  const [view, setView] = useState<"graph" | "fallbacks" | "replay">("graph");
  const [decisionError, setDecisionError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedId && plans.length > 0) {
      setSelectedId(plans[0]!.planId);
    } else if (selectedId && plans.length > 0 && !plans.find((p) => p.planId === selectedId)) {
      setSelectedId(plans[0]!.planId);
      setSelectedStepId(null);
    }
  }, [plans, selectedId]);

  const planQuery = useStandardQuery<PlanGraph>({
    queryKey: ["planner-studio", "plan", selectedId],
    queryFn: () => fetchJson<PlanGraph>(apiUrl(`/plans/${selectedId}`)),
    enabled: !!selectedId,
    staleTime: 5_000,
  });

  const fallbacksQuery = useStandardQuery<PlanFallbackResponse>({
    queryKey: ["planner-studio", "fallbacks", selectedId],
    queryFn: () => fetchJson<PlanFallbackResponse>(apiUrl(`/plans/${selectedId}/fallbacks`)),
    enabled: !!selectedId,
    staleTime: 30_000,
  });

  const selectedPlan = planQuery.data ?? plans.find((p) => p.planId === selectedId) ?? null;
  const fallbacks = fallbacksQuery.data?.items ?? [];

  useEffect(() => {
    if (fallbacks.length > 0 && !selectedFallbackId) {
      setSelectedFallbackId(fallbacks[0]!.planId);
    }
    if (fallbacks.length === 0) {
      setSelectedFallbackId(null);
    }
  }, [fallbacks, selectedFallbackId]);

  const selectedStep = useMemo(() => {
    if (!selectedPlan || !selectedStepId) return null;
    return selectedPlan.steps.find((s) => s.stepId === selectedStepId) ?? null;
  }, [selectedPlan, selectedStepId]);

  const replayMutation = useStandardMutation<ReplayResponse, Error, string>({
    mutationFn: (planId: string) =>
      fetchJson<ReplayResponse>(apiUrl(`/plans/${planId}/replay`), {
        method: "POST",
        body: JSON.stringify({}),
      }),
    onSuccess: () => setView("replay"),
  });

  // Replay output is per-plan; clear stale results whenever the selected plan changes.
  useEffect(() => {
    replayMutation.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  const replayedPlanId = (replayMutation.data?.plan?.planId ?? null) as string | null;
  const replayMatchesSelection = replayedPlanId === selectedId;

  const decisionMutation = useStandardMutation<
    PlanGraph,
    Error,
    { stepId: string; decision: "approve" | "reject"; note: string }
  >({
    mutationFn: ({ stepId, decision, note }) =>
      fetchJson<PlanGraph>(apiUrl(`/plans/${selectedId}/steps/${stepId}/${decision}`), {
        method: "POST",
        body: JSON.stringify({ note }),
      }),
    onSuccess: (_data, variables) => {
      setDecisionError(null);
      planQuery.refetch();
      plansQuery.refetch();
      toast.success(
        variables.decision === "approve"
          ? "Step approved"
          : "Step rejected",
      );
    },
    onError: (err, variables) => {
      setDecisionError(err.message);
      toast.error(
        `Could not ${variables.decision} step`,
        { description: err.message },
      );
    },
  });

  const selectedFallback = fallbacks.find((f) => f.planId === selectedFallbackId) ?? null;

  return (
    <CognitiveLayout
      title="Planner Studio"
      subtitle="Inspect plan graphs, compare fallback alternatives, and approve high-risk steps before execution."
    >
      <Toaster richColors closeButton position="bottom-right" />
      {plansQuery.isLoading && (
        <div style={{ padding: 40, color: "#64748b", fontSize: 13 }}>Loading plans…</div>
      )}

      {!plansQuery.isLoading && plansQuery.isError && (
        <div
          style={{
            padding: 24,
            border: "1px solid #ef444433",
            background: "#ef444408",
            borderRadius: 10,
            color: "#ef4444",
            fontSize: 12,
          }}
        >
          Could not load plans: {(plansQuery.error as Error).message}
        </div>
      )}

      {!plansQuery.isLoading && !plansQuery.isError && plans.length === 0 && (
        <div
          style={{
            padding: 32,
            border: `1px dashed ${ACCENT}40`,
            background: `${ACCENT}06`,
            borderRadius: 10,
            color: "#94a3b8",
            fontSize: 13,
            lineHeight: 1.6,
          }}
        >
          <div style={{ fontWeight: 600, color: "#e2e8f0", marginBottom: 6 }}>No plans yet</div>
          When the planner generates a plan graph for an agent run or a manual objective, it
          will appear here for review and approval. Plans created through the Run Console or
          via <code>POST /api/plans</code> show up immediately.
        </div>
      )}

      {plans.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 20 }}>
          <div>
            <div
              style={{
                fontSize: 10,
                color: "#475569",
                textTransform: "uppercase",
                letterSpacing: 0.5,
                fontWeight: 600,
                marginBottom: 10,
              }}
            >
              Recent Plans ({plans.length})
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {plans.map((plan) => (
                <div
                  key={plan.planId}
                  onClick={() => {
                    setSelectedId(plan.planId);
                    setSelectedStepId(null);
                    setSelectedFallbackId(null);
                    setView("graph");
                    setDecisionError(null);
                  }}
                  style={{ cursor: "pointer" }}
                >
                  <div
                    style={{
                      outline:
                        plan.planId === selectedId ? `1px solid ${ACCENT}66` : "1px solid transparent",
                      borderRadius: 10,
                    }}
                  >
                    <PlanSummaryCard plan={plan} dim={plan.planId !== selectedId} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            {selectedPlan ? (
              <>
                <div
                  style={{
                    background: "rgba(255,255,255,0.02)",
                    border: `1px solid ${ACCENT}25`,
                    borderRadius: 12,
                    padding: 20,
                    marginBottom: 16,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      justifyContent: "space-between",
                      gap: 16,
                      marginBottom: 16,
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 16, fontWeight: 700, color: "#e2e8f0", marginBottom: 4 }}>
                        {selectedPlan.title}
                      </div>
                      <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.5 }}>
                        {selectedPlan.objective}
                      </div>
                      <div style={{ fontSize: 10, color: "#475569", marginTop: 6, fontFamily: "monospace" }}>
                        {selectedPlan.planId} · created {fmtTime(selectedPlan.createdAt)}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                      {(["graph", "fallbacks", "replay"] as const).map((v) => {
                        const disabled = v === "fallbacks" && fallbacks.length === 0;
                        return (
                          <button
                            key={v}
                            onClick={() => {
                              if (disabled) return;
                              if (
                                v === "replay" &&
                                selectedId &&
                                (!replayMatchesSelection || replayMutation.isError)
                              ) {
                                replayMutation.mutate(selectedId);
                              }
                              setView(v);
                            }}
                            disabled={disabled}
                            style={{
                              background: view === v ? ACCENT : "rgba(255,255,255,0.05)",
                              color: view === v ? "#fff" : disabled ? "#334155" : "#94a3b8",
                              border: "none",
                              borderRadius: 6,
                              padding: "6px 12px",
                              fontSize: 11,
                              fontWeight: 600,
                              cursor: disabled ? "not-allowed" : "pointer",
                              textTransform: "capitalize",
                            }}
                          >
                            {v === "fallbacks" ? `Fallbacks (${fallbacks.length})` : v}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10, marginBottom: 12 }}>
                    {[
                      {
                        label: "Steps",
                        value: `${progressOf(selectedPlan).done}/${progressOf(selectedPlan).total}`,
                        color: ACCENT,
                      },
                      {
                        label: "Risk",
                        value: selectedPlan.riskLevel,
                        color: RISK_COLORS[selectedPlan.riskLevel],
                      },
                      {
                        label: "Confidence",
                        value: `${(selectedPlan.confidence * 100).toFixed(0)}%`,
                        color: "#0ea5e9",
                      },
                      {
                        label: "Est. Cost",
                        value: fmtMoney(selectedPlan.estimatedCostUsd),
                        color: "#22c55e",
                      },
                      {
                        label: "Approvals",
                        value: String(selectedPlan.steps.filter((s) => s.requiredApproval).length),
                        color: "#f59e0b",
                      },
                    ].map((m) => (
                      <div
                        key={m.label}
                        style={{
                          background: "rgba(255,255,255,0.03)",
                          borderRadius: 7,
                          padding: "10px 12px",
                        }}
                      >
                        <div
                          style={{
                            fontSize: 14,
                            fontWeight: 700,
                            color: m.color,
                            textTransform: "capitalize",
                          }}
                        >
                          {m.value}
                        </div>
                        <div style={{ fontSize: 10, color: "#475569" }}>{m.label}</div>
                      </div>
                    ))}
                  </div>

                  <div style={{ height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" }}>
                    <div
                      style={{
                        width: `${progressOf(selectedPlan).pct * 100}%`,
                        height: "100%",
                        background: `linear-gradient(90deg, ${ACCENT}, #22c55e)`,
                        borderRadius: 2,
                        transition: "width 0.5s",
                      }}
                    />
                  </div>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: selectedStep && view === "graph" ? "1fr 360px" : "1fr",
                    gap: 16,
                  }}
                >
                  <div>
                    {view === "graph" && (
                      <div>
                        <div
                          style={{
                            fontSize: 10,
                            color: "#475569",
                            textTransform: "uppercase",
                            letterSpacing: 0.5,
                            fontWeight: 600,
                            marginBottom: 8,
                          }}
                        >
                          Plan Graph · {selectedPlan.steps.length} steps
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                          {selectedPlan.executionOrder
                            .map((id) => selectedPlan.steps.find((s) => s.stepId === id))
                            .filter((s): s is PlanStep => Boolean(s))
                            .map((step) => (
                              <StepNode
                                key={step.stepId}
                                step={step}
                                isSelected={selectedStepId === step.stepId}
                                onClick={() => {
                                  setSelectedStepId(
                                    selectedStepId === step.stepId ? null : step.stepId,
                                  );
                                  setDecisionError(null);
                                }}
                              />
                            ))}
                        </div>
                      </div>
                    )}

                    {view === "fallbacks" && (
                      <div>
                        <div
                          style={{
                            fontSize: 10,
                            color: "#475569",
                            textTransform: "uppercase",
                            letterSpacing: 0.5,
                            fontWeight: 600,
                            marginBottom: 8,
                          }}
                        >
                          Compare with fallback
                        </div>
                        {fallbacksQuery.isLoading && (
                          <div style={{ color: "#64748b", fontSize: 12, padding: 16 }}>Loading fallbacks…</div>
                        )}
                        {fallbacks.length > 0 && (
                          <>
                            <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
                              {fallbacks.map((fb) => (
                                <button
                                  key={fb.planId}
                                  onClick={() => setSelectedFallbackId(fb.planId)}
                                  style={{
                                    background:
                                      selectedFallbackId === fb.planId
                                        ? "#f59e0b"
                                        : "rgba(255,255,255,0.05)",
                                    color:
                                      selectedFallbackId === fb.planId ? "#0f172a" : "#94a3b8",
                                    border: "none",
                                    borderRadius: 6,
                                    padding: "5px 10px",
                                    fontSize: 11,
                                    fontWeight: 600,
                                    cursor: "pointer",
                                  }}
                                >
                                  Fallback {fb.rank} · {fb.steps.length} steps
                                </button>
                              ))}
                            </div>
                            {selectedFallback && (
                              <FallbackCompare plan={selectedPlan} fallback={selectedFallback} />
                            )}
                          </>
                        )}
                      </div>
                    )}

                    {view === "replay" && (
                      <div>
                        <div
                          style={{
                            fontSize: 10,
                            color: "#475569",
                            textTransform: "uppercase",
                            letterSpacing: 0.5,
                            fontWeight: 600,
                            marginBottom: 8,
                          }}
                        >
                          Plan Replay
                        </div>
                        {replayMutation.isPending && (
                          <div style={{ color: "#64748b", fontSize: 12, padding: 16 }}>Replaying…</div>
                        )}
                        {replayMutation.isError && (
                          <div style={{ color: "#ef4444", fontSize: 12, padding: 16 }}>
                            Replay failed: {(replayMutation.error as Error).message}
                          </div>
                        )}
                        {replayMutation.data && replayMatchesSelection && (
                          <div
                            style={{
                              background: "rgba(139,122,200,0.05)",
                              border: `1px solid ${ACCENT}30`,
                              borderRadius: 10,
                              padding: 16,
                            }}
                          >
                            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                              {replayMutation.data.steps.map((s, i) => (
                                <div
                                  key={s.stepId}
                                  style={{
                                    display: "grid",
                                    gridTemplateColumns: "24px 1fr auto auto",
                                    gap: 10,
                                    alignItems: "center",
                                    fontSize: 11,
                                    padding: "6px 4px",
                                    borderBottom: "1px solid rgba(255,255,255,0.04)",
                                  }}
                                >
                                  <span style={{ color: "#475569", textAlign: "right", fontWeight: 600 }}>
                                    {i + 1}
                                  </span>
                                  <span style={{ color: "#e2e8f0" }}>{s.title}</span>
                                  <span style={{ color: "#64748b" }}>
                                    {s.routeProvider ?? "—"}
                                    {s.routeModel ? ` · ${s.routeModel}` : ""}
                                  </span>
                                  <span
                                    style={{
                                      fontSize: 9,
                                      color: s.requiredApproval ? "#f59e0b" : RISK_COLORS[s.riskLevel],
                                      fontWeight: 700,
                                      textTransform: "uppercase",
                                      letterSpacing: 0.5,
                                    }}
                                  >
                                    {s.requiredApproval ? "approval" : s.riskLevel}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {selectedStep && view === "graph" && (
                    <StepDetailPanel
                      plan={selectedPlan}
                      step={selectedStep}
                      onClose={() => setSelectedStepId(null)}
                      onApprove={(note) =>
                        decisionMutation.mutate({
                          stepId: selectedStep.stepId,
                          decision: "approve",
                          note,
                        })
                      }
                      onDeny={(note) =>
                        decisionMutation.mutate({
                          stepId: selectedStep.stepId,
                          decision: "reject",
                          note,
                        })
                      }
                      pending={decisionMutation.isPending}
                      decisionError={decisionError}
                    />
                  )}
                </div>
              </>
            ) : (
              <div style={{ color: "#64748b", fontSize: 12, padding: 32 }}>Loading plan…</div>
            )}
          </div>
        </div>
      )}
    </CognitiveLayout>
  );
}
