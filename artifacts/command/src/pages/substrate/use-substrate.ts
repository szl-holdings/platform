/**
 * use-substrate.ts
 *
 * React hooks and async helpers for the Substrate Command Center.
 * Consumes the @szl/substrate-client SDK as the primary data source.
 *
 * DEMO_MODE (VITE_SUBSTRATE_DEMO_MODE=true):
 *   Mock data from mock-data.ts is used as the initial/fallback state.
 *   Appropriate for demos and preview environments without a running gateway.
 *
 * LIVE MODE (default):
 *   All data comes from the substrate gateway. If the gateway is unreachable,
 *   views render an offline/empty state — no silent mock injection.
 */
import { useMemo, useEffect, useState, useCallback, useRef } from "react";
import { SubstrateClient } from "@szl/substrate-client";
import { connectRunEvents } from "@szl/substrate-client/streaming";
import type {
  PipelineRunSummary,
  ApprovalActionResponse,
  CounterfactualResponse,
  StageResultSummary,
} from "@szl/substrate-client/types";
import type { RunEvent } from "@szl/substrate-client/types";
import {
  MOCK_RUNS,
  MOCK_PENDING_APPROVALS,
  MOCK_COUNTERFACTUAL,
} from "./mock-data";
import type {
  SubstrateRun,
  PendingApproval,
  CounterfactualDiff,
  ApprovalVerdict,
  RunStage,
  Vertical,
  RetrieverSource,
  RetrieverSourceMeta,
} from "./types";

const RETRIEVER_SOURCES: RetrieverSource[] = ["adapter", "synthetic", "inline", "dry-run"];

function extractRetrieverSource(stages: StageResultSummary[]): RetrieverSourceMeta | null {
  const retrieve = stages.find((s) => s.stageType === "Retrieve");
  if (!retrieve || typeof retrieve.output !== "object" || retrieve.output === null) return null;
  const out = retrieve.output as { retrieverSource?: string; retrieverAdapterId?: string | null };
  if (!out.retrieverSource || !RETRIEVER_SOURCES.includes(out.retrieverSource as RetrieverSource)) return null;
  return { source: out.retrieverSource as RetrieverSource, adapterId: out.retrieverAdapterId ?? null };
}

export const GATEWAY_URL =
  (import.meta.env.VITE_SUBSTRATE_GATEWAY_URL as string | undefined) ??
  "http://localhost:3700";

/** When true, mock data is the initial/fallback state. Controlled by VITE_SUBSTRATE_DEMO_MODE=true. */
export const DEMO_MODE =
  (import.meta.env.VITE_SUBSTRATE_DEMO_MODE as string | undefined) === "true";

export type GatewayStatus = "connecting" | "live" | "offline";

// ─── Client ──────────────────────────────────────────────────────────────────

export function useSubstrateClient(): SubstrateClient {
  return useMemo(() => new SubstrateClient({ baseUrl: GATEWAY_URL }), []);
}

// ─── Type mapping ─────────────────────────────────────────────────────────────

const SDK_STATUS_MAP: Record<string, SubstrateRun["status"]> = {
  running: "running",
  completed: "completed",
  failed: "failed",
  "pending-approval": "awaiting-approval",
  "dry-run-complete": "completed",
  cancelled: "failed",
};

function sdkStageToLocal(sr: StageResultSummary): RunStage {
  return {
    id: sr.stageId,
    name: sr.stageType,
    kind: "signal",
    status: sr.status === "completed"
      ? "completed"
      : sr.status === "failed"
      ? "failed"
      : sr.status === "running" || sr.status === "pending-approval"
      ? "running"
      : "pending",
    startedAt: null,
    completedAt: null,
    durationMs: null,
    confidence: sr.confidence ?? null,
    input: null,
    output: (sr.output && typeof sr.output === "object")
      ? (sr.output as Record<string, unknown>)
      : null,
    redacted: false,
    policyResult: null,
    evidenceRefs: [],
    traceSpanId: null,
  };
}

/**
 * Map a PipelineRunSummary to SubstrateRun.
 * Uses `base` (e.g. a mock or cached run) to fill in rich fields the summary
 * doesn't carry (stages detail, vertical, tenant, etc.). When `base` is absent
 * (live data only), populates from metadata + sensible defaults.
 */
export function mapPipelineSummaryToRun(
  summary: PipelineRunSummary,
  base?: SubstrateRun,
): SubstrateRun {
  const meta = summary.metadata as Record<string, unknown>;

  const vertical: Vertical =
    base?.vertical ??
    (typeof meta?.vertical === "string" ? (meta.vertical as Vertical) : "alloy");

  return {
    id: summary.runId,
    workflow: summary.workflowName,
    vertical,
    tenant:
      base?.tenant ??
      (typeof meta?.tenant === "string" ? meta.tenant : "Unknown"),
    status: SDK_STATUS_MAP[summary.status] ?? "running",
    currentStage:
      summary.currentStageId ?? base?.currentStage ?? "—",
    confidence: summary.finalConfidence ?? base?.confidence ?? 0,
    policyStatus: base?.policyStatus ?? "pending",
    riskLevel: base?.riskLevel ?? "medium",
    approver: base?.approver ?? null,
    startedAt: summary.startedAt,
    ageMs: Date.now() - new Date(summary.startedAt).getTime(),
    stages:
      base?.stages ??
      summary.stageResults.map(sdkStageToLocal),
    approvalHistory: base?.approvalHistory ?? [],
    checkpoints: base?.checkpoints ?? [],
    traceSpans: base?.traceSpans ?? [],
    modelAdapter:
      base?.modelAdapter ??
      (typeof meta?.modelAdapter === "string" ? meta.modelAdapter : "gpt-4o"),
    policyProfile:
      base?.policyProfile ??
      (typeof meta?.policyProfile === "string" ? meta.policyProfile : "default"),
    agentId:
      base?.agentId ??
      (typeof meta?.agentId === "string" ? meta.agentId : "substrate"),
    objectiveText:
      base?.objectiveText ??
      (typeof meta?.objective === "string" ? meta.objective : ""),
    retriever:
      extractRetrieverSource(summary.stageResults) ?? base?.retriever ?? null,
  };
}

function mapCounterfactualResponse(
  res: CounterfactualResponse,
  originalRunId: string,
  modelAdapter: string,
  policyProfile: string,
): CounterfactualDiff {
  return {
    runId: res.counterfactualRunId,
    originalRunId,
    modelAdapter,
    policyProfile,
    replayedAt: res.generatedAt,
    stages: (res.diff?.stageDiffs ?? []).map((sd) => ({
      stageName: sd.stageId,
      original: {
        recommendation: sd.stageType,
        confidence: sd.baseline?.confidence ?? 0,
        keyEvidence: [],
        policyResult: sd.baseline?.status === "failed" ? ("fail" as const) : ("pass" as const),
        requiresApproval: false,
      },
      counterfactual: {
        recommendation: sd.stageType,
        confidence: sd.counterfactual?.confidence ?? 0,
        keyEvidence: [],
        policyResult:
          sd.counterfactual?.status === "failed" ? ("fail" as const) : ("pass" as const),
        requiresApproval: sd.decisionChanged,
      },
      changed: sd.differ,
    })),
  };
}

// ─── Streaming ────────────────────────────────────────────────────────────────

export function useRunStream(
  onEvent: (event: RunEvent) => void,
): GatewayStatus {
  const [status, setStatus] = useState<GatewayStatus>("connecting");
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  useEffect(() => {
    let mounted = true;

    const disconnect = connectRunEvents(`${GATEWAY_URL}/mcp/sse`, {
      onEvent: (e) => {
        if (!mounted) return;
        setStatus("live");
        onEventRef.current(e);
      },
      onError: () => {
        if (mounted) setStatus("offline");
      },
      onClose: () => {
        if (mounted) setStatus("offline");
      },
    });

    const connectTimeout = setTimeout(() => {
      if (mounted && status === "connecting") setStatus("offline");
    }, 5_000);

    return () => {
      mounted = false;
      clearTimeout(connectTimeout);
      disconnect();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return status;
}

// ─── Runs ────────────────────────────────────────────────────────────────────

export function useRuns(): {
  runs: SubstrateRun[];
  gatewayStatus: GatewayStatus;
} {
  /**
   * In DEMO_MODE: start with MOCK_RUNS so the UI is populated in environments
   *   without a running gateway (preview, investor demos).
   * In LIVE mode: start with [] — only SDK data populates the list.
   */
  const [runs, setRuns] = useState<SubstrateRun[]>(DEMO_MODE ? MOCK_RUNS : []);
  const client = useSubstrateClient();

  const handleEvent = useCallback(
    (event: RunEvent) => {
      const types = new Set([
        "run_started",
        "stage_complete",
        "run_complete",
        "run_failed",
        "approval_required",
      ] as const);

      if (!types.has(event.type as never)) return;

      const runId =
        event.runId ??
        (typeof (event.data as Record<string, unknown>)?.runId === "string"
          ? (event.data as Record<string, unknown>).runId as string
          : undefined);

      if (!runId) return;

      client
        .getRun(runId)
        .then((summary) => {
          setRuns((prev) => {
            const existingIdx = prev.findIndex((r) => r.id === runId);
            const base = existingIdx >= 0 ? prev[existingIdx] : undefined;
            const updated = mapPipelineSummaryToRun(summary, base);
            if (existingIdx >= 0) {
              const next = [...prev];
              next[existingIdx] = updated;
              return next;
            }
            return [...prev, updated];
          });
        })
        .catch(() => {});
    },
    [client],
  );

  const gatewayStatus = useRunStream(handleEvent);

  /** In DEMO_MODE offline: simulate age increments (replaces the removed setInterval) */
  useEffect(() => {
    if (!DEMO_MODE || gatewayStatus !== "offline") return undefined;
    const tick = setInterval(() => {
      setRuns((prev) =>
        prev.map((r) =>
          r.status === "running" ? { ...r, ageMs: r.ageMs + 5_000 } : r,
        ),
      );
    }, 5_000);
    return () => clearInterval(tick);
  }, [gatewayStatus]);

  return { runs, gatewayStatus };
}

// ─── Run detail ──────────────────────────────────────────────────────────────

export function useRunDetail(runId: string): {
  run: SubstrateRun | undefined;
  loading: boolean;
} {
  /**
   * In DEMO_MODE: seed from mock if available (for rich stage/evidence data).
   * In LIVE mode: start empty and only use SDK response.
   */
  const mockRun = DEMO_MODE ? MOCK_RUNS.find((r) => r.id === runId) : undefined;
  const client = useSubstrateClient();
  const [run, setRun] = useState<SubstrateRun | undefined>(mockRun);
  const [loading, setLoading] = useState(!mockRun);

  useEffect(() => {
    if (!runId) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    client
      .getRun(runId)
      .then((summary) => {
        if (cancelled) return;
        const base = DEMO_MODE
          ? MOCK_RUNS.find((r) => r.id === runId)
          : undefined;
        setRun(mapPipelineSummaryToRun(summary, base));
      })
      .catch(() => {
        if (cancelled) return;
        // In demo mode: fall back to the matching mock (if any).
        // In live mode: render "not found" — no silent mock injection.
        setRun(DEMO_MODE ? mockRun : undefined);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [runId, client]); // eslint-disable-line react-hooks/exhaustive-deps

  return { run, loading };
}

// ─── Pending approvals ────────────────────────────────────────────────────────

export function usePendingApprovals(): {
  approvals: PendingApproval[];
  loading: boolean;
  refresh: () => void;
} {
  const [approvals, setApprovals] = useState<PendingApproval[]>(
    DEMO_MODE ? MOCK_PENDING_APPROVALS : [],
  );
  const [loading, setLoading] = useState(!DEMO_MODE);
  const client = useSubstrateClient();

  const refresh = useCallback(() => {
    setLoading(true);
    client
      .listApprovals()
      .then((res) => {
        if (res.approvals.length === 0) {
          if (DEMO_MODE) setApprovals(MOCK_PENDING_APPROVALS);
          return;
        }
        const mapped: PendingApproval[] = res.approvals.map((entry) => {
          const existing = DEMO_MODE
            ? MOCK_PENDING_APPROVALS.find(
                (m) => m.id === entry.id || m.runId === entry.recommendationId,
              )
            : undefined;
          return (
            existing ?? {
              id: entry.id,
              runId: entry.recommendationId,
              workflow: entry.domain,
              vertical: "alloy" as const,
              tenant: entry.surface,
              riskLevel: "medium" as const,
              policyId: entry.proofRef,
              policyName: "Policy Gate",
              action: "Action pending review",
              requestedAt: new Date(entry.timestamp).toISOString(),
              requestedBy: entry.actor,
              ageMs: Date.now() - entry.timestamp,
              objectiveText: "",
              evidenceSummary: entry.note ?? "",
            }
          );
        });
        setApprovals(mapped);
      })
      .catch(() => {
        if (DEMO_MODE) setApprovals(MOCK_PENDING_APPROVALS);
      })
      .finally(() => setLoading(false));
  }, [client]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { approvals, loading, refresh };
}

// ─── Verdict submission ───────────────────────────────────────────────────────

/**
 * Submit an approval verdict through the substrate gateway.
 *
 * The SDK's `approve()` and `reject()` methods accept a `recommendationId`
 * which corresponds to the run being approved (approval.runId), NOT the
 * approval entry ID (approval.id).
 *
 * Escalation: the SDK has no dedicated `escalate()` method. Escalated decisions
 * are submitted as `reject()` with an "[ESCALATED]" note prefix — this preserves
 * the note in the durable audit trail and the gateway records the action.
 * The local verdict type remains "escalated" for UI accuracy.
 *
 * Returns the gateway's ApprovalActionResponse on success, or null if offline.
 */
export async function submitVerdict(
  client: SubstrateClient,
  approval: PendingApproval,
  verdict: ApprovalVerdict,
  justification: string,
): Promise<ApprovalActionResponse | null> {
  const recommendationId = approval.runId;
  try {
    if (verdict === "approved") {
      return await client.approve({
        recommendationId,
        actor: "command-center",
        note: justification,
        domain: approval.vertical,
      });
    }
    // "rejected" and "escalated" both route through reject().
    // Escalated decisions use a tagged note so the proof record is distinguishable.
    const note =
      verdict === "escalated"
        ? `[ESCALATED] ${justification}`
        : justification;
    return await client.reject({
      recommendationId,
      note,
      actor: verdict === "escalated" ? "command-center-escalate" : "command-center",
      domain: approval.vertical,
    });
  } catch {
    return null;
  }
}

// ─── Counterfactual ───────────────────────────────────────────────────────────

export async function runCounterfactual(
  client: SubstrateClient,
  runId: string,
  workflowId: string,
  modelAdapterId: string | undefined,
  policyId: string | undefined,
): Promise<CounterfactualDiff> {
  try {
    const res = await client.counterfactual({
      runId,
      workflowId,
      modelAdapterId,
      policyId,
    });
    return mapCounterfactualResponse(
      res,
      runId,
      modelAdapterId ?? "default",
      policyId ?? "default",
    );
  } catch {
    return DEMO_MODE
      ? MOCK_COUNTERFACTUAL
      : { runId: "", originalRunId: runId, modelAdapter: modelAdapterId ?? "", policyProfile: policyId ?? "", replayedAt: new Date().toISOString(), stages: [] };
  }
}
