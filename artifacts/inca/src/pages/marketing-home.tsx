import { Link } from "wouter";
import { Brain, ChevronRight, Shield, Eye, Activity, Search, BarChart3, ArrowRight, Layers, Target, Zap, Lock, GitBranch, AlertTriangle } from "lucide-react";
import { MarketingNav } from "@/components/MarketingNav";
import { MarketingFooter } from "@/components/MarketingFooter";
import { motion as m } from "framer-motion";
import { useEffect, useRef } from "react";

const signalFindings = [
  { type: "Threat Signal", title: "Coordinated infrastructure reconnaissance detected across three regions", severity: "Critical", time: "2 min ago" },
  { type: "Intelligence Finding", title: "Anomalous credential access pattern — multi-tenant lateral movement", severity: "High", time: "14 min ago" },
  { type: "Model Alert", title: "Prediction drift in classification layer — confidence threshold breached", severity: "Medium", time: "1 hr ago" },
  { type: "Pattern Match", title: "Historical correlation: matches known APT-29 infrastructure fingerprint", severity: "High", time: "2 hr ago" },
];

const severityColors: Record<string, string> = {
  Critical: "text-red-400 bg-red-500/10 border-red-500/20",
  High: "text-orange-400 bg-orange-500/10 border-orange-500/20",
  Medium: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  Low: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
};

const capabilities = [
  { icon: Search, title: "Signal Ingestion", desc: "Unified intelligence pipeline across structured and unstructured sources. Every signal normalized, enriched, and indexed.", tag: "Core" },
  { icon: Brain, title: "AI Triage Engine", desc: "Machine-assisted prioritization with explainable scoring. Analysts see why a signal matters, not just that it does.", tag: "Intelligence" },
  { icon: Eye, title: "Explainability Layer", desc: "Every model output includes traceable reasoning chains — audit-ready decision support, not black-box scores.", tag: "Trust" },
  { icon: GitBranch, title: "Decision Workflows", desc: "Structured triage, escalation, and resolution workflows with full audit trail from signal to action.", tag: "Operations" },
  { icon: Shield, title: "Secure Architecture", desc: "Multi-tenant isolation, role-based access, and enterprise-grade encryption with zero-trust principles.", tag: "Security" },
  { icon: BarChart3, title: "Analytical Dashboards", desc: "Custom views across threat landscape, signal volume, model performance, and team response metrics.", tag: "Analytics" },
  { icon: Layers, title: "Knowledge Graph", desc: "Entity-relationship mapping across signals, actors, and infrastructure — discover hidden patterns.", tag: "Intelligence" },
  { icon: Target, title: "Adversary Profiles", desc: "TTPs, infrastructure fingerprints, and historical campaign data for known and emerging threat actors.", tag: "Research" },
];

const stats = [
  { value: "< 90s", label: "Signal-to-insight latency" },
  { value: "2.4M", label: "Signals processed / day" },
  { value: "97.3%", label: "Triage accuracy" },
  { value: "340+", label: "Detection models active" },
];

function NeuralNetwork() {
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
    const nodes: Array<{ x: number; y: number; layer: number }> = [];
    const layers = [4, 6, 8, 6, 4];
    layers.forEach((count, l) => {
      for (let i = 0; i < count; i++) {
        nodes.push({
          x: (l + 1) / (layers.length + 1) * canvas.width,
          y: (i + 1) / (count + 1) * canvas.height,
          layer: l,
        });
      }
    });
    const draw = () => {
      time += 0.008;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          if (Math.abs(nodes[i].layer - nodes[j].layer) === 1) {
            const pulse = Math.sin(time + i * 0.3 + j * 0.2) * 0.5 + 0.5;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.strokeStyle = `rgba(139,92,246,${0.03 * pulse})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
      nodes.forEach((n, i) => {
        const pulse = Math.sin(time * 1.5 + i * 0.7) * 0.3 + 0.7;
        ctx.beginPath();
        ctx.arc(n.x, n.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(139,92,246,${0.4 * pulse})`;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(n.x, n.y, 6, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(139,92,246,${0.08 * pulse})`;
        ctx.stroke();
      });
      animFrame = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(animFrame); window.removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />;
}

export default function IncaMarketingHome() {
  return (
    <div className="min-h-screen bg-[#060410] text-violet-50 overflow-x-hidden">
      <MarketingNav />

      <section className="relative min-h-screen flex items-center justify-center pt-16 overflow-hidden">
        <NeuralNetwork />
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[500px] bg-[radial-gradient(ellipse,rgba(124,58,237,0.06)_0%,transparent_70%)]" />
          <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-violet-500/20 to-transparent" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <m.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-violet-500/20 bg-violet-500/5 mb-8">
            <Brain className="w-3.5 h-3.5 text-violet-400" />
            <span className="text-[11px] font-semibold text-violet-400/80 tracking-[0.1em] uppercase">Agentic Intelligence Cortex</span>
          </m.div>

          <m.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.1 }} className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.05] tracking-tight mb-6">
            Intelligence at scale.{" "}
            <span className="bg-gradient-to-r from-violet-300 via-purple-400 to-fuchsia-400 bg-clip-text text-transparent">
              Decisions you can trace.
            </span>
          </m.h1>

          <m.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.2 }} className="text-base sm:text-lg text-violet-300/50 max-w-2xl mx-auto mb-10 leading-relaxed">
            INCA provides enterprise teams with structured visibility, explainable AI triage, and auditable decision workflows — for operations where accountability is non-negotiable.
          </m.p>

          <m.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }} className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/request-access">
              <button className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-bold rounded-xl transition-all text-[14px] shadow-lg shadow-violet-500/20">
                Schedule a private walkthrough <ChevronRight className="w-4 h-4" />
              </button>
            </Link>
            <Link href="/dashboard">
              <button className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-violet-500/8 hover:bg-violet-500/12 border border-violet-500/15 text-violet-300 font-medium rounded-xl transition-all text-[14px]">
                Access the platform
              </button>
            </Link>
          </m.div>
        </div>
      </section>

      <section className="border-y border-violet-500/10 bg-[#0a0814]/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10 grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
          {stats.map((s, i) => (
            <m.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 + i * 0.1 }} className="text-center">
              <p className="font-bold text-2xl sm:text-3xl bg-gradient-to-r from-violet-300 to-purple-400 bg-clip-text text-transparent mb-1">{s.value}</p>
              <p className="text-[11px] sm:text-[12px] text-violet-400/40">{s.label}</p>
            </m.div>
          ))}
        </div>
      </section>

      <section className="py-16 sm:py-24 border-b border-violet-500/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-8">
            <p className="text-[11px] font-semibold text-violet-400/60 tracking-[0.15em] uppercase mb-3">Live Signal Feed</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-violet-100 mb-3">Real threats. Traceable decisions.</h2>
            <p className="text-violet-300/40 text-[14px] max-w-xl mx-auto">INCA continuously processes, correlates, and surfaces intelligence signals with explainable reasoning.</p>
          </div>
          <div className="space-y-3">
            {signalFindings.map((s, i) => (
              <m.div key={i} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 + i * 0.12 }} className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 bg-[#0d0a1a]/80 border border-violet-500/8 rounded-xl p-4">
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border whitespace-nowrap w-fit ${severityColors[s.severity]}`}>{s.severity}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-violet-100 leading-snug">{s.title}</p>
                  <p className="text-[11px] text-violet-400/30 mt-0.5">{s.type}</p>
                </div>
                <span className="text-[10px] text-violet-400/25 shrink-0">{s.time}</span>
              </m.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12 sm:mb-16">
            <p className="text-[11px] font-semibold text-violet-400/60 tracking-[0.15em] uppercase mb-3">Capabilities</p>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-violet-50 mb-4">Built for intelligence-first operations</h2>
            <p className="text-violet-300/40 text-[14px] sm:text-[15px] max-w-2xl mx-auto">Every layer of the intelligence stack — from signal ingestion to explainable decision output.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {capabilities.map((c, i) => (
              <m.div key={c.title} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }} className="group bg-[#0d0a1a]/60 border border-violet-500/8 hover:border-violet-500/20 rounded-xl p-5 sm:p-6 transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500/10 to-purple-500/10 border border-violet-500/10 flex items-center justify-center">
                    <c.icon className="w-5 h-5 text-violet-400" />
                  </div>
                  <span className="text-[9px] font-semibold text-violet-400/35 tracking-[0.1em] uppercase">{c.tag}</span>
                </div>
                <h3 className="text-[14px] font-semibold text-violet-100 mb-2">{c.title}</h3>
                <p className="text-violet-300/35 text-[12.5px] leading-relaxed">{c.desc}</p>
              </m.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-24 border-t border-violet-500/10 bg-[#0a0814]/40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-[11px] font-semibold text-violet-400/60 tracking-[0.15em] uppercase mb-4">Why INCA</p>
              <h2 className="text-2xl sm:text-3xl font-bold text-violet-50 mb-6">Explainable. Auditable. Accountable.</h2>
              <div className="space-y-4">
                {[
                  { label: "Traceable reasoning chains", desc: "Every decision output links back to the signals, models, and rules that produced it." },
                  { label: "Audit-ready by default", desc: "Full decision logs with timestamps, analyst actions, and model confidence scores." },
                  { label: "Human-in-the-loop", desc: "AI assists — humans decide. Every automated recommendation requires explicit approval." },
                  { label: "Bias detection", desc: "Continuous model monitoring for drift, bias, and performance degradation." },
                ].map(item => (
                  <div key={item.label} className="flex gap-3">
                    <div className="mt-1 w-5 h-5 rounded-full bg-violet-500/10 border border-violet-500/15 flex items-center justify-center shrink-0">
                      <Eye className="w-2.5 h-2.5 text-violet-400" />
                    </div>
                    <div>
                      <p className="text-[14px] font-semibold text-violet-100">{item.label}</p>
                      <p className="text-[12px] text-violet-300/35">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-[#0d0a1a] border border-violet-500/10 rounded-2xl p-6 sm:p-8">
              <div className="text-center mb-6">
                <p className="text-[11px] font-semibold text-violet-400/35 tracking-[0.1em] uppercase mb-2">Platform Metrics</p>
              </div>
              <div className="space-y-5">
                {[
                  { label: "Signals ingested today", value: "2,418,726" },
                  { label: "Active detection models", value: "347" },
                  { label: "Findings surfaced", value: "89" },
                  { label: "Avg triage time", value: "4.2 min" },
                  { label: "Explainability coverage", value: "100%" },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between border-b border-violet-500/8 pb-3 last:border-0 last:pb-0">
                    <span className="text-[13px] text-violet-300/40">{item.label}</span>
                    <span className="text-[14px] font-mono font-bold text-violet-100">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-24 border-t border-violet-500/10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <m.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-violet-50 mb-4">
              Intelligence without accountability{" "}
              <span className="bg-gradient-to-r from-violet-300 to-purple-400 bg-clip-text text-transparent">is just noise.</span>
            </h2>
            <p className="text-violet-300/40 text-[15px] mb-10 max-w-xl mx-auto leading-relaxed">
              INCA is available to qualified enterprise teams. Schedule a private walkthrough to understand whether it's the right fit for your operation.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/request-access">
                <button className="w-full sm:w-auto px-10 py-4 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-bold rounded-xl transition-all text-[15px] shadow-lg shadow-violet-500/20">
                  Schedule a private walkthrough
                </button>
              </Link>
              <Link href="/dashboard">
                <button className="w-full sm:w-auto px-8 py-4 text-[14px] text-violet-400/60 hover:text-violet-300 transition-colors font-medium">
                  Access the platform <ArrowRight className="w-4 h-4 inline ml-1" />
                </button>
              </Link>
            </div>
          </m.div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
