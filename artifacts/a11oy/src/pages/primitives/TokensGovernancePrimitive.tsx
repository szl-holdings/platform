import { useState } from 'react';
import { Layout } from '../../components/layout';
import { PageHeader, Card, KpiCard } from '../../components/ui';

const GOLD = '#c9b787';

interface TokenEntry {
  id: string;
  name: string;
  type: 'covenant-key' | 'proof-bound' | 'federation';
  scope: string;
  issuedTo: string;
  issuedAt: string;
  expiresAt: string | null;
  lastUsed: string;
  rotations: number;
  status: 'active' | 'expiring' | 'expired' | 'revoked';
  usageToday: number;
}

const TOKENS: TokenEntry[] = [
  { id: 'tk-1', name: 'cascade-prod-key', type: 'covenant-key', scope: 'maritime:*, proof-chain:write', issuedTo: 'Workcell: cascade-prod-1', issuedAt: '2026-02-10', expiresAt: '2026-08-10', lastUsed: '2026-05-05T09:01Z', rotations: 2, status: 'active', usageToday: 3421 },
  { id: 'tk-2', name: 'counsel-prod-key', type: 'covenant-key', scope: 'legal:*, proof-chain:write, shadow-council:read', issuedTo: 'Workcell: counsel-prod-1', issuedAt: '2026-01-22', expiresAt: '2026-07-22', lastUsed: '2026-05-05T07:18Z', rotations: 3, status: 'expiring', usageToday: 892 },
  { id: 'tk-3', name: 'guardian-noc-key', type: 'covenant-key', scope: 'security:*, proof-chain:write', issuedTo: 'Workcell: guardian-noc-1', issuedAt: '2026-03-01', expiresAt: '2026-09-01', lastUsed: '2026-05-05T09:01Z', rotations: 1, status: 'active', usageToday: 18421 },
  { id: 'tk-4', name: 'spiffe://a11oy.szl/cascade-exec:4421', type: 'proof-bound', scope: 'Bound to proof-chain:chain-001, workcell:cascade-prod-1', issuedTo: 'Cascade Navigator (execution)', issuedAt: '2026-05-05T09:01Z', expiresAt: null, lastUsed: '2026-05-05T09:01Z', rotations: 0, status: 'active', usageToday: 1 },
  { id: 'tk-5', name: 'entra:sarah.chen@szl.io', type: 'federation', scope: 'approval:write (VP Operations)', issuedTo: 'Sarah Chen — VP Operations', issuedAt: '2026-01-15', expiresAt: '2027-01-15', lastUsed: '2026-05-05T04:30Z', rotations: 0, status: 'active', usageToday: 4 },
  { id: 'tk-6', name: 'old-cascade-key', type: 'covenant-key', scope: 'maritime:read', issuedTo: 'Decommissioned workcell', issuedAt: '2025-08-01', expiresAt: '2026-02-01', lastUsed: '2026-02-01T00:00Z', rotations: 1, status: 'revoked', usageToday: 0 },
];

const TYPE_LABELS = { 'covenant-key': 'Covenant Key', 'proof-bound': 'Proof-Bound', 'federation': 'Federation' };
const TYPE_COLORS = { 'covenant-key': GOLD, 'proof-bound': '#22c55e', 'federation': '#4d8fcc' };
const STATUS_COLORS: Record<string, string> = { active: '#22c55e', expiring: GOLD, expired: '#f87171', revoked: '#8a8a8a' };

export function TokensGovernancePrimitive() {
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [rotatingId, setRotatingId] = useState<string | null>(null);

  const filtered = TOKENS.filter(t => {
    if (filterStatus !== 'all' && t.status !== filterStatus) return false;
    if (filterType !== 'all' && t.type !== filterType) return false;
    return true;
  });

  function rotate(id: string) {
    setRotatingId(id);
    setTimeout(() => setRotatingId(null), 2000);
  }

  const expiringCount = TOKENS.filter(t => t.status === 'expiring').length;

  return (
    <Layout>
      <PageHeader
        label="PRIMITIVES / TOKENS GOVERNANCE"
        title="Tokens & Credential Governance"
        subtitle="Manage and audit all credentials: Covenant Keys (scoped API keys), Proof-Bound Tokens (SPIFFE/SVID), and Federation tokens (Entra/Okta/Google Workspace). Full rotation history, revocation audit, and expiry warnings."
        status="LIVE"
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KpiCard label="ACTIVE CREDENTIALS" value={String(TOKENS.filter(t => t.status === 'active').length)} sub="in use" accent={GOLD} />
        <KpiCard label="EXPIRING SOON" value={String(expiringCount)} sub="within 90 days" accent={expiringCount > 0 ? '#f87171' : GOLD} />
        <KpiCard label="TOTAL ROTATIONS" value={String(TOKENS.reduce((s, t) => s + t.rotations, 0))} sub="all time" accent={GOLD} />
        <KpiCard label="REVOKED" value={String(TOKENS.filter(t => t.status === 'revoked').length)} sub="preserved for audit" accent="#8a8a8a" />
      </div>

      {expiringCount > 0 && (
        <div className="p-3 rounded-lg mb-6 flex items-center gap-3" style={{ backgroundColor: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.2)' }}>
          <span style={{ color: '#f87171' }}>⚠</span>
          <div className="text-xs" style={{ color: 'var(--color-a11oy-text-sub)' }}>
            <span style={{ color: '#f87171' }}>{expiringCount} credential{expiringCount > 1 ? 's' : ''}</span> expiring within 90 days. Rotate before expiry to avoid Workcell disruption.
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2 mb-6">
        {['all', 'active', 'expiring', 'revoked'].map(s => (
          <button key={s} type="button" onClick={() => setFilterStatus(s)}
            className="px-3 py-1.5 rounded text-xs font-mono"
            style={{ background: filterStatus === s ? 'rgba(201,183,135,0.12)' : 'transparent', color: filterStatus === s ? GOLD : 'var(--color-a11oy-text-ghost)', border: `1px solid ${filterStatus === s ? 'rgba(201,183,135,0.3)' : 'var(--color-a11oy-border)'}`, cursor: 'pointer' }}>{s}</button>
        ))}
        <div className="w-px h-6 self-center" style={{ backgroundColor: 'var(--color-a11oy-border)' }} />
        {(['all', 'covenant-key', 'proof-bound', 'federation'] as const).map(t => (
          <button key={t} type="button" onClick={() => setFilterType(t)}
            className="px-3 py-1.5 rounded text-xs font-mono"
            style={{ background: filterType === t ? 'rgba(201,183,135,0.12)' : 'transparent', color: filterType === t ? GOLD : 'var(--color-a11oy-text-ghost)', border: `1px solid ${filterType === t ? 'rgba(201,183,135,0.3)' : 'var(--color-a11oy-border)'}`, cursor: 'pointer' }}>{t === 'all' ? 'All types' : TYPE_LABELS[t]}</button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.map(tk => {
          const tc = TYPE_COLORS[tk.type];
          const sc = STATUS_COLORS[tk.status];
          const daysToExpiry = tk.expiresAt ? Math.floor((new Date(tk.expiresAt).getTime() - Date.now()) / 86400000) : null;
          return (
            <div key={tk.id} className="rounded-lg border p-4"
              style={{ backgroundColor: 'var(--color-a11oy-card)', borderColor: tk.status === 'expiring' ? 'rgba(248,113,113,0.2)' : 'var(--color-a11oy-border)', opacity: tk.status === 'revoked' ? 0.6 : 1 }}>
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: `${tc}18`, color: tc }}>{TYPE_LABELS[tk.type]}</span>
                  <span className="font-mono text-sm" style={{ color: 'var(--color-a11oy-text)' }}>{tk.name.length > 40 ? `${tk.name.slice(0, 40)}…` : tk.name}</span>
                </div>
                <span className="text-xs font-mono shrink-0" style={{ color: sc }}>{tk.status.toUpperCase()}</span>
              </div>
              <div className="text-xs mb-2" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
                {tk.scope}
              </div>
              <div className="grid grid-cols-3 md:grid-cols-5 gap-2 text-xs">
                <div><div style={{ color: 'var(--color-a11oy-text-ghost)' }}>Issued to</div><div style={{ color: 'var(--color-a11oy-text-sub)' }}>{tk.issuedTo.slice(0, 20)}</div></div>
                <div><div style={{ color: 'var(--color-a11oy-text-ghost)' }}>Rotations</div><div style={{ color: 'var(--color-a11oy-text-sub)' }}>{tk.rotations}</div></div>
                <div><div style={{ color: 'var(--color-a11oy-text-ghost)' }}>Today</div><div style={{ color: 'var(--color-a11oy-text-sub)' }}>{tk.usageToday.toLocaleString()} calls</div></div>
                {tk.expiresAt && <div><div style={{ color: 'var(--color-a11oy-text-ghost)' }}>Expires</div><div style={{ color: daysToExpiry !== null && daysToExpiry < 90 ? '#f87171' : 'var(--color-a11oy-text-sub)' }}>{daysToExpiry !== null ? `${daysToExpiry}d` : 'never'}</div></div>}
              </div>
              {tk.status !== 'revoked' && tk.type === 'covenant-key' && (
                <div className="flex gap-2 mt-3">
                  <button type="button" onClick={() => rotate(tk.id)}
                    className="px-3 py-1 rounded text-xs font-mono"
                    style={{ background: 'rgba(201,183,135,0.08)', color: GOLD, border: '1px solid rgba(201,183,135,0.2)', cursor: 'pointer' }}>
                    {rotatingId === tk.id ? '↻ Rotating…' : 'Rotate'}
                  </button>
                  <button type="button"
                    className="px-3 py-1 rounded text-xs font-mono"
                    style={{ background: 'rgba(248,113,113,0.06)', color: '#f87171', border: '1px solid rgba(248,113,113,0.15)', cursor: 'pointer' }}>
                    Revoke
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-6 p-3 rounded text-xs font-mono" style={{ backgroundColor: 'rgba(201,183,135,0.04)', border: '1px solid rgba(201,183,135,0.12)', color: 'var(--color-a11oy-text-ghost)' }}>
        Provenance: Tokens Governance ported from PRAXIS (/nexus/tokens-governance). Proof-Bound Token type and Federation token types are A11oy additions. Rotation audit trail expanded with Proof Chain attribution.
      </div>
    </Layout>
  );
}
