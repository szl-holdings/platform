import { cn } from '@lyte/lib/utils';
import { EmptyState } from '@szl-holdings/shared-ui/EmptyState';
import {
  Activity,
  AlertTriangle,
  ChevronRight,
  Clock,
  FileText,
  Filter,
  RefreshCw,
  Users,
  Zap,
} from 'lucide-react';
import { useState } from 'react';

const BG = { page: '#080c14', surface: '#0c1018', elevated: '#10141e' };
const BORDER = { subtle: 'rgba(255,255,255,0.04)', muted: 'rgba(255,255,255,0.06)' };
const TEXT = {
  primary: 'rgba(255,255,255,0.88)',
  secondary: 'rgba(255,255,255,0.55)',
  tertiary: 'rgba(255,255,255,0.28)',
  muted: 'rgba(255,255,255,0.14)',
};
const ELECTRIC = '#2dd4bf';

type BlockerCategory = 'approval' | 'ownership' | 'compliance' | 'dependency' | 'resource';

interface Blocker {
  id: string;
  pack: string;
  packColor: string;
  title: string;
  description: string;
  category: BlockerCategory;
  severity: 'critical' | 'high' | 'medium';
  age: string;
  ageHours: number;
  impact: string;
  blockedBy: string;
  escalatable: boolean;
}

const BLOCKERS: Blocker[] = [
  {
    id: 'BLK-2041',
    pack: 'SEXTANT',
    packColor: '#38bdf8',
    title: 'Fuel surcharge approval — Fleet ETA revision stalled',
    description:
      'Three vessels awaiting fuel surcharge approval. SLA breach imminent if not resolved within 4h. Fleet operations cannot re-route until pricing is confirmed.',
    category: 'approval',
    severity: 'critical',
    age: '22h',
    ageHours: 22,
    impact: '$2.1M',
    blockedBy: 'Finance — pending VP sign-off',
    escalatable: true,
  },
  {
    id: 'BLK-2039',
    pack: 'PRAXIS',
    packColor: '#d4a054',
    title: 'Q2 pricing revision — executive approval overdue',
    description:
      'Pricing revision submitted 31h ago. Board deadline is T+48h. No response from approver chain. Downstream go-live blocked.',
    category: 'approval',
    severity: 'critical',
    age: '31h',
    ageHours: 31,
    impact: '$1.2M',
    blockedBy: 'Executive — CEO calendar conflict',
    escalatable: true,
  },
  {
    id: 'BLK-2036',
    pack: 'SEXTANT',
    packColor: '#38bdf8',
    title: 'Charter contract missing port authority countersignature',
    description:
      'Vessel departure clearance pending port authority countersignature. Legal hold in place. Operations team has not been notified.',
    category: 'compliance',
    severity: 'high',
    age: '14h',
    ageHours: 14,
    impact: '$890K',
    blockedBy: 'Port authority — Colombo office',
    escalatable: false,
  },
  {
    id: 'BLK-2033',
    pack: 'PRAXIS',
    packColor: '#d4a054',
    title: 'Accounts receivable ownership conflict unresolved',
    description:
      'Two owners claimed on same AR account. Payments withheld pending resolution. Finance reconciliation blocked.',
    category: 'ownership',
    severity: 'high',
    age: '18h',
    ageHours: 18,
    impact: '$650K',
    blockedBy: 'Operations — unresolved team assignment',
    escalatable: true,
  },
  {
    id: 'BLK-2030',
    pack: 'DOMAINE',
    packColor: '#a07848',
    title: 'Lease renewal — missing signature block on exhibit B',
    description:
      'Tenant has signed but document is missing required exhibit B attachment. Property manager unresponsive. Renewal deadline in 3 days.',
    category: 'compliance',
    severity: 'high',
    age: '2d',
    ageHours: 48,
    impact: '$320K',
    blockedBy: 'Property manager — Carlota Jo engagement',
    escalatable: false,
  },
  {
    id: 'BLK-2027',
    pack: 'PARAGON',
    packColor: '#4f6ef7',
    title: 'Security vendor onboarding — background check delayed',
    description:
      'New physical security vendor cannot commence until background checks clear. HR vendor has 5-day processing backlog.',
    category: 'dependency',
    severity: 'medium',
    age: '6d',
    ageHours: 144,
    impact: '$140K',
    blockedBy: 'HR vendor — external dependency',
    escalatable: false,
  },
  {
    id: 'BLK-2024',
    pack: 'DOMAINE',
    packColor: '#a07848',
    title: 'Asset refinancing — appraisal report incomplete',
    description:
      'Building 7A refinancing on hold. Third-party appraiser has not delivered final report. Closing window closes in 8 days.',
    category: 'resource',
    severity: 'medium',
    age: '4d',
    ageHours: 96,
    impact: '$290K',
    blockedBy: 'Appraiser — Jones & Associates',
    escalatable: false,
  },
];

const CATEGORY_LABELS: Record<BlockerCategory, string> = {
  approval: 'Approval',
  ownership: 'Ownership',
  compliance: 'Compliance',
  dependency: 'Dependency',
  resource: 'Resource',
};

const CATEGORY_COLORS: Record<BlockerCategory, string> = {
  approval: '#c8953c',
  ownership: '#8b7ac8',
  compliance: '#c45a4a',
  dependency: '#4a90b8',
  resource: '#5a8a6a',
};

function SevBar({ sev }: { sev: Blocker['severity'] }) {
  return (
    <div className="flex gap-0.5 items-center">
      {['critical', 'high', 'medium'].map((s, i) => (
        <div
          key={s}
          className="h-1 w-4 rounded-full"
          style={{
            background:
              i <= (sev === 'critical' ? 2 : sev === 'high' ? 1 : 0)
                ? sev === 'critical'
                  ? '#c45a4a'
                  : sev === 'high'
                    ? '#c8953c'
                    : '#d4a054'
                : 'rgba(255,255,255,0.06)',
          }}
        />
      ))}
    </div>
  );
}

export default function BlockerBoardPage() {
  const [filterSev, setFilterSev] = useState<string>('all');
  const [filterPack, setFilterPack] = useState<string>('all');

  const packs = Array.from(new Set(BLOCKERS.map((b) => b.pack)));
  const filtered = BLOCKERS.filter((b) => {
    if (filterSev !== 'all' && b.severity !== filterSev) return false;
    if (filterPack !== 'all' && b.pack !== filterPack) return false;
    return true;
  });

  const critical = filtered.filter((b) => b.severity === 'critical').length;

  return (
    <div className="p-4 md:p-5 space-y-5" style={{ background: BG.page }}>
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-3.5 h-3.5" style={{ color: '#c45a4a' }} />
            <span
              className="text-[9px] font-mono uppercase tracking-widest"
              style={{ color: '#c45a4a' }}
            >
              Blocker Board
            </span>
          </div>
          <h1 className="text-lg font-bold tracking-tight" style={{ color: TEXT.primary }}>
            Stuck Items Requiring Attention
          </h1>
          <p className="text-[11px] mt-0.5" style={{ color: TEXT.secondary }}>
            Items that are preventing progress across the portfolio
          </p>
        </div>
        {critical > 0 && (
          <div
            className="rounded px-3 py-2 text-center shrink-0"
            style={{ background: 'rgba(196,90,74,0.08)', border: '1px solid rgba(196,90,74,0.18)' }}
          >
            <div className="text-base font-mono font-bold" style={{ color: '#c45a4a' }}>
              {critical}
            </div>
            <div
              className="text-[7px] uppercase tracking-wider"
              style={{ color: 'rgba(196,90,74,0.55)' }}
            >
              Critical
            </div>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="flex items-center gap-1.5 text-[9px]" style={{ color: TEXT.tertiary }}>
          <Filter className="w-3 h-3" />
          <span>Filter:</span>
        </div>
        {['all', 'critical', 'high', 'medium'].map((sev) => (
          <button
            key={sev}
            onClick={() => setFilterSev(sev)}
            className="px-2.5 py-1 rounded text-[9px] font-medium capitalize transition-all"
            style={{
              background: filterSev === sev ? 'rgba(45,212,191,0.12)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${filterSev === sev ? 'rgba(45,212,191,0.25)' : BORDER.subtle}`,
              color: filterSev === sev ? ELECTRIC : TEXT.secondary,
            }}
          >
            {sev === 'all' ? 'All severity' : sev}
          </button>
        ))}
        <div className="w-px h-5 self-center" style={{ background: BORDER.subtle }} />
        {['all', ...packs].map((pack) => (
          <button
            key={pack}
            onClick={() => setFilterPack(pack)}
            className="px-2.5 py-1 rounded text-[9px] font-medium transition-all"
            style={{
              background: filterPack === pack ? 'rgba(45,212,191,0.12)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${filterPack === pack ? 'rgba(45,212,191,0.25)' : BORDER.subtle}`,
              color: filterPack === pack ? ELECTRIC : TEXT.secondary,
            }}
          >
            {pack === 'all' ? 'All packs' : pack}
          </button>
        ))}
      </div>

      {/* Blocker list */}
      <div className="space-y-2.5">
        {filtered.map((b) => (
          <div
            key={b.id}
            className="rounded-md overflow-hidden"
            style={{
              background: BG.surface,
              border: `1px solid ${b.severity === 'critical' ? 'rgba(196,90,74,0.18)' : BORDER.subtle}`,
            }}
          >
            <div className="flex items-start gap-3 p-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span
                    className="text-[8px] font-bold tracking-widest px-1.5 py-0.5 rounded uppercase"
                    style={{ color: b.packColor, background: `${b.packColor}14` }}
                  >
                    {b.pack}
                  </span>
                  <span
                    className="text-[8px] px-1.5 py-0.5 rounded uppercase tracking-wider"
                    style={{
                      color: CATEGORY_COLORS[b.category],
                      background: `${CATEGORY_COLORS[b.category]}12`,
                    }}
                  >
                    {CATEGORY_LABELS[b.category]}
                  </span>
                  <SevBar sev={b.severity} />
                  <span
                    className="text-[8px] font-mono capitalize"
                    style={{
                      color:
                        b.severity === 'critical'
                          ? '#c45a4a'
                          : b.severity === 'high'
                            ? '#c8953c'
                            : TEXT.secondary,
                    }}
                  >
                    {b.severity}
                  </span>
                </div>

                <h3
                  className="text-[12px] font-medium leading-snug mb-1"
                  style={{ color: TEXT.primary }}
                >
                  {b.title}
                </h3>
                <p className="text-[10px] leading-relaxed mb-2.5" style={{ color: TEXT.secondary }}>
                  {b.description}
                </p>

                <div className="flex flex-wrap items-center gap-3 text-[9px]">
                  <span className="flex items-center gap-1" style={{ color: TEXT.muted }}>
                    <Clock className="w-2.5 h-2.5" /> {b.age} blocked
                  </span>
                  <span className="flex items-center gap-1" style={{ color: TEXT.muted }}>
                    <Users className="w-2.5 h-2.5" />
                    <span style={{ color: TEXT.tertiary }}>Blocked by:</span> {b.blockedBy}
                  </span>
                  <span className="font-mono" style={{ color: '#c8953c' }}>
                    Impact: {b.impact}
                  </span>
                </div>
              </div>

              <div className="shrink-0 flex flex-col items-end gap-2">
                <span className="text-[8px] font-mono" style={{ color: TEXT.muted }}>
                  {b.id}
                </span>
                {b.escalatable && (
                  <button
                    className="flex items-center gap-1 px-2 py-1 rounded text-[8px] font-medium transition-all hover:opacity-80"
                    style={{
                      background: 'rgba(196,90,74,0.1)',
                      border: '1px solid rgba(196,90,74,0.2)',
                      color: '#c45a4a',
                    }}
                  >
                    <Zap className="w-2.5 h-2.5" /> Escalate
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <EmptyState
            icon={Activity}
            headline="No blockers match the selected filters"
            compact
            accentColor={ELECTRIC}
          />
        )}
      </div>
    </div>
  );
}
