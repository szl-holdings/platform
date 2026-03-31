import { Link } from "wouter";
import { Sparkles, ChevronRight, Film, Zap, Target, Layers, ArrowRight, Palette, Mic, Calendar, BarChart3, Globe, Play } from "lucide-react";
import { motion as m } from "framer-motion";
import { useEffect, useRef } from "react";

const liveProductions = [
  { type: "Brand Campaign", title: "Q2 Brand Film — Narrative cut delivered", confidence: "Ready for review", impact: "High", time: "Just now" },
  { type: "Social Assets", title: "Instagram carousel batch — 12 variants generated", confidence: "Published", impact: "Medium", time: "22 min ago" },
  { type: "Voice Studio", title: "Podcast episode — voice synthesis complete", confidence: "Ready for review", impact: "Medium", time: "1 hr ago" },
  { type: "Performance Ad", title: "LinkedIn video campaign — ROAS signal positive", confidence: "Active", impact: "High", time: "3 hr ago" },
];

const impactColors: Record<string, string> = {
  High: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  Medium: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  Low: "text-amber-400 bg-amber-500/10 border-amber-500/20",
};

const capabilities = [
  { icon: Film, title: "Campaign Hub", desc: "End-to-end creative campaign management — from concept to brief to delivery. Brand films, product launches, social campaigns, and performance ads in one intelligence layer.", tag: "Core" },
  { icon: Sparkles, title: "Brand Voice Engine", desc: "AI-powered brand voice system that generates on-brief copy, adapts tone across channels, and maintains consistency across your entire content footprint.", tag: "Identity" },
  { icon: Mic, title: "Voice Studio", desc: "AI-driven voice synthesis and podcast production. Generate narration, commercials, and audio assets that match your brand voice.", tag: "Audio" },
  { icon: Palette, title: "Motion Graphics", desc: "Programmatic motion design and visual asset generation. From social loops to broadcast-quality animations — all briefed through structured creative intelligence.", tag: "Video" },
  { icon: Calendar, title: "Content Calendar", desc: "Structured publishing calendar with Alloy-driven scheduling, cross-channel sequencing, and real-time content performance tracking.", tag: "Planning" },
  { icon: BarChart3, title: "Creative Analytics", desc: "Campaign performance intelligence — ROAS, engagement signals, and creative fatigue detection across all active content. Every campaign feeds back into the next brief.", tag: "Intelligence" },
];

const stats = [
  { value: "4.2x", label: "Creative output velocity" },
  { value: "94%", label: "On-brief adherence" },
  { value: "< 24h", label: "Brief-to-asset cycle" },
  { value: "$2.1M", label: "Ad spend optimized" },
];

function CreativeMesh() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let animFrame: number;
    let time = 0;
    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
    resize();
    window.addEventListener("resize", resize);
    const draw = () => {
      time += 0.005;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const cols = 20, rows = 12;
      const cellW = canvas.width / cols, cellH = canvas.height / rows;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = c * cellW + cellW / 2;
          const y = r * cellH + cellH / 2;
          const wave = Math.sin(c * 0.3 + time) * Math.cos(r * 0.3 + time * 0.7) * 0.5 + 0.5;
          const hue = 280 + wave * 40;
          ctx.beginPath();
          ctx.arc(x, y, 1, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(${hue}, 65%, 65%, ${0.08 + wave * 0.12})`;
          ctx.fill();
          if (c < cols - 1) {
            const nx = (c + 1) * cellW + cellW / 2;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(nx, y);
            ctx.strokeStyle = `hsla(${hue}, 60%, 60%, ${0.015 + wave * 0.025})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
          if (r < rows - 1) {
            const ny = (r + 1) * cellH + cellH / 2;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x, ny);
            ctx.strokeStyle = `hsla(${hue}, 60%, 60%, ${0.015 + wave * 0.025})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
      animFrame = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(animFrame); window.removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />;
}

export default function DreamscapeMarketingHome() {
  return (
    <div className="min-h-screen bg-[#08060e] text-gray-100 overflow-x-hidden">
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-purple-500/10 bg-[#08060e]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-[15px] tracking-tight">Dreamscape</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            {["Platform", "Capabilities", "Campaigns", "Intelligence"].map(item => (
              <a key={item} href={`#${item.toLowerCase()}`} className="text-[13px] text-gray-400 hover:text-white transition-colors">{item}</a>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-[13px] text-gray-400 hover:text-white transition-colors hidden sm:block">Sign In</Link>
            <Link href="/demo" className="px-4 py-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white text-[13px] font-semibold rounded-lg transition-all">
              Request demo <ChevronRight className="w-3.5 h-3.5 inline ml-1" />
            </Link>
          </div>
        </div>
      </nav>

      <section className="relative flex items-center justify-center pt-20 pb-12 sm:pt-24 sm:pb-16 lg:pt-28 lg:pb-20 overflow-hidden" style={{ minHeight: "min(85vh, 760px)" }}>
        <CreativeMesh />
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[500px] bg-[radial-gradient(ellipse,rgba(139,92,246,0.05)_0%,transparent_70%)]" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <m.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-violet-500/20 bg-violet-500/5 mb-8">
            <Zap className="w-3.5 h-3.5 text-violet-400" />
            <span className="text-[11px] font-semibold text-violet-400/80 tracking-[0.1em] uppercase">Creative Intelligence Studio · Alloy Module</span>
          </m.div>

          <m.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.1 }} className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.05] tracking-tight mb-6">
            Creative that thinks.{" "}
            <span className="bg-gradient-to-r from-violet-300 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent">
              Campaigns that compound.
            </span>
          </m.h1>

          <m.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.2 }} className="text-base sm:text-lg text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Dreamscape is Alloy's creative intelligence module — campaign orchestration, brand voice AI, motion graphics, voice synthesis, and performance analytics for creative teams that demand operational rigor.
          </m.p>

          <m.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }} className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/demo">
              <button className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-bold rounded-xl transition-all text-[14px] shadow-lg shadow-violet-500/20">
                Schedule a walkthrough <ChevronRight className="w-4 h-4" />
              </button>
            </Link>
            <Link href="/">
              <button className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-white/5 hover:bg-white/8 border border-white/10 text-gray-300 font-medium rounded-xl transition-all text-[14px]">
                Open creative studio <Sparkles className="w-4 h-4" />
              </button>
            </Link>
          </m.div>
        </div>
      </section>

      <section className="border-y border-violet-500/10 bg-[#0a0814]/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10 grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
          {stats.map((s, i) => (
            <m.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 + i * 0.1 }} className="text-center">
              <p className="font-bold text-2xl sm:text-3xl bg-gradient-to-r from-violet-300 to-fuchsia-400 bg-clip-text text-transparent mb-1">{s.value}</p>
              <p className="text-[11px] sm:text-[12px] text-gray-500">{s.label}</p>
            </m.div>
          ))}
        </div>
      </section>

      <section id="campaigns" className="py-16 sm:py-24 border-b border-white/5">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-8">
            <p className="text-[11px] font-semibold text-violet-400/60 tracking-[0.15em] uppercase mb-3">Live Studio</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">Production in real time</h2>
            <p className="text-gray-500 text-[14px] max-w-xl mx-auto">Campaign milestones, asset deliveries, and performance signals across your creative operations.</p>
          </div>
          <div className="space-y-3">
            {liveProductions.map((p, i) => (
              <m.div key={i} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 + i * 0.12 }} className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 bg-[#0d0a18]/80 border border-white/5 rounded-xl p-4">
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border whitespace-nowrap w-fit ${impactColors[p.impact]}`}>{p.impact}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-gray-200 leading-snug">{p.title}</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">{p.type} · {p.confidence}</p>
                </div>
                <span className="text-[10px] text-gray-600 shrink-0">{p.time}</span>
              </m.div>
            ))}
          </div>
        </div>
      </section>

      <section id="capabilities" className="py-16 sm:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12 sm:mb-16">
            <p className="text-[11px] font-semibold text-violet-400/60 tracking-[0.15em] uppercase mb-3">Capabilities</p>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4">Full-spectrum creative intelligence</h2>
            <p className="text-gray-500 text-[14px] sm:text-[15px] max-w-2xl mx-auto">From brief to asset to analytics. Every creative touchpoint structured, traceable, and Alloy-powered.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {capabilities.map((c, i) => (
              <m.div key={c.title} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }} className="group bg-[#0d0a18]/60 border border-white/5 hover:border-violet-500/20 rounded-xl p-5 sm:p-6 transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 border border-violet-500/10 flex items-center justify-center">
                    <c.icon className="w-5 h-5 text-violet-400" />
                  </div>
                  <span className="text-[9px] font-semibold text-violet-400/35 tracking-[0.1em] uppercase">{c.tag}</span>
                </div>
                <h3 className="text-[15px] font-semibold text-white mb-2">{c.title}</h3>
                <p className="text-gray-500 text-[13px] leading-relaxed">{c.desc}</p>
              </m.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-24 border-t border-white/5">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <m.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
              Brief once.{" "}
              <span className="bg-gradient-to-r from-violet-300 to-fuchsia-400 bg-clip-text text-transparent">Produce everywhere.</span>
            </h2>
            <p className="text-gray-500 text-[15px] mb-10 max-w-xl mx-auto leading-relaxed">
              Dreamscape is Alloy's creative intelligence studio. Available to qualified teams — schedule a walkthrough to see how structured creative operations change the velocity of your brand.
            </p>
            <Link href="/demo">
              <button className="px-10 py-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-bold rounded-xl transition-all text-[15px] shadow-lg shadow-violet-500/20">
                Schedule a walkthrough
              </button>
            </Link>
          </m.div>
        </div>
      </section>

      <footer className="border-t border-white/5 py-12 sm:py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center">
                <Sparkles className="w-3 h-3 text-white" />
              </div>
              <span className="font-bold text-[13px]">Dreamscape</span>
              <span className="text-[11px] text-gray-600 ml-2">by SZL Holdings</span>
            </div>
            <p className="text-[11px] text-gray-600">&copy; {new Date().getFullYear()} SZL Holdings. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
