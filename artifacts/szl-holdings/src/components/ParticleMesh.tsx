import { useRef, useEffect, useCallback } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  opacity: number;
}

export function ParticleMesh({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const rafRef = useRef<number>(0);

  const init = useCallback((canvas: HTMLCanvasElement) => {
    const w = canvas.width;
    const h = canvas.height;
    const count = Math.min(Math.floor((w * h) / 8000), 120);
    const particles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        radius: Math.random() * 1.5 + 0.5,
        opacity: Math.random() * 0.5 + 0.15,
      });
    }
    particlesRef.current = particles;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      init(canvas);
    };

    resize();
    window.addEventListener("resize", resize);

    const handleMouse = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    canvas.addEventListener("mousemove", handleMouse);

    const connectionDist = 130;
    const mouseDist = 180;

    const draw = () => {
      const particles = particlesRef.current;
      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      ctx.clearRect(0, 0, w, h);

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        if (p.y > h) p.y = 0;

        const dxm = p.x - mx;
        const dym = p.y - my;
        const distMouse = Math.sqrt(dxm * dxm + dym * dym);
        if (distMouse < mouseDist) {
          const force = (mouseDist - distMouse) / mouseDist * 0.015;
          p.vx += dxm * force;
          p.vy += dym * force;
        }

        const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        if (speed > 1.2) {
          p.vx *= 0.95;
          p.vy *= 0.95;
        }
      }

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < connectionDist) {
            const alpha = (1 - dist / connectionDist) * 0.18;
            ctx.strokeStyle = `hsla(192, 65%, 55%, ${alpha})`;
            ctx.lineWidth = 0.6;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      for (const p of particles) {
        const dxm = p.x - mx;
        const dym = p.y - my;
        const distMouse = Math.sqrt(dxm * dxm + dym * dym);
        const glow = distMouse < mouseDist ? 0.3 + (1 - distMouse / mouseDist) * 0.5 : 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius + glow, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(192, 65%, 65%, ${p.opacity + glow * 0.3})`;
        ctx.fill();
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("mousemove", handleMouse);
    };
  }, [init]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "auto",
        zIndex: 0,
      }}
    />
  );
}
