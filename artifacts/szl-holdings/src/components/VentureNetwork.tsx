const ventures = [
  {
    name: "Vessels Maritime Intelligence",
    sector: "Maritime / Logistics",
    stage: "Growth",
    investment: "$4.2M",
    valuation: "$18M",
    roi: "+328%",
    status: "Performing",
    description: "AI-powered maritime intelligence platform for fleet management, route optimization, and compliance monitoring.",
    synergies: ["Uses INCA AI models for route prediction", "Firestorm provides maritime cybersecurity", "Lyte monitors infrastructure"],
  },
  {
    name: "Firestorm Security",
    sector: "Cybersecurity",
    stage: "Growth",
    investment: "$3.8M",
    valuation: "$15M",
    roi: "+295%",
    status: "Performing",
    description: "Enterprise security operations platform with SOC capabilities, threat intelligence, and automated incident response.",
    synergies: ["Protects all SZL portfolio companies", "INCA powers threat detection AI", "Integrated with Lyte observability"],
  },
  {
    name: "INCA AI Research",
    sector: "Artificial Intelligence",
    stage: "Scale",
    investment: "$6.1M",
    valuation: "$28M",
    roi: "+359%",
    status: "Outperforming",
    description: "Custom AI model development, neural architecture research, and enterprise AI deployment platform.",
    synergies: ["Powers AI across all subsidiaries", "Dreamscape uses generative models", "Vessels uses prediction models"],
  },
  {
    name: "Dreamscape Creative",
    sector: "Creative Technology",
    stage: "Growth",
    investment: "$2.5M",
    valuation: "$9M",
    roi: "+260%",
    status: "Performing",
    description: "AI-powered creative production platform for brand asset generation, campaign management, and visual storytelling.",
    synergies: ["INCA provides generative AI", "Handles branding for all SZL companies"],
  },
  {
    name: "Evolve MSP",
    sector: "Managed Services",
    stage: "Early Growth",
    investment: "$1.8M",
    valuation: "$5M",
    roi: "+178%",
    status: "Performing",
    description: "Managed service provider platform for client IT management, service desk, and NOC operations.",
    synergies: ["Lyte provides monitoring infrastructure", "Firestorm handles client security"],
  },
  {
    name: "Terra Real Estate Intelligence",
    sector: "PropTech",
    stage: "Early Growth",
    investment: "$2.0M",
    valuation: "$7M",
    roi: "+250%",
    status: "Performing",
    description: "Real estate intelligence platform with market analytics, property pipeline management, and investment analysis.",
    synergies: ["INCA powers market prediction models"],
  },
];

const stageColors: Record<string, string> = {
  "Early Growth": "bg-blue-500/10 text-blue-400 border-blue-500/20",
  Growth: "bg-violet-500/10 text-violet-400 border-violet-500/20",
  Scale: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
};

export function VentureNetwork() {
  return (
    <section className="py-24 relative">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold tracking-widest uppercase bg-blue-500/10 text-blue-400 border border-blue-500/20 mb-4">
            Venture Network
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Portfolio <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Companies</span>
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Deep-dive into each venture, their performance, and cross-portfolio synergies
          </p>
        </div>

        <div className="space-y-6">
          {ventures.map((v) => (
            <div key={v.name} className="rounded-2xl border border-gray-800 bg-gray-900/50 p-6 hover:border-violet-500/30 transition-all duration-300">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-lg font-bold text-white">{v.name}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${stageColors[v.stage]}`}>{v.stage}</span>
                  </div>
                  <p className="text-sm text-gray-400">{v.sector} · {v.description}</p>
                </div>
                <div className="flex items-center gap-6 shrink-0">
                  <div className="text-center">
                    <div className="text-xs text-gray-500">Invested</div>
                    <div className="text-sm font-bold text-white">{v.investment}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-gray-500">Valuation</div>
                    <div className="text-sm font-bold text-white">{v.valuation}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-gray-500">ROI</div>
                    <div className="text-sm font-bold text-emerald-400">{v.roi}</div>
                  </div>
                </div>
              </div>
              {v.synergies.length > 0 && (
                <div className="pt-3 border-t border-gray-800">
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider mb-2 block">Ecosystem Synergies</span>
                  <div className="flex flex-wrap gap-2">
                    {v.synergies.map((s) => (
                      <span key={s} className="px-3 py-1 rounded-full text-xs bg-violet-500/10 text-violet-400 border border-violet-500/20">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
