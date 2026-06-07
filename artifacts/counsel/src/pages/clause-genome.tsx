import { apiFetch } from '@szl-holdings/shared-ui/api-fetch';
import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  BookOpen,
  ChevronRight,
  FileText,
  Filter,
  Scale,
  Search,
  Shield,
  Tag,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { Link, useSearch } from 'wouter';

const ACCENT = '#8b5cf6';

interface TaxonomyEntry {
  id: string;
  label: string;
  types: string[];
  description: string;
  clauseCount: number;
}

interface Clause {
  id: string;
  clauseType: string;
  category: string;
  title: string;
  text: string;
  matterId: string;
  matterName: string;
  documentRef: string;
  jurisdiction: string;
  riskScore: number;
  riskTags: string[];
  taxonomyTags: string[];
  provenanceEnvelope: Record<string, unknown>;
  confidenceBand: { lower: number; point: number; upper: number; label: string };
}

interface TaxonomyResponse {
  taxonomy: TaxonomyEntry[];
  total: number;
}

interface ClausesResponse {
  clauses: Clause[];
  total: number;
}

function riskColor(score: number) {
  if (score >= 0.7) return 'text-red-400';
  if (score >= 0.5) return 'text-amber-400';
  return 'text-emerald-400';
}

function riskBadgeBg(score: number) {
  if (score >= 0.7) return 'bg-red-500/10 border-red-500/25 text-red-400';
  if (score >= 0.5) return 'bg-amber-500/10 border-amber-500/25 text-amber-400';
  return 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400';
}

function riskLabel(score: number) {
  if (score >= 0.7) return 'High Risk';
  if (score >= 0.5) return 'Moderate';
  return 'Low Risk';
}

function ConfidenceBar({ band }: { band: Clause['confidenceBand'] }) {
  const pct = Math.round(band.point * 100);
  const color = band.label === 'High' ? '#10b981' : band.label === 'Moderate' ? '#f59e0b' : '#ef4444';
  return (
    <div className="flex items-center gap-2 mt-1">
      <div className="flex-1 h-1 rounded-full bg-white/5 overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-[9px] font-mono tabular-nums" style={{ color }}>{pct}%</span>
    </div>
  );
}

function ClauseCard({
  clause,
  selected,
  onSelect,
}: {
  clause: Clause;
  selected: boolean;
  onSelect: (c: Clause) => void;
}) {
  return (
    <button
      onClick={() => onSelect(clause)}
      className={`w-full text-left rounded-xl p-4 border transition-all ${
        selected
          ? 'border-violet-500/40 bg-violet-500/8'
          : 'border-white/6 bg-white/2 hover:border-white/12'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${riskBadgeBg(clause.riskScore)}`}
            >
              {riskLabel(clause.riskScore)}
            </span>
            <span className="text-[10px] font-mono text-violet-400/40 truncate">{clause.documentRef}</span>
          </div>
          <p className="text-[13px] font-medium text-white/85 leading-snug mb-1 truncate">{clause.title}</p>
          <p className="text-[11px] text-white/35 truncate">{clause.matterName} · {clause.jurisdiction}</p>
        </div>
        <div className="shrink-0 text-right">
          <div className={`text-[15px] font-mono font-bold ${riskColor(clause.riskScore)}`}>
            {Math.round(clause.riskScore * 100)}
          </div>
          <div className="text-[8px] text-white/25 uppercase tracking-wider">risk</div>
        </div>
      </div>
      <div className="flex flex-wrap gap-1 mt-2.5">
        {clause.taxonomyTags.slice(0, 4).map((tag) => (
          <span
            key={tag}
            className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-violet-500/15 text-violet-400/50 bg-violet-500/4"
          >
            {tag}
          </span>
        ))}
      </div>
    </button>
  );
}

function ClauseDetail({ clause, onClose }: { clause: Clause; onClose: () => void }) {
  return (
    <div
      className="rounded-2xl border p-5 space-y-4"
      style={{ background: 'rgba(20,12,40,0.85)', border: '1px solid rgba(139,92,246,0.15)' }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${riskBadgeBg(clause.riskScore)}`}>
              {riskLabel(clause.riskScore)}
            </span>
            <span className="text-[10px] font-mono text-violet-400/40">{clause.category}</span>
          </div>
          <h3 className="text-[14px] font-semibold text-white/90 leading-snug">{clause.title}</h3>
        </div>
        <button onClick={onClose} className="p-1 rounded hover:bg-white/5 text-white/25 shrink-0">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="rounded-lg p-3 bg-white/3 border border-white/5 space-y-1">
        <div className="text-[9px] uppercase tracking-widest text-violet-400/40 mb-2">Provenance</div>
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-white/35">Matter</span>
          <Link href="/matters" className="text-[10px] font-mono text-violet-400 hover:underline flex items-center gap-0.5">
            {clause.matterName} <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-white/35">Document</span>
          <span className="text-[10px] font-mono text-white/50">{clause.documentRef}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-white/35">Jurisdiction</span>
          <span className="text-[10px] font-mono text-white/50">{clause.jurisdiction}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-white/35">Confidence</span>
          <span className="text-[10px] font-mono" style={{ color: ACCENT }}>
            {clause.confidenceBand.label} ({Math.round(clause.confidenceBand.point * 100)}%)
          </span>
        </div>
        <ConfidenceBar band={clause.confidenceBand} />
      </div>

      <div>
        <div className="text-[9px] uppercase tracking-widest text-violet-400/40 mb-2">Clause Text</div>
        <div
          className="text-[11px] text-white/60 leading-relaxed rounded-lg p-3 border font-mono whitespace-pre-wrap"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
        >
          {clause.text}
        </div>
      </div>

      <div>
        <div className="text-[9px] uppercase tracking-widest text-violet-400/40 mb-2">Risk Tags</div>
        <div className="flex flex-wrap gap-1">
          {clause.riskTags.map((tag) => (
            <span
              key={tag}
              className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-amber-500/20 text-amber-400/70 bg-amber-500/5"
            >
              <AlertTriangle className="w-2.5 h-2.5 inline mr-0.5" />
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        <Link href="/drafting-agent">
          <button
            className="flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-[11px] font-medium transition-all"
            style={{ background: `${ACCENT}18`, border: `1px solid ${ACCENT}35`, color: ACCENT }}
          >
            <FileText className="w-3 h-3" />
            Draft Similar Clause
          </button>
        </Link>
        <Link href="/risk-diff">
          <button
            className="flex items-center justify-center gap-1.5 rounded-lg py-2 px-3 text-[11px] font-medium transition-all border border-white/8 text-white/40 hover:border-white/15"
          >
            <Shield className="w-3 h-3" />
            Risk Diff
          </button>
        </Link>
      </div>
    </div>
  );
}

export default function ClauseGenomePage() {
  const searchStr = useSearch();
  const urlParams = new URLSearchParams(searchStr);
  const matterIdFromUrl = urlParams.get('matterId') ?? null;

  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedClause, setSelectedClause] = useState<Clause | null>(null);
  const [search, setSearch] = useState('');

  const { data: taxData, isLoading: taxLoading } = useQuery<TaxonomyResponse>({
    queryKey: ['counsel-taxonomy'],
    queryFn: () => apiFetch<TaxonomyResponse>('/counsel/clauses/taxonomy'),
  });

  const { data: clauseData, isLoading: clauseLoading } = useQuery<ClausesResponse>({
    queryKey: ['counsel-clauses', selectedType, matterIdFromUrl],
    queryFn: () => {
      const params = new URLSearchParams();
      if (selectedType) params.set('clauseType', selectedType);
      if (matterIdFromUrl) params.set('matterId', matterIdFromUrl);
      return apiFetch<ClausesResponse>(`/counsel/clauses/clauses?${params}`);
    },
  });

  const clauses = clauseData?.clauses ?? [];
  const taxonomy = taxData?.taxonomy ?? [];
  const filtered = search
    ? clauses.filter(
        (c) =>
          c.title.toLowerCase().includes(search.toLowerCase()) ||
          c.matterName.toLowerCase().includes(search.toLowerCase()) ||
          c.text.toLowerCase().includes(search.toLowerCase()),
      )
    : clauses;

  return (
    <div className="h-full flex flex-col" style={{ background: '#0a0614' }}>
      <div
        className="px-6 py-4 border-b flex items-center justify-between gap-4"
        style={{ borderColor: 'rgba(139,92,246,0.1)' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: `${ACCENT}12`, border: `1px solid ${ACCENT}20` }}
          >
            <BookOpen className="w-4 h-4 text-violet-400" />
          </div>
          <div>
            <h1 className="text-[15px] font-semibold text-white/90">Clause Genome</h1>
            <p className="text-[10px] text-violet-400/40 font-mono uppercase tracking-wider">
              {clauses.length} clauses · {taxonomy.length} types
              {matterIdFromUrl && (
                <span className="ml-2 px-1.5 py-0.5 rounded bg-violet-500/15 text-violet-400/70 normal-case tracking-normal">
                  Filtered: {clauses[0]?.matterName ?? matterIdFromUrl}
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/drafting-agent">
            <button
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-medium transition-all"
              style={{ background: `${ACCENT}18`, border: `1px solid ${ACCENT}35`, color: ACCENT }}
            >
              <FileText className="w-3 h-3" />
              Draft Clause
            </button>
          </Link>
          <Link href="/risk-diff">
            <button className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-medium border border-white/8 text-white/40 hover:border-white/15 transition-all">
              <Shield className="w-3 h-3" />
              Risk Diff
            </button>
          </Link>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div
          className="w-52 shrink-0 border-r overflow-y-auto p-3 space-y-1"
          style={{ borderColor: 'rgba(139,92,246,0.08)' }}
        >
          <div className="text-[9px] uppercase tracking-widest text-violet-400/35 px-2 pb-1">Taxonomy</div>
          <button
            onClick={() => setSelectedType(null)}
            className={`w-full text-left px-2.5 py-2 rounded-lg text-[11px] transition-all flex items-center justify-between ${
              selectedType === null ? 'bg-violet-500/12 text-violet-300' : 'text-white/40 hover:bg-white/3'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Scale className="w-3 h-3" />
              All Clauses
            </span>
            <span className="text-[9px] font-mono text-white/25">{clauses.length}</span>
          </button>
          {taxLoading ? (
            <div className="text-[10px] text-white/20 px-2 py-3">Loading…</div>
          ) : (
            taxonomy.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedType(t.id === selectedType ? null : t.id)}
                className={`w-full text-left px-2.5 py-2 rounded-lg text-[11px] transition-all flex items-center justify-between ${
                  selectedType === t.id ? 'bg-violet-500/12 text-violet-300' : 'text-white/40 hover:bg-white/3'
                }`}
              >
                <span className="truncate">{t.label}</span>
                <span className="text-[9px] font-mono text-white/25">{t.clauseCount}</span>
              </button>
            ))
          )}
        </div>

        <div className="flex flex-1 overflow-hidden">
          <div
            className={`flex flex-col overflow-hidden transition-all ${selectedClause ? 'w-96' : 'flex-1'}`}
          >
            <div className="px-4 py-3 border-b" style={{ borderColor: 'rgba(139,92,246,0.06)' }}>
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search clauses, matters, text…"
                  className="w-full bg-white/3 border border-white/6 rounded-lg pl-8 pr-3 py-2 text-[12px] text-white/70 placeholder:text-white/20 focus:outline-none focus:border-violet-500/30"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
              {clauseLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="w-5 h-5 border-2 border-violet-500/30 border-t-violet-400 rounded-full animate-spin" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 gap-2">
                  <BookOpen className="w-6 h-6 text-white/15" />
                  <p className="text-[11px] text-white/25">No clauses found</p>
                </div>
              ) : (
                filtered.map((c) => (
                  <ClauseCard
                    key={c.id}
                    clause={c}
                    selected={selectedClause?.id === c.id}
                    onSelect={setSelectedClause}
                  />
                ))
              )}
            </div>
          </div>

          {selectedClause && (
            <div
              className="flex-1 overflow-y-auto p-4 border-l"
              style={{ borderColor: 'rgba(139,92,246,0.08)' }}
            >
              <ClauseDetail clause={selectedClause} onClose={() => setSelectedClause(null)} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
