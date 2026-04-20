/**
 * @szl-holdings/config
 *
 * Single source of truth for platform claims, feature flags, environment
 * contract, and public-facing registry.
 *
 * Usage:
 *   import { PLATFORM_PRODUCTS, getProduct } from "@szl-holdings/config/platform-registry"
 *   import { PUBLIC_CLAIMS, FOUNDER_YEARS_EXPERIENCE } from "@szl-holdings/config/public-claims"
 *   import { FEATURE_FLAGS, isFlagEnabled } from "@szl-holdings/config/feature-flags"
 *   import { ENV_CONTRACT, getRequiredVars } from "@szl-holdings/config/env-contract"
 *
 * Or import everything from the root:
 *   import { PLATFORM_PRODUCTS, PUBLIC_CLAIMS, FEATURE_FLAGS, ENV_CONTRACT } from "@szl-holdings/config"
 */

export * from './env-contract';
export * from './feature-flags';
export * from './platform-registry';
export * from './public-claims';
export * from './runtime-mode';

// ---------------------------------------------------------------------------
// Legacy app-level constants (previously exported from lib/config)
// Keep here so that api-server and other consumers that import
// "@szl-holdings/config" continue to get these without changes.
// ---------------------------------------------------------------------------

export const APP_NAME = 'SZL Holdings Platform';
export const APP_VERSION = '0.1.0';

export const PLATFORM_APPS = [
  { slug: 'szl-holdings', name: 'SZL Holdings', icon: 'Building2', color: '#8b5cf6' },
  { slug: 'alloy', name: 'Alloy — Execution Fabric', icon: 'Workflow', color: '#6366f1' },
  { slug: 'lyte', name: 'Lyte Command Center', icon: 'ShoppingBag', color: '#a855f7' },
  { slug: 'vessels', name: 'Vessels Maritime Intelligence', icon: 'Ship', color: '#06b6d4' },
  { slug: 'firestorm', name: 'Firestorm Security Simulation', icon: 'Flame', color: '#f97316' },
  { slug: 'inca', name: 'INCA AI Research', icon: 'Brain', color: '#14b8a6' },
  { slug: 'beacon', name: 'Terra', icon: 'BarChart3', color: '#0ea5e9' },
  { slug: 'rosie', name: 'Aegis Operations', icon: 'AlertTriangle', color: '#ef4444' },
  { slug: 'carlota-jo', name: 'Carlota Jo Advisory', icon: 'Crown', color: '#f43f5e' },
  { slug: 'aegis', name: 'Aegis Control Plane', icon: 'Shield', color: '#10b981' },
  { slug: 'career', name: 'Career — Founder Identity', icon: 'Globe', color: '#6366f1' },
  { slug: 'control-plane', name: 'Admin Control Plane', icon: 'Settings', color: '#64748b' },
] as const;

export type AppSlug = (typeof PLATFORM_APPS)[number]['slug'];

export const ROLES = [
  { name: 'super_admin', description: 'Full platform access — all apps, settings, billing, users' },
  { name: 'exec', description: 'Executive-level oversight — portfolio metrics, strategic reports' },
  { name: 'ops', description: 'Day-to-day operational access — manage data across apps' },
  {
    name: 'compliance',
    description: 'Regulatory and compliance oversight — audit logs, policy enforcement',
  },
  { name: 'maintenance', description: 'Infrastructure and system maintenance access' },
  { name: 'analyst', description: 'Read-only access to dashboards, reports, and analytics' },
  { name: 'viewer', description: 'External viewer — read-only access to shared dashboards' },
] as const;

export type RoleName = (typeof ROLES)[number]['name'];

export const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000;

export const PAGINATION_DEFAULTS = {
  page: 1,
  limit: 25,
  maxLimit: 100,
} as const;

export const API_RATE_LIMITS = {
  windowMs: 15 * 60 * 1000,
  maxRequests: 100,
} as const;

export function getRequiredEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export function getOptionalEnv(key: string, fallback: string = ''): string {
  return process.env[key] ?? fallback;
}

export const APP_INTEGRATIONS: Record<
  string,
  { connectors: string[]; description: string; liveFeeds?: string[]; doctrineRole?: string }
> = {
  career: {
    connectors: ['ai', 'github', 'google', 'storage'],
    description:
      'Career site (formerly Stephen Site) uses AI for content, GitHub for repos, Google auth, file storage',
    doctrineRole: 'EXECUTE',
  },
  vessels: {
    connectors: [
      'weather',
      'stormglass',
      'shipping',
      'monitoring',
      'storage',
      'slack',
      'noaa',
      'openmeteo',
      'gdelt',
    ],
    description:
      'Maritime intelligence uses live NOAA CO-OPS stations, Open-Meteo marine conditions, GDELT geopolitical signals, AIS ship tracking, and port congestion analytics.',
    liveFeeds: [
      'NOAA CO-OPS Station API (live air temp/wind)',
      'Open-Meteo Marine Forecast API',
      'GDELT Geopolitical Event Monitor',
      'AIS Network (AISHub, MarineTraffic)',
      'OFAC Sanctions List',
    ],
    doctrineRole: 'OBSERVE',
  },
  firestorm: {
    connectors: [
      'ai',
      'slack',
      'twilio',
      'monitoring',
      'posthog',
      'storage',
      'cisa',
      'abuseipdb',
      'nvd',
      'mitre',
    ],
    description:
      'Security simulation uses AI analysis, CISA KEV mandatory patches, NVD CVE database, MITRE ATT&CK enterprise techniques, AbuseIPDB IP reputation, and live threat news feeds.',
    liveFeeds: [
      'CISA KEV Catalog (1,554+ entries, live)',
      'NVD National Vulnerability Database (live CVE search)',
      'MITRE ATT&CK Enterprise Matrix v14 (live GitHub)',
      'AbuseIPDB IP Reputation',
      'The Hacker News Live RSS',
    ],
    doctrineRole: 'EXECUTE',
  },
  lyte: {
    connectors: ['stripe', 'hubspot', 'gmail', 'storage', 'posthog', 'shipping', 'bls'],
    description:
      'Commerce command center uses BLS live unemployment rate, GitHub trending repositories, and live tech news from TechCrunch + The Verge RSS feeds.',
    liveFeeds: [
      'BLS Unemployment Rate API (live, LNS14000000)',
      'GitHub Public API — Trending Repositories',
      'TechCrunch Live RSS',
      'The Verge Live RSS',
    ],
    doctrineRole: 'EXECUTE',
  },
  alloy: {
    connectors: ['ai', 'storage', 'monitoring', 'microsoft-graph'],
    description:
      'Alloy — execution fabric, connectors, automations, DAGs, and predictive intelligence engine across the SZL platform.',
    liveFeeds: [
      'HuggingFace Hub — AI Creative Tools (live API)',
      'Cross-Platform Analytics Benchmarks',
      'Microsoft SharePoint Document Libraries',
      'Microsoft Teams Webhook Notifications',
    ],
    doctrineRole: 'EXECUTE',
  },
  dreamscape: {
    connectors: ['ai', 'figma', 'storage', 'google-drive', 'dropbox', 'elevenlabs'],
    description:
      'Alloy predictive intelligence layer — scenario modeling, confidence scoring. Absorbed into Alloy.',
    liveFeeds: [
      'HuggingFace Hub — AI Creative Tools (live API)',
      'Content Marketing RSS Intelligence',
      'Cross-Platform Media Analytics Benchmarks',
    ],
    doctrineRole: 'EXECUTE',
  },
  aegis: {
    connectors: [
      'ai',
      'notion',
      'confluence',
      'google-docs',
      'slack',
      'monitoring',
      'microsoft-graph',
    ],
    description:
      'Aegis control plane — risk register, remediation tracking, governance, and compliance using NIST CSF 2.0, FedRAMP, and CMMC frameworks.',
    liveFeeds: [
      'NIST CSF 2.0 Framework',
      'FedRAMP Marketplace',
      'CMMC Maturity Model',
      'CISA KEV (Patch Compliance)',
      'Microsoft SharePoint Compliance Evidence Library',
    ],
    doctrineRole: 'DECIDE',
  },
  rosie: {
    connectors: ['ai', 'monitoring', 'posthog', 'slack', 'gmail'],
    description:
      'Aegis Operations (slug: rosie/msp) — threat and anomaly visibility, evidence-backed incident command.',
    liveFeeds: [
      'USAspending.gov Federal Contracts',
      'FedRAMP Authorized Products',
      'SAM.gov Contract Pipeline',
    ],
    doctrineRole: 'OBSERVE',
  },
  beacon: {
    connectors: ['ai', 'monitoring', 'storage'],
    description:
      'Terra (slug: beacon) — business telemetry, KPI movement, Census demographics, BLS employment, FEMA risk, SEC EDGAR REIT filings.',
    liveFeeds: [
      'Census Bureau ACS Demographics',
      'BLS Employment Data',
      'FEMA National Risk Index',
      'SEC EDGAR REIT Filings',
      'Open-Meteo Climate Projections',
    ],
    doctrineRole: 'OBSERVE',
  },
  inca: {
    connectors: ['ai', 'huggingface', 'storage', 'monitoring', 'posthog', 'arxiv'],
    description:
      'AI research platform with live arXiv multi-category papers, Semantic Scholar citation graph, PapersWithCode ML benchmarks.',
    liveFeeds: [
      'arXiv Open Access Papers (live XML API, cs.CL/cs.CR/cs.CV)',
      'Semantic Scholar Research Graph API',
      'PapersWithCode SOTA Leaderboards',
      'HuggingFace Hub Model Discovery API',
    ],
    doctrineRole: 'UNDERSTAND',
  },
  'control-plane': {
    connectors: [
      'ai',
      'stripe',
      'slack',
      'twilio',
      'google',
      'notion',
      'github',
      'storage',
      'monitoring',
      'posthog',
      'gmail',
      'hubspot',
      'confluence',
      'figma',
      'elevenlabs',
      'weather',
      'stormglass',
      'shipping',
      'google-calendar',
      'google-docs',
      'google-drive',
      'dropbox',
      'onedrive',
      'cisa',
      'arxiv',
      'abuseipdb',
      'noaa',
      'nvd',
      'bls',
      'worldbank',
      'openmeteo',
      'mitre',
      'gdelt',
      'microsoft-graph',
    ],
    description: 'Admin panel monitors all connectors and live feeds across the platform.',
    liveFeeds: [
      'All Platform Feeds Aggregated — 36 Connectors',
      'Microsoft 365 — SharePoint, OneDrive, Outlook, Teams',
    ],
    doctrineRole: 'DECIDE',
  },
  'szl-holdings': {
    connectors: ['ai', 'stripe', 'storage', 'monitoring', 'posthog'],
    description:
      'Holdings dashboard for portfolio management, venture tracking, and strategic metrics',
    doctrineRole: 'DECIDE',
  },
  'carlota-jo': {
    connectors: [
      'ai',
      'stripe',
      'google-calendar',
      'gmail',
      'hubspot',
      'storage',
      'worldbank',
      'bls',
      'microsoft-graph',
    ],
    description:
      'Luxury advisory booking uses World Bank live GDP indicators, BLS employment data, and Outlook Calendar integration.',
    liveFeeds: [
      'World Bank Open Data API (live GDP/inflation indicators)',
      'BLS Employment Statistics',
      'Harvard Business Review Live RSS',
      'Consulting Industry Trend Intelligence',
      'Microsoft Outlook Calendar (real availability)',
      'Microsoft Outlook Contacts (CRM sync)',
    ],
    doctrineRole: 'DECIDE',
  },
  'stephen-site': {
    connectors: ['ai', 'github', 'google', 'storage'],
    description: 'Legacy slug for Career — Founder Identity site',
    doctrineRole: 'EXECUTE',
  },
  terra: {
    connectors: ['ai', 'monitoring', 'storage'],
    description: 'Legacy slug for Terra (beacon) — Business Telemetry',
    doctrineRole: 'OBSERVE',
  },
  readiness: {
    connectors: ['ai', 'notion', 'confluence', 'google-docs', 'slack', 'monitoring'],
    description: 'Legacy slug for Aegis — Control Plane',
    doctrineRole: 'DECIDE',
  },
  msp: {
    connectors: ['ai', 'monitoring', 'posthog', 'slack', 'gmail'],
    description: 'Legacy slug for Aegis Operations — Managed Services Command',
    doctrineRole: 'OBSERVE',
  },
} as const;
