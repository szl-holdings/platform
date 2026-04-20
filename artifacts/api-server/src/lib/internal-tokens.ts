/**
 * Scoped internal service token registry.
 *
 * Replaces the historical single-purpose `ALLOY_INTERNAL_TOKEN` (which granted
 * blanket `super_admin` privileges) with a per-token scope model. Each token
 * declares the domain + verbs it is authorized for. New service-to-service
 * integrations MUST use scoped tokens. The legacy `ALLOY_INTERNAL_TOKEN`
 * remains accepted for backward compatibility but is logged as deprecated and
 * mapped to a constrained scope set — never granted scopes outside its
 * historical surface (alloy/agent/internal/health).
 *
 * Token configuration:
 *
 *   1. Preferred — set `INTERNAL_SERVICE_TOKENS` to a JSON array, e.g.:
 *        [
 *          { "name": "alloy-runner",  "token": "…", "scopes": ["alloy:write", "agent:write"] },
 *          { "name": "health-prober", "token": "…", "scopes": ["health:read"] }
 *        ]
 *
 *   2. Legacy — `ALLOY_INTERNAL_TOKEN=…` (deprecated, scoped automatically).
 *
 * Rotation policy: see docs/SECRETS_POLICY.md (Internal Service Tokens).
 */
import { createHmac, timingSafeEqual } from 'crypto';
import { logger } from './logger';

export type InternalScope =
  | 'alloy:read'
  | 'alloy:write'
  | 'agent:read'
  | 'agent:write'
  | 'health:read'
  | 'health:write'
  | 'internal:read'
  | 'internal:write'
  | 'usage-events:write';

export interface InternalServiceToken {
  name: string;
  token: string;
  scopes: InternalScope[];
  /** Path prefixes this token may be presented on. Empty array = any. */
  pathPrefixes: string[];
  /** True when this entry was synthesized from a deprecated env var. */
  legacy: boolean;
}

export interface InternalAgentContext {
  name: string;
  scopes: ReadonlySet<InternalScope>;
  legacy: boolean;
}

const VALID_SCOPES: ReadonlySet<InternalScope> = new Set<InternalScope>([
  'alloy:read',
  'alloy:write',
  'agent:read',
  'agent:write',
  'health:read',
  'health:write',
  'internal:read',
  'internal:write',
  'usage-events:write',
]);

/**
 * Default scopes for the deprecated ALLOY_INTERNAL_TOKEN. Locked to the
 * minimum set required by historical callers (alloy/agent + internal probes +
 * health). `super_admin` is NEVER granted. Write scopes are present only for
 * the alloy/agent surface — admin-guard requires `internal:write`, so the
 * legacy token cannot reach admin routes both by scope and by the path
 * allowlist below.
 */
const LEGACY_DEFAULT_SCOPES: InternalScope[] = [
  'alloy:read',
  'alloy:write',
  'agent:read',
  'agent:write',
  'internal:read',
  'health:read',
];

/**
 * Hard allowlist of path prefixes the legacy ALLOY_INTERNAL_TOKEN may be
 * presented on. Anything outside these prefixes is treated as if no internal
 * token was supplied (caller falls back to normal session/bearer auth).
 *
 * This is the security boundary the reviewer required: a leaked legacy token
 * cannot reach admin routes (`/api/admin/*`), tenant data routes
 * (`/api/orgs/*`), or any other surface outside the historical alloy/agent +
 * internal probe + health-detailed surface.
 *
 * Operators who need broader coverage MUST migrate to a scoped
 * `INTERNAL_SERVICE_TOKENS` entry with explicit pathPrefixes.
 */
const LEGACY_DEFAULT_PATH_PREFIXES: string[] = [
  '/api/internal/',
  '/api/alloy/agent/',
  '/api/health',
  '/health',
  '/api/env-registry',
];

const HMAC_KEY = Buffer.from('szl-internal-token-comparison-key-v2', 'utf8');

function tokenDigest(value: string): Buffer {
  return createHmac('sha256', HMAC_KEY).update(Buffer.from(value, 'utf8')).digest();
}

function constantTimeEqual(a: string, b: string): boolean {
  try {
    return timingSafeEqual(tokenDigest(a), tokenDigest(b));
  } catch {
    return false;
  }
}

function parseScopedTokens(): InternalServiceToken[] {
  const raw = process.env['INTERNAL_SERVICE_TOKENS'];
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      logger.warn('[internal-tokens] INTERNAL_SERVICE_TOKENS is not a JSON array — ignoring');
      return [];
    }
    const tokens: InternalServiceToken[] = [];
    for (const entry of parsed) {
      if (!entry || typeof entry !== 'object') continue;
      const e = entry as Record<string, unknown>;
      const name = typeof e['name'] === 'string' ? (e['name'] as string) : '';
      const token = typeof e['token'] === 'string' ? (e['token'] as string) : '';
      const rawScopes = Array.isArray(e['scopes']) ? (e['scopes'] as unknown[]) : [];
      const pathPrefixes = Array.isArray(e['pathPrefixes'])
        ? (e['pathPrefixes'] as unknown[]).filter((p): p is string => typeof p === 'string')
        : [];

      if (!name || !token) {
        logger.warn({ name }, '[internal-tokens] Skipping token entry — missing name or token');
        continue;
      }
      const scopes: InternalScope[] = [];
      for (const s of rawScopes) {
        if (typeof s === 'string' && VALID_SCOPES.has(s as InternalScope)) {
          scopes.push(s as InternalScope);
        } else {
          logger.warn({ name, scope: s }, '[internal-tokens] Ignoring unknown scope on token');
        }
      }
      if (scopes.length === 0) {
        logger.warn({ name }, '[internal-tokens] Token has no valid scopes — entry ignored');
        continue;
      }
      tokens.push({ name, token, scopes, pathPrefixes, legacy: false });
    }
    return tokens;
  } catch (err) {
    logger.warn({ err }, '[internal-tokens] Failed to parse INTERNAL_SERVICE_TOKENS — ignoring');
    return [];
  }
}

let _registry: InternalServiceToken[] | null = null;
let _registryEnvKey = '';
let _legacyDeprecationWarned = false;

function loadRegistry(): InternalServiceToken[] {
  const tokens = parseScopedTokens();
  const legacy = process.env['ALLOY_INTERNAL_TOKEN'];
  if (legacy) {
    tokens.push({
      name: 'alloy-internal-legacy',
      token: legacy,
      scopes: [...LEGACY_DEFAULT_SCOPES],
      pathPrefixes: [...LEGACY_DEFAULT_PATH_PREFIXES],
      legacy: true,
    });
  }
  return tokens;
}

function currentEnvKey(): string {
  return `${process.env['INTERNAL_SERVICE_TOKENS'] ?? ''}\u0000${process.env['ALLOY_INTERNAL_TOKEN'] ?? ''}`;
}

export function getInternalTokenRegistry(): InternalServiceToken[] {
  // Re-load whenever the source env vars change. This keeps verification cheap
  // in steady-state (cache hit) and correct under tests / hot-reloaded secrets.
  const key = currentEnvKey();
  if (_registry === null || key !== _registryEnvKey) {
    _registry = loadRegistry();
    _registryEnvKey = key;
  }
  return _registry;
}

/** Test/runtime hook to force-reload after env changes. */
export function resetInternalTokenRegistry(): void {
  _registry = null;
  _registryEnvKey = '';
  _legacyDeprecationWarned = false;
}

export function hasAnyInternalToken(): boolean {
  return getInternalTokenRegistry().length > 0;
}

export function isPathAllowedForToken(token: InternalServiceToken, path: string): boolean {
  if (token.pathPrefixes.length === 0) return true;
  return token.pathPrefixes.some((p) => path.startsWith(p));
}

export interface InternalTokenMatch {
  token: InternalServiceToken;
  context: InternalAgentContext;
}

/**
 * Match a presented header value against the configured registry. Returns null
 * if no token matches. Comparison is constant-time over an HMAC digest so
 * neither the configured token nor the presented header can leak via timing
 * or length side-channels.
 *
 * Note: this only verifies the secret. Callers must additionally check
 * `isPathAllowedForToken` and any required scopes for the route being served.
 */
export function matchInternalToken(presented: string | undefined): InternalTokenMatch | null {
  if (!presented) return null;
  const registry = getInternalTokenRegistry();
  for (const token of registry) {
    if (constantTimeEqual(token.token, presented)) {
      if (token.legacy && !_legacyDeprecationWarned) {
        _legacyDeprecationWarned = true;
        logger.warn(
          {
            scopes: token.scopes,
            allowedPathPrefixes: token.pathPrefixes,
          },
          '[internal-tokens] ALLOY_INTERNAL_TOKEN is DEPRECATED — migrate to INTERNAL_SERVICE_TOKENS with explicit per-domain scopes. See docs/SECRETS_POLICY.md.',
        );
      }
      return {
        token,
        context: {
          name: token.name,
          scopes: new Set(token.scopes),
          legacy: token.legacy,
        },
      };
    }
  }
  return null;
}

/**
 * Startup-time guardrail (call once from app bootstrap in production).
 *
 * Enforces the GAP-016 ship policy:
 *   - In production, refuse to boot when ALLOY_INTERNAL_TOKEN is the *only*
 *     internal token configured. The legacy token is broad-by-design and is
 *     accepted only as a temporary migration affordance; production deployments
 *     must define at least one scoped INTERNAL_SERVICE_TOKENS entry.
 *   - Operators with an unavoidable migration window can opt out by setting
 *     `INTERNAL_TOKENS_ALLOW_LEGACY_ONLY=true`. The opt-out emits a warning on
 *     every startup so it cannot be silently left in place.
 *
 * Throws on policy violation; safe to call multiple times.
 */
export function assertInternalTokenPolicy(opts: { isProduction: boolean }): void {
  if (!opts.isProduction) return;
  const scoped = parseScopedTokens();
  const hasLegacy = !!process.env['ALLOY_INTERNAL_TOKEN'];
  if (scoped.length > 0) return;
  if (!hasLegacy) return;
  if (process.env['INTERNAL_TOKENS_ALLOW_LEGACY_ONLY'] === 'true') {
    logger.warn(
      '[internal-tokens] Production startup ALLOWED with only ALLOY_INTERNAL_TOKEN configured because INTERNAL_TOKENS_ALLOW_LEGACY_ONLY=true. This is a temporary migration affordance — define INTERNAL_SERVICE_TOKENS and remove the override.',
    );
    return;
  }
  throw new Error(
    '[internal-tokens] Refusing to start: ALLOY_INTERNAL_TOKEN is configured but no INTERNAL_SERVICE_TOKENS are defined. ' +
      'Define at least one scoped token (see docs/SECRETS_POLICY.md) or set INTERNAL_TOKENS_ALLOW_LEGACY_ONLY=true to opt into temporary legacy-only operation.',
  );
}

export function tokenHasScope(
  ctx: InternalAgentContext | undefined,
  required: InternalScope,
): boolean {
  if (!ctx) return false;
  return ctx.scopes.has(required);
}

/**
 * Verify the legacy global header for code paths that only need a yes/no
 * answer (e.g. CSRF bypass, admin-guard fallback). Returns the matched token
 * along with whether the path is in scope. Does NOT log on success — the
 * caller decides whether to log.
 */
export function verifyInternalHeader(
  headerValue: string | undefined,
  path: string,
): InternalTokenMatch | null {
  const match = matchInternalToken(headerValue);
  if (!match) return null;
  if (!isPathAllowedForToken(match.token, path)) return null;
  return match;
}
