import { useState, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchEntities } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  Ship, Shield, Building2, Scale, Activity, Plus, Trash2,
  Network, ZoomIn, ZoomOut, RefreshCw, Loader2, AlertCircle
} from "lucide-react";

interface EntityNode {
  id: string;
  entityId: string;
  label: string;
  type: string;
  domain: string;
  x: number;
  y: number;
  confidence?: number;
  metadata?: Record<string, string>;
}

interface ApiRelationship {
  from: string;
  to: string;
  label: string;
  strength: number;
}

interface Connection {
  from: string;
  to: string;
  label: string;
  strength: number;
}

const DOMAIN_META: Record<string, { color: string; icon: React.ComponentType<{ className?: string }> }> = {
  vessels: { color: "hsl(206,72%,52%)", icon: Ship },
  aegis: { color: "hsl(222,60%,62%)", icon: Shield },
  terra: { color: "hsl(140,50%,48%)", icon: Building2 },
  prism: { color: "hsl(38,72%,58%)", icon: Scale },
  lyte: { color: "hsl(192,85%,46%)", icon: Activity },
};

function resolveConnections(nodes: EntityNode[], apiRelationships: ApiRelationship[]): Connection[] {
  const entityIdToNodeId = new Map<string, string>();
  nodes.forEach(n => entityIdToNodeId.set(n.entityId, n.id));
  const connections: Connection[] = [];
  apiRelationships.forEach(rel => {
    const fromNodeId = entityIdToNodeId.get(rel.from);
    const toNodeId = entityIdToNodeId.get(rel.to);
    if (fromNodeId && toNodeId) {
      connections.push({ from: fromNodeId, to: toNodeId, label: rel.label, strength: rel.strength });
    }
  });
  return connections;
}

let nodeCounter = 0;
function makeId() { return `canvas_${Date.now()}_${nodeCounter++}`; }

export default function EntityCanvas() {
  const canvasRef = useRef<SVGSVGElement>(null);
  const [canvasNodes, setCanvasNodes] = useState<EntityNode[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dragging, setDragging] = useState<{ id: string; ox: number; oy: number } | null>(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [panStart, setPanStart] = useState<{ mx: number; my: number; px: number; py: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [showCatalog, setShowCatalog] = useState(false);
  const [domainFilter, setDomainFilter] = useState<string>("");

  const { data: entityData, isLoading, error } = useQuery({
    queryKey: ["entities", domainFilter],
    queryFn: () => fetchEntities(domainFilter || undefined),
    staleTime: 60_000,
  });

  const catalog = entityData?.entities ?? [];
  const apiRelationships: ApiRelationship[] = entityData?.relationships ?? [];
  const connections = resolveConnections(canvasNodes, apiRelationships);
  const selectedNode = canvasNodes.find(n => n.id === selectedId) ?? null;

  const addNode = (template: Record<string, unknown>) => {
    const id = makeId();
    setCanvasNodes(prev => [...prev, {
      id,
      entityId: template.id as string,
      label: template.label as string,
      type: template.type as string,
      domain: template.domain as string,
      x: 200 + Math.random() * 500,
      y: 80 + Math.random() * 350,
      confidence: template.confidence as number | undefined,
      metadata: template.metadata as Record<string, string> | undefined,
    }]);
    setShowCatalog(false);
  };

  const removeNode = (id: string) => {
    setCanvasNodes(prev => prev.filter(n => n.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const handleMouseDown = useCallback((e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    setSelectedId(nodeId);
    const node = canvasNodes.find(n => n.id === nodeId)!;
    setDragging({ id: nodeId, ox: e.clientX - node.x * zoom - pan.x, oy: e.clientY - node.y * zoom - pan.y });
  }, [canvasNodes, zoom, pan]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (dragging) {
      const nx = (e.clientX - dragging.ox - pan.x) / zoom;
      const ny = (e.clientY - dragging.oy - pan.y) / zoom;
      setCanvasNodes(prev => prev.map(n => n.id === dragging.id ? { ...n, x: nx, y: ny } : n));
    } else if (panStart) {
      setPan({ x: panStart.px + e.clientX - panStart.mx, y: panStart.py + e.clientY - panStart.my });
    }
  }, [dragging, panStart, pan, zoom]);

  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    setSelectedId(null);
    setPanStart({ mx: e.clientX, my: e.clientY, px: pan.x, py: pan.y });
  }, [pan]);

  const handleMouseUp = useCallback(() => {
    setDragging(null);
    setPanStart(null);
  }, []);

  const getNodePos = (id: string) => {
    const n = canvasNodes.find(n => n.id === id);
    return n ? { x: n.x * zoom + pan.x + 60, y: n.y * zoom + pan.y + 30 } : null;
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
        <div>
          <h1 className="text-lg font-display font-bold text-foreground">Entity Canvas</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {canvasNodes.length} entities · {connections.length} mapped relationships
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setZoom(z => Math.min(z + 0.1, 2))}
            className="w-7 h-7 flex items-center justify-center rounded border border-border text-muted-foreground hover:text-foreground transition-colors"
          ><ZoomIn className="w-3.5 h-3.5" /></button>
          <button
            onClick={() => setZoom(z => Math.max(z - 0.1, 0.4))}
            className="w-7 h-7 flex items-center justify-center rounded border border-border text-muted-foreground hover:text-foreground transition-colors"
          ><ZoomOut className="w-3.5 h-3.5" /></button>
          <button
            onClick={() => { setPan({ x: 0, y: 0 }); setZoom(1); }}
            className="w-7 h-7 flex items-center justify-center rounded border border-border text-muted-foreground hover:text-foreground transition-colors"
          ><RefreshCw className="w-3.5 h-3.5" /></button>
          <div className="relative">
            <button
              onClick={() => setShowCatalog(!showCatalog)}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded border border-[hsla(258,80%,62%,0.4)] text-[hsl(258_80%_72%)] hover:bg-[hsla(258,80%,62%,0.08)] transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Add Entity
            </button>
            {showCatalog && (
              <div className="absolute right-0 top-full mt-1 z-50 w-80 bg-card border border-border rounded-lg shadow-xl overflow-hidden">
                <div className="px-3 py-2 border-b border-border flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider flex-1">
                    Entity Catalog
                  </span>
                  <select
                    value={domainFilter}
                    onChange={e => setDomainFilter(e.target.value)}
                    className="text-[10px] bg-background border border-border text-foreground rounded px-1.5 py-0.5 focus:outline-none"
                  >
                    <option value="">All Domains</option>
                    {Object.keys(DOMAIN_META).map(d => (
                      <option key={d} value={d} className="capitalize">{d}</option>
                    ))}
                  </select>
                </div>
                <div className="py-1 max-h-80 overflow-y-auto">
                  {isLoading ? (
                    <div className="flex items-center justify-center py-6">
                      <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                    </div>
                  ) : error ? (
                    <div className="flex items-center justify-center py-6 gap-1.5 text-muted-foreground">
                      <AlertCircle className="w-3.5 h-3.5 text-red-500" />
                      <span className="text-xs">Failed to load entities</span>
                    </div>
                  ) : catalog.length === 0 ? (
                    <div className="py-6 text-center text-xs text-muted-foreground">No entities found</div>
                  ) : (
                    catalog.map((t: Record<string, unknown>, i: number) => {
                      const meta = DOMAIN_META[t.domain as string];
                      const Icon = meta?.icon ?? Shield;
                      return (
                        <button
                          key={i}
                          onClick={() => addNode(t)}
                          className="w-full flex items-start gap-2.5 px-3 py-2 hover:bg-muted transition-colors text-left"
                        >
                          <div className="w-6 h-6 rounded flex items-center justify-center shrink-0 mt-0.5" style={{ background: `${meta?.color}18`, color: meta?.color }}>
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <div className="text-xs font-medium text-foreground">{t.label as string}</div>
                            <div className="text-[10px] text-muted-foreground capitalize">{t.type as string} · {t.domain as string}</div>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Canvas */}
        <div
          className="flex-1 relative overflow-hidden"
          style={{ cursor: panStart ? "grabbing" : dragging ? "grabbing" : "grab" }}
        >
          {canvasNodes.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 pointer-events-none">
              <Network className="w-12 h-12 text-muted-foreground/30 mb-4" />
              <p className="text-sm text-muted-foreground">Add entities from the catalog to explore relationships</p>
              <p className="text-xs text-muted-foreground/60 mt-2">Drag entities to position them · Real relationships surface automatically</p>
            </div>
          )}
          <svg
            ref={canvasRef}
            className="w-full h-full"
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {connections.map((conn, i) => {
              const from = getNodePos(conn.from);
              const to = getNodePos(conn.to);
              if (!from || !to) return null;
              return (
                <g key={i}>
                  <line
                    x1={from.x} y1={from.y}
                    x2={to.x} y2={to.y}
                    stroke={`hsla(258,80%,62%,${conn.strength * 0.35})`}
                    strokeWidth={conn.strength * 1.5}
                    strokeDasharray="4 3"
                  />
                  <text
                    x={(from.x + to.x) / 2}
                    y={(from.y + to.y) / 2 - 4}
                    textAnchor="middle"
                    fontSize="9"
                    fill="hsla(220,15%,92%,0.4)"
                    fontFamily="JetBrains Mono, monospace"
                  >{conn.label}</text>
                </g>
              );
            })}
          </svg>

          {canvasNodes.map((node) => {
            const meta = DOMAIN_META[node.domain];
            const Icon = meta?.icon ?? Shield;
            return (
              <div
                key={node.id}
                className={cn("entity-node absolute select-none", selectedId === node.id && "selected")}
                style={{
                  left: node.x * zoom + pan.x,
                  top: node.y * zoom + pan.y,
                  width: 140,
                  transform: `scale(${zoom})`,
                  transformOrigin: "top left",
                }}
                onMouseDown={(e) => handleMouseDown(e, node.id)}
              >
                <div className="p-2.5">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-5 h-5 rounded flex items-center justify-center" style={{ background: `${meta?.color}18`, color: meta?.color }}>
                      <Icon className="w-3 h-3" />
                    </div>
                    <span className="text-[9px] text-muted-foreground font-mono capitalize">{node.domain}</span>
                  </div>
                  <div className="text-xs font-medium text-foreground leading-snug">{node.label}</div>
                  <div className="text-[9px] text-muted-foreground mt-0.5">{node.type}</div>
                  {node.confidence != null && (
                    <div className="mt-1.5 flex items-center gap-1">
                      <div className="flex-1 h-0.5 rounded bg-border overflow-hidden">
                        <div className="h-full rounded" style={{ width: `${node.confidence * 100}%`, background: meta?.color }} />
                      </div>
                      <span className="text-[9px] text-muted-foreground font-mono">{Math.round(node.confidence * 100)}%</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Detail panel */}
        {selectedNode && (
          <div className="w-72 border-l border-border bg-[hsl(226_24%_4%)] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <span className="text-xs font-medium text-foreground">Entity Detail</span>
              <button
                onClick={() => removeNode(selectedNode.id)}
                className="text-muted-foreground hover:text-destructive transition-colors"
              ><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {(() => {
                const meta = DOMAIN_META[selectedNode.domain];
                const Icon = meta?.icon ?? Shield;
                const nodeConnections = connections.filter(c => c.from === selectedNode.id || c.to === selectedNode.id);
                return (
                  <>
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${meta?.color}18`, color: meta?.color }}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-foreground">{selectedNode.label}</div>
                        <div className="text-xs text-muted-foreground capitalize">{selectedNode.type} · {selectedNode.domain}</div>
                      </div>
                    </div>

                    {selectedNode.confidence != null && (
                      <div>
                        <div className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider mb-1.5">Confidence</div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 rounded bg-border overflow-hidden">
                            <div className="h-full rounded" style={{ width: `${selectedNode.confidence * 100}%`, background: meta?.color }} />
                          </div>
                          <span className="text-xs font-mono text-foreground">{Math.round(selectedNode.confidence * 100)}%</span>
                        </div>
                      </div>
                    )}

                    {selectedNode.metadata && (
                      <div>
                        <div className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider mb-1.5">Attributes</div>
                        <div className="space-y-1.5">
                          {Object.entries(selectedNode.metadata).map(([k, v]) => (
                            <div key={k} className="flex items-center justify-between">
                              <span className="text-xs text-muted-foreground capitalize">{k}</span>
                              <span className="text-xs font-mono text-foreground">{v}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {nodeConnections.length > 0 && (
                      <div>
                        <div className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider mb-1.5">
                          Connections ({nodeConnections.length})
                        </div>
                        <div className="space-y-1">
                          {nodeConnections.map((conn, i) => {
                            const otherId = conn.from === selectedNode.id ? conn.to : conn.from;
                            const other = canvasNodes.find(n => n.id === otherId);
                            const otherMeta = DOMAIN_META[other?.domain ?? ""];
                            const OtherIcon = otherMeta?.icon ?? Shield;
                            return (
                              <div key={i} className="flex items-center gap-2 text-xs">
                                <span style={{ color: otherMeta?.color }} className="flex items-center shrink-0">
                                  <OtherIcon className="w-3 h-3" />
                                </span>
                                <span className="text-muted-foreground flex-1 truncate">{other?.label}</span>
                                <span className="text-[10px] text-muted-foreground font-mono">{conn.label}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
