export const ACCENT = "#8b7ac8";

export const DOMAIN_COLORS: Record<string, string> = {
  aegis: "#ef4444",
  vessels: "#0ea5e9",
  terra: "#22c55e",
  prism: "#a855f7",
  pulse: "#f59e0b",
  default: ACCENT,
};

export const DOMAIN_ICONS: Record<string, string> = {
  aegis: "⚔",
  vessels: "⚓",
  terra: "⬢",
  prism: "⚖",
  pulse: "◉",
  default: "◆",
};

export const BASE_URL = import.meta.env.BASE_URL ?? "/command/";

export function apiUrl(path: string) {
  const base = BASE_URL.replace(/\/$/, "");
  return `${base}/api${path}`;
}

export async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    ...init,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status}: ${text || res.statusText}`);
  }
  return res.json() as Promise<T>;
}

export const OUTCOME_COLORS: Record<string, string> = {
  success: "#22c55e",
  pass: "#22c55e",
  allow: "#22c55e",
  partial: "#f59e0b",
  fail: "#ef4444",
  block: "#ef4444",
  error: "#ef4444",
  escalate: "#f59e0b",
};

export const GUARDIAN_TIER_TO_AUTONOMY: Record<string, string> = {
  T0: "read-only",
  T1: "advisory",
  T2: "supervised",
  T3: "autonomous",
  T4: "autonomous",
  autonomous: "autonomous",
  supervised: "supervised",
  advisory: "advisory",
  "read-only": "read-only",
};
