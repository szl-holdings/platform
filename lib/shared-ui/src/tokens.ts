export const colors = {
  background: {
    primary: "hsl(216 14% 5%)",
    secondary: "hsl(216 12% 8%)",
    tertiary: "hsl(216 10% 11%)",
    elevated: "hsl(216 10% 14%)",
    overlay: "hsla(216 14% 3% / 0.85)",
  },
  surface: {
    base: "hsl(216 10% 9%)",
    raised: "hsl(216 10% 12%)",
    overlay: "hsl(216 10% 15%)",
    hover: "hsl(216 10% 17%)",
    active: "hsl(216 10% 19%)",
    border: "hsla(0 0% 100% / 0.07)",
    borderRaised: "hsla(0 0% 100% / 0.10)",
    card: "hsl(216 10% 9%)",
    cardHover: "hsl(216 10% 12%)",
  },
  _legacyGlass: {
    glass: "hsla(220 20% 20% / 0.1)",
    glassHover: "hsla(220 20% 20% / 0.15)",
    glassBorder: "hsla(220 20% 40% / 0.15)",
  },
  primary: {
    DEFAULT: "hsl(220 90% 62%)",
    light: "hsl(220 90% 72%)",
    dark: "hsl(220 90% 52%)",
    muted: "hsla(220 90% 62% / 0.12)",
    subtle: "hsla(220 90% 62% / 0.06)",
  },
  text: {
    primary: "hsl(210 20% 97%)",
    secondary: "hsl(210 10% 65%)",
    tertiary: "hsl(210 8% 45%)",
    muted: "hsl(210 6% 36%)",
    placeholder: "hsl(210 6% 32%)",
    inverse: "hsl(216 14% 5%)",
    link: "hsl(220 90% 68%)",
  },
  status: {
    success: "hsl(152 60% 48%)",
    successMuted: "hsla(152 60% 48% / 0.12)",
    warning: "hsl(38 90% 54%)",
    warningMuted: "hsla(38 90% 54% / 0.12)",
    error: "hsl(4 72% 56%)",
    errorMuted: "hsla(4 72% 56% / 0.12)",
    info: "hsl(210 80% 56%)",
    infoMuted: "hsla(210 80% 56% / 0.12)",
  },
  border: {
    DEFAULT: "hsla(0 0% 100% / 0.08)",
    subtle: "hsla(0 0% 100% / 0.05)",
    strong: "hsla(0 0% 100% / 0.14)",
    focus: "hsl(220 90% 62%)",
  },
  laneAccents: {
    szl: {
      primary: "hsl(220 16% 62%)",
      secondary: "hsl(220 12% 48%)",
      muted: "hsla(220 16% 62% / 0.10)",
    },
    vessels: {
      primary: "hsl(208 72% 44%)",
      secondary: "hsl(196 60% 52%)",
      muted: "hsla(208 72% 44% / 0.10)",
    },
    inca: {
      primary: "hsl(172 56% 42%)",
      secondary: "hsl(186 64% 48%)",
      muted: "hsla(172 56% 42% / 0.10)",
    },
    carlotaJo: {
      primary: "hsl(24 54% 52%)",
      secondary: "hsl(10 48% 48%)",
      muted: "hsla(24 54% 52% / 0.10)",
    },
    stephen: {
      primary: "hsl(264 56% 60%)",
      secondary: "hsl(280 44% 56%)",
      muted: "hsla(264 56% 60% / 0.10)",
    },
    firestorm: {
      primary: "hsl(36 84% 52%)",
      secondary: "hsl(22 76% 48%)",
      muted: "hsla(36 84% 52% / 0.10)",
    },
    dreamscape: {
      primary: "hsl(280 52% 58%)",
      secondary: "hsl(300 40% 52%)",
      muted: "hsla(280 52% 58% / 0.10)",
    },
    terra: {
      primary: "hsl(26 48% 44%)",
      secondary: "hsl(14 40% 40%)",
      muted: "hsla(26 48% 44% / 0.10)",
    },
    lyte: {
      primary: "hsl(192 80% 46%)",
      secondary: "hsl(180 60% 44%)",
      muted: "hsla(192 80% 46% / 0.10)",
    },
    msp: {
      primary: "hsl(218 72% 52%)",
      secondary: "hsl(204 60% 48%)",
      muted: "hsla(218 72% 52% / 0.10)",
    },
    alloy: {
      primary: "hsl(232 64% 58%)",
      secondary: "hsl(248 52% 62%)",
      muted: "hsla(232 64% 58% / 0.10)",
    },
  },
} as const;

export const typography = {
  fontFamily: {
    display: "'Geist', 'Inter', system-ui, -apple-system, sans-serif",
    body: "'Inter', system-ui, -apple-system, sans-serif",
    mono: "'Geist Mono', 'JetBrains Mono', 'Fira Code', monospace",
  },
  fontSize: {
    "display-2xl": ["4.5rem", { lineHeight: "1.05", letterSpacing: "-0.03em", fontWeight: "700" }],
    "display-xl": ["3.75rem", { lineHeight: "1.06", letterSpacing: "-0.03em", fontWeight: "700" }],
    "display-lg": ["3rem", { lineHeight: "1.08", letterSpacing: "-0.025em", fontWeight: "600" }],
    "display-md": ["2.25rem", { lineHeight: "1.12", letterSpacing: "-0.02em", fontWeight: "600" }],
    "display-sm": ["1.875rem", { lineHeight: "1.15", letterSpacing: "-0.015em", fontWeight: "600" }],
    "heading-lg": ["1.5rem", { lineHeight: "1.25", letterSpacing: "-0.01em", fontWeight: "600" }],
    "heading-md": ["1.25rem", { lineHeight: "1.3", letterSpacing: "-0.008em", fontWeight: "600" }],
    "heading-sm": ["1.0625rem", { lineHeight: "1.35", letterSpacing: "-0.005em", fontWeight: "600" }],
    "subheading": ["0.9375rem", { lineHeight: "1.4", letterSpacing: "-0.003em", fontWeight: "500" }],
    "body-lg": ["1rem", { lineHeight: "1.65", fontWeight: "400" }],
    "body-md": ["0.9375rem", { lineHeight: "1.6", fontWeight: "400" }],
    "body-sm": ["0.875rem", { lineHeight: "1.55", fontWeight: "400" }],
    "caption": ["0.8125rem", { lineHeight: "1.5", letterSpacing: "0.003em", fontWeight: "400" }],
    "label": ["0.75rem", { lineHeight: "1.4", letterSpacing: "0.04em", fontWeight: "500" }],
    "eyebrow": ["0.6875rem", { lineHeight: "1.4", letterSpacing: "0.08em", fontWeight: "600", textTransform: "uppercase" }],
    "mono-sm": ["0.8125rem", { lineHeight: "1.5", letterSpacing: "0.01em", fontWeight: "400" }],
    "mono-xs": ["0.75rem", { lineHeight: "1.5", letterSpacing: "0.01em", fontWeight: "400" }],
  },
} as const;

export const spacing = {
  page: {
    x: "clamp(1.25rem, 4vw, 5rem)",
    y: "clamp(2rem, 5vh, 5rem)",
  },
  section: {
    gap: "clamp(1.5rem, 3vw, 3rem)",
  },
  card: {
    padding: "clamp(1.25rem, 2vw, 1.75rem)",
    paddingCompact: "1rem",
    paddingRelaxed: "2rem",
    gap: "1rem",
  },
  layout: {
    sidebarWidth: "256px",
    sidebarWidthCollapsed: "56px",
    headerHeight: "56px",
    maxContent: "1440px",
  },
  grid: {
    gapSm: "0.75rem",
    gap: "1rem",
    gapLg: "1.5rem",
    gapXl: "2rem",
  },
} as const;

export const effects = {
  surface: {
    base: {
      background: "hsl(216 10% 9%)",
      border: "1px solid hsla(0 0% 100% / 0.07)",
    },
    raised: {
      background: "hsl(216 10% 12%)",
      border: "1px solid hsla(0 0% 100% / 0.09)",
      boxShadow: "0 1px 3px hsla(0 0% 0% / 0.24), 0 1px 2px hsla(0 0% 0% / 0.16)",
    },
    overlay: {
      background: "hsl(216 10% 15%)",
      border: "1px solid hsla(0 0% 100% / 0.11)",
      boxShadow: "0 4px 12px hsla(0 0% 0% / 0.30), 0 2px 4px hsla(0 0% 0% / 0.20)",
    },
    interactive: {
      background: "hsl(216 10% 9%)",
      border: "1px solid hsla(0 0% 100% / 0.07)",
      transition: "background 0.15s ease, border-color 0.15s ease",
    },
    interactiveHover: {
      background: "hsl(216 10% 12%)",
      border: "1px solid hsla(0 0% 100% / 0.11)",
    },
  },
  _legacy: {
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
  },
  shadow: {
    xs: "0 1px 2px hsla(0 0% 0% / 0.20)",
    sm: "0 1px 3px hsla(0 0% 0% / 0.28), 0 1px 2px hsla(0 0% 0% / 0.18)",
    md: "0 4px 8px hsla(0 0% 0% / 0.28), 0 2px 4px hsla(0 0% 0% / 0.18)",
    lg: "0 8px 24px hsla(0 0% 0% / 0.32), 0 4px 8px hsla(0 0% 0% / 0.20)",
    xl: "0 16px 48px hsla(0 0% 0% / 0.36), 0 8px 16px hsla(0 0% 0% / 0.22)",
    "2xl": "0 24px 64px hsla(0 0% 0% / 0.40), 0 12px 24px hsla(0 0% 0% / 0.24)",
    inset: "inset 0 1px 0 hsla(0 0% 100% / 0.05)",
  },
  gradient: {
    primary: "linear-gradient(135deg, hsl(220 90% 62%), hsl(248 72% 64%))",
    subtle: "linear-gradient(135deg, hsla(220 90% 62% / 0.08), hsla(248 72% 64% / 0.08))",
    text: "linear-gradient(135deg, hsl(220 90% 72%), hsl(248 72% 74%))",
    surface: "linear-gradient(180deg, hsla(0 0% 100% / 0.03) 0%, hsla(0 0% 100% / 0.00) 100%)",
    meshDark: "radial-gradient(ellipse at 25% 40%, hsla(220 90% 62% / 0.05) 0%, transparent 55%), radial-gradient(ellipse at 75% 20%, hsla(248 72% 64% / 0.04) 0%, transparent 55%), radial-gradient(ellipse at 50% 85%, hsla(192 80% 46% / 0.03) 0%, transparent 55%)",
    topHighlight: "linear-gradient(180deg, hsla(0 0% 100% / 0.06) 0%, transparent 1px)",
  },
  borderRadius: {
    xs: "0.25rem",
    sm: "0.375rem",
    md: "0.5rem",
    lg: "0.75rem",
    xl: "1rem",
    "2xl": "1.5rem",
    full: "9999px",
  },
} as const;

export const motion = {
  duration: {
    instant: "80ms",
    fast: "150ms",
    normal: "220ms",
    slow: "320ms",
    slower: "480ms",
    enter: "250ms",
    exit: "180ms",
  },
  easing: {
    default: "cubic-bezier(0.25, 0.1, 0.25, 1)",
    enter: "cubic-bezier(0.0, 0.0, 0.2, 1)",
    exit: "cubic-bezier(0.4, 0.0, 1, 1)",
    snappy: "cubic-bezier(0.16, 1, 0.3, 1)",
    smooth: "cubic-bezier(0.22, 1, 0.36, 1)",
    spring: "cubic-bezier(0.34, 1.20, 0.64, 1)",
  },
  reduced: {
    duration: "0ms",
    easing: "linear",
  },
} as const;

export const breakpoints = {
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
  "2xl": "1536px",
} as const;

export const zIndex = {
  base: 0,
  raised: 10,
  dropdown: 100,
  sticky: 200,
  overlay: 300,
  modal: 400,
  popover: 500,
  toast: 600,
  tooltip: 700,
} as const;

export const iconography = {
  guidance: {
    family: "Lucide",
    strokeWidth: 1.5,
    sizes: {
      xs: "0.875rem",
      sm: "1rem",
      md: "1.25rem",
      lg: "1.5rem",
      xl: "2rem",
    },
    interactive: {
      strokeWidth: 1.5,
      opacity: 0.7,
      hoverOpacity: 1,
    },
    decorative: {
      strokeWidth: 1.25,
      opacity: 0.5,
    },
    status: {
      strokeWidth: 2,
      opacity: 1,
    },
  },
} as const;
