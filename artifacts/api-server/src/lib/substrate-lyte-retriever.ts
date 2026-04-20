/**
 * Concrete Lyte Retriever Adapter for @szl/substrate
 *
 * Queries real Lyte data (lyteSignalsTable, lyteIncidentsTable, lyteActionsTable)
 * and formats it as retriever documents for the Opportunity Audit pipeline.
 *
 * Registered at API-server startup so the Opportunity Audit workflow runs against
 * live Lyte data rather than falling back to no-op synthetic documents.
 */

import { db, lyteSignalsTable, lyteIncidentsTable, lyteActionsTable } from "@szl-holdings/db";
import { desc } from "drizzle-orm";
import { logger } from "./logger.js";
import type { RetrievedDocument, RetrieverAdapterInput } from "@szl/substrate";

async function queryLyteData(
  _query: string,
  topK: number,
): Promise<RetrievedDocument[]> {
  const docs: RetrievedDocument[] = [];

  const [signals, incidents, actions] = await Promise.all([
    db
      .select()
      .from(lyteSignalsTable)
      .orderBy(desc(lyteSignalsTable.receivedAt))
      .limit(Math.ceil(topK / 2))
      .catch((): Array<typeof lyteSignalsTable.$inferSelect> => []),

    db
      .select()
      .from(lyteIncidentsTable)
      .orderBy(desc(lyteIncidentsTable.createdAt))
      .limit(Math.ceil(topK / 4))
      .catch((): Array<typeof lyteIncidentsTable.$inferSelect> => []),

    db
      .select()
      .from(lyteActionsTable)
      .orderBy(desc(lyteActionsTable.createdAt))
      .limit(Math.ceil(topK / 4))
      .catch((): Array<typeof lyteActionsTable.$inferSelect> => []),
  ]);

  for (const s of signals) {
    const row = s as Record<string, unknown>;
    const sev = String(row["severity"] ?? "");
    docs.push({
      id: `signal-${String(row["id"] ?? "")}`,
      content: [
        `Signal sourceType=${String(row["sourceType"] ?? "")}`,
        `source=${String(row["source"] ?? "")}`,
        `severity=${sev}`,
        `status=${String(row["status"] ?? "")}`,
        `receivedAt=${String(row["receivedAt"] ?? "")}`,
      ].join(" | "),
      relevanceScore: sev === "critical" ? 0.95 : sev === "high" ? 0.85 : 0.7,
      source: "lyte_signals",
      metadata: {
        receivedAt: row["receivedAt"] ?? null,
        severity: row["severity"] ?? null,
        source: row["source"] ?? null,
      },
    });
  }

  for (const inc of incidents) {
    const row = inc as Record<string, unknown>;
    docs.push({
      id: `incident-${String(row["id"] ?? "")}`,
      content: [
        `Incident title=${String(row["title"] ?? "unknown")}`,
        `status=${String(row["status"] ?? "")}`,
        `severity=${String(row["severity"] ?? "")}`,
        `createdAt=${String(row["createdAt"] ?? "")}`,
      ].join(" | "),
      relevanceScore: row["status"] === "open" ? 0.9 : 0.65,
      source: "lyte_incidents",
      metadata: {
        createdAt: row["createdAt"] ?? null,
        status: row["status"] ?? null,
        severity: row["severity"] ?? null,
      },
    });
  }

  for (const act of actions) {
    const row = act as Record<string, unknown>;
    docs.push({
      id: `action-${String(row["id"] ?? "")}`,
      content: [
        `Action title=${String(row["title"] ?? row["description"] ?? "unknown")}`,
        `state=${String(row["state"] ?? "")}`,
        `category=${String(row["signalCategory"] ?? "")}`,
      ].join(" | "),
      relevanceScore: 0.75,
      source: "lyte_actions",
      metadata: {
        state: row["state"] ?? null,
        createdAt: row["createdAt"] ?? null,
      },
    });
  }

  return docs.sort((a, b) => b.relevanceScore - a.relevanceScore).slice(0, topK);
}

let registered = false;

/**
 * Register the concrete Lyte retriever adapter with the substrate registry.
 * Safe to call multiple times (idempotent).
 */
export async function registerSubstrateLyteRetriever(): Promise<void> {
  if (registered) return;

  try {
    const { registerLyteRetrieverAdapter } = await import("@szl/substrate");

    registerLyteRetrieverAdapter({
      id: "lyte-retriever",
      name: "Lyte Data Retriever",
      mcpCapabilities: {
        id: "lyte-retriever",
        name: "Lyte Retriever",
        version: "1.0.0",
      },
      async retrieve(input: RetrieverAdapterInput): Promise<RetrievedDocument[]> {
        return queryLyteData(input.query, input.topK ?? 10);
      },
    });

    registered = true;
    logger.info(
      "[substrate] Lyte retriever adapter registered — Opportunity Audit will run against live Lyte data",
    );
  } catch (err: unknown) {
    logger.error({ err }, "[substrate] Failed to register Lyte retriever adapter");
  }
}
