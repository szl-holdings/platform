/**
 * Platform Registry
 *
 * Authoritative record of all SZL platform products, their status, and their
 * deployment paths. This is the single source of truth — marketing copy, nav
 * menus, status badges, and pitch deck data should read from here.
 *
 * Status definitions match docs/APP_STATUS.md.
 */

export type ArtifactStatus = 'ga' | 'beta' | 'partial' | 'internal' | 'concept' | 'deprecated';

export interface PlatformProduct {
  id: string;
  name: string;
  tagline: string;
  description: string;
  status: ArtifactStatus;
  previewPath: string;
  audience: string;
  liveDataSources: string[];
  seedDataModules: string[];
  knownBlockers: string[];
}

export const PLATFORM_PRODUCTS: Record<string, PlatformProduct> = {
  'szl-holdings': {
    id: 'szl-holdings',
    name: 'SZL Holdings',
    tagline: 'Governed decision infrastructure',
    description:
      'Primary corporate and investor presence. Flagship command surface running the PRISM framework across all connected domain packs.',
    status: 'beta',
    previewPath: '/',
    audience: 'Investors, enterprise evaluators, strategic partners',
    liveDataSources: ['CISA KEV', 'BLS', 'NYSE feed'],
    seedDataModules: ['dashboard KPIs', 'control tower metrics', 'decision theater scenarios'],
    knownBlockers: ['Autopilot header stats hardcoded', 'Genome score hardcoded'],
  },
  'carlota-jo': {
    id: 'carlota-jo',
    name: 'Carlota Jo',
    tagline: 'Private advisory at the highest level',
    description:
      'Luxury concierge advisory practice and consulting OS for founders, executives, and HNWI.',
    status: 'ga',
    previewPath: '/carlota-jo/',
    audience: 'Founders, executives, HNWI seeking brand/operational strategy',
    liveDataSources: ['World Bank', 'BLS', 'HBR RSS', 'Microsoft Outlook/Calendar'],
    seedDataModules: [
      'Consulting OS engagement P&L',
      'capacity alerts',
      'client health scores',
      'team rates',
    ],
    knownBlockers: [],
  },
  pulse: {
    id: 'pulse',
    name: 'Pulse',
    tagline: 'AI executive briefing, intelligence-community standard',
    description:
      'Multi-agent AI briefing system synthesizing cross-domain operational signals into executive intelligence reports.',
    status: 'beta',
    previewPath: '/pulse/',
    audience: 'C-suite, board members, strategic decision-makers',
    liveDataSources: [
      'OpenAI/Anthropic/Gemini (conditional on API keys)',
      'PostgreSQL signal tables',
    ],
    seedDataModules: ['demo briefings (fallback when AI unavailable)'],
    knownBlockers: ['PDF export not implemented', 'email subscription not implemented'],
  },
  aegis: {
    id: 'aegis',
    name: 'PARAGON',
    tagline: 'Defense and intelligence operations',
    description:
      'SOC command surface with live threat intelligence feeds and governed incident response.',
    status: 'beta',
    previewPath: '/aegis/',
    audience: 'CISOs, SOC analysts, managed security providers',
    liveDataSources: ['CISA KEV', 'NVD CVE', 'MITRE ATT&CK v14', 'AbuseIPDB'],
    seedDataModules: ['scenario events', 'case management data'],
    knownBlockers: [
      '8 new security modules not wired to live API',
      'CISO Executive Dashboard not aggregated',
    ],
  },
  terra: {
    id: 'terra',
    name: 'DOMAINE',
    tagline: 'Real estate intelligence for the governed era',
    description:
      'NYC-first property intelligence platform with live distress data, underwriting copilot, and spatial intelligence.',
    status: 'beta',
    previewPath: '/terra/',
    audience: 'NYC brokers, real estate investors, portfolio managers',
    liveDataSources: [
      'NYC Open Data (distress pipeline)',
      'Census ACS',
      'BLS',
      'FEMA',
      'SEC EDGAR',
    ],
    seedDataModules: ['portfolio CRM', 'comparable sales', 'market analytics'],
    knownBlockers: ['MAPBOX_TOKEN not set — maps blank', 'No live MLS/CoStar integration'],
  },
  vessels: {
    id: 'vessels',
    name: 'SEXTANT',
    tagline: 'Maritime intelligence with governance built in',
    description:
      'Fleet command, voyage economics, sanctions screening, and dark vessel detection for maritime operators.',
    status: 'partial',
    previewPath: '/vessels/',
    audience: 'Fleet executives, maritime ops, commercial directors, compliance officers',
    liveDataSources: ['NOAA CO-OPS', 'Open-Meteo Marine', 'GDELT'],
    seedDataModules: [
      'AIS vessel positions (simulated — no live AIS subscription)',
      'dark fleet data',
      'voyage P&L',
    ],
    knownBlockers: [
      'No live AIS subscription ($15–40K/yr required)',
      '3 commercial modules not wired to DB (insurance, trading, platform)',
    ],
  },
  command: {
    id: 'command',
    name: 'Command',
    tagline: 'Unified operational command',
    description:
      'Merged KORA + Imperium command surface for cross-domain real-time monitoring and governed decision execution.',
    status: 'partial',
    previewPath: '/command/',
    audience: 'Platform operators, internal command teams',
    liveDataSources: ['api-server governed decision loop'],
    seedDataModules: ['dashboard badge counts', 'business KPIs', 'cross-domain exceptions'],
    knownBlockers: [
      'APEX cross-domain badge counts not wired to live API',
      'Push notification deep linking not implemented',
    ],
  },
  'szl-holdings-mobile': {
    id: 'szl-holdings-mobile',
    name: 'APEX Mobile',
    tagline: 'Command in your pocket',
    description:
      'iOS and Android command app with biometric authentication and offline-capable sync.',
    status: 'beta',
    previewPath: '/szl-holdings-mobile/',
    audience: 'Executive team, mobile command users',
    liveDataSources: ['same as web platform via api-server'],
    seedDataModules: ['same as web platform'],
    knownBlockers: [
      'Custom splash screen and icon pending',
      'Push notification deep linking pending',
    ],
  },
  'szl-demo-video': {
    id: 'szl-demo-video',
    name: 'Demo Video',
    tagline: 'Governed Autonomy — 90-second overview',
    description: 'Static demo video artifact for investor and prospect use.',
    status: 'internal',
    previewPath: '/szl-demo-video/',
    audience: 'Investors, prospects',
    liveDataSources: [],
    seedDataModules: [],
    knownBlockers: ['Stats overlaid in video are demo projections, not live measurements'],
  },
  'api-server': {
    id: 'api-server',
    name: 'API Server',
    tagline: 'Platform backbone',
    description:
      'Central Express backend — 170 route files, PostgreSQL, AI integrations, multi-tenant isolation.',
    status: 'ga',
    previewPath: '/api/',
    audience: 'All platform surfaces (internal)',
    liveDataSources: ['PostgreSQL', 'intelligence feed adapters'],
    seedDataModules: ['seed data injected via pnpm seed / admin/seed endpoint'],
    knownBlockers: ['Zod validation: 21/170 routes only', 'Integration tests not in CI'],
  },
};

export const ARCHIVED_PRODUCTS = [
  'firestorm',
  'prism-counsel',
  'lyte-command-center',
  'imperium',
  'stephen-site',
  'cortex-mobile',
] as const;

export function getProduct(id: string): PlatformProduct | undefined {
  return PLATFORM_PRODUCTS[id];
}

export function getProductsByStatus(status: ArtifactStatus): PlatformProduct[] {
  return Object.values(PLATFORM_PRODUCTS).filter((p) => p.status === status);
}
