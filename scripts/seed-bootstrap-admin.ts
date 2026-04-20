/**
 * Bootstrap Admin Seed
 *
 * Creates the initial platform administrator from environment variables.
 * Idempotent — safe to run multiple times.
 *
 * Required env vars:
 *   BOOTSTRAP_ADMIN_USERNAME  — display name
 *   BOOTSTRAP_ADMIN_EMAIL     — email (login identifier)
 *   BOOTSTRAP_ADMIN_PASSWORD  — password (min 12 chars)
 */

import { randomBytes, pbkdf2Sync } from "crypto";
import { db, usersTable, rolesTable, userRolesTable } from "@szl-holdings/db";
import { eq } from "drizzle-orm";

const SCRIPT = "seed-bootstrap-admin";

function log(level: "info" | "error", event: string, meta?: Record<string, unknown>) {
  const entry = { ts: new Date().toISOString(), level, script: SCRIPT, event, ...meta };
  (level === "error" ? process.stderr : process.stdout).write(JSON.stringify(entry) + "\n");
}

function hashPassword(password: string): string {
  const salt = randomBytes(32).toString("hex");
  const hash = pbkdf2Sync(password, salt, 100_000, 64, "sha512").toString("hex");
  return `pbkdf2:${salt}:${hash}`;
}

const username = process.env.BOOTSTRAP_ADMIN_USERNAME;
const email = process.env.BOOTSTRAP_ADMIN_EMAIL;
const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;

const missing = (["BOOTSTRAP_ADMIN_USERNAME", "BOOTSTRAP_ADMIN_EMAIL", "BOOTSTRAP_ADMIN_PASSWORD"] as const)
  .filter((k) => !process.env[k]);

if (missing.length > 0) {
  log("error", "missing_env_vars", { missing });
  process.exit(1);
}

if (password!.length < 12) {
  log("error", "password_too_short", { minLength: 12 });
  process.exit(1);
}

async function run() {
  log("info", "start");

  const [user] = await db
    .insert(usersTable)
    .values({
      displayName: username!,
      email: email!,
      passwordHash: hashPassword(password!),
      platformRole: "founder_admin",
      isActive: true,
      emailVerifiedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: usersTable.email,
      set: {
        displayName: username!,
        passwordHash: hashPassword(password!),
        platformRole: "founder_admin",
        isActive: true,
        updatedAt: new Date(),
      },
    })
    .returning({ id: usersTable.id });

  if (!user) {
    log("error", "upsert_failed");
    process.exit(1);
  }

  log("info", "user_upserted", { userId: user.id });

  for (const roleName of ["super_admin", "admin"] as const) {
    await db.insert(rolesTable).values({ name: roleName }).onConflictDoNothing();
    const [role] = await db.select().from(rolesTable).where(eq(rolesTable.name, roleName));
    if (role) {
      await db.insert(userRolesTable).values({ userId: user.id, roleId: role.id }).onConflictDoNothing();
      log("info", "role_assigned", { userId: user.id, role: roleName });
    }
  }

  log("info", "done", { userId: user.id });
}

run().catch((err) => {
  log("error", "fatal", { error: String(err) });
  process.exit(1);
});
