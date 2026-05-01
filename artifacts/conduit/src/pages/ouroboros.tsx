/**
 * Conduit/Amaru Ouroboros — Seked + Unit-Fraction inspection.
 *
 * Demonstrates two RMP primitives applied to Amaru's hardest problems:
 *
 *  1. Seked slope audit (RMP 56–60) — bounded saturation detection.
 *     Conventional dy/dx blows up near a vertical asymptote; the
 *     Egyptian seked is bounded and stable.
 *
 *  2. Unit-fraction decomposition (RMP 2/n table) — turn any threshold
 *     into a sum of distinct unit fractions so it's auditable by a
 *     human and reproducible across heterogeneous runtimes with no
 *     floating-point drift.
 *
 * Wires to /api/ouroboros/amaru/observe-metric and /audit-threshold.
 */
import { useState } from 'react';

interface SekedReading {
  seked: number;
  palms: number;
  cubits: number;
  verdict: 'STABLE' | 'RISING' | 'SATURATING' | 'VERTICAL';
}

interface AmaruSignal {
  metricId: string;
  reading: SekedReading;
  degrees: number;
  recommendation: 'CONTINUE' | 'WATCH' | 'THROTTLE' | 'HALT';
  timestamp: number;
}

interface UnitFractionDecomposition {
  numerator: number;
  denominator: number;
  terms: number[];
  exact: boolean;
}

interface ThresholdAudit {
  raw: { p: number; q: number };
  decomposition: UnitFractionDecomposition;
  inspectable: boolean;
  explanation: string;
}

const RECOMMENDATION_COLORS: Record<AmaruSignal['recommendation'], string> = {
  CONTINUE: 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10',
  WATCH: 'text-amber-300 border-amber-500/40 bg-amber-500/10',
  THROTTLE: 'text-orange-400 border-orange-500/40 bg-orange-500/10',
  HALT: 'text-rose-400 border-rose-500/40 bg-rose-500/10',
};

export default function OuroborosPage() {
  // Seked surface
  const [metricId, setMetricId] = useState('cpu-saturation');
  const [horizontal, setHorizontal] = useState('5');
  const [vertical, setVertical] = useState('10');
  const [signal, setSignal] = useState<AmaruSignal | null>(null);
  const [sekedLoading, setSekedLoading] = useState(false);
  const [sekedError, setSekedError] = useState<string | null>(null);

  // Unit-fraction surface
  const [p, setP] = useState('3');
  const [q, setQ] = useState('7');
  const [audit, setAudit] = useState<ThresholdAudit | null>(null);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditError, setAuditError] = useState<string | null>(null);

  async function observe() {
    setSekedLoading(true);
    setSekedError(null);
    try {
      const res = await fetch('/api/ouroboros/amaru/observe-metric', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metricId,
          horizontal: Number(horizontal),
          vertical: Number(vertical),
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setSignal(await res.json());
    } catch (e) {
      setSekedError((e as Error).message);
    } finally {
      setSekedLoading(false);
    }
  }

  async function inspect() {
    setAuditLoading(true);
    setAuditError(null);
    try {
      const res = await fetch('/api/ouroboros/amaru/audit-threshold', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ p: Number(p), q: Number(q) }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setAudit(await res.json());
    } catch (e) {
      setAuditError((e as Error).message);
    } finally {
      setAuditLoading(false);
    }
  }

  return (
    <div className="px-6 py-8 max-w-6xl mx-auto space-y-8">
      <div>
        <div className="text-xs font-mono uppercase tracking-wider text-amber-400/80">
          OUROBOROS · RMP 56–60 + 2/n TABLE
        </div>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">
          Seked Audit + Unit-Fraction Thresholds
        </h1>
        <p className="mt-1 text-sm text-zinc-400 max-w-2xl">
          Bounded saturation detection (Egyptian seked, c. 1650 BCE) and
          inspectable threshold decomposition. Both primitives are
          governed by A11oy and free of floating-point drift across
          heterogeneous runtimes.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-5">
          <div className="text-sm font-semibold text-white">Seked slope audit</div>
          <div className="mt-1 text-xs text-zinc-500">
            Submit a (dx, dy) sample. The auditor maintains a rolling window
            and emits a recommendation: CONTINUE / WATCH / THROTTLE / HALT.
          </div>
          <div className="mt-4 space-y-3">
            <label className="block text-xs text-zinc-400">
              Metric ID
              <input
                value={metricId}
                onChange={(e) => setMetricId(e.target.value)}
                className="mt-1 w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-sm text-white"
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-xs text-zinc-400">
                Horizontal (dx)
                <input
                  type="number"
                  value={horizontal}
                  onChange={(e) => setHorizontal(e.target.value)}
                  className="mt-1 w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-sm text-white font-mono"
                />
              </label>
              <label className="block text-xs text-zinc-400">
                Vertical (dy)
                <input
                  type="number"
                  value={vertical}
                  onChange={(e) => setVertical(e.target.value)}
                  className="mt-1 w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-sm text-white font-mono"
                />
              </label>
            </div>
            <button
              onClick={observe}
              disabled={sekedLoading}
              className="w-full rounded-md bg-amber-500 px-3 py-2 text-sm font-medium text-zinc-950 hover:bg-amber-400 disabled:opacity-50"
            >
              {sekedLoading ? 'Sampling…' : 'Submit sample'}
            </button>
            {sekedError && (
              <div className="rounded-md border border-rose-500/40 bg-rose-500/10 p-2 text-xs text-rose-300">
                {sekedError}
              </div>
            )}
          </div>
          {signal && (
            <div className="mt-5 space-y-3">
              <div
                className={`inline-block rounded-md border px-3 py-1 text-xs font-mono uppercase tracking-wider ${RECOMMENDATION_COLORS[signal.recommendation]}`}
              >
                {signal.recommendation}
              </div>
              <dl className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div>
                  <dt className="text-zinc-500">verdict</dt>
                  <dd className="text-white">{signal.reading.verdict}</dd>
                </div>
                <div>
                  <dt className="text-zinc-500">seked</dt>
                  <dd className="text-amber-300">{signal.reading.seked.toFixed(3)}</dd>
                </div>
                <div>
                  <dt className="text-zinc-500">palms / cubit</dt>
                  <dd className="text-white">
                    {signal.reading.palms.toFixed(2)} / {signal.reading.cubits}
                  </dd>
                </div>
                <div>
                  <dt className="text-zinc-500">slope (deg)</dt>
                  <dd className="text-white">{signal.degrees.toFixed(2)}°</dd>
                </div>
              </dl>
            </div>
          )}
        </div>

        <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-5">
          <div className="text-sm font-semibold text-white">Threshold decomposition</div>
          <div className="mt-1 text-xs text-zinc-500">
            Decompose a rational threshold p/q into distinct unit fractions
            (RMP 2/n table) so it's inspectable by a human auditor.
          </div>
          <div className="mt-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-xs text-zinc-400">
                p (numerator)
                <input
                  type="number"
                  value={p}
                  onChange={(e) => setP(e.target.value)}
                  className="mt-1 w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-sm text-white font-mono"
                />
              </label>
              <label className="block text-xs text-zinc-400">
                q (denominator)
                <input
                  type="number"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  className="mt-1 w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-sm text-white font-mono"
                />
              </label>
            </div>
            <button
              onClick={inspect}
              disabled={auditLoading}
              className="w-full rounded-md bg-amber-500 px-3 py-2 text-sm font-medium text-zinc-950 hover:bg-amber-400 disabled:opacity-50"
            >
              {auditLoading ? 'Decomposing…' : 'Decompose threshold'}
            </button>
            {auditError && (
              <div className="rounded-md border border-rose-500/40 bg-rose-500/10 p-2 text-xs text-rose-300">
                {auditError}
              </div>
            )}
          </div>
          {audit && (
            <div className="mt-5 space-y-3">
              <div className="rounded-md bg-zinc-950 p-3">
                <div className="font-mono text-amber-300 text-sm">{audit.explanation}</div>
              </div>
              <dl className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div>
                  <dt className="text-zinc-500">terms</dt>
                  <dd className="text-white">{audit.decomposition.terms.length}</dd>
                </div>
                <div>
                  <dt className="text-zinc-500">exact</dt>
                  <dd className={audit.decomposition.exact ? 'text-emerald-300' : 'text-rose-300'}>
                    {String(audit.decomposition.exact)}
                  </dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-zinc-500">decomposition</dt>
                  <dd className="text-white">
                    {audit.decomposition.terms.map((t) => `1/${t}`).join(' + ') || '∅'}
                  </dd>
                </div>
              </dl>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-5">
        <div className="text-sm font-semibold text-white">Why this matters for Amaru</div>
        <p className="mt-2 text-sm text-zinc-400">
          Amaru coordinates fleets of heterogeneous syncs across cost,
          throughput, and error-rate dimensions. The seked auditor refuses
          to blow up at vertical asymptotes — it returns HALT instead of
          NaN — and the unit-fraction decomposition lets every fleet-wide
          alert and kill-switch threshold be reproduced byte-for-byte
          across runtimes that disagree on floating-point. Both primitives
          are governed by A11oy approval tiers.
        </p>
        <div className="mt-3 text-xs font-mono text-amber-400/80">
          POST /api/ouroboros/amaru/observe-metric · POST /api/ouroboros/amaru/audit-threshold
        </div>
      </div>
    </div>
  );
}
