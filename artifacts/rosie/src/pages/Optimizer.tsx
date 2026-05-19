import { useEffect, useMemo, useState } from "react";
import { rosieApi, type NarrationReceipt, type SolveResponse, type Template, type CustomSolveBody } from "@/lib/api";
import { solveOnWebGPU, tryAcquireWebGPU } from "@/workers/webgpu-solver";

interface WorkerStatus {
  running: boolean;
  sweep: number;
  sweeps: number;
  energy: number;
  bestEnergy: number;
  temperature: number;
  backend: "cpu-worker" | "webgpu";
  adapter?: string;
}

type Mode = "template" | "custom";

export default function Optimizer() {
  const [mode, setMode] = useState<Mode>("template");
  const [templates, setTemplates] = useState<Template[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [seed, setSeed] = useState<number>(42);
  const [sweeps, setSweeps] = useState<number>(600);
  const [solving, setSolving] = useState(false);
  const [result, setResult] = useState<SolveResponse | null>(null);
  const [workerStatus, setWorkerStatus] = useState<WorkerStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [gpuAvailable, setGpuAvailable] = useState<{ ok: boolean; adapter: string | null }>({ ok: false, adapter: null });
  const [preferGPU, setPreferGPU] = useState<boolean>(true);
  // Custom-problem form state — pasted JSON arrays. Kept as strings until
  // submit so operators can iterate on the matrix freely without each
  // keystroke triggering JSON.parse failures.
  const [customName, setCustomName] = useState<string>("Operator custom problem");
  const [customH, setCustomH] = useState<string>("[-0.4, 0.1, 0.3, -0.2]");
  const [customJ, setCustomJ] = useState<string>(
    "[[0,0.5,-0.2,0.1],[0,0,0.3,-0.4],[0,0,0,0.6],[0,0,0,0]]",
  );
  const [customLabels, setCustomLabels] = useState<string>("a,b,c,d");

  useEffect(() => {
    rosieApi
      .templates()
      .then((t) => {
        setTemplates(t);
        setActive((prev) => prev ?? t[0]?.id ?? null);
      })
      .catch((e) => setError(String(e)));
    // Probe WebGPU once at mount so the UI can label the descent backend.
    tryAcquireWebGPU().then((d) => {
      if (d) setGpuAvailable({ ok: true, adapter: d.adapter });
    });
  }, []);

  function parseCustomProblem(): CustomSolveBody | null {
    try {
      const h = JSON.parse(customH);
      const J = JSON.parse(customJ);
      if (!Array.isArray(h) || !Array.isArray(J)) throw new Error("h and J must be arrays");
      const n = h.length;
      if (n < 2 || n > 64) throw new Error("h length must be 2..64");
      if (J.length !== n) throw new Error("J must be n×n");
      for (const row of J) {
        if (!Array.isArray(row) || row.length !== n) throw new Error("J rows must all be length n");
      }
      const labels = customLabels
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      return {
        name: customName.trim() || undefined,
        J: J as number[][],
        h: h as number[],
        labels: labels.length === n ? labels : undefined,
        seed,
        sweeps,
      };
    } catch (err) {
      setError(`Custom problem parse failed: ${String(err)}`);
      return null;
    }
  }

  async function runSolve() {
    setError(null);
    setSolving(true);
    setResult(null);

    if (mode === "custom") {
      const body = parseCustomProblem();
      if (!body) { setSolving(false); return; }
      setWorkerStatus({
        running: true, sweep: 0, sweeps, energy: 0, bestEnergy: 0, temperature: 0,
        backend: preferGPU && gpuAvailable.ok ? "webgpu" : "cpu-worker",
        adapter: gpuAvailable.adapter ?? undefined,
      });
      runCpuDescent(body.J, body.h);
      try {
        const res = await rosieApi.solveCustom(body);
        setResult(res);
      } catch (e) {
        setError(String(e));
      } finally {
        setSolving(false);
      }
      return;
    }

    if (!active) { setSolving(false); return; }
    const tpl = templates.find((t) => t.id === active);
    const { J, h } = buildTemplate(active, tpl?.variables ?? 16);
    const useGPU = preferGPU && gpuAvailable.ok;

    setWorkerStatus({
      running: true,
      sweep: 0,
      sweeps,
      energy: 0,
      bestEnergy: 0,
      temperature: 0,
      backend: useGPU ? "webgpu" : "cpu-worker",
      adapter: gpuAvailable.adapter ?? undefined,
    });

    // GPU path — single compute dispatch, then map results back. No streaming
    // progress (the descent completes in <50ms for n ≤ 64), so we render a
    // synthetic step animation off the returned trace.
    if (useGPU) {
      try {
        const gpu = await solveOnWebGPU({ J, h, seed, sweeps });
        if (gpu) {
          setWorkerStatus({
            running: false,
            sweep: sweeps,
            sweeps,
            energy: gpu.energy,
            bestEnergy: gpu.energy,
            temperature: 0,
            backend: "webgpu",
            adapter: gpu.adapter,
          });
        } else {
          // device acquisition failed mid-run; fall through to CPU
          runCpuDescent(J, h);
        }
      } catch (err) {
        // Surface WebGPU errors but keep going via CPU so the authoritative
        // server receipt still ships.
        setError(`WebGPU descent failed (${String(err)}) — falling back to CPU worker`);
        runCpuDescent(J, h);
      }
    } else {
      runCpuDescent(J, h);
    }

    try {
      const res = await rosieApi.solve({ templateId: active, seed, sweeps, narrate: true });
      setResult(res);
      // Narration is sealed asynchronously by the server (separate hash-chain
      // entry). Poll the linked narration receipt for up to ~5s so the panel
      // refreshes with real text instead of leaving "(narrator unavailable)".
      void pollForNarration(res);
    } catch (e) {
      setError(String(e));
    } finally {
      setSolving(false);
    }
  }

  async function pollForNarration(initial: SolveResponse) {
    if (initial.receipt?.narrative) return;
    const targetId = initial.receipt?.receiptId;
    if (!targetId) return;
    const deadline = Date.now() + 6000;
    while (Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, 600));
      try {
        const list = await rosieApi.receipts("narration");
        const match = list.find((r) => {
          if (r.kind !== "narration") return false;
          const n = r as NarrationReceipt;
          return n.targetReceiptId === targetId;
        }) as NarrationReceipt | undefined;
        if (match?.narrative) {
          setResult((prev) =>
            prev
              ? { ...prev, receipt: { ...prev.receipt, narrative: match.narrative } }
              : prev,
          );
          return;
        }
      } catch { /* keep polling */ }
    }
  }

  function runCpuDescent(J: number[][], h: number[]) {
    const worker = new Worker(new URL("../workers/ising-solver.worker.ts", import.meta.url), {
      type: "module",
    });
    worker.postMessage({ J, h, seed, sweeps });
    worker.onmessage = (ev) => {
      const m = ev.data;
      if (m.kind === "progress") {
        setWorkerStatus({
          running: true,
          sweep: m.sweep,
          sweeps: m.sweeps,
          energy: m.energy,
          bestEnergy: m.bestEnergy,
          temperature: m.temperature,
          backend: "cpu-worker",
        });
      } else if (m.kind === "done") {
        setWorkerStatus({
          running: false,
          sweep: sweeps,
          sweeps,
          energy: m.energy,
          bestEnergy: m.energy,
          temperature: 0,
          backend: "cpu-worker",
        });
        worker.terminate();
      } else if (m.kind === "error") {
        setError(m.message);
        worker.terminate();
      }
    };
  }

  return (
    <div className="grid md:grid-cols-[320px_1fr] gap-6">
      <aside className="space-y-4">
        <div className="rounded-lg border border-border bg-card p-1 flex gap-1">
          <ModeBtn current={mode} value="template" onClick={setMode} label="Templates" />
          <ModeBtn current={mode} value="custom" onClick={setMode} label="Custom problem" />
        </div>

        {mode === "custom" && (
          <div className="rounded-lg border border-border bg-card p-4 space-y-3">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Custom Ising problem
            </div>
            <label className="block text-xs">
              <span className="text-muted-foreground">Name</span>
              <input
                type="text"
                data-testid="input-custom-name"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="mt-1 w-full bg-input/30 border border-border rounded px-2 py-1.5 text-sm"
              />
            </label>
            <label className="block text-xs">
              <span className="text-muted-foreground">h (field) — JSON array</span>
              <textarea
                data-testid="input-custom-h"
                value={customH}
                onChange={(e) => setCustomH(e.target.value)}
                rows={2}
                className="mt-1 w-full bg-input/30 border border-border rounded px-2 py-1.5 font-mono text-[11px]"
              />
            </label>
            <label className="block text-xs">
              <span className="text-muted-foreground">J (coupling) — JSON n×n</span>
              <textarea
                data-testid="input-custom-j"
                value={customJ}
                onChange={(e) => setCustomJ(e.target.value)}
                rows={4}
                className="mt-1 w-full bg-input/30 border border-border rounded px-2 py-1.5 font-mono text-[11px]"
              />
            </label>
            <label className="block text-xs">
              <span className="text-muted-foreground">Labels (comma-separated, optional)</span>
              <input
                type="text"
                data-testid="input-custom-labels"
                value={customLabels}
                onChange={(e) => setCustomLabels(e.target.value)}
                className="mt-1 w-full bg-input/30 border border-border rounded px-2 py-1.5 font-mono text-xs"
              />
            </label>
          </div>
        )}

        {mode === "template" && (
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-3">
            Problem templates
          </div>
          <div className="space-y-1.5">
            {templates.map((t) => (
              <button
                key={t.id}
                data-testid={`button-template-${t.id}`}
                onClick={() => setActive(t.id)}
                className={
                  "w-full text-left px-3 py-2.5 rounded-md text-sm transition-colors " +
                  (active === t.id
                    ? "bg-primary/15 border border-primary/40 text-foreground"
                    : "border border-transparent hover:bg-secondary text-muted-foreground hover:text-foreground")
                }
              >
                <div className="font-medium text-foreground">{t.name}</div>
                <div className="text-[11px] mt-0.5 opacity-80 uppercase tracking-wider">
                  {t.domain} · {t.variables} vars
                </div>
              </button>
            ))}
            {templates.length === 0 && (
              <div className="text-xs text-muted-foreground">loading templates…</div>
            )}
          </div>
        </div>
        )}

        <div className="rounded-lg border border-border bg-card p-4 space-y-3">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
            Solver parameters
          </div>
          <label className="block text-xs">
            <span className="text-muted-foreground">Seed</span>
            <input
              type="number"
              value={seed}
              data-testid="input-seed"
              onChange={(e) => setSeed(Number(e.target.value) || 0)}
              className="mt-1 w-full bg-input/30 border border-border rounded px-2 py-1.5 font-mono text-sm"
            />
          </label>
          <label className="block text-xs">
            <span className="text-muted-foreground">Sweeps ({sweeps})</span>
            <input
              type="range"
              min={100}
              max={2000}
              step={50}
              value={sweeps}
              data-testid="input-sweeps"
              onChange={(e) => setSweeps(Number(e.target.value))}
              className="mt-1 w-full accent-primary"
            />
          </label>
          <label className="flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              data-testid="toggle-webgpu"
              checked={preferGPU}
              disabled={!gpuAvailable.ok}
              onChange={(e) => setPreferGPU(e.target.checked)}
              className="accent-primary"
            />
            <span className="text-muted-foreground">
              prefer WebGPU descent
              <span className="ml-1 font-mono text-[10px] uppercase">
                {gpuAvailable.ok ? `· ${(gpuAvailable.adapter ?? "available").slice(0, 18)}` : "· unavailable (CPU)"}
              </span>
            </span>
          </label>
          <button
            disabled={solving || (mode === "template" && !active)}
            onClick={runSolve}
            data-testid="button-solve"
            className="w-full mt-2 px-4 py-2.5 rounded-md bg-primary text-primary-foreground font-medium text-sm disabled:opacity-50 hover:bg-primary/90 transition"
          >
            {solving ? "Annealing…" : "▲ Solve & seal receipt"}
          </button>
          {error && (
            <div className="text-xs text-destructive font-mono break-words" data-testid="text-error">
              {error}
            </div>
          )}
        </div>
      </aside>

      <section className="space-y-4">
        <DescentCard status={workerStatus} />
        <ResultCard result={result} />
        <BreakdownCard result={result} />
        <AlternativesCard result={result} />
        <ReasoningTraceCard result={result} />
      </section>
    </div>
  );
}

function ModeBtn({
  current, value, onClick, label,
}: { current: Mode; value: Mode; onClick: (m: Mode) => void; label: string }) {
  const active = current === value;
  return (
    <button
      onClick={() => onClick(value)}
      data-testid={`button-mode-${value}`}
      className={
        "flex-1 text-xs uppercase tracking-widest px-3 py-2 rounded-md transition-colors " +
        (active
          ? "bg-primary/15 text-foreground border border-primary/40"
          : "text-muted-foreground hover:text-foreground")
      }
    >
      {label}
    </button>
  );
}

function BreakdownCard({ result }: { result: SolveResponse | null }) {
  if (!result?.breakdown) return null;
  const b = result.breakdown;
  return (
    <div className="rounded-lg border border-border bg-card p-5" data-testid="card-breakdown">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-3">
        Objective breakdown · why this energy
      </div>
      <div className="grid grid-cols-3 gap-4 text-sm">
        <Metric label="Field Σh·s" value={b.field.toFixed(4)} />
        <Metric label="Coupling Σ J·s·s" value={b.coupling.toFixed(4)} />
        <Metric label="Total" value={b.total.toFixed(4)} />
      </div>
    </div>
  );
}

function AlternativesCard({ result }: { result: SolveResponse | null }) {
  if (!result?.alternatives?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-card p-5" data-testid="card-alternatives">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-3">
        Top-{result.alternatives.length} alternatives · nearby seeds (preview)
      </div>
      <div className="space-y-2">
        {result.alternatives.map((alt, i) => (
          <div
            key={alt.seed}
            data-testid={`row-alternative-${i}`}
            className="flex items-center justify-between gap-3 px-3 py-2 rounded border border-border/60 bg-background/40 text-xs font-mono"
          >
            <span className="text-muted-foreground">seed {alt.seed}</span>
            <span>E = {alt.energy.toFixed(4)}</span>
            <span className={alt.delta < 0 ? "text-primary" : "text-muted-foreground"}>
              ΔE = {alt.delta >= 0 ? "+" : ""}{alt.delta.toFixed(4)}
            </span>
            <span className="text-muted-foreground">{alt.spinDiff} spin diff</span>
            <span className="text-foreground">{alt.selected.length} selected</span>
          </div>
        ))}
      </div>
      <div className="text-[10px] text-muted-foreground mt-3">
        Preview only — the receipt above is the sole sealed authority.
      </div>
    </div>
  );
}

function ReasoningTraceCard({ result }: { result: SolveResponse | null }) {
  if (!result?.reasoningTrace?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-card p-5" data-testid="card-reasoning-trace">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-3">
        Reasoning trace · deterministic pipeline
      </div>
      <ol className="space-y-1.5 text-xs font-mono">
        {result.reasoningTrace.map((s, i) => (
          <li key={i} data-testid={`row-trace-${i}`} className="flex gap-3">
            <span className="text-primary shrink-0 w-32">{s.step}</span>
            <span className="text-muted-foreground break-all">{s.detail}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function DescentCard({ status }: { status: WorkerStatus | null }) {
  const pct = status ? Math.min(100, (status.sweep / Math.max(1, status.sweeps)) * 100) : 0;
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
            Live descent ({status?.backend === "webgpu" ? `WebGPU · ${(status.adapter ?? "device").slice(0, 22)}` : "CPU web worker"})
          </div>
          <div className="font-medium mt-0.5">
            {status?.running ? "Annealing…" : status ? "Worker complete" : "Idle"}
          </div>
        </div>
        <div className="text-xs font-mono text-muted-foreground">
          T = {status ? status.temperature.toFixed(3) : "—"}
        </div>
      </div>
      <div className="h-2 rounded-full bg-secondary overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-primary to-accent transition-[width] duration-100"
          style={{ width: `${pct}%` }}
          data-testid="bar-progress"
        />
      </div>
      <div className="grid grid-cols-3 gap-4 mt-4 text-sm">
        <Metric label="Sweep" value={status ? `${status.sweep} / ${status.sweeps}` : "—"} />
        <Metric label="Current E" value={status ? status.energy.toFixed(4) : "—"} />
        <Metric label="Best E" value={status ? status.bestEnergy.toFixed(4) : "—"} />
      </div>
    </div>
  );
}

function ResultCard({ result }: { result: SolveResponse | null }) {
  const points = useMemo(() => {
    if (!result) return "";
    const tr = result.trace;
    const n = tr.length;
    const min = Math.min(...tr);
    const max = Math.max(...tr);
    const span = max - min || 1;
    return tr
      .map((v, i) => {
        const x = (i / Math.max(1, n - 1)) * 600;
        const y = 140 - ((v - min) / span) * 130 - 5;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");
  }, [result]);

  if (!result) {
    return (
      <div className="rounded-lg border border-border border-dashed bg-card/40 p-10 text-center text-sm text-muted-foreground">
        Run the solver to produce an authoritative receipt.
      </div>
    );
  }
  const r = result.receipt;
  return (
    <div className="rounded-lg border border-border bg-card p-5 space-y-5" data-testid="result-card">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-primary font-mono">
            authoritative receipt
          </div>
          <div className="font-semibold mt-0.5">{r.templateName}</div>
          <div className="text-xs text-muted-foreground font-mono mt-1" data-testid="text-receipt-id">
            {r.receiptId}
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Energy</div>
          <div className="text-2xl font-semibold tabular-nums" data-testid="text-energy">
            {r.energy.toFixed(4)}
          </div>
          <div className="text-[11px] text-muted-foreground font-mono">
            {r.iterations.toLocaleString()} flips · {result.elapsedMs}ms
          </div>
        </div>
      </div>

      <svg viewBox="0 0 600 140" className="w-full h-32 rounded bg-background border border-border">
        <polyline
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth="1.5"
          points={points}
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      <div>
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
          Selected (+1) variables · {r.selected.length} of {r.spins.length}
        </div>
        <div className="flex flex-wrap gap-1.5" data-testid="list-selected">
          {r.selected.map((s) => (
            <span
              key={s}
              className="text-[11px] px-2 py-0.5 rounded bg-primary/15 text-primary border border-primary/30 font-mono"
            >
              {s}
            </span>
          ))}
          {r.selected.length === 0 && (
            <span className="text-xs text-muted-foreground">(empty selection)</span>
          )}
        </div>
      </div>

      <div className="rounded border border-border bg-background/60 p-4">
        <div className="text-[10px] uppercase tracking-widest text-accent mb-2 font-mono">
          ◆ narrator (claude · narrator-only)
        </div>
        <p className="text-sm leading-relaxed" data-testid="text-narrative">
          {r.narrative ?? "(narrator unavailable)"}
        </p>
      </div>

      <details className="text-xs">
        <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
          ▸ Proof envelope
        </summary>
        <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 font-mono">
          <HashRow label="prevHash" value={r.prevHash} />
          <HashRow label="receiptHash" value={r.receiptHash} />
          <HashRow label="inputHash" value={r.inputHash} />
          <HashRow label="outputHash" value={r.outputHash} />
        </div>
      </details>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="font-mono mt-0.5 tabular-nums">{value}</div>
    </div>
  );
}

function HashRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="overflow-hidden">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="text-[11px] truncate" title={value}>
        {value}
      </div>
    </div>
  );
}

// Mirror of the server-side template builders so the local worker descent
// matches the authoritative solver's Hamiltonian visually. Kept side-by-side
// deliberately — if these drift, the demo is harmless (server is authority).
function buildTemplate(id: string, n: number): { J: number[][]; h: number[] } {
  const J = Array.from({ length: n }, () => new Array<number>(n).fill(0));
  const h = new Array<number>(n).fill(0);
  if (id === "vessel-berth") {
    for (let i = 0; i < n; i++) {
      h[i] = Math.sin(i * 1.7) * 0.4;
      for (let j = i + 1; j < n; j++) {
        J[i][j] = Math.cos((i + 1) * (j + 1) * 0.31) * 0.6;
      }
    }
  } else if (id === "legal-staffing") {
    for (let i = 0; i < n; i++) {
      h[i] = Math.cos(i * 0.91) * 0.3 - 0.1;
      for (let j = i + 1; j < n; j++) J[i][j] = Math.sin((i + 3) * (j + 5) * 0.17) * 0.5;
    }
  } else {
    for (let i = 0; i < n; i++) {
      h[i] = -0.25 + Math.sin(i * 0.5) * 0.2;
      for (let j = i + 1; j < n; j++) {
        const d = j - i;
        J[i][j] = d <= 2 ? 0.7 / d : Math.cos(i * j * 0.07) * 0.15;
      }
    }
  }
  return { J, h };
}
