import { useState } from "react";
import { DocumentIntelligencePanel } from "@szl-holdings/shared-ui/document-intelligence-panel";
import { AIActionsPanel, DOMAIN_ACTIONS } from "@szl-holdings/shared-ui/ai-actions-panel";
import { LANE_ACCENT_HEX } from "@szl-holdings/shared-ui/lane-colors";

const TERRA_ACCENT = LANE_ACCENT_HEX.terra.primary;

const BG = { page: "#0c1018", surface: "#101520", elevated: "#131825" };
const BORDER = { subtle: "rgba(255,255,255,0.04)", muted: "rgba(255,255,255,0.07)" };
const TEXT = { primary: "rgba(255,255,255,0.88)", secondary: "rgba(255,255,255,0.55)", muted: "rgba(255,255,255,0.3)" };

export default function AIIntelligencePage() {
  const [activeTab, setActiveTab] = useState<"actions" | "document">("actions");

  return (
    <div style={{ background: BG.page, minHeight: "100%", padding: "24px", fontFamily: "inherit" }}>
      <div style={{ marginBottom: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
          <span style={{ fontSize: "20px" }}>🏠</span>
          <h1 style={{ fontSize: "20px", fontWeight: 800, color: TEXT.primary, margin: 0 }}>AI Intelligence</h1>
          <span style={{
            fontSize: "9px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.8px",
            background: `${TERRA_ACCENT}15`, color: TERRA_ACCENT, border: `1px solid ${TERRA_ACCENT}30`,
            borderRadius: "4px", padding: "2px 8px",
          }}>Terra</span>
        </div>
        <p style={{ fontSize: "13px", color: TEXT.secondary, margin: 0 }}>
          AI-powered property document analysis, comparable extraction, and automated real estate intelligence.
        </p>
      </div>

      <div style={{ display: "flex", gap: "4px", marginBottom: "20px" }}>
        {(["actions", "document"] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: "7px 14px", borderRadius: "8px",
              background: activeTab === tab ? `${TERRA_ACCENT}20` : "transparent",
              border: `1px solid ${activeTab === tab ? `${TERRA_ACCENT}40` : "transparent"}`,
              color: activeTab === tab ? TERRA_ACCENT : TEXT.muted,
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
              domain="property"
              actions={DOMAIN_ACTIONS.property ?? []}
              accentColor={TERRA_ACCENT}
            />
          </div>
        ) : (
          <DocumentIntelligencePanel
            domain="property"
            accentColor={TERRA_ACCENT}
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
            { name: "Market Alert Distribution", status: "active", runs: 8, color: "#6b8f71" },
            { name: "Climate Risk Scoring", status: "active", runs: 3, color: "#6b8f71" },
            { name: "Lease Term Extractor", status: "active", runs: 14, color: "#6b8f71" },
            { name: "Property Report Generator", status: "paused", runs: 0, color: "#d4a054" },
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
          <div style={{ marginTop: "16px", padding: "12px", background: `${TERRA_ACCENT}08`, border: `1px solid ${TERRA_ACCENT}15`, borderRadius: "8px" }}>
            <div style={{ fontSize: "10px", color: TEXT.muted, marginBottom: "4px" }}>Try in command palette (⌘K):</div>
            <div style={{ fontSize: "11px", color: TERRA_ACCENT, fontStyle: "italic" }}>
              "Summarize this lease agreement for key dates"
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
