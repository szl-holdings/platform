/**
 * Public Claims Registry
 *
 * Every number, tagline, and capability claim that appears on any public
 * surface (websites, pitch deck, README, marketing copy) must be defined here.
 *
 * Truth value:
 *   "verified"     — traceable to live data or confirmed measurement
 *   "demo-data"    — seed/fixture value; must be labeled [Demo] in UI
 *   "aspirational" — future-state projection; must be labeled [Projected] in UI
 *   "pending"      — measurement methodology exists but data not yet collected
 *
 * DO NOT add a claim unless you know its truth value.
 * DO NOT display a claim without the corresponding UI label when required.
 */

export type ClaimTruthValue = 'verified' | 'demo-data' | 'aspirational' | 'pending';

export interface PublicClaim {
  id: string;
  surface: string;
  claim: string;
  truthValue: ClaimTruthValue;
  source: string;
  displayLabel: string | null;
  notes: string;
}

export const PUBLIC_CLAIMS: PublicClaim[] = [
  {
    id: 'tagline-governed-decision',
    surface: 'README, szl-holdings landing',
    claim:
      'Governed decision infrastructure — connecting what is observable to what is executable, with full attribution.',
    truthValue: 'verified',
    source: 'Architecture: proof-chain lib, policy-engine, action-engine',
    displayLabel: null,
    notes: 'Accurate description of the platform architecture.',
  },
  {
    id: 'covenant-policy-enforcement',
    surface: 'README, trust center',
    claim: 'AI cannot execute consequential actions without human confirmation.',
    truthValue: 'verified',
    source: 'packages/policy-engine, packages/action-engine',
    displayLabel: null,
    notes: 'Enforced architecturally via Covenant Policy.',
  },
  {
    id: 'tenant-isolation',
    surface: 'README, trust center',
    claim: 'All queries scoped by org identifier; cross-org access returns 404.',
    truthValue: 'verified',
    source: 'artifacts/api-server/src/lib/tenant-scope.ts',
    displayLabel: null,
    notes: 'Verified in April 2026 pen test remediation.',
  },
  {
    id: 'lyte-signal-detection-time',
    surface: 'szl-holdings venture card',
    claim: '< 4 min average signal detection time',
    truthValue: 'pending',
    source: 'artifacts/szl-holdings/src/data/ventures.ts',
    displayLabel: '[Demo]',
    notes: 'No live telemetry confirms this. Must display [Demo] until instrumented.',
  },
  {
    id: 'lyte-signals-per-day',
    surface: 'szl-holdings venture card',
    claim: '2.4M+ signals processed per day',
    truthValue: 'pending',
    source: 'artifacts/szl-holdings/src/data/ventures.ts',
    displayLabel: '[Demo]',
    notes: 'No live signal volume telemetry. Must display [Demo] until instrumented.',
  },
  {
    id: 'lyte-false-positive-rate',
    surface: 'szl-holdings venture card',
    claim: '< 3% false positive rate',
    truthValue: 'pending',
    source: 'artifacts/szl-holdings/src/data/ventures.ts',
    displayLabel: '[Demo]',
    notes: 'No live evaluation data. Must display [Demo] until instrumented.',
  },
  {
    id: 'vessels-count',
    surface: 'szl-holdings venture card',
    claim: '52,000+ vessels monitored',
    truthValue: 'aspirational',
    source: 'artifacts/szl-holdings/src/data/ventures.ts',
    displayLabel: '[Projected]',
    notes:
      'AIS not subscribed. No live vessel tracking. Represents addressable fleet, not current monitoring.',
  },
  {
    id: 'vessels-dark-detection-lead',
    surface: 'szl-holdings venture card',
    claim: '34 days before formal designation for dark vessel detection',
    truthValue: 'demo-data',
    source: 'artifacts/szl-holdings/src/data/ventures.ts',
    displayLabel: '[Demo]',
    notes: 'Demo scenario data. No live dark fleet ML model.',
  },
  {
    id: 'aegis-simulations',
    surface: 'szl-holdings, szl-demo-video',
    claim: '31,200+ simulations executed',
    truthValue: 'demo-data',
    source:
      'artifacts/szl-holdings/src/data/ventures.ts, artifacts/szl-demo-video/src/components/video/video_scenes/Scene2.tsx',
    displayLabel: '[Demo]',
    notes: 'Hardcoded count. Not derived from simulation DB.',
  },
  {
    id: 'aegis-mitre-coverage',
    surface: 'szl-holdings, szl-demo-video',
    claim: '200+ MITRE ATT&CK techniques covered',
    truthValue: 'aspirational',
    source: 'artifacts/szl-demo-video',
    displayLabel: '[Projected]',
    notes: 'MITRE ATT&CK v14 feed is real; coverage count is aspirational, not measured.',
  },
  {
    id: 'market-maritime-size',
    surface: 'pitch deck (archived)',
    claim: '$4.2B maritime intelligence market',
    truthValue: 'aspirational',
    source: 'artifacts/aegis/ (removed)',
    displayLabel: '[Market estimate]',
    notes: 'Analyst estimate; cite source in slide. Not an AUM figure.',
  },
  {
    id: 'market-governed-decision',
    surface: 'pitch deck (archived)',
    claim: '$50.1B governed decision infrastructure market by 2030',
    truthValue: 'aspirational',
    source: 'artifacts/aegis/ (removed)',
    displayLabel: '[Projected market]',
    notes: 'Projection; cite source. Not a revenue figure.',
  },
  {
    id: 'carlota-jo-retention',
    surface: 'carlota-jo landing, advisory intel',
    claim: '98% client retention',
    truthValue: 'pending',
    source: 'artifacts/carlota-jo/src/pages/PremiumHome.tsx, AdvisoryIntel.tsx, pulse.tsx',
    displayLabel: '[Demo]',
    notes: 'No CRM data source. Must display [Demo] until CRM confirms.',
  },
  {
    id: 'carlota-jo-experience',
    surface: 'carlota-jo landing',
    claim: '18 years of private advisory experience',
    truthValue: 'verified',
    source: 'artifacts/carlota-jo/src/pages/PremiumHome.tsx',
    displayLabel: null,
    notes: 'Biographical claim. Should be derived from a founderStartYear constant to auto-update.',
  },
  {
    id: 'uptime-claim',
    surface: 'command marketing/status page',
    claim: '99.98% uptime',
    truthValue: 'demo-data',
    source: 'artifacts/command/src/pages/marketing/status.tsx',
    displayLabel: '[Demo]',
    notes: 'Hardcoded in static data file. No real uptime monitor. Must show [Demo] or be removed.',
  },
  {
    id: 'command-uptime-30day',
    surface: 'command marketing/status page — 30-day metric',
    claim: '99.98%',
    truthValue: 'demo-data',
    source: 'artifacts/command/src/pages/marketing/status.tsx',
    displayLabel: '[Demo]',
    notes: '30-day uptime metric. No live uptime monitor wired. Must show [Demo].',
  },
  {
    id: 'command-uptime-90day',
    surface: 'command marketing/status page — 90-day metric',
    claim: '99.97%',
    truthValue: 'demo-data',
    source: 'artifacts/command/src/pages/marketing/status.tsx',
    displayLabel: '[Demo]',
    notes: '90-day uptime metric. No live uptime monitor wired. Must show [Demo].',
  },
  {
    id: 'vessels-uptime-sla',
    surface: 'vessels marketing-home, vessels-home',
    claim: '99.97% uptime SLA',
    truthValue: 'aspirational',
    source: 'artifacts/vessels/src/pages/marketing-home.tsx, vessels-home.tsx',
    displayLabel: '[Target SLA]',
    notes: 'Stated SLA target; no historical uptime measurement. Display as target.',
  },
  {
    id: 'pulse-fallback-briefing',
    surface: 'pulse — fallback brief renderer',
    claim: 'Synthesized briefing',
    truthValue: 'demo-data',
    source: 'artifacts/pulse/src/lib/claims.ts',
    displayLabel: '[Synthesized]',
    notes:
      'When live agents have not produced a brief, the renderer must label content as Synthesized so readers know it is not freshly generated.',
  },
  {
    id: 'terra-portfolio-aum',
    surface: 'terra dashboard, carlota-jo case studies',
    claim: '$4.2B+ assets under analysis',
    truthValue: 'demo-data',
    source: 'artifacts/terra/src/data, artifacts/carlota-jo case-studies',
    displayLabel: '[Demo]',
    notes: 'Seed portfolio data. Used in demo views; must surface a Demo provenance label.',
  },
];

export const FOUNDER_START_YEAR = 2007;
export const CURRENT_YEAR = new Date().getFullYear();
export const FOUNDER_YEARS_EXPERIENCE = CURRENT_YEAR - FOUNDER_START_YEAR;

export function getClaim(id: string): PublicClaim | undefined {
  return PUBLIC_CLAIMS.find((c) => c.id === id);
}

export function getUnverifiedClaims(): PublicClaim[] {
  return PUBLIC_CLAIMS.filter((c) => c.truthValue !== 'verified');
}

export function getClaimsByTruthValue(truthValue: ClaimTruthValue): PublicClaim[] {
  return PUBLIC_CLAIMS.filter((c) => c.truthValue === truthValue);
}
