import { type ServiceAdapter, type ServiceHealthReport } from "./base.js";
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
}

export const services = new ServiceRegistry();
