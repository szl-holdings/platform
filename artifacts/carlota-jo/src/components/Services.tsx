import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

const services = [
  {
    id: "board-governance",
    title: "Board & governance advisory",
    summary: "Counsel on governance structure, board composition, committee design, and navigating complex principal-agent dynamics.",
    capabilities: ["Board effectiveness reviews", "Governance reform programmes", "Director induction and development"],
  },
  {
    id: "capital-strategy",
    title: "Capital strategy",
    summary: "Independent advice on capital allocation, balance sheet structure, and financing decisions — free from investment banking conflicts.",
    capabilities: ["Capital allocation frameworks", "Balance sheet optimisation", "Investor relations strategy"],
  },
  {
    id: "transformation",
    title: "Operational transformation",
    summary: "End-to-end transformation advisory: from strategic diagnosis through to operating model design and execution governance.",
    capabilities: ["Operating model redesign", "Performance improvement", "Transformation governance"],
  },
  {
    id: "ma-advisory",
    title: "M&A and transaction support",
    summary: "Strategic counsel across the deal lifecycle: target identification, thesis validation, integration planning, and post-merger alignment.",
    capabilities: ["Strategic rationale review", "Integration planning", "Cultural alignment"],
  },
  {
    id: "stakeholder",
    title: "Stakeholder engagement",
    summary: "Support on complex multi-stakeholder situations including activist defence, regulatory relationships, and family governance.",
    capabilities: ["Activist preparedness", "Regulatory strategy", "Family governance structures"],
  },
  {
    id: "growth",
    title: "Growth and market entry",
    summary: "Market entry strategy, adjacency analysis, and commercial model design for expansion into new geographies or sectors.",
    capabilities: ["Market opportunity assessment", "Commercial model design", "Partnership and channel strategy"],
  },
];

export default function Services() {
  return (
    <section id="services" className="py-24 lg:py-32 bg-[#07090d] border-t border-[#f5f0e8]/5">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 mb-16">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-5"
          >
            <p className="text-[11px] font-medium tracking-[0.35em] uppercase text-[#c8a96a]/70 mb-6">
              Services
            </p>
            <h2
              className="text-4xl md:text-5xl font-light text-[#f5f0e8] leading-tight"
              style={{ fontFamily: "Georgia, 'Palatino Linotype', serif" }}
            >
              Private support,
              <br />
              <span className="italic opacity-80">tailored with care.</span>
            </h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-7 flex items-end"
          >
            <p className="text-[#f5f0e8]/50 text-base font-light leading-relaxed max-w-xl">
              Carlota Jo is built around thoughtful service, tailored coordination, and the belief that premium support should feel seamless, discreet, and deeply reliable.
            </p>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-[#f5f0e8]/5">
          {services.map((service, idx) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.55, delay: idx * 0.07, ease: [0.22, 1, 0.36, 1] }}
              className="group bg-[#07090d] hover:bg-[#0c1018]/80 transition-all duration-400 p-8 lg:p-10"
            >
              <p className="text-[10px] font-medium tracking-[0.3em] uppercase text-[#c8a96a]/40 mb-5">
                0{idx + 1}
              </p>
              <h3
                className="text-lg font-light text-[#f5f0e8] mb-3 leading-snug"
                style={{ fontFamily: "Georgia, 'Palatino Linotype', serif" }}
              >
                {service.title}
              </h3>
              <p className="text-[13px] text-[#f5f0e8]/45 leading-relaxed mb-5 font-light">
                {service.summary}
              </p>
              <ul className="space-y-2 mb-6">
                {service.capabilities.map((cap) => (
                  <li key={cap} className="text-[12px] text-[#f5f0e8]/30 flex items-start gap-2 font-light">
                    <span className="text-[#c8a96a]/40 mt-0.5">—</span>
                    {cap}
                  </li>
                ))}
              </ul>
              <button
                onClick={() =>
                  document.querySelector("#inquire")?.scrollIntoView({ behavior: "smooth" })
                }
                className="inline-flex items-center gap-2 text-[11px] font-medium tracking-[0.12em] uppercase text-[#c8a96a]/40 hover:text-[#c8a96a]/80 transition-colors duration-300"
              >
                Discuss this capability
                <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform duration-300" />
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
