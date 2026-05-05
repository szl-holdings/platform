import { Router, type Request, type Response } from 'express';
import { logger } from '../lib/logger.js';
import { getCatalog, searchEntries, getEntry, readEntryRaw, rebuildIndex, type CodexEntry } from '../a11oy/codex/codex-index.js';

// Codex reads (catalog/search/entry) are public by design — the indexed
// corpus is restricted to material already published to the public GitHub
// repo (docs/, attached_assets/, root *.md). The rebuild endpoint mutates
// state and is gated.
const publicRouter = Router();
const protectedRouter = Router();

function ok<T>(res: Response, data: T, meta?: Record<string, unknown>) {
  res.json({ ok: true, data, meta: { ...meta, timestamp: new Date().toISOString() } });
}
function err(res: Response, status: number, message: string) {
  res.status(status).json({ ok: false, error: { message, retryable: false } });
}

// Public-safe DTO — strips absolutePath so server filesystem layout is not
// disclosed to API callers.
function slim(e: CodexEntry) {
  return {
    id: e.id,
    kind: e.kind,
    title: e.title,
    relativePath: e.relativePath,
    bytes: e.bytes,
    modifiedAt: e.modifiedAt,
    tags: e.tags,
    summary: e.summary,
    snippet: e.summary,
    weight: e.weight,
  };
}

publicRouter.get('/a11oy/codex/catalog', async (_req, res) => {
  try {
    const cat = await getCatalog();
    ok(res, { entries: cat.entries.map(slim), total: cat.total, byKind: cat.byKind, lastBuiltAt: cat.lastBuiltAt });
  } catch (e) {
    logger.error({ err: e }, '[a11oy-codex] catalog');
    err(res, 500, 'Failed to load codex catalog.');
  }
});

publicRouter.get('/a11oy/codex/search', async (req: Request, res: Response) => {
  try {
    const q = String(req.query.q ?? '').slice(0, 200);
    const kind = req.query.kind ? String(req.query.kind) : undefined;
    const limit = Math.min(200, Math.max(1, parseInt(String(req.query.limit ?? '80'), 10) || 80));
    const results = await searchEntries(q, kind, limit);
    ok(res, { results: results.map(slim), total: results.length, query: q, kind: kind ?? null });
  } catch (e) {
    logger.error({ err: e }, '[a11oy-codex] search');
    err(res, 500, 'Failed to search codex.');
  }
});

publicRouter.get('/a11oy/codex/entry/:id', async (req, res) => {
  const entry = await getEntry(req.params.id);
  if (!entry) return err(res, 404, `Codex entry "${req.params.id}" not found.`);
  ok(res, slim(entry));
});

publicRouter.get('/a11oy/codex/entry/:id/raw', async (req, res) => {
  const result = await readEntryRaw(req.params.id);
  if (!result) return err(res, 404, `Codex entry "${req.params.id}" not found.`);
  ok(res, { entry: slim(result.entry), content: result.content, truncated: result.truncated, length: result.content.length });
});

protectedRouter.post('/a11oy/codex/rebuild', async (_req, res) => {
  try {
    const r = await rebuildIndex();
    ok(res, r, { rebuilt: true });
  } catch (e) {
    logger.error({ err: e }, '[a11oy-codex] rebuild');
    err(res, 500, 'Failed to rebuild codex index.');
  }
});

logger.debug('[a11oy-codex-api] routes registered — public reads (corpus = public repo material), gated rebuild');

export { publicRouter as a11oyCodexPublicRouter, protectedRouter as a11oyCodexProtectedRouter };
