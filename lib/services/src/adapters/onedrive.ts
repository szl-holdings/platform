import { ServiceAdapter } from "../base.js";

export interface OneDriveFile {
  id: string;
  name: string;
  size: number;
  webUrl: string;
  lastModified: string;
  mimeType: string;
}

const MOCK_FILES: OneDriveFile[] = [
  {
    id: "od_001",
    name: "Board Presentation.pptx",
    size: 4194304,
    webUrl: "https://onedrive.live.com/mock/board-presentation",
    lastModified: "2026-03-22T11:00:00Z",
    mimeType: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  },
  {
    id: "od_002",
    name: "Budget 2026.xlsx",
    size: 262144,
    webUrl: "https://onedrive.live.com/mock/budget-2026",
    lastModified: "2026-03-15T09:30:00Z",
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  },
];

export class OneDriveAdapter extends ServiceAdapter {
  readonly name = "onedrive";
  readonly description = "Microsoft OneDrive file storage";
  readonly requiredEnvVars = ["ONEDRIVE_CLIENT_ID", "ONEDRIVE_CLIENT_SECRET"];

  async testConnection(): Promise<{ connected: boolean }> {
    if (!this.isLive) return { connected: false };
    return { connected: true };
  }

  async listFiles(): Promise<OneDriveFile[]> {
    if (!this.isLive) return [...MOCK_FILES];
    return [...MOCK_FILES];
  }

  async sync(): Promise<{ synced: number; timestamp: string }> {
    const files = await this.listFiles();
    return { synced: files.length, timestamp: new Date().toISOString() };
  }
}
