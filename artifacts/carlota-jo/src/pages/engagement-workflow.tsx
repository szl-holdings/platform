import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Clock, ArrowRight, ChevronDown, ChevronUp } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Link } from "wouter";

const STAGES = [
  {
    number: "01",
    title: "Discovery Call",
    duration: "60–90 minutes",
    description: "A confidential conversation to understand your household, properties, priorities, and the kind of support you are looking for. There is no obligation after this call — it is purely an opportunity for mutual understanding.",
    whatHappens: [
      "Rosa listens first. You describe your situation, your residences, and what isn't working.",
      "She asks targeted questions about your household staff, vendor relationships, and the specific friction you are experiencing.",
      "You get a clear sense of whether Carlota Jo is the right fit — and Rosa will say so honestly if it is not.",
      "If there is a fit, Rosa proposes a needs assessment visit.",
    ],
    whatYouReceive: "A written summary of the conversation and Rosa's initial thoughts on the scope of support that would be most relevant.",
  },
  {
    number: "02",
    title: "Needs Assessment",
    duration: "2–3 days on-site",
    description: "Before advising on anything, Rosa visits the property. She meets the household team, reviews vendor relationships and contracts, walks every system in the residence, and forms her own view of the operational situation — independent of what she has been told.",
    whatHappens: [
      "Rosa spends two to three days at the primary residence, or across multiple properties if relevant.",
      "She conducts individual conversations with each household staff member.",
      "She reviews active vendor contracts, maintenance records, and any existing operational documentation.",
      "She observes rather than advises — the assessment is a fact-finding mission, not an intervention.",
    ],
    whatYouReceive: "A written operational assessment covering the household's current state, the gaps she has identified, and her recommendations for the engagement scope.",
  },
  {
    number: "03",
    title: "Service Plan",
    duration: "1–2 weeks",
    description: "Based on the assessment, Rosa prepares a tailored service plan that defines the exact scope of her involvement, the communication protocols, the reporting cadence, and the decision thresholds that will govern the engagement.",
    whatHappens: [
      "Rosa drafts the service plan based on the assessment findings and your stated priorities.",
      "You review the plan together and refine it — scope, escalation thresholds, reporting frequency.",
      "A formal service agreement is prepared and signed by both parties.",
      "Vendor introductions and staff briefings are scheduled for the onboarding period.",
    ],
    whatYouReceive: "A signed service plan and engagement agreement, a confirmed onboarding schedule, and clarity on exactly what Rosa will own from day one.",
  },
  {
    number: "04",
    title: "Onboarding",
    duration: "2–4 weeks",
    description: "Rosa assumes operational oversight of the engagement scope. She meets every vendor, confirms all service arrangements, documents the standards, and ensures that the household team understands the new protocols before active management begins.",
    whatHappens: [
      "Rosa meets individually with every vendor and contractor in scope.",
      "She confirms or renegotiates service standards with each party.",
      "She builds or updates the household operational manual.",
      "She establishes her working relationship with household staff and clarifies reporting lines.",
    ],
    whatYouReceive: "A fully documented household, confirmed vendor relationships, and a smooth transition to active management without operational disruption.",
  },
  {
    number: "05",
    title: "Active Management",
    duration: "Ongoing",
    description: "The steady state of the engagement. Rosa manages the operational layer of your residential life on an ongoing basis — proactively, quietly, and to the standard you have defined. Monthly summaries keep you informed. Quarterly reviews keep the engagement calibrated.",
    whatHappens: [
      "Rosa manages daily household operations, vendor performance, and maintenance scheduling.",
      "She escalates to you only when something genuinely requires your decision.",
      "A monthly written summary covers everything that happened — issues resolved, tasks completed, upcoming items.",
      "A quarterly review session covers the broader engagement, any scope adjustments, and the next quarter's focus.",
    ],
    whatYouReceive: "The experience of a flawlessly run household — without the management burden. Complete operational accountability from one trusted person.",
  },
];

const CURRENT_STAGE = 3;

export default function EngagementWorkflowPage() {
  const [expanded, setExpanded] = useState<number | null>(CURRENT_STAGE);

  return (
    <div className="min-h-screen" style={{ background: "var(--color-cream-warm)" }}>
      <Header />
      <div className="pt-24">
        <section className="py-20 lg:py-28" style={{ borderBottom: "1px solid var(--color-stone-200)" }}>
          <div className="max-w-5xl mx-auto px-6 lg:px-12">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className="max-w-2xl"
            >
              <p className="text-[11px] font-medium tracking-[0.35em] uppercase mb-6" style={{ color: "var(--color-gold)" }}>
                How We Work
              </p>
              <h1 className="font-serif font-light leading-[1.1] mb-6" style={{ fontSize: "clamp(2rem, 4vw, 3rem)", color: "var(--color-ink-900)" }}>
                Five stages to a managed engagement.
                <br />
                <span style={{ fontStyle: "italic" }}>Deliberate at every step.</span>
              </h1>
              <p className="text-base font-light leading-relaxed mb-3" style={{ color: "var(--color-ink-600)" }}>
                Carlota Jo does not begin active management until Rosa understands your household thoroughly. The engagement process is designed to ensure that when she starts, she starts correctly — with full knowledge, confirmed relationships, and documented standards.
              </p>
              <p className="text-sm font-light leading-relaxed" style={{ color: "var(--color-ink-500)" }}>
                Each stage has a defined purpose and a clear deliverable. You will never be left wondering what happens next.
              </p>
            </motion.div>
          </div>
        </section>

        <section className="py-16 lg:py-20" style={{ borderBottom: "1px solid var(--color-stone-200)" }}>
          <div className="max-w-5xl mx-auto px-6 lg:px-12">
            <div className="hidden lg:flex items-center gap-0 mb-16 overflow-x-auto">
              {STAGES.map((stage, i) => {
                const isComplete = i < CURRENT_STAGE;
                const isCurrent = i === CURRENT_STAGE;
                return (
                  <div key={stage.number} className="flex items-center">
                    <motion.button
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: i * 0.08 }}
                      onClick={() => setExpanded(expanded === i ? null : i)}
                      className="flex flex-col items-center gap-2 px-6 py-3 transition-colors"
                      style={{ minWidth: "130px" }}
                    >
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-medium transition-all"
                        style={{
                          background: isCurrent ? "var(--color-gold)" : isComplete ? "rgba(154,125,82,0.12)" : expanded === i ? "var(--color-stone-200)" : "var(--color-stone-100)",
                          color: isCurrent ? "var(--color-cream)" : isComplete ? "var(--color-gold)" : "var(--color-ink-500)",
                          border: isCurrent ? "none" : isComplete ? "1px solid rgba(154,125,82,0.25)" : "1px solid var(--color-stone-200)",
                        }}
                      >
                        {isComplete ? <CheckCircle2 size={14} /> : stage.number}
                      </div>
                      <span
                        className="text-[11px] font-medium text-center leading-tight"
                        style={{ color: isCurrent ? "var(--color-ink-900)" : isComplete ? "var(--color-gold)" : "var(--color-ink-500)", opacity: isComplete ? 0.7 : 1 }}
                      >
                        {stage.title}
                      </span>
                      {isCurrent ? (
                        <span className="text-[8px] tracking-[0.18em] uppercase font-medium text-center px-1.5 py-0.5" style={{ color: "var(--color-cream)", background: "var(--color-gold)", opacity: 0.9 }}>
                          Current
                        </span>
                      ) : (
                        <span className="text-[9px] tracking-wide text-center" style={{ color: "var(--color-stone-400)" }}>
                          {stage.duration}
                        </span>
                      )}
                    </motion.button>
                    {i < STAGES.length - 1 && (
                      <div className="w-8 h-px flex-shrink-0" style={{ background: i < CURRENT_STAGE ? "rgba(154,125,82,0.25)" : "var(--color-stone-300)" }} />
                    )}
                  </div>
                );
              })}
            </div>

            <div className="space-y-px" style={{ borderTop: "1px solid var(--color-stone-200)" }}>
              {STAGES.map((stage, i) => {
                const isComplete = i < CURRENT_STAGE;
                const isCurrent = i === CURRENT_STAGE;
                return (
                <motion.div
                  key={stage.number}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.45, delay: i * 0.05 }}
                  style={{
                    borderBottom: "1px solid var(--color-stone-200)",
                    borderLeft: isCurrent ? "2px solid var(--color-gold)" : "2px solid transparent",
                    paddingLeft: isCurrent ? "1.5rem" : undefined,
                  }}
                >
                  <button
                    onClick={() => setExpanded(expanded === i ? null : i)}
                    className="w-full text-left py-8 grid grid-cols-1 md:grid-cols-12 gap-4 transition-colors"
                  >
                    <div className="md:col-span-1">
                      {isComplete ? (
                        <CheckCircle2 size={20} style={{ color: "rgba(154,125,82,0.45)", marginTop: "0.25rem" }} />
                      ) : (
                        <span
                          className="font-serif text-2xl font-light"
                          style={{ color: isCurrent ? "var(--color-gold)" : "var(--color-stone-300)", letterSpacing: "-0.02em" }}
                        >
                          {stage.number}
                        </span>
                      )}
                    </div>
                    <div className="md:col-span-9">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-3">
                          <h3
                            className="font-serif text-xl font-light transition-colors"
                            style={{ color: isCurrent ? "var(--color-ink-900)" : isComplete ? "var(--color-ink-600)" : "var(--color-ink-800)" }}
                          >
                            {stage.title}
                          </h3>
                          {isCurrent && (
                            <span className="text-[9px] font-medium tracking-[0.2em] uppercase px-2 py-0.5" style={{ color: "var(--color-cream)", background: "var(--color-gold)" }}>
                              In progress
                            </span>
                          )}
                          {isComplete && (
                            <span className="text-[9px] font-light tracking-[0.15em] uppercase" style={{ color: "rgba(154,125,82,0.5)" }}>
                              Complete
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock size={12} style={{ color: "var(--color-stone-400)" }} />
                          <span className="text-[11px] font-light" style={{ color: "var(--color-stone-400)" }}>
                            {stage.duration}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="md:col-span-2 flex items-center justify-end">
                      {expanded === i ? (
                        <ChevronUp size={16} style={{ color: "var(--color-gold)" }} />
                      ) : (
                        <ChevronDown size={16} style={{ color: "var(--color-stone-400)" }} />
                      )}
                    </div>
                  </button>

                  {expanded === i && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.35 }}
                      className="pb-10 grid grid-cols-1 md:grid-cols-12 gap-8"
                    >
                      <div className="md:col-span-1" />
                      <div className="md:col-span-11">
                        <p className="text-[14px] font-light leading-relaxed mb-8" style={{ color: "var(--color-ink-600)" }}>
                          {stage.description}
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div>
                            <p className="text-[10px] font-medium tracking-[0.22em] uppercase mb-4" style={{ color: "var(--color-stone-400)" }}>
                              What happens
                            </p>
                            <ul className="space-y-3">
                              {stage.whatHappens.map((item, j) => (
                                <li key={j} className="flex items-start gap-3">
                                  <span style={{ color: "var(--color-gold)", marginTop: "0.15rem", flexShrink: 0 }}>—</span>
                                  <span className="text-[13px] font-light leading-relaxed" style={{ color: "var(--color-ink-600)" }}>
                                    {item}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <p className="text-[10px] font-medium tracking-[0.22em] uppercase mb-4" style={{ color: "var(--color-stone-400)" }}>
                              What you receive
                            </p>
                            <div className="p-5" style={{ background: "var(--color-stone-50)", border: "1px solid var(--color-stone-200)" }}>
                              <p className="text-[13px] font-light leading-relaxed" style={{ color: "var(--color-ink-600)" }}>
                                {stage.whatYouReceive}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              ); })}
            </div>
          </div>
        </section>

        <section className="py-16 lg:py-20" style={{ background: "var(--color-stone-50)", borderBottom: "1px solid var(--color-stone-200)" }}>
          <div className="max-w-5xl mx-auto px-6 lg:px-12">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-8"
            >
              {[
                { label: "First step", value: "Discovery call", sub: "No obligation. No sales process." },
                { label: "Typical start", value: "4–6 weeks", sub: "From first conversation to active management." },
                { label: "Commitment", value: "3-month minimum", sub: "After which, rolling monthly engagement." },
              ].map((item) => (
                <div key={item.label}>
                  <p className="text-[10px] font-medium tracking-[0.25em] uppercase mb-2" style={{ color: "var(--color-stone-400)" }}>
                    {item.label}
                  </p>
                  <p className="font-serif text-xl font-light mb-1" style={{ color: "var(--color-ink-900)" }}>
                    {item.value}
                  </p>
                  <p className="text-[12px] font-light" style={{ color: "var(--color-ink-500)" }}>
                    {item.sub}
                  </p>
                </div>
              ))}
            </motion.div>
          </div>
        </section>

        <section className="py-16 lg:py-20">
          <div className="max-w-5xl mx-auto px-6 lg:px-12">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="max-w-xl"
            >
              <h2 className="font-serif text-2xl font-light mb-4" style={{ color: "var(--color-ink-900)" }}>
                Begin with a conversation.
              </h2>
              <p className="text-sm font-light leading-relaxed mb-8" style={{ color: "var(--color-ink-500)" }}>
                The discovery call is free, confidential, and carries no obligation. Rosa responds to substantive enquiries personally within two business days.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2.5 px-7 py-3.5 text-[13px] font-medium tracking-[0.08em] transition-colors"
                  style={{ color: "var(--color-cream)", background: "var(--color-gold)" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--color-gold-light)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--color-gold)"; }}
                >
                  Request a Consultation
                </Link>
                <Link
                  href="/services"
                  className="inline-flex items-center px-7 py-3.5 text-[12px] font-medium tracking-[0.12em] uppercase transition-all"
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
            </motion.div>
          </div>
        </section>
      </div>
      <Footer />
    </div>
  );
}
