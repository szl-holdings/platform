import { useEffect, useState } from 'react';

const API = (import.meta as Record<string, unknown> & { env: Record<string, string> }).env?.VITE_API_URL ?? '';

interface FrontierSignal {
  id: string;
  kind: string;
  title: string;
  summary: string;
  confidence: number;
  impactScore: number;
  affectedAgents: string[];
  createdAt: string;
  sourceName: string;
}

interface FrontierProposal {
  id: string;
  title: string;
  priority: 'P0' | 'P1' | 'P2' | 'P3';
  targetAgent: string;
  impactArea: string;
  estimatedEffort: string;
}

interface RecalibrationMemo {
  id: string;
  title: string;
  summary: string;
  priority: string;
  affectedAgents: string[];
  createdAt: string;
}

interface FrontierBriefing {
  memo: RecalibrationMemo | null;
  topProposals: FrontierProposal[];
  recentSignals: FrontierSignal[];
}

const PRIORITY_COLOR: Record<string, string> = {
  P0: '#ef4444', P1: '#f97316', P2: '#eab308', P3: '#6b7280',
};

const KIND_COLOR: Record<string, string> = {
  capability: '#6b8de3', market: '#22c55e', threat: '#ef4444',
  regulation: '#a78bfa', vendor: '#eab308', benchmark: '#c9b787',
};

function fmt(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function FrontierBriefWidget() {
  const [data, setData] = useState<FrontierBriefing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`${API}/api/helios/frontier-briefing`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<FrontierBriefing>;
      })
      .then(d => { if (!cancelled) setData(d); })
      .catch(e => { if (!cancelled) setError(e instanceof Error ? e.message : 'Error'); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, []);

  const borderCol = 'rgba(255,255,255,0.08)';
  const textCol = '#f5f5f5';
  const subCol = '#8a8a8a';
  const mutedCol = '#5e5e5e';
  const gold = '#c9b787';

  if (loading) {
    return (
      <div style={{ borderRadius: 12, border: `1px solid ${borderCol}`, background: 'rgba(255,255,255,0.02)', padding: '1.5rem', textAlign: 'center', color: mutedCol, fontSize: 12, fontFamily: 'monospace' }}>
        Loading frontier briefing…
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ borderRadius: 12, border: `1px solid rgba(239,68,68,0.3)`, background: 'rgba(239,68,68,0.05)', padding: '1.5rem', textAlign: 'center', color: '#ef4444', fontSize: 12, fontFamily: 'monospace' }}>
        {error ?? 'No briefing data available.'}
      </div>
    );
  }

  return (
    <div style={{ borderRadius: 12, border: `1px solid ${borderCol}`, background: '#0a0a0a', overflow: 'hidden', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ padding: '0.875rem 1.25rem', borderBottom: `1px solid ${borderCol}`, background: 'rgba(255,255,255,0.02)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 9, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.14em', color: gold, marginBottom: 2 }}>
            FRONTIER INTELLIGENCE · PULSE
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, color: textCol }}>Frontier Briefing</div>
        </div>
        <a href="/a11oy/frontier-intel" style={{ fontSize: 11, fontFamily: 'monospace', color: gold, textDecoration: 'none', padding: '3px 10px', borderRadius: 6, border: `1px solid rgba(201,183,135,0.25)`, background: 'rgba(201,183,135,0.06)' }}>
          Full Intelligence →
        </a>
      </div>

      {data.memo && (
        <div style={{ padding: '0.875rem 1.25rem', borderBottom: `1px solid ${borderCol}`, background: 'rgba(201,183,135,0.03)' }}>
          <div style={{ fontSize: 9, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.12em', color: mutedCol, marginBottom: 6 }}>
            Latest Recalibration Memo
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, color: textCol, marginBottom: 4 }}>{data.memo.title}</div>
          <div style={{ fontSize: 11, color: subCol, lineHeight: 1.55, marginBottom: 6 }}>{data.memo.summary}</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {data.memo.affectedAgents.map(a => (
              <span key={a} style={{ fontSize: 10, fontFamily: 'monospace', padding: '1px 7px', borderRadius: 3, background: 'rgba(255,255,255,0.05)', color: subCol, border: `1px solid ${borderCol}` }}>{a}</span>
            ))}
            <span style={{ fontSize: 10, fontFamily: 'monospace', color: mutedCol, marginLeft: 'auto' }}>{fmt(data.memo.createdAt)}</span>
          </div>
        </div>
      )}

      {data.topProposals.length > 0 && (
        <div style={{ padding: '0.875rem 1.25rem', borderBottom: `1px solid ${borderCol}` }}>
          <div style={{ fontSize: 9, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.12em', color: mutedCol, marginBottom: 8 }}>
            Open Capability Proposals ({data.topProposals.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {data.topProposals.map(p => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 10, fontFamily: 'monospace', fontWeight: 700, padding: '1px 6px', borderRadius: 3, background: `${PRIORITY_COLOR[p.priority] ?? '#6b7280'}14`, color: PRIORITY_COLOR[p.priority] ?? '#6b7280', border: `1px solid ${PRIORITY_COLOR[p.priority] ?? '#6b7280'}44`, flexShrink: 0 }}>
                  {p.priority}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 500, color: textCol, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</div>
                  <div style={{ fontSize: 10, color: mutedCol, fontFamily: 'monospace' }}>{p.targetAgent} · {p.impactArea} · {p.estimatedEffort}</div>
                </div>
              </div>
            ))}
          </div>
          <a href="/a11oy/frontier/proposals" style={{ display: 'block', marginTop: 10, fontSize: 11, fontFamily: 'monospace', color: subCol, textDecoration: 'none', textAlign: 'right' }}>
            Review all proposals →
          </a>
        </div>
      )}

      {data.recentSignals.length > 0 && (
        <div style={{ padding: '0.875rem 1.25rem' }}>
          <div style={{ fontSize: 9, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.12em', color: mutedCol, marginBottom: 8 }}>
            Recent Signals
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {data.recentSignals.map(s => (
              <div key={s.id} style={{ display: 'flex', gap: 10 }}>
                <span style={{ flexShrink: 0, marginTop: 2, fontSize: 10, fontFamily: 'monospace', padding: '1px 6px', borderRadius: 3, height: 'fit-content', background: `${KIND_COLOR[s.kind] ?? '#6b7280'}14`, color: KIND_COLOR[s.kind] ?? '#6b7280', border: `1px solid ${KIND_COLOR[s.kind] ?? '#6b7280'}40` }}>
                  {s.kind}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 500, color: textCol, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.title}</div>
                  <div style={{ fontSize: 11, color: subCol, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{s.summary}</div>
                  <div style={{ fontSize: 10, color: mutedCol, fontFamily: 'monospace', marginTop: 3 }}>{s.sourceName} · {fmt(s.createdAt)} · confidence: {Math.round(s.confidence * 100)}%</div>
                </div>
              </div>
            ))}
          </div>
          <a href="/a11oy/frontier/feed" style={{ display: 'block', marginTop: 10, fontSize: 11, fontFamily: 'monospace', color: subCol, textDecoration: 'none', textAlign: 'right' }}>
            Open Signal Feed →
          </a>
        </div>
      )}
    </div>
  );
}
