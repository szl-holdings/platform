import { useState } from "react";
import { ArrowRight, Building2, MapPin, TrendingUp, DollarSign, Flame, BarChart3, Users, Search, FileText, Shield, Target, Eye, Layers, CheckCircle, Loader2 } from "lucide-react";

const accent = "#5e9a32";
const accentLight = "#74b844";
const BG = "#0b1009";
const SURFACE = "rgba(255,255,255,0.025)";
const BORDER = "rgba(255,255,255,0.06)";

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

const navLinks = [
  { label: "Platform", href: "#platform" },
  { label: "Capabilities", href: "#capabilities" },
  { label: "Markets", href: "#markets" },
  { label: "Pricing", href: "#pricing" },
];

const plans = [
  {
    id: "terra-starter",
    name: "Starter",
    monthlyPlanId: "terra-starter-monthly",
    annualPlanId: "terra-starter-annual",
    monthlyDisplay: "$149",
    annualDisplay: "$1,490",
    features: ["Distress feed (NYC, 5 boroughs)", "Ownership lookup — 50 queries/mo", "Deal pipeline — up to 10 active deals", "Market snapshot (read-only)", "Email support"],
  },
  {
    id: "terra-pro",
    name: "Pro",
    monthlyPlanId: "terra-pro-monthly",
    annualPlanId: "terra-pro-annual",
    monthlyDisplay: "$349",
    annualDisplay: "$3,490",
    highlighted: true,
    features: ["Everything in Starter", "Unlimited ownership lookups", "Unlimited deal pipeline", "Investment analysis & IRR modeling", "Broker operations CRM", "API access (10k calls/mo)", "Priority support"],
  },
  {
    id: "terra-enterprise",
    name: "Enterprise",
    monthlyPlanId: "terra-enterprise-monthly",
    annualPlanId: "terra-enterprise-annual",
    monthlyDisplay: "Custom",
    annualDisplay: "Custom",
    isCustom: true,
    features: ["Everything in Pro", "Multi-seat / team access", "Custom data integrations", "Dedicated account manager", "SLA & uptime guarantee", "Private deal flow network", "Custom reporting & exports"],
  },
];

export default function TerraMarketingLanding({ onSignIn }: { onSignIn?: () => void }) {
  const [annual, setAnnual] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const handleSubscribe = async (plan: typeof plans[number]) => {
    if (plan.isCustom) {
      onSignIn?.();
      return;
    }
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
      if (url) {
        window.location.href = url;
      } else {
        setCheckoutError(data?.error ?? data?.message ?? "Could not start checkout. Please try again.");
      }
    } catch {
      setCheckoutError("Network error. Please try again.");
    } finally {
      setCheckoutLoading(null);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: BG, color: "#e6ead6", fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* Nav */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
        background: "rgba(11,16,9,0.92)", backdropFilter: "blur(16px)",
        borderBottom: `1px solid ${BORDER}`, height: "56px",
        display: "flex", alignItems: "center",
      }}>
        <div style={{ maxWidth: "1120px", margin: "0 auto", padding: "0 1.5rem", width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ width: "26px", height: "26px", borderRadius: "6px", background: `${accent}1a`, border: `1px solid ${accent}40`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Building2 size={13} style={{ color: accentLight }} />
            </div>
            <span style={{ fontWeight: 700, fontSize: "15px", letterSpacing: "-0.02em" }}>Terra</span>
            <span style={{ fontSize: "10px", fontFamily: "monospace", color: "rgba(255,255,255,0.2)", marginLeft: "4px" }}>by SZL Holdings</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
            {navLinks.map(l => (
              <a key={l.label} href={l.href} style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", textDecoration: "none", letterSpacing: "0.04em", fontWeight: 500 }}>{l.label}</a>
            ))}
            <button onClick={onSignIn} style={{ fontSize: "12px", fontWeight: 600, color: "#0b1009", background: accentLight, border: "none", borderRadius: "6px", padding: "6px 16px", cursor: "pointer" }}>Sign in</button>
          </div>
        </div>
      </nav>

      {/* Hero — editorial, left-aligned */}
      <section style={{ padding: "120px 1.5rem 60px", maxWidth: "1120px", margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: "60px", alignItems: "start" }}>
          <div>
            <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: accentLight, marginBottom: "20px", fontFamily: "monospace" }}>NYC Real Estate Intelligence</p>
            <h1 style={{ fontSize: "clamp(34px, 5vw, 48px)", fontWeight: 800, lineHeight: 1.1, letterSpacing: "-0.03em", color: "#f0f4e8", marginBottom: "24px" }}>
              The distress intelligence platform<br />
              <span style={{ color: accentLight }}>built for NYC real estate.</span>
            </h1>
            <p style={{ fontSize: "16px", lineHeight: 1.7, color: "rgba(255,255,255,0.45)", maxWidth: "520px", marginBottom: "36px" }}>
              Terra surfaces distressed properties, tracks ownership structures, manages deal pipelines,
              and delivers market intelligence — all from one operating surface built for brokers,
              investors, and portfolio teams who move fast.
            </p>
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <button onClick={onSignIn} style={{ fontSize: "13px", fontWeight: 600, background: accentLight, color: "#0b1009", border: "none", borderRadius: "6px", padding: "10px 24px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
                Sign in to Platform <ArrowRight size={14} />
              </button>
              <button style={{ fontSize: "13px", fontWeight: 500, background: "transparent", color: "rgba(255,255,255,0.5)", border: `1px solid ${BORDER}`, borderRadius: "6px", padding: "10px 24px", cursor: "pointer" }}>
                Request a Demo
              </button>
            </div>
          </div>

          {/* Right: Market snapshot */}
          <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: "10px", padding: "20px", marginTop: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <span style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)" }}>NYC Distress Snapshot</span>
              <span style={{ fontSize: "9px", fontFamily: "monospace", color: "rgba(255,255,255,0.2)" }}>Live</span>
            </div>
            {[
              { label: "Pre-Foreclosure", count: "340+", color: "#f59e0b" },
              { label: "Active Foreclosure", count: "180+", color: "#ef4444" },
              { label: "Tax Lien", count: "290+", color: "#f97316" },
              { label: "Auction Imminent", count: "95", color: "#a855f7" },
              { label: "REO / Bank-Owned", count: "120+", color: "#3b82f6" },
            ].map(d => (
              <div key={d.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "7px 0", borderTop: "1px solid rgba(255,255,255,0.03)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: d.color }} />
                  <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)" }}>{d.label}</span>
                </div>
                <span style={{ fontSize: "12px", fontWeight: 700, fontFamily: "monospace", color: d.color }}>{d.count}</span>
              </div>
            ))}
            <div style={{ marginTop: "12px", paddingTop: "10px", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.25)" }}>Pipeline Value</span>
                <span style={{ fontSize: "13px", fontWeight: 800, fontFamily: "monospace", color: "#c8a060" }}>$4.8B</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Property Intelligence Thesis */}
      <section style={{ borderTop: `1px solid ${BORDER}`, padding: "80px 1.5rem", maxWidth: "1120px", margin: "0 auto" }}>
        <div style={{ maxWidth: "680px" }}>
          <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", marginBottom: "16px" }}>The Thesis</p>
          <h2 style={{ fontSize: "32px", fontWeight: 700, lineHeight: 1.2, letterSpacing: "-0.02em", color: "#f0f4e8", marginBottom: "24px" }}>
            Why property intelligence?
          </h2>
          <p style={{ fontSize: "15px", lineHeight: 1.8, color: "rgba(255,255,255,0.45)", marginBottom: "20px" }}>
            NYC real estate moves on information asymmetry. The brokers and investors who win are the ones
            who see <span style={{ color: "rgba(255,255,255,0.8)" }}>distress signals first</span>,
            understand <span style={{ color: "rgba(255,255,255,0.8)" }}>ownership structures fastest</span>,
            and execute <span style={{ color: "rgba(255,255,255,0.8)" }}>deals with the most context</span>.
          </p>
          <p style={{ fontSize: "15px", lineHeight: 1.8, color: "rgba(255,255,255,0.45)" }}>
            Terra doesn't replace your CRM or your spreadsheets. It replaces the 14 browser tabs,
            3 paid data services, and 2 hours of morning research that currently stand between you
            and your first actionable lead of the day.
          </p>
        </div>
      </section>

      {/* Capabilities */}
      <section id="capabilities" style={{ borderTop: `1px solid ${BORDER}`, padding: "80px 1.5rem", maxWidth: "1120px", margin: "0 auto" }}>
        <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", marginBottom: "12px" }}>Platform Capabilities</p>
        <h2 style={{ fontSize: "32px", fontWeight: 700, lineHeight: 1.2, letterSpacing: "-0.02em", color: "#f0f4e8", marginBottom: "48px" }}>
          Six modules. One operating surface.
        </h2>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "1px", background: BORDER, borderRadius: "10px", overflow: "hidden" }}>
          {modules.map(mod => (
            <div key={mod.title} style={{ background: BG, padding: "28px 24px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                <mod.icon size={16} style={{ color: mod.color }} />
                <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#f0f4e8" }}>{mod.title}</h3>
              </div>
              <p style={{ fontSize: "12.5px", lineHeight: 1.7, color: "rgba(255,255,255,0.4)", marginBottom: "14px" }}>{mod.desc}</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                {mod.metrics.map(m => (
                  <span key={m} style={{ fontSize: "9px", fontWeight: 600, background: `${mod.color}10`, color: `${mod.color}aa`, padding: "2px 8px", borderRadius: "3px", border: `1px solid ${mod.color}15` }}>{m}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Who It's For */}
      <section id="markets" style={{ borderTop: `1px solid ${BORDER}`, padding: "80px 1.5rem", maxWidth: "1120px", margin: "0 auto" }}>
        <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", marginBottom: "12px" }}>Who It's For</p>
        <h2 style={{ fontSize: "32px", fontWeight: 700, lineHeight: 1.2, letterSpacing: "-0.02em", color: "#f0f4e8", marginBottom: "48px" }}>
          Built for the people who close deals.
        </h2>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "24px" }}>
          {buyers.map(b => (
            <div key={b.role} style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: "10px", padding: "24px" }}>
              <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#f0f4e8", marginBottom: "8px" }}>{b.role}</h3>
              <p style={{ fontSize: "12.5px", lineHeight: 1.7, color: "rgba(255,255,255,0.4)" }}>{b.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" style={{ borderTop: `1px solid ${BORDER}`, padding: "80px 1.5rem", maxWidth: "1120px", margin: "0 auto" }}>
        <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", marginBottom: "12px" }}>Pricing</p>
        <h2 style={{ fontSize: "32px", fontWeight: 700, lineHeight: 1.2, letterSpacing: "-0.02em", color: "#f0f4e8", marginBottom: "12px" }}>
          Simple, transparent plans.
        </h2>
        <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.4)", marginBottom: "32px" }}>
          Start free for 14 days. No credit card required.
        </p>

        {/* Billing toggle */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "40px" }}>
          <span style={{ fontSize: "13px", color: annual ? "rgba(255,255,255,0.35)" : accentLight, fontWeight: 500 }}>Monthly</span>
          <button
            onClick={() => setAnnual(!annual)}
            style={{
              width: "40px", height: "22px", borderRadius: "11px", border: "none", cursor: "pointer",
              background: annual ? accentLight : "rgba(255,255,255,0.1)",
              position: "relative", transition: "background 0.2s",
            }}
          >
            <span style={{
              position: "absolute", top: "3px", left: annual ? "21px" : "3px",
              width: "16px", height: "16px", borderRadius: "50%", background: "#fff",
              transition: "left 0.2s",
            }} />
          </button>
          <span style={{ fontSize: "13px", color: annual ? accentLight : "rgba(255,255,255,0.35)", fontWeight: 500 }}>
            Annual <span style={{ fontSize: "10px", background: `${accentLight}20`, color: accentLight, padding: "2px 6px", borderRadius: "3px", marginLeft: "4px" }}>Save 15%</span>
          </span>
        </div>

        {checkoutError && (
          <div style={{ marginBottom: "24px", padding: "12px 16px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "8px", fontSize: "13px", color: "#f87171" }}>
            {checkoutError}
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1px", background: BORDER, borderRadius: "10px", overflow: "hidden" }}>
          {plans.map(plan => (
            <div key={plan.id} style={{ background: plan.highlighted ? "rgba(94,154,50,0.06)" : BG, padding: "28px 24px", position: "relative" }}>
              {plan.highlighted && (
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: `linear-gradient(90deg, ${accent}, ${accentLight})` }} />
              )}
              {plan.highlighted && (
                <div style={{ position: "absolute", top: "14px", right: "16px", fontSize: "9px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: accentLight }}>Most Popular</div>
              )}
              <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", marginBottom: "8px" }}>Terra</p>
              <h3 style={{ fontSize: "20px", fontWeight: 700, color: "#f0f4e8", marginBottom: "16px" }}>{plan.name}</h3>
              <div style={{ marginBottom: "24px" }}>
                <span style={{ fontSize: "32px", fontWeight: 800, color: "#f0f4e8", fontFamily: "monospace" }}>
                  {annual ? plan.annualDisplay : plan.monthlyDisplay}
                </span>
                {!plan.isCustom && (
                  <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.3)", marginLeft: "6px" }}>/{annual ? "yr" : "mo"}</span>
                )}
              </div>
              <ul style={{ listStyle: "none", padding: 0, margin: "0 0 28px", display: "flex", flexDirection: "column", gap: "8px" }}>
                {plan.features.map(f => (
                  <li key={f} style={{ display: "flex", alignItems: "flex-start", gap: "8px", fontSize: "12px", color: "rgba(255,255,255,0.45)" }}>
                    <CheckCircle size={12} style={{ color: accentLight, marginTop: "1px", flexShrink: 0 }} />
                    {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handleSubscribe(plan)}
                disabled={checkoutLoading === plan.id}
                style={{
                  width: "100%", padding: "10px 0", borderRadius: "6px",
                  border: plan.highlighted ? "none" : `1px solid ${BORDER}`,
                  cursor: checkoutLoading === plan.id ? "not-allowed" : "pointer",
                  background: plan.highlighted ? accentLight : "transparent",
                  color: plan.highlighted ? "#0b1009" : "rgba(255,255,255,0.5)",
                  fontSize: "13px", fontWeight: 600,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
                  opacity: checkoutLoading === plan.id ? 0.7 : 1,
                  transition: "opacity 0.15s",
                } as React.CSSProperties}
              >
                {checkoutLoading === plan.id ? (
                  <><Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> Processing…</>
                ) : plan.isCustom ? (
                  <>Contact Sales <ArrowRight size={12} /></>
                ) : (
                  <>Get started <ArrowRight size={12} /></>
                )}
              </button>
            </div>
          ))}
        </div>
        <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.2)", marginTop: "16px", textAlign: "center" }}>
          All plans include a 14-day free trial. Cancel anytime. Prices in USD.
        </p>
      </section>

      {/* Trust */}
      <section style={{ borderTop: `1px solid ${BORDER}`, padding: "80px 1.5rem", maxWidth: "1120px", margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "24px" }}>
          {[
            { icon: MapPin, title: "NYC-native data", desc: "Every data source is mapped to the five boroughs. DOB, HPD, ACRIS, court filings, auction records — continuously ingested and cross-referenced." },
            { icon: Shield, title: "Enterprise-grade security", desc: "SOC 2 architecture. Role-based access. Audit trails. Your deal data is encrypted at rest and in transit with tenant isolation." },
            { icon: Layers, title: "Part of the SZL ecosystem", desc: "Terra runs on the same unified architecture as Aegis, Lyte, and Vessels. Shared auth, shared orchestration via Alloy, shared intelligence layer." },
          ].map(t => (
            <div key={t.title} style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: "10px", padding: "24px" }}>
              <t.icon size={18} style={{ color: "rgba(255,255,255,0.2)", marginBottom: "12px" }} />
              <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#f0f4e8", marginBottom: "8px" }}>{t.title}</h3>
              <p style={{ fontSize: "12px", lineHeight: 1.7, color: "rgba(255,255,255,0.4)" }}>{t.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ borderTop: `1px solid ${BORDER}`, padding: "80px 1.5rem", maxWidth: "1120px", margin: "0 auto", textAlign: "center" }}>
        <h2 style={{ fontSize: "28px", fontWeight: 700, color: "#f0f4e8", marginBottom: "12px" }}>
          See what you've been missing.
        </h2>
        <p style={{ fontSize: "15px", color: "rgba(255,255,255,0.4)", marginBottom: "32px", maxWidth: "480px", margin: "0 auto 32px" }}>
          Start with the distress feed. Within minutes, you'll wonder how you operated without it.
        </p>
        <div style={{ display: "flex", justifyContent: "center", gap: "12px" }}>
          <button onClick={onSignIn} style={{ fontSize: "14px", fontWeight: 600, background: accentLight, color: "#0b1009", border: "none", borderRadius: "6px", padding: "12px 28px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
            Sign in to Platform <ArrowRight size={14} />
          </button>
          <button style={{ fontSize: "14px", fontWeight: 500, background: "transparent", color: "rgba(255,255,255,0.5)", border: `1px solid ${BORDER}`, borderRadius: "6px", padding: "12px 28px", cursor: "pointer" }}>
            Schedule a Demo
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: `1px solid ${BORDER}`, padding: "40px 1.5rem", maxWidth: "1120px", margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Building2 size={12} style={{ color: accentLight }} />
            <span style={{ fontSize: "12px", fontWeight: 600, color: "rgba(255,255,255,0.4)" }}>Terra</span>
            <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.15)", fontFamily: "monospace" }}>by SZL Holdings</span>
          </div>
          <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.15)" }}>&copy; {new Date().getFullYear()} SZL Holdings. All rights reserved.</p>
        </div>
      </footer>

      <div style={{ height: "40px" }} />
    </div>
  );
}
