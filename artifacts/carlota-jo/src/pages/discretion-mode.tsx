import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield, Eye, EyeOff, Lock, AlertTriangle, CheckCircle2,
  Clock, User, FileText, Download, ChevronRight, Activity,
  Stamp, Monitor,
} from "lucide-react";
import { usePageMeta } from "@/hooks/usePageMeta";

const GOLD = "rgba(196,170,126,1)";
const GOLD_DIM = "rgba(196,170,126,0.08)";
const GOLD_BORDER = "rgba(196,170,126,0.18)";
const CREAM = "rgba(244,237,224,0.88)";
const CREAM_DIM = "rgba(244,237,224,0.45)";
const CREAM_FAINT = "rgba(244,237,224,0.07)";
const MUTED = "rgba(244,237,224,0.25)";
const DEEP = "#0a0906";

type DiscretionLevel = 1 | 2 | 3 | 4 | 5;

interface AccessLogEntry {
  id: string;
  user: string;
  action: string;
  document?: string;
  timestamp: string;
  level: DiscretionLevel;
  ipLocation: string;
}

interface SharedDocument {
  id: string;
  name: string;
  level: DiscretionLevel;
  sharedWith: string;
  sharedAt: string;
  watermarked: boolean;
  downloads: number;
  lastAccessed?: string;
}

const levelConfig: Record<DiscretionLevel, { label: string; color: string; bg: string; icon: React.ElementType; restriction: string }> = {
  1: { label: "Open", color: "rgba(52,211,153,0.9)", bg: "rgba(52,211,153,0.07)", icon: Eye, restriction: "Standard access — shareable with all parties" },
  2: { label: "Sensitive", color: "rgba(245,158,11,0.9)", bg: "rgba(245,158,11,0.07)", icon: Eye, restriction: "Rosa + client access only" },
  3: { label: "Private", color: GOLD, bg: GOLD_DIM, restriction: "Rosa only. Redacted client summary provided." },
  4: { label: "Confidential", color: "rgba(248,113,113,0.9)", bg: "rgba(248,113,113,0.07)", icon: Lock, restriction: "Restricted. No documentation shared." },
  5: { label: "Eyes Only", color: "rgba(239,68,68,0.95)", bg: "rgba(239,68,68,0.09)", icon: Lock, restriction: "Verbal only. No record retained." },
} as any;

const ACCESS_LOG: AccessLogEntry[] = [
  { id: "a1", user: "Rosa M.", action: "Viewed", document: "Quarterly Operations Summary Q1 2026", timestamp: "Apr 12, 10:34 AM", level: 1, ipLocation: "London, UK" },
  { id: "a2", user: "Rosa M.", action: "Downloaded", document: "Household Staff Briefing — Oxfordshire", timestamp: "Apr 12, 9:18 AM", level: 2, ipLocation: "London, UK" },
  { id: "a3", user: "Client (E.H.)", action: "Viewed", document: "Monthly Summary — March 2026", timestamp: "Apr 11, 7:51 PM", level: 1, ipLocation: "Mayfair, London" },
  { id: "a4", user: "Rosa M.", action: "Accessed", document: "Art Acquisition — Provenance Report", timestamp: "Apr 10, 3:22 PM", level: 3, ipLocation: "London, UK" },
  { id: "a5", user: "Rosa M.", action: "Redacted view shared", document: "Conduct matter summary (redacted)", timestamp: "Apr 9, 11:05 AM", level: 4, ipLocation: "London, UK" },
  { id: "a6", user: "External: Legal Advisor", action: "Viewed (link)", document: "Vendor dispute evidence pack", timestamp: "Apr 8, 4:33 PM", level: 2, ipLocation: "London, UK" },
];

const SHARED_DOCS: SharedDocument[] = [
  { id: "d1", name: "Q1 2026 Operational Summary", level: 1, sharedWith: "Client (E.H.)", sharedAt: "Apr 1, 2026", watermarked: false, downloads: 2, lastAccessed: "Apr 11" },
  { id: "d2", name: "Oxfordshire Opening Checklist", level: 2, sharedWith: "Estate Manager", sharedAt: "Apr 8, 2026", watermarked: true, downloads: 1, lastAccessed: "Apr 10" },
  { id: "d3", name: "Vendor Dispute Evidence Pack", level: 2, sharedWith: "Legal Advisor", sharedAt: "Apr 8, 2026", watermarked: true, downloads: 1, lastAccessed: "Apr 8" },
  { id: "d4", name: "Investment Memo — Private Credit", level: 3, sharedWith: "Internal only", sharedAt: "Jan 15, 2026", watermarked: true, downloads: 0 },
  { id: "d5", name: "Staff Conduct Matter — Summary", level: 4, sharedWith: "Restricted", sharedAt: "Mar 18, 2026", watermarked: true, downloads: 0 },
];

function DiscretionBadge({ level }: { level: DiscretionLevel }) {
  const cfg = levelConfig[level];
  const Icon = cfg.icon ?? Lock;
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      background: cfg.bg, border: `1px solid ${cfg.color}30`,
      borderRadius: 20, padding: "2px 8px",
    }}>
      <Icon size={9} style={{ color: cfg.color }} />
      <span style={{ fontSize: 9, fontWeight: 700, color: cfg.color, letterSpacing: "0.06em", textTransform: "uppercase" }}>
        {cfg.label}
      </span>
    </div>
  );
}

function RedactedText({ text, level }: { text: string; level: DiscretionLevel }) {
  if (level <= 2) return <span>{text}</span>;
  if (level === 3) {
    const words = text.split(" ");
    return (
      <span>
        {words.map((w, i) => (
          <span key={i}>
            {i % 3 === 2
              ? <span style={{ background: "rgba(196,170,126,0.3)", color: "transparent", borderRadius: 2, userSelect: "none" }}>{"█".repeat(w.length)}</span>
              : w}
            {" "}
          </span>
        ))}
      </span>
    );
  }
  return <span style={{ fontStyle: "italic", color: MUTED }}>[REDACTED — restricted content]</span>;
}

export default function DiscretionMode() {
  usePageMeta({ title: "Discretion Mode — Carlota Jo" });
  const [activeTab, setActiveTab] = useState<"overview" | "documents" | "log">("overview");
  const [discretionActive, setDiscretionActive] = useState(false);
  const [viewLevel, setViewLevel] = useState<DiscretionLevel>(2);

  const sampleContent = "The client's Q1 financial review identified a £1.2M tax positioning advantage. The household staff transition involved a conduct matter with Housekeeper Margaret Walton. The Oxfordshire estate's pool contractor submitted an inflated invoice of £45,000.";

  return (
    <div style={{ minHeight: "100vh", background: DEEP, padding: "32px 24px 64px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 32, flexWrap: "wrap", gap: 16 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <Shield size={16} style={{ color: GOLD }} />
              <span style={{ fontSize: 11, fontWeight: 600, color: GOLD, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                Discretion Mode
              </span>
            </div>
            <h1 style={{ fontSize: 28, fontWeight: 300, color: CREAM, margin: "0 0 8px", letterSpacing: "-0.02em" }}>
              Privacy & Confidentiality Controls
            </h1>
            <p style={{ fontSize: 14, color: CREAM_DIM, margin: 0 }}>
              Every access logged. Sensitive content redacted in shared views. Documents watermarked on export.
            </p>
          </div>

          <div
            onClick={() => setDiscretionActive(!discretionActive)}
            style={{
              display: "flex", alignItems: "center", gap: 10,
              background: discretionActive ? "rgba(248,113,113,0.08)" : GOLD_DIM,
              border: `1px solid ${discretionActive ? "rgba(248,113,113,0.3)" : GOLD_BORDER}`,
              borderRadius: 10, padding: "12px 16px", cursor: "pointer", transition: "all 0.2s",
            }}
          >
            <div style={{
              width: 32, height: 18, borderRadius: 9, position: "relative",
              background: discretionActive ? "rgba(248,113,113,0.7)" : "rgba(196,170,126,0.25)",
              transition: "background 0.2s",
            }}>
              <div style={{
                position: "absolute", top: 3, left: discretionActive ? 17 : 3,
                width: 12, height: 12, borderRadius: "50%",
                background: discretionActive ? "#f87171" : GOLD,
                transition: "left 0.2s",
              }} />
            </div>
            <span style={{ fontSize: 12, fontWeight: 600, color: discretionActive ? "#f87171" : GOLD }}>
              {discretionActive ? "Discretion Active" : "Discretion Off"}
            </span>
          </div>
        </div>

        {discretionActive && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              background: "rgba(248,113,113,0.06)", border: "1px solid rgba(248,113,113,0.25)",
              borderRadius: 10, padding: "14px 18px", marginBottom: 24,
              display: "flex", alignItems: "center", gap: 12,
            }}
          >
            <EyeOff size={14} style={{ color: "#f87171", flexShrink: 0 }} />
            <div>
              <p style={{ fontSize: 12, fontWeight: 600, color: "#f87171", margin: "0 0 2px" }}>DISCRETION MODE ACTIVE</p>
              <p style={{ fontSize: 12, color: "rgba(248,113,113,0.65)", margin: 0 }}>
                All shared views are now filtered to Level 2 or below. All exports are watermarked. Every access is logged with timestamp and location.
              </p>
            </div>
          </motion.div>
        )}

        <div style={{ display: "flex", gap: 8, marginBottom: 28, borderBottom: `1px solid ${GOLD_BORDER}`, paddingBottom: 0 }}>
          {(["overview", "documents", "log"] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: "8px 16px", fontSize: 12, fontWeight: 500,
                border: "none", background: "none", cursor: "pointer",
                color: activeTab === tab ? GOLD : CREAM_DIM,
                borderBottom: `2px solid ${activeTab === tab ? GOLD : "transparent"}`,
                textTransform: "capitalize", transition: "all 0.15s",
              }}
            >
              {tab === "overview" ? "Redaction Preview" : tab === "documents" ? "Shared Documents" : "Access Log"}
            </button>
          ))}
        </div>

        {activeTab === "overview" && (
          <div>
            <div style={{ marginBottom: 20 }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: CREAM, margin: "0 0 10px" }}>Simulate view level</p>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {([1, 2, 3, 4, 5] as DiscretionLevel[]).map(l => (
                  <button
                    key={l}
                    onClick={() => setViewLevel(l)}
                    style={{
                      padding: "5px 12px", borderRadius: 20, fontSize: 11, fontWeight: 600,
                      border: `1px solid ${viewLevel === l ? levelConfig[l].color : levelConfig[l].color + "40"}`,
                      background: viewLevel === l ? levelConfig[l].bg : "transparent",
                      color: levelConfig[l].color, cursor: "pointer", transition: "all 0.15s",
                    }}
                  >
                    L{l}: {levelConfig[l].label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{
              background: CREAM_FAINT, border: `1px solid ${GOLD_BORDER}`,
              borderRadius: 10, padding: 24, position: "relative", overflow: "hidden",
            }}>
              {viewLevel >= 4 && (
                <div style={{
                  position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
                  background: "rgba(10,9,6,0.88)", zIndex: 10, flexDirection: "column", gap: 12,
                }}>
                  <Lock size={28} style={{ color: "rgba(248,113,113,0.6)" }} />
                  <p style={{ fontSize: 13, color: CREAM_DIM, textAlign: "center", maxWidth: 280, margin: 0 }}>
                    Content restricted at this classification level. Verbal briefing only.
                  </p>
                </div>
              )}
              {viewLevel >= 2 && viewLevel < 4 && (
                <div style={{
                  position: "absolute", top: 12, right: 12,
                  background: "rgba(196,170,126,0.12)", border: "1px solid rgba(196,170,126,0.3)",
                  borderRadius: 4, padding: "4px 8px",
                  display: "flex", alignItems: "center", gap: 4,
                }}>
                  <Stamp size={9} style={{ color: GOLD }} />
                  <span style={{ fontSize: 9, color: GOLD, fontWeight: 700, letterSpacing: "0.08em" }}>WATERMARKED — E.H. / CARLOTA JO — APR 2026</span>
                </div>
              )}
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <DiscretionBadge level={viewLevel} />
                <span style={{ fontSize: 11, color: CREAM_DIM }}>{levelConfig[viewLevel].restriction}</span>
              </div>
              <p style={{ fontSize: 13, color: CREAM_DIM, lineHeight: 1.7, margin: 0 }}>
                <RedactedText text={sampleContent} level={viewLevel} />
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12, marginTop: 24 }}>
              {Object.entries(levelConfig).map(([lv, cfg]) => {
                const Icon = cfg.icon ?? Lock;
                return (
                  <div key={lv} style={{
                    background: cfg.bg, border: `1px solid ${cfg.color}25`,
                    borderRadius: 10, padding: "14px 16px",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                      <Icon size={12} style={{ color: cfg.color }} />
                      <span style={{ fontSize: 11, fontWeight: 700, color: cfg.color }}>Level {lv}: {cfg.label}</span>
                    </div>
                    <p style={{ fontSize: 11, color: CREAM_DIM, margin: 0, lineHeight: 1.5 }}>{cfg.restriction}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === "documents" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {SHARED_DOCS.map(doc => (
              <div key={doc.id} style={{
                display: "flex", alignItems: "center", gap: 14,
                background: CREAM_FAINT, border: `1px solid ${GOLD_BORDER}`,
                borderRadius: 10, padding: "14px 16px",
              }}>
                <div style={{
                  width: 34, height: 34, borderRadius: 8, flexShrink: 0,
                  background: levelConfig[doc.level].bg, border: `1px solid ${levelConfig[doc.level].color}25`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <FileText size={14} style={{ color: levelConfig[doc.level].color }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 500, color: CREAM, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{doc.name}</span>
                    <DiscretionBadge level={doc.level} />
                    {doc.watermarked && (
                      <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                        <Stamp size={9} style={{ color: MUTED }} />
                        <span style={{ fontSize: 9, color: MUTED }}>WM</span>
                      </div>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 11, color: MUTED }}>Shared with: <span style={{ color: CREAM_DIM }}>{doc.sharedWith}</span></span>
                    <span style={{ fontSize: 11, color: MUTED }}>{doc.sharedAt}</span>
                    {doc.lastAccessed && <span style={{ fontSize: 11, color: MUTED }}>Last accessed: {doc.lastAccessed}</span>}
                    <span style={{ fontSize: 11, color: MUTED }}>{doc.downloads} downloads</span>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  {doc.level <= 3 && (
                    <button style={{
                      background: "none", border: `1px solid ${GOLD_BORDER}`,
                      borderRadius: 6, padding: "5px 10px", cursor: "pointer", color: CREAM_DIM, fontSize: 11,
                    }}>
                      <Download size={11} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "log" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
            <div style={{
              display: "grid", gridTemplateColumns: "180px 120px 1fr 120px",
              padding: "8px 14px",
              fontSize: 10, fontWeight: 700, color: MUTED, letterSpacing: "0.07em", textTransform: "uppercase",
            }}>
              <span>Timestamp</span><span>User</span><span>Action</span><span>Level</span>
            </div>
            {ACCESS_LOG.map((entry, i) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                style={{
                  display: "grid", gridTemplateColumns: "180px 120px 1fr 120px",
                  padding: "11px 14px", alignItems: "center",
                  background: i % 2 === 0 ? CREAM_FAINT : "transparent",
                  borderRadius: 6,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Clock size={10} style={{ color: MUTED }} />
                  <span style={{ fontSize: 11, color: CREAM_DIM }}>{entry.timestamp}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <User size={10} style={{ color: MUTED }} />
                  <span style={{ fontSize: 11, color: CREAM }}>{entry.user}</span>
                </div>
                <div>
                  <span style={{ fontSize: 11, color: CREAM }}>{entry.action}</span>
                  {entry.document && <span style={{ fontSize: 11, color: MUTED }}> — {entry.document}</span>}
                  <span style={{ fontSize: 10, color: MUTED, display: "block" }}>{entry.ipLocation}</span>
                </div>
                <DiscretionBadge level={entry.level} />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
