import { cn } from '@szl-holdings/shared-ui/utils';
import {
  Award,
  ChevronRight,
  ExternalLink,
  Flame,
  Globe,
  Loader2,
  Shield,
  Star,
  TrendingUp,
  Trophy,
  Users,
  Zap,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'wouter';

const BASE = '/api';

type ArchetypeBadge = 'Black Swan' | 'Cascade' | 'Insider' | 'Regulator';

interface LeaderboardEntry {
  rank: number;
  id: string;
  handle: string;
  displayName: string;
  reputationScore: number;
  acceptedCount: number;
  submissionCount: number;
  totalImpactUsd: number;
  badges: ArchetypeBadge[];
  topScenarioTitles: string[];
}

interface MonthlyMover {
  architectId: string;
  handle: string;
  gain: number;
}

interface LeaderboardData {
  leaderboard: LeaderboardEntry[];
  monthlyMovers: MonthlyMover[];
  totalImpactUsd: number;
  totalAccepted: number;
  totalArchitects: number;
  archetypeSpecialists: Record<string, { handle: string; count: number }>;
  generatedAt: string;
}

interface SummaryData {
  totalArchitects: number;
  totalImpactUsd: number;
  totalAccepted: number;
  openEngagements: number;
  pendingSubmissions: number;
  topArchitect: string | null;
}

const BADGE_STYLE: Record<ArchetypeBadge, { bg: string; text: string; border: string }> = {
  'Black Swan': { bg: 'bg-red-500/10', text: 'text-red-300', border: 'border-red-500/30' },
  Cascade: { bg: 'bg-orange-500/10', text: 'text-orange-300', border: 'border-orange-500/30' },
  Insider: { bg: 'bg-amber-500/10', text: 'text-amber-300', border: 'border-amber-500/30' },
  Regulator: { bg: 'bg-violet-500/10', text: 'text-violet-300', border: 'border-violet-500/30' },
};

const RANK_ICON: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };

function formatUsd(v: number): string {
  if (v >= 1_000_000_000) return `$${(v / 1_000_000_000).toFixed(1)}B`;
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v}`;
}

export default function CrisisArenaLeaderboard() {
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<LeaderboardEntry | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [lbRes, sumRes] = await Promise.all([
          fetch(`${BASE}/crisis-arena/leaderboard`),
          fetch(`${BASE}/crisis-arena/summary`),
        ]);
        if (lbRes.ok) setData(await lbRes.json() as LeaderboardData);
        if (sumRes.ok) setSummary(await sumRes.json() as SummaryData);
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0606] text-red-50 overflow-x-hidden">
      <section className="relative px-6 pt-20 pb-12 text-center">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-red-500/8 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 max-w-3xl mx-auto">
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
              <Flame className="w-5 h-5 text-red-400" />
            </div>
            <span className="text-sm font-medium text-red-400/60">Sentra · Crisis Arena</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-red-50 mb-4 leading-tight">
            Public Hall of Fame
          </h1>
          <p className="text-red-200/60 max-w-xl mx-auto text-sm leading-relaxed mb-8">
            The world's top crisis architects — ranked by Business Impact Score, reputation, and
            total revenue-at-risk surfaced across client engagements.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link href="/crisis-arena/engagements">
              <button className="flex items-center gap-2 px-5 py-2.5 bg-red-500 hover:bg-red-400 text-[#0a0606] font-semibold rounded-xl transition-all text-sm">
                View Engagements <ChevronRight className="w-4 h-4" />
              </button>
            </Link>
            <Link href="/crisis-arena/architect">
              <button className="flex items-center gap-2 px-5 py-2.5 bg-red-500/10 hover:bg-red-500/15 border border-red-500/20 text-red-200 font-medium rounded-xl transition-all text-sm">
                Architect Workspace <Zap className="w-4 h-4" />
              </button>
            </Link>
          </div>
        </div>
      </section>

      {summary && (
        <section className="px-6 pb-12 max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: Globe, label: 'Total Impact Surfaced', value: formatUsd(summary.totalImpactUsd), color: 'text-red-400' },
              { icon: Trophy, label: 'Accepted Scenarios', value: summary.totalAccepted.toString(), color: 'text-amber-400' },
              { icon: Users, label: 'Crisis Architects', value: summary.totalArchitects.toString(), color: 'text-violet-400' },
              { icon: Shield, label: 'Open Engagements', value: summary.openEngagements.toString(), color: 'text-emerald-400' },
            ].map((stat) => (
              <div
                key={stat.label}
                className="bg-[#120a0a]/80 border border-red-500/10 rounded-xl p-5 text-center"
              >
                <stat.icon className={cn('w-5 h-5 mx-auto mb-2', stat.color)} />
                <div className="text-2xl font-bold text-red-50 mb-1">{stat.value}</div>
                <div className="text-[10px] font-mono uppercase tracking-wider text-red-400/50">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="px-6 pb-20 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-red-100 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" /> Global Rankings
          </h2>
          <span className="text-[10px] font-mono text-red-400/50 uppercase tracking-wider">
            Ranked by Reputation
          </span>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 text-red-400 animate-spin" />
          </div>
        )}

        {!loading && data && (
          <div className="space-y-3">
            {data.leaderboard.map((entry) => (
              <div
                key={entry.id}
                className={cn(
                  'bg-[#120a0a]/80 border rounded-xl p-5 cursor-pointer transition-all',
                  selected?.id === entry.id
                    ? 'border-red-500/40'
                    : 'border-red-500/10 hover:border-red-500/25',
                )}
                onClick={() => setSelected(selected?.id === entry.id ? null : entry)}
              >
                <div className="flex items-center gap-4">
                  <div className="text-xl w-8 text-center shrink-0">
                    {RANK_ICON[entry.rank] ?? (
                      <span className="text-sm font-mono text-red-400/50">#{entry.rank}</span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-sm font-bold text-red-100">{entry.displayName}</span>
                      <span className="text-[11px] font-mono text-red-400/50">@{entry.handle}</span>
                      {entry.badges.map((b) => (
                        <span
                          key={b}
                          className={cn(
                            'px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border',
                            BADGE_STYLE[b].bg,
                            BADGE_STYLE[b].text,
                            BADGE_STYLE[b].border,
                          )}
                        >
                          {b}
                        </span>
                      ))}
                    </div>
                    {entry.topScenarioTitles[0] && (
                      <p className="text-[11px] text-red-300/50 truncate">
                        Top: {entry.topScenarioTitles[0]}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-6 shrink-0">
                    <div className="text-center">
                      <div className="text-base font-bold text-red-300 font-mono">
                        {entry.reputationScore.toLocaleString()}
                      </div>
                      <div className="text-[9px] text-red-400/40 uppercase tracking-wider">Rep</div>
                    </div>
                    <div className="text-center hidden sm:block">
                      <div className="text-base font-bold text-amber-300 font-mono">
                        {entry.acceptedCount}
                      </div>
                      <div className="text-[9px] text-red-400/40 uppercase tracking-wider">
                        Accepted
                      </div>
                    </div>
                    <div className="text-center hidden md:block">
                      <div className="text-base font-bold text-emerald-300 font-mono">
                        {formatUsd(entry.totalImpactUsd)}
                      </div>
                      <div className="text-[9px] text-red-400/40 uppercase tracking-wider">
                        Impact
                      </div>
                    </div>
                    <Link
                      href={`/crisis-arena/architect/${entry.id}`}
                      onClick={(e: React.MouseEvent) => e.stopPropagation()}
                    >
                      <ExternalLink className="w-4 h-4 text-red-400/40 hover:text-red-400 transition-colors" />
                    </Link>
                  </div>
                </div>

                {selected?.id === entry.id && (
                  <div className="mt-4 pt-4 border-t border-red-500/10 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="text-[10px] text-red-400/50 font-mono uppercase mb-2">
                        Top Scenarios
                      </div>
                      <ul className="space-y-1.5">
                        {entry.topScenarioTitles.map((t, i) => (
                          <li key={i} className="flex items-start gap-2 text-[11px] text-red-300/70">
                            <Star className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />
                            {t}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <div className="text-[10px] text-red-400/50 font-mono uppercase mb-2">
                        Stats
                      </div>
                      <div className="space-y-1.5 text-[11px]">
                        <div className="flex justify-between">
                          <span className="text-red-400/50">Submissions</span>
                          <span className="font-mono text-red-300">{entry.submissionCount}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-red-400/50">Accepted</span>
                          <span className="font-mono text-emerald-400">{entry.acceptedCount}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-red-400/50">Hit rate</span>
                          <span className="font-mono text-red-300">
                            {entry.submissionCount > 0
                              ? Math.round((entry.acceptedCount / entry.submissionCount) * 100)
                              : 0}
                            %
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-red-400/50">Total Impact</span>
                          <span className="font-mono text-amber-400">
                            {formatUsd(entry.totalImpactUsd)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {!loading && data?.monthlyMovers && data.monthlyMovers.length > 0 && (
          <div className="mt-12">
            <h2 className="text-lg font-bold text-red-100 flex items-center gap-2 mb-6">
              <TrendingUp className="w-5 h-5 text-emerald-400" /> Monthly Movers
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {data.monthlyMovers.map((mover, i) => (
                <div
                  key={mover.architectId}
                  className="bg-[#0a0f0a]/80 border border-emerald-500/10 rounded-xl p-4"
                >
                  <div className="text-[10px] font-mono text-emerald-400/50 uppercase tracking-wider mb-2">
                    #{i + 1} this month
                  </div>
                  <div className="text-sm font-bold text-emerald-100">@{mover.handle}</div>
                  <div className="text-[11px] text-emerald-400/60 mt-1">
                    +{mover.gain.toFixed(0)} rep
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!loading && data?.archetypeSpecialists && (
          <div className="mt-12">
            <h2 className="text-lg font-bold text-red-100 flex items-center gap-2 mb-6">
              <Award className="w-5 h-5 text-violet-400" /> Archetype Specialists
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(data.archetypeSpecialists).map(([arch, spec]) => (
                <div
                  key={arch}
                  className="bg-[#120a0a]/80 border border-red-500/10 rounded-xl p-4"
                >
                  <div className="text-[10px] font-mono text-red-400/50 uppercase tracking-wider mb-2">
                    {arch.replace('_', ' ')}
                  </div>
                  <div className="text-sm font-bold text-red-100">@{spec.handle}</div>
                  <div className="text-[11px] text-red-400/40 mt-1">{spec.count} accepted</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-16 text-center">
          <div className="inline-block bg-[#120a0a]/80 border border-red-500/10 rounded-2xl px-8 py-8 max-w-xl">
            <TrendingUp className="w-8 h-8 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-red-100 mb-2">Become a Crisis Architect</h3>
            <p className="text-[12px] text-red-300/60 mb-6 leading-relaxed">
              Submit adversarial business crisis scenarios against real client engagements. Earn
              reputation from accepted scenarios and rank on the global leaderboard. Accepted
              scenarios graduate into live tabletop exercises.
            </p>
            <Link href="/crisis-arena/architect">
              <button className="flex items-center gap-2 px-6 py-3 bg-red-500 hover:bg-red-400 text-[#0a0606] font-semibold rounded-xl transition-all text-sm mx-auto">
                Open Architect Workspace <ChevronRight className="w-4 h-4" />
              </button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
