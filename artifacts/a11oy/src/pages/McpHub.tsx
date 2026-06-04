import { useState } from 'react';
import { Layout } from '../components/layout';
import { PageHeader } from '../components/ui';

interface McpServer {
  id: string;
  name: string;
  description: string;
  status: 'connected' | 'degraded' | 'offline';
  tools: McpTool[];
  resources: McpResource[];
  transport: 'stdio' | 'sse' | 'streamable-http';
  version: string;
  latencyMs: number;
  requestsToday: number;
  lastHealthCheck: number;
}

interface McpTool {
  name: string;
  description: string;
  inputSchema: string;
  calls24h: number;
  avgLatencyMs: number;
  errorRate: number;
}

interface McpResource {
  uri: string;
  name: string;
  mimeType: string;
  description: string;
}

const SERVERS: McpServer[] = [
  {
    id: 'mcp-fabric',
    name: 'A11oy Fabric',
    description: 'Core governance fabric — workcells, signals, proof, covenants',
    status: 'connected',
    transport: 'stdio',
    version: '2.4.0',
    latencyMs: 12,
    requestsToday: 2847,
    lastHealthCheck: Date.now() - 30000,
    tools: [
      { name: 'workcell.create', description: 'Create a new governed workcell', inputSchema: '{ signal_id, template, approval_required }', calls24h: 89, avgLatencyMs: 145, errorRate: 0.01 },
      { name: 'workcell.inspect', description: 'Inspect workcell execution state', inputSchema: '{ workcell_id }', calls24h: 312, avgLatencyMs: 42, errorRate: 0 },
      { name: 'workcell.replay', description: 'Replay a workcell from checkpoint', inputSchema: '{ workcell_id, from_step? }', calls24h: 23, avgLatencyMs: 890, errorRate: 0.02 },
      { name: 'signal_mesh.query', description: 'Query the live signal mesh', inputSchema: '{ filter?, severity?, vertical? }', calls24h: 567, avgLatencyMs: 89, errorRate: 0 },
      { name: 'proof.create', description: 'Create cryptographic proof packet', inputSchema: '{ evidence[], attestor }', calls24h: 201, avgLatencyMs: 210, errorRate: 0.005 },
      { name: 'proof.verify', description: 'Verify a proof packet chain', inputSchema: '{ proof_id }', calls24h: 156, avgLatencyMs: 67, errorRate: 0 },
      { name: 'covenant.check', description: 'Check policy compliance', inputSchema: '{ entity_id, policy_id? }', calls24h: 445, avgLatencyMs: 35, errorRate: 0 },
      { name: 'covenant.lift', description: 'Request emergency covenant lift', inputSchema: '{ policy_id, reason, duration }', calls24h: 3, avgLatencyMs: 1200, errorRate: 0 },
    ],
    resources: [
      { uri: 'a11oy://signals/active', name: 'Active Signals', mimeType: 'application/json', description: 'Real-time active signal feed' },
      { uri: 'a11oy://workcells/running', name: 'Running Workcells', mimeType: 'application/json', description: 'Currently executing workcells' },
      { uri: 'a11oy://proof/ledger', name: 'Proof Ledger', mimeType: 'application/json', description: 'Cryptographic proof chain' },
    ],
  },
  {
    id: 'mcp-knowledge',
    name: 'Knowledge Store',
    description: 'Agentic RAG — vector retrieval, semantic search, document ingestion',
    status: 'connected',
    transport: 'streamable-http',
    version: '1.8.0',
    latencyMs: 34,
    requestsToday: 1203,
    lastHealthCheck: Date.now() - 15000,
    tools: [
      { name: 'knowledge.search', description: 'Semantic search across knowledge base', inputSchema: '{ query, top_k?, filters? }', calls24h: 678, avgLatencyMs: 156, errorRate: 0.01 },
      { name: 'knowledge.ingest', description: 'Ingest document into knowledge store', inputSchema: '{ content, metadata, chunk_strategy? }', calls24h: 45, avgLatencyMs: 2300, errorRate: 0.03 },
      { name: 'knowledge.graph_query', description: 'Query the knowledge graph', inputSchema: '{ cypher_query }', calls24h: 234, avgLatencyMs: 89, errorRate: 0.005 },
      { name: 'knowledge.rerank', description: 'Re-rank retrieved passages', inputSchema: '{ query, passages[] }', calls24h: 246, avgLatencyMs: 78, errorRate: 0 },
    ],
    resources: [
      { uri: 'a11oy://knowledge/collections', name: 'Collections', mimeType: 'application/json', description: 'All document collections' },
      { uri: 'a11oy://knowledge/graph', name: 'Knowledge Graph', mimeType: 'application/json', description: 'Entity relationship graph' },
    ],
  },
  {
    id: 'mcp-github',
    name: 'GitHub',
    description: 'Repository access, PR management, code search, issue tracking',
    status: 'connected',
    transport: 'stdio',
    version: '2026.1.26',
    latencyMs: 89,
    requestsToday: 456,
    lastHealthCheck: Date.now() - 45000,
    tools: [
      { name: 'github.search_code', description: 'Search code across repositories', inputSchema: '{ query, repo?, language? }', calls24h: 123, avgLatencyMs: 340, errorRate: 0.02 },
      { name: 'github.create_pr', description: 'Create a pull request', inputSchema: '{ repo, title, body, branch }', calls24h: 12, avgLatencyMs: 1100, errorRate: 0.05 },
      { name: 'github.list_issues', description: 'List repository issues', inputSchema: '{ repo, state?, labels? }', calls24h: 89, avgLatencyMs: 210, errorRate: 0.01 },
      { name: 'github.get_file', description: 'Read file from repository', inputSchema: '{ repo, path, ref? }', calls24h: 232, avgLatencyMs: 180, errorRate: 0 },
    ],
    resources: [
      { uri: 'github://repos', name: 'Repositories', mimeType: 'application/json', description: 'Accessible repositories' },
    ],
  },
  {
    id: 'mcp-postgres',
    name: 'PostgreSQL',
    description: 'Database queries, schema inspection, data analysis',
    status: 'connected',
    transport: 'stdio',
    version: '0.7.0',
    latencyMs: 8,
    requestsToday: 1892,
    lastHealthCheck: Date.now() - 10000,
    tools: [
      { name: 'postgres.query', description: 'Execute read-only SQL query', inputSchema: '{ sql, params? }', calls24h: 1456, avgLatencyMs: 23, errorRate: 0.001 },
      { name: 'postgres.schema', description: 'Inspect table schema', inputSchema: '{ table_name }', calls24h: 234, avgLatencyMs: 12, errorRate: 0 },
      { name: 'postgres.explain', description: 'Explain query execution plan', inputSchema: '{ sql }', calls24h: 89, avgLatencyMs: 45, errorRate: 0 },
      { name: 'postgres.tables', description: 'List all tables', inputSchema: '{}', calls24h: 113, avgLatencyMs: 8, errorRate: 0 },
    ],
    resources: [
      { uri: 'postgres://schema', name: 'Database Schema', mimeType: 'application/json', description: 'Full database schema' },
    ],
  },
  {
    id: 'mcp-memory',
    name: 'Memory Fabric',
    description: 'Multi-tier memory — chronicle, episodic, semantic, working, procedural',
    status: 'connected',
    transport: 'streamable-http',
    version: '1.2.0',
    latencyMs: 18,
    requestsToday: 934,
    lastHealthCheck: Date.now() - 20000,
    tools: [
      { name: 'memory.store', description: 'Store to memory tier', inputSchema: '{ tier, content, metadata }', calls24h: 345, avgLatencyMs: 56, errorRate: 0.01 },
      { name: 'memory.recall', description: 'Recall from memory with context', inputSchema: '{ query, tiers?, recency? }', calls24h: 456, avgLatencyMs: 89, errorRate: 0.005 },
      { name: 'memory.forget', description: 'Governed memory deletion', inputSchema: '{ memory_id, reason }', calls24h: 12, avgLatencyMs: 34, errorRate: 0 },
      { name: 'memory.consolidate', description: 'Consolidate working memory to long-term', inputSchema: '{ session_id }', calls24h: 121, avgLatencyMs: 430, errorRate: 0.02 },
    ],
    resources: [
      { uri: 'a11oy://memory/tiers', name: 'Memory Tiers', mimeType: 'application/json', description: 'Memory tier statistics' },
    ],
  },
  {
    id: 'mcp-slack',
    name: 'Slack',
    description: 'Channel messaging, thread management, user notifications',
    status: 'degraded',
    transport: 'sse',
    version: '1.4.0',
    latencyMs: 234,
    requestsToday: 67,
    lastHealthCheck: Date.now() - 120000,
    tools: [
      { name: 'slack.send_message', description: 'Send message to channel', inputSchema: '{ channel, text, thread_ts? }', calls24h: 34, avgLatencyMs: 340, errorRate: 0.08 },
      { name: 'slack.search', description: 'Search messages', inputSchema: '{ query, channel? }', calls24h: 23, avgLatencyMs: 560, errorRate: 0.12 },
      { name: 'slack.list_channels', description: 'List available channels', inputSchema: '{}', calls24h: 10, avgLatencyMs: 210, errorRate: 0 },
    ],
    resources: [],
  },
];

function StatusDot({ status }: { status: McpServer['status'] }) {
  const color = status === 'connected' ? '#22c55e' : status === 'degraded' ? '#f59e0b' : '#ef4444';
  return (
    <span className="relative flex h-2 w-2">
      {status === 'connected' && <span className="absolute inline-flex h-full w-full rounded-full opacity-30 animate-ping" style={{ backgroundColor: color }} />}
      <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: color }} />
    </span>
  );
}

function ServerCard({ server, onSelect }: { server: McpServer; onSelect: () => void }) {
  const totalCalls = server.tools.reduce((s, t) => s + t.calls24h, 0);
  const avgLatency = Math.round(server.tools.reduce((s, t) => s + t.avgLatencyMs, 0) / server.tools.length);
  return (
    <button
      onClick={onSelect}
      className="w-full p-4 rounded-xl text-left transition-all hover:translate-y-[-1px]"
      style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <StatusDot status={server.status} />
          <span className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.9)' }}>{server.name}</span>
        </div>
        <span className="text-[10px] px-1.5 py-0.5 rounded font-mono" style={{ backgroundColor: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.3)' }}>
          v{server.version}
        </span>
      </div>
      <p className="text-xs mb-3" style={{ color: 'rgba(255,255,255,0.4)' }}>{server.description}</p>
      <div className="flex items-center gap-4 text-[10px] font-mono" style={{ color: 'rgba(255,255,255,0.3)' }}>
        <span>{server.tools.length} tools</span>
        <span>{server.resources.length} resources</span>
        <span>{totalCalls.toLocaleString()} calls/24h</span>
        <span>{avgLatency}ms avg</span>
      </div>
      <div className="mt-2">
        <span className="text-[10px] px-1.5 py-0.5 rounded font-mono" style={{
          backgroundColor: server.transport === 'stdio' ? 'rgba(59,130,246,0.08)' : server.transport === 'sse' ? 'rgba(168,85,247,0.08)' : 'rgba(34,197,94,0.08)',
          color: server.transport === 'stdio' ? 'rgba(59,130,246,0.7)' : server.transport === 'sse' ? 'rgba(168,85,247,0.7)' : 'rgba(34,197,94,0.7)',
        }}>
          {server.transport}
        </span>
      </div>
    </button>
  );
}

function ToolRow({ tool }: { tool: McpTool }) {
  return (
    <div className="flex items-center justify-between py-2.5 px-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-medium" style={{ color: '#c9b787' }}>{tool.name}</span>
          {tool.errorRate > 0.05 && (
            <span className="text-[9px] px-1 py-0.5 rounded" style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: 'rgba(239,68,68,0.8)' }}>
              {(tool.errorRate * 100).toFixed(0)}% errors
            </span>
          )}
        </div>
        <p className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>{tool.description}</p>
      </div>
      <div className="flex items-center gap-4 text-[10px] font-mono flex-shrink-0 ml-4" style={{ color: 'rgba(255,255,255,0.25)' }}>
        <span>{tool.calls24h}</span>
        <span>{tool.avgLatencyMs}ms</span>
      </div>
    </div>
  );
}

export function McpHub() {
  const [selectedServer, setSelectedServer] = useState<McpServer | null>(null);

  const totalTools = SERVERS.reduce((s, srv) => s + srv.tools.length, 0);
  const totalCalls = SERVERS.reduce((s, srv) => s + srv.requestsToday, 0);
  const connectedCount = SERVERS.filter(s => s.status === 'connected').length;

  return (
    <Layout>
      <div className="p-6 max-w-7xl mx-auto">
        <PageHeader
          label="MCP"
          title="MCP Hub"
          subtitle="Model Context Protocol — live tool and resource registry"
          status="LIVE"
        />

        <div className="grid grid-cols-4 gap-3 mb-8">
          {[
            { label: 'MCP Servers', value: String(SERVERS.length), sub: `${connectedCount} healthy` },
            { label: 'Total Tools', value: String(totalTools), sub: 'across all servers' },
            { label: 'Calls Today', value: totalCalls.toLocaleString(), sub: 'governed executions' },
            { label: 'Avg Latency', value: `${Math.round(SERVERS.reduce((s, srv) => s + srv.latencyMs, 0) / SERVERS.length)}ms`, sub: 'proxy overhead' },
          ].map((m, i) => (
            <div key={i} className="p-4 rounded-xl" style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: 'rgba(255,255,255,0.3)' }}>{m.label}</div>
              <div className="text-2xl font-semibold" style={{ color: 'rgba(255,255,255,0.9)' }}>{m.value}</div>
              <div className="text-[10px] mt-1" style={{ color: 'rgba(255,255,255,0.2)' }}>{m.sub}</div>
            </div>
          ))}
        </div>

        <div className="flex gap-6">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-4">
              <h3 className="text-xs font-semibold tracking-wider uppercase" style={{ color: 'rgba(255,255,255,0.4)' }}>Servers</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {SERVERS.map((s) => (
                <ServerCard key={s.id} server={s} onSelect={() => setSelectedServer(s)} />
              ))}
            </div>

            <div className="mt-8 p-4 rounded-xl" style={{ backgroundColor: 'rgba(201,183,135,0.03)', border: '1px solid rgba(201,183,135,0.08)' }}>
              <h4 className="text-xs font-semibold mb-3" style={{ color: '#c9b787' }}>MCP Protocol Architecture</h4>
              <div className="grid grid-cols-3 gap-4 text-[10px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
                <div>
                  <div className="font-medium mb-1" style={{ color: 'rgba(255,255,255,0.6)' }}>Host (a1.1oy)</div>
                  <p>The AI application that initiates connections to MCP servers and routes tool calls through governed execution.</p>
                </div>
                <div>
                  <div className="font-medium mb-1" style={{ color: 'rgba(255,255,255,0.6)' }}>Client</div>
                  <p>Maintains 1:1 connection with each server. Handles capability negotiation, tool discovery, and transport.</p>
                </div>
                <div>
                  <div className="font-medium mb-1" style={{ color: 'rgba(255,255,255,0.6)' }}>Server</div>
                  <p>Exposes tools, resources, and prompts. Each server is sandboxed with its own firewall policy and proof requirements.</p>
                </div>
              </div>
            </div>
          </div>

          {selectedServer && (
            <div className="w-96 flex-shrink-0">
              <div className="sticky top-6 rounded-xl overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="p-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <StatusDot status={selectedServer.status} />
                      <span className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.9)' }}>{selectedServer.name}</span>
                    </div>
                    <button onClick={() => setSelectedServer(null)} className="p-1 rounded hover:bg-white/5" style={{ color: 'rgba(255,255,255,0.3)' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
                    </button>
                  </div>
                  <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.4)' }}>{selectedServer.description}</p>
                  <div className="flex gap-2 mt-2">
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-mono" style={{ backgroundColor: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.3)' }}>
                      {selectedServer.transport}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-mono" style={{ backgroundColor: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.3)' }}>
                      v{selectedServer.version}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-mono" style={{ backgroundColor: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.3)' }}>
                      {selectedServer.latencyMs}ms
                    </span>
                  </div>
                </div>
                <div>
                  <div className="px-3 py-2 text-[10px] uppercase tracking-wider font-semibold" style={{ color: 'rgba(255,255,255,0.3)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    Tools ({selectedServer.tools.length})
                  </div>
                  {selectedServer.tools.map((t, i) => (
                    <ToolRow key={i} tool={t} />
                  ))}
                </div>
                {selectedServer.resources.length > 0 && (
                  <div>
                    <div className="px-3 py-2 text-[10px] uppercase tracking-wider font-semibold" style={{ color: 'rgba(255,255,255,0.3)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                      Resources ({selectedServer.resources.length})
                    </div>
                    {selectedServer.resources.map((r, i) => (
                      <div key={i} className="px-3 py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                        <div className="text-xs font-mono" style={{ color: 'rgba(201,183,135,0.7)' }}>{r.uri}</div>
                        <div className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>{r.description}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
