import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { m } from "framer-motion";
import { Users, UserPlus, Mail, Building2, Star, ChevronRight, MessageSquare } from "lucide-react";
import { DistributionOsLayout } from "./admin-dashboard";

const API = import.meta.env.VITE_API_URL || "";

interface Lead {
  id: number;
  name: string | null;
  email: string;
  company: string | null;
  role: string | null;
  interestArea: string | null;
  stage: string;
  score: number;
  source: string | null;
  createdAt: string;
}

const STAGE_COLORS: Record<string, { bg: string; text: string }> = {
  new: { bg: "hsla(210,50%,50%,0.12)", text: "#4a90b8" },
  qualified: { bg: "hsla(120,30%,40%,0.12)", text: "#5a9c5a" },
  warm: { bg: "hsla(40,60%,50%,0.12)", text: "#d4a054" },
  "needs-followup": { bg: "hsla(30,60%,50%,0.12)", text: "#c8953c" },
  "proposal-candidate": { bg: "hsla(270,40%,50%,0.12)", text: "#8b7ac8" },
  "closed-won": { bg: "hsla(120,40%,35%,0.15)", text: "#5a9c5a" },
  "closed-lost": { bg: "hsla(0,0%,100%,0.06)", text: "#8b8579" },
};

export default function LeadsPage() {
  const [location] = useLocation();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    const url = filter === "all" ? `${API}/api/distribution-os/leads` : `${API}/api/distribution-os/leads?stage=${filter}`;
    fetch(url).then(r => r.json()).then(setLeads).catch(() => {});
  }, [filter]);

  async function updateStage(id: number, stage: string) {
    const res = await fetch(`${API}/api/distribution-os/leads/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage }),
    });
    const updated = await res.json();
    setLeads(prev => prev.map(l => l.id === id ? updated : l));
  }

  const stages = ["all", "new", "qualified", "warm", "needs-followup", "proposal-candidate", "closed-won", "closed-lost"];

  return (
    <DistributionOsLayout currentPath={location}>
      <m.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2rem" }}>
          <div>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#e8e4de" }}>Leads</h1>
            <p style={{ fontSize: "0.8125rem", color: "#6b6560", marginTop: "0.25rem" }}>{leads.length} leads</p>
          </div>
        </div>

        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
          {stages.map(s => (
            <button key={s} onClick={() => setFilter(s)} style={{
              padding: "0.375rem 0.875rem", borderRadius: "6px", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer", textTransform: "uppercase", letterSpacing: "0.05em",
              background: filter === s ? "hsla(0,0%,100%,0.08)" : "transparent",
              color: filter === s ? "#e8e4de" : "#6b6560",
              border: filter === s ? "1px solid hsla(0,0%,100%,0.12)" : "1px solid transparent",
            }}>{s}</button>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {leads.map(lead => {
            const sc = STAGE_COLORS[lead.stage] || STAGE_COLORS.new;
            return (
              <div key={lead.id} style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "1rem 1.25rem", background: "hsla(0,0%,100%,0.02)", border: "1px solid hsla(0,0%,100%,0.05)", borderRadius: "8px" }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: "hsla(0,0%,100%,0.06)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Users size={16} style={{ color: "#8b8579" }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "0.9375rem", fontWeight: 600, color: "#e8e4de" }}>{lead.name || lead.email}</div>
                  <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.25rem", flexWrap: "wrap" }}>
                    {lead.company && <span style={{ display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.6875rem", color: "#6b6560" }}><Building2 size={10} />{lead.company}</span>}
                    <span style={{ display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.6875rem", color: "#6b6560" }}><Mail size={10} />{lead.email}</span>
                    {lead.source && <span style={{ fontSize: "0.6875rem", color: "#4a4540" }}>via {lead.source}</span>}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                  <Star size={12} style={{ color: lead.score >= 30 ? "#d4a054" : "#4a4540" }} />
                  <span style={{ fontSize: "0.75rem", color: lead.score >= 30 ? "#d4a054" : "#6b6560", fontWeight: 600 }}>{lead.score}</span>
                </div>
                <select
                  value={lead.stage}
                  onChange={e => updateStage(lead.id, e.target.value)}
                  style={{ padding: "0.375rem 0.625rem", background: sc.bg, color: sc.text, border: "none", borderRadius: "4px", fontSize: "0.6875rem", fontWeight: 600, cursor: "pointer", textTransform: "uppercase" }}
                >
                  {stages.filter(s => s !== "all").map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            );
          })}
          {leads.length === 0 && (
            <div style={{ textAlign: "center", padding: "3rem", color: "#4a4540" }}>
              <UserPlus size={32} style={{ margin: "0 auto 1rem", opacity: 0.5 }} />
              <p>No leads yet. Leads are captured from your newsletter signup and contact forms.</p>
            </div>
          )}
        </div>
      </m.div>
    </DistributionOsLayout>
  );
}
