import { useState, useEffect, memo, useMemo } from "react";
import { m, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import {
  Trophy, GitMerge, Shield, Brain, DollarSign,
  Image, Wand2, BarChart3, Package, HeartPulse,
  Zap, ArrowRight, Cpu, Activity, Signal, TrendingUp,
  ChevronRight
} from "lucide-react";

const FORGE_SECTIONS = [
  { id: "arena", label: "Model Benchmarks", icon: Trophy, color: "#f59e0b", href: "/nuro-forge/arena", desc: "Head-to-head model benchmarking with performance ranking", stat: "12 models", metric: "2,847 tests" },
  { id: "composition", label: "Model Composition", icon: GitMerge, color: "#8b5cf6", href: "/nuro-forge/composition", desc: "Autonomous pipeline construction & self-optimization", stat: "8 pipelines", metric: "94.2% quality" },
  { id: "governance", label: "Governance & Safety", icon: Shield, color: "#3b82f6", href: "/nuro-forge/governance", desc: "Bias detection, hallucination scoring, audit trails", stat: "100% audited", metric: "0 violations" },
  { id: "fine-tuning", label: "Federated Fine-Tuning", icon: Brain, color: "#ec4899", href: "/nuro-forge/fine-tuning", desc: "Domain-isolated learning signals & model improvement", stat: "9 domains", metric: "+12.4% accuracy" },
  { id: "cost", label: "Cost Intelligence", icon: DollarSign, color: "#10b981", href: "/nuro-forge/cost", desc: "Per-request cost tracking & optimal routing", stat: "$0.003/req", metric: "-34% cost" },
  { id: "multimodal", label: "Multimodal Hub", icon: Image, color: "#06b6d4", href: "/nuro-forge/multimodal", desc: "Unified text, vision, audio, code interface", stat: "5 modalities", metric: "142ms p50" },
  { id: "prompts", label: "Prompt Studio", icon: Wand2, color: "#d4a054", href: "/nuro-forge/prompts", desc: "Version-controlled prompts with A/B testing", stat: "234 prompts", metric: "18 active tests" },
  { id: "observatory", label: "Performance Observatory", icon: BarChart3, color: "#f97316", href: "/nuro-forge/observatory", desc: "Real-time model accuracy, latency, drift detection", stat: "99.8% SLA", metric: "0 regressions" },
  { id: "blueprints", label: "Blueprint Marketplace", icon: Package, color: "#a855f7", href: "/nuro-forge/blueprints", desc: "Pre-built intelligence packages per vertical", stat: "9 blueprints", metric: "1-click deploy" },
  { id: "self-healing", label: "Self-Healing Infra", icon: HeartPulse, color: "#ef4444", href: "/nuro-forge/self-healing", desc: "Auto-failover, canary deploys, zero-downtime swaps", stat: "99.99% up", metric: "0 incidents" },
];

const ModelActivityFeed = memo(function ModelActivityFeed() {
  const events = useMemo(() => [
    { model: "Claude 4 Sonnet", action: "Outperformed GPT-5.2", domain: "Legal", time: "2s ago", color: "#8b5cf6" },
    { model: "Qwen3-8B", action: "Inference: 142ms", domain: "Maritime", time: "5s ago", color: "#06b6d4" },
    { model: "GPT-5.2", action: "Promoted to production", domain: "Financial", time: "12s ago", color: "#10b981" },
    { model: "Gemini 2.5 Pro", action: "Governance check passed", domain: "Advisory", time: "18s ago", color: "#3b82f6" },
    { model: "Llama 4 Scout", action: "Fine-tune +3.2% accuracy", domain: "Cyber", time: "25s ago", color: "#f59e0b" },
    { model: "Mistral Large", action: "Cost optimized: -18%", domain: "Real Estate", time: "31s ago", color: "#d4a054" },
  ], []);
  const [visibleIdx, setVisibleIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setVisibleIdx(p => (p + 1) % events.length), 3000);
    return () => clearInterval(t);
  }, [events.length]);
  return (
    <div className="space-y-1">
      <AnimatePresence mode="popLayout">
        {events.slice(visibleIdx, visibleIdx + 4).map(e => (
          <m.div key={e.model + e.action} layout initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
            className="flex items-center gap-3 px-3 py-2 rounded-md" style={{ background: "rgba(255,255,255,0.015)", border: "1px solid rgba(255,255,255,0.03)" }}>
            <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: e.color }} />
            <span className="text-[11px] font-semibold" style={{ color: e.color }}>{e.model}</span>
            <span className="text-[10px] flex-1 truncate" style={{ color: "rgba(255,255,255,0.4)" }}>{e.action}</span>
            <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.25)" }}>{e.domain}</span>
            <span className="text-[9px]" style={{ color: "rgba(255,255,255,0.15)" }}>{e.time}</span>
          </m.div>
        ))}
      </AnimatePresence>
    </div>
  );
});

function PerformanceLeaderboard() {
  const models = [
    { name: "Claude 4 Sonnet", elo: 1847, provider: "Anthropic", trend: "+12", color: "#8b5cf6" },
    { name: "GPT-5.2", elo: 1823, provider: "OpenAI", trend: "+8", color: "#10b981" },
    { name: "Gemini 2.5 Pro", elo: 1798, provider: "Google", trend: "+5", color: "#3b82f6" },
    { name: "Qwen3-8B", elo: 1756, provider: "Alibaba", trend: "+18", color: "#06b6d4" },
    { name: "Llama 4 Scout", elo: 1734, provider: "Meta", trend: "-3", color: "#f59e0b" },
    { name: "Mistral Large", elo: 1721, provider: "Mistral", trend: "+2", color: "#d4a054" },
  ];
  return (
    <div className="space-y-1.5">
      {models.map((m, i) => (
        <div key={m.name} className="flex items-center gap-3 px-3 py-2 rounded-md" style={{ background: "rgba(255,255,255,0.015)", border: "1px solid rgba(255,255,255,0.03)" }}>
          <span className="text-[11px] font-bold w-5 text-right tabular-nums" style={{ color: i === 0 ? "#f59e0b" : "rgba(255,255,255,0.25)" }}>#{i + 1}</span>
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: m.color }} />
          <span className="text-[11px] font-semibold flex-1" style={{ color: "rgba(255,255,255,0.7)" }}>{m.name}</span>
          <span className="text-[9px]" style={{ color: "rgba(255,255,255,0.2)" }}>{m.provider}</span>
          <span className="text-[12px] font-bold tabular-nums" style={{ color: m.color }}>{m.elo}</span>
          <span className="text-[9px] font-medium" style={{ color: m.trend.startsWith("+") ? "#10b981" : "#ef4444" }}>{m.trend}</span>
        </div>
      ))}
    </div>
  );
}

export default function NuroForgeDashboard() {
  const [totalInferences, setTotalInferences] = useState(184729);

  useEffect(() => {
    const t = setInterval(() => setTotalInferences(p => p + Math.floor(Math.random() * 5)), 2000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="min-h-screen" style={{ background: "#070a10" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <m.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(212,160,84,0.12)", border: "1px solid rgba(212,160,84,0.2)" }}>
              <Cpu className="w-4 h-4" style={{ color: "#d4a054" }} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight" style={{ color: "rgba(255,255,255,0.9)" }}>Model Lab</h1>
              <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.3)" }}>AI Model Intelligence Platform</p>
            </div>
            <span className="ml-2 px-2 py-0.5 rounded text-[9px] font-semibold tracking-wider"
              style={{ background: "linear-gradient(135deg, rgba(212,160,84,0.2), rgba(212,160,84,0.08))", color: "#d4a054", border: "1px solid rgba(212,160,84,0.2)" }}>ACTIVE</span>
          </div>
        </m.div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: "Models Active", value: "12", icon: Cpu, color: "#d4a054" },
            { label: "Total Inferences", value: totalInferences.toLocaleString(), icon: Zap, color: "#8b5cf6" },
            { label: "Avg Latency", value: "142ms", icon: Activity, color: "#06b6d4" },
            { label: "Cost / Request", value: "$0.003", icon: DollarSign, color: "#10b981" },
          ].map(s => (
            <m.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="rounded-lg p-3" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
              <div className="flex items-center gap-2 mb-2">
                <s.icon className="w-3.5 h-3.5" style={{ color: s.color }} />
                <span className="text-[10px] font-medium" style={{ color: "rgba(255,255,255,0.3)" }}>{s.label}</span>
              </div>
              <div className="text-lg font-bold tabular-nums" style={{ color: "rgba(255,255,255,0.85)" }}>{s.value}</div>
            </m.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
          <m.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}
            className="rounded-lg p-4" style={{ background: "rgba(255,255,255,0.015)", border: "1px solid rgba(255,255,255,0.04)" }}>
            <h2 className="text-[13px] font-semibold mb-3 flex items-center gap-2" style={{ color: "rgba(255,255,255,0.65)" }}>
              <Trophy className="w-4 h-4" style={{ color: "#f59e0b" }} />
              Performance Rankings
            </h2>
            <PerformanceLeaderboard />
          </m.div>

          <m.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.15 }}
            className="rounded-lg p-4" style={{ background: "rgba(255,255,255,0.015)", border: "1px solid rgba(255,255,255,0.04)" }}>
            <h2 className="text-[13px] font-semibold mb-3 flex items-center gap-2" style={{ color: "rgba(255,255,255,0.65)" }}>
              <Signal className="w-4 h-4" style={{ color: "#8b5cf6" }} />
              Model Activity
            </h2>
            <ModelActivityFeed />
          </m.div>
        </div>

        <m.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <h2 className="text-[13px] font-semibold mb-4 flex items-center gap-2" style={{ color: "rgba(255,255,255,0.65)" }}>
            <Zap className="w-4 h-4" style={{ color: "#d4a054" }} />
            Module Overview
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
            {FORGE_SECTIONS.map((section, i) => (
              <Link key={section.id} href={section.href}>
                <m.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 + i * 0.04 }}
                  whileHover={{ scale: 1.02, y: -2 }}
                  className="rounded-lg p-4 cursor-pointer group h-full"
                  style={{ background: "rgba(255,255,255,0.02)", border: `1px solid rgba(255,255,255,0.04)` }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 rounded-md flex items-center justify-center"
                      style={{ background: `${section.color}12`, border: `1px solid ${section.color}20` }}>
                      <section.icon className="w-3.5 h-3.5" style={{ color: section.color }} />
                    </div>
                    <ChevronRight className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: section.color }} />
                  </div>
                  <h3 className="text-[12px] font-semibold mb-1" style={{ color: "rgba(255,255,255,0.75)" }}>{section.label}</h3>
                  <p className="text-[10px] mb-3 leading-relaxed" style={{ color: "rgba(255,255,255,0.3)" }}>{section.desc}</p>
                  <div className="flex items-center justify-between pt-2" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                    <span className="text-[10px] font-medium tabular-nums" style={{ color: section.color }}>{section.stat}</span>
                    <span className="text-[9px]" style={{ color: "rgba(255,255,255,0.2)" }}>{section.metric}</span>
                  </div>
                </m.div>
              </Link>
            ))}
          </div>
        </m.div>

        <div className="text-center py-6 mt-4">
          <p className="text-[9px] uppercase tracking-[0.25em]" style={{ color: "rgba(255,255,255,0.08)" }}>
            Model Lab — AI Model Intelligence Platform — SZL Holdings
          </p>
        </div>
      </div>
    </div>
  );
}
