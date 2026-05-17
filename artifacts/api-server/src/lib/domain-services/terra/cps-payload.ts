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

export const TERRA_MARKET_ANOMALY_INTERCEPTOR: CpsPayloadDefinition = {
  id: 'cps-terra-market-anomaly',
  name: 'Terra Market-Anomaly Interceptor',
  version: '1.0.0',
  description:
    'Detects distress signal clusters, fraud indicators, and title-risk alerts across tracked properties. Auto-generates a confidence-scored acquisition/risk memo with source traceability. Requires a legal gate before any irreversible transaction-state change.',
  category: 'real-estate-risk',
  mitreTactics: [],
  mitretechniques: [],
  defaultMaturityMode: 'shadow',
  defaultApprovalTier: 'operator',
  detectionLogic: [
    {
      id: 'tma-distress-cluster',
      name: 'Distress Signal Cluster',
      condition: 'distress_score >= 70 AND cluster_radius_properties >= 3',
      severity: 'high',
      indicators: ['property_id', 'distress_score', 'dscr', 'occupancy_rate', 'days_on_market'],
    },
    {
      id: 'tma-fraud-indicator',
      name: 'Transaction Fraud Indicators',
      condition: 'price_delta_pct > 30 AND listing_age_days < 7 OR deed_transfer_frequency > 3',
      severity: 'critical',
      indicators: ['property_id', 'listing_price', 'prior_sale_price', 'deed_transfer_count', 'listing_agent'],
    },
    {
      id: 'tma-title-risk',
      name: 'Title Risk Alert',
      condition: 'lien_count > 2 OR lis_pendens_filed = true OR ownership_gap_detected = true',
      severity: 'high',
      indicators: ['property_id', 'lien_count', 'lien_holders', 'lis_pendens_case', 'chain_of_title_gaps'],
    },
  ],
  decisionPolicy: {
    riskThresholds: { critical: 0.88, high: 0.72, medium: 0.5 },
    autoActionConditions: [
      'confidence >= 0.95 AND severity = critical AND maturity = autonomous',
    ],
    escalationCriteria: [
      'acquisition_value_usd > 10000000',
      'fraud_indicator_count > 2',
      'lis_pendens_filed = true',
    ],
    approvalOverrides: [
      { condition: 'action = transaction_state_freeze', tier: 'supervisor' },
      { condition: 'action = legal_title_hold AND acquisition_value_usd > 25000000', tier: 'executive' },
    ],
  },
  constrainedActions: [
    {
      id: 'tma-risk-memo',
      type: 'acquisition-risk-memo',
      description: 'Auto-generate confidence-scored acquisition/risk memo with source traceability',
      reversible: true,
      requiresApproval: false,
      approvalTier: 'auto',
      impactLevel: 'low',
      rollbackProcedure: 'Retract memo and issue corrected version with amendment flag',
    },
    {
      id: 'tma-due-diligence-flag',
      type: 'due-diligence-flag',
      description: 'Flag property for enhanced due diligence — notify acquisition team',
      reversible: true,
      requiresApproval: false,
      approvalTier: 'operator',
      impactLevel: 'medium',
      rollbackProcedure: 'Remove due diligence flag and archive false-positive determination',
    },
    {
      id: 'tma-transaction-state-freeze',
      type: 'transaction-state-freeze',
      description: 'Freeze transaction state — prevent irreversible deal progression pending legal review',
      reversible: true,
      requiresApproval: true,
      approvalTier: 'supervisor',
      impactLevel: 'high',
      rollbackProcedure: 'Release transaction freeze and restore deal workflow to prior state',
    },
    {
      id: 'tma-legal-title-hold',
      type: 'legal-title-hold',
      description: 'Initiate legal gate on title — requires counsel sign-off before close',
      reversible: false,
      requiresApproval: true,
      approvalTier: 'executive',
      impactLevel: 'critical',
      rollbackProcedure: 'Legal hold is contractually binding — counsel must issue written release',
    },
  ],
  rollbackContract: {
    tested: true,
    lastTestedAt: now,
    steps: [
      { order: 1, action: 'Release transaction state freeze', target: 'Deal Pipeline', verifyCommand: 'deals check-freeze-status --deal $DEAL_ID', timeout: 20000 },
      { order: 2, action: 'Retract risk memo if erroneous', target: 'Document Store', verifyCommand: 'docs verify-retraction --memo $MEMO_ID', timeout: 15000 },
      { order: 3, action: 'Notify acquisition team of false positive', target: 'Notifications', verifyCommand: 'notify verify-sent --ref $NOTIF_ID', timeout: 10000 },
    ],
    verificationChecks: [
      'Verify deal pipeline restored to pre-freeze state',
      'Confirm risk memo retracted or amended',
      'Verify no legal hold remains in title system',
      'Confirm acquisition team notified of false-positive determination',
    ],
    maxRollbackWindowMs: 72 * 60 * 60 * 1000,
  },
  signatureHash: '',
  tags: ['real-estate', 'distress', 'fraud', 'title-risk', 'acquisition', 'market-anomaly'],
  createdAt: now,
  updatedAt: now,
};
TERRA_MARKET_ANOMALY_INTERCEPTOR.signatureHash = computeHash(TERRA_MARKET_ANOMALY_INTERCEPTOR);

export const TERRA_CPS_PAYLOADS: CpsPayloadDefinition[] = [
  TERRA_MARKET_ANOMALY_INTERCEPTOR,
];
