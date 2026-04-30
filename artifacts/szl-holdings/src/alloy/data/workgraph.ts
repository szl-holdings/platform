export type DataClass =
  | 'public'
  | 'internal'
  | 'confidential'
  | 'restricted'
  | 'legal'
  | 'finance'
  | 'security'
  | 'personal'
  | 'regulated';

export type NodeType =
  | 'email'
  | 'document'
  | 'spreadsheet'
  | 'chat_message'
  | 'calendar_event'
  | 'meeting_summary'
  | 'task'
  | 'approval'
  | 'outcome'
  | 'workcell'
  | 'contact'
  | 'file'
  | 'slide';

export type EdgeType =
  | 'references'
  | 'blocks'
  | 'resolves'
  | 'assigns'
  | 'triggers'
  | 'approves'
  | 'links_to'
  | 'follows_up';

export type SourceSystem =
  | 'email_provider'
  | 'drive_storage'
  | 'document_editor'
  | 'spreadsheet_app'
  | 'slide_creator'
  | 'calendar_app'
  | 'chat_platform'
  | 'video_meetings'
  | 'task_manager'
  | 'workspace_events'
  | 'internal';

export type ConnectorCategory = 'communication' | 'storage' | 'productivity' | 'meetings' | 'tasks' | 'events';

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface WorkGraphNode {
  id: string;
  type: NodeType;
  title: string;
  summary: string;
  owner: string;
  ownerRole: string;
  project: string;
  sourceSystem: SourceSystem;
  sourceUrl: string;
  dataClass: DataClass;
  sensitivity: number;
  confidence: number;
  visibility: 'owner_only' | 'team' | 'org' | 'public';
  sourcePermissionState: 'accessible' | 'inherited' | 'restricted' | 'blocked';
  evidenceRefs: string[];
  createdAt: string;
  updatedAt: string;
  freshness: 'fresh' | 'stale' | 'expired';
  riskLevel: RiskLevel;
}

export interface WorkGraphEdge {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  type: EdgeType;
  label: string;
  confidence: number;
  createdAt: string;
}

export interface WorkObject {
  id: string;
  title: string;
  type: string;
  project: string;
  owner: string;
  status: 'open' | 'in_progress' | 'blocked' | 'resolved' | 'closed';
  linkedNodeIds: string[];
  lastSignalAt: string;
  outcomeId?: string;
  workcellId?: string;
  riskLevel: RiskLevel;
  proofReady: boolean;
}

export interface WorkspaceConnector {
  id: string;
  name: string;
  category: ConnectorCategory;
  requiredScopes: string[];
  supportedObjects: string[];
  riskLevel: RiskLevel;
  demoMode: boolean;
  enabled: boolean;
  health: 'healthy' | 'demo' | 'degraded' | 'error';
  lastSyncAt: string;
  syncCount: number;
}

export interface WorkspaceEvent {
  id: string;
  eventType: string;
  sourceApp: SourceSystem;
  linkedObjectId: string;
  linkedObjectTitle: string;
  triggeredSkill: string | null;
  proofState: 'pending' | 'captured' | 'verified';
  occurredAt: string;
  normalized: boolean;
  workcellUpdated: boolean;
  traceSpanId: string;
}

export interface WorkGraphAnswer {
  id: string;
  question: string;
  answer: string;
  confidence: number;
  evidenceSources: Array<{ title: string; sourceSystem: SourceSystem; url: string; dataClass: DataClass }>;
  missingContext: string[];
  recommendedAction: string;
  permissionNotes: string;
  proofReady: boolean;
  workcellAction: string;
}

export interface A11oySkill {
  id: string;
  name: string;
  slug: string;
  category: string;
  description: string;
  triggerType: 'manual' | 'event' | 'schedule' | 'signal';
  requiredSources: string[];
  riskLevel: RiskLevel;
  proofRequired: boolean;
  approvalRequired: boolean;
  approvalClass: 'auto' | 'review' | 'finance' | 'legal' | 'security' | 'executive';
  estimatedDuration: string;
  lastRun?: string;
  runCount: number;
  demoInput: Record<string, string>;
  demoOutputSummary: string;
  mirrorEvalScore: number;
}

export interface ProjectMemory {
  id: string;
  name: string;
  owner: string;
  status: 'active' | 'at_risk' | 'blocked' | 'completed';
  riskLevel: RiskLevel;
  linkedNodeCount: number;
  signalCount: number;
  workcellCount: number;
  outcomeCount: number;
  decisionLatencyDays: number;
  proofCoverage: number;
  lastMeaningfulChange: string;
  recommendedAction: string;
  summary: string;
}

export interface SkillRun {
  id: string;
  skillId: string;
  skillName: string;
  status: 'complete' | 'pending_approval' | 'blocked' | 'running';
  workcellId: string;
  actionBriefSummary: string;
  mirrorEvalScore: number;
  approvalRequired: boolean;
  approvalStatus: 'pending' | 'approved' | 'rejected' | null;
  proofPacketId: string;
  triggeredAt: string;
  workGraphNodeIds: string[];
}

export const WORKSPACE_CONNECTORS: WorkspaceConnector[] = [
  { id: 'wsc-email', name: 'Email Connector', category: 'communication', requiredScopes: ['messages.read', 'messages.send'], supportedObjects: ['email', 'thread', 'attachment'], riskLevel: 'medium', demoMode: true, enabled: true, health: 'demo', lastSyncAt: new Date(Date.now() - 300000).toISOString(), syncCount: 40 },
  { id: 'wsc-drive', name: 'Drive Storage', category: 'storage', requiredScopes: ['files.read', 'files.write'], supportedObjects: ['file', 'folder', 'shared_drive'], riskLevel: 'medium', demoMode: true, enabled: true, health: 'demo', lastSyncAt: new Date(Date.now() - 600000).toISOString(), syncCount: 25 },
  { id: 'wsc-docs', name: 'Document Editor', category: 'productivity', requiredScopes: ['documents.read', 'documents.write', 'comments.read'], supportedObjects: ['document', 'comment', 'suggestion'], riskLevel: 'low', demoMode: true, enabled: true, health: 'demo', lastSyncAt: new Date(Date.now() - 900000).toISOString(), syncCount: 15 },
  { id: 'wsc-sheets', name: 'Spreadsheet App', category: 'productivity', requiredScopes: ['spreadsheets.read', 'spreadsheets.write'], supportedObjects: ['spreadsheet', 'sheet', 'row', 'named_range'], riskLevel: 'medium', demoMode: true, enabled: true, health: 'demo', lastSyncAt: new Date(Date.now() - 1200000).toISOString(), syncCount: 15 },
  { id: 'wsc-slides', name: 'Slide Creator', category: 'productivity', requiredScopes: ['presentations.read'], supportedObjects: ['presentation', 'slide'], riskLevel: 'low', demoMode: true, enabled: true, health: 'demo', lastSyncAt: new Date(Date.now() - 1800000).toISOString(), syncCount: 8 },
  { id: 'wsc-calendar', name: 'Calendar App', category: 'meetings', requiredScopes: ['calendar.read', 'calendar.write'], supportedObjects: ['event', 'attendee', 'reminder'], riskLevel: 'low', demoMode: true, enabled: true, health: 'demo', lastSyncAt: new Date(Date.now() - 2400000).toISOString(), syncCount: 15 },
  { id: 'wsc-chat', name: 'Chat Platform', category: 'communication', requiredScopes: ['messages.read', 'spaces.read'], supportedObjects: ['message', 'thread', 'space', 'reaction'], riskLevel: 'medium', demoMode: true, enabled: true, health: 'demo', lastSyncAt: new Date(Date.now() - 3600000).toISOString(), syncCount: 20 },
  { id: 'wsc-meet', name: 'Video Meetings', category: 'meetings', requiredScopes: ['meetings.read', 'recordings.read', 'transcripts.read'], supportedObjects: ['meeting', 'summary', 'recording', 'transcript'], riskLevel: 'medium', demoMode: true, enabled: true, health: 'demo', lastSyncAt: new Date(Date.now() - 5400000).toISOString(), syncCount: 10 },
  { id: 'wsc-tasks', name: 'Task Manager', category: 'tasks', requiredScopes: ['tasks.read', 'tasks.write'], supportedObjects: ['task', 'list', 'assignment'], riskLevel: 'low', demoMode: true, enabled: true, health: 'demo', lastSyncAt: new Date(Date.now() - 7200000).toISOString(), syncCount: 30 },
  { id: 'wsc-events', name: 'Workspace Event Stream', category: 'events', requiredScopes: ['events.subscribe'], supportedObjects: ['event', 'webhook', 'change_log'], riskLevel: 'low', demoMode: true, enabled: true, health: 'demo', lastSyncAt: new Date(Date.now() - 120000).toISOString(), syncCount: 100 },
  { id: 'wsc-mcp', name: 'MCP Workspace Bridge', category: 'events', requiredScopes: ['tools.invoke', 'resources.read'], supportedObjects: ['tool', 'resource', 'prompt'], riskLevel: 'high', demoMode: true, enabled: true, health: 'demo', lastSyncAt: new Date(Date.now() - 240000).toISOString(), syncCount: 8 },
];

export const MOCK_NODES: WorkGraphNode[] = [
  { id: 'n001', type: 'meeting_summary', title: 'Q2 Revenue Operations Review — Meeting Summary', summary: 'Reviewed pipeline coverage, identified 3 deals at risk, agreed on weekly cadence check-ins and executive sponsor engagement for >$250K opportunities. Sarah owns follow-up with APAC team.', owner: 'Sarah Chen', ownerRole: 'VP Revenue Ops', project: 'Q2 Revenue Operations', sourceSystem: 'video_meetings', sourceUrl: '#demo', dataClass: 'confidential', sensitivity: 0.7, confidence: 0.92, visibility: 'team', sourcePermissionState: 'accessible', evidenceRefs: ['meet-001', 'transcript-001'], createdAt: new Date(Date.now() - 3 * 86400000).toISOString(), updatedAt: new Date(Date.now() - 86400000).toISOString(), freshness: 'fresh', riskLevel: 'medium' },
  { id: 'n002', type: 'document', title: 'Q2 Revenue Board Report — Draft v3', summary: 'Board presentation covering Q2 actual vs. forecast, win/loss analysis, pipeline health by segment, and revised H2 guidance. Legal review pending.', owner: 'Marcus Webb', ownerRole: 'CFO', project: 'Board Packet Preparation', sourceSystem: 'document_editor', sourceUrl: '#demo', dataClass: 'restricted', sensitivity: 0.9, confidence: 0.88, visibility: 'owner_only', sourcePermissionState: 'restricted', evidenceRefs: ['doc-001'], createdAt: new Date(Date.now() - 7 * 86400000).toISOString(), updatedAt: new Date(Date.now() - 2 * 86400000).toISOString(), freshness: 'fresh', riskLevel: 'high' },
  { id: 'n003', type: 'spreadsheet', title: 'Revenue Forecast Model — Q2 Actuals', summary: 'Updated model with Q2 actuals. ARR: $4.2M (+12% vs. plan). Churn: 2.1% (within target). NRR: 118%.', owner: 'Sarah Chen', ownerRole: 'VP Revenue Ops', project: 'Q2 Revenue Operations', sourceSystem: 'spreadsheet_app', sourceUrl: '#demo', dataClass: 'finance', sensitivity: 0.85, confidence: 0.95, visibility: 'team', sourcePermissionState: 'accessible', evidenceRefs: ['sheet-001'], createdAt: new Date(Date.now() - 4 * 86400000).toISOString(), updatedAt: new Date(Date.now() - 1 * 86400000).toISOString(), freshness: 'fresh', riskLevel: 'medium' },
  { id: 'n004', type: 'email', title: 'Re: Acme Corp Renewal — Approval Required', summary: 'Email thread requesting approval for Acme Corp renewal at $2.4M. CFO approval pending. Deal team waiting 4 days for response.', owner: 'James Park', ownerRole: 'Account Executive', project: 'Q2 Revenue Operations', sourceSystem: 'email_provider', sourceUrl: '#demo', dataClass: 'confidential', sensitivity: 0.6, confidence: 0.87, visibility: 'team', sourcePermissionState: 'accessible', evidenceRefs: ['email-001'], createdAt: new Date(Date.now() - 5 * 86400000).toISOString(), updatedAt: new Date(Date.now() - 4 * 86400000).toISOString(), freshness: 'stale', riskLevel: 'high' },
  { id: 'n005', type: 'task', title: 'Complete Q2 Legal Deadline Audit — OVERDUE', summary: 'Task assigned to legal team to review all pending contract deadlines. 3 items flagged: NDA expiry Meridian Partners, MSA renewal Vertex Corp, SOW deadline Clearfield.', owner: 'Ana Torres', ownerRole: 'General Counsel', project: 'Legal Matter Deadline Audit', sourceSystem: 'task_manager', sourceUrl: '#demo', dataClass: 'legal', sensitivity: 0.9, confidence: 0.93, visibility: 'team', sourcePermissionState: 'accessible', evidenceRefs: ['task-001'], createdAt: new Date(Date.now() - 14 * 86400000).toISOString(), updatedAt: new Date(Date.now() - 10 * 86400000).toISOString(), freshness: 'stale', riskLevel: 'critical' },
  { id: 'n006', type: 'chat_message', title: 'Chat: Security Incident — Unauthorized API Access', summary: 'Chat thread in #security-ops: unauthorized API access detected on staging environment. Token rotation required. Risk team engaged.', owner: 'Dev Patel', ownerRole: 'CISO', project: 'Security Incident Follow-Up', sourceSystem: 'chat_platform', sourceUrl: '#demo', dataClass: 'security', sensitivity: 0.95, confidence: 0.96, visibility: 'team', sourcePermissionState: 'accessible', evidenceRefs: ['chat-001'], createdAt: new Date(Date.now() - 2 * 86400000).toISOString(), updatedAt: new Date(Date.now() - 6 * 3600000).toISOString(), freshness: 'fresh', riskLevel: 'critical' },
  { id: 'n007', type: 'approval', title: 'Pending: Finance Approval — Vendor SLA Penalty', summary: 'Approval request for $45K SLA penalty payment to CloudOps. Finance Director approval required. Day 6 of 5-day SLA.', owner: 'Marcus Webb', ownerRole: 'CFO', project: 'Private Advisory Vendor Controls', sourceSystem: 'task_manager', sourceUrl: '#demo', dataClass: 'finance', sensitivity: 0.8, confidence: 0.91, visibility: 'team', sourcePermissionState: 'accessible', evidenceRefs: ['approval-001'], createdAt: new Date(Date.now() - 8 * 86400000).toISOString(), updatedAt: new Date(Date.now() - 6 * 86400000).toISOString(), freshness: 'stale', riskLevel: 'high' },
  { id: 'n008', type: 'document', title: 'Property CapEx Review — 412 Fulton St', summary: 'CapEx analysis for proposed acquisition. IRR: 14.2%. Zoning risk: medium. Environmental clearance pending. Board sign-off required before LOI.', owner: 'Kenji Watanabe', ownerRole: 'Head of Real Estate', project: 'Property Capex Review', sourceSystem: 'document_editor', sourceUrl: '#demo', dataClass: 'restricted', sensitivity: 0.85, confidence: 0.89, visibility: 'owner_only', sourcePermissionState: 'restricted', evidenceRefs: ['doc-002'], createdAt: new Date(Date.now() - 6 * 86400000).toISOString(), updatedAt: new Date(Date.now() - 3 * 86400000).toISOString(), freshness: 'fresh', riskLevel: 'medium' },
  { id: 'n009', type: 'meeting_summary', title: 'Maritime Risk Review — Q2 Regulatory Check-in', summary: 'Reviewed OFAC screening results, AIS gap events, and flag state compliance. 2 vessels flagged for follow-up. Port authority notifications drafted.', owner: 'Sophie Laurent', ownerRole: 'Head of Maritime Ops', project: 'Maritime Risk Review', sourceSystem: 'video_meetings', sourceUrl: '#demo', dataClass: 'regulated', sensitivity: 0.75, confidence: 0.88, visibility: 'team', sourcePermissionState: 'accessible', evidenceRefs: ['meet-002'], createdAt: new Date(Date.now() - 5 * 86400000).toISOString(), updatedAt: new Date(Date.now() - 4 * 86400000).toISOString(), freshness: 'stale', riskLevel: 'medium' },
  { id: 'n010', type: 'spreadsheet', title: 'Executive Operating Review — Weekly Scorecard', summary: 'Weekly KPIs across all domains. 3 metrics below threshold: APAC pipeline, onboarding time, incident MTTR. Executive action required.', owner: 'Sarah Chen', ownerRole: 'VP Revenue Ops', project: 'Executive Weekly Operating Review', sourceSystem: 'spreadsheet_app', sourceUrl: '#demo', dataClass: 'confidential', sensitivity: 0.7, confidence: 0.94, visibility: 'team', sourcePermissionState: 'accessible', evidenceRefs: ['sheet-002'], createdAt: new Date(Date.now() - 1 * 86400000).toISOString(), updatedAt: new Date(Date.now() - 2 * 3600000).toISOString(), freshness: 'fresh', riskLevel: 'medium' },
];

export const MOCK_EVENTS: WorkspaceEvent[] = [
  { id: 'ev001', eventType: 'video_meetings.summary.created', sourceApp: 'video_meetings', linkedObjectId: 'wo-001', linkedObjectTitle: 'Q2 Revenue Operations Review', triggeredSkill: 'Meeting to Execution', proofState: 'verified', occurredAt: new Date(Date.now() - 3 * 86400000).toISOString(), normalized: true, workcellUpdated: true, traceSpanId: 'span-001' },
  { id: 'ev002', eventType: 'email_provider.message.received', sourceApp: 'email_provider', linkedObjectId: 'wo-002', linkedObjectTitle: 'Acme Corp Renewal Approval', triggeredSkill: 'Approval Chase', proofState: 'captured', occurredAt: new Date(Date.now() - 5 * 86400000).toISOString(), normalized: true, workcellUpdated: true, traceSpanId: 'span-002' },
  { id: 'ev003', eventType: 'spreadsheet_app.row.changed', sourceApp: 'spreadsheet_app', linkedObjectId: 'wo-003', linkedObjectTitle: 'Revenue Forecast Model', triggeredSkill: 'Revenue Follow-Up', proofState: 'captured', occurredAt: new Date(Date.now() - 1 * 86400000).toISOString(), normalized: true, workcellUpdated: false, traceSpanId: 'span-003' },
  { id: 'ev004', eventType: 'task_manager.assigned', sourceApp: 'task_manager', linkedObjectId: 'wo-004', linkedObjectTitle: 'Legal Deadline Audit', triggeredSkill: 'Legal Deadline Proof Review', proofState: 'pending', occurredAt: new Date(Date.now() - 14 * 86400000).toISOString(), normalized: true, workcellUpdated: true, traceSpanId: 'span-004' },
  { id: 'ev005', eventType: 'chat_platform.message.created', sourceApp: 'chat_platform', linkedObjectId: 'wo-005', linkedObjectTitle: 'Security Incident Follow-Up', triggeredSkill: 'Security Incident Follow-Up', proofState: 'verified', occurredAt: new Date(Date.now() - 6 * 3600000).toISOString(), normalized: true, workcellUpdated: true, traceSpanId: 'span-005' },
  { id: 'ev006', eventType: 'task_manager.approval.requested', sourceApp: 'task_manager', linkedObjectId: 'wo-006', linkedObjectTitle: 'Vendor SLA Penalty Approval', triggeredSkill: 'Vendor SLA Escalation', proofState: 'captured', occurredAt: new Date(Date.now() - 8 * 86400000).toISOString(), normalized: true, workcellUpdated: true, traceSpanId: 'span-006' },
  { id: 'ev007', eventType: 'document_editor.comment.created', sourceApp: 'document_editor', linkedObjectId: 'wo-007', linkedObjectTitle: 'Board Packet Draft', triggeredSkill: 'Board Packet from Workspace', proofState: 'pending', occurredAt: new Date(Date.now() - 2 * 86400000).toISOString(), normalized: true, workcellUpdated: false, traceSpanId: 'span-007' },
  { id: 'ev008', eventType: 'calendar_app.event.created', sourceApp: 'calendar_app', linkedObjectId: 'wo-008', linkedObjectTitle: 'Executive Weekly Review', triggeredSkill: 'Executive Weekly Brief', proofState: 'pending', occurredAt: new Date(Date.now() - 1 * 3600000).toISOString(), normalized: true, workcellUpdated: false, traceSpanId: 'span-008' },
  { id: 'ev009', eventType: 'task_manager.approval.completed', sourceApp: 'task_manager', linkedObjectId: 'wo-009', linkedObjectTitle: 'Invoice Discrepancy — CloudOps', triggeredSkill: 'Invoice Discrepancy Review', proofState: 'verified', occurredAt: new Date(Date.now() - 12 * 3600000).toISOString(), normalized: true, workcellUpdated: true, traceSpanId: 'span-009' },
  { id: 'ev010', eventType: 'spreadsheet_app.row.changed', sourceApp: 'spreadsheet_app', linkedObjectId: 'wo-010', linkedObjectTitle: 'Project Risk Dashboard', triggeredSkill: 'Project Risk Digest', proofState: 'captured', occurredAt: new Date(Date.now() - 3 * 3600000).toISOString(), normalized: true, workcellUpdated: true, traceSpanId: 'span-010' },
];

export const WORKGRAPH_ANSWERS: WorkGraphAnswer[] = [
  {
    id: 'qa001',
    question: 'What changed on the Q2 revenue review?',
    answer: 'The Q2 Revenue Operations Review (held 3 days ago) produced 5 committed actions: (1) Sarah Chen owns APAC pipeline review by EOW, (2) executive sponsor required for all deals >$250K, (3) weekly cadence check-ins starting Monday, (4) Acme Corp renewal approval escalated to CFO — currently Day 4 with no response, (5) Q2 board packet draft sent to legal for review. The meeting summary is linked to 3 open WorkObjects and 2 pending approvals.',
    confidence: 0.91,
    evidenceSources: [{ title: 'Q2 Revenue Operations Review — Meeting Summary', sourceSystem: 'video_meetings', url: '#demo', dataClass: 'confidential' }, { title: 'Revenue Forecast Model — Q2 Actuals', sourceSystem: 'spreadsheet_app', url: '#demo', dataClass: 'finance' }],
    missingContext: ['APAC pipeline data not yet updated in system', 'CFO approval status not reflected in WorkGraph'],
    recommendedAction: 'Create Workcell to chase Acme Corp CFO approval — Day 4 overdue',
    permissionNotes: 'Finance data requires finance-team membership. Restricted Board Report excluded from this summary.',
    proofReady: true,
    workcellAction: 'Escalate Acme Corp renewal approval to CFO',
  },
  {
    id: 'qa002',
    question: 'Which approvals are blocking revenue?',
    answer: 'Two approvals are actively blocking revenue: (1) Acme Corp renewal at $2.4M — CFO approval pending Day 4 (SLA was 48h), escalation recommended; (2) Vertex Corp MSA renewal at $890K — Legal approval pending Day 11 due to jurisdiction clause dispute. Combined revenue at risk: $3.29M. Average decision latency: 7.5 days vs. 2-day target.',
    confidence: 0.94,
    evidenceSources: [{ title: 'Re: Acme Corp Renewal — Approval Required', sourceSystem: 'email_provider', url: '#demo', dataClass: 'confidential' }, { title: 'Pending: Finance Approval — Vendor SLA Penalty', sourceSystem: 'task_manager', url: '#demo', dataClass: 'finance' }],
    missingContext: ['Live CRM sync not available in demo mode'],
    recommendedAction: 'Generate Approval Chase Action Brief for both deals with escalation draft',
    permissionNotes: 'Finance amounts are sourced from accessible team documents. Restricted data masked.',
    proofReady: true,
    workcellAction: 'Chase both revenue-blocking approvals with escalation drafts',
  },
  {
    id: 'qa003',
    question: 'What legal deadlines are at risk?',
    answer: 'Three legal deadlines are at risk within 30 days: (1) NDA expiry — Meridian Partners: expires in 8 days, renewal not initiated; (2) MSA renewal — Vertex Corp: expires in 14 days, legal review pending; (3) SOW deadline — Clearfield Inc: delivery milestone in 18 days, 2 open action items unresolved. Legal team was assigned audit task 14 days ago — task is overdue by 4 days.',
    confidence: 0.88,
    evidenceSources: [{ title: 'Complete Q2 Legal Deadline Audit — OVERDUE', sourceSystem: 'task_manager', url: '#demo', dataClass: 'legal' }],
    missingContext: ['Legal matter system not connected in demo mode', 'Court filing deadlines not available without legal database connector'],
    recommendedAction: 'Run Legal Deadline Proof Review Skill to generate Proof Packet and escalate to GC',
    permissionNotes: 'Legal data class requires legal team access. Content accessible to authorized legal staff only.',
    proofReady: false,
    workcellAction: 'Initiate Legal Deadline Proof Review with escalation to General Counsel',
  },
  {
    id: 'qa004',
    question: 'Who owns the security incident response?',
    answer: 'The active security incident (unauthorized API access, staging environment) is owned by Dev Patel (CISO). Current status: token rotation complete, access audit in progress. Chat thread in #security-ops has 12 messages over 6 hours. Action items assigned: 2 open (access audit report, vendor notification), 1 completed (token rotation). Incident is at Risk Level: Critical. No Proof Packet yet created — recommended.',
    confidence: 0.96,
    evidenceSources: [{ title: 'Chat: Security Incident — Unauthorized API Access', sourceSystem: 'chat_platform', url: '#demo', dataClass: 'security' }],
    missingContext: ['Threat intelligence system not connected in demo'],
    recommendedAction: 'Create Proof Packet for security incident with evidence chain for compliance record',
    permissionNotes: 'Security data class requires security team membership. This summary is accessible to the requesting user via security team role.',
    proofReady: false,
    workcellAction: 'Create Security Incident Proof Packet with evidence chain',
  },
  {
    id: 'qa005',
    question: 'What decisions came out of the board packet preparation?',
    answer: 'Board Packet Preparation has 3 unresolved decisions: (1) Q2 revenue guidance — revised forecast accepted by leadership but not yet approved for external communication; (2) Property CapEx — 412 Fulton St analysis complete, board sign-off required before LOI can be issued; (3) Vendor SLA penalty payment ($45K) — Finance Director approval on Day 6, overdue. The restricted Board Report (Draft v3) is excluded from this summary per DLP policy.',
    confidence: 0.85,
    evidenceSources: [{ title: 'Property CapEx Review — 412 Fulton St', sourceSystem: 'document_editor', url: '#demo', dataClass: 'restricted' }],
    missingContext: ['Restricted Board Report content masked per DLP policy', 'Board approval system not connected in demo'],
    recommendedAction: 'Escalate CFO sign-off on CapEx and vendor penalty approvals before board meeting',
    permissionNotes: 'Restricted source referenced but content not included. Board Report requires CFO/board-member access.',
    proofReady: false,
    workcellAction: 'Create Board Packet Approval Workcell with timeline',
  },
  {
    id: 'qa006',
    question: 'What is the status of the workspace migration?',
    answer: 'Workspace Migration Control project is 60% complete. Phase 1 (email/calendar migration) complete for 340 of 400 users. Phase 2 (drive/docs migration) at 30% — blocked on 15 accounts with restricted data requiring legal review. Estimated completion: 3 weeks behind schedule. No critical incidents logged. 3 open tasks awaiting IT admin approval.',
    confidence: 0.82,
    evidenceSources: [{ title: 'Executive Operating Review — Weekly Scorecard', sourceSystem: 'spreadsheet_app', url: '#demo', dataClass: 'confidential' }],
    missingContext: ['Migration tracking system not connected in demo', 'IT admin ticket system not available'],
    recommendedAction: 'Run Project Risk Digest for migration project to identify blockers and create recovery plan',
    permissionNotes: 'Internal data class accessible to organization members.',
    proofReady: false,
    workcellAction: 'Run Project Risk Digest Skill for Workspace Migration',
  },
  {
    id: 'qa007',
    question: 'Which vendor SLAs are at risk?',
    answer: 'Two vendor SLAs are at risk: (1) CloudOps — SLA penalty triggered at $45K, Finance approval pending Day 6 (SLA was 5 days), approval chase required immediately; (2) DataStream Inc — 99.5% uptime SLA, current 30-day rolling average: 98.9%, breach warning threshold crossed. Estimated penalty exposure: $12K/month if unresolved.',
    confidence: 0.89,
    evidenceSources: [{ title: 'Pending: Finance Approval — Vendor SLA Penalty', sourceSystem: 'task_manager', url: '#demo', dataClass: 'finance' }],
    missingContext: ['Vendor management system not connected in demo', 'Real-time SLA monitoring not available'],
    recommendedAction: 'Run Vendor SLA Escalation Skill to draft escalation communications and create Proof Packet',
    permissionNotes: 'Finance amounts accessible to finance team members.',
    proofReady: false,
    workcellAction: 'Run Vendor SLA Escalation Skill for CloudOps penalty approval',
  },
  {
    id: 'qa008',
    question: 'What are the open action items from this week\'s executive review?',
    answer: 'Executive Weekly Operating Review has 7 open action items: (1) APAC pipeline update — due COB Friday, owner: James Park; (2) Onboarding time reduction plan — due next Monday, owner: HR lead; (3) Incident MTTR reduction target — due end of sprint, owner: Dev Patel; (4) Q3 forecast alignment — CFO sign-off pending; (5) Board packet final draft — legal review in progress; (6) Workspace migration Phase 2 unblock — legal review required; (7) Insurance renewal sign-off — due in 14 days.',
    confidence: 0.87,
    evidenceSources: [{ title: 'Executive Operating Review — Weekly Scorecard', sourceSystem: 'spreadsheet_app', url: '#demo', dataClass: 'confidential' }, { title: 'Executive Weekly Brief — W18', sourceSystem: 'document_editor', url: '#demo', dataClass: 'confidential' }],
    missingContext: ['Live task system sync not available in demo'],
    recommendedAction: 'Run Executive Weekly Brief Skill to compile action item tracker for COO review',
    permissionNotes: 'Confidential data class requires team membership. Personal data masked.',
    proofReady: true,
    workcellAction: 'Compile executive action item tracker for COO',
  },
  {
    id: 'qa009',
    question: 'What evidence exists for the Q2 board packet?',
    answer: 'The Q2 Board Packet preparation has evidence from 5 sources: (1) Revenue forecast model (Finance — accessible); (2) Legal matter status (Legal — human review required); (3) Property CapEx analysis (Finance — accessible); (4) Security incident summary (Security — security team only); (5) Board Report Draft v3 (Restricted — proof reference only, content not available). Proof Packet pp006 covers 4 of 5 sources. Restricted Board Report is excluded from this summary per DLP policy.',
    confidence: 0.83,
    evidenceSources: [{ title: 'Property CapEx Review — 412 Fulton St', sourceSystem: 'document_editor', url: '#demo', dataClass: 'restricted' }, { title: 'Q2 Revenue Board Packet', sourceSystem: 'drive_storage', url: '#demo', dataClass: 'legal' }],
    missingContext: ['Restricted Board Report content masked per DLP policy — proof reference only'],
    recommendedAction: 'Request CFO review of Proof Packet pp006 before board distribution',
    permissionNotes: 'Restricted source referenced. Board Report requires CFO/board-member access. Legal content masked pending review.',
    proofReady: false,
    workcellAction: 'Request CFO sign-off on Board Packet Proof Packet',
  },
  {
    id: 'qa010',
    question: 'What is the status of the maritime risk review?',
    answer: 'Maritime Risk Review project is active with medium risk. OFAC screening completed for all 4 active vessels. 2 vessels (SZL-47, SZL-52) require port authority notifications for schedule deviations. Fuel hedging decision is pending CFO sign-off — commodity risk exposure: $2.1M. Proof Packet pp007 covers OFAC screening evidence. No critical regulatory findings.',
    confidence: 0.91,
    evidenceSources: [{ title: 'SZL-47 Port Arrival — Cargo Manifest', sourceSystem: 'email_provider', url: '#demo', dataClass: 'internal' }, { title: 'Maritime Risk Assessment SZL-47', sourceSystem: 'document_editor', url: '#demo', dataClass: 'internal' }],
    missingContext: ['Real-time AIS tracking not available in demo', 'Commodity pricing feed not connected'],
    recommendedAction: 'Draft port authority notifications and route fuel hedging decision to CFO',
    permissionNotes: 'Internal data class accessible to organization members.',
    proofReady: true,
    workcellAction: 'Draft maritime notifications and escalate fuel hedging to CFO',
  },
  {
    id: 'qa011',
    question: 'Which property investment decisions are blocked?',
    answer: 'Property CapEx Review has 1 blocked decision: 412 Fulton St acquisition LOI is blocked on board sign-off. Financial model: $4.2M acquisition, projected IRR 14.2%, cap rate 6.1%. Environmental clearance certificate is pending from city planning — ETA 3 weeks. Board must approve before LOI can be issued. Finance Director and CFO both need to sign.',
    confidence: 0.86,
    evidenceSources: [{ title: 'Property Capex Model FY26', sourceSystem: 'spreadsheet_app', url: '#demo', dataClass: 'finance' }, { title: 'Capex Budget Request — Approval Required', sourceSystem: 'email_provider', url: '#demo', dataClass: 'finance' }],
    missingContext: ['Environmental clearance portal not connected in demo'],
    recommendedAction: 'Schedule board approval session for 412 Fulton St LOI before environmental clearance expires',
    permissionNotes: 'Finance data class accessible to finance team. LOI terms are confidential.',
    proofReady: false,
    workcellAction: 'Schedule board approval for Property CapEx LOI',
  },
  {
    id: 'qa012',
    question: 'What is the state of the Salesforce RevOps cleanup?',
    answer: 'Salesforce → RevOps Cleanup is 80% complete. 3 duplicate account records pending merge (accounts: Meridian Partners, DataVault Inc, TechBridge Corp). Field mapping complete for opportunity stage and close date. Revenue recognition field discrepancy detected in 14 records — Finance Director review required. Data hygiene sign-off from Sales Ops Director pending. No data loss detected.',
    confidence: 0.84,
    evidenceSources: [{ title: 'Salesforce CRM Cleanup Checklist', sourceSystem: 'spreadsheet_app', url: '#demo', dataClass: 'internal' }, { title: 'Salesforce Data Quality Issues', sourceSystem: 'email_provider', url: '#demo', dataClass: 'internal' }],
    missingContext: ['Live Salesforce API not connected in demo'],
    recommendedAction: 'Request Sales Ops Director sign-off and route revenue recognition discrepancy to Finance',
    permissionNotes: 'Internal data class accessible to organization members.',
    proofReady: false,
    workcellAction: 'Route Salesforce cleanup sign-off to Sales Ops Director',
  },
  {
    id: 'qa013',
    question: 'What compliance risks are in the current week?',
    answer: 'Three compliance risks are active this week: (1) AI Governance Compliance Audit — deadline Friday, 2 documentation items outstanding, Compliance team assigned; (2) Data Residency Policy — legal opinion required for EU customer data, matter #data-residency-2026, 8 days to response deadline; (3) Customer GDPR Article 17 deletion request — 30-day statutory deadline, 12 days remaining, Data Protection Officer notified.',
    confidence: 0.90,
    evidenceSources: [{ title: 'Compliance Audit — Alloy AI Governance', sourceSystem: 'email_provider', url: '#demo', dataClass: 'regulated' }, { title: 'Data Residency Compliance — Legal Opinion', sourceSystem: 'email_provider', url: '#demo', dataClass: 'regulated' }],
    missingContext: ['Regulatory portal not connected in demo', 'Data subject request system not available'],
    recommendedAction: 'Escalate AI Governance audit documentation gaps to Compliance team immediately',
    permissionNotes: 'Regulated data class. Content accessible to compliance and legal roles.',
    proofReady: false,
    workcellAction: 'Escalate AI Governance documentation to Compliance team',
  },
  {
    id: 'qa014',
    question: 'Who made decisions about the security incident?',
    answer: 'Security incident INC-2047 decisions: Dev Patel (CISO) authorized token rotation (completed), Sana Ali (Security Lead) assigned access audit (in progress), Marcus Webb (CRO) was briefed on customer impact (no customer data breach confirmed). CFO was notified for potential vendor notification costs. Security Proof Packet pp002 covers the decision chain with 4 evidence sources. MirrorEval score: 95% on incident summary.',
    confidence: 0.96,
    evidenceSources: [{ title: 'Chat: Security Incident — Unauthorized API Access', sourceSystem: 'chat_platform', url: '#demo', dataClass: 'security' }, { title: 'Security Incident INC-2047 Report', sourceSystem: 'document_editor', url: '#demo', dataClass: 'security' }],
    missingContext: ['SIEM logs not connected in demo', 'Threat intelligence feed not available'],
    recommendedAction: 'Complete access audit and close incident with final Proof Packet update',
    permissionNotes: 'Security data class requires security team membership.',
    proofReady: true,
    workcellAction: 'Complete incident close-out and final Proof Packet',
  },
  {
    id: 'qa015',
    question: 'What cross-domain signals are trending this week?',
    answer: 'Cross-domain signal trends this week: (1) Revenue signals spiking — 3 deals moved to at-risk status in 48h; approval latency above 2-day SLA on 2 deals; (2) Security signals elevated — INC-2047 active, 14 signals in 6h; (3) Legal deadline proximity — 3 matters entering 30-day window; (4) Finance signals: invoice discrepancy detected, vendor SLA breach logged; (5) Workspace migration signals: Phase 2 blocked on legal review. All 5 domains showing elevated signal volume vs. prior week baseline.',
    confidence: 0.85,
    evidenceSources: [{ title: 'Q2 Revenue Operations Review', sourceSystem: 'video_meetings', url: '#demo', dataClass: 'confidential' }, { title: 'Executive Operating Review — Weekly Scorecard', sourceSystem: 'spreadsheet_app', url: '#demo', dataClass: 'confidential' }],
    missingContext: ['Historical baseline comparison requires 4+ weeks of live data'],
    recommendedAction: 'Review cross-domain risk digest and prioritize 3 critical signals for executive briefing',
    permissionNotes: 'Aggregated signals from accessible sources only. Restricted sources excluded.',
    proofReady: false,
    workcellAction: 'Generate cross-domain risk digest for executive briefing',
  },
  {
    id: 'qa016',
    question: 'What private advisory vendor risks are active?',
    answer: 'Private Advisory Vendor Controls project has 2 active risks: (1) CloudOps SLA penalty — $45K, Finance approval overdue Day 6; (2) DataStream SLA warning — 98.9% uptime vs. 99.5% SLA, penalty exposure $12K/month. A restricted advisory NDA is in review (content not available per DLP policy — proof reference only). Vendor audit for IT Infrastructure Partners is scheduled for next month. No material data breach from either vendor.',
    confidence: 0.88,
    evidenceSources: [{ title: 'Vendor SLA Scorecard Q1', sourceSystem: 'spreadsheet_app', url: '#demo', dataClass: 'internal' }, { title: 'Private Advisory NDA — RESTRICTED', sourceSystem: 'drive_storage', url: '#demo', dataClass: 'restricted' }],
    missingContext: ['Restricted NDA content not available per DLP policy'],
    recommendedAction: 'Run Vendor SLA Escalation Skill for CloudOps and schedule DataStream review',
    permissionNotes: 'Restricted NDA content masked. Proof reference available. Finance amounts accessible to finance team.',
    proofReady: false,
    workcellAction: 'Escalate CloudOps penalty and schedule DataStream SLA review',
  },
  {
    id: 'qa017',
    question: 'What skills have been run in the last 7 days?',
    answer: 'In the last 7 days, 6 Skills Studio runs completed: (1) Project Risk Digest — 3 runs (auto-scheduled), MirrorEval avg 87%; (2) Executive Weekly Brief — 1 run, MirrorEval 88%; (3) Security Incident Follow-Up — 1 run, MirrorEval 95%, approval pending security team; (4) Invoice Discrepancy Review — 1 run, MirrorEval 88%, finance approval requested. Total proof packets created: 4. Total decisions requiring approval: 3.',
    confidence: 0.92,
    evidenceSources: [{ title: 'Skills Studio Run Log — W18', sourceSystem: 'task_manager', url: '#demo', dataClass: 'internal' }],
    missingContext: ['Live skill run history requires DB connection in non-demo mode'],
    recommendedAction: 'Review pending approvals for Security Incident and Invoice Discrepancy skills',
    permissionNotes: 'Skill run logs accessible to team members with Alloy access.',
    proofReady: true,
    workcellAction: 'Review pending skill run approvals',
  },
  {
    id: 'qa018',
    question: 'What is the overall proof coverage across all projects?',
    answer: 'Proof coverage across 10 active projects: average coverage 69.5%. Highest: Salesforce → RevOps Cleanup (90%), Executive Weekly Operating Review (88%), Security Incident Follow-Up (80%). Lowest: Legal Matter Deadline Audit (30%) — critical gap, 3 deadlines at risk; Board Packet Preparation (55%); Private Advisory Vendor Controls (60%). Total proof packets: 10. Verified: 5. Pending review: 3. Draft: 2. Recommended: run Legal Deadline Proof Review immediately.',
    confidence: 0.89,
    evidenceSources: [{ title: 'Q2 Revenue Operations Review', sourceSystem: 'video_meetings', url: '#demo', dataClass: 'confidential' }],
    missingContext: ['Cross-project proof coverage requires all projects to have active connectors'],
    recommendedAction: 'Prioritize Legal Deadline Proof Review — 30% coverage with critical deadlines at risk',
    permissionNotes: 'Proof coverage metrics are internal data class accessible to team members.',
    proofReady: true,
    workcellAction: 'Prioritize Legal Deadline Proof Review Skill run',
  },
  {
    id: 'qa019',
    question: 'Are there any personal data risks in current workflows?',
    answer: 'Two personal data risks identified: (1) Customer PII deletion request (GDPR Article 17) — 12 days to deadline, Data Protection Officer assigned, legal team reviewing; (2) Customer data breach notification draft — legal review in progress, personal data of 340 affected customers must be masked in all external communications. Board Packet generation automatically masks PII per DLP policy pol007. No unauthorized PII exposure detected in workspace scan.',
    confidence: 0.91,
    evidenceSources: [{ title: 'Customer PII Data Request — GDPR Article 17', sourceSystem: 'email_provider', url: '#demo', dataClass: 'personal' }, { title: 'Customer Data Breach Notification Draft', sourceSystem: 'email_provider', url: '#demo', dataClass: 'personal' }],
    missingContext: ['Data subject registry not connected in demo', 'Consent management system not available'],
    recommendedAction: 'Confirm GDPR deletion request timeline and ensure breach notification draft routes through legal',
    permissionNotes: 'Personal data class. PII masked in this summary per DLP policy pol007.',
    proofReady: false,
    workcellAction: 'Route GDPR deletion request and breach notification to DPO',
  },
  {
    id: 'qa020',
    question: 'What is blocking the executive decision queue?',
    answer: 'Executive decision queue has 5 blocked items: (1) Acme Corp renewal ($2.4M) — CFO, Day 4 overdue; (2) 412 Fulton St LOI — Board, environmental clearance pending; (3) Q2 revenue guidance for external release — CEO, legal clearance needed; (4) AI Governance policy v3 — CCO, documentation gap blocking sign-off; (5) New credit facility ($25M) — CFO + Board, due diligence in progress. Combined value at stake: $27.4M revenue + $25M facility. Average decision latency: 4.8 days vs. 2-day target.',
    confidence: 0.94,
    evidenceSources: [{ title: 'Board Approval: New Credit Facility', sourceSystem: 'email_provider', url: '#demo', dataClass: 'finance' }, { title: 'Q2 Revenue Board Packet — Final Version', sourceSystem: 'email_provider', url: '#demo', dataClass: 'legal' }],
    missingContext: ['Board scheduling system not connected in demo'],
    recommendedAction: 'Run Approval Chase Skill on all 5 blocked items and generate executive decision queue digest',
    permissionNotes: 'Finance and legal data accessible to authorized roles. Restricted board content masked.',
    proofReady: false,
    workcellAction: 'Generate executive decision queue digest and chase all 5 blocked approvals',
  },
];

export const ALLOY_SKILLS: A11oySkill[] = [
  { id: 'sk001', name: 'Meeting to Execution', slug: 'meeting-to-execution', category: 'Meetings', description: 'Ingests meeting notes → extracts commitments → identifies owners → detects unresolved decisions → links to outcomes → creates Workcell → generates Action Brief → runs MirrorEval → requires approval if customer-facing or financial → drafts follow-up → creates Proof Packet.', triggerType: 'event', requiredSources: ['video_meetings', 'calendar_app'], riskLevel: 'medium', proofRequired: true, approvalRequired: true, approvalClass: 'review', estimatedDuration: '3–5 min', lastRun: new Date(Date.now() - 3 * 86400000).toISOString(), runCount: 47, demoInput: { meetingId: 'Q2 Revenue Operations Review', notes: 'Meeting summary from video conference' }, demoOutputSummary: '5 commitments extracted, 3 owners identified, 2 unresolved decisions flagged, Action Brief drafted, MirrorEval: 91%', mirrorEvalScore: 91 },
  { id: 'sk002', name: 'Invoice Discrepancy Review', slug: 'invoice-discrepancy-review', category: 'Finance', description: 'Scans email and drive for invoice documents → detects line item discrepancies against PO → calculates variance → classifies risk → generates review Action Brief → requires finance approval → creates Proof Packet with evidence chain.', triggerType: 'event', requiredSources: ['email_provider', 'drive_storage', 'spreadsheet_app'], riskLevel: 'medium', proofRequired: true, approvalRequired: true, approvalClass: 'finance', estimatedDuration: '5–8 min', lastRun: new Date(Date.now() - 12 * 3600000).toISOString(), runCount: 23, demoInput: { vendorName: 'CloudOps Inc', invoiceId: 'INV-2026-Q2-047', amount: '$48,200' }, demoOutputSummary: '2 line item discrepancies found ($3,400 variance), risk: medium, finance approval requested, Proof Packet created', mirrorEvalScore: 88 },
  { id: 'sk003', name: 'Revenue Follow-Up', slug: 'revenue-follow-up', category: 'Revenue', description: 'Detects at-risk deals from spreadsheet changes and email threads → identifies account owners → calculates decision latency → drafts personalized follow-up outreach → requires account owner approval → logs to CRM → creates Proof Packet.', triggerType: 'signal', requiredSources: ['spreadsheet_app', 'email_provider'], riskLevel: 'medium', proofRequired: true, approvalRequired: true, approvalClass: 'review', estimatedDuration: '4–6 min', lastRun: new Date(Date.now() - 1 * 86400000).toISOString(), runCount: 62, demoInput: { dealName: 'Acme Corp Renewal', stage: 'Negotiation', daysSinceLastContact: '4' }, demoOutputSummary: 'Decision latency: 4.2 days (above 2-day target), 2 follow-up drafts created for AE review, approval pending', mirrorEvalScore: 86 },
  { id: 'sk004', name: 'Approval Chase', slug: 'approval-chase', category: 'Governance', description: 'Detects stuck approvals → searches WorkGraph for approval evidence → identifies missing approver → calculates decision latency → generates approval-chase Action Brief → requires human review → drafts follow-up → creates Proof Packet → marks outcome pending verification.', triggerType: 'signal', requiredSources: ['email_provider', 'task_manager'], riskLevel: 'high', proofRequired: true, approvalRequired: true, approvalClass: 'executive', estimatedDuration: '3–5 min', lastRun: new Date(Date.now() - 4 * 86400000).toISOString(), runCount: 38, demoInput: { approvalId: 'Acme Corp renewal', stuckDays: '4', revenueAtRisk: '$2.4M' }, demoOutputSummary: 'CFO identified as missing approver, Day 4 latency (SLA: 2 days), escalation draft created, revenue at risk: $2.4M', mirrorEvalScore: 93 },
  { id: 'sk005', name: 'Project Risk Digest', slug: 'project-risk-digest', category: 'Projects', description: 'Aggregates signals from all workspace sources for a project → identifies risks, blockers, and stalled decisions → computes risk score → generates concise risk digest → routes to project owner for review → creates Proof Packet.', triggerType: 'schedule', requiredSources: ['drive_storage', 'task_manager', 'chat_platform', 'spreadsheet_app'], riskLevel: 'low', proofRequired: true, approvalRequired: false, approvalClass: 'auto', estimatedDuration: '6–10 min', lastRun: new Date(Date.now() - 3 * 3600000).toISOString(), runCount: 89, demoInput: { projectName: 'Q2 Revenue Operations', period: 'last_7_days' }, demoOutputSummary: 'Risk score: 72/100 (elevated), 3 blockers identified, 2 stalled decisions, 1 overdue task, digest sent to VP Revenue Ops', mirrorEvalScore: 87 },
  { id: 'sk006', name: 'Board Packet from Workspace', slug: 'board-packet-from-workspace', category: 'Executive', description: 'Aggregates documents, summaries, and metrics from workspace sources → filters by data class policy (restricted content excluded) → generates structured board packet sections → requires CFO/CEO review → creates Proof Packet with evidence refs.', triggerType: 'manual', requiredSources: ['document_editor', 'spreadsheet_app', 'drive_storage'], riskLevel: 'high', proofRequired: true, approvalRequired: true, approvalClass: 'executive', estimatedDuration: '10–15 min', lastRun: new Date(Date.now() - 2 * 86400000).toISOString(), runCount: 12, demoInput: { boardDate: 'Q2 2026 Board Meeting', sections: 'Revenue, Risk, Legal, Operations' }, demoOutputSummary: 'Board packet generated (restricted content masked per DLP), 4 sections drafted, CFO review required before distribution', mirrorEvalScore: 84 },
  { id: 'sk007', name: 'Legal Deadline Proof Review', slug: 'legal-deadline-proof-review', category: 'Legal', description: 'Scans task manager and documents for legal deadlines → cross-references calendar → identifies overdue items → creates per-deadline evidence chain → requires legal team review → generates Proof Packet for compliance record → routes critical deadlines to GC.', triggerType: 'schedule', requiredSources: ['task_manager', 'document_editor', 'calendar_app'], riskLevel: 'high', proofRequired: true, approvalRequired: true, approvalClass: 'legal', estimatedDuration: '8–12 min', lastRun: new Date(Date.now() - 10 * 86400000).toISOString(), runCount: 18, demoInput: { lookAheadDays: '30', projectScope: 'All active matters' }, demoOutputSummary: '3 deadlines at risk (8, 14, 18 days), 1 overdue audit task, Proof Packet with evidence chain created, GC notified', mirrorEvalScore: 90 },
  { id: 'sk008', name: 'Vendor SLA Escalation', slug: 'vendor-sla-escalation', category: 'Vendor', description: 'Detects SLA breach or near-breach from task/email signals → calculates penalty exposure → identifies approval owner → generates escalation Action Brief → requires finance approval for penalty amounts → drafts vendor communication → creates Proof Packet.', triggerType: 'signal', requiredSources: ['task_manager', 'email_provider', 'spreadsheet_app'], riskLevel: 'medium', proofRequired: true, approvalRequired: true, approvalClass: 'finance', estimatedDuration: '5–8 min', lastRun: new Date(Date.now() - 6 * 86400000).toISOString(), runCount: 31, demoInput: { vendorName: 'CloudOps Inc', slaType: 'uptime', penaltyAmount: '$45,000' }, demoOutputSummary: 'Penalty exposure: $45K, Finance Director approval required (Day 6, overdue), escalation draft created with Proof Packet', mirrorEvalScore: 89 },
  { id: 'sk009', name: 'Security Incident Follow-Up', slug: 'security-incident-follow-up', category: 'Security', description: 'Aggregates chat, task, and email signals for a security incident → extracts action items → assigns owners → tracks completion → generates security incident summary → requires security owner review → creates Proof Packet with evidence chain for audit.', triggerType: 'event', requiredSources: ['chat_platform', 'task_manager', 'email_provider'], riskLevel: 'critical', proofRequired: true, approvalRequired: true, approvalClass: 'security', estimatedDuration: '5–10 min', lastRun: new Date(Date.now() - 6 * 3600000).toISOString(), runCount: 7, demoInput: { incidentId: 'SEC-2026-047', severity: 'high', description: 'Unauthorized API access — staging environment' }, demoOutputSummary: 'Token rotation confirmed, 2 open action items tracked, escalation drafted, security Proof Packet created (evidence: 4 sources)', mirrorEvalScore: 95 },
  { id: 'sk010', name: 'Executive Weekly Brief', slug: 'executive-weekly-brief', category: 'Executive', description: 'Aggregates weekly scorecard, key decisions, blockers, and risks across all workspace sources → filters by data class → generates concise executive brief → requires CMO/COO review → personal data masked → creates Proof Packet.', triggerType: 'schedule', requiredSources: ['spreadsheet_app', 'document_editor', 'video_meetings', 'task_manager'], riskLevel: 'medium', proofRequired: true, approvalRequired: true, approvalClass: 'executive', estimatedDuration: '8–12 min', lastRun: new Date(Date.now() - 3 * 3600000).toISOString(), runCount: 42, demoInput: { weekEnding: new Date().toISOString().split('T')[0], scope: 'All domains' }, demoOutputSummary: '3 metrics below threshold flagged, 5 decisions pending, board packet status: in review, executive brief drafted for COO review', mirrorEvalScore: 88 },
];

export const PROJECT_MEMORY: ProjectMemory[] = [
  { id: 'pm001', name: 'Q2 Revenue Operations', owner: 'Sarah Chen', status: 'at_risk', riskLevel: 'high', linkedNodeCount: 12, signalCount: 18, workcellCount: 4, outcomeCount: 2, decisionLatencyDays: 4.2, proofCoverage: 72, lastMeaningfulChange: new Date(Date.now() - 1 * 86400000).toISOString(), recommendedAction: 'Chase Acme Corp CFO approval — Day 4 overdue, $2.4M at risk', summary: 'Q2 actuals in, forecast updated. 2 approvals blocking close. Board packet in legal review.' },
  { id: 'pm002', name: 'Maritime Risk Review', owner: 'Sophie Laurent', status: 'active', riskLevel: 'medium', linkedNodeCount: 8, signalCount: 11, workcellCount: 2, outcomeCount: 1, decisionLatencyDays: 2.1, proofCoverage: 85, lastMeaningfulChange: new Date(Date.now() - 4 * 86400000).toISOString(), recommendedAction: 'Complete port authority notifications for 2 flagged vessels', summary: 'OFAC screening complete. 2 vessels require follow-up. Regulatory notifications drafted.' },
  { id: 'pm003', name: 'Legal Matter Deadline Audit', owner: 'Ana Torres', status: 'blocked', riskLevel: 'critical', linkedNodeCount: 6, signalCount: 9, workcellCount: 1, outcomeCount: 0, decisionLatencyDays: 14.0, proofCoverage: 30, lastMeaningfulChange: new Date(Date.now() - 10 * 86400000).toISOString(), recommendedAction: 'Run Legal Deadline Proof Review immediately — audit overdue by 4 days, 3 deadlines at risk', summary: 'Audit task overdue by 4 days. 3 contract deadlines within 18 days. GC notification required.' },
  { id: 'pm004', name: 'Private Advisory Vendor Controls', owner: 'Marcus Webb', status: 'at_risk', riskLevel: 'high', linkedNodeCount: 7, signalCount: 10, workcellCount: 2, outcomeCount: 1, decisionLatencyDays: 6.5, proofCoverage: 60, lastMeaningfulChange: new Date(Date.now() - 6 * 86400000).toISOString(), recommendedAction: 'Escalate CloudOps SLA penalty approval — Day 6, Finance Director overdue', summary: 'SLA penalty approval blocked. DataStream SLA warning threshold crossed. CFO review needed.' },
  { id: 'pm005', name: 'Security Incident Follow-Up', owner: 'Dev Patel', status: 'active', riskLevel: 'critical', linkedNodeCount: 5, signalCount: 14, workcellCount: 3, outcomeCount: 1, decisionLatencyDays: 0.5, proofCoverage: 80, lastMeaningfulChange: new Date(Date.now() - 6 * 3600000).toISOString(), recommendedAction: 'Complete access audit report and vendor notification — 2 open action items', summary: 'Token rotation complete. Access audit in progress. Proof Packet created. Vendor notification pending.' },
  { id: 'pm006', name: 'Board Packet Preparation', owner: 'Marcus Webb', status: 'active', riskLevel: 'high', linkedNodeCount: 10, signalCount: 8, workcellCount: 3, outcomeCount: 0, decisionLatencyDays: 3.8, proofCoverage: 55, lastMeaningfulChange: new Date(Date.now() - 2 * 86400000).toISOString(), recommendedAction: 'Obtain CFO sign-off on CapEx and vendor penalty before board meeting', summary: 'Board packet in legal review. 2 board sign-offs pending. CapEx LOI blocked.' },
  { id: 'pm007', name: 'Salesforce → RevOps Cleanup', owner: 'James Park', status: 'active', riskLevel: 'medium', linkedNodeCount: 9, signalCount: 6, workcellCount: 2, outcomeCount: 2, decisionLatencyDays: 1.8, proofCoverage: 90, lastMeaningfulChange: new Date(Date.now() - 3 * 86400000).toISOString(), recommendedAction: 'Finalize data hygiene sign-off from Sales Ops Director', summary: 'CRM data cleanup 80% complete. 3 duplicate accounts pending merge. Field mapping complete.' },
  { id: 'pm008', name: 'Property CapEx Review', owner: 'Kenji Watanabe', status: 'active', riskLevel: 'medium', linkedNodeCount: 5, signalCount: 7, workcellCount: 1, outcomeCount: 0, decisionLatencyDays: 3.0, proofCoverage: 65, lastMeaningfulChange: new Date(Date.now() - 3 * 86400000).toISOString(), recommendedAction: 'Board sign-off needed for LOI — environmental clearance pending is blocker', summary: 'CapEx analysis complete. IRR: 14.2%. Board sign-off blocking LOI. Environmental clearance pending.' },
  { id: 'pm009', name: 'Workspace Migration Control', owner: 'IT Ops Team', status: 'at_risk', riskLevel: 'medium', linkedNodeCount: 7, signalCount: 12, workcellCount: 2, outcomeCount: 1, decisionLatencyDays: 2.5, proofCoverage: 70, lastMeaningfulChange: new Date(Date.now() - 2 * 86400000).toISOString(), recommendedAction: 'Unblock 15 restricted-data accounts — legal review required before Phase 2 can proceed', summary: 'Phase 1: 340/400 complete. Phase 2 blocked on 15 accounts. 3 weeks behind schedule.' },
  { id: 'pm010', name: 'Executive Weekly Operating Review', owner: 'Sarah Chen', status: 'active', riskLevel: 'medium', linkedNodeCount: 15, signalCount: 22, workcellCount: 5, outcomeCount: 4, decisionLatencyDays: 1.2, proofCoverage: 88, lastMeaningfulChange: new Date(Date.now() - 2 * 3600000).toISOString(), recommendedAction: 'Review 3 below-threshold metrics before Monday executive briefing', summary: 'Weekly scorecard updated. 3 metrics below threshold: APAC pipeline, onboarding time, incident MTTR.' },
  { id: 'pm011', name: 'AI Governance Compliance', owner: 'Ana Torres', status: 'at_risk', riskLevel: 'high', linkedNodeCount: 6, signalCount: 8, workcellCount: 2, outcomeCount: 0, decisionLatencyDays: 5.0, proofCoverage: 45, lastMeaningfulChange: new Date(Date.now() - 1 * 86400000).toISOString(), recommendedAction: 'Complete AI Governance documentation gaps before Friday audit deadline — 2 items outstanding', summary: 'AI Governance audit due Friday. 2 documentation items outstanding. Compliance and Legal leads assigned.' },
  { id: 'pm012', name: 'Data Residency Policy Review', owner: 'Marcus Webb', status: 'active', riskLevel: 'medium', linkedNodeCount: 4, signalCount: 5, workcellCount: 1, outcomeCount: 0, decisionLatencyDays: 3.2, proofCoverage: 55, lastMeaningfulChange: new Date(Date.now() - 2 * 86400000).toISOString(), recommendedAction: 'Legal opinion on EU data residency required within 8 days — request formal sign-off', summary: 'EU customer data residency legal review in progress. 8 days to response deadline. DPO notified.' },
];

export const PROOF_PACKETS = [
  { id: 'pp001', title: 'Q2 Revenue Operations Review — Action Proof', project: 'Q2 Revenue Operations', skill: 'Meeting to Execution', evidenceCount: 5, status: 'verified', dataClass: 'confidential' as DataClass, createdAt: new Date(Date.now() - 3 * 86400000).toISOString() },
  { id: 'pp002', title: 'Security Incident SEC-2026-047 — Evidence Chain', project: 'Security Incident Follow-Up', skill: 'Security Incident Follow-Up', evidenceCount: 4, status: 'verified', dataClass: 'security' as DataClass, createdAt: new Date(Date.now() - 6 * 3600000).toISOString() },
  { id: 'pp003', title: 'Invoice Discrepancy — CloudOps INV-2026-Q2-047', project: 'Private Advisory Vendor Controls', skill: 'Invoice Discrepancy Review', evidenceCount: 3, status: 'verified', dataClass: 'finance' as DataClass, createdAt: new Date(Date.now() - 12 * 3600000).toISOString() },
  { id: 'pp004', title: 'Vendor SLA Escalation — CloudOps Penalty', project: 'Private Advisory Vendor Controls', skill: 'Vendor SLA Escalation', evidenceCount: 3, status: 'pending_review', dataClass: 'finance' as DataClass, createdAt: new Date(Date.now() - 6 * 86400000).toISOString() },
  { id: 'pp005', title: 'Legal Deadline Proof — 3 At-Risk Matters', project: 'Legal Matter Deadline Audit', skill: 'Legal Deadline Proof Review', evidenceCount: 6, status: 'pending_review', dataClass: 'legal' as DataClass, createdAt: new Date(Date.now() - 10 * 86400000).toISOString() },
  { id: 'pp006', title: 'Q2 Revenue Board Packet — Evidence Refs', project: 'Board Packet Preparation', skill: 'Board Packet from Workspace', evidenceCount: 8, status: 'draft', dataClass: 'restricted' as DataClass, createdAt: new Date(Date.now() - 2 * 86400000).toISOString() },
  { id: 'pp007', title: 'Maritime Risk Review — OFAC Evidence', project: 'Maritime Risk Review', skill: 'Project Risk Digest', evidenceCount: 4, status: 'verified', dataClass: 'regulated' as DataClass, createdAt: new Date(Date.now() - 4 * 86400000).toISOString() },
  { id: 'pp008', title: 'Revenue Follow-Up — Acme Corp Escalation', project: 'Q2 Revenue Operations', skill: 'Revenue Follow-Up', evidenceCount: 2, status: 'draft', dataClass: 'confidential' as DataClass, createdAt: new Date(Date.now() - 1 * 86400000).toISOString() },
  { id: 'pp009', title: 'Executive Weekly Brief — W18 Evidence', project: 'Executive Weekly Operating Review', skill: 'Executive Weekly Brief', evidenceCount: 7, status: 'verified', dataClass: 'confidential' as DataClass, createdAt: new Date(Date.now() - 3 * 3600000).toISOString() },
  { id: 'pp010', title: 'Project Risk Digest — Workspace Migration', project: 'Workspace Migration Control', skill: 'Project Risk Digest', evidenceCount: 3, status: 'draft', dataClass: 'internal' as DataClass, createdAt: new Date(Date.now() - 2 * 86400000).toISOString() },
];

export const SKILL_RUNS: SkillRun[] = [
  { id: 'sr001', skillId: 'sk005', skillName: 'Project Risk Digest', status: 'complete', workcellId: 'wc001', actionBriefSummary: 'Q2 Revenue Ops risk digest: 3 blockers, 2 stalled decisions, 1 overdue task. Risk score 72/100.', mirrorEvalScore: 87, approvalRequired: false, approvalStatus: null, proofPacketId: 'pp001', triggeredAt: new Date(Date.now() - 3 * 3600000).toISOString(), workGraphNodeIds: ['n001', 'n003', 'n005'] },
  { id: 'sr002', skillId: 'sk010', skillName: 'Executive Weekly Brief', status: 'pending_approval', workcellId: 'wc002', actionBriefSummary: 'Week 18 brief: 3 metrics below threshold, 5 decisions pending, board packet in review. COO review required.', mirrorEvalScore: 88, approvalRequired: true, approvalStatus: 'pending', proofPacketId: 'pp009', triggeredAt: new Date(Date.now() - 3 * 3600000).toISOString(), workGraphNodeIds: ['n001', 'n002', 'n004'] },
  { id: 'sr003', skillId: 'sk009', skillName: 'Security Incident Follow-Up', status: 'pending_approval', workcellId: 'wc003', actionBriefSummary: 'INC-2047: token rotation confirmed, 2 open action items, vendor notification draft ready. Security team review required.', mirrorEvalScore: 95, approvalRequired: true, approvalStatus: 'pending', proofPacketId: 'pp002', triggeredAt: new Date(Date.now() - 6 * 3600000).toISOString(), workGraphNodeIds: ['n007', 'n008'] },
  { id: 'sr004', skillId: 'sk002', skillName: 'Invoice Discrepancy Review', status: 'pending_approval', workcellId: 'wc004', actionBriefSummary: 'CloudOps INV-2026-Q2-047: 2 discrepancies ($3,400 variance). Finance approval required before adjustment.', mirrorEvalScore: 88, approvalRequired: true, approvalStatus: 'pending', proofPacketId: 'pp003', triggeredAt: new Date(Date.now() - 12 * 3600000).toISOString(), workGraphNodeIds: ['n006'] },
  { id: 'sr005', skillId: 'sk001', skillName: 'Meeting to Execution', status: 'complete', workcellId: 'wc005', actionBriefSummary: 'Q2 Revenue Ops Review: 5 commitments extracted, 3 owners identified, 2 unresolved decisions flagged. Follow-up drafted.', mirrorEvalScore: 91, approvalRequired: true, approvalStatus: 'approved', proofPacketId: 'pp001', triggeredAt: new Date(Date.now() - 3 * 86400000).toISOString(), workGraphNodeIds: ['n001', 'n002'] },
  { id: 'sr006', skillId: 'sk004', skillName: 'Approval Chase', status: 'complete', workcellId: 'wc006', actionBriefSummary: 'Acme Corp renewal CFO chase: Day 4 latency, escalation draft sent. Revenue at risk: $2.4M. Proof Packet created.', mirrorEvalScore: 93, approvalRequired: true, approvalStatus: 'approved', proofPacketId: 'pp008', triggeredAt: new Date(Date.now() - 4 * 86400000).toISOString(), workGraphNodeIds: ['n003', 'n004'] },
  { id: 'sr007', skillId: 'sk006', skillName: 'Board Packet from Workspace', status: 'pending_approval', workcellId: 'wc007', actionBriefSummary: 'Board packet generated: 4 sections drafted, restricted content masked per DLP, CFO review required.', mirrorEvalScore: 84, approvalRequired: true, approvalStatus: 'pending', proofPacketId: 'pp006', triggeredAt: new Date(Date.now() - 2 * 86400000).toISOString(), workGraphNodeIds: ['n001', 'n009', 'n010'] },
  { id: 'sr008', skillId: 'sk005', skillName: 'Project Risk Digest', status: 'complete', workcellId: 'wc008', actionBriefSummary: 'Maritime Risk Review: OFAC screening complete, 2 vessels require port authority notifications. Risk digest sent.', mirrorEvalScore: 87, approvalRequired: false, approvalStatus: null, proofPacketId: 'pp007', triggeredAt: new Date(Date.now() - 4 * 86400000).toISOString(), workGraphNodeIds: ['n005', 'n006'] },
  { id: 'sr009', skillId: 'sk008', skillName: 'Vendor SLA Escalation', status: 'blocked', workcellId: 'wc009', actionBriefSummary: 'CloudOps SLA penalty: $45K. Finance Director approval overdue Day 6. Escalation blocked pending human review.', mirrorEvalScore: 89, approvalRequired: true, approvalStatus: 'pending', proofPacketId: 'pp004', triggeredAt: new Date(Date.now() - 6 * 86400000).toISOString(), workGraphNodeIds: ['n006', 'n007'] },
  { id: 'sr010', skillId: 'sk005', skillName: 'Project Risk Digest', status: 'complete', workcellId: 'wc010', actionBriefSummary: 'Workspace Migration risk digest: Phase 2 blocked on 15 accounts, 3 weeks behind schedule. Recovery plan drafted.', mirrorEvalScore: 85, approvalRequired: false, approvalStatus: null, proofPacketId: 'pp010', triggeredAt: new Date(Date.now() - 2 * 86400000).toISOString(), workGraphNodeIds: ['n009', 'n010'] },
];

export const DEMO_POLICIES = [
  { id: 'pol001', name: 'Restricted docs blocked from external messages', dataClass: 'restricted' as DataClass, rule: 'Restricted documents cannot be summarized into outbound email, chat, or external Action Briefs. Proof reference only.', enforced: true, blockedActions: ['email_draft', 'chat_message', 'external_brief'] },
  { id: 'pol002', name: 'Legal content requires human review', dataClass: 'legal' as DataClass, rule: 'Any action involving legal data class must route to a human reviewer before execution. Auto-execution blocked.', enforced: true, blockedActions: ['auto_execute', 'bulk_send'] },
  { id: 'pol003', name: 'Finance actions require finance approval', dataClass: 'finance' as DataClass, rule: 'Any workflow action involving financial data (payments, invoices, contract values) requires finance team approval.', enforced: true, blockedActions: ['auto_execute', 'external_send'] },
  { id: 'pol004', name: 'Customer-facing drafts require account owner review', dataClass: 'confidential' as DataClass, rule: 'Outbound drafts referencing customer accounts must be reviewed and approved by the account owner before sending.', enforced: true, blockedActions: ['auto_send'] },
  { id: 'pol005', name: 'Security events require security owner review', dataClass: 'security' as DataClass, rule: 'All actions triggered by security events must be reviewed by the security team before execution.', enforced: true, blockedActions: ['auto_execute', 'external_send'] },
  { id: 'pol006', name: 'Cross-domain connector access requires admin approval', dataClass: 'internal' as DataClass, rule: 'Granting any connector access across organizational domains requires explicit admin approval.', enforced: true, blockedActions: ['auto_approve_connector'] },
  { id: 'pol007', name: 'Personal data masked in Board Packets', dataClass: 'personal' as DataClass, rule: 'Personal identifiable information is automatically masked when aggregating content for board-level documents.', enforced: true, blockedActions: ['include_in_board_packet'] },
];

export function formatRelativeWG(ts: string | null): string {
  if (!ts) return '—';
  const ms = Date.now() - new Date(ts).getTime();
  if (ms < 60000) return 'just now';
  if (ms < 3600000) return `${Math.floor(ms / 60000)}m ago`;
  if (ms < 86400000) return `${Math.floor(ms / 3600000)}h ago`;
  return `${Math.floor(ms / 86400000)}d ago`;
}

export const DATA_CLASS_CONFIG: Record<DataClass, { color: string; bg: string; label: string }> = {
  public: { color: '#6b7280', bg: 'rgba(107,114,128,0.1)', label: 'Public' },
  internal: { color: '#4B8BDB', bg: 'rgba(75,139,219,0.1)', label: 'Internal' },
  confidential: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', label: 'Confidential' },
  restricted: { color: '#ef4444', bg: 'rgba(239,68,68,0.1)', label: 'Restricted' },
  legal: { color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)', label: 'Legal' },
  finance: { color: '#10b981', bg: 'rgba(16,185,129,0.1)', label: 'Finance' },
  security: { color: '#ef4444', bg: 'rgba(239,68,68,0.1)', label: 'Security' },
  personal: { color: '#f97316', bg: 'rgba(249,115,22,0.1)', label: 'Personal' },
  regulated: { color: '#a855f7', bg: 'rgba(168,85,247,0.1)', label: 'Regulated' },
};

export const RISK_CONFIG: Record<RiskLevel, { color: string; bg: string; label: string }> = {
  low: { color: '#10b981', bg: 'rgba(16,185,129,0.1)', label: 'Low' },
  medium: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', label: 'Medium' },
  high: { color: '#f97316', bg: 'rgba(249,115,22,0.1)', label: 'High' },
  critical: { color: '#ef4444', bg: 'rgba(239,68,68,0.1)', label: 'Critical' },
};

export const SOURCE_LABELS: Record<string, string> = {
  email_provider: 'Email',
  drive_storage: 'Drive',
  document_editor: 'Docs',
  spreadsheet_app: 'Sheets',
  slide_creator: 'Slides',
  calendar_app: 'Calendar',
  chat_platform: 'Chat',
  video_meetings: 'Meetings',
  task_manager: 'Tasks',
  workspace_events: 'Events',
  internal: 'Internal',
};
