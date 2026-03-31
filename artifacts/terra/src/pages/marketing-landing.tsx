import { useState, useEffect, useRef } from "react";
import {
  ArrowRight, Building2, MapPin, TrendingUp, DollarSign, Flame,
  BarChart3, Users, Search, FileText, Shield, Target, Layers,
  CheckCircle, Loader2, Menu, X, ChevronDown,
} from "lucide-react";

const accent = "#5e9a32";
const accentLight = "#74b844";
const BG = "#0b1009";

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
    desc: "Acquisitions and dispositions tracked from lead to close. Stage-gated pipeline with ownership assignments, priority scoring, and Alloy-driven workflow automation across your entire deal book.",
    metrics: ["Lead → Close tracking", "Stage gates", "Priority scoring", "Workflow automation"],
  },
  {
    icon: BarChart3, title: "Market Intelligence", color: "#f59e0b",
    desc: "Comparable sales analysis, price-per-sqft trends, borough-level market dynamics, and off-market opportunity discovery — updated continuously from primary data sources across NYC.",
    metrics: ["Comparable sales", "Price trends", "Market dynamics", "Off-market signals"],
  },
  {
    icon: Users, title: "Broker Operations", color: "#10b981",
    desc: "Broker-native CRM with contact management, deal history, tenant profiles, lease schedules, payment tracking, and renewal forecasting. Performance scorecards and response-time analytics.",
    metrics: ["Contact management", "Deal history", "Lease tracking", "Performance scoring"],
  },
  {
    icon: DollarSign, title: "Investment Analysis", color: "#c8a060",
    desc: "IRR modeling, cap rate analysis, and scenario planning with conservative, base, and aggressive assumptions. Climate risk overlays, FEMA zone cross-referencing, and portfolio-level return tracking.",
    metrics: ["IRR modeling", "Cap rate analysis", "Scenario planning", "Risk overlays"],
  },
];

const buyers = [
  { role: "Investors & Acquisitions", desc: "Source distressed opportunities, analyze ownership structures, model returns, and track deals from discovery to close — all in one operating surface." },
  { role: "Brokers & Agents", desc: "Manage your deal pipeline, track client relationships, monitor market movement, and hit your numbers with real-time performance analytics." },
  { role: "Portfolio Teams", desc: "Monitor property health across your portfolio, track lease expirations, model renewals, and surface disposition opportunities before the market shifts." },
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

export default function TerraMarketingLanding({ onSignIn }: { onSignIn?: () => void }) {
  const [annual, setAnnual] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [mobileNav, setMobileNav] = useState(false);
  const [scrolled, setScrolled] = useState(false);

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
    <div className="min-h-screen text-[#e6ead6]" style={{ background: BG, fontFamily: "'Inter', system-ui, sans-serif" }}>

      <nav className={`fixed top-0 left-0 right-0 z-50 h-14 flex items-center transition-all duration-300 ${scrolled ? "bg-[#0b1009]/95 backdrop-blur-xl border-b border-white/[0.06] shadow-lg shadow-black/20" : "bg-transparent"}`}>
        <div className="max-w-[1120px] mx-auto px-6 w-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-[26px] h-[26px] rounded-md flex items-center justify-center" style={{ background: `${accent}1a`, border: `1px solid ${accent}40` }}>
              <Building2 size={13} style={{ color: accentLight }} />
            </div>
            <span className="font-bold text-[15px] tracking-tight text-white">Terra</span>
            <span className="text-[10px] font-mono text-white/15 ml-1">by SZL Holdings</span>
          </div>
          <div className="hidden md:flex items-center gap-6">
            {[{ label: "Platform", href: "#platform" }, { label: "Capabilities", href: "#capabilities" }, { label: "Markets", href: "#markets" }, { label: "Pricing", href: "#pricing" }].map(l => (
              <a key={l.label} href={l.href} className="text-xs text-white/35 hover:text-white/65 transition-colors tracking-wider font-medium">{l.label}</a>
            ))}
            <button onClick={onSignIn} className="text-xs font-semibold text-[#0b1009] rounded-md px-4 py-1.5 transition-colors" style={{ background: accentLight }}>Sign in</button>
          </div>
          <button className="md:hidden p-2 text-white/50" onClick={() => setMobileNav(!mobileNav)}>
            {mobileNav ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      {mobileNav && (
        <div className="fixed inset-0 z-40 bg-[#0b1009]/98 backdrop-blur-xl flex flex-col items-center justify-center gap-6 md:hidden">
          {[{ label: "Platform", href: "#platform" }, { label: "Capabilities", href: "#capabilities" }, { label: "Markets", href: "#markets" }, { label: "Pricing", href: "#pricing" }].map(l => (
            <a key={l.label} href={l.href} onClick={() => setMobileNav(false)} className="text-lg text-white/60 hover:text-white transition-colors">{l.label}</a>
          ))}
          <button onClick={() => { onSignIn?.(); setMobileNav(false); }} className="mt-4 text-sm font-semibold text-[#0b1009] rounded-md px-6 py-2.5" style={{ background: accentLight }}>Sign in</button>
        </div>
      )}

      <section className="pt-28 sm:pt-32 pb-16 sm:pb-20 max-w-[1120px] mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-12 lg:gap-16 items-start">
          <div>
            <p className="text-[10px] font-bold tracking-[0.12em] uppercase mb-5 font-mono" style={{ color: accentLight }}>NYC Real Estate Intelligence</p>
            <h1 className="text-4xl sm:text-5xl lg:text-[48px] font-extrabold leading-[1.1] tracking-tight text-[#f0f4e8] mb-6">
              The distress intelligence platform<br />
              <span style={{ color: accentLight }}>built for NYC real estate.</span>
            </h1>
            <p className="text-base sm:text-[16px] leading-relaxed text-white/40 max-w-[520px] mb-8">
              Terra surfaces distressed properties, tracks ownership structures, manages deal pipelines,
              and delivers market intelligence — all from one operating surface built for brokers,
              investors, and portfolio teams who move fast.
            </p>
            <div className="flex flex-wrap gap-3">
              <button onClick={onSignIn} className="text-[13px] font-semibold text-[#0b1009] rounded-md px-6 py-2.5 flex items-center gap-1.5 transition-colors" style={{ background: accentLight }}>
                Sign in to Platform <ArrowRight size={14} />
              </button>
              <button className="text-[13px] font-medium bg-transparent text-white/45 border border-white/[0.06] hover:border-white/[0.12] rounded-md px-6 py-2.5 transition-colors">
                Request a Demo
              </button>
            </div>

            <div className="flex flex-wrap gap-x-10 gap-y-4 mt-12 pt-6 border-t border-white/[0.06]">
              {[{ v: "1,025+", l: "Distressed Properties" }, { v: "$4.8B", l: "Pipeline Value" }, { v: "5", l: "NYC Boroughs" }, { v: "6", l: "Intelligence Modules" }].map(s => (
                <div key={s.l}>
                  <span className="text-lg font-extrabold font-mono text-[#f0f4e8]">{s.v}</span>
                  <p className="text-[10px] text-white/25 uppercase tracking-wider mt-0.5">{s.l}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white/[0.025] border border-white/[0.06] rounded-xl p-5 mt-0 lg:mt-4">
            <div className="flex justify-between items-center mb-4">
              <span className="text-[9px] font-bold tracking-wider uppercase text-white/25">NYC Distress Snapshot</span>
              <span className="text-[9px] font-mono text-white/15">Live</span>
            </div>
            {[
              { label: "Pre-Foreclosure", count: "340+", color: "#f59e0b" },
              { label: "Active Foreclosure", count: "180+", color: "#ef4444" },
              { label: "Tax Lien", count: "290+", color: "#f97316" },
              { label: "Auction Imminent", count: "95", color: "#a855f7" },
              { label: "REO / Bank-Owned", count: "120+", color: "#3b82f6" },
            ].map(d => (
              <div key={d.label} className="flex items-center justify-between py-[7px] border-t border-white/[0.03]">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: d.color }} />
                  <span className="text-[11px] text-white/45">{d.label}</span>
                </div>
                <span className="text-xs font-bold font-mono" style={{ color: d.color }}>{d.count}</span>
              </div>
            ))}
            <div className="mt-3 pt-2.5 border-t border-white/[0.04] flex justify-between items-center">
              <span className="text-[10px] text-white/20">Pipeline Value</span>
              <span className="text-[13px] font-extrabold font-mono text-[#c8a060]">$4.8B</span>
            </div>
          </div>
        </div>
      </section>

      <Section>
        <section id="platform" className="border-t border-white/[0.06] py-16 sm:py-20 px-6 max-w-[1120px] mx-auto">
          <div className="max-w-[680px]">
            <p className="text-[10px] font-bold tracking-[0.12em] uppercase text-white/25 mb-4">The Thesis</p>
            <h2 className="text-2xl sm:text-[32px] font-bold leading-tight tracking-tight text-[#f0f4e8] mb-6">
              Why property intelligence?
            </h2>
            <p className="text-[15px] leading-[1.8] text-white/40 mb-5">
              NYC real estate moves on information asymmetry. The brokers and investors who win are the ones
              who see <span className="text-white/75">distress signals first</span>,
              understand <span className="text-white/75">ownership structures fastest</span>,
              and execute <span className="text-white/75">deals with the most context</span>.
            </p>
            <p className="text-[15px] leading-[1.8] text-white/40">
              Terra doesn't replace your CRM or your spreadsheets. It replaces the 14 browser tabs,
              3 paid data services, and 2 hours of morning research that currently stand between you
              and your first actionable lead of the day.
            </p>
          </div>
        </section>
      </Section>

      <Section>
        <section id="capabilities" className="border-t border-white/[0.06] py-16 sm:py-20 px-6 max-w-[1120px] mx-auto">
          <p className="text-[10px] font-bold tracking-[0.12em] uppercase text-white/25 mb-3">Platform Capabilities</p>
          <h2 className="text-2xl sm:text-[32px] font-bold leading-tight tracking-tight text-[#f0f4e8] mb-12">
            Six modules. One operating surface.
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-white/[0.06] rounded-xl overflow-hidden">
            {modules.map(mod => (
              <div key={mod.title} className="p-6 sm:p-7" style={{ background: BG }}>
                <div className="flex items-center gap-2.5 mb-3">
                  <mod.icon size={16} style={{ color: mod.color }} />
                  <h3 className="text-[15px] font-bold text-[#f0f4e8]">{mod.title}</h3>
                </div>
                <p className="text-[12.5px] leading-relaxed text-white/35 mb-3.5">{mod.desc}</p>
                <div className="flex flex-wrap gap-1">
                  {mod.metrics.map(m => (
                    <span key={m} className="text-[9px] font-semibold px-2 py-0.5 rounded" style={{ background: `${mod.color}10`, color: `${mod.color}aa`, border: `1px solid ${mod.color}15` }}>{m}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </Section>

      <Section>
        <section id="markets" className="border-t border-white/[0.06] py-16 sm:py-20 px-6 max-w-[1120px] mx-auto">
          <p className="text-[10px] font-bold tracking-[0.12em] uppercase text-white/25 mb-3">Who It's For</p>
          <h2 className="text-2xl sm:text-[32px] font-bold leading-tight tracking-tight text-[#f0f4e8] mb-12">
            Built for the people who close deals.
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {buyers.map(b => (
              <div key={b.role} className="bg-white/[0.025] border border-white/[0.06] rounded-xl p-6">
                <h3 className="text-sm font-bold text-[#f0f4e8] mb-2">{b.role}</h3>
                <p className="text-[12.5px] leading-relaxed text-white/35">{b.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </Section>

      <Section>
        <section id="pricing" className="border-t border-white/[0.06] py-16 sm:py-20 px-6 max-w-[1120px] mx-auto">
          <p className="text-[10px] font-bold tracking-[0.12em] uppercase text-white/25 mb-3">Pricing</p>
          <h2 className="text-2xl sm:text-[32px] font-bold leading-tight tracking-tight text-[#f0f4e8] mb-3">
            Simple, transparent plans.
          </h2>
          <p className="text-sm text-white/35 mb-8">
            Start free for 14 days. No credit card required.
          </p>

          <div className="flex items-center gap-3 mb-10">
            <span className={`text-[13px] font-medium ${annual ? "text-white/30" : "text-white/70"}`}>Monthly</span>
            <button
              onClick={() => setAnnual(!annual)}
              className="w-10 h-[22px] rounded-full relative transition-colors"
              style={{ background: annual ? accentLight : "rgba(255,255,255,0.1)" }}
            >
              <span className="absolute top-[3px] w-4 h-4 rounded-full bg-white transition-all" style={{ left: annual ? "21px" : "3px" }} />
            </button>
            <span className={`text-[13px] font-medium ${annual ? "text-white/70" : "text-white/30"}`}>
              Annual <span className="text-[10px] px-1.5 py-0.5 rounded ml-1" style={{ background: `${accentLight}20`, color: accentLight }}>Save 15%</span>
            </span>
          </div>

          {checkoutError && (
            <div className="mb-6 px-4 py-3 bg-red-500/[0.1] border border-red-500/30 rounded-lg text-[13px] text-red-400">
              {checkoutError}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-white/[0.06] rounded-xl overflow-hidden">
            {plans.map(plan => (
              <div key={plan.id} className="p-6 sm:p-7 relative" style={{ background: plan.highlighted ? "rgba(94,154,50,0.06)" : BG }}>
                {plan.highlighted && <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: `linear-gradient(90deg, ${accent}, ${accentLight})` }} />}
                {plan.highlighted && <div className="absolute top-3.5 right-4 text-[9px] font-bold tracking-wider uppercase" style={{ color: accentLight }}>Most Popular</div>}
                <p className="text-[10px] font-bold tracking-[0.12em] uppercase text-white/25 mb-2">Terra</p>
                <h3 className="text-xl font-bold text-[#f0f4e8] mb-4">{plan.name}</h3>
                <div className="mb-6">
                  <span className="text-[32px] font-extrabold text-[#f0f4e8] font-mono">
                    {annual ? plan.annualDisplay : plan.monthlyDisplay}
                  </span>
                  {!plan.isCustom && <span className="text-xs text-white/25 ml-1.5">/{annual ? "yr" : "mo"}</span>}
                </div>
                <ul className="flex flex-col gap-2 mb-7">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-xs text-white/40">
                      <CheckCircle size={12} style={{ color: accentLight }} className="mt-0.5 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => handleSubscribe(plan)}
                  disabled={checkoutLoading === plan.id}
                  className="w-full py-2.5 rounded-md text-[13px] font-semibold flex items-center justify-center gap-1.5 transition-all"
                  style={{
                    background: plan.highlighted ? accentLight : "transparent",
                    color: plan.highlighted ? "#0b1009" : "rgba(255,255,255,0.5)",
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
          <p className="text-[11px] text-white/15 mt-4 text-center">
            All plans include a 14-day free trial. Cancel anytime. Prices in USD.
          </p>
        </section>
      </Section>

      <Section>
        <section className="border-t border-white/[0.06] py-16 sm:py-20 px-6 max-w-[1120px] mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: MapPin, title: "NYC-native data", desc: "Every data source mapped to the five boroughs. DOB, HPD, ACRIS, court filings, auction records — continuously ingested and cross-referenced." },
              { icon: Shield, title: "Enterprise-grade security", desc: "SOC 2 architecture. Role-based access. Audit trails. Your deal data encrypted at rest and in transit with tenant isolation." },
              { icon: Layers, title: "Part of the SZL ecosystem", desc: "Terra runs on the same unified architecture as Aegis, Lyte, and Vessels. Shared auth, shared orchestration via Alloy, shared intelligence layer." },
            ].map(t => (
              <div key={t.title} className="bg-white/[0.025] border border-white/[0.06] rounded-xl p-6">
                <t.icon size={18} className="text-white/15 mb-3.5" />
                <h3 className="text-sm font-bold text-[#f0f4e8] mb-2">{t.title}</h3>
                <p className="text-xs leading-relaxed text-white/35">{t.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </Section>

      <Section>
        <section className="border-t border-white/[0.06] py-16 sm:py-20 px-6 max-w-[1120px] mx-auto text-center">
          <h2 className="text-2xl sm:text-[28px] font-bold text-[#f0f4e8] mb-3">
            See what you've been missing.
          </h2>
          <p className="text-[15px] text-white/35 max-w-[480px] mx-auto mb-8">
            Start with the distress feed. Within minutes, you'll wonder how you operated without it.
          </p>
          <div className="flex justify-center flex-wrap gap-3">
            <button onClick={onSignIn} className="text-sm font-semibold text-[#0b1009] rounded-md px-7 py-3 flex items-center gap-1.5 transition-colors" style={{ background: accentLight }}>
              Start Free Trial <ArrowRight size={14} />
            </button>
            <button className="text-sm font-medium bg-transparent text-white/45 border border-white/[0.06] hover:border-white/[0.12] rounded-md px-7 py-3 transition-colors">
              Request a Demo
            </button>
          </div>
        </section>
      </Section>

      <footer className="border-t border-white/[0.06] py-10 px-6 max-w-[1120px] mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="flex items-center gap-2">
            <Building2 size={12} style={{ color: accentLight }} />
            <span className="text-xs font-semibold text-white/35">Terra</span>
            <span className="text-[10px] text-white/10 font-mono">by SZL Holdings</span>
          </div>
          <p className="text-[10px] text-white/10">&copy; {new Date().getFullYear()} SZL Holdings. All rights reserved.</p>
        </div>
      </footer>

      <div className="h-10" />
    </div>
  );
}
