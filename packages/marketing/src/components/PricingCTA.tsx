import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { ArrowRight, ChevronRight, Handshake } from "lucide-react";

const BG = "hsl(214,16%,4%)";
const SURFACE = "hsla(0,0%,100%,0.035)";
const BORDER = "hsla(0,0%,100%,0.07)";
const TEXT = "hsl(38,8%,92%)";
const TEXT_SEC = "hsl(214,7%,55%)";

export interface PricingTier {
  name: string;
  price: string;
  period?: string;
  description: string;
  features: string[];
  ctaLabel: string;
  ctaHref?: string;
  onCta?: () => void;
  highlighted?: boolean;
  badge?: string;
}

export interface PricingCTAProps {
  headline?: string;
  subheadline?: string;
  tiers?: PricingTier[];
  designPartnerBlock?: {
    headline: string;
    body: string;
    ctaLabel: string;
    ctaHref?: string;
    onCta?: () => void;
  };
  accentColor?: string;
}

export function PricingCTA({
  headline = "Engagement options",
  subheadline = "We work with enterprise operators across domains. Start with a scoped pilot.",
  tiers,
  designPartnerBlock,
  accentColor = "hsl(191,92%,44%)",
}: PricingCTAProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} style={{ background: BG }} className="py-24 px-4">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4" style={{ color: TEXT }}>
            {headline}
          </h2>
          <p className="text-base max-w-xl mx-auto" style={{ color: TEXT_SEC }}>
            {subheadline}
          </p>
        </motion.div>

        {tiers && tiers.length > 0 && (
          <div className={`grid gap-5 mb-8 ${tiers.length === 2 ? "md:grid-cols-2" : tiers.length >= 3 ? "md:grid-cols-3" : ""}`}>
            {tiers.map((tier, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.4, delay: i * 0.07 }}
                className="relative flex flex-col p-6 rounded-2xl"
                style={{
                  background: tier.highlighted ? `${accentColor}0a` : SURFACE,
                  border: `1px solid ${tier.highlighted ? `${accentColor}40` : BORDER}`,
                }}
              >
                {tier.badge && (
                  <div
                    className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-xs font-bold"
                    style={{ background: accentColor, color: BG }}
                  >
                    {tier.badge}
                  </div>
                )}
                <div className="mb-4">
                  <p className="text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: accentColor }}>
                    {tier.name}
                  </p>
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-3xl font-bold" style={{ color: TEXT }}>
                      {tier.price}
                    </span>
                    {tier.period && (
                      <span className="text-sm" style={{ color: TEXT_SEC }}>
                        {tier.period}
                      </span>
                    )}
                  </div>
                  <p className="text-sm" style={{ color: TEXT_SEC }}>
                    {tier.description}
                  </p>
                </div>

                <ul className="flex flex-col gap-2 mb-6 flex-1">
                  {tier.features.map((f, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm" style={{ color: TEXT }}>
                      <div
                        className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                        style={{ background: `${accentColor}20` }}
                      >
                        <div className="w-1.5 h-1.5 rounded-full" style={{ background: accentColor }} />
                      </div>
                      {f}
                    </li>
                  ))}
                </ul>

                {tier.ctaHref ? (
                  <a
                    href={tier.ctaHref}
                    onClick={tier.onCta}
                    className="inline-flex items-center justify-center gap-2 w-full py-3 rounded-lg text-sm font-semibold transition-all hover:opacity-90"
                    style={{
                      background: tier.highlighted ? accentColor : SURFACE,
                      color: tier.highlighted ? BG : TEXT,
                      border: tier.highlighted ? "none" : `1px solid ${BORDER}`,
                    }}
                  >
                    {tier.ctaLabel}
                    <ArrowRight className="w-4 h-4" />
                  </a>
                ) : (
                  <button
                    onClick={tier.onCta}
                    className="inline-flex items-center justify-center gap-2 w-full py-3 rounded-lg text-sm font-semibold transition-all hover:opacity-90"
                    style={{
                      background: tier.highlighted ? accentColor : SURFACE,
                      color: tier.highlighted ? BG : TEXT,
                      border: tier.highlighted ? "none" : `1px solid ${BORDER}`,
                    }}
                  >
                    {tier.ctaLabel}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </motion.div>
            ))}
          </div>
        )}

        {designPartnerBlock && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.45, delay: 0.25 }}
            className="p-8 rounded-2xl flex flex-col md:flex-row items-start md:items-center gap-6"
            style={{ background: `${accentColor}06`, border: `1px solid ${accentColor}25` }}
          >
            <div className="flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: `${accentColor}15` }}>
              <Handshake className="w-6 h-6" style={{ color: accentColor }} />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold mb-1" style={{ color: TEXT }}>
                {designPartnerBlock.headline}
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: TEXT_SEC }}>
                {designPartnerBlock.body}
              </p>
            </div>
            {designPartnerBlock.ctaHref ? (
              <a
                href={designPartnerBlock.ctaHref}
                onClick={designPartnerBlock.onCta}
                className="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all hover:opacity-90 whitespace-nowrap"
                style={{ background: accentColor, color: BG }}
              >
                {designPartnerBlock.ctaLabel}
                <ChevronRight className="w-4 h-4" />
              </a>
            ) : (
              <button
                onClick={designPartnerBlock.onCta}
                className="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all hover:opacity-90 whitespace-nowrap"
                style={{ background: accentColor, color: BG }}
              >
                {designPartnerBlock.ctaLabel}
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </motion.div>
        )}
      </div>
    </section>
  );
}
