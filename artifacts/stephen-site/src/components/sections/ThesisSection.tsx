import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

const frameworks = [
  {
    number: "01",
    tag: "Observability",
    title: "Business observability as an operating layer",
    text: "A company's ability to see itself clearly is a structural advantage, not a reporting function. Visibility into workflow state, ownership gaps, and execution latency should be designed in — not bolted on after problems compound.",
    metric: "Applied across: Lyte, Alloy",
  },
  {
    number: "02",
    tag: "Architecture",
    title: "Compound infrastructure as compounding moat",
    text: "Every shared layer — auth, design system, observability, data pipelines — reduces the marginal cost of building the next product. Structural compounding means the 8th platform costs a fraction of the 1st.",
    metric: "Applied across: SZL ecosystem",
  },
  {
    number: "03",
    tag: "Execution",
    title: "Precision over throughput in high-stakes domains",
    text: "In maritime, cybersecurity, and AI operations, the cost of a wrong decision vastly exceeds the cost of a slow one. Systems in these domains should be built for correctness, auditability, and clear decision authority.",
    metric: "Applied across: Vessels, Aegis, INCA",
  },
  {
    number: "04",
    tag: "Systems Design",
    title: "Command-centered product architecture",
    text: "The best tools don't just display information — they surface the right decision at the right moment, to the right person, with the right context. That's the command metaphor: observation to action, with governance at every step.",
    metric: "Across all 10 platforms",
  },
];

const operatingPrinciples = [
  "Ship working systems before documenting them",
  "Observability is a product requirement, not an afterthought",
  "Ownership without accountability is just assignment",
  "Simplicity in interface, complexity in infrastructure",
  "Every platform should be able to explain itself",
  "Compounding structural advantage over quarterly metrics",
];

export function ThesisSection() {
  return (
    <section id="thesis" className="py-24 lg:py-32 bg-[#0a0e14] border-t border-white/5">
      <div className="max-w-6xl mx-auto px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          className="mb-14"
        >
          <p className="text-[11px] font-medium tracking-[0.3em] uppercase text-[#7ba3d4]/60 mb-4">
            Thesis & Frameworks
          </p>
          <div className="grid lg:grid-cols-12 gap-8">
            <div className="lg:col-span-7">
              <h2 className="text-4xl md:text-5xl font-semibold text-white leading-tight tracking-tight mb-5">
                How I think about systems.
              </h2>
              <p className="text-white/45 text-base font-light leading-relaxed">
                Four frameworks that shape how I build, what I prioritize, and why the SZL ecosystem is structured the way it is.
              </p>
            </div>
          </div>
        </motion.div>

        <div className="space-y-px bg-white/5 mb-16">
          {frameworks.map((fw, i) => (
            <motion.div
              key={fw.number}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] }}
              className="group bg-[#0a0e14] hover:bg-[#0e1520] transition-colors duration-300 p-8 lg:p-10"
            >
              <div className="grid lg:grid-cols-12 gap-8 items-start">
                <div className="lg:col-span-1">
                  <span className="text-[10px] font-mono font-bold text-[#7ba3d4]/40">{fw.number}</span>
                </div>
                <div className="lg:col-span-4">
                  <p className="text-[10px] font-medium tracking-[0.25em] uppercase text-[#7ba3d4]/45 mb-2">{fw.tag}</p>
                  <h3 className="text-lg font-semibold text-white tracking-tight leading-snug">{fw.title}</h3>
                </div>
                <div className="lg:col-span-5">
                  <p className="text-white/40 text-[14px] font-light leading-relaxed mb-3">{fw.text}</p>
                  <span className="text-[10px] font-mono text-[#7ba3d4]/30 tracking-wide">{fw.metric}</span>
                </div>
                <div className="lg:col-span-2 flex justify-end">
                  <ArrowRight size={14} className="text-white/10 group-hover:text-[#7ba3d4]/40 transition-colors duration-300 mt-1" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="grid lg:grid-cols-12 gap-12">
            <div className="lg:col-span-5">
              <p className="text-[11px] font-medium tracking-[0.3em] uppercase text-[#7ba3d4]/60 mb-4">
                Operating Principles
              </p>
              <h3 className="text-2xl font-semibold text-white leading-tight tracking-tight mb-6">
                The short version.
              </h3>
              <p className="text-white/40 text-sm font-light leading-relaxed">
                Principles I actually operate by, derived from building and running production systems across complex domains.
              </p>
            </div>
            <div className="lg:col-span-7">
              <div className="grid sm:grid-cols-2 gap-3">
                {operatingPrinciples.map((principle, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-40px" }}
                    transition={{ duration: 0.45, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
                    className="flex items-start gap-3 p-4 bg-white/[0.025] border border-white/5 hover:border-white/10 hover:bg-white/[0.04] transition-all duration-300"
                  >
                    <div className="w-1 h-1 rounded-full bg-[#7ba3d4]/40 mt-2 shrink-0" />
                    <p className="text-white/55 text-[13px] font-light leading-snug">{principle}</p>
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
