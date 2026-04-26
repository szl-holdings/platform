/**
 * cortex-graph-snapshot — reusable service for capturing CORTEX entity graph snapshots.
 *
 * Extracted from the POST /cortex/entity-graph/snapshot route so that both the
 * HTTP handler and the daily scheduler can share the same logic without duplication.
 */

import { ontologyEngine } from '@szl-holdings/ai-engine';
import {
  type GraphSnapshotEdge,
  type GraphSnapshotMeta,
  type GraphSnapshotNode,
  cortexGraphSnapshotsTable,
  db,
} from '@szl-holdings/db';
import crypto from 'node:crypto';
import { logger } from '../lib/logger';

const DEFAULT_RETENTION_DAYS = parseInt(process.env.CORTEX_SNAPSHOT_RETENTION_DAYS ?? '30', 10);

export interface CaptureSnapshotOptions {
  orgId: number;
  label?: string;
  domain?: string;
  limit?: number;
  minRisk?: number;
  retentionDays?: number;
  /** Explicitly mark the snapshot source. Defaults to 'manual' when label is provided, 'scheduled' otherwise. */
  source?: 'manual' | 'scheduled';
}

export interface CaptureSnapshotResult {
  snapshotUuid: string;
  orgId: number;
  label: string | null;
  snapshotAt: Date;
  expiresAt: Date;
  nodeCount: number;
  edgeCount: number;
}

/**
 * Captures a point-in-time entity graph snapshot for the given org and persists it.
 * This is the shared implementation used by both the HTTP route and the daily scheduler.
 */
export async function captureGraphSnapshot(
  opts: CaptureSnapshotOptions,
): Promise<CaptureSnapshotResult> {
  const {
    orgId,
    label,
    domain,
    limit: rawLimit = 60,
    minRisk: rawMinRisk = 0,
    retentionDays: rawRetention = DEFAULT_RETENTION_DAYS,
    source: explicitSource,
  } = opts;

  const limit = Math.min(Math.max(1, rawLimit), 150);
  const minRisk = Math.min(Math.max(0, rawMinRisk), 1);
  const retentionDays = Math.min(Math.max(1, rawRetention), 365);

  const domainEntities = await ontologyEngine.getDomainEntities(
    domain ?? 'vessels',
    Math.ceil(limit / 2),
  );

  const allDomains = ['vessels', 'firestorm', 'terra', 'prism', 'szl'];
  const crossDomainEntities = domain
    ? []
    : (
        await Promise.all(
          allDomains
            .slice(0, 4)
            .map((d) => ontologyEngine.getDomainEntities(d, Math.ceil(limit / 8))),
        )
      ).flat();

  const rawEntities = [...domainEntities, ...crossDomainEntities]
    .filter((e, i, arr) => arr.findIndex((x) => x.id === e.id) === i)
    .filter((e) => (e.riskScore ?? 0) >= minRisk)
    .slice(0, limit);

  const nodes: GraphSnapshotNode[] = rawEntities.map((e) => ({
    id: e.id,
    label: e.name,
    type: e.type,
    domain: e.domain,
    riskScore: e.riskScore ?? 0,
    tags: e.tags ?? [],
    metadata: e.metadata,
    lastSeen: e.lastUpdated,
  }));

  const entityIds = new Set(rawEntities.map((e) => e.id));
  const edgesRaw: GraphSnapshotEdge[] = [];

  for (const entity of rawEntities.slice(0, 20)) {
    try {
      const connections = await ontologyEngine.getEntityConnections(entity.id);
      const allConns = [
        ...connections.outgoing.map((c) => c.rel),
        ...connections.incoming.map((c) => c.rel),
      ];
      for (const conn of allConns) {
        if (entityIds.has(conn.fromEntityId) && entityIds.has(conn.toEntityId)) {
          edgesRaw.push({
            source: conn.fromEntityId,
            target: conn.toEntityId,
            type: conn.type,
            strength: conn.strength,
          });
        }
      }
    } catch {
      /* skip entity if connections unavailable */
    }
  }

  const edges: GraphSnapshotEdge[] = edgesRaw.filter(
    (e, i, arr) =>
      arr.findIndex(
        (x) => x.source === e.source && x.target === e.target && x.type === e.type,
      ) === i,
  );

  const graphStats = await ontologyEngine
    .getGraphStats()
    .catch(() => ({ totalEntities: 0, totalRelationships: 0 }));

  const snapshotAt = new Date();
  const expiresAt = new Date(snapshotAt.getTime() + retentionDays * 24 * 60 * 60 * 1000);

  const meta: GraphSnapshotMeta = {
    totalNodes: nodes.length,
    totalEdges: edges.length,
    domain: domain ?? 'all',
    minRisk,
    graphStats: graphStats as Record<string, unknown>,
    source: explicitSource ?? (label ? 'manual' : 'scheduled'),
  };

  const [created] = await db
    .insert(cortexGraphSnapshotsTable)
    .values({
      snapshotUuid: crypto.randomUUID(),
      orgId,
      label: label ?? null,
      nodes,
      edges,
      meta,
      retentionDays,
      expiresAt,
    })
    .returning();

  logger.info(
    { snapshotUuid: created.snapshotUuid, orgId, nodeCount: nodes.length, edgeCount: edges.length },
    '[APEX] Graph snapshot captured',
  );

  return {
    snapshotUuid: created.snapshotUuid,
    orgId: created.orgId ?? orgId,
    label: created.label,
    snapshotAt: created.snapshotAt,
    expiresAt: created.expiresAt,
    nodeCount: nodes.length,
    edgeCount: edges.length,
  };
}

/**
 * Builds a human-readable label for a scheduled snapshot, e.g. "Daily — Apr 21 00:00".
 */
export function buildScheduledSnapshotLabel(now: Date = new Date()): string {
  const month = now.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' });
  const day = now.getUTCDate();
  const hh = String(now.getUTCHours()).padStart(2, '0');
  const mm = String(now.getUTCMinutes()).padStart(2, '0');
  return `Daily — ${month} ${day} ${hh}:${mm}`;
}
