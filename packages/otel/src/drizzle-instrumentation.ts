/**
 * Drizzle ORM query instrumentation.
 *
 * Wraps the pg Pool.query method to emit OTel spans for every
 * SQL statement executed through the Drizzle db client.
 *
 * Usage:
 *   import { createDrizzleInstrumentation } from "@szl-holdings/otel/drizzle";
 *   import { pool } from "@szl-holdings/db";
 *   createDrizzleInstrumentation(pool);
 */
import * as api from "@opentelemetry/api";
import type { Pool } from "pg";

const SLOW_QUERY_MS = 500;

export function createDrizzleInstrumentation(pool: Pool): void {
  const tracer = api.trace.getTracer("drizzle-orm");
  const originalQuery = pool.query.bind(pool) as typeof pool.query;

  // @ts-expect-error — overriding overloaded pool.query for instrumentation
  pool.query = async function instrumentedQuery(...args: unknown[]) {
    const sql = typeof args[0] === "string" ? args[0] : (args[0] as { text?: string })?.text ?? "unknown";
    const tableName = extractTableName(sql);
    const operation = extractOperation(sql);

    const start = Date.now();
    return tracer.startActiveSpan(
      `db.${operation} ${tableName}`,
      { kind: api.SpanKind.CLIENT },
      async (span) => {
        span.setAttributes({
          "db.system": "postgresql",
          "db.operation": operation,
          "db.sql.table": tableName,
          "db.statement": sql.slice(0, 512),
        });
        try {
          // @ts-expect-error — spread over overloaded function
          const result = await originalQuery(...args);
          const durationMs = Date.now() - start;
          span.setAttribute("db.duration_ms", durationMs);
          if (durationMs > SLOW_QUERY_MS) {
            span.setAttribute("db.slow_query", true);
          }
          span.setStatus({ code: api.SpanStatusCode.OK });
          return result;
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          span.recordException(err instanceof Error ? err : new Error(message));
          span.setStatus({ code: api.SpanStatusCode.ERROR, message });
          throw err;
        } finally {
          span.end();
        }
      },
    );
  };
}

function extractOperation(sql: string): string {
  const match = sql.trim().match(/^(SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|TRUNCATE)/i);
  return match?.[1]?.toUpperCase() ?? "QUERY";
}

function extractTableName(sql: string): string {
  const fromMatch = sql.match(/\bFROM\s+"?(\w+)"?/i);
  if (fromMatch?.[1]) return fromMatch[1];
  const intoMatch = sql.match(/\bINTO\s+"?(\w+)"?/i);
  if (intoMatch?.[1]) return intoMatch[1];
  const updateMatch = sql.match(/\bUPDATE\s+"?(\w+)"?/i);
  if (updateMatch?.[1]) return updateMatch[1];
  return "unknown";
}
