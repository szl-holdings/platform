/**
 * Stress Drill — Adversarial red-team & crisis stress-drill suite
 *
 * All drill state is isolated in-memory (never touches production tables).
 * Injects simulate real signals into the alert bus and trigger runbooks.
 *
 * Routes:
 *   GET  /stress-drill/scenarios              — scenario library
 *   GET  /stress-drill/drills                 — list tenant drills
 *   POST /stress-drill/drills                 — create a drill
 *   GET  /stress-drill/drills/:id             — get drill state
 *   POST /stress-drill/drills/:id/start       — start the drill
 *   POST /stress-drill/drills/:id/advance     — fire next inject
 *   POST /stress-drill/drills/:id/respond     — log team response to an inject
 *   POST /stress-drill/drills/:id/complete    — finalise and score
 *   POST /stress-drill/drills/:id/abort       — abort drill
 *   GET  /stress-drill/drills/:id/debrief     — scored debrief
 *   GET  /stress-drill/drills/:id/debrief/pdf — PDF debrief export (application/pdf via pdfkit)
 */

import { type IRouter, type Request, type Response, Router } from 'express';
import { z } from 'zod';
import PDFDocument from 'pdfkit';
import { PassThrough } from 'node:stream';
import { defaultSignalBus } from '@szl-holdings/signal-mesh';
import { createSignal, type SignalDomain, type SignalSeverity, type SignalType } from '@workspace/ontology/signal';
import {
  handleRouteError,
  sendBadRequest,
  sendCreated,
  sendNotFound,
  sendSuccess,
  sendUnauthorized,
} from '../lib/api-response';
import { validateBody } from '../lib/validation';
import { authMiddleware } from '../middlewares/auth';
import { logger } from '../lib/logger';
import {
  type ScenarioId,
  type CrisisInject,
  abortDrill,
  advanceDrill,
  completeDrill,
  createDrill,
  getDrill,
  getScenario,
  listDrills,
  listScenarios,
  respondToInject,
  startDrill,
} from '../services/stress-drill-store';

const router: IRouter = Router();

// ─── Signal Bus — inject publisher ────────────────────────────────────────────

const DOMAIN_MAP: Record<string, SignalDomain> = {
  sentra: 'security',
  aegis: 'security',
  holdings: 'finance',
  counsel: 'legal',
  vessels: 'maritime',
  terra: 'real-estate',
};

const TYPE_MAP: Record<string, SignalType> = {
  ransomware: 'anomaly',
  regulatory: 'compliance-flag',
  cascade: 'risk',
};

function publishInjectSignal(
  inject: CrisisInject,
  drillId: string,
  scenarioId: string,
  archetype: string,
): void {
  try {
    const domain: SignalDomain = DOMAIN_MAP[inject.domain] ?? 'cross-domain';
    const type: SignalType = TYPE_MAP[archetype] ?? 'risk';
    const severity = inject.severity as SignalSeverity;
    const signal = createSignal({
      source: 'synthetic',
      type,
      domain,
      occurredAt: new Date().toISOString(),
      freshness: 1,
      confidence: 0.99,
      severity,
      entityRefs: [{ entityId: drillId, entityType: 'drill', displayName: `Stress Drill — ${inject.title}` }],
      rawPayload: {
        title: inject.title,
        description: inject.description,
        expectedResponse: inject.expectedResponse,
        runbookRef: inject.runbookRef,
        requiresHumanApproval: inject.requiresHumanApproval,
        drillId,
        scenarioId,
        injectId: inject.id,
      },
      tags: ['stress-drill', 'synthetic', archetype, inject.domain],
      provenance: { sourceService: 'stress-drill-runner' },
    });
    defaultSignalBus.publish(signal);
    logger.info({ signalId: signal.signalId, drillId, injectId: inject.id }, '[stress-drill] inject signal published to bus');
  } catch (err) {
    logger.warn({ err, drillId, injectId: inject.id }, '[stress-drill] failed to publish inject signal — non-fatal');
  }
}

// ─── PDF debrief generator ────────────────────────────────────────────────────

interface DebriefPdfParams {
  drillId: string;
  operatorLabel: string;
  scenarioName: string;
  scenarioTagline: string;
  grade: string;
  overallScore: number;
  verdict: string;
  totalInjects: number;
  detected: number;
  resolved: number;
  missed: number;
  avgDetectMinutes: number | null;
  avgResolveMinutes: number | null;
  humanApprovalsGiven: number;
  humanApprovalsRequired: number;
  completedAt: string;
  domainBreakdown: Array<{ domain: string; injectCount: number; detected: number; resolved: number }>;
  missedSteps: string[];
  recommendations: string[];
  timeline: Array<{
    severity: string;
    domain: string;
    title: string;
    runbookRef: string;
    firedAt: string | null;
    responseType: string | null;
    notes: string | null;
  }>;
}

function buildDebriefPdf(p: DebriefPdfParams): PassThrough {
  const stream = new PassThrough();
  const doc = new PDFDocument({ size: 'LETTER', margin: 72, autoFirstPage: true });
  doc.pipe(stream);

  const BG: [number, number, number] = [10, 15, 30];
  const SURFACE: [number, number, number] = [17, 24, 48];
  const TEXT: [number, number, number] = [225, 230, 240];
  const MUTED: [number, number, number] = [100, 120, 160];
  const PRIMARY: [number, number, number] = [200, 160, 80];
  const GREEN: [number, number, number] = [34, 197, 94];
  const RED: [number, number, number] = [239, 68, 68];
  const AMBER: [number, number, number] = [245, 158, 11];
  const BLUE: [number, number, number] = [56, 189, 248];
  const PURPLE: [number, number, number] = [167, 139, 250];
  const W = 612 - 144;
  const M = 72;

  const gradeColor = (g: string): [number, number, number] =>
    g === 'A' ? GREEN : g === 'B' ? [132, 204, 22] : g === 'C' ? AMBER : g === 'D' ? [249, 115, 22] : RED;

  const sevColor = (s: string): [number, number, number] =>
    s === 'critical' ? RED : s === 'high' ? [249, 115, 22] : s === 'medium' ? AMBER : MUTED;

  doc.rect(0, 0, doc.page.width, doc.page.height).fill(BG);

  doc.font('Helvetica-Bold').fontSize(9).fillColor(MUTED)
    .text('CRISIS STRESS DRILL — DEBRIEF REPORT', M, M, { width: W });
  doc.moveDown(0.3);
  doc.font('Helvetica-Bold').fontSize(22).fillColor(TEXT)
    .text(p.scenarioName, M, doc.y, { width: W - 120 });
  doc.font('Helvetica').fontSize(11).fillColor(MUTED)
    .text(p.scenarioTagline, M, doc.y, { width: W - 120 });

  const gradeBox = { x: M + W - 100, y: M, w: 100, h: 90 };
  doc.rect(gradeBox.x, gradeBox.y, gradeBox.w, gradeBox.h).lineWidth(2).strokeColor(gradeColor(p.grade)).stroke();
  doc.font('Helvetica-Bold').fontSize(44).fillColor(gradeColor(p.grade))
    .text(p.grade, gradeBox.x, gradeBox.y + 8, { width: gradeBox.w, align: 'center' });
  doc.font('Helvetica-Bold').fontSize(14).fillColor(gradeColor(p.grade))
    .text(`${p.overallScore}/100`, gradeBox.x, gradeBox.y + 60, { width: gradeBox.w, align: 'center' });

  doc.moveDown(0.6);
  doc.font('Helvetica').fontSize(11).fillColor(TEXT)
    .text(`Operator: ${p.operatorLabel}   ·   Completed: ${new Date(p.completedAt).toLocaleString()}`, M, doc.y, { width: W });
  doc.moveDown(0.4);

  doc.rect(M, doc.y, W, 0.5).fill(PRIMARY);
  doc.moveDown(0.4);
  doc.font('Helvetica').fontSize(11).fillColor(TEXT)
    .text(p.verdict, M, doc.y, { width: W });
  doc.moveDown(0.8);

  const stats = [
    { label: 'Injects Fired', value: String(p.totalInjects), color: TEXT },
    { label: 'Detected', value: String(p.detected), color: GREEN },
    { label: 'Resolved', value: String(p.resolved), color: PURPLE },
    { label: 'Missed', value: String(p.missed), color: RED },
    { label: 'Avg Detect', value: p.avgDetectMinutes != null ? `${p.avgDetectMinutes}m` : 'N/A', color: AMBER },
    { label: 'Avg Resolve', value: p.avgResolveMinutes != null ? `${p.avgResolveMinutes}m` : 'N/A', color: PURPLE },
    { label: 'Human Approvals', value: `${p.humanApprovalsGiven}/${p.humanApprovalsRequired}`, color: BLUE },
  ];
  const colW = W / 3;
  const rowH = 52;
  stats.forEach((s, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const x = M + col * colW;
    const y = doc.y + row * rowH;
    doc.rect(x + 2, y, colW - 4, rowH - 4).fill(SURFACE);
    doc.font('Helvetica').fontSize(8).fillColor(MUTED)
      .text(s.label.toUpperCase(), x + 8, y + 8, { width: colW - 16 });
    doc.font('Helvetica-Bold').fontSize(20).fillColor(s.color)
      .text(s.value, x + 8, y + 20, { width: colW - 16 });
  });
  doc.y += rowH * Math.ceil(stats.length / 3) + 4;
  doc.moveDown(0.8);

  const h2 = (label: string) => {
    if (doc.y + 40 > doc.page.height - 72) { doc.addPage(); doc.rect(0, 0, doc.page.width, doc.page.height).fill(BG); }
    doc.moveDown(0.4);
    doc.font('Helvetica-Bold').fontSize(10).fillColor(MUTED)
      .text(label.toUpperCase(), M, doc.y, { width: W });
    doc.rect(M, doc.y, W, 0.5).fill(PRIMARY);
    doc.moveDown(0.4);
  };

  h2('Inject Timeline');
  const fired = p.timeline.filter((t) => t.firedAt !== null);
  fired.forEach((t) => {
    if (doc.y + 30 > doc.page.height - 72) { doc.addPage(); doc.rect(0, 0, doc.page.width, doc.page.height).fill(BG); }
    const sc = sevColor(t.severity);
    doc.rect(M, doc.y, 4, 20).fill(sc);
    doc.font('Helvetica-Bold').fontSize(10).fillColor(sc)
      .text(t.severity.toUpperCase(), M + 10, doc.y, { width: 60 });
    doc.font('Helvetica-Bold').fontSize(10).fillColor(MUTED)
      .text(t.domain.toUpperCase(), M + 80, doc.y, { width: 60 });
    doc.font('Helvetica-Bold').fontSize(10).fillColor(TEXT)
      .text(t.title, M + 150, doc.y, { width: W - 160 });
    doc.moveDown(0.3);
    doc.font('Helvetica').fontSize(9).fillColor(MUTED)
      .text(`Runbook: ${t.runbookRef}   Response: ${t.responseType ?? 'MISSED'}${t.notes ? '   Notes: ' + t.notes.slice(0, 80) : ''}`,
        M + 10, doc.y, { width: W - 10 });
    doc.moveDown(0.6);
  });

  h2('Domain Breakdown');
  p.domainBreakdown.forEach((d) => {
    if (doc.y + 20 > doc.page.height - 72) { doc.addPage(); doc.rect(0, 0, doc.page.width, doc.page.height).fill(BG); }
    doc.font('Helvetica-Bold').fontSize(10).fillColor(TEXT)
      .text(d.domain.toUpperCase(), M, doc.y, { width: 100 });
    doc.font('Helvetica').fontSize(10).fillColor(MUTED)
      .text(`${d.injectCount} injects   ${d.detected} detected   ${d.resolved} resolved`, M + 110, doc.y, { width: W - 110 });
    doc.moveDown(0.5);
  });

  if (p.missedSteps.length > 0) {
    h2('Missed Steps');
    p.missedSteps.forEach((m) => {
      if (doc.y + 20 > doc.page.height - 72) { doc.addPage(); doc.rect(0, 0, doc.page.width, doc.page.height).fill(BG); }
      doc.font('Helvetica').fontSize(10).fillColor(RED)
        .text(`\u2022 ${m}`, M + 10, doc.y, { width: W - 10 });
      doc.moveDown(0.4);
    });
  }

  h2('Recommendations');
  p.recommendations.forEach((r) => {
    if (doc.y + 20 > doc.page.height - 72) { doc.addPage(); doc.rect(0, 0, doc.page.width, doc.page.height).fill(BG); }
    doc.font('Helvetica').fontSize(10).fillColor(TEXT)
      .text(`\u2022 ${r}`, M + 10, doc.y, { width: W - 10 });
    doc.moveDown(0.4);
  });

  doc.moveDown(1);
  doc.rect(M, doc.y, W, 0.5).fill(MUTED);
  doc.moveDown(0.4);
  doc.font('Helvetica').fontSize(8).fillColor(MUTED)
    .text(`SZL Holdings — Crisis Stress Drill Debrief  \u00B7  ${new Date().toISOString()}  \u00B7  CONFIDENTIAL — INTERNAL USE ONLY`, M, doc.y, { width: W, align: 'center' });

  doc.end();
  return stream;
}

// ─── Auth helpers ─────────────────────────────────────────────────────────────

function callerTenantId(req: Request): string {
  const orgId = (req.user as { orgs?: Array<{ orgId?: number }> } | undefined)?.orgs?.[0]?.orgId;
  return orgId ? `tenant-${String(orgId)}` : 'tenant-demo';
}

function callerLabel(req: Request): string {
  return (req.user as { email?: string } | undefined)?.email ?? 'operator@drill';
}

// ─── Schemas ──────────────────────────────────────────────────────────────────

const createDrillSchema = z.object({
  scenarioId: z.enum(['ransomware-cfo', 'sanctions-sweep', 'hurricane-default']),
  operatorLabel: z.string().min(1).max(200).optional(),
});

const respondSchema = z.object({
  injectId: z.string().min(1),
  responseType: z.enum(['detected', 'contained', 'resolved', 'escalated', 'missed']),
  notes: z.string().max(2000).default(''),
  humanApprovalGiven: z.boolean().default(false),
});

// ─── Scenario Library (public) ─────────────────────────────────────────────────

router.get('/stress-drill/scenarios', (_req: Request, res: Response) => {
  try {
    const scenarios = listScenarios().map((s) => ({
      id: s.id,
      name: s.name,
      tagline: s.tagline,
      archetype: s.archetype,
      icon: s.icon,
      accentColor: s.accentColor,
      durationHours: s.durationHours,
      summary: s.summary,
      domains: s.domains,
      injectCount: s.injects.length,
      injects: s.injects.map((inj) => ({
        id: inj.id,
        t: inj.t,
        domain: inj.domain,
        severity: inj.severity,
        title: inj.title,
        description: inj.description,
        expectedResponse: inj.expectedResponse,
        runbookRef: inj.runbookRef,
        requiresHumanApproval: inj.requiresHumanApproval,
      })),
    }));
    sendSuccess(res, { scenarios });
  } catch (err) {
    handleRouteError(res, err, 'Failed to load scenarios');
  }
});

// ─── List Drills ───────────────────────────────────────────────────────────────

router.get(
  '/stress-drill/drills',
  authMiddleware({ required: true }),
  (req: Request, res: Response) => {
    try {
      if (!req.user) { sendUnauthorized(res); return; }
      const drills = listDrills(callerTenantId(req));
      sendSuccess(res, { drills });
    } catch (err) {
      handleRouteError(res, err, 'Failed to list drills');
    }
  },
);

// ─── Create Drill ──────────────────────────────────────────────────────────────

router.post(
  '/stress-drill/drills',
  authMiddleware({ required: true }),
  validateBody(createDrillSchema),
  (req: Request, res: Response) => {
    try {
      if (!req.user) { sendUnauthorized(res); return; }
      const body = req.body as z.infer<typeof createDrillSchema>;
      const scenario = getScenario(body.scenarioId as ScenarioId);
      if (!scenario) {
        sendNotFound(res, 'Scenario');
        return;
      }
      const drill = createDrill({
        tenantId: callerTenantId(req),
        scenarioId: body.scenarioId as ScenarioId,
        operatorLabel: body.operatorLabel ?? callerLabel(req),
      });
      if (!drill) {
        sendBadRequest(res, 'Failed to create drill');
        return;
      }
      logger.info({ drillId: drill.id, scenarioId: drill.scenarioId }, '[stress-drill] drill created');
      sendCreated(res, drill);
    } catch (err) {
      handleRouteError(res, err, 'Failed to create drill');
    }
  },
);

// ─── Get Drill ────────────────────────────────────────────────────────────────

router.get(
  '/stress-drill/drills/:id',
  authMiddleware({ required: true }),
  (req: Request, res: Response) => {
    try {
      if (!req.user) { sendUnauthorized(res); return; }
      const drill = getDrill(req.params.id as string);
      if (!drill) { sendNotFound(res, 'Drill'); return; }
      if (drill.tenantId !== callerTenantId(req)) { sendNotFound(res, 'Drill'); return; }
      sendSuccess(res, drill);
    } catch (err) {
      handleRouteError(res, err, 'Failed to get drill');
    }
  },
);

// ─── Start Drill ──────────────────────────────────────────────────────────────

router.post(
  '/stress-drill/drills/:id/start',
  authMiddleware({ required: true }),
  (req: Request, res: Response) => {
    try {
      if (!req.user) { sendUnauthorized(res); return; }
      const drill = getDrill(req.params.id as string);
      if (!drill) { sendNotFound(res, 'Drill'); return; }
      if (drill.tenantId !== callerTenantId(req)) { sendNotFound(res, 'Drill'); return; }
      const updated = startDrill(drill.id);
      if (!updated) {
        sendBadRequest(res, 'Drill is not in ready state');
        return;
      }

      const firstInjectStatus = updated.injectStatuses[0];
      if (firstInjectStatus?.firedAt !== null) {
        const scenario = getScenario(updated.scenarioId);
        publishInjectSignal(firstInjectStatus.inject, updated.id, updated.scenarioId, scenario?.archetype ?? 'cascade');
      }

      logger.info({ drillId: drill.id }, '[stress-drill] drill started');
      sendSuccess(res, updated);
    } catch (err) {
      handleRouteError(res, err, 'Failed to start drill');
    }
  },
);

// ─── Advance Drill (fire next inject) ─────────────────────────────────────────

router.post(
  '/stress-drill/drills/:id/advance',
  authMiddleware({ required: true }),
  (req: Request, res: Response) => {
    try {
      if (!req.user) { sendUnauthorized(res); return; }
      const drill = getDrill(req.params.id as string);
      if (!drill) { sendNotFound(res, 'Drill'); return; }
      if (drill.tenantId !== callerTenantId(req)) { sendNotFound(res, 'Drill'); return; }

      const result = advanceDrill(drill.id);
      if (!result) {
        sendBadRequest(res, 'Drill is not running or has no more injects');
        return;
      }

      if (result.nextInject) {
        const scenario = getScenario(drill.scenarioId);
        publishInjectSignal(result.nextInject, drill.id, drill.scenarioId, scenario?.archetype ?? 'cascade');
      }

      logger.info(
        { drillId: drill.id, nextInject: result.nextInject?.id ?? null },
        '[stress-drill] inject advanced',
      );
      sendSuccess(res, { drill: result.drill, nextInject: result.nextInject });
    } catch (err) {
      handleRouteError(res, err, 'Failed to advance drill');
    }
  },
);

// ─── Respond to Inject ────────────────────────────────────────────────────────

router.post(
  '/stress-drill/drills/:id/respond',
  authMiddleware({ required: true }),
  validateBody(respondSchema),
  (req: Request, res: Response) => {
    try {
      if (!req.user) { sendUnauthorized(res); return; }
      const drill = getDrill(req.params.id as string);
      if (!drill) { sendNotFound(res, 'Drill'); return; }
      if (drill.tenantId !== callerTenantId(req)) { sendNotFound(res, 'Drill'); return; }

      const body = req.body as z.infer<typeof respondSchema>;
      const updated = respondToInject(drill.id, body.injectId, {
        responseType: body.responseType,
        notes: body.notes,
        humanApprovalGiven: body.humanApprovalGiven,
        respondedByLabel: callerLabel(req),
      });

      if (!updated) {
        sendBadRequest(res, 'Inject not found or drill not running');
        return;
      }

      logger.info(
        { drillId: drill.id, injectId: body.injectId, responseType: body.responseType },
        '[stress-drill] inject response recorded',
      );
      sendSuccess(res, updated);
    } catch (err) {
      handleRouteError(res, err, 'Failed to record response');
    }
  },
);

// ─── Complete Drill ───────────────────────────────────────────────────────────

router.post(
  '/stress-drill/drills/:id/complete',
  authMiddleware({ required: true }),
  (req: Request, res: Response) => {
    try {
      if (!req.user) { sendUnauthorized(res); return; }
      const drill = getDrill(req.params.id as string);
      if (!drill) { sendNotFound(res, 'Drill'); return; }
      if (drill.tenantId !== callerTenantId(req)) { sendNotFound(res, 'Drill'); return; }
      const updated = completeDrill(drill.id);
      if (!updated) {
        sendBadRequest(res, 'Drill cannot be completed in current state');
        return;
      }
      logger.info({ drillId: drill.id, score: updated.score?.overallScore }, '[stress-drill] drill completed');
      sendSuccess(res, updated);
    } catch (err) {
      handleRouteError(res, err, 'Failed to complete drill');
    }
  },
);

// ─── Abort Drill ──────────────────────────────────────────────────────────────

router.post(
  '/stress-drill/drills/:id/abort',
  authMiddleware({ required: true }),
  (req: Request, res: Response) => {
    try {
      if (!req.user) { sendUnauthorized(res); return; }
      const drill = getDrill(req.params.id as string);
      if (!drill) { sendNotFound(res, 'Drill'); return; }
      if (drill.tenantId !== callerTenantId(req)) { sendNotFound(res, 'Drill'); return; }
      const updated = abortDrill(drill.id);
      if (!updated) {
        sendBadRequest(res, 'Drill cannot be aborted');
        return;
      }
      logger.info({ drillId: drill.id }, '[stress-drill] drill aborted');
      sendSuccess(res, updated);
    } catch (err) {
      handleRouteError(res, err, 'Failed to abort drill');
    }
  },
);

// ─── Debrief ──────────────────────────────────────────────────────────────────

router.get(
  '/stress-drill/drills/:id/debrief',
  authMiddleware({ required: true }),
  (req: Request, res: Response) => {
    try {
      if (!req.user) { sendUnauthorized(res); return; }
      const drill = getDrill(req.params.id as string);
      if (!drill) { sendNotFound(res, 'Drill'); return; }
      if (drill.tenantId !== callerTenantId(req)) { sendNotFound(res, 'Drill'); return; }
      if (drill.status !== 'completed') {
        sendBadRequest(res, 'Drill must be completed before viewing debrief');
        return;
      }

      const scenario = getScenario(drill.scenarioId);

      sendSuccess(res, {
        drill,
        scenario: scenario
          ? {
              id: scenario.id,
              name: scenario.name,
              tagline: scenario.tagline,
              icon: scenario.icon,
              accentColor: scenario.accentColor,
              summary: scenario.summary,
            }
          : null,
        score: drill.score,
        injectTimeline: drill.injectStatuses.map((s) => ({
          inject: {
            id: s.inject.id,
            t: s.inject.t,
            domain: s.inject.domain,
            severity: s.inject.severity,
            title: s.inject.title,
            expectedResponse: s.inject.expectedResponse,
            runbookRef: s.inject.runbookRef,
            requiresHumanApproval: s.inject.requiresHumanApproval,
          },
          firedAt: s.firedAt,
          response: s.response,
        })),
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to load debrief');
    }
  },
);

// ─── PDF Debrief Export ───────────────────────────────────────────────────────

router.get(
  '/stress-drill/drills/:id/debrief/pdf',
  authMiddleware({ required: true }),
  (req: Request, res: Response) => {
    try {
      if (!req.user) { sendUnauthorized(res); return; }
      const drill = getDrill(req.params.id as string);
      if (!drill) { sendNotFound(res, 'Drill'); return; }
      if (drill.tenantId !== callerTenantId(req)) { sendNotFound(res, 'Drill'); return; }
      if (drill.status !== 'completed') {
        sendBadRequest(res, 'Drill must be completed before exporting debrief');
        return;
      }

      const scenario = getScenario(drill.scenarioId);
      const score = drill.score!;

      const stream = buildDebriefPdf({
        drillId: drill.id,
        operatorLabel: drill.operatorLabel,
        scenarioName: scenario?.name ?? drill.scenarioId,
        scenarioTagline: scenario?.tagline ?? '',
        grade: score.grade,
        overallScore: score.overallScore,
        verdict: score.verdict,
        totalInjects: score.totalInjects,
        detected: score.detected,
        resolved: score.resolved,
        missed: score.missed,
        avgDetectMinutes: score.avgDetectMinutes,
        avgResolveMinutes: score.avgResolveMinutes,
        humanApprovalsGiven: score.humanApprovalsGiven,
        humanApprovalsRequired: score.humanApprovalsRequired,
        completedAt: score.completedAt,
        domainBreakdown: score.domainBreakdown,
        missedSteps: score.missedSteps,
        recommendations: score.recommendations,
        timeline: drill.injectStatuses.map((s) => ({
          severity: s.inject.severity,
          domain: s.inject.domain,
          title: s.inject.title,
          runbookRef: s.inject.runbookRef,
          firedAt: s.firedAt,
          responseType: s.response?.responseType ?? null,
          notes: s.response?.notes ?? null,
        })),
      });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="debrief-${drill.id}-${drill.scenarioId}.pdf"`,
      );
      stream.pipe(res);
    } catch (err) {
      handleRouteError(res, err, 'Failed to export debrief');
    }
  },
);

export default router;
