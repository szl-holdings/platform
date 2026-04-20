import { describe, it, expect } from "vitest";
import {
  userListQuerySchema,
  createTenantBodySchema,
  backupBodySchema,
  observabilityTimeRangeQuerySchema,
} from "./admin";

describe("userListQuerySchema", () => {
  it("applies pagination defaults", () => {
    const r = userListQuerySchema.parse({});
    expect(r.page).toBe(1);
    expect(r.limit).toBe(50);
  });

  it("transforms isActive=true to boolean", () => {
    const r = userListQuerySchema.parse({ isActive: "true" });
    expect(r.isActive).toBe(true);
  });

  it("transforms isActive=false to boolean", () => {
    const r = userListQuerySchema.parse({ isActive: "false" });
    expect(r.isActive).toBe(false);
  });

  it("treats other isActive values as undefined", () => {
    const r = userListQuerySchema.parse({ isActive: "maybe" });
    expect(r.isActive).toBeUndefined();
  });

  it("coerces orgId from string", () => {
    expect(userListQuerySchema.parse({ orgId: "7" }).orgId).toBe(7);
  });

  it("rejects orgId <= 0", () => {
    expect(() => userListQuerySchema.parse({ orgId: 0 })).toThrow();
  });

  it("rejects search > 256 chars", () => {
    expect(() =>
      userListQuerySchema.parse({ search: "x".repeat(257) }),
    ).toThrow();
  });
});

describe("createTenantBodySchema", () => {
  it("accepts a valid request and applies plan default", () => {
    const r = createTenantBodySchema.parse({
      name: "Acme",
      slug: "acme",
      adminEmail: "owner@acme.com",
    });
    expect(r.plan).toBe("free");
  });

  it("rejects an invalid email", () => {
    expect(() =>
      createTenantBodySchema.parse({
        name: "Acme",
        slug: "acme",
        adminEmail: "not-email",
      }),
    ).toThrow();
  });

  it("rejects a slug with uppercase characters", () => {
    expect(() =>
      createTenantBodySchema.parse({
        name: "Acme",
        slug: "Acme",
        adminEmail: "o@a.com",
      }),
    ).toThrow();
  });

  it("rejects a slug shorter than 2 characters", () => {
    expect(() =>
      createTenantBodySchema.parse({
        name: "Acme",
        slug: "a",
        adminEmail: "o@a.com",
      }),
    ).toThrow();
  });

  it("rejects an unknown plan", () => {
    expect(() =>
      createTenantBodySchema.parse({
        name: "Acme",
        slug: "acme",
        adminEmail: "o@a.com",
        plan: "unlimited",
      }),
    ).toThrow();
  });

  it("rejects empty name", () => {
    expect(() =>
      createTenantBodySchema.parse({
        name: "",
        slug: "acme",
        adminEmail: "o@a.com",
      }),
    ).toThrow();
  });
});

describe("backupBodySchema", () => {
  it("applies defaults for empty body", () => {
    const r = backupBodySchema.parse({});
    expect(r.format).toBe("sql");
    expect(r.compress).toBe(true);
    expect(r.includeSchema).toBe(true);
  });

  it("accepts json format and tables list", () => {
    const r = backupBodySchema.parse({
      format: "json",
      compress: false,
      tables: ["orgs", "users"],
    });
    expect(r.format).toBe("json");
    expect(r.tables).toEqual(["orgs", "users"]);
  });

  it("rejects unsupported format", () => {
    expect(() => backupBodySchema.parse({ format: "csv" })).toThrow();
  });

  it("rejects non-array tables", () => {
    expect(() => backupBodySchema.parse({ tables: "all" })).toThrow();
  });
});

describe("observabilityTimeRangeQuerySchema", () => {
  it("defaults window to 24h", () => {
    expect(observabilityTimeRangeQuerySchema.parse({}).window).toBe("24h");
  });

  it.each(["1h", "6h", "24h", "7d"] as const)(
    "accepts window=%s",
    (window) => {
      expect(observabilityTimeRangeQuerySchema.parse({ window }).window).toBe(
        window,
      );
    },
  );

  it("rejects unknown window value", () => {
    expect(() =>
      observabilityTimeRangeQuerySchema.parse({ window: "30d" }),
    ).toThrow();
  });

  it("coerces orgId from string", () => {
    expect(
      observabilityTimeRangeQuerySchema.parse({ orgId: "12" }).orgId,
    ).toBe(12);
  });

  it("rejects orgId <= 0", () => {
    expect(() =>
      observabilityTimeRangeQuerySchema.parse({ orgId: 0 }),
    ).toThrow();
  });
});
