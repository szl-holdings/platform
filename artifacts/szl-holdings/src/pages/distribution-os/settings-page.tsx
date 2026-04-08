import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { m, AnimatePresence } from "framer-motion";
import {
  Settings, Globe, Twitter, BookOpen, Newspaper, CheckCircle2, AlertCircle,
  RefreshCw, Save, Edit3, X, Loader2, Plus, Trash2, GripVertical, Link2,
  ExternalLink, ToggleLeft, ToggleRight, Mail, Building2, Phone, Tag,
  Eye, EyeOff, ChevronUp, ChevronDown,
} from "lucide-react";
import { DistributionOsLayout } from "./admin-dashboard";

const API = import.meta.env.VITE_API_URL || "";

function getCsrfToken(): string {
  const match = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : "";
}

function writeHeaders(): Record<string, string> {
  return { "Content-Type": "application/json", "x-csrf-token": getCsrfToken() };
}

interface Integration {
  id: number;
  provider: string;
  authMode: string;
  status: string;
  lastSuccess: string | null;
  lastFailure: string | null;
  lastError: string | null;
  config: Record<string, unknown> | null;
}

interface SiteSetting {
  id: number;
  key: string;
  value: string | null;
  category: string;
  label: string | null;
}

interface LinktreeItem {
  id: number;
  label: string;
  destination: string;
  campaignTag: string | null;
  contentTag: string | null;
  sortOrder: number;
  isActive: boolean;
}

const INTEGRATION_META: Record<string, { name: string; description: string; icon: typeof Globe; color: string }> = {
  x: { name: "X (Twitter)", description: "Auto-post approved content to X", icon: Twitter, color: "#1a8cd8" },
  substack: { name: "Substack", description: "Publish newsletters to Substack", icon: BookOpen, color: "#f05a28" },
  medium: { name: "Medium", description: "Cross-post articles to Medium", icon: Newspaper, color: "#e8e4de" },
  linkedin: { name: "LinkedIn", description: "Share updates to LinkedIn", icon: Globe, color: "#0a66c2" },
  linktree: { name: "Linktree", description: "Sync link-in-bio configuration", icon: Link2, color: "#5ecc7b" },
  email: { name: "Email Provider", description: "Send newsletters via email", icon: Mail, color: "#d4a054" },
};

const STATUS_META: Record<string, { color: string; label: string; dot: string }> = {
  connected: { color: "#5a9c5a", label: "Connected", dot: "#5a9c5a" },
  disconnected: { color: "#6b6560", label: "Disconnected", dot: "#4a4540" },
  error: { color: "#c45a4a", label: "Error", dot: "#c45a4a" },
  mock: { color: "#8b7ac8", label: "Mock Mode", dot: "#8b7ac8" },
};

const SETTING_GROUPS = [
  { category: "company", label: "Brand & Company", fields: [
    { key: "company_name", label: "Company Name", placeholder: "SZL Holdings" },
    { key: "company_tagline", label: "Tagline", placeholder: "The Operating System for AI-Native Businesses" },
    { key: "company_website", label: "Website URL", placeholder: "https://szlholdings.com" },
    { key: "founder_name", label: "Founder Name", placeholder: "Stephen Lutar" },
    { key: "founder_title", label: "Founder Title", placeholder: "Founder & CEO" },
  ]},
  { category: "social", label: "Social URLs", fields: [
    { key: "social_linkedin", label: "LinkedIn URL", placeholder: "https://linkedin.com/in/..." },
    { key: "social_x", label: "X (Twitter) URL", placeholder: "https://x.com/..." },
    { key: "social_substack", label: "Substack URL", placeholder: "https://..." },
    { key: "social_medium", label: "Medium URL", placeholder: "https://medium.com/@..." },
    { key: "social_linktree", label: "Linktree URL", placeholder: "https://linktr.ee/..." },
  ]},
  { category: "integration", label: "Email & Contact", fields: [
    { key: "contact_email", label: "Contact Email", placeholder: "hello@szlholdings.com" },
    { key: "inquiry_email", label: "Inquiry Destination", placeholder: "Where form submissions are forwarded" },
    { key: "newsletter_from_name", label: "Newsletter From Name", placeholder: "Stephen @ SZL" },
    { key: "newsletter_reply_to", label: "Newsletter Reply-To", placeholder: "hello@szlholdings.com" },
  ]},
];

const RECOMMENDED_LINKTREE = [
  { label: "Newsletter — Get the Weekly Brief", destination: "https://szlholdings.com/newsletter", tag: "newsletter" },
  { label: "SZL Holdings — Platform Overview", destination: "https://szlholdings.com", tag: "homepage" },
  { label: "Work With Me — Private Inquiry", destination: "https://szlholdings.com/contact", tag: "contact" },
  { label: "Lyte — AI Ops for SMBs", destination: "https://szlholdings.com/lyte", tag: "lyte" },
  { label: "Insights — Founder Essays", destination: "https://szlholdings.com/insights", tag: "insights" },
  { label: "Prism Counsel — AI-Native Legal", destination: "https://szlholdings.com/products/prism-counsel", tag: "prism-counsel" },
];

export default function SettingsPage() {
  const [location] = useLocation();
  const [activeTab, setActiveTab] = useState<"settings" | "integrations" | "linktree">("settings");
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [settings, setSettings] = useState<SiteSetting[]>([]);
  const [linktreeItems, setLinktreeItems] = useState<LinktreeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [newLinkForm, setNewLinkForm] = useState({ label: "", destination: "", campaignTag: "", contentTag: "" });
  const [showNewLink, setShowNewLink] = useState(false);
  const [editingLinkId, setEditingLinkId] = useState<number | null>(null);
  const [editingLinkData, setEditingLinkData] = useState<{ label: string; destination: string; campaignTag: string; contentTag: string }>({ label: "", destination: "", campaignTag: "", contentTag: "" });
  const [primaryUrl, setPrimaryUrl] = useState("");

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(`${API}/api/distribution-os/integrations`).then(r => r.json()),
      fetch(`${API}/api/distribution-os/settings`).then(r => r.json()),
      fetch(`${API}/api/distribution-os/linktree/admin`).then(r => r.json()),
    ]).then(([ints, sets, lt]) => {
      setIntegrations(Array.isArray(ints) ? ints : []);
      const settingsList: SiteSetting[] = Array.isArray(sets) ? sets : [];
      setSettings(settingsList);
      setPrimaryUrl(settingsList.find(s => s.key === "linktree_primary_url")?.value || "");
      setLinktreeItems(Array.isArray(lt) ? lt : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  function getSettingValue(key: string) {
    return settings.find(s => s.key === key)?.value || "";
  }

  async function saveSetting(key: string, value: string) {
    setSaving(true);
    const existing = settings.find(s => s.key === key);
    if (existing) {
      const res = await fetch(`${API}/api/distribution-os/settings/${key}`, {
        method: "PATCH",
        credentials: "include",
        headers: writeHeaders(),
        body: JSON.stringify({ value }),
      });
      const updated = await res.json();
      setSettings(prev => prev.map(s => s.key === key ? updated : s));
    } else {
      const res = await fetch(`${API}/api/distribution-os/settings`, {
        method: "POST",
        credentials: "include",
        headers: writeHeaders(),
        body: JSON.stringify({ key, value, category: SETTING_GROUPS.find(g => g.fields.find(f => f.key === key))?.category || "company", label: SETTING_GROUPS.flatMap(g => g.fields).find(f => f.key === key)?.label || key }),
      });
      const created = await res.json();
      setSettings(prev => [...prev, created]);
    }
    setEditingKey(null);
    setSaving(false);
  }

  async function retryIntegration(provider: string) {
    const res = await fetch(`${API}/api/distribution-os/integrations/retry/${provider}`, { method: "POST", credentials: "include", headers: writeHeaders() });
    const updated = await res.json();
    setIntegrations(prev => prev.map(i => i.provider === provider ? updated : i));
  }

  async function toggleMockMode(integration: Integration) {
    const newStatus = integration.status === "mock" ? "disconnected" : "mock";
    const res = await fetch(`${API}/api/distribution-os/integrations/${integration.id}`, {
      method: "PATCH",
      credentials: "include",
      headers: writeHeaders(),
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) {
      const updated = await res.json();
      setIntegrations(prev => prev.map(i => i.id === integration.id ? updated : i));
    } else {
      setIntegrations(prev => prev.map(i => i.id === integration.id ? { ...i, status: newStatus } : i));
    }
  }

  async function savePrimaryUrl() {
    await saveSetting("linktree_primary_url", primaryUrl);
  }

  async function addLinktreeItem() {
    if (!newLinkForm.label || !newLinkForm.destination) return;
    const res = await fetch(`${API}/api/distribution-os/linktree`, {
      method: "POST",
      credentials: "include",
      headers: writeHeaders(),
      body: JSON.stringify({ ...newLinkForm, sortOrder: linktreeItems.length, isActive: true }),
    });
    const item = await res.json();
    setLinktreeItems(prev => [...prev, item]);
    setNewLinkForm({ label: "", destination: "", campaignTag: "", contentTag: "" });
    setShowNewLink(false);
  }

  async function updateLink(id: number, patch: Partial<LinktreeItem>) {
    const res = await fetch(`${API}/api/distribution-os/linktree/${id}`, {
      method: "PATCH",
      credentials: "include",
      headers: writeHeaders(),
      body: JSON.stringify(patch),
    });
    const updated = await res.json();
    setLinktreeItems(prev => prev.map(i => i.id === id ? updated : i));
  }

  async function deleteLink(id: number) {
    if (!confirm("Delete this link?")) return;
    await fetch(`${API}/api/distribution-os/linktree/${id}`, { method: "DELETE", credentials: "include", headers: { "x-csrf-token": getCsrfToken() } });
    setLinktreeItems(prev => prev.filter(i => i.id !== id));
  }

  async function moveLink(idx: number, dir: -1 | 1) {
    const arr = [...linktreeItems];
    const target = idx + dir;
    if (target < 0 || target >= arr.length) return;
    const a = arr[idx], b = arr[target];
    arr[idx] = { ...b, sortOrder: a.sortOrder };
    arr[target] = { ...a, sortOrder: b.sortOrder };
    setLinktreeItems(arr);
    await Promise.all([
      fetch(`${API}/api/distribution-os/linktree/${a.id}`, { method: "PATCH", credentials: "include", headers: writeHeaders(), body: JSON.stringify({ sortOrder: b.sortOrder }) }),
      fetch(`${API}/api/distribution-os/linktree/${b.id}`, { method: "PATCH", credentials: "include", headers: writeHeaders(), body: JSON.stringify({ sortOrder: a.sortOrder }) }),
    ]);
  }

  async function saveEditingLink() {
    if (editingLinkId === null) return;
    await updateLink(editingLinkId, editingLinkData);
    setEditingLinkId(null);
  }

  async function seedRecommendedLinktree() {
    for (let i = 0; i < RECOMMENDED_LINKTREE.length; i++) {
      const r = RECOMMENDED_LINKTREE[i];
      const res = await fetch(`${API}/api/distribution-os/linktree`, {
        method: "POST",
        credentials: "include",
        headers: writeHeaders(),
        body: JSON.stringify({ label: r.label, destination: r.destination, campaignTag: r.tag, sortOrder: i, isActive: true }),
      });
      const item = await res.json();
      setLinktreeItems(prev => [...prev, item]);
    }
  }

  const allProviders = Object.keys(INTEGRATION_META);
  const integrationsMap = Object.fromEntries(integrations.map(i => [i.provider, i]));

  const TABS = [
    { key: "settings" as const, label: "Brand & Settings" },
    { key: "integrations" as const, label: "Integrations" },
    { key: "linktree" as const, label: "Linktree Config" },
  ];

  return (
    <DistributionOsLayout currentPath={location}>
      <m.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div style={{ marginBottom: "1.5rem" }}>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#e8e4de" }}>Settings</h1>
          <p style={{ fontSize: "0.8125rem", color: "#6b6560", marginTop: "0.25rem" }}>Brand configuration, integrations, and distribution setup</p>
        </div>

        <div style={{ display: "flex", gap: "0.25rem", marginBottom: "2rem", borderBottom: "1px solid hsla(0,0%,100%,0.06)", paddingBottom: "0" }}>
          {TABS.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
              padding: "0.625rem 1.25rem", background: "none", border: "none",
              borderBottom: activeTab === tab.key ? "2px solid #d4a054" : "2px solid transparent",
              color: activeTab === tab.key ? "#e8e4de" : "#6b6560",
              fontSize: "0.875rem", fontWeight: activeTab === tab.key ? 600 : 400,
              cursor: "pointer", transition: "all 0.15s", marginBottom: "-1px",
            }}>
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "settings" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            {SETTING_GROUPS.map(group => (
              <div key={group.category}>
                <h2 style={{ fontSize: "0.6875rem", fontWeight: 700, color: "#4a4540", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "0.875rem" }}>{group.label}</h2>
                <div style={{ background: "hsla(0,0%,100%,0.02)", border: "1px solid hsla(0,0%,100%,0.06)", borderRadius: "10px", overflow: "hidden" }}>
                  {group.fields.map((field, idx) => {
                    const currentValue = getSettingValue(field.key);
                    const isEditing = editingKey === field.key;
                    return (
                      <div key={field.key} style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "0.875rem 1rem", borderBottom: idx < group.fields.length - 1 ? "1px solid hsla(0,0%,100%,0.04)" : "none" }}>
                        <div style={{ minWidth: "180px" }}>
                          <div style={{ fontSize: "0.8125rem", fontWeight: 600, color: "#e8e4de" }}>{field.label}</div>
                          <div style={{ fontSize: "0.6875rem", color: "#4a4540" }}>{field.key}</div>
                        </div>
                        {isEditing ? (
                          <div style={{ display: "flex", gap: "0.5rem", flex: 1 }}>
                            <input
                              autoFocus
                              value={editValue}
                              onChange={e => setEditValue(e.target.value)}
                              onKeyDown={e => { if (e.key === "Enter") saveSetting(field.key, editValue); if (e.key === "Escape") setEditingKey(null); }}
                              placeholder={field.placeholder}
                              style={{ flex: 1, padding: "0.375rem 0.625rem", background: "hsla(0,0%,100%,0.06)", border: "1px solid hsla(0,0%,100%,0.15)", borderRadius: "6px", color: "#e8e4de", fontSize: "0.8125rem" }}
                            />
                            <button onClick={() => saveSetting(field.key, editValue)} disabled={saving} style={{ display: "flex", alignItems: "center", gap: "0.25rem", padding: "0.375rem 0.75rem", background: "#d4a054", border: "none", borderRadius: "6px", color: "#070a10", fontWeight: 700, fontSize: "0.75rem", cursor: "pointer" }}>
                              {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} Save
                            </button>
                            <button onClick={() => setEditingKey(null)} style={{ padding: "0.375rem 0.5rem", background: "none", border: "1px solid hsla(0,0%,100%,0.08)", borderRadius: "6px", color: "#6b6560", cursor: "pointer" }}><X size={12} /></button>
                          </div>
                        ) : (
                          <>
                            <div style={{ flex: 1, fontSize: "0.8125rem", color: currentValue ? "#e8e4de" : "#4a4540" }}>
                              {currentValue || <span style={{ fontStyle: "italic" }}>{field.placeholder}</span>}
                            </div>
                            <button onClick={() => { setEditingKey(field.key); setEditValue(currentValue); }} style={{ padding: "0.3rem 0.625rem", background: "none", border: "1px solid hsla(0,0%,100%,0.08)", borderRadius: "6px", color: "#6b6560", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.75rem" }}>
                              <Edit3 size={11} /> Edit
                            </button>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "integrations" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1rem" }}>
            {allProviders.map(provider => {
              const meta = INTEGRATION_META[provider];
              const integration = integrationsMap[provider];
              const status = integration?.status || "disconnected";
              const sm = STATUS_META[status] || STATUS_META.disconnected;
              const Icon = meta.icon;

              return (
                <div key={provider} style={{ padding: "1.25rem", background: "hsla(0,0%,100%,0.02)", border: `1px solid ${status === "connected" ? "hsla(120,30%,40%,0.25)" : status === "error" ? "hsla(0,60%,50%,0.2)" : "hsla(0,0%,100%,0.06)"}`, borderRadius: "12px" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "0.75rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                      <div style={{ width: 36, height: 36, borderRadius: "8px", background: "hsla(0,0%,100%,0.05)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Icon size={18} style={{ color: meta.color }} />
                      </div>
                      <div>
                        <h3 style={{ fontSize: "0.9375rem", fontWeight: 600, color: "#e8e4de" }}>{meta.name}</h3>
                        <p style={{ fontSize: "0.6875rem", color: "#6b6560" }}>{meta.description}</p>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
                      <div style={{ width: 7, height: 7, borderRadius: "50%", background: sm.dot }} />
                      <span style={{ fontSize: "0.6875rem", fontWeight: 700, color: sm.color }}>{sm.label}</span>
                    </div>
                  </div>

                  {integration?.lastError && (
                    <div style={{ padding: "0.5rem 0.625rem", background: "hsla(0,60%,50%,0.08)", border: "1px solid hsla(0,60%,50%,0.15)", borderRadius: "6px", marginBottom: "0.75rem" }}>
                      <p style={{ fontSize: "0.6875rem", color: "#c45a4a" }}>{integration.lastError}</p>
                    </div>
                  )}

                  {integration?.lastSuccess && (
                    <p style={{ fontSize: "0.6875rem", color: "#4a4540", marginBottom: "0.75rem" }}>
                      Last sync: {new Date(integration.lastSuccess).toLocaleString()}
                    </p>
                  )}

                  <div style={{ display: "flex", gap: "0.375rem", flexWrap: "wrap" }}>
                    <button style={{ padding: "0.375rem 0.75rem", background: status === "connected" ? "hsla(0,0%,100%,0.05)" : "hsla(40,60%,50%,0.12)", color: status === "connected" ? "#8b8579" : "#d4a054", border: "1px solid hsla(0,0%,100%,0.08)", borderRadius: "6px", fontSize: "0.6875rem", fontWeight: 600, cursor: "pointer" }}>
                      {status === "connected" ? "Disconnect" : "Connect"}
                    </button>
                    {integration?.lastError && (
                      <button onClick={() => retryIntegration(provider)} style={{ display: "flex", alignItems: "center", gap: "0.25rem", padding: "0.375rem 0.75rem", background: "none", color: "#d4a054", border: "1px solid hsla(40,60%,50%,0.2)", borderRadius: "6px", fontSize: "0.6875rem", fontWeight: 600, cursor: "pointer" }}>
                        <RefreshCw size={10} /> Retry
                      </button>
                    )}
                    {integration && (
                      <button onClick={() => toggleMockMode(integration)} style={{ display: "flex", alignItems: "center", gap: "0.25rem", padding: "0.375rem 0.75rem", background: status === "mock" ? "hsla(270,40%,50%,0.12)" : "none", color: status === "mock" ? "#8b7ac8" : "#4a4540", border: status === "mock" ? "1px solid hsla(270,40%,50%,0.25)" : "1px solid hsla(0,0%,100%,0.06)", borderRadius: "6px", fontSize: "0.6875rem", fontWeight: 600, cursor: "pointer" }}>
                        {status === "mock" ? <ToggleRight size={12} /> : <ToggleLeft size={12} />} Dev Mode
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === "linktree" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: "2rem", alignItems: "start" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
                <div>
                  <h2 style={{ fontSize: "0.875rem", fontWeight: 600, color: "#e8e4de" }}>Active Linktree Buttons</h2>
                  <p style={{ fontSize: "0.75rem", color: "#6b6560", marginTop: "0.125rem" }}>Configure the ordered link destinations shown on your Linktree profile</p>
                </div>
                <button onClick={() => setShowNewLink(true)} style={{ display: "flex", alignItems: "center", gap: "0.375rem", padding: "0.5rem 0.875rem", background: "#d4a054", border: "none", borderRadius: "6px", color: "#070a10", fontWeight: 700, fontSize: "0.75rem", cursor: "pointer" }}>
                  <Plus size={13} /> Add Link
                </button>
              </div>

              <AnimatePresence>
                {showNewLink && (
                  <m.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} style={{ overflow: "hidden", marginBottom: "1rem" }}>
                    <div style={{ padding: "1.25rem", background: "hsla(0,0%,100%,0.03)", border: "1px solid hsla(40,60%,50%,0.2)", borderRadius: "10px" }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.625rem", marginBottom: "0.625rem" }}>
                        <div>
                          <label style={{ fontSize: "0.6875rem", color: "#6b6560", fontWeight: 600, display: "block", marginBottom: "0.3rem" }}>Button Label *</label>
                          <input value={newLinkForm.label} onChange={e => setNewLinkForm(p => ({ ...p, label: e.target.value }))} placeholder="Newsletter — Get the Brief" style={{ width: "100%", padding: "0.5rem 0.625rem", background: "hsla(0,0%,100%,0.04)", border: "1px solid hsla(0,0%,100%,0.1)", borderRadius: "6px", color: "#e8e4de", fontSize: "0.8125rem", boxSizing: "border-box" }} />
                        </div>
                        <div>
                          <label style={{ fontSize: "0.6875rem", color: "#6b6560", fontWeight: 600, display: "block", marginBottom: "0.3rem" }}>Destination URL *</label>
                          <input value={newLinkForm.destination} onChange={e => setNewLinkForm(p => ({ ...p, destination: e.target.value }))} placeholder="https://szlholdings.com/newsletter" style={{ width: "100%", padding: "0.5rem 0.625rem", background: "hsla(0,0%,100%,0.04)", border: "1px solid hsla(0,0%,100%,0.1)", borderRadius: "6px", color: "#e8e4de", fontSize: "0.8125rem", boxSizing: "border-box" }} />
                        </div>
                        <div>
                          <label style={{ fontSize: "0.6875rem", color: "#6b6560", fontWeight: 600, display: "block", marginBottom: "0.3rem" }}>Campaign Tag</label>
                          <input value={newLinkForm.campaignTag} onChange={e => setNewLinkForm(p => ({ ...p, campaignTag: e.target.value }))} placeholder="newsletter" style={{ width: "100%", padding: "0.5rem 0.625rem", background: "hsla(0,0%,100%,0.04)", border: "1px solid hsla(0,0%,100%,0.1)", borderRadius: "6px", color: "#e8e4de", fontSize: "0.8125rem", boxSizing: "border-box" }} />
                        </div>
                        <div>
                          <label style={{ fontSize: "0.6875rem", color: "#6b6560", fontWeight: 600, display: "block", marginBottom: "0.3rem" }}>Content Tag</label>
                          <input value={newLinkForm.contentTag} onChange={e => setNewLinkForm(p => ({ ...p, contentTag: e.target.value }))} placeholder="bio-link" style={{ width: "100%", padding: "0.5rem 0.625rem", background: "hsla(0,0%,100%,0.04)", border: "1px solid hsla(0,0%,100%,0.1)", borderRadius: "6px", color: "#e8e4de", fontSize: "0.8125rem", boxSizing: "border-box" }} />
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        <button onClick={addLinktreeItem} style={{ display: "flex", alignItems: "center", gap: "0.375rem", padding: "0.5rem 1rem", background: "#d4a054", border: "none", borderRadius: "6px", color: "#070a10", fontWeight: 700, fontSize: "0.75rem", cursor: "pointer" }}>
                          <Plus size={12} /> Add Button
                        </button>
                        <button onClick={() => setShowNewLink(false)} style={{ padding: "0.5rem 0.75rem", background: "none", border: "1px solid hsla(0,0%,100%,0.08)", borderRadius: "6px", color: "#6b6560", fontSize: "0.75rem", cursor: "pointer" }}>Cancel</button>
                      </div>
                    </div>
                  </m.div>
                )}
              </AnimatePresence>

              {/* Primary URL Field */}
              <div style={{ marginBottom: "1rem", padding: "0.875rem 1rem", background: "hsla(0,0%,100%,0.02)", border: "1px solid hsla(0,0%,100%,0.06)", borderRadius: "8px" }}>
                <div style={{ fontSize: "0.6875rem", color: "#4a4540", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.375rem" }}>Primary URL (Bio Link)</div>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <input
                    value={primaryUrl}
                    onChange={e => setPrimaryUrl(e.target.value)}
                    placeholder="https://linktr.ee/stephenlutar or your custom URL"
                    style={{ flex: 1, padding: "0.4rem 0.625rem", background: "hsla(0,0%,100%,0.04)", border: "1px solid hsla(0,0%,100%,0.1)", borderRadius: "5px", color: "#e8e4de", fontSize: "0.8125rem" }}
                  />
                  <button onClick={savePrimaryUrl} style={{ padding: "0.4rem 0.875rem", background: "#d4a054", border: "none", borderRadius: "5px", color: "#070a10", fontWeight: 700, fontSize: "0.75rem", cursor: "pointer", whiteSpace: "nowrap" }}>
                    <Save size={12} />
                  </button>
                </div>
              </div>

              {linktreeItems.length === 0 ? (
                <div style={{ padding: "3rem", textAlign: "center", color: "#4a4540", border: "1px solid hsla(0,0%,100%,0.06)", borderRadius: "10px" }}>
                  <Link2 size={28} style={{ margin: "0 auto 1rem", color: "#4a4540" }} />
                  <p style={{ fontSize: "0.875rem", marginBottom: "1rem" }}>No links configured yet.</p>
                  <button onClick={seedRecommendedLinktree} style={{ padding: "0.5rem 1.25rem", background: "hsla(40,60%,50%,0.12)", border: "1px solid hsla(40,60%,50%,0.2)", borderRadius: "6px", color: "#d4a054", fontWeight: 600, fontSize: "0.8125rem", cursor: "pointer" }}>
                    Load Recommended Structure (6 buttons)
                  </button>
                </div>
              ) : (
                <div style={{ background: "hsla(0,0%,100%,0.02)", border: "1px solid hsla(0,0%,100%,0.06)", borderRadius: "10px", overflow: "hidden" }}>
                  {linktreeItems.map((item, idx) => (
                    <div key={item.id} style={{ borderBottom: idx < linktreeItems.length - 1 ? "1px solid hsla(0,0%,100%,0.04)" : "none" }}>
                      {editingLinkId === item.id ? (
                        <div style={{ padding: "0.875rem 1rem" }}>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginBottom: "0.5rem" }}>
                            <div>
                              <div style={{ fontSize: "0.6rem", color: "#4a4540", fontWeight: 700, textTransform: "uppercase", marginBottom: "0.2rem" }}>Label</div>
                              <input value={editingLinkData.label} onChange={e => setEditingLinkData(p => ({ ...p, label: e.target.value }))} style={{ width: "100%", padding: "0.35rem 0.5rem", background: "hsla(0,0%,100%,0.06)", border: "1px solid hsla(0,0%,100%,0.1)", borderRadius: "4px", color: "#e8e4de", fontSize: "0.8125rem", boxSizing: "border-box" }} />
                            </div>
                            <div>
                              <div style={{ fontSize: "0.6rem", color: "#4a4540", fontWeight: 700, textTransform: "uppercase", marginBottom: "0.2rem" }}>Destination</div>
                              <input value={editingLinkData.destination} onChange={e => setEditingLinkData(p => ({ ...p, destination: e.target.value }))} style={{ width: "100%", padding: "0.35rem 0.5rem", background: "hsla(0,0%,100%,0.06)", border: "1px solid hsla(0,0%,100%,0.1)", borderRadius: "4px", color: "#e8e4de", fontSize: "0.8125rem", boxSizing: "border-box" }} />
                            </div>
                            <div>
                              <div style={{ fontSize: "0.6rem", color: "#4a4540", fontWeight: 700, textTransform: "uppercase", marginBottom: "0.2rem" }}>Campaign Tag</div>
                              <input value={editingLinkData.campaignTag} onChange={e => setEditingLinkData(p => ({ ...p, campaignTag: e.target.value }))} style={{ width: "100%", padding: "0.35rem 0.5rem", background: "hsla(0,0%,100%,0.06)", border: "1px solid hsla(0,0%,100%,0.1)", borderRadius: "4px", color: "#e8e4de", fontSize: "0.8125rem", boxSizing: "border-box" }} />
                            </div>
                            <div>
                              <div style={{ fontSize: "0.6rem", color: "#4a4540", fontWeight: 700, textTransform: "uppercase", marginBottom: "0.2rem" }}>Content Tag</div>
                              <input value={editingLinkData.contentTag} onChange={e => setEditingLinkData(p => ({ ...p, contentTag: e.target.value }))} style={{ width: "100%", padding: "0.35rem 0.5rem", background: "hsla(0,0%,100%,0.06)", border: "1px solid hsla(0,0%,100%,0.1)", borderRadius: "4px", color: "#e8e4de", fontSize: "0.8125rem", boxSizing: "border-box" }} />
                            </div>
                          </div>
                          <div style={{ display: "flex", gap: "0.375rem" }}>
                            <button onClick={saveEditingLink} style={{ display: "flex", alignItems: "center", gap: "0.25rem", padding: "0.35rem 0.75rem", background: "#d4a054", border: "none", borderRadius: "4px", color: "#070a10", fontWeight: 700, fontSize: "0.75rem", cursor: "pointer" }}><Save size={11} /> Save</button>
                            <button onClick={() => setEditingLinkId(null)} style={{ padding: "0.35rem 0.625rem", background: "none", border: "1px solid hsla(0,0%,100%,0.08)", borderRadius: "4px", color: "#6b6560", fontSize: "0.75rem", cursor: "pointer" }}>Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", padding: "0.75rem 1rem" }}>
                          <div style={{ display: "flex", flexDirection: "column", gap: "0.1rem" }}>
                            <button onClick={() => moveLink(idx, -1)} disabled={idx === 0} style={{ padding: "0.1rem", background: "none", border: "none", color: idx === 0 ? "#2a2520" : "#6b6560", cursor: idx === 0 ? "default" : "pointer", lineHeight: 1 }}><ChevronUp size={11} /></button>
                            <button onClick={() => moveLink(idx, 1)} disabled={idx === linktreeItems.length - 1} style={{ padding: "0.1rem", background: "none", border: "none", color: idx === linktreeItems.length - 1 ? "#2a2520" : "#6b6560", cursor: idx === linktreeItems.length - 1 ? "default" : "pointer", lineHeight: 1 }}><ChevronDown size={11} /></button>
                          </div>
                          <span style={{ fontSize: "0.6875rem", color: "#4a4540", minWidth: "16px", fontVariantNumeric: "tabular-nums" }}>{idx + 1}</span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: "0.8125rem", fontWeight: 600, color: "#e8e4de", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.label}</div>
                            <div style={{ fontSize: "0.6875rem", color: "#4a4540", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.destination}</div>
                            {(item.campaignTag || item.contentTag) && (
                              <div style={{ display: "flex", gap: "0.25rem", marginTop: "0.2rem", flexWrap: "wrap" }}>
                                {item.campaignTag && <span style={{ fontSize: "0.6rem", padding: "0.1rem 0.35rem", background: "hsla(40,60%,50%,0.1)", color: "#d4a054", borderRadius: "3px", fontWeight: 700 }}>{item.campaignTag}</span>}
                                {item.contentTag && <span style={{ fontSize: "0.6rem", padding: "0.1rem 0.35rem", background: "hsla(210,50%,50%,0.1)", color: "#4a90b8", borderRadius: "3px", fontWeight: 700 }}>{item.contentTag}</span>}
                              </div>
                            )}
                          </div>
                          <div style={{ display: "flex", gap: "0.25rem", flexShrink: 0 }}>
                            <button onClick={() => updateLink(item.id, { isActive: !item.isActive })} title={item.isActive ? "Deactivate" : "Activate"} style={{ padding: "0.25rem 0.5rem", background: item.isActive ? "hsla(120,30%,40%,0.12)" : "hsla(0,0%,100%,0.04)", border: `1px solid ${item.isActive ? "hsla(120,30%,40%,0.2)" : "hsla(0,0%,100%,0.08)"}`, borderRadius: "4px", color: item.isActive ? "#5a9c5a" : "#4a4540", fontSize: "0.6875rem", fontWeight: 700, cursor: "pointer" }}>
                              {item.isActive ? "On" : "Off"}
                            </button>
                            <button onClick={() => { setEditingLinkId(item.id); setEditingLinkData({ label: item.label, destination: item.destination, campaignTag: item.campaignTag || "", contentTag: item.contentTag || "" }); }} title="Edit" style={{ padding: "0.25rem", background: "none", border: "1px solid hsla(0,0%,100%,0.06)", borderRadius: "4px", color: "#6b6560", cursor: "pointer", display: "flex", alignItems: "center" }}>
                              <Edit3 size={11} />
                            </button>
                            <a href={item.destination} target="_blank" rel="noopener noreferrer" style={{ padding: "0.25rem", background: "none", border: "1px solid hsla(0,0%,100%,0.06)", borderRadius: "4px", color: "#6b6560", display: "flex", alignItems: "center" }}>
                              <ExternalLink size={11} />
                            </a>
                            <button onClick={() => deleteLink(item.id)} title="Delete" style={{ padding: "0.25rem", background: "none", border: "1px solid hsla(0,60%,55%,0.15)", borderRadius: "4px", color: "#c45a4a", cursor: "pointer", display: "flex", alignItems: "center" }}>
                              <Trash2 size={11} />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h2 style={{ fontSize: "0.6875rem", fontWeight: 700, color: "#4a4540", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "0.875rem" }}>Preview</h2>
              <div style={{ background: "hsla(0,0%,100%,0.02)", border: "1px solid hsla(0,0%,100%,0.06)", borderRadius: "12px", padding: "1.5rem", textAlign: "center" }}>
                <div style={{ width: 56, height: 56, borderRadius: "50%", background: "linear-gradient(135deg, #d4a054, #8b7ac8)", margin: "0 auto 0.75rem", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: "1.25rem", fontWeight: 700, color: "#070a10" }}>S</span>
                </div>
                <div style={{ fontSize: "0.875rem", fontWeight: 700, color: "#e8e4de", marginBottom: "0.25rem" }}>@stephenlutar</div>
                <div style={{ fontSize: "0.75rem", color: "#6b6560", marginBottom: "1.25rem" }}>Founder & CEO · SZL Holdings</div>

                {(linktreeItems.length > 0 ? linktreeItems : RECOMMENDED_LINKTREE.map((r, i) => ({ id: i, label: r.label, destination: r.destination, campaignTag: r.tag, contentTag: null, sortOrder: i, isActive: true }))).slice(0, 6).map((item, idx) => (
                  <div key={idx} style={{ padding: "0.625rem", background: "hsla(0,0%,100%,0.05)", border: "1px solid hsla(0,0%,100%,0.08)", borderRadius: "8px", marginBottom: "0.5rem", fontSize: "0.75rem", color: "#e8e4de", fontWeight: 600 }}>
                    {item.label}
                  </div>
                ))}

                <p style={{ fontSize: "0.625rem", color: "#4a4540", marginTop: "1rem" }}>Recommended: 6 buttons</p>
              </div>

              <div style={{ marginTop: "1.25rem", padding: "1rem", background: "hsla(40,60%,50%,0.06)", border: "1px solid hsla(40,60%,50%,0.15)", borderRadius: "8px" }}>
                <h3 style={{ fontSize: "0.6875rem", fontWeight: 700, color: "#d4a054", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.625rem" }}>Recommended Structure</h3>
                {RECOMMENDED_LINKTREE.map((r, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.375rem" }}>
                    <span style={{ fontSize: "0.6875rem", color: "#4a4540", minWidth: "14px" }}>{i + 1}.</span>
                    <span style={{ fontSize: "0.75rem", color: "#8b8579" }}>{r.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </m.div>
    </DistributionOsLayout>
  );
}
