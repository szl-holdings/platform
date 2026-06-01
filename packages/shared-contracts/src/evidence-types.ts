/**
 * AEEP Evidence Type Contracts
 *
 * Shared types for evidence ledger entries, source citations,
 * confidence scoring, and proof envelopes.
 */
import type { PolicyVerdict } from './policy-types.js';

export type ConfidenceLevel = 'high' | 'medium' | 'low' | 'contradiction';
export type FreshnessLevel = 'fresh' | 'aging' | 'stale' | 'unknown';

export interface SourceCitation {
  sourceId: string;
  sourceUri?: string;
  chunkId?: string;
  title?: string;
  score?: number;
  profileVersion?: string;
  retrievalPath?: string;
  retrievedAt: string;
}

export interface ToolCallRecord {
  toolId: string;
  inputSummary?: string;
  outputSummary?: string;
  durationMs?: number;
  status: 'success' | 'error' | 'skipped';
  error?: string;
  timestamp: string;
}

export interface ProofEnvelope {
  traceId: string;
  sessionId?: string;
  workflowRunId?: string;
  stepId?: string;
  agentRole?: string;
  sources: SourceCitation[];
  toolCalls: ToolCallRecord[];
  confidence: ConfidenceLevel;
  freshness: FreshnessLevel;
  policyVerdict?: PolicyVerdict;
  policyReason?: string;
  approvalId?: string;
  generatedAt: string;
}

export interface LedgerEntry {
  entryId: string;
  traceId: string;
  entityType: string;
  entityId: string;
  action: string;
  actor?: string;
  actorRole?: string;
  envelope: ProofEnvelope;
  immutable: true;
  timestamp: string;
}

export interface ProvenanceEnvelope {
  runId: string;
  agentId: string;
  domain: string;
  model: string;
  provider: string;
  promptHash: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  costEstimateUsd: number;
  confidence: number;
  latencyMs: number;
  sources: SourceCitation[];
  toolCalls: ToolCallRecord[];
  governanceVerdict: 'allowed' | 'blocked';
  generatedAt: string;
}

export interface ProvenanceLineage {
  runId: string;
  envelope: ProvenanceEnvelope;
  parentRunIds: string[];
  consultations: ProvenanceEnvelope[];
}

export interface EvidencePackage {
  packageId: string;
  title?: string;
  summary?: string;
  entries: LedgerEntry[];
  overallConfidence: ConfidenceLevel;
  overallFreshness: FreshnessLevel;
  generatedAt: string;
  generatedBy?: string;
  workflowRunId?: string;
}
