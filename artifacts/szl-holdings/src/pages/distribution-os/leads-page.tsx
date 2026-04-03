import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { m, AnimatePresence } from "framer-motion";
import {
  Users, UserPlus, Mail, Building2, Star, ChevronRight, MessageSquare,
  Download, Upload, X, ChevronUp, ChevronDown, Search, Filter,
  Edit3, Save, Plus, Loader2, AlertCircle, CheckCircle2, Clock,
  Tag, Globe, BarChart3, ExternalLink, Trash2,
} from "lucide-react";
import { DistributionOsLayout } from "./admin-dashboard";

const API = import.meta.env.VITE_API_URL || "";

interface Lead {
  id: number;
  name: string | null;
  email: string;
  company: string | null;
  role: string | null;
  interestArea: string | null;
  budget: string | null;
  message: string | null;
  source: string | null;
  medium: string | null;
  campaign: string | null;
  landingPage: string | null;
  stage: string;
  score: number;
  tags: string[] | null;
  owner: string | null;
  nextFollowUp: string | null;
  lastAction: string | null;
  createdAt: string;
  updatedAt: string;
}

interface LeadNote {
  id: number;
  leadId: number;
  note: string;
  createdBy: string | null;
  createdAt: string;
}

type SortKey = "createdAt" | "score" | "name" | "stage";
type SortDir = "asc" | "desc";

const STAGES = ["new", "qualified", "warm", "needs-followup", "proposal-candidate", "closed-won", "closed-lost"];

const STAGE_META: Record<string, { color: string; bg: string; label: string }> = {
  "new": { color: "#4a90b8", bg: "hsla(210,50%,50%,0.12)", label: "New" },
  "qualified": { color: "#5a9c5a", bg: "hsla(120,30%,40%,0.12)", label: "Qualified" },
  "warm": { color: "#d4a054", bg: "hsla(40,60%,50%,0.12)", label: "Warm" },
  "needs-followup": { color: "#c8953c", bg: "hsla(30,60%,50%,0.12)", label: "Needs Follow-up" },
  "proposal-candidate": { color: "#8b7ac8", bg: "hsla(270,40%,50%,0.12)", label: "Proposal Candidate" },
  "closed-won": { color: "#5a9c5a", bg: "hsla(120,40%,35%,0.15)", label: "Closed Won" },
  "closed-lost": { color: "#8b8579", bg: "hsla(0,0%,100%,0.04)", label: "Closed Lost" },
};

function scoreColor(score: number) {
  if (score >= 50) return "#5a9c5a";
  if (score >= 25) return "#d4a054";
  return "#8b8579";
}

function StageBadge({ stage }: { stage: string }) {
  const meta = STAGE_META[stage] || STAGE_META.new;
  return (
    <span style={{ fontSize: "0.6875rem", fontWeight: 700, color: meta.color, background: meta.bg, padding: "0.2rem 0.625rem", borderRadius: "100px", whiteSpace: "nowrap" }}>
      {meta.label}
    </span>
  );
}

function ScoreBadge({ score }: { score: number }) {
  return (
    <span style={{ fontSize: "0.6875rem", fontWeight: 700, color: scoreColor(score), background: "hsla(0,0%,100%,0.05)", padding: "0.2rem 0.625rem", borderRadius: "6px", fontVariantNumeric: "tabular-nums" }}>
      {score}
    </span>
  );
}

function exportCsv(leads: Lead[]) {
  const headers = ["ID", "Name", "Email", "Company", "Role", "Interest Area", "Budget", "Source", "Medium", "Campaign", "Landing Page", "Stage", "Score", "Tags", "Created"];
  const rows = leads.map(l => [
    l.id, l.name || "", l.email, l.company || "", l.role || "", l.interestArea || "",
    l.budget || "", l.source || "", l.medium || "", l.campaign || "", l.landingPage || "",
    l.stage, l.score, (l.tags || []).join("|"), l.createdAt,
  ]);
  const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = "leads.csv"; a.click();
  URL.revokeObjectURL(url);
}

function iField(label: string, value: string, onChange: (v: string) => void, type = "text") {
  return (
    <div key={label}>
      <div style={{ fontSize: "0.6875rem", color: "#4a4540", fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: "0.25rem" }}>{label}</div>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{ width: "100%", padding: "0.4rem 0.625rem", background: "hsla(0,0%,100%,0.04)", border: "1px solid hsla(0,0%,100%,0.1)", borderRadius: "5px", color: "#e8e4de", fontSize: "0.8125rem", boxSizing: "border-box" as const }}
      />
    </div>
  );
}

function LeadDetailModal({ lead, onClose, onUpdate, onDelete }: { lead: Lead; onClose: () => void; onUpdate: (updated: Lead) => void; onDelete: (id: number) => void }) {
  const [stage, setStage] = useState(lead.stage);
  const [profile, setProfile] = useState({
    name: lead.name || "",
    email: lead.email,
    company: lead.company || "",
    role: lead.role || "",
    interestArea: lead.interestArea || "",
    budget: lead.budget || "",
    source: lead.source || "",
    medium: lead.medium || "",
    campaign: lead.campaign || "",
    landingPage: lead.landingPage || "",
    message: lead.message || "",
    owner: lead.owner || "",
    lastAction: lead.lastAction || "",
    nextFollowUp: lead.nextFollowUp ? lead.nextFollowUp.split("T")[0] : "",
  });
  const [notes, setNotes] = useState<LeadNote[]>([]);
  const [newNote, setNewNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [addingNote, setAddingNote] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [dirty, setDirty] = useState(false);

  const set = (key: keyof typeof profile) => (v: string) => { setProfile(p => ({ ...p, [key]: v })); setDirty(true); };

  useEffect(() => {
    fetch(`${API}/api/distribution-os/leads/${lead.id}/notes`)
      .then(r => r.json()).then(setNotes).catch(() => {});
  }, [lead.id]);

  async function saveAll() {
    setSaving(true);
    const payload: Record<string, unknown> = {
      ...profile,
      stage,
      name: profile.name || null,
      company: profile.company || null,
      role: profile.role || null,
      interestArea: profile.interestArea || null,
      budget: profile.budget || null,
      source: profile.source || null,
      medium: profile.medium || null,
      campaign: profile.campaign || null,
      landingPage: profile.landingPage || null,
      message: profile.message || null,
      owner: profile.owner || null,
      lastAction: profile.lastAction || null,
      nextFollowUp: profile.nextFollowUp ? new Date(profile.nextFollowUp).toISOString() : null,
    };
    const res = await fetch(`${API}/api/distribution-os/leads/${lead.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const updated = await res.json();
    onUpdate(updated);
    setSaving(false);
    setDirty(false);
  }

  async function deleteLead() {
    if (!confirm(`Delete lead "${lead.name || lead.email}"? This cannot be undone.`)) return;
    setDeleting(true);
    await fetch(`${API}/api/distribution-os/leads/${lead.id}`, { method: "DELETE" });
    onDelete(lead.id);
    onClose();
  }

  async function addNote() {
    if (!newNote.trim()) return;
    setAddingNote(true);
    const res = await fetch(`${API}/api/distribution-os/leads/${lead.id}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note: newNote.trim(), createdBy: profile.owner || "Stephen" }),
    });
    const note = await res.json();
    setNotes(prev => [note, ...prev]);
    setNewNote("");
    setAddingNote(false);
  }

  return (
    <m.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.72)", backdropFilter: "blur(4px)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "1.25rem" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <m.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        style={{ background: "#0d1117", border: "1px solid hsla(0,0%,100%,0.1)", borderRadius: "12px", width: "100%", maxWidth: "740px", maxHeight: "92vh", overflowY: "auto", display: "flex", flexDirection: "column" }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1.125rem 1.5rem", borderBottom: "1px solid hsla(0,0%,100%,0.06)", flexShrink: 0 }}>
          <div>
            <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#e8e4de" }}>{lead.name || lead.email}</h2>
            <p style={{ fontSize: "0.75rem", color: "#6b6560", marginTop: "0.1rem" }}>{lead.email} · Added {new Date(lead.createdAt).toLocaleDateString()}</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
            <ScoreBadge score={lead.score} />
            <StageBadge stage={lead.stage} />
            <button onClick={deleteLead} disabled={deleting} title="Delete lead" style={{ padding: "0.375rem", background: "none", border: "1px solid hsla(0,70%,55%,0.25)", borderRadius: "5px", color: "#c45a4a", cursor: "pointer", display: "flex", alignItems: "center" }}>
              {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
            </button>
            <button onClick={onClose} style={{ padding: "0.375rem", background: "none", border: "none", color: "#6b6560", cursor: "pointer" }}><X size={17} /></button>
          </div>
        </div>

        <div style={{ overflowY: "auto", flex: 1 }}>
          {/* CRM Quick Fields */}
          <div style={{ padding: "1.125rem 1.5rem", borderBottom: "1px solid hsla(0,0%,100%,0.05)" }}>
            <div style={{ fontSize: "0.6875rem", color: "#4a4540", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.75rem" }}>CRM Quick Fields</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.625rem" }}>
              {iField("Owner", profile.owner, set("owner"))}
              {iField("Last Action", profile.lastAction, set("lastAction"))}
              {iField("Next Follow-up", profile.nextFollowUp, set("nextFollowUp"), "date")}
            </div>
          </div>

          {/* Pipeline Stage */}
          <div style={{ padding: "1rem 1.5rem", borderBottom: "1px solid hsla(0,0%,100%,0.05)" }}>
            <div style={{ fontSize: "0.6875rem", color: "#4a4540", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.625rem" }}>Pipeline Stage</div>
            <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
              {STAGES.map(s => {
                const sm = STAGE_META[s];
                return (
                  <button key={s} onClick={() => { setStage(s); setDirty(true); }} style={{
                    padding: "0.275rem 0.7rem", borderRadius: "100px", fontSize: "0.6875rem", fontWeight: 700, cursor: "pointer", transition: "all 0.15s",
                    color: stage === s ? sm.color : "#4a4540",
                    background: stage === s ? sm.bg : "transparent",
                    border: stage === s ? `1px solid ${sm.color}40` : "1px solid hsla(0,0%,100%,0.06)",
                  }}>
                    {sm.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Full Profile — Editable */}
          <div style={{ padding: "1rem 1.5rem", borderBottom: "1px solid hsla(0,0%,100%,0.05)" }}>
            <div style={{ fontSize: "0.6875rem", color: "#4a4540", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.75rem" }}>Lead Profile</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.625rem" }}>
              {iField("Name", profile.name, set("name"))}
              {iField("Email", profile.email, set("email"), "email")}
              {iField("Company", profile.company, set("company"))}
              {iField("Role", profile.role, set("role"))}
              {iField("Interest Area", profile.interestArea, set("interestArea"))}
              {iField("Budget", profile.budget, set("budget"))}
              {iField("Source", profile.source, set("source"))}
              {iField("Medium", profile.medium, set("medium"))}
              {iField("Campaign", profile.campaign, set("campaign"))}
              {iField("Landing Page", profile.landingPage, set("landingPage"))}
            </div>
            <div style={{ marginTop: "0.625rem" }}>
              <div style={{ fontSize: "0.6875rem", color: "#4a4540", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.25rem" }}>Message</div>
              <textarea
                value={profile.message}
                onChange={e => { setProfile(p => ({ ...p, message: e.target.value })); setDirty(true); }}
                rows={3}
                style={{ width: "100%", padding: "0.4rem 0.625rem", background: "hsla(0,0%,100%,0.04)", border: "1px solid hsla(0,0%,100%,0.1)", borderRadius: "5px", color: "#e8e4de", fontSize: "0.8125rem", resize: "vertical", boxSizing: "border-box" }}
              />
            </div>
          </div>

          {/* Save bar */}
          {dirty && (
            <div style={{ padding: "0.75rem 1.5rem", background: "hsla(40,60%,50%,0.07)", borderBottom: "1px solid hsla(40,60%,50%,0.15)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: "0.75rem", color: "#d4a054" }}>Unsaved changes</span>
              <button onClick={saveAll} disabled={saving} style={{ display: "flex", alignItems: "center", gap: "0.375rem", padding: "0.45rem 1rem", background: "#d4a054", border: "none", borderRadius: "6px", color: "#070a10", fontWeight: 700, fontSize: "0.75rem", cursor: "pointer" }}>
                {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />} Save Changes
              </button>
            </div>
          )}

          {/* Notes */}
          <div style={{ padding: "1rem 1.5rem" }}>
            <div style={{ fontSize: "0.6875rem", color: "#4a4540", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.75rem" }}>Notes</div>
            <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.75rem" }}>
              <input
                value={newNote}
                onChange={e => setNewNote(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); addNote(); } }}
                placeholder="Add a note... (Enter to save)"
                style={{ flex: 1, padding: "0.45rem 0.7rem", background: "hsla(0,0%,100%,0.04)", border: "1px solid hsla(0,0%,100%,0.08)", borderRadius: "6px", color: "#e8e4de", fontSize: "0.8125rem" }}
              />
              <button onClick={addNote} disabled={addingNote || !newNote.trim()} style={{ padding: "0.45rem 0.875rem", background: "#d4a054", border: "none", borderRadius: "6px", color: "#070a10", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center" }}>
                {addingNote ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", maxHeight: "180px", overflowY: "auto" }}>
              {notes.length === 0 && <p style={{ fontSize: "0.75rem", color: "#4a4540" }}>No notes yet.</p>}
              {notes.map(n => (
                <div key={n.id} style={{ padding: "0.625rem 0.75rem", background: "hsla(0,0%,100%,0.02)", border: "1px solid hsla(0,0%,100%,0.05)", borderRadius: "6px" }}>
                  <p style={{ fontSize: "0.8125rem", color: "#e8e4de", marginBottom: "0.25rem" }}>{n.note}</p>
                  <p style={{ fontSize: "0.6875rem", color: "#4a4540" }}>
                    {n.createdBy && <>{n.createdBy} · </>}{new Date(n.createdAt).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </m.div>
    </m.div>
  );
}

function CsvImportModal({ onClose, onImported }: { onClose: () => void; onImported: (leads: Lead[]) => void }) {
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [importing, setImporting] = useState(false);
  const [done, setDone] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const DOS_FIELDS = ["name", "email", "company", "role", "interestArea", "budget", "message", "source", "medium", "campaign", "landingPage"];

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const text = ev.target?.result as string;
      const lines = text.split("\n").filter(l => l.trim());
      if (!lines.length) return;
      const hdrs = lines[0].split(",").map(h => h.replace(/^"|"$/g, "").trim());
      setHeaders(hdrs);
      const autoMap: Record<string, string> = {};
      hdrs.forEach(h => {
        const lower = h.toLowerCase().replace(/[\s_-]+/g, "");
        if (lower.includes("email")) autoMap[h] = "email";
        else if (lower.includes("name")) autoMap[h] = "name";
        else if (lower.includes("company")) autoMap[h] = "company";
        else if (lower.includes("role") || lower.includes("title")) autoMap[h] = "role";
        else if (lower.includes("source")) autoMap[h] = "source";
        else if (lower.includes("campaign")) autoMap[h] = "campaign";
        else if (lower.includes("budget")) autoMap[h] = "budget";
        else if (lower.includes("message") || lower.includes("note")) autoMap[h] = "message";
      });
      setMapping(autoMap);
      const dataRows = lines.slice(1).map(line => {
        const vals = line.split(",").map(v => v.replace(/^"|"$/g, "").trim());
        const obj: Record<string, string> = {};
        hdrs.forEach((h, i) => { obj[h] = vals[i] || ""; });
        return obj;
      });
      setRows(dataRows);
    };
    reader.readAsText(file);
  }

  async function importLeads() {
    setImporting(true);
    const imported: Lead[] = [];
    for (const row of rows) {
      const body: Record<string, string> = {};
      Object.entries(mapping).forEach(([csvCol, field]) => {
        if (field && row[csvCol]) body[field] = row[csvCol];
      });
      if (!body.email) continue;
      try {
        const res = await fetch(`${API}/api/distribution-os/leads`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const lead = await res.json();
        imported.push(lead);
      } catch {}
    }
    onImported(imported);
    setDone(true);
    setImporting(false);
  }

  return (
    <m.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <m.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        style={{ background: "#0d1117", border: "1px solid hsla(0,0%,100%,0.1)", borderRadius: "12px", width: "100%", maxWidth: "560px", maxHeight: "90vh", overflowY: "auto" }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1.25rem 1.5rem", borderBottom: "1px solid hsla(0,0%,100%,0.06)" }}>
          <div>
            <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#e8e4de" }}>Import Leads from CSV</h2>
            <p style={{ fontSize: "0.75rem", color: "#6b6560" }}>Map columns to lead fields. Email is required.</p>
          </div>
          <button onClick={onClose} style={{ padding: "0.375rem", background: "none", border: "none", color: "#6b6560", cursor: "pointer" }}><X size={18} /></button>
        </div>

        <div style={{ padding: "1.5rem" }}>
          {done ? (
            <div style={{ textAlign: "center", padding: "2rem" }}>
              <CheckCircle2 size={32} style={{ color: "#5a9c5a", margin: "0 auto 0.75rem" }} />
              <p style={{ color: "#e8e4de", fontWeight: 600 }}>Import complete!</p>
              <button onClick={onClose} style={{ marginTop: "1rem", padding: "0.5rem 1.25rem", background: "#d4a054", border: "none", borderRadius: "6px", color: "#070a10", fontWeight: 700, cursor: "pointer" }}>Close</button>
            </div>
          ) : rows.length === 0 ? (
            <div>
              <div
                onClick={() => fileRef.current?.click()}
                style={{ border: "2px dashed hsla(0,0%,100%,0.1)", borderRadius: "10px", padding: "2.5rem", textAlign: "center", cursor: "pointer", transition: "border-color 0.15s" }}
              >
                <Upload size={28} style={{ color: "#4a4540", margin: "0 auto 0.75rem" }} />
                <p style={{ color: "#8b8579", fontSize: "0.875rem" }}>Click to select a CSV file</p>
                <p style={{ color: "#4a4540", fontSize: "0.75rem", marginTop: "0.25rem" }}>Supports Linktree and standard lead exports</p>
              </div>
              <input ref={fileRef} type="file" accept=".csv" onChange={handleFile} style={{ display: "none" }} />
            </div>
          ) : (
            <div>
              <div style={{ marginBottom: "1rem", padding: "0.625rem 0.875rem", background: "hsla(120,30%,40%,0.1)", border: "1px solid hsla(120,30%,40%,0.2)", borderRadius: "6px" }}>
                <p style={{ fontSize: "0.75rem", color: "#5a9c5a" }}>{rows.length} rows detected. Map columns below.</p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1.25rem" }}>
                {headers.map(h => (
                  <div key={h} style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <span style={{ fontSize: "0.8125rem", color: "#e8e4de", minWidth: "160px" }}>{h}</span>
                    <select
                      value={mapping[h] || ""}
                      onChange={e => setMapping(p => ({ ...p, [h]: e.target.value }))}
                      style={{ flex: 1, padding: "0.375rem 0.625rem", background: "hsla(0,0%,100%,0.04)", border: "1px solid hsla(0,0%,100%,0.1)", borderRadius: "6px", color: "#e8e4de", fontSize: "0.8125rem" }}
                    >
                      <option value="">(skip)</option>
                      {DOS_FIELDS.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </div>
                ))}
              </div>
              <button onClick={importLeads} disabled={importing} style={{ width: "100%", padding: "0.625rem", background: "linear-gradient(135deg, #d4a054, #c8953c)", border: "none", borderRadius: "8px", color: "#070a10", fontWeight: 700, fontSize: "0.875rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
                {importing ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
                {importing ? "Importing..." : `Import ${rows.length} Leads`}
              </button>
            </div>
          )}
        </div>
      </m.div>
    </m.div>
  );
}

function ManualLeadModal({ onClose, onCreated }: { onClose: () => void; onCreated: (lead: Lead) => void }) {
  const [form, setForm] = useState({ name: "", email: "", company: "", role: "", interestArea: "", budget: "", message: "", source: "", medium: "", campaign: "", landingPage: "", owner: "Stephen", stage: "new" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const s = (key: keyof typeof form) => (v: string) => setForm(p => ({ ...p, [key]: v }));

  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.email.trim()) { setError("Email is required."); return; }
    if (!emailRe.test(form.email.trim())) { setError("Enter a valid email address."); return; }
    setSaving(true);
    try {
      const res = await fetch(`${API}/api/distribution-os/leads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          email: form.email.trim(),
          name: form.name || null,
          company: form.company || null,
          role: form.role || null,
          interestArea: form.interestArea || null,
          budget: form.budget || null,
          message: form.message || null,
          source: form.source || null,
          medium: form.medium || null,
          campaign: form.campaign || null,
          landingPage: form.landingPage || null,
          owner: form.owner || null,
          consent: true,
        }),
      });
      if (!res.ok) { const d = await res.json(); setError(d.error || "Failed to create lead."); setSaving(false); return; }
      const lead = await res.json();
      onCreated(lead);
      onClose();
    } catch { setError("Network error. Please try again."); }
    setSaving(false);
  }

  const inp = (label: string, key: keyof typeof form, type = "text", placeholder = "") => (
    <div>
      <div style={{ fontSize: "0.6875rem", color: "#4a4540", fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: "0.2rem" }}>{label}</div>
      <input
        type={type}
        value={form[key]}
        onChange={e => s(key)(e.target.value)}
        placeholder={placeholder}
        style={{ width: "100%", padding: "0.4rem 0.625rem", background: "hsla(0,0%,100%,0.04)", border: "1px solid hsla(0,0%,100%,0.1)", borderRadius: "5px", color: "#e8e4de", fontSize: "0.8125rem", boxSizing: "border-box" as const }}
      />
    </div>
  );

  return (
    <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.72)", backdropFilter: "blur(4px)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "1.25rem" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <m.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        style={{ background: "#0d1117", border: "1px solid hsla(0,0%,100%,0.1)", borderRadius: "12px", width: "100%", maxWidth: "580px", maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1.125rem 1.5rem", borderBottom: "1px solid hsla(0,0%,100%,0.06)" }}>
          <div>
            <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#e8e4de" }}>Add Lead Manually</h2>
            <p style={{ fontSize: "0.75rem", color: "#6b6560" }}>Manually enter a contact into the pipeline</p>
          </div>
          <button onClick={onClose} style={{ padding: "0.375rem", background: "none", border: "none", color: "#6b6560", cursor: "pointer" }}><X size={17} /></button>
        </div>
        <form onSubmit={submit} style={{ padding: "1.25rem 1.5rem", display: "flex", flexDirection: "column", gap: "0.875rem" }}>
          {error && <div style={{ padding: "0.625rem 0.875rem", background: "hsla(0,60%,50%,0.1)", border: "1px solid hsla(0,60%,50%,0.25)", borderRadius: "6px", color: "#c45a4a", fontSize: "0.8125rem" }}>{error}</div>}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.625rem" }}>
            {inp("Name", "name")}
            {inp("Email *", "email", "email", "contact@company.com")}
            {inp("Company", "company")}
            {inp("Role / Title", "role")}
            {inp("Interest Area", "interestArea", "text", "e.g. lyte, alloy, general")}
            {inp("Budget", "budget", "text", "e.g. 10k-25k")}
            {inp("Source", "source", "text", "e.g. linkedin, referral")}
            {inp("Medium", "medium")}
            {inp("Campaign", "campaign")}
            {inp("Landing Page", "landingPage")}
            {inp("Owner", "owner")}
          </div>
          <div>
            <div style={{ fontSize: "0.6875rem", color: "#4a4540", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.2rem" }}>Initial Stage</div>
            <div style={{ display: "flex", gap: "0.375rem", flexWrap: "wrap" }}>
              {STAGES.map(s => {
                const sm = STAGE_META[s];
                return (
                  <button type="button" key={s} onClick={() => setForm(p => ({ ...p, stage: s }))} style={{
                    padding: "0.25rem 0.65rem", borderRadius: "100px", fontSize: "0.6875rem", fontWeight: 700, cursor: "pointer",
                    color: form.stage === s ? sm.color : "#4a4540",
                    background: form.stage === s ? sm.bg : "transparent",
                    border: form.stage === s ? `1px solid ${sm.color}40` : "1px solid hsla(0,0%,100%,0.06)",
                  }}>{sm.label}</button>
                );
              })}
            </div>
          </div>
          <div>
            <div style={{ fontSize: "0.6875rem", color: "#4a4540", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.2rem" }}>Notes / Message</div>
            <textarea value={form.message} onChange={e => s("message")(e.target.value)} rows={3}
              style={{ width: "100%", padding: "0.4rem 0.625rem", background: "hsla(0,0%,100%,0.04)", border: "1px solid hsla(0,0%,100%,0.1)", borderRadius: "5px", color: "#e8e4de", fontSize: "0.8125rem", resize: "vertical", boxSizing: "border-box" }} />
          </div>
          <button type="submit" disabled={saving} style={{ padding: "0.625rem", background: "linear-gradient(135deg, #d4a054, #c8953c)", border: "none", borderRadius: "8px", color: "#070a10", fontWeight: 700, fontSize: "0.875rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
            {saving ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />}
            {saving ? "Saving..." : "Add Lead"}
          </button>
        </form>
      </m.div>
    </m.div>
  );
}

export default function LeadsPage() {
  const [location] = useLocation();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [stageFilter, setStageFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [campaignFilter, setCampaignFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [detail, setDetail] = useState<Lead | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [showManual, setShowManual] = useState(false);

  function fetchLeads() {
    setLoading(true);
    const params = new URLSearchParams();
    if (stageFilter !== "all") params.set("stage", stageFilter);
    const url = `${API}/api/distribution-os/leads${params.toString() ? "?" + params.toString() : ""}`;
    fetch(url)
      .then(r => r.json())
      .then(d => { setLeads(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }

  useEffect(() => { fetchLeads(); }, [stageFilter]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("desc"); }
  }

  function SortIcon({ k }: { k: SortKey }) {
    if (sortKey !== k) return <ChevronDown size={12} style={{ color: "#4a4540" }} />;
    return sortDir === "desc" ? <ChevronDown size={12} style={{ color: "#d4a054" }} /> : <ChevronUp size={12} style={{ color: "#d4a054" }} />;
  }

  const sources = ["all", ...Array.from(new Set(leads.filter(l => l.source).map(l => l.source!)))];
  const campaigns = ["all", ...Array.from(new Set(leads.filter(l => l.campaign).map(l => l.campaign!)))];

  const filtered = leads
    .filter(l => {
      if (sourceFilter !== "all" && l.source !== sourceFilter) return false;
      if (campaignFilter !== "all" && l.campaign !== campaignFilter) return false;
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        (l.name || "").toLowerCase().includes(q) ||
        l.email.toLowerCase().includes(q) ||
        (l.company || "").toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      let av: string | number = a[sortKey] as string | number;
      let bv: string | number = b[sortKey] as string | number;
      if (typeof av === "string") av = av.toLowerCase();
      if (typeof bv === "string") bv = bv.toLowerCase();
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

  async function quickStageUpdate(id: number, stage: string, e: React.MouseEvent) {
    e.stopPropagation();
    const res = await fetch(`${API}/api/distribution-os/leads/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage }),
    });
    const updated = await res.json();
    setLeads(prev => prev.map(l => l.id === id ? updated : l));
  }

  const needsFollowup = leads.filter(l => l.stage === "needs-followup").length;

  return (
    <DistributionOsLayout currentPath={location}>
      <m.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
          <div>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#e8e4de" }}>Lead Inbox</h1>
            <p style={{ fontSize: "0.8125rem", color: "#6b6560", marginTop: "0.25rem" }}>
              {filtered.length} leads · {needsFollowup > 0 && <span style={{ color: "#c45a4a" }}>{needsFollowup} need follow-up</span>}
            </p>
          </div>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <button onClick={() => setShowManual(true)} style={{ display: "flex", alignItems: "center", gap: "0.375rem", padding: "0.5rem 0.875rem", background: "linear-gradient(135deg, #d4a054, #c8953c)", border: "none", borderRadius: "6px", color: "#070a10", fontWeight: 700, fontSize: "0.75rem", cursor: "pointer" }}>
              <UserPlus size={13} /> Add Lead
            </button>
            <button onClick={() => setShowImport(true)} style={{ display: "flex", alignItems: "center", gap: "0.375rem", padding: "0.5rem 0.875rem", background: "hsla(0,0%,100%,0.05)", border: "1px solid hsla(0,0%,100%,0.08)", borderRadius: "6px", color: "#8b8579", fontSize: "0.75rem", cursor: "pointer" }}>
              <Upload size={13} /> Import CSV
            </button>
            <button onClick={() => exportCsv(filtered)} style={{ display: "flex", alignItems: "center", gap: "0.375rem", padding: "0.5rem 0.875rem", background: "hsla(0,0%,100%,0.05)", border: "1px solid hsla(0,0%,100%,0.08)", borderRadius: "6px", color: "#8b8579", fontSize: "0.75rem", cursor: "pointer" }}>
              <Download size={13} /> Export CSV
            </button>
          </div>
        </div>

        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem", flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ position: "relative" }}>
            <Search size={13} style={{ position: "absolute", left: "0.625rem", top: "50%", transform: "translateY(-50%)", color: "#4a4540" }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search leads..."
              style={{ paddingLeft: "2rem", paddingRight: "0.75rem", paddingTop: "0.375rem", paddingBottom: "0.375rem", background: "hsla(0,0%,100%,0.04)", border: "1px solid hsla(0,0%,100%,0.08)", borderRadius: "6px", color: "#e8e4de", fontSize: "0.8125rem", minWidth: "200px" }}
            />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
            <Filter size={12} style={{ color: "#4a4540" }} />
            <select value={sourceFilter} onChange={e => setSourceFilter(e.target.value)} style={{ padding: "0.375rem 0.625rem", background: "hsla(0,0%,100%,0.04)", border: "1px solid hsla(0,0%,100%,0.08)", borderRadius: "6px", color: "#e8e4de", fontSize: "0.75rem" }}>
              {sources.map(s => <option key={s} value={s}>{s === "all" ? "All Sources" : s}</option>)}
            </select>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
            <Tag size={12} style={{ color: "#4a4540" }} />
            <select value={campaignFilter} onChange={e => setCampaignFilter(e.target.value)} style={{ padding: "0.375rem 0.625rem", background: "hsla(0,0%,100%,0.04)", border: "1px solid hsla(0,0%,100%,0.08)", borderRadius: "6px", color: "#e8e4de", fontSize: "0.75rem", maxWidth: "180px" }}>
              {campaigns.map(c => <option key={c} value={c}>{c === "all" ? "All Campaigns" : c}</option>)}
            </select>
          </div>
        </div>

        <div style={{ display: "flex", gap: "0.375rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
          {["all", ...STAGES].map(s => {
            const meta = STAGE_META[s];
            const active = stageFilter === s;
            return (
              <button key={s} onClick={() => setStageFilter(s)} style={{
                padding: "0.3rem 0.75rem", borderRadius: "100px", fontSize: "0.6875rem", fontWeight: 700, cursor: "pointer",
                color: active ? (meta?.color || "#e8e4de") : "#4a4540",
                background: active ? (meta?.bg || "hsla(0,0%,100%,0.08)") : "transparent",
                border: active ? `1px solid ${meta?.color || "#e8e4de"}40` : "1px solid hsla(0,0%,100%,0.06)",
                textTransform: "uppercase", letterSpacing: "0.05em",
              }}>
                {meta?.label || "All"}
              </button>
            );
          })}
        </div>

        {loading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "4rem" }}>
            <Loader2 size={24} style={{ color: "#d4a054" }} className="animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "4rem", color: "#4a4540" }}>
            <Users size={32} style={{ margin: "0 auto 1rem", color: "#4a4540" }} />
            <p style={{ fontSize: "0.875rem" }}>No leads found.</p>
          </div>
        ) : (
          <div style={{ background: "hsla(0,0%,100%,0.02)", border: "1px solid hsla(0,0%,100%,0.06)", borderRadius: "10px", overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1.5fr 1fr 1fr 80px", gap: "0.5rem", padding: "0.625rem 1rem", borderBottom: "1px solid hsla(0,0%,100%,0.06)", background: "hsla(0,0%,100%,0.02)" }}>
              {[
                { label: "Lead", key: "name" as SortKey },
                { label: "Company / Source", key: null },
                { label: "Stage", key: "stage" as SortKey },
                { label: "Score", key: "score" as SortKey },
                { label: "Date", key: "createdAt" as SortKey },
              ].map(col => (
                <div
                  key={col.label}
                  onClick={() => col.key && toggleSort(col.key)}
                  style={{ display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.6875rem", fontWeight: 700, color: "#4a4540", textTransform: "uppercase", letterSpacing: "0.05em", cursor: col.key ? "pointer" : "default" }}
                >
                  {col.label}
                  {col.key && <SortIcon k={col.key} />}
                </div>
              ))}
            </div>
            {filtered.map(lead => (
              <div
                key={lead.id}
                onClick={() => setDetail(lead)}
                style={{ display: "grid", gridTemplateColumns: "2fr 1.5fr 1fr 1fr 80px", gap: "0.5rem", alignItems: "center", padding: "0.75rem 1rem", borderBottom: "1px solid hsla(0,0%,100%,0.04)", cursor: "pointer", transition: "background 0.15s" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "hsla(0,0%,100%,0.03)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
              >
                <div>
                  <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "#e8e4de" }}>{lead.name || "—"}</div>
                  <div style={{ fontSize: "0.75rem", color: "#6b6560" }}>{lead.email}</div>
                </div>
                <div>
                  <div style={{ fontSize: "0.8125rem", color: "#e8e4de" }}>{lead.company || "—"}</div>
                  {lead.source && <div style={{ fontSize: "0.6875rem", color: "#4a4540" }}>{lead.source}</div>}
                </div>
                <div onClick={e => e.stopPropagation()}>
                  <select
                    value={lead.stage}
                    onChange={e => quickStageUpdate(lead.id, e.target.value, e as unknown as React.MouseEvent)}
                    style={{ padding: "0.25rem 0.375rem", background: "transparent", border: "none", color: STAGE_META[lead.stage]?.color || "#e8e4de", fontSize: "0.75rem", fontWeight: 700, cursor: "pointer" }}
                    onClick={e => e.stopPropagation()}
                  >
                    {STAGES.map(s => <option key={s} value={s}>{STAGE_META[s].label}</option>)}
                  </select>
                </div>
                <div><ScoreBadge score={lead.score} /></div>
                <div style={{ fontSize: "0.6875rem", color: "#4a4540" }}>{new Date(lead.createdAt).toLocaleDateString()}</div>
              </div>
            ))}
          </div>
        )}
      </m.div>

      <AnimatePresence>
        {detail && (
          <LeadDetailModal
            lead={detail}
            onClose={() => setDetail(null)}
            onUpdate={updated => {
              setLeads(prev => prev.map(l => l.id === updated.id ? updated : l));
              setDetail(updated);
            }}
            onDelete={id => {
              setLeads(prev => prev.filter(l => l.id !== id));
              setDetail(null);
            }}
          />
        )}
        {showImport && (
          <CsvImportModal
            onClose={() => setShowImport(false)}
            onImported={imported => {
              setLeads(prev => [...imported, ...prev]);
              setShowImport(false);
            }}
          />
        )}
        {showManual && (
          <ManualLeadModal
            onClose={() => setShowManual(false)}
            onCreated={lead => {
              setLeads(prev => [lead, ...prev]);
            }}
          />
        )}
      </AnimatePresence>
    </DistributionOsLayout>
  );
}
