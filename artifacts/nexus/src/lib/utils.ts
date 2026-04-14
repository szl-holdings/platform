import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTimeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffSec = Math.floor((now - then) / 1000);
  if (diffSec < 60) return `${diffSec}s ago`;
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  return `${Math.floor(diffSec / 86400)}d ago`;
}

export function getBaseUrl(): string {
  const devDomain = (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_DEV_DOMAIN;
  if (devDomain) return `https://${devDomain}/api-server`;
  if (typeof window !== "undefined") {
    const base = window.location.origin;
    return `${base}/api-server`;
  }
  return "/api-server";
}
