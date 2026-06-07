import type { ConstellationAdapter } from '../adapter.js';
import { lookupNodeByAlias, upsertNode, upsertNodeAlias } from '../query.js';
import { registerAdapter } from '../registry.js';
import type { CreateCstNode, CstNode, CstNodeTypeRegistration } from '../types.js';

const TERRA_NODE_TYPES: CstNodeTypeRegistration[] = [
  {
    domain: 'terra',
    typeKey: 'property',
    displayName: 'Property',
    description: 'Real estate property or parcel',
    defaultSensitivity: 'internal',
  },
  {
    domain: 'terra',
    typeKey: 'parcel',
    displayName: 'Land Parcel',
    description: 'Land registry parcel record',
    defaultSensitivity: 'internal',
  },
  {
    domain: 'terra',
    typeKey: 'lender',
    displayName: 'Lender',
    description: 'Mortgage or financing lender entity',
    defaultSensitivity: 'confidential',
  },
  {
    domain: 'terra',
    typeKey: 'owner',
    displayName: 'Property Owner',
    description: 'Individual or corporate property owner',
    defaultSensitivity: 'confidential',
  },
];

const terraAdapter: ConstellationAdapter = {
  domain: 'terra',
  nodeTypes: TERRA_NODE_TYPES,

  async upsertEntity(input: CreateCstNode): Promise<CstNode> {
    const node = await upsertNode({ ...input, domain: 'terra' });
    const externalId = (input.extensions as Record<string, unknown>)?.externalId as
      | string
      | undefined;
    if (externalId) {
      await upsertNodeAlias(node.id, 'terra_external_id', externalId, 'terra');
    }
    return node;
  },

  async lookupByAlias(aliasType: string, aliasValue: string): Promise<CstNode | null> {
    return lookupNodeByAlias(aliasType, aliasValue);
  },
};

registerAdapter(terraAdapter);

export { terraAdapter };
