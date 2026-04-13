import { useState, useCallback } from "react";
import {
  Code2, Globe, Shield, Zap, CheckCircle, XCircle, AlertTriangle,
  Plus, ExternalLink, RefreshCw, Activity, Lock, Key, BarChart2,
  Server, Clock, Users, Wifi, WifiOff, Trash2, Edit, Copy,
  Terminal, Package, ChevronRight, ChevronDown, Eye, EyeOff,
} from "lucide-react";

type ServerStatus = "active" | "suspended" | "pending" | "unhealthy";
type AuthScheme = "oauth2" | "api_key" | "none";

interface ExternalMcpServer {
  serverId: string;
  name: string;
  description: string;
  author: string;
  endpoint: string;
  status: ServerStatus;
  authScheme: AuthScheme;
  toolCount: number;
  totalCalls: number;
  callsToday: number;
  avgLatencyMs: number;
  errorRate: number;
  rateLimit: { maxPerMinute: number; maxPerDay: number };
  sandboxed: boolean;
  registeredAt: string;
  lastHealthCheck: string;
  oauthClientId?: string;
}

const DEMO_SERVERS: ExternalMcpServer[] = [
  {
    serverId: "ext_linear_001",
    name: "Linear Project Tracker",
    description: "Create and manage Linear issues, cycles, and projects directly from AI agents.",
    author: "Linear Inc.",
    endpoint: "https://mcp.linear.app/v1",
    status: "active",
    authScheme: "oauth2",
    toolCount: 12,
    totalCalls: 8420,
    callsToday: 312,
    avgLatencyMs: 340,
    errorRate: 0.8,
    rateLimit: { maxPerMinute: 60, maxPerDay: 5000 },
    sandboxed: true,
    registeredAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    lastHealthCheck: new Date(Date.now() - 120000).toISOString(),
    oauthClientId: "lin_oauth_abc123",
  },
  {
    serverId: "ext_notion_002",
    name: "Notion Workspace MCP",
    description: "Read and write Notion pages, databases, and workspace structure for AI-driven documentation.",
    author: "Notion Labs",
    endpoint: "https://api.notion.com/mcp/v1",
    status: "active",
    authScheme: "oauth2",
    toolCount: 9,
    totalCalls: 5130,
    callsToday: 187,
    avgLatencyMs: 520,
    errorRate: 1.2,
    rateLimit: { maxPerMinute: 30, maxPerDay: 3000 },
    sandboxed: true,
    registeredAt: new Date(Date.now() - 21 * 86400000).toISOString(),
    lastHealthCheck: new Date(Date.now() - 60000).toISOString(),
    oauthClientId: "notion_oauth_def456",
  },
  {
    serverId: "ext_hubspot_003",
    name: "HubSpot CRM Bridge",
    description: "Query contacts, companies, deals, and tickets. Automate CRM updates from AI conversations.",
    author: "HubSpot Inc.",
    endpoint: "https://api.hubspot.com/mcp",
    status: "unhealthy",
    authScheme: "api_key",
    toolCount: 15,
    totalCalls: 2810,
    callsToday: 0,
    avgLatencyMs: 1240,
    errorRate: 28.4,
    rateLimit: { maxPerMinute: 10, maxPerDay: 1000 },
    sandboxed: true,
    registeredAt: new Date(Date.now() - 45 * 86400000).toISOString(),
    lastHealthCheck: new Date(Date.now() - 300000).toISOString(),
  },
  {
    serverId: "ext_custom_004",
    name: "Internal Analytics Bridge",
    description: "Custom internal MCP server bridging legacy analytics warehouse to the AI layer.",
    author: "SZL Engineering",
    endpoint: "https://analytics.internal.szl.com/mcp",
    status: "pending",
    authScheme: "none",
    toolCount: 6,
    totalCalls: 0,
    callsToday: 0,
    avgLatencyMs: 0,
    errorRate: 0,
    rateLimit: { maxPerMinute: 100, maxPerDay: 10000 },
    sandboxed: false,
    registeredAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    lastHealthCheck: new Date(Date.now() - 86400000).toISOString(),
  },
];

const STATUS_CONFIG: Record<ServerStatus, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  active: { label: "Active", color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20", icon: CheckCircle },
  suspended: { label: "Suspended", color: "text-amber-400 bg-amber-400/10 border-amber-400/20", icon: AlertTriangle },
  pending: { label: "Pending Review", color: "text-blue-400 bg-blue-400/10 border-blue-400/20", icon: Clock },
  unhealthy: { label: "Unhealthy", color: "text-red-400 bg-red-400/10 border-red-400/20", icon: XCircle },
};

function HealthIndicator({ server }: { server: ExternalMcpServer }) {
  const Icon = STATUS_CONFIG[server.status].icon;
  const color = STATUS_CONFIG[server.status].color;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${color}`}>
      <Icon className="w-3 h-3" />
      {STATUS_CONFIG[server.status].label}
    </span>
  );
}

function RegisterServerModal({ onClose, onRegister }: { onClose: () => void; onRegister: (server: Partial<ExternalMcpServer>) => void }) {
  const [form, setForm] = useState({
    name: "",
    description: "",
    endpoint: "",
    authScheme: "oauth2" as AuthScheme,
    ratePerMinute: 60,
    ratePerDay: 5000,
  });
  const [step, setStep] = useState<"details" | "auth" | "review">("details");
  const [generatedClientId] = useState(`mcp_${Math.random().toString(36).slice(2, 10)}`);
  const [generatedSecret] = useState(`mcp_secret_${Math.random().toString(36).slice(2, 18)}`);
  const [showSecret, setShowSecret] = useState(false);

  function handleSubmit() {
    onRegister({
      serverId: `ext_${Date.now()}`,
      name: form.name,
      description: form.description,
      endpoint: form.endpoint,
      authScheme: form.authScheme,
      status: "pending",
      toolCount: 0,
      totalCalls: 0,
      callsToday: 0,
      avgLatencyMs: 0,
      errorRate: 0,
      rateLimit: { maxPerMinute: form.ratePerMinute, maxPerDay: form.ratePerDay },
      sandboxed: true,
      registeredAt: new Date().toISOString(),
      lastHealthCheck: new Date().toISOString(),
      oauthClientId: form.authScheme === "oauth2" ? generatedClientId : undefined,
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg rounded-2xl bg-[#0f1623] border border-white/10 shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center">
              <Plus className="w-4 h-4 text-violet-400" />
            </div>
            <h2 className="font-semibold text-white">Register External MCP Server</h2>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white/70 transition-colors">✕</button>
        </div>

        <div className="flex gap-0 px-6 pt-4">
          {(["details", "auth", "review"] as const).map((s, i) => (
            <div key={s} className="flex items-center gap-1">
              <div className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full transition-all ${
                s === step ? "bg-violet-500/20 text-violet-400" :
                i < (["details", "auth", "review"].indexOf(step)) ? "text-emerald-400" : "text-white/30"
              }`}>
                {i < (["details", "auth", "review"].indexOf(step)) && <CheckCircle className="w-3 h-3" />}
                {i + 1}. {s.charAt(0).toUpperCase() + s.slice(1)}
              </div>
              {i < 2 && <ChevronRight className="w-3 h-3 text-white/20" />}
            </div>
          ))}
        </div>

        <div className="px-6 py-5 space-y-4">
          {step === "details" && (
            <>
              <div>
                <label className="block text-xs text-white/50 mb-1.5">Server Name *</label>
                <input
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-violet-500/50"
                  placeholder="e.g., My Analytics Bridge"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-xs text-white/50 mb-1.5">Description *</label>
                <textarea
                  rows={3}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-violet-500/50 resize-none"
                  placeholder="Describe what this MCP server does..."
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-xs text-white/50 mb-1.5">Server Endpoint URL *</label>
                <input
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono placeholder-white/30 focus:outline-none focus:border-violet-500/50"
                  placeholder="https://your-server.com/mcp/v1"
                  value={form.endpoint}
                  onChange={e => setForm(f => ({ ...f, endpoint: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-white/50 mb-1.5">Rate Limit (per minute)</label>
                  <input type="number" min="1" max="1000" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500/50" value={form.ratePerMinute} onChange={e => setForm(f => ({ ...f, ratePerMinute: parseInt(e.target.value) || 60 }))} />
                </div>
                <div>
                  <label className="block text-xs text-white/50 mb-1.5">Rate Limit (per day)</label>
                  <input type="number" min="1" max="100000" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500/50" value={form.ratePerDay} onChange={e => setForm(f => ({ ...f, ratePerDay: parseInt(e.target.value) || 5000 }))} />
                </div>
              </div>
            </>
          )}

          {step === "auth" && (
            <>
              <div>
                <label className="block text-xs text-white/50 mb-1.5">Authentication Scheme</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["oauth2", "api_key", "none"] as AuthScheme[]).map(scheme => (
                    <button
                      key={scheme}
                      onClick={() => setForm(f => ({ ...f, authScheme: scheme }))}
                      className={`p-3 rounded-lg border text-xs font-medium transition-all ${
                        form.authScheme === scheme
                          ? "border-violet-500/50 bg-violet-500/10 text-violet-400"
                          : "border-white/10 bg-white/5 text-white/50 hover:border-white/20"
                      }`}
                    >
                      <Lock className="w-4 h-4 mx-auto mb-1" />
                      {scheme === "oauth2" ? "OAuth 2.1" : scheme === "api_key" ? "API Key" : "None"}
                    </button>
                  ))}
                </div>
              </div>

              {form.authScheme === "oauth2" && (
                <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-4 space-y-3">
                  <div className="text-xs font-medium text-blue-400 flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5" /> OAuth 2.1 Credentials (save these securely)
                  </div>
                  <div>
                    <div className="text-[10px] text-white/40 mb-1">Client ID</div>
                    <div className="flex items-center gap-2">
                      <code className="text-xs text-white/70 bg-white/5 px-2 py-1 rounded font-mono flex-1">{generatedClientId}</code>
                      <button onClick={() => navigator.clipboard?.writeText(generatedClientId)} className="text-white/30 hover:text-white/60"><Copy className="w-3 h-3" /></button>
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-white/40 mb-1">Client Secret</div>
                    <div className="flex items-center gap-2">
                      <code className="text-xs text-white/70 bg-white/5 px-2 py-1 rounded font-mono flex-1">
                        {showSecret ? generatedSecret : "•".repeat(24)}
                      </code>
                      <button onClick={() => setShowSecret(!showSecret)} className="text-white/30 hover:text-white/60">
                        {showSecret ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      </button>
                      <button onClick={() => navigator.clipboard?.writeText(generatedSecret)} className="text-white/30 hover:text-white/60"><Copy className="w-3 h-3" /></button>
                    </div>
                  </div>
                  <p className="text-[10px] text-white/40">⚠️ This secret will not be shown again. Copy it now.</p>
                </div>
              )}

              <div className="rounded-lg bg-white/5 border border-white/10 p-4">
                <div className="flex items-center gap-2 text-xs text-white/60 mb-2">
                  <Shield className="w-3.5 h-3.5 text-violet-400" />
                  <span className="font-medium text-white/80">Sandbox Execution</span>
                </div>
                <p className="text-xs text-white/50">All tool calls will execute in an isolated sandbox with 5s timeout, 32MB memory limit, and no network access outside the registered endpoint.</p>
              </div>
            </>
          )}

          {step === "review" && (
            <div className="space-y-3">
              <div className="rounded-lg bg-white/5 border border-white/10 p-4 space-y-2">
                {[
                  ["Server Name", form.name],
                  ["Endpoint", form.endpoint],
                  ["Auth", form.authScheme === "oauth2" ? "OAuth 2.1" : form.authScheme === "api_key" ? "API Key" : "None"],
                  ["Rate Limit", `${form.ratePerMinute}/min, ${form.ratePerDay}/day`],
                  ["Sandbox", "Enabled"],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between text-xs">
                    <span className="text-white/40">{k}</span>
                    <span className="text-white font-mono">{v}</span>
                  </div>
                ))}
              </div>
              <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-3 text-xs text-amber-400">
                ⚠️ Registration is subject to platform review. Status will be <strong>Pending</strong> until approved by an admin.
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-white/10">
          <button
            onClick={() => step === "details" ? onClose() : setStep(step === "auth" ? "details" : "auth")}
            className="text-sm text-white/50 hover:text-white/80 transition-colors"
          >
            {step === "details" ? "Cancel" : "Back"}
          </button>
          <button
            onClick={() => step === "review" ? handleSubmit() : setStep(step === "details" ? "auth" : "review")}
            disabled={step === "details" && (!form.name || !form.endpoint)}
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-2 rounded-lg transition-all"
          >
            {step === "review" ? "Register Server" : "Next"}
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

function ServerRow({ server }: { server: ExternalMcpServer }) {
  const [expanded, setExpanded] = useState(false);
  const lastCheck = new Date(server.lastHealthCheck);
  const checkAge = Math.round((Date.now() - lastCheck.getTime()) / 60000);

  return (
    <div className="border border-white/10 rounded-xl overflow-hidden">
      <div
        className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-white/[0.02] transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
          <Server className="w-5 h-5 text-white/40" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm text-white">{server.name}</span>
            <HealthIndicator server={server} />
            {server.sandboxed && (
              <span className="text-[10px] text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded-full border border-violet-500/20">
                <Shield className="w-2.5 h-2.5 inline mr-0.5" />Sandboxed
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-0.5 text-xs text-white/40">
            <span className="font-mono truncate max-w-xs">{server.endpoint}</span>
            <span>{server.toolCount} tools</span>
            <span>Last check: {checkAge}m ago</span>
          </div>
        </div>
        <div className="flex items-center gap-6 text-center">
          <div>
            <div className="text-sm font-semibold text-white">{server.callsToday.toLocaleString()}</div>
            <div className="text-[10px] text-white/40">Today</div>
          </div>
          <div>
            <div className={`text-sm font-semibold ${server.errorRate > 5 ? "text-red-400" : "text-emerald-400"}`}>
              {server.errorRate.toFixed(1)}%
            </div>
            <div className="text-[10px] text-white/40">Error Rate</div>
          </div>
          <div>
            <div className="text-sm font-semibold text-blue-400">{server.avgLatencyMs || "—"}ms</div>
            <div className="text-[10px] text-white/40">Avg Latency</div>
          </div>
        </div>
        {expanded ? <ChevronDown className="w-4 h-4 text-white/30" /> : <ChevronRight className="w-4 h-4 text-white/30" />}
      </div>

      {expanded && (
        <div className="border-t border-white/5 px-5 py-4 bg-white/[0.01]">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="text-xs font-medium text-white/50 uppercase tracking-wider">Configuration</div>
              {[
                ["Author", server.author],
                ["Auth", server.authScheme === "oauth2" ? `OAuth 2.1 (${server.oauthClientId ?? "—"})` : server.authScheme === "api_key" ? "API Key" : "None"],
                ["Rate Limit", `${server.rateLimit.maxPerMinute}/min • ${server.rateLimit.maxPerDay}/day`],
                ["Sandbox", server.sandboxed ? "Enabled" : "Disabled"],
                ["Registered", new Date(server.registeredAt).toLocaleDateString()],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between text-xs">
                  <span className="text-white/40">{k}</span>
                  <span className="text-white font-mono">{v}</span>
                </div>
              ))}
            </div>
            <div className="space-y-3">
              <div className="text-xs font-medium text-white/50 uppercase tracking-wider">Usage Analytics</div>
              {[
                ["Total Calls", server.totalCalls.toLocaleString()],
                ["Calls Today", server.callsToday.toLocaleString()],
                ["Avg Latency", `${server.avgLatencyMs}ms`],
                ["Error Rate", `${server.errorRate.toFixed(2)}%`],
                ["Tool Count", server.toolCount.toString()],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between text-xs">
                  <span className="text-white/40">{k}</span>
                  <span className="text-white font-mono">{v}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-white/5 flex items-center gap-2">
            <p className="text-xs text-white/50 flex-1">{server.description}</p>
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 px-3 py-1.5 rounded-lg bg-amber-400/10 transition-all">
                <AlertTriangle className="w-3 h-3" /> Suspend
              </button>
              <button className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 px-3 py-1.5 rounded-lg bg-red-400/10 transition-all">
                <Trash2 className="w-3 h-3" /> Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function McpDeveloperPortal() {
  const [servers, setServers] = useState<ExternalMcpServer[]>(DEMO_SERVERS);
  const [showRegister, setShowRegister] = useState(false);
  const [filterStatus, setFilterStatus] = useState<ServerStatus | "all">("all");

  const filtered = filterStatus === "all" ? servers : servers.filter(s => s.status === filterStatus);
  const totalCalls = servers.reduce((a, s) => a + s.totalCalls, 0);
  const activeCount = servers.filter(s => s.status === "active").length;
  const unhealthyCount = servers.filter(s => s.status === "unhealthy").length;

  function handleRegister(partial: Partial<ExternalMcpServer>) {
    setServers(prev => [partial as ExternalMcpServer, ...prev]);
  }

  return (
    <div className="min-h-screen bg-[#080c14] text-white">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <Globe className="w-5 h-5 text-blue-400" />
              </div>
              <h1 className="text-2xl font-bold text-white">MCP Developer Portal</h1>
            </div>
            <p className="text-sm text-white/50">Register and manage external MCP servers with OAuth 2.1, sandboxed execution, and usage analytics</p>
          </div>
          <button
            onClick={() => setShowRegister(true)}
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-all"
          >
            <Plus className="w-4 h-4" /> Register Server
          </button>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-8">
          {[
            { label: "Registered Servers", value: servers.length, icon: Server, color: "text-violet-400" },
            { label: "Active", value: activeCount, icon: CheckCircle, color: "text-emerald-400" },
            { label: "Unhealthy", value: unhealthyCount, icon: XCircle, color: "text-red-400" },
            { label: "Total API Calls", value: totalCalls.toLocaleString(), icon: Activity, color: "text-blue-400" },
          ].map(stat => (
            <div key={stat.label} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <div className="flex items-center gap-2 mb-2">
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
                <span className="text-xs text-white/50">{stat.label}</span>
              </div>
              <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 mb-6">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-medium text-amber-400 mb-1">Security Architecture</div>
              <div className="text-xs text-white/60 space-y-1">
                <div>• All external tools execute in a sandboxed environment with 5s timeout, 32MB memory cap, and network isolation</div>
                <div>• OAuth 2.1 with PKCE required for third-party registration. API key auth available for internal servers</div>
                <div>• Automatic suspension if error rate exceeds 15% over a 10-minute window</div>
                <div>• Every tool call audited with full input/output tracing in the action audit log</div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-4">
          {(["all", "active", "pending", "unhealthy", "suspended"] as const).map(status => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all capitalize ${
                filterStatus === status
                  ? "bg-violet-500/20 text-violet-400 border border-violet-500/30"
                  : "bg-white/5 text-white/40 border border-white/10 hover:border-white/20"
              }`}
            >
              {status === "all" ? `All (${servers.length})` : status}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {filtered.map(server => (
            <ServerRow key={server.serverId} server={server} />
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <Server className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <div className="text-white/40 text-sm">No servers match the current filter</div>
          </div>
        )}

        <div className="mt-8 rounded-xl border border-white/10 bg-white/[0.02] p-6">
          <div className="flex items-center gap-2 mb-4">
            <Terminal className="w-4 h-4 text-violet-400" />
            <h3 className="text-sm font-semibold text-white">Quick Start Guide</h3>
          </div>
          <div className="grid grid-cols-3 gap-4 text-xs text-white/60">
            <div>
              <div className="text-white/80 font-medium mb-2">1. Register Your Server</div>
              <p>Provide your MCP server endpoint URL. We'll generate OAuth 2.1 credentials for secure authentication.</p>
            </div>
            <div>
              <div className="text-white/80 font-medium mb-2">2. Configure Sandboxing</div>
              <p>All tool calls are wrapped in an isolated execution environment. Configure rate limits and resource bounds per your server's capacity.</p>
            </div>
            <div>
              <div className="text-white/80 font-medium mb-2">3. Monitor Usage</div>
              <p>Track calls, latency, and error rates in real time. Servers are automatically suspended if health degrades beyond thresholds.</p>
            </div>
          </div>
        </div>
      </div>

      {showRegister && (
        <RegisterServerModal onClose={() => setShowRegister(false)} onRegister={handleRegister} />
      )}
    </div>
  );
}
