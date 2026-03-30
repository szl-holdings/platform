import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, useEffect } from "react";
import { ArrowRight, Shield, Monitor, Headphones, BarChart3, Clock, Users, ChevronDown, Zap, Globe, Lock, Server } from "lucide-react";

function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let animationId: number;
    const particles: { x: number; y: number; vx: number; vy: number; size: number; opacity: number }[] = [];
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener("resize", resize);
    for (let i = 0; i < 60; i++) {
      particles.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3, size: Math.random() * 2 + 0.5, opacity: Math.random() * 0.4 + 0.1 });
    }
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = canvas.width; if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height; if (p.y > canvas.height) p.y = 0;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(139, 92, 246, ${p.opacity})`; ctx.fill();
      });
      particles.forEach((a, i) => {
        particles.slice(i + 1).forEach((b) => {
          const dx = a.x - b.x, dy = a.y - b.y, dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 100) { ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.strokeStyle = `rgba(139, 92, 246, ${0.06 * (1 - dist / 100)})`; ctx.lineWidth = 0.5; ctx.stroke(); }
        });
      });
      animationId = requestAnimationFrame(animate);
    };
    animate();
    return () => { cancelAnimationFrame(animationId); window.removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />;
}

const heroVariant = {
  hidden: { opacity: 0, y: 40, filter: "blur(8px)" },
  visible: (i: number) => ({ opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.8, delay: 0.2 + i * 0.15, ease: [0.25, 0.4, 0.25, 1] as [number, number, number, number] } }),
};

const features = [
  { icon: Monitor, title: "Remote Monitoring & Management", description: "Real-time visibility into every device across your entire client portfolio. Automated alerts, patch management, and proactive remediation.", gradient: "from-blue-500 to-cyan-400" },
  { icon: Headphones, title: "Service Desk & Ticketing", description: "Intelligent ticket routing with SLA tracking, priority queuing, and automated escalation workflows that keep your team efficient.", gradient: "from-violet-500 to-purple-400" },
  { icon: Shield, title: "Security Operations Center", description: "24/7 threat monitoring, incident response automation, and compliance reporting. Protect your clients from evolving cyber threats.", gradient: "from-emerald-500 to-green-400" },
  { icon: BarChart3, title: "Revenue & Profitability", description: "Track MRR per client, service utilization, and profitability metrics. Make data-driven decisions about your service delivery.", gradient: "from-amber-500 to-yellow-400" },
  { icon: Clock, title: "SLA & Contract Management", description: "Automated compliance tracking, renewal alerts, and performance reporting. Never miss an SLA target or contract deadline.", gradient: "from-pink-500 to-rose-400" },
  { icon: Users, title: "Technician Dispatch", description: "Optimize team workloads, track assignments in real-time, and ensure the right technician is matched to every job.", gradient: "from-orange-500 to-red-400" },
];

const stats = [
  { value: "2,166", label: "Devices Managed" },
  { value: "99.7%", label: "Average Uptime" },
  { value: "8 min", label: "Avg Response Time" },
  { value: "$187.9K", label: "Monthly Revenue" },
];

export default function LandingPage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <div className="min-h-screen bg-background">
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <ParticleField />
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/15 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: "2s" }} />
        </div>

        <motion.div style={{ y, opacity }} className="relative z-10 text-center px-4 max-w-5xl mx-auto">
          <motion.div custom={0} initial="hidden" animate="visible" variants={heroVariant} className="mb-6">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs sm:text-sm font-semibold tracking-wide uppercase">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              Next-Generation MSP Platform
            </span>
          </motion.div>

          <motion.h1 custom={1} initial="hidden" animate="visible" variants={heroVariant} className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-display font-extrabold leading-[1.05] mb-6">
            MSP
            <br />
            <span className="gradient-text">Command Center</span>
          </motion.h1>

          <motion.p custom={2} initial="hidden" animate="visible" variants={heroVariant} className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            The unified platform for Managed Service Providers. Monitor devices, manage tickets, track SLAs, and drive profitability — all from one command center.
          </motion.p>

          <motion.div custom={3} initial="hidden" animate="visible" variants={heroVariant} className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href={`${import.meta.env.BASE_URL}dashboard`} className="group inline-flex items-center gap-2 px-8 py-4 rounded-full bg-primary text-primary-foreground font-semibold text-base sm:text-lg shadow-xl shadow-primary/30 hover:shadow-2xl hover:shadow-primary/40 hover:scale-105 active:scale-[0.98] transition-all duration-300">
              Launch Dashboard <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </a>
          </motion.div>

          <motion.div custom={4} initial="hidden" animate="visible" variants={heroVariant} className="grid grid-cols-2 sm:grid-cols-4 gap-6 mt-16 max-w-3xl mx-auto">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl sm:text-3xl font-display font-extrabold gradient-text">{stat.value}</div>
                <div className="text-xs sm:text-sm text-muted-foreground mt-1">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }} className="absolute bottom-8 left-1/2 -translate-x-1/2">
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <span className="text-xs font-medium tracking-widest uppercase">Explore</span>
            <ChevronDown className="w-5 h-5 animate-bounce" />
          </div>
        </motion.div>
      </section>

      <section className="relative py-24 sm:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }} className="text-center mb-16">
            <span className="text-primary font-semibold text-sm tracking-widest uppercase mb-4 block">Capabilities</span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold mb-6">
              Everything you need to <span className="gradient-text">run your MSP</span>
            </h2>
            <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto">
              A unified platform that replaces your disconnected tools with one powerful command center.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {features.map((feature, i) => (
              <motion.div key={feature.title} initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: i * 0.1 }} className="group relative p-8 rounded-2xl border border-border/60 bg-card/50 backdrop-blur-sm hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 transition-all duration-500">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 bg-gradient-to-br ${feature.gradient} shadow-lg`}>
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-display font-bold text-foreground mb-3 group-hover:text-primary transition-colors">{feature.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative py-24 sm:py-32 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-0 w-[600px] h-[400px] bg-primary/5 rounded-full blur-[150px]" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }} className="text-center mb-16">
            <span className="text-primary font-semibold text-sm tracking-widest uppercase mb-4 block">Why Choose Us</span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold mb-6">
              Built for <span className="gradient-text">modern MSPs</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Zap, title: "Lightning Fast", desc: "Sub-second response times across all dashboards and workflows" },
              { icon: Globe, title: "Multi-Tenant", desc: "Manage hundreds of clients from a single pane of glass" },
              { icon: Lock, title: "Enterprise Security", desc: "SOC 2 compliant with end-to-end encryption and RBAC" },
              { icon: Server, title: "99.99% Uptime", desc: "Geo-redundant infrastructure with automatic failover" },
            ].map((item, i) => (
              <motion.div key={item.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.1 }} className="p-6 rounded-2xl border border-border/60 bg-card/50 text-center hover:border-primary/30 transition-all">
                <item.icon className="w-8 h-8 text-primary mx-auto mb-4" />
                <h3 className="font-display font-bold text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 border-t border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm text-muted-foreground">
            MSP Command Center &middot; Part of the <a href="/szl-holdings/" className="text-primary hover:underline">SZL Holdings</a> Platform
          </p>
        </div>
      </section>
    </div>
  );
}
