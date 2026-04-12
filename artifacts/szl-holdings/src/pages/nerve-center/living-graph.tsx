import { useEffect, useRef, useState, useCallback } from "react";

export type LensId = "all" | "financial" | "operational" | "growth" | "sentiment" | "compliance" | "talent" | "market";

export interface GraphNode {
  id: string;
  label: string;
  domain: "vessels" | "terra" | "aegis" | "prism" | "lyte" | "alloy" | "people";
  type: "vessel" | "property" | "incident" | "legal" | "workflow" | "person" | "deal";
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  heat: number;
  lensWeights: Record<LensId, number>;
  active: boolean;
  pulsePhase: number;
}

export interface GraphEdge {
  source: string;
  target: string;
  strength: number;
  type: "ownership" | "risk" | "dependency" | "geographic" | "temporal" | "correlation";
  pulsing: boolean;
  pulseOffset: number;
}

const DOMAIN_COLORS: Record<GraphNode["domain"], string> = {
  vessels: "#38bdf8",
  terra: "#86efac",
  aegis: "#818cf8",
  prism: "#fbbf24",
  lyte: "#2dd4bf",
  alloy: "#c084fc",
  people: "#fb923c",
};

const LENS_CONFIGS: Record<LensId, { color: string; label: string }> = {
  all: { color: "#a78bfa", label: "All Lenses" },
  financial: { color: "#34d399", label: "Financial Health" },
  operational: { color: "#fb923c", label: "Operational Risk" },
  growth: { color: "#60a5fa", label: "Growth Velocity" },
  sentiment: { color: "#f472b6", label: "Customer Sentiment" },
  compliance: { color: "#a78bfa", label: "Compliance Drift" },
  talent: { color: "#fbbf24", label: "Talent Stability" },
  market: { color: "#2dd4bf", label: "Market Position" },
};

function generateNodes(): GraphNode[] {
  const nodes: GraphNode[] = [
    { id: "v1", label: "MV Athena", domain: "vessels", type: "vessel", x: 0, y: 0, vx: 0, vy: 0, radius: 14, heat: 0.9, lensWeights: { all: 1, financial: 0.8, operational: 0.95, growth: 0.6, sentiment: 0.3, compliance: 0.7, talent: 0.2, market: 0.5 }, active: true, pulsePhase: 0 },
    { id: "v2", label: "MV Rotterdam", domain: "vessels", type: "vessel", x: 0, y: 0, vx: 0, vy: 0, radius: 12, heat: 0.6, lensWeights: { all: 1, financial: 0.7, operational: 0.8, growth: 0.5, sentiment: 0.2, compliance: 0.6, talent: 0.1, market: 0.4 }, active: true, pulsePhase: 1 },
    { id: "v3", label: "MV Meridian", domain: "vessels", type: "vessel", x: 0, y: 0, vx: 0, vy: 0, radius: 10, heat: 0.3, lensWeights: { all: 1, financial: 0.5, operational: 0.6, growth: 0.4, sentiment: 0.1, compliance: 0.5, talent: 0.1, market: 0.3 }, active: true, pulsePhase: 2 },
    { id: "t1", label: "Ashworth Estate", domain: "terra", type: "property", x: 0, y: 0, vx: 0, vy: 0, radius: 13, heat: 0.5, lensWeights: { all: 1, financial: 0.9, operational: 0.4, growth: 0.8, sentiment: 0.5, compliance: 0.6, talent: 0.2, market: 0.85 }, active: true, pulsePhase: 3 },
    { id: "t2", label: "Meridian Tower", domain: "terra", type: "property", x: 0, y: 0, vx: 0, vy: 0, radius: 11, heat: 0.4, lensWeights: { all: 1, financial: 0.7, operational: 0.3, growth: 0.6, sentiment: 0.4, compliance: 0.5, talent: 0.1, market: 0.7 }, active: true, pulsePhase: 4 },
    { id: "a1", label: "Port Disruption", domain: "aegis", type: "incident", x: 0, y: 0, vx: 0, vy: 0, radius: 16, heat: 1.0, lensWeights: { all: 1, financial: 0.9, operational: 1.0, growth: 0.7, sentiment: 0.6, compliance: 0.8, talent: 0.3, market: 0.7 }, active: true, pulsePhase: 0.5 },
    { id: "a2", label: "Sanctions Alert", domain: "aegis", type: "incident", x: 0, y: 0, vx: 0, vy: 0, radius: 12, heat: 0.7, lensWeights: { all: 1, financial: 0.8, operational: 0.9, growth: 0.4, sentiment: 0.3, compliance: 1.0, talent: 0.2, market: 0.5 }, active: true, pulsePhase: 1.5 },
    { id: "p1", label: "Cargo Contract", domain: "prism", type: "legal", x: 0, y: 0, vx: 0, vy: 0, radius: 11, heat: 0.8, lensWeights: { all: 1, financial: 0.9, operational: 0.5, growth: 0.6, sentiment: 0.4, compliance: 0.95, talent: 0.2, market: 0.5 }, active: true, pulsePhase: 2.5 },
    { id: "p2", label: "Port Authorization", domain: "prism", type: "legal", x: 0, y: 0, vx: 0, vy: 0, radius: 13, heat: 0.85, lensWeights: { all: 1, financial: 0.95, operational: 0.8, growth: 0.5, sentiment: 0.3, compliance: 0.9, talent: 0.1, market: 0.4 }, active: true, pulsePhase: 3.5 },
    { id: "l1", label: "Fleet Ops Pipeline", domain: "lyte", type: "workflow", x: 0, y: 0, vx: 0, vy: 0, radius: 10, heat: 0.5, lensWeights: { all: 1, financial: 0.6, operational: 0.8, growth: 0.7, sentiment: 0.3, compliance: 0.5, talent: 0.6, market: 0.4 }, active: true, pulsePhase: 4.5 },
    { id: "l2", label: "Compliance Review", domain: "lyte", type: "workflow", x: 0, y: 0, vx: 0, vy: 0, radius: 9, heat: 0.4, lensWeights: { all: 1, financial: 0.5, operational: 0.6, growth: 0.4, sentiment: 0.2, compliance: 0.9, talent: 0.4, market: 0.3 }, active: true, pulsePhase: 5 },
    { id: "al1", label: "AI Orchestrator", domain: "alloy", type: "workflow", x: 0, y: 0, vx: 0, vy: 0, radius: 12, heat: 0.7, lensWeights: { all: 1, financial: 0.7, operational: 0.9, growth: 0.8, sentiment: 0.5, compliance: 0.7, talent: 0.7, market: 0.6 }, active: true, pulsePhase: 0.3 },
    { id: "pe1", label: "Capt. Rodriguez", domain: "people", type: "person", x: 0, y: 0, vx: 0, vy: 0, radius: 9, heat: 0.3, lensWeights: { all: 1, financial: 0.3, operational: 0.5, growth: 0.4, sentiment: 0.7, compliance: 0.4, talent: 0.9, market: 0.3 }, active: true, pulsePhase: 1.2 },
    { id: "pe2", label: "Legal Team", domain: "people", type: "person", x: 0, y: 0, vx: 0, vy: 0, radius: 8, heat: 0.4, lensWeights: { all: 1, financial: 0.6, operational: 0.5, growth: 0.3, sentiment: 0.4, compliance: 0.95, talent: 0.8, market: 0.3 }, active: true, pulsePhase: 2.1 },
  ];

  const cx = 400, cy = 300;
  const goldenAngle = 2.399963;
  nodes.forEach((n, i) => {
    const r = 60 + i * 28;
    const angle = i * goldenAngle;
    n.x = cx + r * Math.cos(angle);
    n.y = cy + r * Math.sin(angle);
  });
  return nodes;
}

function generateEdges(): GraphEdge[] {
  return [
    { source: "v1", target: "p2", strength: 0.9, type: "dependency", pulsing: true, pulseOffset: 0 },
    { source: "v1", target: "a1", strength: 0.8, type: "risk", pulsing: true, pulseOffset: 0.3 },
    { source: "a1", target: "p2", strength: 0.85, type: "correlation", pulsing: true, pulseOffset: 0.6 },
    { source: "p2", target: "t1", strength: 0.7, type: "dependency", pulsing: false, pulseOffset: 0 },
    { source: "v2", target: "a1", strength: 0.6, type: "geographic", pulsing: false, pulseOffset: 0.2 },
    { source: "p1", target: "v1", strength: 0.8, type: "ownership", pulsing: false, pulseOffset: 0 },
    { source: "p1", target: "t1", strength: 0.65, type: "ownership", pulsing: false, pulseOffset: 0.4 },
    { source: "l1", target: "v1", strength: 0.7, type: "dependency", pulsing: false, pulseOffset: 0.1 },
    { source: "l1", target: "v2", strength: 0.5, type: "dependency", pulsing: false, pulseOffset: 0.5 },
    { source: "al1", target: "l1", strength: 0.9, type: "dependency", pulsing: true, pulseOffset: 0.7 },
    { source: "al1", target: "a2", strength: 0.6, type: "correlation", pulsing: false, pulseOffset: 0.3 },
    { source: "a2", target: "v3", strength: 0.5, type: "risk", pulsing: false, pulseOffset: 0.9 },
    { source: "pe1", target: "v1", strength: 0.9, type: "ownership", pulsing: false, pulseOffset: 0.2 },
    { source: "pe2", target: "p1", strength: 0.8, type: "dependency", pulsing: false, pulseOffset: 0.4 },
    { source: "pe2", target: "p2", strength: 0.7, type: "dependency", pulsing: false, pulseOffset: 0.6 },
    { source: "t1", target: "t2", strength: 0.4, type: "geographic", pulsing: false, pulseOffset: 0.8 },
    { source: "l2", target: "a2", strength: 0.6, type: "correlation", pulsing: false, pulseOffset: 0.1 },
  ];
}

interface LivingGraphProps {
  activeLens: LensId;
  onNodeClick?: (node: GraphNode) => void;
  highlightedNodeIds?: Set<string>;
}

const EDGE_TYPE_COLORS: Record<GraphEdge["type"], string> = {
  ownership: "rgba(251,191,36,0.4)",
  risk: "rgba(239,68,68,0.4)",
  dependency: "rgba(75,139,219,0.4)",
  geographic: "rgba(34,197,94,0.3)",
  temporal: "rgba(168,85,247,0.3)",
  correlation: "rgba(244,114,182,0.4)",
};

export function LivingGraph({ activeLens, onNodeClick, highlightedNodeIds }: LivingGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nodesRef = useRef<GraphNode[]>(generateNodes());
  const edgesRef = useRef<GraphEdge[]>(generateEdges());
  const animFrameRef = useRef<number>(0);
  const timeRef = useRef<number>(0);
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);

  const runPhysics = useCallback((nodes: GraphNode[], edges: GraphEdge[], dt: number) => {
    const W = canvasRef.current?.width ?? 800;
    const H = canvasRef.current?.height ?? 500;

    for (let i = 0; i < nodes.length; i++) {
      const ni = nodes[i]!;
      ni.vx *= 0.88;
      ni.vy *= 0.88;

      const cx = W / 2, cy = H / 2;
      const dx = cx - ni.x, dy = cy - ni.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 10) {
        const f = 0.018;
        ni.vx += dx * f;
        ni.vy += dy * f;
      }

      for (let j = i + 1; j < nodes.length; j++) {
        const nj = nodes[j]!;
        const rx = nj.x - ni.x, ry = nj.y - ni.y;
        const d = Math.sqrt(rx * rx + ry * ry) || 1;
        const minDist = ni.radius + nj.radius + 20;
        if (d < minDist) {
          const f = (minDist - d) / d * 0.12;
          ni.vx -= rx * f;
          ni.vy -= ry * f;
          nj.vx += rx * f;
          nj.vy += ry * f;
        }
      }
    }

    for (const edge of edges) {
      const src = nodes.find(n => n.id === edge.source);
      const tgt = nodes.find(n => n.id === edge.target);
      if (!src || !tgt) continue;
      const rx = tgt.x - src.x, ry = tgt.y - src.y;
      const d = Math.sqrt(rx * rx + ry * ry) || 1;
      const targetLen = 130;
      const f = (d - targetLen) / d * 0.03 * edge.strength;
      src.vx += rx * f;
      src.vy += ry * f;
      tgt.vx -= rx * f;
      tgt.vy -= ry * f;
    }

    for (const n of nodes) {
      n.x += n.vx * dt;
      n.y += n.vy * dt;
      n.x = Math.max(n.radius + 10, Math.min(W - n.radius - 10, n.x));
      n.y = Math.max(n.radius + 10, Math.min(H - n.radius - 10, n.y));
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    };
    resize();
    const ro = new ResizeObserver(resize);
    if (canvas.parentElement) ro.observe(canvas.parentElement);

    let lastTime = performance.now();

    const draw = (now: number) => {
      const dt = Math.min((now - lastTime) / 16.67, 3);
      lastTime = now;
      timeRef.current += dt;
      const t = timeRef.current;

      runPhysics(nodesRef.current, edgesRef.current, dt);

      const W = canvas.width, H = canvas.height;
      ctx.clearRect(0, 0, W, H);

      ctx.fillStyle = "rgba(8,12,20,1)";
      ctx.fillRect(0, 0, W, H);

      const nodeMap = new Map(nodesRef.current.map(n => [n.id, n]));

      for (const edge of edgesRef.current) {
        const src = nodeMap.get(edge.source);
        const tgt = nodeMap.get(edge.target);
        if (!src || !tgt) continue;

        const srcWeight = activeLens === "all" ? 1 : (src.lensWeights[activeLens] ?? 0);
        const tgtWeight = activeLens === "all" ? 1 : (tgt.lensWeights[activeLens] ?? 0);
        const edgeAlpha = (srcWeight + tgtWeight) / 2;

        if (edgeAlpha < 0.15) continue;

        const edgeColor = EDGE_TYPE_COLORS[edge.type] ?? "rgba(255,255,255,0.2)";

        if (edge.pulsing) {
          const pulseT = (t * 0.04 + edge.pulseOffset) % 1;
          const px = src.x + (tgt.x - src.x) * pulseT;
          const py = src.y + (tgt.y - src.y) * pulseT;
          const grd = ctx.createRadialGradient(px, py, 0, px, py, 12);
          const lensColor = LENS_CONFIGS[activeLens].color;
          grd.addColorStop(0, lensColor + "cc");
          grd.addColorStop(1, lensColor + "00");
          ctx.fillStyle = grd;
          ctx.beginPath();
          ctx.arc(px, py, 12, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.beginPath();
        ctx.moveTo(src.x, src.y);
        ctx.lineTo(tgt.x, tgt.y);
        ctx.strokeStyle = edgeColor.replace(/[\d.]+\)$/, `${(0.15 + edgeAlpha * 0.4).toFixed(2)})`);
        ctx.lineWidth = 0.8 + edge.strength * 1.5;
        ctx.stroke();
      }

      for (const node of nodesRef.current) {
        const lensWeight = activeLens === "all" ? 1 : (node.lensWeights[activeLens] ?? 0);
        const alpha = 0.2 + lensWeight * 0.8;
        const effectiveRadius = node.radius * (activeLens === "all" ? 1 : 0.5 + lensWeight * 0.6);
        const baseColor = DOMAIN_COLORS[node.domain];
        const isHighlighted = highlightedNodeIds?.has(node.id);
        const isHovered = hoveredNode?.id === node.id;

        const glowSize = effectiveRadius * (1.5 + node.heat * 1.5 + (isHighlighted ? 1 : 0));
        const grd = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, glowSize);
        grd.addColorStop(0, baseColor + Math.round(alpha * 0.5 * 255).toString(16).padStart(2, "0"));
        grd.addColorStop(1, baseColor + "00");
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.arc(node.x, node.y, glowSize, 0, Math.PI * 2);
        ctx.fill();

        if (node.active && lensWeight > 0.3) {
          const pulseAmt = Math.sin((t * 0.06) + node.pulsePhase) * 0.4 + 0.6;
          ctx.beginPath();
          ctx.arc(node.x, node.y, effectiveRadius + 3 + pulseAmt * 2, 0, Math.PI * 2);
          ctx.strokeStyle = baseColor + Math.round(alpha * pulseAmt * 80).toString(16).padStart(2, "0");
          ctx.lineWidth = 1;
          ctx.stroke();
        }

        ctx.beginPath();
        ctx.arc(node.x, node.y, effectiveRadius, 0, Math.PI * 2);
        const nodeGrd = ctx.createRadialGradient(node.x - effectiveRadius * 0.3, node.y - effectiveRadius * 0.3, 0, node.x, node.y, effectiveRadius);
        nodeGrd.addColorStop(0, baseColor + Math.round(alpha * 255).toString(16).padStart(2, "0"));
        nodeGrd.addColorStop(1, baseColor + Math.round(alpha * 0.4 * 255).toString(16).padStart(2, "0"));
        ctx.fillStyle = nodeGrd;
        ctx.fill();

        if (isHovered || isHighlighted) {
          ctx.strokeStyle = baseColor;
          ctx.lineWidth = 2;
          ctx.stroke();
        }

        if (effectiveRadius > 6 && lensWeight > 0.2) {
          ctx.fillStyle = `rgba(255,255,255,${alpha * 0.85})`;
          ctx.font = `bold ${Math.round(8 + effectiveRadius * 0.15)}px 'Inter', sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(node.label.length > 10 ? node.label.slice(0, 9) + "…" : node.label, node.x, node.y + effectiveRadius + 10);
        }
      }

      animFrameRef.current = requestAnimationFrame(draw);
    };

    animFrameRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      ro.disconnect();
    };
  }, [activeLens, hoveredNode, highlightedNodeIds, runPhysics]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    let found: GraphNode | null = null;
    for (const node of nodesRef.current) {
      const dx = node.x - mx, dy = node.y - my;
      if (dx * dx + dy * dy < (node.radius + 8) ** 2) {
        found = node;
        break;
      }
    }
    setHoveredNode(found);
  }, []);

  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    for (const node of nodesRef.current) {
      const dx = node.x - mx, dy = node.y - my;
      if (dx * dx + dy * dy < (node.radius + 8) ** 2) {
        onNodeClick?.(node);
        break;
      }
    }
  }, [onNodeClick]);

  return (
    <div className="relative w-full h-full" style={{ background: "#080c14" }}>
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ cursor: hoveredNode ? "pointer" : "default" }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoveredNode(null)}
        onClick={handleClick}
      />

      <div className="absolute top-3 left-3 flex items-center gap-3 flex-wrap">
        {(Object.entries(DOMAIN_COLORS) as [GraphNode["domain"], string][]).map(([domain, color]) => (
          <div key={domain} className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ background: color }} />
            <span className="text-[9px] uppercase tracking-widest font-medium capitalize" style={{ color: "rgba(255,255,255,0.35)" }}>{domain}</span>
          </div>
        ))}
      </div>

      {hoveredNode && (
        <div
          className="absolute pointer-events-none px-3 py-2 rounded-lg border text-xs"
          style={{
            left: "50%",
            bottom: "12px",
            transform: "translateX(-50%)",
            background: "rgba(12,18,30,0.95)",
            borderColor: DOMAIN_COLORS[hoveredNode.domain] + "50",
            color: "rgba(255,255,255,0.85)",
            whiteSpace: "nowrap",
            backdropFilter: "blur(8px)",
          }}
        >
          <span className="font-semibold" style={{ color: DOMAIN_COLORS[hoveredNode.domain] }}>{hoveredNode.label}</span>
          <span className="ml-2 text-[10px]" style={{ color: "rgba(255,255,255,0.4)" }}>
            {hoveredNode.domain} · heat {Math.round(hoveredNode.heat * 100)}%
          </span>
        </div>
      )}
    </div>
  );
}

export { LENS_CONFIGS, DOMAIN_COLORS };
