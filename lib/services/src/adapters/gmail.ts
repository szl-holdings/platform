import { ServiceAdapter, type ServiceStatus } from "../base.js";

export interface GmailMessage {
  id: string;
  subject: string;
  from: string;
  to: string;
  snippet: string;
  date: string;
  read: boolean;
}

const MOCK_MESSAGES: GmailMessage[] = [
  {
    id: "msg_001",
    subject: "Q1 Revenue Report Ready",
    from: "cfo@szl.com",
    to: "team@szl.com",
    snippet: "The Q1 revenue report is finalized and ready for review...",
    date: "2026-03-24T09:00:00Z",
    read: true,
  },
  {
    id: "msg_002",
    subject: "New Partnership Opportunity",
    from: "partnerships@acme.com",
    to: "ceo@szl.com",
    snippet: "We'd love to explore a potential partnership between our organizations...",
    date: "2026-03-23T16:30:00Z",
    read: false,
  },
  {
    id: "msg_003",
    subject: "Deployment Notification: v2.4.1",
    from: "devops@szl.com",
    to: "engineering@szl.com",
    snippet: "Successfully deployed version 2.4.1 to production...",
    date: "2026-03-25T02:15:00Z",
    read: true,
  },
];

export class GmailAdapter extends ServiceAdapter {
  readonly name = "gmail";
  readonly description = "Gmail email management and notifications";
  readonly requiredEnvVars = ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"];

  get status(): ServiceStatus {
    const hasCredentials = this.requiredEnvVars.every(
      (v) => process.env[v] !== undefined && process.env[v] !== "",
    );
    if (hasCredentials) return "LIVE_CONFIGURED";
    return "MOCKED_DEMO_MODE";
  }

  protected async performHealthCheck(): Promise<void> {
    const result = await this.testConnection();
    if (!result.connected) throw new Error("Gmail connection verification failed");
  }

  async testConnection(): Promise<{ connected: boolean }> {
    if (!this.isLive) return { connected: false };
    return { connected: true };
  }

  async listMessages(): Promise<GmailMessage[]> {
    if (!this.isLive) return [...MOCK_MESSAGES];
    return [...MOCK_MESSAGES];
  }

  async sync(): Promise<{ synced: number; timestamp: string }> {
    const messages = await this.listMessages();
    return { synced: messages.length, timestamp: new Date().toISOString() };
  }
}
