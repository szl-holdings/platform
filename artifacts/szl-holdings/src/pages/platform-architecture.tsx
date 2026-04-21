import { useState } from "react";
import { m, AnimatePresence } from "framer-motion";
import { Layers, Eye, Anchor, Shield, BarChart3, Sparkles, ArrowRight, X } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";

const LOOP_STEPS = [
  {
    id: "detect",
    step: "01",
    label: "Detect",
    description: "Ingest signals from every operational surface — vessel AIS, workflow telemetry, distress property feeds, security events, business KPIs.",
    platforms: ["KORA", "SEXTANT", "PARAGON", "DOMAINE"],
    color: "hsl(190,90%,55%)",
    colorRgb: "14,188,212",
  },
  {
    id: "interpret",
    step: "02",
    label: "Interpret",
    description: "Contextualize raw signals with domain intelligence. Score risk, rank priority, map ownership. Alloy normalizes signals across all platforms into a shared entity model.",
    platforms: ["FORGE", "PARAGON", "DOMAINE"],
    color: "hsl(214,80%,65%)",
    colorRgb: "92,155,228",
  },
  {
    id: "decide",
    step: "03",
    label: "Decide",
    description: "Surface recommendations with confidence scores and explainable reasoning. Humans stay in the loop — every AI recommendation includes context and supporting evidence.",
    platforms: ["FORGE", "KORA", "SEXTANT"],
    color: "hsl(265,80%,60%)",
    colorRgb: "136,96,212",
  },
  {
    id: "execute",
    step: "04",
    label: "Execute",
    description: "Act through structured, auditable workflows. Alloy orchestrates multi-step execution with human approval gates, assignment logic, and traceable outputs.",
    platforms: ["FORGE", "Carlota Jo"],
    color: "hsl(38,55%,58%)",
    colorRgb: "191,152,82",
  },
  {
    id: "verify",
    step: "05",
    label: "Verify",
    description: "Close the loop. Every action is logged. Outcomes are compared against expected results. Deviations trigger re-classification. Audit trail is immutable.",
    platforms: ["FORGE", "PARAGON", "KORA"],
    color: "hsl(142,62%,48%)",
    colorRgb: "50,188,112",
  },
  {
    id: "discover",
    step: "06",
    label: "Discover",
    description: "Compound institutional knowledge. Patterns identified across cycles feed back into the detection layer. Every loop makes the system smarter.",
    platforms: ["FORGE", "DOMAINE", "SEXTANT"],
    color: "hsl(0,72%,55%)",
    colorRgb: "220,64,64",
  },
];

const PLATFORMS = [
  {
    name: "FORGE",
    role: "Execution Fabric",
    description: "The backbone of the SZL ecosystem. Alloy orchestrates workflows, normalizes signals, manages multi-agent execution, and provides the shared entity model that makes cross-platform intelligence possible.",
    accent: "hsl(214,80%,65%)",
    href: "/alloy/",
    icon: Layers,
    loopSteps: ["interpret", "decide", "execute", "verify", "discover"],
  },
  {
    name: "KORA",
    role: "Decision Intelligence",
    description: "Role-based visibility into risk, latency, ownership gaps, and workflow friction. Executive, operations, and delivery views that surface problems before they hit execution.",
    accent: "hsl(190,90%,55%)",
    href: "/command/operations/",
    icon: Eye,
    loopSteps: ["detect", "decide", "verify"],
  },
  {
    name: "SEXTANT",
    role: "Maritime Command",
    description: "Fleet visibility, voyage performance, and operational exception management. Connects vessel movement to operational consequence and commercial outcome.",
    accent: "hsl(205,85%,55%)",
    href: "/vessels/",
    icon: Anchor,
    loopSteps: ["detect", "decide", "discover"],
  },
  {
    name: "PARAGON",
    role: "Defense & Intelligence",
    description: "Unified security operations, managed services, and AI intelligence. SOC command, XDR, adversary emulation, MSP operations, and agentic cortex in one platform.",
    accent: "hsl(232,68%,60%)",
    href: "/aegis/",
    icon: Shield,
    loopSteps: ["detect", "interpret", "verify"],
  },
  {
    name: "DOMAINE",
    role: "Real Estate Intelligence",
    description: "Full-stack real estate command: distress engine, deal pipeline, market intelligence, ownership analysis, and NYC property data for serious operators.",
    accent: "hsl(88,42%,44%)",
    href: "/terra/",
    icon: BarChart3,
    loopSteps: ["detect", "interpret", "discover"],
  },
  {
    name: "Carlota Jo",
    role: "Private Advisory",
    description: "Estate management and residential operations for high-net-worth families. White-glove service delivery through a trust-based advisory framework.",
    accent: "hsl(38,55%,58%)",
    href: "/carlota-jo/",
    icon: Sparkles,
    loopSteps: ["execute"],
  },
];

export default function PlatformArchitecturePage() {
  const [activeStep, setActiveStep] = useState<string | null>(null);
  const [activePlatform, setActivePlatform] = useState<string | null>(null);

  const __pageMeta = usePageMeta({
    title: "Platform Architecture — SZL Holdings",
    description: "The SZL command loop: six platforms mapped to Detect, Interpret, Decide, Execute, Verify, and Discover. Interactive architecture diagram.",
    canonical: "https://szlholdings.com/architecture",
  });

  const selectedStep = LOOP_STEPS.find((s) => s.id === activeStep);
  const selectedPlatform = PLATFORMS.find((p) => p.name === activePlatform);
  const highlighted = activeStep
    ? PLATFORMS.filter((p) => p.loopSteps.includes(activeStep)).map((p) => p.name)
    : activePlatform
    ? PLATFORMS.find((p) => p.name === activePlatform)?.loopSteps.flatMap((sid) =>
        LOOP_STEPS.filter((s) => s.id === sid).map((s) => s.id)
      ) ?? []
    : [];

  const clearSelection = () => { setActiveStep(null); setActivePlatform(null); };

  return (
    <>
      {__pageMeta}
      <div style={{ minHeight: "100vh", background: "hsl(210,12%,5%)" }}>
        <SiteNav />
        <main className="pt-24">
          <section style={{ padding: "4rem 0 3rem" }}>
            <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
              <m.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>
                <p style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "hsl(210,5%,42%)", marginBottom: "0.75rem" }}>
                  Platform Architecture
                </p>
                <h1 style={{ fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 700, letterSpacing: "-0.025em", color: "hsl(38,12%,94%)", lineHeight: 1.08, marginBottom: "1rem" }}>
                  The Command Loop.
                </h1>
                <p style={{ fontSize: "1rem", lineHeight: 1.7, color: "hsl(210,5%,58%)", maxWidth: "40rem" }}>
                  Six platforms. One operational doctrine. Click any node or platform to explore how it maps to the command cycle.
                </p>
              </m.div>
            </div>
          </section>
  
          <section style={{ padding: "1rem 0 3rem" }}>
            <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 mb-8">
                {LOOP_STEPS.map((step, i) => {
                  const isActive = activeStep === step.id;
                  const isDimmed = activeStep && !isActive;
                  const isPlatformActive = activePlatform && highlighted.includes(step.id);
                  return (
                    <m.button
                      key={step.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: isDimmed ? 0.3 : 1, y: 0 }}
                      transition={{ duration: 0.35, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
                      onClick={() => { setActiveStep(isActive ? null : step.id); setActivePlatform(null); }}
                      style={{
                        padding: "1.25rem 1rem",
                        borderRadius: "10px",
                        background: isActive || isPlatformActive ? `rgba(${step.colorRgb}, 0.1)` : "hsla(0,0%,100%,0.025)",
                        border: isActive || isPlatformActive ? `1px solid rgba(${step.colorRgb}, 0.35)` : "1px solid hsla(0,0%,100%,0.06)",
                        textAlign: "left",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        boxShadow: isActive ? `0 0 20px rgba(${step.colorRgb}, 0.12)` : "none",
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) {
                          (e.currentTarget as HTMLElement).style.background = `rgba(${step.colorRgb}, 0.07)`;
                          (e.currentTarget as HTMLElement).style.borderColor = `rgba(${step.colorRgb}, 0.25)`;
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive && !isPlatformActive) {
                          (e.currentTarget as HTMLElement).style.background = "hsla(0,0%,100%,0.025)";
                          (e.currentTarget as HTMLElement).style.borderColor = "hsla(0,0%,100%,0.06)";
                        }
                      }}
                    >
                      <span style={{ display: "block", fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", color: step.color, marginBottom: "0.5rem", fontFamily: "monospace" }}>
                        {step.step}
                      </span>
                      <span style={{ display: "block", fontSize: "14px", fontWeight: 700, color: "hsl(38,12%,90%)", letterSpacing: "-0.008em", marginBottom: "0.375rem" }}>
                        {step.label}
                      </span>
                      <div style={{ display: "flex", gap: "0.25rem", flexWrap: "wrap" }}>
                        {step.platforms.map((pname) => (
                          <span key={pname} style={{
                            fontSize: "9px", fontWeight: 600, padding: "1px 5px",
                            borderRadius: "3px", background: "hsla(0,0%,100%,0.06)",
                            color: "hsl(210,5%,48%)", letterSpacing: "0.02em",
                          }}>{pname}</span>
                        ))}
                      </div>
                    </m.button>
                  );
                })}
              </div>
  
              <AnimatePresence>
                {selectedStep && (
                  <m.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    style={{ overflow: "hidden", marginBottom: "2rem" }}
                  >
                    <div style={{
                      padding: "1.5rem",
                      borderRadius: "12px",
                      background: `rgba(${selectedStep.colorRgb}, 0.06)`,
                      border: `1px solid rgba(${selectedStep.colorRgb}, 0.25)`,
                      display: "flex",
                      alignItems: "flex-start",
                      justifyContent: "space-between",
                      gap: "1rem",
                    }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.625rem" }}>
                          <span style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em", color: selectedStep.color, fontFamily: "monospace" }}>{selectedStep.step}</span>
                          <h3 style={{ fontSize: "1.125rem", fontWeight: 700, color: "hsl(38,12%,92%)", letterSpacing: "-0.015em" }}>{selectedStep.label}</h3>
                        </div>
                        <p style={{ fontSize: "0.9375rem", lineHeight: 1.65, color: "hsl(210,5%,60%)", maxWidth: "40rem" }}>
                          {selectedStep.description}
                        </p>
                      </div>
                      <button onClick={clearSelection} style={{ background: "transparent", border: "none", cursor: "pointer", color: "hsl(210,5%,42%)", flexShrink: 0, padding: "0.25rem" }}>
                        <X size={16} />
                      </button>
                    </div>
                  </m.div>
                )}
              </AnimatePresence>
  
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {PLATFORMS.map((platform, i) => {
                  const Icon = platform.icon;
                  const isActive = activePlatform === platform.name;
                  const isDimmed = activeStep
                    ? !highlighted.includes(platform.name)
                    : activePlatform
                    ? !isActive
                    : false;
  
                  return (
                    <m.button
                      key={platform.name}
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: isDimmed ? 0.25 : 1, y: 0 }}
                      transition={{ duration: 0.45, delay: 0.2 + i * 0.07, ease: [0.22, 1, 0.36, 1] }}
                      onClick={() => { setActivePlatform(isActive ? null : platform.name); setActiveStep(null); }}
                      style={{
                        padding: "1.5rem",
                        borderRadius: "12px",
                        background: isActive ? `${platform.accent}0d` : "hsla(0,0%,100%,0.025)",
                        border: isActive ? `1px solid ${platform.accent}40` : "1px solid hsla(0,0%,100%,0.06)",
                        textAlign: "left",
                        cursor: "pointer",
                        transition: "all 0.22s ease",
                        boxShadow: isActive ? `0 0 24px ${platform.accent}15` : "none",
                        width: "100%",
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) {
                          (e.currentTarget as HTMLElement).style.background = `${platform.accent}08`;
                          (e.currentTarget as HTMLElement).style.borderColor = `${platform.accent}28`;
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) {
                          (e.currentTarget as HTMLElement).style.background = "hsla(0,0%,100%,0.025)";
                          (e.currentTarget as HTMLElement).style.borderColor = "hsla(0,0%,100%,0.06)";
                        }
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem" }}>
                        <div style={{ width: "32px", height: "32px", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", background: `${platform.accent}12`, border: `1px solid ${platform.accent}20`, flexShrink: 0 }}>
                          <Icon size={15} style={{ color: platform.accent }} />
                        </div>
                        <div>
                          <p style={{ fontSize: "14px", fontWeight: 700, color: "hsl(38,12%,92%)", letterSpacing: "-0.008em" }}>{platform.name}</p>
                          <p style={{ fontSize: "11px", fontWeight: 500, color: platform.accent, letterSpacing: "0.01em" }}>{platform.role}</p>
                        </div>
                      </div>
                      <p style={{ fontSize: "12.5px", lineHeight: 1.6, color: "hsl(210,5%,52%)", marginBottom: "1rem" }}>
                        {platform.description}
                      </p>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.25rem", marginBottom: "0.75rem" }}>
                        {platform.loopSteps.map((sid) => {
                          const step = LOOP_STEPS.find((s) => s.id === sid);
                          if (!step) return null;
                          return (
                            <span key={sid} style={{
                              fontSize: "9.5px", fontWeight: 600, padding: "2px 7px",
                              borderRadius: "4px", background: `rgba(${step.colorRgb}, 0.10)`,
                              color: step.color, border: `1px solid rgba(${step.colorRgb}, 0.2)`,
                              letterSpacing: "0.02em",
                            }}>{step.label}</span>
                          );
                        })}
                      </div>
                      <a
                        href={platform.href}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          display: "inline-flex", alignItems: "center", gap: "4px",
                          fontSize: "11.5px", fontWeight: 600, color: platform.accent,
                          textDecoration: "none", letterSpacing: "-0.003em",
                        }}
                      >
                        Launch {platform.name} <ArrowRight size={11} strokeWidth={2.5} />
                      </a>
                    </m.button>
                  );
                })}
              </div>
  
              <AnimatePresence>
                {selectedPlatform && (
                  <m.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.3 }}
                    style={{ marginTop: "1.5rem" }}
                  >
                    <div style={{
                      padding: "1.25rem 1.5rem",
                      borderRadius: "10px",
                      background: "hsla(0,0%,100%,0.025)",
                      border: "1px solid hsla(0,0%,100%,0.06)",
                      display: "flex",
                      gap: "1rem",
                      alignItems: "center",
                      flexWrap: "wrap",
                    }}>
                      <p style={{ fontSize: "12px", color: "hsl(210,5%,50%)", flexShrink: 0 }}>
                        <strong style={{ color: "hsl(38,12%,82%)" }}>{selectedPlatform.name}</strong> participates in:
                      </p>
                      {selectedPlatform.loopSteps.map((sid) => {
                        const step = LOOP_STEPS.find((s) => s.id === sid);
                        if (!step) return null;
                        return (
                          <button
                            key={sid}
                            onClick={() => { setActiveStep(sid); setActivePlatform(null); }}
                            style={{
                              fontSize: "11px", fontWeight: 600, padding: "3px 10px",
                              borderRadius: "5px", background: `rgba(${step.colorRgb}, 0.1)`,
                              color: step.color, border: `1px solid rgba(${step.colorRgb}, 0.25)`,
                              cursor: "pointer", letterSpacing: "0.02em",
                            }}
                          >
                            {step.step} {step.label}
                          </button>
                        );
                      })}
                      <button onClick={clearSelection} style={{ marginLeft: "auto", background: "transparent", border: "none", cursor: "pointer", color: "hsl(210,5%,40%)" }}>
                        <X size={14} />
                      </button>
                    </div>
                  </m.div>
                )}
              </AnimatePresence>
            </div>
          </section>
  
          <section style={{ padding: "3rem 0 5rem", borderTop: "1px solid hsla(0,0%,100%,0.04)", background: "hsl(210,12%,6%)" }}>
            <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
              <p style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "hsl(210,5%,40%)", marginBottom: "1.25rem" }}>
                Shared Infrastructure
              </p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {[
                  { title: "Unified Entity Model", body: "All platforms share a canonical entity schema — vessels, properties, incidents, workflows — so cross-domain intelligence is structurally possible, not bolt-on." },
                  { title: "Alloy Signal Bus", body: "Every significant event in the ecosystem flows through Alloy's signal ingestion layer, normalized and enriched before routing to downstream platforms and agents." },
                  { title: "Human Approval Gates", body: "Every consequential action — command execution, credential changes, financial commits — requires explicit human confirmation. No autonomous execution without approval." },
                  { title: "Immutable Audit Log", body: "Every action, recommendation, and agent output is logged with actor, timestamp, and outcome. The audit trail is an operational tool, not a compliance afterthought." },
                  { title: "Role-Based Access", body: "Access is granted by explicit role assignment scoped to operational need. Executives see summaries; operators see queues; compliance sees audit trails." },
                  { title: "Compound Intelligence", body: "Patterns identified in one platform feed back into detection across the whole ecosystem. Each loop makes every platform sharper." },
                ].map((item, i) => (
                  <m.div
                    key={item.title}
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.45, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
                    style={{ padding: "1.25rem", borderRadius: "10px", background: "hsla(0,0%,100%,0.02)", border: "1px solid hsla(0,0%,100%,0.05)" }}
                  >
                    <p style={{ fontSize: "13px", fontWeight: 600, color: "hsl(38,12%,86%)", marginBottom: "0.4rem", letterSpacing: "-0.005em" }}>{item.title}</p>
                    <p style={{ fontSize: "12.5px", lineHeight: 1.6, color: "hsl(210,5%,52%)" }}>{item.body}</p>
                  </m.div>
                ))}
              </div>
            </div>
          </section>
        </main>
        <SiteFooter />
      </div>
        </>
  );
}
