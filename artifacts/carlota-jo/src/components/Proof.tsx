import { motion } from "framer-motion";

const testimonials = [
  {
    text: "A rare combination of strategic depth and practical execution. The engagement reshaped how our board thinks about capital allocation.",
    attribution: "Group Chairman, FTSE 250 Industrial",
  },
  {
    text: "Carlota Jo operated with the discretion and rigour we needed for a sensitive restructuring process. Exactly what the situation required.",
    attribution: "Managing Partner, European Private Equity",
  },
  {
    text: "The diagnosis was clear, the options were honest, and the advice was senior. That's what we engaged for, and that's what we received.",
    attribution: "Chief Executive, Global Infrastructure Group",
  },
];

const qualities = [
  { label: "Principal-led", description: "Every engagement led by the founding advisor — not delegated to junior staff." },
  { label: "Confidential", description: "Strict confidentiality across all engagements, clients, and sensitive matters." },
  { label: "Selective", description: "We work with a small number of clients at any time to preserve depth of engagement." },
  { label: "Independent", description: "No conflicts of interest. Advice that serves only the client's interests." },
];

export default function Proof() {
  return (
    <section id="proof" className="py-24 lg:py-32 bg-[#06080c] border-t border-[#f5f0e8]/5">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.65 }}
          className="mb-16"
        >
          <p className="text-[11px] font-medium tracking-[0.35em] uppercase text-[#c8a96a]/70 mb-4">
            Client perspectives
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 mb-20">
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.65, delay: i * 0.1 }}
              className="border-t border-[#f5f0e8]/10 pt-7"
            >
              <p
                className="text-[#f5f0e8]/70 text-base font-light leading-relaxed mb-6"
                style={{ fontFamily: "Georgia, 'Palatino Linotype', serif" }}
              >
                "{t.text}"
              </p>
              <p className="text-[11px] tracking-[0.12em] uppercase text-[#f5f0e8]/30 font-medium">
                {t.attribution}
              </p>
            </motion.div>
          ))}
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-px bg-[#f5f0e8]/5">
          {qualities.map((q, i) => (
            <motion.div
              key={q.label}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6, delay: i * 0.07 }}
              className="bg-[#06080c] px-6 py-7"
            >
              <p className="text-[#c8a96a]/80 text-[13px] font-medium mb-2">{q.label}</p>
              <p className="text-[#f5f0e8]/40 text-[13px] font-light leading-relaxed">{q.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
