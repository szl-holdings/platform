/**
 * Alloy Agentic RAG — re-exported from @szl/alloy-agentic-rag.
 *
 * All products should import from this module rather than directly from
 * @szl/alloy-agentic-rag so the SDK surface is centrally governed.
 */
export {
  runAgenticRag,
  runAggregator,
  buildPlan,
  mergeEvidence,
  createMemoryContext,
  readMemory,
  writeMemory,
  createSpecialist,
  DEFAULT_SPECIALISTS,
  SPECIALIST_REGISTRY,
  localDataMCP,
  searchEngineMCP,
  cloudEngineMCP,
  ALLOY_AGENTIC_RAG_VERSION,
} from '@szl/alloy-agentic-rag';

export type {
  AggregatorResult,
  PlannerInput,
  PlannerOutput,
  SpecialistOutput,
  MergeOptions,
  AgenticMemoryContext,
  MemoryTierConfig,
  SpecialistAgent,
  SpecialistQuery,
  MCPServer,
  MCPCapabilityDescriptor,
  MCPQueryInput,
  MCPQueryResult,
  MCPChunk,
} from '@szl/alloy-agentic-rag';

export type {
  AgenticRagRequest,
  AgenticRagResponse,
  AgenticPlanGraph,
  EvidenceBundle,
  EvidenceChunk,
  AggregatorTrace,
  PlannerMode,
  MCPClass,
  MemoryTier,
  GenerationRecord,
} from '@szl-holdings/contracts/agentic-rag';
