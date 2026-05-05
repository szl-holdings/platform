import { useEffect, useState } from 'react';
import { Link, useRoute } from 'wouter';
import { Layout } from '../components/layout';
import { PageHeader, Card } from '../components/ui';

const BASE = (import.meta.env.BASE_URL ?? '/').replace(/\/$/, '');
const GOLD = '#c9b787';

interface CodexEntry {
  id: string;
  kind: string;
  title: string;
  relativePath: string;
  bytes: number;
  modifiedAt: string;
  tags: string[];
  summary: string;
  snippet: string;
  weight: number;
}

interface RawResponse {
  entry: CodexEntry;
  content: string;
  truncated: boolean;
  length: number;
}

export default function CodexEntry() {
  const [match, params] = useRoute<{ entryId: string }>(`${BASE}/codex/:entryId`);
  const entryId = match ? params.entryId : '';
  const [raw, setRaw] = useState<RawResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!entryId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`/api/a11oy/codex/entry/${encodeURIComponent(entryId)}/raw`)
      .then(r => r.json())
      .then((j: { ok: boolean; data?: RawResponse; error?: { message: string } }) => {
        if (cancelled) return;
        if (j.ok && j.data) setRaw(j.data);
        else setError(j.error?.message ?? 'Entry not found.');
      })
      .catch((e: Error) => { if (!cancelled) setError(e.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [entryId]);

  const entry = raw?.entry;

  return (
    <Layout>
      <PageHeader
        label={entry ? entry.kind.toUpperCase() : 'CODEX ENTRY'}
        title={entry ? entry.title : 'Loading…'}
        subtitle={entry ? entry.relativePath : 'Resolving codex entry from the live repo index.'}
        status="INDEXED"
      />

      <div className="mb-4">
        <Link href={`${BASE}/codex`} className="text-xs font-mono uppercase tracking-widest" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
          ← Back to Codex
        </Link>
      </div>

      {loading && (
        <div style={{ padding: '2rem', fontFamily: 'monospace', fontSize: '0.8rem', color: GOLD }}>Loading entry…</div>
      )}

      {error && !loading && (
        <Card>
          <div className="text-sm font-mono" style={{ color: '#ef4444' }}>{error}</div>
        </Card>
      )}

      {entry && raw && !loading && (
        <>
          <Card className="mb-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div>
                <div style={{ color: 'var(--color-a11oy-text-ghost)' }}>Kind</div>
                <div className="font-mono" style={{ color: GOLD }}>{entry.kind}</div>
              </div>
              <div>
                <div style={{ color: 'var(--color-a11oy-text-ghost)' }}>Size</div>
                <div className="font-mono" style={{ color: 'var(--color-a11oy-text-sub)' }}>{(entry.bytes / 1024).toFixed(1)} KB</div>
              </div>
              <div>
                <div style={{ color: 'var(--color-a11oy-text-ghost)' }}>Modified</div>
                <div className="font-mono" style={{ color: 'var(--color-a11oy-text-sub)' }}>{new Date(entry.modifiedAt).toLocaleDateString()}</div>
              </div>
              <div>
                <div style={{ color: 'var(--color-a11oy-text-ghost)' }}>Priority</div>
                <div className="font-mono" style={{ color: 'var(--color-a11oy-text-sub)' }}>{entry.weight}</div>
              </div>
            </div>
            {entry.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-3">
                {entry.tags.map(t => (
                  <span key={t} className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ background: 'var(--color-a11oy-deep)', color: 'var(--color-a11oy-text-ghost)' }}>{t}</span>
                ))}
              </div>
            )}
          </Card>

          {raw.truncated && (
            <div
              className="mb-4 px-3 py-2 rounded text-xs font-mono"
              style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', color: '#f59e0b' }}
            >
              Content truncated to {(raw.length / 1024).toFixed(1)} KB. Open the source file at <span style={{ color: GOLD }}>{entry.relativePath}</span> for the full document.
            </div>
          )}

          <Card>
            <pre
              className="text-xs leading-relaxed whitespace-pre-wrap break-words p-4 rounded"
              style={{
                background: 'var(--color-a11oy-deep)',
                border: '1px solid var(--color-a11oy-border)',
                color: 'var(--color-a11oy-text)',
                fontFamily: 'ui-monospace, monospace',
                maxHeight: '70vh',
                overflowY: 'auto',
              }}
            >
{raw.content}
            </pre>
          </Card>
        </>
      )}
    </Layout>
  );
}
