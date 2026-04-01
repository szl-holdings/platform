import { motion } from "framer-motion";

const testimonials = [
  {
    text: "A rare combination of strategic depth and practical execution. The engagement reshaped how our board thinks about capital allocation.",
    attribution: "Group Chairman, FTSE 250 Industrial",
    country: "United Kingdom",
  },
  {
    text: "Carlota Jo operated with the discretion and rigour we needed for a sensitive restructuring process. Exactly what the situation required.",
    attribution: "Managing Partner, European Private Equity",
    country: "Germany",
  },
  {
    text: "The diagnosis was clear, the options were honest, and the advice was senior. That's what we engaged for, and that's what we received.",
    attribution: "Chief Executive, Global Infrastructure Group",
    country: "Netherlands",
  },
  {
    text: "Three board meetings in, we had more clarity on our strategic position than in the previous three years. The work was substantive and the process was seamless.",
    attribution: "Founder & CEO, Technology Holdings Group",
    country: "United States",
  },
  {
    text: "What distinguished the engagement was the absence of hedging. Senior advice, direct recommendations, no committee politics. Exactly what a private company needs.",
    attribution: "Principal, Family Office",
    country: "Switzerland",
  },
  {
    text: "The cross-border complexity of our situation required someone who understood both the capital markets context and the regulatory environment. Carlota Jo delivered both.",
    attribution: "CFO, Listed Financial Services Group",
    country: "Singapore",
  },
];

const socialProofMetrics = [
  { value: "14+", label: "Countries served" },
  { value: "94%", label: "Clients engage on subsequent mandates" },
  { value: "100%", label: "Principal-led. Always." },
  { value: "0", label: "Engagements disclosed without consent" },
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
          <h2
            className="font-light leading-tight"
            style={{ fontFamily: "Georgia, 'Palatino Linotype', serif", fontSize: "clamp(1.75rem, 3vw, 2.5rem)", color: "#f5f0e8" }}
          >
            Trusted by principals across<br />
            <span style={{ fontStyle: "italic" }}>four continents</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-[#f5f0e8]/6 mb-20">
          {socialProofMetrics.map((m, i) => (
            <motion.div
              key={m.label}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.07 }}
              className="px-6 py-8 bg-[#06080c]"
            >
              <p className="text-3xl font-light text-[#c8a96a] mb-2" style={{ fontFamily: "Georgia, serif" }}>{m.value}</p>
              <p className="text-[11px] tracking-[0.12em] uppercase text-[#f5f0e8]/35 font-medium">{m.label}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.65, delay: (i % 3) * 0.1 }}
              className="border-t border-[#f5f0e8]/10 pt-7"
            >
              <p
                className="text-[#f5f0e8]/70 text-base font-light leading-relaxed mb-6"
                style={{ fontFamily: "Georgia, 'Palatino Linotype', serif" }}
              >
                "{t.text}"
              </p>
              <div>
                <p className="text-[11px] tracking-[0.12em] uppercase text-[#f5f0e8]/30 font-medium mb-0.5">
                  {t.attribution}
                </p>
                <p className="text-[10px] tracking-[0.08em] text-[#c8a96a]/40">{t.country}</p>
              </div>
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
