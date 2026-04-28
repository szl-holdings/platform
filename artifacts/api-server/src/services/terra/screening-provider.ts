
export interface ScreeningProviderResult {
  providerName: string;
  providerStatus: 'live' | 'sandbox' | 'unavailable';
  creditScore?: number;
  creditHistory: string;
  bankruptcies: number;
  judgments: number;
  incomeVerified: boolean;
  backgroundClear: boolean;
  evictionRecords: number;
  radarScores: {
    income: number;
    credit: number;
    rental: number;
    overall: number;
  };
  flags: Array<{ severity: string; field: string; note: string }>;
  rawResponse?: Record<string, unknown>;
}

export interface ScreeningProviderInput {
  name: string;
  annualIncome?: number;
  creditScore?: number;
  targetRent?: number;
}

export interface ScreeningProvider {
  name: string;
  isAvailable(): boolean;
  screen(input: ScreeningProviderInput): Promise<ScreeningProviderResult>;
}

export class MockScreeningProvider implements ScreeningProvider {
  name = 'SZL Internal Screening (Sandbox)';

  isAvailable() {
    return true;
  }

  async screen(input: ScreeningProviderInput): Promise<ScreeningProviderResult> {
    const seed = input.name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const rng = (min: number, max: number, offset = 0) => min + ((seed + offset) % (max - min + 1));

    const creditScore = input.creditScore ?? rng(580, 820, 1);
    const annualIncome = input.annualIncome ?? rng(45_000, 180_000, 2) * 1000;
    const rentToIncome = input.targetRent
      ? (input.targetRent * 12) / annualIncome
      : rng(25, 45, 3) / 100;
    const bankruptcies = creditScore < 600 && rng(0, 3, 4) > 2 ? 1 : 0;
    const judgments = creditScore < 650 && rng(0, 5, 5) > 3 ? 1 : 0;
    const evictions = creditScore < 620 && rng(0, 5, 6) > 3 ? 1 : 0;
    const backgroundClear = creditScore > 640 && evictions === 0;

    const incomeScore = Math.min(
      100,
      Math.round(
        (annualIncome / (input.targetRent ? input.targetRent * 12 * 3.5 : 80_000)) * 100,
      ),
    );
    const creditRatingScore = Math.round(((creditScore - 300) / 550) * 100);
    const rentalScore = evictions === 0 ? (backgroundClear ? 85 + rng(0, 15, 7) : 65) : 40;
    const overall = Math.round(incomeScore * 0.35 + creditRatingScore * 0.4 + rentalScore * 0.25);

    const flags: Array<{ severity: string; field: string; note: string }> = [];
    if (creditScore < 620)
      flags.push({
        severity: 'error',
        field: 'Credit Score',
        note: `Credit score ${creditScore} is below minimum threshold of 620`,
      });
    if (rentToIncome > 0.4)
      flags.push({
        severity: 'warning',
        field: 'Rent-to-Income',
        note: `Rent-to-income ratio ${(rentToIncome * 100).toFixed(0)}% exceeds recommended 40%`,
      });
    if (bankruptcies > 0)
      flags.push({
        severity: 'error',
        field: 'Bankruptcy',
        note: 'Bankruptcy filing detected in screening history',
      });
    if (judgments > 0)
      flags.push({
        severity: 'warning',
        field: 'Judgments',
        note: `${judgments} civil judgment(s) found in public records`,
      });
    if (evictions > 0)
      flags.push({
        severity: 'error',
        field: 'Eviction Record',
        note: 'Prior eviction proceeding found — lease denied under standard policy',
      });

    const historyDescriptors =
      creditScore >= 750
        ? 'Excellent — clean payment history, zero delinquencies'
        : creditScore >= 700
          ? 'Good — 2-3 late payments in prior 24 months, no collections'
          : creditScore >= 650
            ? 'Fair — occasional late payments, 1 collection account'
            : 'Poor — multiple delinquencies, collection activity present';

    return {
      providerName: this.name,
      providerStatus: 'sandbox',
      creditScore,
      creditHistory: historyDescriptors,
      bankruptcies,
      judgments,
      evictionRecords: evictions,
      incomeVerified: rentToIncome < 0.4 && annualIncome > 45_000,
      backgroundClear,
      radarScores: {
        income: Math.min(100, incomeScore),
        credit: Math.min(100, creditRatingScore),
        rental: Math.min(100, rentalScore),
        overall: Math.min(100, overall),
      },
      flags,
    };
  }
}

export class EquifaxScreeningProvider implements ScreeningProvider {
  name = 'Equifax DecisionPoint';
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  isAvailable() {
    return this.apiKey.length > 10;
  }

  async screen(input: ScreeningProviderInput): Promise<ScreeningProviderResult> {
    const url = 'https://api.equifax.com/business/creditrisk/v2/reports';
    const resp = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${this.apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        applicantName: input.name,
        product: 'consumer-credit-report',
        consent: true,
      }),
    });
    if (!resp.ok) throw new Error(`Equifax API error ${resp.status}`);
    const raw = (await resp.json()) as Record<string, unknown>;
    const credit = (raw.creditScore as Record<string, unknown>) ?? {};
    const creditScore = (credit.score as number) ?? 0;
    return {
      providerName: this.name,
      providerStatus: 'live',
      creditScore,
      creditHistory: (credit.summary as string) ?? 'See raw response',
      bankruptcies: (raw.publicRecords as number) ?? 0,
      judgments: (raw.judgments as number) ?? 0,
      evictionRecords: 0,
      incomeVerified: false,
      backgroundClear: true,
      radarScores: {
        income: 0,
        credit: Math.round(((creditScore - 300) / 550) * 100),
        rental: 0,
        overall: 0,
      },
      flags: [],
      rawResponse: raw,
    };
  }
}

export function getScreeningProvider(): ScreeningProvider {
  const equifaxKey = process.env.EQUIFAX_API_KEY ?? '';
  if (equifaxKey.length > 10) return new EquifaxScreeningProvider(equifaxKey);
  return new MockScreeningProvider();
}
