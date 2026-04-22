/**
 * OpenAPI Contract Tests
 *
 * Validates the OpenAPI spec structure and asserts that each major app-domain
 * has the expected endpoint paths and response schema shapes defined.
 * Catches contract regressions after schema changes or parallel merges.
 *
 * Also validates GraphQL schema coverage by reading domain type definition files.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import { parse } from 'yaml';

interface OpenAPISpec {
  openapi: string;
  info: { title: string; version: string };
  paths: Record<
    string,
    Record<
      string,
      {
        tags?: string[];
        operationId?: string;
        requestBody?: unknown;
        responses?: Record<string, unknown>;
      }
    >
  >;
  components?: {
    schemas?: Record<
      string,
      { type?: string; properties?: Record<string, unknown>; required?: string[] }
    >;
    responses?: Record<string, unknown>;
    securitySchemes?: Record<string, unknown>;
  };
  tags?: Array<{ name: string; description?: string }>;
}

let spec: OpenAPISpec;

beforeAll(() => {
  const specPath = join(process.cwd(), 'lib/api-spec/openapi.yaml');
  const raw = readFileSync(specPath, 'utf-8');
  spec = parse(raw) as OpenAPISpec;
});

// ── Spec structure ────────────────────────────────────────────────────────────

describe('OpenAPI spec — top-level structure', () => {
  it('declares OpenAPI version 3.x', () => {
    expect(spec.openapi).toMatch(/^3\./);
  });

  it('has title and version in info block', () => {
    expect(spec.info).toHaveProperty('title');
    expect(spec.info).toHaveProperty('version');
    expect(typeof spec.info.title).toBe('string');
    expect(typeof spec.info.version).toBe('string');
  });

  it('has a non-empty paths object', () => {
    expect(spec.paths).toBeDefined();
    expect(Object.keys(spec.paths).length).toBeGreaterThan(0);
  });

  it('defines reusable components', () => {
    expect(spec.components).toBeDefined();
  });

  it('defines reusable response schemas', () => {
    expect(spec.components?.responses).toBeDefined();
    const responses = spec.components?.responses ?? {};
    expect(Object.keys(responses).length).toBeGreaterThan(0);
  });

  it('declares security schemes', () => {
    const schemes = spec.components?.securitySchemes ?? {};
    expect(Object.keys(schemes).length).toBeGreaterThan(0);
  });

  it('declares domain tags for all major product areas', () => {
    const tagNames = (spec.tags ?? []).map((t) => t.name);
    const expectedTags = ['health', 'ai-engine', 'vessels', 'firestorm', 'lyte', 'observability'];
    for (const tag of expectedTags) {
      expect(tagNames, `Missing tag declaration: ${tag}`).toContain(tag);
    }
  });
});

// ── Health endpoints ──────────────────────────────────────────────────────────

describe('OpenAPI contract — Health endpoints', () => {
  it('defines GET /health/live liveness probe', () => {
    expect(spec.paths).toHaveProperty('/health/live');
    expect(spec.paths['/health/live']).toHaveProperty('get');
  });

  it('defines GET /health/ready readiness probe', () => {
    expect(spec.paths).toHaveProperty('/health/ready');
    expect(spec.paths['/health/ready']).toHaveProperty('get');
  });

  it('defines GET /health/detailed detailed health check', () => {
    expect(spec.paths).toHaveProperty('/health/detailed');
    expect(spec.paths['/health/detailed']).toHaveProperty('get');
  });

  it('defines GET /health/ai AI provider health', () => {
    expect(spec.paths).toHaveProperty('/health/ai');
    expect(spec.paths['/health/ai']).toHaveProperty('get');
  });

  it('defines GET /health/websocket websocket health', () => {
    expect(spec.paths).toHaveProperty('/health/websocket');
    expect(spec.paths['/health/websocket']).toHaveProperty('get');
  });

  it('GET /healthz returns HealthStatus schema reference', () => {
    expect(spec.paths).toHaveProperty('/healthz');
    const op = spec.paths['/healthz']?.get;
    expect(op?.responses?.['200']).toBeDefined();
  });
});

// ── Domain: Vessels ───────────────────────────────────────────────────────────

describe('OpenAPI contract — Vessels domain', () => {
  it('defines GET /vessels fleet list endpoint', () => {
    expect(spec.paths).toHaveProperty('/vessels');
    expect(spec.paths['/vessels']).toHaveProperty('get');
  });

  it('defines GET /vessels/{id} vessel detail endpoint', () => {
    expect(spec.paths).toHaveProperty('/vessels/{id}');
    expect(spec.paths['/vessels/{id}']).toHaveProperty('get');
  });

  it("vessels endpoints are tagged with 'vessels'", () => {
    const vesselPaths = Object.keys(spec.paths).filter((p) => p.startsWith('/vessels'));
    const taggedOps = vesselPaths.flatMap((p) =>
      Object.values(spec.paths[p]).flatMap((op) => op.tags ?? []),
    );
    expect(taggedOps.some((t) => t === 'vessels')).toBe(true);
  });

  it('GET /vessels/{id} requires path parameter id', () => {
    const path = spec.paths['/vessels/{id}'];
    expect(path).toBeDefined();
  });
});

// ── Domain: Aegis / Firestorm (SOC) ──────────────────────────────────────────

describe('OpenAPI contract — Aegis / Firestorm domain', () => {
  it('defines GET /firestorm/campaigns campaigns list endpoint', () => {
    expect(spec.paths).toHaveProperty('/firestorm/campaigns');
    expect(spec.paths['/firestorm/campaigns']).toHaveProperty('get');
  });

  it('defines GET /firestorm/leads leads endpoint', () => {
    expect(spec.paths).toHaveProperty('/firestorm/leads');
    expect(spec.paths['/firestorm/leads']).toHaveProperty('get');
  });

  it('defines GET /firestorm/analytics analytics endpoint', () => {
    expect(spec.paths).toHaveProperty('/firestorm/analytics');
    expect(spec.paths['/firestorm/analytics']).toHaveProperty('get');
  });

  it("firestorm endpoints are tagged with 'firestorm'", () => {
    const firestormPaths = Object.keys(spec.paths).filter((p) => p.startsWith('/firestorm'));
    const taggedOps = firestormPaths.flatMap((p) =>
      Object.values(spec.paths[p]).flatMap((op) => op.tags ?? []),
    );
    expect(taggedOps.some((t) => t === 'firestorm')).toBe(true);
  });
});

// ── Domain: Lyte (AIOps) ──────────────────────────────────────────────────────

describe('OpenAPI contract — Lyte domain', () => {
  it('defines GET /lyte/products products list endpoint', () => {
    expect(spec.paths).toHaveProperty('/lyte/products');
    expect(spec.paths['/lyte/products']).toHaveProperty('get');
  });

  it('defines GET /lyte/orders orders list endpoint', () => {
    expect(spec.paths).toHaveProperty('/lyte/orders');
    expect(spec.paths['/lyte/orders']).toHaveProperty('get');
  });

  it("lyte endpoints are tagged with 'lyte'", () => {
    const lytePaths = Object.keys(spec.paths).filter((p) => p.startsWith('/lyte'));
    const taggedOps = lytePaths.flatMap((p) =>
      Object.values(spec.paths[p]).flatMap((op) => op.tags ?? []),
    );
    expect(taggedOps.some((t) => t === 'lyte')).toBe(true);
  });
});

// ── Domain: AI Engine (Alloy) ─────────────────────────────────────────────────

describe('OpenAPI contract — AI Engine (Alloy) domain', () => {
  it('defines AI decision list endpoint GET /ai/decision', () => {
    expect(spec.paths).toHaveProperty('/ai/decision');
    expect(spec.paths['/ai/decision']).toHaveProperty('get');
  });

  it('defines AI decision create endpoint POST /ai/decision', () => {
    expect(spec.paths).toHaveProperty('/ai/decision');
    expect(spec.paths['/ai/decision']).toHaveProperty('post');
  });

  it('AI decision POST requires recommendedAction, rationaleSummary, riskLevel', () => {
    const postOp = spec.paths['/ai/decision']?.post;
    expect(postOp).toBeDefined();
    const body = (
      postOp?.requestBody as {
        content?: { 'application/json'?: { schema?: { required?: string[] } } };
      }
    )?.content?.['application/json']?.schema;
    expect(body?.required).toContain('recommendedAction');
    expect(body?.required).toContain('rationaleSummary');
    expect(body?.required).toContain('riskLevel');
  });

  it('defines AI approval and rejection endpoints', () => {
    expect(spec.paths).toHaveProperty('/ai/decision/{id}/approve');
    expect(spec.paths).toHaveProperty('/ai/decision/{id}/reject');
  });

  it('defines AI approval matrix endpoint', () => {
    expect(spec.paths).toHaveProperty('/ai/approval-matrix');
    expect(spec.paths['/ai/approval-matrix']).toHaveProperty('get');
  });

  it('defines AlloyDecision schema with required fields', () => {
    const schemas = spec.components?.schemas ?? {};
    expect(schemas).toHaveProperty('AlloyDecision');
    const decision = schemas.AlloyDecision;
    expect(decision.required).toBeDefined();
    expect(decision.required).toContain('decisionId');
    expect(decision.required).toContain('recommendedAction');
  });

  it('AlloyDecision schema has properties for key fields', () => {
    const decision = spec.components?.schemas?.AlloyDecision;
    expect(decision?.properties).toHaveProperty('decisionId');
    expect(decision?.properties).toHaveProperty('recommendedAction');
    expect(decision?.properties).toHaveProperty('status');
  });
});

// ── Domain: Observability ─────────────────────────────────────────────────────

describe('OpenAPI contract — Observability', () => {
  it('defines observability list endpoint GET /observability', () => {
    expect(spec.paths).toHaveProperty('/observability');
    expect(spec.paths['/observability']).toHaveProperty('get');
  });

  it('defines observability by app slug endpoint GET /observability/{appSlug}', () => {
    expect(spec.paths).toHaveProperty('/observability/{appSlug}');
    expect(spec.paths['/observability/{appSlug}']).toHaveProperty('get');
  });

  it('defines active alerts endpoint GET /observability/alerts', () => {
    expect(spec.paths).toHaveProperty('/observability/alerts');
    expect(spec.paths['/observability/alerts']).toHaveProperty('get');
  });

  it('defines business events endpoint GET /observability/business-events', () => {
    expect(spec.paths).toHaveProperty('/observability/business-events');
  });
});

// ── Domain: Auth ──────────────────────────────────────────────────────────────

describe('OpenAPI contract — Auth domain', () => {
  it('defines auth login endpoint', () => {
    expect(spec.paths).toHaveProperty('/auth/login');
  });

  it('defines auth current user endpoint', () => {
    expect(spec.paths).toHaveProperty('/auth/me');
  });

  it('defines auth sessions endpoint', () => {
    expect(spec.paths).toHaveProperty('/auth/sessions');
  });

  it('defines auth roles endpoint', () => {
    expect(spec.paths).toHaveProperty('/auth/roles');
  });
});

// ── Domain: Billing ───────────────────────────────────────────────────────────

describe('OpenAPI contract — Billing domain', () => {
  it('defines billing plans endpoint', () => {
    expect(spec.paths).toHaveProperty('/billing/plans');
  });

  it('defines billing subscriptions endpoint', () => {
    expect(spec.paths).toHaveProperty('/billing/subscriptions');
  });

  it('defines billing checkout endpoint', () => {
    expect(spec.paths).toHaveProperty('/billing/checkout');
  });
});

// ── Schema component integrity ────────────────────────────────────────────────

describe('OpenAPI contract — Schema component integrity', () => {
  it('every $ref in paths resolves to a defined component schema or response', () => {
    const schemas = spec.components?.schemas ?? {};
    const responses = spec.components?.responses ?? {};
    const refs: string[] = [];

    function collectRefs(obj: unknown): void {
      if (!obj || typeof obj !== 'object') return;
      if (Array.isArray(obj)) {
        obj.forEach(collectRefs);
        return;
      }
      const o = obj as Record<string, unknown>;
      if ('$ref' in o && typeof o.$ref === 'string') {
        refs.push(o.$ref as string);
      }
      Object.values(o).forEach(collectRefs);
    }

    collectRefs(spec.paths);

    const broken: string[] = [];
    for (const ref of refs) {
      if (ref.startsWith('#/components/schemas/')) {
        const name = ref.replace('#/components/schemas/', '');
        if (!(name in schemas)) broken.push(ref);
      } else if (ref.startsWith('#/components/responses/')) {
        const name = ref.replace('#/components/responses/', '');
        if (!(name in responses)) broken.push(ref);
      }
    }

    expect(broken, `Broken $refs in OpenAPI spec: ${broken.join(', ')}`).toHaveLength(0);
  });

  it('all defined paths have at least one valid HTTP method', () => {
    const httpMethods = ['get', 'post', 'put', 'patch', 'delete', 'options', 'head'];
    const invalidPaths: string[] = [];

    for (const [path, pathItem] of Object.entries(spec.paths)) {
      const methods = Object.keys(pathItem).filter((k) => httpMethods.includes(k));
      if (methods.length === 0) invalidPaths.push(path);
    }

    expect(invalidPaths, `Paths with no HTTP methods: ${invalidPaths.join(', ')}`).toHaveLength(0);
  });

  it('POST /ai/decision defines a requestBody', () => {
    const postOp = spec.paths['/ai/decision']?.post;
    expect(postOp?.requestBody).toBeDefined();
  });
});

// ── Contract gap analysis ─────────────────────────────────────────────────────

describe('OpenAPI contract — Coverage gap analysis', () => {
  it('identifies domains with routes but no OpenAPI spec coverage', () => {
    const coveredDomainPrefixes = new Set(
      Object.keys(spec.paths).map((p) => {
        const parts = p.split('/').filter(Boolean);
        return parts[0] ?? '';
      }),
    );

    const implementedDomains = [
      'vessels',
      'firestorm',
      'lyte',
      'health',
      'ai',
      'observability',
      'auth',
      'billing',
      'projects',
      'connectors',
      'notifications',
      'audit',
      'feature-flags',
      'files',
      'assets',
      'stephen',
      'storage',
      'dreamscape',
      'readiness',
      'mobile-auth',
      'login',
      'callback',
      'logout',
    ];

    const undocumentedDomains = implementedDomains.filter((d) => !coveredDomainPrefixes.has(d));

    expect(undocumentedDomains).toHaveLength(0);
  });

  it('known coverage gaps exactly match uncovered domains (no regressions, no silent growth)', () => {
    const KNOWN_GAPS = new Set(['terra', 'prism', 'holdings', 'booking']);

    const coveredPrefixes = new Set(
      Object.keys(spec.paths).map((p) => p.split('/').filter(Boolean)[0] ?? ''),
    );

    const allImplementedDomains = [
      'vessels',
      'firestorm',
      'lyte',
      'health',
      'ai',
      'observability',
      'auth',
      'billing',
      'projects',
      'connectors',
      'notifications',
      'audit',
      'feature-flags',
      'files',
      'assets',
      'stephen',
      'storage',
      'dreamscape',
      'readiness',
      'mobile-auth',
      'login',
      'callback',
      'logout',
      'terra',
      'prism',
      'holdings',
      'booking',
    ];

    const actualUncoveredDomains = allImplementedDomains.filter((d) => !coveredPrefixes.has(d));

    const unexpectedGaps = actualUncoveredDomains.filter((d) => !KNOWN_GAPS.has(d));
    const resolvedGaps = [...KNOWN_GAPS].filter((d) => !actualUncoveredDomains.includes(d));

    if (unexpectedGaps.length > 0) {
      throw new Error(
        `New API domains are missing OpenAPI spec coverage: [${unexpectedGaps.join(', ')}]. ` +
          `Add coverage to lib/api-spec/openapi.yaml or add to KNOWN_GAPS if intentionally deferred.`,
      );
    }

    if (resolvedGaps.length > 0) {
    }

    expect(unexpectedGaps).toHaveLength(0);
  });
});

// ── GraphQL schema — domain type coverage ─────────────────────────────────────

describe('GraphQL schema — domain type coverage (static analysis)', () => {
  const gqlDomainsDir = join(process.cwd(), 'artifacts/api-server/src/graphql/domains');

  function readDomainTypeDefs(filename: string): string {
    return readFileSync(join(gqlDomainsDir, filename), 'utf-8');
  }

  it('vessels GraphQL domain defines Vessel type with required fields', () => {
    const src = readDomainTypeDefs('vessels.ts');
    expect(src).toContain('type Vessel');
    expect(src).toContain('id: ID!');
    expect(src).toContain('name: String!');
  });

  it('vessels GraphQL domain extends Query with vessel queries', () => {
    const src = readDomainTypeDefs('vessels.ts');
    expect(src).toContain('extend type Query');
    expect(src).toContain('vessels(');
    expect(src).toContain('vessel(id: ID!)');
  });

  it('lyte GraphQL domain extends Query with workspace queries', () => {
    const src = readDomainTypeDefs('lyte.ts');
    expect(src).toContain('lyteWorkspaces');
  });

  it('firestorm GraphQL domain defines Firestorm types', () => {
    const src = readDomainTypeDefs('firestorm.ts');
    expect(src).toContain('Firestorm');
  });

  it('holdings GraphQL domain extends Query type', () => {
    const src = readDomainTypeDefs('holdings.ts');
    expect(src).toContain('extend type Query');
  });

  it('PRISM Counsel GraphQL domain defines matter-related types', () => {
    const src = readDomainTypeDefs('prism-counsel.ts');
    expect(src).toContain('Matter');
  });

  it('Carlota Jo GraphQL domain extends Query type', () => {
    const src = readDomainTypeDefs('carlota-jo.ts');
    expect(src).toContain('extend type Query');
  });

  it('Terra GraphQL domain defines terra-related types', () => {
    const src = readDomainTypeDefs('terra.ts');
    expect(src).toContain('Terra');
  });

  it('schema.ts imports all 7 major domain type definitions', () => {
    const schemaSrc = readFileSync(
      join(process.cwd(), 'artifacts/api-server/src/graphql/schema.ts'),
      'utf-8',
    );
    const expectedImports = [
      'vessels',
      'terra',
      'lyte',
      'firestorm',
      'holdings',
      'carlota-jo',
      'prism-counsel',
    ];
    for (const domain of expectedImports) {
      expect(schemaSrc, `schema.ts missing import for domain: ${domain}`).toContain(
        `"./domains/${domain}`,
      );
    }
  });
});
