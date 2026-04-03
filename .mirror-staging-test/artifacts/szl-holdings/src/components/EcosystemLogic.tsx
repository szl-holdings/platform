import { useState } from "react";
import { m } from "framer-motion";

const stages = [
  {
    id: "observe",
    label: "Observe",
    tagline: "Surface signals before they become problems",
    color: "hsl(190,90%,55%)",
    rgb: "14,201,224",
    number: "01",
    platform: "Lyte",
    desc: "Lyte ingests operational data — approvals, ownership, workflow state — and surfaces anomalies, latency events, and risk before they compound. You see what's actually happening across your business.",
  },
  {
    id: "understand",
    label: "Understand",
    tagline: "Turn signals into structured intelligence",
    color: "hsl(214,80%,65%)",
    rgb: "92,155,228",
    number: "02",
    platform: "Lyte + Alloy Engine",
    desc: "The Alloy execution engine normalizes raw signal across platforms and applies reasoning to classify, contextualize, and connect events. Pattern recognition separates noise from consequence.",
  },
  {
    id: "execute",
    label: "Execute",
    tagline: "Route decisions and actions precisely",
    color: "hsl(205,85%,55%)",
    rgb: "38,164,218",
    number: "03",
    platform: "Vessels + Alloy Engine",
    desc: "The Alloy engine orchestrates multi-step workflows — routing tasks, triggering actions, escalating decisions — while Vessels commands maritime execution with the same precision applied to fleet operations.",
  },
  {
    id: "advise",
    label: "Advise",
    tagline: "High-trust support when execution demands precision",
    color: "hsl(38,55%,58%)",
    rgb: "191,152,82",
    number: "04",
    platform: "Carlota Jo",
    desc: "Carlota Jo delivers white-glove operational and residence support — the human layer that activates when execution demands discreet, structured, high-consequence precision.",
  },
];

export function EcosystemLogic() {
  const [active, setActive] = useState<string>("observe");
  const activeStage = stages.find((s) => s.id === active) || stages[0];

  return (
    <section
      id="ecosystem"
      style={{
        padding: "6rem 0",
        background: "hsl(210,12%,6%)",
        borderTop: "1px solid hsla(0,0%,100%,0.04)",
      }}
    >
      <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
        <m.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mb-10"
        >
          <p style={{
            fontSize: "10px",
            fontWeight: "600",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "hsl(210,5%,40%)",
            marginBottom: "0.75rem",
            fontFamily: "'Space Grotesk', 'Inter', system-ui, sans-serif",
          }}>
            How the Ecosystem Works
          </p>
          <h2 style={{
            fontSize: "clamp(1.75rem, 3vw, 2.5rem)",
            fontWeight: "700",
            letterSpacing: "-0.026em",
            color: "hsl(38,12%,94%)",
            lineHeight: "1.06",
            fontFamily: "'Space Grotesk', 'Inter', system-ui, sans-serif",
          }}>
            One discipline. Every command surface.
          </h2>
        </m.div>

        <div className="grid lg:grid-cols-[1fr,420px] gap-8 lg:gap-12 items-start">
          <div>
            <div className="flex flex-col sm:flex-row gap-2.5 mb-6">
              {stages.map((stage) => {
                const isActive = active === stage.id;
                return (
                  <button
                    key={stage.id}
                    onClick={() => setActive(stage.id)}
                    style={{
                      flex: 1,
                      padding: "0.875rem 1rem",
                      borderRadius: "4px",
                      border: `1px solid ${isActive ? `rgba(${stage.rgb}, 0.32)` : "hsla(0,0%,100%,0.07)"}`,
                      background: isActive ? `rgba(${stage.rgb}, 0.08)` : "hsla(0,0%,100%,0.02)",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      textAlign: "left",
                      boxShadow: isActive ? `0 0 16px rgba(${stage.rgb}, 0.12)` : "none",
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        const el = e.currentTarget as HTMLElement;
                        el.style.background = "hsla(0,0%,100%,0.04)";
                        el.style.borderColor = `rgba(${stage.rgb}, 0.18)`;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        const el = e.currentTarget as HTMLElement;
                        el.style.background = "hsla(0,0%,100%,0.02)";
                        el.style.borderColor = "hsla(0,0%,100%,0.07)";
                      }
                    }}
                  >
                    <div style={{
                      fontSize: "9.5px",
                      fontWeight: "600",
                      letterSpacing: "0.1em",
                      color: isActive ? stage.color : "hsl(210,5%,38%)",
                      fontFamily: "'JetBrains Mono', 'Space Mono', monospace",
                      marginBottom: "0.3rem",
                      transition: "color 0.2s ease",
                    }}>
                      {stage.number}
                    </div>
                    <div style={{
                      fontSize: "13px",
                      fontWeight: "700",
                      color: isActive ? "hsl(38,12%,92%)" : "hsl(210,5%,58%)",
                      fontFamily: "'Space Grotesk', 'Inter', system-ui, sans-serif",
                      letterSpacing: "-0.005em",
                      transition: "color 0.2s ease",
                    }}>
                      {stage.label}
                    </div>
                  </button>
                );
              })}
            </div>

            <m.div
              key={active}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              style={{
                padding: "1.75rem",
                borderRadius: "4px",
                background: `rgba(${activeStage.rgb}, 0.04)`,
                border: `1px solid rgba(${activeStage.rgb}, 0.14)`,
                borderLeft: `3px solid ${activeStage.color}`,
              }}
            >
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "0.625rem",
                marginBottom: "0.875rem",
              }}>
                <span style={{
                  fontSize: "10px",
                  fontWeight: "600",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: activeStage.color,
                  fontFamily: "'JetBrains Mono', 'Space Mono', monospace",
                }}>
                  {activeStage.platform}
                </span>
                <span style={{ fontSize: "10px", color: "hsl(210,5%,36%)", letterSpacing: "0.04em" }}>·</span>
                <span style={{
                  fontSize: "12px",
                  color: "hsl(210,5%,52%)",
                  fontStyle: "italic",
                }}>
                  {activeStage.tagline}
                </span>
              </div>
              <p style={{
                fontSize: "0.9375rem",
                lineHeight: "1.72",
                color: "hsl(210,5%,62%)",
              }}>
                {activeStage.desc}
              </p>
            </m.div>
          </div>

          <m.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            <p style={{
              fontSize: "10px",
              fontWeight: "600",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "hsl(210,5%,38%)",
              marginBottom: "0.875rem",
              fontFamily: "'Space Grotesk', 'Inter', system-ui, sans-serif",
            }}>
              Operating Discipline
            </p>
            <p style={{
              fontSize: "0.9375rem",
              lineHeight: "1.7",
              color: "hsl(210,5%,56%)",
              marginBottom: "1.5rem",
              maxWidth: "28rem",
            }}>
              Together, they form one disciplined ecosystem built around visibility, action, and premium execution.
            </p>

            <div className="space-y-2.5">
              {[
                { entity: "Lyte", role: "Business observability. Surfaces risk before it hits execution.", accent: "hsl(190,90%,55%)", accentRgb: "14,201,224" },
                { entity: "Vessels", role: "Maritime command. Fleet intelligence in one layer.", accent: "hsl(205,85%,55%)", accentRgb: "38,164,218" },
                { entity: "Aegis", role: "Unified defense & intelligence. SOC, managed ops, and AI research in one platform.", accent: "hsl(232,68%,60%)", accentRgb: "92,102,204" },
                { entity: "Terra", role: "Real estate intelligence. Portfolio tracking and deal pipeline.", accent: "hsl(160,70%,45%)", accentRgb: "34,168,120" },
                { entity: "Carlota Jo", role: "Private advisory. High-trust execution support.", accent: "hsl(38,55%,58%)", accentRgb: "191,152,82" },
              ].map((tier, i) => (
                <m.div
                  key={tier.entity}
                  initial={{ opacity: 0, x: 12 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.3 + i * 0.06, ease: [0.22, 1, 0.36, 1] }}
                  style={{
                    display: "flex",
                    gap: "0.875rem",
                    padding: "0.875rem 1.125rem",
                    borderRadius: "4px",
                    background: "hsla(0,0%,100%,0.02)",
                    border: "1px solid hsla(0,0%,100%,0.055)",
                    transition: "all 0.2s ease",
                    cursor: "default",
                  }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.background = `rgba(${tier.accentRgb}, 0.05)`;
                    el.style.borderColor = `rgba(${tier.accentRgb}, 0.18)`;
                    el.style.boxShadow = `0 0 14px rgba(${tier.accentRgb}, 0.06)`;
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.background = "hsla(0,0%,100%,0.02)";
                    el.style.borderColor = "hsla(0,0%,100%,0.055)";
                    el.style.boxShadow = "none";
                  }}
                >
                  <div style={{
                    width: "3px",
                    borderRadius: "2px",
                    background: tier.accent,
                    flexShrink: 0,
                    opacity: 0.75,
                    boxShadow: `0 0 6px ${tier.accent}50`,
                  }} />
                  <div>
                    <p style={{
                      fontSize: "12px",
                      fontWeight: "600",
                      color: "hsl(38,12%,88%)",
                      marginBottom: "0.15rem",
                      letterSpacing: "-0.005em",
                      fontFamily: "'Space Grotesk', 'Inter', system-ui, sans-serif",
                    }}>
                      {tier.entity}
                    </p>
                    <p style={{ fontSize: "11.5px", lineHeight: "1.5", color: "hsl(210,5%,50%)" }}>
                      {tier.role}
                    </p>
                  </div>
                </m.div>
              ))}
            </div>
          </m.div>
        </div>
      </div>
    </section>
  );
}
