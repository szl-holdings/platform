const ecosystemNodes = [
  { id: "szl", name: "SZL Holdings", type: "holding", x: 50, y: 50, connections: ["vessels", "lyte", "alloy", "beacon", "carlota"] },
  { id: "alloy", name: "Alloy · ENGINE", type: "engine", x: 50, y: 15, connections: ["szl", "lyte", "vessels", "beacon"] },
  { id: "lyte", name: "Lyte · EXECUTE", type: "subsidiary", x: 82, y: 30, connections: ["szl", "alloy", "vessels"] },
  { id: "vessels", name: "Vessels · OBSERVE", type: "subsidiary", x: 18, y: 30, connections: ["szl", "alloy", "lyte"] },
  { id: "beacon", name: "Beacon · OBSERVE", type: "subsidiary", x: 25, y: 75, connections: ["szl", "alloy"] },
  { id: "carlota", name: "Carlota Jo · ADVISORY", type: "subsidiary", x: 75, y: 75, connections: ["szl"] },
];

export function NexusMap() {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-violet-900/5 to-transparent" />
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold tracking-widest uppercase bg-violet-500/10 text-violet-400 border border-violet-500/20 mb-4">
            Ecosystem Nexus
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Interconnected <span className="bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent">Portfolio</span>
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            How every SZL subsidiary connects, collaborates, and creates synergy across the ecosystem
          </p>
        </div>

        <div className="relative bg-gray-900/50 border border-gray-800 rounded-2xl p-8 min-h-[500px]">
          <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 0 }}>
            {ecosystemNodes.map(node =>
              node.connections.map(targetId => {
                const target = ecosystemNodes.find(n => n.id === targetId);
                if (!target || node.id > targetId) return null;
                return (
                  <line
                    key={`${node.id}-${targetId}`}
                    x1={`${node.x}%`} y1={`${node.y}%`}
                    x2={`${target.x}%`} y2={`${target.y}%`}
                    stroke="rgba(139, 92, 246, 0.15)"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                  />
                );
              })
            )}
          </svg>

          {ecosystemNodes.map((node) => (
            <div
              key={node.id}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10"
              style={{ left: `${node.x}%`, top: `${node.y}%` }}
            >
              <div className={`group cursor-pointer transition-all duration-300 hover:scale-110 ${node.type === "holding" ? "scale-110" : ""}`}>
                <div className={`rounded-xl border p-4 backdrop-blur-sm ${
                  node.type === "holding"
                    ? "bg-violet-500/20 border-violet-500/40 min-w-[160px]"
                    : "bg-gray-800/80 border-gray-700 min-w-[140px] hover:border-violet-500/30"
                }`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`w-2 h-2 rounded-full ${node.type === "holding" ? "bg-violet-400 animate-pulse" : "bg-emerald-400"}`} />
                    <span className="text-xs font-bold text-white whitespace-nowrap">{node.name}</span>
                  </div>
                  <span className="text-[10px] text-gray-400 capitalize">{node.type}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
          {[
            { label: "Platforms", value: "5", detail: "Active companies" },
            { label: "Synergies", value: "8", detail: "Cross-company integrations" },
            { label: "Combined Revenue", value: "$24M+", detail: "Annual run rate" },
            { label: "Employees", value: "180+", detail: "Across all entities" },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl border border-gray-800 bg-gray-900/50 p-5 text-center">
              <div className="text-2xl font-bold text-white">{stat.value}</div>
              <div className="text-sm font-medium text-violet-400">{stat.label}</div>
              <div className="text-xs text-gray-500 mt-0.5">{stat.detail}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
