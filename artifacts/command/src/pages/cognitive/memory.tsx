import React, { useState, useMemo, useEffect } from "react";

import { CognitiveLayout } from "./cognitive-layout";
import { useStandardQuery } from "@szl-holdings/api-client-react";

const ACCENT = "#8b7ac8";

type MemoryType = "working" | "episodic" | "semantic" | "procedural";
type MemoryTier = "hot" | "warm" | "cold" | "archived";

interface MemoryRecord {
  id: string;
  type: MemoryType;
  tier: MemoryTier;
  entity: string;
  traceId: string;
  domain: string;
  key: string;
  value: string;
  confidence: number;
  freshness: number;
  provenance: string;
  provenanceType: "agent" | "operator" | "system" | "external";
  createdAt: string;
  expiresAt?: string;
  tags: string[];
}

const SEEDED_RECORDS: MemoryRecord[] = [
  {
    id: "mem-001",
    type: "working",
    tier: "hot",
    entity: "incident:aegis-2024-1182",
    traceId: "tr-9f3a2b1c",
    domain: "aegis",
    key: "threat_classification",
    value: "Ransomware — lateral movement confirmed on 14 endpoints. C2 beacon: 185.220.101.47",
    confidence: 0.94,
    freshness: 0.98,
    provenance: "SOC Triage Agent v3.2",
    provenanceType: "agent",
    createdAt: "2026-04-17T08:12:33Z",
    expiresAt: "2026-04-17T20:12:33Z",
    tags: ["ransomware", "lateral-movement", "critical"],
  },
  {
    id: "mem-002",
    type: "episodic",
    tier: "hot",
    entity: "vessel:mv-aurora-constellation",
    traceId: "tr-4d8e1f09",
    domain: "vessels",
    key: "route_deviation_context",
    value: "Cyclone Halia bearing 240° at 18 knots. Agent recommended 3-day delay via Port Colombo. Operator approved.",
    confidence: 0.99,
    freshness: 0.82,
    provenance: "Voyage Planner Agent v2.1",
    provenanceType: "agent",
    createdAt: "2026-04-16T14:50:00Z",
    tags: ["cyclone", "route-deviation", "approved"],
  },
  {
    id: "mem-003",
    type: "semantic",
    tier: "warm",
    entity: "asset:terra-portfolio-nyc-mid",
    traceId: "tr-7c2a0e55",
    domain: "terra",
    key: "cap_rate_model_params",
    value: "Cap rate: 5.2% (±0.3). Comparable set: 12 assets. Model: DCF + residual value. IRR baseline: 8.4%.",
    confidence: 0.87,
    freshness: 0.71,
    provenance: "Portfolio Valuation Agent v1.8",
    provenanceType: "agent",
    createdAt: "2026-04-15T10:00:00Z",
    expiresAt: "2026-04-22T10:00:00Z",
    tags: ["valuation", "cap-rate", "nyc"],
  },
  {
    id: "mem-004",
    type: "procedural",
    tier: "warm",
    entity: "workflow:gdpr-breach-notification",
    traceId: "tr-1b9f4c82",
    domain: "prism",
    key: "notification_sequence",
    value: "Step 1: DPA notification within 72h. Step 2: Data subject notice within 30d. Step 3: Remediation log filed. Step 4: Board briefing.",
    confidence: 0.96,
    freshness: 0.60,
    provenance: "Prism Compliance Agent v4.0",
    provenanceType: "agent",
    createdAt: "2026-04-10T08:30:00Z",
    tags: ["gdpr", "breach", "procedure"],
  },
  {
    id: "mem-005",
    type: "semantic",
    tier: "warm",
    entity: "market:freight-rates-q2-2026",
    traceId: "tr-6a3f8d21",
    domain: "vessels",
    key: "VLCC_TCE_benchmark",
    value: "VLCC TD3C TCE: $38,200/day. 3-month forward: $41,500/day. Premium vs spot: +8.6%. Source: Baltic Exchange Apr 16.",
    confidence: 0.91,
    freshness: 0.55,
    provenance: "Market Intelligence Agent v2.3",
    provenanceType: "agent",
    createdAt: "2026-04-16T07:00:00Z",
    tags: ["freight", "VLCC", "TCE", "benchmark"],
  },
  {
    id: "mem-006",
    type: "episodic",
    tier: "cold",
    entity: "incident:aegis-2024-1074",
    traceId: "tr-0e7d2a90",
    domain: "aegis",
    key: "post_incident_summary",
    value: "APT29 phishing campaign neutralised. 3 accounts compromised; credentials rotated. No exfiltration confirmed. MTTR: 2h 18m.",
    confidence: 0.99,
    freshness: 0.28,
    provenance: "Operator: James Okafor",
    provenanceType: "operator",
    createdAt: "2026-04-02T17:45:00Z",
    tags: ["apt29", "phishing", "resolved"],
  },
  {
    id: "mem-007",
    type: "working",
    tier: "hot",
    entity: "decision:deal-flow-venture-2442",
    traceId: "tr-3c1b8e44",
    domain: "venture",
    key: "due_diligence_findings",
    value: "Series B — $12M ask at $60M pre-money. Revenue: $4.2M ARR. Rule of 40: 62. Key risk: customer concentration (top 3 = 58% ARR).",
    confidence: 0.88,
    freshness: 0.95,
    provenance: "Deal Intelligence Agent v1.5",
    provenanceType: "agent",
    createdAt: "2026-04-17T06:30:00Z",
    expiresAt: "2026-04-20T06:30:00Z",
    tags: ["series-b", "due-diligence", "venture"],
  },
  {
    id: "mem-008",
    type: "procedural",
    tier: "cold",
    entity: "workflow:vessel-drydock-inspection",
    traceId: "tr-5f2d7a38",
    domain: "vessels",
    key: "inspection_checklist_v3",
    value: "Hull plating thickness, propeller blade condition, shaft alignment, electrical isolation test, BWTS sampling. Estimated 18-day window.",
    confidence: 0.93,
    freshness: 0.22,
    provenance: "Fleet Ops Agent v2.0",
    provenanceType: "agent",
    createdAt: "2026-03-20T09:00:00Z",
    tags: ["drydock", "inspection", "maintenance"],
  },
  {
    id: "mem-009",
    type: "semantic",
    tier: "archived",
    entity: "regulation:imo-mepc-82",
    traceId: "tr-9a0c6b17",
    domain: "vessels",
    key: "cii_rating_thresholds_2026",
    value: "CII A: ≤0.82 attained. CII B: 0.82–0.91. CII C: 0.91–1.00. CII D/E trigger corrective action plan. Source: IMO MEPC.82/21.",
    confidence: 0.99,
    freshness: 0.12,
    provenance: "Regulatory Intelligence System",
    provenanceType: "system",
    createdAt: "2026-01-05T00:00:00Z",
    tags: ["IMO", "CII", "decarbonisation"],
  },
];

const TYPE_COLORS: Record<MemoryType, string> = {
  working: "#8b7ac8",
  episodic: "#0ea5e9",
  semantic: "#22c55e",
  procedural: "#f59e0b",
};

const TIER_COLORS: Record<MemoryTier, string> = {
  hot: "#ef4444",
  warm: "#f59e0b",
  cold: "#0ea5e9",
  archived: "#475569",
};

const PROVENANCE_ICONS: Record<MemoryRecord["provenanceType"], string> = {
  agent: "◈",
  operator: "◉",
  system: "◎",
  external: "◇",
};

const DOMAIN_COLORS: Record<string, string> = {
  aegis: "#ef4444",
  vessels: "#0ea5e9",
  terra: "#22c55e",
  prism: "#a855f7",
  venture: "#f59e0b",
  default: "#8b7ac8",
};

function ConfidenceBar({ value, color }: { value: number; color: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <div style={{ flex: 1, height: 4, background: "rgba(255,255,255,0.07)", borderRadius: 2, overflow: "hidden" }}>
        <div style={{ width: `${value * 100}%`, height: "100%", background: color, borderRadius: 2 }} />
      </div>
      <span style={{ fontSize: 10, color, fontWeight: 600, width: 32, textAlign: "right" }}>{(value * 100).toFixed(0)}%</span>
    </div>
  );
}

function FreshnessBar({ value }: { value: number }) {
  const color = value > 0.7 ? "#22c55e" : value > 0.4 ? "#f59e0b" : "#ef4444";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <div style={{ flex: 1, height: 4, background: "rgba(255,255,255,0.07)", borderRadius: 2, overflow: "hidden" }}>
        <div style={{ width: `${value * 100}%`, height: "100%", background: color, borderRadius: 2 }} />
      </div>
      <span style={{ fontSize: 10, color, fontWeight: 600, width: 32, textAlign: "right" }}>{(value * 100).toFixed(0)}%</span>
    </div>
  );
}

export default function MemoryExplorer() {
  const [typeFilter, setTypeFilter] = useState<MemoryType | "all">("all");
  const [tierFilter, setTierFilter] = useState<MemoryTier | "all">("all");
  const [domainFilter, setDomainFilter] = useState<string>("all");
  const [entityFilter, setEntityFilter] = useState<string>("all");
  const [traceFilter, setTraceFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<MemoryRecord | null>(SEEDED_RECORDS[0] ?? null);

  const { data: apiRecords } = useStandardQuery<MemoryRecord[]>({
    queryKey: ["cognitive", "memory", typeFilter, tierFilter, domainFilter, entityFilter, traceFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (typeFilter !== "all") params.set("type", typeFilter);
      if (tierFilter !== "all") params.set("tier", tierFilter);
      if (domainFilter !== "all") params.set("domain", domainFilter);
      if (entityFilter !== "all") params.set("entity", entityFilter);
      if (traceFilter !== "all") params.set("traceId", traceFilter);
      const res = await fetch(`/memory?${params.toString()}`, { credentials: "include" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json() as Promise<MemoryRecord[]>;
    },
    retry: 0,
    staleTime: 30_000,
  });

  const records = apiRecords ?? SEEDED_RECORDS;

  useEffect(() => {
    if (records.length > 0 && selected !== null) {
      const stillPresent = records.find((r) => r.id === selected.id);
      if (!stillPresent) setSelected(records[0] ?? null);
    }
  }, [records]);

  const domains = ["all", ...Array.from(new Set(records.map((r) => r.domain)))];
  const entities = ["all", ...Array.from(new Set(records.map((r) => r.entity)))];
  const traces = ["all", ...Array.from(new Set(records.map((r) => r.traceId)))];

  const filtered = useMemo(() => {
    return records.filter((r) => {
      if (typeFilter !== "all" && r.type !== typeFilter) return false;
      if (tierFilter !== "all" && r.tier !== tierFilter) return false;
      if (domainFilter !== "all" && r.domain !== domainFilter) return false;
      if (entityFilter !== "all" && r.entity !== entityFilter) return false;
      if (traceFilter !== "all" && r.traceId !== traceFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return r.key.includes(q) || r.value.toLowerCase().includes(q) || r.entity.toLowerCase().includes(q) || r.tags.some((t) => t.includes(q));
      }
      return true;
    });
  }, [records, typeFilter, tierFilter, domainFilter, entityFilter, traceFilter, search]);

  const stats = useMemo(() => ({
    total: records.length,
    hot: records.filter((r) => r.tier === "hot").length,
    avgConfidence: records.length ? records.reduce((s, r) => s + r.confidence, 0) / records.length : 0,
    avgFreshness: records.length ? records.reduce((s, r) => s + r.freshness, 0) / records.length : 0,
  }), [records]);

  return (
    <CognitiveLayout title="Memory Explorer" subtitle="Browse and search across all agent memory types. Inspect freshness, confidence, and provenance for every record.">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
          {[
            { label: "Total Records", value: stats.total, color: ACCENT },
            { label: "Hot Tier (Active)", value: stats.hot, color: "#ef4444" },
            { label: "Avg Confidence", value: `${(stats.avgConfidence * 100).toFixed(1)}%`, color: "#22c55e" },
            { label: "Avg Freshness", value: `${(stats.avgFreshness * 100).toFixed(1)}%`, color: "#f59e0b" },
          ].map((m) => (
            <div key={m.label} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "14px 18px" }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: m.color }}>{m.value}</div>
              <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{m.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search keys, values, tags…"
            style={{ flex: 1, minWidth: 160, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 7, padding: "7px 12px", color: "#e2e8f0", fontSize: 12, outline: "none" }}
          />
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as MemoryType | "all")} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 7, padding: "7px 10px", color: "#94a3b8", fontSize: 11 }}>
            <option value="all">All Types</option>
            {(["working", "episodic", "semantic", "procedural"] as MemoryType[]).map((t) => (
              <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
            ))}
          </select>
          <select value={tierFilter} onChange={(e) => setTierFilter(e.target.value as MemoryTier | "all")} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 7, padding: "7px 10px", color: "#94a3b8", fontSize: 11 }}>
            <option value="all">All Tiers</option>
            {(["hot", "warm", "cold", "archived"] as MemoryTier[]).map((t) => (
              <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
            ))}
          </select>
          <select value={domainFilter} onChange={(e) => setDomainFilter(e.target.value)} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 7, padding: "7px 10px", color: "#94a3b8", fontSize: 11 }}>
            {domains.map((d) => <option key={d} value={d}>{d === "all" ? "All Domains" : d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
          </select>
          <select value={entityFilter} onChange={(e) => setEntityFilter(e.target.value)} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 7, padding: "7px 10px", color: "#94a3b8", fontSize: 11, maxWidth: 200 }}>
            <option value="all">All Entities</option>
            {entities.filter((e) => e !== "all").map((e) => <option key={e} value={e}>{e}</option>)}
          </select>
          <select value={traceFilter} onChange={(e) => setTraceFilter(e.target.value)} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 7, padding: "7px 10px", color: "#94a3b8", fontSize: 11, fontFamily: "monospace" }}>
            <option value="all">All Traces</option>
            {traces.filter((t) => t !== "all").map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 400px", gap: 20 }}>
          <div>
            <div style={{ fontSize: 10, color: "#475569", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>
              {filtered.length} record{filtered.length !== 1 ? "s" : ""} found
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {filtered.map((rec) => (
                <div
                  key={rec.id}
                  onClick={() => setSelected(rec)}
                  style={{
                    background: selected?.id === rec.id ? `${ACCENT}10` : "rgba(255,255,255,0.03)",
                    border: selected?.id === rec.id ? `1px solid ${ACCENT}55` : "1px solid rgba(255,255,255,0.07)",
                    borderRadius: 10,
                    padding: "14px 16px",
                    cursor: "pointer",
                    transition: "all 0.12s",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, marginBottom: 8 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: TYPE_COLORS[rec.type], background: `${TYPE_COLORS[rec.type]}18`, padding: "2px 7px", borderRadius: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>{rec.type}</span>
                        <span style={{ fontSize: 10, fontWeight: 700, color: TIER_COLORS[rec.tier], background: `${TIER_COLORS[rec.tier]}18`, padding: "2px 7px", borderRadius: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>{rec.tier}</span>
                        <span style={{ fontSize: 10, color: DOMAIN_COLORS[rec.domain] ?? DOMAIN_COLORS.default, background: `${DOMAIN_COLORS[rec.domain] ?? DOMAIN_COLORS.default}15`, padding: "2px 7px", borderRadius: 4 }}>{rec.domain}</span>
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "#cbd5e1", marginBottom: 2, fontFamily: "monospace" }}>{rec.key}</div>
                      <div style={{ fontSize: 11, color: "#64748b", fontFamily: "monospace" }}>{rec.entity}</div>
                    </div>
                    <div style={{ fontSize: 10, color: "#475569", textAlign: "right", flexShrink: 0 }}>
                      <div>{new Date(rec.createdAt).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</div>
                      <div style={{ marginTop: 2, color: "#334155" }}>#{rec.id}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.5, marginBottom: 10, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {rec.value}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    <div>
                      <div style={{ fontSize: 9, color: "#475569", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 3 }}>Confidence</div>
                      <ConfidenceBar value={rec.confidence} color={TYPE_COLORS[rec.type]} />
                    </div>
                    <div>
                      <div style={{ fontSize: 9, color: "#475569", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 3 }}>Freshness</div>
                      <FreshnessBar value={rec.freshness} />
                    </div>
                  </div>
                </div>
              ))}
              {filtered.length === 0 && (
                <div style={{ textAlign: "center", color: "#475569", fontSize: 13, padding: "40px 0" }}>No records match the current filters</div>
              )}
            </div>
          </div>

          <div style={{ position: "sticky", top: 20, alignSelf: "flex-start" }}>
            {selected ? (
              <div style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${ACCENT}30`, borderRadius: 12, padding: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: 1, marginBottom: 14 }}>Record Detail</div>

                <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: TYPE_COLORS[selected.type], background: `${TYPE_COLORS[selected.type]}18`, padding: "3px 9px", borderRadius: 5, textTransform: "uppercase", letterSpacing: 0.5 }}>{selected.type}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: TIER_COLORS[selected.tier], background: `${TIER_COLORS[selected.tier]}18`, padding: "3px 9px", borderRadius: 5, textTransform: "uppercase", letterSpacing: 0.5 }}>{selected.tier} tier</span>
                </div>

                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 9, color: "#475569", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>Key</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0", fontFamily: "monospace" }}>{selected.key}</div>
                </div>

                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 9, color: "#475569", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>Value</div>
                  <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.6, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 6, padding: 10, fontFamily: "monospace", whiteSpace: "pre-wrap" }}>{selected.value}</div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
                  {[
                    { label: "Entity", value: selected.entity },
                    { label: "Domain", value: selected.domain },
                    { label: "Created", value: new Date(selected.createdAt).toLocaleString() },
                    { label: "Expires", value: selected.expiresAt ? new Date(selected.expiresAt).toLocaleString() : "No expiry" },
                  ].map((row) => (
                    <div key={row.label} style={{ display: "flex", justifyContent: "space-between", fontSize: 11, gap: 8 }}>
                      <span style={{ color: "#475569" }}>{row.label}</span>
                      <span style={{ color: "#94a3b8", fontFamily: "monospace", textAlign: "right", wordBreak: "break-all" }}>{row.value}</span>
                    </div>
                  ))}
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, gap: 8, alignItems: "center" }}>
                    <span style={{ color: "#475569" }}>Trace ID</span>
                    <a
                      href={`/operations/alloy/traces?traceId=${selected.traceId}`}
                      style={{ color: ACCENT, fontFamily: "monospace", textDecoration: "none", borderBottom: `1px solid ${ACCENT}40` }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {selected.traceId} ↗
                    </a>
                  </div>
                </div>

                <div style={{ padding: "12px 14px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8, marginBottom: 14 }}>
                  <div style={{ fontSize: 9, color: "#475569", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>Provenance</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 16, color: ACCENT }}>{PROVENANCE_ICONS[selected.provenanceType]}</span>
                    <div>
                      <div style={{ fontSize: 12, color: "#e2e8f0", fontWeight: 500 }}>{selected.provenance}</div>
                      <div style={{ fontSize: 10, color: "#475569", textTransform: "capitalize" }}>{selected.provenanceType}</div>
                    </div>
                  </div>
                </div>

                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 9, color: "#475569", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>Confidence & Freshness</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <div>
                      <div style={{ fontSize: 10, color: "#64748b", marginBottom: 4 }}>Confidence</div>
                      <ConfidenceBar value={selected.confidence} color={TYPE_COLORS[selected.type]} />
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: "#64748b", marginBottom: 4 }}>Freshness</div>
                      <FreshnessBar value={selected.freshness} />
                    </div>
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 9, color: "#475569", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>Tags</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                    {selected.tags.map((tag) => (
                      <span key={tag} style={{ fontSize: 10, color: "#64748b", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", padding: "2px 7px", borderRadius: 4 }}>{tag}</span>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.08)", borderRadius: 12, padding: 40, textAlign: "center" }}>
                <div style={{ fontSize: 28, marginBottom: 8, opacity: 0.3 }}>◈</div>
                <div style={{ fontSize: 13, color: "#475569" }}>Select a record to inspect</div>
              </div>
            )}
          </div>
        </div>
    </CognitiveLayout>
  );
}
