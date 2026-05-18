import { useEffect, useState } from 'react';
import { PageHeader } from '../components/PageHeader';

/**
 * a11oy / Ecosystem — unified board for the entire SZL Holdings organism.
 *
 * Round 4. Polls /api/ecosystem/snapshot every 30s. That single endpoint
 * fans out server-side to the 8 per-app ops-core snapshots + the
 * org-intelligence snapshot, so the client only makes one network call.
 *
 * Contract: { ecosystem_verdict, counts, apps[], org, notes }.
 * - apps[].verdict: OPERATIONAL | DEGRADED | UNREACHABLE
 * - org.repos[].verdict: OPERATIONAL | DAYLIGHT | THEATER | EVIDENCE_MISSING
 *
 * Drift posture: this page never hardcodes counts — every chip and badge
 * is computed from snapshot fields. Follow-up #5206 structural fix.
 */

const T = {
  bg: '#0b0d12', surface: '#12151c', surfaceHi: '#1a1f2a',
  border: '#2a313e', text: '#e6e9ef', dim: '#8b94a6',
  green: '#4ade80', amber: '#fbbf24', red: '#f87171', blue: '#60a5fa', purple: '#c4b5fd',
};

type AppVerdict = 'OPERATIONAL' | 'DEGRADED' | 'UNREACHABLE';
type RepoVerdict = 'OPERATIONAL' | 'DAYLIGHT' | 'THEATER' | 'EVIDENCE_MISSING';

interface AppCard {
  slug: string; title: string; anatomy: string;
  verdict: AppVerdict; label: string; detail: string;
  generated_at: string | null; ttl_seconds: number | null; http_code: number;
  evidence: { modules_total: number | null; modules_healthy: number | null; formula_count: number | null; doi_bindings: number | null } | null;
  _error?: string;
}
interface OrgRepoLite { slug: string; verdict: RepoVerdict; language: string | null; size_kb: number | null; }
interface OrgSummary {
  reachable: boolean; total: number; reachable_count: number;
  operational: number; daylight: number; theater_flags: number; evidence_missing: number;
  total_size_kb: number; languages: Record<string, number>;
  most_recently_pushed: string | null; listing_source: string | null;
  repos: OrgRepoLite[]; _error?: string;
}
interface EcoSnap {
  generated_at: string; ttl_seconds: number;
  ecosystem_verdict: AppVerdict;
  counts: {
    apps_total: number; apps_operational: number; apps_degraded: number; apps_unreachable: number;
    org_repos: number; org_operational: number; org_daylight: number; org_theater_flags: number; org_evidence_missing: number;
  };
  apps: AppCard[]; org: OrgSummary;
  notes: { provenance: string; cache_ttl_s: number; method_scope: string };
}

function appColor(v: AppVerdict): string { return v === 'OPERATIONAL' ? T.green : v === 'DEGRADED' ? T.amber : T.red; }
function repoColor(v: RepoVerdict): string { return v === 'OPERATIONAL' ? T.green : v === 'DAYLIGHT' ? T.amber : v === 'THEATER' ? T.red : T.dim; }

function relAge(iso: string | null): string {
  if (!iso) return '—';
  const ms = Date.now() - new Date(iso).getTime();
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.round(s / 60)}m ago`;
  if (s < 86400) return `${Math.round(s / 3600)}h ago`;
  return `${Math.round(s / 86400)}d ago`;
}

export default function Ecosystem() {
  const [snap, setSnap] = useState<EcoSnap | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<number>(Date.now());

  useEffect(() => {
    let cancelled = false;
    async function poll() {
      try {
        const r = await fetch('/api/ecosystem/snapshot', { cache: 'no-store' });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const j = await r.json();
        if (cancelled) return;
        setSnap(j); setError(null);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) { setLoading(false); setLastRefresh(Date.now()); }
      }
    }
    poll();
    const id = setInterval(poll, 30_000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  const counts = snap?.counts;
  const apps = snap?.apps ?? [];
  const org = snap?.org;
  const ecoVerdict = snap?.ecosystem_verdict ?? 'UNREACHABLE';

  return (
    <div style={{ background: T.bg, color: T.text, minHeight: '100vh', padding: '32px 24px' }}>
      <PageHeader
        eyebrow="A11OY · WHOLE ORGANISM · tukuy"
        title="Ecosystem"
        subtitle={`Unified board: ${counts?.apps_total ?? '—'} apps + ${org?.total ?? '—'} public org repos · polling every 30s · last refresh ${new Date(lastRefresh).toLocaleTimeString()}`}
      />

      {/* Top-level verdict + chip row — all live-computed */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 24 }}>
        <Stat label="Ecosystem verdict" value={ecoVerdict} accent={appColor(ecoVerdict)} />
        <Stat label="Apps operational" value={`${counts?.apps_operational ?? '—'} / ${counts?.apps_total ?? '—'}`} accent={(counts && counts.apps_operational === counts.apps_total) ? T.green : T.amber} />
        <Stat label="Apps degraded" value={String(counts?.apps_degraded ?? 0)} accent={(counts?.apps_degraded ?? 0) > 0 ? T.amber : T.dim} />
        <Stat label="Apps unreachable" value={String(counts?.apps_unreachable ?? 0)} accent={(counts?.apps_unreachable ?? 0) > 0 ? T.red : T.dim} />
        <Stat label="Org repos audited" value={String(counts?.org_repos ?? '—')} accent={T.blue} />
        <Stat label="Org operational" value={String(counts?.org_operational ?? 0)} accent={T.green} />
        <Stat label="Org daylight" value={String(counts?.org_daylight ?? 0)} accent={T.amber} />
        <Stat label="Org theater flags" value={String(counts?.org_theater_flags ?? 0)} accent={(counts?.org_theater_flags ?? 0) > 0 ? T.red : T.dim} />
      </div>

      {loading && (
        <div style={{ color: T.dim, padding: 24, textAlign: 'center' }}>Loading ecosystem snapshot…</div>
      )}

      {error && !snap && (
        <div style={{ padding: 16, background: T.surface, border: `1px solid ${T.red}55`, borderRadius: 8, color: T.red, marginBottom: 24 }}>
          <strong>Endpoint error:</strong> {error}
          <div style={{ marginTop: 6, color: T.dim, fontSize: 12 }}>
            <code style={{ color: T.text }}>/api/ecosystem/snapshot</code> did not return a usable payload. Re-poll in 30s.
          </div>
        </div>
      )}

      {/* Section 1: per-app surfaces */}
      {snap && (
        <>
          <SectionHead title="Vertical surfaces · per-app ops-core" subtitle={`${apps.length} product verticals · live fanout to /api/{slug}/ops-core/snapshot`} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 16, marginBottom: 32 }}>
            {apps.map(a => (
              <div key={a.slug} style={{
                background: T.surface, border: `1px solid ${T.border}`, borderLeft: `4px solid ${appColor(a.verdict)}`,
                borderRadius: 8, padding: 16,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>{a.title}</div>
                  <div style={{ fontSize: 11, color: T.dim }}>{a.anatomy}</div>
                </div>
                <div style={{
                  display: 'inline-block', fontSize: 10, padding: '2px 8px', borderRadius: 4,
                  color: appColor(a.verdict), background: `${appColor(a.verdict)}1a`,
                  border: `1px solid ${appColor(a.verdict)}55`, marginBottom: 8,
                }}>{a.verdict} · {a.label}</div>
                <div style={{ fontSize: 12, color: T.dim, lineHeight: 1.5, marginBottom: 8 }}>{a.detail}</div>
                {a.evidence && (
                  <div style={{ fontSize: 11, color: T.dim, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 4 }}>
                    <span>modules: <strong style={{ color: T.text }}>{a.evidence.modules_healthy}/{a.evidence.modules_total}</strong></span>
                    <span>formula: <strong style={{ color: T.text }}>{a.evidence.formula_count ?? '—'}</strong></span>
                    <span>DOIs: <strong style={{ color: T.text }}>{a.evidence.doi_bindings ?? '—'}</strong></span>
                    <span>age: <strong style={{ color: T.text }}>{relAge(a.generated_at)}</strong></span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Section 2: public org repos */}
          <SectionHead title={`Public org · ${org?.total ?? '—'} GitHub repos`} subtitle={`live from /api/org-intelligence/snapshot · source: ${org?.listing_source ?? '—'} · most recent push: ${org?.most_recently_pushed ?? '—'}`} />
          {!org?.reachable && (
            <div style={{ padding: 12, background: T.surface, border: `1px solid ${T.red}55`, borderRadius: 6, color: T.red, marginBottom: 12 }}>
              org-intelligence unreachable · {org?._error}
            </div>
          )}
          {org?.reachable && (
            <div style={{
              background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, marginBottom: 32,
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 8 }}>
                {org.repos.map(r => (
                  <div key={r.slug} style={{
                    background: T.surfaceHi, border: `1px solid ${T.border}`, borderLeft: `3px solid ${repoColor(r.verdict)}`,
                    borderRadius: 4, padding: '8px 12px',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
                      <span style={{ fontWeight: 500 }}>{r.slug}</span>
                      <span style={{ fontSize: 10, color: repoColor(r.verdict), padding: '1px 6px', borderRadius: 3, background: `${repoColor(r.verdict)}1a`, border: `1px solid ${repoColor(r.verdict)}55` }}>{r.verdict.slice(0, 3)}</span>
                    </div>
                    <div style={{ fontSize: 11, color: T.dim, marginTop: 2 }}>{r.language ?? '—'} · {r.size_kb ? `${r.size_kb} KB` : '—'}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 12, fontSize: 11, color: T.dim, borderTop: `1px solid ${T.border}`, paddingTop: 8 }}>
                Languages: {Object.entries(org.languages).map(([k, v]) => `${k}(${v})`).join(' · ')} · Total size: {org.total_size_kb.toLocaleString()} KB
              </div>
            </div>
          )}

          {/* Section 3: provenance / drift hygiene */}
          <SectionHead title="Provenance & cache hygiene" subtitle="how this board is built — auditable in one place" />
          <div style={{
            background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, fontSize: 12, color: T.dim, lineHeight: 1.6,
          }}>
            <div><strong style={{ color: T.text }}>Cache TTL:</strong> {snap.notes.cache_ttl_s}s server-side.</div>
            <div><strong style={{ color: T.text }}>Method scope:</strong> {snap.notes.method_scope}</div>
            <div style={{ marginTop: 6 }}>{snap.notes.provenance}</div>
            <div style={{ marginTop: 6 }}>Snapshot generated at <code style={{ color: T.text }}>{snap.generated_at}</code>.</div>
          </div>
        </>
      )}
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderLeft: `3px solid ${accent}`, borderRadius: 6, padding: '12px 16px' }}>
      <div style={{ fontSize: 11, color: T.dim, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 600, color: accent }}>{value}</div>
    </div>
  );
}

function SectionHead({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>{title}</div>
      <div style={{ fontSize: 12, color: T.dim }}>{subtitle}</div>
    </div>
  );
}
