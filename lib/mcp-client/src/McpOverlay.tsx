import {
  AlertTriangle,
  CheckCircle,
  ChevronRight,
  Cpu,
  Loader2,
  Search,
  X,
  Zap,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

interface McpTool {
  name: string;
  description: string;
  inputSchema?: { properties?: Record<string, { type: string; description?: string }> };
}

interface McpResult {
  tool: string;
  content: string;
  isError?: boolean;
  elapsed?: number;
}

const BASE_TOOLS: McpTool[] = [
  {
    name: 'get_capabilities',
    description: 'List all available MCP capabilities and connected servers',
  },
  { name: 'fetch_context', description: 'Retrieve live context from connected data sources' },
  {
    name: 'run_search',
    description: 'Execute a semantic search across all indexed data',
    inputSchema: { properties: { query: { type: 'string', description: 'Search query' } } },
  },
  {
    name: 'get_status',
    description: 'Check system health and service status across all integrations',
  },
  { name: 'list_agents', description: 'List all registered AI agents and their current states' },
  {
    name: 'trigger_action',
    description: 'Execute a named action or workflow step',
    inputSchema: { properties: { action: { type: 'string', description: 'Action name' } } },
  },
];

function McpPanel({ onClose, domain }: { onClose: () => void; domain?: string }) {
  const [tools, setTools] = useState<McpTool[]>(BASE_TOOLS);
  const [selected, setSelected] = useState<McpTool | null>(null);
  const [params, setParams] = useState<Record<string, string>>({});
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<McpResult | null>(null);
  const [search, setSearch] = useState('');
  const [serverStatus, setServerStatus] = useState<'unknown' | 'healthy' | 'error'>('unknown');

  useEffect(() => {
    fetch('/api/mcp/health')
      .then((r) => (r.ok ? setServerStatus('healthy') : setServerStatus('error')))
      .catch(() => setServerStatus('error'));

    fetch('/api/mcp/tools/list')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.tools?.length) setTools([...BASE_TOOLS, ...data.tools]);
      })
      .catch(() => {});
  }, []);

  const callTool = async () => {
    if (!selected) return;
    setRunning(true);
    setResult(null);
    const start = Date.now();
    try {
      const res = await fetch('/api/mcp/tools/call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: selected.name, arguments: params }),
      });
      const data = await res.json().catch(() => ({ content: 'No response body' }));
      const elapsed = Date.now() - start;
      if (!res.ok) {
        setResult({
          tool: selected.name,
          content: data.message ?? 'Error calling tool',
          isError: true,
          elapsed,
        });
      } else {
        const content =
          typeof data.content === 'string'
            ? data.content
            : JSON.stringify(data.content ?? data, null, 2);
        setResult({ tool: selected.name, content, elapsed });
      }
    } catch {
      setResult({
        tool: selected.name,
        content: 'Server unreachable — ensure /api/mcp/tools/call endpoint is available',
        isError: true,
        elapsed: Date.now() - start,
      });
    }
    setRunning(false);
  };

  const filtered = tools.filter(
    (t) =>
      !search ||
      t.name.includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase()),
  );

  const statusColor =
    serverStatus === 'healthy' ? '#10b981' : serverStatus === 'error' ? '#ef4444' : '#f59e0b';
  const statusLabel =
    serverStatus === 'healthy' ? 'Connected' : serverStatus === 'error' ? 'Offline' : 'Checking...';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'flex-end',
        background: 'rgba(0,0,0,0.4)',
        backdropFilter: 'blur(4px)',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: 420,
          height: '100vh',
          background: 'rgba(8,12,20,0.98)',
          borderLeft: '1px solid rgba(75,139,219,0.15)',
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideInRight 0.18s ease-out',
        }}
      >
        <style>{`@keyframes slideInRight { from { transform: translateX(20px); opacity:0; } to { transform: translateX(0); opacity:1; } }`}</style>

        <div
          style={{ padding: '16px 16px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 8,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Cpu style={{ width: 14, height: 14, color: '#4B8BDB' }} />
              <span
                style={{ fontSize: 11, fontWeight: 700, color: '#fff', letterSpacing: '0.05em' }}
              >
                MCP Tool Palette
              </span>
              {domain && (
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    padding: '2px 6px',
                    borderRadius: 4,
                    background: 'rgba(75,139,219,0.1)',
                    color: '#4B8BDB',
                  }}
                >
                  {domain}
                </span>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: 9,
                  color: statusColor,
                }}
              >
                <span
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: '50%',
                    background: statusColor,
                    display: 'inline-block',
                  }}
                />
                {statusLabel}
              </span>
              <button
                onClick={onClose}
                style={{
                  padding: 4,
                  borderRadius: 6,
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'rgba(255,255,255,0.4)',
                }}
              >
                <X style={{ width: 14, height: 14 }} />
              </button>
            </div>
          </div>

          <div style={{ position: 'relative' }}>
            <Search
              style={{
                position: 'absolute',
                left: 8,
                top: '50%',
                transform: 'translateY(-50%)',
                width: 12,
                height: 12,
                color: 'rgba(255,255,255,0.25)',
              }}
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tools..."
              style={{
                width: '100%',
                paddingLeft: 28,
                paddingRight: 12,
                paddingTop: 6,
                paddingBottom: 6,
                fontSize: 11,
                borderRadius: 8,
                outline: 'none',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: 'rgba(255,255,255,0.7)',
                boxSizing: 'border-box',
              }}
            />
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {filtered.map((tool) => (
              <button
                key={tool.name}
                onClick={() => {
                  setSelected(tool);
                  setParams({});
                  setResult(null);
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 16px',
                  textAlign: 'left',
                  background:
                    selected?.name === tool.name ? 'rgba(75,139,219,0.08)' : 'transparent',
                  border: 'none',
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                  cursor: 'pointer',
                  transition: 'background 0.1s',
                }}
              >
                <Zap
                  style={{
                    width: 11,
                    height: 11,
                    color: selected?.name === tool.name ? '#4B8BDB' : 'rgba(255,255,255,0.25)',
                    flexShrink: 0,
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      fontFamily: 'monospace',
                      color: selected?.name === tool.name ? '#4B8BDB' : 'rgba(255,255,255,0.7)',
                      marginBottom: 2,
                    }}
                  >
                    {tool.name}
                  </div>
                  <div
                    style={{
                      fontSize: 10,
                      color: 'rgba(255,255,255,0.35)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {tool.description}
                  </div>
                </div>
                <ChevronRight
                  style={{ width: 11, height: 11, color: 'rgba(255,255,255,0.2)', flexShrink: 0 }}
                />
              </button>
            ))}
          </div>

          {selected && (
            <div
              style={{
                padding: '12px 16px',
                borderTop: '1px solid rgba(255,255,255,0.06)',
                background: 'rgba(0,0,0,0.2)',
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: 'rgba(255,255,255,0.4)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  marginBottom: 8,
                }}
              >
                {selected.name}
              </div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginBottom: 10 }}>
                {selected.description}
              </div>

              {selected.inputSchema?.properties &&
                Object.entries(selected.inputSchema.properties).map(([key, schema]) => (
                  <div key={key} style={{ marginBottom: 6 }}>
                    <label
                      style={{
                        fontSize: 9,
                        color: 'rgba(255,255,255,0.4)',
                        display: 'block',
                        marginBottom: 3,
                        textTransform: 'uppercase',
                      }}
                    >
                      {key}
                    </label>
                    <input
                      value={params[key] ?? ''}
                      onChange={(e) => setParams((p) => ({ ...p, [key]: e.target.value }))}
                      placeholder={schema.description ?? key}
                      style={{
                        width: '100%',
                        padding: '6px 10px',
                        fontSize: 11,
                        borderRadius: 6,
                        outline: 'none',
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        color: 'rgba(255,255,255,0.7)',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                ))}

              <button
                onClick={callTool}
                disabled={running}
                style={{
                  width: '100%',
                  padding: '8px',
                  fontSize: 11,
                  fontWeight: 700,
                  borderRadius: 8,
                  border: 'none',
                  cursor: running ? 'not-allowed' : 'pointer',
                  marginTop: 6,
                  background: running ? 'rgba(75,139,219,0.3)' : '#4B8BDB',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                {running ? (
                  <Loader2
                    style={{ width: 12, height: 12, animation: 'spin 1s linear infinite' }}
                  />
                ) : (
                  <Zap style={{ width: 12, height: 12 }} />
                )}
                {running ? 'Calling...' : 'Call Tool'}
              </button>

              {result && (
                <div
                  style={{
                    marginTop: 10,
                    borderRadius: 8,
                    overflow: 'hidden',
                    border: `1px solid ${result.isError ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)'}`,
                  }}
                >
                  <div
                    style={{
                      padding: '6px 10px',
                      background: result.isError ? 'rgba(239,68,68,0.06)' : 'rgba(16,185,129,0.06)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    {result.isError ? (
                      <AlertTriangle style={{ width: 11, height: 11, color: '#ef4444' }} />
                    ) : (
                      <CheckCircle style={{ width: 11, height: 11, color: '#10b981' }} />
                    )}
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 600,
                        color: result.isError ? '#ef4444' : '#10b981',
                      }}
                    >
                      {result.isError ? 'Error' : 'Success'} · {result.elapsed}ms
                    </span>
                  </div>
                  <pre
                    style={{
                      padding: 10,
                      fontSize: 10,
                      color: 'rgba(255,255,255,0.6)',
                      fontFamily: 'monospace',
                      overflow: 'auto',
                      maxHeight: 180,
                      margin: 0,
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {result.content}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function McpOverlay({ domain }: { domain?: string }) {
  const [open, setOpen] = useState(false);

  const handleKeydown = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'm') {
      e.preventDefault();
      setOpen((o) => !o);
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, [handleKeydown]);

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        title="MCP Tools (⌘⇧M)"
        style={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          zIndex: 1000,
          width: 40,
          height: 40,
          borderRadius: '50%',
          border: '1px solid rgba(75,139,219,0.25)',
          background: 'rgba(8,12,20,0.95)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          backdropFilter: 'blur(8px)',
          transition: 'all 0.15s',
          boxShadow: '0 4px 24px rgba(75,139,219,0.15)',
        }}
      >
        <Cpu style={{ width: 16, height: 16, color: '#4B8BDB' }} />
      </button>
      {open && <McpPanel onClose={() => setOpen(false)} domain={domain} />}
    </>
  );
}
