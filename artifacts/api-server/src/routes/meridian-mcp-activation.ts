/**
 * Meridian MCP Activation Route
 *
 * Read-only API exposing the 15 governed external MCP servers registry.
 * Distinct from the existing mcp.ts file (which handles the internal
 * MCP JSON-RPC gateway). This file uses the prefix meridian-mcp-* and
 * will not conflict with Task #3571's broader Meridian routes.
 *
 * Endpoints:
 *   GET /meridian-mcp/registry        — full registry as JSON
 *   GET /meridian-mcp/registry/:slug  — single server entry
 *   GET /meridian-mcp/summary         — counts by risk class and category
 */

import { type Request, type Response, Router } from 'express';
import { sendError, sendSuccess } from '../lib/api-response';
import {
  MCP_REGISTRY,
  MCP_REGISTRY_TOTAL,
  MCP_REGISTRY_VERSION,
  getMcpServerBySlug,
  type McpCategory,
  type McpRiskClass,
} from '../services/meridian-mcp-registry.js';

const router = Router();

router.get('/meridian-mcp/registry', (_req: Request, res: Response) => {
  sendSuccess(res, {
    version: MCP_REGISTRY_VERSION,
    total: MCP_REGISTRY_TOTAL,
    servers: MCP_REGISTRY,
  });
});

router.get('/meridian-mcp/registry/:slug', (req: Request, res: Response) => {
  const { slug } = req.params;
  const entry = getMcpServerBySlug(slug);
  if (!entry) {
    sendError(res, `No MCP server found with slug: ${slug}`, 404, 'NOT_FOUND');
    return;
  }
  sendSuccess(res, entry);
});

router.get('/meridian-mcp/summary', (_req: Request, res: Response) => {
  const byRisk: Record<McpRiskClass, number> = { low: 0, medium: 0, high: 0, mutating: 0 };
  const byCategory: Partial<Record<McpCategory, number>> = {};
  let readyCount = 0;

  for (const s of MCP_REGISTRY) {
    byRisk[s.riskClass] = (byRisk[s.riskClass] ?? 0) + 1;
    byCategory[s.category] = (byCategory[s.category] ?? 0) + 1;
    if (s.readOnlyReady) readyCount++;
  }

  sendSuccess(res, {
    version: MCP_REGISTRY_VERSION,
    total: MCP_REGISTRY_TOTAL,
    readOnlyReadyCount: readyCount,
    byRiskClass: byRisk,
    byCategory,
    governancePolicy: 'read-first — all servers default to read-only; mutations require explicit human approval',
  });
});

export default router;
