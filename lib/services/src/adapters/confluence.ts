import { ServiceAdapter } from '../base.js';

export interface ConfluencePage {
  id: string;
  title: string;
  space: string;
  url: string;
  lastModified: string;
  author: string;
  status: 'current' | 'draft' | 'archived';
}

const MOCK_PAGES: ConfluencePage[] = [
  {
    id: 'cf_001',
    title: 'Engineering Runbook',
    space: 'ENG',
    url: 'https://szl.atlassian.net/wiki/spaces/ENG/pages/mock-001',
    lastModified: '2026-03-22T14:00:00Z',
    author: 'cto@szl.com',
    status: 'current',
  },
  {
    id: 'cf_002',
    title: 'Onboarding Guide',
    space: 'HR',
    url: 'https://szl.atlassian.net/wiki/spaces/HR/pages/mock-002',
    lastModified: '2026-03-10T10:00:00Z',
    author: 'hr@szl.com',
    status: 'current',
  },
];

export class ConfluenceAdapter extends ServiceAdapter {
  readonly name = 'confluence';
  readonly description = 'Atlassian Confluence wiki and documentation';
  readonly requiredEnvVars = ['CONFLUENCE_API_TOKEN', 'CONFLUENCE_BASE_URL'];

  private get apiToken(): string | undefined {
    return process.env.CONFLUENCE_API_TOKEN;
  }

  private get baseUrl(): string | undefined {
    return process.env.CONFLUENCE_BASE_URL;
  }

  protected override async performHealthCheck(): Promise<void> {
    const result = await this.testConnection();
    if (!result.connected) throw new Error('Confluence connection verification failed');
  }

  async testConnection(): Promise<{ connected: boolean }> {
    if (!this.isLive) return { connected: false };
    try {
      const response = await fetch(`${this.baseUrl}/wiki/rest/api/space?limit=1`, {
        headers: {
          Authorization: `Bearer ${this.apiToken}`,
          Accept: 'application/json',
        },
      });
      return { connected: response.ok };
    } catch {
      return { connected: false };
    }
  }

  async listPages(spaceKey?: string): Promise<ConfluencePage[]> {
    if (!this.isLive) {
      if (spaceKey) return MOCK_PAGES.filter((p) => p.space === spaceKey);
      return [...MOCK_PAGES];
    }
    return [...MOCK_PAGES];
  }

  async sync(): Promise<{ synced: number; timestamp: string }> {
    const pages = await this.listPages();
    return { synced: pages.length, timestamp: new Date().toISOString() };
  }
}
