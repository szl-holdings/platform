import { useState } from "react";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Services from "@/components/Services";
import Proof from "@/components/Proof";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { Lock, Layers, Activity, FileText, ArrowRight } from "lucide-react";

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

function ServiceLanes() {
  const lanes = [
    {
      num: "01",
      name: "Strategy & Advisory",
      desc: "Founder and leadership advisory informed by market data, competitive intelligence, and structured decision frameworks. We surface what matters before it becomes obvious.",
      signals: ["Competitive landscape modeling", "Market entry sequencing", "Positioning thesis development"],
    },
    {
      num: "02",
      name: "Operations & Execution",
      desc: "Transformation, change management, and operating model redesign for organisations moving through growth inflection points. Intelligence-driven, not opinion-driven.",
      signals: ["Operating model diagnostics", "Change readiness assessments", "Execution sprint architecture"],
    },
    {
      num: "03",
      name: "Technology & Platforms",
      desc: "Technology strategy and vendor evaluation with access to institutional-grade intelligence on emerging platforms, AI tooling, and infrastructure decisions.",
      signals: ["Platform selection support", "AI adoption framing", "Vendor due diligence"],
    },
  ];

  return (
    <section className="py-20 lg:py-28" style={{ borderTop: "1px solid var(--color-stone-200)", background: "var(--color-stone-50)" }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-14"
        >
          <p className="text-[11px] font-medium tracking-[0.35em] uppercase mb-4" style={{ color: "var(--color-gold)" }}>Service Lanes</p>
          <h2 className="font-serif text-3xl lg:text-4xl font-light leading-tight" style={{ color: "var(--color-ink-900)" }}>
            Three domains.<br />
            <span style={{ fontStyle: "italic" }}>One operating standard.</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-px" style={{ background: "var(--color-stone-200)" }}>
          {lanes.map((lane, i) => (
            <motion.div
              key={lane.num}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="p-8"
              style={{ background: "var(--color-stone-50)" }}
            >
              <span className="text-[9px] tracking-[0.28em] uppercase font-medium block mb-5" style={{ color: "var(--color-gold)" }}>{lane.num}</span>
              <h3 className="font-serif text-xl font-light mb-4" style={{ color: "var(--color-ink-900)" }}>{lane.name}</h3>
              <p className="text-[13px] font-light leading-relaxed mb-6" style={{ color: "var(--color-ink-500)" }}>{lane.desc}</p>
              <div className="space-y-2">
                {lane.signals.map((s) => (
                  <div key={s} className="flex items-start gap-2.5">
                    <span className="w-1 h-1 rounded-full mt-1.5 shrink-0" style={{ background: "var(--color-gold)", opacity: 0.4 }} />
                    <span className="text-[12px] font-light" style={{ color: "var(--color-ink-400)" }}>{s}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function WorkingStandard() {
  const standards = [
    {
      icon: Activity,
      title: "Evidence before opinion",
      desc: "Every recommendation is grounded in observable fact. Rosa documents the evidence, the logic, and the alternatives considered — not just the conclusion."
    },
    {
      icon: Layers,
      title: "Structured over reactive",
      desc: "Engagements are designed around systems, not responses. The goal is a household or advisory relationship that holds its standard without your constant attention."
    },
    {
      icon: FileText,
      title: "Transparent record-keeping",
      desc: "You receive a clear record of every decision, action, and outcome. Nothing is lost between conversations."
    },
  ];

  return (
    <section className="py-20 lg:py-28" style={{ background: "var(--color-cream-warm)", borderTop: "1px solid var(--color-stone-200)" }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          <motion.div
            className="lg:col-span-5"
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-[11px] font-medium tracking-[0.35em] uppercase mb-4" style={{ color: "var(--color-gold)" }}>Working Standard</p>
            <h2 className="font-serif text-3xl lg:text-4xl font-light leading-tight mb-6" style={{ color: "var(--color-ink-900)" }}>
              Advisory that shows<br />
              <span style={{ fontStyle: "italic" }}>its reasoning.</span>
            </h2>
            <p className="text-[14px] font-light leading-relaxed mb-6" style={{ color: "var(--color-ink-500)" }}>
              Rosa does not operate on instinct alone. Every engagement is structured, documented, and traceable. You should be able to understand exactly why a recommendation was made and what evidence supports it.
            </p>
            <p className="text-[13px] font-light leading-relaxed" style={{ color: "var(--color-ink-400)" }}>
              This means briefings that arrive with context. Recommendations that show their logic. And a relationship that builds compounding knowledge of your environment over time.
            </p>
          </motion.div>

          <div className="lg:col-span-7 space-y-0">
            <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "var(--color-stone-200)" }}>
              <div className="px-6 py-4 flex items-center gap-3" style={{ borderBottom: "1px solid var(--color-stone-200)", background: "var(--color-stone-50)" }}>
                <span className="text-[9px] tracking-[0.28em] uppercase font-medium" style={{ color: "var(--color-gold)" }}>How Rosa Works</span>
              </div>
              {standards.map((s, i) => (
                <motion.div
                  key={s.title}
                  initial={{ opacity: 0, x: 8 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                  className="flex items-start gap-5 px-6 py-5"
                  style={{ borderTop: i > 0 ? "1px solid var(--color-stone-100)" : "none" }}
                >
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(200,169,106,0.08)", border: "1px solid rgba(200,169,106,0.15)" }}>
                    <s.icon className="w-4 h-4" style={{ color: "var(--color-gold)" }} />
                  </div>
                  <div>
                    <p className="text-[13px] font-medium mb-1" style={{ color: "var(--color-ink-700)" }}>{s.title}</p>
                    <p className="text-[12.5px] font-light leading-relaxed" style={{ color: "var(--color-ink-400)" }}>{s.desc}</p>
                  </div>
                </motion.div>
              ))}
              <div className="px-6 py-4 flex items-center gap-2" style={{ borderTop: "1px solid var(--color-stone-100)", background: "var(--color-stone-50)" }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--color-gold)", opacity: 0.5 }} />
                <span className="text-[11px] font-light" style={{ color: "var(--color-ink-400)" }}>
                  Part of the <span style={{ color: "var(--color-gold)", fontWeight: 500 }}>SZL Holdings</span> ecosystem — an advisory practice with a technology spine
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function PrivatePortalTeaser() {
  return (
    <section className="py-20 lg:py-24" style={{ background: "#1a1714", borderTop: "1px solid rgba(200,169,106,0.08)" }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <motion.div
            className="lg:col-span-7"
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-2 mb-6">
              <Lock className="w-3.5 h-3.5" style={{ color: "var(--color-gold)", opacity: 0.6 }} />
              <span className="text-[10px] tracking-[0.3em] uppercase font-medium" style={{ color: "var(--color-gold)", opacity: 0.6 }}>Client Portal — Private Access</span>
            </div>
            <h2 className="font-serif text-3xl lg:text-4xl font-light leading-tight mb-5" style={{ color: "#f5f0e8" }}>
              Your engagement,<br />
              <span style={{ fontStyle: "italic", color: "var(--color-gold)" }}>always on record.</span>
            </h2>
            <p className="text-[14px] font-light leading-relaxed mb-4" style={{ color: "rgba(245,240,232,0.45)" }}>
              Active clients access a private portal with their full engagement record — every briefing, recommendation, decision log, and action item in one place.
            </p>
            <p className="text-[13px] font-light leading-relaxed" style={{ color: "rgba(245,240,232,0.3)" }}>
              Portal access is provisioned on engagement. No self-serve signups. Contact us to begin.
            </p>
          </motion.div>

          <motion.div
            className="lg:col-span-5"
            initial={{ opacity: 0, x: 16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.15 }}
          >
            <div className="rounded-2xl border p-6 space-y-3" style={{ borderColor: "rgba(200,169,106,0.12)", background: "rgba(200,169,106,0.04)" }}>
              {[
                "Briefing & insight archive",
                "Recommendation decision log",
                "Open actions & milestones",
                "Engagement health summary",
                "Secure document exchange",
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 py-2" style={{ borderTop: i > 0 ? "1px solid rgba(200,169,106,0.06)" : "none" }}>
                  <div className="w-1 h-1 rounded-full shrink-0" style={{ background: "var(--color-gold)", opacity: 0.35 }} />
                  <span className="text-[13px] font-light" style={{ color: "rgba(245,240,232,0.5)" }}>{item}</span>
                </div>
              ))}
              <div className="pt-4 mt-2 border-t" style={{ borderColor: "rgba(200,169,106,0.08)" }}>
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 text-[12px] font-medium tracking-[0.1em] uppercase transition-opacity hover:opacity-75"
                  style={{ color: "var(--color-gold)" }}
                >
                  Request an engagement <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function SzlCommandSubscribeSection() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("loading");
    try {
      await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), utm_source: "carlota-jo" }),
      });
    } catch {}
    setStatus("success");
    setEmail("");
  }

  return (
    <section className="py-20 lg:py-24" style={{ background: "var(--color-cream-warm)", borderTop: "1px solid var(--color-stone-200)" }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="max-w-xl">
          <p className="text-[11px] font-medium tracking-[0.35em] uppercase mb-4" style={{ color: "var(--color-gold)" }}>
            SZL Command
          </p>
          <h2 className="font-serif text-2xl lg:text-3xl font-light mb-3" style={{ color: "var(--color-ink-900)", lineHeight: 1.35 }}>
            Strategic intelligence, delivered weekly.
          </h2>
          <p className="text-sm font-light leading-relaxed mb-6" style={{ color: "var(--color-ink-600)" }}>
            Essays on governed decision infrastructure, AI strategy, and operational design — from the founding team at SZL Holdings.
          </p>
          {status === "success" ? (
            <p className="text-sm font-light" style={{ color: "var(--color-gold)" }}>
              You're subscribed. Check your inbox to confirm.
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="flex gap-3 flex-wrap">
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="flex-1"
                style={{
                  minWidth: "200px",
                  padding: "0.625rem 0.875rem",
                  border: "1px solid var(--color-stone-300)",
                  background: "transparent",
                  fontSize: "0.875rem",
                  fontFamily: "inherit",
                  color: "var(--color-ink-900)",
                  outline: "none",
                }}
              />
              <button
                type="submit"
                disabled={status === "loading"}
                style={{
                  padding: "0.625rem 1.5rem",
                  background: "var(--color-gold)",
                  color: "var(--color-cream)",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  border: "none",
                  cursor: status === "loading" ? "not-allowed" : "pointer",
                  opacity: status === "loading" ? 0.7 : 1,
                }}
              >
                {status === "loading" ? "Subscribing…" : "Subscribe"}
              </button>
            </form>
          )}
          <p className="text-[11px] mt-3 font-light" style={{ color: "var(--color-stone-400)" }}>
            No spam. Unsubscribe any time. <a href="https://szlholdings.substack.com" target="_blank" rel="noopener noreferrer" style={{ color: "var(--color-ink-400)", textDecoration: "underline" }}>szlholdings.substack.com</a>
          </p>
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
      <ServiceLanes />
      <RosaBlock />
      <TrustPillars />
      <WorkingStandard />
      <Proof />
      <ProcessStrip />
      <PrivatePortalTeaser />
      <InquiryCard />
      <SzlCommandSubscribeSection />
      <Footer />
    </div>
  );
}
