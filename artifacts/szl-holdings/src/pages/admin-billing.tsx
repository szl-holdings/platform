import { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api';
import { useLocation } from 'wouter';

interface OrgSubscription {
  orgId: string;
  orgName: string;
  product: string;
  planTier: string;
  status: string;
  stripeSubscriptionId: string | null;
  stripeCustomerId: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
}

interface EntitlementOverride {
  id: string;
  orgId: string;
  product: string;
  featureKey: string;
  grantedAt: string;
  expiresAt: string | null;
  grantedBy: string;
}

const ACCENT = '#6366f1';

export default function AdminBillingPage() {
  const [, navigate] = useLocation();
  const [subs, setSubs] = useState<OrgSubscription[]>([]);
  const [overrides, setOverrides] = useState<EntitlementOverride[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'subscriptions' | 'overrides'>('subscriptions');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [productFilter, setProductFilter] = useState('all');
  const [actionResult, setActionResult] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      apiRequest('GET', '/api/billing/admin/subscriptions'),
      apiRequest('GET', '/api/billing/admin/entitlement-overrides'),
    ])
      .then(async ([subsRes, overridesRes]) => {
        const subsData = await subsRes.json();
        const overridesData = await overridesRes.json();
        setSubs(subsData.subscriptions ?? []);
        setOverrides(overridesData.overrides ?? []);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleResync = async (orgId: string, product: string) => {
    setActionResult(null);
    try {
      const res = await apiRequest('POST', `/api/billing/admin/resync`, { orgId, product });
      const data = await res.json();
      setActionResult(data.message ?? 'Resynced successfully');
      setSubs((prev) =>
        prev.map((s) =>
          s.orgId === orgId && s.product === product ? { ...s, ...data.subscription } : s,
        ),
      );
    } catch {
      setActionResult('Resync failed — check server logs');
    }
  };

  const handleRevokeOverride = async (id: string) => {
    setActionResult(null);
    try {
      await apiRequest('DELETE', `/api/billing/admin/entitlement-overrides/${id}`);
      setOverrides((prev) => prev.filter((o) => o.id !== id));
      setActionResult('Override revoked');
    } catch {
      setActionResult('Revoke failed — check server logs');
    }
  };

  const filteredSubs = subs.filter((s) => {
    const matchSearch =
      !search ||
      s.orgName.toLowerCase().includes(search.toLowerCase()) ||
      s.orgId.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || s.status === statusFilter;
    const matchProduct = productFilter === 'all' || s.product === productFilter;
    return matchSearch && matchStatus && matchProduct;
  });

  const products = Array.from(new Set(subs.map((s) => s.product))).sort();
  const statuses = Array.from(new Set(subs.map((s) => s.status))).sort();

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      active: '#22c55e',
      trialing: '#f59e0b',
      past_due: '#ef4444',
      canceled: '#6b7280',
      inactive: '#6b7280',
    };
    return (
      <span
        className="px-2 py-0.5 rounded text-xs font-medium"
        style={{
          backgroundColor: `${colors[status] ?? '#6b7280'}22`,
          color: colors[status] ?? '#6b7280',
          border: `1px solid ${colors[status] ?? '#6b7280'}44`,
        }}
      >
        {status}
      </span>
    );
  };

  return (
    <div className="min-h-screen p-6" style={{ background: '#0b0d11', color: '#e2e8f0' }}>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <button
              onClick={() => navigate('/admin')}
              className="text-xs mb-2 flex items-center gap-1"
              style={{ color: 'rgba(255,255,255,0.4)' }}
            >
              ← Back to Admin
            </button>
            <h1 className="text-2xl font-bold" style={{ color: ACCENT }}>
              Admin Billing Console
            </h1>
            <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
              View and manage subscriptions and entitlement overrides across all products.
            </p>
          </div>
          <div className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
            {subs.length} orgs · {overrides.length} overrides
          </div>
        </div>

        {actionResult && (
          <div
            className="mb-4 px-4 py-3 rounded-lg text-sm"
            style={{ background: '#1e293b', color: '#94a3b8', border: '1px solid #334155' }}
          >
            {actionResult}
          </div>
        )}

        <div className="flex gap-1 mb-4">
          {(['subscriptions', 'overrides'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{
                background: tab === t ? ACCENT : 'transparent',
                color: tab === t ? '#fff' : 'rgba(255,255,255,0.5)',
                border: `1px solid ${tab === t ? ACCENT : 'rgba(255,255,255,0.1)'}`,
              }}
            >
              {t === 'subscriptions' ? 'Subscriptions' : 'Entitlement Overrides'}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48" style={{ color: 'rgba(255,255,255,0.3)' }}>
            Loading…
          </div>
        ) : tab === 'subscriptions' ? (
          <>
            <div className="flex gap-3 mb-4 flex-wrap">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search org…"
                className="px-3 py-2 rounded-lg text-sm flex-1 min-w-[180px]"
                style={{
                  background: '#1e293b',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#e2e8f0',
                  outline: 'none',
                }}
              />
              <select
                value={productFilter}
                onChange={(e) => setProductFilter(e.target.value)}
                className="px-3 py-2 rounded-lg text-sm"
                style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0' }}
              >
                <option value="all">All Products</option>
                {products.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-lg text-sm"
                style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0' }}
              >
                <option value="all">All Statuses</option>
                {statuses.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {filteredSubs.length === 0 ? (
              <div
                className="text-center py-12 rounded-xl text-sm"
                style={{ background: '#1e293b', color: 'rgba(255,255,255,0.3)' }}
              >
                No subscriptions match your filters.
              </div>
            ) : (
              <div
                className="rounded-xl overflow-hidden"
                style={{ border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ background: '#1a1f2e', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      {['Org', 'Product', 'Plan', 'Status', 'Period End', 'Actions'].map((h) => (
                        <th
                          key={h}
                          className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                          style={{ color: 'rgba(255,255,255,0.4)' }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSubs.map((s, i) => (
                      <tr
                        key={`${s.orgId}-${s.product}`}
                        style={{
                          background: i % 2 === 0 ? '#0f1318' : '#131720',
                          borderBottom: '1px solid rgba(255,255,255,0.04)',
                        }}
                      >
                        <td className="px-4 py-3">
                          <div className="font-medium" style={{ color: '#e2e8f0' }}>
                            {s.orgName}
                          </div>
                          <div className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>
                            {s.orgId}
                          </div>
                        </td>
                        <td className="px-4 py-3" style={{ color: '#94a3b8' }}>
                          {s.product}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className="px-2 py-0.5 rounded text-xs font-medium"
                            style={{
                              background: `${ACCENT}22`,
                              color: ACCENT,
                              border: `1px solid ${ACCENT}44`,
                            }}
                          >
                            {s.planTier}
                          </span>
                        </td>
                        <td className="px-4 py-3">{statusBadge(s.status)}</td>
                        <td className="px-4 py-3 text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
                          {s.currentPeriodEnd
                            ? new Date(s.currentPeriodEnd).toLocaleDateString()
                            : '—'}
                          {s.cancelAtPeriodEnd && (
                            <span className="ml-2 text-orange-400 text-xs">cancels</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => handleResync(s.orgId, s.product)}
                            className="px-3 py-1 rounded text-xs font-medium transition-colors hover:opacity-80"
                            style={{
                              background: 'rgba(255,255,255,0.06)',
                              border: '1px solid rgba(255,255,255,0.1)',
                              color: '#94a3b8',
                            }}
                          >
                            Resync
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        ) : (
          <div>
            {overrides.length === 0 ? (
              <div
                className="text-center py-12 rounded-xl text-sm"
                style={{ background: '#1e293b', color: 'rgba(255,255,255,0.3)' }}
              >
                No active entitlement overrides.
              </div>
            ) : (
              <div
                className="rounded-xl overflow-hidden"
                style={{ border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ background: '#1a1f2e', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      {['Org', 'Product', 'Feature', 'Granted', 'Expires', 'Actions'].map((h) => (
                        <th
                          key={h}
                          className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                          style={{ color: 'rgba(255,255,255,0.4)' }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {overrides.map((o, i) => (
                      <tr
                        key={o.id}
                        style={{
                          background: i % 2 === 0 ? '#0f1318' : '#131720',
                          borderBottom: '1px solid rgba(255,255,255,0.04)',
                        }}
                      >
                        <td className="px-4 py-3 text-xs" style={{ color: '#94a3b8' }}>
                          {o.orgId}
                        </td>
                        <td className="px-4 py-3 text-xs" style={{ color: '#94a3b8' }}>
                          {o.product}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className="px-2 py-0.5 rounded text-xs font-mono"
                            style={{ background: '#1e293b', color: ACCENT }}
                          >
                            {o.featureKey}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
                          {new Date(o.grantedAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
                          {o.expiresAt ? new Date(o.expiresAt).toLocaleDateString() : 'Never'}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => handleRevokeOverride(o.id)}
                            className="px-3 py-1 rounded text-xs font-medium transition-colors hover:opacity-80"
                            style={{
                              background: 'rgba(239,68,68,0.1)',
                              border: '1px solid rgba(239,68,68,0.2)',
                              color: '#ef4444',
                            }}
                          >
                            Revoke
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
