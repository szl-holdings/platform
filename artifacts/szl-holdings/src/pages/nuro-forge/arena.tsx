import { useState, useEffect, useCallback } from "react";
import { m, AnimatePresence } from "framer-motion";
import { Trophy, Swords, ArrowRight, Crown, TrendingUp, TrendingDown, RotateCcw, Play, Check, X } from "lucide-react";
import { nuroForgeService, getNuroForgeModels, type NuroModel, type DuelResult as ServiceDuelResult } from "@/lib/nuro-forge-service";

export default function TournamentArenaPage() {
  const [models, setModels] = useState(() => getNuroForgeModels());
  const [duels, setDuels] = useState<ServiceDuelResult[]>(() => nuroForgeService.getDuelHistory());
  const [activeDuel, setActiveDuel] = useState<{ c: NuroModel; d: NuroModel; domain: string; phase: "running" | "done"; result?: ServiceDuelResult } | null>(null);
  const [totalDuels, setTotalDuels] = useState(2847);
  const [selectedView, setSelectedView] = useState<"leaderboard" | "history">("leaderboard");

  const domains = ["Legal", "Maritime", "Cybersecurity", "Financial", "Real Estate", "Advisory", "Research", "Operations"];

  const executeDuel = useCallback(() => {
    const allModels = getNuroForgeModels();
    const c = allModels[Math.floor(Math.random() * allModels.length)];
    let d = allModels[Math.floor(Math.random() * allModels.length)];
    while (d.id === c.id) d = allModels[Math.floor(Math.random() * allModels.length)];
    const domain = domains[Math.floor(Math.random() * domains.length)];

    setActiveDuel({ c, d, domain, phase: "running" });

    setTimeout(() => {
      const result = nuroForgeService.runDuel(c.id, d.id, domain);

      nuroForgeService.evaluateGovernance(result.modelA, domain, `Duel output for ${domain}`);
      nuroForgeService.evaluateGovernance(result.modelB, domain, `Duel output for ${domain}`);

      const updatedModels = getNuroForgeModels();
      setModels(updatedModels);
      setDuels(nuroForgeService.getDuelHistory());
      setActiveDuel({ c, d, domain, phase: "done", result });
      setTotalDuels(p => p + 1);
    }, 2000);
  }, [domains]);

  useEffect(() => {
    const t = setInterval(executeDuel, 8000);
    return () => clearInterval(t);
  }, [executeDuel]);

  const sorted = [...models].sort((a, b) => b.elo - a.elo);

  return (
    <div className="min-h-screen" style={{ background: "#070a10" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <m.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.2)" }}>
              <Trophy className="w-4 h-4" style={{ color: "#f59e0b" }} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight" style={{ color: "rgba(255,255,255,0.9)" }}>Tournament Arena</h1>
              <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.3)" }}>{totalDuels.toLocaleString()} duels completed · {models.length} models competing</p>
            </div>
          </div>
          <button onClick={executeDuel} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-medium"
            style={{ background: "rgba(245,158,11,0.12)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.2)" }}>
            <Swords className="w-3.5 h-3.5" /> Run Duel
          </button>
        </m.div>

        <AnimatePresence>
          {activeDuel && (
            <m.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="rounded-lg p-5 mb-6" style={{ background: "rgba(245,158,11,0.04)", border: "1px solid rgba(245,158,11,0.15)" }}>
              <div className="flex items-center justify-center gap-2 mb-4">
                <Swords className="w-4 h-4" style={{ color: "#f59e0b" }} />
                <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#f59e0b" }}>
                  {activeDuel.phase === "running" ? "Duel in Progress" : "Duel Complete"} — {activeDuel.domain}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex-1 text-center">
                  <div className="text-sm font-bold" style={{ color: activeDuel.phase === "done" && activeDuel.result?.winner === activeDuel.c.name ? "#10b981" : "rgba(255,255,255,0.7)" }}>
                    {activeDuel.c.name}
                  </div>
                  <div className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>{activeDuel.c.provider} · Elo {activeDuel.c.elo}</div>
                  {activeDuel.phase === "done" && activeDuel.result?.winner === activeDuel.c.name && (
                    <m.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full" style={{ background: "rgba(16,185,129,0.12)", color: "#10b981" }}>
                      <Crown className="w-3 h-3" /> <span className="text-[10px] font-bold">Winner</span>
                    </m.div>
                  )}
                </div>
                <div className="px-6">
                  {activeDuel.phase === "running" ? (
                    <m.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                      <RotateCcw className="w-6 h-6" style={{ color: "#f59e0b" }} />
                    </m.div>
                  ) : (
                    <div className="text-lg font-bold" style={{ color: "#f59e0b" }}>VS</div>
                  )}
                </div>
                <div className="flex-1 text-center">
                  <div className="text-sm font-bold" style={{ color: activeDuel.phase === "done" && activeDuel.result?.winner === activeDuel.d.name ? "#10b981" : "rgba(255,255,255,0.7)" }}>
                    {activeDuel.d.name}
                  </div>
                  <div className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>{activeDuel.d.provider} · Elo {activeDuel.d.elo}</div>
                  {activeDuel.phase === "done" && activeDuel.result?.winner === activeDuel.d.name && (
                    <m.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full" style={{ background: "rgba(16,185,129,0.12)", color: "#10b981" }}>
                      <Crown className="w-3 h-3" /> <span className="text-[10px] font-bold">Winner</span>
                    </m.div>
                  )}
                </div>
              </div>
              {activeDuel.phase === "done" && activeDuel.result && (
                <div className="mt-3 flex justify-center gap-4 text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>
                  <span>Score: {activeDuel.result.scoreA.toFixed(1)} vs {activeDuel.result.scoreB.toFixed(1)}</span>
                  <span>Domain: {activeDuel.result.domain}</span>
                </div>
              )}
            </m.div>
          )}
        </AnimatePresence>

        <div className="flex gap-2 mb-4">
          {(["leaderboard", "history"] as const).map(v => (
            <button key={v} onClick={() => setSelectedView(v)} className="px-3 py-1.5 rounded-lg text-[11px] font-medium capitalize"
              style={{ background: selectedView === v ? "rgba(245,158,11,0.12)" : "rgba(255,255,255,0.02)", color: selectedView === v ? "#f59e0b" : "rgba(255,255,255,0.4)", border: `1px solid ${selectedView === v ? "rgba(245,158,11,0.2)" : "rgba(255,255,255,0.04)"}` }}>
              {v}
            </button>
          ))}
        </div>

        {selectedView === "leaderboard" ? (
          <div className="rounded-lg overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.04)" }}>
            <div className="grid grid-cols-[40px_1fr_80px_70px_70px_70px_80px_80px] gap-2 px-4 py-2" style={{ background: "rgba(255,255,255,0.02)" }}>
              {["#", "Model", "Elo", "W", "L", "D", "Latency", "$/1k"].map(h => (
                <span key={h} className="text-[9px] uppercase tracking-wider font-medium" style={{ color: "rgba(255,255,255,0.2)" }}>{h}</span>
              ))}
            </div>
            {sorted.map((model, i) => (
              <m.div key={model.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                className="grid grid-cols-[40px_1fr_80px_70px_70px_70px_80px_80px] gap-2 px-4 py-2.5 items-center"
                style={{ background: i % 2 === 0 ? "rgba(255,255,255,0.01)" : "transparent", borderBottom: "1px solid rgba(255,255,255,0.02)" }}>
                <span className="text-[12px] font-bold tabular-nums" style={{ color: i < 3 ? "#f59e0b" : "rgba(255,255,255,0.25)" }}>
                  {i === 0 ? "\u{1F947}" : i === 1 ? "\u{1F948}" : i === 2 ? "\u{1F949}" : `#${i + 1}`}
                </span>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: model.color }} />
                  <span className="text-[11px] font-semibold" style={{ color: "rgba(255,255,255,0.75)" }}>{model.name}</span>
                  <span className="text-[9px]" style={{ color: "rgba(255,255,255,0.2)" }}>{model.provider}</span>
                  {model.status === "degraded" && <span className="text-[8px] px-1 py-0.5 rounded" style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444" }}>degraded</span>}
                  {model.status === "canary" && <span className="text-[8px] px-1 py-0.5 rounded" style={{ background: "rgba(245,158,11,0.1)", color: "#f59e0b" }}>canary</span>}
                </div>
                <span className="text-[12px] font-bold tabular-nums" style={{ color: model.color }}>{model.elo}</span>
                <span className="text-[11px] tabular-nums" style={{ color: "#10b981" }}>{model.wins}</span>
                <span className="text-[11px] tabular-nums" style={{ color: "#ef4444" }}>{model.losses}</span>
                <span className="text-[11px] tabular-nums" style={{ color: "rgba(255,255,255,0.3)" }}>{model.draws}</span>
                <span className="text-[10px] tabular-nums" style={{ color: "rgba(255,255,255,0.4)" }}>{model.avgLatency}ms</span>
                <span className="text-[10px] tabular-nums" style={{ color: "rgba(255,255,255,0.4)" }}>${model.costPer1k.toFixed(2)}</span>
              </m.div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {duels.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-[12px]" style={{ color: "rgba(255,255,255,0.3)" }}>No duels recorded yet. Click "Run Duel" to start.</p>
              </div>
            ) : duels.map((d, i) => (
              <m.div key={d.id} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 px-4 py-3 rounded-lg" style={{ background: "rgba(255,255,255,0.015)", border: "1px solid rgba(255,255,255,0.03)" }}>
                <span className="text-[11px] font-semibold" style={{ color: d.winner === d.modelA ? "#10b981" : "rgba(255,255,255,0.5)" }}>{d.modelA}</span>
                <ArrowRight className="w-3 h-3" style={{ color: "rgba(255,255,255,0.15)" }} />
                <span className="text-[11px] font-semibold" style={{ color: d.winner === d.modelB ? "#10b981" : "rgba(255,255,255,0.5)" }}>{d.modelB}</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded-full ml-auto" style={{ background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.3)" }}>{d.domain}</span>
                <span className="text-[10px] tabular-nums" style={{ color: "#f59e0b" }}>{d.scoreA.toFixed(1)} vs {d.scoreB.toFixed(1)}</span>
              </m.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
