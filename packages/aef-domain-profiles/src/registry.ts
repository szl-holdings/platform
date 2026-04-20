import { ALL_DOMAIN_PROFILES } from './profiles/index.js';
import type { AEFDomain, DomainProfile } from './schema.js';
import type {
  DomainProfile as LegacyDomainProfile,
  ProfileVersionRecord,
  RolloutState,
} from './types.js';

// ---------------------------------------------------------------------------
// Legacy ProfileRegistry (HEAD API)
// Supports activate / stageForTenants / rollback / resolve patterns.
// ---------------------------------------------------------------------------

export interface ProfileRegistryOptions {
  allowOverwrite?: boolean;
}

export class ProfileRegistry {
  private readonly versions = new Map<string, Map<string, ProfileVersionRecord>>();
  private readonly rollout = new Map<string, RolloutState>();

  register(profile: LegacyDomainProfile, options: ProfileRegistryOptions = {}): void {
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

  stageForTenants(profileId: string, version: string, tenantIds: string[]): void {
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

    const sortedVersions = Array.from(profileVersions.keys()).sort((a, b) => compareVersions(b, a));

    const currentIdx = sortedVersions.indexOf(state.activeVersion);
    const previousVersion = sortedVersions[currentIdx + 1];

    if (!previousVersion) {
      throw new Error(`No previous version available for rollback on profile: ${profileId}`);
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

  resolve(profileId: string, tenantId?: string): LegacyDomainProfile {
    const state = this.rollout.get(profileId);
    if (!state) {
      throw new Error(`Profile not found: ${profileId}`);
    }

    const profileVersions = this.versions.get(profileId)!;

    if (tenantId && state.stagedVersion && state.stagedTenantIds.includes(tenantId)) {
      const staged = profileVersions.get(state.stagedVersion);
      if (staged) return staged.profile;
    }

    const active = profileVersions.get(state.activeVersion);
    if (!active) {
      throw new Error(`Active version ${state.activeVersion} not found for profile: ${profileId}`);
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
    return Array.from(profileVersions.keys()).sort((a, b) => compareVersions(b, a));
  }

  getRecord(profileId: string, version: string): ProfileVersionRecord | undefined {
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
  const partsA = a.split('.').map(Number);
  const partsB = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    const diff = (partsA[i] ?? 0) - (partsB[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

export const globalProfileRegistry = new ProfileRegistry();

// ---------------------------------------------------------------------------
// Phase 5 DomainProfileRegistry
// Tenant-aware pointer model with rotate_profile_version + rollback.
// ---------------------------------------------------------------------------

export interface ProfileVersion {
  profile: DomainProfile;
  activatedAt: string;
  activatedBy: string;
  rotationReason?: string;
}

export interface TenantProfilePointer {
  tenantId: string;
  domain: AEFDomain;
  activeProfileId: string;
  activeVersion: string;
  history: ProfileVersion[];
  rollbackAvailable: boolean;
}

export interface RotateProfileOptions {
  tenantId: string;
  domain: AEFDomain;
  targetProfileId: string;
  targetVersion: string;
  activatedBy: string;
  rotationReason?: string;
}

/**
 * Pluggable durable store for tenant pointers. The api-server provides a
 * Postgres-backed implementation that maps to the `profile_registry_pointers`
 * table; tests and library consumers can omit this and operate purely in-memory.
 */
export interface ProfilePointerStore {
  loadAll(): Promise<TenantProfilePointer[]>;
  save(pointer: TenantProfilePointer): Promise<void>;
}

export interface ProfileRegistrySnapshot {
  profileCount: number;
  domains: AEFDomain[];
  profiles: Array<{
    profileId: string;
    domain: AEFDomain;
    version: string;
    status: DomainProfile['status'];
  }>;
  generatedAt: string;
}

/**
 * AEF Domain Profile Registry.
 *
 * Maintains the versioned catalog of all six SZL domain profiles, tracks the
 * active-profile pointer per tenant per domain, and supports deterministic
 * rollback to the previous version. All mutations go through
 * `rotate_profile_version` — direct pointer assignment is not permitted.
 *
 * This is the in-process registry; production deployments should front this
 * with a durable store and publish rotation events to the orchestrator.
 */
export class DomainProfileRegistry {
  private readonly profiles = new Map<string, DomainProfile>();
  private readonly tenantPointers = new Map<string, TenantProfilePointer>();
  private store: ProfilePointerStore | undefined;

  constructor(initialProfiles: DomainProfile[] = ALL_DOMAIN_PROFILES) {
    for (const profile of initialProfiles) {
      this.registerProfile(profile);
    }
  }

  /**
   * Wire a durable pointer store. After calling this, future calls to
   * `rotate_profile_version` and `rollback` await `store.save(...)` before
   * returning, and `hydrate()` will repopulate the in-memory tenant pointer
   * map from `store.loadAll()`.
   */
  setStore(store: ProfilePointerStore): void {
    this.store = store;
  }

  /**
   * Load all persisted tenant pointers into memory. Intended to be called
   * once during API server startup, after migrations have completed and
   * after the store has been wired with `setStore`.
   */
  async hydrate(): Promise<number> {
    if (!this.store) return 0;
    const rows = await this.store.loadAll();
    for (const row of rows) {
      this.tenantPointers.set(this.tenantDomainKey(row.tenantId, row.domain), row);
    }
    return rows.length;
  }

  registerProfile(profile: DomainProfile): void {
    const key = this.profileKey(profile.profileId, profile.version);
    this.profiles.set(key, Object.freeze({ ...profile }));
  }

  getProfile(profileId: string, version?: string): DomainProfile | undefined {
    if (version) {
      return this.profiles.get(this.profileKey(profileId, version));
    }
    const candidates = Array.from(this.profiles.values()).filter(
      (p) => p.profileId === profileId && p.status !== 'deprecated',
    );
    if (candidates.length === 0) return undefined;
    candidates.sort((a, b) => b.version.localeCompare(a.version, undefined, { numeric: true }));
    return candidates[0];
  }

  getProfileForDomain(domain: AEFDomain): DomainProfile | undefined {
    const candidates = Array.from(this.profiles.values()).filter(
      (p) => p.domain === domain && p.status === 'active',
    );
    if (candidates.length === 0) return undefined;
    candidates.sort((a, b) => b.version.localeCompare(a.version, undefined, { numeric: true }));
    return candidates[0];
  }

  getActiveProfileForTenant(tenantId: string, domain: AEFDomain): DomainProfile | undefined {
    const pointer = this.tenantPointers.get(this.tenantDomainKey(tenantId, domain));
    if (!pointer) {
      return this.getProfileForDomain(domain);
    }
    return this.getProfile(pointer.activeProfileId, pointer.activeVersion);
  }

  async rotate_profile_version(opts: RotateProfileOptions): Promise<TenantProfilePointer> {
    const { tenantId, domain, targetProfileId, targetVersion, activatedBy, rotationReason } = opts;

    const targetProfile = this.getProfile(targetProfileId, targetVersion);
    if (!targetProfile) {
      throw new Error(
        `[DomainProfileRegistry] Profile not found: ${targetProfileId}@${targetVersion}`,
      );
    }
    if (targetProfile.status === 'deprecated') {
      throw new Error(
        `[DomainProfileRegistry] Cannot rotate to deprecated profile: ${targetProfileId}@${targetVersion}`,
      );
    }
    if (targetProfile.domain !== domain) {
      throw new Error(
        `[DomainProfileRegistry] Domain mismatch: profile ${targetProfileId} belongs to domain '${targetProfile.domain}', cannot be rotated into pointer for domain '${domain}'`,
      );
    }

    if (targetProfile.domain !== domain) {
      throw new Error(
        `[DomainProfileRegistry] Domain mismatch: profile '${targetProfileId}' belongs to '${targetProfile.domain}', not '${domain}'`,
      );
    }

    const pointerKey = this.tenantDomainKey(tenantId, domain);
    const existing = this.tenantPointers.get(pointerKey);

    const historyEntry: ProfileVersion = {
      profile: targetProfile,
      activatedAt: new Date().toISOString(),
      activatedBy,
      rotationReason,
    };

    const newPointer: TenantProfilePointer = {
      tenantId,
      domain,
      activeProfileId: targetProfileId,
      activeVersion: targetVersion,
      history: existing ? [...existing.history, historyEntry] : [historyEntry],
      rollbackAvailable: existing != null,
    };

    this.tenantPointers.set(pointerKey, newPointer);
    if (this.store) {
      await this.store.save(newPointer);
    }
    return newPointer;
  }

  async rollback(
    tenantId: string,
    domain: AEFDomain,
    rolledBackBy: string,
  ): Promise<TenantProfilePointer> {
    const pointerKey = this.tenantDomainKey(tenantId, domain);
    const existing = this.tenantPointers.get(pointerKey);

    if (!existing || existing.history.length < 2) {
      throw new Error(
        `[DomainProfileRegistry] No previous version available for rollback: tenant=${tenantId} domain=${domain}`,
      );
    }

    const history = [...existing.history];
    history.pop();
    const previous = history[history.length - 1]!;

    const newPointer: TenantProfilePointer = {
      tenantId,
      domain,
      activeProfileId: previous.profile.profileId,
      activeVersion: previous.profile.version,
      history,
      rollbackAvailable: history.length >= 2,
    };

    this.tenantPointers.set(pointerKey, newPointer);
    void rolledBackBy;
    if (this.store) {
      await this.store.save(newPointer);
    }
    return newPointer;
  }

  deprecateProfile(profileId: string, version: string, successorProfileId?: string): void {
    const key = this.profileKey(profileId, version);
    const profile = this.profiles.get(key);
    if (!profile) {
      throw new Error(`[DomainProfileRegistry] Cannot deprecate unknown profile: ${key}`);
    }
    this.profiles.set(key, {
      ...profile,
      status: 'deprecated',
      deprecatedAt: new Date().toISOString(),
      deprecationMessage: successorProfileId ? `Superseded by ${successorProfileId}` : 'Deprecated',
      successorProfileId,
      updatedAt: new Date().toISOString(),
    });
  }

  listProfiles(): DomainProfile[] {
    return Array.from(this.profiles.values());
  }

  snapshot(): ProfileRegistrySnapshot {
    const profiles = this.listProfiles();
    return {
      profileCount: profiles.length,
      domains: [...new Set(profiles.map((p) => p.domain))] as AEFDomain[],
      profiles: profiles.map((p) => ({
        profileId: p.profileId,
        domain: p.domain,
        version: p.version,
        status: p.status,
      })),
      generatedAt: new Date().toISOString(),
    };
  }

  private profileKey(profileId: string, version: string): string {
    return `${profileId}@${version}`;
  }

  private tenantDomainKey(tenantId: string, domain: AEFDomain): string {
    return `${tenantId}::${domain}`;
  }
}

export const defaultProfileRegistry = new DomainProfileRegistry();
