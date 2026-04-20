import {
  Activity,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Filter,
  RotateCcw,
  Target,
  X,
} from 'lucide-react';
import type React from 'react';
import { useState } from 'react';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const BG = { page: '#080c14', surface: '#0c1018', elevated: '#10141e', panel: '#0e1219' };
const BORDER = { subtle: 'rgba(255,255,255,0.04)', muted: 'rgba(255,255,255,0.06)' };
const TEXT = {
  primary: 'rgba(255,255,255,0.88)',
  secondary: 'rgba(255,255,255,0.55)',
  tertiary: 'rgba(255,255,255,0.28)',
  muted: 'rgba(255,255,255,0.14)',
};

type OutcomeType = 'accepted' | 'rejected' | 'modified';

interface RecommendationOutcome {
  id: string;
  title: string;
  category: string;
  pack: string;
  packColor: string;
  surfacedAt: string;
  decidedAt: string;
  outcome: OutcomeType;
  actualResult?: string;
  predictedImpact: string;
  actualImpact?: string;
  accuracy?: number;
  modifiedTo?: string;
  decidedBy: string;
}

const OUTCOMES: RecommendationOutcome[] = [
  {
    id: 'REC-0421',
    title: 'Escalate fuel surcharge approval to CFO',
    category: 'operational',
    pack: 'Vessels',
    packColor: '#38bdf8',
    surfacedAt: 'Apr 3, 9:11 AM',
    decidedAt: 'Apr 3, 9:45 AM',
    outcome: 'accepted',
    predictedImpact: '$2.1M protected',
    actualImpact: '$2.1M — SLA breach avoided',
    accuracy: 97,
    decidedBy: 'Operations Lead',
  },
  {
    id: 'REC-0420',
    title: 'Auto-reassign AR ownership to Finance Team A',
    category: 'ownership',
    pack: 'PRISM',
    packColor: '#d4a054',
    surfacedAt: 'Apr 3, 8:30 AM',
    decidedAt: 'Apr 3, 10:12 AM',
    outcome: 'modified',
    predictedImpact: '$650K unblocked',
    actualImpact: '$650K unblocked — manual assignment used',
    accuracy: 88,
    modifiedTo: 'Manual COO assignment rather than auto-reassign',
    decidedBy: 'COO',
  },
  {
    id: 'REC-0418',
    title: 'Route M/V Meridian via alternate port',
    category: 'operational',
    pack: 'Vessels',
    packColor: '#38bdf8',
    surfacedAt: 'Apr 2, 3:14 PM',
    decidedAt: 'Apr 2, 4:00 PM',
    outcome: 'accepted',
    predictedImpact: '$400K fuel savings',
    actualImpact: '$380K fuel savings achieved',
    accuracy: 95,
    decidedBy: 'Fleet Ops',
  },
  {
    id: 'REC-0415',
    title: 'Defer vendor onboarding — background check backlog clears in 5d',
    category: 'resource',
    pack: 'Aegis',
    packColor: '#4f6ef7',
    surfacedAt: 'Apr 1, 11:00 AM',
    decidedAt: 'Apr 1, 1:45 PM',
    outcome: 'accepted',
    predictedImpact: 'No penalty — defer safely',
    actualImpact: 'Confirmed — no SLA impact',
    accuracy: 100,
    decidedBy: 'Security Lead',
  },
  {
    id: 'REC-0412',
    title: 'Auto-approve lease renewal — low risk document',
    category: 'compliance',
    pack: 'Terra',
    packColor: '#a07848',
    surfacedAt: 'Apr 1, 9:00 AM',
    decidedAt: 'Apr 1, 9:30 AM',
    outcome: 'rejected',
    predictedImpact: '3h saved in process',
    actualImpact: 'Manual review revealed exhibit B issue — correct rejection',
    accuracy: 72,
    decidedBy: 'Property Manager',
  },
  {
    id: 'REC-0408',
    title: 'Flag Q1 AR reconciliation gap to Finance VP',
    category: 'financial',
    pack: 'PRISM',
    packColor: '#d4a054',
    surfacedAt: 'Mar 30, 2:15 PM',
    decidedAt: 'Mar 30, 3:00 PM',
    outcome: 'accepted',
    predictedImpact: '$890K reconciled',
    actualImpact: '$910K reconciled — above forecast',
    accuracy: 102,
    decidedBy: 'CFO',
  },
];

const ACCURACY_TREND = [
  { week: 'Feb W3', accuracy: 74 },
  { week: 'Feb W4', accuracy: 78 },
  { week: 'Mar W1', accuracy: 81 },
  { week: 'Mar W2', accuracy: 79 },
  { week: 'Mar W3', accuracy: 85 },
  { week: 'Mar W4', accuracy: 88 },
  { week: 'Apr W1', accuracy: 92 },
];

const CATEGORY_ACCURACY = [
  { category: 'Operational', accuracy: 94, count: 28 },
  { category: 'Ownership', accuracy: 88, count: 12 },
  { category: 'Financial', accuracy: 91, count: 19 },
  { category: 'Compliance', accuracy: 76, count: 8 },
  { category: 'Resource', accuracy: 97, count: 11 },
];

const OUTCOME_COLORS: Record<
  OutcomeType,
  { fg: string; bg: string; label: string; icon: React.ElementType }
> = {
  accepted: { fg: '#6b8f71', bg: 'rgba(107,143,113,0.09)', label: 'Accepted', icon: Check },
  rejected: { fg: '#c45a4a', bg: 'rgba(196,90,74,0.09)', label: 'Rejected', icon: X },
  modified: { fg: '#c8953c', bg: 'rgba(200,149,60,0.09)', label: 'Modified', icon: RotateCcw },
};

function OutcomeBadge({ outcome }: { outcome: OutcomeType }) {
  const c = OUTCOME_COLORS[outcome];
  const Icon = c.icon;
  return (
    <span
      className="flex items-center gap-1 text-[8px] font-mono px-1.5 py-0.5 rounded uppercase tracking-wider"
      style={{ color: c.fg, background: c.bg }}
    >
      <Icon className="w-2.5 h-2.5" />
      {c.label}
    </span>
  );
}

function OutcomeCard({ rec }: { rec: RecommendationOutcome }) {
  const [expanded, setExpanded] = useState(false);
  const c = OUTCOME_COLORS[rec.outcome];
  const accColor = !rec.accuracy
    ? TEXT.muted
    : rec.accuracy >= 90
      ? '#6b8f71'
      : rec.accuracy >= 75
        ? '#c8953c'
        : '#c45a4a';

  return (
    <div
      className="rounded-md overflow-hidden"
      style={{ background: BG.surface, border: `1px solid ${BORDER.subtle}` }}
    >
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-start gap-3 p-3.5 text-left hover:bg-white/[0.01] transition-colors"
      >
        <OutcomeBadge outcome={rec.outcome} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span
              className="text-[8px] font-bold tracking-wider px-1.5 py-0.5 rounded uppercase"
              style={{ color: rec.packColor, background: `${rec.packColor}14` }}
            >
              {rec.pack}
            </span>
            <span className="text-[8px] font-mono" style={{ color: TEXT.muted }}>
              {rec.id}
            </span>
          </div>
          <p className="text-[10px] font-medium leading-snug" style={{ color: TEXT.primary }}>
            {rec.title}
          </p>
          <p className="text-[8px] mt-0.5" style={{ color: TEXT.tertiary }}>
            Decided: {rec.decidedAt} by {rec.decidedBy}
          </p>
        </div>
        <div className="shrink-0 flex flex-col items-end gap-1">
          {rec.accuracy && (
            <span className="text-[10px] font-mono" style={{ color: accColor }}>
              {rec.accuracy}%
            </span>
          )}
          {expanded ? (
            <ChevronDown className="w-3.5 h-3.5" style={{ color: TEXT.tertiary }} />
          ) : (
            <ChevronRight className="w-3.5 h-3.5" style={{ color: TEXT.tertiary }} />
          )}
        </div>
      </button>

      {expanded && (
        <div className="px-3.5 pb-4 space-y-3" style={{ borderTop: `1px solid ${BORDER.subtle}` }}>
          <div className="pt-3 grid grid-cols-2 gap-3">
            <div className="rounded p-2.5" style={{ background: BG.elevated }}>
              <div
                className="text-[7px] uppercase tracking-wider mb-1"
                style={{ color: TEXT.muted }}
              >
                Predicted Impact
              </div>
              <p className="text-[9px] font-medium" style={{ color: TEXT.secondary }}>
                {rec.predictedImpact}
              </p>
            </div>
            <div className="rounded p-2.5" style={{ background: BG.elevated }}>
              <div
                className="text-[7px] uppercase tracking-wider mb-1"
                style={{ color: TEXT.muted }}
              >
                Actual Impact
              </div>
              <p
                className="text-[9px] font-medium"
                style={{ color: rec.actualImpact ? TEXT.primary : TEXT.muted }}
              >
                {rec.actualImpact ?? 'Pending'}
              </p>
            </div>
          </div>
          {rec.modifiedTo && (
            <div
              className="rounded p-2.5"
              style={{
                background: 'rgba(200,149,60,0.06)',
                border: '1px solid rgba(200,149,60,0.14)',
              }}
            >
              <div
                className="text-[7px] uppercase tracking-wider mb-1"
                style={{ color: 'rgba(200,149,60,0.6)' }}
              >
                Modified To
              </div>
              <p className="text-[9px]" style={{ color: '#c8953c' }}>
                {rec.modifiedTo}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function OutcomeLoopPage() {
  const [filterOutcome, setFilterOutcome] = useState('all');
  const [filterPack, setFilterPack] = useState('all');

  const accepted = OUTCOMES.filter((r) => r.outcome === 'accepted').length;
  const rejected = OUTCOMES.filter((r) => r.outcome === 'rejected').length;
  const modified = OUTCOMES.filter((r) => r.outcome === 'modified').length;
  const avgAccuracy = Math.round(
    OUTCOMES.filter((r) => r.accuracy).reduce((s, r) => s + (r.accuracy ?? 0), 0) /
      OUTCOMES.filter((r) => r.accuracy).length,
  );
  const packs = Array.from(new Set(OUTCOMES.map((r) => r.pack)));

  const filtered = OUTCOMES.filter((r) => {
    if (filterOutcome !== 'all' && r.outcome !== filterOutcome) return false;
    if (filterPack !== 'all' && r.pack !== filterPack) return false;
    return true;
  });

  return (
    <div className="p-4 md:p-5 space-y-5" style={{ background: BG.page }}>
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Activity className="w-3.5 h-3.5" style={{ color: '#4a90b8' }} />
          <span
            className="text-[9px] font-mono uppercase tracking-widest"
            style={{ color: '#4a90b8' }}
          >
            Outcome Loop
          </span>
        </div>
        <h1 className="text-lg font-bold tracking-tight" style={{ color: TEXT.primary }}>
          Recommendation Accuracy Tracker
        </h1>
        <p className="text-[11px] mt-0.5" style={{ color: TEXT.secondary }}>
          Accepted vs rejected recommendations over time — feeds back into ranking quality
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          {
            label: 'Acceptance Rate',
            value: `${Math.round((accepted / OUTCOMES.length) * 100)}%`,
            sub: `${accepted} of ${OUTCOMES.length}`,
            color: '#6b8f71',
            Icon: CheckCircle2,
          },
          {
            label: 'Avg Accuracy',
            value: `${avgAccuracy}%`,
            sub: 'Predicted vs actual',
            color: '#4a90b8',
            Icon: Target,
          },
          {
            label: 'Modified',
            value: String(modified),
            sub: 'Human-adjusted',
            color: '#c8953c',
            Icon: RotateCcw,
          },
          {
            label: 'Rejected',
            value: String(rejected),
            sub: 'Not accepted',
            color: '#c45a4a',
            Icon: X,
          },
        ].map((m) => (
          <div
            key={m.label}
            className="rounded-md p-3 flex items-center gap-3"
            style={{ background: BG.surface, border: `1px solid ${BORDER.subtle}` }}
          >
            <div
              className="w-8 h-8 rounded flex items-center justify-center shrink-0"
              style={{ background: `${m.color}10` }}
            >
              <m.Icon className="w-4 h-4" style={{ color: m.color }} />
            </div>
            <div>
              <div className="text-base font-bold font-mono" style={{ color: m.color }}>
                {m.value}
              </div>
              <div className="text-[9px]" style={{ color: TEXT.secondary }}>
                {m.label}
              </div>
              <div className="text-[8px]" style={{ color: TEXT.tertiary }}>
                {m.sub}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
          className="rounded-md p-4"
          style={{ background: BG.surface, border: `1px solid ${BORDER.subtle}` }}
        >
          <div
            className="text-[9px] uppercase tracking-widest font-medium mb-3"
            style={{ color: TEXT.muted }}
          >
            Accuracy Trend (8 Weeks)
          </div>
          <div className="h-28">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={ACCURACY_TREND}>
                <defs>
                  <linearGradient id="accGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4a90b8" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#4a90b8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="week"
                  tick={{ fontSize: 7, fill: TEXT.muted }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={[60, 100]}
                  tick={{ fontSize: 7, fill: TEXT.muted }}
                  axisLine={false}
                  tickLine={false}
                  width={25}
                />
                <Tooltip
                  contentStyle={{
                    background: BG.elevated,
                    border: `1px solid ${BORDER.muted}`,
                    borderRadius: 4,
                    fontSize: 9,
                  }}
                  labelStyle={{ color: TEXT.tertiary }}
                  formatter={(v: number) => [`${v}%`, 'Accuracy']}
                />
                <Area
                  type="monotone"
                  dataKey="accuracy"
                  stroke="#4a90b8"
                  strokeWidth={1.5}
                  fill="url(#accGrad)"
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div
          className="rounded-md p-4"
          style={{ background: BG.surface, border: `1px solid ${BORDER.subtle}` }}
        >
          <div
            className="text-[9px] uppercase tracking-widest font-medium mb-3"
            style={{ color: TEXT.muted }}
          >
            Accuracy by Category
          </div>
          <div className="space-y-2">
            {CATEGORY_ACCURACY.map((c) => (
              <div key={c.category}>
                <div className="flex items-center justify-between text-[8px] mb-1">
                  <span style={{ color: TEXT.secondary }}>{c.category}</span>
                  <div className="flex items-center gap-2">
                    <span style={{ color: TEXT.muted }}>{c.count} recs</span>
                    <span
                      className="font-mono"
                      style={{
                        color:
                          c.accuracy >= 90 ? '#6b8f71' : c.accuracy >= 80 ? '#c8953c' : '#c45a4a',
                      }}
                    >
                      {c.accuracy}%
                    </span>
                  </div>
                </div>
                <div
                  className="h-1 rounded-full overflow-hidden"
                  style={{ background: 'rgba(255,255,255,0.05)' }}
                >
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${c.accuracy}%`,
                      background:
                        c.accuracy >= 90 ? '#6b8f71' : c.accuracy >= 80 ? '#c8953c' : '#c45a4a',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="flex items-center gap-1.5 text-[9px]" style={{ color: TEXT.tertiary }}>
          <Filter className="w-3 h-3" />
          <span>Filter:</span>
        </div>
        {['all', 'accepted', 'rejected', 'modified'].map((o) => (
          <button
            key={o}
            onClick={() => setFilterOutcome(o)}
            className="px-2.5 py-1 rounded text-[9px] font-medium capitalize transition-all"
            style={{
              background: filterOutcome === o ? 'rgba(74,144,184,0.12)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${filterOutcome === o ? 'rgba(74,144,184,0.25)' : BORDER.subtle}`,
              color: filterOutcome === o ? '#4a90b8' : TEXT.secondary,
            }}
          >
            {o === 'all' ? 'All outcomes' : o}
          </button>
        ))}
        <div className="w-px h-5 self-center" style={{ background: BORDER.subtle }} />
        {['all', ...packs].map((p) => (
          <button
            key={p}
            onClick={() => setFilterPack(p)}
            className="px-2.5 py-1 rounded text-[9px] font-medium capitalize transition-all"
            style={{
              background: filterPack === p ? 'rgba(74,144,184,0.12)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${filterPack === p ? 'rgba(74,144,184,0.25)' : BORDER.subtle}`,
              color: filterPack === p ? '#4a90b8' : TEXT.secondary,
            }}
          >
            {p === 'all' ? 'All packs' : p}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.map((r) => (
          <OutcomeCard key={r.id} rec={r} />
        ))}
      </div>
    </div>
  );
}
