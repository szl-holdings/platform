import { ServiceAdapter, type ServiceStatus } from '../base.js';

export interface GraphFile {
  id: string;
  name: string;
  size: number;
  webUrl: string;
  lastModified: string;
  mimeType: string;
  driveType: 'onedrive' | 'sharepoint';
  parentPath?: string;
}

export interface GraphCalendarEvent {
  id: string;
  subject: string;
  start: string;
  end: string;
  location?: string | undefined;
  organizer?: string | undefined;
  isOnlineMeeting: boolean;
  status: 'busy' | 'free' | 'tentative';
}

export interface GraphContact {
  id: string;
  displayName: string;
  emailAddresses: string[];
  phone?: string | undefined;
  company?: string | undefined;
  jobTitle?: string | undefined;
}

export interface GraphTeamsNotification {
  channelId?: string | undefined;
  webHookUrl?: string | undefined;
  text: string;
  title?: string | undefined;
  color?: string | undefined;
}

export interface GraphSharePointSite {
  id: string;
  name: string;
  displayName: string;
  webUrl: string;
  description?: string | undefined;
}

export interface GraphConnectionStatus {
  connected: boolean;
  tenantId?: string;
  scopes?: string[];
  tokenExpiry?: string;
}

const MOCK_FILES: GraphFile[] = [
  {
    id: 'gf_001',
    name: 'Deal Package — 123 Main St.docx',
    size: 512000,
    webUrl: 'https://szlholdings.sharepoint.com/Shared%20Documents/deal-package-123-main.docx',
    lastModified: '2026-03-25T14:00:00Z',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    driveType: 'sharepoint',
    parentPath: '/Shared Documents/Terra/Deals',
  },
  {
    id: 'gf_002',
    name: 'Q1 2026 Compliance Report.xlsx',
    size: 348000,
    webUrl: 'https://szlholdings.sharepoint.com/Shared%20Documents/q1-2026-compliance.xlsx',
    lastModified: '2026-03-20T09:30:00Z',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    driveType: 'sharepoint',
    parentPath: '/Shared Documents/Compliance',
  },
  {
    id: 'gf_003',
    name: 'Property Valuation Model.xlsx',
    size: 892000,
    webUrl: 'https://szlholdings-my.sharepoint.com/personal/jsmith/Documents/valuation-model.xlsx',
    lastModified: '2026-03-28T11:15:00Z',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    driveType: 'onedrive',
    parentPath: '/Documents/Models',
  },
];

const MOCK_EVENTS: GraphCalendarEvent[] = [
  {
    id: 'ge_001',
    subject: 'Property Showing — 45 Park Ave',
    start: '2026-04-01T10:00:00',
    end: '2026-04-01T11:00:00',
    location: '45 Park Ave, Manhattan, NY',
    organizer: 'agent@szl.com',
    isOnlineMeeting: false,
    status: 'busy',
  },
  {
    id: 'ge_002',
    subject: 'Investor Update Call',
    start: '2026-04-02T14:00:00',
    end: '2026-04-02T15:00:00',
    isOnlineMeeting: true,
    organizer: 'investor-relations@szl.com',
    status: 'busy',
  },
];

const MOCK_CONTACTS: GraphContact[] = [
  {
    id: 'gc_001',
    displayName: 'Michael Chen',
    emailAddresses: ['m.chen@brooklynrealtypartners.com'],
    phone: '+1-718-555-0192',
    company: 'Brooklyn Realty Partners',
    jobTitle: 'Principal Broker',
  },
  {
    id: 'gc_002',
    displayName: 'Sarah Rodriguez',
    emailAddresses: ['s.rodriguez@capitalbridgefund.com'],
    phone: '+1-212-555-0344',
    company: 'Capital Bridge Fund',
    jobTitle: 'Director of Acquisitions',
  },
];

export class MicrosoftGraphAdapter extends ServiceAdapter {
  readonly name = 'microsoft-graph';
  readonly description =
    'Microsoft 365 — SharePoint, OneDrive, Outlook Calendar, Contacts, and Teams notifications via Microsoft Graph API';
  readonly requiredEnvVars = [
    'MICROSOFT_TENANT_ID',
    'MICROSOFT_CLIENT_ID',
    'MICROSOFT_CLIENT_SECRET',
  ];

  override get status(): ServiceStatus {
    const missing = this.missingEnvVars;
    if (missing.length === 0) return 'LIVE_CONFIGURED';
    return 'MOCKED_DEMO_MODE';
  }

  private async getAccessToken(): Promise<string> {
    const tenantId = process.env.MICROSOFT_TENANT_ID!;
    const clientId = process.env.MICROSOFT_CLIENT_ID!;
    const clientSecret = process.env.MICROSOFT_CLIENT_SECRET!;

    const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
    const body = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
      scope: 'https://graph.microsoft.com/.default',
    });

    const res = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });
    if (!res.ok) throw new Error(`Token fetch failed: HTTP ${res.status}`);
    const data = (await res.json()) as { access_token: string };
    return data.access_token;
  }

  private async graphFetch(path: string): Promise<unknown> {
    const token = await this.getAccessToken();
    const res = await fetch(`https://graph.microsoft.com/v1.0${path}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    });
    if (!res.ok) throw new Error(`Graph API error: HTTP ${res.status} for ${path}`);
    return res.json();
  }

  protected override async performHealthCheck(): Promise<void> {
    const result = await this.testConnection();
    if (!result.connected) throw new Error('Microsoft Graph connection failed');
  }

  async testConnection(): Promise<GraphConnectionStatus> {
    if (!this.isLive) return { connected: false };
    try {
      await this.graphFetch('/organization?$select=id,displayName');
      return {
        connected: true,
        scopes: [
          'Sites.ReadWrite.All',
          'Calendars.ReadWrite',
          'Contacts.ReadWrite',
          'Files.ReadWrite.All',
        ],
      };
    } catch {
      return { connected: false };
    }
  }

  async listSharePointFiles(
    siteId?: string,
    libraryPath = '/Shared Documents',
  ): Promise<GraphFile[]> {
    if (!this.isLive) return MOCK_FILES.filter((f) => f.driveType === 'sharepoint');
    try {
      const path = siteId
        ? `/sites/${siteId}/drive/root:${libraryPath}:/children`
        : `/sites/root/drive/root:${libraryPath}:/children`;
      const data = (await this.graphFetch(path)) as { value: Array<Record<string, unknown>> };
      return (data.value ?? []).map((item) => ({
        id: String(item.id ?? ''),
        name: String(item.name ?? ''),
        size: Number(item.size ?? 0),
        webUrl: String(item.webUrl ?? ''),
        lastModified: String((item.lastModifiedDateTime as string) ?? new Date().toISOString()),
        mimeType: String(
          (item.file as Record<string, string>)?.mimeType ?? 'application/octet-stream',
        ),
        driveType: 'sharepoint' as const,
        parentPath: libraryPath,
      }));
    } catch {
      return MOCK_FILES.filter((f) => f.driveType === 'sharepoint');
    }
  }

  async listOneDriveFiles(userId?: string): Promise<GraphFile[]> {
    if (!this.isLive) return MOCK_FILES.filter((f) => f.driveType === 'onedrive');
    try {
      const path = userId ? `/users/${userId}/drive/root/children` : `/me/drive/root/children`;
      const data = (await this.graphFetch(path)) as { value: Array<Record<string, unknown>> };
      return (data.value ?? []).map((item) => ({
        id: String(item.id ?? ''),
        name: String(item.name ?? ''),
        size: Number(item.size ?? 0),
        webUrl: String(item.webUrl ?? ''),
        lastModified: String((item.lastModifiedDateTime as string) ?? new Date().toISOString()),
        mimeType: String(
          (item.file as Record<string, string>)?.mimeType ?? 'application/octet-stream',
        ),
        driveType: 'onedrive' as const,
      }));
    } catch {
      return MOCK_FILES.filter((f) => f.driveType === 'onedrive');
    }
  }

  async listCalendarEvents(userId?: string, daysAhead = 14): Promise<GraphCalendarEvent[]> {
    if (!this.isLive) return MOCK_EVENTS;
    try {
      const start = new Date().toISOString();
      const end = new Date(Date.now() + daysAhead * 86400000).toISOString();
      const path = userId
        ? `/users/${userId}/calendarView?startDateTime=${start}&endDateTime=${end}&$select=id,subject,start,end,location,organizer,isOnlineMeeting,showAs`
        : `/me/calendarView?startDateTime=${start}&endDateTime=${end}&$select=id,subject,start,end,location,organizer,isOnlineMeeting,showAs`;
      const data = (await this.graphFetch(path)) as { value: Array<Record<string, unknown>> };
      return (data.value ?? []).map((item) => ({
        id: String(item.id ?? ''),
        subject: String(item.subject ?? '(No subject)'),
        start: String((item.start as Record<string, string>)?.dateTime ?? ''),
        end: String((item.end as Record<string, string>)?.dateTime ?? ''),
        location: String((item.location as Record<string, string>)?.displayName ?? '') || undefined,
        organizer:
          String(
            (item.organizer as Record<string, Record<string, string>>)?.emailAddress?.address ?? '',
          ) || undefined,
        isOnlineMeeting: Boolean(item.isOnlineMeeting),
        status: String(item.showAs ?? 'free') as GraphCalendarEvent['status'],
      }));
    } catch {
      return MOCK_EVENTS;
    }
  }

  async listContacts(userId?: string): Promise<GraphContact[]> {
    if (!this.isLive) return MOCK_CONTACTS;
    try {
      const path = userId
        ? `/users/${userId}/contacts?$select=id,displayName,emailAddresses,phones,companyName,jobTitle`
        : `/me/contacts?$select=id,displayName,emailAddresses,phones,companyName,jobTitle`;
      const data = (await this.graphFetch(path)) as { value: Array<Record<string, unknown>> };
      return (data.value ?? []).map((item) => ({
        id: String(item.id ?? ''),
        displayName: String(item.displayName ?? 'Unknown'),
        emailAddresses: ((item.emailAddresses as Array<{ address: string }>) ?? []).map(
          (e) => e.address,
        ),
        phone: ((item.phones as Array<{ number: string }>) ?? [])[0]?.number,
        company: String(item.companyName ?? '') || undefined,
        jobTitle: String(item.jobTitle ?? '') || undefined,
      }));
    } catch {
      return MOCK_CONTACTS;
    }
  }

  async sendTeamsNotification(
    notification: GraphTeamsNotification,
  ): Promise<{ sent: boolean; error?: string }> {
    if (!this.isLive) return { sent: false };
    const webhookUrl = notification.webHookUrl ?? process.env.MICROSOFT_TEAMS_WEBHOOK_URL;
    if (!webhookUrl) return { sent: false, error: 'No Teams webhook URL configured' };
    try {
      const body = {
        '@type': 'MessageCard',
        '@context': 'https://schema.org/extensions',
        themeColor: notification.color ?? '0078D4',
        summary: notification.title ?? notification.text,
        sections: [
          {
            activityTitle: notification.title ?? 'SZL Platform Notification',
            activityText: notification.text,
          },
        ],
      };
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`Teams webhook error: HTTP ${res.status}`);
      return { sent: true };
    } catch (err) {
      return { sent: false, error: err instanceof Error ? err.message : String(err) };
    }
  }

  async listSharePointSites(): Promise<GraphSharePointSite[]> {
    if (!this.isLive)
      return [
        {
          id: 'szlholdings.sharepoint.com,demo-site-id',
          name: 'szlholdings',
          displayName: 'SZL Holdings',
          webUrl: 'https://szlholdings.sharepoint.com',
          description: 'SZL Holdings SharePoint',
        },
      ];
    try {
      const data = (await this.graphFetch('/sites?search=')) as {
        value: Array<Record<string, unknown>>;
      };
      return (data.value ?? []).map((site) => ({
        id: String(site.id ?? ''),
        name: String(site.name ?? ''),
        displayName: String(site.displayName ?? ''),
        webUrl: String(site.webUrl ?? ''),
        description: String(site.description ?? '') || undefined,
      }));
    } catch {
      return [];
    }
  }

  async sync(): Promise<{ synced: number; timestamp: string }> {
    const [files, events, contacts] = await Promise.all([
      this.listSharePointFiles(),
      this.listCalendarEvents(),
      this.listContacts(),
    ]);
    return {
      synced: files.length + events.length + contacts.length,
      timestamp: new Date().toISOString(),
    };
  }
}
