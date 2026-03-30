import { motion } from "framer-motion";

const beliefs = [
  { label: "Systems thinking", text: "Every product is a system. Design the interfaces, incentives, and failure modes before writing a line of code." },
  { label: "Speed through clarity", text: "The fastest teams have the clearest mental models. Ambiguity is the hidden cost no one budgets for." },
  { label: "Small sharp teams", text: "I've seen 4-person teams outship 40-person departments. Headcount is not leverage — judgment is." },
  { label: "Own the stack", text: "Understanding every layer — from database index to UI state — is the difference between building fast and building right." },
];

export function AboutSection() {
  return (
    <section id="about" className="py-24 lg:py-32 bg-[#080c11] border-t border-white/5">
      <div className="max-w-6xl mx-auto px-6 lg:px-12">
        <div className="grid lg:grid-cols-12 gap-16 lg:gap-20">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-5"
          >
            <p className="text-[11px] font-medium tracking-[0.3em] uppercase text-[#7ba3d4]/60 mb-6">
              Background
            </p>
            <h2 className="text-4xl md:text-5xl font-semibold text-white leading-tight tracking-tight mb-7">
              Builder,
              <br />
              <span className="text-white/45 font-normal">not just architect.</span>
            </h2>
            <p className="text-white/50 text-base font-light leading-relaxed mb-5">
              I started writing production code at 17. Since then I've shipped enterprise
              infrastructure, founded two venture-backed companies, and built teams across
              fintech, maritime, and AI.
            </p>
            <p className="text-white/45 text-base font-light leading-relaxed">
              Today I lead SZL Holdings — a multi-venture holding company building the next
              generation of intelligence infrastructure across five product lanes.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-7"
          >
            <p className="text-[11px] font-medium tracking-[0.3em] uppercase text-[#7ba3d4]/60 mb-6">
              How I think
            </p>
            <div className="space-y-px bg-white/5">
              {beliefs.map((b, i) => (
                <motion.div
                  key={b.label}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.5, delay: i * 0.07 }}
                  className="bg-[#080c11] hover:bg-[#0d1219] transition-colors duration-300 p-6"
                >
                  <p className="text-[13px] font-semibold text-[#a0c0e8] mb-1.5 tracking-tight">{b.label}</p>
                  <p className="text-[13.5px] text-white/40 font-light leading-relaxed">{b.text}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
