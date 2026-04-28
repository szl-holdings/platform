import { cn } from '@szl-holdings/shared-ui/utils';
import {
  ArrowRight,
  ArrowUpRight,
  BarChart2,
  Building,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Filter,
  Globe,
  Loader2,
  Shield,
  TrendingDown,
  TrendingUp,
  Trophy,
  Users,
  Zap,
} from 'lucide-react';
import { useState } from 'react';
import { Link } from 'wouter';

type ResilienceGrade = 'AAA' | 'AA' | 'A' | 'BBB' | 'BB' | 'B' | 'CCC' | 'C';
type Industry = 'Financial Services' | 'Healthcare' | 'Energy & Utilities' | 'Government' | 'Technology' | 'Manufacturing' | 'Defense' | 'Retail';
type OrgSize = 'Enterprise' | 'Mid-Market' | 'SME';
type Region = 'North America' | 'Europe' | 'Asia-Pacific' | 'Middle East';
type TrendDir = 'up' | 'down' | 'flat';

interface CategoryScore {
  ransomware: ResilienceGrade;
  supply_chain: ResilienceGrade;
  ot_ics: ResilienceGrade;
  insider: ResilienceGrade;
  bec: ResilienceGrade;
  cloud: ResilienceGrade;
}

interface OrgEntry {
  id: string;
  rank: number;
  displayName: string;
  industry: Industry;
  region: Region;
  orgSize: OrgSize;
  overallGrade: ResilienceGrade;
  overallScore: number;
  scenariosCompleted: number;
  trend: TrendDir;
  trendPoints: number;
  industryPercentile: number;
  categoryScores: CategoryScore;
  isPublic: boolean;
  lastExercise: string;
}

function getGradeColor(grade: ResilienceGrade): string {
  if (grade === 'AAA' || grade === 'AA') return '#4ade80';
  if (grade === 'A') return '#86efac';
  if (grade === 'BBB' || grade === 'BB') return '#c9b787';
  if (grade === 'B') return '#f5f5f5';
  return '#ef4444';
}

function getGradeBg(grade: ResilienceGrade): string {
  if (grade === 'AAA' || grade === 'AA') return 'rgba(74,222,128,0.08)';
  if (grade === 'A') return 'rgba(134,239,172,0.08)';
  if (grade === 'BBB' || grade === 'BB') return 'rgba(201,183,135,0.08)';
  if (grade === 'B') return 'rgba(245,245,245,0.08)';
  return 'rgba(239,68,68,0.08)';
}

function GradeChip({ grade, size = 'sm' }: { grade: ResilienceGrade; size?: 'sm' | 'lg' }) {
  return (
    <span
      className={cn('font-display font-bold rounded px-1.5 py-0.5 border', size === 'lg' ? 'text-xl' : 'text-[11px]')}
      style={{ color: getGradeColor(grade), borderColor: getGradeColor(grade) + '40', background: getGradeBg(grade) }}
    >
      {grade}
    </span>
  );
}

const SEED_ENTRIES: OrgEntry[] = [
  {
    id: 'org-001', rank: 1, displayName: 'Meridian Financial Group', industry: 'Financial Services', region: 'North America', orgSize: 'Enterprise', overallGrade: 'AAA', overallScore: 97, scenariosCompleted: 28, trend: 'up', trendPoints: 4, industryPercentile: 99,
    categoryScores: { ransomware: 'AAA', supply_chain: 'AA', ot_ics: 'AA', insider: 'AAA', bec: 'AAA', cloud: 'AA' }, isPublic: true, lastExercise: '2 days ago',
  },
  {
    id: 'org-002', rank: 2, displayName: 'Helios Defence Systems', industry: 'Defense', region: 'Europe', orgSize: 'Enterprise', overallGrade: 'AA', overallScore: 92, scenariosCompleted: 34, trend: 'up', trendPoints: 2, industryPercentile: 96,
    categoryScores: { ransomware: 'AA', supply_chain: 'AAA', ot_ics: 'AA', insider: 'AA', bec: 'A', cloud: 'AA' }, isPublic: true, lastExercise: '5 days ago',
  },
  {
    id: 'org-003', rank: 3, displayName: 'Cascade Energy Partners', industry: 'Energy & Utilities', region: 'North America', orgSize: 'Enterprise', overallGrade: 'AA', overallScore: 89, scenariosCompleted: 19, trend: 'flat', trendPoints: 0, industryPercentile: 91,
    categoryScores: { ransomware: 'AA', supply_chain: 'A', ot_ics: 'AAA', insider: 'A', bec: 'AA', cloud: 'A' }, isPublic: true, lastExercise: '1 week ago',
  },
  {
    id: 'org-004', rank: 4, displayName: 'Vantage Health Networks', industry: 'Healthcare', region: 'North America', orgSize: 'Enterprise', overallGrade: 'A', overallScore: 83, scenariosCompleted: 22, trend: 'up', trendPoints: 7, industryPercentile: 88,
    categoryScores: { ransomware: 'A', supply_chain: 'A', ot_ics: 'BBB', insider: 'A', bec: 'AA', cloud: 'A' }, isPublic: true, lastExercise: '3 days ago',
  },
  {
    id: 'org-005', rank: 5, displayName: 'Strata Government [Redacted]', industry: 'Government', region: 'Europe', orgSize: 'Enterprise', overallGrade: 'A', overallScore: 80, scenariosCompleted: 16, trend: 'up', trendPoints: 3, industryPercentile: 85,
    categoryScores: { ransomware: 'A', supply_chain: 'BBB', ot_ics: 'A', insider: 'AA', bec: 'A', cloud: 'BBB' }, isPublic: true, lastExercise: '2 weeks ago',
  },
  {
    id: 'org-006', rank: 6, displayName: 'Nexagen Technology Corp', industry: 'Technology', region: 'Asia-Pacific', orgSize: 'Enterprise', overallGrade: 'BBB', overallScore: 74, scenariosCompleted: 12, trend: 'up', trendPoints: 5, industryPercentile: 72,
    categoryScores: { ransomware: 'BBB', supply_chain: 'BB', ot_ics: 'BBB', insider: 'BBB', bec: 'BBB', cloud: 'BB' }, isPublic: true, lastExercise: '1 week ago',
  },
  {
    id: 'org-007', rank: 7, displayName: 'Ironclad Manufacturing GmbH', industry: 'Manufacturing', region: 'Europe', orgSize: 'Mid-Market', overallGrade: 'BBB', overallScore: 71, scenariosCompleted: 9, trend: 'down', trendPoints: -3, industryPercentile: 68,
    categoryScores: { ransomware: 'BB', supply_chain: 'BBB', ot_ics: 'BBB', insider: 'BBB', bec: 'BB', cloud: 'B' }, isPublic: true, lastExercise: '3 weeks ago',
  },
  {
    id: 'org-008', rank: 8, displayName: 'Apex Retail Holdings', industry: 'Retail', region: 'North America', orgSize: 'Mid-Market', overallGrade: 'BB', overallScore: 63, scenariosCompleted: 7, trend: 'flat', trendPoints: 0, industryPercentile: 58,
    categoryScores: { ransomware: 'BB', supply_chain: 'B', ot_ics: 'CCC', insider: 'BB', bec: 'BBB', cloud: 'BB' }, isPublic: true, lastExercise: '1 month ago',
  },
  {
    id: 'org-009', rank: 9, displayName: 'Solaris Energy [MENA]', industry: 'Energy & Utilities', region: 'Middle East', orgSize: 'Enterprise', overallGrade: 'BB', overallScore: 61, scenariosCompleted: 8, trend: 'down', trendPoints: -5, industryPercentile: 54,
    categoryScores: { ransomware: 'B', supply_chain: 'BB', ot_ics: 'BB', insider: 'BB', bec: 'B', cloud: 'BBB' }, isPublic: true, lastExercise: '3 weeks ago',
  },
  {
    id: 'org-010', rank: 10, displayName: 'Delta Pharma Sciences', industry: 'Healthcare', region: 'Europe', orgSize: 'Mid-Market', overallGrade: 'B', overallScore: 54, scenariosCompleted: 5, trend: 'up', trendPoints: 8, industryPercentile: 43,
    categoryScores: { ransomware: 'B', supply_chain: 'CCC', ot_ics: 'B', insider: 'B', bec: 'BB', cloud: 'B' }, isPublic: true, lastExercise: '2 weeks ago',
  },
  {
    id: 'org-011', rank: 11, displayName: '[Private — Opt-Out]', industry: 'Financial Services', region: 'Asia-Pacific', orgSize: 'Enterprise', overallGrade: 'AA', overallScore: 88, scenariosCompleted: 31, trend: 'up', trendPoints: 1, industryPercentile: 92,
    categoryScores: { ransomware: 'AA', supply_chain: 'AA', ot_ics: 'A', insider: 'AAA', bec: 'AA', cloud: 'AA' }, isPublic: false, lastExercise: '4 days ago',
  },
  {
    id: 'org-012', rank: 12, displayName: 'Vertex SME Logistics', industry: 'Manufacturing', region: 'North America', orgSize: 'SME', overallGrade: 'B', overallScore: 51, scenariosCompleted: 4, trend: 'down', trendPoints: -2, industryPercentile: 38,
    categoryScores: { ransomware: 'B', supply_chain: 'B', ot_ics: 'CCC', insider: 'B', bec: 'BBB', cloud: 'CCC' }, isPublic: true, lastExercise: '1 month ago',
  },
];

const INDUSTRY_LIST: Industry[] = ['Financial Services', 'Healthcare', 'Energy & Utilities', 'Government', 'Technology', 'Manufacturing', 'Defense', 'Retail'];
const REGION_LIST: Region[] = ['North America', 'Europe', 'Asia-Pacific', 'Middle East'];
const SIZE_LIST: OrgSize[] = ['Enterprise', 'Mid-Market', 'SME'];

const CAT_LABELS: Record<keyof CategoryScore, string> = {
  ransomware: 'Ransomware',
  supply_chain: 'Supply Chain',
  ot_ics: 'OT/ICS',
  insider: 'Insider',
  bec: 'BEC/Fraud',
  cloud: 'Cloud',
};

const GRADE_ORDER: Record<ResilienceGrade, number> = { AAA: 0, AA: 1, A: 2, BBB: 3, BB: 4, B: 5, CCC: 6, C: 7 };

export default function ResilienceLeaderboard() {
  const [industryFilter, setIndustryFilter] = useState<Industry | 'all'>('all');
  const [regionFilter, setRegionFilter] = useState<Region | 'all'>('all');
  const [sizeFilter, setSizeFilter] = useState<OrgSize | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<keyof CategoryScore | 'all'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'rank' | 'score' | 'scenarios'>('rank');
  const [publicOverrides, setPublicOverrides] = useState<Record<string, boolean>>({});

  const filtered = SEED_ENTRIES.filter((e) => {
    if (industryFilter !== 'all' && e.industry !== industryFilter) return false;
    if (regionFilter !== 'all' && e.region !== regionFilter) return false;
    if (sizeFilter !== 'all' && e.orgSize !== sizeFilter) return false;
    return true;
  }).sort((a, b) => {
    if (categoryFilter !== 'all') {
      return GRADE_ORDER[a.categoryScores[categoryFilter]] - GRADE_ORDER[b.categoryScores[categoryFilter]];
    }
    if (sortBy === 'score') return b.overallScore - a.overallScore;
    if (sortBy === 'scenarios') return b.scenariosCompleted - a.scenariosCompleted;
    return a.rank - b.rank;
  });

  const avgScore = Math.round(SEED_ENTRIES.reduce((s, e) => s + e.overallScore, 0) / SEED_ENTRIES.length);
  const topGrade = SEED_ENTRIES[0]?.overallGrade ?? 'AAA';

  return (
    <div className="space-y-6 animate-fade-in">
      <header>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400">PUBLIC · RESILIENCE REGISTRY</span>
        </div>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-display font-bold text-slate-100">Resilience Leaderboard</h1>
            <p className="text-slate-400 mt-1 max-w-2xl">
              Organizational crisis readiness ranked by operational execution — not external posture. Moody's-style grades (AAA–C) based on simulation performance, response speed, regulatory compliance, and decision quality under pressure.
            </p>
          </div>
          <Link href="/crisis-simulator">
            <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold transition-colors shrink-0"
              style={{ background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.25)', color: '#ef4444' }}>
              <Zap className="w-3.5 h-3.5" />
              Run a Simulation
              <ArrowRight className="w-3 h-3" />
            </button>
          </Link>
        </div>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: Building, label: 'Organizations Ranked', value: `${SEED_ENTRIES.length}`, color: '#4ade80' },
          { icon: BarChart2, label: 'Avg Resilience Score', value: `${avgScore}/100`, color: '#c9b787' },
          { icon: Trophy, label: 'Top Grade', value: topGrade, color: getGradeColor(topGrade) },
          { icon: Globe, label: 'Regions Covered', value: `${REGION_LIST.length}`, color: '#8a8a8a' },
        ].map((stat) => (
          <div key={stat.label} className="sentra-panel p-5 flex items-center gap-3">
            <stat.icon className="w-5 h-5 shrink-0" style={{ color: stat.color }} />
            <div>
              <div className="text-xl font-display font-bold text-slate-100">{stat.value}</div>
              <div className="text-[9px] font-mono text-slate-500 uppercase tracking-wider mt-0.5">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="sentra-panel p-5">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500">Filter & Sort</span>
        </div>
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setIndustryFilter('all')} className={cn('px-3 py-1 rounded text-[11px] font-mono font-bold border transition-colors', industryFilter === 'all' ? 'bg-[#f5f5f5]/15 border-[#f5f5f5]/40 text-[#f5f5f5]' : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600')}>All Industries</button>
            {INDUSTRY_LIST.map((ind) => (
              <button key={ind} onClick={() => setIndustryFilter(ind)} className={cn('px-3 py-1 rounded text-[11px] font-mono font-bold border transition-colors', industryFilter === ind ? 'bg-[#f5f5f5]/15 border-[#f5f5f5]/40 text-[#f5f5f5]' : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600')}>{ind}</button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setRegionFilter('all')} className={cn('px-3 py-1 rounded text-[11px] font-mono font-bold border transition-colors', regionFilter === 'all' ? 'bg-[#f5f5f5]/15 border-[#f5f5f5]/40 text-[#f5f5f5]' : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600')}>All Regions</button>
            {REGION_LIST.map((reg) => (
              <button key={reg} onClick={() => setRegionFilter(reg)} className={cn('px-3 py-1 rounded text-[11px] font-mono font-bold border transition-colors', regionFilter === reg ? 'bg-[#f5f5f5]/15 border-[#f5f5f5]/40 text-[#f5f5f5]' : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600')}>{reg}</button>
            ))}
            {SIZE_LIST.map((sz) => (
              <button key={sz} onClick={() => setSizeFilter(sz === sizeFilter ? 'all' : sz)} className={cn('px-3 py-1 rounded text-[11px] font-mono font-bold border transition-colors', sizeFilter === sz ? 'bg-[#f5f5f5]/15 border-[#f5f5f5]/40 text-[#f5f5f5]' : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600')}>{sz}</button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="text-[10px] font-mono text-slate-600 self-center">Threat Category:</span>
            <button onClick={() => setCategoryFilter('all')} className={cn('px-3 py-1 rounded text-[11px] font-mono font-bold border transition-colors', categoryFilter === 'all' ? 'bg-red-500/15 border-red-500/40 text-red-400' : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600')}>All</button>
            {(Object.entries(CAT_LABELS) as [keyof CategoryScore, string][]).map(([key, label]) => (
              <button key={key} onClick={() => setCategoryFilter(key)} className={cn('px-3 py-1 rounded text-[11px] font-mono font-bold border transition-colors', categoryFilter === key ? 'bg-red-500/15 border-red-500/40 text-red-400' : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600')}>{label}</button>
            ))}
          </div>
          <div className="flex gap-2">
            {(['rank', 'score', 'scenarios'] as const).map((s) => (
              <button key={s} onClick={() => { setSortBy(s); setCategoryFilter('all'); }} className={cn('px-3 py-1 rounded text-[11px] font-mono font-bold border transition-colors', sortBy === s && categoryFilter === 'all' ? 'bg-[#c9b787]/15 border-[#c9b787]/40 text-[#c9b787]' : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600')}>
                Sort: {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="text-[10px] font-mono text-slate-600 uppercase">
        {filtered.length} organizations · Showing {filtered.filter((e) => (publicOverrides[e.id] ?? e.isPublic)).length} public, {filtered.filter((e) => !(publicOverrides[e.id] ?? e.isPublic)).length} anonymized
        {categoryFilter !== 'all' && <span className="text-red-500 ml-2">· Sorted by {CAT_LABELS[categoryFilter]} grade</span>}
      </div>

      <div className="space-y-2">
        {filtered.map((entry, i) => {
          const isExpanded = expandedId === entry.id;
          const gradeColor = getGradeColor(entry.overallGrade);
          const isPublic = publicOverrides[entry.id] ?? entry.isPublic;
          return (
            <div
              key={entry.id}
              className={cn('sentra-panel transition-all duration-200', isExpanded && 'border-slate-600/60')}
            >
              <div
                className="p-4 flex items-center gap-4 cursor-pointer"
                onClick={() => setExpandedId(isExpanded ? null : entry.id)}
              >
                <div className="text-[11px] font-mono text-slate-500 w-8 text-center shrink-0">
                  #{entry.rank}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    {isPublic ? (
                      <Eye className="w-3 h-3 text-emerald-500 shrink-0" />
                    ) : (
                      <EyeOff className="w-3 h-3 text-slate-500 shrink-0" />
                    )}
                    <span className="text-sm font-bold text-slate-200 truncate">{isPublic ? entry.displayName : '[Anonymized Organization]'}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] text-slate-500 font-mono">{entry.industry}</span>
                    <span className="text-slate-700">·</span>
                    <span className="text-[10px] text-slate-500 font-mono">{entry.region}</span>
                    <span className="text-slate-700">·</span>
                    <span className="text-[10px] text-slate-500 font-mono">{entry.orgSize}</span>
                  </div>
                </div>

                <div className="flex items-center gap-5 shrink-0">
                  <div className="text-center hidden sm:block">
                    <div className="text-[10px] font-mono text-slate-100 font-bold">{entry.overallScore}</div>
                    <div className="text-[8px] font-mono text-slate-600 uppercase">Score</div>
                  </div>
                  <div className="text-center hidden md:block">
                    <div className="text-[10px] font-mono text-slate-400">{entry.industryPercentile}th</div>
                    <div className="text-[8px] font-mono text-slate-600 uppercase">Industry %ile</div>
                  </div>
                  <div className="text-center hidden md:block">
                    <div className="text-[10px] font-mono text-slate-400">{entry.scenariosCompleted}</div>
                    <div className="text-[8px] font-mono text-slate-600 uppercase">Exercises</div>
                  </div>
                  <div className="flex items-center gap-1">
                    {entry.trend === 'up' ? (
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                    ) : entry.trend === 'down' ? (
                      <TrendingDown className="w-3.5 h-3.5 text-red-400" />
                    ) : (
                      <div className="w-3.5 h-3.5 text-slate-500">—</div>
                    )}
                    {entry.trendPoints !== 0 && (
                      <span className={cn('text-[9px] font-mono', entry.trend === 'up' ? 'text-emerald-400' : 'text-red-400')}>
                        {entry.trend === 'up' ? '+' : ''}{entry.trendPoints}
                      </span>
                    )}
                  </div>
                  <GradeChip grade={entry.overallGrade} />
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-slate-500" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-500" />
                  )}
                </div>
              </div>

              {isExpanded && (
                <div className="px-4 pb-5 border-t border-slate-800/60 pt-4 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <div className="text-[9px] font-mono uppercase text-slate-500 mb-3">Category Performance Breakdown</div>
                      <div className="space-y-2">
                        {(Object.entries(CAT_LABELS) as [keyof CategoryScore, string][]).map(([key, label]) => {
                          const catGrade = entry.categoryScores[key];
                          return (
                            <div key={key} className="flex items-center justify-between text-xs">
                              <span className="text-slate-400 font-mono text-[10px]">{label}</span>
                              <GradeChip grade={catGrade} />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    <div>
                      <div className="text-[9px] font-mono uppercase text-slate-500 mb-3">Performance Context</div>
                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between text-[10px] mb-1">
                            <span className="text-slate-500 font-mono">Industry Percentile</span>
                            <span className="text-slate-300 font-mono font-bold">{entry.industryPercentile}th</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all" style={{ width: `${entry.industryPercentile}%`, background: gradeColor }} />
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-slate-500 font-mono">Exercises Completed</span>
                          <span className="text-slate-300 font-mono font-bold">{entry.scenariosCompleted}</span>
                        </div>
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-slate-500 font-mono">Last Exercise</span>
                          <span className="text-slate-300 font-mono">{entry.lastExercise}</span>
                        </div>
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-slate-500 font-mono">Visibility</span>
                          <button
                            onClick={(ev) => {
                              ev.stopPropagation();
                              setPublicOverrides((prev) => ({ ...prev, [entry.id]: !isPublic }));
                            }}
                            className={cn(
                              'flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-mono font-bold border transition-colors',
                              isPublic
                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                                : 'bg-slate-800 border-slate-700 text-slate-500 hover:border-slate-600'
                            )}
                          >
                            {isPublic ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                            {isPublic ? 'Public · Click to Opt Out' : 'Private · Click to Opt In'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="sentra-panel p-16 text-center">
          <Users className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">No organizations match the selected filters.</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="sentra-panel p-5">
          <h3 className="text-sm font-bold text-slate-200 mb-3 flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-[#c9b787]" />
            Grade Distribution
          </h3>
          <div className="space-y-2">
            {(['AAA', 'AA', 'A', 'BBB', 'BB', 'B', 'CCC', 'C'] as ResilienceGrade[]).map((g) => {
              const count = SEED_ENTRIES.filter((e) => e.overallGrade === g).length;
              const pct = count / SEED_ENTRIES.length;
              return (
                <div key={g} className="flex items-center gap-3">
                  <span className="text-[10px] font-display font-bold w-8 text-right shrink-0" style={{ color: getGradeColor(g) }}>{g}</span>
                  <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct * 100}%`, background: getGradeColor(g) }} />
                  </div>
                  <span className="text-[9px] font-mono text-slate-500 w-4">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="sentra-panel p-5">
          <h3 className="text-sm font-bold text-slate-200 mb-3 flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#f5f5f5]" />
            How the Rating Works
          </h3>
          <div className="space-y-2 text-[11px] text-slate-400 leading-relaxed">
            <p>Unlike BitSight or SecurityScorecard (external posture), the Sentra Resilience Rating scores <span className="text-slate-300">operational execution under pressure</span> — how fast and well your team performs when a real crisis hits.</p>
            <div className="space-y-1.5 pt-2">
              {[
                { grade: 'AAA–AA', desc: 'Elite readiness. Optimal decisions, sub-30s response, full regulatory compliance.' },
                { grade: 'A–BBB', desc: 'Solid readiness with gaps. Recommended: 2 additional exercises per quarter.' },
                { grade: 'BB–B', desc: 'Moderate gaps. Escalation delays and compliance misses observed.' },
                { grade: 'CCC–C', desc: 'Critical gaps. Immediate tabletop and training program required.' },
              ].map((row) => (
                <div key={row.grade} className="flex gap-2">
                  <span className="font-display font-bold shrink-0 w-14 text-right" style={{ color: getGradeColor(row.grade.split('–')[0] as ResilienceGrade) }}>{row.grade}</span>
                  <span className="text-slate-500">{row.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="sentra-panel p-5" style={{ borderColor: 'rgba(74,222,128,0.15)' }}>
        <div className="flex items-start gap-4">
          <Trophy className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-bold text-slate-200 mb-1">Join the Public Leaderboard</h3>
            <p className="text-xs text-slate-500 mb-3">Run crisis simulations and earn a verified Resilience Rating. Choose public ranking (competitive benchmark) or private mode (internal benchmarking only). No sensitive operational data is ever published.</p>
            <Link href="/crisis-simulator">
              <button className="flex items-center gap-2 px-4 py-2 rounded text-xs font-bold transition-colors"
                style={{ background: 'rgba(74,222,128,0.10)', border: '1px solid rgba(74,222,128,0.25)', color: '#4ade80' }}>
                Start First Simulation <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
