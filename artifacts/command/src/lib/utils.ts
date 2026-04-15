import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getSeverityColor(severity: string) {
  switch (severity.toLowerCase()) {
    case "critical": return "var(--color-critical)";
    case "high": return "var(--color-high)";
    case "medium": return "var(--color-medium)";
    case "low": return "var(--color-low)";
    case "info": return "var(--color-info)";
    default: return "var(--color-fg-muted)";
  }
}

export function getDomainColor(domainId: string) {
  switch (domainId.toLowerCase()) {
    case "aegis": return "var(--color-aegis)";
    case "vessels": return "var(--color-vessels)";
    case "szl": return "var(--color-szl)";
    case "lyte": return "var(--color-lyte)";
    case "prism": return "var(--color-prism)";
    case "terra": return "var(--color-terra)";
    default: return "var(--color-fg-muted)";
  }
}
