import {
  db,
  pcConnectorAccountsTable,
  pcConnectorSyncRunsTable,
  pcSourceItemsTable,
  pcEmailsTable,
  pcDocumentsTable,
  pcWebhookSubscriptionsTable,
  pcGraphSubscriptionStateTable,
  pcAuditEventsTable,
} from "@workspace/db";
import { eq, and, desc, sql, lte } from "drizzle-orm";
import { logger } from "../lib/logger";
import { enqueuePrismJob, PRISM_JOB_TYPES } from "./prism-queue";

interface ConnectorConfig {
  tenantId?: string;
  clientId?: string;
  scopes?: string[];
  syncFolders?: string[];
  syncMailboxes?: string[];
}

interface SyncResult {
  recordsSynced: number;
  recordsFailed: number;
  errors: Array<{ record: string; error: string }>;
}

export async function createConnectorAccount(
  orgId: number,
  connectorType: string,
  displayName: string,
  config: ConnectorConfig
): Promise<number> {
  const [account] = await db.insert(pcConnectorAccountsTable).values({
    orgId,
    connectorType: connectorType as "microsoft_365",
    displayName,
    status: "pending_auth",
    config,
  }).returning({ id: pcConnectorAccountsTable.id });

  await db.insert(pcAuditEventsTable).values({
    orgId,
    action: "connector_created",
    entityType: "connector_account",
    entityId: account.id,
    details: { connectorType, displayName },
  });

  logger.info({ accountId: account.id, connectorType, orgId }, "[prism-connectors] Account created");
  return account.id;
}

export async function activateConnector(accountId: number): Promise<void> {
  await db.update(pcConnectorAccountsTable)
    .set({ status: "active", updatedAt: new Date() })
    .where(eq(pcConnectorAccountsTable.id, accountId));
}

export async function triggerSync(
  accountId: number,
  orgId: number,
  options: { fullSync?: boolean; actorId?: number } = {}
): Promise<number> {
  const [account] = await db.select().from(pcConnectorAccountsTable)
    .where(eq(pcConnectorAccountsTable.id, accountId));
  if (!account) throw new Error(`Connector account ${accountId} not found`);
  if (account.status !== "active") throw new Error(`Connector ${accountId} is not active (status: ${account.status})`);

  const [syncRun] = await db.insert(pcConnectorSyncRunsTable).values({
    connectorAccountId: accountId,
    status: "running",
    recordsSynced: 0,
    recordsFailed: 0,
  }).returning({ id: pcConnectorSyncRunsTable.id });

  await enqueuePrismJob(orgId, PRISM_JOB_TYPES.CONNECTOR_SYNC, {
    accountId,
    syncRunId: syncRun.id,
    fullSync: options.fullSync ?? false,
    connectorType: account.connectorType,
    config: account.config,
  }, {
    connectorAccountId: accountId,
    actorId: options.actorId,
    idempotencyKey: `sync-${accountId}-${Date.now()}`,
  });

  logger.info({ accountId, syncRunId: syncRun.id, orgId }, "[prism-connectors] Sync triggered");
  return syncRun.id;
}

export async function completeSyncRun(
  syncRunId: number,
  result: SyncResult
): Promise<void> {
  await db.update(pcConnectorSyncRunsTable).set({
    status: result.recordsFailed > 0 ? "partial_failure" : "completed",
    recordsSynced: result.recordsSynced,
    recordsFailed: result.recordsFailed,
    errorDetails: result.errors.length > 0 ? result.errors : null,
    completedAt: new Date(),
  }).where(eq(pcConnectorSyncRunsTable.id, syncRunId));

  const [run] = await db.select().from(pcConnectorSyncRunsTable)
    .where(eq(pcConnectorSyncRunsTable.id, syncRunId));

  if (run) {
    await db.update(pcConnectorAccountsTable)
      .set({ lastSyncAt: new Date(), updatedAt: new Date() })
      .where(eq(pcConnectorAccountsTable.id, run.connectorAccountId));
  }
}

export async function failSyncRun(syncRunId: number, error: string): Promise<void> {
  await db.update(pcConnectorSyncRunsTable).set({
    status: "failed",
    errorDetails: [{ error }],
    completedAt: new Date(),
  }).where(eq(pcConnectorSyncRunsTable.id, syncRunId));

  const [run] = await db.select().from(pcConnectorSyncRunsTable)
    .where(eq(pcConnectorSyncRunsTable.id, syncRunId));

  if (run) {
    await db.update(pcConnectorAccountsTable)
      .set({ status: "error", updatedAt: new Date() })
      .where(eq(pcConnectorAccountsTable.id, run.connectorAccountId));
  }
}

export async function getConnectorHealth(orgId: number) {
  const accounts = await db.select().from(pcConnectorAccountsTable)
    .where(eq(pcConnectorAccountsTable.orgId, orgId))
    .orderBy(desc(pcConnectorAccountsTable.updatedAt));

  const health = [];
  for (const account of accounts) {
    const [latestSync] = await db.select().from(pcConnectorSyncRunsTable)
      .where(eq(pcConnectorSyncRunsTable.connectorAccountId, account.id))
      .orderBy(desc(pcConnectorSyncRunsTable.startedAt))
      .limit(1);

    const syncLagMs = account.lastSyncAt
      ? Date.now() - new Date(account.lastSyncAt).getTime()
      : null;

    health.push({
      accountId: account.id,
      connectorType: account.connectorType,
      displayName: account.displayName,
      status: account.status,
      lastSyncAt: account.lastSyncAt,
      syncLagMs,
      latestSync: latestSync ? {
        id: latestSync.id,
        status: latestSync.status,
        recordsSynced: latestSync.recordsSynced,
        recordsFailed: latestSync.recordsFailed,
        startedAt: latestSync.startedAt,
        completedAt: latestSync.completedAt,
      } : null,
    });
  }

  return health;
}

export async function registerGraphSubscription(
  orgId: number,
  connectorAccountId: number,
  resourcePath: string,
  changeType: string,
  subscriptionId: string,
  expirationDateTime: Date
): Promise<void> {
  await db.insert(pcGraphSubscriptionStateTable).values({
    orgId,
    connectorAccountId,
    resourcePath,
    subscriptionId,
    changeType,
    expirationDateTime,
    status: "active",
    lastRenewedAt: new Date(),
  });

  logger.info({ orgId, subscriptionId, resourcePath }, "[prism-connectors] Graph subscription registered");
}

export async function getExpiredSubscriptions() {
  return db.select().from(pcGraphSubscriptionStateTable)
    .where(and(
      eq(pcGraphSubscriptionStateTable.status, "active"),
      lte(pcGraphSubscriptionStateTable.expirationDateTime, new Date(Date.now() + 24 * 60 * 60 * 1000))
    ));
}

export async function getConnectorSyncHistory(accountId: number, limit = 20) {
  return db.select().from(pcConnectorSyncRunsTable)
    .where(eq(pcConnectorSyncRunsTable.connectorAccountId, accountId))
    .orderBy(desc(pcConnectorSyncRunsTable.startedAt))
    .limit(limit);
}
