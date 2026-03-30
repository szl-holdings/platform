import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

const work = [
  {
    id: "vessels",
    tag: "Maritime Intelligence",
    title: "Vessels — Fleet-scale AI for global shipping operators",
    description: "Designed and shipped a real-time maritime intelligence platform tracking 50,000+ vessels. End-to-end architecture: ingestion pipeline, ML anomaly detection, and a command-centre UI for port operators and insurers.",
    metrics: ["50K+ vessels tracked", "Sub-200ms data refresh", "3 enterprise contracts signed"],
    link: "/vessels/",
  },
  {
    id: "inca",
    tag: "AI Research Infrastructure",
    title: "INCA — Agentic AI research command centre",
    description: "Built a full-stack ML operations platform: experiment tracking, model registry with lineage graphs, live inference monitoring with drift detection, and an ensemble studio for multi-model pipelines.",
    metrics: ["Parallel experiment tracking", "Full model lineage graph", "Integrated drift alerting"],
    link: "/inca/",
  },
  {
    id: "fintech",
    tag: "Financial Infrastructure",
    title: "Enterprise ledger infrastructure — High-frequency transaction processing",
    description: "Architected the core transaction processing engine for a mid-market fintech: double-entry ledger, reconciliation engine, real-time fraud scoring, and regulatory reporting pipeline.",
    metrics: ["£2B+ transactions processed", "99.99% uptime SLA", "FCA-compliant reporting"],
  },
  {
    id: "szl",
    tag: "Venture Architecture",
    title: "SZL Holdings — Multi-venture operating system",
    description: "Designed the shared infrastructure layer across five portfolio companies: unified auth, shared component system, ecosystem navigation, observability stack, and cross-company analytics pipeline.",
    metrics: ["5 live ventures", "Single shared design system", "Unified observability layer"],
    link: "/szl-holdings/",
  },
];

export function CaseStudiesSection() {
  return (
    <section id="work" className="py-24 lg:py-32 bg-[#0a0e14] border-t border-white/5">
      <div className="max-w-6xl mx-auto px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          className="mb-14"
        >
          <p className="text-[11px] font-medium tracking-[0.3em] uppercase text-[#7ba3d4]/60 mb-4">
            Selected work
          </p>
          <h2 className="text-4xl md:text-5xl font-semibold text-white leading-tight tracking-tight">
            Systems built.
            <br />
            <span className="text-white/40 font-normal">Problems solved.</span>
          </h2>
        </motion.div>

        <div className="space-y-px bg-white/5">
          {work.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
              className="group bg-[#0a0e14] hover:bg-[#0e1520] transition-colors duration-300 p-8 lg:p-10"
            >
              <div className="grid lg:grid-cols-12 gap-6 lg:gap-10">
                <div className="lg:col-span-8">
                  <p className="text-[10px] font-medium tracking-[0.25em] uppercase text-[#7ba3d4]/50 mb-3">
                    {item.tag}
                  </p>
                  <h3 className="text-xl font-semibold text-white mb-3 tracking-tight leading-snug group-hover:text-[#a0c0e8] transition-colors duration-300">
                    {item.title}
                  </h3>
                  <p className="text-white/45 text-[14px] font-light leading-relaxed max-w-xl">
                    {item.description}
                  </p>
                </div>
                <div className="lg:col-span-4 flex flex-col justify-between gap-5">
                  <div className="space-y-2">
                    {item.metrics.map((m) => (
                      <div key={m} className="flex items-center gap-2.5">
                        <div className="w-1 h-1 bg-[#7ba3d4]/40 rounded-full shrink-0" />
                        <span className="text-[12px] text-white/35 font-light">{m}</span>
                      </div>
                    ))}
                  </div>
                  {item.link && (
                    <a
                      href={item.link}
                      className="inline-flex items-center gap-2 text-[11px] font-medium tracking-[0.12em] uppercase text-[#7ba3d4]/45 hover:text-[#7ba3d4] transition-colors duration-300"
                    >
                      View live product
                      <ArrowRight size={11} />
                    </a>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
