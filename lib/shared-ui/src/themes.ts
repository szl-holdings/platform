import { colors, typography, effects } from "./tokens";

export interface BrandTheme {
  name: string;
  slug: string;
  colors: {
    primary: string;
    primaryLight: string;
    primaryDark: string;
    primaryMuted: string;
    accent: string;
    accentLight: string;
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

export const szlHoldingsTheme: BrandTheme = {
  name: "SZL Holdings",
  slug: "szl-holdings",
  colors: {
    primary: "hsl(250 90% 65%)",
    primaryLight: "hsl(250 90% 75%)",
    primaryDark: "hsl(250 90% 55%)",
    primaryMuted: "hsla(250 90% 65% / 0.15)",
    accent: "hsl(280 80% 65%)",
    accentLight: "hsl(280 80% 75%)",
    surface: "hsla(250 30% 15% / 0.4)",
    surfaceHover: "hsla(250 30% 18% / 0.5)",
  },
  gradient: {
    primary: "linear-gradient(135deg, hsl(250 90% 65%), hsl(280 80% 65%))",
    subtle: "linear-gradient(135deg, hsla(250 90% 65% / 0.1), hsla(280 80% 65% / 0.1))",
    text: "linear-gradient(135deg, hsl(250 90% 75%), hsl(280 80% 75%))",
  },
  typography: {
    displayWeight: "800",
    headingWeight: "700",
    bodyWeight: "400",
  },
  motion: {
    duration: "0.3s",
    easing: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
    stagger: 0.06,
  },
};

export const vesselsTheme: BrandTheme = {
  name: "Vessels Maritime Intelligence",
  slug: "vessels",
  colors: {
    primary: "hsl(200 85% 50%)",
    primaryLight: "hsl(200 85% 65%)",
    primaryDark: "hsl(200 85% 40%)",
    primaryMuted: "hsla(200 85% 50% / 0.15)",
    accent: "hsl(170 70% 50%)",
    accentLight: "hsl(170 70% 65%)",
    surface: "hsla(210 40% 12% / 0.5)",
    surfaceHover: "hsla(210 40% 15% / 0.6)",
  },
  gradient: {
    primary: "linear-gradient(135deg, hsl(200 85% 50%), hsl(170 70% 50%))",
    subtle: "linear-gradient(135deg, hsla(200 85% 50% / 0.1), hsla(170 70% 50% / 0.1))",
    text: "linear-gradient(135deg, hsl(200 85% 65%), hsl(170 70% 65%))",
  },
  typography: {
    displayWeight: "700",
    headingWeight: "600",
    bodyWeight: "400",
  },
  motion: {
    duration: "0.35s",
    easing: "cubic-bezier(0.4, 0, 0.2, 1)",
    stagger: 0.05,
  },
};

export const incaTheme: BrandTheme = {
  name: "INCA AI Research",
  slug: "inca",
  colors: {
    primary: "hsl(160 80% 45%)",
    primaryLight: "hsl(160 80% 60%)",
    primaryDark: "hsl(160 80% 35%)",
    primaryMuted: "hsla(160 80% 45% / 0.15)",
    accent: "hsl(190 90% 55%)",
    accentLight: "hsl(190 90% 70%)",
    surface: "hsla(170 30% 10% / 0.5)",
    surfaceHover: "hsla(170 30% 13% / 0.6)",
  },
  gradient: {
    primary: "linear-gradient(135deg, hsl(160 80% 45%), hsl(190 90% 55%))",
    subtle: "linear-gradient(135deg, hsla(160 80% 45% / 0.1), hsla(190 90% 55% / 0.1))",
    text: "linear-gradient(135deg, hsl(160 80% 60%), hsl(190 90% 70%))",
  },
  typography: {
    displayWeight: "700",
    headingWeight: "600",
    bodyWeight: "400",
  },
  motion: {
    duration: "0.25s",
    easing: "cubic-bezier(0.16, 1, 0.3, 1)",
    stagger: 0.04,
  },
};

export const carlotaJoTheme: BrandTheme = {
  name: "Carlota Jo Advisory",
  slug: "carlota-jo",
  colors: {
    primary: "hsl(340 65% 55%)",
    primaryLight: "hsl(340 65% 70%)",
    primaryDark: "hsl(340 65% 45%)",
    primaryMuted: "hsla(340 65% 55% / 0.15)",
    accent: "hsl(30 80% 60%)",
    accentLight: "hsl(30 80% 75%)",
    surface: "hsla(340 20% 12% / 0.5)",
    surfaceHover: "hsla(340 20% 15% / 0.6)",
  },
  gradient: {
    primary: "linear-gradient(135deg, hsl(340 65% 55%), hsl(30 80% 60%))",
    subtle: "linear-gradient(135deg, hsla(340 65% 55% / 0.1), hsla(30 80% 60% / 0.1))",
    text: "linear-gradient(135deg, hsl(340 65% 70%), hsl(30 80% 75%))",
  },
  typography: {
    displayWeight: "600",
    headingWeight: "500",
    bodyWeight: "300",
  },
  motion: {
    duration: "0.4s",
    easing: "cubic-bezier(0.22, 1, 0.36, 1)",
    stagger: 0.08,
  },
};

export const brandThemes = {
  "szl-holdings": szlHoldingsTheme,
  vessels: vesselsTheme,
  inca: incaTheme,
  "carlota-jo": carlotaJoTheme,
} as const;

export type BrandSlug = keyof typeof brandThemes;

export function getBrandTheme(slug: BrandSlug): BrandTheme {
  return brandThemes[slug];
}

export function getBrandGradientCSS(theme: BrandTheme): Record<string, string> {
  return {
    background: theme.gradient.primary,
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
  };
}

export function getBrandSurface(theme: BrandTheme): Record<string, string> {
  return {
    background: theme.colors.surface,
    backdropFilter: effects.glassmorphism.backdropFilter,
    border: `1px solid ${theme.colors.primaryMuted}`,
    borderRadius: effects.borderRadius.lg,
  };
}
