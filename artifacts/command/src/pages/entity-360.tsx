import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'wouter';

interface Entity {
  id: number;
  uri: string;
  kind: string;
  orgId: number | null;
  sourceTable: string;
  sourceId: string;
  displayName: string;
  attributes: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

interface NeighborEdge {
  edge: {
    id: number;
    fromUri: string;
    toUri: string;
    relation: string;
    attributes: Record<string, unknown> | null;
  };
  entity: Entity | null;
  direction: 'outbound' | 'inbound';
}

interface ResolveResp {
  entity: Entity;
}
interface NeighborsResp {
  entity: Entity;
  neighbors: NeighborEdge[];
}

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

export function Entity360Page() {
  const [, setLocation] = useLocation();
  const initialUri = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('uri') ?? '';
  }, []);
  const [uri, setUri] = useState(initialUri);
  const [submittedUri, setSubmittedUri] = useState(initialUri);
  const [entity, setEntity] = useState<Entity | null>(null);
  const [neighbors, setNeighbors] = useState<NeighborEdge[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!submittedUri) {
      setEntity(null);
      setNeighbors([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const r = await fetch(
          `/api/ontology/neighbors?uri=${encodeURIComponent(submittedUri)}`,
          { credentials: 'include' },
        );
        if (!r.ok) {
          const body = await r.json().catch(() => ({ error: r.statusText }));
          throw new Error(body.error || `HTTP ${r.status}`);
        }
        const data = (await r.json()) as NeighborsResp;
        if (cancelled) return;
        setEntity(data.entity);
        setNeighbors(data.neighbors);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : String(err));
        setEntity(null);
        setNeighbors([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [submittedUri]);

  const handleResolve = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittedUri(uri.trim());
    const next = new URLSearchParams(window.location.search);
    if (uri.trim()) next.set('uri', uri.trim());
    else next.delete('uri');
    const qs = next.toString();
    setLocation(`/strategy/entity-360${qs ? `?${qs}` : ''}`);
  };

  return (
    <div style={{ padding: 24, fontFamily: 'ui-monospace,SFMono-Regular,Menlo,monospace' }}>
      <header style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0, letterSpacing: 1 }}>
          ENTITY 360 — PRAXIS ONTOLOGY FABRIC
        </h1>
        <p style={{ opacity: 0.7, marginTop: 8, fontSize: 13 }}>
          Resolve any <code>szl://</code> entity URI and inspect its cross-app neighbours.
          Backed by the unified entity registry that links Terra properties, Vessels,
          Counsel matters, threats, and more.
        </p>
      </header>

      <form onSubmit={handleResolve} style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <input
          value={uri}
          onChange={(e) => setUri(e.target.value)}
          placeholder="szl://vessel/imo/9876543"
          aria-label="Entity URI"
          style={{
            flex: 1,
            padding: '10px 12px',
            border: '1px solid #444',
            background: '#0b0b10',
            color: '#fafafa',
            borderRadius: 6,
            fontSize: 13,
          }}
        />
        <button
          type="submit"
          style={{
            padding: '10px 18px',
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: 13,
            letterSpacing: 1,
          }}
        >
          RESOLVE
        </button>
      </form>

      {loading ? <div style={{ opacity: 0.6 }}>Resolving…</div> : null}
      {error ? (
        <div style={{ color: '#f87171', padding: 12, background: '#2a0f10', borderRadius: 6 }}>
          {error}
        </div>
      ) : null}

      {entity ? (
        <section
          style={{
            border: '1px solid #333',
            borderRadius: 8,
            padding: 16,
            marginBottom: 24,
            background: '#0e0e14',
          }}
        >
          <div style={{ fontSize: 11, opacity: 0.6, letterSpacing: 1 }}>{entity.kind.toUpperCase()}</div>
          <div style={{ fontSize: 22, fontWeight: 700, marginTop: 4 }}>{entity.displayName}</div>
          <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>{entity.uri}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 16 }}>
            <Field label="Source table" value={entity.sourceTable} />
            <Field label="Source id" value={entity.sourceId} />
            <Field label="Org id" value={entity.orgId == null ? 'global' : String(entity.orgId)} />
            <Field label="Updated" value={new Date(entity.updatedAt).toLocaleString()} />
          </div>
          {entity.attributes && Object.keys(entity.attributes).length > 0 ? (
            <details style={{ marginTop: 12 }}>
              <summary style={{ cursor: 'pointer', opacity: 0.8 }}>Attributes</summary>
              <pre style={{ fontSize: 11, opacity: 0.85, marginTop: 8 }}>
                {JSON.stringify(entity.attributes, null, 2)}
              </pre>
            </details>
          ) : null}
        </section>
      ) : null}

      {entity ? (
        <section>
          <h2 style={{ fontSize: 14, letterSpacing: 1, opacity: 0.8 }}>
            NEIGHBOURS ({neighbors.length})
          </h2>
          {neighbors.length === 0 ? (
            <div style={{ opacity: 0.6, fontSize: 13 }}>No registered relationships yet.</div>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {neighbors.map((n) => {
                const otherUri =
                  n.direction === 'outbound' ? n.edge.toUri : n.edge.fromUri;
                return (
                  <li
                    key={`${n.edge.id}-${n.direction}`}
                    style={{
                      padding: 12,
                      border: '1px solid #2a2a35',
                      borderRadius: 6,
                      marginBottom: 8,
                      background: '#0c0c12',
                    }}
                  >
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      <span
                        style={{
                          fontSize: 10,
                          padding: '2px 8px',
                          background: n.direction === 'outbound' ? '#1e3a8a' : '#3b1d6b',
                          borderRadius: 999,
                          letterSpacing: 1,
                        }}
                      >
                        {n.direction.toUpperCase()}
                      </span>
                      <span style={{ fontWeight: 600, color: '#a5b4fc' }}>
                        {n.edge.relation}
                      </span>
                    </div>
                    <div style={{ marginTop: 6 }}>
                      <Link
                        href={`/strategy/entity-360?uri=${encodeURIComponent(otherUri)}`}
                        onClick={() => {
                          setUri(otherUri);
                          setSubmittedUri(otherUri);
                        }}
                        style={{ color: '#fafafa', textDecoration: 'underline' }}
                      >
                        {n.entity?.displayName ?? otherUri}
                      </Link>
                      {n.entity ? (
                        <span style={{ opacity: 0.6, marginLeft: 8, fontSize: 11 }}>
                          ({n.entity.kind})
                        </span>
                      ) : (
                        <span style={{ opacity: 0.5, marginLeft: 8, fontSize: 11 }}>
                          (unregistered)
                        </span>
                      )}
                    </div>
                    <div style={{ opacity: 0.5, fontSize: 11, marginTop: 4 }}>{otherUri}</div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      ) : null}

      {!entity && !loading && !error && !submittedUri ? (
        <div style={{ opacity: 0.7, fontSize: 13, marginTop: 16 }}>
          Try a URI like <code>szl://vessel/imo/9876543</code>,{' '}
          <code>szl://property/external/REPL-1</code>, or <code>szl://matter/pc/42</code>.
        </div>
      ) : null}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: 10, opacity: 0.6, letterSpacing: 1 }}>{label.toUpperCase()}</div>
      <div style={{ fontSize: 13, marginTop: 2 }}>{value}</div>
    </div>
  );
}

export default Entity360Page;
