import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { m } from "framer-motion";
import { Search, TrendingUp, AlertCircle, ArrowUpRight, Target, BarChart2, Globe, Zap } from "lucide-react";
import { DistributionOsLayout } from "./admin-dashboard";
import { DataProvenance } from "@szl-holdings/shared-ui/data-provenance";
import { type DataProvenanceInfo } from "@szl-holdings/shared-ui/ontology";

const API = import.meta.env.VITE_API_URL || "";

const DS = {
  surface: "#0b0f19",
  elevated: "#0f1420",
  border: "rgba(255,255,255,0.05)",
  borderMuted: "rgba(255,255,255,0.08)",
  accent: "#d4a054",
  green: "#5a9c5a",
  blue: "#4a8ab8",
  red: "#c45a4a",
  text: { primary: "rgba(255,255,255,0.88)", secondary: "rgba(255,255,255,0.5)", tertiary: "rgba(255,255,255,0.28)", muted: "rgba(255,255,255,0.14)" },
};

const PROV: DataProvenanceInfo = {
    source: "Distribution OS — SEO Intelligence Command",
    lastUpdated: new Date().toISOString(),
    freshness: "minutes",
    confidence: "high",
    dataState: "demo",
  };

interface Keyword { id: number; keyword: string; volume: number; difficulty: number; currentRank: number | null; trend: string; opportunityScore: number; }
interface Opportunity { keyword: string; volume: number; difficulty: number; currentRank: number | null; opportunityScore: number; action: string; }
interface ContentGap { topic: string; competitors: number; avgRank: number; searchVolume: number; }
interface TechnicalIssue { type: string; count: number; severity: string; }
interface SeoData { domainAuthority: number; organicTraffic: number; trafficGrowth: number; indexedPages: number; technicalIssues: TechnicalIssue[]; topOpportunities: Opportunity[]; contentGaps: ContentGap[]; }

function DifficultyBadge({ value }: { value: number }) {
  const color = value < 35 ? DS.green : value < 55 ? DS.accent : DS.red;
  const label = value < 35 ? "Easy" : value < 55 ? "Medium" : "Hard";
  return <span style={{ fontSize: "0.625rem", padding: "0.15rem 0.5rem", borderRadius: "4px", background: `${color}14`, color, border: `1px solid ${color}20`, fontWeight: 600 }}>{label}</span>;
}

function TrendBadge({ trend }: { trend: string }) {
  const color = trend === "rising" ? DS.green : trend === "declining" ? DS.red : DS.text.tertiary;
  return <span style={{ fontSize: "0.625rem", padding: "0.15rem 0.5rem", borderRadius: "4px", background: `${color}10`, color, fontWeight: 500 }}>↑ {trend}</span>;
}

export default function SeoIntelligencePage() {
  const [location] = useLocation();
  const [data, setData] = useState<SeoData | null>(null);
  const [keywords, setKeywords] = useState<{ keywords: Keyword[]; summary: Record<string, number> } | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "keywords" | "gaps">("overview");

  useEffect(() => {
    Promise.all([
      fetch(`${API}/api/distribution-os/seo/overview`, { credentials: "include" }).then(r => r.json()),
      fetch(`${API}/api/distribution-os/seo/keywords`, { credentials: "include" }).then(r => r.json()),
    ]).then(([o, k]) => { setData(o); setKeywords(k); }).catch(() => {});
  }, []);

  const severityColor = (s: string) => s === "high" ? DS.red : s === "medium" ? DS.accent : DS.text.tertiary;

  return (
    <DistributionOsLayout currentPath={location}>
      <m.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1.25rem", flexWrap: "wrap", gap: "0.75rem" }}>
          <div>
            <h1 style={{ fontSize: "1.25rem", fontWeight: 700, color: DS.text.primary, letterSpacing: "-0.025em", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Search size={18} style={{ color: DS.accent }} /> SEO Intelligence Command
            </h1>
            <p style={{ fontSize: "0.75rem", color: DS.text.tertiary, marginTop: "0.25rem" }}>Competitive gap analysis, keyword prediction, and technical SEO monitoring</p>
          </div>
          <DataProvenance provenance={PROV} />
        </div>

        {/* KPIs */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.75rem", marginBottom: "1.25rem" }}>
          {[
            { label: "Domain Authority", value: data?.domainAuthority ?? "—", color: DS.accent, icon: Globe, sub: "/100" },
            { label: "Organic Traffic / Mo", value: data?.organicTraffic?.toLocaleString() ?? "—", color: DS.green, icon: TrendingUp, sub: `+${data?.trafficGrowth ?? 0}%` },
            { label: "Indexed Pages", value: data?.indexedPages ?? "—", color: DS.blue, icon: BarChart2, sub: "in search index" },
            { label: "Technical Issues", value: data?.technicalIssues?.reduce((s, i) => s + i.count, 0) ?? "—", color: DS.red, icon: AlertCircle, sub: `${data?.technicalIssues?.filter(i => i.severity === "high").length ?? 0} high priority` },
          ].map(({ label, value, color, icon: Icon, sub }) => (
            <div key={label} style={{ padding: "1rem 1.25rem", background: DS.surface, border: `1px solid ${DS.border}`, borderRadius: "10px", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: `linear-gradient(90deg, ${color}60, transparent)` }} />
              <Icon size={14} style={{ color, marginBottom: "0.5rem" }} />
              <div style={{ fontSize: "1.75rem", fontWeight: 700, color: DS.text.primary, letterSpacing: "-0.025em", fontVariantNumeric: "tabular-nums" }}>{value}</div>
              <div style={{ fontSize: "0.6875rem", color: DS.text.tertiary }}>{label}</div>
              {sub && <div style={{ fontSize: "0.625rem", color: DS.text.muted, marginTop: "0.125rem" }}>{sub}</div>}
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
          {(["overview", "keywords", "gaps"] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{ padding: "0.375rem 0.875rem", borderRadius: "6px", border: `1px solid ${activeTab === tab ? DS.accent + "40" : DS.border}`, background: activeTab === tab ? `${DS.accent}10` : "transparent", color: activeTab === tab ? DS.accent : DS.text.tertiary, fontSize: "0.8125rem", fontWeight: activeTab === tab ? 600 : 400, cursor: "pointer", textTransform: "capitalize" }}>
              {tab === "gaps" ? "Content Gaps" : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {activeTab === "overview" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            {/* Top opportunities */}
            <div style={{ padding: "1.25rem", background: DS.surface, border: `1px solid ${DS.border}`, borderRadius: "10px" }}>
              <div style={{ fontSize: "0.75rem", fontWeight: 600, color: DS.text.tertiary, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.875rem", display: "flex", alignItems: "center", gap: "0.375rem" }}>
                <Zap size={12} style={{ color: DS.accent }} /> Top Keyword Opportunities
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {data?.topOpportunities.map((op, i) => (
                  <div key={i} style={{ padding: "0.875rem", background: DS.elevated, borderRadius: "8px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.375rem" }}>
                      <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: DS.text.primary }}>{op.keyword}</span>
                      <span style={{ fontSize: "0.75rem", fontWeight: 700, color: DS.green }}>Score: {op.opportunityScore}</span>
                    </div>
                    <div style={{ display: "flex", gap: "0.75rem", marginBottom: "0.5rem" }}>
                      <span style={{ fontSize: "0.6875rem", color: DS.text.muted }}>Vol: {op.volume.toLocaleString()}</span>
                      <DifficultyBadge value={op.difficulty} />
                      <span style={{ fontSize: "0.6875rem", color: DS.text.muted }}>Rank: {op.currentRank ?? "—"}</span>
                    </div>
                    <p style={{ fontSize: "0.6875rem", color: DS.text.secondary, margin: 0, lineHeight: 1.5 }}>{op.action}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Technical issues */}
            <div>
              <div style={{ padding: "1.25rem", background: DS.surface, border: `1px solid ${DS.border}`, borderRadius: "10px", marginBottom: "0.75rem" }}>
                <div style={{ fontSize: "0.75rem", fontWeight: 600, color: DS.text.tertiary, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.875rem" }}>Technical SEO Issues</div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {data?.technicalIssues.map((issue, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.625rem 0.75rem", background: DS.elevated, borderRadius: "7px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <AlertCircle size={13} style={{ color: severityColor(issue.severity) }} />
                        <span style={{ fontSize: "0.75rem", color: DS.text.secondary }}>{issue.type}</span>
                      </div>
                      <div style={{ display: "flex", gap: "0.625rem", alignItems: "center" }}>
                        <span style={{ fontSize: "0.75rem", fontWeight: 600, color: DS.text.primary, fontVariantNumeric: "tabular-nums" }}>{issue.count}</span>
                        <span style={{ fontSize: "0.625rem", padding: "0.1rem 0.4rem", borderRadius: "4px", background: `${severityColor(issue.severity)}14`, color: severityColor(issue.severity), textTransform: "capitalize" }}>{issue.severity}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "keywords" && (
          <div style={{ background: DS.surface, border: `1px solid ${DS.border}`, borderRadius: "10px", overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: "3fr 1fr 1fr 1fr 1fr 1fr", padding: "0.625rem 1rem", borderBottom: `1px solid ${DS.border}`, fontSize: "0.625rem", fontWeight: 700, color: DS.text.muted, textTransform: "uppercase", letterSpacing: "0.08em", gap: "0.5rem" }}>
              <span>Keyword</span><span>Volume</span><span>Difficulty</span><span>Rank</span><span>Trend</span><span>Score</span>
            </div>
            {keywords?.keywords.map(kw => (
              <div key={kw.id} style={{ display: "grid", gridTemplateColumns: "3fr 1fr 1fr 1fr 1fr 1fr", padding: "0.75rem 1rem", borderBottom: `1px solid ${DS.border}`, gap: "0.5rem", alignItems: "center" }}>
                <span style={{ fontSize: "0.75rem", color: DS.text.secondary }}>{kw.keyword}</span>
                <span style={{ fontSize: "0.75rem", color: DS.text.primary, fontVariantNumeric: "tabular-nums" }}>{kw.volume.toLocaleString()}</span>
                <DifficultyBadge value={kw.difficulty} />
                <span style={{ fontSize: "0.75rem", color: kw.currentRank && kw.currentRank <= 10 ? DS.green : DS.text.secondary, fontVariantNumeric: "tabular-nums" }}>{kw.currentRank ?? "—"}</span>
                <TrendBadge trend={kw.trend} />
                <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: kw.opportunityScore >= 85 ? DS.green : DS.text.primary }}>{kw.opportunityScore}</span>
              </div>
            ))}
          </div>
        )}

        {activeTab === "gaps" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {data?.contentGaps.map((gap, i) => (
              <div key={i} style={{ padding: "1.125rem 1.25rem", background: DS.surface, border: `1px solid ${DS.border}`, borderRadius: "10px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.625rem" }}>
                  <span style={{ fontSize: "0.875rem", fontWeight: 600, color: DS.text.primary }}>{gap.topic}</span>
                  <span style={{ fontSize: "0.625rem", padding: "0.2rem 0.625rem", borderRadius: "4px", background: `${DS.green}14`, color: DS.green, fontWeight: 600 }}>GAP OPPORTUNITY</span>
                </div>
                <div style={{ display: "flex", gap: "1.5rem" }}>
                  <div>
                    <div style={{ fontSize: "0.625rem", color: DS.text.muted }}>Search Volume</div>
                    <div style={{ fontSize: "0.875rem", fontWeight: 700, color: DS.text.primary, fontVariantNumeric: "tabular-nums" }}>{gap.searchVolume.toLocaleString()}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: "0.625rem", color: DS.text.muted }}>Competing Articles</div>
                    <div style={{ fontSize: "0.875rem", fontWeight: 700, color: DS.text.primary }}>{gap.competitors}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: "0.625rem", color: DS.text.muted }}>Avg Competitor Rank</div>
                    <div style={{ fontSize: "0.875rem", fontWeight: 700, color: DS.accent }}>{gap.avgRank}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </m.div>
    </DistributionOsLayout>
  );
}
