import { colors, effects } from "./tokens";

export interface BrandTheme {
  name: string;
  slug: string;
  colors: {
    primary: string;
    primaryLight: string;
    primaryDark: string;
    primaryMuted: string;
    primarySubtle?: string;
    secondary?: string;
    secondaryLight?: string;
    accent?: string;
    accentLight?: string;
    surface: string;
    surfaceHover: string;
  };
  gradient: {
    primary: string;
    subtle: string;
    text: string;
  };
  typography: {
    displayWeight: string;
    headingWeight: string;
    bodyWeight: string;
  };
  motion: {
    duration: string;
    easing: string;
    stagger: number;
  };
}

// ─── Brand Bible lane themes ─────────────────────────────────────────────────

export const szlHoldingsTheme: BrandTheme = {
  name: "SZL Holdings",
  slug: "szl-holdings",
  colors: {
    primary: colors.lane.szl.primary,
    primaryLight: colors.lane.szl.primaryLight,
    primaryDark: colors.lane.szl.primaryDark,
    primaryMuted: colors.lane.szl.muted,
    accent: colors.lane.szl.accent,
    accentLight: "hsl(215 30% 68%)",
    surface: colors.lane.szl.surface,
    surfaceHover: "hsla(215 30% 14% / 0.65)",
  },
  gradient: {
    primary: "linear-gradient(135deg, hsl(215 45% 40%), hsl(215 30% 52%))",
    subtle: "linear-gradient(135deg, hsla(215 45% 40% / 0.08), hsla(215 30% 52% / 0.06))",
    text: "linear-gradient(135deg, hsl(215 45% 62%), hsl(215 30% 72%))",
  },
  typography: {
    displayWeight: "700",
    headingWeight: "600",
    bodyWeight: "400",
  },
  motion: {
    duration: "0.65s",
    easing: "cubic-bezier(0.22, 1, 0.36, 1)",
    stagger: 0.08,
  },
};

export const vesselsTheme: BrandTheme = {
  name: "Vessels Maritime Intelligence",
  slug: "vessels",
  colors: {
    primary: colors.lane.vessels.primary,
    primaryLight: colors.lane.vessels.primaryLight,
    primaryDark: colors.lane.vessels.primaryDark,
    primaryMuted: colors.lane.vessels.muted,
    accent: colors.lane.vessels.accent,
    accentLight: "hsl(188 55% 58%)",
    surface: colors.lane.vessels.surface,
    surfaceHover: "hsla(210 40% 12% / 0.65)",
  },
  gradient: {
    primary: "linear-gradient(135deg, hsl(205 70% 38%), hsl(188 55% 45%))",
    subtle: "linear-gradient(135deg, hsla(205 70% 38% / 0.08), hsla(188 55% 45% / 0.06))",
    text: "linear-gradient(135deg, hsl(205 70% 60%), hsl(188 55% 62%))",
  },
  typography: {
    displayWeight: "700",
    headingWeight: "600",
    bodyWeight: "400",
  },
  motion: {
    duration: "0.35s",
    easing: "cubic-bezier(0.4, 0, 0.2, 1)",
    stagger: 0.06,
  },
};


export const carlotaJoTheme: BrandTheme = {
  name: "Carlota Jo Consulting",
  slug: "carlota-jo",
  colors: {
    primary: colors.lane.carlotaJo.primary,
    primaryLight: colors.lane.carlotaJo.primaryLight,
    primaryDark: colors.lane.carlotaJo.primaryDark,
    primaryMuted: colors.lane.carlotaJo.muted,
    accent: colors.lane.carlotaJo.accent,
    accentLight: "hsl(35 28% 68%)",
    surface: colors.lane.carlotaJo.surface,
    surfaceHover: "hsla(30 15% 10% / 0.7)",
  },
  gradient: {
    primary: "linear-gradient(135deg, hsl(32 40% 48%), hsl(35 28% 55%))",
    subtle: "linear-gradient(135deg, hsla(32 40% 48% / 0.08), hsla(35 28% 55% / 0.06))",
    text: "linear-gradient(135deg, hsl(32 40% 65%), hsl(35 28% 72%))",
  },
  typography: {
    displayWeight: "300",
    headingWeight: "400",
    bodyWeight: "300",
  },
  motion: {
    duration: "0.7s",
    easing: "cubic-bezier(0.22, 1, 0.36, 1)",
    stagger: 0.1,
  },
};

export const stephenLutarTheme: BrandTheme = {
  name: "Stephen Lutar",
  slug: "stephen",
  colors: {
    primary: colors.lane.stephen.primary,
    primaryLight: colors.lane.stephen.primaryLight,
    primaryDark: colors.lane.stephen.primaryDark,
    primaryMuted: colors.lane.stephen.muted,
    accent: colors.lane.stephen.accent,
    accentLight: "hsl(38 55% 65%)",
    surface: colors.lane.stephen.surface,
    surfaceHover: "hsla(220 20% 12% / 0.65)",
  },
  gradient: {
    primary: "linear-gradient(135deg, hsl(220 35% 50%), hsl(38 55% 52%))",
    subtle: "linear-gradient(135deg, hsla(220 35% 50% / 0.08), hsla(38 55% 52% / 0.06))",
    text: "linear-gradient(135deg, hsl(220 35% 68%), hsl(38 55% 65%))",
  },
  typography: {
    displayWeight: "700",
    headingWeight: "600",
    bodyWeight: "400",
  },
  motion: {
    duration: "0.45s",
    easing: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
    stagger: 0.07,
  },
};

// Legacy alias kept for backward compatibility
export const stephenTheme = stephenLutarTheme;

// ─── Supporting app themes ────────────────────────────────────────────────────

export const dreamscapeTheme: BrandTheme = {
  name: "Dreamscape Creative",
  slug: "dreamscape",
  colors: {
    primary: colors.laneAccents.dreamscape.primary,
    primaryLight: "hsl(280 52% 70%)",
    primaryDark: "hsl(280 52% 46%)",
    primaryMuted: colors.laneAccents.dreamscape.muted,
    primarySubtle: "hsla(280 52% 58% / 0.05)",
    secondary: colors.laneAccents.dreamscape.secondary,
    secondaryLight: "hsl(300 40% 64%)",
    surface: "hsl(276 8% 9%)",
    surfaceHover: "hsl(276 8% 12%)",
  },
  gradient: {
    primary: "linear-gradient(135deg, hsl(280 52% 58%), hsl(300 40% 52%))",
    subtle: "linear-gradient(135deg, hsla(280 52% 58% / 0.08), hsla(300 40% 52% / 0.08))",
    text: "linear-gradient(135deg, hsl(280 52% 74%), hsl(300 40% 68%))",
  },
  typography: {
    displayWeight: "600",
    headingWeight: "500",
    bodyWeight: "400",
  },
  motion: {
    duration: "0.28s",
    easing: "cubic-bezier(0.22, 1, 0.36, 1)",
    stagger: 0.06,
  },
};

export const terraTheme: BrandTheme = {
  name: "Terra Real Estate",
  slug: "terra",
  colors: {
    primary: colors.laneAccents.terra.primary,
    primaryLight: "hsl(26 48% 56%)",
    primaryDark: "hsl(26 48% 34%)",
    primaryMuted: colors.laneAccents.terra.muted,
    primarySubtle: "hsla(26 48% 44% / 0.05)",
    secondary: colors.laneAccents.terra.secondary,
    secondaryLight: "hsl(14 40% 52%)",
    surface: "hsl(20 7% 8%)",
    surfaceHover: "hsl(20 7% 11%)",
  },
  gradient: {
    primary: "linear-gradient(135deg, hsl(26 48% 44%), hsl(14 40% 40%))",
    subtle: "linear-gradient(135deg, hsla(26 48% 44% / 0.08), hsla(14 40% 40% / 0.08))",
    text: "linear-gradient(135deg, hsl(26 48% 60%), hsl(14 40% 56%))",
  },
  typography: {
    displayWeight: "700",
    headingWeight: "600",
    bodyWeight: "400",
  },
  motion: {
    duration: "0.25s",
    easing: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
    stagger: 0.05,
  },
};

export const lyteTheme: BrandTheme = {
  name: "Lyte Command Center",
  slug: "lyte",
  colors: {
    primary: colors.laneAccents.lyte.primary,
    primaryLight: "hsl(192 80% 58%)",
    primaryDark: "hsl(192 80% 36%)",
    primaryMuted: colors.laneAccents.lyte.muted,
    primarySubtle: "hsla(192 80% 46% / 0.05)",
    secondary: colors.laneAccents.lyte.secondary,
    secondaryLight: "hsl(180 60% 56%)",
    surface: "hsl(186 8% 8%)",
    surfaceHover: "hsl(186 8% 11%)",
  },
  gradient: {
    primary: "linear-gradient(135deg, hsl(192 80% 46%), hsl(180 60% 44%))",
    subtle: "linear-gradient(135deg, hsla(192 80% 46% / 0.08), hsla(180 60% 44% / 0.08))",
    text: "linear-gradient(135deg, hsl(192 80% 62%), hsl(180 60% 60%))",
  },
  typography: {
    displayWeight: "700",
    headingWeight: "600",
    bodyWeight: "400",
  },
  motion: {
    duration: "0.20s",
    easing: "cubic-bezier(0.16, 1, 0.3, 1)",
    stagger: 0.04,
  },
};

export const aegisTheme: BrandTheme = {
  name: "Aegis — Unified Defense & Intelligence Command",
  slug: "aegis",
  colors: {
    primary: colors.laneAccents.aegis.primary,
    primaryLight: "hsl(220 72% 70%)",
    primaryDark: "hsl(220 72% 40%)",
    primaryMuted: colors.laneAccents.aegis.muted,
    primarySubtle: "hsla(220 72% 56% / 0.05)",
    secondary: colors.laneAccents.aegis.secondary,
    secondaryLight: "hsl(262 55% 72%)",
    accent: colors.laneAccents.aegis.tertiary,
    accentLight: "hsl(0 62% 68%)",
    surface: "hsl(220 10% 7%)",
    surfaceHover: "hsl(220 10% 10%)",
  },
  gradient: {
    primary: "linear-gradient(135deg, hsl(220 72% 56%), hsl(262 55% 58%))",
    subtle: "linear-gradient(135deg, hsla(220 72% 56% / 0.08), hsla(262 55% 58% / 0.08))",
    text: "linear-gradient(135deg, hsl(220 72% 72%), hsl(262 55% 74%))",
  },
  typography: {
    displayWeight: "700",
    headingWeight: "600",
    bodyWeight: "400",
  },
  motion: {
    duration: "0.22s",
    easing: "cubic-bezier(0.16, 1, 0.3, 1)",
    stagger: 0.04,
  },
};

export const alloyTheme: BrandTheme = {
  name: "Alloy Command",
  slug: "alloy",
  colors: {
    primary: colors.laneAccents.alloy.primary,
    primaryLight: "hsl(232 64% 70%)",
    primaryDark: "hsl(232 64% 46%)",
    primaryMuted: colors.laneAccents.alloy.muted,
    primarySubtle: "hsla(232 64% 58% / 0.05)",
    secondary: colors.laneAccents.alloy.secondary,
    secondaryLight: "hsl(248 52% 74%)",
    surface: "hsl(228 8% 9%)",
    surfaceHover: "hsl(228 8% 12%)",
  },
  gradient: {
    primary: "linear-gradient(135deg, hsl(232 64% 58%), hsl(248 52% 62%))",
    subtle: "linear-gradient(135deg, hsla(232 64% 58% / 0.08), hsla(248 52% 62% / 0.08))",
    text: "linear-gradient(135deg, hsl(232 64% 74%), hsl(248 52% 78%))",
  },
  typography: {
    displayWeight: "700",
    headingWeight: "600",
    bodyWeight: "400",
  },
  motion: {
    duration: "0.22s",
    easing: "cubic-bezier(0.16, 1, 0.3, 1)",
    stagger: 0.05,
  },
};

export const firestormTheme = aegisTheme;
export const incaTheme = aegisTheme;
export const mspTheme = aegisTheme;

// ─── Theme registry ───────────────────────────────────────────────────────────

export const brandThemes = {
  "szl-holdings": szlHoldingsTheme,
  vessels: vesselsTheme,
  "carlota-jo": carlotaJoTheme,
  stephen: stephenLutarTheme,
  aegis: aegisTheme,
  firestorm: aegisTheme,
  inca: aegisTheme,
  msp: aegisTheme,
  dreamscape: dreamscapeTheme,
  terra: terraTheme,
  lyte: lyteTheme,
  alloy: alloyTheme,
} as const;

export type BrandSlug = keyof typeof brandThemes;

export function getBrandTheme(slug: BrandSlug): BrandTheme {
  return brandThemes[slug];
}

export function getBrandGradientCSS(theme: BrandTheme): Record<string, string> {
  return {
    background: theme.gradient.text,
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
  };
}

export function getBrandSurface(theme: BrandTheme): Record<string, string> {
  return {
    background: theme.colors.surface,
    border: `1px solid ${theme.colors.primaryMuted}`,
    borderRadius: effects.borderRadius.lg,
  };
}

export function getBrandAccentCSS(theme: BrandTheme): Record<string, string> {
  return {
    color: theme.colors.primary,
  };
}
