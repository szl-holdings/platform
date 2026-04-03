import { useState, useEffect, useCallback } from "react";
import { Gauge, TrendingUp, AlertTriangle, BarChart3 } from "lucide-react";
import { apiFetch, isAuthenticated } from "../../lib/admin-api";
import AuthGate from "@szl-holdings/shared-ui/AuthGate";

interface UsageStats {
  totalRequests: number;
  avgResponseTime: number;
  errorCount: number;
}

interface EndpointUsage {
  endpoint: string;
  method: string;
  totalRequests: number;
  avgResponseTime: number;
}

export default function RateLimits() {
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [byEndpoint, setByEndpoint] = useState<EndpointUsage[]>([]);
  const [selectedKey, setSelectedKey] = useState<number | null>(null);
  const [keys, setKeys] = useState<{ id: number; name: string; keyPrefix: string; rateLimit: number }[]>([]);
  const [period, setPeriod] = useState(24);
  const [loading, setLoading] = useState(false);

  const loadKeys = useCallback(async () => {
    try {
      const data = await apiFetch<{ keys: { id: number; name: string; keyPrefix: string; rateLimit: number }[] }>("/developer/api-keys");
      setKeys(data.keys);
      if (data.keys.length > 0 && !selectedKey) {
        setSelectedKey(data.keys[0].id);
      }
    } catch {}
  }, [selectedKey]);

  const loadUsage = useCallback(async () => {
    if (!selectedKey) return;
    setLoading(true);
    try {
      const data = await apiFetch<{ stats: UsageStats; byEndpoint: EndpointUsage[] }>(`/developer/api-keys/${selectedKey}/usage?hours=${period}`);
      setStats(data.stats);
      setByEndpoint(data.byEndpoint);
    } catch {
      setStats(null);
      setByEndpoint([]);
    }
    setLoading(false);
  }, [selectedKey, period]);

  useEffect(() => {
    if (isAuthenticated()) loadKeys();
  }, [loadKeys]);

  useEffect(() => {
    if (selectedKey) loadUsage();
  }, [selectedKey, loadUsage]);

  if (!isAuthenticated()) {
    return <AuthGate title="Rate Limits & Usage" description="Sign in to view your API usage analytics." onAuth={loadKeys} />;
  }

  const currentKey = keys.find((k) => k.id === selectedKey);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Rate Limits & Usage</h1>
        <p className="text-text-secondary">Monitor your API consumption, response times, and quota utilization.</p>
      </div>

      <div className="bg-surface rounded-xl border border-border p-6">
        <h3 className="font-semibold mb-4">Default Rate Limits</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Global API", value: "200/min", desc: "All endpoints" },
            { label: "Auth", value: "20/15min", desc: "Login attempts" },
            { label: "Write Ops", value: "60/min", desc: "POST, PUT, DELETE" },
            { label: "Webhooks", value: "100/hr", desc: "Per webhook" },
          ].map((limit) => (
            <div key={limit.label} className="p-3 bg-surface-elevated rounded-lg text-center">
              <p className="text-xl font-bold text-accent">{limit.value}</p>
              <p className="text-xs font-medium text-text-primary mt-1">{limit.label}</p>
              <p className="text-[10px] text-text-muted">{limit.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-surface rounded-xl border border-border p-6">
        <h3 className="font-semibold mb-3">Rate Limit Headers</h3>
        <p className="text-sm text-text-secondary mb-3">Every API response includes rate limit headers:</p>
        <div className="space-y-2">
          {[
            { header: "X-RateLimit-Limit", desc: "Maximum requests allowed in the current window" },
            { header: "X-RateLimit-Remaining", desc: "Requests remaining in the current window" },
            { header: "X-RateLimit-Reset", desc: "Unix timestamp when the window resets" },
            { header: "Retry-After", desc: "Seconds to wait before retrying (only on 429)" },
          ].map((h) => (
            <div key={h.header} className="flex items-start gap-3 p-2 bg-surface-elevated rounded-lg">
              <code className="text-xs text-accent font-mono whitespace-nowrap">{h.header}</code>
              <p className="text-xs text-text-secondary">{h.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {keys.length > 0 && (
        <>
          <div className="flex items-center gap-4">
            <select
              value={selectedKey || ""}
              onChange={(e) => setSelectedKey(Number(e.target.value))}
              className="px-3 py-2 bg-surface border border-border rounded-lg text-sm focus:border-accent focus:outline-none"
            >
              {keys.map((k) => (
                <option key={k.id} value={k.id}>{k.name} ({k.keyPrefix})</option>
              ))}
            </select>
            <div className="flex gap-1">
              {[1, 6, 24, 168].map((h) => (
                <button
                  key={h}
                  onClick={() => setPeriod(h)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${period === h ? "bg-accent/20 text-accent" : "bg-surface text-text-muted hover:text-text-secondary"}`}
                >
                  {h}h
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8 text-text-muted">Loading usage data...</div>
          ) : stats ? (
            <>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-surface rounded-xl border border-border p-4 text-center">
                  <TrendingUp className="w-5 h-5 text-info mx-auto mb-2" />
                  <p className="text-2xl font-bold">{stats.totalRequests.toLocaleString()}</p>
                  <p className="text-xs text-text-muted">Total Requests</p>
                  {currentKey && (
                    <div className="mt-2">
                      <div className="h-1.5 bg-surface-elevated rounded-full overflow-hidden">
                        <div
                          className="h-full bg-accent rounded-full"
                          style={{ width: `${Math.min(100, (stats.totalRequests / currentKey.rateLimit) * 100)}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-text-muted mt-1">{currentKey.rateLimit} quota</p>
                    </div>
                  )}
                </div>
                <div className="bg-surface rounded-xl border border-border p-4 text-center">
                  <Gauge className="w-5 h-5 text-success mx-auto mb-2" />
                  <p className="text-2xl font-bold">{stats.avgResponseTime}ms</p>
                  <p className="text-xs text-text-muted">Avg Response Time</p>
                </div>
                <div className="bg-surface rounded-xl border border-border p-4 text-center">
                  <AlertTriangle className="w-5 h-5 text-error mx-auto mb-2" />
                  <p className="text-2xl font-bold">{stats.errorCount}</p>
                  <p className="text-xs text-text-muted">Errors</p>
                </div>
              </div>

              {byEndpoint.length > 0 && (
                <div className="bg-surface rounded-xl border border-border p-4">
                  <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-accent" />
                    Usage by Endpoint
                  </h4>
                  <div className="space-y-2">
                    {byEndpoint.map((ep, i) => {
                      const maxReqs = Math.max(...byEndpoint.map((e) => e.totalRequests));
                      const pct = (ep.totalRequests / maxReqs) * 100;
                      return (
                        <div key={i} className="flex items-center gap-3">
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded min-w-[40px] text-center ${
                            ep.method === "GET" ? "bg-method-get/15 text-method-get" :
                            ep.method === "POST" ? "bg-method-post/15 text-method-post" :
                            ep.method === "DELETE" ? "bg-method-delete/15 text-method-delete" :
                            "bg-method-patch/15 text-method-patch"
                          }`}>{ep.method}</span>
                          <code className="text-xs font-mono text-text-secondary w-48 truncate">{ep.endpoint}</code>
                          <div className="flex-1 h-2 bg-surface-elevated rounded-full overflow-hidden">
                            <div className="h-full bg-accent/50 rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs text-text-muted w-16 text-right">{ep.totalRequests}</span>
                          <span className="text-xs text-text-muted w-16 text-right">{ep.avgResponseTime}ms</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8 bg-surface rounded-xl border border-border">
              <BarChart3 className="w-12 h-12 text-text-muted mx-auto mb-3" />
              <p className="text-text-secondary">No usage data yet for this key</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
