/**
 * SZL Holdings — Approval Workflow Activities
 * Phase 10 (Operability & Governance)
 *
 * Activities are the units of work in Temporal. Each activity is a function
 * that performs a single, retryable action. Activities are called by workflows
 * and can interact with external systems (database, Slack, email, OPA).
 */

import type { ApprovalRecord, LyteVisibilityEvent } from "../types/workflow-types.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface EvaluatePolicyInput {
  policyPackage: string;      // e.g. "szl.approval"
  inputData: Record<string, unknown>;
}

export interface EvaluatePolicyResult {
  allowed: boolean;
  denialMessages: string[];
  warnMessages: string[];
  evaluationId: string;
}

export interface RequestApprovalInput {
  approvalRequestId: string;
  operationType: string;
  targetService: string;
  targetEnvironment: string;
  targetVersion: string;
  requestedApproverGroups: string[];
  requiredCount: number;
  context: Record<string, unknown>;
  notificationChannels: string[];   // Slack channel IDs, email lists
}

export interface RecordEvidenceInput {
  category: string;
  actorId: string;
  actorType: string;
  action: string;
  outcome: string;
  service: string;
  environment: string;
  details: Record<string, unknown>;
}

export interface EmitLyteVisibilityInput {
  event: LyteVisibilityEvent;
}

// ---------------------------------------------------------------------------
// Activity implementations
// These are registered with the Temporal worker via registerActivities().
// Each function must be exported and can be independently retried by Temporal.
// ---------------------------------------------------------------------------

export async function evaluatePolicyActivity(
  input: EvaluatePolicyInput
): Promise<EvaluatePolicyResult> {
  /**
   * Calls the OPA bundle REST API to evaluate a policy.
   * OPA runs as a sidecar or standalone service.
   * URL: http://opa-service:8181/v1/data/{policy-path}
   */
  const opaUrl = process.env.OPA_SERVICE_URL ?? "http://localhost:8181";
  const packagePath = input.policyPackage.replace(/\./g, "/");
  const url = `${opaUrl}/v1/data/${packagePath}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ input: input.inputData }),
  });

  if (!response.ok) {
    throw new Error(`OPA evaluation failed: ${response.status} ${response.statusText}`);
  }

  const body = await response.json() as {
    result: { allow?: boolean; deny?: string[]; warn?: string[] };
  };

  const result = body.result;
  const evaluationId = crypto.randomUUID();

  return {
    allowed: result.allow === true,
    denialMessages: result.deny ?? [],
    warnMessages: result.warn ?? [],
    evaluationId,
  };
}

export async function requestApprovalActivity(
  input: RequestApprovalInput
): Promise<{ approvalRequestId: string; notificationsSent: number }> {
  /**
   * Creates an approval request record in the database and sends notifications.
   * In production: calls api-server POST /api/approvals endpoint.
   * Returns immediately after notification is sent — approval decision arrives
   * via the Temporal signal handler in the workflow.
   */
  const apiUrl = process.env.API_SERVER_URL ?? "http://localhost:5000";

  const response = await fetch(`${apiUrl}/api/internal/approvals`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Internal-Token": process.env.INTERNAL_SERVICE_TOKEN ?? "",
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error(`Failed to create approval request: ${response.status}`);
  }

  const body = await response.json() as { approvalRequestId: string; notificationsSent: number };
  return body;
}

export async function recordEvidenceActivity(
  input: RecordEvidenceInput
): Promise<{ evidenceId: string }> {
  /**
   * Records an audit event in the evidence ledger (lib/evidence-ledger).
   * All consequential workflow actions must emit evidence.
   */
  const apiUrl = process.env.API_SERVER_URL ?? "http://localhost:5000";

  const response = await fetch(`${apiUrl}/api/internal/evidence`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Internal-Token": process.env.INTERNAL_SERVICE_TOKEN ?? "",
    },
    body: JSON.stringify({
      category: input.category,
      actorId: input.actorId,
      actorType: input.actorType,
      action: input.action,
      outcome: input.outcome,
      service: input.service,
      environment: input.environment,
      details: input.details,
      timestamp: new Date().toISOString(),
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to record evidence: ${response.status}`);
  }

  const body = await response.json() as { evidenceId: string };
  return body;
}

export async function emitLyteVisibilityActivity(
  input: EmitLyteVisibilityInput
): Promise<void> {
  /**
   * Emits a visibility event to the Lyte operator surface.
   * Non-critical: failures are logged but do not fail the workflow.
   */
  const apiUrl = process.env.API_SERVER_URL ?? "http://localhost:5000";

  try {
    await fetch(`${apiUrl}/api/internal/lyte/events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Internal-Token": process.env.INTERNAL_SERVICE_TOKEN ?? "",
      },
      body: JSON.stringify(input.event),
    });
  } catch {
    // Non-critical: visibility emission failure should not fail the workflow
    console.warn("[emitLyteVisibility] Failed to emit visibility event:", input.event.eventType);
  }
}

export async function deployServiceActivity(input: {
  service: string;
  environment: string;
  imageTag: string;
  gitCommitSha: string;
  approvalTraceId: string;
}): Promise<{ deployedAt: string; deploymentId: string }> {
  /**
   * Triggers a deployment via the GitOps pipeline (Argo CD sync).
   * In production: calls the Argo CD API to sync the application.
   */
  const argoUrl = process.env.ARGO_CD_API_URL ?? "http://localhost:8080";

  const response = await fetch(
    `${argoUrl}/api/v1/applications/${input.service}-${input.environment}/sync`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.ARGO_CD_TOKEN ?? ""}`,
      },
      body: JSON.stringify({
        revision: input.gitCommitSha,
        dryRun: false,
        prune: false,
        strategy: { hook: { force: false } },
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Argo CD sync failed for ${input.service}-${input.environment}: ${response.status}`);
  }

  return {
    deployedAt: new Date().toISOString(),
    deploymentId: crypto.randomUUID(),
  };
}

export async function scaleServiceActivity(input: {
  service: string;
  environment: string;
  targetReplicas: number;
  reason: string;
  approvalTraceId: string;
}): Promise<{ scaledAt: string; previousReplicas: number; targetReplicas: number }> {
  /**
   * Scales a service to a target replica count via Argo CD parameter override.
   * Used by the remediation workflow's scale-down strategy to isolate degraded services.
   * targetReplicas=0 is a full scale-to-zero (effectively taking the service offline).
   */
  const argoUrl = process.env.ARGO_CD_API_URL ?? "http://localhost:8080";

  const response = await fetch(
    `${argoUrl}/api/v1/applications/${input.service}-${input.environment}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.ARGO_CD_TOKEN ?? ""}`,
      },
      body: JSON.stringify({
        spec: {
          source: {
            helm: {
              parameters: [
                { name: "replicaCount", value: String(input.targetReplicas) },
              ],
            },
          },
        },
      }),
    }
  );

  if (!response.ok) {
    throw new Error(
      `Scale operation failed for ${input.service}-${input.environment}: HTTP ${response.status} (target: ${input.targetReplicas} replicas)`
    );
  }

  return {
    scaledAt: new Date().toISOString(),
    previousReplicas: -1,  // Unknown before scale; Argo CD PATCH response omits current state
    targetReplicas: input.targetReplicas,
  };
}

export async function toggleCircuitBreakerActivity(input: {
  service: string;
  environment: string;
  action: "open" | "close";
  reason: string;
  approvalTraceId: string;
}): Promise<{ toggledAt: string; previousState: string; newState: string }> {
  /**
   * Opens or closes the circuit breaker for a service by updating the routing
   * policy label on the service's Argo CD application.
   *
   * Circuit breaker open → service is excluded from upstream routing
   * Circuit breaker close → service is restored to upstream routing
   *
   * Implementation: patches the Argo CD application with a custom annotation
   * that the Envoy/Gateway routing layer reads to toggle circuit state.
   */
  const apiUrl = process.env.API_SERVER_URL ?? "http://localhost:5000";

  const response = await fetch(`${apiUrl}/api/internal/circuit-breaker`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Internal-Token": process.env.INTERNAL_SERVICE_TOKEN ?? "",
    },
    body: JSON.stringify({
      service: input.service,
      environment: input.environment,
      action: input.action,
      reason: input.reason,
      approvalTraceId: input.approvalTraceId,
    }),
  });

  if (!response.ok) {
    throw new Error(
      `Circuit breaker ${input.action} failed for ${input.service}: HTTP ${response.status}`
    );
  }

  return {
    toggledAt: new Date().toISOString(),
    previousState: input.action === "open" ? "closed" : "open",
    newState: input.action === "open" ? "open" : "closed",
  };
}

export async function checkServiceHealthActivity(input: {
  service: string;
  environment: string;
  expectedMinutes: number;
}): Promise<{ healthy: boolean; uptimeMinutes: number; details: Record<string, string> }> {
  /**
   * Polls the service health endpoint and verifies it has been healthy
   * for at least `expectedMinutes` minutes.
   */
  const apiUrl = process.env.API_SERVER_URL ?? "http://localhost:5000";

  const response = await fetch(
    `${apiUrl}/api/internal/health-check?service=${input.service}&env=${input.environment}`,
    {
      headers: { "X-Internal-Token": process.env.INTERNAL_SERVICE_TOKEN ?? "" },
    }
  );

  if (!response.ok) {
    return { healthy: false, uptimeMinutes: 0, details: { error: response.statusText } };
  }

  const body = await response.json() as {
    healthy: boolean;
    uptimeMinutes: number;
    checks: Record<string, string>;
  };

  return {
    healthy: body.healthy && body.uptimeMinutes >= input.expectedMinutes,
    uptimeMinutes: body.uptimeMinutes,
    details: body.checks,
  };
}
