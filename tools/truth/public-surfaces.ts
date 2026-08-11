import { XMLParser, XMLValidator } from 'fast-xml-parser';

export const PUBLIC_SURFACE_REGISTRY_SCHEMA = 'szl.public-surfaces.registry/v1';
export const PUBLIC_SURFACE_MANIFEST_SCHEMA = 'szl.public-surfaces/v1';
export const PUBLIC_SURFACE_GENERATOR_ID =
  'tools/truth/generate-public-surfaces.ts@szl.public-surfaces/v1';

export type SurfaceKind = 'WEB' | 'API' | 'METADATA';
export type SurfaceAudience = 'INVESTOR' | 'DEVELOPER' | 'OPERATOR' | 'MACHINE';
export type SurfaceMode = 'LIVE' | 'MIXED' | 'DOCUMENTATION' | 'UNAVAILABLE';
export type SurfaceAvailability = 'REACHABLE' | 'REDIRECTED' | 'UNAVAILABLE';
export type SourceOwnerRole = 'RUNTIME_OWNER' | 'CLAIM_OWNER' | 'REMEDIATION_OWNER';

export type PublicSurface = {
  id: string;
  name: string;
  kind: SurfaceKind;
  audience: SurfaceAudience[];
  mode: SurfaceMode;
  availability: SurfaceAvailability;
  canonical_url: string;
  source_owner: {
    repository: string;
    path: string;
    role: SourceOwnerRole;
  };
  observation: {
    method: 'GET';
    status: number;
    final_url: string;
  };
  note: string;
};

export type PublicSurfaceRegistry = {
  schema: typeof PUBLIC_SURFACE_REGISTRY_SCHEMA;
  observed_at: string;
  surfaces: PublicSurface[];
};

export type PublicSurfaceSummary = {
  declared: number;
  customer_facing_products: number;
  customer_facing_routes: number;
  by_availability: Record<SurfaceAvailability, number>;
  by_mode: Record<SurfaceMode, number>;
};

export type PublicSurfaceManifest = {
  schema: typeof PUBLIC_SURFACE_MANIFEST_SCHEMA;
  generated_by: typeof PUBLIC_SURFACE_GENERATOR_ID;
  observed_at: string;
  summary: PublicSurfaceSummary;
  surfaces: PublicSurface[];
};

const ALLOWED_KINDS = new Set<SurfaceKind>(['WEB', 'API', 'METADATA']);
const ALLOWED_AUDIENCES = new Set<SurfaceAudience>([
  'INVESTOR',
  'DEVELOPER',
  'OPERATOR',
  'MACHINE',
]);
const ALLOWED_MODES = new Set<SurfaceMode>(['LIVE', 'MIXED', 'DOCUMENTATION', 'UNAVAILABLE']);
const ALLOWED_AVAILABILITY = new Set<SurfaceAvailability>([
  'REACHABLE',
  'REDIRECTED',
  'UNAVAILABLE',
]);
const ALLOWED_OWNER_ROLES = new Set<SourceOwnerRole>([
  'RUNTIME_OWNER',
  'CLAIM_OWNER',
  'REMEDIATION_OWNER',
]);
const MAX_OBSERVATION_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_FUTURE_SKEW_MS = 5 * 60 * 1000;
const MAX_METADATA_BODY_BYTES = 128 * 1024;
const JSON_WHITESPACE = new Set([' ', '\t', '\n', '\r']);
const KILLINCHU_SOURCE_REVISION = '859e26cf27164b38c4e289e40a751ce80d403368';
const KILLINCHU_MANIFEST_SHA256 =
  '7730a0334485ed3ca4754b38bd288ac004258918f0ede46719e72ae2a2ede960';
const KILLINCHU_ATTESTATION_ID = '39971795';
const LIVE_SURFACE_PROBE_CONCURRENCY = 4;
const LIVE_SURFACE_RETRY_DELAYS_MS = [750, 1_500] as const;
const TRANSIENT_TRANSPORT_CODES = new Set([
  'EAI_AGAIN',
  'ECONNRESET',
  'ETIMEDOUT',
  'UND_ERR_CONNECT_TIMEOUT',
  'UND_ERR_SOCKET',
]);
// A worker owns the whole surface transaction. The approved two-hop redirect path is therefore
// bounded to 2 * (3 * 15 seconds + 750 ms + 1,500 ms) = 94.5 seconds of slot occupancy.

type ApprovedSurfaceTarget = Readonly<{
  canonicalUrl: string;
  finalUrl: string;
}>;

const APPROVED_PUBLIC_SURFACE_TARGETS = {
  'a11oy-build-info-api': {
    canonicalUrl: 'https://szlholdings-a11oy.hf.space/api/build-info',
    finalUrl: 'https://szlholdings-a11oy.hf.space/api/build-info',
  },
  'a11oy-console': {
    canonicalUrl: 'https://a-11-oy.com/console',
    finalUrl: 'https://a-11-oy.com/console',
  },
  'a11oy-docs': {
    canonicalUrl: 'https://a-11-oy.com/docs',
    finalUrl: 'https://a-11-oy.com/docs',
  },
  'a11oy-ecosystem-atlas': {
    canonicalUrl: 'https://a-11-oy.com/ecosystem',
    finalUrl: 'https://a-11-oy.com/ecosystem',
  },
  'a11oy-front-door': {
    canonicalUrl: 'https://a-11-oy.com/',
    finalUrl: 'https://a-11-oy.com/',
  },
  'a11oy-net-chat-gap': {
    canonicalUrl: 'https://a11oy.net/chat',
    finalUrl: 'https://a11oy.net/chat',
  },
  'a11oy-net-code-gap': {
    canonicalUrl: 'https://a11oy.net/code',
    finalUrl: 'https://a11oy.net/code',
  },
  'a11oy-net-robots-gap': {
    canonicalUrl: 'https://a11oy.net/robots.txt',
    finalUrl: 'https://a11oy.net/robots.txt',
  },
  'a11oy-net-sitemap-gap': {
    canonicalUrl: 'https://a11oy.net/sitemap.xml',
    finalUrl: 'https://a11oy.net/sitemap.xml',
  },
  'a11oy-net-thesis': {
    canonicalUrl: 'https://a11oy.net/',
    finalUrl: 'https://a11oy.net/',
  },
  'a11oy-net-webmanifest-gap': {
    canonicalUrl: 'https://a11oy.net/manifest.webmanifest',
    finalUrl: 'https://a11oy.net/manifest.webmanifest',
  },
  'a11oy-observability': {
    canonicalUrl: 'https://a-11-oy.com/observability',
    finalUrl: 'https://a-11-oy.com/observability',
  },
  'a11oy-product-introduction': {
    canonicalUrl: 'https://a-11-oy.com/a11oy/',
    finalUrl: 'https://a-11-oy.com/a11oy/',
  },
  'a11oy-readiness-api': {
    canonicalUrl: 'https://szlholdings-a11oy.hf.space/readyz',
    finalUrl: 'https://szlholdings-a11oy.hf.space/readyz',
  },
  'a11oy-receipt-verifier': {
    canonicalUrl: 'https://a-11-oy.com/verify',
    finalUrl: 'https://a-11-oy.com/verify',
  },
  'a11oy-spaces-registry': {
    canonicalUrl: 'https://a-11-oy.com/spaces',
    finalUrl: 'https://a-11-oy.com/spaces',
  },
  'a11oy-trust-center': {
    canonicalUrl: 'https://a-11-oy.com/trust',
    finalUrl: 'https://a-11-oy.com/trust',
  },
  'a11oy-wires': {
    canonicalUrl: 'https://a-11-oy.com/wires',
    finalUrl: 'https://a-11-oy.com/wires',
  },
  'killinchu-build-info-api': {
    canonicalUrl: 'https://szlholdings-killinchu.hf.space/api/build-info',
    finalUrl: 'https://szlholdings-killinchu.hf.space/api/build-info',
  },
  'killinchu-public-console': {
    canonicalUrl: 'https://a-11-oy.com/killinchu',
    finalUrl: 'https://szlholdings-killinchu.hf.space/',
  },
  'killinchu-readiness-api': {
    canonicalUrl: 'https://szlholdings-killinchu.hf.space/readyz',
    finalUrl: 'https://szlholdings-killinchu.hf.space/readyz',
  },
  'legacy-aegis-route': {
    canonicalUrl: 'https://a-11-oy.com/aegis/',
    finalUrl: 'https://a-11-oy.com/aegis/',
  },
  'legacy-carlota-jo-route': {
    canonicalUrl: 'https://a-11-oy.com/carlota-jo/',
    finalUrl: 'https://a-11-oy.com/carlota-jo/',
  },
  'legacy-command-route': {
    canonicalUrl: 'https://a-11-oy.com/command/',
    finalUrl: 'https://a-11-oy.com/command/',
  },
  'legacy-counsel-route': {
    canonicalUrl: 'https://a-11-oy.com/counsel/',
    finalUrl: 'https://a-11-oy.com/counsel/',
  },
  'legacy-lyte-route': {
    canonicalUrl: 'https://a-11-oy.com/lyte/',
    finalUrl: 'https://a-11-oy.com/lyte/',
  },
  'legacy-pulse-route': {
    canonicalUrl: 'https://a-11-oy.com/pulse/',
    finalUrl: 'https://a-11-oy.com/pulse/',
  },
  'legacy-terra-route': {
    canonicalUrl: 'https://a-11-oy.com/terra/',
    finalUrl: 'https://a-11-oy.com/terra/',
  },
  'legacy-vessels-route': {
    canonicalUrl: 'https://a-11-oy.com/vessels/',
    finalUrl: 'https://a-11-oy.com/vessels/',
  },
} as const satisfies Record<string, ApprovedSurfaceTarget>;

function approvedTargetFor(surfaceId: string): ApprovedSurfaceTarget | null {
  if (!Object.hasOwn(APPROVED_PUBLIC_SURFACE_TARGETS, surfaceId)) {
    return null;
  }
  return APPROVED_PUBLIC_SURFACE_TARGETS[surfaceId as keyof typeof APPROVED_PUBLIC_SURFACE_TARGETS];
}

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function validateObservationTimestamp(
  value: Record<string, unknown>,
  nowMs: number,
  requireFreshObservation: boolean,
): string[] {
  const failures: string[] = [];
  const observedAt = Date.parse(String(value.observed_at));
  if (!Number.isFinite(observedAt)) {
    return ['observed_at must be a parseable ISO-8601 time'];
  }

  const ageMs = nowMs - observedAt;
  if (requireFreshObservation && ageMs > MAX_OBSERVATION_AGE_MS) {
    failures.push('observed_at is older than seven days');
  }
  if (ageMs < -MAX_FUTURE_SKEW_MS) {
    failures.push('observed_at is more than five minutes in the future');
  }
  return failures;
}

/**
 * Deliberate freshness audit for consumers that require a recent committed
 * snapshot. Ordinary schema validation accepts historical snapshots because
 * their timestamp remains honest; current route state is checked separately
 * by verifyLivePublicSurfaces.
 */
export function validatePublicSurfaceObservationFreshness(
  value: unknown,
  nowMs = Date.now(),
): string[] {
  if (!isObject(value)) return ['registry must be an object'];
  return validateObservationTimestamp(value, nowMs, true);
}

function normalizedUrl(value: string): string | null {
  try {
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase();
    const isIpLiteral = /^\d{1,3}(?:\.\d{1,3}){3}$/.test(hostname) || hostname.includes(':');
    if (
      url.protocol !== 'https:' ||
      url.username !== '' ||
      url.password !== '' ||
      url.port !== '' ||
      hostname === 'localhost' ||
      hostname.endsWith('.localhost') ||
      isIpLiteral
    ) {
      return null;
    }
    return url.toString();
  } catch {
    return null;
  }
}

export function isCustomerFacingRouted(surface: PublicSurface): boolean {
  return (
    surface.kind === 'WEB' &&
    surface.availability !== 'UNAVAILABLE' &&
    surface.audience.some((audience) => audience === 'INVESTOR' || audience === 'DEVELOPER')
  );
}

export function summarizePublicSurfaces(surfaces: PublicSurface[]): PublicSurfaceSummary {
  const byAvailability: Record<SurfaceAvailability, number> = {
    REACHABLE: 0,
    REDIRECTED: 0,
    UNAVAILABLE: 0,
  };
  const byMode: Record<SurfaceMode, number> = {
    LIVE: 0,
    MIXED: 0,
    DOCUMENTATION: 0,
    UNAVAILABLE: 0,
  };

  for (const surface of surfaces) {
    byAvailability[surface.availability] += 1;
    byMode[surface.mode] += 1;
  }

  const customerFacingRoutes = surfaces.filter(isCustomerFacingRouted);
  const customerFacingProducts = new Set(
    customerFacingRoutes
      .filter((surface) => surface.mode !== 'DOCUMENTATION')
      .map((surface) => surface.source_owner.repository.toLowerCase()),
  );

  return {
    declared: surfaces.length,
    customer_facing_products: customerFacingProducts.size,
    customer_facing_routes: customerFacingRoutes.length,
    by_availability: byAvailability,
    by_mode: byMode,
  };
}

export function validatePublicSurfaceRegistry(value: unknown, nowMs = Date.now()): string[] {
  const failures: string[] = [];
  if (!isObject(value)) return ['registry must be an object'];
  if (value.schema !== PUBLIC_SURFACE_REGISTRY_SCHEMA) {
    failures.push(`schema must equal ${PUBLIC_SURFACE_REGISTRY_SCHEMA}`);
  }

  failures.push(...validateObservationTimestamp(value, nowMs, false));

  if (!Array.isArray(value.surfaces) || value.surfaces.length === 0) {
    failures.push('surfaces must be a non-empty array');
    return failures;
  }

  const ids = new Set<string>();
  const urls = new Set<string>();
  for (const [index, rawSurface] of value.surfaces.entries()) {
    const prefix = `surfaces[${index}]`;
    if (!isObject(rawSurface)) {
      failures.push(`${prefix} must be an object`);
      continue;
    }
    const surface = rawSurface as Partial<PublicSurface>;
    const approvedTarget = typeof surface.id === 'string' ? approvedTargetFor(surface.id) : null;
    if (typeof surface.id !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(surface.id)) {
      failures.push(`${prefix}.id must be a lowercase kebab-case identifier`);
    } else if (ids.has(surface.id)) failures.push(`${prefix}.id duplicates ${surface.id}`);
    else ids.add(surface.id);
    if (typeof surface.id === 'string' && !approvedTarget) {
      failures.push(`${prefix}.id is not an approved public probe target`);
    }

    if (typeof surface.name !== 'string' || surface.name.trim().length < 3) {
      failures.push(`${prefix}.name must be descriptive`);
    }
    if (!ALLOWED_KINDS.has(surface.kind as SurfaceKind)) {
      failures.push(`${prefix}.kind is not canonical`);
    }
    if (!Array.isArray(surface.audience) || surface.audience.length === 0) {
      failures.push(`${prefix}.audience must be a non-empty array`);
    } else {
      const seenAudience = new Set<string>();
      for (const audience of surface.audience) {
        if (!ALLOWED_AUDIENCES.has(audience as SurfaceAudience)) {
          failures.push(`${prefix}.audience contains noncanonical value ${String(audience)}`);
        }
        if (seenAudience.has(String(audience))) {
          failures.push(`${prefix}.audience duplicates ${String(audience)}`);
        }
        seenAudience.add(String(audience));
      }
    }
    if (!ALLOWED_MODES.has(surface.mode as SurfaceMode)) {
      failures.push(`${prefix}.mode is not canonical`);
    }
    if (!ALLOWED_AVAILABILITY.has(surface.availability as SurfaceAvailability)) {
      failures.push(`${prefix}.availability is not canonical`);
    }

    const canonical =
      typeof surface.canonical_url === 'string' ? normalizedUrl(surface.canonical_url) : null;
    if (!canonical) failures.push(`${prefix}.canonical_url must be an absolute HTTPS URL`);
    else if (urls.has(canonical)) failures.push(`${prefix}.canonical_url duplicates ${canonical}`);
    else urls.add(canonical);
    if (canonical && approvedTarget && canonical !== approvedTarget.canonicalUrl) {
      failures.push(`${prefix}.canonical_url does not match the approved target for ${surface.id}`);
    }

    if (!isObject(surface.source_owner)) {
      failures.push(`${prefix}.source_owner must be an object`);
    } else {
      const owner = surface.source_owner;
      if (
        typeof owner.repository !== 'string' ||
        !/^szl-holdings\/[a-z0-9][a-z0-9._-]*$/i.test(owner.repository)
      ) {
        failures.push(`${prefix}.source_owner.repository must name an SZL Holdings repository`);
      }
      if (
        typeof owner.path !== 'string' ||
        owner.path.length === 0 ||
        owner.path.startsWith('/') ||
        owner.path.includes('..')
      ) {
        failures.push(`${prefix}.source_owner.path must be a repository-relative path`);
      }
      if (!ALLOWED_OWNER_ROLES.has(owner.role as SourceOwnerRole)) {
        failures.push(`${prefix}.source_owner.role is not canonical`);
      }
      if (surface.availability !== 'UNAVAILABLE' && owner.role !== 'RUNTIME_OWNER') {
        failures.push(`${prefix} is routed but lacks a RUNTIME_OWNER`);
      }
    }

    if (!isObject(surface.observation)) {
      failures.push(`${prefix}.observation must be an object`);
    } else {
      const observation = surface.observation;
      if (observation.method !== 'GET')
        failures.push(`${prefix}.observation.method must equal GET`);
      if (
        !Number.isInteger(observation.status) ||
        Number(observation.status) < 100 ||
        Number(observation.status) > 599
      ) {
        failures.push(`${prefix}.observation.status must be an HTTP status`);
      }
      const finalUrl =
        typeof observation.final_url === 'string' ? normalizedUrl(observation.final_url) : null;
      if (!finalUrl) failures.push(`${prefix}.observation.final_url must be an absolute HTTPS URL`);
      if (finalUrl && approvedTarget && finalUrl !== approvedTarget.finalUrl) {
        failures.push(
          `${prefix}.observation.final_url does not match the approved target for ${surface.id}`,
        );
      }

      const status = Number(observation.status);
      const successful = status >= 200 && status < 400;
      if (surface.availability === 'UNAVAILABLE' && status < 400) {
        failures.push(`${prefix} is UNAVAILABLE but its observation is not an HTTP failure`);
      }
      if (surface.availability !== 'UNAVAILABLE' && !successful) {
        failures.push(`${prefix} is routed but its observation is not successful`);
      }
      if (canonical && finalUrl) {
        if (surface.availability === 'REACHABLE' && canonical !== finalUrl) {
          failures.push(`${prefix} is REACHABLE but redirects to ${finalUrl}`);
        }
        if (surface.availability === 'REDIRECTED' && canonical === finalUrl) {
          failures.push(`${prefix} is REDIRECTED but has no distinct final URL`);
        }
      }
    }

    if (surface.availability === 'UNAVAILABLE' && surface.mode !== 'UNAVAILABLE') {
      failures.push(`${prefix} is UNAVAILABLE and must use UNAVAILABLE mode`);
    }
    if (surface.availability !== 'UNAVAILABLE' && surface.mode === 'UNAVAILABLE') {
      failures.push(`${prefix} is routed and cannot use UNAVAILABLE mode`);
    }
    if (typeof surface.note !== 'string' || surface.note.trim().length < 20) {
      failures.push(`${prefix}.note must state the evidence boundary`);
    }
  }

  return failures;
}

export function buildPublicSurfaceManifest(registry: PublicSurfaceRegistry): PublicSurfaceManifest {
  const surfaces = structuredClone(registry.surfaces).sort((a, b) => a.id.localeCompare(b.id));
  return {
    schema: PUBLIC_SURFACE_MANIFEST_SCHEMA,
    generated_by: PUBLIC_SURFACE_GENERATOR_ID,
    observed_at: registry.observed_at,
    summary: summarizePublicSurfaces(surfaces),
    surfaces,
  };
}

export function validatePublicSurfaceManifest(value: unknown, nowMs = Date.now()): string[] {
  if (!isObject(value)) return ['manifest must be an object'];
  const failures: string[] = [];
  if (value.schema !== PUBLIC_SURFACE_MANIFEST_SCHEMA) {
    failures.push(`schema must equal ${PUBLIC_SURFACE_MANIFEST_SCHEMA}`);
  }
  if (value.generated_by !== PUBLIC_SURFACE_GENERATOR_ID) {
    failures.push(`generated_by must equal ${PUBLIC_SURFACE_GENERATOR_ID}`);
  }

  const registry = {
    schema: PUBLIC_SURFACE_REGISTRY_SCHEMA,
    observed_at: value.observed_at,
    surfaces: value.surfaces,
  };
  const registryFailures = validatePublicSurfaceRegistry(registry, nowMs);
  failures.push(...registryFailures);
  if (Array.isArray(value.surfaces) && registryFailures.length === 0) {
    const expected = summarizePublicSurfaces(value.surfaces as PublicSurface[]);
    if (JSON.stringify(value.summary) !== JSON.stringify(expected)) {
      failures.push('summary does not match the surface records');
    }
    const ids = (value.surfaces as PublicSurface[]).map((surface) => surface.id);
    const sorted = [...ids].sort((a, b) => a.localeCompare(b));
    if (JSON.stringify(ids) !== JSON.stringify(sorted))
      failures.push('surfaces must be sorted by id');
  }
  return failures;
}

type SurfaceFetchResponse = {
  status: number;
  url: string;
  body?: {
    cancel: () => Promise<void>;
    getReader?: () => {
      read: () => Promise<{ done: boolean; value?: Uint8Array }>;
      cancel: () => Promise<void>;
      releaseLock?: () => void;
    };
  } | null;
  headers?: { get: (name: string) => string | null };
};
export type SurfaceFetch = (
  url: string,
  init: { method: 'GET'; redirect: 'manual'; signal: AbortSignal },
) => Promise<SurfaceFetchResponse>;

async function cancelResponseBody(response: SurfaceFetchResponse): Promise<void> {
  await response.body?.cancel();
}

async function readBoundedResponseBody(
  surfaceId: string,
  response: SurfaceFetchResponse,
  bodyKind: 'metadata' | 'API' = 'metadata',
): Promise<{ text: string | null; failure: string | null }> {
  const contentLength = response.headers?.get('content-length');
  if (contentLength && /^\d+$/.test(contentLength)) {
    const declaredBytes = Number(contentLength);
    if (declaredBytes > MAX_METADATA_BODY_BYTES) {
      await cancelResponseBody(response);
      return {
        text: null,
        failure: `${surfaceId}: ${bodyKind} body exceeds ${MAX_METADATA_BODY_BYTES} bytes`,
      };
    }
  }

  const reader = response.body?.getReader?.();
  if (!reader) {
    await cancelResponseBody(response);
    return { text: null, failure: `${surfaceId}: ${bodyKind} response body is unavailable` };
  }

  const chunks: Uint8Array[] = [];
  let totalBytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value) continue;
      totalBytes += value.byteLength;
      if (totalBytes > MAX_METADATA_BODY_BYTES) {
        await reader.cancel();
        return {
          text: null,
          failure: `${surfaceId}: ${bodyKind} body exceeds ${MAX_METADATA_BODY_BYTES} bytes`,
        };
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock?.();
  }

  const bodyBytes = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    bodyBytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  try {
    return { text: new TextDecoder('utf-8', { fatal: true }).decode(bodyBytes), failure: null };
  } catch {
    return { text: null, failure: `${surfaceId}: ${bodyKind} body is not valid UTF-8` };
  }
}

export type StrictJsonParseResult =
  | Readonly<{ ok: true; value: unknown }>
  | Readonly<{ ok: false }>;

export function parseDuplicateFreeJson(input: string): StrictJsonParseResult {
  const failed = Symbol('invalid-json');
  type ParsedValue = unknown | typeof failed;
  let index = 0;

  const skipWhitespace = (): void => {
    while (JSON_WHITESPACE.has(input[index] ?? '')) index += 1;
  };

  const readString = (): string | typeof failed => {
    skipWhitespace();
    if (input[index] !== '"') return failed;
    const start = index;
    index += 1;
    let escaped = false;
    while (index < input.length) {
      const character = input[index];
      index += 1;
      if (escaped) {
        escaped = false;
        continue;
      }
      if (character === '\\') {
        escaped = true;
        continue;
      }
      if (character === '"') {
        try {
          const value = JSON.parse(input.slice(start, index)) as unknown;
          return typeof value === 'string' ? value : failed;
        } catch {
          return failed;
        }
      }
      if (character.charCodeAt(0) < 0x20) return failed;
    }
    return failed;
  };

  const parseValue = (depth: number): ParsedValue => {
    if (depth > 64) return failed;
    skipWhitespace();
    const character = input[index];

    if (character === '"') return readString();
    if (character === '{') {
      index += 1;
      const object = Object.create(null) as Record<string, unknown>;
      const seen = new Set<string>();
      skipWhitespace();
      if (input[index] === '}') {
        index += 1;
        return object;
      }
      while (index < input.length) {
        const key = readString();
        if (key === failed || seen.has(key)) return failed;
        seen.add(key);
        skipWhitespace();
        if (input[index] !== ':') return failed;
        index += 1;
        const value = parseValue(depth + 1);
        if (value === failed) return failed;
        object[key] = value;
        skipWhitespace();
        if (input[index] === '}') {
          index += 1;
          return object;
        }
        if (input[index] !== ',') return failed;
        index += 1;
      }
      return failed;
    }
    if (character === '[') {
      index += 1;
      const array: unknown[] = [];
      skipWhitespace();
      if (input[index] === ']') {
        index += 1;
        return array;
      }
      while (index < input.length) {
        const value = parseValue(depth + 1);
        if (value === failed) return failed;
        array.push(value);
        skipWhitespace();
        if (input[index] === ']') {
          index += 1;
          return array;
        }
        if (input[index] !== ',') return failed;
        index += 1;
      }
      return failed;
    }
    if (input.startsWith('true', index)) {
      index += 4;
      return true;
    }
    if (input.startsWith('false', index)) {
      index += 5;
      return false;
    }
    if (input.startsWith('null', index)) {
      index += 4;
      return null;
    }

    const number = input.slice(index).match(/^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/);
    if (!number) return failed;
    index += number[0].length;
    const value = Number(number[0]);
    return Number.isFinite(value) ? value : failed;
  };

  const value = parseValue(0);
  if (value === failed) return { ok: false };
  skipWhitespace();
  return index === input.length ? { ok: true, value } : { ok: false };
}

function hasExactKeys(value: Record<string, unknown>, expected: readonly string[]): boolean {
  const actual = Object.keys(value).sort((left, right) => left.localeCompare(right));
  const canonical = [...expected].sort((left, right) => left.localeCompare(right));
  return (
    actual.length === canonical.length && actual.every((key, index) => key === canonical[index])
  );
}

function isExactKillinchuBuildInfo(value: unknown): boolean {
  if (!isObject(value)) return false;
  if (
    !hasExactKeys(value, ['status', 'service', 'build', 'receipt_minted', 'release_receipt']) ||
    value.status !== 'OBSERVED' ||
    value.service !== 'killinchu' ||
    value.receipt_minted !== true ||
    !isObject(value.build) ||
    !isObject(value.release_receipt)
  ) {
    return false;
  }

  const build = value.build;
  const receipt = value.release_receipt;
  return (
    hasExactKeys(build, ['state', 'revision', 'revision_source']) &&
    build.state === 'OBSERVED' &&
    build.revision === KILLINCHU_SOURCE_REVISION &&
    build.revision_source === 'env:SZL_GIT_SHA' &&
    hasExactKeys(receipt, [
      'state',
      'source_revision',
      'subject',
      'subject_sha256',
      'attestation_id',
      'attestation_url',
      'verification',
    ]) &&
    receipt.state === 'GITHUB_OIDC_ATTESTED' &&
    receipt.source_revision === KILLINCHU_SOURCE_REVISION &&
    receipt.subject === 'hf-deploy-manifest.json' &&
    receipt.subject_sha256 === KILLINCHU_MANIFEST_SHA256 &&
    receipt.attestation_id === KILLINCHU_ATTESTATION_ID &&
    receipt.attestation_url ===
      `https://github.com/szl-holdings/killinchu/attestations/${KILLINCHU_ATTESTATION_ID}` &&
    receipt.verification ===
      'Download hf-deploy-manifest.json from the matching deployment run and run gh attestation verify hf-deploy-manifest.json -R szl-holdings/killinchu'
  );
}

function isExactKillinchuReadiness(value: unknown): boolean {
  if (!isObject(value)) return false;
  return (
    hasExactKeys(value, [
      'status',
      'organ',
      'khipu_backend',
      'khipu_durable',
      'khipu_depth',
      'khipu_chain_ok',
      'khipu_first_break_seq',
      'doctrine',
    ]) &&
    value.status === 'ready' &&
    value.organ === 'killinchu' &&
    value.khipu_backend === 'sqlite' &&
    value.khipu_durable === true &&
    Number.isSafeInteger(value.khipu_depth) &&
    (value.khipu_depth as number) >= 0 &&
    value.khipu_chain_ok === true &&
    value.khipu_first_break_seq === -1 &&
    value.doctrine === 'v11'
  );
}

async function validatePublicApiResponse(
  surfaceId: string,
  response: SurfaceFetchResponse,
): Promise<string[]> {
  const contentType = response.headers?.get('content-type')?.toLowerCase() ?? '';
  if (!/^application\/(?:[a-z0-9.+-]+\+)?json(?:;|$)/i.test(contentType)) {
    await cancelResponseBody(response);
    return [`${surfaceId}: expected a JSON API response, observed ${contentType || 'missing'}`];
  }

  const { text, failure } = await readBoundedResponseBody(surfaceId, response, 'API');
  if (failure || text === null) return [failure ?? `${surfaceId}: API body is unavailable`];
  if (text.trim().length === 0) return [`${surfaceId}: API body is empty`];

  const parsed = parseDuplicateFreeJson(text);
  if (!parsed.ok) return [`${surfaceId}: API body is not valid duplicate-free JSON`];
  const payload = parsed.value;

  if (surfaceId === 'killinchu-build-info-api') {
    return isExactKillinchuBuildInfo(payload)
      ? []
      : [`${surfaceId}: API body does not match the exact source-binding contract`];
  }
  if (surfaceId === 'killinchu-readiness-api') {
    return isExactKillinchuReadiness(payload)
      ? []
      : [`${surfaceId}: API body does not match the exact readiness contract`];
  }
  return [`${surfaceId}: routed API has no body validator`];
}

function isXmlRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

const sitemapXmlParser = new XMLParser({
  allowBooleanAttributes: false,
  ignoreAttributes: false,
  ignoreDeclaration: true,
  parseAttributeValue: false,
  parseTagValue: false,
  processEntities: false,
  trimValues: true,
});

function parseSitemapXml(xml: string): Record<string, unknown> | null {
  // The sitemap contract never needs a DTD or entity declaration. Reject both
  // before parsing so external entities cannot become an input channel.
  if (/<!\s*(?:doctype|entity)\b/i.test(xml)) return null;
  if (XMLValidator.validate(xml, { allowBooleanAttributes: false }) !== true) return null;

  try {
    const parsed = sitemapXmlParser.parse(xml) as unknown;
    if (!isXmlRecord(parsed)) return null;
    const roots = Object.keys(parsed);
    return roots.length === 1 && roots[0] === 'urlset' ? parsed : null;
  } catch {
    return null;
  }
}

function isValidSitemapLocation(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  try {
    const parsed = new URL(value);
    return (
      (parsed.protocol === 'https:' || parsed.protocol === 'http:') &&
      parsed.username === '' &&
      parsed.password === ''
    );
  } catch {
    return false;
  }
}

async function validateMetadataResponse(
  surfaceId: string,
  response: SurfaceFetchResponse,
): Promise<string[]> {
  const contentType = response.headers?.get('content-type')?.toLowerCase() ?? '';
  const { text, failure } = await readBoundedResponseBody(surfaceId, response);
  if (failure || text === null) return [failure ?? `${surfaceId}: metadata body is unavailable`];

  const body = text.replace(/^\uFEFF/, '').trim();
  if (body.length === 0) return [`${surfaceId}: metadata body is empty`];
  if (/<!doctype\s+html|<html(?:\s|>)/i.test(body)) {
    return [`${surfaceId}: metadata body is an HTML response`];
  }

  if (surfaceId === 'a11oy-net-robots-gap') {
    if (!contentType.startsWith('text/plain')) {
      return [`${surfaceId}: expected a text/plain response, observed ${contentType || 'missing'}`];
    }
    const lines = body.split(/\r?\n/).map((line) => line.trim());
    const hasCrawlerPolicy = lines.some((line) => /^user-agent:\s*\*$/i.test(line));
    const hasCanonicalSitemap = lines.some((line) =>
      /^sitemap:\s*https:\/\/a11oy\.net\/sitemap\.xml$/i.test(line),
    );
    if (!hasCrawlerPolicy || !hasCanonicalSitemap) {
      return [`${surfaceId}: robots metadata must declare User-agent: * and the canonical sitemap`];
    }
    return [];
  }

  if (surfaceId === 'a11oy-net-webmanifest-gap') {
    if (!/^application\/manifest\+json(?:;|$)/i.test(contentType)) {
      return [
        `${surfaceId}: expected an application/manifest+json response, observed ${contentType || 'missing'}`,
      ];
    }
    let manifest: unknown;
    try {
      manifest = JSON.parse(body);
    } catch {
      return [`${surfaceId}: manifest metadata is not valid JSON`];
    }
    if (!isObject(manifest)) {
      return [`${surfaceId}: manifest metadata must be a JSON object`];
    }
    if (manifest.name !== 'A11oy Proof Registry' || manifest.short_name !== 'A11oy.net') {
      return [`${surfaceId}: manifest metadata has an unexpected product identity`];
    }
    if (manifest.start_url !== '/' || manifest.scope !== '/') {
      return [`${surfaceId}: manifest start_url and scope must both equal /`];
    }
    if (manifest.display !== 'minimal-ui') {
      return [`${surfaceId}: manifest display must equal minimal-ui`];
    }
    return [];
  }

  if (surfaceId === 'a11oy-net-sitemap-gap') {
    if (!/^(?:application|text)\/(?:[a-z0-9.+-]+\+)?xml(?:;|$)/i.test(contentType)) {
      return [`${surfaceId}: expected an XML response, observed ${contentType || 'missing'}`];
    }
    const parsed = parseSitemapXml(body);
    if (!parsed) {
      return [`${surfaceId}: sitemap metadata is not well-formed XML`];
    }
    const urlset = parsed.urlset;
    const urls = isXmlRecord(urlset) ? (Array.isArray(urlset.url) ? urlset.url : [urlset.url]) : [];
    const allEntriesValid =
      urls.length > 0 &&
      urls.every((entry) => isXmlRecord(entry) && isValidSitemapLocation(entry.loc));
    const hasCanonicalEntry = urls.some(
      (entry) => isXmlRecord(entry) && entry.loc === 'https://a11oy.net/',
    );
    if (
      !isXmlRecord(urlset) ||
      urlset['@_xmlns'] !== 'http://www.sitemaps.org/schemas/sitemap/0.9'
    ) {
      return [`${surfaceId}: sitemap metadata lacks the canonical urlset entry`];
    }
    if (!allEntriesValid) return [`${surfaceId}: sitemap metadata contains an invalid url entry`];
    if (!hasCanonicalEntry)
      return [`${surfaceId}: sitemap metadata lacks the canonical urlset entry`];
    return [];
  }

  return [`${surfaceId}: routed metadata has no body validator`];
}

function isTransientTransportError(error: unknown): boolean {
  if (error instanceof DOMException && error.name === 'TimeoutError') return true;

  let candidate = error;
  for (let depth = 0; depth < 2; depth += 1) {
    if (typeof candidate !== 'object' || candidate === null) break;
    const record = candidate as Record<string, unknown>;
    if (typeof record.code === 'string' && record.code.trim() !== '') {
      return TRANSIENT_TRANSPORT_CODES.has(record.code.toUpperCase());
    }
    candidate = record.cause;
  }
  return error instanceof TypeError && error.message === 'fetch failed';
}

async function requestSurface(
  url: string,
  fetchSurface: SurfaceFetch,
  validateResponse?: (response: SurfaceFetchResponse) => Promise<string[]>,
): Promise<{ response: SurfaceFetchResponse; responseFailures: string[] | null }> {
  const attempts = LIVE_SURFACE_RETRY_DELAYS_MS.length + 1;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    let response: SurfaceFetchResponse | null = null;
    try {
      response = await fetchSurface(url, {
        method: 'GET',
        redirect: 'manual',
        signal: AbortSignal.timeout(15_000),
      });
      const responseFailures = validateResponse ? await validateResponse(response) : null;
      return { response, responseFailures };
    } catch (error) {
      if (response) {
        try {
          await cancelResponseBody(response);
        } catch {
          // Preserve the transport/body error that controls retry classification.
        }
      }
      if (!isTransientTransportError(error) || attempt === attempts) {
        throw error;
      }
      const retryDelayMs = LIVE_SURFACE_RETRY_DELAYS_MS[attempt - 1];
      if (retryDelayMs === undefined) {
        throw new Error('surface retry schedule exhausted before the final attempt');
      }
      await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
    }
  }
  throw new Error('surface request exhausted without a result');
}

async function verifyLivePublicSurface(
  surface: PublicSurface,
  fetchSurface: SurfaceFetch,
): Promise<string[]> {
  try {
    const approvedTarget = approvedTargetFor(surface.id);
    if (!approvedTarget) return [`${surface.id}: no approved live probe target`];

    const validateRoutedBody =
      surface.availability !== 'UNAVAILABLE' &&
      (surface.kind === 'METADATA' ||
        surface.id === 'killinchu-build-info-api' ||
        surface.id === 'killinchu-readiness-api')
        ? async (candidate: SurfaceFetchResponse): Promise<string[]> => {
            if (candidate.status >= 200 && candidate.status < 300) {
              return surface.kind === 'METADATA'
                ? await validateMetadataResponse(surface.id, candidate)
                : await validatePublicApiResponse(surface.id, candidate);
            }
            await cancelResponseBody(candidate);
            return [];
          }
        : undefined;
    const firstResult = await requestSurface(
      approvedTarget.canonicalUrl,
      fetchSurface,
      approvedTarget.canonicalUrl === approvedTarget.finalUrl ? validateRoutedBody : undefined,
    );
    const firstResponse = firstResult.response;
    let response = firstResponse;
    let responseFailures = firstResult.responseFailures;
    if (approvedTarget.canonicalUrl !== approvedTarget.finalUrl) {
      if (firstResponse.status < 300 || firstResponse.status >= 400) {
        await cancelResponseBody(firstResponse);
        return [`${surface.id}: expected an approved redirect from ${approvedTarget.canonicalUrl}`];
      }
      const location = firstResponse.headers?.get('location');
      let redirectTarget: string | null;
      try {
        redirectTarget = location
          ? normalizedUrl(new URL(location, approvedTarget.canonicalUrl).toString())
          : null;
      } finally {
        await cancelResponseBody(firstResponse);
      }
      if (redirectTarget !== approvedTarget.finalUrl) {
        return [
          `${surface.id}: expected redirect to ${approvedTarget.finalUrl}, observed ${String(location)}`,
        ];
      }
      const finalResult = await requestSurface(
        approvedTarget.finalUrl,
        fetchSurface,
        validateRoutedBody,
      );
      response = finalResult.response;
      responseFailures = finalResult.responseFailures;
    } else if (firstResponse.status >= 300 && firstResponse.status < 400) {
      await cancelResponseBody(firstResponse);
      return [`${surface.id}: unexpected redirect from approved final destination`];
    }

    const failures: string[] = [];
    if (response.status !== surface.observation.status) {
      failures.push(
        `${surface.id}: expected HTTP ${surface.observation.status}, observed ${response.status}`,
      );
    }
    const finalUrl = normalizedUrl(response.url);
    if (finalUrl !== approvedTarget.finalUrl) {
      failures.push(
        `${surface.id}: expected final URL ${approvedTarget.finalUrl}, observed ${response.url}`,
      );
    }
    if (responseFailures) {
      failures.push(...responseFailures);
    } else {
      await cancelResponseBody(response);
    }
    return failures;
  } catch (error) {
    return [`${surface.id}: live probe failed: ${String(error)}`];
  }
}

export async function verifyLivePublicSurfaces(
  registry: PublicSurfaceRegistry,
  fetchSurface: SurfaceFetch = fetch as unknown as SurfaceFetch,
): Promise<string[]> {
  const registryFailures = validatePublicSurfaceRegistry(registry);
  if (registryFailures.length > 0) {
    return registryFailures.map((failure) => `registry: ${failure}`).sort();
  }

  const results = Array.from({ length: registry.surfaces.length }, (): string[] => []);
  let nextIndex = 0;

  const worker = async (): Promise<void> => {
    while (nextIndex < registry.surfaces.length) {
      const index = nextIndex;
      nextIndex += 1;
      const surface = registry.surfaces[index];
      if (surface === undefined) {
        throw new Error(`surface worker selected invalid registry index ${index}`);
      }
      results[index] = await verifyLivePublicSurface(surface, fetchSurface);
    }
  };

  const workerCount = Math.min(LIVE_SURFACE_PROBE_CONCURRENCY, registry.surfaces.length);
  await Promise.all(Array.from({ length: workerCount }, () => worker()));
  return results.flat().sort();
}
