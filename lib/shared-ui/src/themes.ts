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

export const incaTheme: BrandTheme = {
  name: "INCA Intelligence Platform",
  slug: "inca",
  colors: {
    primary: colors.lane.inca.primary,
    primaryLight: colors.lane.inca.primaryLight,
    primaryDark: colors.lane.inca.primaryDark,
    primaryMuted: colors.lane.inca.muted,
    accent: colors.lane.inca.accent,
    accentLight: "hsl(260 35% 68%)",
    surface: colors.lane.inca.surface,
    surfaceHover: "hsla(245 30% 12% / 0.65)",
  },
  gradient: {
    primary: "linear-gradient(135deg, hsl(245 50% 45%), hsl(260 35% 55%))",
    subtle: "linear-gradient(135deg, hsla(245 50% 45% / 0.08), hsla(260 35% 55% / 0.06))",
    text: "linear-gradient(135deg, hsl(245 50% 65%), hsl(260 35% 72%))",
  },
  typography: {
    displayWeight: "700",
    headingWeight: "600",
    bodyWeight: "400",
  },
  motion: {
    duration: "0.28s",
    easing: "cubic-bezier(0.16, 1, 0.3, 1)",
    stagger: 0.05,
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

export const firestormTheme: BrandTheme = {
  name: "Firestorm Security",
  slug: "firestorm",
  colors: {
    primary: colors.laneAccents.firestorm.primary,
    primaryLight: "hsl(36 84% 64%)",
    primaryDark: "hsl(36 84% 40%)",
    primaryMuted: colors.laneAccents.firestorm.muted,
    primarySubtle: "hsla(36 84% 52% / 0.05)",
    secondary: colors.laneAccents.firestorm.secondary,
    secondaryLight: "hsl(22 76% 60%)",
    surface: "hsl(24 8% 8%)",
    surfaceHover: "hsl(24 8% 11%)",
  },
  gradient: {
    primary: "linear-gradient(135deg, hsl(36 84% 52%), hsl(22 76% 48%))",
    subtle: "linear-gradient(135deg, hsla(36 84% 52% / 0.08), hsla(22 76% 48% / 0.08))",
    text: "linear-gradient(135deg, hsl(36 84% 68%), hsl(22 76% 64%))",
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

export const mspTheme: BrandTheme = {
  name: "MSP Command Center",
  slug: "msp",
  colors: {
    primary: colors.laneAccents.msp.primary,
    primaryLight: "hsl(218 72% 64%)",
    primaryDark: "hsl(218 72% 40%)",
    primaryMuted: colors.laneAccents.msp.muted,
    primarySubtle: "hsla(218 72% 52% / 0.05)",
    secondary: colors.laneAccents.msp.secondary,
    secondaryLight: "hsl(204 60% 60%)",
    surface: "hsl(214 10% 9%)",
    surfaceHover: "hsl(214 10% 12%)",
  },
  gradient: {
    primary: "linear-gradient(135deg, hsl(218 72% 52%), hsl(204 60% 48%))",
    subtle: "linear-gradient(135deg, hsla(218 72% 52% / 0.08), hsla(204 60% 48% / 0.08))",
    text: "linear-gradient(135deg, hsl(218 72% 68%), hsl(204 60% 64%))",
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

// ─── Theme registry ───────────────────────────────────────────────────────────

export const brandThemes = {
  "szl-holdings": szlHoldingsTheme,
  vessels: vesselsTheme,
  inca: incaTheme,
  "carlota-jo": carlotaJoTheme,
  stephen: stephenLutarTheme,
  firestorm: firestormTheme,
  dreamscape: dreamscapeTheme,
  terra: terraTheme,
  lyte: lyteTheme,
  msp: mspTheme,
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
