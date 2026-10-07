export class CorsConfigurationError extends Error {
  readonly code = 'CORS_CONFIGURATION_INVALID';

  constructor(message: string) {
    super(message);
    this.name = 'CorsConfigurationError';
  }
}

function normalizeOrigin(candidate: string): string {
  let parsed: URL;
  try {
    parsed = new URL(candidate);
  } catch {
    throw new CorsConfigurationError('CORS_ALLOWED_ORIGINS entries must be valid HTTP(S) origins');
  }

  if (
    !['http:', 'https:'].includes(parsed.protocol) ||
    parsed.username ||
    parsed.password ||
    parsed.pathname !== '/' ||
    parsed.search ||
    parsed.hash
  ) {
    throw new CorsConfigurationError(
      'CORS_ALLOWED_ORIGINS entries must be HTTP(S) origins without credentials, paths, queries, or fragments',
    );
  }

  return parsed.origin;
}

/** Resolve and validate the exact browser origins admitted by this process. */
export function resolveCorsAllowedOrigins(
  env: NodeJS.ProcessEnv = process.env,
): ReadonlySet<string> {
  const origins = new Set<string>();
  for (const candidate of (env.CORS_ALLOWED_ORIGINS ?? '').split(',')) {
    const value = candidate.trim();
    if (!value) continue;
    if (value === '*') {
      if (isProductionRuntime(env, ['AEF_ENV'])) {
        throw new CorsConfigurationError(
          'CORS_ALLOWED_ORIGINS does not permit wildcard origins in production',
        );
      }
      origins.add(value);
      continue;
    }
    origins.add(normalizeOrigin(value));
  }
  return origins;
}

export function isCorsOriginAllowed(origin: string, allowedOrigins: ReadonlySet<string>): boolean {
  if (allowedOrigins.has('*')) return true;
  try {
    return allowedOrigins.has(normalizeOrigin(origin));
  } catch {
    return false;
  }
}
import { isProductionRuntime } from '@workspace/aef-contracts';
