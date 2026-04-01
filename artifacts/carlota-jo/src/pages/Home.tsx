import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Services from "@/components/Services";
import Proof from "@/components/Proof";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";

function RosaBlock() {
  const { t } = useTranslation();
  return (
    <section className="py-20 lg:py-28" style={{ background: "var(--color-cream-warm)", borderTop: "1px solid var(--color-stone-200)" }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start"
        >
          <div className="lg:col-span-4">
            <p className="text-[11px] font-medium tracking-[0.35em] uppercase mb-4" style={{ color: "var(--color-gold)" }}>
              {t("rosa.badge")}
            </p>
            <h2 className="font-serif text-3xl font-light mb-4" style={{ color: "var(--color-ink-900)" }}>
              {t("rosa.name")}
            </h2>
            <p className="text-sm font-light leading-relaxed mb-1" style={{ color: "var(--color-ink-600)" }}>
              {t("rosa.title")}
            </p>
            <p className="text-xs font-light" style={{ color: "var(--color-stone-500)" }}>
              {t("rosa.company")}
            </p>
          </div>
          <div className="lg:col-span-5">
            <p className="text-sm font-light leading-relaxed mb-4" style={{ color: "var(--color-ink-600)" }}>
              {t("rosa.bio1")}
            </p>
            <p className="text-sm font-light leading-relaxed" style={{ color: "var(--color-ink-500)" }}>
              {t("rosa.bio2")}
            </p>
          </div>
          <div className="lg:col-span-3 flex flex-col items-start gap-4">
            <Link
              href="/founder"
              className="inline-flex items-center gap-2 text-[12px] font-medium tracking-[0.1em] uppercase transition-colors"
              style={{ color: "var(--color-gold)" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = "0.75"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}
            >
              {t("nav.about")}
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2.5 px-6 py-3 text-[12px] font-medium tracking-[0.08em] transition-colors"
              style={{ color: "var(--color-cream)", background: "var(--color-gold)" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--color-gold-light)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--color-gold)"; }}
            >
              {t("nav.requestConsultation")}
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function TrustPillars() {
  const { t } = useTranslation();

  const pillars = [
    { name: t("trust.pillars.discretion.name"), desc: t("trust.pillars.discretion.desc") },
    { name: t("trust.pillars.responsiveness.name"), desc: t("trust.pillars.responsiveness.desc") },
    { name: t("trust.pillars.structure.name"), desc: t("trust.pillars.structure.desc") },
    { name: t("trust.pillars.professionalism.name"), desc: t("trust.pillars.professionalism.desc") },
    { name: t("trust.pillars.execution.name"), desc: t("trust.pillars.execution.desc") },
  ];

  return (
    <section className="py-20 lg:py-28" style={{ background: "var(--color-stone-50)", borderTop: "1px solid var(--color-stone-200)" }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-14"
        >
          <p className="text-[11px] font-medium tracking-[0.35em] uppercase mb-4" style={{ color: "var(--color-gold)" }}>
            {t("trust.badge")}
          </p>
          <h2 className="font-serif text-3xl lg:text-4xl font-light leading-tight" style={{ color: "var(--color-ink-900)" }}>
            {t("trust.headline")}<br />
            <span style={{ fontStyle: "italic" }}>{t("trust.headlineEmphasis")}</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-px" style={{ background: "var(--color-stone-200)" }}>
          {pillars.map((pillar, idx) => (
            <motion.div
              key={pillar.name}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.07 }}
              className="p-7 lg:p-8"
              style={{ background: "var(--color-stone-50)" }}
            >
              <div className="mb-4">
                <span className="text-[9px] tracking-[0.28em] uppercase font-medium" style={{ color: "var(--color-gold)" }}>
                  {String(idx + 1).padStart(2, "0")}
                </span>
              </div>
              <h3 className="font-serif text-lg font-light mb-3" style={{ color: "var(--color-ink-900)" }}>
                {pillar.name}
              </h3>
              <p className="text-[12.5px] font-light leading-relaxed" style={{ color: "var(--color-ink-500)" }}>
                {pillar.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProcessStrip() {
  const { t } = useTranslation();

  const processSteps = [
    { step: t("process.steps.discovery.step"), label: t("process.steps.discovery.label"), desc: t("process.steps.discovery.desc") },
    { step: t("process.steps.assessment.step"), label: t("process.steps.assessment.label"), desc: t("process.steps.assessment.desc") },
    { step: t("process.steps.plan.step"), label: t("process.steps.plan.label"), desc: t("process.steps.plan.desc") },
    { step: t("process.steps.onboarding.step"), label: t("process.steps.onboarding.label"), desc: t("process.steps.onboarding.desc") },
    { step: t("process.steps.management.step"), label: t("process.steps.management.label"), desc: t("process.steps.management.desc") },
  ];

  return (
    <section className="py-20 lg:py-28" style={{ background: "var(--color-cream-warm)", borderTop: "1px solid var(--color-stone-200)" }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-14 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4"
        >
          <div>
            <p className="text-[11px] font-medium tracking-[0.35em] uppercase mb-4" style={{ color: "var(--color-gold)" }}>
              {t("process.badge")}
            </p>
            <h2 className="font-serif text-3xl lg:text-4xl font-light" style={{ color: "var(--color-ink-900)" }}>
              {t("process.headline")}<br />
              <span style={{ fontStyle: "italic" }}>{t("process.headlineEmphasis")}</span>
            </h2>
          </div>
          <Link
            href="/engagements"
            className="text-[12px] font-medium tracking-[0.12em] uppercase transition-colors shrink-0"
            style={{ color: "var(--color-gold)", opacity: 0.8 }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = "0.8"; }}
          >
            {t("nav.howWeWork")} →
          </Link>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-6">
          {processSteps.map((step, idx) => (
            <motion.div
              key={step.step}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.08 }}
            >
              <div className="mb-5">
                <span
                  className="font-serif text-4xl font-light"
                  style={{ color: "var(--color-stone-300)", letterSpacing: "-0.02em" }}
                >
                  {step.step}
                </span>
              </div>
              <h3 className="font-serif text-base font-light mb-3" style={{ color: "var(--color-ink-900)" }}>
                {step.label}
              </h3>
              <p className="text-[12.5px] font-light leading-relaxed" style={{ color: "var(--color-ink-500)" }}>
                {step.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function InquiryCard() {
  const { t } = useTranslation();

  const contactDetails = [
    { label: t("rosa.contactInfo.responseTime"), value: t("rosa.contactInfo.responseValue") },
    { label: t("rosa.contactInfo.locations"), value: t("rosa.contactInfo.locationsValue") },
    { label: t("rosa.contactInfo.contact"), value: t("rosa.contactInfo.contactValue") },
  ];

  return (
    <section className="py-20 lg:py-28" style={{ background: "var(--color-stone-50)", borderTop: "1px solid var(--color-stone-200)" }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-[11px] font-medium tracking-[0.35em] uppercase mb-6" style={{ color: "var(--color-gold)" }}>
              {t("contact.badge")}
            </p>
            <h2 className="font-serif text-3xl lg:text-4xl font-light mb-6" style={{ color: "var(--color-ink-900)" }}>
              {t("inquiry.headline")}<br />
              <span style={{ fontStyle: "italic" }}>{t("inquiry.headlineEmphasis")}</span>
            </h2>
            <p className="text-[14px] font-light leading-relaxed mb-8 max-w-xl" style={{ color: "var(--color-ink-500)" }}>
              {t("inquiry.description")}
            </p>
            <div className="flex flex-col sm:flex-row items-start gap-4">
              <Link
                href="/booking"
                className="inline-flex items-center gap-2.5 px-8 py-4 text-[13px] font-medium tracking-[0.08em] transition-colors"
                style={{ color: "var(--color-cream)", background: "var(--color-gold)" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--color-gold-light)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--color-gold)"; }}
              >
                {t("inquiry.cta")}
              </Link>
              <Link
                href="/services"
                className="inline-flex items-center px-8 py-4 text-[12px] font-medium tracking-[0.15em] uppercase transition-all"
                style={{ color: "var(--color-ink-500)", border: "1px solid var(--color-stone-300)" }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "var(--color-ink-500)";
                  (e.currentTarget as HTMLElement).style.color = "var(--color-ink-900)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "var(--color-stone-300)";
                  (e.currentTarget as HTMLElement).style.color = "var(--color-ink-500)";
                }}
              >
                {t("common.viewServices")}
              </Link>
            </div>

            <div className="mt-12 pt-8 border-t" style={{ borderColor: "var(--color-stone-200)" }}>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {contactDetails.map((item) => (
                  <div key={item.label}>
                    <p className="text-[10px] tracking-[0.2em] uppercase mb-1.5" style={{ color: "var(--color-stone-400)" }}>{item.label}</p>
                    <p className="text-[13px] font-light" style={{ color: "var(--color-ink-600)" }}>{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen" style={{ background: "var(--color-cream-warm)" }}>
      <Header />
      <Hero />
      <Services />
      <RosaBlock />
      <TrustPillars />
      <Proof />
      <ProcessStrip />
      <InquiryCard />
      <Footer />
    </div>
  );
}
