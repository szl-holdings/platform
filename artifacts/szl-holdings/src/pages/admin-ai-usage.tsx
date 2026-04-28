import { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  BarChart3,
  Brain,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  DollarSign,
  RefreshCw,
  Save,
  Settings,
  Shield,
  Table,
  Zap,
} from 'lucide-react';
import { apiRequest } from '@/lib/api';

const BASE = '/api';

interface UsageSummary {
  period: { from: string; to: string };
  overall: {
    callCount: number;
    totalTokens: number;
    totalCostUsd: number;
    avgLatencyMs: number;
    errorCount: number;
  };
  byOrg: Array<{ orgId: string; callCount: number; totalCostUsd: number; totalTokens: number }>;
  byProduct: Array<{ surface: string; callCount: number; totalCostUsd: number; totalTokens: number }>;
  byModel: Array<{
    model: string;
    provider: string;
    callCount: number;
    totalCostUsd: number;
    totalTokens: number;
    avgLatencyMs: number;
  }>;
  byProvider: Array<{ provider: string; callCount: number; totalCostUsd: number }>;
  dailyTrend: Array<{ day: string; callCount: number; totalCostUsd: number; totalTokens: number }>;
  monthlyTrend: Array<{ month: string; callCount: number; totalCostUsd: number; totalTokens: number }>;
}

interface TenantBudget {
  id: number;
  orgId: string;
  hourlyLimitUsd: string | null;
  dailyLimitUsd: string | null;
  monthlyLimitUsd: string | null;
  alertThresholdPct: string;
  hardCapEnabled: boolean;
  alertCooldownMinutes: number;
  notes: string | null;
  lastAlertFiredAt: string | null;
  updatedAt: string;
}

interface ModelPrice {
  id: number;
  provider: string;
  model: string;
  inputCostPer1kTokens: string;
  outputCostPer1kTokens: string;
  isActive: boolean;
  updatedAt: string;
}

type Tab = 'overview' | 'by-org' | 'by-product' | 'by-model' | 'budgets' | 'model-prices';

function fmt(n: number, decimals = 2) {
  return n.toFixed(decimals);
}
function fmtCost(n: number) {
  if (n >= 1) return `$${n.toFixed(2)}`;
  if (n >= 0.01) return `$${n.toFixed(4)}`;
  return `$${n.toFixed(6)}`;
}
function fmtNum(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export default function AdminAiUsagePage() {
  const [tab, setTab] = useState<Tab>('overview');
  const [summary, setSummary] = useState<UsageSummary | null>(null);
  const [budgets, setBudgets] = useState<TenantBudget[]>([]);
  const [prices, setPrices] = useState<ModelPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [periodDays, setPeriodDays] = useState(30);
  const [budgetEditId, setBudgetEditId] = useState<string | null>(null);
  const [budgetForm, setBudgetForm] = useState<Partial<TenantBudget & { orgId: string }>>({});
  const [savingBudget, setSavingBudget] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [newOrgId, setNewOrgId] = useState('');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const now = new Date();
      const from = new Date(now.getTime() - periodDays * 86400 * 1000);
      const res = await fetch(
        `${BASE}/ai/usage/summary?from=${from.toISOString()}&to=${now.toISOString()}`,
        { credentials: 'include' },
      );
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      const json = await res.json();
      setSummary(json.data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [periodDays]);

  const fetchBudgets = useCallback(async () => {
    try {
      const res = await fetch(`${BASE}/ai/usage/budgets`, { credentials: 'include' });
      if (!res.ok) return;
      const json = await res.json();
      setBudgets(json.data?.budgets ?? []);
    } catch {}
  }, []);

  const fetchPrices = useCallback(async () => {
    try {
      const res = await fetch(`${BASE}/ai/usage/model-prices`, { credentials: 'include' });
      if (!res.ok) return;
      const json = await res.json();
      setPrices(json.data?.prices ?? []);
    } catch {}
  }, []);

  useEffect(() => {
    fetchSummary();
    fetchBudgets();
    fetchPrices();
  }, [fetchSummary, fetchBudgets, fetchPrices]);

  async function saveBudget() {
    if (!budgetEditId) return;
    setSavingBudget(true);
    setSaveMsg(null);
    try {
      const res = await fetch(`${BASE}/ai/usage/budgets/${encodeURIComponent(budgetEditId)}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hourlyLimitUsd: budgetForm.hourlyLimitUsd ? parseFloat(String(budgetForm.hourlyLimitUsd)) : null,
          dailyLimitUsd: budgetForm.dailyLimitUsd ? parseFloat(String(budgetForm.dailyLimitUsd)) : null,
          monthlyLimitUsd: budgetForm.monthlyLimitUsd ? parseFloat(String(budgetForm.monthlyLimitUsd)) : null,
          alertThresholdPct: parseFloat(String(budgetForm.alertThresholdPct ?? 80)),
          hardCapEnabled: budgetForm.hardCapEnabled ?? true,
          alertCooldownMinutes: parseInt(String(budgetForm.alertCooldownMinutes ?? 60), 10),
          notes: budgetForm.notes || undefined,
        }),
      });
      if (!res.ok) throw new Error(`${res.status}`);
      setSaveMsg('Saved');
      setBudgetEditId(null);
      await fetchBudgets();
    } catch (e: any) {
      setSaveMsg(`Error: ${e.message}`);
    } finally {
      setSavingBudget(false);
    }
  }

  async function deleteBudget(orgId: string) {
    if (!window.confirm(`Remove budget for ${orgId}?`)) return;
    await fetch(`${BASE}/ai/usage/budgets/${encodeURIComponent(orgId)}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    await fetchBudgets();
  }

  function startEditBudget(b: TenantBudget | null, orgIdVal?: string) {
    const oid = b?.orgId ?? orgIdVal ?? '';
    setBudgetEditId(oid);
    setBudgetForm(
      b
        ? { ...b }
        : {
            orgId: oid,
            hourlyLimitUsd: null,
            dailyLimitUsd: null,
            monthlyLimitUsd: null,
            alertThresholdPct: '80',
            hardCapEnabled: true,
            alertCooldownMinutes: 60,
          },
    );
    setSaveMsg(null);
  }

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'by-org', label: 'By Tenant', icon: <Shield className="w-4 h-4" /> },
    { id: 'by-product', label: 'By Product', icon: <Zap className="w-4 h-4" /> },
    { id: 'by-model', label: 'By Model', icon: <Brain className="w-4 h-4" /> },
    { id: 'budgets', label: 'Budget Caps', icon: <DollarSign className="w-4 h-4" /> },
    { id: 'model-prices', label: 'Model Prices', icon: <Table className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold flex items-center gap-3">
              <span className="w-9 h-9 rounded-xl bg-violet-500/15 flex items-center justify-center">
                <Brain className="w-5 h-5 text-violet-400" />
              </span>
              AI Cost & Usage
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Per-tenant and per-product AI spend, token usage, and budget enforcement
            </p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={periodDays}
              onChange={(e) => setPeriodDays(Number(e.target.value))}
              className="bg-card border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-violet-500/30"
            >
              <option value={1}>Today</option>
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
            </select>
            <button
              onClick={fetchSummary}
              className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-lg text-sm hover:bg-muted transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-red-400 text-sm">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        <div className="flex gap-1 mb-8 bg-card border border-border rounded-xl p-1 w-fit">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === t.id
                  ? 'bg-violet-500 text-white shadow'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'overview' && summary && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[
                { label: 'Total Cost', value: fmtCost(summary.overall.totalCostUsd), sub: `${periodDays}d`, color: 'text-violet-400' },
                { label: 'API Calls', value: fmtNum(summary.overall.callCount), sub: 'requests', color: 'text-blue-400' },
                { label: 'Total Tokens', value: fmtNum(summary.overall.totalTokens), sub: 'tokens', color: 'text-emerald-400' },
                { label: 'Avg Latency', value: `${Math.round(summary.overall.avgLatencyMs)}ms`, sub: 'per call', color: 'text-amber-400' },
                { label: 'Errors', value: fmtNum(summary.overall.errorCount), sub: 'failed', color: summary.overall.errorCount > 0 ? 'text-red-400' : 'text-muted-foreground' },
              ].map((m) => (
                <div key={m.label} className="bg-card border border-border rounded-xl p-5">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">{m.label}</p>
                  <p className={`text-2xl font-bold ${m.color}`}>{m.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{m.sub}</p>
                </div>
              ))}
            </div>

            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="font-medium mb-4">Daily Cost Trend</h3>
              {summary.dailyTrend.length === 0 ? (
                <p className="text-sm text-muted-foreground">No data for this period.</p>
              ) : (
                <div className="space-y-2">
                  {summary.dailyTrend.slice(-14).map((d) => {
                    const max = Math.max(...summary.dailyTrend.map((x) => x.totalCostUsd), 0.0001);
                    const pct = (d.totalCostUsd / max) * 100;
                    return (
                      <div key={d.day} className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground w-20 shrink-0">
                          {new Date(d.day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                        <div className="flex-1 bg-muted rounded-full h-2">
                          <div
                            className="bg-violet-500 h-2 rounded-full transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground w-20 text-right">
                          {fmtCost(d.totalCostUsd)} · {fmtNum(d.callCount)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="font-medium mb-4">By Provider</h3>
                <div className="space-y-3">
                  {summary.byProvider.map((p) => (
                    <div key={p.provider} className="flex items-center justify-between text-sm">
                      <span className="font-mono text-muted-foreground">{p.provider}</span>
                      <div className="flex items-center gap-4">
                        <span className="text-muted-foreground">{fmtNum(p.callCount)} calls</span>
                        <span className="font-medium">{fmtCost(p.totalCostUsd)}</span>
                      </div>
                    </div>
                  ))}
                  {summary.byProvider.length === 0 && (
                    <p className="text-sm text-muted-foreground">No calls in this period.</p>
                  )}
                </div>
              </div>

              <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="font-medium mb-4">Top Products</h3>
                <div className="space-y-3">
                  {summary.byProduct.slice(0, 8).map((p) => (
                    <div key={p.surface} className="flex items-center justify-between text-sm">
                      <span className="font-mono text-muted-foreground">{p.surface}</span>
                      <div className="flex items-center gap-4">
                        <span className="text-muted-foreground">{fmtNum(p.callCount)} calls</span>
                        <span className="font-medium">{fmtCost(p.totalCostUsd)}</span>
                      </div>
                    </div>
                  ))}
                  {summary.byProduct.length === 0 && (
                    <p className="text-sm text-muted-foreground">No data.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === 'by-org' && summary && (
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Tenant / Org ID</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Calls</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Tokens</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Cost</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Budget</th>
                </tr>
              </thead>
              <tbody>
                {summary.byOrg.map((row) => {
                  const budget = budgets.find((b) => b.orgId === row.orgId);
                  const monthlyLimit = budget?.monthlyLimitUsd ? parseFloat(budget.monthlyLimitUsd) : null;
                  const pct = monthlyLimit ? (row.totalCostUsd / monthlyLimit) * 100 : null;
                  return (
                    <tr key={row.orgId ?? 'unknown'} className="border-b border-border hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 font-mono">{row.orgId ?? '(no org)'}</td>
                      <td className="px-4 py-3 text-right">{fmtNum(row.callCount)}</td>
                      <td className="px-4 py-3 text-right">{fmtNum(row.totalTokens)}</td>
                      <td className="px-4 py-3 text-right font-medium">{fmtCost(row.totalCostUsd)}</td>
                      <td className="px-4 py-3 text-right">
                        {monthlyLimit ? (
                          <span
                            className={`text-xs font-medium ${
                              pct! >= 100
                                ? 'text-red-400'
                                : pct! >= 80
                                ? 'text-amber-400'
                                : 'text-emerald-400'
                            }`}
                          >
                            {fmt(pct!, 1)}% of ${monthlyLimit}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">no cap</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {summary.byOrg.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                      No usage data for this period.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'by-product' && summary && (
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Product Surface</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Calls</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Tokens</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Cost</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Cost / Call</th>
                </tr>
              </thead>
              <tbody>
                {summary.byProduct.map((row) => (
                  <tr key={row.surface} className="border-b border-border hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 font-mono">{row.surface}</td>
                    <td className="px-4 py-3 text-right">{fmtNum(row.callCount)}</td>
                    <td className="px-4 py-3 text-right">{fmtNum(row.totalTokens)}</td>
                    <td className="px-4 py-3 text-right font-medium">{fmtCost(row.totalCostUsd)}</td>
                    <td className="px-4 py-3 text-right text-muted-foreground">
                      {row.callCount > 0 ? fmtCost(row.totalCostUsd / row.callCount) : '—'}
                    </td>
                  </tr>
                ))}
                {summary.byProduct.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                      No usage data.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'by-model' && summary && (
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Model</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Provider</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Calls</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Tokens</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Cost</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Avg Latency</th>
                </tr>
              </thead>
              <tbody>
                {summary.byModel.map((row) => (
                  <tr
                    key={`${row.provider}/${row.model}`}
                    className="border-b border-border hover:bg-muted/20 transition-colors"
                  >
                    <td className="px-4 py-3 font-mono text-xs">{row.model}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded bg-muted text-xs">{row.provider}</span>
                    </td>
                    <td className="px-4 py-3 text-right">{fmtNum(row.callCount)}</td>
                    <td className="px-4 py-3 text-right">{fmtNum(row.totalTokens)}</td>
                    <td className="px-4 py-3 text-right font-medium">{fmtCost(row.totalCostUsd)}</td>
                    <td className="px-4 py-3 text-right text-muted-foreground">
                      {Math.round(row.avgLatencyMs)}ms
                    </td>
                  </tr>
                ))}
                {summary.byModel.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                      No model usage data.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'budgets' && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={newOrgId}
                onChange={(e) => setNewOrgId(e.target.value)}
                placeholder="Org ID (e.g. org_abc123 or default)"
                className="flex-1 bg-card border border-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30"
              />
              <button
                onClick={() => {
                  if (!newOrgId.trim()) return;
                  startEditBudget(null, newOrgId.trim());
                  setNewOrgId('');
                }}
                className="px-4 py-2 bg-violet-500 text-white rounded-lg text-sm font-medium hover:bg-violet-600 transition-colors"
              >
                Add Budget
              </button>
            </div>

            {budgetEditId && (
              <div className="bg-card border border-violet-500/30 rounded-xl p-6 space-y-4">
                <h3 className="font-medium flex items-center gap-2">
                  <Settings className="w-4 h-4 text-violet-400" />
                  {budgets.find((b) => b.orgId === budgetEditId) ? 'Edit' : 'New'} Budget — {budgetEditId}
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  {(['hourlyLimitUsd', 'dailyLimitUsd', 'monthlyLimitUsd'] as const).map((field) => (
                    <div key={field}>
                      <label className="block text-xs text-muted-foreground mb-1 capitalize">
                        {field === 'hourlyLimitUsd' ? 'Hourly' : field === 'dailyLimitUsd' ? 'Daily' : 'Monthly'} Limit (USD)
                      </label>
                      <input
                        type="number"
                        min={0}
                        step={0.01}
                        value={budgetForm[field] ?? ''}
                        onChange={(e) =>
                          setBudgetForm((f) => ({
                            ...f,
                            [field]: e.target.value === '' ? null : e.target.value,
                          }))
                        }
                        placeholder="No limit"
                        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30"
                      />
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Alert Threshold (%)</label>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={budgetForm.alertThresholdPct ?? 80}
                      onChange={(e) =>
                        setBudgetForm((f) => ({ ...f, alertThresholdPct: e.target.value as any }))
                      }
                      className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Alert Cooldown (min)</label>
                    <input
                      type="number"
                      min={5}
                      value={budgetForm.alertCooldownMinutes ?? 60}
                      onChange={(e) =>
                        setBudgetForm((f) => ({ ...f, alertCooldownMinutes: Number(e.target.value) }))
                      }
                      className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30"
                    />
                  </div>
                  <div className="flex items-end">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={budgetForm.hardCapEnabled ?? true}
                        onChange={(e) =>
                          setBudgetForm((f) => ({ ...f, hardCapEnabled: e.target.checked }))
                        }
                        className="rounded border-border"
                      />
                      <span className="text-sm">Hard cap (reject over-limit calls)</span>
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Notes</label>
                  <input
                    type="text"
                    value={budgetForm.notes ?? ''}
                    onChange={(e) => setBudgetForm((f) => ({ ...f, notes: e.target.value }))}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={saveBudget}
                    disabled={savingBudget}
                    className="flex items-center gap-2 px-5 py-2 bg-violet-500 text-white rounded-lg text-sm font-medium hover:bg-violet-600 disabled:opacity-50 transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    {savingBudget ? 'Saving…' : 'Save Budget'}
                  </button>
                  <button
                    onClick={() => setBudgetEditId(null)}
                    className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Cancel
                  </button>
                  {saveMsg && (
                    <span
                      className={`text-sm ${saveMsg.startsWith('Error') ? 'text-red-400' : 'text-emerald-400'}`}
                    >
                      {saveMsg.startsWith('Error') ? <AlertTriangle className="inline w-4 h-4 mr-1" /> : <CheckCircle className="inline w-4 h-4 mr-1" />}
                      {saveMsg}
                    </span>
                  )}
                </div>
              </div>
            )}

            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Org ID</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Hourly</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Daily</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Monthly</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Alert %</th>
                    <th className="text-center px-4 py-3 font-medium text-muted-foreground">Hard Cap</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {budgets.map((b) => (
                    <tr key={b.orgId} className="border-b border-border hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 font-mono">{b.orgId}</td>
                      <td className="px-4 py-3 text-right">
                        {b.hourlyLimitUsd ? `$${parseFloat(b.hourlyLimitUsd).toFixed(2)}` : '—'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {b.dailyLimitUsd ? `$${parseFloat(b.dailyLimitUsd).toFixed(2)}` : '—'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {b.monthlyLimitUsd ? `$${parseFloat(b.monthlyLimitUsd).toFixed(2)}` : '—'}
                      </td>
                      <td className="px-4 py-3 text-right">{b.alertThresholdPct}%</td>
                      <td className="px-4 py-3 text-center">
                        {b.hardCapEnabled ? (
                          <span className="text-red-400 text-xs font-medium">HARD</span>
                        ) : (
                          <span className="text-muted-foreground text-xs">soft</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => startEditBudget(b)}
                            className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => deleteBudget(b.orgId)}
                            className="text-xs text-red-400 hover:text-red-300 transition-colors"
                          >
                            Remove
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {budgets.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                        No budget caps configured. Add one above.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'model-prices' && (
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Provider</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Model</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Input / 1K tokens</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Output / 1K tokens</th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground">Active</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Updated</th>
                </tr>
              </thead>
              <tbody>
                {prices.map((p) => (
                  <tr
                    key={`${p.provider}/${p.model}`}
                    className="border-b border-border hover:bg-muted/20 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded bg-muted text-xs">{p.provider}</span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{p.model}</td>
                    <td className="px-4 py-3 text-right">${parseFloat(p.inputCostPer1kTokens).toFixed(5)}</td>
                    <td className="px-4 py-3 text-right">${parseFloat(p.outputCostPer1kTokens).toFixed(5)}</td>
                    <td className="px-4 py-3 text-center">
                      {p.isActive ? (
                        <CheckCircle className="w-4 h-4 text-emerald-400 mx-auto" />
                      ) : (
                        <span className="text-muted-foreground text-xs">off</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-muted-foreground text-xs">
                      {new Date(p.updatedAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
                {prices.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                      No model prices loaded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
