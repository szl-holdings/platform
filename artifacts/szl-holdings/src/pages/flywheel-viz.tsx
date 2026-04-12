import { useState, useEffect, useRef } from "react";
import { m, AnimatePresence } from "framer-motion";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import {
  Shield, Ship, Map, Layers, Activity, Eye, Sparkles,
  ArrowRight, ChevronRight, GitBranch, Zap, RefreshCw,
} from "lucide-react";

const ACC = "hsl(191,92%,44%)";
const SURFACE = "hsla(0,0%,100%,0.025)";
const BORDER = "hsla(0,0%,100%,0.06)";
const TEXT_PRIMARY = "hsl(38,8%,92%)";
const TEXT_SEC = "hsl(214,7%,55%)";
const TEXT_MUT = "hsl(214,7%,38%)";

interface FlowEvent {
  id: string;
  from: string;
  to: string;
  label: string;
  description: string;
  color: string;
  delay: number;
}

interface Platform {
  id: string;
  name: string;
  color: string;
  icon: React.ElementType;
  x: number;
  y: number;
  role: string;
}

const PLATFORMS: Platform[] = [
  { id: "vessels", name: "Vessels", color: "#38bdf8", icon: Ship, x: 50, y: 10, role: "Maritime Intelligence" },
  { id: "aegis", name: "Aegis", color: "#f87171", icon: Shield, x: 85, y: 38, role: "Defense & Security" },
  { id: "prism", name: "PRISM", color: "#d4a054", icon: Layers, x: 72, y: 80, role: "Legal Intelligence" },
  { id: "lyte", name: "Lyte", color: "#d4a054", icon: Activity, x: 28, y: 80, role: "AIOps" },
  { id: "terra", name: "Terra", color: "#a07848", icon: Map, x: 15, y: 38, role: "Real Estate" },
  { id: "carlota", name: "Carlota Jo", color: "#c4aa7e", icon: Eye, x: 50, y: 50, role: "Advisory" },
];

const FLOW_EVENTS: FlowEvent[] = [
  {
    id: "f1",
    from: "vessels", to: "aegis",
    label: "Maritime Threat Signal",
    description: "M/V Meridian enters sanctioned port zone. Vessels detects AIS anomaly and triggers threat alert in Aegis for immediate response.",
    color: "#f87171",
    delay: 0,
  },
  {
    id: "f2",
    from: "aegis", to: "prism",
    label: "Compliance Requirement",
    description: "Aegis incident triggers OFAC compliance obligation. PRISM Counsel auto-creates matter, flags required disclosures, and begins document assembly.",
    color: "#d4a054",
    delay: 1200,
  },
  {
    id: "f3",
    from: "prism", to: "lyte",
    label: "Process Telemetry",
    description: "PRISM Counsel logs matter workflow step completion times. Lyte ingest pipeline captures and surfaces processing anomalies in real time.",
    color: "#60a5fa",
    delay: 2400,
  },
  {
    id: "f4",
    from: "lyte", to: "carlota",
    label: "Executive Brief",
    description: "Lyte's Operational Narrative Engine generates a plain-language summary of the incident timeline. Carlota Jo concierge delivers briefing to UHNW principal.",
    color: "#c4aa7e",
    delay: 3600,
  },
  {
    id: "f5",
    from: "terra", to: "vessels",
    label: "Port Risk Data",
    description: "Terra's distress property index at major port cities feeds into Vessels' route optimization model. Infrastructure risk informs maritime routing decisions.",
    color: "#38bdf8",
    delay: 4800,
  },
  {
    id: "f6",
    from: "carlota", to: "aegis",
    label: "Client Context",
    description: "Carlota Jo's client intelligence (travel patterns, property exposure) enriches Aegis threat modeling with personal risk profile data.",
    color: "#f87171",
    delay: 6000,
  },
];

function PlatformNode({ platform, isHighlighted, onClick }: {
  platform: Platform;
  isHighlighted: boolean;
  onClick: () => void;
}) {
  const Icon = platform.icon;
  return (
    <m.g
      style={{ cursor: "pointer" }}
      onClick={onClick}
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay: 0.2 }}
    >
      {isHighlighted && (
        <circle cx={`${platform.x}%`} cy={`${platform.y}%`} r="38" fill="none"
          stroke={platform.color} strokeWidth="1" opacity="0.3"
          style={{ animation: "pulse-node 2s ease-in-out infinite" }}
        />
      )}
      <circle cx={`${platform.x}%`} cy={`${platform.y}%`} r="28"
        fill={isHighlighted ? `${platform.color}20` : "rgba(12,16,24,0.9)"}
        stroke={isHighlighted ? platform.color : `${platform.color}50`}
        strokeWidth={isHighlighted ? "2" : "1"}
      />
      <text x={`${platform.x}%`} y={`${platform.y}%`} textAnchor="middle" dominantBaseline="middle"
        fontSize="16" fill={isHighlighted ? platform.color : `${platform.color}80`}
        style={{ pointerEvents: "none" }}>
        {platform.id === "vessels" ? "⛵" : platform.id === "aegis" ? "🛡" : platform.id === "prism" ? "⚖" : platform.id === "lyte" ? "⚡" : platform.id === "terra" ? "🗺" : "✦"}
      </text>
      <text x={`${platform.x}%`} y={`${platform.y}%`} dy="38" textAnchor="middle"
        fontSize="10" fill={isHighlighted ? platform.color : "rgba(255,255,255,0.4)"}
        fontWeight={isHighlighted ? "600" : "400"}
        style={{ pointerEvents: "none" }}>
        {platform.name}
      </text>
    </m.g>
  );
}

function FlowArrow({ event, platforms, active }: { event: FlowEvent; platforms: Platform[]; active: boolean }) {
  const from = platforms.find(p => p.id === event.from);
  const to = platforms.find(p => p.id === event.to);
  if (!from || !to) return null;
  const mx = (from.x + to.x) / 2;
  const my = (from.y + to.y) / 2;
  return (
    <m.line
      x1={`${from.x}%`} y1={`${from.y}%`}
      x2={`${to.x}%`} y2={`${to.y}%`}
      stroke={active ? event.color : "rgba(255,255,255,0.06)"}
      strokeWidth={active ? "2" : "1"}
      strokeDasharray={active ? "none" : "4 6"}
      markerEnd="url(#arrowhead)"
      opacity={active ? 0.8 : 0.3}
    />
  );
}

export default function FlywheelViz() {
  const [activeEventIdx, setActiveEventIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null);

  useEffect(() => {
    if (paused) return;
    const interval = setInterval(() => {
      setActiveEventIdx(i => (i + 1) % FLOW_EVENTS.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [paused]);

  const activeEvent = FLOW_EVENTS[activeEventIdx];
  const highlightedIds = new Set([activeEvent.from, activeEvent.to]);

  return (
    <div style={{ minHeight: "100vh", background: "hsl(214,16%,4%)" }}>
      <style>{`@keyframes pulse-node { 0%,100% { r:38; opacity:0.2; } 50% { r:48; opacity:0.4; } }`}</style>
      <SiteNav />
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "80px 24px 80px" }}>
        <div style={{ marginBottom: 40 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <GitBranch size={16} style={{ color: ACC }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: ACC, letterSpacing: "0.1em", textTransform: "uppercase" }}>
              Platform Flywheel
            </span>
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 300, color: TEXT_PRIMARY, margin: "0 0 10px", letterSpacing: "-0.03em" }}>
            Cross-Platform Data Flow
          </h1>
          <p style={{ fontSize: 14, color: TEXT_SEC, margin: 0 }}>
            How data flows between SZL platforms — how a maritime threat triggers a security response, creates a compliance requirement, and feeds an executive brief. The platform story investors need to see.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 20 }}>
          <div style={{
            background: SURFACE, border: `1px solid ${BORDER}`,
            borderRadius: 14, overflow: "hidden", position: "relative",
          }}>
            <svg width="100%" height="520" viewBox="0 0 100 100" preserveAspectRatio="none">
              <defs>
                <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="6" refY="3" orient="auto">
                  <polygon points="0 0, 8 3, 0 6" fill={activeEvent.color} opacity="0.7" />
                </marker>
              </defs>
              {FLOW_EVENTS.map((ev, i) => (
                <FlowArrow key={ev.id} event={ev} platforms={PLATFORMS} active={i === activeEventIdx} />
              ))}
              {PLATFORMS.map(p => (
                <PlatformNode
                  key={p.id}
                  platform={p}
                  isHighlighted={highlightedIds.has(p.id)}
                  onClick={() => setSelectedPlatform(p.id === selectedPlatform?.id ? null : p)}
                />
              ))}
            </svg>

            <div style={{ position: "absolute", bottom: 14, left: 14, right: 14 }}>
              <div style={{ display: "flex", gap: 6 }}>
                {FLOW_EVENTS.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => { setActiveEventIdx(i); setPaused(true); }}
                    style={{
                      flex: 1, height: 3, borderRadius: 2, border: "none", cursor: "pointer",
                      background: i === activeEventIdx ? FLOW_EVENTS[i].color : "rgba(255,255,255,0.12)",
                      transition: "background 0.3s",
                    }}
                  />
                ))}
              </div>
            </div>

            <button
              onClick={() => setPaused(!paused)}
              style={{
                position: "absolute", top: 12, right: 12,
                background: "rgba(12,16,24,0.8)", border: `1px solid ${BORDER}`,
                borderRadius: 6, padding: "5px 10px", cursor: "pointer",
                color: TEXT_MUT, fontSize: 11, display: "flex", alignItems: "center", gap: 4,
              }}
            >
              {paused ? <><Zap size={10} /> Resume</> : <><RefreshCw size={10} /> Pause</>}
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <AnimatePresence mode="wait">
              <m.div
                key={activeEventIdx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                style={{
                  background: SURFACE, border: `1px solid ${activeEvent.color}25`,
                  borderRadius: 12, padding: "18px 20px",
                }}
              >
                <div style={{ height: 2, background: activeEvent.color, borderRadius: 2, marginBottom: 16 }} />
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: activeEvent.color, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                    Active Flow
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: TEXT_PRIMARY }}>{PLATFORMS.find(p => p.id === activeEvent.from)?.name}</span>
                  <ArrowRight size={13} style={{ color: activeEvent.color }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: TEXT_PRIMARY }}>{PLATFORMS.find(p => p.id === activeEvent.to)?.name}</span>
                </div>
                <p style={{ fontSize: 13, fontWeight: 600, color: activeEvent.color, margin: "0 0 8px" }}>{activeEvent.label}</p>
                <p style={{ fontSize: 12, color: TEXT_SEC, margin: 0, lineHeight: 1.65 }}>{activeEvent.description}</p>
              </m.div>
            </AnimatePresence>

            <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 12, padding: "16px 18px" }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: TEXT_MUT, letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 12px" }}>
                All Data Flows
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {FLOW_EVENTS.map((ev, i) => (
                  <button
                    key={ev.id}
                    onClick={() => { setActiveEventIdx(i); setPaused(true); }}
                    style={{
                      display: "flex", alignItems: "center", gap: 8,
                      background: i === activeEventIdx ? `${ev.color}08` : "none",
                      border: `1px solid ${i === activeEventIdx ? ev.color + "25" : "transparent"}`,
                      borderRadius: 7, padding: "8px 10px", cursor: "pointer", textAlign: "left",
                    }}
                  >
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: ev.color, flexShrink: 0 }} />
                    <div>
                      <p style={{ fontSize: 11, fontWeight: 500, color: i === activeEventIdx ? TEXT_PRIMARY : TEXT_SEC, margin: 0 }}>{ev.label}</p>
                      <p style={{ fontSize: 10, color: TEXT_MUT, margin: 0 }}>
                        {PLATFORMS.find(p => p.id === ev.from)?.name} → {PLATFORMS.find(p => p.id === ev.to)?.name}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div style={{
              background: `${ACC}08`, border: `1px solid ${ACC}20`,
              borderRadius: 10, padding: "14px 16px",
            }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: ACC, margin: "0 0 6px" }}>The Platform Flywheel</p>
              <p style={{ fontSize: 11, color: TEXT_SEC, margin: 0, lineHeight: 1.6 }}>
                Every action in any SZL product creates intelligence that improves every other product. The more verticals a client uses, the more valuable each individual vertical becomes. This is the moat.
              </p>
            </div>
          </div>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
