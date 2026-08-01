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
    customerFacingRoutes.map((surface) => surface.source_owner.repository),
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

  const observedAt = Date.parse(String(value.observed_at));
  if (!Number.isFinite(observedAt)) failures.push('observed_at must be a parseable ISO-8601 time');
  else {
    const ageMs = nowMs - observedAt;
    if (ageMs > MAX_OBSERVATION_AGE_MS) failures.push('observed_at is older than seven days');
    if (ageMs < -MAX_FUTURE_SKEW_MS) {
      failures.push('observed_at is more than five minutes in the future');
    }
  }

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
  failures.push(...validatePublicSurfaceRegistry(registry, nowMs));
  if (Array.isArray(value.surfaces)) {
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
  body?: { cancel: () => Promise<void> } | null;
  headers?: { get: (name: string) => string | null };
};
export type SurfaceFetch = (
  url: string,
  init: { method: 'GET'; redirect: 'manual'; signal: AbortSignal },
) => Promise<SurfaceFetchResponse>;

export async function verifyLivePublicSurfaces(
  registry: PublicSurfaceRegistry,
  fetchSurface: SurfaceFetch = fetch as unknown as SurfaceFetch,
): Promise<string[]> {
  const registryFailures = validatePublicSurfaceRegistry(registry);
  if (registryFailures.length > 0) {
    return registryFailures.map((failure) => `registry: ${failure}`).sort();
  }

  const results = await Promise.all(
    registry.surfaces.map(async (surface): Promise<string[]> => {
      try {
        const approvedTarget = approvedTargetFor(surface.id);
        if (!approvedTarget) return [`${surface.id}: no approved live probe target`];

        const request = async (url: string): Promise<SurfaceFetchResponse> => {
          const response = await fetchSurface(url, {
            method: 'GET',
            redirect: 'manual',
            signal: AbortSignal.timeout(15_000),
          });
          await response.body?.cancel();
          return response;
        };

        const firstResponse = await request(approvedTarget.canonicalUrl);
        let response = firstResponse;
        if (approvedTarget.canonicalUrl !== approvedTarget.finalUrl) {
          if (firstResponse.status < 300 || firstResponse.status >= 400) {
            return [
              `${surface.id}: expected an approved redirect from ${approvedTarget.canonicalUrl}`,
            ];
          }
          const location = firstResponse.headers?.get('location');
          const redirectTarget = location
            ? normalizedUrl(new URL(location, approvedTarget.canonicalUrl).toString())
            : null;
          if (redirectTarget !== approvedTarget.finalUrl) {
            return [
              `${surface.id}: expected redirect to ${approvedTarget.finalUrl}, observed ${String(location)}`,
            ];
          }
          response = await request(approvedTarget.finalUrl);
        } else if (firstResponse.status >= 300 && firstResponse.status < 400) {
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
        return failures;
      } catch (error) {
        return [`${surface.id}: live probe failed: ${String(error)}`];
      }
    }),
  );
  return results.flat().sort();
}
