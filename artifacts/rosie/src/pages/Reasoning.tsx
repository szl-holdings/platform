import { Link } from "wouter";

const CAPABILITIES = [
  {
    path: "/reasoning/planner",
    glyph: "❖",
    title: "Graph Planner",
    body: "DAG plan synthesis with cycle detection, critical-path scoring, and parallel-branch discovery. Plans that can't be satisfied are rejected with the unmet preconditions surfaced.",
    receiptKind: "plan.dag.v1",
  },
  {
    path: "/reasoning/ctm",
    glyph: "◉",
    title: "CTM-Loop Reasoner",
    body: "Consciousness Turing Machine broadcast arbitration. N specialist processors propose a candidate each tick; the arbiter picks one winner — every loser is logged as a suppressed alternative.",
    receiptKind: "consciousness.broadcast.v1",
  },
  {
    path: "/reasoning/temporal",
    glyph: "⌛",
    title: "Time-R1 Temporal Engine",
    body: "Bucket-drift scoring with a causal prior: refuses to score a time series whose timestamps are non-monotonic unless explicitly overridden. Returns peak drift and a forecast.",
    receiptKind: "anomaly.time-r1.v1",
  },
  {
    path: "/reasoning/bench",
    glyph: "▣",
    title: "MARBLE Multi-Agent Bench",
    body: "Held-out regression harness for orchestrations: scores coordination cost, conflict count, task success, and adversarial-goal-block rate. Includes a built-in drone-handoff scenario.",
    receiptKind: "bench.marble.v1",
  },
] as const;

export default function Reasoning() {
  return (
    <div className="space-y-10">
      <section className="space-y-5">
        <div className="text-xs uppercase tracking-[0.22em] text-primary font-mono">
          reasoning surface · doctrine v6
        </div>
        <h1 className="text-4xl md:text-5xl font-semibold tracking-tight leading-[1.05] max-w-4xl">
          Four reasoning kernels. One governance chain.
        </h1>
        <p className="text-lg text-muted-foreground max-w-3xl leading-relaxed">
          Every capability below emits a Λ-receipt on a SHA-256-linked chain.
          The optimizer still holds sole numeric authority — these kernels
          plan, arbitrate, score, and benchmark <em>around</em> it.
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          <Link
            href="/reasoning/drone-oversight"
            data-testid="link-drone-oversight"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition"
          >
            ▶ Run Drone-Oversight Demo
          </Link>
          <Link
            href="/proof"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md border border-border text-sm hover:bg-secondary transition"
          >
            ◐ Inspect Proof Chain
          </Link>
        </div>
      </section>

      <section className="grid md:grid-cols-2 gap-4" data-testid="capabilities-grid">
        {CAPABILITIES.map((c) => (
          <Link
            key={c.path}
            href={c.path}
            data-testid={`capability-${c.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
            className="block rounded-lg border border-border bg-card p-6 hover:border-primary/50 transition-colors group"
          >
            <div className="flex items-start gap-4">
              <div className="text-primary text-2xl">{c.glyph}</div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-lg group-hover:text-primary transition">{c.title}</div>
                <p className="text-sm text-muted-foreground leading-relaxed mt-1.5">{c.body}</p>
                <div className="mt-4 text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground">
                  receipt kind · <span className="text-primary">{c.receiptKind}</span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </section>

      <section className="rounded-lg border border-border bg-card p-5">
        <div className="text-[10px] uppercase tracking-[0.22em] text-primary font-mono mb-3">
          how it composes
        </div>
        <ol className="space-y-2 text-sm text-muted-foreground">
          <li><span className="font-mono text-primary">1.</span> Graph Planner emits the action DAG; critical path and parallel ranks are explicit, not implicit.</li>
          <li><span className="font-mono text-primary">2.</span> Time-R1 scores the telemetry — a non-monotonic series is refused before any model sees it.</li>
          <li><span className="font-mono text-primary">3.</span> CTM-Loop arbitrates the broadcast — winner moves forward; every loser is logged.</li>
          <li><span className="font-mono text-primary">4.</span> MARBLE Bench is the held-out regression: high-cost / high-conflict / low-block-rate orchestrations are caught here.</li>
          <li><span className="font-mono text-primary">5.</span> Every step seals a Λ-receipt; the chain head is verifiable end-to-end on the Proof page.</li>
        </ol>
      </section>
    </div>
  );
}
