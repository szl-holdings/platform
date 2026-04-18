import { useRef, useEffect, useCallback } from "react";
import { cn } from "../utils";

export interface GraphNode {
  id: string;
  label: string;
  x: number;
  y: number;
  radius?: number;
  color?: string;
  /** Ring color for emphasis */
  ringColor?: string;
  meta?: Record<string, string>;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  color?: string;
  dashed?: boolean;
  weight?: number;
  /** Render an arrowhead at the target end. */
  directed?: boolean;
}

export interface GraphCanvasProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  width?: number | string;
  height?: number | string;
  className?: string;
  onNodeClick?: (node: GraphNode) => void;
  /** Background color — defaults to the GI surface token */
  background?: string;
  /** Show node labels */
  showLabels?: boolean;
}

export function GraphCanvas({
  nodes,
  edges,
  width = "100%",
  height = 320,
  className,
  onNodeClick,
  background = "#0d1520",
  showLabels = true,
}: GraphCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hitRef = useRef<Map<string, GraphNode>>(new Map());

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    ctx.fillStyle = background;
    ctx.fillRect(0, 0, W, H);

    const nodeMap = new Map(nodes.map((n) => [n.id, n]));

    edges.forEach((edge) => {
      const src = nodeMap.get(edge.source);
      const tgt = nodeMap.get(edge.target);
      if (!src || !tgt) return;

      const sx = src.x * W;
      const sy = src.y * H;
      const tx = tgt.x * W;
      const ty = tgt.y * H;

      // If directed, stop the line short of the target node so the arrowhead
      // sits at the node's edge rather than under it.
      const tgtR = (tgt.radius ?? 8) + (tgt.ringColor ? 4 : 0);
      let endX = tx;
      let endY = ty;
      if (edge.directed) {
        const dx = tx - sx;
        const dy = ty - sy;
        const len = Math.hypot(dx, dy) || 1;
        endX = tx - (dx / len) * (tgtR + 2);
        endY = ty - (dy / len) * (tgtR + 2);
      }

      const stroke = edge.color ?? "#243040";
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(endX, endY);
      ctx.strokeStyle = stroke;
      ctx.lineWidth = edge.weight ?? 1;
      if (edge.dashed) ctx.setLineDash([4, 4]);
      else ctx.setLineDash([]);
      ctx.stroke();

      if (edge.directed) {
        // Arrowhead — solid triangle, never dashed
        ctx.setLineDash([]);
        const dx = endX - sx;
        const dy = endY - sy;
        const angle = Math.atan2(dy, dx);
        const headLen = Math.max(7, (edge.weight ?? 1) * 4 + 4);
        const headWidth = headLen * 0.55;
        const baseX = endX - Math.cos(angle) * headLen;
        const baseY = endY - Math.sin(angle) * headLen;
        const leftX = baseX + Math.cos(angle + Math.PI / 2) * headWidth;
        const leftY = baseY + Math.sin(angle + Math.PI / 2) * headWidth;
        const rightX = baseX + Math.cos(angle - Math.PI / 2) * headWidth;
        const rightY = baseY + Math.sin(angle - Math.PI / 2) * headWidth;
        ctx.beginPath();
        ctx.moveTo(endX, endY);
        ctx.lineTo(leftX, leftY);
        ctx.lineTo(rightX, rightY);
        ctx.closePath();
        ctx.fillStyle = stroke;
        ctx.fill();
      }

      if (edge.label) {
        const mx = (sx + tx) / 2;
        const my = (sy + ty) / 2;
        ctx.font = "10px 'Inter', system-ui, sans-serif";
        ctx.fillStyle = "#4a6070";
        ctx.textAlign = "center";
        ctx.fillText(edge.label, mx, my - 4);
      }
    });

    hitRef.current.clear();
    nodes.forEach((node) => {
      const x = node.x * W;
      const y = node.y * H;
      const r = node.radius ?? 8;
      const fill = node.color ?? "#00d4ff";

      if (node.ringColor) {
        ctx.beginPath();
        ctx.arc(x, y, r + 4, 0, Math.PI * 2);
        ctx.fillStyle = node.ringColor + "33";
        ctx.fill();
      }

      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = fill + "22";
      ctx.fill();
      ctx.strokeStyle = fill;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([]);
      ctx.stroke();

      hitRef.current.set(node.id, node);

      if (showLabels) {
        ctx.font = "11px 'Inter', system-ui, sans-serif";
        ctx.fillStyle = "#c8d8e8";
        ctx.textAlign = "center";
        ctx.fillText(node.label, x, y + r + 14);
      }
    });
  }, [nodes, edges, background, showLabels]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ro = new ResizeObserver(() => {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      draw();
    });
    ro.observe(canvas);
    canvas.width  = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    draw();
    return () => ro.disconnect();
  }, [draw]);

  function handleClick(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!onNodeClick) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const W = canvas.width;
    const H = canvas.height;

    for (const node of nodes) {
      const nx = node.x * W;
      const ny = node.y * H;
      const r  = (node.radius ?? 8) + 6;
      if (Math.hypot(mx - nx, my - ny) <= r) {
        onNodeClick(node);
        return;
      }
    }
  }

  return (
    <div
      className={cn("rounded-lg border border-[#243040] overflow-hidden", className)}
      style={{ width, height }}
    >
      <canvas
        ref={canvasRef}
        onClick={handleClick}
        className={cn(
          "block w-full h-full",
          onNodeClick && "cursor-pointer"
        )}
        aria-label="Graph visualization"
        role="img"
      />
    </div>
  );
}
