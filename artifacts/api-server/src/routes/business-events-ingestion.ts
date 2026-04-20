import { Router, type IRouter } from "express";
import { bodyShape } from "@szl-holdings/contracts/common";
import { z } from "zod";
import { randomUUID } from "crypto";
import { logger } from "../lib/logger";
import { authMiddleware, requireRole } from "../middlewares/auth";
import { db } from "@szl-holdings/db";
import { analyticsEventsTable } from "@szl-holdings/db/schema";
import { eq, and, gte, desc, sql } from "drizzle-orm";
import type {
  ATLASEvent,
  KPIIngestionRecord,
  DomainTransactionRecord,
  BatchIngestionResult,
} from "@szl-holdings/business-events";
import { validateBody, validateQuery, listQuerySchema } from "../lib/validation";

const router: IRouter = Router();

const SOURCE_APP = "business-events";
const WINDOW_MS = 24 * 60 * 60 * 1000;

function atlasEventToRow(event: ATLASEvent) {
  const { eventId, eventClass, domain, tenantId, timestamp, ...rest } = event;
  return {
    eventId,
    eventName: eventClass,
    domain,
    sourceApp: SOURCE_APP,
    tenantId: tenantId ?? null,
    occurredAt: new Date(timestamp),
    serverSide: true as const,
    properties: rest as Record<string, unknown>,
    dimensions: {} as Record<string, string>,
  };
}

function rowToAtlasEvent(row: typeof analyticsEventsTable.$inferSelect): ATLASEvent {
  const props = (row.properties ?? {}) as Record<string, unknown>;
  return {
    eventId: row.eventId,
    eventClass: row.eventName as ATLASEvent["eventClass"],
    domain: row.domain,
    tenantId: row.tenantId ?? undefined,
    timestamp: row.occurredAt.getTime(),
    schemaVersion: (props.schemaVersion as string | undefined) ?? "1.0",
    ...props,
  } as ATLASEvent;
}

function kpiToAtlasEvent(record: KPIIngestionRecord): ATLASEvent {
  const name = record.kpiName.toLowerCase();
  const base = {
    eventId: `kpi-${randomUUID()}`,
    domain: record.domain,
    tenantId: record.tenantId,
    correlationId: record.correlationId,
    entityIds: record.entityIds,
    timestamp: record.timestamp ?? Date.now(),
    schemaVersion: "1.0" as const,
    metadata: {
      kpiName: record.kpiName,
      value: record.value,
      unit: record.unit,
      ...record.metadata,
    },
  };

  if (name.includes("risk") || name.includes("threat") || name.includes("violation")) {
    return {
      ...base,
      eventClass: "business.risk.detected",
      riskType: record.kpiName,
      riskScore: Math.min(100, Math.max(0, record.value)),
    };
  }

  if (name.includes("opportunity") || name.includes("lead") || name.includes("pipeline")) {
    return {
      ...base,
      eventClass: "business.opportunity.created",
      opportunityType: record.kpiName,
      opportunityId: base.eventId,
      estimatedValue: {
        amount: record.value,
        currency: record.unit ?? "USD",
        type: "estimated",
      },
    };
  }

  return {
    ...base,
    eventClass: "outcome.realized",
    outcomeType: record.kpiName,
    measuredValue: {
      amount: record.value,
      currency: record.unit ?? "USD",
      type: "created",
    },
  };
}

function domainTxToAtlasEvent(record: DomainTransactionRecord): ATLASEvent {
  const base = {
    eventId: `tx-${record.transactionId ?? randomUUID()}`,
    domain: record.domain,
    tenantId: record.tenantId,
    correlationId: record.correlationId,
    workflowId: record.workflowId,
    timestamp: Date.now(),
    schemaVersion: "1.0" as const,
    metadata: record.metadata,
  };

  if (record.success) {
    return {
      ...base,
      eventClass: "business.transaction.completed",
      transactionType: record.transactionType,
      transactionId: record.transactionId,
      durationMs: record.durationMs,
      outcome: "success",
      businessValue: record.businessValueAmount != null
        ? {
            amount: record.businessValueAmount,
            currency: record.businessValueCurrency ?? "USD",
            type: "created",
          }
        : undefined,
    };
  }

  return {
    ...base,
    eventClass: "business.transaction.failed",
    transactionType: record.transactionType,
    transactionId: record.transactionId,
    durationMs: record.durationMs,
    errorCode: record.errorCode,
    errorMessage: record.errorMessage,
  };
}

router.post(
  "/business-events/kpi",
  authMiddleware({ required: false }),
  validateBody(bodyShape({
      "records": z.unknown().optional(),
    })),
  async (req, res) => {
    try {
      const body = req.body as {
        records?: KPIIngestionRecord[];
      };

      if (!Array.isArray(body.records) || body.records.length === 0) {
        res.status(400).json({ error: "records[] is required" });
        return;
      }

      const result: BatchIngestionResult = {
        total: body.records.length,
        succeeded: 0,
        failed: 0,
        errors: [],
      };

      for (const record of body.records.slice(0, 200)) {
        try {
          if (!record.domain || !record.kpiName) {
            throw new Error("domain and kpiName required");
          }
          const event = kpiToAtlasEvent(record);
          await db.insert(analyticsEventsTable).values(atlasEventToRow(event));
          result.succeeded++;
        } catch (err) {
          result.failed++;
          result.errors.push(err instanceof Error ? err.message : String(err));
        }
      }

      res.status(202).json({ ok: true, result });
    } catch (err) {
      logger.error({ err }, "[business-events] kpi ingest error");
      res.status(500).json({ error: "ingest failed" });
    }
  },
);

router.post(
  "/business-events/transactions",
  authMiddleware({ required: false }),
  validateBody(bodyShape({
      "transactions": z.unknown().optional(),
    })),
  async (req, res) => {
    try {
      const body = req.body as {
        transactions?: DomainTransactionRecord[];
      };

      if (!Array.isArray(body.transactions) || body.transactions.length === 0) {
        res.status(400).json({ error: "transactions[] is required" });
        return;
      }

      let succeeded = 0;
      const errors: string[] = [];

      for (const tx of body.transactions.slice(0, 100)) {
        try {
          if (!tx.domain || !tx.transactionType) {
            throw new Error("domain and transactionType required");
          }
          const event = domainTxToAtlasEvent(tx);
          await db.insert(analyticsEventsTable).values(atlasEventToRow(event));
          succeeded++;
        } catch (err) {
          errors.push(err instanceof Error ? err.message : String(err));
        }
      }

      res.status(202).json({
        ok: true,
        result: { total: body.transactions.length, succeeded, failed: errors.length, errors },
      });
    } catch (err) {
      logger.error({ err }, "[business-events] transaction ingest error");
      res.status(500).json({ error: "ingest failed" });
    }
  },
);

router.post(
  "/business-events/emit",
  authMiddleware({ required: true }),
  validateBody(bodyShape({
      "domain": z.unknown().optional(),
      "eventClass": z.unknown().optional(),
      "eventId": z.unknown().optional(),
      "timestamp": z.unknown().optional(),
    })),
  async (req, res) => {
    try {
      const event = req.body as Partial<ATLASEvent>;

      if (!event.eventClass || !event.domain) {
        res.status(400).json({ error: "eventClass and domain are required" });
        return;
      }

      const complete: ATLASEvent = {
        ...event,
        eventId: event.eventId ?? randomUUID(),
        timestamp: event.timestamp ?? Date.now(),
        schemaVersion: "1.0",
      } as ATLASEvent;

      await db.insert(analyticsEventsTable).values(atlasEventToRow(complete));
      res.status(201).json({ ok: true, eventId: complete.eventId });
    } catch (err) {
      logger.error({ err }, "[business-events] emit error");
      res.status(500).json({ error: "emit failed" });
    }
  },
);

router.get(
  "/business-events/summary",
  authMiddleware(),
  requireRole("ops", "admin", "viewer"),
  async (_req, res) => {
    try {
      const cutoff = new Date(Date.now() - WINDOW_MS);

      const [byClassRows, byDomainRows, recentRows] = await Promise.all([
        db
          .select({
            eventClass: analyticsEventsTable.eventName,
            count: sql<number>`cast(count(*) as int)`,
          })
          .from(analyticsEventsTable)
          .where(
            and(
              eq(analyticsEventsTable.sourceApp, SOURCE_APP),
              gte(analyticsEventsTable.occurredAt, cutoff),
            ),
          )
          .groupBy(analyticsEventsTable.eventName),

        db
          .select({
            domain: analyticsEventsTable.domain,
            count: sql<number>`cast(count(*) as int)`,
          })
          .from(analyticsEventsTable)
          .where(
            and(
              eq(analyticsEventsTable.sourceApp, SOURCE_APP),
              gte(analyticsEventsTable.occurredAt, cutoff),
            ),
          )
          .groupBy(analyticsEventsTable.domain),

        db
          .select()
          .from(analyticsEventsTable)
          .where(
            and(
              eq(analyticsEventsTable.sourceApp, SOURCE_APP),
              gte(analyticsEventsTable.occurredAt, cutoff),
            ),
          )
          .orderBy(desc(analyticsEventsTable.occurredAt))
          .limit(20),
      ]);

      const byEventClass: Record<string, number> = {};
      for (const row of byClassRows) {
        byEventClass[row.eventClass] = row.count;
      }

      const byDomain: Record<string, number> = {};
      for (const row of byDomainRows) {
        byDomain[row.domain] = row.count;
      }

      const totalEvents = Object.values(byEventClass).reduce((s, v) => s + v, 0);
      const recentEvents = recentRows.map(rowToAtlasEvent);

      res.setHeader("Cache-Control", "no-store");
      res.json({
        timestamp: new Date().toISOString(),
        windowHours: 24,
        totalEvents,
        byEventClass,
        byDomain,
        recentEvents,
      });
    } catch (err) {
      logger.error({ err }, "[business-events] summary error");
      res.status(500).json({ error: "summary failed" });
    }
  },
);

router.get(
  "/business-events/events",
  authMiddleware(),
  requireRole("ops", "admin"),
  validateQuery(listQuerySchema),
  async (req, res) => {
    try {
      const limit = Math.min(Number(req.query.limit ?? 50), 500);
      const domain = req.query.domain as string | undefined;

      const conditions = [eq(analyticsEventsTable.sourceApp, SOURCE_APP)];
      if (domain) {
        conditions.push(eq(analyticsEventsTable.domain, domain));
      }

      const rows = await db
        .select()
        .from(analyticsEventsTable)
        .where(and(...conditions))
        .orderBy(desc(analyticsEventsTable.occurredAt))
        .limit(limit);

      const events = rows.map(rowToAtlasEvent);
      res.setHeader("Cache-Control", "no-store");
      res.json({ events, count: events.length });
    } catch (err) {
      logger.error({ err }, "[business-events] events list error");
      res.status(500).json({ error: "list failed" });
    }
  },
);

export default router;
