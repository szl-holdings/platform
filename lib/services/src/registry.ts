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
import { HuggingFaceAdapter } from "./adapters/huggingface.js";
import { CisaAdapter } from "./adapters/cisa.js";
import { ArxivAdapter } from "./adapters/arxiv.js";
import { AbuseIPDBAdapter } from "./adapters/abuseipdb.js";
import { NOAAAdapter } from "./adapters/noaa.js";
import { NVDAdapter } from "./adapters/nvd.js";
import { BLSAdapter } from "./adapters/bls.js";
import { WorldBankAdapter } from "./adapters/worldbank.js";
import { OpenMeteoAdapter } from "./adapters/openmeteo.js";
import { MITREAdapter } from "./adapters/mitre.js";
import { GDELTAdapter } from "./adapters/gdelt.js";
import { MicrosoftGraphAdapter } from "./adapters/microsoft-graph.js";
import { ResoMlsAdapter } from "./adapters/reso-mls.js";
import { CoStarAdapter } from "./adapters/costar.js";
import { CompStakAdapter } from "./adapters/compstak.js";
import { DataverseAdapter } from "./adapters/dataverse.js";
import { Dynamics365Adapter } from "./adapters/dynamics365.js";
import { SharePointSPFxAdapter } from "./adapters/sharepoint-spfx.js";
import { SalesforceAdapter } from "./adapters/salesforce.js";
import { JiraAdapter } from "./adapters/jira.js";
import { PagerDutyAdapter } from "./adapters/pagerduty.js";
import { SiemAdapter } from "./adapters/siem.js";
import { XTwitterAdapter } from "./adapters/x-twitter.js";
import { MediumAdapter } from "./adapters/medium.js";
import { SubstackAdapter } from "./adapters/substack.js";
import { LinkedInAdapter } from "./adapters/linkedin.js";
import { SecEdgarAdapter } from "./adapters/edgar.js";
import { FredAdapter } from "./adapters/fred.js";
import { MarketDataAdapter } from "./adapters/market-data.js";
import { NewRelicAdapter } from "./adapters/new-relic.js";
import { NvidiaDcgmAdapter } from "./adapters/nvidia-dcgm.js";
import { MispTaxiiAdapter } from "./adapters/misp-taxii.js";

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
  readonly huggingface: HuggingFaceAdapter;
  readonly cisa: CisaAdapter;
  readonly arxiv: ArxivAdapter;
  readonly abuseipdb: AbuseIPDBAdapter;
  readonly noaa: NOAAAdapter;
  readonly nvd: NVDAdapter;
  readonly bls: BLSAdapter;
  readonly worldbank: WorldBankAdapter;
  readonly openmeteo: OpenMeteoAdapter;
  readonly mitre: MITREAdapter;
  readonly gdelt: GDELTAdapter;
  readonly microsoftGraph: MicrosoftGraphAdapter;
  readonly resoMls: ResoMlsAdapter;
  readonly costar: CoStarAdapter;
  readonly compstak: CompStakAdapter;
  readonly dataverse: DataverseAdapter;
  readonly dynamics365: Dynamics365Adapter;
  readonly sharepointSpfx: SharePointSPFxAdapter;
  readonly salesforce: SalesforceAdapter;
  readonly jira: JiraAdapter;
  readonly pagerduty: PagerDutyAdapter;
  readonly siem: SiemAdapter;
  readonly xTwitter: XTwitterAdapter;
  readonly medium: MediumAdapter;
  readonly substack: SubstackAdapter;
  readonly linkedin: LinkedInAdapter;
  readonly secEdgar: SecEdgarAdapter;
  readonly fred: FredAdapter;
  readonly marketData: MarketDataAdapter;
  readonly newRelic: NewRelicAdapter;
  readonly nvidiaDcgm: NvidiaDcgmAdapter;
  readonly mispTaxii: MispTaxiiAdapter;

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
    this.huggingface = new HuggingFaceAdapter();
    this.cisa = new CisaAdapter();
    this.arxiv = new ArxivAdapter();
    this.abuseipdb = new AbuseIPDBAdapter();
    this.noaa = new NOAAAdapter();
    this.nvd = new NVDAdapter();
    this.bls = new BLSAdapter();
    this.worldbank = new WorldBankAdapter();
    this.openmeteo = new OpenMeteoAdapter();
    this.mitre = new MITREAdapter();
    this.gdelt = new GDELTAdapter();
    this.microsoftGraph = new MicrosoftGraphAdapter();
    this.resoMls = new ResoMlsAdapter();
    this.costar = new CoStarAdapter();
    this.compstak = new CompStakAdapter();
    this.dataverse = new DataverseAdapter();
    this.dynamics365 = new Dynamics365Adapter();
    this.sharepointSpfx = new SharePointSPFxAdapter();
    this.salesforce = new SalesforceAdapter();
    this.jira = new JiraAdapter();
    this.pagerduty = new PagerDutyAdapter();
    this.siem = new SiemAdapter();
    this.xTwitter = new XTwitterAdapter();
    this.medium = new MediumAdapter();
    this.substack = new SubstackAdapter();
    this.linkedin = new LinkedInAdapter();
    this.secEdgar = new SecEdgarAdapter();
    this.fred = new FredAdapter();
    this.marketData = new MarketDataAdapter();
    this.newRelic = new NewRelicAdapter();
    this.nvidiaDcgm = new NvidiaDcgmAdapter();
    this.mispTaxii = new MispTaxiiAdapter();

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
      this.huggingface,
      this.cisa,
      this.arxiv,
      this.abuseipdb,
      this.noaa,
      this.nvd,
      this.bls,
      this.worldbank,
      this.openmeteo,
      this.mitre,
      this.gdelt,
      this.microsoftGraph,
      this.resoMls,
      this.costar,
      this.compstak,
      this.dataverse,
      this.dynamics365,
      this.sharepointSpfx,
      this.salesforce,
      this.jira,
      this.pagerduty,
      this.siem,
      this.xTwitter,
      this.medium,
      this.substack,
      this.linkedin,
      this.secEdgar,
      this.fred,
      this.marketData,
      this.newRelic,
      this.nvidiaDcgm,
      this.mispTaxii,
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
