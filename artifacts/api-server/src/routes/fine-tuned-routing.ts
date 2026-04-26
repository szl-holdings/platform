import { Router } from 'express';
import { requireRole } from '../middlewares/auth';
import { extractTenantId } from '../services/tenant-trust-registry';

const router = Router();

interface TenantDomainMapping {
  domain: string;
  preferredLane: string;
  fallbackModels: string[];
  fineTunedAgentId?: string;
  costCeiling?: number;
}

const _tenantDomainOverrides = new Map<string, TenantDomainMapping[]>();

router.get('/fine-tuned/domains', async (req, res) => {
  try {
    const tenantId = extractTenantId(req as Record<string, unknown>);
    const { getDomainMappings, getAvailableDomainsWithFineTuning } = await import(
      '@szl-holdings/ai-engine/fine-tuned-router'
    );

    const baseMappings = getDomainMappings();
    const tenantOverrides = _tenantDomainOverrides.get(tenantId) ?? [];

    const mergedDomains = new Map<string, TenantDomainMapping>();
    for (const m of baseMappings) {
      mergedDomains.set(m.domain, m);
    }
    for (const m of tenantOverrides) {
      mergedDomains.set(m.domain, m);
    }

    res.json({
      mappings: Array.from(mergedDomains.values()),
      domainsWithFineTuning: getAvailableDomainsWithFineTuning(),
    });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to get domain mappings' });
  }
});

router.post('/fine-tuned/route', async (req, res) => {
  try {
    const { domain, agentId, preferFineTuned, lane } = req.body;
    if (typeof domain !== 'string' || !domain.trim()) {
      res.status(400).json({ error: '"domain" is required and must be a non-empty string' });
      return;
    }

    const tenantId = extractTenantId(req as Record<string, unknown>);
    const tenantOverrides = _tenantDomainOverrides.get(tenantId) ?? [];

    const { routeForDomain } = await import('@szl-holdings/ai-engine/fine-tuned-router');
    const result = await routeForDomain(domain, {
      agentId,
      preferFineTuned,
      lane,
      overrideMappings: tenantOverrides,
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Routing failed' });
  }
});

router.post(
  '/fine-tuned/register-domain',
  requireRole('admin', 'ops'),
  async (req, res) => {
    try {
      const { domain, preferredLane, fallbackModels, fineTunedAgentId, costCeiling } = req.body;

      if (typeof domain !== 'string' || !domain.trim()) {
        res.status(400).json({ error: '"domain" is required and must be a non-empty string' });
        return;
      }
      if (typeof preferredLane !== 'string' || !preferredLane.trim()) {
        res.status(400).json({ error: '"preferredLane" is required and must be a non-empty string' });
        return;
      }
      if (!Array.isArray(fallbackModels) || fallbackModels.length === 0) {
        res.status(400).json({ error: '"fallbackModels" is required and must be a non-empty array of model strings' });
        return;
      }
      for (let i = 0; i < fallbackModels.length; i++) {
        if (typeof fallbackModels[i] !== 'string' || !fallbackModels[i].trim()) {
          res.status(400).json({ error: `fallbackModels[${i}] must be a non-empty string` });
          return;
        }
      }
      if (fineTunedAgentId !== undefined && (typeof fineTunedAgentId !== 'string' || !fineTunedAgentId.trim())) {
        res.status(400).json({ error: '"fineTunedAgentId" must be a non-empty string when provided' });
        return;
      }
      if (costCeiling !== undefined && (typeof costCeiling !== 'number' || costCeiling < 0)) {
        res.status(400).json({ error: '"costCeiling" must be a non-negative number when provided' });
        return;
      }

      const tenantId = extractTenantId(req as Record<string, unknown>);
      const overrides = _tenantDomainOverrides.get(tenantId) ?? [];
      const existingIdx = overrides.findIndex((m) => m.domain === domain);

      const mapping: TenantDomainMapping = {
        domain,
        preferredLane,
        fallbackModels,
        fineTunedAgentId,
        costCeiling,
      };

      if (existingIdx >= 0) {
        overrides[existingIdx] = mapping;
      } else {
        overrides.push(mapping);
      }
      _tenantDomainOverrides.set(tenantId, overrides);

      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Registration failed' });
    }
  },
);

export default router;
