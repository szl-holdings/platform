import { motion } from "framer-motion";

const trustPoints = [
  "Tailored service approach",
  "Discreet client experience",
  "Structured, high-touch support",
  "Premium communication and coordination",
  "Thoughtful execution across moving priorities",
];

export default function ApproachSection() {
  return (
    <>
      <section className="py-24 lg:py-32 bg-navy-950 border-t border-cream-200/5">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-start">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <p className="text-[11px] font-medium tracking-[0.35em] uppercase text-gold-400 mb-5">
                Approach
              </p>
              <h2 className="font-serif text-4xl md:text-5xl font-light text-cream-50 leading-tight mb-8">
                A calmer standard
                <br />
                of support.
              </h2>
              <p className="text-sm text-cream-200/65 font-light leading-relaxed">
                Carlota Jo is built around thoughtful service, tailored coordination, and the belief that premium support should feel seamless, discreet, and deeply reliable. The emphasis is on precision, trust, and execution without unnecessary noise.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.15 }}
            >
              <p className="text-[11px] font-medium tracking-[0.35em] uppercase text-gold-400 mb-5">
                Standards
              </p>
              <h3 className="font-serif text-2xl font-light text-cream-50 mb-8">
                Built on trust, delivered with care.
              </h3>
              <ul className="space-y-4">
                {trustPoints.map((point, i) => (
                  <li key={i} className="flex items-start gap-4 text-sm text-cream-200/65 font-light">
                    <span className="text-gold-500/50 mt-0.5 shrink-0">—</span>
                    {point}
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-24 lg:py-32 border-t border-cream-200/5" style={{ background: "rgb(6, 9, 20)" }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <p className="text-[11px] font-medium tracking-[0.35em] uppercase text-gold-400 mb-5">
                The Practice
              </p>
              <h2 className="font-serif text-4xl md:text-5xl font-light text-cream-50 leading-tight mb-8">
                Founder-led,
                <br />
                client-centered.
              </h2>
              <p className="text-sm text-cream-200/65 font-light leading-relaxed">
                Carlota Jo Consulting is shaped by real-world experience, strong service instincts, and a commitment to calm, thoughtful execution. The brand is designed to deliver a more tailored and discreet advisory experience for clients who expect a higher standard.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-24 lg:py-32 border-t border-cream-200/5 bg-navy-950">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <h2 className="font-serif text-4xl md:text-5xl font-light text-cream-50 leading-tight mb-6">
              Tailored support,
              <br />
              delivered with intention.
            </h2>
            <p className="text-sm text-cream-200/60 font-light leading-relaxed max-w-xl mx-auto mb-10">
              Carlota Jo Consulting is designed for clients who value discretion, trust, and a more refined service experience.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => document.querySelector("#inquire")?.scrollIntoView({ behavior: "smooth" })}
                className="px-8 py-3.5 font-serif text-sm tracking-wider text-navy-950 bg-gold-400 hover:bg-gold-300 transition-colors"
              >
                Inquire privately
              </button>
              <button
                onClick={() => document.querySelector("#services")?.scrollIntoView({ behavior: "smooth" })}
                className="px-8 py-3.5 border border-cream-200/20 text-cream-200/70 hover:text-cream-200 hover:border-cream-200/40 font-serif text-sm tracking-wider transition-all"
              >
                Review services
              </button>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
}
