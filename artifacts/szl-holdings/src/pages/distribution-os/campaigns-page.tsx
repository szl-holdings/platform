import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { m } from "framer-motion";
import { Megaphone, Plus, Link2, Copy, ExternalLink, Trash2 } from "lucide-react";
import { DistributionOsLayout } from "./admin-dashboard";

const API = import.meta.env.VITE_API_URL || "";

interface Campaign { id: number; name: string; slug: string; status: string; totalClicks: number; totalConversions: number; createdAt: string; }
interface CampaignLink { id: number; name: string; fullUrl: string; source: string; medium: string; clicks: number; }

export default function CampaignsPage() {
  const [location] = useLocation();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [links, setLinks] = useState<CampaignLink[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [name, setName] = useState("");
  const [showLink, setShowLink] = useState(false);
  const [linkForm, setLinkForm] = useState({ name: "", source: "linkedin", medium: "social", campaign: "", destination: "https://szlholdings.com" });

  useEffect(() => {
    fetch(`${API}/api/distribution-os/campaigns`).then(r => r.json()).then(setCampaigns).catch(() => {});
  }, []);

  useEffect(() => {
    if (selected) fetch(`${API}/api/distribution-os/campaigns/${selected}/links`).then(r => r.json()).then(setLinks).catch(() => {});
  }, [selected]);

  async function createCampaign() {
    if (!name) return;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const res = await fetch(`${API}/api/distribution-os/campaigns`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, slug }) });
    const c = await res.json();
    setCampaigns(prev => [c, ...prev]);
    setShowNew(false); setName("");
  }

  async function createLink() {
    if (!selected) return;
    const res = await fetch(`${API}/api/distribution-os/campaigns/${selected}/links`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...linkForm, campaign: linkForm.campaign || campaigns.find(c => c.id === selected)?.slug || "" }) });
    const link = await res.json();
    setLinks(prev => [...prev, link]);
    setShowLink(false); setLinkForm({ name: "", source: "linkedin", medium: "social", campaign: "", destination: "https://szlholdings.com" });
  }

  return (
    <DistributionOsLayout currentPath={location}>
      <m.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2rem" }}>
          <div>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#e8e4de" }}>Campaigns & UTM Builder</h1>
            <p style={{ fontSize: "0.8125rem", color: "#6b6560", marginTop: "0.25rem" }}>{campaigns.length} campaigns</p>
          </div>
          <button onClick={() => setShowNew(true)} style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.625rem 1.25rem", background: "linear-gradient(135deg, #d4a054, #c8953c)", color: "#070a10", border: "none", borderRadius: "8px", fontWeight: 600, fontSize: "0.8125rem", cursor: "pointer" }}><Plus size={16} /> New Campaign</button>
        </div>

        {showNew && (
          <div style={{ padding: "1.25rem", background: "hsla(0,0%,100%,0.03)", border: "1px solid hsla(0,0%,100%,0.08)", borderRadius: "10px", marginBottom: "1.5rem" }}>
            <div style={{ display: "flex", gap: "0.75rem", alignItems: "end" }}>
              <div style={{ flex: 1 }}><input value={name} onChange={e => setName(e.target.value)} placeholder="Campaign name..." style={{ width: "100%", padding: "0.625rem 0.75rem", background: "hsla(0,0%,100%,0.04)", border: "1px solid hsla(0,0%,100%,0.1)", borderRadius: "6px", color: "#e8e4de", fontSize: "0.875rem" }} /></div>
              <button onClick={createCampaign} style={{ padding: "0.625rem 1rem", background: "#d4a054", color: "#070a10", border: "none", borderRadius: "6px", fontWeight: 600, fontSize: "0.8125rem", cursor: "pointer" }}>Create</button>
              <button onClick={() => setShowNew(false)} style={{ padding: "0.625rem 1rem", background: "hsla(0,0%,100%,0.06)", color: "#8b8579", border: "1px solid hsla(0,0%,100%,0.08)", borderRadius: "6px", fontSize: "0.8125rem", cursor: "pointer" }}>Cancel</button>
            </div>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
          <div>
            <h2 style={{ fontSize: "0.75rem", fontWeight: 600, color: "#6b6560", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "1rem" }}>Campaigns</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {campaigns.map(c => (
                <button key={c.id} onClick={() => setSelected(c.id)} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.875rem 1rem", background: selected === c.id ? "hsla(0,0%,100%,0.06)" : "hsla(0,0%,100%,0.02)", border: selected === c.id ? "1px solid hsla(0,0%,100%,0.12)" : "1px solid hsla(0,0%,100%,0.05)", borderRadius: "8px", color: "#e8e4de", cursor: "pointer", textAlign: "left", width: "100%" }}>
                  <Megaphone size={16} style={{ color: "#d4a054" }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "0.875rem", fontWeight: 600 }}>{c.name}</div>
                    <div style={{ fontSize: "0.6875rem", color: "#4a4540" }}>{c.totalClicks} clicks · {c.totalConversions} conversions</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div>
            {selected && (
              <>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
                  <h2 style={{ fontSize: "0.75rem", fontWeight: 600, color: "#6b6560", letterSpacing: "0.1em", textTransform: "uppercase" }}>UTM Links</h2>
                  <button onClick={() => setShowLink(true)} style={{ display: "flex", alignItems: "center", gap: "0.375rem", padding: "0.375rem 0.75rem", background: "hsla(0,0%,100%,0.06)", color: "#d4a054", border: "1px solid hsla(0,0%,100%,0.08)", borderRadius: "6px", fontSize: "0.75rem", cursor: "pointer" }}><Plus size={12} /> Add Link</button>
                </div>

                {showLink && (
                  <div style={{ padding: "1rem", background: "hsla(0,0%,100%,0.03)", border: "1px solid hsla(0,0%,100%,0.08)", borderRadius: "8px", marginBottom: "1rem" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginBottom: "0.5rem" }}>
                      <input value={linkForm.name} onChange={e => setLinkForm(p => ({ ...p, name: e.target.value }))} placeholder="Link name" style={{ padding: "0.5rem", background: "hsla(0,0%,100%,0.04)", border: "1px solid hsla(0,0%,100%,0.1)", borderRadius: "4px", color: "#e8e4de", fontSize: "0.8125rem" }} />
                      <input value={linkForm.destination} onChange={e => setLinkForm(p => ({ ...p, destination: e.target.value }))} placeholder="Destination URL" style={{ padding: "0.5rem", background: "hsla(0,0%,100%,0.04)", border: "1px solid hsla(0,0%,100%,0.1)", borderRadius: "4px", color: "#e8e4de", fontSize: "0.8125rem" }} />
                      <select value={linkForm.source} onChange={e => setLinkForm(p => ({ ...p, source: e.target.value }))} style={{ padding: "0.5rem", background: "hsla(0,0%,100%,0.04)", border: "1px solid hsla(0,0%,100%,0.1)", borderRadius: "4px", color: "#e8e4de", fontSize: "0.8125rem" }}>
                        <option value="linkedin">LinkedIn</option><option value="twitter">Twitter/X</option><option value="newsletter">Newsletter</option><option value="medium">Medium</option><option value="substack">Substack</option><option value="direct">Direct</option>
                      </select>
                      <select value={linkForm.medium} onChange={e => setLinkForm(p => ({ ...p, medium: e.target.value }))} style={{ padding: "0.5rem", background: "hsla(0,0%,100%,0.04)", border: "1px solid hsla(0,0%,100%,0.1)", borderRadius: "4px", color: "#e8e4de", fontSize: "0.8125rem" }}>
                        <option value="social">Social</option><option value="email">Email</option><option value="cpc">CPC</option><option value="organic">Organic</option><option value="referral">Referral</option>
                      </select>
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <button onClick={createLink} style={{ padding: "0.5rem 0.75rem", background: "#d4a054", color: "#070a10", border: "none", borderRadius: "4px", fontWeight: 600, fontSize: "0.75rem", cursor: "pointer" }}>Generate</button>
                      <button onClick={() => setShowLink(false)} style={{ padding: "0.5rem 0.75rem", background: "hsla(0,0%,100%,0.06)", color: "#8b8579", border: "1px solid hsla(0,0%,100%,0.08)", borderRadius: "4px", fontSize: "0.75rem", cursor: "pointer" }}>Cancel</button>
                    </div>
                  </div>
                )}

                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {links.map(link => (
                    <div key={link.id} style={{ padding: "0.75rem", background: "hsla(0,0%,100%,0.02)", border: "1px solid hsla(0,0%,100%,0.05)", borderRadius: "6px" }}>
                      <div style={{ fontSize: "0.8125rem", fontWeight: 600, color: "#e8e4de", marginBottom: "0.25rem" }}>{link.name || `${link.source}/${link.medium}`}</div>
                      <div style={{ fontSize: "0.6875rem", color: "#4a4540", wordBreak: "break-all" }}>{link.fullUrl}</div>
                      <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.375rem" }}>
                        <button onClick={() => navigator.clipboard.writeText(link.fullUrl)} style={{ display: "flex", alignItems: "center", gap: "0.25rem", padding: "0.25rem 0.5rem", background: "none", border: "1px solid hsla(0,0%,100%,0.08)", borderRadius: "4px", color: "#6b6560", fontSize: "0.625rem", cursor: "pointer" }}><Copy size={10} /> Copy</button>
                        <span style={{ fontSize: "0.625rem", color: "#4a4540" }}>{link.clicks} clicks</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </m.div>
    </DistributionOsLayout>
  );
}
