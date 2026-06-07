/**
 * AEEP Capability Resolver
 *
 * Resolves whether a given tool call is permitted for a given agent role,
 * consulting the shared-contracts role registry.
 */
import {
  AGENT_ROLE_CONTRACTS,
  type AgentRoleCapability,
  type AgentRoleId,
} from '@szl-holdings/shared-contracts';

export interface CapabilityCheckResult {
  permitted: boolean;
  requiresApproval: boolean;
  reason?: string;
  capability?: AgentRoleCapability;
}

/**
 * Check whether a tool is permitted for the given agent role.
 *
 * @example
 * const result = resolveCapability("RetrievalStrategist", "retrieval.search");
 * if (!result.permitted) throw new Error(result.reason);
 */
export function resolveCapability(roleId: AgentRoleId, toolId: string): CapabilityCheckResult {
  const contract = AGENT_ROLE_CONTRACTS[roleId];
  if (!contract) {
    return { permitted: false, requiresApproval: false, reason: `Unknown agent role: ${roleId}` };
  }

  const wildcard = contract.capabilities.find((c) => c.toolId === '*');
  const specific = contract.capabilities.find((c) => c.toolId === toolId);

  if (specific) {
    if (!specific.permitted) {
      return {
        permitted: false,
        requiresApproval: false,
        reason: `Tool ${toolId} is explicitly denied for role ${roleId}`,
        capability: specific,
      };
    }
    return {
      permitted: true,
      requiresApproval: specific.requiresApproval ?? false,
      capability: specific,
    };
  }

  if (wildcard) {
    return {
      permitted: wildcard.permitted,
      requiresApproval: wildcard.requiresApproval ?? false,
      capability: wildcard,
      ...(wildcard.permitted ? {} : { reason: `Wildcard deny for role ${roleId}` }),
    };
  }

  return {
    permitted: false,
    requiresApproval: false,
    reason: `No capability rule matched for tool ${toolId} in role ${roleId}`,
  };
}
