import { StatusBadge as DSStatusBadge, type StatusVariant } from '@szl-holdings/design-system';
import { m } from 'framer-motion';
import { ArrowDownRight, ArrowUpRight, X } from 'lucide-react';
import { type ElementType, useState } from 'react';
import { derivePeriodDates, fmt, PORTFOLIO_COMPANIES } from './api';

const FUND_STATUS_VARIANT: Record<string, StatusVariant> = {
  verified: 'success', compliant: 'success', final: 'success', fully_funded: 'success',
  pending: 'pending', review_needed: 'pending',
  filed: 'info', notices_sent: 'info', approved: 'info',
  draft: 'neutral',
  overdue: 'error', expired: 'error',
  distributed: 'escalated',
};
export function StatusBadge({ status }: { status: string }) {
  return <DSStatusBadge variant={FUND_STATUS_VARIANT[status] ?? 'neutral'} label={status.replace(/_/g, ' ')} />;
}

export function MetricCard({
  label,
  value,
  sub,
  icon: Icon,
  color,
  trend,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: ElementType;
  color: string;
  trend?: 'up' | 'down' | 'neutral';
}) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
      <div className="flex items-start justify-between mb-3">
        <div
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.08] bg-black/20"
          style={{ color }}
        >
          <Icon className="h-4 w-4" />
        </div>
        {trend &&
          trend !== 'neutral' &&
          (trend === 'up' ? (
            <ArrowUpRight className="h-4 w-4" style={{ color: '#6aaa72' }} />
          ) : (
            <ArrowDownRight className="h-4 w-4" style={{ color: '#c45a4a' }} />
          ))}
      </div>
      <div className="text-2xl font-semibold tracking-tight text-white">{value}</div>
      <div className="mt-1 text-xs text-white/50">{label}</div>
      {sub && <div className="mt-0.5 text-[11px] text-white/35">{sub}</div>}
    </div>
  );
}

export function ChartTooltipContent({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-white/[0.08] bg-[var(--gi-bg-surface)] px-4 py-3 text-xs">
      <p className="text-white/50 mb-2">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2 py-0.5">
          <div className="h-2 w-2 rounded-full" style={{ background: p.color }} />
          <span className="text-white/60">{p.name}:</span>
          <span className="font-semibold text-white">{fmt(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: ElementType;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-white/[0.08] bg-white/[0.01] p-8 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03]">
        <Icon className="h-6 w-6 text-white/30" />
      </div>
      <h3 className="text-sm font-semibold text-white/60">{title}</h3>
      <p className="mt-2 max-w-sm mx-auto text-xs leading-5 text-white/35">{description}</p>
    </div>
  );
}

export function DataEntryModal({
  open,
  onClose,
  onSubmit,
  title,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: Record<string, string>) => void;
  title: string;
}) {
  const [form, setForm] = useState<Record<string, string>>({
    companySlug: 'vessels',
    periodType: 'monthly',
    year: '2026',
    periodValue: '4',
    revenue: '',
    operatingExpenses: '',
    cashAndEquivalents: '',
    cogs: '',
  });

  if (!open) return null;

  const handleSubmit = () => {
    if (!form.revenue || !form.year || !form.periodValue) return;
    const dates = derivePeriodDates(form.periodType, form.year, form.periodValue);
    onSubmit({ ...form, periodStart: dates.start, periodEnd: dates.end, periodLabel: dates.label });
    setForm({
      companySlug: 'vessels',
      periodType: 'monthly',
      year: '2026',
      periodValue: '4',
      revenue: '',
      operatingExpenses: '',
      cashAndEquivalents: '',
      cogs: '',
    });
  };

  const inputCls =
    'w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-[#d4a054]/40';
  const labelCls =
    'block text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40 mb-1.5';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <m.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg rounded-2xl border border-white/[0.08] bg-[var(--gi-bg-surface)] p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/[0.06]">
            <X className="h-4 w-4 text-white/50" />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Portfolio Company</label>
            <select
              value={form.companySlug}
              onChange={(e) => setForm((f) => ({ ...f, companySlug: e.target.value }))}
              className={inputCls}
            >
              {PORTFOLIO_COMPANIES.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Period Type</label>
            <select
              value={form.periodType}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  periodType: e.target.value,
                  periodValue: e.target.value === 'monthly' ? '1' : '1',
                }))
              }
              className={inputCls}
            >
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Year</label>
            <select
              value={form.year}
              onChange={(e) => setForm((f) => ({ ...f, year: e.target.value }))}
              className={inputCls}
            >
              {['2024', '2025', '2026', '2027'].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>
              {form.periodType === 'monthly' ? 'Month' : 'Quarter'}
            </label>
            <select
              value={form.periodValue}
              onChange={(e) => setForm((f) => ({ ...f, periodValue: e.target.value }))}
              className={inputCls}
            >
              {form.periodType === 'monthly'
                ? Array.from({ length: 12 }, (_, i) => {
                    const mo = new Date(2026, i, 1).toLocaleString('en-US', { month: 'long' });
                    return (
                      <option key={i + 1} value={String(i + 1)}>
                        {mo}
                      </option>
                    );
                  })
                : [1, 2, 3, 4].map((q) => (
                    <option key={q} value={String(q)}>
                      Q{q}
                    </option>
                  ))}
            </select>
          </div>
          {[
            { key: 'revenue', label: 'Revenue ($)' },
            { key: 'cogs', label: 'COGS ($)' },
            { key: 'operatingExpenses', label: 'Operating Expenses ($)' },
            { key: 'cashAndEquivalents', label: 'Cash & Equivalents ($)' },
          ].map((f) => (
            <div key={f.key}>
              <label className={labelCls}>{f.label}</label>
              <input
                type="number"
                value={form[f.key]}
                onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
                className={inputCls}
              />
            </div>
          ))}
        </div>
        <div className="mt-6 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="rounded-xl border border-white/10 px-4 py-2 text-xs font-semibold text-white/60 hover:bg-white/[0.04]"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="rounded-xl bg-[#d4a054] px-4 py-2 text-xs font-semibold text-black hover:bg-[#d4a054]/90"
          >
            Submit Financial Data
          </button>
        </div>
      </m.div>
    </div>
  );
}
