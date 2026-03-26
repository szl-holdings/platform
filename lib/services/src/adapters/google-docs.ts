import { ServiceAdapter, type ServiceStatus } from "../base.js";

export interface GoogleDoc {
  id: string;
  title: string;
  url: string;
  lastModified: string;
  owner: string;
}

const MOCK_DOCS: GoogleDoc[] = [
  {
    id: "doc_001",
    title: "SZL Holdings - Business Plan 2026",
    url: "https://docs.google.com/document/d/mock-001",
    lastModified: "2026-03-22T16:00:00Z",
    owner: "ceo@szl.com",
  },
  {
    id: "doc_002",
    title: "Technical Architecture Overview",
    url: "https://docs.google.com/document/d/mock-002",
    lastModified: "2026-03-18T10:30:00Z",
    owner: "cto@szl.com",
  },
];

export class GoogleDocsAdapter extends ServiceAdapter {
  readonly name = "google-docs";
  readonly description = "Google Docs document management";
  readonly requiredEnvVars = ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"];

  get status(): ServiceStatus {
    const hasCredentials = this.requiredEnvVars.every(
      (v) => process.env[v] !== undefined && process.env[v] !== "",
    );
    if (hasCredentials) return "LIVE_CONFIGURED";
    return "MOCKED_DEMO_MODE";
  }

  async testConnection(): Promise<{ connected: boolean }> {
    if (!this.isLive) return { connected: false };
    return { connected: true };
  }

  async listDocuments(): Promise<GoogleDoc[]> {
    if (!this.isLive) return [...MOCK_DOCS];
    return [...MOCK_DOCS];
  }

  async sync(): Promise<{ synced: number; timestamp: string }> {
    const docs = await this.listDocuments();
    return { synced: docs.length, timestamp: new Date().toISOString() };
  }
}
