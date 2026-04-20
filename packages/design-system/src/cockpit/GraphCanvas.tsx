import { useRef, useEffect, useCallback, useState } from "react";
import { cn } from "../utils.js";
import { color } from "../tokens/index.js";

export interface GraphNode {
  id: string;
  label: string;
  x: number;
  y: number;
  radius?: number;
  color?: string;
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
  directed?: boolean;
}

export interface GraphCanvasProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  width?: number | string;
  height?: number | string;
  className?: string;
  onNodeClick?: (node: GraphNode) => void;
  onNodeDrag?: (nodeId: string, x: number, y: number) => void;
  onNodeDragEnd?: (nodeId: string, x: number, y: number) => void;
  background?: string;
  showLabels?: boolean;
}

export function GraphCanvas({
  nodes,
  edges,
  width = "100%",
  height = 320,
  className,
  onNodeClick,
  onNodeDrag,
  onNodeDragEnd,
  background = color.bg.surface,
  showLabels = true,
}: GraphCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hitRef = useRef<Map<string, GraphNode>>(new Map());
  const dragRef = useRef<{ id: string; moved: boolean } | null>(null);
  const [hoverId, setHoverId] = useState<string | null>(null);

  const draggable = !!onNodeDrag;

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

      const stroke = edge.color ?? color.border.default;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(endX, endY);
      ctx.strokeStyle = stroke;
      ctx.lineWidth = edge.weight ?? 1;
      if (edge.dashed) ctx.setLineDash([4, 4]);
      else ctx.setLineDash([]);
      ctx.stroke();

      if (edge.directed) {
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
        ctx.fillStyle = color.text.muted;
        ctx.textAlign = "center";
        ctx.fillText(edge.label, mx, my - 4);
      }
    });

    hitRef.current.clear();
    nodes.forEach((node) => {
      const x = node.x * W;
      const y = node.y * H;
      const r = node.radius ?? 8;
      const fill = node.color ?? color.accent.blue;

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
        ctx.fillStyle = color.text.primary;
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

  function getCanvasCoords(e: { clientX: number; clientY: number }) {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      mx: e.clientX - rect.left,
      my: e.clientY - rect.top,
      W: canvas.width,
      H: canvas.height,
      rect,
    };
  }

  function hitTest(mx: number, my: number, W: number, H: number): GraphNode | null {
    for (let i = nodes.length - 1; i >= 0; i--) {
      const node = nodes[i]!;
      const nx = node.x * W;
      const ny = node.y * H;
      const r  = (node.radius ?? 8) + 6;
      if (Math.hypot(mx - nx, my - ny) <= r) return node;
    }
    return null;
  }

  function handleMouseDown(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!draggable) return;
    if (!canvasRef.current) return;
    const { mx, my, W, H } = getCanvasCoords(e);
    const node = hitTest(mx, my, W, H);
    if (!node) return;
    e.preventDefault();
    dragRef.current = { id: node.id, moved: false };
  }

  function handleMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!canvasRef.current) return;
    const { mx, my, W, H } = getCanvasCoords(e);

    const drag = dragRef.current;
    if (drag && draggable) {
      drag.moved = true;
      const nx = Math.max(0.02, Math.min(0.98, mx / W));
      const ny = Math.max(0.02, Math.min(0.98, my / H));
      onNodeDrag?.(drag.id, nx, ny);
      return;
    }

    if (draggable || onNodeClick) {
      const node = hitTest(mx, my, W, H);
      const id = node?.id ?? null;
      if (id !== hoverId) setHoverId(id);
    }
  }

  function endDrag(e: React.MouseEvent<HTMLCanvasElement>) {
    const drag = dragRef.current;
    if (!drag) return;
    dragRef.current = null;
    if (drag.moved) {
      const { mx, my, W, H } = getCanvasCoords(e);
      const nx = Math.max(0.02, Math.min(0.98, mx / W));
      const ny = Math.max(0.02, Math.min(0.98, my / H));
      onNodeDragEnd?.(drag.id, nx, ny);
    } else if (onNodeClick) {
      const node = nodes.find((n) => n.id === drag.id);
      if (node) onNodeClick(node);
    }
  }

  function handleMouseUp(e: React.MouseEvent<HTMLCanvasElement>) {
    if (draggable) {
      endDrag(e);
      return;
    }
    if (!onNodeClick) return;
    const { mx, my, W, H } = getCanvasCoords(e);
    const node = hitTest(mx, my, W, H);
    if (node) onNodeClick(node);
  }

  function handleMouseLeave(e: React.MouseEvent<HTMLCanvasElement>) {
    if (dragRef.current && draggable) endDrag(e);
    if (hoverId) setHoverId(null);
  }

  const cursor = dragRef.current
    ? "grabbing"
    : hoverId
    ? draggable
      ? "grab"
      : "pointer"
    : "default";

  return (
    <div
      className={cn("rounded-lg overflow-hidden", className)}
      style={{ width, height, border: `1px solid ${color.border.default}` }}
    >
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        className="block w-full h-full select-none"
        style={{ cursor, touchAction: "none" }}
        aria-label="Graph visualization"
        role="img"
      />
    </div>
  );
}
