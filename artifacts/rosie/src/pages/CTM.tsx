import { useEffect, useRef, useState } from "react";
import { reasoningApi, type CtmResult, type CtmTick, type LambdaReceipt } from "@/lib/api";
import { ReceiptCard } from "./Planner";

type StreamState = {
  loopId: string | null;
  totalTicks: number;
  ticks: CtmTick[];
  finalSynthesis: string | null;
  totalSuppressed: number;
  done: boolean;
};

const EMPTY_STREAM: StreamState = {
  loopId: null,
  totalTicks: 0,
  ticks: [],
  finalSynthesis: null,
  totalSuppressed: 0,
  done: false,
};

export default function CTM() {
  const [input, setInput] = useState("drone trajectory drifting outside geofence — possible policy breach");
  const [ticks, setTicks] = useState(4);
  const [seed, setSeed] = useState(1);
  const [mode, setMode] = useState<"oneshot" | "stream">("stream");
  const [result, setResult] = useState<CtmResult | null>(null);
  const [stream, setStream] = useState<StreamState>(EMPTY_STREAM);
  const [receipt, setReceipt] = useState<LambdaReceipt | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => () => esRef.current?.close(), []);

  async function runOneShot() {
    setBusy(true);
    setError(null);
    setStream(EMPTY_STREAM);
    try {
      const out = await reasoningApi.ctm({ input, ticks, seed });
      setResult(out.result);
      setReceipt(out.receipt);
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  }

  function runStream() {
    esRef.current?.close();
    setBusy(true);
    setError(null);
    setResult(null);
    setReceipt(null);
    setStream({ ...EMPTY_STREAM });
    const qs = new URLSearchParams({ input, ticks: String(ticks), seed: String(seed) });
    // Absolute /api path — the vite dev proxy rewrites /api/* to the api-server,
    // and a leading slash prevents nested routes (e.g. /reasoning/ctm) from
    // resolving the EventSource URL against the current path segment.
    const es = new EventSource(`/api/rosie/ctm/stream?${qs.toString()}`);
    esRef.current = es;
    es.addEventListener("hello", (ev) => {
      const { loopId, totalTicks } = JSON.parse((ev as MessageEvent).data) as { loopId: string; totalTicks: number };
      setStream((s) => ({ ...s, loopId, totalTicks }));
    });
    es.addEventListener("tick", (ev) => {
      const tick = JSON.parse((ev as MessageEvent).data) as CtmTick;
      setStream((s) => ({ ...s, ticks: [...s.ticks, tick] }));
    });
    es.addEventListener("done", (ev) => {
      const { finalSynthesis, totalSuppressed } = JSON.parse((ev as MessageEvent).data) as { finalSynthesis: string; totalSuppressed: number };
      setStream((s) => ({ ...s, finalSynthesis, totalSuppressed, done: true }));
      es.close();
      esRef.current = null;
      setBusy(false);
    });
    es.addEventListener("error", () => {
      setError("stream disconnected");
      es.close();
      esRef.current = null;
      setBusy(false);
    });
  }

  function run() {
    if (mode === "stream") runStream();
    else runOneShot();
  }

  const streamTicks: CtmTick[] = mode === "stream" ? stream.ticks : (result?.ticks ?? []);
  const finalSynthesis = mode === "stream" ? stream.finalSynthesis : (result?.finalSynthesis ?? null);
  const totalSuppressed = mode === "stream" ? stream.totalSuppressed : (result?.totalSuppressed ?? 0);
  const loopId = mode === "stream" ? stream.loopId : (result?.loopId ?? null);
  const totalTicks = mode === "stream" ? stream.totalTicks : (result?.ticks.length ?? ticks);

  return (
    <div className="space-y-8" data-testid="page-ctm">
      <header className="space-y-2">
        <div className="text-xs uppercase tracking-[0.22em] text-primary font-mono">CTM-loop · consciousness.broadcast.v1</div>
        <h1 className="text-3xl font-semibold tracking-tight">Arbitrate a broadcast workspace.</h1>
        <p className="text-muted-foreground max-w-3xl">
          N specialist processors each emit one candidate per tick. The arbiter picks one winner; every loser is logged
          as a <em>suppressed alternative</em> so the audit trail is complete.
        </p>
      </header>

      <section className="rounded-lg border border-border bg-card p-5 space-y-3">
        <label className="block text-sm">
          <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">situation</span>
          <textarea
            data-testid="textarea-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={3}
            className="w-full mt-1 bg-background border border-border rounded px-3 py-2 text-sm font-mono"
          />
        </label>
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-sm flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">ticks</span>
            <input
              data-testid="input-ticks"
              type="number"
              min={1}
              max={12}
              value={ticks}
              onChange={(e) => setTicks(Math.max(1, Math.min(12, Number(e.target.value) || 1)))}
              className="w-24 bg-background border border-border rounded px-3 py-1.5 text-sm"
            />
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
          <label className="text-sm flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">mode</span>
            <select
              data-testid="select-ctm-mode"
              value={mode}
              onChange={(e) => setMode(e.target.value as "oneshot" | "stream")}
              className="bg-background border border-border rounded px-3 py-1.5 text-sm"
            >
              <option value="stream">stream — SSE tick-by-tick</option>
              <option value="oneshot">one-shot — POST + final</option>
            </select>
          </label>
          <button
            data-testid="button-run-ctm"
            onClick={run}
            disabled={busy || !input.trim()}
            className="px-4 py-1.5 rounded bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50"
          >
            {busy ? "broadcasting…" : mode === "stream" ? "▶ Stream CTM Loop" : "▶ Run CTM Loop"}
          </button>
        </div>
      </section>

      {error && (
        <section className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm font-mono text-destructive" data-testid="ctm-error">
          {error}
        </section>
      )}

      {(streamTicks.length > 0 || finalSynthesis) && (
        <section className="space-y-4" data-testid="ctm-result">
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center justify-between">
              <div className="text-[10px] uppercase tracking-[0.22em] text-primary font-mono">
                {finalSynthesis ? "final synthesis" : `streaming · tick ${streamTicks.length}/${totalTicks}`}
              </div>
              {mode === "stream" && !finalSynthesis && busy && (
                <span className="text-[10px] font-mono text-primary animate-pulse">● live</span>
              )}
            </div>
            <div className="text-sm mt-1.5">{finalSynthesis ?? "(waiting for arbiter…)"}</div>
            <div className="text-xs font-mono text-muted-foreground mt-2">
              {loopId ? `loop ${loopId.slice(0, 16)} · ` : ""}{streamTicks.length} ticks · {totalSuppressed} suppressed
            </div>
          </div>
          <div className="space-y-3">
            {streamTicks.map((t) => (
              <div key={t.tick} className="rounded-lg border border-border bg-card p-4" data-testid={`tick-${t.tick}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-[10px] uppercase tracking-[0.22em] text-primary font-mono">tick {t.tick}</div>
                  <div className="text-[10px] font-mono text-muted-foreground">{t.arbitrationRationale}</div>
                </div>
                <div className="text-sm pb-2 border-b border-border">
                  <span className="text-primary font-mono text-xs">▶ {t.winner.processorId}</span>{" "}
                  <span className="text-foreground/90">{t.winner.content}</span>
                </div>
                <ul className="mt-2 space-y-1 text-xs font-mono text-muted-foreground">
                  {t.suppressed.map((s) => (
                    <li key={s.processorId}>
                      <span className="opacity-60">·</span> {s.processorId} (salience={s.salience.toFixed(2)}) {s.content}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          {receipt && <ReceiptCard receipt={receipt} />}
        </section>
      )}
    </div>
  );
}
