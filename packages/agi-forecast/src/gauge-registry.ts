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
 * All are ingested live from public, no-auth, license-allowlisted sources
 * (PUBLIC_ONLY): GitHub repo metadata/releases/tags/READMEs and Epoch AI's
 * CSV. Units are heterogeneous (commits, model-count, stars, open-issues,
 * reports, semver, fraction) — see each entry's `unit` field for the
 * semantic shape of the ingested value.
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
  publicVar({
    id: 'APOLLO',
    label: 'Apollo Research scheming-eval activity index',
    source: 'https://api.github.com/repos/ApolloResearch/deception-detection',
    unit: 'open-issues',
    cadence: 'monthly',
    license: 'MIT',
  }),
  publicVar({
    id: 'AISI',
    label: 'UK AI Safety Institute Inspect framework release count',
    source: 'https://api.github.com/repos/UKGovernmentBEIS/inspect_ai/releases?per_page=100',
    unit: 'reports',
    cadence: 'monthly',
    license: 'MIT',
  }),
  publicVar({
    id: 'RSP',
    label: 'Anthropic Responsible Scaling Policy proxy (cookbook latest tag)',
    source: 'https://api.github.com/repos/anthropics/anthropic-cookbook/tags?per_page=1',
    unit: 'semver',
    cadence: 'event-driven',
    license: 'MIT',
  }),
  publicVar({
    id: 'FSF',
    label: 'Google DeepMind Frontier Safety Framework proxy (deepmind-research latest tag)',
    source: 'https://api.github.com/repos/google-deepmind/deepmind-research/tags?per_page=1',
    unit: 'semver',
    cadence: 'event-driven',
    license: 'Apache-2.0',
  }),
  publicVar({
    id: 'GPQA',
    label: 'GPQA Diamond reference README max-score fraction',
    source: 'https://api.github.com/repos/idavidrein/gpqa/readme',
    unit: 'fraction',
    cadence: 'monthly',
    license: 'MIT',
  }),
  publicVar({
    id: 'MMLU',
    label: 'MMLU reference README max-score fraction',
    source: 'https://api.github.com/repos/hendrycks/test/readme',
    unit: 'fraction',
    cadence: 'monthly',
    license: 'MIT',
  }),
  publicVar({
    id: 'SWE_BENCH',
    label: 'SWE-bench Verified README max-score fraction',
    source: 'https://api.github.com/repos/princeton-nlp/SWE-bench/readme',
    unit: 'fraction',
    cadence: 'monthly',
    license: 'MIT',
  }),
  publicVar({
    id: 'HUMANEVAL',
    label: 'HumanEval README max-score fraction',
    source: 'https://api.github.com/repos/openai/human-eval/readme',
    unit: 'fraction',
    cadence: 'monthly',
    license: 'MIT',
  }),
  publicVar({
    id: 'MATH',
    label: 'MATH benchmark README max-score fraction',
    source: 'https://api.github.com/repos/hendrycks/math/readme',
    unit: 'fraction',
    cadence: 'monthly',
    license: 'MIT',
  }),
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
