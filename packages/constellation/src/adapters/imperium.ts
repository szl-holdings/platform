import type { ConstellationAdapter } from "../adapter.js";
import type { CstNodeTypeRegistration, CreateCstNode, CstNode } from "../types.js";
import { upsertNode, upsertNodeAlias, lookupNodeByAlias } from "../query.js";
import { registerAdapter } from "../registry.js";

const IMPERIUM_NODE_TYPES: CstNodeTypeRegistration[] = [
  {
    domain: "imperium",
    typeKey: "tenant",
    displayName: "Tenant",
    description: "A platform tenant / organization",
    defaultSensitivity: "confidential",
  },
  {
    domain: "imperium",
    typeKey: "environment",
    displayName: "Environment",
    description: "A tenant deployment environment",
    defaultSensitivity: "internal",
  },
  {
    domain: "imperium",
    typeKey: "deployment",
    displayName: "Deployment",
    description: "A specific service deployment",
    defaultSensitivity: "internal",
  },
];

const imperiumAdapter: ConstellationAdapter = {
  domain: "imperium",
  nodeTypes: IMPERIUM_NODE_TYPES,

  async upsertEntity(input: CreateCstNode): Promise<CstNode> {
    const node = await upsertNode({ ...input, domain: "imperium" });
    const ext = (input.extensions ?? {}) as Record<string, unknown>;
    if (ext.tenantId) {
      await upsertNodeAlias(node.id, "imperium_tenant_id", String(ext.tenantId), "imperium", true);
    }
    return node;
  },

  async lookupByAlias(aliasType: string, aliasValue: string): Promise<CstNode | null> {
    return lookupNodeByAlias(aliasType, aliasValue);
  },
};

registerAdapter(imperiumAdapter);
export { imperiumAdapter };
