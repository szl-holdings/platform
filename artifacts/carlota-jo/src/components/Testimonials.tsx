import { motion } from "framer-motion";

const trustIndicators = [
  {
    headline: "Discretion by design",
    body: "Client engagements are never disclosed. Names, industries, and arrangements remain strictly confidential — by policy, not exception.",
  },
  {
    headline: "Retained relationships",
    body: "Clients who engage Carlota Jo return. The work compounds over time because the trust built in one engagement carries forward to the next.",
  },
  {
    headline: "No case studies. No references. By design.",
    body: "High-trust principals require a firm that treats privacy as a service, not a legal obligation. We do not trade client outcomes for credibility.",
  },
];

export default function Testimonials() {
  return (
    <section id="trust" className="py-24 lg:py-40 bg-stone-50 border-t border-stone-200">
      <div className="max-w-7xl mx-auto px-6 lg:px-16">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="mb-20 lg:mb-28"
        >
          <p className="text-[11px] font-medium tracking-[0.35em] uppercase text-warm-gold mb-6">
            How We Operate
          </p>
          <h2 className="font-serif text-4xl md:text-5xl font-light text-ink-900">
            Trust is the product
          </h2>
        </motion.div>

        <div className="space-y-px bg-stone-200">
          {trustIndicators.map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="bg-stone-50 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-16 px-8 lg:px-12 py-12"
            >
              <div className="lg:col-span-4">
                <p className="text-sm font-medium text-ink-900 tracking-wide">
                  {item.headline}
                </p>
              </div>
              <div className="lg:col-span-8">
                <p className="font-serif text-xl lg:text-2xl font-light text-ink-900 leading-relaxed">
                  {item.body}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
