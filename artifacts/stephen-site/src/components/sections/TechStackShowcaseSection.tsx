import { useState, useRef } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";

type StackNode = {
  id: string;
  name: string;
  category: string;
  description: string;
  usedIn: string[];
  whyChosen: string;
  color: string;
  layer: number;
};

const stackNodes: StackNode[] = [
  {
    id: "typescript",
    name: "TypeScript",
    category: "Language",
    description: "Primary language for all client and server code. End-to-end type safety across 375+ database tables and 1,618+ API endpoints.",
    usedIn: ["All platforms", "Shared libraries", "API server"],
    whyChosen: "Type safety is not optional at portfolio scale. When a shared library changes, TypeScript surfaces every breaking consumer before deployment.",
    color: "#3178C6",
    layer: 0,
  },
  {
    id: "react",
    name: "React + Vite",
    category: "Frontend",
    description: "Frontend application framework powering all 8 web platforms. Vite delivers sub-second HMR across the monorepo.",
    usedIn: ["Vessels", "Aegis", "Terra", "Lyte", "SZL Holdings", "PRISM", "Carlota Jo", "Stephen Site"],
    whyChosen: "React's component model enables the shared UI library that keeps all 8 platforms visually consistent. One component update propagates everywhere.",
    color: "#61DAFB",
    layer: 0,
  },
  {
    id: "expo",
    name: "Expo",
    category: "Mobile",
    description: "React Native framework for all 7 mobile applications. Shared business logic between web and mobile via workspace packages.",
    usedIn: ["All mobile apps", "7 platforms"],
    whyChosen: "Shared TypeScript logic between web and mobile. Domain models, validation schemas, and API clients are identical across both surfaces.",
    color: "#000020",
    layer: 0,
  },
  {
    id: "express",
    name: "Express 5",
    category: "Backend",
    description: "API server framework. RESTful endpoints with full TypeScript. Single API server architecture reduces operational overhead.",
    usedIn: ["API server", "All platforms"],
    whyChosen: "Simplicity over complexity. One Express server, one deployment target, full observability — versus microservices coordination overhead at this scale.",
    color: "#68A063",
    layer: 1,
  },
  {
    id: "postgresql",
    name: "PostgreSQL",
    category: "Database",
    description: "Primary relational database. Single cluster, multiple schemas — one per platform. Row-level security enforces tenant isolation.",
    usedIn: ["All platforms", "375+ tables"],
    whyChosen: "ACID compliance and row-level security at one cluster is more defensible than six separate databases. The audit requirements of maritime and defense demand it.",
    color: "#4169E1",
    layer: 1,
  },
  {
    id: "pnpm",
    name: "pnpm Workspace",
    category: "Infrastructure",
    description: "Monorepo management. Shared libraries, linked workspaces, and coordinated builds across 15+ packages.",
    usedIn: ["All platforms", "Shared libs", "CI/CD"],
    whyChosen: "The entire portfolio compiles from one command. Shared changes propagate automatically. Security patches apply to all platforms simultaneously.",
    color: "#F6921E",
    layer: 1,
  },
  {
    id: "alloy",
    name: "Alloy Engine",
    category: "Shared Platform",
    description: "The shared execution fabric. Approval routing, audit trails, governed automation, and workflow orchestration for all SZL platforms.",
    usedIn: ["Vessels", "Aegis", "Lyte", "Terra", "PRISM"],
    whyChosen: "Domain-agnostic execution with domain-specific configuration. The routing logic in Vessels and the approval chain in PRISM use the same engine, configured differently.",
    color: "#94A3B8",
    layer: 2,
  },
  {
    id: "openai",
    name: "OpenAI + Anthropic",
    category: "AI",
    description: "AI reasoning layer across the portfolio. GPT-4 for analysis and generation, Claude for long-context reasoning and audit-grade responses.",
    usedIn: ["Lyte", "Aegis", "Terra", "PRISM", "Alloy"],
    whyChosen: "Human-in-the-loop governance requires AI that can explain its reasoning. Both models selected for different tradeoffs in explainability and context depth.",
    color: "#10A37F",
    layer: 2,
  },
  {
    id: "prism-bus",
    name: "PRISM Bus",
    category: "Shared Platform",
    description: "The internal event bus and cross-platform messaging system. Connects signals from one platform to consumers in another.",
    usedIn: ["All platforms", "Cross-platform signals"],
    whyChosen: "The portfolio advantage only materialises if platforms can share intelligence. PRISM Bus is the connective tissue that makes the network more than the sum of its parts.",
    color: "#F59E0B",
    layer: 2,
  },
  {
    id: "tailwind",
    name: "Tailwind + Design System",
    category: "Design",
    description: "Shared design system with unified tokens, components, and spacing. All 8 web platforms share the same visual foundation.",
    usedIn: ["All web platforms", "Shared UI library"],
    whyChosen: "Visual consistency across the portfolio signals engineering coherence to enterprise clients. One component library means one QA pass, not eight.",
    color: "#38BDF8",
    layer: 0,
  },
  {
    id: "framer",
    name: "Framer Motion",
    category: "Animation",
    description: "Production animation library. Scroll-driven narratives, micro-interactions, and cinematic transitions across Stephen Site and key platform surfaces.",
    usedIn: ["Stephen Site", "SZL Holdings"],
    whyChosen: "Animation communicates system state and guides attention. Used surgically — not decoratively — to create clarity in complex dashboards.",
    color: "#BB22FF",
    layer: 0,
  },
  {
    id: "recharts",
    name: "Recharts",
    category: "Visualization",
    description: "Data visualization library. Maritime charts, threat timelines, distress heat maps, and business intelligence panels.",
    usedIn: ["Vessels", "Aegis", "Terra", "Lyte"],
    whyChosen: "React-native charting with full TypeScript integration. Domain data models map directly to chart configuration — no transform layer needed.",
    color: "#E54D2E",
    layer: 0,
  },
];

const layers = [
  { label: "Interface", sublabel: "Client Layer", y: 0 },
  { label: "Services", sublabel: "API & Data Layer", y: 1 },
  { label: "Platform", sublabel: "Shared Fabric", y: 2 },
];

const categoryColors: Record<string, string> = {
  Language: "#3178C6",
  Frontend: "#61DAFB",
  Mobile: "#6366F1",
  Backend: "#68A063",
  Database: "#4169E1",
  Infrastructure: "#F6921E",
  "Shared Platform": "#94A3B8",
  AI: "#10A37F",
  Design: "#38BDF8",
  Animation: "#BB22FF",
  Visualization: "#E54D2E",
};

function NodeCard({ node, onClick, isSelected }: { node: StackNode; onClick: () => void; isSelected: boolean }) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.98 }}
      className="relative text-left px-4 py-3 rounded-xl cursor-pointer transition-all duration-200"
      style={{
        background: isSelected ? `${node.color}15` : "rgba(255,255,255,0.02)",
        border: `1px solid ${isSelected ? `${node.color}40` : "rgba(255,255,255,0.06)"}`,
        boxShadow: isSelected ? `0 0 20px ${node.color}20` : "none",
      }}
    >
      {isSelected && (
        <div
          className="absolute top-0 left-0 right-0 h-[1px] rounded-t-xl"
          style={{ background: `linear-gradient(90deg, transparent, ${node.color}80, transparent)` }}
        />
      )}
      <div className="flex items-center gap-2 mb-1">
        <div className="w-2 h-2 rounded-full" style={{ background: node.color, boxShadow: isSelected ? `0 0 8px ${node.color}` : "none" }} />
        <span className="text-[11px] font-bold text-white/70">{node.name}</span>
      </div>
      <span
        className="text-[9px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full"
        style={{ color: categoryColors[node.category], background: `${categoryColors[node.category]}15` }}
      >
        {node.category}
      </span>
    </motion.button>
  );
}

export function TechStackShowcaseSection() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-10%" });
  const [selected, setSelected] = useState<StackNode | null>(null);
  const [filter, setFilter] = useState<string | null>(null);

  const categories = Array.from(new Set(stackNodes.map((n) => n.category)));

  const filtered = filter ? stackNodes.filter((n) => n.category === filter) : stackNodes;

  const byLayer = layers.map((l) => ({
    ...l,
    nodes: filtered.filter((n) => n.layer === l.y),
  }));

  return (
    <section ref={ref} className="relative py-24 sm:py-32 overflow-hidden" id="tech-stack">
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div
          className="absolute left-0 bottom-0 w-[700px] h-[500px] blur-[200px] rounded-full"
          style={{ background: "radial-gradient(ellipse, rgba(49,120,198,0.06) 0%, transparent 70%)" }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 relative z-10">
        <div className="mb-12">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            className="text-[11px] font-semibold tracking-[0.2em] uppercase mb-3"
            style={{ color: "rgba(255,255,255,0.3)" }}
          >
            Tech Stack
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-5xl font-black tracking-tight mb-4"
            style={{ color: "rgba(255,255,255,0.9)" }}
          >
            Hover any component.
            <br />
            <span style={{ color: "rgba(255,255,255,0.35)" }}>Understand every decision.</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-[15px] leading-[1.75] max-w-xl mb-8"
            style={{ color: "rgba(255,255,255,0.4)" }}
          >
            Every architectural choice has a rationale. Click any component to see what it does, which platforms use it, and why it was chosen over the alternatives.
          </motion.p>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilter(null)}
              className="text-[10px] font-semibold tracking-wider uppercase px-3 py-1.5 rounded-full transition-all"
              style={{
                background: !filter ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.03)",
                border: `1px solid ${!filter ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.06)"}`,
                color: !filter ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.35)",
              }}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(filter === cat ? null : cat)}
                className="text-[10px] font-semibold tracking-wider uppercase px-3 py-1.5 rounded-full transition-all"
                style={{
                  background: filter === cat ? `${categoryColors[cat]}15` : "rgba(255,255,255,0.03)",
                  border: `1px solid ${filter === cat ? `${categoryColors[cat]}40` : "rgba(255,255,255,0.06)"}`,
                  color: filter === cat ? categoryColors[cat] : "rgba(255,255,255,0.35)",
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {byLayer.map((layer) => (
              <div key={layer.label}>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-[9px] font-bold tracking-[0.2em] uppercase text-white/20">{layer.label}</span>
                  <div className="flex-1 h-px bg-white/5" />
                  <span className="text-[9px] text-white/15">{layer.sublabel}</span>
                </div>
                {layer.nodes.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {layer.nodes.map((node) => (
                      <NodeCard
                        key={node.id}
                        node={node}
                        onClick={() => setSelected(selected?.id === node.id ? null : node)}
                        isSelected={selected?.id === node.id}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-[11px] text-white/20 py-3 px-4 rounded-lg border border-white/5">
                    No {layer.sublabel.toLowerCase()} components match the current filter.
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="lg:col-span-1">
            <div
              className="sticky top-24 rounded-2xl overflow-hidden"
              style={{
                background: "rgba(15,20,30,0.8)",
                border: "1px solid rgba(255,255,255,0.06)",
                backdropFilter: "blur(16px)",
                minHeight: 320,
              }}
            >
              <AnimatePresence mode="wait">
                {selected ? (
                  <motion.div
                    key={selected.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.3 }}
                    className="p-6"
                  >
                    <div
                      className="h-[2px] rounded-full mb-6"
                      style={{ background: `linear-gradient(90deg, ${selected.color}, transparent)` }}
                    />
                    <div className="flex items-center gap-3 mb-4">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ background: selected.color, boxShadow: `0 0 12px ${selected.color}` }}
                      />
                      <h3 className="text-[15px] font-bold text-white/90">{selected.name}</h3>
                    </div>
                    <span
                      className="inline-block text-[9px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-full mb-4"
                      style={{ color: selected.color, background: `${selected.color}15` }}
                    >
                      {selected.category}
                    </span>
                    <p className="text-[12px] leading-[1.7] text-white/50 mb-5">{selected.description}</p>

                    <div className="mb-5">
                      <div className="text-[9px] font-bold tracking-[0.2em] uppercase text-white/20 mb-2">Used In</div>
                      <div className="flex flex-wrap gap-1.5">
                        {selected.usedIn.map((u) => (
                          <span key={u} className="text-[10px] px-2 py-0.5 rounded-md text-white/40" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                            {u}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div
                      className="p-4 rounded-xl"
                      style={{ background: `${selected.color}08`, border: `1px solid ${selected.color}18` }}
                    >
                      <div className="text-[9px] font-bold tracking-[0.2em] uppercase mb-2" style={{ color: selected.color }}>
                        Why This Choice
                      </div>
                      <p className="text-[11px] leading-[1.7] text-white/45">{selected.whyChosen}</p>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center h-80 p-8 text-center"
                  >
                    <div className="text-[32px] mb-3 opacity-20">⬡</div>
                    <p className="text-[12px] font-medium text-white/25 mb-1">Select any component</p>
                    <p className="text-[11px] text-white/15">to explore its role in the architecture</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/5 to-transparent" />
    </section>
  );
}
