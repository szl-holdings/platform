import React, { useState } from 'react';

const BG = 'hsla(0,0%,100%,0.025)';
const BORDER = 'hsla(0,0%,100%,0.07)';

export interface GraphNode {
  id: string;
  label: string;
  type: 'domain' | 'entity' | 'signal' | 'action';
  color: string;
  x: number;
  y: number;
  status?: 'active' | 'warning' | 'critical' | 'inactive';
  value?: string;
}

export interface GraphEdge {
  source: string;
  target: string;
  label?: string;
  strength?: 'strong' | 'medium' | 'weak';
}

interface EntityGraphProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  title?: string;
  height?: number;
}

function nodeColor(node: GraphNode) {
  if (node.status === 'critical') return '#ef4444';
  if (node.status === 'warning') return '#f59e0b';
  if (node.status === 'inactive') return '#374151';
  return node.color;
}

export function EntityGraph({
  nodes,
  edges,
  title = 'Cross-Domain Impact Map',
  height = 320,
}: EntityGraphProps) {
  const [hovered, setHovered] = useState<string | null>(null);

  const W = 600;
  const H = height;

  return (
    <div
      style={{
        background: BG,
        border: `1px solid ${BORDER}`,
        borderRadius: '0.875rem',
        padding: '1.25rem',
      }}
    >
      {title && (
        <div
          style={{
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.35)',
            marginBottom: '1rem',
          }}
        >
          {title}
        </div>
      )}

      <div style={{ width: '100%', overflowX: 'auto' }}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          style={{ width: '100%', height: `${H}px`, display: 'block' }}
        >
          <defs>
            <marker id="arrowhead" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
              <path d="M 0 0 L 6 3 L 0 6 z" fill="rgba(255,255,255,0.2)" />
            </marker>
          </defs>

          {edges.map((edge, i) => {
            const src = nodes.find((n) => n.id === edge.source);
            const tgt = nodes.find((n) => n.id === edge.target);
            if (!src || !tgt) return null;

            const sx = src.x * W;
            const sy = src.y * H;
            const tx = tgt.x * W;
            const ty = tgt.y * H;
            const mx = (sx + tx) / 2;
            const my = (sy + ty) / 2;

            const opacity =
              edge.strength === 'strong' ? 0.4 : edge.strength === 'medium' ? 0.25 : 0.15;

            return (
              <g key={i}>
                <line
                  x1={sx}
                  y1={sy}
                  x2={tx}
                  y2={ty}
                  stroke="rgba(255,255,255,0.15)"
                  strokeWidth={edge.strength === 'strong' ? 1.5 : 1}
                  strokeOpacity={opacity}
                  strokeDasharray={edge.strength === 'weak' ? '4 3' : undefined}
                  markerEnd="url(#arrowhead)"
                />
                {edge.label && (
                  <text
                    x={mx}
                    y={my - 4}
                    textAnchor="middle"
                    fill="rgba(255,255,255,0.2)"
                    fontSize="8"
                  >
                    {edge.label}
                  </text>
                )}
              </g>
            );
          })}

          {nodes.map((node) => {
            const x = node.x * W;
            const y = node.y * H;
            const color = nodeColor(node);
            const isHov = hovered === node.id;
            const r = node.type === 'domain' ? 16 : node.type === 'signal' ? 6 : 11;

            return (
              <g
                key={node.id}
                transform={`translate(${x}, ${y})`}
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setHovered(node.id)}
                onMouseLeave={() => setHovered(null)}
              >
                {node.type === 'domain' ? (
                  <rect
                    x={-r}
                    y={-r}
                    width={r * 2}
                    height={r * 2}
                    rx={4}
                    fill={`${color}20`}
                    stroke={color}
                    strokeWidth={isHov ? 2 : 1.5}
                  />
                ) : (
                  <circle
                    r={r}
                    fill={`${color}${node.type === 'signal' ? '30' : '20'}`}
                    stroke={color}
                    strokeWidth={isHov ? 2 : 1}
                  />
                )}

                {isHov && (
                  <circle r={r + 6} fill="none" stroke={color} strokeWidth="1" strokeOpacity="0.3">
                    <animate
                      attributeName="r"
                      values={`${r + 4};${r + 10};${r + 4}`}
                      dur="1.5s"
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="opacity"
                      values="0.4;0;0.4"
                      dur="1.5s"
                      repeatCount="indefinite"
                    />
                  </circle>
                )}

                <text
                  y={r + 12}
                  textAnchor="middle"
                  fill={isHov ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.4)'}
                  fontSize={node.type === 'domain' ? 9 : 8}
                  fontWeight={node.type === 'domain' ? '700' : '500'}
                >
                  {node.label}
                </text>
                {node.value && (
                  <text y={r + 22} textAnchor="middle" fill={color} fontSize="8" fontWeight="600">
                    {node.value}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
        {[
          { type: 'domain', label: 'Domain' },
          { type: 'entity', label: 'Entity' },
          { type: 'signal', label: 'Signal' },
          { type: 'action', label: 'Action' },
        ].map(({ type, label }) => (
          <div key={type} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            {type === 'domain' ? (
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: '2px',
                  background: 'rgba(255,255,255,0.15)',
                  border: '1px solid rgba(255,255,255,0.4)',
                }}
              />
            ) : (
              <div
                style={{
                  width: type === 'signal' ? 6 : 9,
                  height: type === 'signal' ? 6 : 9,
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.3)',
                }}
              />
            )}
            <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
