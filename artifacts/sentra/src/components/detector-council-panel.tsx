/**
 * Detector Council + Time-R1 + CTM bus panel (#5503).
 *
 * Surfaces the four AGI-stack capabilities on the Incident Commander:
 *   - "Run Edge Adversary Drill" button (POST /sentra/agi/edge-adversary-drill)
 *   - Latest MARBLE verdict, with arbitrated severity, distinct kinds,
 *     governance ceiling, and the chain receipt id.
 *   - Time-R1 trajectory score for the synthesised metric.
 *   - Latest CTM broadcasts, filtered by the drill's correlation key.
 *
 * No mock data — every render is the response of an actually-served
 * route or an empty state. Operators read the same chain receipts the
 * API server emits.
 */
import { useEffect, useState } from 'react';
import { Activity, Loader2, ShieldAlert, Waypoints, Zap } from 'lucide-react';
import {
  getCtmBusSnapshot,
  listCouncilVerdicts,
  runEdgeAdversaryDrill,
  type AgiSeverity,
  type CouncilVerdict,
  type CtmThought,
  type EdgeAdversaryDrillResponse,
} from '@/lib/sentra-api';

const SEV_COLORS: Record<AgiSeverity, string> = {
  low: '#94a3b8',
  medium: '#fbbf24',
  high: '#fb923c',
  critical: '#ef4444',
};

function truncReceipt(id: string | undefined): string {
  if (!id) return '—';
  return `${id.slice(0, 10)}…${id.slice(-6)}`;
}

export function DetectorCouncilPanel() {
  const [drill, setDrill] = useState<EdgeAdversaryDrillResponse | null>(null);
  const [verdicts, setVerdicts] = useState<CouncilVerdict[]>([]);
  const [bus, setBus] = useState<CtmThought[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const refreshSidecars = async (correlationKey?: string) => {
    const [v, b] = await Promise.all([
      listCouncilVerdicts(),
      getCtmBusSnapshot(correlationKey ? { correlationKey } : undefined),
    ]);
    setVerdicts(v?.verdicts ?? []);
    setBus(b?.thoughts ?? []);
  };

  useEffect(() => {
    void refreshSidecars();
  }, []);

  const runDrill = async () => {
    setBusy(true);
    setErr(null);
    const correlationKey = `drill-${Date.now()}`;
    const result = await runEdgeAdversaryDrill({ correlationKey });
    if (!result) {
      setErr('Drill request failed — check API server logs.');
      setBusy(false);
      return;
    }
    setDrill(result);
    await refreshSidecars(correlationKey);
    setBusy(false);
  };

  const verdict = drill?.council?.verdict ?? verdicts[0];

  return (
    <section
      className="sentra-panel p-5 space-y-4"
      data-testid="detector-council-panel"
      style={{ borderColor: 'rgba(201,183,135,0.22)' }}
    >
      <header className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Waypoints className="w-4 h-4 text-[#c9b787]" />
            <h3 className="text-xs uppercase tracking-widest font-mono font-bold text-[#c9b787]">
              Detector Council · Time-R1 · CTM Bus
            </h3>
          </div>
          <p className="text-xs text-slate-400 leading-snug max-w-2xl">
            MARBLE-style multi-detector arbitration with Time-R1 temporal scoring,
            antivenom adversarial input matching, and a CTM cross-detector broadcast
            bus. Run the drill to fire all four primitives and emit their Λ-receipts.
          </p>
        </div>
        <button
          data-testid="run-edge-adversary-drill"
          onClick={() => void runDrill()}
          disabled={busy}
          className="px-3 py-1.5 rounded border border-[#c9b787]/40 bg-[#c9b787]/10 text-[10px] font-mono uppercase tracking-widest text-[#c9b787] hover:bg-[#c9b787]/20 disabled:opacity-50 flex items-center gap-2 shrink-0"
        >
          {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
          {busy ? 'Running drill…' : 'Run Edge Adversary Drill'}
        </button>
      </header>

      {err && (
        <div className="text-[11px] font-mono text-rose-300 border border-rose-500/30 bg-rose-500/5 rounded p-2">
          {err}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* MARBLE verdict */}
        <div className="rounded border border-white/10 bg-black/30 p-3">
          <div className="text-[10px] font-mono uppercase tracking-widest text-slate-500 mb-2">
            MARBLE verdict
          </div>
          {verdict ? (
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span
                  className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase"
                  style={{
                    backgroundColor: `${SEV_COLORS[verdict.arbitratedSeverity]}22`,
                    color: SEV_COLORS[verdict.arbitratedSeverity],
                  }}
                >
                  {verdict.arbitratedSeverity}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  conf {Math.round(verdict.confidence * 100)}%
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  · {verdict.distinctKinds} kinds
                </span>
              </div>
              <div className="text-[11px] text-slate-300 leading-snug">
                {verdict.rationale}
              </div>
              <div className="text-[10px] text-slate-500 font-mono flex items-center gap-2 flex-wrap">
                <ShieldAlert className="w-3 h-3" />
                gov ceiling: {verdict.governanceCeiling}
              </div>
              <div className="text-[10px] text-slate-600 font-mono truncate">
                receipt: {truncReceipt(verdict.chainReceiptId)}
              </div>
            </div>
          ) : (
            <div className="text-[11px] text-slate-500 italic">
              No verdicts yet. Run a drill to convene the Council.
            </div>
          )}
        </div>

        {/* Time-R1 score */}
        <div className="rounded border border-white/10 bg-black/30 p-3">
          <div className="text-[10px] font-mono uppercase tracking-widest text-slate-500 mb-2">
            Time-R1 trajectory
          </div>
          {drill?.temporal?.findings?.[0] != null ? (
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span
                  className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase"
                  style={{
                    backgroundColor: `${SEV_COLORS[drill.temporal.findings[0].severity]}22`,
                    color: SEV_COLORS[drill.temporal.findings[0].severity],
                  }}
                >
                  {drill.temporal.findings[0].severity}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  score {(drill.temporal.findings[0].score * 100).toFixed(1)}
                </span>
              </div>
              <div className="text-[11px] text-slate-300 leading-snug">
                {drill.temporal.findings[0].summary}
              </div>
              <div className="text-[10px] text-slate-600 font-mono">
                receipt: anomaly.time-r1.v1
              </div>
            </div>
          ) : (
            <div className="text-[11px] text-slate-500 italic">
              No temporal finding yet. Run a drill to score a trajectory.
            </div>
          )}
        </div>

        {/* CTM bus */}
        <div className="rounded border border-white/10 bg-black/30 p-3">
          <div className="text-[10px] font-mono uppercase tracking-widest text-slate-500 mb-2 flex items-center gap-1.5">
            <Activity className="w-3 h-3" /> CTM bus · last broadcasts
          </div>
          {bus.length === 0 ? (
            <div className="text-[11px] text-slate-500 italic">
              Bus quiet. Drill broadcasts will appear here.
            </div>
          ) : (
            <ul className="space-y-1">
              {bus.slice(-6).reverse().map((t) => (
                <li
                  key={t.sequenceId}
                  className="text-[10px] font-mono text-slate-400 flex items-center gap-2"
                >
                  <span className="text-slate-600">#{t.sequenceId}</span>
                  <span className="text-[#c9b787]/80 w-32 truncate">{t.kind}</span>
                  <span className="text-slate-500 truncate flex-1">{t.source}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {drill && (
        <div className="rounded border border-emerald-500/20 bg-emerald-500/[0.04] p-3 text-[11px] font-mono text-emerald-200/90">
          drill complete · correlationKey={drill.correlationKey} ·
          antivenom findings: {drill.antivenom.findings.length} ·
          temporal findings: {drill.temporal.findings.length} ·
          broadcasts: {drill.broadcastReceipts.length} ·
          council receipt: {truncReceipt(drill.council?.chainReceiptId)}
        </div>
      )}
    </section>
  );
}
