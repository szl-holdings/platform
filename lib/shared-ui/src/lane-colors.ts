/**
 * Canonical pack accent colors for the SZL Holdings portfolio.
 *
 * This is the single source of truth for per-pack accent values used across
 * all web and mobile apps. Always import from here rather than from tokens.ts
 * (the `colors.lane` object in tokens.ts is legacy/unused and may diverge).
 *
 * Primary/accent/primaryLight values are 6-digit hex strings — safe to pass to `toAlpha()`.
 * Muted values are pre-composed rgba() strings for convenience (use directly in style props).
 */
export const LANE_ACCENT_HEX = {
  szl: {
    primary: "#b8bfcb",
    accent: "#99a3b0",
    muted: "rgba(184,191,203,0.10)",
  },
  lyte: {
    primary: "#d4a054",
    primaryLight: "#e0b870",
    accent: "#c89040",
    muted: "rgba(212,160,84,0.10)",
  },
  alloy: {
    primary: "#4a6eb5",
    primaryLight: "#6b8fd4",
    accent: "#5a80c8",
    muted: "rgba(74,110,181,0.10)",
  },
  vessels: {
    primary: "#0ea5e9",
    primaryLight: "#38bdf8",
    accent: "#0284c7",
    muted: "rgba(14,165,233,0.10)",
  },
  aegis: {
    primary: "#3b82f6",
    primaryLight: "#60a5fa",
    accent: "#8b5cf6",
    alert: "#ef4444",
    muted: "rgba(59,130,246,0.10)",
  },
  terra: {
    primary: "#40856a",
    primaryLight: "#4fa083",
    accent: "#4a7260",
    muted: "rgba(64,133,106,0.10)",
  },
  carlotaJo: {
    primary: "#c8a96a",
    primaryLight: "#d4b87a",
    accent: "#b09870",
    muted: "rgba(200,169,106,0.10)",
  },
  stephen: {
    primary: "#8a9ab0",
    primaryLight: "#a5b3c4",
    accent: "#6080a5",
    muted: "rgba(138,154,176,0.10)",
  },
} as const;

export type LaneName = keyof typeof LANE_ACCENT_HEX;
