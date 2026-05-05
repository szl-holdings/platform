/**
 * Plan Lock & Trust Tier System
 *
 * Plan mode is a first-class execution mode. Every Plan must produce a
 * Decision Card (Signal → Context → Recommendation → Simulation) signed
 * by the originating subagent and approved (auto or human) before any
 * tool with side effects can run.
 *
 * Trust Tier ladder (Permission Modes):
 *   0 = Read-only            — query-only tools
 *   1 = Plan-only            — reads + plan emission; no side effects
 *   2 = Auto-approve-low-risk — low-impact tools auto-run; high-impact gated
 *   3 = HITL-required        — every side-effecting tool requires human approval
 *   4 = Sovereign-air-gapped — fully isolated; no external tool calls
 */

import { randomUUID } from 'node:crypto';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type TrustTier = 0 | 1 | 2 | 3 | 4;

export const TRUST_TIER_LABELS: Record<TrustTier, string> = {
  0: 'Read-only',
  1: 'Plan-only',
  2: 'Auto-approve-low-risk',
  3: 'HITL-required',
  4: 'Sovereign-air-gapped',
};

export const TRUST_TIER_DESCRIPTIONS: Record<TrustTier, string> = {
  0: 'Query-only tools. No state changes permitted.',
  1: 'Read and plan. Side-effecting tools blocked until plan is signed.',
  2: 'Low-impact tools auto-approved. High-impact tools require approval.',
  3: 'Every side-effecting tool requires explicit human approval.',
  4: 'Fully isolated. No external tool calls. Air-gapped execution only.',
};

export interface DecisionCard {
  card_id: string;
  plan_id: string;
  signal: string;
  context: string;
  recommendation: string;
  simulation: string;
  originating_agent: string;
  session_id: string;
  created_at: string;
  signed: boolean;
  signed_at?: string;
  signed_by?: string;
  proof_packet_id?: string;
  trust_tier: TrustTier;
  promoted_to_workcell?: string;
}

export interface PlanRecord {
  plan_id: string;
  name: string;
  objective: string;
  agent_id: string;
  session_id: string;
  status: 'draft' | 'locked' | 'approved' | 'executing' | 'completed' | 'rejected';
  trust_tier: TrustTier;
  decision_card?: DecisionCard;
  created_at: string;
  updated_at: string;
}

export interface TrustTierConfig {
  subagent_class: string;
  tier: TrustTier;
  set_by: string;
  set_at: string;
  covenant_bundle?: string;
}

// ---------------------------------------------------------------------------
// Plan store
// ---------------------------------------------------------------------------

const planStore = new Map<string, PlanRecord>();
const trustTierConfigs = new Map<string, TrustTierConfig>();

export function createPlan(params: {
  name: string;
  objective: string;
  agent_id: string;
  session_id: string;
  trust_tier?: TrustTier;
}): PlanRecord {
  const plan: PlanRecord = {
    plan_id: randomUUID(),
    name: params.name,
    objective: params.objective,
    agent_id: params.agent_id,
    session_id: params.session_id,
    status: 'draft',
    trust_tier: params.trust_tier ?? 3,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  planStore.set(plan.plan_id, plan);
  return plan;
}

export function getPlan(plan_id: string): PlanRecord | null {
  return planStore.get(plan_id) ?? null;
}

export function listPlans(session_id?: string): PlanRecord[] {
  const plans = Array.from(planStore.values());
  return session_id ? plans.filter(p => p.session_id === session_id) : plans;
}

// ---------------------------------------------------------------------------
// Decision Card
// ---------------------------------------------------------------------------

export function proposeDecisionCard(params: {
  plan_id: string;
  signal: string;
  context: string;
  recommendation: string;
  simulation: string;
  originating_agent: string;
  session_id: string;
  trust_tier: TrustTier;
}): DecisionCard | null {
  const plan = planStore.get(params.plan_id);
  if (!plan) return null;

  const card: DecisionCard = {
    card_id: randomUUID(),
    plan_id: params.plan_id,
    signal: params.signal,
    context: params.context,
    recommendation: params.recommendation,
    simulation: params.simulation,
    originating_agent: params.originating_agent,
    session_id: params.session_id,
    created_at: new Date().toISOString(),
    signed: false,
    trust_tier: params.trust_tier,
  };

  plan.decision_card = card;
  plan.updated_at = new Date().toISOString();
  planStore.set(params.plan_id, plan);

  return card;
}

async function emitPlanProof(plan_id: string, action: string, session_id: string): Promise<string> {
  const proofId = `plan-proof-${randomUUID()}`;
  const { tagAIContent } = await import('@szl-holdings/proof-chain');
  await tagAIContent({
    contentId: proofId,
    contentType: 'plan_lock_event',
    sourceClass: 'system_computed',
    correlationId: session_id,
    serviceAttribution: 'plan-lock',
    metadata: { plan_id, action, sealed_at: new Date().toISOString() },
  });
  return proofId;
}

export async function signAndLockPlan(params: {
  plan_id: string;
  signed_by: string;
  session_id: string;
}): Promise<{ success: boolean; plan?: PlanRecord; proof_packet_id?: string; error?: string }> {
  const plan = planStore.get(params.plan_id);
  if (!plan) return { success: false, error: 'Plan not found' };
  if (!plan.decision_card) return { success: false, error: 'Decision Card must be proposed before signing' };
  if (plan.status === 'locked' || plan.status === 'approved') {
    return { success: false, error: 'Plan already locked' };
  }

  const proof_packet_id = await emitPlanProof(params.plan_id, 'sign_and_lock', params.session_id);

  plan.decision_card.signed = true;
  plan.decision_card.signed_at = new Date().toISOString();
  plan.decision_card.signed_by = params.signed_by;
  plan.decision_card.proof_packet_id = proof_packet_id;
  plan.status = 'locked';
  plan.updated_at = new Date().toISOString();
  planStore.set(params.plan_id, plan);

  // Emit OTel span for plan sign
  try {
    const { recordPlanSign } = await import('./observability/otel-genai.js');
    await recordPlanSign({
      trace_id: randomUUID(),
      session_id: params.session_id,
      plan_id: params.plan_id,
      agent_name: params.signed_by,
      proof_packet_id,
    });
  } catch {
    // OTel is best-effort
  }

  return { success: true, plan, proof_packet_id };
}

export async function promoteToWorkcell(params: {
  plan_id: string;
  workcell_id: string;
}): Promise<{ success: boolean; error?: string }> {
  const plan = planStore.get(params.plan_id);
  if (!plan) return { success: false, error: 'Plan not found' };
  if (plan.status !== 'locked' && plan.status !== 'approved') {
    return { success: false, error: 'Plan must be signed and locked before promotion to Workcell' };
  }

  if (plan.decision_card) {
    plan.decision_card.promoted_to_workcell = params.workcell_id;
  }
  plan.status = 'approved';
  plan.updated_at = new Date().toISOString();
  planStore.set(params.plan_id, plan);

  return { success: true };
}

// ---------------------------------------------------------------------------
// Trust Tier management
// ---------------------------------------------------------------------------

export function setTrustTier(params: {
  subagent_class: string;
  tier: TrustTier;
  set_by: string;
  covenant_bundle?: string;
}): TrustTierConfig {
  const config: TrustTierConfig = {
    subagent_class: params.subagent_class,
    tier: params.tier,
    set_by: params.set_by,
    set_at: new Date().toISOString(),
    covenant_bundle: params.covenant_bundle,
  };
  trustTierConfigs.set(params.subagent_class, config);
  return config;
}

export function getTrustTier(subagent_class: string): TrustTier {
  return trustTierConfigs.get(subagent_class)?.tier ?? 3;
}

export function listTrustTiers(): TrustTierConfig[] {
  return Array.from(trustTierConfigs.values());
}

// Seed default trust tiers
const DEFAULT_TIERS: Array<{ subagent_class: string; tier: TrustTier }> = [
  { subagent_class: 'retrieval', tier: 0 },
  { subagent_class: 'planning', tier: 1 },
  { subagent_class: 'analysis', tier: 2 },
  { subagent_class: 'document', tier: 3 },
  { subagent_class: 'general', tier: 3 },
  { subagent_class: 'orchestration', tier: 3 },
];
for (const { subagent_class, tier } of DEFAULT_TIERS) {
  setTrustTier({ subagent_class, tier, set_by: 'system:default' });
}

// ---------------------------------------------------------------------------
// Plan-mode tool gate (used by tool-bridge)
// ---------------------------------------------------------------------------

export function checkPlanModeGate(params: {
  plan_id?: string;
  permission_mode: string;
  tool_name: string;
}): { allowed: boolean; reason: string } {
  if (params.permission_mode !== 'plan-only') {
    return { allowed: true, reason: 'not_plan_mode' };
  }

  const sideEffectPatterns = ['write', 'create', 'delete', 'send', 'submit', 'execute', 'update', 'modify', 'post'];
  const hasSideEffect = sideEffectPatterns.some(p => params.tool_name.toLowerCase().includes(p));

  if (hasSideEffect) {
    const plan = params.plan_id ? planStore.get(params.plan_id) : null;
    const isLocked = plan?.status === 'locked' || plan?.status === 'approved';
    if (!isLocked) {
      return {
        allowed: false,
        reason: `Plan mode: '${params.tool_name}' has side effects — sign & lock plan ${params.plan_id ?? ''} first`,
      };
    }
  }

  return { allowed: true, reason: 'plan_mode_read_only_tool' };
}
