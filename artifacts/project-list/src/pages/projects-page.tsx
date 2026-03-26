import { useListProjects, Project } from "@workspace/api-client-react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { useRef, useState, useEffect, useCallback } from "react";
import { Linkedin, Mail, ArrowRight, ExternalLink, Loader2, ChevronDown, Code2, Cloud, Smartphone, Database, Shield, Zap, Star, Quote, Github, Twitter, CreditCard, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const statusLabels: Record<string, string> = {
  active: "In Progress",
  completed: "Delivered",
  "on-hold": "Paused",
  archived: "Legacy",
};

const statusColors: Record<string, string> = {
  active: "from-blue-500 to-cyan-400",
  completed: "from-emerald-500 to-green-400",
  "on-hold": "from-amber-500 to-yellow-400",
  archived: "from-zinc-500 to-zinc-400",
};

function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    const particles: { x: number; y: number; vx: number; vy: number; size: number; opacity: number }[] = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const isMobile = window.innerWidth < 768;
    const particleCount = isMobile ? 40 : 80;
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 2 + 0.5,
        opacity: Math.random() * 0.5 + 0.1,
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(139, 92, 246, ${p.opacity})`;
        ctx.fill();
      });
      particles.forEach((a, i) => {
        particles.slice(i + 1).forEach((b) => {
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(139, 92, 246, ${0.08 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        });
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

const navItems = [
  { label: "About", href: "#about" },
  { label: "Services", href: "#services" },
  { label: "Work", href: "#work" },
  { label: "Testimonials", href: "#testimonials" },
  { label: "Contact", href: "#contact" },
];

function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleNavClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    setMobileOpen(false);
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  }, []);

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-background/60 backdrop-blur-xl border-b border-border/50 shadow-lg shadow-black/10"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
        <a href="#hero" onClick={(e) => handleNavClick(e, "#hero")} className="text-xl sm:text-2xl font-display font-bold gradient-text">
          Stephen L.
        </a>

        <div className="hidden lg:flex items-center gap-6">
          {navItems.map((item) => (
            <a key={item.href} href={item.href} onClick={(e) => handleNavClick(e, item.href)} className="relative text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-300 after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[2px] after:bg-primary after:transition-all after:duration-300 hover:after:w-full">
              {item.label}
            </a>
          ))}
          <a
            href="https://linkedin.com/in/stephen-l-279315240"
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 hover:scale-105 active:scale-[0.98] transition-all duration-300 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/35"
          >
            Let's Connect
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </a>
        </div>

        <button onClick={() => setMobileOpen(!mobileOpen)} className="lg:hidden p-2 text-muted-foreground hover:text-foreground" aria-label="Toggle menu">
          <div className="w-6 h-5 flex flex-col justify-between">
            <span className={`block h-0.5 bg-current transition-all ${mobileOpen ? "rotate-45 translate-y-2" : ""}`} />
            <span className={`block h-0.5 bg-current transition-all ${mobileOpen ? "opacity-0" : ""}`} />
            <span className={`block h-0.5 bg-current transition-all ${mobileOpen ? "-rotate-45 -translate-y-2" : ""}`} />
          </div>
        </button>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="lg:hidden bg-background/95 backdrop-blur-xl border-b border-border/50">
            <div className="px-4 py-4 flex flex-col gap-3">
              {navItems.map((item) => (
                <a key={item.href} href={item.href} onClick={(e) => handleNavClick(e, item.href)} className="text-base font-medium text-muted-foreground hover:text-foreground py-2 transition-colors duration-300 hover:text-primary">
                  {item.label}
                </a>
              ))}
              <a href="https://linkedin.com/in/stephen-l-279315240" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold mt-2">
                Let's Connect <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}

const heroTextReveal = {
  hidden: { opacity: 0, y: 40, filter: "blur(8px)" },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      duration: 0.9,
      delay: 0.2 + i * 0.15,
      ease: [0.25, 0.4, 0.25, 1],
    },
  }),
};

function HeroSection() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.95]);

  return (
    <section id="hero" ref={ref} className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <ParticleField />
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 sm:w-96 sm:h-96 bg-primary/20 rounded-full blur-[120px] animate-pulse-glow" />
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 sm:w-96 sm:h-96 bg-purple-500/15 rounded-full blur-[120px] animate-pulse-glow" style={{ animationDelay: "2s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 sm:w-[600px] sm:h-[600px] bg-violet-600/10 rounded-full blur-[150px] animate-float" />
      </div>

      <motion.div style={{ y, opacity, scale }} className="relative z-10 text-center px-4 max-w-5xl mx-auto">
        <motion.div custom={0} initial="hidden" animate="visible" variants={heroTextReveal} className="mb-6">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs sm:text-sm font-semibold tracking-wide uppercase hover:bg-primary/15 transition-colors cursor-default">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            Available for Consulting
          </span>
        </motion.div>

        <motion.h1 custom={1} initial="hidden" animate="visible" variants={heroTextReveal} className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-display font-extrabold leading-[1.05] mb-6">
          Stephen L.
          <br />
          <span className="gradient-text">Building the Future</span>
          <br />
          of Technology
        </motion.h1>

        <motion.p custom={2} initial="hidden" animate="visible" variants={heroTextReveal} className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
          Technology consultant delivering enterprise solutions, digital transformation, and innovative software that drives real business results.
        </motion.p>

        <motion.div custom={3} initial="hidden" animate="visible" variants={heroTextReveal} className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a href="#work" onClick={(e) => { e.preventDefault(); document.querySelector("#work")?.scrollIntoView({ behavior: "smooth" }); }} className="group inline-flex items-center gap-2 px-8 py-4 rounded-full bg-primary text-primary-foreground font-semibold text-base sm:text-lg shadow-xl shadow-primary/30 hover:shadow-2xl hover:shadow-primary/40 hover:scale-105 active:scale-[0.98] transition-all duration-300">
            View My Work <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </a>
          <a href="#contact" onClick={(e) => { e.preventDefault(); document.querySelector("#contact")?.scrollIntoView({ behavior: "smooth" }); }} className="group inline-flex items-center gap-2 px-8 py-4 rounded-full border-2 border-border hover:border-primary/50 text-foreground font-semibold text-base sm:text-lg hover:bg-primary/5 active:scale-[0.98] transition-all duration-300">
            Get in Touch
            <ArrowRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
          </a>
        </motion.div>

        <motion.div custom={4} initial="hidden" animate="visible" variants={heroTextReveal} className="flex items-center justify-center gap-6 mt-12">
          <a href="https://linkedin.com/in/stephen-l-279315240" target="_blank" rel="noopener noreferrer" className="text-muted-foreground/50 hover:text-primary hover:scale-110 transition-all duration-300" aria-label="LinkedIn">
            <Linkedin className="w-5 h-5" />
          </a>
          <a href="https://github.com/stephenl" target="_blank" rel="noopener noreferrer" className="text-muted-foreground/50 hover:text-primary hover:scale-110 transition-all duration-300" aria-label="GitHub">
            <Github className="w-5 h-5" />
          </a>
          <a href="https://twitter.com/stephenl" target="_blank" rel="noopener noreferrer" className="text-muted-foreground/50 hover:text-primary hover:scale-110 transition-all duration-300" aria-label="Twitter">
            <Twitter className="w-5 h-5" />
          </a>
          <a href="mailto:contact@stephenl.dev" className="text-muted-foreground/50 hover:text-primary hover:scale-110 transition-all duration-300" aria-label="Email">
            <Mail className="w-5 h-5" />
          </a>
        </motion.div>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }} className="absolute bottom-8 left-1/2 -translate-x-1/2">
        <a href="#about" onClick={(e) => { e.preventDefault(); document.querySelector("#about")?.scrollIntoView({ behavior: "smooth" }); }} className="flex flex-col items-center gap-2 text-muted-foreground hover:text-foreground transition-all duration-300">
          <span className="text-xs font-medium tracking-widest uppercase">Scroll</span>
          <ChevronDown className="w-5 h-5 animate-bounce" />
        </a>
      </motion.div>
    </section>
  );
}

function AboutSection() {
  return (
    <section id="about" className="relative py-24 sm:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.7 }} className="max-w-3xl">
          <span className="text-primary font-semibold text-sm tracking-widest uppercase mb-4 block">About</span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold mb-8 leading-tight">
            Turning complex challenges into{" "}
            <span className="gradient-text">elegant solutions</span>
          </h2>
          <div className="space-y-5 text-muted-foreground text-base sm:text-lg leading-relaxed">
            <p>
              I'm Stephen L., a technology consultant specializing in enterprise software architecture, digital transformation, and full-stack development. I partner with organizations to design and build systems that scale — from cloud infrastructure to customer-facing applications.
            </p>
            <p>
              With deep expertise across modern tech stacks, I bring a hands-on, results-driven approach to every engagement. Whether it's leading a greenfield build, modernizing legacy systems, or optimizing development workflows, I deliver solutions that create lasting impact.
            </p>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.7, delay: 0.2 }} className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-16">
          {[
            { metric: "10+", label: "Years Experience" },
            { metric: "50+", label: "Projects Delivered" },
            { metric: "100%", label: "Client Satisfaction" },
            { metric: "24/7", label: "Dedicated Support" },
          ].map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.1 * i }} whileHover={{ y: -4, scale: 1.02 }} className="p-6 rounded-2xl border border-border/60 bg-card/50 backdrop-blur-sm hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 group">
              <div className="text-3xl sm:text-4xl font-display font-extrabold gradient-text mb-2">{stat.metric}</div>
              <div className="text-sm text-muted-foreground font-medium">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.7, delay: 0.3 }} className="mt-16">
          <h3 className="text-lg font-display font-semibold text-foreground mb-6">Technologies & Tools</h3>
          <div className="flex flex-wrap gap-3">
            {["React", "Next.js", "TypeScript", "Node.js", "Python", "PostgreSQL", "AWS", "Docker", "Kubernetes", "GraphQL", "REST APIs", "Redis", "MongoDB", "Terraform", "CI/CD", "Figma"].map((tech, i) => (
              <motion.span key={tech} initial={{ opacity: 0, scale: 0.8 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.3, delay: i * 0.03 }} className="px-4 py-2 rounded-full text-sm font-medium border border-border/60 bg-card/50 text-muted-foreground hover:border-primary/40 hover:text-primary transition-all cursor-default">
                {tech}
              </motion.span>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

const services = [
  {
    icon: Code2,
    title: "Full-Stack Development",
    description: "End-to-end application development from architecture to deployment. React, Node.js, Python, and modern frameworks.",
    gradient: "from-blue-500 to-cyan-400",
  },
  {
    icon: Cloud,
    title: "Cloud & Infrastructure",
    description: "Cloud-native architecture, AWS/GCP infrastructure, containerization, and scalable deployment pipelines.",
    gradient: "from-violet-500 to-purple-400",
  },
  {
    icon: Smartphone,
    title: "Digital Products",
    description: "Responsive web applications, mobile apps, and progressive web apps built for performance and user experience.",
    gradient: "from-pink-500 to-rose-400",
  },
  {
    icon: Database,
    title: "Data Architecture",
    description: "Database design, data modeling, ETL pipelines, and analytics infrastructure for data-driven decisions.",
    gradient: "from-emerald-500 to-green-400",
  },
  {
    icon: Shield,
    title: "Security & Compliance",
    description: "Security audits, compliance frameworks, authentication systems, and secure software development practices.",
    gradient: "from-amber-500 to-yellow-400",
  },
  {
    icon: Zap,
    title: "Performance Optimization",
    description: "Application profiling, load testing, caching strategies, and performance tuning for high-traffic systems.",
    gradient: "from-orange-500 to-red-400",
  },
];

function ServicesSection() {
  return (
    <section id="services" className="relative py-24 sm:py-32 overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-1/2 right-0 w-[600px] h-[400px] bg-primary/5 rounded-full blur-[150px]" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.7 }} className="text-center mb-16">
          <span className="text-primary font-semibold text-sm tracking-widest uppercase mb-4 block">Services</span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold mb-6">
            How I can <span className="gradient-text">help you</span>
          </h2>
          <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto">
            Comprehensive technology consulting services tailored to your business needs — from strategy to execution.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {services.map((service, i) => (
            <motion.div key={service.title} initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-50px" }} transition={{ duration: 0.6, delay: i * 0.1 }} whileHover={{ y: -6, scale: 1.02 }} className="group relative p-8 rounded-2xl border border-border/60 bg-card/50 backdrop-blur-sm hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 transition-all duration-500">
              <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mb-6 bg-gradient-to-br", service.gradient, "shadow-lg")}>
                <service.icon className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-display font-bold text-foreground mb-3 group-hover:text-primary transition-colors">
                {service.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {service.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

const projectAppUrls: Record<string, string> = {
  "Vessels Maritime Intelligence": "/vessels/",
  "Firestorm Security Simulation": "/firestorm/",
  "Lyte Command Center": "/lyte-command-center/",
  "Dreamscape Creative Engine": "/dreamscape/",
  "Readiness Report": "/readiness-report/",
  "Admin Control Plane": "/admin/",
  "Service Integration Layer": "/admin/",
  "Stephen L. Portfolio": "/",
};

function ProjectPortfolioCard({ project, index }: { project: Project; index: number }) {
  const label = statusLabels[project.status] || project.status;
  const gradient = statusColors[project.status] || "from-violet-500 to-purple-400";
  const appUrl = projectAppUrls[project.name];
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = (y - centerY) / centerY * -4;
    const rotateY = (x - centerX) / centerX * 4;
    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-8px)`;
    card.style.setProperty("--glow-x", `${x}px`);
    card.style.setProperty("--glow-y", `${y}px`);
  }, []);

  const handleMouseLeave = useCallback(() => {
    const card = cardRef.current;
    if (!card) return;
    card.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)";
  }, []);

  const CardWrapper = appUrl
    ? ({ children, className }: { children: React.ReactNode; className: string }) => (
        <a href={appUrl} className={className} target={appUrl === "/" ? undefined : "_blank"} rel="noopener noreferrer">
          {children}
        </a>
      )
    : ({ children, className }: { children: React.ReactNode; className: string }) => (
        <div className={className}>{children}</div>
      );

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="card-3d-tilt"
    >
      <CardWrapper className="group relative flex flex-col rounded-2xl border border-border/60 bg-card/50 backdrop-blur-sm overflow-hidden hover:border-primary/40 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 h-full cursor-pointer no-underline card-glow">
        <div className={`h-1 w-full bg-gradient-to-r ${gradient}`} />
        <div className="p-6 sm:p-8 flex flex-col flex-grow">
          <div className="flex items-center justify-between mb-4">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r ${gradient} text-white`}>
              {label}
            </span>
            {appUrl && <ExternalLink className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />}
          </div>
          <h3 className="text-xl sm:text-2xl font-display font-bold text-foreground mb-3 group-hover:text-primary transition-colors duration-300 line-clamp-2">
            {project.name}
          </h3>
          <p className="text-muted-foreground text-sm sm:text-base leading-relaxed mb-6 flex-grow line-clamp-3">
            {project.description || "A meticulously crafted project delivering cutting-edge solutions."}
          </p>
          <div className="pt-4 border-t border-border/40 flex items-center justify-between text-xs text-muted-foreground">
            <span>{new Date(project.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short" })}</span>
            {appUrl ? (
              <span className="flex items-center gap-1 text-primary font-medium opacity-0 group-hover:opacity-100 transition-all duration-300">
                Launch App <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </span>
            ) : (
              <span className="flex items-center gap-1 text-primary font-medium opacity-0 group-hover:opacity-100 transition-all duration-300">
                View Details <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </span>
            )}
          </div>
        </div>
      </CardWrapper>
    </motion.div>
  );
}

function WorkSection() {
  const { data: projects, isLoading, isError } = useListProjects();

  return (
    <section id="work" className="relative py-24 sm:py-32">
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/5 rounded-full blur-[150px]" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.7 }} className="text-center mb-16">
          <span className="text-primary font-semibold text-sm tracking-widest uppercase mb-4 block">Portfolio</span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold mb-6">
            Selected <span className="gradient-text">Work</span>
          </h2>
          <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto">
            A curated showcase of projects spanning enterprise architecture, digital products, and technology consulting engagements.
          </p>
        </motion.div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
            <p className="font-medium">Loading projects...</p>
          </div>
        ) : isError ? (
          <div className="text-center text-muted-foreground py-16">
            <p className="text-lg">Unable to load projects at this time.</p>
          </div>
        ) : projects && projects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {projects.map((project, i) => (
              <ProjectPortfolioCard key={project.id} project={project} index={i} />
            ))}
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-16">
            <p className="text-lg">Projects coming soon.</p>
          </div>
        )}
      </div>
    </section>
  );
}

const testimonials = [
  {
    name: "Sarah Chen",
    role: "CTO, TechVentures Inc.",
    quote: "Stephen transformed our entire platform architecture. His ability to see the big picture while nailing the details is exceptional. Delivery was on time and the system scaled 10x without breaking a sweat.",
    rating: 5,
  },
  {
    name: "Marcus Rivera",
    role: "VP Engineering, DataFlow",
    quote: "Working with Stephen was a game-changer. He modernized our legacy codebase in record time and mentored our team along the way. The ROI was visible within weeks.",
    rating: 5,
  },
  {
    name: "Emily Watson",
    role: "Founder, GreenLeaf Digital",
    quote: "Stephen doesn't just write code — he solves business problems. His strategic thinking and technical depth made him an invaluable partner for our product launch.",
    rating: 5,
  },
];

function TestimonialsSection() {
  return (
    <section id="testimonials" className="relative py-24 sm:py-32 overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute bottom-1/3 left-0 w-[500px] h-[400px] bg-purple-500/5 rounded-full blur-[150px]" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.7 }} className="text-center mb-16">
          <span className="text-primary font-semibold text-sm tracking-widest uppercase mb-4 block">Testimonials</span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold mb-6">
            What clients <span className="gradient-text">say</span>
          </h2>
          <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto">
            Don't just take my word for it — hear from the people I've worked with.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {testimonials.map((testimonial, i) => (
            <motion.div key={testimonial.name} initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-50px" }} transition={{ duration: 0.6, delay: i * 0.15 }} whileHover={{ y: -4 }} className="relative p-8 rounded-2xl border border-border/60 bg-card/50 backdrop-blur-sm hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
              <Quote className="w-8 h-8 text-primary/20 mb-4" />
              <div className="flex gap-1 mb-4">
                {Array.from({ length: testimonial.rating }).map((_, j) => (
                  <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-muted-foreground text-sm sm:text-base leading-relaxed mb-6 italic">
                "{testimonial.quote}"
              </p>
              <div className="pt-4 border-t border-border/40">
                <p className="font-display font-bold text-foreground">{testimonial.name}</p>
                <p className="text-sm text-muted-foreground">{testimonial.role}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

interface StripeProduct {
  id: string;
  name: string;
  description: string;
  active: boolean;
  prices: Array<{ id: string; amount: number; currency: string; interval?: string }>;
}

function PricingSection() {
  const [products, setProducts] = useState<StripeProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/billing/products")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setProducts(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSubscribe = async (priceId: string) => {
    setCheckoutLoading(priceId);
    try {
      const baseUrl = window.location.origin;
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          priceId,
          mode: "subscription",
          successUrl: baseUrl + "/stephen/checkout/success?session_id={CHECKOUT_SESSION_ID}",
          cancelUrl: baseUrl + "/stephen/checkout/cancel",
        }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch {
    } finally {
      setCheckoutLoading(null);
    }
  };

  if (loading || products.length === 0) return null;

  return (
    <section id="pricing" className="relative py-24 sm:py-32 overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/4 w-[500px] h-[400px] bg-primary/5 rounded-full blur-[150px]" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.7 }} className="text-center mb-16">
          <span className="text-primary font-semibold text-sm tracking-widest uppercase mb-4 block">Pricing</span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold mb-6">
            Simple, transparent <span className="gradient-text">pricing</span>
          </h2>
          <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto">
            Choose a plan that fits your needs. Get access to premium content, templates, and exclusive insights.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 max-w-5xl mx-auto">
          {products.map((product, i) => {
            const price = product.prices[0];
            if (!price) return null;
            const isPopular = i === 0 || products.length === 1;
            return (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6, delay: i * 0.15 }}
                whileHover={{ y: -6 }}
                className={cn(
                  "relative flex flex-col rounded-2xl border backdrop-blur-sm p-8 transition-all duration-300",
                  isPopular
                    ? "border-primary/50 bg-gradient-to-b from-primary/10 to-card/50 shadow-xl shadow-primary/10"
                    : "border-border/60 bg-card/50 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
                )}
              >
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold bg-primary text-primary-foreground shadow-lg">
                    Most Popular
                  </div>
                )}
                <div className="mb-6">
                  <h3 className="text-xl font-display font-bold text-foreground mb-2">{product.name}</h3>
                  {product.description && (
                    <p className="text-muted-foreground text-sm">{product.description}</p>
                  )}
                </div>
                <div className="mb-8">
                  <span className="text-4xl font-display font-extrabold text-foreground">
                    {new Intl.NumberFormat("en-US", { style: "currency", currency: price.currency }).format(price.amount / 100)}
                  </span>
                  {price.interval && (
                    <span className="text-muted-foreground text-base">/{price.interval}</span>
                  )}
                </div>
                <div className="flex-1 mb-8">
                  <div className="space-y-3">
                    {["Premium content access", "Exclusive templates", "Technical analyses", "Priority support"].map((feature) => (
                      <div key={feature} className="flex items-center gap-3 text-sm">
                        <Check className="w-4 h-4 text-primary shrink-0" />
                        <span className="text-muted-foreground">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => handleSubscribe(price.id)}
                  disabled={checkoutLoading === price.id}
                  className={cn(
                    "w-full py-3.5 rounded-full font-semibold text-base transition-all duration-300 flex items-center justify-center gap-2",
                    isPopular
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/35 hover:scale-105"
                      : "border-2 border-border hover:border-primary/50 text-foreground hover:bg-primary/5"
                  )}
                >
                  {checkoutLoading === price.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4" />
                      Subscribe
                    </>
                  )}
                </button>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function ContactSection() {
  return (
    <section id="contact" className="relative py-24 sm:py-32">
      <div className="absolute inset-0">
        <div className="absolute bottom-0 left-1/4 w-[600px] h-[400px] bg-primary/8 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[300px] bg-purple-500/5 rounded-full blur-[120px]" />
      </div>

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.7 }}>
          <span className="text-primary font-semibold text-sm tracking-widest uppercase mb-4 block">Contact</span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold mb-6">
            Let's build something{" "}
            <span className="gradient-text">extraordinary</span>
          </h2>
          <p className="text-muted-foreground text-base sm:text-lg max-w-xl mx-auto mb-12">
            Ready to transform your technology landscape? I'd love to hear about your project and explore how we can work together.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
            <a href="https://linkedin.com/in/stephen-l-279315240" target="_blank" rel="noopener noreferrer" className="group inline-flex items-center gap-3 px-8 py-4 rounded-full bg-[#0A66C2] text-white font-semibold text-base sm:text-lg shadow-xl shadow-[#0A66C2]/25 hover:shadow-2xl hover:shadow-[#0A66C2]/35 hover:scale-105 active:scale-[0.98] transition-all duration-300 w-full sm:w-auto justify-center">
              <Linkedin className="w-5 h-5" />
              Connect on LinkedIn
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </a>
            <a href="mailto:contact@stephenl.dev" className="group inline-flex items-center gap-3 px-8 py-4 rounded-full border-2 border-border hover:border-primary/50 text-foreground font-semibold text-base sm:text-lg hover:bg-primary/5 active:scale-[0.98] transition-all duration-300 w-full sm:w-auto justify-center">
              <Mail className="w-5 h-5" />
              Send an Email
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </a>
          </div>

          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.5 }} className="mt-12 flex items-center justify-center gap-8">
            <a href="https://github.com/stephenl" target="_blank" rel="noopener noreferrer" className="text-muted-foreground/50 hover:text-foreground hover:scale-110 transition-all duration-300" aria-label="GitHub">
              <Github className="w-6 h-6" />
            </a>
            <a href="https://linkedin.com/in/stephen-l-279315240" target="_blank" rel="noopener noreferrer" className="text-muted-foreground/50 hover:text-foreground hover:scale-110 transition-all duration-300" aria-label="LinkedIn">
              <Linkedin className="w-6 h-6" />
            </a>
            <a href="https://twitter.com/stephenl" target="_blank" rel="noopener noreferrer" className="text-muted-foreground/50 hover:text-foreground hover:scale-110 transition-all duration-300" aria-label="Twitter">
              <Twitter className="w-6 h-6" />
            </a>
            <a href="mailto:contact@stephenl.dev" className="text-muted-foreground/50 hover:text-foreground hover:scale-110 transition-all duration-300" aria-label="Email">
              <Mail className="w-6 h-6" />
            </a>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border/50 py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <span className="text-lg font-display font-bold gradient-text">Stephen L.</span>
            <span className="text-muted-foreground text-sm hidden sm:inline">|</span>
            <span className="text-muted-foreground text-sm hidden sm:inline">Technology Consulting</span>
          </div>

          <div className="flex items-center gap-6">
            <a href="https://linkedin.com/in/stephen-l-279315240" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary hover:scale-110 transition-all duration-300" aria-label="LinkedIn">
              <Linkedin className="w-5 h-5" />
            </a>
            <a href="https://github.com/stephenl" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary hover:scale-110 transition-all duration-300" aria-label="GitHub">
              <Github className="w-5 h-5" />
            </a>
            <a href="https://twitter.com/stephenl" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary hover:scale-110 transition-all duration-300" aria-label="Twitter">
              <Twitter className="w-5 h-5" />
            </a>
            <a href="mailto:contact@stephenl.dev" className="text-muted-foreground hover:text-primary hover:scale-110 transition-all duration-300" aria-label="Email">
              <Mail className="w-5 h-5" />
            </a>
          </div>

          <p className="text-muted-foreground text-xs sm:text-sm">
            &copy; {new Date().getFullYear()} Stephen L. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default function ProjectsPage() {
  return (
    <div className="min-h-screen bg-background relative">
      <Navbar />
      <HeroSection />
      <AboutSection />
      <ServicesSection />
      <WorkSection />
      <TestimonialsSection />
      <PricingSection />
      <ContactSection />
      <Footer />
    </div>
  );
}
