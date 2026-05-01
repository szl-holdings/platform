/**
 * SZL Holdings Mobile — Alloy Agentic RAG context.
 *
 * Provides a React context for the mobile app to call the unified
 * Alloy Agentic RAG platform via the /alloy/agentic-rag/run API route.
 * Mobile calls the same endpoints as the web products.
 */
import React, { createContext, useCallback, useContext, useState } from 'react';
import { useAuth } from './AuthContext';

export interface AgenticRagResult {
  runId: string;
  traceId: string;
  answer: string;
  confidence: number;
  plannerMode: string;
  status: 'completed' | 'failed' | 'pending_approval';
  totalDurationMs: number;
}

export interface AgenticRagState {
  result: AgenticRagResult | null;
  loading: boolean;
  error: string | null;
}

export interface AgenticRagContextValue extends AgenticRagState {
  runQuery: (query: string, domain?: string) => Promise<AgenticRagResult | null>;
  clearResult: () => void;
}

const AgenticRagContext = createContext<AgenticRagContextValue | null>(null);

export function useAgenticRag(): AgenticRagContextValue {
  const ctx = useContext(AgenticRagContext);
  if (!ctx) {
    throw new Error('useAgenticRag must be used inside AgenticRagProvider');
  }
  return ctx;
}

export interface AgenticRagProviderProps {
  children: React.ReactNode;
  apiBaseUrl: string;
}

/**
 * Run an Agentic RAG query from the mobile app.
 * Calls the same /alloy/agentic-rag/run endpoint used by all web products.
 */
async function callAgenticRag(
  apiBaseUrl: string,
  authToken: string,
  query: string,
  domain = 'szl-holdings',
): Promise<AgenticRagResult> {
  const res = await fetch(`${apiBaseUrl}/alloy/agentic-rag/run`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify({
      query,
      context: { domain },
      policy: {
        plannerMode: 'cot-decompose',
        maxSpecialists: 2,
        topK: 8,
      },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Agentic RAG call failed: ${res.status} ${body}`);
  }

  const data = await res.json();
  return {
    runId: data.runId,
    traceId: data.traceId,
    answer: data.answer,
    confidence: data.confidence,
    plannerMode: data.plannerMode,
    status: data.status,
    totalDurationMs: data.totalDurationMs,
  };
}

export function AgenticRagProvider({ children, apiBaseUrl }: AgenticRagProviderProps): React.ReactElement {
  const { authToken } = useAuth() as { authToken: string };
  const [state, setState] = useState<AgenticRagState>({
    result: null,
    loading: false,
    error: null,
  });

  const runQuery = useCallback(
    async (query: string, domain?: string): Promise<AgenticRagResult | null> => {
      setState((s) => ({ ...s, loading: true, error: null }));
      try {
        const result = await callAgenticRag(apiBaseUrl, authToken, query, domain);
        setState({ result, loading: false, error: null });
        return result;
      } catch (err) {
        const error = err instanceof Error ? err.message : String(err);
        setState((s) => ({ ...s, loading: false, error }));
        return null;
      }
    },
    [apiBaseUrl, authToken],
  );

  const clearResult = useCallback(() => {
    setState({ result: null, loading: false, error: null });
  }, []);

  return (
    <AgenticRagContext.Provider value={{ ...state, runQuery, clearResult }}>
      {children}
    </AgenticRagContext.Provider>
  );
}
