import { Router, type IRouter } from "express";
import { randomUUID } from "crypto";
import { logger } from "../lib/logger";
import { authMiddleware, requireRole } from "../middlewares/auth";
import type {
  ATLASEvent,
  KPIIngestionRecord,
  DomainTransactionRecord,
  BatchIngestionResult,
} from "@szl-holdings/business-events";

const router: IRouter = Router();

class InMemoryEventStore {
  private events: ATLASEvent[] = [];
  private readonly MAX_EVENTS = 5000;
  private readonly WINDOW_MS = 24 * 60 * 60 * 1000;

  push(event: ATLASEvent): void {
    this.events.push(event);
    if (this.events.length > this.MAX_EVENTS) {
      this.events.shift();
    }
  }

  getWindow(): ATLASEvent[] {
    const cutoff = Date.now() - this.WINDOW_MS;
    return this.events.filter((e) => e.timestamp >= cutoff);
  }

  countByClass(windowMs: number = this.WINDOW_MS): Record<string, number> {
    const cutoff = Date.now() - windowMs;
    const result: Record<string, number> = {};
    for (const event of this.events.filter((e) => e.timestamp >= cutoff)) {
      result[event.eventClass] = (result[event.eventClass] ?? 0) + 1;
    }
    return result;
  }

  countByDomain(windowMs: number = this.WINDOW_MS): Record<string, number> {
    const cutoff = Date.now() - windowMs;
    const result: Record<string, number> = {};
    for (const event of this.events.filter((e) => e.timestamp >= cutoff)) {
      result[event.domain] = (result[event.domain] ?? 0) + 1;
    }
    return result;
  }

  getRecent(limit: number, domain?: string): ATLASEvent[] {
    const all = domain
      ? this.events.filter((e) => e.domain === domain)
      : this.events;
    return all.slice(-limit).reverse();
  }

  clear(): void {
    this.events = [];
  }
}

const eventStore = new InMemoryEventStore();

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
          eventStore.push(event);
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
          eventStore.push(event);
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

      eventStore.push(complete);
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
  (_req, res) => {
    try {
      const windowMs = 24 * 60 * 60 * 1000;
      const byClass = eventStore.countByClass(windowMs);
      const byDomain = eventStore.countByDomain(windowMs);
      const recent = eventStore.getRecent(20);
      const totalInWindow = Object.values(byClass).reduce((s, v) => s + v, 0);

      res.setHeader("Cache-Control", "no-store");
      res.json({
        timestamp: new Date().toISOString(),
        windowHours: 24,
        totalEvents: totalInWindow,
        byEventClass: byClass,
        byDomain,
        recentEvents: recent,
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
  (req, res) => {
    try {
      const limit = Math.min(Number(req.query.limit ?? 50), 500);
      const domain = req.query.domain as string | undefined;
      const events = eventStore.getRecent(limit, domain);
      res.setHeader("Cache-Control", "no-store");
      res.json({ events, count: events.length });
    } catch (err) {
      logger.error({ err }, "[business-events] events list error");
      res.status(500).json({ error: "list failed" });
    }
  },
);

export default router;
