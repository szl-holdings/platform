// doctrine-scanner-exempt: legacy live-product surface; rename tracked as separate engineering debt — see scripts/check-doctrine-v6.mjs header.
import { z } from 'zod';

export const SeveritySchema = z.enum(['critical', 'high', 'medium', 'low', 'info']);
export type Severity = z.infer<typeof SeveritySchema>;

export const RiskBandSchema = z.enum(['P1', 'P2', 'P3', 'P4']);
export type RiskBand = z.infer<typeof RiskBandSchema>;

export const PolicyDecisionSchema = z.enum(['allow', 'warn', 'approval_required', 'deny']);
export type PolicyDecision = z.infer<typeof PolicyDecisionSchema>;

export const FindingSchema = z.object({
  id: z.string().min(1),
  source: z.enum(['semgrep', 'codeql', 'osv', 'trivy', 'grype', 'gitleaks', 'checkov', 'npm_audit', 'pnpm_audit', 'pip_audit', 'argus', 'ariadne', 'glasswing']),
  category: z.enum(['sast', 'sca', 'secrets', 'iac', 'container', 'logic', 'auth', 'tenant', 'rate_limit', 'ssrf', 'injection', 'crypto']),
  title: z.string().min(1),
  description: z.string(),
  severity: SeveritySchema,
  confidence: z.number().min(0).max(1),
  cwe: z.string().optional(),
  owasp: z.string().optional(),
  file: z.string().optional(),
  line: z.number().optional(),
  evidenceRedacted: z.string(),
  affectedComponent: z.string(),
  reachability: z.enum(['reachable', 'partial', 'unreachable', 'unknown']),
  internetExposed: z.boolean(),
  authBoundary: z.boolean(),
  tenantBoundary: z.boolean(),
  dataSensitivity: z.enum(['pii', 'phi', 'pci', 'secret', 'internal', 'public']),
  remediation: z.string(),
  riskScore: z.number().min(0).max(100),
  riskBand: RiskBandSchema,
  status: z.enum(['open', 'patch_proposed', 'awaiting_approval', 'approved', 'remediated', 'verified', 'wont_fix', 'false_positive']),
  createdAt: z.string().datetime({ offset: true }),
  updatedAt: z.string().datetime({ offset: true }),
});
export type Finding = z.infer<typeof FindingSchema>;

export const PatchCandidateSchema = z.object({
  id: z.string().min(1),
  findingIds: z.array(z.string()).min(1),
  title: z.string().min(1),
  summary: z.string(),
  filesChanged: z.array(z.string()).min(1),
  diffPreview: z.string(),
  testsAdded: z.array(z.string()),
  commandsToRun: z.array(z.string()),
  rollbackPlan: z.string().min(1),
  riskBefore: z.number().int().min(0).max(100),
  riskAfterEstimate: z.number().int().min(0).max(100),
  approvalRequired: z.boolean(),
  approvalId: z.string().optional(),
  status: z.enum(['draft', 'awaiting_approval', 'approved', 'applied', 'verified', 'rejected', 'rolled_back']),
  generatedBy: z.string(),
  generatedAt: z.string().datetime({ offset: true }),
}).refine(
  (p) => !p.approvalRequired || p.status === 'draft' || !!p.approvalId,
  { message: 'approvalId required once an approval-gated patch leaves draft', path: ['approvalId'] },
);
export type PatchCandidate = z.infer<typeof PatchCandidateSchema>;

export const ApprovalSchema = z.object({
  id: z.string().min(1),
  requestedByAgent: z.string().min(1),
  actionType: z.enum(['file_write', 'shell_command', 'dependency_upgrade', 'iac_change', 'deploy', 'patch_apply', 'secret_rotation', 'external_call']),
  description: z.string().min(1),
  resources: z.array(z.string()),
  commandPreview: z.string().optional(),
  fileChangePreview: z.string().optional(),
  riskSummary: z.string(),
  rollbackPlan: z.string().min(1),
  status: z.enum(['pending', 'approved', 'rejected', 'expired']),
  reviewer: z.string().optional(),
  createdAt: z.string().datetime({ offset: true }),
  decidedAt: z.string().datetime({ offset: true }).optional(),
}).refine(
  (a) => a.status === 'pending' || !!a.decidedAt,
  { message: 'decidedAt required once approval leaves pending', path: ['decidedAt'] },
);
export type Approval = z.infer<typeof ApprovalSchema>;

export const AuditEventSchema = z.object({
  id: z.string().min(1),
  timestamp: z.string().datetime({ offset: true }),
  agent: z.string().min(1),
  action: z.string().min(1),
  resource: z.string(),
  inputHash: z.string().min(1),
  outputHash: z.string().min(1),
  policyDecision: PolicyDecisionSchema,
  approvalId: z.string().optional(),
  evidenceLinks: z.array(z.string()),
  confidence: z.number().min(0).max(1),
  status: z.enum(['ok', 'blocked', 'failed', 'rolled_back']),
  prevHash: z.string().optional(),
}).refine(
  (e) => e.policyDecision !== 'approval_required' || !!e.approvalId,
  { message: 'approvalId required when policyDecision is approval_required', path: ['approvalId'] },
);
export type AuditEvent = z.infer<typeof AuditEventSchema>;

export const RLStateSchema = z.object({
  repoId: z.string().min(1),
  commitSha: z.string().min(1),
  findingsSummary: z.object({
    p1: z.number().int().nonnegative(),
    p2: z.number().int().nonnegative(),
    p3: z.number().int().nonnegative(),
    p4: z.number().int().nonnegative(),
  }),
  testsStatus: z.object({
    passing: z.number().int().nonnegative(),
    failing: z.number().int().nonnegative(),
    coverage: z.number().min(0).max(1),
  }),
  policyStatus: z.enum(['clean', 'warn', 'blocked']),
  riskPosture: z.number().int().min(0).max(100),
  historicalContext: z.object({
    episodesCompleted: z.number().int().nonnegative(),
    avgReward: z.number(),
    falsePositiveRate: z.number().min(0).max(1),
    patchAcceptanceRate: z.number().min(0).max(1),
  }),
});
export type RLState = z.infer<typeof RLStateSchema>;

export const RLActionTypeSchema = z.enum([
  'scan_sast', 'scan_sca', 'scan_secrets', 'scan_iac',
  'inspect_logic', 'propose_patch', 'verify_patch', 'add_test',
  'request_approval', 'defer', 'escalate', 'document',
  'replay_episode', 'recompute_value',
]);
export type RLActionType = z.infer<typeof RLActionTypeSchema>;

export const RLActionSchema = z.object({
  id: z.string(),
  type: RLActionTypeSchema,
  target: z.string(),
  expectedValue: z.number(),
  expectedRiskDelta: z.number(),
  approvalRequired: z.boolean(),
  rationale: z.string(),
});
export type RLAction = z.infer<typeof RLActionSchema>;

export const RLRewardSchema = z.object({
  episodeId: z.string(),
  actionId: z.string(),
  rewardValue: z.number(),
  rewardReason: z.string(),
  outcome: z.enum(['fix_verified', 'patch_accepted', 'test_added', 'false_positive_reduced', 'doc_improved', 'test_failed', 'regression', 'unsafe_blocked', 'unauthorized_blocked']),
  calibratedRiskDelta: z.number(),
  recordedAt: z.string(),
});
export type RLReward = z.infer<typeof RLRewardSchema>;

export const REWARD_TABLE: ReadonlyArray<{ outcome: RLReward['outcome']; value: number; description: string }> = [
  { outcome: 'fix_verified',           value: +10, description: 'Critical/high risk verifiably remediated by re-scan' },
  { outcome: 'patch_accepted',         value:  +3, description: 'Human reviewer accepted the patch candidate' },
  { outcome: 'test_added',             value:  +4, description: 'New regression or security test added and passing' },
  { outcome: 'false_positive_reduced', value:  +2, description: 'Replay buffer reduced a class of false positives' },
  { outcome: 'doc_improved',           value:  +1, description: 'Audit doc / ADR / runbook entry improved' },
  { outcome: 'test_failed',            value:  -5, description: 'Patch caused a test failure during verify' },
  { outcome: 'regression',             value: -10, description: 'Patch introduced a regression in production-grade tests' },
  { outcome: 'unsafe_blocked',         value:  -8, description: 'Cerberus blocked an unsafe proposed action' },
  { outcome: 'unauthorized_blocked',   value: -10, description: 'Attempt to act on an unauthorized target was blocked' },
] as const;
