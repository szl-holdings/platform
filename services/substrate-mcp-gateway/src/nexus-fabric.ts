/**
 * PRAXIS Intelligence Fabric — Governed Cognition Over MCP
 *
 * This module adds the innovation layer that no other MCP deployment provides:
 *  1. Assessment envelope      — explicitly unvalidated heuristic metadata
 *  2. Governance receipt       — every decision carries policy/correlation metadata
 *  3. Convergence intelligence — cross-domain signal correlations as MCP Resources
 *  4. Signal fixtures          — explicitly synthetic resources while Prism Bus is unavailable
 *  5. NuroMesh agent registry  — external delegation only when an endpoint is configured
 *  6. Evidence graph           — full provenance chain behind every AI decision
 */

import { createHash, randomUUID } from 'node:crypto';
import { appendFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { isProductionRuntime } from './runtime-config.js';
import { getToolAccessRequirement } from './tool-access.js';

// ─── Types ─────────────────────────────────────────────────────────────────────

export type HallucinationRiskLevel = 'low' | 'medium' | 'high' | 'unknown';
export type ReasoningQualityLabel =
  | 'rigorous'
  | 'adequate'
  | 'uncertain'
  | 'degraded'
  | 'unassessed';

export interface PRAXISConsciousnessEnvelope {
  assessmentMethod: 'heuristic-unvalidated' | 'none';
  assessmentStatus: 'heuristic' | 'unassessed';
  evidenceState: 'UNAVAILABLE';
  confidence: number | null;
  hallucinationRisk: {
    level: HallucinationRiskLevel;
    score: number | null;
    explanation: string;
  };
  reasoningQuality: ReasoningQualityLabel;
  reasoningQualityScore: number | null;
  uncertaintyQuantification: {
    epistemicUncertainty: number | null;
    aleatoricUncertainty: number | null;
    totalUncertainty: number | null;
  };
  innerMonologueSummary: string;
  isDeterministic: boolean | null;
  evaluatedAt: string;
}

export interface PRAXISProofEnvelope {
  proofHash: string;
  /** This release does not provide a keyed signature or immutable proof ledger. */
  evidenceState: 'UNAVAILABLE';
  verificationStatus: 'unverified';
  covenantEvaluation: {
    allowed: boolean;
    policyResult: 'allow' | 'deny' | 'passthrough';
    reason: string;
    matchedPolicies: string[];
  };
  actor: string;
  issuedAt: string;
  verificationPath: string;
}

export interface PRAXISEnvelopes {
  'x-nexus-consciousness': PRAXISConsciousnessEnvelope;
  'x-nexus-proof': PRAXISProofEnvelope;
}

// ─── Governance Receipt Store ──────────────────────────────────────────────────
// The in-memory index and optional JSONL file below are diagnostic correlation
// records only. They are not signed, immutable, or independently verifiable.
// We therefore expose an explicit UNAVAILABLE evidence state and never describe
// a matching record as a cryptographically verified proof. A local JSONL mirror
// is used only when PRAXIS_PROOF_WAL_PATH is explicitly configured.

export interface ProofRecord {
  proofHash: string;
  tenantId?: string;
  toolName: string;
  actor: string;
  issuedAt: string;
  confidence: number | null;
  covenantAllowed: boolean;
  covenantReason: string;
  responseDigest: string;
}

const PROOF_WAL_PATH = process.env['PRAXIS_PROOF_WAL_PATH']?.trim() || undefined;

const MAX_PROOF_HISTORY = 2_000;
const proofStore = new Map<string, ProofRecord>();
const proofOrder: string[] = [];

/** Hydrate the diagnostic in-memory index from an explicitly configured mirror. */
function hydrateProofsFromWal(): void {
  if (!PROOF_WAL_PATH || !existsSync(PROOF_WAL_PATH)) return;
  try {
    const lines = readFileSync(PROOF_WAL_PATH, 'utf-8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      try {
        const record = JSON.parse(trimmed) as ProofRecord;
        if (record.proofHash && !proofStore.has(record.proofHash)) {
          proofStore.set(record.proofHash, record);
          proofOrder.push(record.proofHash);
          // Keep only the last MAX_PROOF_HISTORY entries in memory
          if (proofOrder.length > MAX_PROOF_HISTORY) {
            const evicted = proofOrder.shift();
            if (evicted) proofStore.delete(evicted);
          }
        }
      } catch {
        // Skip malformed lines — WAL may contain partial writes from SIGKILL
      }
    }
  } catch (err) {
    // Non-fatal: the gateway can run without prior proof history
    console.warn('[nexus-fabric] WAL hydration skipped:', (err as Error).message);
  }
}

/** Best-effort append to the optional, non-authoritative correlation log. */
function appendProofToWal(record: ProofRecord): void {
  if (!PROOF_WAL_PATH) return;
  try {
    const walDir = dirname(PROOF_WAL_PATH);
    if (!existsSync(walDir)) mkdirSync(walDir, { recursive: true });
    appendFileSync(PROOF_WAL_PATH, `${JSON.stringify(record)}\n`, 'utf-8');
  } catch (err) {
    // This mirror is non-authoritative. Surface the failure without claiming
    // persistence; the capability status remains UNAVAILABLE either way.
    console.error('[nexus-fabric] correlation log write failed:', (err as Error).message);
  }
}

// Hydrate from WAL at module load (runs once on process startup)
hydrateProofsFromWal();

function storeProof(record: ProofRecord): void {
  if (!proofStore.has(record.proofHash)) {
    // Mirror the receipt when configured, then retain it in the transient index.
    appendProofToWal(record);
    proofStore.set(record.proofHash, record);
    proofOrder.push(record.proofHash);
    if (proofOrder.length > MAX_PROOF_HISTORY) {
      const evicted = proofOrder.shift();
      if (evicted) proofStore.delete(evicted);
    }
  }
}

export function lookupProof(hash: string, tenantId?: string): ProofRecord | undefined {
  // Fast path: in-memory index (most recent 2,000 proofs)
  const cached = proofStore.get(hash);
  if (cached && cached.tenantId === tenantId) return cached;

  // Fallback path: linear scan of the optional diagnostic mirror. Tenant
  // ownership is part of the lookup key so cross-tenant hashes are indistinguishable
  // from unknown hashes.
  if (!PROOF_WAL_PATH || !existsSync(PROOF_WAL_PATH)) return undefined;
  try {
    const lines = readFileSync(PROOF_WAL_PATH, 'utf-8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      try {
        const record = JSON.parse(trimmed) as ProofRecord;
        if (record.proofHash === hash && record.tenantId === tenantId) return record;
      } catch {
        // Skip malformed lines
      }
    }
  } catch {
    // Non-fatal: WAL unavailable; return undefined
  }
  return undefined;
}

export function recordProof(record: ProofRecord): void {
  storeProof(record);
}

export function getRecentProofs(limit = 20, tenantId?: string): ProofRecord[] {
  return [...proofOrder]
    .reverse()
    .map((h) => proofStore.get(h))
    .filter((r): r is ProofRecord => r !== undefined && r.tenantId === tenantId)
    .slice(0, limit);
}

// ─── AI tool detection ─────────────────────────────────────────────────────────
// Tools that trigger LLM inference — these get richer consciousness assessments.

const AI_TOOL_PREFIXES = ['substrate_submit_run', 'substrate_counterfactual', 'agent_delegate'];
const AI_TOOL_KEYWORDS = ['analyze', 'infer', 'reason', 'synthesize', 'recommend', 'evaluate'];

const BUILTIN_ASSESSABLE_TOOLS = new Set([
  'substrate_submit_run',
  'substrate_get_run',
  'substrate_replay',
  'substrate_counterfactual',
  'substrate_list_approvals',
  'substrate_approve',
  'substrate_reject',
  'substrate_list_workflows',
  'substrate_search_servers',
  'search_available_servers',
  'substrate_enable_server',
  'enable_server',
  'substrate_disable_server',
  'disable_server',
  'agent_delegate',
]);

function isAiTool(toolName: string): boolean {
  if (AI_TOOL_PREFIXES.some((p) => toolName.startsWith(p))) return true;
  const lower = toolName.toLowerCase();
  return AI_TOOL_KEYWORDS.some((k) => lower.includes(k));
}

// ─── 1. Heuristic Assessment Envelope Builder ─────────────────────────────────

function unassessedEnvelope(toolName: string, reason: string): PRAXISConsciousnessEnvelope {
  return {
    assessmentMethod: 'none',
    assessmentStatus: 'unassessed',
    evidenceState: 'UNAVAILABLE',
    confidence: null,
    hallucinationRisk: {
      level: 'unknown',
      score: null,
      explanation: reason,
    },
    reasoningQuality: 'unassessed',
    reasoningQualityScore: null,
    uncertaintyQuantification: {
      epistemicUncertainty: null,
      aleatoricUncertainty: null,
      totalUncertainty: null,
    },
    innerMonologueSummary: `No calibrated assessment is available for '${toolName}'.`,
    isDeterministic: null,
    evaluatedAt: new Date().toISOString(),
  };
}

function computeHallucinationRisk(
  toolName: string,
  isAi: boolean,
  responseLength: number,
): { level: HallucinationRiskLevel; score: number; explanation: string } {
  if (!isAi) {
    return {
      level: 'low',
      score: 0.05,
      explanation:
        'Static tool-name mapping categorizes this built-in operation as non-generative; this heuristic is not calibrated evidence.',
    };
  }

  let score = 0.1;
  const factors: string[] = [];

  if (responseLength < 100) {
    score += 0.25;
    factors.push('Short response — may indicate ambiguous or insufficient output');
  }
  if (toolName.includes('counterfactual')) {
    score += 0.15;
    factors.push('Counterfactual analysis — hypothetical reasoning increases uncertainty');
  }
  if (toolName.includes('delegate')) {
    score += 0.1;
    factors.push('Agent delegation — response quality depends on downstream agent reliability');
  }

  const level: HallucinationRiskLevel = score >= 0.5 ? 'high' : score >= 0.25 ? 'medium' : 'low';
  const explanation =
    factors.length > 0
      ? factors.join('; ')
      : 'The static heuristic found no additional name/length risk flags; this is not a calibrated assessment.';

  return { level, score: Math.min(1, score), explanation };
}

function computeReasoningQuality(
  isAi: boolean,
  responseLength: number,
  isError: boolean,
): { quality: ReasoningQualityLabel; score: number } {
  if (isError) return { quality: 'degraded', score: 0.1 };
  if (!isAi) return { quality: 'rigorous', score: 1.0 };

  let score = 0.5;
  if (responseLength > 500) score += 0.2;
  if (responseLength > 1500) score += 0.1;
  if (responseLength < 50) score -= 0.2;

  if (score >= 0.8) return { quality: 'rigorous', score };
  if (score >= 0.6) return { quality: 'adequate', score };
  if (score >= 0.35) return { quality: 'uncertain', score };
  return { quality: 'degraded', score };
}

function buildInnerMonologueSummary(toolName: string, isAi: boolean, isError: boolean): string {
  if (isError) {
    return `Tool '${toolName}' returned an error state. Reasoning path terminated; output should not be acted upon without human review.`;
  }
  if (!isAi) {
    return `Static metadata categorizes '${toolName}' as a built-in non-generative operation. This categorization has not been independently validated.`;
  }
  const verb = toolName.includes('submit')
    ? 'orchestrated a substrate workflow run'
    : toolName.includes('counterfactual')
      ? 'performed counterfactual analysis'
      : toolName.includes('delegate')
        ? 'delegated to a NuroMesh domain agent'
        : 'processed the request through the AI engine';
  return `A static, unvalidated heuristic categorized '${toolName}' as an AI-related operation that ${verb}. The numeric fields are development diagnostics, not calibrated confidence or evidence.`;
}

export function buildConsciousnessEnvelope(params: {
  toolName: string;
  responseText: string;
  isError: boolean;
}): PRAXISConsciousnessEnvelope {
  if (isProductionRuntime()) {
    return unassessedEnvelope(
      params.toolName,
      'Heuristic assessment output is disabled in production because no calibrated evaluator is deployed.',
    );
  }
  if (!BUILTIN_ASSESSABLE_TOOLS.has(params.toolName)) {
    return unassessedEnvelope(
      params.toolName,
      'Unknown or dynamic tools are not classified by tool-name heuristics.',
    );
  }

  const isAi = isAiTool(params.toolName);
  const responseLength = params.responseText.length;
  const hallucinationRisk = computeHallucinationRisk(params.toolName, isAi, responseLength);
  const { quality, score: qualityScore } = computeReasoningQuality(
    isAi,
    responseLength,
    params.isError,
  );

  const baseConfidence = params.isError ? 0.1 : isAi ? 0.72 : 0.97;
  const confidenceAdjustment = hallucinationRisk.score * -0.3 + (qualityScore - 0.5) * 0.2;
  const confidence = Math.max(0.05, Math.min(0.99, baseConfidence + confidenceAdjustment));

  const epistemicUncertainty = isAi ? Math.max(0, 1 - qualityScore) * 0.6 : 0.02;
  const aleatoricUncertainty = hallucinationRisk.score * 0.4;
  const totalUncertainty = Math.min(1, epistemicUncertainty + aleatoricUncertainty);

  return {
    assessmentMethod: 'heuristic-unvalidated',
    assessmentStatus: 'heuristic',
    evidenceState: 'UNAVAILABLE',
    confidence: Math.round(confidence * 1000) / 1000,
    hallucinationRisk,
    reasoningQuality: quality,
    reasoningQualityScore: Math.round(qualityScore * 1000) / 1000,
    uncertaintyQuantification: {
      epistemicUncertainty: Math.round(epistemicUncertainty * 1000) / 1000,
      aleatoricUncertainty: Math.round(aleatoricUncertainty * 1000) / 1000,
      totalUncertainty: Math.round(totalUncertainty * 1000) / 1000,
    },
    innerMonologueSummary: buildInnerMonologueSummary(params.toolName, isAi, params.isError),
    isDeterministic: !isAi,
    evaluatedAt: new Date().toISOString(),
  };
}

// ─── 2. Proof Envelope Builder ─────────────────────────────────────────────────

function hashProofInputs(
  toolName: string,
  actor: string,
  tenantId: string | undefined,
  issuedAt: string,
  responseDigest: string,
): string {
  return createHash('sha256')
    .update(`nexus:${tenantId ?? 'unscoped'}:${toolName}:${actor}:${issuedAt}:${responseDigest}`)
    .digest('hex');
}

/**
 * Evaluate the pre-dispatch covenant policy for a tool invocation.
 *
 * The domain whitelist used by synthetic signal resources is not a tenant
 * registry. Signed enterprise tenants therefore are not rejected merely because
 * their identifier is absent from that fixture mapping. Transport scope checks
 * authorize the tenant; this gate independently prevents anonymous mutations.
 */
export function evaluateCovenant(
  toolName: string,
  actor: string,
  tenantId?: string,
): {
  allowed: boolean;
  policyResult: 'allow' | 'deny' | 'passthrough';
  reason: string;
  matchedPolicies: string[];
} {
  const isMutation = getToolAccessRequirement(toolName) !== 'read';
  const isAuthenticated =
    actor.trim().length > 0 &&
    actor !== 'anonymous' &&
    actor !== 'unknown' &&
    !actor.startsWith('anonymous:');

  if (isMutation && !isAuthenticated) {
    return {
      allowed: false,
      policyResult: 'deny',
      reason: `Mutating tool '${toolName}' blocked for an unauthenticated actor.`,
      matchedPolicies: ['nexus:mutation-authentication-guard', 'nexus:deny-before-dispatch'],
    };
  }

  if (isMutation) {
    return {
      allowed: true,
      policyResult: 'allow',
      reason: `Mutating tool '${toolName}' passed the authenticated pre-dispatch covenant gate${tenantId ? ` for tenant '${tenantId}'` : ''}.`,
      matchedPolicies: ['nexus:mutation-authentication-guard', 'nexus:pre-dispatch-enforcement'],
    };
  }

  return {
    allowed: true,
    policyResult: 'passthrough',
    reason: `Tool '${toolName}' passed standard covenant evaluation — not classified as high-risk.`,
    matchedPolicies: ['nexus:default-passthrough'],
  };
}

export function buildProofEnvelope(params: {
  toolName: string;
  actor: string;
  responseText: string;
  confidence: number | null;
  isError: boolean;
  /** Tenant identifier from the request context — used as real authorization input */
  tenantId?: string;
}): PRAXISProofEnvelope {
  const issuedAt = new Date().toISOString();
  const responseDigest = createHash('sha256').update(params.responseText).digest('hex');
  const proofHash = hashProofInputs(
    params.toolName,
    params.actor,
    params.tenantId,
    issuedAt,
    responseDigest,
  );

  const covenant = evaluateCovenant(params.toolName, params.actor, params.tenantId);

  const record: ProofRecord = {
    proofHash,
    tenantId: params.tenantId,
    toolName: params.toolName,
    actor: params.actor,
    issuedAt,
    confidence: params.confidence,
    covenantAllowed: covenant.allowed,
    covenantReason: covenant.reason,
    responseDigest,
  };
  storeProof(record);

  return {
    proofHash,
    evidenceState: 'UNAVAILABLE',
    verificationStatus: 'unverified',
    covenantEvaluation: {
      allowed: covenant.allowed,
      policyResult: covenant.policyResult,
      reason: covenant.reason,
      matchedPolicies: covenant.matchedPolicies,
    },
    actor: params.actor,
    issuedAt,
    verificationPath: `/mcp/nexus/verify/${proofHash}`,
  };
}

// ─── Envelope composer ─────────────────────────────────────────────────────────

export function buildPRAXISEnvelopes(params: {
  toolName: string;
  actor: string;
  responseText: string;
  isError: boolean;
  /** Tenant from the current request context — passed to evaluateCovenant() for real auth decisions */
  tenantId?: string;
}): PRAXISEnvelopes {
  const consciousness = buildConsciousnessEnvelope({
    toolName: params.toolName,
    responseText: params.responseText,
    isError: params.isError,
  });
  const proof = buildProofEnvelope({
    toolName: params.toolName,
    actor: params.actor,
    responseText: params.responseText,
    confidence: consciousness.confidence,
    isError: params.isError,
    tenantId: params.tenantId,
  });
  return {
    'x-nexus-consciousness': consciousness,
    'x-nexus-proof': proof,
  };
}

// ─── 3. Convergence Intelligence ──────────────────────────────────────────────
// Serves explicitly synthetic cross-domain fixtures. The production gateway
// does not deploy Prism Bus in this release.

export interface ConvergenceCorrelation {
  correlationId: string;
  contributingDomains: string[];
  signalCount: number;
  compoundRiskScore: number;
  summary: string;
  recommendedActions: string[];
  detectedAt: string;
  status: 'active' | 'resolved' | 'escalated';
}

const SYNTHETIC_CORRELATIONS: ConvergenceCorrelation[] = [
  {
    correlationId: 'conv-maritime-security-001',
    contributingDomains: ['vessels', 'aegis'],
    signalCount: 3,
    compoundRiskScore: 0.74,
    summary:
      'Vessel AIS dark period correlated with adversarial network probe from same geographic region.',
    recommendedActions: [
      'Alert maritime compliance team to the AIS gap',
      'Trigger Sentinel threat triage on the correlated network activity',
      'Initiate cross-domain risk escalation workflow',
    ],
    detectedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    status: 'active',
  },
  {
    correlationId: 'conv-realestate-legal-002',
    contributingDomains: ['terra', 'counsel'],
    signalCount: 2,
    compoundRiskScore: 0.61,
    summary:
      'Property valuation anomaly coincides with regulatory filing deadline exposure in same jurisdiction.',
    recommendedActions: [
      'Expedite legal review of pending filings',
      'Flag property transaction for enhanced due diligence',
    ],
    detectedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    status: 'active',
  },
];

const liveCorrelations: ConvergenceCorrelation[] = [];
const correlationHistory: ConvergenceCorrelation[] = [];
const MAX_CORRELATION_HISTORY = 200;

// ── Resource update notification callback ───────────────────────────────────
// Allows the MCP gateway to receive push events and forward
// notifications/resources/updated to subscribed MCP clients.
let _resourceUpdateCallback: ((uri: string) => void) | null = null;

export function setResourceUpdateCallback(cb: (uri: string) => void): void {
  _resourceUpdateCallback = cb;
}

export function startConvergenceBridge(): { started: false; reason: string } {
  return {
    started: false,
    reason:
      'The Prism Bus package is not part of the substrate gateway production closure; signal resources serve explicitly labelled synthetic fixtures.',
  };
}

export function getActiveCorrelations(): ConvergenceCorrelation[] {
  const live = liveCorrelations.filter((c) => c.status === 'active');
  return live.length > 0 ? live : SYNTHETIC_CORRELATIONS;
}

export function getCorrelationHistory(limit = 50): ConvergenceCorrelation[] {
  const hist = correlationHistory.slice(0, limit);
  if (hist.length === 0) {
    return SYNTHETIC_CORRELATIONS.map((c) => ({ ...c, status: 'resolved' as const }));
  }
  return hist;
}

export function getCorrelationById(correlationId: string): ConvergenceCorrelation | undefined {
  const all = [...liveCorrelations, ...correlationHistory, ...SYNTHETIC_CORRELATIONS];
  return all.find((c) => c.correlationId === correlationId);
}

// ─── 4. Signal Fixtures ───────────────────────────────────────────────────────
// Provides explicitly labelled synthetic signals for MCP schema/integration
// consumers while the Prism Bus production capability is unavailable.

export type PRAXISSignalDomain = 'maritime' | 'security' | 'realestate' | 'legal' | 'all';

export interface PRAXISDomainSignal {
  signalId: string;
  domain: string;
  eventType: string;
  severity: string;
  summary: string;
  intakeScore: number;
  entityResolution: string;
  policyEvaluationResult: string;
  recommendation: string | null;
  receivedAt: string;
}

const SYNTHETIC_SIGNALS: Record<string, PRAXISDomainSignal[]> = {
  maritime: [
    {
      signalId: 'sig-maritime-001',
      domain: 'vessels',
      eventType: 'domain_signal',
      severity: 'medium',
      summary: 'Vessel AURORA BOREALIS reported AIS dark period of 4.2 hours in contested waters.',
      intakeScore: 0.78,
      entityResolution: 'IMO:9234567 → AURORA BOREALIS (Bulk Carrier, Marshall Islands flag)',
      policyEvaluationResult: 'allow — standard maritime monitoring protocol',
      recommendation: 'Initiate route deviation inquiry and flag for Vessels anomaly review.',
      receivedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    },
  ],
  security: [
    {
      signalId: 'sig-security-001',
      domain: 'aegis',
      eventType: 'domain_signal',
      severity: 'high',
      summary:
        'Lateral movement pattern detected — 3 internal hosts pivoting from initial access point.',
      intakeScore: 0.91,
      entityResolution: 'Network: 10.42.17.0/24 → Production API cluster (Tenant: szl-core)',
      policyEvaluationResult: 'allow — SENTINEL triage authorized for critical tier',
      recommendation: 'Isolate affected subnet and trigger incident response workflow immediately.',
      receivedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    },
  ],
  realestate: [
    {
      signalId: 'sig-realestate-001',
      domain: 'terra',
      eventType: 'domain_signal',
      severity: 'low',
      summary:
        'Q2 portfolio valuation deviation: 7 assets showing >5% discount to underwriting model.',
      intakeScore: 0.62,
      entityResolution: 'Portfolio: SZL-RE-FUND-2 → Q2 2026 Quarterly Rebalance Cohort',
      policyEvaluationResult: 'passthrough — below anomaly escalation threshold',
      recommendation: null,
      receivedAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    },
  ],
  legal: [
    {
      signalId: 'sig-legal-001',
      domain: 'counsel',
      eventType: 'domain_signal',
      severity: 'medium',
      summary:
        'Regulatory filing deadline in 14 days — PRISM-2024-CC-0892 requires amended submission.',
      intakeScore: 0.83,
      entityResolution:
        'Matter: PRISM-2024-CC-0892 → Commercial Contract Dispute, Delaware Chancery',
      policyEvaluationResult: 'approval_required — regulatory filing requires Counsel sign-off',
      recommendation: 'Schedule legal review session and queue amended filing workflow.',
      receivedAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    },
  ],
};

// ── Tenant domain authorization ─────────────────────────────────────────────
// Maps tenant identifier keywords to the signal domains they are authorized
// to receive. Matching is substring-based on the lowercased tenantId.
const TENANT_DOMAIN_WHITELIST: Record<string, PRAXISSignalDomain[]> = {
  maritime: ['maritime'],
  vessels: ['maritime'],
  helmsman: ['maritime'],
  security: ['security'],
  sentra: ['security'],
  sentinel: ['security'],
  realestate: ['realestate'],
  terra: ['realestate'],
  legal: ['legal'],
  counsel: ['legal'],
  lexis: ['legal'],
  analytics: ['maritime', 'security', 'realestate', 'legal'],
  beacon: ['maritime', 'security', 'realestate', 'legal'],
  lyte: ['maritime', 'security', 'realestate', 'legal'],
  // Internal service identities — full cross-domain access for gateway and
  // API-key callers (actorIdToTenantId maps api-key actors to 'substrate-gateway')
  substrate: ['maritime', 'security', 'realestate', 'legal'],
  gateway: ['maritime', 'security', 'realestate', 'legal'],
};

function resolveAuthorizedDomains(
  tenantId: string,
  requested: PRAXISSignalDomain,
): PRAXISSignalDomain[] {
  const lower = tenantId.toLowerCase();
  const matchedKey = Object.keys(TENANT_DOMAIN_WHITELIST).find((k) => lower.includes(k));
  if (!matchedKey) {
    // Deny-by-default: unrecognized tenant IDs receive no signals
    // to prevent cross-tenant data exposure.
    return [];
  }
  const authorized: PRAXISSignalDomain[] = TENANT_DOMAIN_WHITELIST[matchedKey]!;

  if (requested === 'all') return authorized;
  return authorized.includes(requested) ? [requested] : [];
}

export async function getSignalsForDomain(
  domain: PRAXISSignalDomain,
  tenantId?: string,
): Promise<PRAXISDomainSignal[]> {
  const effectiveDomains: PRAXISSignalDomain[] =
    tenantId && tenantId !== 'mcp-resource' && tenantId !== 'global'
      ? resolveAuthorizedDomains(tenantId, domain)
      : domain === 'all'
        ? (['maritime', 'security', 'realestate', 'legal'] as PRAXISSignalDomain[])
        : [domain];

  return effectiveDomains.flatMap((d) => SYNTHETIC_SIGNALS[d] ?? []);
}

// ─── 5. NuroMesh Agent Registry ────────────────────────────────────────────────

export interface PRAXISAgentEntry {
  agentId: string;
  canonicalName: string;
  domain: string;
  description: string;
  capabilities: string[];
  confidenceProfile: {
    typicalConfidence: number;
    highStakeDomains: string[];
    preferredModel: string;
  };
  delegationProtocols: string[];
  availability: 'online' | 'degraded' | 'offline';
  /**
   * Optional external MCP server endpoint for outbound A2A federation.
   * Can also be set at runtime via MCP_AGENT_ENDPOINT_<AGENT_ID_UPPER> env var.
   * When present, delegateToAgent() will attempt to POST a tools/call JSON-RPC
   * request to `{externalEndpoint}/mcp` if the internal ai-engine mesh is unavailable.
   */
  externalEndpoint?: string;
}

export const PRAXIS_AGENT_REGISTRY: PRAXISAgentEntry[] = [
  {
    agentId: 'helmsman',
    canonicalName: 'Vessels',
    domain: 'maritime',
    // Canonical mapping: task designation Vessels → Vessels (brand-compliant)
    description:
      'Maritime intelligence specialist. Fleet tracking, AIS anomaly detection, route risk assessment, sanctions compliance.',
    capabilities: [
      'fleet_position_analysis',
      'route_risk_assessment',
      'sanctions_screening',
      'voyage_anomaly_detection',
    ],
    confidenceProfile: {
      typicalConfidence: 0.82,
      highStakeDomains: ['route_risk', 'sanctions', 'fleet_emergency'],
      preferredModel: 'claude-sonnet-4-6',
    },
    delegationProtocols: ['direct', 'multi_hypothesis', 'maker_checker'],
    availability: 'offline',
  },
  {
    agentId: 'sentinel',
    canonicalName: 'Sentra',
    domain: 'security',
    // Canonical mapping: task designation SENTINEL → Sentra (brand-compliant)
    description:
      'Cybersecurity intelligence and threat response. CVE analysis, incident triage, compliance evaluation, maker-checker validation.',
    capabilities: [
      'threat_triage',
      'cve_assessment',
      'incident_response',
      'compliance_check',
      'adversarial_validation',
    ],
    confidenceProfile: {
      typicalConfidence: 0.88,
      highStakeDomains: ['critical_vulnerability', 'incident_response', 'breach_detected'],
      preferredModel: 'claude-sonnet-4-6',
    },
    delegationProtocols: ['direct', 'maker_checker', 'escalate'],
    availability: 'offline',
  },
  {
    agentId: 'terra',
    canonicalName: 'Terra',
    domain: 'real_estate',
    // Canonical mapping: task designation Terra → Terra (brand-compliant)
    description:
      'Real estate intelligence. Property valuation, deal pipeline, market comps, zoning and title risk.',
    capabilities: [
      'property_valuation',
      'deal_analysis',
      'market_comps',
      'zoning_risk',
      'anomaly_detection',
    ],
    confidenceProfile: {
      typicalConfidence: 0.79,
      highStakeDomains: ['deal_risk', 'valuation_alert', 'zoning_issue', 'title_defect'],
      preferredModel: 'gpt-5.2',
    },
    delegationProtocols: ['direct', 'multi_hypothesis'],
    availability: 'offline',
  },
  {
    agentId: 'beacon',
    canonicalName: 'Lyte',
    domain: 'analytics',
    // Canonical mapping: task designation Lyte → Lyte (brand-compliant)
    description:
      'Decision intelligence and operational analytics. Signal correlation, KPI monitoring, anomaly detection, trend analysis.',
    capabilities: [
      'signal_correlation',
      'kpi_monitoring',
      'anomaly_detection',
      'trend_analysis',
      'operational_intelligence',
    ],
    confidenceProfile: {
      typicalConfidence: 0.84,
      highStakeDomains: ['financial_alert', 'ops_critical'],
      preferredModel: 'gpt-5.2',
    },
    delegationProtocols: ['direct', 'multi_hypothesis'],
    availability: 'offline',
  },
  {
    agentId: 'lexis',
    canonicalName: 'Counsel',
    domain: 'legal',
    // Canonical mapping: task designation LEXIS/FORGE → Counsel (brand-compliant)
    description:
      'Legal and compliance intelligence. Contract analysis, regulatory compliance, litigation risk, matter management.',
    capabilities: [
      'contract_analysis',
      'regulatory_compliance',
      'litigation_risk',
      'compliance_audit',
      'matter_management',
    ],
    confidenceProfile: {
      typicalConfidence: 0.91,
      highStakeDomains: [
        'regulatory_violation',
        'litigation_risk',
        'contract_breach',
        'sanctions_exposure',
      ],
      preferredModel: 'claude-sonnet-4-6',
    },
    delegationProtocols: ['direct', 'maker_checker', 'escalate'],
    availability: 'offline',
  },
  {
    agentId: 'sovereign',
    canonicalName: 'Aegis',
    domain: 'defense_intelligence',
    // Canonical mapping: task designation ATLAS → Aegis (Defense & Intelligence Command)
    description:
      'Defense and intelligence operations. Threat actor attribution, OSINT synthesis, geopolitical risk assessment, adversarial simulation, classified asset protection.',
    capabilities: [
      'threat_actor_attribution',
      'osint_synthesis',
      'geopolitical_risk_assessment',
      'adversarial_simulation',
      'intelligence_fusion',
      'classified_asset_protection',
    ],
    confidenceProfile: {
      typicalConfidence: 0.86,
      highStakeDomains: [
        'active_threat',
        'nation_state_actor',
        'critical_infrastructure',
        'classified_breach',
      ],
      preferredModel: 'claude-sonnet-4-6',
    },
    delegationProtocols: ['maker_checker', 'escalate', 'multi_hypothesis'],
    availability: 'offline',
  },
];

function externalAgentEnvKey(agentId: string): string {
  return `MCP_AGENT_ENDPOINT_${agentId.toUpperCase().replace(/-/g, '_')}`;
}

function hasConfiguredExternalAgentRoute(agent: PRAXISAgentEntry): boolean {
  return Boolean(
    process.env.PRAXIS_AGENT_REGISTRY_URL?.trim() ||
      process.env[externalAgentEnvKey(agent.agentId)]?.trim() ||
      agent.externalEndpoint,
  );
}

export function getProofCapabilityStatus(): {
  available: false;
  status: 'unavailable';
  evidenceState: 'UNAVAILABLE';
  cryptographicallyVerified: false;
  durable: false;
  reason: string;
} {
  return {
    available: false,
    status: 'unavailable',
    evidenceState: 'UNAVAILABLE',
    cryptographicallyVerified: false,
    durable: false,
    reason:
      'Governance receipts are transient correlation metadata; this release has no keyed signature, immutable ledger, or cross-replica verification backend.',
  };
}

export function getAssessmentCapabilityStatus(): {
  available: false;
  status: 'unavailable';
  evidenceState: 'UNAVAILABLE';
  method: 'heuristic-unvalidated';
  reason: string;
} {
  return {
    available: false,
    status: 'unavailable',
    evidenceState: 'UNAVAILABLE',
    method: 'heuristic-unvalidated',
    reason:
      'No calibrated response-quality evaluator is deployed. Production responses are unassessed; development heuristics are diagnostic only.',
  };
}

export function getNexusRuntimeCapabilities(): {
  prismBusBridge: {
    available: false;
    status: 'unavailable';
    dataSource: 'synthetic';
    reason: string;
  };
  internalAgentMesh: { available: false; status: 'unavailable'; reason: string };
  externalAgentFederation: {
    available: false;
    status: 'unavailable' | 'configured-unverified';
    configured: boolean;
    reason: string;
  };
  proofVerification: ReturnType<typeof getProofCapabilityStatus>;
  responseAssessment: ReturnType<typeof getAssessmentCapabilityStatus>;
} {
  const externalConfigured = PRAXIS_AGENT_REGISTRY.some(hasConfiguredExternalAgentRoute);
  return {
    prismBusBridge: {
      available: false,
      status: 'unavailable',
      dataSource: 'synthetic',
      reason: 'The Prism Bus package is not deployed with this gateway release.',
    },
    internalAgentMesh: {
      available: false,
      status: 'unavailable',
      reason: 'The ai-engine package is not deployed with this gateway release.',
    },
    externalAgentFederation: {
      available: false,
      status: externalConfigured ? 'configured-unverified' : 'unavailable',
      configured: externalConfigured,
      reason: externalConfigured
        ? 'An external route is configured but is verified only when a delegation is attempted.'
        : 'Configure PRAXIS_AGENT_REGISTRY_URL or an MCP_AGENT_ENDPOINT_<AGENT_ID> endpoint.',
    },
    proofVerification: getProofCapabilityStatus(),
    responseAssessment: getAssessmentCapabilityStatus(),
  };
}

export function getAgentRegistry(): PRAXISAgentEntry[] {
  return PRAXIS_AGENT_REGISTRY.map((agent) => ({
    ...agent,
    availability: hasConfiguredExternalAgentRoute(agent) ? 'degraded' : 'offline',
  }));
}

export function getAgentById(agentId: string): PRAXISAgentEntry | undefined {
  return getAgentRegistry().find(
    (agent) => agent.agentId === agentId || agent.canonicalName === agentId,
  );
}

// ─── 5b. Agent Delegation ──────────────────────────────────────────────────────

/**
 * Query the PRAXIS agent registry service for a live external endpoint.
 * This is Priority 1.5 — it sits between the internal ai-engine mesh (Priority 1)
 * and the static per-agent env-var override (Priority 2), allowing operators to
 * register and update agent endpoints centrally without redeploying this gateway.
 *
 * Required env var: PRAXIS_AGENT_REGISTRY_URL  (e.g. https://agents.szl-internal.com)
 * Registry contract: GET /agents/{agentId}  →  { endpoint: string }
 *
 * Returns the endpoint string on success, null if the registry is not configured,
 * the agent is not registered, or any network/timeout error occurs.
 */
async function discoverExternalAgentEndpoint(agentId: string): Promise<string | null> {
  const registryUrl = process.env['PRAXIS_AGENT_REGISTRY_URL'];
  if (!registryUrl) return null;
  try {
    const res = await fetch(
      `${registryUrl.replace(/\/$/, '')}/agents/${encodeURIComponent(agentId)}`,
      {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(5_000),
      },
    );
    if (!res.ok) return null;
    const body = (await res.json()) as { endpoint?: string };
    return typeof body.endpoint === 'string' && body.endpoint.length > 0 ? body.endpoint : null;
  } catch {
    return null;
  }
}

export interface AgentDelegationResult {
  taskId: string;
  targetAgent: string;
  domain: string;
  status: 'completed' | 'pending_approval' | 'failed' | 'unavailable';
  response: string;
  confidence: number;
  latencyMs: number;
  proofHash: string;
  completedAt: string;
  /** Identifies whether work was externally dispatched or explicitly not dispatched. */
  federationSource: 'external-mcp' | 'not-dispatched' | 'unavailable';
}

const delegationStore = new Map<string, AgentDelegationResult>();

export async function delegateToAgent(params: {
  targetAgentId: string;
  taskDescription: string;
  context: Record<string, unknown>;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  actor: string;
}): Promise<AgentDelegationResult> {
  const agent = getAgentById(params.targetAgentId);
  if (!agent) {
    throw new Error(
      `Unknown agent: ${params.targetAgentId}. Use nexus://agents/registry to discover available agents.`,
    );
  }

  const taskId = `nexus-del-${randomUUID()}`;
  const startTime = Date.now();

  let response: string;
  let confidence = 0;
  let status: AgentDelegationResult['status'];
  let federationSource: AgentDelegationResult['federationSource'];
  const isHighStake = agent.confidenceProfile.highStakeDomains.some((domain) =>
    params.taskDescription.toLowerCase().includes(domain),
  );

  if (isHighStake && params.urgency !== 'critical') {
    status = 'pending_approval';
    federationSource = 'not-dispatched';
    response =
      `[GOVERNANCE GATE] Delegation to '${agent.canonicalName}' was not dispatched. ` +
      'This high-stakes task requires operator approval before external execution.';
  } else {
    // Central registry discovery and static per-agent endpoints are the only
    // execution paths in this release. The internal ai-engine mesh is not part
    // of the gateway production closure and is reported as unavailable.
    // Queries GET /agents/{agentId} on the shared registry service before falling
    // back to per-agent env vars. Allows operators to register and hot-swap
    // agent endpoints centrally without redeploying the gateway.
    const registryEndpoint = await discoverExternalAgentEndpoint(params.targetAgentId);

    // Priority 2: External MCP agent federation
    // Checks MCP_AGENT_ENDPOINT_<AGENT_ID_UPPER> env var for a registered
    // external MCP server endpoint (e.g. MCP_AGENT_ENDPOINT_HELMSMAN=https://...).
    // This implements outbound A2A (Agent-to-Agent) federation via MCP protocol.
    const envKey = externalAgentEnvKey(agent.agentId);
    const externalEndpoint = registryEndpoint ?? process.env[envKey] ?? agent.externalEndpoint;
    if (externalEndpoint) {
      try {
        const mcpBody = {
          jsonrpc: '2.0',
          id: taskId,
          method: 'tools/call',
          params: {
            name: 'execute_task',
            arguments: {
              task: params.taskDescription,
              context: params.context,
              urgency: params.urgency,
              requestingAgent: 'nexus-mcp-gateway',
            },
          },
        };
        const externalRes = await fetch(`${externalEndpoint}/mcp`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json, text/event-stream',
          },
          body: JSON.stringify(mcpBody),
          signal: AbortSignal.timeout(10_000),
        });
        if (externalRes.ok) {
          const raw = (await externalRes.json()) as {
            result?: { content?: Array<{ text?: string }> };
          };
          const texts = raw.result?.content?.map((c) => c.text ?? '').filter(Boolean) ?? [];
          if (texts.length > 0) {
            response = `[External MCP Federation — ${agent.canonicalName} @ ${externalEndpoint}]\n\n${texts.join('\n')}`;
            confidence = agent.confidenceProfile.typicalConfidence;
            status = 'completed';
            federationSource = 'external-mcp';
          } else {
            throw new Error('Empty response from external agent');
          }
        } else {
          throw new Error(`External agent returned HTTP ${externalRes.status}`);
        }
      } catch (error) {
        status = 'failed';
        federationSource = 'external-mcp';
        response =
          `[PRAXIS Delegation — ${agent.canonicalName}] External federation failed; ` +
          `the task was not dispatched (${error instanceof Error ? error.message : 'connection failed'}).`;
      }
    } else {
      status = 'unavailable';
      federationSource = 'unavailable';
      response =
        `[PRAXIS Delegation — ${agent.canonicalName}] No execution backend is configured; ` +
        `the task was not dispatched. Set PRAXIS_AGENT_REGISTRY_URL or ${envKey}.`;
    }
  }

  const latencyMs = Date.now() - startTime;

  const proofHash = createHash('sha256')
    .update(`delegation:${taskId}:${params.actor}:${Date.now()}`)
    .digest('hex');

  const result: AgentDelegationResult = {
    taskId,
    targetAgent: agent.canonicalName,
    domain: agent.domain,
    status,
    response,
    confidence,
    latencyMs,
    proofHash,
    completedAt: new Date().toISOString(),
    federationSource,
  };

  delegationStore.set(taskId, result);

  storeProof({
    proofHash,
    toolName: 'agent_delegate',
    actor: params.actor,
    issuedAt: result.completedAt,
    confidence: result.confidence,
    covenantAllowed: result.status === 'completed',
    covenantReason:
      result.status === 'completed'
        ? `Agent delegation to '${agent.canonicalName}' was dispatched and completed through external MCP federation.`
        : result.status === 'pending_approval'
          ? `High-stakes delegation to '${agent.canonicalName}' was not dispatched and is held pending operator approval.`
          : `Agent delegation to '${agent.canonicalName}' was not completed (${result.status}).`,
    responseDigest: createHash('sha256').update(response).digest('hex').slice(0, 16),
  });

  return result;
}

// ─── 6. Evidence Graph ─────────────────────────────────────────────────────────

export interface EvidenceItem {
  evidenceId: string;
  domain: string;
  contentType: string;
  summary: string;
  confidence: number;
  sourceClass: 'llm_generated' | 'system_computed' | 'human_authored' | 'sensor_feed';
  provenanceChain: string[];
  capturedAt: string;
}

export interface EvidenceRecommendation {
  recommendationId: string;
  domain: string;
  title: string;
  summary: string;
  supportingEvidenceIds: string[];
  policyEvaluationStatus: 'approved' | 'pending' | 'approval_required' | 'rejected';
  confidence: number;
  createdAt: string;
}

export interface EvidenceTrace {
  traceId: string;
  decision: string;
  stages: Array<{
    stage: string;
    description: string;
    inputSummary: string;
    outputSummary: string;
    confidence: number;
    durationMs: number;
  }>;
  finalConfidence: number;
  proofHash: string;
  completedAt: string;
}

const SYNTHETIC_EVIDENCE: EvidenceItem[] = [
  {
    evidenceId: 'ev-maritime-001',
    domain: 'vessels',
    contentType: 'voyage_anomaly_report',
    summary:
      'AIS dark period analysis for AURORA BOREALIS — 4.2-hour gap in contested waters correlated with 3 similar dark events in the past 30 days.',
    confidence: 0.87,
    sourceClass: 'system_computed',
    provenanceChain: [
      'ais-feed-intake',
      'entity-resolve:IMO-9234567',
      'anomaly-score:0.78',
      'convergence-correlate',
    ],
    capturedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
  },
  {
    evidenceId: 'ev-security-001',
    domain: 'aegis',
    contentType: 'threat_triage_result',
    summary:
      'Lateral movement pattern — MITRE ATT&CK T1021 (Remote Services). 3 hosts affected, CVSS estimated 8.2.',
    confidence: 0.93,
    sourceClass: 'llm_generated',
    provenanceChain: [
      'siem-intake',
      'threat-feed-enrich',
      'sentinel-analysis',
      'proof:proof-sec-0x4a2b',
    ],
    capturedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
  },
  {
    evidenceId: 'ev-realestate-001',
    domain: 'terra',
    contentType: 'valuation_anomaly',
    summary:
      'Portfolio Q2 2026 — 7 assets with discount >5% to underwriting model. Root cause: regional cap rate expansion of 52bps.',
    confidence: 0.76,
    sourceClass: 'system_computed',
    provenanceChain: [
      'portfolio-feed',
      'valuation-model-v3',
      'anomaly-score:0.62',
      'terra-agent-review',
    ],
    capturedAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
  },
  {
    evidenceId: 'ev-legal-001',
    domain: 'counsel',
    contentType: 'regulatory_deadline_alert',
    summary:
      'PRISM-2024-CC-0892: Amended regulatory filing required within 14 days. Applicable statute: 17 CFR § 240.13a-11.',
    confidence: 0.95,
    sourceClass: 'system_computed',
    provenanceChain: [
      'counsel-calendar-feed',
      'regulatory-db-lookup',
      'matter-context:PRISM-2024-CC-0892',
    ],
    capturedAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
  },
];

const SYNTHETIC_RECOMMENDATIONS: EvidenceRecommendation[] = [
  {
    recommendationId: 'rec-001',
    domain: 'vessels',
    title: 'Initiate AIS Gap Investigation for AURORA BOREALIS',
    summary:
      'The 4.2-hour AIS dark period warrants immediate maritime compliance review and route deviation inquiry.',
    supportingEvidenceIds: ['ev-maritime-001'],
    policyEvaluationStatus: 'pending',
    confidence: 0.84,
    createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
  },
  {
    recommendationId: 'rec-002',
    domain: 'aegis',
    title: 'Isolate Affected Subnet — Lateral Movement Response',
    summary:
      'Immediate subnet isolation and incident response workflow required for the 3 affected production hosts.',
    supportingEvidenceIds: ['ev-security-001'],
    policyEvaluationStatus: 'approval_required',
    confidence: 0.91,
    createdAt: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
  },
  {
    recommendationId: 'rec-003',
    domain: 'counsel',
    title: 'Schedule Regulatory Filing Review — PRISM-2024-CC-0892',
    summary:
      'Legal team must review and approve amended regulatory filing before the 14-day deadline.',
    supportingEvidenceIds: ['ev-legal-001'],
    policyEvaluationStatus: 'pending',
    confidence: 0.93,
    createdAt: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
  },
];

const SYNTHETIC_TRACE: EvidenceTrace = {
  traceId: 'trace-evidence-001',
  decision: 'Recommend lateral movement subnet isolation with approval gate',
  stages: [
    {
      stage: 'intake',
      description: 'SIEM signal ingested from network monitoring fabric',
      inputSummary:
        'Raw network event: 3 internal hosts accessing admin shares from single IP within 2-min window',
      outputSummary: 'Signal stamped, validated, signalId assigned: sig-security-001',
      confidence: 0.98,
      durationMs: 12,
    },
    {
      stage: 'enrich',
      description: 'Entity resolution against asset registry',
      inputSummary: 'IP: 10.42.17.221 — attempting resolution against known asset inventory',
      outputSummary:
        'Resolved: Production API server cluster (Tenant: szl-core), criticality: HIGH',
      confidence: 0.94,
      durationMs: 45,
    },
    {
      stage: 'score',
      description: 'Severity and opportunity scoring',
      inputSummary: 'Enriched signal with resolved entities and MITRE ATT&CK mapping',
      outputSummary: 'Severity: HIGH (0.91), CVSS estimate: 8.2, intakeScore: 0.91',
      confidence: 0.91,
      durationMs: 28,
    },
    {
      stage: 'recommend',
      description: 'SENTINEL agent recommendation generation',
      inputSummary: 'High-severity lateral movement with confirmed production asset impact',
      outputSummary:
        'Recommendation: Immediate subnet isolation (10.42.17.0/24) + incident response workflow',
      confidence: 0.89,
      durationMs: 1240,
    },
    {
      stage: 'policy-evaluate',
      description: 'Covenant policy evaluation for approval gate',
      inputSummary: 'Action: subnet isolation (high-risk, production environment)',
      outputSummary:
        'APPROVAL_REQUIRED — production infrastructure modification requires ops_admin authorization',
      confidence: 1.0,
      durationMs: 8,
    },
  ],
  finalConfidence: 0.91,
  proofHash: createHash('sha256').update('trace-evidence-001:nexus:system').digest('hex'),
  completedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
};

const evidenceItems: EvidenceItem[] = [...SYNTHETIC_EVIDENCE];
const evidenceRecommendations: EvidenceRecommendation[] = [...SYNTHETIC_RECOMMENDATIONS];
const evidenceTraces = new Map<string, EvidenceTrace>([[SYNTHETIC_TRACE.traceId, SYNTHETIC_TRACE]]);

export function getEvidenceGraph(): EvidenceItem[] {
  return evidenceItems;
}

export function getEvidenceRecommendations(): EvidenceRecommendation[] {
  return evidenceRecommendations;
}

export function getEvidenceTrace(traceId: string): EvidenceTrace | undefined {
  return evidenceTraces.get(traceId);
}

export function addEvidenceItem(item: EvidenceItem): void {
  evidenceItems.unshift(item);
  if (evidenceItems.length > 500) evidenceItems.length = 500;
}

export function addEvidenceTrace(trace: EvidenceTrace): void {
  evidenceTraces.set(trace.traceId, trace);
}
