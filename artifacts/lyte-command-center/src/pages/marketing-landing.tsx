import { useState, useEffect, useRef } from "react";
import { motion as m } from "framer-motion";
import { ContactModal, NoiseGrain, MagneticButton, WordReveal, SignalTicker, LiveIndicator, CinematicReveal } from "@szl-holdings/shared-ui";
import {
  ArrowRight, Activity, Eye, TrendingUp, Radio, Gauge,
  Target, Users, Shield, Zap, CheckCircle,
  Mail, Calendar, MessageSquare, FileText, Database, Cloud,
  Briefcase, HeartPulse, Factory, CreditCard, CheckSquare,
  Menu, X, Monitor, GitBranch, Network, Lock, Scale, Cpu,
} from "lucide-react";

const LYTE_SIGNALS_FALLBACK = [
  { label: "APPROVAL QUEUE", value: "14 aging", delta: "+3", color: "rgba(212,160,84,0.9)" },
  { label: "OWNERSHIP GAPS", value: "7 active", delta: "+1", color: "rgba(196,98,80,0.9)" },
  { label: "DECISION LATENCY", value: "3.4 days avg", delta: "+0.2d", color: "rgba(196,98,80,0.9)" },
  { label: "SIGNALS LIVE", value: "1,284 tracked", delta: "+22", color: "rgba(70,200,150,0.9)" },
  { label: "STUCK WORKFLOWS", value: "9 flagged", delta: "+2", color: "rgba(196,98,80,0.9)" },
  { label: "AUDIT COVERAGE", value: "100%", color: "rgba(70,200,150,0.9)" },
  { label: "CONNECTORS LIVE", value: "16 active", color: "rgba(212,160,84,0.9)" },
  { label: "RISK EXPOSURE", value: "$2.1M tracked", color: "rgba(212,160,84,0.9)" },
];

const prism = [
  { key: "P", name: "Pulse", color: "#d4a054", icon: Activity, meaning: "Business health, operating heartbeat, trend status", detail: "Pulse monitors the continuous rhythm of your operations — revenue velocity, delivery cadence, customer health, operational tempo. Not infrastructure uptime. Business uptime." },
  { key: "R", name: "Risk", color: "#c45a4a", icon: Target, meaning: "Approvals, churn, delays, ownership gaps", detail: "Risk surfaces the slow-burn threats that compound silently: aging approvals, unowned processes, regulatory drift, customer churn signals. Each risk carries a time-to-impact and business cost." },
  { key: "I", name: "Intelligence", color: "#8b7ac8", icon: Eye, meaning: "Modeled reasoning, evidence, confidence", detail: "Intelligence synthesizes signals into actionable recommendations with evidence chains and confidence scores. Not AI predictions — structured reasoning an executive can audit and trust." },
  { key: "S", name: "Signals", color: "#c8953c", icon: Radio, meaning: "Anomalies, changes, event spikes, drift", detail: "Signals captures state changes across your connected tools — a Jira queue doubling, a Salesforce pipeline stalling, a Slack channel going silent. Each signal is scored, attributed, and routed." },
  { key: "M", name: "Motion", color: "#4a90b8", icon: Gauge, meaning: "Escalations, routing, approvals, execution", detail: "Motion is the execution layer — routing decisions to the right person, escalating stalled work, triggering interventions, and tracking the velocity of organizational response." },
];

const pillars = [
  { name: "Visibility", desc: "See every operational surface — revenue pipelines, approval queues, team handoffs, customer health. If it affects outcomes, Lyte shows it." },
  { name: "Context", desc: "Signals without context are noise. Lyte connects every anomaly to the business process it impacts, the owner responsible, and the financial exposure it creates." },
  { name: "Ownership", desc: "Every process, risk, and decision has an owner. Lyte maps accountability chains so nothing falls between teams, departments, or role boundaries." },
  { name: "Prioritization", desc: "Not everything is urgent. Lyte scores every signal by business impact, time sensitivity, and confidence — so operators work on what matters." },
  { name: "Explainability", desc: "Every recommendation carries an evidence chain. No black-box AI. Executives see why something is flagged, what data supports it, and the confidence level." },
  { name: "Intervention", desc: "Visibility without action is a spectator sport. Lyte routes decisions to the right person with full context — approve, escalate, delegate, or resolve." },
  { name: "Continuous Motion", desc: "Are decisions getting faster? Are risks caught earlier? Is the organization accelerating or decelerating? Lyte tracks the velocity of improvement itself." },
];

const capabilities = [
  { title: "Ownership Mapping", desc: "Every process, approval, and risk has an accountable owner. Lyte maps responsibility chains across teams, departments, and role boundaries." },
  { title: "Approval Visibility", desc: "Track every approval queue in real-time. Age, owner, business impact, and escalation path — visible in one surface." },
  { title: "Action Routing", desc: "Route decisions to the right person with full context. Approve, escalate, delegate, or resolve — every action is tracked and auditable." },
  { title: "Signal Correlation", desc: "Connect anomalies across tools. A silent Slack channel + spiking Jira queue + missed standup = at-risk delivery. Lyte sees the pattern." },
  { title: "Business Risk Awareness", desc: "Quantify operational exposure in dollars and days. Every risk carries a financial impact estimate, time sensitivity, and confidence score." },
  { title: "Workflow Intelligence", desc: "Understand how work actually flows — not how org charts say it should. Identify bottlenecks, handoff failures, and process decay." },
];

const useCases = [
  { title: "A VP discovers a $400K revenue leak", scenario: "Three Salesforce deals stalled for 18 days. Risk flagged the ownership gap — the assigned rep had left. Intelligence surfaced 72% churn probability. Motion routed re-assignment to the sales director. All three deals closed within 10 days.", lens: "Risk + Intelligence + Motion", impact: "$400K" },
  { title: "An ops lead prevents a delivery failure", scenario: "Pulse detected 3x spike in Jira cycle time. Signals correlated it with a silent Slack channel — the lead engineer was on unplanned leave. Intelligence recommended redistributing the sprint. The CTO approved before the SLA breach.", lens: "Pulse + Signals + Intelligence", impact: "SLA saved" },
  { title: "A CFO catches $120K/month in approval drag", scenario: "Risk surfaced 14 procurement approvals aging past 30 days — each blocking vendor onboarding. Intelligence calculated cumulative delay cost. Motion escalated the batch to the COO with single-click approval. Backlog cleared in 48 hours.", lens: "Risk + Intelligence + Motion", impact: "$120K/mo" },
  { title: "Compliance catches a vendor risk before audit", scenario: "Signals detected 3 vendor contracts expiring within 60 days without renewal initiation. Risk correlated them with active projects dependent on those vendors. Intelligence calculated $2.1M in delivery exposure. Procurement initiated renewals same day.", lens: "Signals + Risk + Intelligence", impact: "$2.1M saved" },
];

const connectorsList = [
  { name: "Microsoft 365", icon: Mail }, { name: "Google Workspace", icon: Calendar },
  { name: "Slack", icon: MessageSquare }, { name: "Jira", icon: CheckSquare },
  { name: "Salesforce", icon: Briefcase }, { name: "ServiceNow", icon: Shield },
  { name: "GitHub", icon: GitBranch }, { name: "Snowflake", icon: Database },
  { name: "Azure DevOps", icon: Cloud }, { name: "HubSpot", icon: Target },
  { name: "Workday", icon: Users }, { name: "Stripe", icon: CreditCard },
  { name: "Zendesk", icon: HeartPulse }, { name: "Confluence", icon: FileText },
  { name: "SAP", icon: Factory }, { name: "NetSuite", icon: Monitor },
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

export default function LyteMarketingLanding({ onSignIn }: { onSignIn?: () => void }) {
  const [expandedPrism, setExpandedPrism] = useState<number | null>(null);
  const [mobileNav, setMobileNav] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [demoOpen, setDemoOpen] = useState(false);
  const [liveSignals, setLiveSignals] = useState(LYTE_SIGNALS_FALLBACK);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  useEffect(() => {
    // Uses /api/lyte/live/signals (auth-optional) rather than /api/lyte/signals (requires auth).
    // The live endpoint is the correct choice for the public marketing ticker — it returns
    // sanitised operational metrics without requiring a session.
    fetch("/api/lyte/live/signals")
      .then((r) => r.json())
      .then((d) => {
        const signals: Array<{ name: string; value: string; status: string }> =
          Array.isArray(d?.data?.signals) ? d.data.signals : [];
        if (signals.length > 0) {
          setLiveSignals(
            signals.map((s) => ({
              label: s.name.toUpperCase(),
              value: s.value,
              color:
                s.status === "healthy" ? "rgba(70,200,150,0.9)" :
                s.status === "critical" || s.status === "degraded" ? "rgba(196,98,80,0.9)" :
                "rgba(212,160,84,0.9)",
            }))
          );
        }
      })
      .catch(() => {});
  }, []);

  return (
    <m.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.2, ease: "easeIn" } }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="min-h-screen bg-[#0a0d14] text-slate-300 overflow-x-hidden"
      style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      <NoiseGrain opacity={0.028} />

      <nav className={`fixed top-0 left-0 right-0 z-50 h-14 flex items-center transition-all duration-500 ${scrolled ? "bg-[#0a0d14]/92 backdrop-blur-2xl border-b" : "bg-transparent border-b border-transparent"}`} style={{ borderColor: scrolled ? "rgba(212,160,84,0.06)" : "transparent" }}>
        <div className="max-w-[1140px] mx-auto px-6 w-full flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(212,160,84,0.08)", border: "1px solid rgba(212,160,84,0.15)" }}>
              <Zap size={13} style={{ color: "#d4a054" }} />
            </div>
            <span className="font-bold text-[15px] tracking-tight text-white">Lyte</span>
            <span className="hidden sm:inline text-[9px] tracking-[0.15em] uppercase font-mono ml-1" style={{ color: "rgba(255,255,255,0.12)" }}>Business Observability</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            {[
              { label: "Framework", href: "#prism" },
              { label: "Doctrine", href: "#doctrine" },
              { label: "Capabilities", href: "#capabilities" },
              { label: "Evidence", href: "#evidence" },
              { label: "Platform", href: "#platform" },
            ].map(l => (
              <a key={l.label} href={l.href} className="text-[11px] hover:text-white/50 transition-colors tracking-[0.06em] uppercase font-medium" style={{ color: "rgba(255,255,255,0.25)" }}>{l.label}</a>
            ))}
            <button onClick={onSignIn} className="text-[12px] font-semibold rounded-lg px-5 py-1.5 transition-all" style={{ background: "#d4a054", color: "#0a0d14" }}>Sign in</button>
          </div>
          <button className="md:hidden p-2" style={{ color: "rgba(255,255,255,0.4)" }} onClick={() => setMobileNav(!mobileNav)} aria-label={mobileNav ? "Close menu" : "Open menu"} aria-expanded={mobileNav}>
            {mobileNav ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      {mobileNav && (
        <div className="fixed inset-0 z-40 bg-[#0a0d14]/98 backdrop-blur-xl flex flex-col items-center justify-center gap-8 md:hidden">
          {[
            { label: "Framework", href: "#prism" },
            { label: "Doctrine", href: "#doctrine" },
            { label: "Capabilities", href: "#capabilities" },
            { label: "Evidence", href: "#evidence" },
            { label: "Platform", href: "#platform" },
          ].map(l => (
            <a key={l.label} href={l.href} onClick={() => setMobileNav(false)} className="text-lg tracking-wide transition-colors" style={{ color: "rgba(255,255,255,0.4)" }}>{l.label}</a>
          ))}
          <button onClick={() => { onSignIn?.(); setMobileNav(false); }} className="mt-4 text-sm font-semibold rounded-lg px-8 py-3" style={{ background: "#d4a054", color: "#0a0d14" }}>Sign in</button>
        </div>
      )}

      <div className="absolute top-0 left-0 right-0 h-[900px] overflow-hidden pointer-events-none">
        <div className="absolute top-[180px] left-1/2 -translate-x-1/2 w-[1000px] h-[600px] rounded-full" style={{ background: "radial-gradient(ellipse, rgba(212,160,84,0.025) 0%, transparent 65%)" }} />
      </div>

      {/* SIGNAL TICKER */}
      <div className="pt-14">
        <SignalTicker items={liveSignals} bgColor="rgba(10,13,20,0.8)" />
      </div>

      {/* HERO */}
      <section className="relative pt-20 sm:pt-28 pb-28 sm:pb-36 max-w-[1140px] mx-auto px-6">
        <Reveal immediate>
          <div className="flex items-center gap-2 mb-6">
            <p className="text-[10px] font-semibold tracking-[0.2em] uppercase font-mono" style={{ color: "rgba(212,160,84,0.65)" }}>Business Observability</p>
            <LiveIndicator color="#d4a054" showTimestamp={false} label="LIVE" />
          </div>
        </Reveal>

        <Reveal immediate>
          <WordReveal
            text="In the dark,"
            as="h1"
            delay={0.1}
            stagger={0.07}
            className="text-[clamp(2.2rem,5.5vw,4rem)] font-extrabold leading-[1.06] tracking-[-0.03em] text-white max-w-[820px] mb-3"
          />
        </Reveal>
        <Reveal immediate>
          <WordReveal
            text="let Lyte guide you."
            as="h1"
            delay={0.3}
            stagger={0.06}
            className="text-[clamp(2.2rem,5.5vw,4rem)] font-extrabold leading-[1.06] tracking-[-0.03em] max-w-[820px] mb-10"
            style={{ color: "#d4a054" }}
          />
        </Reveal>

        <Reveal immediate>
          <p className="text-[17px] sm:text-[18px] leading-[1.85] max-w-[600px] mb-14" style={{ color: "rgba(255,255,255,0.48)" }}>
            Revenue stalling. Approvals aging. Ownership gaps widening. By the time
            these surface as problems, the damage has already compounded. Lyte makes
            the invisible visible — before it costs you.
          </p>
        </Reveal>

        <Reveal immediate>
          <div className="flex flex-wrap gap-3 mb-24">
            <MagneticButton>
              <button onClick={onSignIn} className="text-[13px] font-semibold rounded-lg px-7 py-3 flex items-center gap-2 transition-all" style={{ background: "#d4a054", color: "#0a0d14", boxShadow: "0 0 28px rgba(212,160,84,0.18)" }}>
                Sign In <ArrowRight size={14} />
              </button>
            </MagneticButton>
            <MagneticButton>
              <button onClick={() => { window.location.href = "/lyte-command-center/?view=app"; }} className="text-[13px] font-medium border rounded-lg px-7 py-3 transition-all" style={{ color: "rgba(255,255,255,0.5)", borderColor: "rgba(255,255,255,0.12)" }}>
                Try Live Demo →
              </button>
            </MagneticButton>
          </div>
        </Reveal>

        <Reveal immediate>
          <div className="grid grid-cols-5 gap-px rounded-xl overflow-hidden" style={{ background: "rgba(255,255,255,0.03)" }}>
            {prism.map((p) => (
              <div key={p.key} className="bg-[#0a0d14] py-6 px-4 text-center">
                <span className="text-[28px] font-extrabold font-mono block leading-none" style={{ color: p.color }}>{p.key}</span>
                <span className="text-[9px] tracking-[0.12em] uppercase mt-2 block" style={{ color: "rgba(255,255,255,0.35)" }}>{p.name}</span>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* WHAT IS BUSINESS OBSERVABILITY */}
      <Reveal>
        <section className="relative py-28 sm:py-36 px-6">
          <div className="max-w-[720px] mx-auto">
            <p className="text-[10px] font-semibold tracking-[0.2em] uppercase mb-6" style={{ color: "rgba(255,255,255,0.15)" }}>The Category</p>
            <h2 className="text-[clamp(1.5rem,3.5vw,2.25rem)] font-bold leading-[1.2] tracking-tight text-white mb-6">
              What is Business Observability?
            </h2>
            <div className="text-[15px] leading-[2] space-y-6" style={{ color: "rgba(255,255,255,0.3)" }}>
              <p>
                Infrastructure observability solved the server. Tools like Datadog, New Relic, and Splunk
                tell you when an API is slow, a container is failing, or a log pattern shifts. These are
                solved problems.
              </p>
              <p>
                Business observability solves the <span style={{ color: "rgba(255,255,255,0.65)" }}>organization</span>. It answers the
                questions no dashboard currently answers: Why did a $400K deal stall for 18 days? Why are
                14 procurement approvals blocking $120K/month in vendor onboarding? Why has a team lead
                been silent for 72 hours while the sprint hemorrhages tickets?
              </p>
              <p>
                Lyte connects the tools your business already runs on — Salesforce, ServiceNow, Jira,
                Slack, Workday — and surfaces the operational signals that compound into risk, revenue
                loss, and execution failure.
              </p>
            </div>
          </div>

          <div className="max-w-[720px] mx-auto mt-20 grid grid-cols-1 sm:grid-cols-2 gap-px rounded-xl overflow-hidden" style={{ background: "rgba(255,255,255,0.03)" }}>
            {[
              { label: "Infrastructure Observability", items: ["Server uptime", "API latency", "Error rates", "Memory usage"], note: "Datadog, New Relic, Splunk" },
              { label: "Business Observability", items: ["Revenue velocity", "Approval aging", "Ownership gaps", "Decision latency"], note: "Lyte", highlight: true },
            ].map(col => (
              <div key={col.label} className="bg-[#0a0d14] p-8">
                <p className={`text-[10px] font-bold tracking-[0.15em] uppercase mb-5`} style={{ color: col.highlight ? "#d4a054" : "rgba(255,255,255,0.15)" }}>{col.label}</p>
                {col.items.map(item => (
                  <p key={item} className="text-[13px] py-2.5" style={{ color: col.highlight ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.22)", borderBottom: "1px solid rgba(255,255,255,0.03)" }}>{item}</p>
                ))}
                <p className="text-[10px] mt-4 font-mono" style={{ color: col.highlight ? "rgba(212,160,84,0.4)" : "rgba(255,255,255,0.08)" }}>{col.note}</p>
              </div>
            ))}
          </div>
        </section>
      </Reveal>

      {/* PRISM FRAMEWORK */}
      <Reveal>
        <section id="prism" className="relative py-28 sm:py-36 px-6">
          <div className="max-w-[1140px] mx-auto">
            <div className="max-w-[560px] mb-20">
              <p className="text-[10px] font-semibold tracking-[0.2em] uppercase mb-4" style={{ color: "rgba(255,255,255,0.15)" }}>The Analytical Framework</p>
              <h2 className="text-[clamp(1.5rem,3.5vw,2.25rem)] font-bold leading-[1.15] tracking-tight text-white mb-4">
                PRISM
              </h2>
              <p className="text-[15px] leading-[1.9]" style={{ color: "rgba(255,255,255,0.25)" }}>
                Five lenses that decompose operational complexity into structured,
                actionable intelligence. Every signal passes through PRISM before reaching a human.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-12 items-start">
              <div className="flex flex-col gap-1.5">
                {prism.map((p, i) => (
                  <button
                    key={p.key}
                    onClick={() => setExpandedPrism(expandedPrism === i ? null : i)}
                    className="text-left w-full rounded-xl px-6 py-5 border transition-all duration-300"
                    style={{
                      borderColor: expandedPrism === i ? `${p.color}25` : "rgba(255,255,255,0.03)",
                      background: expandedPrism === i ? `${p.color}06` : "rgba(255,255,255,0.012)",
                    }}
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-2xl font-extrabold font-mono w-8" style={{ color: p.color }}>{p.key}</span>
                      <div className="flex-1 min-w-0">
                        <span className="text-[15px] font-semibold text-white">{p.name}</span>
                        <span className="hidden sm:inline text-[12px] ml-3" style={{ color: "rgba(255,255,255,0.2)" }}>{p.meaning}</span>
                      </div>
                      <p.icon size={18} style={{ color: p.color, opacity: 0.35 }} className="shrink-0" />
                    </div>
                    {expandedPrism === i && (
                      <p className="text-[14px] leading-[1.85] mt-4 ml-12 max-w-[520px]" style={{ color: "rgba(255,255,255,0.35)" }}>
                        {p.detail}
                      </p>
                    )}
                  </button>
                ))}
              </div>

              <div className="rounded-2xl p-6 sticky top-24" style={{ background: "rgba(255,255,255,0.015)", border: "1px solid rgba(255,255,255,0.04)" }}>
                <div className="flex justify-between items-center mb-5">
                  <span className="text-[9px] font-bold tracking-[0.15em] uppercase" style={{ color: "rgba(255,255,255,0.15)" }}>Live PRISM Analysis</span>
                  <span className="flex items-center gap-1.5 text-[9px] font-mono" style={{ color: "rgba(212,160,84,0.4)" }}>
                    <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#d4a054" }} />
                    Streaming
                  </span>
                </div>
                {prism.map((p) => {
                  const val = 55 + Math.floor(Math.random() * 35);
                  return (
                    <div key={p.key} className="flex items-center gap-3 py-2.5" style={{ borderTop: "1px solid rgba(255,255,255,0.025)" }}>
                      <span className="text-xs font-extrabold font-mono w-4" style={{ color: p.color }}>{p.key}</span>
                      <span className="text-[11px] w-20" style={{ color: "rgba(255,255,255,0.3)" }}>{p.name}</span>
                      <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.03)" }}>
                        <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${val}%`, background: p.color, opacity: 0.5 }} />
                      </div>
                      <span className="text-[10px] font-mono w-8 text-right" style={{ color: "rgba(255,255,255,0.15)" }}>{val}</span>
                    </div>
                  );
                })}
                <div className="mt-4 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.03)" }}>
                  <div className="flex justify-between text-[10px]">
                    <span style={{ color: "rgba(255,255,255,0.12)" }}>Active signals</span>
                    <span className="font-mono" style={{ color: "rgba(212,160,84,0.4)" }}>247</span>
                  </div>
                  <div className="flex justify-between text-[10px] mt-1">
                    <span style={{ color: "rgba(255,255,255,0.12)" }}>Pending actions</span>
                    <span className="font-mono" style={{ color: "rgba(212,160,84,0.4)" }}>18</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </Reveal>

      {/* SEVEN PILLARS */}
      <Reveal>
        <section id="doctrine" className="relative py-28 sm:py-36 px-6">
          <div className="max-w-[1140px] mx-auto">
            <div className="max-w-[540px] mb-20">
              <p className="text-[10px] font-semibold tracking-[0.2em] uppercase mb-4" style={{ color: "rgba(255,255,255,0.15)" }}>The Doctrine</p>
              <h2 className="text-[clamp(1.5rem,3.5vw,2.25rem)] font-bold leading-[1.15] tracking-tight text-white mb-4">
                Seven pillars of business observability
              </h2>
              <p className="text-[15px] leading-[1.9]" style={{ color: "rgba(255,255,255,0.25)" }}>
                Every capability maps to one of seven foundational pillars — a complete doctrine
                for making operations visible, accountable, and continuously improving.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.03)" }}>
              {pillars.map((p, i) => (
                <div key={p.name} className="bg-[#0a0d14] p-8 group">
                  <span className="text-[28px] font-extrabold font-mono leading-none block mb-3" style={{ color: "rgba(212,160,84,0.06)" }}>{String(i + 1).padStart(2, "0")}</span>
                  <h3 className="text-[14px] font-bold text-white mb-3">{p.name}</h3>
                  <p className="text-[12px] leading-[1.85]" style={{ color: "rgba(255,255,255,0.25)" }}>{p.desc}</p>
                </div>
              ))}
              <div className="bg-[#0a0d14] p-8 flex flex-col items-center justify-center text-center">
                <Zap size={20} className="mb-3" style={{ color: "rgba(212,160,84,0.15)" }} />
                <p className="text-[11px] leading-relaxed" style={{ color: "rgba(255,255,255,0.1)" }}>All seven pillars.<br />One unified platform.</p>
              </div>
            </div>
          </div>
        </section>
      </Reveal>

      {/* CAPABILITIES */}
      <Reveal>
        <section id="capabilities" className="relative py-28 sm:py-36 px-6">
          <div className="max-w-[1140px] mx-auto">
            <div className="max-w-[540px] mb-20">
              <p className="text-[10px] font-semibold tracking-[0.2em] uppercase mb-4" style={{ color: "rgba(255,255,255,0.15)" }}>Capabilities</p>
              <h2 className="text-[clamp(1.5rem,3.5vw,2.25rem)] font-bold leading-[1.15] tracking-tight text-white mb-4">
                What Lyte does
              </h2>
              <p className="text-[15px] leading-[1.9]" style={{ color: "rgba(255,255,255,0.25)" }}>
                Six operational capabilities that transform how enterprises understand,
                prioritize, and act on the signals their business generates every day.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {capabilities.map((cap) => (
                <div key={cap.title} className="rounded-xl p-7 border transition-all" style={{ borderColor: "rgba(255,255,255,0.03)", background: "rgba(255,255,255,0.012)" }}>
                  <h3 className="text-[14px] font-bold text-white mb-3">{cap.title}</h3>
                  <p className="text-[12px] leading-[1.85]" style={{ color: "rgba(255,255,255,0.3)" }}>{cap.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </Reveal>

      {/* EVIDENCE / USE CASES */}
      <Reveal>
        <section id="evidence" className="relative py-28 sm:py-36 px-6">
          <div className="max-w-[900px] mx-auto">
            <p className="text-[10px] font-semibold tracking-[0.2em] uppercase mb-4" style={{ color: "rgba(255,255,255,0.15)" }}>Evidence</p>
            <h2 className="text-[clamp(1.5rem,3.5vw,2.25rem)] font-bold leading-[1.15] tracking-tight text-white mb-4">
              Real workflows. Measurable outcomes.
            </h2>
            <p className="text-[15px] leading-[1.9] mb-20 max-w-[540px]" style={{ color: "rgba(255,255,255,0.25)" }}>
              These aren't hypotheticals. They're the kind of operational failures that
              happen every day — and the interventions that Lyte makes possible.
            </p>

            <div className="flex flex-col gap-5">
              {useCases.map((uc) => (
                <div key={uc.title} className="border rounded-2xl overflow-hidden" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                  <div className="grid grid-cols-1 lg:grid-cols-[1fr_160px]">
                    <div className="p-8 sm:p-9">
                      <div className="flex flex-wrap items-center gap-3 mb-4">
                        <span className="text-[10px] font-mono px-3 py-1 rounded-lg" style={{ color: "rgba(212,160,84,0.5)", background: "rgba(212,160,84,0.05)" }}>{uc.lens}</span>
                      </div>
                      <h3 className="text-[16px] font-bold text-white mb-3">{uc.title}</h3>
                      <p className="text-[13px] leading-[1.95]" style={{ color: "rgba(255,255,255,0.3)" }}>{uc.scenario}</p>
                    </div>
                    <div className="p-6 flex flex-col items-center justify-center border-t lg:border-t-0 lg:border-l" style={{ background: "rgba(255,255,255,0.015)", borderColor: "rgba(255,255,255,0.03)" }}>
                      <span className="text-[26px] font-extrabold font-mono" style={{ color: "rgba(212,160,84,0.6)" }}>{uc.impact}</span>
                      <span className="text-[9px] tracking-[0.15em] uppercase mt-1" style={{ color: "rgba(255,255,255,0.1)" }}>Impact</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </Reveal>

      {/* WHY LYTE / WHY NOW */}
      <Reveal>
        <section className="relative py-28 sm:py-36 px-6">
          <div className="max-w-[720px] mx-auto">
            <p className="text-[10px] font-semibold tracking-[0.2em] uppercase mb-4" style={{ color: "rgba(255,255,255,0.15)" }}>Why Now</p>
            <h2 className="text-[clamp(1.5rem,3.5vw,2.25rem)] font-bold leading-[1.2] tracking-tight text-white mb-8">
              The cost of not knowing is compounding.
            </h2>
            <div className="text-[15px] leading-[2] space-y-6" style={{ color: "rgba(255,255,255,0.3)" }}>
              <p>
                Every enterprise runs dozens of operational tools. Each tool generates signals. But
                <span style={{ color: "rgba(255,255,255,0.65)" }}> no tool connects those signals to business outcomes</span>.
                The result: decisions take days instead of hours. Risks compound in silence. Ownership
                gaps widen between teams.
              </p>
              <p>
                The organizations that win are the ones that <span style={{ color: "rgba(255,255,255,0.65)" }}>see faster, decide faster, and act
                faster</span>. Not by adding more dashboards — by creating a unified layer that
                connects operational signals to the people who can act on them.
              </p>
              <p>
                Lyte is that layer. It doesn't replace your tools. It makes them <span style={{ color: "#d4a054" }}>compound</span>.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-px rounded-xl overflow-hidden mt-16" style={{ background: "rgba(255,255,255,0.03)" }}>
              {[
                { metric: "34h", label: "Avg decision latency", direction: "Current" },
                { metric: "4h", label: "With Lyte", direction: "Target" },
                { metric: "$2.1M", label: "Avg annual exposure", direction: "From gaps" },
                { metric: "89%", label: "Reduction", direction: "With Lyte" },
              ].map(m => (
                <div key={m.label} className="bg-[#0a0d14] p-6 text-center">
                  <span className="text-[22px] font-extrabold font-mono block" style={{ color: "#d4a054" }}>{m.metric}</span>
                  <span className="text-[10px] block mt-1" style={{ color: "rgba(255,255,255,0.3)" }}>{m.label}</span>
                  <span className="text-[8px] font-mono uppercase tracking-wider mt-1 block" style={{ color: "rgba(255,255,255,0.1)" }}>{m.direction}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </Reveal>

      {/* CONNECTORS */}
      <Reveal>
        <section id="platform" className="relative py-28 sm:py-36 px-6">
          <div className="max-w-[1140px] mx-auto">
            <div className="max-w-[540px] mb-20">
              <p className="text-[10px] font-semibold tracking-[0.2em] uppercase mb-4" style={{ color: "rgba(255,255,255,0.15)" }}>Connectors</p>
              <h2 className="text-[clamp(1.5rem,3.5vw,2.25rem)] font-bold leading-[1.15] tracking-tight text-white mb-4">
                Every tool. One signal stream.
              </h2>
              <p className="text-[15px] leading-[1.9]" style={{ color: "rgba(255,255,255,0.25)" }}>
                40+ connectors across productivity, engineering, CRM, support, finance, and data platforms.
                No code. No agents. No infrastructure changes. First signal in under 5 minutes.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-px rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.03)" }}>
              {connectorsList.map(c => (
                <div key={c.name} className="bg-[#0a0d14] py-5 px-5 flex items-center gap-3 group">
                  <c.icon size={15} className="shrink-0 group-hover:opacity-60 transition-colors" style={{ color: "rgba(255,255,255,0.12)" }} />
                  <span className="text-[12px] font-medium group-hover:text-white/50 transition-colors" style={{ color: "rgba(255,255,255,0.3)" }}>{c.name}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </Reveal>

      {/* TRUST / GOVERNANCE */}
      <Reveal>
        <section className="relative py-28 sm:py-36 px-6">
          <div className="max-w-[1140px] mx-auto">
            <div className="max-w-[540px] mb-20">
              <p className="text-[10px] font-semibold tracking-[0.2em] uppercase mb-4" style={{ color: "rgba(255,255,255,0.15)" }}>Trust & Governance</p>
              <h2 className="text-[clamp(1.5rem,3.5vw,2.25rem)] font-bold leading-[1.15] tracking-tight text-white mb-4">
                Built for enterprise accountability
              </h2>
              <p className="text-[15px] leading-[1.9]" style={{ color: "rgba(255,255,255,0.25)" }}>
                Every recommendation is auditable. Every action is tracked. Every boundary is enforced.
                Lyte operates within strict governance guardrails designed for regulated enterprises.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.03)" }}>
              {[
                { icon: Cpu, title: "AI Reasoning Boundaries", desc: "Lyte's intelligence layer operates within strict analytical boundaries. No autonomous decision-making. Every recommendation requires human approval before action." },
                { icon: Users, title: "Human-in-the-Loop", desc: "Critical decisions are always routed to the right person with full context. Lyte surfaces and recommends — humans decide and act." },
                { icon: Lock, title: "Full Auditability", desc: "Every signal, recommendation, action, and outcome is logged with timestamp, actor, evidence chain, and confidence score. Complete audit trail." },
                { icon: Scale, title: "Workflow Accountability", desc: "Every workflow has an owner. Every escalation has a reason. Every resolution is tracked. No action happens without attribution." },
              ].map(t => (
                <div key={t.title} className="bg-[#0a0d14] p-8">
                  <t.icon size={18} className="mb-5" style={{ color: "rgba(255,255,255,0.08)" }} />
                  <h3 className="text-[14px] font-bold text-white mb-3">{t.title}</h3>
                  <p className="text-[12px] leading-[1.85]" style={{ color: "rgba(255,255,255,0.25)" }}>{t.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </Reveal>

      {/* ENTERPRISE TRUST STRIP */}
      <Reveal>
        <section className="relative py-20 px-6">
          <div className="max-w-[1140px] mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-px rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.03)" }}>
              {[
                { icon: Shield, title: "Enterprise security", desc: "SOC 2 Type II architecture. E2E encryption. RBAC. Audit trails on every action. Your data never leaves your tenant." },
                { icon: Network, title: "Unified architecture", desc: "Same infrastructure as every SZL Holdings platform. Shared auth, shared data layer, shared orchestration via Alloy." },
                { icon: CheckCircle, title: "Built by operators", desc: "Built by a founder who ran operations across cybersecurity, real estate, maritime, and enterprise consulting. Not a toy." },
              ].map(t => (
                <div key={t.title} className="bg-[#0a0d14] p-8">
                  <t.icon size={18} className="mb-5" style={{ color: "rgba(255,255,255,0.08)" }} />
                  <h3 className="text-[14px] font-bold text-white mb-3">{t.title}</h3>
                  <p className="text-[12px] leading-[1.85]" style={{ color: "rgba(255,255,255,0.25)" }}>{t.desc}</p>
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
            <p className="text-[10px] font-mono tracking-[0.3em] uppercase mb-3" style={{ color: "rgba(212,160,84,0.5)" }}>Platform Walkthrough</p>
            <h2 className="text-[clamp(1.6rem,3vw,2.1rem)] font-bold text-white mb-3 tracking-tight">How Lyte works in practice</h2>
            <p className="text-[14px] max-w-xl mx-auto" style={{ color: "rgba(255,255,255,0.3)" }}>From connection to command in under 5 minutes. No configuration. No professional services required.</p>
          </div>
          <div className="relative">
            <div className="hidden md:block absolute left-[39px] top-0 bottom-0 w-px" style={{ background: "rgba(255,255,255,0.04)" }} />
            <div className="space-y-10">
              {[
                { step: "01", title: "Connect your tools", body: "Lyte connects to your existing stack in one click — no custom integrations, no engineering time. Microsoft 365, Slack, Jira, Salesforce, GitHub, and 50+ more connectors available out of the box.", tag: "Setup" },
                { step: "02", title: "PRISM surfaces your first signals", body: "Within minutes, the PRISM engine begins building your operational picture. Pulse shows business health. Signals flags anomalies. Risk scores every process gap by financial exposure. No configuration required.", tag: "Intelligence" },
                { step: "03", title: "Ownership mapping resolves accountability", body: "Lyte maps every process, approval, and risk to the person accountable for it — across teams, departments, and role boundaries. Nothing falls through the cracks when ownership is explicit.", tag: "Command" },
                { step: "04", title: "Intelligence delivers evidence-backed decisions", body: "Each recommendation carries an evidence chain: what data triggered it, what the business impact is, and what confidence the engine has. Executives see why, not just what.", tag: "Reasoning" },
                { step: "05", title: "Motion routes and tracks action", body: "Decisions reach the right person with full context. Approve, escalate, delegate, or resolve — every action is tracked, timestamped, and auditable. The organizational velocity improves visibly over time.", tag: "Execution" },
              ].map((item) => (
                <div key={item.step} className="flex items-start gap-8 md:gap-10">
                  <div className="flex-shrink-0 w-20 text-right">
                    <div className="inline-flex items-center justify-center w-10 h-10 rounded-full text-[11px] font-bold" style={{ background: "rgba(212,160,84,0.12)", color: "#d4a054", border: "1px solid rgba(212,160,84,0.2)" }}>{item.step}</div>
                  </div>
                  <div className="flex-1 pb-10 border-b" style={{ borderColor: "rgba(255,255,255,0.03)" }}>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-[16px] font-semibold text-white">{item.title}</h3>
                      <span className="text-[9px] font-mono px-2 py-0.5 rounded" style={{ background: "rgba(212,160,84,0.08)", color: "rgba(212,160,84,0.6)", border: "1px solid rgba(212,160,84,0.1)" }}>{item.tag}</span>
                    </div>
                    <p className="text-[13.5px] leading-relaxed" style={{ color: "rgba(255,255,255,0.4)" }}>{item.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </Reveal>

      {/* SOCIAL PROOF */}
      <Reveal>
        <section className="py-20 sm:py-28 px-6" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
          <div className="max-w-[1140px] mx-auto">
            <p className="text-[10px] font-semibold tracking-[0.2em] uppercase mb-8 font-mono text-center" style={{ color: "rgba(255,255,255,0.15)" }}>Documented Results</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-px rounded-xl overflow-hidden mb-12" style={{ background: "rgba(255,255,255,0.03)" }}>
              {[
                { metric: "67%", label: "Reduction in decision lag", detail: "Operations that connect Lyte see 67% faster resolution on aging decisions vs. pre-deployment baseline." },
                { metric: "$1.2M+", label: "Average annual drag identified", detail: "Financial exposure surfaced across approval queues, churn risk, and vendor gaps in first 90 days." },
                { metric: "16", label: "Tool connectors", detail: "Connect your entire ops stack — Salesforce, Jira, Slack, GitHub, Snowflake, and 11 more — in one session." },
                { metric: "< 5 min", label: "Time to first signal", detail: "Average time from first connector activation to first business-relevant signal surfaced." },
              ].map((p, i) => (
                <div key={p.label} className="p-7" style={{ background: "#0a0d14" }}>
                  <span className="text-[2.2rem] font-extrabold font-mono block mb-1" style={{ color: "#d4a054" }}>{p.metric}</span>
                  <p className="text-[11px] font-bold text-white mb-1.5">{p.label}</p>
                  <p className="text-[11px] leading-[1.7]" style={{ color: "rgba(255,255,255,0.25)" }}>{p.detail}</p>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[
                { quote: "I used to lose two hours in ops syncs every Monday. Lyte surfaces everything that needs my attention before I open a single tool. My calendar cleared itself.", attribution: "VP Operations, SaaS Company", context: "350-person org, 11 tools connected" },
                { quote: "We identified $1.8M in stalled pipeline within the first week. Three deals had no owner after a rep departure. Lyte surfaced the ownership gap before the quarter closed.", attribution: "Chief Revenue Officer, Enterprise Software", context: "Salesforce + HubSpot integration" },
                { quote: "As a CFO, the approval drag visibility was the first thing that got my attention. Fourteen procurement approvals sitting 35+ days — costing us 60 days of delayed vendor onboarding.", attribution: "CFO, Infrastructure Services Group", context: "NetSuite + ServiceNow integration" },
              ].map((t, i) => (
                <div key={i} className="p-7 rounded-xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
                  <p className="text-[14px] leading-[1.85] mb-5 italic" style={{ color: "rgba(255,255,255,0.45)" }}>"{t.quote}"</p>
                  <p className="text-[12px] font-semibold text-white mb-0.5">{t.attribution}</p>
                  <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.25)" }}>{t.context}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </Reveal>

      {/* CTA CLOSE */}
      <Reveal>
        <section className="relative py-28 sm:py-36 px-6">
          <div className="max-w-[640px] mx-auto text-center">
            <h2 className="text-[clamp(1.5rem,3.5vw,2.25rem)] font-bold text-white mb-4 tracking-tight">
              In the dark, let Lyte guide you.
            </h2>
            <p className="text-[15px] mb-12" style={{ color: "rgba(255,255,255,0.25)" }}>
              Connect your first tool in under 5 minutes. See what you've been missing.
            </p>
            <div className="flex justify-center flex-wrap gap-3 mb-8">
              <button onClick={onSignIn} className="text-[14px] font-semibold rounded-lg px-8 py-3.5 flex items-center gap-2 transition-all" style={{ background: "#d4a054", color: "#0a0d14" }}>
                Start Free Trial <ArrowRight size={15} />
              </button>
              <button onClick={() => setDemoOpen(true)} className="text-[14px] font-medium border rounded-lg px-8 py-3.5 transition-all" style={{ color: "rgba(255,255,255,0.3)", borderColor: "rgba(255,255,255,0.07)" }}>
                Schedule a Demo
              </button>
            </div>
            <p className="text-[11px] mb-6" style={{ color: "rgba(255,255,255,0.12)" }}>
              Enterprise inquiries: <a href="mailto:contact@stephenl.dev" className="underline" style={{ color: "rgba(212,160,84,0.4)" }}>contact@stephenl.dev</a>
            </p>
            <div className="pt-6 border-t" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
              <p className="text-[11px] mb-3" style={{ color: "rgba(255,255,255,0.15)" }}>Part of the SZL Holdings platform family</p>
              <div className="flex flex-wrap gap-4 justify-center text-[11px]" style={{ color: "rgba(255,255,255,0.2)" }}>
                <a href="/szl-holdings/" className="hover:text-white/50 transition-colors">SZL Holdings →</a>
                <a href="/szl-holdings/trust" className="hover:text-white/50 transition-colors">Trust Center →</a>
                <a href="/szl-holdings/architecture" className="hover:text-white/50 transition-colors">Architecture →</a>
                <a href="/terra/" className="hover:text-white/50 transition-colors">Terra →</a>
                <a href="/vessels/" className="hover:text-white/50 transition-colors">Vessels →</a>
                <a href="/firestorm/" className="hover:text-white/50 transition-colors">Aegis →</a>
              </div>
            </div>
          </div>
        </section>
      </Reveal>

      <ContactModal
        isOpen={demoOpen}
        onClose={() => setDemoOpen(false)}
        type="demo"
        app="lyte"
        subtitle="Lyte — Business Observability Platform"
      />

      <footer className="py-14 px-6 max-w-[1140px] mx-auto" style={{ borderTop: "1px solid rgba(255,255,255,0.03)" }}>
        <div className="flex flex-col gap-5">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2.5">
              <Zap size={12} style={{ color: "rgba(212,160,84,0.4)" }} />
              <span className="text-[12px] font-semibold" style={{ color: "rgba(255,255,255,0.2)" }}>Lyte</span>
              <span className="text-[10px] font-mono" style={{ color: "rgba(255,255,255,0.1)" }}>An SZL Holdings Company</span>
            </div>
            <div className="flex items-center gap-4">
              {[
                { name: "Terra", href: "/terra/" },
                { name: "Vessels", href: "/vessels/" },
                { name: "Aegis", href: "/firestorm/" },
                { name: "PRISM Counsel", href: "/prism-counsel/" },
                { name: "Carlota Jo", href: "/carlota-jo/" },
                { name: "SZL", href: "/szl-holdings/" },
              ].map(l => (
                <a key={l.name} href={l.href} className="text-[10px] transition-colors" style={{ color: "rgba(255,255,255,0.1)" }} onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.35)")} onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.1)")}>{l.name}</a>
              ))}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-[10px] text-center sm:text-left" style={{ color: "rgba(255,255,255,0.08)" }}>&copy; 2026 SZL Holdings. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <a href="https://x.com/szlholdings" target="_blank" rel="noopener noreferrer" className="text-[10px] transition-colors" style={{ color: "rgba(255,255,255,0.1)" }} onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.35)")} onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.1)")}>X</a>
              <a href="https://linkedin.com/company/szlholdings" target="_blank" rel="noopener noreferrer" className="text-[10px] transition-colors" style={{ color: "rgba(255,255,255,0.1)" }} onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.35)")} onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.1)")}>LinkedIn</a>
              <a href="https://medium.com/@stephen_38454" target="_blank" rel="noopener noreferrer" className="text-[10px] transition-colors" style={{ color: "rgba(255,255,255,0.1)" }} onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.35)")} onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.1)")}>Medium</a>
              <a href="/legal/privacy" className="text-[10px] transition-colors" style={{ color: "rgba(255,255,255,0.1)" }} onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.35)")} onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.1)")}>Privacy</a>
              <a href="/legal/terms" className="text-[10px] transition-colors" style={{ color: "rgba(255,255,255,0.1)" }} onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.35)")} onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.1)")}>Terms</a>
              <a href="/security" className="text-[10px] transition-colors" style={{ color: "rgba(255,255,255,0.1)" }} onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.35)")} onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.1)")}>Security</a>
            </div>
          </div>
        </div>
      </footer>
    </m.div>
  );
}
