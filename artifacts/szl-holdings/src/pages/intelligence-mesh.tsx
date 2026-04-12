import { useState, useEffect, useRef, useCallback } from "react";
import { m, AnimatePresence } from "framer-motion";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";
import {
  Activity, ArrowRight, RefreshCw, Filter, ChevronDown, ChevronUp,
  Zap, Shield, Ship, MapPin, Scale, Eye, Users, TrendingUp, GitBranch,
  AlertTriangle, CheckCircle2, Info, Settings2, BarChart3, Network,
} from "lucide-react";
import { CinematicReveal, LiveIndicator, NoiseGrain } from "@szl-holdings/shared-ui";

const BG = "hsl(214,16%,4%)";
const SURFACE = "hsla(0,0%,100%,0.025)";
const BORDER = "hsla(0,0%,100%,0.06)";
const BORDER_HOVER = "hsla(0,0%,100%,0.12)";
const TEXT_PRIMARY = "hsl(38,8%,92%)";
const TEXT_SEC = "hsl(214,7%,55%)";
const TEXT_MUT = "hsl(214,7%,35%)";
const ACC = "hsl(192,72%,48%)";

const VENTURES = [
  { id: "vessels", name: "Vessels", domain: "Maritime", color: "hsl(206,72%,52%)", Icon: Ship },
  { id: "aegis", name: "Aegis", domain: "Defense", color: "hsl(222,60%,62%)", Icon: Shield },
  { id: "terra", name: "Terra", domain: "Real Estate", color: "hsl(140,50%,48%)", Icon: MapPin },
  { id: "prism", name: "PRISM", domain: "Legal", color: "hsl(38,72%,58%)", Icon: Scale },
  { id: "lyte", name: "Lyte", domain: "Observability", color: "hsl(192,72%,48%)", Icon: Eye },
  { id: "carlota-jo", name: "Carlota Jo", domain: "Advisory", color: "hsl(280,50%,65%)", Icon: Users },
];

const SEVERITY_COLORS: Record<string, string> = {
  critical: "hsl(0,72%,56%)",
  high: "hsl(22,90%,56%)",
  medium: "hsl(38,72%,58%)",
  low: "hsl(192,72%,48%)",
};

const TYPE_ICONS: Record<string, React.ElementType> = {
  threat: Shield,
  distress: AlertTriangle,
  incident: Zap,
  compliance: Scale,
  anomaly: Activity,
  risk: TrendingUp,
};

interface MeshSignal {
  id: string;
  sourceVenture: string;
  sourceVentureName: string;
  signalType: string;
  severity: string;
  title: string;
  confidence: number;
  detectedAt: string;
  enrichedVentures: string[];
  status: string;
}

interface MeshEvent {
  id: string;
  signalId: string;
  sourceVenture: string;
  sourceVentureName: string;
  targetVenture: string;
  targetVentureName: string;
  signalType: string;
  severity: string;
  title: string;
  enrichmentContext: string;
  routingRule: string;
  confidence: number;
  detectedAt: string;
  enrichedAt: string;
  actionRecommendation: string;
  status: string;
  compoundInsight: boolean;
}

interface CompoundValue {
  totalSignalsGenerated: number;
  totalCrossVentureRoutes: number;
  signalsEnrichedByMesh: number;
  signalsMissedInIsolation: number;
  enrichmentRate: number;
  missedInsightRate: number;
  ventureBreakdown: Array<{
    ventureId: string;
    ventureName: string;
    signalsSent: number;
    signalsReceived: number;
    enrichmentsProvided: number;
    compoundInsightsUnlocked: number;
  }>;
  topRoutingPairs: Array<{
    source: string;
    target: string;
    eventCount: number;
    avgConfidenceGain: number;
  }>;
  calculatedAt: string;
}

interface RoutingRule {
  id: string;
  sourceVenture: string;
  targetVenture: string;
  signalType: string;
  condition: string;
  description: string;
  enabled: boolean;
}

function formatAge(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function SeverityBadge({ severity }: { severity: string }) {
  const color = SEVERITY_COLORS[severity] ?? TEXT_SEC;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      padding: "0.125rem 0.5rem",
      borderRadius: "99px",
      fontSize: "0.6875rem",
      fontWeight: 700,
      letterSpacing: "0.06em",
      textTransform: "uppercase",
      color,
      background: `${color}22`,
      border: `1px solid ${color}44`,
    }}>
      {severity}
    </span>
  );
}

function TypeChip({ type }: { type: string }) {
  const Icon = TYPE_ICONS[type] ?? Activity;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "0.25rem",
      padding: "0.125rem 0.5rem",
      borderRadius: "0.25rem",
      fontSize: "0.6875rem",
      fontWeight: 500,
      color: TEXT_SEC,
      background: SURFACE,
      border: `1px solid ${BORDER}`,
    }}>
      <Icon size={10} />
      {type}
    </span>
  );
}

function VentureDot({ ventureId, size = 8 }: { ventureId: string; size?: number }) {
  const v = VENTURES.find(v => v.id === ventureId);
  return (
    <span style={{
      display: "inline-block",
      width: size,
      height: size,
      borderRadius: "50%",
      background: v?.color ?? TEXT_MUT,
      flexShrink: 0,
    }} />
  );
}

// ── Animated mesh network visualization ─────────────────────────────────────
interface ActivePulse {
  id: string;
  sourceIdx: number;
  targetIdx: number;
  progress: number;
  color: string;
  type: string;
}

function MeshNetworkViz({ events }: { events: MeshEvent[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const pulsesRef = useRef<ActivePulse[]>([]);
  const [dimensions, setDimensions] = useState({ w: 800, h: 420 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const obs = new ResizeObserver(entries => {
      for (const entry of entries) {
        setDimensions({ w: entry.contentRect.width, h: Math.min(420, Math.max(300, entry.contentRect.width * 0.48)) });
      }
    });
    if (containerRef.current) obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  const { w, h } = dimensions;

  const nodePositions = VENTURES.map((_, i) => {
    const angle = (i / VENTURES.length) * Math.PI * 2 - Math.PI / 2;
    const rx = w * 0.38;
    const ry = h * 0.38;
    return {
      x: w / 2 + rx * Math.cos(angle),
      y: h / 2 + ry * Math.sin(angle),
    };
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const eventQueue = events.slice(0, 40);
    let eventCursor = 0;
    let lastSpawn = 0;

    function spawnPulse() {
      if (eventQueue.length === 0) return;
      const ev = eventQueue[eventCursor % eventQueue.length];
      eventCursor++;
      const srcIdx = VENTURES.findIndex(v => v.id === ev.sourceVenture);
      const tgtIdx = VENTURES.findIndex(v => v.id === ev.targetVenture);
      if (srcIdx === -1 || tgtIdx === -1) return;
      const srcV = VENTURES[srcIdx];
      pulsesRef.current.push({
        id: `${Date.now()}_${Math.random()}`,
        sourceIdx: srcIdx,
        targetIdx: tgtIdx,
        progress: 0,
        color: srcV.color,
        type: ev.signalType,
      });
    }

    function draw(ts: number) {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, w, h);

      // Background connections
      for (let i = 0; i < VENTURES.length; i++) {
        for (let j = i + 1; j < VENTURES.length; j++) {
          const a = nodePositions[i];
          const b = nodePositions[j];
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = "hsla(0,0%,100%,0.04)";
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }

      // Spawn pulses
      if (ts - lastSpawn > 800) {
        spawnPulse();
        lastSpawn = ts;
      }

      // Draw pulses
      pulsesRef.current = pulsesRef.current.filter(p => p.progress < 1);
      for (const pulse of pulsesRef.current) {
        pulse.progress += 0.008;
        const src = nodePositions[pulse.sourceIdx];
        const tgt = nodePositions[pulse.targetIdx];
        const px = src.x + (tgt.x - src.x) * pulse.progress;
        const py = src.y + (tgt.y - src.y) * pulse.progress;

        // Glowing trail
        const grad = ctx.createRadialGradient(px, py, 0, px, py, 14);
        grad.addColorStop(0, pulse.color);
        grad.addColorStop(0.4, pulse.color + "88");
        grad.addColorStop(1, pulse.color + "00");
        ctx.beginPath();
        ctx.arc(px, py, 14, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();

        // Bright core
        ctx.beginPath();
        ctx.arc(px, py, 3, 0, Math.PI * 2);
        ctx.fillStyle = pulse.color;
        ctx.fill();

        // Trail
        const trailLen = 0.12;
        const trailStart = Math.max(0, pulse.progress - trailLen);
        const tx = src.x + (tgt.x - src.x) * trailStart;
        const ty = src.y + (tgt.y - src.y) * trailStart;
        const lineGrad = ctx.createLinearGradient(tx, ty, px, py);
        lineGrad.addColorStop(0, pulse.color + "00");
        lineGrad.addColorStop(1, pulse.color + "cc");
        ctx.beginPath();
        ctx.moveTo(tx, ty);
        ctx.lineTo(px, py);
        ctx.strokeStyle = lineGrad;
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Draw nodes
      for (let i = 0; i < VENTURES.length; i++) {
        const v = VENTURES[i];
        const pos = nodePositions[i];
        const r = 28;

        // Outer glow
        const outerGrad = ctx.createRadialGradient(pos.x, pos.y, r * 0.6, pos.x, pos.y, r * 2);
        outerGrad.addColorStop(0, v.color + "30");
        outerGrad.addColorStop(1, v.color + "00");
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, r * 2, 0, Math.PI * 2);
        ctx.fillStyle = outerGrad;
        ctx.fill();

        // Circle
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, r, 0, Math.PI * 2);
        ctx.fillStyle = "hsl(214,16%,8%)";
        ctx.fill();
        ctx.strokeStyle = v.color + "88";
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Label
        ctx.fillStyle = "hsl(38,8%,88%)";
        ctx.font = `600 11px system-ui, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(v.name, pos.x, pos.y - 4);
        ctx.fillStyle = v.color;
        ctx.font = `500 9px system-ui, sans-serif`;
        ctx.fillText(v.domain, pos.x, pos.y + 8);
      }

      animRef.current = requestAnimationFrame(draw);
    }

    animRef.current = requestAnimationFrame(draw);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [events, w, h, nodePositions]);

  return (
    <div ref={containerRef} style={{ width: "100%", position: "relative" }}>
      <canvas
        ref={canvasRef}
        width={w}
        height={h}
        style={{ width: "100%", height: h, display: "block", borderRadius: "0.75rem" }}
      />
    </div>
  );
}

// ── Mesh Feed ────────────────────────────────────────────────────────────────
function MeshFeedItem({ event, index }: { event: MeshEvent; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const Icon = TYPE_ICONS[event.signalType] ?? Activity;
  const srcV = VENTURES.find(v => v.id === event.sourceVenture);
  const tgtV = VENTURES.find(v => v.id === event.targetVenture);
  const sevColor = SEVERITY_COLORS[event.severity] ?? TEXT_SEC;

  return (
    <m.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.03 }}
      style={{
        borderRadius: "0.625rem",
        border: `1px solid ${event.compoundInsight ? "hsla(192,72%,48%,0.25)" : BORDER}`,
        background: event.compoundInsight ? "hsla(192,72%,48%,0.04)" : SURFACE,
        overflow: "hidden",
        transition: "border-color 0.2s",
      }}
    >
      <button
        onClick={() => setExpanded(e => !e)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "flex-start",
          gap: "0.875rem",
          padding: "0.875rem 1rem",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <div style={{
          width: 36, height: 36, borderRadius: "0.5rem", flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: `${sevColor}18`,
          border: `1px solid ${sevColor}33`,
        }}>
          <Icon size={16} color={sevColor} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.25rem" }}>
            <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: TEXT_PRIMARY, lineHeight: 1.35 }}>
              {event.title}
            </span>
            {event.compoundInsight && (
              <span style={{
                display: "inline-flex", alignItems: "center", gap: "0.2rem",
                padding: "0.1rem 0.4rem",
                borderRadius: "99px",
                fontSize: "0.625rem",
                fontWeight: 700,
                letterSpacing: "0.08em",
                color: ACC,
                background: "hsla(192,72%,48%,0.12)",
                border: "1px solid hsla(192,72%,48%,0.3)",
                flexShrink: 0,
              }}>
                <GitBranch size={8} />
                COMPOUND
              </span>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
              <VentureDot ventureId={event.sourceVenture} />
              <span style={{ fontSize: "0.75rem", color: srcV?.color ?? TEXT_SEC, fontWeight: 500 }}>
                {event.sourceVentureName}
              </span>
            </div>
            <ArrowRight size={11} color={TEXT_MUT} />
            <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
              <VentureDot ventureId={event.targetVenture} />
              <span style={{ fontSize: "0.75rem", color: tgtV?.color ?? TEXT_SEC, fontWeight: 500 }}>
                {event.targetVentureName}
              </span>
            </div>
            <TypeChip type={event.signalType} />
            <SeverityBadge severity={event.severity} />
            <span style={{ fontSize: "0.6875rem", color: TEXT_MUT, marginLeft: "auto" }}>
              {formatAge(event.enrichedAt)}
            </span>
          </div>
        </div>
        <div style={{ flexShrink: 0, color: TEXT_MUT, paddingTop: "0.1rem" }}>
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </div>
      </button>
      <AnimatePresence>
        {expanded && (
          <m.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            style={{ overflow: "hidden" }}
          >
            <div style={{
              padding: "0 1rem 0.875rem 3.375rem",
              display: "flex", flexDirection: "column", gap: "0.75rem",
            }}>
              <div style={{
                padding: "0.625rem 0.875rem",
                borderRadius: "0.375rem",
                background: "hsla(0,0%,100%,0.03)",
                border: `1px solid ${BORDER}`,
                fontSize: "0.8125rem",
                color: TEXT_SEC,
                lineHeight: 1.65,
              }}>
                <span style={{ color: TEXT_MUT, fontWeight: 500, fontSize: "0.75rem" }}>Enrichment context: </span>
                {event.enrichmentContext}
              </div>
              <div style={{
                padding: "0.625rem 0.875rem",
                borderRadius: "0.375rem",
                background: "hsla(38,72%,58%,0.06)",
                border: "1px solid hsla(38,72%,58%,0.18)",
              }}>
                <div style={{ fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "hsl(38,72%,58%)", marginBottom: "0.25rem" }}>
                  Action recommendation
                </div>
                <div style={{ fontSize: "0.8125rem", color: TEXT_PRIMARY, lineHeight: 1.6 }}>
                  {event.actionRecommendation}
                </div>
              </div>
              <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontSize: "0.6875rem", color: TEXT_MUT, marginBottom: "0.125rem" }}>Confidence</div>
                  <div style={{ fontSize: "0.875rem", fontWeight: 600, color: TEXT_PRIMARY }}>
                    {Math.round(event.confidence * 100)}%
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: "0.6875rem", color: TEXT_MUT, marginBottom: "0.125rem" }}>Detected</div>
                  <div style={{ fontSize: "0.875rem", fontWeight: 600, color: TEXT_PRIMARY }}>{formatAge(event.detectedAt)}</div>
                </div>
                <div>
                  <div style={{ fontSize: "0.6875rem", color: TEXT_MUT, marginBottom: "0.125rem" }}>Enriched</div>
                  <div style={{ fontSize: "0.875rem", fontWeight: 600, color: TEXT_PRIMARY }}>{formatAge(event.enrichedAt)}</div>
                </div>
                <div>
                  <div style={{ fontSize: "0.6875rem", color: TEXT_MUT, marginBottom: "0.125rem" }}>Status</div>
                  <div style={{ fontSize: "0.875rem", fontWeight: 600, color: event.status === "active" ? "hsl(145,60%,52%)" : TEXT_SEC }}>
                    {event.status}
                  </div>
                </div>
              </div>
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </m.div>
  );
}

// ── Compound Value Panel ─────────────────────────────────────────────────────
function CompoundValuePanel({ data }: { data: CompoundValue }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "0.875rem" }}>
        {[
          { label: "Signals Generated", value: data.totalSignalsGenerated, accent: ACC, suffix: "" },
          { label: "Cross-Venture Routes", value: data.totalCrossVentureRoutes, accent: "hsl(206,72%,52%)", suffix: "" },
          { label: "Enriched by Mesh", value: data.signalsEnrichedByMesh, accent: "hsl(145,60%,52%)", suffix: "" },
          { label: "Missed in Isolation", value: data.signalsMissedInIsolation, accent: "hsl(38,72%,58%)", suffix: "", desc: "Cross-venture compound insights that single-venture analysis would not have produced" },
          { label: "Enrichment Rate", value: `${(data.enrichmentRate * 100).toFixed(0)}%`, accent: ACC, suffix: "" },
          { label: "Compound Signal Rate", value: `${(data.missedInsightRate * 100).toFixed(0)}%`, accent: "hsl(280,50%,65%)", suffix: "" },
        ].map(m => (
          <div
            key={m.label}
            style={{
              padding: "1rem 1.125rem",
              borderRadius: "0.625rem",
              background: SURFACE,
              border: `1px solid ${BORDER}`,
              display: "flex", flexDirection: "column", gap: "0.375rem",
            }}
            title={m.desc}
          >
            <div style={{ fontSize: "0.6875rem", color: TEXT_MUT, fontWeight: 500, letterSpacing: "0.04em" }}>{m.label}</div>
            <div style={{ fontSize: "1.5rem", fontWeight: 700, color: m.accent, letterSpacing: "-0.02em" }}>
              {m.value}
            </div>
          </div>
        ))}
      </div>

      <div>
        <div style={{ fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: TEXT_MUT, marginBottom: "0.875rem" }}>
          Top Routing Pairs
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {data.topRoutingPairs.map((pair, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: "0.75rem",
              padding: "0.625rem 0.875rem",
              borderRadius: "0.375rem",
              background: SURFACE,
              border: `1px solid ${BORDER}`,
            }}>
              <span style={{ fontSize: "0.75rem", fontWeight: 600, color: TEXT_PRIMARY, minWidth: "5rem" }}>{pair.source}</span>
              <ArrowRight size={12} color={TEXT_MUT} style={{ flexShrink: 0 }} />
              <span style={{ fontSize: "0.75rem", fontWeight: 600, color: TEXT_PRIMARY, flex: 1 }}>{pair.target}</span>
              <span style={{ fontSize: "0.75rem", color: ACC, fontWeight: 600 }}>{pair.eventCount} routes</span>
              <span style={{ fontSize: "0.6875rem", color: TEXT_MUT }}>{Math.round(pair.avgConfidenceGain * 100)}% conf.</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div style={{ fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: TEXT_MUT, marginBottom: "0.875rem" }}>
          Venture Breakdown
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "0.625rem" }}>
          {data.ventureBreakdown.map(vb => {
            const v = VENTURES.find(x => x.id === vb.ventureId);
            return (
              <div key={vb.ventureId} style={{
                padding: "0.875rem 1rem",
                borderRadius: "0.5rem",
                background: SURFACE,
                border: `1px solid ${BORDER}`,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.625rem" }}>
                  {v && <v.Icon size={14} color={v.color} />}
                  <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: v?.color ?? TEXT_PRIMARY }}>
                    {vb.ventureName}
                  </span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.375rem" }}>
                  {[
                    { label: "Signals sent", value: vb.signalsSent },
                    { label: "Received", value: vb.signalsReceived },
                    { label: "Enrichments", value: vb.enrichmentsProvided },
                    { label: "Compound", value: vb.compoundInsightsUnlocked },
                  ].map(row => (
                    <div key={row.label}>
                      <div style={{ fontSize: "0.625rem", color: TEXT_MUT }}>{row.label}</div>
                      <div style={{ fontSize: "0.875rem", fontWeight: 700, color: row.value > 0 ? TEXT_PRIMARY : TEXT_MUT }}>
                        {row.value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Routing Rules Panel ──────────────────────────────────────────────────────
function RoutingRulesPanel({ rules }: { rules: RoutingRule[] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      {rules.map(rule => {
        const srcV = VENTURES.find(v => v.id === rule.sourceVenture);
        const tgtV = VENTURES.find(v => v.id === rule.targetVenture);
        return (
          <div key={rule.id} style={{
            display: "flex", alignItems: "center", gap: "0.875rem",
            padding: "0.75rem 1rem",
            borderRadius: "0.5rem",
            background: SURFACE,
            border: `1px solid ${rule.enabled ? BORDER : "hsla(0,0%,100%,0.03)"}`,
            opacity: rule.enabled ? 1 : 0.45,
            transition: "opacity 0.2s",
          }}>
            <div style={{
              width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
              background: rule.enabled ? "hsl(145,60%,52%)" : TEXT_MUT,
            }} />
            <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", flexShrink: 0 }}>
              <span style={{ fontSize: "0.75rem", fontWeight: 600, color: srcV?.color ?? TEXT_SEC }}>{srcV?.name ?? rule.sourceVenture}</span>
              <ArrowRight size={11} color={TEXT_MUT} />
              <span style={{ fontSize: "0.75rem", fontWeight: 600, color: tgtV?.color ?? TEXT_SEC }}>{tgtV?.name ?? rule.targetVenture}</span>
            </div>
            <TypeChip type={rule.signalType} />
            <span style={{ fontSize: "0.75rem", color: TEXT_SEC, flex: 1, lineHeight: 1.45 }}>{rule.description}</span>
            <span style={{ fontSize: "0.6875rem", color: TEXT_MUT, flexShrink: 0, fontFamily: "monospace" }}>
              {rule.condition}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────
type Tab = "mesh" | "feed" | "compound" | "rules";

export default function IntelligenceMeshPage() {
  usePageMeta({
    title: "Compound Intelligence Mesh — SZL Holdings",
    description: "Real-time cross-venture intelligence sharing. When one venture detects a signal, it automatically enriches every other relevant venture in the ecosystem.",
    canonical: "https://szlholdings.com/intelligence-mesh",
  });

  const [tab, setTab] = useState<Tab>("mesh");
  const [events, setEvents] = useState<MeshEvent[]>([]);
  const [compoundValue, setCompoundValue] = useState<CompoundValue | null>(null);
  const [rules, setRules] = useState<RoutingRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [filterType, setFilterType] = useState<string>("all");
  const [filterSeverity, setFilterSeverity] = useState<string>("all");

  const fetchData = useCallback(async () => {
    try {
      const [feedRes, compRes, rulesRes] = await Promise.all([
        fetch("/api/intelligence-mesh/feed?limit=50"),
        fetch("/api/intelligence-mesh/compound-value"),
        fetch("/api/intelligence-mesh/routing-rules"),
      ]);
      if (feedRes.ok) {
        const data = await feedRes.json();
        setEvents(data.events ?? []);
      }
      if (compRes.ok) {
        const data = await compRes.json();
        setCompoundValue(data);
      }
      if (rulesRes.ok) {
        const data = await rulesRes.json();
        setRules(data.rules ?? []);
      }
      setLastRefresh(new Date());
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const filteredEvents = events.filter(e => {
    if (filterType !== "all" && e.signalType !== filterType) return false;
    if (filterSeverity !== "all" && e.severity !== filterSeverity) return false;
    return true;
  });

  const TABS: Array<{ id: Tab; label: string; Icon: React.ElementType }> = [
    { id: "mesh", label: "Mesh Visualization", Icon: Network },
    { id: "feed", label: "Mesh Feed", Icon: Activity },
    { id: "compound", label: "Compound Value", Icon: BarChart3 },
    { id: "rules", label: "Routing Rules", Icon: Settings2 },
  ];

  return (
    <div style={{ minHeight: "100vh", background: BG, color: TEXT_PRIMARY }}>
      <NoiseGrain opacity={0.025} />
      <SiteNav />
      <main id="main-content" style={{ paddingBottom: "6rem" }}>
        {/* ── Header ── */}
        <section style={{ borderBottom: `1px solid ${BORDER}`, position: "relative", overflow: "hidden" }}>
          <div style={{
            pointerEvents: "none", position: "absolute", inset: 0,
            background: "radial-gradient(ellipse 60% 40% at 50% 0%, hsla(192,72%,48%,0.06) 0%, transparent 70%)",
          }} />
          <div style={{ maxWidth: 1280, margin: "0 auto", padding: "clamp(5rem,10vw,7rem) var(--space-content-x) clamp(2.5rem,5vw,4rem)" }}>
            <CinematicReveal>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
                <p style={{ fontSize: "0.6875rem", fontFamily: "var(--font-mono)", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: TEXT_MUT }}>
                  SZL Holdings · Intelligence Layer
                </p>
                <LiveIndicator color={ACC} showTimestamp={false} />
              </div>
              <h1 style={{ fontSize: "clamp(2rem,4vw,3rem)", fontWeight: 700, letterSpacing: "-0.025em", lineHeight: 1.1, marginBottom: "1.25rem" }}>
                Compound Intelligence Mesh
              </h1>
              <p style={{ fontSize: "clamp(0.9375rem,1.5vw,1.0625rem)", color: TEXT_SEC, maxWidth: "54ch", lineHeight: 1.7, marginBottom: "2rem" }}>
                Real-time cross-venture signal sharing. When Vessels flags a suspicious entity, that signal automatically enriches Aegis, Terra, and PRISM — compounding intelligence across every domain rather than leaving it siloed.
              </p>
              <div style={{ display: "flex", gap: "0.875rem", flexWrap: "wrap" }}>
                {compoundValue && (
                  <>
                    <div style={{ padding: "0.5rem 1rem", borderRadius: "0.5rem", background: "hsla(192,72%,48%,0.1)", border: "1px solid hsla(192,72%,48%,0.25)" }}>
                      <span style={{ fontSize: "0.6875rem", color: TEXT_MUT, marginRight: "0.375rem" }}>Signals today</span>
                      <span style={{ fontSize: "0.875rem", fontWeight: 700, color: ACC }}>{compoundValue.totalSignalsGenerated}</span>
                    </div>
                    <div style={{ padding: "0.5rem 1rem", borderRadius: "0.5rem", background: "hsla(145,60%,52%,0.1)", border: "1px solid hsla(145,60%,52%,0.25)" }}>
                      <span style={{ fontSize: "0.6875rem", color: TEXT_MUT, marginRight: "0.375rem" }}>Cross-venture routes</span>
                      <span style={{ fontSize: "0.875rem", fontWeight: 700, color: "hsl(145,60%,52%)" }}>{compoundValue.totalCrossVentureRoutes}</span>
                    </div>
                    <div style={{ padding: "0.5rem 1rem", borderRadius: "0.5rem", background: "hsla(38,72%,58%,0.1)", border: "1px solid hsla(38,72%,58%,0.25)" }}>
                      <span style={{ fontSize: "0.6875rem", color: TEXT_MUT, marginRight: "0.375rem" }}>Compound insights</span>
                      <span style={{ fontSize: "0.875rem", fontWeight: 700, color: "hsl(38,72%,58%)" }}>{compoundValue.signalsMissedInIsolation}</span>
                    </div>
                  </>
                )}
                <button
                  onClick={fetchData}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: "0.375rem",
                    padding: "0.5rem 1rem",
                    background: SURFACE,
                    border: `1px solid ${BORDER_HOVER}`,
                    borderRadius: "0.5rem",
                    color: TEXT_SEC,
                    fontSize: "0.8125rem",
                    cursor: "pointer",
                  }}
                >
                  <RefreshCw size={13} />
                  {lastRefresh ? `Updated ${formatAge(lastRefresh.toISOString())}` : "Refresh"}
                </button>
              </div>
            </CinematicReveal>
          </div>
        </section>

        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "2.5rem var(--space-content-x) 0" }}>
          {/* ── Tab nav ── */}
          <div style={{ display: "flex", gap: "0.25rem", marginBottom: "2rem", borderBottom: `1px solid ${BORDER}`, paddingBottom: "0" }}>
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                style={{
                  display: "inline-flex", alignItems: "center", gap: "0.4rem",
                  padding: "0.625rem 1rem",
                  background: "transparent",
                  border: "none",
                  borderBottom: `2px solid ${tab === t.id ? ACC : "transparent"}`,
                  color: tab === t.id ? ACC : TEXT_SEC,
                  fontSize: "0.875rem",
                  fontWeight: tab === t.id ? 600 : 400,
                  cursor: "pointer",
                  transition: "color 0.15s, border-color 0.15s",
                  marginBottom: "-1px",
                }}
              >
                <t.Icon size={15} />
                {t.label}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {tab === "mesh" && (
              <m.div key="mesh" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1.5rem" }}>
                  <div style={{
                    borderRadius: "0.875rem",
                    border: `1px solid ${BORDER}`,
                    background: "hsl(214,16%,6%)",
                    padding: "1.25rem",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
                      <div>
                        <div style={{ fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: TEXT_MUT, marginBottom: "0.25rem" }}>
                          Live Signal Flow
                        </div>
                        <div style={{ fontSize: "0.875rem", color: TEXT_SEC }}>
                          Animated cross-venture intelligence propagation — each pulse is a live signal enrichment event
                        </div>
                      </div>
                      <LiveIndicator color={ACC} label="MESH ACTIVE" />
                    </div>
                    {loading ? (
                      <div style={{ height: 360, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <div style={{ width: 24, height: 24, border: `2px solid ${BORDER_HOVER}`, borderTopColor: ACC, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                      </div>
                    ) : (
                      <MeshNetworkViz events={events} />
                    )}
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "0.875rem" }}>
                    {VENTURES.map(v => {
                      const sent = events.filter(e => e.sourceVenture === v.id).length;
                      const received = events.filter(e => e.targetVenture === v.id).length;
                      const active = events.filter(e => e.targetVenture === v.id && e.status === "active").length;
                      return (
                        <div key={v.id} style={{
                          padding: "1rem 1.125rem",
                          borderRadius: "0.625rem",
                          background: SURFACE,
                          border: `1px solid ${active > 0 ? v.color + "44" : BORDER}`,
                          transition: "border-color 0.2s",
                        }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
                            <v.Icon size={15} color={v.color} />
                            <span style={{ fontSize: "0.875rem", fontWeight: 600, color: v.color }}>{v.name}</span>
                            {active > 0 && (
                              <span style={{
                                marginLeft: "auto", display: "inline-flex", alignItems: "center", justifyContent: "center",
                                width: 20, height: 20, borderRadius: "50%",
                                background: `${v.color}22`, border: `1px solid ${v.color}55`,
                                fontSize: "0.6875rem", fontWeight: 700, color: v.color,
                              }}>
                                {active}
                              </span>
                            )}
                          </div>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                            <div>
                              <div style={{ fontSize: "0.625rem", color: TEXT_MUT }}>Signals sent</div>
                              <div style={{ fontSize: "1.125rem", fontWeight: 700, color: TEXT_PRIMARY }}>{sent}</div>
                            </div>
                            <div>
                              <div style={{ fontSize: "0.625rem", color: TEXT_MUT }}>Enrichments in</div>
                              <div style={{ fontSize: "1.125rem", fontWeight: 700, color: active > 0 ? v.color : TEXT_PRIMARY }}>{received}</div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </m.div>
            )}

            {tab === "feed" && (
              <m.div key="feed" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
                <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.5rem", flexWrap: "wrap", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", color: TEXT_MUT }}>
                    <Filter size={13} />
                    <span style={{ fontSize: "0.8125rem" }}>Filter:</span>
                  </div>
                  <select
                    value={filterType}
                    onChange={e => setFilterType(e.target.value)}
                    style={{
                      padding: "0.375rem 0.75rem",
                      borderRadius: "0.375rem",
                      background: "hsl(214,16%,9%)",
                      border: `1px solid ${BORDER_HOVER}`,
                      color: TEXT_PRIMARY,
                      fontSize: "0.8125rem",
                      cursor: "pointer",
                    }}
                  >
                    <option value="all">All types</option>
                    {["threat", "distress", "incident", "compliance", "anomaly", "risk"].map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                  <select
                    value={filterSeverity}
                    onChange={e => setFilterSeverity(e.target.value)}
                    style={{
                      padding: "0.375rem 0.75rem",
                      borderRadius: "0.375rem",
                      background: "hsl(214,16%,9%)",
                      border: `1px solid ${BORDER_HOVER}`,
                      color: TEXT_PRIMARY,
                      fontSize: "0.8125rem",
                      cursor: "pointer",
                    }}
                  >
                    <option value="all">All severities</option>
                    {["critical", "high", "medium", "low"].map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <span style={{ fontSize: "0.8125rem", color: TEXT_MUT, marginLeft: "auto" }}>
                    {filteredEvents.length} events
                  </span>
                </div>
                {loading ? (
                  <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ width: 24, height: 24, border: `2px solid ${BORDER_HOVER}`, borderTopColor: ACC, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                  </div>
                ) : filteredEvents.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "4rem 2rem", color: TEXT_MUT }}>
                    <Activity size={32} style={{ margin: "0 auto 1rem" }} />
                    <div style={{ fontSize: "0.875rem" }}>No events match current filters</div>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    {filteredEvents.map((event, i) => (
                      <MeshFeedItem key={event.id} event={event} index={i} />
                    ))}
                  </div>
                )}
              </m.div>
            )}

            {tab === "compound" && (
              <m.div key="compound" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
                <div style={{ marginBottom: "1.5rem" }}>
                  <h2 style={{ fontSize: "1.125rem", fontWeight: 600, color: TEXT_PRIMARY, marginBottom: "0.5rem" }}>Compound Value Analytics</h2>
                  <p style={{ fontSize: "0.875rem", color: TEXT_SEC, lineHeight: 1.6, maxWidth: "60ch" }}>
                    Quantifying how many signals were enriched by cross-venture correlation, and how many compound insights would have been missed had each venture operated in isolation.
                  </p>
                </div>
                {loading || !compoundValue ? (
                  <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ width: 24, height: 24, border: `2px solid ${BORDER_HOVER}`, borderTopColor: ACC, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                  </div>
                ) : (
                  <CompoundValuePanel data={compoundValue} />
                )}
              </m.div>
            )}

            {tab === "rules" && (
              <m.div key="rules" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
                <div style={{ marginBottom: "1.5rem" }}>
                  <h2 style={{ fontSize: "1.125rem", fontWeight: 600, color: TEXT_PRIMARY, marginBottom: "0.5rem" }}>Signal Routing Rules</h2>
                  <p style={{ fontSize: "0.875rem", color: TEXT_SEC, lineHeight: 1.6, maxWidth: "60ch" }}>
                    Configurable rules defining which signal types from which ventures propagate to which other ventures. Rules fire based on signal type, severity, and confidence thresholds.
                  </p>
                </div>
                {rules.length === 0 ? (
                  <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ width: 24, height: 24, border: `2px solid ${BORDER_HOVER}`, borderTopColor: ACC, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                  </div>
                ) : (
                  <RoutingRulesPanel rules={rules} />
                )}
              </m.div>
            )}
          </AnimatePresence>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
