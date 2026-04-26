import { randomUUID } from 'node:crypto';
import { db, sentraAlertsTable } from '@szl-holdings/db';
import type { NormalizedAlert } from '../siem/adapter-interface';
import { getAdapter } from '../siem/registry';
import { normalizeWebhookPayload } from '../siem/adapters/generic-webhook';
import { logger } from '../lib/logger';

export interface SiemConnection {
  id: string;
  name: string;
  adapterId: string;
  config: Record<string, unknown>;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
  lastTestedAt?: string;
  lastTestResult?: { ok: boolean; message: string };
  alertsIngested: number;
}

export const siemConnectionsStore: Map<string, SiemConnection> = new Map();

async function onAlertIngested(connection: SiemConnection, alert: NormalizedAlert): Promise<void> {
  try {
    await db
      .insert(sentraAlertsTable)
      .values({
        id: alert.id,
        title: alert.title,
        severity: alert.severity as 'critical' | 'high' | 'medium' | 'low',
        source: alert.source,
        status: 'open',
        description: alert.description,
        asset: alert.asset ?? null,
        detectedAt: new Date(alert.detectedAt),
      })
      .onConflictDoNothing();
    connection.alertsIngested += 1;
    logger.info({ connectionId: connection.id, alertId: alert.id }, '[siem] alert ingested');
  } catch (err) {
    logger.error({ connectionId: connection.id, alertId: alert.id, err }, '[siem] failed to ingest alert');
  }
}

export function startConnection(connection: SiemConnection): void {
  const adapter = getAdapter(connection.adapterId);
  if (!adapter) return;
  if (connection.adapterId === 'generic-webhook') return;
  adapter.start(connection.id, { ...connection.config, connectionName: connection.name }, (alert) => {
    void onAlertIngested(connection, alert);
  });
}

export function stopConnection(connection: SiemConnection): void {
  const adapter = getAdapter(connection.adapterId);
  if (!adapter) return;
  adapter.stop(connection.id);
}

export function createConnection(data: {
  name: string;
  adapterId: string;
  config: Record<string, unknown>;
}): SiemConnection {
  const connection: SiemConnection = {
    id: randomUUID(),
    name: data.name,
    adapterId: data.adapterId,
    config: data.config,
    enabled: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    alertsIngested: 0,
  };
  siemConnectionsStore.set(connection.id, connection);
  return connection;
}

export function enableConnection(id: string): SiemConnection | null {
  const conn = siemConnectionsStore.get(id);
  if (!conn) return null;
  // Idempotent: stop any existing poller before (re-)starting to prevent duplicates
  if (conn.enabled) stopConnection(conn);
  conn.enabled = true;
  conn.updatedAt = new Date().toISOString();
  startConnection(conn);
  siemConnectionsStore.set(id, conn);
  return conn;
}

export function disableConnection(id: string): SiemConnection | null {
  const conn = siemConnectionsStore.get(id);
  if (!conn) return null;
  conn.enabled = false;
  conn.updatedAt = new Date().toISOString();
  stopConnection(conn);
  siemConnectionsStore.set(id, conn);
  return conn;
}

export function ingestWebhookAlert(connectionId: string, payload: unknown): { ok: boolean; error?: string } {
  const conn = siemConnectionsStore.get(connectionId);
  if (!conn) return { ok: false, error: 'Connection not found' };
  if (!conn.enabled) return { ok: false, error: 'Connection is disabled' };
  if (conn.adapterId !== 'generic-webhook') return { ok: false, error: 'Not a webhook connection' };

  const alert: NormalizedAlert = normalizeWebhookPayload(payload, connectionId, conn.name);
  void onAlertIngested(conn, alert);
  return { ok: true };
}
