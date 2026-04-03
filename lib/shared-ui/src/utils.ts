import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString: string | Date): string {
  const date = typeof dateString === "string" ? new Date(dateString) : dateString;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function formatCurrency(value: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

export function getApiUrl(path: string): string {
  return `/api${path}`;
}

/**
 * Add an alpha channel to any CSS color string (hex, hsl, rgb, or named color).
 * Returns an rgba() value that works universally.
 *
 * @param color - CSS color string (e.g. "#3b82f6", "hsl(210 12% 7%)", "rgb(59,130,246)")
 * @param alpha - Opacity 0–1
 */
export function toAlpha(color: string, alpha: number): string {
  const a = Math.max(0, Math.min(1, alpha));

  if (color.startsWith("#")) {
    let hex = color.replace("#", "");
    if (hex.length === 3) hex = hex.split("").map(c => c + c).join("");
    if (hex.length === 6) {
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      return `rgba(${r}, ${g}, ${b}, ${a})`;
    }
  }

  if (color.startsWith("hsl(") || color.startsWith("hsla(")) {
    const isHsla = color.startsWith("hsla(");
    const inner = color.slice(isHsla ? 5 : 4, -1).trim();
    const isModern = !inner.includes(",");
    if (isModern) {
      const base = inner.replace(/\s*\/\s*[\d.]+$/, "").trim();
      return `hsl(${base} / ${a})`;
    }
    const base = inner.replace(/,\s*[\d.]+$/, "").trim();
    return `hsla(${base}, ${a})`;
  }

  if (color.startsWith("rgba(")) {
    return color.replace(/,\s*[\d.]+\)$/, `, ${a})`);
  }

  if (color.startsWith("rgb(")) {
    return color.replace("rgb(", "rgba(").replace(")", `, ${a})`);
  }

  return color;
}
