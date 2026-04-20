import { describe, it, expect } from "vitest";
import {
  DomainProfileSchema,
  PrivacyLevelSchema,
  AEF_DOMAIN_PROFILE_DOMAINS,
} from "./schema.js";
import {
  ALL_DOMAIN_PROFILES,
  lyteGovernanceOps,
  vesselsMartitimeRisk,
  terraRealEstateIntel,
  aegisSecurityIncident,
  prismLegalMatter,
  carlotaPrivateAdvisory,
} from "./profiles/index.js";
import { DomainProfileRegistry, defaultProfileRegistry, ProfileRegistry } from "./registry.js";

describe("profile schema validation", () => {
  it("every profile parses against its zod schema without errors", () => {
    for (const profile of ALL_DOMAIN_PROFILES) {
      const result = DomainProfileSchema.safeParse(profile);
      const errorIssues = result.success ? [] : result.error.issues;
      expect(result.success, `Profile ${profile.profileId} failed schema parse: ${JSON.stringify(errorIssues)}`).toBe(true);
    }
  });

  it("all six domain IDs are present", () => {
    const ids = ALL_DOMAIN_PROFILES.map((p) => p.domain);
    for (const domain of AEF_DOMAIN_PROFILE_DOMAINS) {
      expect(ids).toContain(domain);
    }
  });

  it("every profile has a semver version", () => {
    for (const profile of ALL_DOMAIN_PROFILES) {
      expect(profile.version).toMatch(/^\d+\.\d+\.\d+$/);
    }
  });

  it("every profile has at least one exactMatchBoostTerm", () => {
    for (const profile of ALL_DOMAIN_PROFILES) {
      expect(profile.exactMatchBoostTerms.length, `${profile.profileId} has no boost terms`).toBeGreaterThan(0);
    }
  });

  it("every profile has topK and maxCandidates > 0", () => {
    for (const profile of ALL_DOMAIN_PROFILES) {
      expect(profile.topK).toBeGreaterThan(0);
      expect(profile.maxCandidates).toBeGreaterThanOrEqual(profile.topK);
    }
  });

  it("every profile has non-empty prompt templates", () => {
    for (const profile of ALL_DOMAIN_PROFILES) {
      expect(profile.queryPromptTemplate.template.length).toBeGreaterThan(50);
      expect(profile.documentPromptTemplate.template.length).toBeGreaterThan(50);
    }
  });

  it("every prompt template contains its required variables as {{variable}} references", () => {
    for (const profile of ALL_DOMAIN_PROFILES) {
      for (const v of profile.queryPromptTemplate.variables) {
        expect(profile.queryPromptTemplate.template).toContain(`{{${v}}}`);
      }
      for (const v of profile.documentPromptTemplate.variables) {
        expect(profile.documentPromptTemplate.template).toContain(`{{${v}}}`);
      }
    }
  });
});

describe("domain-specific exactMatchBoostTerm requirements", () => {
  it("vessels profile contains IMO-related boost term", () => {
    const terms = vesselsMartitimeRisk.exactMatchBoostTerms.map((t) => t.toLowerCase());
    expect(terms.some((t) => t.includes("imo"))).toBe(true);
  });

  it("vessels profile contains AIS boost term", () => {
    const terms = vesselsMartitimeRisk.exactMatchBoostTerms.map((t) => t.toLowerCase());
    expect(terms.some((t) => t.includes("ais"))).toBe(true);
  });

  it("prism legal profile contains docket boost term", () => {
    const terms = prismLegalMatter.exactMatchBoostTerms.map((t) => t.toLowerCase());
    expect(terms.some((t) => t.includes("docket"))).toBe(true);
  });

  it("terra profile contains parcel ID boost term", () => {
    const terms = terraRealEstateIntel.exactMatchBoostTerms.map((t) => t.toLowerCase());
    expect(terms.some((t) => t.includes("parcel") || t.includes("bbl"))).toBe(true);
  });

  it("aegis profile contains CVE boost term", () => {
    const terms = aegisSecurityIncident.exactMatchBoostTerms.map((t) => t.toLowerCase());
    expect(terms.some((t) => t.includes("cve"))).toBe(true);
  });

  it("lyte profile contains approval chain boost term", () => {
    const terms = lyteGovernanceOps.exactMatchBoostTerms.map((t) => t.toLowerCase());
    expect(terms.some((t) => t.includes("approval") || t.includes("chain"))).toBe(true);
  });

  it("carlota profile contains engagement boost term", () => {
    const terms = carlotaPrivateAdvisory.exactMatchBoostTerms.map((t) => t.toLowerCase());
    expect(terms.some((t) => t.includes("engagement"))).toBe(true);
  });
});

describe("privacy and retention policy bounds", () => {
  it("carlota and prism profiles are set to privileged privacy level", () => {
    expect(carlotaPrivateAdvisory.privacyLevel).toBe("privileged");
    expect(prismLegalMatter.privacyLevel).toBe("privileged");
  });

  it("aegis profile is set to restricted or higher privacy level", () => {
    const highPrivacy: Array<typeof aegisSecurityIncident.privacyLevel> = ["restricted", "privileged"];
    expect(highPrivacy).toContain(aegisSecurityIncident.privacyLevel);
  });

  it("all profiles have encryptAtRest and encryptInTransit enabled", () => {
    for (const profile of ALL_DOMAIN_PROFILES) {
      expect(profile.retentionRules.encryptAtRest, `${profile.profileId} missing encryptAtRest`).toBe(true);
      expect(profile.retentionRules.encryptInTransit, `${profile.profileId} missing encryptInTransit`).toBe(true);
    }
  });

  it("no profile allows cross-region replication", () => {
    for (const profile of ALL_DOMAIN_PROFILES) {
      expect(profile.retentionRules.allowCrossRegionReplication, `${profile.profileId} allows cross-region replication`).toBe(false);
    }
  });

  it("privileged profiles require deletion", () => {
    const privileged = ALL_DOMAIN_PROFILES.filter((p) => p.privacyLevel === "privileged");
    for (const profile of privileged) {
      expect(profile.retentionRules.deletionRequired, `${profile.profileId} should require deletion`).toBe(true);
    }
  });

  it("all score thresholds are within [0, 1]", () => {
    for (const profile of ALL_DOMAIN_PROFILES) {
      const t = profile.scoreThresholds;
      expect(t.minimumRelevanceScore).toBeGreaterThanOrEqual(0);
      expect(t.minimumRelevanceScore).toBeLessThanOrEqual(1);
      expect(t.rerankDropBelowScore).toBeGreaterThanOrEqual(0);
      expect(t.rerankDropBelowScore).toBeLessThanOrEqual(1);
      expect(t.exactMatchBoostFloor).toBeGreaterThanOrEqual(0);
      expect(t.exactMatchBoostFloor).toBeLessThanOrEqual(1);
      expect(t.highConfidenceThreshold).toBeGreaterThanOrEqual(0);
      expect(t.highConfidenceThreshold).toBeLessThanOrEqual(1);
    }
  });

  it("all retention day values are positive", () => {
    for (const profile of ALL_DOMAIN_PROFILES) {
      const r = profile.retentionRules;
      expect(r.defaultRetentionDays).toBeGreaterThan(0);
      expect(r.requestLogRetentionDays).toBeGreaterThan(0);
      expect(r.evidenceRetentionDays).toBeGreaterThan(0);
      expect(r.auditTrailRetentionDays).toBeGreaterThan(0);
    }
  });
});

describe("DomainProfileRegistry", () => {
  it("default registry contains all six profiles", () => {
    const snapshot = defaultProfileRegistry.snapshot();
    expect(snapshot.profileCount).toBe(6);
  });

  it("getProfileForDomain returns the correct profile", () => {
    for (const domain of AEF_DOMAIN_PROFILE_DOMAINS) {
      const profile = defaultProfileRegistry.getProfileForDomain(domain);
      expect(profile).toBeDefined();
      expect(profile?.domain).toBe(domain);
    }
  });

  it("rotate_profile_version records history and supports rollback", async () => {
    const reg = new DomainProfileRegistry();

    const secondVersion = {
      ...lyteGovernanceOps,
      version: "1.0.1",
      updatedAt: new Date().toISOString(),
    };
    reg.registerProfile(secondVersion);

    const pointer = await reg.rotate_profile_version({
      tenantId: "test-tenant",
      domain: "lyte_governance_ops",
      targetProfileId: "lyte_governance_ops",
      targetVersion: "1.0.1",
      activatedBy: "ci",
      rotationReason: "test rotation",
    });

    expect(pointer.activeVersion).toBe("1.0.1");
    expect(pointer.history).toHaveLength(1);

    const active = reg.getActiveProfileForTenant("test-tenant", "lyte_governance_ops");
    expect(active?.version).toBe("1.0.1");
  });

  it("rollback restores the previous version", async () => {
    const reg = new DomainProfileRegistry();

    const v2 = { ...vesselsMartitimeRisk, version: "1.0.1", updatedAt: new Date().toISOString() };
    reg.registerProfile(v2);

    await reg.rotate_profile_version({
      tenantId: "rollback-tenant",
      domain: "vessels_maritime_risk",
      targetProfileId: "vessels_maritime_risk",
      targetVersion: "1.0.0",
      activatedBy: "ci",
    });

    await reg.rotate_profile_version({
      tenantId: "rollback-tenant",
      domain: "vessels_maritime_risk",
      targetProfileId: "vessels_maritime_risk",
      targetVersion: "1.0.1",
      activatedBy: "ci",
      rotationReason: "upgrade",
    });

    const active = reg.getActiveProfileForTenant("rollback-tenant", "vessels_maritime_risk");
    expect(active?.version).toBe("1.0.1");

    await reg.rollback("rollback-tenant", "vessels_maritime_risk", "ci");
    const restored = reg.getActiveProfileForTenant("rollback-tenant", "vessels_maritime_risk");
    expect(restored?.version).toBe("1.0.0");
  });

  it("persists rotations + rollbacks via a ProfilePointerStore and rehydrates on startup", async () => {
    const saved = new Map<string, import("./registry.js").TenantProfilePointer>();
    const store = {
      async loadAll() {
        return Array.from(saved.values());
      },
      async save(p: import("./registry.js").TenantProfilePointer) {
        saved.set(`${p.tenantId}::${p.domain}`, p);
      },
    };

    const reg = new DomainProfileRegistry();
    reg.setStore(store);
    const v2 = { ...vesselsMartitimeRisk, version: "1.0.1", updatedAt: new Date().toISOString() };
    reg.registerProfile(v2);

    await reg.rotate_profile_version({
      tenantId: "persist-tenant",
      domain: "vessels_maritime_risk",
      targetProfileId: "vessels_maritime_risk",
      targetVersion: "1.0.1",
      activatedBy: "ci",
    });

    expect(saved.size).toBe(1);
    expect(saved.get("persist-tenant::vessels_maritime_risk")?.activeVersion).toBe("1.0.1");

    // Simulate a server restart: build a fresh registry, wire same store, hydrate.
    const reg2 = new DomainProfileRegistry();
    reg2.registerProfile(v2);
    reg2.setStore(store);
    const loaded = await reg2.hydrate();
    expect(loaded).toBe(1);
    const restored = reg2.getActiveProfileForTenant("persist-tenant", "vessels_maritime_risk");
    expect(restored?.version).toBe("1.0.1");
  });

  it("deprecateProfile prevents rotation to that version", async () => {
    const reg = new DomainProfileRegistry();
    reg.deprecateProfile("lyte_governance_ops", "1.0.0");

    const deprecated = reg.getProfile("lyte_governance_ops", "1.0.0");
    expect(deprecated?.status).toBe("deprecated");

    await expect(
      reg.rotate_profile_version({
        tenantId: "t1",
        domain: "lyte_governance_ops",
        targetProfileId: "lyte_governance_ops",
        targetVersion: "1.0.0",
        activatedBy: "ci",
      }),
    ).rejects.toThrow("deprecated");
  });

  it("rotate to non-existent profile throws", async () => {
    const reg = new DomainProfileRegistry();
    await expect(
      reg.rotate_profile_version({
        tenantId: "t1",
        domain: "lyte_governance_ops",
        targetProfileId: "does-not-exist",
        targetVersion: "9.9.9",
        activatedBy: "ci",
      }),
    ).rejects.toThrow("not found");
  });

  it("rotate_profile_version rejects cross-domain rotation", async () => {
    const reg = new DomainProfileRegistry();
    await expect(
      reg.rotate_profile_version({
        tenantId: "t1",
        domain: "vessels_maritime_risk",
        targetProfileId: "lyte_governance_ops",
        targetVersion: "1.0.0",
        activatedBy: "ci",
      }),
    ).rejects.toThrow("Domain mismatch");
  });
});

describe("ProfileRegistry (legacy API — stageForTenants / activate / rollback)", () => {
  const makeProfile = (profileId: string, version: string, domain: "compliance" | "legal" | "maritime" | "advisory") => ({
    profileId,
    version,
    domain,
    displayName: `${profileId} v${version}`,
    description: "Test profile",
    priorityTerms: [],
    boostTerms: [],
    exactMatchFieldClasses: [],
    defaultMetadataFilters: {},
    rerankEnabled: false,
    maxCandidates: 100,
    maxResults: 10,
    denseWeight: 0.6,
    keywordWeight: 0.4,
    truncationPolicy: { strategy: "truncate" as const, maxTokens: 512 },
    retentionDays: 90,
    provenanceRequired: false,
    metadata: {},
  });

  it("activates a specific version", () => {
    const registry = new ProfileRegistry();
    registry.register(makeProfile("test-profile", "1.0.0", "compliance"));
    registry.register(makeProfile("test-profile", "2.0.0", "compliance"), { allowOverwrite: false });

    registry.activate("test-profile", "2.0.0");
    expect(registry.getActiveVersion("test-profile")).toBe("2.0.0");
  });

  it("stages a version for specific tenants", () => {
    const registry = new ProfileRegistry();
    registry.register(makeProfile("staged-profile", "1.0.0", "legal"));
    registry.register(makeProfile("staged-profile", "2.0.0", "legal"), { allowOverwrite: false });

    registry.stageForTenants("staged-profile", "2.0.0", ["tenant-abc"]);
    const forStaged = registry.resolve("staged-profile", "tenant-abc");
    expect(forStaged.version).toBe("2.0.0");

    const forOther = registry.resolve("staged-profile", "tenant-xyz");
    expect(forOther.version).toBe("1.0.0");
  });

  it("rolls back to previous version", () => {
    const registry = new ProfileRegistry();
    registry.register(makeProfile("rollback-profile", "1.0.0", "maritime"));
    registry.register(makeProfile("rollback-profile", "2.0.0", "maritime"), { allowOverwrite: false });
    registry.activate("rollback-profile", "2.0.0");
    expect(registry.getActiveVersion("rollback-profile")).toBe("2.0.0");

    const rolledBack = registry.rollback("rollback-profile");
    expect(rolledBack).toBe("1.0.0");
    expect(registry.getActiveVersion("rollback-profile")).toBe("1.0.0");
  });

  it("throws on duplicate registration without allowOverwrite", () => {
    const registry = new ProfileRegistry();
    const profile = makeProfile("dup-profile", "1.0.0", "advisory");
    registry.register(profile);
    expect(() => registry.register(profile)).toThrow("already registered");
  });

  it("throws on unknown profile resolution", () => {
    const registry = new ProfileRegistry();
    expect(() => registry.resolve("does-not-exist")).toThrow("not found");
  });
});

void PrivacyLevelSchema;
