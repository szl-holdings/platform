import { cn } from '@szl-holdings/shared-ui/utils';
import {
  Award,
  ChevronLeft,
  Flame,
  Loader2,
  Shield,
  Star,
  Trophy,
  Zap,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'wouter';

const BASE = '/api';

type ThreatArchetype =
  | 'ransomware'
  | 'insider'
  | 'supply_chain'
  | 'regulatory'
  | 'cascade'
  | 'black_swan';
type ArchetypeBadge = 'Black Swan' | 'Cascade' | 'Insider' | 'Regulator';

interface ArchetypeStat {
  archetype: ThreatArchetype;
  badge: ArchetypeBadge;
  count: number;
  totalScore: number;
}

interface HighlightEntry {
  title: string;
  archetype: ThreatArchetype;
  businessImpactScore: number;
  blastRadius: string[];
  acceptedAt: string;
}

interface PublicArchitectProfile {
  id: string;
  handle: string;
  displayName: string;
  bio: string;
  reputationScore: number;
  acceptedCount: number;
  submissionCount: number;
  totalImpactUsd: number;
  badges: ArchetypeBadge[];
  archetypeStats: ArchetypeStat[];
  joinedAt: string;
  highlights: HighlightEntry[];
}

const BADGE_STYLE: Record<ArchetypeBadge, { bg: string; text: string; border: string }> = {
  'Black Swan': { bg: 'bg-red-500/10', text: 'text-red-300', border: 'border-red-500/30' },
  Cascade: { bg: 'bg-orange-500/10', text: 'text-orange-300', border: 'border-orange-500/30' },
  Insider: { bg: 'bg-amber-500/10', text: 'text-amber-300', border: 'border-amber-500/30' },
  Regulator: { bg: 'bg-violet-500/10', text: 'text-violet-300', border: 'border-violet-500/30' },
};

const ARCHETYPE_COLORS: Record<ThreatArchetype, string> = {
  ransomware: 'text-red-300',
  cascade: 'text-orange-300',
  supply_chain: 'text-amber-300',
  regulatory: 'text-violet-300',
  insider: 'text-rose-300',
  black_swan: 'text-red-400',
};

function formatUsd(v: number): string {
  if (v >= 1_000_000_000) return `$${(v / 1_000_000_000).toFixed(1)}B`;
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v}`;
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
}

export default function CrisisArenaArchitectProfile() {
  const params = useParams<{ id: string }>();
  const id = params.id ?? '';
  const [profile, setProfile] = useState<PublicArchitectProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    async function load() {
      setLoading(true);
      const res = await fetch(`${BASE}/crisis-arena/architects/${id}/public`);
      if (res.status === 404) {
        setNotFound(true);
      } else if (res.ok) {
        setProfile((await res.json()) as PublicArchitectProfile);
      }
      setLoading(false);
    }
    void load();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[60vh]">
        <Loader2 className="w-6 h-6 text-red-400 animate-spin" />
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[60vh] gap-4">
        <Shield className="w-10 h-10 text-red-400/30" />
        <p className="text-red-400/50 text-sm">Architect profile not found or is private.</p>
        <Link href="/crisis-arena/leaderboard">
          <button className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/20 text-red-300 rounded-xl text-xs hover:bg-red-500/15 transition-colors">
            <ChevronLeft className="w-3.5 h-3.5" /> Back to Leaderboard
          </button>
        </Link>
      </div>
    );
  }

  const hitRate =
    profile.submissionCount > 0
      ? Math.round((profile.acceptedCount / profile.submissionCount) * 100)
      : 0;

  return (
    <div className="space-y-8 animate-fade-in p-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-2">
        <Link href="/crisis-arena/leaderboard">
          <button className="flex items-center gap-1.5 text-[11px] text-red-400/50 hover:text-red-400 transition-colors">
            <ChevronLeft className="w-3.5 h-3.5" /> Hall of Fame
          </button>
        </Link>
        <span className="text-red-400/20">·</span>
        <span className="text-[11px] text-red-400/40">Architect Profile</span>
      </div>

      <div className="bg-[#0f0808]/80 border border-red-500/15 rounded-2xl p-7">
        <div className="flex items-start gap-6 flex-wrap">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
            <Flame className="w-7 h-7 text-red-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <h1 className="text-2xl font-bold text-red-50">{profile.displayName}</h1>
              <span className="text-sm font-mono text-red-400/40">@{profile.handle}</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap mb-3">
              {profile.badges.map((b) => (
                <span
                  key={b}
                  className={cn(
                    'px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border',
                    BADGE_STYLE[b].bg,
                    BADGE_STYLE[b].text,
                    BADGE_STYLE[b].border,
                  )}
                >
                  {b}
                </span>
              ))}
            </div>
            {profile.bio && (
              <p className="text-sm text-red-300/60 leading-relaxed max-w-lg">{profile.bio}</p>
            )}
            <p className="text-[10px] text-red-400/30 font-mono mt-2">
              Architect since {new Date(profile.joinedAt).toLocaleDateString()}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <div className="text-3xl font-bold text-red-300 font-mono">
              {profile.reputationScore.toLocaleString()}
            </div>
            <div className="text-[10px] text-red-400/40 uppercase tracking-wider">
              Reputation Score
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Accepted', value: profile.acceptedCount.toString(), icon: Trophy, color: 'text-emerald-400' },
          { label: 'Submissions', value: profile.submissionCount.toString(), icon: Zap, color: 'text-red-400' },
          { label: 'Hit Rate', value: `${hitRate}%`, icon: Star, color: 'text-amber-400' },
          { label: 'Total Impact', value: formatUsd(profile.totalImpactUsd), icon: Shield, color: 'text-violet-400' },
        ].map((stat) => (
          <div key={stat.label} className="bg-[#0f0808]/80 border border-red-500/10 rounded-xl p-4 text-center">
            <stat.icon className={cn('w-4 h-4 mx-auto mb-2', stat.color)} />
            <div className="text-xl font-bold text-red-50 font-mono">{stat.value}</div>
            <div className="text-[9px] text-red-400/40 uppercase tracking-wider">{stat.label}</div>
          </div>
        ))}
      </div>

      {profile.archetypeStats.length > 0 && (
        <div>
          <h2 className="text-[10px] text-red-400/50 font-mono uppercase tracking-wider mb-4 flex items-center gap-2">
            <Award className="w-3.5 h-3.5" /> Archetype Specialisations
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {profile.archetypeStats.map((stat) => (
              <div key={stat.archetype} className="bg-[#0f0808]/80 border border-red-500/10 rounded-xl p-4">
                <div className={cn('text-[10px] font-mono uppercase tracking-wider mb-2', ARCHETYPE_COLORS[stat.archetype])}>
                  {stat.archetype.replace('_', ' ')}
                </div>
                <div className="text-base font-bold text-red-50">{stat.count} accepted</div>
                <div className="text-[10px] text-red-400/30 mt-1">
                  Avg BIS: {stat.count > 0 ? Math.round(stat.totalScore / stat.count) : 0}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {profile.highlights.length > 0 && (
        <div>
          <h2 className="text-[10px] text-red-400/50 font-mono uppercase tracking-wider mb-4 flex items-center gap-2">
            <Star className="w-3.5 h-3.5 text-amber-400" /> Top Accepted Scenarios
          </h2>
          <div className="space-y-3">
            {profile.highlights.map((h, i) => (
              <div key={i} className="bg-[#0f0808]/80 border border-red-500/10 rounded-xl p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <span className={cn('text-[9px] font-mono uppercase tracking-wider', ARCHETYPE_COLORS[h.archetype])}>
                        {h.archetype.replace('_', ' ')}
                      </span>
                      <span className="text-[9px] text-red-400/30">{relativeTime(h.acceptedAt)}</span>
                    </div>
                    <div className="text-sm font-bold text-red-100 mb-1">{h.title}</div>
                    <div className="text-[10px] text-red-400/40 font-mono">
                      Blast radius: {h.blastRadius.join(', ')}
                    </div>
                  </div>
                  <div className="text-center shrink-0">
                    <div
                      className={cn(
                        'text-xl font-bold font-mono',
                        h.businessImpactScore >= 80
                          ? 'text-red-400'
                          : h.businessImpactScore >= 60
                            ? 'text-amber-400'
                            : 'text-slate-400',
                      )}
                    >
                      {h.businessImpactScore}
                    </div>
                    <div className="text-[8px] text-red-400/30 uppercase">BIS</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-center pt-4">
        <Link href="/crisis-arena/leaderboard">
          <button className="flex items-center gap-2 px-5 py-2.5 bg-red-500/10 hover:bg-red-500/15 border border-red-500/20 text-red-200 font-medium rounded-xl transition-all text-sm">
            <Trophy className="w-4 h-4 text-amber-400" /> View Full Leaderboard
          </button>
        </Link>
      </div>
    </div>
  );
}
