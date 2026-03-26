import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import portfolioData from "@/data/portfolio.json";
import siteData from "@/data/site.json";

interface Node {
  id: string;
  name: string;
  x: number;
  y: number;
  radius: number;
  color: string;
  link: string;
  status: string;
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
      radius: 36,
      color: "#6366f1",
      link: "#",
      status: siteData.ecosystem.legendLabels.live,
    },
  ];

  portfolioData.forEach((company, i) => {
    const angle = (i / portfolioData.length) * Math.PI * 2 - Math.PI / 2;
    nodes.push({
      id: company.id,
      name: company.name,
      x: cx + Math.cos(angle) * orbitRadius,
      y: cy + Math.sin(angle) * orbitRadius,
      radius: 22,
      color: company.color,
      link: company.link,
      status: company.status,
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

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateSize = () => {
      const rect = container.getBoundingClientRect();
      const w = rect.width;
      const h = Math.max(400, Math.min(550, w * 0.6));
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

    const animate = () => {
      timeRef.current += 0.005;
      const t = timeRef.current;

      ctx.clearRect(0, 0, dimensions.width, dimensions.height);

      const hub = nodes[0];
      const satellites = nodes.slice(1);

      satellites.forEach((node) => {
        const grad = ctx.createLinearGradient(hub.x, hub.y, node.x, node.y);
        const isHovered = hoveredNode === node.id;
        const alpha = isHovered ? 0.4 : 0.12;
        grad.addColorStop(0, `rgba(99, 102, 241, ${alpha})`);
        grad.addColorStop(1, `${node.color}${isHovered ? "66" : "1f"}`);
        ctx.beginPath();
        ctx.moveTo(hub.x, hub.y);
        ctx.lineTo(node.x, node.y);
        ctx.strokeStyle = grad;
        ctx.lineWidth = isHovered ? 2 : 1;
        ctx.stroke();

        const particlePos = (t * 0.3 + satellites.indexOf(node) * 0.15) % 1;
        const px = hub.x + (node.x - hub.x) * particlePos;
        const py = hub.y + (node.y - hub.y) * particlePos;
        ctx.beginPath();
        ctx.arc(px, py, 2, 0, Math.PI * 2);
        ctx.fillStyle = `${node.color}88`;
        ctx.fill();
      });

      for (let i = 0; i < satellites.length; i++) {
        for (let j = i + 1; j < satellites.length; j++) {
          const a = satellites[i];
          const b = satellites[j];
          const dist = Math.hypot(a.x - b.x, a.y - b.y);
          if (dist < dimensions.width * 0.45) {
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(100, 120, 200, 0.04)`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      nodes.forEach((node) => {
        const isHub = node.id === "szl";
        const isHovered = hoveredNode === node.id;
        const pulseScale = isHub ? 1 + Math.sin(t * 2) * 0.05 : 1;
        const r = node.radius * pulseScale;

        if (isHub || isHovered) {
          const glow = ctx.createRadialGradient(node.x, node.y, r, node.x, node.y, r * 2.5);
          glow.addColorStop(0, `${node.color}22`);
          glow.addColorStop(1, "transparent");
          ctx.beginPath();
          ctx.arc(node.x, node.y, r * 2.5, 0, Math.PI * 2);
          ctx.fillStyle = glow;
          ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
        const bg = ctx.createRadialGradient(node.x - r * 0.3, node.y - r * 0.3, 0, node.x, node.y, r);
        bg.addColorStop(0, `${node.color}cc`);
        bg.addColorStop(1, `${node.color}66`);
        ctx.fillStyle = bg;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
        ctx.strokeStyle = isHovered ? `${node.color}aa` : `${node.color}44`;
        ctx.lineWidth = isHovered ? 2 : 1;
        ctx.stroke();

        ctx.fillStyle = "#ffffff";
        ctx.font = `${isHub ? "bold 11px" : "600 10px"} 'Plus Jakarta Sans', sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(isHub ? "SZL" : node.name.slice(0, 7), node.x, node.y);

        if (!isHub) {
          ctx.fillStyle = "rgba(160, 170, 200, 0.7)";
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
      if (dist < node.radius + 8) {
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
      if (dist < node.radius + 8 && node.link !== "#") {
        window.location.href = node.link;
        break;
      }
    }
  };

  return (
    <section id="ecosystem" className="py-20 lg:py-28">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="font-[var(--font-display)] text-3xl sm:text-4xl font-bold text-szl-text mb-4">
            {ecosystem.title}
          </h2>
          <p className="text-szl-text-secondary text-lg max-w-2xl mx-auto">
            {ecosystem.subtitle}
          </p>
        </motion.div>

        <motion.div
          ref={containerRef}
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative rounded-2xl border border-szl-border bg-szl-surface overflow-hidden"
          role="img"
          aria-label={ecosystem.canvasAriaLabel}
        >
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
            {portfolioData.filter(c => c.link !== "#").map(company => (
              <a key={company.id} href={company.link}>{company.name} - {company.status}</a>
            ))}
          </nav>
        </motion.div>

        <div className="mt-6 flex flex-wrap justify-center gap-6 text-sm text-szl-text-muted">
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-szl-emerald" /> {ecosystem.legendLabels.live}
          </span>
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-szl-amber" /> {ecosystem.legendLabels.beta}
          </span>
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-szl-text-muted" /> {ecosystem.legendLabels.inDevelopment}
          </span>
        </div>
      </div>
    </section>
  );
}
