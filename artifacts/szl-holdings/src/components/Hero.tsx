import { m } from "framer-motion";
import { ArrowRight } from "lucide-react";

const platforms = [
  { name: "Lyte", category: "Business Observability", status: "live", color: "hsl(192,70%,46%)" },
  { name: "Vessels", category: "Maritime Intelligence", status: "live", color: "hsl(208,65%,48%)" },
  { name: "INCA", category: "AI Research Platform", status: "live", color: "hsl(246,45%,60%)" },
  { name: "Alloy", category: "AI Command Center", status: "live", color: "hsl(218,50%,62%)" },
  { name: "Carlota Jo", category: "Strategic Advisory", status: "live", color: "hsl(32,38%,58%)" },
  { name: "Firestorm", category: "Security Simulation", status: "live", color: "hsl(28,78%,56%)" },
];

const nodePositions = [
  { x: 20, y: 30 }, { x: 50, y: 15 }, { x: 80, y: 32 },
  { x: 15, y: 65 }, { x: 50, y: 80 }, { x: 82, y: 68 },
];

const connections = [
  [0, 1], [1, 2], [0, 3], [1, 4], [2, 5], [3, 4], [4, 5], [1, 3],
];

function EcosystemMap() {
  const colors = ["hsl(192,70%,46%)", "hsl(208,65%,48%)", "hsl(246,45%,60%)", "hsl(218,50%,62%)", "hsl(32,38%,58%)", "hsl(28,78%,56%)"];

  return (
    <div className="relative w-full" style={{ aspectRatio: "16/7", maxWidth: "480px" }}>
      <svg
        viewBox="0 0 100 60"
        className="absolute inset-0 w-full h-full"
        style={{ overflow: "visible" }}
        aria-hidden="true"
      >
        {connections.map(([a, b], i) => (
          <m.line
            key={i}
            x1={nodePositions[a].x}
            y1={nodePositions[a].y}
            x2={nodePositions[b].x}
            y2={nodePositions[b].y}
            stroke="hsla(0,0%,100%,0.06)"
            strokeWidth="0.4"
            initial={{ opacity: 0, pathLength: 0 }}
            animate={{ opacity: 1, pathLength: 1 }}
            transition={{ duration: 1.2, delay: 0.8 + i * 0.1, ease: [0.22, 1, 0.36, 1] }}
          />
        ))}
        {nodePositions.map((pos, i) => (
          <m.g key={i} initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: 0.6 + i * 0.1, ease: [0.22, 1, 0.36, 1] }} style={{ transformOrigin: `${pos.x}% ${pos.y}%` }}>
            <circle cx={pos.x} cy={pos.y} r="2.8" fill={`${colors[i]}22`} stroke={`${colors[i]}55`} strokeWidth="0.5" />
            <circle cx={pos.x} cy={pos.y} r="1.1" fill={colors[i]} opacity="0.85" />
          </m.g>
        ))}
      </svg>
    </div>
  );
}

export function Hero() {
  return (
    <section
      className="relative min-h-screen flex items-center overflow-hidden pt-[60px]"
      style={{ background: "hsl(210,12%,5%)" }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
        style={{
          background: "radial-gradient(ellipse at 65% 40%, hsla(210,50%,30%,0.05) 0%, transparent 60%), radial-gradient(ellipse at 30% 70%, hsla(32,40%,30%,0.03) 0%, transparent 55%)",
        }}
      />

      <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent, hsla(0,0%,100%,0.05), transparent)" }} aria-hidden="true" />

      <div className="relative z-10 max-w-[1280px] mx-auto px-6 lg:px-10 py-20 lg:py-32">
        <div className="grid lg:grid-cols-[1fr,440px] gap-16 lg:gap-24 items-center">
          <div>
            <m.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="mb-8"
            >
              <span style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "4px 12px",
                borderRadius: "6px",
                background: "hsla(0,0%,100%,0.04)",
                border: "1px solid hsla(0,0%,100%,0.08)",
                color: "hsl(210,5%,52%)",
                fontSize: "11px",
                fontWeight: "500",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}>
                <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "hsl(152,50%,42%)", display: "inline-block" }} />
                Strategic Technology Portfolio
              </span>
            </m.div>

            <m.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.72, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              style={{
                fontSize: "clamp(2.5rem, 5vw, 3.875rem)",
                fontWeight: "700",
                letterSpacing: "-0.027em",
                lineHeight: "1.05",
                color: "hsl(38,12%,94%)",
                marginBottom: "1.5rem",
              }}
            >
              One holding company.
              <br />
              <span style={{
                background: "linear-gradient(135deg, hsl(210,10%,72%), hsl(32,40%,66%))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}>
                Six frontier platforms.
              </span>
            </m.h1>

            <m.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
              style={{
                color: "hsl(210,5%,60%)",
                fontSize: "1.0625rem",
                lineHeight: "1.65",
                maxWidth: "28rem",
                marginBottom: "2.5rem",
              }}
            >
              SZL Holdings builds and operates technology companies at the intersection of maritime intelligence, AI, and enterprise operations. Each platform commands its vertical. All of them compound.
            </m.p>

            <m.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.48, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col sm:flex-row items-start gap-3"
            >
              <a
                href="#portfolio"
                className="group flex items-center gap-2"
                style={{
                  padding: "0.625rem 1.375rem",
                  borderRadius: "6px",
                  fontSize: "13.5px",
                  fontWeight: "600",
                  textDecoration: "none",
                  letterSpacing: "-0.005em",
                  color: "hsl(210,12%,6%)",
                  background: "hsl(210,8%,84%)",
                  border: "1px solid transparent",
                  transition: "all 0.2s ease",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "hsl(38,15%,96%)";
                  (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 16px hsla(0,0%,0%,0.28)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "hsl(210,8%,84%)";
                  (e.currentTarget as HTMLElement).style.boxShadow = "none";
                }}
              >
                Explore the ecosystem
                <ArrowRight size={14} strokeWidth={2.5} />
              </a>
              <a
                href="#contact"
                style={{
                  padding: "0.625rem 1.375rem",
                  borderRadius: "6px",
                  fontSize: "13.5px",
                  fontWeight: "500",
                  textDecoration: "none",
                  letterSpacing: "-0.005em",
                  color: "hsl(210,5%,60%)",
                  background: "transparent",
                  border: "1px solid hsla(0,0%,100%,0.08)",
                  transition: "all 0.2s ease",
                  display: "inline-flex",
                  alignItems: "center",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.color = "hsl(38,12%,94%)";
                  (e.currentTarget as HTMLElement).style.borderColor = "hsla(0,0%,100%,0.14)";
                  (e.currentTarget as HTMLElement).style.background = "hsla(0,0%,100%,0.03)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.color = "hsl(210,5%,60%)";
                  (e.currentTarget as HTMLElement).style.borderColor = "hsla(0,0%,100%,0.08)";
                  (e.currentTarget as HTMLElement).style.background = "transparent";
                }}
              >
                Start a conversation
              </a>
            </m.div>
          </div>

          <m.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="hidden lg:block"
          >
            <div style={{
              background: "hsla(210,12%,10%,0.50)",
              border: "1px solid hsla(0,0%,100%,0.07)",
              borderRadius: "1rem",
              padding: "1.75rem",
              boxShadow: "0 8px 32px hsla(0,0%,0%,0.38)",
            }}>
              <div className="flex items-center justify-between mb-5">
                <span style={{ fontSize: "11px", fontWeight: "500", letterSpacing: "0.08em", textTransform: "uppercase", color: "hsl(210,5%,46%)" }}>Ecosystem Map</span>
                <span style={{ fontSize: "11px", color: "hsl(152,50%,42%)", fontWeight: "500", letterSpacing: "0.04em" }}>6 platforms live</span>
              </div>
              <EcosystemMap />
              <div style={{ height: "1px", background: "hsla(0,0%,100%,0.05)", margin: "1.25rem 0" }} />
              <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
                {platforms.map((p) => (
                  <div key={p.name} className="flex items-center gap-2">
                    <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: p.color, flexShrink: 0 }} />
                    <span style={{ fontSize: "12px", fontWeight: "500", color: "hsl(210,5%,68%)", letterSpacing: "-0.003em" }}>{p.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </m.div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent, hsla(0,0%,100%,0.04), transparent)" }} aria-hidden="true" />
    </section>
  );
}
