import { motion } from "framer-motion";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Link } from "wouter";

const CLIENT_PROFILES = [
  {
    title: "High-Net-Worth Families",
    desc: "Families with complex household environments, multiple residences, and operational demands that exceed what a single member of staff can manage — who need a trusted coordinator holding the full picture.",
    indicators: [
      "Multiple primary and secondary residences",
      "Household staff across one or more properties",
      "Seasonal and transitional operational requirements",
      "Demand for confidentiality across all household matters",
    ],
  },
  {
    title: "Private Residences",
    desc: "Estate environments — whether primary homes, country houses, or private compounds — that require a dedicated operational lead who can set and maintain the standard year-round, with or without the principal present.",
    indicators: [
      "Estate-scale properties with operational complexity",
      "Extensive vendor and contractor relationships",
      "Year-round maintenance and oversight requirements",
      "High standards that require active, not passive, management",
    ],
  },
  {
    title: "Principals",
    desc: "Individuals at the centre of complex personal and professional lives who need someone they can trust completely to manage the residential and operational layer — freeing them to focus on what matters.",
    indicators: [
      "Demanding schedules and limited personal bandwidth",
      "High standards with zero tolerance for operational failure",
      "Preference for a single trusted point of contact",
      "Absolute requirement for discretion",
    ],
  },
  {
    title: "Estate Environments",
    desc: "Managed estate properties — including family offices with residential components, charitable estates, and managed trust properties — that require professional, discreet operational oversight.",
    indicators: [
      "Formal property management structures",
      "Multiple stakeholders with varying requirements",
      "Long-term operational continuity requirements",
      "Regulatory and compliance considerations",
    ],
  },
  {
    title: "Clients Seeking Discreet High-Touch Support",
    desc: "Individuals who have worked with traditional property managers, household agencies, or lifestyle services — and found the level of personalisation, discretion, and quality did not match their expectations.",
    indicators: [
      "Have experienced gaps in household or property management",
      "Require a level of service that can't be templated",
      "Value long-term relationships over transactional services",
      "Understand the value of getting this right",
    ],
  },
];

const NOT_FOR = [
  "Standard property management for commercially let properties",
  "Short-term or project-only arrangements without ongoing context",
  "Clients who prefer managing vendors and operations directly",
  "Environments where cost is the primary decision factor",
];

export default function WhoWeServePage() {
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
                Who We Serve
              </p>
              <h1 className="font-serif font-light leading-[1.1] mb-6" style={{ fontSize: "clamp(2rem, 4vw, 3rem)", color: "var(--color-ink-900)" }}>
                A small number of clients.
                <br />
                <span style={{ fontStyle: "italic" }}>An uncompromising standard.</span>
              </h1>
              <p className="text-base font-light leading-relaxed mb-5" style={{ color: "var(--color-ink-600)" }}>
                Carlota Jo works with a deliberately limited client base. This is not a constraint — it is the model. Rosa cannot provide the level of engagement, attention, and discretion she is known for at scale, and she does not try.
              </p>
              <p className="text-sm font-light leading-relaxed" style={{ color: "var(--color-ink-500)" }}>
                Every client relationship is established through direct enquiry and a genuine conversation about fit. If the environment is right, the relationship tends to be long-term.
              </p>
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
              className="mb-12"
            >
              <p className="text-[11px] font-medium tracking-[0.35em] uppercase mb-3" style={{ color: "var(--color-gold)" }}>
                Client profiles
              </p>
              <h2 className="font-serif text-3xl font-light" style={{ color: "var(--color-ink-900)" }}>
                Environments we understand
              </h2>
            </motion.div>

            <div className="space-y-px" style={{ borderTop: "1px solid var(--color-stone-200)" }}>
              {CLIENT_PROFILES.map((profile, i) => (
                <motion.div
                  key={profile.title}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.45, delay: i * 0.07 }}
                  className="py-8 grid grid-cols-1 md:grid-cols-12 gap-6"
                  style={{ borderBottom: "1px solid var(--color-stone-200)" }}
                >
                  <div className="md:col-span-4">
                    <h3 className="font-serif text-lg font-light mb-2" style={{ color: "var(--color-ink-900)" }}>
                      {profile.title}
                    </h3>
                    <p className="text-[13px] font-light leading-relaxed" style={{ color: "var(--color-ink-600)" }}>
                      {profile.desc}
                    </p>
                  </div>
                  <div className="md:col-span-8 md:pl-8">
                    <p className="text-[10px] font-medium tracking-[0.25em] uppercase mb-4" style={{ color: "var(--color-stone-400)" }}>
                      This typically includes
                    </p>
                    <ul className="space-y-2.5">
                      {profile.indicators.map((ind) => (
                        <li key={ind} className="flex items-start gap-3">
                          <span style={{ color: "var(--color-gold)", marginTop: "0.1rem" }}>—</span>
                          <span className="text-[13px] font-light" style={{ color: "var(--color-ink-600)" }}>{ind}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              ))}
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
            >
              <p className="text-[11px] font-medium tracking-[0.35em] uppercase mb-6" style={{ color: "var(--color-gold)" }}>
                Honest clarity
              </p>
              <h2 className="font-serif text-2xl font-light mb-8" style={{ color: "var(--color-ink-900)" }}>
                This is not the right fit for everyone
              </h2>
              <p className="text-sm font-light leading-relaxed mb-8 max-w-xl" style={{ color: "var(--color-ink-600)" }}>
                Rosa's model works because she takes on the right clients — not the most clients. There are environments and expectations that Carlota Jo is not the right answer for, and she'd rather be honest about that from the start.
              </p>
              <ul className="space-y-3">
                {NOT_FOR.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="text-[13px] font-light" style={{ color: "var(--color-stone-400)" }}>×</span>
                    <span className="text-[13px] font-light" style={{ color: "var(--color-ink-500)" }}>{item}</span>
                  </li>
                ))}
              </ul>
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
              <h2 className="font-serif text-2xl font-light mb-4" style={{ color: "var(--color-ink-900)" }}>
                Ready to speak with Rosa?
              </h2>
              <p className="text-sm font-light mb-8" style={{ color: "var(--color-ink-500)" }}>
                All conversations are handled with complete confidentiality.
              </p>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2.5 px-8 py-4 text-[13px] font-medium tracking-[0.08em] transition-colors"
                style={{ color: "var(--color-cream)", background: "var(--color-gold)" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--color-gold-light)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--color-gold)"; }}
              >
                Request a Confidential Consultation
              </Link>
            </motion.div>
          </div>
        </section>
      </div>
      <Footer />
    </div>
  );
}
