import { describe, it, expect } from "vitest";
import { z } from "zod";
import {
  paginationQuerySchema,
  idParamSchema,
  slugParamSchema,
  errorEnvelopeSchema,
  successEnvelopeSchema,
  orgIdSchema,
  timestampsSchema,
  sortQuerySchema,
  bodyShape,
  queryShape,
} from "./common";

describe("bodyShape", () => {
  const schema = bodyShape({
    name: z.string().min(1),
    count: z.number().int().optional(),
  });

  it("validates declared fields", () => {
    const r = schema.parse({ name: "hello", count: 3 });
    expect(r).toMatchObject({ name: "hello", count: 3 });
  });

  it("rejects bad types on declared fields", () => {
    expect(() => schema.parse({ name: "" })).toThrow();
    expect(() => schema.parse({ name: 123 })).toThrow();
  });

  it("passes through unknown extra fields", () => {
    const r = schema.parse({ name: "x", extra: 42, more: { a: 1 } }) as Record<string, unknown>;
    expect(r["extra"]).toBe(42);
    expect(r["more"]).toEqual({ a: 1 });
  });

  it("coerces null/undefined body to empty object so optionals validate", () => {
    const optional = bodyShape({ value: z.string().optional() });
    expect(optional.parse(undefined)).toEqual({});
    expect(optional.parse(null)).toEqual({});
  });
});

describe("queryShape", () => {
  const schema = queryShape({
    page: z.coerce.number().int().min(1).optional(),
    q: z.string().max(100).optional(),
  });

  it("coerces query strings to declared types", () => {
    const r = schema.parse({ page: "5", q: "search", extra: "kept" }) as Record<string, unknown>;
    expect(r["page"]).toBe(5);
    expect(r["q"]).toBe("search");
    expect(r["extra"]).toBe("kept");
  });
});

describe("paginationQuerySchema", () => {
  it("applies defaults when omitted", () => {
    const r = paginationQuerySchema.parse({});
    expect(r).toEqual({ page: 1, limit: 50 });
  });

  it("coerces numeric strings", () => {
    const r = paginationQuerySchema.parse({ page: "3", limit: "25" });
    expect(r.page).toBe(3);
    expect(r.limit).toBe(25);
  });

  it("rejects non-positive page", () => {
    expect(() => paginationQuerySchema.parse({ page: 0 })).toThrow();
    expect(() => paginationQuerySchema.parse({ page: -1 })).toThrow();
  });

  it("rejects limit > 200", () => {
    expect(() => paginationQuerySchema.parse({ limit: 201 })).toThrow();
  });

  it("rejects limit < 1", () => {
    expect(() => paginationQuerySchema.parse({ limit: 0 })).toThrow();
  });

  it("rejects non-integer page", () => {
    expect(() => paginationQuerySchema.parse({ page: 1.5 })).toThrow();
  });

  it("accepts optional cursor string", () => {
    const r = paginationQuerySchema.parse({ cursor: "abc" });
    expect(r.cursor).toBe("abc");
  });
});

describe("idParamSchema", () => {
  it("coerces string ids", () => {
    expect(idParamSchema.parse({ id: "42" })).toEqual({ id: 42 });
  });
  it("rejects zero/negative", () => {
    expect(() => idParamSchema.parse({ id: 0 })).toThrow();
    expect(() => idParamSchema.parse({ id: -3 })).toThrow();
  });
  it("rejects missing id", () => {
    expect(() => idParamSchema.parse({})).toThrow();
  });
  it("rejects non-numeric string", () => {
    expect(() => idParamSchema.parse({ id: "abc" })).toThrow();
  });
});

describe("slugParamSchema", () => {
  it("accepts a non-empty slug", () => {
    expect(slugParamSchema.parse({ slug: "my-org" }).slug).toBe("my-org");
  });
  it("rejects empty slug", () => {
    expect(() => slugParamSchema.parse({ slug: "" })).toThrow();
  });
  it("rejects slug > 128 chars", () => {
    expect(() => slugParamSchema.parse({ slug: "x".repeat(129) })).toThrow();
  });
});

describe("errorEnvelopeSchema", () => {
  it("accepts minimal valid envelope", () => {
    const r = errorEnvelopeSchema.parse({
      error: "Bad",
      code: "BAD_REQUEST",
      requestId: "req_1",
    });
    expect(r.error).toBe("Bad");
  });
  it("accepts envelope with details and correlationId", () => {
    const r = errorEnvelopeSchema.parse({
      error: "Bad",
      code: "BAD_REQUEST",
      requestId: "req_1",
      correlationId: "corr_1",
      details: [{ path: "email", message: "Invalid" }],
    });
    expect(r.details?.length).toBe(1);
  });
  it("rejects when error is missing", () => {
    expect(() =>
      errorEnvelopeSchema.parse({ code: "X", requestId: "y" }),
    ).toThrow();
  });
  it("rejects when details items are malformed", () => {
    expect(() =>
      errorEnvelopeSchema.parse({
        error: "x",
        code: "x",
        requestId: "x",
        details: [{ path: 1 }],
      }),
    ).toThrow();
  });
});

describe("successEnvelopeSchema", () => {
  it("validates a wrapped data payload", () => {
    const schema = successEnvelopeSchema(z.object({ id: z.number() }));
    const r = schema.parse({ data: { id: 1 } });
    expect(r.data.id).toBe(1);
  });
  it("validates meta when supplied", () => {
    const schema = successEnvelopeSchema(z.string());
    const r = schema.parse({
      data: "ok",
      meta: { page: 1, limit: 10, total: 100, hasMore: true },
    });
    expect(r.meta?.page).toBe(1);
  });
  it("rejects mismatched data type", () => {
    const schema = successEnvelopeSchema(z.string());
    expect(() => schema.parse({ data: 123 })).toThrow();
  });
});

describe("orgIdSchema", () => {
  it("coerces orgId from string", () => {
    expect(orgIdSchema.parse({ orgId: "5" }).orgId).toBe(5);
  });
  it("rejects missing orgId", () => {
    expect(() => orgIdSchema.parse({})).toThrow();
  });
  it("rejects negative orgId", () => {
    expect(() => orgIdSchema.parse({ orgId: -1 })).toThrow();
  });
});

describe("timestampsSchema", () => {
  it("coerces ISO date strings", () => {
    const r = timestampsSchema.parse({
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-02T00:00:00Z",
    });
    expect(r.createdAt).toBeInstanceOf(Date);
    expect(r.updatedAt).toBeInstanceOf(Date);
  });
  it("treats updatedAt as optional", () => {
    const r = timestampsSchema.parse({ createdAt: new Date() });
    expect(r.updatedAt).toBeUndefined();
  });
  it("rejects when createdAt is missing", () => {
    expect(() => timestampsSchema.parse({})).toThrow();
  });
});

describe("sortQuerySchema", () => {
  it("defaults sortOrder to desc", () => {
    expect(sortQuerySchema.parse({})).toEqual({ sortOrder: "desc" });
  });
  it("accepts asc/desc", () => {
    expect(sortQuerySchema.parse({ sortOrder: "asc" }).sortOrder).toBe("asc");
  });
  it("rejects unknown sortOrder", () => {
    expect(() => sortQuerySchema.parse({ sortOrder: "sideways" })).toThrow();
  });
});
