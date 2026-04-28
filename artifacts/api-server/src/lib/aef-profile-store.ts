/**
 * Postgres-backed implementation of the AEF DomainProfileRegistry pointer store.
 *
 * Persists tenant -> active profile pointer (with full rotation history) to the
 * `profile_registry_pointers` table so that rotations and rollbacks performed
 * via `DomainProfileRegistry.rotate_profile_version` / `rollback` survive
 * API server restarts. Without this hookup the registry silently resets every
 * tenant back to the default profile version on each reboot.
 */
import { db, profileRegistryPointersTable } from '@szl-holdings/db';
import {
  type AEFDomain,
  defaultProfileRegistry,
  type ProfilePointerStore,
  type TenantProfilePointer,
} from '@workspace/aef-domain-profiles';
import { sql } from 'drizzle-orm';
import { logger } from './logger';

const pgStore: ProfilePointerStore = {
  async loadAll(): Promise<TenantProfilePointer[]> {
    const rows = await db.select().from(profileRegistryPointersTable);
    return rows.map((r) => ({
      tenantId: r.tenantId,
      domain: r.domain as AEFDomain,
      activeProfileId: r.activeProfileId,
      activeVersion: r.activeVersion,
      history: Array.isArray(r.history) ? (r.history as TenantProfilePointer['history']) : [],
      rollbackAvailable: r.rollbackAvailable,
    }));
  },

  async save(pointer: TenantProfilePointer): Promise<void> {
    await db
      .insert(profileRegistryPointersTable)
      .values({
        tenantId: pointer.tenantId,
        domain: pointer.domain,
        activeProfileId: pointer.activeProfileId,
        activeVersion: pointer.activeVersion,
        history: pointer.history,
        rollbackAvailable: pointer.rollbackAvailable,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [profileRegistryPointersTable.tenantId, profileRegistryPointersTable.domain],
        set: {
          activeProfileId: pointer.activeProfileId,
          activeVersion: pointer.activeVersion,
          history: pointer.history,
          rollbackAvailable: pointer.rollbackAvailable,
          updatedAt: sql`now()`,
        },
      });
  },
};

/**
 * Wire the durable Postgres store into the shared DomainProfileRegistry and
 * load any persisted tenant pointers into memory. Safe to call once at API
 * server startup, after `runMigrations()` has guaranteed the table exists.
 */
export async function initAefProfileRegistryPersistence(): Promise<void> {
  defaultProfileRegistry.setStore(pgStore);
  try {
    const loaded = await defaultProfileRegistry.hydrate();
    logger.info(
      { loaded },
      '[aef-profile-registry] Hydrated tenant profile pointers from profile_registry_pointers',
    );
  } catch (err) {
    logger.warn(
      { err },
      '[aef-profile-registry] Failed to hydrate tenant profile pointers — continuing with in-memory defaults',
    );
  }
}
