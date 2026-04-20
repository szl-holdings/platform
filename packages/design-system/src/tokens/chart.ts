/**
 * AEEP Chart Palette Tokens
 *
 * Executive-quiet chart palette. Muted, distinguishable series colors on dark backgrounds.
 * Preferred chart types: line, bar, stacked bar, heatmap, timeline.
 * Avoid: high-chroma pie charts, neon fills, gradient-heavy area charts.
 */

export const chartColor = {
  primary: "#4d8fcc",
  secondary: "#5baa8a",
  tertiary: "#c9a85c",
  quaternary: "#9b7cc8",
  quinary: "#c97a64",
  senary: "#6bb5c2",

  positive: "#5baa8a",
  negative: "#c96070",
  neutral: "#7a99b8",
  warning: "#c9a85c",

  gridLine: "#1a2535",
  axisLabel: "#4a6070",
  tickLine: "#243040",
  tooltip: {
    bg: "#0d1520",
    border: "#243040",
    text: "#c8d8e8",
  },
} as const;

export const chartSeries = [
  chartColor.primary,
  chartColor.secondary,
  chartColor.tertiary,
  chartColor.quaternary,
  chartColor.quinary,
  chartColor.senary,
] as const;
