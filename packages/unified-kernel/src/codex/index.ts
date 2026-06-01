/**
 * codex/ — codex-kernel governed-loop primitive.
 *
 * Re-exports the four recovered, real codex-kernel contracts (see contracts.ts)
 * and provides runCodexContracts(), which executes all four on the boot inputs
 * and returns their outputs for inclusion in the kernel-init receipt. This
 * mirrors the codex-kernel's own promise: "all 4 execute on every kernel run,
 * emit receipts."
 */

export {
  computeTraceIdentity,
  assertTraceIdentity,
  resolveVersionLineage,
  auditSecrets,
  resolveDeploymentContract,
  extractRawContracts,
  buildRunIdentityManifest,
} from "./contracts.ts";

import {
  auditSecrets,
  computeTraceIdentity,
  resolveDeploymentContract,
  resolveVersionLineage,
} from "./contracts.ts";
import { hashJson } from "../tamper/index.ts";

export interface CodexContractsResult {
  readonly traceIdentity: { run_id: string; trace_id: string; spanCount: number };
  readonly versionLineage: { kernel_version: string; repo_commit: string };
  readonly secretsAudit: { degraded: boolean; missingOptional: number; missingRequired: number };
  readonly deploymentContract: { platform: string; healthcheckPath: string };
}

/**
 * runCodexContracts — execute all four codex contracts on a boot payload.
 * Real execution: deterministic trace identity from a hash, real git/version
 * lineage resolution, real env secret audit, real deployment binding.
 */
export function runCodexContracts(payload: unknown): CodexContractsResult {
  const payloadHash = hashJson(payload);
  const nowIso = new Date().toISOString();

  const identity = computeTraceIdentity("unified-kernel-boot", payloadHash, 12);
  const lineage = resolveVersionLineage({ payload_version: "unified-kernel/0.1.0", resolved_at: nowIso });
  // No required secrets at boot; optional set is documented. Real env read.
  const audit = auditSecrets(
    { required_secrets: [], optional_secrets: ["MODEL_PROVIDER", "MODEL_VERSION"], missing_secret_behavior: "degrade_gracefully" },
    nowIso,
  );
  const deployment = resolveDeploymentContract();

  return {
    traceIdentity: { run_id: identity.run_id, trace_id: identity.trace_id, spanCount: identity.span_ids.length - 1 },
    versionLineage: { kernel_version: lineage.kernel_version, repo_commit: lineage.repo_commit },
    secretsAudit: {
      degraded: audit.degraded,
      missingOptional: audit.missing_optional.length,
      missingRequired: audit.missing_required.length,
    },
    deploymentContract: { platform: deployment.platform, healthcheckPath: deployment.healthcheck.path },
  };
}
