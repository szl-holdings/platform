import { Link } from "wouter";
import { Ship, ChevronRight, Shield, BarChart3, AlertTriangle, Activity, MapPin, DollarSign, ArrowRight, Anchor, Navigation, Globe, Waves, Eye, Zap, Clock, TrendingUp } from "lucide-react";
import { MarketingNav } from "@/components/MarketingNav";
import { MarketingFooter } from "@/components/MarketingFooter";
import { motion as m } from "framer-motion";
import { useEffect, useRef } from "react";

const kpis = [
  { metric: "84%", label: "On-time arrival rate" },
  { metric: "$1.2M", label: "Delay exposure mitigated" },
  { metric: "91%", label: "Fleet utilization" },
  { metric: "3.2h", label: "Avg exception resolution" },
];

const capabilities = [
  { icon: Globe, title: "Fleet Command", desc: "Live positions, ETAs, and port data — one unified view.", tag: "Core" },
  { icon: AlertTriangle, title: "Exception Center", desc: "Prioritized alerts with business context and response actions.", tag: "Intelligence" },
  { icon: DollarSign, title: "Voyage Economics", desc: "Revenue, cost, and margin per voyage in real time.", tag: "Commercial" },
  { icon: Shield, title: "Sanctions & Compliance", desc: "Automated screening, dark vessel detection, and monitoring.", tag: "Security" },
  { icon: BarChart3, title: "Performance Analytics", desc: "Utilization, delay trends, and corridor profitability dashboards.", tag: "Analytics" },
  { icon: Activity, title: "Command Mode", desc: "Focused dashboard for time-sensitive decisions.", tag: "Operations" },
  { icon: Navigation, title: "Route Intelligence", desc: "Weather-adjusted routing and corridor performance data.", tag: "Planning" },
  { icon: Anchor, title: "Port Analytics", desc: "Congestion forecasting and turnaround benchmarking.", tag: "Intelligence" },
];

const useCases = [
  { role: "Fleet Executives", headline: "Strategic confidence, not status updates.", desc: "Portfolio margins, exception exposure, and board-ready metrics — no assembly required.", icon: TrendingUp },
  { role: "Operations Teams", headline: "See what matters. Act before it escalates.", desc: "Exception triage, vessel status, and ETA deviation — one interface, full context.", icon: Eye },
  { role: "Commercial Teams", headline: "Voyage economics, not just positions.", desc: "Charter performance and route profitability per voyage. Negotiate from data.", icon: DollarSign },
];

const trustSignals = [
  { value: "200+", label: "Vessels tracked" },
  { value: "47", label: "Countries covered" },
  { value: "99.97%", label: "Platform uptime" },
  { value: "SOC 2", label: "Compliant" },
];

function OceanGrid() {
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
      time += 0.003;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = "rgba(14,165,233,0.04)";
      ctx.lineWidth = 0.5;
      for (let y = 0; y < canvas.height; y += 40) {
        ctx.beginPath();
        for (let x = 0; x < canvas.width; x += 2) {
          const wave = Math.sin(x * 0.008 + time + y * 0.01) * 6;
          if (x === 0) ctx.moveTo(x, y + wave);
          else ctx.lineTo(x, y + wave);
        }
        ctx.stroke();
      }
      const pts = [
        { x: canvas.width * 0.2, y: canvas.height * 0.3 },
        { x: canvas.width * 0.35, y: canvas.height * 0.6 },
        { x: canvas.width * 0.55, y: canvas.height * 0.25 },
        { x: canvas.width * 0.7, y: canvas.height * 0.5 },
        { x: canvas.width * 0.85, y: canvas.height * 0.35 },
      ];
      pts.forEach((p, i) => {
        const pulse = Math.sin(time * 2 + i) * 0.3 + 0.7;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(56,189,248,${0.6 * pulse})`;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(p.x, p.y, 8, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(56,189,248,${0.15 * pulse})`;
        ctx.stroke();
      });
      for (let i = 0; i < pts.length - 1; i++) {
        ctx.beginPath();
        ctx.moveTo(pts[i].x, pts[i].y);
        ctx.lineTo(pts[i + 1].x, pts[i + 1].y);
        ctx.strokeStyle = "rgba(56,189,248,0.06)";
        ctx.setLineDash([4, 8]);
        ctx.stroke();
        ctx.setLineDash([]);
      }
      animFrame = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(animFrame); window.removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />;
}

export default function MarketingHomePage() {
  return (
    <div className="min-h-screen bg-[#060e1a] text-sky-50 overflow-x-hidden">
      <MarketingNav />

      <section className="relative min-h-screen flex items-center justify-center pt-16 overflow-hidden">
        <OceanGrid />
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[500px] bg-[radial-gradient(ellipse,rgba(14,165,233,0.06)_0%,transparent_70%)]" />
          <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-sky-500/20 to-transparent" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <m.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-sky-500/20 bg-sky-500/5 mb-8">
            <Ship className="w-3.5 h-3.5 text-sky-400" />
            <span className="text-[11px] font-semibold text-sky-400/80 tracking-[0.1em] uppercase">Maritime Intelligence Platform</span>
          </m.div>

          <m.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.1 }} className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.05] tracking-tight mb-6">
            Turn fleet visibility{" "}
            <span className="bg-gradient-to-r from-sky-300 via-cyan-400 to-teal-400 bg-clip-text text-transparent">
              into operational command.
            </span>
          </m.h1>

          <p className="text-base sm:text-lg text-sky-300/50 max-w-2xl mx-auto mb-10 leading-relaxed">
            Fleet operations, voyage economics, and maritime risk — one command platform.
          </p>

          <m.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }} className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/demo">
              <button className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-400 hover:to-cyan-400 text-[#060e1a] font-bold rounded-xl transition-all text-[14px] shadow-lg shadow-sky-500/20">
                Request a private demo <ChevronRight className="w-4 h-4" />
              </button>
            </Link>
            <Link href="/dashboard">
              <button className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-sky-500/8 hover:bg-sky-500/12 border border-sky-500/15 text-sky-300 font-medium rounded-xl transition-all text-[14px]">
                Open dashboard <Activity className="w-4 h-4" />
              </button>
            </Link>
          </m.div>
        </div>
      </section>

      <section className="border-y border-sky-500/10 bg-[#0a1628]/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10 grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
          {kpis.map((k, i) => (
            <m.div key={k.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 + i * 0.1 }} className="text-center">
              <p className="font-bold text-2xl sm:text-3xl bg-gradient-to-r from-sky-300 to-cyan-400 bg-clip-text text-transparent mb-1">{k.metric}</p>
              <p className="text-[11px] sm:text-[12px] text-sky-400/40">{k.label}</p>
            </m.div>
          ))}
        </div>
      </section>

      <section className="py-16 sm:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12 sm:mb-16">
            <p className="text-[11px] font-semibold text-sky-400/60 tracking-[0.15em] uppercase mb-3">Capabilities</p>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-sky-50 mb-4">Every layer of fleet intelligence</h2>
            <p className="text-sky-300/40 text-[14px] sm:text-[15px] max-w-2xl mx-auto">Positions to economics. Everything your operations team needs.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {capabilities.map((c, i) => (
              <m.div key={c.title} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }} className="group bg-[#0a1628]/60 border border-sky-500/8 hover:border-sky-500/20 rounded-xl p-5 sm:p-6 transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-sky-500/10 to-cyan-500/10 border border-sky-500/10 flex items-center justify-center">
                    <c.icon className="w-5 h-5 text-sky-400" />
                  </div>
                  <span className="text-[9px] font-semibold text-sky-400/40 tracking-[0.1em] uppercase">{c.tag}</span>
                </div>
                <h3 className="text-[14px] font-semibold text-sky-100 mb-2">{c.title}</h3>
                <p className="text-sky-300/35 text-[12.5px] leading-relaxed">{c.desc}</p>
              </m.div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-sky-500/10 bg-[#0a1628]/40 py-16 sm:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <p className="text-[11px] font-semibold text-sky-400/60 tracking-[0.15em] uppercase mb-3">Built for</p>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-sky-50">Who uses Vessels</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5 sm:gap-6">
            {useCases.map((u, i) => (
              <m.div key={u.role} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="border border-sky-500/10 hover:border-sky-400/20 rounded-xl p-6 sm:p-7 transition-all duration-300 bg-[#0a1628]/30">
                <div className="w-10 h-10 rounded-lg bg-sky-500/8 border border-sky-500/10 flex items-center justify-center mb-4">
                  <u.icon className="w-5 h-5 text-sky-400" />
                </div>
                <p className="text-[10px] font-bold text-sky-400/60 uppercase tracking-[0.12em] mb-3">{u.role}</p>
                <h3 className="text-[17px] font-bold text-sky-100 mb-3 leading-snug">{u.headline}</h3>
                <p className="text-sky-300/35 text-[13px] leading-relaxed">{u.desc}</p>
              </m.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-24 border-t border-sky-500/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-[11px] font-semibold text-sky-400/60 tracking-[0.15em] uppercase mb-4">Platform</p>
              <h2 className="text-2xl sm:text-3xl font-bold text-sky-50 mb-6">Command-grade infrastructure</h2>
              <div className="space-y-4">
                {[
                  { label: "Real-time AIS ingestion", desc: "Sub-minute positions with historical replay." },
                  { label: "Multi-tenant architecture", desc: "Complete data isolation with role-based access control per team and vessel group." },
                  { label: "API-first design", desc: "Every data point accessible via REST and webhook — integrate with your existing stack." },
                  { label: "Enterprise security", desc: "SOC 2 compliant, encrypted at rest and in transit, with audit logging on every action." },
                ].map(item => (
                  <div key={item.label} className="flex gap-3">
                    <div className="mt-1 w-5 h-5 rounded-full bg-sky-500/10 border border-sky-500/15 flex items-center justify-center shrink-0">
                      <Shield className="w-2.5 h-2.5 text-sky-400" />
                    </div>
                    <div>
                      <p className="text-[14px] font-semibold text-sky-100">{item.label}</p>
                      <p className="text-[12px] text-sky-300/35">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-[#0a1628]/80 border border-sky-500/10 rounded-2xl p-6 sm:p-8">
              <div className="text-center mb-6">
                <p className="text-[11px] font-semibold text-sky-400/40 tracking-[0.1em] uppercase mb-2">Fleet Snapshot</p>
              </div>
              <div className="space-y-5">
                {[
                  { label: "Active vessels", value: "214" },
                  { label: "Voyages in progress", value: "89" },
                  { label: "Open exceptions", value: "12" },
                  { label: "Ports monitored", value: "340+" },
                  { label: "Data points / day", value: "4.2M" },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between border-b border-sky-500/8 pb-3 last:border-0 last:pb-0">
                    <span className="text-[13px] text-sky-300/40">{item.label}</span>
                    <span className="text-[14px] font-mono font-bold text-sky-100">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-10 sm:py-12 border-t border-sky-500/10 bg-[#0a1628]/30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
          {trustSignals.map((t, i) => (
            <m.div key={t.label} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }} className="text-center">
              <p className="text-xl sm:text-2xl font-bold text-sky-200">{t.value}</p>
              <p className="text-[11px] text-sky-400/35 mt-1">{t.label}</p>
            </m.div>
          ))}
        </div>
      </section>

      <section className="py-16 sm:py-24 border-t border-sky-500/10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <m.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-sky-50 mb-4">
              Ready to see Vessels{" "}
              <span className="bg-gradient-to-r from-sky-300 to-cyan-400 bg-clip-text text-transparent">in action?</span>
            </h2>
            <p className="text-sky-300/40 text-[15px] mb-10 max-w-xl mx-auto leading-relaxed">
              A private demo tailored to your fleet and operational profile.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/demo">
                <button className="w-full sm:w-auto px-10 py-4 bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-400 hover:to-cyan-400 text-[#060e1a] font-bold rounded-xl transition-all text-[15px] shadow-lg shadow-sky-500/20">
                  Request a private demo
                </button>
              </Link>
              <Link href="/dashboard">
                <button className="w-full sm:w-auto px-8 py-4 text-[14px] text-sky-400/60 hover:text-sky-300 transition-colors font-medium">
                  Explore the platform <ArrowRight className="w-4 h-4 inline ml-1" />
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
