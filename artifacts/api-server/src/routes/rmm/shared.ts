import { Router, type IRouter } from "express";
import { db, mspDevicesTable, mspClientsTable } from "@szl-holdings/db";
import { eq, desc, sql, and } from "drizzle-orm";
import { sendSuccess, sendCreated, sendNotFound, sendBadRequest, handleRouteError } from "../../lib/api-response";
import { authMiddleware, requireRole } from "../../middlewares/auth";
import { logger } from "../../lib/logger";
import { createRmmProvider, setCachedProvider, getCachedProvider, clearProviderCache, type RmmProviderConfig } from "../../services/rmm-provider";
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto";

const SUPPORTED_PROVIDERS = ["ninjaone", "connectwise_automate", "connectwise_manage", "halopsa", "datto_rmm", "autotask_psa"] as const;

const ENCRYPTION_KEY = (() => {
  const key = process.env.CONNECTOR_ENCRYPTION_KEY;
  if (!key) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("CONNECTOR_ENCRYPTION_KEY environment variable is required in production for credential encryption");
    }
    logger.warn("CONNECTOR_ENCRYPTION_KEY not set — using derived development key. Set this variable before deploying to production.");
    return scryptSync(process.env.DATABASE_URL ?? "rmm-dev-only-key", "rmm-connector-salt", 32);
  }
  return scryptSync(key, "rmm-connector-salt", 32);
})();

function encryptConfig(config: Record<string, unknown>): string {
  const iv = randomBytes(16);
  const cipher = createCipheriv("aes-256-gcm", ENCRYPTION_KEY, iv);
  const plaintext = JSON.stringify(config);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `enc:${iv.toString("hex")}:${tag.toString("hex")}:${encrypted.toString("hex")}`;
}

function decryptConfig(data: unknown): Record<string, unknown> {
  if (typeof data === "string" && data.startsWith("enc:")) {
    const parts = data.split(":");
    if (parts.length !== 4) return {};
    const iv = Buffer.from(parts[1], "hex");
    const tag = Buffer.from(parts[2], "hex");
    const encrypted = Buffer.from(parts[3], "hex");
    const decipher = createDecipheriv("aes-256-gcm", ENCRYPTION_KEY, iv);
    decipher.setAuthTag(tag);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return JSON.parse(decrypted.toString("utf8"));
  }
  if (typeof data === "object" && data !== null) return data as Record<string, unknown>;
  return {};
}

export const auth = authMiddleware({ required: true });
export const authWrite = authMiddleware({ required: true });
export const roleAdmin = requireRole("admin");
export const roleOperator = requireRole("admin", "operator", "ops");

type ConnectorRow = {
  id: number;
  name: string;
  provider: string;
  mode: string;
  status: string;
  authType: string;
  config: Record<string, unknown>;
  lastSyncAt: Date | null;
  lastErrorAt: Date | null;
  lastError: string | null;
  syncIntervalMinutes: number | null;
  deviceCount: number | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type PlaybookRow = {
  id: number;
  name: string;
  description: string | null;
  status: string;
  executionMode: string;
  detectionRules: unknown[];
  remediationActions: unknown[];
  targetDeviceTypes: string[];
  targetClientIds: number[];
  confidenceThreshold: number | null;
  successRate: number | null;
  totalExecutions: number | null;
  createdAt: Date;
  updatedAt: Date;
};

type RemoteActionRow = {
  id: number;
  deviceId: number | null;
  connectorId: number | null;
  actionType: string;
  target: string | null;
  parameters: Record<string, unknown>;
  status: string;
  requiresApproval: boolean | null;
  requestedBy: string;
  approvedBy: string | null;
  approvedAt: Date | null;
  providerJobId: string | null;
  result: Record<string, unknown> | null;
  errorMessage: string | null;
  executedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type HealingExecutionRow = {
  id: number;
  playbookId: number | null;
  deviceId: number | null;
  clientId: number | null;
  triggeredBy: string;
  status: string;
  approvalRequired: boolean | null;
  approvedBy: string | null;
  approvedAt: Date | null;
  detectionContext: Record<string, unknown>;
  beforeMetrics: unknown;
  afterMetrics: unknown;
  actionsExecuted: unknown[];
  healingConfidenceScore: number | null;
  ticketId: number | null;
  psaTicketRef: string | null;
  notes: string | null;
  startedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
};

export async function queryConnectors(): Promise<ConnectorRow[]> {
  const rows = await db.execute<ConnectorRow>(sql`
    SELECT id, name, provider, mode, status, auth_type as "authType", config,
           last_sync_at as "lastSyncAt", last_error_at as "lastErrorAt", last_error as "lastError",
           sync_interval_minutes as "syncIntervalMinutes", device_count as "deviceCount",
           notes, created_at as "createdAt", updated_at as "updatedAt"
    FROM msp_rmm_connectors
    ORDER BY created_at DESC
  `);
  return rows.rows as ConnectorRow[];
}

export async function queryConnectorById(id: number): Promise<ConnectorRow | null> {
  const rows = await db.execute<ConnectorRow>(sql`
    SELECT id, name, provider, mode, status, auth_type as "authType", config,
           last_sync_at as "lastSyncAt", last_error_at as "lastErrorAt", last_error as "lastError",
           sync_interval_minutes as "syncIntervalMinutes", device_count as "deviceCount",
           notes, created_at as "createdAt", updated_at as "updatedAt"
    FROM msp_rmm_connectors WHERE id = ${id}
  `);
  return (rows.rows[0] as ConnectorRow) ?? null;
}

export function stripSecrets(config: Record<string, unknown>): Record<string, unknown> {
  const safe: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(config)) {
    if (["clientSecret", "password", "apiKey"].includes(k) && typeof v === "string" && v.length > 4) {
      safe[k] = `${"*".repeat(v.length - 4)}${v.slice(-4)}`;
    } else {
      safe[k] = v;
    }
  }
  return safe;
}

export function buildProviderConfig(row: ConnectorRow): RmmProviderConfig {
  const cfg = decryptConfig(row.config);
  return {
    provider: row.provider,
    authType: row.authType as RmmProviderConfig["authType"],
    baseUrl: cfg.baseUrl as string | undefined,
    apiKey: cfg.apiKey as string | undefined,
    clientId: cfg.clientId as string | undefined,
    clientSecret: cfg.clientSecret as string | undefined,
    username: cfg.username as string | undefined,
    password: cfg.password as string | undefined,
    companyId: cfg.companyId as string | undefined,
  };
}

export function isProviderSupported(provider: string): boolean {
  return (SUPPORTED_PROVIDERS as readonly string[]).includes(provider);
}
