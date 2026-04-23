/**
 * Privacy Registry — GDPR-ready per-user export and deletion.
 *
 * Each product domain registers a PrivacyContributor that knows how to:
 *   - collect all personal data for a given user (for data-portability export)
 *   - delete / pseudonymize that data when a hard-delete is requested
 *
 * The central service composes all registered contributors so adding a new
 * domain is a one-line registration — no other files need to change.
 *
 * DELETION ORDER: the auth contributor MUST be registered last. Deleting the
 * user row triggers ON DELETE CASCADE for many FK-linked tables. Running all
 * other contributor deletions first ensures non-cascaded tables are cleanly
 * erased before the user row disappears. The auth contributor is responsible
 * for the final user row hard-delete.
 */

export interface PrivacyUserContext {
  userId: number;
  userEmail: string | null;
}

export interface PrivacyContributor {
  /** Machine-readable name shown in the export bundle ("auth", "holdings", …). */
  domain: string;

  /**
   * Return all personal data held for this user in this domain.
   * Must never throw — return an empty object on non-fatal errors.
   */
  exportForUser(ctx: PrivacyUserContext): Promise<Record<string, unknown>>;

  /**
   * Remove or pseudonymize all personal data for this user in this domain.
   * Must be idempotent (re-running after partial failure is safe).
   */
  deleteForUser(ctx: PrivacyUserContext): Promise<void>;
}

const contributors: PrivacyContributor[] = [];

export function registerPrivacyContributor(c: PrivacyContributor): void {
  if (contributors.some((x) => x.domain === c.domain)) {
    throw new Error(`PrivacyContributor for domain "${c.domain}" already registered`);
  }
  contributors.push(c);
}

export function getRegisteredDomains(): string[] {
  return contributors.map((c) => c.domain);
}

/**
 * Collect a full data bundle across all registered domains.
 * Each domain key holds its own export payload.
 * Failures in individual domains are captured, not thrown.
 */
export async function composeExportForUser(
  userId: number,
  userEmail?: string | null,
): Promise<Record<string, unknown>> {
  const ctx: PrivacyUserContext = { userId, userEmail: userEmail ?? null };
  const bundle: Record<string, unknown> = {};
  await Promise.all(
    contributors.map(async (c) => {
      try {
        bundle[c.domain] = await c.exportForUser(ctx);
      } catch (err) {
        bundle[c.domain] = { _error: 'export_failed', message: String(err) };
      }
    }),
  );
  return bundle;
}

/**
 * Run all registered domain deletions for a user.
 *
 * Contributors run sequentially so the auth contributor (registered last) fires
 * after all domain-specific non-cascaded tables have been cleaned. Each
 * contributor is attempted regardless of earlier failures; errors are collected
 * and surfaced after all domains have run.
 */
export async function composeDeleteForUser(
  userId: number,
  userEmail?: string | null,
): Promise<void> {
  const ctx: PrivacyUserContext = { userId, userEmail: userEmail ?? null };
  const errors: { domain: string; message: string }[] = [];

  for (const c of contributors) {
    try {
      await c.deleteForUser(ctx);
    } catch (err) {
      errors.push({ domain: c.domain, message: String(err) });
    }
  }

  if (errors.length > 0) {
    throw new Error(
      `User deletion incomplete — failed domains: ${errors.map((e) => `${e.domain}: ${e.message}`).join('; ')}`,
    );
  }
}
