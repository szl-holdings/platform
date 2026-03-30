import { m } from "framer-motion";
import { ArrowUpRight } from "lucide-react";

const featured = [
  {
    name: "Vessels",
    category: "Maritime Intelligence",
    description:
      "Fleet command and real-time maritime intelligence. Tracks vessel positions, route adherence, and anomalous behaviour across global shipping lanes.",
    capabilities: ["Fleet tracking", "Route monitoring", "Anomaly detection", "Operational reporting"],
    href: "/vessels/",
    accent: "hsl(205,70%,38%)",
    status: "Operational",
  },
  {
    name: "INCA",
    category: "Intelligence Platform",
    description:
      "Enterprise AI research and intelligence operations platform. Provides structured visibility, triage workflows, and explainable AI for security and enterprise teams.",
    capabilities: ["Signal visibility", "AI triage", "Audit trails", "Response workflows"],
    href: "/inca/",
    accent: "hsl(245,50%,45%)",
    status: "Operational",
  },
  {
    name: "Carlota Jo",
    category: "Strategic Advisory",
    description:
      "Founder-led principal advisory practice for boards, leadership teams, and investors navigating consequential decisions.",
    capabilities: ["Board advisory", "Capital strategy", "Operational transformation", "Executive counsel"],
    href: "/carlota-jo/",
    accent: "hsl(32,40%,48%)",
    status: "Operational",
  },
  {
    name: "Stephen Lutar",
    category: "Principal & Founder",
    description:
      "Systems thinker, enterprise architect, and operator. Building the infrastructure behind the SZL ecosystem.",
    capabilities: ["Business observability", "Systems architecture", "AI strategy", "Execution leadership"],
    href: "/stephen/",
    accent: "hsl(220,35%,50%)",
    status: "Active",
  },
];

export function FeaturedVentures() {
  return (
    <section id="ventures" className="py-20 lg:py-28 bg-white border-b border-neutral-100">
      <div className="max-w-6xl mx-auto px-6">
        <m.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="mb-12"
        >
          <p className="text-[11px] font-medium tracking-[0.12em] uppercase text-neutral-400 mb-3">Key Platforms</p>
          <h2 className="text-[1.875rem] sm:text-[2.25rem] font-bold tracking-tight text-neutral-900 leading-[1.15]">
            Featured ventures
          </h2>
        </m.div>

        <div className="grid lg:grid-cols-2 gap-4">
          {featured.map((v, i) => (
            <m.a
              key={v.name}
              href={v.href}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.55, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -3 }}
              className="group flex flex-col p-6 rounded-xl border border-neutral-100 bg-white hover:border-neutral-200 hover:shadow-[0_6px_24px_rgba(0,0,0,0.07)] transition-all duration-250 cursor-pointer"
            >
              <div className="flex items-start justify-between mb-5">
                <div>
                  <div className="flex items-center gap-2.5 mb-1">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: v.accent }}
                    />
                    <span className="text-[11px] font-medium tracking-[0.08em] uppercase text-neutral-400">{v.category}</span>
                  </div>
                  <h3 className="text-[1.25rem] font-bold text-neutral-900 tracking-tight">{v.name}</h3>
                </div>
                <ArrowUpRight
                  size={16}
                  className="text-neutral-300 group-hover:text-neutral-600 transition-colors duration-200 mt-1 shrink-0"
                />
              </div>
              <p className="text-neutral-500 text-[13.5px] leading-relaxed mb-5 flex-1">{v.description}</p>
              <div className="flex flex-wrap gap-2">
                {v.capabilities.map((cap) => (
                  <span
                    key={cap}
                    className="text-[11px] px-2.5 py-1 rounded-full border border-neutral-100 text-neutral-500 bg-neutral-50"
                  >
                    {cap}
                  </span>
                ))}
              </div>
            </m.a>
          ))}
        </div>
      </div>
    </section>
  );
}
