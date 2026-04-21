const ventures = [
  {
    name: 'FORGE',
    sector: 'Execution Fabric · ENGINE',
    stage: 'Scale',
    investment: '$5.2M',
    valuation: '$24M',
    roi: '+362%',
    status: 'Outperforming',
    description:
      'Execution fabric and predictive intelligence engine powering Lyte, Vessels, and the full SZL ecosystem. Scenario modeling, confidence scoring, and agent coordination at the platform layer.',
    synergies: [
      'Prediction engine drives Lyte workflows',
      'Confidence scores power Aegis decisions',
      'Generative models feed scenario planning',
    ],
  },
  {
    name: 'KORA',
    sector: 'Command & Orchestration · EXECUTE',
    stage: 'Scale',
    investment: '$4.8M',
    valuation: '$22M',
    roi: '+358%',
    status: 'Outperforming',
    description:
      'Business observability and orchestration platform interpreting signals, routing decisions, and managing escalations across the ecosystem.',
    synergies: [
      'Alloy powers prediction layer',
      'Vessels feeds maritime signals',
      'Terra provides property intelligence',
    ],
  },
  {
    name: 'Vessels Maritime Intelligence',
    sector: 'Maritime / Logistics',
    stage: 'Growth',
    investment: '$4.2M',
    valuation: '$18M',
    roi: '+328%',
    status: 'Performing',
    description:
      'Governed maritime intelligence platform for fleet management, route optimization, and compliance monitoring.',
    synergies: [
      'Alloy powers route prediction',
      'Lyte monitors infrastructure',
      'Terra tracks portfolio economics',
    ],
  },
  {
    name: 'DOMAINE',
    sector: 'Real Estate Intelligence · PROPERTY',
    stage: 'Early Growth',
    investment: '$2.0M',
    valuation: '$7M',
    roi: '+250%',
    status: 'Performing',
    description:
      'NYC real estate intelligence platform for distress property tracking, deal pipeline management, ownership entity resolution, and borough-level market intelligence.',
    synergies: ['Alloy powers workflow routing', 'Lyte monitors deal pipeline health'],
  },
  {
    name: 'PARAGON',
    sector: 'Defense & Intelligence · DEFEND',
    stage: 'Growth',
    investment: '$2.5M',
    valuation: '$18M',
    roi: '+620%',
    status: 'Outperforming',
    description:
      'Unified defense and intelligence command — three workspaces (Command, Defense, Labs) operating from one shared intelligence layer with cross-module correlations.',
    synergies: [
      'Alloy powers incident routing',
      'Lyte surfaces operational signals',
      'Vessels provides maritime threat context',
    ],
  },
  {
    name: 'Carlota Jo Advisory',
    sector: 'Strategic Advisory',
    stage: 'Growth',
    investment: '$1.2M',
    valuation: '$4M',
    roi: '+233%',
    status: 'Performing',
    description:
      'Principal advisory practice serving boards, leadership teams, and investors across regulated and high-growth sectors.',
    synergies: ['Leverages ecosystem intelligence', 'Alloy powers advisory insights'],
  },
];

const stageColors: Record<string, string> = {
  'Early Growth': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  Growth: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  Scale: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
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
            Portfolio{' '}
            <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Companies
            </span>
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Deep-dive into each venture, their performance, and cross-portfolio synergies
          </p>
        </div>

        <div className="space-y-6">
          {ventures.map((v) => (
            <div
              key={v.name}
              className="rounded-2xl border border-gray-800 bg-gray-900/50 p-6 hover:border-violet-500/30 transition-all duration-300"
            >
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-lg font-bold text-white">{v.name}</h3>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${stageColors[v.stage]}`}
                    >
                      {v.stage}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400">
                    {v.sector} · {v.description}
                  </p>
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
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider mb-2 block">
                    Ecosystem Synergies
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {v.synergies.map((s) => (
                      <span
                        key={s}
                        className="px-3 py-1 rounded-full text-xs bg-violet-500/10 text-violet-400 border border-violet-500/20"
                      >
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
