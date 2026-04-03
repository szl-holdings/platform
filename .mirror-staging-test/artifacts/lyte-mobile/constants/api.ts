import Constants from "expo-constants";

type EnvName = "development" | "preview" | "production";

const ENV = (process.env.EXPO_PUBLIC_ENV ?? "development") as EnvName;

const API_URLS: Record<EnvName, string> = {
  development: process.env.EXPO_PUBLIC_API_URL ?? `https://${process.env.EXPO_PUBLIC_DOMAIN ?? "localhost"}/api`,
  preview:     process.env.EXPO_PUBLIC_API_URL ?? "https://lyte-api-staging.lyte.ai",
  production:  process.env.EXPO_PUBLIC_API_URL ?? "https://api.lyte.ai",
};

export const API_BASE_URL = API_URLS[ENV] ?? API_URLS.development;

export const API_CONFIG = {
  env: ENV,
  baseUrl: API_BASE_URL,
  timeout: ENV === "production" ? 15000 : 30000,
  retryCount: ENV === "production" ? 3 : 1,
  supportUrl: Constants.expoConfig?.extra?.supportUrl ?? "https://lyte.ai/support",
  privacyUrl: Constants.expoConfig?.extra?.privacyUrl ?? "https://lyte.ai/privacy",
  termsUrl:   Constants.expoConfig?.extra?.termsUrl   ?? "https://lyte.ai/terms",
} as const;

export function buildApiUrl(path: string): string {
  const base = API_BASE_URL.replace(/\/$/, "");
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalized}`;
}
