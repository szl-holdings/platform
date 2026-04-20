/**
 * Governance — Real OS-Level Process Restart Smoke Test (Task #1929)
 *
 * The companion test, `governance-persistence.test.ts`, proves the four
 * classes of governance state survive an *in-process* re-hydration of the
 * Guardian engine (Vitest module reset + re-import). That covers the
 * application logic, but not what actually happens in production: the
 * Node.js process exits and a brand-new process boots from cold.
 *
 * This test closes that gap. It:
 *
 *   1. Builds the production bundle if `dist/index.mjs` is missing.
 *   2. Provisions a real Postgres session (super_admin) so the Guardian
 *      routes accept Bearer-token requests from a live HTTP client.
 *   3. Spawns the API server as a child process (`node dist/index.mjs`)
 *      bound to an ephemeral PORT, then waits for the bootstrap to flip
 *      `bootstrapDone = true` (detected via /api/health/live returning 200
 *      instead of the 503 "starting" payload from the boot-time gating
 *      handler).
 *   4. Writes a Guardian policy, an org-scoped tier override, a guardrail
 *      config, and an approval request — three of them through the public
 *      HTTP API, the fourth via direct Drizzle insert (the engine produces
 *      approval rows internally; there is no public POST surface for them).
 *   5. Sends SIGTERM to the child and waits for it to exit (falling back
 *      to SIGKILL after 12s, mirroring the production shutdown contract).
 *   6. Spawns a SECOND child process on a different ephemeral port and
 *      reads every value back through the public HTTP API. The bytes must
 *      match what was written before the restart.
 *
 * Skipped if no DATABASE_URL is configured.
 */

import { type ChildProcess, execFileSync, spawn } from 'node:child_process';
import { randomBytes, randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const HAS_DB = Boolean(process.env.DATABASE_URL);
const d = HAS_DB ? describe : describe.skip;

const HERE = path.dirname(fileURLToPath(import.meta.url));
const API_DIR = path.resolve(HERE, '../..');
const DIST_BIN = path.join(API_DIR, 'dist', 'index.mjs');
const BUILD_SCRIPT = path.join(API_DIR, 'build.mjs');

const TEST_ORG_ID = 1;

/** Find an unused TCP port by binding to 0 and reading what the OS chose. */
async function pickPort(): Promise<number> {
  return await new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.unref();
    srv.on('error', reject);
    srv.listen(0, '127.0.0.1', () => {
      const addr = srv.address();
      if (typeof addr === 'object' && addr) {
        const { port } = addr;
        srv.close(() => resolve(port));
      } else {
        srv.close();
        reject(new Error('Could not determine ephemeral port'));
      }
    });
  });
}

/** Build the production bundle if it is not already on disk. */
function ensureBuilt(): void {
  if (existsSync(DIST_BIN)) return;
  // Build is the same script the `dev` and `build` npm scripts call.
  execFileSync('node', [BUILD_SCRIPT], { cwd: API_DIR, stdio: 'inherit' });
}

/**
 * Wait for the child to switch from the boot-time `startingHandler`
 * (returns 503 with `{status:"starting"}`) to the live `readyHandler`.
 * `/api/health/live` returns 200 only after `bootstrapDone = true`.
 */
async function waitForReady(port: number, child: ChildProcess, timeoutMs = 120_000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  let lastErr: unknown = null;
  while (Date.now() < deadline) {
    if (child.exitCode != null) {
      throw new Error(`Child exited with code ${child.exitCode} before becoming ready`);
    }
    try {
      const res = await fetch(`http://127.0.0.1:${port}/api/health/live`);
      if (res.status === 200) {
        // Drain body so the socket can be reused.
        await res.text();
        return;
      }
      await res.text();
    } catch (err) {
      lastErr = err;
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`Child did not become ready within ${timeoutMs}ms (lastErr=${String(lastErr)})`);
}

/** Spawn `node dist/index.mjs` and wait for the bootstrap to finish. */
async function bootChild(port: number, sessionToken: string): Promise<ChildProcess> {
  const child = spawn('node', ['--max-old-space-size=1024', '--enable-source-maps', DIST_BIN], {
    cwd: API_DIR,
    env: {
      ...process.env,
      PORT: String(port),
      NODE_ENV: 'test',
      // Suppress noisy demo seeds; Guardian default seeds still run because
      // they are not gated by isSeedDataAllowed().
      DEMO_MODE: 'false',
      ENABLE_DEMO_SEED: 'false',
      // Surface only errors so test output stays readable.
      LOG_LEVEL: 'error',
      // Re-export the same session token for visibility (not strictly
      // required — auth is read from the Authorization header).
      TEST_SESSION_TOKEN: sessionToken,
      // Make sure the child doesn't hijack the parent's debugger port.
      NODE_OPTIONS: '',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  // Pipe child output to parent stderr/stdout for debuggability when a test fails.
  child.stdout?.on('data', (chunk: Buffer) => {
    process.stderr.write(`[child:${port}:stdout] ${chunk.toString()}`);
  });
  child.stderr?.on('data', (chunk: Buffer) => {
    process.stderr.write(`[child:${port}:stderr] ${chunk.toString()}`);
  });

  await waitForReady(port, child);
  return child;
}

/** SIGTERM the child with a SIGKILL fallback after 12s, mirroring production. */
async function killChild(child: ChildProcess): Promise<void> {
  if (child.exitCode != null || child.killed) return;
  await new Promise<void>((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      resolve();
    };
    const fallback = setTimeout(() => {
      if (!settled && child.exitCode == null) {
        child.kill('SIGKILL');
      }
    }, 12_000);
    fallback.unref();
    child.on('exit', () => {
      clearTimeout(fallback);
      finish();
    });
    child.kill('SIGTERM');
  });
}

type AuthFetch = (input: string, init?: RequestInit) => Promise<Response>;

function makeAuthFetch(port: number, token: string): AuthFetch {
  return (path: string, init: RequestInit = {}) => {
    const headers = new Headers(init.headers);
    headers.set('Authorization', `Bearer ${token}`);
    if (init.body && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }
    return fetch(`http://127.0.0.1:${port}${path}`, { ...init, headers });
  };
}

d('Governance state survives a real OS-level process restart (#1929)', () => {
  const runId = randomUUID().slice(0, 8);
  const sessionToken = randomBytes(32).toString('hex');

  // IDs we need to clean up at the end.
  let userId: number | null = null;
  let sessionId: number | null = null;
  let policyDbId: number | null = null;
  let approvalDbId: number | null = null;
  let guardrailDbId: number | null = null;
  let tierDbId: number | null = null;

  // State we expect to round-trip across the restart.
  const PINNED = {
    policy: {
      id: `restart-policy-${runId}`,
      name: `restart-test-policy-${runId}`,
      description: 'OS-restart smoke test — must survive child-process restart',
      tier: 'supervised' as const,
      conditions: [{ field: 'domain', operator: 'eq' as const, value: 'general' }],
      action: 'allow' as const,
      priority: 19,
      enabled: true,
      tags: ['restart-test', runId],
    },
    approval: {
      requestId: `restart-approval-${runId}`,
      action: 'test:os-restart',
      tier: 'operator-approved' as const,
      approvalType: 'single' as const,
      requiredApprovers: ['ops'],
    },
    guardrail: {
      guardrailId: `restart-guardrail-${runId}`,
      name: `Restart guardrail ${runId}`,
      description: 'Created by governance OS-restart test',
      guardrailType: 'rate_limit' as const,
      config: { limit: 200, windowSec: 30, runId },
      enforcement: 'enforce' as const,
    },
    tier: {
      tier: 'supervised' as const,
      tierNumber: 1,
      description: `Org-scoped supervised override (restart ${runId})`,
      riskLevel: 2,
      controls: { restartTest: true, runId },
    },
  };

  beforeAll(async () => {
    if (!HAS_DB) return;

    // 1) Build the production bundle once if needed.
    ensureBuilt();

    // 2) Provision a super_admin session so the child process accepts our
    //    Bearer-token requests against the Guardian routes.
    const { db, organizationsTable, usersTable, rolesTable, userRolesTable, sessionsTable } =
      await import('@szl-holdings/db');
    const { eq } = await import('drizzle-orm');

    // Make sure the test org exists (needed for org-scoped tier override).
    const [existingOrg] = await db
      .select()
      .from(organizationsTable)
      .where(eq(organizationsTable.id, TEST_ORG_ID))
      .limit(1);
    if (!existingOrg) {
      await db
        .insert(organizationsTable)
        .values({
          id: TEST_ORG_ID,
          name: 'Persistence Test Org',
          slug: 'persistence-test',
        })
        .onConflictDoNothing();
    }

    // Ensure the super_admin role row exists; the seed normally creates it
    // but the seed runs *inside* the child process, so it might not exist
    // yet on a first run.
    let [adminRole] = await db
      .select()
      .from(rolesTable)
      .where(eq(rolesTable.name, 'super_admin'))
      .limit(1);
    if (!adminRole) {
      const inserted = await db
        .insert(rolesTable)
        .values({ name: 'super_admin', description: 'Test bootstrap' })
        .onConflictDoNothing()
        .returning();
      adminRole = inserted[0];
      if (!adminRole) {
        // Conflict: re-read.
        const [reread] = await db
          .select()
          .from(rolesTable)
          .where(eq(rolesTable.name, 'super_admin'))
          .limit(1);
        adminRole = reread!;
      }
    }

    // Create a dedicated test user.
    const [user] = await db
      .insert(usersTable)
      .values({
        email: `restart-test-${runId}@example.com`,
        displayName: `Restart Test ${runId}`,
        isActive: true,
        sessionVersion: 1,
      })
      .returning();
    userId = user!.id;

    // Grant super_admin so the user passes requireRole on every Guardian route.
    await db
      .insert(userRolesTable)
      .values({ userId: userId!, roleId: adminRole.id })
      .onConflictDoNothing();

    // Create a long-lived session token.
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    const [session] = await db
      .insert(sessionsTable)
      .values({
        userId: userId!,
        token: sessionToken,
        expiresAt,
        sessionVersion: 1,
      })
      .returning();
    sessionId = session!.id;
  }, 180_000);

  afterAll(async () => {
    if (!HAS_DB) return;
    const {
      db,
      guardianPoliciesTable,
      guardianApprovalRequestsTable,
      guardianTiersTable,
      guardrailConfigsTable,
      sessionsTable,
      userRolesTable,
      usersTable,
    } = await import('@szl-holdings/db');
    const { eq } = await import('drizzle-orm');

    // Remove governance rows we created — never touch shared seed rows.
    if (policyDbId !== null)
      await db.delete(guardianPoliciesTable).where(eq(guardianPoliciesTable.id, policyDbId));
    if (approvalDbId !== null)
      await db
        .delete(guardianApprovalRequestsTable)
        .where(eq(guardianApprovalRequestsTable.id, approvalDbId));
    if (guardrailDbId !== null)
      await db.delete(guardrailConfigsTable).where(eq(guardrailConfigsTable.id, guardrailDbId));
    if (tierDbId !== null)
      await db.delete(guardianTiersTable).where(eq(guardianTiersTable.id, tierDbId));

    // Remove the throwaway session/user.
    if (sessionId !== null) await db.delete(sessionsTable).where(eq(sessionsTable.id, sessionId));
    if (userId !== null) {
      await db.delete(userRolesTable).where(eq(userRolesTable.userId, userId));
      await db.delete(usersTable).where(eq(usersTable.id, userId));
    }
  }, 30_000);

  it('writes governance state, restarts the OS process, and reads it back identically', async () => {
    // ----- Phase 1: boot child #1 and write through the public HTTP API. -----
    const port1 = await pickPort();
    const child1 = await bootChild(port1, sessionToken);
    const api1 = makeAuthFetch(port1, sessionToken);

    try {
      // (a) POST /policies
      const policyRes = await api1('/api/policies', {
        method: 'POST',
        body: JSON.stringify(PINNED.policy),
      });
      expect(policyRes.status).toBe(201);
      const policyBody = (await policyRes.json()) as { id: number; name: string };
      expect(policyBody.name).toBe(PINNED.policy.name);
      policyDbId = policyBody.id;

      // (b) PATCH /policies/tiers/:tier (org-scoped override)
      const tierRes = await api1(`/api/policies/tiers/${PINNED.tier.tier}`, {
        method: 'PATCH',
        body: JSON.stringify({
          description: PINNED.tier.description,
          riskLevel: PINNED.tier.riskLevel,
          controls: PINNED.tier.controls,
          tierNumber: PINNED.tier.tierNumber,
        }),
      });
      expect([200, 201]).toContain(tierRes.status);
      const tierBody = (await tierRes.json()) as { id: number; tier: string };
      expect(tierBody.tier).toBe(PINNED.tier.tier);
      tierDbId = tierBody.id;

      // (c) POST /guardrail-configs
      const guardrailRes = await api1('/api/guardrail-configs', {
        method: 'POST',
        body: JSON.stringify(PINNED.guardrail),
      });
      expect(guardrailRes.status).toBe(201);
      const guardrailBody = (await guardrailRes.json()) as { id: number; guardrailId: string };
      expect(guardrailBody.guardrailId).toBe(PINNED.guardrail.guardrailId);
      guardrailDbId = guardrailBody.id;

      // (d) Approval request — created through the public HTTP API.
      // POST /api/guardian/evaluate with tier="operator-approved" (which has
      // approvalGate="single") drives the engine to outcome=require-approval,
      // which inserts a row into guardian_approval_requests using our
      // requestId. This proves the *write* path persists across the OS
      // restart, not just a synthetic Drizzle insert in the test process.
      const evalRes = await api1('/api/guardian/evaluate', {
        method: 'POST',
        body: JSON.stringify({
          requestId: PINNED.approval.requestId,
          action: PINNED.approval.action,
          tier: PINNED.approval.tier,
        }),
      });
      if (evalRes.status !== 200) {
        // eslint-disable-next-line no-console
        console.error(
          '[restart-test] /api/guardian/evaluate failed:',
          evalRes.status,
          await evalRes.text(),
        );
      }
      expect(evalRes.status).toBe(200);
      const evalBody = (await evalRes.json()) as { outcome: string };
      expect(evalBody.outcome).toBe('require-approval');

      // Confirm the row landed in DB before we kill the process.
      const { db: dbAfterWrite, guardianApprovalRequestsTable: gtableW } = await import(
        '@szl-holdings/db'
      );
      const { eq: eqW } = await import('drizzle-orm');
      const [persisted] = await dbAfterWrite
        .select()
        .from(gtableW)
        .where(eqW(gtableW.requestId, PINNED.approval.requestId))
        .limit(1);
      expect(persisted).toBeDefined();
      approvalDbId = persisted!.id;
    } finally {
      await killChild(child1);
    }

    // Sanity: child #1 must have actually exited — this is the whole point.
    expect(child1.exitCode != null || child1.signalCode != null).toBe(true);

    // ----- Phase 2: boot a brand-new child #2 and read everything back. -----
    const port2 = await pickPort();
    expect(port2).not.toBe(port1);
    const child2 = await bootChild(port2, sessionToken);
    const api2 = makeAuthFetch(port2, sessionToken);

    try {
      // (a) Policy round-trip
      const policyRes = await api2(`/api/policies/${policyDbId}`);
      expect(policyRes.status).toBe(200);
      const policy = (await policyRes.json()) as {
        name: string;
        description: string;
        tier: string;
        action: string;
        priority: number;
        enabled: boolean;
        conditions: unknown;
        tags: unknown;
      };
      expect(policy.name).toBe(PINNED.policy.name);
      expect(policy.description).toBe(PINNED.policy.description);
      expect(policy.tier).toBe(PINNED.policy.tier);
      expect(policy.action).toBe(PINNED.policy.action);
      expect(policy.priority).toBe(PINNED.policy.priority);
      expect(policy.enabled).toBe(PINNED.policy.enabled);
      expect(policy.conditions).toEqual(PINNED.policy.conditions);
      expect(policy.tags).toEqual(PINNED.policy.tags);

      // (b) Tier override round-trip
      const tiersRes = await api2('/api/policies/tiers');
      expect(tiersRes.status).toBe(200);
      const tiersList = (await tiersRes.json()) as Array<{
        tier: string;
        description: string;
        riskLevel: number;
        controls: Record<string, unknown>;
        tierNumber: number;
      }>;
      const supervised = tiersList.find((t) => t.tier === PINNED.tier.tier);
      expect(supervised).toBeDefined();
      expect(supervised!.description).toBe(PINNED.tier.description);
      expect(supervised!.riskLevel).toBe(PINNED.tier.riskLevel);
      expect(supervised!.controls).toEqual(PINNED.tier.controls);
      expect(supervised!.tierNumber).toBe(PINNED.tier.tierNumber);

      // (c) Guardrail round-trip
      const guardrailRes = await api2(`/api/guardrail-configs/${guardrailDbId}`);
      expect(guardrailRes.status).toBe(200);
      const guardrail = (await guardrailRes.json()) as {
        guardrailId: string;
        name: string;
        description: string;
        guardrailType: string;
        config: unknown;
        enforcement: string;
        enabled: boolean;
      };
      expect(guardrail.guardrailId).toBe(PINNED.guardrail.guardrailId);
      expect(guardrail.name).toBe(PINNED.guardrail.name);
      expect(guardrail.description).toBe(PINNED.guardrail.description);
      expect(guardrail.guardrailType).toBe(PINNED.guardrail.guardrailType);
      expect(guardrail.config).toEqual(PINNED.guardrail.config);
      expect(guardrail.enforcement).toBe(PINNED.guardrail.enforcement);
      expect(guardrail.enabled).toBe(true);

      // (d) Approval round-trip.
      //
      // Replay POST /api/guardian/evaluate on child #2 with the SAME requestId.
      // The child must (a) be live, (b) have rebuilt the engine from the
      // policies table after restart, and (c) consistently return
      // outcome=require-approval. Because the route uses
      // `onConflictDoNothing` keyed on requestId, no duplicate row is created.
      const evalAfterRes = await api2('/api/guardian/evaluate', {
        method: 'POST',
        body: JSON.stringify({
          requestId: PINNED.approval.requestId,
          action: PINNED.approval.action,
          tier: PINNED.approval.tier,
        }),
      });
      expect(evalAfterRes.status).toBe(200);
      const evalAfterBody = (await evalAfterRes.json()) as { outcome: string };
      expect(evalAfterBody.outcome).toBe('require-approval');

      // Then verify the original row written by child #1 is still present in
      // the shared Postgres that child #2 connects to. (The public
      // /api/approvals collection is owned by alloy/approvals in production;
      // see the follow-up to expose guardian approvals on a stable path.)
      const { db: dbVerify, guardianApprovalRequestsTable: gtable } = await import(
        '@szl-holdings/db'
      );
      const { eq: eqVerify } = await import('drizzle-orm');
      const [approval] = await dbVerify
        .select()
        .from(gtable)
        .where(eqVerify(gtable.requestId, PINNED.approval.requestId))
        .limit(1);
      expect(approval).toBeDefined();
      expect(approval!.id).toBe(approvalDbId);
      expect(approval!.action).toBe(PINNED.approval.action);
      expect(approval!.tier).toBe(PINNED.approval.tier);
      expect(approval!.approvalType).toBe(PINNED.approval.approvalType);
      expect(approval!.status).toBe('pending');
    } finally {
      await killChild(child2);
    }
  }, 360_000);
});
