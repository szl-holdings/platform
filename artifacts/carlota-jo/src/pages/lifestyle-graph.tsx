import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home, Plane, Calendar, Package, Users, Heart, Sparkles, X,
  ChevronRight, Activity, Star, Clock, ArrowRight,
} from "lucide-react";
import { usePageMeta } from "@/hooks/usePageMeta";

const GOLD = "rgba(196,170,126,1)";
const GOLD_DIM = "rgba(196,170,126,0.08)";
const GOLD_BORDER = "rgba(196,170,126,0.18)";
const CREAM = "rgba(244,237,224,0.88)";
const CREAM_DIM = "rgba(244,237,224,0.45)";
const CREAM_FAINT = "rgba(244,237,224,0.07)";
const MUTED = "rgba(244,237,224,0.25)";
const DEEP = "#0a0906";

type NodeType = "residence" | "travel" | "family" | "vendor" | "event" | "preference" | "anticipation";

interface GraphNode {
  id: string;
  label: string;
  type: NodeType;
  x: number;
  y: number;
  weight: number;
  lastActive: string;
  detail: string;
  connections: string[];
  anticipation?: string;
}

const typeConfig: Record<NodeType, { color: string; bg: string; icon: React.ElementType; label: string }> = {
  residence: { color: "#c4aa7e", bg: "rgba(196,170,126,0.12)", icon: Home, label: "Residence" },
  travel: { color: "#38bdf8", bg: "rgba(56,189,248,0.09)", icon: Plane, label: "Travel" },
  family: { color: "#f472b6", bg: "rgba(244,114,182,0.09)", icon: Heart, label: "Family" },
  vendor: { color: "#34d399", bg: "rgba(52,211,153,0.09)", icon: Package, label: "Vendor" },
  event: { color: "#a78bfa", bg: "rgba(167,139,250,0.09)", icon: Calendar, label: "Event" },
  preference: { color: "#fb923c", bg: "rgba(251,146,60,0.09)", icon: Star, label: "Preference" },
  anticipation: { color: "#facc15", bg: "rgba(250,204,21,0.12)", icon: Sparkles, label: "Anticipation" },
};

const NODES: GraphNode[] = [
  {
    id: "oxford", label: "Oxfordshire Estate", type: "residence",
    x: 50, y: 38, weight: 5, lastActive: "Apr 2026",
    detail: "Primary summer residence. Opens May, closes September. Staff of 6.",
    connections: ["grounds", "pool", "family-summer", "oxford-inspect"],
    anticipation: "Opening inspection window is now — based on 2yr pattern.",
  },
  {
    id: "london", label: "Mayfair Apartment", type: "residence",
    x: 32, y: 58, weight: 4, lastActive: "Mar 2026",
    detail: "London base. Active October–April. Concierge service on retainer.",
    connections: ["london-concierge", "london-dining", "family-winter"],
    anticipation: undefined,
  },
  {
    id: "ny-visit", label: "New York", type: "travel",
    x: 72, y: 22, weight: 3, lastActive: "Jul 2025",
    detail: "Annual June/July visit. The Carlyle preferred — books 8–10 weeks out.",
    connections: ["carlyle", "ny-driver"],
    anticipation: "June visit window approaching. Carlyle availability should be secured.",
  },
  {
    id: "st-barths", label: "St. Barths", type: "travel",
    x: 80, y: 55, weight: 3, lastActive: "Jan 2026",
    detail: "January retreat. Villa La Banane historically reserved. Travel: Private charter.",
    connections: ["st-barths-villa", "charter"],
    anticipation: undefined,
  },
  {
    id: "grounds", label: "Grounds & Landscaping", type: "vendor",
    x: 36, y: 24, weight: 3, lastActive: "Sep 2025",
    detail: "Seasonal vendor — confirmed annually. Lead time: 2–3 weeks.",
    connections: ["oxford"],
    anticipation: "Seasonal confirmation due — risk of availability gap without immediate action.",
  },
  {
    id: "pool", label: "Pool Maintenance", type: "vendor",
    x: 62, y: 42, weight: 2, lastActive: "Sep 2025",
    detail: "2025: 3-week service gap due to delayed confirmation. Must renew early.",
    connections: ["oxford"],
    anticipation: "Immediate — avoid repeat 2025 gap.",
  },
  {
    id: "london-concierge", label: "London Concierge", type: "vendor",
    x: 18, y: 48, weight: 3, lastActive: "Mar 2026",
    detail: "On-retainer city concierge. Handles restaurant reservations, ticketing, procurement.",
    connections: ["london", "london-dining"],
    anticipation: undefined,
  },
  {
    id: "london-dining", label: "Dining Preferences", type: "preference",
    x: 20, y: 68, weight: 2, lastActive: "Mar 2026",
    detail: "Annabel's member. Scott's, The Ivy, Nobu rotating preference. Reservations 2 weeks minimum.",
    connections: ["london-concierge"],
    anticipation: undefined,
  },
  {
    id: "carlyle", label: "The Carlyle, NY", type: "preference",
    x: 84, y: 30, weight: 3, lastActive: "Jul 2025",
    detail: "Preferred NY accommodation. Books 8–10 weeks in advance. Suite preference logged.",
    connections: ["ny-visit"],
    anticipation: "Begin availability inquiry within 2 weeks to secure June window.",
  },
  {
    id: "ny-driver", label: "NY Ground Transport", type: "vendor",
    x: 78, y: 16, weight: 2, lastActive: "Jul 2025",
    detail: "Preferred NYC driver service — confirmed per visit.",
    connections: ["ny-visit"],
    anticipation: undefined,
  },
  {
    id: "family-summer", label: "Summer Gathering", type: "family",
    x: 62, y: 20, weight: 4, lastActive: "Aug 2025",
    detail: "Annual extended family weekend at Oxfordshire. Typically last week of July. Catering required.",
    connections: ["oxford", "family-winter"],
    anticipation: "Catering and accommodation planning needed by May.",
  },
  {
    id: "family-winter", label: "Christmas at Mayfair", type: "family",
    x: 24, y: 78, weight: 3, lastActive: "Dec 2025",
    detail: "Annual Christmas gathering. 14–18 guests. Wine, florals, event staff arranged.",
    connections: ["london", "family-summer"],
    anticipation: undefined,
  },
  {
    id: "oxford-inspect", label: "Oxfordshire Inspection", type: "anticipation",
    x: 46, y: 54, weight: 4, lastActive: "Expected Apr 2026",
    detail: "Annual pre-season inspection. 2025 revealed heating issue caught early. Must be booked now.",
    connections: ["oxford", "grounds"],
    anticipation: "ACT NOW — book week of Apr 14–18.",
  },
  {
    id: "st-barths-villa", label: "Villa La Banane", type: "preference",
    x: 72, y: 68, weight: 3, lastActive: "Jan 2026",
    detail: "Preferred St. Barths villa. Books 6–8 months ahead for January. Action window: June.",
    connections: ["st-barths"],
    anticipation: undefined,
  },
  {
    id: "charter", label: "Private Charter", type: "vendor",
    x: 84, y: 72, weight: 2, lastActive: "Jan 2026",
    detail: "Air Charter Service — used for St. Barths, Oxfordshire regional. 4 week booking lead.",
    connections: ["st-barths"],
    anticipation: undefined,
  },
];

function getNodeRadius(weight: number) {
  return 10 + weight * 4;
}

function GraphEdge({ from, to, nodes, highlighted }: { from: string; to: string; nodes: GraphNode[]; highlighted: boolean }) {
  const a = nodes.find(n => n.id === from);
  const b = nodes.find(n => n.id === to);
  if (!a || !b) return null;
  return (
    <line
      x1={`${a.x}%`} y1={`${a.y}%`}
      x2={`${b.x}%`} y2={`${b.y}%`}
      stroke={highlighted ? GOLD : "rgba(196,170,126,0.12)"}
      strokeWidth={highlighted ? 1.5 : 1}
      strokeDasharray={highlighted ? "none" : "4 4"}
    />
  );
}

function GraphNodeEl({ node, selected, onSelect }: { node: GraphNode; selected: boolean; onSelect: () => void }) {
  const cfg = typeConfig[node.type];
  const Icon = cfg.icon;
  const r = getNodeRadius(node.weight);
  const hasAnticipation = !!node.anticipation;

  return (
    <g
      style={{ cursor: "pointer" }}
      onClick={onSelect}
    >
      {hasAnticipation && (
        <circle
          cx={`${node.x}%`} cy={`${node.y}%`} r={r + 10}
          fill="none"
          stroke="rgba(250,204,21,0.25)"
          strokeWidth="1"
          style={{ animation: "pulse-ring 2.2s ease-in-out infinite" }}
        />
      )}
      <circle
        cx={`${node.x}%`} cy={`${node.y}%`} r={r}
        fill={selected ? cfg.bg : "rgba(10,9,6,0.7)"}
        stroke={selected ? cfg.color : hasAnticipation ? "rgba(250,204,21,0.5)" : cfg.color.replace("1)", "0.3)")}
        strokeWidth={selected ? 2 : 1}
      />
      <text
        x={`${node.x}%`} y={`${node.y}%`}
        textAnchor="middle" dominantBaseline="middle"
        fontSize={r * 0.75}
        fill={selected ? cfg.color : "rgba(244,237,224,0.55)"}
        style={{ pointerEvents: "none", userSelect: "none" }}
      >
        {node.type === "residence" ? "⌂" : node.type === "travel" ? "✈" : node.type === "family" ? "♥" : node.type === "vendor" ? "◈" : node.type === "event" ? "◆" : node.type === "preference" ? "★" : "✦"}
      </text>
      <text
        x={`${node.x}%`} y={`${(node.y)}%`}
        dy={r + 12}
        textAnchor="middle"
        fontSize="9"
        fill={selected ? cfg.color : "rgba(244,237,224,0.35)"}
        style={{ pointerEvents: "none", userSelect: "none" }}
      >
        {node.label}
      </text>
    </g>
  );
}

export default function LifestyleGraph() {
  usePageMeta({ title: "Lifestyle Intelligence Graph — Carlota Jo" });
  const [selected, setSelected] = useState<GraphNode | null>(null);
  const [filterType, setFilterType] = useState<NodeType | "all">("all");
  const svgRef = useRef<SVGSVGElement>(null);

  const allEdges: Array<{ from: string; to: string }> = [];
  NODES.forEach(node => {
    node.connections.forEach(cid => {
      const exists = allEdges.some(e => (e.from === node.id && e.to === cid) || (e.from === cid && e.to === node.id));
      if (!exists) allEdges.push({ from: node.id, to: cid });
    });
  });

  const visibleNodes = filterType === "all" ? NODES : NODES.filter(n => n.type === filterType);
  const visibleIds = new Set(visibleNodes.map(n => n.id));
  const visibleEdges = allEdges.filter(e => visibleIds.has(e.from) && visibleIds.has(e.to));
  const highlightedEdges = selected
    ? allEdges.filter(e => e.from === selected.id || e.to === selected.id)
    : [];
  const highlightedIds = new Set(highlightedEdges.flatMap(e => [e.from, e.to]));

  const anticipationNodes = NODES.filter(n => n.anticipation);

  return (
    <div style={{ minHeight: "100vh", background: DEEP, padding: "32px 24px 64px" }}>
      <style>{`@keyframes pulse-ring { 0%,100% { opacity:0.3; r:20px; } 50% { opacity:0.7; r:28px; } }`}</style>

      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <Activity size={16} style={{ color: GOLD }} />
            <span style={{ fontSize: 11, fontWeight: 600, color: GOLD, letterSpacing: "0.1em", textTransform: "uppercase" }}>
              Lifestyle Intelligence
            </span>
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 300, color: CREAM, margin: "0 0 8px", letterSpacing: "-0.02em" }}>
            Intelligence Graph
          </h1>
          <p style={{ fontSize: 14, color: CREAM_DIM, margin: 0 }}>
            A living map of every client touchpoint — surfacing patterns and anticipation moments before they're asked.
          </p>
        </div>

        {anticipationNodes.length > 0 && (
          <div style={{
            background: "rgba(250,204,21,0.06)", border: "1px solid rgba(250,204,21,0.18)",
            borderRadius: 10, padding: "14px 18px", marginBottom: 24,
            display: "flex", alignItems: "flex-start", gap: 12,
          }}>
            <Sparkles size={15} style={{ color: "#facc15", marginTop: 2, flexShrink: 0 }} />
            <div>
              <p style={{ fontSize: 12, fontWeight: 600, color: "#facc15", margin: "0 0 4px", letterSpacing: "0.05em" }}>
                {anticipationNodes.length} ANTICIPATION MOMENTS ACTIVE
              </p>
              <p style={{ fontSize: 12, color: "rgba(250,204,21,0.65)", margin: 0 }}>
                Nodes with a pulsing ring require attention. Click to view recommended action.
              </p>
            </div>
          </div>
        )}

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
          {(["all", ...Object.keys(typeConfig)] as Array<NodeType | "all">).map(t => {
            const cfg = t === "all" ? null : typeConfig[t];
            return (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                style={{
                  padding: "5px 12px", borderRadius: 20, fontSize: 11, fontWeight: 500,
                  border: `1px solid ${filterType === t ? (cfg?.color ?? GOLD) : GOLD_BORDER}`,
                  background: filterType === t ? (cfg?.bg ?? GOLD_DIM) : "transparent",
                  color: filterType === t ? (cfg?.color ?? GOLD) : MUTED,
                  cursor: "pointer", transition: "all 0.18s",
                  textTransform: "capitalize",
                }}
              >
                {t === "all" ? "All Nodes" : cfg?.label}
              </button>
            );
          })}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: selected ? "1fr 340px" : "1fr", gap: 16, transition: "all 0.3s" }}>
          <div style={{
            background: "rgba(196,170,126,0.03)", border: `1px solid ${GOLD_BORDER}`,
            borderRadius: 12, overflow: "hidden", position: "relative",
          }}>
            <svg
              ref={svgRef}
              width="100%" height="520"
              style={{ display: "block" }}
              onClick={(e) => { if (e.target === svgRef.current) setSelected(null); }}
            >
              {visibleEdges.map(e => (
                <GraphEdge
                  key={`${e.from}-${e.to}`}
                  from={e.from} to={e.to}
                  nodes={NODES}
                  highlighted={highlightedEdges.some(he => he.from === e.from && he.to === e.to)}
                />
              ))}
              {visibleNodes.map(node => (
                <GraphNodeEl
                  key={node.id}
                  node={node}
                  selected={selected?.id === node.id || (!!selected && highlightedIds.has(node.id))}
                  onSelect={() => setSelected(selected?.id === node.id ? null : node)}
                />
              ))}
            </svg>
            <div style={{
              position: "absolute", bottom: 14, left: 14,
              display: "flex", gap: 12, flexWrap: "wrap",
            }}>
              {Object.entries(typeConfig).map(([type, cfg]) => (
                <div key={type} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: cfg.color }} />
                  <span style={{ fontSize: 10, color: MUTED }}>{cfg.label}</span>
                </div>
              ))}
            </div>
          </div>

          <AnimatePresence>
            {selected && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                style={{
                  background: "rgba(196,170,126,0.04)", border: `1px solid ${GOLD_BORDER}`,
                  borderRadius: 12, padding: 20, display: "flex", flexDirection: "column", gap: 16,
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                  <div>
                    <div style={{
                      display: "inline-flex", alignItems: "center", gap: 5,
                      background: typeConfig[selected.type].bg, border: `1px solid ${typeConfig[selected.type].color}30`,
                      borderRadius: 20, padding: "3px 10px", marginBottom: 8,
                    }}>
                      <span style={{ fontSize: 10, fontWeight: 600, color: typeConfig[selected.type].color, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                        {typeConfig[selected.type].label}
                      </span>
                    </div>
                    <h3 style={{ fontSize: 16, fontWeight: 500, color: CREAM, margin: 0 }}>{selected.label}</h3>
                  </div>
                  <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", cursor: "pointer", color: MUTED, padding: 4 }}>
                    <X size={14} />
                  </button>
                </div>

                <div style={{ fontSize: 13, color: CREAM_DIM, lineHeight: 1.6 }}>{selected.detail}</div>

                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Clock size={12} style={{ color: MUTED }} />
                  <span style={{ fontSize: 11, color: MUTED }}>Last active: {selected.lastActive}</span>
                </div>

                {selected.anticipation && (
                  <div style={{
                    background: "rgba(250,204,21,0.07)", border: "1px solid rgba(250,204,21,0.22)",
                    borderRadius: 8, padding: "12px 14px",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                      <Sparkles size={12} style={{ color: "#facc15" }} />
                      <span style={{ fontSize: 10, fontWeight: 700, color: "#facc15", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                        Anticipation Moment
                      </span>
                    </div>
                    <p style={{ fontSize: 12, color: "rgba(250,204,21,0.8)", margin: 0, lineHeight: 1.5 }}>
                      {selected.anticipation}
                    </p>
                  </div>
                )}

                {selected.connections.length > 0 && (
                  <div>
                    <p style={{ fontSize: 10, fontWeight: 600, color: MUTED, letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 8px" }}>
                      Connected Nodes
                    </p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      {selected.connections.map(cid => {
                        const n = NODES.find(x => x.id === cid);
                        if (!n) return null;
                        return (
                          <button
                            key={cid}
                            onClick={() => setSelected(n)}
                            style={{
                              display: "flex", alignItems: "center", justifyContent: "space-between",
                              background: CREAM_FAINT, border: `1px solid ${GOLD_BORDER}`,
                              borderRadius: 6, padding: "7px 10px", cursor: "pointer",
                              color: CREAM_DIM, fontSize: 12, textAlign: "left",
                            }}
                          >
                            <span>{n.label}</span>
                            <ChevronRight size={11} style={{ color: MUTED }} />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div style={{ marginTop: 32 }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: MUTED, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 14 }}>
            Active Anticipation Moments
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
            {anticipationNodes.map(node => (
              <motion.div
                key={node.id}
                whileHover={{ borderColor: "rgba(250,204,21,0.35)" }}
                onClick={() => setSelected(node)}
                style={{
                  background: "rgba(250,204,21,0.04)", border: "1px solid rgba(250,204,21,0.16)",
                  borderRadius: 10, padding: "14px 16px", cursor: "pointer",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                  <Sparkles size={12} style={{ color: "#facc15" }} />
                  <span style={{ fontSize: 11, fontWeight: 600, color: "#facc15" }}>{node.label}</span>
                </div>
                <p style={{ fontSize: 12, color: "rgba(244,237,224,0.5)", margin: "0 0 10px", lineHeight: 1.5 }}>
                  {node.anticipation}
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <ArrowRight size={11} style={{ color: "rgba(250,204,21,0.5)" }} />
                  <span style={{ fontSize: 11, color: "rgba(250,204,21,0.5)" }}>View in graph</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
