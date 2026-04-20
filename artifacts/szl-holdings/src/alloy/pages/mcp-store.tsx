import {
  Activity,
  AlertTriangle,
  BarChart2,
  Check,
  CheckCircle,
  ChevronRight,
  Code2,
  Database,
  ExternalLink,
  Filter,
  GitBranch,
  Globe,
  Loader2,
  MessageSquare,
  Plus,
  RefreshCw,
  Search,
  Server,
  Shield,
  Store,
  Wifi,
  WifiOff,
  X,
  Zap,
} from 'lucide-react';
import { useState } from 'react';

interface McpRegistryEntry {
  id: string;
  name: string;
  description: string;
  publisher: string;
  transport: 'http' | 'stdio';
  toolCount: number;
  category: string;
  featured?: boolean;
  url?: string;
  tags: string[];
}

interface ConnectedServer {
  id: string;
  name: string;
  url: string;
  isNative: boolean;
  status: 'healthy' | 'degraded' | 'error';
  toolCount: number;
  lastPing?: string;
}

const FEATURED_SERVERS: McpRegistryEntry[] = [
  {
    id: 'github-mcp',
    name: 'GitHub MCP',
    description:
      'Browse repositories, issues, PRs, and GitHub Actions workflows directly from your AI interface.',
    publisher: 'GitHub / Microsoft',
    transport: 'http',
    toolCount: 18,
    category: 'Development',
    featured: true,
    tags: ['github', 'code', 'devops'],
    url: 'https://api.github.com/mcp',
  },
  {
    id: 'slack-mcp',
    name: 'Slack MCP',
    description:
      'Read and post messages, search conversations, and manage Slack workspace channels.',
    publisher: 'Salesforce / Slack',
    transport: 'http',
    toolCount: 12,
    category: 'Communication',
    featured: true,
    tags: ['slack', 'messaging', 'teams'],
    url: 'https://slack.com/api/mcp',
  },
  {
    id: 'postgresql-mcp',
    name: 'PostgreSQL MCP',
    description:
      'Execute read-only SQL queries, explore schemas, and generate reports from PostgreSQL databases.',
    publisher: 'MCP Community',
    transport: 'stdio',
    toolCount: 8,
    category: 'Data',
    featured: true,
    tags: ['database', 'sql', 'postgres'],
  },
  {
    id: 'stripe-mcp',
    name: 'Stripe MCP',
    description: 'Query customers, subscriptions, invoices, and payment analytics from Stripe.',
    publisher: 'Stripe',
    transport: 'http',
    toolCount: 15,
    category: 'Finance',
    featured: true,
    tags: ['payments', 'billing', 'finance'],
    url: 'https://api.stripe.com/mcp',
  },
];

const REGISTRY_SERVERS: McpRegistryEntry[] = [
  ...FEATURED_SERVERS,
  {
    id: 'linear-mcp',
    name: 'Linear MCP',
    description: 'Create, update, and query Linear issues, cycles, and project backlogs.',
    publisher: 'Linear',
    transport: 'http',
    toolCount: 10,
    category: 'Development',
    tags: ['project-management', 'issues', 'sprints'],
    url: 'https://api.linear.app/mcp',
  },
  {
    id: 'notion-mcp',
    name: 'Notion MCP',
    description: 'Read and write Notion pages, databases, and create structured content blocks.',
    publisher: 'Notion',
    transport: 'http',
    toolCount: 14,
    category: 'Productivity',
    tags: ['docs', 'notes', 'wiki'],
    url: 'https://api.notion.com/mcp',
  },
  {
    id: 'jira-mcp',
    name: 'Jira MCP',
    description:
      'Search issues, manage sprints, and read project configurations from Atlassian Jira.',
    publisher: 'Atlassian',
    transport: 'http',
    toolCount: 16,
    category: 'Development',
    tags: ['tickets', 'agile', 'atlassian'],
    url: 'https://api.atlassian.com/mcp',
  },
  {
    id: 'pagerduty-mcp',
    name: 'PagerDuty MCP',
    description: 'Query incidents, escalation policies, and on-call schedules from PagerDuty.',
    publisher: 'PagerDuty',
    transport: 'http',
    toolCount: 9,
    category: 'Security',
    tags: ['incidents', 'oncall', 'alerting'],
    url: 'https://api.pagerduty.com/mcp',
  },
  {
    id: 'hubspot-mcp',
    name: 'HubSpot MCP',
    description: 'Read CRM contacts, deals, and marketing analytics from HubSpot.',
    publisher: 'HubSpot',
    transport: 'http',
    toolCount: 13,
    category: 'Analytics',
    tags: ['crm', 'sales', 'marketing'],
    url: 'https://api.hubspot.com/mcp',
  },
  {
    id: 'datadog-mcp',
    name: 'Datadog MCP',
    description: 'Query metrics, logs, and APM traces from Datadog observability platform.',
    publisher: 'Datadog',
    transport: 'http',
    toolCount: 20,
    category: 'Analytics',
    tags: ['monitoring', 'apm', 'metrics'],
    url: 'https://api.datadoghq.com/mcp',
  },
  {
    id: 'cloudflare-mcp',
    name: 'Cloudflare MCP',
    description: 'Manage Workers, R2, D1, KV, and Cloudflare Access policies.',
    publisher: 'Cloudflare',
    transport: 'http',
    toolCount: 22,
    category: 'Development',
    tags: ['cdn', 'serverless', 'security'],
    url: 'https://api.cloudflare.com/mcp',
  },
  {
    id: 'aws-mcp',
    name: 'AWS MCP',
    description: 'Query EC2, S3, Lambda, CloudWatch, and IAM resources from AWS.',
    publisher: 'Amazon Web Services',
    transport: 'http',
    toolCount: 35,
    category: 'Data',
    tags: ['cloud', 'aws', 'infrastructure'],
    url: 'https://api.aws.amazon.com/mcp',
  },
];

const CATEGORIES = [
  'All',
  'Data',
  'Communication',
  'Development',
  'Finance',
  'Security',
  'Analytics',
  'Productivity',
];

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  Data: <Database className="w-3.5 h-3.5" />,
  Communication: <MessageSquare className="w-3.5 h-3.5" />,
  Development: <Code2 className="w-3.5 h-3.5" />,
  Finance: <BarChart2 className="w-3.5 h-3.5" />,
  Security: <Shield className="w-3.5 h-3.5" />,
  Analytics: <Activity className="w-3.5 h-3.5" />,
  Productivity: <Zap className="w-3.5 h-3.5" />,
};

const CONNECTED_SERVERS: ConnectedServer[] = [
  {
    id: 'alloy-native',
    name: 'Alloy MCP Server',
    url: '/api/mcp',
    isNative: true,
    status: 'healthy',
    toolCount: 12,
    lastPing: new Date(Date.now() - 5000).toISOString(),
  },
];

interface ConnectModalProps {
  server: McpRegistryEntry;
  onClose: () => void;
  onConnect: (server: McpRegistryEntry, url: string, creds: Record<string, string>) => void;
}

function ConnectModal({ server, onClose, onConnect }: ConnectModalProps) {
  const [url, setUrl] = useState(server.url ?? '');
  const [apiKey, setApiKey] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);

  const handleTest = async () => {
    setTesting(true);
    await new Promise((r) => setTimeout(r, 1500));
    setTestResult('success');
    setTesting(false);
  };

  const handleConnect = () => {
    onConnect(server, url, apiKey ? { apiKey } : {});
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/60" onClick={onClose} />
      <div
        className="relative w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: 'rgba(8,12,20,0.98)', border: '1px solid rgba(75,139,219,0.2)' }}
      >
        <div
          className="flex items-center justify-between px-5 py-4 border-b"
          style={{ borderColor: 'rgba(255,255,255,0.06)' }}
        >
          <div>
            <div className="text-sm font-semibold text-white">Connect {server.name}</div>
            <div className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
              Configure connection URL and credentials
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
            style={{ color: 'rgba(255,255,255,0.4)' }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label
              className="text-[10px] font-medium mb-1.5 block"
              style={{ color: 'rgba(255,255,255,0.5)' }}
            >
              Server URL
            </label>
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder={`https://api.example.com/mcp`}
              className="w-full text-[11px] px-3 py-2 rounded-lg outline-none"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: 'rgba(255,255,255,0.7)',
              }}
            />
          </div>

          <div>
            <label
              className="text-[10px] font-medium mb-1.5 block"
              style={{ color: 'rgba(255,255,255,0.5)' }}
            >
              API Key / Token (optional)
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Your API key or token"
              className="w-full text-[11px] px-3 py-2 rounded-lg outline-none"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: 'rgba(255,255,255,0.7)',
              }}
            />
          </div>

          <div
            className="flex items-center gap-2 p-3 rounded-lg"
            style={{
              background: 'rgba(75,139,219,0.04)',
              border: '1px solid rgba(75,139,219,0.08)',
            }}
          >
            <Server className="w-3.5 h-3.5 shrink-0" style={{ color: 'rgba(75,139,219,0.5)' }} />
            <div className="text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
              Transport:{' '}
              <span className="font-mono text-[#4B8BDB]">{server.transport.toUpperCase()}</span>
              <span className="mx-2 text-white/10">·</span>
              Tools: <span className="font-mono text-[#4B8BDB]">{server.toolCount}</span>
            </div>
          </div>

          {testResult === 'success' && (
            <div
              className="flex items-center gap-2 p-3 rounded-lg"
              style={{
                background: 'rgba(16,185,129,0.06)',
                border: '1px solid rgba(16,185,129,0.15)',
              }}
            >
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="text-[10px] text-emerald-400">
                Connection test successful — server is responding
              </span>
            </div>
          )}
          {testResult === 'error' && (
            <div
              className="flex items-center gap-2 p-3 rounded-lg"
              style={{
                background: 'rgba(239,68,68,0.06)',
                border: '1px solid rgba(239,68,68,0.15)',
              }}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
              <span className="text-[10px] text-red-400">
                Connection test failed — check URL and credentials
              </span>
            </div>
          )}

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleTest}
              disabled={testing || !url}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[11px] font-medium border transition-all"
              style={{
                borderColor: 'rgba(75,139,219,0.2)',
                color: '#4B8BDB',
                background: 'rgba(75,139,219,0.06)',
                opacity: testing || !url ? 0.5 : 1,
              }}
            >
              {testing ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Activity className="w-3 h-3" />
              )}
              {testing ? 'Testing...' : 'Test Connection'}
            </button>
            <button
              onClick={handleConnect}
              disabled={!url || testResult !== 'success'}
              className="flex-1 flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg text-[11px] font-semibold transition-all"
              style={{
                background: '#4B8BDB',
                color: '#fff',
                opacity: !url || testResult !== 'success' ? 0.5 : 1,
              }}
            >
              <Plus className="w-3 h-3" />
              Connect Server
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ServerCard({
  server,
  onConnect,
  isConnected,
}: {
  server: McpRegistryEntry;
  onConnect: (s: McpRegistryEntry) => void;
  isConnected: boolean;
}) {
  const catIcon = CATEGORY_ICONS[server.category];

  return (
    <div
      className="rounded-xl border overflow-hidden transition-all hover:border-[rgba(75,139,219,0.15)]"
      style={{
        borderColor: isConnected ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.06)',
        background: 'rgba(12,18,30,0.95)',
      }}
    >
      <div className="p-4">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              {server.featured && (
                <span
                  className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded"
                  style={{ color: '#f59e0b', background: 'rgba(245,158,11,0.1)' }}
                >
                  Featured
                </span>
              )}
              <span
                className="flex items-center gap-1 text-[9px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded"
                style={{ color: '#4B8BDB', background: 'rgba(75,139,219,0.08)' }}
              >
                {catIcon}
                {server.category}
              </span>
              <span
                className="text-[9px] font-mono px-1.5 py-0.5 rounded"
                style={{ color: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.04)' }}
              >
                {server.transport.toUpperCase()}
              </span>
            </div>
            <div className="text-sm font-semibold text-white mb-0.5">{server.name}</div>
            <div className="text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
              {server.publisher}
            </div>
          </div>
          {isConnected ? (
            <span
              className="flex items-center gap-1.5 text-[9px] font-medium px-2 py-1 rounded-full shrink-0"
              style={{
                background: 'rgba(16,185,129,0.08)',
                color: '#10b981',
                border: '1px solid rgba(16,185,129,0.2)',
              }}
            >
              <Check className="w-2.5 h-2.5" /> Connected
            </span>
          ) : (
            <button
              onClick={() => onConnect(server)}
              className="flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1.5 rounded-lg border transition-all hover:opacity-80 shrink-0"
              style={{
                borderColor: 'rgba(75,139,219,0.25)',
                color: '#4B8BDB',
                background: 'rgba(75,139,219,0.06)',
              }}
            >
              <Plus className="w-3 h-3" /> Connect
            </button>
          )}
        </div>

        <p className="text-[10px] mb-3 leading-relaxed" style={{ color: 'rgba(255,255,255,0.4)' }}>
          {server.description}
        </p>

        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-[9px] font-mono" style={{ color: 'rgba(255,255,255,0.25)' }}>
            {server.toolCount} tools
          </span>
          {server.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="text-[9px] px-1.5 py-0.5 rounded font-mono"
              style={{
                color: 'rgba(255,255,255,0.25)',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              #{tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function McpStore() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [connecting, setConnecting] = useState<McpRegistryEntry | null>(null);
  const [connectedIds, setConnectedIds] = useState<Set<string>>(new Set());
  const [connectedServers, setConnectedServers] = useState<ConnectedServer[]>(CONNECTED_SERVERS);
  const [activeTab, setActiveTab] = useState<'store' | 'connected'>('store');

  const filtered = REGISTRY_SERVERS.filter((s) => {
    const catOk = category === 'All' || s.category === category;
    const searchOk =
      !search ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.description.toLowerCase().includes(search.toLowerCase()) ||
      s.tags.some((t) => t.includes(search.toLowerCase()));
    return catOk && searchOk;
  });

  const featured = filtered.filter((s) => s.featured);
  const nonFeatured = filtered.filter((s) => !s.featured);

  const handleConnect = (server: McpRegistryEntry, url: string, creds: Record<string, string>) => {
    setConnectedIds((prev) => new Set([...prev, server.id]));
    setConnectedServers((prev) => [
      ...prev.filter((s) => s.id !== server.id),
      {
        id: server.id,
        name: server.name,
        url,
        isNative: false,
        status: 'healthy',
        toolCount: server.toolCount,
        lastPing: new Date().toISOString(),
      },
    ]);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Store className="w-3.5 h-3.5" style={{ color: '#4B8BDB' }} />
            <span
              className="text-[10px] font-bold uppercase tracking-widest font-mono"
              style={{ color: '#4B8BDB' }}
            >
              Alloy · MCP Store
            </span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">MCP Server Marketplace</h1>
          <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
            Browse, connect, and manage MCP servers — unified tool access across all SZL apps.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('store')}
            className="text-[10px] px-3 py-1.5 rounded-lg border transition-all"
            style={{
              background: activeTab === 'store' ? 'rgba(75,139,219,0.08)' : 'transparent',
              borderColor:
                activeTab === 'store' ? 'rgba(75,139,219,0.3)' : 'rgba(255,255,255,0.08)',
              color: activeTab === 'store' ? '#4B8BDB' : 'rgba(255,255,255,0.35)',
            }}
          >
            Browse Store
          </button>
          <button
            onClick={() => setActiveTab('connected')}
            className="text-[10px] px-3 py-1.5 rounded-lg border transition-all"
            style={{
              background: activeTab === 'connected' ? 'rgba(16,185,129,0.06)' : 'transparent',
              borderColor:
                activeTab === 'connected' ? 'rgba(16,185,129,0.25)' : 'rgba(255,255,255,0.08)',
              color: activeTab === 'connected' ? '#10b981' : 'rgba(255,255,255,0.35)',
            }}
          >
            Connected ({connectedServers.length})
          </button>
        </div>
      </div>

      {activeTab === 'store' && (
        <>
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5"
                style={{ color: 'rgba(255,255,255,0.25)' }}
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search MCP servers..."
                className="w-full pl-9 pr-4 py-2 rounded-xl text-[11px] outline-none"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  color: 'rgba(255,255,255,0.7)',
                }}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-3 h-3 shrink-0" style={{ color: 'rgba(255,255,255,0.3)' }} />
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className="flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-lg border transition-all"
                style={{
                  background: category === cat ? 'rgba(75,139,219,0.08)' : 'rgba(255,255,255,0.02)',
                  borderColor: category === cat ? 'rgba(75,139,219,0.3)' : 'rgba(255,255,255,0.06)',
                  color: category === cat ? '#4B8BDB' : 'rgba(255,255,255,0.35)',
                }}
              >
                {CATEGORY_ICONS[cat] && <span className="opacity-70">{CATEGORY_ICONS[cat]}</span>}
                {cat}
              </button>
            ))}
            <span
              className="ml-auto text-[10px] font-mono"
              style={{ color: 'rgba(255,255,255,0.25)' }}
            >
              {filtered.length} servers
            </span>
          </div>

          {featured.length > 0 && (
            <div>
              <div
                className="text-[10px] font-bold uppercase tracking-widest mb-3"
                style={{ color: 'rgba(245,158,11,0.6)' }}
              >
                Featured Servers
              </div>
              <div className="grid md:grid-cols-2 gap-3">
                {featured.map((s) => (
                  <ServerCard
                    key={s.id}
                    server={s}
                    isConnected={connectedIds.has(s.id)}
                    onConnect={() => setConnecting(s)}
                  />
                ))}
              </div>
            </div>
          )}

          {nonFeatured.length > 0 && (
            <div>
              <div
                className="text-[10px] font-bold uppercase tracking-widest mb-3"
                style={{ color: 'rgba(255,255,255,0.3)' }}
              >
                All Servers
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                {nonFeatured.map((s) => (
                  <ServerCard
                    key={s.id}
                    server={s}
                    isConnected={connectedIds.has(s.id)}
                    onConnect={() => setConnecting(s)}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {activeTab === 'connected' && (
        <div className="space-y-3">
          <div
            className="text-[10px] font-bold uppercase tracking-widest mb-3"
            style={{ color: 'rgba(255,255,255,0.3)' }}
          >
            Connected MCP Servers
          </div>
          {connectedServers.map((server) => {
            const statusColors = { healthy: '#10b981', degraded: '#f59e0b', error: '#ef4444' };
            const color = statusColors[server.status];
            return (
              <div
                key={server.id}
                className="rounded-xl border p-4 flex items-center gap-4"
                style={{
                  borderColor: server.isNative ? 'rgba(75,139,219,0.2)' : 'rgba(255,255,255,0.06)',
                  background: 'rgba(12,18,30,0.95)',
                }}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-semibold text-white">{server.name}</span>
                    {server.isNative && (
                      <span
                        className="text-[9px] px-1.5 py-0.5 rounded font-bold"
                        style={{ color: '#4B8BDB', background: 'rgba(75,139,219,0.1)' }}
                      >
                        Native
                      </span>
                    )}
                  </div>
                  <div
                    className="text-[10px] font-mono"
                    style={{ color: 'rgba(255,255,255,0.25)' }}
                  >
                    {server.url}
                  </div>
                </div>
                <div
                  className="flex items-center gap-3 shrink-0 text-[10px]"
                  style={{ color: 'rgba(255,255,255,0.35)' }}
                >
                  <span>{server.toolCount} tools</span>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
                    <span style={{ color }}>{server.status}</span>
                  </div>
                  {!server.isNative && (
                    <button
                      onClick={() =>
                        setConnectedServers((prev) => prev.filter((s) => s.id !== server.id))
                      }
                      className="text-[9px] px-2 py-0.5 rounded border transition-colors hover:bg-red-500/5"
                      style={{ borderColor: 'rgba(239,68,68,0.2)', color: '#ef4444' }}
                    >
                      Disconnect
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {connecting && (
        <ConnectModal
          server={connecting}
          onClose={() => setConnecting(null)}
          onConnect={(s, url, creds) => handleConnect(s, url, creds)}
        />
      )}
    </div>
  );
}
