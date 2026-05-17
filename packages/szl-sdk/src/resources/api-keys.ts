import type { HttpClient } from '../http.js';
import type { LambdaGate } from '../lambda-gate.js';
import type { ApiKey, ApiScope, CreatedApiKey } from '../types.js';

export class ApiKeysResource {
  constructor(
    private readonly http: HttpClient,
    private readonly gate?: LambdaGate,
  ) {}

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

  async revoke(id: number, options: { approvalToken?: string } = {}): Promise<void> {
    const gateDecision = this.gate
      ? await this.gate.check('apiKeys.revoke', { approvalToken: options.approvalToken })
      : undefined;
    return this.http.request<void>('DELETE', `/v1/api-keys/${id}`, {
      ...(gateDecision ? { gateDecision } : {}),
    });
  }

  async rotate(id: number): Promise<CreatedApiKey> {
    return this.http.post<CreatedApiKey>(`/v1/api-keys/${id}/rotate`);
  }
}
