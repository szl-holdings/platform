import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare, Phone, Shield, Lock, Eye, EyeOff,
  ChevronDown, ChevronUp, ArrowDown, ArrowUp, Clock,
} from "lucide-react";
import {
  COMMUNICATION_LOGS, getChannelLabel, DEMO_NOTE,
  type CommunicationLog, type CommunicationChannel,
} from "@/data/concierge-data";

const GOLD = "#9A7D52";
const INK = "#1A1A1A";
const MUTED = "#6B6B6B";
const CREAM = "#F9F7F3";
const BORDER = "rgba(154,125,82,0.18)";
const RED = "#C0392B";

function channelIcon(channel: CommunicationChannel) {
  if (channel === "telephone") return <Phone size={14} color={GOLD} />;
  if (channel === "encrypted-message") return <Lock size={14} color={GOLD} />;
  if (channel === "in-person") return <Shield size={14} color={GOLD} />;
  return <MessageSquare size={14} color={GOLD} />;
}

function AuditEntry({ entry }: { entry: { timestamp: string; actor: string; action: string } }) {
  const d = new Date(entry.timestamp);
  const formatted = d.toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
  return (
    <div style={{ display: "flex", gap: 10, paddingBottom: 10 }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0, width: 20 }}>
        <div style={{
          width: 7, height: 7, borderRadius: "50%",
          background: GOLD, border: `2px solid rgba(154,125,82,0.3)`,
          zIndex: 1, marginTop: 4,
        }} />
        <div style={{ width: 1, flex: 1, background: BORDER, marginTop: 3 }} />
      </div>
      <div>
        <div style={{ fontSize: 10, color: MUTED, marginBottom: 2 }}>{formatted} · {entry.actor}</div>
        <div style={{ fontSize: 11, color: INK }}>{entry.action}</div>
      </div>
    </div>
  );
}

function CommCard({ log }: { log: CommunicationLog }) {
  const [expanded, setExpanded] = useState(false);
  const [summaryVisible, setSummaryVisible] = useState(!log.redacted);

  const d = new Date(log.timestamp);
  const dateStr = d.toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", month: "short", year: "2-digit" });
  const timeStr = d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

  return (
    <motion.div
      layout
      style={{
        background: log.redacted ? "rgba(192,57,43,0.02)" : "#fff",
        border: log.redacted ? `1px solid ${RED}25` : `1px solid ${BORDER}`,
        borderRadius: 13,
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{ padding: "16px 20px", cursor: "pointer", display: "flex", alignItems: "flex-start", gap: 14 }}
        onClick={() => setExpanded(e => !e)}
      >
        {/* Channel icon */}
        <div style={{
          width: 38,
          height: 38,
          borderRadius: 10,
          background: "rgba(154,125,82,0.08)",
          border: `1px solid ${BORDER}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}>
          {channelIcon(log.channel)}
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
            <span style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              fontSize: 10,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: log.direction === "inbound" ? GOLD : MUTED,
              fontWeight: 600,
            }}>
              {log.direction === "inbound" ? <ArrowDown size={10} /> : <ArrowUp size={10} />}
              {log.direction === "inbound" ? "Received" : "Sent"}
            </span>
            <span style={{
              fontSize: 9,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: GOLD,
              background: "rgba(154,125,82,0.08)",
              border: `1px solid ${BORDER}`,
              borderRadius: 4,
              padding: "1px 7px",
              fontWeight: 600,
            }}>
              {getChannelLabel(log.channel)}
            </span>
            {log.redacted && (
              <span style={{
                fontSize: 9,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: RED,
                background: `${RED}10`,
                border: `1px solid ${RED}30`,
                borderRadius: 4,
                padding: "1px 7px",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}>
                <Lock size={8} /> Redacted
              </span>
            )}
          </div>
          <div style={{ fontSize: 13, fontWeight: 500, color: INK, marginBottom: 3 }}>{log.subject}</div>
          <div style={{ fontSize: 12, color: MUTED, display: "flex", gap: 10, flexWrap: "wrap" }}>
            <span>{log.clientName}</span>
            <span>·</span>
            <span>{log.conductor}</span>
            <span>·</span>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <Clock size={10} color={MUTED} /> {dateStr} · {timeStr}
            </span>
          </div>
        </div>

        <div style={{
          width: 28, height: 28, borderRadius: 7, border: `1px solid ${BORDER}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: CREAM, flexShrink: 0,
        }}>
          {expanded ? <ChevronUp size={14} color={MUTED} /> : <ChevronDown size={14} color={MUTED} />}
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
            <div style={{ padding: "0 20px 20px", borderTop: `1px solid ${BORDER}` }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginTop: 16 }}>
                {/* Summary */}
                <div>
                  <div style={{ fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: GOLD, fontWeight: 600, marginBottom: 8 }}>
                    Summary
                  </div>
                  {log.redacted && (
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "8px 12px",
                      background: `${RED}08`,
                      border: `1px solid ${RED}25`,
                      borderRadius: 8,
                      marginBottom: 10,
                    }}>
                      <Lock size={11} color={RED} />
                      <span style={{ fontSize: 11, color: RED }}>Content redacted per standing client instruction. Access restricted.</span>
                    </div>
                  )}
                  <div style={{
                    fontSize: 13,
                    color: summaryVisible ? INK : MUTED,
                    lineHeight: 1.65,
                    filter: log.redacted && !summaryVisible ? "blur(4px)" : "none",
                    userSelect: log.redacted && !summaryVisible ? "none" : "text",
                    transition: "filter 0.3s",
                  }}>
                    {log.summary}
                  </div>
                  {log.redacted && (
                    <button
                      onClick={() => setSummaryVisible(v => !v)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        marginTop: 10,
                        background: "none",
                        border: `1px solid ${RED}30`,
                        borderRadius: 6,
                        padding: "5px 12px",
                        color: RED,
                        fontSize: 11,
                        cursor: "pointer",
                        fontWeight: 500,
                      }}
                    >
                      {summaryVisible ? <EyeOff size={11} /> : <Eye size={11} />}
                      {summaryVisible ? "Re-apply redaction" : "Reveal (log access)"}
                    </button>
                  )}

                  {/* Access scope */}
                  <div style={{ marginTop: 16 }}>
                    <div style={{ fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: GOLD, fontWeight: 600, marginBottom: 6 }}>
                      Access Scope
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {log.accessScope.map(a => (
                        <span key={a} style={{
                          fontSize: 11, color: INK,
                          background: "rgba(154,125,82,0.08)",
                          border: `1px solid ${BORDER}`,
                          borderRadius: 6,
                          padding: "3px 10px",
                        }}>
                          {a}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Audit trail */}
                <div>
                  <div style={{ fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: GOLD, fontWeight: 600, marginBottom: 10 }}>
                    Audit Trail
                  </div>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    {log.auditTrail.map((entry, i) => (
                      <AuditEntry key={i} entry={entry} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function DiscreetCorrespondence() {
  const [filterDirection, setFilterDirection] = useState<"all" | "inbound" | "outbound">("all");
  const [filterRedacted, setFilterRedacted] = useState<"all" | "visible" | "redacted">("all");

  const filtered = COMMUNICATION_LOGS.filter(c => {
    if (filterDirection !== "all" && c.direction !== filterDirection) return false;
    if (filterRedacted === "visible" && c.redacted) return false;
    if (filterRedacted === "redacted" && !c.redacted) return false;
    return true;
  });

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
            White-Glove Command · Discreet Correspondence
          </div>
          <h1 style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 34,
            fontWeight: 600,
            color: INK,
            margin: "0 0 8px 0",
          }}>
            Correspondence Log
          </h1>
          <p style={{ fontSize: 14, color: MUTED, margin: "0 0 12px" }}>
            Every client touchpoint — privacy-first, access-scoped, with redaction and full audit trail.
          </p>

          {/* Privacy notice */}
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 14px",
            background: "rgba(154,125,82,0.05)",
            border: `1px solid ${BORDER}`,
            borderRadius: 8,
            marginBottom: 8,
          }}>
            <Lock size={12} color={GOLD} />
            <span style={{ fontSize: 11, color: MUTED }}>
              All correspondence is Tier 4 — Restricted. Access is scoped per record. Redaction is irreversible. All reads are audit-logged.
            </span>
          </div>

          <div style={{ display: "block", marginTop: 8 }}>
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
          </div>
        </motion.div>
      </div>

      <div style={{ padding: "28px 48px", maxWidth: 960 }}>
        {/* Filters */}
        <div style={{ display: "flex", gap: 10, marginBottom: 24, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: 6 }}>
            {([
              { key: "all", label: "All directions" },
              { key: "inbound", label: "↓ Received" },
              { key: "outbound", label: "↑ Sent" },
            ] as { key: typeof filterDirection; label: string }[]).map(f => (
              <button
                key={f.key}
                onClick={() => setFilterDirection(f.key)}
                style={{
                  padding: "6px 14px",
                  borderRadius: 7,
                  border: filterDirection === f.key ? `1px solid ${GOLD}60` : `1px solid ${BORDER}`,
                  background: filterDirection === f.key ? "rgba(154,125,82,0.1)" : "#fff",
                  color: filterDirection === f.key ? GOLD : MUTED,
                  fontSize: 12,
                  fontWeight: filterDirection === f.key ? 600 : 400,
                  cursor: "pointer",
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div style={{ width: 1, height: 20, background: BORDER }} />
          <div style={{ display: "flex", gap: 6 }}>
            {([
              { key: "all", label: "All" },
              { key: "visible", label: "Visible" },
              { key: "redacted", label: "Redacted" },
            ] as { key: typeof filterRedacted; label: string }[]).map(f => (
              <button
                key={f.key}
                onClick={() => setFilterRedacted(f.key)}
                style={{
                  padding: "6px 14px",
                  borderRadius: 7,
                  border: filterRedacted === f.key ? `1px solid ${GOLD}60` : `1px solid ${BORDER}`,
                  background: filterRedacted === f.key ? "rgba(154,125,82,0.1)" : "#fff",
                  color: filterRedacted === f.key ? GOLD : MUTED,
                  fontSize: 12,
                  fontWeight: filterRedacted === f.key ? 600 : 400,
                  cursor: "pointer",
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
          <span style={{ fontSize: 12, color: MUTED, marginLeft: 4 }}>
            {filtered.length} record{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filtered.map((log, i) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.06 * i, duration: 0.35 }}
            >
              <CommCard log={log} />
            </motion.div>
          ))}
          {filtered.length === 0 && (
            <div style={{ textAlign: "center", padding: "48px 24px", color: MUTED, fontSize: 14 }}>
              No correspondence matches this filter.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
