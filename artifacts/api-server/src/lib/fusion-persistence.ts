/**
 * Persistence layer for FusionCortex alerts.
 *
 * Bridges the in-memory fusionCortex singleton (in @szl-holdings/ai-engine) to the
 * fusion_cortex_alerts database table so alerts survive server restarts.
 *
 * Call initFusionPersistence() once at server startup.
 */
import { fusionCortex } from '@szl-holdings/ai-engine';
import { type FusionAlert } from '@szl-holdings/ai-engine';
import { db, fusionCortexAlertsTable } from '@szl-holdings/db';
import { eq, gt } from 'drizzle-orm';
import { logger } from './logger';

let initialized = false;

export async function initFusionPersistence(): Promise<void> {
  if (initialized) return;
  initialized = true;

  await loadPersistedAlerts();

  fusionCortex.onAlert((alert) => {
    persistAlert(alert).catch((err) =>
      logger.warn({ err, alertId: alert.id }, '[fusion-persistence] failed to persist alert'),
    );
  });
}

async function loadPersistedAlerts(): Promise<void> {
  try {
    const now = new Date();
    const rows = await db
      .select()
      .from(fusionCortexAlertsTable)
      .where(gt(fusionCortexAlertsTable.expiresAt, now));

    let loaded = 0;
    for (const row of rows) {
      const alert: FusionAlert = {
        id: row.alertId,
        title: row.title,
        summary: row.summary,
        severity: row.severity as FusionAlert['severity'],
        category: row.category as FusionAlert['category'],
        confidence: Number(row.confidence),
        affectedDomains: row.affectedDomains,
        affectedEntities: (row.affectedEntities ?? []) as FusionAlert['affectedEntities'],
        evidenceChain: (row.evidenceChain ?? []) as FusionAlert['evidenceChain'],
        recommendedActions: row.recommendedActions,
        advisoryContext: row.advisoryContext ?? undefined,
        tags: row.tags,
        patternId: row.patternId ?? undefined,
        status: row.status as FusionAlert['status'],
        generatedAt: row.generatedAt.toISOString(),
        expiresAt: row.expiresAt.toISOString(),
      };
      fusionCortex.injectAlert({
        title: alert.title,
        summary: alert.summary,
        severity: alert.severity,
        category: alert.category,
        confidence: alert.confidence,
        affectedDomains: alert.affectedDomains,
        affectedEntities: alert.affectedEntities,
        evidenceChain: alert.evidenceChain,
        recommendedActions: alert.recommendedActions,
        advisoryContext: alert.advisoryContext,
        tags: alert.tags,
        patternId: alert.patternId,
      });
      loaded++;
    }

    if (loaded > 0) {
      logger.info({ loaded }, '[fusion-persistence] hydrated fusionCortex from DB');
    }
  } catch (err) {
    logger.warn({ err }, '[fusion-persistence] failed to load persisted alerts — starting cold');
  }
}

async function persistAlert(alert: FusionAlert): Promise<void> {
  await db
    .insert(fusionCortexAlertsTable)
    .values({
      alertId: alert.id,
      title: alert.title,
      summary: alert.summary,
      severity: alert.severity,
      category: alert.category,
      confidence: String(alert.confidence),
      affectedDomains: alert.affectedDomains,
      affectedEntities: alert.affectedEntities,
      evidenceChain: alert.evidenceChain,
      recommendedActions: alert.recommendedActions,
      advisoryContext: alert.advisoryContext,
      tags: alert.tags,
      patternId: alert.patternId,
      status: alert.status,
      generatedAt: new Date(alert.generatedAt),
      expiresAt: new Date(alert.expiresAt),
    })
    .onConflictDoNothing();
}

export async function syncAlertStatus(
  alertId: string,
  status: 'active' | 'acknowledged' | 'resolved' | 'escalated',
): Promise<void> {
  try {
    await db
      .update(fusionCortexAlertsTable)
      .set({ status })
      .where(eq(fusionCortexAlertsTable.alertId, alertId));
  } catch (err) {
    logger.warn({ err, alertId }, '[fusion-persistence] failed to sync alert status');
  }
}
