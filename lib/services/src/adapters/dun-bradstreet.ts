import { ServiceAdapter } from '../base.js';

export interface DNBCompanyProfile {
  duns: string;
  primaryName: string;
  tradeStyleName: string | null;
  registrationNumbers: Array<{ registrationNumber: string; typeDescription: string }>;
  primaryAddress: {
    streetAddress: string;
    city: string;
    state: string;
    countryCode: string;
    postalCode: string;
  };
  telephone: string | null;
  websiteAddress: string | null;
  email: string | null;
  entityType: string;
  industryCode: string;
  industryCodes: Array<{ code: string; description: string; typeDescription: string }>;
  employeeCount: number | null;
  revenue: number | null;
  revenueCurrency: string | null;
  isPubliclyTraded: boolean;
  stockExchange: string | null;
  tickerSymbol: string | null;
  yearOfIncorporation: number | null;
  countryOfIncorporation: string | null;
  creditScore: number | null;
  paydexScore: number | null;
  delinquencyRisk: string | null;
  subsidiaries: number | null;
  ultimateParent: { duns: string; name: string } | null;
}

export interface DNBCreditReport {
  duns: string;
  companyName: string;
  compositeRisk: { rating: string; class: number; description: string };
  delinquencyScore: { value: number; class: number; description: string };
  failureScore: { value: number; class: number; description: string };
  paydexScore: number;
  paydexCategory: string;
  creditLimitRecommendation: number | null;
  tradelines: number;
  averageDaysBeyondTerms: number | null;
  highCredit: number | null;
  balanceOwed: number | null;
  publicFilings: number;
  liens: number;
  judgments: number;
  bankruptcies: number;
}

const MOCK_COMPANIES: DNBCompanyProfile[] = [
  {
    duns: '80-447-2110',
    primaryName: 'NEXGEN ADVISORS LLC',
    tradeStyleName: 'NexGen Capital',
    registrationNumbers: [{ registrationNumber: '4891203', typeDescription: 'Federal Tax ID' }],
    primaryAddress: {
      streetAddress: '200 Park Ave Fl 10',
      city: 'New York',
      state: 'NY',
      countryCode: 'US',
      postalCode: '10166',
    },
    telephone: null,
    websiteAddress: null,
    email: null,
    entityType: 'LLC',
    industryCode: '523120',
    industryCodes: [
      { code: '523120', description: 'Securities Brokerage', typeDescription: 'US SIC' },
    ],
    employeeCount: 42,
    revenue: 18500000,
    revenueCurrency: 'USD',
    isPubliclyTraded: false,
    stockExchange: null,
    tickerSymbol: null,
    yearOfIncorporation: 2018,
    countryOfIncorporation: 'US',
    creditScore: 42,
    paydexScore: 68,
    delinquencyRisk: 'Moderate',
    subsidiaries: 0,
    ultimateParent: null,
  },
  {
    duns: '04-292-6073',
    primaryName: 'MERIDIAN PROPERTIES INC',
    tradeStyleName: null,
    registrationNumbers: [{ registrationNumber: '56891022', typeDescription: 'Federal Tax ID' }],
    primaryAddress: {
      streetAddress: '1240 Broadway',
      city: 'New York',
      state: 'NY',
      countryCode: 'US',
      postalCode: '10001',
    },
    telephone: '+1-212-555-0184',
    websiteAddress: 'https://meridian-prop.com',
    email: 'info@meridian-prop.com',
    entityType: 'Corporation',
    industryCode: '531110',
    industryCodes: [
      {
        code: '531110',
        description: 'Lessors of Residential Buildings',
        typeDescription: 'US SIC',
      },
    ],
    employeeCount: 87,
    revenue: 45200000,
    revenueCurrency: 'USD',
    isPubliclyTraded: false,
    stockExchange: null,
    tickerSymbol: null,
    yearOfIncorporation: 2001,
    countryOfIncorporation: 'US',
    creditScore: 78,
    paydexScore: 82,
    delinquencyRisk: 'Low',
    subsidiaries: 4,
    ultimateParent: null,
  },
];

export class DunBradstreetAdapter extends ServiceAdapter {
  readonly name = 'dun-bradstreet';
  readonly description =
    'Dun & Bradstreet Data Cloud — company firmographics, D-U-N-S lookups, credit scores, PAYDEX, risk ratings, and supply chain intelligence. Enterprise API. Falls back to demo mode when DNB_API_KEY is absent.';
  readonly requiredEnvVars = ['DNB_API_KEY', 'DNB_CLIENT_ID', 'DNB_CLIENT_SECRET'];

  private get apiKey(): string | undefined {
    return process.env['DNB_API_KEY'];
  }
  private get clientId(): string | undefined {
    return process.env['DNB_CLIENT_ID'];
  }
  private get clientSecret(): string | undefined {
    return process.env['DNB_CLIENT_SECRET'];
  }

  private readonly BASE_URL = 'https://plus.dnb.com/v1';
  private _token: string | null = null;
  private _tokenExpiry: number = 0;

  private async getToken(): Promise<string> {
    if (this._token && Date.now() < this._tokenExpiry) return this._token;
    const credentials = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
    const res = await fetch('https://plus.dnb.com/v2/token', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) throw new Error(`D&B auth failed: HTTP ${res.status}`);
    const data = (await res.json()) as { access_token: string; expires_in: number };
    this._token = data.access_token;
    this._tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
    return this._token;
  }

  private async dnbRequest<T>(path: string, params: Record<string, string> = {}): Promise<T> {
    const token = await this.getToken();
    const url = new URL(`${this.BASE_URL}${path}`);
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) throw new Error(`D&B API error: HTTP ${res.status}`);
    return res.json() as Promise<T>;
  }

  protected override async performHealthCheck(): Promise<void> {
    await this.getToken();
  }

  async lookupByDUNS(duns: string): Promise<DNBCompanyProfile | null> {
    if (this.isDemoMode)
      return MOCK_COMPANIES.find((c) => c.duns === duns) ?? MOCK_COMPANIES[0] ?? null;
    const data = await this.dnbRequest<{ organization: Record<string, unknown> }>(
      `/data/duns/${duns}`,
      { blockIDs: 'companyinfo_L1_v1,hierarchyconnections_L1_v1' },
    );
    const org = data.organization;
    return this.mapOrg(duns, org);
  }

  async searchByName(name: string, country = 'US'): Promise<DNBCompanyProfile[]> {
    if (this.isDemoMode)
      return MOCK_COMPANIES.filter((c) => c.primaryName.toLowerCase().includes(name.toLowerCase()));
    const data = await this.dnbRequest<{
      matchCandidates: Array<{ organization: Record<string, unknown>; duns: string }>;
    }>('/match/cleanseMatch', { name, countryISOAlpha2Code: country });
    return (data.matchCandidates ?? []).slice(0, 5).map((m) => this.mapOrg(m.duns, m.organization));
  }

  async getCreditReport(duns: string): Promise<DNBCreditReport> {
    if (this.isDemoMode) {
      const company = MOCK_COMPANIES.find((c) => c.duns === duns) ?? MOCK_COMPANIES[0]!;
      return {
        duns,
        companyName: company.primaryName,
        compositeRisk: { rating: '2', class: 2, description: 'Moderate risk' },
        delinquencyScore: {
          value: company.paydexScore ?? 65,
          class: 2,
          description: 'Moderate probability of severe delinquency',
        },
        failureScore: { value: 42, class: 3, description: 'Moderate risk of failure' },
        paydexScore: company.paydexScore ?? 65,
        paydexCategory: 'Slow',
        creditLimitRecommendation: 25000,
        tradelines: 12,
        averageDaysBeyondTerms: 8,
        highCredit: 125000,
        balanceOwed: 48200,
        publicFilings: 2,
        liens: 1,
        judgments: 0,
        bankruptcies: 0,
      };
    }
    const data = await this.dnbRequest<Record<string, unknown>>(`/data/duns/${duns}`, {
      blockIDs: 'paymentinsight_L1_v1,financialstrengthinsight_L1_v1',
    });
    const org = (data['organization'] as Record<string, unknown>) ?? {};
    return {
      duns,
      companyName: String(org['primaryName'] ?? ''),
      compositeRisk: { rating: '—', class: 0, description: 'See full report' },
      delinquencyScore: { value: 0, class: 0, description: '' },
      failureScore: { value: 0, class: 0, description: '' },
      paydexScore: 0,
      paydexCategory: '',
      creditLimitRecommendation: null,
      tradelines: 0,
      averageDaysBeyondTerms: null,
      highCredit: null,
      balanceOwed: null,
      publicFilings: 0,
      liens: 0,
      judgments: 0,
      bankruptcies: 0,
    };
  }

  private mapOrg(duns: string, org: Record<string, unknown>): DNBCompanyProfile {
    const addr = (org['primaryAddress'] as Record<string, unknown>) ?? {};
    return {
      duns,
      primaryName: String(org['primaryName'] ?? ''),
      tradeStyleName: null,
      registrationNumbers: [],
      primaryAddress: {
        streetAddress: String((addr['streetAddress'] as Record<string, unknown>)?.['line1'] ?? ''),
        city: String(addr['addressLocality'] ?? ''),
        state: String(addr['addressRegion'] ?? ''),
        countryCode: String(
          (addr['addressCountry'] as Record<string, unknown>)?.['isoAlpha2Code'] ?? '',
        ),
        postalCode: String(addr['postalCode'] ?? ''),
      },
      telephone: null,
      websiteAddress: null,
      email: null,
      entityType: String(org['businessEntityType'] ?? ''),
      industryCode: '',
      industryCodes: [],
      employeeCount: null,
      revenue: null,
      revenueCurrency: null,
      isPubliclyTraded: false,
      stockExchange: null,
      tickerSymbol: null,
      yearOfIncorporation: null,
      countryOfIncorporation: null,
      creditScore: null,
      paydexScore: null,
      delinquencyRisk: null,
      subsidiaries: null,
      ultimateParent: null,
    };
  }

  getMockCompanies(): DNBCompanyProfile[] {
    return MOCK_COMPANIES;
  }
}
