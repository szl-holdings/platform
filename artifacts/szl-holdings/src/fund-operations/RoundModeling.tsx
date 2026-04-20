import { useMemo, useState } from 'react';
import { fmt, pct } from './api';
import type { CapTableSummary } from './types';

export function RoundModeling({ capTable }: { capTable: CapTableSummary }) {
  const [roundSize, setRoundSize] = useState(1500000);
  const [preMoney, setPreMoney] = useState(8000000);

  const modeling = useMemo(() => {
    const postMoney = preMoney + roundSize;
    const newSharesPct = (roundSize / postMoney) * 100;
    const existingDilution = 100 - newSharesPct;

    const diluted = (capTable?.holders ?? [])
      .filter((h) => h.totalShares > 0)
      .map((h) => ({
        name: h.holder.name,
        prePct: h.ownershipPct,
        postPct: h.ownershipPct * (existingDilution / 100),
        dilution: h.ownershipPct - h.ownershipPct * (existingDilution / 100),
      }));

    return { postMoney, newSharesPct, existingDilution, diluted };
  }, [capTable, roundSize, preMoney]);

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
      <h3 className="text-sm font-semibold text-white mb-1">Pro-Forma Round Modeling</h3>
      <p className="text-xs text-white/40 mb-6">Scenario modeling for new funding rounds</p>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40 mb-1.5">
            Round Size ($)
          </label>
          <input
            type="number"
            value={roundSize}
            onChange={(e) => setRoundSize(Number(e.target.value))}
            className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#d4a054]/40"
          />
        </div>
        <div>
          <label className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40 mb-1.5">
            Pre-Money Valuation ($)
          </label>
          <input
            type="number"
            value={preMoney}
            onChange={(e) => setPreMoney(Number(e.target.value))}
            className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#d4a054]/40"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-center">
          <div className="text-xl font-semibold text-white">{fmt(modeling.postMoney)}</div>
          <div className="text-[10px] text-white/40 mt-1">Post-Money Valuation</div>
        </div>
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-center">
          <div className="text-xl font-semibold text-[#d4a054]">
            {modeling.newSharesPct.toFixed(1)}%
          </div>
          <div className="text-[10px] text-white/40 mt-1">New Investor Ownership</div>
        </div>
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-center">
          <div className="text-xl font-semibold text-white">
            {modeling.existingDilution.toFixed(1)}%
          </div>
          <div className="text-[10px] text-white/40 mt-1">Existing Shareholders Retain</div>
        </div>
      </div>

      {modeling.diluted.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-white/[0.06]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] bg-white/[0.025]">
                <th className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35">
                  Holder
                </th>
                <th className="px-4 py-2.5 text-right text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35">
                  Pre-Round %
                </th>
                <th className="px-4 py-2.5 text-right text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35">
                  Post-Round %
                </th>
                <th className="px-4 py-2.5 text-right text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35">
                  Dilution
                </th>
              </tr>
            </thead>
            <tbody>
              {modeling.diluted.map((d) => (
                <tr key={d.name} className="border-b border-white/[0.04]">
                  <td className="px-4 py-2.5 text-sm text-white">{d.name}</td>
                  <td className="px-4 py-2.5 text-right text-white/70">{d.prePct.toFixed(2)}%</td>
                  <td className="px-4 py-2.5 text-right text-white font-semibold">
                    {d.postPct.toFixed(2)}%
                  </td>
                  <td className="px-4 py-2.5 text-right text-[#c45a4a]">
                    -{d.dilution.toFixed(2)}%
                  </td>
                </tr>
              ))}
              <tr className="bg-white/[0.02]">
                <td className="px-4 py-2.5 text-sm font-semibold text-[#d4a054]">New Investor</td>
                <td className="px-4 py-2.5 text-right text-white/40">—</td>
                <td className="px-4 py-2.5 text-right text-[#d4a054] font-semibold">
                  {modeling.newSharesPct.toFixed(2)}%
                </td>
                <td className="px-4 py-2.5 text-right text-white/40">—</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
