import { useState, useEffect, useCallback } from "react";
import { m, AnimatePresence } from "framer-motion";
import { Trophy, Swords, ArrowRight, Crown, TrendingUp, TrendingDown, RotateCcw, Play, Check, X } from "lucide-react";
import { getNuroForgeModels, runModelDuel, type NuroModel } from "@/lib/nuro-forge-service";

type Model = NuroModel;

interface DuelResult { challenger: string; defender: string; winner: string; criterion: string; score: string; timestamp: number; }

export default function TournamentArenaPage() {
  const [models, setModels] = useState(() => getNuroForgeModels());
  const [duels, setDuels] = useState<DuelResult[]>([]);
  const [activeDuel, setActiveDuel] = useState<{ c: Model; d: Model; criterion: string; phase: "selecting" | "running" | "done"; winner?: string } | null>(null);
  const [totalDuels, setTotalDuels] = useState(2847);
  const [selectedView, setSelectedView] = useState<"leaderboard" | "history">("leaderboard");

  const criteria = ["Accuracy", "Latency", "Cost-efficiency", "Safety", "Reasoning", "Summarization", "Code Generation", "Legal Analysis", "Maritime Intel"];

  const runDuel = useCallback(() => {
    const c = models[Math.floor(Math.random() * models.length)];
    let d = models[Math.floor(Math.random() * models.length)];
    while (d.id === c.id) d = models[Math.floor(Math.random() * models.length)];
    const criterion = criteria[Math.floor(Math.random() * criteria.length)];
    setActiveDuel({ c, d, criterion, phase: "running" });

    setTimeout(() => {
      const winner = Math.random() > 0.5 ? c : d;
      const score = `${(70 + Math.random() * 28).toFixed(1)}% vs ${(50 + Math.random() * 30).toFixed(1)}%`;
      setActiveDuel({ c, d, criterion, phase: "done", winner: winner.id });
      setDuels(prev => [{ challenger: c.name, defender: d.name, winner: winner.name, criterion, score, timestamp: Date.now() }, ...prev].slice(0, 20));
      setModels(prev => prev.map(m => {
        if (m.id === winner.id) return { ...m, elo: m.elo + Math.floor(Math.random() * 8 + 2), wins: m.wins + 1 };
        if (m.id === (winner.id === c.id ? d.id : c.id)) return { ...m, elo: Math.max(1500, m.elo - Math.floor(Math.random() * 6 + 1)), losses: m.losses + 1 };
        return m;
      }).sort((a, b) => b.elo - a.elo));
      setTotalDuels(p => p + 1);
    }, 2000);
  }, [models, criteria]);

  useEffect(() => {
    const t = setInterval(runDuel, 8000);
    return () => clearInterval(t);
  }, [runDuel]);

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
          <button onClick={runDuel} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-medium"
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
                  {activeDuel.phase === "running" ? "Duel in Progress" : "Duel Complete"} — {activeDuel.criterion}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex-1 text-center">
                  <div className="text-sm font-bold" style={{ color: activeDuel.phase === "done" && activeDuel.winner === activeDuel.c.id ? "#10b981" : "rgba(255,255,255,0.7)" }}>
                    {activeDuel.c.name}
                  </div>
                  <div className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>{activeDuel.c.provider} · Elo {activeDuel.c.elo}</div>
                  {activeDuel.phase === "done" && activeDuel.winner === activeDuel.c.id && (
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
                  <div className="text-sm font-bold" style={{ color: activeDuel.phase === "done" && activeDuel.winner === activeDuel.d.id ? "#10b981" : "rgba(255,255,255,0.7)" }}>
                    {activeDuel.d.name}
                  </div>
                  <div className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>{activeDuel.d.provider} · Elo {activeDuel.d.elo}</div>
                  {activeDuel.phase === "done" && activeDuel.winner === activeDuel.d.id && (
                    <m.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full" style={{ background: "rgba(16,185,129,0.12)", color: "#10b981" }}>
                      <Crown className="w-3 h-3" /> <span className="text-[10px] font-bold">Winner</span>
                    </m.div>
                  )}
                </div>
              </div>
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
                  {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
                </span>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: model.color }} />
                  <span className="text-[11px] font-semibold" style={{ color: "rgba(255,255,255,0.75)" }}>{model.name}</span>
                  <span className="text-[9px]" style={{ color: "rgba(255,255,255,0.2)" }}>{model.provider}</span>
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
              <m.div key={i} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 px-4 py-3 rounded-lg" style={{ background: "rgba(255,255,255,0.015)", border: "1px solid rgba(255,255,255,0.03)" }}>
                <span className="text-[11px] font-semibold" style={{ color: d.winner === d.challenger ? "#10b981" : "rgba(255,255,255,0.5)" }}>{d.challenger}</span>
                <ArrowRight className="w-3 h-3" style={{ color: "rgba(255,255,255,0.15)" }} />
                <span className="text-[11px] font-semibold" style={{ color: d.winner === d.defender ? "#10b981" : "rgba(255,255,255,0.5)" }}>{d.defender}</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded-full ml-auto" style={{ background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.3)" }}>{d.criterion}</span>
                <span className="text-[10px] tabular-nums" style={{ color: "#f59e0b" }}>{d.score}</span>
              </m.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
