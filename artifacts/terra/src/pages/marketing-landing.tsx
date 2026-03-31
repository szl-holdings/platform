import { useState, useEffect, useRef } from "react";
import {
  ArrowRight, Building2, MapPin, TrendingUp, DollarSign, Flame,
  BarChart3, Users, Search, FileText, Shield, Target, Layers,
  CheckCircle, Loader2, Menu, X,
} from "lucide-react";

const accent = "#5e9a32";
const accentLight = "#74b844";
const BG = "#080c06";

const modules = [
  {
    icon: Flame, title: "Distress Intelligence", color: "#ef4444",
    desc: "Real-time foreclosure tracking, lis pendens filings, auction calendars, and tax lien discovery across all five NYC boroughs. AI-scored opportunity ranking with confidence levels and hold-duration analysis.",
    metrics: ["340+ pre-foreclosure", "180+ active foreclosure", "290+ tax lien", "95 auction imminent"],
  },
  {
    icon: Search, title: "Ownership Intelligence", color: "#8b5cf6",
    desc: "LLC unmasking and entity resolution to identify beneficial owners, cross-reference debt maturity timelines, hold duration, and off-market propensity scores. See who owns what — and why they might sell.",
    metrics: ["Entity resolution", "Debt maturity", "Hold duration", "Propensity scoring"],
  },
  {
    icon: TrendingUp, title: "Deal Pipeline", color: "#3b82f6",
    desc: "Acquisitions and dispositions tracked from lead to close. Stage-gated pipeline with ownership assignments, priority scoring, and Alloy-driven workflow automation.",
    metrics: ["Lead-to-close tracking", "Stage gates", "Priority scoring", "Workflow automation"],
  },
  {
    icon: BarChart3, title: "Market Intelligence", color: "#f59e0b",
    desc: "Comparable sales analysis, price-per-sqft trends, borough-level market dynamics, and off-market opportunity discovery — updated continuously from primary data sources.",
    metrics: ["Comparable sales", "Price trends", "Market dynamics", "Off-market signals"],
  },
  {
    icon: Users, title: "Broker Operations", color: "#10b981",
    desc: "Broker-native CRM with contact management, deal history, tenant profiles, lease schedules, payment tracking, and renewal forecasting. Performance scorecards and response analytics.",
    metrics: ["Contact management", "Deal history", "Lease tracking", "Performance scoring"],
  },
  {
    icon: DollarSign, title: "Investment Analysis", color: "#c8a060",
    desc: "IRR modeling, cap rate analysis, and scenario planning with conservative, base, and aggressive assumptions. Climate risk overlays, FEMA zone cross-referencing, and portfolio-level return tracking.",
    metrics: ["IRR modeling", "Cap rate analysis", "Scenario planning", "Risk overlays"],
  },
];

const buyers = [
  { role: "Investors & Acquisitions", desc: "Source distressed opportunities, analyze ownership structures, model returns, and track deals from discovery to close — in one operating surface." },
  { role: "Brokers & Agents", desc: "Manage your deal pipeline, track client relationships, monitor market movement, and hit your numbers with real-time performance analytics." },
  { role: "Portfolio Teams", desc: "Monitor property health, track lease expirations, model renewals, and surface disposition opportunities before the market shifts." },
  { role: "Lenders & Capital", desc: "Underwrite with confidence. Cross-reference ownership, distress signals, market comps, and borrower history in a single intelligence view." },
];

const plans = [
  {
    id: "terra-starter", name: "Starter",
    monthlyPlanId: "terra-starter-monthly", annualPlanId: "terra-starter-annual",
    monthlyDisplay: "$149", annualDisplay: "$1,490",
    features: ["Distress feed (NYC, 5 boroughs)", "Ownership lookup — 50 queries/mo", "Deal pipeline — up to 10 active deals", "Market snapshot (read-only)", "Email support"],
  },
  {
    id: "terra-pro", name: "Pro",
    monthlyPlanId: "terra-pro-monthly", annualPlanId: "terra-pro-annual",
    monthlyDisplay: "$349", annualDisplay: "$3,490", highlighted: true,
    features: ["Everything in Starter", "Unlimited ownership lookups", "Unlimited deal pipeline", "Investment analysis & IRR modeling", "Broker operations CRM", "API access (10k calls/mo)", "Priority support"],
  },
  {
    id: "terra-enterprise", name: "Enterprise",
    monthlyPlanId: "terra-enterprise-monthly", annualPlanId: "terra-enterprise-annual",
    monthlyDisplay: "Custom", annualDisplay: "Custom", isCustom: true,
    features: ["Everything in Pro", "Multi-seat / team access", "Custom data integrations", "Dedicated account manager", "SLA & uptime guarantee", "Private deal flow network", "Custom reporting & exports"],
  },
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

function Reveal({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const { ref, visible } = useInView();
  return (
    <div ref={ref} className={`transition-all duration-1000 ease-out ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"} ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

export default function TerraMarketingLanding({ onSignIn }: { onSignIn?: () => void }) {
  const [annual, setAnnual] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [mobileNav, setMobileNav] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeModule, setActiveModule] = useState(0);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  const handleSubscribe = async (plan: typeof plans[number]) => {
    if (plan.isCustom) { onSignIn?.(); return; }
    const planKey = annual ? plan.annualPlanId : plan.monthlyPlanId;
    setCheckoutLoading(plan.id);
    setCheckoutError(null);
    try {
      const baseUrl = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
      const successUrl = window.location.origin + baseUrl + "/?subscribe=success";
      const cancelUrl = window.location.origin + baseUrl + "/?subscribe=cancel";
      const res = await fetch("/api/billing/terra/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: planKey, successUrl, cancelUrl }),
      });
      const data = await res.json();
      const url = data?.data?.url ?? data?.url;
      if (url) { window.location.href = url; }
      else { setCheckoutError(data?.error ?? data?.message ?? "Could not start checkout."); }
    } catch { setCheckoutError("Network error. Please try again."); }
    finally { setCheckoutLoading(null); }
  };

  return (
    <div className="min-h-screen text-[#dde4cc] overflow-x-hidden" style={{ background: BG, fontFamily: "'Inter', system-ui, sans-serif" }}>

      <nav className={`fixed top-0 left-0 right-0 z-50 h-14 flex items-center transition-all duration-500 ${scrolled ? "bg-[#080c06]/90 backdrop-blur-2xl border-b border-green-600/[0.06]" : "bg-transparent"}`}>
        <div className="max-w-[1200px] mx-auto px-6 w-full flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${accent}15`, border: `1px solid ${accent}30` }}>
              <Building2 size={13} style={{ color: accentLight }} />
            </div>
            <span className="font-bold text-[15px] tracking-tight text-white">Terra</span>
            <span className="hidden sm:inline text-[9px] tracking-[0.15em] uppercase text-white/15 font-mono ml-1">Property Intelligence</span>
          </div>
          <div className="hidden md:flex items-center gap-7">
            {[{ label: "Platform", href: "#platform" }, { label: "Modules", href: "#modules" }, { label: "Markets", href: "#markets" }, { label: "Pricing", href: "#pricing" }].map(l => (
              <a key={l.label} href={l.href} className="text-[11px] text-white/30 hover:text-white/60 transition-colors tracking-[0.08em] uppercase font-medium">{l.label}</a>
            ))}
            <button onClick={onSignIn} className="text-[12px] font-semibold text-[#080c06] rounded-lg px-5 py-1.5 transition-all" style={{ background: accentLight }}>Sign in</button>
          </div>
          <button className="md:hidden p-2 text-white/40" onClick={() => setMobileNav(!mobileNav)} aria-label={mobileNav ? "Close menu" : "Open menu"} aria-expanded={mobileNav}>
            {mobileNav ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      {mobileNav && (
        <div className="fixed inset-0 z-40 bg-[#080c06]/98 backdrop-blur-xl flex flex-col items-center justify-center gap-8 md:hidden">
          {[{ label: "Platform", href: "#platform" }, { label: "Modules", href: "#modules" }, { label: "Markets", href: "#markets" }, { label: "Pricing", href: "#pricing" }].map(l => (
            <a key={l.label} href={l.href} onClick={() => setMobileNav(false)} className="text-lg text-white/50 hover:text-white tracking-wide transition-colors">{l.label}</a>
          ))}
          <button onClick={() => { onSignIn?.(); setMobileNav(false); }} className="mt-4 text-sm font-semibold text-[#080c06] rounded-lg px-8 py-3" style={{ background: accentLight }}>Sign in</button>
        </div>
      )}

      <div className="absolute top-0 left-0 right-0 h-[800px] overflow-hidden pointer-events-none">
        <div className="absolute top-[200px] left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full" style={{ background: "radial-gradient(ellipse, rgba(94,154,50,0.04) 0%, transparent 70%)" }} />
      </div>

      <section className="relative pt-32 sm:pt-40 pb-20 sm:pb-28 max-w-[1200px] mx-auto px-6">
        <Reveal>
          <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-white/15 mb-8 font-mono">SZL Holdings &middot; NYC Real Estate Intelligence</p>
        </Reveal>

        <Reveal delay={100}>
          <h1 className="text-[clamp(2.5rem,6vw,4.5rem)] font-extrabold leading-[1.04] tracking-[-0.03em] text-white max-w-[900px]">
            See the deal before
          </h1>
        </Reveal>
        <Reveal delay={200}>
          <h1 className="text-[clamp(2.5rem,6vw,4.5rem)] font-extrabold leading-[1.04] tracking-[-0.03em] max-w-[900px] mb-8">
            <span style={{ color: accentLight }}>anyone else does.</span>
          </h1>
        </Reveal>

        <Reveal delay={300}>
          <p className="text-[17px] sm:text-[19px] leading-[1.75] text-white/30 max-w-[640px] mb-12">
            NYC real estate moves on information asymmetry. Terra surfaces distressed
            properties, unmasks ownership structures, and delivers market intelligence
            from one operating surface — so you close deals, not browser tabs.
          </p>
        </Reveal>

        <Reveal delay={400}>
          <div className="flex flex-wrap gap-3 mb-20">
            <button onClick={onSignIn} className="text-[13px] font-semibold text-[#080c06] rounded-lg px-7 py-3 flex items-center gap-2 transition-all hover:shadow-lg" style={{ background: accentLight }}>
              Start Free Trial <ArrowRight size={14} />
            </button>
            <button className="text-[13px] font-medium text-white/35 border border-white/[0.06] hover:border-white/[0.12] rounded-lg px-7 py-3 transition-all">
              Request a Demo
            </button>
          </div>
        </Reveal>

        <Reveal delay={500}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-px rounded-xl overflow-hidden" style={{ background: "rgba(255,255,255,0.04)" }}>
            {[
              { value: "1,025+", label: "Distressed properties" },
              { value: "$4.8B", label: "Pipeline value" },
              { value: "5", label: "NYC boroughs" },
              { value: "6", label: "Intelligence modules" },
            ].map(s => (
              <div key={s.label} className="py-5 px-5" style={{ background: BG }}>
                <span className="text-[22px] font-extrabold font-mono text-white block">{s.value}</span>
                <span className="text-[10px] tracking-[0.08em] uppercase text-white/20 mt-1 block">{s.label}</span>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      <Reveal>
        <section id="platform" className="relative py-24 sm:py-32 px-6">
          <div className="max-w-[760px] mx-auto">
            <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-white/15 mb-6">The Thesis</p>
            <h2 className="text-[clamp(1.5rem,3.5vw,2.5rem)] font-bold leading-[1.15] tracking-tight text-white mb-8">
              Information asymmetry wins deals.
              <span className="text-white/20"> Terra gives you the edge.</span>
            </h2>
            <div className="text-[16px] leading-[2] text-white/30 space-y-6">
              <p>
                The brokers and investors who win in NYC are the ones who see
                <span className="text-white/60"> distress signals first</span>, understand
                <span className="text-white/60"> ownership structures fastest</span>, and execute
                <span className="text-white/60"> deals with the most context</span>.
              </p>
              <p>
                Terra doesn't replace your CRM or your spreadsheets. It replaces the
                14 browser tabs, 3 paid data services, and 2 hours of morning research
                that currently stand between you and your first actionable lead of the day.
              </p>
            </div>
          </div>

          <div className="max-w-[760px] mx-auto mt-16 border border-white/[0.05] rounded-2xl p-7 sm:p-8" style={{ background: `${accent}04` }}>
            <div className="flex justify-between items-center mb-6">
              <span className="text-[9px] font-bold tracking-[0.15em] uppercase text-white/20">NYC Distress Snapshot</span>
              <span className="flex items-center gap-1.5 text-[9px] font-mono" style={{ color: `${accentLight}80` }}>
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: accentLight }} />
                Live
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              {[
                { label: "Pre-Foreclosure", count: "340+", color: "#f59e0b" },
                { label: "Active Foreclosure", count: "180+", color: "#ef4444" },
                { label: "Tax Lien", count: "290+", color: "#f97316" },
                { label: "Auction Imminent", count: "95", color: "#a855f7" },
                { label: "REO / Bank-Owned", count: "120+", color: "#3b82f6" },
              ].map(d => (
                <div key={d.label} className="text-center">
                  <span className="text-[24px] font-extrabold font-mono block" style={{ color: d.color }}>{d.count}</span>
                  <span className="text-[10px] text-white/25 mt-1 block">{d.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section id="modules" className="relative py-24 sm:py-32 px-6">
          <div className="max-w-[1200px] mx-auto">
            <div className="max-w-[600px] mb-16">
              <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-white/15 mb-4">Platform Capabilities</p>
              <h2 className="text-[clamp(1.5rem,3.5vw,2.5rem)] font-bold leading-[1.15] tracking-tight text-white mb-4">
                Six modules. One operating surface.
              </h2>
              <p className="text-[16px] leading-[1.8] text-white/28">
                Each module serves a distinct function in the real estate intelligence
                workflow — from discovery through analysis to close.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6">
              <div className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
                {modules.map((mod, i) => (
                  <button
                    key={mod.title}
                    onClick={() => setActiveModule(i)}
                    className="flex items-center gap-2.5 px-4 py-3 rounded-xl text-left transition-all whitespace-nowrap lg:whitespace-normal shrink-0 lg:shrink"
                    style={{
                      background: activeModule === i ? `${mod.color}08` : "transparent",
                      border: `1px solid ${activeModule === i ? `${mod.color}20` : "transparent"}`,
                    }}
                  >
                    <mod.icon size={15} style={{ color: activeModule === i ? mod.color : "rgba(255,255,255,0.12)" }} className="shrink-0" />
                    <span className={`text-[12px] font-semibold ${activeModule === i ? "text-white" : "text-white/35"}`}>{mod.title}</span>
                  </button>
                ))}
              </div>

              <div className="border border-white/[0.05] rounded-2xl p-8 sm:p-10 transition-all" style={{ background: `${modules[activeModule].color}03` }}>
                <div className="flex items-center gap-3 mb-2">
                  {(() => { const Icon = modules[activeModule].icon; return <Icon size={22} style={{ color: modules[activeModule].color }} />; })()}
                  <h3 className="text-[20px] font-bold text-white">{modules[activeModule].title}</h3>
                </div>
                <p className="text-[14px] leading-[1.85] text-white/35 mt-4 mb-6 max-w-[560px]">{modules[activeModule].desc}</p>
                <div className="flex flex-wrap gap-2">
                  {modules[activeModule].metrics.map(m => (
                    <span key={m} className="text-[10px] font-semibold px-3 py-1.5 rounded-lg" style={{ background: `${modules[activeModule].color}08`, color: `${modules[activeModule].color}aa`, border: `1px solid ${modules[activeModule].color}15` }}>{m}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section id="markets" className="relative py-24 sm:py-32 px-6">
          <div className="max-w-[1200px] mx-auto">
            <div className="max-w-[560px] mb-16">
              <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-white/15 mb-4">Who It's For</p>
              <h2 className="text-[clamp(1.5rem,3.5vw,2.5rem)] font-bold leading-[1.15] tracking-tight text-white mb-4">
                Built for the people who close deals
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-px rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.04)" }}>
              {buyers.map(b => (
                <div key={b.role} className="p-8" style={{ background: BG }}>
                  <h3 className="text-[14px] font-bold text-white mb-3">{b.role}</h3>
                  <p className="text-[13px] leading-[1.85] text-white/30">{b.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section id="pricing" className="relative py-24 sm:py-32 px-6">
          <div className="max-w-[1200px] mx-auto">
            <div className="max-w-[560px] mb-10">
              <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-white/15 mb-4">Pricing</p>
              <h2 className="text-[clamp(1.5rem,3.5vw,2.5rem)] font-bold leading-[1.15] tracking-tight text-white mb-4">
                Transparent plans. No surprises.
              </h2>
              <p className="text-[14px] text-white/28 mb-6">
                Start free for 14 days. No credit card required.
              </p>
            </div>

            <div className="flex items-center gap-3 mb-12">
              <span className={`text-[13px] font-medium ${annual ? "text-white/25" : "text-white/60"}`}>Monthly</span>
              <button
                onClick={() => setAnnual(!annual)}
                className="w-10 h-[22px] rounded-full relative transition-colors"
                style={{ background: annual ? accentLight : "rgba(255,255,255,0.08)" }}
              >
                <span className="absolute top-[3px] w-4 h-4 rounded-full bg-white transition-all" style={{ left: annual ? "21px" : "3px" }} />
              </button>
              <span className={`text-[13px] font-medium ${annual ? "text-white/60" : "text-white/25"}`}>
                Annual <span className="text-[10px] px-2 py-0.5 rounded-lg ml-1" style={{ background: `${accentLight}15`, color: accentLight }}>Save 15%</span>
              </span>
            </div>

            {checkoutError && (
              <div className="mb-6 px-4 py-3 bg-red-500/[0.08] border border-red-500/20 rounded-xl text-[13px] text-red-400">
                {checkoutError}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-px rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.04)" }}>
              {plans.map(plan => (
                <div key={plan.id} className="p-8 relative" style={{ background: plan.highlighted ? `${accent}08` : BG }}>
                  {plan.highlighted && <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: `linear-gradient(90deg, ${accent}, ${accentLight})` }} />}
                  {plan.highlighted && <div className="absolute top-4 right-5 text-[9px] font-bold tracking-[0.12em] uppercase" style={{ color: accentLight }}>Most Popular</div>}
                  <p className="text-[10px] font-bold tracking-[0.15em] uppercase text-white/15 mb-2">Terra</p>
                  <h3 className="text-xl font-bold text-white mb-5">{plan.name}</h3>
                  <div className="mb-7">
                    <span className="text-[36px] font-extrabold text-white font-mono">
                      {annual ? plan.annualDisplay : plan.monthlyDisplay}
                    </span>
                    {!plan.isCustom && <span className="text-[12px] text-white/20 ml-1.5">/{annual ? "yr" : "mo"}</span>}
                  </div>
                  <ul className="flex flex-col gap-2.5 mb-8">
                    {plan.features.map(f => (
                      <li key={f} className="flex items-start gap-2.5 text-[12px] text-white/35">
                        <CheckCircle size={13} style={{ color: accentLight }} className="mt-0.5 shrink-0 opacity-60" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => handleSubscribe(plan)}
                    disabled={checkoutLoading === plan.id}
                    className="w-full py-3 rounded-xl text-[13px] font-semibold flex items-center justify-center gap-2 transition-all"
                    style={{
                      background: plan.highlighted ? accentLight : "transparent",
                      color: plan.highlighted ? "#080c06" : "rgba(255,255,255,0.4)",
                      border: plan.highlighted ? "none" : "1px solid rgba(255,255,255,0.06)",
                      opacity: checkoutLoading === plan.id ? 0.7 : 1,
                      cursor: checkoutLoading === plan.id ? "not-allowed" : "pointer",
                    }}
                  >
                    {checkoutLoading === plan.id ? (
                      <><Loader2 size={13} className="animate-spin" /> Processing...</>
                    ) : plan.isCustom ? (
                      <>Contact Sales <ArrowRight size={12} /></>
                    ) : (
                      <>Get started <ArrowRight size={12} /></>
                    )}
                  </button>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-white/10 mt-5 text-center">
              All plans include a 14-day free trial. Cancel anytime. Prices in USD.
            </p>
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section className="relative py-24 sm:py-32 px-6">
          <div className="max-w-[1200px] mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-px rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.04)" }}>
              {[
                { icon: MapPin, title: "NYC-native data", desc: "Every source mapped to the five boroughs. DOB, HPD, ACRIS, court filings, auction records — continuously ingested and cross-referenced." },
                { icon: Shield, title: "Enterprise security", desc: "SOC 2 architecture. Role-based access. Audit trails. Deal data encrypted at rest and in transit with tenant isolation." },
                { icon: Layers, title: "SZL ecosystem", desc: "Runs on the same unified architecture as Aegis, Lyte, and Vessels. Shared auth, shared orchestration via Alloy, shared intelligence layer." },
              ].map(t => (
                <div key={t.title} className="p-8" style={{ background: BG }}>
                  <t.icon size={20} className="text-white/10 mb-5" />
                  <h3 className="text-[14px] font-bold text-white mb-3">{t.title}</h3>
                  <p className="text-[12px] leading-[1.85] text-white/28">{t.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section className="relative py-24 sm:py-32 px-6">
          <div className="max-w-[640px] mx-auto text-center">
            <h2 className="text-[clamp(1.5rem,3.5vw,2.25rem)] font-bold text-white mb-4 tracking-tight">
              See what you've been missing.
            </h2>
            <p className="text-[16px] text-white/28 mb-10">
              Start with the distress feed. Within minutes, you'll wonder how you operated without it.
            </p>
            <div className="flex justify-center flex-wrap gap-3">
              <button onClick={onSignIn} className="text-[14px] font-semibold text-[#080c06] rounded-lg px-8 py-3.5 flex items-center gap-2 transition-all hover:shadow-lg" style={{ background: accentLight }}>
                Start Free Trial <ArrowRight size={15} />
              </button>
              <button className="text-[14px] font-medium text-white/35 border border-white/[0.06] hover:border-white/[0.12] rounded-lg px-8 py-3.5 transition-all">
                Request a Demo
              </button>
            </div>
          </div>
        </section>
      </Reveal>

      <footer className="border-t border-white/[0.04] py-12 px-6 max-w-[1200px] mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2.5">
            <Building2 size={12} style={{ color: `${accentLight}50` }} />
            <span className="text-[12px] font-semibold text-white/25">Terra</span>
            <span className="text-[10px] text-white/15 font-mono">by SZL Holdings</span>
          </div>
          <p className="text-[10px] text-white/15">&copy; {new Date().getFullYear()} SZL Holdings. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
