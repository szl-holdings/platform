import type { SourceConnector, ConnectionCheckResult, FieldDescriptor, ReadBatchResult } from '../connector-protocol';
import { db } from '@szl-holdings/db';
import { sql } from 'drizzle-orm';

const TABLE_NAME_RE = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
const COLUMN_NAME_RE = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

function validateTableName(table: string): string {
  const cleaned = table.trim();
  if (!TABLE_NAME_RE.test(cleaned)) {
    throw new Error(`Invalid table name: ${cleaned}`);
  }
  return cleaned;
}

function validateColumnName(col: string): string {
  const cleaned = col.trim();
  if (!COLUMN_NAME_RE.test(cleaned)) {
    throw new Error(`Invalid column name: ${cleaned}`);
  }
  return cleaned;
}

const QUERY_BLOCKLIST = /\b(DROP|ALTER|TRUNCATE|DELETE|INSERT|UPDATE|CREATE|GRANT|REVOKE|EXEC|EXECUTE)\b/i;

function validateReadOnlyQuery(query: string): string {
  const cleaned = query.replace(/;\s*$/, '').trim();
  if (QUERY_BLOCKLIST.test(cleaned)) {
    throw new Error('Only SELECT queries are allowed');
  }
  if (!cleaned.match(/^\s*SELECT\b/i)) {
    throw new Error('Query must start with SELECT');
  }
  return cleaned;
}

interface PgQueryResult {
  rows: Array<Record<string, unknown>>;
  fields?: Array<{ name: string; dataTypeID?: number }>;
}

function extractRows(result: unknown): Array<Record<string, unknown>> {
  const r = result as PgQueryResult;
  if (r && Array.isArray(r.rows)) return r.rows;
  if (Array.isArray(result)) return result as Array<Record<string, unknown>>;
  return [];
}

function extractFields(result: unknown): Array<{ name: string; dataTypeID?: number }> {
  const r = result as PgQueryResult;
  if (r && Array.isArray(r.fields)) return r.fields;
  return [];
}

async function tableHasColumn(table: string, column: string): Promise<boolean> {
  const result = await db.execute(sql`
    SELECT 1 FROM information_schema.columns
    WHERE table_name = ${table} AND column_name = ${column}
    LIMIT 1
  `);
  return extractRows(result).length > 0;
}

export const postgresSource: SourceConnector = {
  type: 'postgres',

  async checkConnection(_config: Record<string, unknown>): Promise<ConnectionCheckResult> {
    const start = Date.now();
    try {
      await db.execute(sql`SELECT 1`);
      return { success: true, message: 'PostgreSQL connection verified', latencyMs: Date.now() - start };
    } catch (err) {
      return { success: false, message: err instanceof Error ? err.message : 'Connection failed', latencyMs: Date.now() - start };
    }
  },

  async discover(config: Record<string, unknown>): Promise<{ fields: FieldDescriptor[] }> {
    const table = config.table as string | undefined;
    const query = config.query as string | undefined;

    if (table) {
      const safeTable = validateTableName(table);
      const result = await db.execute(sql`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = ${safeTable}
        ORDER BY ordinal_position
      `);
      const rows = extractRows(result);
      return {
        fields: rows.map((r) => ({
          name: String(r.column_name),
          label: String(r.column_name),
          type: String(r.data_type),
          required: r.is_nullable === 'NO',
        })),
      };
    }

    if (query) {
      const safeQuery = validateReadOnlyQuery(query);
      const wrappedQuery = `SELECT * FROM (${safeQuery}) AS _preview LIMIT 0`;
      try {
        const result = await db.execute(sql.raw(wrappedQuery));
        const cols = extractFields(result);
        return {
          fields: cols.map((c) => ({
            name: c.name,
            label: c.name,
            type: c.dataTypeID ? String(c.dataTypeID) : 'unknown',
          })),
        };
      } catch {
        return { fields: [] };
      }
    }

    return { fields: [] };
  },

  async previewRows(config: Record<string, unknown>, limit = 10): Promise<{ fields: string[]; rows: Array<Record<string, unknown>>; totalRows: number }> {
    const table = config.table as string | undefined;
    const query = config.query as string | undefined;
    const safeLimit = Math.max(1, Math.min(limit, 1000));

    if (table) {
      const safeTable = validateTableName(table);
      const result = await db.execute(
        sql`SELECT * FROM ${sql.identifier(safeTable)} LIMIT ${safeLimit}`
      );
      const rows = extractRows(result);
      const fields = rows.length > 0 ? Object.keys(rows[0]) : [];

      let totalRows = rows.length;
      try {
        const countResult = await db.execute(
          sql`SELECT count(*)::int as cnt FROM ${sql.identifier(safeTable)}`
        );
        const countRows = extractRows(countResult);
        totalRows = (countRows[0]?.cnt as number) ?? rows.length;
      } catch { /* use length */ }

      return { fields, rows, totalRows };
    }

    if (query) {
      const safeQuery = validateReadOnlyQuery(query);
      const wrappedQuery = `SELECT * FROM (${safeQuery}) AS _preview LIMIT ${safeLimit}`;
      const result = await db.execute(sql.raw(wrappedQuery));
      const rows = extractRows(result);
      const fields = rows.length > 0 ? Object.keys(rows[0]) : [];
      return { fields, rows, totalRows: rows.length };
    }

    return { fields: [], rows: [], totalRows: 0 };
  },

  async readBatch(config: Record<string, unknown>, options: {
    batchSize: number;
    cursor?: string | null;
    fullRefresh?: boolean;
  }): Promise<ReadBatchResult> {
    const table = config.table as string | undefined;
    const query = config.query as string | undefined;
    const cursorColumn = (config.cursorColumn as string) || 'updated_at';
    const fetchLimit = options.batchSize + 1;

    if (table) {
      const safeTable = validateTableName(table);

      const hasCursorCol = await tableHasColumn(safeTable, cursorColumn);

      if (!hasCursorCol || options.fullRefresh) {
        const offset = options.cursor ? parseInt(options.cursor, 10) || 0 : 0;
        const result = await db.execute(
          sql`SELECT * FROM ${sql.identifier(safeTable)} LIMIT ${fetchLimit} OFFSET ${offset}`
        );
        const rows = extractRows(result);
        const hasMore = rows.length > options.batchSize;
        const batch = hasMore ? rows.slice(0, options.batchSize) : rows;
        const newCursor = hasMore ? String(offset + options.batchSize) : null;
        return { rows: batch, cursor: newCursor, hasMore };
      }

      const safeColumn = validateColumnName(cursorColumn);
      let result: unknown;
      if (options.cursor) {
        result = await db.execute(
          sql`SELECT * FROM ${sql.identifier(safeTable)} WHERE ${sql.identifier(safeColumn)} > ${options.cursor} ORDER BY ${sql.identifier(safeColumn)} ASC LIMIT ${fetchLimit}`
        );
      } else {
        result = await db.execute(
          sql`SELECT * FROM ${sql.identifier(safeTable)} ORDER BY ${sql.identifier(safeColumn)} ASC LIMIT ${fetchLimit}`
        );
      }

      const rows = extractRows(result);
      const hasMore = rows.length > options.batchSize;
      const batch = hasMore ? rows.slice(0, options.batchSize) : rows;
      const lastRow = batch[batch.length - 1];
      const newCursor = lastRow ? String(lastRow[cursorColumn] ?? '') : options.cursor ?? null;

      return { rows: batch, cursor: newCursor, hasMore };
    }

    if (query) {
      const safeQuery = validateReadOnlyQuery(query);
      const safeColumn = validateColumnName(cursorColumn);

      let cursorColumnExists = false;
      try {
        const probeResult = await db.execute(
          sql`SELECT * FROM (${sql.raw(safeQuery)}) AS _probe LIMIT 0`
        );
        const probeCols = extractFields(probeResult);
        cursorColumnExists = probeCols.some(c => c.name === cursorColumn);
      } catch { /* can't probe columns, fall back to offset */ }

      if (options.fullRefresh || !cursorColumnExists) {
        const offset = options.cursor ? parseInt(options.cursor, 10) || 0 : 0;
        const result = await db.execute(
          sql`SELECT * FROM (${sql.raw(safeQuery)}) AS _source LIMIT ${fetchLimit} OFFSET ${offset}`
        );
        const rows = extractRows(result);
        const hasMore = rows.length > options.batchSize;
        const batch = hasMore ? rows.slice(0, options.batchSize) : rows;
        const newCursor = hasMore ? String(offset + options.batchSize) : null;
        return { rows: batch, cursor: newCursor, hasMore };
      }

      if (!options.cursor) {
        const result = await db.execute(
          sql`SELECT * FROM (${sql.raw(safeQuery)}) AS _source ORDER BY ${sql.identifier(safeColumn)} ASC LIMIT ${fetchLimit}`
        );
        const rows = extractRows(result);
        const hasMore = rows.length > options.batchSize;
        const batch = hasMore ? rows.slice(0, options.batchSize) : rows;
        const lastRow = batch[batch.length - 1];
        const newCursor = lastRow ? String(lastRow[cursorColumn] ?? '') : null;
        return { rows: batch, cursor: newCursor, hasMore };
      }

      const result = await db.execute(
        sql`SELECT * FROM (${sql.raw(safeQuery)}) AS _source WHERE ${sql.identifier(safeColumn)} > ${options.cursor} ORDER BY ${sql.identifier(safeColumn)} ASC LIMIT ${fetchLimit}`
      );
      const rows = extractRows(result);
      const hasMore = rows.length > options.batchSize;
      const batch = hasMore ? rows.slice(0, options.batchSize) : rows;
      const lastRow = batch[batch.length - 1];
      const newCursor = lastRow ? String(lastRow[cursorColumn] ?? '') : options.cursor ?? null;

      return { rows: batch, cursor: newCursor, hasMore };
    }

    throw new Error('sourceMeta must include either "table" or "query"');
  },

  async readRowById(config: Record<string, unknown>, primaryKey: string, primaryKeyValue: string): Promise<Record<string, unknown> | null> {
    const table = config.table as string | undefined;
    if (!table) return null;

    const safeTable = validateTableName(table);
    const safeKey = validateColumnName(primaryKey);

    const result = await db.execute(
      sql`SELECT * FROM ${sql.identifier(safeTable)} WHERE ${sql.identifier(safeKey)} = ${primaryKeyValue} LIMIT 1`
    );
    const rows = extractRows(result);
    return rows[0] ?? null;
  },
};
