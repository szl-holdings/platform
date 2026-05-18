import { useEffect, useState } from 'react';
import { PageHeader } from '../components/ui';

/**
 * OperationalStatus — investor-grade cross-app health board.
 *
 * Polls every Series-A vertical's `/api/{app}/ops-core/snapshot` endpoint
 * (all are public, auth-opportunistic, ~30s TTL cached server-side) and
 * renders a single board showing module health, anatomy region, doctrine
 * version, and DOI bindings for each app.
 *
 * This is the canonical "everything we have, in one place" view referenced
 * in the Series A operational thesis: the BRAIN console showing every limb
 * of the anatomy (HEART / HANDS / FEET / WIRES / BRAIN / IMMUNE SYSTEM /
 * VOICE / MEMORY / HEARTBEAT / LEGAL CORTEX / GROUNDED ORGAN).
 */

const APPS = [
  { slug: 'vessels',    accent: '#60a5fa' },
  { slug: 'sentra',     accent: '#e05252' },
  { slug: 'amaru',      accent: '#4ade80' },
  { slug: 'counsel',    accent: '#c9b787' },
  { slug: 'carlota-jo', accent: '#f59e0b' },
  { slug: 'pulse',      accent: '#a78bfa' },
  { slug: 'lexicon',    accent: '#22d3ee' },
  { slug: 'terra',      accent: '#84cc16' },
] as const;

const T = {
  bg: '#0a0a0a',
  surface: 'rgba(255,255,255,0.025)',
  surfaceHi: 'rgba(255,255,255,0.05)',
  border: 'rgba(255,255,255,0.08)',
  text: '#f5f5f5',
  dim: '#8a8a8a',
  muted: '#5e5e5e',
  green: '#4ade80',
  amber: '#f59e0b',
  red: '#e05252',
};

interface Snapshot {
  product?: { slug?: string; title?: string; stage?: string };
  anatomy_region?: { region?: string; quechua?: string; meaning?: string };
  doctrine?: { version?: string };
  b3_modules?: { total?: number; healthy?: number; probed?: number; items?: Array<{ id: string; name: string; ok: boolean; mounted: boolean; description?: string; probe_path?: string | null }> };
  b5_doi_bindings?: Array<{ zenodo_id: string; label: string; url: string }>;
  known_gaps?: Array<{ id: string; severity: string; detail: string }>;
  generated_at?: string;
  ttl_seconds?: number;
}

interface AppState {
  slug: string;
  accent: string;
  status: 'loading' | 'ok' | 'error';
  snap?: Snapshot;
  error?: string;
  age_ms?: number;
}

function healthColor(healthy: number, total: number): string {
  if (total === 0) return T.muted;
  const ratio = healthy / total;
  if (ratio >= 1) return T.green;
  if (ratio >= 0.6) return T.amber;
  return T.red;
}

export default function OperationalStatus() {
  const [apps, setApps] = useState<AppState[]>(() =>
    APPS.map((a) => ({ slug: a.slug, accent: a.accent, status: 'loading' as const }))
  );
  const [lastRefresh, setLastRefresh] = useState<number>(Date.now());

  useEffect(() => {
    let cancelled = false;

    async function pollOne(slug: string): Promise<{ snap?: Snapshot; error?: string }> {
      try {
        const started = Date.now();
        const r = await fetch(`/api/${slug}/ops-core/snapshot`, { cache: 'no-store' });
        if (!r.ok) return { error: `HTTP ${r.status}` };
        const snap: Snapshot = await r.json();
        void started;
        return { snap };
      } catch (e) {
        return { error: e instanceof Error ? e.message : String(e) };
      }
    }

    async function pollAll() {
      const results = await Promise.all(APPS.map((a) => pollOne(a.slug).then((r) => ({ a, r }))));
      if (cancelled) return;
      setApps(
        results.map(({ a, r }) => ({
          slug: a.slug,
          accent: a.accent,
          status: r.snap ? ('ok' as const) : ('error' as const),
          snap: r.snap,
          error: r.error,
          age_ms: r.snap?.generated_at ? Date.now() - Date.parse(r.snap.generated_at) : undefined,
        }))
      );
      setLastRefresh(Date.now());
    }

    pollAll();
    const id = setInterval(pollAll, 30_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const totalApps = apps.length;
  const okApps = apps.filter((a) => a.status === 'ok').length;
  const totalModules = apps.reduce((acc, a) => acc + (a.snap?.b3_modules?.total ?? 0), 0);
  const healthyModules = apps.reduce((acc, a) => acc + (a.snap?.b3_modules?.healthy ?? 0), 0);

  return (
    <>
      <div style={{ background: T.bg, color: T.text, minHeight: '100vh', padding: '32px 24px' }}>
        <PageHeader
          eyebrow="A11OY · BRAIN CONSOLE"
          title="Operational Status"
          subtitle={`Live cross-app health board · polling every 30s · last refresh ${new Date(lastRefresh).toLocaleTimeString()}`}
        />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginBottom: 24 }}>
          <StatTile label="Verticals online" value={`${okApps} / ${totalApps}`} accent={okApps === totalApps ? T.green : T.amber} />
          <StatTile label="Modules healthy" value={`${healthyModules} / ${totalModules}`} accent={healthColor(healthyModules, totalModules)} />
          <StatTile label="Anatomy regions covered" value={String(new Set(apps.map((a) => a.snap?.anatomy_region?.region).filter(Boolean)).size)} accent="#c9b787" />
          <StatTile label="DOI bindings" value={String(apps.reduce((acc, a) => acc + (a.snap?.b5_doi_bindings?.length ?? 0), 0))} accent="#a78bfa" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: 16 }}>
          {apps.map((app) => (
            <AppCard key={app.slug} app={app} />
          ))}
        </div>

        <div style={{ marginTop: 32, padding: 16, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 12, color: T.dim, lineHeight: 1.6 }}>
          <div style={{ color: T.text, fontWeight: 600, marginBottom: 8 }}>About this board</div>
          Every tile above is a live read of the corresponding app's <code style={{ color: T.text }}>/api/&#123;app&#125;/ops-core/snapshot</code> endpoint. All eight endpoints are public, anonymous-readable, ~30s server-cached, and emit module-mount counts only — no PII, no row contents. Mutations on the same path return 403. This is the surface investors and consumers can walk without an account; see <code style={{ color: T.text }}>dossier/series-a-operational/PUBLIC_AUDIT_2026-05-18.md</code> for the canonical audit.
        </div>
      </div>
    </>
  );
}

function StatTile({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div style={{ padding: 14, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8 }}>
      <div style={{ fontSize: 11, color: T.dim, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
      <div style={{ fontSize: 24, color: accent, fontWeight: 600, marginTop: 4 }}>{value}</div>
    </div>
  );
}

function AppCard({ app }: { app: AppState }) {
  const snap = app.snap;
  const modules = snap?.b3_modules;
  const ageS = app.age_ms !== undefined ? Math.round(app.age_ms / 1000) : null;

  return (
    <div style={{ padding: 16, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, borderLeft: `3px solid ${app.accent}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: T.text }}>{snap?.product?.title ?? app.slug}</div>
        <div style={{ fontSize: 11, color: app.status === 'ok' ? T.green : app.status === 'error' ? T.red : T.dim }}>
          {app.status === 'ok' ? '● live' : app.status === 'error' ? '○ error' : '… loading'}
        </div>
      </div>
      <div style={{ fontSize: 11, color: T.dim, marginBottom: 12 }}>
        /api/{app.slug}/ops-core/snapshot {ageS !== null ? `· generated ${ageS}s ago` : ''}
      </div>

      {snap?.anatomy_region?.region && (
        <div style={{ fontSize: 11, color: T.dim, marginBottom: 4 }}>
          <span style={{ color: T.text }}>{snap.anatomy_region.region}</span>
          {snap.anatomy_region.quechua && <> · Quechua: <em style={{ color: app.accent }}>{snap.anatomy_region.quechua}</em></>}
          {snap.anatomy_region.meaning && <> · {snap.anatomy_region.meaning}</>}
        </div>
      )}

      {snap?.doctrine?.version && (
        <div style={{ fontSize: 11, color: T.dim, marginBottom: 10 }}>
          Doctrine <span style={{ color: T.text }}>{snap.doctrine.version}</span>
        </div>
      )}

      {modules && (
        <div style={{ marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: T.dim, marginBottom: 6 }}>
            <span>Modules</span>
            <span style={{ color: healthColor(modules.healthy ?? 0, modules.total ?? 0) }}>{modules.healthy} / {modules.total} healthy</span>
          </div>
          <div style={{ display: 'flex', gap: 2 }}>
            {(modules.items ?? []).map((m) => (
              <div
                key={m.id}
                title={`${m.name} — ${m.ok ? 'ok' : 'down'}${m.probe_path ? ' · probed' : ''}`}
                style={{
                  flex: 1,
                  height: 6,
                  background: !m.mounted ? T.muted : m.ok ? T.green : T.red,
                  opacity: m.probe_path ? 1 : 0.5,
                  borderRadius: 2,
                }}
              />
            ))}
          </div>
        </div>
      )}

      {snap?.known_gaps && snap.known_gaps.length > 0 && (
        <div style={{ marginTop: 8, padding: 8, background: T.surfaceHi, border: `1px solid ${T.amber}33`, borderRadius: 4 }}>
          {snap.known_gaps.map((g) => (
            <div key={g.id} style={{ fontSize: 11, color: T.amber }}>
              ⚠ <strong>{g.severity}</strong> · {g.detail}
            </div>
          ))}
        </div>
      )}

      {snap?.b5_doi_bindings && snap.b5_doi_bindings.length > 0 && (
        <div style={{ marginTop: 8, fontSize: 10, color: T.muted }}>
          DOI: {snap.b5_doi_bindings.map((d, i) => (
            <span key={d.zenodo_id}>
              {i > 0 && ' · '}
              <a href={d.url} target="_blank" rel="noreferrer" style={{ color: T.dim, textDecoration: 'none' }}>{d.label}</a>
            </span>
          ))}
        </div>
      )}

      {app.error && <div style={{ fontSize: 11, color: T.red, marginTop: 8 }}>error: {app.error}</div>}
    </div>
  );
}
