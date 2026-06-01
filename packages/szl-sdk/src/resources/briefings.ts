import type { HttpClient } from '../http.js';
import type { PaginationOptions, PaginatedResponse } from '../types.js';

export interface Briefing {
  id: string | number;
  title: string;
  summary: string;
  createdAt: string;
}

export class BriefingsResource {
  constructor(private readonly http: HttpClient) {}

  async list(options: PaginationOptions = {}): Promise<PaginatedResponse<Briefing>> {
    return this.http.get<PaginatedResponse<Briefing>>('/v1/briefings', {
      limit: options.limit,
      offset: options.offset,
      page: options.page,
    });
  }

  async get(id: string | number): Promise<Briefing> {
    return this.http.get<Briefing>(`/v1/briefings/${id}`);
  }
}
