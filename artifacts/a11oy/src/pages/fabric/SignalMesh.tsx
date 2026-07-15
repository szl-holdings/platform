import { useState } from 'react';
import { Layout } from '../../components/layout';
import { PageHeader, KpiCard } from '../../components/ui';
import {
  VERTICALS,
  FABRIC_SIGNALS,
  filterByVertical,
  SEVERITY_COLORS,
  type VerticalId,
  type SignalType,
  type SignalStatus,
  type PriorityLevel,
  type FabricSignal,
} from '../../data/fabric';

const TEXT = '#f5f5f5';
const GHOST = '#5e5e5e';
const SUB = '#8a8a8a';
const GOLD = '#c9b787';
const SURFACE = 'rgba(255,255,255,0.018)';
const BORDER = 'rgba(255,255,255,0.08)';

const SIGNAL_TYPES: readonly SignalType[] = [
  'risk',
  'opportunity',
  'deadline',
  'anomaly',
  'drift',
  'compliance',
  'cost',
  'vendor',
  'document',
  'operational',
  'security',
  'legal_workflow',
  'executive_decision',
];
const STATUSES: readonly SignalStatus[] = [
  'new',
  'triaged',
  'routed',
  'approved',
  'resolved',
  'deferred',
  'blocked',
];

export function FabricSignalMesh() {
  const [verticalFilter, setVerticalFilter] = useState<VerticalId | 'all'>('all');
  const [severityFilter, setSeverityFilter] = useState<PriorityLevel | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<SignalType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<SignalStatus | 'all'>('all');
  const [drawerSignal, setDrawerSignal] = useState<FabricSignal | null>(null);
  const [localTriaged, setLocalTriaged] = useState<Set<string>>(new Set());

  let signals = filterByVertical(FABRIC_SIGNALS, verticalFilter);
  if (severityFilter !== 'all') signals = signals.filter((s) => s.severity === severityFilter);
  if (typeFilter !== 'all') signals = signals.filter((s) => s.signalType === typeFilter);
  if (statusFilter !== 'all') signals = signals.filter((s) => s.status === statusFilter);

  const markTriaged = (id: string) => setLocalTriaged((prev) => new Set(prev).add(id));

  return (
    <Layout>
      <PageHeader
        label="COMMAND FABRIC · SIGNAL MESH"
        title="Unified Signal Stream"
        subtitle="Cross-vertical signal ingestion, routing, and triage. Every signal tracked from source to resolution."
        status="LIVE"
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <KpiCard
          label="TOTAL SIGNALS"
          value={FABRIC_SIGNALS.length}
          sub="cross-vertical"
          accent={GOLD}
        />
        <KpiCard
          label="NEW"
          value={FABRIC_SIGNALS.filter((s) => s.status === 'new').length}
          sub="untriaged"
          accent="#ef4444"
        />
        <KpiCard
          label="CRITICAL"
          value={FABRIC_SIGNALS.filter((s) => s.severity === 'critical').length}
          sub="highest severity"
          accent="#ef4444"
        />
        <KpiCard
          label="TENAX REVIEW"
          value={FABRIC_SIGNALS.filter((s) => s.sentraReviewRequired).length}
          sub="governance required"
          accent="#f59e0b"
        />
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <FilterGroup
          label="VERTICAL"
          value={verticalFilter}
          onChange={(v) => setVerticalFilter(v as VerticalId | 'all')}
          options={[
            { value: 'all', label: 'ALL' },
            ...VERTICALS.map((v) => ({ value: v.id, label: v.name.toUpperCase() })),
          ]}
        />
        <FilterGroup
          label="SEVERITY"
          value={severityFilter}
          onChange={(v) => setSeverityFilter(v as PriorityLevel | 'all')}
          options={[
            { value: 'all', label: 'ALL' },
            ...(['critical', 'high', 'medium', 'low'] as const).map((s) => ({
              value: s,
              label: s.toUpperCase(),
            })),
          ]}
        />
        <FilterGroup
          label="TYPE"
          value={typeFilter}
          onChange={(v) => setTypeFilter(v as SignalType | 'all')}
          options={[
            { value: 'all', label: 'ALL' },
            ...SIGNAL_TYPES.map((t) => ({ value: t, label: t.toUpperCase().replace('_', ' ') })),
          ]}
        />
        <FilterGroup
          label="STATUS"
          value={statusFilter}
          onChange={(v) => setStatusFilter(v as SignalStatus | 'all')}
          options={[
            { value: 'all', label: 'ALL' },
            ...STATUSES.map((s) => ({ value: s, label: s.toUpperCase() })),
          ]}
        />
      </div>

      <div className="text-[10px] font-mono mb-3" style={{ color: GHOST }}>
        {signals.length} signals matching filters
      </div>

      <div className="overflow-x-auto mb-8">
        <table className="w-full text-left text-xs" style={{ color: TEXT }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
              <th className="pb-2 font-mono text-[10px]" style={{ color: GHOST }}>
                SEVERITY
              </th>
              <th className="pb-2 font-mono text-[10px]" style={{ color: GHOST }}>
                SIGNAL
              </th>
              <th className="pb-2 font-mono text-[10px]" style={{ color: GHOST }}>
                VERTICAL
              </th>
              <th className="pb-2 font-mono text-[10px]" style={{ color: GHOST }}>
                TYPE
              </th>
              <th className="pb-2 font-mono text-[10px]" style={{ color: GHOST }}>
                CONFIDENCE
              </th>
              <th className="pb-2 font-mono text-[10px]" style={{ color: GHOST }}>
                STATUS
              </th>
              <th className="pb-2 font-mono text-[10px]" style={{ color: GHOST }}>
                TENAX
              </th>
              <th className="pb-2 font-mono text-[10px]" style={{ color: GHOST }}>
                ACTION
              </th>
            </tr>
          </thead>
          <tbody>
            {signals.slice(0, 50).map((s) => {
              const isTriaged = localTriaged.has(s.id);
              return (
                <tr
                  key={s.id}
                  className="cursor-pointer hover:bg-white/[0.02] transition-colors"
                  onClick={() => setDrawerSignal(s)}
                  style={{ borderBottom: `1px solid rgba(255,255,255,0.04)` }}
                >
                  <td className="py-2 pr-3">
                    <div className="flex items-center gap-1.5">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: SEVERITY_COLORS[s.severity] }}
                      />
                      <span
                        className="text-[10px] font-mono"
                        style={{ color: SEVERITY_COLORS[s.severity] }}
                      >
                        {s.severity}
                      </span>
                    </div>
                  </td>
                  <td className="py-2 pr-3 max-w-[220px] truncate">{s.title}</td>
                  <td className="py-2 pr-3">
                    <span
                      className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                      style={{ backgroundColor: `${GOLD}18`, color: GOLD }}
                    >
                      {s.verticalId}
                    </span>
                  </td>
                  <td className="py-2 pr-3 text-[10px] font-mono" style={{ color: SUB }}>
                    {s.signalType}
                  </td>
                  <td className="py-2 pr-3 text-[10px] font-mono" style={{ color: GOLD }}>
                    {s.confidence}
                  </td>
                  <td className="py-2 pr-3">
                    <span
                      className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                      style={{
                        backgroundColor: isTriaged ? '#22c55e18' : 'rgba(255,255,255,0.05)',
                        color: isTriaged ? '#22c55e' : SUB,
                      }}
                    >
                      {isTriaged ? 'TRIAGED' : s.status}
                    </span>
                  </td>
                  <td className="py-2 pr-3">
                    {s.sentraReviewRequired && (
                      <span className="text-[10px] font-mono" style={{ color: '#f59e0b' }}>
                        REQUIRED
                      </span>
                    )}
                  </td>
                  <td className="py-2">
                    {!isTriaged && s.status === 'new' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          markTriaged(s.id);
                        }}
                        className="text-[10px] font-mono px-2 py-0.5 rounded transition-colors"
                        style={{
                          backgroundColor: `${GOLD}18`,
                          color: GOLD,
                          border: `1px solid ${GOLD}40`,
                        }}
                      >
                        TRIAGE
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {drawerSignal && (
        <div
          className="fixed inset-y-0 right-0 w-full max-w-lg z-50 overflow-y-auto"
          style={{ backgroundColor: '#0f0f0f', borderLeft: `1px solid ${BORDER}` }}
        >
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="font-semibold" style={{ color: TEXT }}>
                {drawerSignal.title}
              </span>
              <button
                onClick={() => setDrawerSignal(null)}
                className="text-sm font-mono px-3 py-1 rounded"
                style={{ color: GHOST, border: `1px solid ${BORDER}` }}
              >
                Close
              </button>
            </div>
            <p className="text-sm mb-4" style={{ color: SUB }}>
              {drawerSignal.description}
            </p>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <DetailRow
                label="Severity"
                value={drawerSignal.severity}
                color={SEVERITY_COLORS[drawerSignal.severity]}
              />
              <DetailRow label="Type" value={drawerSignal.signalType} />
              <DetailRow label="Source" value={drawerSignal.source} />
              <DetailRow label="Confidence" value={String(drawerSignal.confidence)} color={GOLD} />
              <DetailRow label="Vertical" value={drawerSignal.verticalId} />
              <DetailRow
                label="Status"
                value={localTriaged.has(drawerSignal.id) ? 'triaged' : drawerSignal.status}
              />
              <DetailRow label="Entity" value={drawerSignal.relatedEntity} />
              <DetailRow
                label="TENAX"
                value={drawerSignal.sentraReviewRequired ? 'Required' : 'Not required'}
                color={drawerSignal.sentraReviewRequired ? '#f59e0b' : undefined}
              />
            </div>
            <div
              className="text-xs p-3 rounded mb-4"
              style={{ backgroundColor: `${GOLD}08`, color: TEXT }}
            >
              <div className="text-[10px] font-mono mb-1" style={{ color: GOLD }}>
                RECOMMENDED ACTION
              </div>
              {drawerSignal.recommendedAction}
            </div>
            <div className="text-[10px] font-mono" style={{ color: GHOST }}>
              <div>Chainlight: {drawerSignal.chainlightScenarioId}</div>
              <div>Proof Chain: {drawerSignal.proofChainAnchorId}</div>
              <div>Timestamp: {drawerSignal.timestamp}</div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

function FilterGroup({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="flex items-center gap-1">
      <span className="text-[10px] font-mono mr-1" style={{ color: GHOST }}>
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="text-[10px] font-mono px-2 py-1 rounded bg-transparent"
        style={{ color: GOLD, border: `1px solid ${GOLD}40`, outline: 'none' }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} style={{ backgroundColor: '#0a0a0a' }}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function DetailRow({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="rounded p-2" style={{ backgroundColor: SURFACE }}>
      <div className="text-[10px] font-mono" style={{ color: GHOST }}>
        {label}
      </div>
      <div className="text-xs font-medium" style={{ color: color ?? TEXT }}>
        {value}
      </div>
    </div>
  );
}
