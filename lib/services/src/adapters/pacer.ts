import { ServiceAdapter } from '../base.js';

export interface PACERCase {
  caseId: string;
  caseNumber: string;
  title: string;
  court: string;
  courtCode: string;
  dateOpened: string;
  dateClosed: string | null;
  caseType: string;
  causeCodes: string[];
  natureOfSuit: string | null;
  jurisdictionType: string;
  juryDemand: string | null;
  classAction: boolean;
  status: 'open' | 'closed' | 'unknown';
  parties: Array<{ name: string; role: string; attorney: string | null }>;
}

export interface PACERDocketEntry {
  documentNumber: string;
  dateFiled: string;
  description: string;
  pageCount: number | null;
  attachments: number;
  documentId: string | null;
  isSealed: boolean;
}

export interface PACERSearchResult {
  cases: PACERCase[];
  totalCount: number;
  nextCursor: string | null;
}

const MOCK_CASES: PACERCase[] = [
  {
    caseId: 'nysd-2026-cv-04821',
    caseNumber: '1:26-cv-04821',
    title: 'Harmon Capital LLC v. Meridian Properties Inc.',
    court: 'U.S. District Court for the Southern District of New York',
    courtCode: 'nysd',
    dateOpened: '2026-01-14',
    dateClosed: null,
    caseType: 'cv',
    causeCodes: ['28:1332'],
    natureOfSuit: '190',
    jurisdictionType: 'Diversity',
    juryDemand: 'Plaintiff',
    classAction: false,
    status: 'open',
    parties: [
      { name: 'Harmon Capital LLC', role: 'plaintiff', attorney: 'Sarah Chen, Latham & Watkins' },
      {
        name: 'Meridian Properties Inc.',
        role: 'defendant',
        attorney: 'James Torres, Skadden Arps',
      },
    ],
  },
  {
    caseId: 'nysd-2025-cv-18340',
    caseNumber: '1:25-cv-18340',
    title: 'SEC v. NexGen Advisors LLC et al.',
    court: 'U.S. District Court for the Southern District of New York',
    courtCode: 'nysd',
    dateOpened: '2025-08-07',
    dateClosed: null,
    caseType: 'cv',
    causeCodes: ['15:78j'],
    natureOfSuit: '850',
    jurisdictionType: 'Federal Question',
    juryDemand: null,
    classAction: false,
    status: 'open',
    parties: [
      {
        name: 'Securities and Exchange Commission',
        role: 'plaintiff',
        attorney: 'U.S. Attorney SDNY',
      },
      { name: 'NexGen Advisors LLC', role: 'defendant', attorney: 'Michael Ross, Gibson Dunn' },
    ],
  },
];

export class PACERAdapter extends ServiceAdapter {
  readonly name = 'pacer';
  readonly description =
    'PACER (Public Access to Court Electronic Records) — federal court case filings, docket entries, and party search via the PACER API. Requires PACER username/password. Falls back to demo mode when PACER credentials are absent.';
  readonly requiredEnvVars = ['PACER_USERNAME', 'PACER_PASSWORD'];

  private get username(): string | undefined {
    return process.env['PACER_USERNAME'];
  }
  private get password(): string | undefined {
    return process.env['PACER_PASSWORD'];
  }

  private readonly BASE_URL = 'https://pcl.uscourts.gov/pcl-public-api/rest';
  private _token: string | null = null;
  private _tokenExpiry: number = 0;

  private async getToken(): Promise<string> {
    if (this._token && Date.now() < this._tokenExpiry) return this._token;
    const res = await fetch(`${this.BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ loginId: this.username, password: this.password }),
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) throw new Error(`PACER login failed: HTTP ${res.status}`);
    const data = (await res.json()) as { nextGenCSO?: string; token?: string };
    this._token = data.nextGenCSO ?? data.token ?? '';
    this._tokenExpiry = Date.now() + 55 * 60 * 1000;
    return this._token;
  }

  private async pacerRequest<T>(path: string, body: Record<string, unknown> = {}): Promise<T> {
    const token = await this.getToken();
    const res = await fetch(`${this.BASE_URL}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-NEXT-GEN-CSO': token,
        Accept: 'application/json',
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) throw new Error(`PACER API error: HTTP ${res.status}`);
    return res.json() as Promise<T>;
  }

  protected override async performHealthCheck(): Promise<void> {
    await this.getToken();
  }

  async searchCases(params: {
    partyName?: string;
    caseTitle?: string;
    courtCode?: string;
    dateFiledStart?: string;
    dateFiledEnd?: string;
    limit?: number;
  }): Promise<PACERSearchResult> {
    if (this.isDemoMode)
      return { cases: MOCK_CASES, totalCount: MOCK_CASES.length, nextCursor: null };
    const body: Record<string, unknown> = {
      pageNumber: 1,
      pageSize: params.limit ?? 20,
    };
    if (params.partyName) body['lastName'] = params.partyName;
    if (params.caseTitle) body['caseTitle'] = params.caseTitle;
    if (params.courtCode) body['courtIds'] = [params.courtCode];
    if (params.dateFiledStart) body['dateFiledFrom'] = params.dateFiledStart;
    if (params.dateFiledEnd) body['dateFiledTo'] = params.dateFiledEnd;

    const data = await this.pacerRequest<{
      content: Array<Record<string, unknown>>;
      totalElements: number;
    }>('/cases/find', body);
    return {
      cases: (data.content ?? []).map((c) => ({
        caseId: String(c['caseId'] ?? ''),
        caseNumber: String(c['caseNumberFull'] ?? ''),
        title: String(c['caseTitle'] ?? ''),
        court: String(c['courtName'] ?? ''),
        courtCode: String(c['courtId'] ?? ''),
        dateOpened: String(c['dateFiled'] ?? ''),
        dateClosed: c['dateClosed'] ? String(c['dateClosed']) : null,
        caseType: String(c['caseType'] ?? 'cv'),
        causeCodes: [],
        natureOfSuit: c['natureOfSuit'] ? String(c['natureOfSuit']) : null,
        jurisdictionType: String(c['jurisdictionType'] ?? ''),
        juryDemand: null,
        classAction: false,
        status: c['dateClosed'] ? 'closed' : 'open',
        parties: [],
      })),
      totalCount: data.totalElements ?? 0,
      nextCursor: null,
    };
  }

  async getCaseDocket(caseId: string, limit = 20): Promise<PACERDocketEntry[]> {
    if (this.isDemoMode) {
      return [
        {
          documentNumber: '1',
          dateFiled: '2026-01-14',
          description: 'COMPLAINT against Meridian Properties Inc.',
          pageCount: 32,
          attachments: 4,
          documentId: 'doc-001',
          isSealed: false,
        },
        {
          documentNumber: '12',
          dateFiled: '2026-02-01',
          description: 'ANSWER to Complaint',
          pageCount: 18,
          attachments: 1,
          documentId: 'doc-012',
          isSealed: false,
        },
        {
          documentNumber: '27',
          dateFiled: '2026-03-15',
          description: 'MOTION for Summary Judgment',
          pageCount: 45,
          attachments: 12,
          documentId: 'doc-027',
          isSealed: false,
        },
      ];
    }
    const data = await this.pacerRequest<{ content: Array<Record<string, unknown>> }>(
      `/cases/${caseId}/dockets`,
      { pageSize: limit },
    );
    return (data.content ?? []).map((d) => ({
      documentNumber: String(d['documentNumber'] ?? ''),
      dateFiled: String(d['dateFiled'] ?? ''),
      description: String(d['docketText'] ?? ''),
      pageCount: d['pageCount'] ? Number(d['pageCount']) : null,
      attachments: Number(d['attachmentCount'] ?? 0),
      documentId: d['documentId'] ? String(d['documentId']) : null,
      isSealed: Boolean(d['sealed']),
    }));
  }

  getMockCases(): PACERCase[] {
    return MOCK_CASES;
  }
}
