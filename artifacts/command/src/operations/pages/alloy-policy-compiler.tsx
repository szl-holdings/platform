import { apiFetch } from '@szl-holdings/shared-ui/api-fetch';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  CheckCircle,
  CheckSquare,
  ChevronDown,
  ChevronRight,
  Clock,
  Code2,
  Copy,
  Eye,
  FileCode,
  FlaskConical,
  GitBranch,
  History,
  Info,
  Lock,
  Play,
  Plus,
  RotateCcw,
  Save,
  Shield,
  Sparkles,
  Trash2,
  Undo2,
  User,
  Wand2,
  XCircle,
  Zap,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const STUDIO_ID = 'default';

interface ServerPolicyVersion {
  externalId: string;
  studioId: string;
  versionNumber: number;
  input: string;
  policy: CompiledPolicy;
  author: string;
  authorId: string;
  message: string;
  signers: Array<{ name: string; role: string; signedAt: number }>;
  savedAt: string;
}

interface ServerTestCase {
  externalId: string;
  studioId: string;
  name: string;
  context: Record<string, unknown>;
  expectedOutcome: TestCase['expectedOutcome'];
}

interface PolicyCompilerStateResponse {
  studioId: string;
  versions: ServerPolicyVersion[];
  testCases: ServerTestCase[];
}

interface ApiEnvelope<T> {
  data?: T;
}

function fromServerVersion(v: ServerPolicyVersion): PolicyVersion {
  const savedAtMs = (() => {
    const ms = Date.parse(v.savedAt);
    return Number.isFinite(ms) ? ms : Date.now();
  })();
  return {
    id: v.externalId,
    versionNumber: v.versionNumber,
    input: v.input,
    policy: v.policy,
    author: v.author,
    authorId: v.authorId,
    savedAt: savedAtMs,
    message: v.message,
    signers: Array.isArray(v.signers) ? v.signers : [],
    isActive: !!(v.policy as Record<string, unknown>).isActive,
  };
}

function fromServerTestCase(t: ServerTestCase): TestCase {
  return {
    id: t.externalId,
    name: t.name,
    context: t.context ?? {},
    expectedOutcome: t.expectedOutcome,
  };
}

const API_BASE = (import.meta.env.BASE_URL ?? '/').replace(/\/$/, '');
const LLM_THRESHOLD = 0.7;

const BG = { page: '#080c14', surface: '#0c1018', elevated: '#10141e', card: '#111722' } as const;
const BORDER = {
  subtle: 'rgba(255,255,255,0.04)',
  muted: 'rgba(255,255,255,0.07)',
  accent: 'rgba(212,160,84,0.3)',
} as const;
const TEXT = {
  primary: 'rgba(255,255,255,0.88)',
  secondary: 'rgba(255,255,255,0.55)',
  tertiary: 'rgba(255,255,255,0.3)',
  muted: 'rgba(255,255,255,0.15)',
} as const;
const ACCENT = '#d4a054';

type PolicyEffect = 'allow' | 'require_approval' | 'escalate' | 'block' | 'audit_only';
type OutcomeKey = 'blocked' | 'allowed' | 'approval_required' | 'escalated' | 'audited';

interface ParsedCondition {
  field: string;
  operator: 'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'in' | 'not_in';
  value: unknown;
  label: string;
}

interface CompiledRule {
  id: string;
  name: string;
  sourceText: string;
  effect: PolicyEffect;
  conditions: ParsedCondition[];
  requiredApproverRole?: string;
  escalateTo?: string;
  reason: string;
  confidence: number;
  warnings: string[];
  priority: number;
  /** LLM-assist state — present when the operator triggered AI repair. */
  llmAssisted?: boolean;
  llmConfidence?: number;
  llmStatus?: 'idle' | 'loading' | 'applied' | 'error';
  llmError?: string;
  llmNote?: string;
  /** Snapshot of the deterministic parse so the operator can revert. */
  deterministicSnapshot?: Pick<
    CompiledRule,
    | 'effect'
    | 'conditions'
    | 'requiredApproverRole'
    | 'escalateTo'
    | 'reason'
    | 'confidence'
    | 'warnings'
  >;
}

interface LLMAssistResponseRule {
  effect?: PolicyEffect;
  conditions?: Array<{ field: string; operator: ParsedCondition['operator']; value: unknown }>;
  requiredApproverRole?: string;
  escalateTo?: string;
  reason?: string;
  confidence?: number;
  notes?: string;
}

interface LLMAssistResponse {
  sentence: string;
  result: LLMAssistResponseRule | null;
  modelUsed: string;
  llmAvailable: boolean;
  fallbackReason?: string;
}

interface CompiledPolicy {
  id: string;
  name: string;
  scope: 'tenant' | 'domain' | 'action';
  domain?: string;
  rules: CompiledRule[];
  overallConfidence: number;
  warnings: string[];
  compiledAt: number;
}

interface PolicyVersion {
  id: string;
  versionNumber: number;
  input: string;
  policy: CompiledPolicy;
  author: string;
  authorId: string;
  savedAt: number;
  message: string;
  signers: Array<{ name: string; role: string; signedAt: number }>;
  isActive: boolean;
}

interface TestCase {
  id: string;
  name: string;
  context: Record<string, unknown>;
  expectedOutcome: 'blocked' | 'allowed' | 'approval_required' | 'escalated';
  actualOutcome?: 'blocked' | 'allowed' | 'approval_required' | 'escalated';
  passed?: boolean;
  reasoning?: string;
  ran?: boolean;
}

interface PreviewCase {
  id: string;
  actionType: string;
  description: string;
  context: Record<string, unknown>;
  outcome?: OutcomeKey;
  matchedRule?: string;
  reasoning?: string;
  previousOutcome?: OutcomeKey;
}

type Tab = 'author' | 'preview' | 'tests' | 'history';

const EFFECT_CFG: Record<
  PolicyEffect,
  { label: string; color: string; bg: string; border: string; Icon: React.ElementType }
> = {
  allow: {
    label: 'Allow',
    color: '#22c55e',
    bg: 'rgba(34,197,94,0.1)',
    border: 'rgba(34,197,94,0.3)',
    Icon: CheckCircle,
  },
  require_approval: {
    label: 'Require Approval',
    color: ACCENT,
    bg: 'rgba(212,160,84,0.1)',
    border: 'rgba(212,160,84,0.3)',
    Icon: Clock,
  },
  escalate: {
    label: 'Escalate',
    color: '#ec4899',
    bg: 'rgba(236,72,153,0.1)',
    border: 'rgba(236,72,153,0.3)',
    Icon: ArrowRight,
  },
  block: {
    label: 'Block',
    color: '#ef4444',
    bg: 'rgba(239,68,68,0.1)',
    border: 'rgba(239,68,68,0.3)',
    Icon: XCircle,
  },
  audit_only: {
    label: 'Audit Only',
    color: '#8b7ac8',
    bg: 'rgba(139,122,200,0.1)',
    border: 'rgba(139,122,200,0.3)',
    Icon: Eye,
  },
};

const OUTCOME_CFG: Record<
  OutcomeKey,
  { label: string; color: string; bg: string; Icon: React.ElementType }
> = {
  allowed: { label: 'Allowed', color: '#22c55e', bg: 'rgba(34,197,94,0.08)', Icon: CheckCircle },
  blocked: { label: 'Blocked', color: '#ef4444', bg: 'rgba(239,68,68,0.08)', Icon: XCircle },
  approval_required: {
    label: 'Needs Approval',
    color: ACCENT,
    bg: 'rgba(212,160,84,0.08)',
    Icon: Clock,
  },
  escalated: {
    label: 'Escalated',
    color: '#ec4899',
    bg: 'rgba(236,72,153,0.08)',
    Icon: AlertTriangle,
  },
  audited: { label: 'Audited', color: '#8b7ac8', bg: 'rgba(139,122,200,0.08)', Icon: Eye },
};

const PATTERN_SUGGESTIONS = [
  'No payout over $250,000 without two approvers and a finance sign-off',
  'Block all transactions exceeding $500,000 without compliance officer review',
  'Require finance approval for any payment above $50,000',
  'Escalate to compliance officer when export destination is external',
  'Allow transfers under $10,000 automatically within guardrails',
  'Audit all deletion actions regardless of amount',
  'Block irreversible write-backs without dual approver sign-off',
];

function uid(): string {
  return Math.random().toString(36).slice(2, 11);
}

function parseAmount(text: string): number | null {
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

function parseApproverCount(text: string): number | null {
  const m = text.match(/\b(\d+|one|two|three|four|five)\s+approvers?\b/i);
  if (!m) return null;
  const map: Record<string, number> = { one: 1, two: 2, three: 3, four: 4, five: 5 };
  return map[m[1].toLowerCase()] ?? parseInt(m[1], 10);
}

function extractRoles(text: string): string[] {
  const matches =
    text.match(
      /\b(finance|compliance|legal|security|cfo|cto|ceo|manager|director|officer|admin|operator|approver|analyst)\b/gi,
    ) ?? [];
  return [...new Set(matches.map((r) => r.toLowerCase()))];
}

function compileNaturalLanguage(input: string): CompiledPolicy {
  const sentences = input
    .split(/[.\n]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 5);
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
        conditions.push({
          field: 'estimatedCostUsd',
          operator: 'gt',
          value: amount,
          label: `cost > $${amount.toLocaleString()}`,
        });
      } else if (isBelow) {
        conditions.push({
          field: 'estimatedCostUsd',
          operator: 'lte',
          value: amount,
          label: `cost ≤ $${amount.toLocaleString()}`,
        });
      } else {
        conditions.push({
          field: 'estimatedCostUsd',
          operator: 'gte',
          value: amount,
          label: `cost ≥ $${amount.toLocaleString()}`,
        });
        warnings.push(`Ambiguous threshold direction — defaulted to ≥ $${amount.toLocaleString()}`);
        confidence -= 0.1;
      }
    }

    const roles = extractRoles(s);
    const approverCount = parseApproverCount(s);

    const isBlock = /\b(block|deny|prohibit|forbidden|forbid|prevent|reject|disallow)\b/.test(
      lower,
    );
    const isEscalate = /\b(escalat[e]?|elevat[e]?|route to|notify)\b/.test(lower);
    const isAudit = /\b(audit|log only|record|observe)\b/.test(lower);
    const isApproval =
      /\b(require[s]?\s+(approval|sign-off|sign\s*off|review|approver)|need[s]?\s+(approval|sign-off)|without\s+(approval|sign-off))\b/.test(
        lower,
      );
    const isAllow = /\b(allow[s]?|permit[s]?|auto-approve|automatically)\b/.test(lower);

    if (isBlock && !isApproval) {
      effect = 'block';
      priority += 20;
    } else if (isEscalate && !isApproval) {
      effect = 'escalate';
      priority += 10;
      const toMatch = s.match(
        /(?:escalat[e]?\s+to|route\s+to|notify)\s+([a-z\s]+?)(?:\s+and|\.|,|$)/i,
      );
      escalateTo = toMatch ? toMatch[1].trim() : (roles[0] ?? 'compliance_officer');
    } else if (isApproval || approverCount !== null) {
      effect = 'require_approval';
      priority += 15;
      requiredApproverRole = roles.length > 0 ? roles[0] : 'approver';
      if (!roles.length) {
        warnings.push("No specific approver role identified — defaulted to 'approver'");
        confidence -= 0.05;
      }
      if (approverCount && approverCount > 1) {
        conditions.push({
          field: 'requiredApproverCount',
          operator: 'gte',
          value: approverCount,
          label: `≥ ${approverCount} approvers`,
        });
      }
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
      id: `rule_${uid()}`,
      name: s.length > 70 ? `${s.slice(0, 70)}…` : s,
      sourceText: s,
      effect,
      conditions,
      requiredApproverRole,
      escalateTo,
      reason: buildReason(s, effect, amount, roles, approverCount),
      confidence: Math.max(0.1, Math.min(1.0, confidence)),
      warnings,
      priority: Math.max(priority, 10),
    });
  }

  if (rules.length === 0) {
    globalWarnings.push('No parseable rules found. Try writing rules as complete sentences.');
  }

  const domains = (
    input.match(
      /\b(maritime|vessels?|terra|real.?estate|counsel|legal|compliance|finance|security|hr|it|infrastructure|operations)\b/gi,
    ) ?? []
  ).map((d) => d.toLowerCase());

  const overallConfidence = rules.length
    ? rules.reduce((s, r) => s + r.confidence, 0) / rules.length
    : 0;

  return {
    id: `pol_${uid()}`,
    name: inferName(input),
    scope: domains.length > 0 ? 'domain' : 'action',
    domain: domains[0],
    rules,
    overallConfidence,
    warnings: globalWarnings,
    compiledAt: Date.now(),
  };
}

function buildReason(
  s: string,
  _effect: PolicyEffect,
  amount: number | null,
  roles: string[],
  approverCount: number | null,
): string {
  const parts: string[] = [];
  if (amount !== null) parts.push(`$${amount.toLocaleString()} threshold`);
  if (roles.length) parts.push(`role: ${roles[0]}`);
  if (approverCount) parts.push(`${approverCount} approver(s)`);
  const ctx = parts.length ? ` (${parts.join('; ')})` : '';
  return `Compiled from: "${s.slice(0, 80)}"${ctx}`;
}

function inferName(input: string): string {
  const domains =
    input.match(
      /\b(maritime|vessels?|terra|real.?estate|counsel|legal|compliance|finance|security)\b/gi,
    ) ?? [];
  const actions =
    input.match(
      /\b(payout|payment|transfer|approval|transaction|export|deletion|deployment)\b/gi,
    ) ?? [];
  const parts: string[] = [];
  if (domains[0])
    parts.push(domains[0].charAt(0).toUpperCase() + domains[0].slice(1).toLowerCase());
  if (actions[0])
    parts.push(actions[0].charAt(0).toUpperCase() + actions[0].slice(1).toLowerCase());
  parts.push('Policy');
  return parts.join(' ');
}

function evaluateRule(rule: CompiledRule, ctx: Record<string, unknown>): boolean {
  if (rule.conditions.length === 0) return true;
  return rule.conditions.every((c) => {
    const val = ctx[c.field];
    if (val === undefined || val === null) return false;
    if (c.operator === 'gt') return typeof val === 'number' && val > (c.value as number);
    if (c.operator === 'gte') return typeof val === 'number' && val >= (c.value as number);
    if (c.operator === 'lt') return typeof val === 'number' && val < (c.value as number);
    if (c.operator === 'lte') return typeof val === 'number' && val <= (c.value as number);
    if (c.operator === 'eq') return val === c.value;
    if (c.operator === 'in') return Array.isArray(c.value) && (c.value as unknown[]).includes(val);
    if (c.operator === 'not_in')
      return Array.isArray(c.value) && !(c.value as unknown[]).includes(val);
    return false;
  });
}

const EFFECT_PRIORITY: Record<PolicyEffect, number> = {
  block: 100,
  escalate: 80,
  require_approval: 60,
  audit_only: 20,
  allow: 10,
};

function runPolicyAgainstContext(
  policy: CompiledPolicy,
  ctx: Record<string, unknown>,
): { effect: PolicyEffect; matchedRule?: string; reasoning: string } {
  if (policy.rules.length === 0)
    return { effect: 'allow', reasoning: 'No rules compiled — action allowed by default.' };

  let dominant: PolicyEffect = 'allow';
  let matchedRule: string | undefined;

  const sorted = [...policy.rules].sort((a, b) => b.priority - a.priority);
  const matched: string[] = [];

  for (const rule of sorted) {
    if (!evaluateRule(rule, ctx)) continue;
    matched.push(rule.name);
    if (EFFECT_PRIORITY[rule.effect] > EFFECT_PRIORITY[dominant]) {
      dominant = rule.effect;
      matchedRule = rule.name;
    }
  }

  const reasoning = matched.length
    ? `Matched ${matched.length} rule(s). Dominant effect: ${dominant}. Rule: "${matched[0]}"`
    : 'No rules matched — action allowed by default.';

  return { effect: dominant, matchedRule, reasoning };
}

function effectToOutcome(effect: PolicyEffect): OutcomeKey {
  if (effect === 'block') return 'blocked';
  if (effect === 'require_approval') return 'approval_required';
  if (effect === 'escalate') return 'escalated';
  if (effect === 'audit_only') return 'audited';
  return 'allowed';
}

function diffPolicies(
  prev: CompiledPolicy | null,
  next: CompiledPolicy,
): Array<{ type: 'added' | 'removed' | 'unchanged' | 'header'; text: string }> {
  const prevLines = prev ? policyToLines(prev) : [];
  const nextLines = policyToLines(next);
  const out: Array<{ type: 'added' | 'removed' | 'unchanged' | 'header'; text: string }> = [];
  out.push({ type: 'header', text: `@@ Policy: ${next.name} @@` });

  const maxLen = Math.max(prevLines.length, nextLines.length);
  for (let i = 0; i < maxLen; i++) {
    const p = prevLines[i];
    const n = nextLines[i];
    if (p === undefined) {
      out.push({ type: 'added', text: `+ ${n}` });
    } else if (n === undefined) {
      out.push({ type: 'removed', text: `- ${p}` });
    } else if (p === n) {
      out.push({ type: 'unchanged', text: `  ${n}` });
    } else {
      out.push({ type: 'removed', text: `- ${p}` });
      out.push({ type: 'added', text: `+ ${n}` });
    }
  }
  return out;
}

function policyToLines(p: CompiledPolicy): string[] {
  const lines = [
    `name: ${p.name}`,
    `scope: ${p.scope}`,
    `domain: ${p.domain ?? '(any)'}`,
    `rules: (${p.rules.length})`,
  ];
  for (const r of p.rules) {
    lines.push(`  rule: ${r.name.slice(0, 60)}`);
    lines.push(`    effect: ${r.effect}`);
    if (r.requiredApproverRole) lines.push(`    approverRole: ${r.requiredApproverRole}`);
    if (r.escalateTo) lines.push(`    escalateTo: ${r.escalateTo}`);
    for (const c of r.conditions)
      lines.push(`    cond: ${c.field} ${c.operator} ${JSON.stringify(c.value)}`);
  }
  return lines;
}

const INITIAL_INPUT = `No payout over $250,000 without two approvers and a finance sign-off.
Block all transactions exceeding $500,000 regardless of approvers.
Require compliance officer review for any export to an external party.
Allow transfers under $10,000 automatically within guardrails.
Audit all deletion actions.`;

const PREVIEW_ACTIONS: Omit<
  PreviewCase,
  'outcome' | 'matchedRule' | 'reasoning' | 'previousOutcome'
>[] = [
  {
    id: 'p1',
    actionType: 'payout',
    description: 'Payout $180,000 to vendor',
    context: { estimatedCostUsd: 180_000, action: 'payout', domain: 'finance' },
  },
  {
    id: 'p2',
    actionType: 'payout',
    description: 'Payout $320,000 for vessel charter',
    context: { estimatedCostUsd: 320_000, action: 'payout', domain: 'maritime' },
  },
  {
    id: 'p3',
    actionType: 'transfer',
    description: 'Internal fund transfer $7,500',
    context: { estimatedCostUsd: 7_500, action: 'transfer', domain: 'finance' },
  },
  {
    id: 'p4',
    actionType: 'export',
    description: 'Export compliance report externally',
    context: { estimatedCostUsd: 0, action: 'export', domain: 'compliance' },
  },
  {
    id: 'p5',
    actionType: 'deletion',
    description: 'Delete historical transaction batch',
    context: { estimatedCostUsd: 0, action: 'deletion', domain: 'finance' },
  },
  {
    id: 'p6',
    actionType: 'payout',
    description: 'Payout $600,000 for infrastructure',
    context: { estimatedCostUsd: 600_000, action: 'payout', domain: 'infrastructure' },
  },
  {
    id: 'p7',
    actionType: 'transfer',
    description: 'Payroll transfer $45,000',
    context: { estimatedCostUsd: 45_000, action: 'transfer', domain: 'hr' },
  },
];

function EffectBadge({ effect }: { effect: PolicyEffect }) {
  const cfg = EFFECT_CFG[effect];
  return (
    <span
      className="inline-flex items-center gap-1 text-[9px] font-mono font-semibold tracking-wider px-1.5 py-0.5 rounded uppercase"
      style={{ color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}` }}
    >
      <cfg.Icon className="w-2.5 h-2.5" />
      {cfg.label}
    </span>
  );
}

function OutcomeBadge({ outcome }: { outcome: OutcomeKey }) {
  const cfg = OUTCOME_CFG[outcome];
  return (
    <span
      className="inline-flex items-center gap-1 text-[9px] font-mono font-semibold tracking-wider px-1.5 py-0.5 rounded uppercase"
      style={{ color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.color}30` }}
    >
      <cfg.Icon className="w-2.5 h-2.5" />
      {cfg.label}
    </span>
  );
}

function ConfidenceMeter({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const color = value >= 0.8 ? '#22c55e' : value >= 0.6 ? ACCENT : '#ef4444';
  return (
    <div className="flex items-center gap-2">
      <div
        className="flex-1 h-1.5 rounded-full overflow-hidden"
        style={{ background: 'rgba(255,255,255,0.07)' }}
      >
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <span className="text-[10px] font-mono" style={{ color }}>
        {pct}%
      </span>
    </div>
  );
}

function DiffLine({
  type,
  text,
}: {
  type: 'added' | 'removed' | 'unchanged' | 'header';
  text: string;
}) {
  const colors = {
    added: { bg: 'rgba(34,197,94,0.06)', color: '#86efac', border: 'rgba(34,197,94,0.15)' },
    removed: { bg: 'rgba(239,68,68,0.06)', color: '#fca5a5', border: 'rgba(239,68,68,0.15)' },
    unchanged: { bg: 'transparent', color: 'rgba(255,255,255,0.4)', border: 'transparent' },
    header: { bg: 'rgba(139,122,200,0.06)', color: '#a78bfa', border: 'rgba(139,122,200,0.2)' },
  };
  const c = colors[type];
  return (
    <div
      className="px-3 py-0.5 font-mono text-[10px] rounded-sm"
      style={{ background: c.bg, color: c.color }}
    >
      {text}
    </div>
  );
}

export default function AlloyPolicyCompilerPage() {
  const [activeTab, setActiveTab] = useState<Tab>('author');
  const [input, setInput] = useState(INITIAL_INPUT);
  const [compiled, setCompiled] = useState<CompiledPolicy | null>(null);
  const [compiling, setCompiling] = useState(false);
  const [versions, setVersions] = useState<PolicyVersion[]>([]);
  const [saveMessage, setSaveMessage] = useState('');
  const [savingVersion, setSavingVersion] = useState(false);
  const [expandedRule, setExpandedRule] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [testRunning, setTestRunning] = useState(false);
  const [newTestName, setNewTestName] = useState('');
  const [newTestExpected, setNewTestExpected] = useState<TestCase['expectedOutcome']>('allowed');
  const [newTestAmount, setNewTestAmount] = useState('');
  const [newTestAction, setNewTestAction] = useState('');
  const [showAddTest, setShowAddTest] = useState(false);
  const [previewCases, setPreviewCases] = useState<PreviewCase[]>(PREVIEW_ACTIONS as PreviewCase[]);
  const [previewRan, setPreviewRan] = useState(false);
  const [auditLog, setAuditLog] = useState<Array<{ event: string; at: number; actor: string }>>([
    { event: 'Policy Authoring Studio opened', at: Date.now() - 120_000, actor: 'Sarah Mitchell' },
  ]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const latestVersion = versions[versions.length - 1] ?? null;
  const prevPolicy = latestVersion?.policy ?? null;

  const diff = useMemo(() => {
    if (!compiled) return [];
    return diffPolicies(prevPolicy, compiled);
  }, [compiled, prevPolicy]);

  function addAudit(event: string) {
    setAuditLog((prev) => [...prev, { event, at: Date.now(), actor: 'Sarah Mitchell' }]);
  }

  const handleCompile = useCallback(() => {
    if (!input.trim()) return;
    setCompiling(true);
    setTimeout(() => {
      const result = compileNaturalLanguage(input);
      setCompiled(result);
      setCompiling(false);
      addAudit('Policy compiled from natural language input');
    }, 600);
  }, [input]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (input.trim().length > 10) handleCompile();
    }, 1200);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [input, handleCompile]);

  // Load persisted versions and test cases on mount.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiFetch<
          ApiEnvelope<PolicyCompilerStateResponse> | PolicyCompilerStateResponse
        >(`/alloy/policy-compiler/state?studioId=${encodeURIComponent(STUDIO_ID)}`);
        const payload =
          (res as ApiEnvelope<PolicyCompilerStateResponse>).data ??
          (res as PolicyCompilerStateResponse);
        if (cancelled || !payload) return;
        const loadedVersions = (payload.versions ?? []).map(fromServerVersion);
        const loadedTestCases = (payload.testCases ?? []).map(fromServerTestCase);
        setVersions(loadedVersions);
        setTestCases(loadedTestCases);
        if (loadedVersions.length > 0) {
          const latest = loadedVersions[loadedVersions.length - 1]!;
          setInput(latest.input);
          setCompiled(latest.policy);
        }
      } catch (_err) {
        if (!cancelled) {
        }
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSaveVersion() {
    if (!compiled) return;
    setSavingVersion(true);
    (async () => {
      try {
        const res = await apiFetch<ApiEnvelope<ServerPolicyVersion> | ServerPolicyVersion>(
          `/alloy/policy-compiler/versions`,
          {
            method: 'POST',
            body: JSON.stringify({
              studioId: STUDIO_ID,
              input,
              policy: compiled,
              author: 'Sarah Mitchell',
              authorId: 'usr_compliance_sarah',
              message: saveMessage || 'Policy update',
              signers: [],
            }),
          },
        );
        const payload =
          (res as ApiEnvelope<ServerPolicyVersion>).data ?? (res as ServerPolicyVersion);
        const newVersion = fromServerVersion(payload);
        setVersions((prev) => [...prev, newVersion]);
        setSaveMessage('');
        addAudit(`Policy version ${newVersion.versionNumber} saved by Sarah Mitchell`);
      } catch (err) {
        addAudit(
          `Failed to save policy version: ${err instanceof Error ? err.message : 'unknown error'}`,
        );
      } finally {
        setSavingVersion(false);
      }
    })();
  }

  function applyLLMResponseToRule(
    rule: CompiledRule,
    llm: LLMAssistResponseRule,
    note?: string,
  ): CompiledRule {
    const snapshot = rule.deterministicSnapshot ?? {
      effect: rule.effect,
      conditions: rule.conditions,
      requiredApproverRole: rule.requiredApproverRole,
      escalateTo: rule.escalateTo,
      reason: rule.reason,
      confidence: rule.confidence,
      warnings: rule.warnings,
    };
    const llmConf =
      typeof llm.confidence === 'number' && Number.isFinite(llm.confidence)
        ? Math.max(0, Math.min(1, llm.confidence))
        : undefined;
    const newConditions: ParsedCondition[] =
      llm.conditions && llm.conditions.length > 0
        ? llm.conditions.map((c) => ({
            field: c.field,
            operator: c.operator,
            value: c.value,
            label: `${c.field} ${c.operator} ${typeof c.value === 'object' ? JSON.stringify(c.value) : String(c.value)}`,
          }))
        : rule.conditions;
    return {
      ...rule,
      effect: llm.effect ?? rule.effect,
      conditions: newConditions,
      requiredApproverRole: llm.requiredApproverRole ?? rule.requiredApproverRole,
      escalateTo: llm.escalateTo ?? rule.escalateTo,
      reason: llm.reason ?? rule.reason,
      confidence: Math.max(rule.confidence, llmConf ?? 0),
      llmAssisted: true,
      llmConfidence: llmConf,
      llmStatus: 'applied',
      llmError: undefined,
      llmNote: note ?? llm.notes,
      deterministicSnapshot: snapshot,
    };
  }

  function revertLLMOnRule(rule: CompiledRule): CompiledRule {
    const snap = rule.deterministicSnapshot;
    if (!snap) return { ...rule, llmAssisted: false, llmStatus: 'idle' };
    return {
      ...rule,
      effect: snap.effect,
      conditions: snap.conditions,
      requiredApproverRole: snap.requiredApproverRole,
      escalateTo: snap.escalateTo,
      reason: snap.reason,
      confidence: snap.confidence,
      warnings: snap.warnings,
      llmAssisted: false,
      llmConfidence: undefined,
      llmStatus: 'idle',
      llmError: undefined,
      llmNote: undefined,
      deterministicSnapshot: undefined,
    };
  }

  function recomputeOverallConfidence(rules: CompiledRule[]): number {
    if (rules.length === 0) return 0;
    return rules.reduce((s, r) => s + r.confidence, 0) / rules.length;
  }

  async function resolveSingleRuleViaLLM(ruleSnapshot: CompiledRule): Promise<void> {
    const ruleId = ruleSnapshot.id;
    // Mark loading via functional update so concurrent rule updates aren't clobbered.
    setCompiled(
      (prev) =>
        prev && {
          ...prev,
          rules: prev.rules.map((r) =>
            r.id === ruleId ? { ...r, llmStatus: 'loading', llmError: undefined } : r,
          ),
        },
    );
    try {
      const res = await fetch(`${API_BASE}/api/alloy/policies/llm-assist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sentence: ruleSnapshot.sourceText,
          deterministic: {
            effect: ruleSnapshot.effect,
            confidence: ruleSnapshot.confidence,
            conditions: ruleSnapshot.conditions.map((c) => ({
              field: c.field,
              operator: c.operator,
              value: c.value,
            })),
            requiredApproverRole: ruleSnapshot.requiredApproverRole,
            escalateTo: ruleSnapshot.escalateTo,
            warnings: ruleSnapshot.warnings,
          },
        }),
      });
      const body = (await res.json()) as LLMAssistResponse & { error?: string };
      if (!res.ok) {
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      if (!body.result) {
        const reason = body.fallbackReason ?? 'AI assistant returned no usable result.';
        setCompiled(
          (prev) =>
            prev && {
              ...prev,
              rules: prev.rules.map((r) =>
                r.id === ruleId ? { ...r, llmStatus: 'error', llmError: reason } : r,
              ),
            },
        );
        addAudit(
          `AI policy assist unavailable for rule "${ruleSnapshot.name.slice(0, 40)}…" — ${reason.slice(0, 80)}`,
        );
        return;
      }
      const llmResult = body.result;
      setCompiled((prev) => {
        if (!prev) return prev;
        const updated = prev.rules.map((r) =>
          r.id === ruleId ? applyLLMResponseToRule(r, llmResult, llmResult.notes) : r,
        );
        return { ...prev, rules: updated, overallConfidence: recomputeOverallConfidence(updated) };
      });
      addAudit(
        `AI assistant resolved ambiguous rule "${ruleSnapshot.name.slice(0, 40)}…" via ${body.modelUsed}`,
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setCompiled(
        (prev) =>
          prev && {
            ...prev,
            rules: prev.rules.map((r) =>
              r.id === ruleId ? { ...r, llmStatus: 'error', llmError: msg } : r,
            ),
          },
      );
      addAudit(
        `AI policy assist failed for rule "${ruleSnapshot.name.slice(0, 40)}…": ${msg.slice(0, 80)}`,
      );
    }
  }

  function handleResolveWithAI(ruleId: string) {
    if (!compiled) return;
    const rule = compiled.rules.find((r) => r.id === ruleId);
    if (!rule) return;
    void resolveSingleRuleViaLLM(rule);
  }

  function handleRevertAI(ruleId: string) {
    if (!compiled) return;
    setCompiled((prev) => {
      if (!prev) return prev;
      const updated = prev.rules.map((r) => (r.id === ruleId ? revertLLMOnRule(r) : r));
      return { ...prev, rules: updated, overallConfidence: recomputeOverallConfidence(updated) };
    });
    addAudit('Operator reverted AI-assisted rule back to deterministic parse');
  }

  async function handleResolveAllWithAI() {
    if (!compiled) return;
    // Snapshot the ambiguous rule IDs once; resolve in parallel using
    // functional state updates so each completion merges safely without
    // clobbering siblings.
    const ambiguousIds = compiled.rules
      .filter((r) => r.confidence < LLM_THRESHOLD && !r.llmAssisted)
      .map((r) => r.id);
    const ruleSnapshots = ambiguousIds
      .map((id) => compiled.rules.find((r) => r.id === id))
      .filter((r): r is CompiledRule => Boolean(r));
    await Promise.all(ruleSnapshots.map((r) => resolveSingleRuleViaLLM(r)));
  }

  function handleRollback(version: PolicyVersion) {
    setInput(version.input);
    const result = compileNaturalLanguage(version.input);
    setCompiled(result);
    addAudit(`Rolled back to version ${version.versionNumber} (${version.author})`);
  }

  function handleSignVersion(versionId: string) {
    (async () => {
      try {
        const res = await apiFetch<ApiEnvelope<ServerPolicyVersion> | ServerPolicyVersion>(
          `/alloy/policy-compiler/versions/${encodeURIComponent(versionId)}/sign`,
          {
            method: 'POST',
            body: JSON.stringify({ name: 'Sarah Mitchell', role: 'compliance_officer' }),
          },
        );
        const payload =
          (res as ApiEnvelope<ServerPolicyVersion>).data ?? (res as ServerPolicyVersion);
        const updated = fromServerVersion(payload);
        setVersions((prev) => prev.map((v) => (v.id === versionId ? updated : v)));
        addAudit('Policy version signed by Sarah Mitchell (compliance_officer)');
      } catch (err) {
        addAudit(
          `Failed to sign policy version: ${err instanceof Error ? err.message : 'unknown error'}`,
        );
      }
    })();
  }

  function handleActivateVersion(versionId: string) {
    (async () => {
      const version = versions.find((v) => v.id === versionId);
      if (!version) return;
      if (version.signers.length < 1) {
        addAudit('Activation blocked — policy must be signed by at least one approver first');
        return;
      }
      try {
        const res = await apiFetch<ApiEnvelope<ServerPolicyVersion> | ServerPolicyVersion>(
          `/alloy/policy-compiler/versions/${encodeURIComponent(versionId)}/activate`,
          { method: 'POST' },
        );
        const payload =
          (res as ApiEnvelope<ServerPolicyVersion>).data ?? (res as ServerPolicyVersion);
        const updated = fromServerVersion(payload);
        setVersions((prev) =>
          prev.map((v) => {
            if (v.id === versionId) return updated;
            return { ...v, isActive: false };
          }),
        );
        addAudit(
          `Policy v${version.versionNumber} activated — all other versions deactivated`,
        );
      } catch (err) {
        addAudit(
          `Failed to activate policy version: ${err instanceof Error ? err.message : 'unknown error'}`,
        );
      }
    })();
  }

  function handleDeactivateVersion(versionId: string) {
    (async () => {
      const version = versions.find((v) => v.id === versionId);
      if (!version) return;
      try {
        const res = await apiFetch<ApiEnvelope<ServerPolicyVersion> | ServerPolicyVersion>(
          `/alloy/policy-compiler/versions/${encodeURIComponent(versionId)}/deactivate`,
          { method: 'POST' },
        );
        const payload =
          (res as ApiEnvelope<ServerPolicyVersion>).data ?? (res as ServerPolicyVersion);
        const updated = fromServerVersion(payload);
        setVersions((prev) => prev.map((v) => (v.id === versionId ? updated : v)));
        addAudit(`Policy v${version.versionNumber} deactivated`);
      } catch (err) {
        addAudit(
          `Failed to deactivate policy version: ${err instanceof Error ? err.message : 'unknown error'}`,
        );
      }
    })();
  }

  function runPreview() {
    if (!compiled) return;
    const results = PREVIEW_ACTIONS.map((a) => {
      const { effect, matchedRule, reasoning } = runPolicyAgainstContext(compiled, a.context);
      return { ...a, outcome: effectToOutcome(effect), matchedRule, reasoning };
    });
    setPreviewCases(results);
    setPreviewRan(true);
    addAudit('Preview run against 7 historical actions');
  }

  function runTests() {
    if (!compiled) return;
    setTestRunning(true);
    setTimeout(() => {
      const results = testCases.map((tc) => {
        const { effect, reasoning } = runPolicyAgainstContext(compiled, tc.context);
        const actual = effectToOutcome(effect);
        const actualOutcome =
          actual === 'audited' ? 'allowed' : (actual as TestCase['expectedOutcome']);
        return {
          ...tc,
          actualOutcome,
          passed: actualOutcome === tc.expectedOutcome,
          reasoning,
          ran: true,
        };
      });
      setTestCases(results);
      setTestRunning(false);
      addAudit(
        `Test harness run: ${results.filter((r) => r.passed).length}/${results.length} passed`,
      );
    }, 800);
  }

  function addTestCase() {
    if (!newTestName.trim()) return;
    const payload = {
      studioId: STUDIO_ID,
      name: newTestName,
      context: {
        action: newTestAction || 'payout',
        estimatedCostUsd: parseFloat(newTestAmount) || 0,
      },
      expectedOutcome: newTestExpected,
    };
    setNewTestName('');
    setNewTestAmount('');
    setNewTestAction('');
    setShowAddTest(false);
    (async () => {
      try {
        const res = await apiFetch<ApiEnvelope<ServerTestCase> | ServerTestCase>(
          `/alloy/policy-compiler/test-cases`,
          { method: 'POST', body: JSON.stringify(payload) },
        );
        const body = (res as ApiEnvelope<ServerTestCase>).data ?? (res as ServerTestCase);
        const tc = fromServerTestCase(body);
        setTestCases((prev) => [...prev, tc]);
      } catch (err) {
        addAudit(
          `Failed to add test case: ${err instanceof Error ? err.message : 'unknown error'}`,
        );
      }
    })();
  }

  function removeTestCase(id: string) {
    const prevList = testCases;
    setTestCases((prev) => prev.filter((t) => t.id !== id));
    (async () => {
      try {
        await apiFetch<unknown>(
          `/alloy/policy-compiler/test-cases/${encodeURIComponent(id)}?studioId=${encodeURIComponent(STUDIO_ID)}`,
          { method: 'DELETE' },
        );
      } catch (err) {
        setTestCases(prevList);
        addAudit(
          `Failed to remove test case: ${err instanceof Error ? err.message : 'unknown error'}`,
        );
      }
    })();
  }

  const passedTests = testCases.filter((t) => t.ran && t.passed).length;
  const failedTests = testCases.filter((t) => t.ran && !t.passed).length;
  const totalRan = testCases.filter((t) => t.ran).length;

  const tabs: { key: Tab; label: string; Icon: React.ElementType }[] = [
    { key: 'author', label: 'Author', Icon: Code2 },
    { key: 'preview', label: 'Preview', Icon: Eye },
    { key: 'tests', label: 'Test Harness', Icon: FlaskConical },
    { key: 'history', label: 'Version History', Icon: History },
  ];

  return (
    <div className="min-h-screen" style={{ background: BG.page, color: TEXT.primary }}>
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        <div className="flex items-start justify-between flex-wrap gap-3 mb-5">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded flex items-center justify-center"
              style={{ background: `${ACCENT}12`, border: `1px solid ${ACCENT}30` }}
            >
              <Sparkles className="w-4.5 h-4.5" style={{ color: ACCENT }} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-[15px] font-bold tracking-wide" style={{ color: TEXT.primary }}>
                  Policy Authoring Studio
                </h1>
                <span
                  className="text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded uppercase tracking-wider"
                  style={{
                    color: ACCENT,
                    background: `${ACCENT}12`,
                    border: `1px solid ${ACCENT}30`,
                  }}
                >
                  Counsel Compiler v1.0
                </span>
              </div>
              <div className="text-[10px] font-mono mt-0.5" style={{ color: TEXT.secondary }}>
                Write rules in plain English → versioned, machine-enforceable governance
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {compiled && (
              <div
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-[10px] font-mono"
                style={{
                  background: 'rgba(34,197,94,0.06)',
                  border: '1px solid rgba(34,197,94,0.2)',
                  color: '#22c55e',
                }}
              >
                <CheckCircle className="w-3 h-3" />
                Compiled · {compiled.rules.length} rule{compiled.rules.length !== 1 ? 's' : ''}
              </div>
            )}
            <button
              onClick={handleCompile}
              disabled={compiling || !input.trim()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-[10px] font-semibold transition-opacity disabled:opacity-50"
              style={{ color: ACCENT, background: `${ACCENT}12`, border: `1px solid ${ACCENT}35` }}
            >
              <Zap className={`w-3 h-3 ${compiling ? 'animate-pulse' : ''}`} />
              {compiling ? 'Compiling…' : 'Compile'}
            </button>
          </div>
        </div>

        <div className="flex border-b mb-5" style={{ borderColor: BORDER.subtle }}>
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className="flex items-center gap-1.5 px-4 py-2.5 text-[11px] font-semibold transition-colors relative"
              style={{ color: activeTab === t.key ? ACCENT : TEXT.secondary }}
            >
              <t.Icon className="w-3.5 h-3.5" />
              {t.label}
              {t.key === 'tests' && totalRan > 0 && (
                <span
                  className="text-[9px] font-mono px-1 py-px rounded"
                  style={{
                    color: failedTests > 0 ? '#ef4444' : '#22c55e',
                    background: failedTests > 0 ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)',
                  }}
                >
                  {passedTests}/{totalRan}
                </span>
              )}
              {activeTab === t.key && (
                <div
                  className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t"
                  style={{ background: ACCENT }}
                />
              )}
            </button>
          ))}
        </div>

        {activeTab === 'author' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="flex flex-col gap-3">
              <div
                className="rounded border p-3"
                style={{ background: BG.surface, borderColor: BORDER.muted }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div
                    className="flex items-center gap-1.5 text-[10px] font-mono font-semibold"
                    style={{ color: TEXT.secondary }}
                  >
                    <FileCode className="w-3.5 h-3.5" />
                    NATURAL LANGUAGE INPUT
                  </div>
                  <button
                    onClick={() => setShowSuggestions((s) => !s)}
                    className="flex items-center gap-1 text-[9px] font-mono px-2 py-0.5 rounded hover:bg-white/5"
                    style={{ color: TEXT.tertiary, border: `1px solid ${BORDER.muted}` }}
                  >
                    <Sparkles className="w-2.5 h-2.5" /> Patterns
                  </button>
                </div>

                {showSuggestions && (
                  <div
                    className="rounded p-2.5 mb-2 flex flex-col gap-1.5"
                    style={{ background: `${ACCENT}07`, border: `1px solid ${ACCENT}20` }}
                  >
                    <div
                      className="text-[9px] font-mono uppercase tracking-wider mb-1"
                      style={{ color: ACCENT }}
                    >
                      Pattern Library
                    </div>
                    {PATTERN_SUGGESTIONS.map((p, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setInput((prev) => `${prev + (prev.endsWith('\n') ? '' : '\n') + p}.`);
                          setShowSuggestions(false);
                        }}
                        className="text-left text-[10px] px-2 py-1.5 rounded hover:bg-white/5 transition-colors"
                        style={{ color: TEXT.secondary, border: `1px solid ${BORDER.subtle}` }}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                )}

                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  rows={12}
                  placeholder="Write your governance rules in plain English. Each sentence becomes a rule. Example: No payout over $250,000 without two approvers and a finance sign-off."
                  className="w-full rounded px-3 py-2.5 text-[12px] font-mono resize-none outline-none leading-relaxed"
                  style={{
                    background: 'rgba(0,0,0,0.3)',
                    border: `1px solid ${BORDER.muted}`,
                    color: TEXT.primary,
                    caretColor: ACCENT,
                  }}
                />
                <div className="flex items-center justify-between mt-2">
                  <div className="text-[9px] font-mono" style={{ color: TEXT.tertiary }}>
                    {input.split(/[.\n]+/).filter((s) => s.trim().length > 5).length} rule sentence
                    {input.split(/[.\n]+/).filter((s) => s.trim().length > 5).length !== 1
                      ? 's'
                      : ''}{' '}
                    · auto-compiles after pause
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      value={saveMessage}
                      onChange={(e) => setSaveMessage(e.target.value)}
                      placeholder="Version message…"
                      className="text-[10px] px-2 py-1 rounded outline-none w-40"
                      style={{
                        background: 'rgba(0,0,0,0.3)',
                        border: `1px solid ${BORDER.muted}`,
                        color: TEXT.primary,
                      }}
                    />
                    <button
                      onClick={handleSaveVersion}
                      disabled={!compiled || savingVersion}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-semibold transition-opacity disabled:opacity-40"
                      style={{
                        color: '#22c55e',
                        background: 'rgba(34,197,94,0.08)',
                        border: '1px solid rgba(34,197,94,0.3)',
                      }}
                    >
                      <Save className="w-3 h-3" />
                      {savingVersion ? 'Saving…' : 'Save Version'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              {!compiled ? (
                <div
                  className="rounded border p-6 flex flex-col items-center justify-center gap-3 min-h-48"
                  style={{ background: BG.surface, borderColor: BORDER.subtle }}
                >
                  <Code2 className="w-8 h-8" style={{ color: TEXT.muted }} />
                  <div
                    className="text-[11px] font-mono text-center"
                    style={{ color: TEXT.tertiary }}
                  >
                    Start typing to auto-compile
                    <br />
                    or click Compile
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <div
                    className="rounded border p-3"
                    style={{ background: BG.surface, borderColor: BORDER.muted }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div
                        className="flex items-center gap-1.5 text-[10px] font-mono font-semibold"
                        style={{ color: TEXT.secondary }}
                      >
                        <Shield className="w-3.5 h-3.5" />
                        COMPILED POLICY
                      </div>
                      <div className="flex items-center gap-2">
                        {compiled.rules.some(
                          (r) => r.confidence < LLM_THRESHOLD && !r.llmAssisted,
                        ) && (
                          <button
                            onClick={handleResolveAllWithAI}
                            className="flex items-center gap-1 px-2 py-1 rounded text-[9px] font-semibold"
                            style={{
                              color: '#a78bfa',
                              background: 'rgba(139,122,200,0.1)',
                              border: '1px solid rgba(139,122,200,0.3)',
                            }}
                          >
                            <Wand2 className="w-2.5 h-2.5" /> Resolve{' '}
                            {
                              compiled.rules.filter(
                                (r) => r.confidence < LLM_THRESHOLD && !r.llmAssisted,
                              ).length
                            }{' '}
                            ambiguous with AI
                          </button>
                        )}
                        <div className="text-[9px] font-mono" style={{ color: TEXT.tertiary }}>
                          Confidence
                        </div>
                        <div className="w-24">
                          <ConfidenceMeter value={compiled.overallConfidence} />
                        </div>
                      </div>
                    </div>

                    <div className="text-[13px] font-semibold mb-1" style={{ color: TEXT.primary }}>
                      {compiled.name}
                    </div>
                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                      <span
                        className="text-[9px] font-mono px-1.5 py-0.5 rounded"
                        style={{
                          color: '#8b7ac8',
                          background: 'rgba(139,122,200,0.1)',
                          border: '1px solid rgba(139,122,200,0.25)',
                        }}
                      >
                        scope: {compiled.scope}
                      </span>
                      {compiled.domain && (
                        <span
                          className="text-[9px] font-mono px-1.5 py-0.5 rounded"
                          style={{
                            color: '#38bdf8',
                            background: 'rgba(56,189,248,0.08)',
                            border: '1px solid rgba(56,189,248,0.2)',
                          }}
                        >
                          domain: {compiled.domain}
                        </span>
                      )}
                      <span className="text-[9px] font-mono" style={{ color: TEXT.tertiary }}>
                        compiled {new Date(compiled.compiledAt).toLocaleTimeString()}
                      </span>
                    </div>

                    {compiled.warnings.length > 0 && (
                      <div
                        className="rounded p-2 mb-3 flex flex-col gap-1"
                        style={{
                          background: 'rgba(212,160,84,0.06)',
                          border: `1px solid ${ACCENT}25`,
                        }}
                      >
                        {compiled.warnings.map((w, i) => (
                          <div
                            key={i}
                            className="flex items-start gap-1.5 text-[10px]"
                            style={{ color: ACCENT }}
                          >
                            <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" />
                            {w}
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex flex-col gap-2">
                      {compiled.rules.map((rule) => (
                        <div
                          key={rule.id}
                          className="rounded border"
                          style={{
                            borderColor: BORDER.subtle,
                            background: 'rgba(255,255,255,0.015)',
                          }}
                        >
                          <button
                            onClick={() =>
                              setExpandedRule(expandedRule === rule.id ? null : rule.id)
                            }
                            className="w-full flex items-center gap-2.5 px-2.5 py-2 text-left hover:bg-white/[0.02]"
                          >
                            <span style={{ color: TEXT.muted }}>
                              {expandedRule === rule.id ? (
                                <ChevronDown className="w-3 h-3" />
                              ) : (
                                <ChevronRight className="w-3 h-3" />
                              )}
                            </span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span
                                  className="text-[11px] font-medium truncate"
                                  style={{ color: TEXT.primary }}
                                >
                                  {rule.name}
                                </span>
                                <EffectBadge effect={rule.effect} />
                                {rule.llmAssisted && (
                                  <span
                                    className="inline-flex items-center gap-1 text-[9px] font-mono font-semibold tracking-wider px-1.5 py-0.5 rounded uppercase"
                                    style={{
                                      color: '#a78bfa',
                                      background: 'rgba(139,122,200,0.1)',
                                      border: '1px solid rgba(139,122,200,0.3)',
                                    }}
                                  >
                                    <Wand2 className="w-2.5 h-2.5" />
                                    AI Assisted
                                  </span>
                                )}
                                {!rule.llmAssisted && rule.confidence < LLM_THRESHOLD && (
                                  <span
                                    className="inline-flex items-center gap-1 text-[9px] font-mono font-semibold tracking-wider px-1.5 py-0.5 rounded uppercase"
                                    style={{
                                      color: ACCENT,
                                      background: `${ACCENT}10`,
                                      border: `1px solid ${ACCENT}30`,
                                    }}
                                  >
                                    <AlertTriangle className="w-2.5 h-2.5" />
                                    Ambiguous
                                  </span>
                                )}
                              </div>
                            </div>
                            <ConfidenceMeter value={rule.confidence} />
                          </button>
                          {expandedRule === rule.id && (
                            <div
                              className="px-3 pb-2.5 pt-1.5"
                              style={{ borderTop: `1px solid ${BORDER.subtle}` }}
                            >
                              {rule.conditions.length > 0 && (
                                <div className="mb-2">
                                  <div
                                    className="text-[9px] font-mono uppercase tracking-wider mb-1"
                                    style={{ color: TEXT.tertiary }}
                                  >
                                    Conditions
                                  </div>
                                  <div className="flex flex-wrap gap-1">
                                    {rule.conditions.map((c, i) => (
                                      <span
                                        key={i}
                                        className="text-[9px] font-mono px-1.5 py-0.5 rounded"
                                        style={{
                                          color: TEXT.secondary,
                                          background: 'rgba(255,255,255,0.04)',
                                          border: `1px solid ${BORDER.muted}`,
                                        }}
                                      >
                                        {c.label}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {rule.requiredApproverRole && (
                                <div
                                  className="text-[10px] font-mono mb-1"
                                  style={{ color: TEXT.secondary }}
                                >
                                  Approver Role:{' '}
                                  <span style={{ color: ACCENT }}>{rule.requiredApproverRole}</span>
                                </div>
                              )}
                              {rule.escalateTo && (
                                <div
                                  className="text-[10px] font-mono mb-1"
                                  style={{ color: TEXT.secondary }}
                                >
                                  Escalate to:{' '}
                                  <span style={{ color: '#ec4899' }}>{rule.escalateTo}</span>
                                </div>
                              )}
                              <div
                                className="text-[9px] font-mono mb-1.5"
                                style={{ color: TEXT.tertiary }}
                              >
                                {rule.reason}
                              </div>
                              {rule.warnings.length > 0 &&
                                rule.warnings.map((w, i) => (
                                  <div
                                    key={i}
                                    className="flex items-start gap-1 text-[9px]"
                                    style={{ color: ACCENT }}
                                  >
                                    <Info className="w-2.5 h-2.5 mt-0.5 shrink-0" /> {w}
                                  </div>
                                ))}
                              {(rule.confidence < LLM_THRESHOLD || rule.llmAssisted) && (
                                <div
                                  className="mt-2 rounded p-2"
                                  style={{
                                    background: 'rgba(139,122,200,0.06)',
                                    border: '1px solid rgba(139,122,200,0.22)',
                                  }}
                                >
                                  <div className="flex items-center justify-between gap-2 mb-1.5">
                                    <div
                                      className="flex items-center gap-1.5 text-[9px] font-mono uppercase tracking-wider"
                                      style={{ color: '#a78bfa' }}
                                    >
                                      <Wand2 className="w-2.5 h-2.5" />
                                      AI Ambiguity Resolver
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                      {rule.llmAssisted ? (
                                        <button
                                          onClick={() => handleRevertAI(rule.id)}
                                          className="flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-semibold"
                                          style={{
                                            color: TEXT.secondary,
                                            background: 'rgba(255,255,255,0.04)',
                                            border: `1px solid ${BORDER.muted}`,
                                          }}
                                        >
                                          <Undo2 className="w-2.5 h-2.5" /> Revert
                                        </button>
                                      ) : (
                                        <button
                                          onClick={() => handleResolveWithAI(rule.id)}
                                          disabled={rule.llmStatus === 'loading'}
                                          className="flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-semibold disabled:opacity-40"
                                          style={{
                                            color: '#a78bfa',
                                            background: 'rgba(139,122,200,0.1)',
                                            border: '1px solid rgba(139,122,200,0.3)',
                                          }}
                                        >
                                          <Sparkles className="w-2.5 h-2.5" />
                                          {rule.llmStatus === 'loading'
                                            ? 'Resolving…'
                                            : 'Resolve with AI'}
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                  {rule.llmAssisted && (
                                    <div className="flex flex-col gap-1">
                                      <div
                                        className="flex items-center gap-3 text-[9px] font-mono"
                                        style={{ color: TEXT.tertiary }}
                                      >
                                        <span>
                                          Deterministic:{' '}
                                          <span style={{ color: TEXT.secondary }}>
                                            {(
                                              (rule.deterministicSnapshot?.confidence ?? 0) * 100
                                            ).toFixed(0)}
                                            %
                                          </span>
                                        </span>
                                        {typeof rule.llmConfidence === 'number' && (
                                          <span>
                                            LLM:{' '}
                                            <span style={{ color: '#a78bfa' }}>
                                              {(rule.llmConfidence * 100).toFixed(0)}%
                                            </span>
                                          </span>
                                        )}
                                        <span>
                                          Merged:{' '}
                                          <span style={{ color: ACCENT }}>
                                            {(rule.confidence * 100).toFixed(0)}%
                                          </span>
                                        </span>
                                      </div>
                                      {rule.llmNote && (
                                        <div
                                          className="text-[9px] font-mono italic"
                                          style={{ color: TEXT.tertiary }}
                                        >
                                          AI note: {rule.llmNote}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                  {rule.llmStatus === 'error' && rule.llmError && (
                                    <div
                                      className="text-[9px] font-mono"
                                      style={{ color: '#ef4444' }}
                                    >
                                      {rule.llmError}
                                    </div>
                                  )}
                                  {!rule.llmAssisted && rule.llmStatus !== 'error' && (
                                    <div
                                      className="text-[9px] font-mono"
                                      style={{ color: TEXT.tertiary }}
                                    >
                                      Confidence below {(LLM_THRESHOLD * 100).toFixed(0)}%. Use AI
                                      to suggest a structured rule; you can confirm or revert.
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {diff.length > 1 && (
                    <div
                      className="rounded border p-3"
                      style={{ background: BG.surface, borderColor: BORDER.muted }}
                    >
                      <div
                        className="flex items-center gap-1.5 text-[10px] font-mono font-semibold mb-2.5"
                        style={{ color: TEXT.secondary }}
                      >
                        <GitBranch className="w-3.5 h-3.5" />
                        DIFF vs PREVIOUS VERSION
                      </div>
                      <div
                        className="flex flex-col gap-0.5 max-h-52 overflow-y-auto scrollbar-thin rounded font-mono"
                        style={{ background: 'rgba(0,0,0,0.3)', padding: '8px 4px' }}
                      >
                        {diff.map((d, i) => (
                          <DiffLine key={i} type={d.type} text={d.text} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'preview' && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[12px] font-semibold mb-0.5" style={{ color: TEXT.primary }}>
                  Historical Action Preview
                </div>
                <div className="text-[10px] font-mono" style={{ color: TEXT.secondary }}>
                  Run the candidate policy against historical actions to see which would have been
                  blocked, allowed, or required approval
                </div>
              </div>
              <button
                onClick={runPreview}
                disabled={!compiled}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded text-[10px] font-semibold disabled:opacity-40"
                style={{
                  color: ACCENT,
                  background: `${ACCENT}12`,
                  border: `1px solid ${ACCENT}35`,
                }}
              >
                <Play className="w-3 h-3" /> Run Preview
              </button>
            </div>

            {!compiled && (
              <div
                className="rounded border p-8 flex flex-col items-center gap-2"
                style={{ background: BG.surface, borderColor: BORDER.subtle }}
              >
                <AlertCircle className="w-6 h-6" style={{ color: TEXT.muted }} />
                <div className="text-[11px] font-mono" style={{ color: TEXT.tertiary }}>
                  Compile a policy first to run preview
                </div>
              </div>
            )}

            {compiled && !previewRan && (
              <div
                className="rounded border p-8 flex flex-col items-center gap-2"
                style={{ background: BG.surface, borderColor: BORDER.subtle }}
              >
                <Eye className="w-6 h-6" style={{ color: TEXT.muted }} />
                <div className="text-[11px] font-mono" style={{ color: TEXT.tertiary }}>
                  Click "Run Preview" to replay historical actions through this policy
                </div>
              </div>
            )}

            {previewRan && (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {(['allowed', 'approval_required', 'blocked', 'escalated'] as OutcomeKey[]).map(
                    (k) => {
                      const count = previewCases.filter((p) => p.outcome === k).length;
                      const cfg = OUTCOME_CFG[k];
                      return (
                        <div
                          key={k}
                          className="rounded border p-3"
                          style={{ background: BG.surface, borderColor: `${cfg.color}20` }}
                        >
                          <div
                            className="text-[22px] font-bold font-mono"
                            style={{ color: cfg.color }}
                          >
                            {count}
                          </div>
                          <div
                            className="text-[9px] font-mono uppercase tracking-wider"
                            style={{ color: cfg.color }}
                          >
                            {cfg.label}
                          </div>
                        </div>
                      );
                    },
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  {previewCases.map((c) => {
                    const outcomeKey = c.outcome ?? 'allowed';
                    const cfg = OUTCOME_CFG[outcomeKey];
                    return (
                      <div
                        key={c.id}
                        className="rounded border p-3 flex items-start gap-3"
                        style={{ background: BG.surface, borderColor: BORDER.muted }}
                      >
                        <div
                          className="w-6 h-6 rounded flex items-center justify-center shrink-0 mt-0.5"
                          style={{ background: cfg.bg }}
                        >
                          <cfg.Icon className="w-3 h-3" style={{ color: cfg.color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span
                              className="text-[11px] font-medium"
                              style={{ color: TEXT.primary }}
                            >
                              {c.description}
                            </span>
                            <OutcomeBadge outcome={outcomeKey} />
                          </div>
                          <div
                            className="flex items-center gap-3 text-[9px] font-mono flex-wrap"
                            style={{ color: TEXT.tertiary }}
                          >
                            <span>type: {c.actionType}</span>
                            <span>
                              cost: $
                              {((c.context.estimatedCostUsd as number) ?? 0).toLocaleString()}
                            </span>
                            {c.matchedRule && (
                              <span>
                                rule: "{c.matchedRule.slice(0, 45)}
                                {c.matchedRule.length > 45 ? '…' : ''}"
                              </span>
                            )}
                          </div>
                          {c.reasoning && (
                            <div
                              className="text-[9px] mt-1 font-mono"
                              style={{ color: TEXT.tertiary }}
                            >
                              {c.reasoning}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'tests' && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <div className="text-[12px] font-semibold mb-0.5" style={{ color: TEXT.primary }}>
                  Policy Test Harness
                </div>
                <div className="text-[10px] font-mono" style={{ color: TEXT.secondary }}>
                  Define named test cases with expected outcomes — run on every save
                </div>
              </div>
              <div className="flex items-center gap-2">
                {totalRan > 0 && (
                  <div
                    className="flex items-center gap-1.5 text-[10px] font-mono px-2 py-1 rounded"
                    style={{
                      background: failedTests > 0 ? 'rgba(239,68,68,0.08)' : 'rgba(34,197,94,0.08)',
                      border: `1px solid ${failedTests > 0 ? 'rgba(239,68,68,0.25)' : 'rgba(34,197,94,0.25)'}`,
                      color: failedTests > 0 ? '#ef4444' : '#22c55e',
                    }}
                  >
                    <CheckSquare className="w-3 h-3" />
                    {passedTests}/{totalRan} passed
                  </div>
                )}
                <button
                  onClick={() => setShowAddTest((s) => !s)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-semibold"
                  style={{ color: TEXT.secondary, border: `1px solid ${BORDER.muted}` }}
                >
                  <Plus className="w-3 h-3" /> Add Test
                </button>
                <button
                  onClick={runTests}
                  disabled={!compiled || testRunning || testCases.length === 0}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded text-[10px] font-semibold disabled:opacity-40"
                  style={{
                    color: ACCENT,
                    background: `${ACCENT}12`,
                    border: `1px solid ${ACCENT}35`,
                  }}
                >
                  <Play className={`w-3 h-3 ${testRunning ? 'animate-pulse' : ''}`} />
                  {testRunning ? 'Running…' : 'Run All'}
                </button>
              </div>
            </div>

            {showAddTest && (
              <div
                className="rounded border p-3 flex flex-col gap-2"
                style={{ background: `${ACCENT}05`, borderColor: `${ACCENT}25` }}
              >
                <div className="text-[10px] font-mono font-semibold" style={{ color: ACCENT }}>
                  New Test Case
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label
                      className="text-[9px] uppercase tracking-wider font-mono mb-1 block"
                      style={{ color: TEXT.tertiary }}
                    >
                      Test Name *
                    </label>
                    <input
                      value={newTestName}
                      onChange={(e) => setNewTestName(e.target.value)}
                      placeholder="e.g. Large payout needs approval"
                      className="w-full text-[11px] px-2 py-1.5 rounded outline-none"
                      style={{
                        background: 'rgba(0,0,0,0.3)',
                        border: `1px solid ${BORDER.muted}`,
                        color: TEXT.primary,
                      }}
                    />
                  </div>
                  <div>
                    <label
                      className="text-[9px] uppercase tracking-wider font-mono mb-1 block"
                      style={{ color: TEXT.tertiary }}
                    >
                      Expected Outcome
                    </label>
                    <select
                      value={newTestExpected}
                      onChange={(e) =>
                        setNewTestExpected(e.target.value as TestCase['expectedOutcome'])
                      }
                      className="w-full text-[11px] px-2 py-1.5 rounded outline-none"
                      style={{
                        background: '#0c1420',
                        border: `1px solid ${BORDER.muted}`,
                        color: TEXT.primary,
                      }}
                    >
                      <option value="allowed">Allowed</option>
                      <option value="approval_required">Approval Required</option>
                      <option value="blocked">Blocked</option>
                      <option value="escalated">Escalated</option>
                    </select>
                  </div>
                  <div>
                    <label
                      className="text-[9px] uppercase tracking-wider font-mono mb-1 block"
                      style={{ color: TEXT.tertiary }}
                    >
                      Action Type
                    </label>
                    <input
                      value={newTestAction}
                      onChange={(e) => setNewTestAction(e.target.value)}
                      placeholder="payout, transfer, export…"
                      className="w-full text-[11px] px-2 py-1.5 rounded outline-none"
                      style={{
                        background: 'rgba(0,0,0,0.3)',
                        border: `1px solid ${BORDER.muted}`,
                        color: TEXT.primary,
                      }}
                    />
                  </div>
                  <div>
                    <label
                      className="text-[9px] uppercase tracking-wider font-mono mb-1 block"
                      style={{ color: TEXT.tertiary }}
                    >
                      Estimated Cost (USD)
                    </label>
                    <input
                      type="number"
                      value={newTestAmount}
                      onChange={(e) => setNewTestAmount(e.target.value)}
                      placeholder="0"
                      className="w-full text-[11px] px-2 py-1.5 rounded outline-none"
                      style={{
                        background: 'rgba(0,0,0,0.3)',
                        border: `1px solid ${BORDER.muted}`,
                        color: TEXT.primary,
                      }}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={addTestCase}
                    disabled={!newTestName.trim()}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-semibold disabled:opacity-40"
                    style={{
                      color: '#22c55e',
                      background: 'rgba(34,197,94,0.08)',
                      border: '1px solid rgba(34,197,94,0.3)',
                    }}
                  >
                    <Plus className="w-3 h-3" /> Add
                  </button>
                  <button
                    onClick={() => setShowAddTest(false)}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-semibold"
                    style={{ color: TEXT.tertiary, border: `1px solid ${BORDER.muted}` }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {testCases.length === 0 ? (
              <div
                className="rounded border p-8 flex flex-col items-center gap-2"
                style={{ background: BG.surface, borderColor: BORDER.subtle }}
              >
                <FlaskConical className="w-6 h-6" style={{ color: TEXT.muted }} />
                <div className="text-[11px] font-mono" style={{ color: TEXT.tertiary }}>
                  No test cases yet. Add one above.
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {testCases.map((tc) => {
                  const passed = tc.ran ? tc.passed : undefined;
                  const statusColor =
                    passed === undefined ? TEXT.tertiary : passed ? '#22c55e' : '#ef4444';
                  const statusBg =
                    passed === undefined
                      ? 'transparent'
                      : passed
                        ? 'rgba(34,197,94,0.08)'
                        : 'rgba(239,68,68,0.08)';
                  const statusBorder =
                    passed === undefined
                      ? BORDER.muted
                      : passed
                        ? 'rgba(34,197,94,0.25)'
                        : 'rgba(239,68,68,0.25)';
                  return (
                    <div
                      key={tc.id}
                      className="rounded border p-3 flex items-start gap-3"
                      style={{
                        background: BG.surface,
                        borderColor: statusBorder,
                        backgroundColor: passed !== undefined ? statusBg : undefined,
                      }}
                    >
                      <div className="shrink-0 mt-0.5">
                        {tc.ran ? (
                          tc.passed ? (
                            <CheckCircle className="w-4 h-4" style={{ color: '#22c55e' }} />
                          ) : (
                            <XCircle className="w-4 h-4" style={{ color: '#ef4444' }} />
                          )
                        ) : (
                          <Clock className="w-4 h-4" style={{ color: TEXT.muted }} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[11px] font-medium" style={{ color: TEXT.primary }}>
                            {tc.name}
                          </span>
                          <span className="text-[9px] font-mono" style={{ color: statusColor }}>
                            expected:{' '}
                            <span className="uppercase">
                              {tc.expectedOutcome.replace('_', ' ')}
                            </span>
                          </span>
                          {tc.ran && tc.actualOutcome && (
                            <span className="text-[9px] font-mono" style={{ color: statusColor }}>
                              got:{' '}
                              <span className="uppercase">
                                {tc.actualOutcome.replace('_', ' ')}
                              </span>
                            </span>
                          )}
                        </div>
                        <div
                          className="flex items-center gap-3 text-[9px] font-mono flex-wrap"
                          style={{ color: TEXT.tertiary }}
                        >
                          <span>action: {String(tc.context.action ?? 'any')}</span>
                          {tc.context.estimatedCostUsd !== undefined && (
                            <span>
                              cost: ${Number(tc.context.estimatedCostUsd).toLocaleString()}
                            </span>
                          )}
                        </div>
                        {tc.ran && tc.reasoning && (
                          <div
                            className="text-[9px] mt-1 font-mono"
                            style={{ color: TEXT.tertiary }}
                          >
                            {tc.reasoning}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => removeTestCase(tc.id)}
                        className="shrink-0 p-1 rounded hover:bg-white/5"
                        style={{ color: TEXT.muted }}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            <div
              className="rounded border p-3"
              style={{ background: BG.surface, borderColor: BORDER.subtle }}
            >
              <div
                className="flex items-center gap-1.5 text-[9px] font-mono uppercase tracking-wider mb-2"
                style={{ color: TEXT.tertiary }}
              >
                <Lock className="w-3 h-3" /> Audit Log — Test Events
              </div>
              <div className="flex flex-col gap-1 max-h-32 overflow-y-auto">
                {auditLog
                  .filter(
                    (e) =>
                      e.event.toLowerCase().includes('test') ||
                      e.event.toLowerCase().includes('harness'),
                  )
                  .map((entry, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 text-[9px] font-mono"
                      style={{ color: TEXT.tertiary }}
                    >
                      <span style={{ color: TEXT.muted }}>
                        {new Date(entry.at).toLocaleTimeString()}
                      </span>
                      <span>{entry.event}</span>
                      <span style={{ color: ACCENT }}>· {entry.actor}</span>
                    </div>
                  ))}
                {auditLog.filter(
                  (e) =>
                    e.event.toLowerCase().includes('test') ||
                    e.event.toLowerCase().includes('harness'),
                ).length === 0 && (
                  <div className="text-[9px] font-mono" style={{ color: TEXT.muted }}>
                    No test events yet
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[12px] font-semibold mb-0.5" style={{ color: TEXT.primary }}>
                  Version History
                </div>
                <div className="text-[10px] font-mono" style={{ color: TEXT.secondary }}>
                  Every version with author, timestamp, signer attribution, and rollback
                </div>
              </div>
              <div className="text-[10px] font-mono" style={{ color: TEXT.tertiary }}>
                {versions.length} version{versions.length !== 1 ? 's' : ''}
              </div>
            </div>

            {versions.length === 0 ? (
              <div
                className="rounded border p-8 flex flex-col items-center gap-2"
                style={{ background: BG.surface, borderColor: BORDER.subtle }}
              >
                <History className="w-6 h-6" style={{ color: TEXT.muted }} />
                <div className="text-[11px] font-mono" style={{ color: TEXT.tertiary }}>
                  No saved versions yet. Compile and save a version.
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {[...versions].reverse().map((v, idx) => {
                  const isLatest = idx === 0;
                  return (
                    <div
                      key={v.id}
                      className="rounded border p-3"
                      style={{
                        background: BG.surface,
                        borderColor: isLatest ? `${ACCENT}35` : BORDER.muted,
                      }}
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold font-mono shrink-0"
                            style={{
                              background: isLatest ? `${ACCENT}15` : 'rgba(255,255,255,0.04)',
                              color: isLatest ? ACCENT : TEXT.tertiary,
                              border: `1px solid ${isLatest ? `${ACCENT}40` : BORDER.muted}`,
                            }}
                          >
                            v{v.versionNumber}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span
                                className="text-[11px] font-semibold"
                                style={{ color: TEXT.primary }}
                              >
                                {v.message}
                              </span>
                              {isLatest && (
                                <span
                                  className="text-[9px] font-mono px-1.5 py-0.5 rounded uppercase"
                                  style={{
                                    color: ACCENT,
                                    background: `${ACCENT}12`,
                                    border: `1px solid ${ACCENT}30`,
                                  }}
                                >
                                  Latest
                                </span>
                              )}
                              {v.isActive && (
                                <span
                                  className="text-[9px] font-mono px-1.5 py-0.5 rounded uppercase flex items-center gap-1"
                                  style={{
                                    color: '#22c55e',
                                    background: 'rgba(34,197,94,0.12)',
                                    border: '1px solid rgba(34,197,94,0.35)',
                                  }}
                                >
                                  <span
                                    className="w-1.5 h-1.5 rounded-full inline-block"
                                    style={{ background: '#22c55e' }}
                                  />
                                  Active
                                </span>
                              )}
                            </div>
                            <div
                              className="flex items-center gap-2 text-[9px] font-mono mt-0.5"
                              style={{ color: TEXT.tertiary }}
                            >
                              <User className="w-2.5 h-2.5" />
                              {v.author}
                              <span>·</span>
                              <span>{new Date(v.savedAt).toLocaleString()}</span>
                              <span>·</span>
                              <span>
                                {v.policy.rules.length} rule{v.policy.rules.length !== 1 ? 's' : ''}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {!isLatest && (
                            <button
                              onClick={() => handleRollback(v)}
                              className="flex items-center gap-1.5 px-2 py-1 rounded text-[9px] font-semibold"
                              style={{
                                color: '#8b7ac8',
                                background: 'rgba(139,122,200,0.08)',
                                border: '1px solid rgba(139,122,200,0.25)',
                              }}
                            >
                              <RotateCcw className="w-2.5 h-2.5" /> Rollback
                            </button>
                          )}
                          <button
                            onClick={() => handleSignVersion(v.id)}
                            disabled={v.signers.some((s) => s.name === 'Sarah Mitchell')}
                            className="flex items-center gap-1.5 px-2 py-1 rounded text-[9px] font-semibold disabled:opacity-40"
                            style={{
                              color: '#22c55e',
                              background: 'rgba(34,197,94,0.08)',
                              border: '1px solid rgba(34,197,94,0.25)',
                            }}
                          >
                            <Lock className="w-2.5 h-2.5" />
                            {v.signers.some((s) => s.name === 'Sarah Mitchell') ? 'Signed' : 'Sign'}
                          </button>
                          {v.isActive ? (
                            <button
                              onClick={() => handleDeactivateVersion(v.id)}
                              className="flex items-center gap-1.5 px-2 py-1 rounded text-[9px] font-semibold"
                              title="Deactivate this policy version"
                              style={{
                                color: '#f97316',
                                background: 'rgba(249,115,22,0.08)',
                                border: '1px solid rgba(249,115,22,0.25)',
                              }}
                            >
                              <span
                                className="w-1.5 h-1.5 rounded-full inline-block"
                                style={{ background: '#f97316' }}
                              />
                              Deactivate
                            </button>
                          ) : (
                            <button
                              onClick={() => handleActivateVersion(v.id)}
                              disabled={v.signers.length < 1}
                              className="flex items-center gap-1.5 px-2 py-1 rounded text-[9px] font-semibold disabled:opacity-30"
                              title={
                                v.signers.length < 1
                                  ? 'Policy must be signed before activation'
                                  : 'Activate this policy version'
                              }
                              style={{
                                color: '#22c55e',
                                background: 'rgba(34,197,94,0.05)',
                                border: '1px solid rgba(34,197,94,0.2)',
                              }}
                            >
                              <span
                                className="w-1.5 h-1.5 rounded-full inline-block"
                                style={{ background: v.signers.length < 1 ? '#6b7280' : '#22c55e' }}
                              />
                              Activate
                            </button>
                          )}
                        </div>
                      </div>

                      {v.signers.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {v.signers.map((s, i) => (
                            <div
                              key={i}
                              className="flex items-center gap-1 text-[9px] font-mono px-2 py-0.5 rounded"
                              style={{
                                background: 'rgba(34,197,94,0.06)',
                                border: '1px solid rgba(34,197,94,0.2)',
                                color: '#86efac',
                              }}
                            >
                              <Lock className="w-2 h-2" />
                              {s.name} · {s.role} · {new Date(s.signedAt).toLocaleDateString()}
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="flex flex-col gap-1">
                        {v.policy.rules.slice(0, 3).map((r) => (
                          <div
                            key={r.id}
                            className="flex items-center gap-2 text-[10px] font-mono"
                            style={{ color: TEXT.secondary }}
                          >
                            <EffectBadge effect={r.effect} />
                            <span className="truncate">{r.name}</span>
                          </div>
                        ))}
                        {v.policy.rules.length > 3 && (
                          <div className="text-[9px] font-mono" style={{ color: TEXT.tertiary }}>
                            +{v.policy.rules.length - 3} more rule
                            {v.policy.rules.length - 3 !== 1 ? 's' : ''}
                          </div>
                        )}
                      </div>

                      <div className="mt-2.5 flex items-center gap-2">
                        <div className="text-[9px] font-mono" style={{ color: TEXT.tertiary }}>
                          Confidence
                        </div>
                        <div className="w-32">
                          <ConfidenceMeter value={v.policy.overallConfidence} />
                        </div>
                        <button
                          onClick={() =>
                            navigator.clipboard?.writeText(JSON.stringify(v.policy, null, 2))
                          }
                          className="ml-auto flex items-center gap-1 text-[9px] font-mono px-2 py-0.5 rounded hover:bg-white/5"
                          style={{ color: TEXT.muted, border: `1px solid ${BORDER.subtle}` }}
                        >
                          <Copy className="w-2.5 h-2.5" /> Copy JSON
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div
              className="rounded border p-3"
              style={{ background: BG.surface, borderColor: BORDER.subtle }}
            >
              <div
                className="flex items-center gap-1.5 text-[9px] font-mono uppercase tracking-wider mb-2"
                style={{ color: TEXT.tertiary }}
              >
                <Lock className="w-3 h-3" /> Full Audit Trail
              </div>
              <div className="flex flex-col gap-1 max-h-40 overflow-y-auto">
                {[...auditLog].reverse().map((entry, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 text-[9px] font-mono"
                    style={{ color: TEXT.tertiary }}
                  >
                    <span style={{ color: TEXT.muted }}>
                      {new Date(entry.at).toLocaleTimeString()}
                    </span>
                    <span>{entry.event}</span>
                    <span style={{ color: ACCENT }}>· {entry.actor}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
