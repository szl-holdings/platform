import { useState, useEffect, useCallback } from "react";
import { Bell, Plus, X, RefreshCw, PlayCircle, CheckCircle, AlertTriangle, Zap } from "lucide-react";

const BASE = "/api";

interface AlertRule {
  id: number;
  name: string;
  description: string | null;
  metric_name: string;
  condition: string;
  threshold: number;
  window_minutes: number;
  severity: string;
  enabled: boolean;
  notify_in_app: boolean;
  notify_email: boolean;
  email_recipients: string[];
  runbook_id: number | null;
  last_evaluated_at: string | null;
  last_fired_at: string | null;
  created_at: string;
}

interface AlertEvent {
  id: number;
  rule_id: number;
  rule_name: string;
  severity: string;
  metric_name: string;
  metric_value: number;
  threshold: number;
  condition: string;
  message: string;
  status: string;
  resolved_at: string | null;
  acknowledged_at: string | null;
  acknowledged_by: string | null;
  created_at: string;
}

const severityColor = (s: string) => s === "critical" ? "#ef4444" : s === "major" ? "#f59e0b" : s === "warning" ? "#fb923c" : "#6b7280";
const conditionLabel = (c: string) => ({ gt: ">", lt: "<", gte: "≥", lte: "≤", eq: "=" }[c] ?? c);

function RuleCard({ rule, onToggle, onDelete }: { rule: AlertRule; onToggle: (r: AlertRule) => void; onDelete: (id: number) => void }) {
  const sc = severityColor(rule.severity);
  return (
    <div style={{
      background: "hsla(0,0%,100%,0.025)", border: "1px solid hsla(0,0%,100%,0.07)",
      borderRadius: 10, padding: "1.125rem 1.25rem",
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem" }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: rule.enabled ? sc : "#374151", display: "inline-block", flexShrink: 0 }} />
            <span style={{ fontSize: "0.9375rem", fontWeight: 600, color: "hsl(38,12%,92%)" }}>{rule.name}</span>
            <span style={{
              fontSize: 9, fontWeight: 700, padding: "1px 6px", borderRadius: 4,
              background: `${sc}15`, color: sc, border: `1px solid ${sc}28`,
              textTransform: "uppercase", letterSpacing: "0.06em",
            }}>{rule.severity}</span>
            {!rule.enabled && <span style={{ fontSize: 10, color: "#6b7280", fontStyle: "italic" }}>disabled</span>}
          </div>
          {rule.description && <p style={{ fontSize: 13, color: "hsl(210,5%,52%)", margin: "0 0 8px 16px", lineHeight: 1.5 }}>{rule.description}</p>}
          <div style={{ marginLeft: 16, display: "flex", gap: "1.25rem", flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ fontSize: 12, fontFamily: "monospace", color: "hsl(210,55%,68%)", background: "hsla(210,55%,52%,0.1)", padding: "2px 8px", borderRadius: 4, border: "1px solid hsla(210,55%,52%,0.2)" }}>
              {rule.metric_name} {conditionLabel(rule.condition)} {rule.threshold}
            </span>
            <span style={{ fontSize: 12, color: "hsl(210,5%,46%)" }}>over {rule.window_minutes}m window</span>
            {rule.notify_in_app && <span style={{ fontSize: 11, color: "hsl(210,5%,44%)" }}>📲 In-app</span>}
            {rule.notify_email && rule.email_recipients.length > 0 && <span style={{ fontSize: 11, color: "hsl(210,5%,44%)" }}>✉️ Email</span>}
            {rule.last_fired_at && (
              <span style={{ fontSize: 11, color: "#f59e0b" }}>
                Last fired: {new Date(rule.last_fired_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
              </span>
            )}
          </div>
        </div>
        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
          <button
            onClick={() => onToggle(rule)}
            title={rule.enabled ? "Disable" : "Enable"}
            style={{
              padding: "0.375rem 0.625rem", borderRadius: 6, fontSize: 11, fontWeight: 500,
              cursor: "pointer", border: "1px solid",
              background: rule.enabled ? "hsla(152,50%,42%,0.1)" : "hsla(0,0%,100%,0.04)",
              borderColor: rule.enabled ? "hsla(152,50%,42%,0.3)" : "hsla(0,0%,100%,0.08)",
              color: rule.enabled ? "#34d399" : "hsl(210,5%,48%)",
            }}
          >{rule.enabled ? "Enabled" : "Disabled"}</button>
          <button onClick={() => onDelete(rule.id)} style={{ padding: "0.375rem", borderRadius: 6, background: "transparent", border: "1px solid hsla(0,0%,100%,0.06)", color: "hsl(210,5%,44%)", cursor: "pointer" }}>
            <X size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}

function CreateRuleModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({
    name: "", description: "", metricName: "", condition: "gt",
    threshold: "1", windowMinutes: "5", severity: "warning",
    notifyInApp: true, notifyEmail: false, emailRecipients: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const set = (k: string, v: string | boolean) => setForm(f => ({ ...f, [k]: v }));

  const save = async () => {
    if (!form.name || !form.metricName) { setError("Name and metric name are required."); return; }
    setSaving(true);
    try {
      const res = await fetch(`${BASE}/ops/alert-rules`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name, description: form.description || undefined,
          metricName: form.metricName, condition: form.condition,
          threshold: parseFloat(form.threshold), windowMinutes: parseInt(form.windowMinutes),
          severity: form.severity, notifyInApp: form.notifyInApp, notifyEmail: form.notifyEmail,
          emailRecipients: form.emailRecipients.split(",").map(s => s.trim()).filter(Boolean),
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      onCreated(); onClose();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const inputSt: React.CSSProperties = { width: "100%", background: "hsl(210,12%,10%)", border: "1px solid hsla(0,0%,100%,0.1)", borderRadius: 6, padding: "0.5rem 0.75rem", color: "hsl(38,12%,86%)", fontSize: 13, outline: "none", boxSizing: "border-box" };
  const labelSt: React.CSSProperties = { fontSize: 11, color: "hsl(210,5%,46%)", display: "block", marginBottom: 4 };

  return (
    <div style={{ position: "fixed", inset: 0, background: "hsla(0,0%,0%,0.7)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ width: "100%", maxWidth: 560, background: "hsl(210,12%,7%)", borderRadius: 14, border: "1px solid hsla(0,0%,100%,0.08)", padding: "2rem", maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: "1.125rem", fontWeight: 700, color: "hsl(38,12%,94%)" }}>Create Alert Rule</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "hsl(210,5%,50%)" }}><X size={18} /></button>
        </div>
        {error && <div style={{ padding: "0.625rem", borderRadius: 6, background: "hsla(0,72%,51%,0.1)", border: "1px solid hsla(0,72%,51%,0.25)", color: "#ef4444", fontSize: 13, marginBottom: "1rem" }}>{error}</div>}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
          <div><label style={labelSt}>Rule Name *</label><input style={inputSt} value={form.name} onChange={e => set("name", e.target.value)} placeholder="High Error Rate" /></div>
          <div><label style={labelSt}>Description</label><input style={inputSt} value={form.description} onChange={e => set("description", e.target.value)} placeholder="Optional description" /></div>
          <div><label style={labelSt}>Metric Name *</label>
            <input style={inputSt} value={form.metricName} onChange={e => set("metricName", e.target.value)} placeholder="api.error_rate" />
            <div style={{ fontSize: 10, color: "hsl(210,5%,40%)", marginTop: 3 }}>Available: api.error_rate, api.latency_p95, queue.depth, db.pool_utilization, system.memory_pct, ai.failure_rate</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem" }}>
            <div><label style={labelSt}>Condition</label>
              <select style={inputSt} value={form.condition} onChange={e => set("condition", e.target.value)}>
                <option value="gt">&gt; (greater than)</option>
                <option value="lt">&lt; (less than)</option>
                <option value="gte">≥ (at least)</option>
                <option value="lte">≤ (at most)</option>
              </select>
            </div>
            <div><label style={labelSt}>Threshold</label><input style={inputSt} type="number" value={form.threshold} onChange={e => set("threshold", e.target.value)} /></div>
            <div><label style={labelSt}>Window (min)</label><input style={inputSt} type="number" value={form.windowMinutes} onChange={e => set("windowMinutes", e.target.value)} /></div>
          </div>
          <div><label style={labelSt}>Severity</label>
            <select style={inputSt} value={form.severity} onChange={e => set("severity", e.target.value)}>
              <option value="info">Info</option>
              <option value="warning">Warning</option>
              <option value="major">Major</option>
              <option value="critical">Critical</option>
            </select>
          </div>
          <div style={{ display: "flex", gap: "1rem" }}>
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "hsl(38,12%,80%)", cursor: "pointer" }}>
              <input type="checkbox" checked={form.notifyInApp} onChange={e => set("notifyInApp", e.target.checked)} style={{ accentColor: "#3b82f6" }} />
              In-app notification
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "hsl(38,12%,80%)", cursor: "pointer" }}>
              <input type="checkbox" checked={form.notifyEmail} onChange={e => set("notifyEmail", e.target.checked)} style={{ accentColor: "#3b82f6" }} />
              Email notification
            </label>
          </div>
          {form.notifyEmail && <div><label style={labelSt}>Email Recipients (comma-separated)</label><input style={inputSt} value={form.emailRecipients} onChange={e => set("emailRecipients", e.target.value)} placeholder="ops@example.com, oncall@example.com" /></div>}
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 4 }}>
            <button onClick={onClose} style={{ padding: "0.5rem 1rem", borderRadius: 6, fontSize: 13, background: "transparent", border: "1px solid hsla(0,0%,100%,0.1)", color: "hsl(210,5%,52%)", cursor: "pointer" }}>Cancel</button>
            <button onClick={save} disabled={saving} style={{ padding: "0.5rem 1.25rem", borderRadius: 6, fontSize: 13, fontWeight: 600, background: "hsla(210,55%,52%,0.15)", border: "1px solid hsla(210,55%,52%,0.35)", color: "hsl(210,55%,72%)", cursor: "pointer" }}>
              {saving ? "Creating..." : "Create Rule"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OpsAlertsPage() {
  const [rules, setRules] = useState<AlertRule[]>([]);
  const [events, setEvents] = useState<AlertEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [evalResult, setEvalResult] = useState<{ evaluated: number; fired: number; metrics: Record<string, number> } | null>(null);
  const [activeTab, setActiveTab] = useState<"rules" | "events">("rules");

  const load = useCallback(async () => {
    const [rRes, eRes] = await Promise.all([
      fetch(`${BASE}/ops/alert-rules`, { credentials: "include" }),
      fetch(`${BASE}/ops/alert-events?limit=50`, { credentials: "include" }),
    ]);
    setRules((await rRes.json() as { rules: AlertRule[] }).rules ?? []);
    setEvents((await eRes.json() as { events: AlertEvent[] }).events ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const evaluate = async () => {
    setEvaluating(true);
    try {
      const res = await fetch(`${BASE}/ops/alert-rules/evaluate`, { method: "POST", credentials: "include" });
      const d = await res.json() as { evaluated: number; fired: number; metrics: Record<string, number> };
      setEvalResult(d);
      await load();
    } finally {
      setEvaluating(false);
    }
  };

  const toggleRule = async (rule: AlertRule) => {
    await fetch(`${BASE}/ops/alert-rules/${rule.id}`, {
      method: "PATCH", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: !rule.enabled }),
    });
    await load();
  };

  const deleteRule = async (id: number) => {
    if (!confirm("Delete this alert rule?")) return;
    await fetch(`${BASE}/ops/alert-rules/${id}`, { method: "DELETE", credentials: "include" });
    await load();
  };

  const acknowledge = async (id: number) => {
    await fetch(`${BASE}/ops/alert-events/${id}/acknowledge`, { method: "POST", credentials: "include" });
    await load();
  };

  const firingEvents = events.filter(e => e.status === "firing");

  return (
    <div style={{ minHeight: "100vh", background: "hsl(210,12%,5%)", color: "hsl(38,12%,90%)", padding: "2rem clamp(1rem,5vw,2.5rem)" }}>
      {showCreate && <CreateRuleModal onClose={() => setShowCreate(false)} onCreated={load} />}
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <Bell size={18} style={{ color: "#f59e0b" }} />
              <h1 style={{ fontSize: "1.375rem", fontWeight: 700, color: "hsl(38,12%,94%)" }}>Alerting Rules Engine</h1>
              {firingEvents.length > 0 && (
                <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: "hsla(0,72%,51%,0.15)", color: "#f87171", border: "1px solid hsla(0,72%,51%,0.3)" }}>
                  {firingEvents.length} FIRING
                </span>
              )}
            </div>
            <p style={{ fontSize: "0.875rem", color: "hsl(210,5%,50%)" }}>Define threshold-based alert rules and receive in-app or email notifications.</p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={evaluate} disabled={evaluating} style={{ display: "flex", alignItems: "center", gap: 5, padding: "0.5rem 0.875rem", borderRadius: 6, fontSize: 12, background: "hsla(152,50%,42%,0.1)", border: "1px solid hsla(152,50%,42%,0.25)", color: "#34d399", cursor: "pointer" }}>
              <PlayCircle size={13} />{evaluating ? "Running..." : "Evaluate Now"}
            </button>
            <button onClick={() => setShowCreate(true)} style={{ display: "flex", alignItems: "center", gap: 5, padding: "0.5rem 1rem", borderRadius: 6, fontSize: 13, fontWeight: 600, background: "hsla(210,55%,52%,0.12)", border: "1px solid hsla(210,55%,52%,0.3)", color: "hsl(210,55%,70%)", cursor: "pointer" }}>
              <Plus size={13} />Add Rule
            </button>
          </div>
        </div>

        {evalResult && (
          <div style={{ marginBottom: "1.5rem", padding: "0.875rem 1.125rem", borderRadius: 8, background: "hsla(152,50%,42%,0.07)", border: "1px solid hsla(152,50%,42%,0.2)" }}>
            <div style={{ fontSize: 13, color: "hsl(38,12%,82%)", marginBottom: 6 }}>
              <CheckCircle size={13} style={{ display: "inline", color: "#10b981", marginRight: 6 }} />
              Evaluated {evalResult.evaluated} rules · {evalResult.fired} fired
            </div>
            <div style={{ display: "flex", gap: "1.25rem", flexWrap: "wrap" }}>
              {Object.entries(evalResult.metrics).map(([k, v]) => (
                <span key={k} style={{ fontSize: 11, fontFamily: "monospace", color: "hsl(210,5%,52%)" }}>
                  {k}: <strong style={{ color: "hsl(38,12%,78%)" }}>{v}</strong>
                </span>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: "flex", gap: 6, marginBottom: "1.5rem" }}>
          {(["rules", "events"] as const).map(t => (
            <button key={t} onClick={() => setActiveTab(t)} style={{
              padding: "0.375rem 0.875rem", borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: "pointer", border: "1px solid",
              background: activeTab === t ? "hsla(210,55%,52%,0.12)" : "transparent",
              borderColor: activeTab === t ? "hsla(210,55%,52%,0.3)" : "hsla(0,0%,100%,0.08)",
              color: activeTab === t ? "hsl(210,55%,70%)" : "hsl(210,5%,50%)",
            }}>
              {t === "rules" ? `Rules (${rules.length})` : `Events (${events.length})`}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: "center", color: "hsl(210,5%,48%)", padding: "3rem 0" }}>Loading...</div>
        ) : activeTab === "rules" ? (
          rules.length === 0 ? (
            <div style={{ textAlign: "center", padding: "4rem 0", color: "hsl(210,5%,48%)" }}>No alert rules configured. Create your first rule.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
              {rules.map(r => <RuleCard key={r.id} rule={r} onToggle={toggleRule} onDelete={deleteRule} />)}
            </div>
          )
        ) : (
          events.length === 0 ? (
            <div style={{ textAlign: "center", padding: "4rem 0", color: "hsl(210,5%,48%)" }}>No alert events recorded yet.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
              {events.map(e => {
                const sc = severityColor(e.severity);
                return (
                  <div key={e.id} style={{ background: "hsla(0,0%,100%,0.025)", border: "1px solid hsla(0,0%,100%,0.07)", borderRadius: 10, padding: "0.875rem 1.125rem" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                          <Zap size={13} style={{ color: sc, flexShrink: 0 }} />
                          <span style={{ fontSize: "0.9rem", fontWeight: 600, color: "hsl(38,12%,90%)" }}>{e.rule_name}</span>
                          <span style={{ fontSize: 9, fontWeight: 700, padding: "1px 6px", borderRadius: 4, background: `${sc}15`, color: sc, border: `1px solid ${sc}25`, textTransform: "uppercase" }}>{e.severity}</span>
                          <span style={{ fontSize: 9, fontWeight: 600, padding: "1px 6px", borderRadius: 4, background: e.status === "firing" ? "hsla(0,72%,51%,0.12)" : "hsla(152,50%,42%,0.1)", color: e.status === "firing" ? "#f87171" : "#34d399", border: "1px solid", borderColor: e.status === "firing" ? "hsla(0,72%,51%,0.25)" : "hsla(152,50%,42%,0.2)", textTransform: "uppercase" }}>{e.status}</span>
                        </div>
                        <div style={{ fontSize: 12, color: "hsl(210,5%,50%)", marginLeft: 21 }}>
                          <span style={{ fontFamily: "monospace", color: "hsl(210,55%,68%)" }}>{e.metric_name}</span> = <strong style={{ color: "hsl(38,12%,80%)" }}>{e.metric_value}</strong>
                          <span style={{ marginLeft: 6 }}>(threshold: {conditionLabel(e.condition)} {e.threshold})</span>
                          <span style={{ marginLeft: 12 }}>{new Date(e.created_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                        </div>
                      </div>
                      {e.status === "firing" && (
                        <button onClick={() => acknowledge(e.id)} style={{ fontSize: 11, fontWeight: 500, padding: "0.3rem 0.75rem", borderRadius: 6, cursor: "pointer", background: "hsla(152,50%,42%,0.08)", border: "1px solid hsla(152,50%,42%,0.2)", color: "#34d399", flexShrink: 0 }}>
                          Acknowledge
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>
    </div>
  );
}
