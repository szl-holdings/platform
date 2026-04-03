import { ALLOY_OUTPUTS } from "../data/outputs";

const CATEGORY_ACCENT: Record<string, string> = {
  Intelligence: "#4B8BDB",
  Operations: "#f59e0b",
  Documents: "#a78bfa",
  Records: "#10b981",
  Governance: "#f472b6",
};

export default function OutputsPage() {
  const categories = Array.from(new Set(ALLOY_OUTPUTS.map(o => o.category)));

  return (
    <div className="min-h-screen text-white px-6 py-16 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-12">
        <div className="text-xs font-medium uppercase tracking-widest mb-3" style={{ color: "#4B8BDB" }}>Outputs</div>
        <h1 className="text-3xl md:text-4xl font-bold mb-4">What Alloy produces</h1>
        <p className="text-white/50 max-w-2xl leading-relaxed">
          Alloy outputs are structured, contextualised, and traceable. Every output type has a defined format, approval requirements, and connection to the products that use it.
        </p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
        {[
          { label: "Output Types", value: ALLOY_OUTPUTS.length.toString() },
          { label: "With Approval Flow", value: ALLOY_OUTPUTS.filter(o => o.approvalRequired).length.toString() },
          { label: "Categories", value: categories.length.toString() },
          { label: "Connected Products", value: "7+" },
        ].map(stat => (
          <div key={stat.label} className="p-5 rounded-xl border text-center" style={{ borderColor: "rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}>
            <div className="text-2xl font-bold mb-1" style={{ color: "#4B8BDB" }}>{stat.value}</div>
            <div className="text-xs text-white/40">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Outputs by Category */}
      {categories.map(category => {
        const accent = CATEGORY_ACCENT[category] ?? "#4B8BDB";
        const outputs = ALLOY_OUTPUTS.filter(o => o.category === category);

        return (
          <div key={category} className="mb-12">
            <div className="flex items-center gap-3 mb-5">
              <div className="h-px flex-1" style={{ background: `${accent}25` }} />
              <span className="text-xs uppercase tracking-widest font-medium px-3 py-1 rounded-full" style={{ background: `${accent}12`, color: accent }}>{category}</span>
              <div className="h-px flex-1" style={{ background: `${accent}25` }} />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {outputs.map(output => (
                <div key={output.id} className="p-6 rounded-xl border" style={{ borderColor: "rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}>
                  <div className="flex items-start gap-3 mb-4">
                    <span className="text-2xl">{output.icon}</span>
                    <div className="flex-1">
                      <div className="text-sm font-bold text-white/90 mb-1">{output.name}</div>
                      <div className="flex flex-wrap gap-2">
                        <span className="text-[10px] px-1.5 py-0.5 rounded font-medium" style={{ background: `${accent}15`, color: accent }}>{output.category}</span>
                        {output.approvalRequired ? (
                          <span className="text-[10px] px-1.5 py-0.5 rounded font-medium text-amber-400 bg-amber-400/10">Approval required</span>
                        ) : (
                          <span className="text-[10px] px-1.5 py-0.5 rounded font-medium text-emerald-400 bg-emerald-400/10">No approval needed</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-white/50 leading-relaxed mb-4">{output.description}</p>

                  <div className="mb-4">
                    <div className="text-[10px] uppercase tracking-widest text-white/30 mb-2">Format</div>
                    <div className="text-xs text-white/50 italic">{output.format}</div>
                  </div>

                  <div className="mb-4">
                    <div className="text-[10px] uppercase tracking-widest text-white/30 mb-2">Examples</div>
                    <div className="flex flex-wrap gap-1.5">
                      {output.examples.map(e => (
                        <span key={e} className="text-[11px] px-2 py-0.5 rounded border" style={{ borderColor: "rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.5)" }}>{e}</span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] uppercase tracking-widest text-white/30 mb-2">Connected Products</div>
                    <div className="flex flex-wrap gap-1.5">
                      {output.connectedProducts.map(p => (
                        <span key={p} className="text-[11px] px-2 py-0.5 rounded text-white/40">{p}</span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
