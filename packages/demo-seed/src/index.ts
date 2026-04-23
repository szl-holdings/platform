/**
 * @workspace/demo-seed
 *
 * Demo data seed runner for all four SZL Holdings demo narratives.
 * Designed to be run against a local or staging database before demos.
 *
 * Usage:
 *   pnpm --filter @workspace/demo-seed run seed:all
 *   pnpm --filter @workspace/demo-seed run seed:business
 *   pnpm --filter @workspace/demo-seed run seed:security
 *   pnpm --filter @workspace/demo-seed run seed:maritime
 *   pnpm --filter @workspace/demo-seed run seed:legal
 *
 * See scripts/demo-reset/ for full reset and restore procedures.
 */

export type { BusinessRevopsNarrative } from './narrative-business-revops';
export { BUSINESS_REVOPS_NARRATIVE } from './narrative-business-revops';
export type { LegalComplianceNarrative } from './narrative-legal-compliance';
export { LEGAL_COMPLIANCE_NARRATIVE } from './narrative-legal-compliance';
export type { MaritimeNarrative } from './narrative-maritime';
export { MARITIME_NARRATIVE } from './narrative-maritime';
export type { SecuritySocNarrative } from './narrative-security-soc';
export { SECURITY_SOC_NARRATIVE } from './narrative-security-soc';
export type { DemoPersona, DemoPersonaRole } from './personas';
export {
  DEMO_PERSONAS,
  getPersonaById,
  getPersonaByRole,
  getPersonasByNarrative,
} from './personas';

export const DEMO_NARRATIVES = [
  {
    id: 'business-revops',
    label: 'Business Observability / RevOps / CFO',
    pack: 'lyte',
    file: './narrative-business-revops',
  },
  {
    id: 'security-soc',
    label: 'Security / SOC / Risk',
    pack: 'aegis',
    file: './narrative-security-soc',
  },
  {
    id: 'maritime',
    label: 'Maritime / Sanctions / Fleet Operations',
    pack: 'vessels',
    file: './narrative-maritime',
  },
  {
    id: 'legal-compliance',
    label: 'Legal / Compliance / Matter Command',
    pack: 'prism-counsel',
    file: './narrative-legal-compliance',
  },
] as const;

export const DEMO_PERSONA_ROLES = ['executive', 'operator', 'analyst', 'auditor'] as const;

/**
 * Summary of all demo entities for quick reference during presentations.
 * Each narrative shows the signal-to-outcome chain.
 */
export const DEMO_SUMMARY = {
  version: '1.0.0',
  lastUpdated: '2026-04-16',
  narratives: DEMO_NARRATIVES.length,
  personas: 6,
  roles: DEMO_PERSONA_ROLES.length,
  flow: [
    'Signal ingestion',
    'Context assembly (Twin model)',
    'AI recommendation generation',
    'Human approval gate',
    'Governed execution (FORGE)',
    'Outcome capture',
    'Executive summary',
    'Proof chain / audit trail',
  ],
};

export type { CarlotaJoEstateNarrative } from './narrative-carlota-jo-estate';
export { CARLOTA_JO_ESTATE_NARRATIVE } from './narrative-carlota-jo-estate';
export type { CounselDeadlineNarrative } from './narrative-counsel-deadline';
export { COUNSEL_DEADLINE_NARRATIVE } from './narrative-counsel-deadline';
export type { SentraRansomwareNarrative } from './narrative-sentra-ransomware';
export { SENTRA_RANSOMWARE_NARRATIVE } from './narrative-sentra-ransomware';
export type { SzlTreasuryNarrative } from './narrative-szl-treasury';
export { SZL_TREASURY_NARRATIVE } from './narrative-szl-treasury';
export type { VesselsPortCongestionNarrative } from './narrative-vessels-port-congestion';
export { VESSELS_PORT_CONGESTION_NARRATIVE } from './narrative-vessels-port-congestion';
export { seedConstellationDemo as seedConstellation } from './seed-constellation';
export { clearDemoData, seedAllNarratives, seedNarrative } from './seed-runner';
export { seedSignalMesh } from './seed-signal-mesh';

export const SIGNAL_MESH_NARRATIVES = [
  {
    id: 'vessels-port-congestion',
    label: 'SEXTANT — Port Congestion + Route Exception Cluster',
    domain: 'maritime',
  },
  {
    id: 'carlota-jo-estate',
    label: 'Carlota Jo — Estate Readiness Gap Before VIP Arrival',
    domain: 'real-estate',
  },
  { id: 'szl-treasury', label: 'SZL Holdings — Treasury Risk Cluster', domain: 'finance' },
  {
    id: 'counsel-deadline',
    label: 'Counsel — Looming Deadline + Dependency Conflict',
    domain: 'counsel',
  },
  {
    id: 'sentra-ransomware',
    label: 'TENAX — Ransomware-Adjacent OT Event + Recovery Posture Gap',
    domain: 'security',
  },
] as const;

export type {
  LyteRecommendation,
  LyteSignal,
  LyteStalledApprovalNarrative,
  SimulationScenario,
} from './narrative-lyte-stalled-approval';
export { LYTE_STALLED_APPROVAL_NARRATIVE } from './narrative-lyte-stalled-approval';
export type { TerraDistressNarrative } from './narrative-terra-distress';
export { TERRA_DISTRESS_NARRATIVE } from './narrative-terra-distress';
