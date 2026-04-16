import { useState, useEffect, useCallback } from "react";
import {
  AlertTriangle, CheckCircle, Clock, Plus, ChevronDown, ChevronUp,
  RefreshCw, User, Edit3, X, MessageSquare, FileText, BookOpen
} from "lucide-react";

const BASE = "/api";

type IncidentStatus = "open" | "investigating" | "mitigating" | "resolved" | "postmortem";
type IncidentSeverity = "minor" | "major" | "critical";

interface IncidentUpdate {
  id: number;
  incident_id: number;
  message: string;
  status: string;
  author: string | null;
  created_at: string;
}

interface Incident {
  id: number;
  title: string;
  status: IncidentStatus;
  severity: IncidentSeverity;
  affected_services: string[];
  description: string;
  assignee: string | null;
  postmortem: string | null;
  posted_by: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

const STATUS_FLOW: IncidentStatus[] = ["open", "investigating", "mitigating", "resolved", "postmortem"];

// Mirror of server-side state machine — only valid transitions
const VALID_NEXT: Record<IncidentStatus, IncidentStatus[]> = {
  open: ["investigating"],
  investigating: ["mitigating", "open"],
  mitigating: ["resolved", "investigating"],
  resolved: ["postmortem"],
  postmortem: [],
};

interface RunbookSummary {
  id: number;
  title: string;
  description: string | null;
  category: string;
  severity: string;
  tags: string[];
}

const severityColor = (s: string) => s === "critical" ? "#ef4444" : s === "major" ? "#f59e0b" : "#6b7280";
const statusColor = (s: string) => {
  if (s === "resolved" || s === "postmortem") return "#10b981";
  if (s === "mitigating") return "#3b82f6";
  if (s === "investigating") return "#f59e0b";
  return "#ef4444";
};
const statusLabel = (s: string) => s.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());

function Tag({ children, color }: { children: string; color: string }) {
  return (
    <span style={{
      fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 4,
      background: `${color}18`, color, border: `1px solid ${color}28`,
      textTransform: "uppercase", letterSpacing: "0.05em",
    }}>{children}</span>
  );
}

function IncidentDetailModal({ incident, onClose, onUpdated }: {
  incident: Incident; onClose: () => void; onUpdated: () => void;
}) {
  const [updates, setUpdates] = useState<IncidentUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [runbooks, setRunbooks] = useState<RunbookSummary[]>([]);
  const [updateMsg, setUpdateMsg] = useState("");
  const [nextStatus, setNextStatus] = useState<IncidentStatus>(incident.status);
  const [assignee, setAssignee] = useState(incident.assignee ?? "");
  const [postmortem, setPostmortem] = useState(incident.postmortem ?? "");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [activeTab, setActiveTab] = useState<"timeline" | "postmortem" | "runbooks">("timeline");

  // Valid next statuses for the current incident
  const validNextStatuses: IncidentStatus[] = [incident.status, ...(VALID_NEXT[incident.status] ?? [])];

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(`${BASE}/ops/incidents/${incident.id}`, { credentials: "include" }).then(r => r.json()),
      fetch(`${BASE}/ops/runbooks?severity=${incident.severity}&services=${encodeURIComponent(incident.affected_services.join(","))}`, { credentials: "include" }).then(r => r.json()).catch(() => ({ runbooks: [] })),
    ]).then(([incidentData, runbooksData]: [{ updates: IncidentUpdate[] }, { runbooks: RunbookSummary[] }]) => {
      setUpdates(incidentData.updates ?? []);
      setRunbooks(runbooksData.runbooks ?? []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [incident.id, incident.severity]);

  const saveUpdate = async () => {
    setSaving(true);
    setSaveError("");
    try {
      const res = await fetch(`${BASE}/ops/incidents/${incident.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: nextStatus !== incident.status ? nextStatus : undefined,
          message: updateMsg || undefined,
          assignee: assignee !== (incident.assignee ?? "") ? assignee : undefined,
          postmortem: postmortem !== (incident.postmortem ?? "") ? postmortem : undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { error?: string };
        setSaveError(data.error ?? "Failed to save update");
        setSaving(false);
        return;
      }
      setUpdateMsg("");
      onUpdated();
      onClose();
    } catch {
      setSaveError("Network error — could not save update");
    } finally {
      setSaving(false);
    }
  };

  const card: React.CSSProperties = {
    background: "hsl(210,12%,9%)", border: "1px solid hsla(0,0%,100%,0.08)",
    borderRadius: 12, padding: "1.5rem", marginBottom: "1rem",
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "hsla(0,0%,0%,0.7)", zIndex: 9999,
      display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem",
    }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        width: "100%", maxWidth: 780, maxHeight: "90vh", overflowY: "auto",
        background: "hsl(210,12%,7%)", borderRadius: 14,
        border: "1px solid hsla(0,0%,100%,0.08)", padding: "2rem",
      }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1.5rem" }}>
          <div>
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <Tag color={severityColor(incident.severity)}>{incident.severity}</Tag>
              <Tag color={statusColor(incident.status)}>{incident.status}</Tag>
            </div>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "hsl(38,12%,94%)", marginBottom: 4 }}>{incident.title}</h2>
            <div style={{ fontSize: 12, color: "hsl(210,5%,46%)" }}>
              #{incident.id} · Opened {new Date(incident.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              {incident.posted_by && ` by ${incident.posted_by}`}
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "hsl(210,5%,50%)", padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        <div style={card}>
          <div style={{ fontSize: 12, color: "hsl(210,5%,46%)", marginBottom: 6 }}>Description</div>
          <p style={{ fontSize: "0.9rem", color: "hsl(38,12%,80%)", lineHeight: 1.6, margin: 0 }}>{incident.description}</p>
          {incident.affected_services.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <span style={{ fontSize: 11, color: "hsl(210,5%,46%)", marginRight: 8 }}>Affected:</span>
              {incident.affected_services.map(s => (
                <span key={s} style={{
                  fontSize: 11, padding: "1px 7px", borderRadius: 4, marginRight: 5,
                  background: "hsla(0,0%,100%,0.05)", border: "1px solid hsla(0,0%,100%,0.08)",
                  color: "hsl(38,12%,74%)",
                }}>{s}</span>
              ))}
            </div>
          )}
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 8, marginBottom: "1rem" }}>
          {([
            { id: "timeline", label: "Timeline", icon: <MessageSquare size={12} style={{ display: "inline", marginRight: 5 }} /> },
            { id: "postmortem", label: "Postmortem", icon: <FileText size={12} style={{ display: "inline", marginRight: 5 }} /> },
            { id: "runbooks", label: `Runbooks${runbooks.length ? ` (${runbooks.length})` : ""}`, icon: <BookOpen size={12} style={{ display: "inline", marginRight: 5 }} /> },
          ] as const).map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
              padding: "0.4rem 1rem", borderRadius: 6, fontSize: 13, fontWeight: 500,
              cursor: "pointer", border: "1px solid",
              background: activeTab === tab.id ? "hsla(210,55%,52%,0.15)" : "transparent",
              borderColor: activeTab === tab.id ? "hsla(210,55%,52%,0.35)" : "hsla(0,0%,100%,0.08)",
              color: activeTab === tab.id ? "hsl(210,55%,72%)" : "hsl(210,5%,52%)",
            }}>
              {tab.icon}{tab.label}
            </button>
          ))}
        </div>

        {activeTab === "timeline" && (
          <div style={card}>
            <div style={{ fontSize: 12, color: "hsl(210,5%,46%)", marginBottom: "0.875rem" }}>Incident Timeline</div>
            {loading ? (
              <div style={{ color: "hsl(210,5%,48%)", fontSize: 13 }}>Loading...</div>
            ) : updates.length === 0 ? (
              <div style={{ color: "hsl(210,5%,48%)", fontSize: 13 }}>No updates yet.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
                {updates.map(u => (
                  <div key={u.id} style={{ paddingLeft: "1rem", borderLeft: "2px solid hsla(0,0%,100%,0.07)" }}>
                    <div style={{ fontSize: "0.875rem", color: "hsl(38,12%,84%)", lineHeight: 1.6, marginBottom: 2 }}>{u.message}</div>
                    <div style={{ fontSize: 11, color: "hsl(210,5%,42%)" }}>
                      {new Date(u.created_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      {u.author && <> · {u.author}</>}
                      {" · "}<span style={{ textTransform: "capitalize" }}>{u.status.replace(/_/g, " ")}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "postmortem" && (
          <div style={card}>
            <div style={{ fontSize: 12, color: "hsl(210,5%,46%)", marginBottom: "0.75rem" }}>Postmortem Notes</div>
            <textarea
              value={postmortem}
              onChange={e => setPostmortem(e.target.value)}
              placeholder="Document root cause, timeline, impact, and preventive actions..."
              rows={10}
              style={{
                width: "100%", background: "hsla(0,0%,100%,0.03)", border: "1px solid hsla(0,0%,100%,0.08)",
                borderRadius: 8, padding: "0.75rem", color: "hsl(38,12%,86%)", fontSize: "0.875rem",
                lineHeight: 1.6, resize: "vertical", outline: "none", boxSizing: "border-box",
                fontFamily: "inherit",
              }}
            />
          </div>
        )}

        {activeTab === "runbooks" && (
          <div style={card}>
            <div style={{ fontSize: 12, color: "hsl(210,5%,46%)", marginBottom: "0.875rem" }}>
              Runbooks matched by severity (<strong style={{ color: "hsl(38,12%,74%)" }}>{incident.severity}</strong>) and affected services
            </div>
            {loading ? (
              <div style={{ color: "hsl(210,5%,48%)", fontSize: 13 }}>Loading runbooks...</div>
            ) : runbooks.length === 0 ? (
              <div style={{ color: "hsl(210,5%,48%)", fontSize: 13 }}>No runbooks matched this incident's severity or affected services. Browse all runbooks in the Runbooks section.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {runbooks.map(rb => (
                  <div key={rb.id} style={{
                    padding: "0.875rem 1rem", borderRadius: 8,
                    background: "hsla(0,0%,100%,0.03)", border: "1px solid hsla(0,0%,100%,0.06)",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <BookOpen size={13} style={{ color: "hsl(210,55%,62%)", flexShrink: 0 }} />
                      <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "hsl(38,12%,88%)" }}>{rb.title}</span>
                      <span style={{
                        fontSize: 10, padding: "1px 6px", borderRadius: 4, marginLeft: "auto",
                        background: "hsla(0,0%,100%,0.06)", border: "1px solid hsla(0,0%,100%,0.08)",
                        color: "hsl(210,5%,58%)", textTransform: "uppercase", letterSpacing: "0.05em",
                      }}>{rb.category}</span>
                    </div>
                    {rb.description && (
                      <p style={{ fontSize: 12, color: "hsl(210,5%,52%)", margin: 0, lineHeight: 1.5 }}>{rb.description}</p>
                    )}
                    {rb.tags.length > 0 && (
                      <div style={{ marginTop: 6, display: "flex", gap: 4, flexWrap: "wrap" }}>
                        {rb.tags.map(tag => (
                          <span key={tag} style={{
                            fontSize: 10, padding: "1px 6px", borderRadius: 4,
                            background: "hsla(210,55%,52%,0.08)", border: "1px solid hsla(210,55%,52%,0.16)",
                            color: "hsl(210,55%,62%)",
                          }}>#{tag}</span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Update section */}
        <div style={card}>
          <div style={{ fontSize: 12, color: "hsl(210,5%,46%)", marginBottom: "0.75rem" }}>Post Update</div>
          {saveError && (
            <div style={{
              padding: "0.5rem 0.75rem", borderRadius: 6, marginBottom: "0.75rem",
              background: "hsla(0,72%,51%,0.1)", border: "1px solid hsla(0,72%,51%,0.25)",
              color: "#ef4444", fontSize: 12,
            }}>{saveError}</div>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "0.75rem" }}>
            <div>
              <label style={{ fontSize: 11, color: "hsl(210,5%,46%)", display: "block", marginBottom: 4 }}>
                Next Status
                {validNextStatuses.length === 1 && <span style={{ marginLeft: 6, color: "hsl(210,5%,36%)" }}>(terminal)</span>}
              </label>
              <select
                value={nextStatus}
                onChange={e => setNextStatus(e.target.value as IncidentStatus)}
                disabled={validNextStatuses.length === 1}
                style={{
                  width: "100%", background: "hsl(210,12%,10%)", border: "1px solid hsla(0,0%,100%,0.1)",
                  borderRadius: 6, padding: "0.5rem 0.75rem", color: "hsl(38,12%,84%)", fontSize: 13,
                  opacity: validNextStatuses.length === 1 ? 0.5 : 1,
                }}
              >
                {validNextStatuses.map(s => <option key={s} value={s}>{statusLabel(s)}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, color: "hsl(210,5%,46%)", display: "block", marginBottom: 4 }}>Assignee</label>
              <input
                value={assignee}
                onChange={e => setAssignee(e.target.value)}
                placeholder="Name or email"
                style={{
                  width: "100%", background: "hsl(210,12%,10%)", border: "1px solid hsla(0,0%,100%,0.1)",
                  borderRadius: 6, padding: "0.5rem 0.75rem", color: "hsl(38,12%,84%)", fontSize: 13,
                  outline: "none", boxSizing: "border-box",
                }}
              />
            </div>
          </div>
          <textarea
            value={updateMsg}
            onChange={e => setUpdateMsg(e.target.value)}
            placeholder="Add update message for the timeline..."
            rows={3}
            style={{
              width: "100%", background: "hsl(210,12%,10%)", border: "1px solid hsla(0,0%,100%,0.1)",
              borderRadius: 8, padding: "0.625rem 0.75rem", color: "hsl(38,12%,86%)", fontSize: "0.875rem",
              resize: "vertical", outline: "none", boxSizing: "border-box", fontFamily: "inherit",
              marginBottom: "0.75rem",
            }}
          />
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button onClick={onClose} style={{
              padding: "0.5rem 1rem", borderRadius: 6, fontSize: 13,
              background: "transparent", border: "1px solid hsla(0,0%,100%,0.1)",
              color: "hsl(210,5%,52%)", cursor: "pointer",
            }}>Cancel</button>
            <button onClick={saveUpdate} disabled={saving} style={{
              padding: "0.5rem 1.25rem", borderRadius: 6, fontSize: 13, fontWeight: 600,
              background: "hsla(210,55%,52%,0.18)", border: "1px solid hsla(210,55%,52%,0.35)",
              color: "hsl(210,55%,72%)", cursor: "pointer",
            }}>{saving ? "Saving..." : "Save Update"}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CreateIncidentModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState<IncidentSeverity>("minor");
  const [services, setServices] = useState("");
  const [assignee, setAssignee] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const create = async () => {
    if (!title || !description) { setError("Title and description are required."); return; }
    setSaving(true);
    try {
      const res = await fetch(`${BASE}/ops/incidents`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title, description, severity,
          affectedServices: services.split(",").map(s => s.trim()).filter(Boolean),
          assignee: assignee || undefined,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      onCreated();
      onClose();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "hsla(0,0%,0%,0.7)", zIndex: 9999,
      display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem",
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        width: "100%", maxWidth: 560, background: "hsl(210,12%,7%)", borderRadius: 14,
        border: "1px solid hsla(0,0%,100%,0.08)", padding: "2rem",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: "1.125rem", fontWeight: 700, color: "hsl(38,12%,94%)" }}>Create Incident</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "hsl(210,5%,50%)" }}><X size={18} /></button>
        </div>
        {error && <div style={{ padding: "0.625rem 0.875rem", borderRadius: 6, background: "hsla(0,72%,51%,0.1)", border: "1px solid hsla(0,72%,51%,0.25)", color: "#ef4444", fontSize: 13, marginBottom: "1rem" }}>{error}</div>}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label style={{ fontSize: 12, color: "hsl(210,5%,48%)", display: "block", marginBottom: 4 }}>Title *</label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Brief summary of the incident" style={{ width: "100%", background: "hsl(210,12%,10%)", border: "1px solid hsla(0,0%,100%,0.1)", borderRadius: 6, padding: "0.5rem 0.75rem", color: "hsl(38,12%,86%)", fontSize: 14, outline: "none", boxSizing: "border-box" }} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div>
              <label style={{ fontSize: 12, color: "hsl(210,5%,48%)", display: "block", marginBottom: 4 }}>Severity</label>
              <select value={severity} onChange={e => setSeverity(e.target.value as IncidentSeverity)} style={{ width: "100%", background: "hsl(210,12%,10%)", border: "1px solid hsla(0,0%,100%,0.1)", borderRadius: 6, padding: "0.5rem 0.75rem", color: "hsl(38,12%,86%)", fontSize: 13 }}>
                <option value="minor">Minor</option>
                <option value="major">Major</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, color: "hsl(210,5%,48%)", display: "block", marginBottom: 4 }}>Assignee</label>
              <input value={assignee} onChange={e => setAssignee(e.target.value)} placeholder="Name or email" style={{ width: "100%", background: "hsl(210,12%,10%)", border: "1px solid hsla(0,0%,100%,0.1)", borderRadius: 6, padding: "0.5rem 0.75rem", color: "hsl(38,12%,86%)", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
            </div>
          </div>
          <div>
            <label style={{ fontSize: 12, color: "hsl(210,5%,48%)", display: "block", marginBottom: 4 }}>Affected Services (comma-separated)</label>
            <input value={services} onChange={e => setServices(e.target.value)} placeholder="api, database, auth" style={{ width: "100%", background: "hsl(210,12%,10%)", border: "1px solid hsla(0,0%,100%,0.1)", borderRadius: 6, padding: "0.5rem 0.75rem", color: "hsl(38,12%,86%)", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: "hsl(210,5%,48%)", display: "block", marginBottom: 4 }}>Description *</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="What is happening and what is the user impact?" rows={4} style={{ width: "100%", background: "hsl(210,12%,10%)", border: "1px solid hsla(0,0%,100%,0.1)", borderRadius: 6, padding: "0.5rem 0.75rem", color: "hsl(38,12%,86%)", fontSize: 13, resize: "vertical", outline: "none", boxSizing: "border-box", fontFamily: "inherit" }} />
          </div>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 4 }}>
            <button onClick={onClose} style={{ padding: "0.5rem 1rem", borderRadius: 6, fontSize: 13, background: "transparent", border: "1px solid hsla(0,0%,100%,0.1)", color: "hsl(210,5%,52%)", cursor: "pointer" }}>Cancel</button>
            <button onClick={create} disabled={saving} style={{ padding: "0.5rem 1.25rem", borderRadius: 6, fontSize: 13, fontWeight: 600, background: "hsla(0,72%,51%,0.15)", border: "1px solid hsla(0,72%,51%,0.35)", color: "#f87171", cursor: "pointer" }}>
              {saving ? "Creating..." : "Create Incident"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OpsIncidentsPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "active" | "resolved">("active");
  const [selected, setSelected] = useState<Incident | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const res = await fetch(`${BASE}/ops/incidents?limit=100`, { credentials: "include" });
      const data = await res.json() as { incidents: Incident[] };
      setIncidents(data.incidents ?? []);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = incidents.filter(i => {
    if (filter === "active") return i.status !== "resolved" && i.status !== "postmortem";
    if (filter === "resolved") return i.status === "resolved" || i.status === "postmortem";
    return true;
  });

  const activeCnt = incidents.filter(i => i.status !== "resolved" && i.status !== "postmortem").length;

  return (
    <div style={{ minHeight: "100vh", background: "hsl(210,12%,5%)", color: "hsl(38,12%,90%)", padding: "2rem clamp(1rem,5vw,2.5rem)" }}>
      {selected && <IncidentDetailModal incident={selected} onClose={() => setSelected(null)} onUpdated={() => load()} />}
      {showCreate && <CreateIncidentModal onClose={() => setShowCreate(false)} onCreated={() => load()} />}

      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <AlertTriangle size={18} style={{ color: "#f59e0b" }} />
              <h1 style={{ fontSize: "1.375rem", fontWeight: 700, color: "hsl(38,12%,94%)" }}>Incident Management</h1>
              {activeCnt > 0 && (
                <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: "hsla(0,72%,51%,0.15)", color: "#f87171", border: "1px solid hsla(0,72%,51%,0.3)" }}>
                  {activeCnt} ACTIVE
                </span>
              )}
            </div>
            <p style={{ fontSize: "0.875rem", color: "hsl(210,5%,50%)" }}>Create, triage, and resolve platform incidents with full audit trail.</p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => load(true)} disabled={refreshing} style={{ display: "flex", alignItems: "center", gap: 5, padding: "0.5rem 0.875rem", borderRadius: 6, fontSize: 12, background: "hsla(0,0%,100%,0.04)", border: "1px solid hsla(0,0%,100%,0.08)", color: "hsl(210,5%,52%)", cursor: "pointer" }}>
              <RefreshCw size={12} style={{ animation: refreshing ? "spin 0.8s linear infinite" : "none" }} />Refresh
            </button>
            <button onClick={() => setShowCreate(true)} style={{ display: "flex", alignItems: "center", gap: 5, padding: "0.5rem 1rem", borderRadius: 6, fontSize: 13, fontWeight: 600, background: "hsla(0,72%,51%,0.15)", border: "1px solid hsla(0,72%,51%,0.3)", color: "#f87171", cursor: "pointer" }}>
              <Plus size={13} />Create Incident
            </button>
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: "flex", gap: 6, marginBottom: "1.5rem" }}>
          {(["active", "all", "resolved"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: "0.375rem 0.875rem", borderRadius: 6, fontSize: 12, fontWeight: 500,
              cursor: "pointer", border: "1px solid",
              background: filter === f ? "hsla(210,55%,52%,0.12)" : "transparent",
              borderColor: filter === f ? "hsla(210,55%,52%,0.3)" : "hsla(0,0%,100%,0.08)",
              color: filter === f ? "hsl(210,55%,70%)" : "hsl(210,5%,50%)",
            }}>
              {f === "active" ? `Active (${activeCnt})` : f === "resolved" ? "Resolved" : "All"}
            </button>
          ))}
        </div>

        {/* Incident List */}
        {loading ? (
          <div style={{ textAlign: "center", color: "hsl(210,5%,48%)", padding: "3rem 0" }}>Loading incidents...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "4rem 0" }}>
            <CheckCircle size={32} style={{ color: "#10b981", margin: "0 auto 1rem", display: "block" }} />
            <div style={{ fontSize: "1rem", fontWeight: 600, color: "hsl(38,12%,84%)", marginBottom: 6 }}>
              {filter === "active" ? "No active incidents" : "No incidents found"}
            </div>
            <div style={{ fontSize: 13, color: "hsl(210,5%,46%)" }}>All systems are operating normally.</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
            {filtered.map(inc => (
              <div key={inc.id}
                onClick={() => setSelected(inc)}
                style={{
                  background: "hsla(0,0%,100%,0.025)", border: "1px solid hsla(0,0%,100%,0.07)",
                  borderRadius: 10, padding: "1rem 1.25rem", cursor: "pointer",
                  transition: "background 0.15s",
                }}
                onMouseEnter={e => (e.currentTarget.style.background = "hsla(0,0%,100%,0.04)")}
                onMouseLeave={e => (e.currentTarget.style.background = "hsla(0,0%,100%,0.025)")}
              >
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: statusColor(inc.status), flexShrink: 0, display: "inline-block" }} />
                      <span style={{ fontSize: "0.9375rem", fontWeight: 600, color: "hsl(38,12%,92%)", flex: 1 }}>{inc.title}</span>
                    </div>
                    <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
                      <Tag color={severityColor(inc.severity)}>{inc.severity}</Tag>
                      <Tag color={statusColor(inc.status)}>{inc.status}</Tag>
                      {inc.assignee && <span style={{ fontSize: 11, color: "hsl(210,5%,50%)", display: "flex", alignItems: "center", gap: 3 }}><User size={10} />{inc.assignee}</span>}
                      <span style={{ fontSize: 11, color: "hsl(210,5%,44%)" }}>
                        <Clock size={10} style={{ display: "inline", marginRight: 3 }} />
                        {new Date(inc.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                      {inc.affected_services.length > 0 && (
                        <span style={{ fontSize: 11, color: "hsl(210,5%,44%)" }}>
                          Affects: {inc.affected_services.slice(0, 3).join(", ")}{inc.affected_services.length > 3 ? ` +${inc.affected_services.length - 3}` : ""}
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronDown size={14} style={{ color: "hsl(210,5%,42%)", flexShrink: 0, marginTop: 4 }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
