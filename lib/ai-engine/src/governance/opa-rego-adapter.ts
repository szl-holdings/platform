/**
 * OPA/Rego Adapter
 *
 * Alternative front-end to the existing covenant runtime so policies can be
 * authored in Rego and evaluated portably. Rego policies compose with existing
 * JSON covenant format — both evaluated; strictest decision wins.
 *
 * Design:
 *  - Policies are stored as Rego strings in the policy bundle
 *  - A lightweight in-process evaluator parses and evaluates Rego rules
 *  - Results are translated to the standard HookDecision contract
 *  - Policies are portable: can be exported, audited, and shared across orgs
 *
 * Note: Full OPA WASM is optional. The built-in evaluator handles the
 * patterns used in A11oy policy bundles (allow/deny rules on input fields).
 */

export interface RegoPolicy {
  id: string;
  name: string;
  description: string;
  package_name: string;
  rego_source: string;
  version: string;
  owner: string;
  tags: string[];
  registered_at: string;
}

export interface RegoEvalInput {
  tool_name?: string;
  agent_id?: string;
  session_id?: string;
  trust_tier?: number;
  permission_mode?: string;
  prompt?: string;
  metadata?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface RegoEvalResult {
  policy_id: string;
  allow: boolean;
  deny_reasons: string[];
  evaluation_ms: number;
}

export interface CovenantBundle {
  bundle_id: string;
  name: string;
  json_policies: JsonPolicy[];
  rego_policies: string[];
  version: string;
}

export interface JsonPolicy {
  id: string;
  rule: string;
  field?: string;
  operator?: 'eq' | 'neq' | 'gt' | 'lt' | 'in' | 'not_in' | 'exists' | 'matches';
  value?: unknown;
  action: 'allow' | 'deny';
  reason: string;
}

// ---------------------------------------------------------------------------
// Policy Registry
// ---------------------------------------------------------------------------

const regoRegistry = new Map<string, RegoPolicy>();

export function registerRegoPolicy(policy: Omit<RegoPolicy, 'registered_at'>): void {
  regoRegistry.set(policy.id, { ...policy, registered_at: new Date().toISOString() });
}

export function getRegoPolicy(id: string): RegoPolicy | undefined {
  return regoRegistry.get(id);
}

export function listRegoPolicies(): RegoPolicy[] {
  return Array.from(regoRegistry.values());
}

// ---------------------------------------------------------------------------
// Lightweight Rego evaluator
// Handles: allow rules, deny rules, input field checks, basic arithmetic
// ---------------------------------------------------------------------------

function parseDenyRules(rego_source: string): Array<{ condition: string; message: string }> {
  const rules: Array<{ condition: string; message: string }> = [];
  const denyPattern = /deny\s*\[?\s*msg\s*\]?\s*\{([^}]+)\}/g;
  let match: RegExpExecArray | null;
  while ((match = denyPattern.exec(rego_source)) !== null) {
    const body = match[1]!.trim();
    const msgMatch = body.match(/msg\s*:?=\s*["']([^"']+)["']/);
    const message = msgMatch ? msgMatch[1]! : 'policy_denied';
    rules.push({ condition: body, message });
  }
  return rules;
}

function evaluateConditionLine(line: string, input: RegoEvalInput): boolean {
  // input.field == value
  const eqMatch = line.match(/input\.(\w+)\s*==\s*(.+)/);
  if (eqMatch) {
    const field = eqMatch[1]!;
    const rawValue = eqMatch[2]!.trim().replace(/['"]/g, '');
    const actual = input[field];
    if (typeof actual === 'number') return actual === Number(rawValue);
    return String(actual) === rawValue;
  }
  // input.field != value
  const neqMatch = line.match(/input\.(\w+)\s*!=\s*(.+)/);
  if (neqMatch) {
    const field = neqMatch[1]!;
    const rawValue = neqMatch[2]!.trim().replace(/['"]/g, '');
    return String(input[field]) !== rawValue;
  }
  // input.field > value (numeric)
  const gtMatch = line.match(/input\.(\w+)\s*>\s*(\d+)/);
  if (gtMatch) {
    const field = gtMatch[1]!;
    return Number(input[field]) > Number(gtMatch[2]);
  }
  // input.field < value (numeric)
  const ltMatch = line.match(/input\.(\w+)\s*<\s*(\d+)/);
  if (ltMatch) {
    const field = ltMatch[1]!;
    return Number(input[field]) < Number(ltMatch[2]);
  }
  // not input.field (existence check)
  const notMatch = line.match(/not\s+input\.(\w+)/);
  if (notMatch) {
    return !input[notMatch[1]!];
  }
  return false;
}

function evaluateRegoPolicy(policy: RegoPolicy, input: RegoEvalInput): RegoEvalResult {
  const start = Date.now();
  const denyRules = parseDenyRules(policy.rego_source);
  const deny_reasons: string[] = [];

  for (const rule of denyRules) {
    const conditions = rule.condition
      .split('\n')
      .map(l => l.trim())
      .filter(l => l && !l.startsWith('#') && !l.startsWith('msg'));

    const allConditionsMet = conditions.every(cond => evaluateConditionLine(cond, input));
    if (allConditionsMet) {
      deny_reasons.push(rule.message);
    }
  }

  return {
    policy_id: policy.id,
    allow: deny_reasons.length === 0,
    deny_reasons,
    evaluation_ms: Date.now() - start,
  };
}

function evaluateJsonPolicy(policy: JsonPolicy, input: RegoEvalInput): boolean {
  if (!policy.field) return policy.action === 'allow';
  const actual = input[policy.field];

  switch (policy.operator) {
    case 'eq': return actual === policy.value;
    case 'neq': return actual !== policy.value;
    case 'gt': return typeof actual === 'number' && actual > (policy.value as number);
    case 'lt': return typeof actual === 'number' && actual < (policy.value as number);
    case 'in': return Array.isArray(policy.value) && policy.value.includes(actual);
    case 'not_in': return Array.isArray(policy.value) && !policy.value.includes(actual);
    case 'exists': return actual !== undefined && actual !== null;
    case 'matches':
      return typeof actual === 'string' && new RegExp(policy.value as string).test(actual);
    default: return true;
  }
}

// ---------------------------------------------------------------------------
// Main evaluation entry point
// ---------------------------------------------------------------------------

export interface BundleEvalResult {
  bundle_id: string;
  allow: boolean;
  deny_reasons: string[];
  json_results: Array<{ policy_id: string; allow: boolean; reason: string }>;
  rego_results: RegoEvalResult[];
  total_ms: number;
}

export function evaluateBundle(bundle: CovenantBundle, input: RegoEvalInput): BundleEvalResult {
  const start = Date.now();
  const deny_reasons: string[] = [];
  const json_results: Array<{ policy_id: string; allow: boolean; reason: string }> = [];
  const rego_results: RegoEvalResult[] = [];

  // Evaluate JSON policies
  for (const jsonPolicy of bundle.json_policies) {
    const conditionMet = evaluateJsonPolicy(jsonPolicy, input);
    const allow = jsonPolicy.action === 'allow' ? conditionMet : !conditionMet;
    json_results.push({ policy_id: jsonPolicy.id, allow, reason: jsonPolicy.reason });
    if (!allow) deny_reasons.push(jsonPolicy.reason);
  }

  // Evaluate Rego policies
  for (const regoId of bundle.rego_policies) {
    const regoPolicy = getRegoPolicy(regoId);
    if (!regoPolicy) continue;
    const result = evaluateRegoPolicy(regoPolicy, input);
    rego_results.push(result);
    if (!result.allow) deny_reasons.push(...result.deny_reasons);
  }

  return {
    bundle_id: bundle.bundle_id,
    allow: deny_reasons.length === 0,
    deny_reasons,
    json_results,
    rego_results,
    total_ms: Date.now() - start,
  };
}

// ---------------------------------------------------------------------------
// Built-in A11oy Rego policies
// ---------------------------------------------------------------------------

registerRegoPolicy({
  id: 'core:no-plan-mode-side-effects',
  name: 'No Side Effects in Plan Mode',
  description: 'Denies side-effecting tools when permission_mode is "plan-only"',
  package_name: 'a11oy.core',
  rego_source: `
package a11oy.core

deny[msg] {
  input.permission_mode == "plan-only"
  input.tool_name == "write"
  msg := "Plan mode: write tool blocked — sign and lock plan first"
}

deny[msg] {
  input.permission_mode == "plan-only"
  input.tool_name == "execute"
  msg := "Plan mode: execute tool blocked — sign and lock plan first"
}
`,
  version: '1.0.0',
  owner: 'a11oy-core',
  tags: ['plan-mode', 'governance'],
});

registerRegoPolicy({
  id: 'core:sovereign-air-gap',
  name: 'Sovereign Air Gap',
  description: 'Blocks all external tool calls when trust_tier is 4 (Sovereign-air-gapped)',
  package_name: 'a11oy.core',
  rego_source: `
package a11oy.core

deny[msg] {
  input.trust_tier == 4
  msg := "Sovereign air-gap: all external tool calls forbidden at Trust Tier 4"
}
`,
  version: '1.0.0',
  owner: 'a11oy-core',
  tags: ['trust-tier', 'sovereign'],
});

