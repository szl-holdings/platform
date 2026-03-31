import { useState, useEffect, useRef } from "react";
import {
  ArrowRight, Activity, Eye, TrendingUp, Radio, Gauge,
  Network, Target, Users, Shield, GitBranch, Zap, CheckCircle,
  Mail, Calendar, MessageSquare, FileText, Database, Cloud,
  Briefcase, HeartPulse, Factory, CreditCard, CheckSquare,
  Menu, X, ChevronDown, Monitor,
} from "lucide-react";

const AMBER = "#f59e0b";

const prism = [
  { key: "P", name: "Pulse", color: "#10b981", icon: Activity, meaning: "Business health, operating heartbeat, trend status, exposure rhythm", detail: "Pulse monitors the continuous rhythm of your operations — revenue velocity, delivery cadence, customer health, operational tempo. Not infrastructure uptime. Business uptime." },
  { key: "R", name: "Risk", color: "#ef4444", icon: Target, meaning: "Approvals, churn, delays, ownership gaps, regulatory exposure", detail: "Risk surfaces the slow-burn threats that compound silently: aging approvals, unowned processes, regulatory drift, customer churn signals. Each risk carries a time-to-impact and business cost." },
  { key: "I", name: "Intelligence", color: "#8b5cf6", icon: Eye, meaning: "Modeled reasoning, evidence, confidence, likely outcomes", detail: "Intelligence synthesizes signals into actionable recommendations with evidence chains and confidence scores. Not AI predictions — structured reasoning an executive can audit and trust." },
  { key: "S", name: "Signals", color: "#f59e0b", icon: Radio, meaning: "Anomalies, changes, event spikes, workflow drift", detail: "Signals captures state changes across your connected tools — a Jira queue doubling, a Salesforce pipeline stalling, a Slack channel going silent. Each signal is scored, attributed, and routed." },
  { key: "M", name: "Motion", color: "#0ea5e9", icon: Gauge, meaning: "Escalations, routing, approvals, interventions, workflow execution", detail: "Motion is the execution layer — routing decisions to the right person, escalating stalled work, triggering interventions, and tracking the velocity of organizational response." },
];

const pillars = [
  { name: "Visibility", desc: "See every operational surface — not just infrastructure. Revenue pipelines, approval queues, team handoffs, customer health, vendor dependencies. If it affects outcomes, Lyte shows it." },
  { name: "Context", desc: "Signals without context are noise. Lyte connects every anomaly to the business process it impacts, the owner responsible, and the financial exposure it creates." },
  { name: "Ownership", desc: "Every process, risk, and decision has an owner. Lyte maps accountability chains so nothing falls between teams, departments, or role boundaries." },
  { name: "Prioritization", desc: "Not everything is urgent. Lyte scores every signal by business impact, time sensitivity, and confidence — so operators work on what matters, not what's loudest." },
  { name: "Explainability", desc: "Every recommendation carries an evidence chain. No black-box AI. Executives see why something is flagged, what data supports it, and how confident the assessment is." },
  { name: "Intervention", desc: "Visibility without action is a spectator sport. Lyte routes decisions to the right person with full context — approve, escalate, delegate, or resolve." },
  { name: "Continuous Motion", desc: "Organizations don't stand still. Lyte tracks the velocity of improvement — are decisions getting faster? Are risks being caught earlier? Is the organization accelerating or decelerating?" },
];

const useCases = [
  { title: "A VP discovers a $400K revenue leak", scenario: "Three Salesforce deals stalled for 18 days. Lyte's Risk lens flagged the ownership gap — the assigned rep had left. Intelligence surfaced the churn probability at 72%. Motion routed the re-assignment to the sales director with full deal context. All three deals closed within 10 days of intervention.", lens: "Risk → Intelligence → Motion" },
  { title: "An ops lead prevents a delivery failure", scenario: "Pulse detected a 3x spike in Jira ticket cycle time for the platform team. Signals correlated it with a silent Slack channel — the lead engineer was on unplanned leave. Intelligence recommended redistributing the sprint backlog. The CTO approved the intervention before the client SLA was breached.", lens: "Pulse → Signals → Intelligence → Motion" },
  { title: "A CFO catches approval drag costing $120K/month", scenario: "Risk surfaced 14 procurement approvals aging past 30 days — each blocking vendor onboarding. Intelligence calculated the cumulative delay cost. Motion escalated the batch to the COO with a single-click approval flow. The entire backlog cleared in 48 hours.", lens: "Risk → Intelligence → Motion" },
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

export default function LyteMarketingLanding({ onSignIn }: { onSignIn?: () => void }) {
  const [expandedPrism, setExpandedPrism] = useState<number | null>(null);
  const [mobileNav, setMobileNav] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-300" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>

      <nav className={`fixed top-0 left-0 right-0 z-50 h-14 flex items-center transition-all duration-300 ${scrolled ? "bg-[#080c14]/95 backdrop-blur-xl border-b border-white/[0.06] shadow-lg shadow-black/20" : "bg-transparent"}`}>
        <div className="max-w-[1120px] mx-auto px-6 w-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-[26px] h-[26px] rounded-md flex items-center justify-center" style={{ background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.25)" }}>
              <Zap size={13} className="text-amber-400" />
            </div>
            <span className="font-bold text-[15px] tracking-tight text-white">Lyte</span>
          </div>
          <div className="hidden md:flex items-center gap-6">
            {[{ label: "PRISM", href: "#prism" }, { label: "Pillars", href: "#pillars" }, { label: "Use Cases", href: "#use-cases" }, { label: "Connectors", href: "#connectors" }].map(l => (
              <a key={l.label} href={l.href} className="text-xs text-white/40 hover:text-white/70 transition-colors tracking-wider font-medium">{l.label}</a>
            ))}
            <span className="text-[11px] text-white/20 font-mono">SZL Holdings</span>
            <button onClick={onSignIn} className="text-xs font-semibold text-[#080c14] bg-amber-400 hover:bg-amber-300 rounded-md px-4 py-1.5 transition-colors">Sign in</button>
          </div>
          <button className="md:hidden p-2 text-white/50" onClick={() => setMobileNav(!mobileNav)}>
            {mobileNav ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      {mobileNav && (
        <div className="fixed inset-0 z-40 bg-[#080c14]/98 backdrop-blur-xl flex flex-col items-center justify-center gap-6 md:hidden">
          {[{ label: "PRISM", href: "#prism" }, { label: "Pillars", href: "#pillars" }, { label: "Use Cases", href: "#use-cases" }, { label: "Connectors", href: "#connectors" }].map(l => (
            <a key={l.label} href={l.href} onClick={() => setMobileNav(false)} className="text-lg text-white/60 hover:text-white transition-colors">{l.label}</a>
          ))}
          <button onClick={() => { onSignIn?.(); setMobileNav(false); }} className="mt-4 text-sm font-semibold text-[#080c14] bg-amber-400 rounded-md px-6 py-2.5">Sign in</button>
        </div>
      )}

      <section className="pt-28 sm:pt-32 pb-16 sm:pb-20 max-w-[1120px] mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-12 lg:gap-20 items-start">
          <div>
            <p className="text-[11px] font-bold tracking-[0.12em] uppercase text-amber-400 mb-5 font-mono">Business Observability Platform</p>
            <h1 className="text-4xl sm:text-5xl lg:text-[52px] font-extrabold leading-[1.08] tracking-tight text-slate-50 mb-6">
              In the dark,<br />
              <span className="text-amber-400">let Lyte guide you.</span>
            </h1>
            <p className="text-base sm:text-[17px] leading-relaxed text-white/45 max-w-[520px] mb-8">
              Your business generates thousands of signals every day across dozens of tools.
              Most go unseen until the damage compounds. Lyte turns operational noise into
              prioritized human action — so executives see risk, operators see friction,
              and decisions happen before it's too late.
            </p>
            <div className="flex flex-wrap gap-3">
              <button onClick={onSignIn} className="text-[13px] font-semibold bg-amber-400 hover:bg-amber-300 text-[#080c14] rounded-md px-6 py-2.5 flex items-center gap-1.5 transition-colors">
                Start Free Trial <ArrowRight size={14} />
              </button>
              <button className="text-[13px] font-medium bg-transparent text-white/55 border border-white/[0.06] hover:border-white/[0.12] rounded-md px-6 py-2.5 transition-colors">
                Request a Demo
              </button>
            </div>

            <div className="flex flex-wrap gap-x-10 gap-y-4 mt-12 pt-6 border-t border-white/[0.06]">
              {[{ v: "40+", l: "Connectors" }, { v: "5", l: "PRISM Lenses" }, { v: "7", l: "Pillars" }, { v: "< 5 min", l: "First Signal" }].map(s => (
                <div key={s.l}>
                  <span className="text-lg font-extrabold font-mono text-slate-50">{s.v}</span>
                  <p className="text-[10px] text-white/25 uppercase tracking-wider mt-0.5">{s.l}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white/[0.025] border border-white/[0.06] rounded-xl p-5 mt-0 lg:mt-4">
            <div className="flex justify-between items-center mb-4">
              <span className="text-[9px] font-bold tracking-wider uppercase text-white/25">PRISM Analysis</span>
              <span className="text-[9px] font-mono text-white/15">Live</span>
            </div>
            {prism.map((p) => (
              <div key={p.key} className="flex items-center gap-2.5 py-2 border-t border-white/[0.03]">
                <span className="text-[11px] font-extrabold font-mono w-3.5" style={{ color: p.color }}>{p.key}</span>
                <span className="text-xs text-white/65 flex-1">{p.name}</span>
                <div className="w-[60px] h-1 rounded-full bg-white/[0.06] overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${60 + Math.random() * 30}%`, background: p.color, opacity: 0.7 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Section>
        <section className="border-t border-white/[0.06] py-16 sm:py-20 px-6 max-w-[1120px] mx-auto">
          <div className="max-w-[680px]">
            <p className="text-[10px] font-bold tracking-[0.12em] uppercase text-white/25 mb-4">Defining the Category</p>
            <h2 className="text-2xl sm:text-[32px] font-bold leading-tight tracking-tight text-slate-50 mb-6">
              What is business observability?
            </h2>
            <p className="text-[15px] leading-[1.8] text-white/40 mb-5">
              Infrastructure observability tells you when a server is down. Business observability tells you
              when a <span className="text-white/75">revenue pipeline is stalling</span>,
              an <span className="text-white/75">approval is aging past its SLA</span>,
              a <span className="text-white/75">team handoff is creating customer risk</span>,
              or a <span className="text-white/75">process owner has gone silent</span>.
            </p>
            <p className="text-[15px] leading-[1.8] text-white/40 mb-8">
              Most operational damage doesn't happen because of a crash. It happens because signals go unseen
              across disconnected tools — Jira, Salesforce, Slack, ServiceNow, email — until the cost
              compounds past recovery.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
              {[
                { label: "Infrastructure Observability", items: ["Server uptime", "API latency", "Error rates", "Memory usage"], note: "Datadog, New Relic, Splunk", highlight: false },
                { label: "Business Observability", items: ["Revenue velocity", "Approval aging", "Ownership gaps", "Decision latency"], note: "Lyte", highlight: true },
              ].map(col => (
                <div key={col.label} className="bg-white/[0.025] border border-white/[0.06] rounded-lg p-5">
                  <p className={`text-[10px] font-bold tracking-wider uppercase mb-3 ${col.highlight ? "text-amber-400" : "text-white/25"}`}>{col.label}</p>
                  {col.items.map(item => (
                    <p key={item} className="text-xs text-white/45 py-1 border-b border-white/[0.03]">{item}</p>
                  ))}
                  <p className="text-[10px] text-white/15 mt-2 font-mono">{col.note}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </Section>

      <Section>
        <section id="prism" className="border-t border-white/[0.06] py-16 sm:py-20 px-6 max-w-[1120px] mx-auto">
          <p className="text-[10px] font-bold tracking-[0.12em] uppercase text-white/25 mb-3">The Analytical Framework</p>
          <h2 className="text-2xl sm:text-[32px] font-bold leading-tight tracking-tight text-slate-50 mb-2">PRISM</h2>
          <p className="text-[15px] text-white/35 mb-10 max-w-[560px]">
            Five analytical lenses that decompose operational complexity into structured, actionable intelligence.
            Every signal in Lyte passes through PRISM before it reaches a human.
          </p>

          <div className="flex flex-col gap-0.5">
            {prism.map((p, i) => (
              <button
                key={p.key}
                onClick={() => setExpandedPrism(expandedPrism === i ? null : i)}
                className={`text-left w-full rounded-lg px-5 py-4 border transition-all duration-200 ${expandedPrism === i ? "bg-white/[0.035]" : "bg-white/[0.025] hover:bg-white/[0.03]"}`}
                style={{ borderColor: expandedPrism === i ? `${p.color}30` : "rgba(255,255,255,0.06)" }}
              >
                <div className="flex items-center gap-3 sm:gap-3.5">
                  <span className="text-lg font-extrabold font-mono w-6" style={{ color: p.color }}>{p.key}</span>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-semibold text-slate-50">{p.name}</span>
                    <span className="hidden sm:inline text-xs text-white/30 ml-3">{p.meaning}</span>
                  </div>
                  <p.icon size={16} style={{ color: p.color }} className="opacity-50 shrink-0" />
                  <ChevronDown size={14} className={`text-white/20 transition-transform shrink-0 ${expandedPrism === i ? "rotate-180" : ""}`} />
                </div>
                {expandedPrism === i && (
                  <p className="text-[13px] leading-relaxed text-white/45 mt-3 ml-9 max-w-[600px]">
                    {p.detail}
                  </p>
                )}
              </button>
            ))}
          </div>
        </section>
      </Section>

      <Section>
        <section id="pillars" className="border-t border-white/[0.06] py-16 sm:py-20 px-6 max-w-[1120px] mx-auto">
          <p className="text-[10px] font-bold tracking-[0.12em] uppercase text-white/25 mb-3">The Doctrine</p>
          <h2 className="text-2xl sm:text-[32px] font-bold leading-tight tracking-tight text-slate-50 mb-2">
            The 7 Pillars of Business Observability
          </h2>
          <p className="text-[15px] text-white/35 mb-12 max-w-[560px]">
            Every capability in Lyte maps to one of seven foundational pillars. Together, they form a
            complete doctrine for making operations visible, accountable, and continuously improving.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-white/[0.06] rounded-xl overflow-hidden">
            {pillars.map((p, i) => (
              <div key={p.name} className="bg-[#080c14] p-6 sm:p-7">
                <div className="flex items-baseline gap-2.5 mb-2.5">
                  <span className="text-2xl font-extrabold text-amber-400/15 font-mono">{String(i + 1).padStart(2, "0")}</span>
                  <h3 className="text-[15px] font-bold text-slate-50">{p.name}</h3>
                </div>
                <p className="text-[12.5px] leading-relaxed text-white/35">{p.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </Section>

      <Section>
        <section id="use-cases" className="border-t border-white/[0.06] py-16 sm:py-20 px-6 max-w-[1120px] mx-auto">
          <p className="text-[10px] font-bold tracking-[0.12em] uppercase text-white/25 mb-3">How It Works</p>
          <h2 className="text-2xl sm:text-[32px] font-bold leading-tight tracking-tight text-slate-50 mb-12">
            Real workflows. Real outcomes.
          </h2>

          <div className="flex flex-col gap-6">
            {useCases.map((uc) => (
              <div key={uc.title} className="bg-white/[0.025] border border-white/[0.06] rounded-xl p-6 sm:p-7">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
                  <h3 className="text-base font-bold text-slate-50 max-w-[500px]">{uc.title}</h3>
                  <span className="text-[10px] font-mono text-amber-400 bg-amber-400/[0.08] px-2.5 py-1 rounded whitespace-nowrap self-start">{uc.lens}</span>
                </div>
                <p className="text-[13px] leading-[1.8] text-white/40">{uc.scenario}</p>
              </div>
            ))}
          </div>
        </section>
      </Section>

      <Section>
        <section id="connectors" className="border-t border-white/[0.06] py-16 sm:py-20 px-6 max-w-[1120px] mx-auto">
          <p className="text-[10px] font-bold tracking-[0.12em] uppercase text-white/25 mb-3">Integrations</p>
          <h2 className="text-2xl sm:text-[32px] font-bold leading-tight tracking-tight text-slate-50 mb-2">
            Connect every tool your teams use.
          </h2>
          <p className="text-[15px] text-white/35 mb-10 max-w-[560px]">
            40+ connectors across productivity, engineering, CRM, support, finance, HR, and data platforms.
            No code, no agents, no infrastructure changes.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-px bg-white/[0.06] rounded-lg overflow-hidden">
            {connectorsList.map(c => (
              <div key={c.name} className="bg-[#080c14] py-4 px-3.5 flex items-center gap-2">
                <c.icon size={14} className="text-white/20 shrink-0" />
                <span className="text-[11px] text-white/50 font-medium">{c.name}</span>
              </div>
            ))}
          </div>
        </section>
      </Section>

      <Section>
        <section className="border-t border-white/[0.06] py-16 sm:py-20 px-6 max-w-[1120px] mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Shield, title: "Enterprise-grade security", desc: "SOC 2 Type II architecture. End-to-end encryption. Role-based access. Audit trails on every action. Your data never leaves your tenant." },
              { icon: Network, title: "One unified architecture", desc: "Lyte runs on the same infrastructure as every SZL Holdings platform. Shared auth, shared data layer, shared orchestration via Alloy." },
              { icon: CheckCircle, title: "Built by operators", desc: "Built by a founder who ran operations across cybersecurity, real estate, maritime, and enterprise consulting. Not a toy. Not a science project." },
            ].map(t => (
              <div key={t.title} className="bg-white/[0.025] border border-white/[0.06] rounded-xl p-6">
                <t.icon size={18} className="text-white/15 mb-3.5" />
                <h3 className="text-sm font-bold text-slate-50 mb-2">{t.title}</h3>
                <p className="text-xs leading-relaxed text-white/35">{t.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </Section>

      <Section>
        <section className="border-t border-white/[0.06] py-16 sm:py-20 px-6 max-w-[1120px] mx-auto text-center">
          <h2 className="text-2xl sm:text-[28px] font-bold text-slate-50 mb-3">
            Stop flying blind.
          </h2>
          <p className="text-[15px] text-white/35 max-w-[480px] mx-auto mb-8">
            Connect your first tool in under 5 minutes. See what you've been missing.
          </p>
          <div className="flex justify-center flex-wrap gap-3">
            <button onClick={onSignIn} className="text-sm font-semibold bg-amber-400 hover:bg-amber-300 text-[#080c14] rounded-md px-7 py-3 flex items-center gap-1.5 transition-colors">
              Start Free Trial <ArrowRight size={14} />
            </button>
            <button className="text-sm font-medium bg-transparent text-white/55 border border-white/[0.06] hover:border-white/[0.12] rounded-md px-7 py-3 transition-colors">
              Schedule a Demo
            </button>
          </div>
        </section>
      </Section>

      <footer className="border-t border-white/[0.06] py-10 px-6 max-w-[1120px] mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="flex items-center gap-2">
            <Zap size={12} className="text-amber-400" />
            <span className="text-xs font-semibold text-white/35">Lyte</span>
            <span className="text-[10px] text-white/10 font-mono">by SZL Holdings</span>
          </div>
          <p className="text-[10px] text-white/10">&copy; {new Date().getFullYear()} SZL Holdings. All rights reserved.</p>
        </div>
      </footer>

      <div className="h-10" />
    </div>
  );
}
