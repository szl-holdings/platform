import type { BrandTokens, BrandSlug } from "./tokens";

const szlHoldings: BrandTokens = {
  slug: "szl-holdings",
  name: "SZL Holdings",
  tagline: "One holding company. Six frontier platforms.",
  description:
    "A venture and operating ecosystem building premium command systems, observability products, and high-trust service brands.",
  colors: {
    primary: "hsl(215 45% 32%)",
    primaryLight: "hsl(215 45% 42%)",
    primaryDark: "hsl(215 45% 24%)",
    accent: "hsl(215 45% 52%)",
    surface: "hsl(215 30% 97%)",
    surfaceHover: "hsl(215 30% 94%)",
    border: "hsl(215 20% 90%)",
    text: {
      primary: "hsl(215 20% 12%)",
      secondary: "hsl(215 10% 40%)",
      muted: "hsl(215 8% 60%)",
    },
    gradient: {
      primary: "linear-gradient(135deg, hsl(215 45% 40%), hsl(215 30% 52%))",
      subtle: "linear-gradient(135deg, hsla(215 45% 40% / 0.08), hsla(215 30% 52% / 0.06))",
      text: "linear-gradient(135deg, hsl(215 45% 62%), hsl(215 30% 72%))",
    },
    semantic: {
      success: "hsl(152 55% 42%)",
      warning: "hsl(38 85% 52%)",
      error: "hsl(4 72% 50%)",
      info: "hsl(210 70% 52%)",
    },
  },
  typography: {
    displayFont: "'Instrument Serif', Georgia, serif",
    bodyFont: "'Inter', system-ui, -apple-system, sans-serif",
    monoFont: "'JetBrains Mono', 'Fira Code', monospace",
    displayWeight: "700",
    headingWeight: "600",
    bodyWeight: "400",
  },
  logo: {
    initials: "SZL",
    shape: "rounded",
    iconType: "Building2",
  },
  motion: {
    duration: "0.65s",
    easing: "cubic-bezier(0.22, 1, 0.36, 1)",
    stagger: 0.08,
  },
  ui: {
    borderRadius: "0.75rem",
    mode: "light",
  },
};

const vessels: BrandTokens = {
  slug: "vessels",
  name: "Vessels Maritime Intelligence",
  tagline: "Total maritime intelligence. Zero blind spots.",
  description:
    "Command-grade maritime intelligence platform for fleet operators, shipping companies, and financial institutions tracking vessel risk and performance.",
  colors: {
    primary: "hsl(205 70% 38%)",
    primaryLight: "hsl(205 70% 50%)",
    primaryDark: "hsl(205 70% 28%)",
    accent: "hsl(188 55% 45%)",
    surface: "hsl(210 40% 6%)",
    surfaceHover: "hsl(210 40% 9%)",
    border: "hsla(210 60% 60% / 0.08)",
    text: {
      primary: "hsl(205 30% 92%)",
      secondary: "hsl(205 20% 60%)",
      muted: "hsl(205 15% 40%)",
    },
    gradient: {
      primary: "linear-gradient(135deg, hsl(205 70% 38%), hsl(188 55% 45%))",
      subtle: "linear-gradient(135deg, hsla(205 70% 38% / 0.08), hsla(188 55% 45% / 0.06))",
      text: "linear-gradient(135deg, hsl(205 70% 60%), hsl(188 55% 62%))",
    },
    semantic: {
      success: "hsl(152 55% 45%)",
      warning: "hsl(38 85% 52%)",
      error: "hsl(4 72% 50%)",
      info: "hsl(205 70% 52%)",
    },
  },
  typography: {
    displayFont: "'Inter', system-ui, sans-serif",
    bodyFont: "'Inter', system-ui, sans-serif",
    monoFont: "'JetBrains Mono', 'Fira Code', monospace",
    displayWeight: "700",
    headingWeight: "600",
    bodyWeight: "400",
  },
  logo: {
    initials: "V",
    shape: "rounded",
    iconType: "Ship",
  },
  motion: {
    duration: "0.35s",
    easing: "cubic-bezier(0.4, 0, 0.2, 1)",
    stagger: 0.06,
  },
  ui: {
    borderRadius: "0.5rem",
    mode: "dark",
  },
};

const inca: BrandTokens = {
  slug: "inca",
  name: "INCA Intelligence Platform",
  tagline: "Institutional intelligence. Infinite depth.",
  description:
    "AI research command center for intelligence analysts, policy strategists, and institutional researchers requiring deep analytical rigor.",
  colors: {
    primary: "hsl(245 50% 45%)",
    primaryLight: "hsl(245 50% 58%)",
    primaryDark: "hsl(245 50% 34%)",
    accent: "hsl(260 35% 55%)",
    surface: "hsl(245 20% 7%)",
    surfaceHover: "hsl(245 20% 10%)",
    border: "hsla(245 50% 60% / 0.08)",
    text: {
      primary: "hsl(245 20% 94%)",
      secondary: "hsl(245 10% 60%)",
      muted: "hsl(245 8% 42%)",
    },
    gradient: {
      primary: "linear-gradient(135deg, hsl(245 50% 45%), hsl(260 35% 55%))",
      subtle: "linear-gradient(135deg, hsla(245 50% 45% / 0.08), hsla(260 35% 55% / 0.06))",
      text: "linear-gradient(135deg, hsl(245 50% 65%), hsl(260 35% 72%))",
    },
    semantic: {
      success: "hsl(152 55% 45%)",
      warning: "hsl(38 85% 52%)",
      error: "hsl(4 72% 50%)",
      info: "hsl(245 50% 60%)",
    },
  },
  typography: {
    displayFont: "'Inter', system-ui, sans-serif",
    bodyFont: "'Inter', system-ui, sans-serif",
    monoFont: "'JetBrains Mono', 'Fira Code', monospace",
    displayWeight: "700",
    headingWeight: "600",
    bodyWeight: "400",
  },
  logo: {
    initials: "IN",
    shape: "rounded",
    iconType: "Brain",
  },
  motion: {
    duration: "0.28s",
    easing: "cubic-bezier(0.16, 1, 0.3, 1)",
    stagger: 0.05,
  },
  ui: {
    borderRadius: "0.5rem",
    mode: "dark",
  },
};

const carlotaJo: BrandTokens = {
  slug: "carlota-jo",
  name: "Carlota Jo Consulting",
  tagline: "Strategic excellence. Curated for the rare few.",
  description:
    "Ultra-premium strategic advisory practice serving founders, executives, and family offices with world-class business transformation expertise.",
  colors: {
    primary: "hsl(32 40% 48%)",
    primaryLight: "hsl(32 40% 60%)",
    primaryDark: "hsl(32 40% 36%)",
    accent: "hsl(35 28% 55%)",
    surface: "hsl(30 10% 8%)",
    surfaceHover: "hsl(30 10% 11%)",
    border: "hsla(32 40% 48% / 0.12)",
    text: {
      primary: "hsl(35 20% 92%)",
      secondary: "hsl(32 10% 58%)",
      muted: "hsl(32 8% 40%)",
    },
    gradient: {
      primary: "linear-gradient(135deg, hsl(32 40% 48%), hsl(35 28% 55%))",
      subtle: "linear-gradient(135deg, hsla(32 40% 48% / 0.08), hsla(35 28% 55% / 0.06))",
      text: "linear-gradient(135deg, hsl(32 40% 65%), hsl(35 28% 72%))",
    },
    semantic: {
      success: "hsl(152 40% 45%)",
      warning: "hsl(38 70% 52%)",
      error: "hsl(4 60% 50%)",
      info: "hsl(32 40% 55%)",
    },
  },
  typography: {
    displayFont: "'Cormorant Garamond', 'Playfair Display', Georgia, serif",
    bodyFont: "'Raleway', 'Inter', system-ui, sans-serif",
    monoFont: "'JetBrains Mono', monospace",
    displayWeight: "300",
    headingWeight: "400",
    bodyWeight: "300",
  },
  logo: {
    initials: "CJ",
    shape: "circle",
    iconType: "Crown",
  },
  motion: {
    duration: "0.7s",
    easing: "cubic-bezier(0.22, 1, 0.36, 1)",
    stagger: 0.1,
  },
  ui: {
    borderRadius: "0.25rem",
    mode: "dark",
  },
};

const stephen: BrandTokens = {
  slug: "stephen",
  name: "Stephen Lutar",
  tagline: "Engineering clarity in a noisy world.",
  description:
    "Fractional CTO and senior engineering advisor specializing in systems architecture, AI infrastructure, and high-performance engineering teams.",
  colors: {
    primary: "hsl(220 35% 50%)",
    primaryLight: "hsl(220 35% 64%)",
    primaryDark: "hsl(220 35% 38%)",
    accent: "hsl(38 55% 52%)",
    surface: "hsl(220 15% 8%)",
    surfaceHover: "hsl(220 15% 11%)",
    border: "hsla(220 30% 60% / 0.08)",
    text: {
      primary: "hsl(220 15% 93%)",
      secondary: "hsl(220 8% 60%)",
      muted: "hsl(220 6% 42%)",
    },
    gradient: {
      primary: "linear-gradient(135deg, hsl(220 35% 50%), hsl(38 55% 52%))",
      subtle: "linear-gradient(135deg, hsla(220 35% 50% / 0.08), hsla(38 55% 52% / 0.08))",
      text: "linear-gradient(135deg, hsl(220 35% 68%), hsl(38 55% 65%))",
    },
    semantic: {
      success: "hsl(152 55% 45%)",
      warning: "hsl(38 85% 52%)",
      error: "hsl(4 72% 50%)",
      info: "hsl(220 70% 55%)",
    },
  },
  typography: {
    displayFont: "'Inter', system-ui, sans-serif",
    bodyFont: "'Inter', system-ui, sans-serif",
    monoFont: "'JetBrains Mono', 'Fira Code', monospace",
    displayWeight: "700",
    headingWeight: "600",
    bodyWeight: "400",
  },
  logo: {
    initials: "SL",
    shape: "rounded",
    iconType: "Globe",
  },
  motion: {
    duration: "0.45s",
    easing: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
    stagger: 0.07,
  },
  ui: {
    borderRadius: "0.5rem",
    mode: "dark",
  },
};

const firestorm: BrandTokens = {
  slug: "firestorm",
  name: "Firestorm Security",
  tagline: "Simulate the breach. Own the response.",
  description:
    "Elite security simulation platform for red teams, incident responders, and enterprise security leaders conducting realistic threat exercises.",
  colors: {
    primary: "hsl(36 84% 52%)",
    primaryLight: "hsl(36 84% 64%)",
    primaryDark: "hsl(36 84% 40%)",
    accent: "hsl(22 76% 48%)",
    surface: "hsl(24 8% 8%)",
    surfaceHover: "hsl(24 8% 11%)",
    border: "hsla(36 84% 52% / 0.12)",
    text: {
      primary: "hsl(36 15% 93%)",
      secondary: "hsl(36 8% 58%)",
      muted: "hsl(36 5% 40%)",
    },
    gradient: {
      primary: "linear-gradient(135deg, hsl(36 84% 52%), hsl(22 76% 48%))",
      subtle: "linear-gradient(135deg, hsla(36 84% 52% / 0.08), hsla(22 76% 48% / 0.08))",
      text: "linear-gradient(135deg, hsl(36 84% 68%), hsl(22 76% 64%))",
    },
    semantic: {
      success: "hsl(152 55% 45%)",
      warning: "hsl(36 84% 52%)",
      error: "hsl(4 72% 50%)",
      info: "hsl(200 70% 52%)",
    },
  },
  typography: {
    displayFont: "'Inter', system-ui, sans-serif",
    bodyFont: "'Inter', system-ui, sans-serif",
    monoFont: "'JetBrains Mono', 'Fira Code', monospace",
    displayWeight: "700",
    headingWeight: "600",
    bodyWeight: "400",
  },
  logo: {
    initials: "FS",
    shape: "rounded",
    iconType: "Flame",
  },
  motion: {
    duration: "0.22s",
    easing: "cubic-bezier(0.16, 1, 0.3, 1)",
    stagger: 0.04,
  },
  ui: {
    borderRadius: "0.5rem",
    mode: "dark",
  },
};

const dreamscape: BrandTokens = {
  slug: "dreamscape",
  name: "Dreamscape Creative Engine",
  tagline: "Intelligence for creators who refuse ordinary.",
  description:
    "AI-powered creative intelligence platform for agencies, content studios, and brand teams requiring systematic creative output at scale.",
  colors: {
    primary: "hsl(280 52% 58%)",
    primaryLight: "hsl(280 52% 70%)",
    primaryDark: "hsl(280 52% 46%)",
    accent: "hsl(300 40% 52%)",
    surface: "hsl(276 8% 9%)",
    surfaceHover: "hsl(276 8% 12%)",
    border: "hsla(280 52% 58% / 0.12)",
    text: {
      primary: "hsl(280 15% 94%)",
      secondary: "hsl(280 8% 60%)",
      muted: "hsl(280 5% 42%)",
    },
    gradient: {
      primary: "linear-gradient(135deg, hsl(280 52% 58%), hsl(300 40% 52%))",
      subtle: "linear-gradient(135deg, hsla(280 52% 58% / 0.08), hsla(300 40% 52% / 0.08))",
      text: "linear-gradient(135deg, hsl(280 52% 74%), hsl(300 40% 68%))",
    },
    semantic: {
      success: "hsl(152 55% 45%)",
      warning: "hsl(38 85% 52%)",
      error: "hsl(4 72% 50%)",
      info: "hsl(280 52% 62%)",
    },
  },
  typography: {
    displayFont: "'Inter', system-ui, sans-serif",
    bodyFont: "'Inter', system-ui, sans-serif",
    monoFont: "'JetBrains Mono', monospace",
    displayWeight: "600",
    headingWeight: "500",
    bodyWeight: "400",
  },
  logo: {
    initials: "DS",
    shape: "rounded",
    iconType: "Palette",
  },
  motion: {
    duration: "0.28s",
    easing: "cubic-bezier(0.22, 1, 0.36, 1)",
    stagger: 0.06,
  },
  ui: {
    borderRadius: "0.75rem",
    mode: "dark",
  },
};

const terra: BrandTokens = {
  slug: "terra",
  name: "Terra Real Estate Intelligence",
  tagline: "Data-driven real estate decisions at institutional scale.",
  description:
    "Real estate intelligence platform combining live market data, demographic analytics, and institutional-grade risk scoring for property investors.",
  colors: {
    primary: "hsl(26 48% 44%)",
    primaryLight: "hsl(26 48% 56%)",
    primaryDark: "hsl(26 48% 34%)",
    accent: "hsl(14 40% 40%)",
    surface: "hsl(20 7% 8%)",
    surfaceHover: "hsl(20 7% 11%)",
    border: "hsla(26 48% 44% / 0.12)",
    text: {
      primary: "hsl(26 15% 93%)",
      secondary: "hsl(26 8% 58%)",
      muted: "hsl(26 5% 40%)",
    },
    gradient: {
      primary: "linear-gradient(135deg, hsl(26 48% 44%), hsl(14 40% 40%))",
      subtle: "linear-gradient(135deg, hsla(26 48% 44% / 0.08), hsla(14 40% 40% / 0.08))",
      text: "linear-gradient(135deg, hsl(26 48% 60%), hsl(14 40% 56%))",
    },
    semantic: {
      success: "hsl(152 55% 42%)",
      warning: "hsl(38 85% 52%)",
      error: "hsl(4 72% 50%)",
      info: "hsl(200 60% 50%)",
    },
  },
  typography: {
    displayFont: "'Inter', system-ui, sans-serif",
    bodyFont: "'Inter', system-ui, sans-serif",
    monoFont: "'JetBrains Mono', monospace",
    displayWeight: "700",
    headingWeight: "600",
    bodyWeight: "400",
  },
  logo: {
    initials: "TR",
    shape: "rounded",
    iconType: "Building",
  },
  motion: {
    duration: "0.25s",
    easing: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
    stagger: 0.05,
  },
  ui: {
    borderRadius: "0.5rem",
    mode: "dark",
  },
};

const lyte: BrandTokens = {
  slug: "lyte",
  name: "Lyte Command Center",
  tagline: "Operations intelligence at the speed of business.",
  description:
    "Modern operations command center for MSPs and service businesses managing clients, tasks, billing, and performance in a unified dashboard.",
  colors: {
    primary: "hsl(192 80% 46%)",
    primaryLight: "hsl(192 80% 58%)",
    primaryDark: "hsl(192 80% 36%)",
    accent: "hsl(180 60% 44%)",
    surface: "hsl(186 8% 8%)",
    surfaceHover: "hsl(186 8% 11%)",
    border: "hsla(192 80% 46% / 0.12)",
    text: {
      primary: "hsl(192 15% 94%)",
      secondary: "hsl(192 8% 60%)",
      muted: "hsl(192 5% 42%)",
    },
    gradient: {
      primary: "linear-gradient(135deg, hsl(192 80% 46%), hsl(180 60% 44%))",
      subtle: "linear-gradient(135deg, hsla(192 80% 46% / 0.08), hsla(180 60% 44% / 0.08))",
      text: "linear-gradient(135deg, hsl(192 80% 62%), hsl(180 60% 60%))",
    },
    semantic: {
      success: "hsl(152 55% 45%)",
      warning: "hsl(38 85% 52%)",
      error: "hsl(4 72% 50%)",
      info: "hsl(192 80% 50%)",
    },
  },
  typography: {
    displayFont: "'Inter', system-ui, sans-serif",
    bodyFont: "'Inter', system-ui, sans-serif",
    monoFont: "'JetBrains Mono', monospace",
    displayWeight: "700",
    headingWeight: "600",
    bodyWeight: "400",
  },
  logo: {
    initials: "LY",
    shape: "rounded",
    iconType: "ShoppingBag",
  },
  motion: {
    duration: "0.20s",
    easing: "cubic-bezier(0.16, 1, 0.3, 1)",
    stagger: 0.04,
  },
  ui: {
    borderRadius: "0.5rem",
    mode: "dark",
  },
};

const msp: BrandTokens = {
  slug: "msp",
  name: "MSP Command Center",
  tagline: "The command layer for government MSPs.",
  description:
    "Federal MSP command platform for managed service providers serving government clients, with FedRAMP compliance, CMMC tracking, and contract intelligence.",
  colors: {
    primary: "hsl(218 72% 52%)",
    primaryLight: "hsl(218 72% 64%)",
    primaryDark: "hsl(218 72% 40%)",
    accent: "hsl(204 60% 48%)",
    surface: "hsl(214 10% 9%)",
    surfaceHover: "hsl(214 10% 12%)",
    border: "hsla(218 72% 52% / 0.12)",
    text: {
      primary: "hsl(218 15% 94%)",
      secondary: "hsl(218 8% 60%)",
      muted: "hsl(218 5% 42%)",
    },
    gradient: {
      primary: "linear-gradient(135deg, hsl(218 72% 52%), hsl(204 60% 48%))",
      subtle: "linear-gradient(135deg, hsla(218 72% 52% / 0.08), hsla(204 60% 48% / 0.08))",
      text: "linear-gradient(135deg, hsl(218 72% 68%), hsl(204 60% 64%))",
    },
    semantic: {
      success: "hsl(152 55% 45%)",
      warning: "hsl(38 85% 52%)",
      error: "hsl(4 72% 50%)",
      info: "hsl(218 72% 56%)",
    },
  },
  typography: {
    displayFont: "'Inter', system-ui, sans-serif",
    bodyFont: "'Inter', system-ui, sans-serif",
    monoFont: "'JetBrains Mono', monospace",
    displayWeight: "700",
    headingWeight: "600",
    bodyWeight: "400",
  },
  logo: {
    initials: "MSP",
    shape: "rounded",
    iconType: "Shield",
  },
  motion: {
    duration: "0.22s",
    easing: "cubic-bezier(0.16, 1, 0.3, 1)",
    stagger: 0.05,
  },
  ui: {
    borderRadius: "0.5rem",
    mode: "dark",
  },
};

const alloy: BrandTokens = {
  slug: "alloy",
  name: "Alloy Command",
  tagline: "Unified AI command for your entire operation.",
  description:
    "Enterprise AI command center unifying agents, data pipelines, and operational intelligence across every business function.",
  colors: {
    primary: "hsl(232 64% 58%)",
    primaryLight: "hsl(232 64% 70%)",
    primaryDark: "hsl(232 64% 46%)",
    accent: "hsl(248 52% 62%)",
    surface: "hsl(228 8% 9%)",
    surfaceHover: "hsl(228 8% 12%)",
    border: "hsla(232 64% 58% / 0.12)",
    text: {
      primary: "hsl(232 15% 94%)",
      secondary: "hsl(232 8% 60%)",
      muted: "hsl(232 5% 42%)",
    },
    gradient: {
      primary: "linear-gradient(135deg, hsl(232 64% 58%), hsl(248 52% 62%))",
      subtle: "linear-gradient(135deg, hsla(232 64% 58% / 0.08), hsla(248 52% 62% / 0.08))",
      text: "linear-gradient(135deg, hsl(232 64% 74%), hsl(248 52% 78%))",
    },
    semantic: {
      success: "hsl(152 55% 45%)",
      warning: "hsl(38 85% 52%)",
      error: "hsl(4 72% 50%)",
      info: "hsl(232 64% 62%)",
    },
  },
  typography: {
    displayFont: "'Inter', system-ui, sans-serif",
    bodyFont: "'Inter', system-ui, sans-serif",
    monoFont: "'JetBrains Mono', monospace",
    displayWeight: "700",
    headingWeight: "600",
    bodyWeight: "400",
  },
  logo: {
    initials: "AL",
    shape: "rounded",
    iconType: "Cpu",
  },
  motion: {
    duration: "0.22s",
    easing: "cubic-bezier(0.16, 1, 0.3, 1)",
    stagger: 0.05,
  },
  ui: {
    borderRadius: "0.5rem",
    mode: "dark",
  },
};

export const brandRegistry: Record<BrandSlug, BrandTokens> = {
  "szl-holdings": szlHoldings,
  vessels,
  inca,
  "carlota-jo": carlotaJo,
  stephen,
  firestorm,
  dreamscape,
  terra,
  lyte,
  msp,
  alloy,
};

export function getBrand(slug: BrandSlug): BrandTokens {
  return brandRegistry[slug];
}

export function listBrands(): BrandTokens[] {
  return Object.values(brandRegistry);
}
