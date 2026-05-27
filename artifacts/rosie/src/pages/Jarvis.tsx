import { useEffect, useState } from "react";
import { Link } from "wouter";

/**
 * ROSIE Jarvis — the command surface over the entire SZL ecosystem.
 *
 * Single-call live overview of every product (vessels, a11oy, sentra,
 * conduit/amaru, the proof chain itself, and the UDS fleet) backed by
 * /api/rosie/jarvis/overview. The aggregator's contract is "always
 * render": each slice is `{status:'ok'|'degraded'}` so a single bad
 * data source never blanks the whole surface.
 *
 * No SSE here — the overview is a 10s-cacheable, single-shot snapshot.
 * Refresh button + 30s auto-poll keep it fresh without saturating DB.
 */

interface OverviewSliceDegraded {
  status: "degraded";
  error: string;
  fetchedInMs: number;
}
interface OverviewSliceOK<T> {
  status: "ok";
  data: T;
  fetchedInMs: number;
}
type Slice<T> = OverviewSliceOK<T> | OverviewSliceDegraded;

interface VesselsSlice {
  vesselCount: number;
  fleetCount: number;
  voyageCount: number;
  openExceptions: number;
  fleets: Array<{ id: number; name: string; status: string | null }>;
}
interface A11oySlice {
  proofPackets: number;
  executionTraces: number;
}
interface SentraSlice {
  totalAlerts: number;
  totalIncidents: number;
  alertsLast24h: number;
}
interface ConduitSlice {
  syncCount: number;
  recentRuns: Array<{ id: string; status: string | null; startedAt: string }>;
}
interface UdsSlice {
  bundleCount: number;
  slugs: string[];
  registryPath: string;
}
interface ProofChainSlice {
  totalReceipts: number;
  sealedLast24h: number;
  byProductKind: Array<{ product: string; kind: string; count: number }>;
  head: { id: string; product: string; kind: string; summary: string | null; ts: string } | null;
}

interface Overview {
  asOf: string;
  schemaVersion: string;
  ecosystem: {
    vessels: Slice<VesselsSlice>;
    a11oy: Slice<A11oySlice>;
    sentra: Slice<SentraSlice>;
    conduit: Slice<ConduitSlice>;
    uds: Slice<UdsSlice>;
    proofChain: Slice<ProofChainSlice>;
  };
  totals: {
    receipts: number;
    sealedLast24h: number;
    openIncidents: number;
    alertsLast24h: number;
    activeFleets: number;
    vesselCount: number;
    bundleCount: number;
  };
}

function sliceOK<T>(s: Slice<T> | undefined): s is OverviewSliceOK<T> {
  return !!s && s.status === "ok";
}

async function fetchOverview(signal: AbortSignal): Promise<Overview> {
  const res = await fetch("/api/rosie/jarvis/overview", { signal });
  if (!res.ok) throw new Error(`overview ${res.status}`);
  const json = await res.json();
  return (json && typeof json === "object" && "success" in json ? json.data : json) as Overview;
}

export default function Jarvis() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);

  useEffect(() => {
    let cancelled = false;
    const ctl = new AbortController();
    const load = async () => {
      try {
        const o = await fetchOverview(ctl.signal);
        if (!cancelled) {
          setOverview(o);
          setError(null);
          setLastFetched(new Date());
        }
      } catch (e) {
        if (!cancelled && (e as Error).name !== "AbortError") {
          setError((e as Error).message);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    const id = window.setInterval(load, 30_000);
    return () => {
      cancelled = true;
      ctl.abort();
      window.clearInterval(id);
    };
  }, []);

  if (loading && !overview) {
    return (
      <div className="rounded-lg border border-border bg-card p-10 text-center text-sm text-muted-foreground">
        Booting Jarvis…
      </div>
    );
  }
  if (error && !overview) {
    return (
      <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-10 text-sm">
        Jarvis overview unavailable: <span className="font-mono">{error}</span>
      </div>
    );
  }
  if (!overview) return null;

  const eco = overview.ecosystem;
  const t = overview.totals;
  const vessels = sliceOK(eco.vessels) ? eco.vessels.data : null;
  const a11oy = sliceOK(eco.a11oy) ? eco.a11oy.data : null;
  const sentra = sliceOK(eco.sentra) ? eco.sentra.data : null;
  const conduit = sliceOK(eco.conduit) ? eco.conduit.data : null;
  const uds = sliceOK(eco.uds) ? eco.uds.data : null;
  const proof = sliceOK(eco.proofChain) ? eco.proofChain.data : null;

  return (
    <div className="space-y-8">
      {/* Hero */}
      <header className="rounded-2xl border border-border bg-gradient-to-br from-card to-card/40 p-8">
        <div className="flex items-start justify-between gap-6 flex-wrap">
          <div>
            <div className="text-xs uppercase tracking-widest text-muted-foreground">
              ROSIE · Jarvis
            </div>
            <h1 className="mt-2 text-4xl font-semibold leading-tight">
              Governed command surface
              <span className="block text-xl font-normal text-muted-foreground">
                One pane across every product. Real receipts, real fleets, real alerts.
              </span>
            </h1>
          </div>
          <div className="text-right text-xs text-muted-foreground">
            <div>Schema v{overview.schemaVersion}</div>
            <div>As of {new Date(overview.asOf).toLocaleTimeString()}</div>
            {lastFetched && (
              <div className="mt-1 inline-flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-emerald-500" />
                live · 30s
              </div>
            )}
          </div>
        </div>
      </header>

      {/* KPI strip */}
      <section className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-7">
        <Kpi label="Total receipts" value={t.receipts.toLocaleString()} sub={`+${t.sealedLast24h} in 24h`} />
        <Kpi label="Vessels tracked" value={t.vesselCount.toLocaleString()} sub={`${t.activeFleets} fleets`} />
        <Kpi label="Open incidents" value={t.openIncidents.toLocaleString()} sub={`${t.alertsLast24h} alerts/24h`} />
        <Kpi label="UDS bundles" value={t.bundleCount.toLocaleString()} sub="signed + cosigned" />
        <Kpi
          label="A11oy proof packets"
          value={(a11oy?.proofPackets ?? 0).toLocaleString()}
          sub={`${a11oy?.executionTraces ?? 0} traces`}
          degraded={eco.a11oy.status === "degraded"}
        />
        <Kpi
          label="Conduit syncs"
          value={(conduit?.syncCount ?? 0).toLocaleString()}
          sub={`${conduit?.recentRuns.length ?? 0} recent runs`}
          degraded={eco.conduit.status === "degraded"}
        />
        <Kpi
          label="Vessel exceptions"
          value={(vessels?.openExceptions ?? 0).toLocaleString()}
          sub={`${vessels?.voyageCount ?? 0} voyages`}
          degraded={eco.vessels.status === "degraded"}
        />
      </section>

      {/* Command rail */}
      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <CommandCard
          title="Vessels — Maritime Intelligence"
          href="/vessels/"
          degraded={eco.vessels.status === "degraded"}
          rows={vessels ? [
            ["Vessels", vessels.vesselCount.toLocaleString()],
            ["Fleets", vessels.fleetCount.toLocaleString()],
            ["Voyages", vessels.voyageCount.toLocaleString()],
            ["Open exceptions", vessels.openExceptions.toLocaleString()],
          ] : []}
          footer={vessels?.fleets.slice(0, 4).map((f) => f.name).join(" · ") ?? "—"}
        />
        <CommandCard
          title="A11oy — Brand Orchestration"
          href="/a11oy/"
          degraded={eco.a11oy.status === "degraded"}
          rows={a11oy ? [
            ["Proof packets", a11oy.proofPackets.toLocaleString()],
            ["Execution traces", a11oy.executionTraces.toLocaleString()],
          ] : []}
          footer="Constitution-gated, Lutar v1–v11 + Λ₁₀"
        />
        <CommandCard
          title="Sentra — Cyber Resilience"
          href="/sentra/"
          degraded={eco.sentra.status === "degraded"}
          rows={sentra ? [
            ["Total alerts", sentra.totalAlerts.toLocaleString()],
            ["Alerts (24h)", sentra.alertsLast24h.toLocaleString()],
            ["Open incidents", sentra.totalIncidents.toLocaleString()],
          ] : []}
          footer="Detector framework · ML scoring · response queue"
        />
        <CommandCard
          title="Conduit — Andean Ouroboros"
          href="/conduit/"
          degraded={eco.conduit.status === "degraded"}
          rows={conduit ? [
            ["Configured syncs", conduit.syncCount.toLocaleString()],
            ["Recent runs", conduit.recentRuns.length.toLocaleString()],
          ] : []}
          footer={conduit?.recentRuns[0]
            ? `last: ${conduit.recentRuns[0].status ?? "—"} @ ${new Date(conduit.recentRuns[0].startedAt).toLocaleTimeString()}`
            : "—"}
        />
        <CommandCard
          title="UDS fleet"
          href={uds?.registryPath ?? "/api/uds/registry"}
          external
          degraded={eco.uds.status === "degraded"}
          rows={uds ? [
            ["Bundles", uds.bundleCount.toLocaleString()],
            ["Slugs", uds.slugs.join(" · ")],
          ] : []}
          footer="OCI · cosign-verified · /opt/<slug>/"
        />
        <CommandCard
          title="Proof chain"
          href="/proof"
          degraded={eco.proofChain.status === "degraded"}
          rows={proof ? [
            ["Total receipts", proof.totalReceipts.toLocaleString()],
            ["Sealed (24h)", proof.sealedLast24h.toLocaleString()],
            ["Head product/kind",
              proof.head ? `${proof.head.product}/${proof.head.kind}` : "—"],
          ] : []}
          footer={proof?.head ? proof.head.summary ?? proof.head.id : "—"}
        />
      </section>

      {/* Receipt-class breakdown */}
      {proof && proof.byProductKind.length > 0 && (
        <section className="rounded-xl border border-border bg-card p-6">
          <div className="text-xs uppercase tracking-widest text-muted-foreground">
            Receipt classes by product
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="py-2 pr-4">Product</th>
                  <th className="py-2 pr-4">Kind</th>
                  <th className="py-2 text-right">Count</th>
                </tr>
              </thead>
              <tbody>
                {proof.byProductKind
                  .slice()
                  .sort((a, b) => b.count - a.count)
                  .slice(0, 20)
                  .map((row, i) => (
                    <tr key={i} className="border-t border-border/60">
                      <td className="py-2 pr-4 font-mono text-xs">{row.product}</td>
                      <td className="py-2 pr-4 font-mono text-xs">{row.kind}</td>
                      <td className="py-2 text-right tabular-nums">{row.count.toLocaleString()}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Deep links into ROSIE proper */}
      <section className="rounded-xl border border-border bg-card p-6">
        <div className="text-xs uppercase tracking-widest text-muted-foreground">
          Jump into ROSIE
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <DeepLink href="/" title="Identity" caption="Editorial landing + live telemetry" />
          <DeepLink href="/optimizer" title="Optimizer" caption="Deterministic Ising solve (HITL)" />
          <DeepLink href="/fabric" title="Fabric" caption="3D ecosystem graph" />
          <DeepLink href="/research" title="Research" caption="arXiv + HuggingFace digest" />
          <DeepLink href="/proof" title="Proof chain" caption="SHA-256 receipt inspector" />
          <DeepLink href="/warhacker" title="Warhacker" caption="UDS compose · drone · health · capture" />
        </div>
      </section>
    </div>
  );
}

function Kpi({
  label,
  value,
  sub,
  degraded,
}: {
  label: string;
  value: string;
  sub: string;
  degraded?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border bg-card p-4 ${
        degraded ? "border-amber-500/40" : "border-border"
      }`}
    >
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-2 text-2xl font-semibold tabular-nums">{value}</div>
      <div className="text-xs text-muted-foreground">{sub}</div>
      {degraded && (
        <div className="mt-1 text-[10px] text-amber-500">degraded · cached</div>
      )}
    </div>
  );
}

function CommandCard({
  title,
  href,
  external,
  degraded,
  rows,
  footer,
}: {
  title: string;
  href: string;
  external?: boolean;
  degraded?: boolean;
  rows: Array<[string, string]>;
  footer: string;
}) {
  const body = (
    <div
      className={`group block h-full rounded-xl border bg-card p-5 transition hover:border-primary/40 ${
        degraded ? "border-amber-500/40" : "border-border"
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="text-sm font-semibold">{title}</div>
        <div className="text-[10px] text-muted-foreground group-hover:text-primary">
          {external ? "↗ open" : "open →"}
        </div>
      </div>
      <dl className="mt-4 space-y-1.5">
        {rows.length === 0 ? (
          <div className="text-xs text-muted-foreground">no data</div>
        ) : (
          rows.map(([k, v]) => (
            <div key={k} className="flex items-baseline justify-between gap-3 text-sm">
              <dt className="text-xs text-muted-foreground">{k}</dt>
              <dd className="font-mono text-xs">{v}</dd>
            </div>
          ))
        )}
      </dl>
      <div className="mt-4 truncate text-[11px] text-muted-foreground">{footer}</div>
    </div>
  );
  if (external) {
    return (
      <a href={href} target="_blank" rel="noreferrer">
        {body}
      </a>
    );
  }
  // Cross-artifact links (/vessels/, /sentra/, /a11oy/, /conduit/) escape
  // the rosie wouter base. Use a plain <a> so the browser does a full
  // navigation through the path-routed preview proxy.
  if (href.startsWith("/") && !["/optimizer", "/fabric", "/research", "/proof", "/warhacker", "/"].includes(href)) {
    return <a href={href}>{body}</a>;
  }
  return <Link href={href}>{body}</Link>;
}

function DeepLink({ href, title, caption }: { href: string; title: string; caption: string }) {
  return (
    <Link
      href={href}
      className="block rounded-lg border border-border bg-card p-4 transition hover:border-primary/40"
    >
      <div className="text-sm font-semibold">{title}</div>
      <div className="mt-1 text-xs text-muted-foreground">{caption}</div>
    </Link>
  );
}
