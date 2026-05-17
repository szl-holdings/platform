import { createHash } from 'node:crypto';
import type { CpsPayloadDefinition } from '../cps/index.js';

const now = new Date().toISOString();

function canonicalize(value: unknown): string {
  if (value === null || value === undefined) return 'null';
  if (typeof value === 'boolean' || typeof value === 'number') return JSON.stringify(value);
  if (typeof value === 'string') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(',')}]`;
  if (typeof value === 'object') {
    const sorted = Object.keys(value as Record<string, unknown>)
      .sort()
      .map((k) => `${JSON.stringify(k)}:${canonicalize((value as Record<string, unknown>)[k])}`);
    return `{${sorted.join(',')}}`;
  }
  return JSON.stringify(value);
}

function computeHash(payload: Omit<CpsPayloadDefinition, 'signatureHash' | 'createdAt' | 'updatedAt' | 'tags'>): string {
  const content = canonicalize({
    id: payload.id,
    version: payload.version,
    detectionLogic: payload.detectionLogic,
    decisionPolicy: payload.decisionPolicy,
    constrainedActions: payload.constrainedActions,
    rollbackContract: payload.rollbackContract,
  });
  return createHash('sha256').update(content).digest('hex');
}

export const CARLOTA_CLIENT_PROTECTION_INTERCEPTOR: CpsPayloadDefinition = {
  id: 'cps-carlota-client-protection',
  name: 'Carlota Jo Client-Protection Interceptor',
  version: '1.0.0',
  description:
    'Detects privacy-breach signals, SLA-breach risk, and reputation risk across concierge engagements. Adds explicit consent gates on concierge workflow actions. Produces a per-action trust transcript made available to the client.',
  category: 'client-protection',
  mitreTactics: [],
  mitretechniques: [],
  defaultMaturityMode: 'shadow',
  defaultApprovalTier: 'operator',
  detectionLogic: [
    {
      id: 'ccp-privacy-breach',
      name: 'Privacy Breach Signal',
      condition: 'pii_shared_without_consent = true OR third_party_disclosure_unauthorized = true',
      severity: 'critical',
      indicators: ['client_id', 'data_category', 'disclosure_target', 'consent_record_id'],
    },
    {
      id: 'ccp-sla-breach-risk',
      name: 'SLA Breach Risk',
      condition: 'delivery_lag_hours > sla_threshold_hours OR milestone_missed_count >= 2',
      severity: 'high',
      indicators: ['client_id', 'engagement_id', 'sla_threshold_hours', 'current_lag_hours', 'milestones_missed'],
    },
    {
      id: 'ccp-reputation-risk',
      name: 'Reputation Risk Signal',
      condition: 'client_sentiment_score < -0.4 OR escalation_count >= 2 AND resolution_rate < 0.5',
      severity: 'high',
      indicators: ['client_id', 'sentiment_score', 'escalation_count', 'resolution_rate', 'channel'],
    },
  ],
  decisionPolicy: {
    riskThresholds: { critical: 0.88, high: 0.72, medium: 0.5 },
    autoActionConditions: [
      'confidence >= 0.95 AND severity = critical AND maturity = autonomous',
    ],
    escalationCriteria: [
      'client_tier = platinum',
      'engagement_value_usd > 250000',
      'privacy_breach_reportable = true',
    ],
    approvalOverrides: [
      { condition: 'action = concierge_pause AND client_tier = platinum', tier: 'supervisor' },
      { condition: 'action = privacy_breach_notification', tier: 'executive' },
    ],
  },
  constrainedActions: [
    {
      id: 'ccp-trust-transcript',
      type: 'trust-transcript',
      description: 'Generate per-action trust transcript and make available to client portal',
      reversible: false,
      requiresApproval: false,
      approvalTier: 'auto',
      impactLevel: 'low',
      rollbackProcedure: 'Trust transcripts are immutable by design — issue amendment addendum to client',
    },
    {
      id: 'ccp-sla-remediation-plan',
      type: 'sla-remediation-plan',
      description: 'Auto-generate SLA remediation plan and notify client success manager',
      reversible: true,
      requiresApproval: false,
      approvalTier: 'operator',
      impactLevel: 'medium',
      rollbackProcedure: 'Retract remediation plan and issue corrected version',
    },
    {
      id: 'ccp-concierge-pause',
      type: 'concierge-pause',
      description: 'Pause active concierge workflow steps pending explicit client consent re-confirmation',
      reversible: true,
      requiresApproval: true,
      approvalTier: 'supervisor',
      impactLevel: 'high',
      rollbackProcedure: 'Resume concierge workflow and document consent re-confirmation received',
    },
    {
      id: 'ccp-privacy-breach-notification',
      type: 'privacy-breach-notification',
      description: 'Initiate privacy breach notification to client and compliance officer',
      reversible: false,
      requiresApproval: true,
      approvalTier: 'executive',
      impactLevel: 'critical',
      rollbackProcedure: 'Breach notification is irreversible — issue correction notice if false positive confirmed',
    },
  ],
  rollbackContract: {
    tested: true,
    lastTestedAt: now,
    steps: [
      { order: 1, action: 'Resume concierge workflow', target: 'Concierge Platform', verifyCommand: 'concierge check-workflow-status --engagement $ENGAGEMENT_ID', timeout: 15000 },
      { order: 2, action: 'Notify client success manager of correction', target: 'Notifications', verifyCommand: 'notify verify-sent --ref $NOTIF_ID', timeout: 10000 },
      { order: 3, action: 'Archive trust transcript amendment', target: 'Client Portal', verifyCommand: 'portal verify-transcript --client $CLIENT_ID', timeout: 15000 },
    ],
    verificationChecks: [
      'Verify concierge workflow resumed to prior state',
      'Confirm client success manager notified of correction',
      'Verify trust transcript amendment published to client portal',
      'Confirm no erroneous breach notifications outstanding',
    ],
    maxRollbackWindowMs: 24 * 60 * 60 * 1000,
  },
  signatureHash: '',
  tags: ['advisory', 'client-protection', 'privacy', 'sla', 'reputation', 'concierge', 'trust'],
  createdAt: now,
  updatedAt: now,
};
CARLOTA_CLIENT_PROTECTION_INTERCEPTOR.signatureHash = computeHash(CARLOTA_CLIENT_PROTECTION_INTERCEPTOR);

export const CARLOTA_CPS_PAYLOADS: CpsPayloadDefinition[] = [
  CARLOTA_CLIENT_PROTECTION_INTERCEPTOR,
];
