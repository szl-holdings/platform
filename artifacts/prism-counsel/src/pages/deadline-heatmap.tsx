import { useState, useMemo } from "react";
import { BarChart3, AlertTriangle, Clock, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { useMatters, getPressureColor, getStatusColor, formatDeadline, daysUntil } from "@/data/matters";

const ACCENT = "#a78bfa";

interface HeatCell {
  matterId: string;
  matterName: string;
  obligationId: string;
  obligationTitle: string;
  dueDate: string;
  pressureScore: number;
  complexityScore: number;
  status: string;
  filingRequired: boolean;
  imminence: number;
  heatScore: number;
}

function heatColor(score: number): string {
  if (score >= 90) return "#ef4444";
  if (score >= 75) return "#f97316";
  if (score >= 55) return "#eab308";
  if (score >= 35) return "#84cc16";
  return "#22c55e";
}

function imminenceScore(daysLeft: number): number {
  if (daysLeft <= 0) return 100;
  if (daysLeft <= 2) return 95;
  if (daysLeft <= 5) return 85;
  if (daysLeft <= 10) return 70;
  if (daysLeft <= 21) return 50;
  if (daysLeft <= 45) return 30;
  return 15;
}

export default function DeadlineHeatmap() {
  const [viewMode, setViewMode] = useState<"heatmap" | "timeline">("heatmap");
  const [weekOffset, setWeekOffset] = useState(0);
  const { matters } = useMatters();

  const allCells: HeatCell[] = useMemo(() => {
    const cells: HeatCell[] = [];
    for (const matter of matters) {
      for (const obl of matter.obligations) {
        if (obl.status === "complete") continue;
        const days = daysUntil(obl.dueDate);
        const imm = imminenceScore(days);
        const heat = Math.round(imm * 0.6 + matter.pressureScore * 0.25 + matter.complexityScore * 0.15);
        cells.push({
          matterId: matter.id,
          matterName: matter.name,
          obligationId: obl.id,
          obligationTitle: obl.title,
          dueDate: obl.dueDate,
          pressureScore: matter.pressureScore,
          complexityScore: matter.complexityScore,
          status: obl.status,
          filingRequired: obl.filingRequired,
          imminence: imm,
          heatScore: Math.min(100, heat),
        });
      }
    }
    return cells.sort((a, b) => b.heatScore - a.heatScore);
  }, [matters]);

  const weekDays = useMemo(() => {
    const days: { date: Date; label: string; dayLabel: string; cells: HeatCell[] }[] = [];
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + weekOffset * 7);

    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      const dateStr = d.toISOString().split("T")[0];
      const cells = allCells.filter((c) => c.dueDate === dateStr);
      days.push({
        date: d,
        label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        dayLabel: d.toLocaleDateString("en-US", { weekday: "short" }),
        cells,
      });
    }
    return days;
  }, [allCells, weekOffset]);

  const matterRows = useMemo(() => {
    return matters.map((m) => ({
      matter: m,
      cells: allCells.filter((c) => c.matterId === m.id),
    }));
  }, [matters, allCells]);

  const criticalCount = allCells.filter((c) => c.heatScore >= 90).length;
  const highCount = allCells.filter((c) => c.heatScore >= 70 && c.heatScore < 90).length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="w-4 h-4" style={{ color: ACCENT }} />
            <h1 className="text-lg font-semibold font-display text-white/90">Deadline Pressure Heatmap</h1>
          </div>
          <p className="text-xs text-white/30">Imminence × complexity weighting across all open obligations</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode("heatmap")}
            className="text-xs px-3 py-1.5 rounded-lg transition-all"
            style={viewMode === "heatmap" ? { background: "rgba(167,139,250,0.15)", color: ACCENT, border: "1px solid rgba(167,139,250,0.25)" } : { background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            Heatmap
          </button>
          <button
            onClick={() => setViewMode("timeline")}
            className="text-xs px-3 py-1.5 rounded-lg transition-all"
            style={viewMode === "timeline" ? { background: "rgba(167,139,250,0.15)", color: ACCENT, border: "1px solid rgba(167,139,250,0.25)" } : { background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            Timeline
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
        {[
          { label: "Open Obligations", value: String(allCells.length) },
          { label: "Critical Heat (90+)", value: String(criticalCount), color: "#ef4444" },
          { label: "High Heat (70–89)", value: String(highCount), color: "#f97316" },
          { label: "Filing Required", value: String(allCells.filter((c) => c.filingRequired).length), color: ACCENT },
        ].map((s) => (
          <div key={s.label} className="rounded-xl p-4 border border-white/5" style={{ background: "rgba(255,255,255,0.02)" }}>
            <p className="text-[10px] text-white/30 mb-1">{s.label}</p>
            <p className="text-xl font-semibold font-mono" style={{ color: s.color || "rgba(255,255,255,0.7)" }}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 flex-wrap text-[10px] text-white/30">
        <span>Heat legend:</span>
        {[{ label: "Critical", min: 90 }, { label: "High", min: 70 }, { label: "Moderate", min: 50 }, { label: "Low", min: 0 }].map((l) => (
          <div key={l.label} className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm" style={{ background: heatColor(l.min + 1) }} />
            <span>{l.label}</span>
          </div>
        ))}
        <span className="ml-2 text-white/20">Score = imminence (60%) + pressure (25%) + complexity (15%)</span>
      </div>

      {viewMode === "heatmap" && (
        <div className="rounded-2xl border border-white/5 overflow-hidden" style={{ background: "rgba(255,255,255,0.02)" }}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left px-4 py-3 text-[10px] font-semibold text-white/30 uppercase tracking-wider w-48">Matter</th>
                  {["Imminence", "Pressure", "Complexity", "Heat Score", "Due", "Filing"].map((h) => (
                    <th key={h} className="text-center px-3 py-3 text-[10px] font-semibold text-white/30 uppercase tracking-wider">{h}</th>
                  ))}
                  <th className="text-left px-4 py-3 text-[10px] font-semibold text-white/30 uppercase tracking-wider">Obligation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {allCells.map((cell) => {
                  const hColor = heatColor(cell.heatScore);
                  return (
                    <tr key={cell.obligationId} className="hover:bg-white/2 transition-colors">
                      <td className="px-4 py-3">
                        <p className="text-[11px] font-medium text-white/70 leading-snug line-clamp-2">{cell.matterName.split(" — ")[0]}</p>
                        <p className="text-[9px] text-white/25 mt-0.5 font-mono">{cell.matterId}</p>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <div className="inline-flex items-center justify-center w-10 h-6 rounded text-[11px] font-mono font-semibold" style={{ background: `${heatColor(cell.imminence)}18`, color: heatColor(cell.imminence) }}>
                          {cell.imminence}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <div className="inline-flex items-center justify-center w-10 h-6 rounded text-[11px] font-mono font-semibold" style={{ background: `${getPressureColor(cell.pressureScore)}18`, color: getPressureColor(cell.pressureScore) }}>
                          {cell.pressureScore}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <div className="inline-flex items-center justify-center w-10 h-6 rounded text-[11px] font-mono font-semibold" style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)" }}>
                          {cell.complexityScore}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <div
                          className={`inline-flex items-center justify-center px-2.5 py-1 rounded-lg text-xs font-mono font-bold ${cell.heatScore >= 90 ? "pressure-critical" : ""}`}
                          style={{ background: `${hColor}22`, color: hColor, border: `1px solid ${hColor}33` }}
                        >
                          {cell.heatScore}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span className="text-[11px]" style={{ color: daysUntil(cell.dueDate) <= 3 ? "#ef4444" : daysUntil(cell.dueDate) <= 7 ? "#f97316" : "rgba(255,255,255,0.4)" }}>
                          {formatDeadline(cell.dueDate)}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center">
                        {cell.filingRequired ? (
                          <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: "rgba(167,139,250,0.12)", color: ACCENT }}>REQ</span>
                        ) : (
                          <span className="text-white/15 text-[10px]">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-[11px] text-white/60 leading-snug">{cell.obligationTitle}</p>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {viewMode === "timeline" && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setWeekOffset((v) => v - 1)}
              className="p-1.5 rounded-lg border border-white/10 text-white/40 hover:text-white/70 hover:border-white/20 transition-all"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="text-xs text-white/50 font-medium">
              {weekDays[0].label} — {weekDays[6].label}
            </span>
            <button
              onClick={() => setWeekOffset((v) => v + 1)}
              className="p-1.5 rounded-lg border border-white/10 text-white/40 hover:text-white/70 hover:border-white/20 transition-all"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            {weekOffset !== 0 && (
              <button onClick={() => setWeekOffset(0)} className="text-xs text-purple-400/60 hover:text-purple-400 transition-colors">Today</button>
            )}
          </div>
          <div className="grid grid-cols-7 gap-2">
            {weekDays.map((day) => {
              const todayStr = new Date().toDateString();
              const isToday = day.date.toDateString() === todayStr;
              const maxHeat = day.cells.length > 0 ? Math.max(...day.cells.map((c) => c.heatScore)) : 0;
              return (
                <div key={day.label} className="rounded-xl border overflow-hidden" style={{ background: "rgba(255,255,255,0.02)", borderColor: isToday ? "rgba(167,139,250,0.3)" : "rgba(255,255,255,0.05)" }}>
                  <div className="p-2 border-b border-white/5 text-center" style={isToday ? { background: "rgba(167,139,250,0.08)" } : {}}>
                    <p className="text-[9px] uppercase tracking-wider" style={{ color: isToday ? ACCENT : "rgba(255,255,255,0.3)" }}>{isToday ? "TODAY" : day.dayLabel}</p>
                    <p className="text-xs font-medium" style={{ color: isToday ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.6)" }}>{day.label.split(" ")[1]}</p>
                  </div>
                  <div
                    className="min-h-[80px] p-1.5 space-y-1 transition-colors"
                    style={{ background: maxHeat >= 90 ? "rgba(239,68,68,0.04)" : maxHeat >= 70 ? "rgba(249,115,22,0.03)" : "transparent" }}
                  >
                    {day.cells.length === 0 ? (
                      <div className="h-full flex items-center justify-center">
                        <span className="text-[9px] text-white/10">—</span>
                      </div>
                    ) : (
                      day.cells.map((cell) => (
                        <div
                          key={cell.obligationId}
                          className="rounded p-1.5 text-[9px] leading-tight"
                          style={{ background: `${heatColor(cell.heatScore)}15`, border: `1px solid ${heatColor(cell.heatScore)}25`, color: "rgba(255,255,255,0.7)" }}
                        >
                          <p className="font-medium line-clamp-2">{cell.obligationTitle}</p>
                          <p className="text-[8px] mt-0.5" style={{ color: heatColor(cell.heatScore) }}>{cell.heatScore}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="rounded-2xl border border-white/5 overflow-hidden" style={{ background: "rgba(255,255,255,0.02)" }}>
            <div className="px-5 py-3 border-b border-white/5">
              <p className="text-xs font-semibold text-white/50">Matter Pressure Overview</p>
            </div>
            <div className="p-4 space-y-3">
              {matterRows.map(({ matter, cells }) => {
                const maxHeat = cells.length > 0 ? Math.max(...cells.map((c) => c.heatScore)) : 0;
                return (
                  <div key={matter.id} className="flex items-center gap-3">
                    <div className="w-36 shrink-0">
                      <p className="text-[11px] text-white/60 truncate">{matter.name.split(" — ")[0]}</p>
                      <p className="text-[9px] text-white/25 font-mono">{cells.length} open</p>
                    </div>
                    <div className="flex-1 flex items-center gap-1">
                      {cells.slice(0, 8).map((cell) => (
                        <div
                          key={cell.obligationId}
                          className="h-5 rounded flex-1 min-w-[16px] max-w-[40px]"
                          style={{ background: heatColor(cell.heatScore), opacity: 0.7 + (cell.heatScore / 100) * 0.3 }}
                          title={`${cell.obligationTitle} — Heat: ${cell.heatScore}`}
                        />
                      ))}
                      {cells.length > 8 && <span className="text-[10px] text-white/20 ml-1">+{cells.length - 8}</span>}
                    </div>
                    <span className="text-[11px] font-mono w-8 text-right shrink-0" style={{ color: heatColor(maxHeat) }}>{maxHeat || "—"}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
