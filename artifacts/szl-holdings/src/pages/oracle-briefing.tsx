import { useState, useEffect, useMemo } from "react";
import { m, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import { SiteNav } from "@/components/SiteNav";
import {
  ChevronDown, ChevronRight, AlertTriangle, Shield, BookOpen,
  Activity, Globe, Clock, ExternalLink, Network, Info,
  CheckCircle, Zap, FileText,
} from "lucide-react";
import { generateOracleBrief, type OracleBriefSection, type BriefSeverity } from "@/lib/nexus/oracle-pipeline";
import { KNOWLEDGE_GRAPH } from "@/lib/nexus/graph";

const SEVERITY_COLORS: Record<BriefSeverity, string> = {
  critical: "#ef4444",
  high: "#f97316",
  medium: "#eab308",
  low: "#10b981",
  info: "#60a5fa",
};

const PRIORITY_CONFIG: Record<string, { color: string; label: string; icon: React.ElementType }> = {
  immediate:  { color: "#ef4444", label: "IMMEDIATE",  icon: Zap },
  today:      { color: "#f97316", label: "TODAY",      icon: Activity },
  "this-week":{ color: "#eab308", label: "THIS WEEK",  icon: Clock },
};

function ConfidenceMeter({ value, color }: { value: number; color: string }) {
  const segments = 10;
  const filled = Math.round((value / 100) * segments);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
      <div style={{ display: "flex", gap: "2px" }}>
        {Array.from({ length: segments }).map((_, i) => (
          <div key={i} style={{ width: "14px", height: "4px", borderRadius: "1px", background: i < filled ? color : "rgba(255,255,255,0.07)", transition: "background 0.3s" }} />
        ))}
      </div>
      <span style={{ fontSize: "11px", fontWeight: 700, color }}>{value}%</span>
    </div>
  );
}

function SectionCard({ section, index }: { section: OracleBriefSection; index: number }) {
  const [expanded, setExpanded] = useState(index < 2);
  const color = SEVERITY_COLORS[section.severity];

  return (
    <m.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      style={{ borderRadius: "12px", border: `1px solid ${color}18`, background: `${color}04`, overflow: "hidden", position: "relative" }}
    >
      <div style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: "3px", background: color }} />

      <button
        onClick={() => setExpanded(e => !e)}
        style={{ width: "100%", background: "none", border: "none", cursor: "pointer", padding: "1.125rem 1.25rem 1.125rem 1.5rem", textAlign: "left", fontFamily: "inherit", display: "flex", alignItems: "flex-start", gap: "1rem" }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.375rem" }}>
            <span style={{ fontSize: "8px", fontWeight: 800, letterSpacing: "0.1em", padding: "2px 6px", borderRadius: "3px", background: `${color}18`, border: `1px solid ${color}28`, color, flexShrink: 0 }}>
              {section.severity.toUpperCase()}
            </span>
            <span style={{ fontSize: "9px", color: "hsl(210,5%,38%)", fontFamily: "monospace", flexShrink: 0 }}>
              SECTION {String(section.sectionNumber).padStart(2, "0")}
            </span>
            <span style={{ fontSize: "9px", fontWeight: 600, padding: "1px 6px", borderRadius: "3px", background: "rgba(255,255,255,0.04)", color: section.domainColor, flexShrink: 0 }}>
              {section.domain}
            </span>
          </div>
          <div style={{ fontSize: "13.5px", fontWeight: 700, color: "hsl(210,10%,90%)", lineHeight: 1.4, marginBottom: "0.5rem" }}>
            {section.title}
          </div>
          <ConfidenceMeter value={section.analystConfidence} color={color} />
        </div>
        <div style={{ color: "hsl(210,5%,40%)", flexShrink: 0, marginTop: "2px" }}>
          {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </div>
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <m.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            style={{ overflow: "hidden" }}
          >
            <div style={{ padding: "0 1.5rem 1.5rem" }}>
              <p style={{ fontSize: "12px", color: "hsl(210,5%,58%)", lineHeight: 1.75, marginBottom: "1.25rem" }}>
                {section.summary}
              </p>

              <div style={{ marginBottom: "1.25rem" }}>
                <div style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.1em", color: "hsl(210,5%,38%)", textTransform: "uppercase", marginBottom: "0.625rem" }}>
                  Findings
                </div>
                {section.findings.map((f, fi) => {
                  const fc = SEVERITY_COLORS[f.severity];
                  return (
                    <div key={fi} style={{ padding: "0.625rem 0.75rem", borderRadius: "8px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", marginBottom: "0.5rem", position: "relative", overflow: "hidden" }}>
                      <div style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: "2px", background: fc }} />
                      <div style={{ paddingLeft: "0.5rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                          <span style={{ fontSize: "9px", fontWeight: 700, color: fc, letterSpacing: "0.06em" }}>
                            {f.severity.toUpperCase()}
                          </span>
                          {f.metric !== undefined && f.value !== undefined && (
                            <span style={{ fontSize: "9px", fontFamily: "monospace", color: "hsl(210,5%,38%)" }}>
                              {f.metric}: {typeof f.value === "number" && f.value > 999 ? `$${(f.value / 1e6).toFixed(1)}M` : f.value}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: "11px", fontWeight: 600, color: "hsl(210,10%,80%)", marginBottom: "2px" }}>{f.label}</div>
                        <div style={{ fontSize: "10.5px", color: "hsl(210,5%,48%)", lineHeight: 1.6 }}>{f.detail}</div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {section.recommendedActions.length > 0 && (
                <div style={{ marginBottom: "1rem" }}>
                  <div style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.1em", color: "hsl(210,5%,38%)", textTransform: "uppercase", marginBottom: "0.625rem" }}>
                    Recommended Actions
                  </div>
                  {section.recommendedActions.map((a, ai) => {
                    const pc = PRIORITY_CONFIG[a.priority] ?? PRIORITY_CONFIG["this-week"];
                    const PIcon = pc.icon;
                    return (
                      <div key={ai} style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start", padding: "0.625rem 0.75rem", borderRadius: "8px", background: `${pc.color}05`, border: `1px solid ${pc.color}14`, marginBottom: "0.5rem" }}>
                        <PIcon size={11} style={{ color: pc.color, marginTop: "1px", flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "2px" }}>
                            <span style={{ fontSize: "8px", fontWeight: 800, letterSpacing: "0.1em", color: pc.color }}>{pc.label}</span>
                            <span style={{ fontSize: "9px", color: "hsl(210,5%,38%)" }}>· {a.owner}</span>
                          </div>
                          <div style={{ fontSize: "11px", color: "hsl(210,10%,74%)", lineHeight: 1.5 }}>{a.action}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div style={{ padding: "0.625rem 0.75rem", borderRadius: "8px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "flex-start", gap: "0.5rem" }}>
                <Info size={11} style={{ color: "hsl(210,5%,38%)", flexShrink: 0, marginTop: "1px" }} />
                <div>
                  <div style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.06em", color: "hsl(210,5%,38%)", marginBottom: "2px", textTransform: "uppercase" }}>Analyst Note · Confidence {section.analystConfidence}%</div>
                  <div style={{ fontSize: "10.5px", color: "hsl(210,5%,48%)", lineHeight: 1.65 }}>{section.analystNote}</div>
                </div>
              </div>

              {section.drillDownPath && (
                <div style={{ marginTop: "0.875rem" }}>
                  <Link href={section.drillDownPath}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem", fontSize: "10px", color: "#60a5fa", cursor: "pointer" }}>
                      <ExternalLink size={10} />
                      {section.drillDownPath.includes("nexus") ? "Explore in NEXUS Graph" : "Open in PRISM Counsel"}
                      <ChevronRight size={9} />
                    </span>
                  </Link>
                </div>
              )}
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </m.div>
  );
}

function AccessGate({ onAcknowledge }: { onAcknowledge: () => void }) {
  return (
    <div style={{ minHeight: "100vh", background: "hsl(220,14%,4%)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <m.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{ maxWidth: "480px", width: "90%", padding: "2.5rem", borderRadius: "16px", background: "hsl(220,14%,6%)", border: "1px solid rgba(239,68,68,0.2)", textAlign: "center" }}
      >
        <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.25rem" }}>
          <Shield size={20} style={{ color: "#ef4444" }} />
        </div>
        <div style={{ fontSize: "9px", fontWeight: 800, letterSpacing: "0.14em", color: "#ef4444", marginBottom: "0.625rem", textTransform: "uppercase" }}>ORACLE INTELLIGENCE BRIEF</div>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "hsl(210,10%,94%)", marginBottom: "0.75rem", letterSpacing: "-0.02em" }}>Executive Eyes Only</h2>
        <p style={{ fontSize: "11.5px", color: "hsl(210,5%,50%)", lineHeight: 1.75, marginBottom: "1.75rem" }}>
          This brief contains ORACLE-generated intelligence synthesized from live SZL Holdings cross-domain data. Access is restricted to authorized SZL executives. Your review will be timestamped and logged for compliance purposes.
        </p>
        <m.button
          onClick={onAcknowledge}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.99 }}
          style={{ width: "100%", padding: "0.875rem 1.5rem", borderRadius: "10px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444", fontFamily: "inherit", fontSize: "12px", fontWeight: 700, letterSpacing: "0.05em", cursor: "pointer" }}
        >
          I CONFIRM — Authorized Access
        </m.button>
        <p style={{ fontSize: "9.5px", color: "hsl(210,5%,32%)", marginTop: "0.875rem" }}>
          Review logged · {new Date().toUTCString()}
        </p>
      </m.div>
    </div>
  );
}

export default function OracleBriefingPage() {
  const [acknowledged, setAcknowledged] = useState(false);

  useEffect(() => { document.title = "ORACLE Daily Brief — SZL Holdings Executive"; }, []);

  const brief = useMemo(() => generateOracleBrief(KNOWLEDGE_GRAPH), []);

  if (!acknowledged) {
    return <AccessGate onAcknowledge={() => setAcknowledged(true)} />;
  }

  const { executiveSummary, sections, anomalyReport } = brief;
  const critColor = executiveSummary.criticalCount > 0 ? "#ef4444" : executiveSummary.highCount > 0 ? "#f97316" : "#10b981";

  return (
    <div style={{ minHeight: "100vh", background: "hsl(220,14%,4%)", position: "relative" }}>
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", top: "-15%", right: "-10%", width: "50vw", height: "50vw", borderRadius: "50%", background: "radial-gradient(ellipse, rgba(167,139,250,0.03) 0%, transparent 70%)" }} />
        <div style={{ position: "absolute", bottom: "0", left: "0", width: "40vw", height: "40vw", borderRadius: "50%", background: "radial-gradient(ellipse, rgba(239,68,68,0.025) 0%, transparent 70%)" }} />
      </div>

      <SiteNav />

      <main className="pt-20" style={{ position: "relative", zIndex: 1, minHeight: "calc(100vh - 80px)" }}>
        <div style={{ maxWidth: "880px", margin: "0 auto", padding: "0 1.5rem 6rem" }}>

          {/* ── Document header ── */}
          <m.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} style={{ padding: "1.75rem 0 1.25rem", borderBottom: "1px solid rgba(255,255,255,0.05)", marginBottom: "2rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
              <div>
                <div style={{ fontFamily: "monospace", fontSize: "9px", color: "rgba(255,255,255,0.15)", letterSpacing: "0.18em", marginBottom: "0.375rem" }}>
                  ████ TOP SECRET · ORACLE DAILY BRIEF · EXECUTIVE EYES ONLY ████
                </div>
                <h1 style={{ fontSize: "clamp(1.4rem,2.8vw,1.75rem)", fontWeight: 900, color: "hsl(210,10%,96%)", letterSpacing: "-0.04em", lineHeight: 1 }}>
                  ORACLE Intelligence Brief
                </h1>
                <div style={{ fontFamily: "monospace", fontSize: "10.5px", color: "hsl(210,5%,38%)", marginTop: "0.4rem", display: "flex", gap: "1.25rem", flexWrap: "wrap" }}>
                  <span>{brief.briefId}</span>
                  <span>{new Date(brief.generatedAt).toUTCString()}</span>
                  <span>Graph v{brief.graphVersion}</span>
                  <span>Runtime {brief.runtimeMs}ms</span>
                </div>
              </div>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <Link href="/nexus/explorer">
                  <m.button whileHover={{ scale: 1.02 }} style={{ display: "flex", alignItems: "center", gap: "0.375rem", padding: "0.5rem 1rem", borderRadius: "8px", background: "rgba(96,165,250,0.08)", border: "1px solid rgba(96,165,250,0.2)", color: "#60a5fa", fontSize: "11px", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                    <Network size={12} /> NEXUS Graph
                  </m.button>
                </Link>
                <Link href="/nexus">
                  <m.button whileHover={{ scale: 1.02 }} style={{ display: "flex", alignItems: "center", gap: "0.375rem", padding: "0.5rem 1rem", borderRadius: "8px", background: "rgba(167,139,250,0.08)", border: "1px solid rgba(167,139,250,0.2)", color: "#a78bfa", fontSize: "11px", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                    <Globe size={12} /> Command
                  </m.button>
                </Link>
              </div>
            </div>
          </m.div>

          {/* ── Executive summary grid ── */}
          <m.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.4 }} style={{ marginBottom: "2rem" }}>
            <div style={{ fontSize: "9px", fontWeight: 800, letterSpacing: "0.12em", color: "hsl(210,5%,38%)", textTransform: "uppercase", marginBottom: "0.875rem" }}>
              Executive Summary — {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "0.75rem", marginBottom: "1.25rem" }}>
              {[
                { label: "Critical Sections", value: executiveSummary.criticalCount, color: "#ef4444" },
                { label: "High Sections", value: executiveSummary.highCount, color: "#f97316" },
                { label: "Immediate Actions", value: executiveSummary.immediateActionCount, color: "#a78bfa" },
                { label: "Anomalies Detected", value: anomalyReport.totalCount, color: "#60a5fa" },
              ].map((kpi, i) => (
                <m.div key={i} initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.15 + i * 0.04 }}
                  style={{ padding: "0.875rem", borderRadius: "10px", background: `${kpi.color}06`, border: `1px solid ${kpi.color}18` }}>
                  <div style={{ fontSize: "9px", color: "hsl(210,5%,40%)", marginBottom: "0.375rem" }}>{kpi.label}</div>
                  <div style={{ fontSize: "28px", fontWeight: 900, color: kpi.color, lineHeight: 1 }}>{kpi.value}</div>
                </m.div>
              ))}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
              {[
                { label: "Top Risk", value: executiveSummary.topRisk, Icon: AlertTriangle, color: critColor },
                { label: "Key Development", value: executiveSummary.keyDevelopment, Icon: Activity, color: "#f97316" },
                { label: "Trend Assessment", value: executiveSummary.trendShift, Icon: FileText, color: "#eab308" },
                { label: "ORACLE Assessment", value: executiveSummary.oracleAssessment, Icon: BookOpen, color: "#a78bfa" },
              ].map(({ label, value, Icon, color }, i) => (
                <m.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.05 }}
                  style={{ display: "flex", gap: "0.875rem", alignItems: "flex-start", padding: "0.875rem 1rem", borderRadius: "10px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <Icon size={13} style={{ color, marginTop: "2px", flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.08em", color: "hsl(210,5%,36%)", textTransform: "uppercase", marginBottom: "3px" }}>{label}</div>
                    <div style={{ fontSize: "12px", color: "hsl(210,5%,62%)", lineHeight: 1.65 }}>{value}</div>
                  </div>
                </m.div>
              ))}
            </div>
          </m.div>

          {/* ── Anomaly quick-stats ── */}
          {anomalyReport.totalCount > 0 && (
            <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
              style={{ padding: "0.875rem 1.125rem", borderRadius: "10px", background: "rgba(239,68,68,0.04)", border: "1px solid rgba(239,68,68,0.12)", marginBottom: "2rem", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                <AlertTriangle size={12} style={{ color: "#ef4444" }} />
                <span style={{ fontSize: "10.5px", fontWeight: 600, color: "hsl(210,5%,60%)" }}>
                  NEXUS pattern engine: {anomalyReport.totalCount} cross-domain anomalies detected
                </span>
              </div>
              <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                {(Object.entries(anomalyReport.bySeverity) as Array<[BriefSeverity, number]>).map(([sev, count]) => {
                  if (!count) return null;
                  const c = SEVERITY_COLORS[sev];
                  return (
                    <span key={sev} style={{ fontSize: "9px", fontWeight: 700, color: c, padding: "2px 7px", borderRadius: "4px", background: `${c}12`, border: `1px solid ${c}22` }}>
                      {count} {sev}
                    </span>
                  );
                })}
              </div>
              <Link href="/nexus/explorer">
                <span style={{ fontSize: "10px", color: "#60a5fa", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                  View in NEXUS <ChevronRight size={10} />
                </span>
              </Link>
            </m.div>
          )}

          {/* ── Intelligence sections ── */}
          <div style={{ marginBottom: "0.875rem" }}>
            <div style={{ fontSize: "9px", fontWeight: 800, letterSpacing: "0.12em", color: "hsl(210,5%,38%)", textTransform: "uppercase" }}>
              Intelligence Sections ({sections.length})
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem", marginBottom: "3rem" }}>
            {sections.map((section, i) => (
              <SectionCard key={section.id} section={section} index={i} />
            ))}
          </div>

          {/* ── Provenance footer ── */}
          <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
            style={{ padding: "1.25rem 1.5rem", borderRadius: "12px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.875rem" }}>
              <CheckCircle size={12} style={{ color: "#10b981" }} />
              <span style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.1em", color: "hsl(210,5%,38%)", textTransform: "uppercase" }}>About This Brief — ORACLE Pipeline Provenance</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.625rem 1.5rem" }}>
              {[
                { label: "Brief ID", value: brief.briefId },
                { label: "Generated", value: new Date(brief.generatedAt).toUTCString() },
                { label: "Graph Version", value: `v${brief.graphVersion}` },
                { label: "Entities Analyzed", value: `${KNOWLEDGE_GRAPH.entities.length}` },
                { label: "Edges Traversed", value: `${KNOWLEDGE_GRAPH.edges.length} (${KNOWLEDGE_GRAPH.edges.filter(e => e.inferred).length} inferred)` },
                { label: "Anomaly Patterns Run", value: "4 patterns" },
                { label: "Sections Generated", value: `${sections.length}` },
                { label: "Pipeline Runtime", value: `${brief.runtimeMs}ms` },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
                  <span style={{ fontSize: "8.5px", color: "hsl(210,5%,36%)", letterSpacing: "0.06em", textTransform: "uppercase" }}>{label}</span>
                  <span style={{ fontSize: "10.5px", fontFamily: "monospace", color: "hsl(210,5%,52%)" }}>{value}</span>
                </div>
              ))}
            </div>
            <p style={{ fontSize: "10px", color: "hsl(210,5%,32%)", lineHeight: 1.65, marginTop: "0.875rem" }}>
              This brief is generated by the ORACLE pipeline from the live NEXUS knowledge graph. All findings are derived deterministically from cross-domain entity data and anomaly patterns — no hardcoded content. Inferred relationships are marked as such and carry lower confidence. Not a substitute for human intelligence review.
            </p>
          </m.div>
        </div>
      </main>
    </div>
  );
}
