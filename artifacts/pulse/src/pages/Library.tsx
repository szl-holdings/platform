import { useState } from "react";
import { Link } from "wouter";
import { Search, Filter, ChevronRight, Calendar, Shield, Check, Archive } from "lucide-react";
import { getRiskColor, type DomainKey, type RiskLevel } from "../lib/data";
import { useBriefings, useApproveBriefing, useArchiveBriefing } from "../lib/api";
import ConfidenceChip from "../components/ConfidenceChip";

type RiskFilter = RiskLevel | "all";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") || "/pulse";

const DOMAIN_OPTIONS: { value: DomainKey | "all"; label: string }[] = [
  { value: "all", label: "All Domains" },
  { value: "maritime", label: "Maritime" },
  { value: "security", label: "Security" },
  { value: "real_estate", label: "Real Estate" },
  { value: "legal", label: "Legal" },
  { value: "financial", label: "Financial" },
  { value: "platform", label: "Platform" },
];

export default function Library() {
  const [search, setSearch] = useState("");
  const [domainFilter, setDomainFilter] = useState<DomainKey | "all">("all");
  const [riskFilter, setRiskFilter] = useState<RiskFilter>("all");

  const { data: briefings, isLoading, error } = useBriefings({ domain: domainFilter, risk: riskFilter });
  const approveMut = useApproveBriefing();
  const archiveMut = useArchiveBriefing();
  const allBriefings = briefings ?? [];

  const filtered = allBriefings.filter(b => {
    const q = search.toLowerCase();
    const matchSearch = !q || b.headline.toLowerCase().includes(q) || b.date.includes(q) || b.leadSentence.toLowerCase().includes(q);
    return matchSearch;
  });

  return (
    <div style={{ padding: "28px 28px 40px" }}>
      {/* Page header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: "1.4rem", fontWeight: 600, color: "var(--pulse-text)", marginBottom: 6 }}>Briefing Library</h1>
        <p style={{ fontSize: "0.85rem", color: "var(--pulse-text-muted)" }}>
          {allBriefings.length} briefings · searchable archive of all AI-generated intelligence products
        </p>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <div style={{
          flex: 1, display: "flex", alignItems: "center", gap: 8,
          padding: "8px 14px",
          background: "var(--pulse-card)", border: "1px solid var(--pulse-border)",
          borderRadius: 6,
        }}>
          <Search size={14} color="var(--pulse-text-muted)" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search briefings by topic, entity, date..."
            style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "var(--pulse-text)", fontSize: "0.85rem" }}
          />
        </div>
        <select
          value={domainFilter}
          onChange={e => setDomainFilter(e.target.value as DomainKey | "all")}
          style={{
            padding: "8px 12px", borderRadius: 6,
            background: "var(--pulse-card)", border: "1px solid var(--pulse-border)",
            color: "var(--pulse-text)", fontSize: "0.82rem", cursor: "pointer",
          }}
        >
          {DOMAIN_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select
          value={riskFilter}
          onChange={e => setRiskFilter(e.target.value as RiskFilter)}
          style={{
            padding: "8px 12px", borderRadius: 6,
            background: "var(--pulse-card)", border: "1px solid var(--pulse-border)",
            color: "var(--pulse-text)", fontSize: "0.82rem", cursor: "pointer",
          }}
        >
          <option value="all">All Risk Levels</option>
          <option value="CRITICAL">Critical</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>
      </div>

      {/* Results count */}
      <div style={{ fontSize: "0.72rem", color: "var(--pulse-text-muted)", marginBottom: 12 }}>
        {isLoading ? "Loading briefings…" : error ? `Error: ${error instanceof Error ? error.message : "failed to load"}` : `Showing ${filtered.length} of ${allBriefings.length} briefings`}
      </div>

      {/* Briefing list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {filtered.map((briefing, i) => (
          <Link key={briefing.id} href={`${BASE}/library/${briefing.id}`}>
            <a style={{ textDecoration: "none" }}>
              <div className="section-card animate-fadeIn" style={{
                padding: "16px 20px",
                cursor: "pointer",
                transition: "border-color 0.15s",
                animationDelay: `${i * 0.03}s`,
              }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--pulse-border-bright)")}
                onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--pulse-border)")}
              >
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: "0.67rem", color: "var(--pulse-text-muted)" }}>
                        <Calendar size={11} />
                        <span>{new Date(briefing.date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</span>
                      </div>
                      <div style={{ width: 3, height: 3, borderRadius: "50%", background: "var(--pulse-border-bright)" }} />
                      <span style={{ fontSize: "0.67rem", color: "var(--pulse-text-muted)" }}>{briefing.edition}</span>
                      <div style={{ width: 3, height: 3, borderRadius: "50%", background: "var(--pulse-border-bright)" }} />
                      <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: "0.67rem" }}>
                        <Shield size={10} color="var(--pulse-gold-dim)" />
                        <span style={{ color: "var(--pulse-gold-dim)" }}>{briefing.classification}</span>
                      </div>
                    </div>
                    <div className="font-serif" style={{ fontSize: "1rem", color: "var(--pulse-text)", lineHeight: 1.4, marginBottom: 6 }}>
                      {briefing.headline}
                    </div>
                    <p style={{ fontSize: "0.8rem", color: "var(--pulse-text-muted)", lineHeight: 1.5 }}>{briefing.leadSentence}</p>
                    <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: 10 }}>
                      {briefing.domains.map(d => (
                        <span key={d} style={{
                          padding: "2px 8px", borderRadius: 20,
                          background: "rgba(255,255,255,0.04)", border: "1px solid var(--pulse-border)",
                          fontSize: "0.65rem", color: "var(--pulse-text-muted)",
                        }}>
                          {d.replace("_", " ")}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8, flexShrink: 0 }}>
                    <span style={{
                      padding: "2px 8px", borderRadius: 4,
                      fontSize: "0.68rem", fontWeight: 700,
                      color: getRiskColor(briefing.overallRisk),
                      background: `${getRiskColor(briefing.overallRisk)}18`,
                      border: `1px solid ${getRiskColor(briefing.overallRisk)}40`,
                    }}>{briefing.overallRisk}</span>
                    <ConfidenceChip score={briefing.overallConfidence} size="sm" />
                    <span style={{
                      fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase",
                      color: briefing.status === "archived" ? "#7a8295" : briefing.status === "draft" ? "#c8a84b" : "#4eca8b",
                    }}>{briefing.status}</span>
                    <div style={{ display: "flex", gap: 4 }} onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                      <button
                        type="button"
                        title="Approve briefing"
                        disabled={approveMut.isPending || briefing.status === "published"}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          approveMut.mutate(briefing.id);
                        }}
                        style={{
                          display: "inline-flex", alignItems: "center", gap: 4,
                          padding: "3px 8px", borderRadius: 4,
                          background: briefing.status === "published" ? "rgba(78,202,139,0.06)" : "rgba(78,202,139,0.12)",
                          border: "1px solid rgba(78,202,139,0.3)",
                          color: "#4eca8b", fontSize: "0.65rem", fontWeight: 600,
                          cursor: briefing.status === "published" ? "default" : "pointer",
                          opacity: approveMut.isPending ? 0.6 : 1,
                        }}
                      >
                        <Check size={10} /> Approve
                      </button>
                      <button
                        type="button"
                        title="Archive briefing"
                        disabled={archiveMut.isPending || briefing.status === "archived"}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          archiveMut.mutate(briefing.id);
                        }}
                        style={{
                          display: "inline-flex", alignItems: "center", gap: 4,
                          padding: "3px 8px", borderRadius: 4,
                          background: briefing.status === "archived" ? "rgba(122,130,149,0.06)" : "rgba(122,130,149,0.12)",
                          border: "1px solid rgba(122,130,149,0.3)",
                          color: "#a0a8b8", fontSize: "0.65rem", fontWeight: 600,
                          cursor: briefing.status === "archived" ? "default" : "pointer",
                          opacity: archiveMut.isPending ? 0.6 : 1,
                        }}
                      >
                        <Archive size={10} /> Archive
                      </button>
                    </div>
                    <ChevronRight size={14} color="var(--pulse-text-muted)" />
                  </div>
                </div>
              </div>
            </a>
          </Link>
        ))}
        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 0", color: "var(--pulse-text-muted)" }}>
            <p style={{ fontSize: "0.9rem" }}>No briefings match your current filters</p>
            <button onClick={() => { setSearch(""); setDomainFilter("all"); setRiskFilter("all"); }}
              style={{ marginTop: 12, padding: "6px 14px", borderRadius: 6, background: "var(--pulse-card)", border: "1px solid var(--pulse-border)", color: "var(--pulse-text-dim)", cursor: "pointer", fontSize: "0.8rem" }}>
              Clear filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
