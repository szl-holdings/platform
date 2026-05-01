/**
 * Sentra Ouroboros — HSM-anchored Doubling accumulator.
 *
 * Demonstrates Egyptian doubling multiplication (RMP method, c. 1650 BCE)
 * applied to Sentra's HSM-resident governance accumulator. The HSM only
 * exposes shift-and-add primitives; the doubling method proves that any
 * 256-bit accumulator can be expressed using only shift+add — no native
 * multiply needed.
 *
 * Every governance event is folded into the accumulator and produces a
 * doubling trace as the audit artifact. External auditors re-derive the
 * accumulator without trusting the HSM.
 *
 * Wires to /api/ouroboros/sentra/anchor-event, /verify-trace, /anchor-state.
 */
import { useEffect, useState } from 'react';

interface DoublingStep {
  index: number;
  multiplier: string;
  doubled: string;
  selected: boolean;
}

interface DoublingTrace {
  product: string;
  steps: DoublingStep[];
}

interface SentraState {
  accumulator: string;
  eventCount: number;
  lastUpdate: number;
  prime: string;
}

export default function SentraOuroborosPage() {
  const [eventId, setEventId] = useState('gov-evt-1');
  const [leafHash, setLeafHash] = useState('17');
  const [state, setState] = useState<SentraState | null>(null);
  const [trace, setTrace] = useState<DoublingTrace | null>(null);
  const [verifyResult, setVerifyResult] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refreshState() {
    try {
      const res = await fetch('/api/ouroboros/sentra/anchor-state');
      if (res.ok) setState(await res.json());
    } catch {
      /* ignore */
    }
  }

  useEffect(() => {
    refreshState();
  }, []);

  async function anchor() {
    setLoading(true);
    setError(null);
    setVerifyResult(null);
    try {
      const res = await fetch('/api/ouroboros/sentra/anchor-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId, leafHash }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as { state: SentraState; trace: DoublingTrace };
      setState(json.state);
      setTrace(json.trace);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function verify() {
    if (!trace) return;
    setVerifying(true);
    try {
      const res = await fetch('/api/ouroboros/sentra/verify-trace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(trace),
      });
      const json = await res.json();
      setVerifyResult(Boolean(json.valid));
    } catch (e) {
      setError((e as Error).message);
      setVerifyResult(false);
    } finally {
      setVerifying(false);
    }
  }

  return (
    <div className="px-6 py-8 max-w-6xl mx-auto space-y-6">
      <div>
        <div className="text-xs font-mono uppercase tracking-wider text-cyan-400/80">
          OUROBOROS · DOUBLING ANCHOR (RMP)
        </div>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          HSM Governance Accumulator
        </h1>
        <p className="mt-1 text-sm text-muted-foreground max-w-2xl">
          Every governance event is folded into a shift-and-add
          accumulator using only Egyptian doubling multiplication. Each
          step is recoverable by an external auditor who never trusted the
          HSM.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-lg border border-border bg-card p-5">
          <div className="text-sm font-semibold">Append governance event</div>
          <div className="mt-1 text-xs text-muted-foreground">
            Submit an event ID + leaf hash. The HSM performs only doublings
            and additions; the trace is returned for offline verification.
          </div>
          <div className="mt-4 space-y-3">
            <label className="block text-xs">
              Event ID
              <input
                value={eventId}
                onChange={(e) => setEventId(e.target.value)}
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm"
              />
            </label>
            <label className="block text-xs">
              Leaf hash (decimal or 0x… hex)
              <input
                value={leafHash}
                onChange={(e) => setLeafHash(e.target.value)}
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm font-mono"
              />
            </label>
            <button
              onClick={anchor}
              disabled={loading}
              className="w-full rounded-md bg-cyan-600 px-3 py-2 text-sm font-medium text-white hover:bg-cyan-500 disabled:opacity-50"
            >
              {loading ? 'Anchoring…' : 'Anchor event'}
            </button>
            {error && (
              <div className="rounded-md border border-rose-500/40 bg-rose-500/10 p-2 text-xs text-rose-300">
                {error}
              </div>
            )}
          </div>

          {state && (
            <dl className="mt-5 grid grid-cols-2 gap-3 text-xs font-mono">
              <div>
                <dt className="text-muted-foreground">events anchored</dt>
                <dd className="text-foreground">{state.eventCount}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">last update</dt>
                <dd className="text-foreground">
                  {state.lastUpdate ? new Date(state.lastUpdate).toLocaleTimeString() : '—'}
                </dd>
              </div>
              <div className="col-span-2">
                <dt className="text-muted-foreground">accumulator</dt>
                <dd className="text-cyan-400 break-all">{state.accumulator}</dd>
              </div>
              <div className="col-span-2">
                <dt className="text-muted-foreground">prime modulus (secp256k1)</dt>
                <dd className="text-foreground/70 text-[10px] break-all">{state.prime}</dd>
              </div>
            </dl>
          )}
        </div>

        <div className="rounded-lg border border-border bg-card p-5">
          <div className="text-sm font-semibold">Doubling trace</div>
          <div className="mt-1 text-xs text-muted-foreground">
            Each row is a single shift-and-add step. Selected steps were
            added to the running product. An external verifier recomputes
            the product from the steps without trusting the HSM.
          </div>
          {trace ? (
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <div>
                  <span className="text-muted-foreground">product = </span>
                  <span className="font-mono text-cyan-400">{trace.product}</span>
                </div>
                <button
                  onClick={verify}
                  disabled={verifying}
                  className="rounded-md border border-cyan-500/40 bg-cyan-500/10 px-3 py-1 text-cyan-200 hover:bg-cyan-500/20 disabled:opacity-50"
                >
                  {verifying ? 'Verifying…' : 'Verify trace'}
                </button>
              </div>
              {verifyResult !== null && (
                <div
                  className={`rounded-md border p-2 text-xs font-mono ${
                    verifyResult
                      ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                      : 'border-rose-500/40 bg-rose-500/10 text-rose-300'
                  }`}
                >
                  {verifyResult ? 'TRACE VALID — accumulator was not silently mutated.' : 'TRACE INVALID — auditor disagrees with the HSM.'}
                </div>
              )}
              <div className="rounded-md border border-border max-h-72 overflow-y-auto">
                <table className="w-full text-xs font-mono">
                  <thead className="text-muted-foreground border-b border-border bg-background/40">
                    <tr>
                      <th className="px-2 py-1 text-left">i</th>
                      <th className="px-2 py-1 text-left">multiplier</th>
                      <th className="px-2 py-1 text-left">doubled</th>
                      <th className="px-2 py-1 text-left">add?</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trace.steps.map((s) => (
                      <tr key={s.index} className="border-b border-border/40">
                        <td className="px-2 py-1 text-muted-foreground">{s.index}</td>
                        <td className="px-2 py-1">{s.multiplier}</td>
                        <td className="px-2 py-1">{s.doubled}</td>
                        <td
                          className={`px-2 py-1 ${
                            s.selected ? 'text-cyan-300' : 'text-muted-foreground'
                          }`}
                        >
                          {s.selected ? '+' : '·'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="mt-4 text-sm text-muted-foreground">
              Anchor an event to see the doubling trace.
            </div>
          )}
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-5">
        <div className="text-sm font-semibold">Why this matters for Sentra</div>
        <p className="mt-2 text-sm text-muted-foreground">
          A modern HSM that exposes only shift+add primitives is the only
          surface a regulator can audit line-by-line. Egyptian doubling
          multiplication is the proof that this surface is enough — every
          governance event commitment can be re-derived externally without
          trusting the HSM. Combined with A11oy approval gates, this
          gives Sentra a tamper-evident governance ledger that no operator
          can silently rewrite.
        </p>
        <div className="mt-3 text-xs font-mono text-cyan-400/80">
          POST /api/ouroboros/sentra/anchor-event · POST /api/ouroboros/sentra/verify-trace
        </div>
      </div>
    </div>
  );
}
