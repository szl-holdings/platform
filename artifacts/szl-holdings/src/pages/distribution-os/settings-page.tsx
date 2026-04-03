import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { m } from "framer-motion";
import { Settings, Globe, Twitter, BookOpen, Newspaper, CheckCircle, AlertCircle, RefreshCw } from "lucide-react";
import { DistributionOsLayout } from "./admin-dashboard";

const API = import.meta.env.VITE_API_URL || "";

interface Integration { id: number; provider: string; authMode: string; status: string; lastSuccess: string | null; lastError: string | null; }
interface SiteSetting { id: number; key: string; value: string | null; category: string; label: string | null; }

export default function SettingsPage() {
  const [location] = useLocation();
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [settings, setSettings] = useState<SiteSetting[]>([]);

  useEffect(() => {
    fetch(`${API}/api/distribution-os/integrations`).then(r => r.json()).then(setIntegrations).catch(() => {});
    fetch(`${API}/api/distribution-os/settings`).then(r => r.json()).then(setSettings).catch(() => {});
  }, []);

  const PROVIDER_ICONS: Record<string, typeof Globe> = { x: Twitter, substack: BookOpen, medium: Newspaper, site: Globe };

  return (
    <DistributionOsLayout currentPath={location}>
      <m.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div style={{ marginBottom: "2rem" }}>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#e8e4de" }}>Settings</h1>
          <p style={{ fontSize: "0.8125rem", color: "#6b6560", marginTop: "0.25rem" }}>Platform integrations and site configuration</p>
        </div>

        <div style={{ marginBottom: "2.5rem" }}>
          <h2 style={{ fontSize: "0.75rem", fontWeight: 600, color: "#6b6560", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "1rem" }}>Integrations</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "1rem" }}>
            {[
              { provider: "x", name: "X (Twitter)", desc: "Auto-post queued content", authMode: "oauth2" },
              { provider: "substack", name: "Substack", desc: "Publish newsletters", authMode: "api-key" },
              { provider: "medium", name: "Medium", desc: "Cross-post articles", authMode: "api-key" },
              { provider: "linkedin", name: "LinkedIn", desc: "Share content updates", authMode: "oauth2" },
            ].map(p => {
              const integration = integrations.find(i => i.provider === p.provider);
              const connected = integration?.status === "connected";
              const Icon = PROVIDER_ICONS[p.provider] || Globe;
              return (
                <div key={p.provider} style={{ padding: "1.25rem", background: "hsla(0,0%,100%,0.03)", border: `1px solid ${connected ? "hsla(120,30%,40%,0.2)" : "hsla(0,0%,100%,0.06)"}`, borderRadius: "10px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "0.75rem" }}>
                    <Icon size={18} style={{ color: connected ? "#5a9c5a" : "#6b6560" }} />
                    <h3 style={{ fontSize: "0.9375rem", fontWeight: 600, color: "#e8e4de" }}>{p.name}</h3>
                    {connected ? <CheckCircle size={14} style={{ color: "#5a9c5a", marginLeft: "auto" }} /> : <AlertCircle size={14} style={{ color: "#4a4540", marginLeft: "auto" }} />}
                  </div>
                  <p style={{ fontSize: "0.75rem", color: "#6b6560", marginBottom: "0.75rem" }}>{p.desc}</p>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button style={{ padding: "0.375rem 0.75rem", background: connected ? "hsla(0,0%,100%,0.06)" : "hsla(40,60%,50%,0.12)", color: connected ? "#8b8579" : "#d4a054", border: "1px solid hsla(0,0%,100%,0.08)", borderRadius: "6px", fontSize: "0.6875rem", fontWeight: 600, cursor: "pointer" }}>
                      {connected ? "Disconnect" : "Connect"}
                    </button>
                    {integration?.lastError && <button style={{ display: "flex", alignItems: "center", gap: "0.25rem", padding: "0.375rem 0.75rem", background: "none", color: "#c45a4a", border: "1px solid hsla(0,0%,100%,0.08)", borderRadius: "6px", fontSize: "0.6875rem", cursor: "pointer" }}><RefreshCw size={10} /> Retry</button>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <h2 style={{ fontSize: "0.75rem", fontWeight: 600, color: "#6b6560", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "1rem" }}>Site Settings</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {settings.length > 0 ? settings.map(s => (
              <div key={s.id} style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "0.75rem 1rem", background: "hsla(0,0%,100%,0.02)", border: "1px solid hsla(0,0%,100%,0.05)", borderRadius: "6px" }}>
                <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "#e8e4de", minWidth: "200px" }}>{s.label || s.key}</span>
                <span style={{ fontSize: "0.8125rem", color: "#8b8579", flex: 1 }}>{s.value || "—"}</span>
                <span style={{ fontSize: "0.6875rem", color: "#4a4540", textTransform: "uppercase" }}>{s.category}</span>
              </div>
            )) : (
              <div style={{ textAlign: "center", padding: "2rem", color: "#4a4540" }}>
                <p style={{ fontSize: "0.8125rem" }}>No settings configured yet. Settings will appear here as they are added.</p>
              </div>
            )}
          </div>
        </div>
      </m.div>
    </DistributionOsLayout>
  );
}
