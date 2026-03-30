import { m } from "framer-motion";

const credibilityBlocks = [
  {
    label: "Capital deployed",
    value: "$180M+",
    description: "Across six operational technology platforms since 2022.",
  },
  {
    label: "Platforms operational",
    value: "4 of 6",
    description: "Maritime, intelligence, advisory, and security platforms fully live.",
  },
  {
    label: "Market reach",
    value: "3 continents",
    description: "Clients and operations spanning North America, Europe, and Asia-Pacific.",
  },
  {
    label: "Team",
    value: "Founder-led",
    description: "Principals with direct operating accountability across every platform.",
  },
];

export function TrustSection() {
  return (
    <section id="trust" className="py-20 lg:py-28 bg-white border-b border-neutral-100">
      <div className="max-w-6xl mx-auto px-6">
        <m.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="mb-12"
        >
          <p className="text-[11px] font-medium tracking-[0.12em] uppercase text-neutral-400 mb-3">Credentials</p>
          <h2 className="text-[1.875rem] sm:text-[2.25rem] font-bold tracking-tight text-neutral-900 leading-[1.15]">
            Built for enterprise
          </h2>
          <p className="text-neutral-500 text-base mt-3 max-w-lg leading-relaxed">
            SZL Holdings platforms are designed for organisations where reliability, security, and
            accountability are non-negotiable.
          </p>
        </m.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-px bg-neutral-100 rounded-xl overflow-hidden border border-neutral-100">
          {credibilityBlocks.map((b, i) => (
            <m.div
              key={b.label}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
              className="bg-white px-6 py-7"
            >
              <p className="text-[11px] font-medium tracking-[0.08em] uppercase text-neutral-400 mb-2">{b.label}</p>
              <p className="text-[1.75rem] font-bold text-neutral-900 tracking-tight mb-2">{b.value}</p>
              <p className="text-neutral-500 text-[12.5px] leading-relaxed">{b.description}</p>
            </m.div>
          ))}
        </div>
      </div>
    </section>
  );
}
