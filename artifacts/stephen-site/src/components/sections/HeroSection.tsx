import { motion } from "framer-motion";
import { ArrowRight, Linkedin, Mail, ExternalLink } from "lucide-react";
import { useEffect, useRef } from "react";

function SubtleGrid() {
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
      time += 0.003;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const cols = 20, rows = 14;
      const cellW = canvas.width / cols, cellH = canvas.height / rows;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = c * cellW + cellW / 2;
          const y = r * cellH + cellH / 2;
          const d = Math.sqrt((x - canvas.width * 0.65) ** 2 + (y - canvas.height * 0.35) ** 2);
          const wave = Math.sin(d * 0.005 + time) * 0.5 + 0.5;
          ctx.beginPath();
          ctx.arc(x, y, 0.8 + wave * 0.3, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(148,163,184,${0.03 + wave * 0.05})`;
          ctx.fill();
        }
      }
      animFrame = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(animFrame); window.removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden="true" />;
}

const ecosystemBrands = [
  { name: "Vessels", desc: "Maritime Intelligence", color: "hsl(205,85%,55%)" },
  { name: "Firestorm", desc: "Cyber Defense", color: "hsl(0,80%,55%)" },
  { name: "INCA", desc: "AI Research", color: "hsl(265,80%,60%)" },
  { name: "Lyte", desc: "Business Observability", color: "hsl(190,90%,55%)" },
  { name: "Alloy", desc: "Intelligence Engine", color: "hsl(214,80%,65%)" },
  { name: "Carlota Jo", desc: "Private Advisory", color: "hsl(38,55%,58%)" },
];

export function HeroSection() {
  return (
    <section id="hero" className="relative overflow-hidden bg-[#0a0e14] pt-16 pb-12 sm:pt-24 sm:pb-16 lg:pt-28 lg:pb-20" style={{ minHeight: "min(88vh, 780px)" }}>
      <SubtleGrid />
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-[20%] w-[600px] h-[500px] bg-[#4a6fa5]/4 rounded-full blur-[160px]" />
        <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/5 to-transparent" />
      </div>

      <div className="container mx-auto px-6 sm:px-8 lg:px-12 max-w-6xl relative z-10">
        <div className="grid md:grid-cols-[1fr,340px] gap-10 md:gap-14 items-center">
          <div>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="flex items-center gap-2.5 mb-6 sm:mb-8"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" style={{ boxShadow: "0 0 8px hsla(160,80%,52%,0.5)" }} />
              <span className="text-[11px] font-medium text-foreground/55 tracking-[0.2em] uppercase">
                Founder — SZL Holdings
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-5xl sm:text-6xl lg:text-7xl font-serif font-normal text-foreground leading-[1.0] mb-5 tracking-tight"
            >
              Stephen Lutar
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.35 }}
              className="text-lg sm:text-xl text-foreground/60 max-w-2xl mb-3 leading-relaxed font-light"
            >
              Builder. Operator. Systems thinker.
            </motion.p>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.42 }}
              className="text-sm sm:text-base text-foreground/40 max-w-xl mb-8 sm:mb-10 leading-relaxed font-light"
            >
              Founder of SZL Holdings. Building command systems that compound across maritime, cybersecurity, AI, and enterprise operations.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.52 }}
              className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4"
            >
              <a
                href="#contact"
                className="group inline-flex items-center gap-2.5 px-7 py-3.5 bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors duration-200 rounded"
              >
                Start a conversation
                <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
              </a>
              <a
                href="#case-studies"
                className="group inline-flex items-center gap-2 text-sm font-medium text-foreground/50 hover:text-primary transition-colors duration-200 px-2 py-3"
              >
                View selected work
                <ArrowRight size={13} className="opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
              </a>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="flex items-center gap-5 mt-8"
            >
              <a
                href="https://linkedin.com/in/stephen-l-279315240"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-[12px] text-foreground/35 hover:text-foreground/65 transition-colors"
              >
                <Linkedin size={14} /> LinkedIn
              </a>
              <a
                href="mailto:contact@stephenl.dev"
                className="inline-flex items-center gap-2 text-[12px] text-foreground/35 hover:text-foreground/65 transition-colors"
              >
                <Mail size={14} /> contact@stephenl.dev
              </a>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.75, delay: 0.7 }}
              className="mt-8 sm:mt-10"
            >
              <div className="flex flex-wrap gap-8 sm:gap-12">
                {[
                  { value: "8+", label: "Platforms live" },
                  { value: "5+", label: "Years operating" },
                  { value: "Full-stack", label: "Founder-operator" },
                ].map((stat) => (
                  <div key={stat.label} className="flex flex-col">
                    <span className="text-2xl sm:text-3xl font-serif text-primary">{stat.value}</span>
                    <span className="text-[10px] text-foreground/35 uppercase tracking-[0.2em] mt-1">{stat.label}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="hidden md:block"
          >
            <div className="rounded-xl p-5" style={{
              background: "hsla(210,16%,10%,0.7)",
              border: "1px solid hsla(0,0%,100%,0.07)",
              boxShadow: "0 16px 48px hsla(0,0%,0%,0.4)",
              backdropFilter: "blur(12px)",
            }}>
              <div className="flex items-center justify-between mb-4 pb-3" style={{ borderBottom: "1px solid hsla(0,0%,100%,0.06)" }}>
                <span className="text-[10px] font-semibold tracking-[0.12em] uppercase" style={{ color: "hsl(210,5%,45%)" }}>
                  The Ecosystem
                </span>
                <span className="flex items-center gap-1.5 text-[10px]" style={{ color: "hsl(142,62%,48%)" }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  All systems live
                </span>
              </div>
              <div className="space-y-1.5">
                {ecosystemBrands.map((brand, i) => (
                  <motion.div
                    key={brand.name}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.6 + i * 0.05 }}
                    className="flex items-center gap-3 py-2 px-2 rounded-md transition-colors"
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "hsla(0,0%,100%,0.03)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                  >
                    <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: brand.color, boxShadow: `0 0 6px ${brand.color}80` }} />
                    <span className="text-[12px] font-semibold text-foreground/70">{brand.name}</span>
                    <span className="text-[10px] ml-auto text-foreground/30 font-mono">{brand.desc}</span>
                    <ExternalLink size={10} className="text-foreground/20 flex-shrink-0" />
                  </motion.div>
                ))}
              </div>
              <div className="mt-4 pt-3" style={{ borderTop: "1px solid hsla(0,0%,100%,0.06)" }}>
                <p className="text-[10px] text-foreground/25 text-center">One founder. One architecture. Full ownership.</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
