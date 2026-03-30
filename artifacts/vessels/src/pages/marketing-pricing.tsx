import { Link } from "wouter";
import { ChevronRight } from "lucide-react";
import { MarketingNav } from "@/components/MarketingNav";
import { MarketingFooter } from "@/components/MarketingFooter";

const tiers = [
  {
    name: "Fleet",
    desc: "For operations teams managing 1–10 vessels with core command needs.",
    price: "Contact us",
    features: ["Fleet Map — up to 10 vessels", "Exceptions Center", "Voyage Economics", "Maintenance Readiness", "Email support"],
    cta: "Request pricing",
    accent: false,
  },
  {
    name: "Command",
    desc: "For commercial fleets needing full intelligence depth and analytics.",
    price: "Contact us",
    features: ["Everything in Fleet", "Unlimited vessels", "Command Mode", "Performance Analytics", "Corridor Analysis", "Priority support"],
    cta: "Request pricing",
    accent: true,
  },
  {
    name: "Enterprise",
    desc: "For large fleet operators with compliance, API, and custom integration needs.",
    price: "Custom",
    features: ["Everything in Command", "Sanctions Screening", "Dark Vessel Detection", "Risk Scoring Engine", "Custom integrations", "Dedicated account manager", "SLA guarantee"],
    cta: "Contact us",
    accent: false,
  },
];

export default function MarketingPricingPage() {
  return (
    <div className="min-h-screen bg-[#060e1a] text-sky-50">
      <MarketingNav />

      <div className="max-w-5xl mx-auto px-6 pt-28 pb-20">
        <div className="text-center mb-14">
          <p className="text-[11px] font-semibold text-sky-400/60 tracking-[0.15em] uppercase mb-3">Pricing</p>
          <h1 className="text-3xl md:text-4xl font-bold text-sky-50 mb-4">Aligned to your fleet scale</h1>
          <p className="text-sky-300/40 text-[15px] max-w-xl mx-auto leading-relaxed">
            Vessels pricing is based on fleet size and capability tier. All plans include a dedicated onboarding session and access to the full product team.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-5 mb-14">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`rounded-2xl p-7 flex flex-col ${
                tier.accent
                  ? "bg-sky-500/10 border border-sky-500/30"
                  : "bg-[#0a1628]/80 border border-sky-500/10"
              }`}
            >
              {tier.accent && (
                <span className="text-[10px] font-bold text-sky-400 uppercase tracking-[0.12em] mb-2">Most popular</span>
              )}
              <h3 className="text-[18px] font-bold text-sky-100 mb-1">{tier.name}</h3>
              <p className="text-sky-300/40 text-[12.5px] mb-4 leading-relaxed">{tier.desc}</p>
              <p className="text-[13px] font-semibold text-sky-300 mb-5">{tier.price}</p>
              <ul className="space-y-2 flex-1 mb-6">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-[12.5px] text-sky-300/50">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-400/40 mt-1.5 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/demo">
                <button className={`w-full py-2.5 rounded-xl text-[13px] font-semibold transition-all ${
                  tier.accent
                    ? "bg-sky-400 hover:bg-sky-300 text-[#060e1a]"
                    : "bg-sky-500/10 hover:bg-sky-500/15 border border-sky-500/20 text-sky-300"
                }`}>
                  {tier.cta}
                </button>
              </Link>
            </div>
          ))}
        </div>

        <div className="text-center text-sky-300/40 text-[13px]">
          All pricing is custom-quoted based on fleet profile. <Link href="/demo" className="text-sky-400 hover:text-sky-300">Request a demo</Link> to start the conversation.
        </div>
      </div>

      <MarketingFooter />
    </div>
  );
}
