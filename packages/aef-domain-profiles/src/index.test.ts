import { describe, it, expect } from "vitest";
import {
  createDefaultProfileRegistry,
  DomainProfileSchema,
  ProfileRegistry,
} from "./index.js";

describe("createDefaultProfileRegistry", () => {
  it("registers all six domain profiles", () => {
    const registry = createDefaultProfileRegistry();
    const ids = registry.listProfiles();
    expect(ids).toContain("vessels_maritime_risk");
    expect(ids).toContain("lyte_governance_ops");
    expect(ids).toContain("terra_real_estate_intel");
    expect(ids).toContain("aegis_security_incident");
    expect(ids).toContain("prism_legal_matter");
    expect(ids).toContain("carlota_private_advisory");
  });

  it("resolves each profile without error", () => {
    const registry = createDefaultProfileRegistry();
    for (const profileId of registry.listProfiles()) {
      const profile = registry.resolve(profileId);
      expect(profile.profileId).toBe(profileId);
      expect(profile.version).toMatch(/^\d+\.\d+\.\d+$/);
    }
  });

  it("validates all profiles with DomainProfileSchema", () => {
    const registry = createDefaultProfileRegistry();
    for (const profileId of registry.listProfiles()) {
      const profile = registry.resolve(profileId);
      const result = DomainProfileSchema.safeParse(profile);
      expect(result.success).toBe(true);
    }
  });
});

describe("ProfileRegistry version management", () => {
  it("activates a specific version", () => {
    const registry = new ProfileRegistry();
    registry.register({ profileId: "test-profile", version: "1.0.0", domain: "compliance", displayName: "Test", description: "Test profile", priorityTerms: [], boostTerms: [], exactMatchFieldClasses: [], defaultMetadataFilters: {}, rerankEnabled: false, maxCandidates: 100, maxResults: 10, denseWeight: 0.6, keywordWeight: 0.4, truncationPolicy: { strategy: "truncate", maxTokens: 512 }, retentionDays: 90, provenanceRequired: false, metadata: {} });
    registry.register({ profileId: "test-profile", version: "2.0.0", domain: "compliance", displayName: "Test v2", description: "Test profile v2", priorityTerms: [], boostTerms: [], exactMatchFieldClasses: [], defaultMetadataFilters: {}, rerankEnabled: false, maxCandidates: 100, maxResults: 10, denseWeight: 0.6, keywordWeight: 0.4, truncationPolicy: { strategy: "truncate", maxTokens: 512 }, retentionDays: 90, provenanceRequired: false, metadata: {} }, { allowOverwrite: false });

    registry.activate("test-profile", "2.0.0");
    expect(registry.getActiveVersion("test-profile")).toBe("2.0.0");
  });

  it("stages a version for specific tenants", () => {
    const registry = new ProfileRegistry();
    registry.register({ profileId: "staged-profile", version: "1.0.0", domain: "legal", displayName: "Staged", description: "Staged profile", priorityTerms: [], boostTerms: [], exactMatchFieldClasses: [], defaultMetadataFilters: {}, rerankEnabled: false, maxCandidates: 100, maxResults: 10, denseWeight: 0.6, keywordWeight: 0.4, truncationPolicy: { strategy: "truncate", maxTokens: 512 }, retentionDays: 90, provenanceRequired: false, metadata: {} });
    registry.register({ profileId: "staged-profile", version: "2.0.0", domain: "legal", displayName: "Staged v2", description: "Staged profile v2", priorityTerms: [], boostTerms: [], exactMatchFieldClasses: [], defaultMetadataFilters: {}, rerankEnabled: false, maxCandidates: 100, maxResults: 10, denseWeight: 0.6, keywordWeight: 0.4, truncationPolicy: { strategy: "truncate", maxTokens: 512 }, retentionDays: 90, provenanceRequired: false, metadata: {} }, { allowOverwrite: false });

    registry.stageForTenants("staged-profile", "2.0.0", ["tenant-abc"]);
    const forStaged = registry.resolve("staged-profile", "tenant-abc");
    expect(forStaged.version).toBe("2.0.0");

    const forOther = registry.resolve("staged-profile", "tenant-xyz");
    expect(forOther.version).toBe("1.0.0");
  });

  it("rolls back to previous version", () => {
    const registry = new ProfileRegistry();
    const base = { profileId: "rollback-profile", version: "1.0.0", domain: "maritime" as const, displayName: "Rollback", description: "Test", priorityTerms: [], boostTerms: [], exactMatchFieldClasses: [], defaultMetadataFilters: {}, rerankEnabled: false, maxCandidates: 100, maxResults: 10, denseWeight: 0.6, keywordWeight: 0.4, truncationPolicy: { strategy: "truncate" as const, maxTokens: 512 }, retentionDays: 90, provenanceRequired: false, metadata: {} };
    registry.register(base);
    registry.register({ ...base, version: "2.0.0", displayName: "Rollback v2" }, { allowOverwrite: false });
    registry.activate("rollback-profile", "2.0.0");
    expect(registry.getActiveVersion("rollback-profile")).toBe("2.0.0");

    const rolledBack = registry.rollback("rollback-profile");
    expect(rolledBack).toBe("1.0.0");
    expect(registry.getActiveVersion("rollback-profile")).toBe("1.0.0");
  });

  it("throws on duplicate registration without allowOverwrite", () => {
    const registry = new ProfileRegistry();
    const profile = { profileId: "dup-profile", version: "1.0.0", domain: "advisory" as const, displayName: "Dup", description: "Test", priorityTerms: [], boostTerms: [], exactMatchFieldClasses: [], defaultMetadataFilters: {}, rerankEnabled: false, maxCandidates: 100, maxResults: 10, denseWeight: 0.6, keywordWeight: 0.4, truncationPolicy: { strategy: "truncate" as const, maxTokens: 512 }, retentionDays: 90, provenanceRequired: false, metadata: {} };
    registry.register(profile);
    expect(() => registry.register(profile)).toThrow("already registered");
  });

  it("throws on unknown profile resolution", () => {
    const registry = new ProfileRegistry();
    expect(() => registry.resolve("does-not-exist")).toThrow("not found");
  });
});
