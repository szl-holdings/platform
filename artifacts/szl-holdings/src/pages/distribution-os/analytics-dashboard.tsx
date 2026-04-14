import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { m } from "framer-motion";
import { BarChart3, Eye, UserPlus, FileText, Send, TrendingUp } from "lucide-react";
import { DistributionOsLayout } from "./admin-dashboard";

const API = import.meta.env.VITE_API_URL || "";

interface Stats { visitsThisWeek: number; leadsThisWeek: number; publishedArticles: number; xQueued: number; xSentTotal: number; xFailed: number; newslettersReady: number; automationsCompletedThisWeek: number; }

function MetricCard({ label, value, icon: Icon, color, subtitle }: { label: string; value: number; icon: typeof Eye; color: string; subtitle?: string }) {
  return (
    <div style={{ padding: "1.5rem", background: "hsla(0,0%,100%,0.03)", border: "1px solid hsla(0,0%,100%,0.06)", borderRadius: "10px" }}>
      <Icon size={20} style={{ color, marginBottom: "0.75rem" }} />
      <div style={{ fontSize: "2rem", fontWeight: 700, color: "#e8e4de", letterSpacing: "-0.02em" }}>{value}</div>
      <div style={{ fontSize: "0.8125rem", color: "#8b8579", marginTop: "0.25rem" }}>{label}</div>
      {subtitle && <div style={{ fontSize: "0.6875rem", color: "#4a4540", marginTop: "0.25rem" }}>{subtitle}</div>}
    </div>
  );
}

export default function AnalyticsDashboardPage() {
  const [location] = useLocation();
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => { fetch(`${API}/api/distribution-os/analytics/dashboard`).then(r => r.json()).then(setStats).catch(() => {}); }, []);

  const s = stats || { visitsThisWeek: 0, leadsThisWeek: 0, publishedArticles: 0, xQueued: 0, xSentTotal: 0, xFailed: 0, newslettersReady: 0, automationsCompletedThisWeek: 0 };

  return (
    <DistributionOsLayout currentPath={location}>
      <m.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div style={{ marginBottom: "2rem" }}>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#e8e4de" }}>Analytics</h1>
          <p style={{ fontSize: "0.8125rem", color: "#6b6560", marginTop: "0.25rem" }}>Content performance and distribution metrics</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
          <MetricCard icon={Eye} label="Page Views (7d)" value={s.visitsThisWeek} color="#4a90b8" subtitle="Across all public pages" />
          <MetricCard icon={UserPlus} label="New Leads (7d)" value={s.leadsThisWeek} color="#5a9c5a" subtitle="Newsletter + contact forms" />
          <MetricCard icon={FileText} label="Published Articles" value={s.publishedArticles} color="#d4a054" subtitle="Live on site" />
          <MetricCard icon={Send} label="X Posts Sent" value={s.xSentTotal} color="#4a90b8" subtitle="Total sent to X" />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
          <div style={{ padding: "1.5rem", background: "hsla(0,0%,100%,0.02)", border: "1px solid hsla(0,0%,100%,0.05)", borderRadius: "10px" }}>
            <h3 style={{ fontSize: "0.875rem", fontWeight: 600, color: "#e8e4de", marginBottom: "1rem" }}>Distribution Pipeline</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.8125rem", color: "#8b8579" }}>X Posts Queued</span>
                <span style={{ fontSize: "1rem", fontWeight: 700, color: "#d4a054" }}>{s.xQueued}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.8125rem", color: "#8b8579" }}>X Posts Failed</span>
                <span style={{ fontSize: "1rem", fontWeight: 700, color: s.xFailed > 0 ? "#c45a4a" : "#5a9c5a" }}>{s.xFailed}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.8125rem", color: "#8b8579" }}>Newsletters Ready</span>
                <span style={{ fontSize: "1rem", fontWeight: 700, color: "#4a90b8" }}>{s.newslettersReady}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.8125rem", color: "#8b8579" }}>Automations (7d)</span>
                <span style={{ fontSize: "1rem", fontWeight: 700, color: "#8b7ac8" }}>{s.automationsCompletedThisWeek}</span>
              </div>
            </div>
          </div>

          <div style={{ padding: "1.5rem", background: "hsla(0,0%,100%,0.02)", border: "1px solid hsla(0,0%,100%,0.05)", borderRadius: "10px" }}>
            <h3 style={{ fontSize: "0.875rem", fontWeight: 600, color: "#e8e4de", marginBottom: "1rem" }}>Channel Coverage</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {[{ label: "Website / Blog", color: "#d4a054" }, { label: "X (Twitter)", color: "#4a90b8" }, { label: "LinkedIn", color: "#8b7ac8" }, { label: "Newsletter / Substack", color: "#c8953c" }, { label: "Medium", color: "#5a9c5a" }].map(ch => (
                <div key={ch.label} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: ch.color }} />
                  <span style={{ fontSize: "0.8125rem", color: "#8b8579" }}>{ch.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </m.div>
    </DistributionOsLayout>
  );
}
