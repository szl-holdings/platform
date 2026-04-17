import React, { useEffect, useRef, useState } from "react";

export interface EcosystemNode {
  id: string;
  name: string;
  icon: string;
  layer: 0 | 1 | 2 | 3;
  accent: string;
  path: string;
  subtitle: string;
  description: string;
  angle?: number;
}

const ECOSYSTEM_NODES: EcosystemNode[] = [
  {
    id: "beacon",
    name: "Terra",
    icon: "📡",
    layer: 0,
    accent: "#4a90b8",
    path: "/terra/",
    subtitle: "Business Telemetry",
    description: "KPI movement & value leakage detection",
    angle: 0,
  },
  {
    id: "command",
    name: "Command",
    icon: "◆",
    layer: 0,
    accent: "#22d3ee",
    path: "/command/",
    subtitle: "Unified Command",
    description: "Strategy, Operations & Infrastructure workspace",
    angle: 90,
  },
  {
    id: "alloy",
    name: "Alloy",
    icon: "⚙️",
    layer: 0,
    accent: "#60a5fa",
    path: "/alloy/",
    subtitle: "Execution Fabric",
    description: "Connector mesh, DAGs & automation orchestration",
    angle: 270,
  },
  {
    id: "aegis",
    name: "Aegis",
    icon: "⬡",
    layer: 1,
    accent: "#8b7ac8",
    path: "/firestorm/",
    subtitle: "Unified Defense & Intelligence",
    description: "Security, managed operations & AI intelligence command",
    angle: 90,
  },
  {
    id: "vessels",
    name: "Vessels",
    icon: "🚢",
    layer: 2,
    accent: "#38bdf8",
    path: "/vessels/",
    subtitle: "Maritime Intelligence",
    description: "Fleet operations, voyage economics & AIS anomaly detection",
    angle: 225,
  },
  {
    id: "carlota-jo",
    name: "Carlota Jo",
    icon: "✨",
    layer: 3,
    accent: "#f9a8d4",
    path: "/carlota-jo/",
    subtitle: "Brand Intelligence",
    description: "Brand strategy, advisory & consulting intelligence",
    angle: 180,
  },
];

const LAYER_CONFIG = [
  { radius: 0, label: "Core Platform", sublabel: "Observe · Understand · Decide · Execute" },
  { radius: 190, label: "Security Layer", sublabel: "Threat detection & incident response" },
  { radius: 310, label: "Intelligence Layer", sublabel: "Domain expertise & AI research" },
  { radius: 410, label: "Advisory Layer", sublabel: "Human-facing intelligence delivery" },
];

const CONNECTION_PAIRS: Array<[string, string, string]> = [
  ["vessels", "aegis", "AIS anomaly → alert"],
  ["aegis", "alloy", "Containment → playbook"],
  ["alloy", "command", "Prediction → workflow"],
  ["command", "alloy", "Action → execution"],
  ["alloy", "beacon", "Result → telemetry"],
  ["carlota-jo", "aegis", "Advisory → intelligence"],
];

function polarToCartesian(angle: number, radius: number, cx: number, cy: number) {
  const rad = ((angle - 90) * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(rad),
    y: cy + radius * Math.sin(rad),
  };
}

export interface EcosystemMapProps {
  width?: number;
  height?: number;
  onNodeClick?: (node: EcosystemNode) => void;
  interactive?: boolean;
  showLabels?: boolean;
  animateIn?: boolean;
  compact?: boolean;
}

export function EcosystemMap({
  width = 700,
  height = 700,
  onNodeClick,
  interactive = true,
  showLabels = true,
  animateIn = true,
  compact = false,
}: EcosystemMapProps) {
  const cx = width / 2;
  const cy = height / 2;
  const [hovered, setHovered] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(!animateIn);
  const [revealStep, setRevealStep] = useState(0);

  useEffect(() => {
    if (!animateIn) return;
    const timer = setTimeout(() => setRevealed(true), 80);
    return () => clearTimeout(timer);
  }, [animateIn]);

  useEffect(() => {
    if (!revealed) return;
    const interval = setInterval(() => {
      setRevealStep((s) => Math.min(s + 1, 10));
    }, 80);
    return () => clearInterval(interval);
  }, [revealed]);

  const scale = compact ? 0.62 : 1;
  const nodeRadius = compact ? 26 : 32;
  const centerRadius = compact ? 42 : 52;

  const getNodePos = (node: EcosystemNode) => {
    const r = LAYER_CONFIG[node.layer].radius * scale;
    if (r === 0) return { x: cx, y: cy };
    return polarToCartesian(node.angle ?? 0, r, cx, cy);
  };

  const nodeLookup = Object.fromEntries(ECOSYSTEM_NODES.map((n) => [n.id, n]));

  const svgWidth = width;
  const svgHeight = height;

  return (
    <div
      style={{
        position: "relative",
        width: svgWidth,
        height: svgHeight,
        maxWidth: "100%",
        userSelect: "none",
      }}
    >
      <svg
        width={svgWidth}
        height={svgHeight}
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        style={{ overflow: "visible" }}
      >
        <defs>
          {ECOSYSTEM_NODES.map((n) => (
            <radialGradient key={`glow-${n.id}`} id={`glow-${n.id}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={n.accent} stopOpacity="0.3" />
              <stop offset="100%" stopColor={n.accent} stopOpacity="0" />
            </radialGradient>
          ))}
          <radialGradient id="center-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#60a5fa" stopOpacity="0" />
          </radialGradient>
          <filter id="blur-sm">
            <feGaussianBlur stdDeviation="2" />
          </filter>
        </defs>

        {[1, 2, 3].map((layer) => {
          const r = LAYER_CONFIG[layer].radius * scale;
          return (
            <circle
              key={layer}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke="rgba(255,255,255,0.05)"
              strokeWidth="1"
              strokeDasharray="4 8"
              style={{
                opacity: revealStep >= layer * 2 ? 1 : 0,
                transition: "opacity 0.4s ease",
              }}
            />
          );
        })}

        {revealStep >= 7 &&
          CONNECTION_PAIRS.map(([fromId, toId, label], i) => {
            const from = nodeLookup[fromId];
            const to = nodeLookup[toId];
            if (!from || !to) return null;
            const fp = getNodePos(from);
            const tp = getNodePos(to);
            const isHovered = hovered === fromId || hovered === toId;
            return (
              <g key={`conn-${i}`}>
                <line
                  x1={fp.x}
                  y1={fp.y}
                  x2={tp.x}
                  y2={tp.y}
                  stroke={isHovered ? from.accent : "rgba(255,255,255,0.08)"}
                  strokeWidth={isHovered ? 1.5 : 0.8}
                  strokeDasharray={isHovered ? "none" : "3 6"}
                  style={{ transition: "all 0.2s ease" }}
                />
                {isHovered && showLabels && (
                  <text
                    x={(fp.x + tp.x) / 2}
                    y={(fp.y + tp.y) / 2 - 6}
                    textAnchor="middle"
                    fill={from.accent}
                    fontSize="9"
                    fontFamily="Inter, system-ui, sans-serif"
                    opacity="0.8"
                  >
                    {label}
                  </text>
                )}
              </g>
            );
          })}

        <circle
          cx={cx}
          cy={cy}
          r={centerRadius * 2}
          fill="url(#center-glow)"
          style={{ opacity: revealStep >= 1 ? 1 : 0, transition: "opacity 0.6s ease" }}
        />

        {ECOSYSTEM_NODES.map((node, idx) => {
          const pos = getNodePos(node);
          const isCenter = node.layer === 0;
          const isHov = hovered === node.id;
          const stepNeeded = node.layer * 2 + 2;
          const visible = revealStep >= stepNeeded;

          const nr = isCenter ? centerRadius : nodeRadius;
          const labelAngle = node.angle ?? 0;
          const labelOffset = nr + 18;
          const labelRad = ((labelAngle - 90) * Math.PI) / 180;
          const labelX = pos.x + labelOffset * Math.cos(labelRad);
          const labelY = pos.y + labelOffset * Math.sin(labelRad);

          return (
            <g
              key={node.id}
              style={{
                opacity: visible ? 1 : 0,
                transform: visible ? "none" : `scale(0.5)`,
                transformOrigin: `${pos.x}px ${pos.y}px`,
                transition: "opacity 0.4s ease, transform 0.4s ease",
                cursor: interactive ? "pointer" : "default",
              }}
              onMouseEnter={() => interactive && setHovered(node.id)}
              onMouseLeave={() => interactive && setHovered(null)}
              onClick={() => {
                if (onNodeClick) {
                  onNodeClick(node);
                } else {
                  window.location.href = node.path;
                }
              }}
            >
              {isHov && (
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={nr + 12}
                  fill={`url(#glow-${node.id})`}
                  style={{ filter: "url(#blur-sm)" }}
                />
              )}
              <circle
                cx={pos.x}
                cy={pos.y}
                r={nr}
                fill={`${node.accent}18`}
                stroke={isHov ? node.accent : `${node.accent}50`}
                strokeWidth={isHov ? 2 : 1}
                style={{ transition: "all 0.2s ease" }}
              />
              <text
                x={pos.x}
                y={pos.y}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={isCenter ? "20" : "16"}
              >
                {node.icon}
              </text>
              {showLabels && (
                <text
                  x={labelX}
                  y={labelY}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill={isHov ? node.accent : "rgba(255,255,255,0.75)"}
                  fontSize="10"
                  fontFamily="Inter, system-ui, sans-serif"
                  fontWeight={isHov ? "600" : "500"}
                  style={{ transition: "fill 0.2s ease", pointerEvents: "none" }}
                >
                  {node.name}
                </text>
              )}
            </g>
          );
        })}

        {revealStep >= 1 && (
          <g>
            <text
              x={cx}
              y={cy - 10}
              textAnchor="middle"
              fill="rgba(255,255,255,0.55)"
              fontSize="10"
              fontFamily="Inter, system-ui, sans-serif"
              fontWeight="600"
              letterSpacing="1"
            >
              SZL
            </text>
            <text
              x={cx}
              y={cy + 8}
              textAnchor="middle"
              fill="rgba(255,255,255,0.3)"
              fontSize="8"
              fontFamily="Inter, system-ui, sans-serif"
            >
              ECOSYSTEM
            </text>
          </g>
        )}

        {showLabels &&
          [1, 2, 3].map((layer) => {
            const r = LAYER_CONFIG[layer].radius * scale;
            const labelY = cy - r - 10;
            return revealStep >= layer * 2 + 1 ? (
              <text
                key={`layer-label-${layer}`}
                x={cx}
                y={labelY}
                textAnchor="middle"
                fill="rgba(255,255,255,0.2)"
                fontSize="9"
                fontFamily="Inter, system-ui, sans-serif"
                letterSpacing="1"
              >
                {LAYER_CONFIG[layer].label.toUpperCase()}
              </text>
            ) : null;
          })}
      </svg>

      {hovered && (() => {
        const node = nodeLookup[hovered];
        if (!node) return null;
        return (
          <div
            style={{
              position: "absolute",
              bottom: "16px",
              left: "50%",
              transform: "translateX(-50%)",
              background: "rgba(10,12,20,0.95)",
              backdropFilter: "blur(12px)",
              border: `1px solid ${node.accent}40`,
              borderRadius: "10px",
              padding: "10px 16px",
              maxWidth: "280px",
              textAlign: "center",
              pointerEvents: "none",
              zIndex: 100,
            }}
          >
            <div
              style={{
                fontSize: "12px",
                fontWeight: 700,
                color: node.accent,
                fontFamily: "Inter, system-ui, sans-serif",
                marginBottom: "2px",
              }}
            >
              {node.name} · {node.subtitle}
            </div>
            <div
              style={{
                fontSize: "11px",
                color: "rgba(255,255,255,0.55)",
                fontFamily: "Inter, system-ui, sans-serif",
                lineHeight: 1.4,
              }}
            >
              {node.description}
            </div>
          </div>
        );
      })()}
    </div>
  );
}

export { ECOSYSTEM_NODES, LAYER_CONFIG, CONNECTION_PAIRS };
