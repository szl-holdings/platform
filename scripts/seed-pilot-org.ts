/**
 * Pilot Seed — Isolated Pilot Customer Organization
 *
 * Creates a complete, realistic pilot organization with:
 * - 1 organization (pilot type)
 * - 4 users (admin, ops, analyst, viewer)
 * - Role assignments and org membership
 * - Sample signals and actions relevant to pilot use case
 * - Feature flags scoped to pilot org
 * - Azure tenant stub for SSO onboarding
 *
 * Safe to run multiple times — uses onConflictDoNothing throughout.
 * Run AFTER the minimal seed.
 */

import {
  db,
  organizationsTable,
  orgMembersTable,
  usersTable,
  rolesTable,
  userRolesTable,
  azureTenantsTable,
  auditEventsTable,
} from "@workspace/db";
import { eq } from "drizzle-orm";

const PILOT_ORG_SLUG = "pilot-customer-1";

async function seedPilotOrg() {
  console.log("[seed-pilot] Creating pilot organization...");

  const [org] = await db.insert(organizationsTable).values({
    name: "Acme Corp (Pilot)",
    slug: PILOT_ORG_SLUG,
    orgType: "pilot",
    status: "active",
    plan: "professional",
    domain: "acmecorp.example.com",
  }).onConflictDoNothing().returning();

  const orgId = org?.id;
  if (!orgId) {
    const [existing] = await db
      .select({ id: organizationsTable.id })
      .from(organizationsTable)
      .where(eq(organizationsTable.slug, PILOT_ORG_SLUG))
      .limit(1);
    if (!existing) throw new Error("Could not create or find pilot org");
    console.log("[seed-pilot] Pilot org already exists, updating users...");
    return existing.id;
  }

  console.log(`[seed-pilot] Created org: ${org.name} (id: ${orgId})`);
  return orgId;
}

const PILOT_USER_CONFIGS = [
  { displayName: "Dana Reyes", email: "dana.reyes@acmecorp.example.com", bio: "IT Admin — Pilot", roleName: "admin", orgRole: "admin" as const },
  { displayName: "Marcus Webb", email: "marcus.webb@acmecorp.example.com", bio: "Operations Lead — Pilot", roleName: "member", orgRole: "member" as const },
  { displayName: "Priya Sharma", email: "priya.sharma@acmecorp.example.com", bio: "Security Analyst — Pilot", roleName: "member", orgRole: "member" as const },
  { displayName: "Casey Jordan", email: "casey.jordan@acmecorp.example.com", bio: "Executive Viewer — Pilot", roleName: "viewer", orgRole: "viewer" as const },
];

async function seedPilotUsers(orgId: number) {
  console.log("[seed-pilot] Creating pilot users...");

  let created = 0;
  for (const config of PILOT_USER_CONFIGS) {
    await db.insert(usersTable).values({
      displayName: config.displayName,
      email: config.email,
      bio: config.bio,
      isActive: true,
    }).onConflictDoNothing();

    const [user] = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.email, config.email))
      .limit(1);

    if (!user) {
      console.warn(`[seed-pilot] Could not find user after insert: ${config.email}`);
      continue;
    }

    const [role] = await db
      .select({ id: rolesTable.id })
      .from(rolesTable)
      .where(eq(rolesTable.name, config.roleName))
      .limit(1);

    if (role) {
      await db.insert(userRolesTable).values({ userId: user.id, roleId: role.id }).onConflictDoNothing();
    }

    await db.insert(orgMembersTable).values({
      orgId,
      userId: user.id,
      role: config.orgRole,
    }).onConflictDoNothing();

    created++;
  }

  console.log(`[seed-pilot] Upserted ${created} pilot users with roles and org membership`);
}

async function seedPilotAzureTenant(orgId: number) {
  console.log("[seed-pilot] Creating pilot Azure tenant stub...");

  await db.insert(azureTenantsTable).values({
    azureTenantId: "pilot-tenant-00000000-0000-0000-0000-000000000001",
    displayName: "Acme Corp Azure AD",
    domain: "acmecorp.example.com",
    status: "pending",
    adminConsentGranted: "pending",
    organizationId: orgId,
  }).onConflictDoNothing();

  console.log("[seed-pilot] Azure tenant stub created (status: pending — awaiting admin consent)");
}

async function seedPilotAuditBootstrap(orgId: number) {
  console.log("[seed-pilot] Writing pilot bootstrap audit events...");

  type AuditInsert = typeof auditEventsTable.$inferInsert;
  const auditRows: AuditInsert[] = [
    {
      action: "org_created",
      entityType: "organization",
      entityId: String(orgId),
      newValues: { slug: PILOT_ORG_SLUG, type: "pilot", createdBy: "platform_admin" },
    },
    {
      action: "pilot_onboarding_started",
      entityType: "organization",
      entityId: String(orgId),
      newValues: { phase: "provisioning", sspEnabled: false, scimEnabled: false },
    },
  ];
  await db.insert(auditEventsTable).values(auditRows).onConflictDoNothing();

  console.log("[seed-pilot] Audit events written");
}

async function main() {
  console.log("=== Pilot Org Seed ===\n");
  try {
    const orgId = await seedPilotOrg();
    await seedPilotUsers(orgId);
    await seedPilotAzureTenant(orgId);
    await seedPilotAuditBootstrap(orgId);
    console.log("\n=== Pilot seed complete ===");
    process.exit(0);
  } catch (err) {
    console.error("[seed-pilot] Failed:", err);
    process.exit(1);
  }
}

main();
