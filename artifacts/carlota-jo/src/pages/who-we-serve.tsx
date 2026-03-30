import { motion } from "framer-motion";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Link } from "wouter";

const CLIENT_PROFILES = [
  {
    title: "High-Net-Worth Families",
    desc: "Multiple residences, complex operations, absolute confidentiality.",
    indicators: [
      "Multiple primary and secondary residences",
      "Household staff across properties",
      "Seasonal and transitional requirements",
    ],
  },
  {
    title: "Private Residences",
    desc: "Estate-scale environments requiring dedicated operational oversight.",
    indicators: [
      "Extensive vendor and contractor networks",
      "Year-round maintenance and standards",
      "Active management, not passive oversight",
    ],
  },
  {
    title: "Principals",
    desc: "Individuals with complex lives who need one trusted point of contact.",
    indicators: [
      "Demanding schedules, limited bandwidth",
      "Zero tolerance for operational gaps",
      "Absolute requirement for discretion",
    ],
  },
  {
    title: "Estate Environments",
    desc: "Managed properties requiring professional, discreet operational oversight.",
    indicators: [
      "Formal management structures",
      "Multiple stakeholders",
      "Long-term continuity requirements",
    ],
  },
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
              <p className="text-base font-light leading-relaxed" style={{ color: "var(--color-ink-600)" }}>
                Carlota Jo works with a deliberately limited client base. Every relationship begins with a genuine conversation about fit.
              </p>
            </motion.div>
          </div>
        </section>

        <section className="py-20 lg:py-24" style={{ borderBottom: "1px solid var(--color-stone-200)" }}>
          <div className="max-w-5xl mx-auto px-6 lg:px-12">
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
