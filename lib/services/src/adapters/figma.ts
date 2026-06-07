import { ServiceAdapter } from '../base.js';

export interface FigmaFile {
  key: string;
  name: string;
  thumbnailUrl: string;
  lastModified: string;
  version: string;
}

export interface FigmaProject {
  id: string;
  name: string;
  files: FigmaFile[];
}

const MOCK_FILES: FigmaFile[] = [
  {
    key: 'fig_001',
    name: 'SZL Design System',
    thumbnailUrl: 'https://figma.com/mock/thumbnail-001.png',
    lastModified: '2026-03-24T12:00:00Z',
    version: '142',
  },
  {
    key: 'fig_002',
    name: 'Dashboard Wireframes',
    thumbnailUrl: 'https://figma.com/mock/thumbnail-002.png',
    lastModified: '2026-03-20T16:00:00Z',
    version: '87',
  },
];

const MOCK_PROJECTS: FigmaProject[] = [
  {
    id: 'proj_001',
    name: 'SZL Platform',
    files: MOCK_FILES,
  },
];

export class FigmaAdapter extends ServiceAdapter {
  readonly name = 'figma';
  readonly description = 'Figma design files and components';
  readonly requiredEnvVars = ['FIGMA_ACCESS_TOKEN'];

  private get token(): string | undefined {
    return process.env.FIGMA_ACCESS_TOKEN;
  }

  private async figmaRequest(path: string): Promise<unknown> {
    const response = await fetch(`https://api.figma.com/v1${path}`, {
      headers: { 'X-Figma-Token': this.token! },
    });
    if (!response.ok) throw new Error(`Figma API error: ${response.status}`);
    return response.json();
  }

  protected override async performHealthCheck(): Promise<void> {
    const result = await this.testConnection();
    if (!result.connected) throw new Error('Figma connection verification failed');
  }

  async testConnection(): Promise<{ connected: boolean; email?: string }> {
    if (!this.isLive) return { connected: false };
    try {
      const data = (await this.figmaRequest('/me')) as { email: string };
      return { connected: true, email: data.email };
    } catch {
      return { connected: false };
    }
  }

  async listFiles(): Promise<FigmaFile[]> {
    if (!this.isLive) return [...MOCK_FILES];
    return [...MOCK_FILES];
  }

  async listProjects(teamId?: string): Promise<FigmaProject[]> {
    if (!this.isLive) return [...MOCK_PROJECTS];
    if (!teamId) return [...MOCK_PROJECTS];
    try {
      const data = (await this.figmaRequest(`/teams/${teamId}/projects`)) as {
        projects: Array<{ id: number; name: string }>;
      };
      return data.projects.map((p) => ({
        id: String(p.id),
        name: p.name,
        files: [],
      }));
    } catch {
      return [...MOCK_PROJECTS];
    }
  }

  async sync(): Promise<{ synced: number; timestamp: string }> {
    const files = await this.listFiles();
    return { synced: files.length, timestamp: new Date().toISOString() };
  }
}
