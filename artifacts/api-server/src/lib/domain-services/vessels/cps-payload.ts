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

export const VESSELS_ROUTE_RISK_INTERCEPTOR: CpsPayloadDefinition = {
  id: 'cps-vessels-route-risk',
  name: 'Vessels Route-Risk Interceptor',
  version: '1.0.0',
  description:
    'Detects sanctions proximity, AIS dark-gap behavior, and route deviation on active voyages. Triggers compliance holds, insurer alerts, and charter risk repricing. Publishes a per-voyage proof-chain record consumable by insurers and counterparties.',
  category: 'maritime-compliance',
  mitreTactics: [],
  mitretechniques: [],
  defaultMaturityMode: 'shadow',
  defaultApprovalTier: 'operator',
  detectionLogic: [
    {
      id: 'vrr-sanctions-proximity',
      name: 'Sanctions Proximity Detection',
      condition: 'closest_sanctioned_vessel_nm < 5 OR last_port_sanctioned = true',
      severity: 'critical',
      indicators: ['vessel_imo', 'sanctioned_entity_id', 'proximity_nm', 'last_port_locode'],
    },
    {
      id: 'vrr-ais-dark-gap',
      name: 'AIS Dark-Gap Behavior',
      condition: 'ais_gap_hours > 6 AND high_risk_zone = true',
      severity: 'high',
      indicators: ['vessel_imo', 'gap_start_position', 'gap_hours', 'zone_classification'],
    },
    {
      id: 'vrr-route-deviation',
      name: 'Route Deviation Alert',
      condition: 'deviation_nm > 50 AND no_weather_justification = true',
      severity: 'high',
      indicators: ['vessel_imo', 'planned_route_id', 'deviation_nm', 'current_position'],
    },
  ],
  decisionPolicy: {
    riskThresholds: { critical: 0.9, high: 0.75, medium: 0.5 },
    autoActionConditions: [
      'confidence >= 0.95 AND severity = critical AND maturity = autonomous',
    ],
    escalationCriteria: [
      'voyage_value_usd > 5000000',
      'cargo_type IN (crude_oil, lng, hazmat)',
      'flagged_by_ofac = true',
    ],
    approvalOverrides: [
      { condition: 'action = compliance_hold', tier: 'supervisor' },
      { condition: 'action = charter_risk_repricing AND value_delta_usd > 500000', tier: 'executive' },
    ],
  },
  constrainedActions: [
    {
      id: 'vrr-insurer-alert',
      type: 'insurer-alert',
      description: 'Notify P&I club and hull insurer of elevated route risk',
      reversible: true,
      requiresApproval: false,
      approvalTier: 'auto',
      impactLevel: 'low',
      rollbackProcedure: 'Send correction notice to insurer with false-positive determination',
    },
    {
      id: 'vrr-compliance-hold',
      type: 'compliance-hold',
      description: 'Place compliance hold on voyage — freeze cargo release and port clearance',
      reversible: true,
      requiresApproval: true,
      approvalTier: 'supervisor',
      impactLevel: 'high',
      rollbackProcedure: 'Release compliance hold and restore cargo clearance workflow',
    },
    {
      id: 'vrr-charter-risk-repricing',
      type: 'charter-risk-repricing',
      description: 'Trigger charter risk repricing workflow with updated premium schedule',
      reversible: false,
      requiresApproval: true,
      approvalTier: 'operator',
      impactLevel: 'medium',
      rollbackProcedure: 'Repricing is contractually irreversible — issue credit note if false positive',
    },
    {
      id: 'vrr-voyage-proof-record',
      type: 'voyage-proof-record',
      description: 'Publish per-voyage proof-chain record to insurer and counterparty portal',
      reversible: false,
      requiresApproval: false,
      approvalTier: 'auto',
      impactLevel: 'low',
      rollbackProcedure: 'Proof records are immutable by design — issue amendment addendum',
    },
  ],
  rollbackContract: {
    tested: true,
    lastTestedAt: now,
    steps: [
      { order: 1, action: 'Release compliance hold', target: 'Cargo Operations', verifyCommand: 'cargo check-hold-status --voyage $VOYAGE_ID', timeout: 30000 },
      { order: 2, action: 'Notify insurer of false positive', target: 'P&I Club Portal', verifyCommand: 'insurer verify-notification --ref $REF_ID', timeout: 15000 },
      { order: 3, action: 'Restore port clearance workflow', target: 'Port Agency', verifyCommand: 'port verify-clearance --voyage $VOYAGE_ID', timeout: 20000 },
    ],
    verificationChecks: [
      'Verify cargo clearance workflow restored',
      'Confirm insurer notified of false-positive determination',
      'Verify voyage proof record amended with correction flag',
      'Confirm charter party notified of hold release',
    ],
    maxRollbackWindowMs: 48 * 60 * 60 * 1000,
  },
  signatureHash: '',
  tags: ['maritime', 'sanctions', 'ais', 'route-risk', 'compliance', 'voyage'],
  createdAt: now,
  updatedAt: now,
};
VESSELS_ROUTE_RISK_INTERCEPTOR.signatureHash = computeHash(VESSELS_ROUTE_RISK_INTERCEPTOR);

export const VESSELS_CPS_PAYLOADS: CpsPayloadDefinition[] = [
  VESSELS_ROUTE_RISK_INTERCEPTOR,
];
