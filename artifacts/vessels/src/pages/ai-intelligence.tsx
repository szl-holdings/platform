import { useState } from "react";
import { DocumentIntelligencePanel } from "@szl-holdings/shared-ui/document-intelligence-panel";
import { AIActionsPanel, DOMAIN_ACTIONS } from "@szl-holdings/shared-ui/ai-actions-panel";
import { LANE_ACCENT_HEX } from "@szl-holdings/shared-ui/lane-colors";

const VESSELS_ACCENT = LANE_ACCENT_HEX.vessels.primary;

const BG = { page: "#080c14", surface: "#0c1018", elevated: "#10141e" };
const BORDER = { subtle: "rgba(255,255,255,0.04)", muted: "rgba(255,255,255,0.07)" };
const TEXT = { primary: "rgba(255,255,255,0.88)", secondary: "rgba(255,255,255,0.55)", muted: "rgba(255,255,255,0.3)" };

export default function AIIntelligencePage() {
  const [activeTab, setActiveTab] = useState<"actions" | "document">("actions");

  return (
    <div style={{ background: BG.page, minHeight: "100%", padding: "24px", fontFamily: "inherit" }}>
      <div style={{ marginBottom: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
          <span style={{ fontSize: "20px" }}>⚓</span>
          <h1 style={{ fontSize: "20px", fontWeight: 800, color: TEXT.primary, margin: 0 }}>AI Intelligence</h1>
          <span style={{
            fontSize: "9px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.8px",
            background: `${VESSELS_ACCENT}15`, color: VESSELS_ACCENT, border: `1px solid ${VESSELS_ACCENT}30`,
            borderRadius: "4px", padding: "2px 8px",
          }}>Vessels</span>
        </div>
        <p style={{ fontSize: "13px", color: TEXT.secondary, margin: 0 }}>
          Maritime document intelligence, vessel risk profiling, and automated compliance screening.
        </p>
      </div>

      <div style={{ display: "flex", gap: "4px", marginBottom: "20px" }}>
        {(["actions", "document"] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: "7px 14px", borderRadius: "8px",
              background: activeTab === tab ? `${VESSELS_ACCENT}20` : "transparent",
              border: `1px solid ${activeTab === tab ? `${VESSELS_ACCENT}40` : "transparent"}`,
              color: activeTab === tab ? VESSELS_ACCENT : TEXT.muted,
              fontSize: "12px", fontWeight: activeTab === tab ? 700 : 500,
              cursor: "pointer",
            }}
          >
            {tab === "actions" ? "⚡ AI Actions" : "📄 Document Intelligence"}
          </button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "16px" }}>
        {activeTab === "actions" ? (
          <div style={{ position: "relative" }}>
            <AIActionsPanel
              domain="maritime"
              actions={DOMAIN_ACTIONS.maritime ?? []}
              accentColor={VESSELS_ACCENT}
            />
          </div>
        ) : (
          <DocumentIntelligencePanel
            domain="maritime"
            accentColor={VESSELS_ACCENT}
          />
        )}

        <div style={{
          background: BG.surface, border: `1px solid ${BORDER.muted}`,
          borderRadius: "16px", padding: "20px",
        }}>
          <div style={{ fontSize: "12px", fontWeight: 700, color: TEXT.primary, marginBottom: "16px", display: "flex", alignItems: "center", gap: "6px" }}>
            <span>🤖</span> Active AI Workflows
          </div>
          {[
            { name: "Nightly Sanctions Screening", status: "active", runs: 1, color: "#6b8f71" },
            { name: "Dark Vessel Detection", status: "active", runs: 24, color: "#6b8f71" },
            { name: "Cargo Anomaly Monitoring", status: "active", runs: 6, color: "#6b8f71" },
            { name: "Port Risk Assessment", status: "paused", runs: 0, color: "#d4a054" },
          ].map((wf, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: "10px",
              padding: "10px 0", borderBottom: `1px solid ${BORDER.subtle}`,
            }}>
              <span style={{ fontSize: "8px", color: wf.color }}>●</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "12px", color: TEXT.primary, fontWeight: 500 }}>{wf.name}</div>
                <div style={{ fontSize: "10px", color: TEXT.muted }}>{wf.runs} runs today</div>
              </div>
              <span style={{
                fontSize: "9px", fontWeight: 700, textTransform: "uppercase",
                color: wf.color, background: `${wf.color}15`, border: `1px solid ${wf.color}25`,
                borderRadius: "4px", padding: "1px 6px",
              }}>
                {wf.status}
              </span>
            </div>
          ))}
          <div style={{ marginTop: "16px", padding: "12px", background: `${VESSELS_ACCENT}08`, border: `1px solid ${VESSELS_ACCENT}15`, borderRadius: "8px" }}>
            <div style={{ fontSize: "10px", color: TEXT.muted, marginBottom: "4px" }}>Try in command palette (⌘K):</div>
            <div style={{ fontSize: "11px", color: VESSELS_ACCENT, fontStyle: "italic" }}>
              "Extract manifest data and flag compliance issues"
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
