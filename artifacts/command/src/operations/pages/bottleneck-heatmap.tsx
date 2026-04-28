import { AlertTriangle, BarChart3, Clock, Filter, GitBranch } from 'lucide-react';
import { useState } from 'react';

const BG = { page: 'var(--gi-bg-base)', surface: 'var(--gi-bg-surface)', elevated: 'var(--gi-bg-raised)', panel: '#0e1219' };
const BORDER = {
  subtle: 'rgba(255,255,255,0.04)',
  muted: 'rgba(255,255,255,0.06)',
  accent: 'rgba(212,160,84,0.12)',
};
const TEXT = {
  primary: 'rgba(255,255,255,0.88)',
  secondary: 'rgba(255,255,255,0.55)',
  tertiary: 'rgba(255,255,255,0.28)',
  muted: 'rgba(255,255,255,0.14)',
};

type HeatLevel = 'critical' | 'high' | 'medium' | 'low' | 'clear';

interface HeatCell {
  pack: string;
  function: string;
  level: HeatLevel;
  blockedItems: number;
  ageHours: number;
  owner: string;
  ownerConfidence: 'owned' | 'contested' | 'gap';
  dependencies: string[];
  value: string;
}

interface BottleneckChain {
  id: string;
  title: string;
  steps: { label: string; status: 'blocked' | 'waiting' | 'clear'; age?: string }[];
  totalAge: string;
  impact: string;
  pack: string;
  packColor: string;
}

const HEAT_GRID: HeatCell[] = [
  {
    pack: 'SEXTANT',
    function: 'Fleet Approvals',
    level: 'critical',
    blockedItems: 5,
    ageHours: 31,
    owner: 'Finance VP',
    ownerConfidence: 'owned',
    dependencies: ['Port Auth', 'Legal'],
    value: '$3.1M',
  },
  {
    pack: 'SEXTANT',
    function: 'Charter Contracts',
    level: 'high',
    blockedItems: 2,
    ageHours: 14,
    owner: 'Legal',
    ownerConfidence: 'owned',
    dependencies: ['Port Auth'],
    value: '$890K',
  },
  {
    pack: 'SEXTANT',
    function: 'Fuel Procurement',
    level: 'high',
    blockedItems: 3,
    ageHours: 22,
    owner: 'Operations',
    ownerConfidence: 'contested',
    dependencies: ['Finance', 'Vendor'],
    value: '$1.2M',
  },
  {
    pack: 'SEXTANT',
    function: 'Route Planning',
    level: 'medium',
    blockedItems: 1,
    ageHours: 8,
    owner: 'Fleet Ops',
    ownerConfidence: 'owned',
    dependencies: [],
    value: '$320K',
  },
  {
    pack: 'SEXTANT',
    function: 'Port Clearance',
    level: 'medium',
    blockedItems: 2,
    ageHours: 12,
    owner: 'Compliance',
    ownerConfidence: 'owned',
    dependencies: ['Port Auth'],
    value: '$450K',
  },
  {
    pack: 'PRAXIS',
    function: 'Q2 Pricing',
    level: 'critical',
    blockedItems: 1,
    ageHours: 31,
    owner: 'CEO',
    ownerConfidence: 'owned',
    dependencies: ['Board'],
    value: '$1.2M',
  },
  {
    pack: 'PRAXIS',
    function: 'AR Reconciliation',
    level: 'high',
    blockedItems: 2,
    ageHours: 18,
    owner: 'Unassigned',
    ownerConfidence: 'gap',
    dependencies: ['Finance', 'Ops'],
    value: '$650K',
  },
  {
    pack: 'PRAXIS',
    function: 'Vendor Payments',
    level: 'medium',
    blockedItems: 1,
    ageHours: 5,
    owner: 'Finance',
    ownerConfidence: 'owned',
    dependencies: [],
    value: '$120K',
  },
  {
    pack: 'PRAXIS',
    function: 'Reporting',
    level: 'low',
    blockedItems: 0,
    ageHours: 2,
    owner: 'Analyst Team',
    ownerConfidence: 'owned',
    dependencies: [],
    value: '$0',
  },
  {
    pack: 'DOMAINE',
    function: 'Lease Renewals',
    level: 'high',
    blockedItems: 2,
    ageHours: 48,
    owner: 'Property Mgr',
    ownerConfidence: 'owned',
    dependencies: ['Legal', 'Tenant'],
    value: '$320K',
  },
  {
    pack: 'DOMAINE',
    function: 'Asset Refinancing',
    level: 'medium',
    blockedItems: 1,
    ageHours: 96,
    owner: 'Finance',
    ownerConfidence: 'owned',
    dependencies: ['Appraiser'],
    value: '$290K',
  },
  {
    pack: 'DOMAINE',
    function: 'Inspections',
    level: 'low',
    blockedItems: 0,
    ageHours: 0,
    owner: 'Field Team',
    ownerConfidence: 'owned',
    dependencies: [],
    value: '$0',
  },
  {
    pack: 'DOMAINE',
    function: 'Tenant Comms',
    level: 'clear',
    blockedItems: 0,
    ageHours: 0,
    owner: 'PM Team',
    ownerConfidence: 'owned',
    dependencies: [],
    value: '$0',
  },
  {
    pack: 'PARAGON',
    function: 'Vendor Onboarding',
    level: 'medium',
    blockedItems: 1,
    ageHours: 144,
    owner: 'HR',
    ownerConfidence: 'owned',
    dependencies: ['Background Check'],
    value: '$140K',
  },
  {
    pack: 'PARAGON',
    function: 'Threat Assessments',
    level: 'low',
    blockedItems: 0,
    ageHours: 0,
    owner: 'Intel Team',
    ownerConfidence: 'owned',
    dependencies: [],
    value: '$0',
  },
  {
    pack: 'PARAGON',
    function: 'Access Controls',
    level: 'clear',
    blockedItems: 0,
    ageHours: 0,
    owner: 'SecOps',
    ownerConfidence: 'owned',
    dependencies: [],
    value: '$0',
  },
  {
    pack: 'PARAGON',
    function: 'Audit Compliance',
    level: 'clear',
    blockedItems: 0,
    ageHours: 0,
    owner: 'Compliance',
    ownerConfidence: 'owned',
    dependencies: [],
    value: '$0',
  },
];

const CHAINS: BottleneckChain[] = [
  {
    id: 'CHN-001',
    title: 'SEXTANT fleet ETA compliance failure chain',
    steps: [
      { label: 'Fuel pricing submitted', status: 'clear' },
      { label: 'Finance VP approval', status: 'blocked', age: '22h' },
      { label: 'Vessel re-routing', status: 'waiting' },
      { label: 'Port authority clearance', status: 'waiting' },
      { label: 'SLA compliance', status: 'waiting' },
    ],
    totalAge: '22h',
    impact: '$2.1M',
    pack: 'SEXTANT',
    packColor: '#38bdf8',
  },
  {
    id: 'CHN-002',
    title: 'PRISM Q2 pricing revision stall chain',
    steps: [
      { label: 'Ops team pricing draft', status: 'clear' },
      { label: 'Internal review completed', status: 'clear' },
      { label: 'CEO calendar approval', status: 'blocked', age: '31h' },
      { label: 'Board distribution', status: 'waiting' },
      { label: 'Go-live execution', status: 'waiting' },
    ],
    totalAge: '31h',
    impact: '$1.2M',
    pack: 'PRAXIS',
    packColor: '#d4a054',
  },
  {
    id: 'CHN-003',
    title: 'DOMAINE lease renewal legal hold chain',
    steps: [
      { label: 'Tenant signature received', status: 'clear' },
      { label: 'Exhibit B required', status: 'blocked', age: '48h' },
      { label: 'Property manager response', status: 'waiting' },
      { label: 'Legal sign-off', status: 'waiting' },
    ],
    totalAge: '48h',
    impact: '$320K',
    pack: 'DOMAINE',
    packColor: '#a07848',
  },
];

const HEAT_COLORS: Record<HeatLevel, { bg: string; border: string; text: string; label: string }> =
  {
    critical: {
      bg: 'rgba(196,90,74,0.22)',
      border: 'rgba(196,90,74,0.45)',
      text: '#c45a4a',
      label: 'Critical',
    },
    high: {
      bg: 'rgba(200,149,60,0.16)',
      border: 'rgba(200,149,60,0.3)',
      text: '#c8953c',
      label: 'High',
    },
    medium: {
      bg: 'rgba(212,160,84,0.10)',
      border: 'rgba(212,160,84,0.2)',
      text: '#d4a054',
      label: 'Medium',
    },
    low: {
      bg: 'rgba(74,144,184,0.07)',
      border: 'rgba(74,144,184,0.14)',
      text: '#4a90b8',
      label: 'Low',
    },
    clear: {
      bg: 'rgba(107,143,113,0.07)',
      border: 'rgba(107,143,113,0.14)',
      text: '#6b8f71',
      label: 'Clear',
    },
  };

const OWNER_CONFIDENCE_COLORS: Record<string, string> = {
  owned: '#6b8f71',
  contested: '#c8953c',
  gap: '#c45a4a',
};

const PACKS = ['All', 'SEXTANT', 'PRAXIS', 'DOMAINE', 'PARAGON'];
const PACK_COLORS: Record<string, string> = {
  SEXTANT: '#38bdf8',
  PRISM: '#d4a054',
  DOMAINE: '#a07848',
  PARAGON: '#4f6ef7',
};

function HeatCell({ cell }: { cell: HeatCell }) {
  const c = HEAT_COLORS[cell.level];
  const ownerColor = OWNER_CONFIDENCE_COLORS[cell.ownerConfidence];
  return (
    <div
      className="rounded p-2.5 flex flex-col gap-1.5 relative overflow-hidden cursor-pointer transition-all hover:opacity-90"
      style={{ background: c.bg, border: `1px solid ${c.border}` }}
    >
      {cell.level === 'critical' && (
        <div
          className="absolute top-0 right-0 w-1.5 h-1.5 rounded-bl animate-pulse"
          style={{ background: c.text }}
        />
      )}
      <div className="text-[9px] font-medium leading-tight" style={{ color: TEXT.primary }}>
        {cell.function}
      </div>
      <div className="flex items-center justify-between">
        <span
          className="text-[7px] font-mono px-1 py-px rounded"
          style={{ color: c.text, background: `${c.text}15` }}
        >
          {c.label}
        </span>
        {cell.blockedItems > 0 && (
          <span className="text-[7px] font-mono" style={{ color: c.text }}>
            {cell.blockedItems} blocked
          </span>
        )}
      </div>
      {cell.ageHours > 0 && (
        <div className="flex items-center gap-1 text-[7px]" style={{ color: TEXT.muted }}>
          <Clock className="w-2 h-2" />
          <span>
            {cell.ageHours >= 24 ? `${Math.floor(cell.ageHours / 24)}d` : `${cell.ageHours}h`}
          </span>
        </div>
      )}
      <div className="flex items-center gap-1 text-[7px]">
        <div className="w-1 h-1 rounded-full shrink-0" style={{ background: ownerColor }} />
        <span style={{ color: TEXT.tertiary }}>{cell.owner}</span>
        {cell.ownerConfidence === 'gap' && (
          <span
            className="ml-auto text-[6px] uppercase tracking-wider"
            style={{ color: '#c45a4a' }}
          >
            No owner
          </span>
        )}
        {cell.ownerConfidence === 'contested' && (
          <span
            className="ml-auto text-[6px] uppercase tracking-wider"
            style={{ color: '#c8953c' }}
          >
            Contested
          </span>
        )}
      </div>
      {cell.dependencies.length > 0 && (
        <div className="flex gap-1 flex-wrap">
          {cell.dependencies.slice(0, 2).map((d) => (
            <span
              key={d}
              className="text-[6px] px-1 py-px rounded"
              style={{ color: TEXT.muted, background: 'rgba(255,255,255,0.04)' }}
            >
              {d}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function DependencyChain({ chain }: { chain: BottleneckChain }) {
  return (
    <div
      className="rounded-md p-4 space-y-3"
      style={{ background: BG.surface, border: `1px solid ${BORDER.subtle}` }}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span
              className="text-[8px] font-bold tracking-wider px-1.5 py-0.5 rounded uppercase"
              style={{ color: chain.packColor, background: `${chain.packColor}14` }}
            >
              {chain.pack}
            </span>
            <span className="text-[8px] font-mono" style={{ color: TEXT.muted }}>
              {chain.id}
            </span>
          </div>
          <p className="text-[11px] font-medium" style={{ color: TEXT.primary }}>
            {chain.title}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-[10px] font-mono font-bold" style={{ color: '#c8953c' }}>
            {chain.impact}
          </div>
          <div className="text-[8px]" style={{ color: TEXT.muted }}>
            {chain.totalAge} stalled
          </div>
        </div>
      </div>

      <div className="flex items-center gap-0">
        {chain.steps.map((step, i) => (
          <div key={i} className="flex items-center flex-1">
            <div className="flex flex-col items-center gap-1 flex-1">
              <div className="flex flex-col items-center gap-0.5 flex-1">
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center border shrink-0"
                  style={{
                    background:
                      step.status === 'blocked'
                        ? 'rgba(196,90,74,0.18)'
                        : step.status === 'clear'
                          ? 'rgba(107,143,113,0.12)'
                          : 'rgba(255,255,255,0.04)',
                    borderColor:
                      step.status === 'blocked'
                        ? 'rgba(196,90,74,0.4)'
                        : step.status === 'clear'
                          ? 'rgba(107,143,113,0.3)'
                          : BORDER.subtle,
                  }}
                >
                  {step.status === 'blocked' ? (
                    <AlertTriangle className="w-2.5 h-2.5" style={{ color: '#c45a4a' }} />
                  ) : step.status === 'clear' ? (
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#6b8f71' }} />
                  ) : (
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: TEXT.muted }} />
                  )}
                </div>
                <div className="text-center">
                  <p
                    className="text-[7px] leading-tight text-center px-0.5"
                    style={{
                      color:
                        step.status === 'blocked'
                          ? '#c45a4a'
                          : step.status === 'clear'
                            ? TEXT.secondary
                            : TEXT.muted,
                    }}
                  >
                    {step.label}
                  </p>
                  {step.age && (
                    <p className="text-[7px] font-mono" style={{ color: '#c45a4a' }}>
                      {step.age}
                    </p>
                  )}
                </div>
              </div>
            </div>
            {i < chain.steps.length - 1 && (
              <div className="w-3 h-px shrink-0" style={{ background: BORDER.muted }} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function BottleneckHeatmapPage() {
  const [filterPack, setFilterPack] = useState('All');
  const [filterLevel, setFilterLevel] = useState('all');

  const packs = Array.from(new Set(HEAT_GRID.map((c) => c.pack)));

  const filteredGrid = HEAT_GRID.filter((c) => {
    if (filterPack !== 'All' && c.pack !== filterPack) return false;
    if (filterLevel !== 'all' && c.level !== filterLevel) return false;
    return true;
  });

  const groupedByPack = packs.reduce(
    (acc, pack) => {
      acc[pack] = filteredGrid.filter((c) => c.pack === pack);
      return acc;
    },
    {} as Record<string, HeatCell[]>,
  );

  const totalBlocked = HEAT_GRID.reduce((s, c) => s + c.blockedItems, 0);
  const ownerGaps = HEAT_GRID.filter((c) => c.ownerConfidence === 'gap').length;
  const contested = HEAT_GRID.filter((c) => c.ownerConfidence === 'contested').length;
  const _criticalCells = HEAT_GRID.filter((c) => c.level === 'critical').length;

  return (
    <div className="p-4 md:p-5 space-y-5" style={{ background: BG.page }}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="w-3.5 h-3.5" style={{ color: '#c8953c' }} />
            <span
              className="text-[9px] font-mono uppercase tracking-widest"
              style={{ color: '#c8953c' }}
            >
              Bottleneck Heatmap
            </span>
          </div>
          <h1 className="text-lg font-bold tracking-tight" style={{ color: TEXT.primary }}>
            Where Work Is Stuck
          </h1>
          <p className="text-[11px] mt-0.5" style={{ color: TEXT.secondary }}>
            Blocked work, ownership gaps, and dependency chains across the portfolio
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div
            className="rounded px-2.5 py-1.5 text-center"
            style={{ background: 'rgba(196,90,74,0.08)', border: '1px solid rgba(196,90,74,0.16)' }}
          >
            <div className="text-[12px] font-mono font-bold" style={{ color: '#c45a4a' }}>
              {totalBlocked}
            </div>
            <div
              className="text-[7px] uppercase tracking-wider"
              style={{ color: 'rgba(196,90,74,0.55)' }}
            >
              Blocked
            </div>
          </div>
          <div
            className="rounded px-2.5 py-1.5 text-center"
            style={{ background: 'rgba(196,90,74,0.08)', border: '1px solid rgba(196,90,74,0.14)' }}
          >
            <div className="text-[12px] font-mono font-bold" style={{ color: '#c45a4a' }}>
              {ownerGaps}
            </div>
            <div
              className="text-[7px] uppercase tracking-wider"
              style={{ color: 'rgba(196,90,74,0.55)' }}
            >
              No Owner
            </div>
          </div>
          <div
            className="rounded px-2.5 py-1.5 text-center"
            style={{
              background: 'rgba(200,149,60,0.08)',
              border: '1px solid rgba(200,149,60,0.14)',
            }}
          >
            <div className="text-[12px] font-mono font-bold" style={{ color: '#c8953c' }}>
              {contested}
            </div>
            <div
              className="text-[7px] uppercase tracking-wider"
              style={{ color: 'rgba(200,149,60,0.55)' }}
            >
              Contested
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="flex items-center gap-1.5 text-[9px]" style={{ color: TEXT.tertiary }}>
          <Filter className="w-3 h-3" />
          <span>Filter:</span>
        </div>
        {PACKS.map((p) => (
          <button
            key={p}
            onClick={() => setFilterPack(p)}
            className="px-2.5 py-1 rounded text-[9px] font-medium transition-all"
            style={{
              background:
                filterPack === p ? `${PACK_COLORS[p] ?? '#fff'}18` : 'rgba(255,255,255,0.04)',
              border: `1px solid ${filterPack === p ? `${PACK_COLORS[p] ?? '#fff'}30` : BORDER.subtle}`,
              color: filterPack === p ? (PACK_COLORS[p] ?? TEXT.primary) : TEXT.secondary,
            }}
          >
            {p}
          </button>
        ))}
        <div className="w-px h-5 self-center" style={{ background: BORDER.subtle }} />
        {['all', 'critical', 'high', 'medium', 'low', 'clear'].map((l) => (
          <button
            key={l}
            onClick={() => setFilterLevel(l)}
            className="px-2.5 py-1 rounded text-[9px] font-medium transition-all capitalize"
            style={{
              background: filterLevel === l ? 'rgba(212,160,84,0.10)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${filterLevel === l ? 'rgba(212,160,84,0.2)' : BORDER.subtle}`,
              color: filterLevel === l ? '#d4a054' : TEXT.secondary,
            }}
          >
            {l === 'all' ? 'All severity' : l}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {Object.entries(groupedByPack)
          .filter(([, cells]) => cells.length > 0)
          .map(([pack, cells]) => (
            <div key={pack}>
              <div className="flex items-center gap-2 mb-2">
                <span
                  className="text-[9px] font-bold tracking-widest uppercase"
                  style={{ color: PACK_COLORS[pack] ?? TEXT.secondary }}
                >
                  {pack}
                </span>
                <span
                  className="text-[8px] font-mono px-1.5 py-px rounded"
                  style={{ color: TEXT.muted, background: 'rgba(255,255,255,0.04)' }}
                >
                  {cells.filter((c) => c.blockedItems > 0).length} areas blocked
                </span>
              </div>
              <div
                className="grid gap-2"
                style={{ gridTemplateColumns: `repeat(${Math.min(cells.length, 4)}, 1fr)` }}
              >
                {cells.map((cell) => (
                  <HeatCell key={cell.function} cell={cell} />
                ))}
              </div>
            </div>
          ))}
      </div>

      <div>
        <div className="flex items-center gap-2 mb-3">
          <GitBranch className="w-3.5 h-3.5" style={{ color: '#8b7ac8' }} />
          <span
            className="text-[10px] font-medium uppercase tracking-widest"
            style={{ color: TEXT.muted }}
          >
            Dependency Chain Analysis
          </span>
        </div>
        <div className="space-y-3">
          {CHAINS.filter((ch) => filterPack === 'All' || ch.pack === filterPack).map((chain) => (
            <DependencyChain key={chain.id} chain={chain} />
          ))}
        </div>
      </div>

      <div
        className="rounded-md p-3 flex items-center gap-3"
        style={{ background: BG.elevated, border: `1px solid ${BORDER.subtle}` }}
      >
        <div className="flex items-center gap-4 text-[9px] flex-wrap">
          <span style={{ color: TEXT.tertiary }}>Legend:</span>
          {(['critical', 'high', 'medium', 'low', 'clear'] as HeatLevel[]).map((l) => (
            <div key={l} className="flex items-center gap-1.5">
              <div
                className="w-2.5 h-2.5 rounded-sm"
                style={{
                  background: HEAT_COLORS[l].bg,
                  border: `1px solid ${HEAT_COLORS[l].border}`,
                }}
              />
              <span className="capitalize" style={{ color: TEXT.tertiary }}>
                {HEAT_COLORS[l].label}
              </span>
            </div>
          ))}
          <div className="w-px h-4 self-center" style={{ background: BORDER.subtle }} />
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ background: '#6b8f71' }} />
            <span style={{ color: TEXT.tertiary }}>Owned</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ background: '#c8953c' }} />
            <span style={{ color: TEXT.tertiary }}>Contested</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ background: '#c45a4a' }} />
            <span style={{ color: TEXT.tertiary }}>No owner</span>
          </div>
        </div>
      </div>
    </div>
  );
}
