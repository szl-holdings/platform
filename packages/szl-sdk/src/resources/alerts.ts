import type { HttpClient } from '../http.js';
import type { PaginationOptions, PaginatedResponse } from '../types.js';

export interface Alert {
  id: string | number;
  title: string;
  severity: string;
  status: string;
  createdAt: string;
}

export class AlertsResource {
  constructor(private readonly http: HttpClient) {}

  async list(options: PaginationOptions & { status?: string } = {}): Promise<PaginatedResponse<Alert>> {
    return this.http.get<PaginatedResponse<Alert>>('/v1/alerts', options);
  }
}
