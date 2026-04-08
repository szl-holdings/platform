import { motion } from "framer-motion";

const testimonials = [
  {
    text: "A rare combination of strategic depth and practical execution. The engagement reshaped how our board thinks about capital allocation.",
    attribution: "Group Chairman, FTSE 250 Industrial",
    country: "United Kingdom",
  },
  {
    text: "Carlota Jo operated with the discretion and rigour we needed for a sensitive restructuring process. Exactly what the situation required.",
    attribution: "Managing Partner, European Private Equity",
    country: "Germany",
  },
  {
    text: "The diagnosis was clear, the options were honest, and the advice was senior. That's what we engaged for, and that's what we received.",
    attribution: "Chief Executive, Global Infrastructure Group",
    country: "Netherlands",
  },
  {
    text: "Three board meetings in, we had more clarity on our strategic position than in the previous three years. The work was substantive and the process was seamless.",
    attribution: "Founder & CEO, Technology Holdings Group",
    country: "United States",
  },
  {
    text: "What distinguished the engagement was the absence of hedging. Senior advice, direct recommendations, no committee politics. Exactly what a private company needs.",
    attribution: "Principal, Family Office",
    country: "Switzerland",
  },
  {
    text: "The cross-border complexity of our situation required someone who understood both the capital markets context and the regulatory environment. Carlota Jo delivered both.",
    attribution: "CFO, Listed Financial Services Group",
    country: "Singapore",
  },
];

const outcomePillars = [
  {
    metric: "< 6 weeks",
    label: "Strategic clarity",
    detail: "From initial orientation to a structured strategic position — typically within six weeks for most founding engagements.",
  },
  {
    metric: "4 continents",
    label: "Global reach",
    detail: "Active client relationships across Europe, North America, Asia-Pacific, and the Middle East.",
  },
  {
    metric: "100%",
    label: "Principal-led",
    detail: "Every engagement conducted by Rosa Carlota directly. No associates. No delegation of the strategic layer.",
  },
  {
    metric: "0",
    label: "Engagements disclosed",
    detail: "Client relationships are never disclosed without explicit consent. Confidentiality is structural, not aspirational.",
  },
];

const engagementOutcomes = [
  {
    category: "Strategic Repositioning",
    headline: "Portfolio company repositioned for acquisition",
    context: "Consumer goods group, Europe",
    outcome: "Full strategic repositioning delivered in 8 weeks. Company acquired at 4.2× revenue within 14 months of engagement.",
    tags: ["M&A Advisory", "Strategic Reposition", "Exit Preparation"],
  },
  {
    category: "Operational Restructuring",
    headline: "Profitability restored in a technology division under margin pressure",
    context: "Technology holding group, North America",
    outcome: "Operating model redesign and cost structure analysis delivered a 340bps EBITDA improvement within two quarters.",
    tags: ["Operations", "Cost Structure", "Margin Recovery"],
  },
  {
    category: "Market Entry",
    headline: "Market entry strategy for APAC expansion",
    context: "Professional services firm, United Kingdom",
    outcome: "Full competitive landscape analysis and sequenced entry strategy. First market revenue within 11 months of strategy delivery.",
    tags: ["Market Entry", "APAC", "Competitive Intelligence"],
  },
  {
    category: "Governance & Capital",
    headline: "Governance structure redesigned ahead of Series B",
    context: "Technology founder, United States",
    outcome: "Board composition, governance documentation, and investor-facing positioning redesigned. Series B closed 3 months after engagement.",
    tags: ["Governance", "Capital Raising", "Board Structure"],
  },
];

const qualities = [
  { label: "Principal-led", description: "Every engagement led by the founding advisor — not delegated to junior staff." },
  { label: "Confidential", description: "Strict confidentiality across all engagements, clients, and sensitive matters." },
  { label: "Selective", description: "We work with a small number of clients at any time to preserve depth of engagement." },
  { label: "Independent", description: "No conflicts of interest. Advice that serves only the client's interests." },
];

export default function Proof() {
  return (
    <section id="proof" className="bg-[#06080c] border-t border-[#f5f0e8]/5">

      {/* Outcome metrics strip */}
      <div className="border-b border-[#f5f0e8]/6">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-[#f5f0e8]/5">
            {outcomePillars.map((o, i) => (
              <motion.div
                key={o.label}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.07 }}
                className="px-7 py-10 bg-[#06080c]"
              >
                <p className="text-[2rem] font-light text-[#c8a96a] mb-2" style={{ fontFamily: "Georgia, serif" }}>{o.metric}</p>
                <p className="text-[12px] font-medium text-[#f5f0e8]/60 mb-2">{o.label}</p>
                <p className="text-[11px] font-light leading-relaxed text-[#f5f0e8]/25">{o.detail}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Engagement outcomes */}
      <div className="py-24 lg:py-32 border-b border-[#f5f0e8]/5">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-14"
          >
            <p className="text-[11px] font-medium tracking-[0.35em] uppercase text-[#c8a96a]/70 mb-4">
              Documented Outcomes
            </p>
            <h2
              className="font-light leading-tight"
              style={{ fontFamily: "Georgia, 'Palatino Linotype', serif", fontSize: "clamp(1.75rem, 3vw, 2.5rem)", color: "#f5f0e8" }}
            >
              Results from the work.<br />
              <span style={{ fontStyle: "italic" }}>Not from the positioning.</span>
            </h2>
            <p className="mt-4 text-[14px] font-light text-[#f5f0e8]/35 max-w-xl leading-relaxed">
              All outcomes are drawn from active engagements, anonymised and presented with client consent. Specific client identities are not disclosed.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {engagementOutcomes.map((e, i) => (
              <motion.div
                key={e.headline}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.55, delay: (i % 2) * 0.1 }}
                className="border border-[#f5f0e8]/8 p-7"
              >
                <p className="text-[9px] tracking-[0.25em] uppercase font-medium text-[#c8a96a]/50 mb-4">{e.category}</p>
                <h3 className="font-light text-[#f5f0e8] text-[16px] mb-2 leading-snug" style={{ fontFamily: "Georgia, serif" }}>
                  {e.headline}
                </h3>
                <p className="text-[11px] text-[#f5f0e8]/28 mb-5">{e.context}</p>
                <p className="text-[13px] font-light text-[#f5f0e8]/55 leading-relaxed mb-5 border-l border-[#c8a96a]/20 pl-4">
                  {e.outcome}
                </p>
                <div className="flex flex-wrap gap-2">
                  {e.tags.map(tag => (
                    <span key={tag} className="text-[10px] px-2.5 py-1 border border-[#f5f0e8]/8 text-[#f5f0e8]/28 tracking-[0.05em]">{tag}</span>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Client perspectives */}
      <div className="py-24 lg:py-32">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.65 }}
            className="mb-16"
          >
            <p className="text-[11px] font-medium tracking-[0.35em] uppercase text-[#c8a96a]/70 mb-4">
              Client perspectives
            </p>
            <h2
              className="font-light leading-tight"
              style={{ fontFamily: "Georgia, 'Palatino Linotype', serif", fontSize: "clamp(1.75rem, 3vw, 2.5rem)", color: "#f5f0e8" }}
            >
              Trusted by principals across<br />
              <span style={{ fontStyle: "italic" }}>four continents</span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {testimonials.map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.65, delay: (i % 3) * 0.1 }}
                className="border-t border-[#f5f0e8]/10 pt-7"
              >
                <p
                  className="text-[#f5f0e8]/70 text-base font-light leading-relaxed mb-6"
                  style={{ fontFamily: "Georgia, 'Palatino Linotype', serif" }}
                >
                  "{t.text}"
                </p>
                <div>
                  <p className="text-[11px] tracking-[0.12em] uppercase text-[#f5f0e8]/30 font-medium mb-0.5">
                    {t.attribution}
                  </p>
                  <p className="text-[10px] tracking-[0.08em] text-[#c8a96a]/40">{t.country}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-px bg-[#f5f0e8]/5">
            {qualities.map((q, i) => (
              <motion.div
                key={q.label}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.6, delay: i * 0.07 }}
                className="bg-[#06080c] px-6 py-7"
              >
                <p className="text-[#c8a96a]/80 text-[13px] font-medium mb-2">{q.label}</p>
                <p className="text-[#f5f0e8]/40 text-[13px] font-light leading-relaxed">{q.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
