import { m } from "framer-motion";

const principles = [
  {
    number: "01",
    title: "Vertical Integration",
    body: "We don't build tools. We build operating systems for entire industries — full-stack ownership from data ingestion to decision output.",
  },
  {
    number: "02",
    title: "Compounding Intelligence",
    body: "Every model trained, every dataset enriched, every prediction validated makes every platform in the ecosystem measurably stronger.",
  },
  {
    number: "03",
    title: "Infrastructure-Grade",
    body: "Our platforms serve organizations that cannot afford downtime — shipping operators, defense contractors, enterprise security teams.",
  },
  {
    number: "04",
    title: "Capital Efficiency",
    body: "Shared infrastructure across six verticals means unified security, compounding data advantages, and engineering leverage that standalone companies cannot replicate.",
  },
];

export function Leadership() {
  return (
    <section id="leadership" className="py-24 lg:py-36 bg-szl-bg-secondary border-t border-szl-border">
      <div className="max-w-6xl mx-auto px-6">
        <m.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-20"
        >
          <p className="text-szl-text-muted text-[10px] font-medium uppercase tracking-[0.25em] mb-6">Founding Thesis</p>
          <div className="max-w-4xl">
            <h2 className="font-[var(--font-display)] text-4xl sm:text-5xl text-szl-text leading-[1.05] mb-8">
              Built by operators.<br />
              <span className="italic" style={{ color: "var(--color-szl-text-secondary)" }}>Designed to compound.</span>
            </h2>
          </div>
        </m.div>

        <m.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="border border-szl-border p-10 sm:p-14 mb-20 max-w-4xl"
        >
          <blockquote className="font-[var(--font-display)] text-xl sm:text-2xl text-szl-text leading-relaxed mb-8">
            "The next generation of durable businesses won't be built on a single product — they'll emerge from intelligently orchestrated ecosystems where data flows between verticals, AI compounds across domains, and every platform makes the others exponentially more valuable. That's not a vision. It's an engineering problem."
          </blockquote>
          <p className="text-szl-text-muted text-sm font-medium tracking-wide">
            — Stephen Lutar, Founder & CEO, SZL Holdings
          </p>
        </m.div>

        <div className="grid sm:grid-cols-2 gap-px bg-szl-border">
          {principles.map((p, index) => (
            <m.div
              key={p.number}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08 }}
              className="bg-szl-bg-secondary hover:bg-szl-bg-tertiary transition-colors duration-300 p-8 lg:p-10"
            >
              <p className="font-[var(--font-display)] text-szl-accent text-2xl mb-5">{p.number}</p>
              <h3 className="font-[var(--font-display)] text-xl text-szl-text mb-3">{p.title}</h3>
              <p className="text-szl-text-secondary text-sm leading-relaxed font-light">{p.body}</p>
            </m.div>
          ))}
        </div>
      </div>
    </section>
  );
}
