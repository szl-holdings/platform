/**
 * Vessels — Alloy Agentic RAG client.
 *
 * Replaces ad-hoc maritime intelligence RAG calls with the unified
 * Alloy Agentic RAG platform. One SDK, one API.
 */
import { apiFetch } from '@szl-holdings/shared-ui/api-fetch';
import type { AgenticRagRequest, AgenticRagResponse } from '@szl-holdings/alloy-client';

export interface VesselIntelInput {
  query: string;
  vesselId?: string;
  voyageId?: string;
  fleetId?: string;
  sessionId?: string;
}

/**
 * Run an agentic RAG query for Vessels maritime intelligence.
 *
 * Fans out to:
 *   - Knowledge Agent: vessel registry, voyage history, cargo manifests (LocalDataMCP)
 *   - Web Research Agent: maritime news, port advisories, weather alerts (SearchEngineMCP)
 *   - Cloud Ops Agent: AIS position data via S3, satellite imagery (CloudEngineMCP)
 *
 * Uses ReAct mode for iterative investigation of complex maritime scenarios.
 */
export async function runVesselsAgenticRag(
  input: VesselIntelInput,
): Promise<AgenticRagResponse> {
  const contextParts = [input.query];
  if (input.vesselId) contextParts.push(`Vessel: ${input.vesselId}`);
  if (input.voyageId) contextParts.push(`Voyage: ${input.voyageId}`);
  if (input.fleetId) contextParts.push(`Fleet: ${input.fleetId}`);

  const request: AgenticRagRequest = {
    query: contextParts.join('\n'),
    context: {
      domain: 'vessels',
      sessionId: input.sessionId,
      metadata: {
        vesselId: input.vesselId,
        voyageId: input.voyageId,
        fleetId: input.fleetId,
      },
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

export async function getVesselsAgenticRagTrace(runId: string): Promise<unknown> {
  return apiFetch<unknown>(`/alloy/agentic-rag/runs/${runId}/trace`);
}
