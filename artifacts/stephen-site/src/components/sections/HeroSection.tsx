import { motion } from "framer-motion";
import { ArrowRight, Linkedin, Mail } from "lucide-react";
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
    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
    resize();
    window.addEventListener("resize", resize);
    const draw = () => {
      if (document.hidden) { animFrame = requestAnimationFrame(draw); return; }
      time += 0.003;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const cols = 15, rows = 10;
      const cellW = canvas.width / cols, cellH = canvas.height / rows;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = c * cellW + cellW / 2;
          const y = r * cellH + cellH / 2;
          const d = Math.sqrt((x - canvas.width * 0.7) ** 2 + (y - canvas.height * 0.4) ** 2);
          const wave = Math.sin(d * 0.005 + time) * 0.5 + 0.5;
          ctx.beginPath();
          ctx.arc(x, y, 0.8, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(148,163,184,${0.04 + wave * 0.06})`;
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

export function HeroSection() {
  return (
    <section id="hero" className="relative min-h-screen flex items-end pb-16 sm:pb-24 lg:pb-32 overflow-hidden bg-[#0a0e14]">
      <SubtleGrid />
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-[20%] w-[600px] h-[500px] bg-[#4a6fa5]/4 rounded-full blur-[160px]" />
        <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/5 to-transparent" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl relative z-10">
        <div className="max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="flex items-center gap-2.5 mb-8 sm:mb-10"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="text-[11px] font-medium text-foreground/50 tracking-[0.2em] uppercase">
              Founder — SZL Holdings
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-5xl sm:text-6xl lg:text-[5.5rem] font-serif font-normal text-foreground leading-[1.0] mb-6 tracking-tight"
          >
            Stephen Lutar
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.35 }}
            className="text-lg sm:text-xl text-foreground/55 max-w-2xl mb-4 leading-relaxed font-light"
          >
            Builder. Operator. Systems thinker.
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.42 }}
            className="text-sm sm:text-base text-foreground/35 max-w-xl mb-10 sm:mb-12 leading-relaxed font-light"
          >
            Founder of SZL Holdings — building command systems across observability, maritime intelligence, cybersecurity, and high-trust services. Purpose-built. Designed to compound.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.52 }}
            className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-5"
          >
            <a
              href="#contact"
              className="group inline-flex items-center gap-2.5 px-7 sm:px-8 py-3.5 bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors duration-200"
            >
              Start a conversation
              <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
            </a>
            <a
              href="#case-studies"
              className="group inline-flex items-center gap-2 text-sm font-medium text-foreground/50 hover:text-primary transition-colors duration-200"
            >
              View selected work
              <ArrowRight size={13} className="opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.62 }}
            className="flex items-center gap-4 mt-8 sm:mt-10"
          >
            <a
              href="https://linkedin.com/in/stephen-l-279315240"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-[12px] text-foreground/30 hover:text-foreground/60 transition-colors"
            >
              <Linkedin size={14} /> LinkedIn
            </a>
            <a
              href="mailto:contact@stephenl.dev"
              className="inline-flex items-center gap-2 text-[12px] text-foreground/30 hover:text-foreground/60 transition-colors"
            >
              <Mail size={14} /> contact@stephenl.dev
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, delay: 0.7 }}
            className="mt-10 sm:mt-12"
          >
            <div className="flex flex-wrap gap-8 sm:gap-12">
              {[
                { value: "8+", label: "Platforms live" },
                { value: "5+", label: "Years operating" },
                { value: "Full-stack", label: "Founder-operator" },
              ].map((stat) => (
                <div key={stat.label} className="flex flex-col">
                  <span className="text-2xl sm:text-3xl font-serif text-primary">{stat.value}</span>
                  <span className="text-[10px] text-foreground/30 uppercase tracking-[0.2em] mt-1">{stat.label}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
