import { useCallback, useEffect, useState } from 'react';
import { Link } from 'wouter';
import { Layout } from '../components/layout';
import { PageHeader, Card, SectionTitle, KpiCard, StatusPill } from '../components/ui';

const API_BASE = (import.meta.env.VITE_API_URL ?? '/api').replace(/\/$/, '');
const BASE = (import.meta.env.BASE_URL ?? '/').replace(/\/$/, '');

interface CodexScore {
  ouroboros: number;
  lutar: number;
  thesisFit: number;
  costSignal: number;
  safetySignal: number;
  composite: number;
  rationale: string[];
}

interface FrontierArtifact {
  id: string;
  provider: string;
  kind: string;
  externalId: string;
  title: string;
  url: string;
  summary?: string;
  publishedAt?: string;
  tags: string[];
}

interface InboxItem {
  id: string;
  status: 'pending' | 'approved' | 'discarded';
  reviewedAt?: string;
  reviewedBy?: string;
  reviewNote?: string;
  evidence: {
    artifact: FrontierArtifact;
    score: CodexScore;
    decision: string;
    promotionTarget?: string;
    evaluatedAt: string;
  };
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.error ?? `HTTP ${res.status}`);
  return (json.data ?? json) as T;
}

// Mirrors the slugify() in pages/Thesis.tsx so anchors line up with
// the heading ids rendered on the canonical thesis viewer.
function slugifyHeading(s: string): string {
  return s
    .toLowerCase()
    .replace(/[`*_~]/g, '')
    .replace(/[^a-z0-9α-ωΑ-Ω→ω]+/g, '-')
    .replace(/^-|-$/g, '');
}

interface ThesisCitation {
  docId: string;
  heading: string;
  cos?: number;
  raw: string;
}

// Parse a rationale line of the form
//   "thesis-RAG: v10-canonical#Audit Closure Operator (cos=0.42); v9-canonical#Ouroboros (cos=0.31)"
// into a list of structured citations. Returns null if the line is
// not a thesis-RAG line so the caller can render it as plain text.
function parseThesisRagLine(line: string): ThesisCitation[] | null {
  const prefix = 'thesis-RAG:';
  if (!line.startsWith(prefix)) return null;
  const rest = line.slice(prefix.length).trim();
  if (rest.length === 0) return [];
  return rest
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .map((raw): ThesisCitation => {
      const cosMatch = /\(cos=([0-9.]+)\)\s*$/.exec(raw);
      const cos = cosMatch ? Number(cosMatch[1]) : undefined;
      const head = cosMatch ? raw.slice(0, cosMatch.index).trim() : raw;
      const hashIdx = head.indexOf('#');
      const docId = hashIdx >= 0 ? head.slice(0, hashIdx).trim() : head;
      const heading = hashIdx >= 0 ? head.slice(hashIdx + 1).trim() : '';
      return { docId, heading, cos, raw };
    });
}

function ThesisCitations({ citations }: { citations: ThesisCitation[] }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="text-[10px] font-mono uppercase text-neutral-500">thesis-RAG</span>
      {citations.map((c, i) => {
        const anchor = c.heading ? `#${slugifyHeading(c.heading)}` : '';
        // Pull the version slug (e.g. "v10") out of a docId like
        // "v10-canonical" so the link routes to /thesis/v10 and lands on
        // the correct canonical revision rather than the default one.
        const versionMatch = /^v(\d+)(?:-canonical)?$/i.exec(c.docId.trim());
        const versionSeg = versionMatch ? `/v${versionMatch[1]}` : '';
        const href = `${BASE}/thesis${versionSeg}${anchor}`;
        const label = c.heading || c.docId;
        return (
          <Link
            key={i}
            href={href}
            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded font-mono text-[10px] hover:underline"
            style={{
              color: '#c9b787',
              backgroundColor: 'rgba(201,183,135,0.08)',
              border: '1px solid rgba(201,183,135,0.25)',
            }}
            title={`${c.docId}${c.heading ? `#${c.heading}` : ''}${c.cos !== undefined ? ` · cos=${c.cos.toFixed(2)}` : ''}`}
          >
            <span className="text-neutral-500">{c.docId}</span>
            <span>{label}</span>
            {c.cos !== undefined && (
              <span className="text-neutral-400">cos={c.cos.toFixed(2)}</span>
            )}
          </Link>
        );
      })}
    </div>
  );
}

function ScoreBar({ label, value, color = '#c9b787' }: { label: string; value: number; color?: string }) {
  const pct = Math.max(0, Math.min(100, value * 100));
  return (
    <div className="flex items-center gap-2">
      <div className="w-24 text-[10px] font-mono text-neutral-400 uppercase">{label}</div>
      <div className="flex-1 h-1.5 bg-neutral-800 rounded overflow-hidden">
        <div className="h-full" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <div className="w-10 text-[10px] font-mono text-neutral-300 text-right">{value.toFixed(2)}</div>
    </div>
  );
}

export function FrontierInbox() {
  const [items, setItems] = useState<InboxItem[]>([]);
  const [statusFilter, setStatusFilter] = useState<'pending' | 'approved' | 'discarded'>('pending');
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const r = await api<{ items: InboxItem[] }>(`/a11oy/frontier/inbox?status=${statusFilter}`);
      setItems(r.items);
      setErr(null);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    }
  }, [statusFilter]);

  useEffect(() => {
    void refresh();
    const t = setInterval(() => void refresh(), 8_000);
    return () => clearInterval(t);
  }, [refresh]);

  const decide = async (id: string, action: 'approve' | 'discard') => {
    setBusy(id);
    try {
      await api(`/a11oy/frontier/inbox/${id}/${action}`, {
        method: 'POST',
        body: JSON.stringify({}),
      });
      await refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  };

  const counts = {
    pending: items.filter((i) => i.status === 'pending').length,
    approved: items.filter((i) => i.status === 'approved').length,
    discarded: items.filter((i) => i.status === 'discarded').length,
  };

  return (
    <Layout>
      <PageHeader
        title="Frontier Inbox"
        subtitle="Operator review queue — capable, expensive, or doctrine-shifting artifacts. Approve to promote into the model registry, RAG corpus, eval harness, or tool proposals."
      />

      <div className="flex items-center justify-between mb-4">
        <Link
          href={`${BASE}/frontier`}
          className="text-xs font-mono px-3 py-1.5 rounded"
          style={{ color: '#c9b787', border: '1px solid rgba(201,183,135,0.3)' }}
        >
          ← Frontier timeline
        </Link>
        <div className="flex items-center gap-2">
          {(['pending', 'approved', 'discarded'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className="px-3 py-1.5 text-xs font-mono rounded uppercase"
              style={{
                backgroundColor: statusFilter === s ? 'rgba(201,183,135,0.18)' : 'rgba(94,94,94,0.12)',
                color: statusFilter === s ? '#c9b787' : '#8a8a8a',
                border: statusFilter === s ? '1px solid rgba(201,183,135,0.35)' : '1px solid rgba(255,255,255,0.06)',
              }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {err && (
        <div className="mb-4 px-3 py-2 rounded text-xs" style={{ backgroundColor: 'rgba(239,68,68,0.15)', color: '#fca5a5' }}>
          {err}
        </div>
      )}

      <div className="grid grid-cols-3 gap-3 mb-6">
        <KpiCard label="Pending" value={counts.pending} accent="#c9b787" />
        <KpiCard label="Approved" value={counts.approved} accent="#22c55e" />
        <KpiCard label="Discarded" value={counts.discarded} accent="#8a8a8a" />
      </div>

      <SectionTitle>Evidence packs</SectionTitle>
      <div className="space-y-3">
        {items.length === 0 && (
          <Card className="p-6 text-center text-xs text-neutral-500">
            No {statusFilter} items in the inbox.
          </Card>
        )}
        {items.map((item) => {
          const a = item.evidence.artifact;
          const s = item.evidence.score;
          return (
            <Card key={item.id} className="p-4">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded uppercase" style={{ backgroundColor: 'rgba(94,94,94,0.2)', color: '#c9b787' }}>
                      {a.provider}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded uppercase" style={{ backgroundColor: 'rgba(94,94,94,0.2)', color: '#f5f5f5' }}>
                      {a.kind}
                    </span>
                    <StatusPill status={item.status === 'pending' ? 'GATED' : item.status === 'approved' ? 'APPROVED' : 'WARN'} />
                    {item.evidence.promotionTarget && (
                      <span className="text-[10px] font-mono text-neutral-400">→ {item.evidence.promotionTarget}</span>
                    )}
                  </div>
                  <a href={a.url} target="_blank" rel="noreferrer" className="text-sm text-neutral-100 hover:text-amber-300 break-words">
                    {a.title}
                  </a>
                  {a.summary && <div className="text-xs text-neutral-400 mt-1 line-clamp-3">{a.summary}</div>}
                </div>
                {item.status === 'pending' && (
                  <div className="flex flex-col gap-1.5 shrink-0">
                    <button
                      onClick={() => decide(item.id, 'approve')}
                      disabled={busy === item.id}
                      className="px-3 py-1.5 text-xs font-mono rounded"
                      style={{ backgroundColor: 'rgba(34,197,94,0.18)', color: '#86efac', border: '1px solid rgba(34,197,94,0.35)' }}
                    >
                      Approve & promote
                    </button>
                    <button
                      onClick={() => decide(item.id, 'discard')}
                      disabled={busy === item.id}
                      className="px-3 py-1.5 text-xs font-mono rounded"
                      style={{ backgroundColor: 'rgba(239,68,68,0.15)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.30)' }}
                    >
                      Discard
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1 mb-3">
                <ScoreBar label="Composite" value={s.composite} color="#c9b787" />
                <ScoreBar label="Thesis fit" value={s.thesisFit} color="#c9b787" />
                <ScoreBar label="Ouroboros" value={s.ouroboros} color="#22c55e" />
                <ScoreBar label="Lutar" value={s.lutar} color="#60a5fa" />
                <ScoreBar label="Cost signal" value={s.costSignal} color="#f59e0b" />
                <ScoreBar label="Safety" value={s.safetySignal} color="#86efac" />
              </div>

              <div className="text-[11px] text-neutral-400 space-y-1">
                {s.rationale.map((r, i) => {
                  const citations = parseThesisRagLine(r);
                  if (citations) {
                    if (citations.length === 0) return null;
                    return (
                      <div key={i} className="flex items-start gap-1.5">
                        <span className="text-neutral-600">•</span>
                        <ThesisCitations citations={citations} />
                      </div>
                    );
                  }
                  return <div key={i}>• {r}</div>;
                })}
              </div>

              {item.status !== 'pending' && (
                <div className="mt-3 pt-3 border-t border-neutral-800 text-[10px] font-mono text-neutral-500">
                  {item.status} by {item.reviewedBy ?? 'operator'}
                  {item.reviewedAt ? ` at ${new Date(item.reviewedAt).toLocaleString()}` : ''}
                  {item.reviewNote ? ` — ${item.reviewNote}` : ''}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </Layout>
  );
}
