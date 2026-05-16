import { assertAllowedLicense, type AllowedLicense } from './licenses';

export type Provenance = 'PUBLIC_ONLY' | 'MANUAL';
export type Cadence = 'daily' | 'weekly' | 'monthly' | 'event-driven';

interface BaseVariable {
  readonly id: string;
  readonly label: string;
  readonly unit: string;
  readonly cadence: Cadence;
  readonly license?: AllowedLicense;
}

export interface PublicVariable extends BaseVariable {
  readonly source: string;
  readonly provenance: 'PUBLIC_ONLY';
}

export interface ManualVariable extends BaseVariable {
  readonly source: 'manual';
  readonly provenance: 'MANUAL';
  readonly lastUpdated: string | null;
}

export type GaugeVariable = PublicVariable | ManualVariable;

function publicVar(v: Omit<PublicVariable, 'provenance'>): PublicVariable {
  if (v.license) assertAllowedLicense(v.license);
  return { ...v, provenance: 'PUBLIC_ONLY' };
}

function manualVar(v: Omit<ManualVariable, 'provenance' | 'source' | 'lastUpdated'>): ManualVariable {
  if (v.license) assertAllowedLicense(v.license);
  return { ...v, source: 'manual', provenance: 'MANUAL', lastUpdated: null };
}

/**
 * 12 gauge variables proposed in szl-holdings/agi-forecast README.
 * Three are ingested live from public, no-auth sources (PUBLIC_ONLY).
 * The remaining nine are typed stubs (MANUAL) awaiting follow-up ingestors.
 */
export const GAUGE_VARIABLES: readonly GaugeVariable[] = [
  publicVar({
    id: 'METR',
    label: 'METR autonomy-task evaluation activity',
    source: 'https://api.github.com/repos/METR/public-tasks',
    unit: 'commits-since-epoch',
    cadence: 'daily',
    license: 'MIT',
  }),
  publicVar({
    id: 'EPOCH',
    label: 'Epoch AI notable model count',
    source: 'https://epoch.ai/data/notable_ai_models.csv',
    unit: 'model-count',
    cadence: 'weekly',
    license: 'CC-BY-4.0',
  }),
  publicVar({
    id: 'ARC',
    label: 'ARC-AGI reference repository activity',
    source: 'https://api.github.com/repos/fchollet/ARC-AGI',
    unit: 'stars',
    cadence: 'daily',
    license: 'Apache-2.0',
  }),
  manualVar({ id: 'APOLLO', label: 'Apollo Research scheming-eval signal', unit: 'index', cadence: 'monthly' }),
  manualVar({ id: 'AISI', label: 'UK AI Safety Institute published findings', unit: 'reports', cadence: 'monthly' }),
  manualVar({ id: 'RSP', label: 'Anthropic Responsible Scaling Policy version', unit: 'semver', cadence: 'event-driven' }),
  manualVar({ id: 'FSF', label: 'Google DeepMind Frontier Safety Framework version', unit: 'semver', cadence: 'event-driven' }),
  manualVar({ id: 'GPQA', label: 'GPQA Diamond frontier score', unit: 'fraction', cadence: 'monthly' }),
  manualVar({ id: 'MMLU', label: 'MMLU Pro frontier score', unit: 'fraction', cadence: 'monthly' }),
  manualVar({ id: 'SWE_BENCH', label: 'SWE-bench Verified frontier solve rate', unit: 'fraction', cadence: 'monthly' }),
  manualVar({ id: 'HUMANEVAL', label: 'HumanEval frontier pass@1', unit: 'fraction', cadence: 'monthly' }),
  manualVar({ id: 'MATH', label: 'MATH benchmark frontier accuracy', unit: 'fraction', cadence: 'monthly' }),
] as const;

export function getVariable(id: string): GaugeVariable | undefined {
  return GAUGE_VARIABLES.find(v => v.id === id);
}

export function publicVariables(): readonly PublicVariable[] {
  return GAUGE_VARIABLES.filter((v): v is PublicVariable => v.provenance === 'PUBLIC_ONLY');
}

export function manualVariables(): readonly ManualVariable[] {
  return GAUGE_VARIABLES.filter((v): v is ManualVariable => v.provenance === 'MANUAL');
}
