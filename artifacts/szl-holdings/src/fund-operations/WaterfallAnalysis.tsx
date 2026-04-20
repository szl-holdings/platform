import { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { fmt } from './api';
import type { CapTableSummary } from './types';

export function WaterfallAnalysis({ capTable }: { capTable: CapTableSummary }) {
  const [exitVal, setExitVal] = useState(10_000_000);
  const exits = [5_000_000, 10_000_000, 25_000_000, 50_000_000, 100_000_000];

  const waterfall = useMemo(() => {
    if (!capTable?.holders.length) return [];
    const total = capTable.fullyDilutedTotal;
    if (total === 0) return [];

    return capTable.holders
      .filter((h) => h.totalShares > 0)
      .sort((a, b) => b.ownershipPct - a.ownershipPct)
      .map((h) => ({
        name: h.holder.name,
        type: h.holder.holderType,
        shares: h.totalShares,
        pct: h.ownershipPct,
        proceeds: Math.round((h.ownershipPct / 100) * exitVal),
      }));
  }, [capTable, exitVal]);

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-sm font-semibold text-white">Waterfall Analysis</h3>
          <p className="text-xs text-white/40 mt-0.5">
            Distribution of proceeds at configurable exit valuations
          </p>
        </div>
        <div className="flex gap-1.5">
          {exits.map((v) => (
            <button
              key={v}
              onClick={() => setExitVal(v)}
              className={`rounded-lg px-3 py-1.5 text-[10px] font-semibold transition ${exitVal === v ? 'bg-[#d4a054] text-black' : 'bg-white/[0.04] text-white/50 hover:bg-white/[0.06]'}`}
            >
              {fmt(v)}
            </button>
          ))}
        </div>
      </div>

      {waterfall.length > 0 ? (
        <div className="space-y-2">
          {waterfall.map((w) => (
            <div
              key={w.name}
              className="flex items-center gap-4 rounded-xl border border-white/[0.05] bg-white/[0.015] px-4 py-3"
            >
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white">{w.name}</div>
                <div className="text-[10px] text-white/40 capitalize">
                  {w.type.replace(/_/g, ' ')} · {w.pct.toFixed(2)}% ownership
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-white">{fmt(w.proceeds)}</div>
                <div className="text-[10px] text-white/35">{w.shares.toLocaleString()} shares</div>
              </div>
              <div className="w-24">
                <div className="h-1.5 rounded-full bg-white/[0.06]">
                  <div
                    className="h-1.5 rounded-full bg-[#d4a054]"
                    style={{ width: `${Math.min(w.pct, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
          <div className="flex items-center justify-between px-4 py-3 mt-3 border-t border-white/[0.06]">
            <span className="text-xs font-semibold text-white/60">Total Exit Value</span>
            <span className="text-lg font-semibold text-[#d4a054]">{fmt(exitVal)}</span>
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-sm text-white/40">
          No cap table data — seed data first to see waterfall analysis
        </div>
      )}
    </div>
  );
}
