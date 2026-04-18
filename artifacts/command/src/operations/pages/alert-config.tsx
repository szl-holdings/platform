// @ts-nocheck
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@szl-holdings/shared-ui/api-fetch";
import { Bell, Plus, AlertTriangle, CheckCircle, Clock, Zap, RefreshCw, X, Trash2 } from "lucide-react";
import { cn } from "@szl-holdings/shared-ui/utils";

interface LyteAlert {
  id: number;
  name: string;
  description: string | null;
  alertType: "threshold" | "anomaly" | "composite";
  service: string;
  metricName: string;
  condition: "gt" | "lt" | "gte" | "lte" | "eq" | "anomaly";
  threshold: number | null;
  severity: "critical" | "high" | "medium" | "low";
  status: "active" | "firing" | "resolved" | "silenced" | "draft";
  notificationChannels: string[] | null;
  firingCount: number;
  lastFiredAt: string | null;
  lastResolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  events?: AlertEvent[];
}

interface AlertEvent {
  id: number;
  alertId: number;
  eventType: "fired" | "resolved" | "silenced" | "acknowledged";
  triggerValue: number | null;
  message: string | null;
  occurredAt: string;
}

interface AlertsResponse {
  data: LyteAlert[];
  meta: { total: number; firingCount: number; activeCount: number };
}

const STATUS_CONFIG: Record<LyteAlert["status"], { label: string; color: string; bg: string; border: string; icon: React.ReactNode }> = {
  firing:   { label: "FIRING",   color: "#c45a4a", bg: "rgba(196,90,74,0.1)",  border: "rgba(196,90,74,0.25)",  icon: <AlertTriangle className="w-3 h-3" /> },
  active:   { label: "ACTIVE",   color: "#6b8f71", bg: "rgba(107,143,113,0.1)", border: "rgba(107,143,113,0.2)",  icon: <CheckCircle className="w-3 h-3" /> },
  resolved: { label: "RESOLVED", color: "#60a5fa", bg: "rgba(96,165,250,0.1)", border: "rgba(96,165,250,0.2)",  icon: <CheckCircle className="w-3 h-3" /> },
  silenced: { label: "SILENCED", color: "#6b7280", bg: "rgba(107,114,128,0.1)",border: "rgba(107,114,128,0.2)", icon: <Clock className="w-3 h-3" /> },
  draft:    { label: "DRAFT",    color: "#d4a054", bg: "rgba(212,160,84,0.1)", border: "rgba(212,160,84,0.2)",  icon: <Zap className="w-3 h-3" /> },
};

const SEV_COLORS: Record<string, string> = { critical: "#c45a4a", high: "#c8953c", medium: "#d4a054", low: "#60a5fa" };
const COND_LABELS: Record<string, string> = { gt: ">", lt: "<", gte: "≥", lte: "≤", eq: "=", anomaly: "anomaly" };

function AlertDetail({ alertId, onClose }: { alertId: number; onClose: () => void }) {
  const { data, isLoading } = useQuery({
    queryKey: ["alert-detail", alertId],
    queryFn: () => apiFetch<LyteAlert & { events: AlertEvent[] }>(`/lyte/alerts/${alertId}`),
  });

  const qc = useQueryClient();
  const updateMutation = useMutation({
    mutationFn: (patch: Partial<LyteAlert>) => apiFetch(`/lyte/alerts/${alertId}`, { method: "PATCH", body: JSON.stringify(patch) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["alerts"] }); qc.invalidateQueries({ queryKey: ["alert-detail", alertId] }); },
  });

  if (isLoading) return (
    <div className="fixed inset-0 z-50 flex" onClick={onClose}>
      <div className="flex-1 bg-black/50" />
      <div className="w-full max-w-lg border-l flex items-center justify-center" style={{ background: "#0c1626", borderColor: "rgba(255,255,255,0.08)" }}>
        <div className="w-5 h-5 border-2 border-[#d4a054] border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  );

  const alert = data!;
  const sc = STATUS_CONFIG[alert.status];

  return (
    <div className="fixed inset-0 z-50 flex" onClick={onClose}>
      <div className="flex-1 bg-black/50" />
      <div className="w-full max-w-lg border-l flex flex-col h-full overflow-y-auto" style={{ background: "#0c1626", borderColor: "rgba(255,255,255,0.08)" }} onClick={e => e.stopPropagation()}>
        <div className="p-5 border-b flex items-start justify-between" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border" style={{ color: sc.color, background: sc.bg, borderColor: sc.border }}>
                {sc.label}
              </span>
              <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded" style={{ color: SEV_COLORS[alert.severity], background: `${SEV_COLORS[alert.severity]}15` }}>
                {alert.severity}
              </span>
            </div>
            <h2 className="text-sm font-bold text-white">{alert.name}</h2>
            {alert.description && <p className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>{alert.description}</p>}
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white ml-4">✕</button>
        </div>

        <div className="p-5 space-y-5">
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Service", value: alert.service },
              { label: "Metric", value: alert.metricName },
              { label: "Condition", value: `${COND_LABELS[alert.condition]} ${alert.threshold ?? ""}` },
              { label: "Alert Type", value: alert.alertType },
              { label: "Times Fired", value: alert.firingCount.toString() },
              { label: "Last Fired", value: alert.lastFiredAt ? new Date(alert.lastFiredAt).toLocaleString() : "Never" },
            ].map(c => (
              <div key={c.label} className="p-3 rounded-lg" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="text-[9px] uppercase tracking-wider mb-1" style={{ color: "rgba(255,255,255,0.3)" }}>{c.label}</div>
                <div className="text-[11px] font-medium text-white">{c.value}</div>
              </div>
            ))}
          </div>

          {alert.notificationChannels && alert.notificationChannels.length > 0 && (
            <div>
              <div className="text-[10px] uppercase tracking-wider mb-2" style={{ color: "rgba(255,255,255,0.3)" }}>Notification Channels</div>
              <div className="flex flex-wrap gap-2">
                {alert.notificationChannels.map(ch => (
                  <span key={ch} className="text-[10px] px-2 py-1 rounded-lg border font-medium" style={{ color: "#d4a054", background: "rgba(212,160,84,0.08)", borderColor: "rgba(212,160,84,0.2)" }}>{ch}</span>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2">
            {alert.status === "active" && <button onClick={() => updateMutation.mutate({ status: "silenced" })} className="flex-1 text-[11px] py-2 rounded-lg border font-medium" style={{ color: "#6b7280", borderColor: "rgba(107,114,128,0.3)", background: "rgba(107,114,128,0.08)" }}>Silence</button>}
            {alert.status === "silenced" && <button onClick={() => updateMutation.mutate({ status: "active" })} className="flex-1 text-[11px] py-2 rounded-lg border font-medium" style={{ color: "#6b8f71", borderColor: "rgba(107,143,113,0.3)", background: "rgba(107,143,113,0.08)" }}>Re-enable</button>}
            {alert.status === "firing" && <button onClick={() => updateMutation.mutate({ status: "resolved" })} className="flex-1 text-[11px] py-2 rounded-lg border font-medium" style={{ color: "#60a5fa", borderColor: "rgba(96,165,250,0.3)", background: "rgba(96,165,250,0.08)" }}>Mark Resolved</button>}
          </div>

          {alert.events && alert.events.length > 0 && (
            <div>
              <div className="text-[10px] uppercase tracking-wider mb-2" style={{ color: "rgba(255,255,255,0.3)" }}>Alert History</div>
              <div className="space-y-1.5">
                {alert.events.slice(0, 20).map(ev => {
                  const evColor = ev.eventType === "fired" ? "#c45a4a" : ev.eventType === "resolved" ? "#6b8f71" : "#d4a054";
                  return (
                    <div key={ev.id} className="flex items-center gap-2 text-[10px]">
                      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: evColor }} />
                      <span className="capitalize font-medium" style={{ color: evColor }}>{ev.eventType}</span>
                      {ev.triggerValue != null && <span style={{ color: "rgba(255,255,255,0.4)" }}>value: {ev.triggerValue.toFixed(2)}</span>}
                      {ev.message && <span className="flex-1 truncate" style={{ color: "rgba(255,255,255,0.3)" }}>{ev.message}</span>}
                      <span className="ml-auto shrink-0" style={{ color: "rgba(255,255,255,0.2)" }}>
                        {new Date(ev.occurredAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CreateAlertModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    name: "",
    description: "",
    alertType: "threshold" as const,
    service: "",
    metricName: "",
    condition: "gt" as const,
    threshold: "",
    severity: "medium" as const,
    notificationChannels: [] as string[],
    channelInput: "",
  });

  const mutation = useMutation({
    mutationFn: (data: any) => apiFetch("/lyte/alerts", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["alerts"] }); onClose(); },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({
      name: form.name,
      description: form.description || null,
      alertType: form.alertType,
      service: form.service,
      metricName: form.metricName,
      condition: form.condition,
      threshold: form.threshold ? parseFloat(form.threshold) : null,
      severity: form.severity,
      notificationChannels: form.notificationChannels,
      status: "active",
    });
  };

  const fieldClass = "w-full px-3 py-2 rounded-lg border text-[11px] font-mono outline-none focus:border-[#d4a054]/40";
  const fieldStyle = { background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.1)", color: "white" };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <form onSubmit={handleSubmit} className="w-full max-w-md rounded-2xl border p-6 space-y-4" style={{ background: "#0c1626", borderColor: "rgba(255,255,255,0.1)" }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white">Create Alert</h2>
          <button type="button" onClick={onClose} className="text-slate-500 hover:text-white"><X className="w-4 h-4" /></button>
        </div>

        <div className="space-y-3">
          <input className={fieldClass} style={fieldStyle} placeholder="Alert name *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
          <input className={fieldClass} style={fieldStyle} placeholder="Description (optional)" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          <div className="grid grid-cols-2 gap-3">
            <select className={fieldClass} style={fieldStyle} value={form.alertType} onChange={e => setForm(f => ({ ...f, alertType: e.target.value as any }))}>
              <option value="threshold">Threshold</option>
              <option value="anomaly">Anomaly</option>
              <option value="composite">Composite</option>
            </select>
            <select className={fieldClass} style={fieldStyle} value={form.severity} onChange={e => setForm(f => ({ ...f, severity: e.target.value as any }))}>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input className={fieldClass} style={fieldStyle} placeholder="Service *" value={form.service} onChange={e => setForm(f => ({ ...f, service: e.target.value }))} required />
            <input className={fieldClass} style={fieldStyle} placeholder="Metric name *" value={form.metricName} onChange={e => setForm(f => ({ ...f, metricName: e.target.value }))} required />
          </div>
          {form.alertType !== "anomaly" && (
            <div className="grid grid-cols-2 gap-3">
              <select className={fieldClass} style={fieldStyle} value={form.condition} onChange={e => setForm(f => ({ ...f, condition: e.target.value as any }))}>
                <option value="gt">&gt; Greater than</option>
                <option value="lt">&lt; Less than</option>
                <option value="gte">≥ Greater or equal</option>
                <option value="lte">≤ Less or equal</option>
              </select>
              <input className={fieldClass} style={fieldStyle} placeholder="Threshold value" type="number" value={form.threshold} onChange={e => setForm(f => ({ ...f, threshold: e.target.value }))} />
            </div>
          )}
          <div className="flex gap-2">
            <input
              className={fieldClass} style={fieldStyle}
              placeholder="Add notification channel (e.g. slack)"
              value={form.channelInput}
              onChange={e => setForm(f => ({ ...f, channelInput: e.target.value }))}
              onKeyDown={e => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (form.channelInput.trim()) {
                    setForm(f => ({ ...f, notificationChannels: [...f.notificationChannels, f.channelInput.trim()], channelInput: "" }));
                  }
                }
              }}
            />
            <button type="button" onClick={() => {
              if (form.channelInput.trim()) setForm(f => ({ ...f, notificationChannels: [...f.notificationChannels, f.channelInput.trim()], channelInput: "" }));
            }} className="px-3 py-2 rounded-lg border text-[10px]" style={{ borderColor: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.4)" }}>Add</button>
          </div>
          {form.notificationChannels.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {form.notificationChannels.map(ch => (
                <span key={ch} className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg" style={{ background: "rgba(212,160,84,0.1)", border: "1px solid rgba(212,160,84,0.2)", color: "#d4a054" }}>
                  {ch}
                  <button type="button" onClick={() => setForm(f => ({ ...f, notificationChannels: f.notificationChannels.filter(c => c !== ch) }))}><X className="w-2.5 h-2.5" /></button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-1">
          <button type="button" onClick={onClose} className="flex-1 py-2 rounded-lg border text-[11px]" style={{ borderColor: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.4)" }}>Cancel</button>
          <button type="submit" disabled={mutation.isPending} className="flex-1 py-2 rounded-lg text-[11px] font-semibold" style={{ background: "rgba(212,160,84,0.15)", border: "1px solid rgba(212,160,84,0.3)", color: "#d4a054" }}>
            {mutation.isPending ? "Creating..." : "Create Alert"}
          </button>
        </div>
        {mutation.isError && <p className="text-[10px] text-[#c45a4a]">{String(mutation.error)}</p>}
      </form>
    </div>
  );
}

export default function AlertConfig() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedAlert, setSelectedAlert] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);

  const params = new URLSearchParams();
  if (statusFilter !== "all") params.set("status", statusFilter);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["alerts", statusFilter],
    queryFn: async () => {
      const result = await apiFetch<any>(`/lyte/alerts?${params}&limit=100`);
      return result;
    },
    refetchInterval: 30000,
  });

  const alerts: LyteAlert[] = Array.isArray(data) ? data : (data?.data ?? []);
  const meta = data?.meta ?? {};
  const firingCount = alerts.filter(a => a.status === "firing").length;
  const activeCount = alerts.filter(a => a.status === "active").length;

  const qc = useQueryClient();
  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiFetch(`/lyte/alerts/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["alerts"] }),
  });

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Bell className="w-3.5 h-3.5" style={{ color: "#d4a054" }} />
            <span className="text-[10px] font-bold uppercase tracking-widest font-mono" style={{ color: "#d4a054" }}>Lyte · Alert Config</span>
          </div>
          <h1 className="text-xl font-bold text-white">Alert Configuration</h1>
          <p className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>Threshold, anomaly, and composite alert rules with history and notification channels.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => refetch()} className="flex items-center gap-1.5 text-[10px] px-3 py-1.5 rounded-lg border" style={{ color: "rgba(255,255,255,0.4)", borderColor: "rgba(255,255,255,0.1)" }}>
            <RefreshCw className="w-3 h-3" />
          </button>
          <button onClick={() => setCreating(true)} className="flex items-center gap-1.5 text-[10px] px-3 py-1.5 rounded-lg border font-semibold" style={{ color: "#d4a054", borderColor: "rgba(212,160,84,0.3)", background: "rgba(212,160,84,0.08)" }}>
            <Plus className="w-3 h-3" /> New Alert
          </button>
        </div>
      </div>

      <div className="rounded-xl border overflow-hidden" style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.015)" }}>
        <div className="flex items-stretch">
          {[
            { label: "Firing Now", value: firingCount.toString(), color: firingCount > 0 ? "#c45a4a" : "rgba(255,255,255,0.3)", pulse: firingCount > 0 },
            { label: "Active Rules", value: activeCount.toString(), color: "#6b8f71" },
            { label: "Total Alerts", value: alerts.length.toString(), color: "rgba(255,255,255,0.5)" },
          ].map((c, i) => (
            <div key={c.label} className="flex-1 px-4 py-3 text-center" style={{ borderLeft: i > 0 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
              <div className="flex items-center justify-center gap-1.5 mb-0.5">
                <span className="text-lg font-bold font-mono" style={{ color: c.color }}>{c.value}</span>
                {c.pulse && <span className="w-1.5 h-1.5 rounded-full animate-pulse shrink-0 bg-[#c45a4a]" />}
              </div>
              <div className="text-[9px] font-medium uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.3)" }}>{c.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {["all", "firing", "active", "resolved", "silenced", "draft"].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className="text-[10px] px-3 py-1.5 rounded-lg border font-medium capitalize"
            style={{
              background: statusFilter === s ? "rgba(212,160,84,0.1)" : "transparent",
              color: statusFilter === s ? "#d4a054" : "rgba(255,255,255,0.35)",
              borderColor: statusFilter === s ? "rgba(212,160,84,0.3)" : "rgba(255,255,255,0.08)",
            }}
          >{s}</button>
        ))}
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-12"><div className="w-5 h-5 border-2 border-[#d4a054] border-t-transparent rounded-full animate-spin" /></div>
      )}

      {isError && (
        <div className="p-4 rounded-xl border flex items-center gap-3" style={{ borderColor: "rgba(196,90,74,0.2)", background: "rgba(196,90,74,0.06)" }}>
          <AlertTriangle className="w-4 h-4 text-[#c45a4a]" />
          <p className="text-sm text-[#c45a4a]">Failed to load alerts.</p>
        </div>
      )}

      {!isLoading && !isError && alerts.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Bell className="w-8 h-8" style={{ color: "rgba(212,160,84,0.2)" }} />
          <p className="text-sm text-slate-400">No alerts configured yet.</p>
          <button onClick={() => setCreating(true)} className="text-[11px] px-4 py-2 rounded-lg border font-medium" style={{ color: "#d4a054", borderColor: "rgba(212,160,84,0.3)", background: "rgba(212,160,84,0.08)" }}>
            Create First Alert
          </button>
        </div>
      )}

      <div className="space-y-2">
        {alerts.map(alert => {
          const sc = STATUS_CONFIG[alert.status];
          const sevColor = SEV_COLORS[alert.severity];
          return (
            <div key={alert.id}
              className="group rounded-xl border cursor-pointer transition-all hover:border-opacity-50"
              style={{ borderColor: alert.status === "firing" ? "rgba(196,90,74,0.25)" : "rgba(255,255,255,0.07)", background: alert.status === "firing" ? "rgba(196,90,74,0.04)" : "rgba(255,255,255,0.012)" }}
              onClick={() => setSelectedAlert(alert.id)}
            >
              <div className="p-4 flex items-center gap-4">
                <div className="shrink-0 flex items-center gap-2">
                  <span className="flex items-center gap-1 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border" style={{ color: sc.color, background: sc.bg, borderColor: sc.border }}>
                    {sc.icon}{sc.label}
                  </span>
                  {alert.status === "firing" && <span className="w-1.5 h-1.5 rounded-full animate-pulse bg-[#c45a4a]" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-semibold text-white">{alert.name}</span>
                    <span className="text-[9px] font-bold uppercase px-1 py-0.5 rounded" style={{ color: sevColor, background: `${sevColor}12` }}>{alert.severity}</span>
                  </div>
                  <div className="text-[10px]" style={{ color: "rgba(255,255,255,0.35)" }}>
                    {alert.service} · {alert.metricName} {COND_LABELS[alert.condition]} {alert.threshold ?? ""} · {alert.alertType}
                  </div>
                </div>
                <div className="shrink-0 flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-[10px] font-mono" style={{ color: alert.firingCount > 0 ? "#c45a4a" : "rgba(255,255,255,0.3)" }}>{alert.firingCount}x fired</div>
                    {alert.lastFiredAt && <div className="text-[9px]" style={{ color: "rgba(255,255,255,0.2)" }}>
                      {new Date(alert.lastFiredAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </div>}
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); if (confirm("Delete this alert?")) deleteMutation.mutate(alert.id); }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-[#c45a4a]/10"
                    style={{ color: "rgba(196,90,74,0.5)" }}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {selectedAlert && <AlertDetail alertId={selectedAlert} onClose={() => setSelectedAlert(null)} />}
      {creating && <CreateAlertModal onClose={() => setCreating(false)} />}
    </div>
  );
}
