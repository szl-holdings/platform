import { Link } from "wouter";
import { Brain, ChevronRight, TrendingUp, Zap, Target, Eye, BarChart3, ArrowRight, Lightbulb, Shield, Activity, Layers, GitBranch, LineChart } from "lucide-react";
import { motion as m } from "framer-motion";
import { useEffect, useRef } from "react";

const predictions = [
  { type: "Revenue Signal", title: "Q3 pipeline velocity suggests 12% upside to forecast", confidence: "94%", impact: "High", time: "Just now" },
  { type: "Risk Scenario", title: "Supply chain disruption probability elevated — Southeast Asia corridor", confidence: "87%", impact: "Critical", time: "18 min ago" },
  { type: "Opportunity", title: "Cross-sell signal detected in enterprise segment — 3 accounts ready", confidence: "91%", impact: "Medium", time: "1 hr ago" },
  { type: "Model Alert", title: "Churn prediction model accuracy drifting — retraining recommended", confidence: "78%", impact: "Low", time: "4 hr ago" },
];

const impactColors: Record<string, string> = {
  Critical: "text-red-400 bg-red-500/10 border-red-500/20",
  High: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  Medium: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  Low: "text-amber-400 bg-amber-500/10 border-amber-500/20",
};

const capabilities = [
  { icon: TrendingUp, title: "Predictive Intelligence", desc: "Forecast revenue, churn, and operational risk before they happen.", tag: "Core" },
  { icon: Target, title: "Scenario Planning", desc: "Monte Carlo simulations for stress-testing strategic decisions.", tag: "Strategy" },
  { icon: Eye, title: "Model Explainability", desc: "Glass-box AI. Every prediction with confidence and causal factors.", tag: "Trust" },
  { icon: Lightbulb, title: "Opportunity Engine", desc: "Surface revenue opportunities and efficiency gains automatically.", tag: "Growth" },
  { icon: LineChart, title: "Forecasting Center", desc: "Multi-horizon forecasts from next quarter to three years out.", tag: "Planning" },
  { icon: Layers, title: "Decision Intelligence", desc: "Connect predictions to actions with outcome tracking.", tag: "Operations" },
];

const stats = [
  { value: "94%", label: "Forecast accuracy" },
  { value: "3.2x", label: "Faster decision cycles" },
  { value: "$4.7M", label: "Revenue impact identified" },
  { value: "< 60s", label: "Prediction generation" },
];

function PredictionMesh() {
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
          const hue = 260 + wave * 30;
          ctx.beginPath();
          ctx.arc(x, y, 1, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(${hue}, 60%, 60%, ${0.1 + wave * 0.15})`;
          ctx.fill();
          if (c < cols - 1) {
            const nx = (c + 1) * cellW + cellW / 2;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(nx, y);
            ctx.strokeStyle = `hsla(${hue}, 60%, 60%, ${0.02 + wave * 0.03})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
          if (r < rows - 1) {
            const ny = (r + 1) * cellH + cellH / 2;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x, ny);
            ctx.strokeStyle = `hsla(${hue}, 60%, 60%, ${0.02 + wave * 0.03})`;
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
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
              <Brain className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-[15px] tracking-tight">Dreamscape</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            {["Platform", "Capabilities", "Intelligence", "Security"].map(item => (
              <a key={item} href={`#${item.toLowerCase()}`} className="text-[13px] text-gray-400 hover:text-white transition-colors">{item}</a>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-[13px] text-gray-400 hover:text-white transition-colors hidden sm:block">Sign In</Link>
            <Link href="/demo" className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-[13px] font-semibold rounded-lg transition-all">
              Request demo <ChevronRight className="w-3.5 h-3.5 inline ml-1" />
            </Link>
          </div>
        </div>
      </nav>

      <section className="relative min-h-screen flex items-center justify-center pt-16 overflow-hidden">
        <PredictionMesh />
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[500px] bg-[radial-gradient(ellipse,rgba(139,92,246,0.06)_0%,transparent_70%)]" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <m.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-purple-500/20 bg-purple-500/5 mb-8">
            <Zap className="w-3.5 h-3.5 text-purple-400" />
            <span className="text-[11px] font-semibold text-purple-400/80 tracking-[0.1em] uppercase">Predictive Intelligence Platform</span>
          </m.div>

          <m.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.1 }} className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.05] tracking-tight mb-6">
            See what's coming.{" "}
            <span className="bg-gradient-to-r from-purple-300 via-indigo-400 to-blue-400 bg-clip-text text-transparent">
              Act before it arrives.
            </span>
          </m.h1>

          <m.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.2 }} className="text-base sm:text-lg text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            ML forecasting and scenario planning for leadership teams.
          </m.p>

          <m.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }} className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/demo">
              <button className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl transition-all text-[14px] shadow-lg shadow-purple-500/20">
                Schedule a walkthrough <ChevronRight className="w-4 h-4" />
              </button>
            </Link>
            <Link href="/">
              <button className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-white/5 hover:bg-white/8 border border-white/10 text-gray-300 font-medium rounded-xl transition-all text-[14px]">
                Open intelligence dashboard <Brain className="w-4 h-4" />
              </button>
            </Link>
          </m.div>
        </div>
      </section>

      <section className="border-y border-purple-500/10 bg-[#0a0814]/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10 grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
          {stats.map((s, i) => (
            <m.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 + i * 0.1 }} className="text-center">
              <p className="font-bold text-2xl sm:text-3xl bg-gradient-to-r from-purple-300 to-indigo-400 bg-clip-text text-transparent mb-1">{s.value}</p>
              <p className="text-[11px] sm:text-[12px] text-gray-500">{s.label}</p>
            </m.div>
          ))}
        </div>
      </section>

      <section id="intelligence" className="py-16 sm:py-24 border-b border-white/5">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-8">
            <p className="text-[11px] font-semibold text-purple-400/60 tracking-[0.15em] uppercase mb-3">Live Predictions</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">Foresight in real time</h2>
            <p className="text-gray-500 text-[14px] max-w-xl mx-auto">Dreamscape continuously generates predictions, surfaces opportunities, and flags risks across your business data.</p>
          </div>
          <div className="space-y-3">
            {predictions.map((p, i) => (
              <m.div key={i} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 + i * 0.12 }} className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 bg-[#0d0a18]/80 border border-white/5 rounded-xl p-4">
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border whitespace-nowrap w-fit ${impactColors[p.impact]}`}>{p.impact}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-gray-200 leading-snug">{p.title}</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">{p.type} · {p.confidence} confidence</p>
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
            <p className="text-[11px] font-semibold text-purple-400/60 tracking-[0.15em] uppercase mb-3">Capabilities</p>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4">Full-spectrum predictive intelligence</h2>
            <p className="text-gray-500 text-[14px] sm:text-[15px] max-w-2xl mx-auto">Every prediction explainable. Every decision traceable.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {capabilities.map((c, i) => (
              <m.div key={c.title} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }} className="group bg-[#0d0a18]/60 border border-white/5 hover:border-purple-500/20 rounded-xl p-5 sm:p-6 transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500/10 to-indigo-500/10 border border-purple-500/10 flex items-center justify-center">
                    <c.icon className="w-5 h-5 text-purple-400" />
                  </div>
                  <span className="text-[9px] font-semibold text-purple-400/35 tracking-[0.1em] uppercase">{c.tag}</span>
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
              Stop reacting.{" "}
              <span className="bg-gradient-to-r from-purple-300 to-indigo-400 bg-clip-text text-transparent">Start predicting.</span>
            </h2>
            <p className="text-gray-500 text-[15px] mb-10 max-w-xl mx-auto leading-relaxed">
              Dreamscape is available to qualified teams. Schedule a walkthrough to see how predictive intelligence changes the way you lead.
            </p>
            <Link href="/demo">
              <button className="px-10 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl transition-all text-[15px] shadow-lg shadow-purple-500/20">
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
              <div className="w-6 h-6 rounded bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                <Brain className="w-3 h-3 text-white" />
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
