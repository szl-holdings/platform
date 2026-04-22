import { db } from '@szl-holdings/db';
import { createCipheriv, randomBytes, scryptSync } from 'node:crypto';
import { sql } from 'drizzle-orm';
import { logger } from './logger';

export async function ensureRmmTables(): Promise<void> {
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS msp_rmm_connectors (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        provider TEXT NOT NULL,
        mode TEXT NOT NULL DEFAULT 'both',
        status TEXT NOT NULL DEFAULT 'pending',
        auth_type TEXT NOT NULL DEFAULT 'api_key',
        config JSONB DEFAULT '{}',
        last_sync_at TIMESTAMPTZ,
        last_error_at TIMESTAMPTZ,
        last_error TEXT,
        sync_interval_minutes INTEGER DEFAULT 5,
        device_count INTEGER DEFAULT 0,
        notes TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS msp_rmm_device_metrics (
        id SERIAL PRIMARY KEY,
        device_id INTEGER REFERENCES msp_devices(id) ON DELETE CASCADE,
        device_db_id TEXT,
        connector_id INTEGER REFERENCES msp_rmm_connectors(id) ON DELETE SET NULL,
        provider_device_id TEXT,
        cpu INTEGER DEFAULT 0,
        memory INTEGER DEFAULT 0,
        disk INTEGER DEFAULT 0,
        network_in_kbps INTEGER DEFAULT 0,
        network_out_kbps INTEGER DEFAULT 0,
        agent_version TEXT,
        patch_status TEXT,
        services JSONB DEFAULT '[]',
        processes JSONB DEFAULT '[]',
        disk_fill_rate_gb_per_hour INTEGER,
        predicted_full_at TIMESTAMPTZ,
        snapshot_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS msp_rmm_device_metrics_device_idx ON msp_rmm_device_metrics(device_id)
    `);

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS msp_rmm_device_metrics_snapshot_idx ON msp_rmm_device_metrics(snapshot_at)
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS msp_healing_playbooks (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        status TEXT NOT NULL DEFAULT 'active',
        execution_mode TEXT NOT NULL DEFAULT 'human_gated',
        detection_rules JSONB DEFAULT '[]',
        remediation_actions JSONB DEFAULT '[]',
        target_device_types JSONB DEFAULT '[]',
        target_client_ids JSONB DEFAULT '[]',
        confidence_threshold INTEGER DEFAULT 70,
        success_rate INTEGER DEFAULT 0,
        total_executions INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS msp_healing_executions (
        id SERIAL PRIMARY KEY,
        playbook_id INTEGER REFERENCES msp_healing_playbooks(id) ON DELETE SET NULL,
        device_id INTEGER REFERENCES msp_devices(id) ON DELETE SET NULL,
        client_id INTEGER REFERENCES msp_clients(id) ON DELETE SET NULL,
        triggered_by TEXT NOT NULL DEFAULT 'auto',
        status TEXT NOT NULL DEFAULT 'pending_approval',
        approval_required BOOLEAN DEFAULT TRUE,
        approved_by TEXT,
        approved_at TIMESTAMPTZ,
        detection_context JSONB DEFAULT '{}',
        before_metrics JSONB,
        after_metrics JSONB,
        actions_executed JSONB DEFAULT '[]',
        healing_confidence_score INTEGER DEFAULT 0,
        ticket_id INTEGER REFERENCES msp_tickets(id) ON DELETE SET NULL,
        psa_ticket_ref TEXT,
        notes TEXT,
        started_at TIMESTAMPTZ,
        completed_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS msp_healing_exec_playbook_idx ON msp_healing_executions(playbook_id)
    `);

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS msp_healing_exec_device_idx ON msp_healing_executions(device_id)
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS msp_remote_actions (
        id SERIAL PRIMARY KEY,
        device_id INTEGER REFERENCES msp_devices(id) ON DELETE SET NULL,
        connector_id INTEGER REFERENCES msp_rmm_connectors(id) ON DELETE SET NULL,
        action_type TEXT NOT NULL,
        target TEXT,
        parameters JSONB DEFAULT '{}',
        status TEXT NOT NULL DEFAULT 'pending_approval',
        requires_approval BOOLEAN DEFAULT TRUE,
        requested_by TEXT NOT NULL DEFAULT 'system',
        approved_by TEXT,
        approved_at TIMESTAMPTZ,
        provider_job_id TEXT,
        result JSONB,
        error_message TEXT,
        executed_at TIMESTAMPTZ,
        completed_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await db.execute(sql`
      ALTER TABLE msp_remote_actions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    `);

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS msp_remote_actions_device_idx ON msp_remote_actions(device_id)
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS msp_psa_ticket_sync (
        id SERIAL PRIMARY KEY,
        internal_ticket_id INTEGER REFERENCES msp_tickets(id) ON DELETE CASCADE,
        connector_id INTEGER REFERENCES msp_rmm_connectors(id) ON DELETE SET NULL,
        psa_ticket_id TEXT,
        psa_url TEXT,
        sync_status TEXT NOT NULL DEFAULT 'pending',
        last_sync_at TIMESTAMPTZ,
        sla_breach BOOLEAN DEFAULT FALSE,
        sla_timer_started_at TIMESTAMPTZ,
        closed_at TIMESTAMPTZ,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await db.execute(sql`ALTER TABLE msp_devices ADD COLUMN IF NOT EXISTS connector_id INTEGER`);
    await db.execute(
      sql`CREATE INDEX IF NOT EXISTS msp_devices_connector_idx ON msp_devices(connector_id)`,
    );

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS msp_org_site_mappings (
        id SERIAL PRIMARY KEY,
        connector_id INTEGER NOT NULL REFERENCES msp_rmm_connectors(id) ON DELETE CASCADE,
        provider_org_id TEXT NOT NULL,
        provider_org_name TEXT,
        provider_site_id TEXT,
        provider_site_name TEXT,
        internal_client_id INTEGER REFERENCES msp_clients(id) ON DELETE SET NULL,
        sync_enabled BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await db.execute(
      sql`CREATE INDEX IF NOT EXISTS msp_org_site_connector_idx ON msp_org_site_mappings(connector_id)`,
    );
    await db.execute(
      sql`CREATE INDEX IF NOT EXISTS msp_org_site_client_idx ON msp_org_site_mappings(internal_client_id)`,
    );

    await backfillPlaintextConfigs();

    logger.info('RMM tables ensured (idempotent migration complete)');
  } catch (err) {
    logger.error({ err }, 'RMM table migration failed');
    throw err;
  }
}

async function backfillPlaintextConfigs(): Promise<void> {
  try {
    const rows = await db.execute<{ id: number; config: unknown }>(sql`
      SELECT id, config FROM msp_rmm_connectors
    `);

    const keyRaw =
      process.env.CONNECTOR_ENCRYPTION_KEY ?? process.env.DATABASE_URL ?? 'rmm-dev-only-key';
    const key = scryptSync(keyRaw, 'rmm-connector-salt', 32);
    let migrated = 0;

    for (const row of rows.rows as Array<{ id: number; config: unknown }>) {
      if (typeof row.config === 'string' && (row.config as string).startsWith('enc:')) continue;
      if (typeof row.config === 'object' && row.config !== null) {
        const iv = randomBytes(16);
        const cipher = createCipheriv('aes-256-gcm', key, iv);
        const plaintext = JSON.stringify(row.config);
        const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
        const tag = cipher.getAuthTag();
        const encStr = `enc:${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
        await db.execute(
          sql`UPDATE msp_rmm_connectors SET config = ${JSON.stringify(encStr)}::jsonb WHERE id = ${row.id}`,
        );
        migrated++;
      }
    }

    if (migrated > 0) {
      logger.info({ migrated }, 'Backfilled plaintext connector configs to encrypted format');
    }
  } catch (err) {
    logger.warn({ err }, 'Plaintext config backfill failed (non-fatal)');
  }
}
