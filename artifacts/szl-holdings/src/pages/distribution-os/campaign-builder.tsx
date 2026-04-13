import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { m } from "framer-motion";
import {
  Mail, Plus, Send, Trash2, ChevronDown, ChevronUp, BarChart2,
  Users, Calendar, AlertCircle, CheckCircle, Loader2, Eye, MousePointer, TrendingDown
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

interface Campaign {
  id: number;
  name: string;
  status: string;
  sentAt: string | null;
  recipientCount: number;
  openRate: string | null;
  clickRate: string | null;
  openCount: number;
  clickCount: number;
  bounceCount: number;
  unsubscribeCount: number;
  subjectLineA: string;
  subjectLineB: string | null;
  segmentFilters: Record<string, unknown>;
  scheduledAt: string | null;
  createdAt: string;
}

interface Segment {
  id: number;
  name: string;
  memberCount: number;
  filters: Record<string, unknown>;
}

interface DashboardData {
  summary: {
    totalCampaigns: number;
    totalSent: number;
    avgOpenRate: string;
    avgClickRate: string;
    avgBounceRate: string;
    unsubRate: string;
    totalOpens: number;
    totalClicks: number;
    totalUnsubscribes: number;
  };
  bestSendTime: string | null;
  campaigns: Campaign[];
}

function statusBadge(status: string) {
  const colors: Record<string, { bg: string; color: string }> = {
    draft: { bg: "hsla(0,0%,100%,0.06)", color: "#6b6560" },
    scheduled: { bg: "hsla(210,50%,40%,0.15)", color: "#4a90b8" },
    sending: { bg: "hsla(45,60%,40%,0.15)", color: "#d4a054" },
    sent: { bg: "hsla(120,30%,30%,0.15)", color: "#5a9c5a" },
    paused: { bg: "hsla(0,0%,100%,0.06)", color: "#8b8579" },
    cancelled: { bg: "hsla(0,30%,30%,0.15)", color: "#c45a4a" },
  };
  const c = colors[status] || colors.draft;
  return <span style={{ padding: "0.25rem 0.625rem", borderRadius: "4px", background: c.bg, color: c.color, fontSize: "0.6875rem", fontWeight: 600, textTransform: "uppercase" }}>{status}</span>;
}

export default function CampaignBuilderPage() {
  const [location] = useLocation();
  const [view, setView] = useState<"dashboard" | "builder" | "detail">("dashboard");
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [selected, setSelected] = useState<Campaign | null>(null);
  const [sending, setSending] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);

  // Builder form state
  const [form, setForm] = useState({
    name: "",
    subjectLineA: "",
    subjectLineB: "",
    htmlBody: "",
    plainTextBody: "",
    fromName: "SZL Holdings",
    fromEmail: "inquiries@szlholdings.com",
    segmentFilters: {} as Record<string, unknown>,
    scheduledAt: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [filterStage, setFilterStage] = useState<string[]>([]);
  const [filterScoreMin, setFilterScoreMin] = useState("");

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    Promise.all([
      fetch(`${API}/api/distribution-os/email-campaigns`, { credentials: "include", headers: { "x-csrf-token": getCsrfToken() } }).then(r => r.json()).catch(() => []),
      fetch(`${API}/api/distribution-os/segments`, { credentials: "include", headers: { "x-csrf-token": getCsrfToken() } }).then(r => r.json()).catch(() => []),
      fetch(`${API}/api/distribution-os/campaign-dashboard`, { credentials: "include", headers: { "x-csrf-token": getCsrfToken() } }).then(r => r.json()).catch(() => null),
    ]).then(([cs, segs, dash]) => {
      setCampaigns(Array.isArray(cs) ? cs : []);
      setSegments(Array.isArray(segs) ? segs : []);
      setDashboard(dash);
    });
  }

  async function createCampaign() {
    setSaving(true);
    try {
      const filters: Record<string, unknown> = {};
      if (filterStage.length > 0) filters.stage = filterStage;
      if (filterScoreMin) filters.scoreMin = Number(filterScoreMin);

      const res = await fetch(`${API}/api/distribution-os/email-campaigns`, {
        method: "POST",
        credentials: "include",
        headers: writeHeaders(),
        body: JSON.stringify({ ...form, segmentFilters: filters }),
      });
      const c = await res.json();
      setCampaigns(prev => [c, ...prev]);
      setView("dashboard");
      resetForm();
    } catch {}
    setSaving(false);
  }

  async function sendCampaign(id: number) {
    if (!confirm("Send this campaign now to all matched leads?")) return;
    setSending(id);
    try {
      const res = await fetch(`${API}/api/distribution-os/email-campaigns/${id}/send`, {
        method: "POST",
        credentials: "include",
        headers: writeHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        setCampaigns(prev => prev.map(c => c.id === id ? { ...c, ...data.campaign } : c));
      } else {
        alert(`Send failed: ${data.error || "Unknown error"}`);
      }
    } catch {}
    setSending(null);
  }

  async function deleteCampaign(id: number) {
    if (!confirm("Delete this campaign?")) return;
    setDeleting(id);
    try {
      await fetch(`${API}/api/distribution-os/email-campaigns/${id}`, { method: "DELETE", credentials: "include", headers: { "x-csrf-token": getCsrfToken() } });
      setCampaigns(prev => prev.filter(c => c.id !== id));
    } catch {}
    setDeleting(null);
  }

  function resetForm() {
    setForm({ name: "", subjectLineA: "", subjectLineB: "", htmlBody: "", plainTextBody: "", fromName: "SZL Holdings", fromEmail: "inquiries@szlholdings.com", segmentFilters: {}, scheduledAt: "", notes: "" });
    setFilterStage([]);
    setFilterScoreMin("");
  }

  const tabStyle = (v: typeof view) => ({
    padding: "0.5rem 1rem",
    background: view === v ? "hsla(0,0%,100%,0.08)" : "transparent",
    border: `1px solid ${view === v ? "hsla(0,0%,100%,0.12)" : "transparent"}`,
    borderRadius: "6px",
    color: view === v ? "#e8e4de" : "#6b6560",
    fontSize: "0.8125rem",
    fontWeight: view === v ? 600 : 400,
    cursor: "pointer",
  });

  const dash = dashboard?.summary;

  return (
    <DistributionOsLayout currentPath={location}>
      <m.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem", flexWrap: "wrap", gap: "0.75rem" }}>
          <div>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#e8e4de" }}>Email Campaigns</h1>
            <p style={{ fontSize: "0.8125rem", color: "#6b6560", marginTop: "0.25rem" }}>Build, schedule, and analyze email campaigns with audience segmentation</p>
          </div>
          <button onClick={() => setView("builder")} style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.625rem 1.25rem", background: "linear-gradient(135deg, #d4a054, #c8953c)", color: "#070a10", border: "none", borderRadius: "8px", fontWeight: 600, fontSize: "0.8125rem", cursor: "pointer" }}>
            <Plus size={15} /> New Campaign
          </button>
        </div>

        {/* View tabs */}
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
          <button style={tabStyle("dashboard")} onClick={() => setView("dashboard")}><BarChart2 size={12} style={{ display: "inline", marginRight: "0.375rem" }} />Performance</button>
          <button style={tabStyle("builder")} onClick={() => setView("builder")}><Mail size={12} style={{ display: "inline", marginRight: "0.375rem" }} />Campaign Builder</button>
        </div>

        {/* DASHBOARD VIEW */}
        {view === "dashboard" && (
          <div>
            {/* KPI row */}
            {dash && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
                {[
                  { label: "Campaigns Sent", value: dash.totalCampaigns, icon: Mail, color: "#4a90b8" },
                  { label: "Emails Sent", value: dash.totalSent.toLocaleString(), icon: Send, color: "#8b7ac8" },
                  { label: "Avg Open Rate", value: `${dash.avgOpenRate}%`, icon: Eye, color: "#5a9c5a" },
                  { label: "Avg Click Rate", value: `${dash.avgClickRate}%`, icon: MousePointer, color: "#d4a054" },
                  { label: "Bounce Rate", value: `${dash.avgBounceRate}%`, icon: AlertCircle, color: "#c8953c" },
                  { label: "Unsub Rate", value: `${dash.unsubRate}%`, icon: TrendingDown, color: "#c45a4a" },
                ].map(({ label, value, icon: Icon, color }) => (
                  <div key={label} style={{ padding: "1.25rem", background: "hsla(0,0%,100%,0.02)", border: "1px solid hsla(0,0%,100%,0.05)", borderRadius: "8px" }}>
                    <Icon size={16} style={{ color, marginBottom: "0.625rem" }} />
                    <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#e8e4de" }}>{value}</div>
                    <div style={{ fontSize: "0.75rem", color: "#6b6560" }}>{label}</div>
                  </div>
                ))}
              </div>
            )}
            {dashboard?.bestSendTime && (
              <div style={{ padding: "0.875rem 1rem", background: "hsla(120,30%,20%,0.1)", border: "1px solid hsla(120,30%,40%,0.2)", borderRadius: "8px", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.625rem" }}>
                <Calendar size={14} style={{ color: "#5a9c5a" }} />
                <span style={{ fontSize: "0.8125rem", color: "#8b8579" }}>Best send time based on open rates: <strong style={{ color: "#e8e4de" }}>{dashboard.bestSendTime}</strong></span>
              </div>
            )}

            {/* Campaign list */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {campaigns.map(c => (
                <div key={c.id} style={{ padding: "1.25rem", background: "hsla(0,0%,100%,0.02)", border: "1px solid hsla(0,0%,100%,0.05)", borderRadius: "8px", display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
                  <Mail size={16} style={{ color: "#d4a054", flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: "200px" }}>
                    <div style={{ fontSize: "0.9375rem", fontWeight: 600, color: "#e8e4de" }}>{c.name}</div>
                    <div style={{ fontSize: "0.75rem", color: "#6b6560", marginTop: "0.125rem" }}>{c.subjectLineA}</div>
                  </div>
                  {statusBadge(c.status)}
                  {c.status === "sent" && (
                    <div style={{ display: "flex", gap: "1rem" }}>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: "0.875rem", fontWeight: 700, color: "#5a9c5a" }}>{c.openRate ?? "—"}%</div>
                        <div style={{ fontSize: "0.625rem", color: "#4a4540" }}>opens</div>
                      </div>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: "0.875rem", fontWeight: 700, color: "#d4a054" }}>{c.clickRate ?? "—"}%</div>
                        <div style={{ fontSize: "0.625rem", color: "#4a4540" }}>clicks</div>
                      </div>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: "0.875rem", fontWeight: 700, color: "#e8e4de" }}>{c.recipientCount.toLocaleString()}</div>
                        <div style={{ fontSize: "0.625rem", color: "#4a4540" }}>sent</div>
                      </div>
                    </div>
                  )}
                  <div style={{ display: "flex", gap: "0.375rem" }}>
                    {c.status === "draft" && (
                      <button
                        onClick={() => sendCampaign(c.id)}
                        disabled={sending === c.id}
                        style={{ display: "flex", alignItems: "center", gap: "0.375rem", padding: "0.375rem 0.75rem", background: "hsla(120,30%,30%,0.15)", border: "1px solid hsla(120,30%,40%,0.2)", borderRadius: "5px", color: "#5a9c5a", fontSize: "0.75rem", cursor: "pointer", fontWeight: 600 }}
                      >
                        {sending === c.id ? <Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} /> : <Send size={12} />}
                        Send
                      </button>
                    )}
                    <button onClick={() => deleteCampaign(c.id)} disabled={deleting === c.id} style={{ padding: "0.375rem", background: "none", border: "1px solid hsla(0,0%,100%,0.06)", borderRadius: "4px", color: "#c45a4a", cursor: "pointer" }}>
                      {deleting === c.id ? <Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} /> : <Trash2 size={12} />}
                    </button>
                  </div>
                </div>
              ))}
              {campaigns.length === 0 && (
                <div style={{ textAlign: "center", padding: "3rem", color: "#4a4540" }}>
                  <Mail size={32} style={{ margin: "0 auto 1rem", opacity: 0.4 }} />
                  <p>No campaigns yet. Create your first email campaign.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* BUILDER VIEW */}
        {view === "builder" && (
          <div style={{ maxWidth: "720px" }}>
            <h2 style={{ fontSize: "1.125rem", fontWeight: 600, color: "#e8e4de", marginBottom: "1.5rem" }}>Build Campaign</h2>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {/* Basic info */}
              <div style={{ padding: "1.5rem", background: "hsla(0,0%,100%,0.02)", border: "1px solid hsla(0,0%,100%,0.05)", borderRadius: "10px" }}>
                <h3 style={{ fontSize: "0.875rem", fontWeight: 600, color: "#e8e4de", marginBottom: "1rem" }}>Campaign Details</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.6875rem", color: "#6b6560", marginBottom: "0.375rem", textTransform: "uppercase" }}>Campaign Name *</label>
                    <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Q1 Founder Outreach" style={{ width: "100%", padding: "0.625rem 0.75rem", background: "hsla(0,0%,100%,0.04)", border: "1px solid hsla(0,0%,100%,0.08)", borderRadius: "6px", color: "#e8e4de", fontSize: "0.875rem", boxSizing: "border-box" }} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.6875rem", color: "#6b6560", marginBottom: "0.375rem", textTransform: "uppercase" }}>Subject Line A *</label>
                    <input value={form.subjectLineA} onChange={e => setForm(f => ({ ...f, subjectLineA: e.target.value }))} placeholder="How SZL Holdings is redefining business intelligence" style={{ width: "100%", padding: "0.625rem 0.75rem", background: "hsla(0,0%,100%,0.04)", border: "1px solid hsla(0,0%,100%,0.08)", borderRadius: "6px", color: "#e8e4de", fontSize: "0.875rem", boxSizing: "border-box" }} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.6875rem", color: "#6b6560", marginBottom: "0.375rem", textTransform: "uppercase" }}>Subject Line B (A/B test)</label>
                    <input value={form.subjectLineB} onChange={e => setForm(f => ({ ...f, subjectLineB: e.target.value }))} placeholder="Optional alternative subject for A/B testing" style={{ width: "100%", padding: "0.625rem 0.75rem", background: "hsla(0,0%,100%,0.04)", border: "1px solid hsla(0,0%,100%,0.08)", borderRadius: "6px", color: "#e8e4de", fontSize: "0.875rem", boxSizing: "border-box" }} />
                    {form.subjectLineB && <p style={{ fontSize: "0.6875rem", color: "#5a9c5a", marginTop: "0.25rem" }}>✓ A/B test enabled. Subject line will be randomly assigned 50/50.</p>}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "0.6875rem", color: "#6b6560", marginBottom: "0.375rem", textTransform: "uppercase" }}>From Name</label>
                      <input value={form.fromName} onChange={e => setForm(f => ({ ...f, fromName: e.target.value }))} style={{ width: "100%", padding: "0.625rem 0.75rem", background: "hsla(0,0%,100%,0.04)", border: "1px solid hsla(0,0%,100%,0.08)", borderRadius: "6px", color: "#e8e4de", fontSize: "0.875rem", boxSizing: "border-box" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.6875rem", color: "#6b6560", marginBottom: "0.375rem", textTransform: "uppercase" }}>From Email</label>
                      <input value={form.fromEmail} onChange={e => setForm(f => ({ ...f, fromEmail: e.target.value }))} style={{ width: "100%", padding: "0.625rem 0.75rem", background: "hsla(0,0%,100%,0.04)", border: "1px solid hsla(0,0%,100%,0.08)", borderRadius: "6px", color: "#e8e4de", fontSize: "0.875rem", boxSizing: "border-box" }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Audience segmentation */}
              <div style={{ padding: "1.5rem", background: "hsla(0,0%,100%,0.02)", border: "1px solid hsla(0,0%,100%,0.05)", borderRadius: "10px" }}>
                <h3 style={{ fontSize: "0.875rem", fontWeight: 600, color: "#e8e4de", marginBottom: "0.5rem" }}>Audience Segmentation</h3>
                <p style={{ fontSize: "0.75rem", color: "#6b6560", marginBottom: "1rem" }}>Filter leads from Distribution OS. Leave empty to send to all leads.</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.6875rem", color: "#6b6560", marginBottom: "0.375rem", textTransform: "uppercase" }}>Lead Stage</label>
                    <select multiple value={filterStage} onChange={e => setFilterStage([...e.target.selectedOptions].map(o => o.value))} style={{ width: "100%", padding: "0.5rem", background: "hsla(0,0%,100%,0.04)", border: "1px solid hsla(0,0%,100%,0.08)", borderRadius: "6px", color: "#e8e4de", fontSize: "0.8125rem", height: "80px" }}>
                      {["new", "qualified", "warm", "needs-followup", "proposal-candidate"].map(s => (
                        <option key={s} value={s} style={{ background: "#1a1a1a" }}>{s}</option>
                      ))}
                    </select>
                    <span style={{ fontSize: "0.625rem", color: "#4a4540" }}>Hold Ctrl/Cmd to select multiple</span>
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.6875rem", color: "#6b6560", marginBottom: "0.375rem", textTransform: "uppercase" }}>Min Lead Score</label>
                    <input type="number" value={filterScoreMin} onChange={e => setFilterScoreMin(e.target.value)} placeholder="0–100" min="0" max="100" style={{ width: "100%", padding: "0.625rem 0.75rem", background: "hsla(0,0%,100%,0.04)", border: "1px solid hsla(0,0%,100%,0.08)", borderRadius: "6px", color: "#e8e4de", fontSize: "0.875rem", boxSizing: "border-box" }} />
                  </div>
                </div>
                {segments.length > 0 && (
                  <div style={{ marginTop: "0.75rem" }}>
                    <label style={{ display: "block", fontSize: "0.6875rem", color: "#6b6560", marginBottom: "0.375rem", textTransform: "uppercase" }}>Saved Segments</label>
                    <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                      {segments.map(s => (
                        <button key={s.id} onClick={() => { setFilterStage((s.filters.stage as string[]) || []); setFilterScoreMin(String(s.filters.scoreMin || "")); }} style={{ padding: "0.25rem 0.625rem", background: "hsla(0,0%,100%,0.04)", border: "1px solid hsla(0,0%,100%,0.08)", borderRadius: "4px", color: "#8b8579", fontSize: "0.75rem", cursor: "pointer" }}>
                          {s.name} ({s.memberCount})
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Email body */}
              <div style={{ padding: "1.5rem", background: "hsla(0,0%,100%,0.02)", border: "1px solid hsla(0,0%,100%,0.05)", borderRadius: "10px" }}>
                <h3 style={{ fontSize: "0.875rem", fontWeight: 600, color: "#e8e4de", marginBottom: "1rem" }}>Email Content</h3>
                <div>
                  <label style={{ display: "block", fontSize: "0.6875rem", color: "#6b6560", marginBottom: "0.375rem", textTransform: "uppercase" }}>HTML Body *</label>
                  <textarea
                    value={form.htmlBody}
                    onChange={e => setForm(f => ({ ...f, htmlBody: e.target.value }))}
                    placeholder="Paste your HTML email template here..."
                    rows={10}
                    style={{ width: "100%", padding: "0.625rem 0.75rem", background: "hsla(0,0%,100%,0.04)", border: "1px solid hsla(0,0%,100%,0.08)", borderRadius: "6px", color: "#e8e4de", fontSize: "0.8125rem", fontFamily: "monospace", resize: "vertical", boxSizing: "border-box" }}
                  />
                </div>
                <div style={{ marginTop: "0.75rem" }}>
                  <label style={{ display: "block", fontSize: "0.6875rem", color: "#6b6560", marginBottom: "0.375rem", textTransform: "uppercase" }}>Plain Text (optional)</label>
                  <textarea
                    value={form.plainTextBody}
                    onChange={e => setForm(f => ({ ...f, plainTextBody: e.target.value }))}
                    placeholder="Plain text version for email clients that don't support HTML..."
                    rows={4}
                    style={{ width: "100%", padding: "0.625rem 0.75rem", background: "hsla(0,0%,100%,0.04)", border: "1px solid hsla(0,0%,100%,0.08)", borderRadius: "6px", color: "#e8e4de", fontSize: "0.8125rem", resize: "vertical", boxSizing: "border-box" }}
                  />
                </div>
              </div>

              {/* Schedule */}
              <div style={{ padding: "1.5rem", background: "hsla(0,0%,100%,0.02)", border: "1px solid hsla(0,0%,100%,0.05)", borderRadius: "10px" }}>
                <h3 style={{ fontSize: "0.875rem", fontWeight: 600, color: "#e8e4de", marginBottom: "1rem" }}>Schedule (optional)</h3>
                <input type="datetime-local" value={form.scheduledAt} onChange={e => setForm(f => ({ ...f, scheduledAt: e.target.value }))} style={{ padding: "0.625rem 0.75rem", background: "hsla(0,0%,100%,0.04)", border: "1px solid hsla(0,0%,100%,0.08)", borderRadius: "6px", color: "#e8e4de", fontSize: "0.875rem" }} />
                <p style={{ fontSize: "0.6875rem", color: "#4a4540", marginTop: "0.375rem" }}>Leave empty to send immediately when you click Send Campaign.</p>
              </div>

              <div style={{ display: "flex", gap: "0.75rem" }}>
                <button onClick={createCampaign} disabled={saving || !form.name || !form.subjectLineA || !form.htmlBody} style={{ padding: "0.75rem 1.75rem", background: "linear-gradient(135deg, #d4a054, #c8953c)", color: "#070a10", border: "none", borderRadius: "8px", fontWeight: 600, fontSize: "0.875rem", cursor: "pointer", opacity: saving || !form.name || !form.subjectLineA || !form.htmlBody ? 0.5 : 1 }}>
                  {saving ? "Saving…" : "Save Campaign (Draft)"}
                </button>
                <button onClick={() => { setView("dashboard"); resetForm(); }} style={{ padding: "0.75rem 1.25rem", background: "hsla(0,0%,100%,0.04)", border: "1px solid hsla(0,0%,100%,0.08)", borderRadius: "8px", color: "#8b8579", fontSize: "0.875rem", cursor: "pointer" }}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </m.div>
    </DistributionOsLayout>
  );
}
