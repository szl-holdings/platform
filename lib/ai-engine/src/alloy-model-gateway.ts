// Alloy Model Gateway — governed adapter over the Qwen 3.6-27B model profile
// served behind the Alloy Endpoint Plane (Hugging Face Inference Endpoint).

import { createHmac, timingSafeEqual } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { ProvenanceEnvelope } from '@szl-holdings/shared-contracts';
import { buildEnvelope, generateRunId, storeProvenance } from './provenance.js';

// ---------------------------------------------------------------------------
// Public contract
// ---------------------------------------------------------------------------

export type AlloyVertical =
  | 'sentra'
  | 'vessels'
  | 'terra'
  | 'counsel'
  | 'pulse'
  | 'aegis'
  | 'lyte'
  | 'carlota_jo';

export type AlloyModelTask =
  | 'text-generation'
  | 'reasoning'
  | 'planning'
  | 'tool-calling'
  | 'triage'
  | 'summarization'
  | 'classification'
  | 'background-batch';

export interface AlloyModelRequest {
  vertical: AlloyVertical;
  task: AlloyModelTask;
  agentId: string;
  prompt: string;
  systemPrompt?: string;
  tenantId?: string;
  actionName?: string;
  approvalToken?: string;
  sampling?: {
    temperature?: number;
    topP?: number;
    topK?: number;
    maxNewTokens?: number;
  };
  metadata?: Record<string, unknown>;
}

export type AlloyOutcome =
  | 'success'
  | 'blocked'
  | 'budget_exceeded'
  | 'approval_required'
  | 'rate_limited'
  | 'circuit_open'
  | 'error';

export interface AlloyModelResponse {
  outcome: AlloyOutcome;
  text?: string;
  reason?: string;
  blockedBy?: string;
  retries: number;
  evidence: ProvenanceEnvelope;
}

export interface AuditEvent {
  type: string;
  vertical: AlloyVertical;
  task: AlloyModelTask;
  agentId: string;
  tenantId?: string;
  runId: string;
  at: string;
  detail?: Record<string, unknown>;
}

export type AuditEventEmitter = (event: AuditEvent) => void;

export interface ApprovalContext {
  vertical: AlloyVertical;
  task: AlloyModelTask;
  agentId: string;
  actionName: string;
  gate: string;
}

export type ApprovalVerifier = (token: string, ctx: ApprovalContext) => boolean | Promise<boolean>;

export interface BudgetStore {
  daySpentUsd(dayKey: string): number | Promise<number>;
  monthSpentUsd(monthKey: string): number | Promise<number>;
  recordSpend(dayKey: string, monthKey: string, usd: number): void | Promise<void>;
}

// ---------------------------------------------------------------------------
// Profile types (subset)
// ---------------------------------------------------------------------------

interface ModelProfile {
  id: string;
  provider_model_id: string;
  serving_config: {
    base_url_env: string;
    api_key_env: string;
    model_env: string;
    timeout_ms: number;
    cold_start_retries: number;
    cold_start_backoff_ms: number[];
  };
  sampling_defaults: {
    temperature: number;
    top_p: number;
    top_k: number;
    max_new_tokens: number;
    repetition_penalty: number;
    thinking: boolean;
  };
  sampling_overrides_by_task: Record<string, Partial<ModelProfile['sampling_defaults']>>;
  governance_gates: {
    redact_pii_fields: string[];
    strip_thinking_from_output: boolean;
    approval_required_for_tasks: string[];
    max_budget_usd_per_request: number;
    daily_budget_usd: number;
    audit_event_required: boolean;
    deny_on_policy_block: boolean;
  };
}

interface EndpointProfile {
  id: string;
  retry_policy: {
    max_retries: number;
    retryable_status_codes: number[];
    backoff_ms: number[];
    circuit_breaker_enabled: boolean;
    circuit_open_threshold_failures: number;
    circuit_reset_seconds: number;
  };
  budgets: {
    max_cost_usd_per_request: number;
    daily_budget_usd: number;
    monthly_budget_usd: number;
    hard_cutoff: boolean;
  };
  governance: {
    high_risk_actions: string[];
    require_approval_gate_for_high_risk: boolean;
    require_provenance_envelope: boolean;
    max_parallel_requests_per_tenant: number;
  };
}

interface PluginRegistry {
  verticals: Record<
    string,
    {
      allowed_tasks: string[];
      approval_gates?: Record<string, 'human_in_the_loop' | 'auto_with_audit'>;
    }
  >;
  required_audit_events: string[];
}

// ---------------------------------------------------------------------------
// Profile resolution — anchored to the repo root, not process.cwd().
// We walk up from this file's location until we find pnpm-workspace.yaml.
// ---------------------------------------------------------------------------

let cachedRepoRoot: string | undefined;

function findRepoRoot(): string {
  if (cachedRepoRoot) return cachedRepoRoot;
  let dir = dirname(fileURLToPath(import.meta.url));
  for (let i = 0; i < 10; i++) {
    if (existsSync(resolve(dir, 'pnpm-workspace.yaml'))) {
      cachedRepoRoot = dir;
      return dir;
    }
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  // Fallback: 4 levels up from src/ (lib/ai-engine/src/...)
  cachedRepoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
  return cachedRepoRoot;
}

interface ProfilePaths {
  modelProfile?: string;
  endpointProfile?: string;
  pluginRegistry?: string;
}

let cachedModelProfile: ModelProfile | undefined;
let cachedEndpointProfile: EndpointProfile | undefined;
let cachedRegistry: PluginRegistry | undefined;
let cachedPaths: ProfilePaths = {};

function loadJson<T>(absPath: string): T {
  return JSON.parse(readFileSync(absPath, 'utf-8')) as T;
}

function modelProfilePath(override?: string): string {
  return override ?? resolve(findRepoRoot(), 'model-profiles/qwen3_6_27b_szl_profile.json');
}
function endpointProfilePath(override?: string): string {
  return override ?? resolve(findRepoRoot(), 'endpoint-profiles/alloy_endpoint_plane.json');
}
function pluginRegistryPath(override?: string): string {
  return override ?? resolve(findRepoRoot(), 'ecosystem-plugin-registry.json');
}

function loadModelProfile(override?: string): ModelProfile {
  const path = modelProfilePath(override);
  if (cachedPaths.modelProfile !== path || !cachedModelProfile) {
    cachedModelProfile = loadJson<ModelProfile>(path);
    cachedPaths.modelProfile = path;
  }
  return cachedModelProfile;
}

function loadEndpointProfile(override?: string): EndpointProfile {
  const path = endpointProfilePath(override);
  if (cachedPaths.endpointProfile !== path || !cachedEndpointProfile) {
    cachedEndpointProfile = loadJson<EndpointProfile>(path);
    cachedPaths.endpointProfile = path;
  }
  return cachedEndpointProfile;
}

function loadPluginRegistry(override?: string): PluginRegistry {
  const path = pluginRegistryPath(override);
  if (cachedPaths.pluginRegistry !== path || !cachedRegistry) {
    cachedRegistry = loadJson<PluginRegistry>(path);
    cachedPaths.pluginRegistry = path;
  }
  return cachedRegistry;
}

export function _resetAlloyProfileCache(): void {
  cachedModelProfile = undefined;
  cachedEndpointProfile = undefined;
  cachedRegistry = undefined;
  cachedPaths = {};
  cachedRepoRoot = undefined;
}

// ---------------------------------------------------------------------------
// Redaction
// ---------------------------------------------------------------------------

const PII_PATTERNS: Array<{ name: string; re: RegExp }> = [
  { name: 'ssn', re: /\b\d{3}-\d{2}-\d{4}\b/g },
  { name: 'credit_card', re: /\b(?:\d[ -]*?){13,19}\b/g },
  { name: 'email', re: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi },
  {
    name: 'private_key',
    re: /-----BEGIN (?:RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----[\s\S]*?-----END[^-]+-----/g,
  },
  { name: 'aws_secret', re: /AKIA[0-9A-Z]{16}/g },
  { name: 'bearer_token', re: /\b(?:sk|pk|hf|ghp|github_pat)_[A-Za-z0-9_]{16,}\b/g },
];

function redactString(input: string): { redacted: string; hits: string[] } {
  let redacted = input;
  const hits = new Set<string>();
  for (const { name, re } of PII_PATTERNS) {
    re.lastIndex = 0;
    if (re.test(redacted)) {
      hits.add(name);
      redacted = redacted.replace(re, `[REDACTED:${name}]`);
    }
  }
  return { redacted, hits: [...hits] };
}

// ---------------------------------------------------------------------------
// Thinking-content stripping
// ---------------------------------------------------------------------------

const THINKING_TAG_RE = /<think(?:ing)?>[\s\S]*?<\/think(?:ing)?>/gi;

function stripThinking(text: string): { stripped: string; thinkingPresent: boolean } {
  THINKING_TAG_RE.lastIndex = 0;
  if (!THINKING_TAG_RE.test(text)) return { stripped: text, thinkingPresent: false };
  THINKING_TAG_RE.lastIndex = 0;
  return { stripped: text.replace(THINKING_TAG_RE, '').trim(), thinkingPresent: true };
}

// ---------------------------------------------------------------------------
// Approval verification — HMAC by default, fail-secure if no key configured.
// Token format expected: hex(HMAC-SHA256(SIGNING_KEY, `${vertical}|${task}|${agentId}|${actionName}`))
// ---------------------------------------------------------------------------

function defaultApprovalVerifier(token: string, ctx: ApprovalContext): boolean {
  const key = process.env.ALLOY_APPROVAL_SIGNING_KEY;
  if (!key) return false;
  const payload = `${ctx.vertical}|${ctx.task}|${ctx.agentId}|${ctx.actionName}`;
  const expected = createHmac('sha256', key).update(payload).digest('hex');
  if (token.length !== expected.length) return false;
  try {
    return timingSafeEqual(Buffer.from(token, 'utf-8'), Buffer.from(expected, 'utf-8'));
  } catch {
    return false;
  }
}

/** Helper for callers / tests to mint a valid approval token. */
export function signAlloyApprovalToken(
  signingKey: string,
  ctx: ApprovalContext,
): string {
  const payload = `${ctx.vertical}|${ctx.task}|${ctx.agentId}|${ctx.actionName}`;
  return createHmac('sha256', signingKey).update(payload).digest('hex');
}

// ---------------------------------------------------------------------------
// Budget store — pluggable. Default is in-memory and process-local.
// Multi-instance deployments must inject a durable BudgetStore (e.g.
// Redis-backed) to enforce hard cutoffs across replicas / restarts.
// ---------------------------------------------------------------------------

class InMemoryBudgetStore implements BudgetStore {
  private day = { key: '', usd: 0 };
  private month = { key: '', usd: 0 };

  daySpentUsd(dayKey: string): number {
    return this.day.key === dayKey ? this.day.usd : 0;
  }
  monthSpentUsd(monthKey: string): number {
    return this.month.key === monthKey ? this.month.usd : 0;
  }
  recordSpend(dayKey: string, monthKey: string, usd: number): void {
    if (this.day.key !== dayKey) this.day = { key: dayKey, usd: 0 };
    if (this.month.key !== monthKey) this.month = { key: monthKey, usd: 0 };
    this.day.usd += usd;
    this.month.usd += usd;
  }
  reset(): void {
    this.day = { key: '', usd: 0 };
    this.month = { key: '', usd: 0 };
  }
}

const defaultBudgetStore = new InMemoryBudgetStore();

export function _resetAlloyBudget(): void {
  defaultBudgetStore.reset();
}

function dateKeys(): { day: string; month: string } {
  const iso = new Date().toISOString();
  return { day: iso.slice(0, 10), month: iso.slice(0, 7) };
}

// ---------------------------------------------------------------------------
// Per-tenant concurrency tracker (process-local)
// ---------------------------------------------------------------------------

const inFlightByTenant = new Map<string, number>();

function tryAcquireSlot(tenantId: string, max: number): boolean {
  const cur = inFlightByTenant.get(tenantId) ?? 0;
  if (cur >= max) return false;
  inFlightByTenant.set(tenantId, cur + 1);
  return true;
}

function releaseSlot(tenantId: string): void {
  const cur = inFlightByTenant.get(tenantId) ?? 0;
  if (cur <= 1) inFlightByTenant.delete(tenantId);
  else inFlightByTenant.set(tenantId, cur - 1);
}

export function _resetAlloyConcurrency(): void {
  inFlightByTenant.clear();
}

// ---------------------------------------------------------------------------
// Circuit breaker (per endpoint id, process-local)
// ---------------------------------------------------------------------------

interface CircuitState {
  consecutiveFailures: number;
  openedAt?: number;
}

const circuitsByEndpoint = new Map<string, CircuitState>();

function isCircuitOpen(endpointId: string, resetSeconds: number): boolean {
  const c = circuitsByEndpoint.get(endpointId);
  if (!c?.openedAt) return false;
  if (Date.now() - c.openedAt >= resetSeconds * 1000) {
    circuitsByEndpoint.set(endpointId, { consecutiveFailures: 0 });
    return false;
  }
  return true;
}

function recordCircuitSuccess(endpointId: string): void {
  circuitsByEndpoint.set(endpointId, { consecutiveFailures: 0 });
}

function recordCircuitFailure(endpointId: string, threshold: number): boolean {
  const c = circuitsByEndpoint.get(endpointId) ?? { consecutiveFailures: 0 };
  c.consecutiveFailures += 1;
  if (c.consecutiveFailures >= threshold) c.openedAt = Date.now();
  circuitsByEndpoint.set(endpointId, c);
  return Boolean(c.openedAt);
}

export function _resetAlloyCircuit(): void {
  circuitsByEndpoint.clear();
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function nowIso(): string {
  return new Date().toISOString();
}

// ---------------------------------------------------------------------------
// Gateway
// ---------------------------------------------------------------------------

export interface AlloyModelGatewayOptions {
  emitAudit?: AuditEventEmitter;
  fetchImpl?: typeof fetch;
  /** Override cold-start backoff schedule (ms). */
  backoffOverrideMs?: number[];
  /** Approval-token verifier. Defaults to HMAC against ALLOY_APPROVAL_SIGNING_KEY. */
  approvalVerifier?: ApprovalVerifier;
  /** Budget store. Defaults to in-memory; inject a durable store in production. */
  budgetStore?: BudgetStore;
  /** Override profile file paths (otherwise resolved from repo root). */
  profilePaths?: ProfilePaths;
}

export class AlloyModelGateway {
  private readonly emitAudit: AuditEventEmitter;
  private readonly fetchImpl: typeof fetch;
  private readonly backoffOverrideMs?: number[];
  private readonly approvalVerifier: ApprovalVerifier;
  private readonly budgetStore: BudgetStore;
  private readonly profilePaths: ProfilePaths;

  constructor(opts: AlloyModelGatewayOptions = {}) {
    this.emitAudit = opts.emitAudit ?? defaultAuditEmitter;
    this.fetchImpl = opts.fetchImpl ?? fetch;
    this.backoffOverrideMs = opts.backoffOverrideMs;
    this.approvalVerifier = opts.approvalVerifier ?? defaultApprovalVerifier;
    this.budgetStore = opts.budgetStore ?? defaultBudgetStore;
    this.profilePaths = opts.profilePaths ?? {};
  }

  async invoke(req: AlloyModelRequest): Promise<AlloyModelResponse> {
    const model = loadModelProfile(this.profilePaths.modelProfile);
    const endpoint = loadEndpointProfile(this.profilePaths.endpointProfile);
    const registry = loadPluginRegistry(this.profilePaths.pluginRegistry);

    const startedAt = Date.now();
    const runId = generateRunId();
    const tenantId = req.tenantId ?? 'anonymous';

    const baseEvent = {
      vertical: req.vertical,
      task: req.task,
      agentId: req.agentId,
      tenantId,
      runId,
    };

    // 1. Vertical + task validation
    const verticalEntry = registry.verticals[req.vertical];
    if (!verticalEntry) {
      this.audit({ ...baseEvent, type: 'alloy.governance_block', at: nowIso(), detail: { reason: 'vertical_unknown' } });
      return this.fail(req, runId, startedAt, 'blocked', `Unknown vertical: ${req.vertical}`, 'registry.vertical_unknown');
    }
    if (!verticalEntry.allowed_tasks.includes(req.task)) {
      this.audit({ ...baseEvent, type: 'alloy.governance_block', at: nowIso(), detail: { reason: 'task_not_allowed_for_vertical' } });
      return this.fail(req, runId, startedAt, 'blocked', `Task '${req.task}' not allowed for vertical '${req.vertical}'`, 'registry.task_not_allowed');
    }

    // 2. Approval gates
    const gateReason = this.requiresApproval(req, model, endpoint, verticalEntry);
    if (gateReason) {
      const actionName = req.actionName ?? req.task;
      this.audit({ ...baseEvent, type: 'alloy.approval_gate_triggered', at: nowIso(), detail: { actionName, gate: gateReason } });
      const tokenValid = req.approvalToken
        ? await this.approvalVerifier(req.approvalToken, {
            vertical: req.vertical,
            task: req.task,
            agentId: req.agentId,
            actionName,
            gate: gateReason,
          })
        : false;
      if (!tokenValid) {
        return this.fail(req, runId, startedAt, 'approval_required', `Approval required: ${gateReason}`, 'governance.approval_required');
      }
    } else if (req.actionName && verticalEntry.approval_gates?.[req.actionName] === 'auto_with_audit') {
      this.audit({ ...baseEvent, type: 'alloy.approval_gate_triggered', at: nowIso(), detail: { actionName: req.actionName, gate: 'auto_with_audit' } });
    }

    // 3. Budget pre-check (worst-case per-request cost)
    const perReqCap = endpoint.budgets.max_cost_usd_per_request;
    const keys = dateKeys();
    if (endpoint.budgets.hard_cutoff) {
      const daySpent = await this.budgetStore.daySpentUsd(keys.day);
      if (daySpent + perReqCap > endpoint.budgets.daily_budget_usd) {
        this.audit({ ...baseEvent, type: 'alloy.budget_limit_reached', at: nowIso(), detail: { scope: 'daily', spentUsd: daySpent, capUsd: endpoint.budgets.daily_budget_usd } });
        return this.fail(req, runId, startedAt, 'budget_exceeded', 'Daily budget cap reached', 'governance.daily_budget_exceeded');
      }
      const monthSpent = await this.budgetStore.monthSpentUsd(keys.month);
      if (monthSpent + perReqCap > endpoint.budgets.monthly_budget_usd) {
        this.audit({ ...baseEvent, type: 'alloy.budget_limit_reached', at: nowIso(), detail: { scope: 'monthly', spentUsd: monthSpent, capUsd: endpoint.budgets.monthly_budget_usd } });
        return this.fail(req, runId, startedAt, 'budget_exceeded', 'Monthly budget cap reached', 'governance.monthly_budget_exceeded');
      }
    }

    // 4. Tenant concurrency cap
    const maxParallel = endpoint.governance.max_parallel_requests_per_tenant;
    if (!tryAcquireSlot(tenantId, maxParallel)) {
      this.audit({ ...baseEvent, type: 'alloy.governance_block', at: nowIso(), detail: { reason: 'tenant_rate_limited', maxParallel } });
      return this.fail(req, runId, startedAt, 'rate_limited', `Tenant '${tenantId}' over parallel-request cap (${maxParallel})`, 'governance.tenant_rate_limited');
    }

    try {
      // 5. Circuit breaker
      if (
        endpoint.retry_policy.circuit_breaker_enabled &&
        isCircuitOpen(endpoint.id, endpoint.retry_policy.circuit_reset_seconds)
      ) {
        this.audit({ ...baseEvent, type: 'alloy.circuit_breaker_opened', at: nowIso(), detail: { endpoint: endpoint.id } });
        return this.fail(req, runId, startedAt, 'circuit_open', 'Endpoint circuit breaker is open', 'governance.circuit_open');
      }

      // 6. Redact every outbound surface (prompt, systemPrompt, metadata)
      const promptR = redactString(req.prompt);
      const sysR = req.systemPrompt
        ? redactString(req.systemPrompt)
        : { redacted: undefined as string | undefined, hits: [] as string[] };
      const metaR = req.metadata
        ? redactString(JSON.stringify(req.metadata))
        : { redacted: undefined as string | undefined, hits: [] as string[] };
      const allHits = [...new Set([...promptR.hits, ...sysR.hits, ...metaR.hits])];
      if (allHits.length > 0) {
        this.audit({ ...baseEvent, type: 'alloy.pii_redaction_applied', at: nowIso(), detail: { fields: allHits, sources: { prompt: promptR.hits.length > 0, systemPrompt: sysR.hits.length > 0, metadata: metaR.hits.length > 0 } } });
      }

      // 7. Resolve sampling + endpoint config
      const taskOverride = model.sampling_overrides_by_task[req.task] ?? {};
      const sampling = {
        temperature: req.sampling?.temperature ?? taskOverride.temperature ?? model.sampling_defaults.temperature,
        top_p: req.sampling?.topP ?? taskOverride.top_p ?? model.sampling_defaults.top_p,
        top_k: req.sampling?.topK ?? taskOverride.top_k ?? model.sampling_defaults.top_k,
        max_new_tokens: req.sampling?.maxNewTokens ?? taskOverride.max_new_tokens ?? model.sampling_defaults.max_new_tokens,
        repetition_penalty: model.sampling_defaults.repetition_penalty,
      };

      const baseUrl = process.env[model.serving_config.base_url_env];
      const apiKey = process.env[model.serving_config.api_key_env];
      const modelId = process.env[model.serving_config.model_env] ?? model.provider_model_id;

      if (!baseUrl || !apiKey) {
        return this.fail(
          req,
          runId,
          startedAt,
          'error',
          `Endpoint not configured: set ${model.serving_config.base_url_env} and ${model.serving_config.api_key_env}`,
          'config.endpoint_missing',
        );
      }

      this.audit({ ...baseEvent, type: 'alloy.model_request_sent', at: nowIso(), detail: { modelId, profileId: model.id, endpointId: endpoint.id, sampling } });

      // 8. Dispatch with cold-start retry
      const userContent = metaR.redacted
        ? `${promptR.redacted}\n\n[context-metadata-redacted]: ${metaR.redacted}`
        : promptR.redacted;

      const messages = [
        ...(sysR.redacted ? [{ role: 'system' as const, content: sysR.redacted }] : []),
        { role: 'user' as const, content: userContent },
      ];

      const url = `${baseUrl.replace(/\/$/, '')}/v1/chat/completions`;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      };
      const body = JSON.stringify({
        model: modelId,
        messages,
        temperature: sampling.temperature,
        top_p: sampling.top_p,
        max_tokens: sampling.max_new_tokens,
      });

      const maxRetries = Math.max(model.serving_config.cold_start_retries, endpoint.retry_policy.max_retries);
      const backoff = this.backoffOverrideMs ?? model.serving_config.cold_start_backoff_ms;
      let retries = 0;
      let lastError: string | undefined;
      let responseJson:
        | {
            choices?: Array<{ message?: { content?: string } }>;
            usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
          }
        | undefined;

      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), model.serving_config.timeout_ms);
        try {
          const res = await this.fetchImpl(url, { method: 'POST', headers, body, signal: controller.signal });
          clearTimeout(timer);
          if (res.ok) {
            responseJson = (await res.json()) as typeof responseJson;
            recordCircuitSuccess(endpoint.id);
            break;
          }
          if (endpoint.retry_policy.retryable_status_codes.includes(res.status) && attempt < maxRetries) {
            retries++;
            const wait = backoff[Math.min(attempt, backoff.length - 1)] ?? 1000;
            this.audit({ ...baseEvent, type: 'alloy.cold_start_retry', at: nowIso(), detail: { status: res.status, attempt: attempt + 1, waitMs: wait } });
            await sleep(wait);
            continue;
          }
          lastError = `Endpoint returned ${res.status}`;
          break;
        } catch (err) {
          clearTimeout(timer);
          lastError = err instanceof Error ? err.message : String(err);
          if (attempt < maxRetries) {
            retries++;
            const wait = backoff[Math.min(attempt, backoff.length - 1)] ?? 1000;
            this.audit({ ...baseEvent, type: 'alloy.cold_start_retry', at: nowIso(), detail: { error: lastError, attempt: attempt + 1, waitMs: wait } });
            await sleep(wait);
          }
        }
      }

      if (!responseJson) {
        if (endpoint.retry_policy.circuit_breaker_enabled) {
          const opened = recordCircuitFailure(endpoint.id, endpoint.retry_policy.circuit_open_threshold_failures);
          if (opened) {
            this.audit({ ...baseEvent, type: 'alloy.circuit_breaker_opened', at: nowIso(), detail: { endpoint: endpoint.id } });
          }
        }
        return this.fail(req, runId, startedAt, 'error', lastError ?? 'Endpoint call failed', 'transport.failure', retries);
      }

      // 9. Strip thinking content
      const rawText = responseJson.choices?.[0]?.message?.content ?? '';
      const { stripped, thinkingPresent } = stripThinking(rawText);
      if (thinkingPresent && model.governance_gates.strip_thinking_from_output) {
        this.audit({ ...baseEvent, type: 'alloy.thinking_content_stripped', at: nowIso() });
      }

      // 10. Build evidence + record provenance + spend
      const totalTokens = responseJson.usage?.total_tokens ?? 0;
      const envelope = buildEnvelope({
        runId,
        agentId: req.agentId,
        domain: req.vertical,
        model: modelId,
        provider: 'huggingface-inference-endpoint',
        prompt: promptR.redacted,
        totalTokens,
        confidence: 0.85,
        latencyMs: Date.now() - startedAt,
        governanceVerdict: 'allowed',
        metadata: {
          modelProfileId: model.id,
          endpointProfileId: endpoint.id,
          vertical: req.vertical,
          task: req.task,
          tenantId,
          retries,
          thinkingPresent,
          redactionHits: allHits,
          actionName: req.actionName ?? null,
          approvalConsumed: gateReason !== null,
        },
      });

      if (envelope.costEstimateUsd > model.governance_gates.max_budget_usd_per_request) {
        this.audit({ ...baseEvent, type: 'alloy.budget_limit_reached', at: nowIso(), detail: { scope: 'per_request', costUsd: envelope.costEstimateUsd, capUsd: model.governance_gates.max_budget_usd_per_request } });
        return this.fail(req, runId, startedAt, 'budget_exceeded', 'Per-request budget cap exceeded', 'governance.per_request_budget_exceeded', retries);
      }
      await this.budgetStore.recordSpend(keys.day, keys.month, envelope.costEstimateUsd);

      storeProvenance({ runId, envelope, parentRunIds: [], consultations: [] });

      this.audit({
        ...baseEvent,
        type: 'alloy.model_response_received',
        at: nowIso(),
        detail: {
          modelId,
          totalTokens,
          latencyMs: envelope.latencyMs,
          costUsd: envelope.costEstimateUsd,
          thinkingPresent,
          retries,
        },
      });

      return { outcome: 'success', text: stripped, retries, evidence: envelope };
    } finally {
      releaseSlot(tenantId);
    }
  }

  /** Verifies env vars are set. Does not call the endpoint. */
  configurationHealth(): { configured: boolean; missing: string[] } {
    const model = loadModelProfile(this.profilePaths.modelProfile);
    const required = [model.serving_config.base_url_env, model.serving_config.api_key_env];
    const missing = required.filter((k) => !process.env[k]);
    return { configured: missing.length === 0, missing };
  }

  // -------------------------------------------------------------------------
  // Internals
  // -------------------------------------------------------------------------

  private requiresApproval(
    req: AlloyModelRequest,
    model: ModelProfile,
    endpoint: EndpointProfile,
    verticalEntry: PluginRegistry['verticals'][string],
  ): string | null {
    if (req.actionName) {
      const verticalGate = verticalEntry.approval_gates?.[req.actionName];
      if (verticalGate === 'human_in_the_loop') return `vertical:${req.actionName}`;
      if (
        endpoint.governance.require_approval_gate_for_high_risk &&
        endpoint.governance.high_risk_actions.includes(req.actionName)
      ) {
        return `endpoint:${req.actionName}`;
      }
    }
    if (model.governance_gates.approval_required_for_tasks.includes(req.task)) {
      return `task:${req.task}`;
    }
    return null;
  }

  private audit(event: AuditEvent): void {
    try {
      this.emitAudit(event);
    } catch {
      /* audit emission must not break the request flow */
    }
  }

  private fail(
    req: AlloyModelRequest,
    runId: string,
    startedAt: number,
    outcome: AlloyOutcome,
    reason: string,
    blockedBy: string,
    retries = 0,
  ): AlloyModelResponse {
    const envelope = buildEnvelope({
      runId,
      agentId: req.agentId,
      domain: req.vertical,
      model: 'n/a',
      provider: 'huggingface-inference-endpoint',
      prompt: req.prompt,
      totalTokens: 0,
      confidence: 0,
      latencyMs: Date.now() - startedAt,
      governanceVerdict: 'blocked',
      metadata: {
        outcome,
        blockedBy,
        vertical: req.vertical,
        task: req.task,
        tenantId: req.tenantId ?? 'anonymous',
      },
    });
    storeProvenance({ runId, envelope, parentRunIds: [], consultations: [] });
    return { outcome, reason, blockedBy, retries, evidence: envelope };
  }
}

const defaultAuditEmitter: AuditEventEmitter = (event) => {
  if (process.env.ALLOY_GATEWAY_LOG_AUDITS === '1') {
    // eslint-disable-next-line no-console
    console.log('[alloy.audit]', JSON.stringify(event));
  }
};

let defaultGateway: AlloyModelGateway | undefined;

export function getDefaultAlloyModelGateway(): AlloyModelGateway {
  if (!defaultGateway) defaultGateway = new AlloyModelGateway();
  return defaultGateway;
}

export function createAlloyModelGateway(opts: AlloyModelGatewayOptions = {}): AlloyModelGateway {
  return new AlloyModelGateway(opts);
}
