import type { DomainProfile, ProfileVersionRecord, RolloutState } from "./types.js";

export interface ProfileRegistryOptions {
  allowOverwrite?: boolean;
}

export class ProfileRegistry {
  private readonly versions = new Map<string, Map<string, ProfileVersionRecord>>();
  private readonly rollout = new Map<string, RolloutState>();

  register(
    profile: DomainProfile,
    options: ProfileRegistryOptions = {},
  ): void {
    const { allowOverwrite = false } = options;
    const key = `${profile.profileId}@${profile.version}`;

    if (!this.versions.has(profile.profileId)) {
      this.versions.set(profile.profileId, new Map());
    }

    const profileVersions = this.versions.get(profile.profileId)!;

    if (profileVersions.has(profile.version) && !allowOverwrite) {
      throw new Error(
        `Profile version already registered: ${key}. Use allowOverwrite:true to replace.`,
      );
    }

    const record: ProfileVersionRecord = {
      profileId: profile.profileId,
      version: profile.version,
      profile,
      stagedFor: [],
      publishedAt: new Date().toISOString(),
    };

    profileVersions.set(profile.version, record);

    if (!this.rollout.has(profile.profileId)) {
      this.rollout.set(profile.profileId, {
        profileId: profile.profileId,
        activeVersion: profile.version,
        stagedTenantIds: [],
      });
    }
  }

  activate(profileId: string, version: string): void {
    const profileVersions = this.versions.get(profileId);
    if (!profileVersions) {
      throw new Error(`Unknown profile: ${profileId}`);
    }
    if (!profileVersions.has(version)) {
      throw new Error(`Unknown version ${version} for profile ${profileId}`);
    }

    const state = this.rollout.get(profileId);
    if (state) {
      this.rollout.set(profileId, {
        ...state,
        activeVersion: version,
        stagedVersion: undefined,
        stagedTenantIds: [],
        rolloutStartedAt: undefined,
      });
    }
  }

  stageForTenants(
    profileId: string,
    version: string,
    tenantIds: string[],
  ): void {
    const profileVersions = this.versions.get(profileId);
    if (!profileVersions) {
      throw new Error(`Unknown profile: ${profileId}`);
    }
    if (!profileVersions.has(version)) {
      throw new Error(`Unknown version ${version} for profile ${profileId}`);
    }

    const state = this.rollout.get(profileId);
    if (!state) {
      throw new Error(`No rollout state for profile: ${profileId}`);
    }

    const record = profileVersions.get(version)!;
    const updatedRecord: ProfileVersionRecord = {
      ...record,
      stagedFor: [...new Set([...record.stagedFor, ...tenantIds])],
    };
    profileVersions.set(version, updatedRecord);

    this.rollout.set(profileId, {
      ...state,
      stagedVersion: version,
      stagedTenantIds: [...new Set([...(state.stagedTenantIds ?? []), ...tenantIds])],
      rolloutStartedAt: state.rolloutStartedAt ?? new Date().toISOString(),
    });
  }

  rollback(profileId: string): string {
    const state = this.rollout.get(profileId);
    if (!state) {
      throw new Error(`No rollout state for profile: ${profileId}`);
    }

    const profileVersions = this.versions.get(profileId);
    if (!profileVersions) {
      throw new Error(`Unknown profile: ${profileId}`);
    }

    const sortedVersions = Array.from(profileVersions.keys()).sort(
      (a, b) => compareVersions(b, a),
    );

    const currentIdx = sortedVersions.indexOf(state.activeVersion);
    const previousVersion = sortedVersions[currentIdx + 1];

    if (!previousVersion) {
      throw new Error(
        `No previous version available for rollback on profile: ${profileId}`,
      );
    }

    this.rollout.set(profileId, {
      ...state,
      activeVersion: previousVersion,
      stagedVersion: undefined,
      stagedTenantIds: [],
      rolloutStartedAt: undefined,
    });

    return previousVersion;
  }

  resolve(profileId: string, tenantId?: string): DomainProfile {
    const state = this.rollout.get(profileId);
    if (!state) {
      throw new Error(`Profile not found: ${profileId}`);
    }

    const profileVersions = this.versions.get(profileId)!;

    if (
      tenantId &&
      state.stagedVersion &&
      state.stagedTenantIds.includes(tenantId)
    ) {
      const staged = profileVersions.get(state.stagedVersion);
      if (staged) return staged.profile;
    }

    const active = profileVersions.get(state.activeVersion);
    if (!active) {
      throw new Error(
        `Active version ${state.activeVersion} not found for profile: ${profileId}`,
      );
    }

    return active.profile;
  }

  getActiveVersion(profileId: string): string {
    const state = this.rollout.get(profileId);
    if (!state) throw new Error(`Profile not found: ${profileId}`);
    return state.activeVersion;
  }

  getRolloutState(profileId: string): RolloutState | undefined {
    return this.rollout.get(profileId);
  }

  listProfiles(): string[] {
    return Array.from(this.versions.keys());
  }

  listVersions(profileId: string): string[] {
    const profileVersions = this.versions.get(profileId);
    if (!profileVersions) return [];
    return Array.from(profileVersions.keys()).sort((a, b) =>
      compareVersions(b, a),
    );
  }

  getRecord(
    profileId: string,
    version: string,
  ): ProfileVersionRecord | undefined {
    return this.versions.get(profileId)?.get(version);
  }

  deprecate(profileId: string, version: string): void {
    const profileVersions = this.versions.get(profileId);
    if (!profileVersions) {
      throw new Error(`Unknown profile: ${profileId}`);
    }
    const record = profileVersions.get(version);
    if (!record) {
      throw new Error(`Unknown version ${version} for profile ${profileId}`);
    }
    profileVersions.set(version, {
      ...record,
      deprecatedAt: new Date().toISOString(),
    });
  }
}

function compareVersions(a: string, b: string): number {
  const partsA = a.split(".").map(Number);
  const partsB = b.split(".").map(Number);
  for (let i = 0; i < 3; i++) {
    const diff = (partsA[i] ?? 0) - (partsB[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

export const globalProfileRegistry = new ProfileRegistry();
