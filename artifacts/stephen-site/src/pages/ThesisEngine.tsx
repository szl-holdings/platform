import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight, ArrowRight } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Link } from "wouter";

type Node = {
  id: string;
  label: string;
  color: string;
  tier: 0 | 1 | 2;
  parentId?: string;
  summary: string;
  body: string;
  examples: string[];
  links?: string[];
  childIds?: string[];
};

const nodes: Node[] = [
  {
    id: "governed-intelligence",
    label: "Governed Intelligence",
    color: "#6366F1",
    tier: 0,
    summary: "AI that is explainable, traceable, and defensible to a regulator.",
    body: "Governed Intelligence is the thesis that AI-assisted decisions in high-stakes operational domains must be explainable at the moment they are made — not reconstructed after the fact. The governing constraint is not the AI's capability, but the human's accountability. The operator must be able to tell an auditor, a board, or a post-incident review exactly what the system recommended, what information it was based on, and what the human decided to do about it.",
    examples: ["PRISM Counsel's matter decisioning with full audit chain", "Aegis threat correlation with explainable confidence scores", "Vessels voyage deviation alerts with structured decision capture"],
    childIds: ["human-in-loop", "audit-fabric", "alloy-execution"],
  },
  {
    id: "human-in-loop",
    label: "Human-in-the-Loop",
    color: "#00D4FF",
    tier: 1,
    parentId: "governed-intelligence",
    summary: "AI augments; humans decide. The loop never closes without human commitment.",
    body: "Human-in-the-loop is not a fallback for when AI fails — it is the architectural principle that defines which decisions require human commitment before execution. The platform presents the decision, provides the AI's reasoning, and requires the human to commit to a course of action. That commitment becomes the record. The AI accelerates the path to the decision; the human is accountable for it.",
    examples: ["Vessels command mode: ETA deviation → operator reviews options → commits to course of action", "Aegis incident response: AI correlation → SOC analyst confirms → escalation committed", "PRISM approval routing: AI-drafted motion → lawyer review → court submission"],
    childIds: ["alloy-execution"],
    links: ["governed-intelligence", "audit-fabric"],
  },
  {
    id: "audit-fabric",
    label: "Audit Fabric",
    color: "#F59E0B",
    tier: 1,
    parentId: "governed-intelligence",
    summary: "Every decision, every signal, every actor — traceable in perpetuity.",
    body: "The Audit Fabric is the immutable record of what happened, who decided, and why. It is not a logging system bolted on after the fact — it is the schema layer that every platform is built around. Every SZL platform stores the full decision context: the signal that triggered it, the options the system presented, the AI's recommendation, the human's choice, and the outcome. The fabric is query-able, exportable, and defensible to any external review.",
    examples: ["ISO 27001 compliance: every SOC action in Aegis has an audited chain", "Maritime regulation: every voyage exception in Vessels links to the operator decision that resolved it", "PRISM legal: every matter decision links to the lawyer who approved it"],
    links: ["governed-intelligence", "human-in-loop"],
  },
  {
    id: "alloy-execution",
    label: "Alloy Execution Fabric",
    color: "#94A3B8",
    tier: 2,
    parentId: "human-in-loop",
    summary: "The shared execution engine — the connective tissue of the SZL ecosystem.",
    body: "Alloy is the platform-agnostic execution engine that runs beneath every SZL product. It handles approval routing, workflow state, human handoffs, escalation rules, and audit capture. The distinction from generic workflow tools is domain awareness: Alloy's execution logic is configured per-domain, not built per-domain. The same routing primitives that handle a legal approval chain in PRISM handle a voyage exception in Vessels — with different domain models, rules, and actors, on the same engine.",
    examples: ["Vessels: voyage deviation → operations review → charter party notification → P&L update", "PRISM: contract review → associate review → partner approval → client delivery", "Aegis: threat signal → SOC analyst → incident commander → executive notification"],
    links: ["governed-intelligence", "human-in-loop"],
  },
  {
    id: "domain-depth",
    label: "Domain Depth",
    color: "#22C55E",
    tier: 0,
    summary: "Build for operators who know more than you do. Meet them where they are.",
    body: "Domain Depth is the product philosophy that software built for specialists must be built by people who understand what those specialists actually do — not just what they need to input and output. The failure mode of generic enterprise software is that it makes the operator do the translation work: from their domain's terminology, logic, and decision models into the software's abstraction layer. Domain Depth means the software speaks the operator's language natively. Terra's distress scoring engine understands what a tax lien means in the context of a New York City property transfer. Vessels' dark vessel detection knows what an AIS gap near a sanctioned port means in the context of a voyage fixture.",
    examples: ["Terra: property distress scoring uses 23 domain-specific signals, not generic ML features", "Vessels: AIS gap analysis is aware of port geography, voyage fixture type, and sanctions regime", "Aegis: threat correlation understands the difference between a brute force attempt and a credential stuffing campaign"],
    childIds: ["vertical-os", "operator-ux"],
  },
  {
    id: "vertical-os",
    label: "Vertical Operating System",
    color: "#10A37F",
    tier: 1,
    parentId: "domain-depth",
    summary: "Not a tool. Not a dashboard. An operating system for a specific domain.",
    body: "A Vertical Operating System is a platform that replaces the entire operational workflow of a domain — not by adding features to an existing workflow, but by redesigning the workflow around the platform. The test is: what does the operator do differently because this platform exists? Not 'what can they see that they couldn't see before?' but 'what decisions do they make faster, with more confidence, with a cleaner audit trail?' The answer to that question is the product.",
    examples: ["Vessels: fleet operators no longer run voyage P&L in spreadsheets — it is a live calculation attached to every voyage", "Aegis: SOC analysts no longer pivot between five tools — the correlation, triage, and response workflow is in one surface", "Terra: deal teams no longer build acquisition pipelines from listing portal data — distress intelligence is systematized"],
    links: ["domain-depth", "operator-ux"],
  },
  {
    id: "operator-ux",
    label: "Operator UX",
    color: "#3B8BEB",
    tier: 1,
    parentId: "domain-depth",
    summary: "Design for the person making the decision under pressure, not the person giving the demo.",
    body: "Operator UX is the design principle that the primary user of a command system is someone who is under time pressure, working with imperfect information, and accountable for the outcome. The failure mode of dashboard design is optimising for the demo — the moment when everything is green, the numbers look impressive, and someone is clicking through a polished walkthrough. Operator UX optimises for the moment when something is wrong, the screen is cluttered, and the operator has thirty seconds to decide. That is the moment the platform is actually being used.",
    examples: ["Vessels exception queue: only shows deviations that require operator action — nothing more", "Aegis threat surface: ranked by severity × confidence × recency, not by arrival time", "Terra distress view: single ranked list of properties demanding attention, not a map with forty pins"],
    links: ["domain-depth", "vertical-os"],
  },
  {
    id: "portfolio-architecture",
    label: "Portfolio Architecture",
    color: "#D4A054",
    tier: 0,
    summary: "One codebase. One thesis. Applied to every domain where operators are underserved.",
    body: "Portfolio Architecture is the structural insight that a shared foundation multiplies the value of every platform built on it. One codebase means one security model, one deployment pipeline, one shared library of battle-tested components. One auth system means a client provisioned across three platforms doesn't re-register. One execution engine means the routing logic proven in Vessels is available in PRISM without rebuilding it. The portfolio is not a collection of separate products that happen to share a brand — it is a network where every platform makes the others stronger.",
    examples: ["Security: one patch to the shared auth middleware applies to all 16 applications simultaneously", "Design: one change to the shared button component propagates to every platform in the next deploy", "AI: one new capability added to Alloy's reasoning layer is available to every platform that uses it"],
    childIds: ["compound-intelligence", "shared-fabric"],
  },
  {
    id: "compound-intelligence",
    label: "Compound Intelligence",
    color: "#F97316",
    tier: 1,
    parentId: "portfolio-architecture",
    summary: "The portfolio learns from its own operations. Every signal makes every other platform smarter.",
    body: "Compound Intelligence is the emergent property of a portfolio architecture where platforms share signal, not just infrastructure. Signals from Vessels feed Alloy's routing models. Intelligence generated by Aegis informs Lyte's anomaly baselines. Terra's distress patterns inform capital allocation conversations surfaced by SZL Holdings. The compounding advantage is that the data generated by operating one platform makes the others better — without any additional data collection effort. The network is the moat.",
    examples: ["Lyte anomaly detection: baseline calibrated using operational patterns from across the portfolio, not just Lyte's own data", "Terra capital allocation: informed by risk signals from Aegis and compliance signals from PRISM", "Alloy routing: models trained on decision patterns from Vessels, Aegis, and PRISM combined"],
    links: ["portfolio-architecture", "shared-fabric"],
  },
  {
    id: "shared-fabric",
    label: "Shared Foundation",
    color: "#8B5CF6",
    tier: 1,
    parentId: "portfolio-architecture",
    summary: "One codebase. One auth. One database cluster. The math of shared infrastructure.",
    body: "The Shared Foundation is the structural argument for portfolio architecture over holding company architecture. A holding company has independent businesses that share a parent. A portfolio architecture has independent domain models that share an engineering foundation. The distinction matters for defensibility: six separate engineering teams, six separate security models, six separate deployment pipelines compound operational risk. The shared foundation compounds operational quality — a security fix that applies everywhere, a performance optimisation that benefits every platform, a new capability that is available to the entire portfolio.",
    examples: ["Auth: single identity service — a user provisioned in SZL can access any platform without re-registering", "Database: single PostgreSQL cluster with schema-per-platform — shared operations, isolated data", "CI/CD: one pipeline configuration, deployed to all 16 applications on merge to main"],
    links: ["portfolio-architecture", "compound-intelligence"],
  },
];

const tierColors = { 0: "#ffffff08", 1: "#ffffff04", 2: "#ffffff02" };
const tierLabels = { 0: "Core Thesis", 1: "Derived Principles", 2: "Implementation" };

function MindMapNode({
  node,
  isSelected,
  onClick,
}: {
  node: Node;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      layout
      className="relative text-left rounded-2xl cursor-pointer transition-all duration-200 w-full"
      style={{
        padding: node.tier === 0 ? "16px 20px" : node.tier === 1 ? "12px 16px" : "10px 14px",
        background: isSelected ? `${node.color}14` : tierColors[node.tier],
        border: `1px solid ${isSelected ? `${node.color}40` : `${node.color}22`}`,
        boxShadow: isSelected ? `0 0 32px ${node.color}20, 0 0 0 1px ${node.color}30` : "none",
      }}
    >
      {isSelected && (
        <div
          className="absolute top-0 left-0 right-0 h-[1px] rounded-t-2xl"
          style={{ background: `linear-gradient(90deg, transparent, ${node.color}80, transparent)` }}
        />
      )}
      <div className="flex items-center gap-2.5 mb-1.5">
        <div
          className="rounded-full flex-shrink-0"
          style={{
            width: node.tier === 0 ? 8 : 6,
            height: node.tier === 0 ? 8 : 6,
            background: node.color,
            boxShadow: isSelected ? `0 0 10px ${node.color}` : "none",
          }}
        />
        <span
          className="font-bold leading-tight"
          style={{
            color: isSelected ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.6)",
            fontSize: node.tier === 0 ? 14 : node.tier === 1 ? 12 : 11,
          }}
        >
          {node.label}
        </span>
      </div>
      <p
        className="leading-relaxed"
        style={{ color: "rgba(255,255,255,0.3)", fontSize: node.tier === 0 ? 11 : 10, paddingLeft: node.tier === 0 ? 20 : 18 }}
      >
        {node.summary}
      </p>
      {node.childIds && node.childIds.length > 0 && (
        <div className="flex items-center gap-1 mt-2" style={{ paddingLeft: node.tier === 0 ? 20 : 18 }}>
          <span className="text-[9px] font-mono text-white/15">{node.childIds.length} derived</span>
          <ChevronRight size={8} className="text-white/15" />
        </div>
      )}
    </motion.button>
  );
}

function NodeDetail({ node, onClose, allNodes }: { node: Node; onClose: () => void; allNodes: Node[] }) {
  const children = allNodes.filter((n) => n.parentId === node.id);
  const linkedNodes = (node.links || []).map((id) => allNodes.find((n) => n.id === id)).filter(Boolean) as Node[];

  return (
    <motion.div
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 24 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="relative rounded-2xl overflow-hidden"
      style={{
        background: "rgba(15,20,30,0.95)",
        border: `1px solid ${node.color}25`,
        backdropFilter: "blur(24px)",
      }}
    >
      <div
        className="h-[2px]"
        style={{ background: `linear-gradient(90deg, ${node.color}, transparent)` }}
      />
      <div className="p-6 sm:p-8">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ background: node.color, boxShadow: `0 0 12px ${node.color}` }}
            />
            <div>
              <h3 className="text-[17px] font-bold text-white/90 leading-tight">{node.label}</h3>
              <span
                className="text-[9px] font-bold tracking-wider uppercase mt-1 inline-block px-2.5 py-0.5 rounded-full"
                style={{ color: node.color, background: `${node.color}15` }}
              >
                {tierLabels[node.tier]}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg transition-colors text-white/30 hover:text-white/60"
            style={{ background: "rgba(255,255,255,0.04)" }}
          >
            <X size={14} />
          </button>
        </div>

        <div className="space-y-5">
          <p className="text-[13px] leading-[1.8] text-white/50">{node.body}</p>

          <div>
            <div className="text-[9px] font-bold tracking-[0.2em] uppercase text-white/20 mb-3">Applied In</div>
            <div className="space-y-2">
              {node.examples.map((ex, i) => (
                <div
                  key={i}
                  className="flex gap-3 p-3 rounded-xl"
                  style={{ background: `${node.color}06`, border: `1px solid ${node.color}12` }}
                >
                  <span className="text-[10px] font-mono text-white/20 shrink-0 mt-0.5">{String(i + 1).padStart(2, "0")}</span>
                  <p className="text-[11px] leading-[1.65] text-white/45">{ex}</p>
                </div>
              ))}
            </div>
          </div>

          {children.length > 0 && (
            <div>
              <div className="text-[9px] font-bold tracking-[0.2em] uppercase text-white/20 mb-2">Derived From This Principle</div>
              <div className="flex flex-wrap gap-2">
                {children.map((child) => (
                  <span
                    key={child.id}
                    className="text-[10px] font-medium px-3 py-1 rounded-full"
                    style={{ color: child.color, background: `${child.color}12`, border: `1px solid ${child.color}25` }}
                  >
                    {child.label}
                  </span>
                ))}
              </div>
            </div>
          )}

          {linkedNodes.length > 0 && (
            <div>
              <div className="text-[9px] font-bold tracking-[0.2em] uppercase text-white/20 mb-2">Connected Ideas</div>
              <div className="flex flex-wrap gap-2">
                {linkedNodes.map((ln) => (
                  <span
                    key={ln.id}
                    className="text-[10px] font-medium px-3 py-1 rounded-full"
                    style={{ color: ln.color, background: `${ln.color}10`, border: `1px solid ${ln.color}20` }}
                  >
                    ↗ {ln.label}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export function ThesisEngine() {
  const [selected, setSelected] = useState<Node | null>(null);
  const [filter, setFilter] = useState<0 | 1 | 2 | null>(null);

  const coreNodes = nodes.filter((n) => n.tier === 0);
  const derivedNodes = nodes.filter((n) => n.tier === 1);
  const implNodes = nodes.filter((n) => n.tier === 2);

  const filtered = filter !== null ? nodes.filter((n) => n.tier === filter) : nodes;

  const handleClick = useCallback(
    (node: Node) => {
      setSelected(selected?.id === node.id ? null : node);
    },
    [selected]
  );

  return (
    <div className="min-h-screen bg-[#080b12] text-white selection:bg-indigo-500/30 selection:text-white">
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 pt-28 pb-24">
        <div className="mb-12 max-w-2xl">
          <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-white/30 mb-3">Thesis Engine</p>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white/95 mb-4">
            An operating philosophy,
            <br />
            <span className="text-white/35">not a mission statement.</span>
          </h1>
          <p className="text-[15px] leading-[1.75] text-white/45">
            Click any node to explore an interconnected idea. Each principle connects to others — and to the platforms that apply them in production.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 mb-8">
          <button
            onClick={() => setFilter(null)}
            className="text-[10px] font-bold tracking-wider uppercase px-3 py-1.5 rounded-full transition-all"
            style={{
              background: filter === null ? "rgba(255,255,255,0.10)" : "rgba(255,255,255,0.03)",
              border: `1px solid ${filter === null ? "rgba(255,255,255,0.20)" : "rgba(255,255,255,0.06)"}`,
              color: filter === null ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.30)",
            }}
          >
            All Ideas
          </button>
          {([0, 1, 2] as const).map((tier) => (
            <button
              key={tier}
              onClick={() => setFilter(filter === tier ? null : tier)}
              className="text-[10px] font-bold tracking-wider uppercase px-3 py-1.5 rounded-full transition-all"
              style={{
                background: filter === tier ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.03)",
                border: `1px solid ${filter === tier ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.06)"}`,
                color: filter === tier ? "rgba(255,255,255,0.65)" : "rgba(255,255,255,0.30)",
              }}
            >
              {tierLabels[tier]}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-6">
            {(filter === null || filter === 0) && (
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-[9px] font-bold tracking-[0.2em] uppercase text-white/20">Core Thesis</span>
                  <div className="flex-1 h-px bg-white/5" />
                  <span className="text-[9px] text-white/15">3 foundational principles</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {coreNodes.filter((n) => filtered.includes(n)).map((n) => (
                    <MindMapNode
                      key={n.id}
                      node={n}
                      isSelected={selected?.id === n.id}
                      onClick={() => handleClick(n)}
                    />
                  ))}
                </div>
              </div>
            )}

            {(filter === null || filter === 1) && (
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-[9px] font-bold tracking-[0.2em] uppercase text-white/20">Derived Principles</span>
                  <div className="flex-1 h-px bg-white/5" />
                  <span className="text-[9px] text-white/15">6 operational principles</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {derivedNodes.filter((n) => filtered.includes(n)).map((n) => (
                    <MindMapNode
                      key={n.id}
                      node={n}
                      isSelected={selected?.id === n.id}
                      onClick={() => handleClick(n)}
                    />
                  ))}
                </div>
              </div>
            )}

            {(filter === null || filter === 2) && (
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-[9px] font-bold tracking-[0.2em] uppercase text-white/20">Implementation</span>
                  <div className="flex-1 h-px bg-white/5" />
                  <span className="text-[9px] text-white/15">Deep stack layer</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {implNodes.filter((n) => filtered.includes(n)).map((n) => (
                    <MindMapNode
                      key={n.id}
                      node={n}
                      isSelected={selected?.id === n.id}
                      onClick={() => handleClick(n)}
                    />
                  ))}
                </div>
              </div>
            )}

            {filtered.length === 0 && (
              <div className="text-center py-16 text-white/20 text-sm">
                No nodes match the current filter.
              </div>
            )}
          </div>

          <div className="lg:col-span-5">
            <div className="sticky top-24">
              <AnimatePresence mode="wait">
                {selected ? (
                  <NodeDetail
                    key={selected.id}
                    node={selected}
                    onClose={() => setSelected(null)}
                    allNodes={nodes}
                  />
                ) : (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="rounded-2xl flex flex-col items-center justify-center py-20 px-8 text-center"
                    style={{
                      background: "rgba(255,255,255,0.015)",
                      border: "1px solid rgba(255,255,255,0.05)",
                    }}
                  >
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center mb-4"
                      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
                    >
                      <span className="text-xl opacity-40">⬡</span>
                    </div>
                    <p className="text-[13px] font-medium text-white/25 mb-2">Select any idea to explore it</p>
                    <p className="text-[11px] text-white/15 max-w-xs leading-relaxed">
                      Each principle connects to the platforms that apply it in production.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="mt-6 p-5 rounded-2xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                <div className="text-[9px] font-bold tracking-[0.2em] uppercase text-white/20 mb-3">Connections at a Glance</div>
                <div className="flex flex-wrap gap-1.5">
                  {nodes.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => handleClick(n)}
                      className="text-[9px] font-medium px-2.5 py-1 rounded-full transition-all"
                      style={{
                        color: selected?.id === n.id ? n.color : "rgba(255,255,255,0.30)",
                        background: selected?.id === n.id ? `${n.color}14` : "transparent",
                        border: `1px solid ${selected?.id === n.id ? `${n.color}30` : "rgba(255,255,255,0.06)"}`,
                      }}
                    >
                      {n.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-white/5 pt-10 mt-16 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <p className="text-[13px] text-white/30 mb-1">This is a working philosophy — it evolves as the portfolio grows.</p>
            <p className="text-[12px] text-white/15">Last updated: April 2026</p>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/work" className="inline-flex items-center gap-2 text-[13px] font-medium text-white/40 hover:text-white/70 transition-colors">
              See it in practice <ArrowRight size={12} />
            </Link>
            <Link href="/writing" className="text-[13px] text-white/20 hover:text-white/40 transition-colors">
              Read more
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default ThesisEngine;
