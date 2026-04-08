import { useState, useEffect, useRef } from "react";
import { ContactModal } from "@szl-holdings/shared-ui";
import {
  Scale, ArrowRight, Shield, FileText, Brain, Clock,
  CheckCircle, Users, BarChart3, Target, Lock, Eye,
  Menu, X, Zap, TrendingUp, AlertTriangle, ChevronRight,
  Calendar, DollarSign, BookOpen, Gavel,
} from "lucide-react";

const ACCENT = "#c8a96e";
const BG = "#080c14";

const capabilities = [
  {
    icon: FileText,
    title: "Matter Command",
    desc: "Every matter has a live health score, deadline chain, party map, and exposure estimate. Not a docket — a command surface that tells you what needs to happen today and what's at risk if it doesn't.",
    tag: "Core",
  },
  {
    icon: Brain,
    title: "PRISM Intelligence",
    desc: "Six-lens matter observability — Posture, Readiness, Integrity, Strategy, Money, Governance. Correlates signals across your matter portfolio to surface what attorneys can't see at scale.",
    tag: "Intelligence",
  },
  {
    icon: AlertTriangle,
    title: "Settlement Forecast Engine",
    desc: "Probability-weighted settlement ranges with confidence scoring, insurer behavior patterns, venue tendencies, and comparable outcome data. Structured reasoning, not guesswork.",
    tag: "Intelligence",
  },
  {
    icon: Clock,
    title: "Deadline & Discovery Intelligence",
    desc: "Continuous deadline monitoring with time-sensitivity scoring, discovery compliance tracking, and escalation routing — before the court date surfaces the crisis.",
    tag: "Core",
  },
  {
    icon: Users,
    title: "Insurer & Party Intelligence",
    desc: "Insurer behavior profiles, adjuster pattern analysis, opposing counsel playbooks, and counterparty intelligence — built from your matter history and enriched continuously.",
    tag: "Intelligence",
  },
  {
    icon: Shield,
    title: "Privilege-Aware Governance",
    desc: "Attorney-client privilege boundaries enforced at the data layer. Human approval required for every consequential action. Every AI output traced to source with confidence scoring.",
    tag: "Governance",
  },
  {
    icon: BarChart3,
    title: "Portfolio Analytics",
    desc: "Fleet-level litigation analytics — exposure by practice area, settlement velocity trends, venue performance, insurer behavior by carrier, and pipeline forecasting.",
    tag: "Analytics",
  },
  {
    icon: Gavel,
    title: "Practice-Specific Modules",
    desc: "Pre-built intelligence for No-Fault / PIP, personal injury, mass tort, and commercial litigation — each with domain-specific signals, benchmarks, and insurer profiles.",
    tag: "Core",
  },
];

const useCases = [
  {
    role: "Managing Partners",
    headline: "Portfolio visibility without the status meeting.",
    desc: "Matter health across your entire book — exposure by partner, settlement pipeline by practice, deadline compliance rates, and velocity trends. Board-grade litigation intelligence assembled automatically.",
    icon: TrendingUp,
    signals: ["Portfolio exposure", "Settlement pipeline", "Partner performance", "Venue trends"],
  },
  {
    role: "Lead Attorneys",
    headline: "Everything the matter needs. Nothing it doesn't.",
    desc: "Deadline chain, discovery status, insurer behavior profile, comparable outcomes, and recommended next actions — in one surface. Spend time on strategy, not synthesis.",
    icon: Gavel,
    signals: ["Deadline intelligence", "Insurer profiles", "Settlement forecast", "Evidence gaps"],
  },
  {
    role: "Practice Group Leaders",
    headline: "Run the practice, not the spreadsheet.",
    desc: "Practice-level analytics — settlement velocity, verdict benchmarks, opposing counsel win rates, and carrier behavior patterns across your No-Fault, PI, or commercial book.",
    icon: BarChart3,
    signals: ["Practice benchmarks", "Carrier intelligence", "Venue analytics", "Outcome patterns"],
  },
];

const practiceModules = [
  {
    name: "No-Fault / PIP",
    desc: "Carrier-specific behavior profiles, arbitration outcomes, fee schedule compliance, and SIU referral patterns — built for high-volume no-fault operations.",
    metrics: ["Carrier adjuster patterns", "Arbitration win rates", "SIU referral signals", "Fee schedule analysis"],
  },
  {
    name: "Personal Injury",
    desc: "Venue tendencies, jury verdict benchmarks, defense counsel profiles, and settlement range modeling — calibrated to your jurisdiction and claim type.",
    metrics: ["Verdict benchmarks", "Venue intelligence", "Defense playbooks", "Settlement modeling"],
  },
  {
    name: "Commercial Litigation",
    desc: "Complex multi-party matter tracking, dispositive motion intelligence, discovery scope modeling, and damages framework analysis across high-stakes commercial disputes.",
    metrics: ["Damages frameworks", "Motion intelligence", "Expert tracker", "Exposure modeling"],
  },
  {
    name: "Mass Tort",
    desc: "MDL docket tracking, global resolution positioning, claimant health score management, and defendant exposure modeling across large-cohort litigation.",
    metrics: ["MDL positioning", "Claimant analytics", "Defendant exposure", "Resolution forecasting"],
  },
];

const proofPoints = [
  { metric: "73%", label: "reduction in deadline misses", detail: "Continuous monitoring with attorney-attributed escalation paths — caught before the court date." },
  { metric: "40%", label: "faster matter synthesis", detail: "Attorneys spend less time building matter briefs and more time on strategy. PRISM assembles the picture." },
  { metric: "18%", label: "improvement in settlement outcomes", detail: "Insurer behavior patterns and comparable outcome data inform demand positioning with structured evidence." },
  { metric: "100%", label: "human approval on consequential actions", detail: "Every externally consequential action requires attorney review. AI advises. Attorneys decide." },
];

const pricingTiers = [
  {
    name: "Counsel",
    monthly: 499,
    annual: 415,
    desc: "For boutique plaintiff-side firms running a focused docket.",
    features: [
      "Up to 3 attorneys",
      "100 active matters",
      "PRISM matter health scoring",
      "Deadline & discovery tracking",
      "Settlement forecasting",
      "Insurer behavior profiles",
      "Standard reporting",
      "Email support",
    ],
    notIncluded: ["Practice analytics", "Portfolio-level intelligence", "Custom integrations"],
    cta: "Start Free Trial",
    highlight: false,
  },
  {
    name: "Practice",
    monthly: 1499,
    annual: 1249,
    desc: "For mid-size firms running multiple practice groups or high-volume dockets.",
    features: [
      "Up to 15 attorneys",
      "Unlimited active matters",
      "Full PRISM intelligence — all 6 lenses",
      "Practice group analytics",
      "Portfolio exposure modeling",
      "Insurer & party intelligence suite",
      "Venue & verdict benchmarking",
      "API access & CRM integration",
      "Priority support (4h response)",
      "Practice-specific modules",
    ],
    notIncluded: ["Dedicated success manager"],
    cta: "Start Free Trial",
    highlight: true,
  },
  {
    name: "Enterprise",
    monthly: null,
    annual: null,
    desc: "For large firms and litigation departments with complex, multi-jurisdiction portfolios.",
    features: [
      "Unlimited attorneys & staff",
      "Unlimited matter capacity",
      "Custom intelligence models",
      "Multi-jurisdiction portfolio command",
      "Mass tort & MDL modules",
      "Custom insurer & carrier data",
      "SSO / SAML / SCIM",
      "Dedicated Customer Success Manager",
      "SLA: 99.9% uptime",
      "Audit trails & compliance exports",
      "White-glove onboarding",
      "Quarterly strategic reviews",
    ],
    notIncluded: [],
    cta: "Contact Sales",
    highlight: false,
  },
];

function useInView(threshold = 0.1) {
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

function Reveal({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const { ref, visible } = useInView();
  return (
    <div ref={ref} className={`transition-all duration-700 ease-out ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"} ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

export default function PrismCounselMarketingLanding() {
  const [mobileNav, setMobileNav] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [demoOpen, setDemoOpen] = useState(false);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: BG, color: "rgba(255,255,255,0.75)", fontFamily: "'Inter', system-ui, sans-serif" }}>

      <nav className={`fixed top-0 left-0 right-0 z-50 h-14 flex items-center transition-all duration-400 ${scrolled ? "border-b" : ""}`}
        style={{ background: scrolled ? "rgba(8,12,20,0.96)" : "transparent", backdropFilter: scrolled ? "blur(20px)" : "none", borderColor: "rgba(200,169,110,0.08)" }}>
        <div className="max-w-[1100px] mx-auto px-6 w-full flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg" style={{ background: "rgba(200,169,110,0.08)", border: "1px solid rgba(200,169,110,0.15)" }}>
              <Scale size={13} style={{ color: ACCENT }} />
            </div>
            <span className="font-bold text-sm tracking-tight text-white">PRISM Counsel</span>
            <span className="hidden sm:inline text-[9px] tracking-[0.14em] uppercase ml-1 font-mono" style={{ color: "rgba(255,255,255,0.15)" }}>Matter Intelligence</span>
          </div>
          <div className="hidden md:flex items-center gap-7">
            {[
              { label: "Capabilities", href: "#capabilities" },
              { label: "Practice Modules", href: "#practice" },
              { label: "Use Cases", href: "#use-cases" },
              { label: "Proof", href: "#proof" },
              { label: "Pricing", href: "#pricing" },
            ].map(l => (
              <a key={l.label} href={l.href} className="text-[11px] tracking-[0.06em] uppercase font-medium transition-colors" style={{ color: "rgba(255,255,255,0.3)" }}
                onMouseOver={e => (e.currentTarget.style.color = "rgba(255,255,255,0.7)")}
                onMouseOut={e => (e.currentTarget.style.color = "rgba(255,255,255,0.3)")}>{l.label}</a>
            ))}
            <button onClick={() => setDemoOpen(true)} className="text-[12px] font-semibold px-5 py-1.5 rounded-lg transition-all" style={{ background: ACCENT, color: "#080c14" }}>
              Request Demo
            </button>
          </div>
          <button className="md:hidden p-2" onClick={() => setMobileNav(!mobileNav)} style={{ color: "rgba(255,255,255,0.4)" }}>
            {mobileNav ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      {mobileNav && (
        <div className="fixed inset-0 z-40 flex flex-col items-center justify-center gap-7 md:hidden" style={{ background: "rgba(8,12,20,0.98)", backdropFilter: "blur(16px)" }}>
          {[{ label: "Capabilities", href: "#capabilities" }, { label: "Practice Modules", href: "#practice" }, { label: "Use Cases", href: "#use-cases" }, { label: "Proof", href: "#proof" }, { label: "Pricing", href: "#pricing" }].map(l => (
            <a key={l.label} href={l.href} onClick={() => setMobileNav(false)} className="text-lg tracking-wide" style={{ color: "rgba(255,255,255,0.55)" }}>{l.label}</a>
          ))}
          <button onClick={() => { setDemoOpen(true); setMobileNav(false); }} className="mt-4 text-sm font-semibold px-8 py-3 rounded-xl" style={{ background: ACCENT, color: "#080c14" }}>
            Request Demo
          </button>
        </div>
      )}

      <div className="absolute top-0 left-0 right-0 h-[600px] pointer-events-none overflow-hidden">
        <div className="absolute top-[200px] left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full" style={{ background: "radial-gradient(ellipse, rgba(200,169,110,0.025) 0%, transparent 70%)" }} />
      </div>

      {/* HERO */}
      <section className="relative pt-32 sm:pt-44 pb-24 sm:pb-32 max-w-[1100px] mx-auto px-6">
        <Reveal>
          <p className="text-[10px] font-semibold tracking-[0.2em] uppercase mb-8 font-mono" style={{ color: "rgba(200,169,110,0.45)" }}>
            SZL Holdings &middot; Plaintiff-Side Litigation Intelligence
          </p>
        </Reveal>

        <Reveal delay={80}>
          <h1 className="text-[clamp(2.4rem,6vw,4.5rem)] font-extrabold leading-[1.04] tracking-[-0.03em] text-white max-w-[800px]">
            Litigation intelligence<br />
            <span style={{ color: ACCENT }}>built for plaintiff counsel.</span>
          </h1>
        </Reveal>

        <Reveal delay={180}>
          <p className="text-[17px] sm:text-[19px] leading-[1.8] max-w-[580px] mt-6 mb-10" style={{ color: "rgba(255,255,255,0.32)" }}>
            PRISM Counsel gives plaintiff-side litigation teams a single command surface for matter health, settlement intelligence, insurer behavior, and portfolio analytics — with every AI output source-traced and attorney-governed.
          </p>
        </Reveal>

        <Reveal delay={280}>
          <div className="flex flex-wrap gap-3 mb-20">
            <button onClick={() => setDemoOpen(true)} className="inline-flex items-center gap-2 text-[13px] font-semibold px-7 py-3 rounded-lg transition-all" style={{ background: ACCENT, color: "#080c14" }}>
              Request a Demo <ArrowRight size={14} />
            </button>
            <a href="/prism-counsel/" className="inline-flex items-center gap-2 text-[13px] font-medium px-7 py-3 rounded-lg transition-all" style={{ color: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.12)" }}>
              Enter Platform →
            </a>
          </div>
        </Reveal>

        <Reveal delay={360}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-px rounded-xl overflow-hidden" style={{ background: "rgba(255,255,255,0.04)" }}>
            {[
              { value: "6 lenses", label: "PRISM intelligence" },
              { value: "< 4 min", label: "Matter health refresh" },
              { value: "100%", label: "Attorney approval gates" },
              { value: "4 modules", label: "Practice specializations" },
            ].map(s => (
              <div key={s.label} className="py-5 px-5" style={{ background: BG }}>
                <span className="text-[22px] font-extrabold font-mono text-white block">{s.value}</span>
                <span className="text-[10px] tracking-[0.06em] uppercase mt-1 block" style={{ color: "rgba(255,255,255,0.22)" }}>{s.label}</span>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* PROBLEM STATEMENT */}
      <section className="py-24 sm:py-32 px-6" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
        <div className="max-w-[720px] mx-auto">
          <Reveal>
            <p className="text-[10px] font-semibold tracking-[0.2em] uppercase mb-6 font-mono" style={{ color: "rgba(255,255,255,0.18)" }}>The Problem</p>
            <h2 className="text-[clamp(1.5rem,3.5vw,2.5rem)] font-bold leading-[1.15] tracking-tight text-white mb-8">
              Litigation complexity outpaces the spreadsheet.
            </h2>
          </Reveal>
          <Reveal delay={80}>
            <div className="text-[15px] leading-[2] space-y-6" style={{ color: "rgba(255,255,255,0.3)" }}>
              <p>
                The best plaintiff-side firms operate with deep matter knowledge — insurer behavior histories, venue tendencies, comparable outcomes, deadline chains, and settlement positioning. The problem: <span style={{ color: "rgba(255,255,255,0.7)" }}>this knowledge lives in attorneys' heads, email threads, and spreadsheets</span> that don't scale, don't alert, and don't compound.
              </p>
              <p>
                Clio and similar platforms manage the docket. Westlaw and Lexis handle research. Neither tells you which matters are at risk today, which insurers are delaying in bad faith, or which settlements are being left on the table. <span style={{ color: "rgba(255,255,255,0.7)" }}>That is what PRISM Counsel does.</span>
              </p>
            </div>
          </Reveal>

          <Reveal delay={160}>
            <div className="mt-14 grid grid-cols-2 sm:grid-cols-3 gap-4">
              {[
                { label: "Deadline misses", source: "Calendar gaps + attorney oversight" },
                { label: "Settlement lag", source: "No comparable outcome data" },
                { label: "Insurer patterns missed", source: "Per-matter handling, no portfolio view" },
                { label: "Portfolio blind spots", source: "No aggregate exposure visibility" },
                { label: "AI without audit trails", source: "Generic tools, no privilege awareness" },
                { label: "Status meetings, not command", source: "Information assembled manually" },
              ].map(item => (
                <div key={item.label} className="p-4 rounded-xl" style={{ background: "rgba(200,169,110,0.03)", border: "1px solid rgba(200,169,110,0.08)" }}>
                  <p className="text-[12px] font-semibold text-white mb-1">{item.label}</p>
                  <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.28)" }}>{item.source}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* CAPABILITIES */}
      <section id="capabilities" className="py-24 sm:py-32 px-6" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
        <div className="max-w-[1100px] mx-auto">
          <Reveal>
            <div className="max-w-[560px] mb-14">
              <p className="text-[10px] font-semibold tracking-[0.2em] uppercase mb-4 font-mono" style={{ color: "rgba(255,255,255,0.18)" }}>Platform Capabilities</p>
              <h2 className="text-[clamp(1.5rem,3.5vw,2.4rem)] font-bold leading-[1.15] tracking-tight text-white mb-4">
                Eight capabilities. One operating surface.
              </h2>
              <p className="text-[15px] leading-[1.85]" style={{ color: "rgba(255,255,255,0.28)" }}>
                Not a docket management tool. Not a research portal. A matter intelligence platform built for the way plaintiff counsel actually works.
              </p>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {capabilities.map((c, i) => (
              <Reveal key={c.title} delay={i * 40}>
                <div className="p-5 rounded-xl h-full" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(200,169,110,0.08)", border: "1px solid rgba(200,169,110,0.12)" }}>
                      <c.icon size={14} style={{ color: ACCENT }} />
                    </div>
                    <span className="text-[9px] font-semibold tracking-[0.1em] uppercase" style={{ color: c.tag === "Intelligence" ? "rgba(139,92,246,0.6)" : c.tag === "Governance" ? "rgba(200,169,110,0.5)" : "rgba(255,255,255,0.2)" }}>{c.tag}</span>
                  </div>
                  <h3 className="text-[13px] font-bold text-white mb-2">{c.title}</h3>
                  <p className="text-[12px] leading-[1.75]" style={{ color: "rgba(255,255,255,0.3)" }}>{c.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* PRISM FRAMEWORK */}
      <section className="py-24 sm:py-32 px-6" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
        <div className="max-w-[1100px] mx-auto">
          <Reveal>
            <div className="max-w-[560px] mb-14">
              <p className="text-[10px] font-semibold tracking-[0.2em] uppercase mb-4 font-mono" style={{ color: "rgba(255,255,255,0.18)" }}>The Intelligence Framework</p>
              <h2 className="text-[clamp(1.5rem,3.5vw,2.4rem)] font-bold leading-[1.15] tracking-tight text-white mb-4">
                PRISM — six lenses on every matter.
              </h2>
              <p className="text-[15px] leading-[1.85]" style={{ color: "rgba(255,255,255,0.28)" }}>
                Every active matter is scored continuously across six intelligence dimensions. Not status indicators — structured signals with confidence levels and evidence chains.
              </p>
            </div>
          </Reveal>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { letter: "P", name: "Posture", desc: "Liability, coverage, venue, opposing counsel assessment", color: "#c8a96e" },
              { letter: "R", name: "Readiness", desc: "Demand, discovery, deposition, mediation, trial readiness", color: "#8b7ac8" },
              { letter: "I", name: "Integrity", desc: "Source lineage, privilege risk, deadline completeness", color: "#4a90b8" },
              { letter: "S", name: "Strategy", desc: "Next best actions, leverage points, evidence gaps", color: "#6b8f71" },
              { letter: "M", name: "Money", desc: "Settlement forecasting, lien exposure, damages completeness", color: "#c87a4a" },
              { letter: "G", name: "Governance", desc: "Approval state, AI trace, role attribution, access scope", color: "#7a8ab8" },
            ].map((p, i) => (
              <Reveal key={p.letter} delay={i * 50}>
                <div className="p-5 rounded-xl text-center h-full" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
                  <span className="text-[32px] font-extrabold font-mono block mb-2" style={{ color: p.color }}>{p.letter}</span>
                  <p className="text-[12px] font-bold text-white mb-2">{p.name}</p>
                  <p className="text-[10px] leading-[1.7]" style={{ color: "rgba(255,255,255,0.25)" }}>{p.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* PRACTICE MODULES */}
      <section id="practice" className="py-24 sm:py-32 px-6" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
        <div className="max-w-[1100px] mx-auto">
          <Reveal>
            <div className="max-w-[560px] mb-14">
              <p className="text-[10px] font-semibold tracking-[0.2em] uppercase mb-4 font-mono" style={{ color: "rgba(255,255,255,0.18)" }}>Practice Specializations</p>
              <h2 className="text-[clamp(1.5rem,3.5vw,2.4rem)] font-bold leading-[1.15] tracking-tight text-white mb-4">
                Domain-specific intelligence for every practice.
              </h2>
              <p className="text-[15px] leading-[1.85]" style={{ color: "rgba(255,255,255,0.28)" }}>
                PRISM ships with pre-built intelligence models for the four core plaintiff-side practice types. Not generic — calibrated to the signals, counterparties, and outcomes that matter in each domain.
              </p>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {practiceModules.map((m, i) => (
              <Reveal key={m.name} delay={i * 60}>
                <div className="p-7 rounded-xl h-full" style={{ background: "rgba(200,169,110,0.02)", border: "1px solid rgba(200,169,110,0.07)" }}>
                  <div className="flex items-center gap-2 mb-3">
                    <BookOpen size={14} style={{ color: ACCENT }} />
                    <h3 className="text-[14px] font-bold text-white">{m.name}</h3>
                  </div>
                  <p className="text-[13px] leading-[1.8] mb-5" style={{ color: "rgba(255,255,255,0.35)" }}>{m.desc}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {m.metrics.map(metric => (
                      <div key={metric} className="flex items-center gap-1.5">
                        <div className="w-1 h-1 rounded-full" style={{ background: ACCENT, opacity: 0.5 }} />
                        <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.35)" }}>{metric}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* USE CASES */}
      <section id="use-cases" className="py-24 sm:py-32 px-6" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
        <div className="max-w-[1100px] mx-auto">
          <Reveal>
            <div className="max-w-[560px] mb-14">
              <p className="text-[10px] font-semibold tracking-[0.2em] uppercase mb-4 font-mono" style={{ color: "rgba(255,255,255,0.18)" }}>Who Runs on PRISM</p>
              <h2 className="text-[clamp(1.5rem,3.5vw,2.4rem)] font-bold leading-[1.15] tracking-tight text-white mb-4">
                Built for every role in a plaintiff-side firm.
              </h2>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {useCases.map((u, i) => (
              <Reveal key={u.role} delay={i * 70}>
                <div className="p-7 rounded-xl h-full" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "rgba(200,169,110,0.08)", border: "1px solid rgba(200,169,110,0.12)" }}>
                      <u.icon size={16} style={{ color: ACCENT }} />
                    </div>
                    <span className="text-[10px] font-bold tracking-[0.1em] uppercase" style={{ color: "rgba(200,169,110,0.6)" }}>{u.role}</span>
                  </div>
                  <h3 className="text-[16px] font-semibold text-white mb-3 leading-snug">{u.headline}</h3>
                  <p className="text-[13px] leading-[1.8] mb-5" style={{ color: "rgba(255,255,255,0.32)" }}>{u.desc}</p>
                  <div className="flex flex-wrap gap-2">
                    {u.signals.map(s => (
                      <span key={s} className="text-[10px] px-2.5 py-1 rounded-full" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)" }}>{s}</span>
                    ))}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* PROOF */}
      <section id="proof" className="py-24 sm:py-32 px-6" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
        <div className="max-w-[1100px] mx-auto">
          <Reveal>
            <div className="max-w-[560px] mb-14">
              <p className="text-[10px] font-semibold tracking-[0.2em] uppercase mb-4 font-mono" style={{ color: "rgba(255,255,255,0.18)" }}>Documented Results</p>
              <h2 className="text-[clamp(1.5rem,3.5vw,2.4rem)] font-bold leading-[1.15] tracking-tight text-white mb-4">
                Outcomes from production deployments.
              </h2>
              <p className="text-[15px] leading-[1.85]" style={{ color: "rgba(255,255,255,0.28)" }}>
                Not projections. Specific operational improvements from PRISM running in active plaintiff-side practices.
              </p>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {proofPoints.map((p, i) => (
              <Reveal key={p.label} delay={i * 60}>
                <div className="p-7 rounded-xl h-full" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <span className="text-[2.5rem] font-extrabold font-mono block mb-2" style={{ color: ACCENT }}>{p.metric}</span>
                  <p className="text-[12px] font-bold text-white mb-2">{p.label}</p>
                  <p className="text-[11px] leading-[1.75]" style={{ color: "rgba(255,255,255,0.3)" }}>{p.detail}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* TRUST & GOVERNANCE */}
      <section className="py-24 sm:py-32 px-6" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
        <div className="max-w-[900px] mx-auto">
          <Reveal>
            <div className="max-w-[560px] mb-14">
              <p className="text-[10px] font-semibold tracking-[0.2em] uppercase mb-4 font-mono" style={{ color: "rgba(255,255,255,0.18)" }}>Trust & Governance</p>
              <h2 className="text-[clamp(1.5rem,3.5vw,2.4rem)] font-bold leading-[1.15] tracking-tight text-white mb-4">
                Built for the ethical obligations of legal practice.
              </h2>
              <p className="text-[15px] leading-[1.85]" style={{ color: "rgba(255,255,255,0.28)" }}>
                PRISM Counsel is not a generic AI tool running on your matter data. It is a governed intelligence platform designed around privilege, professional responsibility, and human accountability.
              </p>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { icon: Lock, title: "Privilege-aware data layer", desc: "Attorney-client privilege boundaries enforced at the database layer. Cross-matter privilege leakage is architecturally prevented, not policy-prevented." },
              { icon: Eye, title: "Source-traced AI outputs", desc: "Every AI assertion is traceable to source documents or explicitly flagged as inference. No invented citations. No confidence-laundering." },
              { icon: CheckCircle, title: "Human approval on consequential actions", desc: "Demand sends, settlement acceptances, court filings, and client disclosures all require attorney review and approval. AI advises. Attorneys decide." },
              { icon: Shield, title: "Immutable audit trail", desc: "Every action, recommendation, approval, and AI output is logged with actor attribution, timestamp, and reasoning. The audit trail is operational, not ceremonial." },
              { icon: Users, title: "Role-based access control", desc: "Organization-scoped permissions for partners, lead attorneys, associates, paralegals, and staff. No global access by default. Privilege markers prevent unauthorized surfacing." },
              { icon: Target, title: "Confidence and provenance", desc: "Every forecast and recommendation includes confidence level, contributing signals, and source freshness. Low-confidence outputs are visually marked and require human review." },
            ].map((item, i) => (
              <Reveal key={item.title} delay={i * 50}>
                <div className="p-6 rounded-xl h-full" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
                  <div className="flex items-center gap-3 mb-3">
                    <item.icon size={16} style={{ color: ACCENT, opacity: 0.7 }} />
                    <h3 className="text-[13px] font-bold text-white">{item.title}</h3>
                  </div>
                  <p className="text-[12px] leading-[1.8]" style={{ color: "rgba(255,255,255,0.3)" }}>{item.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={200}>
            <div className="mt-8 p-6 rounded-xl" style={{ background: "rgba(200,169,110,0.03)", border: "1px solid rgba(200,169,110,0.08)" }}>
              <p className="text-[12px] font-semibold text-white mb-2">Part of the SZL Holdings trust infrastructure</p>
              <p className="text-[12px] leading-[1.8]" style={{ color: "rgba(255,255,255,0.35)" }}>
                PRISM Counsel operates under the same security architecture, SOC 2 compliance framework, and governance model as all SZL Holdings platforms.{" "}
                <a href="/szl-holdings/trust" className="underline" style={{ color: "rgba(200,169,110,0.7)" }}>View the SZL Trust Center →</a>
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="py-24 sm:py-32 px-6" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
        <div className="max-w-[1100px] mx-auto">
          <Reveal>
            <div className="max-w-[560px] mb-14">
              <p className="text-[10px] font-semibold tracking-[0.2em] uppercase mb-4 font-mono" style={{ color: "rgba(255,255,255,0.18)" }}>Pricing</p>
              <h2 className="text-[clamp(1.5rem,3.5vw,2.4rem)] font-bold leading-[1.15] tracking-tight text-white mb-4">
                Transparent pricing for every firm size.
              </h2>
              <p className="text-[15px] leading-[1.85]" style={{ color: "rgba(255,255,255,0.28)" }}>
                From boutique plaintiff firms to large litigation departments. Every plan includes the full intelligence layer.
              </p>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {pricingTiers.map((tier, i) => {
              const price = tier.annual;
              return (
                <Reveal key={tier.name} delay={i * 70}>
                  <div className="relative rounded-2xl p-8 h-full flex flex-col" style={{
                    background: tier.highlight ? `linear-gradient(135deg, rgba(200,169,110,0.10), rgba(200,169,110,0.04))` : "rgba(255,255,255,0.02)",
                    border: tier.highlight ? `1px solid rgba(200,169,110,0.3)` : "1px solid rgba(255,255,255,0.06)",
                  }}>
                    {tier.highlight && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider" style={{ background: ACCENT, color: "#080c14" }}>
                        Most Popular
                      </div>
                    )}
                    <h3 className="text-[16px] font-bold text-white mb-2">{tier.name}</h3>
                    <p className="text-[12px] mb-5 leading-relaxed" style={{ color: "rgba(255,255,255,0.4)" }}>{tier.desc}</p>

                    <div className="mb-6">
                      {price !== null ? (
                        <div className="flex items-end gap-1.5">
                          <span className="text-[2.4rem] font-bold text-white">${price}</span>
                          <span className="text-[12px] mb-2" style={{ color: "rgba(255,255,255,0.35)" }}>/month, billed annually</span>
                        </div>
                      ) : (
                        <div className="text-[2rem] font-bold text-white">Custom</div>
                      )}
                    </div>

                    {tier.cta === "Contact Sales" ? (
                      <button onClick={() => setDemoOpen(true)} className="w-full py-3 rounded-xl text-[13px] font-semibold flex items-center justify-center gap-2 mb-7 transition-all" style={{ background: "rgba(255,255,255,0.08)", color: "white", border: "1px solid rgba(255,255,255,0.12)" }}>
                        Contact Sales <ArrowRight size={14} />
                      </button>
                    ) : (
                      <button onClick={() => setDemoOpen(true)} className="w-full py-3 rounded-xl text-[13px] font-semibold flex items-center justify-center gap-2 mb-7 transition-all" style={{ background: tier.highlight ? ACCENT : "rgba(255,255,255,0.08)", color: tier.highlight ? "#080c14" : "white", border: tier.highlight ? "none" : "1px solid rgba(255,255,255,0.12)" }}>
                        {tier.cta} — 14 days free <ArrowRight size={14} />
                      </button>
                    )}

                    <div className="flex-1 space-y-2">
                      {tier.features.map(f => (
                        <div key={f} className="flex items-start gap-2 text-[12px]" style={{ color: "rgba(255,255,255,0.65)" }}>
                          <CheckCircle size={13} className="mt-0.5 shrink-0" style={{ color: ACCENT }} />
                          {f}
                        </div>
                      ))}
                      {tier.notIncluded.map(f => (
                        <div key={f} className="flex items-start gap-2 text-[12px]" style={{ color: "rgba(255,255,255,0.22)" }}>
                          <X size={13} className="mt-0.5 shrink-0" />
                          {f}
                        </div>
                      ))}
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>

          <Reveal delay={200}>
            <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center max-w-2xl mx-auto">
              {[
                { label: "14-day free trial", desc: "Full platform access. No credit card required." },
                { label: "Privilege-first architecture", desc: "Data security designed for legal professional obligations." },
                { label: "No AI without audit trails", desc: "Every output is traced, attributable, and attorney-reviewed." },
              ].map(item => (
                <div key={item.label}>
                  <p className="text-[13px] font-semibold text-white mb-1">{item.label}</p>
                  <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.35)" }}>{item.desc}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 sm:py-32 px-6" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
        <div className="max-w-[640px] mx-auto text-center">
          <Reveal>
            <p className="text-[10px] font-semibold tracking-[0.2em] uppercase mb-6 font-mono" style={{ color: "rgba(255,255,255,0.18)" }}>Powered by Alloy &middot; SZL Holdings</p>
            <h2 className="text-[clamp(2rem,5vw,3.2rem)] font-extrabold leading-[1.08] tracking-tight text-white mb-6">
              See PRISM Counsel on your matter portfolio.
            </h2>
            <p className="text-[16px] leading-[1.8] mb-10" style={{ color: "rgba(255,255,255,0.3)" }}>
              Every demo is configured to your practice type and docket. We walk through live matter intelligence — not a generic product tour.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <button onClick={() => setDemoOpen(true)} className="inline-flex items-center gap-2 text-[14px] font-semibold px-8 py-4 rounded-xl transition-all" style={{ background: ACCENT, color: "#080c14" }}>
                Request a Private Demo <ArrowRight size={15} />
              </button>
              <a href="/prism-counsel/" className="inline-flex items-center gap-2 text-[14px] font-medium px-8 py-4 rounded-xl transition-all" style={{ color: "rgba(255,255,255,0.55)", border: "1px solid rgba(255,255,255,0.1)" }}>
                Enter Platform →
              </a>
            </div>
            <div className="mt-10 pt-8 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
              <p className="text-[11px] mb-4" style={{ color: "rgba(255,255,255,0.2)" }}>Part of the SZL Holdings platform family</p>
              <div className="flex flex-wrap gap-4 justify-center text-[11px]" style={{ color: "rgba(255,255,255,0.25)" }}>
                <a href="/szl-holdings/" className="hover:text-white/50 transition-colors">SZL Holdings →</a>
                <a href="/szl-holdings/trust" className="hover:text-white/50 transition-colors">Trust Center →</a>
                <a href="/szl-holdings/architecture" className="hover:text-white/50 transition-colors">Architecture →</a>
                <a href="/lyte-command-center/" className="hover:text-white/50 transition-colors">Lyte →</a>
                <a href="/vessels/" className="hover:text-white/50 transition-colors">Vessels →</a>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <ContactModal
        isOpen={demoOpen}
        onClose={() => setDemoOpen(false)}
        type="demo"
        app="prism-counsel"
        subtitle="PRISM Counsel — Matter Intelligence Platform"
      />
    </div>
  );
}
