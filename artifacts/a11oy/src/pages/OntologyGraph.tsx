import { useState, useEffect, useRef } from 'react';
import { Layout } from '../components/layout';
import { PageHeader, Card, SectionTitle, KpiCard } from '../components/ui';

const T = {
  bg: '#0a0a0a', surface: 'rgba(255,255,255,0.025)', border: 'rgba(255,255,255,0.08)',
  text: '#f5f5f5', dim: '#8a8a8a', muted: '#5e5e5e', accent: '#c9b787',
};

const DOMAIN_COLORS: Record<string, string> = {
  maritime: '#8a8a8a', cyber: '#f5f5f5', legal: '#c9b787', revenue: '#b08d52',
  defense: '#f5f5f5', 'real-estate': '#c9b787', advisory: '#8a8a8a', core: '#5e5e5e',
};

interface OntologyNode {
  id: string; label: string; type: 'signal' | 'agent' | 'outcome' | 'policy' | 'entity';
  domain: string; x: number; y: number; connections: string[]; description: string;
}

const NODES: OntologyNode[] = [
  { id: 'n01', label: 'AIS Vessel Feed', type: 'signal', domain: 'maritime', x: 12, y: 15, connections: ['n02','n03','n10'], description: 'Real-time vessel position and status stream from AIS transponders' },
  { id: 'n02', label: 'ETA Anomaly', type: 'signal', domain: 'maritime', x: 28, y: 8, connections: ['n04','n10'], description: 'Detected delay beyond schedule threshold — triggers Cascade Navigator' },
  { id: 'n03', label: 'Sanctions Screen', type: 'policy', domain: 'maritime', x: 28, y: 22, connections: ['n04','n11'], description: 'OFAC/EU/UN compliance gate applied to all vessel and crew data' },
  { id: 'n04', label: 'Cascade Navigator', type: 'agent', domain: 'maritime', x: 45, y: 15, connections: ['n05','n06','n11'], description: 'Domain operator for maritime intelligence and fleet management' },
  { id: 'n05', label: 'Port Alternative Rec', type: 'outcome', domain: 'maritime', x: 62, y: 10, connections: ['n11','n12'], description: 'Recommended alternative port with cost, ETA, and capacity scores' },
  { id: 'n06', label: 'Fleet Dispatch', type: 'outcome', domain: 'maritime', x: 62, y: 22, connections: ['n11'], description: 'Approved fleet re-routing dispatched to port operations team' },

  { id: 'n07', label: 'SIEM Alert', type: 'signal', domain: 'cyber', x: 12, y: 40, connections: ['n08','n09','n13'], description: 'Security event correlated from SIEM with threat intel match' },
  { id: 'n08', label: 'TG-Ember IOC', type: 'entity', domain: 'cyber', x: 28, y: 35, connections: ['n09','n13'], description: 'Known threat actor IOC: C2 on 8080, DNS exfil pattern' },
  { id: 'n09', label: 'Guardian', type: 'agent', domain: 'cyber', x: 45, y: 40, connections: ['n13','n14','n15'], description: 'Cyber resilience operator — threat detection, containment, reporting' },
  { id: 'n13', label: 'Isolation Policy', type: 'policy', domain: 'cyber', x: 28, y: 48, connections: ['n09','n14'], description: 'Critical threat auto-isolation: no approval required at C2 confidence >0.95' },
  { id: 'n14', label: 'Host Isolation', type: 'outcome', domain: 'cyber', x: 62, y: 35, connections: ['n15'], description: 'Network isolation applied — 3 hosts quarantined, EDR confirmed' },
  { id: 'n15', label: 'Incident Report', type: 'outcome', domain: 'cyber', x: 62, y: 48, connections: ['n12'], description: 'Structured incident report with TTPs, timeline, and remediation plan' },

  { id: 'n16', label: 'Docket Feed', type: 'signal', domain: 'legal', x: 12, y: 65, connections: ['n17','n18'], description: 'Court calendar sync — deadlines, filings, and case status updates' },
  { id: 'n17', label: 'Late Pattern', type: 'signal', domain: 'legal', x: 28, y: 60, connections: ['n18','n19'], description: 'Opposing counsel detected late in 3 of 5 prior cases — pattern flagged' },
  { id: 'n18', label: 'Counsel Sentinel', type: 'agent', domain: 'legal', x: 45, y: 65, connections: ['n19','n20'], description: 'Legal matter intelligence operator — deadlines, filings, strategy' },
  { id: 'n19', label: 'Mandatory Notify', type: 'policy', domain: 'legal', x: 28, y: 72, connections: ['n18','n20'], description: 'Deadline < 72h triggers mandatory partner notification — non-bypassable' },
  { id: 'n20', label: 'Motion Filed', type: 'outcome', domain: 'legal', x: 62, y: 65, connections: ['n12'], description: 'Motion to compel filed with court — precedent citations included' },

  { id: 'n21', label: 'CRM Stage Data', type: 'signal', domain: 'revenue', x: 12, y: 88, connections: ['n22','n23'], description: 'Salesforce opportunity stage and velocity data — all Q2 deals' },
  { id: 'n22', label: 'Velocity Drop', type: 'signal', domain: 'revenue', x: 28, y: 83, connections: ['n23','n24'], description: 'Pipeline velocity -22% vs Q2 baseline — 14.1 vs 18.2 deals/week' },
  { id: 'n23', label: 'Pipeline Oracle', type: 'agent', domain: 'revenue', x: 45, y: 88, connections: ['n24','n25'], description: 'Revenue intelligence operator — pipeline, forecast, deal acceleration' },
  { id: 'n24', label: 'CFO Threshold', type: 'policy', domain: 'revenue', x: 28, y: 95, connections: ['n23','n25'], description: 'Forecast adjustment >15% requires CFO notification — auto-triggered' },
  { id: 'n25', label: 'Intervention Plan', type: 'outcome', domain: 'revenue', x: 62, y: 88, connections: ['n12'], description: 'Top 3 deal acceleration interventions surfaced with ROI estimates' },

  { id: 'n10', label: 'Proof Ledger', type: 'policy', domain: 'core', x: 80, y: 15, connections: ['n12'], description: 'Immutable proof entry appended for every governed execution' },
  { id: 'n11', label: 'Covenant Gate', type: 'policy', domain: 'core', x: 80, y: 40, connections: ['n10','n12'], description: 'Non-bypassable policy enforcement layer — every action gated here' },
  { id: 'n12', label: 'MirrorEval', type: 'agent', domain: 'core', x: 80, y: 65, connections: ['n10'], description: 'Counterfactual evaluation engine — validates every recommendation' },
];

const TYPE_SHAPES: Record<string, string> = {
  signal: '◆', agent: '⬡', outcome: '◇', policy: '⬢', entity: '○',
};

const TYPE_LABELS: Record<string, string> = {
  signal: 'Signal', agent: 'Agent', outcome: 'Outcome', policy: 'Policy', entity: 'Entity',
};

const DOMAINS = ['all', 'maritime', 'cyber', 'legal', 'revenue', 'core'];

export function OntologyGraph() {
  const [selectedDomain, setSelectedDomain] = useState('all');
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const visibleNodes = NODES.filter(n =>
    (selectedDomain === 'all' || n.domain === selectedDomain) &&
    (search === '' || n.label.toLowerCase().includes(search.toLowerCase()))
  );
  const visibleIds = new Set(visibleNodes.map(n => n.id));

  const focusNode = selectedNode ? NODES.find(n => n.id === selectedNode) : hoveredNode ? NODES.find(n => n.id === hoveredNode) : null;
  const connectedIds = new Set(focusNode ? [focusNode.id, ...focusNode.connections] : []);

  const typeCounts = Object.keys(TYPE_SHAPES).reduce((acc, type) => {
    acc[type] = NODES.filter(n => n.type === type).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <Layout>
      <PageHeader
        label="DOMAIN ONTOLOGY"
        title="Ontology Graph"
        subtitle="Interactive knowledge graph: signals, agents, outcomes, and policies interconnect across all verticals. Click nodes to explore causal chains."
        status="DEMO"
      />

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        <KpiCard label="ENTITIES" value={NODES.length} sub="in graph" accent={T.accent} />
        <KpiCard label="AGENTS" value={typeCounts.agent} sub="operators" accent={T.accent} />
        <KpiCard label="SIGNALS" value={typeCounts.signal} sub="triggers" accent={T.accent} />
        <KpiCard label="POLICIES" value={typeCounts.policy} sub="governance" accent={T.accent} />
        <KpiCard label="OUTCOMES" value={typeCounts.outcome} sub="results" accent={T.dim} />
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Controls */}
        <div>
          <SectionTitle>Filter</SectionTitle>
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search entities…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full rounded px-3 py-1.5 text-xs border"
              style={{ background: 'var(--color-a11oy-card)', borderColor: 'var(--color-a11oy-border)', color: T.text }}
            />
          </div>
          <div className="flex flex-col gap-1 mb-6">
            {DOMAINS.map(d => (
              <button
                key={d}
                onClick={() => setSelectedDomain(d)}
                className="text-left px-3 py-1.5 rounded text-xs font-mono transition-all"
                style={{
                  background: selectedDomain === d ? `${DOMAIN_COLORS[d] ?? T.accent}15` : 'transparent',
                  color: selectedDomain === d ? (DOMAIN_COLORS[d] ?? T.accent) : T.muted,
                  border: 'none', cursor: 'pointer',
                }}
              >
                {d === 'all' ? 'All domains' : d.charAt(0).toUpperCase() + d.slice(1)}
              </button>
            ))}
          </div>

          <SectionTitle>Legend</SectionTitle>
          <div className="flex flex-col gap-2">
            {Object.entries(TYPE_SHAPES).map(([type, icon]) => (
              <div key={type} className="flex items-center gap-2 text-[10px]">
                <span style={{ color: T.accent }}>{icon}</span>
                <span style={{ color: T.dim }}>{TYPE_LABELS[type]}</span>
                <span className="ml-auto font-mono" style={{ color: T.muted }}>{typeCounts[type]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Graph canvas */}
        <div className="lg:col-span-2">
          <div className="rounded-lg overflow-hidden" style={{ background: '#050505', border: `1px solid ${T.border}` }}>
            <div className="px-4 py-2.5 flex items-center justify-between" style={{ borderBottom: `1px solid ${T.border}` }}>
              <span className="text-[10px] font-mono uppercase tracking-wider" style={{ color: T.muted }}>Ontology Graph — {visibleNodes.length} nodes</span>
              {selectedNode && (
                <button onClick={() => setSelectedNode(null)} className="text-[9px] font-mono" style={{ color: T.muted, background: 'none', border: 'none', cursor: 'pointer' }}>
                  clear ×
                </button>
              )}
            </div>
            <div style={{ position: 'relative', paddingBottom: '100%' }}>
              <svg
                viewBox="0 0 100 105"
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
              >
                {/* Edges */}
                {visibleNodes.map(node =>
                  node.connections
                    .filter(cid => visibleIds.has(cid))
                    .map(cid => {
                      const target = NODES.find(n => n.id === cid);
                      if (!target) return null;
                      const isHighlighted = focusNode && (connectedIds.has(node.id) && connectedIds.has(cid));
                      return (
                        <line
                          key={`${node.id}-${cid}`}
                          x1={node.x} y1={node.y}
                          x2={target.x} y2={target.y}
                          stroke={isHighlighted ? DOMAIN_COLORS[node.domain] : 'rgba(255,255,255,0.06)'}
                          strokeWidth={isHighlighted ? 0.5 : 0.2}
                          strokeDasharray={node.type === 'policy' ? '1 0.5' : undefined}
                        />
                      );
                    })
                )}

                {/* Nodes */}
                {visibleNodes.map(node => {
                  const color = DOMAIN_COLORS[node.domain] ?? T.accent;
                  const isSelected = node.id === selectedNode;
                  const isConnected = focusNode && connectedIds.has(node.id);
                  const isDimmed = focusNode && !connectedIds.has(node.id);
                  return (
                    <g
                      key={node.id}
                      style={{ cursor: 'pointer' }}
                      onClick={() => setSelectedNode(isSelected ? null : node.id)}
                      onMouseEnter={() => setHoveredNode(node.id)}
                      onMouseLeave={() => setHoveredNode(null)}
                    >
                      <circle
                        cx={node.x} cy={node.y} r={isSelected ? 4 : 3}
                        fill={isSelected ? color : isConnected ? `${color}80` : '#0a0a0a'}
                        stroke={isConnected || isSelected ? color : isDimmed ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.2)'}
                        strokeWidth={isSelected ? 0.6 : 0.3}
                        opacity={isDimmed ? 0.3 : 1}
                      />
                      <text
                        x={node.x} y={node.y + 5.5}
                        textAnchor="middle"
                        fill={isDimmed ? T.muted : isConnected || isSelected ? color : T.muted}
                        fontSize={2}
                        fontFamily="monospace"
                        opacity={isDimmed ? 0.4 : 1}
                      >
                        {node.label.length > 14 ? node.label.slice(0, 13) + '…' : node.label}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>
        </div>

        {/* Detail panel */}
        <div>
          {focusNode ? (
            <Card>
              <div className="text-[9px] font-mono uppercase tracking-widest mb-2" style={{ color: T.muted }}>NODE DETAIL</div>
              <div className="flex items-center gap-2 mb-1">
                <span style={{ color: DOMAIN_COLORS[focusNode.domain] }}>{TYPE_SHAPES[focusNode.type]}</span>
                <span className="text-sm font-medium" style={{ color: T.text }}>{focusNode.label}</span>
              </div>
              <div className="flex gap-1 mb-3">
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: `${DOMAIN_COLORS[focusNode.domain]}18`, color: DOMAIN_COLORS[focusNode.domain] }}>{focusNode.domain}</span>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.05)', color: T.muted }}>{TYPE_LABELS[focusNode.type]}</span>
              </div>
              <p className="text-xs mb-4" style={{ color: T.dim }}>{focusNode.description}</p>
              <div className="text-[9px] font-mono uppercase tracking-widest mb-2" style={{ color: T.muted }}>CONNECTIONS ({focusNode.connections.length})</div>
              <div className="flex flex-col gap-1.5">
                {focusNode.connections.map(cid => {
                  const target = NODES.find(n => n.id === cid);
                  if (!target) return null;
                  return (
                    <button
                      key={cid}
                      onClick={() => setSelectedNode(cid)}
                      className="text-left flex items-center gap-2 px-2 py-1.5 rounded text-[10px]"
                      style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${T.border}`, cursor: 'pointer' }}
                    >
                      <span style={{ color: DOMAIN_COLORS[target.domain] }}>{TYPE_SHAPES[target.type]}</span>
                      <span style={{ color: T.dim }}>{target.label}</span>
                      <span className="ml-auto" style={{ color: T.muted }}>{target.domain}</span>
                    </button>
                  );
                })}
              </div>
            </Card>
          ) : (
            <Card>
              <div className="text-[9px] font-mono uppercase tracking-widest mb-2" style={{ color: T.muted }}>DOMAIN BREAKDOWN</div>
              <div className="flex flex-col gap-2">
                {Object.entries(DOMAIN_COLORS).map(([domain, color]) => {
                  const count = NODES.filter(n => n.domain === domain).length;
                  if (!count) return null;
                  return (
                    <div key={domain} className="flex items-center justify-between text-[10px]">
                      <span style={{ color }}>{domain}</span>
                      <span className="font-mono" style={{ color: T.muted }}>{count}</span>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          <div className="mt-4">
            <SectionTitle>Causal Chains</SectionTitle>
            <div className="flex flex-col gap-2">
              {[
                { chain: 'AIS Feed → ETA Anomaly → Cascade → Port Rec', domain: 'maritime' },
                { chain: 'SIEM Alert → TG-Ember IOC → Guardian → Isolation', domain: 'cyber' },
                { chain: 'Docket Feed → Late Pattern → Counsel → Motion', domain: 'legal' },
                { chain: 'CRM Data → Velocity Drop → Oracle → Intervention', domain: 'revenue' },
              ].map(c => (
                <div key={c.chain} className="p-2 rounded text-[9px]" style={{ background: `${DOMAIN_COLORS[c.domain]}08`, border: `1px solid ${DOMAIN_COLORS[c.domain]}20` }}>
                  <div style={{ color: DOMAIN_COLORS[c.domain] }}>{c.domain}</div>
                  <div style={{ color: T.muted }}>{c.chain}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
