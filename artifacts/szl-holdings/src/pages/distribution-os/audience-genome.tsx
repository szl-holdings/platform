import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { m } from "framer-motion";
import { Dna, Users, TrendingUp, ArrowRight, Clock, Target, ArrowUpRight, BarChart2 } from "lucide-react";
import { DistributionOsLayout } from "./admin-dashboard";
import { DataProvenance } from "@szl-holdings/shared-ui";
import type { DataProvenanceInfo } from "@szl-holdings/shared-ui";

const API = import.meta.env.VITE_API_URL || "";

const DS = {
  surface: "#0b0f19",
  elevated: "#0f1420",
  border: "rgba(255,255,255,0.05)",
  borderMuted: "rgba(255,255,255,0.08)",
  accent: "#d4a054",
  green: "#5a9c5a",
  blue: "#4a8ab8",
  text: { primary: "rgba(255,255,255,0.88)", secondary: "rgba(255,255,255,0.5)", tertiary: "rgba(255,255,255,0.28)", muted: "rgba(255,255,255,0.14)" },
};

const PROV: DataProvenanceInfo = {
    source: "Distribution OS — Audience Insights Intelligence",
    lastUpdated: new Date().toISOString(),
    freshness: "minutes",
    confidence: "high",
    dataState: "demo",
  };

const SEGMENT_COLORS = ["#d4a054", "#4a8ab8", "#9b7fd4", "#5a9c5a", "#c8953c"];

interface Segment {
  id: number;
  name: string;
  size: number;
  growthRate: number;
  engagementScore: number;
  conversionRate: number;
  revenueContribution: number;
  peakHour: number;
  platforms: string[];
  topTopics: string[];
  psychographics: { primaryMotivation: string; contentPreference: string; decisionStyle: string };
}

interface MigrationFlow {
  from: string;
  to: string;
  count: number;
  rate: number;
}

export default function AudienceGenomePage() {
  const [location] = useLocation();
  const [genome, setGenome] = useState<{ segments: Segment[]; totalAudience: number; fastestGrowing: string; highestRevenue: string } | null>(null);
  const [migration, setMigration] = useState<{ flows: MigrationFlow[]; totalMigrations: number; topPath: string; avgConversionDays: number } | null>(null);
  const [selected, setSelected] = useState<Segment | null>(null);

  useEffect(() => {
    Promise.all([
      fetch(`${API}/api/distribution-os/audience/genome`, { credentials: "include" }).then(r => r.json()),
      fetch(`${API}/api/distribution-os/audience/migration`, { credentials: "include" }).then(r => r.json()),
    ]).then(([g, m]) => {
      setGenome(g);
      setMigration(m);
      if (g.segments?.length) setSelected(g.segments[0]);
    }).catch(() => {});
  }, []);

  return (
    <DistributionOsLayout currentPath={location}>
      <m.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1.25rem", flexWrap: "wrap", gap: "0.75rem" }}>
          <div>
            <h1 style={{ fontSize: "1.25rem", fontWeight: 700, color: DS.text.primary, letterSpacing: "-0.025em", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Dna size={18} style={{ color: DS.accent }} /> Audience Insights Intelligence
            </h1>
            <p style={{ fontSize: "0.75rem", color: DS.text.tertiary, marginTop: "0.25rem" }}>Deep psychographic profiling, preference mapping, and audience migration tracking</p>
          </div>
          <DataProvenance provenance={PROV} />
        </div>

        {/* Summary bar */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.75rem", marginBottom: "1.25rem" }}>
          {[
            { label: "Total Audience", value: genome?.totalAudience?.toLocaleString() ?? "—", icon: Users, color: DS.accent },
            { label: "Active Segments", value: genome?.segments?.length ?? "—", icon: BarChart2, color: DS.blue },
            { label: "Fastest Growing", value: genome?.fastestGrowing ?? "—", icon: TrendingUp, color: DS.green },
            { label: "Audience Migrations / Mo", value: migration?.totalMigrations?.toLocaleString() ?? "—", icon: ArrowRight, color: "#9b7fd4" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} style={{ padding: "1rem 1.25rem", background: DS.surface, border: `1px solid ${DS.border}`, borderRadius: "10px", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: `linear-gradient(90deg, ${color}60, transparent)` }} />
              <Icon size={14} style={{ color, marginBottom: "0.5rem" }} />
              <div style={{ fontSize: typeof value === "number" ? "1.75rem" : "0.9375rem", fontWeight: 700, color: DS.text.primary, letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums" }}>{value}</div>
              <div style={{ fontSize: "0.6875rem", color: DS.text.tertiary, marginTop: "0.25rem" }}>{label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "1rem" }}>
          {/* Segment list */}
          <div>
            <div style={{ fontSize: "0.75rem", fontWeight: 600, color: DS.text.tertiary, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.75rem" }}>Audience Segments</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {genome?.segments.map((seg, i) => {
                const color = SEGMENT_COLORS[i % SEGMENT_COLORS.length];
                const isSelected = selected?.id === seg.id;
                return (
                  <button key={seg.id} onClick={() => setSelected(seg)} style={{ padding: "1rem 1.125rem", background: isSelected ? `${color}08` : DS.surface, border: `1px solid ${isSelected ? color + "30" : DS.border}`, borderRadius: "8px", cursor: "pointer", textAlign: "left", transition: "all 0.15s" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.625rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0 }} />
                        <span style={{ fontSize: "0.875rem", fontWeight: 600, color: DS.text.primary }}>{seg.name}</span>
                      </div>
                      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                        <span style={{ fontSize: "0.75rem", color: DS.text.secondary, fontVariantNumeric: "tabular-nums" }}>{seg.size.toLocaleString()}</span>
                        <span style={{ fontSize: "0.625rem", padding: "0.15rem 0.5rem", borderRadius: "4px", background: `${DS.green}14`, color: DS.green, border: `1px solid ${DS.green}20` }}>+{seg.growthRate}%</span>
                      </div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.5rem" }}>
                      {[
                        { label: "Engagement", value: `${seg.engagementScore}/100` },
                        { label: "Conversion", value: `${seg.conversionRate}%` },
                        { label: "Revenue share", value: `${seg.revenueContribution}%` },
                      ].map(({ label, value }) => (
                        <div key={label}>
                          <div style={{ fontSize: "0.6875rem", color: DS.text.muted }}>{label}</div>
                          <div style={{ fontSize: "0.8125rem", fontWeight: 600, color: DS.text.secondary, fontVariantNumeric: "tabular-nums" }}>{value}</div>
                        </div>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Migration flows */}
            {migration && (
              <div style={{ marginTop: "1.25rem" }}>
                <div style={{ fontSize: "0.75rem", fontWeight: 600, color: DS.text.tertiary, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.75rem" }}>Audience Migration Flows</div>
                <div style={{ padding: "0.875rem 1rem", background: DS.surface, border: `1px solid ${DS.border}`, borderRadius: "10px", marginBottom: "0.75rem" }}>
                  <div style={{ fontSize: "0.6875rem", color: DS.text.muted, marginBottom: "0.375rem" }}>Top conversion path</div>
                  <div style={{ fontSize: "0.875rem", fontWeight: 600, color: DS.accent }}>{migration.topPath}</div>
                  <div style={{ fontSize: "0.6875rem", color: DS.text.tertiary, marginTop: "0.25rem" }}>Avg {migration.avgConversionDays} days from first touch to conversion</div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {migration.flows.map((f, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.625rem 0.875rem", background: DS.surface, border: `1px solid ${DS.border}`, borderRadius: "7px" }}>
                      <span style={{ fontSize: "0.75rem", color: DS.text.secondary, minWidth: 100 }}>{f.from}</span>
                      <ArrowRight size={13} style={{ color: DS.text.muted, flexShrink: 0 }} />
                      <span style={{ fontSize: "0.75rem", color: DS.text.secondary, flex: 1 }}>{f.to}</span>
                      <span style={{ fontSize: "0.75rem", fontWeight: 600, color: DS.text.primary, fontVariantNumeric: "tabular-nums" }}>{f.count}</span>
                      <span style={{ fontSize: "0.625rem", color: DS.green, fontVariantNumeric: "tabular-nums" }}>{f.rate}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Segment detail */}
          {selected && (
            <div style={{ padding: "1.25rem", background: DS.surface, border: `1px solid ${DS.border}`, borderRadius: "10px", position: "sticky", top: "1rem", maxHeight: "calc(100vh - 8rem)", overflowY: "auto" }}>
              <div style={{ fontSize: "0.875rem", fontWeight: 700, color: DS.text.primary, marginBottom: "1rem" }}>{selected.name}</div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.625rem", marginBottom: "1.125rem" }}>
                {[
                  { label: "Segment Size", value: selected.size.toLocaleString(), icon: Users },
                  { label: "Growth Rate", value: `+${selected.growthRate}%`, icon: TrendingUp },
                  { label: "Peak Engagement", value: `${selected.peakHour}:00 AM`, icon: Clock },
                  { label: "Revenue Share", value: `${selected.revenueContribution}%`, icon: ArrowUpRight },
                ].map(({ label, value, icon: Icon }) => (
                  <div key={label} style={{ padding: "0.75rem", background: DS.elevated, borderRadius: "7px" }}>
                    <Icon size={12} style={{ color: DS.accent, marginBottom: "0.375rem" }} />
                    <div style={{ fontSize: "0.9375rem", fontWeight: 700, color: DS.text.primary, fontVariantNumeric: "tabular-nums" }}>{value}</div>
                    <div style={{ fontSize: "0.625rem", color: DS.text.muted }}>{label}</div>
                  </div>
                ))}
              </div>

              <div style={{ marginBottom: "1rem" }}>
                <div style={{ fontSize: "0.6875rem", fontWeight: 600, color: DS.text.tertiary, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.5rem" }}>Psychographic Profile</div>
                {Object.entries(selected.psychographics).map(([key, val]) => (
                  <div key={key} style={{ display: "flex", justifyContent: "space-between", padding: "0.375rem 0", borderBottom: `1px solid ${DS.border}` }}>
                    <span style={{ fontSize: "0.6875rem", color: DS.text.tertiary, textTransform: "capitalize" }}>{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                    <span style={{ fontSize: "0.6875rem", color: DS.text.secondary, fontWeight: 500, maxWidth: "55%", textAlign: "right" }}>{String(val)}</span>
                  </div>
                ))}
              </div>

              <div style={{ marginBottom: "1rem" }}>
                <div style={{ fontSize: "0.6875rem", fontWeight: 600, color: DS.text.tertiary, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.5rem" }}>Top Topics</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem" }}>
                  {selected.topTopics.map(t => (
                    <span key={t} style={{ fontSize: "0.6875rem", padding: "0.2rem 0.5rem", borderRadius: "4px", background: `${DS.accent}10`, color: DS.accent, border: `1px solid ${DS.accent}18` }}>{t}</span>
                  ))}
                </div>
              </div>

              <div>
                <div style={{ fontSize: "0.6875rem", fontWeight: 600, color: DS.text.tertiary, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.5rem" }}>Preferred Platforms</div>
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                  {selected.platforms.map(p => (
                    <span key={p} style={{ fontSize: "0.75rem", padding: "0.25rem 0.625rem", borderRadius: "5px", background: `${DS.blue}14`, color: DS.blue, border: `1px solid ${DS.blue}20`, fontWeight: 500 }}>{p}</span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </m.div>
    </DistributionOsLayout>
  );
}
