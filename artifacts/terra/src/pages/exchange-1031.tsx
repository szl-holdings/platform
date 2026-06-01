import { useStandardMutation, useStandardQuery } from '@szl-holdings/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  CheckCircle,
  Clock,
  Database,
  Shield,
} from 'lucide-react';
import { useState } from 'react';
import { api } from '../lib/api';

const DS = {
  surface: 'rgba(255,255,255,0.025)',
  border: 'rgba(255,255,255,0.05)',
  accent: { gold: '#b8943c', blue: '#3a7ad4', green: '#40856a', red: '#c0503a' },
  text: {
    primary: 'rgba(255,255,255,0.85)',
    secondary: 'rgba(255,255,255,0.5)',
    tertiary: 'rgba(255,255,255,0.3)',
    muted: 'rgba(255,255,255,0.18)',
  },
};

const fmt = (n: number) =>
  n >= 1e9
    ? `$${(n / 1e9).toFixed(2)}B`
    : n >= 1e6
      ? `$${(n / 1e6).toFixed(2)}M`
      : n >= 1e3
        ? `$${(n / 1e3).toFixed(0)}K`
        : `$${n.toLocaleString()}`;

interface Exchange {
  id: string;
  relinquishedProperty: string;
  relinquishedAddress: string;
  saleDate: string;
  salePrice: number;
  adjustedBasis: number;
  deferredGain: number;
  qi: string;
  qiContact: string;
  status: 'identification' | 'exchange' | 'completed' | 'failed';
  identificationDeadline: string;
  exchangeDeadline: string;
  identifiedProperties: {
    id: string;
    address: string;
    listPrice: number;
    equityRequired: number;
    status: 'identified' | 'under-contract' | 'closed' | 'rejected';
    notes: string;
  }[];
  complianceItems: { item: string; status: 'complete' | 'pending' | 'flagged'; note?: string }[];
  taxSavings: number;
}

const EXCHANGES: Exchange[] = [
  {
    id: 'ex-001',
    relinquishedProperty: 'Skyline Lofts Chicago',
    relinquishedAddress: '840 N Lake Shore Dr, Chicago, IL 60611',
    saleDate: '2026-03-01',
    salePrice: 22_800_000,
    adjustedBasis: 14_200_000,
    deferredGain: 8_600_000,
    qi: 'National 1031 Exchange Corp.',
    qiContact: 'J. Whitfield, Sr. Exchange Officer · (312) 555-0182',
    status: 'identification',
    identificationDeadline: '2026-04-15',
    exchangeDeadline: '2026-08-28',
    identifiedProperties: [
      {
        id: 'rp-1',
        address: '2400 Market St, Philadelphia, PA 19103',
        listPrice: 18_500_000,
        equityRequired: 6_475_000,
        status: 'under-contract',
        notes: 'PSA executed 3/28. Closing targeted 5/15/26.',
      },
      {
        id: 'rp-2',
        address: '880 N McCarthy Blvd, San Jose, CA 95002',
        listPrice: 22_000_000,
        equityRequired: 7_700_000,
        status: 'identified',
        notes: 'Touring 4/8. LOI not yet submitted.',
      },
      {
        id: 'rp-3',
        address: '1200 Commerce Dr, Nashville, TN 37201',
        listPrice: 9_800_000,
        equityRequired: 3_430_000,
        status: 'identified',
        notes: 'Backup option — shorter term hold thesis.',
      },
    ],
    complianceItems: [
      { item: 'Exchange agreement executed with QI', status: 'complete' },
      { item: 'Relinquished property proceeds in escrow', status: 'complete' },
      {
        item: '45-day identification letter submitted',
        status: 'pending',
        note: 'Due April 15 — draft in review',
      },
      {
        item: 'Replacement property LOI / PSA executed',
        status: 'flagged',
        note: 'rp-2 and rp-3 still in LOI stage — accelerate',
      },
      {
        item: 'Debt matching confirmed (≥ relinquished)',
        status: 'pending',
        note: 'rp-1 debt coverage verified; rp-2 pending',
      },
      {
        item: 'Boot elimination verified',
        status: 'pending',
        note: 'Accountant review scheduled 4/10',
      },
      { item: 'Exchange closed within 180 days', status: 'pending' },
    ],
    taxSavings: 2_408_000,
  },
  {
    id: 'ex-002',
    relinquishedProperty: 'Westside Commerce Park',
    relinquishedAddress: '4801 W Jefferson Blvd, Los Angeles, CA 90016',
    saleDate: '2025-11-15',
    salePrice: 14_200_000,
    adjustedBasis: 9_100_000,
    deferredGain: 5_100_000,
    qi: 'Pacific Exchange Services LLC',
    qiContact: 'A. Reyes, Exchange Coordinator · (310) 555-0244',
    status: 'completed',
    identificationDeadline: '2025-12-30',
    exchangeDeadline: '2026-05-14',
    identifiedProperties: [
      {
        id: 'rp-4',
        address: '3200 Peachtree Rd, Atlanta, GA 30305',
        listPrice: 15_600_000,
        equityRequired: 5_460_000,
        status: 'closed',
        notes: 'Exchange completed 3/1/26. All funds disbursed.',
      },
    ],
    complianceItems: [
      { item: 'Exchange agreement executed with QI', status: 'complete' },
      { item: 'Relinquished property proceeds in escrow', status: 'complete' },
      { item: '45-day identification letter submitted', status: 'complete' },
      { item: 'Replacement property PSA executed', status: 'complete' },
      { item: 'Debt matching confirmed', status: 'complete' },
      { item: 'Boot elimination verified', status: 'complete' },
      { item: 'Exchange closed within 180 days', status: 'complete' },
    ],
    taxSavings: 1_428_000,
  },
];

function DeadlineCountdown({
  deadline,
  label,
  urgentDays = 30,
}: {
  deadline: string;
  label: string;
  urgentDays?: number;
}) {
  const days = Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000);
  const past = days < 0;
  const urgent = days <= urgentDays && days >= 0;
  const color = past ? DS.accent.red : urgent ? DS.accent.gold : DS.accent.green;

  return (
    <div
      className="rounded-xl border p-4 text-center"
      style={{
        borderColor: past
          ? `${DS.accent.red}30`
          : urgent
            ? `${DS.accent.gold}30`
            : `${DS.accent.green}20`,
        background: past
          ? `${DS.accent.red}06`
          : urgent
            ? `${DS.accent.gold}06`
            : `${DS.accent.green}06`,
      }}
    >
      <p className="text-[9px] uppercase tracking-wider" style={{ color: DS.text.muted }}>
        {label}
      </p>
      <p className="text-3xl font-black font-mono mt-1" style={{ color }}>
        {past ? 'EXPIRED' : `${days}d`}
      </p>
      <p className="text-[10px] font-mono mt-0.5" style={{ color: DS.text.muted }}>
        {new Date(deadline).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })}
      </p>
      {urgent && !past && (
        <div
          className="mt-2 flex items-center justify-center gap-1 text-[9px]"
          style={{ color: DS.accent.gold }}
        >
          <AlertTriangle className="w-3 h-3" />
          Action required
        </div>
      )}
    </div>
  );
}

function ComplianceRow({ item }: { item: Exchange['complianceItems'][0] }) {
  const Icon =
    item.status === 'complete' ? CheckCircle : item.status === 'flagged' ? AlertTriangle : Clock;
  const color =
    item.status === 'complete'
      ? DS.accent.green
      : item.status === 'flagged'
        ? DS.accent.red
        : DS.accent.gold;
  return (
    <div className="flex items-start gap-3 py-2.5" style={{ borderTop: `1px solid ${DS.border}` }}>
      <Icon className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color }} />
      <div className="flex-1 min-w-0">
        <p className="text-[11px]" style={{ color: DS.text.secondary }}>
          {item.item}
        </p>
        {item.note && (
          <p
            className="text-[9px] mt-0.5"
            style={{ color: item.status === 'flagged' ? DS.accent.red : DS.text.muted }}
          >
            {item.note}
          </p>
        )}
      </div>
    </div>
  );
}

function PropertyStatusBadge({ status }: { status: string }) {
  const configs = {
    identified: { color: DS.accent.gold, label: 'Identified' },
    'under-contract': { color: DS.accent.blue, label: 'Under Contract' },
    closed: { color: DS.accent.green, label: 'Closed' },
    rejected: { color: DS.accent.red, label: 'Rejected' },
  };
  const c = configs[status as keyof typeof configs] || configs.identified;
  return (
    <span
      className="text-[9px] font-bold px-1.5 py-0.5 rounded"
      style={{ color: c.color, background: `${c.color}12` }}
    >
      {c.label}
    </span>
  );
}

function ExchangeCard({
  ex,
  selected,
  onClick,
}: {
  ex: Exchange;
  selected: boolean;
  onClick: () => void;
}) {
  const daysToId = Math.ceil(
    (new Date(ex.identificationDeadline).getTime() - Date.now()) / 86400000,
  );
  const daysToClose = Math.ceil((new Date(ex.exchangeDeadline).getTime() - Date.now()) / 86400000);
  const statusColors = {
    identification: DS.accent.gold,
    exchange: DS.accent.blue,
    completed: DS.accent.green,
    failed: DS.accent.red,
  };
  const statusColor = statusColors[ex.status];

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onClick}
      className="rounded-xl border p-4 cursor-pointer transition-all"
      style={{
        borderColor: selected ? DS.accent.gold : DS.border,
        background: selected ? 'rgba(184,148,60,0.04)' : DS.surface,
      }}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0">
          <p className="text-xs font-semibold truncate" style={{ color: DS.text.primary }}>
            {ex.relinquishedProperty}
          </p>
          <p className="text-[10px] mt-0.5 truncate" style={{ color: DS.text.tertiary }}>
            {ex.relinquishedAddress}
          </p>
        </div>
        <span
          className="text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0"
          style={{ color: statusColor, background: `${statusColor}12` }}
        >
          {ex.status.toUpperCase()}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <p className="text-[8px] uppercase tracking-wider" style={{ color: DS.text.muted }}>
            Sale Price
          </p>
          <p className="text-[11px] font-bold font-mono" style={{ color: DS.accent.gold }}>
            {fmt(ex.salePrice)}
          </p>
        </div>
        <div>
          <p className="text-[8px] uppercase tracking-wider" style={{ color: DS.text.muted }}>
            Tax Deferred
          </p>
          <p className="text-[11px] font-bold font-mono" style={{ color: DS.accent.green }}>
            {fmt(ex.deferredGain)}
          </p>
        </div>
      </div>
      {ex.status !== 'completed' && ex.status !== 'failed' && (
        <div
          className="flex items-center gap-3 mt-2 pt-2"
          style={{ borderTop: `1px solid ${DS.border}` }}
        >
          <span
            className="text-[9px]"
            style={{ color: daysToId < 10 ? DS.accent.red : DS.accent.gold }}
          >
            ID: {daysToId}d
          </span>
          <ArrowRight className="w-3 h-3" style={{ color: DS.text.muted }} />
          <span className="text-[9px]" style={{ color: DS.text.muted }}>
            Close: {daysToClose}d
          </span>
        </div>
      )}
    </motion.div>
  );
}

export default function Exchange1031Page() {
  const queryClient = useQueryClient();

  const {
    data: apiData,
    isLoading,
    isError,
  } = useStandardQuery({
    queryKey: ['terra-exchanges-1031'],
    queryFn: () => api.exchanges1031.list(),
    staleTime: 30_000,
  });

  const seedMutation = useStandardMutation({
    mutationFn: async () => {
      for (const ex of EXCHANGES) {
        await api.exchanges1031.create({
          relinquishedProperty: ex.relinquishedProperty,
          relinquishedAddress: ex.relinquishedAddress,
          saleDate: ex.saleDate,
          salePrice: ex.salePrice,
          adjustedBasis: ex.adjustedBasis,
          deferredGain: ex.deferredGain,
          qi: ex.qi,
          qiContact: ex.qiContact,
          status: ex.status,
          identificationDeadline: ex.identificationDeadline,
          exchangeDeadline: ex.exchangeDeadline,
          identifiedProperties: ex.identifiedProperties as Array<Record<string, unknown>>,
          complianceItems: ex.complianceItems as Array<Record<string, unknown>>,
          taxSavings: ex.taxSavings,
          isDemo: true,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['terra-exchanges-1031'] });
    },
  });

  const isLive = !isLoading && !isError && apiData && apiData.dataMode === 'live';
  const exchanges: Exchange[] = isLive ? (apiData.exchanges as unknown as Exchange[]) : EXCHANGES;

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const effectiveId = selectedId ?? exchanges[0]?.id;
  const ex = exchanges.find((e) => e.id === effectiveId) ?? exchanges[0];
  if (!ex) return null;
  const completePct = Math.round(
    (ex.complianceItems.filter((c) => (c as { status: string }).status === 'complete').length /
      ex.complianceItems.length) *
      100,
  );

  const totalDeferredGain = exchanges.reduce((s, e) => s + e.deferredGain, 0);
  const totalTaxSavings = exchanges.reduce((s, e) => s + e.taxSavings, 0);

  return (
    <div className="space-y-4 max-w-[1400px]">
      <div>
        <div className="flex items-center gap-2.5 mb-0.5">
          <h1 className="text-base font-bold text-white tracking-tight font-display">
            1031 Exchange Tracker
          </h1>
          <span
            className="text-[9px] font-mono px-1.5 py-0.5 rounded uppercase tracking-wider font-bold"
            style={{
              color: DS.accent.gold,
              background: `${DS.accent.gold}10`,
              border: `1px solid ${DS.accent.gold}20`,
            }}
          >
            IRC §1031
          </span>
          {isLive ? (
            <span
              className="flex items-center gap-1 text-[9px] font-mono px-1.5 py-0.5 rounded"
              style={{
                color: DS.accent.green,
                background: `${DS.accent.green}10`,
                border: `1px solid ${DS.accent.green}20`,
              }}
            >
              <Database className="w-2.5 h-2.5" /> Live DB
            </span>
          ) : (
            !isLoading &&
            !isError && (
              <button
                onClick={() => seedMutation.mutate()}
                disabled={seedMutation.isPending}
                className="flex items-center gap-1 text-[9px] font-mono px-1.5 py-0.5 rounded cursor-pointer"
                style={{
                  color: DS.text.muted,
                  background: DS.surface,
                  border: `1px solid ${DS.border}`,
                }}
              >
                {seedMutation.isPending ? 'Seeding…' : 'Seed to DB'}
              </button>
            )
          )}
        </div>
        <p className="text-[10px] font-mono" style={{ color: DS.text.muted }}>
          45-day identification · 180-day exchange · QI status · replacement property matching
        </p>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[
          {
            label: 'Active Exchanges',
            value: exchanges
              .filter((e) => e.status !== 'completed' && e.status !== 'failed')
              .length.toString(),
            color: DS.accent.gold,
          },
          { label: 'Total Deferred Gain', value: fmt(totalDeferredGain), color: DS.accent.green },
          { label: 'Tax Savings Est.', value: fmt(totalTaxSavings), color: DS.accent.green },
          {
            label: 'Properties Identified',
            value: exchanges.flatMap((e) => e.identifiedProperties).length.toString(),
            color: DS.accent.blue,
          },
        ].map((m) => (
          <div
            key={m.label}
            className="rounded-xl border p-3"
            style={{ borderColor: DS.border, background: DS.surface }}
          >
            <p className="text-[8px] uppercase tracking-wider" style={{ color: DS.text.muted }}>
              {m.label}
            </p>
            <p className="text-xl font-bold font-mono mt-1" style={{ color: m.color }}>
              {m.value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="space-y-3">
          <p
            className="text-[10px] font-semibold uppercase tracking-wider"
            style={{ color: DS.text.muted }}
          >
            Exchanges
          </p>
          {exchanges.map((e) => (
            <ExchangeCard
              key={e.id}
              ex={e}
              selected={effectiveId === e.id}
              onClick={() => setSelectedId(e.id)}
            />
          ))}
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div
            className="rounded-xl border p-4"
            style={{ borderColor: DS.border, background: DS.surface }}
          >
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <h3 className="text-sm font-bold" style={{ color: DS.text.primary }}>
                  {ex.relinquishedProperty}
                </h3>
                <p className="text-[10px] mt-0.5" style={{ color: DS.text.tertiary }}>
                  Sold {new Date(ex.saleDate).toLocaleDateString()} · QI: {ex.qi}
                </p>
                <p className="text-[9px] mt-0.5" style={{ color: DS.text.muted }}>
                  {ex.qiContact}
                </p>
              </div>
              <div>
                <p
                  className="text-[9px] uppercase tracking-wider mb-1"
                  style={{ color: DS.text.muted }}
                >
                  Compliance
                </p>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-1.5 rounded-full" style={{ background: DS.border }}>
                    <div
                      className="h-1.5 rounded-full"
                      style={{
                        width: `${completePct}%`,
                        background:
                          completePct === 100
                            ? DS.accent.green
                            : completePct >= 70
                              ? DS.accent.gold
                              : DS.accent.red,
                      }}
                    />
                  </div>
                  <span
                    className="text-[10px] font-mono font-bold"
                    style={{ color: DS.text.secondary }}
                  >
                    {completePct}%
                  </span>
                </div>
              </div>
            </div>

            {ex.status !== 'completed' && (
              <div className="grid grid-cols-2 gap-3 mb-4">
                <DeadlineCountdown
                  deadline={ex.identificationDeadline}
                  label="45-Day ID Deadline"
                  urgentDays={14}
                />
                <DeadlineCountdown
                  deadline={ex.exchangeDeadline}
                  label="180-Day Exchange Deadline"
                  urgentDays={45}
                />
              </div>
            )}

            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Sale Price', value: fmt(ex.salePrice) },
                { label: 'Adjusted Basis', value: fmt(ex.adjustedBasis) },
                { label: 'Deferred Gain', value: fmt(ex.deferredGain), color: DS.accent.gold },
              ].map((m) => (
                <div
                  key={m.label}
                  className="rounded-lg p-2.5"
                  style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${DS.border}` }}
                >
                  <p
                    className="text-[8px] uppercase tracking-wider"
                    style={{ color: DS.text.muted }}
                  >
                    {m.label}
                  </p>
                  <p
                    className="text-sm font-bold font-mono mt-1"
                    style={{ color: m.color || DS.text.primary }}
                  >
                    {m.value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div
            className="rounded-xl border overflow-hidden"
            style={{ borderColor: DS.border, background: DS.surface }}
          >
            <div
              className="flex items-center gap-2 px-4 py-2.5 border-b"
              style={{ borderColor: DS.border }}
            >
              <Building2 className="w-3.5 h-3.5" style={{ color: DS.accent.blue }} />
              <span
                className="text-[10px] font-bold uppercase tracking-wider"
                style={{ color: `${DS.accent.blue}99` }}
              >
                Replacement Properties
              </span>
              <span className="text-[10px] font-mono ml-auto" style={{ color: DS.text.muted }}>
                {ex.identifiedProperties.length} / 3 max (3-property rule)
              </span>
            </div>
            <div className="divide-y" style={{ borderColor: DS.border }}>
              {ex.identifiedProperties.map((rp) => (
                <div key={rp.id} className="px-4 py-3">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="text-[11px] font-medium" style={{ color: DS.text.primary }}>
                      {rp.address}
                    </p>
                    <PropertyStatusBadge status={rp.status} />
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-[10px]" style={{ color: DS.text.muted }}>
                      List: <span style={{ color: DS.text.secondary }}>{fmt(rp.listPrice)}</span>
                    </span>
                    <span className="text-[10px]" style={{ color: DS.text.muted }}>
                      Equity Req:{' '}
                      <span style={{ color: DS.accent.gold }}>{fmt(rp.equityRequired)}</span>
                    </span>
                  </div>
                  <p className="text-[9px] mt-1" style={{ color: DS.text.muted }}>
                    {rp.notes}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div
            className="rounded-xl border overflow-hidden"
            style={{ borderColor: DS.border, background: DS.surface }}
          >
            <div
              className="flex items-center gap-2 px-4 py-2.5 border-b"
              style={{ borderColor: DS.border }}
            >
              <Shield className="w-3.5 h-3.5" style={{ color: DS.accent.green }} />
              <span
                className="text-[10px] font-bold uppercase tracking-wider"
                style={{ color: `${DS.accent.green}99` }}
              >
                Compliance Checklist
              </span>
            </div>
            <div className="px-4 pb-2">
              {ex.complianceItems.map((item, i) => (
                <ComplianceRow key={i} item={item} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
