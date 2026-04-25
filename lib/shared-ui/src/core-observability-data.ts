export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';
export type EntityType =
  | 'workflow'
  | 'approval'
  | 'task'
  | 'opportunity'
  | 'recommendation'
  | 'execution_run'
  | 'exception'
  | 'owner'
  | 'signal';
export type EntityState =
  | 'healthy'
  | 'degraded'
  | 'blocked'
  | 'pending_approval'
  | 'escalated'
  | 'executing'
  | 'retried'
  | 'completed'
  | 'failed'
  | 'recovered';
export type CommandPhase = 'DETECT' | 'INTERPRET' | 'DECIDE' | 'EXECUTE' | 'VERIFY';
export type ProductId = 'beacon' | 'lyte' | 'alloy' | 'alloyscape';

export interface ObsEvent {
  event_id: string;
  event_type: string;
  source_product: ProductId;
  entity_type: EntityType;
  entity_id: string;
  entity_name: string;
  actor_type: 'system' | 'human' | 'ai';
  actor_name: string;
  severity: Severity;
  confidence: number;
  status: EntityState;
  correlation_id: string;
  workflow_stage: CommandPhase;
  business_value_impact: number;
  timestamp: string;
  metadata: Record<string, unknown>;
}

export interface WorkflowEntity {
  id: string;
  name: string;
  owner: string;
  team: string;
  status: EntityState;
  latency_ms: number;
  sla_ms: number;
  blocked_step?: string;
  value_at_risk: number;
  last_updated: string;
  correlation_id: string;
}

export interface ApprovalEntity {
  id: string;
  title: string;
  workflow_id: string;
  workflow_name: string;
  owner: string;
  team: string;
  status: 'pending' | 'approved' | 'rejected' | 'escalated';
  age_hours: number;
  impact_estimate: number;
  escalation_recommended: boolean;
  correlation_id: string;
  created_at: string;
}

export interface PredictionEntity {
  id: string;
  title: string;
  prediction_type: 'bottleneck' | 'delay' | 'escalation' | 'recovery';
  confidence: number;
  probability: number;
  time_horizon_hours: number;
  impact_estimate: number;
  driving_signals: string[];
  linked_beacon_events: string[];
  linked_lyte_states: string[];
  rationale: string;
  recommended_action: string;
  correlation_id: string;
  created_at: string;
}

export interface ExecutionRun {
  id: string;
  workflow_id: string;
  workflow_name: string;
  status: 'running' | 'completed' | 'failed' | 'retried' | 'aborted';
  started_at: string;
  ended_at?: string;
  duration_ms?: number;
  steps_total: number;
  steps_completed: number;
  steps_failed: number;
  triggered_by: string;
  trigger_type: 'scheduled' | 'manual' | 'event' | 'api';
  correlation_id: string;
  exception_message?: string;
  linked_lyte_action?: string;
}

export interface ConnectorEntity {
  id: string;
  name: string;
  system: string;
  status: 'connected' | 'degraded' | 'disconnected' | 'auth_failed';
  last_sync: string;
  sync_count_24h: number;
  error_count_24h: number;
  data_volume_mb: number;
}

export const GOLDEN_FLOW_CORRELATION_ID = 'gf-2026-q1-001';

export const WORKFLOWS: WorkflowEntity[] = [
  {
    id: 'wf-001',
    name: 'Enterprise Contract Approval — Northgate Systems',
    owner: 'Jordan Alvarez',
    team: 'Revenue Operations',
    status: 'blocked',
    latency_ms: 172800000,
    sla_ms: 86400000,
    blocked_step: 'Legal Review — Awaiting VP Signature',
    value_at_risk: 840000,
    last_updated: new Date(Date.now() - 1000 * 60 * 47).toISOString(),
    correlation_id: GOLDEN_FLOW_CORRELATION_ID,
  },
  {
    id: 'wf-002',
    name: 'Quarterly Budget Reconciliation — Q1 2026',
    owner: 'Priya Mehta',
    team: 'Finance',
    status: 'degraded',
    latency_ms: 259200000,
    sla_ms: 172800000,
    blocked_step: 'Cross-department Sign-off',
    value_at_risk: 1200000,
    last_updated: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    correlation_id: 'corr-q1-budget',
  },
  {
    id: 'wf-003',
    name: 'New Vendor Onboarding — Apex Logistics',
    owner: '',
    team: 'Procurement',
    status: 'blocked',
    latency_ms: 518400000,
    sla_ms: 259200000,
    blocked_step: 'Compliance Verification',
    value_at_risk: 320000,
    last_updated: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
    correlation_id: 'corr-vendor-apex',
  },
  {
    id: 'wf-004',
    name: 'Customer Churn Intervention — TechCorp Inc',
    owner: 'Marcus Webb',
    team: 'Customer Success',
    status: 'escalated',
    latency_ms: 86400000,
    sla_ms: 43200000,
    blocked_step: 'Executive Outreach Pending',
    value_at_risk: 480000,
    last_updated: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    correlation_id: 'corr-churn-techcorp',
  },
  {
    id: 'wf-005',
    name: 'Product Launch Readiness — Platform v4.0',
    owner: 'Elena Santos',
    team: 'Product',
    status: 'healthy',
    latency_ms: 43200000,
    sla_ms: 86400000,
    value_at_risk: 0,
    last_updated: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    correlation_id: 'corr-launch-v4',
  },
  {
    id: 'wf-006',
    name: 'Regulatory Filing — SEC Q1 Submission',
    owner: 'Thomas Nguyen',
    team: 'Legal',
    status: 'pending_approval',
    latency_ms: 129600000,
    sla_ms: 86400000,
    blocked_step: 'CFO Final Review',
    value_at_risk: 2100000,
    last_updated: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    correlation_id: 'corr-sec-filing',
  },
];

export const APPROVALS: ApprovalEntity[] = [
  {
    id: 'apr-001',
    title: 'Contract Execution — Northgate Systems $840K ARR',
    workflow_id: 'wf-001',
    workflow_name: 'Enterprise Contract Approval — Northgate Systems',
    owner: 'Jordan Alvarez',
    team: 'Revenue Operations',
    status: 'escalated',
    age_hours: 48,
    impact_estimate: 840000,
    escalation_recommended: true,
    correlation_id: GOLDEN_FLOW_CORRELATION_ID,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
  },
  {
    id: 'apr-002',
    title: 'Capital Expenditure Authorization — Infrastructure Upgrade',
    workflow_id: 'wf-002',
    workflow_name: 'Quarterly Budget Reconciliation — Q1 2026',
    owner: 'Priya Mehta',
    team: 'Finance',
    status: 'pending',
    age_hours: 72,
    impact_estimate: 450000,
    escalation_recommended: true,
    correlation_id: 'corr-q1-budget',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
  },
  {
    id: 'apr-003',
    title: 'Vendor Risk Acceptance — Apex Logistics',
    workflow_id: 'wf-003',
    workflow_name: 'New Vendor Onboarding — Apex Logistics',
    owner: '',
    team: 'Procurement',
    status: 'pending',
    age_hours: 144,
    impact_estimate: 320000,
    escalation_recommended: true,
    correlation_id: 'corr-vendor-apex',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 144).toISOString(),
  },
  {
    id: 'apr-004',
    title: 'Customer Retention Offer — TechCorp Inc (30% Discount)',
    workflow_id: 'wf-004',
    workflow_name: 'Customer Churn Intervention — TechCorp Inc',
    owner: 'Marcus Webb',
    team: 'Customer Success',
    status: 'escalated',
    age_hours: 24,
    impact_estimate: 480000,
    escalation_recommended: false,
    correlation_id: 'corr-churn-techcorp',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
  {
    id: 'apr-005',
    title: 'SEC Filing Q1 — CFO Sign-off Required',
    workflow_id: 'wf-006',
    workflow_name: 'Regulatory Filing — SEC Q1 Submission',
    owner: 'Thomas Nguyen',
    team: 'Legal',
    status: 'pending',
    age_hours: 36,
    impact_estimate: 2100000,
    escalation_recommended: false,
    correlation_id: 'corr-sec-filing',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(),
  },
];

export const PREDICTIONS: PredictionEntity[] = [
  {
    id: 'pred-001',
    title: 'Contract approval delay will cause Q1 revenue miss — 73% probability',
    prediction_type: 'delay',
    confidence: 73,
    probability: 0.73,
    time_horizon_hours: 48,
    impact_estimate: 840000,
    driving_signals: [
      '48h approval aging',
      'Legal team capacity at 94%',
      'Historical Q1 close patterns',
    ],
    linked_beacon_events: ['evt-001', 'evt-002'],
    linked_lyte_states: ['apr-001', 'wf-001'],
    rationale:
      'The Northgate contract has been in legal review for 48 hours against a 24-hour SLA. Legal capacity is at 94%. Q1 close is in 6 days. Historical data shows 73% of approvals aging past 48h miss the quarter.',
    recommended_action:
      'Escalate immediately to VP Legal with executive sponsor engagement. Consider parallel path: pre-execute pending final signature with risk acceptance from CFO.',
    correlation_id: GOLDEN_FLOW_CORRELATION_ID,
    created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: 'pred-002',
    title: 'Vendor onboarding bottleneck will propagate to procurement pipeline — 81% probability',
    prediction_type: 'bottleneck',
    confidence: 81,
    probability: 0.81,
    time_horizon_hours: 72,
    impact_estimate: 780000,
    driving_signals: [
      'Unowned workflow step',
      'Compliance queue depth +40%',
      '6 similar cases blocked',
    ],
    linked_beacon_events: ['evt-003'],
    linked_lyte_states: ['wf-003', 'apr-003'],
    rationale:
      'Apex Logistics onboarding has no assigned owner for the compliance step. Compliance queue depth increased 40% this week. 6 other vendor onboardings are behind this one.',
    recommended_action:
      'Assign dedicated compliance resource immediately. Escalate to CPO. Consider fast-track approval for low-risk vendors.',
    correlation_id: 'corr-vendor-apex',
    created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
  },
  {
    id: 'pred-003',
    title: 'TechCorp churn probability increases to 91% if no executive contact within 12h',
    prediction_type: 'escalation',
    confidence: 88,
    probability: 0.88,
    time_horizon_hours: 12,
    impact_estimate: 480000,
    driving_signals: [
      'NPS drop -42 pts',
      '3 support escalations in 7 days',
      'Competitive renewal offer received',
    ],
    linked_beacon_events: ['evt-004'],
    linked_lyte_states: ['wf-004', 'apr-004'],
    rationale:
      "TechCorp's product usage dropped 35% last month. NPS score dropped 42 points. They received a competitive renewal offer at 20% below current contract. Without executive contact, historical models predict 88% churn probability.",
    recommended_action:
      'Immediate CEO-to-CEO outreach. Approve retention offer at 30% discount — NPV positive vs. churn cost. Assign dedicated CSM upgrade.',
    correlation_id: 'corr-churn-techcorp',
    created_at: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
  },
  {
    id: 'pred-004',
    title: 'Counsel reroute will recover 6.2h cycle time on contract workflow',
    prediction_type: 'recovery',
    confidence: 85,
    probability: 0.85,
    time_horizon_hours: 4,
    impact_estimate: 840000,
    driving_signals: [
      'Secondary approver available',
      'Parallel signature path validated',
      'Similar reroute success rate 91%',
    ],
    linked_beacon_events: ['evt-001'],
    linked_lyte_states: ['apr-001'],
    rationale:
      'If the Northgate contract is rerouted to the secondary approver (CFO backup), the parallel path reduces approval time by 6.2 hours. Historical reroute success rate for similar contracts is 91%.',
    recommended_action:
      'Execute reroute in Counsel to CFO backup approver. Notify original approver. Set 2h SLA on new path.',
    correlation_id: GOLDEN_FLOW_CORRELATION_ID,
    created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
  },
];

export const EXECUTION_RUNS: ExecutionRun[] = [
  {
    id: 'run-001',
    workflow_id: 'wf-001',
    workflow_name: 'Enterprise Contract Approval — Northgate Systems',
    status: 'failed',
    started_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    ended_at: new Date(Date.now() - 1000 * 60 * 60 * 47).toISOString(),
    duration_ms: 3600000,
    steps_total: 8,
    steps_completed: 3,
    steps_failed: 1,
    triggered_by: 'CRM webhook — Salesforce Opportunity Closed Won',
    trigger_type: 'event',
    correlation_id: GOLDEN_FLOW_CORRELATION_ID,
    exception_message:
      'Step 4 (Legal Review) — No approver assigned to secondary queue. Timeout after 30m.',
    linked_lyte_action: 'apr-001',
  },
  {
    id: 'run-002',
    workflow_id: 'wf-001',
    workflow_name: 'Enterprise Contract Approval — Northgate Systems',
    status: 'retried',
    started_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    steps_total: 8,
    steps_completed: 3,
    steps_failed: 0,
    triggered_by: 'Manual override — Jordan Alvarez via Lyte Command',
    trigger_type: 'manual',
    correlation_id: GOLDEN_FLOW_CORRELATION_ID,
    linked_lyte_action: 'apr-001',
  },
  {
    id: 'run-003',
    workflow_id: 'wf-004',
    workflow_name: 'Customer Churn Intervention — TechCorp Inc',
    status: 'running',
    started_at: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    steps_total: 6,
    steps_completed: 2,
    steps_failed: 0,
    triggered_by: 'Lyte drift detection — NPS anomaly',
    trigger_type: 'event',
    correlation_id: 'corr-churn-techcorp',
  },
  {
    id: 'run-004',
    workflow_id: 'wf-005',
    workflow_name: 'Product Launch Readiness — Platform v4.0',
    status: 'completed',
    started_at: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    ended_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    duration_ms: 9900000,
    steps_total: 12,
    steps_completed: 12,
    steps_failed: 0,
    triggered_by: 'Scheduled — Weekly readiness check',
    trigger_type: 'scheduled',
    correlation_id: 'corr-launch-v4',
  },
  {
    id: 'run-005',
    workflow_id: 'wf-003',
    workflow_name: 'New Vendor Onboarding — Apex Logistics',
    status: 'failed',
    started_at: new Date(Date.now() - 1000 * 60 * 60 * 144).toISOString(),
    ended_at: new Date(Date.now() - 1000 * 60 * 60 * 143).toISOString(),
    duration_ms: 3600000,
    steps_total: 10,
    steps_completed: 4,
    steps_failed: 1,
    triggered_by: 'Procurement system — PO approved',
    trigger_type: 'event',
    correlation_id: 'corr-vendor-apex',
    exception_message: 'Step 5 (Compliance Verification) — No owner assigned. Routing failed.',
    linked_lyte_action: 'apr-003',
  },
];

export const CONNECTORS: ConnectorEntity[] = [
  {
    id: 'conn-sf',
    name: 'Salesforce CRM',
    system: 'Salesforce',
    status: 'connected',
    last_sync: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    sync_count_24h: 1847,
    error_count_24h: 3,
    data_volume_mb: 42.3,
  },
  {
    id: 'conn-jira',
    name: 'Jira Project Management',
    system: 'Atlassian',
    status: 'connected',
    last_sync: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    sync_count_24h: 924,
    error_count_24h: 0,
    data_volume_mb: 18.7,
  },
  {
    id: 'conn-slack',
    name: 'Slack Notifications',
    system: 'Slack',
    status: 'connected',
    last_sync: new Date(Date.now() - 1000 * 60 * 1).toISOString(),
    sync_count_24h: 3421,
    error_count_24h: 12,
    data_volume_mb: 8.1,
  },
  {
    id: 'conn-sage',
    name: 'Sage ERP — Finance',
    system: 'Sage',
    status: 'degraded',
    last_sync: new Date(Date.now() - 1000 * 60 * 47).toISOString(),
    sync_count_24h: 234,
    error_count_24h: 47,
    data_volume_mb: 91.4,
  },
  {
    id: 'conn-docusign',
    name: 'DocuSign eSignature',
    system: 'DocuSign',
    status: 'connected',
    last_sync: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
    sync_count_24h: 127,
    error_count_24h: 0,
    data_volume_mb: 3.2,
  },
  {
    id: 'conn-gh',
    name: 'GitHub — Dev Signals',
    system: 'GitHub',
    status: 'connected',
    last_sync: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
    sync_count_24h: 2810,
    error_count_24h: 1,
    data_volume_mb: 24.6,
  },
  {
    id: 'conn-stripe',
    name: 'Stripe — Revenue Events',
    system: 'Stripe',
    status: 'auth_failed',
    last_sync: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    sync_count_24h: 0,
    error_count_24h: 234,
    data_volume_mb: 0,
  },
  {
    id: 'conn-zendesk',
    name: 'Zendesk Support',
    system: 'Zendesk',
    status: 'connected',
    last_sync: new Date(Date.now() - 1000 * 60 * 6).toISOString(),
    sync_count_24h: 892,
    error_count_24h: 4,
    data_volume_mb: 15.9,
  },
];

export const EVENTS: ObsEvent[] = [
  {
    event_id: 'evt-001',
    event_type: 'approval_sla_breach',
    source_product: 'beacon',
    entity_type: 'approval',
    entity_id: 'apr-001',
    entity_name: 'Contract Execution — Northgate Systems',
    actor_type: 'system',
    actor_name: 'Lyte Drift Detection',
    severity: 'critical',
    confidence: 99,
    status: 'escalated',
    correlation_id: GOLDEN_FLOW_CORRELATION_ID,
    workflow_stage: 'DETECT',
    business_value_impact: 840000,
    timestamp: new Date(Date.now() - 1000 * 60 * 47).toISOString(),
    metadata: { sla_breach_hours: 24, age_hours: 48 },
  },
  {
    event_id: 'evt-002',
    event_type: 'workflow_blocked',
    source_product: 'beacon',
    entity_type: 'workflow',
    entity_id: 'wf-001',
    entity_name: 'Enterprise Contract Approval — Northgate Systems',
    actor_type: 'system',
    actor_name: 'Lyte Workflow Monitor',
    severity: 'critical',
    confidence: 100,
    status: 'blocked',
    correlation_id: GOLDEN_FLOW_CORRELATION_ID,
    workflow_stage: 'DETECT',
    business_value_impact: 840000,
    timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    metadata: { blocked_step: 'Legal Review', blocked_hours: 48 },
  },
  {
    event_id: 'evt-003',
    event_type: 'ownership_gap',
    source_product: 'beacon',
    entity_type: 'workflow',
    entity_id: 'wf-003',
    entity_name: 'New Vendor Onboarding — Apex Logistics',
    actor_type: 'system',
    actor_name: 'Lyte Ownership Monitor',
    severity: 'high',
    confidence: 100,
    status: 'blocked',
    correlation_id: 'corr-vendor-apex',
    workflow_stage: 'DETECT',
    business_value_impact: 320000,
    timestamp: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
    metadata: { missing_owner: true, step: 'Compliance Verification' },
  },
  {
    event_id: 'evt-004',
    event_type: 'drift_detected',
    source_product: 'beacon',
    entity_type: 'signal',
    entity_id: 'sig-001',
    entity_name: 'TechCorp NPS Anomaly',
    actor_type: 'system',
    actor_name: 'Lyte Drift Detection',
    severity: 'high',
    confidence: 92,
    status: 'escalated',
    correlation_id: 'corr-churn-techcorp',
    workflow_stage: 'DETECT',
    business_value_impact: 480000,
    timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    metadata: { nps_drop: -42, usage_drop_pct: 35, competitive_offer: true },
  },
  {
    event_id: 'evt-005',
    event_type: 'intervention_executed',
    source_product: 'alloyscape',
    entity_type: 'execution_run',
    entity_id: 'run-002',
    entity_name: 'Contract Workflow Reroute',
    actor_type: 'human',
    actor_name: 'Jordan Alvarez',
    severity: 'medium',
    confidence: 91,
    status: 'executing',
    correlation_id: GOLDEN_FLOW_CORRELATION_ID,
    workflow_stage: 'EXECUTE',
    business_value_impact: 840000,
    timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    metadata: { action: 'reroute', new_approver: 'CFO Backup', expected_recovery_hours: 6.2 },
  },
  {
    event_id: 'evt-006',
    event_type: 'value_recovered',
    source_product: 'beacon',
    entity_type: 'workflow',
    entity_id: 'wf-001',
    entity_name: 'Enterprise Contract Approval — Northgate Systems',
    actor_type: 'system',
    actor_name: 'Lyte Verification',
    severity: 'info',
    confidence: 87,
    status: 'recovered',
    correlation_id: GOLDEN_FLOW_CORRELATION_ID,
    workflow_stage: 'VERIFY',
    business_value_impact: 840000,
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    metadata: { recovery_action: 'reroute', cycle_time_saved_hours: 6.2 },
  },
];

export interface WorkflowStep {
  name: string;
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  assignee?: string;
}

export interface WorkflowUI extends WorkflowEntity {
  state: EntityState;
  type: string;
  sla_deadline: string;
  block_reason?: string;
  steps: WorkflowStep[];
}

export const WORKFLOWS_UI: WorkflowUI[] = WORKFLOWS.map((w) => {
  const stepMap: Record<string, WorkflowStep[]> = {
    'wf-001': [
      { name: 'CRM Trigger', status: 'completed', assignee: 'System' },
      { name: 'Contract Gen', status: 'completed', assignee: 'Counsel' },
      { name: 'Internal Review', status: 'completed', assignee: 'Jordan Alvarez' },
      { name: 'Legal Review', status: 'blocked' },
      { name: 'DocuSign', status: 'pending' },
      { name: 'Billing Activate', status: 'pending' },
    ],
    'wf-002': [
      { name: 'Data Collection', status: 'completed', assignee: 'Finance Bot' },
      { name: 'Dept Reviews', status: 'in_progress', assignee: 'Priya Mehta' },
      { name: 'Cross-dept Sign-off', status: 'blocked' },
      { name: 'CFO Approval', status: 'pending' },
    ],
    'wf-003': [
      { name: 'PO Created', status: 'completed' },
      { name: 'Vendor Profile', status: 'completed' },
      { name: 'Risk Assessment', status: 'completed' },
      { name: 'Compliance Verify', status: 'blocked' },
      { name: 'Legal Review', status: 'pending' },
      { name: 'Activation', status: 'pending' },
    ],
    'wf-004': [
      { name: 'NPS Alert', status: 'completed', assignee: 'Terra' },
      { name: 'CS Assignment', status: 'completed', assignee: 'Marcus Webb' },
      { name: 'Exec Outreach', status: 'blocked' },
      { name: 'Offer Approval', status: 'pending' },
    ],
    'wf-005': [
      { name: 'Feature Freeze', status: 'completed' },
      { name: 'QA Sign-off', status: 'completed' },
      { name: 'Readiness Check', status: 'completed', assignee: 'Elena Santos' },
      { name: 'Launch', status: 'in_progress' },
    ],
    'wf-006': [
      { name: 'Data Pull', status: 'completed' },
      { name: 'Audit Review', status: 'completed' },
      { name: 'CFO Sign-off', status: 'in_progress', assignee: 'Thomas Nguyen' },
      { name: 'SEC Submission', status: 'pending' },
    ],
  };

  const typeMap: Record<string, string> = {
    'wf-001': 'contract_approval',
    'wf-002': 'financial_reconciliation',
    'wf-003': 'vendor_onboarding',
    'wf-004': 'customer_success',
    'wf-005': 'product_launch',
    'wf-006': 'regulatory_filing',
  };

  const _stateMap: Record<EntityState, EntityState> = {
    healthy: 'healthy',
    degraded: 'degraded',
    blocked: 'blocked',
    pending_approval: 'pending_approval',
    escalated: 'escalated',
    executing: 'executing',
    retried: 'retried',
    completed: 'completed',
    failed: 'failed',
    recovered: 'recovered',
  };

  const slaMap: Record<string, string> = {
    'wf-001': '2026-03-31',
    'wf-002': '2026-03-31',
    'wf-003': '2026-04-02',
    'wf-004': '2026-03-31',
    'wf-005': '2026-04-07',
    'wf-006': '2026-03-31',
  };

  return {
    ...w,
    state: w.status,
    type: typeMap[w.id] ?? 'workflow',
    sla_deadline: slaMap[w.id] ?? '2026-04-07',
    ...(w.blocked_step !== undefined ? { block_reason: w.blocked_step } : {}),
    steps: stepMap[w.id] ?? [],
  };
});

export interface ConnectorUI extends ConnectorEntity {
  health: 'healthy' | 'degraded' | 'error';
  requests_today: number;
  error_rate: number;
  latency_ms: number;
  type: string;
  category: string;
  last_error?: string;
}

export const CONNECTORS_UI: ConnectorUI[] = CONNECTORS.map((c) => ({
  ...c,
  health: c.status === 'connected' ? 'healthy' : c.status === 'degraded' ? 'degraded' : 'error',
  requests_today: c.sync_count_24h,
  error_rate:
    c.sync_count_24h > 0 ? Math.round((c.error_count_24h / c.sync_count_24h) * 100 * 10) / 10 : 100,
  latency_ms:
    {
      'conn-sf': 210,
      'conn-jira': 180,
      'conn-slack': 95,
      'conn-sage': 840,
      'conn-docusign': 320,
      'conn-gh': 145,
      'conn-stripe': 0,
      'conn-zendesk': 195,
    }[c.id] ?? 200,
  type: 'REST API',
  category:
    {
      'conn-sf': 'CRM',
      'conn-jira': 'PM',
      'conn-slack': 'Messaging',
      'conn-sage': 'ERP',
      'conn-docusign': 'eSignature',
      'conn-gh': 'DevOps',
      'conn-stripe': 'Payments',
      'conn-zendesk': 'Support',
    }[c.id] ?? 'Integration',
  ...(c.status === 'auth_failed'
    ? { last_error: 'Auth token expired — API key needs rotation' }
    : c.status === 'degraded'
      ? { last_error: 'High error rate detected — partial sync only' }
      : {}),
  last_sync: new Date(c.last_sync).toLocaleString(),
}));

export interface KpiMetric {
  id: string;
  label: string;
  value: number | string;
  unit?: string;
  trend: number;
  trend_direction: 'up' | 'down';
  status: 'healthy' | 'warning' | 'at_risk';
}

export const KPI_METRICS: KpiMetric[] = [
  {
    id: 'arr',
    label: 'Annual Recurring Revenue',
    value: 10200000,
    unit: '$',
    trend: 8.2,
    trend_direction: 'up',
    status: 'healthy',
  },
  {
    id: 'churn',
    label: 'Churn Rate',
    value: '2.1',
    unit: '%',
    trend: -0.4,
    trend_direction: 'up',
    status: 'warning',
  },
  {
    id: 'win_rate',
    label: 'Win Rate',
    value: '74',
    unit: '%',
    trend: 3.1,
    trend_direction: 'up',
    status: 'healthy',
  },
  {
    id: 'approval_sla',
    label: 'Approval SLA Compliance',
    value: '44',
    unit: '%',
    trend: -31,
    trend_direction: 'down',
    status: 'at_risk',
  },
  {
    id: 'workflow_health',
    label: 'Workflow Health Score',
    value: '61',
    unit: '%',
    trend: -14,
    trend_direction: 'down',
    status: 'warning',
  },
  {
    id: 'time_to_action',
    label: 'Time to Action',
    value: '18.7',
    unit: 'min',
    trend: -8,
    trend_direction: 'down',
    status: 'healthy',
  },
];

export const KPI_FRAMEWORK = {
  global: {
    time_to_insight: {
      label: 'Time to Insight',
      value: '4.2m',
      trend: -12,
      unit: 'min',
      description: 'Avg time from event to surfaced insight',
    },
    time_to_action: {
      label: 'Time to Action',
      value: '18.7m',
      trend: -8,
      unit: 'min',
      description: 'Avg time from insight to intervention',
    },
    value_at_risk: {
      label: 'Value at Risk',
      value: '$4.02M',
      trend: 23,
      unit: 'USD',
      description: 'Total business value in at-risk workflows',
    },
    value_recovered: {
      label: 'Value Recovered',
      value: '$840K',
      trend: 100,
      unit: 'USD',
      description: 'Value recovered via interventions (last 30d)',
    },
    workflow_health_score: {
      label: 'Workflow Health',
      value: '61%',
      trend: -14,
      unit: '%',
      description: '% of workflows in healthy state',
    },
    approval_sla_compliance: {
      label: 'Approval SLA',
      value: '44%',
      trend: -31,
      unit: '%',
      description: '% of approvals meeting SLA targets',
    },
  },
  beacon: {
    drift_events_24h: { label: 'Drift Events', value: '23', trend: 15 },
    causal_chains_resolved: { label: 'Causal Chains Resolved', value: '7', trend: 40 },
    value_leakage_detected: { label: 'Value Leakage Detected', value: '$1.8M', trend: -5 },
  },
  lyte: {
    actions_pending: { label: 'Actions Pending', value: '34', trend: 18 },
    escalations_resolved: { label: 'Escalations Resolved', value: '12', trend: 33 },
    ownership_gaps: { label: 'Ownership Gaps', value: '8', trend: 14 },
  },
  alloy: {
    predictions_active: { label: 'Active Predictions', value: '17', trend: 21 },
    avg_confidence: { label: 'Avg Confidence', value: '81%', trend: 4 },
    high_probability_risks: { label: 'High-Prob Risks', value: '4', trend: -25 },
  },
  alloyscape: {
    runs_24h: { label: 'Runs (24h)', value: '1,247', trend: 8 },
    success_rate: { label: 'Success Rate', value: '94.2%', trend: 2 },
    exceptions_open: { label: 'Open Exceptions', value: '6', trend: -33 },
  },
};

export const COMMAND_LOOP_PHASES: {
  phase: CommandPhase;
  label: string;
  description: string;
  product: ProductId;
  color: string;
}[] = [
  {
    phase: 'DETECT',
    label: 'Detect',
    description: 'Surface signals, drift, and degradation',
    product: 'beacon',
    color: '#4a90b8',
  },
  {
    phase: 'INTERPRET',
    label: 'Interpret',
    description: 'Route accountability and orchestrate response',
    product: 'lyte',
    color: '#d4a054',
  },
  {
    phase: 'DECIDE',
    label: 'Decide',
    description: 'Model scenarios and recommend actions',
    product: 'alloy',
    color: '#8b7ac8',
  },
  {
    phase: 'EXECUTE',
    label: 'Execute',
    description: 'Run automations and manage interventions',
    product: 'alloyscape',
    color: '#4B8BDB',
  },
  {
    phase: 'VERIFY',
    label: 'Verify',
    description: 'Confirm recovery and measure value restored',
    product: 'beacon',
    color: '#6b8f71',
  },
];

export const DRIFT_EVENTS = [
  {
    id: 'drift-001',
    title: 'Approval cycle time exceeded 2x historical baseline',
    entity: 'Enterprise Contract Approval — Northgate Systems',
    detected_at: new Date(Date.now() - 1000 * 60 * 47).toISOString(),
    severity: 'critical' as Severity,
    contributing_factors: ['Legal team capacity 94%', 'Q1 close pressure', 'VP unavailable'],
    affected_workflows: ['wf-001'],
    value_impact: 840000,
    correlation_id: GOLDEN_FLOW_CORRELATION_ID,
  },
  {
    id: 'drift-002',
    title: 'Vendor onboarding step with no owner — 6 days unresolved',
    entity: 'New Vendor Onboarding — Apex Logistics',
    detected_at: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
    severity: 'high' as Severity,
    contributing_factors: [
      'Procurement team reorganization',
      'Process gap not updated',
      'No escalation trigger configured',
    ],
    affected_workflows: ['wf-003'],
    value_impact: 320000,
    correlation_id: 'corr-vendor-apex',
  },
  {
    id: 'drift-003',
    title: 'TechCorp account health dropped 42 NPS points in 30 days',
    entity: 'Customer Health — TechCorp Inc',
    detected_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    severity: 'high' as Severity,
    contributing_factors: [
      '3 support escalations',
      'Feature adoption dropped 35%',
      'Competitive offer received',
    ],
    affected_workflows: ['wf-004'],
    value_impact: 480000,
    correlation_id: 'corr-churn-techcorp',
  },
  {
    id: 'drift-004',
    title: 'Stripe connector auth failure — revenue events not syncing',
    entity: 'Stripe Revenue Events Connector',
    detected_at: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    severity: 'high' as Severity,
    contributing_factors: ['API token expired', 'Auto-renewal failed', 'Monitoring alert missed'],
    affected_workflows: [],
    value_impact: 0,
    correlation_id: 'corr-stripe-auth',
  },
];

export function formatCurrency(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${Math.round(value / 1000)}K`;
  return `$${value}`;
}

export function formatDuration(ms: number): string {
  const hours = Math.floor(ms / 3600000);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d ${hours % 24}h`;
  return `${hours}h`;
}

export function getSeverityColor(severity: Severity): string {
  return (
    {
      critical: '#c45a4a',
      high: '#c8953c',
      medium: '#d4a054',
      low: '#4a90b8',
      info: '#6b7280',
    }[severity] ?? '#6b7280'
  );
}

export function getStateColor(state: EntityState): string {
  return (
    {
      healthy: '#6b8f71',
      degraded: '#d4a054',
      blocked: '#c45a4a',
      pending_approval: '#c8953c',
      escalated: '#c45a4a',
      executing: '#4a90b8',
      retried: '#8b7ac8',
      completed: '#6b8f71',
      failed: '#c45a4a',
      recovered: '#6b8f71',
    }[state] ?? '#6b7280'
  );
}
