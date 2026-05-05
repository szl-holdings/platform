import { apiFetch } from '@szl-holdings/shared-ui/api-fetch';
import {
  AlertTriangle,
  BarChart3,
  BookOpen,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  FileText,
  Globe,
  Loader2,
  Route,
  Scale,
  Search,
  Shield,
} from 'lucide-react';
import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';

interface KnowledgeHit {
  chunkId: string;
  sourceId: string;
  title?: string;
  sourceUri?: string;
  text: string;
  finalScore: number;
  denseScore?: number;
  keywordScore?: number;
  fusedScore?: number;
  rerankScore?: number;
  boostApplied?: boolean;
  rationale?: string;
}

interface FeedHit {
  sourceId: string;
  source: string;
  title: string;
  summary?: string;
  text: string;
  url?: string;
  publishedAt?: string;
  jurisdiction?: string;
  tags?: string[];
  keywordScore: number;
  finalScore: number;
  corpus: string;
}

interface QueryResult {
  hits: KnowledgeHit[];
  feedHits?: FeedHit[];
  totalCandidates: number;
  feedCandidates?: number;
  processingMs?: number;
  retrievalPath: string[];
  matterId: string;
  query: string;
}

interface Matter {
  id: string;
  name: string;
  status: string;
}

interface MattersResponse {
  matters: Matter[];
}

const FEED_SOURCE_LABELS: Record<string, string> = {
  courtlistener: 'CourtListener',
  edgar: 'SEC EDGAR',
  federal_register: 'Federal Register',
  uspto_peds: 'USPTO PEDS',
  state_ag: 'State Regulators',
};

function FeedHitCard({ hit }: { hit: FeedHit }) {
  const sourceLabel = FEED_SOURCE_LABELS[hit.source] ?? hit.source;
  const pct = Math.round(hit.finalScore * 100);
  const dateStr = hit.publishedAt ? new Date(hit.publishedAt).toLocaleDateString() : null;
  return (
    <div className="rounded-lg border border-cyan-500/15 bg-slate-950/60 p-4">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded flex items-center justify-center shrink-0 mt-0.5 bg-cyan-500/8 border border-cyan-500/20">
          <Globe className="w-3.5 h-3.5 text-cyan-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-100 truncate">{hit.title}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20 text-cyan-400/70">
                  {sourceLabel}
                </span>
                {hit.jurisdiction && (
                  <span className="text-[9px] font-mono text-cyan-400/40">{hit.jurisdiction}</span>
                )}
                {dateStr && (
                  <span className="text-[9px] font-mono text-violet-400/30">{dateStr}</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border text-cyan-400 bg-cyan-500/8 border-cyan-500/20">
                {pct}%
              </span>
              {hit.url && (
                <a href={hit.url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                  <ExternalLink className="w-3 h-3 text-cyan-400/40 hover:text-cyan-400/70" />
                </a>
              )}
            </div>
          </div>
          <p className="text-xs text-slate-300/60 mt-2 leading-snug line-clamp-2">{hit.text}</p>
          {hit.tags && hit.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {hit.tags.slice(0, 4).map((tag) => (
                <span key={tag} className="text-[9px] font-mono px-1 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-400/60">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ScoreBar({ label, value, color }: { label: string; value?: number; color: string }) {
  if (value === undefined) return null;
  const pct = Math.round(value * 100);
  return (
    <div className="flex items-center gap-2">
      <span className="text-[9px] font-mono text-violet-400/40 w-20 shrink-0">{label}</span>
      <div className="flex-1 h-1 bg-violet-500/10 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[9px] font-mono text-violet-400/60 w-8 text-right">{pct}%</span>
    </div>
  );
}

function HitCard({ hit }: { hit: KnowledgeHit }) {
  const [expanded, setExpanded] = useState(false);
  const rerankerScore = hit.rerankScore;
  const pathway =
    rerankerScore !== undefined
      ? 'dense+keyword → fusion → rerank'
      : hit.keywordScore !== undefined
        ? 'dense+keyword → fusion'
        : 'dense';

  return (
    <div className="rounded-lg border border-violet-500/15 bg-slate-950/60">
      <div
        className="flex items-start gap-3 p-4 cursor-pointer hover:bg-violet-500/5 transition-colors"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="w-8 h-8 rounded flex items-center justify-center shrink-0 mt-0.5 bg-violet-500/8 border border-violet-500/20">
          <FileText className="w-3.5 h-3.5 text-violet-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-100 truncate">
                {hit.title ?? hit.sourceId}
              </p>
              <p className="text-[10px] font-mono text-violet-400/40 mt-0.5 truncate">
                {hit.sourceUri ?? hit.chunkId}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border text-emerald-400 bg-emerald-500/8 border-emerald-500/20">
                {Math.round(hit.finalScore * 100)}%
              </span>
              {expanded ? (
                <ChevronUp className="w-3.5 h-3.5 text-violet-400/40" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-violet-400/40" />
              )}
            </div>
          </div>
          <p className="text-xs text-slate-300/60 mt-2 leading-snug line-clamp-2">{hit.text}</p>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className="text-[9px] font-mono text-violet-400/40">
              chunk: <span className="text-violet-300/70">{hit.chunkId}</span>
            </span>
            <span className="text-[9px] font-mono text-violet-400/40">
              source: <span className="text-violet-300/70">{hit.sourceId}</span>
            </span>
            <span className="text-[9px] font-mono text-violet-400/30 flex items-center gap-1">
              <Route className="w-2.5 h-2.5" />
              {pathway}
            </span>
            {hit.boostApplied && (
              <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-violet-500/10 border border-violet-500/20 text-violet-400/60">
                BOOST
              </span>
            )}
          </div>
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 border-t border-violet-500/10 pt-3 space-y-3">
          <div className="rounded bg-violet-500/5 border border-violet-500/12 p-3">
            <p className="text-[9px] font-mono text-violet-400/40 mb-2">EVIDENCE BREAKDOWN</p>
            <div className="space-y-1.5">
              <ScoreBar label="Dense" value={hit.denseScore} color="bg-sky-500/60" />
              <ScoreBar label="Keyword" value={hit.keywordScore} color="bg-purple-500/60" />
              <ScoreBar label="Fused" value={hit.fusedScore} color="bg-violet-500/60" />
              <ScoreBar label="Reranker" value={rerankerScore} color="bg-emerald-500/60" />
              <ScoreBar label="Final" value={hit.finalScore} color="bg-emerald-400/80" />
            </div>
          </div>
          {hit.rationale && (
            <div className="rounded bg-violet-500/5 border border-violet-500/12 p-3">
              <p className="text-[9px] font-mono text-violet-400/40 mb-1">RATIONALE</p>
              <p className="text-xs text-slate-100/70 leading-relaxed">{hit.rationale}</p>
            </div>
          )}
          <div className="rounded bg-violet-500/5 border border-violet-500/12 p-2">
            <p className="text-[9px] font-mono text-violet-400/40 mb-1">CHUNK ID</p>
            <p className="text-[9px] font-mono text-violet-300/60 truncate">{hit.chunkId}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function useMatterSearch() {
  const [query, setQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [matterId, setMatterId] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<QueryResult | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const search = useCallback(async (q: string, mid: string) => {
    if (!mid) return;
    setLoading(true);
    setError(null);
    setSubmittedQuery(q);
    try {
      const result = await apiFetch<{ data: QueryResult }>(
        `/counsel-knowledge/${encodeURIComponent(mid)}/query`,
        {
          method: 'POST',
          body: JSON.stringify({ query: q, topK: 8, rerankEnabled: true }),
          skipAuth: true,
        },
      );
      setResults(result.data ?? (result as unknown as QueryResult));
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
      setResults(null);
    } finally {
      setLoading(false);
    }
  }, []);

  return { query, setQuery, submittedQuery, matterId, setMatterId, loading, results, error, search };
}

export default function AefKnowledgeSearch() {
  const { query, setQuery, submittedQuery, matterId, setMatterId, loading, results, error, search } =
    useMatterSearch();

  const { data: mattersData } = useQuery<{ matters: Matter[] }>({
    queryKey: ['counsel-matters-list'],
    queryFn: () => apiFetch<MattersResponse>('/counsel/matters', { skipAuth: true }),
    staleTime: 60_000,
  });

  const matters = mattersData?.matters ?? [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() && matterId) search(query.trim(), matterId);
  };

  const retrievalPath = results?.retrievalPath ?? ['bm25-index', 'score-fusion', 'rerank'];

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
          <Scale className="w-4 h-4 text-violet-400" />
        </div>
        <div>
          <h1 className="text-sm font-semibold text-slate-100">Knowledge Search</h1>
          <p className="text-[10px] font-mono text-violet-400/40">
            RAG · BM25 + dense retrieval · Counsel Legal Matter Command
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Shield className="w-3 h-3 text-violet-400/40" />
          <span className="text-[9px] font-mono text-violet-400/40">PRIVILEGED · EVIDENCE-FIRST</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-2">
        <div className="flex gap-2">
          <div className="w-48 shrink-0">
            <select
              value={matterId}
              onChange={(e) => setMatterId(e.target.value)}
              className="w-full px-3 py-2.5 rounded bg-violet-500/5 border border-violet-500/20 text-xs text-slate-100 focus:outline-none focus:border-violet-500/50 font-mono"
            >
              <option value="">Select matter…</option>
              {matters.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.id}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-violet-400/40" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search matter briefs, filing obligations, contract clauses, docket IDs…"
              className="w-full pl-9 pr-3 py-2.5 rounded bg-violet-500/5 border border-violet-500/20 text-xs text-slate-100 placeholder-violet-400/30 focus:outline-none focus:border-violet-500/50 font-mono"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !query.trim() || !matterId}
            className="px-4 py-2.5 rounded bg-violet-500/15 border border-violet-500/30 text-xs font-mono text-violet-300 hover:bg-violet-500/25 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
            Search
          </button>
        </div>
      </form>

      {!matterId && !results && (
        <div className="rounded-lg border border-violet-500/15 bg-violet-500/5 p-8 flex flex-col items-center gap-3 text-center">
          <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-violet-400/50" />
          </div>
          <div>
            <p className="text-sm font-semibold text-violet-200">Select a matter to search</p>
            <p className="text-[11px] text-violet-400/50 mt-1 leading-relaxed">
              Choose a matter from the dropdown, then enter a query to search its indexed knowledge — briefs, filings, obligations, and contract clauses.
            </p>
          </div>
        </div>
      )}

      {matterId && !results && !loading && !error && (
        <div className="rounded-lg border border-violet-500/15 bg-violet-500/5 p-6 flex flex-col items-center gap-2 text-center">
          <Search className="w-5 h-5 text-violet-400/30" />
          <p className="text-xs text-violet-400/50 font-mono">Enter a query to search matter {matterId}</p>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-4 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-red-200">Retrieval Error</p>
            <p className="text-[10px] text-red-400/70 mt-1 leading-relaxed font-mono">{error.message}</p>
          </div>
        </div>
      )}

      {results && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-3.5 h-3.5 text-violet-400/40" />
              <span className="text-[10px] font-mono text-violet-400/40">
                {results.hits.length} of {results.totalCandidates} candidates · query: &quot;{submittedQuery}&quot;
              </span>
            </div>
            {results.processingMs !== undefined && (
              <span className="text-[9px] font-mono text-violet-400/30">
                {results.processingMs.toFixed(0)}ms
              </span>
            )}
          </div>

          {results.hits.length === 0 ? (
            <div className="rounded-lg border border-violet-500/10 p-8 text-center">
              <p className="text-xs text-violet-400/40 font-mono">
                No legal documents matched the query above the score threshold.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {results.hits.map((hit) => (
                <HitCard key={hit.chunkId} hit={hit} />
              ))}
            </div>
          )}

          {results.feedHits && results.feedHits.length > 0 && (
            <div className="space-y-2 mt-4">
              <div className="flex items-center gap-2">
                <Globe className="w-3 h-3 text-cyan-400/50" />
                <span className="text-[10px] font-mono text-cyan-400/50 uppercase tracking-wider">
                  Live Legal Feeds — {results.feedHits.length} of {results.feedCandidates ?? 0} feed candidates
                </span>
              </div>
              <div className="space-y-2">
                {results.feedHits.map((hit) => (
                  <FeedHitCard key={hit.sourceId} hit={hit} />
                ))}
              </div>
            </div>
          )}

          <div className="rounded bg-violet-500/5 border border-violet-500/10 p-3 flex items-center gap-3">
            <Route className="w-3 h-3 text-violet-400/40 shrink-0" />
            <div className="flex gap-1.5 flex-wrap">
              {retrievalPath.map((stage, i) => (
                <span
                  key={i}
                  className="text-[9px] font-mono text-violet-400/40 after:content-['→'] after:mx-1 after:text-violet-400/20 last:after:content-['']"
                >
                  {stage}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
