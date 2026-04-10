import { motion, useInView } from "framer-motion";
import { ArrowRight, Cpu, Users, Layers, Lightbulb } from "lucide-react";
import { useRef } from "react";

const capabilities = [
  {
    icon: Layers,
    tag: "Technical architecture",
    title: "Systems design & architecture",
    text: "Full-stack architecture for scale: database design, API contracts, event-driven pipelines, caching strategy, and observability. From greenfield to legacy modernisation.",
    color: "#6366F1",
  },
  {
    icon: Cpu,
    tag: "AI / ML",
    title: "AI and ML infrastructure",
    text: "End-to-end ML systems: feature stores, training pipelines, model registries, inference serving, and monitoring for drift and performance degradation in production.",
    color: "#00D4FF",
  },
  {
    icon: Users,
    tag: "Org design",
    title: "Engineering team building",
    text: "Hiring, structuring, and developing high-velocity engineering teams. Built teams from 0 to 40+ across multiple time zones and technical disciplines.",
    color: "#22C55E",
  },
  {
    icon: Lightbulb,
    tag: "Advisory",
    title: "Fractional CTO advisory",
    text: "Embedded technical leadership for early-stage companies that need senior judgment without a full-time commitment. Architecture, hiring, vendor selection, and board communication.",
    color: "#F59E0B",
  },
];

export function ServicesSection() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="capabilities" className="py-24 lg:py-32 bg-[#060910] border-t border-white/5">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12" ref={ref}>
        <div className="grid lg:grid-cols-2 gap-12 mb-14">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-[2px]" style={{ background: "linear-gradient(90deg, #22C55E, transparent)" }} />
              <span className="text-[11px] font-bold tracking-[0.25em] uppercase" style={{ color: "rgba(34,197,94,0.6)" }}>
                Capabilities
              </span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black leading-tight tracking-tight" style={{ color: "rgba(255,255,255,0.95)" }}>
              Areas of focus.
            </h2>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="flex items-end"
          >
            <p className="text-base font-light leading-relaxed" style={{ color: "rgba(255,255,255,0.38)" }}>
              Deep technical expertise applied across complex, high-stakes domains. Available for select fractional engagements and advisory work.
            </p>
          </motion.div>
        </div>

        <div className="grid md:grid-cols-2 gap-3">
          {capabilities.map((cap, i) => {
            const Icon = cap.icon;
            return (
              <motion.div
                key={cap.title}
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.15 + i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                className="group p-7 lg:p-8 transition-all duration-300"
                style={{
                  background: "rgba(12,16,24,0.8)",
                  border: "1px solid rgba(255,255,255,0.05)",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = `${cap.color}25`; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.05)"; }}
              >
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-9 h-9 flex items-center justify-center" style={{ background: `${cap.color}10`, border: `1px solid ${cap.color}20` }}>
                    <Icon size={16} style={{ color: cap.color }} strokeWidth={1.5} />
                  </div>
                  <span className="text-[9px] font-bold tracking-[0.25em] uppercase" style={{ color: `${cap.color}80` }}>
                    {cap.tag}
                  </span>
                </div>
                <h3 className="text-xl font-bold tracking-tight mb-3" style={{ color: "rgba(255,255,255,0.85)" }}>
                  {cap.title}
                </h3>
                <p className="text-[13px] font-light leading-relaxed mb-6" style={{ color: "rgba(255,255,255,0.35)" }}>
                  {cap.text}
                </p>
                <button
                  onClick={() => document.querySelector("#contact")?.scrollIntoView({ behavior: "smooth" })}
                  className="inline-flex items-center gap-2 text-[11px] font-bold tracking-[0.12em] uppercase transition-colors duration-300"
                  style={{ color: `${cap.color}60` }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = cap.color; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = `${cap.color}60`; }}
                >
                  Discuss an engagement
                  <ArrowRight size={11} className="group-hover:translate-x-0.5 transition-transform duration-300" />
                </button>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
