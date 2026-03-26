export const colors = {
  background: {
    primary: "hsl(220 20% 4%)",
    secondary: "hsl(220 18% 8%)",
    tertiary: "hsl(220 16% 12%)",
    elevated: "hsl(220 14% 16%)",
    overlay: "hsla(220 20% 4% / 0.8)",
  },
  surface: {
    glass: "hsla(220 20% 20% / 0.1)",
    glassHover: "hsla(220 20% 20% / 0.15)",
    glassBorder: "hsla(220 20% 40% / 0.15)",
    card: "hsla(220 18% 10% / 0.6)",
    cardHover: "hsla(220 18% 12% / 0.7)",
  },
  primary: {
    DEFAULT: "hsl(250 90% 65%)",
    light: "hsl(250 90% 75%)",
    dark: "hsl(250 90% 55%)",
    muted: "hsla(250 90% 65% / 0.15)",
  },
  accent: {
    violet: "hsl(280 80% 65%)",
    cyan: "hsl(190 90% 60%)",
    emerald: "hsl(160 80% 55%)",
    amber: "hsl(40 95% 60%)",
    rose: "hsl(350 80% 60%)",
  },
  text: {
    primary: "hsl(0 0% 98%)",
    secondary: "hsl(0 0% 70%)",
    muted: "hsl(0 0% 50%)",
    inverse: "hsl(220 20% 4%)",
  },
  status: {
    success: "hsl(160 80% 55%)",
    warning: "hsl(40 95% 60%)",
    error: "hsl(350 80% 60%)",
    info: "hsl(210 90% 60%)",
  },
  border: {
    DEFAULT: "hsla(0 0% 100% / 0.08)",
    subtle: "hsla(0 0% 100% / 0.04)",
    strong: "hsla(0 0% 100% / 0.16)",
  },
} as const;

export const typography = {
  fontFamily: {
    display: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
    body: "'Inter', system-ui, -apple-system, sans-serif",
    mono: "'JetBrains Mono', 'Fira Code', monospace",
  },
  fontSize: {
    "display-2xl": ["4.5rem", { lineHeight: "1.1", letterSpacing: "-0.02em", fontWeight: "800" }],
    "display-xl": ["3.75rem", { lineHeight: "1.1", letterSpacing: "-0.02em", fontWeight: "700" }],
    "display-lg": ["3rem", { lineHeight: "1.2", letterSpacing: "-0.01em", fontWeight: "700" }],
    "display-md": ["2.25rem", { lineHeight: "1.2", letterSpacing: "-0.01em", fontWeight: "600" }],
    "display-sm": ["1.875rem", { lineHeight: "1.3", fontWeight: "600" }],
    "heading-lg": ["1.5rem", { lineHeight: "1.3", fontWeight: "600" }],
    "heading-md": ["1.25rem", { lineHeight: "1.4", fontWeight: "600" }],
    "heading-sm": ["1.125rem", { lineHeight: "1.4", fontWeight: "600" }],
    "body-lg": ["1.125rem", { lineHeight: "1.6" }],
    "body-md": ["1rem", { lineHeight: "1.6" }],
    "body-sm": ["0.875rem", { lineHeight: "1.5" }],
    "caption": ["0.75rem", { lineHeight: "1.5", letterSpacing: "0.02em" }],
  },
} as const;

export const spacing = {
  page: {
    x: "clamp(1rem, 5vw, 6rem)",
    y: "clamp(3rem, 8vh, 8rem)",
  },
  section: {
    gap: "clamp(2rem, 4vw, 4rem)",
  },
  card: {
    padding: "clamp(1.25rem, 2vw, 2rem)",
    gap: "1rem",
  },
} as const;

export const effects = {
  glassmorphism: {
    background: "hsla(220 20% 20% / 0.1)",
    backdropFilter: "blur(20px) saturate(1.5)",
    border: "1px solid hsla(220 20% 40% / 0.15)",
  },
  glassmorphismStrong: {
    background: "hsla(220 20% 15% / 0.3)",
    backdropFilter: "blur(40px) saturate(1.8)",
    border: "1px solid hsla(220 20% 40% / 0.25)",
  },
  glow: {
    primary: "0 0 40px hsla(250 90% 65% / 0.3)",
    accent: "0 0 40px hsla(280 80% 65% / 0.3)",
    success: "0 0 30px hsla(160 80% 55% / 0.2)",
  },
  shadow: {
    sm: "0 1px 2px hsla(0 0% 0% / 0.3)",
    md: "0 4px 12px hsla(0 0% 0% / 0.4)",
    lg: "0 8px 32px hsla(0 0% 0% / 0.5)",
    xl: "0 16px 64px hsla(0 0% 0% / 0.6)",
  },
  gradient: {
    primary: "linear-gradient(135deg, hsl(250 90% 65%), hsl(280 80% 65%))",
    subtle: "linear-gradient(135deg, hsla(250 90% 65% / 0.1), hsla(280 80% 65% / 0.1))",
    text: "linear-gradient(135deg, hsl(250 90% 75%), hsl(280 80% 75%), hsl(190 90% 70%))",
    meshDark: "radial-gradient(ellipse at 20% 50%, hsla(250 90% 65% / 0.08) 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, hsla(280 80% 65% / 0.06) 0%, transparent 50%), radial-gradient(ellipse at 50% 80%, hsla(190 90% 60% / 0.04) 0%, transparent 50%)",
  },
  borderRadius: {
    sm: "0.375rem",
    md: "0.75rem",
    lg: "1rem",
    xl: "1.5rem",
    full: "9999px",
  },
} as const;

export const motion = {
  duration: {
    instant: "0.1s",
    fast: "0.2s",
    normal: "0.3s",
    slow: "0.4s",
    slower: "0.6s",
  },
  easing: {
    default: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
    snappy: "cubic-bezier(0.16, 1, 0.3, 1)",
    smooth: "cubic-bezier(0.22, 1, 0.36, 1)",
    bounce: "cubic-bezier(0.34, 1.56, 0.64, 1)",
  },
} as const;

export const breakpoints = {
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
  "2xl": "1536px",
} as const;
