import {
  AlertTriangle,
  BookOpen,
  Bot,
  ChevronDown,
  ChevronUp,
  Database,
  ExternalLink,
  FileText,
  Search,
  Shield,
  User,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { type EvidenceItem, evidenceItems } from '@/data/seed';

const TYPE_CONFIG: Record<
  string,
  { label: string; icon: React.ReactNode; color: string; bg: string; border: string }
> = {
  system: {
    label: 'System',
    icon: <Database className="w-3.5 h-3.5" />,
    color: 'text-sky-400',
    bg: 'bg-sky-500/8',
    border: 'border-sky-500/20',
  },
  human: {
    label: 'Human',
    icon: <User className="w-3.5 h-3.5" />,
    color: 'text-purple-400',
    bg: 'bg-purple-500/8',
    border: 'border-purple-500/20',
  },
  continuum: {
    label: 'Counsel / AI',
    icon: <Bot className="w-3.5 h-3.5" />,
    color: 'text-amber-400',
    bg: 'bg-amber-500/8',
    border: 'border-amber-500/20',
  },
  signal: {
    label: 'Signal',
    icon: <AlertTriangle className="w-3.5 h-3.5" />,
    color: 'text-orange-400',
    bg: 'bg-orange-500/8',
    border: 'border-orange-500/20',
  },
  document: {
    label: 'Document',
    icon: <FileText className="w-3.5 h-3.5" />,
    color: 'text-[#c9a85c]',
    bg: 'bg-[#c9b787]/8',
    border: 'border-[#c9b787]/15',
  },
  audit_log: {
    label: 'Audit Log',
    icon: <BookOpen className="w-3.5 h-3.5" />,
    color: 'text-red-400',
    bg: 'bg-red-500/8',
    border: 'border-red-500/20',
  },
  external: {
    label: 'External',
    icon: <ExternalLink className="w-3.5 h-3.5" />,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/8',
    border: 'border-emerald-500/20',
  },
};

const FRESHNESS_COLORS: Record<string, string> = {
  live: 'text-emerald-400',
  recent: 'text-amber-400',
  stale: 'text-orange-400',
  expired: 'text-red-400',
};

function EvidenceCard({ ev }: { ev: EvidenceItem }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = (TYPE_CONFIG[ev.type] ?? TYPE_CONFIG.system)!;

  return (
    <div className={`cockpit-panel border ${cfg.border}`}>
      <div
        className="flex items-start gap-3 p-4 cursor-pointer hover:bg-amber-500/3 transition-colors"
        onClick={() => setExpanded((v) => !v)}
      >
        <div
          className={`w-8 h-8 rounded flex items-center justify-center shrink-0 mt-0.5 ${cfg.bg} border ${cfg.border}`}
        >
          <span className={cfg.color}>{cfg.icon}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs font-semibold text-amber-100">{ev.label}</p>
              <p className="text-[10px] font-mono text-amber-400/40 mt-0.5">{ev.source}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span
                className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${cfg.color} ${cfg.bg} ${cfg.border}`}
              >
                {cfg.label.toUpperCase()}
              </span>
              {expanded ? (
                <ChevronUp className="w-3.5 h-3.5 text-amber-400/40" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-amber-400/40" />
              )}
            </div>
          </div>
          <div className="flex items-center gap-3 mt-1">
            <span className={`text-[10px] font-mono ${FRESHNESS_COLORS[ev.freshness]}`}>
              {ev.freshness.toUpperCase()}
            </span>
            <span className="text-[10px] font-mono text-amber-400/30">
              {Math.round(ev.confidence * 100)}% confidence
            </span>
            {ev.chainRef && (
              <span className="proof-badge text-[9px]">
                <Shield className="w-2 h-2" />
                {ev.chainRef}
              </span>
            )}
          </div>
          {/* Value preview */}
          <div className="mt-2 px-2.5 py-1.5 rounded bg-amber-500/5 border border-amber-500/10">
            <p className="text-xs text-amber-300/80 font-mono leading-snug truncate">{ev.value}</p>
          </div>
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 border-t border-amber-500/10 pt-3 space-y-3">
          {/* Detail */}
          <div className="rounded bg-amber-500/4 border border-amber-500/12 p-3">
            <p className="text-[9px] font-mono text-amber-400/40 mb-1">FULL DETAIL</p>
            <p className="text-xs text-amber-100/70 leading-relaxed">{ev.detail}</p>
          </div>

          {/* Links */}
          <div className="grid grid-cols-2 gap-3">
            {ev.linkedEntityLabel && (
              <div className="rounded bg-amber-500/4 border border-amber-500/12 p-2.5">
                <p className="text-[9px] font-mono text-amber-400/40 mb-1">LINKED ENTITY</p>
                <p className="text-xs text-amber-100/80">{ev.linkedEntityLabel}</p>
                {ev.linkedEntityType && (
                  <p className="text-[9px] font-mono text-amber-400/30">{ev.linkedEntityType}</p>
                )}
              </div>
            )}
            {ev.linkedRecommendationId && (
              <div className="rounded bg-amber-500/4 border border-amber-500/12 p-2.5">
                <p className="text-[9px] font-mono text-amber-400/40 mb-1">
                  SUPPORTS RECOMMENDATION
                </p>
                <p className="text-xs text-amber-100/80 font-mono">{ev.linkedRecommendationId}</p>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between text-[10px]">
            <span className="text-amber-400/40 font-mono">
              Captured:{' '}
              {new Date(ev.capturedAt).toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
            <span className="proof-badge">
              <Shield className="w-2 h-2" />
              {ev.proofRef}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function EvidenceExplorerPage() {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  const filtered = useMemo(() => {
    return evidenceItems.filter((ev) => {
      if (filterType !== 'all' && ev.type !== filterType) return false;
      if (
        search &&
        !ev.label.toLowerCase().includes(search.toLowerCase()) &&
        !ev.value.toLowerCase().includes(search.toLowerCase())
      )
        return false;
      return true;
    });
  }, [search, filterType]);

  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    evidenceItems.forEach((ev) => {
      counts[ev.type] = (counts[ev.type] ?? 0) + 1;
    });
    return counts;
  }, []);

  const totalConfidence = Math.round(
    (evidenceItems.reduce((sum, ev) => sum + ev.confidence, 0) / evidenceItems.length) * 100,
  );

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-amber-100 font-display">Evidence Explorer</h1>
          <p className="text-xs text-amber-400/50 mt-0.5">
            Full evidence chain for all signals, recommendations, and decisions —{' '}
            {evidenceItems.length} evidence items
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="cockpit-panel px-3 py-1.5 text-center">
            <p className="text-[9px] font-mono text-amber-400/40">Avg Confidence</p>
            <p className="text-sm font-mono font-bold text-emerald-400">{totalConfidence}%</p>
          </div>
        </div>
      </div>

      {/* Type filter pills */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilterType('all')}
          className={`px-3 py-1.5 rounded border text-[10px] font-mono transition-all ${filterType === 'all' ? 'text-amber-300 bg-amber-500/10 border-amber-500/30' : 'text-amber-400/50 border-amber-500/15 hover:border-amber-500/30 hover:text-amber-300'}`}
        >
          ALL ({evidenceItems.length})
        </button>
        {Object.entries(TYPE_CONFIG).map(([k, v]) => {
          const count = typeCounts[k] ?? 0;
          if (count === 0) return null;
          const active = filterType === k;
          return (
            <button
              key={k}
              onClick={() => setFilterType(k)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded border text-[10px] font-mono transition-all ${active ? `${v.color} ${v.bg} ${v.border}` : 'text-amber-400/50 border-amber-500/15 hover:border-amber-500/30 hover:text-amber-300'}`}
            >
              {v.icon}
              {v.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-amber-400/30" />
        <input
          type="text"
          placeholder="Search evidence..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 bg-amber-500/5 border border-amber-500/15 rounded-md text-xs text-amber-100 placeholder-amber-400/30 focus:outline-none focus:border-amber-500/40"
        />
      </div>

      {/* Evidence list */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="cockpit-panel p-8 text-center">
            <p className="text-sm text-amber-400/40">No evidence items match your filters.</p>
          </div>
        )}
        {filtered.map((ev) => (
          <EvidenceCard key={ev.id} ev={ev} />
        ))}
      </div>
    </div>
  );
}
