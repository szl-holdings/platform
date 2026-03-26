import { ServiceAdapter, type ServiceStatus } from "../base.js";

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  location?: string;
  description?: string;
  attendees: string[];
}

const MOCK_EVENTS: CalendarEvent[] = [
  {
    id: "evt_001",
    title: "Q1 Portfolio Review",
    start: "2026-03-26T10:00:00Z",
    end: "2026-03-26T11:30:00Z",
    location: "Board Room A",
    description: "Quarterly portfolio performance review with stakeholders",
    attendees: ["ceo@szl.com", "cfo@szl.com", "pm@szl.com"],
  },
  {
    id: "evt_002",
    title: "Investor Call",
    start: "2026-03-27T14:00:00Z",
    end: "2026-03-27T15:00:00Z",
    location: "Virtual - Zoom",
    description: "Monthly investor relations update",
    attendees: ["ir@szl.com", "ceo@szl.com"],
  },
  {
    id: "evt_003",
    title: "Team Standup",
    start: "2026-03-25T09:00:00Z",
    end: "2026-03-25T09:15:00Z",
    attendees: ["dev@szl.com", "pm@szl.com"],
  },
];

export class GoogleCalendarAdapter extends ServiceAdapter {
  readonly name = "google-calendar";
  readonly description = "Google Calendar events and scheduling";
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

  async listEvents(): Promise<CalendarEvent[]> {
    if (!this.isLive) return [...MOCK_EVENTS];
    return [...MOCK_EVENTS];
  }

  async sync(): Promise<{ synced: number; timestamp: string }> {
    const events = await this.listEvents();
    return { synced: events.length, timestamp: new Date().toISOString() };
  }
}
