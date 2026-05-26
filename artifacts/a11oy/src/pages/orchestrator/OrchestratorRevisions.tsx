import { useEffect, useState } from 'react';
import { Link, useParams } from 'wouter';
import { Layout } from '../../components/layout';
import { PageHeader, Card, SectionTitle } from '../../components/ui';
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

interface Revision {
  id: number;
  slug: string;
  lifecycle: string;
  actor_id: string;
  note: string | null;
  created_at: string;
}

interface DiffPayload {
  slug: string;
  revA: { id: string; lifecycle: string; at: string };
  revB: { id: string; lifecycle: string; at: string };
  diff: {
    added: Record<string, unknown>;
    removed: Record<string, unknown>;
    changed: Record<string, { from: unknown; to: unknown }>;
  };
}

interface StatusPayload { evolveEnabled?: boolean }

export function OrchestratorRevisions() {
  const { slug } = useParams<{ slug: string }>();
  const { data: status } = useApiData<StatusPayload>('/orchestrator/status');
  const { data, loading, error } = useApiData<{ revisions: Revision[]; total: number }>(`/orchestrator/packs/${slug}/revisions`);
  const [revA, setRevA] = useState<string | null>(null);
  const [revB, setRevB] = useState<string>('current');
  const [diff, setDiff] = useState<DiffPayload | null>(null);
  const [diffLoading, setDiffLoading] = useState(false);
  const [diffError, setDiffError] = useState<string | null>(null);
  const [rollbackState, setRollbackState] = useState<{ loading: boolean; error: string | null; done: boolean }>({ loading: false, error: null, done: false });

  const evolveEnabled = status?.evolveEnabled !== false;
  const revisions = data?.revisions ?? [];

  useEffect(() => {
    if (!revA && revisions.length > 0) {
      setRevA(String(revisions[0].id));
    }
  }, [revisions, revA]);

  async function loadDiff() {
    if (!revA) return;
    setDiffLoading(true);
    setDiffError(null);
    try {
      const resp = await fetch(`${API_BASE}/orchestrator/packs/${slug}/revisions/${revA}/diff/${revB}`, { credentials: 'include' });
      const body = await resp.json().catch(() => ({})) as { ok?: boolean; data?: DiffPayload; error?: string };
      if (!resp.ok || !body.ok) {
        setDiffError(body.error ?? `Request failed (${resp.status})`);
        setDiff(null);
      } else {
        setDiff(body.data ?? null);
      }
    } catch {
      setDiffError('Network error');
    } finally {
      setDiffLoading(false);
    }
  }

  async function requestRollback(revisionId: number) {
    if (!evolveEnabled) return;
    const note = window.prompt(`File a governed rollback request to revision ${revisionId}?\n\nThis routes through the Approval Queue — the pack is NOT swapped until approved.\n\nOptional reason:`, 'Operator-requested rollback');
    if (note === null) return;
    setRollbackState({ loading: true, error: null, done: false });
    try {
      const resp = await fetch(`${API_BASE}/orchestrator/packs/${slug}/rollback/${revisionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ note }),
      });
      const body = await resp.json().catch(() => ({})) as { ok?: boolean; error?: string };
      if (!resp.ok || !body.ok) {
        setRollbackState({ loading: false, error: body.error ?? `Request failed (${resp.status})`, done: false });
      } else {
        setRollbackState({ loading: false, error: null, done: true });
      }
    } catch {
      setRollbackState({ loading: false, error: 'Network error', done: false });
    }
  }

  return (
    <Layout>
      <PageHeader
        label="VERTICAL ORCHESTRATOR · REVISIONS"
        title={`Revisions · ${slug}`}
        subtitle="Immutable revision history. Diff any two revisions; rollback files an Approval Queue request — pack_json is never swapped without human approval."
        status={evolveEnabled ? 'LIVE' : 'GATED'}
      />

      {!evolveEnabled && (
        <Card>
          <div className="text-xs p-4" style={{ color: '#f97316' }}>
            Evolve features disabled — revisions are readable but rollback requires <code>A11OY_ORCHESTRATOR_EVOLVE_ENABLED=true</code>.
          </div>
        </Card>
      )}

      <div className="flex gap-2 mb-4 flex-wrap mt-4">
        <Link href={link('/orchestrator/catalog')} className="text-xs font-mono px-3 py-1.5 rounded"
          style={{ color: T.textDim, backgroundColor: T.surface, border: `1px solid ${T.border}`, textDecoration: 'none' }}>← Catalog</Link>
        <Link href={link(`/orchestrator/health/${slug}`)} className="text-xs font-mono px-3 py-1.5 rounded"
          style={{ color: T.textDim, backgroundColor: T.surface, border: `1px solid ${T.border}`, textDecoration: 'none' }}>Health →</Link>
      </div>

      <SectionTitle>Revision History</SectionTitle>

      {loading && <Card><div className="text-xs p-4" style={{ color: T.textDim }}>Loading revisions…</div></Card>}
      {error && !loading && (
        <Card><div className="text-xs p-4" style={{ color: '#ef4444' }}>Failed to load revisions: {String(error)}</div></Card>
      )}
      {!loading && revisions.length === 0 && !error && (
        <Card><div className="text-xs p-6 text-center" style={{ color: T.textDim }}>No revisions recorded yet for <code>{slug}</code>.</div></Card>
      )}

      {revisions.length > 0 && (
        <div className="flex flex-col gap-2 mb-6">
          {revisions.map(rev => (
            <Card key={rev.id}>
              <div className="flex items-center justify-between gap-4 p-1">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ color: GOLD, backgroundColor: 'rgba(201,183,135,0.08)' }}>
                    rev {rev.id}
                  </span>
                  <span className="text-xs font-mono" style={{ color: T.textDim }}>{rev.lifecycle}</span>
                  <span className="text-xs" style={{ color: T.textMuted }}>{new Date(rev.created_at).toLocaleString()}</span>
                  <span className="text-xs truncate" style={{ color: T.text }}>{rev.note ?? '(no note)'}</span>
                  <span className="text-xs font-mono" style={{ color: T.textMuted }}>by {rev.actor_id}</span>
                </div>
                <div className="flex gap-1.5 flex-shrink-0">
                  <button type="button" onClick={() => { setRevA(String(rev.id)); setRevB('current'); setDiff(null); }}
                    className="text-xs font-mono px-2 py-1 rounded"
                    style={{ color: revA === String(rev.id) ? GOLD : T.textDim, backgroundColor: T.surface, border: `1px solid ${revA === String(rev.id) ? GOLD : T.border}`, cursor: 'pointer' }}>
                    Pick A
                  </button>
                  <button type="button" onClick={() => { setRevB(String(rev.id)); setDiff(null); }}
                    className="text-xs font-mono px-2 py-1 rounded"
                    style={{ color: revB === String(rev.id) ? GOLD : T.textDim, backgroundColor: T.surface, border: `1px solid ${revB === String(rev.id) ? GOLD : T.border}`, cursor: 'pointer' }}>
                    Pick B
                  </button>
                  <button type="button" disabled={!evolveEnabled || rollbackState.loading}
                    onClick={() => requestRollback(rev.id)}
                    className="text-xs font-mono px-2 py-1 rounded"
                    style={{
                      color: !evolveEnabled || rollbackState.loading ? T.textMuted : '#f97316',
                      backgroundColor: T.surface,
                      border: `1px solid ${!evolveEnabled || rollbackState.loading ? T.border : '#f97316'}`,
                      cursor: !evolveEnabled || rollbackState.loading ? 'not-allowed' : 'pointer',
                    }}>
                    Rollback →
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {rollbackState.error && <Card><div className="text-xs p-3" style={{ color: '#ef4444' }}>Rollback failed: {rollbackState.error}</div></Card>}
      {rollbackState.done && (
        <Card><div className="text-xs p-3" style={{ color: '#22c55e' }}>
          Rollback request filed — pending human approval in the Approval Queue. pack_json unchanged until the approval resolves.
        </div></Card>
      )}

      <SectionTitle>Diff</SectionTitle>
      <Card>
        <div className="p-4 flex flex-col gap-3">
          <div className="flex gap-2 items-center flex-wrap text-xs" style={{ color: T.textDim }}>
            <span>A:</span>
            <code style={{ color: GOLD }}>{revA ?? '(pick a revision)'}</code>
            <span>→ B:</span>
            <code style={{ color: GOLD }}>{revB}</code>
            <button type="button" onClick={loadDiff} disabled={!revA || diffLoading}
              className="text-xs font-mono px-3 py-1 rounded ml-auto"
              style={{ color: !revA || diffLoading ? T.textMuted : '#0a0a0a', backgroundColor: !revA || diffLoading ? T.surface : GOLD, border: `1px solid ${GOLD}`, cursor: !revA || diffLoading ? 'not-allowed' : 'pointer', fontWeight: 600 }}>
              {diffLoading ? 'Computing…' : 'Compute Diff →'}
            </button>
          </div>
          {diffError && <div className="text-xs" style={{ color: '#ef4444' }}>{diffError}</div>}
          {diff && (
            <div className="flex flex-col gap-3 text-xs">
              {Object.keys(diff.diff.added).length === 0 && Object.keys(diff.diff.removed).length === 0 && Object.keys(diff.diff.changed).length === 0 && (
                <div style={{ color: T.textMuted }}>No field-level differences.</div>
              )}
              {Object.entries(diff.diff.added).map(([k, v]) => (
                <div key={`add-${k}`} style={{ borderLeft: '3px solid #22c55e', paddingLeft: '0.75rem' }}>
                  <div style={{ color: '#22c55e' }}>+ {k}</div>
                  <pre style={{ color: T.textDim, overflow: 'auto', fontSize: '0.7rem', margin: 0 }}>{JSON.stringify(v, null, 2)}</pre>
                </div>
              ))}
              {Object.entries(diff.diff.removed).map(([k, v]) => (
                <div key={`rem-${k}`} style={{ borderLeft: '3px solid #ef4444', paddingLeft: '0.75rem' }}>
                  <div style={{ color: '#ef4444' }}>− {k}</div>
                  <pre style={{ color: T.textDim, overflow: 'auto', fontSize: '0.7rem', margin: 0 }}>{JSON.stringify(v, null, 2)}</pre>
                </div>
              ))}
              {Object.entries(diff.diff.changed).map(([k, v]) => (
                <div key={`chg-${k}`} style={{ borderLeft: `3px solid ${GOLD}`, paddingLeft: '0.75rem' }}>
                  <div style={{ color: GOLD }}>~ {k}</div>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <div>
                      <div style={{ color: T.textMuted }}>from</div>
                      <pre style={{ color: T.textDim, overflow: 'auto', fontSize: '0.7rem', margin: 0 }}>{JSON.stringify(v.from, null, 2)}</pre>
                    </div>
                    <div>
                      <div style={{ color: T.textMuted }}>to</div>
                      <pre style={{ color: T.textDim, overflow: 'auto', fontSize: '0.7rem', margin: 0 }}>{JSON.stringify(v.to, null, 2)}</pre>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </Layout>
  );
}
