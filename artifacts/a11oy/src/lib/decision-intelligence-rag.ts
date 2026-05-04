/**
 * A11oy Decision Intelligence -- Agentic RAG client.
 *
 * Consolidated from former Lyte Decision Intelligence into A11oy.
 * Uses the unified Alloy Agentic RAG platform. One SDK, one API.
 */
import { apiFetch } from '@szl-holdings/shared-ui/api-fetch';
import type { AgenticRagRequest, AgenticRagResponse } from '@szl-holdings/alloy-client';

export interface DecisionIntelligenceInput {
  query: string;
  decisionContext?: string;
  sessionId?: string;
  orgId?: number;
}

export async function runDecisionIntelligenceRag(
  input: DecisionIntelligenceInput,
): Promise<AgenticRagResponse> {
  const fullQuery = input.decisionContext
    ? `${input.query}\n\nDecision context: ${input.decisionContext}`
    : input.query;

  const request: AgenticRagRequest = {
    query: fullQuery,
    context: {
      domain: 'a11oy',
      sessionId: input.sessionId,
      orgId: input.orgId,
    },
    policy: {
      plannerMode: 'cot-decompose',
      maxSpecialists: 3,
      topK: 10,
      enabledMcpClasses: ['local-data', 'search-engine'],
    },
  };

  return apiFetch<AgenticRagResponse>('/alloy/agentic-rag/run', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

export async function getDecisionIntelligenceRagTrace(runId: string): Promise<unknown> {
  return apiFetch<unknown>(`/alloy/agentic-rag/runs/${runId}/trace`);
}
