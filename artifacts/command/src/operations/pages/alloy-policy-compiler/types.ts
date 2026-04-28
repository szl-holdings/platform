export const STUDIO_ID = 'default';
export const API_BASE = (import.meta.env.BASE_URL ?? '/').replace(/\/$/, '');
export const LLM_THRESHOLD = 0.7;

export type PolicyEffect = 'allow' | 'require_approval' | 'escalate' | 'block' | 'audit_only';
export type OutcomeKey = 'blocked' | 'allowed' | 'approval_required' | 'escalated' | 'audited';
export type Tab = 'author' | 'preview' | 'tests' | 'history';

export interface ParsedCondition {
  field: string;
  operator: 'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'in' | 'not_in';
  value: unknown;
  label: string;
}

export interface CompiledRule {
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
  llmAssisted?: boolean;
  llmConfidence?: number;
  llmStatus?: 'idle' | 'loading' | 'applied' | 'error';
  llmError?: string;
  llmNote?: string;
  deterministicSnapshot?: Pick<CompiledRule, 'effect' | 'conditions' | 'requiredApproverRole' | 'escalateTo' | 'reason' | 'confidence' | 'warnings'>;
}

export interface LLMAssistResponseRule {
  effect?: PolicyEffect;
  conditions?: Array<{ field: string; operator: ParsedCondition['operator']; value: unknown }>;
  requiredApproverRole?: string;
  escalateTo?: string;
  reason?: string;
  confidence?: number;
  notes?: string;
}

export interface LLMAssistResponse {
  sentence: string;
  result: LLMAssistResponseRule | null;
  modelUsed: string;
  llmAvailable: boolean;
  fallbackReason?: string;
}

export interface CompiledPolicy {
  id: string;
  name: string;
  scope: 'tenant' | 'domain' | 'action';
  domain?: string;
  rules: CompiledRule[];
  overallConfidence: number;
  warnings: string[];
  compiledAt: number;
}

export interface PolicyVersion {
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

export interface ServerPolicyVersion {
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

export interface ServerTestCase {
  externalId: string;
  studioId: string;
  name: string;
  context: Record<string, unknown>;
  expectedOutcome: TestCase['expectedOutcome'];
}

export interface PolicyCompilerStateResponse {
  studioId: string;
  versions: ServerPolicyVersion[];
  testCases: ServerTestCase[];
}

export interface ApiEnvelope<T> {
  data?: T;
}

export interface TestCase {
  id: string;
  name: string;
  context: Record<string, unknown>;
  expectedOutcome: 'blocked' | 'allowed' | 'approval_required' | 'escalated';
  actualOutcome?: 'blocked' | 'allowed' | 'approval_required' | 'escalated';
  passed?: boolean;
  reasoning?: string;
  ran?: boolean;
}

export interface PreviewCase {
  id: string;
  actionType: string;
  description: string;
  context: Record<string, unknown>;
  outcome?: OutcomeKey;
  matchedRule?: string;
  reasoning?: string;
  previousOutcome?: OutcomeKey;
}

export function fromServerVersion(v: ServerPolicyVersion): PolicyVersion {
  const savedAtMs = (() => { const ms = Date.parse(v.savedAt); return Number.isFinite(ms) ? ms : Date.now(); })();
  return {
    id: v.externalId, versionNumber: v.versionNumber, input: v.input, policy: v.policy, author: v.author,
    authorId: v.authorId, savedAt: savedAtMs, message: v.message,
    signers: Array.isArray(v.signers) ? v.signers : [],
    isActive: !!(v.policy as unknown as Record<string, unknown>).isActive,
  };
}

export function fromServerTestCase(t: ServerTestCase): TestCase {
  return { id: t.externalId, name: t.name, context: t.context ?? {}, expectedOutcome: t.expectedOutcome };
}
