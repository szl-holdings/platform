import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  RefreshCw, Zap, Shield, Ship, Building2, Scale, Activity,
  AlertTriangle, CheckCircle2, Clock, ChevronDown, ChevronUp,
  Download, MessageSquareWarning, Bot, FileText, Star,
} from "lucide-react";
import { PULSE_ACCENT, PULSE_DIM, PULSE_BORDER } from "./pulse-layout";
import { RISK_COLORS, DOMAIN_COLORS, AGENT_META, confidenceColor, formatDateTime, pulseFetch } from "./pulse-utils";

const BG = { page: "hsl(214 18% 3%)", surface: "hsla(214 12% 10% / 0.75)", elevated: "hsla(214 10% 13% / 0.88)", card: "hsla(214 14% 6% / 0.95)" };
const BORDER = { subtle: "hsla(0 0% 100% / 0.055)", muted: "hsla(0 0% 100% / 0.06)" };
const TEXT = { primary: "hsl(38 8% 95%)", secondary: "hsl(214 7% 64%)", muted: "hsl(214 6% 42%)", faint: "hsl(214 5% 30%)" };

type Brief = {
  id: string; date: string; classification: string; headline: string;
  executiveSummary: string; riskLevel: string; overallConfidence: number;
  sections: Array<{
    sectionId: string; title: string; agentId: string; agentName: string; domain: string;
    content: string; confidenceScore: number; keyFindings: string[];
    riskLevel: string; actionItems: string[];
  }>;
  recommendedActions: Array<{ priority: string; action: string; owner: string; domain: string; rationale: string }>;
  tags: string[]; generatedAt: string; generationDurationMs: number;
  agentsContributed: string[]; status: string;
  dissents: Array<{ id: string; claim: string; dissentingView: string; status: string; submittedBy: string; submittedAt: string }>;
};

const DOMAIN_ICONS: Record<string, typeof Ship> = {
  maritime: Ship, security: Shield, analytics: Activity,
  infrastructure: Bot, research: Star, legal: Scale, "real-estate": Building2,
};

function SectionCard({ section, expanded, onToggle }: {
  section: Brief["sections"][0];
  expanded: boolean;
  onToggle: () => void;
}) {
  const risk = RISK_COLORS[section.riskLevel as keyof typeof RISK_COLORS] ?? RISK_COLORS.medium;
  const agent = AGENT_META[section.agentId];
  const DomainIcon = DOMAIN_ICONS[section.domain] ?? Activity;

  return (
    <div style={{ background: BG.surface, border: `1px solid ${BORDER.subtle}`, borderRadius: 10, overflow: "hidden", transition: "border-color 0.15s", borderTop: `1px solid ${risk.border}` }}>
      <button
        onClick={onToggle}
        style={{ width: "100%", padding: "1rem 1.25rem", display: "flex", alignItems: "center", gap: "0.875rem", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}
      >
        <div style={{ width: 32, height: 32, borderRadius: 8, background: agent ? `${agent.color}18` : PULSE_DIM, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <DomainIcon size={15} style={{ color: agent?.color ?? PULSE_ACCENT }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ fontWeight: 600, fontSize: 14, color: TEXT.primary, fontFamily: "var(--font-display, Space Grotesk, sans-serif)" }}>{section.title}</span>
            <span style={{ fontSize: 11, padding: "2px 6px", borderRadius: 4, background: risk.bg, color: risk.text, border: `1px solid ${risk.border}`, textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.04em" }}>{section.riskLevel}</span>
          </div>
          <div style={{ fontSize: 12, color: TEXT.secondary, marginTop: 2 }}>
            {agent ? <><span style={{ color: agent.color }}>{agent.label}</span><span style={{ color: TEXT.faint }}> · </span></> : null}
            <span style={{ color: confidenceColor(section.confidenceScore), fontWeight: 600 }}>{section.confidenceScore}% confidence</span>
          </div>
        </div>
        <div style={{ color: TEXT.muted, flexShrink: 0 }}>
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <div style={{ padding: "0 1.25rem 1.25rem", borderTop: `1px solid ${BORDER.subtle}` }}>
              <p style={{ fontSize: 14, color: TEXT.secondary, lineHeight: 1.65, marginTop: "0.875rem" }}>{section.content}</p>

              {section.keyFindings.length > 0 && (
                <div style={{ marginTop: "0.875rem" }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: TEXT.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.5rem" }}>Key Findings</div>
                  <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                    {section.keyFindings.map((f, i) => (
                      <li key={i} style={{ display: "flex", gap: "0.5rem", fontSize: 13, color: TEXT.primary }}>
                        <span style={{ color: PULSE_ACCENT, marginTop: 2, flexShrink: 0 }}>›</span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {section.actionItems.length > 0 && (
                <div style={{ marginTop: "0.875rem" }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: TEXT.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.5rem" }}>Action Items</div>
                  <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                    {section.actionItems.map((a, i) => (
                      <li key={i} style={{ display: "flex", gap: "0.5rem", fontSize: 13, color: TEXT.primary }}>
                        <span style={{ color: "hsl(45 85% 52%)", marginTop: 2, flexShrink: 0 }}>•</span>
                        <span>{a}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const PRIORITY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  P0: { bg: "hsla(2 70% 50% / 0.14)", text: "hsl(2 70% 65%)", border: "hsla(2 70% 50% / 0.30)" },
  P1: { bg: "hsla(32 88% 52% / 0.12)", text: "hsl(32 88% 62%)", border: "hsla(32 88% 52% / 0.28)" },
  P2: { bg: "hsla(45 85% 52% / 0.10)", text: "hsl(45 85% 60%)", border: "hsla(45 85% 52% / 0.22)" },
  P3: { bg: "hsla(210 70% 52% / 0.10)", text: "hsl(210 70% 65%)", border: "hsla(210 70% 52% / 0.22)" },
};

export default function DailyBriefPage() {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["maritime"]));
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["pulse-today"],
    queryFn: () => pulseFetch<{ brief: Brief | null }>("/pulse/briefs/today"),
    refetchInterval: 5 * 60 * 1000,
  });

  const generateMutation = useMutation({
    mutationFn: () => pulseFetch("/pulse/briefs/generate", { method: "POST" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["pulse-today"] }),
  });

  const brief: Brief | null = data?.brief ?? null;
  const risk = brief ? (RISK_COLORS[brief.riskLevel as keyof typeof RISK_COLORS] ?? RISK_COLORS.medium) : null;

  function toggleSection(id: string) {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
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
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {[1, 2, 3].map(i => (
          <div key={i} style={{ height: 80, borderRadius: 10, background: "hsla(214 12% 10% / 0.5)", animation: "pulse 2s infinite" }} />
        ))}
      </div>
    );
  }

  if (!brief) {
    return (
      <div style={{ textAlign: "center", padding: "5rem 2rem" }}>
        <div style={{ width: 64, height: 64, borderRadius: 16, background: PULSE_DIM, border: `1px solid ${PULSE_BORDER}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem" }}>
          <FileText size={28} style={{ color: PULSE_ACCENT }} />
        </div>
        <h2 style={{ fontFamily: "var(--font-display, Space Grotesk, sans-serif)", fontWeight: 700, fontSize: 22, color: TEXT.primary, marginBottom: "0.5rem" }}>No Brief for Today</h2>
        <p style={{ color: TEXT.secondary, fontSize: 14, maxWidth: 380, margin: "0 auto 2rem" }}>
          Today's executive briefing has not been generated yet. Trigger the Nuro Mesh agents to synthesize the daily intelligence product.
        </p>
        <button
          onClick={() => generateMutation.mutate()}
          disabled={generateMutation.isPending}
          style={{
            display: "inline-flex", alignItems: "center", gap: "0.5rem",
            padding: "0.75rem 1.5rem", borderRadius: 8, border: "none", cursor: generateMutation.isPending ? "default" : "pointer",
            background: `linear-gradient(135deg, ${PULSE_ACCENT}, hsl(218 70% 52%))`,
            color: "hsl(214 18% 3%)", fontWeight: 700, fontSize: 14,
            opacity: generateMutation.isPending ? 0.7 : 1,
          }}
        >
          <Zap size={16} />
          {generateMutation.isPending ? "Generating Brief…" : "Generate Today's Brief"}
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {/* Classification banner */}
      <div style={{ textAlign: "center", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", color: TEXT.muted, fontFamily: "var(--font-mono, JetBrains Mono, monospace)" }}>
        {brief.classification}
      </div>

      {/* Brief header card */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} style={{ background: BG.card, border: `1px solid ${BORDER.subtle}`, borderTop: risk ? `2px solid ${risk.dot}` : undefined, borderRadius: 12, padding: "1.5rem" }}>
        <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.625rem", alignItems: "center" }}>
              <span style={{ fontSize: 11, padding: "3px 8px", borderRadius: 5, background: risk?.bg, color: risk?.text, border: `1px solid ${risk?.border}`, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                {brief.riskLevel} risk
              </span>
              <span style={{ fontSize: 11, color: TEXT.muted }}>{formatDateTime(brief.generatedAt)}</span>
              <span style={{ fontSize: 11, color: TEXT.faint }}>·</span>
              <span style={{ fontSize: 11, color: TEXT.muted }}>{(brief.generationDurationMs / 1000).toFixed(1)}s generation</span>
              {brief.dissents.length > 0 && (
                <span style={{ fontSize: 11, padding: "2px 6px", borderRadius: 4, background: "hsla(32 88% 52% / 0.10)", color: "hsl(32 88% 62%)", border: "1px solid hsla(32 88% 52% / 0.22)" }}>
                  {brief.dissents.length} dissent{brief.dissents.length > 1 ? "s" : ""}
                </span>
              )}
            </div>
            <h1 style={{ fontFamily: "var(--font-display, Space Grotesk, sans-serif)", fontWeight: 700, fontSize: 20, color: TEXT.primary, lineHeight: 1.3, marginBottom: "0.875rem" }}>{brief.headline}</h1>
            <p style={{ fontSize: 14, color: TEXT.secondary, lineHeight: 1.65, maxWidth: 780 }}>{brief.executiveSummary}</p>

            {/* Agents row */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "1rem", flexWrap: "wrap" }}>
              <span style={{ fontSize: 11, color: TEXT.faint, textTransform: "uppercase", letterSpacing: "0.06em" }}>Agents:</span>
              {brief.agentsContributed.map(aid => {
                const a = AGENT_META[aid];
                return (
                  <span key={aid} style={{ fontSize: 11, padding: "2px 7px", borderRadius: 4, background: a ? `${a.color}14` : PULSE_DIM, color: a?.color ?? PULSE_ACCENT, border: `1px solid ${a ? a.color + "28" : PULSE_BORDER}`, fontWeight: 600 }}>
                    {a?.label ?? aid}
                  </span>
                );
              })}
            </div>
          </div>

          {/* Confidence ring */}
          <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: "0.25rem" }}>
            <div style={{ width: 72, height: 72, borderRadius: "50%", background: `conic-gradient(${confidenceColor(brief.overallConfidence)} ${brief.overallConfidence}%, hsla(214 12% 10% / 0.5) 0)`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 16px ${confidenceColor(brief.overallConfidence)}28` }}>
              <div style={{ width: 54, height: 54, borderRadius: "50%", background: BG.card, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: 18, fontWeight: 700, color: confidenceColor(brief.overallConfidence), lineHeight: 1 }}>{brief.overallConfidence}</span>
                <span style={{ fontSize: 9, color: TEXT.muted, textTransform: "uppercase", letterSpacing: "0.04em" }}>conf.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: "0.5rem", marginTop: "1.25rem", flexWrap: "wrap" }}>
          <button onClick={exportPdf} style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem", padding: "0.5rem 0.875rem", borderRadius: 7, border: "1px solid hsla(0 0% 100% / 0.08)", background: "hsla(214 12% 10% / 0.75)", color: TEXT.secondary, fontSize: 13, cursor: "pointer", fontWeight: 500 }}>
            <Download size={14} />Export PDF
          </button>
          <button onClick={() => generateMutation.mutate()} disabled={generateMutation.isPending} style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem", padding: "0.5rem 0.875rem", borderRadius: 7, border: `1px solid ${PULSE_BORDER}`, background: PULSE_DIM, color: PULSE_ACCENT, fontSize: 13, cursor: "pointer", fontWeight: 500 }}>
            <RefreshCw size={14} style={{ animation: generateMutation.isPending ? "spin 1s linear infinite" : "none" }} />
            {generateMutation.isPending ? "Regenerating…" : "Regenerate"}
          </button>
        </div>
      </motion.div>

      {/* Recommended Actions */}
      {brief.recommendedActions.length > 0 && (
        <div style={{ background: BG.surface, border: `1px solid ${BORDER.subtle}`, borderRadius: 10, padding: "1.25rem" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: TEXT.muted, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "0.875rem" }}>Recommended Actions</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
            {brief.recommendedActions.map((a, i) => {
              const pc = PRIORITY_COLORS[a.priority] ?? PRIORITY_COLORS.P2;
              return (
                <div key={i} style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start", padding: "0.75rem", borderRadius: 8, background: BG.elevated, border: `1px solid ${BORDER.subtle}` }}>
                  <span style={{ fontSize: 11, padding: "2px 6px", borderRadius: 4, background: pc.bg, color: pc.text, border: `1px solid ${pc.border}`, fontWeight: 700, letterSpacing: "0.04em", flexShrink: 0, marginTop: 1 }}>{a.priority}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: TEXT.primary }}>{a.action}</div>
                    <div style={{ fontSize: 12, color: TEXT.secondary, marginTop: 2 }}>
                      <span style={{ color: TEXT.muted }}>Owner:</span> {a.owner} · <span style={{ color: TEXT.muted }}>Domain:</span> {a.domain}
                    </div>
                    {a.rationale && <div style={{ fontSize: 12, color: TEXT.muted, marginTop: 3, fontStyle: "italic" }}>{a.rationale}</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Sections */}
      <div>
        <div style={{ fontSize: 12, fontWeight: 700, color: TEXT.muted, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "0.75rem" }}>Domain Sections — {brief.sections.length} Assessments</div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {brief.sections.map(section => (
            <SectionCard
              key={section.sectionId}
              section={section}
              expanded={expandedSections.has(section.sectionId)}
              onToggle={() => toggleSection(section.sectionId)}
            />
          ))}
        </div>
      </div>

      {/* Dissents */}
      {brief.dissents.length > 0 && (
        <div style={{ background: "hsla(32 88% 52% / 0.06)", border: "1px solid hsla(32 88% 52% / 0.20)", borderRadius: 10, padding: "1.25rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.875rem" }}>
            <MessageSquareWarning size={16} style={{ color: "hsl(32 88% 62%)" }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: "hsl(32 88% 62%)", textTransform: "uppercase", letterSpacing: "0.07em" }}>Active Dissents</span>
          </div>
          {brief.dissents.map(d => (
            <div key={d.id} style={{ padding: "0.875rem", borderRadius: 8, background: "hsla(214 12% 10% / 0.5)", border: "1px solid hsla(32 88% 52% / 0.15)", marginBottom: "0.5rem" }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: TEXT.primary, marginBottom: "0.375rem" }}>Claim: "{d.claim}"</div>
              <div style={{ fontSize: 13, color: TEXT.secondary, marginBottom: "0.5rem" }}>{d.dissentingView}</div>
              <div style={{ display: "flex", gap: "0.75rem", fontSize: 11, color: TEXT.muted }}>
                <span>Filed by {d.submittedBy}</span>
                <span>·</span>
                <span style={{ padding: "1px 6px", borderRadius: 3, background: "hsla(32 88% 52% / 0.12)", color: "hsl(32 88% 62%)" }}>{d.status}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
