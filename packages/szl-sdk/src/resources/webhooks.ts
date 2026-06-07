import type { HttpClient } from '../http.js';
import type { WebhookDelivery, WebhookEndpoint } from '../types.js';

export class WebhooksResource {
  constructor(private readonly http: HttpClient) {}

  async list(): Promise<WebhookEndpoint[]> {
    return this.http.get<WebhookEndpoint[]>('/webhooks');
  }

  async create(options: {
    url: string;
    eventTypes?: string[] | '*';
    description?: string;
  }): Promise<WebhookEndpoint & { secret: string }> {
    return this.http.post<WebhookEndpoint & { secret: string }>('/webhooks', options);
  }

  async get(id: string): Promise<WebhookEndpoint> {
    return this.http.get<WebhookEndpoint>(`/webhooks/endpoints/${id}`);
  }

  async update(
    id: string,
    options: { url?: string; eventTypes?: string[] | '*'; active?: boolean; description?: string },
  ): Promise<WebhookEndpoint> {
    return this.http.post<WebhookEndpoint>(`/webhooks/endpoints/${id}`, options);
  }

  async delete(id: string): Promise<void> {
    return this.http.delete<void>(`/webhooks/endpoints/${id}`);
  }

  async ping(id: string): Promise<{ delivered: boolean; statusCode?: number; error?: string }> {
    return this.http.post<{ delivered: boolean; statusCode?: number; error?: string }>(
      `/webhooks/endpoints/${id}/ping`,
    );
  }

  async listDeliveries(options: {
    endpointId?: string;
    eventType?: string;
    limit?: number;
  } = {}): Promise<WebhookDelivery[]> {
    return this.http.get<WebhookDelivery[]>('/webhooks/deliveries', options);
  }

  async listEventTypes(): Promise<{ eventTypes: string[] }> {
    return this.http.get<{ eventTypes: string[] }>('/webhooks/event-types');
  }
}
