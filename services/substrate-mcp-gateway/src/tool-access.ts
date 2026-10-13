export type ToolAccessRequirement = 'read' | 'write' | 'approve' | 'admin';

const READ_ONLY_TOOLS = new Set([
  'substrate_get_run',
  'substrate_list_approvals',
  'substrate_list_workflows',
  'substrate_search_servers',
  'search_available_servers',
]);

const APPROVAL_TOOLS = new Set(['substrate_approve', 'substrate_reject']);

// These operations mutate the process-wide MCP server registry and therefore
// affect every tenant served by this gateway instance. Tenant-scoped writers
// must never be able to change this global control plane.
const ADMIN_TOOLS = new Set([
  'substrate_enable_server',
  'enable_server',
  'substrate_disable_server',
  'disable_server',
]);

/** Unknown and dynamically discovered tools are mutating by default. */
export function getToolAccessRequirement(toolName: string): ToolAccessRequirement {
  if (ADMIN_TOOLS.has(toolName)) return 'admin';
  if (APPROVAL_TOOLS.has(toolName)) return 'approve';
  if (READ_ONLY_TOOLS.has(toolName)) return 'read';
  return 'write';
}

export function getEnterpriseAccessRequirement(
  method: string,
  params?: Record<string, unknown>,
): ToolAccessRequirement {
  if (method !== 'tools/call') return 'read';
  const toolName = typeof params?.name === 'string' ? params.name : '';
  return getToolAccessRequirement(toolName);
}
