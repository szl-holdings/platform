import { motion } from "framer-motion";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Link } from "wouter";

export default function AboutPage() {
  return (
    <div className="min-h-screen" style={{ background: "var(--color-cream-warm)" }}>
      <Header />
      <div className="pt-24">
        <section className="py-16 lg:py-24" style={{ borderBottom: "1px solid var(--color-stone-200)" }}>
          <div className="max-w-3xl mx-auto px-6 lg:px-12">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
            >
              <p className="text-[11px] font-medium tracking-[0.35em] uppercase mb-6" style={{ color: "var(--color-gold)" }}>
                About
              </p>
              <h1 className="font-serif font-light leading-[1.1] mb-8" style={{ fontSize: "clamp(2rem, 4vw, 3rem)", color: "var(--color-ink-900)" }}>
                A different kind of residential advisory practice
              </h1>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="space-y-6 mb-14"
            >
              <p className="text-[14.5px] font-light leading-loose" style={{ color: "var(--color-ink-600)" }}>
                Carlota Jo Consulting was founded by Rosa Lutar to provide a level of private residential and operational support that simply was not available through traditional channels — estate agencies, household staffing firms, or lifestyle management services.
              </p>
              <p className="text-[14.5px] font-light leading-loose" style={{ color: "var(--color-ink-600)" }}>
                The principals Rosa works with don't need more vendors in their life. They need one trusted operator who understands their environment completely, holds everything that needs to be held, and operates with the discretion their situation demands.
              </p>
              <p className="text-[14.5px] font-light leading-loose" style={{ color: "var(--color-ink-600)" }}>
                Carlota Jo is a small practice by design. Every client receives Rosa's direct attention — not delegation to a coordinator who briefs her before calls. This model limits how many clients she can serve, and that is precisely the point.
              </p>
              <p className="text-[14.5px] font-light leading-loose" style={{ color: "var(--color-ink-600)" }}>
                Carlota Jo Consulting operates as a premium service brand under SZL Holdings — a strategic technology and services portfolio. The advisory practice is operationally independent, with absolute confidentiality and discretion as its foundational commitments.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="py-10"
              style={{ borderTop: "1px solid var(--color-stone-200)", borderBottom: "1px solid var(--color-stone-200)" }}
            >
              <h2 className="font-serif text-xl font-light mb-6" style={{ color: "var(--color-ink-900)" }}>
                What Carlota Jo is not
              </h2>
              <ul className="space-y-3">
                {[
                  "A traditional property management firm",
                  "A household staffing agency",
                  "A lifestyle concierge service with rotating account managers",
                  "Available for short-term projects without operational context",
                  "Structured around scale or volume — the model requires depth",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="w-1 h-1 rounded-full mt-2.5 shrink-0" style={{ background: "var(--color-stone-300)" }} />
                    <span className="text-[13.5px] font-light" style={{ color: "var(--color-ink-500)" }}>{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="p-8 mt-10"
              style={{ background: "var(--color-stone-50)", border: "1px solid var(--color-stone-200)" }}
            >
              <h3 className="font-serif text-[18px] font-light mb-3" style={{ color: "var(--color-ink-900)" }}>
                Request a confidential consultation
              </h3>
              <p className="text-[13px] font-light mb-5 leading-relaxed" style={{ color: "var(--color-ink-500)" }}>
                Rosa responds to substantive enquiries from principals, family offices, and trusted referrals within two business days.
              </p>
              <Link
                href="/contact"
                className="inline-block px-6 py-2.5 text-[12px] font-medium tracking-[0.08em] transition-colors"
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
