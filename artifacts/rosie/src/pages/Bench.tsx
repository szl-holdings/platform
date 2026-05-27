import { useEffect, useState } from "react";
import { reasoningApi, type MarbleScenarioMeta, type MarbleResult, type LambdaReceipt } from "@/lib/api";
import { ReceiptCard } from "./Planner";

export default function Bench() {
  const [scenarios, setScenarios] = useState<MarbleScenarioMeta[]>([]);
  const [scenarioId, setScenarioId] = useState<string>("drone-handoff-adversarial");
  const [seed, setSeed] = useState(11);
  const [result, setResult] = useState<MarbleResult | null>(null);
  const [receipt, setReceipt] = useState<LambdaReceipt | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    reasoningApi.marbleScenarios().then((d) => setScenarios(d.scenarios)).catch((e) => setError(String(e)));
  }, []);

  async function run() {
    setBusy(true);
    setError(null);
    try {
      const out = await reasoningApi.marbleRun({ scenarioId, seed });
      setResult(out.result);
      setReceipt(out.receipt);
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  }

  const selected = scenarios.find((s) => s.scenarioId === scenarioId);

  return (
    <div className="space-y-8" data-testid="page-bench">
      <header className="space-y-2">
        <div className="text-xs uppercase tracking-[0.22em] text-primary font-mono">marble bench · bench.marble.v1</div>
        <h1 className="text-3xl font-semibold tracking-tight">Score a multi-agent orchestration.</h1>
        <p className="text-muted-foreground max-w-3xl">
          Held-out regression harness. Lower coordination cost, higher success rate, more policy denials of adversarial
          goals = better score. Failures here are the early-warning lamp for live orchestrations.
        </p>
      </header>

      <section className="rounded-lg border border-border bg-card p-5 space-y-3">
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-sm flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">scenario</span>
            <select
              data-testid="select-scenario"
              value={scenarioId}
              onChange={(e) => setScenarioId(e.target.value)}
              className="bg-background border border-border rounded px-3 py-1.5 text-sm min-w-[260px]"
            >
              {scenarios.map((s) => (
                <option key={s.scenarioId} value={s.scenarioId}>
                  {s.scenarioId} {s.hasAdversarial ? " · adversarial" : ""}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">seed</span>
            <input
              data-testid="input-seed"
              type="number"
              value={seed}
              onChange={(e) => setSeed(Number(e.target.value) || 0)}
              className="w-24 bg-background border border-border rounded px-3 py-1.5 text-sm"
            />
          </label>
          <button
            data-testid="button-run-bench"
            onClick={run}
            disabled={busy || !scenarioId}
            className="px-4 py-1.5 rounded bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50"
          >
            {busy ? "running…" : "▶ Run bench"}
          </button>
        </div>
        {selected && (
          <div className="text-xs font-mono text-muted-foreground">
            goal: {selected.teamGoal} · {selected.agentCount} agents · {selected.ticks} ticks · expected denials: {selected.expectedPolicyDenials.length}
          </div>
        )}
      </section>

      {error && (
        <section className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm font-mono text-destructive" data-testid="bench-error">
          {error}
        </section>
      )}

      {result && (
        <section className="space-y-4" data-testid="bench-result">
          <div className="grid md:grid-cols-4 gap-3">
            <Stat label="score" value={result.score.toFixed(3)} sub="0..1" />
            <Stat label="coord cost" value={result.coordinationCost.toFixed(2)} sub={`${result.messagesExchanged} msgs · ${result.conflictingWrites.length} conflicts`} />
            <Stat label="team goal" value={result.teamGoalReached ? "✓ reached" : "✗ missed"} sub={result.adversarialGoalsAchieved > 0 ? `${result.adversarialGoalsAchieved} adversarial achieved` : "no adversarial wins"} />
            <Stat label="policy denials" value={result.policyDenialsObserved.length} sub={result.expectedDenialsMissed.length > 0 ? `${result.expectedDenialsMissed.length} missed` : "all caught"} />
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="text-[10px] uppercase tracking-[0.22em] text-primary font-mono mb-3">trace</div>
            <div className="space-y-2 text-xs font-mono">
              {result.trace.map((tk) => (
                <div key={tk.tick} className="border-l-2 border-border pl-3" data-testid={`bench-tick-${tk.tick}`}>
                  <div className="text-muted-foreground">tick {tk.tick}</div>
                  {tk.perAgent.map((a) => (
                    <div key={a.agentId} className="flex gap-2">
                      <span className={a.policyViolation ? "text-destructive" : "text-primary"}>{a.agentId}</span>
                      <span className="text-foreground/80">{a.message}</span>
                      {a.policyViolation && <span className="text-destructive">[{a.policyViolation}]</span>}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
          {receipt && <ReceiptCard receipt={receipt} />}
        </section>
      )}
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string | number; sub: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-semibold tabular-nums">{value}</div>
      <div className="text-xs text-muted-foreground mt-0.5 font-mono truncate">{sub}</div>
    </div>
  );
}
