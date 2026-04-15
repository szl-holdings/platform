import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@szl-holdings/shared-ui/ui/card";
import { Badge } from "@szl-holdings/shared-ui/ui/badge";
import { Button } from "@szl-holdings/shared-ui/ui/button";
import {
  Settings, Plus, RefreshCw, Trash2, CheckCircle, XCircle, Activity,
  AlertTriangle, Loader2, Wifi, ChevronDown, ChevronUp, X, Clock,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const API_BASE = "/api";
async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { credentials: "include", ...options });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

interface RmmProvider {
  id: number;
  name: string;
  provider: string;
  mode: string;
  status: string;
  authType: string;
  config: Record<string, unknown>;
  lastSyncAt: string | null;
  lastErrorAt: string | null;
  lastError: string | null;
  syncIntervalMinutes: number | null;
  deviceCount: number | null;
  notes: string | null;
  createdAt: string;
}

const PROVIDER_OPTIONS = [
  { value: "ninjaone", label: "NinjaOne", type: "rmm", auth: "oauth2", supported: true },
  { value: "connectwise_automate", label: "ConnectWise Automate", type: "rmm", auth: "basic", supported: true },
  { value: "connectwise_manage", label: "ConnectWise Manage", type: "psa", auth: "basic", supported: true },
  { value: "halopsa", label: "HaloPSA", type: "psa", auth: "oauth2", supported: true },
  { value: "datto_rmm", label: "Datto RMM", type: "rmm", auth: "api_key", supported: true },
  { value: "autotask_psa", label: "Autotask PSA", type: "psa", auth: "basic", supported: true },
  { value: "atera", label: "Atera (Coming Soon)", type: "both", auth: "api_key", supported: false },
];

const statusBadge: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
  active: { label: "Connected", className: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20", icon: <CheckCircle className="w-3 h-3" /> },
  error: { label: "Error", className: "text-red-400 bg-red-500/10 border-red-500/20", icon: <XCircle className="w-3 h-3" /> },
  pending: { label: "Pending", className: "text-amber-400 bg-amber-500/10 border-amber-500/20", icon: <Clock className="w-3 h-3" /> },
  inactive: { label: "Inactive", className: "text-muted-foreground bg-muted border-border", icon: <Wifi className="w-3 h-3" /> },
};

function formatAgo(ts: string | null): string {
  if (!ts) return "Never";
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const h = Math.floor(mins / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function getAuthFields(provider: string, authType: string): Array<{ key: string; label: string; placeholder: string; type?: string }> {
  const base = [{ key: "baseUrl", label: "Base URL", placeholder: "https://app.ninjarmm.com" }];
  if (authType === "oauth2") return [...base, { key: "clientId", label: "Client ID", placeholder: "your-client-id" }, { key: "clientSecret", label: "Client Secret", placeholder: "your-client-secret", type: "password" }];
  if (authType === "basic") {
    if (provider === "connectwise_manage") return [...base, { key: "companyId", label: "Company ID", placeholder: "mycompany" }, { key: "clientId", label: "Public Key", placeholder: "public-key" }, { key: "clientSecret", label: "Private Key", placeholder: "private-key", type: "password" }];
    return [...base, { key: "username", label: "Username", placeholder: "admin" }, { key: "password", label: "Password", placeholder: "••••••••", type: "password" }];
  }
  return [...base, { key: "apiKey", label: "API Key", placeholder: "your-api-key", type: "password" }];
}

interface AddProviderFormProps {
  onClose: () => void;
  onSave: (data: Record<string, unknown>) => void;
  loading: boolean;
}

function AddProviderForm({ onClose, onSave, loading }: AddProviderFormProps) {
  const [form, setForm] = useState<Record<string, string>>({
    name: "",
    provider: "ninjaone",
    mode: "both",
    syncIntervalMinutes: "5",
  });

  const selected = PROVIDER_OPTIONS.find(p => p.value === form.provider);
  const authType = selected?.auth ?? "api_key";
  const authFields = getAuthFields(form.provider, authType);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = () => {
    const { name, provider, mode, syncIntervalMinutes, notes, ...rest } = form;
    onSave({
      name, provider, mode, authType,
      syncIntervalMinutes: parseInt(syncIntervalMinutes || "5", 10),
      notes,
      config: rest,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-background border border-border rounded-xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div>
            <p className="font-semibold text-sm flex items-center gap-2"><Plus className="w-4 h-4 text-primary" /> Add Provider Connection</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Connect a PSA or RMM platform for live monitoring and ticket sync</p>
          </div>
          <button onClick={onClose}><X className="w-4 h-4 text-muted-foreground hover:text-foreground" /></button>
        </div>
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs text-muted-foreground block mb-1">Display Name</label>
              <input value={form.name} onChange={e => set("name", e.target.value)} placeholder="e.g. NinjaOne Production" className="w-full px-3 py-2 text-sm bg-muted rounded-lg border border-border focus:outline-none" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Provider</label>
              <select value={form.provider} onChange={e => set("provider", e.target.value)} className="w-full px-3 py-2 text-sm bg-muted rounded-lg border border-border focus:outline-none">
                {PROVIDER_OPTIONS.map(p => <option key={p.value} value={p.value} disabled={!p.supported}>{p.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Mode</label>
              <select value={form.mode} onChange={e => set("mode", e.target.value)} className="w-full px-3 py-2 text-sm bg-muted rounded-lg border border-border focus:outline-none">
                <option value="rmm">RMM only</option>
                <option value="psa">PSA only</option>
                <option value="both">RMM + PSA</option>
              </select>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-muted/40 border border-border">
            <p className="text-xs font-semibold mb-3 flex items-center gap-1.5">
              {authType === "oauth2" ? "OAuth2 Credentials" : authType === "basic" ? "Basic Auth Credentials" : "API Key"} · <Badge variant="outline" className="text-[10px]">{selected?.label}</Badge>
            </p>
            <div className="space-y-3">
              {authFields.map(f => (
                <div key={f.key}>
                  <label className="text-xs text-muted-foreground block mb-1">{f.label}</label>
                  <input
                    value={form[f.key] ?? ""}
                    onChange={e => set(f.key, e.target.value)}
                    placeholder={f.placeholder}
                    type={f.type}
                    className="w-full px-3 py-2 text-sm bg-background rounded-lg border border-border focus:outline-none font-mono"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Sync Interval (minutes)</label>
              <input value={form.syncIntervalMinutes} onChange={e => set("syncIntervalMinutes", e.target.value)} type="number" min={1} max={60} className="w-full px-3 py-2 text-sm bg-muted rounded-lg border border-border focus:outline-none" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Notes (optional)</label>
              <input value={form.notes ?? ""} onChange={e => set("notes", e.target.value)} placeholder="Production instance" className="w-full px-3 py-2 text-sm bg-muted rounded-lg border border-border focus:outline-none" />
            </div>
          </div>

          <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/20">
            <p className="text-[10px] text-blue-400">Credentials are stored encrypted in the database. Use the Test Connection button after saving to verify access.</p>
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={onClose} className="flex-1">Cancel</Button>
            <Button size="sm" onClick={handleSave} disabled={loading || !form.name || !form.provider} className="flex-1">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save & Connect"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProviderSettings() {
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [testingId, setTestingId] = useState<number | null>(null);
  const [testResults, setTestResults] = useState<Record<number, { ok: boolean; latencyMs: number; error?: string }>>({});
  const [syncingId, setSyncingId] = useState<number | null>(null);
  const [syncResults, setSyncResults] = useState<Record<number, { devicesFound: number; syncedAt: string }>>({});

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["rmm-providers"],
    queryFn: () => apiFetch<{ providers: RmmProvider[]; total: number }>("/msp/rmm/providers"),
    staleTime: 30_000,
  });

  const createMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      apiFetch("/msp/rmm/providers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }),
    onSuccess: () => { setShowAddForm(false); queryClient.invalidateQueries({ queryKey: ["rmm-providers"] }); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiFetch(`/msp/rmm/providers/${id}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["rmm-providers"] }),
  });

  const testConnection = async (id: number) => {
    setTestingId(id);
    try {
      const result = await apiFetch<{ connectionTest: { ok: boolean; latencyMs: number; error?: string } }>(`/msp/rmm/providers/${id}/test`, { method: "POST" });
      setTestResults(r => ({ ...r, [id]: result.connectionTest }));
      queryClient.invalidateQueries({ queryKey: ["rmm-providers"] });
    } catch (err) {
      setTestResults(r => ({ ...r, [id]: { ok: false, latencyMs: 0, error: String(err) } }));
    } finally {
      setTestingId(null);
    }
  };

  const syncProvider = async (id: number) => {
    setSyncingId(id);
    try {
      const result = await apiFetch<{ devicesFound: number; syncedAt: string }>(`/msp/rmm/providers/${id}/sync`, { method: "POST" });
      setSyncResults(r => ({ ...r, [id]: result }));
      queryClient.invalidateQueries({ queryKey: ["rmm-providers"] });
    } catch { /* silently fail */ }
    finally { setSyncingId(null); }
  };

  const providers = data?.providers ?? [];

  return (
    <div className="p-6 space-y-6">
      {showAddForm && (
        <AddProviderForm
          onClose={() => setShowAddForm(false)}
          onSave={body => createMutation.mutate(body)}
          loading={createMutation.isPending}
        />
      )}

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Settings className="w-6 h-6 text-primary" /> Provider Settings
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Connect PSA and RMM platforms — NinjaOne, ConnectWise, HaloPSA, Datto, and more
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </Button>
          <Button size="sm" onClick={() => setShowAddForm(true)} className="gap-1.5">
            <Plus className="w-3.5 h-3.5" /> Add Provider
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Providers", value: providers.length, color: "text-sky-400" },
          { label: "Connected", value: providers.filter(p => p.status === "active").length, color: "text-emerald-400" },
          { label: "Errors", value: providers.filter(p => p.status === "error").length, color: "text-red-400" },
        ].map(({ label, value, color }) => (
          <Card key={label}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 2 }).map((_, i) => <div key={i} className="h-24 bg-muted animate-pulse rounded-xl" />)}</div>
      ) : providers.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Settings className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm font-semibold">No providers configured</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
              Connect your PSA or RMM platform to enable live device monitoring, automated healing, and ticket sync.
            </p>
            <Button size="sm" className="mt-4 gap-1.5" onClick={() => setShowAddForm(true)}>
              <Plus className="w-3.5 h-3.5" /> Add Your First Provider
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {providers.map(provider => {
            const badge = statusBadge[provider.status] ?? statusBadge.inactive;
            const isExpanded = expandedId === provider.id;
            const testResult = testResults[provider.id];
            const syncResult = syncResults[provider.id];
            const providerLabel = PROVIDER_OPTIONS.find(p => p.value === provider.provider)?.label ?? provider.provider;

            return (
              <Card key={provider.id} className={provider.status === "error" ? "border-red-500/20" : provider.status === "active" ? "border-emerald-500/10" : ""}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-sm">{provider.name}</p>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded border flex items-center gap-1 ${badge.className}`}>
                          {badge.icon}{badge.label}
                        </span>
                        <Badge variant="outline" className="text-[10px]">{providerLabel}</Badge>
                        <Badge variant="outline" className="text-[10px] capitalize">{provider.mode}</Badge>
                      </div>
                      <div className="mt-1 flex flex-wrap gap-3 text-[10px] text-muted-foreground">
                        <span className="flex items-center gap-1"><Activity className="w-3 h-3" />Last sync: {formatAgo(provider.lastSyncAt)}</span>
                        {provider.deviceCount !== null && provider.deviceCount > 0 && <span>{provider.deviceCount} devices</span>}
                        <span>Every {provider.syncIntervalMinutes ?? 5}m</span>
                        {provider.authType && <span className="font-mono bg-muted px-1 rounded">{provider.authType}</span>}
                      </div>
                      {provider.status === "error" && provider.lastError && (
                        <p className="text-[10px] text-red-400 mt-1 flex items-center gap-1"><AlertTriangle className="w-3 h-3" />{provider.lastError}</p>
                      )}
                      {testResult && (
                        <div className={`mt-2 text-[10px] px-2 py-1 rounded flex items-center gap-1.5 ${testResult.ok ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
                          {testResult.ok ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                          {testResult.ok ? `Connected successfully — ${testResult.latencyMs}ms` : `Failed: ${testResult.error}`}
                        </div>
                      )}
                      {syncResult && (
                        <div className="mt-2 text-[10px] px-2 py-1 rounded flex items-center gap-1.5 bg-blue-500/10 text-blue-400">
                          <RefreshCw className="w-3 h-3" /> Synced {syncResult.devicesFound} devices at {new Date(syncResult.syncedAt).toLocaleTimeString()}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-1.5 shrink-0">
                      <button
                        onClick={() => testConnection(provider.id)}
                        disabled={testingId === provider.id}
                        className="text-[10px] px-2 py-1 bg-primary/10 text-primary rounded hover:bg-primary/20 flex items-center gap-1 transition-colors disabled:opacity-50"
                      >
                        {testingId === provider.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wifi className="w-3 h-3" />}
                        {testingId === provider.id ? "Testing…" : "Test"}
                      </button>
                      <button
                        onClick={() => syncProvider(provider.id)}
                        disabled={syncingId === provider.id}
                        className="text-[10px] px-2 py-1 bg-muted border border-border rounded hover:bg-muted/80 flex items-center gap-1 transition-colors disabled:opacity-50"
                      >
                        {syncingId === provider.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                        Sync
                      </button>
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : provider.id)}
                        className="text-[10px] px-2 py-1 bg-muted border border-border rounded hover:bg-muted/80 flex items-center gap-1 transition-colors"
                      >
                        {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        {isExpanded ? "Less" : "Details"}
                      </button>
                      <button
                        onClick={() => deleteMutation.mutate(provider.id)}
                        disabled={deleteMutation.isPending}
                        className="text-[10px] px-2 py-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded hover:bg-red-500/20 flex items-center gap-1 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" /> Remove
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div className="space-y-2">
                          <p className="font-semibold text-muted-foreground uppercase text-[10px] tracking-wider">Provider Info</p>
                          <div className="space-y-1">
                            <div className="flex justify-between"><span className="text-muted-foreground">Provider</span><span className="font-mono">{providerLabel}</span></div>
                            <div className="flex justify-between"><span className="text-muted-foreground">Mode</span><span className="capitalize">{provider.mode}</span></div>
                            <div className="flex justify-between"><span className="text-muted-foreground">Auth Type</span><span className="font-mono">{provider.authType}</span></div>
                            <div className="flex justify-between"><span className="text-muted-foreground">Sync Interval</span><span>{provider.syncIntervalMinutes ?? 5} minutes</span></div>
                            <div className="flex justify-between"><span className="text-muted-foreground">Base URL</span><span className="font-mono truncate max-w-[150px]">{(provider.config.baseUrl as string) || "—"}</span></div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <p className="font-semibold text-muted-foreground uppercase text-[10px] tracking-wider">Sync Status</p>
                          <div className="space-y-1">
                            <div className="flex justify-between"><span className="text-muted-foreground">Last Sync</span><span>{formatAgo(provider.lastSyncAt)}</span></div>
                            <div className="flex justify-between"><span className="text-muted-foreground">Devices</span><span>{provider.deviceCount ?? 0}</span></div>
                            {provider.status === "error" && <div className="flex justify-between"><span className="text-muted-foreground">Last Error</span><span>{formatAgo(provider.lastErrorAt)}</span></div>}
                            <div className="flex justify-between"><span className="text-muted-foreground">Added</span><span>{new Date(provider.createdAt).toLocaleDateString()}</span></div>
                          </div>
                        </div>
                      </div>
                      {provider.notes && (
                        <p className="mt-3 text-[10px] text-muted-foreground p-2 bg-muted/40 rounded">{provider.notes}</p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Card className="bg-muted/30">
        <CardHeader className="pb-2"><CardTitle className="text-sm">Supported Integrations</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {PROVIDER_OPTIONS.map(p => (
              <div key={p.value} className="p-2.5 bg-muted/40 rounded-lg text-center">
                <p className="text-xs font-semibold">{p.label}</p>
                <p className="text-[10px] text-muted-foreground capitalize mt-0.5">{p.type} · {p.auth}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
