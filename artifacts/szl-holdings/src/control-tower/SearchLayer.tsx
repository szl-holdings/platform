import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { API_BASE, DOMAIN_COLORS } from "./constants";
import { TimeAgo } from "./components";

export function SearchLayer() {
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [domainFilter, setDomainFilter] = useState<string[]>([]);

  const { data: searchData, isLoading } = useQuery<{ data: Record<string, unknown> }>({
    queryKey: ["ct-search", submittedQuery, domainFilter],
    queryFn: () => {
      const params = new URLSearchParams({ q: submittedQuery, limit: "30" });
      if (domainFilter.length > 0) params.set("domains", domainFilter.join(","));
      return fetch(`${API_BASE}/control-tower/search?${params}`).then(r => r.json());
    },
    enabled: !!submittedQuery,
  });

  const results = ((searchData?.data as Record<string, unknown>)?.results as unknown[]) ?? [];
  const domainsSearched = ((searchData?.data as Record<string, unknown>)?.domainsSearched as unknown[]) ?? [];
  const latency = (searchData?.data as Record<string, unknown>)?.searchLatencyMs as number | undefined;
  const DOMAINS = ["aegis", "vessels", "terra", "lyte", "prism", "alloy"];

  return (
    <div className="space-y-4">
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Search className="w-4 h-4 text-rose-400" />
          <span className="text-sm font-semibold text-foreground">Federated Enterprise Search</span>
          <span className="text-[10px] text-muted-foreground ml-auto">Queries signals, decisions, and artifacts across all domains</span>
        </div>
        <div className="flex items-center gap-2">
          <input
            className="flex-1 text-sm bg-muted/20 border border-border rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/40"
            placeholder="Search across all domains — threats, vessels, properties, incidents, decisions…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === "Enter" && setSubmittedQuery(query)}
          />
          <button
            onClick={() => setSubmittedQuery(query)}
            disabled={!query || isLoading}
            className="flex items-center gap-1.5 px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            <Search className="w-3.5 h-3.5" />
            {isLoading ? "Searching…" : "Search"}
          </button>
        </div>
        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
          <span className="text-[10px] text-muted-foreground">Filter domains:</span>
          {DOMAINS.map(d => (
            <button
              key={d}
              className={cn(
                "text-[9px] px-2 py-0.5 rounded-full border transition-colors",
                domainFilter.includes(d)
                  ? cn(DOMAIN_COLORS[d], "border-current bg-current/10")
                  : "text-muted-foreground border-border/40 hover:border-muted-foreground"
              )}
              onClick={() => setDomainFilter(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d])}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {submittedQuery && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{results.length} results</span>
            {latency !== undefined && <span>in {latency}ms</span>}
            {domainsSearched.map((d: unknown) => {
              const ds = d as Record<string, unknown>;
              return (
                <span key={String(ds.domain)} className={cn("font-mono", DOMAIN_COLORS[String(ds.domain)] ?? "text-muted-foreground")}>
                  {String(ds.domain)}: {String(ds.resultCount)}
                </span>
              );
            })}
          </div>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-14 bg-muted/20 rounded animate-pulse" />)}
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-12 bg-card border border-border rounded-xl">
              <Search className="w-10 h-10 text-muted-foreground/20 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No results found for "{submittedQuery}"</p>
            </div>
          ) : (
            <div className="space-y-2">
              {results.map((r: unknown, i) => {
                const result = r as Record<string, unknown>;
                return (
                  <div key={String(result.id ?? i)} className="bg-card border border-border rounded-xl p-3">
                    <div className="flex items-start gap-2">
                      <span className={cn("text-[9px] font-mono px-1.5 py-0.5 rounded border shrink-0 mt-0.5", DOMAIN_COLORS[String(result.domain)] ?? "text-muted-foreground")}>
                        {String(result.domain)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold text-foreground truncate">{String(result.title)}</span>
                          <span className="text-[9px] font-mono text-muted-foreground/50 ml-auto shrink-0">
                            {(Number(result.relevance) * 100).toFixed(0)}% relevance
                          </span>
                        </div>
                        <p className="text-[10px] text-muted-foreground line-clamp-2">{String(result.summary)}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-[9px] text-muted-foreground/60 font-mono">{String(result.type)}</span>
                          <TimeAgo ts={result.timestamp as string} />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {!submittedQuery && (
        <div className="text-center py-16 bg-card border border-border rounded-xl">
          <Search className="w-12 h-12 text-muted-foreground/20 mx-auto mb-3" />
          <p className="text-sm font-medium text-foreground mb-1">Search the entire intelligence fabric</p>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            Query signals, decisions, audit trail, and artifacts from Aegis, Vessels, Terra, Lyte, PRISM, and Alloy simultaneously
          </p>
        </div>
      )}
    </div>
  );
}
