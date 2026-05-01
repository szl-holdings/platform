/**
 * Terra — Alloy Agentic RAG client.
 *
 * Replaces ad-hoc real estate intelligence RAG calls with the unified
 * Alloy Agentic RAG platform. One SDK, one API.
 */
import { apiFetch } from '@szl-holdings/shared-ui/api-fetch';
import type { AgenticRagRequest, AgenticRagResponse } from '@szl-holdings/alloy-client';

export interface TerraPropertyIntelInput {
  query: string;
  propertyId?: string;
  market?: string;
  sessionId?: string;
}

/**
 * Run an agentic RAG query for Terra real estate intelligence.
 * Fans out to the Knowledge Agent (internal property data, comps),
 * Web Research Agent (market news, regulatory changes), and Cloud Ops
 * Agent (satellite/imagery data via S3).
 */
export async function runTerraAgenticRag(
  input: TerraPropertyIntelInput,
): Promise<AgenticRagResponse> {
  const contextQuery = [
    input.query,
    input.propertyId ? `Property ID: ${input.propertyId}` : null,
    input.market ? `Market: ${input.market}` : null,
  ]
    .filter(Boolean)
    .join('\n');

  const request: AgenticRagRequest = {
    query: contextQuery,
    context: {
      domain: 'terra',
      sessionId: input.sessionId,
      metadata: { propertyId: input.propertyId, market: input.market },
    },
    policy: {
      plannerMode: 'cot-decompose',
      maxSpecialists: 3,
      topK: 10,
      enabledMcpClasses: ['local-data', 'search-engine', 'cloud-engine'],
    },
  };

  return apiFetch<AgenticRagResponse>('/alloy/agentic-rag/run', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

export async function getTerraAgenticRagTrace(runId: string): Promise<unknown> {
  return apiFetch<unknown>(`/alloy/agentic-rag/runs/${runId}/trace`);
}
