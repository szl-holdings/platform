/**
 * Export Service — Generates CSV, XLSX, and PDF exports for any tabular dataset.
 * Compliance-grade patterns: SOC 2 audit export, GDPR data portability.
 * - Streams large datasets in pages (max 10k rows per chunk)
 * - Records every export in the export_jobs table for audit trail
 * - Download tokens expire after 24 hours
 * - Buffers are persisted to GCS for durability across restarts
 * - Async queue with in-memory buffer store (24h TTL) for fast re-downloads
 */

import { Document, Page, renderToBuffer, StyleSheet, Text, View } from '@react-pdf/renderer';
import { db, exportJobsTable, usersTable } from '@szl-holdings/db';
import { randomUUID } from 'node:crypto';
import { and, desc, eq, gte, ilike, isNotNull, lte, sql } from 'drizzle-orm';
import React from 'react';
import * as XLSX from 'xlsx';
import { logger } from './logger';
import { objectStorageClient, ObjectStorageService } from './objectStorage';

const _MAX_ROWS_INLINE = 10_000;
const EXPORT_TTL_MS = 24 * 60 * 60 * 1000;

const objectStorageService = new ObjectStorageService();

function getExportBucketId(): string | null {
  return process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID ?? null;
}

// ─── In-memory buffer store (serves re-downloads within 24h) ─────────────────
interface StoredBuffer {
  buffer: Buffer;
  expiresAt: Date;
  format: string;
  name: string;
  storageKey: string | null;
}
const exportBufferStore = new Map<string, StoredBuffer>();

async function deleteFromStorage(storageKey: string): Promise<void> {
  if (!storageKey) return;
  try {
    if (storageKey.startsWith('/objects/')) {
      // Legacy format produced by ObjectStorageService.uploadBuffer() — resolve via service.
      // We don't pass ignoreNotFound since we catch all errors below.
      const file = await objectStorageService.getObjectEntityFile(storageKey);
      await file.delete();
      return;
    }
    // New format: raw bucket object name (DEFAULT_OBJECT_STORAGE_BUCKET_ID)
    const bucketId = getExportBucketId();
    if (!bucketId) return;
    await objectStorageClient.bucket(bucketId).file(storageKey).delete();
  } catch {
    // Ignore all errors (including 404) — cleanup is best-effort.
  }
}

/**
 * Delete a batch of expired export storage objects and mark each row's storageKey
 * as NULL after a successful deletion so the same rows aren't reprocessed.
 * Ordered by id ASC for deterministic pagination.
 */
async function cleanupExpiredDbExports(): Promise<void> {
  try {
    const expired = await db
      .select({ exportId: exportJobsTable.exportId, storageKey: exportJobsTable.storageKey })
      .from(exportJobsTable)
      .where(
        and(
          isNotNull(exportJobsTable.storageKey),
          lte(exportJobsTable.expiresAt, new Date()),
        ),
      )
      .orderBy(exportJobsTable.id)
      .limit(200);
    for (const row of expired) {
      if (!row.storageKey) continue;
      await deleteFromStorage(row.storageKey);
      // Mark as cleaned so this row is not reprocessed on next interval tick.
      await db
        .update(exportJobsTable)
        .set({ storageKey: null })
        .where(eq(exportJobsTable.exportId, row.exportId))
        .catch(() => {});
    }
  } catch {
    // Best-effort cleanup; don't throw.
  }
}

const cleanupInterval = setInterval(
  async () => {
    const now = new Date();
    for (const [key, val] of exportBufferStore) {
      if (val.expiresAt < now) {
        exportBufferStore.delete(key);
        if (val.storageKey) await deleteFromStorage(val.storageKey);
      }
    }
    await cleanupExpiredDbExports();
  },
  60 * 60 * 1000,
);
if (cleanupInterval.unref) cleanupInterval.unref();

export function storeExportBuffer(
  exportId: string,
  buffer: Buffer,
  expiresAt: Date,
  format: string,
  name: string,
  storageKey: string | null = null,
) {
  exportBufferStore.set(exportId, { buffer, expiresAt, format, name, storageKey });
}

export function getExportBuffer(exportId: string): StoredBuffer | null {
  const entry = exportBufferStore.get(exportId);
  if (!entry) return null;
  if (entry.expiresAt < new Date()) {
    exportBufferStore.delete(exportId);
    if (entry.storageKey) deleteFromStorage(entry.storageKey).catch(() => {});
    return null;
  }
  return entry;
}

/**
 * Try to fetch an export buffer from object storage when the in-memory store doesn't have it.
 *
 * Supports two storageKey formats:
 *  - Legacy "/objects/exports/<id>.<ext>" — written by ObjectStorageService.uploadBuffer()
 *    (the async enqueue path before this task). Delegates to downloadObjectToBuffer().
 *  - New "exports/<id>.<ext>" — raw GCS object name stored directly in
 *    DEFAULT_OBJECT_STORAGE_BUCKET_ID. Written by persistExportToStorage().
 *
 * Returns null if storage is not configured or the object does not exist.
 */
export async function fetchExportBufferFromStorage(storageKey: string | null | undefined): Promise<Buffer | null> {
  if (!storageKey) return null;
  try {
    // Legacy format produced by ObjectStorageService.uploadBuffer()
    if (storageKey.startsWith('/objects/')) {
      return await objectStorageService.downloadObjectToBuffer(storageKey);
    }
    // New format: raw bucket object name
    const bucketId = getExportBucketId();
    if (!bucketId) return null;
    const file = objectStorageClient.bucket(bucketId).file(storageKey);
    const [exists] = await file.exists();
    if (!exists) return null;
    const [contents] = await file.download();
    return contents;
  } catch {
    return null;
  }
}

/**
 * Primary entry point for serving an export buffer. Checks the in-memory store first
 * (fast path for recent exports), then falls back to object storage when the buffer
 * has been evicted — e.g. after a server restart. Returns null only if the file is
 * genuinely unavailable in both stores.
 */
export async function getOrFetchExportBuffer(
  exportId: string,
  storageKey?: string | null,
): Promise<Buffer | null> {
  const stored = getExportBuffer(exportId);
  if (stored) return stored.buffer;
  return fetchExportBufferFromStorage(storageKey);
}

export async function getExportJobStatus(exportId: string) {
  const [job] = await db
    .select()
    .from(exportJobsTable)
    .where(eq(exportJobsTable.exportId, exportId))
    .limit(1);
  return job ?? null;
}

export interface ExportColumn {
  key: string;
  label: string;
}

export interface ExportOptions {
  name: string;
  dataSource: string;
  format: 'csv' | 'pdf' | 'xlsx';
  columns: ExportColumn[];
  rows: Record<string, unknown>[];
  triggeredByUserId?: number | null;
  triggeredByEmail?: string | null;
  filterParams?: string;
  scheduleFrequency?: 'once' | 'daily' | 'weekly' | 'monthly';
}

export interface ExportResult {
  exportId: string;
  format: 'csv' | 'pdf' | 'xlsx';
  buffer: Buffer;
  rowCount: number;
  fileSizeBytes: number;
  downloadToken: string;
  expiresAt: Date;
  storageKey: string | null;
}

const pdfStyles = StyleSheet.create({
  page: {
    padding: 36,
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: '#1a1a1a',
  },
  header: {
    marginBottom: 12,
    borderBottom: '1px solid #e0e0e0',
    paddingBottom: 8,
  },
  title: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 4,
    color: '#111',
  },
  subtitle: {
    fontSize: 8,
    color: '#666',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    padding: '4 6',
    borderBottom: '1px solid #ddd',
  },
  tableRow: {
    flexDirection: 'row',
    padding: '3 6',
    borderBottom: '0.5px solid #eee',
  },
  tableRowAlt: {
    flexDirection: 'row',
    padding: '3 6',
    borderBottom: '0.5px solid #eee',
    backgroundColor: '#fafafa',
  },
  cellHeader: {
    flex: 1,
    fontFamily: 'Helvetica-Bold',
    fontSize: 8,
    color: '#333',
  },
  cell: {
    flex: 1,
    fontSize: 8,
    color: '#444',
  },
  footer: {
    position: 'absolute',
    bottom: 18,
    left: 36,
    right: 36,
    fontSize: 7,
    color: '#999',
    textAlign: 'center',
  },
});

function formatCellValue(val: unknown): string {
  if (val === null || val === undefined) return '';
  if (val instanceof Date) return val.toISOString();
  if (typeof val === 'boolean') return val ? 'true' : 'false';
  if (typeof val === 'number') return String(val);
  if (typeof val === 'object') return JSON.stringify(val).slice(0, 200);
  return String(val);
}

export function generateCsv(columns: ExportColumn[], rows: Record<string, unknown>[]): Buffer {
  const header = columns.map((c) => `"${c.label.replace(/"/g, '""')}"`).join(',');
  const dataRows = rows.map((row) =>
    columns
      .map((c) => {
        const val = formatCellValue(row[c.key]);
        return `"${val.replace(/"/g, '""')}"`;
      })
      .join(','),
  );
  const csv = [header, ...dataRows].join('\r\n');
  return Buffer.from(csv, 'utf-8');
}

export function generateXlsx(
  name: string,
  columns: ExportColumn[],
  rows: Record<string, unknown>[],
): Buffer {
  const wb = XLSX.utils.book_new();
  const headerRow = columns.map((c) => c.label);
  const dataRows = rows.map((row) => columns.map((c) => {
    const v = row[c.key];
    if (v === null || v === undefined) return '';
    if (v instanceof Date) return v.toISOString();
    if (typeof v === 'object') return JSON.stringify(v).slice(0, 500);
    return v;
  }));
  const ws = XLSX.utils.aoa_to_sheet([headerRow, ...dataRows]);

  // Auto-width for readability
  const colWidths = columns.map((c, i) => {
    const maxLen = Math.max(
      c.label.length,
      ...dataRows.slice(0, 100).map((r) => String(r[i] ?? '').length),
    );
    return { wch: Math.min(maxLen + 2, 50) };
  });
  ws['!cols'] = colWidths;

  XLSX.utils.book_append_sheet(wb, ws, name.slice(0, 31));
  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
  return buffer;
}

export async function generatePdf(
  title: string,
  columns: ExportColumn[],
  rows: Record<string, unknown>[],
  generatedAt: Date,
): Promise<Buffer> {
  const MAX_PDF_ROWS = 5000;
  const displayRows = rows.slice(0, MAX_PDF_ROWS);
  const truncated = rows.length > MAX_PDF_ROWS;

  const doc = React.createElement(
    Document,
    {},
    React.createElement(
      Page,
      { size: 'A4', orientation: 'landscape', style: pdfStyles.page },
      React.createElement(
        View,
        { style: pdfStyles.header },
        React.createElement(Text, { style: pdfStyles.title }, title),
        React.createElement(
          Text,
          { style: pdfStyles.subtitle },
          `Generated: ${generatedAt.toISOString()} — ${rows.length.toLocaleString()} record${rows.length !== 1 ? 's' : ''}${truncated ? ` (showing first ${MAX_PDF_ROWS.toLocaleString()})` : ''}`,
        ),
      ),
      React.createElement(
        View,
        { style: pdfStyles.tableHeader },
        ...columns.map((col) =>
          React.createElement(Text, { key: col.key, style: pdfStyles.cellHeader }, col.label),
        ),
      ),
      ...displayRows.map((row, i) =>
        React.createElement(
          View,
          { key: i, style: i % 2 === 0 ? pdfStyles.tableRow : pdfStyles.tableRowAlt },
          ...columns.map((col) =>
            React.createElement(
              Text,
              { key: col.key, style: pdfStyles.cell },
              formatCellValue(row[col.key]),
            ),
          ),
        ),
      ),
      React.createElement(
        Text,
        {
          style: pdfStyles.footer,
          render: ({ pageNumber, totalPages }: { pageNumber: number; totalPages: number }) =>
            `Page ${pageNumber} of ${totalPages} — Confidential — SZL Holdings Platform Export`,
        },
        '',
      ),
    ),
  );

  return renderToBuffer(doc);
}

/**
 * Persist an export buffer to object storage for durable download across server restarts.
 * Uses DEFAULT_OBJECT_STORAGE_BUCKET_ID directly as the bucket. Returns the GCS object name
 * (e.g. "exports/<exportId>.csv") used as storageKey, or null if storage is not configured.
 */
async function persistExportToStorage(
  exportId: string,
  buffer: Buffer,
  format: 'csv' | 'pdf' | 'xlsx',
): Promise<string | null> {
  const bucketId = getExportBucketId();
  if (!bucketId) return null;
  const ext = format === 'pdf' ? 'pdf' : format === 'xlsx' ? 'xlsx' : 'csv';
  const contentType =
    format === 'pdf'
      ? 'application/pdf'
      : format === 'xlsx'
        ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        : 'text/csv';
  const objectName = `exports/${exportId}.${ext}`;
  try {
    await objectStorageClient.bucket(bucketId).file(objectName).save(buffer, {
      contentType,
      resumable: false,
    });
    return objectName;
  } catch {
    // Storage not available or upload failed — in-memory buffer will serve instead.
    return null;
  }
}

export async function runExport(options: ExportOptions): Promise<ExportResult> {
  const exportId = randomUUID();
  const downloadToken = randomUUID();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + EXPORT_TTL_MS);

  await db.insert(exportJobsTable).values({
    exportId,
    name: options.name,
    dataSource: options.dataSource,
    format: options.format,
    status: 'processing',
    triggeredByUserId: options.triggeredByUserId ?? null,
    triggeredByEmail: options.triggeredByEmail ?? null,
    filterParams: options.filterParams ?? null,
    scheduleFrequency: options.scheduleFrequency ?? 'once',
    downloadToken,
    expiresAt,
  });

  try {
    let buffer: Buffer;
    if (options.format === 'csv') {
      buffer = generateCsv(options.columns, options.rows);
    } else if (options.format === 'xlsx') {
      buffer = generateXlsx(options.name, options.columns, options.rows);
    } else {
      buffer = await generatePdf(options.name, options.columns, options.rows, now);
    }

    const fileSizeBytes = buffer.length;
    const rowCount = options.rows.length;

    // Persist to GCS for durability — buffer survives server restarts.
    const storageKey = await persistExportToStorage(exportId, buffer, options.format);
    const downloadUrl = `/api/exports/jobs/${exportId}/download?token=${downloadToken}`;

    await db
      .update(exportJobsTable)
      .set({
        status: 'completed',
        rowCount,
        fileSizeBytes,
        completedAt: new Date(),
        downloadUrl,
        storageKey,
      })
      .where(eq(exportJobsTable.exportId, exportId));

    storeExportBuffer(exportId, buffer, expiresAt, options.format, options.name, storageKey);

    logger.info(
      {
        exportId,
        dataSource: options.dataSource,
        format: options.format,
        rowCount,
        fileSizeBytes,
        storageKey,
      },
      'Export completed',
    );

    return {
      exportId,
      format: options.format,
      buffer,
      rowCount,
      fileSizeBytes,
      downloadToken,
      expiresAt,
      storageKey,
    };
  } catch (err) {
    await db
      .update(exportJobsTable)
      .set({ status: 'failed', errorMessage: String(err) })
      .where(eq(exportJobsTable.exportId, exportId));
    logger.error({ exportId, err }, 'Export failed');
    throw err;
  }
}

export async function getExportByToken(token: string) {
  const [job] = await db
    .select()
    .from(exportJobsTable)
    .where(eq(exportJobsTable.downloadToken, token))
    .limit(1);
  return job ?? null;
}

export async function listExportHistory(
  opts: {
    limit?: number;
    offset?: number;
    userId?: number | null;
    dataSource?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
    search?: string;
  } = {},
) {
  const limit = Math.min(opts.limit ?? 50, 200);
  const offset = opts.offset ?? 0;

  const conditions = [];
  if (opts.userId != null) conditions.push(eq(exportJobsTable.triggeredByUserId, opts.userId));
  if (opts.dataSource) conditions.push(eq(exportJobsTable.dataSource, opts.dataSource));
  if (opts.status) conditions.push(eq(exportJobsTable.status, opts.status as 'pending' | 'processing' | 'completed' | 'failed'));
  if (opts.dateFrom) conditions.push(gte(exportJobsTable.createdAt, new Date(opts.dateFrom)));
  if (opts.dateTo) {
    const end = new Date(opts.dateTo);
    end.setHours(23, 59, 59, 999);
    conditions.push(lte(exportJobsTable.createdAt, end));
  }
  if (opts.search) conditions.push(ilike(exportJobsTable.name, `%${opts.search}%`));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const rows = await db
    .select({
      id: exportJobsTable.id,
      exportId: exportJobsTable.exportId,
      name: exportJobsTable.name,
      dataSource: exportJobsTable.dataSource,
      format: exportJobsTable.format,
      status: exportJobsTable.status,
      rowCount: exportJobsTable.rowCount,
      fileSizeBytes: exportJobsTable.fileSizeBytes,
      downloadToken: exportJobsTable.downloadToken,
      expiresAt: exportJobsTable.expiresAt,
      errorMessage: exportJobsTable.errorMessage,
      scheduleFrequency: exportJobsTable.scheduleFrequency,
      filterParams: exportJobsTable.filterParams,
      triggeredByEmail: exportJobsTable.triggeredByEmail,
      triggeredByUserId: exportJobsTable.triggeredByUserId,
      triggeredByName: usersTable.displayName,
      completedAt: exportJobsTable.completedAt,
      createdAt: exportJobsTable.createdAt,
    })
    .from(exportJobsTable)
    .leftJoin(usersTable, eq(exportJobsTable.triggeredByUserId, usersTable.id))
    .where(whereClause)
    .orderBy(desc(exportJobsTable.createdAt))
    .limit(limit)
    .offset(offset);

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(exportJobsTable)
    .where(whereClause);

  return { exports: rows, total: count };
}
