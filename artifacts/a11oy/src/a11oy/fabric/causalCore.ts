export interface CausalExplanation {
  signalId: string;
  headline: string;
  causalChain: Array<{
    step: number;
    description: string;
    evidenceRef?: string;
  }>;
  confidence: number;
  generatedAt: string;
}

export interface CausalCoreInterface {
  explain(signalId: string): Promise<CausalExplanation | undefined>;
}

const DEMO_EXPLANATIONS: Record<string, CausalExplanation> = {
  'sig-lyte-002': {
    signalId: 'sig-lyte-002',
    headline: 'Mid-market churn driven by value-for-price perception gap following Q1 pricing change.',
    causalChain: [
      { step: 1, description: 'Q1 2026 pricing increase of 18% applied across mid-market tier', evidenceRef: 'lyte/pricing/q1-change-notice' },
      { step: 2, description: 'NPS in mid-market segment declined from 58 to 43 — 12 detractor responses cite price', evidenceRef: 'lyte/cs/nps-q2-2026' },
      { step: 3, description: 'Three highest-volume accounts entered 90-day review cycle; no CSM touchpoint in 45 days' },
      { step: 4, description: 'Cancellation notices issued by three accounts; revenue impact $180K ARR' },
    ],
    confidence: 0.86,
    generatedAt: new Date(Date.now() - 1 * 3_600_000).toISOString(),
  },
  'sig-terra-001': {
    signalId: 'sig-terra-001',
    headline: 'Covenant breach caused by accelerated post-pandemic office downsizing in the Wilshire corridor.',
    causalChain: [
      { step: 1, description: 'Remote-work hybrid policy extensions by major tenants reduced space requirements 20%', evidenceRef: 'terra/market/la-office-demand-2026' },
      { step: 2, description: 'Two anchor tenants (12,000 sqft combined) did not renew in Q4 2025' },
      { step: 3, description: 'Backfill attempts failed — market absorption rate below 60% in submarket' },
      { step: 4, description: 'Vacancy reached 34%, breaching 30% debt covenant threshold', evidenceRef: 'terra/debt/covenant-monitor' },
    ],
    confidence: 0.91,
    generatedAt: new Date(Date.now() - 0.5 * 3_600_000).toISOString(),
  },
};

class InMemoryCausalCore implements CausalCoreInterface {
  async explain(signalId: string): Promise<CausalExplanation | undefined> {
    return DEMO_EXPLANATIONS[signalId];
  }
}

export const causalCore: CausalCoreInterface = new InMemoryCausalCore();
