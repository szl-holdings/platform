import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Layout } from '../../components/layout';
import { PageHeader, Card, KpiCard, SectionTitle } from '../../components/ui';
import { useApiData } from '../../hooks/useApiData';

const BASE = (import.meta.env.BASE_URL ?? '/').replace(/\/$/, '');
const API_BASE = `${BASE}/api/a11oy`;
const link = (path: string) => `${BASE}${path}`;

const GOLD = '#c9b787';
const T = {
  surface: 'rgba(255,255,255,0.025)',
  border: 'rgba(255,255,255,0.08)',
  text: '#f5f5f5',
  textDim: '#8a8a8a',
  textMuted: '#5e5e5e',
};

interface Template {
  slug: string;
  name: string;
  description: string;
  industry: string;
  origin: string;
  tags: string[];
  created_at: string;
}

interface StatusPayload { evolveEnabled?: boolean }
interface InstantiateState { slug: string; loading: boolean; error: string | null; createdSlug: string | null }

export function OrchestratorLibrary() {
  const [, navigate] = useLocation();
  const { data: status } = useApiData<StatusPayload>('/orchestrator/status');
  const { data, loading, error } = useApiData<{ templates: Template[]; total: number; note?: string }>('/orchestrator/templates');
  const [state, setState] = useState<Record<string, InstantiateState>>({});

  const templates = data?.templates ?? [];
  const evolveEnabled = status?.evolveEnabled !== false;

  async function instantiate(tpl: Template) {
    const suggested = tpl.slug.replace(/^tpl-/, '') + '-' + Math.random().toString(36).slice(2, 6);
    const targetSlug = window.prompt(
      `Instantiate "${tpl.name}" as a new draft pack.\n\nEnter a unique slug (lowercase, alphanumeric + hyphens):`,
      suggested,
    );
    if (!targetSlug) return;
    setState(prev => ({ ...prev, [tpl.slug]: { slug: tpl.slug, loading: true, error: null, createdSlug: null } }));
    try {
      const resp = await fetch(`${API_BASE}/orchestrator/templates/${tpl.slug}/instantiate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ targetSlug: targetSlug.trim() }),
      });
      const body = await resp.json().catch(() => ({})) as { ok?: boolean; error?: string; data?: { slug?: string } };
      if (!resp.ok || !body.ok) {
        setState(prev => ({ ...prev, [tpl.slug]: { slug: tpl.slug, loading: false, error: body.error ?? `Request failed (${resp.status})`, createdSlug: null } }));
      } else {
        setState(prev => ({ ...prev, [tpl.slug]: { slug: tpl.slug, loading: false, error: null, createdSlug: body.data?.slug ?? targetSlug } }));
      }
    } catch {
      setState(prev => ({ ...prev, [tpl.slug]: { slug: tpl.slug, loading: false, error: 'Network error', createdSlug: null } }));
    }
  }

  return (
    <Layout>
      <PageHeader
        label="VERTICAL ORCHESTRATOR · LIBRARY"
        title="Pack Library"
        subtitle="Archived-vertical blueprints. Instantiate one to materialize a new draft pack, then route it through the standard approval flow."
        status={evolveEnabled ? 'LIVE' : 'GATED'}
      />

      {!evolveEnabled && (
        <Card>
          <div className="text-xs p-4" style={{ color: '#f97316' }}>
            Evolve features are disabled in this environment. Reads work, but instantiating a template requires <code>A11OY_ORCHESTRATOR_EVOLVE_ENABLED=true</code>.
          </div>
        </Card>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-6">
        <KpiCard label="TEMPLATES" value={templates.length} sub="archived verticals" accent={GOLD} />
        <KpiCard label="ORIGIN" value={templates.length > 0 ? 'archived' : '—'} sub="provenance" accent={GOLD} />
        <KpiCard label="EVOLVE FLAG" value={evolveEnabled ? 'ON' : 'OFF'} sub="A11OY_ORCHESTRATOR_EVOLVE_ENABLED" accent={evolveEnabled ? '#22c55e' : '#ef4444'} />
        <KpiCard label="ROUTE" value="library" sub="/orchestrator/library" accent={GOLD} />
      </div>

      {loading && <Card><div className="text-xs p-4" style={{ color: T.textDim }}>Loading template library…</div></Card>}

      {!loading && templates.length === 0 && (
        <Card>
          <div className="text-xs p-6 text-center" style={{ color: T.textDim }}>
            <div className="mb-1">No templates registered.</div>
            <div className="text-xs" style={{ color: T.textMuted }}>
              {data?.note ?? 'Run migration 0166_domain_pack_templates.sql to seed the archived-vertical library.'}
            </div>
            {error && <div className="text-xs mt-2" style={{ color: '#ef4444' }}>{String(error)}</div>}
          </div>
        </Card>
      )}

      {templates.length > 0 && (
        <>
          <SectionTitle>Templates</SectionTitle>
          <div className="flex flex-col gap-3 mb-8">
            {templates.map(tpl => {
              const s = state[tpl.slug];
              return (
                <Card key={tpl.slug} style={{ borderLeft: `3px solid ${GOLD}30` }}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-xs font-mono px-1.5 py-0.5 rounded" style={{ color: GOLD, backgroundColor: 'rgba(201,183,135,0.08)' }}>
                          {tpl.origin}
                        </span>
                        <span className="text-xs font-mono" style={{ color: T.textMuted }}>{tpl.industry}</span>
                        <span className="text-xs font-mono" style={{ color: T.textMuted }}>· {tpl.slug}</span>
                      </div>
                      <div className="text-sm font-semibold mb-1" style={{ color: T.text }}>{tpl.name}</div>
                      <div className="text-xs" style={{ color: T.textDim }}>{tpl.description}</div>
                      {tpl.tags?.length > 0 && (
                        <div className="flex gap-1.5 mt-2 flex-wrap">
                          {tpl.tags.map(t => (
                            <span key={t} className="text-xs font-mono px-1.5 py-0.5 rounded" style={{ color: T.textMuted, backgroundColor: T.surface, border: `1px solid ${T.border}` }}>{t}</span>
                          ))}
                        </div>
                      )}
                      {s?.error && <div className="mt-2 text-xs" style={{ color: '#ef4444' }}>{s.error}</div>}
                      {s?.createdSlug && (
                        <div className="mt-2 text-xs" style={{ color: '#22c55e' }}>
                          Draft pack created: <span style={{ fontFamily: 'monospace', color: GOLD }}>{s.createdSlug}</span> —
                          <button
                            type="button"
                            onClick={() => navigate(link(`/orchestrator/catalog`))}
                            className="ml-2 underline"
                            style={{ color: '#22c55e', background: 'none', border: 'none', cursor: 'pointer' }}
                          >View in Catalog →</button>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-1.5 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => instantiate(tpl)}
                        disabled={!evolveEnabled || s?.loading}
                        className="text-xs font-mono px-3 py-1.5 rounded"
                        style={{
                          color: !evolveEnabled || s?.loading ? T.textMuted : '#0a0a0a',
                          backgroundColor: !evolveEnabled || s?.loading ? T.surface : GOLD,
                          border: `1px solid ${!evolveEnabled || s?.loading ? T.border : GOLD}`,
                          cursor: !evolveEnabled || s?.loading ? 'not-allowed' : 'pointer',
                          fontWeight: 600,
                        }}
                      >
                        {s?.loading ? 'Instantiating…' : 'Instantiate as Draft →'}
                      </button>
                      <Link
                        href={link('/orchestrator/catalog')}
                        className="text-xs font-mono px-3 py-1.5 rounded text-center"
                        style={{ color: T.textDim, backgroundColor: T.surface, border: `1px solid ${T.border}`, textDecoration: 'none' }}
                      >
                        Catalog →
                      </Link>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </>
      )}

      <SectionTitle>How the Library Works</SectionTitle>
      <Card>
        <div className="p-4 text-xs" style={{ color: T.textDim }}>
          Templates are seeded by migration <code>0166_domain_pack_templates.sql</code> from archived A11oy verticals. Instantiating a template creates a new <strong>draft</strong> in <code>domain_packs</code> with a fresh slug — the original template is unaffected. The draft must be activated via the standard approval flow before it governs any decisions.
        </div>
      </Card>
    </Layout>
  );
}
