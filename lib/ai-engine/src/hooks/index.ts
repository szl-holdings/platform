/**
 * A11oy Lifecycle Hook System
 *
 * Adopts Claude Code's hook primitive shape: lifecycle events with JSON decision
 * contracts. Every hook invocation automatically produces a Proof Chain entry
 * so the fabric is "governed by construction".
 *
 * Lifecycle events:
 *   SessionStart · PreToolUse · PostToolUse · PrePromptSubmit
 *   PreSubagentSpawn · PostSubagentReturn · OnError · OnPlanProposed
 *   OnPlanApproved · OnDecisionEmitted · OnProofPacketSealed
 *
 * Decision contract:
 *   { action: 'allow' | 'block' | 'modify' | 'route', reason, redactions?, proof_attachments? }
 */

import { randomUUID } from 'node:crypto';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type HookEvent =
  | 'SessionStart'
  | 'PreToolUse'
  | 'PostToolUse'
  | 'PrePromptSubmit'
  | 'PreSubagentSpawn'
  | 'PostSubagentReturn'
  | 'OnError'
  | 'OnPlanProposed'
  | 'OnPlanApproved'
  | 'OnDecisionEmitted'
  | 'OnProofPacketSealed';

export type HookAction = 'allow' | 'block' | 'modify' | 'route';

export interface HookDecision {
  action: HookAction;
  reason: string;
  /** Keys to redact from the context before passing to the model */
  redactions?: string[];
  /** Additional data to attach to the Proof Packet for this decision */
  proof_attachments?: Record<string, unknown>;
  /** For 'modify': replacement content */
  modified_content?: string;
  /** For 'route': target agent/skill ID */
  route_target?: string;
}

export interface HookContext {
  event: HookEvent;
  session_id: string;
  agent_id?: string;
  tool_name?: string;
  tool_input?: Record<string, unknown>;
  tool_output?: string;
  prompt?: string;
  plan_id?: string;
  proof_packet_id?: string;
  subagent_id?: string;
  permission_mode?: string;
  trust_tier?: number;
  metadata?: Record<string, unknown>;
}

export type HookFn = (ctx: HookContext) => Promise<HookDecision> | HookDecision;

export interface RegisteredHook {
  id: string;
  name: string;
  description: string;
  events: HookEvent[];
  priority: number;
  timeout_ms: number;
  policy_bundle?: string;
  fn: HookFn;
  registered_at: string;
}

export interface HookInvocationRecord {
  invocation_id: string;
  hook_id: string;
  hook_name: string;
  event: HookEvent;
  session_id: string;
  agent_id?: string;
  decision: HookDecision;
  duration_ms: number;
  proof_entry_id: string;
  timestamp: string;
}

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

const hookRegistry = new Map<string, RegisteredHook>();
const invocationLog: HookInvocationRecord[] = [];
const MAX_LOG = 2000;

export function registerHook(hook: Omit<RegisteredHook, 'registered_at'>): void {
  hookRegistry.set(hook.id, { ...hook, registered_at: new Date().toISOString() });
}

export function unregisterHook(id: string): boolean {
  return hookRegistry.delete(id);
}

export function listHooks(event?: HookEvent): RegisteredHook[] {
  const hooks = Array.from(hookRegistry.values());
  if (!event) return hooks;
  return hooks.filter(h => h.events.includes(event));
}

export function getHook(id: string): RegisteredHook | undefined {
  return hookRegistry.get(id);
}

export function getInvocationLog(options: {
  hook_id?: string;
  event?: HookEvent;
  session_id?: string;
  limit?: number;
} = {}): HookInvocationRecord[] {
  let log = invocationLog;
  if (options.hook_id) log = log.filter(r => r.hook_id === options.hook_id);
  if (options.event) log = log.filter(r => r.event === options.event);
  if (options.session_id) log = log.filter(r => r.session_id === options.session_id);
  return log.slice(0, options.limit ?? 100);
}

export function getHookStats(hook_id: string): {
  total: number;
  allow: number;
  block: number;
  modify: number;
  route: number;
  avg_duration_ms: number;
  last_24h: number;
} {
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  const records = invocationLog.filter(r => r.hook_id === hook_id);
  const recent = records.filter(r => new Date(r.timestamp).getTime() > cutoff);
  const counts = { allow: 0, block: 0, modify: 0, route: 0 };
  let totalDuration = 0;
  for (const r of records) {
    counts[r.decision.action]++;
    totalDuration += r.duration_ms;
  }
  return {
    total: records.length,
    ...counts,
    avg_duration_ms: records.length > 0 ? totalDuration / records.length : 0,
    last_24h: recent.length,
  };
}

// ---------------------------------------------------------------------------
// Executor
// ---------------------------------------------------------------------------

const DEFAULT_TIMEOUT_MS = 5000;
const ALLOW_DECISION: HookDecision = { action: 'allow', reason: 'hook_timeout_fallback' };

async function runHookWithTimeout(
  hook: RegisteredHook,
  ctx: HookContext,
): Promise<HookDecision> {
  const timeout = hook.timeout_ms ?? DEFAULT_TIMEOUT_MS;
  return Promise.race([
    Promise.resolve(hook.fn(ctx)),
    new Promise<HookDecision>((resolve) =>
      setTimeout(() => resolve({ action: 'allow', reason: `hook_timeout_${hook.id}` }), timeout),
    ),
  ]);
}

async function emitProofEntry(
  event: HookEvent,
  hookId: string,
  ctx: HookContext,
  decision: HookDecision,
): Promise<string> {
  const proofEntryId = `hook-proof-${randomUUID()}`;
  try {
    const { tagAIContent } = await import('@szl-holdings/proof-chain');
    await tagAIContent({
      contentId: proofEntryId,
      contentType: 'hook_decision',
      sourceClass: 'system_computed',
      correlationId: ctx.session_id,
      serviceAttribution: hookId,
      metadata: {
        event,
        action: decision.action,
        reason: decision.reason,
        agent_id: ctx.agent_id,
        tool_name: ctx.tool_name,
        proof_attachments: decision.proof_attachments,
      },
    });
  } catch {
    // Proof chain is best-effort — never block hook execution
  }
  return proofEntryId;
}

/**
 * Perform an explicit plan-mode hard gate check independent of the hook registry.
 * This is the fail-closed fallback: if the registry is empty or all hooks
 * failed, plan-mode must still block side-effecting tools.
 */
function checkPlanModeGate(ctx: HookContext): HookDecision | null {
  if (ctx.event !== 'PreToolUse') return null;
  if (ctx.permission_mode !== 'plan-only') return null;
  const sideEffectKeywords = ['write', 'create', 'delete', 'send', 'submit', 'execute', 'update', 'modify', 'deploy', 'publish'];
  const toolLower = (ctx.tool_name ?? '').toLowerCase();
  if (sideEffectKeywords.some(k => toolLower.includes(k))) {
    return {
      action: 'block',
      reason: `Plan mode hard gate (fail-closed): tool '${ctx.tool_name}' has side effects — sign & lock plan first`,
    };
  }
  return null;
}

/**
 * Execute all registered hooks for a given lifecycle event.
 * Returns the most restrictive decision (block > modify > route > allow).
 * Every invocation is logged and proof-chained.
 *
 * Fail-closed guarantee: for PreToolUse in plan-only mode, the explicit
 * checkPlanModeGate is always applied — even if no hooks are registered
 * or all hooks error — so governance is never bypassed by registry degradation.
 */
export async function executeHooks(
  event: HookEvent,
  ctx: HookContext,
): Promise<{ decision: HookDecision; invocations: HookInvocationRecord[] }> {
  const hooks = listHooks(event).sort((a, b) => a.priority - b.priority);
  const invocations: HookInvocationRecord[] = [];

  // Fail-closed hard gate: apply independently of registry health.
  const hardGateDecision = checkPlanModeGate(ctx);
  if (hardGateDecision) {
    return { decision: hardGateDecision, invocations };
  }

  let finalDecision: HookDecision = { action: 'allow', reason: 'no_hooks_registered' };

  for (const hook of hooks) {
    const start = Date.now();
    let decision: HookDecision;
    try {
      decision = await runHookWithTimeout(hook, ctx);
    } catch (err) {
      // Hook error on PreToolUse in plan-only mode is fail-closed.
      if (event === 'PreToolUse' && ctx.permission_mode === 'plan-only') {
        decision = {
          action: 'block',
          reason: `Hook error (fail-closed in plan-only mode) — ${hook.id}: ${err instanceof Error ? err.message : String(err)}`,
        };
      } else {
        decision = {
          action: 'allow',
          reason: `hook_error_${hook.id}: ${err instanceof Error ? err.message : String(err)}`,
        };
      }
    }

    const duration_ms = Date.now() - start;
    const proof_entry_id = await emitProofEntry(event, hook.id, ctx, decision);

    const record: HookInvocationRecord = {
      invocation_id: randomUUID(),
      hook_id: hook.id,
      hook_name: hook.name,
      event,
      session_id: ctx.session_id,
      agent_id: ctx.agent_id,
      decision,
      duration_ms,
      proof_entry_id,
      timestamp: new Date().toISOString(),
    };

    invocations.push(record);
    invocationLog.unshift(record);
    if (invocationLog.length > MAX_LOG) invocationLog.length = MAX_LOG;

    // Most restrictive wins
    if (decision.action === 'block') {
      finalDecision = decision;
      break; // block is final
    }
    if (decision.action === 'modify' && finalDecision.action === 'allow') {
      finalDecision = decision;
    }
    if (decision.action === 'route' && finalDecision.action === 'allow') {
      finalDecision = decision;
    }
  }

  return { decision: finalDecision, invocations };
}

// ---------------------------------------------------------------------------
// Built-in hooks
// ---------------------------------------------------------------------------

/** Trust Tier → allowed tool categories */
const TIER_BLOCKED_TOOLS: Record<number, string[]> = {
  0: [], // read-only — all write tools blocked by tool-bridge, not here
  1: ['write', 'delete', 'execute', 'send', 'submit', 'create', 'update', 'modify'],
  4: ['*'], // sovereign-air-gapped — all external tools blocked
};

registerHook({
  id: 'builtin:trust-tier-enforcer',
  name: 'Trust Tier Enforcer',
  description: 'Blocks tool calls that exceed the declared Trust Tier for the current subagent',
  events: ['PreToolUse'],
  priority: 10,
  timeout_ms: 500,
  policy_bundle: 'core:trust-tiers',
  fn: (ctx) => {
    const tier = ctx.trust_tier ?? 2;
    const toolName = ctx.tool_name ?? '';

    if (tier === 4) {
      return {
        action: 'block',
        reason: `Trust Tier 4 (Sovereign-air-gapped): external tool calls forbidden`,
      };
    }
    if (tier <= 1) {
      const blocked = TIER_BLOCKED_TOOLS[tier] ?? [];
      const isBlocked = blocked.some(pattern => toolName.toLowerCase().includes(pattern));
      if (isBlocked) {
        return {
          action: 'block',
          reason: `Trust Tier ${tier} (${tier === 0 ? 'Read-only' : 'Plan-only'}): tool '${toolName}' has side effects`,
        };
      }
    }
    return { action: 'allow', reason: `Trust Tier ${tier}: tool '${toolName}' permitted` };
  },
});

registerHook({
  id: 'builtin:plan-mode-gate',
  name: 'Plan Mode Gate',
  description: 'Hard-gates side-effecting tool calls when permission_mode is "plan-only"',
  events: ['PreToolUse'],
  priority: 5,
  timeout_ms: 200,
  policy_bundle: 'core:plan-mode',
  fn: (ctx) => {
    if (ctx.permission_mode !== 'plan-only') {
      return { action: 'allow', reason: 'not_in_plan_mode' };
    }
    const sideEffectTools = ['write', 'create', 'delete', 'send', 'submit', 'execute', 'update'];
    const hasSideEffect = sideEffectTools.some(s => (ctx.tool_name ?? '').toLowerCase().includes(s));
    if (hasSideEffect) {
      return {
        action: 'block',
        reason: `Plan mode hard gate: tool '${ctx.tool_name}' has side effects — sign & lock plan first`,
      };
    }
    return { action: 'allow', reason: 'plan_mode: read-only tool permitted' };
  },
});

registerHook({
  id: 'builtin:redaction',
  name: 'Redaction Gate',
  description: 'Redacts PII and classified patterns from prompts before submission',
  events: ['PrePromptSubmit'],
  priority: 20,
  timeout_ms: 300,
  policy_bundle: 'core:redaction',
  fn: (ctx) => {
    const piiPatterns = [/\b\d{3}-\d{2}-\d{4}\b/g, /\b4[0-9]{12}(?:[0-9]{3})?\b/g];
    const prompt = ctx.prompt ?? '';
    const hasPii = piiPatterns.some(p => p.test(prompt));
    if (hasPii) {
      return {
        action: 'modify',
        reason: 'PII pattern detected — redacting before submission',
        redactions: ['ssn_pattern', 'card_pattern'],
        modified_content: prompt.replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[REDACTED-SSN]')
          .replace(/\b4[0-9]{12}(?:[0-9]{3})?\b/g, '[REDACTED-CARD]'),
      };
    }
    return { action: 'allow', reason: 'no_pii_detected' };
  },
});

registerHook({
  id: 'builtin:proof-sealer',
  name: 'Proof Sealer',
  description: 'Seals a Proof Chain entry after every tool use and subagent return',
  events: ['PostToolUse', 'PostSubagentReturn'],
  priority: 100,
  timeout_ms: 1000,
  policy_bundle: 'core:proof-chain',
  fn: (ctx) => ({
    action: 'allow',
    reason: 'proof_sealed',
    proof_attachments: {
      event: ctx.event,
      tool_name: ctx.tool_name,
      agent_id: ctx.agent_id,
      subagent_id: ctx.subagent_id,
      session_id: ctx.session_id,
      sealed_at: new Date().toISOString(),
    },
  }),
});

registerHook({
  id: 'builtin:reward-hacking-watchdog',
  name: 'Reward-Hacking Watchdog',
  description: 'Detects goal substitution, eval gaming, sycophancy, and scope creep in subagent completions',
  events: ['PostSubagentReturn'],
  priority: 80,
  timeout_ms: 2000,
  policy_bundle: 'core:alignment',
  fn: async (ctx) => {
    // Dynamic import to avoid circular dependency with evals module
    try {
      const { runWatchdog } = await import('../evals/reward-hacking-watchdog.js');
      const output = ctx.tool_output ?? '';
      const result = await runWatchdog({
        subagent_id: ctx.subagent_id ?? ctx.agent_id ?? 'unknown',
        session_id: ctx.session_id,
        run_id: `hook-run-${Date.now()}`,
        input_objective: ctx.prompt ?? '',
        output_text: output,
        tool_calls_made: ctx.tool_name ? [ctx.tool_name] : [],
        plan_scope_tools: [],
      });
      if (result.findings.some(f => f.severity === 'high' || f.severity === 'critical')) {
        return {
          action: 'block',
          reason: `Reward-hacking detected: ${result.findings.map(f => f.pattern).join(', ')}`,
          proof_attachments: { findings: result.findings, risk_score: result.risk_score, watchdog_version: '1.0' },
        };
      }
    } catch {
      // Watchdog failure is non-blocking — never halt the coordinator run
    }
    return { action: 'allow', reason: 'watchdog_pass' };
  },
});

/**
 * Covenant Policy Gate — evaluates the declared covenant policy bundle for the
 * current skill/agent. Blocks tool calls that violate the operator-configured
 * allowed_tools / blocked_tools lists attached to the active skill context.
 *
 * This hook is the integration point between the Skills library covenant
 * contracts and the PreToolUse gate. It runs at priority 3 (before plan-mode
 * at 5 and trust-tier at 10) so covenant blocks fire first.
 */
registerHook({
  id: 'builtin:covenant-policy-gate',
  name: 'Covenant Policy Gate',
  description: 'Evaluates operator covenant policy bundles — blocks tools on the skill blocked_tools list and enforces allowed_tools allow-lists. Fail-closed when run is skill-bound but covenant metadata is absent.',
  events: ['PreToolUse'],
  priority: 3,
  timeout_ms: 300,
  policy_bundle: 'core:covenant-policy',
  fn: (ctx) => {
    const toolName = ctx.tool_name ?? '';
    const metadata = ctx.metadata ?? {};

    // skill_bound = true signals that a skill was resolved for this run.
    // When true and covenant metadata is missing, we fail closed.
    const skillBound = metadata.skill_bound === true;
    const blockedTools = (metadata.blocked_tools as string[] | undefined) ?? [];
    const allowedTools = (metadata.allowed_tools as string[] | undefined) ?? null;
    const covenantBundle = (metadata.covenant_policy_bundle as string | undefined) ?? null;
    const skillId = (metadata.skill_id as string | undefined) ?? null;

    // Fail-closed: if run is skill-bound but we have neither an allow-list nor a
    // block-list, the covenant metadata was not resolved. Block to prevent
    // unverified tool calls under a skill-bound session.
    if (skillBound && blockedTools.length === 0 && (allowedTools === null || allowedTools.length === 0)) {
      // If the covenant bundle is known but tool lists are empty arrays (skill
      // has no restrictions declared), that is a valid "allow all" state.
      // We only fail-closed when covenant metadata itself was absent.
      if (covenantBundle === null && skillId !== null) {
        return {
          action: 'block',
          reason: `Covenant policy gate (fail-closed): skill '${skillId}' is bound but no covenant metadata was resolved — verify skill covenant_policy_bundle is configured`,
          proof_attachments: { skill_id: skillId, skill_bound: true },
        };
      }
    }

    // Check blocked list first — explicit block always wins.
    if (blockedTools.length > 0) {
      const isBlocked = blockedTools.some(blocked => {
        if (blocked === '*') return true;
        return toolName.toLowerCase().includes(blocked.toLowerCase());
      });
      if (isBlocked) {
        return {
          action: 'block',
          reason: `Covenant policy gate (${covenantBundle ?? skillId ?? 'default'}): tool '${toolName}' is on the blocked_tools list`,
          proof_attachments: { covenant_bundle: covenantBundle, blocked_tools: blockedTools, skill_id: skillId },
        };
      }
    }

    // Check allowed list — if defined, tool must appear on it.
    if (allowedTools !== null && allowedTools.length > 0) {
      const isAllowed = allowedTools.some(allowed => {
        if (allowed === '*') return true;
        return toolName.toLowerCase().includes(allowed.toLowerCase());
      });
      if (!isAllowed) {
        return {
          action: 'block',
          reason: `Covenant policy gate (${covenantBundle ?? skillId ?? 'default'}): tool '${toolName}' is not on the allowed_tools list`,
          proof_attachments: { covenant_bundle: covenantBundle, allowed_tools: allowedTools, skill_id: skillId },
        };
      }
    }

    return {
      action: 'allow',
      reason: covenantBundle
        ? `Covenant policy gate (${covenantBundle}): tool '${toolName}' permitted`
        : skillBound
          ? `Covenant policy gate: skill-bound (${skillId ?? 'unknown'}) — no tool restrictions declared, allow`
          : 'covenant_policy_gate: not skill-bound — allow',
    };
  },
});

export { ALLOW_DECISION };
