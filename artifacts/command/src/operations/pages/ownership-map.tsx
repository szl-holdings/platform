import { type OwnershipRecord, ownershipMap, severityColors } from '@lyte/lib/business-data';
import { cn } from '@lyte/lib/utils';
import { AlertTriangle, CheckCircle2, DollarSign, HelpCircle, Users } from 'lucide-react';

function formatCurrency(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

const statusConfig = {
  clear: {
    label: 'Clear',
    color: 'text-[#6b8f71]',
    bg: 'bg-[#6b8f71]/5',
    border: 'border-[#6b8f71]/20',
    icon: CheckCircle2,
    dot: 'bg-[#6b8f71]',
  },
  ambiguous: {
    label: 'Ambiguous',
    color: 'text-[#d4a054]',
    bg: 'bg-[#d4a054]/5',
    border: 'border-[#d4a054]/20',
    icon: HelpCircle,
    dot: 'bg-[#d4a054]',
  },
  missing: {
    label: 'Missing',
    color: 'text-[#c45a4a]',
    bg: 'bg-[#c45a4a]/5',
    border: 'border-[#c45a4a]/20',
    icon: AlertTriangle,
    dot: 'bg-[#c45a4a] animate-pulse',
  },
};

function OwnerCard({ record }: { record: OwnershipRecord }) {
  const s = statusConfig[record.status];
  const Icon = s.icon;

  return (
    <div
      className={cn('rounded-xl p-4 border transition-all hover:bg-white/[0.04]', s.border, s.bg)}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-start gap-2.5">
          <div className={cn('w-2 h-2 rounded-full mt-1.5 shrink-0', s.dot)} />
          <div>
            <h3 className="text-sm font-medium text-white/90 leading-tight mb-0.5">
              {record.area}
            </h3>
            <div className="text-[11px] text-slate-500">{record.team}</div>
          </div>
        </div>
        <span
          className={cn(
            'text-[9px] font-mono px-1.5 py-0.5 rounded border uppercase tracking-wide flex items-center gap-1',
            s.color,
            s.border,
          )}
        >
          <Icon className="w-2.5 h-2.5" />
          {s.label}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 text-[11px]">
        <div>
          <div className="text-slate-600 mb-0.5">Owner</div>
          <div className={cn('font-medium', record.owner ? 'text-white' : 'text-[#c45a4a]')}>
            {record.owner || 'Unassigned'}
          </div>
        </div>
        <div>
          <div className="text-slate-600 mb-0.5">Open Items</div>
          <div className="text-white font-mono">{record.openItems}</div>
        </div>
        <div>
          <div className="text-slate-600 mb-0.5">Stalled</div>
          <div
            className={cn(
              'font-mono font-semibold',
              record.stalledItems > 0 ? s.color : 'text-[#6b8f71]',
            )}
          >
            {record.stalledItems}
          </div>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between text-[11px]">
        <span className="text-slate-500">Value at risk</span>
        <span className={cn('font-mono font-semibold', s.color)}>
          {formatCurrency(record.valueAtRisk)}
        </span>
      </div>
    </div>
  );
}

export default function OwnershipMapPage() {
  const missing = ownershipMap.filter((r) => r.status === 'missing');
  const ambiguous = ownershipMap.filter((r) => r.status === 'ambiguous');
  const clear = ownershipMap.filter((r) => r.status === 'clear');

  const totalVaRAtRisk = [...missing, ...ambiguous].reduce((sum, r) => sum + r.valueAtRisk, 0);
  const totalMissingItems = missing.reduce((sum, r) => sum + r.stalledItems, 0);

  return (
    <div className="max-w-[1100px] space-y-6">
      <div>
        <h1 className="font-display font-bold text-2xl text-white tracking-tight">Ownership Map</h1>
        <p className="text-sm text-slate-400 mt-1">
          Where accountability is clear, ambiguous, or missing across your business
        </p>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[
          {
            label: 'Missing Owner',
            value: missing.length,
            color: 'text-[#c45a4a]',
            bg: 'border-[#c45a4a]/20 bg-[#c45a4a]/5',
          },
          {
            label: 'Ambiguous',
            value: ambiguous.length,
            color: 'text-[#d4a054]',
            bg: 'border-[#d4a054]/20 bg-[#d4a054]/5',
          },
          {
            label: 'Clear Ownership',
            value: clear.length,
            color: 'text-[#6b8f71]',
            bg: 'border-[#6b8f71]/20 bg-[#6b8f71]/5',
          },
          {
            label: 'VaR Without Owner',
            value: formatCurrency(totalVaRAtRisk),
            color: 'text-[#c45a4a]',
            bg: 'border-[#c45a4a]/20 bg-[#c45a4a]/5',
          },
        ].map((stat) => (
          <div key={stat.label} className={cn('rounded-xl p-4 border', stat.bg)}>
            <div className="text-[11px] text-slate-400 mb-1">{stat.label}</div>
            <div className={cn('font-display font-bold text-xl', stat.color)}>{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 lg:col-span-8 space-y-4">
          {missing.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-[#c45a4a]" />
                <h2 className="font-display font-semibold text-sm text-[#c45a4a]">
                  Missing Owner — Immediate Risk
                </h2>
                <span className="text-[10px] text-[#c45a4a] bg-[#c45a4a]/10 px-1.5 py-0.5 rounded border border-[#c45a4a]/20">
                  {missing.length}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {missing.map((r) => (
                  <OwnerCard key={r.id} record={r} />
                ))}
              </div>
            </div>
          )}

          {ambiguous.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <HelpCircle className="w-4 h-4 text-[#d4a054]" />
                <h2 className="font-display font-semibold text-sm text-[#d4a054]">
                  Ambiguous — Clarity Required
                </h2>
                <span className="text-[10px] text-[#d4a054] bg-[#d4a054]/10 px-1.5 py-0.5 rounded border border-[#d4a054]/20">
                  {ambiguous.length}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {ambiguous.map((r) => (
                  <OwnerCard key={r.id} record={r} />
                ))}
              </div>
            </div>
          )}

          {clear.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="w-4 h-4 text-[#6b8f71]" />
                <h2 className="font-display font-semibold text-sm text-[#6b8f71]">
                  Clear Ownership
                </h2>
                <span className="text-[10px] text-[#6b8f71] bg-[#6b8f71]/10 px-1.5 py-0.5 rounded border border-[#6b8f71]/20">
                  {clear.length}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {clear.map((r) => (
                  <OwnerCard key={r.id} record={r} />
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="col-span-12 lg:col-span-4 space-y-4">
          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
            <h3 className="font-display font-semibold text-sm text-white mb-4">Ownership Health</h3>
            <div className="space-y-3">
              {[
                {
                  label: 'Clear',
                  count: clear.length,
                  color: 'bg-[#6b8f71]',
                  pct: (clear.length / ownershipMap.length) * 100,
                },
                {
                  label: 'Ambiguous',
                  count: ambiguous.length,
                  color: 'bg-[#d4a054]',
                  pct: (ambiguous.length / ownershipMap.length) * 100,
                },
                {
                  label: 'Missing',
                  count: missing.length,
                  color: 'bg-[#c45a4a]',
                  pct: (missing.length / ownershipMap.length) * 100,
                },
              ].map((bar) => (
                <div key={bar.label}>
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="text-slate-400">{bar.label}</span>
                    <span className="text-white font-mono">
                      {bar.count} ({bar.pct.toFixed(0)}%)
                    </span>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className={cn('h-full rounded-full', bar.color)}
                      style={{ width: `${bar.pct}%`, opacity: 0.8 }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-[#c45a4a]/15 bg-[#c45a4a]/5 p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-[#c45a4a]" />
              <h3 className="font-display font-semibold text-sm text-[#c45a4a]">Top Risk Areas</h3>
            </div>
            <div className="space-y-2">
              {[...missing, ...ambiguous]
                .sort((a, b) => b.valueAtRisk - a.valueAtRisk)
                .slice(0, 4)
                .map((r) => (
                  <div key={r.id} className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-300 truncate flex-1 mr-2">{r.area}</span>
                    <span
                      className={cn(
                        'font-mono shrink-0',
                        r.status === 'missing' ? 'text-[#c45a4a]' : 'text-[#d4a054]',
                      )}
                    >
                      {formatCurrency(r.valueAtRisk)}
                    </span>
                  </div>
                ))}
            </div>
          </div>

          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
            <h3 className="font-display font-semibold text-sm text-white mb-3">Stalled Items</h3>
            <div className="space-y-2">
              {ownershipMap
                .filter((r) => r.stalledItems > 0)
                .sort((a, b) => b.stalledItems - a.stalledItems)
                .map((r) => {
                  const s = statusConfig[r.status];
                  return (
                    <div key={r.id} className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-300 truncate flex-1 mr-2">{r.area}</span>
                      <span className={cn('font-mono font-semibold shrink-0', s.color)}>
                        {r.stalledItems} stalled
                      </span>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
