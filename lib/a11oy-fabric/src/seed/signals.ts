import type { BusinessSignal } from '../schema.js';

const minus = (h: number) => new Date(Date.now() - h * 3_600_000).toISOString();
const now = () => new Date().toISOString();

const verticals = [
  'lyte-revenue',
  'vessels-maritime',
  'terra-real-estate',
  'aegis-defense',
  'prism-counsel',
  'carlota-jo',
  'alloy-core',
];

const severities = ['critical' as const, 'high' as const, 'medium' as const, 'low' as const, 'info' as const];
const statuses = ['active' as const, 'acknowledged' as const, 'resolved' as const, 'escalated' as const, 'suppressed' as const];

const owners: Record<string, string[]> = {
  'lyte-revenue': ['VP Revenue, Lyte', 'VP Sales, Lyte', 'Head of Customer Success, Lyte', 'Head of Product, Lyte'],
  'vessels-maritime': ['Operations Controller, Vessels', 'Fleet Compliance Officer', 'Fleet Chartering Manager', 'Technical Superintendent', 'Environmental Compliance Manager'],
  'terra-real-estate': ['Portfolio Director, LA', 'Leasing Director, Northern CA', 'CFO, Terra', 'Development Director, Pacific NW', 'Portfolio Director, Texas'],
  'aegis-defense': ['Threat Intelligence Lead, Aegis', 'Operations Director, Aegis', 'Compliance Officer, Aegis', 'Deputy CISO, Aegis'],
  'prism-counsel': ['General Counsel', 'Head of Legal Operations', 'Chief Privacy Officer'],
  'carlota-jo': ['Managing Director, Carlota Jo', 'Finance Director, Carlota Jo', 'Director of Client Services'],
  'alloy-core': ['Platform Engineering, A11oy', 'Security Architect, A11oy'],
};

const templates = [
  { title: "Anomaly in {vertical} metrics", desc: "Detected unusual fluctuation in {vertical} performance indicators during last period audit." },
  { title: "{vertical} compliance alert", desc: "New regulatory requirements for {vertical} detected. Current gap assessment suggests remediation is required." },
  { title: "{vertical} resource constraint", desc: "Critical resource shortage in {vertical} operations impacting delivery timelines." },
  { title: "Strategic opportunity in {vertical}", desc: "Market shift identifies a high-value growth lever for {vertical} sector." },
  { title: "{vertical} security advisory", desc: "Vulnerability detected in {vertical} supply chain components. Patches requested." },
];

const generatedSignals: BusinessSignal[] = [];

for (let i = 1; i <= 150; i++) {
  const vertical = verticals[i % verticals.length] as any;
  const severity = severities[i % severities.length];
  const status = statuses[i % statuses.length];
  const template = templates[i % templates.length];
  const ownerList = owners[vertical];
  const owner = ownerList[i % ownerList.length];

  generatedSignals.push({
    id: `sig-gen-${String(i).padStart(3, '0')}`,
    vertical: vertical,
    entity: `${vertical.split('-')[0].toUpperCase()} Unit ${i}`,
    title: template.title.replace('{vertical}', vertical.split('-')[0]),
    description: template.desc.replace('{vertical}', vertical),
    severity: severity,
    status: status,
    businessImpact: `Potential exposure of $${Math.floor((i * 7.7) % 1000)}K if unresolved.`,
    evidenceRefs: [`${vertical}/evidence/${i}`],
    owner: owner,
    detectedAt: minus(i % 168),
    updatedAt: minus(i % 24),
    tags: [vertical.split('-')[1], severity, status],
    metadata: { generated: true, index: i }
  });
}

export const SEED_SIGNALS: BusinessSignal[] = [
  {
    id: 'sig-lyte-002',
    vertical: 'lyte-revenue',
    entity: 'Lyte Platform — Churn',
    title: 'Mid-Market Churn Spike',
    description: 'Three mid-market accounts (combined $180K ARR) have issued cancellation notices in the past 7 days.',
    severity: 'critical',
    status: 'escalated',
    businessImpact: 'Immediate $180K ARR at risk; contagion risk estimated at $340K if not contained.',
    evidenceRefs: ['lyte/crm/churn-notices-2026-04', 'lyte/cs/account-health-scores'],
    owner: 'Head of Customer Success, Lyte',
    detectedAt: minus(18),
    updatedAt: minus(1),
    tags: ['churn', 'mid-market', 'critical', 'cancellation'],
    metadata: { churnedARR: 180000, atRiskARR: 340000, accountCount: 3 },
  },
  {
    id: 'sig-terra-001',
    vertical: 'terra-real-estate',
    entity: 'Wilshire Portfolio — Los Angeles',
    title: 'Office Vacancy Rate at 34% — Above Debt Covenant Threshold',
    description: 'Wilshire Ave office portfolio vacancy has reached 34%, breaching the 30% debt covenant threshold.',
    severity: 'critical',
    status: 'escalated',
    businessImpact: 'Covenant breach triggers lender notification; potential acceleration of $28M debt facility.',
    evidenceRefs: ['terra/leasing/wilshire-2026-q2', 'terra/finance/debt-covenant-tracker'],
    owner: 'Portfolio Director, LA',
    detectedAt: minus(2),
    updatedAt: minus(1),
    tags: ['vacancy', 'covenant', 'debt', 'critical', 'lender'],
    metadata: { vacancyRate: 0.34, covenantThreshold: 0.30, debtFacilityUSD: 28000000 },
  },
  {
    id: 'sig-aegis-001',
    vertical: 'aegis-defense',
    entity: 'Aegis Platform — Threat Intelligence',
    title: 'APT Attribution: Novel TTPs Matching State-Level Adversary',
    description: 'Threat intelligence fusion identifies 3 novel TTPs matching known state-level APT pattern. High-confidence attribution.',
    severity: 'critical',
    status: 'active',
    businessImpact: 'Client network at risk. Immediate escalation and active defense posture required.',
    evidenceRefs: ['aegis/ti/apt-analysis-2026-04', 'aegis/mitre/ttp-mapping'],
    owner: 'Threat Intelligence Lead, Aegis',
    detectedAt: minus(1),
    updatedAt: minus(0.25),
    tags: ['apt', 'threat-intel', 'ttp', 'attribution', 'critical'],
    metadata: { ttpCount: 3, confidenceLevel: 0.92, adversaryClass: 'state-level' },
  },
  ...generatedSignals
];

export const SIGNAL_COUNT = SEED_SIGNALS.length;
