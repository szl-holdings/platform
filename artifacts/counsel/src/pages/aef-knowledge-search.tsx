import type { SearchHit } from '@workspace/aef-contracts';
import { useAefSearch } from '@workspace/aef-sdk/hooks';
import {
  AlertTriangle,
  BarChart3,
  ChevronDown,
  ChevronUp,
  FileText,
  Loader2,
  Route,
  Scale,
  Search,
  Shield,
} from 'lucide-react';
import { useState } from 'react';

const PROFILE_ID = 'prism_legal_matter';

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

function HitCard({ hit }: { hit: SearchHit }) {
  const [expanded, setExpanded] = useState(false);
  const rerankerScore = hit.rerankerScore ?? hit.rerankScore;
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
          {(hit.rationale ?? hit.selectedRationale) && (
            <div className="rounded bg-violet-500/5 border border-violet-500/12 p-3">
              <p className="text-[9px] font-mono text-violet-400/40 mb-1">RATIONALE</p>
              <p className="text-xs text-slate-100/70 leading-relaxed">
                {hit.rationale ?? hit.selectedRationale}
              </p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-2">
            {hit.traceId && (
              <div className="rounded bg-violet-500/5 border border-violet-500/12 p-2">
                <p className="text-[9px] font-mono text-violet-400/40 mb-1">TRACE ID</p>
                <p className="text-[9px] font-mono text-violet-300/60 truncate">{hit.traceId}</p>
              </div>
            )}
            {hit.evidenceId && (
              <div className="rounded bg-violet-500/5 border border-violet-500/12 p-2">
                <p className="text-[9px] font-mono text-violet-400/40 mb-1">EVIDENCE ID</p>
                <p className="text-[9px] font-mono text-violet-300/60 truncate">{hit.evidenceId}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AefKnowledgeSearch() {
  const [inputValue, setInputValue] = useState('');
  const { search, loading, results, error, query, configured } = useAefSearch({
    profileId: PROFILE_ID,
    topK: 8,
    rerankEnabled: true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) search(inputValue.trim());
  };

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
          <Scale className="w-4 h-4 text-violet-400" />
        </div>
        <div>
          <h1 className="text-sm font-semibold text-slate-100">AEF Legal Matter Search</h1>
          <p className="text-[10px] font-mono text-violet-400/40">
            Profile: {PROFILE_ID} · Counsel Legal Matter Command
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Shield className="w-3 h-3 text-violet-400/40" />
          <span className="text-[9px] font-mono text-violet-400/40">
            PRIVILEGED · EVIDENCE-FIRST
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-violet-400/40" />
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Search matter briefs, filing obligations, contract clauses, docket IDs…"
            className="w-full pl-9 pr-3 py-2.5 rounded bg-violet-500/5 border border-violet-500/20 text-xs text-slate-100 placeholder-violet-400/30 focus:outline-none focus:border-violet-500/50 font-mono"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !inputValue.trim()}
          className="px-4 py-2.5 rounded bg-violet-500/15 border border-violet-500/30 text-xs font-mono text-violet-300 hover:bg-violet-500/25 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          {loading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Search className="w-3.5 h-3.5" />
          )}
          Search
        </button>
      </form>

      {!configured && !error && (
        <div className="rounded-lg border border-violet-500/15 bg-violet-500/5 p-8 flex flex-col items-center gap-3 text-center">
          <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
            <Search className="w-5 h-5 text-violet-400/50" />
          </div>
          <div>
            <p className="text-sm font-semibold text-violet-200">No knowledge index available</p>
            <p className="text-[11px] text-violet-400/50 mt-1 leading-relaxed">
              The AEF knowledge index for this matter domain has not been configured yet.
              Contact your system administrator to enable matter-aware search.
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-4 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-red-200">Retrieval Error</p>
            <p className="text-[10px] text-red-400/70 mt-1 leading-relaxed font-mono">
              {error.message}
            </p>
          </div>
        </div>
      )}

      {results && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-3.5 h-3.5 text-violet-400/40" />
              <span className="text-[10px] font-mono text-violet-400/40">
                {results.hits.length} of {results.totalCandidates} candidates · query: &quot;{query}
                &quot;
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

          <div className="rounded bg-violet-500/5 border border-violet-500/10 p-3 flex items-center gap-3">
            <Route className="w-3 h-3 text-violet-400/40 shrink-0" />
            <div className="flex gap-1.5 flex-wrap">
              {results.retrievalPath.map((stage, i) => (
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
