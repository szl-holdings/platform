import { ServiceAdapter } from '../base.js';

export interface SPFxWebPartManifest {
  id: string;
  alias: string;
  componentType: 'WebPart';
  version: string;
  manifestVersion: number;
  requiresCustomScript: boolean;
  supportedHosts: string[];
  preconfiguredEntries: SPFxPreconfiguredEntry[];
}

export interface SPFxPreconfiguredEntry {
  groupId: string;
  group: { default: string };
  title: { default: string };
  description: { default: string };
  officeFabricIconFontName: string;
  properties: Record<string, unknown>;
}

export interface SPFxSiteInfo {
  id: string;
  displayName: string;
  webUrl: string;
  description: string;
  template: string;
  lastModifiedDateTime: string;
}

export interface SPFxDeploymentStatus {
  siteAppCatalogUrl: string | null;
  tenantAppCatalogUrl: string | null;
  deployedPackages: SPFxDeployedPackage[];
  totalSites: number;
  connectedSites: number;
}

export interface SPFxDeployedPackage {
  id: string;
  title: string;
  version: string;
  isDeploy: boolean;
  isEnabled: boolean;
  skipFeatureDeployment: boolean;
  installedVersion: string;
}

const MOCK_MANIFESTS: SPFxWebPartManifest[] = [
  {
    id: 'szl-lyte-signal-summary',
    alias: 'SzlLyteSignalSummary',
    componentType: 'WebPart',
    version: '1.0.0',
    manifestVersion: 2,
    requiresCustomScript: false,
    supportedHosts: ['SharePointWebPart', 'TeamsTab', 'TeamsPersonalApp'],
    preconfiguredEntries: [
      {
        groupId: '5c03119e-3074-46fd-976b-c60198311f70',
        group: { default: 'SZL Platform' },
        title: { default: 'Lyte Signal Summary' },
        description: {
          default:
            'Displays the Lyte Command Center signal summary — critical alerts, open incidents, and readiness score — embedded directly in your SharePoint site.',
        },
        officeFabricIconFontName: 'AlertSolid',
        properties: {
          apiBaseUrl: '',
          orgId: '',
          refreshIntervalSeconds: 60,
          showCriticalOnly: false,
          maxSignals: 10,
          theme: 'dark',
        },
      },
    ],
  },
  {
    id: 'szl-vessels-fleet-status',
    alias: 'SzlVesselsFleetStatus',
    componentType: 'WebPart',
    version: '1.0.0',
    manifestVersion: 2,
    requiresCustomScript: false,
    supportedHosts: ['SharePointWebPart', 'TeamsTab'],
    preconfiguredEntries: [
      {
        groupId: '5c03119e-3074-46fd-976b-c60198311f70',
        group: { default: 'SZL Platform' },
        title: { default: 'Vessels Fleet Status' },
        description: {
          default:
            'Displays real-time fleet status, active vessel positions, port calls, and compliance indicators from the Vessels Maritime Intelligence platform.',
        },
        officeFabricIconFontName: 'Ship',
        properties: {
          apiBaseUrl: '',
          orgId: '',
          refreshIntervalSeconds: 120,
          showMap: true,
          vesselFilter: 'all',
          maxVessels: 20,
        },
      },
    ],
  },
  {
    id: 'szl-terra-market-overview',
    alias: 'SzlTerraMarketOverview',
    componentType: 'WebPart',
    version: '1.0.0',
    manifestVersion: 2,
    requiresCustomScript: false,
    supportedHosts: ['SharePointWebPart', 'TeamsTab'],
    preconfiguredEntries: [
      {
        groupId: '5c03119e-3074-46fd-976b-c60198311f70',
        group: { default: 'SZL Platform' },
        title: { default: 'Terra Market Overview' },
        description: {
          default:
            'Embeds Terra Real Estate Intelligence market data, property pipeline signals, and investment intelligence directly in SharePoint.',
        },
        officeFabricIconFontName: 'CityNext',
        properties: {
          apiBaseUrl: '',
          orgId: '',
          refreshIntervalSeconds: 300,
          marketFilter: 'all',
          showHeatmap: false,
          currency: 'USD',
        },
      },
    ],
  },
  {
    id: 'szl-alloy-workflow-status',
    alias: 'SzlAlloyWorkflowStatus',
    componentType: 'WebPart',
    version: '1.0.0',
    manifestVersion: 2,
    requiresCustomScript: false,
    supportedHosts: ['SharePointWebPart', 'TeamsTab', 'TeamsPersonalApp'],
    preconfiguredEntries: [
      {
        groupId: '5c03119e-3074-46fd-976b-c60198311f70',
        group: { default: 'SZL Platform' },
        title: { default: 'Alloy Workflow Status' },
        description: {
          default:
            'Shows active Alloy workflow runs, pending approvals, recent artifacts, and execution health — embedded in SharePoint as a native web part.',
        },
        officeFabricIconFontName: 'WorkFlow',
        properties: {
          apiBaseUrl: '',
          orgId: '',
          refreshIntervalSeconds: 30,
          showPendingApprovals: true,
          maxWorkflows: 5,
          statusFilter: 'all',
        },
      },
    ],
  },
];

const MOCK_DEPLOYMENT_STATUS: SPFxDeploymentStatus = {
  siteAppCatalogUrl: null,
  tenantAppCatalogUrl: 'https://szlholdings.sharepoint.com/sites/appcatalog',
  deployedPackages: [
    {
      id: 'szl-lyte-signal-summary',
      title: 'SZL — Lyte Signal Summary',
      version: '1.0.0',
      isDeploy: true,
      isEnabled: true,
      skipFeatureDeployment: true,
      installedVersion: '1.0.0',
    },
    {
      id: 'szl-vessels-fleet-status',
      title: 'SZL — Vessels Fleet Status',
      version: '1.0.0',
      isDeploy: true,
      isEnabled: true,
      skipFeatureDeployment: true,
      installedVersion: '1.0.0',
    },
    {
      id: 'szl-terra-market-overview',
      title: 'SZL — Terra Market Overview',
      version: '1.0.0',
      isDeploy: false,
      isEnabled: false,
      skipFeatureDeployment: false,
      installedVersion: '',
    },
    {
      id: 'szl-alloy-workflow-status',
      title: 'SZL — Alloy Workflow Status',
      version: '1.0.0',
      isDeploy: true,
      isEnabled: true,
      skipFeatureDeployment: true,
      installedVersion: '1.0.0',
    },
  ],
  totalSites: 12,
  connectedSites: 8,
};

export class SharePointSPFxAdapter extends ServiceAdapter {
  readonly name = 'sharepoint_spfx';
  readonly description =
    'Microsoft SharePoint SPFx web parts — Lyte, Vessels, Terra, and Alloy dashboards embedded in SharePoint sites via Azure AD auth';
  readonly requiredEnvVars = [
    'SHAREPOINT_TENANT_ID',
    'SHAREPOINT_CLIENT_ID',
    'SHAREPOINT_CLIENT_SECRET',
    'SHAREPOINT_TENANT_URL',
  ];

  private tokenCache: { token: string; expiresAt: number } | null = null;

  private get tenantId(): string | undefined {
    return process.env['SHAREPOINT_TENANT_ID'];
  }

  private get clientId(): string | undefined {
    return process.env['SHAREPOINT_CLIENT_ID'];
  }

  private get clientSecret(): string | undefined {
    return process.env['SHAREPOINT_CLIENT_SECRET'];
  }

  private get tenantUrl(): string | undefined {
    return process.env['SHAREPOINT_TENANT_URL'];
  }

  private async acquireToken(scope: string): Promise<string> {
    const cacheKey = `sp-token-${scope}`;
    if (this.tokenCache && this.tokenCache.expiresAt > Date.now() + 60000) {
      return this.tokenCache.token;
    }
    const tokenEndpoint = `https://login.microsoftonline.com/${this.tenantId}/oauth2/v2.0/token`;
    const body = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: this.clientId!,
      client_secret: this.clientSecret!,
      scope,
    });
    const response = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`SharePoint MSAL token acquisition failed: ${response.status} — ${text}`);
    }
    const data = (await response.json()) as { access_token: string; expires_in: number };
    this.tokenCache = {
      token: data.access_token,
      expiresAt: Date.now() + data.expires_in * 1000,
    };
    return data.access_token;
  }

  private async graphRequest<T>(path: string): Promise<T> {
    const token = await this.acquireToken('https://graph.microsoft.com/.default');
    const response = await fetch(`https://graph.microsoft.com/v1.0${path}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Microsoft Graph API error ${response.status}: ${text}`);
    }
    return response.json() as Promise<T>;
  }

  protected async performHealthCheck(): Promise<void> {
    await this.graphRequest('/organization?$select=id,displayName&$top=1');
  }

  getWebPartManifests(): SPFxWebPartManifest[] {
    return [...MOCK_MANIFESTS];
  }

  getWebPartManifest(id: string): SPFxWebPartManifest | null {
    return MOCK_MANIFESTS.find((m) => m.id === id) ?? null;
  }

  async getDeploymentStatus(): Promise<SPFxDeploymentStatus> {
    if (!this.isLive) return { ...MOCK_DEPLOYMENT_STATUS };
    return {
      siteAppCatalogUrl: null,
      tenantAppCatalogUrl: `${this.tenantUrl}/sites/appcatalog`,
      deployedPackages: MOCK_DEPLOYMENT_STATUS.deployedPackages,
      totalSites: 0,
      connectedSites: 0,
    };
  }

  async listSites(): Promise<SPFxSiteInfo[]> {
    if (!this.isLive) {
      return [
        {
          id: 'mock-site-001',
          displayName: 'SZL Holdings Intranet',
          webUrl: 'https://szlholdings.sharepoint.com/sites/intranet',
          description: 'Main company intranet with Lyte signal web part',
          template: 'SITEPAGEPUBLISHING#0',
          lastModifiedDateTime: '2026-03-29T10:00:00Z',
        },
        {
          id: 'mock-site-002',
          displayName: 'Operations Hub',
          webUrl: 'https://szlholdings.sharepoint.com/sites/ops',
          description: 'Operations hub with Vessels and Alloy web parts',
          template: 'STS#3',
          lastModifiedDateTime: '2026-03-28T14:30:00Z',
        },
      ];
    }
    const data = await this.graphRequest<{
      value: Array<{
        id: string;
        displayName: string;
        webUrl: string;
        description: string;
        root?: unknown;
        lastModifiedDateTime: string;
      }>;
    }>('/sites?$select=id,displayName,webUrl,description,lastModifiedDateTime&$top=50');
    return data.value.map((s) => ({
      id: s.id,
      displayName: s.displayName,
      webUrl: s.webUrl,
      description: s.description ?? '',
      template: 'STS#3',
      lastModifiedDateTime: s.lastModifiedDateTime,
    }));
  }

  getSPFxPackageBuildInfo(): {
    toolchain: string;
    version: string;
    nodeVersion: string;
    buildCommand: string;
    outputPath: string;
    webParts: { id: string; name: string; entryPoint: string }[];
  } {
    return {
      toolchain: 'Heft (SPFx v1.22+)',
      version: '1.22.0',
      nodeVersion: '18.x',
      buildCommand: 'gulp bundle --ship && gulp package-solution --ship',
      outputPath: 'sharepoint/solution/szl-spfx-webparts.sppkg',
      webParts: MOCK_MANIFESTS.map((m) => ({
        id: m.id,
        name: m.preconfiguredEntries[0]?.title?.default ?? m.alias,
        entryPoint: `src/webparts/${m.alias}/${m.alias}WebPart.ts`,
      })),
    };
  }
}
