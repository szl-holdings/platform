export {
  KnowledgeStore,
  knowledgeStore,
  createKnowledgeEntry,
  persistAgentRun,
  type KnowledgeEntryType,
  type KnowledgeDomain,
  type KnowledgeEntry,
  type KnowledgeQuery,
} from "@szl-holdings/workflow-engine";

import { logger } from "./logger";
logger.info("Knowledge store initialized");
