import type { ConstellationAdapter } from '../adapter.js';
import { lookupNodeByAlias, upsertNode, upsertNodeAlias } from '../query.js';
import { registerAdapter } from '../registry.js';
import type { CreateCstNode, CstNode, CstNodeTypeRegistration } from '../types.js';

const LYTE_NODE_TYPES: CstNodeTypeRegistration[] = [
  {
    domain: 'lyte',
    typeKey: 'signal',
    displayName: 'Signal',
    description: 'A KORA platform signal or data point',
    defaultSensitivity: 'internal',
  },
  {
    domain: 'lyte',
    typeKey: 'account',
    displayName: 'Account',
    description: 'A KORA account entity',
    defaultSensitivity: 'confidential',
  },
  {
    domain: 'lyte',
    typeKey: 'contact',
    displayName: 'Contact',
    description: 'A contact record',
    defaultSensitivity: 'confidential',
  },
  {
    domain: 'lyte',
    typeKey: 'workflow',
    displayName: 'Workflow',
    description: 'A KORA workflow definition',
    defaultSensitivity: 'internal',
  },
];

const lyteAdapter: ConstellationAdapter = {
  domain: 'lyte',
  nodeTypes: LYTE_NODE_TYPES,

  async upsertEntity(input: CreateCstNode): Promise<CstNode> {
    const node = await upsertNode({ ...input, domain: 'lyte' });
    const ext = (input.extensions ?? {}) as Record<string, unknown>;
    if (ext.signalId) {
      await upsertNodeAlias(node.id, 'lyte_signal_id', String(ext.signalId), 'lyte', true);
    }
    return node;
  },

  async lookupByAlias(aliasType: string, aliasValue: string): Promise<CstNode | null> {
    return lookupNodeByAlias(aliasType, aliasValue);
  },
};

registerAdapter(lyteAdapter);

export { lyteAdapter };
