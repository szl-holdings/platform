import { useEffect, useRef } from "react";
import { m } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Link } from "wouter";

const platforms = [
  { name: "SZL Holdings", role: "Ecosystem", color: "hsl(210,10%,60%)" },
  { name: "Alloy", role: "Intelligence Layer", color: "hsl(214,80%,65%)" },
  { name: "Lyte", role: "Business Observability", color: "hsl(190,90%,55%)" },
  { name: "Vessels", role: "Maritime Command", color: "hsl(205,85%,55%)" },
  { name: "Firestorm", role: "Cyber Defense", color: "hsl(0,80%,55%)" },
  { name: "INCA", role: "AI Research Cortex", color: "hsl(265,80%,60%)" },
  { name: "Nimbus", role: "Predictive Intelligence", color: "hsl(270,70%,55%)" },
  { name: "Terra", role: "Business Telemetry", color: "hsl(160,70%,45%)" },
  { name: "Rosie", role: "Threat & Incident Ops", color: "hsl(215,80%,55%)" },
  { name: "Carlota Jo", role: "High-Trust Advisory", color: "hsl(38,55%,58%)" },
];

function HeroParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let animFrame: number;
    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
    resize();
    window.addEventListener("resize", resize);
    const pts: Array<{ x: number; y: number; vx: number; vy: number; r: number; opacity: number }> = [];
    for (let i = 0; i < 55; i++) {
      pts.push({
        x: Math.random() * canvas.width, y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.18, vy: (Math.random() - 0.5) * 0.18,
        r: Math.random() * 1.2 + 0.3, opacity: Math.random() * 0.25 + 0.06,
      });
    }
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      pts.forEach((p) => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
      });
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 110) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(148,163,184,${0.06 * (1 - d / 110)})`;
            ctx.lineWidth = 0.5;
            ctx.moveTo(pts[i].x, pts[i].y);
            ctx.lineTo(pts[j].x, pts[j].y);
            ctx.stroke();
          }
        }
        ctx.beginPath();
        ctx.arc(pts[i].x, pts[i].y, pts[i].r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(148,163,184,${pts[i].opacity})`;
        ctx.fill();
      }
      animFrame = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(animFrame); window.removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.6 }} aria-hidden="true" />;
}

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden pt-[72px]" style={{ background: "hsl(210,12%,5%)" }}>
      <HeroParticles />
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true" style={{
        background: "radial-gradient(ellipse at 60% 35%, hsla(210,40%,25%,0.07) 0%, transparent 60%), radial-gradient(ellipse at 25% 75%, hsla(32,30%,20%,0.05) 0%, transparent 55%)",
      }} />
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true" style={{
        backgroundImage: "linear-gradient(hsla(0,0%,100%,0.018) 1px, transparent 1px), linear-gradient(90deg, hsla(0,0%,100%,0.018) 1px, transparent 1px)",
        backgroundSize: "72px 72px",
        maskImage: "radial-gradient(ellipse 80% 60% at 50% 40%, black 0%, transparent 100%)",
      }} />

      <div className="relative z-10 w-full max-w-[1280px] mx-auto px-6 lg:px-10 py-20 lg:py-32">
        <div className="grid lg:grid-cols-[1fr,420px] gap-16 lg:gap-24 items-center">
          <div>
            <m.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="mb-8">
              <span style={{
                display: "inline-flex", alignItems: "center", gap: "8px",
                padding: "4px 12px 4px 8px", borderRadius: "4px",
                background: "hsla(0,0%,100%,0.035)", border: "1px solid hsla(0,0%,100%,0.08)",
                color: "hsl(210,5%,52%)", fontSize: "10px", fontWeight: "600",
                letterSpacing: "0.1em", textTransform: "uppercase",
                fontFamily: "'Space Grotesk', 'Inter', system-ui, sans-serif",
              }}>
                <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "hsl(190,80%,52%)", display: "inline-block", boxShadow: "0 0 6px hsla(190,80%,52%,0.5)" }} />
                Premium Command Systems
              </span>
            </m.div>

            <m.h1
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.72, delay: 0.2 }}
              style={{
                fontSize: "clamp(2.5rem, 5vw, 4rem)", fontWeight: "700",
                letterSpacing: "-0.032em", lineHeight: "1.04",
                color: "hsl(38,12%,94%)", marginBottom: "1.5rem",
                fontFamily: "'Space Grotesk', 'Inter', system-ui, sans-serif",
              }}
            >
              Visibility. Execution. Advantage.
            </m.h1>

            <m.p
              initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.35 }}
              style={{ color: "hsl(210,5%,58%)", fontSize: "1.0625rem", lineHeight: "1.68", maxWidth: "30rem", marginBottom: "2.5rem" }}
            >
              The holding company behind Alloy, Lyte, Vessels, Firestorm, INCA, Nimbus, Terra, and a portfolio of high-trust operating brands.
            </m.p>

            <m.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.5 }} className="flex flex-col sm:flex-row items-start gap-4">
              <Link
                href="/ecosystem"
                className="group flex items-center gap-2"
                style={{
                  padding: "0.7rem 1.625rem", borderRadius: "4px",
                  fontSize: "13.5px", fontWeight: "600", textDecoration: "none",
                  letterSpacing: "-0.005em", color: "hsl(210,12%,6%)",
                  background: "hsl(210,8%,84%)", border: "1px solid transparent",
                  transition: "all 0.2s ease", display: "inline-flex",
                  alignItems: "center", gap: "8px",
                  fontFamily: "'Space Grotesk', 'Inter', system-ui, sans-serif",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "hsl(38,15%,96%)";
                  (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 16px hsla(0,0%,0%,0.32)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "hsl(210,8%,84%)";
                  (e.currentTarget as HTMLElement).style.boxShadow = "none";
                }}
              >
                Explore the Ecosystem <ArrowRight size={14} strokeWidth={2.5} />
              </Link>
              <Link
                href="/founder"
                style={{
                  display: "inline-flex", alignItems: "center", gap: "5px",
                  fontSize: "12.5px", fontWeight: "500", textDecoration: "none",
                  color: "hsl(210,5%,46%)", transition: "color 0.18s ease",
                  fontFamily: "'Space Grotesk', 'Inter', system-ui, sans-serif",
                  padding: "0.7rem 0",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "hsl(210,5%,68%)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "hsl(210,5%,46%)"; }}
              >
                Meet the Founder <ArrowRight size={12} strokeWidth={2} />
              </Link>
            </m.div>

            <m.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.7 }}
              className="flex flex-wrap gap-8 sm:gap-10 mt-10 sm:mt-14"
            >
              {[
                { value: "8", label: "Platforms Live" },
                { value: "1", label: "Unified Architecture" },
                { value: "5+", label: "Years Operating" },
              ].map((stat) => (
                <div key={stat.label} className="flex flex-col">
                  <span style={{
                    fontSize: "clamp(1.75rem, 2.5vw, 2.25rem)", fontWeight: "700",
                    color: "hsl(190,90%,55%)", fontFamily: "'Space Grotesk', 'Inter', system-ui, sans-serif",
                    letterSpacing: "-0.03em", lineHeight: "1",
                  }}>{stat.value}</span>
                  <span style={{
                    fontSize: "10px", letterSpacing: "0.12em", textTransform: "uppercase",
                    color: "hsl(210,5%,38%)", marginTop: "0.4rem",
                    fontFamily: "'Space Grotesk', 'Inter', system-ui, sans-serif", fontWeight: "600",
                  }}>{stat.label}</span>
                </div>
              ))}
            </m.div>
          </div>

          <m.div
            initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="hidden lg:block"
          >
            <div style={{
              background: "hsla(210,12%,9%,0.65)",
              border: "1px solid hsla(0,0%,100%,0.08)",
              borderTop: "1px solid hsla(0,0%,100%,0.12)",
              borderRadius: "8px", padding: "1.5rem",
              boxShadow: "0 16px 48px hsla(0,0%,0%,0.48), inset 0 1px 0 hsla(0,0%,100%,0.05)",
              backdropFilter: "blur(12px)",
            }}>
              <div className="flex items-center justify-between mb-4">
                <span style={{
                  fontSize: "10px", fontWeight: "600", letterSpacing: "0.1em",
                  textTransform: "uppercase", color: "hsl(210,5%,42%)",
                  fontFamily: "'Space Grotesk', 'Inter', system-ui, sans-serif",
                }}>Ecosystem</span>
                <span style={{
                  fontSize: "10px", color: "hsl(210,5%,36%)", fontWeight: "500",
                  letterSpacing: "0.04em", fontFamily: "'JetBrains Mono', 'Space Mono', monospace",
                }}>10 operating brands</span>
              </div>
              <div style={{ height: "1px", background: "hsla(0,0%,100%,0.05)", marginBottom: "0.75rem" }} />
              <div className="space-y-1.5">
                {platforms.map((p, i) => (
                  <m.div
                    key={p.name}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.5 + i * 0.05 }}
                    className="flex items-center gap-2.5 py-1"
                  >
                    <div style={{
                      width: "5px", height: "5px", borderRadius: "50%",
                      background: p.color, flexShrink: 0, boxShadow: `0 0 5px ${p.color}60`,
                    }} />
                    <span style={{ fontSize: "11px", fontWeight: "600", color: "hsl(210,5%,68%)", letterSpacing: "-0.003em" }}>{p.name}</span>
                    <span style={{
                      fontSize: "10px", color: "hsl(210,5%,38%)", marginLeft: "auto",
                      fontFamily: "'JetBrains Mono', 'Space Mono', monospace", letterSpacing: "-0.003em",
                    }}>{p.role}</span>
                  </m.div>
                ))}
              </div>
            </div>
          </m.div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent, hsla(0,0%,100%,0.05), transparent)" }} aria-hidden="true" />
    </section>
  );
}
