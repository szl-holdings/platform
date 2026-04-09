import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { ContactModal, NoiseGrain, CustomCursor, MagneticButton, ThreatTicker, WordReveal } from "@szl-holdings/shared-ui";
import { Link } from "wouter";
import {
  Shield, ArrowRight, Layers, Server, Brain, Eye, Target,
  Lock, Users, Network, Menu, X,
  ChevronRight, Activity, FileSearch, AlertTriangle, Cpu, Radio,
} from "lucide-react";

const THREAT_FEED_FALLBACK = [
  "APT29 lateral movement detected — enterprise client network — contained in < 4 min",
  "Ransomware pre-cursor pattern identified on DC-PROD-03 — hunting query deployed automatically",
  "OFAC screening flag: vessel MT Pacific Star — dark AIS activity window detected — escalated",
  "Identity threat: brute-force on Azure AD tenant — conditional access policy triggered",
  "Vendor contract expiry: 3 active projects at risk — $2.1M delivery exposure — remediation routed",
  "MITRE ATT&CK mapping: TA0006 Credential Access — 94% model confidence — SOC notified",
  "SLA breach predicted: managed client Northgate — auto-notification triggered — 18 min ahead",
  "Supply chain anomaly: firmware update from unverified publisher — quarantine initiated",
];

const BG = "#080a10";

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

const convergences = [
  { from: "Defense", to: "Command", icon: AlertTriangle, desc: "Incident INC-2847 impacts managed client Northgate. Lateral movement on DC-PROD-03 triggers automatic SLA escalation, client notification, and containment protocol — before the client knows.", color: "#ef4444", toColor: "#3b82f6" },
  { from: "Labs", to: "Defense", icon: Brain, desc: "Neural explorer detects anomalous pattern matching APT29 TTPs. Intelligence model confidence: 94%. MITRE mapping and hunting queries generated automatically. Defense SOC receives enriched alert in < 60 seconds.", color: "#8b5cf6", toColor: "#ef4444" },
  { from: "Command", to: "Labs", icon: Radio, desc: "Service desk ticket volume anomaly across 3 managed clients. Labs ingests the signal, generates churn risk model, and surfaces preventive actions to Command — within the same operating session.", color: "#3b82f6", toColor: "#8b5cf6" },
];

const operatingModel = [
  { phase: "OBSERVE", desc: "Ingest telemetry, logs, alerts, and signals from every connected surface — endpoints, networks, cloud, tickets, models.", icon: Eye, color: "rgba(255,255,255,0.15)" },
  { phase: "UNDERSTAND", desc: "Correlate signals across modules. A threat in Defense becomes a service risk in Command. A model output in Labs becomes a detection rule.", icon: FileSearch, color: "rgba(255,255,255,0.15)" },
  { phase: "DECIDE", desc: "Surface prioritized recommendations with evidence, confidence, and business impact. Every decision carries an audit trail.", icon: Target, color: "rgba(255,255,255,0.15)" },
  { phase: "EXECUTE", desc: "Route actions to the right person or automation. Contain, remediate, escalate, or approve — with full context and accountability.", icon: Activity, color: "rgba(255,255,255,0.15)" },
];

function useInView(threshold = 0.12) {
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

function Reveal({ children, className = "", delay = 0, immediate = false }: { children: React.ReactNode; className?: string; delay?: number; immediate?: boolean }) {
  const { ref, visible } = useInView();
  const show = immediate || visible;
  return (
    <div ref={ref} className={`transition-all duration-1000 ease-out ${show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"} ${className}`} style={{ transitionDelay: immediate ? "0ms" : `${delay}ms` }}>
      {children}
    </div>
  );
}

export default function AegisHomePage() {
  const [mobileNav, setMobileNav] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeWs, setActiveWs] = useState(0);
  const [demoOpen, setDemoOpen] = useState(false);
  const [threatFeed, setThreatFeed] = useState<string[]>(THREAT_FEED_FALLBACK);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  useEffect(() => {
    fetch("/api/intelligence/threats")
      .then((r) => r.json())
      .then((d) => {
        const items: Array<{ name: string; severity: string; country: string; targetSector: string }> =
          Array.isArray(d?.data) ? d.data : [];
        if (items.length > 0) {
          setThreatFeed(
            items.map((t) => `${t.severity.toUpperCase()}: ${t.name} [${t.country}] — ${t.targetSector}`)
          );
        }
      })
      .catch(() => {});
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.2, ease: "easeIn" } }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="min-h-screen text-slate-300 overflow-x-hidden"
      style={{ background: BG, fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      <NoiseGrain opacity={0.03} />
      <CustomCursor variant="crosshair" color="rgba(239,68,68,0.55)" />

      <nav className={`fixed top-0 left-0 right-0 z-50 h-14 flex items-center transition-all duration-500 ${scrolled ? "bg-[#080a10]/90 backdrop-blur-2xl border-b border-red-500/[0.06]" : "bg-transparent"}`}>
        <div className="max-w-[1200px] mx-auto px-6 w-full flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)" }}>
              <Shield size={13} className="text-red-400" />
            </div>
            <span className="font-bold text-[15px] tracking-tight text-white">Aegis</span>
            <span className="hidden sm:inline text-[9px] tracking-[0.15em] uppercase text-white/15 font-mono ml-1">Defense & Intelligence</span>
          </div>
          <div className="hidden md:flex items-center gap-7">
            {[{ label: "Use Cases", href: "/use-cases" }, { label: "Security", href: "/security" }, { label: "Pricing", href: "/pricing" }].map(l => (
              <Link key={l.label} href={l.href}><span className="text-[11px] text-white/30 hover:text-white/60 transition-colors tracking-[0.08em] uppercase font-medium cursor-pointer">{l.label}</span></Link>
            ))}
            <Link href="/soc">
              <span className="text-[12px] font-semibold text-white bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] rounded-lg px-5 py-1.5 transition-all cursor-pointer">Enter Platform</span>
            </Link>
          </div>
          <button className="md:hidden p-2 text-white/40" onClick={() => setMobileNav(!mobileNav)} aria-label={mobileNav ? "Close menu" : "Open menu"} aria-expanded={mobileNav}>
            {mobileNav ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      {mobileNav && (
        <div className="fixed inset-0 z-40 bg-[#080a10]/98 backdrop-blur-xl flex flex-col items-center justify-center gap-8 md:hidden">
          {[{ label: "Use Cases", href: "/use-cases" }, { label: "Security", href: "/security" }, { label: "Pricing", href: "/pricing" }].map(l => (
            <Link key={l.label} href={l.href}><span onClick={() => setMobileNav(false)} className="text-lg text-white/50 hover:text-white tracking-wide transition-colors cursor-pointer">{l.label}</span></Link>
          ))}
          <Link href="/soc">
            <span className="mt-4 text-sm font-semibold text-white bg-white/[0.08] rounded-lg px-8 py-3 cursor-pointer" onClick={() => setMobileNav(false)}>Enter Platform</span>
          </Link>
        </div>
      )}

      <div className="absolute top-0 left-0 right-0 h-[800px] overflow-hidden pointer-events-none">
        <div className="absolute top-[100px] left-[20%] w-[600px] h-[400px] rounded-full" style={{ background: "radial-gradient(ellipse, rgba(239,68,68,0.03) 0%, transparent 70%)" }} />
        <div className="absolute top-[200px] right-[15%] w-[500px] h-[400px] rounded-full" style={{ background: "radial-gradient(ellipse, rgba(139,92,246,0.02) 0%, transparent 70%)" }} />
      </div>

      <div className="pt-14">
        <ThreatTicker items={threatFeed} label="THREAT INTEL" bgColor="rgba(8,10,16,0.95)" color="rgba(239,68,68,0.55)" />
      </div>

      <section className="relative pt-20 sm:pt-28 pb-20 sm:pb-28 max-w-[1200px] mx-auto px-6">
        <Reveal immediate>
          <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-white/30 mb-8 font-mono">SZL Holdings &middot; Unified Defense & Intelligence</p>
        </Reveal>

        <Reveal immediate>
          <WordReveal
            text="Three workspaces."
            as="h1"
            delay={0.1}
            stagger={0.07}
            className="text-[clamp(2.5rem,6vw,4.5rem)] font-extrabold leading-[1.04] tracking-[-0.03em] text-white max-w-[900px]"
          />
        </Reveal>
        <Reveal immediate>
          <WordReveal
            text="One shared intelligence layer."
            as="h1"
            delay={0.35}
            stagger={0.05}
            className="text-[clamp(2.5rem,6vw,4.5rem)] font-extrabold leading-[1.04] tracking-[-0.03em] max-w-[900px] mb-8"
            style={{ color: "rgba(255,255,255,0.5)" }}
          />
        </Reveal>

        <Reveal immediate>
          <p className="text-[17px] sm:text-[19px] leading-[1.75] text-white/45 max-w-[640px] mb-12">
            Aegis unifies security operations, managed services, and AI-driven intelligence
            into a single console. Defense detects. Command operates. Labs reasons.
            All three share one data context, one correlation engine, one operating model.
          </p>
        </Reveal>

        <Reveal immediate>
          <div className="flex flex-wrap gap-3 mb-20">
            <MagneticButton>
              <Link href="/soc">
                <span className="text-[13px] font-semibold bg-white/[0.07] hover:bg-white/[0.12] text-white border border-white/[0.08] rounded-lg px-7 py-3 flex items-center gap-2 transition-all cursor-pointer" style={{ boxShadow: "0 0 28px rgba(239,68,68,0.08)" }}>
                  Enter SOC Command <ArrowRight size={14} />
                </span>
              </Link>
            </MagneticButton>
            <MagneticButton>
              <button
                onClick={() => setDemoOpen(true)}
                className="text-[13px] font-medium text-white/60 hover:text-white border border-white/[0.06] hover:border-white/[0.20] rounded-lg px-7 py-3 transition-all"
              >
                Request a Demo
              </button>
            </MagneticButton>
          </div>
        </Reveal>

        <Reveal immediate>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-px rounded-xl overflow-hidden" style={{ background: "rgba(255,255,255,0.04)" }}>
            {[
              { value: "< 4 min", label: "Mean time to detect" },
              { value: "99.1%", label: "Managed device uptime" },
              { value: "94%", label: "AI model confidence" },
              { value: "12.8K", label: "Endpoints managed" },
            ].map(s => (
              <div key={s.label} className="bg-[#080a10] py-5 px-5">
                <span className="text-[22px] font-extrabold font-mono text-white block">{s.value}</span>
                <span className="text-[10px] tracking-[0.08em] uppercase text-white/35 mt-1 block">{s.label}</span>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      <Reveal>
        <section id="architecture" className="relative py-24 sm:py-32 px-6">
          <div className="max-w-[1200px] mx-auto">
            <div className="max-w-[600px] mb-16">
              <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-white/15 mb-4">Architecture</p>
              <h2 className="text-[clamp(1.5rem,3.5vw,2.5rem)] font-bold leading-[1.15] tracking-tight text-white mb-4">
                One platform. Three operating surfaces.
              </h2>
              <p className="text-[16px] leading-[1.8] text-white/28">
                Each workspace is a full operating environment for its domain. Together, they share
                a unified data context — a threat in Defense informs a service risk in Command,
                and a Labs model improves detection in real time.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-6">
              <div className="flex lg:flex-col gap-1">
                {workspaces.map((ws, i) => (
                  <button
                    key={ws.id}
                    onClick={() => setActiveWs(i)}
                    className="flex items-center gap-2.5 px-4 py-3 rounded-xl text-left transition-all w-full"
                    style={{
                      background: activeWs === i ? `${ws.color}08` : "transparent",
                      border: `1px solid ${activeWs === i ? `${ws.color}20` : "transparent"}`,
                    }}
                  >
                    <ws.icon size={16} style={{ color: activeWs === i ? ws.color : "rgba(255,255,255,0.15)" }} />
                    <div>
                      <span className={`text-[13px] font-semibold block ${activeWs === i ? "text-white" : "text-white/40"}`}>{ws.name}</span>
                      <span className="text-[10px] text-white/15">{ws.subtitle}</span>
                    </div>
                  </button>
                ))}
              </div>

              <div className="border border-white/[0.05] rounded-2xl p-8 sm:p-10 transition-all" style={{ background: `${workspaces[activeWs].color}03` }}>
                <div className="flex items-center gap-3 mb-2">
                  {(() => { const Icon = workspaces[activeWs].icon; return <Icon size={22} style={{ color: workspaces[activeWs].color }} />; })()}
                  <h3 className="text-[22px] font-bold text-white">{workspaces[activeWs].name}</h3>
                </div>
                <p className="text-[12px] font-semibold tracking-[0.12em] uppercase mb-8" style={{ color: workspaces[activeWs].color }}>{workspaces[activeWs].subtitle}</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {workspaces[activeWs].capabilities.map(cap => (
                    <div key={cap} className="flex items-start gap-2.5 py-2">
                      <div className="w-1 h-1 rounded-full mt-[7px] shrink-0" style={{ background: workspaces[activeWs].color, opacity: 0.4 }} />
                      <span className="text-[13px] leading-relaxed text-white/40">{cap}</span>
                    </div>
                  ))}
                </div>

                <Link href={workspaces[activeWs].href}>
                  <span className="mt-8 inline-flex items-center gap-2 text-[12px] font-semibold rounded-lg px-5 py-2.5 cursor-pointer transition-all" style={{ background: `${workspaces[activeWs].color}10`, color: workspaces[activeWs].color, border: `1px solid ${workspaces[activeWs].color}20` }}>
                    Enter {workspaces[activeWs].name} <ArrowRight size={12} />
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section id="convergence" className="relative py-24 sm:py-32 px-6">
          <div className="max-w-[900px] mx-auto">
            <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-white/15 mb-4">Convergence</p>
            <h2 className="text-[clamp(1.5rem,3.5vw,2.5rem)] font-bold leading-[1.15] tracking-tight text-white mb-4">
              Cross-module intelligence in action
            </h2>
            <p className="text-[16px] leading-[1.8] text-white/28 mb-16 max-w-[560px]">
              The real power of Aegis is convergence. When Defense, Command, and Labs share
              one data layer, correlations emerge that siloed tools miss entirely.
            </p>

            <div className="flex flex-col gap-4">
              {convergences.map((c, i) => (
                <div key={i} className="border border-white/[0.05] rounded-2xl p-7 sm:p-8 transition-all hover:border-white/[0.08]">
                  <div className="flex items-center gap-3 mb-5">
                    <span className="text-[11px] font-bold px-3 py-1 rounded-lg" style={{ background: `${c.color}10`, color: c.color }}>{c.from}</span>
                    <div className="flex items-center gap-1">
                      <div className="w-8 h-px" style={{ background: `linear-gradient(90deg, ${c.color}40, ${c.toColor}40)` }} />
                      <ChevronRight size={10} className="text-white/10" />
                    </div>
                    <span className="text-[11px] font-bold px-3 py-1 rounded-lg" style={{ background: `${c.toColor}10`, color: c.toColor }}>{c.to}</span>
                  </div>
                  <p className="text-[14px] leading-[1.85] text-white/35">{c.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section id="model" className="relative py-24 sm:py-32 px-6">
          <div className="max-w-[1200px] mx-auto">
            <div className="max-w-[560px] mb-16">
              <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-white/15 mb-4">Operating Model</p>
              <h2 className="text-[clamp(1.5rem,3.5vw,2.5rem)] font-bold leading-[1.15] tracking-tight text-white mb-4">
                Observe. Understand. Decide. Execute.
              </h2>
              <p className="text-[16px] leading-[1.8] text-white/28">
                The same decision framework whether you're triaging a breach,
                managing an SLA, or validating a model. One loop. Every domain.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.04)" }}>
              {operatingModel.map((step, i) => (
                <div key={step.phase} className="bg-[#080a10] p-8">
                  <div className="flex items-center gap-3 mb-5">
                    <span className="text-[36px] font-extrabold text-white/[0.04] font-mono leading-none">{String(i + 1).padStart(2, "0")}</span>
                  </div>
                  <step.icon size={20} className="text-white/12 mb-4" />
                  <h3 className="text-[13px] font-bold text-white uppercase tracking-[0.1em] mb-3">{step.phase}</h3>
                  <p className="text-[12px] leading-[1.85] text-white/28">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section className="relative py-24 sm:py-32 px-6">
          <div className="max-w-[1200px] mx-auto">
            <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-white/15 mb-6">Why One Platform</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-px rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.04)" }}>
              {[
                { icon: Lock, title: "One security context", desc: "Shared authentication, shared RBAC, shared audit trails. No credential sprawl. No integration tax. One identity model across Defense, Command, and Labs." },
                { icon: Layers, title: "One data layer", desc: "Incidents, endpoints, tickets, models, and intelligence all live in one database. Cross-module queries are native — not piped through APIs." },
                { icon: Cpu, title: "One correlation engine", desc: "Every signal — threat, service event, model output — passes through the same engine. Patterns that span modules surface automatically." },
                { icon: Eye, title: "One operating model", desc: "OBSERVE \u2192 UNDERSTAND \u2192 DECIDE \u2192 EXECUTE. The same decision framework applies whether you're triaging a breach or validating a model." },
              ].map(item => (
                <div key={item.title} className="bg-[#080a10] p-8">
                  <item.icon size={20} className="text-white/10 mb-5" />
                  <h3 className="text-[14px] font-bold text-white mb-3">{item.title}</h3>
                  <p className="text-[12px] leading-[1.85] text-white/28">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </Reveal>

      {/* PRODUCT TOUR */}
      <Reveal>
        <section className="py-24 sm:py-32 px-6 max-w-[1140px] mx-auto">
          <div className="text-center mb-16">
            <p className="text-[10px] font-mono tracking-[0.3em] uppercase mb-3 text-red-400/50">Platform Walkthrough</p>
            <h2 className="text-[clamp(1.6rem,3vw,2.1rem)] font-bold text-white mb-3 tracking-tight">How Aegis works in practice</h2>
            <p className="text-[14px] max-w-xl mx-auto text-white/25">From deployment to full command in under an hour. Three workspaces, one unified console.</p>
          </div>
          <div className="relative">
            <div className="hidden md:block absolute left-[39px] top-0 bottom-0 w-px bg-white/[0.03]" />
            <div className="space-y-10">
              {[
                { step: "01", title: "Provision your workspace", body: "Choose your deployment model — cloud, on-premises, or air-gapped. Ingest your first data sources: endpoint telemetry, network flows, identity events. Aegis normalizes everything into a unified event schema.", tag: "Setup" },
                { step: "02", title: "SOC command activates immediately", body: "The SOC dashboard surfaces your threat landscape within minutes of ingestion: active alerts, open incidents, MITRE ATT&CK coverage gaps, and CVE exposure. No tuning period. No custom rules required to get started.", tag: "Detection" },
                { step: "03", title: "Incidents route with full context", body: "Every incident carries a full evidence chain — correlated events, affected assets, MITRE technique mapping, and recommended response. Analysts see what happened, how, and what to do next.", tag: "Response" },
                { step: "04", title: "Compliance readiness runs continuously", body: "Framework scorecards track your posture against NIST, SOC 2, ISO 27001, and others in real-time. Every control maps to your actual configuration — not a point-in-time assessment.", tag: "Compliance" },
                { step: "05", title: "Intelligence layer compounds over time", body: "Sentinel's reasoning engine learns your environment. Anomaly baselines improve. False positive rates drop. Each week, the command surface gets more precise — without manual tuning.", tag: "Intelligence" },
              ].map((item) => (
                <div key={item.step} className="flex items-start gap-8 md:gap-10">
                  <div className="flex-shrink-0 w-20 text-right">
                    <div className="inline-flex items-center justify-center w-10 h-10 rounded-full text-[11px] font-bold bg-red-500/10 text-red-400 border border-red-500/20">{item.step}</div>
                  </div>
                  <div className="flex-1 pb-10 border-b border-white/[0.03]">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-[16px] font-semibold text-white">{item.title}</h3>
                      <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-red-500/8 text-red-400/60 border border-red-500/10">{item.tag}</span>
                    </div>
                    <p className="text-[13.5px] leading-relaxed text-white/35">{item.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </Reveal>

      {/* SOCIAL PROOF */}
      <Reveal>
        <section className="py-24 sm:py-32 px-6 border-t border-white/[0.04]">
          <div className="max-w-[1140px] mx-auto">
            <div className="text-center mb-14">
              <p className="text-[10px] font-mono tracking-[0.3em] uppercase mb-3 text-red-400/50">Documented Results</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 tracking-tight">Deployed in production environments.</h2>
              <p className="text-white/25 text-[14px] max-w-xl mx-auto">From Fortune 500 security operations to federal compliance programs — Aegis delivers measurable outcomes under real adversarial pressure.</p>
            </div>

            <div className="mb-14">
              <p className="text-center text-[10px] font-semibold uppercase tracking-[0.2em] mb-7 text-white/15">Trusted by enterprise security and compliance teams</p>
              <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
                {[
                  "Meridian Financial Group",
                  "Nexus Health Systems",
                  "Arcturus Energy Corp",
                  "Delphi Technologies",
                  "Solstice Capital Partners",
                  "Vantage Infrastructure",
                ].map((name) => (
                  <span key={name} className="text-[12px] font-semibold tracking-wide text-white/20">{name}</span>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-white/[0.04] rounded-xl overflow-hidden mb-14">
              {[
                { metric: "< 4 min", label: "Mean time to detect", detail: "Correlated threat detection from ingestion to analyst alert across all connected telemetry sources." },
                { metric: "99.1%", label: "Managed device uptime", detail: "NOC-managed endpoints maintained across all client environments, including remote and hybrid deployments." },
                { metric: "94%", label: "AI model confidence", detail: "Sentinel reasoning engine confidence across automated threat classification and priority scoring." },
                { metric: "3 Fortune 500", label: "Enterprise clients", detail: "Security simulation and SOC command deployed at scale across multi-division enterprise environments." },
              ].map((p, i) => (
                <Reveal key={p.label} delay={i * 70}>
                  <div className="p-7 bg-[#080a10]">
                    <span className="text-[2rem] font-extrabold font-mono block mb-1 text-red-400">{p.metric}</span>
                    <p className="text-[11px] font-bold text-white mb-1.5">{p.label}</p>
                    <p className="text-[11px] leading-[1.7] text-white/25">{p.detail}</p>
                  </div>
                </Reveal>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-12">
              {[
                { quote: "We had three separate security tools, a manual compliance process, and no unified picture of our threat posture. Aegis replaced all three. SOC command, compliance scorecards, and the MSP ops console in one console. The first week, we caught a lateral movement attempt we would have missed.", attribution: "VP Security Operations, Financial Services Firm", context: "3,200 endpoints, SOC 2 Type II compliance mandate" },
                { quote: "The MITRE ATT&CK integration is the most mature we've evaluated. Every incident comes back mapped to techniques, with hunting queries pre-generated. Our mean time to contain dropped from 47 minutes to under 8 minutes in the first month.", attribution: "Head of Incident Response, Enterprise Technology Company", context: "Fortune 500, hybrid cloud environment" },
                { quote: "Aegis doesn't feel like a vendor product — it feels like it was built by people who actually ran a SOC. The convergence between Labs and Defense is real. We caught an insider threat because the Labs anomaly model flagged a pattern that our SIEM never would have surfaced.", attribution: "CISO, Healthcare Network", context: "12 hospitals, HIPAA compliance environment" },
              ].map((t, i) => (
                <Reveal key={i} delay={i * 80}>
                  <div className="p-7 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                    <p className="text-[14px] leading-[1.85] mb-5 italic text-white/45">"{t.quote}"</p>
                    <p className="text-[12px] font-semibold text-white">{t.attribution}</p>
                    <p className="text-[11px] text-white/25 mt-0.5">{t.context}</p>
                  </div>
                </Reveal>
              ))}
            </div>

            <div className="p-6 rounded-xl bg-white/[0.02] border border-white/[0.05]">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <p className="text-[13px] font-semibold text-white mb-1">Part of the SZL Holdings platform family</p>
                  <p className="text-[12px] text-white/30">Aegis runs on SZL's shared security infrastructure — SOC 2 compliant, enterprise-grade. <a href="/szl-holdings/" className="underline text-red-400/50 hover:text-red-400/80 transition-colors">View SZL Holdings →</a></p>
                </div>
                <div className="flex gap-3 shrink-0">
                  <a href="/szl-holdings/" className="text-[11px] px-3 py-1.5 rounded-lg text-white/30 border border-white/[0.08] hover:text-white/60 transition-colors">SZL Holdings →</a>
                </div>
              </div>
            </div>
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section className="relative py-24 sm:py-32 px-6">
          <div className="max-w-[640px] mx-auto text-center">
            <h2 className="text-[clamp(1.5rem,3.5vw,2.25rem)] font-bold text-white mb-4 tracking-tight">
              Total command. Zero compromise.
            </h2>
            <p className="text-[16px] text-white/28 mb-10">
              See what unified defense, operations, and intelligence looks like in one console.
            </p>
            <div className="flex justify-center flex-wrap gap-3">
              <Link href="/soc">
                <span className="text-[14px] font-semibold bg-white/[0.07] hover:bg-white/[0.12] text-white border border-white/[0.08] rounded-lg px-8 py-3.5 flex items-center gap-2 transition-all cursor-pointer">
                  Enter SOC Command <ArrowRight size={15} />
                </span>
              </Link>
              <button onClick={() => setDemoOpen(true)} className="text-[14px] font-medium text-white/35 border border-white/[0.06] hover:border-white/[0.12] rounded-lg px-8 py-3.5 transition-all">
                Schedule a Demo
              </button>
            </div>
          </div>
        </section>
      </Reveal>

      <footer className="border-t border-white/[0.04] py-12 px-6 max-w-[1200px] mx-auto">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2.5">
              <Shield size={12} className="text-white/15" />
              <span className="text-[12px] font-semibold text-white/25">Aegis</span>
              <span className="text-[10px] text-white/15 font-mono">An SZL Holdings Company</span>
            </div>
            <div className="flex items-center gap-4">
              {[
                { name: "Lyte", href: "/lyte-command-center/" },
                { name: "Vessels", href: "/vessels/" },
                { name: "Terra", href: "/terra/" },
                { name: "PRISM Counsel", href: "/prism-counsel/" },
                { name: "SZL Holdings", href: "/szl-holdings/" },
              ].map(l => (
                <a key={l.name} href={l.href} className="text-[10px] text-white/15 hover:text-white/40 transition-colors">{l.name}</a>
              ))}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
            <p className="text-[10px] text-white/15">&copy; 2026 SZL Holdings. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <a href="https://x.com/szlholdings" target="_blank" rel="noopener noreferrer" className="text-[10px] text-white/15 hover:text-white/35 transition-colors">X</a>
              <a href="https://linkedin.com/company/szlholdings" target="_blank" rel="noopener noreferrer" className="text-[10px] text-white/15 hover:text-white/35 transition-colors">LinkedIn</a>
              <a href="/legal/privacy" className="text-[10px] text-white/15 hover:text-white/35 transition-colors">Privacy</a>
              <a href="/legal/terms" className="text-[10px] text-white/15 hover:text-white/35 transition-colors">Terms</a>
              <a href="/security" className="text-[10px] text-white/15 hover:text-white/35 transition-colors">Security</a>
            </div>
          </div>
        </div>
      </footer>

      <ContactModal
        isOpen={demoOpen}
        onClose={() => setDemoOpen(false)}
        type="demo"
        app="aegis"
        subtitle="Aegis — Unified Defense & Intelligence Command"
      />
    </motion.div>
  );
}
