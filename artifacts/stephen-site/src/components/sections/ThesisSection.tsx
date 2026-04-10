import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const frameworks = [
  {
    number: "01",
    tag: "Observability",
    title: "Business observability as an operating layer",
    quote: "A company's ability to see itself clearly is a structural advantage, not a reporting function.",
    text: "Visibility into workflow state, ownership gaps, and execution latency should be designed in — not bolted on after problems compound. Every platform in the SZL ecosystem embeds observability as a first-class product requirement.",
    color: "#00D4FF",
  },
  {
    number: "02",
    tag: "Architecture",
    title: "Compound infrastructure as compounding moat",
    quote: "The 7th platform costs a fraction of the 1st.",
    text: "Every shared layer — auth, design system, observability, data pipelines — reduces the marginal cost of building the next product. Structural compounding means each new vertical inherits years of infrastructure investment on day one.",
    color: "#6366F1",
  },
  {
    number: "03",
    tag: "Execution",
    title: "Precision over throughput in high-stakes domains",
    quote: "The cost of a wrong decision vastly exceeds the cost of a slow one.",
    text: "In maritime, cybersecurity, and legal operations, systems must be built for correctness, auditability, and clear decision authority. AI cannot execute without human confirmation. Every recommendation includes citations and confidence scores.",
    color: "#22C55E",
  },
  {
    number: "04",
    tag: "Systems Design",
    title: "Command-centered product architecture",
    quote: "The best tools don't just display information — they surface the right decision at the right moment.",
    text: "Observation to action, with governance at every step. That's the command metaphor: every platform surfaces decisions to the right person, with the right context, and a full audit trail of what happened next.",
    color: "#F59E0B",
  },
];

const operatingPrinciples = [
  { text: "Ship working systems before documenting them", color: "#22C55E" },
  { text: "Observability is a product requirement, not an afterthought", color: "#00D4FF" },
  { text: "Ownership without accountability is just assignment", color: "#6366F1" },
  { text: "Simplicity in interface, complexity in infrastructure", color: "#F59E0B" },
  { text: "Every platform should be able to explain itself", color: "#D4A054" },
  { text: "Failures surface immediately. They never hide.", color: "#EF4444" },
];

export function ThesisSection() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="thesis" className="py-24 lg:py-32 bg-[#080b12] border-t border-white/5">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12" ref={ref}>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="mb-16"
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-[2px]" style={{ background: "linear-gradient(90deg, #F59E0B, transparent)" }} />
            <span className="text-[11px] font-bold tracking-[0.25em] uppercase" style={{ color: "rgba(245,158,11,0.6)" }}>
              Operating Thesis
            </span>
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black leading-tight tracking-tight mb-5" style={{ color: "rgba(255,255,255,0.95)" }}>
            How I think about<br />
            <span style={{ color: "rgba(255,255,255,0.3)" }}>building systems.</span>
          </h2>
        </motion.div>

        <div className="space-y-4 mb-20">
          {frameworks.map((fw, i) => (
            <motion.div
              key={fw.number}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.15 + i * 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="group relative p-8 lg:p-10 transition-all duration-300"
              style={{
                background: "rgba(12,16,24,0.8)",
                border: "1px solid rgba(255,255,255,0.05)",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = `${fw.color}25`; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.05)"; }}
            >
              <div className="absolute left-0 top-0 bottom-0 w-[3px] transition-all duration-300" style={{ background: `${fw.color}40` }} />

              <div className="grid lg:grid-cols-12 gap-8 items-start">
                <div className="lg:col-span-1">
                  <span className="text-[12px] font-bold" style={{ color: `${fw.color}60`, fontFamily: "'JetBrains Mono', monospace" }}>
                    {fw.number}
                  </span>
                </div>
                <div className="lg:col-span-4">
                  <span className="text-[9px] font-bold tracking-[0.25em] uppercase block mb-2" style={{ color: `${fw.color}80` }}>
                    {fw.tag}
                  </span>
                  <h3 className="text-xl lg:text-2xl font-bold leading-snug tracking-tight" style={{ color: "rgba(255,255,255,0.9)" }}>
                    {fw.title}
                  </h3>
                </div>
                <div className="lg:col-span-7">
                  <blockquote className="text-lg lg:text-xl font-light italic leading-relaxed mb-4 pl-4" style={{ color: `${fw.color}CC`, borderLeft: `2px solid ${fw.color}40` }}>
                    "{fw.quote}"
                  </blockquote>
                  <p className="text-[14px] font-light leading-relaxed" style={{ color: "rgba(255,255,255,0.35)" }}>
                    {fw.text}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.6 }}
        >
          <div className="grid lg:grid-cols-12 gap-12">
            <div className="lg:col-span-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-[2px]" style={{ background: "linear-gradient(90deg, #94A3B8, transparent)" }} />
                <span className="text-[11px] font-bold tracking-[0.25em] uppercase" style={{ color: "rgba(148,163,184,0.5)" }}>
                  Principles
                </span>
              </div>
              <h3 className="text-2xl lg:text-3xl font-black leading-tight tracking-tight mb-4" style={{ color: "rgba(255,255,255,0.9)" }}>
                The short version.
              </h3>
              <p className="text-sm font-light leading-relaxed" style={{ color: "rgba(255,255,255,0.35)" }}>
                Principles derived from building and running production systems across complex, high-stakes domains.
              </p>
            </div>
            <div className="lg:col-span-8">
              <div className="grid sm:grid-cols-2 gap-3">
                {operatingPrinciples.map((principle, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 12 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.4, delay: 0.7 + i * 0.06 }}
                    className="flex items-start gap-3 p-5 transition-all duration-300"
                    style={{
                      background: "rgba(255,255,255,0.02)",
                      border: "1px solid rgba(255,255,255,0.05)",
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = `${principle.color}25`; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.05)"; }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: principle.color, boxShadow: `0 0 6px ${principle.color}40` }} />
                    <p className="text-[13px] font-medium leading-snug" style={{ color: "rgba(255,255,255,0.55)" }}>
                      {principle.text}
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
