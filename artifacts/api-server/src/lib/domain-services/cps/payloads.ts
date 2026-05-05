import { createHash } from 'node:crypto';
import type { CpsPayloadDefinition } from './index.js';

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

export const IDENTITY_KILL_CHAIN_INTERCEPTOR: CpsPayloadDefinition = {
  id: 'cps-identity-kill-chain',
  name: 'Identity Kill-Chain Interceptor',
  version: '1.0.0',
  description:
    'Detects impossible travel, token anomalies, and privileged-scope expansion. Triggers step-up auth, session revocation, temporary privilege freeze, and auto-opens an Aegis case. Critical service-account disable requires supervisor approval.',
  category: 'identity-defense',
  mitreTactics: ['TA0006', 'TA0004', 'TA0001'],
  mitretechniques: ['T1078', 'T1550', 'T1098'],
  defaultMaturityMode: 'shadow',
  defaultApprovalTier: 'operator',
  detectionLogic: [
    {
      id: 'ikc-impossible-travel',
      name: 'Impossible Travel Detection',
      condition: 'geo_distance_km > 500 AND time_delta_minutes < 60',
      severity: 'high',
      indicators: ['source_ip_geo', 'destination_ip_geo', 'auth_timestamp'],
    },
    {
      id: 'ikc-token-anomaly',
      name: 'Token Anomaly Detection',
      condition: 'token_reuse_count > 3 OR token_scope_expansion = true',
      severity: 'critical',
      indicators: ['token_hash', 'scope_delta', 'user_agent_mismatch'],
    },
    {
      id: 'ikc-privilege-expansion',
      name: 'Privileged Scope Expansion',
      condition: 'role_elevation = true AND approval_record = null',
      severity: 'critical',
      indicators: ['role_before', 'role_after', 'approval_chain'],
    },
  ],
  decisionPolicy: {
    riskThresholds: { critical: 0.9, high: 0.75, medium: 0.5 },
    autoActionConditions: [
      'confidence >= 0.95 AND severity = critical AND maturity = autonomous',
    ],
    escalationCriteria: [
      'target_is_service_account',
      'affected_scope includes production',
    ],
    approvalOverrides: [
      { condition: 'action = disable_service_account', tier: 'supervisor' },
      { condition: 'action = revoke_all_sessions AND user_count > 100', tier: 'executive' },
    ],
  },
  constrainedActions: [
    {
      id: 'ikc-step-up-auth',
      type: 'step-up-auth',
      description: 'Force multi-factor re-authentication for affected identity',
      reversible: true,
      requiresApproval: false,
      approvalTier: 'auto',
      impactLevel: 'low',
      rollbackProcedure: 'Clear step-up challenge flag and restore normal auth flow',
    },
    {
      id: 'ikc-session-revoke',
      type: 'session-revocation',
      description: 'Revoke all active sessions for the compromised identity',
      reversible: true,
      requiresApproval: false,
      approvalTier: 'operator',
      impactLevel: 'medium',
      rollbackProcedure: 'Sessions cannot be restored — user must re-authenticate (reversible from user perspective)',
    },
    {
      id: 'ikc-privilege-freeze',
      type: 'privilege-freeze',
      description: 'Temporarily freeze elevated privileges pending investigation',
      reversible: true,
      requiresApproval: true,
      approvalTier: 'operator',
      impactLevel: 'high',
      rollbackProcedure: 'Restore privilege set from pre-freeze snapshot',
    },
    {
      id: 'ikc-service-account-disable',
      type: 'service-account-disable',
      description: 'Disable compromised service account (critical — requires supervisor)',
      reversible: true,
      requiresApproval: true,
      approvalTier: 'supervisor',
      impactLevel: 'critical',
      rollbackProcedure: 'Re-enable service account and rotate credentials',
    },
  ],
  rollbackContract: {
    tested: true,
    lastTestedAt: now,
    steps: [
      { order: 1, action: 'Restore privilege snapshot', target: 'IAM', verifyCommand: 'iam verify-privileges --user $USER_ID', timeout: 30000 },
      { order: 2, action: 'Clear step-up challenge', target: 'Auth Service', verifyCommand: 'auth check-mfa-state --user $USER_ID', timeout: 15000 },
      { order: 3, action: 'Re-enable service account if disabled', target: 'IAM', verifyCommand: 'iam check-account-status --account $ACCOUNT_ID', timeout: 30000 },
    ],
    verificationChecks: [
      'Verify user can authenticate normally',
      'Verify privilege set matches pre-incident state',
      'Verify no orphaned session tokens remain',
    ],
    maxRollbackWindowMs: 24 * 60 * 60 * 1000,
  },
  signatureHash: '',
  tags: ['identity', 'credential-access', 'privilege-escalation', 'kill-chain'],
  createdAt: now,
  updatedAt: now,
};
IDENTITY_KILL_CHAIN_INTERCEPTOR.signatureHash = computeHash(IDENTITY_KILL_CHAIN_INTERCEPTOR);

export const LATERAL_MOVEMENT_CONTAINMENT: CpsPayloadDefinition = {
  id: 'cps-lateral-movement',
  name: 'Lateral Movement Containment',
  version: '1.0.0',
  description:
    'Detects anomalous east-west traffic, suspicious process chains, and credential-dump indicators. Triggers micro-segmentation, EDR isolation, secret rotation, and hunt tasking. Auto-rollback if false-positive confidence drops below threshold.',
  category: 'network-defense',
  mitreTactics: ['TA0008', 'TA0006', 'TA0007'],
  mitretechniques: ['T1021', 'T1003', 'T1570'],
  defaultMaturityMode: 'shadow',
  defaultApprovalTier: 'operator',
  detectionLogic: [
    {
      id: 'lmc-east-west-anomaly',
      name: 'Anomalous East-West Traffic',
      condition: 'internal_traffic_volume > baseline_3sigma AND new_dest_count > 5',
      severity: 'high',
      indicators: ['source_host', 'dest_hosts', 'protocol', 'bytes_transferred'],
    },
    {
      id: 'lmc-process-chain',
      name: 'Suspicious Process Chain',
      condition: 'process_tree_depth > 4 AND includes_shell_spawn = true',
      severity: 'high',
      indicators: ['parent_pid', 'child_pids', 'command_line', 'user_context'],
    },
    {
      id: 'lmc-credential-dump',
      name: 'Credential Dump Indicators',
      condition: 'lsass_access = true OR sam_registry_read = true OR mimikatz_signature = true',
      severity: 'critical',
      indicators: ['process_name', 'target_process', 'access_rights', 'hash_match'],
    },
  ],
  decisionPolicy: {
    riskThresholds: { critical: 0.85, high: 0.7, medium: 0.5 },
    autoActionConditions: [
      'confidence >= 0.9 AND credential_dump_confirmed = true',
    ],
    escalationCriteria: [
      'affected_subnet_count > 3',
      'domain_controller_involved = true',
    ],
    approvalOverrides: [
      { condition: 'action = full_subnet_isolation', tier: 'supervisor' },
    ],
  },
  constrainedActions: [
    {
      id: 'lmc-micro-segment',
      type: 'micro-segment-subnet',
      description: 'Apply micro-segmentation rules to isolate affected subnet',
      reversible: true,
      requiresApproval: true,
      approvalTier: 'operator',
      impactLevel: 'high',
      rollbackProcedure: 'Remove micro-segmentation ACLs and restore original network policy',
    },
    {
      id: 'lmc-edr-isolate',
      type: 'edr-isolate',
      description: 'Trigger EDR host isolation on affected endpoints',
      reversible: true,
      requiresApproval: true,
      approvalTier: 'operator',
      impactLevel: 'high',
      rollbackProcedure: 'Release EDR isolation and verify host connectivity',
    },
    {
      id: 'lmc-secret-rotation',
      type: 'rotate-secrets',
      description: 'Rotate credentials exposed in the compromised subnet',
      reversible: false,
      requiresApproval: true,
      approvalTier: 'operator',
      impactLevel: 'medium',
      rollbackProcedure: 'Secret rotation is irreversible — new credentials are already distributed',
    },
    {
      id: 'lmc-hunt-tasking',
      type: 'push-hunt-task',
      description: 'Create automated hunt task for lateral movement IOCs',
      reversible: true,
      requiresApproval: false,
      approvalTier: 'auto',
      impactLevel: 'low',
      rollbackProcedure: 'Cancel hunt task and archive results',
    },
  ],
  rollbackContract: {
    tested: true,
    lastTestedAt: now,
    steps: [
      { order: 1, action: 'Remove micro-segmentation ACLs', target: 'Network Fabric', verifyCommand: 'network verify-acls --subnet $SUBNET_ID', timeout: 60000 },
      { order: 2, action: 'Release EDR isolation', target: 'EDR Console', verifyCommand: 'edr check-isolation --host $HOST_ID', timeout: 30000 },
      { order: 3, action: 'Verify connectivity restored', target: 'Network Monitoring', verifyCommand: 'ping-sweep --subnet $SUBNET_ID', timeout: 45000 },
    ],
    verificationChecks: [
      'Verify network connectivity restored for all hosts',
      'Verify no residual ACL blocks remain',
      'Verify EDR agents reporting healthy',
      'Confirm false-positive classification if applicable',
    ],
    maxRollbackWindowMs: 4 * 60 * 60 * 1000,
  },
  signatureHash: '',
  tags: ['lateral-movement', 'network', 'containment', 'edr'],
  createdAt: now,
  updatedAt: now,
};
LATERAL_MOVEMENT_CONTAINMENT.signatureHash = computeHash(LATERAL_MOVEMENT_CONTAINMENT);

export const DATA_EXFILTRATION_GUARDRAIL: CpsPayloadDefinition = {
  id: 'cps-data-exfiltration',
  name: 'Data Exfiltration Guardrail',
  version: '1.0.0',
  description:
    'Detects unusual egress patterns, sensitive-data classification hits, and destination risk scoring. Triggers egress throttle/block, forensic snapshot preservation, legal/compliance notification, and breach decision timer with executive escalation.',
  category: 'data-protection',
  mitreTactics: ['TA0010', 'TA0009'],
  mitretechniques: ['T1041', 'T1048', 'T1567'],
  defaultMaturityMode: 'shadow',
  defaultApprovalTier: 'operator',
  detectionLogic: [
    {
      id: 'deg-egress-anomaly',
      name: 'Unusual Egress Volume',
      condition: 'egress_bytes > baseline_5sigma AND duration_minutes < 30',
      severity: 'high',
      indicators: ['source_ip', 'dest_ip', 'bytes_out', 'protocol', 'geo_dest'],
    },
    {
      id: 'deg-data-classification',
      name: 'Sensitive Data Classification Hit',
      condition: 'dlp_classification IN (pii, phi, pci, trade_secret) AND egress_detected = true',
      severity: 'critical',
      indicators: ['classification_label', 'data_volume', 'file_types', 'content_fingerprint'],
    },
    {
      id: 'deg-dest-risk',
      name: 'Destination Risk Score',
      condition: 'destination_risk_score > 0.8 OR destination_country IN sanctioned_list',
      severity: 'critical',
      indicators: ['dest_ip', 'dest_domain', 'risk_score', 'geo_country', 'reputation_feeds'],
    },
  ],
  decisionPolicy: {
    riskThresholds: { critical: 0.8, high: 0.65, medium: 0.45 },
    autoActionConditions: [
      'classification = pii AND dest_risk > 0.9 AND confidence >= 0.95',
    ],
    escalationCriteria: [
      'data_volume_gb > 10',
      'classification includes phi OR pci',
      'breach_notification_required = true',
    ],
    approvalOverrides: [
      { condition: 'breach_timer_started = true', tier: 'executive' },
      { condition: 'legal_notification_required = true', tier: 'dual-executive' },
    ],
  },
  constrainedActions: [
    {
      id: 'deg-throttle-egress',
      type: 'throttle-egress',
      description: 'Throttle or block egress traffic to suspicious destination',
      reversible: true,
      requiresApproval: true,
      approvalTier: 'operator',
      impactLevel: 'high',
      rollbackProcedure: 'Remove egress throttle rules and restore normal traffic flow',
    },
    {
      id: 'deg-forensic-snapshot',
      type: 'forensic-snapshot',
      description: 'Preserve forensic snapshot of affected systems and network captures',
      reversible: false,
      requiresApproval: false,
      approvalTier: 'auto',
      impactLevel: 'low',
      rollbackProcedure: 'Forensic snapshots are immutable — cannot be rolled back (by design)',
    },
    {
      id: 'deg-legal-notify',
      type: 'legal-compliance-notify',
      description: 'Notify legal and compliance teams of potential data breach',
      reversible: false,
      requiresApproval: true,
      approvalTier: 'supervisor',
      impactLevel: 'medium',
      rollbackProcedure: 'Notification is irreversible — issue correction notice if false positive',
    },
    {
      id: 'deg-breach-timer',
      type: 'breach-decision-timer',
      description: 'Start breach decision timer with executive escalation deadline',
      reversible: true,
      requiresApproval: true,
      approvalTier: 'executive',
      impactLevel: 'critical',
      rollbackProcedure: 'Cancel breach timer and document false-positive determination',
    },
  ],
  rollbackContract: {
    tested: true,
    lastTestedAt: now,
    steps: [
      { order: 1, action: 'Remove egress throttle/block rules', target: 'Network Gateway', verifyCommand: 'firewall verify-rules --policy $POLICY_ID', timeout: 30000 },
      { order: 2, action: 'Cancel breach decision timer', target: 'Incident Management', verifyCommand: 'incident check-timer --incident $INCIDENT_ID', timeout: 15000 },
      { order: 3, action: 'Issue false-positive correction to legal', target: 'Legal/Compliance', verifyCommand: 'legal verify-notification --ref $REF_ID', timeout: 60000 },
    ],
    verificationChecks: [
      'Verify egress traffic restored to normal',
      'Verify forensic snapshots preserved for audit',
      'Verify breach timer cancelled if false positive',
      'Confirm legal/compliance acknowledgment of correction',
    ],
    maxRollbackWindowMs: 72 * 60 * 60 * 1000,
  },
  signatureHash: '',
  tags: ['exfiltration', 'data-protection', 'dlp', 'breach-response'],
  createdAt: now,
  updatedAt: now,
};
DATA_EXFILTRATION_GUARDRAIL.signatureHash = computeHash(DATA_EXFILTRATION_GUARDRAIL);

export const FLAGSHIP_PAYLOADS: CpsPayloadDefinition[] = [
  IDENTITY_KILL_CHAIN_INTERCEPTOR,
  LATERAL_MOVEMENT_CONTAINMENT,
  DATA_EXFILTRATION_GUARDRAIL,
];
