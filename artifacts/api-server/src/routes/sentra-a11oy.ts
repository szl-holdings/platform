/**
 * Sentra A11oy Integration Routes
 *
 * - GET  /sentra/a11oy/tools — list registered Sentra tools
 * - POST /sentra/a11oy/tools/:toolId/invoke — invoke a Sentra tool
 * - GET  /sentra/a11oy/case-study/healthcare — Healthcare IdP case study
 * - GET  /sentra/a11oy/prism-events — recent Prism Bus events from Sentra
 */
import { type IRouter, Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { handleRouteError, sendSuccess, sendError } from '../lib/api-response';
import { logger } from '../lib/logger';
import { listSentraTools, invokeSentraTool } from '../lib/sentra-a11oy-tools';
import { validateBody } from '../lib/validation';
import { authMiddleware, requireRole } from '../middlewares/auth';
import { prismBus } from '@szl-holdings/prism-bus';

const router: IRouter = Router();

const toolRateLimit = rateLimit({
  windowMs: 60_000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'rate_limit_exceeded', message: 'Too many tool invocation requests' },
});

router.get(
  '/sentra/a11oy/tools',
  authMiddleware(),
  async (_req, res) => {
    try {
      const tools = listSentraTools();
      sendSuccess(res, { tools, count: tools.length, domain: 'sentra', asOf: new Date().toISOString() });
    } catch (err) {
      handleRouteError(res, err, 'Sentra A11oy operation failed');
    }
  },
);

router.post(
  '/sentra/a11oy/tools/:toolId/invoke',
  toolRateLimit,
  authMiddleware(),
  requireRole('ops', 'exec', 'super_admin', 'admin'),
  validateBody(z.object({
    params: z.record(z.string(), z.unknown()).default({}),
    signalIds: z.array(z.string()).default([]),
  })),
  async (req, res) => {
    try {
      const { toolId } = req.params;
      const { params, signalIds } = req.body as { params: Record<string, unknown>; signalIds: string[] };
      const userRecord = (req as Record<string, unknown>).user as Record<string, unknown> | undefined;
      const requestedBy = userRecord ? String(userRecord.email ?? 'operator') : 'operator';
      const callerRoles: string[] = Array.isArray(userRecord?.roles)
        ? (userRecord!.roles as string[])
        : typeof userRecord?.role === 'string'
          ? [userRecord.role]
          : [];

      const result = await invokeSentraTool(toolId, params, { signalIds, requestedBy, callerRoles });
      if (result.error) {
        return sendError(res, String(result.error), 400);
      }
      sendSuccess(res, { toolId, result, invokedAt: new Date().toISOString() });
    } catch (err) {
      handleRouteError(res, err, 'Sentra A11oy operation failed');
    }
  },
);

const HEALTHCARE_CASE_STUDY = {
  id: 'case-study-healthcare-idp-2026',
  title: 'Healthcare IdP Compromise → 7-Day Blast Radius',
  description: 'A federated identity provider serving a 12-hospital network is compromised via a SAML assertion forgery (CVE-2024-22243, EPSS 0.71, KEV-listed). Within 7 days, the adversary achieves lateral movement to clinical EHR systems, radiology storage, and billing infrastructure.',
  status: 'active',
  severity: 'critical',
  mitreStages: ['Initial Access', 'Defense Evasion', 'Credential Access', 'Lateral Movement', 'Collection'],
  timeline: [
    {
      step: 1,
      timestamp: new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString(),
      event: 'Initial Compromise',
      detail: 'SAML assertion forgery via CVE-2024-22243 against Azure AD B2C federation endpoint. EPSS 0.71 — attacker leveraged within 48h of public disclosure.',
      severity: 'critical',
      page: 'autonomous-soc-command',
      deepLink: '/sentra/autonomous-soc-command?incident=INC-HCARE-001&caseStudy=healthcare-idp',
    },
    {
      step: 2,
      timestamp: new Date(Date.now() - 6 * 24 * 3600 * 1000).toISOString(),
      event: 'Identity Blast-Radius Calculated',
      detail: 'Service account `ehr-svc-prod` has admin rights to 847 endpoints across 3 hospital networks. P(7d lateral path) = 0.89. Estimated blast radius: 312 systems.',
      severity: 'critical',
      page: 'identity-blast-radius',
      deepLink: '/sentra/identity-blast-radius?identityId=ehr-svc-prod&caseStudy=healthcare-idp',
      mlSignal: {
        modelId: 'sentra-blast-radius-v1',
        p7dLateralPath: 0.89,
        estimatedBlastRadius: 312,
        highRiskTargets: ['EHR-PROD-01', 'RADIOLOGY-SRV-07', 'BILLING-DB-02', 'ICU-MON-CLUSTER'],
      },
    },
    {
      step: 3,
      timestamp: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
      event: 'Adversary Replay Simulation',
      detail: 'Monte Carlo simulation (10k runs) against current CVE landscape: 14-step attack chain, overall success rate 62%. Missed detections: scheduled task persistence + WMI lateral movement.',
      severity: 'high',
      page: 'adversary-engine',
      deepLink: '/sentra/adversary-engine?scenario=case-study-healthcare-idp-2026&caseStudy=healthcare-idp',
      mlSignal: {
        modelId: 'sentra-adversary-replay-v1',
        overallSuccessRate: 0.62,
        chainLength: 14,
        missedDetections: 3,
      },
    },
    {
      step: 4,
      timestamp: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString(),
      event: 'Containment & Incident Command',
      detail: 'Autonomous SOC triage correlated 847 alerts into 1 case (SmartScore 99). PCE-gated isolation of IdP federation endpoint and forced MFA uplift on 312 service accounts.',
      severity: 'high',
      page: 'incident-commander',
      deepLink: '/sentra/incident-commander?incident=INC-HCARE-001&caseStudy=healthcare-idp',
    },
  ],
  affectedSystems: {
    total: 312,
    ehr: 180,
    radiology: 67,
    billing: 42,
    icu: 23,
  },
  businessImpact: {
    patientsAtRisk: 240_000,
    ehiRecordsExposed: 1_400_000,
    estimatedBreach30dCost: 18_700_000,
    hipaaExposure: true,
    meanTimeToContain: '4.2h',
  },
  a11oyDeepLink: '/sentra/autonomous-soc-command?caseStudy=healthcare-idp',
  mlScores: {
    assetRisk: {
      assetId: 'azure-ad-b2c-idp-prod',
      p30dCompromise: 0.91,
      riskLabel: 'critical',
      modelId: 'sentra-asset-risk-v1',
    },
    blastRadius: {
      identityId: 'ehr-svc-prod',
      p7dLateralPath: 0.89,
      estimatedBlastRadius: 312,
      modelId: 'sentra-blast-radius-v1',
    },
    adversaryReplay: {
      scenarioId: 'REPLAY-HCARE-001',
      overallSuccessRate: 0.62,
      chainLength: 14,
      modelId: 'sentra-adversary-replay-v1',
    },
  },
  feedSources: ['CISA KEV (CVE-2024-22243)', 'FIRST EPSS (0.71)', 'MITRE ATT&CK T1606.002', 'abuse.ch ThreatFox (related IOCs)'],
  createdAt: new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString(),
  lastUpdated: new Date().toISOString(),
};

router.get(
  '/sentra/a11oy/case-study/healthcare',
  authMiddleware(),
  async (_req, res) => {
    try {
      sendSuccess(res, { caseStudy: HEALTHCARE_CASE_STUDY });
    } catch (err) {
      handleRouteError(res, err, 'Sentra A11oy operation failed');
    }
  },
);

router.get(
  '/sentra/a11oy/prism-events',
  authMiddleware(),
  async (req, res) => {
    try {
      const limit = Math.min(100, parseInt(String(req.query.limit ?? '50'), 10));
      const events = prismBus.getHistory({ domain: 'aegis', limit });
      const sentraEvents = events.filter(e =>
        String(e.sourceId ?? '').startsWith('sentra:') ||
        (e.payload && typeof e.payload === 'object' && String((e.payload as Record<string, unknown>).source ?? '').toLowerCase().includes('sentra')),
      );
      sendSuccess(res, { events: sentraEvents, total: sentraEvents.length, asOf: new Date().toISOString() });
    } catch (err) {
      handleRouteError(res, err, 'Sentra A11oy operation failed');
    }
  },
);

export default router;
