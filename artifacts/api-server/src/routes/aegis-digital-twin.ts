import { type SecurityScenario, type ThreatActor, exportSecurityScenario } from '@szl-holdings/openusd-export';
import { type IRouter, Router } from 'express';
import rateLimit from 'express-rate-limit';
import { handleRouteError, sendBadRequest, sendNotFound } from '../lib/api-response';
import {
  aegisScenarioExportSchema,
  validateBody,
} from '../lib/validation';
import { authMiddleware } from '../middlewares/auth';

const router: IRouter = Router();

const twinRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Aegis digital twin rate limit exceeded.' },
  validate: { xForwardedForHeader: false, ip: false },
});

// ─── Illustrative tabletop scenario library ───────────────────────────────────

const TABLETOP_SCENARIOS: Record<string, SecurityScenario> = {
  'ransomware-ops': {
    scenarioId: 'ransomware-ops',
    name: 'Ransomware — Operational Technology Network',
    description:
      'A ransomware actor encrypts OT network segments, disrupting SCADA visibility. Scenario validates segmentation controls, incident response, and recovery playbooks.',
    type: 'tabletop',
    domain: 'cyber',
    threatActors: [
      {
        id: 'TA-001',
        label: 'BlackCat / ALPHV Affiliate',
        category: 'ransomware',
        ttp: ['T1566.001', 'T1486', 'T1490', 'T1562.001'],
        targetedSystems: ['SCADA Controller', 'Historian Server', 'Engineering Workstation'],
      },
    ],
    affectedSystems: [
      { id: 'sys-scada', name: 'SCADA Controller', criticality: 'critical' },
      { id: 'sys-hist', name: 'Historian Server', criticality: 'high' },
      { id: 'sys-fw', name: 'OT Firewall', criticality: 'high' },
    ],
    phases: [
      {
        id: 'phase-1',
        name: 'Initial Access — Phishing',
        description: 'Spear-phishing email delivers malicious attachment to IT network.',
        ttps: ['T1566.001', 'T1204.002'],
        durationMinutes: 15,
        detectionProbability: 0.35,
      },
      {
        id: 'phase-2',
        name: 'Lateral Movement — IT/OT Boundary',
        description: 'Attacker pivots from IT to OT network through under-segmented DMZ.',
        ttps: ['T1021.001', 'T1078'],
        durationMinutes: 45,
        detectionProbability: 0.55,
      },
      {
        id: 'phase-3',
        name: 'Impact — Ransomware Deployment',
        description: 'Ransomware encrypts SCADA historian and engineering workstations.',
        ttps: ['T1486', 'T1490'],
        durationMinutes: 10,
        detectionProbability: 0.9,
      },
    ],
    postureScoreBefore: 68,
    postureScoreAfter: 42,
    mttdEstimateMinutes: 70,
    mttrEstimateMinutes: 480,
    blastRadiusPct: 35,
    classificationLevel: 'confidential',
  },
  'insider-data-exfil': {
    scenarioId: 'insider-data-exfil',
    name: 'Insider Threat — Privileged Data Exfiltration',
    description:
      'A privileged insider exfiltrates sensitive financial and client data prior to resignation. Scenario tests DLP controls, UEBA alerting, and legal escalation procedures.',
    type: 'tabletop',
    domain: 'cyber',
    threatActors: [
      {
        id: 'TA-002',
        label: 'Malicious Insider (Privileged Employee)',
        category: 'insider',
        ttp: ['T1078.002', 'T1052.001', 'T1567.002'],
        targetedSystems: ['Financial Records', 'CRM Database', 'SharePoint'],
      },
    ],
    affectedSystems: [
      { id: 'sys-crm', name: 'CRM Database', criticality: 'high' },
      { id: 'sys-fin', name: 'Financial Records System', criticality: 'critical' },
      { id: 'sys-sp', name: 'SharePoint', criticality: 'medium' },
    ],
    phases: [
      {
        id: 'phase-1',
        name: 'Reconnaissance — Identifying Valuable Data',
        description: 'Insider maps accessible data stores using legitimate credentials.',
        ttps: ['T1078.002', 'T1213'],
        durationMinutes: 60,
        detectionProbability: 0.15,
      },
      {
        id: 'phase-2',
        name: 'Collection — Bulk Download',
        description: 'Large-volume file download triggers anomalous DLP alert (if configured).',
        ttps: ['T1213.001', 'T1052.001'],
        durationMinutes: 30,
        detectionProbability: 0.6,
      },
      {
        id: 'phase-3',
        name: 'Exfiltration — USB / Personal Cloud',
        description: 'Data staged to USB drive and personal cloud storage.',
        ttps: ['T1052.001', 'T1567.002'],
        durationMinutes: 20,
        detectionProbability: 0.45,
      },
    ],
    postureScoreBefore: 72,
    postureScoreAfter: 58,
    mttdEstimateMinutes: 110,
    mttrEstimateMinutes: 240,
    blastRadiusPct: 20,
    classificationLevel: 'confidential',
  },
  'supply-chain-compromise': {
    scenarioId: 'supply-chain-compromise',
    name: 'Software Supply Chain Compromise',
    description:
      'A nation-state actor poisons a third-party software update, achieving persistent access to multiple SZL environments. Scenario rehearses supply-chain detection and vendor isolation.',
    type: 'red_team',
    domain: 'hybrid',
    threatActors: [
      {
        id: 'TA-003',
        label: 'APT29 (Cozy Bear) — Nation State',
        category: 'nation_state',
        ttp: ['T1195.002', 'T1059.001', 'T1027', 'T1071.001'],
        targetedSystems: ['CI/CD Pipeline', 'Software Update Server', 'Enterprise SSO'],
      },
    ],
    affectedSystems: [
      { id: 'sys-cicd', name: 'CI/CD Pipeline', criticality: 'critical' },
      { id: 'sys-sso', name: 'Enterprise SSO', criticality: 'critical' },
      { id: 'sys-upd', name: 'Software Update Server', criticality: 'high' },
    ],
    phases: [
      {
        id: 'phase-1',
        name: 'Supply Chain Infiltration',
        description: "Attacker compromises upstream vendor's build pipeline.",
        ttps: ['T1195.002'],
        durationMinutes: 0,
        detectionProbability: 0.05,
      },
      {
        id: 'phase-2',
        name: 'Trojanized Update Deployment',
        description: 'Malicious update deployed to SZL environments via legitimate update channel.',
        ttps: ['T1195.002', 'T1059.001'],
        durationMinutes: 30,
        detectionProbability: 0.2,
      },
      {
        id: 'phase-3',
        name: 'Persistent C2 Establishment',
        description:
          'Backdoor establishes encrypted C2 channel, masquerading as legitimate traffic.',
        ttps: ['T1071.001', 'T1027'],
        durationMinutes: 5,
        detectionProbability: 0.3,
      },
    ],
    postureScoreBefore: 75,
    postureScoreAfter: 38,
    mttdEstimateMinutes: 180,
    mttrEstimateMinutes: 720,
    blastRadiusPct: 65,
    classificationLevel: 'secret',
  },
};

const VALID_SCENARIO_TYPES = [
  'tabletop',
  'incident_response',
  'threat_simulation',
  'red_team',
  'breach_rehearsal',
];
const VALID_DOMAINS = ['cyber', 'physical', 'hybrid'];
const VALID_CLASSIFICATIONS = ['unclassified', 'confidential', 'secret'];

// ─── GET /aegis/scenarios/:scenarioId/export ──────────────────────────────────

router.get(
  '/aegis/scenarios/:scenarioId/export',
  twinRateLimit,
  authMiddleware({ required: false }),
  async (req, res) => {
    try {
      const { scenarioId } = req.params;

      const scenario = TABLETOP_SCENARIOS[scenarioId];
      if (!scenario) {
        sendNotFound(
          res,
          `Scenario '${scenarioId}'. Available: ${Object.keys(TABLETOP_SCENARIOS).join(', ')}`,
        );
        return;
      }

      const result = exportSecurityScenario(scenario);

      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="scenario-${scenarioId}.usda"`);
      res.setHeader('X-SZL-Export-Type', 'security_scenario');
      res.setHeader('X-SZL-Prim-Count', String(result.primCount));
      res.setHeader('X-SZL-Export-At', result.exportedAt);
      if (result.warnings.length > 0) {
        res.setHeader('X-SZL-Warnings', result.warnings.join('; '));
      }
      res.status(200).send(result.usdaContent);
    } catch (err) {
      handleRouteError(res, err, 'Failed to export security scenario');
    }
  },
);

// ─── POST /aegis/scenarios/export (custom scenario) ──────────────────────────

router.post(
  '/aegis/scenarios/export',
  twinRateLimit,
  authMiddleware({ required: false }),
  validateBody(aegisScenarioExportSchema),
  async (req, res) => {
    try {
      const body = req.body as Partial<SecurityScenario> & { format?: string };

      if (!body.scenarioId || typeof body.scenarioId !== 'string') {
        sendBadRequest(res, 'scenarioId is required');
        return;
      }
      if (!body.name || typeof body.name !== 'string') {
        sendBadRequest(res, 'name is required');
        return;
      }
      if (!body.description || typeof body.description !== 'string') {
        sendBadRequest(res, 'description is required');
        return;
      }
      if (!body.type || !VALID_SCENARIO_TYPES.includes(body.type)) {
        sendBadRequest(res, `type must be one of: ${VALID_SCENARIO_TYPES.join(', ')}`);
        return;
      }
      if (!body.domain || !VALID_DOMAINS.includes(body.domain)) {
        sendBadRequest(res, `domain must be one of: ${VALID_DOMAINS.join(', ')}`);
        return;
      }
      if (body.classificationLevel && !VALID_CLASSIFICATIONS.includes(body.classificationLevel)) {
        sendBadRequest(
          res,
          `classificationLevel must be one of: ${VALID_CLASSIFICATIONS.join(', ')}`,
        );
        return;
      }

      const scenario: SecurityScenario = {
        scenarioId: body.scenarioId,
        name: body.name,
        description: body.description,
        type: body.type as SecurityScenario['type'],
        domain: body.domain as SecurityScenario['domain'],
        threatActors: Array.isArray(body.threatActors)
          ? (body.threatActors as ThreatActor[])
          : undefined,
        affectedSystems: Array.isArray(body.affectedSystems) ? body.affectedSystems : undefined,
        phases: Array.isArray(body.phases) ? body.phases : undefined,
        postureScoreBefore:
          typeof body.postureScoreBefore === 'number' ? body.postureScoreBefore : undefined,
        postureScoreAfter:
          typeof body.postureScoreAfter === 'number' ? body.postureScoreAfter : undefined,
        mttdEstimateMinutes:
          typeof body.mttdEstimateMinutes === 'number' ? body.mttdEstimateMinutes : undefined,
        mttrEstimateMinutes:
          typeof body.mttrEstimateMinutes === 'number' ? body.mttrEstimateMinutes : undefined,
        blastRadiusPct: typeof body.blastRadiusPct === 'number' ? body.blastRadiusPct : undefined,
        classificationLevel:
          (body.classificationLevel as SecurityScenario['classificationLevel']) ?? 'unclassified',
        organizationId: body.organizationId,
        simulationParams: body.simulationParams,
      };

      const result = exportSecurityScenario(scenario);

      if (body.format === 'usda') {
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.setHeader(
          'Content-Disposition',
          `attachment; filename="scenario-${scenario.scenarioId}.usda"`,
        );
        res.setHeader('X-SZL-Export-Type', 'security_scenario');
        res.setHeader('X-SZL-Prim-Count', String(result.primCount));
        res.setHeader('X-SZL-Export-At', result.exportedAt);
        if (result.warnings.length > 0) {
          res.setHeader('X-SZL-Warnings', result.warnings.join('; '));
        }
        res.status(200).send(result.usdaContent);
      } else {
        res.json({
          scenarioId: scenario.scenarioId,
          export: {
            entityId: result.entityId,
            entityType: result.entityType,
            exportedAt: result.exportedAt,
            fileSizeBytes: result.fileSizeBytes,
            primCount: result.primCount,
            warnings: result.warnings,
            usdaContent: result.usdaContent,
          },
        });
      }
    } catch (err) {
      handleRouteError(res, err, 'Failed to export custom security scenario');
    }
  },
);

// ─── GET /aegis/scenarios/library ────────────────────────────────────────────

router.get(
  '/aegis/scenarios/library',
  twinRateLimit,
  authMiddleware({ required: false }),
  async (_req, res) => {
    try {
      const library = Object.values(TABLETOP_SCENARIOS).map((s) => ({
        scenarioId: s.scenarioId,
        name: s.name,
        description: s.description,
        type: s.type,
        domain: s.domain,
        classification: s.classificationLevel,
        blastRadiusPct: s.blastRadiusPct,
        mttdEstimateMinutes: s.mttdEstimateMinutes,
        mttrEstimateMinutes: s.mttrEstimateMinutes,
        threatActorCount: s.threatActors?.length ?? 0,
        phaseCount: s.phases?.length ?? 0,
        affectedSystemCount: s.affectedSystems?.length ?? 0,
      }));
      res.json({ scenarios: library, total: library.length });
    } catch (err) {
      handleRouteError(res, err, 'Failed to list scenario library');
    }
  },
);

export default router;
