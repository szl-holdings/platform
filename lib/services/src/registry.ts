import { type ServiceAdapter, type ServiceHealthReport, type ConnectionTestResult } from "./base.js";
import { AIAdapter } from "./adapters/ai.js";
import { WeatherAdapter } from "./adapters/weather.js";
import { ShippingAdapter } from "./adapters/shipping.js";
import { StripeAdapter } from "./adapters/stripe.js";
import { SlackAdapter } from "./adapters/slack.js";
import { TwilioAdapter } from "./adapters/twilio.js";
import { GoogleAdapter } from "./adapters/google.js";
import { NotionAdapter } from "./adapters/notion.js";
import { StorageAdapter } from "./adapters/storage.js";
import { MonitoringAdapter } from "./adapters/monitoring.js";
import { GitHubAdapter } from "./adapters/github.js";
import { GoogleCalendarAdapter } from "./adapters/google-calendar.js";
import { GoogleDocsAdapter } from "./adapters/google-docs.js";
import { GoogleDriveAdapter } from "./adapters/google-drive.js";
import { DropboxAdapter } from "./adapters/dropbox.js";
import { OneDriveAdapter } from "./adapters/onedrive.js";
import { StormGlassAdapter } from "./adapters/stormglass.js";
import { PostHogAdapter } from "./adapters/posthog.js";
import { GmailAdapter } from "./adapters/gmail.js";
import { ConfluenceAdapter } from "./adapters/confluence.js";
import { HubSpotAdapter } from "./adapters/hubspot.js";
import { ElevenLabsAdapter } from "./adapters/elevenlabs.js";
import { FigmaAdapter } from "./adapters/figma.js";

export interface IntegrationHealthMatrix {
  timestamp: string;
  services: ServiceHealthReport[];
  summary: {
    total: number;
    liveConfigured: number;
    mockedDemoMode: number;
    manualRequired: number;
  };
}

export class ServiceRegistry {
  readonly ai: AIAdapter;
  readonly weather: WeatherAdapter;
  readonly shipping: ShippingAdapter;
  readonly stripe: StripeAdapter;
  readonly slack: SlackAdapter;
  readonly twilio: TwilioAdapter;
  readonly google: GoogleAdapter;
  readonly notion: NotionAdapter;
  readonly storage: StorageAdapter;
  readonly monitoring: MonitoringAdapter;
  readonly github: GitHubAdapter;
  readonly googleCalendar: GoogleCalendarAdapter;
  readonly googleDocs: GoogleDocsAdapter;
  readonly googleDrive: GoogleDriveAdapter;
  readonly dropbox: DropboxAdapter;
  readonly onedrive: OneDriveAdapter;
  readonly stormglass: StormGlassAdapter;
  readonly posthog: PostHogAdapter;
  readonly gmail: GmailAdapter;
  readonly confluence: ConfluenceAdapter;
  readonly hubspot: HubSpotAdapter;
  readonly elevenlabs: ElevenLabsAdapter;
  readonly figma: FigmaAdapter;

  private readonly adapters: ServiceAdapter[];

  constructor() {
    this.ai = new AIAdapter();
    this.weather = new WeatherAdapter();
    this.shipping = new ShippingAdapter();
    this.stripe = new StripeAdapter();
    this.slack = new SlackAdapter();
    this.twilio = new TwilioAdapter();
    this.google = new GoogleAdapter();
    this.notion = new NotionAdapter();
    this.storage = new StorageAdapter();
    this.monitoring = new MonitoringAdapter();
    this.github = new GitHubAdapter();
    this.googleCalendar = new GoogleCalendarAdapter();
    this.googleDocs = new GoogleDocsAdapter();
    this.googleDrive = new GoogleDriveAdapter();
    this.dropbox = new DropboxAdapter();
    this.onedrive = new OneDriveAdapter();
    this.stormglass = new StormGlassAdapter();
    this.posthog = new PostHogAdapter();
    this.gmail = new GmailAdapter();
    this.confluence = new ConfluenceAdapter();
    this.hubspot = new HubSpotAdapter();
    this.elevenlabs = new ElevenLabsAdapter();
    this.figma = new FigmaAdapter();

    this.adapters = [
      this.ai,
      this.weather,
      this.shipping,
      this.stripe,
      this.slack,
      this.twilio,
      this.google,
      this.notion,
      this.storage,
      this.monitoring,
      this.github,
      this.googleCalendar,
      this.googleDocs,
      this.googleDrive,
      this.dropbox,
      this.onedrive,
      this.stormglass,
      this.posthog,
      this.gmail,
      this.confluence,
      this.hubspot,
      this.elevenlabs,
      this.figma,
    ];
  }

  getHealthMatrix(): IntegrationHealthMatrix {
    const services = this.adapters.map((a) => a.getHealthReport());
    return {
      timestamp: new Date().toISOString(),
      services,
      summary: {
        total: services.length,
        liveConfigured: services.filter((s) => s.status === "LIVE_CONFIGURED").length,
        mockedDemoMode: services.filter((s) => s.status === "MOCKED_DEMO_MODE").length,
        manualRequired: services.filter((s) => s.status === "MANUAL_REQUIRED").length,
      },
    };
  }

  getAdapter(name: string): ServiceAdapter | undefined {
    return this.adapters.find((a) => a.name === name);
  }

  getAllAdapters(): ServiceAdapter[] {
    return [...this.adapters];
  }

  async testAllConnections(): Promise<ConnectionTestResult[]> {
    return Promise.all(this.adapters.map((a) => a.runHealthCheck()));
  }

  async testConnection(name: string): Promise<ConnectionTestResult | null> {
    const adapter = this.getAdapter(name);
    if (!adapter) return null;
    return adapter.runHealthCheck();
  }

  getAdaptersForApp(connectorNames: string[]): ServiceAdapter[] {
    return connectorNames
      .map((n) => this.getAdapter(n))
      .filter((a): a is ServiceAdapter => a !== undefined);
  }

  getAppHealthMatrix(connectorNames: string[]): IntegrationHealthMatrix & { unknownConnectors: string[] } {
    const adapters: ServiceAdapter[] = [];
    const unknownConnectors: string[] = [];

    for (const name of connectorNames) {
      const adapter = this.getAdapter(name);
      if (adapter) {
        adapters.push(adapter);
      } else {
        unknownConnectors.push(name);
      }
    }

    const services = adapters.map((a) => a.getHealthReport());
    return {
      timestamp: new Date().toISOString(),
      services,
      summary: {
        total: connectorNames.length,
        liveConfigured: services.filter((s) => s.status === "LIVE_CONFIGURED").length,
        mockedDemoMode: services.filter((s) => s.status === "MOCKED_DEMO_MODE").length,
        manualRequired: services.filter((s) => s.status === "MANUAL_REQUIRED").length + unknownConnectors.length,
      },
      unknownConnectors,
    };
  }

  getUnhealthyCount(): number {
    return this.adapters.filter((a) => a.status === "MANUAL_REQUIRED").length;
  }

  getDemoModeCount(): number {
    return this.adapters.filter((a) => a.status === "MOCKED_DEMO_MODE").length;
  }
}

export const services = new ServiceRegistry();
