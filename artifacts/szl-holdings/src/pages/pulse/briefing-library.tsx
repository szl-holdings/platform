import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  Search, Filter, Calendar, ChevronRight, FileText, Shield,
  Ship, Building2, Activity, Scale, Bot, Star, AlertTriangle, CheckCircle2, X,
} from "lucide-react";
import { RISK_COLORS, AGENT_META, confidenceColor, formatDate, pulseFetch } from "./pulse-utils";

const TEXT = { primary: "hsl(38 8% 95%)", secondary: "hsl(214 7% 64%)", muted: "hsl(214 6% 42%)", faint: "hsl(214 5% 30%)" };
const BG = { page: "hsl(214 18% 3%)", surface: "hsla(214 12% 10% / 0.75)", card: "hsla(214 14% 6% / 0.95)" };
const BORDER = { subtle: "hsla(0 0% 100% / 0.055)" };
const PULSE_ACCENT = "hsl(191 92% 44%)";

type Brief = {
  id: string; date: string; headline: string; riskLevel: string;
  overallConfidence: number; tags: string[]; sections: Array<{ domain: string }>;
  agentsContributed: string[]; generatedAt: string; status: string;
  dissents: Array<{ id: string }>;
};

const DOMAIN_OPTIONS = ["all", "maritime", "security", "analytics", "legal", "infrastructure", "research"];
const RISK_OPTIONS = ["all", "critical", "high", "medium", "low"];

const DOMAIN_ICONS: Record<string, typeof FileText> = {
  maritime: Ship, security: Shield, analytics: Activity,
  legal: Scale, infrastructure: Bot, research: Star,
};

function BriefCard({ brief }: { brief: Brief }) {
  const risk = RISK_COLORS[brief.riskLevel as keyof typeof RISK_COLORS] ?? RISK_COLORS.medium;
  const domains = [...new Set(brief.sections.map(s => s.domain))].slice(0, 4);

  return (
    <Link href={`/pulse/brief/${brief.id}`}>
      <motion.div
        whileHover={{ borderColor: "hsla(0 0% 100% / 0.10)", boxShadow: "0 4px 24px rgba(0,0,0,0.4)" }}
        style={{
          background: BG.card, border: `1px solid ${BORDER.subtle}`, borderRadius: 10, padding: "1.125rem 1.25rem",
          cursor: "pointer", transition: "all 0.15s ease", display: "flex", gap: "1rem", alignItems: "flex-start",
          borderLeft: `3px solid ${risk.dot}`,
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "0.5rem", flexWrap: "wrap" }}>
            <span style={{ fontSize: 11, padding: "2px 6px", borderRadius: 4, background: risk.bg, color: risk.text, border: `1px solid ${risk.border}`, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>
              {brief.riskLevel}
            </span>
            <span style={{ fontSize: 11, color: TEXT.muted }}>{formatDate(brief.date)}</span>
            {brief.dissents.length > 0 && (
              <span style={{ fontSize: 11, padding: "1px 5px", borderRadius: 3, background: "hsla(32 88% 52% / 0.10)", color: "hsl(32 88% 62%)" }}>
                {brief.dissents.length} dissent{brief.dissents.length > 1 ? "s" : ""}
              </span>
            )}
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, color: TEXT.primary, lineHeight: 1.4, marginBottom: "0.5rem", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
            {brief.headline}
          </div>
          <div style={{ display: "flex", gap: "0.375rem", flexWrap: "wrap", alignItems: "center" }}>
            {domains.map(d => {
              const Icon = DOMAIN_ICONS[d] ?? FileText;
              return (
                <span key={d} style={{ display: "flex", alignItems: "center", gap: "0.25rem", fontSize: 11, padding: "2px 6px", borderRadius: 4, background: "hsla(214 12% 10% / 0.7)", color: TEXT.muted, border: `1px solid ${BORDER.subtle}` }}>
                  <Icon size={11} />{d}
                </span>
              );
            })}
          </div>
        </div>

        <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.5rem" }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: confidenceColor(brief.overallConfidence) }}>
            {brief.overallConfidence}
            <span style={{ fontSize: 11, color: TEXT.muted, fontWeight: 400 }}>%</span>
          </div>
          <ChevronRight size={15} style={{ color: TEXT.faint }} />
        </div>
      </motion.div>
    </Link>
  );
}

let searchTimerId: ReturnType<typeof setTimeout> | undefined;

export default function BriefingLibraryPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [domainFilter, setDomainFilter] = useState("all");
  const [riskFilter, setRiskFilter] = useState("all");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["pulse-library", debouncedSearch, domainFilter, riskFilter],
    queryFn: () => {
      const params = new URLSearchParams({ limit: "50", offset: "0" });
      if (debouncedSearch) params.set("q", debouncedSearch);
      if (domainFilter !== "all") params.set("domain", domainFilter);
      if (riskFilter !== "all") params.set("riskLevel", riskFilter);
      return pulseFetch<{ briefs: Brief[]; total: number }>(`/pulse/briefs?${params}`);
    },
  });

  function handleSearch(v: string) {
    setSearchQuery(v);
    clearTimeout(searchTimerId);
    searchTimerId = setTimeout(() => setDebouncedSearch(v), 350);
  }

  const briefs: Brief[] = data?.briefs ?? [];
  const total: number = data?.total ?? 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {/* Header */}
      <div>
        <h1 style={{ fontFamily: "var(--font-display, Space Grotesk, sans-serif)", fontWeight: 700, fontSize: 22, color: TEXT.primary, marginBottom: "0.375rem" }}>Briefing Library</h1>
        <p style={{ fontSize: 14, color: TEXT.secondary }}>{total} briefing{total !== 1 ? "s" : ""} in archive</p>
      </div>

      {/* Filters */}
      <div style={{ background: BG.surface, border: `1px solid ${BORDER.subtle}`, borderRadius: 10, padding: "1rem", display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
        {/* Search */}
        <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
          <Search size={14} style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: TEXT.muted }} />
          <input
            value={searchQuery}
            onChange={e => handleSearch(e.target.value)}
            placeholder="Search briefings…"
            style={{
              width: "100%", padding: "0.5rem 0.75rem 0.5rem 2.25rem", borderRadius: 7, border: "1px solid hsla(0 0% 100% / 0.08)",
              background: "hsla(214 12% 10% / 0.6)", color: TEXT.primary, fontSize: 13, outline: "none",
            }}
          />
          {searchQuery && (
            <button onClick={() => handleSearch("")} style={{ position: "absolute", right: "0.5rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: TEXT.muted }}>
              <X size={14} />
            </button>
          )}
        </div>

        {/* Domain */}
        <select
          value={domainFilter}
          onChange={e => setDomainFilter(e.target.value)}
          style={{ padding: "0.5rem 0.75rem", borderRadius: 7, border: "1px solid hsla(0 0% 100% / 0.08)", background: "hsla(214 12% 10% / 0.6)", color: TEXT.primary, fontSize: 13, cursor: "pointer" }}
        >
          {DOMAIN_OPTIONS.map(d => <option key={d} value={d}>{d === "all" ? "All Domains" : d}</option>)}
        </select>

        {/* Risk */}
        <select
          value={riskFilter}
          onChange={e => setRiskFilter(e.target.value)}
          style={{ padding: "0.5rem 0.75rem", borderRadius: 7, border: "1px solid hsla(0 0% 100% / 0.08)", background: "hsla(214 12% 10% / 0.6)", color: TEXT.primary, fontSize: 13, cursor: "pointer" }}
        >
          {RISK_OPTIONS.map(r => <option key={r} value={r}>{r === "all" ? "All Risk Levels" : r}</option>)}
        </select>
      </div>

      {/* Brief list */}
      {isLoading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} style={{ height: 100, borderRadius: 10, background: "hsla(214 12% 10% / 0.5)" }} />
          ))}
        </div>
      ) : briefs.length === 0 ? (
        <div style={{ textAlign: "center", padding: "4rem 2rem" }}>
          <FileText size={40} style={{ color: TEXT.faint, marginBottom: "1rem" }} />
          <p style={{ color: TEXT.secondary, fontSize: 14 }}>No briefings match your filters.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {briefs.map((brief, i) => (
            <motion.div key={brief.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              <BriefCard brief={brief} />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
