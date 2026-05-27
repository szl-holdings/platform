import { useEffect, useState } from "react";

type Receipt = {
  index: number;
  receiptClass: string;
  subject: string;
  summary: string;
  payloadSha256: string;
  prevHash: string;
  entryHash: string;
  emittedAt: string;
  pillar: string;
};

type ChainEnvelope = {
  lane: string;
  traceId: string;
  chain: Receipt[];
  head: string;
  chainLength: number;
  verifiedAt: string;
};

type BundleEntry = {
  name: string;
  version: string;
  artifactRef: string | null;
  artifactSha256: string | null;
  artifactSha256Source: "sidecar" | "computed" | "none";
  sidecarRef: string | null;
  sidecarSha256: string | null;
  signatureRef: string | null;
  signerDid: string | null;
  signerKeyRef: string | null;
  sizeBytes: number | null;
  builtAt: string | null;
  source: "dist" | "fallback";
};

type Lane1Result = ChainEnvelope & {
  bundleMatrix: BundleEntry[];
  bundlesPresentOnDisk: number;
  deployScript: string[];
};

type Lane2Result = ChainEnvelope & {
  commanderDashboard: {
    unitRef: string;
    readinessRatio: number;
    pillBucket: "GREEN" | "AMBER" | "RED";
    screened: number;
    deferred: number;
    failed: number;
    rosterSize: number;
  };
};

type Lane3Result = ChainEnvelope & {
  approvalsInbox: {
    ref: string;
    lambdaAxes: Record<string, number>;
    admitted: boolean;
  };
};

type Lane4Result = ChainEnvelope & {
  inspector: {
    trackRef: string;
    points: { t: number; x: number; y: number }[];
    approachKm: number;
    conjunctionRiskPct: number;
    recommended: string;
    vesselsDeepLink: string;
  };
};

type Lane5Result = ChainEnvelope & {
  edgeNodeRef: string;
  poisoned: number;
  caught: number;
  caughtAll: boolean;
};

function short(hash: string): string {
  if (!hash) return "—";
  return hash.length > 16 ? `${hash.slice(0, 10)}…${hash.slice(-6)}` : hash;
}

function StatusPill({
  state,
}: {
  state: { kind: "idle" } | { kind: "running" } | { kind: "ok"; len: number } | { kind: "err" };
}) {
  if (state.kind === "ok") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border border-emerald-500/40 bg-emerald-500/10 text-emerald-400 font-mono text-[10px] uppercase tracking-[0.18em]">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> chain intact · {state.len} receipts
      </span>
    );
  }
  if (state.kind === "err") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border border-rose-500/40 bg-rose-500/10 text-rose-400 font-mono text-[10px] uppercase tracking-[0.18em]">
        run failed
      </span>
    );
  }
  if (state.kind === "running") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border border-amber-500/40 bg-amber-500/10 text-amber-400 font-mono text-[10px] uppercase tracking-[0.18em]">
        running…
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border border-border bg-card text-muted-foreground font-mono text-[10px] uppercase tracking-[0.18em]">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/70" /> operational
    </span>
  );
}

function ChainTable({ env }: { env: ChainEnvelope }) {
  return (
    <div className="rounded-md border border-border bg-background/50">
      <div className="px-3 py-2 border-b border-border flex flex-wrap gap-3 text-[11px] font-mono text-muted-foreground">
        <span>
          trace <span className="text-foreground">{env.traceId}</span>
        </span>
        <span>
          head <span className="text-emerald-400">{short(env.head)}</span>
        </span>
        <span>
          verified <span className="text-foreground">{env.verifiedAt}</span>
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
            <tr>
              <th className="text-left px-3 py-1.5">#</th>
              <th className="text-left px-3 py-1.5">Receipt class</th>
              <th className="text-left px-3 py-1.5">Subject</th>
              <th className="text-left px-3 py-1.5">Entry hash</th>
            </tr>
          </thead>
          <tbody className="font-mono">
            {env.chain.map((r) => (
              <tr key={r.index} className="border-t border-border">
                <td className="px-3 py-1.5 text-muted-foreground">{r.index}</td>
                <td className="px-3 py-1.5 text-foreground">{r.receiptClass}</td>
                <td className="px-3 py-1.5 text-muted-foreground break-all">{r.subject}</td>
                <td className="px-3 py-1.5 text-emerald-400">{short(r.entryHash)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function useLane<T extends ChainEnvelope>(endpoint: string) {
  const [state, setState] = useState<
    | { kind: "idle" }
    | { kind: "running" }
    | { kind: "ok"; result: T }
    | { kind: "err"; message: string }
  >({ kind: "idle" });

  async function run(body: unknown = {}) {
    setState({ kind: "running" });
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const text = await res.text();
        setState({ kind: "err", message: `HTTP ${res.status}: ${text.slice(0, 240)}` });
        return;
      }
      const result = (await res.json()) as T;
      setState({ kind: "ok", result });
    } catch (err) {
      setState({ kind: "err", message: (err as Error).message });
    }
  }
  return { state, run };
}

function LaneShell({
  id,
  num,
  title,
  artifact,
  description,
  receiptClasses,
  state,
  children,
  evidenceLink,
}: {
  id: string;
  num: number;
  title: string;
  artifact: string;
  description: string;
  receiptClasses: string[];
  state: { kind: "idle" } | { kind: "running" } | { kind: "ok"; result: ChainEnvelope } | { kind: "err"; message: string };
  children: React.ReactNode;
  evidenceLink?: { href: string; label: string };
}) {
  const pillState =
    state.kind === "ok"
      ? ({ kind: "ok", len: state.result.chainLength } as const)
      : state.kind === "err"
      ? ({ kind: "err" } as const)
      : state.kind === "running"
      ? ({ kind: "running" } as const)
      : ({ kind: "idle" } as const);
  return (
    <div
      id={id}
      data-testid={`warhacker-lane-${num}`}
      className="rounded-lg border border-border bg-card p-6 flex flex-col gap-4 scroll-mt-24"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-mono">
            LANE {num} · {artifact}
          </div>
          <h2 className="mt-1 text-xl font-semibold text-foreground leading-tight">{title}</h2>
        </div>
        <StatusPill state={pillState} />
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
      <div className="flex flex-wrap gap-1.5">
        {receiptClasses.map((c) => (
          <span
            key={c}
            className="font-mono text-[10px] uppercase tracking-[0.08em] px-2 py-0.5 rounded border border-border bg-background text-muted-foreground"
          >
            {c}
          </span>
        ))}
      </div>
      {evidenceLink && (
        <div>
          <a
            href={evidenceLink.href}
            className="text-xs font-semibold text-primary hover:underline"
          >
            {evidenceLink.label} →
          </a>
        </div>
      )}
      {children}
      {state.kind === "err" && (
        <pre className="text-xs text-rose-400 bg-rose-500/5 border border-rose-500/30 rounded p-2 overflow-x-auto">
          {state.message}
        </pre>
      )}
      {state.kind === "ok" && <ChainTable env={state.result} />}
    </div>
  );
}

// ─── Lane 1 — Bundle composition ────────────────────────────────────────────

function Lane1() {
  const { state, run } = useLane<Lane1Result>("/api/warhacker/lane/1/bundle-compose");
  return (
    <LaneShell
      id="lane-1"
      num={1}
      title="Fragmented Satellite Ground Software"
      artifact="rosie-uds + sentra-uds + amaru-uds + a11oy-uds"
      description="Deploy in three commands. Four UDS bundles compose into one ground stack, with shared services, a single attestation chain, and one observability plane."
      receiptClasses={["bundle.composition.v1", "attestation.chain.v1", "observability.plane.v1"]}
      state={state}
      evidenceLink={{ href: "/uds/", label: "Open a11oy.UDS evidence page" }}
    >
      <button
        type="button"
        onClick={() => run({})}
        disabled={state.kind === "running"}
        data-testid="run-lane-1"
        className="self-start px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-semibold tracking-wide hover:opacity-90 disabled:opacity-50"
      >
        {state.kind === "running" ? "Composing…" : "Run This Demo"}
      </button>
      {state.kind === "ok" && (
        <div className="space-y-3">
          <div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-mono mb-1.5">
              Deploy in three commands
            </div>
            <pre className="rounded border border-border bg-background/60 p-3 text-[11px] text-emerald-400 font-mono overflow-x-auto">
{state.result.deployScript.join("\n")}
            </pre>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-mono">
                Live bundle matrix
              </div>
              <span className="text-[10px] font-mono text-muted-foreground">
                {state.result.bundlesPresentOnDisk}/{state.result.bundleMatrix.length} present on disk
              </span>
            </div>
            <div className="overflow-x-auto rounded border border-border">
              <table className="w-full text-xs">
                <thead className="text-[10px] uppercase tracking-[0.08em] text-muted-foreground bg-background/40">
                  <tr>
                    <th className="text-left px-3 py-1.5">Bundle</th>
                    <th className="text-left px-3 py-1.5">Artifact</th>
                    <th className="text-left px-3 py-1.5">sha256</th>
                    <th className="text-left px-3 py-1.5">Signer</th>
                    <th className="text-left px-3 py-1.5">Source</th>
                  </tr>
                </thead>
                <tbody className="font-mono">
                  {state.result.bundleMatrix.map((b) => (
                    <tr key={b.name} className="border-t border-border">
                      <td className="px-3 py-1.5 text-foreground">{b.name}</td>
                      <td className="px-3 py-1.5 text-muted-foreground break-all">{b.artifactRef ?? "—"}</td>
                      <td className="px-3 py-1.5">
                        {b.artifactSha256 ? (
                          <span
                            className={
                              b.artifactSha256Source === "sidecar"
                                ? "text-emerald-400"
                                : "text-amber-400"
                            }
                            title={
                              b.artifactSha256Source === "sidecar"
                                ? `from ${b.sidecarRef ?? ".sha256"}`
                                : b.artifactSha256Source === "computed"
                                  ? "recomputed from tarball (no .sha256 sidecar)"
                                  : "no tarball on disk"
                            }
                          >
                            {short(b.artifactSha256)}
                            <span className="ml-1 text-[9px] uppercase tracking-[0.1em] opacity-70">
                              {b.artifactSha256Source === "sidecar" ? "signed" : "computed"}
                            </span>
                          </span>
                        ) : (
                          <span className="text-muted-foreground">pending build</span>
                        )}
                      </td>
                      <td className="px-3 py-1.5 break-all">
                        {b.signerDid ? (
                          <span
                            className="text-emerald-400"
                            title={b.signerKeyRef ?? undefined}
                          >
                            {b.signerDid}
                          </span>
                        ) : b.signatureRef ? (
                          <span className="text-amber-400" title={b.signatureRef}>
                            signed (no key)
                          </span>
                        ) : (
                          <span className="text-muted-foreground">unsigned</span>
                        )}
                      </td>
                      <td className="px-3 py-1.5">
                        {b.source === "dist" ? (
                          <span className="text-emerald-400">disk</span>
                        ) : (
                          <span className="text-amber-400">fallback</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </LaneShell>
  );
}

// ─── Lane 2 — Health screening ──────────────────────────────────────────────

function Lane2() {
  const { state, run } = useLane<Lane2Result>("/api/warhacker/lane/2/health-screening");
  const [unitRef, setUnitRef] = useState("unit:7-30-CAV-A-CO");
  const [rosterSize, setRosterSize] = useState(118);
  const [screened, setScreened] = useState(110);
  const [deferred, setDeferred] = useState(6);
  const [failed, setFailed] = useState(2);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    void run({ unitRef, rosterSize, screened, deferred, failed });
  }

  return (
    <LaneShell
      id="lane-2"
      num={2}
      title="Military Deployment Health Screening"
      artifact="Amaru / Conduit"
      description="Mobile-friendly screening form, commander dashboard, unit-readiness rollup. Backed by real schema-grounded extract + memnet recall."
      receiptClasses={["extraction.schema-grounded.v1", "memory.recall.v1", "unit.readiness.v1"]}
      state={state}
      evidenceLink={{ href: "/conduit/health-screening", label: "Open Conduit health-screening page" }}
    >
      <form
        onSubmit={submit}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 rounded border border-border bg-background/50 p-3"
        data-testid="lane-2-form"
      >
        <label className="text-[11px] font-mono text-muted-foreground sm:col-span-2">
          UNIT REF
          <input
            type="text"
            value={unitRef}
            onChange={(e) => setUnitRef(e.target.value)}
            className="mt-1 w-full bg-card border border-border rounded px-2 py-1 text-foreground font-mono text-xs"
          />
        </label>
        {[
          ["ROSTER", rosterSize, setRosterSize],
          ["SCREENED", screened, setScreened],
          ["DEFERRED", deferred, setDeferred],
          ["FAILED", failed, setFailed],
        ].map(([label, val, set]) => (
          <label key={label as string} className="text-[11px] font-mono text-muted-foreground">
            {label as string}
            <input
              type="number"
              min={0}
              value={val as number}
              onChange={(e) => (set as (n: number) => void)(Number(e.target.value))}
              className="mt-1 w-full bg-card border border-border rounded px-2 py-1 text-foreground font-mono text-xs"
            />
          </label>
        ))}
        <button
          type="submit"
          disabled={state.kind === "running"}
          data-testid="run-lane-2"
          className="sm:col-span-2 lg:col-span-5 mt-1 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 disabled:opacity-50"
        >
          {state.kind === "running" ? "Screening…" : "Run This Demo (submit screening)"}
        </button>
      </form>
      {state.kind === "ok" && (
        <div className="rounded border border-border bg-background/50 p-3">
          <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-mono mb-2">
            Commander dashboard
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span
              className={
                "px-2 py-0.5 rounded font-mono text-[11px] tracking-wide " +
                (state.result.commanderDashboard.pillBucket === "GREEN"
                  ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                  : state.result.commanderDashboard.pillBucket === "AMBER"
                  ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                  : "bg-rose-500/15 text-rose-400 border border-rose-500/30")
              }
            >
              {state.result.commanderDashboard.pillBucket}
            </span>
            <span className="text-sm text-foreground">
              {state.result.commanderDashboard.unitRef} —{" "}
              <span className="font-mono">{(state.result.commanderDashboard.readinessRatio * 100).toFixed(1)}%</span> ready
            </span>
            <span className="text-[11px] font-mono text-muted-foreground ml-auto">
              screened {state.result.commanderDashboard.screened} · deferred{" "}
              {state.result.commanderDashboard.deferred} · failed {state.result.commanderDashboard.failed} ·
              roster {state.result.commanderDashboard.rosterSize}
            </span>
          </div>
        </div>
      )}
    </LaneShell>
  );
}

// ─── Lane 3 — Drone oversight ───────────────────────────────────────────────

function Lane3() {
  const { state, run } = useLane<Lane3Result>("/api/warhacker/lane/3/drone-oversight");
  return (
    <LaneShell
      id="lane-3"
      num={3}
      title="AI Oversight for Autonomous Drones"
      artifact="ROSIE"
      description="Graph Planner + CTM + Time-R1 run against a synthetic drone telemetry stream. Tamper-evident Λ-receipts land in the Approvals Inbox."
      receiptClasses={["graph.plan.v1", "ctm.tick.v1", "time-r1.window.v1", "lambda.invariant.v1"]}
      state={state}
      evidenceLink={{ href: "/proof", label: "Open Proof Chain (approvals)" }}
    >
      <button
        type="button"
        onClick={() => run({})}
        disabled={state.kind === "running"}
        data-testid="run-lane-3"
        className="self-start px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 disabled:opacity-50"
      >
        {state.kind === "running" ? "Reasoning…" : "Run This Demo"}
      </button>
      {state.kind === "ok" && (
        <div className="rounded border border-border bg-background/50 p-3 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-mono">
              Λ-9 invariant — {state.result.approvalsInbox.admitted ? "HELD" : "BREACHED"}
            </div>
            <a
              href={state.result.approvalsInbox.ref}
              data-testid="lane-3-approvals-link"
              className="text-xs font-semibold text-primary hover:underline"
            >
              Open in Approvals Inbox →
            </a>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 font-mono text-[11px]">
            {Object.entries(state.result.approvalsInbox.lambdaAxes).map(([k, v]) => (
              <div key={k} className="flex items-center justify-between border border-border rounded px-2 py-1">
                <span className="text-muted-foreground">{k}</span>
                <span className={v >= 0.9 ? "text-emerald-400" : "text-rose-400"}>{v.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </LaneShell>
  );
}

// ─── Lane 4 — Trajectory inspector ──────────────────────────────────────────

function TrajectoryChart({ points }: { points: { t: number; x: number; y: number }[] }) {
  if (points.length === 0) return null;
  const minX = Math.min(...points.map((p) => p.x));
  const maxX = Math.max(...points.map((p) => p.x));
  const minY = Math.min(...points.map((p) => p.y));
  const maxY = Math.max(...points.map((p) => p.y));
  const W = 600;
  const H = 180;
  const pad = 12;
  const sx = (x: number) =>
    pad + ((x - minX) / Math.max(1e-6, maxX - minX)) * (W - 2 * pad);
  const sy = (y: number) =>
    H - pad - ((y - minY) / Math.max(1e-6, maxY - minY)) * (H - 2 * pad);
  const d = points.map((p, i) => `${i === 0 ? "M" : "L"}${sx(p.x).toFixed(1)},${sy(p.y).toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-44 rounded border border-border bg-background/60">
      <path d={d} fill="none" stroke="currentColor" strokeWidth={1.5} className="text-primary" />
      {points.map((p, i) => (
        <circle key={i} cx={sx(p.x)} cy={sy(p.y)} r={1.4} className="text-emerald-400" fill="currentColor" />
      ))}
    </svg>
  );
}

function Lane4() {
  const { state, run } = useLane<Lane4Result>("/api/warhacker/lane/4/trajectory");
  return (
    <LaneShell
      id="lane-4"
      num={4}
      title="Trajectory Data Visualization"
      artifact="Vessels + ROSIE"
      description="Orbit/track inspector ingests a synthetic stream, fuses it with ROSIE Time-R1, and emits operational context cards with pipeline-stage receipts."
      receiptClasses={["pipeline.stage.v1", "time-r1.window.v1", "context.card.v1"]}
      state={state}
      evidenceLink={{ href: "/vessels/", label: "Open Vessels" }}
    >
      <button
        type="button"
        onClick={() => run({})}
        disabled={state.kind === "running"}
        data-testid="run-lane-4"
        className="self-start px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 disabled:opacity-50"
      >
        {state.kind === "running" ? "Fusing track…" : "Run This Demo"}
      </button>
      {state.kind === "ok" && (
        <div className="space-y-3">
          <TrajectoryChart points={state.result.inspector.points} />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono">
            <div className="border border-border rounded px-2 py-1">
              <div className="text-muted-foreground">TRACK</div>
              <div className="text-foreground break-all">{state.result.inspector.trackRef}</div>
            </div>
            <div className="border border-border rounded px-2 py-1">
              <div className="text-muted-foreground">APPROACH</div>
              <div className="text-foreground">{state.result.inspector.approachKm} km</div>
            </div>
            <div className="border border-border rounded px-2 py-1">
              <div className="text-muted-foreground">CONJUNCTION</div>
              <div
                className={
                  state.result.inspector.conjunctionRiskPct > 1.4
                    ? "text-rose-400"
                    : "text-emerald-400"
                }
              >
                {state.result.inspector.conjunctionRiskPct}%
              </div>
            </div>
            <div className="border border-border rounded px-2 py-1">
              <div className="text-muted-foreground">ACTION</div>
              <div
                className={
                  state.result.inspector.recommended === "maneuver"
                    ? "text-amber-400"
                    : "text-emerald-400"
                }
              >
                {state.result.inspector.recommended}
              </div>
            </div>
          </div>
          <a
            href={state.result.inspector.vesselsDeepLink}
            data-testid="lane-4-vessels-link"
            className="inline-block text-xs font-semibold text-primary hover:underline"
          >
            Open this trajectory in Vessels →
          </a>
        </div>
      )}
    </LaneShell>
  );
}

// ─── Lane 5 — Edge adversary drill ──────────────────────────────────────────

function Lane5() {
  const { state, run } = useLane<Lane5Result>("/api/warhacker/lane/5/edge-drill");
  return (
    <LaneShell
      id="lane-5"
      num={5}
      title="AI at the Tactical Edge"
      artifact="Sentra + rosie-uds + sentra-uds"
      description="Sentra Edge Adversary Drill runs inside the bundled stack on a simulated edge node. The antivenom detector catches a poisoned input live."
      receiptClasses={["edge.drill.v1", "peak.detection.v1", "antivenom.catch.v1"]}
      state={state}
      evidenceLink={{ href: "/sentra/", label: "Open Sentra" }}
    >
      <button
        type="button"
        onClick={() => run({})}
        disabled={state.kind === "running"}
        data-testid="run-lane-5"
        className="self-start px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 disabled:opacity-50"
      >
        {state.kind === "running" ? "Running drill…" : "Run This Demo"}
      </button>
      {state.kind === "ok" && (
        <div className="rounded border border-border bg-background/50 p-3 flex flex-wrap items-center gap-3">
          <span
            className={
              "px-2 py-0.5 rounded font-mono text-[11px] tracking-wide " +
              (state.result.caughtAll
                ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                : "bg-rose-500/15 text-rose-400 border border-rose-500/30")
            }
          >
            {state.result.caughtAll ? "ANTIVENOM HELD" : "MISSES"}
          </span>
          <span className="text-sm text-foreground">{state.result.edgeNodeRef}</span>
          <span className="text-[11px] font-mono text-muted-foreground ml-auto">
            poisoned {state.result.poisoned} · caught {state.result.caught}
          </span>
        </div>
      )}
    </LaneShell>
  );
}

// ─── Hub page ───────────────────────────────────────────────────────────────

export default function Warhacker() {
  // Smooth-scroll to the deep-link anchor (#lane-N) when the page loads
  // from a cross-artifact tile.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const hash = window.location.hash;
    if (!hash) return;
    const el = document.querySelector(hash);
    if (el && "scrollIntoView" in el) {
      (el as HTMLElement).scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  return (
    <div className="space-y-8 rosie-route">
      <header className="space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary">
            WARHACKER HUB · DEFENSE UNICORNS
          </span>
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border border-emerald-500/40 bg-emerald-500/10 text-emerald-400 font-mono text-[10px] uppercase tracking-[0.18em]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> 5 of 5 lanes operational
          </span>
        </div>
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground">
          Five problem lanes, all operational — backed by real receipts.
        </h1>
        <p className="text-base text-muted-foreground max-w-3xl leading-relaxed">
          Every lane below is wired to a live backend endpoint that emits a hash-chained Doctrine V6
          receipt chain. Click <strong className="text-foreground">Run This Demo</strong> to mint a
          fresh chain. Receipts are deterministic — identical inputs produce identical chains.
        </p>
        <nav className="flex flex-wrap gap-1.5 pt-1" data-testid="warhacker-lane-nav">
          {[
            { n: 1, t: "Bundle stack" },
            { n: 2, t: "Health screening" },
            { n: 3, t: "Drone oversight" },
            { n: 4, t: "Trajectory" },
            { n: 5, t: "Edge drill" },
          ].map((l) => (
            <a
              key={l.n}
              href={`#lane-${l.n}`}
              className="px-2.5 py-1 rounded border border-border bg-card text-xs text-muted-foreground hover:text-foreground hover:border-primary/40"
            >
              Lane {l.n} · {l.t}
            </a>
          ))}
        </nav>
      </header>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-5" data-testid="warhacker-lanes">
        <Lane1 />
        <Lane2 />
        <Lane3 />
        <Lane4 />
        <Lane5 />
      </section>

      <section className="rounded-lg border border-border bg-card p-6 space-y-3">
        <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-mono">
          DOCS
        </div>
        <h2 className="text-lg font-semibold text-foreground">Hub paper trail</h2>
        <ul className="space-y-1.5 text-sm">
          <li>
            <a
              href="/docs/proposals/defense-unicorns/warhacker-2026-onepager.md"
              className="text-primary hover:underline"
            >
              warhacker-2026-onepager.md
            </a>{" "}
            <span className="text-muted-foreground">
              — printable one-pager: lane → artifacts → UDS bundles → Doctrine V6 receipt kinds.
            </span>
          </li>
          <li>
            <a
              href="/docs/proposals/defense-unicorns/warhacker-2026-readiness.md"
              className="text-primary hover:underline"
            >
              warhacker-2026-readiness.md
            </a>{" "}
            <span className="text-muted-foreground">
              — readiness checklist with route, backend dependency, and a real receipt sample per
              lane.
            </span>
          </li>
        </ul>
      </section>
    </div>
  );
}
