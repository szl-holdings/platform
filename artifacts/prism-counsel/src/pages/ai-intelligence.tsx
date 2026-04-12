import { useState } from "react";
import { DocumentIntelligencePanel } from "@szl-holdings/shared-ui/document-intelligence-panel";
import { AIActionsPanel, DOMAIN_ACTIONS } from "@szl-holdings/shared-ui/ai-actions-panel";

const PRISM_ACCENT = "#6366f1";

const BG = { page: "#090b14", surface: "#0d1119", elevated: "#111622" };
const BORDER = { subtle: "rgba(255,255,255,0.04)", muted: "rgba(255,255,255,0.07)" };
const TEXT = { primary: "rgba(255,255,255,0.88)", secondary: "rgba(255,255,255,0.55)", muted: "rgba(255,255,255,0.3)" };

export default function AIIntelligencePage() {
  const [activeTab, setActiveTab] = useState<"actions" | "document">("document");

  return (
    <div style={{ background: BG.page, minHeight: "100%", padding: "24px", fontFamily: "inherit" }}>
      <div style={{ marginBottom: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
          <span style={{ fontSize: "20px" }}>⚖️</span>
          <h1 style={{ fontSize: "20px", fontWeight: 800, color: TEXT.primary, margin: 0 }}>AI Intelligence</h1>
          <span style={{
            fontSize: "9px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.8px",
            background: `${PRISM_ACCENT}15`, color: PRISM_ACCENT, border: `1px solid ${PRISM_ACCENT}30`,
            borderRadius: "4px", padding: "2px 8px",
          }}>Prism Counsel</span>
        </div>
        <p style={{ fontSize: "13px", color: TEXT.secondary, margin: 0 }}>
          Legal document intelligence, entity extraction, obligation analysis, and AI-assisted matter management.
        </p>
      </div>

      <div style={{ display: "flex", gap: "4px", marginBottom: "20px" }}>
        {(["document", "actions"] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: "7px 14px", borderRadius: "8px",
              background: activeTab === tab ? `${PRISM_ACCENT}20` : "transparent",
              border: `1px solid ${activeTab === tab ? `${PRISM_ACCENT}40` : "transparent"}`,
              color: activeTab === tab ? PRISM_ACCENT : TEXT.muted,
              fontSize: "12px", fontWeight: activeTab === tab ? 700 : 500,
              cursor: "pointer",
            }}
          >
            {tab === "document" ? "📄 Document Intelligence" : "⚡ AI Actions"}
          </button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "16px" }}>
        {activeTab === "document" ? (
          <DocumentIntelligencePanel
            domain="legal"
            accentColor={PRISM_ACCENT}
          />
        ) : (
          <div style={{ position: "relative" }}>
            <AIActionsPanel
              domain="legal"
              actions={DOMAIN_ACTIONS.legal ?? []}
              accentColor={PRISM_ACCENT}
            />
          </div>
        )}

        <div style={{
          background: BG.surface, border: `1px solid ${BORDER.muted}`,
          borderRadius: "16px", padding: "20px",
        }}>
          <div style={{ fontSize: "12px", fontWeight: 700, color: TEXT.primary, marginBottom: "16px", display: "flex", alignItems: "center", gap: "6px" }}>
            <span>🤖</span> Active AI Workflows
          </div>
          {[
            { name: "Matter Document Ingestion", status: "active", runs: 4, color: "#6b8f71" },
            { name: "Deadline Risk Monitor", status: "active", runs: 12, color: "#6b8f71" },
            { name: "Conflict Check Runner", status: "active", runs: 2, color: "#6b8f71" },
            { name: "Brief Draft Assistant", status: "paused", runs: 0, color: "#d4a054" },
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
          <div style={{ marginTop: "16px", padding: "12px", background: `${PRISM_ACCENT}08`, border: `1px solid ${PRISM_ACCENT}15`, borderRadius: "8px" }}>
            <div style={{ fontSize: "10px", color: TEXT.muted, marginBottom: "4px" }}>Try in command palette (⌘K):</div>
            <div style={{ fontSize: "11px", color: PRISM_ACCENT, fontStyle: "italic" }}>
              "Summarize this lease agreement and extract obligations"
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
