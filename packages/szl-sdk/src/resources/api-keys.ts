import type { HttpClient } from '../http.js';
import type { ApiKey, ApiScope, CreatedApiKey } from '../types.js';

export class ApiKeysResource {
  constructor(private readonly http: HttpClient) {}

  async create(options: {
    name: string;
    scopes: ApiScope[];
    expiresInDays?: number;
  }): Promise<CreatedApiKey> {
    return this.http.post<CreatedApiKey>('/v1/api-keys', options);
  }

  async list(): Promise<ApiKey[]> {
    return this.http.get<ApiKey[]>('/v1/api-keys');
  }

  async revoke(id: number): Promise<void> {
    return this.http.delete<void>(`/v1/api-keys/${id}`);
  }

  async rotate(id: number): Promise<CreatedApiKey> {
    return this.http.post<CreatedApiKey>(`/v1/api-keys/${id}/rotate`);
  }
}
