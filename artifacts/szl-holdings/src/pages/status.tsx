import { useState, useEffect } from "react";
import { m } from "framer-motion";
import { CheckCircle, AlertTriangle, XCircle, Clock, RefreshCw, Bell, ChevronDown, ChevronUp, Activity, Shield } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";


interface ServiceStatus {
  id: string;
  name: string;
  description: string;
  status: "operational" | "degraded" | "outage";
  latencyMs: number | null;
  uptime30d: number;
  uptime90d: number;
}

interface IncidentUpdate {
  id: number;
  message: string;
  status: string;
  created_at: string;
}

interface Incident {
  id: number;
  title: string;
  status: string;
  severity: string;
  affected_services: string[];
  description: string;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
  updates: IncidentUpdate[];
}

interface StatusData {
  overall: "operational" | "degraded" | "outage";
  lastChecked: string;
  services: ServiceStatus[];
  incidents: Incident[];
}

interface DayUptime {
  uptime: number;
  latency: number | null;
}
type UptimeHistory = Record<string, Record<string, DayUptime>>;

function statusColor(status: string): string {
  if (status === "operational") return "#10b981";
  if (status === "degraded") return "#f59e0b";
  return "#ef4444";
}

function StatusDot({ status }: { status: string }) {
  const color = statusColor(status);
  return (
    <span style={{ position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center", width: 10, height: 10 }}>
      {status === "operational" && (
        <span style={{
          position: "absolute",
          width: 16, height: 16,
          borderRadius: "50%",
          background: color,
          opacity: 0.25,
          animation: "ping 2s cubic-bezier(0,0,0.2,1) infinite",
        }} />
      )}
      <span style={{ width: 8, height: 8, borderRadius: "50%", background: color, display: "block", position: "relative" }} />
    </span>
  );
}

function UptimeBadge({ value, label }: { value: number; label: string }) {
  const color = value >= 99.9 ? "#10b981" : value >= 99 ? "#f59e0b" : "#ef4444";
  return (
    <div style={{ textAlign: "right" }}>
      <div style={{ fontSize: "13px", fontWeight: "700", fontFamily: "monospace", color }}>{value.toFixed(2)}%</div>
      <div style={{ fontSize: "10px", color: "hsl(210,5%,40%)", marginTop: 1 }}>{label}</div>
    </div>
  );
}

function UptimeBar({ service, history }: { service: ServiceStatus; history: Record<string, DayUptime> }) {
  const [tooltip, setTooltip] = useState<{ day: string; x: number; y: number } | null>(null);
  const bars = 90;
  const days = Array.from({ length: bars }, (_, i) => {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - (bars - 1 - i));
    return d.toISOString().slice(0, 10);
  });

  const tooltipData = tooltip ? history[tooltip.day] : null;

  return (
    <div style={{ position: "relative" }}>
      <div style={{ display: "flex", gap: 2, alignItems: "flex-end", height: 24 }}>
        {days.map((day, i) => {
          const isLast = i === bars - 1;
          const dayData = history[day];
          const hasData = dayData !== undefined;
          const fraction = dayData?.uptime ?? 0;
          const color = isLast && service.status !== "operational"
            ? statusColor(service.status)
            : hasData && fraction < 0.99 ? (fraction < 0.95 ? "#ef4444" : "#f59e0b") : "#10b981";
          const opacity = isLast ? 1 : hasData ? 0.35 + fraction * 0.65 : 0.2;
          const height = isLast ? 20 : hasData ? 10 + fraction * 10 : 10;
          return (
            <div
              key={day}
              onMouseEnter={(e) => {
                const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                const parentRect = (e.currentTarget as HTMLElement).parentElement!.parentElement!.getBoundingClientRect();
                setTooltip({ day, x: rect.left - parentRect.left + rect.width / 2, y: rect.top - parentRect.top });
              }}
              onMouseLeave={() => setTooltip(null)}
              style={{
                width: 3, height,
                background: color, borderRadius: 2, opacity,
                flexShrink: 0, cursor: "default",
              }}
            />
          );
        })}
      </div>

      {tooltip && (
        <div style={{
          position: "absolute",
          bottom: "calc(100% + 8px)",
          left: tooltip.x,
          transform: "translateX(-50%)",
          background: "hsl(210,12%,10%)",
          border: "1px solid hsla(0,0%,100%,0.12)",
          borderRadius: 6,
          padding: "6px 10px",
          pointerEvents: "none",
          whiteSpace: "nowrap",
          zIndex: 50,
          boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
        }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "hsl(38,12%,88%)", marginBottom: 3 }}>
            {new Date(tooltip.day + "T00:00:00Z").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" })}
          </div>
          {tooltipData ? (
            <>
              <div style={{ fontSize: 11, color: tooltipData.uptime >= 0.99 ? "#10b981" : tooltipData.uptime >= 0.95 ? "#f59e0b" : "#ef4444" }}>
                {(tooltipData.uptime * 100).toFixed(2)}% uptime
              </div>
              {tooltipData.latency !== null && (
                <div style={{ fontSize: 11, color: "hsl(210,5%,52%)", marginTop: 1 }}>
                  {tooltipData.latency}ms avg latency
                </div>
              )}
            </>
          ) : (
            <div style={{ fontSize: 11, color: "hsl(210,5%,44%)" }}>No metrics yet</div>
          )}
        </div>
      )}
    </div>
  );
}

function OverallBanner({ status }: { status: string }) {
  const isOp = status === "operational";
  const isDeg = status === "degraded";
  const color = isOp ? "#10b981" : isDeg ? "#f59e0b" : "#ef4444";
  const bgColor = isOp ? "hsla(152,50%,42%,0.08)" : isDeg ? "hsla(38,90%,50%,0.08)" : "hsla(0,72%,51%,0.08)";
  const Icon = isOp ? CheckCircle : isDeg ? AlertTriangle : XCircle;
  const msg = isOp
    ? "All systems operational"
    : isDeg
    ? "Some systems are experiencing degraded performance"
    : "Service disruption in progress";

  return (
    <div style={{
      borderRadius: 12,
      border: `1px solid ${color}30`,
      background: bgColor,
      padding: "1.25rem 1.75rem",
      display: "flex",
      alignItems: "center",
      gap: "1rem",
    }}>
      <Icon size={22} style={{ color, flexShrink: 0 }} />
      <div>
        <div style={{ fontSize: "1rem", fontWeight: "700", color: "hsl(38,12%,94%)" }}>{msg}</div>
        <div style={{ fontSize: "12px", color: "hsl(210,5%,52%)", marginTop: 2 }}>
          Monitoring {6} services · Updated every 5 minutes
        </div>
      </div>
    </div>
  );
}

function IncidentCard({ incident }: { incident: Incident }) {
  const [expanded, setExpanded] = useState(false);
  const isActive = incident.status !== "resolved";
  const severityColor = incident.severity === "critical" ? "#ef4444" : incident.severity === "major" ? "#f59e0b" : "#6b7280";

  return (
    <div style={{
      background: "hsla(0,0%,100%,0.02)",
      border: `1px solid ${isActive ? "hsla(38,90%,50%,0.2)" : "hsla(0,0%,100%,0.06)"}`,
      borderRadius: 10,
      overflow: "hidden",
    }}>
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          width: "100%", textAlign: "left", padding: "1rem 1.25rem",
          background: "none", border: "none", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", flex: 1 }}>
          <div style={{
            marginTop: 2,
            width: 8, height: 8, borderRadius: "50%",
            background: isActive ? "#f59e0b" : "#10b981",
            flexShrink: 0,
          }} />
          <div>
            <div style={{ fontSize: "0.9375rem", fontWeight: "600", color: "hsl(38,12%,92%)" }}>{incident.title}</div>
            <div style={{ display: "flex", gap: "0.75rem", marginTop: 4, flexWrap: "wrap" }}>
              <span style={{ fontSize: 11, color: "hsl(210,5%,50%)" }}>{new Date(incident.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
              <span style={{
                fontSize: 10, fontWeight: 600, padding: "1px 7px", borderRadius: 4,
                background: `${severityColor}18`, color: severityColor,
                border: `1px solid ${severityColor}30`, textTransform: "uppercase" as const, letterSpacing: "0.05em",
              }}>{incident.severity}</span>
              <span style={{
                fontSize: 10, fontWeight: 600, padding: "1px 7px", borderRadius: 4,
                background: isActive ? "hsla(38,90%,50%,0.12)" : "hsla(152,50%,42%,0.12)",
                color: isActive ? "#f59e0b" : "#10b981",
                border: `1px solid ${isActive ? "hsla(38,90%,50%,0.25)" : "hsla(152,50%,42%,0.25)"}`,
                textTransform: "uppercase" as const, letterSpacing: "0.05em",
              }}>{incident.status.replace(/_/g, " ")}</span>
            </div>
          </div>
        </div>
        {expanded ? <ChevronUp size={14} style={{ color: "hsl(210,5%,42%)", flexShrink: 0 }} /> : <ChevronDown size={14} style={{ color: "hsl(210,5%,42%)", flexShrink: 0 }} />}
      </button>

      {expanded && (
        <div style={{ padding: "0 1.25rem 1.25rem", borderTop: "1px solid hsla(0,0%,100%,0.04)" }}>
          {incident.affected_services.length > 0 && (
            <div style={{ marginTop: "0.875rem", marginBottom: "0.875rem" }}>
              <span style={{ fontSize: 11, color: "hsl(210,5%,48%)", marginRight: 8 }}>Affected:</span>
              {incident.affected_services.map(s => (
                <span key={s} style={{
                  fontSize: 11, padding: "1px 7px", borderRadius: 4,
                  background: "hsla(0,0%,100%,0.05)", border: "1px solid hsla(0,0%,100%,0.08)",
                  color: "hsl(38,12%,78%)", marginRight: 6,
                }}>{s}</span>
              ))}
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column" as const, gap: "0.75rem" }}>
            {incident.updates.map((u) => (
              <div key={u.id} style={{
                paddingLeft: "1rem",
                borderLeft: "2px solid hsla(0,0%,100%,0.06)",
              }}>
                <div style={{ fontSize: "0.8125rem", color: "hsl(38,12%,82%)", lineHeight: 1.6, marginBottom: 2 }}>{u.message}</div>
                <div style={{ fontSize: "11px", color: "hsl(210,5%,44%)" }}>
                  {new Date(u.created_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  {" · "}
                  <span style={{ textTransform: "capitalize" as const }}>{u.status.replace(/_/g, " ")}</span>
                </div>
              </div>
            ))}
          </div>
          {incident.resolved_at && (
            <div style={{ marginTop: "0.875rem", fontSize: "12px", color: "#10b981" }}>
              Resolved: {new Date(incident.resolved_at).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function StatusPage() {
  const [data, setData] = useState<StatusData | null>(null);
  const [uptimeHistory, setUptimeHistory] = useState<UptimeHistory>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [email, setEmail] = useState("");
  const [subState, setSubState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [subError, setSubError] = useState("");

  const fetchStatus = async (refresh = false) => {
    if (refresh) setRefreshing(true);
    try {
      const [statusRes, historyRes] = await Promise.all([
        fetch("/api/public/status"),
        fetch("/api/public/uptime-history"),
      ]);
      if (!statusRes.ok) throw new Error("Failed to load");
      const json = await statusRes.json() as StatusData;
      setData(json);
      if (historyRes.ok) {
        const histJson = await historyRes.json() as { history: UptimeHistory };
        setUptimeHistory(histJson.history ?? {});
      }
    } catch {
      // keep old data on error
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(() => fetchStatus(), 60000);
    return () => clearInterval(interval);
  }, []);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubState("loading");
    setSubError("");
    try {
      const res = await fetch("/api/public/status/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const json = await res.json() as { ok?: boolean; error?: string };
      if (!res.ok || !json.ok) throw new Error(json.error ?? "Subscription failed");
      setSubState("done");
      setEmail("");
    } catch (err) {
      setSubError((err as Error).message);
      setSubState("error");
    }
  };

  const activeIncidents = data?.incidents.filter(i => i.status !== "resolved") ?? [];
  const resolvedIncidents = data?.incidents.filter(i => i.status === "resolved") ?? [];

  return (
    <div style={{ minHeight: "100vh", background: "hsl(210,12%,5%)" }}>
      <style>{`
        @keyframes ping {
          75%, 100% { transform: scale(2); opacity: 0; }
        }
      `}</style>
      <Navbar />

      {/* Hero */}
      <section style={{
        paddingTop: "clamp(7rem,12vw,10rem)",
        paddingBottom: "clamp(3rem,5vw,4rem)",
        borderBottom: "1px solid hsla(0,0%,100%,0.05)",
      }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 clamp(1.25rem,5vw,2.5rem)" }}>
          <m.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem", marginBottom: "1.75rem" }}>
              <div>
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  fontSize: 11, fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase",
                  color: "hsl(210,5%,50%)", marginBottom: "0.75rem",
                  padding: "3px 10px", borderRadius: 5,
                  background: "hsla(0,0%,100%,0.04)", border: "1px solid hsla(0,0%,100%,0.08)",
                }}>
                  <Activity size={10} />
                  System Status
                </span>
                <h1 style={{
                  fontSize: "clamp(1.75rem,3.5vw,2.5rem)", fontWeight: 700,
                  letterSpacing: "-0.025em", lineHeight: 1.1,
                  color: "hsl(38,12%,94%)", marginBottom: "0.75rem",
                }}>SZL Platform Status</h1>
                <p style={{ fontSize: "1rem", color: "hsl(210,5%,56%)", lineHeight: 1.6 }}>
                  Real-time status and incident history for all SZL Holdings services.
                </p>
              </div>
              <button
                onClick={() => fetchStatus(true)}
                disabled={refreshing}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  padding: "0.5rem 1rem", borderRadius: 6,
                  background: "hsla(0,0%,100%,0.04)", border: "1px solid hsla(0,0%,100%,0.08)",
                  color: "hsl(210,5%,56%)", fontSize: 12, fontWeight: 500, cursor: "pointer",
                  flexShrink: 0,
                }}
              >
                <RefreshCw size={13} style={{ animation: refreshing ? "spin 0.8s linear infinite" : "none" }} />
                Refresh
              </button>
            </div>

            {loading ? (
              <div style={{
                borderRadius: 12, border: "1px solid hsla(0,0%,100%,0.06)",
                background: "hsla(0,0%,100%,0.02)", padding: "1.25rem 1.75rem",
                display: "flex", alignItems: "center", gap: 12,
              }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#6b7280" }} />
                <span style={{ fontSize: "0.9375rem", color: "hsl(210,5%,56%)" }}>Checking service status...</span>
              </div>
            ) : data ? (
              <OverallBanner status={data.overall} />
            ) : null}

            {data && (
              <div style={{ fontSize: 11, color: "hsl(210,5%,38%)", marginTop: "0.75rem" }}>
                Last updated: {new Date(data.lastChecked).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
              </div>
            )}
          </m.div>
        </div>
      </section>

      {/* Services */}
      <section style={{ paddingTop: "clamp(3rem,5vw,4rem)", paddingBottom: "clamp(2rem,4vw,3rem)" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 clamp(1.25rem,5vw,2.5rem)" }}>
          <m.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
          >
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              marginBottom: "1.5rem", flexWrap: "wrap", gap: "0.75rem",
            }}>
              <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "hsl(38,12%,92%)" }}>Service Status</h2>
              <div style={{ display: "flex", gap: "1.25rem" }}>
                {(["operational", "degraded", "outage"] as const).map(s => (
                  <span key={s} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "hsl(210,5%,50%)" }}>
                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: statusColor(s), display: "block" }} />
                    <span style={{ textTransform: "capitalize" }}>{s}</span>
                  </span>
                ))}
              </div>
            </div>

            <div style={{
              background: "hsla(0,0%,100%,0.02)",
              border: "1px solid hsla(0,0%,100%,0.06)",
              borderRadius: 12,
              overflow: "hidden",
            }}>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} style={{
                    padding: "1.125rem 1.5rem",
                    borderBottom: i < 5 ? "1px solid hsla(0,0%,100%,0.04)" : "none",
                    display: "flex", alignItems: "center", gap: "1rem",
                  }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: "hsla(0,0%,100%,0.06)" }} />
                    <div style={{ flex: 1, height: 12, background: "hsla(0,0%,100%,0.05)", borderRadius: 4, maxWidth: 180 }} />
                    <div style={{ width: 60, height: 12, background: "hsla(0,0%,100%,0.05)", borderRadius: 4 }} />
                  </div>
                ))
              ) : (
                (data?.services ?? []).map((svc, i) => (
                  <div key={svc.id} style={{
                    padding: "1.125rem 1.5rem",
                    borderBottom: i < (data?.services.length ?? 1) - 1 ? "1px solid hsla(0,0%,100%,0.04)" : "none",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flex: 1 }}>
                        <StatusDot status={svc.status} />
                        <div>
                          <div style={{ fontSize: "0.9375rem", fontWeight: 600, color: "hsl(38,12%,92%)" }}>{svc.name}</div>
                          <div style={{ fontSize: 12, color: "hsl(210,5%,50%)", marginTop: 1 }}>{svc.description}</div>
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "1.5rem", flexShrink: 0 }}>
                        {svc.latencyMs && (
                          <div style={{ textAlign: "right" }}>
                            <div style={{ fontSize: "13px", fontWeight: "700", fontFamily: "monospace", color: svc.latencyMs < 100 ? "#10b981" : svc.latencyMs < 300 ? "#f59e0b" : "#ef4444" }}>{svc.latencyMs}ms</div>
                            <div style={{ fontSize: "10px", color: "hsl(210,5%,40%)", marginTop: 1 }}>response</div>
                          </div>
                        )}
                        <UptimeBadge value={svc.uptime30d} label="30d" />
                        <UptimeBadge value={svc.uptime90d} label="90d" />
                        <span style={{
                          fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 4,
                          background: `${statusColor(svc.status)}15`,
                          color: statusColor(svc.status),
                          border: `1px solid ${statusColor(svc.status)}28`,
                          textTransform: "capitalize",
                          minWidth: 80, textAlign: "center",
                        }}>{svc.status}</span>
                      </div>
                    </div>
                    <div style={{ marginTop: "0.75rem", paddingLeft: "1.5rem" }}>
                      <UptimeBar service={svc} history={uptimeHistory[svc.id] ?? {}} />
                      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 3 }}>
                        <span style={{ fontSize: 10, color: "hsl(210,5%,34%)" }}>90 days ago</span>
                        <span style={{ fontSize: 10, color: "hsl(210,5%,34%)" }}>Today</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </m.div>
        </div>
      </section>

      {/* Active Incidents */}
      {!loading && activeIncidents.length > 0 && (
        <section style={{ paddingTop: "clamp(2rem,4vw,3rem)", paddingBottom: "clamp(2rem,4vw,3rem)" }}>
          <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 clamp(1.25rem,5vw,2.5rem)" }}>
            <m.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.14, ease: [0.22, 1, 0.36, 1] }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "1.25rem" }}>
                <AlertTriangle size={15} style={{ color: "#f59e0b" }} />
                <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "hsl(38,12%,92%)" }}>Active Incidents</h2>
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: "1px 7px", borderRadius: 4,
                  background: "hsla(38,90%,50%,0.12)", color: "#f59e0b",
                  border: "1px solid hsla(38,90%,50%,0.25)",
                }}>{activeIncidents.length}</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {activeIncidents.map(i => <IncidentCard key={i.id} incident={i} />)}
              </div>
            </m.div>
          </div>
        </section>
      )}

      {/* Incident History */}
      <section style={{
        paddingTop: "clamp(2rem,4vw,3rem)",
        paddingBottom: "clamp(3rem,5vw,4rem)",
        borderTop: "1px solid hsla(0,0%,100%,0.05)",
      }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 clamp(1.25rem,5vw,2.5rem)" }}>
          <m.div
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "1.25rem" }}>
              <Clock size={15} style={{ color: "hsl(210,5%,52%)" }} />
              <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "hsl(38,12%,92%)" }}>Incident History</h2>
            </div>

            {!loading && resolvedIncidents.length === 0 && activeIncidents.length === 0 ? (
              <div style={{
                background: "hsla(0,0%,100%,0.02)", border: "1px solid hsla(0,0%,100%,0.06)",
                borderRadius: 10, padding: "2rem 1.5rem", textAlign: "center",
              }}>
                <CheckCircle size={24} style={{ color: "#10b981", margin: "0 auto 0.75rem" }} />
                <div style={{ fontSize: "0.9375rem", fontWeight: 600, color: "hsl(38,12%,86%)", marginBottom: 4 }}>No incidents recorded</div>
                <div style={{ fontSize: 13, color: "hsl(210,5%,48%)" }}>All systems have been operating normally.</div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {resolvedIncidents.map(i => <IncidentCard key={i.id} incident={i} />)}
              </div>
            )}
          </m.div>
        </div>
      </section>

      {/* Email Subscription */}
      <section style={{
        paddingTop: "clamp(3rem,5vw,4rem)",
        paddingBottom: "clamp(3rem,5vw,4rem)",
        background: "hsla(0,0%,100%,0.015)",
        borderTop: "1px solid hsla(0,0%,100%,0.05)",
        borderBottom: "1px solid hsla(0,0%,100%,0.05)",
      }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 clamp(1.25rem,5vw,2.5rem)" }}>
          <m.div
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            style={{ maxWidth: 560 }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "0.75rem" }}>
              <Bell size={15} style={{ color: "hsl(210,55%,52%)" }} />
              <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "hsl(38,12%,92%)" }}>Get notified</h2>
            </div>
            <p style={{ fontSize: "0.9375rem", color: "hsl(210,5%,56%)", lineHeight: 1.6, marginBottom: "1.25rem" }}>
              Subscribe to receive email alerts when incidents are created or resolved. No marketing, status updates only.
            </p>

            {subState === "done" ? (
              <div style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "0.75rem 1rem", borderRadius: 8,
                background: "hsla(152,50%,42%,0.1)", border: "1px solid hsla(152,50%,42%,0.2)",
              }}>
                <CheckCircle size={14} style={{ color: "#10b981" }} />
                <span style={{ fontSize: "0.875rem", color: "#10b981" }}>You're subscribed. We'll notify you of any incidents.</span>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} style={{ display: "flex", gap: "0.625rem", flexWrap: "wrap" }}>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  required
                  style={{
                    flex: 1, minWidth: 220, padding: "0.625rem 0.875rem",
                    background: "hsla(0,0%,100%,0.04)", border: "1px solid hsla(0,0%,100%,0.1)",
                    borderRadius: 7, color: "hsl(38,12%,88%)", fontSize: "0.875rem",
                    outline: "none",
                  }}
                />
                <button
                  type="submit"
                  disabled={subState === "loading"}
                  style={{
                    padding: "0.625rem 1.125rem", borderRadius: 7,
                    background: "hsl(210,55%,52%)", border: "none",
                    color: "#fff", fontSize: "0.875rem", fontWeight: 600,
                    cursor: subState === "loading" ? "not-allowed" : "pointer",
                    opacity: subState === "loading" ? 0.7 : 1,
                    flexShrink: 0,
                  }}
                >
                  {subState === "loading" ? "Subscribing..." : "Subscribe"}
                </button>
                {subState === "error" && (
                  <div style={{ width: "100%", fontSize: 12, color: "#ef4444" }}>{subError}</div>
                )}
              </form>
            )}
          </m.div>
        </div>
      </section>

      {/* Trust Center Link */}
      <section style={{ paddingTop: "2rem", paddingBottom: "2.5rem" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 clamp(1.25rem,5vw,2.5rem)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Shield size={13} style={{ color: "hsl(210,5%,46%)" }} />
            <span style={{ fontSize: 12, color: "hsl(210,5%,46%)" }}>
              For security practices, compliance information, and data handling details, visit our{" "}
              <a href="/trust" style={{ color: "hsl(210,55%,52%)", textDecoration: "none" }}>Trust Center</a>.
            </span>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
