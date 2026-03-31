import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Services from "@/components/Services";
import Proof from "@/components/Proof";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import { Link } from "wouter";

const trustPillars = [
  { name: "Discretion", desc: "Every engagement is conducted with absolute confidentiality. Your affairs, your staff, and your residence are never discussed." },
  { name: "Responsiveness", desc: "You will hear back within two hours during business hours. For urgent matters, the same day — always." },
  { name: "Structure", desc: "Operations run on documented systems, not memory. Every process is tracked, every vendor vetted, every task owned." },
  { name: "Professionalism", desc: "Communication is clear, precise, and appropriately formal. We represent you to vendors, staff, and third parties at your standard." },
  { name: "High-Touch Execution", desc: "The level of attention you'd expect from a personal COO — applied to the operational layer of your home and life." },
];

const processSteps = [
  { step: "01", label: "Discovery Call", desc: "A confidential conversation to understand your household, priorities, and what support you're looking for. No obligation." },
  { step: "02", label: "Needs Assessment", desc: "Rosa visits the property, meets the household team, and forms her own independent view of the operational situation." },
  { step: "03", label: "Service Plan", desc: "A tailored plan defining scope, protocols, and decision thresholds — prepared with you, not imposed on you." },
  { step: "04", label: "Onboarding", desc: "Rosa assumes oversight, confirms vendor relationships, documents the standards, and transitions cleanly into the engagement." },
  { step: "05", label: "Active Management", desc: "Proactive, ongoing management. Monthly summaries. Quarterly reviews. You are informed, not burdened." },
];

function RosaBlock() {
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
              The Principal
            </p>
            <h2 className="font-serif text-3xl font-light mb-4" style={{ color: "var(--color-ink-900)" }}>
              Carlota Jo
            </h2>
            <p className="text-sm font-light leading-relaxed mb-1" style={{ color: "var(--color-ink-600)" }}>
              Fractional Director of Properties & Residence
            </p>
            <p className="text-xs font-light" style={{ color: "var(--color-stone-500)" }}>
              SZL Holdings
            </p>
          </div>
          <div className="lg:col-span-5">
            <p className="text-sm font-light leading-relaxed mb-4" style={{ color: "var(--color-ink-600)" }}>
              Rosa built Carlota Jo for principals who need one person they can genuinely trust to manage the operational layer of their residential life — with warmth, detail-orientation, and the discretion that high-net-worth families require as a baseline.
            </p>
            <p className="text-sm font-light leading-relaxed" style={{ color: "var(--color-ink-500)" }}>
              With experience spanning multiple residences, international properties, and the full complexity of high-net-worth household operations, Rosa brings a structured, professional approach to every engagement.
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
              About Carlota Jo
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2.5 px-6 py-3 text-[12px] font-medium tracking-[0.08em] transition-colors"
              style={{ color: "var(--color-cream)", background: "var(--color-gold)" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--color-gold-light)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--color-gold)"; }}
            >
              Request a consultation
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function TrustPillars() {
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
            The Standard
          </p>
          <h2 className="font-serif text-3xl lg:text-4xl font-light leading-tight" style={{ color: "var(--color-ink-900)" }}>
            Five pillars.<br />
            <span style={{ fontStyle: "italic" }}>One uncompromising standard.</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-px" style={{ background: "var(--color-stone-200)" }}>
          {trustPillars.map((pillar, idx) => (
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
              How It Works
            </p>
            <h2 className="font-serif text-3xl lg:text-4xl font-light" style={{ color: "var(--color-ink-900)" }}>
              Five stages to a managed engagement.
            </h2>
          </div>
          <Link
            href="/engagements"
            className="text-[12px] font-medium tracking-[0.12em] uppercase transition-colors shrink-0"
            style={{ color: "var(--color-gold)", opacity: 0.8 }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = "0.8"; }}
          >
            View the full process →
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
              Private Inquiry
            </p>
            <h2 className="font-serif text-3xl lg:text-4xl font-light mb-6" style={{ color: "var(--color-ink-900)" }}>
              Begin a confidential conversation.
            </h2>
            <p className="text-[14px] font-light leading-relaxed mb-8 max-w-xl" style={{ color: "var(--color-ink-500)" }}>
              All enquiries are handled personally by Rosa with complete discretion. There is no obligation after an initial conversation. Tell us a little about your situation, and Rosa will respond personally within two business days.
            </p>
            <div className="flex flex-col sm:flex-row items-start gap-4">
              <Link
                href="/booking"
                className="inline-flex items-center gap-2.5 px-8 py-4 text-[13px] font-medium tracking-[0.08em] transition-colors"
                style={{ color: "var(--color-cream)", background: "var(--color-gold)" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--color-gold-light)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--color-gold)"; }}
              >
                Request a Confidential Consultation
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
                View Services
              </Link>
            </div>

            <div className="mt-12 pt-8 border-t" style={{ borderColor: "var(--color-stone-200)" }}>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {[
                  { label: "Response time", value: "Within two business days" },
                  { label: "Locations", value: "London · New York, NY" },
                  { label: "Contact", value: "inquiries@carlotajo.com" },
                ].map((item) => (
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
