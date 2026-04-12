import { apiFetch } from "@szl-holdings/shared-ui";

export async function pulseFetch<T = unknown>(path: string, options?: RequestInit): Promise<T> {
  return apiFetch<T>(path, options);
}

export const RISK_COLORS = {
  critical: { bg: "hsla(2 70% 50% / 0.12)", text: "hsl(2 70% 65%)", border: "hsla(2 70% 50% / 0.28)", dot: "hsl(2 70% 50%)" },
  high: { bg: "hsla(32 88% 52% / 0.12)", text: "hsl(32 88% 62%)", border: "hsla(32 88% 52% / 0.28)", dot: "hsl(32 88% 52%)" },
  medium: { bg: "hsla(45 85% 52% / 0.12)", text: "hsl(45 85% 62%)", border: "hsla(45 85% 52% / 0.28)", dot: "hsl(45 85% 52%)" },
  low: { bg: "hsla(160 65% 42% / 0.12)", text: "hsl(160 65% 55%)", border: "hsla(160 65% 42% / 0.28)", dot: "hsl(160 65% 42%)" },
  info: { bg: "hsla(210 70% 52% / 0.10)", text: "hsl(210 70% 65%)", border: "hsla(210 70% 52% / 0.20)", dot: "hsl(210 70% 52%)" },
};

export const DOMAIN_COLORS: Record<string, string> = {
  maritime: "hsl(206 72% 52%)",
  security: "hsl(0 72% 55%)",
  analytics: "hsl(191 92% 44%)",
  infrastructure: "hsl(228 65% 60%)",
  research: "hsl(280 50% 65%)",
  creative: "hsl(320 60% 60%)",
  readiness: "hsl(140 50% 48%)",
  legal: "hsl(38 72% 58%)",
};

export const AGENT_META: Record<string, { color: string; label: string }> = {
  helmsman: { color: "hsl(206 72% 52%)", label: "Helmsman" },
  sentinel: { color: "hsl(0 72% 55%)", label: "Sentinel" },
  beacon: { color: "hsl(191 92% 44%)", label: "Terra Analytics" },
  inca: { color: "hsl(280 50% 65%)", label: "INCA" },
  zeus: { color: "hsl(228 65% 60%)", label: "Zeus" },
  compass: { color: "hsl(140 50% 48%)", label: "Compass" },
  muse: { color: "hsl(320 60% 60%)", label: "Muse" },
  alloy: { color: "hsl(38 72% 58%)", label: "Alloy" },
};

export function confidenceColor(score: number): string {
  if (score >= 80) return "hsl(160 65% 48%)";
  if (score >= 65) return "hsl(45 85% 52%)";
  if (score >= 50) return "hsl(32 88% 52%)";
  return "hsl(2 70% 55%)";
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false });
}

export function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}
