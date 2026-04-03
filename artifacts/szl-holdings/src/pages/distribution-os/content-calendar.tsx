import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { m } from "framer-motion";
import { Calendar, Plus, FileText, Mail, Image, Twitter } from "lucide-react";
import { DistributionOsLayout } from "./admin-dashboard";

const API = import.meta.env.VITE_API_URL || "";

interface CalendarItem { id: number; title: string; contentType: string; channel: string | null; status: string; scheduledDate: string | null; createdAt: string; }

const TYPE_ICONS: Record<string, typeof FileText> = { article: FileText, newsletter: Mail, carousel: Image, "x-post": Twitter };
const STATUS_COLORS: Record<string, string> = { idea: "#8b8579", planned: "#4a90b8", "in-progress": "#d4a054", review: "#c8953c", published: "#5a9c5a" };

export default function ContentCalendarPage() {
  const [location] = useLocation();
  const [items, setItems] = useState<CalendarItem[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ title: "", contentType: "article", channel: "site", scheduledDate: "" });

  useEffect(() => { fetch(`${API}/api/distribution-os/calendar`).then(r => r.json()).then(setItems).catch(() => {}); }, []);

  async function create() {
    if (!form.title) return;
    const res = await fetch(`${API}/api/distribution-os/calendar`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, scheduledDate: form.scheduledDate || null }) });
    const item = await res.json();
    setItems(prev => [...prev, item]);
    setShowNew(false); setForm({ title: "", contentType: "article", channel: "site", scheduledDate: "" });
  }

  async function updateStatus(id: number, status: string) {
    const res = await fetch(`${API}/api/distribution-os/calendar/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    const updated = await res.json();
    setItems(prev => prev.map(i => i.id === id ? updated : i));
  }

  const grouped = items.reduce((acc, item) => {
    const key = item.scheduledDate ? new Date(item.scheduledDate).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : "Unscheduled";
    (acc[key] = acc[key] || []).push(item);
    return acc;
  }, {} as Record<string, CalendarItem[]>);

  return (
    <DistributionOsLayout currentPath={location}>
      <m.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2rem" }}>
          <div>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#e8e4de" }}>Content Calendar</h1>
            <p style={{ fontSize: "0.8125rem", color: "#6b6560", marginTop: "0.25rem" }}>{items.length} items planned</p>
          </div>
          <button onClick={() => setShowNew(true)} style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.625rem 1.25rem", background: "linear-gradient(135deg, #d4a054, #c8953c)", color: "#070a10", border: "none", borderRadius: "8px", fontWeight: 600, fontSize: "0.8125rem", cursor: "pointer" }}><Plus size={16} /> Add Item</button>
        </div>

        {showNew && (
          <div style={{ padding: "1.25rem", background: "hsla(0,0%,100%,0.03)", border: "1px solid hsla(0,0%,100%,0.08)", borderRadius: "10px", marginBottom: "1.5rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: "0.75rem", alignItems: "end" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.6875rem", color: "#6b6560", marginBottom: "0.25rem", textTransform: "uppercase" }}>Title</label>
                <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} style={{ width: "100%", padding: "0.5rem", background: "hsla(0,0%,100%,0.04)", border: "1px solid hsla(0,0%,100%,0.1)", borderRadius: "4px", color: "#e8e4de", fontSize: "0.8125rem" }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.6875rem", color: "#6b6560", marginBottom: "0.25rem", textTransform: "uppercase" }}>Type</label>
                <select value={form.contentType} onChange={e => setForm(p => ({ ...p, contentType: e.target.value }))} style={{ width: "100%", padding: "0.5rem", background: "hsla(0,0%,100%,0.04)", border: "1px solid hsla(0,0%,100%,0.1)", borderRadius: "4px", color: "#e8e4de", fontSize: "0.8125rem" }}>
                  <option value="article">Article</option><option value="newsletter">Newsletter</option><option value="carousel">Carousel</option><option value="x-post">X Post</option>
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.6875rem", color: "#6b6560", marginBottom: "0.25rem", textTransform: "uppercase" }}>Date</label>
                <input type="date" value={form.scheduledDate} onChange={e => setForm(p => ({ ...p, scheduledDate: e.target.value }))} style={{ width: "100%", padding: "0.5rem", background: "hsla(0,0%,100%,0.04)", border: "1px solid hsla(0,0%,100%,0.1)", borderRadius: "4px", color: "#e8e4de", fontSize: "0.8125rem" }} />
              </div>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button onClick={create} style={{ padding: "0.5rem 0.75rem", background: "#d4a054", color: "#070a10", border: "none", borderRadius: "4px", fontWeight: 600, fontSize: "0.75rem", cursor: "pointer" }}>Add</button>
                <button onClick={() => setShowNew(false)} style={{ padding: "0.5rem 0.75rem", background: "hsla(0,0%,100%,0.06)", color: "#8b8579", border: "1px solid hsla(0,0%,100%,0.08)", borderRadius: "4px", fontSize: "0.75rem", cursor: "pointer" }}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {Object.entries(grouped).map(([month, monthItems]) => (
          <div key={month} style={{ marginBottom: "2rem" }}>
            <h3 style={{ fontSize: "0.8125rem", fontWeight: 600, color: "#8b8579", marginBottom: "0.75rem" }}>{month}</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
              {monthItems.map(item => {
                const Icon = TYPE_ICONS[item.contentType] || FileText;
                return (
                  <div key={item.id} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem 1rem", background: "hsla(0,0%,100%,0.02)", border: "1px solid hsla(0,0%,100%,0.05)", borderRadius: "6px" }}>
                    <Icon size={16} style={{ color: "#d4a054", flexShrink: 0 }} />
                    <span style={{ flex: 1, fontSize: "0.875rem", color: "#e8e4de" }}>{item.title}</span>
                    {item.scheduledDate && <span style={{ fontSize: "0.6875rem", color: "#4a4540" }}>{new Date(item.scheduledDate).toLocaleDateString()}</span>}
                    <select value={item.status} onChange={e => updateStatus(item.id, e.target.value)} style={{ padding: "0.25rem 0.5rem", background: "transparent", color: STATUS_COLORS[item.status] || "#8b8579", border: "1px solid hsla(0,0%,100%,0.06)", borderRadius: "4px", fontSize: "0.6875rem", fontWeight: 600, cursor: "pointer" }}>
                      <option value="idea">Idea</option><option value="planned">Planned</option><option value="in-progress">In Progress</option><option value="review">Review</option><option value="published">Published</option>
                    </select>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        {items.length === 0 && <div style={{ textAlign: "center", padding: "3rem", color: "#4a4540" }}><Calendar size={32} style={{ margin: "0 auto 1rem", opacity: 0.5 }} /><p>No calendar items yet.</p></div>}
      </m.div>
    </DistributionOsLayout>
  );
}
