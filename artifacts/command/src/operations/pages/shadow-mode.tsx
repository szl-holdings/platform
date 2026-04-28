import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  Filter,
  GitCompare,
  TrendingUp,
} from 'lucide-react';
import React, { useState } from 'react';

const BG = { page: 'var(--gi-bg-base)', surface: 'var(--gi-bg-surface)', elevated: 'var(--gi-bg-raised)', panel: '#0e1219' };
const BORDER = { subtle: 'rgba(255,255,255,0.04)', muted: 'rgba(255,255,255,0.06)' };
const TEXT = {
  primary: 'rgba(255,255,255,0.88)',
  secondary: 'rgba(255,255,255,0.55)',
  tertiary: 'rgba(255,255,255,0.28)',
  muted: 'rgba(255,255,255,0.14)',
};
const SHADOW_COLOR = '#8b7ac8';

type ComparisonOutcome = 'ai_better' | 'human_better' | 'aligned' | 'diverged';

interface ShadowComparison {
  id: string;
  title: string;
  pack: string;
  packColor: string;
  timestamp: string;
  aiRecommendation: string;
  humanDecision: string;
  outcome: ComparisonOutcome;
  aiScore: number;
  humanScore: number;
  impactDelta: string;
  notes: string;
}

const COMPARISONS: ShadowComparison[] = [
  {
    id: 'SHD-042',
    title: 'Fuel surcharge approval routing',
    pack: 'SEXTANT',
    packColor: '#38bdf8',
    timestamp: 'Apr 3, 9:11 AM',
    aiRecommendation:
      'Escalate immediately to CFO — Finance VP in calendar conflict, SLA breach in 4h',
    humanDecision: 'Waited for Finance VP — resolved 2h later, SLA breach avoided by margin',
    outcome: 'ai_better',
    aiScore: 96,
    humanScore: 71,
    impactDelta: 'AI path saved 2h and reduced SLA risk from 45% to 3%',
    notes:
      'Human decision achieved the same outcome but with significantly less runway. AI recommendation would have resolved 2h earlier.',
  },
  {
    id: 'SHD-041',
    title: 'AR account ownership assignment',
    pack: 'PRAXIS',
    packColor: '#d4a054',
    timestamp: 'Apr 3, 10:12 AM',
    aiRecommendation: 'Auto-assign to Finance Team A based on org chart and workload',
    humanDecision: 'COO manually reviewed and assigned to Finance Team B instead',
    outcome: 'human_better',
    aiScore: 75,
    humanScore: 91,
    impactDelta: 'Human decision was superior — Team B had capacity; Team A was at 94% load',
    notes:
      'AI org chart data was stale by 3 days. COO had current context on team capacity. Model needs fresher org data integration.',
  },
  {
    id: 'SHD-039',
    title: 'M/V Meridian alternate route selection',
    pack: 'SEXTANT',
    packColor: '#38bdf8',
    timestamp: 'Apr 2, 3:14 PM',
    aiRecommendation: 'Route via Cape Town — 12% fuel savings, 6h ETA extension acceptable',
    humanDecision: 'Approved Cape Town routing as recommended',
    outcome: 'aligned',
    aiScore: 88,
    humanScore: 88,
    impactDelta: 'Identical outcome — $380K savings achieved',
    notes:
      'Perfect alignment. AI and human assessment matched on routing, trade-offs, and timeline.',
  },
  {
    id: 'SHD-037',
    title: 'DOMAINE lease renewal — auto-approve low risk',
    pack: 'DOMAINE',
    packColor: '#a07848',
    timestamp: 'Apr 1, 9:00 AM',
    aiRecommendation: 'Auto-approve — document appears complete, low risk category',
    humanDecision: 'Rejected AI recommendation — manual review revealed exhibit B missing',
    outcome: 'human_better',
    aiScore: 62,
    humanScore: 95,
    impactDelta: 'Human review prevented a compliance breach and potential void of $320K lease',
    notes:
      "AI missed exhibit B absence because document metadata showed 'complete' status. Underlying document scanner integration needs improvement.",
  },
  {
    id: 'SHD-035',
    title: 'PARAGON vendor onboarding — defer or expedite?',
    pack: 'PARAGON',
    packColor: '#4f6ef7',
    timestamp: 'Apr 1, 11:00 AM',
    aiRecommendation:
      'Defer 5 days — background check SLA window has slack, existing coverage adequate',
    humanDecision: 'Accepted defer recommendation',
    outcome: 'aligned',
    aiScore: 91,
    humanScore: 91,
    impactDelta: 'Correct deferral — no coverage gap, $0 penalty',
    notes:
      'AI correctly identified the safe-to-defer window. Human confirmed and accepted. Model confidence was high due to clear SLA data.',
  },
  {
    id: 'SHD-033',
    title: 'Q1 AR reconciliation gap escalation',
    pack: 'PRAXIS',
    packColor: '#d4a054',
    timestamp: 'Mar 30, 2:15 PM',
    aiRecommendation: 'Flag to Finance VP immediately — $890K at risk, 14h age',
    humanDecision: 'Escalated as recommended — resolved same day',
    outcome: 'aligned',
    aiScore: 93,
    humanScore: 93,
    impactDelta: '$910K reconciled — 2% above forecast',
    notes:
      'AI recommendation followed exactly. Outcome slightly exceeded forecast due to additional items surfaced during review.',
  },
];

const OUTCOME_CONFIGS: Record<
  ComparisonOutcome,
  { label: string; color: string; bg: string; icon: React.ElementType }
> = {
  ai_better: {
    label: 'AI was better',
    color: SHADOW_COLOR,
    bg: 'rgba(139,122,200,0.09)',
    icon: TrendingUp,
  },
  human_better: {
    label: 'Human was better',
    color: '#4a90b8',
    bg: 'rgba(74,144,184,0.09)',
    icon: CheckCircle2,
  },
  aligned: { label: 'Aligned', color: '#6b8f71', bg: 'rgba(107,143,113,0.09)', icon: CheckCircle2 },
  diverged: {
    label: 'Diverged',
    color: '#c45a4a',
    bg: 'rgba(196,90,74,0.09)',
    icon: AlertTriangle,
  },
};

function ComparisonCard({ comp }: { comp: ShadowComparison }) {
  const [expanded, setExpanded] = useState(false);
  const outcomeConfig = OUTCOME_CONFIGS[comp.outcome];
  const OutcomeIcon = outcomeConfig.icon;

  return (
    <div
      className="rounded-md overflow-hidden"
      style={{ background: BG.surface, border: `1px solid ${BORDER.subtle}` }}
    >
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-start gap-3 p-3.5 text-left hover:bg-white/[0.01] transition-colors"
      >
        <div
          className="w-6 h-6 rounded flex items-center justify-center shrink-0 mt-0.5"
          style={{ background: outcomeConfig.bg }}
        >
          <OutcomeIcon className="w-3.5 h-3.5" style={{ color: outcomeConfig.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <span
              className="text-[8px] font-bold tracking-wider px-1.5 py-0.5 rounded uppercase"
              style={{ color: comp.packColor, background: `${comp.packColor}14` }}
            >
              {comp.pack}
            </span>
            <span className="text-[8px] font-mono" style={{ color: TEXT.muted }}>
              {comp.id}
            </span>
            <span className="text-[8px] font-mono ml-auto" style={{ color: TEXT.muted }}>
              {comp.timestamp}
            </span>
          </div>
          <p className="text-[10px] font-medium leading-snug" style={{ color: TEXT.primary }}>
            {comp.title}
          </p>
          <span
            className="text-[8px] px-1.5 py-px rounded mt-1 inline-block"
            style={{ color: outcomeConfig.color, background: outcomeConfig.bg }}
          >
            {outcomeConfig.label}
          </span>
        </div>
        <div className="shrink-0 ml-2">
          {expanded ? (
            <ChevronDown className="w-3.5 h-3.5" style={{ color: TEXT.tertiary }} />
          ) : (
            <ChevronRight className="w-3.5 h-3.5" style={{ color: TEXT.tertiary }} />
          )}
        </div>
      </button>

      {expanded && (
        <div className="px-3.5 pb-4 space-y-3" style={{ borderTop: `1px solid ${BORDER.subtle}` }}>
          <div className="pt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
            <div
              className="rounded p-3"
              style={{
                background: 'rgba(139,122,200,0.06)',
                border: '1px solid rgba(139,122,200,0.14)',
              }}
            >
              <div className="flex items-center gap-1.5 mb-1.5">
                <Eye className="w-3 h-3" style={{ color: SHADOW_COLOR }} />
                <span
                  className="text-[8px] uppercase tracking-wide"
                  style={{ color: SHADOW_COLOR }}
                >
                  AI Recommendation
                </span>
                <span className="ml-auto text-[8px] font-mono" style={{ color: SHADOW_COLOR }}>
                  {comp.aiScore}/100
                </span>
              </div>
              <p className="text-[9px] leading-relaxed" style={{ color: TEXT.secondary }}>
                {comp.aiRecommendation}
              </p>
            </div>
            <div
              className="rounded p-3"
              style={{
                background: 'rgba(74,144,184,0.06)',
                border: '1px solid rgba(74,144,184,0.14)',
              }}
            >
              <div className="flex items-center gap-1.5 mb-1.5">
                <CheckCircle2 className="w-3 h-3" style={{ color: '#4a90b8' }} />
                <span className="text-[8px] uppercase tracking-wide" style={{ color: '#4a90b8' }}>
                  Human Decision
                </span>
                <span className="ml-auto text-[8px] font-mono" style={{ color: '#4a90b8' }}>
                  {comp.humanScore}/100
                </span>
              </div>
              <p className="text-[9px] leading-relaxed" style={{ color: TEXT.secondary }}>
                {comp.humanDecision}
              </p>
            </div>
          </div>
          <div
            className="rounded p-2.5"
            style={{ background: BG.elevated, border: `1px solid ${BORDER.subtle}` }}
          >
            <div className="text-[7px] uppercase tracking-wide mb-1" style={{ color: TEXT.muted }}>
              Impact Delta
            </div>
            <p className="text-[9px]" style={{ color: outcomeConfig.color }}>
              {comp.impactDelta}
            </p>
          </div>
          <div
            className="rounded p-2.5"
            style={{ background: BG.elevated, border: `1px solid ${BORDER.subtle}` }}
          >
            <div className="text-[7px] uppercase tracking-wide mb-1" style={{ color: TEXT.muted }}>
              Notes
            </div>
            <p className="text-[9px] leading-relaxed" style={{ color: TEXT.tertiary }}>
              {comp.notes}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ShadowModePage() {
  const [shadowEnabled, setShadowEnabled] = useState(true);
  const [filterOutcome, setFilterOutcome] = useState('all');
  const [filterPack, setFilterPack] = useState('all');

  const packs = Array.from(new Set(COMPARISONS.map((c) => c.pack)));

  const filtered = COMPARISONS.filter((c) => {
    if (filterOutcome !== 'all' && c.outcome !== filterOutcome) return false;
    if (filterPack !== 'all' && c.pack !== filterPack) return false;
    return true;
  });

  const aiBetter = COMPARISONS.filter((c) => c.outcome === 'ai_better').length;
  const humanBetter = COMPARISONS.filter((c) => c.outcome === 'human_better').length;
  const aligned = COMPARISONS.filter((c) => c.outcome === 'aligned').length;
  const total = COMPARISONS.length;

  return (
    <div className="p-4 md:p-5 space-y-5" style={{ background: BG.page }}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <GitCompare className="w-3.5 h-3.5" style={{ color: SHADOW_COLOR }} />
            <span
              className="text-[9px] font-mono uppercase tracking-widest"
              style={{ color: SHADOW_COLOR }}
            >
              Shadow Mode
            </span>
          </div>
          <h1 className="text-lg font-bold tracking-tight" style={{ color: TEXT.primary }}>
            AI vs Human Decision Comparison
          </h1>
          <p className="text-[11px] mt-0.5" style={{ color: TEXT.secondary }}>
            AI recommendations run silently alongside real decisions — compare AI suggestions vs
            actual human choices
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setShadowEnabled((e) => !e)}
            className="flex items-center gap-2 px-3 py-2 rounded transition-all"
            style={{
              background: shadowEnabled ? 'rgba(139,122,200,0.12)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${shadowEnabled ? 'rgba(139,122,200,0.25)' : BORDER.subtle}`,
            }}
          >
            {shadowEnabled ? (
              <>
                <Eye className="w-3.5 h-3.5" style={{ color: SHADOW_COLOR }} />
                <span className="text-[9px] font-medium" style={{ color: SHADOW_COLOR }}>
                  Shadow Active
                </span>
              </>
            ) : (
              <>
                <EyeOff className="w-3.5 h-3.5" style={{ color: TEXT.muted }} />
                <span className="text-[9px] font-medium" style={{ color: TEXT.muted }}>
                  Shadow Off
                </span>
              </>
            )}
          </button>
        </div>
      </div>

      {shadowEnabled && (
        <div
          className="rounded-md p-3 flex items-start gap-3"
          style={{
            background: 'rgba(139,122,200,0.06)',
            border: '1px solid rgba(139,122,200,0.14)',
          }}
        >
          <Eye className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: SHADOW_COLOR }} />
          <p className="text-[10px] leading-relaxed" style={{ color: 'rgba(139,122,200,0.75)' }}>
            Shadow Mode is active. AI recommendations are generated silently for every decision
            point and compared against actual human choices. No AI suggestions are surfaced
            operationally — this is for calibration only. Results feed back into the ranking model
            to improve recommendation quality.
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          {
            label: 'AI Better',
            value: aiBetter,
            pct: Math.round((aiBetter / total) * 100),
            color: SHADOW_COLOR,
          },
          {
            label: 'Human Better',
            value: humanBetter,
            pct: Math.round((humanBetter / total) * 100),
            color: '#4a90b8',
          },
          {
            label: 'Aligned',
            value: aligned,
            pct: Math.round((aligned / total) * 100),
            color: '#6b8f71',
          },
          { label: 'Total Comparisons', value: total, pct: 100, color: TEXT.secondary },
        ].map((m) => (
          <div
            key={m.label}
            className="rounded-md p-3"
            style={{ background: BG.surface, border: `1px solid ${BORDER.subtle}` }}
          >
            <div className="text-[18px] font-mono font-bold" style={{ color: m.color }}>
              {m.value}
            </div>
            <div className="text-[9px] mb-1" style={{ color: TEXT.secondary }}>
              {m.label}
            </div>
            <div className="text-[8px] font-mono" style={{ color: TEXT.muted }}>
              {m.pct}% of total
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="flex items-center gap-1.5 text-[9px]" style={{ color: TEXT.tertiary }}>
          <Filter className="w-3 h-3" />
          <span>Filter:</span>
        </div>
        {['all', 'ai_better', 'human_better', 'aligned', 'diverged'].map((o) => (
          <button
            key={o}
            onClick={() => setFilterOutcome(o)}
            className="px-2.5 py-1 rounded text-[9px] font-medium transition-all"
            style={{
              background: filterOutcome === o ? 'rgba(139,122,200,0.12)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${filterOutcome === o ? 'rgba(139,122,200,0.25)' : BORDER.subtle}`,
              color: filterOutcome === o ? SHADOW_COLOR : TEXT.secondary,
            }}
          >
            {o === 'all' ? 'All outcomes' : o.replace('_', ' ')}
          </button>
        ))}
        <div className="w-px h-5 self-center" style={{ background: BORDER.subtle }} />
        {['all', ...packs].map((p) => (
          <button
            key={p}
            onClick={() => setFilterPack(p)}
            className="px-2.5 py-1 rounded text-[9px] font-medium capitalize transition-all"
            style={{
              background: filterPack === p ? 'rgba(139,122,200,0.12)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${filterPack === p ? 'rgba(139,122,200,0.25)' : BORDER.subtle}`,
              color: filterPack === p ? SHADOW_COLOR : TEXT.secondary,
            }}
          >
            {p === 'all' ? 'All packs' : p}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.map((c) => (
          <ComparisonCard key={c.id} comp={c} />
        ))}
        {filtered.length === 0 && (
          <div
            className="rounded-md py-10 flex flex-col items-center gap-3"
            style={{ background: BG.surface, border: `1px solid ${BORDER.subtle}` }}
          >
            <GitCompare className="w-5 h-5" style={{ color: TEXT.muted }} />
            <p className="text-[11px]" style={{ color: TEXT.tertiary }}>
              No comparisons match the selected filters
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
