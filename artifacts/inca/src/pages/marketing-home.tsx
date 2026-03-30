import { Link } from "wouter";
import { Brain, ChevronRight, Shield, Eye, Activity, Search, BarChart3, ArrowRight, Network, GitBranch, Database, Lock, FileText, CheckCircle, Zap, Users, AlertTriangle, Layers, Target } from "lucide-react";
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
  Critical: "text-red-400 bg-red-400/8 border-red-400/20",
  High: "text-orange-400 bg-orange-400/8 border-orange-400/20",
  Medium: "text-amber-400 bg-amber-400/8 border-amber-400/20",
  Low: "text-emerald-400 bg-emerald-400/8 border-emerald-400/20",
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

const platformModules = [
  {
    icon: Network,
    name: "Quipu Command",
    desc: "The central intelligence command interface. Orchestrate agents, review findings, and manage investigation workflows from a single surface.",
    tag: "Core",
  },
  {
    icon: Brain,
    name: "Dual-Mind Monitor",
    desc: "Parallel AI reasoning with independent validation layers. Every high-stakes finding is reviewed by two model pathways before surfacing.",
    tag: "Intelligence",
  },
  {
    icon: Eye,
    name: "Willaq Umu Oracle",
    desc: "Predictive intelligence engine. Surfaces what's likely to happen before it does, using pattern analysis across historical signal data.",
    tag: "Predictive",
  },
  {
    icon: GitBranch,
    name: "Chasqui Relay",
    desc: "Cross-system signal relay and routing. Distributes intelligence findings to the right analyst, team, or downstream workflow automatically.",
    tag: "Routing",
  },
  {
    icon: Database,
    name: "Model Registry",
    desc: "Centralized governance for all AI models. Version tracking, performance benchmarking, and deployment controls in one place.",
    tag: "Governance",
  },
  {
    icon: Zap,
    name: "Agent Spawner",
    desc: "Dynamic agent instantiation for specialized investigation tasks. Deploy targeted intelligence agents on demand for specific signal types.",
    tag: "Advanced",
  },
];

const useCases = [
  {
    icon: AlertTriangle,
    title: "Threat Intelligence",
    desc: "Aggregate, classify, and triage threat signals from across your infrastructure. Structured findings with explainable AI rationale — not just alert noise.",
  },
  {
    icon: Search,
    title: "Fraud Detection",
    desc: "Pattern recognition across transaction flows, user behavior, and system access. INCA connects signals that human analysts would miss across disconnected data sources.",
  },
  {
    icon: FileText,
    title: "Compliance Monitoring",
    desc: "Continuous observation of process adherence, policy violations, and regulatory signals — with full audit trail for every finding and decision.",
  },
  {
    icon: Users,
    title: "Insider Risk",
    desc: "Behavioral analysis across access patterns, data movement, and communication signals — with structured findings that escalate through defined approval chains.",
  },
];

const securityFeatures = [
  { label: "Multi-tenant isolation", desc: "Data and models are isolated per tenant. No cross-tenant signal leakage." },
  { label: "Role-based access controls", desc: "Granular permissions scoped to roles, teams, and investigation types." },
  { label: "Immutable audit log", desc: "Every action, decision, and data access is permanently recorded." },
  { label: "End-to-end encryption", desc: "Data at rest and in transit encrypted with enterprise-grade standards." },
  { label: "SOC 2 alignment", desc: "Controls designed for SOC 2 Type II compliance requirements." },
  { label: "Air-gap deployment options", desc: "Isolated deployment configurations available for classified environments." },
];

function NeuralNetwork() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let animFrame: number;
    const nodes: { x: number; y: number; vx: number; vy: number }[] = [];
    const resize = () => { canvas.width = canvas.offsetWidth * 2; canvas.height = canvas.offsetHeight * 2; };
    resize();
    window.addEventListener("resize", resize);
    for (let i = 0; i < 40; i++) {
      nodes.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, vx: (Math.random() - 0.5) * 0.5, vy: (Math.random() - 0.5) * 0.5 });
    }
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const t = Date.now() * 0.001;
      const pulse = 0.5 + 0.5 * Math.sin(t * 0.8);
      nodes.forEach((n) => {
        n.x += n.vx; n.y += n.vy;
        if (n.x < 0 || n.x > canvas.width) n.vx *= -1;
        if (n.y < 0 || n.y > canvas.height) n.vy *= -1;
        ctx.beginPath();
        ctx.arc(n.x, n.y, 2 + pulse, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(139,92,246,${0.15 + 0.1 * pulse})`;
        ctx.fill();
      });
      nodes.forEach((a, i) => {
        nodes.slice(i + 1).forEach((b) => {
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d > 200) return;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.lineWidth = 1;
          ctx.strokeStyle = `rgba(139,92,246,${0.08 * pulse})`;
          ctx.stroke();
        });
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

      <section className="relative flex items-center justify-center pt-20 pb-12 sm:pt-24 sm:pb-16 lg:pt-28 lg:pb-20 overflow-hidden" style={{ minHeight: "min(85vh, 760px)" }}>
        <NeuralNetwork />
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[500px] bg-[radial-gradient(ellipse,rgba(124,58,237,0.06)_0%,transparent_70%)]" />
        </div>
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-16 text-center">
          <m.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-violet-500/20 bg-violet-500/6 text-violet-400/80 text-[11px] font-medium tracking-[0.08em] uppercase mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
              AI Research Command Center
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-[4.5rem] font-bold leading-[1.05] tracking-[-0.025em] text-violet-50 mb-6">
              Intelligence at scale.<br />
              <span className="bg-gradient-to-r from-violet-400 to-purple-300 bg-clip-text text-transparent">Decisions you can trace.</span>
            </h1>
            <p className="text-violet-300/50 text-base sm:text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
              Explainable AI triage and auditable decisions for enterprise teams.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/request-access">
                <button className="flex items-center gap-2 px-7 py-3.5 rounded-lg text-[14px] font-semibold text-white bg-violet-600 hover:bg-violet-500 transition-all shadow-lg shadow-violet-600/20">
                  Schedule a private walkthrough <ChevronRight className="w-4 h-4" />
                </button>
              </Link>
              <Link href="/dashboard">
                <button className="flex items-center gap-2 px-7 py-3.5 rounded-lg text-[14px] font-medium text-violet-300/55 border border-violet-500/20 hover:border-violet-500/40 hover:text-violet-200 transition-all">
                  Access the platform
                </button>
              </Link>
            </div>
          </m.div>

          <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-3xl mx-auto">
            {stats.map((s) => (
              <div key={s.label}>
                <p className="text-2xl sm:text-3xl font-bold text-violet-300/80">{s.value}</p>
                <p className="text-[11px] text-violet-400/35 mt-1 tracking-wide">{s.label}</p>
              </div>
            ))}
          </m.div>
        </div>
      </section>

      {/* Signal preview */}
      <section className="border-t border-violet-500/10 bg-[#0a0814]/50 py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-8">
            <p className="text-[11px] font-semibold text-violet-400/60 tracking-[0.15em] uppercase mb-3">Live Signal Feed</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-violet-100 mb-3">Real threats. Traceable decisions.</h2>
            <p className="text-violet-300/40 text-[14px] max-w-xl mx-auto">Continuous signal processing with explainable reasoning.</p>
          </div>
          <div className="space-y-3">
            {signalFindings.map((s, i) => (
              <m.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.12 }}
                className="flex items-start gap-4 bg-[#0d0a1a]/80 border border-violet-500/10 rounded-lg px-4 py-3.5"
              >
                <div className={`text-[9px] font-semibold px-2 py-1 rounded-full border whitespace-nowrap mt-0.5 ${severityColors[s.severity]}`}>
                  {s.severity}
                </div>
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

      {/* What INCA Does */}
      <section className="border-t border-violet-500/10 py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 lg:gap-20 items-start">
            <div>
              <p className="text-[11px] font-semibold text-violet-400/60 tracking-[0.15em] uppercase mb-3">The Platform</p>
              <h2 className="text-2xl md:text-3xl font-bold text-violet-50 mb-5 leading-tight">
                Structured visibility.<br />Explainable AI triage.<br />Auditable decisions.
              </h2>
              <p className="text-violet-300/45 text-[14px] leading-relaxed mb-4">
                INCA is an agentic intelligence platform built for operations where the quality of decisions — and the ability to explain them — directly affects outcomes, accountability, and trust.
              </p>
              <p className="text-violet-300/45 text-[14px] leading-relaxed">
                It aggregates signals across your enterprise, applies machine reasoning to surface what matters, and routes findings through structured decision workflows — with every step traceable and every decision attributable.
              </p>
            </div>
            <div className="space-y-4">
              {[
                { label: "Structured visibility", desc: "Intelligence signals organized, classified, and searchable — not scattered across disconnected systems." },
                { label: "Explainable AI triage", desc: "Every AI output includes the reasoning chain that produced it. Analysts understand the why, not just the what." },
                { label: "Auditable decisions", desc: "Full decision trail from signal acquisition to final resolution. Every step is logged, every action is attributable." },
                { label: "Agentic workflows", desc: "Specialized agents handle investigation, relay, classification, and escalation — orchestrated through the Quipu Command interface." },
              ].map((item) => (
                <div key={item.label} className="flex gap-3 p-4 rounded-lg bg-violet-500/4 border border-violet-500/10">
                  <CheckCircle className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[13px] font-semibold text-violet-100 mb-1">{item.label}</p>
                    <p className="text-violet-300/40 text-[12px] leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Capabilities */}
      <section className="border-t border-violet-500/10 bg-[#0a0814]/40 py-16 sm:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12 sm:mb-16">
            <p className="text-[11px] font-semibold text-violet-400/60 tracking-[0.15em] uppercase mb-3">Core Capabilities</p>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-violet-50 mb-4">Built for intelligence-first operations</h2>
            <p className="text-violet-300/40 text-[14px] sm:text-[15px] max-w-2xl mx-auto">From signal ingestion to explainable decision output.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {capabilities.map((c, i) => (
              <m.div key={c.title} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }} className="group bg-[#0d0a1a]/60 border border-violet-500/8 hover:border-violet-500/20 rounded-xl p-5 sm:p-6 transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <c.icon className="w-5 h-5 text-violet-400" />
                  <span className="text-[9px] font-semibold text-violet-400/40 bg-violet-500/6 px-2 py-0.5 rounded">{c.tag}</span>
                </div>
                <h3 className="text-[14px] font-semibold text-violet-100 mb-2">{c.title}</h3>
                <p className="text-violet-300/35 text-[12.5px] leading-relaxed">{c.desc}</p>
              </m.div>
            ))}
          </div>
        </div>
      </section>

      {/* Platform Modules */}
      <section className="border-t border-violet-500/10 py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="mb-12">
            <p className="text-[11px] font-semibold text-violet-400/60 tracking-[0.15em] uppercase mb-3">Platform Modules</p>
            <h2 className="text-2xl md:text-3xl font-bold text-violet-50 mb-3">Six specialized intelligence modules.</h2>
            <p className="text-violet-300/40 text-[14px] max-w-xl">An agentic platform built from specialized components — each purpose-built for a specific layer of the intelligence workflow.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {platformModules.map((mod, i) => (
              <m.div
                key={mod.name}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
                className="bg-[#0d0a1a]/60 border border-violet-500/10 rounded-xl p-5 hover:border-violet-500/25 transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <mod.icon className="w-4 h-4 text-violet-400" />
                  <span className="text-[9px] font-semibold text-amber-400/70 bg-amber-400/8 border border-amber-400/15 px-2 py-0.5 rounded">{mod.tag}</span>
                </div>
                <h3 className="text-[13.5px] font-semibold text-violet-100 mb-2">{mod.name}</h3>
                <p className="text-violet-300/35 text-[12px] leading-relaxed">{mod.desc}</p>
              </m.div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="border-t border-violet-500/10 bg-[#0a0814]/40 py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <p className="text-[11px] font-semibold text-violet-400/60 tracking-[0.15em] uppercase mb-3">Use Cases</p>
            <h2 className="text-2xl md:text-3xl font-bold text-violet-50 mb-3">Where INCA operates.</h2>
            <p className="text-violet-300/40 text-[14px] max-w-lg mx-auto">
              Purpose-built for operations where intelligence quality, decision accountability, and audit trail are not optional.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-5">
            {useCases.map((uc, i) => (
              <m.div
                key={uc.title}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="flex gap-4 p-5 rounded-xl bg-[#0d0a1a]/60 border border-violet-500/10"
              >
                <div className="w-9 h-9 rounded-lg bg-violet-500/8 border border-violet-500/15 flex items-center justify-center shrink-0">
                  <uc.icon className="w-4 h-4 text-violet-400" />
                </div>
                <div>
                  <h3 className="text-[14px] font-semibold text-violet-100 mb-1.5">{uc.title}</h3>
                  <p className="text-violet-300/40 text-[12.5px] leading-relaxed">{uc.desc}</p>
                </div>
              </m.div>
            ))}
          </div>
        </div>
      </section>

      {/* Security & Compliance */}
      <section className="border-t border-violet-500/10 py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-start">
            <div>
              <p className="text-[11px] font-semibold text-violet-400/60 tracking-[0.15em] uppercase mb-3">Security & Compliance</p>
              <h2 className="text-2xl md:text-3xl font-bold text-violet-50 mb-5">
                Enterprise-grade security at every layer.
              </h2>
              <p className="text-violet-300/45 text-[14px] leading-relaxed mb-5">
                INCA is built for environments where security is a first-order concern. Multi-tenant isolation, immutable audit trails, and role-based access controls are built into the platform architecture — not added on.
              </p>
              <Link href="/security" className="inline-flex items-center gap-1.5 text-[13px] font-medium text-violet-400 hover:text-violet-300 transition-colors">
                View security architecture <ArrowRight size={13} />
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {securityFeatures.map((f) => (
                <div key={f.label} className="flex gap-3 items-start p-3.5 rounded-lg bg-violet-500/4 border border-violet-500/10">
                  <Lock className="w-3.5 h-3.5 text-violet-400/70 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[12.5px] font-semibold text-violet-200 mb-0.5">{f.label}</p>
                    <p className="text-violet-300/35 text-[11.5px]">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Request access CTA */}
      <section className="border-t border-violet-500/10 bg-[#0a0814]/40 py-20">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <m.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="text-2xl md:text-3xl font-bold text-violet-50 mb-4">Request access to INCA</h2>
            <p className="text-violet-300/40 text-[14px] mb-8 leading-relaxed">
              INCA is available to qualified enterprise teams. Schedule a private walkthrough to understand whether it's the right fit for your operation.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/request-access">
                <button className="px-8 py-4 rounded-lg text-[14px] font-bold text-violet-50 bg-violet-600 hover:bg-violet-500 transition-colors shadow-lg shadow-violet-600/20">
                  Schedule a private walkthrough
                </button>
              </Link>
              <Link href="/capabilities">
                <button className="flex items-center gap-2 px-7 py-4 rounded-lg text-[14px] font-medium text-violet-300/55 border border-violet-500/20 hover:border-violet-500/40 hover:text-violet-200 transition-all">
                  Explore capabilities <ArrowRight size={13} />
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
