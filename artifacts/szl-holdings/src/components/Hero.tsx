import { useEffect, useRef, useState } from "react";
import { m } from "framer-motion";
import { ArrowRight, Layers, Shield, Anchor, Cpu, BarChart3, Eye, Users, Sparkles } from "lucide-react";
import { Link } from "wouter";

const PLATFORM_META = [
  { name: "Lyte", role: "Business Observability", icon: Eye, color: "hsl(190,90%,55%)", glow: "190,90%,55%" },
  { name: "Vessels", role: "Maritime Command", icon: Anchor, color: "hsl(205,85%,55%)", glow: "205,85%,55%" },
  { name: "Aegis", role: "Defense & Intelligence", icon: Shield, color: "hsl(232,68%,60%)", glow: "232,68%,60%" },
  { name: "Terra", role: "Real Estate Intelligence", icon: BarChart3, color: "hsl(88,42%,44%)", glow: "88,42%,44%" },
  { name: "Carlota Jo", role: "Private Advisory", icon: Sparkles, color: "hsl(38,55%,58%)", glow: "38,55%,58%" },
];

const doctrine = [
  { step: "01", label: "Observe", desc: "Ingest signals from every operational surface." },
  { step: "02", label: "Interpret", desc: "Contextualize with domain intelligence." },
  { step: "03", label: "Decide", desc: "Surface recommendations with confidence scores." },
  { step: "04", label: "Execute", desc: "Act through structured, auditable workflows." },
  { step: "05", label: "Advise", desc: "Compound institutional knowledge over time." },
];

interface EcosystemPlatform {
  key: string;
  name: string;
  role: string;
  status: string;
  checkedAt: string;
}

interface EcosystemHealth {
  summary: { total: number; online: number; degraded: number };
  platforms: EcosystemPlatform[];
  checkedAt: string;
}

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
      const cols = 50, rows = 30;
      const cellW = w() / cols, cellH = h() / rows;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = c * cellW + cellW / 2;
          const y = r * cellH + cellH / 2;
          const d1 = Math.sqrt((x - w() * 0.7) ** 2 + (y - h() * 0.3) ** 2);
          const d2 = Math.sqrt((x - w() * 0.2) ** 2 + (y - h() * 0.7) ** 2);
          const wave = (Math.sin(d1 * 0.008 + time * 1.2) * 0.5 + 0.5) * 0.6 + (Math.sin(d2 * 0.006 - time * 0.8) * 0.5 + 0.5) * 0.4;
          ctx.beginPath();
          ctx.arc(x, y, 0.5 + wave * 0.4, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(148,163,184,${0.015 + wave * 0.045})`;
          ctx.fill();
        }
      }
      animFrame = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(animFrame); window.removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.7 }} aria-hidden="true" />;
}

function EcosystemPanel() {
  const [health, setHealth] = useState<EcosystemHealth | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/holdings/ecosystem-health")
      .then((r) => r.json())
      .then((d) => { setHealth(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const KEY_MAP: Record<string, string> = {
    "Lyte": "lyte",
    "Vessels": "vessels",
    "Aegis": "aegis",
    "Terra": "terra",
    "Carlota Jo": "carlotaJo",
  };

  const platforms = PLATFORM_META.map((meta) => {
    const expectedKey = KEY_MAP[meta.name];
    const liveData = health?.platforms?.find((p) => p.key === expectedKey);
    return { ...meta, online: !loading && health ? (liveData?.status === "online") : null, latencyMs: liveData?.latencyMs ?? null };
  });

  const onlineCount = health?.summary?.online ?? (loading ? null : 0);
  const total = health?.summary?.total ?? PLATFORM_META.length;
  const checkedAt = health?.checkedAt;

  const formatCheckedAt = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    } catch { return ""; }
  };

  return (
    <div style={{
      background: "hsla(210,12%,8%,0.8)", border: "1px solid hsla(0,0%,100%,0.08)",
      padding: "1.25rem", boxShadow: "0 20px 60px hsla(0,0%,0%,0.5), inset 0 1px 0 hsla(0,0%,100%,0.05)",
      backdropFilter: "blur(16px)",
    }}>
      <div className="flex items-center justify-between mb-3 pb-2.5" style={{ borderBottom: "1px solid hsla(0,0%,100%,0.06)" }}>
        <span className="text-[10px] font-semibold tracking-[0.12em] uppercase"
          style={{ color: "hsl(210,5%,45%)", fontFamily: "'Space Grotesk', 'Inter', system-ui, sans-serif" }}>
          Ecosystem
        </span>
        <div style={{ textAlign: "right" }}>
          <span className="text-[10px] font-medium tabular-nums block"
            style={{ color: loading ? "hsl(210,5%,40%)" : "hsl(142,62%,48%)", fontFamily: "'JetBrains Mono', 'Space Mono', monospace" }}>
            {loading ? "checking..." : `${onlineCount} / ${total} online`}
          </span>
          {checkedAt && (
            <span style={{ fontSize: "8.5px", color: "hsl(210,5%,32%)", fontFamily: "'JetBrains Mono', 'Space Mono', monospace", display: "block" }}>
              {formatCheckedAt(checkedAt)}
            </span>
          )}
        </div>
      </div>
      <div className="space-y-0.5">
        {platforms.map((p, i) => {
          const Icon = p.icon;
          return (
            <m.div
              key={p.name}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.4 + i * 0.04 }}
              className="flex items-center gap-2.5 py-1.5 px-2 transition-colors"
              style={{ cursor: "default" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = `hsla(${p.glow},0.06)`; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
            >
              <Icon size={12} style={{ color: p.color, flexShrink: 0 }} strokeWidth={2} />
              <span className="text-[11px] font-semibold" style={{ color: "hsl(210,5%,72%)", letterSpacing: "-0.005em" }}>{p.name}</span>
              <span className="text-[9px] ml-auto" style={{ color: "hsl(210,5%,38%)", fontFamily: "'JetBrains Mono', 'Space Mono', monospace" }}>{p.role}</span>
              <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{
                background: p.online === null ? "hsl(210,5%,35%)" : p.online ? p.color : "hsl(0,70%,50%)",
                boxShadow: p.online ? `0 0 6px hsla(${p.glow},0.5)` : "none",
              }} />
            </m.div>
          );
        })}
      </div>
    </div>
  );
}

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-24 pb-16 md:pt-28 md:pb-20 lg:pt-32 lg:pb-24" style={{ background: "hsl(210,12%,5%)", minHeight: "min(88vh, 860px)" }}>
      <HeroMesh />
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true" style={{
        background: "radial-gradient(ellipse 70% 50% at 70% 30%, hsla(210,40%,25%,0.06) 0%, transparent 60%)",
      }} />

      <div className="relative z-10 w-full max-w-[1200px] mx-auto px-6 sm:px-8 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
          <div className="lg:col-span-7">
            <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.1 }} className="flex items-center gap-2 mb-6">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" style={{ boxShadow: "0 0 8px hsla(160,80%,52%,0.6)" }} />
              <span className="text-[11px] font-semibold tracking-[0.12em] uppercase"
                style={{ color: "hsl(210,5%,50%)", fontFamily: "'Space Grotesk', 'Inter', system-ui, sans-serif" }}>
                Command Systems Studio
              </span>
            </m.div>

            <m.h1
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.72, delay: 0.15 }}
              className="text-4xl sm:text-5xl lg:text-[3.5rem] font-bold leading-[1.08] mb-4 tracking-tight"
              style={{ color: "hsl(38,12%,94%)", fontFamily: "'Space Grotesk', 'Inter', system-ui, sans-serif" }}
            >
              Observe. Decide.{" "}
              <span style={{ background: "linear-gradient(135deg, hsl(190,80%,55%), hsl(214,80%,65%))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                Compound.
              </span>
            </m.h1>

            <m.p
              initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.3 }}
              className="text-[15px] sm:text-base leading-relaxed max-w-lg mb-7"
              style={{ color: "hsl(210,10%,55%)" }}
            >
              Five platforms. One architecture. Command systems for observability, defense, and enterprise operations — built to compound.
            </m.p>

            <m.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4 }} className="flex flex-col sm:flex-row items-start gap-3 mb-8">
              <Link
                href="/ecosystem"
                className="group inline-flex items-center gap-2 px-6 py-3 text-[13px] font-semibold transition-all duration-200"
                style={{ color: "hsl(210,12%,6%)", background: "hsl(210,8%,88%)", fontFamily: "'Space Grotesk', 'Inter', system-ui, sans-serif" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "hsl(38,15%,96%)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "hsl(210,8%,88%)"; }}
              >
                Explore the Ecosystem <ArrowRight size={14} strokeWidth={2.5} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link
                href="/founder"
                className="inline-flex items-center gap-2 px-4 py-3 text-[13px] font-medium transition-colors"
                style={{ color: "hsl(210,5%,50%)", fontFamily: "'Space Grotesk', 'Inter', system-ui, sans-serif" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "hsl(210,5%,72%)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "hsl(210,5%,50%)"; }}
              >
                Meet the Founder
              </Link>
            </m.div>

            <m.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.55 }}
              className="flex flex-wrap gap-8 sm:gap-10"
            >
              {[
                { value: "5", label: "Platforms Live" },
                { value: "1", label: "Unified Arch." },
                { value: "5+", label: "Years Operating" },
              ].map((stat) => (
                <div key={stat.label} className="flex flex-col">
                  <span className="text-2xl sm:text-3xl font-bold tabular-nums"
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
            transition={{ duration: 0.8, delay: 0.3 }}
            className="hidden lg:block lg:col-span-5 self-start mt-2"
          >
            <EcosystemPanel />
          </m.div>
        </div>

        <m.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.7 }}
          className="mt-12 lg:mt-16"
        >
          <div className="flex items-center gap-2 mb-5">
            <div className="w-6 h-px" style={{ background: "hsla(190,80%,55%,0.4)" }} />
            <span className="text-[10px] font-semibold tracking-[0.12em] uppercase" style={{ color: "hsl(210,5%,40%)", fontFamily: "'Space Grotesk', 'Inter', system-ui, sans-serif" }}>
              Doctrine
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-px" style={{ background: "hsla(0,0%,100%,0.04)" }}>
            {doctrine.map((d, i) => (
              <m.div
                key={d.label}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 + i * 0.06 }}
                className="p-4 sm:p-5"
                style={{ background: "hsl(210,12%,5%)" }}
              >
                <span className="text-[9px] font-mono font-bold" style={{ color: "hsl(190,90%,55%)" }}>{d.step}</span>
                <h3 className="text-[14px] font-semibold mt-1 mb-1" style={{ color: "hsl(210,5%,82%)", fontFamily: "'Space Grotesk', 'Inter', system-ui, sans-serif" }}>{d.label}</h3>
                <p className="text-[11px] leading-relaxed" style={{ color: "hsl(210,5%,40%)" }}>{d.desc}</p>
              </m.div>
            ))}
          </div>
        </m.div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent, hsla(0,0%,100%,0.06), transparent)" }} aria-hidden="true" />
    </section>
  );
}
