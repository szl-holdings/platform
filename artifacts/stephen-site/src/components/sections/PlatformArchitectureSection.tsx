import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const layers = [
  {
    label: "Application Layer",
    color: "#6366F1",
    items: ["Vessels", "Aegis", "Lyte", "Terra", "PRISM Counsel", "Carlota Jo", "SZL Holdings"],
  },
  {
    label: "Agentic AI Layer",
    color: "#A855F7",
    items: ["7 Domain Agents", "Mastra Orchestrator", "A2A Protocol (v0.3)", "Durable Workflows", "Compound AI Pipelines"],
  },
  {
    label: "AI Eval & Red Teaming",
    color: "#F97316",
    items: ["Promptfoo Eval Suites", "Gray Swan Red Teaming", "Okareo Synthetic Users", "20-Attack Threat Catalog"],
  },
  {
    label: "AI Memory & Knowledge",
    color: "#EC4899",
    items: ["Three-Tier Memory", "Semantic Recall (pgvector)", "Knowledge Graph", "RAG Pipeline"],
  },
  {
    label: "AI Safety & Grounding",
    color: "#F43F5E",
    items: ["Vectara HHEM Scoring", "Hallucination Detection", "Guardrails & PII Filter", "I/O Security Filtering"],
  },
  {
    label: "AI Observability",
    color: "#14B8A6",
    items: ["AgentOps Traces", "SLO Monitoring", "Cost Tracking", "Quality Evals", "Latency Profiling"],
  },
  {
    label: "Shared Services",
    color: "#00D4FF",
    items: ["API Server (1,618+ endpoints)", "Auth & RBAC", "Feature Flags", "Event Bus"],
  },
  {
    label: "Intelligence Layer",
    color: "#22C55E",
    items: ["Multi-Provider LLM Gateway", "GPT-5.2 / Claude / Gemini", "Fireworks Optimized Routing", "Inference Telemetry"],
  },
  {
    label: "Data Layer",
    color: "#F59E0B",
    items: ["PostgreSQL (375+ tables)", "Drizzle ORM", "Vector Embeddings", "Real-time Subscriptions"],
  },
  {
    label: "Infrastructure",
    color: "#94A3B8",
    items: ["TypeScript Monorepo", "Shared Design System", "Observability", "CI/CD"],
  },
];

const techStack = [
  { category: "Language", items: ["TypeScript", "Zero JavaScript"] },
  { category: "AI Agents", items: ["Mastra Framework", "A2A Protocol", "MCP Server", "7 Domain Agents"] },
  { category: "AI Infra", items: ["GPT-5.2", "Claude", "Gemini", "RAG + pgvector", "Compound AI"] },
  { category: "AI Safety", items: ["Promptfoo Evals", "Gray Swan Red Team", "Vectara HHEM", "Okareo Drivers"] },
  { category: "AI Ops", items: ["AgentOps", "SLO Monitoring", "Cost Tracking", "Trace Profiling"] },
  { category: "Frontend", items: ["React", "Vite", "Tailwind CSS", "Framer Motion"] },
  { category: "Mobile", items: ["React Native", "Expo", "8 mobile apps"] },
  { category: "Backend", items: ["Node.js", "Express", "GraphQL", "1,618+ endpoints"] },
  { category: "Database", items: ["PostgreSQL", "pgvector", "Knowledge Graph", "375+ tables"] },
  { category: "NVIDIA Inception", items: ["Promptfoo", "Vectara", "Gray Swan", "Fireworks", "Tavily", "Twelve Labs"] },
];

export function PlatformArchitectureSection() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="py-24 lg:py-32 bg-[#060910] border-t border-white/5">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12" ref={ref}>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="mb-16"
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-[2px]" style={{ background: "linear-gradient(90deg, #00D4FF, transparent)" }} />
            <span className="text-[11px] font-bold tracking-[0.25em] uppercase" style={{ color: "rgba(0,212,255,0.6)" }}>
              Platform Architecture
            </span>
          </div>
          <div className="grid lg:grid-cols-2 gap-8">
            <div>
              <h2 className="text-4xl md:text-5xl font-black leading-tight tracking-tight mb-5" style={{ color: "rgba(255,255,255,0.95)" }}>
                One architecture.<br />
                <span style={{ color: "rgba(255,255,255,0.3)" }}>Compounding returns.</span>
              </h2>
            </div>
            <div className="flex items-end">
              <p className="text-base font-light leading-relaxed" style={{ color: "rgba(255,255,255,0.38)" }}>
                Every shared layer — auth, design system, observability, data pipelines — reduces the marginal cost of building the next product. NVIDIA Inception-grade AI safety, eval, and inference capabilities integrated across every agent.
              </p>
            </div>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7">
            <div className="space-y-2">
              {layers.map((layer, i) => (
                <motion.div
                  key={layer.label}
                  initial={{ opacity: 0, x: -20 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.5, delay: 0.2 + i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                  className="p-4 relative overflow-hidden"
                  style={{
                    background: "rgba(12,16,24,0.8)",
                    border: "1px solid rgba(255,255,255,0.05)",
                  }}
                >
                  <div className="absolute left-0 top-0 bottom-0 w-[3px]" style={{ background: layer.color }} />
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-[10px] font-bold tracking-[0.2em] uppercase" style={{ color: `${layer.color}99`, fontFamily: "'JetBrains Mono', monospace" }}>
                      {layer.label}
                    </span>
                    <span className="text-[9px] font-mono" style={{ color: "rgba(255,255,255,0.15)", fontFamily: "'JetBrains Mono', monospace" }}>
                      L{i + 1}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {layer.items.map((item) => (
                      <span
                        key={item}
                        className="px-2.5 py-1 text-[11px] font-medium"
                        style={{
                          background: `${layer.color}08`,
                          border: `1px solid ${layer.color}18`,
                          color: `${layer.color}B0`,
                        }}
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : {}}
              transition={{ duration: 0.5, delay: 1.0 }}
              className="mt-3 flex items-center gap-2 px-4 py-3"
              style={{ background: "rgba(34,197,94,0.05)", border: "1px solid rgba(34,197,94,0.1)" }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#22C55E", boxShadow: "0 0 6px rgba(34,197,94,0.5)" }} />
              <span className="text-[11px] font-medium" style={{ color: "rgba(34,197,94,0.7)" }}>
                Full TypeScript — zero JavaScript files in the entire monorepo
              </span>
            </motion.div>
          </div>

          <div className="lg:col-span-5">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="p-6"
              style={{
                background: "rgba(12,16,24,0.8)",
                border: "1px solid rgba(255,255,255,0.05)",
              }}
            >
              <span className="text-[10px] font-bold tracking-[0.2em] uppercase block mb-5" style={{ color: "rgba(255,255,255,0.25)" }}>
                Tech Stack
              </span>
              <div className="space-y-4">
                {techStack.map((group, i) => (
                  <motion.div
                    key={group.category}
                    initial={{ opacity: 0, x: 12 }}
                    animate={isInView ? { opacity: 1, x: 0 } : {}}
                    transition={{ duration: 0.4, delay: 0.6 + i * 0.06 }}
                  >
                    <span className="text-[9px] font-mono font-bold tracking-[0.2em] uppercase block mb-1.5" style={{ color: "rgba(0,212,255,0.4)", fontFamily: "'JetBrains Mono', monospace" }}>
                      {group.category}
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {group.items.map((item) => (
                        <span
                          key={item}
                          className="px-2 py-1 text-[10px] font-medium"
                          style={{
                            background: "rgba(255,255,255,0.03)",
                            border: "1px solid rgba(255,255,255,0.06)",
                            color: "rgba(255,255,255,0.5)",
                            fontFamily: "'JetBrains Mono', monospace",
                          }}
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
