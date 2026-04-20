/**
 * Mobile env loader for the Expo client.
 *
 * Validates `EXPO_PUBLIC_*` variables with Zod at app boot so that a
 * misconfigured DOMAIN/API URL fails fast with a clear message instead of
 * silently falling back to defaults.
 *
 * Important: Expo's metro bundler statically replaces `process.env.EXPO_PUBLIC_*`
 * references at build time. References must be literal — we therefore read each
 * variable explicitly here and never iterate `process.env`.
 *
 * Usage:
 *   import { getDomainBaseUrl, getMobileEnv } from "@szl-holdings/mobile-shared";
 *   const apiBase = getDomainBaseUrl();
 */

import { z } from 'zod';

const emptyToUndefined = (v: unknown) => (typeof v === 'string' && v.trim() === '' ? undefined : v);

const domainInner = z
  .string()
  .min(1)
  .regex(/^[A-Za-z0-9.-]+(:\d+)?$/, {
    message:
      'must be a bare hostname without a scheme or path (e.g. "example.com", not "https://example.com")',
  });

const domainSchema = z.preprocess(emptyToUndefined, domainInner.optional()) as z.ZodType<
  string | undefined
>;

const optionalUrlSchema = z.preprocess(emptyToUndefined, z.string().url().optional()) as z.ZodType<
  string | undefined
>;

const optionalNonEmpty = z.preprocess(emptyToUndefined, z.string().min(1).optional()) as z.ZodType<
  string | undefined
>;

export const mobileEnvSchema = z.object({
  EXPO_PUBLIC_DOMAIN: domainSchema,
  EXPO_PUBLIC_API_URL: optionalUrlSchema,
  EXPO_PUBLIC_API_BASE_URL: optionalUrlSchema,
  EXPO_PUBLIC_ISSUER_URL: optionalUrlSchema,
  EXPO_PUBLIC_REPL_ID: optionalNonEmpty,
});

export type MobileEnv = z.infer<typeof mobileEnvSchema>;

function readRawEnv(): Record<string, string | undefined> {
  // Each reference MUST be a literal `process.env.EXPO_PUBLIC_*` access — Expo's
  // metro bundler replaces those at build time. Aliasing `process.env` defeats
  // that static replacement and would yield `undefined` in the bundled app.
  if (typeof process === 'undefined' || !process.env) return {};
  return {
    EXPO_PUBLIC_DOMAIN: process.env.EXPO_PUBLIC_DOMAIN,
    EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL,
    EXPO_PUBLIC_API_BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL,
    EXPO_PUBLIC_ISSUER_URL: process.env.EXPO_PUBLIC_ISSUER_URL,
    EXPO_PUBLIC_REPL_ID: process.env.EXPO_PUBLIC_REPL_ID,
  };
}

let _env: MobileEnv | null = null;

export function parseMobileEnv(raw: Record<string, string | undefined> = readRawEnv()): MobileEnv {
  const result = mobileEnvSchema.safeParse(raw);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  • ${i.path.join('.') || '(env)'}: ${i.message}`)
      .join('\n');
    throw new Error(`[mobile-env] EXPO_PUBLIC_* environment validation failed:\n${issues}`);
  }
  _env = result.data;
  return _env;
}

export function getMobileEnv(): MobileEnv {
  if (!_env) return parseMobileEnv();
  return _env;
}

export function resetMobileEnvCache(): void {
  _env = null;
}

/**
 * Returns `https://<EXPO_PUBLIC_DOMAIN>` or `null` when the domain is unset.
 * Throws on misconfigured EXPO_PUBLIC_* values.
 */
export function getDomainBaseUrl(): string | null {
  const env = getMobileEnv();
  if (!env.EXPO_PUBLIC_DOMAIN) return null;
  return `https://${env.EXPO_PUBLIC_DOMAIN}`;
}

/**
 * Resolves the best available API base URL, in priority order:
 *   1. EXPO_PUBLIC_API_URL
 *   2. EXPO_PUBLIC_API_BASE_URL
 *   3. https://EXPO_PUBLIC_DOMAIN
 *   4. fallback (or null when omitted)
 */
export function getApiBaseUrl(fallback: string | null = null): string | null {
  const env = getMobileEnv();
  const url =
    env.EXPO_PUBLIC_API_URL ??
    env.EXPO_PUBLIC_API_BASE_URL ??
    (env.EXPO_PUBLIC_DOMAIN ? `https://${env.EXPO_PUBLIC_DOMAIN}` : null);
  if (url) return url.replace(/\/$/, '');
  return fallback;
}
