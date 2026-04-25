/**
 * Atlas Export Job Processor
 *
 * Polls for pending atlas export jobs and renders them to PDF.
 * Only the "pdf" format is supported. Jobs in other formats (docx, pptx, xlsx,
 * web) are marked "failed" immediately with a clear error message.
 *
 * Architecture:
 *  - setInterval polls every POLL_INTERVAL_MS (default: 5 s)
 *  - At most MAX_CONCURRENT_JOBS jobs are processed in parallel per tick
 *  - Completed PDF buffers live in an in-memory store with a 24 h TTL
 *  - The download endpoint in atlas-artifacts.ts serves buffers by job ID
 *  - fileUrl is set to /atlas/export-jobs/:id/download so callers can poll
 *    GET /atlas/export-jobs/:id and follow fileUrl when status is "completed"
 */

import { Document, Page, renderToBuffer, StyleSheet, Text, View } from '@react-pdf/renderer';
import { atlasArtifactsTable, atlasExportJobsTable, db } from '@szl-holdings/db';
import { and, eq, gt } from 'drizzle-orm';
import React from 'react';
import { logger } from '../lib/logger';

// ─── Config ──────────────────────────────────────────────────────────────────

const POLL_INTERVAL_MS = Number(process.env.ATLAS_EXPORT_POLL_MS ?? '5000');
const MAX_CONCURRENT_JOBS = Number(process.env.ATLAS_EXPORT_CONCURRENCY ?? '3');
const BUFFER_TTL_MS = 24 * 60 * 60 * 1000;

// ─── In-memory buffer store ───────────────────────────────────────────────────

interface ExportBuffer {
  buffer: Buffer;
  expiresAt: Date;
  format: string;
  filename: string;
}

const exportBuffers = new Map<number, ExportBuffer>();

export function getAtlasExportBuffer(jobId: number): ExportBuffer | null {
  const entry = exportBuffers.get(jobId);
  if (!entry) return null;
  if (entry.expiresAt < new Date()) {
    exportBuffers.delete(jobId);
    return null;
  }
  return entry;
}

function storeBuffer(jobId: number, buffer: Buffer, format: string, filename: string): void {
  const expiresAt = new Date(Date.now() + BUFFER_TTL_MS);
  exportBuffers.set(jobId, { buffer, expiresAt, format, filename });
}

// Periodically evict expired entries
const cleanupTimer = setInterval(
  () => {
    const now = new Date();
    for (const [id, entry] of exportBuffers) {
      if (entry.expiresAt < now) exportBuffers.delete(id);
    }
  },
  60 * 60 * 1000,
);
if (cleanupTimer.unref) cleanupTimer.unref();

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  page: { padding: 48, fontFamily: 'Helvetica', fontSize: 10, color: '#1f2937', backgroundColor: '#ffffff' },
  header: { marginBottom: 20, paddingBottom: 10, borderBottomWidth: 2, borderBottomColor: '#1e3a5f', borderBottomStyle: 'solid' },
  headerTitle: { fontSize: 20, fontFamily: 'Helvetica-Bold', color: '#0f172a' },
  headerSub: { fontSize: 8, color: '#6b7280', marginTop: 3 },
  sectionTitle: { fontSize: 13, fontFamily: 'Helvetica-Bold', color: '#1e3a5f', marginTop: 14, marginBottom: 4 },
  sectionDivider: { borderBottomWidth: 1, borderBottomColor: '#e5e7eb', borderBottomStyle: 'solid', marginBottom: 6 },
  paragraph: { fontSize: 10, lineHeight: 1.5, marginBottom: 4, color: '#374151' },
  listItem: { flexDirection: 'row', marginBottom: 3 },
  bullet: { marginRight: 6, color: '#6b7280' },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  tableHeader: { flexDirection: 'row', backgroundColor: '#f3f4f6', borderBottomWidth: 1, borderBottomColor: '#d1d5db' },
  tableCell: { padding: '3 6', flex: 1, fontSize: 9 },
  tableCellHeader: { padding: '3 6', flex: 1, fontSize: 9, fontFamily: 'Helvetica-Bold' },
  kpiRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 },
  kpiBox: { width: '33%', padding: '6 4', marginBottom: 4 },
  kpiLabel: { fontSize: 8, color: '#6b7280' },
  kpiValue: { fontSize: 14, fontFamily: 'Helvetica-Bold', color: '#111827', marginTop: 1 },
  footer: { position: 'absolute', bottom: 20, left: 48, right: 48, textAlign: 'center', fontSize: 8, color: '#9ca3af' },
});

// ─── Section renderer ─────────────────────────────────────────────────────────

interface ArtifactSection {
  id: string;
  title: string;
  content: string;
  type: 'text' | 'table' | 'chart' | 'image' | 'list' | 'kpi_grid';
  data?: Record<string, unknown>;
  order: number;
}

function renderSection(section: ArtifactSection, idx: number): React.ReactElement {
  const children: React.ReactElement[] = [
    React.createElement(Text, { key: 'title', style: styles.sectionTitle }, section.title),
    React.createElement(View, { key: 'divider', style: styles.sectionDivider }),
  ];

  switch (section.type) {
    case 'kpi_grid': {
      const kpis = (section.data?.kpis as Array<{ label: string; value: string }> | undefined) ?? [];
      if (kpis.length > 0) {
        children.push(
          React.createElement(
            View,
            { key: 'kpis', style: styles.kpiRow },
            kpis.map((kpi, i) =>
              React.createElement(
                View,
                { key: i, style: styles.kpiBox },
                React.createElement(Text, { style: styles.kpiLabel }, kpi.label),
                React.createElement(Text, { style: styles.kpiValue }, String(kpi.value ?? '')),
              ),
            ),
          ),
        );
      } else if (section.content) {
        children.push(React.createElement(Text, { key: 'content', style: styles.paragraph }, section.content));
      }
      break;
    }

    case 'list': {
      const items = (section.data?.items as string[] | undefined) ??
        section.content.split('\n').filter(Boolean);
      items.forEach((item, i) => {
        children.push(
          React.createElement(
            View,
            { key: i, style: styles.listItem },
            React.createElement(Text, { style: styles.bullet }, '•'),
            React.createElement(Text, { style: { flex: 1, fontSize: 10, lineHeight: 1.4 } }, item),
          ),
        );
      });
      break;
    }

    case 'table': {
      const rows = (section.data?.rows as string[][] | undefined) ?? [];
      if (rows.length > 0) {
        rows.forEach((row, ri) => {
          children.push(
            React.createElement(
              View,
              { key: ri, style: ri === 0 ? styles.tableHeader : styles.tableRow },
              row.map((cell, ci) =>
                React.createElement(
                  Text,
                  { key: ci, style: ri === 0 ? styles.tableCellHeader : styles.tableCell },
                  cell,
                ),
              ),
            ),
          );
        });
      } else if (section.content) {
        children.push(React.createElement(Text, { key: 'content', style: styles.paragraph }, section.content));
      }
      break;
    }

    case 'chart':
    case 'image':
    default: {
      const paragraphs = section.content.split('\n');
      paragraphs.forEach((line, i) => {
        if (line.trim()) {
          children.push(React.createElement(Text, { key: i, style: styles.paragraph }, line));
        }
      });
      break;
    }
  }

  return React.createElement(View, { key: idx }, children);
}

// ─── PDF builder ──────────────────────────────────────────────────────────────

async function buildAtlasPdf(params: {
  title: string;
  templateType: string;
  domain: string;
  sections: ArtifactSection[];
}): Promise<Buffer> {
  const generatedAt = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const sectionElements = params.sections
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((s, i) => renderSection(s, i));

  const doc = React.createElement(
    Document,
    {},
    React.createElement(
      Page,
      { size: 'A4', style: styles.page },
      React.createElement(
        View,
        { style: styles.header },
        React.createElement(Text, { style: styles.headerTitle }, params.title),
        React.createElement(
          Text,
          { style: styles.headerSub },
          `${params.templateType.replace(/_/g, ' ')} · ${params.domain} · ${generatedAt}`,
        ),
      ),
      ...sectionElements,
      React.createElement(Text, {
        style: styles.footer,
        render: ({ pageNumber, totalPages }: { pageNumber: number; totalPages: number }) =>
          `${params.title} · Page ${pageNumber} of ${totalPages} · SZL Document Engine`,
      }),
    ),
  );

  return renderToBuffer(doc);
}

// ─── Job processor ────────────────────────────────────────────────────────────

async function processPendingJobs(): Promise<void> {
  let pending: Array<{ id: number; artifactId: number; format: string }> = [];

  try {
    pending = await db
      .select({ id: atlasExportJobsTable.id, artifactId: atlasExportJobsTable.artifactId, format: atlasExportJobsTable.format })
      .from(atlasExportJobsTable)
      .where(
        and(
          eq(atlasExportJobsTable.status, 'pending'),
          gt(atlasExportJobsTable.expiresAt, new Date()),
        ),
      )
      .limit(MAX_CONCURRENT_JOBS);
  } catch (err) {
    logger.warn({ err }, '[atlas-export] Failed to query pending jobs');
    return;
  }

  if (pending.length === 0) return;

  logger.info({ count: pending.length }, '[atlas-export] Processing pending export jobs');

  await Promise.allSettled(pending.map((job) => processJob(job)));
}

async function processJob(job: { id: number; artifactId: number; format: string }): Promise<void> {
  const now = new Date();

  try {
    const updated = await db
      .update(atlasExportJobsTable)
      .set({ status: 'processing', startedAt: now })
      .where(
        and(
          eq(atlasExportJobsTable.id, job.id),
          eq(atlasExportJobsTable.status, 'pending'),
        ),
      )
      .returning({ id: atlasExportJobsTable.id });

    if (updated.length === 0) {
      return;
    }
  } catch (err) {
    logger.warn({ err, jobId: job.id }, '[atlas-export] Failed to claim job');
    return;
  }

  try {
    const [artifact] = await db
      .select()
      .from(atlasArtifactsTable)
      .where(eq(atlasArtifactsTable.id, job.artifactId));

    if (!artifact) {
      await db
        .update(atlasExportJobsTable)
        .set({ status: 'failed', errorMessage: 'Artifact not found', completedAt: new Date() })
        .where(eq(atlasExportJobsTable.id, job.id));
      return;
    }

    const sections = (Array.isArray(artifact.sections) ? artifact.sections : []) as ArtifactSection[];

    if (job.format !== 'pdf') {
      await db
        .update(atlasExportJobsTable)
        .set({
          status: 'failed',
          errorMessage: `Format "${job.format}" is not yet supported. Request a PDF export instead.`,
          completedAt: new Date(),
        })
        .where(eq(atlasExportJobsTable.id, job.id));
      logger.info({ jobId: job.id, format: job.format }, '[atlas-export] Unsupported format — failing job cleanly');
      return;
    }

    const buffer = await buildAtlasPdf({
      title: artifact.title,
      templateType: artifact.templateType,
      domain: artifact.domain,
      sections,
    });

    const safeTitle = artifact.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40);
    const filename = `${safeTitle}-${artifact.id}.pdf`;

    storeBuffer(job.id, buffer, job.format, filename);

    const fileUrl = `/atlas/export-jobs/${job.id}/download`;

    await db
      .update(atlasExportJobsTable)
      .set({
        status: 'completed',
        fileUrl,
        fileSizeBytes: buffer.length,
        completedAt: new Date(),
      })
      .where(eq(atlasExportJobsTable.id, job.id));

    logger.info(
      { jobId: job.id, artifactId: job.artifactId, format: job.format, bytes: buffer.length },
      '[atlas-export] Export job completed',
    );
  } catch (err) {
    logger.error({ err, jobId: job.id }, '[atlas-export] Export job failed');
    await db
      .update(atlasExportJobsTable)
      .set({
        status: 'failed',
        errorMessage: err instanceof Error ? err.message : 'Unknown error',
        completedAt: new Date(),
      })
      .where(eq(atlasExportJobsTable.id, job.id))
      .catch((e) => logger.warn({ e }, '[atlas-export] Failed to mark job as failed'));
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

let pollTimer: ReturnType<typeof setInterval> | null = null;

export function startAtlasExportProcessor(): void {
  if (pollTimer) return;

  processPendingJobs().catch((err) =>
    logger.error({ err }, '[atlas-export] processPendingJobs initial run error'),
  );

  pollTimer = setInterval(() => {
    processPendingJobs().catch((err) =>
      logger.error({ err }, '[atlas-export] processPendingJobs poll error'),
    );
  }, POLL_INTERVAL_MS);

  if (pollTimer.unref) pollTimer.unref();

  logger.info({ intervalMs: POLL_INTERVAL_MS }, '[atlas-export] Export job processor started');
}

export function stopAtlasExportProcessor(): void {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}
