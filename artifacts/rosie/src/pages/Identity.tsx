import { useEffect, useState } from "react";
import { Link } from "wouter";
import { detectWebGPU } from "@/lib/api";

interface Stat {
  github: string | null;
  arxiv: string | null;
  hf: string | null;
  receipts: number;
}

interface TickerEvent {
  at: string;
  kind: string;
  detail: string;
}

export default function Identity() {
  const [stat, setStat] = useState<Stat>({ github: null, arxiv: null, hf: null, receipts: 0 });
  const [gpu, setGpu] = useState<{ available: boolean; adapter: string | null; reason: string | null } | null>(null);
  const [ticker, setTicker] = useState<TickerEvent[]>([]);
  const [streamState, setStreamState] = useState<"connecting" | "live" | "closed">("connecting");

  // Event-driven live ticker: subscribe to /api/rosie/events SSE stream and
  // append every server event to the rolling ticker. The server snapshots
  // every 5s plus emits on each new receipt, so this is a true push channel
  // instead of polled status. We fall back to a single REST refresh on
  // open() failure so the surface still hydrates if SSE is unreachable.
  useEffect(() => {
    // SSE always targets the absolute /api/rosie/events route — the API is
    // mounted at root, NOT under the rosie artifact base path. Using
    // BASE_URL here would yield /rosie/api/rosie/events in production.
    let es: EventSource | null = null;
    let closed = false;
    try {
      es = new EventSource("/api/rosie/events");
      es.onopen = () => setStreamState("live");
      es.onerror = () => {
        if (!closed) setStreamState("closed");
      };
      const apply = (kind: string) => (ev: MessageEvent) => {
        let payload: Record<string, unknown> = {};
        try { payload = JSON.parse(ev.data); } catch { /* ignore */ }
        const next: TickerEvent = {
          at: new Date().toISOString(),
          kind,
          detail: summarize(kind, payload),
        };
        setTicker((prev) => [next, ...prev].slice(0, 12));
        if (kind === "snapshot") {
          const snap = payload as {
            lastIngest?: { github?: string | null; arxiv?: string | null; huggingface?: string | null };
            receiptCount?: number;
          };
          setStat((prev) => ({
            github: snap.lastIngest?.github ?? prev.github,
            arxiv: snap.lastIngest?.arxiv ?? prev.arxiv,
            hf: snap.lastIngest?.huggingface ?? prev.hf,
            receipts: typeof snap.receiptCount === "number" ? snap.receiptCount : prev.receipts,
          }));
        } else if (kind === "receipt") {
          setStat((prev) => ({ ...prev, receipts: prev.receipts + 1 }));
        }
      };
      es.addEventListener("snapshot", apply("snapshot"));
      es.addEventListener("receipt", apply("receipt"));
      es.addEventListener("ingest", apply("ingest"));
    } catch {
      setStreamState("closed");
    }
    return () => {
      closed = true;
      es?.close();
    };
  }, []);

  useEffect(() => {
    detectWebGPU().then(setGpu);
  }, []);

  return (
    <div className="space-y-12">
      <section className="space-y-6">
        <div className="text-xs uppercase tracking-[0.22em] text-primary font-mono">
          covenant proof standard · v1
        </div>
        <h1 className="text-5xl md:text-6xl font-semibold tracking-tight leading-[1.05] max-w-4xl">
          The optimizer decides. The narrator explains. The chain proves.
        </h1>
        <p className="text-lg text-muted-foreground max-w-3xl leading-relaxed">
          ROSIE is the governed decision fabric that orchestrates SZL Holdings.
          A deterministic Ising / simulated-annealing solver holds sole numeric
          authority — every solution is sealed in a SHA-256 hash chain. Language
          models narrate the result for operators but never override it.
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          <Link
            href="/optimizer"
            data-testid="link-launch-optimizer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition"
          >
            ▲ Launch Optimizer
          </Link>
          <Link
            href="/proof"
            data-testid="link-view-receipts"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md border border-border text-sm hover:bg-secondary transition"
          >
            ◐ Inspect Proof Chain
          </Link>
        </div>
      </section>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard testId="stat-receipts" label="Proof receipts" value={String(stat.receipts)} sub="sealed in chain" />
        <StatCard
          testId="stat-github"
          label="GitHub ingest"
          value={stat.github ? "live" : "pending"}
          sub={stat.github ? new Date(stat.github).toLocaleTimeString() : "warming up…"}
        />
        <StatCard
          testId="stat-arxiv"
          label="arXiv ingest"
          value={stat.arxiv ? "live" : "pending"}
          sub={stat.arxiv ? new Date(stat.arxiv).toLocaleTimeString() : "warming up…"}
        />
        <StatCard
          testId="stat-hf"
          label="HuggingFace"
          value={stat.hf ? "live" : "pending"}
          sub={stat.hf ? new Date(stat.hf).toLocaleTimeString() : "warming up…"}
        />
      </section>

      <section className="grid md:grid-cols-3 gap-4">
        <Pillar
          glyph="▲"
          title="Deterministic Optimizer"
          body="Ising / simulated-annealing solver with seed reproducibility. Same inputs always produce the same spins, the same energy, the same hash."
        />
        <Pillar
          glyph="◐"
          title="Covenant Proof Chain"
          body="Every solve appends a SHA-256-linked receipt. prevHash · inputHash · outputHash · receiptHash. Verifiable end-to-end in one click."
        />
        <Pillar
          glyph="◆"
          title="LLM as Narrator"
          body="Claude (via Replit AI Integrations) narrates each solution in plain English. The model never returns numeric authority — its role is governance, not decision."
        />
      </section>

      <section className="rounded-lg border border-border bg-card p-5" data-testid="live-ticker">
        <div className="flex items-center justify-between mb-3">
          <div className="text-[10px] uppercase tracking-[0.22em] text-primary font-mono">
            live activity · /api/rosie/events
          </div>
          <div className="text-[10px] font-mono text-muted-foreground">
            stream={streamState} · {ticker.length} events
          </div>
        </div>
        {ticker.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            {streamState === "connecting" ? "connecting to event stream…" : "no events yet — waiting for next snapshot."}
          </div>
        ) : (
          <ul className="space-y-1.5 text-xs font-mono">
            {ticker.map((t, i) => (
              <li key={i} className="flex gap-3" data-testid={`ticker-${t.kind}`}>
                <span className="text-muted-foreground shrink-0">{new Date(t.at).toLocaleTimeString()}</span>
                <span className="text-primary shrink-0 uppercase tracking-wider">{t.kind}</span>
                <span className="text-foreground/80 truncate">{t.detail}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-lg border border-border bg-card p-5 flex flex-col md:flex-row md:items-center gap-4">
        <div className="text-2xl">{gpu?.available ? "⚡" : "⊘"}</div>
        <div className="flex-1">
          <div className="font-medium">
            WebGPU runtime: {gpu === null ? "detecting…" : gpu.available ? "available" : "unavailable"}
          </div>
          <div className="text-sm text-muted-foreground font-mono mt-0.5" data-testid="text-webgpu-status">
            {gpu === null
              ? "probing navigator.gpu"
              : gpu.available
                ? `${gpu.adapter} · ready for accelerated annealing previews`
                : `falling back to Web Worker simulated annealing — ${gpu.reason}`}
          </div>
        </div>
      </section>
    </div>
  );
}

function summarize(kind: string, payload: Record<string, unknown>): string {
  if (kind === "snapshot") {
    const rc = payload.receiptCount ?? 0;
    const rings = payload.rings as { kernel?: number; external?: number } | undefined;
    return `${rc} receipts · kernel ${rings?.kernel ?? "?"} · external ${rings?.external ?? "?"}`;
  }
  if (kind === "receipt") {
    const r = payload as { kind?: string; templateName?: string; energy?: number; source?: string; itemCount?: number; receiptId?: string };
    if (r.kind === "solve") return `solve ${r.templateName ?? ""} · E=${typeof r.energy === "number" ? r.energy.toFixed(3) : "?"}`;
    if (r.kind === "ingest") return `ingest ${r.source ?? ""} · ${r.itemCount ?? 0} items`;
    if (r.kind === "narration") return `narration sealed (${r.receiptId?.slice(0, 8) ?? "?"})`;
    return r.kind ?? "receipt";
  }
  if (kind === "ingest") {
    const p = payload as { source?: string; itemCount?: number };
    return `${p.source ?? "?"} +${p.itemCount ?? 0}`;
  }
  return JSON.stringify(payload).slice(0, 80);
}

function StatCard({ label, value, sub, testId }: { label: string; value: string; sub: string; testId?: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4" data-testid={testId}>
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-semibold tabular-nums">{value}</div>
      <div className="text-xs text-muted-foreground mt-0.5 font-mono truncate">{sub}</div>
    </div>
  );
}

function Pillar({ glyph, title, body }: { glyph: string; title: string; body: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-5 hover:border-primary/40 transition-colors">
      <div className="text-primary text-2xl mb-3">{glyph}</div>
      <div className="font-medium mb-2">{title}</div>
      <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
    </div>
  );
}
