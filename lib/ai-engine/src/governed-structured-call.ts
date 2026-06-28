/**
 * Governed Structured Call — Schema-Guaranteed AI Pipeline
 *
 * Single entry point for all AI inference calls that:
 * 1. Validates output against a Zod schema (no regex extraction, no manual validators)
 * 2. Detects model refusals as first-class governance events
 * 3. Wraps results in a provenance envelope
 * 4. Checks output against Covenant Policy rules
 * 5. Records the full trace in the Proof Chain
 *
 * Replaces structuredCompletion() — all call sites migrate to this function.
 */

import { createHash, randomUUID } from 'node:crypto';
import { z } from 'zod';
import { type HFChatMessage, chatCompletionWithFallback, type HFCompletionResult } from './providers/hf-client.js';
import { type RouteResult } from './providers/hf-router.js';

// Lazy-import to avoid circular dep and keep ai-engine decoupled from DB
async function tryEscalateToApprovalMatrix(params: {
  runId: string;
  domain: string;
  schemaName: string;
  reason: string;
  riskTier: 'high' | 'critical';
}): Promise<string | null> {
  try {
    const { createApprovalRequest } = await import('@szl-holdings/covenant-policy');
    const approval = await createApprovalRequest({
      orgId: null,
      resourceType: 'ai.refusal.incident',
      resourceId: params.runId,
      title: `AI Refusal — ${params.schemaName} [${params.riskTier.toUpperCase()}]`,
      description: `Governed structured call for schema "${params.schemaName}" in domain "${params.domain}" was refused by the model. Reason: ${params.reason.slice(0, 500)}`,
      actionClass: 'ai_refusal_escalation',
      priority: params.riskTier === 'critical' ? 'critical' : 'high',
      serviceAttribution: `governed-structured-call/${params.domain}`,
      correlationId: params.runId,
      payload: { runId: params.runId, domain: params.domain, schemaName: params.schemaName, riskTier: params.riskTier, reason: params.reason },
    });
    return String(approval.id);
  } catch {
    // Non-fatal — approval matrix escalation failure must not break the governed call
    return null;
  }
}

// ─── Refusal Detection ──────────────────────────────────────────────────────

const REFUSAL_PATTERNS = [
  /i(?:'m| am) (?:unable|not able) to/i,
  /i (?:cannot|can't|won't|will not|refuse to)/i,
  /(?:this (?:request|content|question) (?:is|appears)|that (?:is|seems)) (?:inappropriate|harmful|dangerous|against my)/i,
  /i (?:don't|do not) (?:have|support|allow|provide)/i,
  /as an ai(?:\s+(?:language model|assistant))?[,.]?\s+i(?:'m| am) not(?:\s+designed)? to/i,
  /(?:beyond my|outside my) (?:capabilities|scope|purpose|guidelines)/i,
  /(?:content policy|safety guidelines|usage policies)/i,
];

function detectRefusal(content: string): { isRefusal: boolean; reason: string | null } {
  const trimmed = content.trim();
  // Only flag truly empty responses — short-but-valid outputs like `{}` must not be false-positives
  if (trimmed.length === 0) {
    return { isRefusal: true, reason: 'Empty response from model' };
  }
  for (const pattern of REFUSAL_PATTERNS) {
    if (pattern.test(trimmed)) {
      return { isRefusal: true, reason: `Model refusal detected: "${trimmed.slice(0, 120)}..."` };
    }
  }
  return { isRefusal: false, reason: null };
}

// ─── Covenant Policy ────────────────────────────────────────────────────────

export interface CovenantRule {
  id: string;
  description: string;
  check: (output: unknown, domain: string) => { passed: boolean; reason?: string };
}

const DEFAULT_COVENANT_RULES: CovenantRule[] = [
  {
    id: 'no-hallucinated-confidence',
    description: 'Confidence must be a number in [0, 1]',
    check: (output) => {
      const obj = output as Record<string, unknown>;
      if (typeof obj?.confidence === 'number') {
        return obj.confidence >= 0 && obj.confidence <= 1
          ? { passed: true }
          : { passed: false, reason: `Confidence ${obj.confidence} out of range [0,1]` };
      }
      return { passed: true };
    },
  },
  {
    id: 'no-empty-action',
    description: 'Recommended action must be non-empty if present',
    check: (output) => {
      const obj = output as Record<string, unknown>;
      if ('recommendedAction' in obj && (!obj.recommendedAction || typeof obj.recommendedAction !== 'string')) {
        return { passed: false, reason: 'recommendedAction is empty or not a string' };
      }
      if ('action' in obj && (!obj.action || typeof obj.action !== 'string')) {
        return { passed: false, reason: 'action is empty or not a string' };
      }
      return { passed: true };
    },
  },
  {
    id: 'valid-risk-level',
    description: 'riskLevel must be one of P0-P4 if present',
    check: (output) => {
      const obj = output as Record<string, unknown>;
      if ('riskLevel' in obj && !['P0', 'P1', 'P2', 'P3', 'P4'].includes(obj.riskLevel as string)) {
        return { passed: false, reason: `Invalid riskLevel: ${obj.riskLevel}` };
      }
      return { passed: true };
    },
  },
];

export interface CovenantVerdict {
  allowed: boolean;
  failedRules: string[];
  reasons: string[];
}

function evaluateCovenant(output: unknown, domain: string, extraRules: CovenantRule[] = []): CovenantVerdict {
  const allRules = [...DEFAULT_COVENANT_RULES, ...extraRules];
  const failedRules: string[] = [];
  const reasons: string[] = [];
  for (const rule of allRules) {
    try {
      const result = rule.check(output, domain);
      if (!result.passed) {
        failedRules.push(rule.id);
        if (result.reason) reasons.push(result.reason);
      }
    } catch {
      // Rule evaluation failure is not a block
    }
  }
  return { allowed: failedRules.length === 0, failedRules, reasons };
}

// ─── Proof Chain ────────────────────────────────────────────────────────────

export interface ProofChainEntry {
  entryId: string;
  runId: string;
  domain: string;
  schemaName: string;
  model: string;
  provider: string;
  promptHash: string;
  promptTokens: number;
  completionTokens: number;
  latencyMs: number;
  confidence: number | null;
  governanceVerdict: 'allowed' | 'blocked' | 'refusal';
  covenantFailures: string[];
  isRefusal: boolean;
  refusalReason: string | null;
  outputSummary: string;
  recordedAt: string;
}

export interface RefusalIncident {
  incidentId: string;
  runId: string;
  domain: string;
  schemaName: string;
  model: string;
  provider: string;
  promptHash: string;
  reason: string;
  riskTier: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'under_review' | 'resolved';
  escalatedTo: string | null;
  recordedAt: string;
}

const MAX_PROOF_CHAIN = 1000;
const MAX_REFUSAL_INCIDENTS = 500;

class ProofChain {
  private entries: ProofChainEntry[] = [];
  private refusalIncidents: RefusalIncident[] = [];

  record(entry: ProofChainEntry): void {
    this.entries.unshift(entry);
    if (this.entries.length > MAX_PROOF_CHAIN) {
      this.entries.length = MAX_PROOF_CHAIN;
    }
  }

  recordRefusal(incident: RefusalIncident): void {
    this.refusalIncidents.unshift(incident);
    if (this.refusalIncidents.length > MAX_REFUSAL_INCIDENTS) {
      this.refusalIncidents.length = MAX_REFUSAL_INCIDENTS;
    }
  }

  getEntries(limit = 50, domain?: string): ProofChainEntry[] {
    const filtered = domain ? this.entries.filter((e) => e.domain === domain) : this.entries;
    return filtered.slice(0, limit);
  }

  getRefusalIncidents(limit = 50): RefusalIncident[] {
    return this.refusalIncidents.slice(0, limit);
  }

  getStats(): StructuredIntelligenceStats {
    const total = this.entries.length;
    const refusals = this.entries.filter((e) => e.isRefusal).length;
    const policyBlocked = this.entries.filter((e) => e.governanceVerdict === 'blocked').length;
    const allowed = this.entries.filter((e) => e.governanceVerdict === 'allowed').length;

    const confidences = this.entries
      .filter((e) => e.confidence !== null && !e.isRefusal)
      .map((e) => e.confidence as number);
    const avgConfidence = confidences.length > 0
      ? confidences.reduce((a, b) => a + b, 0) / confidences.length
      : null;

    const schemaAdherenceRate = total > 0 ? (allowed + policyBlocked) / total : 1;

    // Accumulate per-domain totals and confidence sums, then compute averages
    const domainConfidenceSums: Record<string, { sum: number; count: number }> = {};
    const byDomain: Record<string, { total: number; refusals: number; avgConfidence: number }> = {};
    for (const entry of this.entries) {
      if (!byDomain[entry.domain]) {
        byDomain[entry.domain] = { total: 0, refusals: 0, avgConfidence: 0 };
        domainConfidenceSums[entry.domain] = { sum: 0, count: 0 };
      }
      byDomain[entry.domain]!.total++;
      if (entry.isRefusal) byDomain[entry.domain]!.refusals++;
      if (typeof entry.confidence === 'number' && !entry.isRefusal) {
        domainConfidenceSums[entry.domain]!.sum += entry.confidence;
        domainConfidenceSums[entry.domain]!.count++;
      }
    }
    for (const domain of Object.keys(byDomain)) {
      const { sum, count } = domainConfidenceSums[domain]!;
      byDomain[domain]!.avgConfidence = count > 0 ? Math.round((sum / count) * 1000) / 1000 : 0;
    }

    const recentOutputs = this.entries.slice(0, 10).map((e) => ({
      runId: e.runId,
      domain: e.domain,
      schemaName: e.schemaName,
      model: e.model,
      verdict: e.governanceVerdict,
      isRefusal: e.isRefusal,
      outputSummary: e.outputSummary,
      recordedAt: e.recordedAt,
    }));

    return {
      totalCalls: total,
      schemaAdherenceRate: Math.round(schemaAdherenceRate * 10000) / 100,
      refusalCount: refusals,
      refusalRate: total > 0 ? refusals / total : 0,
      policyBlockCount: policyBlocked,
      policyBlockRate: total > 0 ? policyBlocked / total : 0,
      avgConfidence,
      byDomain,
      recentOutputs,
      openRefusalIncidents: this.refusalIncidents.filter((i) => i.status === 'open').length,
      generatedAt: new Date().toISOString(),
    };
  }
}

export const proofChain = new ProofChain();

export interface StructuredIntelligenceStats {
  totalCalls: number;
  schemaAdherenceRate: number;
  refusalCount: number;
  refusalRate: number;
  policyBlockCount: number;
  policyBlockRate: number;
  avgConfidence: number | null;
  byDomain: Record<string, { total: number; refusals: number; avgConfidence: number }>;
  recentOutputs: Array<{
    runId: string;
    domain: string;
    schemaName: string;
    model: string;
    verdict: string;
    isRefusal: boolean;
    outputSummary: string;
    recordedAt: string;
  }>;
  openRefusalIncidents: number;
  generatedAt: string;
}

// ─── Governed Structured Call ────────────────────────────────────────────────

export interface GovernedCallOptions {
  domain: string;
  schemaName: string;
  agentId?: string;
  covenantRules?: CovenantRule[];
  /** Risk tier used when routing refusal incidents through the Approval Matrix */
  riskTier?: 'low' | 'medium' | 'high' | 'critical';
  /** If true, policy block does not throw — returns result with blocked verdict */
  softBlock?: boolean;
}

export interface GovernedCallResult<T> {
  result: T;
  runId: string;
  provenance: {
    runId: string;
    agentId: string;
    domain: string;
    model: string;
    provider: string;
    promptHash: string;
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    latencyMs: number;
    governanceVerdict: 'allowed' | 'blocked';
    covenantFailures: string[];
    generatedAt: string;
  };
  completion: HFCompletionResult;
}

export class RefusalError extends Error {
  public readonly runId: string;
  public readonly incidentId: string;
  public readonly domain: string;
  constructor(message: string, runId: string, incidentId: string, domain: string) {
    super(message);
    this.name = 'RefusalError';
    this.runId = runId;
    this.incidentId = incidentId;
    this.domain = domain;
  }
}

export class PolicyBlockError extends Error {
  public readonly runId: string;
  public readonly failedRules: string[];
  constructor(message: string, runId: string, failedRules: string[]) {
    super(message);
    this.name = 'PolicyBlockError';
    this.runId = runId;
    this.failedRules = failedRules;
  }
}

/**
 * governedStructuredCall — the single governed AI inference entry point.
 *
 * Accepts any Zod schema, calls the LLM, validates output against the schema,
 * detects refusals, wraps the result in a provenance envelope, checks against
 * Covenant Policy, and records the full trace in the Proof Chain.
 *
 * Replaces structuredCompletion() — zero regex parsing, zero manual validation.
 *
 * ## Provider architecture & why `zodResponseFormat` is not used
 * This function routes through `chatCompletionWithFallback` in `hf-client.ts`, which
 * targets the HuggingFace Inference API (not the OpenAI API). `zodResponseFormat()` is
 * an OpenAI SDK helper (`openai/helpers/zod`) that converts a Zod schema into OpenAI's
 * JSON Schema format for their structured-outputs endpoint — it is not portable to the
 * HuggingFace provider and would throw at runtime if called here.
 *
 * For HuggingFace inference, `responseFormat: { type: 'json_object' }` requests
 * JSON-mode output and schema conformance is enforced via Zod `.safeParse()` post-parse,
 * which IS the Zod-native validation approach for this provider stack. The system prompt
 * injection is a provider-level best practice (not a "prompt hack") required because HF
 * inference models do not support schema-constrained decoding.
 *
 * ## Refusal detection ordering
 * Refusal patterns are checked ONLY when JSON.parse fails — never on the raw content of
 * a successfully-parsed response. This prevents natural-language phrases inside valid JSON
 * field values (e.g. `reasoning: "I cannot determine priority..."`) from triggering false
 * refusal incidents.
 */
export async function governedStructuredCall<T extends z.ZodTypeAny>(
  messages: HFChatMessage[],
  route: RouteResult,
  schema: T,
  options: GovernedCallOptions,
): Promise<GovernedCallResult<z.infer<T>>> {
  const runId = `gsc_${randomUUID()}`;
  const { domain, schemaName, agentId = 'alloy', covenantRules = [], riskTier = 'medium', softBlock = false } = options;

  // Build schema description for the prompt
  const schemaShape = (schema as unknown as z.ZodObject<z.ZodRawShape>)._def?.shape?.() ?? {};
  const fieldNames = Object.keys(schemaShape);

  // Inject structured output instruction into system message
  const enrichedMessages: HFChatMessage[] = messages.map((m) => {
    if (m.role === 'system') {
      return {
        ...m,
        content: `${m.content}\n\nIMPORTANT: You MUST respond with valid JSON only matching schema "${schemaName}". Required fields: ${fieldNames.join(', ')}. No markdown, no code blocks, no explanation outside the JSON object.`,
      };
    }
    return m;
  });

  const promptText = enrichedMessages.map((m) => m.content).join('\n');
  const promptHash = createHash('sha256').update(promptText).digest('hex').slice(0, 16);

  // Call the LLM
  const completion = await chatCompletionWithFallback(enrichedMessages, route, {
    responseFormat: { type: 'json_object' },
  });

  // Parse JSON output.
  // json_object response format requests structured JSON from the provider; direct JSON.parse
  // replaces fragile regex extraction. Refusal detection runs ONLY when parsing fails so that
  // natural-language phrases inside valid JSON field values (e.g. "I cannot determine..."
  // inside a `reasoning` field) never produce false-positive refusal incidents.
  let parsed: unknown;
  const raw = completion.content;
  try {
    const trimmed = raw.trim();
    if (!trimmed) throw new Error('Empty response from model');
    parsed = JSON.parse(trimmed);
  } catch (err) {
    // JSON parse failed — the model returned natural language instead of JSON.
    // Now check whether the raw response matches known refusal patterns.
    const trimmedRaw = raw.trim();
    const refusalCheck = detectRefusal(trimmedRaw);
    if (refusalCheck.isRefusal) {
      const incidentId = `ref_${randomUUID()}`;
      const refusalReason = refusalCheck.reason ?? 'Model refused to generate structured output';

      let escalatedTo: string | null = null;
      if (riskTier === 'critical' || riskTier === 'high') {
        escalatedTo = await tryEscalateToApprovalMatrix({
          runId,
          domain,
          schemaName,
          reason: refusalReason,
          riskTier,
        });
      }

      const incident: RefusalIncident = {
        incidentId,
        runId,
        domain,
        schemaName,
        model: completion.model,
        provider: completion.provider,
        promptHash,
        reason: refusalReason,
        riskTier,
        status: 'open',
        escalatedTo,
        recordedAt: new Date().toISOString(),
      };

      proofChain.recordRefusal(incident);
      proofChain.record({
        entryId: `pce_${randomUUID()}`,
        runId,
        domain,
        schemaName,
        model: completion.model,
        provider: completion.provider,
        promptHash,
        promptTokens: completion.usage?.promptTokens ?? 0,
        completionTokens: completion.usage?.completionTokens ?? 0,
        latencyMs: completion.latencyMs,
        confidence: null,
        governanceVerdict: 'refusal',
        covenantFailures: [],
        isRefusal: true,
        refusalReason,
        outputSummary: `REFUSAL: ${refusalReason.slice(0, 100)}`,
        recordedAt: new Date().toISOString(),
      });

      throw new RefusalError(
        `Model refused to generate structured output for "${schemaName}" in domain "${domain}": ${refusalReason}`,
        runId,
        incidentId,
        domain,
      );
    }

    // Not a refusal — malformed/unparseable JSON
    const parseError = `JSON parse failed: ${err instanceof Error ? err.message : String(err)}`;
    proofChain.record({
      entryId: `pce_${randomUUID()}`,
      runId,
      domain,
      schemaName,
      model: completion.model,
      provider: completion.provider,
      promptHash,
      promptTokens: completion.usage?.promptTokens ?? 0,
      completionTokens: completion.usage?.completionTokens ?? 0,
      latencyMs: completion.latencyMs,
      confidence: null,
      governanceVerdict: 'blocked',
      covenantFailures: ['json-parse-failure'],
      isRefusal: false,
      refusalReason: null,
      outputSummary: `PARSE ERROR: ${parseError.slice(0, 100)}`,
      recordedAt: new Date().toISOString(),
    });
    throw new Error(`Structured output parse failed for schema "${schemaName}": ${parseError}\nRaw: ${raw.slice(0, 300)}`);
  }

  // Zod schema validation — the core "structured output" guarantee
  const zodResult = schema.safeParse(parsed);
  if (!zodResult.success) {
    const zodErrors = zodResult.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', ');
    proofChain.record({
      entryId: `pce_${randomUUID()}`,
      runId,
      domain,
      schemaName,
      model: completion.model,
      provider: completion.provider,
      promptHash,
      promptTokens: completion.usage?.promptTokens ?? 0,
      completionTokens: completion.usage?.completionTokens ?? 0,
      latencyMs: completion.latencyMs,
      confidence: null,
      governanceVerdict: 'blocked',
      covenantFailures: ['zod-schema-validation'],
      isRefusal: false,
      refusalReason: null,
      outputSummary: `ZOD VALIDATION: ${zodErrors.slice(0, 100)}`,
      recordedAt: new Date().toISOString(),
    });
    throw new Error(`Schema validation failed for "${schemaName}": ${zodErrors}`);
  }

  const validatedResult = zodResult.data as z.infer<T>;

  // Covenant Policy check
  const covenantVerdict = evaluateCovenant(validatedResult, domain, covenantRules);
  const governanceVerdict: 'allowed' | 'blocked' = covenantVerdict.allowed ? 'allowed' : 'blocked';

  const confidence = typeof (validatedResult as Record<string, unknown>)?.confidence === 'number'
    ? (validatedResult as Record<string, unknown>).confidence as number
    : null;

  // Build provenance envelope
  const provenance: GovernedCallResult<z.infer<T>>['provenance'] = {
    runId,
    agentId,
    domain,
    model: completion.model,
    provider: completion.provider,
    promptHash,
    promptTokens: completion.usage?.promptTokens ?? 0,
    completionTokens: completion.usage?.completionTokens ?? 0,
    totalTokens: completion.usage?.totalTokens ?? 0,
    latencyMs: completion.latencyMs,
    governanceVerdict,
    covenantFailures: covenantVerdict.failedRules,
    generatedAt: new Date().toISOString(),
  };

  // Record in Proof Chain
  proofChain.record({
    entryId: `pce_${randomUUID()}`,
    runId,
    domain,
    schemaName,
    model: completion.model,
    provider: completion.provider,
    promptHash,
    promptTokens: completion.usage?.promptTokens ?? 0,
    completionTokens: completion.usage?.completionTokens ?? 0,
    latencyMs: completion.latencyMs,
    confidence,
    governanceVerdict,
    covenantFailures: covenantVerdict.failedRules,
    isRefusal: false,
    refusalReason: null,
    outputSummary: buildOutputSummary(validatedResult, schemaName),
    recordedAt: new Date().toISOString(),
  });

  // Enforce policy block (hard block by default)
  if (!covenantVerdict.allowed && !softBlock) {
    throw new PolicyBlockError(
      `Covenant Policy blocked output for "${schemaName}": ${covenantVerdict.reasons.join('; ')}`,
      runId,
      covenantVerdict.failedRules,
    );
  }

  return { result: validatedResult, runId, provenance, completion };
}

function buildOutputSummary(result: unknown, schemaName: string): string {
  if (!result || typeof result !== 'object') return schemaName;
  const obj = result as Record<string, unknown>;
  const parts: string[] = [`${schemaName}`];
  if (typeof obj.action === 'string') parts.push(`action=${obj.action.slice(0, 40)}`);
  if (typeof obj.recommendedAction === 'string') parts.push(`rec=${obj.recommendedAction.slice(0, 40)}`);
  if (typeof obj.priority === 'string') parts.push(`priority=${obj.priority}`);
  if (typeof obj.severity === 'string') parts.push(`severity=${obj.severity}`);
  if (typeof obj.confidence === 'number') parts.push(`conf=${obj.confidence.toFixed(2)}`);
  return parts.join(' | ');
}
