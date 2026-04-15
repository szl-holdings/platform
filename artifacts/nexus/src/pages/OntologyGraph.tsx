/**
 * Ontology Graph — Nexus Knowledge Graph View
 *
 * Palantir-inspired entity-relationship visualization.
 * Shows all interconnected entities across domains with multi-hop traversal.
 */

import { useState, useCallback } from "react";
import { Search, Network, ChevronRight, Info, AlertTriangle, Shield, Anchor, Building2, FileText, Globe, Database, User, Layers, RefreshCw, Zap } from "lucide-react";

const DS = {
  bg: "#0f0f1a",
  surface: "rgba(255,255,255,0.025)",
  border: "rgba(255,255,255,0.06)",
  elevated: "rgba(255,255,255,0.04)",
  text: { primary: "rgba(255,255,255,0.88)", secondary: "rgba(255,255,255,0.5)", tertiary: "rgba(255,255,255,0.28)" },
  accent: { purple: "#a78bfa", blue: "#3b82f6", green: "#22c55e", red: "#ef4444", amber: "#f59e0b", orange: "#f97316", cyan: "#22d3ee" },
};

type EntityType = "person" | "organization" | "vessel" | "property" | "case" | "threat" | "signal" | "asset";

interface GraphEntity {
  id: string;
  name: string;
  type: EntityType;
  domain: string;
  riskScore?: number;
  tags: string[];
  connections: number;
}

interface GraphEdge {
  from: string;
  to: string;
  type: string;
  strength: "weak" | "moderate" | "strong";
}

const ENTITY_ICONS: Record<EntityType, React.FC<{ size?: number; color?: string }>> = {
  person: User,
  organization: Building2,
  vessel: Anchor,
  property: Globe,
  case: FileText,
  threat: AlertTriangle,
  signal: Zap,
  asset: Database,
};

const ENTITY_COLORS: Record<EntityType, string> = {
  person: DS.accent.blue,
  organization: DS.accent.purple,
  vessel: DS.accent.cyan,
  property: DS.accent.green,
  case: DS.accent.orange,
  threat: DS.accent.red,
  signal: DS.accent.amber,
  asset: DS.text.secondary,
};

const DOMAIN_COLORS: Record<string, string> = {
  vessels: DS.accent.cyan,
  "prism-counsel": DS.accent.orange,
  terra: DS.accent.green,
  "szl-holdings": DS.accent.purple,
  firestorm: DS.accent.red,
  "carlota-jo": DS.accent.blue,
};

const DEMO_ENTITIES: GraphEntity[] = [
  { id: "e1", name: "Meridian Capital LLC", type: "organization", domain: "szl-holdings", riskScore: 72, tags: ["BVI", "shell", "maritime-owner"], connections: 4 },
  { id: "e2", name: "MV AURORA (IMO 9234567)", type: "vessel", domain: "vessels", riskScore: 41, tags: ["bulk-carrier", "active", "SCS"], connections: 3 },
  { id: "e3", name: "345 Atlantic Ave, Brooklyn", type: "property", domain: "terra", riskScore: 58, tags: ["commercial", "mixed-use", "distressed"], connections: 2 },
  { id: "e4", name: "SDNY Matter #2024-CV-4821", type: "case", domain: "prism-counsel", riskScore: 85, tags: ["litigation", "active", "$12M"], connections: 3 },
  { id: "e5", name: "APT41 / Volt Typhoon", type: "threat", domain: "firestorm", riskScore: 96, tags: ["nation-state", "maritime", "China"], connections: 2 },
  { id: "e6", name: "James R. Harrington", type: "person", domain: "prism-counsel", riskScore: 61, tags: ["director", "Meridian", "sanctioned-region"], connections: 3 },
  { id: "e7", name: "Pacific Trade BVI Ltd", type: "organization", domain: "szl-holdings", riskScore: 78, tags: ["BVI", "intermediate", "shell"], connections: 2 },
  { id: "e8", name: "OFAC Exposure Signal", type: "signal", domain: "prism-counsel", riskScore: 89, tags: ["compliance", "OFAC", "auto-detected"], connections: 1 },
  { id: "e9", name: "SZL Fleet Insurance Policy #447", type: "asset", domain: "szl-holdings", riskScore: 30, tags: ["insurance", "coverage", "hull"], connections: 2 },
  { id: "e10", name: "Henderson Commercial District", type: "property", domain: "terra", riskScore: 22, tags: ["retail", "NV", "stable"], connections: 1 },
];

const DEMO_EDGES: GraphEdge[] = [
  { from: "e1", to: "e2", type: "owns", strength: "strong" },
  { from: "e1", to: "e3", type: "invests_in", strength: "moderate" },
  { from: "e1", to: "e4", type: "litigates", strength: "strong" },
  { from: "e6", to: "e1", type: "directs", strength: "strong" },
  { from: "e7", to: "e1", type: "connected_to", strength: "weak" },
  { from: "e7", to: "e8", type: "exposes", strength: "moderate" },
  { from: "e5", to: "e2", type: "threatens", strength: "moderate" },
  { from: "e2", to: "e9", type: "affiliated_with", strength: "strong" },
  { from: "e3", to: "e4", type: "affiliated_with", strength: "moderate" },
  { from: "e1", to: "e10", type: "invests_in", strength: "weak" },
];

const RELATIONSHIP_COLORS: Record<string, string> = {
  owns: DS.accent.purple,
  invests_in: DS.accent.blue,
  litigates: DS.accent.red,
  directs: DS.accent.orange,
  connected_to: DS.text.tertiary,
  exposes: DS.accent.red,
  threatens: DS.accent.red,
  affiliated_with: DS.accent.amber,
};

function NodeCard({ entity, selected, onClick, connections }: { entity: GraphEntity; selected: boolean; onClick: () => void; connections: GraphEdge[] }) {
  const Icon = ENTITY_ICONS[entity.type];
  const color = ENTITY_COLORS[entity.type];
  const domainColor = DOMAIN_COLORS[entity.domain] ?? DS.text.tertiary;
  const riskColor = (entity.riskScore ?? 0) > 80 ? DS.accent.red : (entity.riskScore ?? 0) > 60 ? DS.accent.amber : DS.accent.green;

  return (
    <div
      onClick={onClick}
      style={{
        background: selected ? `${color}15` : DS.surface,
        border: `1px solid ${selected ? color + "60" : DS.border}`,
        borderRadius: "10px",
        padding: "12px",
        cursor: "pointer",
        transition: "all 0.15s",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
        <div style={{ width: 28, height: 28, borderRadius: "7px", background: `${color}20`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Icon size={13} color={color} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: "12px", fontWeight: 600, color: DS.text.primary, margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{entity.name}</p>
          <p style={{ fontSize: "10px", color: domainColor, margin: 0, textTransform: "capitalize" }}>{entity.domain} · {entity.type}</p>
        </div>
        {entity.riskScore !== undefined && (
          <div style={{ fontSize: "13px", fontWeight: 700, color: riskColor, flexShrink: 0 }}>{entity.riskScore}</div>
        )}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "3px", marginBottom: "4px" }}>
        {entity.tags.slice(0, 3).map(tag => (
          <span key={tag} style={{ fontSize: "9px", padding: "1px 5px", background: "rgba(255,255,255,0.05)", borderRadius: "10px", color: DS.text.tertiary }}>{tag}</span>
        ))}
      </div>
      <div style={{ display: "flex", gap: "8px" }}>
        <span style={{ fontSize: "10px", color: DS.text.tertiary }}>{entity.connections} connections</span>
        {connections.some(e => e.type === "litigates" || e.type === "threatens" || e.type === "exposes") && (
          <span style={{ fontSize: "10px", color: DS.accent.red }}>⚠ Risk link</span>
        )}
      </div>
    </div>
  );
}

function EdgeList({ edges, allEntities }: { edges: GraphEdge[]; allEntities: GraphEntity[] }) {
  const getEntityName = (id: string) => allEntities.find(e => e.id === id)?.name ?? id;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
      {edges.map((edge, idx) => (
        <div key={idx} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "6px 8px", background: DS.elevated, borderRadius: "6px" }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: RELATIONSHIP_COLORS[edge.type] ?? DS.text.tertiary, flexShrink: 0 }} />
          <span style={{ fontSize: "11px", color: DS.text.secondary, flex: 1 }}>{getEntityName(edge.from)}</span>
          <span style={{ fontSize: "10px", fontWeight: 600, color: RELATIONSHIP_COLORS[edge.type] ?? DS.text.tertiary, flexShrink: 0 }}>{edge.type}</span>
          <span style={{ fontSize: "11px", color: DS.text.secondary }}>{getEntityName(edge.to)}</span>
        </div>
      ))}
    </div>
  );
}

export default function OntologyGraph() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEntity, setSelectedEntity] = useState<GraphEntity | null>(null);
  const [filterDomain, setFilterDomain] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<EntityType | null>(null);
  const [hops, setHops] = useState(2);

  const filteredEntities = DEMO_ENTITIES.filter(e => {
    if (searchQuery && !e.name.toLowerCase().includes(searchQuery.toLowerCase()) && !e.tags.some(t => t.includes(searchQuery.toLowerCase()))) return false;
    if (filterDomain && e.domain !== filterDomain) return false;
    if (filterType && e.type !== filterType) return false;
    return true;
  });

  const selectedConnections = selectedEntity
    ? DEMO_EDGES.filter(e => e.from === selectedEntity.id || e.to === selectedEntity.id)
    : [];

  const connectedEntityIds = new Set(selectedConnections.flatMap(e => [e.from, e.to]));
  const connectedEntities = DEMO_ENTITIES.filter(e => connectedEntityIds.has(e.id) && e.id !== selectedEntity?.id);

  const graphStats = {
    total: DEMO_ENTITIES.length,
    domains: new Set(DEMO_ENTITIES.map(e => e.domain)).size,
    relationships: DEMO_EDGES.length,
    highRisk: DEMO_ENTITIES.filter(e => (e.riskScore ?? 0) > 70).length,
    crossDomain: DEMO_EDGES.filter(e => {
      const from = DEMO_ENTITIES.find(ent => ent.id === e.from);
      const to = DEMO_ENTITIES.find(ent => ent.id === e.to);
      return from && to && from.domain !== to.domain;
    }).length,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: DS.bg, color: DS.text.primary }}>
      <div style={{ padding: "20px 24px 0", borderBottom: `1px solid ${DS.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
          <Network size={20} color={DS.accent.purple} />
          <h1 style={{ fontSize: "18px", fontWeight: 700, margin: 0 }}>Unified Ontology Graph</h1>
          <span style={{ fontSize: "11px", padding: "2px 8px", background: "rgba(167,139,250,0.12)", color: DS.accent.purple, borderRadius: "20px", border: "1px solid rgba(167,139,250,0.25)" }}>KNOWLEDGE GRAPH</span>
        </div>

        <div style={{ display: "flex", gap: "12px", marginBottom: "16px" }}>
          {[
            { label: "Entities", value: graphStats.total, color: DS.accent.purple },
            { label: "Domains", value: graphStats.domains, color: DS.accent.blue },
            { label: "Relationships", value: graphStats.relationships, color: DS.accent.cyan },
            { label: "Cross-Domain Links", value: graphStats.crossDomain, color: DS.accent.amber },
            { label: "High-Risk Nodes", value: graphStats.highRisk, color: DS.accent.red },
          ].map(stat => (
            <div key={stat.label} style={{ padding: "6px 12px", background: DS.surface, border: `1px solid ${DS.border}`, borderRadius: "8px" }}>
              <div style={{ fontSize: "18px", fontWeight: 700, color: stat.color }}>{stat.value}</div>
              <div style={{ fontSize: "10px", color: DS.text.tertiary }}>{stat.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
          <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "6px", background: DS.surface, border: `1px solid ${DS.border}`, borderRadius: "8px", padding: "6px 10px" }}>
            <Search size={13} color={DS.text.tertiary} />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search entities, tags..."
              style={{ flex: 1, background: "none", border: "none", outline: "none", fontSize: "13px", color: DS.text.primary }}
            />
          </div>
          <select
            value={filterDomain ?? ""}
            onChange={e => setFilterDomain(e.target.value || null)}
            style={{ background: DS.surface, border: `1px solid ${DS.border}`, borderRadius: "8px", padding: "6px 10px", color: DS.text.secondary, fontSize: "12px" }}
          >
            <option value="">All Domains</option>
            {Object.keys(DOMAIN_COLORS).map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <select
            value={filterType ?? ""}
            onChange={e => setFilterType((e.target.value || null) as EntityType | null)}
            style={{ background: DS.surface, border: `1px solid ${DS.border}`, borderRadius: "8px", padding: "6px 10px", color: DS.text.secondary, fontSize: "12px" }}
          >
            <option value="">All Types</option>
            {(["person", "organization", "vessel", "property", "case", "threat", "signal", "asset"] as EntityType[]).map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", background: DS.surface, border: `1px solid ${DS.border}`, borderRadius: "8px", padding: "6px 10px" }}>
            <Layers size={12} color={DS.text.tertiary} />
            <span style={{ fontSize: "12px", color: DS.text.secondary }}>Hops:</span>
            <input type="number" min={1} max={4} value={hops} onChange={e => setHops(Number(e.target.value))} style={{ width: "32px", background: "none", border: "none", outline: "none", fontSize: "13px", color: DS.text.primary, fontWeight: 700 }} />
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", flex: 1, overflow: "hidden" }}>
        <div style={{ overflow: "auto", padding: "16px 24px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "10px" }}>
            {filteredEntities.map(entity => (
              <NodeCard
                key={entity.id}
                entity={entity}
                selected={selectedEntity?.id === entity.id}
                onClick={() => setSelectedEntity(prev => prev?.id === entity.id ? null : entity)}
                connections={DEMO_EDGES.filter(e => e.from === entity.id || e.to === entity.id)}
              />
            ))}
          </div>
        </div>

        <div style={{ borderLeft: `1px solid ${DS.border}`, overflow: "auto", padding: "16px" }}>
          {selectedEntity ? (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
                <div style={{ width: 32, height: 32, borderRadius: "8px", background: `${ENTITY_COLORS[selectedEntity.type]}20`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {(() => { const Icon = ENTITY_ICONS[selectedEntity.type]; return <Icon size={15} color={ENTITY_COLORS[selectedEntity.type]} />; })()}
                </div>
                <div>
                  <p style={{ fontSize: "14px", fontWeight: 700, margin: 0 }}>{selectedEntity.name}</p>
                  <p style={{ fontSize: "11px", color: DS.text.secondary, margin: 0 }}>{selectedEntity.domain} · {selectedEntity.type}</p>
                </div>
              </div>

              {selectedEntity.riskScore !== undefined && (
                <div style={{ background: DS.surface, border: `1px solid ${DS.border}`, borderRadius: "8px", padding: "10px 12px", marginBottom: "12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "12px", color: DS.text.secondary }}>Risk Score</span>
                    <span style={{ fontSize: "22px", fontWeight: 700, color: selectedEntity.riskScore > 80 ? DS.accent.red : selectedEntity.riskScore > 60 ? DS.accent.amber : DS.accent.green }}>{selectedEntity.riskScore}</span>
                  </div>
                  <div style={{ marginTop: "6px", height: "4px", background: "rgba(255,255,255,0.06)", borderRadius: "2px" }}>
                    <div style={{ width: `${selectedEntity.riskScore}%`, height: "100%", background: selectedEntity.riskScore > 80 ? DS.accent.red : selectedEntity.riskScore > 60 ? DS.accent.amber : DS.accent.green, borderRadius: "2px" }} />
                  </div>
                </div>
              )}

              <div style={{ marginBottom: "12px" }}>
                <p style={{ fontSize: "11px", fontWeight: 600, color: DS.text.tertiary, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 8px" }}>Tags</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                  {selectedEntity.tags.map(tag => <span key={tag} style={{ fontSize: "10px", padding: "2px 7px", background: "rgba(255,255,255,0.06)", borderRadius: "10px", color: DS.text.secondary }}>{tag}</span>)}
                </div>
              </div>

              {selectedConnections.length > 0 && (
                <div style={{ marginBottom: "12px" }}>
                  <p style={{ fontSize: "11px", fontWeight: 600, color: DS.text.tertiary, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 8px" }}>Relationships ({selectedConnections.length})</p>
                  <EdgeList edges={selectedConnections} allEntities={DEMO_ENTITIES} />
                </div>
              )}

              {connectedEntities.length > 0 && (
                <div>
                  <p style={{ fontSize: "11px", fontWeight: 600, color: DS.text.tertiary, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 8px" }}>Connected Entities</p>
                  {connectedEntities.map(e => {
                    const Icon = ENTITY_ICONS[e.type];
                    const edge = selectedConnections.find(ed => ed.from === e.id || ed.to === e.id);
                    return (
                      <div key={e.id} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "6px 8px", background: DS.elevated, borderRadius: "6px", marginBottom: "4px", cursor: "pointer" }} onClick={() => setSelectedEntity(e)}>
                        <Icon size={12} color={ENTITY_COLORS[e.type]} />
                        <span style={{ fontSize: "12px", color: DS.text.secondary, flex: 1 }}>{e.name}</span>
                        <span style={{ fontSize: "10px", color: RELATIONSHIP_COLORS[edge?.type ?? ""] ?? DS.text.tertiary }}>{edge?.type}</span>
                        <ChevronRight size={11} color={DS.text.tertiary} />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "200px", color: DS.text.tertiary }}>
              <Network size={32} style={{ marginBottom: "12px", opacity: 0.3 }} />
              <p style={{ fontSize: "13px", margin: 0 }}>Select an entity to explore connections</p>
              <p style={{ fontSize: "11px", margin: "4px 0 0", textAlign: "center" }}>Click any node to traverse the knowledge graph and view cross-domain relationships</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
