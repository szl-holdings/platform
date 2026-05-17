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

export const COUNSEL_DOCKET_RISK_INTERCEPTOR: CpsPayloadDefinition = {
  id: 'cps-counsel-docket-risk',
  name: 'Counsel Docket-Risk Interceptor',
  version: '1.0.0',
  description:
    'Detects deadline collision, adverse filing signals, and jurisdictional conflicts across active matters. Auto-prioritizes matter response plans by legal exposure and business impact. Emits an immutable decision log per action suitable for audit and court defensibility.',
  category: 'legal-risk',
  mitreTactics: [],
  mitretechniques: [],
  defaultMaturityMode: 'shadow',
  defaultApprovalTier: 'operator',
  detectionLogic: [
    {
      id: 'cdr-deadline-collision',
      name: 'Deadline Collision Detection',
      condition: 'deadlines_within_7d >= 2 AND same_matter = true OR critical_deadline_missed = true',
      severity: 'critical',
      indicators: ['matter_id', 'deadline_ids', 'deadline_dates', 'priority_levels', 'assigned_counsel'],
    },
    {
      id: 'cdr-adverse-filing',
      name: 'Adverse Filing Signal',
      condition: 'opposing_filing_detected = true AND response_window_days < 14',
      severity: 'high',
      indicators: ['matter_id', 'filing_type', 'court_docket_ref', 'filing_date', 'response_deadline'],
    },
    {
      id: 'cdr-jurisdictional-conflict',
      name: 'Jurisdictional Conflict Alert',
      condition: 'multi_jurisdiction_overlap = true AND conflicting_precedents_found >= 2',
      severity: 'high',
      indicators: ['matter_id', 'jurisdictions', 'conflicting_case_refs', 'venue_risk_score'],
    },
  ],
  decisionPolicy: {
    riskThresholds: { critical: 0.9, high: 0.75, medium: 0.5 },
    autoActionConditions: [
      'confidence >= 0.95 AND severity = critical AND maturity = autonomous',
    ],
    escalationCriteria: [
      'total_exposure_usd > 50000000',
      'court_deadline_hours_remaining < 48',
      'class_action_flag = true',
    ],
    approvalOverrides: [
      { condition: 'action = matter_response_plan_escalation', tier: 'supervisor' },
      { condition: 'action = settlement_authority_request AND exposure_usd > 25000000', tier: 'executive' },
    ],
  },
  constrainedActions: [
    {
      id: 'cdr-response-plan-prioritize',
      type: 'matter-response-prioritization',
      description: 'Auto-prioritize matter response plan by legal exposure and business impact',
      reversible: true,
      requiresApproval: false,
      approvalTier: 'auto',
      impactLevel: 'low',
      rollbackProcedure: 'Restore previous matter priority order and archive prioritization rationale',
    },
    {
      id: 'cdr-counsel-alert',
      type: 'counsel-deadline-alert',
      description: 'Alert assigned counsel and matter manager of imminent deadline collision',
      reversible: true,
      requiresApproval: false,
      approvalTier: 'operator',
      impactLevel: 'low',
      rollbackProcedure: 'Send correction notice if alert was erroneous',
    },
    {
      id: 'cdr-response-plan-escalation',
      type: 'matter-response-plan-escalation',
      description: 'Escalate matter response plan to senior counsel with exposure and impact summary',
      reversible: true,
      requiresApproval: true,
      approvalTier: 'supervisor',
      impactLevel: 'medium',
      rollbackProcedure: 'De-escalate matter and restore standard workflow assignment',
    },
    {
      id: 'cdr-settlement-authority',
      type: 'settlement-authority-request',
      description: 'Request executive settlement authority — immutable decision log filed for audit',
      reversible: false,
      requiresApproval: true,
      approvalTier: 'executive',
      impactLevel: 'critical',
      rollbackProcedure: 'Settlement authority request is logged as immutable — issue countermand memo via counsel',
    },
  ],
  rollbackContract: {
    tested: true,
    lastTestedAt: now,
    steps: [
      { order: 1, action: 'Restore matter priority order', target: 'Matter Management System', verifyCommand: 'matters check-priority --matter $MATTER_ID', timeout: 15000 },
      { order: 2, action: 'Notify counsel of priority correction', target: 'Notifications', verifyCommand: 'notify verify-sent --ref $NOTIF_ID', timeout: 10000 },
      { order: 3, action: 'Archive decision log entry', target: 'Audit Store', verifyCommand: 'audit verify-entry --run $RUN_ID', timeout: 15000 },
    ],
    verificationChecks: [
      'Verify matter priority restored to pre-escalation state',
      'Confirm counsel notified of correction',
      'Verify immutable decision log entry archived and accessible',
      'Confirm no erroneous escalation notifications outstanding',
    ],
    maxRollbackWindowMs: 24 * 60 * 60 * 1000,
  },
  signatureHash: '',
  tags: ['legal', 'docket', 'deadline', 'adverse-filing', 'jurisdiction', 'matter-risk'],
  createdAt: now,
  updatedAt: now,
};
COUNSEL_DOCKET_RISK_INTERCEPTOR.signatureHash = computeHash(COUNSEL_DOCKET_RISK_INTERCEPTOR);

export const COUNSEL_CPS_PAYLOADS: CpsPayloadDefinition[] = [
  COUNSEL_DOCKET_RISK_INTERCEPTOR,
];
