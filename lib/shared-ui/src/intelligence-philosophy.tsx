import { SIX_LENSES_PHILOSOPHY, LENSES, INTELLIGENCE_PHILOSOPHY, PILLARS } from "@szl-holdings/observability";

const LENS_ICONS: Record<string, string> = {
  signal: "◎",
  impact: "$",
  anticipation: "◈",
  topology: "⬡",
  posture: "◆",
  velocity: "▲",
};

export function IntelligencePhilosophy({ compact = false }: { compact?: boolean }) {
  const philosophy = SIX_LENSES_PHILOSOPHY;

  if (compact) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <span className="text-base font-bold text-white">6</span>
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">{philosophy.name}</h3>
            <p className="text-xs text-indigo-300 italic">{philosophy.tagline}</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {LENSES.map((lens) => (
            <div key={lens.id} className={`text-center p-2.5 rounded-lg bg-gradient-to-br ${lens.color} bg-opacity-10 border border-white/5`}>
              <span className="text-sm font-bold text-white/80">{LENS_ICONS[lens.id]}</span>
              <p className="text-[10px] text-white/60 mt-1 leading-tight font-medium">{lens.id.charAt(0).toUpperCase() + lens.id.slice(1)}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-indigo-500/5 via-violet-600/5 to-transparent p-8">
        <div className="flex items-start gap-5 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 flex-shrink-0">
            <span className="text-xl font-black text-white">6</span>
          </div>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-2xl font-bold text-white tracking-tight">{philosophy.name}</h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">SZL Proprietary</span>
            </div>
            <p className="text-sm text-indigo-300 italic">{philosophy.tagline}</p>
          </div>
        </div>
        <p className="text-sm text-white/70 leading-relaxed max-w-4xl">{philosophy.manifesto}</p>
      </div>

      <div>
        <div className="flex items-center gap-3 mb-5">
          <h3 className="text-lg font-semibold text-white">The 6 Lenses</h3>
          <span className="text-xs text-white/30 bg-white/5 px-2 py-0.5 rounded-md">Every domain. Every decision.</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {LENSES.map((lens) => (
            <div key={lens.id} className="group rounded-xl border border-white/10 bg-white/[0.02] p-5 hover:bg-white/[0.04] transition-all hover:border-white/20">
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${lens.color} flex items-center justify-center shadow-sm`}>
                  <span className="text-base font-bold text-white">{LENS_ICONS[lens.id]}</span>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white/90">{lens.name}</h4>
                  <p className="text-[10px] text-white/40 italic">{lens.tagline}</p>
                </div>
              </div>
              <p className="text-xs text-white/50 leading-relaxed mb-3">{lens.description}</p>
              <p className="text-xs text-white/30 italic leading-relaxed line-clamp-3">{lens.philosophy}</p>
              <div className="mt-3 pt-3 border-t border-white/5">
                <span className="text-[10px] text-white/20 uppercase tracking-wider">{lens.inspiredBy}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Core Principles</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {philosophy.principles.map((p, i) => (
            <div key={i} className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-md bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-indigo-400">{i + 1}</span>
                </div>
                <h4 className="text-sm font-semibold text-white/90">{p.title}</h4>
              </div>
              <p className="text-xs text-white/50 leading-relaxed">{p.description}</p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Observability Maturity Model</h3>
        <div className="flex gap-2">
          {philosophy.maturityModel.map((level) => {
            const colors = [
              "from-red-500/20 border-red-500/30",
              "from-[#d4a054]/20 border-[#d4a054]/30",
              "from-blue-500/20 border-blue-500/30",
              "from-[#6b8f71]/20 border-[#6b8f71]/30",
              "from-violet-500/20 border-violet-500/30",
            ];
            const labelColors = ["text-[#c45a4a]", "text-[#d4a054]", "text-[#4a90b8]", "text-[#6b8f71]", "text-[#8b7ac8]"];
            return (
              <div key={level.level} className={`flex-1 rounded-xl border bg-gradient-to-t ${colors[level.level - 1]} p-4`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs font-bold ${labelColors[level.level - 1]}`}>L{level.level}</span>
                  <span className="text-sm font-semibold text-white/90 truncate">{level.name}</span>
                </div>
                <p className="text-[11px] text-white/40 leading-relaxed">{level.description}</p>
                {level.level === 5 && (
                  <div className="mt-2 flex items-center gap-1">
                    <span className="text-[10px] font-semibold text-[#8b7ac8] bg-violet-400/10 px-1.5 py-0.5 rounded">Lens-Native</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function IntelligenceMaturityBadge({ level }: { level: number }) {
  const maturity = SIX_LENSES_PHILOSOPHY.maturityModel.find(m => m.level === level);
  if (!maturity) return null;

  const colors = ["text-[#c45a4a]", "text-[#d4a054]", "text-[#4a90b8]", "text-[#6b8f71]", "text-[#8b7ac8]"];
  const bgs = ["bg-[#c45a4a]/10 border-[#c45a4a]/20", "bg-[#d4a054]/10 border-[#d4a054]/20", "bg-blue-400/10 border-[#4a90b8]/20", "bg-[#6b8f71]/10 border-[#6b8f71]/20", "bg-violet-400/10 border-[#8b7ac8]/20"];

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${colors[level - 1]} ${bgs[level - 1]}`}>
      <span className="font-bold">L{level}</span>
      {maturity.name}
    </span>
  );
}

export function LensTag({ lensId }: { lensId: string }) {
  const lens = LENSES.find(l => l.id === lensId);
  if (!lens) return null;

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-gradient-to-r ${lens.color} bg-opacity-10 text-white/70`}>
      <span>{LENS_ICONS[lensId]}</span>
      {lens.id.charAt(0).toUpperCase() + lens.id.slice(1)}
    </span>
  );
}
