import { useStandardQuery } from '@szl-holdings/api-client-react';
import { Badge } from '@szl-holdings/shared-ui/ui/badge';
import { Button } from '@szl-holdings/shared-ui/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@szl-holdings/shared-ui/ui/card';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Gauge,
  Loader2,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Sigma,
  XCircle,
} from 'lucide-react';

/**
 * Vessels — Operational Core (Series A executive surface).
 *
 * Single source-of-truth dashboard that pulls /api/vessels/ops-core/snapshot
 * (org-scoped, 30s in-process cache) and renders every Series A claim
 * Vessels makes with its proof binding right next to it.
 *
 * Six sections (parity with SZL Operational Core):
 *   B1 — Formula thesis pillars (Λ composite, drift, closure, voyage MC)
 *   B2 — Live persisted counts (anomalies, risk history, vessels under
 *        surveillance) — org-scoped via session
 *   B3 — Module health: every vessels-* sub-router mounted on api-server
 *   B4 — Inherited mechanisms: the six machine-verified primitives, each
 *        with its Vessels-specific instantiation
 *   B5 — DOI proof bindings (live links to Zenodo records)
 *   B6 — Doctrine: author byline, ban-list v6
 *
 * Read-only. Refreshes every 30s. No mocked data.
 *
 * Author canon: Stephen P. Lutar Jr. — Doctrine v6 bans the prior byline.
 * doctrine-scanner-exempt: historical note referencing banned token.
 */

type ModuleProbe = {
  id: string;
  name: string;
  description: string;
  probe_path: string | null;
  mounted: boolean;
  http_code: number | null;
  ok: boolean;
};

type Snapshot = {
  generated_at: string;
  ttl_seconds: number;
  product: { slug: string; title: string; stage: string };
  author: { name: string; email: string; orcid: string; orcid_url: string };
  doctrine: { version: string; ban_list: string[]; byline_rule: string };
  b1_formula_pillars: {
    source: string;
    items: Array<{ id: string; label: string; expression: string; thesisRef: string }>;
  };
  b2_live_counts: {
    db_ok: boolean;
    org_scoped: boolean;
    anomalies_total: number;
    anomalies_open: number;
    anomalies_by_severity: Array<{ severity: string; n: number }>;
    risk_history_rows: number;
    vessels_under_risk_surveillance: number;
  };
  b3_modules: { total: number; healthy: number; probed: number; items: ModuleProbe[] };
  b4_mechanisms: Array<{ num: string; title: string; inherited_as: string; url: string }>;
  b5_doi_bindings: Array<{ zenodo_id: string; kind: string; title: string; url: string }>;
};

function moduleStatusBadge(m: ModuleProbe) {
  if (m.probe_path === null) {
    return (
      <Badge variant="outline" className="text-[10px] font-mono text-slate-400 border-slate-600">
        mounted
      </Badge>
    );
  }
  if (m.ok) {
    return (
      <Badge variant="outline" className="text-[10px] font-mono text-emerald-300 border-emerald-700 bg-emerald-950/30">
        <CheckCircle2 className="w-3 h-3 mr-1" /> {m.http_code}
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="text-[10px] font-mono text-red-300 border-red-700 bg-red-950/30">
      <XCircle className="w-3 h-3 mr-1" /> {m.http_code ?? 'fail'}
    </Badge>
  );
}

function fmtAge(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(ms) || ms < 0) return '—';
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s ago`;
  return `${Math.round(s / 60)}m ago`;
}

export default function VesselsOperationalCore() {
  const q = useStandardQuery<Snapshot>({
    queryKey: ['vessels-ops-core-snapshot'],
    queryFn: async () => {
      const r = await fetch('/api/vessels/ops-core/snapshot', { credentials: 'include' });
      if (!r.ok) {
        const txt = await r.text().catch(() => '');
        let msg = `HTTP ${r.status}`;
        try {
          const j = JSON.parse(txt);
          if (typeof j?.message === 'string') msg = j.message;
          else if (typeof j?.error === 'string') msg = j.error;
        } catch { /* keep */ }
        throw new Error(msg);
      }
      return (await r.json()) as Snapshot;
    },
    refetchInterval: 30_000,
    staleTime: 15_000,
  });

  const snap = q.data;

  return (
    <div className="p-6 space-y-6 max-w-[1500px] mx-auto">
      {/* Header */}
      <header className="flex items-start justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
            <Gauge className="w-6 h-6 text-amber-400" />
            Vessels Operational Core
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-3xl">
            Series A executive surface — live module health, formula pillars,
            doctrine inheritance, and DOI proof bindings for{' '}
            <span className="text-slate-200">Vessels — Maritime Intelligence</span>.
            Every claim on this page is bound to its proof artifact. No mocks.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {snap && (
            <span className="text-[10px] font-mono text-slate-500">
              gen {fmtAge(snap.generated_at)} · ttl {snap.ttl_seconds}s
            </span>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => q.refetch()}
            disabled={q.isFetching}
            data-testid="vessels-ops-core-refresh"
          >
            {q.isFetching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            <span className="ml-1.5">Refresh</span>
          </Button>
        </div>
      </header>

      {q.isLoading && (
        <div className="text-sm text-slate-400 flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading snapshot…
        </div>
      )}
      {q.error && !snap && (
        <Card className="border-red-800 bg-red-950/20">
          <CardContent className="p-4 text-sm">
            <p className="font-semibold text-red-300">Snapshot fetch failed</p>
            <p className="text-xs text-red-200/70 mt-1">
              {q.error instanceof Error ? q.error.message : 'unknown'}
            </p>
          </CardContent>
        </Card>
      )}

      {snap && (
        <>
          {/* KPI strip */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <KpiTile label="Modules healthy" value={`${snap.b3_modules.healthy} / ${snap.b3_modules.total}`} accent="emerald" />
            <KpiTile label="Anomalies open" value={snap.b2_live_counts.anomalies_open} accent={snap.b2_live_counts.anomalies_open > 0 ? 'amber' : 'slate'} />
            <KpiTile label="Risk history rows" value={snap.b2_live_counts.risk_history_rows} accent="slate" />
            <KpiTile label="Vessels under surveillance" value={snap.b2_live_counts.vessels_under_risk_surveillance} accent="slate" />
            <KpiTile label="Formula pillars" value={snap.b1_formula_pillars.items.length} accent="amber" />
          </div>

          {/* Author + doctrine strip */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <Card className="bg-slate-900/40 border-slate-800">
              <CardContent className="p-3">
                <p className="text-[10px] uppercase tracking-wider text-slate-500">Product</p>
                <p className="font-semibold mt-1 text-slate-100">{snap.product.title}</p>
                <Badge variant="outline" className="mt-1 text-[10px] border-amber-700 text-amber-300 bg-amber-950/20">
                  {snap.product.stage}
                </Badge>
              </CardContent>
            </Card>
            <Card className="bg-slate-900/40 border-slate-800">
              <CardContent className="p-3">
                <p className="text-[10px] uppercase tracking-wider text-slate-500">Author</p>
                <p className="font-semibold mt-1 text-slate-100">{snap.author.name}</p>
                <p className="text-slate-400">{snap.author.email}</p>
                <a className="text-amber-400 hover:underline inline-flex items-center gap-1 mt-1" href={snap.author.orcid_url} target="_blank" rel="noreferrer">
                  ORCID {snap.author.orcid} <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </CardContent>
            </Card>
            <Card className="bg-slate-900/40 border-slate-800">
              <CardContent className="p-3">
                <p className="text-[10px] uppercase tracking-wider text-slate-500">
                  Doctrine {snap.doctrine.version} · ban-list
                </p>
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {snap.doctrine.ban_list.map((b) => (
                    <Badge key={b} variant="outline" className="text-[10px] font-mono border-red-800 text-red-300 bg-red-950/20">
                      {b}
                    </Badge>
                  ))}
                </div>
                <p className="text-[10px] text-slate-500 mt-2">{snap.doctrine.byline_rule}</p>
              </CardContent>
            </Card>
          </div>

          {/* B1 Formula pillars */}
          <Section title="B1 · Formula Thesis Pillars" count={snap.b1_formula_pillars.items.length}>
            <p className="text-[11px] text-slate-500 font-mono mb-2">
              live from {snap.b1_formula_pillars.source}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {snap.b1_formula_pillars.items.map((f) => (
                <Card key={f.id} className="bg-slate-900/40 border-slate-800">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Sigma className="w-3.5 h-3.5 text-amber-400" />
                      <p className="text-sm font-semibold text-slate-100">{f.label}</p>
                    </div>
                    <code className="block text-[11px] font-mono text-slate-300 bg-black/40 p-2 rounded mt-1">
                      {f.expression}
                    </code>
                    <p className="text-[10px] text-slate-500 mt-1 font-mono">{f.thesisRef}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </Section>

          {/* B2 Live counts */}
          <Section title="B2 · Live Persisted State" count={snap.b2_live_counts.anomalies_total}>
            {!snap.b2_live_counts.db_ok && (
              <Card className="border-amber-800 bg-amber-950/20 mb-3">
                <CardContent className="p-3 text-xs text-amber-200 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" /> Database query failed for this section.
                </CardContent>
              </Card>
            )}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Card className="bg-slate-900/40 border-slate-800">
                <CardHeader className="pb-2"><CardTitle className="text-xs text-slate-400 font-mono">Anomalies</CardTitle></CardHeader>
                <CardContent className="text-xs space-y-1">
                  <p className="text-slate-200">total: <span className="font-mono">{snap.b2_live_counts.anomalies_total}</span></p>
                  <p className="text-slate-200">open: <span className="font-mono">{snap.b2_live_counts.anomalies_open}</span></p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {snap.b2_live_counts.anomalies_by_severity.map((s) => (
                      <Badge key={s.severity} variant="outline" className="text-[10px] font-mono border-slate-700 text-slate-300">
                        {s.severity}: {s.n}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-slate-900/40 border-slate-800">
                <CardHeader className="pb-2"><CardTitle className="text-xs text-slate-400 font-mono">Risk History</CardTitle></CardHeader>
                <CardContent className="text-xs space-y-1">
                  <p className="text-slate-200">persisted rows: <span className="font-mono">{snap.b2_live_counts.risk_history_rows}</span></p>
                  <p className="text-slate-500 text-[10px]">org-scoped: {snap.b2_live_counts.org_scoped ? 'yes' : 'no'}</p>
                </CardContent>
              </Card>
              <Card className="bg-slate-900/40 border-slate-800">
                <CardHeader className="pb-2"><CardTitle className="text-xs text-slate-400 font-mono">Surveillance</CardTitle></CardHeader>
                <CardContent className="text-xs">
                  <p className="text-slate-200">vessels under risk: <span className="font-mono">{snap.b2_live_counts.vessels_under_risk_surveillance}</span></p>
                </CardContent>
              </Card>
            </div>
          </Section>

          {/* B3 Modules */}
          <Section title="B3 · Module Health" count={snap.b3_modules.total}>
            <p className="text-[11px] text-slate-500 mb-2">
              {snap.b3_modules.healthy} of {snap.b3_modules.total} healthy · {snap.b3_modules.probed} actively probed
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {snap.b3_modules.items.map((m) => (
                <Card key={m.id} className="bg-slate-900/40 border-slate-800">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-mono text-sm text-slate-200">vessels-{m.id}</p>
                      {moduleStatusBadge(m)}
                    </div>
                    <p className="text-[11px] text-slate-400">{m.description}</p>
                    {m.probe_path && (
                      <p className="text-[10px] text-slate-600 font-mono mt-1 truncate">probe: /api{m.probe_path}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </Section>

          {/* B4 Mechanisms */}
          <Section title="B4 · Inherited Mechanisms" count={snap.b4_mechanisms.length}>
            <p className="text-[11px] text-slate-500 mb-2">
              The six machine-verified primitives every SZL domain surface inherits, with the
              Vessels-specific instantiation.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {snap.b4_mechanisms.map((m) => (
                <a
                  key={m.num}
                  href={m.url}
                  target="_blank"
                  rel="noreferrer"
                  className="block"
                >
                  <Card className="bg-slate-900/40 border-slate-800 hover:border-amber-700 transition-colors">
                    <CardContent className="p-3 flex items-start gap-3">
                      <ShieldCheck className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm text-slate-100">
                          <span className="font-mono text-slate-500 mr-2">{m.num}</span>{m.title}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">→ {m.inherited_as}</p>
                      </div>
                    </CardContent>
                  </Card>
                </a>
              ))}
            </div>
          </Section>

          {/* B5 DOI bindings */}
          <Section title="B5 · DOI Proof Bindings" count={snap.b5_doi_bindings.length}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {snap.b5_doi_bindings.map((d) => (
                <a key={d.zenodo_id} href={d.url} target="_blank" rel="noreferrer" className="block">
                  <Card className="bg-slate-900/40 border-slate-800 hover:border-amber-700 transition-colors">
                    <CardContent className="p-3">
                      <p className="text-[10px] font-mono text-slate-500">
                        10.5281/zenodo.{d.zenodo_id} · {d.kind}
                      </p>
                      <p className="text-sm text-slate-100 mt-1">{d.title}</p>
                    </CardContent>
                  </Card>
                </a>
              ))}
            </div>
          </Section>

          <footer className="text-[10px] font-mono text-slate-600 text-center pt-4 border-t border-slate-800 flex items-center justify-center gap-2">
            <Activity className="w-3 h-3" />
            snapshot ttl {snap.ttl_seconds}s · generated {snap.generated_at}
            {!snap.b2_live_counts.org_scoped && (
              <span className="text-amber-400 ml-2 inline-flex items-center gap-1">
                <ShieldAlert className="w-3 h-3" /> not org-scoped
              </span>
            )}
          </footer>
        </>
      )}
    </div>
  );
}

function KpiTile({ label, value, accent }: { label: string; value: string | number; accent: 'emerald' | 'amber' | 'slate' }) {
  const cls = accent === 'emerald'
    ? 'border-emerald-800 bg-emerald-950/20 text-emerald-300'
    : accent === 'amber'
      ? 'border-amber-800 bg-amber-950/20 text-amber-300'
      : 'border-slate-800 bg-slate-900/40 text-slate-200';
  return (
    <Card className={cls}>
      <CardContent className="p-3">
        <p className="text-[10px] uppercase tracking-wider opacity-70">{label}</p>
        <p className="text-2xl font-mono mt-1">{value}</p>
      </CardContent>
    </Card>
  );
}

function Section({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-sm font-semibold text-slate-200 mb-3 flex items-center gap-2 pb-2 border-b border-slate-800">
        {title}
        <span className="text-[10px] font-mono text-slate-500">· {count}</span>
      </h2>
      {children}
    </section>
  );
}
