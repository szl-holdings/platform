export {
  createKnowledgeEntry,
  type KnowledgeDomain,
  type KnowledgeEntry,
  type KnowledgeEntryType,
  type KnowledgeQuery,
  KnowledgeStore,
  knowledgeStore,
  persistAgentRun,
} from '@szl-holdings/forge-runtime';

import { logger } from './logger';

logger.info('Knowledge store initialized');
