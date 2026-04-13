import { useState, useEffect, useRef } from "react";
import { m, AnimatePresence } from "framer-motion";
import {
  Brain, Shield, Network, Database, Layers, Activity,
  Eye, Lock, Terminal, ChevronRight, Cpu,
  TrendingUp, Workflow, Binary, Orbit, Sparkles, Crown,
  ArrowRight, Play, Swords,
} from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";

const fadeUp = { hidden: { opacity: 0, y: 28 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6 } } };
const stagger = { visible: { transition: { staggerChildren: 0.07 } } };

function NeuralCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nodesRef = useRef<{ x: number; y: number; vx: number; vy: number; r: number; layer: number; pulse: number }[]>([]);
  const frameRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth * 2;
      canvas.height = canvas.offsetHeight * 2;
      ctx.scale(2, 2);
    };
    resize();
    window.addEventListener("resize", resize);

    const LAYER_COLORS = [
      "rgba(59,130,246,", "rgba(139,92,246,", "rgba(236,72,153,",
      "rgba(245,158,11,", "rgba(16,185,129,", "rgba(6,182,212,",
    ];

    const w = canvas.offsetWidth;
    const h = canvas.offsetHeight;
    const nodes: typeof nodesRef.current = [];
    for (let i = 0; i < 80; i++) {
      const layer = Math.floor(Math.random() * 6);
      nodes.push({
        x: Math.random() * w, y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() - 0.5) * 0.4,
        r: 1.5 + Math.random() * 2, layer, pulse: Math.random() * Math.PI * 2,
      });
    }
    nodesRef.current = nodes;

    let running = true;
    const draw = () => {
      if (!running) return;
      const W = canvas.offsetWidth;
      const H = canvas.offsetHeight;
      ctx.clearRect(0, 0, W, H);
      const t = Date.now() * 0.001;

      for (const n of nodes) {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0 || n.x > W) n.vx *= -1;
        if (n.y < 0 || n.y > H) n.vy *= -1;
        n.pulse += 0.02;
      }

      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            const alpha = (1 - dist / 120) * 0.15;
            const isSameLayer = nodes[i].layer === nodes[j].layer;
            const color = isSameLayer
              ? LAYER_COLORS[nodes[i].layer]
              : "rgba(255,255,255,";
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.strokeStyle = `${color}${alpha})`;
            ctx.lineWidth = isSameLayer ? 1 : 0.5;
            ctx.stroke();
          }
        }
      }

      for (const n of nodes) {
        const glow = 0.5 + Math.sin(n.pulse) * 0.3;
        const color = LAYER_COLORS[n.layer];
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r * (1 + Math.sin(n.pulse) * 0.3), 0, Math.PI * 2);
        ctx.fillStyle = `${color}${glow})`;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r * 3, 0, Math.PI * 2);
        ctx.fillStyle = `${color}${glow * 0.15})`;
        ctx.fill();
      }

      const centerX = W / 2;
      const centerY = H / 2;
      for (let l = 0; l < 6; l++) {
        const radius = 60 + l * 40 + Math.sin(t + l) * 8;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.strokeStyle = `${LAYER_COLORS[l]}${0.08 + Math.sin(t * 0.5 + l) * 0.04})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      frameRef.current = requestAnimationFrame(draw);
    };
    draw();

    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !running) { running = true; draw(); }
      else if (!entry.isIntersecting) { running = false; cancelAnimationFrame(frameRef.current); }
    });
    obs.observe(canvas);

    return () => { running = false; cancelAnimationFrame(frameRef.current); obs.disconnect(); window.removeEventListener("resize", resize); };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />;
}

const SOVEREIGNTY_LAYERS = [
  {
    id: "cognitive",
    title: "Cognitive Sovereignty",
    subtitle: "Beyond Agentic — Autonomous Reasoning with Bounded Authority",
    icon: Crown,
    color: "#f59e0b",
    description: "The layer above agentic AI. Agents don't just execute — they reason, challenge, dissent, and self-correct within governed authority boundaries. Every decision carries a provenance chain.",
    capabilities: [
      "Multi-agent deliberative reasoning with structured dissent",
      "Confidence-calibrated decision outputs (IC tradecraft standards)",
      "Autonomous hypothesis generation and competing analysis",
      "Bounded authority enforcement — agents know their limits",
    ],
    sources: ["CIA Analytic Tradecraft", "Palantir AIP Agent Studio", "CrowdStrike Charlotte AI"],
  },
  {
    id: "fusion",
    title: "Cross-Domain Fusion",
    subtitle: "Five Industries. One Knowledge Graph. Zero Silos.",
    icon: Orbit,
    color: "#ec4899",
    description: "No platform on Earth fuses maritime intelligence, cyber defense, real estate analytics, legal operations, and business observability into a single traversable ontology. Alloy does.",
    capabilities: [
      "Entity resolution across vessel → owner → property → litigation → cyber exposure",
      "Cross-domain anomaly correlation (vessel behavior ↔ sanctions ↔ property transfers)",
      "Unified knowledge graph with 600+ entity types and relationship models",
      "Real-time signal propagation across domain boundaries",
    ],
    sources: ["Palantir Ontology", "Windward Maritime AI", "Anduril Lattice Sensemaking"],
  },
  {
    id: "autonomy",
    title: "Autonomous Decision Fabric",
    subtitle: "From Insight to Action — Governed, Auditable, Reversible",
    icon: Workflow,
    color: "#8b5cf6",
    description: "Inspired by Anduril's mesh autonomy and CrowdStrike's bounded SOC agents. Alloy agents don't just recommend — they act within policy guardrails, with full audit trails and rollback capability.",
    capabilities: [
      "Policy-gated autonomous execution (human-in-the-loop at configurable thresholds)",
      "Multi-agent consensus before high-impact actions",
      "Full decision provenance — every action traceable to source signals",
      "Reversible operations with automatic rollback triggers",
    ],
    sources: ["Anduril Lattice Mission Autonomy", "CrowdStrike Agentic SOAR", "Datadog Bits AI SRE"],
  },
  {
    id: "simulation",
    title: "Digital Twin Wargaming",
    subtitle: "Simulate Any Scenario Before Committing Resources",
    icon: Swords,
    color: "#3b82f6",
    description: "Defense-grade scenario simulation applied to business operations. Run Monte Carlo simulations across your entire portfolio — vessels, properties, legal matters, threat landscapes — before making decisions.",
    capabilities: [
      "Portfolio-wide Monte Carlo simulation with probabilistic outcomes",
      "Adversarial scenario planning (threat actors, market shifts, regulatory changes)",
      "Time-horizon modeling: 24h, 7d, 30d, 90d impact projections",
      "What-if analysis across all five domains simultaneously",
    ],
    sources: ["DOD Digital Twin Programs", "Scale Donovan Wargaming", "Palantir AIP Simulations"],
  },
  {
    id: "observability",
    title: "Self-Healing Operations",
    subtitle: "The System That Watches Itself",
    icon: Activity,
    color: "#10b981",
    description: "Inspired by Datadog's Bits AI autonomous remediation. Alloy monitors its own health, detects anomalies in agent behavior, auto-tunes model performance, and self-corrects before operators notice.",
    capabilities: [
      "Agent performance degradation detection and auto-tuning",
      "Token cost optimization with automatic model routing",
      "Anomaly detection on the AI system itself (meta-observability)",
      "Self-healing pipelines with automatic failover and retry strategies",
    ],
    sources: ["Datadog Bits AI", "CrowdStrike Charlotte AI Triage", "Palantir Apollo"],
  },
  {
    id: "sovereignty",
    title: "Data & Model Sovereignty",
    subtitle: "Your Data. Your Models. Your Rules. Always.",
    icon: Shield,
    color: "#06b6d4",
    description: "In an era where every platform wants your data, Alloy guarantees sovereign control. Your ontology, your models, your decision boundaries — never leaving your perimeter without explicit authorization.",
    capabilities: [
      "Air-gapped deployment capability (no cloud dependency required)",
      "Model provenance tracking — every prediction traceable to training data",
      "Classification-aware data handling (UNCLASSIFIED through TS/SCI concepts)",
      "Zero-trust agent architecture — every tool call scoped by JWT + RBAC + data labels",
    ],
    sources: ["CIA AI Governance Framework", "Scale Donovan FedRAMP", "NSA Zero Trust Architecture"],
  },
];

const COMPETITIVE_MATRIX = [
  { capability: "Cross-Domain Ontology (5+ industries)", alloy: true, palantir: "partial", anduril: false, crowdstrike: false, datadog: false, windward: false },
  { capability: "Agentic AI with Bounded Authority", alloy: true, palantir: true, anduril: "partial", crowdstrike: true, datadog: true, windward: false },
  { capability: "Multi-Agent Deliberative Consensus", alloy: true, palantir: false, anduril: false, crowdstrike: false, datadog: false, windward: false },
  { capability: "Digital Twin Wargaming (Business)", alloy: true, palantir: "partial", anduril: true, crowdstrike: false, datadog: false, windward: false },
  { capability: "Self-Healing AI Operations", alloy: true, palantir: false, anduril: false, crowdstrike: "partial", datadog: true, windward: false },
  { capability: "MCP / A2A Protocol Support", alloy: true, palantir: false, anduril: false, crowdstrike: false, datadog: false, windward: false },
  { capability: "Maritime + Cyber + Legal Fusion", alloy: true, palantir: false, anduril: false, crowdstrike: false, datadog: false, windward: false },
  { capability: "IC Tradecraft Standards (ACH, Confidence Scoring)", alloy: true, palantir: "partial", anduril: false, crowdstrike: false, datadog: false, windward: false },
  { capability: "Sovereign/Air-Gapped Deployment", alloy: true, palantir: true, anduril: true, crowdstrike: "partial", datadog: false, windward: false },
  { capability: "Decision Provenance + Proof Chain", alloy: true, palantir: "partial", anduril: false, crowdstrike: false, datadog: false, windward: false },
];

function CompetitorCell({ value }: { value: boolean | string }) {
  if (value === true) return <div className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center"><div className="w-2 h-2 rounded-full bg-emerald-400" /></div>;
  if (value === "partial") return <div className="w-5 h-5 rounded-full bg-yellow-500/15 border border-yellow-500/30 flex items-center justify-center"><div className="w-2 h-2 rounded-full bg-yellow-400/70" /></div>;
  return <div className="w-5 h-5 rounded-full bg-white/5 border border-white/10" />;
}

const DECISION_TIMELINE = [
  { time: "00:00", event: "Anomalous vessel behavior detected in South China Sea", agent: "Maritime Sentinel", domain: "vessels", color: "#3b82f6" },
  { time: "00:03", event: "Cross-reference: vessel owner linked to sanctioned entity via property records", agent: "Entity Resolver", domain: "fusion", color: "#ec4899" },
  { time: "00:05", event: "Cyber threat correlation: owner's network shows active C2 beaconing", agent: "Threat Analyst", domain: "cyber", color: "#ef4444" },
  { time: "00:08", event: "Legal review: pending litigation in 3 jurisdictions on related entities", agent: "Legal Intelligence", domain: "legal", color: "#8b5cf6" },
  { time: "00:12", event: "Wargame simulation: 4 scenarios modeled, 3 indicate escalation within 72h", agent: "Scenario Engine", domain: "simulation", color: "#f59e0b" },
  { time: "00:15", event: "Consensus reached: 4/5 agents recommend immediate escalation to operator", agent: "Consensus Chamber", domain: "decision", color: "#10b981" },
  { time: "00:16", event: "Decision brief generated with IC-standard confidence scoring", agent: "Cognitive Fabric", domain: "output", color: "#06b6d4" },
];

function LiveDecisionTimeline() {
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisibleCount((c) => {
        if (c >= DECISION_TIMELINE.length) return c;
        return c + 1;
      });
    }, 1200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-0">
      {DECISION_TIMELINE.map((item, i) => (
        <m.div
          key={i}
          initial={{ opacity: 0, x: -20 }}
          animate={i < visibleCount ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
          transition={{ duration: 0.4 }}
          className="relative"
        >
          <div className="flex gap-4 py-3">
            <div className="flex flex-col items-center shrink-0">
              <div className="w-3 h-3 rounded-full border-2 shrink-0" style={{ borderColor: item.color, background: i < visibleCount ? `${item.color}40` : "transparent" }} />
              {i < DECISION_TIMELINE.length - 1 && <div className="w-px flex-1 min-h-[20px]" style={{ background: `linear-gradient(to bottom, ${item.color}40, transparent)` }} />}
            </div>
            <div className="flex-1 min-w-0 pb-2">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-mono tabular-nums" style={{ color: item.color }}>{item.time}s</span>
                <span className="text-[10px] font-mono text-white/30 px-1.5 py-0.5 rounded bg-white/5">{item.agent}</span>
              </div>
              <p className="text-sm text-white/70 leading-relaxed">{item.event}</p>
            </div>
          </div>
        </m.div>
      ))}
      {visibleCount >= DECISION_TIMELINE.length && (
        <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
          <div className="flex items-center gap-2 text-sm font-medium text-emerald-400">
            <Sparkles className="w-4 h-4" />
            16-second cross-domain intelligence fusion — from signal to decision brief
          </div>
        </m.div>
      )}
    </div>
  );
}

function PulsingOrb({ color, size = 12, delay = 0 }: { color: string; size?: number; delay?: number }) {
  return (
    <m.div
      animate={{ scale: [1, 1.3, 1], opacity: [0.6, 1, 0.6] }}
      transition={{ duration: 2, repeat: Infinity, delay }}
      className="rounded-full"
      style={{ width: size, height: size, background: color, boxShadow: `0 0 ${size}px ${color}40` }}
    />
  );
}

export default function CognitiveFabricPage() {
  usePageMeta({ title: "Alloy Cognitive Fabric — The Layer Above AI", description: "Beyond agentic AI. Autonomous reasoning, cross-domain fusion, and sovereign intelligence — the new standard." });
  const [activeLayer, setActiveLayer] = useState<string>("cognitive");

  const activeLayerData = SOVEREIGNTY_LAYERS.find(l => l.id === activeLayer)!;

  return (
    <div className="min-h-screen bg-[#050810] text-white">
      <SiteNav />

      <section className="relative pt-28 pb-24 overflow-hidden">
        <div className="absolute inset-0">
          <NeuralCanvas />
          <div className="absolute inset-0 bg-gradient-to-b from-[#050810]/40 via-[#050810]/70 to-[#050810]" />
        </div>

        <div className="relative max-w-6xl mx-auto px-6">
          <m.div initial="hidden" animate="visible" variants={stagger}>
            <m.div variants={fadeUp} className="flex items-center gap-3 mb-6">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20">
                <Crown className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[11px] font-semibold text-amber-300 tracking-wider uppercase">The New Layer</span>
              </div>
              <div className="h-px flex-1 max-w-[120px] bg-gradient-to-r from-amber-500/30 to-transparent" />
            </m.div>

            <m.h1 variants={fadeUp} className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 leading-[1.1]">
              <span className="bg-gradient-to-r from-white via-amber-50 to-amber-200 bg-clip-text text-transparent">
                Cognitive Fabric
              </span>
              <br />
              <span className="text-2xl md:text-3xl lg:text-4xl font-light text-white/30">
                The layer above agentic AI.
              </span>
            </m.h1>

            <m.p variants={fadeUp} className="text-lg md:text-xl text-white/45 max-w-3xl leading-relaxed mb-4">
              Palantir built the ontology. Anduril built the mesh. CrowdStrike built the autonomous SOC.
              Datadog built self-healing ops. The CIA built 300 AI analysts.
            </m.p>
            <m.p variants={fadeUp} className="text-lg md:text-xl text-white/65 max-w-3xl leading-relaxed mb-10 font-medium">
              Alloy fuses all of it into one sovereign intelligence fabric — and adds the layer none of them have.
            </m.p>

            <m.div variants={fadeUp} className="flex flex-wrap gap-4">
              <a href="#layers" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-amber-500/90 hover:bg-amber-400 text-black font-semibold transition-colors">
                <Layers className="w-4 h-4" /> Explore the Stack
              </a>
              <a href="#decision" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 font-medium transition-colors">
                <Play className="w-4 h-4" /> Watch 16-Second Fusion
              </a>
            </m.div>
          </m.div>
        </div>
      </section>

      <section className="py-16 border-t border-white/[0.04]">
        <div className="max-w-6xl mx-auto px-6">
          <m.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="text-center mb-12">
            <m.div variants={fadeUp} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-white/40 mb-4">
              Where we sit in the stack
            </m.div>
            <m.h2 variants={fadeUp} className="text-3xl md:text-4xl font-bold mb-4">
              AI isn't magic. It's a stack. <span className="text-amber-400">We're the crown.</span>
            </m.h2>
          </m.div>

          <m.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="max-w-2xl mx-auto space-y-0">
            {[
              { label: "Cognitive Sovereignty", sub: "Alloy Cognitive Fabric", color: "#f59e0b", isAlloy: true, icon: Crown },
              { label: "Agentic AI", sub: "Memory · Planning · Tool Use · Autonomous Execution", color: "#a78bfa", isAlloy: false, icon: Brain },
              { label: "Generative AI", sub: "LLMs · Diffusion Models · Multimodal", color: "#f472b6", isAlloy: false, icon: Sparkles },
              { label: "Deep Learning", sub: "Transformers · LSTMs · CNNs · Autoencoders", color: "#fb923c", isAlloy: false, icon: Binary },
              { label: "Neural Networks", sub: "Perceptrons · Backpropagation · Hidden Layers", color: "#34d399", isAlloy: false, icon: Network },
              { label: "Machine Learning", sub: "Supervised · Unsupervised · Reinforcement", color: "#60a5fa", isAlloy: false, icon: TrendingUp },
              { label: "Classical AI", sub: "Expert Systems · Knowledge Representation", color: "#94a3b8", isAlloy: false, icon: Cpu },
            ].map((layer, i) => (
              <m.div key={layer.label} variants={fadeUp}>
                <div className={`relative flex items-center gap-4 p-4 rounded-xl border transition-all ${
                  layer.isAlloy
                    ? "bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border-amber-500/30 shadow-lg shadow-amber-500/5"
                    : "bg-white/[0.02] border-white/[0.06] hover:border-white/[0.12]"
                }`}>
                  {layer.isAlloy && (
                    <div className="absolute -top-3 right-4 px-2 py-0.5 rounded-full bg-amber-500 text-[10px] font-bold text-black tracking-wider">
                      NEW LAYER
                    </div>
                  )}
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${layer.color}15`, border: `1px solid ${layer.color}30` }}>
                    <layer.icon className="w-5 h-5" style={{ color: layer.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold" style={{ color: layer.isAlloy ? layer.color : "rgba(255,255,255,0.9)" }}>{layer.label}</div>
                    <div className="text-xs text-white/30 truncate">{layer.sub}</div>
                  </div>
                  {layer.isAlloy && <PulsingOrb color={layer.color} size={10} />}
                  <div className="text-[10px] font-mono text-white/15 tabular-nums">L{7 - i}</div>
                </div>
                {i < 6 && (
                  <div className="flex justify-center py-0.5">
                    <div className="w-px h-3" style={{ background: `linear-gradient(to bottom, ${layer.color}20, transparent)` }} />
                  </div>
                )}
              </m.div>
            ))}
          </m.div>
        </div>
      </section>

      <section id="layers" className="py-20 border-t border-white/[0.04]">
        <div className="max-w-6xl mx-auto px-6">
          <m.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
            <m.div variants={fadeUp} className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Six Sovereignty Layers</h2>
              <p className="text-white/40 max-w-2xl mx-auto">Each layer takes the best from the world's most advanced platforms — and evolves it into something no one else has.</p>
            </m.div>

            <m.div variants={fadeUp} className="flex flex-wrap justify-center gap-2 mb-10">
              {SOVEREIGNTY_LAYERS.map((layer) => (
                <button
                  key={layer.id}
                  onClick={() => setActiveLayer(layer.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeLayer === layer.id
                      ? "bg-white/10 border border-white/20 text-white"
                      : "bg-white/[0.03] border border-white/[0.06] text-white/40 hover:text-white/60 hover:border-white/10"
                  }`}
                >
                  <layer.icon className="w-4 h-4" style={{ color: activeLayer === layer.id ? layer.color : undefined }} />
                  <span className="hidden sm:inline">{layer.title}</span>
                </button>
              ))}
            </m.div>

            <AnimatePresence mode="wait">
              <m.div
                key={activeLayer}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.3 }}
                className="grid md:grid-cols-2 gap-8"
              >
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: `${activeLayerData.color}15`, border: `1px solid ${activeLayerData.color}30` }}>
                        <activeLayerData.icon className="w-6 h-6" style={{ color: activeLayerData.color }} />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold">{activeLayerData.title}</h3>
                        <p className="text-sm text-white/40">{activeLayerData.subtitle}</p>
                      </div>
                    </div>
                    <p className="text-white/55 leading-relaxed">{activeLayerData.description}</p>
                  </div>

                  <div className="space-y-3">
                    {activeLayerData.capabilities.map((cap, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/[0.06]">
                        <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ background: `${activeLayerData.color}20` }}>
                          <ChevronRight className="w-3 h-3" style={{ color: activeLayerData.color }} />
                        </div>
                        <span className="text-sm text-white/70">{cap}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                    <div className="text-xs font-mono text-white/25 uppercase tracking-wider mb-3">Inspired By</div>
                    <div className="flex flex-wrap gap-2">
                      {activeLayerData.sources.map((src) => (
                        <span key={src} className="px-3 py-1.5 rounded-md bg-white/5 border border-white/10 text-xs text-white/50">{src}</span>
                      ))}
                    </div>
                  </div>

                  <div className="p-5 rounded-xl border" style={{ background: `${activeLayerData.color}05`, borderColor: `${activeLayerData.color}15` }}>
                    <div className="text-xs font-mono uppercase tracking-wider mb-3" style={{ color: `${activeLayerData.color}80` }}>Alloy Advantage</div>
                    <p className="text-sm text-white/60 leading-relaxed">
                      {activeLayer === "cognitive" && "While others build copilots that answer questions, Alloy builds agents that reason autonomously, challenge their own conclusions through structured dissent, and produce intelligence products calibrated to IC standards."}
                      {activeLayer === "fusion" && "Palantir ontology covers your org's data. Alloy's ontology covers five industries simultaneously — enabling intelligence connections that no single-domain platform can even conceptualize."}
                      {activeLayer === "autonomy" && "CrowdStrike and Datadog give agents bounded authority in one domain. Alloy agents execute governed actions across maritime, cyber, legal, real estate, and advisory — with cross-domain consensus protocols."}
                      {activeLayer === "simulation" && "Defense digital twins simulate battlefields. Alloy simulates your entire business — every vessel route, every property deal, every legal matter, every threat vector — in a unified probabilistic model."}
                      {activeLayer === "observability" && "Datadog monitors your infrastructure. Alloy monitors its own intelligence fabric — detecting when agent confidence degrades, when model drift affects cross-domain correlations, when token costs spike anomalously."}
                      {activeLayer === "sovereignty" && "Your data never leaves your perimeter. Your models are traceable to training data. Your agents' decisions carry full provenance. This is what sovereign AI means — not a marketing term, an architectural guarantee."}
                    </p>
                  </div>
                </div>
              </m.div>
            </AnimatePresence>
          </m.div>
        </div>
      </section>

      <section id="decision" className="py-20 border-t border-white/[0.04]">
        <div className="max-w-6xl mx-auto px-6">
          <m.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
            <m.div variants={fadeUp} className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 mb-4">
                <Activity className="w-3 h-3" /> Live Demonstration
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Signal → Decision in 16 Seconds</h2>
              <p className="text-white/40 max-w-2xl mx-auto">Watch the Cognitive Fabric process a real-world anomaly — from raw signal to cross-domain intelligence brief — faster than a human analyst can open a browser tab.</p>
            </m.div>

            <m.div variants={fadeUp} className="max-w-2xl mx-auto">
              <div className="p-6 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                <div className="flex items-center gap-2 mb-6 pb-3 border-b border-white/[0.06]">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
                  </div>
                  <span className="text-[10px] font-mono text-white/25 ml-2">ALLOY COGNITIVE FABRIC — DECISION TRACE</span>
                </div>
                <LiveDecisionTimeline />
              </div>
            </m.div>
          </m.div>
        </div>
      </section>

      <section className="py-20 border-t border-white/[0.04]">
        <div className="max-w-6xl mx-auto px-6">
          <m.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
            <m.div variants={fadeUp} className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Competitive Landscape</h2>
              <p className="text-white/40 max-w-2xl mx-auto">How Alloy compares to the world's most advanced defense, intelligence, and enterprise AI platforms.</p>
            </m.div>

            <m.div variants={fadeUp} className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.08]">
                    <th className="text-left py-3 px-4 text-white/40 font-normal">Capability</th>
                    <th className="py-3 px-3 text-center">
                      <span className="text-amber-400 font-bold">Alloy</span>
                    </th>
                    <th className="py-3 px-3 text-center text-white/40 font-normal">Palantir</th>
                    <th className="py-3 px-3 text-center text-white/40 font-normal">Anduril</th>
                    <th className="py-3 px-3 text-center text-white/40 font-normal hidden md:table-cell">CrowdStrike</th>
                    <th className="py-3 px-3 text-center text-white/40 font-normal hidden md:table-cell">Datadog</th>
                    <th className="py-3 px-3 text-center text-white/40 font-normal hidden lg:table-cell">Windward</th>
                  </tr>
                </thead>
                <tbody>
                  {COMPETITIVE_MATRIX.map((row, i) => (
                    <tr key={i} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-4 text-white/60">{row.capability}</td>
                      <td className="py-3 px-3 text-center"><div className="flex justify-center"><CompetitorCell value={row.alloy} /></div></td>
                      <td className="py-3 px-3 text-center"><div className="flex justify-center"><CompetitorCell value={row.palantir} /></div></td>
                      <td className="py-3 px-3 text-center"><div className="flex justify-center"><CompetitorCell value={row.anduril} /></div></td>
                      <td className="py-3 px-3 text-center hidden md:table-cell"><div className="flex justify-center"><CompetitorCell value={row.crowdstrike} /></div></td>
                      <td className="py-3 px-3 text-center hidden md:table-cell"><div className="flex justify-center"><CompetitorCell value={row.datadog} /></div></td>
                      <td className="py-3 px-3 text-center hidden lg:table-cell"><div className="flex justify-center"><CompetitorCell value={row.windward} /></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </m.div>

            <m.div variants={fadeUp} className="flex items-center justify-center gap-6 mt-6 text-xs text-white/30">
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500/20 border border-emerald-500/40" /> Full</div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-yellow-500/15 border border-yellow-500/30" /> Partial</div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-white/5 border border-white/10" /> None</div>
            </m.div>
          </m.div>
        </div>
      </section>

      <section className="py-20 border-t border-white/[0.04]">
        <div className="max-w-6xl mx-auto px-6">
          <m.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
            <m.div variants={fadeUp} className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">The Innovation Sources</h2>
              <p className="text-white/40 max-w-2xl mx-auto">We studied the best. Then we built something they can't.</p>
            </m.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { name: "Palantir AIP", took: "Ontology semantic layer, Action-based execution", evolved: "Cross-domain 5-industry ontology with entity traversal", icon: Database, color: "#3b82f6" },
                { name: "Anduril Lattice", took: "Mesh autonomy, decentralized decision-making", evolved: "Multi-agent consensus fabric with deliberative reasoning", icon: Network, color: "#8b5cf6" },
                { name: "CrowdStrike Charlotte", took: "Autonomous triage, bounded SOC agents", evolved: "Cross-domain bounded authority with reversible operations", icon: Shield, color: "#ef4444" },
                { name: "Datadog Bits AI", took: "Self-healing ops, autonomous remediation", evolved: "Meta-observability — AI that monitors its own intelligence quality", icon: Activity, color: "#10b981" },
                { name: "CIA / IC Programs", took: "300+ AI projects, tradecraft standards, dissent channels", evolved: "IC-grade confidence scoring, structured dissent, provenance chains", icon: Eye, color: "#f59e0b" },
                { name: "Scale Donovan", took: "Defense LLM, mission-speed planning", evolved: "Cross-domain wargaming across 5 industries simultaneously", icon: Swords, color: "#ec4899" },
              ].map((source) => (
                <m.div key={source.name} variants={fadeUp} className="p-5 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.12] transition-all">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `${source.color}12`, border: `1px solid ${source.color}25` }}>
                      <source.icon className="w-4.5 h-4.5" style={{ color: source.color }} />
                    </div>
                    <span className="text-sm font-semibold text-white/80">{source.name}</span>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <div className="text-[10px] font-mono text-white/25 uppercase tracking-wider mb-1">What we took</div>
                      <p className="text-xs text-white/45 leading-relaxed">{source.took}</p>
                    </div>
                    <div className="pt-2 border-t border-white/[0.06]">
                      <div className="text-[10px] font-mono uppercase tracking-wider mb-1" style={{ color: `${source.color}80` }}>What we evolved</div>
                      <p className="text-xs text-white/65 leading-relaxed font-medium">{source.evolved}</p>
                    </div>
                  </div>
                </m.div>
              ))}
            </div>
          </m.div>
        </div>
      </section>

      <section className="py-20 border-t border-white/[0.04]">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <m.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
            <m.h2 variants={fadeUp} className="text-3xl md:text-5xl font-bold mb-6 leading-tight">
              <span className="bg-gradient-to-r from-amber-200 via-amber-400 to-amber-600 bg-clip-text text-transparent">
                One of one.
              </span>
            </m.h2>
            <m.p variants={fadeUp} className="text-lg text-white/40 max-w-2xl mx-auto mb-10">
              No platform on Earth fuses five-industry intelligence, autonomous agent consensus,
              digital twin wargaming, and sovereign deployment — into a single cognitive fabric.
              <br /><br />
              <span className="text-white/60 font-medium">Until now.</span>
            </m.p>
            <m.div variants={fadeUp} className="flex flex-wrap justify-center gap-4">
              <a href={`${import.meta.env.BASE_URL}contact`} className="inline-flex items-center gap-2 px-8 py-4 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold text-lg transition-colors">
                <Crown className="w-5 h-5" /> Request Access
              </a>
              <a href={`${import.meta.env.BASE_URL}mcp-server`} className="inline-flex items-center gap-2 px-8 py-4 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 font-medium text-lg transition-colors">
                <Terminal className="w-5 h-5" /> MCP Integration <ArrowRight className="w-5 h-5" />
              </a>
            </m.div>
          </m.div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
