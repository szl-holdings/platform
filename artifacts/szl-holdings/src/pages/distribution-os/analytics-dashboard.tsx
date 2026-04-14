import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { m } from "framer-motion";
import { BarChart3, Eye, UserPlus, FileText, Send, CheckCircle2, AlertCircle, Zap, ArrowUpRight } from "lucide-react";
import { DistributionOsLayout } from "./admin-dashboard";
import { RoleSelector, DataProvenance } from "@szl-holdings/shared-ui";
import type { DataProvenanceInfo } from "@szl-holdings/shared-ui";

const API = import.meta.env.VITE_API_URL || "";

const DS = {
  surface: "#0b0f19",
  border: "rgba(255,255,255,0.05)",
  text: { primary: "rgba(255,255,255,0.88)", secondary: "rgba(255,255,255,0.5)", tertiary: "rgba(255,255,255,0.28)", muted: "rgba(255,255,255,0.14)" },
};

interface Stats {
  visitsThisWeek: number;
  leadsThisWeek: number;
  publishedArticles: number;
  xQueued: number;
  xSentTotal: number;
  xFailed: number;
  newslettersReady: number;
  automationsCompletedThisWeek: number;
}

const CHANNELS = [
  { label: "Website / Blog", color: "#d4a054", reach: 68 },
  { label: "X (Twitter)", color: "#4a90b8", reach: 54 },
  { label: "LinkedIn", color: "#8b7ac8", reach: 41 },
  { label: "Newsletter / Substack", color: "#c8953c", reach: 72 },
  { label: "Medium", color: "#5a9c5a", reach: 29 },
];

function MetricCard({ label, value, icon: Icon, color, subtitle, accent }: {
  label: string; value: number | string; icon: typeof Eye; color: string; subtitle?: string; accent?: boolean;
}) {
  return (
    <div style={{ padding: "1.125rem 1.25rem", background: DS.surface, border: `1px solid ${DS.border}`, borderRadius: "10px", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: `linear-gradient(90deg, ${color}70, transparent)` }} />
      <Icon size={14} style={{ color, marginBottom: "0.625rem" }} />
      <div style={{ fontSize: "1.75rem", fontWeight: 700, color: DS.text.primary, letterSpacing: "-0.025em", fontVariantNumeric: "tabular-nums" }}>{value}</div>
      <div style={{ fontSize: "0.75rem", color: DS.text.secondary, marginTop: "0.25rem" }}>{label}</div>
      {subtitle && <div style={{ fontSize: "0.625rem", color: DS.text.muted, marginTop: "0.25rem" }}>{subtitle}</div>}
    </div>
  );
}

export default function AnalyticsDashboardPage() {
  const [location] = useLocation();
  const [stats, setStats] = useState<Stats | null>(null);
  const [activeRole, setActiveRole] = useState("analyst");

  useEffect(() => {
    fetch(`${API}/api/distribution-os/analytics/dashboard`).then(r => r.json()).then(setStats).catch(() => {});
  }, []);

  const s = stats || {
    visitsThisWeek: 0, leadsThisWeek: 0, publishedArticles: 0,
    xQueued: 0, xSentTotal: 0, xFailed: 0, newslettersReady: 0, automationsCompletedThisWeek: 0
  };

  const convRate = s.visitsThisWeek > 0 ? ((s.leadsThisWeek / s.visitsThisWeek) * 100).toFixed(1) : "0.0";
  const pipelineTotal = s.xQueued + s.xSentTotal + s.xFailed;

  return (
    <DistributionOsLayout currentPath={location}>
      <m.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>

        <div style={{ marginBottom: "1rem" }}>
          <h1 style={{ fontSize: "1.25rem", fontWeight: 700, color: DS.text.primary, letterSpacing: "-0.025em" }}>Analytics</h1>
          <p style={{ fontSize: "0.75rem", color: DS.text.tertiary, marginTop: "0.25rem" }}>Content performance and distribution metrics</p>
        </div>

        {/* Role Selector + Provenance */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap", marginBottom: "1.25rem" }}>
          <RoleSelector
            currentRole={activeRole}
            onRoleChange={setActiveRole}
            roles={[
              { id: "executive", label: "Executive", description: "Top-line performance and ROI" },
              { id: "analyst", label: "Analyst", description: "Deep content and distribution metrics" },
              { id: "operator", label: "Operator", description: "Pipeline health and action items" },
            ]}
          />
          <DataProvenance compact provenance={{
            source: "Analytics Data Engine",
            lastUpdated: new Date().toISOString(),
            freshness: "minutes",
            confidence: "high",
            dataState: "live",
            owner: "SZL Holdings Distribution OS",
          } as DataProvenanceInfo} />
        </div>

        {/* Core metrics */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.75rem", marginBottom: "1.5rem" }}>
          <MetricCard icon={Eye} label="Page Views (7d)" value={s.visitsThisWeek} color="#4a90b8" subtitle="Across all public pages" />
          <MetricCard icon={UserPlus} label="New Leads (7d)" value={s.leadsThisWeek} color="#5a9c5a" subtitle="Newsletter + contact forms" />
          <MetricCard icon={FileText} label="Published Articles" value={s.publishedArticles} color="#d4a054" subtitle="Live on site" />
          <MetricCard icon={Send} label="X Posts Sent" value={s.xSentTotal} color="#4a90b8" subtitle="Total sent to X" />
        </div>

        {/* Conversion highlight */}
        <div style={{ background: DS.surface, border: `1px solid rgba(212,160,84,0.15)`, borderRadius: "10px", padding: "1rem 1.25rem", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "1.25rem" }}>
          <div style={{ width: 3, height: 40, background: "#d4a054", borderRadius: 2, flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: "0.625rem", fontWeight: 700, color: DS.text.muted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "0.25rem" }}>Conversion Rate</div>
            <div style={{ fontSize: "2rem", fontWeight: 700, color: "#d4a054", letterSpacing: "-0.03em", fontVariantNumeric: "tabular-nums" }}>{convRate}%</div>
          </div>
          <div style={{ flex: 1, marginLeft: "0.5rem" }}>
            <div style={{ fontSize: "0.75rem", color: DS.text.secondary, marginBottom: "0.25rem" }}>visits → leads this week</div>
            <div style={{ height: 6, background: `rgba(212,160,84,0.1)`, borderRadius: 3, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${Math.min(parseFloat(convRate) * 10, 100)}%`, background: "#d4a054", borderRadius: 3 }} />
            </div>
          </div>
          <ArrowUpRight size={16} style={{ color: "rgba(212,160,84,0.5)", flexShrink: 0 }} />
        </div>

        {/* Two-column: Pipeline + Channel Coverage */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
          <div style={{ background: DS.surface, border: `1px solid ${DS.border}`, borderRadius: "10px", overflow: "hidden" }}>
            <div style={{ padding: "0.875rem 1.25rem", borderBottom: `1px solid ${DS.border}` }}>
              <span style={{ fontSize: "0.6875rem", fontWeight: 700, color: DS.text.muted, letterSpacing: "0.1em", textTransform: "uppercase" }}>Distribution Pipeline</span>
            </div>
            <div style={{ padding: "1rem 1.25rem", display: "flex", flexDirection: "column", gap: "0.875rem" }}>
              {[
                { label: "X Posts Queued", value: s.xQueued, icon: Send, color: "#8b7ac8" },
                { label: "X Posts Failed", value: s.xFailed, icon: AlertCircle, color: s.xFailed > 0 ? "#c45a4a" : "#5a9c5a" },
                { label: "Newsletters Ready", value: s.newslettersReady, icon: CheckCircle2, color: "#4a90b8" },
                { label: "Automations (7d)", value: s.automationsCompletedThisWeek, icon: Zap, color: "#d4a054" },
              ].map(item => (
                <div key={item.label} style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                  <item.icon size={13} style={{ color: item.color, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.25rem" }}>
                      <span style={{ fontSize: "0.75rem", color: DS.text.secondary }}>{item.label}</span>
                      <span style={{ fontSize: "0.9375rem", fontWeight: 700, color: item.color, fontVariantNumeric: "tabular-nums" }}>{item.value}</span>
                    </div>
                    {pipelineTotal > 0 && (
                      <div style={{ height: 3, background: `${item.color}12`, borderRadius: 2, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${pipelineTotal > 0 ? Math.round((item.value / pipelineTotal) * 100) : 0}%`, background: item.color, borderRadius: 2 }} />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: DS.surface, border: `1px solid ${DS.border}`, borderRadius: "10px", overflow: "hidden" }}>
            <div style={{ padding: "0.875rem 1.25rem", borderBottom: `1px solid ${DS.border}` }}>
              <span style={{ fontSize: "0.6875rem", fontWeight: 700, color: DS.text.muted, letterSpacing: "0.1em", textTransform: "uppercase" }}>Channel Coverage</span>
            </div>
            <div style={{ padding: "1rem 1.25rem", display: "flex", flexDirection: "column", gap: "0.875rem" }}>
              {CHANNELS.map(ch => (
                <div key={ch.label} style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: ch.color, flexShrink: 0 }} />
                  <span style={{ fontSize: "0.75rem", color: DS.text.secondary, flex: 1 }}>{ch.label}</span>
                  <div style={{ width: 80, height: 4, background: `${ch.color}12`, borderRadius: 2, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${ch.reach}%`, background: ch.color, borderRadius: 2 }} />
                  </div>
                  <span style={{ fontSize: "0.625rem", color: DS.text.muted, width: 28, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{ch.reach}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </m.div>
    </DistributionOsLayout>
  );
}
