/**
 * Codex-Kernel — operational contract handlers.
 *
 * Four contracts the v1.6.0 payload declares are made REAL here, not just
 * declarative metadata:
 *
 *   - trace_identity      → deterministic run_id / trace_id / span_ids
 *                           bound to (experiment_id, payload_hash, step).
 *                           Replay-stable: same payload ⇒ same identity.
 *   - version_lineage     → payload_version, kernel_version, repo_commit,
 *                           model_provider, model_version. repo_commit comes
 *                           from `git rev-parse HEAD` at runtime; missing →
 *                           "unknown" rather than a synthetic value.
 *   - secrets_contract    → at boot, classify each optional_secret as
 *                           present/missing. missing_secret_behavior =
 *                           degrade_gracefully ⇒ proceed with degraded mode
 *                           recorded in the manifest. Required secrets
 *                           missing ⇒ hard fail.
 *   - deployment_contract → exposes a public /api/healthz (mounted by the
 *                           api-server) returning 200 with version_lineage.
 *                           This module exports the JSON shape; the route
 *                           imports it.
 *
 * Hash-stability invariant: none of these emit fields into the trace events
 * or ledger entries that the kernel hashes. They produce sidecar files and
 * additional fields in run_summary.json. Final state hash and ledger digest
 * are unchanged by adding identity / lineage / secrets metadata.
 */

import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { hashJson, hashString } from '../hash.js';
import type { Json } from '../types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ────────────────────────────────────────────────────────────────────────
// trace_identity
// ────────────────────────────────────────────────────────────────────────

export interface TraceIdentityConfig {
  enabled: boolean;
  trace_id_prefix: string;
  span_id_prefix: string;
  run_id_prefix: string;
  require_trace_id_per_run: boolean;
  require_span_id_per_step: boolean;
}

export interface TraceIdentity {
  run_id: string;
  trace_id: string;
  /** span_ids[step] is the span id for step `step` (1-indexed). [0] is unused. */
  span_ids: string[];
  config: TraceIdentityConfig;
}

const DEFAULT_TRACE_IDENTITY_CONFIG: TraceIdentityConfig = {
  enabled: true,
  trace_id_prefix: 'trace',
  span_id_prefix: 'span',
  run_id_prefix: 'run',
  require_trace_id_per_run: true,
  require_span_id_per_step: true,
};

/**
 * Compute deterministic identity from (experiment_id, payload_hash, expected
 * step count). Same inputs ⇒ same identity, so replay reproduces it exactly.
 *
 * We use first-12 hex of a SHA-256 over a stable canonical seed string.
 * Short enough to read, long enough that collision risk is negligible
 * within a single project.
 */
export function computeTraceIdentity(
  experiment_id: string,
  payload_hash: string,
  max_steps: number,
  config_in?: Partial<TraceIdentityConfig>,
): TraceIdentity {
  const config = { ...DEFAULT_TRACE_IDENTITY_CONFIG, ...config_in };
  const run_seed = `${experiment_id}|${payload_hash}|run`;
  const trace_seed = `${experiment_id}|${payload_hash}|trace`;
  const run_id = `${config.run_id_prefix}_${hashString(run_seed).slice(0, 16)}`;
  const trace_id = `${config.trace_id_prefix}_${hashString(trace_seed).slice(0, 16)}`;
  const span_ids: string[] = [''];
  for (let step = 1; step <= max_steps; step++) {
    const span_seed = `${trace_id}|step_${step}`;
    span_ids.push(`${config.span_id_prefix}_${hashString(span_seed).slice(0, 16)}`);
  }
  return { run_id, trace_id, span_ids, config };
}

/**
 * Validate the identity satisfies the contract requirements declared in
 * the payload. Throws on violation so misconfiguration fails the run loud.
 */
export function assertTraceIdentity(
  identity: TraceIdentity,
  steps_executed: number,
): void {
  if (!identity.config.enabled) return;
  if (identity.config.require_trace_id_per_run && !identity.trace_id) {
    throw new Error('trace_identity: require_trace_id_per_run set but trace_id is empty');
  }
  if (identity.config.require_span_id_per_step) {
    for (let step = 1; step <= steps_executed; step++) {
      const span = identity.span_ids[step];
      if (!span || span.length === 0) {
        throw new Error(
          `trace_identity: require_span_id_per_step set but span_ids[${step}] is missing`,
        );
      }
    }
  }
}

// ────────────────────────────────────────────────────────────────────────
// version_lineage
// ────────────────────────────────────────────────────────────────────────

export interface VersionLineage {
  payload_version: string;
  kernel_version: string;
  repo_commit: string;
  model_provider: string;
  model_version: string;
  resolved_at: string;
}

/**
 * Resolve current repo HEAD via `git rev-parse HEAD`. Returns "unknown"
 * (not a synthetic value, not a thrown error) if git is not available
 * or this is not a git checkout — keeps the lineage record HONEST.
 */
function resolveRepoCommit(): string {
  try {
    const sha = execSync('git rev-parse HEAD', {
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'ignore'],
      cwd: join(__dirname, '..', '..', '..', '..'),
    }).trim();
    if (/^[0-9a-f]{40}$/i.test(sha)) return sha;
    return 'unknown';
  } catch {
    return 'unknown';
  }
}

function resolveKernelVersion(): string {
  try {
    const pkg_path = join(__dirname, '..', '..', 'package.json');
    const pkg = JSON.parse(readFileSync(pkg_path, 'utf-8')) as { version?: string };
    return `codex-kernel-runner-${pkg.version ?? '0.0.0'}`;
  } catch {
    return 'codex-kernel-runner-unknown';
  }
}

export function resolveVersionLineage(opts: {
  payload_version: string;
  resolved_at: string;
  declared?: Partial<VersionLineage>;
}): VersionLineage {
  // Honor the payload-declared model_provider / model_version when present.
  // Real env-var reads override the declared value (real beats declared).
  const env_provider = process.env.MODEL_PROVIDER;
  const env_version = process.env.MODEL_VERSION;
  return {
    payload_version: opts.payload_version,
    kernel_version: resolveKernelVersion(),
    repo_commit: resolveRepoCommit(),
    model_provider:
      env_provider ?? opts.declared?.model_provider ?? 'proxy_or_offline_emulator',
    model_version: env_version ?? opts.declared?.model_version ?? 'deterministic',
    resolved_at: opts.resolved_at,
  };
}

// ────────────────────────────────────────────────────────────────────────
// secrets_contract
// ────────────────────────────────────────────────────────────────────────

export interface SecretsContract {
  required_secrets: string[];
  optional_secrets: string[];
  missing_secret_behavior: 'degrade_gracefully' | 'hard_fail';
}

export interface SecretStatus {
  name: string;
  present: boolean;
  required: boolean;
}

export interface SecretsAudit {
  contract: SecretsContract;
  statuses: SecretStatus[];
  missing_required: string[];
  missing_optional: string[];
  degraded: boolean;
  audited_at: string;
}

const DEFAULT_SECRETS_CONTRACT: SecretsContract = {
  required_secrets: [],
  optional_secrets: [],
  missing_secret_behavior: 'degrade_gracefully',
};

/**
 * Audit env vars against the secrets_contract. Returns an audit record
 * (no values, only presence). Throws if a REQUIRED secret is missing —
 * that is by definition "do not boot".
 *
 * Optional secrets missing under degrade_gracefully are recorded but do
 * not throw. The runner / api-server can read this audit to decide what
 * features to disable.
 */
export function auditSecrets(
  contract_in: Partial<SecretsContract> | undefined,
  audited_at: string,
): SecretsAudit {
  const contract: SecretsContract = { ...DEFAULT_SECRETS_CONTRACT, ...contract_in };
  const statuses: SecretStatus[] = [];
  const missing_required: string[] = [];
  const missing_optional: string[] = [];

  for (const name of contract.required_secrets) {
    const present = isSecretPresent(name);
    statuses.push({ name, present, required: true });
    if (!present) missing_required.push(name);
  }
  for (const name of contract.optional_secrets) {
    const present = isSecretPresent(name);
    statuses.push({ name, present, required: false });
    if (!present) missing_optional.push(name);
  }

  if (missing_required.length > 0) {
    throw new Error(
      `secrets_contract: missing required secrets: ${missing_required.join(', ')}`,
    );
  }

  return {
    contract,
    statuses,
    missing_required,
    missing_optional,
    degraded: missing_optional.length > 0,
    audited_at,
  };
}

function isSecretPresent(name: string): boolean {
  const v = process.env[name];
  return typeof v === 'string' && v.length > 0;
}

// ────────────────────────────────────────────────────────────────────────
// deployment_contract
// ────────────────────────────────────────────────────────────────────────

export interface DeploymentContract {
  platform: string;
  healthcheck: {
    enabled: boolean;
    path: string;
    expected_status: number;
    startup_timeout_seconds: number;
  };
  logging: {
    json_logs: boolean;
    retain_local_artifacts: boolean;
    write_run_logs_to_output: boolean;
  };
}

const DEFAULT_DEPLOYMENT_CONTRACT: DeploymentContract = {
  platform: 'replit',
  healthcheck: {
    enabled: true,
    path: '/api/healthz',
    expected_status: 200,
    startup_timeout_seconds: 60,
  },
  logging: {
    json_logs: true,
    retain_local_artifacts: true,
    write_run_logs_to_output: true,
  },
};

export function resolveDeploymentContract(
  declared?: Partial<DeploymentContract>,
): DeploymentContract {
  if (!declared) return DEFAULT_DEPLOYMENT_CONTRACT;
  return {
    platform: declared.platform ?? DEFAULT_DEPLOYMENT_CONTRACT.platform,
    healthcheck: {
      ...DEFAULT_DEPLOYMENT_CONTRACT.healthcheck,
      ...(declared.healthcheck ?? {}),
    },
    logging: {
      ...DEFAULT_DEPLOYMENT_CONTRACT.logging,
      ...(declared.logging ?? {}),
    },
  };
}

// ────────────────────────────────────────────────────────────────────────
// payload extraction (lean payloads carry these as top-level objects)
// ────────────────────────────────────────────────────────────────────────

export interface RawContractsBlock {
  trace_identity?: Partial<TraceIdentityConfig>;
  secrets_contract?: Partial<SecretsContract>;
  version_lineage?: Partial<VersionLineage>;
  deployment_contract?: Partial<DeploymentContract>;
}

/**
 * Extract the four operational contracts from a raw payload (pre-normalized
 * lean shape). Tolerates missing blocks → falls back to defaults. This is
 * how a v1.3.0 payload (pre-contracts) keeps working.
 */
export function extractRawContracts(raw: unknown): RawContractsBlock {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const o = raw as Record<string, Json>;
  const out: RawContractsBlock = {};
  if (o.trace_identity && typeof o.trace_identity === 'object') {
    out.trace_identity = o.trace_identity as Partial<TraceIdentityConfig>;
  }
  if (o.secrets_contract && typeof o.secrets_contract === 'object') {
    out.secrets_contract = o.secrets_contract as Partial<SecretsContract>;
  }
  if (o.version_lineage && typeof o.version_lineage === 'object') {
    out.version_lineage = o.version_lineage as Partial<VersionLineage>;
  }
  if (o.deployment_contract && typeof o.deployment_contract === 'object') {
    out.deployment_contract = o.deployment_contract as Partial<DeploymentContract>;
  }
  return out;
}

// ────────────────────────────────────────────────────────────────────────
// run-identity manifest (the artifact emitted to disk)
// ────────────────────────────────────────────────────────────────────────

export interface RunIdentityManifest {
  experiment_id: string;
  payload_hash: string;
  identity: TraceIdentity;
  steps_executed: number;
  manifest_hash: string;
}

export function buildRunIdentityManifest(
  experiment_id: string,
  payload_hash: string,
  identity: TraceIdentity,
  steps_executed: number,
): RunIdentityManifest {
  const body = {
    experiment_id,
    payload_hash,
    identity,
    steps_executed,
  };
  const manifest_hash = hashJson(body as unknown as Json);
  return { ...body, manifest_hash };
}
