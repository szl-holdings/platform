import type { CompiledPolicy, CompiledRule, OutcomeKey, ParsedCondition, PolicyEffect } from './types';

export const EFFECT_PRIORITY: Record<PolicyEffect, number> = {
  block: 100, escalate: 80, require_approval: 60, audit_only: 20, allow: 10,
};

export function evaluateRule(rule: CompiledRule, ctx: Record<string, unknown>): boolean {
  if (rule.conditions.length === 0) return true;
  return rule.conditions.every((c: ParsedCondition) => {
    const val = ctx[c.field];
    if (val === undefined || val === null) return false;
    if (c.operator === 'gt') return typeof val === 'number' && val > (c.value as number);
    if (c.operator === 'gte') return typeof val === 'number' && val >= (c.value as number);
    if (c.operator === 'lt') return typeof val === 'number' && val < (c.value as number);
    if (c.operator === 'lte') return typeof val === 'number' && val <= (c.value as number);
    if (c.operator === 'eq') return val === c.value;
    if (c.operator === 'in') return Array.isArray(c.value) && (c.value as unknown[]).includes(val);
    if (c.operator === 'not_in') return Array.isArray(c.value) && !(c.value as unknown[]).includes(val);
    return false;
  });
}

export function runPolicyAgainstContext(policy: CompiledPolicy, ctx: Record<string, unknown>): { effect: PolicyEffect; matchedRule?: string; reasoning: string } {
  if (policy.rules.length === 0) return { effect: 'allow', reasoning: 'No rules compiled — action allowed by default.' };
  let dominant: PolicyEffect = 'allow';
  let matchedRule: string | undefined;
  const sorted = [...policy.rules].sort((a, b) => b.priority - a.priority);
  const matched: string[] = [];
  for (const rule of sorted) {
    if (!evaluateRule(rule, ctx)) continue;
    matched.push(rule.name);
    if (EFFECT_PRIORITY[rule.effect] > EFFECT_PRIORITY[dominant]) { dominant = rule.effect; matchedRule = rule.name; }
  }
  const reasoning = matched.length ? `Matched ${matched.length} rule(s). Dominant effect: ${dominant}. Rule: "${matched[0]}"` : 'No rules matched — action allowed by default.';
  return { effect: dominant, matchedRule, reasoning };
}

export function effectToOutcome(effect: PolicyEffect): OutcomeKey {
  if (effect === 'block') return 'blocked';
  if (effect === 'require_approval') return 'approval_required';
  if (effect === 'escalate') return 'escalated';
  if (effect === 'audit_only') return 'audited';
  return 'allowed';
}

export function diffPolicies(prev: CompiledPolicy | null, next: CompiledPolicy): Array<{ type: 'added' | 'removed' | 'unchanged' | 'header'; text: string }> {
  const prevLines = prev ? policyToLines(prev) : [];
  const nextLines = policyToLines(next);
  const out: Array<{ type: 'added' | 'removed' | 'unchanged' | 'header'; text: string }> = [];
  out.push({ type: 'header', text: `@@ Policy: ${next.name} @@` });
  const maxLen = Math.max(prevLines.length, nextLines.length);
  for (let i = 0; i < maxLen; i++) {
    const p = prevLines[i]; const n = nextLines[i];
    if (p === undefined) { out.push({ type: 'added', text: `+ ${n}` }); }
    else if (n === undefined) { out.push({ type: 'removed', text: `- ${p}` }); }
    else if (p === n) { out.push({ type: 'unchanged', text: `  ${n}` }); }
    else { out.push({ type: 'removed', text: `- ${p}` }); out.push({ type: 'added', text: `+ ${n}` }); }
  }
  return out;
}

function policyToLines(p: CompiledPolicy): string[] {
  const lines = [`name: ${p.name}`, `scope: ${p.scope}`, `domain: ${p.domain ?? '(any)'}`, `rules: (${p.rules.length})`];
  for (const r of p.rules) {
    lines.push(`  rule: ${r.name.slice(0, 60)}`);
    lines.push(`    effect: ${r.effect}`);
    if (r.requiredApproverRole) lines.push(`    approverRole: ${r.requiredApproverRole}`);
    if (r.escalateTo) lines.push(`    escalateTo: ${r.escalateTo}`);
    for (const c of r.conditions) lines.push(`    cond: ${c.field} ${c.operator} ${JSON.stringify(c.value)}`);
  }
  return lines;
}
