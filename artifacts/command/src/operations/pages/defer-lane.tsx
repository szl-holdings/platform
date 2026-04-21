import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Filter,
  Pause,
  Shield,
} from 'lucide-react';
import { useState } from 'react';

const BG = { page: '#080c14', surface: '#0c1018', elevated: '#10141e', panel: '#0e1219' };
const BORDER = { subtle: 'rgba(255,255,255,0.04)', muted: 'rgba(255,255,255,0.06)' };
const TEXT = {
  primary: 'rgba(255,255,255,0.88)',
  secondary: 'rgba(255,255,255,0.55)',
  tertiary: 'rgba(255,255,255,0.28)',
  muted: 'rgba(255,255,255,0.14)',
};
const DEFER_COLOR = '#6b8f71';

interface DeferItem {
  id: string;
  title: string;
  description: string;
  pack: string;
  packColor: string;
  category: string;
  safeUntil: string;
  safeReason: string;
  deferConditions: string[];
  escalateIf: string;
  impact: string;
  estimatedEffort: string;
}

const DEFER_ITEMS: DeferItem[] = [
  {
    id: 'DEF-001',
    title: 'Security vendor background check — Aegis onboarding',
    description:
      'New physical security vendor cannot commence until background checks clear. HR vendor has 5-day processing backlog — this is an external dependency, not an internal delay.',
    pack: 'PARAGON',
    packColor: '#4f6ef7',
    category: 'dependency',
    safeUntil: 'Apr 8, 2026',
    safeReason:
      'Background check processing SLA is 5 business days. No contractual penalty until Apr 8. Existing security coverage is adequate during this window.',
    deferConditions: [
      'HR vendor SLA remains < 7 days',
      'No security incident requiring immediate additional coverage',
      'Vendor passes background check when complete',
    ],
    escalateIf: 'HR vendor SLA exceeds 7 days OR any security coverage gap emerges',
    impact: '$140K',
    estimatedEffort: 'Low — vendor-managed process',
  },
  {
    id: 'DEF-002',
    title: 'Terra Building 7A appraisal report — asset refinancing',
    description:
      'Third-party appraiser has not delivered final report. Closing window does not close for 8 days. The appraisal is in progress — no action is possible until the report is delivered.',
    pack: 'DOMAINE',
    packColor: '#a07848',
    category: 'resource',
    safeUntil: 'Apr 9, 2026',
    safeReason:
      'Refinancing closing window is 8 days. Appraisal is externally managed and on track. No penalty until closing window expires.',
    deferConditions: [
      'Appraiser delivers on schedule (Apr 8)',
      'Interest rate environment remains stable',
      'Closing window not shortened by lender',
    ],
    escalateIf: 'Appraiser misses delivery date OR lender shortens closing window',
    impact: '$290K',
    estimatedEffort: 'Low — follow-up only',
  },
  {
    id: 'DEF-003',
    title: 'PRISM Q3 pricing model update',
    description:
      'Q3 pricing model needs annual calibration. Q2 pricing revision is in progress and must be resolved first. Q3 model work cannot begin until Q2 baseline is confirmed.',
    pack: 'PRAXIS',
    packColor: '#d4a054',
    category: 'dependency',
    safeUntil: 'Apr 15, 2026',
    safeReason:
      'Q3 model work depends on Q2 pricing finalization. Q2 is expected to resolve within 3 days. Starting Q3 work before Q2 is confirmed would require rework.',
    deferConditions: [
      'Q2 pricing is approved and confirmed',
      'Market conditions remain comparable to Q2 assumptions',
    ],
    escalateIf: 'Q2 pricing is not resolved by Apr 7 OR market conditions shift significantly',
    impact: '$0 immediate',
    estimatedEffort: 'Medium — requires analyst time',
  },
  {
    id: 'DEF-004',
    title: 'Vessels fleet maintenance scheduling — M/V Pacific Star',
    description:
      'Scheduled maintenance window is 3 weeks away. Vessel is currently operational and performance metrics are within normal range. Early scheduling would pull the vessel from active rotation unnecessarily.',
    pack: 'SEXTANT',
    packColor: '#38bdf8',
    category: 'scheduled',
    safeUntil: 'Apr 20, 2026',
    safeReason:
      'Maintenance window is fixed at Apr 20. Vessel performance is nominal. Pulling early would cost approximately $380K in missed charter revenue.',
    deferConditions: [
      'Engine metrics remain within normal range (currently 98% nominal)',
      'No port authority mandates early inspection',
      'Charter schedule holds',
    ],
    escalateIf:
      'Engine performance degrades below 90% nominal OR port authority issues inspection notice',
    impact: '$380K charter revenue at risk if pulled early',
    estimatedEffort: 'Low — pre-scheduled',
  },
  {
    id: 'DEF-005',
    title: 'Audit log archival — Trust & Audit system',
    description:
      'Monthly audit log archival is 2 days overdue but within the 7-day compliance grace window. No data is at risk. This is a routine maintenance task that can be batched.',
    pack: 'PRAXIS',
    packColor: '#d4a054',
    category: 'compliance',
    safeUntil: 'Apr 5, 2026',
    safeReason:
      'Compliance grace window is 7 days. Current archival is 2 days delayed. No data risk — logs are stored in hot storage until archived. Batching with next scheduled maintenance saves ops time.',
    deferConditions: [
      'No compliance audit scheduled before Apr 5',
      'Log storage capacity remains > 60%',
    ],
    escalateIf: 'Compliance audit is scheduled before Apr 5 OR storage falls below 60%',
    impact: '$0 if completed within grace window',
    estimatedEffort: 'Very Low — automated batch job',
  },
];

const CATEGORY_LABELS: Record<string, string> = {
  dependency: 'Dependency',
  resource: 'Resource',
  scheduled: 'Scheduled',
  compliance: 'Compliance',
};

const CATEGORY_COLORS: Record<string, string> = {
  dependency: '#4a90b8',
  resource: '#8b7ac8',
  scheduled: '#6b8f71',
  compliance: '#c8953c',
};

function DeferCard({ item }: { item: DeferItem }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="rounded-md overflow-hidden"
      style={{ background: BG.surface, border: `1px solid rgba(107,143,113,0.15)` }}
    >
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-start gap-3 p-4 text-left hover:bg-white/[0.01] transition-colors"
      >
        <div
          className="w-7 h-7 rounded flex items-center justify-center shrink-0 mt-0.5"
          style={{ background: 'rgba(107,143,113,0.10)' }}
        >
          <Pause className="w-3.5 h-3.5" style={{ color: DEFER_COLOR }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span
              className="text-[8px] font-bold tracking-wider px-1.5 py-0.5 rounded uppercase"
              style={{ color: item.packColor, background: `${item.packColor}14` }}
            >
              {item.pack}
            </span>
            <span
              className="text-[8px] px-1.5 py-px rounded capitalize"
              style={{
                color: CATEGORY_COLORS[item.category] ?? TEXT.muted,
                background: `${CATEGORY_COLORS[item.category] ?? '#fff'}12`,
              }}
            >
              {CATEGORY_LABELS[item.category] ?? item.category}
            </span>
            <span className="text-[8px] font-mono" style={{ color: TEXT.muted }}>
              {item.id}
            </span>
          </div>
          <p className="text-[11px] font-medium leading-snug mb-1" style={{ color: TEXT.primary }}>
            {item.title}
          </p>
          <div className="flex items-center gap-1.5 text-[8px]">
            <Calendar className="w-2.5 h-2.5" style={{ color: DEFER_COLOR }} />
            <span style={{ color: DEFER_COLOR }}>Safe until {item.safeUntil}</span>
            <span style={{ color: TEXT.muted }}>·</span>
            <span style={{ color: TEXT.muted }}>{item.impact}</span>
          </div>
        </div>
        <div className="shrink-0">
          {expanded ? (
            <ChevronDown className="w-3.5 h-3.5" style={{ color: TEXT.tertiary }} />
          ) : (
            <ChevronRight className="w-3.5 h-3.5" style={{ color: TEXT.tertiary }} />
          )}
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-5 space-y-3" style={{ borderTop: `1px solid ${BORDER.subtle}` }}>
          <div className="pt-3">
            <p className="text-[10px] leading-relaxed" style={{ color: TEXT.secondary }}>
              {item.description}
            </p>
          </div>

          <div
            className="rounded p-3"
            style={{
              background: 'rgba(107,143,113,0.06)',
              border: '1px solid rgba(107,143,113,0.15)',
            }}
          >
            <div
              className="text-[8px] uppercase tracking-wide mb-1.5"
              style={{ color: 'rgba(107,143,113,0.7)' }}
            >
              Why it's safe to defer
            </div>
            <p className="text-[9px] leading-relaxed" style={{ color: DEFER_COLOR }}>
              {item.safeReason}
            </p>
          </div>

          <div>
            <div
              className="text-[8px] uppercase tracking-wide mb-1.5"
              style={{ color: TEXT.muted }}
            >
              Safe-to-defer conditions
            </div>
            <div className="space-y-1.5">
              {item.deferConditions.map((cond, i) => (
                <div key={i} className="flex items-start gap-2 text-[9px]">
                  <CheckCircle2
                    className="w-3 h-3 shrink-0 mt-0.5"
                    style={{ color: DEFER_COLOR }}
                  />
                  <span style={{ color: TEXT.secondary }}>{cond}</span>
                </div>
              ))}
            </div>
          </div>

          <div
            className="rounded p-3"
            style={{ background: 'rgba(196,90,74,0.06)', border: '1px solid rgba(196,90,74,0.14)' }}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <AlertTriangle className="w-3 h-3" style={{ color: '#c45a4a' }} />
              <span className="text-[8px] uppercase tracking-wide" style={{ color: '#c45a4a' }}>
                Escalate if
              </span>
            </div>
            <p className="text-[9px]" style={{ color: 'rgba(196,90,74,0.85)' }}>
              {item.escalateIf}
            </p>
          </div>

          <div className="flex items-center gap-4 text-[8px]">
            <span style={{ color: TEXT.muted }}>
              Impact: <span style={{ color: TEXT.secondary }}>{item.impact}</span>
            </span>
            <span style={{ color: TEXT.muted }}>
              Effort: <span style={{ color: TEXT.secondary }}>{item.estimatedEffort}</span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DeferLanePage() {
  const [filterPack, setFilterPack] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');

  const packs = Array.from(new Set(DEFER_ITEMS.map((d) => d.pack)));
  const categories = Array.from(new Set(DEFER_ITEMS.map((d) => d.category)));

  const filtered = DEFER_ITEMS.filter((d) => {
    if (filterPack !== 'all' && d.pack !== filterPack) return false;
    if (filterCategory !== 'all' && d.category !== filterCategory) return false;
    return true;
  });

  return (
    <div className="p-4 md:p-5 space-y-5" style={{ background: BG.page }}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Pause className="w-3.5 h-3.5" style={{ color: DEFER_COLOR }} />
            <span
              className="text-[9px] font-mono uppercase tracking-widest"
              style={{ color: DEFER_COLOR }}
            >
              Defer Lane
            </span>
          </div>
          <h1 className="text-lg font-bold tracking-tight" style={{ color: TEXT.primary }}>
            What Can Wait Safely?
          </h1>
          <p className="text-[11px] mt-0.5" style={{ color: TEXT.secondary }}>
            Items explicitly marked safe-to-defer with clear reasoning — reducing cognitive overload
          </p>
        </div>
        <div
          className="rounded px-2.5 py-2 text-center shrink-0"
          style={{
            background: 'rgba(107,143,113,0.08)',
            border: '1px solid rgba(107,143,113,0.18)',
          }}
        >
          <div className="text-[13px] font-mono font-bold" style={{ color: DEFER_COLOR }}>
            {DEFER_ITEMS.length}
          </div>
          <div
            className="text-[7px] uppercase tracking-wider"
            style={{ color: 'rgba(107,143,113,0.55)' }}
          >
            Safe to defer
          </div>
        </div>
      </div>

      <div
        className="rounded-md p-3 flex items-start gap-3"
        style={{ background: BG.elevated, border: `1px solid ${BORDER.subtle}` }}
      >
        <Shield className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: TEXT.muted }} />
        <p className="text-[10px] leading-relaxed" style={{ color: TEXT.tertiary }}>
          The Defer Lane explicitly marks items that do not require action today, with clear
          reasoning for why they're safe and conditions that would change this assessment. Items
          here are removed from the urgent queue to reduce cognitive overload. Each item shows
          escalation triggers so nothing falls through the cracks.
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
              background: filterPack === p ? 'rgba(107,143,113,0.12)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${filterPack === p ? 'rgba(107,143,113,0.25)' : BORDER.subtle}`,
              color: filterPack === p ? DEFER_COLOR : TEXT.secondary,
            }}
          >
            {p === 'all' ? 'All packs' : p}
          </button>
        ))}
        <div className="w-px h-5 self-center" style={{ background: BORDER.subtle }} />
        {['all', ...categories].map((c) => (
          <button
            key={c}
            onClick={() => setFilterCategory(c)}
            className="px-2.5 py-1 rounded text-[9px] font-medium capitalize transition-all"
            style={{
              background:
                filterCategory === c ? 'rgba(107,143,113,0.12)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${filterCategory === c ? 'rgba(107,143,113,0.25)' : BORDER.subtle}`,
              color: filterCategory === c ? DEFER_COLOR : TEXT.secondary,
            }}
          >
            {c === 'all' ? 'All types' : (CATEGORY_LABELS[c] ?? c)}
          </button>
        ))}
      </div>

      <div className="space-y-2.5">
        {filtered.map((d) => (
          <DeferCard key={d.id} item={d} />
        ))}
        {filtered.length === 0 && (
          <div
            className="rounded-md py-10 flex flex-col items-center gap-3"
            style={{ background: BG.surface, border: `1px solid ${BORDER.subtle}` }}
          >
            <CheckCircle2 className="w-5 h-5" style={{ color: TEXT.muted }} />
            <p className="text-[11px]" style={{ color: TEXT.tertiary }}>
              No deferred items match the selected filters
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
