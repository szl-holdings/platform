/**
 * Alloy Meridian — MCP Server Registry & Governance
 *
 * Tracks activation status of external MCP servers and enforces
 * read-first governance. All create/update/delete/send/publish/
 * payment/permission operations require explicit approval.
 *
 * Status is derived at request time from env key presence,
 * so adding a secret immediately reflects as "active" without
 * requiring a service restart on the registry module itself.
 */

export type McpActivationStatus = 'active' | 'inactive' | 'pending_auth' | 'error';
export type McpOperationType = 'read' | 'write' | 'delete' | 'send' | 'publish' | 'payment' | 'permission';

export interface McpServerEntry {
  id: string;
  name: string;
  description: string;
  category: 'observability' | 'project_management' | 'communication' | 'analytics' | 'crm' | 'security' | 'productivity';
  /** Computed at request time from env key presence — never hardcoded. */
  status: McpActivationStatus;
  requiresOAuth: boolean;
  oauthScopes?: string[];
  /** Environment variable that, when set, activates this server. */
  envKey?: string;
  baseUrl?: string;
  capabilities: Array<{
    id: string;
    name: string;
    operationType: McpOperationType;
    requiresApproval: boolean;
    description: string;
  }>;
  lastChecked: string;
  notes?: string;
}

/** Static template — status is NOT set here; it is computed dynamically below. */
interface McpServerTemplate extends Omit<McpServerEntry, 'status' | 'lastChecked'> {
  /** OAuth-only servers that need human sign-in, not just a token. */
  requiresHumanOAuth?: boolean;
}

export interface GovernancePolicy {
  operationsRequiringApproval: McpOperationType[];
  readFirstEnforced: boolean;
  maxAutoRetries: number;
  auditAllOperations: boolean;
  blockOnUnconfigured: boolean;
}

export interface McpGovernanceCheck {
  serverId: string;
  capability: string;
  operationType: McpOperationType;
  permitted: boolean;
  requiresApproval: boolean;
  reason: string;
  checkedAt: string;
}

export const GOVERNANCE_POLICY: GovernancePolicy = {
  operationsRequiringApproval: ['write', 'delete', 'send', 'publish', 'payment', 'permission'],
  readFirstEnforced: true,
  maxAutoRetries: 2,
  auditAllOperations: true,
  blockOnUnconfigured: false,
};

const SERVER_TEMPLATES: McpServerTemplate[] = [
  {
    id: 'sentry',
    name: 'Sentry',
    description: 'Error tracking and performance monitoring',
    category: 'observability',
    requiresOAuth: false,
    envKey: 'SENTRY_MCP_TOKEN',
    baseUrl: 'https://mcp.sentry.dev',
    capabilities: [
      { id: 'sentry.query_issues', name: 'Query Issues', operationType: 'read', requiresApproval: false, description: 'List and search error issues' },
      { id: 'sentry.create_issue', name: 'Create Issue', operationType: 'write', requiresApproval: true, description: 'Create a new Sentry issue' },
      { id: 'sentry.resolve_issue', name: 'Resolve Issue', operationType: 'write', requiresApproval: true, description: 'Mark an issue as resolved' },
    ],
    notes: 'Requires SENTRY_MCP_TOKEN. Read operations available without auth in demo mode.',
  },
  {
    id: 'linear',
    name: 'Linear',
    description: 'Issue tracking and project management',
    category: 'project_management',
    requiresOAuth: true,
    requiresHumanOAuth: false,
    oauthScopes: ['issues:read', 'issues:write', 'projects:read'],
    envKey: 'LINEAR_API_KEY',
    baseUrl: 'https://api.linear.app/graphql',
    capabilities: [
      { id: 'linear.list_issues', name: 'List Issues', operationType: 'read', requiresApproval: false, description: 'Query open issues and backlog' },
      { id: 'linear.create_issue', name: 'Create Issue', operationType: 'write', requiresApproval: true, description: 'Create a new issue with title, priority, and team' },
      { id: 'linear.update_issue', name: 'Update Issue', operationType: 'write', requiresApproval: true, description: 'Update status, priority, or assignee' },
    ],
    notes: 'Set LINEAR_API_KEY to activate. Alternatively, connect via Replit Integrations for OAuth.',
  },
  {
    id: 'posthog',
    name: 'PostHog',
    description: 'Product analytics and session recording',
    category: 'analytics',
    requiresOAuth: false,
    envKey: 'POSTHOG_API_KEY',
    baseUrl: 'https://app.posthog.com',
    capabilities: [
      { id: 'posthog.query_events', name: 'Query Events', operationType: 'read', requiresApproval: false, description: 'Query event and funnel data' },
      { id: 'posthog.create_insight', name: 'Create Insight', operationType: 'write', requiresApproval: true, description: 'Save a new insight or dashboard tile' },
    ],
  },
  {
    id: 'amplitude',
    name: 'Amplitude',
    description: 'Behavioral analytics and cohort analysis',
    category: 'analytics',
    requiresOAuth: false,
    envKey: 'AMPLITUDE_API_KEY',
    baseUrl: 'https://amplitude.com/api',
    capabilities: [
      { id: 'amplitude.query_cohort', name: 'Query Cohort', operationType: 'read', requiresApproval: false, description: 'Fetch cohort retention and engagement data' },
      { id: 'amplitude.export_chart', name: 'Export Chart', operationType: 'read', requiresApproval: false, description: 'Export chart data as CSV' },
    ],
  },
  {
    id: 'notion',
    name: 'Notion',
    description: 'Knowledge base and documentation',
    category: 'productivity',
    requiresOAuth: true,
    requiresHumanOAuth: true,
    oauthScopes: ['read_content', 'update_content', 'insert_content'],
    envKey: 'NOTION_TOKEN',
    baseUrl: 'https://api.notion.com/v1',
    capabilities: [
      { id: 'notion.read_page', name: 'Read Page', operationType: 'read', requiresApproval: false, description: 'Read a Notion page or database' },
      { id: 'notion.create_page', name: 'Create Page', operationType: 'write', requiresApproval: true, description: 'Create a new Notion page' },
      { id: 'notion.update_page', name: 'Update Page', operationType: 'write', requiresApproval: true, description: 'Append blocks to a page' },
    ],
    notes: 'Requires Notion OAuth sign-in. See docs/replit-mcp-activation.md for setup.',
  },
  {
    id: 'pagerduty',
    name: 'PagerDuty',
    description: 'Incident management and on-call coordination',
    category: 'observability',
    requiresOAuth: false,
    envKey: 'PAGERDUTY_API_KEY',
    baseUrl: 'https://api.pagerduty.com',
    capabilities: [
      { id: 'pagerduty.list_incidents', name: 'List Incidents', operationType: 'read', requiresApproval: false, description: 'List active incidents and alerts' },
      { id: 'pagerduty.create_incident', name: 'Create Incident', operationType: 'write', requiresApproval: true, description: 'Open a new incident' },
      { id: 'pagerduty.trigger_alert', name: 'Trigger Alert', operationType: 'send', requiresApproval: true, description: 'Send on-call page' },
    ],
  },
  {
    id: 'slack',
    name: 'Slack',
    description: 'Team communication and notifications',
    category: 'communication',
    requiresOAuth: true,
    requiresHumanOAuth: true,
    oauthScopes: ['channels:read', 'chat:write', 'files:read'],
    envKey: 'SLACK_BOT_TOKEN',
    baseUrl: 'https://slack.com/api',
    capabilities: [
      { id: 'slack.read_channel', name: 'Read Channel', operationType: 'read', requiresApproval: false, description: 'Read messages from a Slack channel' },
      { id: 'slack.post_message', name: 'Post Message', operationType: 'send', requiresApproval: true, description: 'Post a message to a channel' },
      { id: 'slack.upload_file', name: 'Upload File', operationType: 'write', requiresApproval: true, description: 'Upload a file to Slack' },
    ],
    notes: 'All send operations require explicit approval per Founder Intent doctrine.',
  },
  {
    id: 'github',
    name: 'GitHub',
    description: 'Code hosting and collaboration',
    category: 'project_management',
    requiresOAuth: true,
    requiresHumanOAuth: false,
    oauthScopes: ['repo', 'read:org', 'issues'],
    envKey: 'GITHUB_TOKEN',
    baseUrl: 'https://api.github.com',
    capabilities: [
      { id: 'github.list_prs', name: 'List PRs', operationType: 'read', requiresApproval: false, description: 'List open pull requests' },
      { id: 'github.read_issues', name: 'Read Issues', operationType: 'read', requiresApproval: false, description: 'Read issues and comments' },
      { id: 'github.create_issue', name: 'Create Issue', operationType: 'write', requiresApproval: true, description: 'Create a new GitHub issue' },
      { id: 'github.merge_pr', name: 'Merge PR', operationType: 'write', requiresApproval: true, description: 'Merge a pull request' },
    ],
    notes: 'GitHub integration installed via Replit Integrations.',
  },
];

/**
 * Derive activation status from environment at call time.
 * This means adding a secret key immediately reflects in the registry
 * without requiring a module reload.
 *
 * Rules:
 * - If envKey is set and env var has a non-empty value → 'active'
 * - If requiresHumanOAuth and no envKey value → 'pending_auth' (needs human sign-in)
 * - Otherwise → 'inactive' (set the envKey to activate)
 */
function resolveStatus(template: McpServerTemplate): McpActivationStatus {
  if (template.envKey) {
    const keyValue = process.env[template.envKey];
    if (keyValue && keyValue.trim().length > 0) {
      return 'active';
    }
  }
  if ((template as McpServerTemplate & { requiresHumanOAuth?: boolean }).requiresHumanOAuth) {
    return 'pending_auth';
  }
  return 'inactive';
}

/**
 * Returns the full MCP registry with status computed from env at call time.
 */
export function getMcpRegistry(): McpServerEntry[] {
  const now = new Date().toISOString();
  return SERVER_TEMPLATES.map((template) => ({
    id: template.id,
    name: template.name,
    description: template.description,
    category: template.category,
    status: resolveStatus(template),
    requiresOAuth: template.requiresOAuth,
    oauthScopes: template.oauthScopes,
    envKey: template.envKey,
    baseUrl: template.baseUrl,
    capabilities: template.capabilities,
    lastChecked: now,
    notes: template.notes,
  }));
}

/**
 * Legacy static export — status computed once at module load.
 * Prefer getMcpRegistry() for request-time accuracy.
 */
export const MCP_REGISTRY: McpServerEntry[] = getMcpRegistry();

export function checkGovernance(
  serverId: string,
  capabilityId: string,
): McpGovernanceCheck {
  // Always resolve registry dynamically for accurate status.
  const registry = getMcpRegistry();
  const server = registry.find((s) => s.id === serverId);
  const now = new Date().toISOString();

  if (!server) {
    return {
      serverId,
      capability: capabilityId,
      operationType: 'read',
      permitted: false,
      requiresApproval: true,
      reason: `MCP server '${serverId}' not found in registry.`,
      checkedAt: now,
    };
  }

  const capability = server.capabilities.find((c) => c.id === capabilityId);
  if (!capability) {
    return {
      serverId,
      capability: capabilityId,
      operationType: 'read',
      permitted: false,
      requiresApproval: true,
      reason: `Capability '${capabilityId}' not registered for server '${serverId}'.`,
      checkedAt: now,
    };
  }

  if (server.status !== 'active') {
    const activationHint = server.status === 'pending_auth'
      ? `OAuth sign-in required. See docs/replit-mcp-activation.md.`
      : `Set ${server.envKey} in Replit Secrets to activate.`;

    return {
      serverId,
      capability: capabilityId,
      operationType: capability.operationType,
      permitted: GOVERNANCE_POLICY.blockOnUnconfigured ? false : capability.operationType === 'read',
      requiresApproval: capability.requiresApproval,
      reason: `Server '${serverId}' is not active (status: ${server.status}). ${activationHint}`,
      checkedAt: now,
    };
  }

  const requiresApproval =
    GOVERNANCE_POLICY.operationsRequiringApproval.includes(capability.operationType) ||
    capability.requiresApproval;

  return {
    serverId,
    capability: capabilityId,
    operationType: capability.operationType,
    permitted: true,
    requiresApproval,
    reason: requiresApproval
      ? `Operation '${capability.operationType}' requires explicit approval per governance policy.`
      : `Read operation permitted. No approval required.`,
    checkedAt: now,
  };
}

export function getRegistryStatus(): {
  total: number;
  active: number;
  inactive: number;
  pendingAuth: number;
  servers: Array<Pick<McpServerEntry, 'id' | 'name' | 'status' | 'category'>>;
} {
  const registry = getMcpRegistry();
  const active = registry.filter((s) => s.status === 'active').length;
  const inactive = registry.filter((s) => s.status === 'inactive').length;
  const pendingAuth = registry.filter((s) => s.status === 'pending_auth').length;

  return {
    total: registry.length,
    active,
    inactive,
    pendingAuth,
    servers: registry.map((s) => ({
      id: s.id,
      name: s.name,
      status: s.status,
      category: s.category,
    })),
  };
}
