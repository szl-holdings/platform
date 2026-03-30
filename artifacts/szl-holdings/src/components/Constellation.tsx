import { useEffect, useRef, useState } from "react";
import { m } from "framer-motion";
import { useLocation } from "wouter";
import portfolioData from "@/data/portfolio.json";
import siteData from "@/data/site.json";
import { ventures } from "@/data/ventures";
import { analytics } from "@/lib/analytics";

interface Node {
  id: string;
  name: string;
  x: number;
  y: number;
  radius: number;
  color: string;
  link: string;
  status: string;
  angle: number;
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [parseInt(h.substring(0, 2), 16), parseInt(h.substring(2, 4), 16), parseInt(h.substring(4, 6), 16)];
}

function buildNodes(width: number, height: number): Node[] {
  const cx = width / 2;
  const cy = height / 2;
  const orbitRadius = Math.min(width, height) * 0.32;

  const nodes: Node[] = [
    {
      id: "szl",
      name: siteData.company.name,
      x: cx,
      y: cy,
      radius: 40,
      color: "#6366f1",
      link: "#",
      status: siteData.ecosystem.legendLabels.live,
      angle: 0,
    },
  ];

  portfolioData.forEach((company, i) => {
    const angle = (i / portfolioData.length) * Math.PI * 2 - Math.PI / 2;
    nodes.push({
      id: company.id,
      name: company.name,
      x: cx + Math.cos(angle) * orbitRadius,
      y: cy + Math.sin(angle) * orbitRadius,
      radius: 26,
      color: company.color,
      link: company.link,
      status: company.status,
      angle,
    });
  });

  return nodes;
}

export function Constellation() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 });
  const animFrameRef = useRef<number>(0);
  const timeRef = useRef(0);
  const { ecosystem } = siteData;
  const [, navigate] = useLocation();

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateSize = () => {
      const rect = container.getBoundingClientRect();
      const w = rect.width;
      const h = Math.max(450, Math.min(600, w * 0.6));
      setDimensions({ width: w, height: h });
      setNodes(buildNodes(w, h));
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || nodes.length === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = dimensions.width * dpr;
    canvas.height = dimensions.height * dpr;
    ctx.scale(dpr, dpr);

    const particlePool: { x: number; y: number; speed: number; progress: number; lineIndex: number; size: number }[] = [];
    for (let i = 0; i < 30; i++) {
      particlePool.push({
        x: 0, y: 0,
        speed: 0.003 + Math.random() * 0.004,
        progress: Math.random(),
        lineIndex: Math.floor(Math.random() * (nodes.length - 1)),
        size: 1.5 + Math.random() * 1.5,
      });
    }

    const bgStars: { x: number; y: number; size: number; alpha: number; speed: number }[] = [];
    for (let i = 0; i < 60; i++) {
      bgStars.push({
        x: Math.random() * dimensions.width,
        y: Math.random() * dimensions.height,
        size: 0.5 + Math.random() * 1.5,
        alpha: 0.1 + Math.random() * 0.3,
        speed: 0.5 + Math.random() * 2,
      });
    }

    const animate = () => {
      timeRef.current += 0.004;
      const t = timeRef.current;

      ctx.clearRect(0, 0, dimensions.width, dimensions.height);

      bgStars.forEach((star) => {
        const flicker = star.alpha + Math.sin(t * star.speed + star.x) * 0.1;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(150, 170, 220, ${Math.max(0.05, flicker)})`;
        ctx.fill();
      });

      const hub = nodes[0];
      const satellites = nodes.slice(1);
      const cx = hub.x;
      const cy = hub.y;
      const orbitR = Math.min(dimensions.width, dimensions.height) * 0.32;

      ctx.beginPath();
      ctx.arc(cx, cy, orbitR, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(99, 102, 241, 0.06)";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 8]);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.beginPath();
      ctx.arc(cx, cy, orbitR * 0.6, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(99, 102, 241, 0.03)";
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 10]);
      ctx.stroke();
      ctx.setLineDash([]);

      satellites.forEach((node) => {
        const isHovered = hoveredNode === node.id;
        const [r, g, b] = hexToRgb(node.color);
        const alpha = isHovered ? 0.35 : 0.1;

        ctx.beginPath();
        ctx.moveTo(hub.x, hub.y);

        const mx = (hub.x + node.x) / 2 + Math.sin(t + node.angle) * 15;
        const my = (hub.y + node.y) / 2 + Math.cos(t + node.angle) * 15;
        ctx.quadraticCurveTo(mx, my, node.x, node.y);

        const grad = ctx.createLinearGradient(hub.x, hub.y, node.x, node.y);
        grad.addColorStop(0, `rgba(99, 102, 241, ${alpha * 0.8})`);
        grad.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, ${alpha})`);
        grad.addColorStop(1, `rgba(${r}, ${g}, ${b}, ${alpha * 0.6})`);
        ctx.strokeStyle = grad;
        ctx.lineWidth = isHovered ? 2.5 : 1.2;
        ctx.stroke();
      });

      for (let i = 0; i < satellites.length; i++) {
        for (let j = i + 1; j < satellites.length; j++) {
          const a = satellites[i];
          const b = satellites[j];
          const dist = Math.hypot(a.x - b.x, a.y - b.y);
          if (dist < dimensions.width * 0.5) {
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(100, 120, 200, 0.03)`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      particlePool.forEach((p) => {
        p.progress += p.speed;
        if (p.progress > 1) {
          p.progress = 0;
          p.lineIndex = Math.floor(Math.random() * satellites.length);
        }
        const target = satellites[p.lineIndex % satellites.length];
        if (!target) return;
        const prog = p.progress;
        p.x = hub.x + (target.x - hub.x) * prog;
        p.y = hub.y + (target.y - hub.y) * prog;

        const [r, g, b] = hexToRgb(target.color);
        const pAlpha = Math.sin(prog * Math.PI) * 0.8;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${pAlpha})`;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${pAlpha * 0.15})`;
        ctx.fill();
      });

      nodes.forEach((node) => {
        const isHub = node.id === "szl";
        const isHovered = hoveredNode === node.id;
        const pulseScale = isHub ? 1 + Math.sin(t * 1.5) * 0.04 : (isHovered ? 1.08 : 1);
        const r = node.radius * pulseScale;
        const [cr, cg, cb] = hexToRgb(node.color);

        if (isHub) {
          const outerGlow = ctx.createRadialGradient(node.x, node.y, r, node.x, node.y, r * 3.5);
          outerGlow.addColorStop(0, `rgba(${cr}, ${cg}, ${cb}, 0.08)`);
          outerGlow.addColorStop(0.5, `rgba(${cr}, ${cg}, ${cb}, 0.03)`);
          outerGlow.addColorStop(1, "transparent");
          ctx.beginPath();
          ctx.arc(node.x, node.y, r * 3.5, 0, Math.PI * 2);
          ctx.fillStyle = outerGlow;
          ctx.fill();

          const scanAngle = t * 0.8;
          ctx.beginPath();
          ctx.moveTo(node.x, node.y);
          ctx.arc(node.x, node.y, r * 2.8, scanAngle, scanAngle + 0.3);
          ctx.closePath();
          const scanGrad = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, r * 2.8);
          scanGrad.addColorStop(0, "transparent");
          scanGrad.addColorStop(0.8, `rgba(${cr}, ${cg}, ${cb}, 0.06)`);
          scanGrad.addColorStop(1, `rgba(${cr}, ${cg}, ${cb}, 0.02)`);
          ctx.fillStyle = scanGrad;
          ctx.fill();
        }

        if (isHovered && !isHub) {
          const hoverGlow = ctx.createRadialGradient(node.x, node.y, r, node.x, node.y, r * 3);
          hoverGlow.addColorStop(0, `rgba(${cr}, ${cg}, ${cb}, 0.15)`);
          hoverGlow.addColorStop(1, "transparent");
          ctx.beginPath();
          ctx.arc(node.x, node.y, r * 3, 0, Math.PI * 2);
          ctx.fillStyle = hoverGlow;
          ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
        const bg = ctx.createRadialGradient(
          node.x - r * 0.3, node.y - r * 0.3, 0,
          node.x, node.y, r
        );
        bg.addColorStop(0, `rgba(${cr}, ${cg}, ${cb}, 0.9)`);
        bg.addColorStop(1, `rgba(${cr}, ${cg}, ${cb}, 0.5)`);
        ctx.fillStyle = bg;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
        ctx.strokeStyle = isHovered ? `rgba(${cr}, ${cg}, ${cb}, 0.8)` : `rgba(${cr}, ${cg}, ${cb}, 0.3)`;
        ctx.lineWidth = isHovered ? 2 : 1;
        ctx.stroke();

        if (isHub) {
          ctx.beginPath();
          ctx.arc(node.x, node.y, r + 4, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(${cr}, ${cg}, ${cb}, 0.12)`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }

        ctx.fillStyle = "#ffffff";
        ctx.font = `${isHub ? "bold 13px" : "600 10px"} 'Plus Jakarta Sans', sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(isHub ? "SZL" : node.name.length > 8 ? node.name.slice(0, 7) : node.name, node.x, node.y);

        if (!isHub) {
          ctx.fillStyle = "rgba(160, 170, 200, 0.65)";
          ctx.font = "500 9px 'Inter', sans-serif";
          ctx.fillText(node.status, node.x, node.y + r + 14);
        }
      });

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animate();
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [nodes, hoveredNode, dimensions]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    let found: string | null = null;
    for (const node of nodes) {
      const dist = Math.hypot(node.x - mx, node.y - my);
      if (dist < node.radius + 10) {
        found = node.id;
        break;
      }
    }
    setHoveredNode(found);
    canvas.style.cursor = found && found !== "szl" ? "pointer" : "default";
  };

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    for (const node of nodes) {
      if (node.id === "szl") continue;
      const dist = Math.hypot(node.x - mx, node.y - my);
      if (dist < node.radius + 10) {
        analytics.ecosystemNodeClick(node.id);
        const venture = ventures.find((v) => v.id === node.id);
        if (venture) {
          navigate(venture.path);
        } else if (node.link !== "#") {
          window.location.href = node.link;
        }
        break;
      }
    }
  };

  return (
    <section id="ecosystem" className="py-20 lg:py-28">
      <div className="max-w-7xl mx-auto px-6">
        <m.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="font-[var(--font-display)] text-3xl sm:text-4xl lg:text-5xl font-bold text-szl-text mb-4">
            {ecosystem.title}
          </h2>
          <p className="text-szl-text-secondary text-lg max-w-2xl mx-auto">
            {ecosystem.subtitle}
          </p>
        </m.div>

        <m.div
          ref={containerRef}
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative rounded-2xl border border-szl-border bg-gradient-to-b from-szl-surface to-szl-bg/80 overflow-hidden"
          role="img"
          aria-label={ecosystem.canvasAriaLabel}
        >
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-szl-primary/30 to-transparent" />
          <canvas
            ref={canvasRef}
            width={dimensions.width}
            height={dimensions.height}
            style={{ width: dimensions.width, height: dimensions.height }}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setHoveredNode(null)}
            onClick={handleClick}
            aria-hidden="true"
          />
          <nav aria-label="Portfolio company links" className="sr-only">
            {ventures.map(venture => (
              <a key={venture.id} href={venture.path}>{venture.name} - {venture.status}</a>
            ))}
          </nav>
        </m.div>

        <div className="mt-6 flex flex-wrap justify-center gap-8 text-sm text-szl-text-muted">
          <span className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-szl-emerald opacity-40" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-szl-emerald" />
            </span>
            {ecosystem.legendLabels.live}
          </span>
          <span className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-szl-amber" /> {ecosystem.legendLabels.beta}
          </span>
          <span className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-szl-text-muted" /> {ecosystem.legendLabels.inDevelopment}
          </span>
        </div>
      </div>
    </section>
  );
}
