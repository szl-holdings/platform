import type { ConstellationAdapter } from "../adapter.ts";
import type { CstNodeTypeRegistration, CreateCstNode, CstNode } from "../types.ts";
import { upsertNode, upsertNodeAlias, lookupNodeByAlias } from "../query.ts";
import { registerAdapter } from "../registry.ts";

const PRISM_NODE_TYPES: CstNodeTypeRegistration[] = [
  {
    domain: "prism",
    typeKey: "matter",
    displayName: "Legal Matter",
    description: "A legal matter or engagement",
    defaultSensitivity: "confidential",
  },
  {
    domain: "prism",
    typeKey: "filing",
    displayName: "Court Filing",
    description: "A court or regulatory filing",
    defaultSensitivity: "internal",
  },
  {
    domain: "prism",
    typeKey: "regulation",
    displayName: "Regulation",
    description: "A regulatory rule or statute",
    defaultSensitivity: "public",
  },
  {
    domain: "prism",
    typeKey: "evidence",
    displayName: "Evidence Record",
    description: "Evidence artifact attached to a matter",
    defaultSensitivity: "confidential",
  },
];

const prismAdapter: ConstellationAdapter = {
  domain: "prism",
  nodeTypes: PRISM_NODE_TYPES,

  async upsertEntity(input: CreateCstNode): Promise<CstNode> {
    const node = await upsertNode({ ...input, domain: "prism" });
    const matterNumber = (input.extensions as Record<string, unknown>)?.matterNumber as string | undefined;
    if (matterNumber) {
      await upsertNodeAlias(node.id, "prism_matter_number", matterNumber, "prism", true);
    }
    return node;
  },

  async lookupByAlias(aliasType: string, aliasValue: string): Promise<CstNode | null> {
    return lookupNodeByAlias(aliasType, aliasValue);
  },
};

registerAdapter(prismAdapter);
export { prismAdapter };
