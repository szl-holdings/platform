import type { ATLASEvent, ATLASDomain } from "../types.js";

export interface KPIIngestionRecord {
  domain: ATLASDomain;
  kpiName: string;
  value: number;
  unit?: string;
  tenantId?: string;
  correlationId?: string;
  entityIds?: Record<string, string>;
  metadata?: Record<string, unknown>;
  timestamp?: number;
}

export interface DomainTransactionRecord {
  domain: ATLASDomain;
  transactionType: string;
  transactionId: string;
  durationMs: number;
  success: boolean;
  tenantId?: string;
  correlationId?: string;
  workflowId?: string;
  businessValueAmount?: number;
  businessValueCurrency?: string;
  errorCode?: string;
  errorMessage?: string;
  metadata?: Record<string, unknown>;
}

function kpiToEventClass(
  kpiName: string,
): "business.risk.detected" | "business.opportunity.created" | "outcome.realized" {
  const name = kpiName.toLowerCase();
  if (name.includes("risk") || name.includes("threat") || name.includes("violation")) {
    return "business.risk.detected";
  }
  if (name.includes("opportunity") || name.includes("lead") || name.includes("pipeline")) {
    return "business.opportunity.created";
  }
  return "outcome.realized";
}

export function kpiRecordToAtlasEvent(record: KPIIngestionRecord): ATLASEvent {
  const eventClass = kpiToEventClass(record.kpiName);
  const base = {
    eventId: `kpi-${record.domain}-${record.kpiName}-${record.timestamp ?? Date.now()}`,
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

  if (eventClass === "business.risk.detected") {
    return {
      ...base,
      eventClass: "business.risk.detected",
      riskType: record.kpiName,
      riskScore: Math.min(100, Math.max(0, record.value)),
    };
  }

  if (eventClass === "business.opportunity.created") {
    return {
      ...base,
      eventClass: "business.opportunity.created",
      opportunityType: record.kpiName,
      opportunityId: base.eventId,
      estimatedValue: {
        amount: record.value,
        currency: record.unit,
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
      currency: record.unit,
      type: "created",
    },
  };
}

export function domainTransactionToAtlasEvent(
  record: DomainTransactionRecord,
): ATLASEvent {
  const base = {
    eventId: `tx-${record.transactionId}`,
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

export interface BatchIngestionResult {
  total: number;
  succeeded: number;
  failed: number;
  errors: string[];
}

export async function ingestKPIBatch(
  records: KPIIngestionRecord[],
  emit: (event: ATLASEvent) => void,
): Promise<BatchIngestionResult> {
  const result: BatchIngestionResult = {
    total: records.length,
    succeeded: 0,
    failed: 0,
    errors: [],
  };

  for (const record of records) {
    try {
      if (!record.domain || !record.kpiName) {
        throw new Error(`Invalid KPI record: domain and kpiName are required`);
      }
      const event = kpiRecordToAtlasEvent(record);
      emit(event);
      result.succeeded++;
    } catch (err) {
      result.failed++;
      result.errors.push(err instanceof Error ? err.message : String(err));
    }
  }

  return result;
}
