import { motion } from "framer-motion";
import { ArrowRight, Linkedin, Mail, ExternalLink } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";

const BASE_URL = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
const API_BASE = BASE_URL.replace(/\/stephen$/, "") + "/api";

type EcosystemApp = {
  name: string;
  slug: string;
  status: string;
  description: string;
};

type EcosystemStatus = {
  apps: EcosystemApp[];
  lastChecked: string;
};

const fallbackApps = [
  { name: "SZL Holdings", slug: "szl-holdings", status: "operational", description: "Parent Company" },
  { name: "Lyte", slug: "lyte", status: "operational", description: "Business Observability" },
  { name: "Vessels", slug: "vessels", status: "operational", description: "Maritime Intelligence" },
  { name: "Aegis", slug: "aegis", status: "operational", description: "Defense & Intelligence" },
  { name: "Terra", slug: "terra", status: "operational", description: "Real Estate Intelligence" },
  { name: "Carlota Jo", slug: "carlota-jo", status: "operational", description: "Private Advisory" },
];

const brandColors: Record<string, string> = {
  "szl-holdings": "hsl(38,55%,60%)",
  "lyte": "hsl(190,90%,55%)",
  "vessels": "hsl(205,85%,55%)",
  "aegis": "hsl(232,68%,60%)",
  "firestorm": "hsl(232,68%,60%)",
  "terra": "hsl(140,56%,40%)",
  "carlota-jo": "hsl(38,55%,58%)",
};

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
      time += 0.003;
      ctx.clearRect(0, 0, w(), h());
      const cols = 25, rows = 16;
      const cellW = w() / cols, cellH = h() / rows;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = c * cellW + cellW / 2;
          const y = r * cellH + cellH / 2;
          const d = Math.sqrt((x - w() * 0.65) ** 2 + (y - h() * 0.35) ** 2);
          const wave = Math.sin(d * 0.005 + time) * 0.5 + 0.5;
          ctx.beginPath();
          ctx.arc(x, y, 0.6 + wave * 0.3, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(148,163,184,${0.02 + wave * 0.04})`;
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

function EcosystemWidget() {
  const [data, setData] = useState<EcosystemStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch(`${API_BASE}/stephen/ecosystem-status`);
        if (!res.ok) throw new Error("Failed");
        const json = await res.json();
        if (!cancelled) setData(json);
      } catch {
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  const apps = data?.apps ?? fallbackApps;
  const allOperational = apps.every(a => a.status === "operational");

  return (
    <div className="p-4" style={{
      background: "hsla(210,16%,10%,0.7)",
      border: "1px solid hsla(0,0%,100%,0.06)",
      boxShadow: "0 16px 48px hsla(0,0%,0%,0.4)",
      backdropFilter: "blur(12px)",
    }}>
      <div className="flex items-center justify-between mb-3 pb-2.5" style={{ borderBottom: "1px solid hsla(0,0%,100%,0.05)" }}>
        <span className="text-[10px] font-semibold tracking-[0.12em] uppercase" style={{ color: "hsl(210,5%,42%)" }}>
          The Ecosystem
        </span>
        {loading ? (
          <span className="text-[10px] text-white/20">Checking…</span>
        ) : (
          <span className="flex items-center gap-1.5 text-[10px]" style={{ color: allOperational ? "hsl(142,62%,48%)" : "hsl(38,90%,60%)" }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: allOperational ? "hsl(142,62%,48%)" : "hsl(38,90%,60%)" }} />
            {allOperational ? "All systems live" : "Partial"}
          </span>
        )}
      </div>
      <div className="space-y-0.5">
        {apps.map((app, i) => {
          const color = brandColors[app.slug] ?? "hsl(210,8%,56%)";
          return (
            <motion.div
              key={app.name}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.5 + i * 0.05 }}
              className="flex items-center gap-2.5 py-1.5 px-2 transition-colors"
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "hsla(0,0%,100%,0.03)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
            >
              <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: color, boxShadow: `0 0 6px ${color}80` }} />
              <span className="text-[11px] font-semibold text-foreground/65">{app.name}</span>
              <span className="text-[9px] ml-auto text-foreground/25 font-mono">{app.description ?? app.slug}</span>
              <ExternalLink size={9} className="text-foreground/15 flex-shrink-0" />
            </motion.div>
          );
        })}
      </div>
      <div className="mt-3 pt-2.5" style={{ borderTop: "1px solid hsla(0,0%,100%,0.05)" }}>
        <p className="text-[9px] text-foreground/20 text-center tracking-wide">One founder. One architecture. Full ownership.</p>
      </div>
    </div>
  );
}

export function HeroSection() {
  return (
    <section id="hero" className="relative overflow-hidden bg-[#0a0e14] pt-24 pb-16 sm:pt-28 sm:pb-20 lg:pt-32 lg:pb-24" style={{ minHeight: "min(88vh, 860px)" }}>
      <SubtleGrid />
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-[20%] w-[500px] h-[400px] bg-[#4a6fa5]/3 rounded-full blur-[160px]" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/5 to-transparent" />
      </div>

      <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
          <div className="lg:col-span-7">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="flex items-center gap-2 mb-6"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" style={{ boxShadow: "0 0 8px hsla(160,80%,52%,0.5)" }} />
              <span className="text-[11px] font-medium text-foreground/45 tracking-[0.15em] uppercase">
                Founder & CEO — SZL Holdings. Builder. Operator. Systems thinker.
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.15 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-serif font-normal text-foreground leading-[1.05] mb-4 tracking-tight"
            >
              Stephen Lutar
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="text-base sm:text-lg text-foreground/55 max-w-lg mb-3 leading-relaxed font-light"
            >
              Building command systems that close the loop from signal to decision to auditable action.
            </motion.p>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.38 }}
              className="text-[13px] sm:text-sm text-foreground/35 max-w-md mb-7 leading-relaxed font-light"
            >
              Five platforms across maritime, cybersecurity, AI, real estate, and enterprise operations. One compounding architecture. Full-stack founder-operator.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.46 }}
              className="flex flex-col sm:flex-row items-start sm:items-center gap-3"
            >
              <Link
                href="/contact"
                className="group inline-flex items-center gap-2.5 px-7 py-3 bg-primary text-primary-foreground text-[13px] font-semibold hover:bg-primary/90 transition-colors duration-200"
              >
                Start a conversation
                <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link
                href="/work"
                className="inline-flex items-center gap-2 text-[13px] font-medium text-foreground/40 hover:text-primary transition-colors duration-200 px-2 py-3"
              >
                View case studies <ArrowRight size={12} />
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.55 }}
              className="flex items-center gap-5 mt-6"
            >
              <a href="https://linkedin.com/in/stephen-l-279315240" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-[11px] text-foreground/30 hover:text-foreground/60 transition-colors">
                <Linkedin size={13} /> LinkedIn
              </a>
              <a href="mailto:contact@stephenl.dev" className="inline-flex items-center gap-1.5 text-[11px] text-foreground/30 hover:text-foreground/60 transition-colors">
                <Mail size={13} /> contact@stephenl.dev
              </a>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.65 }}
              className="mt-8 flex flex-wrap gap-8 sm:gap-10"
            >
              {[
                { value: "5", label: "Platforms live" },
                { value: "5+", label: "Years operating" },
                { value: "Full-stack", label: "Founder-operator" },
              ].map((stat) => (
                <div key={stat.label} className="flex flex-col">
                  <span className="text-xl sm:text-2xl font-serif text-primary leading-none">{stat.value}</span>
                  <span className="text-[9px] text-foreground/30 uppercase tracking-[0.18em] mt-1.5">{stat.label}</span>
                </div>
              ))}
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="hidden lg:block lg:col-span-5"
          >
            <EcosystemWidget />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
