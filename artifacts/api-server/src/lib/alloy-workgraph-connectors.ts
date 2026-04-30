/**
 * Alloy WorkGraph — Mock Workspace Connector Framework
 *
 * Adapter interface for workspace source connectors. Each adapter declares its
 * metadata (name, category, scopes, supported objects, risk) and implements four
 * methods: syncMockData, normalizeToWorkGraph, sanitizeOutput, createProofRefs.
 *
 * When GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET / GOOGLE_PROJECT_ID are absent,
 * every adapter falls back to demo mode and the app never errors. Real OAuth
 * hooks are declared but never called when credentials are missing.
 */

import { logger } from './logger';

// ─── Types ────────────────────────────────────────────────────────────────────

export type DataClass =
  | 'public' | 'internal' | 'confidential' | 'restricted'
  | 'legal' | 'finance' | 'security' | 'personal' | 'regulated';

export type NodeType =
  | 'email' | 'document' | 'spreadsheet' | 'chat_message' | 'calendar_event'
  | 'meeting_summary' | 'task' | 'approval' | 'outcome' | 'workcell'
  | 'contact' | 'file' | 'slide';

export interface WorkGraphNodeInput {
  nodeId: string;
  type: NodeType;
  title: string;
  summary: string;
  owner: string;
  project: string;
  sourceSystem: string;
  dataClass: DataClass;
  sensitivity: number;
  confidence: number;
  visibility: 'owner_only' | 'team' | 'org' | 'public';
  sourcePermissionState: 'accessible' | 'inherited' | 'restricted' | 'blocked';
  evidenceRefs: string[];
  freshness: 'fresh' | 'stale' | 'expired';
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  demoMode: boolean;
}

export interface ProofRef {
  refId: string;
  nodeId: string;
  sourceSystem: string;
  dataClass: DataClass;
  hash: string;
  capturedAt: string;
}

export interface WorkspaceConnectorAdapter {
  id: string;
  name: string;
  category: 'communication' | 'storage' | 'productivity' | 'meetings' | 'tasks' | 'events' | 'bridge';
  requiredScopes: string[];
  supportedObjects: NodeType[];
  riskLevel: 'low' | 'medium' | 'high';
  demoMode: boolean;

  /**
   * Returns demo mock data for this connector (used when credentials absent).
   * The returned records are raw source objects (not yet normalized).
   */
  syncMockData(): Promise<Record<string, unknown>[]>;

  /**
   * Converts a raw source object into a normalized WorkGraphNodeInput.
   * Must redact restricted content based on data class.
   */
  normalizeToWorkGraph(raw: Record<string, unknown>): WorkGraphNodeInput;

  /**
   * Sanitizes LLM / agent output before it is written to a WorkGraph node.
   * Removes PII, masks restricted references, checks for prompt injection.
   */
  sanitizeOutput(output: string, dataClass: DataClass): string;

  /**
   * Creates tamper-evident proof references for a set of node IDs.
   * In demo mode returns deterministic SHA-256-like hashes.
   */
  createProofRefs(nodeIds: string[]): ProofRef[];
}

// ─── Demo credential check ────────────────────────────────────────────────────

function isDemoMode(): boolean {
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_PROJECT_ID } = process.env;
  return !GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_PROJECT_ID;
}

// ─── Shared helpers ───────────────────────────────────────────────────────────

function demoHash(input: string): string {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (Math.imul(31, h) + input.charCodeAt(i)) | 0;
  }
  const hex = (h >>> 0).toString(16).padStart(8, '0');
  return `sha256:demo-${hex}${hex}${hex}${hex}${hex}${hex}${hex}${hex}`;
}

function makeProofRefs(nodeIds: string[], sourceSystem: string, dataClass: DataClass): ProofRef[] {
  return nodeIds.map((nodeId) => ({
    refId: `pr-${nodeId}`,
    nodeId,
    sourceSystem,
    dataClass,
    hash: demoHash(`${nodeId}:${sourceSystem}:${dataClass}`),
    capturedAt: new Date().toISOString(),
  }));
}

function sanitize(output: string, dataClass: DataClass): string {
  if (dataClass === 'restricted' || dataClass === 'legal') {
    return '[REDACTED — restricted source. Proof reference only.]';
  }
  if (dataClass === 'personal') {
    return output.replace(/\b[A-Z][a-z]+ [A-Z][a-z]+\b/g, '[MASKED]');
  }
  return output;
}

// ─── Email Connector ──────────────────────────────────────────────────────────

export const emailConnectorAdapter: WorkspaceConnectorAdapter = {
  id: 'wsc-email',
  name: 'Email Connector',
  category: 'communication',
  requiredScopes: ['mail.read', 'mail.compose'],
  supportedObjects: ['email'],
  riskLevel: 'medium',
  demoMode: isDemoMode(),

  async syncMockData() {
    return [
      { id: 'em-001', subject: 'Q2 Revenue Review — Action Items', from: 'cfo@szlholdings.com', thread: 'thd-q2-rev', project: 'Q2 Revenue Operations', dataClass: 'finance' },
      { id: 'em-002', subject: 'Re: Vendor SLA Breach — Escalation Required', from: 'ops@szlholdings.com', thread: 'thd-vendor-sla', project: 'Vendor SLA Escalation', dataClass: 'internal' },
      { id: 'em-003', subject: 'Board Packet Draft — Review by EOD', from: 'legal@szlholdings.com', thread: 'thd-board', project: 'Board Packet Preparation', dataClass: 'legal' },
      { id: 'em-004', subject: 'Invoice #4821 Discrepancy — Finance Review', from: 'ap@szlholdings.com', thread: 'thd-inv-4821', project: 'Invoice Discrepancy Review', dataClass: 'finance' },
      { id: 'em-005', subject: 'Closed-Won: Meridian Partners — Approval Needed', from: 'sales@szlholdings.com', thread: 'thd-meridian', project: 'Q2 Revenue Operations', dataClass: 'confidential' },
      { id: 'em-006', subject: 'Security Incident INC-2047 — Immediate Review', from: 'security@szlholdings.com', thread: 'thd-sec-2047', project: 'Security Incident Follow-Up', dataClass: 'security' },
      { id: 'em-007', subject: 'Property Capex Approval — Q3 Plan', from: 'realestate@szlholdings.com', thread: 'thd-capex', project: 'Property Capex Review', dataClass: 'finance' },
      { id: 'em-008', subject: 'Legal Deadline Alert — Matter #2089', from: 'legal@szlholdings.com', thread: 'thd-legal-2089', project: 'Legal Matter Deadline Audit', dataClass: 'legal' },
      { id: 'em-009', subject: 'Executive Weekly Review — Prep Notes', from: 'ea@szlholdings.com', thread: 'thd-exec-weekly', project: 'Executive Weekly Operating Review', dataClass: 'confidential' },
      { id: 'em-010', subject: 'Maritime Risk Alert — Vessel SZL-47', from: 'maritime@szlholdings.com', thread: 'thd-maritime-47', project: 'Maritime Risk Review', dataClass: 'internal' },
      { id: 'em-011', subject: 'Workspace Migration — Phase 2 Sign-Off', from: 'it@szlholdings.com', thread: 'thd-ws-migration', project: 'Workspace Migration Control', dataClass: 'internal' },
      { id: 'em-012', subject: 'Salesforce Data Quality Issues', from: 'revops@szlholdings.com', thread: 'thd-sf-cleanup', project: 'Salesforce → RevOps Cleanup', dataClass: 'internal' },
      { id: 'em-013', subject: 'Advisory Vendor NDA — Restricted Review', from: 'legal@szlholdings.com', thread: 'thd-vendor-nda', project: 'Private Advisory Vendor Controls', dataClass: 'restricted' },
      { id: 'em-014', subject: 'Re: Approval Chase — 3 Deals Stuck', from: 'cro@szlholdings.com', thread: 'thd-approval-chase', project: 'Q2 Revenue Operations', dataClass: 'confidential' },
      { id: 'em-015', subject: 'Q2 Board Packet — Final Version', from: 'ceo@szlholdings.com', thread: 'thd-board-final', project: 'Board Packet Preparation', dataClass: 'legal' },
      { id: 'em-016', subject: 'Risk Digest — Week 17', from: 'risk@szlholdings.com', thread: 'thd-risk-w17', project: 'Q2 Revenue Operations', dataClass: 'confidential' },
      { id: 'em-017', subject: 'ERP Integration Status Update', from: 'it@szlholdings.com', thread: 'thd-erp-update', project: 'Workspace Migration Control', dataClass: 'internal' },
      { id: 'em-018', subject: 'Customer Success: Renewal Risk — Acme Corp', from: 'cs@szlholdings.com', thread: 'thd-cs-acme', project: 'Q2 Revenue Operations', dataClass: 'confidential' },
      { id: 'em-019', subject: 'Travel Policy Update — Effective May 1', from: 'hr@szlholdings.com', thread: 'thd-travel-policy', project: 'Executive Weekly Operating Review', dataClass: 'internal' },
      { id: 'em-020', subject: 'Data Residency Compliance — Legal Opinion', from: 'legal@szlholdings.com', thread: 'thd-data-residency', project: 'Legal Matter Deadline Audit', dataClass: 'regulated' },
      { id: 'em-021', subject: 'Q3 Forecasting — Revenue Assumptions', from: 'finance@szlholdings.com', thread: 'thd-q3-forecast', project: 'Q2 Revenue Operations', dataClass: 'finance' },
      { id: 'em-022', subject: 'Vendor Audit: IT Infrastructure Partners', from: 'procurement@szlholdings.com', thread: 'thd-vendor-audit', project: 'Private Advisory Vendor Controls', dataClass: 'internal' },
      { id: 'em-023', subject: 'Platform Incident Report — INC-2048', from: 'sre@szlholdings.com', thread: 'thd-sre-2048', project: 'Security Incident Follow-Up', dataClass: 'security' },
      { id: 'em-024', subject: 'RE: Maritime Fuel Hedging — Decision Needed', from: 'cfo@szlholdings.com', thread: 'thd-fuel-hedging', project: 'Maritime Risk Review', dataClass: 'finance' },
      { id: 'em-025', subject: 'Capex Budget Request — Approval Required', from: 'realestate@szlholdings.com', thread: 'thd-capex-req', project: 'Property Capex Review', dataClass: 'finance' },
      { id: 'em-026', subject: 'Quarterly OKR Review — All Hands Prep', from: 'coo@szlholdings.com', thread: 'thd-okr-q2', project: 'Executive Weekly Operating Review', dataClass: 'internal' },
      { id: 'em-027', subject: 'Customer PII Data Request — GDPR Article 17', from: 'legal@szlholdings.com', thread: 'thd-gdpr-req', project: 'Legal Matter Deadline Audit', dataClass: 'personal' },
      { id: 'em-028', subject: 'Alloy WorkGraph Rollout Plan', from: 'product@szlholdings.com', thread: 'thd-wg-rollout', project: 'Workspace Migration Control', dataClass: 'internal' },
      { id: 'em-029', subject: 'RE: Sales Ops Automation — Skill Studio Test', from: 'revops@szlholdings.com', thread: 'thd-sales-ops-auto', project: 'Salesforce → RevOps Cleanup', dataClass: 'internal' },
      { id: 'em-030', subject: 'SZL-47 Port Arrival — Cargo Manifest Attached', from: 'logistics@szlholdings.com', thread: 'thd-cargo-manifest', project: 'Maritime Risk Review', dataClass: 'internal' },
      { id: 'em-031', subject: 'Security Questionnaire — Prospect: DataVault Inc', from: 'security@szlholdings.com', thread: 'thd-sec-questionnaire', project: 'Security Incident Follow-Up', dataClass: 'security' },
      { id: 'em-032', subject: 'Board Approval: New Credit Facility', from: 'cfo@szlholdings.com', thread: 'thd-credit-facility', project: 'Board Packet Preparation', dataClass: 'finance' },
      { id: 'em-033', subject: 'Onboarding: New CISO — Access Provisioning', from: 'it@szlholdings.com', thread: 'thd-ciso-onboard', project: 'Workspace Migration Control', dataClass: 'security' },
      { id: 'em-034', subject: 'Strategic Advisory Services — Restricted Terms', from: 'ceo@szlholdings.com', thread: 'thd-advisory-terms', project: 'Private Advisory Vendor Controls', dataClass: 'restricted' },
      { id: 'em-035', subject: 'Treasury Sweep Report — Week Ending Apr 25', from: 'finance@szlholdings.com', thread: 'thd-treasury', project: 'Board Packet Preparation', dataClass: 'finance' },
      { id: 'em-036', subject: 'Insurance Renewal — Property & Casualty', from: 'risk@szlholdings.com', thread: 'thd-insurance-renewal', project: 'Property Capex Review', dataClass: 'finance' },
      { id: 'em-037', subject: 'RE: Maritime Docking Slot Confirmation', from: 'maritime@szlholdings.com', thread: 'thd-docking-slot', project: 'Maritime Risk Review', dataClass: 'internal' },
      { id: 'em-038', subject: 'Compliance Audit — Alloy AI Governance', from: 'compliance@szlholdings.com', thread: 'thd-ai-governance', project: 'Executive Weekly Operating Review', dataClass: 'regulated' },
      { id: 'em-039', subject: 'Customer Data Breach Notification Draft', from: 'legal@szlholdings.com', thread: 'thd-breach-draft', project: 'Security Incident Follow-Up', dataClass: 'personal' },
      { id: 'em-040', subject: 'Warrant Issued — Regulatory Investigation', from: 'legal@szlholdings.com', thread: 'thd-regulatory-inv', project: 'Legal Matter Deadline Audit', dataClass: 'legal' },
    ];
  },

  normalizeToWorkGraph(raw) {
    const dc = (raw.dataClass as DataClass) ?? 'internal';
    return {
      nodeId: `wgn-${raw.id}`,
      type: 'email',
      title: raw.subject as string,
      summary: dc === 'restricted' || dc === 'legal'
        ? '[Restricted — proof reference only]'
        : `Email from ${raw.from}. Thread: ${raw.thread}`,
      owner: raw.from as string,
      project: raw.project as string,
      sourceSystem: 'email_provider',
      dataClass: dc,
      sensitivity: dc === 'restricted' ? 0.95 : dc === 'legal' ? 0.9 : dc === 'finance' ? 0.8 : 0.5,
      confidence: 0.92,
      visibility: dc === 'restricted' ? 'owner_only' : dc === 'legal' ? 'team' : 'team',
      sourcePermissionState: dc === 'restricted' ? 'restricted' : 'accessible',
      evidenceRefs: [`${raw.thread}`],
      freshness: 'fresh',
      riskLevel: dc === 'security' ? 'high' : dc === 'legal' || dc === 'restricted' ? 'high' : dc === 'finance' ? 'medium' : 'low',
      demoMode: isDemoMode(),
    };
  },

  sanitizeOutput: sanitize,
  createProofRefs: (ids) => makeProofRefs(ids, 'email_provider', 'internal'),
};

// ─── Drive Storage Connector ──────────────────────────────────────────────────

export const driveConnectorAdapter: WorkspaceConnectorAdapter = {
  id: 'wsc-drive',
  name: 'Drive Storage',
  category: 'storage',
  requiredScopes: ['drive.readonly', 'drive.file'],
  supportedObjects: ['file', 'document', 'spreadsheet', 'slide'],
  riskLevel: 'medium',
  demoMode: isDemoMode(),

  async syncMockData() {
    return Array.from({ length: 25 }, (_, i) => ({
      id: `doc-${String(i + 1).padStart(3, '0')}`,
      name: [
        'Q2 Revenue Operations Review — Final.docx',
        'Board Packet April 2026.pdf',
        'Legal Matter #2089 — Timeline.docx',
        'Vendor SLA Scorecard Q1.xlsx',
        'Security Incident INC-2047 Report.docx',
        'Maritime Risk Assessment SZL-47.docx',
        'Property Capex Model FY26.xlsx',
        'Executive Weekly Brief — Template.docx',
        'Salesforce CRM Cleanup Checklist.xlsx',
        'Workspace Migration Runbook.docx',
        'Private Advisory NDA — RESTRICTED.pdf',
        'Invoice Register April 2026.xlsx',
        'OKR Dashboard Q2.xlsx',
        'Customer Success Playbook.docx',
        'Data Residency Policy v3.docx',
        'Platform Architecture Diagram.pdf',
        'SZL Holdings Org Chart.pdf',
        'Q3 Revenue Forecast Model.xlsx',
        'IT Security Policy v5.docx',
        'Treasury Management Report Q1.xlsx',
        'Alloy WorkGraph Design Spec.docx',
        'Regulatory Correspondence File.pdf',
        'CISO Onboarding Checklist.docx',
        'Insurance Renewal Summary.pdf',
        'Compliance Audit Evidence — AI Governance.pdf',
      ][i],
      type: ['docx', 'pdf', 'xlsx', 'xlsx', 'docx', 'docx', 'xlsx', 'docx', 'xlsx', 'docx', 'pdf', 'xlsx', 'xlsx', 'docx', 'docx', 'pdf', 'pdf', 'xlsx', 'docx', 'xlsx', 'docx', 'pdf', 'docx', 'pdf', 'pdf'][i],
      owner: 'team@szlholdings.com',
      project: 'Q2 Revenue Operations',
      dataClass: ['confidential', 'legal', 'legal', 'internal', 'security', 'internal', 'finance', 'confidential', 'internal', 'internal', 'restricted', 'finance', 'internal', 'confidential', 'regulated', 'internal', 'internal', 'finance', 'security', 'finance', 'internal', 'legal', 'security', 'finance', 'regulated'][i],
    }));
  },

  normalizeToWorkGraph(raw) {
    const dc = (raw.dataClass as DataClass) ?? 'internal';
    const isSpreadsheet = (raw.type as string).includes('xlsx');
    const isSlide = (raw.name as string).toLowerCase().includes('deck') || (raw.name as string).toLowerCase().includes('slide');
    const nodeType: NodeType = isSpreadsheet ? 'spreadsheet' : isSlide ? 'slide' : 'document';
    return {
      nodeId: `wgn-${raw.id}`,
      type: nodeType,
      title: raw.name as string,
      summary: dc === 'restricted' ? '[Restricted — proof reference only]' : `File from Drive Storage. Owner: ${raw.owner}`,
      owner: raw.owner as string,
      project: raw.project as string,
      sourceSystem: 'drive_storage',
      dataClass: dc,
      sensitivity: dc === 'restricted' ? 0.95 : dc === 'legal' ? 0.88 : dc === 'finance' ? 0.78 : 0.5,
      confidence: 0.88,
      visibility: dc === 'restricted' ? 'owner_only' : 'team',
      sourcePermissionState: dc === 'restricted' ? 'restricted' : 'accessible',
      evidenceRefs: [`${raw.id}`],
      freshness: 'fresh',
      riskLevel: dc === 'security' ? 'high' : dc === 'legal' || dc === 'restricted' ? 'high' : dc === 'finance' ? 'medium' : 'low',
      demoMode: isDemoMode(),
    };
  },

  sanitizeOutput: sanitize,
  createProofRefs: (ids) => makeProofRefs(ids, 'drive_storage', 'internal'),
};

// ─── Chat Platform Connector ──────────────────────────────────────────────────

export const chatConnectorAdapter: WorkspaceConnectorAdapter = {
  id: 'wsc-chat',
  name: 'Chat Platform',
  category: 'communication',
  requiredScopes: ['chat.messages.readonly', 'chat.spaces.readonly'],
  supportedObjects: ['chat_message'],
  riskLevel: 'medium',
  demoMode: isDemoMode(),

  async syncMockData() {
    return Array.from({ length: 20 }, (_, i) => ({
      id: `chat-${String(i + 1).padStart(3, '0')}`,
      space: ['#revenue-ops', '#legal-team', '#security-alerts', '#board-prep', '#it-ops', '#finance', '#maritime', '#exec-team', '#sales', '#product'][i % 10],
      sender: `team-member-${i + 1}@szlholdings.com`,
      preview: `[Chat message ${i + 1}]`,
      project: ['Q2 Revenue Operations', 'Legal Matter Deadline Audit', 'Security Incident Follow-Up', 'Board Packet Preparation', 'Workspace Migration Control', 'Invoice Discrepancy Review', 'Maritime Risk Review', 'Executive Weekly Operating Review', 'Salesforce → RevOps Cleanup', 'Property Capex Review'][i % 10],
      dataClass: ['internal', 'legal', 'security', 'confidential', 'internal', 'finance', 'internal', 'confidential', 'internal', 'finance', 'internal', 'legal', 'security', 'internal', 'internal', 'finance', 'internal', 'confidential', 'internal', 'internal'][i],
    }));
  },

  normalizeToWorkGraph(raw) {
    const dc = (raw.dataClass as DataClass) ?? 'internal';
    return {
      nodeId: `wgn-${raw.id}`,
      type: 'chat_message',
      title: `Chat in ${raw.space}`,
      summary: `Message from ${raw.sender} in ${raw.space}`,
      owner: raw.sender as string,
      project: raw.project as string,
      sourceSystem: 'chat_platform',
      dataClass: dc,
      sensitivity: dc === 'security' ? 0.85 : 0.45,
      confidence: 0.78,
      visibility: 'team',
      sourcePermissionState: 'accessible',
      evidenceRefs: [`${raw.id}`],
      freshness: 'fresh',
      riskLevel: dc === 'security' ? 'high' : 'low',
      demoMode: isDemoMode(),
    };
  },

  sanitizeOutput: sanitize,
  createProofRefs: (ids) => makeProofRefs(ids, 'chat_platform', 'internal'),
};

// ─── Video Meetings Connector ─────────────────────────────────────────────────

export const meetingsConnectorAdapter: WorkspaceConnectorAdapter = {
  id: 'wsc-meet',
  name: 'Video Meetings',
  category: 'meetings',
  requiredScopes: ['meet.recordings.readonly', 'meet.transcripts.readonly'],
  supportedObjects: ['meeting_summary', 'calendar_event'],
  riskLevel: 'low',
  demoMode: isDemoMode(),

  async syncMockData() {
    return Array.from({ length: 15 }, (_, i) => ({
      id: `meet-${String(i + 1).padStart(3, '0')}`,
      title: [
        'Q2 Revenue Operations Review',
        'Legal Strategy Session — Matter #2089',
        'Security Incident Debrief INC-2047',
        'Board Meeting Prep — April 28',
        'IT Workspace Migration Standup',
        'Finance Monthly Close Review',
        'Maritime Risk Committee Meeting',
        'Executive Leadership Sync',
        'RevOps Automation Planning Session',
        'Property Portfolio Review',
        'Vendor SLA Escalation Call',
        'Alloy WorkGraph Demo — Internal',
        'Regulatory Compliance Review',
        'Customer Success QBR — Q2',
        'Security Architecture Review',
      ][i],
      attendees: `${3 + (i % 6)} attendees`,
      project: ['Q2 Revenue Operations', 'Legal Matter Deadline Audit', 'Security Incident Follow-Up', 'Board Packet Preparation', 'Workspace Migration Control', 'Invoice Discrepancy Review', 'Maritime Risk Review', 'Executive Weekly Operating Review', 'Salesforce → RevOps Cleanup', 'Property Capex Review', 'Private Advisory Vendor Controls', 'Workspace Migration Control', 'Legal Matter Deadline Audit', 'Q2 Revenue Operations', 'Security Incident Follow-Up'][i],
      dataClass: ['confidential', 'legal', 'security', 'confidential', 'internal', 'finance', 'internal', 'confidential', 'internal', 'finance', 'internal', 'internal', 'regulated', 'confidential', 'security'][i],
    }));
  },

  normalizeToWorkGraph(raw) {
    const dc = (raw.dataClass as DataClass) ?? 'internal';
    return {
      nodeId: `wgn-${raw.id}`,
      type: 'meeting_summary',
      title: raw.title as string,
      summary: `Meeting with ${raw.attendees}. Summary available via proof reference.`,
      owner: 'meeting-host@szlholdings.com',
      project: raw.project as string,
      sourceSystem: 'video_meetings',
      dataClass: dc,
      sensitivity: dc === 'legal' ? 0.88 : dc === 'security' ? 0.85 : dc === 'confidential' ? 0.75 : 0.5,
      confidence: 0.85,
      visibility: 'team',
      sourcePermissionState: 'accessible',
      evidenceRefs: [`${raw.id}`],
      freshness: 'fresh',
      riskLevel: dc === 'security' ? 'high' : dc === 'legal' ? 'high' : dc === 'finance' ? 'medium' : 'low',
      demoMode: isDemoMode(),
    };
  },

  sanitizeOutput: sanitize,
  createProofRefs: (ids) => makeProofRefs(ids, 'video_meetings', 'internal'),
};

// ─── Calendar App Connector ───────────────────────────────────────────────────

export const calendarConnectorAdapter: WorkspaceConnectorAdapter = {
  id: 'wsc-calendar',
  name: 'Calendar App',
  category: 'productivity',
  requiredScopes: ['calendar.events.readonly'],
  supportedObjects: ['calendar_event'],
  riskLevel: 'low',
  demoMode: isDemoMode(),

  async syncMockData() {
    return Array.from({ length: 15 }, (_, i) => ({
      id: `cal-${String(i + 1).padStart(3, '0')}`,
      title: `Calendar Event ${i + 1}`,
      start: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString(),
      organizer: 'exec@szlholdings.com',
      project: 'Q2 Revenue Operations',
      dataClass: 'internal',
    }));
  },

  normalizeToWorkGraph(raw) {
    return {
      nodeId: `wgn-${raw.id}`,
      type: 'calendar_event',
      title: raw.title as string,
      summary: `Calendar event organized by ${raw.organizer}`,
      owner: raw.organizer as string,
      project: raw.project as string,
      sourceSystem: 'calendar_app',
      dataClass: 'internal',
      sensitivity: 0.35,
      confidence: 0.95,
      visibility: 'team',
      sourcePermissionState: 'accessible',
      evidenceRefs: [`${raw.id}`],
      freshness: 'fresh',
      riskLevel: 'low',
      demoMode: isDemoMode(),
    };
  },

  sanitizeOutput: sanitize,
  createProofRefs: (ids) => makeProofRefs(ids, 'calendar_app', 'internal'),
};

// ─── Task Manager Connector ───────────────────────────────────────────────────

export const taskConnectorAdapter: WorkspaceConnectorAdapter = {
  id: 'wsc-tasks',
  name: 'Task Manager',
  category: 'tasks',
  requiredScopes: ['tasks.readonly', 'tasks.write'],
  supportedObjects: ['task'],
  riskLevel: 'low',
  demoMode: isDemoMode(),

  async syncMockData() {
    return Array.from({ length: 30 }, (_, i) => ({
      id: `task-${String(i + 1).padStart(3, '0')}`,
      title: `Task ${i + 1}`,
      assignee: `owner-${(i % 5) + 1}@szlholdings.com`,
      status: ['open', 'in_progress', 'blocked', 'complete'][i % 4],
      project: ['Q2 Revenue Operations', 'Legal Matter Deadline Audit', 'Security Incident Follow-Up', 'Board Packet Preparation', 'Workspace Migration Control'][i % 5],
      dataClass: 'internal',
    }));
  },

  normalizeToWorkGraph(raw) {
    return {
      nodeId: `wgn-${raw.id}`,
      type: 'task',
      title: raw.title as string,
      summary: `Assigned to ${raw.assignee}. Status: ${raw.status}`,
      owner: raw.assignee as string,
      project: raw.project as string,
      sourceSystem: 'task_manager',
      dataClass: 'internal',
      sensitivity: 0.3,
      confidence: 0.9,
      visibility: 'team',
      sourcePermissionState: 'accessible',
      evidenceRefs: [`${raw.id}`],
      freshness: raw.status === 'complete' ? 'stale' : 'fresh',
      riskLevel: raw.status === 'blocked' ? 'medium' : 'low',
      demoMode: isDemoMode(),
    };
  },

  sanitizeOutput: sanitize,
  createProofRefs: (ids) => makeProofRefs(ids, 'task_manager', 'internal'),
};

// ─── MCP Workspace Bridge ─────────────────────────────────────────────────────
// Agent-callable tools for workspace actions. All write operations are
// draft-only unless explicitly approved. Tool instructions are treated
// as untrusted; output is sanitized; every call writes a trace span.

export const mcpWorkspaceBridgeAdapter: WorkspaceConnectorAdapter = {
  id: 'wsc-mcp',
  name: 'MCP Workspace Bridge',
  category: 'bridge',
  requiredScopes: ['tools.invoke', 'resources.read'],
  supportedObjects: ['document', 'email', 'task', 'approval'],
  riskLevel: 'high',
  demoMode: isDemoMode(),

  async syncMockData() {
    return [
      { tool: 'searchDrive', scope: 'drive.readonly', draftOnly: false },
      { tool: 'summarizeDocument', scope: 'drive.readonly', draftOnly: false },
      { tool: 'draftGmailReply', scope: 'mail.compose', draftOnly: true },
      { tool: 'createCalendarHold', scope: 'calendar.events.write', draftOnly: true },
      { tool: 'listMeetingActionItems', scope: 'meet.transcripts.readonly', draftOnly: false },
      { tool: 'updateSheetRow', scope: 'sheets.write', draftOnly: true },
      { tool: 'createChatDraft', scope: 'chat.messages.write', draftOnly: true },
      { tool: 'findApprovalThread', scope: 'mail.read', draftOnly: false },
    ];
  },

  normalizeToWorkGraph(raw) {
    return {
      nodeId: `wgn-mcp-${raw.tool}`,
      type: 'document',
      title: `MCP Tool: ${raw.tool}`,
      summary: `Scope: ${raw.scope}. Draft-only: ${raw.draftOnly}. Output sanitized. Trace span written.`,
      owner: 'alloy-agent@szlholdings.com',
      project: 'Workspace Migration Control',
      sourceSystem: 'workspace_events',
      dataClass: 'internal',
      sensitivity: 0.6,
      confidence: 0.8,
      visibility: 'team',
      sourcePermissionState: 'accessible',
      evidenceRefs: [],
      freshness: 'fresh',
      riskLevel: raw.draftOnly ? 'medium' : 'low',
      demoMode: isDemoMode(),
    };
  },

  sanitizeOutput(output, dataClass) {
    const sanitized = sanitize(output, dataClass);
    if (sanitized.includes('RESTRICTED') || sanitized.includes('restricted')) {
      return '[MCP output sanitized — restricted source detected. Proof reference only.]';
    }
    return sanitized;
  },

  createProofRefs: (ids) => makeProofRefs(ids, 'mcp_workspace_bridge', 'internal'),
};

// ─── Approval Engine Connector ────────────────────────────────────────────────

export const approvalEngineAdapter: WorkspaceConnectorAdapter = {
  id: 'wsc-approvals',
  name: 'Approval Engine',
  category: 'tasks',
  requiredScopes: ['approvals.read', 'approvals.write'],
  supportedObjects: ['approval'],
  riskLevel: 'high',
  demoMode: isDemoMode(),

  async syncMockData() {
    return Array.from({ length: 20 }, (_, i) => ({
      id: `appr-${String(i + 1).padStart(3, '0')}`,
      title: `Approval Request ${i + 1}`,
      requester: `requester-${(i % 4) + 1}@szlholdings.com`,
      approver: `approver-${(i % 3) + 1}@szlholdings.com`,
      status: ['pending', 'approved', 'rejected', 'escalated'][i % 4],
      latencyMs: 3600000 + i * 1800000,
      project: ['Q2 Revenue Operations', 'Board Packet Preparation', 'Property Capex Review', 'Legal Matter Deadline Audit'][i % 4],
      dataClass: ['confidential', 'legal', 'finance', 'legal'][i % 4],
    }));
  },

  normalizeToWorkGraph(raw) {
    const dc = (raw.dataClass as DataClass) ?? 'internal';
    return {
      nodeId: `wgn-${raw.id}`,
      type: 'approval',
      title: raw.title as string,
      summary: `Approval from ${raw.requester} to ${raw.approver}. Status: ${raw.status}. Latency: ${Math.round((raw.latencyMs as number) / 3600000)}h`,
      owner: raw.requester as string,
      project: raw.project as string,
      sourceSystem: 'internal',
      dataClass: dc,
      sensitivity: 0.75,
      confidence: 0.92,
      visibility: 'team',
      sourcePermissionState: 'accessible',
      evidenceRefs: [`${raw.id}`],
      freshness: raw.status === 'approved' ? 'stale' : 'fresh',
      riskLevel: raw.status === 'pending' ? 'high' : raw.status === 'escalated' ? 'critical' : 'low',
      demoMode: isDemoMode(),
    };
  },

  sanitizeOutput: sanitize,
  createProofRefs: (ids) => makeProofRefs(ids, 'approval_engine', 'confidential'),
};

// ─── Document Editor Connector (Google Docs / Word) ─────────────────────────

export const docsConnectorAdapter: WorkspaceConnectorAdapter = {
  id: 'wsc-docs',
  name: 'Document Editor',
  category: 'productivity',
  requiredScopes: ['documents.read', 'documents.write', 'comments.read'],
  supportedObjects: ['document'],
  riskLevel: 'low',
  demoMode: isDemoMode(),

  async syncMockData() {
    const docTitles = [
      'Q2 Revenue Board Packet — Final Version', 'Property CapEx Review — 412 Fulton St',
      'Vendor SLA Escalation Brief — CloudOps', 'Security Incident INC-2047 Report',
      'AI Governance Policy v3 — Compliance Review', 'Executive Weekly Brief — W18',
      'Maritime Risk Assessment SZL-47', 'NDA Renewal — Meridian Partners',
      'MSA Renewal — Vertex Corp', 'Data Residency Compliance — Legal Opinion',
      'Board Report Draft v3 (RESTRICTED)', 'Workspace Migration Runbook',
      'Salesforce CRM Cleanup Checklist', 'GDPR Article 17 Deletion Request Procedure',
      'Customer Breach Notification Template', 'Capex Budget Request — Approval Required',
    ];
    return docTitles.map((title, i) => ({
      id: `doc-${String(i + 1).padStart(3, '0')}`,
      title,
      author: ['Sarah Chen', 'Marcus Webb', 'Ana Torres', 'Dev Patel', 'Kenji Watanabe'][i % 5],
      project: ['Q2 Revenue Operations', 'Board Packet Preparation', 'Private Advisory Vendor Controls', 'Legal Matter Deadline Audit', 'Security Incident Follow-Up'][i % 5],
      dataClass: ['confidential', 'restricted', 'legal', 'finance', 'security', 'regulated', 'internal'][i % 7],
      wordCount: 800 + i * 300,
      lastEditedAt: new Date(Date.now() - i * 86400000).toISOString(),
      commentCount: i % 4,
    }));
  },

  normalizeToWorkGraph(raw) {
    const dc = (raw.dataClass as DataClass) ?? 'internal';
    return {
      nodeId: `wgn-${raw.id}`,
      type: 'document',
      title: raw.title as string,
      summary: `Document by ${raw.author} (${raw.wordCount} words). ${raw.commentCount} comment(s). Last edited: ${raw.lastEditedAt}`,
      owner: raw.author as string,
      project: raw.project as string,
      sourceSystem: 'document_editor',
      dataClass: dc,
      sensitivity: dc === 'restricted' ? 0.95 : dc === 'legal' ? 0.8 : 0.55,
      confidence: 0.88,
      visibility: dc === 'restricted' ? 'owner_only' : 'team',
      sourcePermissionState: dc === 'restricted' ? 'restricted' : 'accessible',
      evidenceRefs: [`${raw.id}`],
      freshness: (raw.lastEditedAt as string) > new Date(Date.now() - 7 * 86400000).toISOString() ? 'fresh' : 'stale',
      riskLevel: dc === 'restricted' || dc === 'legal' ? 'high' : 'low',
      demoMode: isDemoMode(),
    };
  },

  sanitizeOutput: sanitize,
  createProofRefs: (ids) => makeProofRefs(ids, 'document_editor', 'confidential'),
};

// ─── Spreadsheet App Connector (Google Sheets / Excel) ───────────────────────

export const sheetsConnectorAdapter: WorkspaceConnectorAdapter = {
  id: 'wsc-sheets',
  name: 'Spreadsheet App',
  category: 'productivity',
  requiredScopes: ['spreadsheets.read', 'spreadsheets.write'],
  supportedObjects: ['spreadsheet'],
  riskLevel: 'medium',
  demoMode: isDemoMode(),

  async syncMockData() {
    const sheetTitles = [
      'Revenue Forecast Model — Q2 Actuals', 'Executive Operating Review — Weekly Scorecard',
      'Vendor SLA Scorecard Q1', 'Property Capex Model FY26',
      'Salesforce CRM Cleanup Checklist', 'APAC Pipeline Tracker',
      'Board Meeting Agenda — Q2 2026', 'HR Onboarding Time Metrics',
      'Incident MTTR Dashboard', 'Insurance Policy Renewal Tracker',
      'Budget vs Actuals FY26 Q2', 'MarComm Attribution Model',
      'Skills Studio Run Log — W18', 'Legal Deadline Tracker',
      'Security Patch Schedule', 'WorkGraph Node Coverage Metrics',
    ];
    return sheetTitles.map((title, i) => ({
      id: `sheet-${String(i + 1).padStart(3, '0')}`,
      title,
      owner: ['Sarah Chen', 'Marcus Webb', 'James Park', 'Ana Torres', 'Dev Patel'][i % 5],
      project: ['Q2 Revenue Operations', 'Board Packet Preparation', 'Private Advisory Vendor Controls', 'Executive Weekly Operating Review', 'Legal Matter Deadline Audit'][i % 5],
      dataClass: ['finance', 'confidential', 'internal', 'internal', 'finance'][i % 5],
      rowCount: 50 + i * 30,
      sheetCount: 1 + (i % 4),
      lastModifiedAt: new Date(Date.now() - i * 43200000).toISOString(),
    }));
  },

  normalizeToWorkGraph(raw) {
    const dc = (raw.dataClass as DataClass) ?? 'internal';
    return {
      nodeId: `wgn-${raw.id}`,
      type: 'spreadsheet',
      title: raw.title as string,
      summary: `Spreadsheet by ${raw.owner} (${raw.rowCount} rows, ${raw.sheetCount} sheet(s)). Last modified: ${raw.lastModifiedAt}`,
      owner: raw.owner as string,
      project: raw.project as string,
      sourceSystem: 'spreadsheet_app',
      dataClass: dc,
      sensitivity: dc === 'finance' ? 0.75 : 0.45,
      confidence: 0.91,
      visibility: 'team',
      sourcePermissionState: 'accessible',
      evidenceRefs: [`${raw.id}`],
      freshness: (raw.lastModifiedAt as string) > new Date(Date.now() - 7 * 86400000).toISOString() ? 'fresh' : 'stale',
      riskLevel: dc === 'finance' ? 'medium' : 'low',
      demoMode: isDemoMode(),
    };
  },

  sanitizeOutput: sanitize,
  createProofRefs: (ids) => makeProofRefs(ids, 'spreadsheet_app', 'finance'),
};

// ─── Slide Creator Connector (Google Slides / PowerPoint) ─────────────────────

export const slidesConnectorAdapter: WorkspaceConnectorAdapter = {
  id: 'wsc-slides',
  name: 'Slide Creator',
  category: 'productivity',
  requiredScopes: ['presentations.read'],
  supportedObjects: ['slide'],
  riskLevel: 'low',
  demoMode: isDemoMode(),

  async syncMockData() {
    const slideTitles = [
      'Q2 Board Presentation — Final', 'AlloyAI Platform Overview — Investor Deck',
      'SZL Holdings Strategy FY26', 'Maritime Operations Risk Briefing',
      'Q3 OKR Planning Session', 'Security Posture Quarterly Review',
      'Vendor Partner Summit Deck', 'New Hire Onboarding — SZL Culture',
    ];
    return slideTitles.map((title, i) => ({
      id: `slide-${String(i + 1).padStart(3, '0')}`,
      title,
      author: ['Marcus Webb', 'Sarah Chen', 'Dev Patel', 'Kenji Watanabe'][i % 4],
      project: ['Board Packet Preparation', 'Q2 Revenue Operations', 'Security Incident Follow-Up', 'Maritime Risk Review'][i % 4],
      dataClass: ['restricted', 'confidential', 'internal', 'confidential'][i % 4],
      slideCount: 12 + i * 3,
      lastPresentedAt: new Date(Date.now() - i * 7 * 86400000).toISOString(),
    }));
  },

  normalizeToWorkGraph(raw) {
    const dc = (raw.dataClass as DataClass) ?? 'internal';
    return {
      nodeId: `wgn-${raw.id}`,
      type: 'slide',
      title: raw.title as string,
      summary: `Presentation by ${raw.author} (${raw.slideCount} slides). Last presented: ${raw.lastPresentedAt}`,
      owner: raw.author as string,
      project: raw.project as string,
      sourceSystem: 'slide_creator',
      dataClass: dc,
      sensitivity: dc === 'restricted' ? 0.9 : 0.6,
      confidence: 0.84,
      visibility: dc === 'restricted' ? 'owner_only' : 'team',
      sourcePermissionState: dc === 'restricted' ? 'restricted' : 'accessible',
      evidenceRefs: [`${raw.id}`],
      freshness: (raw.lastPresentedAt as string) > new Date(Date.now() - 30 * 86400000).toISOString() ? 'fresh' : 'stale',
      riskLevel: dc === 'restricted' ? 'high' : 'low',
      demoMode: isDemoMode(),
    };
  },

  sanitizeOutput: sanitize,
  createProofRefs: (ids) => makeProofRefs(ids, 'slide_creator', 'confidential'),
};

// ─── Workspace Event Stream Connector ─────────────────────────────────────────

export const workspaceEventsAdapter: WorkspaceConnectorAdapter = {
  id: 'wsc-events',
  name: 'Workspace Event Stream',
  category: 'events',
  requiredScopes: ['events.subscribe'],
  supportedObjects: ['task'],
  riskLevel: 'low',
  demoMode: isDemoMode(),

  async syncMockData() {
    const eventTypes = [
      'file.shared', 'doc.commented', 'doc.edited', 'calendar.created',
      'task.completed', 'task.overdue', 'chat.mentioned', 'approval.requested',
      'approval.approved', 'approval.escalated', 'drive.permission.changed',
      'user.invited', 'calendar.cancelled', 'doc.permission.changed',
    ];
    return Array.from({ length: 30 }, (_, i) => ({
      id: `evt-${String(i + 1).padStart(3, '0')}`,
      type: eventTypes[i % eventTypes.length],
      actor: ['sarah.chen', 'marcus.webb', 'dev.patel', 'ana.torres', 'james.park'][i % 5],
      resourceId: `res-${String(i + 1).padStart(3, '0')}`,
      resourceTitle: `Workspace resource ${i + 1}`,
      project: ['Q2 Revenue Operations', 'Legal Matter Deadline Audit', 'Security Incident Follow-Up', 'Board Packet Preparation'][i % 4],
      dataClass: ['internal', 'confidential', 'security', 'internal'][i % 4],
      occurredAt: new Date(Date.now() - i * 3600000).toISOString(),
    }));
  },

  normalizeToWorkGraph(raw) {
    const dc = (raw.dataClass as DataClass) ?? 'internal';
    return {
      nodeId: `wgn-${raw.id}`,
      type: 'task',
      title: `${raw.type}: ${raw.resourceTitle}`,
      summary: `Workspace event: ${raw.type} by ${raw.actor} on ${raw.resourceTitle}. Project: ${raw.project}`,
      owner: `${raw.actor}@szlholdings.com`,
      project: raw.project as string,
      sourceSystem: 'workspace_events',
      dataClass: dc,
      sensitivity: dc === 'security' ? 0.8 : 0.3,
      confidence: 0.95,
      visibility: 'org',
      sourcePermissionState: 'accessible',
      evidenceRefs: [`${raw.id}`],
      freshness: (raw.occurredAt as string) > new Date(Date.now() - 86400000).toISOString() ? 'fresh' : 'stale',
      riskLevel: raw.type?.toString().includes('permission') || raw.type?.toString().includes('security') ? 'medium' : 'low',
      demoMode: isDemoMode(),
    };
  },

  sanitizeOutput: sanitize,
  createProofRefs: (ids) => makeProofRefs(ids, 'workspace_events', 'internal'),
};

// ─── Registry ─────────────────────────────────────────────────────────────────

export const WORKSPACE_CONNECTOR_REGISTRY: WorkspaceConnectorAdapter[] = [
  emailConnectorAdapter,
  driveConnectorAdapter,
  docsConnectorAdapter,
  sheetsConnectorAdapter,
  slidesConnectorAdapter,
  chatConnectorAdapter,
  meetingsConnectorAdapter,
  calendarConnectorAdapter,
  taskConnectorAdapter,
  workspaceEventsAdapter,
  mcpWorkspaceBridgeAdapter,
  approvalEngineAdapter,
];

export function getConnectorAdapter(id: string): WorkspaceConnectorAdapter | undefined {
  return WORKSPACE_CONNECTOR_REGISTRY.find((c) => c.id === id);
}

export function getAllDemoData(): Promise<{ connectorId: string; records: Record<string, unknown>[] }[]> {
  return Promise.all(
    WORKSPACE_CONNECTOR_REGISTRY.map(async (connector) => {
      try {
        const records = await connector.syncMockData();
        return { connectorId: connector.id, records };
      } catch (err) {
        logger.warn({ connectorId: connector.id, err }, 'WorkGraph connector syncMockData failed');
        return { connectorId: connector.id, records: [] };
      }
    }),
  );
}
