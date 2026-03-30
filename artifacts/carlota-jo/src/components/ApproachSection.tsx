import { motion } from "framer-motion";

const trustPoints = [
  "Tailored to each principal's priorities",
  "Absolute discretion, always",
  "Single point of contact",
  "Premium coordination and communication",
  "Calm execution under complexity",
];

export default function ApproachSection() {
  return (
    <>
      <section className="py-24 lg:py-32 bg-cream border-t border-stone-200">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-start">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <p className="cj-eyebrow mb-5">Approach</p>
              <h2 className="font-serif text-4xl md:text-5xl font-light text-ink-900 leading-tight mb-8">
                A calmer standard
                <br />
                of support.
              </h2>
              <p className="text-sm text-ink-500 font-light leading-relaxed">
                Thoughtful coordination and the belief that premium support should feel seamless and invisible. The emphasis is on precision, trust, and execution without noise.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.15 }}
            >
              <p className="cj-eyebrow mb-5">Standards</p>
              <h3 className="font-serif text-2xl font-light text-ink-900 mb-8">
                Built on trust, delivered with care.
              </h3>
              <ul className="space-y-4">
                {trustPoints.map((point, i) => (
                  <li key={i} className="flex items-start gap-4 text-sm text-ink-500 font-light">
                    <span className="text-gold mt-0.5 shrink-0">—</span>
                    {point}
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-24 lg:py-32 border-t border-stone-200 bg-stone-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <p className="cj-eyebrow mb-5">The Practice</p>
              <h2 className="font-serif text-4xl md:text-5xl font-light text-ink-900 leading-tight mb-8">
                Founder-led,
                <br />
                client-centered.
              </h2>
              <p className="text-sm text-ink-500 font-light leading-relaxed">
                Shaped by real-world service experience and a commitment to calm, precise execution. Designed for principals who expect more.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-24 lg:py-32 border-t border-stone-200 bg-cream-deep">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <h2 className="font-serif text-4xl md:text-5xl font-light text-ink-900 leading-tight mb-6">
              Tailored support,
              <br />
              delivered with intention.
            </h2>
            <p className="text-sm text-ink-500 font-light leading-relaxed max-w-sm mx-auto mb-10">
              For clients who value discretion, trust, and a refined service standard.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => document.querySelector("#inquire")?.scrollIntoView({ behavior: "smooth" })}
                className="cj-btn-primary"
              >
                Inquire privately
              </button>
              <button
                onClick={() => document.querySelector("#services")?.scrollIntoView({ behavior: "smooth" })}
                className="cj-btn-secondary"
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
