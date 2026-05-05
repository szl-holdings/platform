import type { CompiledPolicy, CompiledRule, ParsedCondition, PolicyEffect } from './types';

export function uid(): string {
  return Math.random().toString(36).slice(2, 11);
}

export function parseAmount(text: string): number | null {
  const m = text.match(/\$\s*([\d,]+(?:\.\d+)?)\s*k?\b/i);
  if (m) {
    const n = parseFloat(m[1].replace(/,/g, ''));
    const lower = text.toLowerCase();
    const afterDollar = lower.slice(lower.indexOf('$') + 1);
    if (/\bk\b/.test(afterDollar.slice(0, 10))) return n * 1000;
    return n;
  }
  const m2 = text.match(/\b([\d,]+(?:\.\d+)?)\s*(thousand|million)\b/i);
  if (m2) {
    const n = parseFloat(m2[1].replace(/,/g, ''));
    if (/million/i.test(m2[2])) return n * 1_000_000;
    return n * 1_000;
  }
  return null;
}

export function parseApproverCount(text: string): number | null {
  const m = text.match(/\b(\d+|one|two|three|four|five)\s+approvers?\b/i);
  if (!m) return null;
  const map: Record<string, number> = { one: 1, two: 2, three: 3, four: 4, five: 5 };
  return map[m[1].toLowerCase()] ?? parseInt(m[1], 10);
}

export function extractRoles(text: string): string[] {
  const matches = text.match(/\b(finance|compliance|legal|security|cfo|cto|ceo|manager|director|officer|admin|operator|approver|analyst)\b/gi) ?? [];
  return [...new Set(matches.map((r) => r.toLowerCase()))];
}

export function buildReason(s: string, _effect: PolicyEffect, amount: number | null, roles: string[], approverCount: number | null): string {
  const parts: string[] = [];
  if (amount !== null) parts.push(`$${amount.toLocaleString()} threshold`);
  if (roles.length) parts.push(`role: ${roles[0]}`);
  if (approverCount) parts.push(`${approverCount} approver(s)`);
  const ctx = parts.length ? ` (${parts.join('; ')})` : '';
  return `Compiled from: "${s.slice(0, 80)}"${ctx}`;
}

export function inferName(input: string): string {
  const domains = input.match(/\b(maritime|vessels?|terra|real.?estate|counsel|legal|compliance|finance|security)\b/gi) ?? [];
  const actions = input.match(/\b(payout|payment|transfer|approval|transaction|export|deletion|deployment)\b/gi) ?? [];
  const parts: string[] = [];
  if (domains[0]) parts.push(domains[0].charAt(0).toUpperCase() + domains[0].slice(1).toLowerCase());
  if (actions[0]) parts.push(actions[0].charAt(0).toUpperCase() + actions[0].slice(1).toLowerCase());
  parts.push('Policy');
  return parts.join(' ');
}

export function compileNaturalLanguage(input: string): CompiledPolicy {
  const sentences = input.split(/[.\n]+/).map((s) => s.trim()).filter((s) => s.length > 5);
  const rules: CompiledRule[] = [];
  const globalWarnings: string[] = [];

  for (let i = 0; i < sentences.length; i++) {
    const s = sentences[i];
    const lower = s.toLowerCase();
    const conditions: ParsedCondition[] = [];
    const warnings: string[] = [];
    let effect: PolicyEffect = 'require_approval';
    let requiredApproverRole: string | undefined;
    let escalateTo: string | undefined;
    let confidence = 0.88;
    let priority = 100 - i * 10;

    const amount = parseAmount(s);
    if (amount !== null) {
      const isAbove = /\b(over|above|exceeding|greater than|more than|exceed)\b/.test(lower);
      const isBelow = /\b(under|below|less than|within|up to|at most)\b/.test(lower);
      if (isAbove) {
        conditions.push({ field: 'estimatedCostUsd', operator: 'gt', value: amount, label: `cost > $${amount.toLocaleString()}` });
      } else if (isBelow) {
        conditions.push({ field: 'estimatedCostUsd', operator: 'lte', value: amount, label: `cost ≤ $${amount.toLocaleString()}` });
      } else {
        conditions.push({ field: 'estimatedCostUsd', operator: 'gte', value: amount, label: `cost ≥ $${amount.toLocaleString()}` });
        warnings.push(`Ambiguous threshold direction — defaulted to ≥ $${amount.toLocaleString()}`);
        confidence -= 0.1;
      }
    }

    const roles = extractRoles(s);
    const approverCount = parseApproverCount(s);
    const isBlock = /\b(block|deny|prohibit|forbidden|forbid|prevent|reject|disallow)\b/.test(lower);
    const isEscalate = /\b(escalat[e]?|elevat[e]?|route to|notify)\b/.test(lower);
    const isAudit = /\b(audit|log only|record|observe)\b/.test(lower);
    const isApproval = /\b(require[s]?\s+(approval|sign-off|sign\s*off|review|approver)|need[s]?\s+(approval|sign-off)|without\s+(approval|sign-off))\b/.test(lower);
    const isAllow = /\b(allow[s]?|permit[s]?|auto-approve|automatically)\b/.test(lower);

    if (isBlock && !isApproval) {
      effect = 'block';
      priority += 20;
    } else if (isEscalate && !isApproval) {
      effect = 'escalate';
      priority += 10;
      const toMatch = s.match(/(?:escalat[e]?\s+to|route\s+to|notify)\s+([a-z\s]+?)(?:\s+and|\.|,|$)/i);
      escalateTo = toMatch ? toMatch[1].trim() : (roles[0] ?? 'compliance_officer');
    } else if (isApproval || approverCount !== null) {
      effect = 'require_approval';
      priority += 15;
      requiredApproverRole = roles.length > 0 ? roles[0] : 'approver';
      if (!roles.length) { warnings.push("No specific approver role identified — defaulted to 'approver'"); confidence -= 0.05; }
      if (approverCount && approverCount > 1) conditions.push({ field: 'requiredApproverCount', operator: 'gte', value: approverCount, label: `≥ ${approverCount} approvers` });
    } else if (isAudit) {
      effect = 'audit_only';
    } else if (isAllow) {
      effect = 'allow';
    } else {
      warnings.push("Effect was not explicitly stated — defaulted to 'require_approval'");
      confidence -= 0.12;
      requiredApproverRole = roles[0] ?? 'approver';
    }

    if (conditions.length === 0 && effect !== 'allow' && effect !== 'audit_only') {
      warnings.push('No conditions matched — this rule will apply to ALL actions');
      confidence -= 0.08;
    }

    rules.push({
      id: `rule_${uid()}`, name: s.length > 70 ? `${s.slice(0, 70)}…` : s, sourceText: s,
      effect, conditions, requiredApproverRole, escalateTo,
      reason: buildReason(s, effect, amount, roles, approverCount),
      confidence: Math.max(0.1, Math.min(1.0, confidence)), warnings, priority: Math.max(priority, 10),
    });
  }

  if (rules.length === 0) globalWarnings.push('No parseable rules found. Try writing rules as complete sentences.');

  const domains = (input.match(/\b(maritime|vessels?|terra|real.?estate|counsel|legal|compliance|finance|security|hr|it|infrastructure|operations)\b/gi) ?? []).map((d) => d.toLowerCase());
  const overallConfidence = rules.length ? rules.reduce((s, r) => s + r.confidence, 0) / rules.length : 0;

  return {
    id: `pol_${uid()}`, name: inferName(input),
    scope: domains.length > 0 ? 'domain' : 'action', domain: domains[0],
    rules, overallConfidence, warnings: globalWarnings, compiledAt: Date.now(),
  };
}
