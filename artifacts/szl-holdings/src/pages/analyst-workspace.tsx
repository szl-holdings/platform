import { useState, useEffect, useMemo, useCallback } from "react";
import { m, AnimatePresence } from "framer-motion";
import { Link, useSearch } from "wouter";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import {
  Search, ChevronRight, Ship, Scale, Shield, Building2,
  User, AlertTriangle, Network, Activity, Layers, ArrowRight,
  GitBranch,
} from "lucide-react";
import { ProofDrawer, SAMPLE_PROOF_RECORD, type ProofRecord, type ReviewState, type ExportSafety } from "@/components/ProofDrawer";

type EntityType = "person" | "organization" | "vessel" | "property" | "matter" | "threat" | "asset";
type RiskLevel = "critical" | "high" | "medium" | "low" | "none";
type Domain = "vessels" | "legal" | "property" | "threat" | "financial" | "operations" | "security";
type RelType = "owns" | "operates" | "controls" | "litigates" | "threatens" | "invests" | "subsidiary" | "associated_with" | "finances" | "flagged_by" | "sanctions_link" | "co_invests";

interface Entity {
  id: string;
  label: string;
  type: EntityType;
  subtitle: string;
  risk: RiskLevel;
  riskScore: number;
  domains: Domain[];
  identifiers: Record<string, string>;
  domainData?: Record<string, string>;
  relatedAlertIds: string[];
}

interface Edge {
  from: string;
  to: string;
  type: RelType;
  strength: "strong" | "moderate" | "weak";
  label: string;
}

const ENTITIES: Entity[] = [
  {
    id: "meridian-capital", label: "Meridian Capital LLC", type: "organization", subtitle: "BVI holding company", risk: "critical", riskScore: 91,
    domains: ["vessels", "legal", "property", "financial"], identifiers: { lei: "5493001KJTIIGC8Y1R12", bvi: "BVI-234567" },
    domainData: { litigation: "SDNY Civil, $12M exposure", property: "345 Atlantic Ave Brooklyn — 18% decline", vessel: "AURORA (IMO 9234567)" },
    relatedAlertIds: ["demo-f1", "demo-f3"],
  },
  {
    id: "aurora-vessel", label: "AURORA (IMO 9234567)", type: "vessel", subtitle: "Bulk carrier, Marshall Islands flag", risk: "high", riskScore: 78,
    domains: ["vessels", "legal"], identifiers: { imo: "9234567", mmsi: "538007234" },
    domainData: { route: "Strait of Malacca → Rotterdam", cargo: "Bulk grain", fuelLevel: "38%" },
    relatedAlertIds: ["demo-f1", "demo-f2"],
  },
  {
    id: "brooklyn-property", label: "345 Atlantic Ave, Brooklyn", type: "property", subtitle: "Mixed-use commercial property", risk: "high", riskScore: 74,
    domains: ["property", "legal", "financial"], identifiers: { parcel: "BK-3014789", loan: "LOC-2019-77X" },
    domainData: { valuation: "$8.4M (-18% YTD)", occupancy: "71%", dscr: "1.08x" },
    relatedAlertIds: ["demo-f1"],
  },
  {
    id: "apt41-threat", label: "APT41 / Volt Typhoon", type: "threat", subtitle: "Chinese state-sponsored threat actor", risk: "critical", riskScore: 96,
    domains: ["threat", "security", "vessels"], identifiers: { mitre: "G0096", cisa: "AA23-108A" },
    domainData: { ttps: "T1590, T1199, T1078", campaigns: "Maritime infrastructure targeting", ioc_count: "847 active IOCs" },
    relatedAlertIds: ["demo-f2"],
  },
  {
    id: "pacific-ventures", label: "Pacific Ventures Holdings BVI", type: "organization", subtitle: "Shell company — BVI registry", risk: "critical", riskScore: 89,
    domains: ["financial", "legal"], identifiers: { bvi: "BVI-890123", ofac: "Under review" },
    domainData: { hops: "4-hop chain to SDN entity", sanctions: "OFAC SDN potential", kyc: "KYC refresh required" },
    relatedAlertIds: ["demo-f3"],
  },
  {
    id: "starlight-maritime", label: "Starlight Maritime Ltd", type: "organization", subtitle: "Marshall Islands registered", risk: "high", riskScore: 71,
    domains: ["vessels", "financial"], identifiers: { imo_registered: "ML-44567", lei: "5493009MG4DE8IH8R125" },
    domainData: {},
    relatedAlertIds: ["demo-f3"],
  },
  {
    id: "atlas-wind", label: "ATLAS WIND (IMO 8901234)", type: "vessel", subtitle: "Container vessel — Panama flag", risk: "high", riskScore: 68,
    domains: ["vessels", "threat"], identifiers: { imo: "8901234", mmsi: "352001890" },
    domainData: { route: "Strait of Malacca (active)", eta: "Rotterdam +8 days", status: "At risk — APT41 corridor" },
    relatedAlertIds: ["demo-f2"],
  },
  {
    id: "meridian-star", label: "MERIDIAN STAR (IMO 7812345)", type: "vessel", subtitle: "Tanker — Liberia flag", risk: "medium", riskScore: 55,
    domains: ["vessels"], identifiers: { imo: "7812345", mmsi: "636019812" },
    domainData: { route: "South China Sea (transit)", cargo: "Crude petroleum" },
    relatedAlertIds: ["demo-f2"],
  },
  {
    id: "sdn-entity", label: "SDN Entity (Redacted)", type: "organization", subtitle: "OFAC Specially Designated National", risk: "critical", riskScore: 100,
    domains: ["legal", "financial"], identifiers: { ofac: "OFAC-SDN-RU2041", program: "Ukraine EO13661" },
    domainData: {},
    relatedAlertIds: ["demo-f3"],
  },
  {
    id: "szl-portfolio", label: "SZL Holdings Portfolio", type: "asset", subtitle: "Multi-vertical investment portfolio", risk: "medium", riskScore: 52,
    domains: ["financial", "vessels", "property"], identifiers: { aum: "$180M", entities: "47 active" },
    domainData: {},
    relatedAlertIds: [],
  },
  {
    id: "prism-matter-001", label: "SDNY Civil Action #24-cv-8891", type: "matter", subtitle: "Active litigation — $12M exposure", risk: "high", riskScore: 77,
    domains: ["legal"], identifiers: { docket: "1:24-cv-08891", court: "S.D.N.Y." },
    domainData: { plaintiff: "State of New York", defendant: "Meridian Capital LLC", status: "Discovery phase" },
    relatedAlertIds: ["demo-f1"],
  },
  {
    id: "chen-capital", label: "Chen Capital Partners", type: "organization", subtitle: "PE fund — co-investor", risk: "low", riskScore: 22,
    domains: ["financial"], identifiers: { lei: "5493006VWDW6MCDX2349" },
    domainData: {},
    relatedAlertIds: [],
  },
];

const EDGES: Edge[] = [
  { from: "meridian-capital", to: "aurora-vessel", type: "owns", strength: "strong", label: "Beneficial owner (BVI)" },
  { from: "meridian-capital", to: "brooklyn-property", type: "owns", strength: "strong", label: "Tenant-in-common 60%" },
  { from: "meridian-capital", to: "prism-matter-001", type: "litigates", strength: "strong", label: "Defendant — SDNY" },
  { from: "meridian-capital", to: "szl-portfolio", type: "finances", strength: "moderate", label: "Portfolio exposure" },
  { from: "pacific-ventures", to: "meridian-capital", type: "owns", strength: "moderate", label: "2-hop ownership chain" },
  { from: "pacific-ventures", to: "starlight-maritime", type: "controls", strength: "strong", label: "Controlling entity" },
  { from: "starlight-maritime", to: "sdn-entity", type: "associated_with", strength: "moderate", label: "3-hop to SDN" },
  { from: "pacific-ventures", to: "szl-portfolio", type: "co_invests", strength: "weak", label: "Co-investment (indirect)" },
  { from: "apt41-threat", to: "atlas-wind", type: "threatens", strength: "strong", label: "IOC correlation" },
  { from: "apt41-threat", to: "meridian-star", type: "threatens", strength: "moderate", label: "Route overlap" },
  { from: "apt41-threat", to: "aurora-vessel", type: "threatens", strength: "moderate", label: "Corridor proximity" },
  { from: "szl-portfolio", to: "brooklyn-property", type: "invests", strength: "strong", label: "Direct investment" },
  { from: "szl-portfolio", to: "atlas-wind", type: "operates", strength: "strong", label: "Fleet asset" },
  { from: "szl-portfolio", to: "meridian-star", type: "operates", strength: "strong", label: "Fleet asset" },
  { from: "chen-capital", to: "szl-portfolio", type: "co_invests", strength: "moderate", label: "LP co-investor" },
  { from: "sdn-entity", to: "pacific-ventures", type: "controls", strength: "strong", label: "Beneficial ownership" },
];

const ALERT_LABELS: Record<string, { title: string; href: string }> = {
  "demo-f1": { title: "AURORA Owner Filed PRISM Litigation — Terra Brooklyn Property −18%", href: "/intelligence/fabric" },
  "demo-f2": { title: "APT41 Maritime Targeting — Fleet Route Overlaps Active IOC", href: "/intelligence/fabric" },
  "demo-f3": { title: "Shell Company Structure — Multi-Hop Ownership to OFAC SDN", href: "/intelligence/fabric" },
};

const DOMAIN_COLORS: Record<string, string> = {
  vessels: "#38bdf8", legal: "#d4a054", property: "#4ade80",
  threat: "#ef4444", financial: "#3b82f6", operations: "#22d3ee", security: "#818cf8",
};

const TYPE_COLORS: Record<EntityType, string> = {
  person: "#60a5fa", organization: "#a78bfa", vessel: "#38bdf8",
  property: "#4ade80", matter: "#d4a054", threat: "#ef4444", asset: "#f59e0b",
};

const TYPE_ICONS: Record<EntityType, React.ElementType> = {
  person: User, organization: Building2, vessel: Ship,
  property: Building2, matter: Scale, threat: AlertTriangle, asset: Layers,
};

const RISK_COLORS: Record<RiskLevel, string> = {
  critical: "#ef4444", high: "#f97316", medium: "#eab308", low: "#10b981", none: "#374151",
};

const REL_LABELS: Record<RelType, string> = {
  owns: "Owns", operates: "Operates", controls: "Controls", litigates: "Litigates",
  threatens: "Threatens", invests: "Invests in", subsidiary: "Subsidiary of",
  associated_with: "Associated with", finances: "Finances", flagged_by: "Flagged by",
  sanctions_link: "Sanctions link", co_invests: "Co-invests",
};

const REL_COLORS: Record<RelType, string> = {
  owns: "#3b82f6", operates: "#22d3ee", controls: "#a78bfa", litigates: "#d4a054",
  threatens: "#ef4444", invests: "#10b981", subsidiary: "#6b7280",
  associated_with: "#6b7280", finances: "#3b82f6", flagged_by: "#ef4444",
  sanctions_link: "#ef4444", co_invests: "#10b981",
};

function getEntityEdges(entityId: string): { outgoing: Edge[]; incoming: Edge[] } {
  return {
    outgoing: EDGES.filter(e => e.from === entityId),
    incoming: EDGES.filter(e => e.to === entityId),
  };
}

function getNeighbors(entityId: string): Entity[] {
  const neighborIds = new Set<string>();
  EDGES.filter(e => e.from === entityId || e.to === entityId).forEach(e => {
    if (e.from !== entityId) neighborIds.add(e.from);
    if (e.to !== entityId) neighborIds.add(e.to);
  });
  return ENTITIES.filter(e => neighborIds.has(e.id));
}

function buildEntityProof(entity: Entity, kind: "cross_domain" | "fusion_alert", subjectId: string): ProofRecord {
  const review: ReviewState =
    entity.risk === "critical" ? "unreviewed" :
    entity.risk === "high"     ? "peer_reviewed" : "human_reviewed";
  const exportSafety: ExportSafety =
    entity.risk === "critical" ? "restricted" :
    entity.risk === "high"     ? "pending_review" : "safe";
  const conf = Math.max(0.5, Math.min(0.99, entity.riskScore / 100));
  return {
    ...SAMPLE_PROOF_RECORD,
    id: `PCH-${kind === "cross_domain" ? "XDP" : "FAL"}-${entity.id.toUpperCase()}-${subjectId.toUpperCase()}`,
    sourceSystem: kind === "cross_domain" ? "Analyst Entity Graph" : "Signal Fusion Engine",
    sourceDomain: entity.domains[0] ?? "operations",
    signalType: kind === "cross_domain" ? "cross_domain_recommendation" : "fusion_alert_recommendation",
    confidence: conf,
    model: "Entity correlation engine v3.2",
    modelVersion: "2026-04-15",
    reviewState: review,
    exportSafety,
    policyChecks: [
      { label: "Role: analyst — permitted", passed: true },
      { label: `Domain scope: ${entity.domains.join(", ")} — in scope`, passed: true },
      { label: `Risk threshold (${entity.risk}) within review SLA`, passed: entity.risk !== "critical", note: entity.risk === "critical" ? "Critical risk requires SOC Lead sign-off" : undefined },
      { label: "Human-in-loop gate: required before pivot", passed: true },
      { label: "Source provenance: graph traversal documented", passed: true },
      { label: "Export safety: redact identifiers before sharing", passed: exportSafety === "safe", note: exportSafety === "safe" ? undefined : "PII redaction pending review" },
    ],
    chainLinks: [
      { id: "c1", event: `Entity ${entity.label} ingested into graph`, actor: "System / Entity Resolver", timestamp: "16 Apr 2026 06:02:11", hash: `sha256:${entity.id.slice(0, 8)}1...` },
      { id: "c2", event: `Risk score computed: ${entity.riskScore}/100 (${entity.risk})`, actor: "Risk engine", timestamp: "16 Apr 2026 07:45:32", hash: `sha256:${entity.id.slice(0, 8)}2...` },
      { id: "c3", event: kind === "cross_domain" ? `Cross-domain path surfaced — ${subjectId}` : `Fusion alert linked — ${subjectId}`, actor: "Recommendation engine", timestamp: "16 Apr 2026 08:12:48", hash: `sha256:${entity.id.slice(0, 8)}3...` },
      { id: "c4", event: "Recorded in analyst proof chain", actor: "System / Proof Chain", timestamp: "16 Apr 2026 08:12:49", hash: `sha256:${entity.id.slice(0, 8)}4...` },
    ],
    metadata: {
      "Entity ID": entity.id,
      "Entity label": entity.label,
      "Entity type": entity.type,
      "Risk level": entity.risk,
      "Risk score": String(entity.riskScore),
      "Domains": entity.domains.join(", "),
      "Recommendation kind": kind === "cross_domain" ? "Cross-domain path" : "Fusion alert",
      "Subject": subjectId,
    },
  };
}

function getCrossdomainPaths(entityId: string): Array<{ path: string[]; domains: string[]; risk: string }> {
  const entity = ENTITIES.find(e => e.id === entityId);
  if (!entity) return [];

  const paths: Array<{ path: string[]; domains: string[]; risk: string }> = [];
  const neighbors = getNeighbors(entityId);

  for (const neighbor of neighbors) {
    const newDomains = neighbor.domains.filter(d => !entity.domains.includes(d));
    if (newDomains.length > 0) {
      const risk = (neighbor.risk === "critical" || neighbor.risk === "high") ? "elevated" : "moderate";
      paths.push({
        path: [entity.label, neighbor.label],
        domains: [...entity.domains, ...newDomains],
        risk,
      });
    }
  }
  return paths;
}

function EntityCard({ entity, selected, onClick }: { entity: Entity; selected: boolean; onClick: () => void }) {
  const Icon = TYPE_ICONS[entity.type];
  const color = TYPE_COLORS[entity.type];
  const riskColor = RISK_COLORS[entity.risk];

  return (
    <m.div
      whileHover={{ scale: 1.01 }}
      onClick={onClick}
      style={{
        padding: "10px 12px", borderRadius: 10, cursor: "pointer",
        background: selected ? `${color}10` : "rgba(255,255,255,0.02)",
        border: `1px solid ${selected ? color + "35" : "rgba(255,255,255,0.07)"}`,
        transition: "border-color 0.2s",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ padding: 5, background: `${color}15`, borderRadius: 6, flexShrink: 0 }}>
          <Icon size={13} color={color} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#e2e8f0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{entity.label}</div>
          <div style={{ fontSize: 11, color: "hsl(210,5%,48%)" }}>{entity.subtitle}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3 }}>
          <span style={{ fontSize: 11, color: riskColor, fontWeight: 700, textTransform: "uppercase" }}>{entity.risk}</span>
          <span style={{ fontSize: 10, color: "hsl(210,5%,42%)" }}>{entity.riskScore}</span>
        </div>
      </div>
      <div style={{ display: "flex", gap: 4, marginTop: 6, flexWrap: "wrap" }}>
        {entity.domains.slice(0, 4).map(d => (
          <span key={d} style={{
            padding: "1px 5px", borderRadius: 3, fontSize: 10, fontWeight: 600,
            background: `${DOMAIN_COLORS[d] ?? "#6b7280"}15`,
            color: DOMAIN_COLORS[d] ?? "#6b7280",
          }}>{d}</span>
        ))}
      </div>
    </m.div>
  );
}

function RelationshipGraph({ entity, onSelect }: { entity: Entity; onSelect: (id: string) => void }) {
  const edges = EDGES.filter(e => e.from === entity.id || e.to === entity.id);
  const neighborIds = new Set(edges.flatMap(e => [e.from, e.to]).filter(id => id !== entity.id));
  const neighbors = ENTITIES.filter(e => neighborIds.has(e.id));

  const W = 560;
  const H = 380;
  const cx = W / 2;
  const cy = H / 2;
  const radius = 140;

  const points = neighbors.map((n, i) => {
    const angle = (i / Math.max(neighbors.length, 1)) * 2 * Math.PI - Math.PI / 2;
    return { entity: n, x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) };
  });

  const rootColor = TYPE_COLORS[entity.type];
  const rootRiskColor = RISK_COLORS[entity.risk];

  return (
    <svg width={W} height={H} style={{ display: "block" }}>
      <defs>
        <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
          <polygon points="0 0, 8 3, 0 6" fill="rgba(255,255,255,0.25)" />
        </marker>
      </defs>

      {points.map(({ entity: n, x, y }) => {
        const edge = edges.find(e => (e.from === entity.id && e.to === n.id) || (e.from === n.id && e.to === entity.id));
        const color = edge ? (REL_COLORS[edge.type] ?? "rgba(255,255,255,0.2)") : "rgba(255,255,255,0.1)";
        const dash = edge?.strength === "weak" ? "4,4" : edge?.strength === "moderate" ? "2,2" : "";
        return (
          <g key={n.id}>
            <line x1={cx} y1={cy} x2={x} y2={y}
              stroke={color} strokeWidth={edge?.strength === "strong" ? 2 : 1}
              strokeDasharray={dash} strokeOpacity={0.6}
              markerEnd="url(#arrowhead)" />
            {edge && (
              <text x={(cx + x) / 2} y={(cy + y) / 2 - 4} textAnchor="middle"
                fill={color} fontSize="9" opacity={0.8}>
                {REL_LABELS[edge.type]}
              </text>
            )}
          </g>
        );
      })}

      <circle cx={cx} cy={cy} r={26} fill={`${rootColor}20`} stroke={rootColor} strokeWidth={2} />
      <circle cx={cx} cy={cy - 13} r={5} fill={rootRiskColor} opacity={0.9} />
      <text x={cx} y={cy + 5} textAnchor="middle" fill={rootColor} fontSize="10" fontWeight="bold">
        {entity.label.slice(0, 14)}
      </text>

      {points.map(({ entity: n, x, y }) => {
        const nColor = TYPE_COLORS[n.type];
        const nRiskColor = RISK_COLORS[n.risk];
        return (
          <g key={n.id} style={{ cursor: "pointer" }} onClick={() => onSelect(n.id)}>
            <circle cx={x} cy={y} r={20} fill={`${nColor}15`} stroke={nColor} strokeWidth={1.5} />
            <circle cx={x} cy={y - 9} r={4} fill={nRiskColor} opacity={0.85} />
            <text x={x} y={y + 4} textAnchor="middle" fill={nColor} fontSize="8.5" fontWeight="600">
              {n.label.slice(0, 10)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export default function AnalystWorkspacePage() {
  const searchStr = useSearch();
  const params = new URLSearchParams(searchStr);
  const deepLinkEntity = params.get("entity") ?? "";

  const resolveDeepLink = useCallback((id: string): string | null => {
    const byId = ENTITIES.find(e => e.id === id);
    if (byId) return byId.id;
    const byLabel = ENTITIES.find(e => e.label.toLowerCase() === id.toLowerCase());
    if (byLabel) return byLabel.id;
    const partial = ENTITIES.find(e => e.label.toLowerCase().includes(id.toLowerCase()));
    return partial?.id ?? null;
  }, []);

  const [selectedEntityId, setSelectedEntityId] = useState<string>(() => {
    if (deepLinkEntity) {
      const resolved = ENTITIES.find(e => e.id === deepLinkEntity || e.label.toLowerCase().includes(deepLinkEntity.toLowerCase()));
      return resolved?.id ?? "meridian-capital";
    }
    return "meridian-capital";
  });

  useEffect(() => {
    if (!deepLinkEntity) return;
    const resolved = resolveDeepLink(deepLinkEntity);
    if (resolved) setSelectedEntityId(resolved);
  }, [deepLinkEntity, resolveDeepLink]);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterRisk, setFilterRisk] = useState<string>("all");
  const [activeDetailTab, setActiveDetailTab] = useState<"connections" | "graph" | "cross-domain">("connections");
  const [investigationTrail, setInvestigationTrail] = useState<string[]>([selectedEntityId]);

  const filteredEntities = useMemo(() => {
    return ENTITIES.filter(e => {
      const matchSearch = !searchQuery || e.label.toLowerCase().includes(searchQuery.toLowerCase()) || e.subtitle.toLowerCase().includes(searchQuery.toLowerCase());
      const matchRisk = filterRisk === "all" || e.risk === filterRisk;
      return matchSearch && matchRisk;
    });
  }, [searchQuery, filterRisk]);

  const selectedEntity = useMemo(() => ENTITIES.find(e => e.id === selectedEntityId) ?? null, [selectedEntityId]);
  const { outgoing, incoming } = useMemo(() => selectedEntity ? getEntityEdges(selectedEntity.id) : { outgoing: [], incoming: [] }, [selectedEntity]);
  const crossDomainPaths = useMemo(() => selectedEntity ? getCrossdomainPaths(selectedEntity.id) : [], [selectedEntity]);

  const handleSelect = useCallback((id: string) => {
    setSelectedEntityId(id);
    setInvestigationTrail(prev => {
      const without = prev.filter(i => i !== id);
      return [...without.slice(-4), id];
    });
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: "hsl(222,14%,7%)", color: "#e2e8f0" }}>
      <SiteNav />

      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "32px 24px" }}>
        <m.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <div style={{ padding: "5px 7px", background: "rgba(167,139,250,0.1)", borderRadius: 7, border: "1px solid rgba(167,139,250,0.2)" }}>
                  <Network size={16} color="#a78bfa" />
                </div>
                <span style={{ fontSize: 11, color: "#a78bfa", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>Analyst Workspace</span>
              </div>
              <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.03em", margin: 0, lineHeight: 1.2 }}>Entity Graph Explorer</h1>
              <p style={{ fontSize: 13.5, color: "hsl(210,5%,55%)", margin: "5px 0 0" }}>
                Pull investigative threads across domains — click any entity to explore its cross-domain connections, evidence chains, and risk signals.
              </p>
            </div>
            <Link href="/intelligence/fabric">
              <a style={{
                display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8,
                background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.25)",
                color: "#60a5fa", fontSize: 12, fontWeight: 600, textDecoration: "none",
              }}>
                <Activity size={13} /> Fusion Feed
              </a>
            </Link>
          </div>

          {investigationTrail.length > 1 && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 20, padding: "8px 12px", background: "rgba(167,139,250,0.06)", borderRadius: 8, border: "1px solid rgba(167,139,250,0.15)", flexWrap: "wrap" }}>
              <GitBranch size={12} color="#a78bfa" />
              <span style={{ fontSize: 11, color: "hsl(210,5%,50%)", fontWeight: 600 }}>Trail:</span>
              {investigationTrail.map((id, i) => {
                const entity = ENTITIES.find(e => e.id === id);
                if (!entity) return null;
                return (
                  <span key={id} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    {i > 0 && <ChevronRight size={11} color="hsl(210,5%,40%)" />}
                    <button onClick={() => handleSelect(id)} style={{
                      padding: "2px 7px", borderRadius: 4, fontSize: 11, fontWeight: 600, cursor: "pointer",
                      background: id === selectedEntityId ? "rgba(167,139,250,0.15)" : "rgba(255,255,255,0.04)",
                      border: `1px solid ${id === selectedEntityId ? "rgba(167,139,250,0.3)" : "rgba(255,255,255,0.08)"}`,
                      color: id === selectedEntityId ? "#a78bfa" : "hsl(210,5%,60%)",
                    }}>
                      {entity.label.slice(0, 20)}
                    </button>
                  </span>
                );
              })}
              <button onClick={() => setInvestigationTrail([selectedEntityId])} style={{
                marginLeft: 6, padding: "2px 7px", borderRadius: 4, fontSize: 10, cursor: "pointer",
                background: "transparent", border: "1px solid rgba(255,255,255,0.08)", color: "hsl(210,5%,40%)",
              }}>
                Clear trail
              </button>
            </div>
          )}
        </m.div>

        <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 20, alignItems: "start" }}>
          <div>
            <div style={{ marginBottom: 12, position: "relative" }}>
              <Search size={13} color="hsl(210,5%,45%)" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }} />
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search entities..."
                style={{
                  width: "100%", padding: "8px 10px 8px 30px", borderRadius: 8,
                  background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)",
                  color: "#e2e8f0", fontSize: 13, outline: "none",
                }}
              />
            </div>

            <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
              {["all", "critical", "high", "medium", "low"].map(r => (
                <button key={r} onClick={() => setFilterRisk(r)} style={{
                  padding: "3px 8px", borderRadius: 5, fontSize: 10, fontWeight: 600, cursor: "pointer",
                  background: filterRisk === r ? (r === "all" ? "rgba(59,130,246,0.15)" : `${RISK_COLORS[r as RiskLevel] ?? "#6b7280"}20`) : "rgba(255,255,255,0.04)",
                  border: `1px solid ${filterRisk === r ? (r === "all" ? "rgba(59,130,246,0.3)" : `${RISK_COLORS[r as RiskLevel] ?? "#6b7280"}40`) : "rgba(255,255,255,0.08)"}`,
                  color: filterRisk === r ? (r === "all" ? "#60a5fa" : (RISK_COLORS[r as RiskLevel] ?? "#6b7280")) : "hsl(210,5%,50%)",
                  textTransform: "capitalize",
                }}>
                  {r}
                </button>
              ))}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 7, maxHeight: "calc(100vh - 300px)", overflowY: "auto" }}>
              {filteredEntities.length === 0
                ? <p style={{ fontSize: 13, color: "hsl(210,5%,45%)", textAlign: "center", padding: "20px 0" }}>No entities match</p>
                : filteredEntities.map(entity => (
                    <EntityCard key={entity.id} entity={entity} selected={selectedEntityId === entity.id} onClick={() => handleSelect(entity.id)} />
                  ))
              }
            </div>
          </div>

          <div>
            {selectedEntity ? (
              <m.div key={selectedEntity.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                <div style={{ padding: "16px 18px", borderRadius: 12, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", marginBottom: 16 }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 12 }}>
                    <div style={{ padding: 8, background: `${TYPE_COLORS[selectedEntity.type]}15`, borderRadius: 9, flexShrink: 0 }}>
                      {(() => {
                        const Icon = TYPE_ICONS[selectedEntity.type];
                        return <Icon size={20} color={TYPE_COLORS[selectedEntity.type]} />;
                      })()}
                    </div>
                    <div style={{ flex: 1 }}>
                      <h2 style={{ fontSize: 18, fontWeight: 800, margin: "0 0 3px", letterSpacing: "-0.02em" }}>{selectedEntity.label}</h2>
                      <p style={{ fontSize: 13, color: "hsl(210,5%,55%)", margin: 0 }}>{selectedEntity.subtitle}</p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{
                        padding: "4px 10px", borderRadius: 6,
                        background: `${RISK_COLORS[selectedEntity.risk]}15`,
                        border: `1px solid ${RISK_COLORS[selectedEntity.risk]}30`,
                        color: RISK_COLORS[selectedEntity.risk], fontSize: 11, fontWeight: 700, textTransform: "uppercase",
                        letterSpacing: "0.06em", marginBottom: 4,
                      }}>
                        {selectedEntity.risk} RISK
                      </div>
                      <div style={{ fontSize: 20, fontWeight: 800, color: RISK_COLORS[selectedEntity.risk] }}>{selectedEntity.riskScore}</div>
                      <div style={{ fontSize: 10, color: "hsl(210,5%,42%)" }}>risk score</div>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
                    {selectedEntity.domains.map(d => (
                      <span key={d} style={{
                        padding: "3px 8px", borderRadius: 5, fontSize: 11, fontWeight: 600,
                        background: `${DOMAIN_COLORS[d] ?? "#6b7280"}14`,
                        border: `1px solid ${DOMAIN_COLORS[d] ?? "#6b7280"}28`,
                        color: DOMAIN_COLORS[d] ?? "#6b7280",
                      }}>{d}</span>
                    ))}
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 8 }}>
                    {Object.entries(selectedEntity.identifiers).map(([k, v]) => (
                      <div key={k} style={{ padding: "6px 10px", background: "rgba(255,255,255,0.02)", borderRadius: 6, border: "1px solid rgba(255,255,255,0.06)" }}>
                        <div style={{ fontSize: 10, color: "hsl(210,5%,40%)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>{k}</div>
                        <div style={{ fontSize: 12, color: "#e2e8f0", fontWeight: 600, fontFamily: "monospace" }}>{v}</div>
                      </div>
                    ))}
                  </div>

                  {selectedEntity.domainData && Object.keys(selectedEntity.domainData).length > 0 && (
                    <div style={{ marginTop: 10, padding: "10px 12px", background: "rgba(255,255,255,0.015)", borderRadius: 8, border: "1px solid rgba(255,255,255,0.06)" }}>
                      <p style={{ fontSize: 10, color: "hsl(210,5%,45%)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700, marginBottom: 7 }}>Domain Intelligence</p>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 6 }}>
                        {Object.entries(selectedEntity.domainData).map(([k, v]) => (
                          <div key={k}>
                            <span style={{ fontSize: 10, color: "hsl(210,5%,48%)", fontWeight: 600 }}>{k}: </span>
                            <span style={{ fontSize: 12, color: "hsl(210,5%,72%)" }}>{v}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", gap: 4, marginBottom: 16, background: "rgba(255,255,255,0.03)", borderRadius: 9, padding: 3, width: "fit-content" }}>
                  {(["connections", "graph", "cross-domain"] as const).map(tab => (
                    <button key={tab} onClick={() => setActiveDetailTab(tab)} style={{
                      padding: "6px 13px", borderRadius: 6, fontSize: 12, fontWeight: activeDetailTab === tab ? 700 : 500, cursor: "pointer",
                      background: activeDetailTab === tab ? "rgba(167,139,250,0.15)" : "transparent",
                      border: `1px solid ${activeDetailTab === tab ? "rgba(167,139,250,0.3)" : "transparent"}`,
                      color: activeDetailTab === tab ? "#a78bfa" : "hsl(210,5%,50%)", textTransform: "capitalize",
                    }}>
                      {tab === "cross-domain" ? "Cross-Domain Paths" : tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                  ))}
                </div>

                <AnimatePresence mode="wait">
                  {activeDetailTab === "connections" && (
                    <m.div key="connections" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                        <div>
                          <p style={{ fontSize: 11, fontWeight: 700, color: "hsl(210,5%,48%)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
                            Outgoing ({outgoing.length})
                          </p>
                          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            {outgoing.map((edge, i) => {
                              const target = ENTITIES.find(e => e.id === edge.to);
                              if (!target) return null;
                              return (
                                <div key={i} onClick={() => handleSelect(target.id)} style={{
                                  padding: "10px 12px", borderRadius: 9, background: "rgba(255,255,255,0.02)",
                                  border: `1px solid ${REL_COLORS[edge.type] ?? "#6b7280"}22`, cursor: "pointer",
                                }}>
                                  <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 4 }}>
                                    <span style={{ fontSize: 10, color: REL_COLORS[edge.type], fontWeight: 700, padding: "1px 5px", background: `${REL_COLORS[edge.type]}15`, borderRadius: 3 }}>
                                      {REL_LABELS[edge.type]}
                                    </span>
                                    <span style={{ fontSize: 10, color: "hsl(210,5%,42%)" }}>{edge.strength}</span>
                                  </div>
                                  <div style={{ fontSize: 13, fontWeight: 700, color: TYPE_COLORS[target.type] }}>{target.label}</div>
                                  <div style={{ fontSize: 11, color: "hsl(210,5%,50%)", marginTop: 2 }}>{edge.label}</div>
                                </div>
                              );
                            })}
                            {outgoing.length === 0 && <p style={{ fontSize: 12, color: "hsl(210,5%,42%)" }}>No outgoing connections</p>}
                          </div>
                        </div>
                        <div>
                          <p style={{ fontSize: 11, fontWeight: 700, color: "hsl(210,5%,48%)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
                            Incoming ({incoming.length})
                          </p>
                          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            {incoming.map((edge, i) => {
                              const source = ENTITIES.find(e => e.id === edge.from);
                              if (!source) return null;
                              return (
                                <div key={i} onClick={() => handleSelect(source.id)} style={{
                                  padding: "10px 12px", borderRadius: 9, background: "rgba(255,255,255,0.02)",
                                  border: `1px solid ${REL_COLORS[edge.type] ?? "#6b7280"}22`, cursor: "pointer",
                                }}>
                                  <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 4 }}>
                                    <span style={{ fontSize: 10, color: REL_COLORS[edge.type], fontWeight: 700, padding: "1px 5px", background: `${REL_COLORS[edge.type]}15`, borderRadius: 3 }}>
                                      {REL_LABELS[edge.type]}
                                    </span>
                                    <span style={{ fontSize: 10, color: "hsl(210,5%,42%)" }}>{edge.strength}</span>
                                  </div>
                                  <div style={{ fontSize: 13, fontWeight: 700, color: TYPE_COLORS[source.type] }}>{source.label}</div>
                                  <div style={{ fontSize: 11, color: "hsl(210,5%,50%)", marginTop: 2 }}>{edge.label}</div>
                                </div>
                              );
                            })}
                            {incoming.length === 0 && <p style={{ fontSize: 12, color: "hsl(210,5%,42%)" }}>No incoming connections</p>}
                          </div>
                        </div>
                      </div>
                    </m.div>
                  )}

                  {activeDetailTab === "graph" && (
                    <m.div key="graph" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                      <div style={{ borderRadius: 12, background: "rgba(255,255,255,0.015)", border: "1px solid rgba(255,255,255,0.07)", overflow: "hidden" }}>
                        <div style={{ padding: "10px 14px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: 6 }}>
                          <Network size={13} color="#a78bfa" />
                          <span style={{ fontSize: 12, fontWeight: 600, color: "hsl(210,5%,60%)" }}>
                            {selectedEntity.label} — relationship graph (click nodes to investigate)
                          </span>
                        </div>
                        <div style={{ padding: 8, overflowX: "auto" }}>
                          <RelationshipGraph entity={selectedEntity} onSelect={handleSelect} />
                        </div>
                        <div style={{ padding: "8px 14px", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", gap: 12, flexWrap: "wrap" }}>
                          {(["owns", "threatens", "litigates", "invests", "controls", "associated_with"] as RelType[]).map(type => (
                            <div key={type} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                              <div style={{ width: 20, height: 2, background: REL_COLORS[type] }} />
                              <span style={{ fontSize: 10, color: "hsl(210,5%,50%)" }}>{REL_LABELS[type]}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </m.div>
                  )}

                  {activeDetailTab === "cross-domain" && (
                    <m.div key="cross-domain" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {crossDomainPaths.length === 0 ? (
                          <p style={{ fontSize: 13, color: "hsl(210,5%,45%)", padding: "20px 0" }}>
                            No cross-domain paths detected for this entity.
                          </p>
                        ) : crossDomainPaths.map((path, i) => (
                          <m.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                            style={{ padding: "12px 14px", borderRadius: 10, background: "rgba(255,255,255,0.02)", border: `1px solid ${path.risk === "elevated" ? "rgba(249,115,22,0.2)" : "rgba(255,255,255,0.07)"}` }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8, flexWrap: "wrap" }}>
                              {path.path.map((label, j) => (
                                <span key={j} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                  {j > 0 && <ArrowRight size={12} color="#6b7280" />}
                                  <span style={{ fontSize: 12.5, fontWeight: 700, color: "#e2e8f0" }}>{label}</span>
                                </span>
                              ))}
                              <span style={{
                                marginLeft: "auto", padding: "2px 7px", borderRadius: 4, fontSize: 10, fontWeight: 700,
                                background: path.risk === "elevated" ? "rgba(249,115,22,0.1)" : "rgba(234,179,8,0.1)",
                                color: path.risk === "elevated" ? "#f97316" : "#eab308",
                                textTransform: "uppercase", letterSpacing: "0.05em",
                              }}>
                                {path.risk}
                              </span>
                            </div>
                            <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                              {path.domains.map(d => (
                                <span key={d} style={{
                                  padding: "2px 6px", borderRadius: 4, fontSize: 10, fontWeight: 600,
                                  background: `${DOMAIN_COLORS[d] ?? "#6b7280"}12`,
                                  color: DOMAIN_COLORS[d] ?? "#6b7280",
                                }}>{d}</span>
                              ))}
                            </div>
                            <div style={{ marginTop: 10 }} data-testid={`proof-drawer-xdp-${selectedEntity.id}-${i}`}>
                              <ProofDrawer
                                proof={buildEntityProof(selectedEntity, "cross_domain", `XDP-${i + 1}-${path.path[path.path.length - 1].slice(0, 16).replace(/\s+/g, "-")}`)}
                                compact={true}
                                defaultOpen={false}
                              />
                            </div>
                          </m.div>
                        ))}

                        <div style={{ marginTop: 8, padding: "12px 14px", background: "rgba(59,130,246,0.06)", borderRadius: 10, border: "1px solid rgba(59,130,246,0.15)" }}>
                          <p style={{ fontSize: 11, fontWeight: 700, color: "#60a5fa", marginBottom: 6 }}>Cross-Domain Risk Summary</p>
                          <p style={{ fontSize: 12.5, color: "hsl(210,5%,65%)", lineHeight: 1.6, margin: 0 }}>
                            {selectedEntity.label} spans {selectedEntity.domains.length} domain{selectedEntity.domains.length !== 1 ? "s" : ""} ({selectedEntity.domains.join(", ")}), with{" "}
                            {outgoing.length + incoming.length} documented cross-domain connections. Risk score of {selectedEntity.riskScore}{" "}
                            reflects correlated exposure — changes in any connected domain may propagate.
                          </p>
                        </div>

                        {selectedEntity.relatedAlertIds.length > 0 && (
                          <div style={{ padding: "10px 14px", background: "rgba(255,255,255,0.02)", borderRadius: 8, border: "1px solid rgba(255,255,255,0.07)" }}>
                            <p style={{ fontSize: 11, fontWeight: 700, color: "hsl(210,5%,48%)", marginBottom: 8 }}>Related Fusion Alerts</p>
                            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                              {selectedEntity.relatedAlertIds.map(alertId => {
                                const alertMeta = ALERT_LABELS[alertId];
                                if (!alertMeta) return null;
                                return (
                                  <div key={alertId} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                    <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#ef4444", flexShrink: 0, marginTop: 4 }} />
                                      <Link href={alertMeta.href}>
                                        <a style={{ fontSize: 12, color: "#60a5fa", textDecoration: "none", lineHeight: 1.4 }}>
                                          {alertMeta.title}
                                        </a>
                                      </Link>
                                    </div>
                                    <div style={{ paddingLeft: 14 }} data-testid={`proof-drawer-alert-${selectedEntity.id}-${alertId}`}>
                                      <ProofDrawer
                                        proof={buildEntityProof(selectedEntity, "fusion_alert", alertId)}
                                        compact={true}
                                        defaultOpen={false}
                                      />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </m.div>
                  )}
                </AnimatePresence>
              </m.div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 400, color: "hsl(210,5%,40%)" }}>
                <Network size={48} style={{ marginBottom: 16, opacity: 0.3 }} />
                <p style={{ fontSize: 14, textAlign: "center" }}>Select an entity from the list to explore its cross-domain connections</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <SiteFooter />
    </div>
  );
}
