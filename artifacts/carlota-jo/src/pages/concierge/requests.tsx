import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Crown, AlertTriangle, CheckCircle2, Clock, Shield,
  ChevronDown, ChevronUp, User, ArrowRight, Plus, Filter,
} from "lucide-react";
import {
  SERVICE_REQUESTS, CLIENT_DOSSIERS, SERVICE_PLAYBOOKS,
  getSLALabel, getTierBadgeColor, getRequestPriorityLabel,
  getStatusLabel, getCategoryLabel, DEMO_NOTE,
  type ServiceRequest, type SLAStatus, type RequestStatus,
} from "@/data/concierge-data";

const GOLD = "#9A7D52";
const INK = "#1A1A1A";
const MUTED = "#6B6B6B";
const CREAM = "#F9F7F3";
const BORDER = "rgba(154,125,82,0.18)";
const RED = "#C0392B";
const AMBER = "#B7862E";
const GREEN = "#2E7D53";

function slaColor(s: SLAStatus) {
  if (s === "on-track") return GREEN;
  if (s === "at-risk") return AMBER;
  return RED;
}

function statusColor(s: RequestStatus) {
  if (s === "resolved") return GREEN;
  if (s === "escalated") return RED;
  if (s === "in-progress") return GOLD;
  return MUTED;
}

function StatusPill({ status }: { status: RequestStatus }) {
  const color = statusColor(status);
  return (
    <span style={{
      fontSize: 10,
      letterSpacing: "0.12em",
      textTransform: "uppercase",
      color,
      background: `${color}12`,
      border: `1px solid ${color}40`,
      borderRadius: 5,
      padding: "2px 8px",
      fontWeight: 600,
    }}>
      {getStatusLabel(status)}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: ServiceRequest["priority"] }) {
  if (priority === "vip-exception") {
    return (
      <span style={{
        fontSize: 9,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        color: AMBER,
        background: `${AMBER}12`,
        border: `1px solid ${AMBER}40`,
        borderRadius: 4,
        padding: "2px 7px",
        fontWeight: 600,
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
      }}>
        <Crown size={9} /> VIP Exception
      </span>
    );
  }
  if (priority === "priority") {
    return (
      <span style={{
        fontSize: 9,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        color: GOLD,
        background: `${GOLD}12`,
        border: `1px solid ${GOLD}40`,
        borderRadius: 4,
        padding: "2px 7px",
        fontWeight: 600,
      }}>
        Priority
      </span>
    );
  }
  return null;
}

function AuditEntry({ entry }: { entry: { timestamp: string; actor: string; action: string; redacted?: boolean } }) {
  const d = new Date(entry.timestamp);
  const formatted = d.toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
  return (
    <div style={{ display: "flex", gap: 12, paddingBottom: 12, position: "relative" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0, width: 24 }}>
        <div style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: GOLD,
          border: `2px solid rgba(154,125,82,0.3)`,
          zIndex: 1,
          marginTop: 4,
        }} />
        <div style={{ width: 1, flex: 1, background: BORDER, marginTop: 4 }} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 11, color: MUTED, marginBottom: 2 }}>{formatted} · {entry.actor}</div>
        <div style={{ fontSize: 12, color: INK }}>{entry.action}</div>
      </div>
    </div>
  );
}

function RequestCard({ request }: { request: ServiceRequest }) {
  const [expanded, setExpanded] = useState(false);
  const playbook = SERVICE_PLAYBOOKS.find(p => p.id === request.playbookId);
  const tierColor = getTierBadgeColor(request.clientTier);

  const deadline = new Date(request.slaDeadline);
  const deadlineStr = deadline.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });

  return (
    <motion.div
      layout
      style={{
        background: request.priority === "vip-exception" ? `rgba(183,134,46,0.04)` : "#fff",
        border: request.priority === "vip-exception"
          ? `1px solid ${AMBER}50`
          : `1px solid ${BORDER}`,
        borderRadius: 14,
        overflow: "hidden",
        borderLeft: request.priority === "vip-exception"
          ? `4px solid ${AMBER}`
          : request.status === "resolved"
            ? `4px solid ${GREEN}`
            : `4px solid ${BORDER}`,
      }}
    >
      {/* Header */}
      <div
        style={{ padding: "18px 22px", cursor: "pointer", display: "flex", gap: 14, alignItems: "flex-start" }}
        onClick={() => setExpanded(e => !e)}
      >
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
            <span style={{
              fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase",
              color: tierColor, border: `1px solid ${tierColor}40`, background: `${tierColor}10`,
              borderRadius: 4, padding: "2px 7px", fontWeight: 600,
            }}>
              {request.clientTier}
            </span>
            <PriorityBadge priority={request.priority} />
            <StatusPill status={request.status} />
          </div>
          <h3 style={{ fontSize: 14, fontWeight: 500, color: INK, margin: "0 0 4px" }}>{request.title}</h3>
          <div style={{ fontSize: 12, color: MUTED, display: "flex", gap: 12, flexWrap: "wrap" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <User size={11} color={MUTED} /> {request.clientName}
            </span>
            <span>·</span>
            <span>{getCategoryLabel(request.category)}</span>
            <span>·</span>
            <span>Assigned: {request.assignedTo}</span>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8, flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {request.slaStatus === "on-track"
              ? <CheckCircle2 size={13} color={GREEN} />
              : <AlertTriangle size={13} color={request.slaStatus === "breached" ? RED : AMBER} />}
            <span style={{ fontSize: 11, color: slaColor(request.slaStatus), fontWeight: 500 }}>
              {getSLALabel(request.slaStatus)}
            </span>
          </div>
          <div style={{ fontSize: 11, color: MUTED, display: "flex", alignItems: "center", gap: 4 }}>
            <Clock size={11} color={MUTED} /> Due {deadlineStr}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 80,
              height: 4,
              background: BORDER,
              borderRadius: 4,
              overflow: "hidden",
            }}>
              <div style={{
                width: `${request.progressPct}%`,
                height: "100%",
                background: request.progressPct === 100 ? GREEN : GOLD,
                borderRadius: 4,
              }} />
            </div>
            <span style={{ fontSize: 10, color: MUTED }}>{request.progressPct}%</span>
          </div>
          <div style={{
            width: 28, height: 28, borderRadius: 7, border: `1px solid ${BORDER}`,
            display: "flex", alignItems: "center", justifyContent: "center", background: CREAM,
          }}>
            {expanded ? <ChevronUp size={14} color={MUTED} /> : <ChevronDown size={14} color={MUTED} />}
          </div>
        </div>
      </div>

      {/* Expanded */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{ overflow: "hidden" }}
          >
            <div style={{ padding: "0 22px 22px", borderTop: `1px solid ${BORDER}` }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginTop: 16 }}>
                {/* Left */}
                <div>
                  <div style={{ fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: GOLD, fontWeight: 600, marginBottom: 8 }}>
                    Request Notes
                  </div>
                  <p style={{ fontSize: 13, color: INK, lineHeight: 1.6, margin: 0 }}>{request.notes}</p>

                  {request.escalationReason && (
                    <div style={{
                      marginTop: 14,
                      padding: "12px 14px",
                      background: `${AMBER}08`,
                      border: `1px solid ${AMBER}30`,
                      borderRadius: 9,
                    }}>
                      <div style={{ fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: AMBER, fontWeight: 600, marginBottom: 5 }}>
                        Escalation — {request.escalatedTo}
                      </div>
                      <p style={{ fontSize: 12, color: INK, margin: 0 }}>{request.escalationReason}</p>
                    </div>
                  )}

                  {playbook && (
                    <div style={{ marginTop: 14 }}>
                      <div style={{ fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: GOLD, fontWeight: 600, marginBottom: 6 }}>
                        Choreography
                      </div>
                      <div style={{
                        padding: "10px 14px",
                        background: CREAM,
                        border: `1px solid ${BORDER}`,
                        borderRadius: 8,
                        fontSize: 13,
                        color: INK,
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                      }}>
                        <span style={{ fontSize: 16 }}>✦</span>
                        {playbook.name}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right — Audit Trail */}
                <div>
                  <div style={{ fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: GOLD, fontWeight: 600, marginBottom: 12 }}>
                    Audit Trail
                  </div>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    {request.auditTrail.map((entry, i) => (
                      <AuditEntry key={i} entry={entry} />
                    ))}
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              {request.status !== "resolved" && (
                <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                  {request.priority !== "vip-exception" && (
                    <button style={{
                      display: "flex", alignItems: "center", gap: 6,
                      padding: "8px 16px", background: `${AMBER}15`,
                      border: `1px solid ${AMBER}40`, borderRadius: 7,
                      color: AMBER, fontSize: 12, fontWeight: 500, cursor: "pointer",
                    }}>
                      <Crown size={12} /> Escalate to VIP Exception
                    </button>
                  )}
                  <button style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "8px 16px", background: GOLD,
                    border: "none", borderRadius: 7,
                    color: "#fff", fontSize: 12, fontWeight: 500, cursor: "pointer",
                  }}>
                    Update progress <ArrowRight size={12} />
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function ConciergeRequests() {
  const [filter, setFilter] = useState<"all" | "active" | "vip" | "resolved">("all");

  const filtered = SERVICE_REQUESTS.filter(r => {
    if (filter === "active") return r.status !== "resolved" && r.status !== "deferred";
    if (filter === "vip") return r.priority === "vip-exception";
    if (filter === "resolved") return r.status === "resolved";
    return true;
  });

  const vipCount = SERVICE_REQUESTS.filter(r => r.priority === "vip-exception").length;
  const atRiskCount = SERVICE_REQUESTS.filter(r => r.slaStatus === "at-risk" || r.slaStatus === "breached").length;

  return (
    <div style={{ minHeight: "100vh", background: CREAM, fontFamily: "Inter, system-ui, sans-serif" }}>
      {/* Header */}
      <div style={{
        padding: "40px 48px 28px",
        borderBottom: `1px solid ${BORDER}`,
        background: "#fff",
      }}>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <div style={{
            fontSize: 10, letterSpacing: "0.22em", textTransform: "uppercase",
            color: GOLD, fontWeight: 600, marginBottom: 8,
          }}>
            White-Glove Command · Priority Routing
          </div>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
            <div>
              <h1 style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: 34,
                fontWeight: 600,
                color: INK,
                margin: "0 0 8px 0",
              }}>
                Active Requests
              </h1>
              <p style={{ fontSize: 14, color: MUTED, margin: "0 0 16px" }}>
                All open requests, escalations, and VIP exceptions — with full audit history.
              </p>
            </div>
            <button style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "10px 20px", background: GOLD,
              border: "none", borderRadius: 8,
              color: "#fff", fontSize: 13, fontWeight: 500, cursor: "pointer",
              marginTop: 4,
            }}>
              <Plus size={14} /> New Request
            </button>
          </div>

          {/* Metrics */}
          <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
            {vipCount > 0 && (
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 14px",
                background: `${AMBER}10`,
                border: `1px solid ${AMBER}40`,
                borderRadius: 7,
                fontSize: 12,
                color: AMBER,
                fontWeight: 500,
              }}>
                <Crown size={12} /> {vipCount} VIP exception{vipCount > 1 ? "s" : ""} active
              </div>
            )}
            {atRiskCount > 0 && (
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 14px",
                background: `${AMBER}08`,
                border: `1px solid ${AMBER}30`,
                borderRadius: 7,
                fontSize: 12,
                color: AMBER,
                fontWeight: 500,
              }}>
                <AlertTriangle size={12} /> {atRiskCount} request{atRiskCount > 1 ? "s" : ""} at SLA risk
              </div>
            )}
          </div>

          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontSize: 10,
            color: MUTED,
            background: "rgba(154,125,82,0.06)",
            border: `1px solid ${BORDER}`,
            borderRadius: 6,
            padding: "4px 10px",
          }}>
            <Shield size={10} color={GOLD} />
            {DEMO_NOTE}
          </div>
        </motion.div>
      </div>

      <div style={{ padding: "28px 48px", maxWidth: 1100 }}>
        {/* Filter bar */}
        <div style={{ display: "flex", gap: 8, marginBottom: 24, alignItems: "center" }}>
          <Filter size={13} color={MUTED} />
          {([
            { key: "all", label: "All" },
            { key: "active", label: "Active" },
            { key: "vip", label: "VIP Exceptions" },
            { key: "resolved", label: "Resolved" },
          ] as { key: typeof filter; label: string }[]).map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              style={{
                padding: "6px 16px",
                borderRadius: 7,
                border: filter === f.key ? `1px solid ${GOLD}60` : `1px solid ${BORDER}`,
                background: filter === f.key ? "rgba(154,125,82,0.1)" : "#fff",
                color: filter === f.key ? GOLD : MUTED,
                fontSize: 12,
                fontWeight: filter === f.key ? 600 : 400,
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              {f.label}
            </button>
          ))}
          <span style={{ fontSize: 12, color: MUTED, marginLeft: 8 }}>
            {filtered.length} request{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {filtered.map((req, i) => (
            <motion.div
              key={req.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.06 * i, duration: 0.35 }}
            >
              <RequestCard request={req} />
            </motion.div>
          ))}
          {filtered.length === 0 && (
            <div style={{ textAlign: "center", padding: "48px 24px", color: MUTED, fontSize: 14 }}>
              No requests match this filter.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
