import { ServiceAdapter, type ServiceStatus } from '../base.js';

export interface LinkedInPostResult {
  posted: boolean;
  externalId?: string;
  externalUrl?: string;
  mock: boolean;
  error?: string;
}

export class LinkedInAdapter extends ServiceAdapter {
  readonly name = 'linkedin';
  readonly description = 'LinkedIn Share API for posting content and articles';
  readonly requiredEnvVars = ['LINKEDIN_ACCESS_TOKEN'];

  private get accessToken(): string | undefined {
    return process.env['LINKEDIN_ACCESS_TOKEN'];
  }

  private get personUrn(): string | undefined {
    return process.env['LINKEDIN_PERSON_URN'];
  }

  private get orgUrn(): string | undefined {
    return process.env['LINKEDIN_ORG_URN'];
  }

  get status(): ServiceStatus {
    if (this.accessToken) return 'LIVE_CONFIGURED';
    return 'MOCKED_DEMO_MODE';
  }

  get isLive(): boolean {
    return !!this.accessToken;
  }

  get presentEnvVars(): string[] {
    const present: string[] = [];
    if (this.accessToken) present.push('LINKEDIN_ACCESS_TOKEN');
    if (this.personUrn) present.push('LINKEDIN_PERSON_URN');
    if (this.orgUrn) present.push('LINKEDIN_ORG_URN');
    return present;
  }

  get missingEnvVars(): string[] {
    if (this.accessToken) return [];
    return ['LINKEDIN_ACCESS_TOKEN'];
  }

  protected async performHealthCheck(): Promise<void> {
    if (!this.isLive) return;
    const res = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: { Authorization: `Bearer ${this.accessToken}` },
    });
    if (!res.ok) throw new Error(`LinkedIn API health check failed: ${res.status}`);
  }

  async sharePost(opts: {
    text: string;
    articleUrl?: string;
    articleTitle?: string;
    articleDescription?: string;
    visibility?: 'PUBLIC' | 'CONNECTIONS';
  }): Promise<LinkedInPostResult> {
    const authorUrn = this.personUrn || this.orgUrn || 'urn:li:person:mock';

    if (!this.isLive) {
      const mockId = `mock_linkedin_${Date.now()}`;
      return {
        posted: true,
        externalId: mockId,
        externalUrl: `https://www.linkedin.com/feed/update/${mockId}`,
        mock: true,
      };
    }

    try {
      const shareContent: Record<string, unknown> = {
        author: authorUrn,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: { text: opts.text },
            shareMediaCategory: opts.articleUrl ? 'ARTICLE' : 'NONE',
            ...(opts.articleUrl
              ? {
                  media: [
                    {
                      status: 'READY',
                      originalUrl: opts.articleUrl,
                      title: { text: opts.articleTitle || '' },
                      description: { text: opts.articleDescription || '' },
                    },
                  ],
                }
              : {}),
          },
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': opts.visibility || 'PUBLIC',
        },
      };

      const res = await fetch('https://api.linkedin.com/v2/ugcPosts', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0',
        },
        body: JSON.stringify(shareContent),
      });

      if (!res.ok) {
        const err = await res.text();
        return { posted: false, mock: false, error: `LinkedIn API ${res.status}: ${err}` };
      }

      const postId = res.headers.get('x-restli-id') || `li_${Date.now()}`;
      return {
        posted: true,
        externalId: postId,
        externalUrl: `https://www.linkedin.com/feed/update/${postId}`,
        mock: false,
      };
    } catch (err) {
      return {
        posted: false,
        mock: false,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }
}
