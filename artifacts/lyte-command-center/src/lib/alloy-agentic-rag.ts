/**
 * Lyte — Alloy Agentic RAG client.
 *
 * Replaces ad-hoc decision intelligence RAG calls with the unified
 * Alloy Agentic RAG platform. One SDK, one API.
 */
import { apiFetch } from '@szl-holdings/shared-ui/api-fetch';
import type { AgenticRagRequest, AgenticRagResponse } from '@szl-holdings/alloy-client';

export interface LyteDecisionInput {
  query: string;
  decisionContext?: string;
  sessionId?: string;
  orgId?: number;
}

/**
 * Run an agentic RAG query for Lyte decision intelligence.
 * Uses CoT decomposition to break the decision query into parallel
 * evidence-gathering tasks and synthesises a decision-ready answer.
 */
export async function runLyteAgenticRag(
  input: LyteDecisionInput,
): Promise<AgenticRagResponse> {
  const fullQuery = input.decisionContext
    ? `${input.query}\n\nDecision context: ${input.decisionContext}`
    : input.query;

  const request: AgenticRagRequest = {
    query: fullQuery,
    context: {
      domain: 'lyte',
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

export async function getLyteAgenticRagTrace(runId: string): Promise<unknown> {
  return apiFetch<unknown>(`/alloy/agentic-rag/runs/${runId}/trace`);
}
