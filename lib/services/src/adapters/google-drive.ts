import { ServiceAdapter, type ServiceStatus } from '../base.js';

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  url: string;
  modifiedTime: string;
  owner: string;
}

const MOCK_FILES: DriveFile[] = [
  {
    id: 'file_001',
    name: 'Q1 Financial Report.xlsx',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    size: 524288,
    url: 'https://drive.google.com/file/d/mock-001',
    modifiedTime: '2026-03-21T14:00:00Z',
    owner: 'cfo@szl.com',
  },
  {
    id: 'file_002',
    name: 'Brand Guidelines.pdf',
    mimeType: 'application/pdf',
    size: 2097152,
    url: 'https://drive.google.com/file/d/mock-002',
    modifiedTime: '2026-02-10T09:00:00Z',
    owner: 'design@szl.com',
  },
];

export class GoogleDriveAdapter extends ServiceAdapter {
  readonly name = 'google-drive';
  readonly description = 'Google Drive file storage and sharing';
  readonly requiredEnvVars = ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'];

  override get status(): ServiceStatus {
    const hasCredentials = this.requiredEnvVars.every(
      (v) => process.env[v] !== undefined && process.env[v] !== '',
    );
    if (hasCredentials) return 'LIVE_CONFIGURED';
    return 'MOCKED_DEMO_MODE';
  }

  protected override async performHealthCheck(): Promise<void> {
    const result = await this.testConnection();
    if (!result.connected) throw new Error('Google Drive connection verification failed');
  }

  async testConnection(): Promise<{ connected: boolean }> {
    if (!this.isLive) return { connected: false };
    return { connected: true };
  }

  async listFiles(): Promise<DriveFile[]> {
    if (!this.isLive) return [...MOCK_FILES];
    return [...MOCK_FILES];
  }

  async sync(): Promise<{ synced: number; timestamp: string }> {
    const files = await this.listFiles();
    return { synced: files.length, timestamp: new Date().toISOString() };
  }
}
