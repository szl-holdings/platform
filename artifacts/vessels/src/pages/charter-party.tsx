import { EmptyState } from '@szl-holdings/shared-ui/EmptyState';
import { Badge } from '@szl-holdings/shared-ui/ui/badge';
import { cn } from '@szl-holdings/shared-ui/utils';
import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  DollarSign,
  FileText,
  Filter,
  Loader2,
  Plus,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { api, type VoyageEconomics } from '@/lib/api';

type FixtureStatus = 'draft' | 'negotiated' | 'fixed' | 'performing' | 'completed';
type CharterType = 'voyage' | 'time';

const STATUS_CONFIG: Record<FixtureStatus, { label: string; color: string; step: number }> = {
  draft: { label: 'Draft', color: 'text-sky-400/50 bg-sky-500/5 border-sky-500/10', step: 1 },
  negotiated: {
    label: 'Negotiated',
    color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    step: 2,
  },
  fixed: { label: 'Fixed', color: 'text-sky-400 bg-sky-500/10 border-sky-500/20', step: 3 },
  performing: {
    label: 'Performing',
    color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    step: 4,
  },
  completed: { label: 'Completed', color: 'text-sky-300 bg-sky-500/5 border-sky-500/10', step: 5 },
};

interface Fixture {
  id: number;
  ref: string;
  type: CharterType;
  vessel: string;
  status: FixtureStatus;
  cargo: string;
  loadPort: string;
  dischargePort: string;
  laycanFrom: string | null;
  laycanTo: string | null;
  freightRate: number;
  freightUnit: string;
  quantity: number;
  totalValue: number;
  marginPct: number | null;
}

function mapVoyageStatusToFixture(status: string): FixtureStatus {
  switch (status) {
    case 'planned':
    case 'pending':
      return 'negotiated';
    case 'scheduled':
    case 'awaiting_departure':
      return 'fixed';
    case 'in_progress':
    case 'underway':
    case 'at_port':
      return 'performing';
    case 'completed':
    case 'delivered':
      return 'completed';
    case 'draft':
    default:
      return STATUS_CONFIG[status as FixtureStatus] ? (status as FixtureStatus) : 'draft';
  }
}

function mapCharterType(charterType: string): CharterType {
  return charterType?.toLowerCase().includes('time') ? 'time' : 'voyage';
}

function voyageToFixture(v: VoyageEconomics): Fixture {
  const type = mapCharterType(v.charterType);
  const status = mapVoyageStatusToFixture(v.status);
  const quantity = Number(v.cargoQuantityMt ?? 0);
  const rate = Number(v.charterRatePerDay ?? 0);
  const duration = Number(v.durationDays ?? 30);
  const totalValue = type === 'voyage' ? Number(v.grossRevenue ?? rate * quantity) : rate * duration;
  return {
    id: v.id,
    ref: v.voyageRef,
    type,
    vessel: v.vesselName ?? `Vessel #${v.vesselId}`,
    status,
    cargo: v.cargoType
      ? `${v.cargoType}${quantity > 0 ? ` (${quantity.toLocaleString()} MT)` : ''}`
      : type === 'time'
        ? 'N/A — Time Charter'
        : '—',
    loadPort: v.originPort,
    dischargePort: v.destinationPort,
    laycanFrom: v.scheduledDepartureAt ?? null,
    laycanTo: v.scheduledArrivalAt ?? v.estimatedArrivalAt ?? null,
    freightRate: rate,
    freightUnit: type === 'voyage' ? 'USD/MT' : 'USD/day',
    quantity,
    totalValue,
    marginPct: v.marginPct != null ? Number(v.marginPct) : null,
  };
}

function fmtDate(iso: string | null): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return iso.slice(0, 10);
  }
}

function LifecyclePipeline({ status }: { status: FixtureStatus }) {
  const steps: FixtureStatus[] = ['draft', 'negotiated', 'fixed', 'performing', 'completed'];
  const currentStep = STATUS_CONFIG[status].step;
  return (
    <div className="flex items-center gap-0">
      {steps.map((s, i) => {
        const cfg = STATUS_CONFIG[s];
        const active = cfg.step <= currentStep;
        const isCurrent = s === status;
        return (
          <div key={s} className="flex items-center">
            <div
              className={cn(
                'px-2 py-0.5 text-[9px] font-medium rounded transition-all',
                isCurrent
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                  : active
                    ? 'text-sky-400/60 border border-sky-500/10 bg-sky-500/5'
                    : 'text-sky-400/20 border border-sky-500/5',
              )}
            >
              {cfg.label}
            </div>
            {i < steps.length - 1 && (
              <div className={cn('w-3 h-px mx-0.5', active ? 'bg-sky-500/30' : 'bg-sky-500/10')} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function FixtureCard({ fixture }: { fixture: Fixture }) {
  const [expanded, setExpanded] = useState(false);
  const marginColor =
    fixture.marginPct == null
      ? 'text-sky-400/60'
      : fixture.marginPct < 5
        ? 'text-red-400'
        : fixture.marginPct < 15
          ? 'text-amber-400'
          : 'text-emerald-400';

  return (
    <div
      className={cn(
        'bg-[#0a1628]/80 border rounded-xl overflow-hidden transition-all border-sky-500/10',
      )}
    >
      <button className="w-full text-left px-4 py-4" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-sky-500/10 flex items-center justify-center shrink-0">
            <FileText className="w-3.5 h-3.5 text-sky-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              <span className="text-sm font-bold text-sky-100">{fixture.ref}</span>
              <Badge
                variant="outline"
                className={cn('text-[9px]', STATUS_CONFIG[fixture.status].color)}
              >
                {STATUS_CONFIG[fixture.status].label}
              </Badge>
              <Badge variant="outline" className="text-[9px] text-sky-400/50 border-sky-500/10">
                {fixture.type === 'voyage' ? 'Voyage Charter' : 'Time Charter'}
              </Badge>
            </div>
            <p className="text-xs text-sky-300 font-medium">{fixture.vessel}</p>
            <p className="text-[10px] text-sky-400/50 mt-0.5">
              {fixture.loadPort} → {fixture.dischargePort}
            </p>
            <div className="mt-2">
              <LifecyclePipeline status={fixture.status} />
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-sm font-bold font-mono text-emerald-400">
              ${(fixture.totalValue / 1000).toFixed(0)}K
            </p>
            <p className="text-[9px] text-sky-400/40">est. value</p>
            <div className={cn('text-[10px] font-mono mt-1', marginColor)}>
              Margin: {fixture.marginPct != null ? `${fixture.marginPct.toFixed(1)}%` : '—'}
            </div>
            {expanded ? (
              <ChevronUp className="w-3.5 h-3.5 text-sky-400/30 mt-1 ml-auto" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-sky-400/30 mt-1 ml-auto" />
            )}
          </div>
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-sky-500/10 pt-4 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              {
                label: 'Scheduled Departure',
                value: fmtDate(fixture.laycanFrom),
                icon: Calendar,
                color: 'text-sky-300',
              },
              {
                label: 'Scheduled Arrival',
                value: fmtDate(fixture.laycanTo),
                icon: Calendar,
                color: 'text-sky-300',
              },
              {
                label: fixture.type === 'voyage' ? 'Freight Rate' : 'Hire Rate',
                value: fixture.freightRate
                  ? `$${fixture.freightRate.toLocaleString()} ${fixture.freightUnit}`
                  : '—',
                icon: DollarSign,
                color: 'text-emerald-400',
              },
              {
                label: 'Cargo',
                value: fixture.cargo,
                icon: Clock,
                color: 'text-orange-400',
              },
            ].map((f) => (
              <div key={f.label} className="bg-sky-500/5 rounded-lg p-3 border border-sky-500/10">
                <p className="text-[9px] text-sky-400/40 uppercase tracking-wider">{f.label}</p>
                <p className={cn('text-xs font-mono font-bold mt-0.5', f.color)}>{f.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function CharterPartyPage() {
  const [statusFilter, setStatusFilter] = useState<FixtureStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | CharterType>('all');

  const voyagesQuery = useQuery({
    queryKey: ['vessels-voyage-economics-all'],
    queryFn: () => api.voyageEconomics.list(),
    staleTime: 30_000,
  });

  const fixtures = useMemo<Fixture[]>(
    () => (voyagesQuery.data ?? []).map(voyageToFixture),
    [voyagesQuery.data],
  );

  const filtered = useMemo(
    () =>
      fixtures.filter(
        (f) =>
          (statusFilter === 'all' || f.status === statusFilter) &&
          (typeFilter === 'all' || f.type === typeFilter),
      ),
    [fixtures, statusFilter, typeFilter],
  );

  const stats = useMemo(
    () => ({
      total: fixtures.length,
      active: fixtures.filter((f) => ['fixed', 'performing'].includes(f.status)).length,
      lowMargin: fixtures.filter((f) => f.marginPct != null && f.marginPct < 5).length,
      totalValue: fixtures.reduce((a, f) => a + f.totalValue, 0),
    }),
    [fixtures],
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-bold text-sky-50 flex items-center gap-2">
            <FileText className="w-5 h-5 text-sky-400" />
            Charter Party Manager
          </h1>
          <p className="text-xs text-sky-400/50 mt-0.5">
            Live view of charter fixtures sourced from the voyage economics ledger
          </p>
        </div>
        <button className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-300 hover:bg-sky-500/15 transition-colors">
          <Plus className="w-3.5 h-3.5" /> New Fixture
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Fixtures', value: stats.total, color: 'text-sky-300', icon: FileText },
          {
            label: 'Active (Fixed/Performing)',
            value: stats.active,
            color: 'text-emerald-400',
            icon: CheckCircle2,
          },
          {
            label: 'Margin < 5%',
            value: stats.lowMargin,
            color: 'text-red-400',
            icon: AlertTriangle,
          },
          {
            label: 'Portfolio Value',
            value: `$${(stats.totalValue / 1e6).toFixed(1)}M`,
            color: 'text-emerald-400',
            icon: DollarSign,
          },
        ].map((s) => (
          <div key={s.label} className="bg-[#0a1628]/80 border border-sky-500/10 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <s.icon className={cn('w-3.5 h-3.5', s.color)} />
              <p className="text-[10px] text-sky-400/40 uppercase tracking-wider">{s.label}</p>
            </div>
            <p className={cn('text-xl font-bold font-display', s.color)}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1">
          {(['all', 'draft', 'negotiated', 'fixed', 'performing', 'completed'] as const).map(
            (s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={cn(
                  'text-[10px] px-2.5 py-1.5 rounded-lg border capitalize transition-all',
                  statusFilter === s
                    ? 'bg-sky-500/10 border-sky-500/30 text-sky-300'
                    : 'border-sky-500/10 text-sky-400/40 hover:text-sky-300',
                )}
              >
                {s === 'all'
                  ? `All (${stats.total})`
                  : (STATUS_CONFIG[s as FixtureStatus]?.label ?? s)}
              </button>
            ),
          )}
        </div>
        <div className="flex items-center gap-1 ml-auto">
          {(['all', 'voyage', 'time'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={cn(
                'text-[10px] px-2.5 py-1.5 rounded-lg border capitalize transition-all',
                typeFilter === t
                  ? 'bg-sky-500/10 border-sky-500/30 text-sky-300'
                  : 'border-sky-500/10 text-sky-400/40 hover:text-sky-300',
              )}
            >
              {t === 'all' ? 'All Types' : t === 'voyage' ? 'Voyage' : 'Time Charter'}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {voyagesQuery.isLoading ? (
          <div className="flex items-center justify-center py-16 text-sky-400/60">
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
            <span className="text-xs">Loading charter fixtures…</span>
          </div>
        ) : voyagesQuery.isError ? (
          <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-red-300">
                Could not load charter fixtures
              </p>
              <p className="text-[11px] text-red-300/70 mt-1">
                {(voyagesQuery.error as Error)?.message ?? 'Unknown error'}
              </p>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          stats.total === 0 ? (
            <EmptyState
              icon={CheckCircle2}
              headline="No charter fixtures on the books"
              description="The fixture book is clear — start a new fixture to begin negotiations."
              accentColor="#10b981"
            />
          ) : (
            <EmptyState
              icon={Filter}
              headline="No fixtures match these filters"
              description="Adjust the status or charter-type filters to expand the fixture list."
              accentColor="#38bdf8"
              action={{
                label: 'Reset filters',
                onClick: () => {
                  setStatusFilter('all');
                  setTypeFilter('all');
                },
              }}
            />
          )
        ) : (
          filtered.map((f) => <FixtureCard key={f.id} fixture={f} />)
        )}
      </div>
    </div>
  );
}
