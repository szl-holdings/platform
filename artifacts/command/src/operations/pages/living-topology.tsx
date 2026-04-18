import { useState, useEffect, useRef, useCallback } from "react";
import { Network, Activity, AlertTriangle, Zap, RefreshCw, ChevronRight, Cpu, Radio, Eye } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@szl-holdings/shared-ui/api-fetch";

interface TopologyNode {
  service: string;
  avgLatency: number;
  avgErrorRate: number;
  anomalyCount: number;
  dataPoints: number;
  health: "healthy" | "degraded" | "down";
}

interface NodeState {
  id: string;
  label: string;
  platform: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  pulse: number;
  health: "healthy" | "degraded" | "critical" | "dead";
  healthScore: number;
  latencyMs: number;
  errorRate: number;
  throughput: number;
  anomaly: boolean;
  ripple: number;
  connects: string[];
}

interface Particle {
  id: number;
  fromId: string;
  toId: string;
  progress: number;
  speed: number;
  color: string;
  size: number;
}

const PLATFORM_NODES = [
  { id: "api-gateway",      label: "API Gateway",      platform: "Core",      connects: ["lyte-core", "alloy-engine", "firestorm-soc", "terra-lyte"] },
  { id: "lyte-core",        label: "Lyte Core",        platform: "Lyte",      connects: ["signal-bus", "action-router", "prism-engine"] },
  { id: "alloy-engine",     label: "Alloy Engine",     platform: "Alloy",     connects: ["signal-bus", "workflow-exec", "ml-inference"] },
  { id: "firestorm-soc",    label: "Aegis SOC",    platform: "Aegis", connects: ["signal-bus", "threat-db"] },
  { id: "terra-lyte",     label: "Terra Lyte",     platform: "Terra",     connects: ["signal-bus", "geo-index"] },
  { id: "signal-bus",       label: "Signal Bus",       platform: "Core",      connects: ["prism-engine", "alert-engine", "escalation-mgr"] },
  { id: "ml-inference",     label: "ML Inference",     platform: "Alloy",     connects: ["metrics-store"] },
  { id: "workflow-exec",    label: "Workflow Exec",    platform: "Alloy",     connects: ["metrics-store", "action-router"] },
  { id: "prism-engine",     label: "PRISM Engine",     platform: "Lyte",      connects: ["metrics-store"] },
  { id: "alert-engine",     label: "Alert Engine",     platform: "Core",      connects: ["notification-svc"] },
  { id: "escalation-mgr",  label: "Escalation Mgr",   platform: "Core",      connects: ["notification-svc", "action-router"] },
  { id: "action-router",    label: "Action Router",    platform: "Lyte",      connects: [] },
  { id: "metrics-store",    label: "Metrics Store",    platform: "Core",      connects: [] },
  { id: "notification-svc", label: "Notification Svc", platform: "Core",      connects: [] },
  { id: "threat-db",        label: "Threat DB",        platform: "Aegis", connects: [] },
  { id: "geo-index",        label: "Geo Index",        platform: "Terra",     connects: [] },
];

const PLATFORM_COLORS: Record<string, string> = {
  Core: "#d4a054", Lyte: "#d4a054", Alloy: "#4B8BDB",
  Terra: "#4a90b8", Vessels: "#38bdf8", Aegis: "#c45a4a",
};

const HEALTH_COLORS = {
  healthy: "#6b8f71", degraded: "#d4a054", critical: "#c45a4a", dead: "#4b5563",
};

function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }

function initNodes(w: number, h: number): NodeState[] {
  const centerX = w / 2, centerY = h / 2;
  const rings = [
    ["api-gateway"],
    ["lyte-core", "alloy-engine", "firestorm-soc", "terra-lyte"],
    ["signal-bus", "ml-inference", "workflow-exec", "prism-engine", "threat-db", "geo-index"],
    ["alert-engine", "escalation-mgr", "action-router", "metrics-store", "notification-svc"],
  ];
  const nodeMap: Record<string, { x: number; y: number }> = {};
  rings.forEach((ring, ri) => {
    const r = 50 + ri * 105;
    ring.forEach((id, i) => {
      const angle = (i / ring.length) * Math.PI * 2 - Math.PI / 2;
      nodeMap[id] = { x: centerX + Math.cos(angle) * r, y: centerY + Math.sin(angle) * r };
    });
  });

  return PLATFORM_NODES.map(n => ({
    ...n,
    x: nodeMap[n.id]?.x ?? centerX,
    y: nodeMap[n.id]?.y ?? centerY,
    vx: 0, vy: 0,
    pulse: Math.random() * Math.PI * 2,
    health: (["healthy", "healthy", "healthy", "degraded", "critical"] as const)[Math.floor(Math.random() * 5)]!,
    healthScore: 65 + Math.random() * 35,
    latencyMs: 20 + Math.random() * 180,
    errorRate: Math.random() * 4,
    throughput: 100 + Math.random() * 900,
    anomaly: Math.random() < 0.12,
    ripple: 0,
  }));
}

function useAnimatedTopology(w: number, h: number, metricsMap: Record<string, TopologyNode>) {
  const [nodes, setNodes] = useState<NodeState[]>(() => initNodes(w, h));
  const [particles, setParticles] = useState<Particle[]>([]);
  const frameRef = useRef(0);
  const nodesRef = useRef(nodes);
  const particlesRef = useRef(particles);
  const particleIdRef = useRef(0);

  useEffect(() => { nodesRef.current = nodes; }, [nodes]);
  useEffect(() => { particlesRef.current = particles; }, [particles]);

  useEffect(() => {
    const updateInterval = setInterval(() => {
      setNodes(prev => prev.map(n => {
        const m = metricsMap[n.id];
        const healthScore = m ? (m.health === "healthy" ? 85 + Math.random() * 15 : m.health === "degraded" ? 45 + Math.random() * 25 : 15 + Math.random() * 25) : n.healthScore + (Math.random() - 0.5) * 5;
        const health = healthScore > 70 ? "healthy" : healthScore > 40 ? "degraded" : "critical";
        return {
          ...n,
          healthScore: Math.max(0, Math.min(100, healthScore)),
          health,
          latencyMs: Math.max(5, n.latencyMs + (Math.random() - 0.5) * 20),
          errorRate: Math.max(0, n.errorRate + (Math.random() - 0.5) * 0.5),
          throughput: Math.max(10, n.throughput + (Math.random() - 0.5) * 50),
          anomaly: Math.random() < 0.05,
          ripple: n.anomaly ? Math.min(n.ripple + 2, 60) : Math.max(0, n.ripple - 1),
        };
      }));
    }, 2000);
    return () => clearInterval(updateInterval);
  }, [metricsMap]);

  useEffect(() => {
    const spawnParticles = setInterval(() => {
      const currentNodes = nodesRef.current;
      const newParticles: Particle[] = [];
      for (const node of currentNodes) {
        for (const targetId of node.connects) {
          if (Math.random() < 0.4) {
            const color = PLATFORM_COLORS[node.platform] ?? "#d4a054";
            newParticles.push({
              id: particleIdRef.current++,
              fromId: node.id,
              toId: targetId,
              progress: 0,
              speed: 0.008 + Math.random() * 0.012,
              color: node.health === "critical" ? "#c45a4a" : color,
              size: node.health === "critical" ? 3 : 2,
            });
          }
        }
      }
      setParticles(prev => [...prev.slice(-120), ...newParticles]);
    }, 300);

    const animParticles = setInterval(() => {
      setParticles(prev => prev
        .map(p => ({ ...p, progress: p.progress + p.speed }))
        .filter(p => p.progress < 1));
    }, 16);

    return () => { clearInterval(spawnParticles); clearInterval(animParticles); };
  }, []);

  return { nodes, particles };
}

function TraceWaterfall({ nodes }: { nodes: NodeState[] }) {
  const path = nodes.slice(0, 6);
  const colors = path.map(n => PLATFORM_COLORS[n.platform] ?? "#d4a054");

  return (
    <div className="space-y-1">
      {path.map((n, i) => {
        const duration = Math.round(n.latencyMs * (0.5 + Math.random() * 0.8));
        const offset = i * 8;
        return (
          <div key={n.id} className="flex items-center gap-2 text-[10px]">
            <div className="w-28 text-right truncate font-mono" style={{ color: colors[i] }}>{n.label}</div>
            <div className="flex-1 relative h-4 bg-white/[0.03] rounded">
              <div
                className="absolute top-0.5 bottom-0.5 rounded transition-all"
                style={{
                  left: `${offset}%`,
                  width: `${Math.min(70, duration / 5)}%`,
                  background: `${colors[i]}30`,
                  border: `1px solid ${colors[i]}40`,
                }}
              />
            </div>
            <div className="w-12 text-right font-mono" style={{ color: colors[i] }}>{duration}ms</div>
          </div>
        );
      })}
    </div>
  );
}

export default function LivingTopology() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [showTrace, setShowTrace] = useState(false);
  const [dimensions] = useState({ w: 800, h: 520 });

  const { data } = useQuery({
    queryKey: ["topology"],
    queryFn: () => apiFetch<{ nodes: TopologyNode[]; firingAlertCount: number }>("/lyte/topology"),
    refetchInterval: 30000,
  });

  const metricsMap: Record<string, TopologyNode> = {};
  for (const n of data?.nodes ?? []) { metricsMap[n.service] = n; }

  const { nodes, particles } = useAnimatedTopology(dimensions.w, dimensions.h, metricsMap);
  const nodesRef = useRef(nodes);
  useEffect(() => { nodesRef.current = nodes; }, [nodes]);

  const animRef = useRef<number>(0);
  const timeRef = useRef(0);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    timeRef.current += 0.016;
    const t = timeRef.current;
    const nodeArr = nodesRef.current;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const nodeById = new Map(nodeArr.map(n => [n.id, n]));

    for (const node of nodeArr) {
      for (const targetId of node.connects) {
        const target = nodeById.get(targetId);
        if (!target) continue;
        const health = node.health === "critical" ? 0.6 : node.health === "degraded" ? 0.4 : 0.15;
        const color = PLATFORM_COLORS[node.platform] ?? "#d4a054";
        ctx.beginPath();
        ctx.moveTo(node.x, node.y);
        ctx.lineTo(target.x, target.y);
        const grad = ctx.createLinearGradient(node.x, node.y, target.x, target.y);
        grad.addColorStop(0, `${color}${Math.round(health * 255).toString(16).padStart(2, "0")}`);
        grad.addColorStop(1, `${color}08`);
        ctx.strokeStyle = grad;
        ctx.lineWidth = node.health === "critical" ? 1.5 : 1;
        if (node.health === "degraded") { ctx.setLineDash([4, 6]); } else { ctx.setLineDash([]); }
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    for (const p of particles) {
      const from = nodeById.get(p.fromId);
      const to = nodeById.get(p.toId);
      if (!from || !to) continue;
      const x = lerp(from.x, to.x, p.progress);
      const y = lerp(from.y, to.y, p.progress);
      ctx.beginPath();
      ctx.arc(x, y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = p.color + "cc";
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x, y, p.size * 2.5, 0, Math.PI * 2);
      ctx.fillStyle = p.color + "22";
      ctx.fill();
    }

    for (const node of nodeArr) {
      const isSelected = selected === node.id;
      const hc = HEALTH_COLORS[node.health];
      const pc = PLATFORM_COLORS[node.platform] ?? "#d4a054";
      const pulseFactor = 0.5 + 0.5 * Math.sin(t * (node.health === "critical" ? 4 : 1.5) + node.pulse);
      const baseRadius = node.platform === "Core" && node.id === "api-gateway" ? 22 : 15;
      const r = baseRadius + pulseFactor * (node.health === "critical" ? 4 : 2);

      if (node.ripple > 0) {
        for (let i = 1; i <= 3; i++) {
          const rr = r + node.ripple * i * 0.7;
          const alpha = Math.max(0, 0.3 - i * 0.08 - (node.ripple / 60) * 0.2);
          ctx.beginPath();
          ctx.arc(node.x, node.y, rr, 0, Math.PI * 2);
          ctx.strokeStyle = `${hc}${Math.round(alpha * 255).toString(16).padStart(2, "0")}`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }

      if (isSelected) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, r + 8, 0, Math.PI * 2);
        ctx.strokeStyle = `${pc}60`;
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      const grad = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, r);
      grad.addColorStop(0, `${hc}40`);
      grad.addColorStop(0.6, `${hc}18`);
      grad.addColorStop(1, `${pc}08`);
      ctx.beginPath();
      ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.strokeStyle = isSelected ? pc : `${hc}80`;
      ctx.lineWidth = isSelected ? 2 : 1;
      ctx.stroke();

      const pulse = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, r * 0.6);
      pulse.addColorStop(0, `${hc}80`);
      pulse.addColorStop(1, `${hc}00`);
      ctx.beginPath();
      ctx.arc(node.x, node.y, r * 0.5 * (0.7 + 0.3 * pulseFactor), 0, Math.PI * 2);
      ctx.fillStyle = pulse;
      ctx.fill();

      const fontSize = node.id === "api-gateway" ? 9 : 8;
      ctx.font = `${fontSize}px system-ui`;
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.textAlign = "center";
      ctx.fillText(node.label, node.x, node.y + r + 12);
    }

    animRef.current = requestAnimationFrame(draw);
  }, [particles, selected]);

  useEffect(() => {
    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [draw]);

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top) * scaleY;

    const hit = nodesRef.current.find(n => {
      const dx = n.x - mx, dy = n.y - my;
      return Math.sqrt(dx * dx + dy * dy) < 25;
    });
    setSelected(hit ? hit.id : null);
  }, []);

  const selectedNode = selected ? nodes.find(n => n.id === selected) : null;
  const healthCounts = {
    healthy: nodes.filter(n => n.health === "healthy").length,
    degraded: nodes.filter(n => n.health === "degraded").length,
    critical: nodes.filter(n => n.health === "critical").length,
  };
  const totalNodes = nodes.length;

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Network className="w-3.5 h-3.5" style={{ color: "#d4a054" }} />
            <span className="text-[10px] font-bold uppercase tracking-widest font-mono" style={{ color: "#d4a054" }}>Lyte · Living Topology</span>
            <span className="px-1.5 py-0.5 rounded text-[8px] font-bold" style={{ background: "rgba(212,160,84,0.15)", color: "#d4a054" }}>LIVE</span>
          </div>
          <h1 className="text-xl font-bold text-white">Living Service Topology</h1>
          <p className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>Animated force-directed mesh — services pulse with health, traffic flows as particles, anomalies ripple outward.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowTrace(v => !v)} className="flex items-center gap-1.5 text-[10px] px-3 py-1.5 rounded-lg border transition-all" style={{ color: showTrace ? "#d4a054" : "rgba(255,255,255,0.4)", borderColor: showTrace ? "rgba(212,160,84,0.3)" : "rgba(255,255,255,0.1)", background: showTrace ? "rgba(212,160,84,0.08)" : "transparent" }}>
            <Eye className="w-3 h-3" /> Request Trace
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Total Services", value: totalNodes, color: "rgba(255,255,255,0.6)" },
          { label: "Healthy", value: healthCounts.healthy, color: HEALTH_COLORS.healthy },
          { label: "Degraded", value: healthCounts.degraded, color: HEALTH_COLORS.degraded },
          { label: "Critical", value: healthCounts.critical, color: HEALTH_COLORS.critical, pulse: healthCounts.critical > 0 },
        ].map(c => (
          <div key={c.label} className="rounded-xl border p-3 text-center" style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.015)" }}>
            <div className="flex items-center justify-center gap-1.5 mb-0.5">
              <span className="text-2xl font-bold font-mono" style={{ color: c.color }}>{c.value}</span>
              {(c as { pulse?: boolean }).pulse && <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: c.color }} />}
            </div>
            <div className="text-[9px] font-medium uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.3)" }}>{c.label}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-4">
        <div className="flex-1 rounded-xl border overflow-hidden" style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(0,0,0,0.3)" }}>
          <canvas
            ref={canvasRef}
            width={dimensions.w}
            height={dimensions.h}
            className="w-full cursor-pointer"
            onClick={handleCanvasClick}
          />
        </div>

        {selectedNode && (
          <div className="w-64 shrink-0 rounded-xl border p-4 h-fit space-y-4" style={{ borderColor: `${PLATFORM_COLORS[selectedNode.platform] ?? "#d4a054"}20`, background: "rgba(255,255,255,0.015)" }}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-white">{selectedNode.label}</div>
                <div className="text-[9px] mt-0.5" style={{ color: PLATFORM_COLORS[selectedNode.platform] ?? "#d4a054" }}>{selectedNode.platform}</div>
              </div>
              <button onClick={() => setSelected(null)} className="text-slate-500 hover:text-white text-xs">✕</button>
            </div>

            <div className="space-y-1">
              {[
                { label: "Health Score", value: `${selectedNode.healthScore.toFixed(0)}`, color: HEALTH_COLORS[selectedNode.health] },
                { label: "Latency", value: `${selectedNode.latencyMs.toFixed(0)}ms`, color: selectedNode.latencyMs > 150 ? "#d4a054" : "#6b8f71" },
                { label: "Error Rate", value: `${selectedNode.errorRate.toFixed(1)}%`, color: selectedNode.errorRate > 2 ? "#c45a4a" : "#6b8f71" },
                { label: "Throughput", value: `${selectedNode.throughput.toFixed(0)}/s`, color: "#4B8BDB" },
              ].map(m => (
                <div key={m.label} className="flex items-center justify-between p-2 rounded-lg" style={{ background: "rgba(255,255,255,0.03)" }}>
                  <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.4)" }}>{m.label}</span>
                  <span className="text-[11px] font-mono font-bold" style={{ color: m.color }}>{m.value}</span>
                </div>
              ))}
            </div>

            {selectedNode.anomaly && (
              <div className="flex items-center gap-2 p-2 rounded-lg" style={{ background: "rgba(196,90,74,0.1)", border: "1px solid rgba(196,90,74,0.2)" }}>
                <AlertTriangle className="w-3 h-3 text-[#c45a4a]" />
                <span className="text-[10px] text-[#c45a4a]">Anomaly detected — ripple propagating</span>
              </div>
            )}

            <div>
              <div className="text-[9px] uppercase tracking-wider mb-2" style={{ color: "rgba(255,255,255,0.25)" }}>Downstream</div>
              {selectedNode.connects.length === 0 ? (
                <p className="text-[10px] text-slate-600">Leaf node</p>
              ) : selectedNode.connects.map(id => {
                const cn = nodes.find(n => n.id === id);
                if (!cn) return null;
                return (
                  <button key={id} onClick={() => setSelected(id)} className="w-full flex items-center gap-2 text-[10px] py-1 hover:opacity-80 text-left">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: HEALTH_COLORS[cn.health] }} />
                    <span style={{ color: PLATFORM_COLORS[cn.platform] ?? "#d4a054" }}>{cn.label}</span>
                    <span className="ml-auto font-mono" style={{ color: "rgba(255,255,255,0.3)" }}>{cn.latencyMs.toFixed(0)}ms</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {showTrace && (
        <div className="rounded-xl border p-5" style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.015)" }}>
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-3.5 h-3.5" style={{ color: "#4B8BDB" }} />
            <span className="text-xs font-bold text-white">Full-Stack Request Waterfall</span>
            <span className="text-[9px] px-2 py-0.5 rounded-full font-mono" style={{ background: "rgba(75,139,219,0.15)", color: "#4B8BDB" }}>trace_id: {Math.random().toString(36).slice(2, 10)}</span>
          </div>
          <TraceWaterfall nodes={nodes} />
          <div className="mt-4 flex items-center gap-4 text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>
            <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm" style={{ background: "#d4a054" }} /> Core</div>
            <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm" style={{ background: "#4B8BDB" }} /> Alloy</div>
            <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm" style={{ background: "#4a90b8" }} /> Terra</div>
            <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm" style={{ background: "#c45a4a" }} /> Aegis</div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">
        {nodes.filter(n => n.health !== "healthy").concat(nodes.filter(n => n.anomaly)).slice(0, 6).map(n => (
          <div key={n.id} className="rounded-xl border p-3 flex items-start gap-3" style={{ borderColor: `${HEALTH_COLORS[n.health]}20`, background: `${HEALTH_COLORS[n.health]}08` }}>
            <span className="w-2 h-2 rounded-full mt-1 animate-pulse shrink-0" style={{ background: HEALTH_COLORS[n.health] }} />
            <div className="min-w-0">
              <div className="text-[11px] font-semibold text-white truncate">{n.label}</div>
              <div className="text-[10px]" style={{ color: HEALTH_COLORS[n.health] }}>
                {n.health === "critical" ? "Critical — immediate attention" : n.anomaly ? "Anomaly ripple detected" : "Degraded — monitoring"}
              </div>
              <div className="text-[9px] mt-0.5 font-mono" style={{ color: "rgba(255,255,255,0.3)" }}>{n.latencyMs.toFixed(0)}ms · {n.errorRate.toFixed(1)}% err</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
