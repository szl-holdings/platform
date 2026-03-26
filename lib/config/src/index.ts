export const APP_NAME = "SZL Holdings DreamStack";
export const APP_VERSION = "0.1.0";

export const PLATFORM_APPS = [
  { slug: "stephen-site", name: "Stephen L. Portfolio", icon: "Globe", color: "#6366f1" },
  { slug: "vessels", name: "Vessels Tracker", icon: "Ship", color: "#06b6d4" },
  { slug: "firestorm", name: "Firestorm Marketing", icon: "Flame", color: "#f97316" },
  { slug: "lyte", name: "Lyte Commerce", icon: "ShoppingBag", color: "#a855f7" },
  { slug: "dreamscape", name: "Dreamscape Creative", icon: "Palette", color: "#ec4899" },
  { slug: "readiness", name: "Readiness Assessments", icon: "Shield", color: "#10b981" },
  { slug: "control-plane", name: "Admin Control Plane", icon: "Settings", color: "#64748b" },
] as const;

export type AppSlug = (typeof PLATFORM_APPS)[number]["slug"];

export const ROLES = [
  { name: "super_admin", description: "Full platform access — all apps, settings, billing, users" },
  { name: "operator", description: "Day-to-day operational access — manage data across apps" },
  { name: "analyst", description: "Read-only access to dashboards, reports, and analytics" },
  { name: "seller", description: "E-commerce and marketing tools access" },
  { name: "client_viewer", description: "External client portal — view project status and deliverables" },
  { name: "creative_user", description: "Creative tools access — Dreamscape assets and reviews" },
] as const;

export type RoleName = (typeof ROLES)[number]["name"];

export const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000;

export const PAGINATION_DEFAULTS = {
  page: 1,
  limit: 25,
  maxLimit: 100,
} as const;

export const API_RATE_LIMITS = {
  windowMs: 15 * 60 * 1000,
  maxRequests: 100,
} as const;

export function getRequiredEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export function getOptionalEnv(key: string, fallback: string = ""): string {
  return process.env[key] ?? fallback;
}

export const APP_INTEGRATIONS: Record<string, { connectors: string[]; description: string }> = {
  "stephen-site": {
    connectors: ["ai", "github", "google", "storage"],
    description: "Portfolio site uses AI for content, GitHub for repos, Google auth, file storage",
  },
  vessels: {
    connectors: ["weather", "stormglass", "shipping", "monitoring", "storage", "slack"],
    description: "Maritime intelligence uses weather/ocean APIs, shipping data, monitoring, notifications",
  },
  firestorm: {
    connectors: ["ai", "slack", "twilio", "monitoring", "posthog", "storage"],
    description: "Security simulation uses AI analysis, alerting via Slack/Twilio, analytics, monitoring",
  },
  lyte: {
    connectors: ["stripe", "hubspot", "gmail", "storage", "posthog", "shipping"],
    description: "Commerce uses payments, CRM, email, storage, analytics, logistics",
  },
  dreamscape: {
    connectors: ["ai", "figma", "storage", "google-drive", "dropbox", "elevenlabs"],
    description: "Creative tools use AI generation, design tools, storage, media",
  },
  readiness: {
    connectors: ["ai", "notion", "confluence", "google-docs", "slack", "monitoring"],
    description: "Assessments use AI scoring, documentation tools, notifications, monitoring",
  },
  "control-plane": {
    connectors: ["ai", "stripe", "slack", "twilio", "google", "notion", "github", "storage", "monitoring", "posthog", "gmail", "hubspot", "confluence", "figma", "elevenlabs", "weather", "stormglass", "shipping", "google-calendar", "google-docs", "google-drive", "dropbox", "onedrive"],
    description: "Admin panel monitors all connectors across the platform",
  },
} as const;
