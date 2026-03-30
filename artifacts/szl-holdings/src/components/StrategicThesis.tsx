import { m } from "framer-motion";

const capabilities = [
  {
    market: "Maritime & Logistics",
    description: "Real-time fleet intelligence across global shipping lanes, port operations, and cargo tracking.",
  },
  {
    market: "Intelligence & AI",
    description: "Enterprise-grade AI platforms for research operations, signal processing, and decision support.",
  },
  {
    market: "Strategic Advisory",
    description: "Principal-led advisory on governance, capital allocation, and operational transformation.",
  },
  {
    market: "Cyber & Security",
    description: "Adversarial simulation, red-team exercises, and cyber readiness assessment.",
  },
];

export function StrategicThesis() {
  return (
    <section id="thesis" className="py-20 lg:py-28 bg-white border-b border-neutral-100">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-14 lg:gap-20 items-start">
          <m.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="text-[11px] font-medium tracking-[0.12em] uppercase text-neutral-400 mb-4">Strategic Thesis</p>
            <h2 className="text-[1.875rem] sm:text-[2.25rem] font-bold tracking-tight text-neutral-900 leading-[1.15] mb-6">
              Why this ecosystem exists
            </h2>
            <p className="text-neutral-500 text-base leading-relaxed mb-5">
              The most defensible technology companies aren't built on a single product. They're built on
              ecosystems where data compounds across verticals, and every platform makes the others stronger.
            </p>
            <p className="text-neutral-500 text-base leading-relaxed mb-8">
              SZL Holdings was founded on this conviction. We build and operate platforms across maritime
              intelligence, AI research, strategic advisory, and enterprise security — not as separate bets,
              but as an integrated system.
            </p>
            <blockquote className="border-l-2 border-[hsl(215,45%,32%)] pl-5">
              <p className="text-neutral-700 text-[15px] leading-relaxed italic font-light">
                "Vertical integration of AI across critical infrastructure creates defensible, compounding
                value that horizontal platforms cannot replicate."
              </p>
              <footer className="text-[11px] text-neutral-400 mt-3 font-medium tracking-wide uppercase">
                SZL Holdings — Investment Thesis
              </footer>
            </blockquote>
          </m.div>

          <m.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="text-[11px] font-medium tracking-[0.12em] uppercase text-neutral-400 mb-6">Market Capabilities</p>
            <div className="space-y-0 divide-y divide-neutral-100">
              {capabilities.map((cap, i) => (
                <m.div
                  key={cap.market}
                  initial={{ opacity: 0, x: 14 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.5, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] }}
                  className="py-5"
                >
                  <h3 className="text-[14px] font-semibold text-neutral-900 mb-1.5 tracking-tight">{cap.market}</h3>
                  <p className="text-neutral-500 text-[13.5px] leading-relaxed">{cap.description}</p>
                </m.div>
              ))}
            </div>
          </m.div>
        </div>
      </div>
    </section>
  );
}
