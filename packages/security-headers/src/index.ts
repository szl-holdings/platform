/**
 * @szl-holdings/security-headers
 *
 * Shared security-header configuration for all web artifacts and the API server.
 *
 * Exports
 * -------
 * - `securityHeadersVitePlugin(options?)` — Vite plugin; wire into every
 *   artifact's vite.config.ts. Injects headers on both dev and preview servers.
 * - `buildHelmetOptions(options?)` — Returns a helmet-compatible options object
 *   consumed by the API server's app.ts.
 * - `BASELINE_CSP_DIRECTIVES` — The shared CSP directive map (read-only).
 * - `buildCspHeader(directives)` — Serialises a directives map to a
 *   Content-Security-Policy header string.
 *
 * Adding a third-party domain to the CSP allowlist
 * -------------------------------------------------
 * See `docs/csp-allowlist.md` for the full runbook.  In short: extend the
 * `additionalDirectives` option when calling either export above, or modify
 * `BASELINE_CSP_DIRECTIVES` here for platform-wide changes.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type CspDirectiveValue = string[];

export interface CspDirectives {
  defaultSrc?: CspDirectiveValue;
  scriptSrc?: CspDirectiveValue;
  styleSrc?: CspDirectiveValue;
  imgSrc?: CspDirectiveValue;
  connectSrc?: CspDirectiveValue;
  fontSrc?: CspDirectiveValue;
  objectSrc?: CspDirectiveValue;
  mediaSrc?: CspDirectiveValue;
  frameSrc?: CspDirectiveValue;
  frameAncestors?: CspDirectiveValue;
  baseUri?: CspDirectiveValue;
  formAction?: CspDirectiveValue;
  workerSrc?: CspDirectiveValue;
  manifestSrc?: CspDirectiveValue;
  upgradeInsecureRequests?: [];
}

export interface SecurityHeadersOptions {
  /**
   * Additional or replacement CSP directive values merged on top of the
   * baseline.  Each key's array is appended to the baseline's array so you
   * only need to list the extra origins.  Use `override: true` to replace
   * the entire baseline for a specific directive instead of merging.
   *
   * @example
   * // Allow Google Fonts for this artifact:
   * additionalDirectives: {
   *   styleSrc: ['https://fonts.googleapis.com'],
   *   fontSrc:  ['https://fonts.gstatic.com'],
   * }
   */
  additionalDirectives?: Partial<CspDirectives>;

  /**
   * When true, individual directive arrays from `additionalDirectives` fully
   * replace the baseline values rather than being appended.
   * Defaults to false (merge / append).
   */
  override?: boolean;

  /**
   * Set to true when the server is behind HTTPS (i.e. production).
   * Enables HSTS and `upgrade-insecure-requests`.
   * Vite plugin auto-detects NODE_ENV=production; Express callers should
   * pass this explicitly.
   */
  isProduction?: boolean;
}

// ─── Baseline CSP ─────────────────────────────────────────────────────────────

/**
 * Platform-wide baseline CSP directives.  These apply to every web artifact
 * and the API server.  Extend via `SecurityHeadersOptions.additionalDirectives`
 * or edit this object for a platform-wide change (and update the runbook).
 */
export const BASELINE_CSP_DIRECTIVES: Readonly<CspDirectives> = {
  defaultSrc: ["'self'"],
  scriptSrc: ["'self'", "'unsafe-inline'"],
  styleSrc: ["'self'", "'unsafe-inline'"],
  // 'https:' is intentionally absent from imgSrc; artifacts that display images
  // from user-supplied or third-party URLs must add origins via additionalDirectives.
  imgSrc: ["'self'", 'data:', 'blob:'],
  // connectSrc restricted to same-origin and WebSocket.
  // Artifacts that fetch from specific external APIs must add those origins
  // explicitly via additionalDirectives — see docs/csp-allowlist.md.
  connectSrc: ["'self'", 'wss:'],
  fontSrc: ["'self'", 'data:', 'https://fonts.gstatic.com'],
  objectSrc: ["'none'"],
  mediaSrc: ["'self'", 'blob:'],
  frameSrc: ["'self'"],
  frameAncestors: ["'self'"],
  baseUri: ["'self'"],
  formAction: ["'self'"],
  workerSrc: ["'self'", 'blob:'],
  manifestSrc: ["'self'"],
};

/**
 * Extra CSP values added only in development (Vite HMR, eval for source maps).
 * These are merged on top of BASELINE_CSP_DIRECTIVES when NODE_ENV !== 'production'.
 */
const DEV_EXTRA_DIRECTIVES: Partial<CspDirectives> = {
  scriptSrc: ["'unsafe-eval'"],
  connectSrc: ['ws:', 'wss:'],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Serialise a CspDirectives map to a single `Content-Security-Policy` header string.
 *
 * @example
 * buildCspHeader({ defaultSrc: ["'self'"], objectSrc: ["'none'"] })
 * // "default-src 'self'; object-src 'none'"
 */
export function buildCspHeader(directives: CspDirectives): string {
  const camelToKebab = (s: string) =>
    s.replace(/([A-Z])/g, (m) => `-${m.toLowerCase()}`);

  return Object.entries(directives)
    .filter(([, v]) => v !== undefined)
    .map(([key, values]) => {
      const name = camelToKebab(key);
      return (values as string[]).length === 0 ? name : `${name} ${(values as string[]).join(' ')}`;
    })
    .join('; ');
}

function mergeDirectives(
  base: Readonly<CspDirectives>,
  extra: Partial<CspDirectives>,
  mode: 'merge' | 'override',
): CspDirectives {
  const result: CspDirectives = { ...base };
  for (const [rawKey, extraValues] of Object.entries(extra)) {
    const key = rawKey as keyof CspDirectives;
    if (!extraValues) continue;
    if (mode === 'override') {
      (result as Record<string, unknown>)[key] = extraValues;
    } else {
      const existing = ((result as Record<string, unknown>)[key] as string[] | undefined) ?? [];
      (result as Record<string, unknown>)[key] = [...new Set([...existing, ...(extraValues as string[])])];
    }
  }
  return result;
}

function buildDirectives(options: SecurityHeadersOptions, isDev: boolean): CspDirectives {
  let directives: CspDirectives = { ...BASELINE_CSP_DIRECTIVES };

  if (isDev) {
    directives = mergeDirectives(directives, DEV_EXTRA_DIRECTIVES, 'merge');
  }

  if (options.additionalDirectives) {
    directives = mergeDirectives(
      directives,
      options.additionalDirectives,
      options.override ? 'override' : 'merge',
    );
  }

  if (!isDev && options.isProduction) {
    directives.upgradeInsecureRequests = [];
  }

  return directives;
}

// ─── Baseline response headers ────────────────────────────────────────────────

function buildBaseHeaders(isProduction: boolean): Record<string, string> {
  return {
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'X-Frame-Options': 'SAMEORIGIN',
    'Permissions-Policy':
      'camera=(), microphone=(), geolocation=(), payment=(), usb=(), ' +
      'magnetometer=(), gyroscope=(), accelerometer=()',
    'X-Permitted-Cross-Domain-Policies': 'none',
    ...(isProduction
      ? {
          'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
        }
      : {}),
  };
}

// ─── Vite plugin ──────────────────────────────────────────────────────────────

interface ViteServerLike {
  middlewares: {
    use(fn: (req: unknown, res: NodeResponse, next: () => void) => void): void;
  };
}

interface NodeResponse {
  setHeader(name: string, value: string): void;
  getHeader(name: string): string | string[] | number | undefined;
}

function applyHeaders(res: NodeResponse, headers: Record<string, string>): void {
  for (const [name, value] of Object.entries(headers)) {
    res.setHeader(name, value);
  }
}

/**
 * Vite plugin that injects the baseline security headers on **both** the dev
 * server and the preview server.  Drop this into every artifact's
 * `vite.config.ts` plugins array.
 *
 * @example
 * // vite.config.ts
 * import { securityHeadersVitePlugin } from '@szl-holdings/security-headers';
 *
 * export default defineConfig({
 *   plugins: [
 *     securityHeadersVitePlugin(),
 *     // or with per-artifact CSP additions:
 *     securityHeadersVitePlugin({
 *       additionalDirectives: { styleSrc: ['https://fonts.googleapis.com'] },
 *     }),
 *   ],
 * });
 */
export function securityHeadersVitePlugin(options: SecurityHeadersOptions = {}) {
  function makeMiddleware(isProduction: boolean, isDev: boolean) {
    const directives = buildDirectives({ ...options, isProduction }, isDev);
    const cspHeader = buildCspHeader(directives);
    const baseHeaders = buildBaseHeaders(isProduction);

    return function securityHeadersMiddleware(
      _req: unknown,
      res: NodeResponse,
      next: () => void,
    ): void {
      applyHeaders(res, baseHeaders);
      res.setHeader('Content-Security-Policy', cspHeader);
      next();
    };
  }

  return {
    name: 'security-headers',

    configureServer(server: ViteServerLike) {
      const isProduction = process.env.NODE_ENV === 'production';
      server.middlewares.use(makeMiddleware(isProduction, true));
    },

    configurePreviewServer(server: ViteServerLike) {
      const isProduction = process.env.NODE_ENV === 'production';
      server.middlewares.use(makeMiddleware(isProduction, false));
    },
  };
}

// ─── Helmet config builder (for Express / API server) ────────────────────────

/**
 * Returns a `helmet()` options object that enforces the same baseline security
 * policy as the Vite plugin.  Pass the result directly to `helmet()` in your
 * Express app.
 *
 * @example
 * // artifacts/api-server/src/app.ts
 * import helmet from 'helmet';
 * import { buildHelmetOptions } from '@szl-holdings/security-headers';
 *
 * app.use(helmet(buildHelmetOptions({ isProduction })));
 */
export function buildHelmetOptions(options: SecurityHeadersOptions = {}): Record<string, unknown> {
  const isProduction = options.isProduction ?? process.env.NODE_ENV === 'production';
  // Build directives for a server context (isDev=false) — no unsafe-eval or ws: extras.
  const directives = buildDirectives({ ...options, isProduction }, false);

  return {
    // CSP is always enabled regardless of environment to maintain consistent
    // policy across dev, staging, and production.  HSTS is still gated by
    // isProduction because non-HTTPS (dev) environments cannot honour it.
    contentSecurityPolicy: { directives: helmetDirectives(directives) },
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: { policy: 'same-origin' },
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    hsts: isProduction
      ? { maxAge: 63072000, includeSubDomains: true, preload: true }
      : false,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    frameguard: { action: 'sameorigin' },
    dnsPrefetchControl: { allow: false },
    permittedCrossDomainPolicies: { permittedPolicies: 'none' },
    xContentTypeOptions: true,
  };
}

/**
 * Convert our generic CspDirectives map to helmet's nested-array format.
 * Helmet expects `camelCase` keys mapping to arrays of strings.
 */
function helmetDirectives(directives: CspDirectives): Record<string, string[] | string[][]> {
  const out: Record<string, string[] | string[][]> = {};
  for (const [key, value] of Object.entries(directives)) {
    if (value !== undefined) {
      out[key] = value as string[];
    }
  }
  return out;
}
