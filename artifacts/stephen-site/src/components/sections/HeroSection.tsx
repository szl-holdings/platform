import { motion, useInView } from "framer-motion";
import { ArrowRight, Linkedin, Github, Mail, Activity } from "lucide-react";
import { useEffect, useRef, useState, useCallback } from "react";

const API_BASE = "/api";

type EcosystemApp = {
  name: string;
  slug: string;
  status: string;
  description: string;
};

const fallbackApps = [
  { name: "SZL Holdings", slug: "szl-holdings", status: "operational", description: "Parent Company" },
  { name: "Lyte", slug: "lyte", status: "operational", description: "Business Observability" },
  { name: "Vessels", slug: "vessels", status: "operational", description: "Maritime Intelligence" },
  { name: "Aegis", slug: "aegis", status: "operational", description: "Defense & Intelligence" },
  { name: "Terra", slug: "terra", status: "operational", description: "Real Estate Intelligence" },
  { name: "PRISM Counsel", slug: "prism-counsel", status: "operational", description: "Legal Intelligence" },
  { name: "Carlota Jo", slug: "carlota-jo", status: "operational", description: "Private Advisory" },
];

const brandColors: Record<string, string> = {
  "szl-holdings": "#D4A054",
  "lyte": "#00D4FF",
  "vessels": "#3B8BEB",
  "aegis": "#6366F1",
  "firestorm": "#6366F1",
  "terra": "#22C55E",
  "prism-counsel": "#F59E0B",
  "carlota-jo": "#D4A054",
};

function useAnimatedCounter(target: number, duration: number = 2000, startDelay: number = 0) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  useEffect(() => {
    if (!isInView) return;
    const timeout = setTimeout(() => {
      const startTime = Date.now();
      const tick = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setValue(Math.floor(eased * target));
        if (progress < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, startDelay);
    return () => clearTimeout(timeout);
  }, [isInView, target, duration, startDelay]);

  return { value, ref };
}

function DotGrid() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const isMobile = window.innerWidth < 640;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let animFrame: number;
    let time = 0;
    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resize();
    window.addEventListener("resize", resize);
    const w = () => canvas.offsetWidth;
    const h = () => canvas.offsetHeight;
    const draw = () => {
      if (document.hidden) { animFrame = requestAnimationFrame(draw); return; }
      time += 0.002;
      ctx.clearRect(0, 0, w(), h());
      const spacing = isMobile ? 42 : 28;
      const cols = Math.ceil(w() / spacing);
      const rows = Math.ceil(h() / spacing);
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = c * spacing + spacing / 2;
          const y = r * spacing + spacing / 2;
          const cx = w() * 0.7, cy = h() * 0.3;
          const d = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
          const maxD = Math.sqrt(w() * w() + h() * h());
          const wave = Math.sin(d * 0.008 - time * 2) * 0.5 + 0.5;
          const proximity = 1 - (d / maxD);
          const alpha = 0.015 + wave * 0.035 * proximity;
          const green = wave > 0.7 && proximity > 0.4;
          if (green) {
            ctx.fillStyle = `rgba(34,197,94,${alpha * 2.5})`;
          } else {
            ctx.fillStyle = `rgba(148,163,184,${alpha})`;
          }
          ctx.beginPath();
          ctx.arc(x, y, 0.8, 0, Math.PI * 2);
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

function MetricCard({ value, suffix, label, color, delay }: { value: number; suffix?: string; label: string; color: string; delay: number }) {
  const counter = useAnimatedCounter(value, 2200, delay);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: delay / 1000 + 0.3 }}
      className="relative p-5 overflow-hidden"
      style={{
        background: "rgba(15,20,30,0.8)",
        border: "1px solid rgba(255,255,255,0.06)",
        backdropFilter: "blur(12px)",
      }}
    >
      <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: `linear-gradient(90deg, ${color}, transparent)` }} />
      <div className="flex items-baseline gap-1 mb-1.5">
        <span ref={counter.ref} className="text-3xl sm:text-4xl font-bold tabular-nums" style={{ fontFamily: "'JetBrains Mono', monospace", color }}>
          {counter.value.toLocaleString()}
        </span>
        {suffix && <span className="text-lg font-semibold" style={{ color: `${color}99` }}>{suffix}</span>}
      </div>
      <span className="text-[10px] font-medium tracking-[0.2em] uppercase" style={{ color: "rgba(255,255,255,0.35)" }}>
        {label}
      </span>
    </motion.div>
  );
}

function SystemStatusBar() {
  const [apps, setApps] = useState<EcosystemApp[]>(fallbackApps);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/stephen/ecosystem-status`);
        if (res.ok) {
          const json = await res.json();
          if (!cancelled && json.apps) setApps(json.apps);
        }
      } catch {}
    })();
    return () => { cancelled = true; };
  }, []);

  const allOp = apps.every(a => a.status === "operational");

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 1.2 }}
      className="mt-8 p-4 sm:p-5"
      style={{
        background: "rgba(15,20,30,0.6)",
        border: "1px solid rgba(255,255,255,0.05)",
        backdropFilter: "blur(8px)",
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Activity size={12} style={{ color: allOp ? "#22C55E" : "#F59E0B" }} />
          <span className="text-[10px] font-semibold tracking-[0.18em] uppercase" style={{ color: "rgba(255,255,255,0.3)" }}>
            System Status
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: allOp ? "#22C55E" : "#F59E0B", boxShadow: `0 0 8px ${allOp ? "rgba(34,197,94,0.5)" : "rgba(245,158,11,0.5)"}` }} />
          <span className="text-[10px] font-medium" style={{ color: allOp ? "#22C55E" : "#F59E0B" }}>
            {allOp ? "All Systems Operational" : "Partial Degradation"}
          </span>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        {apps.map((app, i) => {
          const color = brandColors[app.slug] ?? "#94A3B8";
          return (
            <motion.div
              key={app.name}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 1.4 + i * 0.05 }}
              className="flex items-center gap-2 px-2.5 py-2 transition-colors"
              style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}
            >
              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: color, boxShadow: `0 0 6px ${color}60` }} />
              <div className="min-w-0">
                <p className="text-[10px] font-semibold truncate" style={{ color: "rgba(255,255,255,0.6)" }}>{app.name}</p>
                <p className="text-[8px] font-mono truncate" style={{ color: "rgba(255,255,255,0.2)" }}>{app.description}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

export function HeroSection() {
  return (
    <section id="hero" className="relative overflow-hidden bg-[#080b12] pt-28 pb-16 sm:pt-32 sm:pb-20 lg:pt-36 lg:pb-24" style={{ minHeight: "min(100vh, 960px)" }}>
      <DotGrid />
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[10%] w-[700px] h-[600px] rounded-full blur-[240px]" style={{ background: "rgba(99,102,241,0.06)" }} />
        <div className="absolute bottom-[20%] left-[5%] w-[500px] h-[400px] rounded-full blur-[200px]" style={{ background: "rgba(34,197,94,0.04)" }} />
        <div className="absolute top-[40%] right-[30%] w-[300px] h-[300px] rounded-full blur-[160px]" style={{ background: "rgba(0,212,255,0.03)" }} />
      </div>

      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="inline-flex items-center gap-2.5 mb-6 px-4 py-2"
          style={{ border: "1px solid rgba(34,197,94,0.2)", background: "rgba(34,197,94,0.05)" }}
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: "#22C55E" }} />
            <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: "#22C55E" }} />
          </span>
          <span className="text-[11px] font-semibold tracking-[0.15em] uppercase" style={{ color: "rgba(34,197,94,0.8)" }}>
            All systems live
          </span>
        </motion.div>

        <div className="max-w-4xl mb-10">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15 }}
            className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-black leading-[0.95] tracking-tight mb-6"
            style={{ color: "rgba(255,255,255,0.95)", fontFamily: "'Inter', system-ui, sans-serif" }}
          >
            Stephen Lutar
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="text-lg sm:text-xl lg:text-2xl font-light leading-relaxed max-w-3xl"
            style={{ color: "rgba(255,255,255,0.45)" }}
          >
            Founder & CEO, SZL Holdings. I build command systems that close the loop from
            signal to decision to auditable action — across{" "}
            <span style={{ color: "#00D4FF" }}>five industries</span>,{" "}
            <span style={{ color: "#6366F1" }}>one architecture</span>.
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.45 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8"
        >
          <MetricCard value={16} label="Applications Live" color="#22C55E" delay={0} />
          <MetricCard value={375} label="Database Tables" color="#00D4FF" delay={100} />
          <MetricCard value={1618} suffix="+" label="API Endpoints" color="#6366F1" delay={200} />
          <MetricCard value={8} label="Industries Served" color="#F59E0B" delay={300} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6"
        >
          <a
            href="#contact"
            onClick={(e) => { e.preventDefault(); document.querySelector("#contact")?.scrollIntoView({ behavior: "smooth" }); }}
            className="group inline-flex items-center gap-3 px-8 py-4 text-[14px] font-bold tracking-wide transition-all duration-200"
            style={{ background: "white", color: "#080b12" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#E2E8F0"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "white"; }}
          >
            Start a conversation
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </a>
          <a
            href="#portfolio"
            onClick={(e) => { e.preventDefault(); document.querySelector("#portfolio")?.scrollIntoView({ behavior: "smooth" }); }}
            className="inline-flex items-center gap-2 text-[14px] font-medium transition-colors duration-200 px-3 py-4"
            style={{ color: "rgba(255,255,255,0.4)" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.7)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.4)"; }}
          >
            View the ecosystem <ArrowRight size={14} />
          </a>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.85 }}
          className="flex flex-wrap items-center gap-4 sm:gap-6"
        >
          <a href="https://linkedin.com/in/stephenlutar" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-[12px] transition-colors" style={{ color: "rgba(255,255,255,0.25)" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.6)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.25)"; }}
          >
            <Linkedin size={14} /> LinkedIn
          </a>
          <a href="https://github.com/szl-holdings" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-[12px] transition-colors" style={{ color: "rgba(255,255,255,0.25)" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.6)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.25)"; }}
          >
            <Github size={14} /> GitHub
          </a>
          <a href="mailto:stephenlutar2@gmail.com" className="inline-flex items-center gap-2 text-[12px] transition-colors" style={{ color: "rgba(255,255,255,0.25)" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.6)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.25)"; }}
          >
            <Mail size={14} /> stephenlutar2@gmail.com
          </a>
        </motion.div>

        <SystemStatusBar />
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/8 to-transparent" />
    </section>
  );
}
