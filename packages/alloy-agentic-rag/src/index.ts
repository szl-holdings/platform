/**
 * @szl/alloy-agentic-rag
 *
 * Unified Agentic RAG platform layer. One entry point, one SDK.
 *
 * Usage:
 *   import { runAgenticRag } from '@szl/alloy-agentic-rag';
 *   const result = await runAgenticRag({ query: 'What is our threat posture?' });
 */
export { runAggregator, listSpecialists } from './aggregator.js';
export { buildPlan, buildPlanAsync } from './planner-modes.js';
export { mergeEvidence } from './evidence-merger.js';
export { createMemoryContext, readMemory, writeMemory } from './memory-tiers.js';
export {
  createSpecialist,
  DEFAULT_SPECIALISTS,
  SPECIALIST_REGISTRY,
} from './specialists/registry.js';
export { LocalDataMCP, localDataMCP } from './mcp-classes/local-data-mcp.js';
export { SearchEngineMCP, searchEngineMCP } from './mcp-classes/search-engine-mcp.js';
export { CloudEngineMCP, cloudEngineMCP } from './mcp-classes/cloud-engine-mcp.js';

export type { AggregatorResult } from './aggregator.js';
export type { PlannerInput, PlannerOutput } from './planner-modes.js';
export type { SpecialistOutput, MergeOptions } from './evidence-merger.js';
export type { AgenticMemoryContext, MemoryTierConfig } from './memory-tiers.js';
export type { SpecialistAgent, SpecialistQuery } from './specialists/registry.js';
export type { MCPServer, MCPCapabilityDescriptor, MCPQueryInput, MCPQueryResult, MCPChunk } from './mcp-classes/types.js';

/**
 * Primary public API — run the full Agentic RAG loop.
 */
import type { AgenticRagRequest } from '@szl-holdings/contracts/agentic-rag';
import type { AggregatorResult } from './aggregator.js';
import { runAggregator } from './aggregator.js';

export async function runAgenticRag(
  request: AgenticRagRequest,
  callerUserId?: string,
): Promise<AggregatorResult> {
  return runAggregator(request, callerUserId);
}

export const ALLOY_AGENTIC_RAG_VERSION = '1.0.0' as const;
