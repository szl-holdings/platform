import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { WarmGrain, MagneticButton, LetterReveal } from "@szl-holdings/shared-ui";

function GoldDust() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -1, y: -1 });

  useEffect(() => {
    const handleMouse = (e: MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    window.addEventListener("mousemove", handleMouse, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouse);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let animFrame: number;
    let time = 0;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resize();
    window.addEventListener("resize", resize);
    const particles: { x: number; y: number; vx: number; vy: number; size: number; opacity: number; ox: number; oy: number }[] = [];
    for (let i = 0; i < 55; i++) {
      const x = Math.random() * canvas.offsetWidth;
      const y = Math.random() * canvas.offsetHeight;
      particles.push({
        x, y, ox: x, oy: y,
        vx: (Math.random() - 0.5) * 0.15,
        vy: -Math.random() * 0.08 - 0.015,
        size: Math.random() * 1.4 + 0.25,
        opacity: Math.random() * 0.18 + 0.03,
      });
    }
    const draw = () => {
      if (document.hidden) { animFrame = requestAnimationFrame(draw); return; }
      time += 0.001;
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;
      ctx.clearRect(0, 0, w, h);
      particles.forEach(p => {
        const dx = p.x - mx;
        const dy = p.y - my;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const repulse = dist > 0 && dist < 80 ? ((80 - dist) / 80) * 0.5 : 0;
        p.x += p.vx + Math.sin(time * 2 + p.y * 0.01) * 0.05 + (dist > 0 ? (dx / dist) * repulse : 0);
        p.y += p.vy + (dist > 0 ? (dy / dist) * repulse * 0.5 : 0);
        if (p.y < -5) { p.y = h + 5; p.x = Math.random() * w; }
        if (p.x < -5) p.x = w + 5;
        if (p.x > w + 5) p.x = -5;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(196,170,126,${p.opacity})`;
        ctx.fill();
      });
      animFrame = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(animFrame); window.removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden="true" />;
}

export default function Hero() {
  const { t } = useTranslation();

  const stats = [
    { value: t("hero.stats.retention.value"), label: t("hero.stats.retention.label") },
    { value: t("hero.stats.response.value"), label: t("hero.stats.response.label") },
    { value: t("hero.stats.discreet.value"), label: t("hero.stats.discreet.label") },
  ];

  const practiceAreas = [
    t("hero.areas.residenceOps"),
    t("hero.areas.propertyCoord"),
    t("hero.areas.householdSystems"),
    t("hero.areas.vendorManagement"),
    t("hero.areas.lifestyleAdmin"),
    t("hero.areas.specialProjects"),
  ];

  return (
    <section className="relative overflow-hidden" style={{ background: "#1a1714", minHeight: "min(92vh, 820px)" }}>
      <WarmGrain opacity={0.022} />
      <GoldDust />
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 inset-inline-0 h-px" style={{ background: "linear-gradient(to right, transparent, rgba(196,170,126,0.15), transparent)" }} />
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 70% 60% at 75% 30%, rgba(196,170,126,0.05) 0%, transparent 70%)" }} />
        <div className="absolute bottom-0 inset-inline-0 h-32" style={{ background: "linear-gradient(to top, #1a1714, transparent)" }} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-8 lg:px-16 pt-36 sm:pt-40 lg:pt-44 pb-16 sm:pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          <div className="lg:col-span-7">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8 }}
              className="flex items-center gap-2 mb-8"
            >
              <div className="w-6 h-px" style={{ background: "rgba(196,170,126,0.5)" }} />
              <span className="text-[11px] font-medium tracking-[0.3em] uppercase" style={{ color: "rgba(196,170,126,0.7)" }}>
                {t("hero.badge")}
              </span>
            </motion.div>

            <LetterReveal
              text={t("hero.headline")}
              as="h1"
              delay={0.2}
              stagger={0.022}
              className="font-serif leading-[1.06] mb-3"
              style={{ fontSize: "clamp(2.6rem, 5.5vw, 4.5rem)", fontWeight: 300, color: "#f5f0e8" }}
            />
            <LetterReveal
              text={t("hero.headlineEmphasis")}
              as="h1"
              delay={0.55}
              stagger={0.02}
              className="font-serif leading-[1.06] mb-7"
              style={{ fontSize: "clamp(2.6rem, 5.5vw, 4.5rem)", fontWeight: 300, fontStyle: "italic", color: "rgba(196,170,126,0.85)" }}
            />

            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="text-[15px] font-light leading-relaxed mb-10 max-w-md"
              style={{ color: "rgba(245,240,232,0.65)" }}
            >
              {t("hero.subheadline")}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.65 }}
              className="flex flex-col sm:flex-row items-start gap-3"
            >
              <MagneticButton>
                <Link
                  href="/contact"
                  className="group flex items-center gap-2.5 px-7 py-3.5 text-[12px] font-medium tracking-[0.08em] uppercase transition-all duration-300"
                  style={{ color: "#1a1714", background: "rgba(196,170,126,0.9)", boxShadow: "0 0 28px rgba(196,170,126,0.14)" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(196,170,126,1)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 0 40px rgba(196,170,126,0.24)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(196,170,126,0.9)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 0 28px rgba(196,170,126,0.14)"; }}
                >
                  {t("common.beginConversation")}
                  <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </MagneticButton>
              <MagneticButton>
                <Link
                  href="/services"
                  className="px-6 py-3.5 text-[11px] font-medium tracking-[0.15em] uppercase transition-all duration-300"
                  style={{ color: "rgba(196,170,126,0.5)", border: "1px solid rgba(196,170,126,0.15)" }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = "rgba(196,170,126,0.35)";
                    (e.currentTarget as HTMLElement).style.color = "rgba(196,170,126,0.8)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = "rgba(196,170,126,0.15)";
                    (e.currentTarget as HTMLElement).style.color = "rgba(196,170,126,0.5)";
                  }}
                >
                  {t("nav.services")}
                </Link>
              </MagneticButton>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="lg:col-span-5 lg:mt-8"
          >
            <div className="border" style={{ borderColor: "rgba(196,170,126,0.1)", background: "rgba(26,23,20,0.6)", backdropFilter: "blur(12px)" }}>
              <div className="grid grid-cols-3 gap-px" style={{ background: "rgba(196,170,126,0.08)" }}>
                {stats.map((stat) => (
                  <div key={stat.label} className="px-5 py-6 text-center" style={{ background: "rgba(26,23,20,0.9)" }}>
                    <p className="font-serif text-xl sm:text-2xl font-light mb-1" style={{ color: "#f5f0e8" }}>{stat.value}</p>
                    <p className="text-[9px] tracking-[0.2em] uppercase font-medium" style={{ color: "rgba(196,170,126,0.45)" }}>{stat.label}</p>
                  </div>
                ))}
              </div>

              <div className="p-7" style={{ borderTop: "1px solid rgba(196,170,126,0.08)" }}>
                <p className="text-[10px] font-semibold tracking-[0.3em] uppercase mb-5" style={{ color: "rgba(196,170,126,0.5)" }}>
                  {t("hero.practiceAreas")}
                </p>
                <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                  {practiceAreas.map((item) => (
                    <div key={item} className="flex items-center gap-2 text-[12px] font-light" style={{ color: "rgba(245,240,232,0.5)" }}>
                      <span style={{ color: "rgba(196,170,126,0.4)" }}>—</span>
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between px-1">
              <span className="text-[10px] tracking-[0.2em] uppercase" style={{ color: "rgba(196,170,126,0.25)" }}>{t("hero.location")}</span>
              <span className="text-[10px]" style={{ color: "rgba(196,170,126,0.25)" }}>{t("hero.email")}</span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
