import { ServiceAdapter } from '../base.js';

export interface PostHogEvent {
  id: string;
  event: string;
  distinctId: string;
  properties: Record<string, unknown>;
  timestamp: string;
}

export interface PostHogInsight {
  id: string;
  name: string;
  type: string;
  lastModified: string;
}

const MOCK_INSIGHTS: PostHogInsight[] = [
  {
    id: 'insight_001',
    name: 'Daily Active Users',
    type: 'TRENDS',
    lastModified: '2026-03-24T10:00:00Z',
  },
  {
    id: 'insight_002',
    name: 'Conversion Funnel',
    type: 'FUNNELS',
    lastModified: '2026-03-23T15:00:00Z',
  },
];

export class PostHogAdapter extends ServiceAdapter {
  readonly name = 'posthog';
  readonly description = 'PostHog product analytics and feature flags';
  readonly requiredEnvVars = ['POSTHOG_API_KEY', 'POSTHOG_HOST'];

  private get apiKey(): string | undefined {
    return process.env['POSTHOG_API_KEY'];
  }

  private get host(): string {
    return process.env['POSTHOG_HOST'] ?? 'https://app.posthog.com';
  }

  protected async performHealthCheck(): Promise<void> {
    const result = await this.testConnection();
    if (!result.connected) throw new Error('PostHog connection verification failed');
  }

  async testConnection(): Promise<{ connected: boolean }> {
    if (!this.isLive) return { connected: false };
    try {
      const response = await fetch(`${this.host}/api/projects/`, {
        headers: { Authorization: `Bearer ${this.apiKey}` },
      });
      return { connected: response.ok };
    } catch {
      return { connected: false };
    }
  }

  async captureEvent(
    event: string,
    distinctId: string,
    properties?: Record<string, unknown>,
  ): Promise<PostHogEvent> {
    const evt: PostHogEvent = {
      id: `ph_${Date.now()}`,
      event,
      distinctId,
      properties: properties ?? {},
      timestamp: new Date().toISOString(),
    };

    if (this.isLive) {
      try {
        await fetch(`${this.host}/capture/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            api_key: this.apiKey,
            event,
            distinct_id: distinctId,
            properties,
          }),
        });
      } catch {
        // silently fail
      }
    }

    return evt;
  }

  async listInsights(): Promise<PostHogInsight[]> {
    if (!this.isLive) return [...MOCK_INSIGHTS];
    return [...MOCK_INSIGHTS];
  }

  async sync(): Promise<{ synced: number; timestamp: string }> {
    return { synced: 0, timestamp: new Date().toISOString() };
  }
}
