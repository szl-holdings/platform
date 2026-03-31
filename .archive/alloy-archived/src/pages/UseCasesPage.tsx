import { useState } from "react";
import { ALLOY_USE_CASES } from "../data/usecases";

const CATEGORY_ACCENT: Record<string, string> = {
  Observability: "#f59e0b",
  Assessment: "#3b82f6",
  Documents: "#a78bfa",
  Operations: "#00d4ff",
  Maritime: "#10b981",
  Command: "#f472b6",
};

export default function UseCasesPage() {
  const [selected, setSelected] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("All");

  const categories = ["All", ...Array.from(new Set(ALLOY_USE_CASES.map(u => u.category)))];
  const filtered = filter === "All" ? ALLOY_USE_CASES : ALLOY_USE_CASES.filter(u => u.category === filter);

  const selectedCase = ALLOY_USE_CASES.find(u => u.id === selected);

  return (
    <div className="min-h-screen text-white px-6 py-16 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-12">
        <div className="text-xs font-medium uppercase tracking-widest mb-3" style={{ color: "#00d4ff" }}>Use Cases</div>
        <h1 className="text-3xl md:text-4xl font-bold mb-4">Practical applications across the ecosystem</h1>
        <p className="text-white/50 max-w-2xl leading-relaxed">
          These are the specific operational problems Alloy solves across the SZL ecosystem — concrete use cases with defined inputs, Alloy's role, and measurable business impact.
        </p>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2 mb-8">
        {categories.map(cat => {
          const accent = cat === "All" ? "#00d4ff" : CATEGORY_ACCENT[cat] ?? "#00d4ff";
          return (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-all"
              style={{
                borderColor: filter === cat ? `${accent}40` : "rgba(255,255,255,0.1)",
                background: filter === cat ? `${accent}12` : "transparent",
                color: filter === cat ? accent : "rgba(255,255,255,0.45)",
              }}
            >
              {cat}
            </button>
          );
        })}
      </div>

      <div className="lg:flex lg:gap-8">
        {/* Use Case Grid */}
        <div className="lg:flex-1">
          <div className="grid md:grid-cols-2 gap-4">
            {filtered.map(uc => {
              const accent = CATEGORY_ACCENT[uc.category] ?? "#00d4ff";
              const isSelected = selected === uc.id;
              return (
                <button
                  key={uc.id}
                  onClick={() => setSelected(isSelected ? null : uc.id)}
                  className="text-left p-6 rounded-xl border transition-all"
                  style={{
                    borderColor: isSelected ? `${accent}40` : "rgba(255,255,255,0.08)",
                    background: isSelected ? `${accent}06` : "rgba(255,255,255,0.02)",
                  }}
                >
                  <div className="flex items-start gap-3 mb-3">
                    <span className="text-2xl">{uc.icon}</span>
                    <div>
                      <div className="text-sm font-bold text-white/90 mb-1">{uc.title}</div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] px-1.5 py-0.5 rounded font-medium" style={{ background: `${accent}15`, color: accent }}>{uc.category}</span>
                        <span className="text-[10px] text-white/30">{uc.relatedProduct}</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-white/45 leading-relaxed mb-3">{uc.problem}</p>
                  <div className="text-[11px] text-white/30 italic">{uc.audience}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Use Case Detail */}
        {selectedCase && (
          <div className="lg:w-96 shrink-0 mt-6 lg:mt-0">
            <UseCaseDetail useCase={selectedCase} />
          </div>
        )}
      </div>
    </div>
  );
}

function UseCaseDetail({ useCase }: { useCase: (typeof ALLOY_USE_CASES)[number] }) {
  const accent = CATEGORY_ACCENT[useCase.category] ?? "#00d4ff";

  return (
    <div className="sticky top-6 rounded-xl border p-6" style={{ borderColor: `${accent}25`, background: "rgba(255,255,255,0.02)" }}>
      <div className="flex items-start gap-3 mb-5">
        <span className="text-3xl">{useCase.icon}</span>
        <div>
          <h3 className="text-base font-bold mb-1">{useCase.title}</h3>
          <div className="flex items-center gap-2">
            <span className="text-[10px] px-1.5 py-0.5 rounded font-medium" style={{ background: `${accent}15`, color: accent }}>{useCase.category}</span>
            <span className="text-[10px] text-white/30">{useCase.relatedProduct}</span>
          </div>
        </div>
      </div>

      <div className="mb-4">
        <div className="text-[10px] uppercase tracking-widest text-white/30 mb-1.5">Audience</div>
        <p className="text-xs text-white/55">{useCase.audience}</p>
      </div>

      <div className="mb-4">
        <div className="text-[10px] uppercase tracking-widest text-white/30 mb-1.5">The Problem</div>
        <p className="text-xs text-white/55 leading-relaxed">{useCase.problem}</p>
      </div>

      <div className="mb-4">
        <div className="text-[10px] uppercase tracking-widest text-white/30 mb-2">Inputs to Alloy</div>
        <div className="space-y-1">
          {useCase.inputs.map(i => (
            <div key={i} className="flex items-center gap-2 text-xs text-white/50">
              <div className="w-1 h-1 rounded-full shrink-0 opacity-60" style={{ background: accent }} />
              {i}
            </div>
          ))}
        </div>
      </div>

      <div className="mb-4 p-3 rounded-lg border" style={{ borderColor: `${accent}20`, background: `${accent}06` }}>
        <div className="text-[10px] uppercase tracking-widest mb-1.5" style={{ color: `${accent}80` }}>Alloy's Role</div>
        <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.6)" }}>{useCase.alloyRole}</p>
      </div>

      <div className="mb-4">
        <div className="text-[10px] uppercase tracking-widest text-white/30 mb-2">Outputs</div>
        <div className="space-y-1">
          {useCase.outputs.map(o => (
            <div key={o} className="flex items-center gap-2 text-xs text-white/50">
              <div className="w-1 h-1 rounded-full shrink-0 opacity-60" style={{ background: "#10b981" }} />
              {o}
            </div>
          ))}
        </div>
      </div>

      <div className="p-3 rounded-lg border" style={{ borderColor: "rgba(16,185,129,0.2)", background: "rgba(16,185,129,0.06)" }}>
        <div className="text-[10px] uppercase tracking-widest text-emerald-400/70 mb-1.5">Business Impact</div>
        <p className="text-xs text-white/55 leading-relaxed">{useCase.businessImpact}</p>
      </div>
    </div>
  );
}
