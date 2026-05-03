/**
 * LEXICON — License Intelligence Catalog API
 *
 * Public JSON API exposing all license data from the LEXICON catalog.
 * No authentication required. Open CORS.
 *
 * Endpoints:
 *   GET /lexicon/v1/licenses                  — full license list (filterable)
 *   GET /lexicon/v1/licenses/:id              — single license by id
 *   GET /lexicon/v1/compatibility             — full compatibility matrix
 *   GET /lexicon/v1/compatibility/:a/:b       — pair compatibility
 *   GET /lexicon/v1/families                  — all family trees
 *   GET /lexicon/v1/families/:id              — single family tree
 *   GET /lexicon/v1/stats                     — catalog statistics
 *   GET /lexicon/v1/openapi.json              — OpenAPI 3.0 spec
 */

import { Router } from 'express';

const router = Router();

// ─── Inline data (mirrored from @workspace/lexicon) ──────────────────────────
// We mirror the data here instead of importing from the frontend package
// to keep the API server self-contained. All license IDs and fields
// are kept in sync with artifacts/lexicon/src/data/licenses.ts.

import { LICENSES, searchLicenses, type LicenseCategory } from '../lib/lexicon-data';
import { COMPATIBILITY, getCompatibility } from '../lib/lexicon-compatibility';
import { FAMILY_TREES } from '../lib/lexicon-families';

// CORS middleware for this router
router.use((_req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  next();
});

router.options('*', (_req, res) => {
  res.sendStatus(204);
});

// GET /lexicon/v1/licenses
router.get('/v1/licenses', (req, res) => {
  const { q, category, family, onHuggingFace } = req.query;
  let results = q ? searchLicenses(String(q)) : [...LICENSES];

  if (category) {
    results = results.filter((l) => l.category === (category as LicenseCategory));
  }
  if (family) {
    results = results.filter((l) => l.family.toLowerCase() === String(family).toLowerCase());
  }
  if (onHuggingFace !== undefined) {
    const flag = onHuggingFace === 'true' || onHuggingFace === '1';
    results = results.filter((l) => l.onHuggingFace === flag);
  }

  res.json({ licenses: results, total: results.length });
});

// GET /lexicon/v1/licenses/:id
router.get('/v1/licenses/:id', (req, res) => {
  const license = LICENSES.find((l) => l.id === req.params.id);
  if (!license) {
    return res.status(404).json({ error: 'License not found', id: req.params.id });
  }
  res.json({ license });
});

// GET /lexicon/v1/compatibility
router.get('/v1/compatibility', (_req, res) => {
  res.json({ matrix: COMPATIBILITY });
});

// GET /lexicon/v1/compatibility/:a/:b
router.get('/v1/compatibility/:a/:b', (req, res) => {
  const { a, b } = req.params;
  const entry = getCompatibility(a, b);
  res.json({ a, b, ...entry });
});

// GET /lexicon/v1/families
router.get('/v1/families', (_req, res) => {
  res.json({ families: FAMILY_TREES });
});

// GET /lexicon/v1/families/:id
router.get('/v1/families/:id', (req, res) => {
  const family = FAMILY_TREES.find((f) => f.id === req.params.id);
  if (!family) {
    return res.status(404).json({ error: 'Family tree not found', id: req.params.id });
  }
  res.json({ family });
});

// GET /lexicon/v1/stats
router.get('/v1/stats', (_req, res) => {
  const byCategory: Record<string, number> = {};
  const byFamily: Record<string, number> = {};
  let onHuggingFace = 0;

  for (const l of LICENSES) {
    byCategory[l.category] = (byCategory[l.category] || 0) + 1;
    byFamily[l.family] = (byFamily[l.family] || 0) + 1;
    if (l.onHuggingFace) onHuggingFace++;
  }

  res.json({
    total: LICENSES.length,
    onHuggingFace,
    beyondHF: LICENSES.length - onHuggingFace,
    byCategory,
    byFamily,
  });
});

// GET /lexicon/v1/openapi.json
router.get('/v1/openapi.json', (_req, res) => {
  res.json(openApiSpec);
});

const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'LEXICON License Intelligence Catalog API',
    description: 'Public JSON API for the LEXICON license catalog. No authentication required.',
    version: '1.0.0',
    contact: { name: 'SZL Holdings', url: 'https://szlholdings.com/lexicon/' },
  },
  servers: [{ url: '/api/lexicon', description: 'Production' }],
  paths: {
    '/v1/licenses': {
      get: {
        summary: 'List all licenses',
        operationId: 'listLicenses',
        parameters: [
          { name: 'q', in: 'query', schema: { type: 'string' }, description: 'Full-text search' },
          { name: 'category', in: 'query', schema: { type: 'string' }, description: 'Filter by category' },
          { name: 'family', in: 'query', schema: { type: 'string' }, description: 'Filter by family' },
          { name: 'onHuggingFace', in: 'query', schema: { type: 'boolean' }, description: 'Filter by HF presence' },
        ],
        responses: {
          200: { description: 'List of licenses', content: { 'application/json': { schema: { type: 'object', properties: { licenses: { type: 'array' }, total: { type: 'integer' } } } } } },
        },
      },
    },
    '/v1/licenses/{id}': {
      get: {
        summary: 'Get license by ID',
        operationId: 'getLicense',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'License object' },
          404: { description: 'License not found' },
        },
      },
    },
    '/v1/compatibility': {
      get: { summary: 'Get full compatibility matrix', operationId: 'getCompatibilityMatrix', responses: { 200: { description: 'Compatibility matrix' } } },
    },
    '/v1/compatibility/{a}/{b}': {
      get: {
        summary: 'Get compatibility between two licenses',
        operationId: 'getCompatibilityPair',
        parameters: [
          { name: 'a', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'b', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: { 200: { description: 'Compatibility entry' } },
      },
    },
    '/v1/families': { get: { summary: 'List all family trees', operationId: 'listFamilies', responses: { 200: { description: 'Family trees' } } } },
    '/v1/families/{id}': {
      get: {
        summary: 'Get a single family tree',
        operationId: 'getFamily',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Family tree' }, 404: { description: 'Not found' } },
      },
    },
    '/v1/stats': { get: { summary: 'Get catalog statistics', operationId: 'getStats', responses: { 200: { description: 'Statistics' } } } },
  },
};

export default router;
