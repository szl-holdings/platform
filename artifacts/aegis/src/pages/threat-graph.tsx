
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Eye,
  Globe,
  Network,
  Pause,
  Server,
  Shield,
  User,
  X,
} from 'lucide-react';
import { type ComponentType, type SVGProps, useRef, useState } from 'react';

type NodeType = 'endpoint' | 'identity' | 'cloud' | 'network' | 'malware' | 'c2';
type EdgeType = 'lateral' | 'c2' | 'exploit' | 'credential' | 'persistence';

interface GraphNode {
  id: string;
  type: NodeType;
  label: string;
  sublabel: string;
  risk: 'critical' | 'high' | 'medium' | 'low';
  x: number;
  y: number;
  compromised?: boolean;
  technique?: string;
}

interface GraphEdge {
  from: string;
  to: string;
  type: EdgeType;
  label: string;
  timestamp: string;
}

type LucideIcon = ComponentType<SVGProps<SVGSVGElement> & { size?: number; className?: string }>;

const NODE_CONFIG: Record<NodeType, { icon: LucideIcon; color: string; bg: string }> = {
  endpoint: { icon: Server, color: '#a78bfa', bg: 'rgba(167,139,250,0.12)' },
  identity: { icon: User, color: '#60a5fa', bg: 'rgba(96,165,250,0.12)' },
  cloud: { icon: Globe, color: '#34d399', bg: 'rgba(52,211,153,0.12)' },
  network: { icon: Network, color: '#38bdf8', bg: 'rgba(56,189,248,0.12)' },
  malware: { icon: AlertTriangle, color: '#ef4444', bg: 'rgba(239,68,68,0.15)' },
  c2: { icon: Globe, color: '#f97316', bg: 'rgba(249,115,22,0.12)' },
};

const RISK_COLORS = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#eab308',
  low: '#22c55e',
};

const EDGE_COLORS: Record<EdgeType, string> = {
  lateral: '#a78bfa',
  c2: '#ef4444',
  exploit: '#f97316',
  credential: '#60a5fa',
  persistence: '#eab308',
};

const GRAPH_NODES: GraphNode[] = [
  {
    id: 'internet',
    type: 'c2',
    label: 'C2 Server',
    sublabel: '45.33.212.44',
    risk: 'critical',
    x: 80,
    y: 220,
    technique: 'T1071.001',
  },
  {
    id: 'phish',
    type: 'malware',
    label: 'Phishing Email',
    sublabel: 'malicious-doc.docx',
    risk: 'critical',
    x: 160,
    y: 100,
    technique: 'T1566.001',
  },
  {
    id: 'ws-012',
    type: 'endpoint',
    label: 'WS-PROD-012',
    sublabel: '10.10.1.12',
    risk: 'critical',
    x: 290,
    y: 180,
    compromised: true,
    technique: 'Initial Access',
  },
  {
    id: 'svc-backup',
    type: 'identity',
    label: 'svc_backup',
    sublabel: 'Service Account',
    risk: 'critical',
    x: 430,
    y: 100,
    compromised: true,
    technique: 'T1003.001',
  },
  {
    id: 'admin-liu',
    type: 'identity',
    label: 'admin.liu',
    sublabel: 'Domain Admin',
    risk: 'high',
    x: 430,
    y: 260,
    compromised: true,
    technique: 'T1550',
  },
  {
    id: 'dc-east',
    type: 'endpoint',
    label: 'DC-EAST-01',
    sublabel: 'Domain Controller',
    risk: 'high',
    x: 560,
    y: 180,
    compromised: true,
    technique: 'T1021.002',
  },
  {
    id: 'fs-cluster',
    type: 'endpoint',
    label: 'FS-CLUSTER-03',
    sublabel: 'File Server',
    risk: 'high',
    x: 690,
    y: 120,
    technique: 'T1039',
  },
  {
    id: 'aws-prod',
    type: 'cloud',
    label: 'AWS Prod',
    sublabel: 'us-east-1',
    risk: 'medium',
    x: 690,
    y: 260,
    technique: 'T1078.004',
  },
  {
    id: 'lsass',
    type: 'malware',
    label: 'LSASS Dump',
    sublabel: 'ProcDump.exe',
    risk: 'critical',
    x: 340,
    y: 300,
    technique: 'T1003.001',
  },
];

const GRAPH_EDGES: GraphEdge[] = [
  { from: 'phish', to: 'ws-012', type: 'exploit', label: 'Initial Compromise', timestamp: '14:22' },
  { from: 'internet', to: 'ws-012', type: 'c2', label: 'C2 Beacon (HTTPS)', timestamp: '14:23' },
  { from: 'ws-012', to: 'lsass', type: 'exploit', label: 'LSASS Memory Dump', timestamp: '14:24' },
  {
    from: 'lsass',
    to: 'svc-backup',
    type: 'credential',
    label: 'Hash Extracted',
    timestamp: '14:25',
  },
  {
    from: 'lsass',
    to: 'admin-liu',
    type: 'credential',
    label: 'Hash Extracted',
    timestamp: '14:25',
  },
  {
    from: 'svc-backup',
    to: 'dc-east',
    type: 'lateral',
    label: 'Pass-the-Hash',
    timestamp: '14:28',
  },
  { from: 'admin-liu', to: 'dc-east', type: 'lateral', label: 'Pass-the-Hash', timestamp: '14:29' },
  {
    from: 'dc-east',
    to: 'fs-cluster',
    type: 'lateral',
    label: 'SMB Lateral Move',
    timestamp: '14:35',
  },
  { from: 'dc-east', to: 'aws-prod', type: 'lateral', label: 'Cloud Pivot', timestamp: '14:38' },
];

const EDGE_LABELS: Record<EdgeType, string> = {
  lateral: 'Lateral Movement',
  c2: 'Command & Control',
  exploit: 'Exploitation',
  credential: 'Credential Theft',
  persistence: 'Persistence',
};

export default function ThreatGraph() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<GraphEdge | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [filterEdge, setFilterEdge] = useState<string>('all');
  const [_zoom, _setZoom] = useState(1);
  const [animate, setAnimate] = useState(true);

  const NODE_R = 28;
  const VIEWBOX_W = 820;
  const VIEWBOX_H = 440;

  function getNodeById(id: string) {
    return GRAPH_NODES.find((n) => n.id === id);
  }

  function getEdgeMidpoint(e: GraphEdge) {
    const from = getNodeById(e.from);
    const to = getNodeById(e.to);
    if (!from || !to) return { x: 0, y: 0 };
    return { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 };
  }

  const visibleEdges =
    filterEdge === 'all' ? GRAPH_EDGES : GRAPH_EDGES.filter((e) => e.type === filterEdge);

  return (
    <div className="h-full flex flex-col overflow-hidden" style={{ background: '#060e1a' }}>
      {/* Header */}
      <div
        className="px-6 py-4 border-b flex items-center justify-between shrink-0"
        style={{ borderColor: 'rgba(239,68,68,0.1)' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(167,139,250,0.1)' }}
          >
            <Network className="w-4 h-4 text-purple-400" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white">Threat Graph</h1>
            <p className="text-[10px] text-white/30">
              Attack chain visualization — lateral movement · process trees · entity linking
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="flex items-center gap-1 px-2 py-1 rounded border text-[9px]"
            style={{
              borderColor: 'rgba(239,68,68,0.2)',
              color: '#ef4444',
              background: 'rgba(239,68,68,0.06)',
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
            INC-2041 — APT41 Active
          </div>
          <button
            onClick={() => setAnimate(!animate)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[10px] transition-all"
            style={{ borderColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)' }}
          >
            {animate ? <Pause className="w-3 h-3" /> : <Activity className="w-3 h-3" />}
            {animate ? 'Pause' : 'Animate'}
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Graph Canvas */}
        <div className="flex-1 relative overflow-hidden">
          {/* Legend */}
          <div
            className="absolute top-3 left-3 z-10 rounded-xl border p-3 space-y-2"
            style={{
              background: 'rgba(6,14,26,0.9)',
              borderColor: 'rgba(255,255,255,0.08)',
              backdropFilter: 'blur(8px)',
            }}
          >
            <p className="text-[9px] text-white/30 font-medium uppercase tracking-wider">
              Edge Types
            </p>
            {(['lateral', 'c2', 'exploit', 'credential'] as EdgeType[]).map((t) => (
              <button
                key={t}
                onClick={() => setFilterEdge(filterEdge === t ? 'all' : t)}
                className="flex items-center gap-2 text-[9px] transition-all"
                style={{
                  color:
                    filterEdge === t || filterEdge === 'all'
                      ? EDGE_COLORS[t]
                      : 'rgba(255,255,255,0.2)',
                }}
              >
                <div
                  className="w-5 h-px"
                  style={{
                    background: EDGE_COLORS[t],
                    opacity: filterEdge === t || filterEdge === 'all' ? 1 : 0.3,
                  }}
                />
                {EDGE_LABELS[t]}
              </button>
            ))}
          </div>

          {/* Node type legend */}
          <div
            className="absolute bottom-3 left-3 z-10 rounded-xl border p-3 space-y-1.5"
            style={{
              background: 'rgba(6,14,26,0.9)',
              borderColor: 'rgba(255,255,255,0.08)',
              backdropFilter: 'blur(8px)',
            }}
          >
            <p className="text-[9px] text-white/30 font-medium uppercase tracking-wider">
              Node Types
            </p>
            {(Object.entries(NODE_CONFIG) as [NodeType, (typeof NODE_CONFIG)[NodeType]][]).map(
              ([type, cfg]) => {
                const Icon = cfg.icon;
                return (
                  <div
                    key={type}
                    className="flex items-center gap-1.5 text-[9px]"
                    style={{ color: 'rgba(255,255,255,0.4)' }}
                  >
                    <Icon className="w-3 h-3" style={{ color: cfg.color }} />
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </div>
                );
              },
            )}
          </div>

          <svg
            ref={svgRef}
            viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`}
            className="w-full h-full"
            style={{ background: 'transparent' }}
          >
            <defs>
              {(Object.entries(EDGE_COLORS) as [EdgeType, string][]).map(([type, color]) => (
                <marker
                  key={type}
                  id={`arrow-${type}`}
                  viewBox="0 0 8 8"
                  refX="6"
                  refY="4"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto"
                >
                  <path d="M0,0 L0,8 L8,4 z" fill={color} opacity={0.7} />
                </marker>
              ))}
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Grid background */}
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path
                d="M 40 0 L 0 0 0 40"
                fill="none"
                stroke="rgba(255,255,255,0.03)"
                strokeWidth="0.5"
              />
            </pattern>
            <rect width="100%" height="100%" fill="url(#grid)" />

            {/* Edges */}
            {visibleEdges.map((edge, idx) => {
              const from = getNodeById(edge.from);
              const to = getNodeById(edge.to);
              if (!from || !to) return null;
              const color = EDGE_COLORS[edge.type];
              const mid = getEdgeMidpoint(edge);
              const isHighlighted =
                !selectedNode || selectedNode.id === edge.from || selectedNode.id === edge.to;

              const dx = to.x - from.x;
              const dy = to.y - from.y;
              const dist = Math.sqrt(dx * dx + dy * dy);
              const nx = dx / dist;
              const ny = dy / dist;
              const startX = from.x + nx * (NODE_R + 2);
              const startY = from.y + ny * (NODE_R + 2);
              const endX = to.x - nx * (NODE_R + 2);
              const endY = to.y - ny * (NODE_R + 2);

              return (
                <g
                  key={idx}
                  style={{ opacity: isHighlighted ? 1 : 0.15, transition: 'opacity 0.2s' }}
                >
                  <line
                    x1={startX}
                    y1={startY}
                    x2={endX}
                    y2={endY}
                    stroke={color}
                    strokeWidth="1.5"
                    strokeOpacity={0.6}
                    strokeDasharray={
                      edge.type === 'c2' ? '6 3' : edge.type === 'persistence' ? '3 3' : 'none'
                    }
                    markerEnd={`url(#arrow-${edge.type})`}
                    style={{ cursor: 'pointer' }}
                    onClick={() =>
                      setSelectedEdge(
                        selectedEdge?.from === edge.from && selectedEdge?.to === edge.to
                          ? null
                          : edge,
                      )
                    }
                  />
                  {/* Edge label on hover */}
                  <text
                    x={mid.x}
                    y={mid.y - 5}
                    textAnchor="middle"
                    fontSize="8"
                    fill={color}
                    opacity={hoveredNode === edge.from || hoveredNode === edge.to ? 0.8 : 0}
                    style={{ transition: 'opacity 0.15s', pointerEvents: 'none' }}
                  >
                    {edge.label}
                  </text>
                  <text
                    x={mid.x}
                    y={mid.y + 7}
                    textAnchor="middle"
                    fontSize="7"
                    fill={color}
                    opacity={hoveredNode === edge.from || hoveredNode === edge.to ? 0.5 : 0}
                    style={{ transition: 'opacity 0.15s', pointerEvents: 'none' }}
                  >
                    {edge.timestamp}
                  </text>
                </g>
              );
            })}

            {/* Nodes */}
            {GRAPH_NODES.map((node) => {
              const cfg = NODE_CONFIG[node.type];
              const _Icon = cfg.icon;
              const isSelected = selectedNode?.id === node.id;
              const isHovered = hoveredNode === node.id;
              const riskColor = RISK_COLORS[node.risk];
              const isHighlighted =
                !selectedNode ||
                selectedNode.id === node.id ||
                GRAPH_EDGES.some(
                  (e) =>
                    (e.from === selectedNode.id && e.to === node.id) ||
                    (e.to === selectedNode.id && e.from === node.id),
                );

              return (
                <g
                  key={node.id}
                  style={{
                    cursor: 'pointer',
                    opacity: isHighlighted ? 1 : 0.3,
                    transition: 'opacity 0.2s',
                    filter: (isSelected || isHovered) && node.compromised ? 'url(#glow)' : 'none',
                  }}
                  onClick={() => setSelectedNode(isSelected ? null : node)}
                  onMouseEnter={() => setHoveredNode(node.id)}
                  onMouseLeave={() => setHoveredNode(null)}
                >
                  {/* Pulse ring for compromised nodes */}
                  {node.compromised && animate && (
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={NODE_R + 6}
                      fill="none"
                      stroke={riskColor}
                      strokeWidth="1"
                      opacity="0.4"
                    >
                      <animate
                        attributeName="r"
                        values={`${NODE_R + 4};${NODE_R + 14};${NODE_R + 4}`}
                        dur="2s"
                        repeatCount="indefinite"
                      />
                      <animate
                        attributeName="opacity"
                        values="0.5;0;0.5"
                        dur="2s"
                        repeatCount="indefinite"
                      />
                    </circle>
                  )}

                  {/* Selection ring */}
                  {isSelected && (
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={NODE_R + 4}
                      fill="none"
                      stroke={cfg.color}
                      strokeWidth="1.5"
                      strokeDasharray="4 2"
                      opacity="0.8"
                    />
                  )}

                  {/* Node body */}
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={NODE_R}
                    fill={cfg.bg}
                    stroke={node.compromised ? riskColor : cfg.color}
                    strokeWidth={node.compromised ? '1.5' : '1'}
                    strokeOpacity={0.5}
                  />

                  {/* Risk indicator dot */}
                  <circle
                    cx={node.x + NODE_R * 0.65}
                    cy={node.y - NODE_R * 0.65}
                    r="5"
                    fill={riskColor}
                    stroke="#060e1a"
                    strokeWidth="1"
                  />

                  {/* Node label */}
                  <text
                    x={node.x}
                    y={node.y + NODE_R + 14}
                    textAnchor="middle"
                    fontSize="9"
                    fill="rgba(255,255,255,0.7)"
                    fontWeight="600"
                  >
                    {node.label}
                  </text>
                  <text
                    x={node.x}
                    y={node.y + NODE_R + 24}
                    textAnchor="middle"
                    fontSize="7.5"
                    fill="rgba(255,255,255,0.3)"
                  >
                    {node.sublabel}
                  </text>

                  {/* Technique label */}
                  {node.technique && (
                    <text
                      x={node.x}
                      y={node.y + NODE_R + 35}
                      textAnchor="middle"
                      fontSize="7"
                      fill={cfg.color}
                      opacity="0.6"
                    >
                      {node.technique}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Right Panel — Node Detail */}
        {selectedNode && (
          <div
            className="w-[280px] shrink-0 border-l overflow-y-auto"
            style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(6,14,26,0.98)' }}
          >
            <div className="p-4">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-[9px] text-white/30 mb-1">{selectedNode.type.toUpperCase()}</p>
                  <h3 className="text-sm font-bold text-white">{selectedNode.label}</h3>
                  <p className="text-[10px] text-white/40">{selectedNode.sublabel}</p>
                </div>
                <button
                  onClick={() => setSelectedNode(null)}
                  className="p-1 rounded hover:bg-white/5 text-white/30"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex items-center gap-2 mb-4">
                <span
                  className="px-2 py-0.5 rounded text-[9px] font-bold border"
                  style={{
                    color: RISK_COLORS[selectedNode.risk],
                    borderColor: `${RISK_COLORS[selectedNode.risk]}30`,
                    background: `${RISK_COLORS[selectedNode.risk]}10`,
                  }}
                >
                  {selectedNode.risk.toUpperCase()}
                </span>
                {selectedNode.compromised && (
                  <span className="px-2 py-0.5 rounded text-[9px] font-bold border text-red-400 border-red-500/30 bg-red-500/10">
                    COMPROMISED
                  </span>
                )}
              </div>

              {selectedNode.technique && (
                <div
                  className="mb-4 p-3 rounded-lg border"
                  style={{
                    borderColor: 'rgba(167,139,250,0.2)',
                    background: 'rgba(167,139,250,0.06)',
                  }}
                >
                  <p className="text-[9px] text-purple-300/50 mb-1">ATT&CK Technique</p>
                  <p className="text-[11px] text-purple-300 font-mono font-bold">
                    {selectedNode.technique}
                  </p>
                </div>
              )}

              {/* Connected edges */}
              <div>
                <p className="text-[9px] text-white/30 mb-2">ATTACK CHAIN CONNECTIONS</p>
                <div className="space-y-2">
                  {GRAPH_EDGES.filter(
                    (e) => e.from === selectedNode.id || e.to === selectedNode.id,
                  ).map((edge, idx) => {
                    const isFrom = edge.from === selectedNode.id;
                    const otherId = isFrom ? edge.to : edge.from;
                    const other = getNodeById(otherId);
                    const color = EDGE_COLORS[edge.type];
                    return (
                      <div
                        key={idx}
                        className="flex items-center gap-2 p-2 rounded-lg border text-[10px]"
                        style={{
                          borderColor: 'rgba(255,255,255,0.05)',
                          background: 'rgba(255,255,255,0.02)',
                        }}
                      >
                        {isFrom ? (
                          <>
                            <ArrowRight className="w-3 h-3 shrink-0" style={{ color }} />
                            <span style={{ color }}>{edge.label}</span>
                            <span className="text-white/30 ml-auto">{other?.label}</span>
                          </>
                        ) : (
                          <>
                            <span className="text-white/30">{other?.label}</span>
                            <ArrowRight className="w-3 h-3 shrink-0 ml-auto" style={{ color }} />
                          </>
                        )}
                        <span className="text-[9px] text-white/20 font-mono">{edge.timestamp}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Actions */}
              <div className="mt-4 space-y-2">
                <p className="text-[9px] text-white/30">RESPONSE ACTIONS</p>
                {selectedNode.type === 'endpoint' && (
                  <button
                    className="w-full flex items-center gap-2 p-2.5 rounded-lg border text-[11px] font-medium transition-all"
                    style={{
                      borderColor: 'rgba(239,68,68,0.3)',
                      color: '#ef4444',
                      background: 'rgba(239,68,68,0.07)',
                    }}
                  >
                    <Shield className="w-3.5 h-3.5" /> Isolate Host
                  </button>
                )}
                {selectedNode.type === 'identity' && (
                  <button
                    className="w-full flex items-center gap-2 p-2.5 rounded-lg border text-[11px] font-medium transition-all"
                    style={{
                      borderColor: 'rgba(234,179,8,0.3)',
                      color: '#eab308',
                      background: 'rgba(234,179,8,0.07)',
                    }}
                  >
                    <User className="w-3.5 h-3.5" /> Disable Account
                  </button>
                )}
                <button
                  className="w-full flex items-center gap-2 p-2.5 rounded-lg border text-[11px] font-medium transition-all"
                  style={{
                    borderColor: 'rgba(96,165,250,0.2)',
                    color: '#60a5fa',
                    background: 'rgba(96,165,250,0.05)',
                  }}
                >
                  <Eye className="w-3.5 h-3.5" /> View Forensics
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
