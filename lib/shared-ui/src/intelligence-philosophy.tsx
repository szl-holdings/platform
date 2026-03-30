import { INTELLIGENCE_PHILOSOPHY, PILLARS } from "@workspace/observability";

const PILLAR_COLORS: Record<string, string> = {
  performance: "from-blue-500 to-cyan-500",
  business: "from-emerald-500 to-teal-500",
  userExperience: "from-violet-500 to-purple-500",
  predictiveHealth: "from-amber-500 to-orange-500",
  operational: "from-slate-400 to-zinc-500",
  strategic: "from-rose-500 to-pink-500",
  securityPosture: "from-red-500 to-orange-600",
  innovationVelocity: "from-indigo-500 to-blue-600",
};

const PILLAR_ICONS: Record<string, string> = {
  performance: "⚡",
  business: "📈",
  userExperience: "👥",
  predictiveHealth: "🧠",
  operational: "🖥️",
  strategic: "🎯",
  securityPosture: "🛡️",
  innovationVelocity: "🚀",
};

export function IntelligencePhilosophy({ compact = false }: { compact?: boolean }) {
  const philosophy = INTELLIGENCE_PHILOSOPHY;

  if (compact) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
            <span className="text-lg">◆</span>
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">{philosophy.name}</h3>
            <p className="text-xs text-white/50 italic">{philosophy.tagline}</p>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {PILLARS.map((p) => (
            <div key={p.id} className="text-center p-2 rounded-lg bg-white/[0.03] border border-white/5">
              <span className="text-lg">{PILLAR_ICONS[p.id]}</span>
              <p className="text-[10px] text-white/60 mt-1 leading-tight">{p.name}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-indigo-500/5 to-violet-600/5 p-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <span className="text-2xl font-bold text-white">◆</span>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">{philosophy.name}</h2>
            <p className="text-sm text-indigo-300 italic">{philosophy.tagline}</p>
          </div>
        </div>
        <p className="text-sm text-white/70 leading-relaxed max-w-4xl">{philosophy.manifesto}</p>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-white mb-4">The 8 Pillars</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {PILLARS.map((pillar) => (
            <div key={pillar.id} className="group rounded-xl border border-white/10 bg-white/[0.02] p-5 hover:bg-white/[0.04] transition-all hover:border-white/20">
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${PILLAR_COLORS[pillar.id]} flex items-center justify-center opacity-90 group-hover:opacity-100 transition-opacity`}>
                  <span className="text-base">{PILLAR_ICONS[pillar.id]}</span>
                </div>
                <h4 className="text-sm font-semibold text-white/90">{pillar.name}</h4>
              </div>
              <p className="text-xs text-white/50 leading-relaxed mb-3">{pillar.description}</p>
              <p className="text-xs text-white/30 italic leading-relaxed">{pillar.philosophy}</p>
              <div className="mt-3 pt-3 border-t border-white/5">
                <span className="text-[10px] text-white/25 uppercase tracking-wider">{pillar.inspiredBy}</span>
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
                <div className="w-6 h-6 rounded-md bg-indigo-500/20 flex items-center justify-center">
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
        <h3 className="text-lg font-semibold text-white mb-4">Intelligence Maturity Model</h3>
        <div className="flex gap-2">
          {philosophy.maturityModel.map((level) => {
            const width = `${16 + level.level * 2}%`;
            const colors = [
              "from-red-500/20 border-red-500/30",
              "from-amber-500/20 border-amber-500/30",
              "from-blue-500/20 border-blue-500/30",
              "from-emerald-500/20 border-emerald-500/30",
              "from-violet-500/20 border-violet-500/30",
            ];
            return (
              <div key={level.level} className={`flex-1 rounded-xl border bg-gradient-to-t ${colors[level.level - 1]} p-4`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-white/60">L{level.level}</span>
                  <span className="text-sm font-semibold text-white/90">{level.name}</span>
                </div>
                <p className="text-[11px] text-white/40 leading-relaxed">{level.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function IntelligenceMaturityBadge({ level }: { level: number }) {
  const maturity = INTELLIGENCE_PHILOSOPHY.maturityModel.find(m => m.level === level);
  if (!maturity) return null;

  const colors = ["text-red-400", "text-amber-400", "text-blue-400", "text-emerald-400", "text-violet-400"];
  const bgs = ["bg-red-400/10", "bg-amber-400/10", "bg-blue-400/10", "bg-emerald-400/10", "bg-violet-400/10"];

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${colors[level - 1]} ${bgs[level - 1]}`}>
      <span className="font-bold">L{level}</span>
      {maturity.name}
    </span>
  );
}
