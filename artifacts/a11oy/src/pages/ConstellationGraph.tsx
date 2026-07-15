import { useState } from 'react';
import { Layout } from '../components/layout';
import { PageHeader, KpiCard, Card } from '../components/ui';

const NODES = [
  { id: 'pulse', name: 'Pulse', vertical: 'Founder Ops', status: 'live', tier: 'platform', x: 250, y: 250, color: '#8a8a8a', icon: '◉' },
  { id: 'lyte', name: 'Lyte', vertical: 'Revenue', status: 'live', tier: 'enterprise', x: 390, y: 180, color: '#c9b787', icon: '◆' },
  { id: 'vessels', name: 'Vessels', vertical: 'Maritime', status: 'live', tier: 'enterprise', x: 420, y: 300, color: '#8a8a8a', icon: '⚓' },
  { id: 'counsel', name: 'Counsel', vertical: 'Legal', status: 'live', tier: 'enterprise', x: 350, y: 380, color: '#c9b787', icon: '⚖' },
  { id: 'terra', name: 'Terra', vertical: 'Real Estate', status: 'live', tier: 'enterprise', x: 160, y: 370, color: '#8a8a8a', icon: '▣' },
  { id: 'aegis', name: 'Aegis', vertical: 'Defense', status: 'live', tier: 'sovereign', x: 110, y: 260, color: '#f5f5f5', icon: '⬡' },
  { id: 'tenax', name: 'TENAX', vertical: 'Cyber', status: 'live', tier: 'enterprise', x: 130, y: 160, color: '#c9b787', icon: '⬡' },
  { id: 'carlota-jo', name: 'Carlota Jo', vertical: 'Consulting', status: 'live', tier: 'professional', x: 390, y: 430, color: '#c9b787', icon: '◎' },
  { id: 'nuro-forge', name: 'NuroForge', vertical: 'AI Infra', status: 'beta', tier: 'platform', x: 250, y: 120, color: '#5e5e5e', icon: '⬟' },
  { id: 'meridian', name: 'Meridian', vertical: 'Infra', status: 'beta', tier: 'enterprise', x: 460, y: 210, color: '#5e5e5e', icon: '⬡' },
  { id: 'firestorm', name: 'Firestorm', vertical: 'Operations', status: 'roadmap', tier: 'sovereign', x: 160, y: 460, color: '#5e5e5e', icon: '⬢' },
  { id: 'constellation', name: 'Constellation', vertical: 'Graph Intel', status: 'roadmap', tier: 'platform', x: 250, y: 460, color: '#5e5e5e', icon: '✦' },
];

const EDGES = [
  { source: 'pulse', target: 'vessels', relation: 'signal_feed', label: 'Signal Feed' },
  { source: 'pulse', target: 'counsel', relation: 'signal_feed', label: 'Signal Feed' },
  { source: 'pulse', target: 'terra', relation: 'signal_feed', label: 'Signal Feed' },
  { source: 'pulse', target: 'lyte', relation: 'signal_feed', label: 'Signal Feed' },
  { source: 'aegis', target: 'tenax', relation: 'threat_share', label: 'Threat Share' },
  { source: 'vessels', target: 'firestorm', relation: 'crisis_escalation', label: 'Crisis Escalation' },
  { source: 'lyte', target: 'counsel', relation: 'contract_reference', label: 'Contract Reference' },
  { source: 'terra', target: 'counsel', relation: 'matter_reference', label: 'Matter Reference' },
  { source: 'nuro-forge', target: 'vessels', relation: 'agent_supply', label: 'Agent Supply' },
  { source: 'nuro-forge', target: 'aegis', relation: 'agent_supply', label: 'Agent Supply' },
  { source: 'constellation', target: 'pulse', relation: 'graph_feed', label: 'Graph Feed' },
  { source: 'constellation', target: 'lyte', relation: 'graph_feed', label: 'Graph Feed' },
  { source: 'carlota-jo', target: 'counsel', relation: 'matter_reference', label: 'Matter Reference' },
  { source: 'meridian', target: 'nuro-forge', relation: 'infra_support', label: 'Infra Support' },
];

function nodeById(id: string) {
  return NODES.find(n => n.id === id);
}

const STATUS_COLOR: Record<string, string> = { live: '#c9b787', beta: '#8a8a8a', roadmap: '#5e5e5e' };

export function ConstellationGraph() {
  const [selected, setSelected] = useState<string | null>(null);
  const [hoveredEdge, setHoveredEdge] = useState<string | null>(null);

  const selectedNode = selected ? NODES.find(n => n.id === selected) : null;
  const connectedEdges = selected
    ? EDGES.filter(e => e.source === selected || e.target === selected)
    : [];
  const connectedNodeIds = new Set(connectedEdges.flatMap(e => [e.source, e.target]));

  return (
    <Layout>
      <PageHeader
        label="CONSTELLATION MAP"
        title="12-Vertical Constellation"
        subtitle="The A11oy constellation — 12 governed applications connected by the signal mesh, proof chain, and MCP gateway. Every edge is a governed data flow."
        status="LIVE"
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <KpiCard label="APPLICATIONS" value={NODES.length} sub="in constellation" accent="#c9b787" />
        <KpiCard label="LIVE" value={NODES.filter(n => n.status === 'live').length} sub="operational" accent="#c9b787" />
        <KpiCard label="CONNECTIONS" value={EDGES.length} sub="governed edges" accent="#8a8a8a" />
        <KpiCard label="VERTICALS" value={new Set(NODES.map(n => n.vertical)).size} sub="domains covered" accent="#c9b787" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 rounded-lg border overflow-hidden" style={{ backgroundColor: 'var(--color-a11oy-card)', borderColor: 'var(--color-a11oy-border)', minHeight: 520 }}>
          <div className="p-3 border-b text-xs font-mono flex items-center justify-between" style={{ borderColor: 'var(--color-a11oy-border)', color: 'var(--color-a11oy-text-ghost)' }}>
            <span>CONSTELLATION GRAPH — Click a node to explore connections</span>
            {selected && <button onClick={() => setSelected(null)} style={{ color: '#c9b787' }}>Clear</button>}
          </div>
          <div className="relative" style={{ height: 480 }}>
            <svg width="100%" height="100%" viewBox="0 0 560 500" style={{ overflow: 'visible' }}>
              {EDGES.map((edge, i) => {
                const src = nodeById(edge.source);
                const tgt = nodeById(edge.target);
                if (!src || !tgt) return null;
                const isHighlighted = selected
                  ? (edge.source === selected || edge.target === selected)
                  : true;
                const isHovered = hoveredEdge === `${edge.source}-${edge.target}`;
                return (
                  <line
                    key={i}
                    x1={src.x} y1={src.y} x2={tgt.x} y2={tgt.y}
                    stroke={isHovered ? '#c9b787' : isHighlighted ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.03)'}
                    strokeWidth={isHovered ? 1.5 : 0.75}
                    strokeDasharray={edge.relation === 'signal_feed' ? 'none' : '4,4'}
                    onMouseEnter={() => setHoveredEdge(`${edge.source}-${edge.target}`)}
                    onMouseLeave={() => setHoveredEdge(null)}
                    style={{ cursor: 'pointer', transition: 'stroke 0.2s' }}
                  />
                );
              })}
              {NODES.map(node => {
                const isDimmed = selected && !connectedNodeIds.has(node.id) && node.id !== selected;
                const isSelected = node.id === selected;
                return (
                  <g
                    key={node.id}
                    transform={`translate(${node.x}, ${node.y})`}
                    onClick={() => setSelected(isSelected ? null : node.id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <circle
                      r={isSelected ? 22 : 16}
                      fill={isSelected ? `${node.color}25` : 'rgba(255,255,255,0.04)'}
                      stroke={isSelected ? node.color : node.status === 'roadmap' ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.15)'}
                      strokeWidth={isSelected ? 2 : 1}
                      opacity={isDimmed ? 0.25 : 1}
                      style={{ transition: 'all 0.2s' }}
                    />
                    <text
                      textAnchor="middle" dominantBaseline="central"
                      fontSize={node.status === 'roadmap' ? 11 : 13}
                      fill={isDimmed ? '#3a3a3a' : node.color}
                      opacity={isDimmed ? 0.3 : node.status === 'roadmap' ? 0.4 : 0.9}
                    >{node.icon}</text>
                    <text
                      y={26} textAnchor="middle"
                      fontSize={9} fontFamily="ui-monospace, monospace"
                      fill={isDimmed ? '#3a3a3a' : STATUS_COLOR[node.status]}
                      opacity={isDimmed ? 0.3 : node.status === 'roadmap' ? 0.4 : 0.7}
                    >{node.name}</text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {selectedNode ? (
            <>
              <Card>
                <div className="flex items-start gap-3 mb-3">
                  <span style={{ fontSize: '1.5rem', color: selectedNode.color }}>{selectedNode.icon}</span>
                  <div>
                    <div className="font-semibold" style={{ color: 'var(--color-a11oy-text)' }}>{selectedNode.name}</div>
                    <div className="text-xs font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{selectedNode.vertical} · {selectedNode.tier}</div>
                    <span className="text-xs font-mono px-2 py-0.5 rounded mt-1 inline-block" style={{ background: 'rgba(201,183,135,0.12)', color: STATUS_COLOR[selectedNode.status] }}>{selectedNode.status.toUpperCase()}</span>
                  </div>
                </div>
                <div className="text-xs" style={{ color: 'var(--color-a11oy-text-sub)' }}>
                  {connectedEdges.length} connection{connectedEdges.length !== 1 ? 's' : ''}
                </div>
              </Card>
              <div className="text-xs font-mono uppercase tracking-widest mb-1" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Connections</div>
              {connectedEdges.map((edge, i) => {
                const other = nodeById(edge.source === selectedNode.id ? edge.target : edge.source);
                if (!other) return null;
                return (
                  <Card key={i} className="text-xs cursor-pointer" style={{ cursor: 'pointer' }} onClick={() => setSelected(other.id)}>
                    <div className="flex items-center gap-2 mb-1">
                      <span style={{ color: other.color }}>{other.icon}</span>
                      <span className="font-medium" style={{ color: 'var(--color-a11oy-text)' }}>{other.name}</span>
                      <span className="ml-auto font-mono text-xs" style={{ color: STATUS_COLOR[other.status] }}>{other.status}</span>
                    </div>
                    <div className="font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
                      {edge.source === selectedNode.id ? '→' : '←'} {edge.label}
                    </div>
                  </Card>
                );
              })}
            </>
          ) : (
            <>
              <div className="text-xs font-mono uppercase tracking-widest mb-1" style={{ color: 'var(--color-a11oy-text-ghost)' }}>All Nodes</div>
              {NODES.map(node => (
                <div
                  key={node.id}
                  className="flex items-center gap-3 px-3 py-2 rounded cursor-pointer transition-all"
                  style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}
                  onClick={() => setSelected(node.id)}
                >
                  <span style={{ color: node.color, fontSize: '1rem' }}>{node.icon}</span>
                  <div className="flex-1">
                    <div className="text-xs font-medium" style={{ color: 'var(--color-a11oy-text)' }}>{node.name}</div>
                    <div className="text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{node.vertical}</div>
                  </div>
                  <span className="text-xs font-mono" style={{ color: STATUS_COLOR[node.status] }}>{node.status}</span>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}
