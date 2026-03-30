export const colors = {
  background: {
    primary: "hsl(220 20% 4%)",
    secondary: "hsl(220 18% 7%)",
    tertiary: "hsl(220 16% 10%)",
    elevated: "hsl(220 14% 14%)",
    overlay: "hsla(220 20% 4% / 0.85)",
  },
  surface: {
    base: "hsla(220 15% 12% / 0.6)",
    baseHover: "hsla(220 15% 14% / 0.7)",
    border: "hsla(0 0% 100% / 0.07)",
    borderHover: "hsla(0 0% 100% / 0.12)",
    glass: "hsla(220 20% 20% / 0.08)",
    glassHover: "hsla(220 20% 20% / 0.12)",
    glassBorder: "hsla(220 20% 40% / 0.12)",
    card: "hsla(220 18% 10% / 0.55)",
    cardHover: "hsla(220 18% 12% / 0.65)",
    // Legacy aliases kept for compatibility
    raised: "hsla(220 15% 14% / 0.7)",
    overlay: "hsla(220 20% 4% / 0.85)",
    hover: "hsla(220 15% 14% / 0.7)",
    active: "hsla(220 15% 16% / 0.75)",
    borderRaised: "hsla(0 0% 100% / 0.10)",
  },

  neutral: {
    graphite: "hsl(220 8% 18%)",
    charcoal: "hsl(220 10% 12%)",
    ink: "hsl(220 15% 6%)",
    softBlack: "hsl(220 18% 4%)",
    warmOffWhite: "hsl(40 15% 96%)",
    stone: "hsl(35 8% 72%)",
    mistGray: "hsl(220 8% 60%)",
    mutedSilver: "hsl(220 6% 48%)",
  },

  text: {
    primary: "hsl(0 0% 96%)",
    secondary: "hsl(220 8% 65%)",
    muted: "hsl(220 8% 42%)",
    subtle: "hsl(220 8% 32%)",
    inverse: "hsl(220 20% 4%)",
    warmWhite: "hsl(40 15% 96%)",
    // Legacy aliases
    tertiary: "hsl(220 8% 42%)",
    placeholder: "hsl(220 8% 32%)",
    link: "hsl(220 90% 68%)",
  },

  semantic: {
    success: "hsl(152 55% 42%)",
    successLight: "hsl(152 55% 55%)",
    warning: "hsl(38 85% 52%)",
    warningLight: "hsl(38 85% 65%)",
    critical: "hsl(4 72% 50%)",
    criticalLight: "hsl(4 72% 62%)",
    info: "hsl(210 70% 52%)",
    infoLight: "hsl(210 70% 65%)",
    neutral: "hsl(220 8% 52%)",
    // Legacy aliases
    error: "hsl(4 72% 50%)",
    errorMuted: "hsla(4 72% 50% / 0.12)",
    successMuted: "hsla(152 55% 42% / 0.12)",
    warningMuted: "hsla(38 85% 52% / 0.12)",
    infoMuted: "hsla(210 70% 52% / 0.12)",
  },

  // Brand Bible lane accent colors
  lane: {
    szl: {
      primary: "hsl(215 45% 40%)",
      primaryLight: "hsl(215 45% 52%)",
      primaryDark: "hsl(215 45% 30%)",
      accent: "hsl(215 30% 58%)",
      muted: "hsla(215 45% 40% / 0.12)",
      surface: "hsla(215 30% 12% / 0.55)",
    },
    vessels: {
      primary: "hsl(205 70% 38%)",
      primaryLight: "hsl(205 70% 52%)",
      primaryDark: "hsl(205 70% 28%)",
      accent: "hsl(188 55% 45%)",
      muted: "hsla(205 70% 38% / 0.12)",
      surface: "hsla(210 40% 10% / 0.55)",
    },
    inca: {
      primary: "hsl(245 50% 45%)",
      primaryLight: "hsl(245 50% 58%)",
      primaryDark: "hsl(245 50% 34%)",
      accent: "hsl(260 35% 55%)",
      muted: "hsla(245 50% 45% / 0.12)",
      surface: "hsla(245 30% 10% / 0.55)",
    },
    carlotaJo: {
      primary: "hsl(32 40% 48%)",
      primaryLight: "hsl(32 40% 62%)",
      primaryDark: "hsl(32 40% 36%)",
      accent: "hsl(35 28% 55%)",
      cream: "hsl(40 28% 88%)",
      taupe: "hsl(30 15% 65%)",
      muted: "hsla(32 40% 48% / 0.12)",
      surface: "hsla(30 15% 8% / 0.6)",
    },
    stephen: {
      primary: "hsl(220 35% 50%)",
      primaryLight: "hsl(220 35% 64%)",
      primaryDark: "hsl(220 35% 38%)",
      accent: "hsl(38 55% 52%)",
      muted: "hsla(220 35% 50% / 0.12)",
      surface: "hsla(220 20% 10% / 0.55)",
    },
  },

  // Legacy laneAccents kept for backward compatibility with existing components
  laneAccents: {
    szl: {
      primary: "hsl(215 45% 40%)",
      secondary: "hsl(215 30% 58%)",
      muted: "hsla(215 45% 40% / 0.10)",
    },
    vessels: {
      primary: "hsl(205 70% 38%)",
      secondary: "hsl(188 55% 45%)",
      muted: "hsla(205 70% 38% / 0.10)",
    },
    inca: {
      primary: "hsl(245 50% 45%)",
      secondary: "hsl(260 35% 55%)",
      muted: "hsla(245 50% 45% / 0.10)",
    },
    carlotaJo: {
      primary: "hsl(32 40% 48%)",
      secondary: "hsl(35 28% 55%)",
      muted: "hsla(32 40% 48% / 0.10)",
    },
    stephen: {
      primary: "hsl(220 35% 50%)",
      secondary: "hsl(38 55% 52%)",
      muted: "hsla(220 35% 50% / 0.10)",
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

  border: {
    DEFAULT: "hsla(0 0% 100% / 0.07)",
    subtle: "hsla(0 0% 100% / 0.04)",
    strong: "hsla(0 0% 100% / 0.14)",
    warm: "hsla(40 20% 80% / 0.10)",
    focus: "hsl(220 90% 62%)",
  },

  // Legacy primary kept for backward compatibility
  primary: {
    DEFAULT: "hsl(220 90% 62%)",
    light: "hsl(220 90% 72%)",
    dark: "hsl(220 90% 52%)",
    muted: "hsla(220 90% 62% / 0.12)",
    subtle: "hsla(220 90% 62% / 0.06)",
  },
} as const;

export const typography = {
  fontFamily: {
    display: "'Inter', system-ui, -apple-system, sans-serif",
    body: "'Inter', system-ui, -apple-system, sans-serif",
    serif: "'Georgia', 'Palatino Linotype', serif",
    mono: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
  },

  scale: {
    display: {
      "2xl": { size: "clamp(3rem, 6vw, 4.5rem)", weight: "700", tracking: "-0.025em", leading: "1.05" },
      xl: { size: "clamp(2.5rem, 5vw, 3.75rem)", weight: "700", tracking: "-0.02em", leading: "1.08" },
      lg: { size: "clamp(2rem, 4vw, 3rem)", weight: "600", tracking: "-0.015em", leading: "1.1" },
      md: { size: "clamp(1.75rem, 3vw, 2.25rem)", weight: "600", tracking: "-0.01em", leading: "1.15" },
      sm: { size: "clamp(1.5rem, 2.5vw, 1.875rem)", weight: "600", tracking: "-0.005em", leading: "1.2" },
    },
    heading: {
      lg: { size: "1.5rem", weight: "600", tracking: "-0.005em", leading: "1.3" },
      md: { size: "1.25rem", weight: "600", tracking: "0", leading: "1.4" },
      sm: { size: "1.125rem", weight: "600", tracking: "0", leading: "1.4" },
    },
    eyebrow: { size: "0.6875rem", weight: "500", tracking: "0.12em" },
    subheading: { size: "1rem", weight: "400", tracking: "0", leading: "1.6" },
    body: {
      lg: { size: "1.125rem", weight: "400", leading: "1.65" },
      md: { size: "1rem", weight: "400", leading: "1.6" },
      sm: { size: "0.875rem", weight: "400", leading: "1.55" },
    },
    caption: { size: "0.75rem", weight: "400", tracking: "0.01em", leading: "1.5" },
    label: { size: "0.75rem", weight: "500", tracking: "0.04em" },
    mono: { size: "0.8125rem", weight: "400", leading: "1.5" },
  },

  // Legacy fontSize kept for any Tailwind config that references it
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
    x: "clamp(1.25rem, 5vw, 5rem)",
    y: "clamp(3.5rem, 8vh, 7rem)",
    xMd: "clamp(1.5rem, 6vw, 6rem)",
  },
  section: {
    sm: "clamp(3rem, 6vw, 5rem)",
    md: "clamp(4rem, 8vw, 7rem)",
    lg: "clamp(5rem, 10vw, 9rem)",
    // Legacy alias
    gap: "clamp(1.5rem, 3vw, 3rem)",
  },
  card: {
    padding: "clamp(1.25rem, 2.5vw, 2rem)",
    paddingCompact: "1rem",
    paddingRelaxed: "2rem",
    gap: "1.25rem",
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
    card: {
      background: "hsla(220 15% 12% / 0.5)",
      border: "1px solid hsla(0 0% 100% / 0.07)",
      borderRadius: "0.75rem",
    },
    cardHover: {
      background: "hsla(220 15% 14% / 0.65)",
      border: "1px solid hsla(0 0% 100% / 0.11)",
    },
    glass: {
      background: "hsla(220 15% 18% / 0.06)",
      backdropFilter: "blur(16px)",
      border: "1px solid hsla(0 0% 100% / 0.07)",
    },
    // Legacy named surfaces kept for backward compat
    base: {
      background: "hsla(220 15% 12% / 0.5)",
      border: "1px solid hsla(0 0% 100% / 0.07)",
    },
    raised: {
      background: "hsla(220 15% 14% / 0.7)",
      border: "1px solid hsla(0 0% 100% / 0.09)",
      boxShadow: "0 1px 3px hsla(0 0% 0% / 0.24), 0 1px 2px hsla(0 0% 0% / 0.16)",
    },
    overlay: {
      background: "hsla(220 14% 15% / 0.8)",
      border: "1px solid hsla(0 0% 100% / 0.11)",
      boxShadow: "0 4px 12px hsla(0 0% 0% / 0.30), 0 2px 4px hsla(0 0% 0% / 0.20)",
    },
    interactive: {
      background: "hsla(220 15% 12% / 0.5)",
      border: "1px solid hsla(0 0% 100% / 0.07)",
      transition: "background 0.18s ease, border-color 0.18s ease",
    },
    interactiveHover: {
      background: "hsla(220 15% 14% / 0.65)",
      border: "1px solid hsla(0 0% 100% / 0.11)",
    },
  },
  shadow: {
    xs: "0 1px 3px hsla(0 0% 0% / 0.2)",
    sm: "0 2px 6px hsla(0 0% 0% / 0.28)",
    md: "0 4px 16px hsla(0 0% 0% / 0.35)",
    lg: "0 8px 32px hsla(0 0% 0% / 0.42)",
    xl: "0 16px 56px hsla(0 0% 0% / 0.5)",
    "2xl": "0 24px 64px hsla(0 0% 0% / 0.40), 0 12px 24px hsla(0 0% 0% / 0.24)",
    inset: "inset 0 1px 0 hsla(0 0% 100% / 0.05)",
  },
  borderRadius: {
    xs: "0.25rem",
    sm: "0.375rem",
    md: "0.625rem",
    lg: "0.875rem",
    xl: "1.25rem",
    "2xl": "1.5rem",
    full: "9999px",
  },
  gradient: {
    meshDark: "radial-gradient(ellipse at 25% 35%, hsla(215 45% 40% / 0.05) 0%, transparent 55%), radial-gradient(ellipse at 75% 65%, hsla(220 20% 10% / 0.06) 0%, transparent 55%)",
    primary: "linear-gradient(135deg, hsl(220 90% 62%), hsl(248 72% 64%))",
    subtle: "linear-gradient(135deg, hsla(220 90% 62% / 0.08), hsla(248 72% 64% / 0.08))",
    text: "linear-gradient(135deg, hsl(220 90% 72%), hsl(248 72% 74%))",
    surface: "linear-gradient(180deg, hsla(0 0% 100% / 0.03) 0%, hsla(0 0% 100% / 0.00) 100%)",
    topHighlight: "linear-gradient(180deg, hsla(0 0% 100% / 0.06) 0%, transparent 1px)",
  },
} as const;

export const motion = {
  duration: {
    instant: "100ms",
    fast: "180ms",
    normal: "280ms",
    slow: "420ms",
    slower: "650ms",
    reveal: "800ms",
    // Legacy aliases
    enter: "280ms",
    exit: "180ms",
  },
  easing: {
    default: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
    smooth: "cubic-bezier(0.22, 1, 0.36, 1)",
    sharp: "cubic-bezier(0.16, 1, 0.3, 1)",
    standard: "cubic-bezier(0.4, 0, 0.2, 1)",
    // Legacy aliases
    snappy: "cubic-bezier(0.16, 1, 0.3, 1)",
    enter: "cubic-bezier(0.0, 0.0, 0.2, 1)",
    exit: "cubic-bezier(0.4, 0.0, 1, 1)",
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
