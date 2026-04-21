import { ServiceAdapter } from '../base.js';

export interface GitHubRepo {
  id: string;
  name: string;
  fullName: string;
  url: string;
  description: string;
  language: string;
  stars: number;
  updatedAt: string;
}

export interface GitHubWebhookEvent {
  id: string;
  type: string;
  repo: string;
  action: string;
  timestamp: string;
}

const MOCK_REPOS: GitHubRepo[] = [
  {
    id: 'repo_001',
    name: 'szl-platform',
    fullName: 'szl-holdings/szl-platform',
    url: 'https://github.com/szl-holdings/szl-platform',
    description: 'Core SZL Holdings platform monorepo',
    language: 'TypeScript',
    stars: 42,
    updatedAt: '2026-03-24T18:00:00Z',
  },
  {
    id: 'repo_002',
    name: 'portfolio-engine',
    fullName: 'szl-holdings/portfolio-engine',
    url: 'https://github.com/szl-holdings/portfolio-engine',
    description: 'Portfolio management and analytics engine',
    language: 'TypeScript',
    stars: 18,
    updatedAt: '2026-03-20T12:00:00Z',
  },
];

export class GitHubAdapter extends ServiceAdapter {
  readonly name = 'github';
  readonly description = 'GitHub repositories, issues, and webhooks';
  readonly requiredEnvVars = ['GITHUB_TOKEN'];

  private get token(): string | undefined {
    return process.env['GITHUB_TOKEN'];
  }

  private async ghRequest(path: string, options?: RequestInit): Promise<unknown> {
    const response = await fetch(`https://api.github.com${path}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        ...options?.headers,
      },
    });
    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }
    return response.json();
  }

  protected override async performHealthCheck(): Promise<void> {
    const result = await this.testConnection();
    if (!result.connected) throw new Error('GitHub connection verification failed');
  }

  async testConnection(): Promise<{ connected: boolean; username?: string }> {
    if (!this.isLive) {
      return { connected: false };
    }
    try {
      const data = (await this.ghRequest('/user')) as { login: string };
      return { connected: true, username: data.login };
    } catch {
      return { connected: false };
    }
  }

  async listRepos(): Promise<GitHubRepo[]> {
    if (!this.isLive) {
      return [...MOCK_REPOS];
    }
    const data = (await this.ghRequest('/user/repos?sort=updated&per_page=20')) as Array<{
      id: number;
      name: string;
      full_name: string;
      html_url: string;
      description: string | null;
      language: string | null;
      stargazers_count: number;
      updated_at: string;
    }>;
    return data.map((r) => ({
      id: String(r.id),
      name: r.name,
      fullName: r.full_name,
      url: r.html_url,
      description: r.description ?? '',
      language: r.language ?? 'Unknown',
      stars: r.stargazers_count,
      updatedAt: r.updated_at,
    }));
  }

  async handleWebhook(payload: Record<string, unknown>): Promise<GitHubWebhookEvent> {
    return {
      id: `gh_evt_${Date.now()}`,
      type: (payload['action'] as string) ?? 'unknown',
      repo:
        ((payload['repository'] as Record<string, unknown>)?.['full_name'] as string) ?? 'unknown',
      action: (payload['action'] as string) ?? 'unknown',
      timestamp: new Date().toISOString(),
    };
  }
}
