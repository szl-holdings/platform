export {
  AgentEventBus,
  agentEventBus,
  type AgentEventType,
  type AgentEvent,
} from "@workspace/workflow-engine";

import { logger } from "./logger";
logger.info("Agent event bus initialized");
