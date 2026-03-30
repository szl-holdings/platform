import { m } from "framer-motion";

const developments = [
  {
    date: "March 2026",
    tag: "Platform",
    title: "Vessels intelligence layer expanded",
    body: "Advanced anomaly detection and route deviation alerting rolled out to all fleet operator clients.",
  },
  {
    date: "February 2026",
    tag: "Advisory",
    title: "Carlota Jo Q1 engagements underway",
    body: "Principal advisory practice at capacity with governance and capital allocation mandates across three industry verticals.",
  },
  {
    date: "January 2026",
    tag: "Infrastructure",
    title: "Shared data infrastructure upgrade",
    body: "Ecosystem-wide infrastructure improvement reduces operational overhead and strengthens cross-platform data availability.",
  },
];

export function LatestDevelopments() {
  return (
    <section id="developments" className="py-20 lg:py-28 bg-neutral-50 border-b border-neutral-100">
      <div className="max-w-6xl mx-auto px-6">
        <m.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="mb-10"
        >
          <p className="text-[11px] font-medium tracking-[0.12em] uppercase text-neutral-400 mb-3">Updates</p>
          <h2 className="text-[1.875rem] sm:text-[2.25rem] font-bold tracking-tight text-neutral-900 leading-[1.15]">
            Latest developments
          </h2>
        </m.div>

        <div className="space-y-0 divide-y divide-neutral-100">
          {developments.map((d, i) => (
            <m.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] }}
              className="py-6 grid sm:grid-cols-[160px,1fr] gap-4 sm:gap-8"
            >
              <div>
                <p className="text-[11px] text-neutral-400 font-medium mb-1">{d.date}</p>
                <span className="text-[10px] font-semibold uppercase tracking-[0.1em] px-2 py-0.5 rounded-full border border-neutral-200 text-neutral-500 bg-white">
                  {d.tag}
                </span>
              </div>
              <div>
                <h3 className="text-[15px] font-semibold text-neutral-900 tracking-tight mb-1.5">{d.title}</h3>
                <p className="text-neutral-500 text-[13.5px] leading-relaxed">{d.body}</p>
              </div>
            </m.div>
          ))}
        </div>
      </div>
    </section>
  );
}
