/**
 * /a11oy/formulas/:id — Supreme Knowledge Codex node detail.
 *
 * Resolves a codex node id (e.g. lutar_v6, lutar_omega, lutar_v7) by calling
 * GET /api/ouroboros/codex/node/:id and renders it with neighbor traversal,
 * lineage, sources, and a back-link to /a11oy/thesis.
 */
import { useEffect, useState } from 'react';
import { Link, useRoute } from 'wouter';
import { Layout } from '../components/layout';
import { Card, PageHeader, SectionTitle, StatusPill } from '../components/ui';

const GOLD = '#c9b787';
const GREY = '#8a8a8a';
const BASE = (import.meta.env.BASE_URL ?? '/a11oy/').replace(/\/$/, '');
const API = `/api/ouroboros`;

interface CodexNode {
  id: string;
  label?: string;
  domain?: string;
  description?: string;
  formula?: string;
  sources?: Array<string | { title?: string; url?: string }>;
  thesisAnchor?: string;
  endpoint?: string;
  edges?: Array<{ from: string; to: string; type: string }>;
  [k: string]: unknown;
}

export default function CodexNode() {
  const [, params] = useRoute<{ id: string }>(`${BASE}/formulas/:id`);
  const id = params?.id ?? '';
  const [node, setNode] = useState<CodexNode | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setNode(null);
    setError(null);
    fetch(`${API}/codex/node/${encodeURIComponent(id)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((data) => {
        if (cancelled) return;
        setNode((data?.node ?? data) as CodexNode);
      })
      .catch((e) => !cancelled && setError(e.message));
    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <Layout>
      <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-6" style={{ color: '#f5f5f5' }}>
        <PageHeader
          label="SUPREME CODEX v11"
          title={node?.label ?? id}
          subtitle={node?.description ?? `Codex entry · ${id}`}
          status={node ? 'LIVE' : error ? 'OFFLINE' : 'PENDING'}
        />

        <div className="text-xs font-mono" style={{ color: GREY }}>
          <Link href={`${BASE}/thesis`} style={{ color: GOLD }}>← back to /thesis</Link>
          {' · '}
          <a href={`${API}/codex/node/${id}`} target="_blank" rel="noreferrer" style={{ color: GOLD }}>
            raw JSON
          </a>
        </div>

        {error && (
          <Card>
            <div className="text-xs" style={{ color: '#e08a4a' }}>
              Codex unreachable: {error}. Try the raw API link above.
            </div>
          </Card>
        )}

        {node && (
          <>
            <Card>
              <SectionTitle>Identity</SectionTitle>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2 text-sm">
                <div><span style={{ color: GREY }}>id:</span> <span className="font-mono">{node.id}</span></div>
                {node.domain && <div><span style={{ color: GREY }}>domain:</span> <span className="font-mono">{node.domain}</span></div>}
                {node.thesisAnchor && (
                  <div>
                    <span style={{ color: GREY }}>thesis:</span>{' '}
                    <Link href={`${BASE}/thesis#${slugify(node.thesisAnchor)}`} style={{ color: GOLD }}>{node.thesisAnchor}</Link>
                  </div>
                )}
                {node.endpoint && (
                  <div>
                    <span style={{ color: GREY }}>endpoint:</span>{' '}
                    <a href={node.endpoint} target="_blank" rel="noreferrer" style={{ color: GOLD }} className="font-mono text-xs">
                      {node.endpoint}
                    </a>
                  </div>
                )}
              </div>
            </Card>

            {node.formula && (
              <Card>
                <SectionTitle>Formula</SectionTitle>
                <div
                  className="text-xs font-mono px-3 py-3 rounded mt-2 overflow-x-auto"
                  style={{ backgroundColor: 'rgba(245,245,245,0.04)', color: GOLD, border: '1px solid rgba(201,183,135,0.2)' }}
                >
                  {node.formula}
                </div>
              </Card>
            )}

            {Array.isArray(node.sources) && node.sources.length > 0 && (
              <Card>
                <SectionTitle>Sources</SectionTitle>
                <ul className="text-sm mt-2 space-y-1 list-disc list-inside" style={{ color: '#d4d4d4' }}>
                  {node.sources.map((s, i) => {
                    if (typeof s === 'string') return <li key={i}>{s}</li>;
                    return (
                      <li key={i}>
                        {s.url ? (
                          <a href={s.url} target="_blank" rel="noreferrer" style={{ color: GOLD }}>{s.title ?? s.url}</a>
                        ) : (
                          s.title
                        )}
                      </li>
                    );
                  })}
                </ul>
              </Card>
            )}

            {Array.isArray(node.edges) && node.edges.length > 0 && (
              <Card>
                <SectionTitle>Codex Neighbors ({node.edges.length})</SectionTitle>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2 text-xs">
                  {node.edges.slice(0, 50).map((e, i) => (
                    <Link
                      key={i}
                      href={`${BASE}/formulas/${e.to}`}
                      className="flex items-center justify-between gap-2 px-2 py-1 rounded hover:opacity-80"
                      style={{ backgroundColor: 'rgba(245,245,245,0.04)', border: '1px solid rgba(201,183,135,0.2)' }}
                    >
                      <span className="font-mono" style={{ color: '#f5f5f5' }}>{e.to}</span>
                      <span className="font-mono" style={{ color: GREY }}>{e.type}</span>
                    </Link>
                  ))}
                </div>
              </Card>
            )}

            <Card>
              <SectionTitle>Raw codex payload</SectionTitle>
              <pre className="text-xs mt-2 overflow-x-auto p-2 rounded" style={{ backgroundColor: 'rgba(245,245,245,0.04)', color: '#d4d4d4', border: '1px solid rgba(201,183,135,0.15)' }}>
                {JSON.stringify(node, null, 2)}
              </pre>
            </Card>

            <div className="flex items-center gap-2 mt-2">
              <StatusPill status="LIVE" />
              <span className="text-xs" style={{ color: GREY }}>Source: alloy.supreme_knowledge/v11-UNIFIED-OPERATIONAL</span>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
