import { useState, useEffect, useCallback } from "react";
import { nexusApi } from "../lib/api";
import type { ProtocolTool, ToolCallResult } from "../lib/types";
import {
  Network,
  Loader,
  AlertCircle,
  Play,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronRight,
  Clock,
  Sparkles,
} from "lucide-react";

function formatRelative(iso?: string): string {
  if (!iso) return "";
  const ms = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(ms) || ms < 0) return "";
  const sec = Math.floor(ms / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  return `${day}d ago`;
}

const PROTOCOLS = ["MCP", "A2A", "ACP", "ANP"] as const;

const PROTOCOL_META: Record<string, { color: string; description: string; badge: string }> = {
  MCP: {
    color: "#00d4ff",
    description: "Model Context Protocol — Anthropic standard for tool calling",
    badge: "Live",
  },
  A2A: {
    color: "#a855f7",
    description: "Agent-to-Agent protocol — Google standard for agent interop",
    badge: "Loopback",
  },
  ACP: {
    color: "#00ff88",
    description: "Agent Communication Protocol — IBM standard for enterprise agents",
    badge: "Loopback",
  },
  ANP: {
    color: "#ffb700",
    description: "Agent Network Protocol — decentralized agent discovery",
    badge: "Loopback",
  },
};

export default function Bridge() {
  const [tools, setTools] = useState<ProtocolTool[]>([]);
  const [protocolFilter, setProtocolFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [calling, setCalling] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, ToolCallResult>>({});
  const [expandedTool, setExpandedTool] = useState<string | null>(null);
  const [callArgs, setCallArgs] = useState<Record<string, string>>({});

  const fetchTools = useCallback(async () => {
    try {
      const data = await nexusApi.listBridgeTools(
        protocolFilter === "all" ? undefined : protocolFilter
      );
      setTools(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load tools");
    } finally {
      setLoading(false);
    }
  }, [protocolFilter]);

  useEffect(() => {
    setLoading(true);
    fetchTools();
  }, [fetchTools]);

  async function handleCall(tool: ProtocolTool) {
    let args: Record<string, unknown> = {};
    try {
      const raw = callArgs[tool.id];
      if (raw) args = JSON.parse(raw);
    } catch {
      setError("Invalid JSON in call arguments");
      return;
    }

    setCalling(tool.id);
    setError(null);
    try {
      const result = await nexusApi.invokeTool(tool.protocol, tool.id, args);
      setResults((prev) => ({ ...prev, [tool.id]: result }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Tool call failed");
    } finally {
      setCalling(null);
    }
  }

  const groupedByProtocol = PROTOCOLS.map((proto) => ({
    proto,
    tools: tools.filter((t) => t.protocol === proto),
  })).filter(({ tools }) => tools.length > 0);

  return (
    <div className="min-h-full bg-nexus-bg p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Network className="w-5 h-5 text-nexus-green" />
          <div>
            <h1 className="text-lg font-semibold">Universal Protocol Bridge</h1>
            <p className="text-xs text-muted-foreground">
              MCP · A2A · ACP · ANP — one façade, any tool
              {(() => {
                const customCount = tools.filter((t) => t.isCustom).length;
                return customCount > 0 ? ` · ${customCount} custom` : "";
              })()}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3 mb-6">
          {PROTOCOLS.map((proto) => {
            const meta = PROTOCOL_META[proto];
            const count = tools.filter((t) => t.protocol === proto).length;
            return (
              <button
                key={proto}
                onClick={() => setProtocolFilter(protocolFilter === proto ? "all" : proto)}
                className={`rounded-lg border p-3 text-left transition-all ${
                  protocolFilter === proto
                    ? "border-opacity-50"
                    : "border-nexus hover:border-opacity-30"
                }`}
                style={{
                  borderColor: protocolFilter === proto ? meta.color : undefined,
                  background: protocolFilter === proto
                    ? `linear-gradient(135deg, ${meta.color}08 0%, transparent 100%)`
                    : "#0d1520",
                }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-mono font-bold" style={{ color: meta.color }}>
                    {proto}
                  </span>
                  <span
                    className="text-[9px] px-1.5 py-0.5 rounded"
                    style={{ color: meta.color, backgroundColor: `${meta.color}15` }}
                  >
                    {meta.badge}
                  </span>
                </div>
                <div className="text-[10px] text-muted-foreground/60 leading-snug mb-2">
                  {meta.description}
                </div>
                <div className="text-[10px] font-mono" style={{ color: meta.color }}>
                  {count} tools
                </div>
              </button>
            );
          })}
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 bg-[#ff4455]/10 border border-[#ff4455]/30 rounded-lg px-4 py-3">
            <AlertCircle className="w-4 h-4 text-nexus-red shrink-0" />
            <p className="text-xs text-nexus-red">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader className="w-6 h-6 animate-spin text-muted-foreground/40" />
          </div>
        ) : (
          <div className="space-y-5">
            {groupedByProtocol.map(({ proto, tools: protoTools }) => {
              const meta = PROTOCOL_META[proto];
              return (
                <div key={proto}>
                  <h2
                    className="text-xs font-mono uppercase tracking-widest mb-3 flex items-center gap-2"
                    style={{ color: meta.color }}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: meta.color }}
                    />
                    {proto} — {protoTools.length} tools
                  </h2>
                  <div className="space-y-2">
                    {protoTools.map((tool) => (
                      <ToolCard
                        key={tool.id}
                        tool={tool}
                        color={meta.color}
                        onCall={() => handleCall(tool)}
                        calling={calling === tool.id}
                        result={results[tool.id]}
                        expanded={expandedTool === tool.id}
                        onExpand={() =>
                          setExpandedTool((e) => (e === tool.id ? null : tool.id))
                        }
                        args={callArgs[tool.id] ?? "{}"}
                        onArgsChange={(v) =>
                          setCallArgs((prev) => ({ ...prev, [tool.id]: v }))
                        }
                      />
                    ))}
                  </div>
                </div>
              );
            })}

            {tools.length === 0 && !error && (
              <div className="text-center py-16 text-muted-foreground/40">
                <Network className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p className="text-sm">No tools registered.</p>
                <p className="text-xs mt-1">Run an Ingest job or configure tool sources.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ToolCard({
  tool,
  color,
  onCall,
  calling,
  result,
  expanded,
  onExpand,
  args,
  onArgsChange,
}: {
  tool: ProtocolTool;
  color: string;
  onCall: () => void;
  calling: boolean;
  result?: ToolCallResult;
  expanded: boolean;
  onExpand: () => void;
  args: string;
  onArgsChange: (v: string) => void;
}) {
  return (
    <div
      className="rounded-lg border overflow-hidden bg-nexus-surface transition-all"
      style={{ borderColor: expanded ? `${color}30` : "#1a2535" }}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        <button onClick={onExpand} className="flex items-center gap-3 flex-1 min-w-0 text-left">
          {expanded ? (
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
              <span className="text-sm font-semibold">{tool.name}</span>
              <span
                className="text-[9px] font-mono px-1.5 py-0.5 rounded"
                style={{ color, backgroundColor: `${color}15`, border: `1px solid ${color}30` }}
              >
                {tool.protocol}
              </span>
              <span className="text-[9px] text-muted-foreground/40 font-mono">{tool.domain}</span>
              {tool.isCustom && (
                <span
                  className="text-[9px] font-mono px-1.5 py-0.5 rounded flex items-center gap-1 text-[#a855f7] bg-[#a855f7]/10 border border-[#a855f7]/30"
                  title="You added this tool"
                >
                  <Sparkles className="w-2.5 h-2.5" />
                  custom
                </span>
              )}
              {!tool.isCustom && tool.lastModifiedAt && (
                <span
                  className="text-[9px] font-mono px-1.5 py-0.5 rounded text-[#ffb700] bg-[#ffb700]/10 border border-[#ffb700]/30"
                  title={`Last modified ${new Date(tool.lastModifiedAt).toLocaleString()}` + (tool.lastModifiedBy ? ` by ${tool.lastModifiedBy}` : "")}
                >
                  modified
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <p className="text-xs text-muted-foreground truncate">{tool.description}</p>
              {tool.lastModifiedAt && (
                <span
                  className="text-[9px] font-mono text-muted-foreground/40 shrink-0 flex items-center gap-1"
                  title={`Last modified ${new Date(tool.lastModifiedAt).toLocaleString()}` + (tool.lastModifiedBy ? ` by ${tool.lastModifiedBy}` : "")}
                >
                  <Clock className="w-2.5 h-2.5" />
                  {formatRelative(tool.lastModifiedAt)}
                  {tool.lastModifiedBy && ` · ${tool.lastModifiedBy}`}
                </span>
              )}
            </div>
          </div>
        </button>

        <div className="flex items-center gap-2 shrink-0">
          {result && (
            result.status === "success" ? (
              <CheckCircle className="w-3.5 h-3.5 text-nexus-green" />
            ) : (
              <XCircle className="w-3.5 h-3.5 text-nexus-red" />
            )
          )}
          <button
            onClick={onCall}
            disabled={calling}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-40"
            style={{
              color,
              backgroundColor: `${color}10`,
              border: `1px solid ${color}30`,
            }}
          >
            {calling ? (
              <Loader className="w-3 h-3 animate-spin" />
            ) : (
              <Play className="w-3 h-3" />
            )}
            Call
          </button>
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 border-t border-nexus pt-3 space-y-3">
          <div>
            <label className="text-[10px] font-mono text-muted-foreground/50 uppercase tracking-widest mb-1 block">
              Arguments (JSON)
            </label>
            <textarea
              value={args}
              onChange={(e) => onArgsChange(e.target.value)}
              rows={3}
              className="w-full bg-nexus-bg border border-nexus rounded-lg px-3 py-2 text-xs font-mono resize-none focus:outline-none focus:border-opacity-50 text-foreground"
              style={{ focusBorderColor: color } as React.CSSProperties}
              placeholder="{}"
            />
          </div>

          {result && (
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <label className="text-[10px] font-mono text-muted-foreground/50 uppercase tracking-widest">
                  Response
                </label>
                <span className="text-[9px] font-mono text-muted-foreground/40">
                  {result.durationMs}ms · {result.traceId}
                </span>
              </div>
              <div className="bg-nexus-bg rounded-lg p-3 text-xs font-mono text-muted-foreground overflow-auto max-h-40">
                {JSON.stringify(result.output, null, 2)}
              </div>
            </div>
          )}

          <div>
            <label className="text-[10px] font-mono text-muted-foreground/50 uppercase tracking-widest mb-1 block">
              Input Schema
            </label>
            <div className="bg-nexus-bg rounded-lg p-3 text-xs font-mono text-muted-foreground overflow-auto max-h-32">
              {JSON.stringify(tool.inputSchema, null, 2)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
