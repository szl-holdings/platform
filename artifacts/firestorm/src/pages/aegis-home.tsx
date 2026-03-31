import { Link } from "wouter";
import { Shield, ChevronRight, Activity, AlertTriangle, Target, Eye, Brain, Zap, BarChart3, Lock, ArrowRight, Layers, Users, Server, Network, Plus, Database, Cpu } from "lucide-react";
import { motion as m } from "framer-motion";
import { useEffect, useRef, useState } from "react";

const threatFeed = [
  { type: "Critical", title: "Lateral movement detected — domain controller pivot attempt", source: "SOC · Endpoint XDR", time: "2 min ago", color: "text-red-400 bg-red-500/10 border-red-500/20" },
  { type: "High", title: "SLA breach risk: TKT-8821 escalated to P1 — client Nexus Corp", source: "Ops · Service Desk", time: "8 min ago", color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
  { type: "Intel", title: "Quipu Engine: anomaly model confidence 94% — threat vector identified", source: "Intelligence · Quipu Command", time: "15 min ago", color: "text-violet-400 bg-violet-500/10 border-violet-500/20" },
  { type: "High", title: "Privilege escalation via service account misuse — AD abuse pattern", source: "SOC · Identity Threat", time: "41 min ago", color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
];

const modules = [
  {
    id: "security",
    icon: Shield,
    title: "Security Operations",
    color: "text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/20",
    badge: "SOC Command",
    desc: "Unified XDR, SOC dashboard, MITRE ATT&CK, adversary emulation, forensics, identity threat detection, compliance readiness, and the Sacsayhuamán Shield.",
    href: "/soc",
    features: ["SOC Dashboard", "MITRE ATT&CK", "XDR Console", "Threat Hunting", "Forensics", "Sacsayhuamán Shield"],
  },
  {
    id: "operations",
    icon: Server,
    title: "Managed Operations",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    badge: "MSP Command",
    desc: "NOC operations, RMM console, client management, ticket queue, SLA tracking, technician dispatch, revenue analytics, and MRR dashboards.",
    href: "/ops/dashboard",
    features: ["NOC Operations", "Client Accounts", "Ticket Queue", "RMM Console", "Dispatch", "MRR Dashboard"],
  },
  {
    id: "intelligence",
    icon: Brain,
    title: "Intelligence Engine",
    color: "text-violet-400",
    bg: "bg-violet-500/10",
    border: "border-violet-500/20",
    badge: "AI Research",
    desc: "Quipu Command agent orchestration, Chasqui Relay intelligence routing, model registry, experiment tracking, neural explorer, and the Willaq Umu Oracle.",
    href: "/intel/dashboard",
    features: ["Quipu Command", "Chasqui Relay", "Model Registry", "Neural Explorer", "Agent Spawner", "Willaq Umu"],
  },
];

const stats = [
  { value: "3 Modules", label: "Unified command surface" },
  { value: "< 4min", label: "Mean time to detect" },
  { value: "99.1%", label: "Managed device uptime" },
  { value: "94%", label: "AI model confidence avg" },
];

function AegisParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let animFrame: number;
    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
    resize();
    window.addEventListener("resize", resize);
    const colors = ["rgba(99,102,241,", "rgba(59,130,246,", "rgba(139,92,246,"];
    const pts: Array<{ x: number; y: number; vx: number; vy: number; r: number; o: number; ci: number }> = [];
    for (let i = 0; i < 50; i++) {
      pts.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, vx: (Math.random() - 0.5) * 0.25, vy: (Math.random() - 0.5) * 0.25, r: Math.random() * 1.5 + 0.4, o: Math.random() * 0.25 + 0.05, ci: Math.floor(Math.random() * 3) });
    }
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      pts.forEach(p => { p.x += p.vx; p.y += p.vy; if (p.x < 0 || p.x > canvas.width) p.vx *= -1; if (p.y < 0 || p.y > canvas.height) p.vy *= -1; });
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y, d = Math.sqrt(dx * dx + dy * dy);
          if (d < 130) {
            ctx.beginPath();
            ctx.strokeStyle = `${colors[pts[i].ci]}${0.05 * (1 - d / 130)})`;
            ctx.lineWidth = 0.5;
            ctx.moveTo(pts[i].x, pts[i].y);
            ctx.lineTo(pts[j].x, pts[j].y);
            ctx.stroke();
          }
        }
        ctx.beginPath();
        ctx.arc(pts[i].x, pts[i].y, pts[i].r, 0, Math.PI * 2);
        ctx.fillStyle = `${colors[pts[i].ci]}${pts[i].o})`;
        ctx.fill();
      }
      animFrame = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(animFrame); window.removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none opacity-60" />;
}

export default function AegisHomePage() {
  return (
    <div className="min-h-screen bg-[#0A0D14] text-white">
      {/* Hero */}
      <section className="relative min-h-[90vh] flex flex-col items-center justify-center px-6 py-24 overflow-hidden">
        <AegisParticles />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0A0D14]/10 to-[#0A0D14] pointer-events-none" />

        <div className="relative z-10 max-w-5xl mx-auto text-center">
          <m.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/25 bg-indigo-500/8 text-indigo-300 text-xs font-mono uppercase tracking-widest mb-8"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
            SZL Holdings · Aegis Platform · Operator Command
          </m.div>

          <m.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl md:text-7xl font-bold tracking-tight mb-6"
            style={{ background: "linear-gradient(135deg, #e2e8f0 30%, #818cf8 70%, #6366f1)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}
          >
            One Platform.<br />Total Command.
          </m.h1>

          <m.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg text-white/55 max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Aegis unifies Security Operations, Managed Services, and AI Intelligence into one elite command surface.
            SOC command. MSP operations. Agentic intelligence. No silos. No context switching. No compromise.
          </m.p>

          <m.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-wrap gap-3 justify-center"
          >
            <Link href="/soc">
              <div className="flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all cursor-pointer shadow-lg shadow-indigo-500/20">
                <Shield className="w-4 h-4" />
                Enter SOC Command
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </Link>
            <Link href="/ops/dashboard">
              <div className="flex items-center gap-2 px-6 py-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/8 text-white/80 font-semibold text-sm transition-all cursor-pointer">
                <Server className="w-4 h-4" />
                Managed Operations
              </div>
            </Link>
            <Link href="/intel/dashboard">
              <div className="flex items-center gap-2 px-6 py-3 rounded-xl border border-violet-500/20 bg-violet-500/8 hover:bg-violet-500/12 text-violet-300 font-semibold text-sm transition-all cursor-pointer">
                <Brain className="w-4 h-4" />
                Intelligence Engine
              </div>
            </Link>
          </m.div>
        </div>

        {/* Live threat feed ticker */}
        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="absolute bottom-8 left-0 right-0 px-6"
        >
          <div className="max-w-4xl mx-auto rounded-xl border border-white/6 bg-white/3 backdrop-blur-sm p-3 space-y-1.5">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
              <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Live Cross-Platform Signal Feed</span>
            </div>
            {threatFeed.map((item, i) => (
              <div key={i} className="flex items-center gap-2.5 text-xs">
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold border ${item.color}`}>{item.type}</span>
                <span className="text-white/70 flex-1 truncate">{item.title}</span>
                <span className="text-white/30 text-[10px] shrink-0">{item.source}</span>
                <span className="text-white/25 text-[10px] shrink-0">{item.time}</span>
              </div>
            ))}
          </div>
        </m.div>
      </section>

      {/* Stats */}
      <section className="px-6 py-12 border-y border-white/5">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <m.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="text-center"
            >
              <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
              <div className="text-xs text-white/40">{stat.label}</div>
            </m.div>
          ))}
        </div>
      </section>

      {/* Three Modules */}
      <section className="px-6 py-20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-3">Three Modules. One Command Surface.</h2>
            <p className="text-white/45 max-w-xl mx-auto">Best-in-class capabilities across security, operations, and intelligence — unified under one platform, one navigation, one context.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {modules.map((mod, i) => {
              const Icon = mod.icon;
              return (
                <m.div
                  key={mod.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                >
                  <Link href={mod.href}>
                    <div className={`group p-6 rounded-2xl border ${mod.border} bg-white/3 hover:bg-white/5 transition-all cursor-pointer h-full flex flex-col`}>
                      <div className="flex items-start justify-between mb-4">
                        <div className={`w-10 h-10 rounded-xl ${mod.bg} flex items-center justify-center`}>
                          <Icon className={`w-5 h-5 ${mod.color}`} />
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${mod.bg} ${mod.color} border ${mod.border}`}>{mod.badge}</span>
                      </div>
                      <h3 className="text-base font-bold text-white mb-2">{mod.title}</h3>
                      <p className="text-sm text-white/45 leading-relaxed mb-4 flex-1">{mod.desc}</p>
                      <div className="space-y-1.5">
                        {mod.features.map(f => (
                          <div key={f} className="flex items-center gap-2 text-xs text-white/40">
                            <ChevronRight className={`w-3 h-3 ${mod.color} opacity-60`} />
                            {f}
                          </div>
                        ))}
                      </div>
                      <div className={`flex items-center gap-1.5 mt-4 text-xs font-medium ${mod.color} group-hover:gap-2.5 transition-all`}>
                        Enter module
                        <ArrowRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </Link>
                </m.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 w-12 h-12 rounded-xl bg-indigo-500/15 border border-indigo-500/25 justify-center mb-6 mx-auto">
            <Shield className="w-6 h-6 text-indigo-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Ready to operate at the Aegis level?</h2>
          <p className="text-white/45 mb-8">Enter any module — or use the ⌘K command palette to navigate instantly across Security Operations, Managed Operations, and Intelligence Engine.</p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link href="/soc">
              <div className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-all cursor-pointer">
                <Shield className="w-4 h-4" />
                SOC Dashboard
              </div>
            </Link>
            <Link href="/ops/noc">
              <div className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/8 text-white/70 text-sm font-semibold transition-all cursor-pointer">
                <Activity className="w-4 h-4" />
                NOC Operations
              </div>
            </Link>
            <Link href="/intel/quipu-command">
              <div className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-violet-500/20 bg-violet-500/8 hover:bg-violet-500/12 text-violet-300 text-sm font-semibold transition-all cursor-pointer">
                <Network className="w-4 h-4" />
                Quipu Command
              </div>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
