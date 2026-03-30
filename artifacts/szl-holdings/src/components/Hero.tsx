import { m } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Link } from "wouter";

const platforms = [
  { name: "SZL Holdings", role: "Ecosystem", color: "hsl(210,10%,60%)" },
  { name: "Alloy", role: "Intelligence Layer", color: "hsl(214,80%,65%)" },
  { name: "Lyte", role: "Business Observability", color: "hsl(190,90%,55%)" },
  { name: "Vessels", role: "Maritime Command", color: "hsl(205,85%,55%)" },
  { name: "Carlota Jo", role: "High-Trust Service", color: "hsl(38,45%,65%)" },
];

const nodePositions = [
  { x: 50, y: 18 },
  { x: 22, y: 42 }, { x: 78, y: 42 },
  { x: 12, y: 72 }, { x: 50, y: 72 }, { x: 88, y: 72 },
];

const connections = [
  [0, 1], [0, 2], [1, 3], [1, 4], [2, 4], [2, 5],
];

const nodeColors = [
  "hsl(210,10%,60%)",
  "hsl(214,80%,65%)",
  "hsl(190,90%,55%)",
  "hsl(38,45%,65%)",
  "hsl(205,85%,55%)",
  "hsl(38,45%,65%)",
];

function EcosystemDiagram() {
  return (
    <div className="relative w-full" style={{ aspectRatio: "16/9", maxWidth: "440px" }}>
      <svg
        viewBox="0 0 100 65"
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
            stroke="hsla(214,50%,60%,0.15)"
            strokeWidth="0.5"
            initial={{ opacity: 0, pathLength: 0 }}
            animate={{ opacity: 1, pathLength: 1 }}
            transition={{ duration: 1.2, delay: 0.6 + i * 0.1, ease: [0.22, 1, 0.36, 1] }}
          />
        ))}
        {nodePositions.map((pos, i) => (
          <m.g
            key={i}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.4 + i * 0.12, ease: [0.22, 1, 0.36, 1] }}
            style={{ transformOrigin: `${pos.x}% ${pos.y}%` }}
          >
            <circle cx={pos.x} cy={pos.y} r={i === 0 ? 4.5 : 3.2} fill={`${nodeColors[i]}15`} stroke={`${nodeColors[i]}40`} strokeWidth="0.5" />
            <circle cx={pos.x} cy={pos.y} r={i === 0 ? 1.8 : 1.2} fill={nodeColors[i]} opacity="0.9" />
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
          background: "radial-gradient(ellipse at 60% 35%, hsla(210,40%,25%,0.06) 0%, transparent 60%), radial-gradient(ellipse at 25% 75%, hsla(32,30%,20%,0.04) 0%, transparent 55%)",
        }}
      />
      <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent, hsla(0,0%,100%,0.05), transparent)" }} aria-hidden="true" />

      <div className="relative z-10 max-w-[1280px] mx-auto px-6 lg:px-10 py-20 lg:py-32">
        <div className="grid lg:grid-cols-[1fr,420px] gap-16 lg:gap-24 items-center">
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
                <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "hsl(210,10%,60%)", display: "inline-block" }} />
                Premium Command Systems
              </span>
            </m.div>

            <m.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.72, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              style={{
                fontSize: "clamp(2.25rem, 4.5vw, 3.5rem)",
                fontWeight: "700",
                letterSpacing: "-0.027em",
                lineHeight: "1.06",
                color: "hsl(38,12%,94%)",
                marginBottom: "1.5rem",
              }}
            >
              Building premium command systems across observability, operations, and specialized platforms.
            </m.h1>

            <m.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
              style={{
                color: "hsl(210,5%,60%)",
                fontSize: "1.0625rem",
                lineHeight: "1.65",
                maxWidth: "30rem",
                marginBottom: "1rem",
              }}
            >
              SZL Holdings is the ecosystem behind Alloy, Lyte, Vessels, and high-trust operating brands designed to turn visibility into action and execution into advantage.
            </m.p>

            <m.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.42, ease: [0.22, 1, 0.36, 1] }}
              style={{
                color: "hsl(210,5%,44%)",
                fontSize: "0.875rem",
                letterSpacing: "0.02em",
                marginBottom: "2.5rem",
              }}
            >
              One ecosystem. One operating philosophy. Multiple command surfaces.
            </m.p>

            <m.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col sm:flex-row items-start gap-3"
            >
              <Link
                href="/ecosystem"
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
                Explore the Ecosystem
                <ArrowRight size={14} strokeWidth={2.5} />
              </Link>
              <Link
                href="/founder"
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
                Meet the Founder
              </Link>
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
                <span style={{ fontSize: "11px", fontWeight: "500", letterSpacing: "0.08em", textTransform: "uppercase", color: "hsl(210,5%,46%)" }}>Ecosystem</span>
                <span style={{ fontSize: "11px", color: "hsl(210,5%,40%)", fontWeight: "500", letterSpacing: "0.04em" }}>One engine. Two flagships.</span>
              </div>
              <EcosystemDiagram />
              <div style={{ height: "1px", background: "hsla(0,0%,100%,0.05)", margin: "1.25rem 0" }} />
              <div className="space-y-2">
                {platforms.map((p) => (
                  <div key={p.name} className="flex items-center gap-2.5">
                    <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: p.color, flexShrink: 0 }} />
                    <span style={{ fontSize: "11px", fontWeight: "600", color: "hsl(210,5%,70%)", letterSpacing: "-0.003em" }}>{p.name}</span>
                    <span style={{ fontSize: "11px", color: "hsl(210,5%,40%)", letterSpacing: "-0.003em", marginLeft: "auto" }}>{p.role}</span>
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
