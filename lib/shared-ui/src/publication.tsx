/**
 * Publication Design System — SZL Platform
 *
 * The single source of truth for the post-2026 SZL aesthetic:
 * Codex / Boss Technology / New Relic restraint. Pure dark, monochrome,
 * one warm accent, massive whitespace, publication-grade typography.
 *
 * Every artifact landing/marketing surface MUST import from this module.
 * No bespoke palettes. No rainbow accents. No video-game feel.
 */

import { type CSSProperties, type ReactNode } from "react";
import { m, AnimatePresence } from "framer-motion";

// ───────── Tokens ─────────────────────────────────────────────────────

export const pubTokens = {
  bg: "#0a0a0a",
  bgPure: "#000000",
  surface: "rgba(255,255,255,0.018)",
  surfaceHover: "rgba(255,255,255,0.04)",
  border: "rgba(255,255,255,0.08)",
  borderStrong: "rgba(255,255,255,0.12)",
  borderActive: "rgba(255,255,255,0.25)",
  text: "#f5f5f5",
  textDim: "#8a8a8a",
  textMuted: "#5e5e5e",
  textGhost: "#3a3a3a",
  accent: "#c9b787",
  accentDim: "rgba(201,183,135,0.55)",
  accentMuted: "rgba(201,183,135,0.04)",
  accentBorder: "rgba(201,183,135,0.30)",
  ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
  mono: "var(--font-mono, ui-monospace, SFMono-Regular, Menlo, monospace)",
} as const;

export const pubEase = pubTokens.ease;

// ───────── Layout helpers ─────────────────────────────────────────────

export function PubPage({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div style={{
      minHeight: "100vh",
      background: pubTokens.bg,
      color: pubTokens.text,
      fontFeatureSettings: '"ss01", "cv11"',
      ...style,
    }}>
      {children}
    </div>
  );
}

export function PubSection({
  children,
  bordered = true,
  padding = "clamp(5rem, 10vw, 8rem) 0",
  style,
}: {
  children: ReactNode;
  bordered?: boolean;
  padding?: string;
  style?: CSSProperties;
}) {
  return (
    <section style={{
      padding,
      borderTop: bordered ? `1px solid ${pubTokens.border}` : undefined,
      ...style,
    }}>
      {children}
    </section>
  );
}

export function PubContainer({ children, max = 1080, style }: { children: ReactNode; max?: number; style?: CSSProperties }) {
  return (
    <div style={{ maxWidth: `${max}px`, margin: "0 auto", padding: "0 2rem", ...style }}>
      {children}
    </div>
  );
}

// ───────── Typography ────────────────────────────────────────────────

export function PubLabel({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <p style={{
      fontSize: "0.625rem",
      fontFamily: pubTokens.mono,
      fontWeight: 500,
      letterSpacing: "0.18em",
      textTransform: "uppercase",
      color: pubTokens.textMuted,
      margin: "0 0 1.5rem",
      ...style,
    }}>
      {children}
    </p>
  );
}

export function PubH1({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <h1 style={{
      fontSize: "clamp(3rem, 7vw, 5.5rem)",
      fontWeight: 500,
      letterSpacing: "-0.045em",
      lineHeight: 0.98,
      color: pubTokens.text,
      margin: 0,
      ...style,
    }}>
      {children}
    </h1>
  );
}

export function PubH2({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <h2 style={{
      fontSize: "clamp(1.875rem, 3.5vw, 2.75rem)",
      fontWeight: 500,
      letterSpacing: "-0.035em",
      color: pubTokens.text,
      lineHeight: 1.1,
      margin: 0,
      ...style,
    }}>
      {children}
    </h2>
  );
}

export function PubH3({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <h3 style={{
      fontSize: "1.25rem",
      fontWeight: 500,
      letterSpacing: "-0.015em",
      color: pubTokens.text,
      margin: 0,
      ...style,
    }}>
      {children}
    </h3>
  );
}

export function PubBody({ children, dim = false, style }: { children: ReactNode; dim?: boolean; style?: CSSProperties }) {
  return (
    <p style={{
      fontSize: "1rem",
      lineHeight: 1.65,
      color: dim ? pubTokens.textDim : pubTokens.text,
      letterSpacing: "-0.005em",
      margin: 0,
      ...style,
    }}>
      {children}
    </p>
  );
}

export function PubAccent({ children }: { children: ReactNode }) {
  return (
    <span style={{ fontStyle: "italic", fontWeight: 400, color: pubTokens.accent }}>
      {children}
    </span>
  );
}

// ───────── Buttons ───────────────────────────────────────────────────

interface PubButtonProps {
  href?: string;
  onClick?: () => void;
  children: ReactNode;
  as?: "a" | "button";
  external?: boolean;
}

export function PubPrimary({ href, onClick, children, as = "a", external }: PubButtonProps) {
  const baseStyle: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.5rem",
    padding: "0.75rem 1.5rem",
    background: "#f5f5f5",
    color: "#0a0a0a",
    borderRadius: "999px",
    fontSize: "0.8125rem",
    fontWeight: 500,
    letterSpacing: "-0.005em",
    textDecoration: "none",
    border: "none",
    cursor: "pointer",
    transition: "background 0.2s, transform 0.15s",
  };
  const onEnter = (e: React.MouseEvent) => { (e.currentTarget as HTMLElement).style.background = "#fff"; };
  const onLeave = (e: React.MouseEvent) => { (e.currentTarget as HTMLElement).style.background = "#f5f5f5"; };

  if (as === "button" || !href) {
    return <button style={baseStyle} onClick={onClick} onMouseEnter={onEnter} onMouseLeave={onLeave}>{children}</button>;
  }
  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noreferrer" : undefined}
      onClick={onClick}
      style={baseStyle}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
    >
      {children}
    </a>
  );
}

export function PubSecondary({ href, onClick, children, as = "a", external }: PubButtonProps) {
  const baseStyle: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.5rem",
    padding: "0.75rem 1.5rem",
    background: "transparent",
    color: pubTokens.text,
    border: `1px solid ${pubTokens.borderStrong}`,
    borderRadius: "999px",
    fontSize: "0.8125rem",
    fontWeight: 500,
    letterSpacing: "-0.005em",
    textDecoration: "none",
    cursor: "pointer",
    transition: "border-color 0.2s, background 0.2s",
  };
  const onEnter = (e: React.MouseEvent) => {
    (e.currentTarget as HTMLElement).style.borderColor = pubTokens.borderActive;
    (e.currentTarget as HTMLElement).style.background = pubTokens.surfaceHover;
  };
  const onLeave = (e: React.MouseEvent) => {
    (e.currentTarget as HTMLElement).style.borderColor = pubTokens.borderStrong;
    (e.currentTarget as HTMLElement).style.background = "transparent";
  };

  if (as === "button" || !href) {
    return <button style={baseStyle} onClick={onClick} onMouseEnter={onEnter} onMouseLeave={onLeave}>{children}</button>;
  }
  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noreferrer" : undefined}
      onClick={onClick}
      style={baseStyle}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
    >
      {children}
    </a>
  );
}

// ───────── Motion ────────────────────────────────────────────────────

export function PubFadeIn({
  children,
  delay = 0,
  className,
  style,
  amount = 0.15,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  style?: CSSProperties;
  amount?: number;
}) {
  return (
    <m.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount }}
      transition={{ duration: 0.7, delay, ease: pubTokens.ease }}
      className={className}
      style={style}
    >
      {children}
    </m.div>
  );
}

// ───────── Background ───────────────────────────────────────────────

export function PubHeroBackdrop({ accent = true }: { accent?: boolean }) {
  return (
    <div aria-hidden="true" style={{
      position: "absolute",
      inset: 0,
      overflow: "hidden",
      pointerEvents: "none",
    }}>
      {accent && (
        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.4, ease: "easeOut" }}
          style={{
            position: "absolute",
            top: "30%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "1200px",
            height: "800px",
            background: "radial-gradient(ellipse at center, rgba(201,183,135,0.045) 0%, transparent 55%)",
            filter: "blur(20px)",
          }}
        />
      )}
      <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, opacity: 0.35 }}>
        <defs>
          <pattern id="pub-grid" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M 60 0 L 0 0 0 60" fill="none" stroke="rgba(255,255,255,0.025)" strokeWidth="0.5" />
          </pattern>
          <radialGradient id="pub-grid-fade" cx="0.5" cy="0.45" r="0.6">
            <stop offset="0%" stopColor="white" stopOpacity="1" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </radialGradient>
          <mask id="pub-grid-mask"><rect width="100%" height="100%" fill="url(#pub-grid-fade)" /></mask>
        </defs>
        <rect width="100%" height="100%" fill="url(#pub-grid)" mask="url(#pub-grid-mask)" />
      </svg>
    </div>
  );
}

// ───────── Card / Grid primitives ───────────────────────────────────

export function PubCard({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div style={{
      padding: "1.75rem",
      borderRadius: "10px",
      border: `1px solid ${pubTokens.border}`,
      background: pubTokens.surface,
      height: "100%",
      ...style,
    }}>
      {children}
    </div>
  );
}

export function PubDividerGrid({
  children,
  cols = 2,
  style,
}: {
  children: ReactNode;
  cols?: number;
  style?: CSSProperties;
}) {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: `repeat(${cols}, 1fr)`,
      gap: "1px",
      background: pubTokens.border,
      border: `1px solid ${pubTokens.border}`,
      borderRadius: "12px",
      overflow: "hidden",
      ...style,
    }}>
      {children}
    </div>
  );
}

export function PubDividerCell({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div style={{ background: pubTokens.bg, padding: "2rem", height: "100%", ...style }}>
      {children}
    </div>
  );
}

// ───────── Re-export AnimatePresence so consumers don't need separate import ────────────────
export { AnimatePresence as PubAnimatePresence };
