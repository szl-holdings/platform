/**
 * AEEP Typography Tokens
 *
 * Premium enterprise sans stack. No decorative typefaces.
 * Authenticated product surfaces: max heading size = text-2xl (24px).
 * Display sizes (text-3xl+) are for marketing surfaces only.
 */

export const fontFamily = {
  sans: [
    "Inter",
    "ui-sans-serif",
    "system-ui",
    "-apple-system",
    "BlinkMacSystemFont",
    '"Segoe UI"',
    "Roboto",
    '"Helvetica Neue"',
    "Arial",
    "sans-serif",
  ].join(", "),
  mono: [
    '"JetBrains Mono"',
    '"Fira Code"',
    '"Cascadia Code"',
    "ui-monospace",
    "SFMono-Regular",
    "Menlo",
    "Monaco",
    "Consolas",
    '"Liberation Mono"',
    '"Courier New"',
    "monospace",
  ].join(", "),
} as const;

export const fontSize = {
  "2xs": ["10px", { lineHeight: "14px", letterSpacing: "0.04em" }],
  xs: ["11px", { lineHeight: "16px", letterSpacing: "0.02em" }],
  sm: ["12px", { lineHeight: "18px", letterSpacing: "0.01em" }],
  base: ["13px", { lineHeight: "20px", letterSpacing: "0" }],
  md: ["14px", { lineHeight: "22px", letterSpacing: "0" }],
  lg: ["16px", { lineHeight: "24px", letterSpacing: "-0.01em" }],
  xl: ["18px", { lineHeight: "28px", letterSpacing: "-0.01em" }],
  "2xl": ["20px", { lineHeight: "30px", letterSpacing: "-0.02em" }],
  "3xl": ["24px", { lineHeight: "34px", letterSpacing: "-0.02em" }],
} as const;

export type FontSizeKey = keyof typeof fontSize;

export const fontWeight = {
  normal: "400",
  medium: "500",
  semibold: "600",
  bold: "700",
} as const;

/**
 * Text style presets for consistent usage.
 * Use these in component className strings with CSS custom properties.
 */
export const textStyle = {
  "page-title": { fontSize: "20px", fontWeight: "600", lineHeight: "30px", letterSpacing: "-0.02em" },
  "section-title": { fontSize: "14px", fontWeight: "600", lineHeight: "22px", letterSpacing: "0" },
  "card-title": { fontSize: "13px", fontWeight: "600", lineHeight: "20px" },
  "body": { fontSize: "13px", fontWeight: "400", lineHeight: "20px" },
  "body-sm": { fontSize: "12px", fontWeight: "400", lineHeight: "18px" },
  "label": { fontSize: "11px", fontWeight: "500", lineHeight: "16px", letterSpacing: "0.02em" },
  "caption": { fontSize: "11px", fontWeight: "400", lineHeight: "16px", letterSpacing: "0.01em" },
  "metric": { fontSize: "24px", fontWeight: "600", lineHeight: "34px", letterSpacing: "-0.03em" },
  "metric-sm": { fontSize: "18px", fontWeight: "600", lineHeight: "28px", letterSpacing: "-0.02em" },
  "code": { fontFamily: "mono", fontSize: "12px", lineHeight: "18px" },
  "mono-sm": { fontFamily: "mono", fontSize: "11px", lineHeight: "16px" },
} as const;

export type TextStyleKey = keyof typeof textStyle;
