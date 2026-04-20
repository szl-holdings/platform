import { ServiceAdapter, type ServiceStatus } from '../base.js';

export interface MediumPublishResult {
  published: boolean;
  externalUrl?: string;
  externalId?: string;
  mock: boolean;
  error?: string;
}

export class MediumAdapter extends ServiceAdapter {
  readonly name = 'medium';
  readonly description = 'Medium API for publishing articles';
  readonly requiredEnvVars = ['MEDIUM_INTEGRATION_TOKEN'];

  private get integrationToken(): string | undefined {
    return process.env['MEDIUM_INTEGRATION_TOKEN'];
  }

  get status(): ServiceStatus {
    if (this.integrationToken) return 'LIVE_CONFIGURED';
    return 'MOCKED_DEMO_MODE';
  }

  get isLive(): boolean {
    return !!this.integrationToken;
  }

  get presentEnvVars(): string[] {
    return this.integrationToken ? ['MEDIUM_INTEGRATION_TOKEN'] : [];
  }

  get missingEnvVars(): string[] {
    return this.integrationToken ? [] : ['MEDIUM_INTEGRATION_TOKEN'];
  }

  protected async performHealthCheck(): Promise<void> {
    if (!this.isLive) return;
    const res = await fetch('https://api.medium.com/v1/me', {
      headers: { Authorization: `Bearer ${this.integrationToken}` },
    });
    if (!res.ok) throw new Error(`Medium API health check failed: ${res.status}`);
  }

  private async getUserId(): Promise<string> {
    const res = await fetch('https://api.medium.com/v1/me', {
      headers: {
        Authorization: `Bearer ${this.integrationToken}`,
        'Content-Type': 'application/json',
      },
    });
    if (!res.ok) throw new Error(`Medium user lookup failed: ${res.status}`);
    const data = (await res.json()) as { data?: { id: string } };
    if (!data.data?.id) throw new Error('Medium user ID not found');
    return data.data.id;
  }

  async publishArticle(opts: {
    title: string;
    content: string;
    contentFormat?: 'html' | 'markdown';
    tags?: string[];
    canonicalUrl?: string;
    publishStatus?: 'public' | 'draft' | 'unlisted';
  }): Promise<MediumPublishResult> {
    if (!this.isLive) {
      const mockId = `mock_medium_${Date.now()}`;
      const slug = opts.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      return {
        published: true,
        externalId: mockId,
        externalUrl: `https://medium.com/@stephen_38454/${slug}-${mockId.slice(-8)}`,
        mock: true,
      };
    }

    try {
      const userId = await this.getUserId();
      const res = await fetch(`https://api.medium.com/v1/users/${userId}/posts`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.integrationToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: opts.title,
          contentFormat: opts.contentFormat || 'markdown',
          content: opts.content,
          tags: opts.tags?.slice(0, 5) || [],
          canonicalUrl: opts.canonicalUrl,
          publishStatus: opts.publishStatus || 'draft',
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        return { published: false, mock: false, error: `Medium API ${res.status}: ${err}` };
      }

      const data = (await res.json()) as { data?: { id: string; url: string } };
      return {
        published: true,
        externalId: data.data?.id,
        externalUrl: data.data?.url,
        mock: false,
      };
    } catch (err) {
      return {
        published: false,
        mock: false,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }
}
