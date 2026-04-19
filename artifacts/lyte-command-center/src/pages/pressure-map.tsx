import { useState } from "react";
import type { TooltipProps } from "recharts";
import { Thermometer, Shield } from "lucide-react";
import { type PressureCell } from "@/data/seed";
import { usePressureMap } from "@/data/api";

type Dimension = "team" | "account" | "program" | "sponsor";

const DIMENSIONS: { key: Dimension; label: string }[] = [
  { key: "team",    label: "Team"    },
  { key: "account", label: "Account" },
  { key: "program", label: "Program" },
  { key: "sponsor", label: "Sponsor" },
];

function scoreToColor(score: number): string {
  if (score >= 80) return "#ef4444";
  if (score >= 65) return "#f97316";
  if (score >= 50) return "#f59e0b";
  if (score >= 35) return "#84cc16";
  return "#22c55e";
}

function scoreToLabel(score: number): string {
  if (score >= 80) return "CRITICAL";
  if (score >= 65) return "HIGH";
  if (score >= 50) return "ELEVATED";
  if (score >= 35) return "MODERATE";
  return "NORMAL";
}

function HeatCell({ cell, selected, onClick, dim }: {
  cell: PressureCell;
  selected: boolean;
  onClick: () => void;
  dim: Dimension;
}) {
  const color = scoreToColor(cell.score);
  const dimLabel = cell[dim];
  return (
    <div
      className={`heat-cell p-3 cursor-pointer border transition-all ${
        selected ? "border-amber-400/60 shadow-lg shadow-amber-500/10" : "border-transparent hover:border-amber-500/20"
      }`}
      style={{ background: `${color}${Math.round(cell.score / 100 * 0.22 * 255).toString(16).padStart(2, "0")}` }}
      onClick={onClick}
      title={`${dimLabel} · ${cell.workflow}: ${cell.score}/100`}
    >
      <div className="flex items-start justify-between mb-1">
        <span className="text-[9px] font-mono truncate" style={{ color: `${color}` }}>{scoreToLabel(cell.score)}</span>
        <span className="text-[10px] font-mono font-bold" style={{ color }}>{cell.score}</span>
      </div>
      <p className="text-[10px] font-medium text-amber-100/80 leading-tight truncate">{cell.workflow}</p>
      <p className="text-[9px] text-amber-400/40 truncate mt-0.5">{dimLabel}</p>
    </div>
  );
}

export default function PressureMapPage() {
  const [selectedCell, setSelectedCell] = useState<PressureCell | null>(null);
  const [dim, setDim] = useState<Dimension>("team");
  const [filterVal, setFilterVal] = useState<string>("all");
  const { data, isLoading, error } = usePressureMap();

  if (isLoading) {
    return <div className="p-6 text-xs font-mono text-amber-400/50">Loading pressure map…</div>;
  }
  if (error || !data) {
    return <div className="p-6 text-xs font-mono text-red-400/70">Failed to load pressure map data.</div>;
  }
  const pressureCells = data.cells;
  const uniqueVals = [...new Set(pressureCells.map(c => c[dim]))].sort();

  const displayed = filterVal === "all"
    ? pressureCells
    : pressureCells.filter(c => c[dim] === filterVal);

  const maxScore = Math.max(...pressureCells.map(c => c.score));
  const maxCell = pressureCells.find(c => c.score === maxScore)!;
  const avgScore = Math.round(pressureCells.reduce((a, c) => a + c.score, 0) / pressureCells.length);
  const criticalCount = pressureCells.filter(c => c.score >= 80).length;
  const totalOverdue = pressureCells.reduce((a, c) => a + c.overdue, 0);

  function handleDimChange(next: Dimension) {
    setDim(next);
    setFilterVal("all");
    setSelectedCell(null);
  }

  return (
    <div className="p-6 space-y-6 max-w-6xl">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Thermometer className="w-4 h-4 text-amber-400" />
          <h1 className="text-xl font-display font-bold text-amber-50">Pressure Map</h1>
        </div>
        <p className="text-sm text-amber-100/50">Live heatmap of operational load across teams, accounts, programs, and sponsors.</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Max Pressure Score", value: `${maxScore}/100`, sub: maxCell.team, color: "red" },
          { label: "Avg Pressure", value: `${avgScore}/100`, sub: "across all workflows", color: "amber" },
          { label: "Critical Workflows", value: criticalCount, sub: "score ≥ 80", color: "red" },
          { label: "Total Overdue Items", value: totalOverdue, sub: "all teams", color: "amber" },
        ].map(kpi => (
          <div key={kpi.label} className="cockpit-panel p-4">
            <p className="text-[10px] font-mono text-amber-400/40 uppercase mb-1">{kpi.label}</p>
            <p className={`text-2xl font-mono font-bold ${kpi.color === "red" ? "text-red-400" : "text-amber-300"}`}>{kpi.value}</p>
            <p className="text-[10px] text-amber-400/40">{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[10px] font-mono text-amber-400/40">SCORE LEGEND:</span>
        {[
          { label: "NORMAL 0–34", color: "#22c55e" },
          { label: "MODERATE 35–49", color: "#84cc16" },
          { label: "ELEVATED 50–64", color: "#f59e0b" },
          { label: "HIGH 65–79", color: "#f97316" },
          { label: "CRITICAL 80+", color: "#ef4444" },
        ].map(l => (
          <div key={l.label} className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-sm" style={{ background: l.color }} />
            <span className="text-[9px] font-mono" style={{ color: l.color }}>{l.label}</span>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {/* Heatmap */}
        <div className="md:col-span-2 cockpit-panel p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs font-semibold text-amber-100">Operational Pressure Heatmap</p>
              <p className="text-[10px] text-amber-400/40">Score = weighted(overdue × 0.4 + blocked × 0.35 + escalated × 0.25) / open</p>
            </div>
            <span className="proof-badge"><Shield className="w-2.5 h-2.5" />ALLOY-METRICS</span>
          </div>

          {/* Dimension selector */}
          <div className="flex items-center gap-3 mb-3">
            <span className="text-[9px] font-mono text-amber-400/40 uppercase">View by:</span>
            <div className="flex gap-1">
              {DIMENSIONS.map(d => (
                <button
                  key={d.key}
                  onClick={() => handleDimChange(d.key)}
                  className={`px-2.5 py-0.5 rounded text-[9px] font-mono transition-colors border ${
                    dim === d.key
                      ? "bg-amber-500/15 text-amber-300 border-amber-500/35"
                      : "text-amber-400/40 border-transparent hover:text-amber-300"
                  }`}
                >
                  {d.label.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Value filter */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            <button
              onClick={() => setFilterVal("all")}
              className={`px-2 py-0.5 rounded text-[9px] font-mono transition-colors ${filterVal === "all" ? "bg-amber-500/15 text-amber-300 border border-amber-500/25" : "text-amber-400/40 hover:text-amber-300"}`}
            >
              ALL
            </button>
            {uniqueVals.map(v => (
              <button
                key={v}
                onClick={() => setFilterVal(v)}
                className={`px-2 py-0.5 rounded text-[9px] font-mono transition-colors ${filterVal === v ? "bg-amber-500/15 text-amber-300 border border-amber-500/25" : "text-amber-400/40 hover:text-amber-300"}`}
              >
                {v.toUpperCase()}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
            {displayed.map((cell, i) => (
              <HeatCell
                key={i}
                cell={cell}
                dim={dim}
                selected={selectedCell?.workflow === cell.workflow && selectedCell?.[dim] === cell[dim]}
                onClick={() => setSelectedCell(selectedCell?.workflow === cell.workflow ? null : cell)}
              />
            ))}
          </div>
        </div>

        {/* Detail panel */}
        <div className="cockpit-panel p-4 space-y-4">
          {selectedCell ? (
            <>
              <div className="flex items-start gap-2 pb-3 border-b border-amber-500/10">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-amber-100 truncate">{selectedCell.workflow}</p>
                  <p className="text-[10px] font-mono text-amber-400/50 truncate">{selectedCell.team}</p>
                </div>
                <span
                  className="text-sm font-mono font-bold px-2 py-0.5 rounded border shrink-0"
                  style={{ color: scoreToColor(selectedCell.score), borderColor: scoreToColor(selectedCell.score) + "40", background: scoreToColor(selectedCell.score) + "15" }}
                >
                  {selectedCell.score}
                </span>
              </div>

              {/* Dimension metadata */}
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Account", value: selectedCell.account },
                  { label: "Program", value: selectedCell.program },
                  { label: "Sponsor", value: selectedCell.sponsor },
                  { label: "Team", value: selectedCell.team },
                ].map(m => (
                  <div key={m.label}>
                    <p className="text-[9px] font-mono text-amber-400/35 uppercase">{m.label}</p>
                    <p className="text-[10px] text-amber-200/70 truncate">{m.value}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-2.5 pt-2 border-t border-amber-500/10">
                {[
                  { label: "Open Items", value: selectedCell.open, color: "text-amber-300" },
                  { label: "Overdue", value: selectedCell.overdue, color: "text-orange-400" },
                  { label: "Blocked", value: selectedCell.blocked, color: "text-red-400" },
                  { label: "Escalated", value: selectedCell.escalated, color: "text-red-500" },
                ].map(m => (
                  <div key={m.label} className="flex items-center justify-between">
                    <span className="text-[11px] text-amber-400/60">{m.label}</span>
                    <span className={`text-sm font-mono font-semibold ${m.color}`}>{m.value}</span>
                  </div>
                ))}
              </div>

              {/* Bar visualization */}
              <div className="space-y-1.5 pt-2 border-t border-amber-500/8">
                {[
                  { label: "Overdue Rate", ratio: selectedCell.overdue / selectedCell.open, color: "#f97316" },
                  { label: "Blocked Rate", ratio: selectedCell.blocked / selectedCell.open, color: "#ef4444" },
                  { label: "Escalation Rate", ratio: selectedCell.escalated / selectedCell.open, color: "#dc2626" },
                ].map(b => (
                  <div key={b.label}>
                    <div className="flex justify-between mb-0.5">
                      <span className="text-[9px] font-mono text-amber-400/40">{b.label}</span>
                      <span className="text-[9px] font-mono" style={{ color: b.color }}>{Math.round(b.ratio * 100)}%</span>
                    </div>
                    <div className="h-1 rounded-full bg-amber-500/8 overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(b.ratio * 100, 100)}%`, background: b.color }} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-2">
                <p className="text-[10px] font-mono text-amber-400/40 mb-1.5">PRESSURE DRIVER</p>
                <p className="text-xs text-amber-100/60">
                  {selectedCell.score >= 80
                    ? `Critical pressure — ${selectedCell.escalated} escalations and ${selectedCell.blocked} blocked items require immediate intervention.`
                    : selectedCell.score >= 65
                    ? `High pressure — escalation frequency is elevated. Consider capacity review.`
                    : selectedCell.score >= 50
                    ? `Elevated pressure — overdue rate warrants attention before it compounds.`
                    : `Pressure is within normal operating range.`
                  }
                </p>
              </div>

              <div className="proof-badge mt-1 self-start">
                <Shield className="w-2.5 h-2.5" />
                ALLOY-P-{selectedCell.team.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 3)}-001
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-center">
              <Thermometer className="w-8 h-8 text-amber-400/20 mb-3" />
              <p className="text-xs text-amber-400/40">Select a cell to see pressure breakdown</p>
              <p className="text-[10px] text-amber-400/25 mt-1">Includes team, account, program &amp; sponsor</p>
            </div>
          )}
        </div>
      </div>

      {/* Ranked list */}
      <div className="cockpit-panel p-4">
        <p className="text-xs font-semibold text-amber-100 mb-3">Pressure Ranking — Top 8</p>
        <div className="space-y-1.5">
          {[...pressureCells].sort((a, b) => b.score - a.score).slice(0, 8).map((cell, i) => (
            <div key={i} className="flex items-center gap-3 py-1.5">
              <span className="text-[10px] font-mono text-amber-400/30 w-4 shrink-0">#{i + 1}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-medium text-amber-100 truncate">{cell.workflow}</span>
                  <span className="text-[9px] font-mono text-amber-400/40 shrink-0">· {cell.team}</span>
                  <span className="text-[9px] font-mono text-amber-400/25 shrink-0">· {cell.program}</span>
                </div>
                <div className="h-1 mt-1 rounded-full bg-amber-500/8 overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${cell.score}%`, background: scoreToColor(cell.score) }} />
                </div>
              </div>
              <div className="shrink-0 text-right">
                <span className="text-xs font-mono font-bold block" style={{ color: scoreToColor(cell.score) }}>{cell.score}</span>
                <span className="text-[9px] font-mono text-amber-400/30">{cell.sponsor}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export type { TooltipProps };
