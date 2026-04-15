import React, { useState } from "react";
import { TenantBrandProvider, useTenantBrand } from "@szl-holdings/shared-ui";
import { EcosystemNav } from "@szl-holdings/shared-ui/ecosystem-nav";
import { Settings, Users, Eye, Plus, Save, Globe, Palette, Lock } from "lucide-react";
import { LANE_ACCENT_HEX } from "@szl-holdings/shared-ui/lane-colors";

const ACCENT = LANE_ACCENT_HEX.carlotaJo.primary;

interface ClientPortalConfig {
  id: string;
  clientName: string;
  slug: string;
  primaryColor: string;
  accentColor: string;
  logoUrl?: string;
  logoText: string;
  engagements: string[];
  status: "active" | "draft" | "suspended";
  createdAt: string;
  lastAccessed?: string;
  userCount: number;
}

const DEMO_PORTALS: ClientPortalConfig[] = [
  {
    id: "cp-001",
    clientName: "Meridian Capital Partners",
    slug: "meridian",
    primaryColor: "#0f172a",
    accentColor: "#3b82f6",
    logoText: "Meridian CP",
    engagements: ["Market Entry Strategy", "LP Reporting Enhancement", "Fund Positioning"],
    status: "active",
    createdAt: "2024-09-15",
    lastAccessed: "2 hours ago",
    userCount: 4,
  },
  {
    id: "cp-002",
    clientName: "Apex Holdings Group",
    slug: "apex",
    primaryColor: "#1a0a00",
    accentColor: "#f97316",
    logoText: "Apex Holdings",
    engagements: ["Operational Efficiency", "Digital Transformation"],
    status: "active",
    createdAt: "2024-11-02",
    lastAccessed: "Yesterday",
    userCount: 2,
  },
  {
    id: "cp-003",
    clientName: "Northlight Ventures",
    slug: "northlight",
    primaryColor: "#0d1117",
    accentColor: "#22c55e",
    logoText: "Northlight",
    engagements: ["Portfolio Company Support", "ESG Strategy"],
    status: "draft",
    createdAt: "2025-01-20",
    userCount: 0,
  },
];

function StatusBadge({ status }: { status: ClientPortalConfig["status"] }) {
  const colors = { active: { bg: "#22c55e20", border: "#22c55e40", text: "#22c55e" }, draft: { bg: "#f59e0b20", border: "#f59e0b40", text: "#f59e0b" }, suspended: { bg: "#ef444420", border: "#ef444440", text: "#ef4444" } };
  const c = colors[status];
  return (
    <span style={{ fontSize: "10px", fontWeight: 700, color: c.text, background: c.bg, border: `1px solid ${c.border}`, borderRadius: "5px", padding: "2px 8px", textTransform: "capitalize" }}>
      {status}
    </span>
  );
}

function PortalCard({ config, onEdit }: { config: ClientPortalConfig; onEdit: () => void }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "14px", overflow: "hidden", fontFamily: "system-ui, sans-serif" }}>
      {/* Branded header strip */}
      <div style={{ height: "6px", background: `linear-gradient(90deg, ${config.accentColor}, ${config.accentColor}80)` }} />
      <div style={{ padding: "16px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "10px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{
              width: "36px", height: "36px", borderRadius: "8px",
              background: config.primaryColor || "rgba(255,255,255,0.05)",
              border: `2px solid ${config.accentColor}60`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "10px", fontWeight: 800, color: config.accentColor, flexShrink: 0,
            }}>
              {config.logoText.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: "13px", fontWeight: 700, color: "rgba(255,255,255,0.9)" }}>{config.clientName}</div>
              <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.35)", marginTop: "1px" }}>/{config.slug}</div>
            </div>
          </div>
          <StatusBadge status={config.status} />
        </div>

        <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
          <div style={{ flex: 1, background: "rgba(255,255,255,0.04)", borderRadius: "8px", padding: "8px 10px" }}>
            <div style={{ fontSize: "16px", fontWeight: 800, color: "rgba(255,255,255,0.85)" }}>{config.userCount}</div>
            <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.35)" }}>users</div>
          </div>
          <div style={{ flex: 1, background: "rgba(255,255,255,0.04)", borderRadius: "8px", padding: "8px 10px" }}>
            <div style={{ fontSize: "16px", fontWeight: 800, color: "rgba(255,255,255,0.85)" }}>{config.engagements.length}</div>
            <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.35)" }}>engagements</div>
          </div>
        </div>

        <div style={{ marginBottom: "12px" }}>
          <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.3)", marginBottom: "5px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Active Engagements</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
            {config.engagements.map((e) => (
              <div key={e} style={{ fontSize: "11px", color: "rgba(255,255,255,0.55)", display: "flex", alignItems: "center", gap: "5px" }}>
                <div style={{ width: "4px", height: "4px", borderRadius: "50%", background: config.accentColor, flexShrink: 0 }} />
                {e}
              </div>
            ))}
          </div>
        </div>

        {config.lastAccessed && (
          <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.25)", marginBottom: "12px" }}>Last accessed: {config.lastAccessed}</div>
        )}

        <div style={{ display: "flex", gap: "6px" }}>
          <button
            onClick={onEdit}
            style={{
              flex: 1, padding: "8px", borderRadius: "8px",
              border: `1px solid ${config.accentColor}40`, background: `${config.accentColor}12`,
              color: config.accentColor, fontSize: "11px", fontWeight: 600, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "4px",
              fontFamily: "system-ui, sans-serif",
            }}
          >
            <Settings size={11} /> Configure
          </button>
          {config.status === "active" && (
            <button
              onClick={() => window.open(`/carlota-jo/client-portal`, "_blank")}
              style={{
                padding: "8px 12px", borderRadius: "8px",
                border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)",
                color: "rgba(255,255,255,0.5)", fontSize: "11px", cursor: "pointer",
                display: "flex", alignItems: "center", gap: "4px",
                fontFamily: "system-ui, sans-serif",
              }}
            >
              <Eye size={11} /> Preview
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function PortalConfigEditor({ config, onClose, onSave }: { config: Partial<ClientPortalConfig>; onClose: () => void; onSave: (c: ClientPortalConfig) => void }) {
  const [form, setForm] = useState<Partial<ClientPortalConfig>>(config);

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ width: "560px", maxWidth: "calc(100vw - 32px)", background: "rgba(8,10,18,0.98)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "18px", overflow: "hidden" }}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: "15px", fontWeight: 700, color: "rgba(255,255,255,0.9)" }}>
              {form.id ? "Edit Portal" : "Create White-Label Portal"}
            </div>
            <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", marginTop: "2px" }}>
              Custom branding · Isolated data views · Per-client access control
            </div>
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "6px 10px", color: "rgba(255,255,255,0.5)", cursor: "pointer", fontSize: "12px", fontFamily: "system-ui, sans-serif" }}>Close</button>
        </div>

        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: "16px", maxHeight: "60vh", overflowY: "auto" }}>
          {[
            { label: "Client Name", key: "clientName", placeholder: "e.g. Meridian Capital Partners" },
            { label: "Portal Slug", key: "slug", placeholder: "e.g. meridian (used in URL)" },
            { label: "Logo Text", key: "logoText", placeholder: "e.g. MCP (short brand name)" },
          ].map((f) => (
            <div key={f.key}>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "rgba(255,255,255,0.5)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{f.label}</label>
              <input
                value={(form as Record<string, string>)[f.key] ?? ""}
                onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
                placeholder={f.placeholder}
                style={{ width: "100%", padding: "9px 12px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "rgba(255,255,255,0.8)", fontSize: "13px", outline: "none", fontFamily: "system-ui, sans-serif", boxSizing: "border-box" }}
              />
            </div>
          ))}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            {[
              { label: "Primary Background", key: "primaryColor" },
              { label: "Accent Color", key: "accentColor" },
            ].map((f) => (
              <div key={f.key}>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "rgba(255,255,255,0.5)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{f.label}</label>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <input
                    type="color"
                    value={(form as Record<string, string>)[f.key] ?? "#000000"}
                    onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
                    style={{ width: "36px", height: "36px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.1)", cursor: "pointer", background: "none", padding: "0" }}
                  />
                  <input
                    value={(form as Record<string, string>)[f.key] ?? ""}
                    onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
                    placeholder="#000000"
                    style={{ flex: 1, padding: "9px 12px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "rgba(255,255,255,0.8)", fontSize: "12px", outline: "none", fontFamily: "monospace" }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Preview */}
          {(form.clientName || form.accentColor) && (
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "10px", overflow: "hidden" }}>
              <div style={{ height: "5px", background: form.accentColor ?? ACCENT }} />
              <div style={{ padding: "12px", display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ width: "32px", height: "32px", borderRadius: "7px", background: form.primaryColor ?? "rgba(255,255,255,0.05)", border: `2px solid ${form.accentColor ?? ACCENT}60`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 800, color: form.accentColor ?? ACCENT }}>
                  {(form.logoText ?? "CL").slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: "12px", fontWeight: 700, color: "rgba(255,255,255,0.85)" }}>{form.clientName ?? "Client Name"}</div>
                  <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.35)" }}>White-Label Portal Preview</div>
                </div>
                <span style={{ marginLeft: "auto", fontSize: "10px", color: form.accentColor ?? ACCENT, background: `${form.accentColor ?? ACCENT}15`, border: `1px solid ${form.accentColor ?? ACCENT}30`, borderRadius: "4px", padding: "2px 6px", fontWeight: 700 }}>Preview</span>
              </div>
            </div>
          )}
        </div>

        <div style={{ padding: "16px 24px", borderTop: "1px solid rgba(255,255,255,0.07)", display: "flex", gap: "8px", justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ padding: "9px 16px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "rgba(255,255,255,0.5)", fontSize: "12px", cursor: "pointer", fontFamily: "system-ui, sans-serif" }}>Cancel</button>
          <button
            onClick={() => {
              onSave({
                id: form.id ?? `cp-${Date.now()}`,
                clientName: form.clientName ?? "New Client",
                slug: form.slug ?? "new-client",
                primaryColor: form.primaryColor ?? "#0f172a",
                accentColor: form.accentColor ?? ACCENT,
                logoText: form.logoText ?? "CL",
                engagements: form.engagements ?? [],
                status: "draft",
                createdAt: new Date().toISOString().split("T")[0] ?? new Date().toDateString(),
                userCount: 0,
              });
            }}
            style={{ padding: "9px 18px", borderRadius: "8px", border: "none", background: ACCENT, color: "#fff", fontSize: "12px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", fontFamily: "system-ui, sans-serif" }}
          >
            <Save size={12} />
            {form.id ? "Save Changes" : "Create Portal"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PortalAdminPage() {
  const [portals, setPortals] = useState<ClientPortalConfig[]>(DEMO_PORTALS);
  const [editing, setEditing] = useState<Partial<ClientPortalConfig> | null>(null);

  React.useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/partner/portals", { credentials: "include" });
        if (res.ok) {
          const json = await res.json() as { data?: ClientPortalConfig[] };
          if (Array.isArray(json.data) && json.data.length > 0) {
            setPortals(json.data);
          }
        }
      } catch {
      }
    }
    void load();
  }, []);

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--color-bg-primary, #080a12)", color: "var(--color-fg-primary, rgba(255,255,255,0.9))", fontFamily: "system-ui, sans-serif" }}>
      <EcosystemNav currentAppId="carlota-jo" currentAppName="Carlota Jo" accentColor={ACCENT} />

      <main style={{ maxWidth: "1200px", margin: "0 auto", padding: "32px 24px" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "28px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
              <Globe size={18} style={{ color: ACCENT }} />
              <h1 style={{ fontSize: "20px", fontWeight: 700, margin: 0 }}>White-Label Client Portals</h1>
            </div>
            <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", margin: 0 }}>
              Branded, isolated portals for each advisory client · Custom colors, logos, and data views
            </p>
          </div>
          <button
            onClick={() => setEditing({})}
            style={{
              display: "flex", alignItems: "center", gap: "7px",
              padding: "10px 16px", borderRadius: "10px", border: "none",
              background: ACCENT, color: "#fff", fontSize: "13px", fontWeight: 700,
              cursor: "pointer", fontFamily: "system-ui, sans-serif",
            }}
          >
            <Plus size={14} />
            New Portal
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "24px" }}>
          {[
            { label: "Total Portals", value: portals.length.toString(), color: ACCENT },
            { label: "Active", value: portals.filter((p) => p.status === "active").length.toString(), color: "#22c55e" },
            { label: "Total Users", value: portals.reduce((s, p) => s + p.userCount, 0).toString(), color: "#0ea5e9" },
            { label: "Engagements", value: portals.reduce((s, p) => s + p.engagements.length, 0).toString(), color: "#a855f7" },
          ].map((stat) => (
            <div key={stat.label} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "10px", padding: "12px 14px" }}>
              <div style={{ fontSize: "20px", fontWeight: 800, color: stat.color }}>{stat.value}</div>
              <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.35)", marginTop: "2px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* How it works */}
        <div style={{ background: `${ACCENT}08`, border: `1px solid ${ACCENT}20`, borderRadius: "12px", padding: "14px 18px", marginBottom: "20px", display: "flex", alignItems: "flex-start", gap: "10px" }}>
          <Lock size={14} style={{ color: ACCENT, flexShrink: 0, marginTop: "1px" }} />
          <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.55)", lineHeight: 1.6 }}>
            <strong style={{ color: ACCENT }}>Multi-tenant isolation guaranteed.</strong>{" "}
            Each portal shows only engagements, documents, and advisory deliverables for that specific client.
            Custom branding (logo, colors) is applied per portal. Inspired by the GP/LP portal model.
          </div>
        </div>

        {/* Portal cards grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
          {portals.map((portal) => (
            <PortalCard
              key={portal.id}
              config={portal}
              onEdit={() => setEditing(portal)}
            />
          ))}
          {/* Add new card */}
          <button
            onClick={() => setEditing({})}
            style={{
              background: "rgba(255,255,255,0.02)", border: "2px dashed rgba(255,255,255,0.08)",
              borderRadius: "14px", padding: "32px 16px", cursor: "pointer",
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              gap: "8px", transition: "all 0.2s", fontFamily: "system-ui, sans-serif",
              color: "rgba(255,255,255,0.3)",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = `${ACCENT}40`; (e.currentTarget as HTMLButtonElement).style.color = ACCENT; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.08)"; (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.3)"; }}
          >
            <Plus size={20} />
            <span style={{ fontSize: "12px", fontWeight: 600 }}>New White-Label Portal</span>
          </button>
        </div>
      </main>

      {/* Editor modal */}
      {editing !== null && (
        <PortalConfigEditor
          config={editing}
          onClose={() => setEditing(null)}
          onSave={(updated) => {
            setPortals((prev) => {
              const idx = prev.findIndex((p) => p.id === updated.id);
              if (idx >= 0) {
                const next = [...prev];
                next[idx] = updated;
                return next;
              }
              return [...prev, updated];
            });
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}
