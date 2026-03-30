import { motion } from "framer-motion";
import { Link } from "wouter";

const theses = [
  {
    id: "maritime",
    area: "Maritime & Logistics",
    thesis: "Port congestion, fleet inefficiency, and opaque supply chains cost the global economy $250B+ annually. Real-time AI can capture a meaningful slice of that value.",
    position: "Building — Vessels is live in enterprise trials.",
  },
  {
    id: "ai-research",
    area: "AI Research Infrastructure",
    thesis: "Every company doing serious ML work has the same pain: fragmented experiment tracking, no model lineage, and no coherent way to monitor production drift. This is table stakes infrastructure that doesn't exist as a clean product.",
    position: "Building — INCA is live.",
  },
  {
    id: "fintech-infra",
    area: "Financial Infrastructure",
    thesis: "Mid-market fintechs are under-served. Stripe solves payments. Plaid solves data. Nobody has solved the operational core: ledger, reconciliation, reporting, and compliance in one coherent layer.",
    position: "Monitoring. May build.",
  },
  {
    id: "org-intelligence",
    area: "Organisational Intelligence",
    thesis: "Decision quality degrades with org size. The tools most companies use — decks, spreadsheets, emails — are structurally unable to carry the information needed for good decisions. There's a category to be built here.",
    position: "Active research.",
  },
];

const writing = [
  { title: "The accountability gap in enterprise AI", area: "AI & Enterprise", slug: "accountability-gap-enterprise-ai" },
  { title: "The command interface is underbuilt", area: "Product", slug: "command-interface-underbuilt" },
  { title: "Vertical intelligence beats horizontal tooling", area: "Strategy", slug: "vertical-intelligence-vs-horizontal-tooling" },
  { title: "Multi-tenant isolation as a building material", area: "Engineering", slug: "multi-tenant-isolation" },
];

export function MarketIntelligenceSection() {
  return (
    <section id="thinking" className="py-24 lg:py-32 bg-[#080c11] border-t border-white/5">
      <div className="max-w-6xl mx-auto px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          className="mb-14"
        >
          <p className="text-[11px] font-medium tracking-[0.3em] uppercase text-[#7ba3d4]/60 mb-4">
            Market theses
          </p>
          <h2 className="text-4xl md:text-5xl font-semibold text-white leading-tight tracking-tight">
            Where I see
            <br />
            <span className="text-white/40 font-normal">the next decade.</span>
          </h2>
        </motion.div>

        <div className="space-y-px bg-white/5 mb-20">
          {theses.map((t, i) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.55, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] }}
              className="bg-[#080c11] hover:bg-[#0d1219] transition-colors duration-300 p-7 lg:p-9"
            >
              <div className="grid lg:grid-cols-12 gap-5 lg:gap-8">
                <div className="lg:col-span-3">
                  <p className="text-[11px] font-medium tracking-[0.2em] uppercase text-[#7ba3d4]/55">{t.area}</p>
                </div>
                <div className="lg:col-span-6">
                  <p className="text-[14px] text-white/50 font-light leading-relaxed">{t.thesis}</p>
                </div>
                <div className="lg:col-span-3">
                  <p className="text-[12px] text-[#a0c0e8]/60 font-light">{t.position}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          className="mb-8"
        >
          <p className="text-[11px] font-medium tracking-[0.3em] uppercase text-[#7ba3d4]/60 mb-5">
            Writing
          </p>
          <h3 className="text-2xl font-semibold text-white tracking-tight">
            Thinking in public
          </h3>
        </motion.div>

        <div className="space-y-px bg-white/5">
          {writing.map((w, i) => (
            <Link key={w.title} href={`/writing/${w.slug}`}>
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.5, delay: i * 0.06 }}
                className="bg-[#080c11] hover:bg-[#0d1219] transition-colors duration-300 px-7 py-5 flex items-center justify-between gap-4 group cursor-pointer"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <span className="text-[10px] font-medium tracking-[0.2em] uppercase text-[#7ba3d4]/40 shrink-0">{w.area}</span>
                  <span className="text-[14px] text-white/55 font-light group-hover:text-white/75 transition-colors duration-200 truncate">{w.title}</span>
                </div>
                <span className="text-[11px] text-[#7ba3d4]/50 group-hover:text-[#7ba3d4]/80 transition-colors duration-200 shrink-0">Read →</span>
              </motion.div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
