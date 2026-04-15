import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { m } from "framer-motion";
import { Users, Target, TrendingUp, ArrowRight, Sparkles, DollarSign, BarChart2 } from "lucide-react";
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
    source: "Distribution OS — Audience Segmentation & Personalization",
    lastUpdated: new Date().toISOString(),
    freshness: "minutes",
    confidence: "high",
    dataState: "demo",
  };

const SEGMENT_COLORS = ["#d4a054", "#4a8ab8", "#9b7fd4", "#5a9c5a"];

interface Segment {
  id: number;
  name: string;
  size: number;
  growthRate: number;
  engagementScore: number;
  personalizedContent: string[];
  recommendedSequence: string;
  nextAction: string;
  revenueContribution: number;
}

export default function AudienceSegmentsPage() {
  const [location] = useLocation();
  const [data, setData] = useState<{ segments: Segment[]; totalAudience: number } | null>(null);
  const [selected, setSelected] = useState<Segment | null>(null);

  useEffect(() => {
    fetch(`${API}/api/distribution-os/audience/segments`, { credentials: "include" })
      .then(r => r.json()).then(d => { setData(d); if (d.segments?.length) setSelected(d.segments[0]); })
      .catch(() => {});
  }, []);

  return (
    <DistributionOsLayout currentPath={location}>
      <m.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1.25rem", flexWrap: "wrap", gap: "0.75rem" }}>
          <div>
            <h1 style={{ fontSize: "1.25rem", fontWeight: 700, color: DS.text.primary, letterSpacing: "-0.025em", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Users size={18} style={{ color: DS.accent }} /> Audience Segmentation & Personalization
            </h1>
            <p style={{ fontSize: "0.75rem", color: DS.text.tertiary, marginTop: "0.25rem" }}>Dynamic segments with personalized content recommendations and AI-generated sequences</p>
          </div>
          <DataProvenance provenance={PROV} />
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.75rem", marginBottom: "1.25rem" }}>
          {[
            { label: "Total Audience", value: data?.totalAudience?.toLocaleString() ?? "—", color: DS.accent, icon: Users },
            { label: "Active Segments", value: data?.segments.length ?? "—", color: DS.blue, icon: BarChart2 },
            { label: "Avg Engagement Score", value: data ? `${Math.round(data.segments.reduce((s, seg) => s + seg.engagementScore, 0) / data.segments.length)}/100` : "—", color: DS.green, icon: TrendingUp },
            { label: "AI Sequences Active", value: data?.segments.length ?? "—", color: "#9b7fd4", icon: Sparkles },
          ].map(({ label, value, color, icon: Icon }) => (
            <div key={label} style={{ padding: "1rem 1.25rem", background: DS.surface, border: `1px solid ${DS.border}`, borderRadius: "10px", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: `linear-gradient(90deg, ${color}60, transparent)` }} />
              <Icon size={14} style={{ color, marginBottom: "0.5rem" }} />
              <div style={{ fontSize: "1.375rem", fontWeight: 700, color: DS.text.primary, letterSpacing: "-0.025em", fontVariantNumeric: "tabular-nums" }}>{value}</div>
              <div style={{ fontSize: "0.6875rem", color: DS.text.tertiary, marginTop: "0.25rem" }}>{label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: "1rem" }}>
          {/* Segment cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {data?.segments.map((seg, i) => {
              const color = SEGMENT_COLORS[i % SEGMENT_COLORS.length];
              const isSelected = selected?.id === seg.id;
              return (
                <button key={seg.id} onClick={() => setSelected(seg)} style={{ padding: "1.125rem 1.25rem", background: isSelected ? `${color}08` : DS.surface, border: `1px solid ${isSelected ? color + "30" : DS.border}`, borderRadius: "10px", cursor: "pointer", textAlign: "left", transition: "all 0.15s" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.875rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                      <div style={{ width: 10, height: 10, borderRadius: "50%", background: color }} />
                      <span style={{ fontSize: "0.9375rem", fontWeight: 700, color: DS.text.primary }}>{seg.name}</span>
                    </div>
                    <span style={{ fontSize: "0.6875rem", padding: "0.2rem 0.625rem", borderRadius: "5px", background: `${DS.green}10`, color: DS.green, fontWeight: 600 }}>+{seg.growthRate}% growth</span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.5rem", marginBottom: "0.875rem" }}>
                    {[
                      { label: "Audience Size", value: seg.size.toLocaleString(), icon: Users },
                      { label: "Engagement", value: `${seg.engagementScore}/100`, icon: TrendingUp },
                      { label: "Revenue Share", value: `${seg.revenueContribution}%`, icon: DollarSign },
                    ].map(({ label, value, icon: Icon }) => (
                      <div key={label} style={{ padding: "0.625rem", background: DS.elevated, borderRadius: "7px" }}>
                        <Icon size={11} style={{ color, marginBottom: "0.25rem" }} />
                        <div style={{ fontSize: "0.875rem", fontWeight: 700, color: DS.text.primary, fontVariantNumeric: "tabular-nums" }}>{value}</div>
                        <div style={{ fontSize: "0.625rem", color: DS.text.muted }}>{label}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ padding: "0.625rem 0.75rem", background: `${color}08`, border: `1px solid ${color}18`, borderRadius: "7px" }}>
                    <div style={{ fontSize: "0.6875rem", fontWeight: 600, color, marginBottom: "0.25rem" }}>Recommended Sequence</div>
                    <div style={{ fontSize: "0.75rem", color: DS.text.secondary }}>{seg.recommendedSequence}</div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Detail */}
          {selected && (() => {
            const color = SEGMENT_COLORS[data?.segments.findIndex(s => s.id === selected.id) ?? 0 % SEGMENT_COLORS.length];
            return (
              <div style={{ padding: "1.25rem", background: DS.surface, border: `1px solid ${DS.border}`, borderRadius: "10px", position: "sticky", top: "1rem", maxHeight: "calc(100vh - 8rem)", overflowY: "auto" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: color }} />
                  <span style={{ fontSize: "0.875rem", fontWeight: 700, color: DS.text.primary }}>{selected.name}</span>
                </div>

                {/* Next action */}
                <div style={{ padding: "0.875rem", background: `${DS.accent}08`, border: `1px solid ${DS.accent}20`, borderRadius: "8px", marginBottom: "1.125rem" }}>
                  <div style={{ fontSize: "0.625rem", fontWeight: 600, color: DS.accent, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.375rem", display: "flex", alignItems: "center", gap: "0.375rem" }}>
                    <Target size={11} /> Next Best Action
                  </div>
                  <p style={{ fontSize: "0.75rem", color: DS.text.secondary, margin: 0, lineHeight: 1.5 }}>{selected.nextAction}</p>
                </div>

                {/* Personalized content */}
                <div style={{ marginBottom: "1.125rem" }}>
                  <div style={{ fontSize: "0.6875rem", fontWeight: 600, color: DS.text.tertiary, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.625rem", display: "flex", alignItems: "center", gap: "0.375rem" }}>
                    <Sparkles size={11} style={{ color: DS.accent }} /> Personalized Content Tracks
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                    {selected.personalizedContent.map((c, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 0.75rem", background: DS.elevated, borderRadius: "6px" }}>
                        <div style={{ width: 5, height: 5, borderRadius: "50%", background: color, flexShrink: 0 }} />
                        <span style={{ fontSize: "0.75rem", color: DS.text.secondary }}>{c}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Sequence flow */}
                <div>
                  <div style={{ fontSize: "0.6875rem", fontWeight: 600, color: DS.text.tertiary, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.625rem" }}>Nurture Sequence</div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", flexWrap: "wrap" }}>
                    {selected.recommendedSequence.split(" → ").map((step, i, arr) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
                        <span style={{ fontSize: "0.6875rem", padding: "0.25rem 0.625rem", borderRadius: "5px", background: `${color}12`, color, border: `1px solid ${color}20`, fontWeight: 500 }}>{step}</span>
                        {i < arr.length - 1 && <ArrowRight size={11} style={{ color: DS.text.muted }} />}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </m.div>
    </DistributionOsLayout>
  );
}
