import { useCallback, useRef } from "react";
import { getDomainBaseUrl } from "../env";

export interface EmbeddingSearchResult {
  content: string;
  score: number;
  source?: string;
  domain?: string;
  metadata?: Record<string, unknown>;
}

export interface EmbeddingSearchOptions {
  apiBase?: string;
  domain?: string;
  limit?: number;
}

function getApiBase(): string {
  return getDomainBaseUrl() ?? "";
}

export function useEmbeddingSearch(options: EmbeddingSearchOptions = {}) {
  const { domain, limit = 3 } = options;
  const apiBaseRef = useRef(options.apiBase ?? getApiBase());

  const search = useCallback(
    async (query: string): Promise<EmbeddingSearchResult[]> => {
      if (!query.trim()) return [];
      try {
        const params = new URLSearchParams({ q: query, limit: String(limit) });
        if (domain) params.set("domains", domain);
        const res = await fetch(
          `${apiBaseRef.current}/api/rag/search?${params.toString()}`,
          { headers: { Accept: "application/json" } },
        );
        if (!res.ok) return [];
        const json = (await res.json()) as
          | { results?: EmbeddingSearchResult[]; data?: EmbeddingSearchResult[] }
          | EmbeddingSearchResult[];
        if (Array.isArray(json)) return json.slice(0, limit);
        return (json.results ?? json.data ?? []).slice(0, limit);
      } catch {
        return [];
      }
    },
    [domain, limit],
  );

  const buildContextString = useCallback(
    (results: EmbeddingSearchResult[]): string => {
      if (results.length === 0) return "";
      const lines = results.map(
        (r, i) =>
          `[${i + 1}] ${r.source ? `(${r.source}) ` : ""}${r.content}`,
      );
      return `Relevant context:\n${lines.join("\n")}`;
    },
    [],
  );

  return { search, buildContextString };
}
