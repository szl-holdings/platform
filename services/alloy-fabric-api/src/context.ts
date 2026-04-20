import { InMemoryStorageBundle } from "@workspace/aef-storage-adapters";
import { PolicyEngine, TenantBoundaryEnforcer } from "@workspace/aef-policy-guard";
import { defaultLedgerStore } from "@workspace/aef-evidence-ledger";
import { createDefaultProfileRegistry } from "@workspace/aef-domain-profiles";

export const profileRegistry = createDefaultProfileRegistry();

export const storageBundle = new InMemoryStorageBundle();

export const policyEngine = new PolicyEngine();

// Tenants pre-registered at boot time. In production these are provisioned by the
// tenant management plane. Auto-registration MUST NOT occur in any request path.
const BOOT_TENANTS: Set<string> = new Set([
  "szl-smoke-test",
  "szl-dev",
  "smoke-test-tenant",
  ...(process.env["AEF_SMOKE_TENANT"] ? [process.env["AEF_SMOKE_TENANT"]] : []),
  ...(process.env["AEF_BOOT_TENANTS"]
    ? process.env["AEF_BOOT_TENANTS"].split(",").map((t) => t.trim()).filter(Boolean)
    : []),
]);

export const tenantEnforcer = new TenantBoundaryEnforcer({
  registeredTenants: BOOT_TENANTS,
});

export { defaultLedgerStore };

/**
 * Admin-only: register a new tenant.
 * MUST NOT be called from any user request path — only from admin provisioning or boot scripts.
 */
export function adminRegisterTenant(tenantId: string): void {
  tenantEnforcer.register(tenantId);
}

/**
 * Deterministic unit-length vector for seeding — same algorithm as the CPU embed backend.
 */
function seedVector(text: string, dims: number): number[] {
  const v = new Array<number>(dims).fill(0);
  for (let i = 0; i < text.length && i < dims; i++) {
    v[i % dims] = (v[i % dims]! + text.charCodeAt(i)) / 255;
  }
  const norm = Math.sqrt(v.reduce((s, x) => s + x * x, 0)) || 1;
  return v.map((x) => x / norm);
}

const SEED_DIMS = 768;
const SEED_MODEL = "aef-embed-cpu-v1";
const SEED_DOCS = [
  { chunkId: "seed-maritime-1", sourceId: "seed-doc-maritime", text: "Maritime law governs navigation and shipping on international waters.", contentType: "text/plain" },
  { chunkId: "seed-maritime-2", sourceId: "seed-doc-maritime", text: "Force majeure clauses in maritime contracts excuse non-performance due to unforeseeable events.", contentType: "text/plain" },
  { chunkId: "seed-maritime-3", sourceId: "seed-doc-maritime", text: "The law of the sea defines territorial waters and exclusive economic zones.", contentType: "text/plain" },
];

/**
 * Seeds minimal fixture data for smoke-test-capable tenants at boot time.
 * Idempotent — safe to call multiple times.
 */
export async function seedBootData(): Promise<void> {
  const seedTenants = [...BOOT_TENANTS].filter(
    (t) => t.includes("smoke") || t.includes("dev"),
  );
  const now = new Date().toISOString();

  for (const tenantId of seedTenants) {
    for (const doc of SEED_DOCS) {
      const vector = seedVector(doc.text, SEED_DIMS);
      const metadata: Record<string, unknown> = {
        text: doc.text,
        title: doc.chunkId,
        contentType: doc.contentType,
        sourceType: "seed",
      };

      try {
        await storageBundle.vectors.upsert({
          chunkId: doc.chunkId,
          sourceId: doc.sourceId,
          tenantId,
          model: SEED_MODEL,
          dimensions: SEED_DIMS,
          vector,
          metadata,
          indexedAt: now,
        });
        await storageBundle.metadataIndex.upsert({
          chunkId: doc.chunkId,
          sourceId: doc.sourceId,
          tenantId,
          title: doc.chunkId,
          metadata: { ...metadata },
          updatedAt: now,
        });
      } catch {
        // Seed failures are non-fatal — log and continue
        process.stderr.write(`[AEF] boot seed failed chunkId=${doc.chunkId} tenantId=${tenantId}\n`);
      }
    }
  }
}
