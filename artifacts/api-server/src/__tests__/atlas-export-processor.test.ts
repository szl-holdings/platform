/**
 * Atlas Export Processor — Unit Tests
 *
 * Verifies the processor:
 *  - Does nothing when no pending jobs exist
 *  - Claims a pending job (pending → processing), renders PDF, marks "completed"
 *  - Stores the buffer so getAtlasExportBuffer returns it with correct metadata
 *  - Marks jobs "failed" when the artifact is missing
 *  - Marks jobs "failed" (with a clear message) for unsupported formats
 *  - getAtlasExportBuffer returns null for unknown job IDs
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('drizzle-orm', () => {
  const noop = (..._args: unknown[]) => ({});
  return { eq: noop, and: noop, lt: noop, gt: noop, inArray: noop, desc: noop };
});

let pendingJobs: Array<{ id: number; artifactId: number; format: string }> = [];
let artifacts: Array<Record<string, unknown>> = [];
const jobUpdates: Array<{ id: number; values: Record<string, unknown> }> = [];

vi.mock('@szl-holdings/db', () => {
  const atlasExportJobsTable = { id: 'id', artifactId: 'artifact_id', format: 'format', status: 'status', expiresAt: 'expires_at' };
  const atlasArtifactsTable = { id: 'id', title: 'title', templateType: 'template_type', domain: 'domain', sections: 'sections' };

  function makeSelectChain(rows: () => unknown[]) {
    return {
      where: (_c: unknown) => makeSelectChain(rows),
      limit: (n: number) => Promise.resolve(rows().slice(0, n)),
      then: (res: (v: unknown[]) => void, rej?: (e: unknown) => void) =>
        Promise.resolve(rows()).then(res, rej),
    };
  }

  function makeUpdateChain(table: unknown, values: Record<string, unknown>) {
    return {
      where: (_c: unknown) => ({
        returning: (_sel: unknown) => {
          if (table !== atlasExportJobsTable) return Promise.resolve([]);
          const job = pendingJobs[0];
          if (!job) return Promise.resolve([]);
          jobUpdates.push({ id: job.id, values });
          return Promise.resolve([{ id: job.id }]);
        },
        then: (res: (v: unknown[]) => void, rej?: (e: unknown) => void) => {
          if (table !== atlasExportJobsTable) return Promise.resolve([]).then(res, rej);
          const job = pendingJobs[0];
          if (!job) return Promise.resolve([]).then(res, rej);
          jobUpdates.push({ id: job.id, values });
          return Promise.resolve([{ id: job.id }]).then(res, rej);
        },
      }),
    };
  }

  const db = {
    select: () => ({
      from: (table: unknown) => ({
        where: (_c: unknown) => {
          if (table === atlasExportJobsTable) {
            return makeSelectChain(() => pendingJobs);
          }
          return makeSelectChain(() => {
            const id = pendingJobs[0]?.artifactId ?? -1;
            return artifacts.filter((a) => a.id === id);
          });
        },
        limit: (n: number) => Promise.resolve(pendingJobs.slice(0, n)),
      }),
    }),
    update: (table: unknown) => ({
      set: (values: Record<string, unknown>) => makeUpdateChain(table, values),
    }),
    insert: () => ({ values: () => ({ returning: () => Promise.resolve([]) }) }),
  };

  return { db, atlasExportJobsTable, atlasArtifactsTable };
});

vi.mock('@react-pdf/renderer', () => ({
  Document: 'Document',
  Page: 'Page',
  Text: 'Text',
  View: 'View',
  StyleSheet: { create: (s: unknown) => s },
  renderToBuffer: vi.fn().mockResolvedValue(Buffer.from('%PDF-1.4 fake-pdf')),
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function loadProcessor() {
  return import('../jobs/atlas-export-processor');
}

const BASIC_ARTIFACT = {
  id: 7,
  title: 'Test Report',
  templateType: 'report',
  domain: 'general',
  sections: [{ id: 's1', title: 'Summary', content: 'All good.', type: 'text', order: 0 }],
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('atlas-export-processor', () => {
  beforeEach(() => {
    pendingJobs = [];
    artifacts = [];
    jobUpdates.length = 0;
    vi.clearAllMocks();
  });

  it('does nothing when there are no pending jobs', async () => {
    const { startAtlasExportProcessor, stopAtlasExportProcessor } = await loadProcessor();
    startAtlasExportProcessor();
    await new Promise((r) => setTimeout(r, 20));
    stopAtlasExportProcessor();
    expect(jobUpdates).toHaveLength(0);
  });

  it('marks a PDF job completed and stores the buffer', async () => {
    pendingJobs = [{ id: 42, artifactId: 7, format: 'pdf' }];
    artifacts = [BASIC_ARTIFACT];

    const { startAtlasExportProcessor, stopAtlasExportProcessor, getAtlasExportBuffer } =
      await loadProcessor();

    startAtlasExportProcessor();
    await new Promise((r) => setTimeout(r, 100));
    stopAtlasExportProcessor();

    const completionUpdate = jobUpdates.find((u) => u.values.status === 'completed');
    expect(completionUpdate).toBeDefined();
    expect(completionUpdate?.values.fileUrl).toBe('/atlas/export-jobs/42/download');
    expect(typeof completionUpdate?.values.fileSizeBytes).toBe('number');

    const buf = getAtlasExportBuffer(42);
    expect(buf).not.toBeNull();
    expect(buf?.format).toBe('pdf');
    expect(buf?.filename).toMatch(/test-report-7\.pdf/);
  });

  it('marks a job failed when the artifact is not found', async () => {
    pendingJobs = [{ id: 99, artifactId: 999, format: 'pdf' }];
    artifacts = [];

    const { startAtlasExportProcessor, stopAtlasExportProcessor, getAtlasExportBuffer } =
      await loadProcessor();

    startAtlasExportProcessor();
    await new Promise((r) => setTimeout(r, 100));
    stopAtlasExportProcessor();

    const failUpdate = jobUpdates.find((u) => u.values.status === 'failed');
    expect(failUpdate).toBeDefined();
    expect(getAtlasExportBuffer(99)).toBeNull();
  });

  it('fails unsupported formats cleanly with an explanatory message', async () => {
    pendingJobs = [{ id: 55, artifactId: 7, format: 'docx' }];
    artifacts = [BASIC_ARTIFACT];

    const { startAtlasExportProcessor, stopAtlasExportProcessor, getAtlasExportBuffer } =
      await loadProcessor();

    startAtlasExportProcessor();
    await new Promise((r) => setTimeout(r, 100));
    stopAtlasExportProcessor();

    const failUpdate = jobUpdates.find((u) => u.values.status === 'failed');
    expect(failUpdate).toBeDefined();
    expect(failUpdate?.values.errorMessage).toMatch(/not yet supported/);
    expect(getAtlasExportBuffer(55)).toBeNull();
  });

  it('getAtlasExportBuffer returns null for unknown job IDs', async () => {
    const { getAtlasExportBuffer } = await loadProcessor();
    expect(getAtlasExportBuffer(0)).toBeNull();
    expect(getAtlasExportBuffer(12345)).toBeNull();
  });
});
