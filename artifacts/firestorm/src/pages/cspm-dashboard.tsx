import { useState } from "react";
import { Cloud, AlertTriangle, CheckCircle, Shield, ChevronDown, ChevronUp, RefreshCw, Database, Globe, Lock, Server, Network } from "lucide-react";

const RISK_COLOR: Record<string, string> = { critical: "#ef4444", high: "#f97316", medium: "#f59e0b", low: "#22c55e", pass: "#22c55e" };

interface CloudResource {
  id: string;
  provider: "AWS" | "Azure" | "GCP";
  service: string;
  name: string;
  region: string;
  riskLevel: "critical" | "high" | "medium" | "low";
  misconfigs: Misconfiguration[];
  complianceStatus: Record<string, "pass" | "fail" | "partial">;
}

interface Misconfiguration {
  id: string;
  rule: string;
  severity: "critical" | "high" | "medium" | "low";
  framework: string[];
  description: string;
  remediation: string;
}

const RESOURCES: CloudResource[] = [
  {
    id: "R-001", provider: "AWS", service: "S3", name: "szl-backups-prod", region: "us-east-1", riskLevel: "critical",
    misconfigs: [
      { id: "M-001", rule: "S3-001", severity: "critical", framework: ["CIS 2.1.2", "NIST AC-3"], description: "Bucket publicly accessible — ACL set to 'public-read'", remediation: "Apply bucket policy to restrict access to specific principals only" },
      { id: "M-002", rule: "S3-008", severity: "high", framework: ["CIS 2.1.5"], description: "Server-side encryption not enabled", remediation: "Enable SSE-S3 or SSE-KMS encryption on bucket" },
    ],
    complianceStatus: { "CIS AWS": "fail", "NIST 800-53": "fail", "SOC 2": "fail" },
  },
  {
    id: "R-002", provider: "AWS", service: "EC2", name: "prod-web-01", region: "us-east-1", riskLevel: "high",
    misconfigs: [
      { id: "M-003", rule: "EC2-012", severity: "high", framework: ["CIS 5.3", "NIST SC-7"], description: "Security group allows 0.0.0.0/0 on port 22 (SSH)", remediation: "Restrict SSH access to known IP ranges via security group rules" },
      { id: "M-004", rule: "EC2-019", severity: "medium", framework: ["CIS 5.4"], description: "IMDSv1 still enabled — susceptible to SSRF attacks", remediation: "Require IMDSv2 by setting HttpTokens to 'required'" },
    ],
    complianceStatus: { "CIS AWS": "fail", "NIST 800-53": "partial", "SOC 2": "partial" },
  },
  {
    id: "R-003", provider: "Azure", service: "Storage Account", name: "szlazurestorage01", region: "East US 2", riskLevel: "high",
    misconfigs: [
      { id: "M-005", rule: "AZ-STG-003", severity: "high", framework: ["CIS Azure 3.1", "NIST IA-5"], description: "Blob storage public access not blocked at account level", remediation: "Set 'Allow Blob Public Access' to false in storage account settings" },
    ],
    complianceStatus: { "CIS Azure": "fail", "NIST 800-53": "partial", "SOC 2": "pass" },
  },
  {
    id: "R-004", provider: "AWS", service: "IAM", name: "LegacyAdminRole", region: "global", riskLevel: "critical",
    misconfigs: [
      { id: "M-006", rule: "IAM-001", severity: "critical", framework: ["CIS 1.16", "NIST AC-6"], description: "Root account has no MFA — admin access without second factor", remediation: "Enable MFA for root account immediately via IAM console" },
      { id: "M-007", rule: "IAM-010", severity: "high", framework: ["CIS 1.12", "NIST AC-2"], description: "Inline policy grants full Administrator access (*:*)", remediation: "Replace with least-privilege managed policies following principle of least privilege" },
    ],
    complianceStatus: { "CIS AWS": "fail", "NIST 800-53": "fail", "SOC 2": "fail" },
  },
  {
    id: "R-005", provider: "GCP", service: "Cloud Storage", name: "gcp-ml-training-data", region: "us-central1", riskLevel: "medium",
    misconfigs: [
      { id: "M-008", rule: "GCP-GCS-002", severity: "medium", framework: ["CIS GCP 5.1"], description: "Bucket logging not enabled — no audit trail for access", remediation: "Enable Cloud Audit Logs for storage buckets" },
    ],
    complianceStatus: { "CIS GCP": "partial", "NIST 800-53": "partial", "SOC 2": "pass" },
  },
  {
    id: "R-006", provider: "AWS", service: "RDS", name: "prod-db-primary", region: "us-east-1", riskLevel: "low",
    misconfigs: [],
    complianceStatus: { "CIS AWS": "pass", "NIST 800-53": "pass", "SOC 2": "pass" },
  },
];

const COMPLIANCE_FRAMEWORKS = [
  { name: "CIS AWS Benchmarks", total: 231, passing: 187, score: 81 },
  { name: "CIS Azure Benchmarks", total: 198, passing: 154, score: 78 },
  { name: "CIS GCP Benchmarks", total: 176, passing: 148, score: 84 },
  { name: "NIST 800-53", total: 312, passing: 248, score: 79 },
  { name: "SOC 2 Type II", total: 89, passing: 74, score: 83 },
];

const PROVIDER_COLORS: Record<string, string> = { AWS: "#f97316", Azure: "#3b82f6", GCP: "#22c55e" };
const PROVIDER_BG: Record<string, string> = { AWS: "rgba(249,115,22,0.12)", Azure: "rgba(59,130,246,0.12)", GCP: "rgba(34,197,94,0.12)" };

// ── Cloud Topology Graph ─────────────────────────────────────────────────────

interface TopoNode {
  id: string;
  label: string;
  service: string;
  provider: "AWS" | "Azure" | "GCP";
  risk: "critical" | "high" | "medium" | "low";
  x: number;
  y: number;
  resourceId?: string;
}

interface TopoEdge { from: string; to: string; label?: string }

const TOPO_NODES: TopoNode[] = [
  { id: "vpc", label: "VPC", service: "VPC", provider: "AWS", risk: "low", x: 300, y: 60 },
  { id: "igw", label: "Internet GW", service: "IGW", provider: "AWS", risk: "low", x: 480, y: 60 },
  { id: "sg-web", label: "Web SG", service: "Security Group", provider: "AWS", risk: "high", x: 160, y: 150 },
  { id: "ec2-web", label: "prod-web-01", service: "EC2", provider: "AWS", risk: "high", x: 160, y: 250, resourceId: "R-002" },
  { id: "iam", label: "LegacyAdminRole", service: "IAM", provider: "AWS", risk: "critical", x: 440, y: 250, resourceId: "R-004" },
  { id: "s3", label: "szl-backups-prod", service: "S3", provider: "AWS", risk: "critical", x: 300, y: 360, resourceId: "R-001" },
  { id: "rds", label: "prod-db-primary", service: "RDS", provider: "AWS", risk: "low", x: 80, y: 360, resourceId: "R-006" },
  { id: "az-sa", label: "szlazurestorage01", service: "Storage", provider: "Azure", risk: "high", x: 580, y: 360, resourceId: "R-003" },
  { id: "gcp-gcs", label: "gcp-ml-data", service: "Cloud Storage", provider: "GCP", risk: "medium", x: 580, y: 150, resourceId: "R-005" },
];

const TOPO_EDGES: TopoEdge[] = [
  { from: "vpc", to: "igw", label: "Routes" },
  { from: "vpc", to: "sg-web" },
  { from: "sg-web", to: "ec2-web", label: "0.0.0.0/0 SSH" },
  { from: "ec2-web", to: "s3", label: "s3:GetObject" },
  { from: "ec2-web", to: "rds", label: "TCP 5432" },
  { from: "iam", to: "s3", label: "s3:*" },
  { from: "iam", to: "ec2-web", label: "EC2:*" },
  { from: "vpc", to: "gcp-gcs", label: "Cross-cloud" },
  { from: "az-sa", to: "s3", label: "Replication" },
];

const RISK_GLOW: Record<string, string> = { critical: "#ef4444", high: "#f97316", medium: "#f59e0b", low: "#22c55e" };

function CloudTopologyGraph({ onSelectNode }: { onSelectNode: (id: string | null) => void }) {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  const handleNodeClick = (nodeId: string) => {
    const next = selectedNode === nodeId ? null : nodeId;
    setSelectedNode(next);
    onSelectNode(next ? (TOPO_NODES.find(n => n.id === next)?.resourceId ?? null) : null);
  };

  return (
    <div className="relative w-full" style={{ height: 440 }}>
      {/* Legend */}
      <div className="absolute top-2 right-2 flex flex-col gap-1.5 z-10">
        {Object.entries({ critical: "Critical", high: "High", medium: "Medium", low: "Low" }).map(([k, v]) => (
          <div key={k} className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full border-2" style={{ borderColor: RISK_GLOW[k], background: `${RISK_GLOW[k]}20` }} />
            <span className="text-[9px] text-white/40">{v} risk</span>
          </div>
        ))}
        <div className="mt-1 border-t border-white/[0.06] pt-1">
          {(["AWS", "Azure", "GCP"] as const).map(p => (
            <div key={p} className="flex items-center gap-1.5 mb-0.5">
              <span className="w-3 h-3 rounded-sm" style={{ background: PROVIDER_BG[p], border: `1px solid ${PROVIDER_COLORS[p]}40` }} />
              <span className="text-[9px] text-white/40">{p}</span>
            </div>
          ))}
        </div>
      </div>

      <svg width="100%" height="440" viewBox="0 0 680 440" className="overflow-visible">
        <defs>
          <filter id="glow-crit"><feGaussianBlur stdDeviation="3" result="coloredBlur" /><feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
          <filter id="glow-high"><feGaussianBlur stdDeviation="2" result="coloredBlur" /><feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
          <marker id="arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="rgba(255,255,255,0.18)" /></marker>
        </defs>

        {/* Edges */}
        {TOPO_EDGES.map((edge, i) => {
          const from = TOPO_NODES.find(n => n.id === edge.from);
          const to = TOPO_NODES.find(n => n.id === edge.to);
          if (!from || !to) return null;
          const mx = (from.x + to.x) / 2;
          const my = (from.y + to.y) / 2;
          const isHighRiskPath = (RISK_GLOW[from.risk] === "#ef4444" || RISK_GLOW[to.risk] === "#ef4444");
          return (
            <g key={i}>
              <line
                x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                stroke={isHighRiskPath ? "rgba(239,68,68,0.35)" : "rgba(255,255,255,0.1)"}
                strokeWidth={isHighRiskPath ? 1.5 : 1}
                strokeDasharray={isHighRiskPath ? "4,3" : "none"}
                markerEnd="url(#arrow)"
              />
              {edge.label && (
                <text x={mx} y={my - 5} textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="8" fontFamily="monospace">{edge.label}</text>
              )}
            </g>
          );
        })}

        {/* Nodes */}
        {TOPO_NODES.map(node => {
          const isSelected = selectedNode === node.id;
          const isHovered = hoveredNode === node.id;
          const riskCol = RISK_GLOW[node.risk];
          const provCol = PROVIDER_COLORS[node.provider];
          return (
            <g
              key={node.id}
              transform={`translate(${node.x},${node.y})`}
              style={{ cursor: "pointer" }}
              onClick={() => handleNodeClick(node.id)}
              onMouseEnter={() => setHoveredNode(node.id)}
              onMouseLeave={() => setHoveredNode(null)}
              filter={node.risk === "critical" ? "url(#glow-crit)" : node.risk === "high" ? "url(#glow-high)" : undefined}
            >
              {/* Outer risk ring */}
              <circle r={26} fill={`${riskCol}10`} stroke={riskCol} strokeWidth={isSelected ? 2.5 : 1.5} opacity={isSelected || isHovered ? 1 : 0.7} />
              {/* Inner provider fill */}
              <circle r={18} fill={PROVIDER_BG[node.provider]} stroke={provCol} strokeWidth={1} opacity={0.9} />
              {/* Risk indicator dot */}
              <circle r={4} cx={14} cy={-14} fill={riskCol} stroke="rgba(0,0,0,0.4)" strokeWidth={1} />
              {/* Service label */}
              <text textAnchor="middle" y={5} fill={provCol} fontSize="8" fontWeight="600" fontFamily="monospace">{node.service.slice(0, 6)}</text>
              {/* Node name label below */}
              <text textAnchor="middle" y={38} fill="rgba(255,255,255,0.6)" fontSize="8.5" fontFamily="sans-serif" fontWeight="500">{node.label.slice(0, 14)}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

const TOTAL_MISCONFIGS = RESOURCES.flatMap(r => r.misconfigs);
const CRITICAL_COUNT = TOTAL_MISCONFIGS.filter(m => m.severity === "critical").length;
const HIGH_COUNT = TOTAL_MISCONFIGS.filter(m => m.severity === "high").length;

export default function CSPMDashboard() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [providerFilter, setProviderFilter] = useState("all");
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<"topology" | "findings" | "compliance">("topology");
  const [selectedResourceId, setSelectedResourceId] = useState<string | null>(null);

  const filtered = RESOURCES.filter(r => providerFilter === "all" || r.provider === providerFilter);
  const selectedResource = selectedResourceId ? RESOURCES.find(r => r.id === selectedResourceId) : null;

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-[1400px]">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Cloud className="w-5 h-5 text-violet-400" />
            Cloud Security Posture Management
          </h1>
          <p className="text-xs text-white/40 mt-0.5">Multi-cloud misconfiguration scanner — AWS · Azure · GCP · CIS · NIST 800-53 · SOC 2</p>
        </div>
        <button onClick={() => { setRefreshing(true); setTimeout(() => setRefreshing(false), 1800); }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-500/10 border border-violet-500/25 text-violet-400 text-xs hover:bg-violet-500/20 transition-colors">
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} /> Scan Now
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Critical Misconfigs", value: CRITICAL_COUNT, color: "#ef4444", icon: AlertTriangle },
          { label: "High Severity", value: HIGH_COUNT, color: "#f97316", icon: AlertTriangle },
          { label: "Resources Scanned", value: RESOURCES.length, color: "#8b5cf6", icon: Cloud },
          { label: "Overall Compliance", value: "81%", color: "#22c55e", icon: CheckCircle },
        ].map(m => {
          const Icon = m.icon;
          return (
            <div key={m.label} className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-white/40">{m.label}</span>
                <Icon className="w-3.5 h-3.5" style={{ color: m.color }} />
              </div>
              <div className="text-2xl font-bold" style={{ color: m.color }}>{m.value}</div>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white/[0.03] rounded-xl p-1 w-fit">
        {(["topology", "findings", "compliance"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className="px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all" style={tab === t ? { background: "rgba(139,92,246,0.15)", color: "#c4b5fd", border: "1px solid rgba(139,92,246,0.25)" } : { color: "rgba(255,255,255,0.4)" }}>
            {t}
          </button>
        ))}
      </div>

      {/* ── Topology Tab ─────────────────────────────────────────── */}
      {tab === "topology" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 rounded-xl border border-white/[0.06] bg-white/[0.025] p-4">
            <div className="flex items-center gap-2 mb-3">
              <Network className="w-3.5 h-3.5 text-violet-400" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-white/40">Cloud Topology — Risk Heat Map</span>
              <span className="text-[9px] text-white/25 ml-auto">Click a node to inspect misconfigs</span>
            </div>
            <CloudTopologyGraph onSelectNode={setSelectedResourceId} />
            <div className="text-[9px] text-white/20 mt-2 text-center">Dashed red edges indicate high-risk data paths · Glowing nodes = active misconfigurations</div>
          </div>

          {/* Node detail / misconfig panel */}
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-4">
            {selectedResource ? (
              <>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold" style={{ background: PROVIDER_BG[selectedResource.provider], color: PROVIDER_COLORS[selectedResource.provider] }}>
                    {selectedResource.provider[0]}
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-white font-mono">{selectedResource.name}</div>
                    <div className="text-[10px] text-white/30">{selectedResource.service} · {selectedResource.region}</div>
                  </div>
                </div>
                {/* Compliance status */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {Object.entries(selectedResource.complianceStatus).map(([fw, status]) => (
                    <span key={fw} className="text-[9px] px-1.5 py-0.5 rounded font-semibold" style={{ color: status === "pass" ? "#22c55e" : status === "partial" ? "#f59e0b" : "#ef4444", background: status === "pass" ? "rgba(34,197,94,0.1)" : status === "partial" ? "rgba(245,158,11,0.1)" : "rgba(239,68,68,0.1)" }}>{fw}: {status}</span>
                  ))}
                </div>
                {selectedResource.misconfigs.length === 0 ? (
                  <div className="flex items-center gap-2 text-xs text-emerald-400 py-3"><CheckCircle className="w-4 h-4" /> All checks passing</div>
                ) : (
                  <div className="space-y-2">
                    <div className="text-[9px] uppercase tracking-wider text-white/30 font-bold">Misconfigurations ({selectedResource.misconfigs.length})</div>
                    {selectedResource.misconfigs.map(m => (
                      <div key={m.id} className="rounded-lg border p-2.5 space-y-1.5" style={{ borderColor: `${RISK_COLOR[m.severity]}20`, background: `${RISK_COLOR[m.severity]}05` }}>
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-[10px] font-medium text-white leading-snug">{m.description}</span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded uppercase font-bold shrink-0" style={{ color: RISK_COLOR[m.severity], background: `${RISK_COLOR[m.severity]}15` }}>{m.severity}</span>
                        </div>
                        <div className="flex gap-1 flex-wrap">
                          {m.framework.map(f => <span key={f} className="text-[8px] font-mono text-white/35 bg-white/[0.04] px-1 py-0.5 rounded">{f}</span>)}
                        </div>
                        <p className="text-[10px]"><span className="text-white/30">Fix: </span><span className="text-emerald-400/80">{m.remediation}</span></p>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-center">
                <Network className="w-8 h-8 text-white/10 mb-3" />
                <div className="text-xs text-white/30">Click any node in the topology graph to inspect its misconfigurations and compliance framework mapping</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Findings Tab ─────────────────────────────────────────── */}
      {tab === "findings" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Compliance frameworks */}
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-4 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <Shield className="w-3.5 h-3.5 text-violet-400" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-white/40">Compliance Frameworks</span>
            </div>
            {COMPLIANCE_FRAMEWORKS.map(f => (
              <div key={f.name}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-white/70">{f.name}</span>
                  <span className="text-xs font-mono font-bold" style={{ color: f.score >= 80 ? "#22c55e" : f.score >= 60 ? "#f59e0b" : "#ef4444" }}>{f.score}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/[0.05]">
                  <div className="h-full rounded-full" style={{ width: `${f.score}%`, background: f.score >= 80 ? "#22c55e" : f.score >= 60 ? "#f59e0b" : "#ef4444" }} />
                </div>
                <div className="text-[9px] text-white/25 mt-0.5">{f.passing}/{f.total} controls passing</div>
              </div>
            ))}
          </div>

          {/* Resource list */}
          <div className="lg:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-white/40">Provider:</span>
              {["all", "AWS", "Azure", "GCP"].map(p => (
                <button
                  key={p}
                  onClick={() => setProviderFilter(p)}
                  className="px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all"
                  style={providerFilter === p ? { background: p === "all" ? "rgba(139,92,246,0.15)" : PROVIDER_BG[p], color: p === "all" ? "#8b5cf6" : PROVIDER_COLORS[p], border: `1px solid ${p === "all" ? "rgba(139,92,246,0.25)" : PROVIDER_COLORS[p] + "30"}` } : { background: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.06)" }}
                >
                  {p}
                </button>
              ))}
            </div>

            <div className="space-y-2">
              {filtered.map(resource => {
                const isExpanded = expandedId === resource.id;
                const miscCount = resource.misconfigs.length;
                return (
                  <div key={resource.id} className="rounded-xl border overflow-hidden" style={{ borderColor: isExpanded ? `${RISK_COLOR[resource.riskLevel]}30` : "rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
                    <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors text-left" onClick={() => setExpandedId(isExpanded ? null : resource.id)}>
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-[10px] font-bold" style={{ background: PROVIDER_BG[resource.provider], color: PROVIDER_COLORS[resource.provider] }}>
                        {resource.provider[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-white font-mono">{resource.name}</span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded font-medium" style={{ color: PROVIDER_COLORS[resource.provider], background: PROVIDER_BG[resource.provider] }}>{resource.service}</span>
                        </div>
                        <div className="text-[10px] text-white/30 mt-0.5">{resource.provider} · {resource.region} · {miscCount === 0 ? "No issues" : `${miscCount} misconfiguration${miscCount !== 1 ? "s" : ""}`}</div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="flex gap-1">
                          {Object.entries(resource.complianceStatus).map(([fw, status]) => (
                            <span key={fw} className="w-2 h-2 rounded-full" title={`${fw}: ${status}`} style={{ background: status === "pass" ? "#22c55e" : status === "partial" ? "#f59e0b" : "#ef4444" }} />
                          ))}
                        </div>
                        {miscCount > 0 && <span className="text-xs font-bold" style={{ color: RISK_COLOR[resource.riskLevel] }}>{miscCount}</span>}
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-white/30" /> : <ChevronDown className="w-3.5 h-3.5 text-white/30" />}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="px-4 pb-4 pt-1 border-t border-white/[0.04] space-y-2">
                        {resource.misconfigs.length === 0 ? (
                          <div className="flex items-center gap-2 text-xs text-emerald-400 py-2">
                            <CheckCircle className="w-4 h-4" /> No misconfigurations detected — all checks passing
                          </div>
                        ) : (
                          resource.misconfigs.map(m => (
                            <div key={m.id} className="rounded-lg border p-3 space-y-1" style={{ borderColor: `${RISK_COLOR[m.severity]}20`, background: `${RISK_COLOR[m.severity]}05` }}>
                              <div className="flex items-start justify-between gap-2">
                                <span className="text-xs font-medium text-white">{m.description}</span>
                                <span className="text-[9px] px-1.5 py-0.5 rounded uppercase font-bold shrink-0" style={{ color: RISK_COLOR[m.severity], background: `${RISK_COLOR[m.severity]}15` }}>{m.severity}</span>
                              </div>
                              <div className="flex gap-1 flex-wrap">
                                {m.framework.map(f => <span key={f} className="text-[9px] font-mono text-white/40 bg-white/[0.04] px-1.5 py-0.5 rounded">{f}</span>)}
                              </div>
                              <p className="text-[10px] text-emerald-400/80"><span className="text-white/30">Fix: </span>{m.remediation}</p>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Compliance Tab ─────────────────────────────────────────── */}
      {tab === "compliance" && (
        <div className="space-y-3">
          {COMPLIANCE_FRAMEWORKS.map(f => (
            <div key={f.name} className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-white">{f.name}</span>
                <span className="text-lg font-bold" style={{ color: f.score >= 80 ? "#22c55e" : f.score >= 60 ? "#f59e0b" : "#ef4444" }}>{f.score}%</span>
              </div>
              <div className="h-2 rounded-full bg-white/[0.05] mb-2">
                <div className="h-full rounded-full" style={{ width: `${f.score}%`, background: f.score >= 80 ? "#22c55e" : f.score >= 60 ? "#f59e0b" : "#ef4444" }} />
              </div>
              <div className="flex items-center justify-between text-[10px] text-white/30">
                <span>{f.passing} passing</span>
                <span>{f.total - f.passing} failing</span>
                <span>{f.total} total controls</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
