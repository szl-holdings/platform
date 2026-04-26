/**
 * Meridian MCP Registry — Single Source of Truth
 *
 * Typed, read-only registry of all 15 governed external MCP servers
 * in their canonical activation order. No external connections are
 * made here — this is pure configuration data.
 *
 * Task #3571 (broader Alloy Meridian) will import from this file rather
 * than redefining the list.
 */

export type McpRiskClass = 'low' | 'medium' | 'high' | 'mutating';

export type McpCategory =
  | 'observability'
  | 'project-management'
  | 'analytics'
  | 'knowledge'
  | 'meetings'
  | 'design'
  | 'content'
  | 'payments'
  | 'maps'
  | 'cms'
  | 'video'
  | 'collaboration';

/**
 * Activation connection state for each governed MCP server.
 *
 * - `not_connected`        — server not yet activated; default for thin-slice registry
 * - `connected_read_only`  — read-only scopes active; no mutation scope granted
 * - `connected_mutating`   — one or more mutating scopes active; high-risk, requires dual approval
 * - `verification_required`— governance review in-progress before activation can proceed
 */
export type McpConnectionStatus =
  | 'not_connected'
  | 'connected_read_only'
  | 'connected_mutating'
  | 'verification_required';

export interface McpServerEntry {
  activationOrder: number;
  slug: string;
  displayName: string;
  category: McpCategory;
  declaredScopes: string[];
  riskClass: McpRiskClass;
  /** True when read-only scopes have passed governance review and are safe to activate. */
  readOnlyReady: boolean;
  /** Current activation/connection state for this MCP server. */
  connectionStatus: McpConnectionStatus;
  governanceNote: string;
  docLink: string;
}

export const MCP_REGISTRY: readonly McpServerEntry[] = Object.freeze([
  {
    activationOrder: 1,
    slug: 'sentry',
    displayName: 'Sentry',
    category: 'observability',
    declaredScopes: ['error:read', 'issue:read', 'project:read', 'event:read'],
    riskClass: 'low',
    readOnlyReady: true,
    connectionStatus: 'not_connected',
    governanceNote:
      'Read-only error and issue ingestion. No mutation scope requested. Activate first — safe baseline for observability.',
    docLink: 'https://docs.sentry.io/api/',
  },
  {
    activationOrder: 2,
    slug: 'linear',
    displayName: 'Linear',
    category: 'project-management',
    declaredScopes: ['issue:read', 'project:read', 'team:read', 'cycle:read', 'comment:read'],
    riskClass: 'low',
    readOnlyReady: true,
    connectionStatus: 'not_connected',
    governanceNote:
      'Read-only project and issue tracking. Comment-write and issue-create require explicit operator approval before enabling.',
    docLink: 'https://developers.linear.app/docs',
  },
  {
    activationOrder: 3,
    slug: 'posthog',
    displayName: 'PostHog',
    category: 'analytics',
    declaredScopes: ['insight:read', 'event:read', 'person:read', 'feature_flag:read', 'experiment:read'],
    riskClass: 'low',
    readOnlyReady: true,
    connectionStatus: 'not_connected',
    governanceNote:
      'Product analytics read access. No PII export or flag mutation without approval. Feeds signal cartographer.',
    docLink: 'https://posthog.com/docs/api',
  },
  {
    activationOrder: 4,
    slug: 'amplitude',
    displayName: 'Amplitude',
    category: 'analytics',
    declaredScopes: ['chart:read', 'dashboard:read', 'cohort:read', 'user_activity:read'],
    riskClass: 'low',
    readOnlyReady: true,
    connectionStatus: 'not_connected',
    governanceNote:
      'Behavioural analytics read. Cohort export requires data governance review. Complements PostHog signal lane.',
    docLink: 'https://www.docs.developers.amplitude.com/',
  },
  {
    activationOrder: 5,
    slug: 'notion',
    displayName: 'Notion',
    category: 'knowledge',
    declaredScopes: ['page:read', 'database:read', 'block:read', 'user:read'],
    riskClass: 'medium',
    readOnlyReady: true,
    connectionStatus: 'not_connected',
    governanceNote:
      'Knowledge base read access. Page creation and database writes require explicit approval — risk elevated due to internal docs access.',
    docLink: 'https://developers.notion.com/',
  },
  {
    activationOrder: 6,
    slug: 'granola',
    displayName: 'Granola',
    category: 'meetings',
    declaredScopes: ['meeting:read', 'transcript:read', 'note:read', 'summary:read'],
    riskClass: 'medium',
    readOnlyReady: true,
    connectionStatus: 'not_connected',
    governanceNote:
      'Meeting transcript and summary read. Transcripts may contain confidential information — treat as internal-only. No note mutation without approval.',
    docLink: 'https://granola.ai/developers',
  },
  {
    activationOrder: 7,
    slug: 'figma',
    displayName: 'Figma',
    category: 'design',
    declaredScopes: ['file:read', 'component:read', 'comment:read', 'project:read', 'team:read'],
    riskClass: 'medium',
    readOnlyReady: true,
    connectionStatus: 'not_connected',
    governanceNote:
      'Design system and file read. Comment writes and file edits are mutating — require approval before enabling write scope.',
    docLink: 'https://www.figma.com/developers/api',
  },
  {
    activationOrder: 8,
    slug: 'squidler',
    displayName: 'Squidler',
    category: 'content',
    declaredScopes: ['content:read', 'schedule:read', 'analytics:read'],
    riskClass: 'medium',
    readOnlyReady: true,
    connectionStatus: 'not_connected',
    governanceNote:
      'Content and scheduling read. Publishing and schedule mutation are mutating actions — require explicit human approval.',
    docLink: 'https://squidler.io/docs',
  },
  {
    activationOrder: 9,
    slug: 'stripe',
    displayName: 'Stripe',
    category: 'payments',
    declaredScopes: ['balance:read', 'charge:read', 'customer:read', 'invoice:read', 'payment_intent:read', 'subscription:read'],
    riskClass: 'high',
    readOnlyReady: true,
    connectionStatus: 'not_connected',
    governanceNote:
      'Financial data read. All write operations (charge, refund, subscription change) are strictly mutating and require dual-approval. Restricted key with read-only scopes mandatory.',
    docLink: 'https://stripe.com/docs/api',
  },
  {
    activationOrder: 10,
    slug: 'razorpay',
    displayName: 'Razorpay',
    category: 'payments',
    declaredScopes: ['payment:read', 'order:read', 'refund:read', 'settlement:read', 'customer:read'],
    riskClass: 'high',
    readOnlyReady: true,
    connectionStatus: 'not_connected',
    governanceNote:
      'INR payment data read. Same high-risk classification as Stripe. No refund, capture, or order mutation without explicit operator approval.',
    docLink: 'https://razorpay.com/docs/api/',
  },
  {
    activationOrder: 11,
    slug: 'google-maps-platform',
    displayName: 'Google Maps Platform',
    category: 'maps',
    declaredScopes: ['geocoding:read', 'places:read', 'routes:read', 'elevation:read'],
    riskClass: 'low',
    readOnlyReady: true,
    connectionStatus: 'not_connected',
    governanceNote:
      'Geospatial data read. API key must be restricted by referrer and IP. No data write scope exists. Feeds Meridian GEOINT layer.',
    docLink: 'https://developers.google.com/maps/documentation',
  },
  {
    activationOrder: 12,
    slug: 'sanity',
    displayName: 'Sanity',
    category: 'cms',
    declaredScopes: ['document:read', 'asset:read', 'dataset:read'],
    riskClass: 'medium',
    readOnlyReady: true,
    connectionStatus: 'not_connected',
    governanceNote:
      'CMS content read via GROQ. Document mutations and asset uploads are mutating — require operator approval and dataset-scoped token.',
    docLink: 'https://www.sanity.io/docs/http-api',
  },
  {
    activationOrder: 13,
    slug: 'wistia',
    displayName: 'Wistia',
    category: 'video',
    declaredScopes: ['media:read', 'project:read', 'stats:read', 'viewer:read'],
    riskClass: 'medium',
    readOnlyReady: true,
    connectionStatus: 'not_connected',
    governanceNote:
      'Video hosting and analytics read. Media uploads and project mutations require approval. Stats feed engagement signal lane.',
    docLink: 'https://wistia.com/support/developers/data-api',
  },
  {
    activationOrder: 14,
    slug: 'atlassian',
    displayName: 'Atlassian',
    category: 'project-management',
    declaredScopes: ['issue:read', 'project:read', 'comment:read', 'sprint:read', 'board:read', 'user:read'],
    riskClass: 'high',
    readOnlyReady: true,
    connectionStatus: 'not_connected',
    governanceNote:
      'Jira and Confluence read. High risk due to breadth of internal project data. Issue creation, comment, and wiki mutations require dual-approval.',
    docLink: 'https://developer.atlassian.com/cloud/jira/platform/rest/v3/',
  },
  {
    activationOrder: 15,
    slug: 'miro',
    displayName: 'Miro',
    category: 'collaboration',
    declaredScopes: ['board:read', 'item:read', 'comment:read', 'tag:read'],
    riskClass: 'medium',
    readOnlyReady: true,
    connectionStatus: 'not_connected',
    governanceNote:
      'Whiteboard and diagram read. Board item creation and comment writes are mutating. Activate last — lower signal priority than observability and PM tools.',
    docLink: 'https://developers.miro.com/docs',
  },
]) as readonly McpServerEntry[];

export const MCP_REGISTRY_VERSION = '1.0.0';
export const MCP_REGISTRY_TOTAL = MCP_REGISTRY.length;

export function getMcpServerBySlug(slug: string): McpServerEntry | undefined {
  return MCP_REGISTRY.find((s) => s.slug === slug);
}

export function getMcpServersByRiskClass(riskClass: McpRiskClass): McpServerEntry[] {
  return MCP_REGISTRY.filter((s) => s.riskClass === riskClass);
}

export function getMcpServersByCategory(category: McpCategory): McpServerEntry[] {
  return MCP_REGISTRY.filter((s) => s.category === category);
}
