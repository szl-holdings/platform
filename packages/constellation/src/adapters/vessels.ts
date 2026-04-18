import type { ConstellationAdapter } from "../adapter.js";
import type { CstNodeTypeRegistration, CreateCstNode, CstNode } from "../types.js";
import { upsertNode, upsertNodeAlias, lookupNodeByAlias } from "../query.js";
import { registerAdapter } from "../registry.js";

const VESSELS_NODE_TYPES: CstNodeTypeRegistration[] = [
  {
    domain: "vessels",
    typeKey: "vessel",
    displayName: "Vessel",
    description: "A maritime vessel",
    defaultSensitivity: "internal",
  },
  {
    domain: "vessels",
    typeKey: "voyage",
    displayName: "Voyage",
    description: "A maritime voyage",
    defaultSensitivity: "internal",
  },
  {
    domain: "vessels",
    typeKey: "port",
    displayName: "Port",
    description: "A maritime port or terminal",
    defaultSensitivity: "public",
  },
  {
    domain: "vessels",
    typeKey: "sanctions_entity",
    displayName: "Sanctions Entity",
    description: "Entity appearing on a sanctions list",
    defaultSensitivity: "restricted",
  },
];

const vesselsAdapter: ConstellationAdapter = {
  domain: "vessels",
  nodeTypes: VESSELS_NODE_TYPES,

  async upsertEntity(input: CreateCstNode): Promise<CstNode> {
    const node = await upsertNode({ ...input, domain: "vessels" });
    const ext = (input.extensions ?? {}) as Record<string, unknown>;
    if (ext.imo) {
      await upsertNodeAlias(node.id, "imo_number", String(ext.imo), "vessels", true);
    }
    if (ext.mmsi) {
      await upsertNodeAlias(node.id, "mmsi", String(ext.mmsi), "vessels");
    }
    return node;
  },

  async lookupByAlias(aliasType: string, aliasValue: string): Promise<CstNode | null> {
    return lookupNodeByAlias(aliasType, aliasValue);
  },
};

registerAdapter(vesselsAdapter);
export { vesselsAdapter };
