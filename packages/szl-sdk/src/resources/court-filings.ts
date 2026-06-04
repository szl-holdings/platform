import type { HttpClient } from '../http.js';
import type { CourtFiling, PaginationOptions } from '../types.js';

export class CourtFilingsResource {
  constructor(private readonly http: HttpClient) {}

  async prepare(options: {
    matterId?: number;
    filingType: 'complaint' | 'motion' | 'answer' | 'brief' | 'notice' | 'order' | 'stipulation' | 'subpoena' | 'other';
    jurisdiction: string;
    courtName?: string;
    caseNumber?: string;
    documentTitle: string;
    documentUrl?: string;
    dueDate?: string;
  }): Promise<CourtFiling & { efsInfo: unknown }> {
    return this.http.post('/counsel/court-filings', options);
  }

  async list(
    options: PaginationOptions & { matterId?: number; status?: string } = {},
  ): Promise<CourtFiling[]> {
    return this.http.get('/counsel/court-filings', options);
  }

  async get(id: number): Promise<CourtFiling & { timeline: unknown[] }> {
    return this.http.get(`/counsel/court-filings/${id}`);
  }

  async submit(
    id: number,
    options: { attestationAccepted: true; filingFeeAmount?: string },
  ): Promise<{ status: string; submittedAt: string; electronicFiling: boolean; message: string }> {
    return this.http.post(`/counsel/court-filings/${id}/submit`, options);
  }

  async listJurisdictions(): Promise<{ jurisdictions: unknown[] }> {
    return this.http.get('/counsel/court-filings/jurisdictions');
  }
}
