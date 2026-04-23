/**
 * Demo Personas
 *
 * Role-based demo personas for SZL Holdings demonstrations.
 * Each persona has a name, role, domain focus, and view permissions.
 *
 * Usage: Pass the persona ID when seeding or resetting demo state
 * to configure role-appropriate data visibility.
 */

export type DemoPersonaRole = 'executive' | 'operator' | 'analyst' | 'auditor';

export interface DemoPersona {
  id: string;
  role: DemoPersonaRole;
  name: string;
  title: string;
  org: string;
  email: string;
  domain: string[];
  packs: string[];
  viewPermissions: {
    canApprove: boolean;
    canExecute: boolean;
    canViewFinancials: boolean;
    canViewAuditTrail: boolean;
    canViewRawSignals: boolean;
    canManagePersonnel: boolean;
    canExportData: boolean;
  };
  demoNarrative: string;
  talkingPoints: string[];
}

export const DEMO_PERSONAS: DemoPersona[] = [
  {
    id: 'cfo-exec',
    role: 'executive',
    name: 'Marcus Holt',
    title: 'Chief Financial Officer',
    org: 'Meridian Capital Group',
    email: 'm.holt@demo.szlholdings.com',
    domain: ['business-observability', 'lyte'],
    packs: ['lyte', 'terra'],
    viewPermissions: {
      canApprove: true,
      canExecute: false,
      canViewFinancials: true,
      canViewAuditTrail: true,
      canViewRawSignals: false,
      canManagePersonnel: false,
      canExportData: true,
    },
    demoNarrative: 'business-revops',
    talkingPoints: [
      'Sees cross-portfolio financial exposure on one surface',
      'Approves high-value actions without leaving the command inbox',
      'Receives AI-synthesised executive summaries — not raw dashboards',
      'Proof chain available for board and audit inquiries',
    ],
  },
  {
    id: 'ciso-exec',
    role: 'executive',
    name: 'Diana Reyes',
    title: 'Chief Information Security Officer',
    org: 'Vantage Infrastructure Partners',
    email: 'd.reyes@demo.szlholdings.com',
    domain: ['security', 'aegis'],
    packs: ['aegis', 'lyte'],
    viewPermissions: {
      canApprove: true,
      canExecute: false,
      canViewFinancials: true,
      canViewAuditTrail: true,
      canViewRawSignals: false,
      canManagePersonnel: true,
      canExportData: true,
    },
    demoNarrative: 'security-soc',
    talkingPoints: [
      'Unified threat exposure view — not individual tool dashboards',
      'Risk-ranked findings with blast-radius impact visible',
      'Compliance posture summary exportable for board reporting',
      'Approves containment actions; analyst executes the playbook',
    ],
  },
  {
    id: 'fleet-operator',
    role: 'operator',
    name: 'Captain James Wren',
    title: 'Fleet Operations Director',
    org: 'Arcturus Shipping',
    email: 'j.wren@demo.szlholdings.com',
    domain: ['maritime', 'vessels'],
    packs: ['vessels'],
    viewPermissions: {
      canApprove: true,
      canExecute: true,
      canViewFinancials: true,
      canViewAuditTrail: true,
      canViewRawSignals: true,
      canManagePersonnel: false,
      canExportData: true,
    },
    demoNarrative: 'maritime',
    talkingPoints: [
      'Fleet position, route risk, and cargo status on one screen',
      'AIS anomaly and sanctions alert surfaced before the port call',
      'Approves rerouting through FORGE — full audit record created',
      'Voyage P&L updated in real time as route changes are confirmed',
    ],
  },
  {
    id: 'soc-analyst',
    role: 'analyst',
    name: 'Priya Nair',
    title: 'Senior SOC Analyst',
    org: 'Vantage Infrastructure Partners',
    email: 'p.nair@demo.szlholdings.com',
    domain: ['security', 'aegis'],
    packs: ['aegis'],
    viewPermissions: {
      canApprove: false,
      canExecute: true,
      canViewFinancials: false,
      canViewAuditTrail: true,
      canViewRawSignals: true,
      canManagePersonnel: false,
      canExportData: true,
    },
    demoNarrative: 'security-soc',
    talkingPoints: [
      'Alert triage with full MITRE ATT&CK context — no manual lookups',
      'Playbook recommendations with confidence scoring and evidence',
      'Executes containment steps; CISO approves before remediation',
      'All investigation steps logged with attribution automatically',
    ],
  },
  {
    id: 'legal-counsel',
    role: 'operator',
    name: 'Sophia Marchetti',
    title: 'Managing Attorney',
    org: 'Marchetti & Osei LLP',
    email: 's.marchetti@demo.szlholdings.com',
    domain: ['legal', 'prism-counsel'],
    packs: ['prism-counsel'],
    viewPermissions: {
      canApprove: true,
      canExecute: true,
      canViewFinancials: true,
      canViewAuditTrail: true,
      canViewRawSignals: true,
      canManagePersonnel: false,
      canExportData: true,
    },
    demoNarrative: 'legal-compliance',
    talkingPoints: [
      'Matter Twin shows every deadline, party, and insurer signal',
      'Demand readiness scored automatically — no manual checklist',
      'Reviews demand packet before partner approval gate',
      'Proof chain created automatically for every action taken',
    ],
  },
  {
    id: 'compliance-auditor',
    role: 'auditor',
    name: 'Robert Tanner',
    title: 'Chief Compliance Officer',
    org: 'Arcturus Shipping',
    email: 'r.tanner@demo.szlholdings.com',
    domain: ['maritime', 'vessels', 'lyte'],
    packs: ['vessels', 'lyte'],
    viewPermissions: {
      canApprove: false,
      canExecute: false,
      canViewFinancials: true,
      canViewAuditTrail: true,
      canViewRawSignals: false,
      canManagePersonnel: false,
      canExportData: true,
    },
    demoNarrative: 'maritime',
    talkingPoints: [
      'Read-only audit view — sees decisions without operational access',
      'Full voyage decision trail: who approved what, when, and why',
      'Sanctions screening log with confidence scores and source citations',
      'Exports compliance package for port authority or flag state',
    ],
  },
];

export function getPersonaByRole(role: DemoPersonaRole): DemoPersona[] {
  return DEMO_PERSONAS.filter((p) => p.role === role);
}

export function getPersonaById(id: string): DemoPersona | undefined {
  return DEMO_PERSONAS.find((p) => p.id === id);
}

export function getPersonasByNarrative(narrativeId: string): DemoPersona[] {
  return DEMO_PERSONAS.filter((p) => p.demoNarrative === narrativeId);
}
