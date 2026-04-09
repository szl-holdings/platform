import { useEffect, useRef, useState, useCallback, type ReactNode } from "react";
import { motion as m, useSpring, useMotionValue, AnimatePresence } from "framer-motion";

const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function useMouseParallax(strength = 0.04) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 80, damping: 22, mass: 0.4 });
  const springY = useSpring(y, { stiffness: 80, damping: 22, mass: 0.4 });

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const handleMove = (e: MouseEvent) => {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      x.set((e.clientX - cx) * strength);
      y.set((e.clientY - cy) * strength);
    };
    window.addEventListener("mousemove", handleMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMove);
  }, [strength, x, y]);

  return { x: springX, y: springY };
}

export function useScrollY() {
  const [scrollY, setScrollY] = useState(0);
  useEffect(() => {
    const h = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);
  return scrollY;
}

export function useInViewOnce(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setVisible(true); obs.disconnect(); }
    }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

interface WordRevealProps {
  text: string;
  className?: string;
  style?: React.CSSProperties;
  delay?: number;
  stagger?: number;
  as?: "h1" | "h2" | "h3" | "p" | "span";
}

export function WordReveal({ text, className = "", style, delay = 0, stagger = 0.06, as: Tag = "h1" }: WordRevealProps) {
  const { ref, visible } = useInViewOnce();
  const reduced = prefersReducedMotion();
  const words = text.split(" ");

  if (reduced) {
    return <Tag className={className} style={style}>{text}</Tag>;
  }

  return (
    <Tag className={className} style={{ ...style, display: "block" }} ref={ref}>
      {words.map((word, i) => (
        <span key={i} style={{ display: "inline-block", overflow: "hidden", marginRight: "0.25em" }}>
          <m.span
            style={{ display: "inline-block" }}
            initial={{ y: "105%", opacity: 0 }}
            animate={visible ? { y: "0%", opacity: 1 } : {}}
            transition={{ duration: 0.65, delay: delay + i * stagger, ease: [0.22, 1, 0.36, 1] }}
          >
            {word}
          </m.span>
        </span>
      ))}
    </Tag>
  );
}

interface LetterRevealProps {
  text: string;
  className?: string;
  style?: React.CSSProperties;
  delay?: number;
  stagger?: number;
  as?: "h1" | "h2" | "h3" | "p" | "span";
}

export function LetterReveal({ text, className = "", style, delay = 0, stagger = 0.025, as: Tag = "h1" }: LetterRevealProps) {
  const { ref, visible } = useInViewOnce();
  const reduced = prefersReducedMotion();
  const letters = text.split("");

  if (reduced) {
    return <Tag className={className} style={style}>{text}</Tag>;
  }

  return (
    <Tag className={className} style={{ ...style, display: "block" }} ref={ref}>
      {letters.map((letter, i) => (
        <span key={i} style={{ display: "inline-block", overflow: letter === " " ? undefined : "hidden" }}>
          {letter === " " ? "\u00A0" : (
            <m.span
              style={{ display: "inline-block" }}
              initial={{ y: "110%", opacity: 0 }}
              animate={visible ? { y: "0%", opacity: 1 } : {}}
              transition={{ duration: 0.55, delay: delay + i * stagger, ease: [0.22, 1, 0.36, 1] }}
            >
              {letter}
            </m.span>
          )}
        </span>
      ))}
    </Tag>
  );
}

interface MagneticButtonProps {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  strength?: number;
  onClick?: React.MouseEventHandler;
  as?: "button" | "a" | "div";
  href?: string;
}

export function MagneticButton({ children, className = "", style, strength = 0.35, onClick, as: Tag = "div", href }: MagneticButtonProps) {
  const divRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const aRef = useRef<HTMLAnchorElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 200, damping: 18, mass: 0.3 });
  const springY = useSpring(y, { stiffness: 200, damping: 18, mass: 0.3 });
  const reduced = prefersReducedMotion();

  const handleMove = useCallback((e: React.MouseEvent) => {
    if (reduced) return;
    const activeRef = Tag === "button" ? btnRef : Tag === "a" ? aRef : divRef;
    if (!activeRef.current) return;
    const rect = activeRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    x.set((e.clientX - cx) * strength);
    y.set((e.clientY - cy) * strength);
  }, [reduced, strength, x, y, Tag]);

  const handleLeave = useCallback(() => {
    x.set(0);
    y.set(0);
  }, [x, y]);

  const commonProps = {
    className,
    style: { ...style } as React.CSSProperties,
    onMouseMove: handleMove,
    onMouseLeave: handleLeave,
    onClick,
  };

  return (
    <m.div style={{ x: springX, y: springY, display: "inline-flex" }}>
      {Tag === "button" ? (
        <button ref={btnRef} {...commonProps}>{children}</button>
      ) : Tag === "a" ? (
        <a ref={aRef} href={href} {...commonProps}>{children}</a>
      ) : (
        <div ref={divRef} {...commonProps}>{children}</div>
      )}
    </m.div>
  );
}

interface NoiseGrainProps {
  opacity?: number;
  className?: string;
}

export function NoiseGrain({ opacity = 0.028, className = "" }: NoiseGrainProps) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none fixed inset-0 z-[9999] ${className}`}
      style={{
        opacity,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        backgroundRepeat: "repeat",
        backgroundSize: "192px 192px",
        mixBlendMode: "overlay",
      }}
    />
  );
}

interface WarmGrainProps {
  opacity?: number;
}

export function WarmGrain({ opacity = 0.018 }: WarmGrainProps) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[9999]"
      style={{
        opacity,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0.3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        backgroundRepeat: "repeat",
        backgroundSize: "192px 192px",
        mixBlendMode: "multiply",
      }}
    />
  );
}

interface CustomCursorProps {
  variant?: "dot" | "crosshair";
  color?: string;
}

export function CustomCursor({ variant = "dot", color = "rgba(255,255,255,0.8)" }: CustomCursorProps) {
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const springX = useSpring(x, { stiffness: 350, damping: 22, mass: 0.25 });
  const springY = useSpring(y, { stiffness: 350, damping: 22, mass: 0.25 });
  const [hovering, setHovering] = useState(false);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const move = (e: MouseEvent) => { x.set(e.clientX); y.set(e.clientY); };
    const over = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      setHovering(!!t.closest("a,button,[role='button']"));
    };
    window.addEventListener("mousemove", move, { passive: true });
    window.addEventListener("mouseover", over, { passive: true });
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseover", over);
    };
  }, [x, y]);

  if (prefersReducedMotion()) return null;

  if (variant === "crosshair") {
    return (
      <m.div
        aria-hidden="true"
        style={{
          position: "fixed",
          left: springX,
          top: springY,
          zIndex: 99999,
          pointerEvents: "none",
          translateX: "-50%",
          translateY: "-50%",
        }}
      >
        <m.div
          animate={{ scale: hovering ? 1.4 : 1, opacity: hovering ? 0.7 : 0.5 }}
          transition={{ duration: 0.15 }}
          style={{ position: "relative", width: 24, height: 24 }}
        >
          <div style={{ position: "absolute", top: "50%", left: 0, right: 0, height: 1, background: color, transform: "translateY(-50%)" }} />
          <div style={{ position: "absolute", left: "50%", top: 0, bottom: 0, width: 1, background: color, transform: "translateX(-50%)" }} />
          <div style={{ position: "absolute", top: "50%", left: "50%", width: 4, height: 4, background: color, borderRadius: "50%", transform: "translate(-50%,-50%)" }} />
        </m.div>
      </m.div>
    );
  }

  return (
    <m.div
      aria-hidden="true"
      style={{
        position: "fixed",
        left: springX,
        top: springY,
        zIndex: 99999,
        pointerEvents: "none",
        translateX: "-50%",
        translateY: "-50%",
      }}
    >
      <m.div
        animate={{ scale: hovering ? 2.2 : 1, opacity: hovering ? 0.5 : 0.7 }}
        transition={{ duration: 0.2 }}
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: color,
          boxShadow: `0 0 12px ${color}`,
        }}
      />
    </m.div>
  );
}

interface ScrollCounterProps {
  target: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function ScrollCounter({ target, prefix = "", suffix = "", duration = 2, className = "", style }: ScrollCounterProps) {
  const { ref, visible } = useInViewOnce(0.3);
  const [display, setDisplay] = useState(0);
  const reduced = prefersReducedMotion();

  useEffect(() => {
    if (!visible) return;
    if (reduced) { setDisplay(target); return; }
    const start = Date.now();
    const tick = () => {
      const elapsed = (Date.now() - start) / 1000;
      const t = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(ease * target));
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [visible, target, duration, reduced]);

  return (
    <span ref={ref} className={className} style={style}>
      {prefix}{display.toLocaleString()}{suffix}
    </span>
  );
}

interface LiveIndicatorProps {
  label?: string;
  color?: string;
  className?: string;
  showTimestamp?: boolean;
}

export function LiveIndicator({ label = "LIVE", color = "#22c55e", className = "", showTimestamp = true }: LiveIndicatorProps) {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <span
        style={{
          display: "inline-block",
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: color,
          boxShadow: `0 0 8px ${color}`,
          animation: prefersReducedMotion() ? "none" : "live-pulse 2s ease-in-out infinite",
        }}
      />
      <span style={{ fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.1em", color, fontFamily: "monospace" }}>{label}</span>
      {showTimestamp && (
        <span style={{ fontSize: "0.625rem", color: "rgba(255,255,255,0.25)", fontFamily: "monospace" }}>
          {time.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
        </span>
      )}
      <style>{`
        @keyframes live-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.85); }
        }
      `}</style>
    </span>
  );
}

interface ThreatTickerProps {
  items: string[];
  speed?: number;
  color?: string;
  bgColor?: string;
  label?: string;
}

export function ThreatTicker({ items, speed = 40, color = "rgba(255,255,255,0.6)", bgColor = "rgba(0,0,0,0.4)", label = "THREAT FEED" }: ThreatTickerProps) {
  const reduced = prefersReducedMotion();
  const fullItems = [...items, ...items];
  const totalWidth = fullItems.length * 320;
  const duration = totalWidth / speed;

  return (
    <div style={{ background: bgColor, borderTop: "1px solid rgba(255,255,255,0.06)", borderBottom: "1px solid rgba(255,255,255,0.06)", overflow: "hidden", position: "relative" }}>
      <div style={{ display: "flex", alignItems: "center", height: 36 }}>
        <div style={{
          flexShrink: 0,
          padding: "0 1rem",
          fontSize: "0.625rem",
          fontWeight: 700,
          letterSpacing: "0.16em",
          color: "rgba(239,68,68,0.9)",
          fontFamily: "monospace",
          whiteSpace: "nowrap",
          borderRight: "1px solid rgba(255,255,255,0.06)",
          height: "100%",
          display: "flex",
          alignItems: "center",
          background: "rgba(239,68,68,0.06)",
        }}>
          ⚠ {label}
        </div>
        <div style={{ flex: 1, overflow: "hidden" }}>
          <m.div
            style={{ display: "flex", gap: 0, willChange: "transform" }}
            animate={reduced ? {} : { x: [0, -totalWidth / 2] }}
            transition={{ duration, repeat: Infinity, ease: "linear", repeatType: "loop" }}
          >
            {fullItems.map((item, i) => (
              <div key={i} style={{
                flexShrink: 0,
                padding: "0 2rem",
                fontSize: "0.6875rem",
                color,
                fontFamily: "monospace",
                whiteSpace: "nowrap",
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
              }}>
                <span style={{ color: "rgba(239,68,68,0.5)", fontSize: "0.5rem" }}>◆</span>
                {item}
              </div>
            ))}
          </m.div>
        </div>
      </div>
    </div>
  );
}

interface SignalTickerProps {
  items: Array<{ label: string; value: string; delta?: string; color?: string }>;
  speed?: number;
  bgColor?: string;
}

export function SignalTicker({ items, speed = 35, bgColor = "rgba(0,0,0,0.5)" }: SignalTickerProps) {
  const reduced = prefersReducedMotion();
  const fullItems = [...items, ...items];
  const totalWidth = fullItems.length * 280;
  const duration = totalWidth / speed;

  return (
    <div style={{ background: bgColor, borderBottom: "1px solid rgba(255,255,255,0.04)", overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", height: 32 }}>
        <div style={{ flex: 1, overflow: "hidden" }}>
          <m.div
            style={{ display: "flex", gap: 0, willChange: "transform" }}
            animate={reduced ? {} : { x: [0, -totalWidth / 2] }}
            transition={{ duration, repeat: Infinity, ease: "linear", repeatType: "loop" }}
          >
            {fullItems.map((item, i) => (
              <div key={i} style={{
                flexShrink: 0,
                padding: "0 1.5rem",
                fontSize: "0.6875rem",
                fontFamily: "monospace",
                whiteSpace: "nowrap",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                borderRight: "1px solid rgba(255,255,255,0.04)",
              }}>
                <span style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.625rem" }}>{item.label}</span>
                <span style={{ color: item.color ?? "rgba(255,255,255,0.7)", fontWeight: 600 }}>{item.value}</span>
                {item.delta && (
                  <span style={{ color: item.delta.startsWith("+") ? "#22c55e" : "#ef4444", fontSize: "0.625rem" }}>{item.delta}</span>
                )}
              </div>
            ))}
          </m.div>
        </div>
      </div>
    </div>
  );
}

interface CinematicRevealProps {
  children: ReactNode;
  delay?: number;
  className?: string;
  style?: React.CSSProperties;
  direction?: "up" | "down" | "left" | "right";
}

export function CinematicReveal({ children, delay = 0, className = "", style, direction = "up" }: CinematicRevealProps) {
  const { ref, visible } = useInViewOnce();
  const reduced = prefersReducedMotion();

  const initial = reduced ? { opacity: 0 } : {
    opacity: 0,
    y: direction === "up" ? 32 : direction === "down" ? -32 : 0,
    x: direction === "left" ? 32 : direction === "right" ? -32 : 0,
  };
  const animate = visible ? { opacity: 1, y: 0, x: 0 } : initial;

  return (
    <m.div
      ref={ref}
      className={className}
      style={style}
      initial={initial}
      animate={animate}
      transition={{ duration: 0.72, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </m.div>
  );
}

interface EcosystemPulseItemProps {
  name: string;
  status: "operational" | "degraded" | "down" | "unknown";
  description?: string;
  color: string;
  lastChecked?: string;
}

export function EcosystemPulseItem({ name, status, description, color, lastChecked }: EcosystemPulseItemProps) {
  const statusColor = status === "operational" ? "#22c55e" : status === "degraded" ? "#f59e0b" : status === "down" ? "#ef4444" : "#6b7280";
  const statusLabel = status === "operational" ? "OPERATIONAL" : status === "degraded" ? "DEGRADED" : status === "down" ? "DOWN" : "UNKNOWN";

  return (
    <div style={{
      padding: "1rem 1.25rem",
      borderRadius: "0.75rem",
      background: `${color}06`,
      border: `1px solid ${color}18`,
      display: "flex",
      flexDirection: "column",
      gap: "0.5rem",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "#f5f5f5" }}>{name}</span>
        <span style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
          <span style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: statusColor,
            animation: status === "operational" ? "live-pulse 2s ease-in-out infinite" : "none",
          }} />
          <span style={{ fontSize: "0.5625rem", fontWeight: 700, letterSpacing: "0.1em", color: statusColor, fontFamily: "monospace" }}>{statusLabel}</span>
        </span>
      </div>
      {description && <p style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.35)", lineHeight: 1.5 }}>{description}</p>}
      {lastChecked && <p style={{ fontSize: "0.5625rem", color: "rgba(255,255,255,0.2)", fontFamily: "monospace" }}>checked {lastChecked}</p>}
    </div>
  );
}

interface PageTransitionProps {
  children: ReactNode;
  routeKey: string;
}

export function PageTransition({ children, routeKey }: PageTransitionProps) {
  const reduced = prefersReducedMotion();
  if (reduced) return <>{children}</>;

  return (
    <AnimatePresence mode="wait">
      <m.div
        key={routeKey}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      >
        {children}
      </m.div>
    </AnimatePresence>
  );
}

export function ParallaxLayer({ children, speed = 0.15, className = "", style }: { children: ReactNode; speed?: number; className?: string; style?: React.CSSProperties }) {
  const scrollY = useScrollY();
  const reduced = prefersReducedMotion();
  const offset = reduced ? 0 : scrollY * speed;

  return (
    <m.div
      className={className}
      style={{ ...style, y: offset }}
    >
      {children}
    </m.div>
  );
}
