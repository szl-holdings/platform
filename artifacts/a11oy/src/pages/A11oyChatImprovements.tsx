import { useEffect, useState, useCallback } from 'react';

const T = {
  bg: '#0a0a0a',
  surface: 'rgba(255,255,255,0.025)',
  border: 'rgba(255,255,255,0.08)',
  text: '#f5f5f5',
  dim: '#8a8a8a',
  muted: '#5e5e5e',
  accent: '#c9b787',
  good: '#10b981',
  warn: '#f59e0b',
  bad: '#ef4444',
  mono: 'ui-monospace, SFMono-Regular, Menlo, monospace',
} as const;

const BASE_URL = (import.meta.env.BASE_URL ?? '/').replace(/\/$/, '');
const API_BASE = '/api/a11oy';

interface ImprovementEntry {
  id: string;
  createdAt: string;
  status: 'pending' | 'approved' | 'rejected';
  mode: string;
  modelId: string;
  prompt: string;
  response: string;
  mirrorEvalScore: number;
  mirrorEvalDisposition: string;
  proposedImprovement: string;
  reviewerNote?: string;
  reviewedAt?: string;
}

export function A11oyChatImprovements() {
  const [items, setItems] = useState<ImprovementEntry[]>([]);
  const [threshold, setThreshold] = useState(0.7);
  const [promptVersion, setPromptVersion] = useState('—');
  const [filter, setFilter] = useState<'pending' | 'all'>('pending');
  const [loading, setLoading] = useState(false);
  const [noteDraft, setNoteDraft] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API_BASE}/improvements`);
      const j = await r.json();
      if (j?.ok && Array.isArray(j.data)) {
        setItems(j.data);
        setThreshold(j.threshold ?? 0.7);
        setPromptVersion(j.promptVersion ?? '—');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const review = useCallback(async (id: string, action: 'approve' | 'reject') => {
    const note = noteDraft[id] ?? '';
    await fetch(`${API_BASE}/improvements/${id}/${action}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ note }),
    });
    await load();
  }, [noteDraft, load]);

  const visible = items.filter((i) => filter === 'all' || i.status === 'pending');

  return (
    <div style={{ minHeight: 'calc(100vh - 64px)', backgroundColor: T.bg, color: T.text, padding: '1.5rem' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: `1px solid ${T.border}`, paddingBottom: '1rem', marginBottom: '1.25rem' }}>
          <div>
            <div style={{ fontSize: '0.6rem', fontFamily: T.mono, letterSpacing: '0.22em', textTransform: 'uppercase', color: T.muted, marginBottom: 4 }}>A11oy Self-Evolution</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 300, letterSpacing: '-0.01em' }}>Improvement queue</div>
            <div style={{ fontSize: '0.75rem', color: T.dim, marginTop: 4 }}>
              Sub-threshold turns (MirrorEval &lt; {threshold.toFixed(2)}) land here. Operator-approved improvements bump the versioned system prompt and tool descriptions.
              <span style={{ color: T.muted }}> · current prompt: <span style={{ color: T.accent }}>{promptVersion}</span></span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <a href={`${BASE_URL}/chat`} style={{ fontFamily: T.mono, fontSize: '0.65rem', letterSpacing: '0.12em', textTransform: 'uppercase', padding: '0.5rem 0.85rem', border: `1px solid ${T.border}`, color: T.dim, borderRadius: 4, textDecoration: 'none' }}>← Back to chat</a>
            <button onClick={() => setFilter(filter === 'pending' ? 'all' : 'pending')} style={{ fontFamily: T.mono, fontSize: '0.65rem', letterSpacing: '0.12em', textTransform: 'uppercase', padding: '0.5rem 0.85rem', backgroundColor: 'transparent', border: `1px solid ${T.border}`, color: T.dim, borderRadius: 4, cursor: 'pointer' }}>{filter === 'pending' ? 'Show all' : 'Show pending only'}</button>
            <button onClick={() => void load()} disabled={loading} style={{ fontFamily: T.mono, fontSize: '0.65rem', letterSpacing: '0.12em', textTransform: 'uppercase', padding: '0.5rem 0.85rem', backgroundColor: 'transparent', border: `1px solid ${T.border}`, color: T.dim, borderRadius: 4, cursor: 'pointer' }}>{loading ? 'Loading…' : 'Refresh'}</button>
          </div>
        </div>

        {visible.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: T.muted, fontSize: '0.85rem', border: `1px dashed ${T.border}`, borderRadius: 8 }}>
            No improvement entries{filter === 'pending' ? ' pending' : ''}. The chat queues turns automatically when MirrorEval scores fall below {threshold.toFixed(2)}.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {visible.map((e) => (
              <div key={e.id} data-testid={`improvement-${e.id}`} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: '1rem 1.1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, fontSize: '0.65rem', fontFamily: T.mono, color: T.muted }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <span style={{ color: T.accent }}>{e.id}</span>
                    <span>{new Date(e.createdAt).toLocaleString()}</span>
                    <span style={{ color: T.dim }}>mode: <span style={{ color: T.text }}>{e.mode}</span></span>
                    <span style={{ color: T.dim }}>model: <span style={{ color: T.text }}>{e.modelId}</span></span>
                    <span style={{ color: e.mirrorEvalScore >= 0.7 ? T.good : e.mirrorEvalScore >= 0.5 ? T.warn : T.bad }}>mirror {e.mirrorEvalScore.toFixed(2)}</span>
                    <span style={{ color: T.dim }}>{e.mirrorEvalDisposition}</span>
                  </div>
                  <span style={{ padding: '2px 9px', borderRadius: 999, fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.1em', background: e.status === 'approved' ? 'rgba(16,185,129,0.12)' : e.status === 'rejected' ? 'rgba(239,68,68,0.12)' : 'rgba(245,158,11,0.12)', color: e.status === 'approved' ? T.good : e.status === 'rejected' ? T.bad : T.warn }}>{e.status}</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 10 }}>
                  <div>
                    <div style={{ fontSize: '0.6rem', fontFamily: T.mono, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Prompt</div>
                    <div style={{ fontSize: '0.78rem', color: T.text, lineHeight: 1.55, whiteSpace: 'pre-wrap', maxHeight: 140, overflow: 'auto' }}>{e.prompt}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.6rem', fontFamily: T.mono, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Response (truncated)</div>
                    <div style={{ fontSize: '0.78rem', color: T.text, lineHeight: 1.55, whiteSpace: 'pre-wrap', maxHeight: 140, overflow: 'auto' }}>{e.response}</div>
                  </div>
                </div>

                <div style={{ padding: '0.6rem 0.75rem', background: 'rgba(201,183,135,0.05)', border: `1px solid ${T.border}`, borderRadius: 6, marginBottom: 10 }}>
                  <div style={{ fontSize: '0.6rem', fontFamily: T.mono, color: T.accent, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Proposed improvement</div>
                  <div style={{ fontSize: '0.8rem', color: T.text, lineHeight: 1.55 }}>{e.proposedImprovement}</div>
                </div>

                {e.status === 'pending' ? (
                  <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                    <textarea
                      placeholder="Reviewer note (optional)…"
                      value={noteDraft[e.id] ?? ''}
                      onChange={(ev) => setNoteDraft((d) => ({ ...d, [e.id]: ev.target.value }))}
                      rows={2}
                      style={{ flex: 1, resize: 'vertical', minHeight: 38, padding: '0.45rem 0.65rem', background: T.bg, border: `1px solid ${T.border}`, borderRadius: 6, color: T.text, fontSize: '0.78rem', fontFamily: 'inherit', outline: 'none' }}
                    />
                    <button onClick={() => void review(e.id, 'approve')} data-testid={`approve-${e.id}`} style={{ padding: '0.5rem 0.9rem', background: 'rgba(16,185,129,0.12)', border: `1px solid ${T.good}`, color: T.good, borderRadius: 6, fontFamily: T.mono, fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer' }}>Approve</button>
                    <button onClick={() => void review(e.id, 'reject')} data-testid={`reject-${e.id}`} style={{ padding: '0.5rem 0.9rem', background: 'rgba(239,68,68,0.1)', border: `1px solid ${T.bad}`, color: T.bad, borderRadius: 6, fontFamily: T.mono, fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer' }}>Reject</button>
                  </div>
                ) : e.reviewerNote ? (
                  <div style={{ fontSize: '0.7rem', color: T.dim, fontStyle: 'italic' }}>
                    Reviewer note: {e.reviewerNote}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default A11oyChatImprovements;
