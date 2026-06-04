import { cn } from '@szl-holdings/shared-ui/utils';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  BarChart2,
  BookmarkPlus,
  Brain,
  Building2,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  FileText,
  Filter,
  Flame,
  Loader2,
  MapPin,
  RefreshCw,
  Search,
  Shield,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { useState } from 'react';
import { useLocation } from 'wouter';
import { api } from '@/lib/api';
import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from '@szl-holdings/shared-ui/ui/sonner';

type SignalType = 'permit' | 'ownership_change' | 'lien' | 'distress' | 'vacancy';

interface PropertySignal {
  type: SignalType;
  source: string;
  description: string;
  date: string;
  weight: number;
}

interface SourcingCandidate {
  id: string;
  address: string;
  city: string;
  type: string;
  estimatedValue: number;
  sqft: number;
  ownershipYears: number;
  motivationScore: number;
  opportunityScore: number;
  signals: PropertySignal[];
  signalCount: number;
  aiSummary: string;
  savedToPortfolio: boolean;
}

interface SourcingResponse {
  candidates: SourcingCandidate[];
  totalScanned: number;
  adapters: { name: string; signalTypes: SignalType[] }[];
  dataMode: string;
  generatedAt: string;
}

const SIGNAL_META: Record<
  SignalType,
  { label: string; icon: React.ElementType; color: string; bg: string; border: string }
> = {
  permit: {
    label: 'Permit',
    icon: FileText,
    color: 'text-sky-400',
    bg: 'bg-sky-500/8',
    border: 'border-sky-500/15',
  },
  ownership_change: {
    label: 'Ownership Change',
    icon: Building2,
    color: 'text-violet-400',
    bg: 'bg-violet-500/8',
    border: 'border-violet-500/15',
  },
  lien: {
    label: 'Tax Lien',
    icon: AlertTriangle,
    color: 'text-amber-400',
    bg: 'bg-amber-500/8',
    border: 'border-amber-500/15',
  },
  distress: {
    label: 'Distress',
    icon: TrendingDown,
    color: 'text-red-400',
    bg: 'bg-red-500/8',
    border: 'border-red-500/15',
  },
  vacancy: {
    label: 'Vacancy',
    icon: Flame,
    color: 'text-orange-400',
    bg: 'bg-orange-500/8',
    border: 'border-orange-500/15',
  },
};

function fmt(n: number) {
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n}`;
}

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 70
      ? 'text-red-400 border-red-500/20 bg-red-500/8'
      : score >= 45
        ? 'text-amber-400 border-amber-500/20 bg-amber-500/8'
        : 'text-sky-400 border-sky-500/20 bg-sky-500/8';
  const label = score >= 70 ? 'High' : score >= 45 ? 'Medium' : 'Low';
  return (
    <div className={cn('flex flex-col items-center px-3 py-1.5 rounded-xl border', color)}>
      <span className="text-lg font-black leading-none">{score}</span>
      <span className="text-[8px] uppercase tracking-wider mt-0.5 opacity-70">{label}</span>
    </div>
  );
}

function SignalPill({ signal }: { signal: PropertySignal }) {
  const meta = SIGNAL_META[signal.type];
  const Icon = meta.icon;
  return (
    <div
      className={cn(
        'flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[10px] font-medium',
        meta.bg,
        meta.border,
        meta.color,
      )}
    >
      <Icon className="w-3 h-3 flex-shrink-0" />
      <span>{meta.label}</span>
    </div>
  );
}

function CandidateCard({
  candidate,
  onSave,
  saving,
  saved,
}: {
  candidate: SourcingCandidate;
  onSave: (c: SourcingCandidate) => void;
  saving: boolean;
  saved: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [, navigate] = useLocation();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-white/6 bg-[#0c0e12] overflow-hidden"
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          <ScoreBadge score={candidate.opportunityScore} />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-white">{candidate.address}</p>
                <p className="text-xs text-white/40 mt-0.5">
                  <MapPin className="w-3 h-3 inline mr-1 -mt-0.5" />
                  {candidate.city} · {candidate.type}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => navigate(`/climate-risk-enhanced/${candidate.id}`)}
                  className="p-1.5 rounded-lg hover:bg-white/5 text-white/30 hover:text-orange-400 transition-colors"
                  title="View climate risk"
                >
                  <Shield className="w-3.5 h-3.5" />
                </button>
                {saved ? (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Saved
                  </div>
                ) : (
                  <button
                    onClick={() => onSave(candidate)}
                    disabled={saving}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/4 hover:bg-white/8 border border-white/10 hover:border-white/20 text-white/70 hover:text-white text-xs font-medium transition-all disabled:opacity-50"
                  >
                    {saving ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <BookmarkPlus className="w-3.5 h-3.5" />
                    )}
                    Save to Portfolio
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4 mt-2">
              <span className="text-[10px] text-white/30">
                Est. Value:{' '}
                <span className="text-white/60 font-medium">
                  {fmt(candidate.estimatedValue)}
                </span>
              </span>
              <span className="text-[10px] text-white/30">
                Sqft:{' '}
                <span className="text-white/60 font-medium">
                  {candidate.sqft.toLocaleString()}
                </span>
              </span>
              <span className="text-[10px] text-white/30">
                Ownership:{' '}
                <span className="text-white/60 font-medium">
                  {candidate.ownershipYears}yr
                </span>
              </span>
              <span className="text-[10px] text-white/30">
                Motivation:{' '}
                <span
                  className={
                    candidate.motivationScore >= 70 ? 'text-red-400 font-medium' : 'text-white/60 font-medium'
                  }
                >
                  {candidate.motivationScore}/100
                </span>
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5 mt-2.5">
              {candidate.signals.map((sig, i) => (
                <SignalPill key={i} signal={sig} />
              ))}
            </div>
          </div>
        </div>

        <div className="mt-3 flex items-start gap-2">
          <Brain className="w-3.5 h-3.5 text-violet-400 flex-shrink-0 mt-0.5" />
          <p className="text-[11px] text-white/50 leading-relaxed">{candidate.aiSummary}</p>
        </div>

        <button
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center gap-1 mt-2.5 text-[10px] text-white/30 hover:text-white/50 transition-colors"
        >
          {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          {expanded ? 'Hide' : 'Show'} signal detail
        </button>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 border-t border-white/5 pt-3 space-y-2">
              {candidate.signals.map((sig, i) => {
                const meta = SIGNAL_META[sig.type];
                const Icon = meta.icon;
                return (
                  <div
                    key={i}
                    className="flex items-start gap-3 p-2.5 rounded-lg bg-white/2 border border-white/5"
                  >
                    <Icon className={cn('w-3.5 h-3.5 flex-shrink-0 mt-0.5', meta.color)} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className={cn('text-[10px] font-semibold', meta.color)}>
                          {meta.label}
                        </span>
                        <span className="text-[9px] text-white/20">{sig.date}</span>
                      </div>
                      <p className="text-[10px] text-white/50 mt-0.5">{sig.description}</p>
                      <p className="text-[9px] text-white/20 mt-0.5">
                        Source: {sig.source} · Weight: {sig.weight}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

const SIGNAL_FILTER_OPTIONS: { label: string; value: SignalType | 'all' }[] = [
  { label: 'All Signals', value: 'all' },
  { label: 'Permit', value: 'permit' },
  { label: 'Ownership', value: 'ownership_change' },
  { label: 'Lien', value: 'lien' },
  { label: 'Distress', value: 'distress' },
  { label: 'Vacancy', value: 'vacancy' },
];

export default function SourcingInbox() {
  const [signalFilter, setSignalFilter] = useState<SignalType | 'all'>('all');
  const [search, setSearch] = useState('');
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [savingId, setSavingId] = useState<string | null>(null);

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['terra-sourcing-candidates'],
    queryFn: () => api.sourcing.candidates(),
    staleTime: 300_000,
  });

  const saveMutation = useMutation({
    mutationFn: (candidate: SourcingCandidate) => api.sourcing.saveToPortfolio(candidate),
    onSuccess: (_result, candidate) => {
      setSavedIds((prev) => new Set([...prev, candidate.id]));
      setSavingId(null);
      toast.success(`${candidate.address} saved to portfolio`, {
        description: 'Deal created and sourcing alert published to alert bus.',
      });
    },
    onError: (_err, candidate) => {
      setSavingId(null);
      toast.error(`Failed to save ${candidate.address}`);
    },
  });

  const handleSave = (candidate: SourcingCandidate) => {
    setSavingId(candidate.id);
    saveMutation.mutate(candidate);
  };

  const candidates = data?.candidates ?? [];

  const filtered = candidates.filter((c) => {
    const matchesFilter =
      signalFilter === 'all' || c.signals.some((s) => s.type === signalFilter);
    const matchesSearch =
      !search ||
      c.address.toLowerCase().includes(search.toLowerCase()) ||
      c.city.toLowerCase().includes(search.toLowerCase()) ||
      c.type.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const highConviction = filtered.filter((c) => c.opportunityScore >= 70);
  const moderate = filtered.filter((c) => c.opportunityScore >= 45 && c.opportunityScore < 70);
  const early = filtered.filter((c) => c.opportunityScore < 45);

  return (
    <div className="min-h-screen" style={{ background: '#08090e' }}>
      {/* Header */}
      <div
        className="sticky top-0 z-10 px-6 py-4 border-b border-white/5"
        style={{ background: 'rgba(8,9,14,0.95)', backdropFilter: 'blur(12px)' }}
      >
        <div className="flex items-start justify-between gap-4 max-w-7xl mx-auto">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <Sparkles className="w-4 h-4 text-violet-400" />
              <h1 className="text-base font-bold text-white">AI Deal Sourcing</h1>
              <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 uppercase tracking-wider">
                Off-Market
              </span>
            </div>
            <p className="text-xs text-white/40">
              Signal mining from public filings, permitting, ownership changes, distress &amp;
              vacancy — ranked by conviction score
            </p>
          </div>
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/4 hover:bg-white/8 border border-white/8 text-white/50 hover:text-white/80 text-xs transition-all"
          >
            <RefreshCw className={cn('w-3.5 h-3.5', isFetching && 'animate-spin')} />
            Refresh
          </button>
        </div>

        {/* Stats strip */}
        {data && (
          <div className="flex items-center gap-6 mt-3 max-w-7xl mx-auto">
            {[
              {
                label: 'Properties Scanned',
                value: data.totalScanned,
                icon: Search,
                color: 'text-white/60',
              },
              {
                label: 'Candidates Surfaced',
                value: candidates.length,
                icon: Zap,
                color: 'text-violet-400',
              },
              {
                label: 'High Conviction',
                value: candidates.filter((c) => c.opportunityScore >= 70).length,
                icon: TrendingUp,
                color: 'text-red-400',
              },
              {
                label: 'Signal Adapters',
                value: data.adapters.length,
                icon: Activity,
                color: 'text-sky-400',
              },
              {
                label: 'Saved to Portfolio',
                value: savedIds.size,
                icon: BadgeCheck,
                color: 'text-emerald-400',
              },
            ].map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="flex items-center gap-1.5">
                  <Icon className={cn('w-3.5 h-3.5', stat.color)} />
                  <span className={cn('text-sm font-bold', stat.color)}>{stat.value}</span>
                  <span className="text-[10px] text-white/25">{stat.label}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="max-w-7xl mx-auto px-6 py-5">
        {/* Adapter status strip */}
        {data?.adapters && (
          <div className="flex flex-wrap gap-2 mb-5">
            {data.adapters.map((adapter) => (
              <div
                key={adapter.name}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/2 border border-white/6 text-[10px] text-white/40"
              >
                <BadgeCheck className="w-3 h-3 text-emerald-400" />
                {adapter.name}
              </div>
            ))}
          </div>
        )}

        {/* Filters */}
        <div className="flex items-center gap-3 mb-5">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/25" />
            <input
              type="text"
              placeholder="Search address or market…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-white/4 border border-white/8 text-sm text-white/80 placeholder:text-white/20 outline-none focus:border-white/20"
            />
          </div>
          <div className="flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-white/30 mr-1" />
            {SIGNAL_FILTER_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setSignalFilter(opt.value)}
                className={cn(
                  'px-2.5 py-1 rounded-lg text-[10px] font-medium border transition-all',
                  signalFilter === opt.value
                    ? 'bg-violet-500/15 border-violet-500/30 text-violet-300'
                    : 'bg-white/2 border-white/6 text-white/40 hover:text-white/60',
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center gap-3 p-8 rounded-xl bg-white/2 border border-white/5">
            <Loader2 className="w-5 h-5 animate-spin text-violet-400" />
            <div>
              <p className="text-sm text-white/60">Running signal adapters…</p>
              <p className="text-xs text-white/25 mt-0.5">
                Scanning permits, deed records, lien filings, distress signals, vacancy data
              </p>
            </div>
          </div>
        )}

        {/* Error */}
        {isError && (
          <div className="p-6 rounded-xl bg-red-500/5 border border-red-500/15">
            <p className="text-sm text-red-400">Unable to load sourcing candidates.</p>
          </div>
        )}

        {/* Results */}
        {!isLoading && !isError && (
          <div className="space-y-6">
            {/* High conviction */}
            {highConviction.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-4 h-4 text-red-400" />
                  <h2 className="text-xs font-semibold text-white/70 uppercase tracking-wider">
                    High Conviction
                  </h2>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-500/10 border border-red-500/15 text-red-400">
                    Score ≥70
                  </span>
                  <span className="text-[10px] text-white/25 ml-1">{highConviction.length} candidates</span>
                </div>
                <div className="space-y-3">
                  {highConviction.map((c) => (
                    <CandidateCard
                      key={c.id}
                      candidate={c}
                      onSave={handleSave}
                      saving={savingId === c.id}
                      saved={savedIds.has(c.id)}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Moderate */}
            {moderate.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <BarChart2 className="w-4 h-4 text-amber-400" />
                  <h2 className="text-xs font-semibold text-white/70 uppercase tracking-wider">
                    Moderate Confidence
                  </h2>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/15 text-amber-400">
                    Score 45–69
                  </span>
                  <span className="text-[10px] text-white/25 ml-1">{moderate.length} candidates</span>
                </div>
                <div className="space-y-3">
                  {moderate.map((c) => (
                    <CandidateCard
                      key={c.id}
                      candidate={c}
                      onSave={handleSave}
                      saving={savingId === c.id}
                      saved={savedIds.has(c.id)}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Early stage */}
            {early.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <Activity className="w-4 h-4 text-sky-400" />
                  <h2 className="text-xs font-semibold text-white/70 uppercase tracking-wider">
                    Early Signal
                  </h2>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-sky-500/10 border border-sky-500/15 text-sky-400">
                    Score &lt;45
                  </span>
                  <span className="text-[10px] text-white/25 ml-1">{early.length} candidates</span>
                </div>
                <div className="space-y-3">
                  {early.map((c) => (
                    <CandidateCard
                      key={c.id}
                      candidate={c}
                      onSave={handleSave}
                      saving={savingId === c.id}
                      saved={savedIds.has(c.id)}
                    />
                  ))}
                </div>
              </section>
            )}

            {filtered.length === 0 && !isLoading && (
              <div className="p-8 rounded-xl bg-white/2 border border-white/5 text-center">
                <Search className="w-8 h-8 text-white/15 mx-auto mb-3" />
                <p className="text-sm text-white/40">No candidates match your current filters.</p>
              </div>
            )}
          </div>
        )}

        {/* Adapter info footer */}
        <div className="mt-8 p-4 rounded-xl bg-white/2 border border-white/5">
          <div className="flex items-start gap-3">
            <Brain className="w-4 h-4 text-violet-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-white/60 mb-1">
                Pluggable Signal Adapter Architecture
              </p>
              <p className="text-[10px] text-white/30 leading-relaxed">
                Signals are sourced via a modular adapter interface. Current adapters: Municipal
                Permit Feed, County Deed / Ownership Transfer, Tax Lien / UCC Recorder, Distress
                &amp; NOD Monitor, Occupancy / Vacancy Monitor. Additional adapters (CoStar,
                ATTOM, EDGAR) can be plugged in when data licenses are available. Ranking engine
                weights: Distress 0.32 · Lien 0.28 · Ownership 0.22 · Vacancy 0.20 · Permit 0.18
                · Diversity bonus per additional signal type.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
