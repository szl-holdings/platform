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
  customer_facing_routed: number;
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

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function normalizedUrl(value: string): string | null {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' ? url.toString() : null;
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

  return {
    declared: surfaces.length,
    customer_facing_routed: surfaces.filter(isCustomerFacingRouted).length,
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
    if (typeof surface.id !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(surface.id)) {
      failures.push(`${prefix}.id must be a lowercase kebab-case identifier`);
    } else if (ids.has(surface.id)) failures.push(`${prefix}.id duplicates ${surface.id}`);
    else ids.add(surface.id);

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
};
export type SurfaceFetch = (
  url: string,
  init: { method: 'GET'; redirect: 'follow'; signal: AbortSignal },
) => Promise<SurfaceFetchResponse>;

export async function verifyLivePublicSurfaces(
  registry: PublicSurfaceRegistry,
  fetchSurface: SurfaceFetch = fetch as unknown as SurfaceFetch,
): Promise<string[]> {
  const results = await Promise.all(
    registry.surfaces.map(async (surface): Promise<string[]> => {
      try {
        const response = await fetchSurface(surface.canonical_url, {
          method: 'GET',
          redirect: 'follow',
          signal: AbortSignal.timeout(15_000),
        });
        await response.body?.cancel();
        const failures: string[] = [];
        if (response.status !== surface.observation.status) {
          failures.push(
            `${surface.id}: expected HTTP ${surface.observation.status}, observed ${response.status}`,
          );
        }
        const finalUrl = normalizedUrl(response.url);
        const expectedFinal = normalizedUrl(surface.observation.final_url);
        if (finalUrl !== expectedFinal) {
          failures.push(
            `${surface.id}: expected final URL ${surface.observation.final_url}, observed ${response.url}`,
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
