import { TrendingUp, TrendingDown, ArrowRight, Clock, Minus } from "lucide-react";
import { useForecastDiff } from "../../hooks/use-prism-s31";

const DEMO_DIFFS = [
  { id: 1, matterId: 1, forecastType: "settlement_range", priorValue: { low: 120000, mid: 185000, high: 250000 }, currentValue: { low: 135000, mid: 195000, high: 260000 }, delta: { low: 15000, mid: 10000, high: 10000 }, direction: "up", driverSummary: "Reserve increase signal + additional medical documentation strengthened demand position", pressureDrivers: ["insurer", "medical", "evidence"], confidence: 0.78, createdAt: "2026-04-03T10:00:00Z" },
  { id: 2, matterId: 1, forecastType: "timeline", priorValue: { trialDate: "2026-08-15", settlementWindow: "2026-05-01" }, currentValue: { trialDate: "2026-09-20", settlementWindow: "2026-06-01" }, delta: { trialDelay: 36, settlementDelay: 31 }, direction: "extended", driverSummary: "Discovery extension granted — new cutoff May 15. Venue backlog pushing trial calendar.", pressureDrivers: ["venue", "deadline"], confidence: 0.72, createdAt: "2026-04-02T16:00:00Z" },
  { id: 3, matterId: 1, forecastType: "outcome_probability", priorValue: { settlement: 0.72, trial_win: 0.18, trial_loss: 0.10 }, currentValue: { settlement: 0.75, trial_win: 0.17, trial_loss: 0.08 }, delta: { settlement: 0.03, trial_win: -0.01, trial_loss: -0.02 }, direction: "favorable", driverSummary: "Reserve increase and positive communication trajectory favor settlement resolution", pressureDrivers: ["insurer", "settlement", "communication"], confidence: 0.70, createdAt: "2026-04-01T14:00:00Z" },
  { id: 4, matterId: 1, forecastType: "demand_readiness", priorValue: { readiness: 0.72, blockers: 4 }, currentValue: { readiness: 0.78, blockers: 3 }, delta: { readiness: 0.06, blockers: -1 }, direction: "improving", driverSummary: "IME report received and processed. Lost wage documentation still outstanding.", pressureDrivers: ["evidence", "medical"], confidence: 0.82, createdAt: "2026-03-30T11:00:00Z" },
];

export default function ForecastDiffPage() {
  const { data: diffData } = useForecastDiff(1);

  const diffs = diffData?.diffs?.length > 0 ? diffData.diffs : DEMO_DIFFS;
  const isDemo = !diffData?.diffs?.length;

  const DirIcon = ({ dir }: { dir: string }) => {
    if (dir === "up" || dir === "favorable" || dir === "improving") return <TrendingUp className="w-3.5 h-3.5 text-[#4a90b8]" />;
    if (dir === "down" || dir === "unfavorable" || dir === "declining") return <TrendingDown className="w-3.5 h-3.5 text-[#c45a4a]" />;
    if (dir === "extended") return <Clock className="w-3.5 h-3.5 text-[#d4a054]" />;
    return <Minus className="w-3.5 h-3.5 text-slate-500" />;
  };

  return (
    <div className="p-6 max-w-[1100px] mx-auto space-y-5">
      <div>
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-[#d4a054]" />
          <h1 className="text-lg font-semibold text-slate-100">Forecast Diff</h1>
          <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${isDemo ? "bg-[#d4a054]/10 text-[#d4a054]" : "bg-[#4a90b8]/10 text-[#4a90b8]"}`}>{isDemo ? "DEMO" : "LIVE"}</span>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">Snapshot-to-snapshot forecast changes with pressure drivers and confidence</p>
      </div>

      <div className="space-y-3">
        {diffs.map((diff: any) => (
          <div key={diff.id} className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <DirIcon dir={diff.direction} />
                <span className="text-sm font-medium text-slate-200">{(diff.forecastType ?? "").replace(/_/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase())}</span>
                <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${diff.direction === "up" || diff.direction === "favorable" || diff.direction === "improving" ? "bg-[#4a90b8]/10 text-[#4a90b8]" : diff.direction === "extended" ? "bg-[#d4a054]/10 text-[#d4a054]" : "bg-[#c45a4a]/10 text-[#c45a4a]"}`}>{diff.direction}</span>
              </div>
              <span className="text-[10px] text-slate-500">{new Date(diff.createdAt).toLocaleDateString()}</span>
            </div>

            <div className="flex items-center gap-4 mb-3 py-2 px-3 rounded bg-white/[0.02]">
              <div className="flex-1">
                <div className="text-[9px] text-slate-600 uppercase mb-1">Prior</div>
                <div className="text-xs text-slate-400 font-mono">{JSON.stringify(diff.priorValue)}</div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-600 shrink-0" />
              <div className="flex-1">
                <div className="text-[9px] text-slate-600 uppercase mb-1">Current</div>
                <div className="text-xs text-slate-200 font-mono">{JSON.stringify(diff.currentValue)}</div>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 mb-2">{diff.driverSummary}</p>

            <div className="flex items-center gap-3">
              <div className="flex gap-1">
                {(diff.pressureDrivers ?? []).map((d: string, i: number) => (
                  <span key={i} className="text-[8px] px-1.5 py-0.5 rounded bg-[#8b7ac8]/10 text-[#8b7ac8] font-mono">{d}</span>
                ))}
              </div>
              <span className="text-[9px] text-slate-600 font-mono">conf: {((diff.confidence ?? 0) * 100).toFixed(0)}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
