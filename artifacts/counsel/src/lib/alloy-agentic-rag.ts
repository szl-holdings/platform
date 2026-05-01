/**
 * Counsel — Alloy Agentic RAG client.
 *
 * Replaces ad-hoc legal research RAG calls with the unified
 * Alloy Agentic RAG platform. One SDK, one API.
 */
import { apiFetch } from '@szl-holdings/shared-ui/api-fetch';
import type { AgenticRagRequest, AgenticRagResponse } from '@szl-holdings/alloy-client';

export interface CounselLegalResearchInput {
  query: string;
  matterType?: string;
  sessionId?: string;
}

/**
 * Run an agentic RAG query for Counsel legal matter research.
 * Fans out to Knowledge Agent (case law, contracts), Web Research Agent
 * (regulatory updates), and Cloud Ops Agent (document storage).
 */
export async function runCounselAgenticRag(
  input: CounselLegalResearchInput,
): Promise<AgenticRagResponse> {
  const request: AgenticRagRequest = {
    query: input.query,
    context: {
      domain: 'counsel',
      sessionId: input.sessionId,
      metadata: { matterType: input.matterType },
    },
    policy: {
      plannerMode: 'react',
      maxSpecialists: 3,
      topK: 12,
      enabledMcpClasses: ['local-data', 'search-engine', 'cloud-engine'],
    },
  };

  return apiFetch<AgenticRagResponse>('/alloy/agentic-rag/run', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

export async function getCounselAgenticRagTrace(runId: string): Promise<unknown> {
  return apiFetch<unknown>(`/alloy/agentic-rag/runs/${runId}/trace`);
}
