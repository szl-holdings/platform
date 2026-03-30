import { useEffect, useRef } from "react";
import { m } from "framer-motion";
import { ArrowRight, Layers, Shield, Anchor, Cpu, BarChart3, Eye, Users, Sparkles } from "lucide-react";
import { Link } from "wouter";

const platforms = [
  { name: "Lyte", role: "Business Observability", icon: Eye, color: "hsl(190,90%,55%)", glow: "190,90%,55%" },
  { name: "Vessels", role: "Maritime Command", icon: Anchor, color: "hsl(205,85%,55%)", glow: "205,85%,55%" },
  { name: "Firestorm", role: "Cyber Defense", icon: Shield, color: "hsl(0,80%,55%)", glow: "0,80%,55%" },
  { name: "INCA", role: "AI Research", icon: Cpu, color: "hsl(265,80%,60%)", glow: "265,80%,60%" },
  { name: "Alloy", role: "Intelligence Engine", icon: Layers, color: "hsl(214,80%,65%)", glow: "214,80%,65%" },
  { name: "Terra", role: "Business Telemetry", icon: BarChart3, color: "hsl(160,70%,45%)", glow: "160,70%,45%" },
  { name: "Rosie", role: "Incident Command", icon: Users, color: "hsl(215,80%,55%)", glow: "215,80%,55%" },
  { name: "Carlota Jo", role: "Private Advisory", icon: Sparkles, color: "hsl(38,55%,58%)", glow: "38,55%,58%" },
];

function HeroMesh() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let animFrame: number;
    let time = 0;
    const resize = () => { canvas.width = canvas.offsetWidth * 1.5; canvas.height = canvas.offsetHeight * 1.5; };
    resize();
    window.addEventListener("resize", resize);
    const draw = () => {
      if (document.hidden) { animFrame = requestAnimationFrame(draw); return; }
      time += 0.002;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const cols = 40, rows = 25;
      const cellW = canvas.width / cols, cellH = canvas.height / rows;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = c * cellW + cellW / 2;
          const y = r * cellH + cellH / 2;
          const cx1 = canvas.width * 0.7, cy1 = canvas.height * 0.3;
          const cx2 = canvas.width * 0.2, cy2 = canvas.height * 0.7;
          const d1 = Math.sqrt((x - cx1) ** 2 + (y - cy1) ** 2);
          const d2 = Math.sqrt((x - cx2) ** 2 + (y - cy2) ** 2);
          const wave1 = Math.sin(d1 * 0.008 + time * 1.2) * 0.5 + 0.5;
          const wave2 = Math.sin(d2 * 0.006 - time * 0.8) * 0.5 + 0.5;
          const intensity = (wave1 * 0.6 + wave2 * 0.4);
          ctx.beginPath();
          ctx.arc(x, y, 0.6 + intensity * 0.4, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(148,163,184,${0.02 + intensity * 0.06})`;
          ctx.fill();
        }
      }
      for (let i = 0; i < 3; i++) {
        const cx = canvas.width * (0.3 + i * 0.2);
        const cy = canvas.height * (0.3 + Math.sin(time + i) * 0.1);
        const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, 120);
        gradient.addColorStop(0, `rgba(148,163,184,${0.03 + Math.sin(time * 0.5 + i * 2) * 0.02})`);
        gradient.addColorStop(1, "transparent");
        ctx.fillStyle = gradient;
        ctx.fillRect(cx - 120, cy - 120, 240, 240);
      }
      animFrame = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(animFrame); window.removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.7 }} aria-hidden="true" />;
}

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-20 pb-10 md:pt-28 md:pb-16 lg:pt-32 lg:pb-20" style={{ background: "hsl(210,12%,5%)", minHeight: "min(90vh, 800px)" }}>
      <HeroMesh />
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true" style={{
        background: "radial-gradient(ellipse 70% 50% at 70% 30%, hsla(210,40%,25%,0.08) 0%, transparent 60%), radial-gradient(ellipse 50% 40% at 20% 70%, hsla(32,30%,20%,0.06) 0%, transparent 55%)",
      }} />
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true" style={{
        backgroundImage: "linear-gradient(hsla(0,0%,100%,0.015) 1px, transparent 1px), linear-gradient(90deg, hsla(0,0%,100%,0.015) 1px, transparent 1px)",
        backgroundSize: "80px 80px",
        maskImage: "radial-gradient(ellipse 80% 60% at 50% 40%, black 0%, transparent 100%)",
      }} />

      <div className="relative z-10 w-full max-w-[1200px] mx-auto px-6 sm:px-8 lg:px-12">
        <div className="grid md:grid-cols-[1fr,360px] gap-10 md:gap-14 items-center">
          <div>
            <m.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="mb-6">
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded text-[10px] font-semibold tracking-[0.12em] uppercase"
                style={{
                  background: "hsla(0,0%,100%,0.04)", border: "1px solid hsla(0,0%,100%,0.08)",
                  color: "hsl(210,5%,55%)", fontFamily: "'Space Grotesk', 'Inter', system-ui, sans-serif",
                }}>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" style={{ boxShadow: "0 0 8px hsla(160,80%,52%,0.6)" }} />
                Premium Command Systems
              </span>
            </m.div>

            <m.h1
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.72, delay: 0.2 }}
              className="text-4xl sm:text-5xl lg:text-[3.75rem] font-bold leading-[1.05] mb-5 tracking-tight"
              style={{ color: "hsl(38,12%,94%)", fontFamily: "'Space Grotesk', 'Inter', system-ui, sans-serif" }}
            >
              Visibility. Execution.{" "}
              <span className="block sm:inline" style={{ background: "linear-gradient(135deg, hsl(190,80%,55%), hsl(214,80%,65%))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                Advantage.
              </span>
            </m.h1>

            <m.p
              initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.35 }}
              className="text-base sm:text-lg leading-relaxed max-w-lg mb-8"
              style={{ color: "hsl(210,10%,62%)" }}
            >
              Command systems for observability, defense, and enterprise operations. Eight platforms. One architecture. Built to compound.
            </m.p>

            <m.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.5 }} className="flex flex-col sm:flex-row items-start gap-3 mb-10">
              <Link
                href="/ecosystem"
                className="group inline-flex items-center gap-2 px-6 py-3 rounded text-sm font-semibold transition-all duration-200"
                style={{
                  color: "hsl(210,12%,6%)", background: "hsl(210,8%,88%)",
                  fontFamily: "'Space Grotesk', 'Inter', system-ui, sans-serif",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "hsl(38,15%,96%)";
                  (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 20px hsla(0,0%,0%,0.3)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "hsl(210,8%,88%)";
                  (e.currentTarget as HTMLElement).style.boxShadow = "none";
                }}
              >
                Explore the Ecosystem <ArrowRight size={14} strokeWidth={2.5} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link
                href="/founder"
                className="inline-flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors"
                style={{ color: "hsl(210,5%,50%)", fontFamily: "'Space Grotesk', 'Inter', system-ui, sans-serif" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "hsl(210,5%,72%)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "hsl(210,5%,50%)"; }}
              >
                Meet the Founder <ArrowRight size={12} strokeWidth={2} />
              </Link>
            </m.div>

            <m.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.65 }}
              className="flex flex-wrap gap-8 sm:gap-12"
            >
              {[
                { value: "8", label: "Platforms Live" },
                { value: "1", label: "Unified Architecture" },
                { value: "5+", label: "Years Operating" },
              ].map((stat) => (
                <div key={stat.label} className="flex flex-col">
                  <span className="text-3xl sm:text-4xl font-bold tabular-nums"
                    style={{ color: "hsl(190,90%,55%)", fontFamily: "'Space Grotesk', 'Inter', system-ui, sans-serif", letterSpacing: "-0.03em", lineHeight: "1" }}>
                    {stat.value}
                  </span>
                  <span className="text-[10px] tracking-[0.14em] uppercase mt-1.5 font-semibold"
                    style={{ color: "hsl(210,5%,42%)", fontFamily: "'Space Grotesk', 'Inter', system-ui, sans-serif" }}>
                    {stat.label}
                  </span>
                </div>
              ))}
            </m.div>
          </div>

          <m.div
            initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="hidden md:block self-start mt-4"
          >
            <div style={{
              background: "hsla(210,12%,8%,0.8)",
              border: "1px solid hsla(0,0%,100%,0.08)",
              borderRadius: "10px", padding: "1.25rem",
              boxShadow: "0 20px 60px hsla(0,0%,0%,0.5), inset 0 1px 0 hsla(0,0%,100%,0.05)",
              backdropFilter: "blur(16px)",
            }}>
              <div className="flex items-center justify-between mb-4 pb-3" style={{ borderBottom: "1px solid hsla(0,0%,100%,0.06)" }}>
                <span className="text-[10px] font-semibold tracking-[0.12em] uppercase"
                  style={{ color: "hsl(210,5%,45%)", fontFamily: "'Space Grotesk', 'Inter', system-ui, sans-serif" }}>
                  Ecosystem
                </span>
                <span className="text-[10px] font-medium tabular-nums"
                  style={{ color: "hsl(142,62%,48%)", fontFamily: "'JetBrains Mono', 'Space Mono', monospace" }}>
                  8 / 8 online
                </span>
              </div>
              <div className="space-y-1">
                {platforms.map((p, i) => {
                  const Icon = p.icon;
                  return (
                    <m.div
                      key={p.name}
                      initial={{ opacity: 0, x: 8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.5 + i * 0.04 }}
                      className="flex items-center gap-3 py-2 px-2.5 rounded-md transition-colors"
                      style={{ cursor: "default" }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = `hsla(${p.glow},0.06)`; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                    >
                      <Icon size={13} style={{ color: p.color, flexShrink: 0 }} strokeWidth={2} />
                      <span className="text-[12px] font-semibold" style={{ color: "hsl(210,5%,72%)", letterSpacing: "-0.005em" }}>{p.name}</span>
                      <span className="text-[10px] ml-auto" style={{ color: "hsl(210,5%,40%)", fontFamily: "'JetBrains Mono', 'Space Mono', monospace" }}>{p.role}</span>
                      <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: p.color, boxShadow: `0 0 6px hsla(${p.glow},0.5)` }} />
                    </m.div>
                  );
                })}
              </div>
            </div>
          </m.div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent, hsla(0,0%,100%,0.06), transparent)" }} aria-hidden="true" />
    </section>
  );
}
