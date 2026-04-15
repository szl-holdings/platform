export const LYTE_COLORS = {
  background: "#070c14",
  surface: "#0d1420",
  surfaceElevated: "#111b2b",
  border: "rgba(0,212,255,0.08)",
  borderStrong: "rgba(0,212,255,0.15)",

  electricBlue: "#00d4ff",
  electricBlueLight: "rgba(0,212,255,0.15)",
  electricBlueDim: "rgba(0,212,255,0.08)",
  electricBlueBright: "#33ddff",

  neonGreen: "#00ff88",
  neonGreenLight: "rgba(0,255,136,0.15)",
  neonGreenDim: "rgba(0,255,136,0.08)",

  critical: "#ff3b5c",
  criticalLight: "rgba(255,59,92,0.15)",
  criticalDim: "rgba(255,59,92,0.08)",

  high: "#ff7a3d",
  highLight: "rgba(255,122,61,0.15)",
  highDim: "rgba(255,122,61,0.08)",

  medium: "#ffd23d",
  mediumLight: "rgba(255,210,61,0.15)",
  mediumDim: "rgba(255,210,61,0.08)",

  low: "#8a9bb0",
  lowLight: "rgba(138,155,176,0.15)",

  textPrimary: "rgba(255,255,255,0.92)",
  textSecondary: "rgba(255,255,255,0.55)",
  textTertiary: "rgba(255,255,255,0.30)",
  textMuted: "rgba(255,255,255,0.18)",

  white: "#ffffff",
  transparent: "transparent",
};

export const LYTE_COLORS_LIGHT: typeof LYTE_COLORS = {
  background: "#F0FBFF",
  surface: "#FFFFFF",
  surfaceElevated: "#EAF7FD",
  border: "rgba(0,160,194,0.12)",
  borderStrong: "rgba(0,160,194,0.22)",

  electricBlue: "#0085A1",
  electricBlueLight: "rgba(0,133,161,0.12)",
  electricBlueDim: "rgba(0,133,161,0.07)",
  electricBlueBright: "#0099BB",

  neonGreen: "#00A855",
  neonGreenLight: "rgba(0,168,85,0.12)",
  neonGreenDim: "rgba(0,168,85,0.07)",

  critical: "#C9183A",
  criticalLight: "rgba(201,24,58,0.12)",
  criticalDim: "rgba(201,24,58,0.07)",

  high: "#C45210",
  highLight: "rgba(196,82,16,0.12)",
  highDim: "rgba(196,82,16,0.07)",

  medium: "#AA8800",
  mediumLight: "rgba(170,136,0,0.12)",
  mediumDim: "rgba(170,136,0,0.07)",

  low: "#556070",
  lowLight: "rgba(85,96,112,0.12)",

  textPrimary: "rgba(7,12,20,0.92)",
  textSecondary: "rgba(7,12,20,0.55)",
  textTertiary: "rgba(7,12,20,0.35)",
  textMuted: "rgba(7,12,20,0.18)",

  white: "#ffffff",
  transparent: "transparent",
};

export type LyteColors = typeof LYTE_COLORS;
