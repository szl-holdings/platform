import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import {
  Shield, ArrowRight, Layers, Server, Brain, Eye, Target,
  Lock, Users, Network, CheckCircle, Menu, X,
  ChevronRight, Activity, BarChart3, FileSearch,
} from "lucide-react";

const BG = "#0a0d14";

const workspaces = [
  {
    id: "defense",
    name: "Defense",
    subtitle: "Security Operations",
    color: "#ef4444",
    icon: Shield,
    href: "/soc",
    capabilities: [
      "SOC command with unified XDR correlation",
      "MITRE ATT&CK mapping and adversary emulation",
      "Threat hunting, forensics, identity threat detection",
      "Vulnerability management and hardening controls",
      "Compliance readiness across frameworks",
      "Sacsayhuam\u00e1n Shield — adaptive perimeter defense",
    ],
  },
  {
    id: "command",
    name: "Command",
    subtitle: "Managed Operations",
    color: "#3b82f6",
    icon: Server,
    href: "/ops/dashboard",
    capabilities: [
      "NOC operations and RMM console",
      "Client account management and SLA tracking",
      "Ticket queue, dispatch, and technician workflow",
      "Revenue analytics and MRR dashboards",
      "Service desk and escalation management",
      "Device lifecycle and patch orchestration",
    ],
  },
  {
    id: "labs",
    name: "Labs",
    subtitle: "Intelligence Engine",
    color: "#8b5cf6",
    icon: Brain,
    href: "/intel/dashboard",
    capabilities: [
      "Quipu Command — agent orchestration",
      "Neural explorer and model registry",
      "Experiment tracking and evaluation",
      "Chasqui Relay — intelligence routing",
      "Prediction models with confidence scoring",
      "Research-to-action pipeline",
    ],
  },
];

const stats = [
  { value: "< 4 min", label: "Mean time to detect" },
  { value: "99.1%", label: "Managed device uptime" },
  { value: "94%", label: "AI model confidence" },
  { value: "3", label: "Unified workspaces" },
];

const convergences = [
  { from: "Defense", to: "Command", desc: "Incident INC-2847 impacts managed client Northgate. Lateral movement on DC-PROD-03 triggers automatic SLA escalation and client notification.", color: "#ef4444" },
  { from: "Labs", to: "Defense", desc: "Neural explorer detects anomalous pattern matching APT29 TTPs. Intelligence model confidence 94%. Automatic MITRE mapping and hunting query generation.", color: "#8b5cf6" },
  { from: "Command", to: "Labs", desc: "Service desk ticket volume anomaly detected across 3 managed clients. Labs generates churn risk model and surfaces preventive actions to Command.", color: "#3b82f6" },
];

const operatingModel = [
  { phase: "OBSERVE", desc: "Ingest telemetry, logs, alerts, and signals from every connected surface — endpoints, networks, cloud, tickets, models.", icon: Eye },
  { phase: "UNDERSTAND", desc: "Correlate signals across modules. A threat in Defense becomes a service risk in Command. A model output in Labs becomes a detection rule.", icon: FileSearch },
  { phase: "DECIDE", desc: "Surface prioritized recommendations with evidence, confidence, and business impact. Every decision carries an audit trail.", icon: Target },
  { phase: "EXECUTE", desc: "Route actions to the right person or automation. Contain, remediate, escalate, or approve — with full context and accountability.", icon: Activity },
];

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

function Section({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const { ref, visible } = useInView();
  return (
    <div ref={ref} className={`transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"} ${className}`}>
      {children}
    </div>
  );
}

export default function AegisHomePage() {
  const [mobileNav, setMobileNav] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  return (
    <div className="min-h-screen text-slate-300" style={{ background: BG, fontFamily: "'Inter', system-ui, sans-serif" }}>

      <nav className={`fixed top-0 left-0 right-0 z-50 h-14 flex items-center transition-all duration-300 ${scrolled ? "bg-[#0a0d14]/95 backdrop-blur-xl border-b border-white/[0.06] shadow-lg shadow-black/20" : "bg-transparent"}`}>
        <div className="max-w-[1120px] mx-auto px-6 w-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-[26px] h-[26px] rounded-md flex items-center justify-center" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
              <Shield size={13} className="text-red-400" />
            </div>
            <span className="font-bold text-[15px] tracking-tight text-white">Aegis</span>
          </div>
          <div className="hidden md:flex items-center gap-6">
            {[{ label: "Workspaces", href: "#workspaces" }, { label: "Convergence", href: "#convergence" }, { label: "Model", href: "#model" }].map(l => (
              <a key={l.label} href={l.href} className="text-xs text-white/40 hover:text-white/70 transition-colors tracking-wider font-medium">{l.label}</a>
            ))}
            <span className="text-[11px] text-white/20 font-mono">SZL Holdings</span>
            <Link href="/soc">
              <span className="text-xs font-semibold text-white bg-white/[0.08] hover:bg-white/[0.12] border border-white/[0.06] rounded-md px-4 py-1.5 transition-colors cursor-pointer">Enter Platform</span>
            </Link>
          </div>
          <button className="md:hidden p-2 text-white/50" onClick={() => setMobileNav(!mobileNav)}>
            {mobileNav ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      {mobileNav && (
        <div className="fixed inset-0 z-40 bg-[#0a0d14]/98 backdrop-blur-xl flex flex-col items-center justify-center gap-6 md:hidden">
          {[{ label: "Workspaces", href: "#workspaces" }, { label: "Convergence", href: "#convergence" }, { label: "Model", href: "#model" }].map(l => (
            <a key={l.label} href={l.href} onClick={() => setMobileNav(false)} className="text-lg text-white/60 hover:text-white transition-colors">{l.label}</a>
          ))}
          <Link href="/soc">
            <span className="mt-4 text-sm font-semibold text-white bg-white/[0.08] rounded-md px-6 py-2.5 cursor-pointer" onClick={() => setMobileNav(false)}>Enter Platform</span>
          </Link>
        </div>
      )}

      <section className="pt-28 sm:pt-32 pb-16 sm:pb-20 max-w-[1120px] mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-12 lg:gap-16 items-start">
          <div>
            <p className="text-[10px] font-bold tracking-[0.12em] uppercase text-white/25 mb-5 font-mono">SZL Holdings &middot; Unified Defense & Intelligence</p>
            <h1 className="text-4xl sm:text-5xl lg:text-[50px] font-extrabold leading-[1.08] tracking-tight text-slate-50 mb-6 max-w-[700px]">
              One platform.<br />
              Three workspaces.<br />
              <span className="text-white/30">One shared intelligence layer.</span>
            </h1>
            <p className="text-base sm:text-[17px] leading-relaxed text-white/40 max-w-[580px] mb-8">
              Aegis unifies security operations, managed services, and AI-driven intelligence into
              a single console. Defense detects threats. Command manages operations. Labs drives research.
              All three share one data context, one correlation engine, and one operating model.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/soc">
                <span className="text-[13px] font-semibold bg-white/[0.08] hover:bg-white/[0.12] text-slate-50 border border-white/[0.06] rounded-md px-6 py-2.5 flex items-center gap-1.5 transition-colors cursor-pointer">
                  Enter SOC Command <ArrowRight size={14} />
                </span>
              </Link>
              <button className="text-[13px] font-medium bg-transparent text-white/45 border border-white/[0.06] hover:border-white/[0.12] rounded-md px-6 py-2.5 transition-colors">
                Request a Demo
              </button>
            </div>
          </div>

          <div className="bg-white/[0.025] border border-white/[0.06] rounded-xl p-5 mt-0 lg:mt-4">
            <div className="flex justify-between items-center mb-4">
              <span className="text-[9px] font-bold tracking-wider uppercase text-white/25">Platform Status</span>
              <span className="flex items-center gap-1.5 text-[9px] font-mono text-emerald-400/70">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Operational
              </span>
            </div>
            {workspaces.map(ws => (
              <div key={ws.id} className="flex items-center gap-3 py-2.5 border-t border-white/[0.03]">
                <ws.icon size={14} style={{ color: ws.color }} className="shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-semibold text-white/70">{ws.name}</span>
                  <span className="text-[10px] text-white/25 ml-2">{ws.subtitle}</span>
                </div>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/60" />
              </div>
            ))}
            <div className="mt-3 pt-3 border-t border-white/[0.04] grid grid-cols-2 gap-2">
              <div>
                <span className="text-[10px] text-white/20">Endpoints</span>
                <p className="text-xs font-mono font-bold text-white/60">12,847</p>
              </div>
              <div>
                <span className="text-[10px] text-white/20">Managed clients</span>
                <p className="text-xs font-mono font-bold text-white/60">38</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-x-10 gap-y-4 mt-12 pt-6 border-t border-white/[0.06]">
          {stats.map(s => (
            <div key={s.label}>
              <span className="text-xl font-extrabold font-mono text-slate-50">{s.value}</span>
              <p className="text-[10px] text-white/25 uppercase tracking-wider mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      <Section>
        <section id="workspaces" className="border-t border-white/[0.06] py-16 sm:py-20 px-6 max-w-[1120px] mx-auto">
          <p className="text-[10px] font-bold tracking-[0.12em] uppercase text-white/25 mb-3">Architecture</p>
          <h2 className="text-2xl sm:text-[32px] font-bold leading-tight tracking-tight text-slate-50 mb-2">
            Three workspaces. One console.
          </h2>
          <p className="text-[15px] text-white/35 mb-12 max-w-[560px]">
            Each workspace is a full operating surface for its domain. Together, they share a unified
            data context — so a threat in Defense informs a service risk in Command, and a Labs model
            improves detection in real time.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-white/[0.06] rounded-xl overflow-hidden">
            {workspaces.map(ws => (
              <div key={ws.id} className="bg-[#0a0d14] p-6 sm:p-7">
                <div className="flex items-center gap-2.5 mb-1">
                  <ws.icon size={16} style={{ color: ws.color }} />
                  <h3 className="text-[17px] font-bold text-slate-50">{ws.name}</h3>
                </div>
                <p className="text-[11px] font-semibold tracking-wider mb-4" style={{ color: ws.color }}>{ws.subtitle}</p>
                <div className="flex flex-col gap-1.5">
                  {ws.capabilities.map(cap => (
                    <div key={cap} className="flex items-start gap-1.5">
                      <CheckCircle size={10} className="text-white/10 mt-[3px] shrink-0" />
                      <span className="text-[11.5px] leading-relaxed text-white/40">{cap}</span>
                    </div>
                  ))}
                </div>
                <Link href={ws.href}>
                  <span className="mt-5 inline-flex items-center gap-1 text-[11px] font-semibold rounded px-3.5 py-1.5 cursor-pointer transition-colors" style={{ background: `${ws.color}12`, color: ws.color, border: `1px solid ${ws.color}25` }}>
                    Enter {ws.name} <ArrowRight size={11} />
                  </span>
                </Link>
              </div>
            ))}
          </div>
        </section>
      </Section>

      <Section>
        <section id="convergence" className="border-t border-white/[0.06] py-16 sm:py-20 px-6 max-w-[1120px] mx-auto">
          <p className="text-[10px] font-bold tracking-[0.12em] uppercase text-white/25 mb-3">Convergence</p>
          <h2 className="text-2xl sm:text-[32px] font-bold leading-tight tracking-tight text-slate-50 mb-2">
            Cross-module intelligence.
          </h2>
          <p className="text-[15px] text-white/35 mb-10 max-w-[560px]">
            The real power of Aegis is convergence. When Defense, Command, and Labs share one data layer,
            correlations emerge that siloed tools miss entirely.
          </p>

          <div className="flex flex-col gap-3">
            {convergences.map((c, i) => (
              <div key={i} className="bg-white/[0.025] border border-white/[0.06] rounded-lg p-5 sm:p-6">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded" style={{ background: `${c.color}15`, color: c.color, letterSpacing: "0.04em" }}>{c.from}</span>
                  <ChevronRight size={10} className="text-white/10" />
                  <span className="text-[10px] font-bold bg-white/[0.05] text-white/45 px-2 py-0.5 rounded tracking-wider">{c.to}</span>
                </div>
                <p className="text-[12.5px] leading-relaxed text-white/40">{c.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </Section>

      <Section>
        <section id="model" className="border-t border-white/[0.06] py-16 sm:py-20 px-6 max-w-[1120px] mx-auto">
          <p className="text-[10px] font-bold tracking-[0.12em] uppercase text-white/25 mb-3">Operating Model</p>
          <h2 className="text-2xl sm:text-[32px] font-bold leading-tight tracking-tight text-slate-50 mb-2">
            Observe. Understand. Decide. Execute.
          </h2>
          <p className="text-[15px] text-white/35 mb-12 max-w-[560px]">
            The same decision framework applies whether you're triaging a breach, managing an SLA, or validating a model.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-white/[0.06] rounded-xl overflow-hidden">
            {operatingModel.map((step, i) => (
              <div key={step.phase} className="bg-[#0a0d14] p-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl font-extrabold text-white/[0.06] font-mono">{String(i + 1).padStart(2, "0")}</span>
                  <step.icon size={16} className="text-white/20" />
                </div>
                <h3 className="text-sm font-bold text-slate-50 uppercase tracking-wider mb-2">{step.phase}</h3>
                <p className="text-[12px] leading-relaxed text-white/35">{step.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </Section>

      <Section>
        <section className="border-t border-white/[0.06] py-16 sm:py-20 px-6 max-w-[1120px] mx-auto">
          <p className="text-[10px] font-bold tracking-[0.12em] uppercase text-white/25 mb-3">Why One Platform</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[
              { icon: Lock, title: "One security context", desc: "Shared authentication, shared RBAC, shared audit trails. No credential sprawl. No integration tax. One identity model across Defense, Command, and Labs." },
              { icon: Layers, title: "One data layer", desc: "Incidents, endpoints, tickets, models, and intelligence all live in one database. Cross-module queries are native — not piped through APIs." },
              { icon: Network, title: "One correlation engine", desc: "Every signal — threat, service event, model output — passes through the same correlation engine. Patterns that span modules surface automatically." },
              { icon: Eye, title: "One operating model", desc: "OBSERVE \u2192 UNDERSTAND \u2192 DECIDE \u2192 EXECUTE. The same decision framework applies whether you're triaging a breach, managing an SLA, or validating a model." },
            ].map(item => (
              <div key={item.title} className="bg-white/[0.025] border border-white/[0.06] rounded-xl p-6">
                <item.icon size={18} className="text-white/15 mb-3" />
                <h3 className="text-sm font-bold text-slate-50 mb-2">{item.title}</h3>
                <p className="text-xs leading-relaxed text-white/35">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </Section>

      <Section>
        <section className="border-t border-white/[0.06] py-16 sm:py-20 px-6 max-w-[1120px] mx-auto text-center">
          <h2 className="text-2xl sm:text-[28px] font-bold text-slate-50 mb-3">
            Total command. Zero compromise.
          </h2>
          <p className="text-[15px] text-white/35 max-w-[480px] mx-auto mb-8">
            See what unified defense, operations, and intelligence looks like in one console.
          </p>
          <div className="flex justify-center flex-wrap gap-3">
            <Link href="/soc">
              <span className="text-sm font-semibold bg-white/[0.08] hover:bg-white/[0.12] text-slate-50 border border-white/[0.06] rounded-md px-7 py-3 flex items-center gap-1.5 transition-colors cursor-pointer">
                Enter SOC Command <ArrowRight size={14} />
              </span>
            </Link>
            <Link href="/demo">
              <span className="text-sm font-medium bg-transparent text-white/45 border border-white/[0.06] hover:border-white/[0.12] rounded-md px-7 py-3 transition-colors cursor-pointer">
                Schedule a Demo
              </span>
            </Link>
          </div>
        </section>
      </Section>

      <footer className="border-t border-white/[0.06] py-10 px-6 max-w-[1120px] mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="flex items-center gap-2">
            <Shield size={12} className="text-white/20" />
            <span className="text-xs font-semibold text-white/35">Aegis</span>
            <span className="text-[10px] text-white/10 font-mono">by SZL Holdings</span>
          </div>
          <p className="text-[10px] text-white/10">&copy; {new Date().getFullYear()} SZL Holdings. All rights reserved.</p>
        </div>
      </footer>

      <div className="h-10" />
    </div>
  );
}
