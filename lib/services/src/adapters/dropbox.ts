import { ServiceAdapter } from "../base.js";

export interface DropboxFile {
  id: string;
  name: string;
  pathDisplay: string;
  size: number;
  modified: string;
  isFolder: boolean;
}

const MOCK_FILES: DropboxFile[] = [
  {
    id: "dbx_001",
    name: "Contracts",
    pathDisplay: "/Contracts",
    size: 0,
    modified: "2026-03-20T10:00:00Z",
    isFolder: true,
  },
  {
    id: "dbx_002",
    name: "Q1-Financials.xlsx",
    pathDisplay: "/Finance/Q1-Financials.xlsx",
    size: 389120,
    modified: "2026-03-19T14:30:00Z",
    isFolder: false,
  },
];

export class DropboxAdapter extends ServiceAdapter {
  readonly name = "dropbox";
  readonly description = "Dropbox file storage and sync";
  readonly requiredEnvVars = ["DROPBOX_ACCESS_TOKEN"];

  private get token(): string | undefined {
    return process.env["DROPBOX_ACCESS_TOKEN"];
  }

  async testConnection(): Promise<{ connected: boolean; email?: string }> {
    if (!this.isLive) return { connected: false };
    try {
      const response = await fetch("https://api.dropboxapi.com/2/users/get_current_account", {
        method: "POST",
        headers: { Authorization: `Bearer ${this.token}` },
      });
      if (!response.ok) return { connected: false };
      const data = (await response.json()) as { email: string };
      return { connected: true, email: data.email };
    } catch {
      return { connected: false };
    }
  }

  async listFiles(path?: string): Promise<DropboxFile[]> {
    if (!this.isLive) return [...MOCK_FILES];
    try {
      const response = await fetch("https://api.dropboxapi.com/2/files/list_folder", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ path: path ?? "", limit: 50 }),
      });
      if (!response.ok) return [...MOCK_FILES];
      const data = (await response.json()) as {
        entries: Array<{
          id: string;
          name: string;
          path_display: string;
          size?: number;
          server_modified?: string;
          ".tag": string;
        }>;
      };
      return data.entries.map((e) => ({
        id: e.id,
        name: e.name,
        pathDisplay: e.path_display,
        size: e.size ?? 0,
        modified: e.server_modified ?? new Date().toISOString(),
        isFolder: e[".tag"] === "folder",
      }));
    } catch {
      return [...MOCK_FILES];
    }
  }

  async sync(): Promise<{ synced: number; timestamp: string }> {
    const files = await this.listFiles();
    return { synced: files.length, timestamp: new Date().toISOString() };
  }
}
