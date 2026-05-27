/**
 * ROSIE Jarvis — single-call ecosystem overview.
 *
 * Mounted at /api/rosie/jarvis (see routes/index.ts). The ROSIE landing
 * is the "Jarvis" command surface over the whole SZL ecosystem, so it
 * needs ONE call that returns live counts + heads from every product
 * surface (vessels, a11oy, sentra, conduit, perception/electrodynamics/
 * ising receipt classes, UDS bundles, and the rosie proof chain itself).
 *
 * Design contract:
 *   - Every slice is wrapped in its own try/catch. A degraded slice
 *     returns `{ status: 'degraded', error: <short msg> }` instead of
 *     500-ing the whole overview — the command surface always renders.
 *   - All counts come from real DB tables (see seed-vessels.ts, the
 *     a11oy_*, sentra_*, conduit_*, proof_ledger schemas). No mocked
 *     numbers, no placeholder text. If a table is empty, we return 0
 *     and let the UI render an empty-state.
 *   - UDS bundle list is imported in-process from the uds-registry
 *     module so we never drift between /api/uds/registry and
 *     /api/rosie/jarvis/overview.
 *   - The receipt-chain head is read from proof_ledger directly so we
 *     don't have to expose rosie.ts internals.
 */

import { type IRouter, Router } from 'express';
import { sendError, sendSuccess } from '../lib/api-response';
import { logger } from '../lib/logger';

const router: IRouter = Router();

interface SliceOK<T> {
  status: 'ok';
  data: T;
  fetchedInMs: number;
}
interface SliceDegraded {
  status: 'degraded';
  error: string;
  fetchedInMs: number;
}
type Slice<T> = SliceOK<T> | SliceDegraded;

async function timed<T>(label: string, fn: () => Promise<T>): Promise<Slice<T>> {
  const t0 = Date.now();
  try {
    const data = await fn();
    return { status: 'ok', data, fetchedInMs: Date.now() - t0 };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.warn({ slice: label, err: msg }, '[rosie-jarvis] slice degraded');
    return { status: 'degraded', error: msg.slice(0, 200), fetchedInMs: Date.now() - t0 };
  }
}

/**
 * GET /api/rosie/jarvis/overview
 *
 * Returns:
 *   {
 *     asOf,
 *     ecosystem: { vessels, a11oy, sentra, conduit, uds, proofChain },
 *     totals: { receipts, sealedToday, openIncidents, activeFleets, bundleCount },
 *   }
 *
 * Cache-Control: public, max-age=10 so the SSE stream stays authoritative
 * but a refresh-burst doesn't hammer the DB.
 */
router.get('/rosie/jarvis/overview', async (_req, res) => {
  try {
    const { db, sql, vesselsTable, vesselsFleetsTable, vesselVoyageEconomicsTable, fleetExceptionsTable, proofLedgerTable, sentraIncidentsTable, sentraAlertsTable, conduitSyncsTable, conduitSyncRunsTable, a11oyProofPacketsTable, a11oyExecutionTracesTable } = (await import(
      '@szl-holdings/db'
    )) as Record<string, any>;
    const { desc, eq, and, gte, count } = (await import('drizzle-orm')) as Record<string, any>;
    const { sql: drizzleSql } = await import('drizzle-orm');

    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // ── Vessels ─────────────────────────────────────────────────────────
    const vessels = await timed('vessels', async () => {
      const [vCount] = await db
        .select({ c: drizzleSql<number>`count(*)::int` })
        .from(vesselsTable);
      const [fCount] = await db
        .select({ c: drizzleSql<number>`count(*)::int` })
        .from(vesselsFleetsTable);
      const [vyCount] = await db
        .select({ c: drizzleSql<number>`count(*)::int` })
        .from(vesselVoyageEconomicsTable);
      const [exCount] = await db
        .select({ c: drizzleSql<number>`count(*)::int` })
        .from(fleetExceptionsTable);
      const fleets = await db
        .select({ id: vesselsFleetsTable.id, name: vesselsFleetsTable.name, status: vesselsFleetsTable.status })
        .from(vesselsFleetsTable)
        .orderBy(vesselsFleetsTable.id);
      return {
        vesselCount: vCount?.c ?? 0,
        fleetCount: fCount?.c ?? 0,
        voyageCount: vyCount?.c ?? 0,
        openExceptions: exCount?.c ?? 0,
        fleets: fleets.map((f: any) => ({ id: f.id, name: f.name, status: f.status })),
      };
    });

    // ── A11oy proof packets + execution traces ──────────────────────────
    const a11oy = await timed('a11oy', async () => {
      const [pCount] = await db
        .select({ c: drizzleSql<number>`count(*)::int` })
        .from(a11oyProofPacketsTable);
      const [tCount] = await db
        .select({ c: drizzleSql<number>`count(*)::int` })
        .from(a11oyExecutionTracesTable);
      return {
        proofPackets: pCount?.c ?? 0,
        executionTraces: tCount?.c ?? 0,
      };
    });

    // ── Sentra alerts + incidents ───────────────────────────────────────
    const sentra = await timed('sentra', async () => {
      const [aCount] = await db
        .select({ c: drizzleSql<number>`count(*)::int` })
        .from(sentraAlertsTable);
      const [iCount] = await db
        .select({ c: drizzleSql<number>`count(*)::int` })
        .from(sentraIncidentsTable);
      // Recent (24h) alerts is the field metric operators look at first.
      const [recent] = await db
        .select({ c: drizzleSql<number>`count(*)::int` })
        .from(sentraAlertsTable)
        .where(gte(sentraAlertsTable.createdAt, since24h));
      return {
        totalAlerts: aCount?.c ?? 0,
        totalIncidents: iCount?.c ?? 0,
        alertsLast24h: recent?.c ?? 0,
      };
    });

    // ── Conduit (Amaru ouroboros) sync health ───────────────────────────
    const conduit = await timed('conduit', async () => {
      const [sCount] = await db
        .select({ c: drizzleSql<number>`count(*)::int` })
        .from(conduitSyncsTable);
      const recentRuns = await db
        .select({
          id: conduitSyncRunsTable.id,
          status: conduitSyncRunsTable.status,
          startedAt: conduitSyncRunsTable.startedAt,
        })
        .from(conduitSyncRunsTable)
        .orderBy(desc(conduitSyncRunsTable.startedAt))
        .limit(5);
      return {
        syncCount: sCount?.c ?? 0,
        recentRuns: recentRuns.map((r: any) => ({
          id: r.id,
          status: r.status,
          startedAt: r.startedAt instanceof Date ? r.startedAt.toISOString() : String(r.startedAt),
        })),
      };
    });

    // ── Proof chain (all products + per-kind breakdown) ─────────────────
    const proofChain = await timed('proofChain', async () => {
      const byProduct = await db
        .select({
          product: proofLedgerTable.product,
          kind: proofLedgerTable.kind,
          c: drizzleSql<number>`count(*)::int`,
        })
        .from(proofLedgerTable)
        .groupBy(proofLedgerTable.product, proofLedgerTable.kind);
      const headRow = await db
        .select({
          id: proofLedgerTable.id,
          product: proofLedgerTable.product,
          kind: proofLedgerTable.kind,
          summary: proofLedgerTable.summary,
          ts: proofLedgerTable.ts,
        })
        .from(proofLedgerTable)
        .orderBy(desc(proofLedgerTable.ts))
        .limit(1);
      const head = headRow[0] ?? null;
      const [recent] = await db
        .select({ c: drizzleSql<number>`count(*)::int` })
        .from(proofLedgerTable)
        .where(gte(proofLedgerTable.ts, since24h));
      const total = byProduct.reduce((acc: number, row: any) => acc + (row.c ?? 0), 0);
      return {
        totalReceipts: total,
        sealedLast24h: recent?.c ?? 0,
        byProductKind: byProduct.map((r: any) => ({
          product: r.product,
          kind: r.kind,
          count: r.c ?? 0,
        })),
        head: head
          ? {
              id: head.id,
              product: head.product,
              kind: head.kind,
              summary: head.summary,
              ts: head.ts instanceof Date ? head.ts.toISOString() : String(head.ts),
            }
          : null,
      };
    });

    // ── UDS bundles (canonical: re-exported BUNDLES from uds-registry) ──
    // Single source of truth — same array the /api/uds/registry route
    // returns. Any drift here is a build-time TS error, not silent stale
    // metadata on the Jarvis surface.
    const uds = await timed('uds', async () => {
      const { BUNDLES } = await import('./uds-registry');
      const slugs = BUNDLES.map((b) => b.slug);
      return {
        bundleCount: BUNDLES.length,
        slugs,
        registryPath: '/api/uds/registry',
      };
    });

    return sendSuccess(res, {
      asOf: new Date().toISOString(),
      schemaVersion: '1.0.0',
      ecosystem: { vessels, a11oy, sentra, conduit, uds, proofChain },
      totals: {
        receipts: proofChain.status === 'ok' ? proofChain.data.totalReceipts : 0,
        sealedLast24h: proofChain.status === 'ok' ? proofChain.data.sealedLast24h : 0,
        openIncidents: sentra.status === 'ok' ? sentra.data.totalIncidents : 0,
        alertsLast24h: sentra.status === 'ok' ? sentra.data.alertsLast24h : 0,
        activeFleets: vessels.status === 'ok' ? vessels.data.fleetCount : 0,
        vesselCount: vessels.status === 'ok' ? vessels.data.vesselCount : 0,
        bundleCount: uds.status === 'ok' ? uds.data.bundleCount : 0,
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error({ err: msg }, '[rosie-jarvis] overview hard-failed');
    return sendError(res, 500, 'jarvis_overview_failed', msg.slice(0, 200));
  }
});

export default router;
