import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

const capabilities = [
  {
    id: "systems-design",
    tag: "Technical architecture",
    title: "Systems design & architecture",
    text: "Full-stack architecture for scale: database design, API contracts, event-driven pipelines, caching strategy, and observability. From greenfield to legacy modernisation.",
  },
  {
    id: "ai-infra",
    tag: "AI / ML",
    title: "AI and ML infrastructure",
    text: "End-to-end ML systems: feature stores, training pipelines, model registries, inference serving, and monitoring for drift and performance degradation in production.",
  },
  {
    id: "team-building",
    tag: "Org design",
    title: "Engineering team building",
    text: "Hiring, structuring, and developing high-velocity engineering teams. I've built teams from 0 to 40+ across multiple time zones and technical disciplines.",
  },
  {
    id: "cto-advisory",
    tag: "Advisory",
    title: "Fractional CTO advisory",
    text: "Embedded technical leadership for early-stage companies that need senior judgment without a full-time commitment. Architecture decisions, hiring, vendor selection, and board communication.",
  },
];

export function ServicesSection() {
  return (
    <section id="capabilities" className="py-24 lg:py-32 bg-[#0a0e14] border-t border-white/5">
      <div className="max-w-6xl mx-auto px-6 lg:px-12">
        <div className="grid lg:grid-cols-12 gap-12 mb-14">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-6"
          >
            <p className="text-[11px] font-medium tracking-[0.3em] uppercase text-[#7ba3d4]/60 mb-4">
              Capabilities
            </p>
            <h2 className="text-4xl md:text-5xl font-semibold text-white leading-tight tracking-tight">
              Areas of focus.
            </h2>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.65, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-6 flex items-end"
          >
            <p className="text-white/45 text-base font-light leading-relaxed">
              This site is a place to document operating ideas, selected work, and frameworks around visibility, execution, and modern systems leadership.
            </p>
          </motion.div>
        </div>

        <div className="grid md:grid-cols-2 gap-px bg-white/5">
          {capabilities.map((cap, i) => (
            <motion.div
              key={cap.id}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
              className="group bg-[#0a0e14] hover:bg-[#0e1520] transition-colors duration-300 p-8 lg:p-10"
            >
              <p className="text-[10px] font-medium tracking-[0.25em] uppercase text-[#7ba3d4]/45 mb-4">
                {cap.tag}
              </p>
              <h3 className="text-xl font-semibold text-white mb-3 tracking-tight">
                {cap.title}
              </h3>
              <p className="text-white/40 text-[14px] font-light leading-relaxed mb-5">
                {cap.text}
              </p>
              <button
                onClick={() => document.querySelector("#contact")?.scrollIntoView({ behavior: "smooth" })}
                className="inline-flex items-center gap-2 text-[11px] font-medium tracking-[0.12em] uppercase text-[#7ba3d4]/40 hover:text-[#7ba3d4] transition-colors duration-300 group"
              >
                Discuss an engagement
                <ArrowRight size={11} className="group-hover:translate-x-0.5 transition-transform duration-300" />
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
