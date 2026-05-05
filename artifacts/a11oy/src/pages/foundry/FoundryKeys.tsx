import { useState } from 'react';
import { Layout } from '../../components/layout';
import { PageHeader, Card, KpiCard } from '../../components/ui';

const GOLD = '#c9b787';

type AuthMode = 'covenant-key' | 'identity-federation' | 'proof-bound-token';

interface CovenantKey {
  id: string;
  name: string;
  scope: string;
  tier: 'standard' | 'elevated' | 'sovereign';
  created: string;
  lastUsed: string;
  callsToday: number;
  status: 'active' | 'revoked';
}

const KEYS: CovenantKey[] = [
  { id: 'ck-1', name: 'cascade-prod-key', scope: 'maritime:*, proof-chain:write', tier: 'elevated', created: '2026-02-10', lastUsed: '2026-05-05T08:42Z', callsToday: 3421, status: 'active' },
  { id: 'ck-2', name: 'counsel-prod-key', scope: 'legal:*, proof-chain:write, shadow-council:read', tier: 'sovereign', created: '2026-01-22', lastUsed: '2026-05-05T07:18Z', callsToday: 892, status: 'active' },
  { id: 'ck-3', name: 'guardian-noc-key', scope: 'security:*, proof-chain:write', tier: 'elevated', created: '2026-03-01', lastUsed: '2026-05-05T09:01Z', callsToday: 18421, status: 'active' },
  { id: 'ck-4', name: 'staging-read-key', scope: 'read-only:*', tier: 'standard', created: '2026-04-15', lastUsed: '2026-05-04T16:40Z', callsToday: 120, status: 'active' },
  { id: 'ck-5', name: 'deprecated-key', scope: 'maritime:*', tier: 'standard', created: '2025-11-01', lastUsed: '2026-04-01T12:00Z', callsToday: 0, status: 'revoked' },
];

const TIER_COLORS = {
  standard: { bg: 'rgba(138,138,138,0.12)', color: '#8a8a8a' },
  elevated: { bg: 'rgba(201,183,135,0.12)', color: GOLD },
  sovereign: { bg: 'rgba(167,139,250,0.12)', color: '#a78bfa' },
};

export function FoundryKeys() {
  const [activeMode, setActiveMode] = useState<AuthMode>('covenant-key');
  const [showNew, setShowNew] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newScope, setNewScope] = useState('');
  const [newTier, setNewTier] = useState<'standard' | 'elevated'>('standard');
  const [created, setCreated] = useState(false);
  const [rotatingId, setRotatingId] = useState<string | null>(null);

  const AUTH_MODES: { id: AuthMode; label: string; icon: string; desc: string }[] = [
    { id: 'covenant-key', label: 'Covenant Key', icon: '🔑', desc: 'Scoped API keys. Each key is bound to a specific set of domains, tools, and governance tiers. Rotation is enforced every 90 days.' },
    { id: 'identity-federation', label: 'Identity Federation', icon: '🏛', desc: 'Federated identity via Entra (Azure AD), Okta, or Google Workspace. Your SSO provider authenticates; A11oy validates the governance tier.' },
    { id: 'proof-bound-token', label: 'Proof-Bound Token', icon: '⛓', desc: 'SPIFFE/SVID credentials that bind agent identity to a specific Proof Chain execution. Token is only valid for the duration of the attested execution.' },
  ];

  function handleCreate() {
    setCreated(true);
    setTimeout(() => { setShowNew(false); setCreated(false); setNewKeyName(''); setNewScope(''); }, 2000);
  }

  return (
    <Layout>
      <PageHeader
        label="AGENT FOUNDRY / KEYS & AUTH"
        title="Authentication Modes"
        subtitle="Three auth modes for governing how agents and services authenticate to the Foundry. Covenant Keys are scoped, not opaque. Identity Federation is provider-agnostic. Proof-Bound Tokens bind credentials to attested execution."
        status="LIVE"
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KpiCard label="ACTIVE KEYS" value={String(KEYS.filter(k => k.status === 'active').length)} sub="covenant keys" accent={GOLD} />
        <KpiCard label="REVOKED KEYS" value={String(KEYS.filter(k => k.status === 'revoked').length)} sub="audit-preserved" accent="#8a8a8a" />
        <KpiCard label="FEDERATION PROVIDERS" value="3" sub="Entra, Okta, Google" accent={GOLD} />
        <KpiCard label="PROOF-BOUND TOKENS" value="38" sub="active sessions" accent="#a78bfa" />
      </div>

      <div className="flex gap-2 mb-6">
        {AUTH_MODES.map(m => (
          <button key={m.id} type="button" onClick={() => setActiveMode(m.id)}
            className="flex-1 p-3 rounded-lg border text-left transition-colors"
            style={{ backgroundColor: activeMode === m.id ? 'rgba(201,183,135,0.06)' : 'var(--color-a11oy-card)', borderColor: activeMode === m.id ? 'rgba(201,183,135,0.3)' : 'var(--color-a11oy-border)', cursor: 'pointer' }}>
            <div className="text-lg mb-1">{m.icon}</div>
            <div className="text-xs font-medium" style={{ color: activeMode === m.id ? GOLD : 'var(--color-a11oy-text)' }}>{m.label}</div>
          </button>
        ))}
      </div>

      <div className="mb-6 p-4 rounded-lg" style={{ backgroundColor: 'var(--color-a11oy-card)', border: '1px solid var(--color-a11oy-border)' }}>
        <div className="text-xs font-mono uppercase tracking-widest mb-2" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
          {AUTH_MODES.find(m => m.id === activeMode)?.label}
        </div>
        <p className="text-sm" style={{ color: 'var(--color-a11oy-text-sub)' }}>
          {AUTH_MODES.find(m => m.id === activeMode)?.desc}
        </p>
        {activeMode === 'identity-federation' && (
          <div className="mt-4 grid grid-cols-3 gap-3">
            {[
              { label: 'Microsoft Entra', status: 'connected', users: 142 },
              { label: 'Okta', status: 'connected', users: 38 },
              { label: 'Google Workspace', status: 'configured', users: 0 },
            ].map(p => (
              <div key={p.label} className="p-3 rounded text-xs" style={{ backgroundColor: 'rgba(0,0,0,0.2)', border: '1px solid var(--color-a11oy-border)' }}>
                <div className="font-medium mb-1" style={{ color: 'var(--color-a11oy-text-sub)' }}>{p.label}</div>
                <div style={{ color: p.status === 'connected' ? '#22c55e' : GOLD }}>{p.status}</div>
                {p.users > 0 && <div style={{ color: 'var(--color-a11oy-text-ghost)' }}>{p.users} federated users</div>}
              </div>
            ))}
          </div>
        )}
        {activeMode === 'proof-bound-token' && (
          <div className="mt-4 p-3 rounded text-xs font-mono" style={{ backgroundColor: 'rgba(167,139,250,0.06)', border: '1px solid rgba(167,139,250,0.15)' }}>
            <div style={{ color: '#a78bfa', marginBottom: 4 }}>SPIFFE Trust Domain: spiffe://a11oy.szl/foundry</div>
            <div style={{ color: 'var(--color-a11oy-text-ghost)' }}>Token lifetime: duration of Proof Chain execution · Bound to correlation ID · Revoked on chain close</div>
          </div>
        )}
      </div>

      {activeMode === 'covenant-key' && (
        <>
          <div className="flex items-center justify-between mb-4">
            <div className="text-xs font-mono uppercase tracking-widest" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Covenant Keys</div>
            <button type="button" onClick={() => setShowNew(true)}
              className="px-3 py-1.5 rounded text-xs font-mono transition-colors"
              style={{ background: 'rgba(201,183,135,0.08)', color: GOLD, border: '1px solid rgba(201,183,135,0.2)', cursor: 'pointer' }}>
              + New Key
            </button>
          </div>

          {showNew && (
            <Card className="mb-4">
              <div className="text-xs font-mono uppercase tracking-widest mb-3" style={{ color: 'var(--color-a11oy-text-ghost)' }}>New Covenant Key</div>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-mono block mb-1" style={{ color: 'var(--color-a11oy-text-ghost)' }}>KEY NAME</label>
                  <input type="text" value={newKeyName} onChange={e => setNewKeyName(e.target.value)} placeholder="e.g. research-swarm-key"
                    className="w-full px-3 py-2 rounded border text-sm bg-transparent outline-none font-mono"
                    style={{ borderColor: 'var(--color-a11oy-border)', color: 'var(--color-a11oy-text)' }} />
                </div>
                <div>
                  <label className="text-xs font-mono block mb-1" style={{ color: 'var(--color-a11oy-text-ghost)' }}>SCOPE</label>
                  <input type="text" value={newScope} onChange={e => setNewScope(e.target.value)} placeholder="e.g. research:*, proof-chain:write"
                    className="w-full px-3 py-2 rounded border text-sm bg-transparent outline-none font-mono"
                    style={{ borderColor: 'var(--color-a11oy-border)', color: 'var(--color-a11oy-text)' }} />
                </div>
                <div>
                  <label className="text-xs font-mono block mb-1" style={{ color: 'var(--color-a11oy-text-ghost)' }}>GOVERNANCE TIER</label>
                  <select value={newTier} onChange={e => setNewTier(e.target.value as 'standard' | 'elevated')}
                    className="w-full px-3 py-2 rounded border text-sm bg-transparent outline-none"
                    style={{ borderColor: 'var(--color-a11oy-border)', color: 'var(--color-a11oy-text)' }}>
                    <option value="standard">Standard</option>
                    <option value="elevated">Elevated (requires alignment approval)</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  {!created ? (
                    <button type="button" onClick={handleCreate}
                      className="flex-1 py-2 rounded text-xs font-mono"
                      style={{ background: 'rgba(201,183,135,0.12)', color: GOLD, border: '1px solid rgba(201,183,135,0.3)', cursor: 'pointer' }}>
                      Generate Key
                    </button>
                  ) : (
                    <div className="flex-1 py-2 text-center text-xs font-mono" style={{ color: '#22c55e' }}>✓ Key created · Secret displayed once — copy now</div>
                  )}
                  <button type="button" onClick={() => setShowNew(false)}
                    className="px-4 py-2 rounded text-xs font-mono"
                    style={{ background: 'transparent', color: 'var(--color-a11oy-text-ghost)', border: '1px solid var(--color-a11oy-border)', cursor: 'pointer' }}>
                    Cancel
                  </button>
                </div>
              </div>
            </Card>
          )}

          <div className="space-y-2">
            {KEYS.map(k => {
              const tier = TIER_COLORS[k.tier];
              return (
                <div key={k.id} className="rounded-lg border p-4"
                  style={{ backgroundColor: 'var(--color-a11oy-card)', borderColor: k.status === 'revoked' ? 'rgba(94,94,94,0.2)' : 'var(--color-a11oy-border)', opacity: k.status === 'revoked' ? 0.6 : 1 }}>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm" style={{ color: k.status === 'revoked' ? 'var(--color-a11oy-text-ghost)' : 'var(--color-a11oy-text)' }}>{k.name}</span>
                        <span className="text-xs font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: tier.bg, color: tier.color }}>{k.tier}</span>
                        {k.status === 'revoked' && <span className="text-xs font-mono" style={{ color: '#f87171' }}>REVOKED</span>}
                      </div>
                      <div className="text-xs font-mono mt-0.5" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{k.scope}</div>
                    </div>
                    <div className="text-right text-xs">
                      <div style={{ color: 'var(--color-a11oy-text-ghost)' }}>Today: {k.callsToday.toLocaleString()} calls</div>
                      <div style={{ color: 'var(--color-a11oy-text-ghost)' }}>Last used: {k.lastUsed ? new Date(k.lastUsed).toLocaleDateString() : 'never'}</div>
                    </div>
                  </div>
                  {k.status === 'active' && (
                    <div className="flex gap-2 mt-2">
                      <button type="button" onClick={() => setRotatingId(k.id)}
                        className="px-3 py-1 rounded text-xs font-mono transition-colors"
                        style={{ background: 'rgba(201,183,135,0.08)', color: GOLD, border: '1px solid rgba(201,183,135,0.2)', cursor: 'pointer' }}>
                        {rotatingId === k.id ? '↻ Rotating…' : 'Rotate Key'}
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
            Provenance: Covenant Key replaces the Unified Command Policy Manager key system. Identity Federation absorbs Command's SSO connector. Proof-Bound Token is a net-new A11oy primitive with no Foundry equivalent.
          </div>
        </>
      )}
    </Layout>
  );
}
