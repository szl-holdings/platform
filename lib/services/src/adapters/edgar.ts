import { ServiceAdapter } from '../base.js';

export interface EdgarFiling {
  accessionNumber: string;
  filingDate: string;
  reportDate: string | null;
  form: string;
  primaryDocument: string;
  primaryDocDescription: string;
  entityName: string;
  cik: string;
}

export interface EdgarCompanyFacts {
  cik: number;
  entityName: string;
  facts: {
    'us-gaap'?: Record<string, EdgarConceptData>;
    dei?: Record<string, EdgarConceptData>;
  };
}

export interface EdgarConceptData {
  label: string;
  description: string;
  units: Record<string, EdgarConceptUnit[]>;
}

export interface EdgarConceptUnit {
  end: string;
  val: number;
  accn: string;
  fy: number;
  fp: string;
  form: string;
  filed: string;
  frame?: string;
}

export interface EdgarCompanyInfo {
  cik: string;
  name: string;
  sic: string;
  sicDescription: string;
  tickers: string[];
  exchanges: string[];
  stateOfIncorporation: string;
  fiscalYearEnd: string;
  category: string;
  filings: {
    recent: {
      accessionNumber: string[];
      filingDate: string[];
      reportDate: string[];
      form: string[];
      primaryDocument: string[];
      primaryDocDescription: string[];
    };
  };
}

export interface EdgarSearchResult {
  entityName: string;
  cik: string;
  tickers: string[];
  exchanges: string[];
  category: string;
}

const MOCK_EDGAR_COMPANIES: EdgarSearchResult[] = [
  {
    entityName: 'APPLE INC',
    cik: '0000320193',
    tickers: ['AAPL'],
    exchanges: ['Nasdaq'],
    category: 'Large accelerated filer',
  },
  {
    entityName: 'MICROSOFT CORP',
    cik: '0000789019',
    tickers: ['MSFT'],
    exchanges: ['Nasdaq'],
    category: 'Large accelerated filer',
  },
  {
    entityName: 'AMAZON COM INC',
    cik: '0001018724',
    tickers: ['AMZN'],
    exchanges: ['Nasdaq'],
    category: 'Large accelerated filer',
  },
  {
    entityName: 'BERKSHIRE HATHAWAY INC',
    cik: '0001067983',
    tickers: ['BRK-A', 'BRK-B'],
    exchanges: ['NYSE'],
    category: 'Large accelerated filer',
  },
  {
    entityName: 'JPMORGAN CHASE & CO',
    cik: '0000019617',
    tickers: ['JPM'],
    exchanges: ['NYSE'],
    category: 'Large accelerated filer',
  },
];

const MOCK_FILINGS: EdgarFiling[] = [
  {
    accessionNumber: '0000320193-25-000001',
    filingDate: '2025-11-01',
    reportDate: '2025-09-27',
    form: '10-K',
    primaryDocument: 'aapl-20250927.htm',
    primaryDocDescription: 'FORM 10-K',
    entityName: 'APPLE INC',
    cik: '0000320193',
  },
  {
    accessionNumber: '0000320193-25-000150',
    filingDate: '2026-02-01',
    reportDate: '2025-12-28',
    form: '10-Q',
    primaryDocument: 'aapl-20251228.htm',
    primaryDocDescription: 'FORM 10-Q',
    entityName: 'APPLE INC',
    cik: '0000320193',
  },
  {
    accessionNumber: '0000789019-25-000002',
    filingDate: '2025-07-31',
    reportDate: '2025-06-30',
    form: '10-K',
    primaryDocument: 'msft-20250630.htm',
    primaryDocDescription: 'FORM 10-K',
    entityName: 'MICROSOFT CORP',
    cik: '0000789019',
  },
];

const MOCK_COMPANY_FACTS: EdgarCompanyFacts = {
  cik: 320193,
  entityName: 'Apple Inc',
  facts: {
    'us-gaap': {
      Revenues: {
        label: 'Revenues',
        description:
          'Amount of revenue recognized from goods sold, services rendered, insurance premiums, or other activities.',
        units: {
          USD: [
            {
              end: '2025-09-27',
              val: 391035000000,
              accn: '0000320193-25-000001',
              fy: 2025,
              fp: 'FY',
              form: '10-K',
              filed: '2025-11-01',
            },
            {
              end: '2024-09-28',
              val: 391035000000,
              accn: '0000320193-24-000001',
              fy: 2024,
              fp: 'FY',
              form: '10-K',
              filed: '2024-11-01',
            },
          ],
        },
      },
      NetIncomeLoss: {
        label: 'Net Income (Loss) Attributable to Parent',
        description:
          'The portion of profit or loss for the period, net of income taxes, which is attributable to the parent.',
        units: {
          USD: [
            {
              end: '2025-09-27',
              val: 93736000000,
              accn: '0000320193-25-000001',
              fy: 2025,
              fp: 'FY',
              form: '10-K',
              filed: '2025-11-01',
            },
            {
              end: '2024-09-28',
              val: 93736000000,
              accn: '0000320193-24-000001',
              fy: 2024,
              fp: 'FY',
              form: '10-K',
              filed: '2024-11-01',
            },
          ],
        },
      },
    },
  },
};

export class SecEdgarAdapter extends ServiceAdapter {
  readonly name = 'sec_edgar';
  readonly description =
    'SEC EDGAR — free public API for company filings (10-K, 10-Q, 8-K), financial facts (XBRL), and entity search. No API key required. Rate-limited to 10 req/sec.';
  readonly requiredEnvVars: string[] = [];

  override get supportsMockMode(): boolean {
    return true;
  }

  private readonly BASE_URL = 'https://data.sec.gov';
  private readonly SUBMISSIONS_URL = 'https://data.sec.gov/submissions';
  private readonly FACTS_URL = 'https://data.sec.gov/api/xbrl/companyfacts';
  private readonly SEARCH_URL = 'https://efts.sec.gov/LATEST/search-index';

  private _lastRequestAt = 0;
  private readonly MIN_REQUEST_INTERVAL_MS = 120;

  private async throttledFetch(url: string): Promise<Response> {
    const now = Date.now();
    const wait = this.MIN_REQUEST_INTERVAL_MS - (now - this._lastRequestAt);
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    this._lastRequestAt = Date.now();

    return fetch(url, {
      headers: {
        'User-Agent': 'SZL-Holdings-Platform/1.0 compliance@szlholdings.com',
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(15000),
    });
  }

  protected override async performHealthCheck(): Promise<void> {
    const res = await this.throttledFetch(`${this.SUBMISSIONS_URL}/CIK0000320193.json`);
    if (!res.ok) throw new Error(`SEC EDGAR health check failed: HTTP ${res.status}`);
  }

  async searchCompanies(query: string): Promise<EdgarSearchResult[]> {
    if (this.isDemoMode) {
      const q = query.toLowerCase();
      return MOCK_EDGAR_COMPANIES.filter(
        (c) =>
          c.entityName.toLowerCase().includes(q) ||
          c.tickers.some((t) => t.toLowerCase().includes(q)),
      );
    }

    const url = `${this.SEARCH_URL}?q=${encodeURIComponent(query)}&dateRange=custom&startdt=2020-01-01&forms=10-K&hits.hits.total.value=true&hits.hits._source.period_of_report=true`;
    const res = await this.throttledFetch(url);
    if (!res.ok) throw new Error(`SEC EDGAR search error: HTTP ${res.status}`);
    const data = (await res.json()) as {
      hits?: { hits?: Array<{ _source?: { display_names?: string[]; file_num?: string[] } }> };
    };
    return (data.hits?.hits ?? []).map((h) => ({
      entityName: h._source?.display_names?.[0] ?? 'Unknown',
      cik: h._source?.file_num?.[0] ?? '',
      tickers: [],
      exchanges: [],
      category: '',
    }));
  }

  async getCompanyInfo(cik: string): Promise<EdgarCompanyInfo> {
    const paddedCik = cik.replace(/^CIK0*/, '').padStart(10, '0');
    if (this.isDemoMode) {
      const mock = MOCK_EDGAR_COMPANIES.find((c) => c.cik === cik || c.cik === `000${cik}`);
      return {
        cik: paddedCik,
        name: mock?.entityName ?? 'Unknown Company',
        sic: '7372',
        sicDescription: 'Prepackaged Software',
        tickers: mock?.tickers ?? [],
        exchanges: mock?.exchanges ?? [],
        stateOfIncorporation: 'DE',
        fiscalYearEnd: '0930',
        category: mock?.category ?? 'Large accelerated filer',
        filings: {
          recent: {
            accessionNumber: ['0000320193-25-000001'],
            filingDate: ['2025-11-01'],
            reportDate: ['2025-09-27'],
            form: ['10-K'],
            primaryDocument: ['aapl-20250927.htm'],
            primaryDocDescription: ['FORM 10-K'],
          },
        },
      };
    }

    const res = await this.throttledFetch(`${this.SUBMISSIONS_URL}/CIK${paddedCik}.json`);
    if (!res.ok) throw new Error(`SEC EDGAR company info error: HTTP ${res.status}`);
    const data = (await res.json()) as EdgarCompanyInfo;
    return data;
  }

  async getRecentFilings(cik: string, limit = 20, forms?: string[]): Promise<EdgarFiling[]> {
    if (this.isDemoMode) {
      let filings = [...MOCK_FILINGS];
      const normalizedCik = cik.replace(/^CIK0*/, '').replace(/^0+/, '');
      filings = filings.filter((f) => f.cik.replace(/^0+/, '') === normalizedCik || true);
      if (forms) filings = filings.filter((f) => forms.includes(f.form));
      return filings.slice(0, limit);
    }

    const info = await this.getCompanyInfo(cik);
    const recent = info.filings.recent;
    const count = Math.min(recent.accessionNumber.length, limit);
    const filings: EdgarFiling[] = [];

    for (let i = 0; i < count; i++) {
      if (forms && !forms.includes(recent.form[i]!)) continue;
      filings.push({
        accessionNumber: recent.accessionNumber[i]!,
        filingDate: recent.filingDate[i]!,
        reportDate: recent.reportDate[i] ?? null,
        form: recent.form[i]!,
        primaryDocument: recent.primaryDocument[i]!,
        primaryDocDescription: recent.primaryDocDescription[i]!,
        entityName: info.name,
        cik,
      });
    }

    return filings;
  }

  async getCompanyFacts(cik: string): Promise<EdgarCompanyFacts> {
    if (this.isDemoMode) return MOCK_COMPANY_FACTS;

    const paddedCik = cik.replace(/^CIK0*/, '').padStart(10, '0');
    const res = await this.throttledFetch(`${this.FACTS_URL}/CIK${paddedCik}.json`);
    if (!res.ok) throw new Error(`SEC EDGAR company facts error: HTTP ${res.status}`);
    return res.json() as Promise<EdgarCompanyFacts>;
  }

  async getConceptData(
    cik: string,
    taxonomy: string,
    concept: string,
  ): Promise<EdgarConceptUnit[]> {
    if (this.isDemoMode) {
      const facts = MOCK_COMPANY_FACTS.facts['us-gaap'];
      return facts?.[concept]?.units?.USD ?? [];
    }

    const paddedCik = cik.replace(/^CIK0*/, '').padStart(10, '0');
    const url = `${this.BASE_URL}/api/xbrl/companyconcept/CIK${paddedCik}/${taxonomy}/${concept}.json`;
    const res = await this.throttledFetch(url);
    if (!res.ok) throw new Error(`SEC EDGAR concept error: HTTP ${res.status}`);
    const data = (await res.json()) as { units?: Record<string, EdgarConceptUnit[]> };
    return data.units?.USD ?? [];
  }
}
