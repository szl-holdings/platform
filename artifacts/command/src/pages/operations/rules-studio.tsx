import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

const BASE_URL = (import.meta.env.BASE_URL ?? '/command/').replace(/\/$/, '');
const API = `${BASE_URL}/api/signal-bus`;

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    credentials: 'include',
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

type Rule = {
  ruleId: string;
  name: string;
  description: string | null;
  enabled: string;
  sourceDomain: string;
  sourceType: string;
  minSeverity: string;
  conditions: Record<string, unknown>;
  actionType: string;
  actionConfig: Record<string, unknown>;
  targetDomain: string | null;
  fireCount: string;
  lastFiredAt: string | null;
  createdAt: string;
};

type RoutedEvent = {
  eventId: string;
  ruleId: string;
  ruleName: string;
  sourceSignalId: string;
  sourceDomain: string;
  sourceType: string;
  actionType: string;
  actionResult: { action: string; detail: string; entityId?: string };
  status: string;
  routedAt: string;
};

type DeadLetter = {
  deadLetterId: string;
  ruleId: string | null;
  sourceSignalId: string;
  sourceDomain: string;
  sourceType: string;
  errorMessage: string;
  createdAt: string;
};

type Stats = {
  totalRules: number;
  enabledRules: number;
  totalRoutedEvents: number;
  totalDeadLetters: number;
  eventsByAction: { actionType: string; count: number }[];
};

const DOMAINS = ['maritime', 'real-estate', 'legal', 'security', 'finance', 'workforce', 'hospitality', 'platform', 'ai', 'cross-domain', '*'];
const SIGNAL_TYPES = ['anomaly', 'risk', 'opportunity', 'threshold-breach', 'state-change', 'position-update', 'sanctions-match', 'deadline', 'escalation', 'market-signal', 'compliance-flag', 'recommendation', 'approval', 'execution', 'outcome', 'telemetry', 'heartbeat', 'connector-event', 'custom', '*'];
const SEVERITIES = ['info', 'low', 'medium', 'high', 'critical'];
const ACTION_TYPES = ['open_matter', 'create_briefing_line', 'portfolio_alert', 'raise_threat', 'publish_signal'];
const SCENARIOS = ['sanctions-hit', 'threat-detected', 'lease-renewal'];

const sevColor: Record<string, string> = {
  info: '#64748b',
  low: '#3b82f6',
  medium: '#f59e0b',
  high: '#f97316',
  critical: '#ef4444',
};

const actionLabel: Record<string, string> = {
  open_matter: 'OPEN MATTER',
  create_briefing_line: 'BRIEFING LINE',
  portfolio_alert: 'PORTFOLIO ALERT',
  raise_threat: 'RAISE THREAT',
  publish_signal: 'PUBLISH SIGNAL',
};

function formatTs(ts: string | null): string {
  if (!ts) return '—';
  return new Date(ts).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export default function RulesStudioPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<'rules' | 'events' | 'dead-letters'>('rules');
  const [showCreate, setShowCreate] = useState(false);

  const statsQ = useQuery({ queryKey: ['signal-bus-stats'], queryFn: () => fetchJson<Stats>(`${API}/stats`), refetchInterval: 8000 });
  const rulesQ = useQuery({ queryKey: ['signal-bus-rules'], queryFn: () => fetchJson<{ rules: Rule[] }>(`${API}/rules`), refetchInterval: 6000 });
  const eventsQ = useQuery({ queryKey: ['signal-bus-events'], queryFn: () => fetchJson<{ events: RoutedEvent[] }>(`${API}/events?limit=100`), refetchInterval: 5000 });
  const dlQ = useQuery({ queryKey: ['signal-bus-dead-letters'], queryFn: () => fetchJson<{ deadLetters: DeadLetter[] }>(`${API}/dead-letters`), refetchInterval: 10000 });

  const seedMut = useMutation({
    mutationFn: () => fetchJson(`${API}/seed-demo-rules`, { method: 'POST' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['signal-bus-rules'] }); qc.invalidateQueries({ queryKey: ['signal-bus-stats'] }); },
  });

  const testFireMut = useMutation({
    mutationFn: (scenario: string) => fetchJson(`${API}/test-fire`, { method: 'POST', body: JSON.stringify({ scenario }) }),
    onSuccess: () => {
      setTimeout(() => {
        qc.invalidateQueries({ queryKey: ['signal-bus-events'] });
        qc.invalidateQueries({ queryKey: ['signal-bus-stats'] });
        qc.invalidateQueries({ queryKey: ['signal-bus-rules'] });
      }, 1500);
    },
  });

  const toggleMut = useMutation({
    mutationFn: ({ ruleId, enabled }: { ruleId: string; enabled: boolean }) =>
      fetchJson(`${API}/rules/${ruleId}`, { method: 'PUT', body: JSON.stringify({ enabled }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['signal-bus-rules'] }),
  });

  const deleteMut = useMutation({
    mutationFn: (ruleId: string) => fetchJson(`${API}/rules/${ruleId}`, { method: 'DELETE' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['signal-bus-rules'] }); qc.invalidateQueries({ queryKey: ['signal-bus-stats'] }); },
  });

  const stats = statsQ.data;
  const rules = rulesQ.data?.rules ?? [];
  const events = eventsQ.data?.events ?? [];
  const deadLetters = dlQ.data?.deadLetters ?? [];

  return (
    <div style={{ padding: '24px 32px', fontFamily: "'Inter', system-ui, sans-serif", color: '#e2e8f0', minHeight: '100vh', background: '#0a0a0f' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '0.05em', margin: 0, color: '#f1f5f9' }}>
            RULES STUDIO
          </h1>
          <p style={{ fontSize: 13, color: '#94a3b8', margin: '4px 0 0', letterSpacing: '0.03em' }}>
            CROSS-DOMAIN SIGNAL BUS — WHEN/THEN AUTOMATION ENGINE
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => seedMut.mutate()} disabled={seedMut.isPending} style={btnStyle('#6366f1')}>
            {seedMut.isPending ? 'SEEDING...' : 'SEED DEMO RULES'}
          </button>
          <button onClick={() => setShowCreate(true)} style={btnStyle('#10b981')}>
            + NEW RULE
          </button>
        </div>
      </div>

      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
          <StatCard label="TOTAL RULES" value={stats.totalRules} accent="#6366f1" />
          <StatCard label="ENABLED" value={stats.enabledRules} accent="#10b981" />
          <StatCard label="ROUTED EVENTS" value={stats.totalRoutedEvents} accent="#3b82f6" />
          <StatCard label="DEAD LETTERS" value={stats.totalDeadLetters} accent={stats.totalDeadLetters > 0 ? '#ef4444' : '#64748b'} />
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {SCENARIOS.map((s) => (
          <button key={s} onClick={() => testFireMut.mutate(s)} disabled={testFireMut.isPending} style={btnStyle('#f59e0b', true)}>
            ⚡ {s.toUpperCase().replace(/-/g, ' ')}
          </button>
        ))}
        {testFireMut.isSuccess && (
          <span style={{ fontSize: 12, color: '#10b981', alignSelf: 'center', marginLeft: 8 }}>SIGNAL FIRED — RULES EVALUATING...</span>
        )}
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 16, borderBottom: '1px solid #1e293b', paddingBottom: 4 }}>
        {(['rules', 'events', 'dead-letters'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '8px 16px', fontSize: 12, fontWeight: 600, letterSpacing: '0.06em',
            border: 'none', cursor: 'pointer', borderRadius: '4px 4px 0 0',
            background: tab === t ? '#1e293b' : 'transparent',
            color: tab === t ? '#f1f5f9' : '#64748b',
          }}>
            {t.toUpperCase().replace(/-/g, ' ')}
            {t === 'events' && events.length > 0 && <span style={{ marginLeft: 6, background: '#3b82f6', color: '#fff', padding: '1px 6px', borderRadius: 8, fontSize: 10 }}>{events.length}</span>}
            {t === 'dead-letters' && deadLetters.length > 0 && <span style={{ marginLeft: 6, background: '#ef4444', color: '#fff', padding: '1px 6px', borderRadius: 8, fontSize: 10 }}>{deadLetters.length}</span>}
          </button>
        ))}
      </div>

      {tab === 'rules' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {rules.length === 0 && (
            <div style={{ textAlign: 'center', padding: 48, color: '#64748b' }}>
              <p style={{ fontSize: 14 }}>NO RULES CONFIGURED</p>
              <p style={{ fontSize: 12 }}>Click "SEED DEMO RULES" to load the three demo flows or "NEW RULE" to create one.</p>
            </div>
          )}
          {rules.map((r) => (
            <div key={r.ruleId} style={{ background: '#111827', border: '1px solid #1e293b', borderRadius: 8, padding: '14px 18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                    <span style={{ fontSize: 15, fontWeight: 600, color: '#f1f5f9' }}>{r.name}</span>
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4, letterSpacing: '0.08em',
                      background: r.enabled === 'true' ? '#065f4620' : '#1e293b',
                      color: r.enabled === 'true' ? '#10b981' : '#64748b',
                      border: `1px solid ${r.enabled === 'true' ? '#10b98140' : '#334155'}`,
                    }}>
                      {r.enabled === 'true' ? 'ACTIVE' : 'DISABLED'}
                    </span>
                  </div>
                  {r.description && <p style={{ fontSize: 12, color: '#94a3b8', margin: '2px 0 8px' }}>{r.description}</p>}
                  <div style={{ display: 'flex', gap: 16, fontSize: 11, color: '#64748b' }}>
                    <span>WHEN <strong style={{ color: '#e2e8f0' }}>{r.sourceDomain}/{r.sourceType}</strong></span>
                    <span>≥ <strong style={{ color: sevColor[r.minSeverity] ?? '#64748b' }}>{r.minSeverity.toUpperCase()}</strong></span>
                    <span>→ <strong style={{ color: '#3b82f6' }}>{actionLabel[r.actionType] ?? r.actionType.toUpperCase()}</strong></span>
                    {r.targetDomain && <span>⟶ <strong style={{ color: '#a78bfa' }}>{r.targetDomain}</strong></span>}
                  </div>
                  <div style={{ display: 'flex', gap: 16, fontSize: 11, color: '#475569', marginTop: 6 }}>
                    <span>FIRED: {r.fireCount}×</span>
                    <span>LAST: {formatTs(r.lastFiredAt)}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => toggleMut.mutate({ ruleId: r.ruleId, enabled: r.enabled !== 'true' })} style={btnStyle(r.enabled === 'true' ? '#f59e0b' : '#10b981', true)}>
                    {r.enabled === 'true' ? 'DISABLE' : 'ENABLE'}
                  </button>
                  <button onClick={() => deleteMut.mutate(r.ruleId)} style={btnStyle('#ef4444', true)}>
                    DELETE
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'events' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {events.length === 0 && (
            <div style={{ textAlign: 'center', padding: 48, color: '#64748b' }}>
              <p style={{ fontSize: 14 }}>NO ROUTED EVENTS YET</p>
              <p style={{ fontSize: 12 }}>Fire a test scenario above to trigger rule evaluation.</p>
            </div>
          )}
          {events.map((e) => (
            <div key={e.eventId} style={{ background: '#111827', border: '1px solid #1e293b', borderRadius: 8, padding: '12px 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: '#3b82f620', color: '#3b82f6', border: '1px solid #3b82f640', letterSpacing: '0.06em' }}>
                      {actionLabel[e.actionType] ?? e.actionType.toUpperCase()}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 500, color: '#e2e8f0' }}>{e.ruleName}</span>
                    <span style={{
                      fontSize: 10, padding: '1px 6px', borderRadius: 4,
                      background: e.status === 'success' ? '#065f4620' : '#7f1d1d20',
                      color: e.status === 'success' ? '#10b981' : '#ef4444',
                    }}>{e.status.toUpperCase()}</span>
                  </div>
                  <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>{e.actionResult?.detail}</p>
                  <div style={{ display: 'flex', gap: 12, fontSize: 10, color: '#475569', marginTop: 4 }}>
                    <span>FROM: {e.sourceDomain}/{e.sourceType}</span>
                    <span>SIGNAL: {e.sourceSignalId.slice(0, 8)}…</span>
                  </div>
                </div>
                <span style={{ fontSize: 11, color: '#475569', whiteSpace: 'nowrap' }}>{formatTs(e.routedAt)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'dead-letters' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {deadLetters.length === 0 && (
            <div style={{ textAlign: 'center', padding: 48, color: '#64748b' }}>
              <p style={{ fontSize: 14 }}>NO DEAD LETTERS</p>
              <p style={{ fontSize: 12 }}>Failed rule executions appear here for replay.</p>
            </div>
          )}
          {deadLetters.map((d) => (
            <div key={d.deadLetterId} style={{ background: '#1c1115', border: '1px solid #7f1d1d40', borderRadius: 8, padding: '12px 16px' }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: '#fca5a5', marginBottom: 4 }}>{d.errorMessage}</div>
              <div style={{ display: 'flex', gap: 12, fontSize: 10, color: '#475569' }}>
                <span>FROM: {d.sourceDomain}/{d.sourceType}</span>
                <span>SIGNAL: {d.sourceSignalId.slice(0, 8)}…</span>
                <span>{formatTs(d.createdAt)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && <CreateRuleModal onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); qc.invalidateQueries({ queryKey: ['signal-bus-rules'] }); qc.invalidateQueries({ queryKey: ['signal-bus-stats'] }); }} />}
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div style={{ background: '#111827', border: '1px solid #1e293b', borderRadius: 8, padding: '14px 18px' }}>
      <div style={{ fontSize: 11, color: '#64748b', letterSpacing: '0.06em', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 700, color: accent }}>{value}</div>
    </div>
  );
}

function CreateRuleModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [sourceDomain, setSourceDomain] = useState('maritime');
  const [sourceType, setSourceType] = useState('sanctions-match');
  const [minSeverity, setMinSeverity] = useState('medium');
  const [actionType, setActionType] = useState('open_matter');
  const [targetDomain, setTargetDomain] = useState('');
  const [saving, setSaving] = useState(false);

  const actionConfigs: Record<string, Record<string, unknown>> = {
    open_matter: { titleTemplate: 'Auto-opened from signal', matterType: 'compliance_review', priority: 'high' },
    create_briefing_line: { priority: 'high', briefingSection: 'alerts' },
    portfolio_alert: { alertType: 'exposure_change', dashboard: 'szl-holdings' },
    raise_threat: { threatCategory: 'escalation' },
    publish_signal: { targetDomain: targetDomain || 'cross-domain', targetType: 'escalation' },
  };

  async function handleSave() {
    if (!name) return;
    setSaving(true);
    try {
      await fetchJson(`${API}/rules`, {
        method: 'POST',
        body: JSON.stringify({ name, description: description || null, sourceDomain, sourceType, minSeverity, actionType, actionConfig: actionConfigs[actionType], targetDomain: targetDomain || null }),
      });
      onCreated();
    } catch { setSaving(false); }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '8px 10px', fontSize: 13, background: '#0f172a', border: '1px solid #334155',
    borderRadius: 4, color: '#e2e8f0', outline: 'none', boxSizing: 'border-box',
  };

  const labelStyle: React.CSSProperties = { fontSize: 11, color: '#94a3b8', letterSpacing: '0.06em', marginBottom: 4, display: 'block' };

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#00000080', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: '#111827', border: '1px solid #1e293b', borderRadius: 12, padding: 28, width: 480, maxHeight: '80vh', overflow: 'auto' }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#f1f5f9', margin: '0 0 20px', letterSpacing: '0.04em' }}>NEW ROUTING RULE</h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={labelStyle}>RULE NAME</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Sanctions Hit → Open Matter" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>DESCRIPTION</label>
            <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What this rule does" style={inputStyle} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>SOURCE DOMAIN</label>
              <select value={sourceDomain} onChange={(e) => setSourceDomain(e.target.value)} style={inputStyle}>
                {DOMAINS.map((d) => <option key={d} value={d}>{d.toUpperCase()}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>SOURCE TYPE</label>
              <select value={sourceType} onChange={(e) => setSourceType(e.target.value)} style={inputStyle}>
                {SIGNAL_TYPES.map((t) => <option key={t} value={t}>{t.toUpperCase()}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>MIN SEVERITY</label>
              <select value={minSeverity} onChange={(e) => setMinSeverity(e.target.value)} style={inputStyle}>
                {SEVERITIES.map((s) => <option key={s} value={s}>{s.toUpperCase()}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>TARGET DOMAIN</label>
              <select value={targetDomain} onChange={(e) => setTargetDomain(e.target.value)} style={inputStyle}>
                <option value="">—</option>
                {DOMAINS.filter((d) => d !== '*').map((d) => <option key={d} value={d}>{d.toUpperCase()}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label style={labelStyle}>ACTION</label>
            <select value={actionType} onChange={(e) => setActionType(e.target.value)} style={inputStyle}>
              {ACTION_TYPES.map((a) => <option key={a} value={a}>{actionLabel[a]}</option>)}
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 24 }}>
          <button onClick={onClose} style={btnStyle('#475569')}>CANCEL</button>
          <button onClick={handleSave} disabled={!name || saving} style={btnStyle('#10b981')}>
            {saving ? 'CREATING...' : 'CREATE RULE'}
          </button>
        </div>
      </div>
    </div>
  );
}

function btnStyle(color: string, small?: boolean): React.CSSProperties {
  return {
    padding: small ? '5px 12px' : '8px 16px',
    fontSize: small ? 10 : 12,
    fontWeight: 700,
    letterSpacing: '0.06em',
    background: `${color}20`,
    color,
    border: `1px solid ${color}40`,
    borderRadius: 4,
    cursor: 'pointer',
  };
}
