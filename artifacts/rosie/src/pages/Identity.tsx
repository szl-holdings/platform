import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { detectWebGPU, rosieApi, type AnyReceipt } from "@/lib/api";

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

interface Snapshot {
  lastIngest?: { github?: string | null; arxiv?: string | null; huggingface?: string | null };
  receiptCount?: number;
  rings?: { kernel?: number; external?: number };
}

/**
 * ROSIE landing — the editorial explainer.
 *
 * Six-section narrative (see docs/design/rosie-landing-research-2026.md):
 *   1. Hero with descent-curve visual
 *   2. What ROSIE is, in three lines
 *   3. Capability narrative (4 cards w/ live telemetry)
 *   4. Operator scenarios (3 second-person vignettes)
 *   5. Receipt-trust strip (live count + last hash + verify)
 *   6. Warhacker fabric CTA
 *
 * Live data: subscribes to the SSE stream at /api/rosie/events so the page
 * is never stale. SSE failure falls back to a one-shot REST hydrate.
 */
export default function Identity() {
  const [stat, setStat] = useState<Stat>({ github: null, arxiv: null, hf: null, receipts: 0 });
  const [rings, setRings] = useState<{ kernel: number; external: number } | null>(null);
  const [gpu, setGpu] = useState<{ available: boolean; adapter: string | null; reason: string | null } | null>(null);
  const [ticker, setTicker] = useState<TickerEvent[]>([]);
  const [streamState, setStreamState] = useState<"connecting" | "live" | "closed">("connecting");
  const [headReceipt, setHeadReceipt] = useState<AnyReceipt | null>(null);

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
        setTicker((prev) => [next, ...prev].slice(0, 8));
        if (kind === "snapshot") {
          const snap = payload as Snapshot;
          setStat((prev) => ({
            github: snap.lastIngest?.github ?? prev.github,
            arxiv: snap.lastIngest?.arxiv ?? prev.arxiv,
            hf: snap.lastIngest?.huggingface ?? prev.hf,
            receipts: typeof snap.receiptCount === "number" ? snap.receiptCount : prev.receipts,
          }));
          if (snap.rings?.kernel != null && snap.rings?.external != null) {
            setRings({ kernel: snap.rings.kernel, external: snap.rings.external });
          }
        } else if (kind === "receipt") {
          setStat((prev) => ({ ...prev, receipts: prev.receipts + 1 }));
          // refresh head whenever a new receipt seals
          rosieApi.receipts("all").then((rs) => setHeadReceipt(rs[0] ?? null)).catch(() => undefined);
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
    // One-shot hydrate so the head-receipt strip is populated before SSE
    // ticks. Failures are silent — the strip just stays empty.
    rosieApi.receipts("all").then((rs) => setHeadReceipt(rs[0] ?? null)).catch(() => undefined);
  }, []);

  return (
    <div className="space-y-24">
      <Hero stat={stat} streamState={streamState} />
      <ThreeLines />
      <CapabilityNarrative stat={stat} gpu={gpu} rings={rings} ticker={ticker} streamState={streamState} />
      <OperatorScenarios />
      <ReceiptTrust stat={stat} head={headReceipt} />
      <WarhackerCTA />
    </div>
  );
}

// ─── 1. Hero ──────────────────────────────────────────────────────────────

function Hero({ stat, streamState }: { stat: Stat; streamState: "connecting" | "live" | "closed" }) {
  return (
    <section className="pt-6 md:pt-12 grid lg:grid-cols-[1.2fr_1fr] gap-12 lg:gap-16 items-center">
      <div className="space-y-7">
        <Eyebrow>
          governed decision fabric · covenant proof standard v1
        </Eyebrow>
        <h1 className="font-display text-[44px] md:text-[60px] leading-[1.04] tracking-[-0.018em] text-foreground">
          The optimizer decides. <br className="hidden md:block" />
          The narrator explains. <br className="hidden md:block" />
          The chain proves.
        </h1>
        <p className="text-[17px] leading-[1.65] text-bone-300 max-w-[58ch]" style={{ color: "hsl(var(--foreground) / 0.78)" }}>
          ROSIE is a decision fabric for operators who cannot afford a black
          box. A deterministic Ising / simulated-annealing solver holds the
          sole numeric authority. A language-model narrator explains each
          solution in plain English without ever overriding it. Every solve,
          every ingest, every narration is sealed in a SHA-256 hash chain
          you can verify in one click.
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          <Link
            href="/optimizer"
            data-testid="link-launch-optimizer"
            className="group inline-flex items-center gap-2.5 px-5 py-3 rounded-md bg-primary text-primary-foreground text-sm font-medium transition-colors hover:bg-[hsl(var(--primary)/0.92)]"
          >
            <span className="font-display text-base leading-none">▲</span>
            Launch Optimizer
            <span className="text-xs opacity-70 group-hover:translate-x-0.5 transition-transform">→</span>
          </Link>
          <Link
            href="/reasoning"
            data-testid="link-reasoning"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md border border-border text-sm hover:bg-secondary transition"
          >
            ❖ Reasoning Surface
          </Link>
          <Link
            href="/proof"
            data-testid="link-view-receipts"
            className="inline-flex items-center gap-2.5 px-5 py-3 rounded-md border border-border text-sm text-foreground hover:border-accent/60 hover:text-accent transition-colors"
          >
            <span className="text-base leading-none text-accent">◐</span>
            Inspect Proof Chain
          </Link>
        </div>
        <div className="pt-3 flex items-center gap-4 text-[11px] font-mono text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <StreamDot state={streamState} />
            stream <span className="text-foreground/70">{streamState}</span>
          </span>
          <span className="opacity-50">·</span>
          <span>
            <span className="text-foreground/80">{stat.receipts}</span> receipts sealed
          </span>
        </div>
      </div>

      <DescentMotif />
    </section>
  );
}

function DescentMotif() {
  // Deterministic simulated-annealing-style descent curve. Generated once
  // per mount so it stays still — motion is reserved for the live ticker.
  const points = useMemo(() => {
    const n = 120;
    let e = 1;
    let best = 1;
    const out: { x: number; y: number }[] = [];
    let seed = 1337;
    const rand = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 0xffffffff; };
    for (let i = 0; i < n; i++) {
      const t = i / n;
      const target = 0.05 + (1 - Math.pow(1 - t, 1.6)) * -0.95;
      const jitter = (rand() - 0.5) * 0.18 * (1 - t * 0.7);
      e = e * 0.96 + target * 0.04 + jitter * 0.5;
      if (e < best) best = e;
      out.push({ x: t * 600, y: 120 - ((e + 0.6) / 1.6) * 100 });
    }
    return { pts: out, best };
  }, []);

  const pathD = "M " + points.pts.map((p) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" L ");

  return (
    <div className="relative">
      <div className="rounded-lg border border-border bg-card p-6">
        <div className="flex items-center justify-between mb-4">
          <Eyebrow>descent · simulated annealing · n=64</Eyebrow>
          <span className="font-mono text-[10px] text-muted-foreground">seed=1337</span>
        </div>
        <svg viewBox="0 0 600 140" className="w-full h-44">
          <defs>
            <linearGradient id="descentLine" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor="hsl(var(--primary))" />
              <stop offset="100%" stopColor="hsl(var(--accent))" />
            </linearGradient>
            <linearGradient id="descentFill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--primary) / 0.18)" />
              <stop offset="100%" stopColor="hsl(var(--accent) / 0)" />
            </linearGradient>
          </defs>
          {/* faint grid */}
          {Array.from({ length: 5 }).map((_, i) => (
            <line key={i} x1="0" x2="600" y1={20 + i * 25} y2={20 + i * 25} stroke="hsl(var(--border))" strokeWidth="0.5" opacity="0.5" />
          ))}
          <path d={`${pathD} L 600 140 L 0 140 Z`} fill="url(#descentFill)" />
          <path d={pathD} fill="none" stroke="url(#descentLine)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
          {/* terminal node */}
          {(() => {
            const last = points.pts[points.pts.length - 1];
            return (
              <g>
                <circle cx={last.x} cy={last.y} r="6" fill="hsl(var(--background))" stroke="hsl(var(--accent))" strokeWidth="1.5" />
                <circle cx={last.x} cy={last.y} r="2.5" fill="hsl(var(--accent))" />
              </g>
            );
          })()}
        </svg>
        <div className="mt-4 grid grid-cols-3 gap-4 text-[11px] font-mono">
          <Telemetry label="E final" value={(points.best).toFixed(4)} tone="halon" />
          <Telemetry label="sweeps" value="600" />
          <Telemetry label="receipt" value="sealed" tone="halon" />
        </div>
      </div>
      <div className="absolute -inset-px rounded-lg pointer-events-none border border-primary/0" />
    </div>
  );
}

// ─── 2. What ROSIE is, in three lines ─────────────────────────────────────

function ThreeLines() {
  const lines: { tag: string; head: string; body: string }[] = [
    {
      tag: "decide",
      head: "A deterministic solver, not a model.",
      body: "Ising / simulated annealing with seeded reproducibility. Same inputs always produce the same spins, the same energy, the same hash.",
    },
    {
      tag: "explain",
      head: "A narrator that cannot override.",
      body: "Claude reads the receipt and explains it in plain English. The model never returns numeric authority — its role is governance, not decision.",
    },
    {
      tag: "prove",
      head: "A chain that anyone can verify.",
      body: "Every solve, every ingest, every narration appends a SHA-256-linked receipt. prevHash · inputHash · outputHash · receiptHash. End to end in one click.",
    },
  ];
  return (
    <section className="space-y-8">
      <Eyebrow>what rosie is</Eyebrow>
      <div className="grid md:grid-cols-3 gap-px bg-border rounded-lg overflow-hidden border border-border">
        {lines.map((l) => (
          <div key={l.tag} className="bg-card p-7 space-y-3">
            <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-accent">{l.tag}</div>
            <div className="font-display text-[22px] leading-[1.25] tracking-[-0.005em]">{l.head}</div>
            <p className="text-sm leading-[1.65] text-muted-foreground">{l.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── 3. Capability narrative ──────────────────────────────────────────────

function CapabilityNarrative({
  stat, gpu, rings, ticker, streamState,
}: {
  stat: Stat;
  gpu: { available: boolean; adapter: string | null; reason: string | null } | null;
  rings: { kernel: number; external: number } | null;
  ticker: TickerEvent[];
  streamState: "connecting" | "live" | "closed";
}) {
  return (
    <section className="space-y-8">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div className="space-y-3">
          <Eyebrow>capabilities · live</Eyebrow>
          <h2 className="font-display text-[34px] md:text-[40px] leading-[1.1] tracking-[-0.012em] max-w-3xl">
            Four primitives. One sealed authority. Receipts you can hand to an auditor.
          </h2>
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <CapabilityCard
          tag="optimizer"
          glyph="▲"
          family="tungsten"
          head="Deterministic Ising solver"
          body="Replit-hosted simulated annealing with WebGPU acceleration when the operator's browser exposes it. Authoritative numeric output is sealed before the narrator speaks."
          telemetry={
            <>
              <Telemetry label="runtime" value={gpu === null ? "probing…" : gpu.available ? "WebGPU" : "CPU worker"} tone={gpu?.available ? "tungsten" : undefined} />
              <Telemetry label="adapter" value={gpu?.adapter?.slice(0, 18) ?? (gpu?.reason ? "fallback" : "—")} />
            </>
          }
          to="/optimizer"
          cta="Run a solve →"
        />
        <CapabilityCard
          tag="proof chain"
          glyph="◐"
          family="halon"
          head="Covenant proof chain"
          body="Every solve appends a typed receipt to a SHA-256-linked append-only chain. Verify the head, recompute every link, surface failures by id."
          telemetry={
            <>
              <Telemetry label="sealed" value={String(stat.receipts)} tone="halon" />
              <Telemetry label="standard" value="cps-v1" />
            </>
          }
          to="/proof"
          cta="Verify the chain →"
        />
        <CapabilityCard
          tag="narrator"
          glyph="◆"
          family="tungsten"
          head="LLM as narrator, not authority"
          body="Claude (via Replit AI Integrations) reads the sealed receipt and renders it as one paragraph for the operator. The model is schema-bounded and may not return numbers."
          telemetry={
            <>
              <Telemetry label="role" value="narrator-only" />
              <Telemetry label="schema" value="zod-bounded" tone="tungsten" />
            </>
          }
          to="/proof"
          cta="See sealed narrations →"
        />
        <CapabilityCard
          tag="research loop"
          glyph="≡"
          family="halon"
          head="Live arXiv · HuggingFace · GitHub loop"
          body="Public-source ingest runs on a quiet schedule and seals an ingest receipt for every refresh. No token spend. Every signal is on-chain."
          telemetry={
            <>
              <Telemetry label="arxiv" value={fmtTime(stat.arxiv)} />
              <Telemetry label="huggingface" value={fmtTime(stat.hf)} />
              <Telemetry label="github" value={fmtTime(stat.github)} />
            </>
          }
          to="/research"
          cta="Open research library →"
        />
      </div>

      <section className="space-y-4">
        <div className="text-[10px] uppercase tracking-[0.22em] text-primary font-mono">reasoning kernels · doctrine v6</div>
        <div className="grid md:grid-cols-2 gap-4">
          <ThesisCard
            href="/reasoning/planner"
            glyph="❖"
            title="Graph Planner (DAG)"
            body="Backward-chain a goal into an action DAG with explicit critical path and parallel branches. Unreachable preconditions reject the plan."
            receipt="plan.dag.v1"
          />
          <ThesisCard
            href="/reasoning/ctm"
            glyph="◉"
            title="CTM-Loop Reasoner"
            body="Consciousness-Turing-Machine broadcast arbitration. Every suppressed alternative is logged — the audit trail is complete, not lossy."
            receipt="consciousness.broadcast.v1"
          />
          <ThesisCard
            href="/reasoning/temporal"
            glyph="⌛"
            title="Time-R1 Temporal Engine"
            body="Bucket-drift scoring with a causal prior. Non-monotonic timestamps are refused — effect-before-cause cannot be silently scored."
            receipt="anomaly.time-r1.v1"
          />
          <ThesisCard
            href="/reasoning/bench"
            glyph="▣"
            title="MARBLE Multi-Agent Bench"
            body="Held-out regression for orchestrations. Lower coordination cost + higher policy denials of adversarial goals = better score."
            receipt="bench.marble.v1"
          />
        </div>
      </section>

      {/* Live activity strip — telemetry-as-decoration */}
      <div className="rounded-lg border border-border bg-card overflow-hidden" data-testid="live-ticker">
        <div className="flex items-center justify-between px-5 py-3 border-b border-border">
          <div className="flex items-center gap-3">
            <StreamDot state={streamState} />
            <div className="text-[10px] uppercase tracking-[0.22em] text-primary font-mono">
              live activity · /api/rosie/events
            </div>
          </div>
          <div className="text-[10px] font-mono text-muted-foreground">
            stream={streamState} · {rings ? `kernel ${rings.kernel} · external ${rings.external}` : `${ticker.length} events`}
          </div>
        </div>
        {ticker.length === 0 ? (
          <div className="px-5 py-4 text-sm text-muted-foreground">
            {streamState === "connecting" ? "connecting to event stream…" : "no events yet — waiting for the next snapshot."}
          </div>
        ) : (
          <ul className="divide-y divide-border/60">
            {ticker.map((t, i) => (
              <li key={i} className="px-5 py-2 flex gap-4 text-[12px] font-mono items-baseline" data-testid={`ticker-${t.kind}`}>
                <span className="text-muted-foreground shrink-0 w-20 tabular-nums">{new Date(t.at).toLocaleTimeString()}</span>
                <span className={`shrink-0 w-20 uppercase tracking-[0.18em] ${t.kind === "receipt" ? "text-accent" : t.kind === "snapshot" ? "text-primary" : "text-muted-foreground"}`}>{t.kind}</span>
                <span className="text-foreground/85 truncate">{t.detail}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function CapabilityCard({
  tag, glyph, family, head, body, telemetry, to, cta,
}: {
  tag: string;
  glyph: string;
  family: "tungsten" | "halon";
  head: string;
  body: string;
  telemetry: React.ReactNode;
  to: string;
  cta: string;
}) {
  const tone = family === "tungsten" ? "text-primary" : "text-accent";
  const hoverBorder = family === "tungsten" ? "hover:border-primary/40" : "hover:border-accent/40";
  return (
    <Link href={to} className={`block rounded-lg border border-border bg-card p-6 transition-colors ${hoverBorder} group`}>
      <div className="flex items-start justify-between mb-4">
        <div className={`font-mono text-[10px] uppercase tracking-[0.22em] ${tone}`}>{tag}</div>
        <span className={`text-xl leading-none ${tone}`}>{glyph}</span>
      </div>
      <div className="font-display text-[22px] leading-[1.25] tracking-[-0.005em] mb-3">{head}</div>
      <p className="text-sm leading-[1.65] text-muted-foreground">{body}</p>
      <div className="mt-5 grid grid-cols-2 gap-x-6 gap-y-2">{telemetry}</div>
      <div className={`mt-5 text-[12px] font-medium ${tone} group-hover:translate-x-0.5 transition-transform inline-block`}>{cta}</div>
    </Link>
  );
}

// ─── 4. Operator scenarios ────────────────────────────────────────────────

function OperatorScenarios() {
  const scenarios: { role: string; head: string; body: string; receipt: string }[] = [
    {
      role: "port master",
      head: "You are placing fourteen vessels against four berths.",
      body: "Time windows conflict. Demurrage compounds. ROSIE's Ising solver assigns the berths in under a second, and the receipt names the seed, the energy, and every spin. You hand the receipt to ops; nobody asks how you decided.",
      receipt: "vessel-berth · E = −12.84 · sealed",
    },
    {
      role: "ciso",
      head: "You are picking which controls to ship this quarter.",
      body: "Budget is finite, posture is non-linear. ROSIE encodes residual risk as a coupling matrix and surfaces the lowest-energy control set, with three near-optima for the audit committee. The narration is on the receipt, not the slide deck.",
      receipt: "control-portfolio · E = −7.31 · 3 alternatives",
    },
    {
      role: "research lead",
      head: "You are deciding which arXiv signals deserve a sprint.",
      body: "ROSIE's research loop ingests cs.LG and quant-ph on a schedule. The optimizer ranks the cohort against your own bias vector, the narrator explains the trade, and every refresh seals its own ingest receipt. The chain is the audit trail.",
      receipt: "research-cohort · sealed · 28 papers",
    },
  ];
  return (
    <section className="space-y-8">
      <Eyebrow>operator scenarios</Eyebrow>
      <h2 className="font-display text-[34px] md:text-[40px] leading-[1.1] tracking-[-0.012em] max-w-3xl">
        Three operators. Three decisions. One receipt each.
      </h2>
      <div className="grid md:grid-cols-3 gap-px bg-border rounded-lg overflow-hidden border border-border">
        {scenarios.map((s) => (
          <article key={s.role} className="bg-card p-7 flex flex-col gap-4">
            <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-primary">you are a {s.role}</div>
            <h3 className="font-display text-[20px] leading-[1.3] tracking-[-0.005em]">{s.head}</h3>
            <p className="text-sm leading-[1.65] text-muted-foreground flex-1">{s.body}</p>
            <div className="rounded border border-border bg-background/40 px-3 py-2 font-mono text-[11px] text-accent">
              ◐ {s.receipt}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

// ─── 5. Receipt-trust strip ───────────────────────────────────────────────

function ReceiptTrust({ stat, head }: { stat: Stat; head: AnyReceipt | null }) {
  return (
    <section className="space-y-5">
      <Eyebrow>receipt trust · live head</Eyebrow>
      <div className="rounded-lg border border-border bg-card p-6 md:p-7 flex flex-col md:flex-row md:items-center gap-6">
        <div className="flex-1 space-y-2">
          <div className="font-display text-[26px] leading-[1.2] tracking-[-0.01em]">
            {stat.receipts.toLocaleString()} receipts sealed in this chain.
          </div>
          <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
            Each receipt links to the one before it by SHA-256. Tampering with
            any link breaks every link after it. Verification is one
            anonymous POST away.
          </p>
        </div>
        <div className="space-y-3 md:min-w-[300px]">
          <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-accent">head receipt</div>
          <div className="font-mono text-[11px] text-foreground/85 break-all bg-background/40 border border-border rounded p-3" data-testid="head-hash">
            {head ? head.receiptHash : "—  (chain warming up)"}
          </div>
          <Link
            href="/proof"
            data-testid="link-verify-chain"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-accent/40 text-accent text-sm hover:bg-accent/10 transition-colors"
          >
            <span className="leading-none">◐</span>
            Verify the chain →
          </Link>
        </div>
      </div>
    </section>
  );
}

// ─── 6. Warhacker CTA ─────────────────────────────────────────────────────

function WarhackerCTA() {
  return (
    <section className="space-y-5">
      <div className="rounded-lg border border-primary/30 bg-gradient-to-br from-card to-[hsl(var(--primary)/0.04)] p-7 md:p-10 flex flex-col md:flex-row md:items-center gap-6">
        <div className="flex-1 space-y-3">
          <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-primary">warhacker fabric</div>
          <h2 className="font-display text-[28px] md:text-[34px] leading-[1.15] tracking-[-0.01em] max-w-2xl">
            ROSIE is one node in a larger operator fabric.
          </h2>
          <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
            Vessels, Sentra, A11oy, Conduit — each surface plugs into ROSIE's
            governed solver. The Warhacker map shows the live edges, the
            ingest pulse, and where the next decision is going to land.
          </p>
        </div>
        <Link
          href="/fabric"
          data-testid="link-warhacker"
          className="inline-flex items-center gap-2.5 px-5 py-3 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-[hsl(var(--primary)/0.92)] transition-colors shrink-0"
        >
          <span className="text-base leading-none">✷</span>
          Enter the Warhacker Fabric →
        </Link>
      </div>
    </section>
  );
}

// ─── shared primitives ────────────────────────────────────────────────────

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-primary/90">
      {children}
    </div>
  );
}

function Telemetry({ label, value, tone }: { label: string; value: string; tone?: "tungsten" | "halon" }) {
  const valueClass =
    tone === "tungsten" ? "text-primary" : tone === "halon" ? "text-accent" : "text-foreground/85";
  return (
    <div className="space-y-0.5">
      <div className="font-mono text-[9px] uppercase tracking-[0.22em] text-muted-foreground">{label}</div>
      <div className={`font-mono text-[12px] ${valueClass} truncate`}>{value}</div>
    </div>
  );
}

function StreamDot({ state }: { state: "connecting" | "live" | "closed" }) {
  const cls =
    state === "live"
      ? "bg-accent shadow-[0_0_0_2px_hsl(var(--accent)/0.25)] animate-pulse"
      : state === "closed"
        ? "bg-destructive"
        : "bg-muted-foreground";
  return <span className={`inline-block w-1.5 h-1.5 rounded-full ${cls}`} />;
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

function fmtTime(iso: string | null): string {
  if (!iso) return "warming…";
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
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

function ThesisCard({ href, glyph, title, body, receipt }: { href: string; glyph: string; title: string; body: string; receipt: string }) {
  return (
    <Link
      href={href}
      data-testid={`thesis-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
      className="block rounded-lg border border-border bg-card p-5 hover:border-primary/40 transition-colors"
    >
      <div className="flex items-start gap-3">
        <div className="text-primary text-2xl">{glyph}</div>
        <div className="flex-1">
          <div className="font-medium mb-1.5">{title}</div>
          <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
          <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-mono mt-3">
            receipt · <span className="text-primary">{receipt}</span>
          </div>
        </div>
      </div>
    </Link>
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
