import type { Policy, PolicyRule, PolicyCondition, PolicyEffect } from "./types.js";
import { evaluatePolicies } from "./evaluator.js";

export interface CompiledRuleIR {
  description: string;
  effect: PolicyEffect;
  conditions: PolicyCondition[];
  requiredApproverRole?: string;
  escalateTo?: string;
  reason: string;
  priority: number;
  confidence: number;
  warnings: string[];
}

export interface CompiledPolicyIR {
  policyName: string;
  description: string;
  scope: "tenant" | "domain" | "action";
  domain?: string;
  actionTypes?: string[];
  rules: CompiledRuleIR[];
  overallConfidence: number;
  parseWarnings: string[];
}

export interface PolicyCompilerResult {
  input: string;
  ir: CompiledPolicyIR;
  policy: Policy;
  compilerVersion: string;
  compiledAt: number;
}

export interface PolicyVersionRecord {
  version: string;
  versionNumber: number;
  input: string;
  policy: Policy;
  compiledAt: number;
  author: string;
  authorId: string;
  message: string;
  signers: Array<{ name: string; role: string; signedAt: number }>;
}

export interface PolicyDiffLine {
  type: "added" | "removed" | "unchanged" | "header";
  content: string;
}

export interface PolicyPreviewCase {
  actionId: string;
  actionType: string;
  description: string;
  context: Record<string, unknown>;
  expectedEffect?: PolicyEffect;
  actualEffect: PolicyEffect;
  matchedRule?: string;
  reasoning: string;
  outcome: "blocked" | "allowed" | "approval_required" | "escalated" | "audited";
}

export interface TestCase {
  id: string;
  name: string;
  context: Record<string, unknown>;
  expectedOutcome: "blocked" | "allowed" | "approval_required" | "escalated";
  actualOutcome?: "blocked" | "allowed" | "approval_required" | "escalated";
  passed?: boolean;
  reasoning?: string;
}

const COMPILER_VERSION = "1.0.0";

const AMOUNT_PATTERN = /\$\s*([\d,]+(?:\.\d+)?)\s*k?\b/i;
const AMOUNT_WORD_PATTERN = /\b([\d,]+(?:\.\d+)?)\s*(thousand|million|k|m)?\s*dollars?\b/i;
const APPROVER_COUNT_PATTERN = /\b(\d+|one|two|three|four|five)\s+approvers?\b/i;
const ROLE_PATTERN = /\b(finance|compliance|legal|security|cfo|cto|ceo|manager|director|officer|admin|operator|approver|analyst)\b/gi;
const ACTION_PATTERN = /\b(payout|payment|transfer|approval|action|transaction|request|change|modification|deletion|export|write|read|access|dispatch|execution|deployment)\b/gi;
const DOMAIN_PATTERN = /\b(maritime|vessels?|terra|real.?estate|counsel|legal|compliance|finance|security|hr|it|infrastructure|operations)\b/gi;

function parseAmount(text: string): number | null {
  const dollarMatch = text.match(AMOUNT_PATTERN);
  if (dollarMatch) {
    const num = parseFloat(dollarMatch[1].replace(/,/g, ""));
    if (text.toLowerCase().includes("k") && !text.includes("$")) return num * 1000;
    return num;
  }
  const wordMatch = text.match(AMOUNT_WORD_PATTERN);
  if (wordMatch) {
    const num = parseFloat(wordMatch[1].replace(/,/g, ""));
    const suffix = (wordMatch[2] || "").toLowerCase();
    if (suffix === "thousand" || suffix === "k") return num * 1000;
    if (suffix === "million" || suffix === "m") return num * 1_000_000;
    return num;
  }
  return null;
}

function parseApproverCount(text: string): number | null {
  const match = text.match(APPROVER_COUNT_PATTERN);
  if (!match) return null;
  const word = match[1].toLowerCase();
  const map: Record<string, number> = { one: 1, two: 2, three: 3, four: 4, five: 5 };
  return map[word] ?? parseInt(word);
}

function extractRoles(text: string): string[] {
  const matches = text.match(ROLE_PATTERN) ?? [];
  return [...new Set(matches.map(r => r.toLowerCase()))];
}

function extractActions(text: string): string[] {
  const matches = text.match(ACTION_PATTERN) ?? [];
  return [...new Set(matches.map(a => a.toLowerCase()))];
}

function extractDomains(text: string): string[] {
  const matches = text.match(DOMAIN_PATTERN) ?? [];
  return [...new Set(matches.map(d => d.toLowerCase().replace(/s$/, "")))];
}

function parseWordCount(word: string): number | null {
  const map: Record<string, number> = { one: 1, two: 2, three: 3, four: 4, five: 5 };
  return map[word.toLowerCase()] ?? null;
}

function sentenceToRule(sentence: string, index: number): CompiledRuleIR {
  const s = sentence.trim().toLowerCase();
  const warnings: string[] = [];
  const conditions: PolicyCondition[] = [];
  let effect: PolicyEffect = "allow";
  let requiredApproverRole: string | undefined;
  let escalateTo: string | undefined;
  let priority = 100 - index * 10;
  let confidence = 0.85;

  const amount = parseAmount(sentence);
  const roles = extractRoles(sentence);
  const actions = extractActions(sentence);
  const domains = extractDomains(sentence);

  if (amount !== null) {
    const isAbove = /\b(over|above|exceeding|greater than|more than|exceed[s]?)\b/.test(s);
    const isBelow = /\b(under|below|less than|within|up to|at most)\b/.test(s);
    if (isAbove) {
      conditions.push({ field: "estimatedCostUsd", operator: "gt", value: amount });
    } else if (isBelow) {
      conditions.push({ field: "estimatedCostUsd", operator: "lte", value: amount });
    } else {
      conditions.push({ field: "estimatedCostUsd", operator: "gte", value: amount });
      warnings.push(`Ambiguous amount comparison — defaulted to ≥ $${amount.toLocaleString()}. Use "over" or "under" to be explicit.`);
      confidence -= 0.1;
    }
  }

  if (domains.length > 0) {
    conditions.push({ field: "domain", operator: "in", value: domains });
  }

  if (actions.length > 0 && !/\b(any|all|every)\b/.test(s)) {
    conditions.push({ field: "action", operator: "in", value: actions });
  }

  const isBlock = /\b(block|deny|prohibit|forbidden|forbid|prevent|reject|disallow|no\s+\w+\s+(over|above|without))\b/.test(s);
  const isEscalate = /\b(escalat[e]?|elevat[e]?|route to|notify)\b/.test(s);
  const isAudit = /\b(audit|log only|record|track|observe)\b/.test(s);
  const isRequireApproval = /\b(require[s]?\s+(approval|sign-off|sign\s*off|review|approver)|need[s]?\s+(approval|sign-off|sign\s*off)|without\s+(approval|sign-off))\b/.test(s);
  const isAllow = /\b(allow[s]?|permit[s]?|approve[s]? automatically|auto-approve|allowed)\b/.test(s);

  const approverCount = parseApproverCount(sentence);

  if (isBlock && !isRequireApproval) {
    effect = "block";
    priority += 20;
  } else if (isEscalate && !isRequireApproval) {
    effect = "escalate";
    const toMatch = sentence.match(/(?:escalat[e]?\s+to|route\s+to|notify)\s+([a-z\s]+?)(?:\s+and|\.|,|$)/i);
    escalateTo = toMatch ? toMatch[1].trim() : (roles[0] ?? "compliance_officer");
    priority += 10;
  } else if (isRequireApproval || approverCount !== null) {
    effect = "require_approval";
    if (roles.length > 0) {
      requiredApproverRole = roles[0];
    } else {
      requiredApproverRole = "approver";
      warnings.push("No specific approver role identified — defaulted to 'approver'. Consider specifying a role (e.g. 'finance officer').");
      confidence -= 0.05;
    }
    if (approverCount !== null && approverCount > 1) {
      conditions.push({ field: "requiredApproverCount", operator: "gte", value: approverCount });
    }
    priority += 15;
  } else if (isAudit) {
    effect = "audit_only";
  } else if (isAllow) {
    effect = "allow";
  } else {
    effect = "require_approval";
    requiredApproverRole = roles[0] ?? "approver";
    warnings.push("Effect could not be determined with high confidence — defaulted to 'require_approval'.");
    confidence -= 0.15;
  }

  if (conditions.length === 0 && effect !== "allow" && effect !== "audit_only") {
    warnings.push("No specific conditions parsed — this rule will match ALL actions. Refine your rule for precision.");
    confidence -= 0.1;
  }

  if (conditions.length === 0 && effect === "allow") {
    confidence -= 0.05;
  }

  return {
    description: sentence.trim(),
    effect,
    conditions,
    requiredApproverRole,
    escalateTo,
    reason: buildReason(sentence, effect, amount, roles, approverCount),
    priority: Math.max(priority, 10),
    confidence: Math.max(0.1, Math.min(1.0, confidence)),
    warnings,
  };
}

function buildReason(
  sentence: string,
  effect: PolicyEffect,
  amount: number | null,
  roles: string[],
  approverCount: number | null
): string {
  const parts: string[] = [];
  if (amount !== null) parts.push(`amount threshold $${amount.toLocaleString()}`);
  if (roles.length > 0) parts.push(`roles: ${roles.join(", ")}`);
  if (approverCount !== null) parts.push(`${approverCount} approver(s) required`);
  const context = parts.length > 0 ? ` (${parts.join("; ")})` : "";
  return `Compiled from: "${sentence.trim()}"${context}`;
}

function inferPolicyName(text: string): string {
  const actions = extractActions(text);
  const domains = extractDomains(text);
  const parts: string[] = [];
  if (domains.length > 0) parts.push(domains[0].charAt(0).toUpperCase() + domains[0].slice(1));
  if (actions.length > 0) parts.push(actions[0].charAt(0).toUpperCase() + actions[0].slice(1));
  parts.push("Policy");
  return parts.join(" ");
}

function splitToSentences(text: string): string[] {
  return text
    .split(/[.\n]+/)
    .map(s => s.trim())
    .filter(s => s.length > 5);
}

export function compilePolicy(
  input: string,
  policyId?: string,
  existingVersion?: number
): PolicyCompilerResult {
  const sentences = splitToSentences(input);
  const parseWarnings: string[] = [];

  if (sentences.length === 0) {
    parseWarnings.push("No parseable rules found. Write rules as complete sentences.");
  }

  const ruleIRs = sentences.map((s, i) => sentenceToRule(s, i));
  const domains = extractDomains(input);
  const actions = extractActions(input);

  const overallConfidence =
    ruleIRs.length === 0
      ? 0
      : ruleIRs.reduce((sum, r) => sum + r.confidence, 0) / ruleIRs.length;

  if (overallConfidence < 0.6) {
    parseWarnings.push("Low parse confidence. Consider rewording rules using action-threshold-approver patterns.");
  }

  const ir: CompiledPolicyIR = {
    policyName: inferPolicyName(input),
    description: input.slice(0, 200).trim(),
    scope: domains.length > 0 ? "domain" : actions.length > 0 ? "action" : "tenant",
    domain: domains[0],
    actionTypes: actions.length > 0 ? actions : undefined,
    rules: ruleIRs,
    overallConfidence,
    parseWarnings,
  };

  const now = Date.now();
  const id = policyId ?? `pol_compiled_${now}`;
  const version = existingVersion != null ? existingVersion + 1 : 1;

  const policy: Policy = {
    id,
    name: ir.policyName,
    description: ir.description,
    scope: ir.scope,
    domain: ir.domain,
    actionTypes: ir.actionTypes,
    rules: ruleIRs.map((r, i) => ({
      id: `rule_${id}_${i}`,
      name: r.description.slice(0, 80),
      conditions: r.conditions,
      effect: r.effect,
      requiredApproverRole: r.requiredApproverRole,
      escalateTo: r.escalateTo,
      reason: r.reason,
      priority: r.priority,
    } satisfies PolicyRule)),
    isActive: false,
    priority: 100,
    complianceFramework: undefined,
    createdAt: now,
    updatedAt: now,
  };

  return {
    input,
    ir,
    policy,
    compilerVersion: COMPILER_VERSION,
    compiledAt: now,
  };
}

export function diffPolicies(
  prev: Policy | null,
  next: Policy
): PolicyDiffLine[] {
  const prevLines = prev ? formatPolicyAsLines(prev) : [];
  const nextLines = formatPolicyAsLines(next);
  const lines: PolicyDiffLine[] = [];

  lines.push({ type: "header", content: `@@ Policy: ${next.name} @@` });

  const maxLen = Math.max(prevLines.length, nextLines.length);
  let i = 0, j = 0;

  while (i < prevLines.length || j < nextLines.length) {
    const p = prevLines[i];
    const n = nextLines[j];

    if (p === undefined) {
      lines.push({ type: "added", content: `+ ${n}` });
      j++;
    } else if (n === undefined) {
      lines.push({ type: "removed", content: `- ${p}` });
      i++;
    } else if (p === n) {
      lines.push({ type: "unchanged", content: `  ${n}` });
      i++;
      j++;
    } else {
      lines.push({ type: "removed", content: `- ${p}` });
      lines.push({ type: "added", content: `+ ${n}` });
      i++;
      j++;
    }
  }

  void maxLen;
  return lines;
}

function formatPolicyAsLines(policy: Policy): string[] {
  const lines: string[] = [
    `name: ${policy.name}`,
    `scope: ${policy.scope}`,
    `domain: ${policy.domain ?? "(any)"}`,
    `actionTypes: ${policy.actionTypes?.join(", ") ?? "(any)"}`,
    `rules: (${policy.rules.length})`,
  ];
  for (const rule of policy.rules) {
    lines.push(`  rule: ${rule.name}`);
    lines.push(`    effect: ${rule.effect}`);
    if (rule.requiredApproverRole) lines.push(`    approverRole: ${rule.requiredApproverRole}`);
    if (rule.escalateTo) lines.push(`    escalateTo: ${rule.escalateTo}`);
    for (const cond of rule.conditions ?? []) {
      lines.push(`    condition: ${cond.field} ${cond.operator} ${JSON.stringify(cond.value)}`);
    }
  }
  return lines;
}

export function runTestCase(
  testCase: TestCase,
  policy: Policy
): TestCase & { passed: boolean; actualOutcome: TestCase["expectedOutcome"]; reasoning: string } {
  const result = evaluatePolicies([policy], {
    action: String(testCase.context["action"] ?? "test_action"),
    domain: String(testCase.context["domain"] ?? ""),
    subject: { roles: (testCase.context["roles"] as string[]) ?? ["operator"] },
    resource: {
      type: String(testCase.context["resourceType"] ?? "test_resource"),
      attributes: testCase.context as Record<string, unknown>,
    },
    context: testCase.context,
    estimatedCostUsd: testCase.context["estimatedCostUsd"] as number | undefined,
    confidence: (testCase.context["confidence"] as number) ?? 0.9,
  });

  let actualOutcome: TestCase["expectedOutcome"];
  if (result.effect === "block") actualOutcome = "blocked";
  else if (result.effect === "require_approval") actualOutcome = "approval_required";
  else if (result.effect === "escalate") actualOutcome = "escalated";
  else actualOutcome = "allowed";

  return {
    ...testCase,
    actualOutcome,
    passed: actualOutcome === testCase.expectedOutcome,
    reasoning: result.reasoning,
  };
}

export function generatePreviewCases(policy: Policy): PolicyPreviewCase[] {
  const cases: PolicyPreviewCase[] = [
    {
      actionId: "prev_001",
      actionType: "payout",
      description: "Payout of $180,000 to vendor ABC — single approver",
      context: { estimatedCostUsd: 180_000, action: "payout", domain: "finance", roles: ["operator"] },
      actualEffect: "allow",
      reasoning: "",
      outcome: "allowed",
    },
    {
      actionId: "prev_002",
      actionType: "payout",
      description: "Payout of $320,000 for vessel charter — no additional approvers",
      context: { estimatedCostUsd: 320_000, action: "payout", domain: "maritime", roles: ["operator"] },
      actualEffect: "allow",
      reasoning: "",
      outcome: "allowed",
    },
    {
      actionId: "prev_003",
      actionType: "transfer",
      description: "Internal fund transfer of $45,000",
      context: { estimatedCostUsd: 45_000, action: "transfer", domain: "finance", roles: ["operator"] },
      actualEffect: "allow",
      reasoning: "",
      outcome: "allowed",
    },
    {
      actionId: "prev_004",
      actionType: "export",
      description: "Export of compliance report to external auditor",
      context: { estimatedCostUsd: 0, action: "export", domain: "compliance", roles: ["analyst"] },
      actualEffect: "allow",
      reasoning: "",
      outcome: "allowed",
    },
    {
      actionId: "prev_005",
      actionType: "deletion",
      description: "Deletion of historical transaction batch",
      context: { estimatedCostUsd: 0, action: "deletion", domain: "finance", roles: ["operator"] },
      actualEffect: "allow",
      reasoning: "",
      outcome: "allowed",
    },
  ];

  return cases.map(c => {
    const result = evaluatePolicies([policy], {
      action: c.actionType,
      domain: c.context["domain"] as string,
      subject: { roles: (c.context["roles"] as string[]) ?? ["operator"] },
      resource: {
        type: c.actionType,
        domain: c.context["domain"] as string,
        attributes: c.context,
      },
      context: c.context,
      estimatedCostUsd: c.context["estimatedCostUsd"] as number | undefined,
      confidence: 0.9,
    });

    let outcome: PolicyPreviewCase["outcome"];
    if (result.effect === "block") outcome = "blocked";
    else if (result.effect === "require_approval") outcome = "approval_required";
    else if (result.effect === "escalate") outcome = "escalated";
    else if (result.effect === "audit_only") outcome = "audited";
    else outcome = "allowed";

    return {
      ...c,
      actualEffect: result.effect,
      matchedRule: result.matchedPolicies[0]?.ruleName,
      reasoning: result.reasoning,
      outcome,
    };
  });
}
