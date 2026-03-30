import { m } from "framer-motion";
import { ArrowUpRight } from "lucide-react";

const ventures = [
  {
    name: "Vessels",
    tagline: "Maritime command and fleet intelligence platform.",
    category: "Maritime Intelligence",
    status: "Operational",
    href: "/vessels/",
    accent: "hsl(205,70%,38%)",
  },
  {
    name: "INCA",
    tagline: "Enterprise AI research and intelligence operations.",
    category: "Intelligence Platform",
    status: "Operational",
    href: "/inca/",
    accent: "hsl(245,50%,45%)",
  },
  {
    name: "Carlota Jo",
    tagline: "Founder-led strategic advisory for complex organisations.",
    category: "Advisory",
    status: "Operational",
    href: "/carlota-jo/",
    accent: "hsl(32,40%,48%)",
  },
  {
    name: "Firestorm",
    tagline: "Adversarial security simulation and red-team operations.",
    category: "Cyber Security",
    status: "Operational",
    href: "/firestorm/",
    accent: "hsl(4,72%,50%)",
  },
  {
    name: "Dreamscape",
    tagline: "AI-native creative production and content operations.",
    category: "Creative Technology",
    status: "Beta",
    href: "/dreamscape/",
    accent: "hsl(280,45%,52%)",
  },
  {
    name: "Terra",
    tagline: "Real estate intelligence and portfolio analytics.",
    category: "Real Estate Intelligence",
    status: "Beta",
    href: "/terra/",
    accent: "hsl(152,55%,42%)",
  },
];

const statusStyles: Record<string, string> = {
  Operational: "text-emerald-600 bg-emerald-50 border-emerald-100",
  Beta: "text-amber-600 bg-amber-50 border-amber-100",
};

export function PortfolioStrip() {
  return (
    <section id="portfolio" className="py-20 lg:py-28 bg-neutral-50 border-y border-neutral-100">
      <div className="max-w-6xl mx-auto px-6">
        <m.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="mb-12"
        >
          <p className="text-[11px] font-medium tracking-[0.12em] uppercase text-neutral-400 mb-3">Portfolio</p>
          <h2 className="text-[1.875rem] sm:text-[2.25rem] font-bold tracking-tight text-neutral-900 leading-[1.15]">
            Six operating companies
          </h2>
          <p className="text-neutral-500 text-base mt-3 max-w-md leading-relaxed">
            Each platform commands its vertical while sharing infrastructure and intelligence across the ecosystem.
          </p>
        </m.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {ventures.map((v, i) => (
            <m.a
              key={v.name}
              href={v.href}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -2 }}
              className="group flex flex-col justify-between p-5 rounded-xl border border-neutral-100 bg-white hover:border-neutral-200 hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] transition-all duration-250 cursor-pointer"
            >
              <div className="flex items-start justify-between mb-4">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-[11px] font-bold"
                  style={{ backgroundColor: v.accent }}
                >
                  {v.name[0]}
                </div>
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${statusStyles[v.status] || "text-neutral-400 bg-neutral-50 border-neutral-100"}`}>
                  {v.status}
                </span>
              </div>
              <div>
                <h3 className="text-[15px] font-semibold text-neutral-900 mb-1 tracking-tight">{v.name}</h3>
                <p className="text-neutral-500 text-[13px] leading-snug mb-3">{v.tagline}</p>
                <p className="text-[10px] font-medium tracking-[0.08em] uppercase text-neutral-400">{v.category}</p>
              </div>
              <div className="flex items-center gap-1.5 mt-4 text-[12px] font-medium text-neutral-400 group-hover:text-neutral-700 transition-colors duration-200">
                View platform
                <ArrowUpRight size={12} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-200" />
              </div>
            </m.a>
          ))}
        </div>
      </div>
    </section>
  );
}
