import { useState, useEffect, useCallback } from "react";
import { m, AnimatePresence } from "framer-motion";
import { Trophy, Swords, ArrowRight, Crown, TrendingUp, TrendingDown, RotateCcw, Play, Check, X } from "lucide-react";

interface Model {
  id: string; name: string; provider: string; elo: number; wins: number; losses: number; draws: number; color: string;
  specialties: string[]; avgLatency: number; costPer1k: number;
}

const MODELS: Model[] = [
  { id: "claude-4", name: "Claude 4 Sonnet", provider: "Anthropic", elo: 1847, wins: 312, losses: 89, draws: 24, color: "#8b5cf6", specialties: ["Legal", "Analysis"], avgLatency: 1240, costPer1k: 3.00 },
  { id: "gpt-5.2", name: "GPT-5.2", provider: "OpenAI", elo: 1823, wins: 298, losses: 102, draws: 31, color: "#10b981", specialties: ["General", "Code"], avgLatency: 980, costPer1k: 5.00 },
  { id: "gemini-2.5", name: "Gemini 2.5 Pro", provider: "Google", elo: 1798, wins: 267, losses: 118, draws: 28, color: "#3b82f6", specialties: ["Multimodal", "Research"], avgLatency: 1100, costPer1k: 3.50 },
  { id: "qwen3-8b", name: "Qwen3-8B", provider: "Alibaba", elo: 1756, wins: 245, losses: 134, draws: 19, color: "#06b6d4", specialties: ["Speed", "Maritime"], avgLatency: 142, costPer1k: 0.50 },
  { id: "llama-4", name: "Llama 4 Scout", provider: "Meta", elo: 1734, wins: 231, losses: 148, draws: 22, color: "#f59e0b", specialties: ["Open-source", "Cyber"], avgLatency: 280, costPer1k: 0.20 },
  { id: "mistral-lg", name: "Mistral Large", provider: "Mistral", elo: 1721, wins: 218, losses: 156, draws: 18, color: "#d4a054", specialties: ["European", "Finance"], avgLatency: 350, costPer1k: 0.80 },
  { id: "deepseek-v3", name: "DeepSeek V3", provider: "DeepSeek", elo: 1698, wins: 204, losses: 167, draws: 15, color: "#ec4899", specialties: ["Reasoning", "Math"], avgLatency: 420, costPer1k: 0.30 },
  { id: "command-r+", name: "Command R+", provider: "Cohere", elo: 1682, wins: 195, losses: 178, draws: 12, color: "#64748b", specialties: ["RAG", "Enterprise"], avgLatency: 560, costPer1k: 1.20 },
  { id: "phi-4", name: "Phi-4 Mini", provider: "Microsoft", elo: 1654, wins: 183, losses: 192, draws: 10, color: "#0ea5e9", specialties: ["Edge", "Compact"], avgLatency: 95, costPer1k: 0.10 },
  { id: "grok-3", name: "Grok 3", provider: "xAI", elo: 1641, wins: 176, losses: 198, draws: 14, color: "#a855f7", specialties: ["Real-time", "Social"], avgLatency: 780, costPer1k: 2.00 },
  { id: "claude-3.5-h", name: "Claude 3.5 Haiku", provider: "Anthropic", elo: 1628, wins: 168, losses: 205, draws: 8, color: "#f472b6", specialties: ["Fast", "Concise"], avgLatency: 180, costPer1k: 0.25 },
  { id: "nova-pro", name: "Nova Pro", provider: "Amazon", elo: 1612, wins: 162, losses: 214, draws: 11, color: "#f97316", specialties: ["AWS", "Integration"], avgLatency: 620, costPer1k: 1.50 },
];

interface DuelResult { challenger: string; defender: string; winner: string; criterion: string; score: string; timestamp: number; }

export default function TournamentArenaPage() {
  const [models, setModels] = useState(MODELS);
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
