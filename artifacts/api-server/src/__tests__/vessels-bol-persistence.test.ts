/**
 * Vessels Blockchain BoL Persistence Test (Task #1847)
 *
 * Proves that bills of lading created via POST survive a simulated server
 * restart, that the chain hash is reconstructed deterministically from
 * persisted events on each read, and that seed data is only inserted on
 * first run (idempotent across restarts).
 *
 * Skipped if no DATABASE_URL is configured.
 */

import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import type { Request, Response, NextFunction } from "express";
import express from "express";
import request from "supertest";
import { randomUUID } from "crypto";

const HAS_DB = Boolean(process.env.DATABASE_URL);
const d = HAS_DB ? describe : describe.skip;

vi.mock("../middlewares/auth.js", () => ({
  authMiddleware: () => (_req: Request, _res: Response, next: NextFunction) => next(),
  requireRole: () => (_req: Request, _res: Response, next: NextFunction) => next(),
  requireAnyAuth: () => (_req: Request, _res: Response, next: NextFunction) => next(),
  denyIfReadOnly: () => (_req: Request, _res: Response, next: NextFunction) => next(),
  requireOrgMembership: () => (_req: Request, _res: Response, next: NextFunction) => next(),
  parseIdParam: () => (_req: Request, _res: Response, next: NextFunction) => next(),
  InvalidIdError: class extends Error {},
}));

interface BolDocResp {
  id: string;
  vesselName: string;
  consignee: string;
  status: string;
  transferCount: number;
  genesisHash: string;
  headHash: string;
  chain: Array<{ sequence: number; eventType: string; actor: string; hash: string; prevHash: string }>;
}

async function buildApp(): Promise<{ app: express.Express }> {
  vi.resetModules();
  const routerMod = await import("../routes/vessels-modules");
  const app = express();
  app.use(express.json());
  app.use("/api", routerMod.default);
  return { app };
}

d("Vessels BoL persistence (Task #1847)", () => {
  let createdId: string;
  const uniqueShipper = `Test Shipper ${randomUUID().slice(0, 8)}`;
  const uniqueConsignee = `Test Consignee ${randomUUID().slice(0, 8)}`;
  const transferConsignee = `Transferred To ${randomUUID().slice(0, 8)}`;

  beforeAll(() => { vi.resetModules(); });
  afterAll(async () => {
    if (!HAS_DB || !createdId) return;
    const { db, vesselsBillsOfLadingTable } = await import("@szl-holdings/db");
    const { eq } = await import("drizzle-orm");
    await db.delete(vesselsBillsOfLadingTable).where(eq(vesselsBillsOfLadingTable.id, createdId));
  });

  it("persists a new BoL across a simulated server restart and rebuilds chain hashes from events", { timeout: 30_000 }, async () => {
    // ── Phase 1: create a BoL on a fresh app instance ──
    const { app: app1 } = await buildApp();
    const create = await request(app1)
      .post("/api/vessels/modules/bills-of-lading")
      .send({
        vesselName: "Persistence Test Vessel",
        imo: "9999999",
        voyageId: `VOY-TEST-${randomUUID().slice(0, 6)}`,
        shipper: uniqueShipper,
        consignee: uniqueConsignee,
        cargo: "Test Cargo",
        quantityMt: 12345,
        unit: "MT",
        originPort: "Test Origin",
        destinationPort: "Test Destination",
        lcRef: "LC-TEST-001",
        lcIssuer: "Test Bank",
        lcAmount: 5_000_000,
      });
    expect(create.status).toBe(201);
    const created = create.body as BolDocResp;
    expect(created.id).toMatch(/^BOL-/);
    expect(created.consignee).toBe(uniqueConsignee);
    expect(created.chain).toHaveLength(1);
    expect(created.chain[0].eventType).toBe("BoL Created");
    expect(created.chain[0].actor).toBe(uniqueShipper);
    expect(created.genesisHash).toBe(created.headHash);
    expect(created.genesisHash.length).toBe(32);
    createdId = created.id;

    // Transfer it once on the same app instance
    const xfer = await request(app1)
      .post(`/api/vessels/modules/bills-of-lading/${createdId}/transfer`)
      .send({ newConsignee: transferConsignee, actor: transferConsignee });
    expect(xfer.status).toBe(200);
    const xferred = xfer.body as BolDocResp;
    expect(xferred.consignee).toBe(transferConsignee);
    expect(xferred.transferCount).toBe(1);
    expect(xferred.chain).toHaveLength(2);
    expect(xferred.chain[1].prevHash).toBe(created.headHash);
    const headAfterXfer = xferred.headHash;

    // ── Phase 2: simulated restart — fresh module instance, fresh in-memory state ──
    const { app: app2 } = await buildApp();

    const list = await request(app2).get("/api/vessels/modules/bills-of-lading");
    expect(list.status).toBe(200);
    const ids = (list.body.documents as Array<{ id: string }>).map((d) => d.id);
    expect(ids).toContain(createdId);

    const detail = await request(app2).get(`/api/vessels/modules/bills-of-lading/${createdId}`);
    expect(detail.status).toBe(200);
    const reloaded = detail.body as BolDocResp;
    expect(reloaded.id).toBe(createdId);
    expect(reloaded.consignee).toBe(transferConsignee);
    expect(reloaded.transferCount).toBe(1);
    expect(reloaded.chain).toHaveLength(2);
    // Hashes must be deterministically rebuilt from the persisted event stream.
    expect(reloaded.headHash).toBe(headAfterXfer);
    expect(reloaded.genesisHash).toBe(created.genesisHash);
    expect(reloaded.chain[0].eventType).toBe("BoL Created");
    expect(reloaded.chain[0].actor).toBe(uniqueShipper);
    expect(reloaded.chain[1].eventType).toBe("BoL Transferred");
    expect(reloaded.chain[1].actor).toBe(transferConsignee);
    expect(reloaded.chain[1].prevHash).toBe(reloaded.chain[0].hash);

    const verify = await request(app2).get(`/api/vessels/modules/bills-of-lading/${createdId}/verify`);
    expect(verify.status).toBe(200);
    expect(verify.body.valid).toBe(true);
    expect(verify.body.chainLength).toBe(2);
    expect(verify.body.headHash).toBe(headAfterXfer);
  });

  it("seeds demo BoLs only on first run (idempotent across restarts)", { timeout: 30_000 }, async () => {
    const { db, vesselsBillsOfLadingTable } = await import("@szl-holdings/db");
    const { sql: drizzleSql } = await import("drizzle-orm");

    const { app: appA } = await buildApp();
    await request(appA).get("/api/vessels/modules/bills-of-lading"); // triggers seed if first run
    const countA = await db.select({ c: drizzleSql<number>`COUNT(*)::int` }).from(vesselsBillsOfLadingTable);
    const afterFirst = countA[0].c;

    const { app: appB } = await buildApp();
    await request(appB).get("/api/vessels/modules/bills-of-lading"); // must NOT re-seed
    const countB = await db.select({ c: drizzleSql<number>`COUNT(*)::int` }).from(vesselsBillsOfLadingTable);
    expect(countB[0].c).toBe(afterFirst);
  });
});
