import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { m } from "framer-motion";
import { Image, Plus, Layers, Trash2 } from "lucide-react";
import { DistributionOsLayout } from "./admin-dashboard";

const API = import.meta.env.VITE_API_URL || "";

interface Carousel { id: number; title: string; slug: string; topic: string | null; hook: string | null; status: string; createdAt: string; }

export default function CarouselLabPage() {
  const [location] = useLocation();
  const [carousels, setCarousels] = useState<Carousel[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [title, setTitle] = useState("");
  const [hook, setHook] = useState("");

  useEffect(() => { fetch(`${API}/api/distribution-os/carousels`).then(r => r.json()).then(setCarousels).catch(() => {}); }, []);

  async function create() {
    if (!title) return;
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const res = await fetch(`${API}/api/distribution-os/carousels`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title, slug, hook }) });
    const c = await res.json();
    setCarousels(prev => [c, ...prev]);
    setShowNew(false); setTitle(""); setHook("");
  }

  return (
    <DistributionOsLayout currentPath={location}>
      <m.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2rem" }}>
          <div>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#e8e4de" }}>Carousel Lab</h1>
            <p style={{ fontSize: "0.8125rem", color: "#6b6560", marginTop: "0.25rem" }}>Design and manage LinkedIn/Instagram carousels</p>
          </div>
          <button onClick={() => setShowNew(true)} style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.625rem 1.25rem", background: "linear-gradient(135deg, #d4a054, #c8953c)", color: "#070a10", border: "none", borderRadius: "8px", fontWeight: 600, fontSize: "0.8125rem", cursor: "pointer" }}><Plus size={16} /> New Carousel</button>
        </div>

        {showNew && (
          <div style={{ padding: "1.25rem", background: "hsla(0,0%,100%,0.03)", border: "1px solid hsla(0,0%,100%,0.08)", borderRadius: "10px", marginBottom: "1.5rem" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Carousel title..." style={{ padding: "0.625rem 0.75rem", background: "hsla(0,0%,100%,0.04)", border: "1px solid hsla(0,0%,100%,0.1)", borderRadius: "6px", color: "#e8e4de", fontSize: "0.875rem" }} />
              <input value={hook} onChange={e => setHook(e.target.value)} placeholder="Opening hook..." style={{ padding: "0.625rem 0.75rem", background: "hsla(0,0%,100%,0.04)", border: "1px solid hsla(0,0%,100%,0.1)", borderRadius: "6px", color: "#e8e4de", fontSize: "0.875rem" }} />
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button onClick={create} style={{ padding: "0.625rem 1rem", background: "#d4a054", color: "#070a10", border: "none", borderRadius: "6px", fontWeight: 600, fontSize: "0.8125rem", cursor: "pointer" }}>Create</button>
                <button onClick={() => setShowNew(false)} style={{ padding: "0.625rem 1rem", background: "hsla(0,0%,100%,0.06)", color: "#8b8579", border: "1px solid hsla(0,0%,100%,0.08)", borderRadius: "6px", fontSize: "0.8125rem", cursor: "pointer" }}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem" }}>
          {carousels.map(c => (
            <div key={c.id} style={{ padding: "1.25rem", background: "hsla(0,0%,100%,0.02)", border: "1px solid hsla(0,0%,100%,0.05)", borderRadius: "10px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
                <Layers size={16} style={{ color: "#d4a054" }} />
                <span style={{ fontSize: "0.6875rem", fontWeight: 600, color: "#8b8579", textTransform: "uppercase" }}>{c.status}</span>
              </div>
              <h3 style={{ fontSize: "0.9375rem", fontWeight: 600, color: "#e8e4de", marginBottom: "0.375rem" }}>{c.title}</h3>
              {c.hook && <p style={{ fontSize: "0.8125rem", color: "#6b6560", lineHeight: 1.5 }}>{c.hook}</p>}
              <div style={{ fontSize: "0.6875rem", color: "#4a4540", marginTop: "0.5rem" }}>{new Date(c.createdAt).toLocaleDateString()}</div>
            </div>
          ))}
          {carousels.length === 0 && (
            <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "3rem", color: "#4a4540" }}>
              <Image size={32} style={{ margin: "0 auto 1rem", opacity: 0.5 }} />
              <p>No carousels yet.</p>
            </div>
          )}
        </div>
      </m.div>
    </DistributionOsLayout>
  );
}
