import type { HttpClient } from '../http.js';
import type { EsignatureRequest, PaginationOptions } from '../types.js';

export interface Signatory {
  email: string;
  name: string;
  role?: string;
  order?: number;
}

export class EsignatureResource {
  constructor(private readonly http: HttpClient) {}

  async send(options: {
    matterId?: number;
    documentTitle: string;
    documentUrl?: string;
    signatories: Signatory[];
    expiresInDays?: number;
    message?: string;
  }): Promise<EsignatureRequest & { providerUrl?: string }> {
    return this.http.post('/counsel/esignature/send', options);
  }

  async list(options: PaginationOptions & { matterId?: number } = {}): Promise<EsignatureRequest[]> {
    return this.http.get('/counsel/esignature/requests', options);
  }

  async get(id: number): Promise<EsignatureRequest & { events: unknown[] }> {
    return this.http.get(`/counsel/esignature/requests/${id}`);
  }

  async void(id: number): Promise<void> {
    return this.http.delete(`/counsel/esignature/requests/${id}`);
  }
}
