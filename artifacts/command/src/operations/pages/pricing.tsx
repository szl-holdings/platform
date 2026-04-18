import { useState } from "react";
import { CheckCircle, ArrowRight, Zap, Shield, Building2, X } from "lucide-react";
import { Link } from "wouter";
import { ContactModal, useContactModal } from "@szl-holdings/shared-ui";
import { trackEvent } from "@szl-holdings/observability/react";

const ACCENT = "#d4a054";
const BG = "#0a0b0e";

const tiers = [
  {
    name: "Starter",
    monthly: 299,
    annual: 249,
    description: "For small teams getting started with business observability.",
    icon: Zap,
    cta: "Start Free Trial",
    trialDays: 14,
    highlight: false,
    features: [
      "Up to 5 team members",
      "3 connected data sources",
      "PRISM dashboard — Pulse & Signals",
      "7-day signal history",
      "Standard alert routing",
      "Email support (48h response)",
      "1 workspace",
      "Community access",
    ],
    notIncluded: [
      "Intelligence Engine (AI reasoning)",
      "Ownership mapping",
      "Custom playbooks",
      "SSO / SAML",
    ],
  },
  {
    name: "Professional",
    monthly: 899,
    annual: 749,
    description: "For growing operations teams that need full command capability.",
    icon: Shield,
    cta: "Start Free Trial",
    trialDays: 14,
    highlight: true,
    features: [
      "Up to 25 team members",
      "Unlimited data sources",
      "Full PRISM — all 5 lenses",
      "90-day signal history",
      "Intelligence Engine with evidence chains",
      "Ownership mapping & accountability chains",
      "Action routing & escalation workflows",
      "Custom playbooks & runbooks",
      "Slack, Teams, PagerDuty integration",
      "Priority support (4h response)",
      "3 workspaces",
      "API access",
    ],
    notIncluded: [
      "SSO / SAML (add-on)",
      "Dedicated CSM",
    ],
  },
  {
    name: "Enterprise",
    monthly: null,
    annual: null,
    description: "For enterprises needing custom data flows, compliance, and dedicated support.",
    icon: Building2,
    cta: "Contact Sales",
    trialDays: null,
    highlight: false,
    features: [
      "Unlimited team members",
      "Unlimited data sources",
      "Full PRISM with custom lenses",
      "Unlimited signal history",
      "Custom AI reasoning models",
      "Enterprise ownership & RBAC",
      "SSO / SAML / SCIM",
      "Audit logs & compliance exports",
      "Dedicated Customer Success Manager",
      "SLA: 99.9% uptime guarantee",
      "Custom contract & procurement",
      "On-premises / private cloud option",
      "White-glove onboarding",
      "Executive briefings quarterly",
    ],
    notIncluded: [],
  },
];

const TIER_PLAN_IDS: Record<string, { monthly: string; annual: string }> = {
  Starter:      { monthly: "command-pro-monthly", annual: "command-pro-annual" },
  Professional: { monthly: "command-pro-monthly", annual: "command-pro-annual" },
};

async function initiateCommandCheckout(planId: string): Promise<void> {
  const origin = window.location.origin;
  const res = await fetch(`${import.meta.env.BASE_URL}api/billing/command/subscribe`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      planId,
      successUrl: `${origin}/command/pricing?checkout=success`,
      cancelUrl: `${origin}/command/pricing`,
    }),
  });
  const data = await res.json();
  if (data?.data?.url) {
    window.location.href = data.data.url;
  }
}

export default function PricingPage() {
  const [annual, setAnnual] = useState(true);
  const [loading, setLoading] = useState<string | null>(null);
  const { isOpen: contactOpen, open: openContact, close: closeContact } = useContactModal("demo");

  async function handleStartTrial(tierName: string) {
    const plans = TIER_PLAN_IDS[tierName];
    if (!plans) return;
    const planId = annual ? plans.annual : plans.monthly;
    setLoading(tierName);
    trackEvent("upgrade_clicked", { feature: "lyte_pricing", tier: tierName, plan: planId, billing: annual ? "annual" : "monthly" });
    try {
      await initiateCommandCheckout(planId);
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="min-h-screen" style={{ background: BG, color: "rgba(255,255,255,0.88)" }}>
      <ContactModal isOpen={contactOpen} onClose={closeContact} type="demo" app="lyte" title="Request Enterprise Access" subtitle="Tell us about your team and use case." />

      <div className="border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: ACCENT }}>
              <Zap className="w-3.5 h-3.5 text-black" />
            </div>
            <span className="text-sm font-semibold tracking-tight text-white">Lyte</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-[13px]" style={{ color: "rgba(255,255,255,0.5)" }}>
            <Link href="/" style={{ color: "rgba(255,255,255,0.5)" }}>Platform</Link>
            <Link href="/pricing" style={{ color: "rgba(255,255,255,0.88)" }}>Pricing</Link>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-20 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-medium mb-6" style={{ background: `${ACCENT}15`, color: ACCENT, border: `1px solid ${ACCENT}30` }}>
          Transparent Pricing
        </div>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 text-white">
          Command starts here
        </h1>
        <p className="text-[15px] max-w-xl mx-auto mb-10" style={{ color: "rgba(255,255,255,0.5)" }}>
          From small ops teams to enterprise command centers. Every plan includes a full-featured trial.
        </p>

        <div className="inline-flex items-center gap-1 p-1 rounded-full mb-16" style={{ background: "rgba(255,255,255,0.06)" }}>
          <button
            onClick={() => setAnnual(false)}
            className="px-5 py-2 rounded-full text-[13px] font-medium transition-all"
            style={{ background: !annual ? "rgba(255,255,255,0.12)" : "transparent", color: !annual ? "white" : "rgba(255,255,255,0.45)" }}
          >Monthly</button>
          <button
            onClick={() => setAnnual(true)}
            className="px-5 py-2 rounded-full text-[13px] font-medium transition-all flex items-center gap-2"
            style={{ background: annual ? "rgba(255,255,255,0.12)" : "transparent", color: annual ? "white" : "rgba(255,255,255,0.45)" }}
          >
            Annual
            <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ background: `${ACCENT}20`, color: ACCENT }}>Save 17%</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {tiers.map((tier) => {
            const Icon = tier.icon;
            const price = annual ? tier.annual : tier.monthly;
            return (
              <div
                key={tier.name}
                className="relative rounded-2xl p-8 text-left flex flex-col"
                style={{
                  background: tier.highlight ? `linear-gradient(135deg, rgba(212,160,84,0.12), rgba(212,160,84,0.06))` : "rgba(255,255,255,0.04)",
                  border: tier.highlight ? `1px solid ${ACCENT}40` : "1px solid rgba(255,255,255,0.08)",
                }}
              >
                {tier.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider" style={{ background: ACCENT, color: "#000" }}>
                    Most Popular
                  </div>
                )}

                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: tier.highlight ? `${ACCENT}25` : "rgba(255,255,255,0.07)" }}>
                    <Icon className="w-4 h-4" style={{ color: tier.highlight ? ACCENT : "rgba(255,255,255,0.6)" }} />
                  </div>
                  <div>
                    <div className="text-[15px] font-bold text-white">{tier.name}</div>
                  </div>
                </div>

                <div className="mb-4">
                  {price !== null ? (
                    <div className="flex items-end gap-1.5">
                      <span className="text-4xl font-bold text-white">${price}</span>
                      <span className="text-[13px] mb-2" style={{ color: "rgba(255,255,255,0.4)" }}>/month</span>
                    </div>
                  ) : (
                    <div className="text-3xl font-bold text-white">Custom</div>
                  )}
                  {annual && price !== null && (
                    <div className="text-[12px] mt-1" style={{ color: "rgba(255,255,255,0.35)" }}>Billed annually</div>
                  )}
                </div>

                <p className="text-[13px] mb-6 leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>{tier.description}</p>

                {tier.cta === "Contact Sales" ? (
                  <button
                    onClick={() => { openContact(); trackEvent("upgrade_clicked", { feature: "lyte_pricing", tier: tier.name, cta: "contact_sales" }); }}
                    className="w-full py-3 rounded-xl text-[13px] font-semibold flex items-center justify-center gap-2 transition-all mb-8"
                    style={{ background: "rgba(255,255,255,0.1)", color: "white", border: "1px solid rgba(255,255,255,0.15)" }}
                  >
                    {tier.cta} <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    onClick={() => handleStartTrial(tier.name)}
                    disabled={loading === tier.name}
                    className="w-full py-3 rounded-xl text-[13px] font-semibold flex items-center justify-center gap-2 transition-all mb-8 disabled:opacity-60"
                    style={{
                      background: tier.highlight ? ACCENT : "rgba(255,255,255,0.1)",
                      color: tier.highlight ? "#000" : "white",
                      border: tier.highlight ? "none" : "1px solid rgba(255,255,255,0.15)",
                    }}
                  >
                    {loading === tier.name ? "Redirecting…" : `${tier.cta}${tier.trialDays ? ` — ${tier.trialDays} days free` : ""}`}
                    {loading !== tier.name && <ArrowRight className="w-3.5 h-3.5" />}
                  </button>
                )}

                <div className="space-y-2.5 flex-1">
                  {tier.features.map((f) => (
                    <div key={f} className="flex items-start gap-2.5 text-[13px]" style={{ color: "rgba(255,255,255,0.7)" }}>
                      <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: ACCENT }} />
                      {f}
                    </div>
                  ))}
                  {tier.notIncluded.map((f) => (
                    <div key={f} className="flex items-start gap-2.5 text-[13px]" style={{ color: "rgba(255,255,255,0.25)" }}>
                      <X className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      {f}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 text-center max-w-3xl mx-auto">
          {[
            { label: "14-day free trial", desc: "No credit card required. Full access to all features." },
            { label: "No lock-in", desc: "Cancel any time. Data export included in all plans." },
            { label: "SOC 2 compliant", desc: "Enterprise-grade security baked in, not bolted on." },
          ].map((item) => (
            <div key={item.label}>
              <div className="text-[14px] font-semibold text-white mb-1">{item.label}</div>
              <div className="text-[12px]" style={{ color: "rgba(255,255,255,0.4)" }}>{item.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
