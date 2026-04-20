/**
 * AEEP Spacing Tokens
 *
 * 8px base unit. Three density modes: comfortable (default), compact, dense.
 * Use these tokens exclusively — no raw px values outside this file.
 */

export const spacing = {
  0: "0px",
  0.5: "4px",
  1: "8px",
  1.5: "12px",
  2: "16px",
  2.5: "20px",
  3: "24px",
  4: "32px",
  5: "40px",
  6: "48px",
  7: "56px",
  8: "64px",
  10: "80px",
  12: "96px",
  16: "128px",
  20: "160px",
  24: "192px",
} as const;

export type SpacingKey = keyof typeof spacing;

/**
 * Density mode spacing multipliers.
 *
 * comfortable: 1.0x  (default — executive mode, generous whitespace)
 * compact:     0.75x (operator mode — tighter but readable)
 * dense:       0.5x  (maximum data density — tables, logs)
 */
export const density = {
  comfortable: {
    pagePadding: "32px",
    sectionGap: "24px",
    cardPadding: "20px",
    rowHeight: "56px",
    inputHeight: "40px",
    iconSize: "20px",
    labelFontSize: "13px",
  },
  compact: {
    pagePadding: "24px",
    sectionGap: "16px",
    cardPadding: "14px",
    rowHeight: "40px",
    inputHeight: "32px",
    iconSize: "16px",
    labelFontSize: "12px",
  },
  dense: {
    pagePadding: "16px",
    sectionGap: "12px",
    cardPadding: "10px",
    rowHeight: "32px",
    inputHeight: "28px",
    iconSize: "14px",
    labelFontSize: "11px",
  },
} as const;

export type DensityMode = keyof typeof density;
