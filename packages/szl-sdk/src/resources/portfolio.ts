import type { HttpClient } from '../http.js';

export interface PortfolioSummary {
  summary: string;
  note: string;
  version: string;
}

export class PortfolioResource {
  constructor(private readonly http: HttpClient) {}

  async getSummary(): Promise<PortfolioSummary> {
    return this.http.get<PortfolioSummary>('/v1/portfolio');
  }
}
