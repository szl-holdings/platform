import { useEffect, useState, useCallback } from 'react';
import { RotateCcw, RefreshCw, Activity } from 'lucide-react';

const API = (import.meta.env.BASE_URL ?? '/').replace(/\/$/, '') + '/api';
const ACCENT = '#d4a054';

interface CalibrationEntry {
  operatorId: string;
  domain: string;
  weight: number;
  decisions: number;
  lastVerdict?: 'approve' | 'deny' | 'escalate';
  lastUpdatedAt: number;
}

interface CalibrationPayload {
  entries: CalibrationEntry[];
  band: { floor: number; ceiling: number; starting: number };
  count: number;
}

function weightColor(w: number): string {
  if (w >= 1.10) return '#22c55e';
  if (w >= 0.95) return ACCENT;
  if (w >= 0.85) return '#f59e0b';
  return '#ef4444';
}

function verdictColor(v?: string): string {
  if (v === 'approve') return '#22c55e';
  if (v === 'deny') return '#ef4444';
  if (v === 'escalate') return '#f59e0b';
  return '#71717a';
}

export default function ApprovalCalibration() {
  const [payload, setPayload] = useState<CalibrationPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);
  const [resetMsg, setResetMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const r = await fetch(`${API}/a11oy/calibration`);
      const j = await r.json();
      if (!r.ok || !j?.ok) throw new Error(j?.error?.message ?? `HTTP ${r.status}`);
      setPayload(j.data as CalibrationPayload);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'failed to load calibration');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const reset = useCallback(async () => {
    if (!confirm('Reset all per-(operator, domain) Λ-Resonance weights back to 1.0? Audit trail in approvals-inbox is not affected.')) return;
    setResetting(true);
    setResetMsg(null);
    try {
      const r = await fetch(`${API}/a11oy/calibration/reset`, { method: 'POST' });
      const j = await r.json();
      if (!r.ok || !j?.ok) throw new Error(j?.error?.message ?? `HTTP ${r.status}`);
      setResetMsg(`Cleared ${j.data.cleared} entries.`);
      await load();
    } catch (e) {
      setResetMsg(e instanceof Error ? `Reset failed: ${e.message}` : 'Reset failed');
    } finally {
      setResetting(false);
    }
  }, [load]);

  const entries = payload?.entries ?? [];
  const band = payload?.band ?? { floor: 0.80, ceiling: 1.20, starting: 1.0 };

  return (
    <div style={{ padding: '1.5rem', maxWidth: 1100, margin: '0 auto', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <div style={{ fontSize: '0.7rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: ACCENT, fontFamily: 'ui-monospace, monospace' }}>
            sotopia · operator calibration
          </div>
          <h1 style={{ fontSize: '1.75rem', margin: '0.25rem 0 0.5rem', color: '#e7e5e4' }}>Approval Calibration Audit</h1>
          <div style={{ fontSize: '0.85rem', color: '#a8a29e', maxWidth: 720, lineHeight: 1.55 }}>
            Every approval decision (approve / deny / escalate) nudges the Λ-Resonance weight for that
            (operator, domain) pair. UniRec consults this weight as its governance multiplier when
            ranking briefings. Weights are clamped to [{band.floor.toFixed(2)}, {band.ceiling.toFixed(2)}],
            starting at {band.starting.toFixed(2)}.
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" onClick={() => void load()} disabled={loading}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '0.5rem 0.85rem', background: 'transparent', border: '1px solid #44403c', color: '#e7e5e4', borderRadius: 6, fontSize: '0.75rem', cursor: loading ? 'wait' : 'pointer' }}>
            <RefreshCw size={12} /> refresh
          </button>
          <button type="button" onClick={() => void reset()} disabled={resetting || entries.length === 0}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '0.5rem 0.85rem', background: 'transparent', border: '1px solid #7f1d1d', color: '#fca5a5', borderRadius: 6, fontSize: '0.75rem', cursor: (resetting || entries.length === 0) ? 'not-allowed' : 'pointer', opacity: entries.length === 0 ? 0.4 : 1 }}>
            <RotateCcw size={12} /> reset all
          </button>
        </div>
      </div>

      {err ? (
        <div style={{ padding: '0.85rem 1rem', border: '1px solid #7f1d1d', background: 'rgba(127,29,29,0.15)', borderRadius: 6, color: '#fca5a5', fontSize: '0.8rem', marginBottom: '1rem' }}>
          {err}
        </div>
      ) : null}
      {resetMsg ? (
        <div style={{ padding: '0.6rem 0.85rem', border: '1px solid #44403c', borderRadius: 6, color: '#d6d3d1', fontSize: '0.75rem', marginBottom: '1rem', fontFamily: 'ui-monospace, monospace' }}>
          {resetMsg}
        </div>
      ) : null}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: '1.5rem' }}>
        <Stat label="entries" value={String(payload?.count ?? 0)} accent={ACCENT} />
        <Stat label="avg weight" value={entries.length ? (entries.reduce((s, e) => s + e.weight, 0) / entries.length).toFixed(3) : '—'} accent="#a8a29e" />
        <Stat label="band floor" value={band.floor.toFixed(2)} accent="#ef4444" />
        <Stat label="band ceiling" value={band.ceiling.toFixed(2)} accent="#22c55e" />
      </div>

      <div style={{ border: '1px solid #292524', borderRadius: 8, overflow: 'hidden', background: '#0c0a09' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 0.9fr 1fr 1.2fr', padding: '0.6rem 1rem', fontSize: '0.65rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: '#71717a', borderBottom: '1px solid #292524', fontFamily: 'ui-monospace, monospace' }}>
          <div>operator</div><div>domain</div><div>weight (Λ)</div><div>decisions</div><div>last verdict</div><div>updated</div>
        </div>
        {entries.length === 0 ? (
          <div style={{ padding: '2rem 1rem', textAlign: 'center', color: '#71717a', fontSize: '0.8rem' }}>
            <Activity size={20} style={{ opacity: 0.4 }} />
            <div style={{ marginTop: 8 }}>No calibration yet. Approval decisions in the Approvals Inbox will appear here.</div>
          </div>
        ) : (
          entries.map((e) => (
            <div key={`${e.operatorId}::${e.domain}`} style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 0.9fr 1fr 1.2fr', padding: '0.7rem 1rem', fontSize: '0.8rem', borderBottom: '1px solid #1c1917', color: '#d6d3d1', fontFamily: 'ui-monospace, monospace', alignItems: 'center' }}>
              <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.operatorId}</div>
              <div style={{ color: '#a8a29e' }}>{e.domain}</div>
              <div style={{ color: weightColor(e.weight), fontWeight: 600 }}>{e.weight.toFixed(4)}</div>
              <div>{e.decisions}</div>
              <div style={{ color: verdictColor(e.lastVerdict), fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{e.lastVerdict ?? '—'}</div>
              <div style={{ color: '#71717a', fontSize: '0.7rem' }}>{new Date(e.lastUpdatedAt).toLocaleString()}</div>
            </div>
          ))
        )}
      </div>

      <div style={{ marginTop: '1.25rem', padding: '0.85rem 1rem', border: '1px solid #292524', borderRadius: 6, fontSize: '0.7rem', color: '#a8a29e', fontFamily: 'ui-monospace, monospace', lineHeight: 1.7 }}>
        <div style={{ color: '#d6d3d1', fontWeight: 600, marginBottom: 6 }}>update rule</div>
        approve   → w += +0.04 · (1 − w/1.20)   <span style={{ color: '#71717a' }}>(asymptotic toward 1.20)</span><br />
        deny      → w += −0.06 · (w/0.80 − 1)   <span style={{ color: '#71717a' }}>(asymptotic toward 0.80)</span><br />
        escalate  → w += −0.02                  <span style={{ color: '#71717a' }}>(mild dampening)</span>
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div style={{ padding: '0.85rem 1rem', border: '1px solid #292524', borderRadius: 8, background: '#0c0a09' }}>
      <div style={{ fontSize: '0.6rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: '#71717a', fontFamily: 'ui-monospace, monospace' }}>{label}</div>
      <div style={{ fontSize: '1.4rem', color: accent, marginTop: 4, fontFamily: 'ui-monospace, monospace' }}>{value}</div>
    </div>
  );
}
