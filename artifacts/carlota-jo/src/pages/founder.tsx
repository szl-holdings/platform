import { motion } from "framer-motion";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Link } from "wouter";

const QUALITIES = [
  { title: "Warmth before structure", desc: "Rosa builds genuine relationships with principals, household teams, and vendors alike — trust is the foundation of everything." },
  { title: "Operational precision", desc: "Every process is documented, every task is owned, every gap is closed before it becomes a problem." },
  { title: "Discretion above all", desc: "Confidentiality is not a service feature. It is the non-negotiable standard from which everything else follows." },
  { title: "Single point of contact", desc: "One number. One person. Complete accountability — no handoffs, no delegation chains, no excuses." },
  { title: "Anticipatory by nature", desc: "Rosa identifies what needs attention before you notice it. She resolves quietly, escalates precisely, and never creates noise." },
];

const EXPERIENCE = [
  { area: "Residence Operations", detail: "Full lifecycle management across primary and secondary residences in the UK, Europe, and the United States. Rosa has opened, commissioned, and managed properties ranging from London townhouses to Mediterranean estates." },
  { area: "Household Systems", detail: "Design and implementation of operating systems for complex household environments: staff scheduling, service protocols, access management, and coverage planning that runs independently of any single person." },
  { area: "Vendor Management", detail: "Principal-facing vendor networks across 40+ service categories, from specialist contractors and private security to fine art handlers and discreet medical liaisons. Every relationship is managed to a consistent standard." },
  { area: "Estate Transitions", detail: "Complex property activations, cross-border relocations, and renovation oversight for families managing multiple simultaneous priorities. Rosa has coordinated international moves and full estate commissions under compressed timelines." },
  { area: "Lifestyle & Admin", detail: "Confidential administrative support for principals with demanding schedules — travel logistics, personal correspondence, family coordination, and liaison with private wealth advisors and family office teams." },
];

const PHILOSOPHY = [
  "The best operations are invisible. When a residence runs perfectly, principals don't notice — they simply live well.",
  "Systems beat memory. Every procedure that lives in a document outlasts any individual. Rosa builds households that function without her.",
  "Discretion is binary. There is no partial confidentiality. Every engagement is conducted as if the household's operational details are the most sensitive information in the room.",
  "The principal's standard is the standard. Not an approximation of it, not a reasonable interpretation — the actual standard, held consistently by every vendor and every team member.",
];

export default function FounderPage() {
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
              className="grid grid-cols-1 lg:grid-cols-12 gap-14 lg:gap-20"
            >
              <div className="lg:col-span-7">
                <p className="text-[11px] font-medium tracking-[0.35em] uppercase mb-6" style={{ color: "var(--color-gold)" }}>
                  Carlota Jo
                </p>
                <h1 className="font-serif font-light leading-[1.1] mb-8" style={{ fontSize: "clamp(2rem, 4vw, 3rem)", color: "var(--color-ink-900)" }}>
                  The trusted operator
                  <br />
                  <span style={{ fontStyle: "italic", opacity: 0.75 }}>behind a seamlessly run life.</span>
                </h1>
                <p className="text-base font-light leading-relaxed mb-5" style={{ color: "var(--color-ink-600)" }}>
                  Rosa founded Carlota Jo after a decade working in the operational core of UHNW household environments — managing residences, coordinating vendors, building systems, and earning the trust of principals who need one person they can rely on absolutely.
                </p>
                <p className="text-sm font-light leading-relaxed mb-5" style={{ color: "var(--color-ink-500)" }}>
                  The firm carries her grandmother's name — a deliberate choice that reflects Rosa's approach to client relationships: warm, long-term, and deeply personal. Carlota Jo is not a service company. It is a private practice, built around a small number of client families who deserve an exceptional standard.
                </p>
                <p className="text-sm font-light leading-relaxed mb-10" style={{ color: "var(--color-ink-500)" }}>
                  Rosa works with a deliberately limited number of principals. She takes on new clients by introduction only, and only when she is confident she can deliver her full attention. Every engagement begins with a genuine conversation about fit — and if the fit isn't there, she will say so.
                </p>
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2.5 px-7 py-3.5 text-[13px] font-medium tracking-[0.08em] transition-colors"
                  style={{ color: "var(--color-cream)", background: "var(--color-gold)" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--color-gold-light)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--color-gold)"; }}
                >
                  Request a Consultation
                </Link>
              </div>

              <div className="lg:col-span-5">
                <div className="p-8" style={{ background: "var(--color-stone-50)", border: "1px solid var(--color-stone-200)" }}>
                  <p className="text-[10px] font-medium tracking-[0.3em] uppercase mb-6" style={{ color: "var(--color-gold)" }}>
                    How Rosa works
                  </p>
                  <div className="space-y-4">
                    {[
                      "Single point of contact across every engagement",
                      "Deep immersion in the household before advising or acting",
                      "Absolute confidentiality — without exception, without qualification",
                      "Proactive — anticipates before you notice, resolves before you ask",
                      "Available on the same day for urgent matters, always within two hours otherwise",
                      "Long-term relationships over transactions — she is in this for the duration",
                    ].map((item) => (
                      <div key={item} className="flex items-start gap-3">
                        <span style={{ color: "var(--color-gold)", marginTop: "0.15rem" }}>—</span>
                        <p className="text-[13px] font-light leading-relaxed" style={{ color: "var(--color-ink-600)" }}>{item}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4 p-6" style={{ border: "1px solid var(--color-stone-200)" }}>
                  <p className="text-[10px] font-medium tracking-[0.3em] uppercase mb-4" style={{ color: "var(--color-stone-400)" }}>
                    Background
                  </p>
                  <div className="space-y-2.5">
                    {[
                      { label: "Experience", value: "12+ years in UHNW residential operations" },
                      { label: "Geographies", value: "UK, Europe, USA, Middle East" },
                      { label: "Portfolio", value: "Multiple simultaneous residences, up to 6" },
                      { label: "Languages", value: "English, Spanish, conversational French" },
                    ].map((item) => (
                      <div key={item.label} className="flex items-start justify-between gap-4">
                        <span className="text-[11px] font-light" style={{ color: "var(--color-stone-500)" }}>{item.label}</span>
                        <span className="text-[11px] font-light text-right" style={{ color: "var(--color-ink-700)" }}>{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        <section className="py-20 lg:py-24" style={{ background: "var(--color-stone-50)", borderBottom: "1px solid var(--color-stone-200)" }}>
          <div className="max-w-5xl mx-auto px-6 lg:px-12">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <p className="text-[11px] font-medium tracking-[0.35em] uppercase mb-8" style={{ color: "var(--color-gold)" }}>
                Areas of expertise
              </p>
              <div className="space-y-px" style={{ borderTop: "1px solid var(--color-stone-200)" }}>
                {EXPERIENCE.map((item, i) => (
                  <motion.div
                    key={item.area}
                    initial={{ opacity: 0, x: -8 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: i * 0.06 }}
                    className="grid grid-cols-1 md:grid-cols-3 gap-4 py-6"
                    style={{ borderBottom: "1px solid var(--color-stone-200)" }}
                  >
                    <div>
                      <p className="text-[13px] font-medium" style={{ color: "var(--color-ink-900)" }}>{item.area}</p>
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-[13px] font-light leading-relaxed" style={{ color: "var(--color-ink-600)" }}>{item.detail}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        <section className="py-20 lg:py-24" style={{ borderBottom: "1px solid var(--color-stone-200)" }}>
          <div className="max-w-5xl mx-auto px-6 lg:px-12">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <p className="text-[11px] font-medium tracking-[0.35em] uppercase mb-8" style={{ color: "var(--color-gold)" }}>
                How she operates
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px" style={{ background: "var(--color-stone-200)" }}>
                {QUALITIES.map((q, i) => (
                  <motion.div
                    key={q.title}
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.45, delay: i * 0.07 }}
                    className="p-7"
                    style={{ background: "var(--color-cream-warm)" }}
                  >
                    <h3 className="font-serif text-base font-light mb-2" style={{ color: "var(--color-ink-900)" }}>{q.title}</h3>
                    <p className="text-[13px] font-light leading-relaxed" style={{ color: "var(--color-ink-500)" }}>{q.desc}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        <section className="py-20 lg:py-24" style={{ background: "var(--color-stone-50)", borderBottom: "1px solid var(--color-stone-200)" }}>
          <div className="max-w-5xl mx-auto px-6 lg:px-12">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <p className="text-[11px] font-medium tracking-[0.35em] uppercase mb-10" style={{ color: "var(--color-gold)" }}>
                Her philosophy
              </p>
              <div className="space-y-8 max-w-3xl">
                {PHILOSOPHY.map((text, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: i * 0.08 }}
                    className="flex items-start gap-6"
                  >
                    <span
                      className="font-serif text-2xl font-light shrink-0"
                      style={{ color: "var(--color-stone-300)", letterSpacing: "-0.02em", marginTop: "-0.1rem" }}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <p className="text-[14px] font-light leading-relaxed" style={{ color: "var(--color-ink-600)" }}>
                      {text}
                    </p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        <section className="py-16 lg:py-20">
          <div className="max-w-5xl mx-auto px-6 lg:px-12 text-center">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <p className="font-serif text-xl font-light mb-3" style={{ color: "var(--color-ink-800)", fontStyle: "italic" }}>
                "The standard is not what's expected. It's what's deserved."
              </p>
              <p className="text-xs tracking-wide mb-8 mt-4" style={{ color: "var(--color-stone-400)" }}>
                Carlota Jo accepts a limited number of new clients each year. All enquiries handled with complete confidentiality.
              </p>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2.5 px-8 py-4 text-[13px] font-medium tracking-[0.08em] transition-colors"
                style={{ color: "var(--color-cream)", background: "var(--color-gold)" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--color-gold-light)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--color-gold)"; }}
              >
                Begin a Conversation
              </Link>
            </motion.div>
          </div>
        </section>
      </div>
      <Footer />
    </div>
  );
}
