export type { BrandTokens, BrandSlug } from "./tokens";
export { brandRegistry, getBrand, listBrands } from "./registry";

export function getBrandCSSVars(tokens: import("./tokens").BrandTokens): Record<string, string> {
  return {
    "--brand-primary": tokens.colors.primary,
    "--brand-primary-light": tokens.colors.primaryLight,
    "--brand-primary-dark": tokens.colors.primaryDark,
    "--brand-accent": tokens.colors.accent,
    "--brand-surface": tokens.colors.surface,
    "--brand-surface-hover": tokens.colors.surfaceHover,
    "--brand-border": tokens.colors.border,
    "--brand-text": tokens.colors.text.primary,
    "--brand-text-secondary": tokens.colors.text.secondary,
    "--brand-text-muted": tokens.colors.text.muted,
    "--brand-gradient": tokens.colors.gradient.primary,
    "--brand-gradient-subtle": tokens.colors.gradient.subtle,
    "--brand-gradient-text": tokens.colors.gradient.text,
    "--brand-radius": tokens.ui.borderRadius,
    "--brand-duration": tokens.motion.duration,
    "--brand-easing": tokens.motion.easing,
  };
}

export function getBrandGradientCSS(tokens: import("./tokens").BrandTokens): Record<string, string> {
  return {
    background: tokens.colors.gradient.text,
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
  };
}

export function getBrandPrimaryStyle(tokens: import("./tokens").BrandTokens): Record<string, string> {
  return {
    backgroundColor: tokens.colors.primary,
    color: "#ffffff",
  };
}
