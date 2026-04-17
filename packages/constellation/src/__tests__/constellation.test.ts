import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  CstNodeSchema,
  CstEdgeSchema,
  CreateCstNodeSchema,
  CstQueryFiltersSchema,
  CstRelationshipFiltersSchema,
  CstSearchParamsSchema,
  AddCstEvidenceSchema,
} from "../types.ts";
import { registerAdapter, getAdapter, listAdapters, getRegisteredDomains } from "../registry.ts";
import type { ConstellationAdapter } from "../adapter.ts";
import type { CstNode, CstNodeTypeRegistration, CreateCstNode } from "../types.ts";

vi.mock("@szl-holdings/db", () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    offset: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockResolvedValue([]),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue([]),
    onConflictDoNothing: vi.fn().mockResolvedValue([]),
    onConflictDoUpdate: vi.fn().mockReturnThis(),
  },
  cstNodes: {},
  cstEdges: {},
  cstEdgeEvidence: {},
  cstNodeAliases: {},
  cstNodeTypes: {},
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn(),
  and: vi.fn(),
  gte: vi.fn(),
  ilike: vi.fn(),
  inArray: vi.fn(),
  or: vi.fn(),
  sql: vi.fn(),
}));

describe("Constellation types — Zod validation", () => {
  it("validates a valid CstNode shape", () => {
    const node = {
      id: "00000000-0000-0000-0000-000000000001",
      canonicalId: "00000000-0000-0000-0000-000000000002",
      domain: "terra",
      entityType: "property",
      labels: ["commercial"],
      name: "Test Property",
      freshness: new Date().toISOString(),
      confidence: 0.9,
      sensitivityTier: "internal",
      relatedActionIds: [],
      relatedDocumentIds: [],
      relatedExecutionIds: [],
      relatedRiskIds: [],
      extensions: {},
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const result = CstNodeSchema.safeParse(node);
    expect(result.success).toBe(true);
  });

  it("rejects a node with invalid domain", () => {
    const result = CstNodeSchema.safeParse({
      id: "00000000-0000-0000-0000-000000000001",
      canonicalId: "00000000-0000-0000-0000-000000000002",
      domain: "invalid_domain",
      entityType: "property",
      name: "Test Property",
      freshness: new Date().toISOString(),
      confidence: 0.9,
      sensitivityTier: "internal",
      relatedActionIds: [],
      relatedDocumentIds: [],
      relatedExecutionIds: [],
      relatedRiskIds: [],
      extensions: {},
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    expect(result.success).toBe(false);
  });

  it("rejects confidence out of range", () => {
    const result = CstNodeSchema.safeParse({
      id: "00000000-0000-0000-0000-000000000001",
      canonicalId: "00000000-0000-0000-0000-000000000002",
      domain: "terra",
      entityType: "property",
      name: "Test",
      freshness: new Date().toISOString(),
      confidence: 1.5,
      sensitivityTier: "internal",
      relatedActionIds: [],
      relatedDocumentIds: [],
      relatedExecutionIds: [],
      relatedRiskIds: [],
      extensions: {},
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    expect(result.success).toBe(false);
  });

  it("validates CreateCstNode with minimal required fields", () => {
    const result = CreateCstNodeSchema.safeParse({
      domain: "vessels",
      entityType: "vessel",
      name: "MV Test Ship",
    });
    expect(result.success).toBe(true);
  });

  it("validates CstEdge schema", () => {
    const edge = {
      id: "00000000-0000-0000-0000-000000000001",
      fromNodeId: "00000000-0000-0000-0000-000000000002",
      toNodeId: "00000000-0000-0000-0000-000000000003",
      relationshipType: "owns",
      confidence: 0.95,
      active: true,
      extensions: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const result = CstEdgeSchema.safeParse(edge);
    expect(result.success).toBe(true);
  });

  it("validates query filters with defaults", () => {
    const result = CstQueryFiltersSchema.safeParse({});
    expect(result.success).toBe(true);
    expect(result.data?.limit).toBe(50);
    expect(result.data?.offset).toBe(0);
  });

  it("rejects query filters with limit > 500", () => {
    const result = CstQueryFiltersSchema.safeParse({ limit: 1000 });
    expect(result.success).toBe(false);
  });

  it("validates search params", () => {
    const result = CstSearchParamsSchema.safeParse({ q: "madison avenue" });
    expect(result.success).toBe(true);
    expect(result.data?.limit).toBe(20);
  });

  it("rejects empty search query", () => {
    const result = CstSearchParamsSchema.safeParse({ q: "" });
    expect(result.success).toBe(false);
  });

  it("validates AddCstEvidence schema", () => {
    const result = AddCstEvidenceSchema.safeParse({
      edgeId: "00000000-0000-0000-0000-000000000001",
      evidenceType: "deed_record",
    });
    expect(result.success).toBe(true);
  });

  it("validates relationship filters with includeEvidence default", () => {
    const result = CstRelationshipFiltersSchema.safeParse({});
    expect(result.success).toBe(true);
    expect(result.data?.includeEvidence).toBe(false);
  });
});

describe("Constellation adapter registry", () => {
  const mockTypes: CstNodeTypeRegistration[] = [
    {
      domain: "platform",
      typeKey: "test_type",
      displayName: "Test Type",
    },
  ];

  const mockAdapter: ConstellationAdapter = {
    domain: "platform",
    nodeTypes: mockTypes,
    async upsertEntity(input: CreateCstNode): Promise<CstNode> {
      return {
        id: "00000000-0000-0000-0000-000000000099",
        canonicalId: "00000000-0000-0000-0000-000000000100",
        domain: input.domain,
        entityType: input.entityType,
        labels: input.labels ?? [],
        name: input.name,
        freshness: new Date().toISOString(),
        confidence: input.confidence ?? 1.0,
        sensitivityTier: input.sensitivityTier ?? "internal",
        relatedActionIds: [],
        relatedDocumentIds: [],
        relatedExecutionIds: [],
        relatedRiskIds: [],
        extensions: {},
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    },
    async lookupByAlias(_aliasType: string, _aliasValue: string): Promise<CstNode | null> {
      return null;
    },
  };

  it("registers an adapter and retrieves it", () => {
    registerAdapter(mockAdapter);
    const retrieved = getAdapter("platform");
    expect(retrieved).toBeDefined();
    expect(retrieved?.domain).toBe("platform");
  });

  it("lists all registered adapters", () => {
    const adapters = listAdapters();
    expect(adapters.length).toBeGreaterThan(0);
  });

  it("returns registered domains", () => {
    const domains = getRegisteredDomains();
    expect(domains).toContain("platform");
  });

  it("adapter can upsert an entity", async () => {
    const adapter = getAdapter("platform");
    expect(adapter).toBeDefined();
    const node = await adapter!.upsertEntity({
      domain: "platform",
      entityType: "test_type",
      name: "Test Entity",
    });
    expect(node.name).toBe("Test Entity");
    expect(node.domain).toBe("platform");
  });

  it("adapter lookup returns null for unknown alias", async () => {
    const adapter = getAdapter("platform");
    const result = await adapter!.lookupByAlias("unknown_type", "unknown_value");
    expect(result).toBeNull();
  });
});

describe("Constellation node type registrations", () => {
  it("terra adapter has correct node types", async () => {
    const { terraAdapter } = await import("../adapters/terra.ts");
    expect(terraAdapter.domain).toBe("terra");
    expect(terraAdapter.nodeTypes.length).toBeGreaterThanOrEqual(4);
    const typeKeys = terraAdapter.nodeTypes.map((t) => t.typeKey);
    expect(typeKeys).toContain("property");
    expect(typeKeys).toContain("lender");
    expect(typeKeys).toContain("owner");
    expect(typeKeys).toContain("parcel");
  });

  it("vessels adapter has correct node types", async () => {
    const { vesselsAdapter } = await import("../adapters/vessels.ts");
    expect(vesselsAdapter.domain).toBe("vessels");
    const typeKeys = vesselsAdapter.nodeTypes.map((t) => t.typeKey);
    expect(typeKeys).toContain("vessel");
    expect(typeKeys).toContain("voyage");
    expect(typeKeys).toContain("port");
    expect(typeKeys).toContain("sanctions_entity");
  });

  it("aegis adapter has correct node types", async () => {
    const { aegisAdapter } = await import("../adapters/aegis.ts");
    expect(aegisAdapter.domain).toBe("aegis");
    const typeKeys = aegisAdapter.nodeTypes.map((t) => t.typeKey);
    expect(typeKeys).toContain("asset");
    expect(typeKeys).toContain("identity");
    expect(typeKeys).toContain("control");
    expect(typeKeys).toContain("incident");
  });

  it("prism adapter has correct node types", async () => {
    const { prismAdapter } = await import("../adapters/prism.ts");
    expect(prismAdapter.domain).toBe("prism");
    const typeKeys = prismAdapter.nodeTypes.map((t) => t.typeKey);
    expect(typeKeys).toContain("matter");
    expect(typeKeys).toContain("filing");
    expect(typeKeys).toContain("regulation");
    expect(typeKeys).toContain("evidence");
  });

  it("imperium adapter has correct node types", async () => {
    const { imperiumAdapter } = await import("../adapters/imperium.ts");
    expect(imperiumAdapter.domain).toBe("imperium");
    const typeKeys = imperiumAdapter.nodeTypes.map((t) => t.typeKey);
    expect(typeKeys).toContain("tenant");
    expect(typeKeys).toContain("environment");
    expect(typeKeys).toContain("deployment");
  });

  it("carlota-jo adapter has correct node types", async () => {
    const { carlotaJoAdapter } = await import("../adapters/carlota-jo.ts");
    expect(carlotaJoAdapter.domain).toBe("carlota-jo");
    const typeKeys = carlotaJoAdapter.nodeTypes.map((t) => t.typeKey);
    expect(typeKeys).toContain("household");
    expect(typeKeys).toContain("vendor");
    expect(typeKeys).toContain("schedule");
  });
});
