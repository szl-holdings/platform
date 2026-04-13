import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { m } from "framer-motion";
import {
  Mail, Plus, Trash2, ChevronDown, ChevronUp, Play, Pause,
  Users, Clock, GitBranch, CheckCircle, Loader2, ArrowRight
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

interface DripStep {
  name: string;
  subjectLine: string;
  htmlBody: string;
  plainTextBody: string;
  delayDays: number;
  delayHours: number;
  condition: string;
}

interface DripSequence {
  id: number;
  name: string;
  slug: string;
  status: string;
  triggerEvent: string;
  totalEnrolled: number;
  totalCompleted: number;
  totalUnsubscribed: number;
  description: string | null;
  createdAt: string;
}

interface DripSequenceDetail extends DripSequence {
  steps: Array<DripStep & { id: number; stepNumber: number; sentCount: number; openCount: number; clickCount: number }>;
}

const TRIGGER_LABELS: Record<string, string> = {
  signup: "Newsletter Signup",
  demo_request: "Demo Request",
  pricing_visit: "Pricing Page Visit",
  article_view: "Article View",
  cta_click: "CTA Click",
  manual: "Manual Enrollment",
};

const CONDITION_LABELS: Record<string, string> = {
  always: "Always send",
  opened_previous: "Only if previous was opened",
  clicked_previous: "Only if previous was clicked",
  not_opened_previous: "Only if previous not opened",
  not_clicked_previous: "Only if previous not clicked",
};

function statusColor(s: string) {
  return s === "active" ? "#5a9c5a" : s === "paused" ? "#d4a054" : s === "archived" ? "#4a4540" : "#6b6560";
}

export default function DripSequencesPage() {
  const [location] = useLocation();
  const [sequences, setSequences] = useState<DripSequence[]>([]);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [detail, setDetail] = useState<DripSequenceDetail | null>(null);
  const [view, setView] = useState<"list" | "builder">("list");
  const [saving, setSaving] = useState(false);
  const [enrolling, setEnrolling] = useState<number | null>(null);
  const [enrollEmail, setEnrollEmail] = useState("");
  const [showEnrollForm, setShowEnrollForm] = useState<number | null>(null);

  // Builder form
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [triggerEvent, setTriggerEvent] = useState("signup");
  const [steps, setSteps] = useState<DripStep[]>([
    { name: "Welcome Email", subjectLine: "", htmlBody: "", plainTextBody: "", delayDays: 0, delayHours: 0, condition: "always" },
    { name: "Follow-up", subjectLine: "", htmlBody: "", plainTextBody: "", delayDays: 3, delayHours: 0, condition: "always" },
  ]);
  const [expandedStep, setExpandedStep] = useState<number | null>(0);

  useEffect(() => {
    loadSequences();
  }, []);

  async function loadSequences() {
    try {
      const r = await fetch(`${API}/api/distribution-os/drip-sequences`, { credentials: "include", headers: { "x-csrf-token": getCsrfToken() } });
      const data = await r.json();
      setSequences(Array.isArray(data) ? data : []);
    } catch {}
  }

  async function loadDetail(id: number) {
    try {
      const r = await fetch(`${API}/api/distribution-os/drip-sequences/${id}`, { credentials: "include", headers: { "x-csrf-token": getCsrfToken() } });
      setDetail(await r.json());
    } catch {}
  }

  async function toggleExpand(id: number) {
    if (expanded === id) { setExpanded(null); setDetail(null); return; }
    setExpanded(id);
    await loadDetail(id);
  }

  async function createSequence() {
    if (!name) return;
    setSaving(true);
    try {
      const res = await fetch(`${API}/api/distribution-os/drip-sequences`, {
        method: "POST",
        credentials: "include",
        headers: writeHeaders(),
        body: JSON.stringify({ name, description, triggerEvent, steps }),
      });
      const seq = await res.json();
      setSequences(prev => [seq, ...prev]);
      setView("list");
      resetBuilder();
    } catch {}
    setSaving(false);
  }

  async function updateStatus(id: number, status: string) {
    try {
      await fetch(`${API}/api/distribution-os/drip-sequences/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: writeHeaders(),
        body: JSON.stringify({ status }),
      });
      setSequences(prev => prev.map(s => s.id === id ? { ...s, status } : s));
    } catch {}
  }

  async function deleteSequence(id: number) {
    if (!confirm("Delete this drip sequence and all enrollments?")) return;
    try {
      await fetch(`${API}/api/distribution-os/drip-sequences/${id}`, { method: "DELETE", credentials: "include", headers: { "x-csrf-token": getCsrfToken() } });
      setSequences(prev => prev.filter(s => s.id !== id));
    } catch {}
  }

  async function enrollLead(seqId: number) {
    if (!enrollEmail) return;
    setEnrolling(seqId);
    try {
      await fetch(`${API}/api/distribution-os/drip-sequences/${seqId}/enroll`, {
        method: "POST",
        credentials: "include",
        headers: writeHeaders(),
        body: JSON.stringify({ email: enrollEmail }),
      });
      setEnrollEmail("");
      setShowEnrollForm(null);
      setSequences(prev => prev.map(s => s.id === seqId ? { ...s, totalEnrolled: s.totalEnrolled + 1 } : s));
    } catch {}
    setEnrolling(null);
  }

  function resetBuilder() {
    setName(""); setDescription(""); setTriggerEvent("signup");
    setSteps([
      { name: "Welcome Email", subjectLine: "", htmlBody: "", plainTextBody: "", delayDays: 0, delayHours: 0, condition: "always" },
      { name: "Follow-up", subjectLine: "", htmlBody: "", plainTextBody: "", delayDays: 3, delayHours: 0, condition: "always" },
    ]);
  }

  function updateStep(i: number, field: keyof DripStep, value: unknown) {
    setSteps(prev => prev.map((s, j) => j === i ? { ...s, [field]: value } : s));
  }

  const tabStyle = (v: "list" | "builder") => ({
    padding: "0.5rem 1rem",
    background: view === v ? "hsla(0,0%,100%,0.08)" : "transparent",
    border: `1px solid ${view === v ? "hsla(0,0%,100%,0.12)" : "transparent"}`,
    borderRadius: "6px",
    color: view === v ? "#e8e4de" : "#6b6560",
    fontSize: "0.8125rem",
    fontWeight: view === v ? 600 : 400,
    cursor: "pointer",
  });

  return (
    <DistributionOsLayout currentPath={location}>
      <m.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem", flexWrap: "wrap", gap: "0.75rem" }}>
          <div>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#e8e4de" }}>Drip Sequences</h1>
            <p style={{ fontSize: "0.8125rem", color: "#6b6560", marginTop: "0.25rem" }}>Multi-step email sequences triggered by lead actions, with conditional branching</p>
          </div>
          <button onClick={() => setView("builder")} style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.625rem 1.25rem", background: "linear-gradient(135deg, #d4a054, #c8953c)", color: "#070a10", border: "none", borderRadius: "8px", fontWeight: 600, fontSize: "0.8125rem", cursor: "pointer" }}>
            <Plus size={15} /> New Sequence
          </button>
        </div>

        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
          <button style={tabStyle("list")} onClick={() => setView("list")}><GitBranch size={12} style={{ display: "inline", marginRight: "0.375rem" }} />Sequences</button>
          <button style={tabStyle("builder")} onClick={() => setView("builder")}><Plus size={12} style={{ display: "inline", marginRight: "0.375rem" }} />Builder</button>
        </div>

        {/* LIST VIEW */}
        {view === "list" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {sequences.map(seq => (
              <div key={seq.id} style={{ background: "hsla(0,0%,100%,0.02)", border: "1px solid hsla(0,0%,100%,0.05)", borderRadius: "10px", overflow: "hidden" }}>
                <div style={{ padding: "1.25rem", display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
                  <GitBranch size={16} style={{ color: "#8b7ac8", flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: "200px" }}>
                    <div style={{ fontSize: "0.9375rem", fontWeight: 600, color: "#e8e4de" }}>{seq.name}</div>
                    <div style={{ fontSize: "0.75rem", color: "#6b6560", marginTop: "0.125rem" }}>Trigger: {TRIGGER_LABELS[seq.triggerEvent] || seq.triggerEvent}</div>
                  </div>
                  <div style={{ display: "flex", gap: "1.25rem", flexShrink: 0 }}>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: "1rem", fontWeight: 700, color: "#e8e4de" }}>{seq.totalEnrolled}</div>
                      <div style={{ fontSize: "0.625rem", color: "#4a4540" }}>enrolled</div>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: "1rem", fontWeight: 700, color: "#5a9c5a" }}>{seq.totalCompleted}</div>
                      <div style={{ fontSize: "0.625rem", color: "#4a4540" }}>completed</div>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: "1rem", fontWeight: 700, color: statusColor(seq.status) }}>{seq.status}</div>
                      <div style={{ fontSize: "0.625rem", color: "#4a4540" }}>status</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "0.375rem", flexShrink: 0 }}>
                    {seq.status === "draft" && (
                      <button onClick={() => updateStatus(seq.id, "active")} style={{ padding: "0.375rem 0.625rem", background: "hsla(120,30%,30%,0.12)", border: "1px solid hsla(120,30%,40%,0.2)", borderRadius: "5px", color: "#5a9c5a", fontSize: "0.75rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                        <Play size={11} /> Activate
                      </button>
                    )}
                    {seq.status === "active" && (
                      <button onClick={() => updateStatus(seq.id, "paused")} style={{ padding: "0.375rem 0.625rem", background: "hsla(45,50%,30%,0.12)", border: "1px solid hsla(45,50%,40%,0.2)", borderRadius: "5px", color: "#d4a054", fontSize: "0.75rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                        <Pause size={11} /> Pause
                      </button>
                    )}
                    {seq.status === "paused" && (
                      <button onClick={() => updateStatus(seq.id, "active")} style={{ padding: "0.375rem 0.625rem", background: "hsla(120,30%,30%,0.12)", border: "1px solid hsla(120,30%,40%,0.2)", borderRadius: "5px", color: "#5a9c5a", fontSize: "0.75rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                        <Play size={11} /> Resume
                      </button>
                    )}
                    <button onClick={() => setShowEnrollForm(showEnrollForm === seq.id ? null : seq.id)} style={{ padding: "0.375rem 0.625rem", background: "hsla(210,50%,40%,0.12)", border: "1px solid hsla(210,50%,50%,0.2)", borderRadius: "5px", color: "#4a90b8", fontSize: "0.75rem", cursor: "pointer" }}>
                      <Users size={11} style={{ display: "inline", marginRight: "0.25rem" }} />Enroll
                    </button>
                    <button onClick={() => toggleExpand(seq.id)} style={{ padding: "0.375rem", background: "none", border: "1px solid hsla(0,0%,100%,0.06)", borderRadius: "4px", color: "#8b8579", cursor: "pointer" }}>
                      {expanded === seq.id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    </button>
                    <button onClick={() => deleteSequence(seq.id)} style={{ padding: "0.375rem", background: "none", border: "1px solid hsla(0,0%,100%,0.06)", borderRadius: "4px", color: "#c45a4a", cursor: "pointer" }}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>

                {/* Enroll form */}
                {showEnrollForm === seq.id && (
                  <div style={{ padding: "1rem 1.25rem", borderTop: "1px solid hsla(0,0%,100%,0.05)", background: "hsla(0,0%,100%,0.01)" }}>
                    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                      <input value={enrollEmail} onChange={e => setEnrollEmail(e.target.value)} placeholder="email@example.com" style={{ flex: 1, padding: "0.5rem 0.625rem", background: "hsla(0,0%,100%,0.04)", border: "1px solid hsla(0,0%,100%,0.08)", borderRadius: "5px", color: "#e8e4de", fontSize: "0.8125rem" }} />
                      <button onClick={() => enrollLead(seq.id)} disabled={enrolling === seq.id || !enrollEmail} style={{ padding: "0.5rem 1rem", background: "#4a90b8", border: "none", borderRadius: "5px", color: "white", fontSize: "0.75rem", cursor: "pointer", fontWeight: 600 }}>
                        {enrolling === seq.id ? <Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} /> : "Enroll"}
                      </button>
                    </div>
                  </div>
                )}

                {/* Expanded step details */}
                {expanded === seq.id && detail?.id === seq.id && (
                  <div style={{ borderTop: "1px solid hsla(0,0%,100%,0.05)", padding: "1rem 1.25rem" }}>
                    <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "#6b6560", textTransform: "uppercase", marginBottom: "0.75rem" }}>Steps</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                      {detail.steps.map((step, i) => (
                        <div key={step.id} style={{ display: "flex", gap: "1rem", padding: "0.875rem 1rem", background: "hsla(0,0%,100%,0.02)", border: "1px solid hsla(0,0%,100%,0.04)", borderRadius: "6px", alignItems: "center", flexWrap: "wrap" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", flex: 1, minWidth: "200px" }}>
                            <span style={{ width: "20px", height: "20px", borderRadius: "50%", background: "hsla(0,0%,100%,0.06)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.625rem", color: "#6b6560", fontWeight: 700, flexShrink: 0 }}>{i + 1}</span>
                            {i > 0 && <ArrowRight size={10} style={{ color: "#4a4540", flexShrink: 0 }} />}
                            <div>
                              <div style={{ fontSize: "0.8125rem", fontWeight: 600, color: "#e8e4de" }}>{step.name}</div>
                              <div style={{ fontSize: "0.6875rem", color: "#4a4540" }}>
                                {step.delayDays > 0 || step.delayHours > 0 ? `Delay: ${step.delayDays}d ${step.delayHours}h · ` : "Immediate · "}
                                {CONDITION_LABELS[step.condition] || step.condition}
                              </div>
                            </div>
                          </div>
                          <div style={{ display: "flex", gap: "1rem" }}>
                            <div style={{ textAlign: "center" }}>
                              <div style={{ fontSize: "0.875rem", fontWeight: 700, color: "#e8e4de" }}>{step.sentCount}</div>
                              <div style={{ fontSize: "0.625rem", color: "#4a4540" }}>sent</div>
                            </div>
                            <div style={{ textAlign: "center" }}>
                              <div style={{ fontSize: "0.875rem", fontWeight: 700, color: "#5a9c5a" }}>{step.openCount}</div>
                              <div style={{ fontSize: "0.625rem", color: "#4a4540" }}>opens</div>
                            </div>
                            <div style={{ textAlign: "center" }}>
                              <div style={{ fontSize: "0.875rem", fontWeight: 700, color: "#d4a054" }}>{step.clickCount}</div>
                              <div style={{ fontSize: "0.625rem", color: "#4a4540" }}>clicks</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
            {sequences.length === 0 && (
              <div style={{ textAlign: "center", padding: "3rem", color: "#4a4540" }}>
                <GitBranch size={32} style={{ margin: "0 auto 1rem", opacity: 0.4 }} />
                <p>No drip sequences yet. Build your first automated email sequence.</p>
              </div>
            )}
          </div>
        )}

        {/* BUILDER VIEW */}
        {view === "builder" && (
          <div style={{ maxWidth: "760px" }}>
            <h2 style={{ fontSize: "1.125rem", fontWeight: 600, color: "#e8e4de", marginBottom: "1.5rem" }}>Build Drip Sequence</h2>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {/* Config */}
              <div style={{ padding: "1.5rem", background: "hsla(0,0%,100%,0.02)", border: "1px solid hsla(0,0%,100%,0.05)", borderRadius: "10px" }}>
                <h3 style={{ fontSize: "0.875rem", fontWeight: 600, color: "#e8e4de", marginBottom: "1rem" }}>Sequence Settings</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.6875rem", color: "#6b6560", marginBottom: "0.375rem", textTransform: "uppercase" }}>Sequence Name *</label>
                    <input value={name} onChange={e => setName(e.target.value)} placeholder="Founder Onboarding" style={{ width: "100%", padding: "0.625rem 0.75rem", background: "hsla(0,0%,100%,0.04)", border: "1px solid hsla(0,0%,100%,0.08)", borderRadius: "6px", color: "#e8e4de", fontSize: "0.875rem", boxSizing: "border-box" }} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.6875rem", color: "#6b6560", marginBottom: "0.375rem", textTransform: "uppercase" }}>Trigger Event *</label>
                    <select value={triggerEvent} onChange={e => setTriggerEvent(e.target.value)} style={{ width: "100%", padding: "0.625rem 0.75rem", background: "hsla(0,0%,100%,0.04)", border: "1px solid hsla(0,0%,100%,0.08)", borderRadius: "6px", color: "#e8e4de", fontSize: "0.875rem", boxSizing: "border-box" }}>
                      {Object.entries(TRIGGER_LABELS).map(([k, v]) => (
                        <option key={k} value={k} style={{ background: "#1a1a1a" }}>{v}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div style={{ marginTop: "0.75rem" }}>
                  <label style={{ display: "block", fontSize: "0.6875rem", color: "#6b6560", marginBottom: "0.375rem", textTransform: "uppercase" }}>Description</label>
                  <input value={description} onChange={e => setDescription(e.target.value)} placeholder="Brief description of this sequence's purpose..." style={{ width: "100%", padding: "0.625rem 0.75rem", background: "hsla(0,0%,100%,0.04)", border: "1px solid hsla(0,0%,100%,0.08)", borderRadius: "6px", color: "#e8e4de", fontSize: "0.875rem", boxSizing: "border-box" }} />
                </div>
              </div>

              {/* Steps */}
              <div style={{ padding: "1.5rem", background: "hsla(0,0%,100%,0.02)", border: "1px solid hsla(0,0%,100%,0.05)", borderRadius: "10px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
                  <h3 style={{ fontSize: "0.875rem", fontWeight: 600, color: "#e8e4de" }}>Email Steps ({steps.length})</h3>
                  <button onClick={() => setSteps(prev => [...prev, { name: `Step ${prev.length + 1}`, subjectLine: "", htmlBody: "", plainTextBody: "", delayDays: 7, delayHours: 0, condition: "always" }])} style={{ display: "flex", alignItems: "center", gap: "0.375rem", padding: "0.375rem 0.75rem", background: "hsla(0,0%,100%,0.04)", border: "1px solid hsla(0,0%,100%,0.08)", borderRadius: "5px", color: "#8b8579", fontSize: "0.75rem", cursor: "pointer" }}>
                    <Plus size={12} /> Add Step
                  </button>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {steps.map((step, i) => (
                    <div key={i} style={{ border: "1px solid hsla(0,0%,100%,0.06)", borderRadius: "8px", overflow: "hidden" }}>
                      <div
                        onClick={() => setExpandedStep(expandedStep === i ? null : i)}
                        style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.875rem 1rem", cursor: "pointer", background: expandedStep === i ? "hsla(0,0%,100%,0.03)" : "transparent" }}
                      >
                        <span style={{ width: "22px", height: "22px", borderRadius: "50%", background: "#8b7ac8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.6875rem", color: "white", fontWeight: 700, flexShrink: 0 }}>{i + 1}</span>
                        <span style={{ flex: 1, fontSize: "0.875rem", fontWeight: 600, color: "#e8e4de" }}>{step.name || `Step ${i + 1}`}</span>
                        <span style={{ fontSize: "0.6875rem", color: "#4a4540" }}>
                          {i === 0 ? "Immediate" : `+${step.delayDays}d ${step.delayHours}h`}
                        </span>
                        {expandedStep === i ? <ChevronUp size={12} style={{ color: "#6b6560" }} /> : <ChevronDown size={12} style={{ color: "#6b6560" }} />}
                        {steps.length > 1 && (
                          <button onClick={e => { e.stopPropagation(); setSteps(prev => prev.filter((_, j) => j !== i)); }} style={{ padding: "0.25rem", background: "none", border: "none", color: "#c45a4a", cursor: "pointer" }}>
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                      {expandedStep === i && (
                        <div style={{ padding: "1rem", borderTop: "1px solid hsla(0,0%,100%,0.05)", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                          <div>
                            <label style={{ display: "block", fontSize: "0.6875rem", color: "#6b6560", marginBottom: "0.25rem", textTransform: "uppercase" }}>Step Name</label>
                            <input value={step.name} onChange={e => updateStep(i, "name", e.target.value)} style={{ width: "100%", padding: "0.5rem 0.625rem", background: "hsla(0,0%,100%,0.04)", border: "1px solid hsla(0,0%,100%,0.08)", borderRadius: "5px", color: "#e8e4de", fontSize: "0.8125rem", boxSizing: "border-box" }} />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "0.6875rem", color: "#6b6560", marginBottom: "0.25rem", textTransform: "uppercase" }}>Subject Line *</label>
                            <input value={step.subjectLine} onChange={e => updateStep(i, "subjectLine", e.target.value)} placeholder="Subject for this email..." style={{ width: "100%", padding: "0.5rem 0.625rem", background: "hsla(0,0%,100%,0.04)", border: "1px solid hsla(0,0%,100%,0.08)", borderRadius: "5px", color: "#e8e4de", fontSize: "0.8125rem", boxSizing: "border-box" }} />
                          </div>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem" }}>
                            <div>
                              <label style={{ display: "block", fontSize: "0.6875rem", color: "#6b6560", marginBottom: "0.25rem", textTransform: "uppercase" }}>Delay (days)</label>
                              <input type="number" min="0" value={step.delayDays} onChange={e => updateStep(i, "delayDays", Number(e.target.value))} style={{ width: "100%", padding: "0.5rem 0.625rem", background: "hsla(0,0%,100%,0.04)", border: "1px solid hsla(0,0%,100%,0.08)", borderRadius: "5px", color: "#e8e4de", fontSize: "0.8125rem", boxSizing: "border-box" }} />
                            </div>
                            <div>
                              <label style={{ display: "block", fontSize: "0.6875rem", color: "#6b6560", marginBottom: "0.25rem", textTransform: "uppercase" }}>Delay (hours)</label>
                              <input type="number" min="0" max="23" value={step.delayHours} onChange={e => updateStep(i, "delayHours", Number(e.target.value))} style={{ width: "100%", padding: "0.5rem 0.625rem", background: "hsla(0,0%,100%,0.04)", border: "1px solid hsla(0,0%,100%,0.08)", borderRadius: "5px", color: "#e8e4de", fontSize: "0.8125rem", boxSizing: "border-box" }} />
                            </div>
                            <div>
                              <label style={{ display: "block", fontSize: "0.6875rem", color: "#6b6560", marginBottom: "0.25rem", textTransform: "uppercase" }}>Condition</label>
                              <select value={step.condition} onChange={e => updateStep(i, "condition", e.target.value)} style={{ width: "100%", padding: "0.5rem 0.5rem", background: "hsla(0,0%,100%,0.04)", border: "1px solid hsla(0,0%,100%,0.08)", borderRadius: "5px", color: "#e8e4de", fontSize: "0.75rem", boxSizing: "border-box" }}>
                                {Object.entries(CONDITION_LABELS).map(([k, v]) => (
                                  <option key={k} value={k} style={{ background: "#1a1a1a" }}>{v}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "0.6875rem", color: "#6b6560", marginBottom: "0.25rem", textTransform: "uppercase" }}>HTML Body *</label>
                            <textarea value={step.htmlBody} onChange={e => updateStep(i, "htmlBody", e.target.value)} placeholder="HTML email content..." rows={6} style={{ width: "100%", padding: "0.5rem 0.625rem", background: "hsla(0,0%,100%,0.04)", border: "1px solid hsla(0,0%,100%,0.08)", borderRadius: "5px", color: "#e8e4de", fontSize: "0.75rem", fontFamily: "monospace", resize: "vertical", boxSizing: "border-box" }} />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: "flex", gap: "0.75rem" }}>
                <button onClick={createSequence} disabled={saving || !name} style={{ padding: "0.75rem 1.75rem", background: "linear-gradient(135deg, #d4a054, #c8953c)", color: "#070a10", border: "none", borderRadius: "8px", fontWeight: 600, fontSize: "0.875rem", cursor: "pointer", opacity: saving || !name ? 0.5 : 1 }}>
                  {saving ? "Saving…" : "Create Sequence"}
                </button>
                <button onClick={() => { setView("list"); resetBuilder(); }} style={{ padding: "0.75rem 1.25rem", background: "hsla(0,0%,100%,0.04)", border: "1px solid hsla(0,0%,100%,0.08)", borderRadius: "8px", color: "#8b8579", fontSize: "0.875rem", cursor: "pointer" }}>
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
