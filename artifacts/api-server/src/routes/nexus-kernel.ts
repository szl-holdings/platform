/**
 * NEXUS Kernel — Unified AI Compute Kernel API Routes
 *
 * POST /api/nexus/infer              — run inference with auto kernel selection
 * GET  /api/nexus/kernels            — list kernel catalog with filters
 * GET  /api/nexus/kernels/:id        — get single kernel details
 * GET  /api/nexus/kernels/:id/benchmark — get benchmark data for a kernel
 * POST /api/nexus/compare            — compare kernels for a workload profile
 * POST /api/nexus/simulate           — what-if workload simulator
 * GET  /api/nexus/health             — gateway & provider health
 * GET  /api/nexus/audit              — kernel routing audit trail
 * GET  /api/nexus/stats              — registry statistics
 */

import { Router } from 'express';
import {
  kernelRegistry,
  routeKernel,
  simulateWorkload,
  runInference,
  getKernelBenchmark,
  compareKernels,
  getGatewayHealth,
  getKernelAuditLog,
  getInferenceLog,
} from '@szl-holdings/ai-engine';
import type { KernelSource, KernelCategory, KernelStatus, PrecisionType } from '@szl-holdings/ai-engine';
import { logger } from '../lib/logger.js';

const router = Router();

router.get('/stats', (_req, res) => {
  try {
    const stats = kernelRegistry.getStats();
    res.json({ ok: true, data: stats });
  } catch (err) {
    logger.warn({ err }, '[nexus-kernel] getStats error');
    res.status(500).json({ ok: false, error: 'Failed to fetch kernel stats' });
  }
});

router.get('/kernels', (req, res) => {
  try {
    const { source, category, status, precision, q } = req.query as Record<string, string | undefined>;
    let kernels = kernelRegistry.getAll();
    if (q) {
      kernels = kernelRegistry.search(q);
    } else if (source || category || status || precision) {
      kernels = kernelRegistry.filter({
        ...(source ? { source: source as KernelSource } : {}),
        ...(category ? { category: category as KernelCategory } : {}),
        ...(status ? { status: status as KernelStatus } : {}),
        ...(precision ? { precision: precision as PrecisionType } : {}),
      });
    }
    res.json({ ok: true, data: kernels, total: kernels.length });
  } catch (err) {
    logger.warn({ err }, '[nexus-kernel] listKernels error');
    res.status(500).json({ ok: false, error: 'Failed to list kernels' });
  }
});

router.get('/kernels/:id', (req, res) => {
  try {
    const kernel = kernelRegistry.getById(req.params.id);
    if (!kernel) return res.status(404).json({ ok: false, error: `Kernel '${req.params.id}' not found` });
    return res.json({ ok: true, data: kernel });
  } catch (err) {
    logger.warn({ err }, '[nexus-kernel] getKernel error');
    return res.status(500).json({ ok: false, error: 'Failed to fetch kernel' });
  }
});

router.get('/kernels/:id/benchmark', (req, res) => {
  try {
    const { batchSizes, seqLens } = req.query as Record<string, string | undefined>;
    const result = getKernelBenchmark({
      kernelId: req.params.id,
      batchSizes: batchSizes ? batchSizes.split(',').map(Number) : undefined,
      seqLens: seqLens ? seqLens.split(',').map(Number) : undefined,
    });
    if (!result) return res.status(404).json({ ok: false, error: `Kernel '${req.params.id}' not found` });
    return res.json({ ok: true, data: result });
  } catch (err) {
    logger.warn({ err }, '[nexus-kernel] getKernelBenchmark error');
    return res.status(500).json({ ok: false, error: 'Failed to fetch benchmark' });
  }
});

router.post('/compare', (req, res) => {
  try {
    const { kernelIds, batchSize = 1, seqLen = 512, precision = 'fp16' } = req.body as {
      kernelIds?: string[];
      batchSize?: number;
      seqLen?: number;
      precision?: PrecisionType;
    };
    if (!Array.isArray(kernelIds) || kernelIds.length < 2) {
      return res.status(400).json({ ok: false, error: 'Provide at least 2 kernelIds to compare' });
    }
    const result = compareKernels({ kernelIds, batchSize, seqLen, precision });
    return res.json({ ok: true, data: result });
  } catch (err) {
    logger.warn({ err }, '[nexus-kernel] compareKernels error');
    return res.status(500).json({ ok: false, error: 'Failed to compare kernels' });
  }
});

router.post('/route', (req, res) => {
  try {
    const decision = routeKernel(req.body);
    res.json({ ok: true, data: decision });
  } catch (err) {
    logger.warn({ err }, '[nexus-kernel] routeKernel error');
    res.status(500).json({ ok: false, error: 'Failed to compute kernel route' });
  }
});

router.post('/simulate', (req, res) => {
  try {
    const { batchSize = 1, seqLen = 512, precisionTarget = 'fp16', computeProfile = 'latency-optimized', smVersion = 'sm_80', task = 'prefill' } = req.body;
    const result = simulateWorkload({ batchSize, seqLen, precisionTarget, computeProfile, smVersion, task });
    res.json({ ok: true, data: result });
  } catch (err) {
    logger.warn({ err }, '[nexus-kernel] simulateWorkload error');
    res.status(500).json({ ok: false, error: 'Failed to simulate workload' });
  }
});

router.post('/infer', async (req, res) => {
  try {
    const { prompt, messages } = req.body as { prompt?: string; messages?: Array<{ role: string; content: string }> };
    if (!prompt && !messages?.length) {
      return res.status(400).json({ ok: false, error: 'Provide either prompt or messages' });
    }
    const result = await runInference(req.body);
    return res.json({ ok: true, data: result });
  } catch (err) {
    logger.warn({ err }, '[nexus-kernel] runInference error');
    return res.status(500).json({ ok: false, error: 'Inference gateway error' });
  }
});

router.get('/health', (_req, res) => {
  try {
    const health = getGatewayHealth();
    res.json({ ok: true, data: health });
  } catch (err) {
    logger.warn({ err }, '[nexus-kernel] getHealth error');
    res.status(500).json({ ok: false, error: 'Failed to fetch gateway health' });
  }
});

router.get('/audit', (req, res) => {
  try {
    const limit = Math.min(200, parseInt((req.query.limit as string) ?? '50', 10));
    const log = getKernelAuditLog(limit);
    const inferenceHistory = getInferenceLog().slice(0, limit);
    res.json({ ok: true, data: { auditLog: log, inferenceHistory } });
  } catch (err) {
    logger.warn({ err }, '[nexus-kernel] getAudit error');
    res.status(500).json({ ok: false, error: 'Failed to fetch audit log' });
  }
});

export default router;
