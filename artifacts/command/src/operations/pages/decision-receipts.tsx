import { ChevronDown, ChevronRight, FileText, Filter, Scale } from 'lucide-react';
import { useState } from 'react';

const BG = { page: '#080c14', surface: '#0c1018', elevated: '#10141e', panel: '#0e1219' };
const BORDER = { subtle: 'rgba(255,255,255,0.04)', muted: 'rgba(255,255,255,0.06)' };
const TEXT = {
  primary: 'rgba(255,255,255,0.88)',
  secondary: 'rgba(255,255,255,0.55)',
  tertiary: 'rgba(255,255,255,0.28)',
  muted: 'rgba(255,255,255,0.14)',
};

interface EvidenceItem {
  source: string;
  type: 'signal' | 'pattern' | 'historical' | 'external';
  weight: number;
  detail: string;
}

interface Alternative {
  option: string;
  score: number;
  whyRejected: string;
}

interface DecisionReceipt {
  id: string;
  priority: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  rank: number;
  finalScore: number;
  rankedAt: string;
  pack: string;
  packColor: string;
  summary: string;
  scoringFactors: {
    actionability: number;
    ownerConfidence: number;
    evidenceStrength: number;
    severityWeight: number;
    ageMultiplier: number;
  };
  evidence: EvidenceItem[];
  alternatives: Alternative[];
  confidence: 'high' | 'medium' | 'low';
  confidenceReason: string;
}

const RECEIPTS: DecisionReceipt[] = [
  {
    id: 'RCP-001',
    priority: 'Authorize fuel surcharge — 3 vessels blocked',
    severity: 'critical',
    rank: 1,
    finalScore: 96,
    rankedAt: '2m ago',
    pack: 'Vessels',
    packColor: '#38bdf8',
    summary:
      'Ranked #1 because the owner is clear (Finance VP), the action is unambiguous (approve or delegate), and SLA breach activates in 4h with $2.1M penalty exposure. Evidence from 3 correlated signals and a historical pattern of approval delays.',
    scoringFactors: {
      actionability: 95,
      ownerConfidence: 90,
      evidenceStrength: 88,
      severityWeight: 100,
      ageMultiplier: 97,
    },
    evidence: [
      {
        source: 'Vessels Fleet Signal',
        type: 'signal',
        weight: 0.35,
        detail: '3 vessels outside SLA — fuel surcharge pending 22h',
      },
      {
        source: 'Finance Queue Monitor',
        type: 'signal',
        weight: 0.25,
        detail: 'VP approval queue age: 22h, average resolution 6h',
      },
      {
        source: 'Historical Pattern',
        type: 'historical',
        weight: 0.25,
        detail:
          'Same approval chain stalled 4 times in past 6 months, avg resolution: escalate to CFO',
      },
      {
        source: 'SLA Engine',
        type: 'external',
        weight: 0.15,
        detail: 'Automated SLA breach prediction: 94% probability within 4h',
      },
    ],
    alternatives: [
      {
        option: 'Rank below AR conflict',
        score: 71,
        whyRejected: 'AR impact is lower ($650K vs $2.1M) and no time-bound SLA breach',
      },
      {
        option: 'Rank below Q2 pricing',
        score: 68,
        whyRejected: 'Q2 pricing has longer window (17h) — fuel surcharge breach is imminent',
      },
    ],
    confidence: 'high',
    confidenceReason: 'Owner identified, action clear, time pressure confirmed by SLA engine',
  },
  {
    id: 'RCP-002',
    priority: 'Approve Q2 pricing revision — board deadline',
    severity: 'critical',
    rank: 2,
    finalScore: 89,
    rankedAt: '8m ago',
    pack: 'PRISM',
    packColor: '#d4a054',
    summary:
      'Ranked #2 because the owner (CEO) is identified and the action is clear, but the window (17h) gives slightly more runway than the vessel SLA. Evidence from 4 correlated signals and a pricing expiry model.',
    scoringFactors: {
      actionability: 90,
      ownerConfidence: 85,
      evidenceStrength: 82,
      severityWeight: 95,
      ageMultiplier: 84,
    },
    evidence: [
      {
        source: 'PRISM Approval Queue',
        type: 'signal',
        weight: 0.3,
        detail: 'Q2 pricing 31h in queue — CEO calendar blocked',
      },
      {
        source: 'Revenue Model',
        type: 'pattern',
        weight: 0.25,
        detail: 'Pricing window closes in 17h — market conditions shift at midnight',
      },
      {
        source: 'Historical Pattern',
        type: 'historical',
        weight: 0.25,
        detail: 'Similar calendar conflicts resolved via EA escalation in previous quarters',
      },
      {
        source: 'Board Calendar',
        type: 'external',
        weight: 0.2,
        detail: 'Board distribution deadline confirmed by EA: T+48h from submission',
      },
    ],
    alternatives: [
      {
        option: 'Rank #1 ahead of vessels',
        score: 82,
        whyRejected: 'Vessels fuel surcharge has imminent SLA breach (4h) — pricing has 17h window',
      },
      {
        option: 'Rank #3 behind AR conflict',
        score: 55,
        whyRejected: 'Pricing has higher total impact ($1.2M) and harder deadline than AR conflict',
      },
    ],
    confidence: 'high',
    confidenceReason:
      'Owner confirmed, window modeled from board calendar, historical resolution path known',
  },
  {
    id: 'RCP-003',
    priority: 'Resolve AR ownership conflict — payments withheld',
    severity: 'high',
    rank: 3,
    finalScore: 78,
    rankedAt: '14m ago',
    pack: 'PRISM',
    packColor: '#d4a054',
    summary:
      'Ranked #3 because the resolution is straightforward (single assignment) but requires COO involvement and has no hard deadline. Ownership is contested, reducing the actionability score slightly.',
    scoringFactors: {
      actionability: 75,
      ownerConfidence: 60,
      evidenceStrength: 80,
      severityWeight: 80,
      ageMultiplier: 75,
    },
    evidence: [
      {
        source: 'Finance Reconciliation Engine',
        type: 'signal',
        weight: 0.4,
        detail: 'Duplicate ownership claim detected — 2 team leads flagged same AR account',
      },
      {
        source: 'Payments Queue',
        type: 'signal',
        weight: 0.3,
        detail: '$650K in payments withheld pending ownership resolution — 18h hold',
      },
      {
        source: 'Org Chart Engine',
        type: 'pattern',
        weight: 0.3,
        detail: 'Ownership gap pattern: restructuring 6 weeks ago created 3 contested accounts',
      },
    ],
    alternatives: [
      {
        option: 'Rank #2 above Q2 pricing',
        score: 62,
        whyRejected: 'Q2 pricing has harder deadline and higher total exposure',
      },
      {
        option: 'Rank #4 behind lease renewal',
        score: 58,
        whyRejected: 'AR conflict has more immediate cashflow impact than lease renewal paperwork',
      },
    ],
    confidence: 'medium',
    confidenceReason:
      'Ownership gap identified but resolution path requires COO confirmation — contested ownership reduces confidence slightly',
  },
];

const SEVERITY_COLORS: Record<string, { fg: string; bg: string }> = {
  critical: { fg: '#c45a4a', bg: 'rgba(196,90,74,0.09)' },
  high: { fg: '#c8953c', bg: 'rgba(200,149,60,0.09)' },
  medium: { fg: '#d4a054', bg: 'rgba(212,160,84,0.09)' },
  low: { fg: '#4a90b8', bg: 'rgba(74,144,184,0.09)' },
};

const EVIDENCE_TYPE_COLORS: Record<string, string> = {
  signal: '#38bdf8',
  pattern: '#8b7ac8',
  historical: '#d4a054',
  external: '#6b8f71',
};

function ScoreBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[8px] uppercase tracking-wide" style={{ color: TEXT.muted }}>
          {label}
        </span>
        <span className="text-[9px] font-mono" style={{ color }}>
          {value}
        </span>
      </div>
      <div
        className="h-1 rounded-full overflow-hidden"
        style={{ background: 'rgba(255,255,255,0.05)' }}
      >
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${value}%`, background: color }}
        />
      </div>
    </div>
  );
}

function ReceiptCard({ receipt }: { receipt: DecisionReceipt }) {
  const [expanded, setExpanded] = useState(false);
  const sc = SEVERITY_COLORS[receipt.severity];
  const confColor =
    receipt.confidence === 'high'
      ? '#6b8f71'
      : receipt.confidence === 'medium'
        ? '#c8953c'
        : '#c45a4a';

  return (
    <div
      className="rounded-md overflow-hidden"
      style={{
        background: BG.surface,
        border: `1px solid ${sc.bg === 'rgba(196,90,74,0.09)' ? 'rgba(196,90,74,0.15)' : BORDER.subtle}`,
      }}
    >
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-start gap-3 p-4 text-left hover:bg-white/[0.01] transition-colors"
      >
        <div
          className="w-7 h-7 rounded flex items-center justify-center shrink-0 mt-0.5"
          style={{ background: sc.bg }}
        >
          <span className="text-[10px] font-mono font-bold" style={{ color: sc.fg }}>
            #{receipt.rank}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span
              className="text-[8px] font-bold tracking-wider px-1.5 py-0.5 rounded uppercase"
              style={{ color: receipt.packColor, background: `${receipt.packColor}14` }}
            >
              {receipt.pack}
            </span>
            <span
              className="text-[8px] px-1.5 py-px rounded uppercase"
              style={{ color: sc.fg, background: sc.bg }}
            >
              {receipt.severity}
            </span>
            <span className="text-[8px] font-mono" style={{ color: TEXT.muted }}>
              {receipt.id}
            </span>
            <span className="ml-auto text-[8px] font-mono" style={{ color: TEXT.muted }}>
              {receipt.rankedAt}
            </span>
          </div>
          <p className="text-[11px] font-medium leading-snug" style={{ color: TEXT.primary }}>
            {receipt.priority}
          </p>
        </div>
        <div className="shrink-0 flex flex-col items-end gap-1.5 ml-2">
          <div className="flex items-center gap-1">
            <div className="text-[12px] font-mono font-bold" style={{ color: '#d4a054' }}>
              {receipt.finalScore}
            </div>
            <span className="text-[7px]" style={{ color: TEXT.muted }}>
              /100
            </span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: confColor }} />
            <span className="text-[7px] capitalize" style={{ color: confColor }}>
              {receipt.confidence}
            </span>
          </div>
          {expanded ? (
            <ChevronDown className="w-3.5 h-3.5" style={{ color: TEXT.tertiary }} />
          ) : (
            <ChevronRight className="w-3.5 h-3.5" style={{ color: TEXT.tertiary }} />
          )}
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-5 space-y-4" style={{ borderTop: `1px solid ${BORDER.subtle}` }}>
          <div className="pt-3">
            <p className="text-[10px] leading-relaxed" style={{ color: TEXT.secondary }}>
              {receipt.summary}
            </p>
          </div>

          <div
            className="rounded p-3 space-y-2"
            style={{ background: BG.elevated, border: `1px solid ${BORDER.subtle}` }}
          >
            <div
              className="text-[8px] uppercase tracking-widest font-medium mb-2"
              style={{ color: TEXT.muted }}
            >
              Scoring Factors
            </div>
            <ScoreBar
              label="Actionability"
              value={receipt.scoringFactors.actionability}
              color="#d4a054"
            />
            <ScoreBar
              label="Owner Confidence"
              value={receipt.scoringFactors.ownerConfidence}
              color="#8b7ac8"
            />
            <ScoreBar
              label="Evidence Strength"
              value={receipt.scoringFactors.evidenceStrength}
              color="#4a90b8"
            />
            <ScoreBar
              label="Severity Weight"
              value={receipt.scoringFactors.severityWeight}
              color="#c45a4a"
            />
            <ScoreBar
              label="Age Multiplier"
              value={receipt.scoringFactors.ageMultiplier}
              color="#c8953c"
            />
          </div>

          <div>
            <div
              className="text-[8px] uppercase tracking-widest font-medium mb-2"
              style={{ color: TEXT.muted }}
            >
              Evidence Used
            </div>
            <div className="space-y-2">
              {receipt.evidence.map((ev, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2.5 rounded p-2.5"
                  style={{ background: BG.elevated, border: `1px solid ${BORDER.subtle}` }}
                >
                  <div
                    className="w-1.5 h-1.5 rounded-full shrink-0 mt-1"
                    style={{ background: EVIDENCE_TYPE_COLORS[ev.type] }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[9px] font-medium" style={{ color: TEXT.primary }}>
                        {ev.source}
                      </span>
                      <span
                        className="text-[7px] px-1 py-px rounded capitalize"
                        style={{
                          color: EVIDENCE_TYPE_COLORS[ev.type],
                          background: `${EVIDENCE_TYPE_COLORS[ev.type]}12`,
                        }}
                      >
                        {ev.type}
                      </span>
                    </div>
                    <p className="text-[9px]" style={{ color: TEXT.secondary }}>
                      {ev.detail}
                    </p>
                  </div>
                  <div className="shrink-0">
                    <span className="text-[8px] font-mono" style={{ color: TEXT.muted }}>
                      {Math.round(ev.weight * 100)}% weight
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div
              className="text-[8px] uppercase tracking-widest font-medium mb-2"
              style={{ color: TEXT.muted }}
            >
              Alternatives Considered
            </div>
            <div className="space-y-2">
              {receipt.alternatives.map((alt, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2.5 rounded p-2.5"
                  style={{ background: BG.elevated, border: `1px solid ${BORDER.subtle}` }}
                >
                  <div
                    className="text-[8px] font-mono px-1.5 py-px rounded shrink-0"
                    style={{ color: TEXT.muted, background: 'rgba(255,255,255,0.04)' }}
                  >
                    {alt.score}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[9px] font-medium mb-0.5" style={{ color: TEXT.secondary }}>
                      {alt.option}
                    </p>
                    <p className="text-[8px]" style={{ color: TEXT.tertiary }}>
                      Rejected: {alt.whyRejected}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div
            className="rounded p-2.5"
            style={{ background: BG.elevated, border: `1px solid ${BORDER.subtle}` }}
          >
            <div
              className="text-[8px] uppercase tracking-widest mb-1"
              style={{ color: TEXT.muted }}
            >
              Confidence Assessment
            </div>
            <div className="flex items-start gap-2">
              <div
                className="w-1.5 h-1.5 rounded-full shrink-0 mt-1"
                style={{ background: confColor }}
              />
              <p className="text-[9px]" style={{ color: TEXT.secondary }}>
                {receipt.confidenceReason}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DecisionReceiptsPage() {
  const [filterPack, setFilterPack] = useState('all');
  const [filterSev, setFilterSev] = useState('all');

  const packs = Array.from(new Set(RECEIPTS.map((r) => r.pack)));
  const filtered = RECEIPTS.filter((r) => {
    if (filterPack !== 'all' && r.pack !== filterPack) return false;
    if (filterSev !== 'all' && r.severity !== filterSev) return false;
    return true;
  });

  return (
    <div className="p-4 md:p-5 space-y-5" style={{ background: BG.page }}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FileText className="w-3.5 h-3.5" style={{ color: '#8b7ac8' }} />
            <span
              className="text-[9px] font-mono uppercase tracking-widest"
              style={{ color: '#8b7ac8' }}
            >
              Decision Receipts
            </span>
          </div>
          <h1 className="text-lg font-bold tracking-tight" style={{ color: TEXT.primary }}>
            Priority Ranking Evidence
          </h1>
          <p className="text-[11px] mt-0.5" style={{ color: TEXT.secondary }}>
            Every surfaced priority shows what evidence was used, how it was weighted, and why it
            was ranked above alternatives
          </p>
        </div>
      </div>

      <div
        className="rounded-md p-3 flex items-start gap-3"
        style={{ background: BG.elevated, border: `1px solid ${BORDER.subtle}` }}
      >
        <Scale className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: TEXT.tertiary }} />
        <p className="text-[10px] leading-relaxed" style={{ color: TEXT.tertiary }}>
          Every ranked priority has a receipt. Receipts show the scoring factors (actionability,
          owner confidence, evidence strength, severity, age), the evidence sources and weights, and
          the alternatives that were considered and rejected. This is the algorithm doing the
          talking.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="flex items-center gap-1.5 text-[9px]" style={{ color: TEXT.tertiary }}>
          <Filter className="w-3 h-3" />
          <span>Filter:</span>
        </div>
        {['all', ...packs].map((p) => (
          <button
            key={p}
            onClick={() => setFilterPack(p)}
            className="px-2.5 py-1 rounded text-[9px] font-medium capitalize transition-all"
            style={{
              background: filterPack === p ? 'rgba(139,122,200,0.12)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${filterPack === p ? 'rgba(139,122,200,0.25)' : BORDER.subtle}`,
              color: filterPack === p ? '#8b7ac8' : TEXT.secondary,
            }}
          >
            {p === 'all' ? 'All packs' : p}
          </button>
        ))}
        <div className="w-px h-5 self-center" style={{ background: BORDER.subtle }} />
        {['all', 'critical', 'high', 'medium', 'low'].map((s) => (
          <button
            key={s}
            onClick={() => setFilterSev(s)}
            className="px-2.5 py-1 rounded text-[9px] font-medium capitalize transition-all"
            style={{
              background: filterSev === s ? 'rgba(139,122,200,0.12)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${filterSev === s ? 'rgba(139,122,200,0.25)' : BORDER.subtle}`,
              color: filterSev === s ? '#8b7ac8' : TEXT.secondary,
            }}
          >
            {s === 'all' ? 'All severity' : s}
          </button>
        ))}
      </div>

      <div className="space-y-2.5">
        {filtered.map((r) => (
          <ReceiptCard key={r.id} receipt={r} />
        ))}
        {filtered.length === 0 && (
          <div
            className="rounded-md py-10 flex flex-col items-center gap-3"
            style={{ background: BG.surface, border: `1px solid ${BORDER.subtle}` }}
          >
            <FileText className="w-5 h-5" style={{ color: TEXT.muted }} />
            <p className="text-[11px]" style={{ color: TEXT.tertiary }}>
              No receipts match the selected filters
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
