import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGetStephenProfile } from "@workspace/api-client-react";
import { useRef, useEffect } from "react";

function GeometricMesh() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    const nodes: { x: number; y: number; vx: number; vy: number; radius: number; }[] = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const isMobile = window.innerWidth < 768;
    const nodeCount = isMobile ? 30 : 60;
    for (let i = 0; i < nodeCount; i++) {
      nodes.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        radius: Math.random() * 2 + 1,
      });
    }

    let time = 0;
    const goldColor = { r: 196, g: 155, b: 45 };

    const animate = () => {
      time += 0.005;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      nodes.forEach((node) => {
        node.x += node.vx;
        node.y += node.vy;
        if (node.x < 0 || node.x > canvas.width) node.vx *= -1;
        if (node.y < 0 || node.y > canvas.height) node.vy *= -1;
      });

      const connectionDist = isMobile ? 100 : 150;
      nodes.forEach((a, i) => {
        nodes.slice(i + 1).forEach((b) => {
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < connectionDist) {
            const opacity = 0.12 * (1 - dist / connectionDist);
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(${goldColor.r}, ${goldColor.g}, ${goldColor.b}, ${opacity})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        });
      });

      nodes.forEach((node) => {
        const pulse = 0.4 + Math.sin(time * 2 + node.x * 0.01) * 0.3;
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${goldColor.r}, ${goldColor.g}, ${goldColor.b}, ${pulse})`;
        ctx.fill();
      });

      animationId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />;
}

const textReveal = {
  hidden: { opacity: 0, y: 40, filter: "blur(10px)" },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      duration: 0.8,
      delay: 0.3 + i * 0.15,
      ease: [0.25, 0.4, 0.25, 1],
    },
  }),
};

export function HeroSection() {
  const { data: profile, isLoading } = useGetStephenProfile();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const opacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  const fallback = {
    name: "Stephen Lutar",
    title: "Founder & CEO, SZL Holdings",
    tagline: "Building the future of integrated technology",
  };

  const name = profile?.name || fallback.name;
  const title = profile?.title || fallback.title;
  const tagline = profile?.tagline || fallback.tagline;

  return (
    <section id="hero" ref={ref} className="relative min-h-screen flex items-center pt-20 overflow-hidden">
      <GeometricMesh />

      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-primary/15 rounded-full blur-[150px] animate-hero-glow" />
        <div className="absolute bottom-1/3 right-1/4 w-[350px] h-[350px] bg-yellow-600/10 rounded-full blur-[130px] animate-hero-glow-delayed" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[180px] animate-hero-float" />
      </div>

      <motion.div style={{ y, opacity }} className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl relative z-10">
        <div className="max-w-4xl">
          <motion.div
            custom={0}
            initial="hidden"
            animate="visible"
            variants={textReveal}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-panel mb-8 border-primary/30 group cursor-default">
              <Sparkles className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium text-primary">Available for Consulting</span>
            </div>
          </motion.div>

          <motion.h1
            custom={1}
            initial="hidden"
            animate="visible"
            variants={textReveal}
            className="text-5xl sm:text-7xl md:text-8xl font-serif font-bold text-foreground leading-[1.1] mb-6"
          >
            <span className={isLoading ? "blur-sm" : "transition-all duration-500"}>{name}</span>
          </motion.h1>

          <motion.h2
            custom={2}
            initial="hidden"
            animate="visible"
            variants={textReveal}
            className="text-2xl sm:text-3xl md:text-4xl text-muted-foreground font-light mb-8"
          >
            <span className={isLoading ? "blur-sm" : "transition-all duration-500"}>{title}</span>
          </motion.h2>

          <motion.p
            custom={3}
            initial="hidden"
            animate="visible"
            variants={textReveal}
            className="text-lg sm:text-xl text-foreground/80 max-w-2xl mb-12 leading-relaxed"
          >
            <span className={isLoading ? "blur-sm" : "transition-all duration-500"}>{tagline}</span>
          </motion.p>

          <motion.div
            custom={4}
            initial="hidden"
            animate="visible"
            variants={textReveal}
            className="flex flex-wrap items-center gap-6"
          >
            <a href="#portfolio">
              <Button size="lg" className="rounded-full px-8 py-6 text-base shadow-xl shadow-primary/25 hover:shadow-primary/40 hover:scale-105 transition-all duration-300 group">
                View Portfolio
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </a>
            <a href="#contact" className="text-foreground hover:text-primary font-medium transition-all duration-300 flex items-center gap-2 group">
              Request a Meeting
              <ArrowRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
            </a>
          </motion.div>
        </div>
      </motion.div>

      <motion.div
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.5, duration: 0.8 }}
      >
        <span className="text-xs uppercase tracking-widest text-muted-foreground font-medium">Scroll</span>
        <div className="w-[1px] h-12 bg-gradient-to-b from-primary to-transparent animate-pulse" />
      </motion.div>
    </section>
  );
}
