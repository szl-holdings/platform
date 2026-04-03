import { motion } from "framer-motion";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Link } from "wouter";
import { ArrowRight, Check } from "lucide-react";
import { useTranslation } from "react-i18next";

const PHASES = [
  {
    number: "01",
    title: "Discovery",
    subtitle: "Understanding your world",
    duration: "Week 1–2",
    description: "A structured intake process that maps your principal's life architecture — residences, staff, recurring obligations, vendors, preferences, and the friction points that cost time and attention.",
    deliverable: "Life Audit Document + Priority Matrix",
    details: [
      "Residence inventory and condition assessment",
      "Current vendor and service provider review",
      "Household staff evaluation and gap analysis",
      "Calendar and commitment mapping",
      "Identify the 5 highest-friction recurring problems",
    ],
  },
  {
    number: "02",
    title: "Architecture",
    subtitle: "Designing the operating system",
    duration: "Week 2–3",
    description: "The operating design for your principal's life. Vendor relationships, communication protocols, approval flows, and emergency escalation procedures — documented to the level of operational precision.",
    deliverable: "Household Operating Manual + Vendor Network",
    details: [
      "Establish preferred vendor relationships by category",
      "Define communication protocols and response SLAs",
      "Create household emergency procedures",
      "Set seasonal maintenance and review calendars",
      "Document principal preferences in structured format",
    ],
  },
  {
    number: "03",
    title: "Execution",
    subtitle: "Seamless daily operations",
    duration: "Ongoing",
    description: "The continuous management layer. Every request handled with the same standard of care. Every vendor coordinated. Every deadline tracked. The principal's attention protected from operational complexity.",
    deliverable: "Monthly Report + Continuous Availability",
    details: [
      "Same-day response to all principal communications",
      "Proactive vendor coordination and follow-up",
      "Weekly status visibility on active projects",
      "Monthly operations review and forward planning",
      "Annual vendor renegotiation and market rate review",
    ],
  },
  {
    number: "04",
    title: "Calibration",
    subtitle: "Refining as life evolves",
    duration: "Quarterly",
    description: "Lives change. Residences are acquired or sold. Families grow. Priorities shift. The engagement calibrates continuously — the operating infrastructure evolves in step with the principal.",
    deliverable: "Updated Operating Manual + New Priorities",
    details: [
      "Quarterly review of operating architecture",
      "Vendor relationship performance assessment",
      "New initiative scoping and planning",
      "Principal preference and priority updates",
      "Annual engagement renewal and scope refinement",
    ],
  },
];

const PRINCIPLES = [
  {
    title: "Single point of accountability",
    body: "Every engagement is managed by Rosa directly. There is no junior associate handling your affairs. No handoff to a team member when complexity escalates. The standard is maintained because the person is.",
  },
  {
    title: "Radical discretion as default",
    body: "Confidentiality is not a feature. It is the operating mode. No details of your household, family, schedule, or preferences are shared with any third party without explicit instruction. NDAs are standard.",
  },
  {
    title: "Operational precision, not just attentiveness",
    body: "Luxury service often mistakes attentiveness for capability. We bring structured operational discipline — documented systems, tracked commitments, measurable outcomes — alongside exceptional attention.",
  },
  {
    title: "Anticipation before request",
    body: "The highest standard of service is action taken before the principal needs to ask. Seasonal preparation, vendor renewals, upcoming occasions — managed before they surface as requirements.",
  },
];

export default function MethodologyPage() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen" style={{ background: "var(--color-cream-warm)" }}>
      <Header />
      <div className="pt-24">
        <section className="py-16 lg:py-24" style={{ borderBottom: "1px solid var(--color-stone-200)" }}>
          <div className="max-w-5xl mx-auto px-6 lg:px-12">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className="max-w-2xl"
            >
              <p className="text-[11px] font-medium tracking-[0.35em] uppercase mb-6" style={{ color: "var(--color-gold)" }}>
                Methodology
              </p>
              <h1 className="font-serif font-light leading-[1.1] mb-6" style={{ fontSize: "clamp(2rem, 4vw, 3rem)", color: "var(--color-ink-900)" }}>
                How we work.
                <br />
                <span style={{ fontStyle: "italic" }}>And why it works.</span>
              </h1>
              <p className="text-base font-light leading-relaxed mb-4" style={{ color: "var(--color-ink-600)" }}>
                The Carlota Jo engagement model is built on a foundational premise: a principal's life operates at a level of complexity that requires structured operational management, not just an attentive assistant.
              </p>
              <p className="text-sm font-light leading-relaxed" style={{ color: "var(--color-ink-500)" }}>
                What follows is not a description of service categories. It is the actual operating methodology applied in every engagement — from the initial discovery through years of ongoing management.
              </p>
            </motion.div>
          </div>
        </section>

        <section className="py-16 lg:py-24" style={{ borderBottom: "1px solid var(--color-stone-200)" }}>
          <div className="max-w-5xl mx-auto px-6 lg:px-12">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="mb-12"
            >
              <p className="text-[11px] font-medium tracking-[0.35em] uppercase mb-4" style={{ color: "var(--color-gold)" }}>
                The Engagement Arc
              </p>
              <h2 className="font-serif text-2xl lg:text-3xl font-light" style={{ color: "var(--color-ink-900)" }}>
                Four phases. One operating standard.
              </h2>
            </motion.div>

            <div className="space-y-0">
              {PHASES.map((phase, idx) => (
                <motion.div
                  key={phase.number}
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: idx * 0.08 }}
                  className="grid grid-cols-1 lg:grid-cols-12 gap-8 py-10"
                  style={{ borderTop: "1px solid var(--color-stone-200)" }}
                >
                  <div className="lg:col-span-4">
                    <div className="flex items-baseline gap-3 mb-2">
                      <span className="font-mono text-[11px]" style={{ color: "var(--color-gold)", opacity: 0.6 }}>{phase.number}</span>
                      <h3 className="font-serif text-xl font-light" style={{ color: "var(--color-ink-900)" }}>{phase.title}</h3>
                    </div>
                    <p className="text-xs tracking-[0.1em] uppercase mb-3" style={{ color: "var(--color-stone-500)" }}>{phase.subtitle}</p>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1" style={{ border: "1px solid var(--color-stone-300)", background: "var(--color-stone-50)" }}>
                      <span className="text-[9px] tracking-[0.15em] uppercase font-medium" style={{ color: "var(--color-stone-500)" }}>{phase.duration}</span>
                    </div>
                  </div>
                  <div className="lg:col-span-5">
                    <p className="text-sm font-light leading-relaxed mb-4" style={{ color: "var(--color-ink-600)" }}>{phase.description}</p>
                    <div className="inline-flex items-center gap-2">
                      <span className="text-[10px] tracking-[0.2em] uppercase font-medium" style={{ color: "var(--color-gold)", opacity: 0.7 }}>Deliverable:</span>
                      <span className="text-[11px] font-medium" style={{ color: "var(--color-ink-700)" }}>{phase.deliverable}</span>
                    </div>
                  </div>
                  <div className="lg:col-span-3">
                    <ul className="space-y-2">
                      {phase.details.map((d) => (
                        <li key={d} className="flex items-start gap-2 text-[11px] font-light leading-relaxed" style={{ color: "var(--color-ink-500)" }}>
                          <Check size={10} className="mt-0.5 flex-shrink-0" style={{ color: "var(--color-gold)", opacity: 0.6 }} />
                          {d}
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 lg:py-24" style={{ background: "var(--color-stone-50)", borderBottom: "1px solid var(--color-stone-200)" }}>
          <div className="max-w-5xl mx-auto px-6 lg:px-12">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="mb-12"
            >
              <p className="text-[11px] font-medium tracking-[0.35em] uppercase mb-4" style={{ color: "var(--color-gold)" }}>
                Operating Principles
              </p>
              <h2 className="font-serif text-2xl lg:text-3xl font-light" style={{ color: "var(--color-ink-900)" }}>
                The standards that cannot be compromised.
              </h2>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-px" style={{ background: "var(--color-stone-200)" }}>
              {PRINCIPLES.map((p, idx) => (
                <motion.div
                  key={p.title}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.45, delay: idx * 0.07 }}
                  className="p-8 lg:p-10"
                  style={{ background: "var(--color-stone-50)" }}
                >
                  <h3 className="font-serif text-lg font-light mb-4" style={{ color: "var(--color-ink-900)" }}>{p.title}</h3>
                  <p className="text-sm font-light leading-relaxed" style={{ color: "var(--color-ink-600)" }}>{p.body}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 lg:py-24" style={{ borderTop: "1px solid var(--color-stone-200)", background: "#1a1714" }}>
          <div className="max-w-5xl mx-auto px-6 lg:px-12">
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="max-w-xl"
            >
              <p className="text-[11px] font-medium tracking-[0.35em] uppercase mb-5" style={{ color: "rgba(196,170,126,0.7)" }}>
                Begin
              </p>
              <h2 className="font-serif text-2xl lg:text-3xl font-light mb-6" style={{ color: "#f5f0e8" }}>
                Engagements are limited.
                <br />
                <span style={{ fontStyle: "italic", color: "rgba(196,170,126,0.85)" }}>Access begins with a conversation.</span>
              </h2>
              <p className="text-sm font-light leading-relaxed mb-8" style={{ color: "rgba(245,240,232,0.55)" }}>
                We accept a small number of new principals each year. The initial consultation is private, obligation-free, and designed to assess whether the engagement would be mutually well-suited.
              </p>
              <Link
                href="/contact"
                className="group inline-flex items-center gap-2.5 px-7 py-3.5 text-[12px] font-medium tracking-[0.08em] uppercase transition-all duration-300"
                style={{ color: "#1a1714", background: "rgba(196,170,126,0.9)" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(196,170,126,1)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(196,170,126,0.9)"; }}
              >
                Request a private consultation
                <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </motion.div>
          </div>
        </section>
      </div>
      <Footer />
    </div>
  );
}
