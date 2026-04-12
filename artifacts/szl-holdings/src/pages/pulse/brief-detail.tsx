import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft, Download, ChevronDown, ChevronUp, MessageSquareWarning,
  CheckCircle2, Clock, Activity, Ship, Shield, Scale, Bot, Star, Building2,
} from "lucide-react";
import { RISK_COLORS, AGENT_META, confidenceColor, formatDateTime, pulseFetch } from "./pulse-utils";

const TEXT = { primary: "hsl(38 8% 95%)", secondary: "hsl(214 7% 64%)", muted: "hsl(214 6% 42%)", faint: "hsl(214 5% 30%)" };
const BG = { surface: "hsla(214 12% 10% / 0.75)", card: "hsla(214 14% 6% / 0.95)" };
const BORDER = { subtle: "hsla(0 0% 100% / 0.055)" };
const PULSE_ACCENT = "hsl(191 92% 44%)";

type Brief = {
  id: string; date: string; classification: string; headline: string;
  executiveSummary: string; riskLevel: string; overallConfidence: number;
  sections: Array<{ sectionId: string; title: string; agentId: string; agentName: string; domain: string; content: string; confidenceScore: number; keyFindings: string[]; riskLevel: string; actionItems: string[] }>;
  recommendedActions: Array<{ priority: string; action: string; owner: string; domain: string; rationale: string }>;
  tags: string[]; generatedAt: string; generationDurationMs: number;
  agentsContributed: string[]; status: string;
  dissents: Array<{ id: string; claim: string; dissentingView: string; status: string; submittedBy: string; submittedAt: string }>;
};

const DOMAIN_ICONS: Record<string, typeof Activity> = {
  maritime: Ship, security: Shield, analytics: Activity, legal: Scale, infrastructure: Bot, research: Star, "real-estate": Building2,
};

export default function BriefDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  const { data, isLoading, error } = useQuery({
    queryKey: ["pulse-brief", id],
    queryFn: () => pulseFetch<{ brief: Brief }>(`/pulse/briefs/${id}`),
  });

  const brief: Brief | null = data?.brief ?? null;

  function toggleSection(sid: string) {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(sid)) next.delete(sid); else next.add(sid);
      return next;
    });
  }

  async function exportPdf() {
    if (!brief) return;
    try {
      const res = await fetch(`/api/pulse/briefs/${brief.id}/pdf`, { credentials: "include" });
      if (!res.ok) throw new Error(`PDF export failed: ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `pulse-brief-${brief.date}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      const text = [
        `PULSE EXECUTIVE BRIEFING — ${brief.date}`,
        `Classification: ${brief.classification}`,
        `Generated: ${formatDateTime(brief.generatedAt)}`,
        `Overall Confidence: ${brief.overallConfidence}%`,
        `Risk Level: ${brief.riskLevel.toUpperCase()}`,
        "", brief.headline, "", brief.executiveSummary,
      ].join("\n");
      const blob = new Blob([text], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `pulse-brief-${brief.date}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    }
  }

  if (isLoading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <div style={{ height: 40, width: 200, borderRadius: 8, background: "hsla(214 12% 10% / 0.5)" }} />
        {[1, 2, 3].map(i => <div key={i} style={{ height: 120, borderRadius: 10, background: "hsla(214 12% 10% / 0.5)" }} />)}
      </div>
    );
  }

  if (error || !brief) {
    return (
      <div style={{ textAlign: "center", padding: "4rem 2rem" }}>
        <p style={{ color: TEXT.secondary }}>Brief not found.</p>
        <Link href="/pulse/library"><div style={{ color: PULSE_ACCENT, cursor: "pointer", fontSize: 14, marginTop: "1rem" }}>← Back to Library</div></Link>
      </div>
    );
  }

  const risk = RISK_COLORS[brief.riskLevel as keyof typeof RISK_COLORS] ?? RISK_COLORS.medium;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {/* Back nav */}
      <Link href="/pulse/library">
        <div style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem", fontSize: 13, color: TEXT.secondary, cursor: "pointer" }}>
          <ChevronLeft size={15} />Back to Library
        </div>
      </Link>

      {/* Classification */}
      <div style={{ textAlign: "center", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", color: TEXT.muted, fontFamily: "var(--font-mono, monospace)" }}>{brief.classification}</div>

      {/* Header */}
      <div style={{ background: BG.card, border: `1px solid ${BORDER.subtle}`, borderTop: `2px solid ${risk.dot}`, borderRadius: 12, padding: "1.5rem" }}>
        <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", alignItems: "center", marginBottom: "0.625rem" }}>
              <span style={{ fontSize: 11, padding: "3px 8px", borderRadius: 5, background: risk.bg, color: risk.text, border: `1px solid ${risk.border}`, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>{brief.riskLevel} risk</span>
              <span style={{ fontSize: 11, color: TEXT.muted }}>{formatDateTime(brief.generatedAt)}</span>
              {brief.dissents.length > 0 && <span style={{ fontSize: 11, padding: "2px 6px", borderRadius: 4, background: "hsla(32 88% 52% / 0.10)", color: "hsl(32 88% 62%)", border: "1px solid hsla(32 88% 52% / 0.22)" }}>{brief.dissents.length} dissent{brief.dissents.length > 1 ? "s" : ""}</span>}
            </div>
            <h1 style={{ fontFamily: "var(--font-display, Space Grotesk, sans-serif)", fontWeight: 700, fontSize: 21, color: TEXT.primary, lineHeight: 1.3, marginBottom: "0.875rem" }}>{brief.headline}</h1>
            <p style={{ fontSize: 14, color: TEXT.secondary, lineHeight: 1.65, maxWidth: 780 }}>{brief.executiveSummary}</p>
            <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem", flexWrap: "wrap", alignItems: "center" }}>
              <span style={{ fontSize: 11, color: TEXT.faint, textTransform: "uppercase", letterSpacing: "0.06em" }}>Agents:</span>
              {brief.agentsContributed.map(aid => {
                const a = AGENT_META[aid];
                return <span key={aid} style={{ fontSize: 11, padding: "2px 7px", borderRadius: 4, background: a ? `${a.color}14` : "hsla(191 92% 44% / 0.10)", color: a?.color ?? PULSE_ACCENT, border: `1px solid ${a ? a.color + "28" : "hsla(191 92% 44% / 0.20)"}`, fontWeight: 600 }}>{a?.label ?? aid}</span>;
              })}
            </div>
          </div>
          <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
            <div style={{ width: 72, height: 72, borderRadius: "50%", background: `conic-gradient(${confidenceColor(brief.overallConfidence)} ${brief.overallConfidence}%, hsla(214 12% 10% / 0.5) 0)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ width: 54, height: 54, borderRadius: "50%", background: BG.card, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: 18, fontWeight: 700, color: confidenceColor(brief.overallConfidence), lineHeight: 1 }}>{brief.overallConfidence}</span>
                <span style={{ fontSize: 9, color: TEXT.muted, textTransform: "uppercase", letterSpacing: "0.04em" }}>conf.</span>
              </div>
            </div>
            <button onClick={exportPdf} style={{ display: "flex", alignItems: "center", gap: "0.375rem", padding: "0.4rem 0.75rem", borderRadius: 6, border: "1px solid hsla(0 0% 100% / 0.08)", background: BG.surface, color: TEXT.secondary, fontSize: 12, cursor: "pointer" }}>
              <Download size={13} />Export
            </button>
          </div>
        </div>
      </div>

      {/* Recommended Actions */}
      {brief.recommendedActions.length > 0 && (
        <div style={{ background: BG.surface, border: `1px solid ${BORDER.subtle}`, borderRadius: 10, padding: "1.25rem" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: TEXT.muted, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "0.875rem" }}>Recommended Actions</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {brief.recommendedActions.map((a, i) => {
              const pColors = { P0: "hsl(2 70% 65%)", P1: "hsl(32 88% 62%)", P2: "hsl(45 85% 60%)", P3: "hsl(210 70% 65%)" };
              return (
                <div key={i} style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start", padding: "0.75rem", borderRadius: 8, background: BG.card, border: `1px solid ${BORDER.subtle}` }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: pColors[a.priority as keyof typeof pColors] ?? TEXT.muted, background: `${pColors[a.priority as keyof typeof pColors] ?? TEXT.muted}18`, border: `1px solid ${pColors[a.priority as keyof typeof pColors] ?? TEXT.muted}30`, padding: "2px 6px", borderRadius: 4, flexShrink: 0, marginTop: 1 }}>{a.priority}</span>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 500, color: TEXT.primary }}>{a.action}</div>
                    <div style={{ fontSize: 12, color: TEXT.secondary, marginTop: 2 }}>{a.owner} · {a.domain}</div>
                    {a.rationale && <div style={{ fontSize: 12, color: TEXT.muted, marginTop: 2, fontStyle: "italic" }}>{a.rationale}</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Sections */}
      <div>
        <div style={{ fontSize: 12, fontWeight: 700, color: TEXT.muted, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "0.75rem" }}>Domain Sections</div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {brief.sections.map(section => {
            const risk2 = RISK_COLORS[section.riskLevel as keyof typeof RISK_COLORS] ?? RISK_COLORS.medium;
            const agent = AGENT_META[section.agentId];
            const DIcon = DOMAIN_ICONS[section.domain] ?? Activity;
            const expanded = expandedSections.has(section.sectionId);
            return (
              <div key={section.sectionId} style={{ background: BG.surface, border: `1px solid ${BORDER.subtle}`, borderTop: `1px solid ${risk2.border}`, borderRadius: 10, overflow: "hidden" }}>
                <button onClick={() => toggleSection(section.sectionId)} style={{ width: "100%", padding: "1rem 1.25rem", display: "flex", alignItems: "center", gap: "0.875rem", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: agent ? `${agent.color}18` : "hsla(191 92% 44% / 0.10)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <DIcon size={15} style={{ color: agent?.color ?? PULSE_ACCENT }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span style={{ fontWeight: 600, fontSize: 14, color: TEXT.primary }}>{section.title}</span>
                      <span style={{ fontSize: 11, padding: "2px 6px", borderRadius: 4, background: risk2.bg, color: risk2.text, border: `1px solid ${risk2.border}`, textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.04em" }}>{section.riskLevel}</span>
                    </div>
                    <div style={{ fontSize: 12, color: TEXT.secondary, marginTop: 2 }}>
                      {agent && <><span style={{ color: agent.color }}>{agent.label}</span><span style={{ color: TEXT.faint }}> · </span></>}
                      <span style={{ color: confidenceColor(section.confidenceScore), fontWeight: 600 }}>{section.confidenceScore}% confidence</span>
                    </div>
                  </div>
                  <div style={{ color: TEXT.muted }}>{expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</div>
                </button>
                <AnimatePresence>
                  {expanded && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}>
                      <div style={{ padding: "0 1.25rem 1.25rem", borderTop: `1px solid ${BORDER.subtle}` }}>
                        <p style={{ fontSize: 14, color: TEXT.secondary, lineHeight: 1.65, marginTop: "0.875rem" }}>{section.content}</p>
                        {section.keyFindings.length > 0 && (
                          <div style={{ marginTop: "0.875rem" }}>
                            <div style={{ fontSize: 11, fontWeight: 600, color: TEXT.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.5rem" }}>Key Findings</div>
                            {section.keyFindings.map((f, fi) => <div key={fi} style={{ fontSize: 13, color: TEXT.primary, marginBottom: "0.375rem", display: "flex", gap: "0.5rem" }}><span style={{ color: PULSE_ACCENT }}>›</span>{f}</div>)}
                          </div>
                        )}
                        {section.actionItems.length > 0 && (
                          <div style={{ marginTop: "0.875rem" }}>
                            <div style={{ fontSize: 11, fontWeight: 600, color: TEXT.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.5rem" }}>Action Items</div>
                            {section.actionItems.map((ai, aii) => <div key={aii} style={{ fontSize: 13, color: TEXT.primary, marginBottom: "0.375rem", display: "flex", gap: "0.5rem" }}><span style={{ color: "hsl(45 85% 52%)" }}>•</span>{ai}</div>)}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
