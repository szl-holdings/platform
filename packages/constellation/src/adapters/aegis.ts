import type { ConstellationAdapter } from "../adapter.js";
import type { CstNodeTypeRegistration, CreateCstNode, CstNode } from "../types.js";
import { upsertNode, upsertNodeAlias, lookupNodeByAlias } from "../query.js";
import { registerAdapter } from "../registry.js";

const AEGIS_NODE_TYPES: CstNodeTypeRegistration[] = [
  {
    domain: "aegis",
    typeKey: "asset",
    displayName: "Asset",
    description: "A cyber or physical asset",
    defaultSensitivity: "internal",
  },
  {
    domain: "aegis",
    typeKey: "identity",
    displayName: "Identity",
    description: "A user, system, or service identity",
    defaultSensitivity: "confidential",
  },
  {
    domain: "aegis",
    typeKey: "control",
    displayName: "Security Control",
    description: "A security control or countermeasure",
    defaultSensitivity: "internal",
  },
  {
    domain: "aegis",
    typeKey: "incident",
    displayName: "Security Incident",
    description: "An active or historical security incident",
    defaultSensitivity: "restricted",
  },
];

const aegisAdapter: ConstellationAdapter = {
  domain: "aegis",
  nodeTypes: AEGIS_NODE_TYPES,

  async upsertEntity(input: CreateCstNode): Promise<CstNode> {
    const node = await upsertNode({ ...input, domain: "aegis" });
    const ext = (input.extensions ?? {}) as Record<string, unknown>;
    if (ext.assetId) {
      await upsertNodeAlias(node.id, "aegis_asset_id", String(ext.assetId), "aegis", true);
    }
    return node;
  },

  async lookupByAlias(aliasType: string, aliasValue: string): Promise<CstNode | null> {
    return lookupNodeByAlias(aliasType, aliasValue);
  },
};

registerAdapter(aegisAdapter);
export { aegisAdapter };
