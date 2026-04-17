import type { ConstellationAdapter } from "../adapter.ts";
import type { CstNodeTypeRegistration, CreateCstNode, CstNode } from "../types.ts";
import { upsertNode, upsertNodeAlias, lookupNodeByAlias } from "../query.ts";
import { registerAdapter } from "../registry.ts";

const CARLOTA_NODE_TYPES: CstNodeTypeRegistration[] = [
  {
    domain: "carlota-jo",
    typeKey: "household",
    displayName: "Household",
    description: "A client household",
    defaultSensitivity: "confidential",
  },
  {
    domain: "carlota-jo",
    typeKey: "vendor",
    displayName: "Vendor",
    description: "A service vendor",
    defaultSensitivity: "internal",
  },
  {
    domain: "carlota-jo",
    typeKey: "schedule",
    displayName: "Schedule",
    description: "A household schedule or appointment",
    defaultSensitivity: "confidential",
  },
];

const carlotaJoAdapter: ConstellationAdapter = {
  domain: "carlota-jo",
  nodeTypes: CARLOTA_NODE_TYPES,

  async upsertEntity(input: CreateCstNode): Promise<CstNode> {
    const node = await upsertNode({ ...input, domain: "carlota-jo" });
    const ext = (input.extensions ?? {}) as Record<string, unknown>;
    if (ext.householdId) {
      await upsertNodeAlias(node.id, "carlota_household_id", String(ext.householdId), "carlota-jo", true);
    }
    return node;
  },

  async lookupByAlias(aliasType: string, aliasValue: string): Promise<CstNode | null> {
    return lookupNodeByAlias(aliasType, aliasValue);
  },
};

registerAdapter(carlotaJoAdapter);
export { carlotaJoAdapter };
