import { useEffect, useState } from 'react';
import { useMcpStore } from './McpStoreProvider';
import type { McpConnectionState, McpTool, McpToolResult } from './types';

function _cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

interface McpConnectionIndicatorProps {
  status: McpConnectionState['status'];
  serverName?: string;
  compact?: boolean;
}

export function McpConnectionIndicator({
  status,
  serverName,
  compact,
}: McpConnectionIndicatorProps) {
  const colors: Record<McpConnectionState['status'], string> = {
    connected: '#10b981',
    disconnected: 'rgba(255,255,255,0.3)',
    connecting: '#f59e0b',
    error: '#ef4444',
  };
  const labels: Record<McpConnectionState['status'], string> = {
    connected: 'MCP Connected',
    disconnected: 'MCP Offline',
    connecting: 'MCP Connecting',
    error: 'MCP Error',
  };

  const color = colors[status];

  if (compact) {
    return (
      <div className="flex items-center gap-1.5" title={labels[status]}>
        <span
          className="w-1.5 h-1.5 rounded-full"
          style={{
            background: color,
            boxShadow: status === 'connected' ? `0 0 4px ${color}` : undefined,
            animation: status === 'connecting' ? 'pulse 1.5s infinite' : undefined,
          }}
        />
      </div>
    );
  }

  return (
    <div
      className="flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-mono"
      style={{ background: `${color}12`, border: `1px solid ${color}25`, color }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full shrink-0"
        style={{
          background: color,
          animation: status === 'connecting' ? 'pulse 1.5s infinite' : undefined,
        }}
      />
      {serverName ? `MCP · ${serverName}` : labels[status]}
    </div>
  );
}

interface McpToolPaletteProps {
  open: boolean;
  onClose: () => void;
  tools: McpTool[];
  onCallTool: (name: string, args: Record<string, unknown>) => Promise<McpToolResult>;
  isLoading?: boolean;
  accentColor?: string;
  appName?: string;
}

export function McpToolPalette({
  open,
  onClose,
  tools,
  onCallTool,
  isLoading,
  accentColor = '#4B8BDB',
  appName = 'App',
}: McpToolPaletteProps) {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<McpTool | null>(null);
  const [params, setParams] = useState<Record<string, string>>({});
  const [result, setResult] = useState<McpToolResult | null>(null);
  const [calling, setCalling] = useState(false);

  useEffect(() => {
    if (!open) {
      setSearch('');
      setSelected(null);
      setParams({});
      setResult(null);
    }
  }, [open]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const filtered = tools.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase()),
  );

  const handleCall = async () => {
    if (!selected) return;
    setCalling(true);
    try {
      const args: Record<string, unknown> = {};
      Object.entries(params).forEach(([k, v]) => {
        if (v) args[k] = v;
      });
      const res = await onCallTool(selected.name, args);
      setResult(res);
    } finally {
      setCalling(false);
    }
  };

  if (!open) return null;

  const approvalColors: Record<string, string> = {
    auto: '#10b981',
    review: '#f59e0b',
    admin_only: '#ef4444',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
      <div className="fixed inset-0 bg-black/60" onClick={onClose} />
      <div
        className="relative w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: 'rgba(8,12,20,0.98)', border: `1px solid ${accentColor}20` }}
      >
        <div
          className="flex items-center gap-3 px-4 py-3 border-b"
          style={{ borderColor: 'rgba(255,255,255,0.06)' }}
        >
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ background: accentColor }} />
            <span
              className="text-[10px] font-mono uppercase tracking-widest"
              style={{ color: accentColor }}
            >
              MCP Tools · {appName}
            </span>
          </div>
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSelected(null);
              setResult(null);
            }}
            placeholder="Search tools..."
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: 'rgba(255,255,255,0.8)' }}
          />
          <kbd
            className="text-[9px] px-1.5 py-0.5 rounded font-mono"
            style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.3)' }}
          >
            ESC
          </kbd>
        </div>

        <div className="flex max-h-[60vh]">
          <div
            className="w-56 border-r overflow-y-auto"
            style={{ borderColor: 'rgba(255,255,255,0.05)' }}
          >
            {filtered.length === 0 && (
              <div
                className="p-4 text-[11px] text-center"
                style={{ color: 'rgba(255,255,255,0.3)' }}
              >
                No tools found
              </div>
            )}
            {filtered.map((tool) => (
              <button
                key={tool.name}
                onClick={() => {
                  setSelected(tool);
                  setParams({});
                  setResult(null);
                }}
                className="w-full text-left px-3 py-2.5 border-b transition-colors hover:bg-white/3"
                style={{
                  borderColor: 'rgba(255,255,255,0.04)',
                  background: selected?.name === tool.name ? `${accentColor}08` : undefined,
                }}
              >
                <div
                  className="text-[11px] font-medium truncate"
                  style={{
                    color: selected?.name === tool.name ? accentColor : 'rgba(255,255,255,0.7)',
                  }}
                >
                  {tool.name.replace(/_/g, ' ')}
                </div>
                {tool.approvalClass && (
                  <div
                    className="text-[9px] mt-0.5 font-mono"
                    style={{ color: approvalColors[tool.approvalClass] ?? '#10b981' }}
                  >
                    {tool.approvalClass}
                  </div>
                )}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {!selected && (
              <div
                className="h-full flex items-center justify-center text-[11px]"
                style={{ color: 'rgba(255,255,255,0.2)' }}
              >
                Select a tool to configure and run it
              </div>
            )}

            {selected && !result && (
              <div className="space-y-4">
                <div>
                  <div className="text-xs font-semibold text-white mb-1">
                    {selected.name.replace(/_/g, ' ')}
                  </div>
                  <div className="text-[11px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    {selected.description}
                  </div>
                </div>

                {Object.entries(selected.inputSchema.properties ?? {}).map(([key, schema]) => (
                  <div key={key}>
                    <label
                      className="text-[10px] font-medium mb-1 block"
                      style={{ color: 'rgba(255,255,255,0.5)' }}
                    >
                      {key}
                      {selected.inputSchema.required?.includes(key) && (
                        <span style={{ color: '#ef4444' }}> *</span>
                      )}
                    </label>
                    {schema.enum ? (
                      <select
                        value={params[key] ?? ''}
                        onChange={(e) => setParams((p) => ({ ...p, [key]: e.target.value }))}
                        className="w-full text-[11px] px-2.5 py-1.5 rounded-lg outline-none"
                        style={{
                          background: 'rgba(255,255,255,0.04)',
                          border: '1px solid rgba(255,255,255,0.08)',
                          color: 'rgba(255,255,255,0.7)',
                        }}
                      >
                        <option value="">Select...</option>
                        {schema.enum.map((v) => (
                          <option key={v} value={v}>
                            {v}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        value={params[key] ?? ''}
                        onChange={(e) => setParams((p) => ({ ...p, [key]: e.target.value }))}
                        placeholder={schema.description ?? key}
                        className="w-full text-[11px] px-2.5 py-1.5 rounded-lg outline-none"
                        style={{
                          background: 'rgba(255,255,255,0.04)',
                          border: '1px solid rgba(255,255,255,0.08)',
                          color: 'rgba(255,255,255,0.7)',
                        }}
                      />
                    )}
                  </div>
                ))}

                <button
                  onClick={handleCall}
                  disabled={calling}
                  className="w-full py-2 rounded-lg text-[11px] font-semibold transition-all"
                  style={{ background: accentColor, color: '#fff', opacity: calling ? 0.6 : 1 }}
                >
                  {calling ? 'Running...' : 'Run Tool'}
                </button>
              </div>
            )}

            {result && (
              <McpResultCard
                result={result}
                toolName={selected?.name ?? ''}
                onReset={() => setResult(null)}
                accentColor={accentColor}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface McpResultCardProps {
  result: McpToolResult;
  toolName: string;
  onReset?: () => void;
  accentColor?: string;
  compact?: boolean;
}

export function McpResultCard({
  result,
  toolName,
  onReset,
  accentColor = '#4B8BDB',
  compact,
}: McpResultCardProps) {
  const [expanded, setExpanded] = useState(!compact);

  if (result.pendingApproval) {
    return (
      <div
        className="rounded-xl p-4 border"
        style={{ background: 'rgba(245,158,11,0.04)', borderColor: 'rgba(245,158,11,0.2)' }}
      >
        <div className="flex items-center gap-2 mb-2">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <span className="text-[11px] font-semibold text-amber-400">Pending Approval</span>
        </div>
        <div className="text-[10px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
          Tool <span className="font-mono text-amber-400">{toolName}</span> requires human approval
          before execution.
        </div>
        {result.approvalId && (
          <div className="mt-2 text-[10px] font-mono" style={{ color: 'rgba(255,255,255,0.25)' }}>
            Approval ID: {result.approvalId}
          </div>
        )}
      </div>
    );
  }

  if (!result.success) {
    return (
      <div
        className="rounded-xl p-4 border"
        style={{ background: 'rgba(239,68,68,0.04)', borderColor: 'rgba(239,68,68,0.2)' }}
      >
        <div className="flex items-center gap-2 mb-2">
          <span className="w-2 h-2 rounded-full bg-red-400" />
          <span className="text-[11px] font-semibold text-red-400">Tool Failed</span>
        </div>
        <div className="text-[10px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
          {result.error ?? 'Unknown error'}
        </div>
        {onReset && (
          <button
            onClick={onReset}
            className="mt-3 text-[10px] px-2.5 py-1 rounded border transition-colors hover:bg-white/5"
            style={{ borderColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)' }}
          >
            Try again
          </button>
        )}
      </div>
    );
  }

  const output = result.output;
  const isObject = output && typeof output === 'object';

  return (
    <div
      className="rounded-xl border overflow-hidden"
      style={{ borderColor: `${accentColor}20`, background: `${accentColor}05` }}
    >
      <div
        className="flex items-center justify-between px-3 py-2 border-b"
        style={{ borderColor: `${accentColor}10` }}
      >
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: '#10b981' }} />
          <span className="text-[11px] font-semibold" style={{ color: accentColor }}>
            {toolName.replace(/_/g, ' ')}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="text-[9px] px-1.5 py-0.5 rounded font-mono"
            style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}
          >
            Success
          </span>
          <button
            onClick={() => setExpanded((e) => !e)}
            className="text-[10px] px-2 py-0.5 rounded transition-colors hover:bg-white/5"
            style={{ color: 'rgba(255,255,255,0.3)' }}
          >
            {expanded ? 'Collapse' : 'Expand'}
          </button>
          {onReset && (
            <button
              onClick={onReset}
              className="text-[10px] px-2 py-0.5 rounded transition-colors hover:bg-white/5"
              style={{ color: 'rgba(255,255,255,0.3)' }}
            >
              New
            </button>
          )}
        </div>
      </div>

      {expanded && (
        <div className="p-3">
          {isObject ? (
            <pre
              className="text-[10px] overflow-auto rounded-lg p-2.5"
              style={{
                background: 'rgba(0,0,0,0.3)',
                color: 'rgba(255,255,255,0.65)',
                border: '1px solid rgba(255,255,255,0.06)',
                maxHeight: 300,
                fontFamily: 'monospace',
              }}
            >
              {JSON.stringify(output, null, 2)}
            </pre>
          ) : (
            <div className="text-[11px]" style={{ color: 'rgba(255,255,255,0.6)' }}>
              {String(output)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function McpHeaderIndicator() {
  const store = useMcpStore();
  const nativeConn = store.connections['alloy-native'];
  return <McpConnectionIndicator status={nativeConn?.status ?? 'disconnected'} compact />;
}
