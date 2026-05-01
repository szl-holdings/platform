/**
 * Crisis Arena — Sentra crowdsourced business-crisis simulation
 *
 * Public endpoints (no auth, rate-limited):
 *   GET  /crisis-arena/leaderboard          — global top architects + stats
 *   GET  /crisis-arena/architects/:id/public — public architect profile
 *   GET  /crisis-arena/summary              — aggregate stats
 *
 * Authenticated endpoints:
 *   GET    /crisis-arena/engagements                     — list engagements (tenant-scoped)
 *   POST   /crisis-arena/engagements                     — create engagement
 *   GET    /crisis-arena/engagements/:id                 — get engagement (tenant-scoped)
 *   POST   /crisis-arena/engagements/:id/submissions     — submit scenario
 *   GET    /crisis-arena/engagements/:id/submissions     — list submissions (tenant-scoped)
 *   POST   /crisis-arena/submissions/:id/triage          — triage (engagement owner only)
 *   POST   /crisis-arena/submissions/:id/award           — award payout (engagement owner only)
 *   POST   /crisis-arena/submissions/:id/graduate        — graduate to tabletop (engagement owner only)
 *   GET    /crisis-arena/submissions/mine                — my submissions (architect view)
 *   POST   /crisis-arena/score                           — compute business impact score
 */

import { randomUUID } from 'node:crypto';
import { type IRouter, type Request, type Response, Router, type RequestHandler } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import {
  handleRouteError,
  sendBadRequest,
  sendCreated,
  sendForbidden,
  sendNotFound,
  sendSuccess,
  sendUnauthorized,
} from '../lib/api-response';
import { validateBody } from '../lib/validation';
import { authMiddleware } from '../middlewares/auth';
import { logger } from '../lib/logger';
import {
  type Engagement,
  type Submission,
  type ThreatArchetype,
  appendArenaAuditEvent,
  computeBusinessImpactScore,
  computeReputationDelta,
  getArchitectProfile,
  getArchitectProfileByHandle,
  getEngagement,
  getSubmission,
  insertEngagement,
  insertReputationEvent,
  insertSubmission,
  insertTriageEvent,
  listEngagements,
  listPublicProfiles,
  listReputationEvents,
  listSubmissionsByArchitect,
  listSubmissionsByEngagement,
  updateArchitectStats,
  updateEngagement,
  updateSubmission,
  upsertArchitectProfile,
} from '../services/crisis-arena-store';
import { db, sentraIncidentsTable } from '@szl-holdings/db';

const router: IRouter = Router();

const isProduction = process.env.NODE_ENV === 'production';

const publicLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: isProduction ? 60 : 600,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again later.' },
}) as unknown as RequestHandler;

// ─── Schemas ──────────────────────────────────────────────────────────────────

const archetypeEnum = z.enum([
  'ransomware',
  'insider',
  'supply_chain',
  'regulatory',
  'cascade',
  'black_swan',
]);

const createEngagementSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(10).max(2000),
  scopedAssets: z.array(z.string()).min(1).max(20),
  scopedDomains: z.array(z.string()).min(1).max(10),
  archetypeFilter: z.array(archetypeEnum).min(1),
  payoutPool: z.number().nonnegative().max(1_000_000),
  deadline: z.string().datetime(),
});

const killChainStepSchema = z.object({
  phase: z.string().min(1).max(100),
  technique: z.string().min(1).max(200),
  description: z.string().min(1).max(500),
});

const impactEstimateSchema = z.object({
  revenueAtRiskUsd: z.number().nonnegative(),
  rtoBreach: z.number().nonnegative(),
  rpoBreach: z.number().nonnegative(),
  regulatoryExposureUsd: z.number().nonnegative(),
  blastRadiusDomains: z.array(z.string()),
});

const createSubmissionSchema = z.object({
  title: z.string().min(3).max(200),
  narrative: z.string().min(20).max(5000),
  killChain: z.array(killChainStepSchema).min(1).max(20),
  impactEstimate: impactEstimateSchema,
  evidenceNotes: z.string().max(2000).default(''),
  archetype: archetypeEnum,
});

const triageSchema = z.object({
  action: z.enum(['accept', 'reject', 'duplicate', 'out_of_scope']),
  justification: z.string().min(3).max(1000),
});

const awardSchema = z.object({
  payoutAmount: z.number().nonnegative().max(1_000_000),
  note: z.string().max(500).optional(),
});

const scoreSchema = z.object({
  impactEstimate: impactEstimateSchema,
  archetype: archetypeEnum,
});

// ─── Auth helpers ─────────────────────────────────────────────────────────────

function callerUserId(req: Request): number {
  return (req.user as { id?: number } | undefined)?.id ?? 0;
}

function callerTenantId(req: Request): string {
  const orgId = (req.user as { orgs?: Array<{ orgId?: number }> } | undefined)?.orgs?.[0]?.orgId;
  return orgId ? String(orgId) : 'tenant-demo';
}

function callerArchitectId(req: Request): string {
  return `user-${String(callerUserId(req))}`;
}

function callerEmail(req: Request): string {
  return (req.user as { email?: string } | undefined)?.email ?? 'operator';
}

// ─── Public endpoints ──────────────────────────────────────────────────────────

// GET /crisis-arena/leaderboard — no auth, rate-limited
router.get('/crisis-arena/leaderboard', publicLimiter, async (_req: Request, res: Response) => {
  try {
    const profiles = await listPublicProfiles();

    const totalImpactUsd = profiles.reduce((sum, p) => sum + p.totalImpactUsd, 0);
    const totalAccepted = profiles.reduce((sum, p) => sum + p.acceptedCount, 0);

    const leaderboard = profiles.map((p, idx) => ({
      rank: idx + 1,
      id: p.id,
      handle: p.handle,
      displayName: p.displayName,
      reputationScore: p.reputationScore,
      acceptedCount: p.acceptedCount,
      submissionCount: p.submissionCount,
      totalImpactUsd: p.totalImpactUsd,
      badges: p.badges,
      topScenarioTitles: p.topScenarioTitles,
    }));

    const archetypeSpecialists: Record<string, { handle: string; count: number }> = {};
    for (const p of profiles) {
      for (const stat of p.archetypeStats) {
        const key = stat.archetype;
        const current = archetypeSpecialists[key];
        if (!current || stat.count > current.count) {
          archetypeSpecialists[key] = { handle: p.handle, count: stat.count };
        }
      }
    }

    // Monthly movers: architects with highest reputation gain in the last 30 days
    const since30d = new Date(Date.now() - 30 * 86_400_000);
    const recentEvents = await listReputationEvents(since30d);
    const repGain30d: Record<string, number> = {};
    for (const ev of recentEvents) {
      if (ev.delta > 0) {
        repGain30d[ev.architectId] = (repGain30d[ev.architectId] ?? 0) + ev.delta;
      }
    }
    const monthlyMovers = await Promise.all(
      Object.entries(repGain30d)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(async ([architectId, gain]) => {
          const p = await getArchitectProfile(architectId);
          return { architectId, handle: p?.handle ?? '—', gain };
        }),
    );

    sendSuccess(res, {
      leaderboard,
      monthlyMovers,
      totalImpactUsd,
      totalAccepted,
      totalArchitects: profiles.length,
      archetypeSpecialists,
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleRouteError(res, err, 'Failed to load leaderboard');
  }
});

// GET /crisis-arena/architects/:id/public — no auth, rate-limited
router.get(
  '/crisis-arena/architects/:id/public',
  publicLimiter,
  async (req: Request, res: Response) => {
    try {
      const profile = await getArchitectProfile(req.params.id as string);
      if (!profile || !profile.isPublic) {
        sendNotFound(res, 'Architect profile');
        return;
      }

      const mySubmissions = (await listSubmissionsByArchitect(profile.id)).filter((s) =>
        ['accepted', 'graduated'].includes(s.status),
      );

      const sanitizedHighlights = mySubmissions
        .sort((a, b) => b.businessImpactScore - a.businessImpactScore)
        .slice(0, 5)
        .map((s) => ({
          title: s.title,
          archetype: s.archetype,
          businessImpactScore: s.businessImpactScore,
          blastRadius: s.impactEstimate.blastRadiusDomains,
          acceptedAt: s.updatedAt,
        }));

      sendSuccess(res, {
        ...profile,
        highlightedSubmissions: sanitizedHighlights,
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to load architect profile');
    }
  },
);

// ─── Engagement endpoints ──────────────────────────────────────────────────────

// GET /crisis-arena/engagements — list tenant-scoped engagements
router.get(
  '/crisis-arena/engagements',
  authMiddleware({ required: true }),
  async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        sendUnauthorized(res);
        return;
      }
      const tenantId = callerTenantId(req);
      const engagements = await listEngagements(tenantId);
      sendSuccess(res, { engagements });
    } catch (err) {
      handleRouteError(res, err, 'Failed to list engagements');
    }
  },
);

// POST /crisis-arena/engagements — create engagement
router.post(
  '/crisis-arena/engagements',
  authMiddleware({ required: true }),
  validateBody(createEngagementSchema),
  async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        sendUnauthorized(res);
        return;
      }
      const body = req.body as z.infer<typeof createEngagementSchema>;
      const id = `eng-${randomUUID().slice(0, 8)}`;
      const now = new Date().toISOString();
      const userId = callerUserId(req);
      const tenantId = callerTenantId(req);

      const engagement: Engagement = {
        id,
        tenantId,
        ownerId: userId,
        title: body.title,
        description: body.description,
        scopedAssets: body.scopedAssets,
        scopedDomains: body.scopedDomains,
        archetypeFilter: body.archetypeFilter as ThreatArchetype[],
        payoutPool: body.payoutPool,
        deadline: body.deadline,
        status: 'accepting',
        createdAt: now,
        updatedAt: now,
        submissionCount: 0,
        acceptedCount: 0,
      };

      await insertEngagement(engagement);
      await appendArenaAuditEvent({
        eventType: 'engagement.created',
        entityId: id,
        entityType: 'arena_engagement',
        actor: callerEmail(req),
        payload: { title: body.title, tenantId, payoutPool: body.payoutPool },
      });

      logger.info({ id, title: body.title }, '[crisis-arena] engagement created');
      sendCreated(res, engagement);
    } catch (err) {
      handleRouteError(res, err, 'Failed to create engagement');
    }
  },
);

// GET /crisis-arena/engagements/:id — tenant-scoped
router.get(
  '/crisis-arena/engagements/:id',
  authMiddleware({ required: true }),
  async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        sendUnauthorized(res);
        return;
      }
      const eng = await getEngagement(req.params.id as string);
      if (!eng) {
        sendNotFound(res, 'Engagement');
        return;
      }
      // Tenant scoping: caller must belong to the engagement's tenant or be owner
      const userTenant = callerTenantId(req);
      const userId = callerUserId(req);
      const isAdmin =
        (req.user as { roles?: string[] } | undefined)?.roles?.some((r) =>
          ['admin', 'super_admin'].includes(r),
        ) ?? false;
      if (!isAdmin && eng.tenantId !== userTenant && eng.ownerId !== userId) {
        sendForbidden(res, 'You do not have access to this engagement');
        return;
      }
      const submissions = await listSubmissionsByEngagement(eng.id);
      sendSuccess(res, { ...eng, submissions });
    } catch (err) {
      handleRouteError(res, err, 'Failed to get engagement');
    }
  },
);

// POST /crisis-arena/engagements/:id/submissions — submit scenario
router.post(
  '/crisis-arena/engagements/:id/submissions',
  authMiddleware({ required: true }),
  validateBody(createSubmissionSchema),
  async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        sendUnauthorized(res);
        return;
      }
      const eng = await getEngagement(req.params.id as string);
      if (!eng) {
        sendNotFound(res, 'Engagement');
        return;
      }
      if (eng.status === 'closed' || eng.status === 'archived') {
        sendBadRequest(res, 'Engagement is not accepting submissions');
        return;
      }

      const body = req.body as z.infer<typeof createSubmissionSchema>;
      const architectId = callerArchitectId(req);
      const id = `sub-${randomUUID().slice(0, 8)}`;
      const now = new Date().toISOString();

      const score = computeBusinessImpactScore(
        body.impactEstimate,
        body.archetype as ThreatArchetype,
      );

      const submission: Submission = {
        id,
        engagementId: eng.id,
        architectId,
        title: body.title,
        narrative: body.narrative,
        killChain: body.killChain,
        impactEstimate: body.impactEstimate,
        evidenceNotes: body.evidenceNotes,
        archetype: body.archetype as ThreatArchetype,
        status: 'pending',
        businessImpactScore: score,
        reputationAwarded: 0,
        payoutAwarded: 0,
        submittedAt: now,
        updatedAt: now,
      };

      await insertSubmission(submission);
      await updateEngagement(eng.id, { submissionCount: eng.submissionCount + 1 });

      // Ensure architect profile exists
      const existing = await getArchitectProfile(architectId);
      if (!existing) {
        await upsertArchitectProfile({
          id: architectId,
          handle: `user-${callerUserId(req)}`,
          displayName: callerEmail(req),
          bio: '',
          reputationScore: 0,
          acceptedCount: 0,
          submissionCount: 0,
          totalImpactUsd: 0,
          badges: [],
          archetypeStats: [],
          joinedAt: now,
          topScenarioTitles: [],
          isPublic: true,
        });
      }
      await updateArchitectStats(architectId);

      await appendArenaAuditEvent({
        eventType: 'submission.created',
        entityId: id,
        entityType: 'arena_submission',
        actor: callerEmail(req),
        payload: { engagementId: eng.id, architectId, score, archetype: body.archetype },
      });

      logger.info({ id, engagementId: eng.id, score }, '[crisis-arena] submission created');
      sendCreated(res, submission);
    } catch (err) {
      handleRouteError(res, err, 'Failed to create submission');
    }
  },
);

// GET /crisis-arena/engagements/:id/submissions — list submissions (tenant-scoped)
router.get(
  '/crisis-arena/engagements/:id/submissions',
  authMiddleware({ required: true }),
  async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        sendUnauthorized(res);
        return;
      }
      const eng = await getEngagement(req.params.id as string);
      if (!eng) {
        sendNotFound(res, 'Engagement');
        return;
      }
      const userTenant = callerTenantId(req);
      const userId = callerUserId(req);
      const isAdmin =
        (req.user as { roles?: string[] } | undefined)?.roles?.some((r) =>
          ['admin', 'super_admin'].includes(r),
        ) ?? false;
      if (!isAdmin && eng.tenantId !== userTenant && eng.ownerId !== userId) {
        sendForbidden(res, 'You do not have access to this engagement');
        return;
      }
      const submissions = await listSubmissionsByEngagement(eng.id);
      sendSuccess(res, { submissions });
    } catch (err) {
      handleRouteError(res, err, 'Failed to list submissions');
    }
  },
);

// GET /crisis-arena/submissions/mine — architect view (own submissions only)
router.get(
  '/crisis-arena/submissions/mine',
  authMiddleware({ required: true }),
  async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        sendUnauthorized(res);
        return;
      }
      const architectId = callerArchitectId(req);
      const submissions = await listSubmissionsByArchitect(architectId);
      sendSuccess(res, { submissions });
    } catch (err) {
      handleRouteError(res, err, 'Failed to get my submissions');
    }
  },
);

// ─── Triage / Award / Graduate ─────────────────────────────────────────────────

// POST /crisis-arena/submissions/:id/triage
router.post(
  '/crisis-arena/submissions/:id/triage',
  authMiddleware({ required: true }),
  validateBody(triageSchema),
  async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        sendUnauthorized(res);
        return;
      }
      const sub = await getSubmission(req.params.id as string);
      if (!sub) {
        sendNotFound(res, 'Submission');
        return;
      }
      // Ownership check: only the engagement owner may triage
      const eng = await getEngagement(sub.engagementId);
      const requesterId = callerUserId(req);
      if (!eng || (eng.ownerId !== 0 && eng.ownerId !== requesterId)) {
        sendForbidden(res, 'Only the engagement owner may triage submissions');
        return;
      }
      if (sub.status !== 'pending') {
        sendBadRequest(res, 'Submission has already been triaged');
        return;
      }

      const body = req.body as z.infer<typeof triageSchema>;
      const actor = callerEmail(req);
      const now = new Date().toISOString();

      const statusMap: Record<string, Submission['status']> = {
        accept: 'accepted',
        reject: 'rejected',
        duplicate: 'duplicate',
        out_of_scope: 'out_of_scope',
      };
      const newStatus = statusMap[body.action] as Submission['status'];

      const reputationDelta = computeReputationDelta(sub.businessImpactScore, body.action);
      await updateSubmission(sub.id, {
        status: newStatus,
        triageJustification: body.justification,
        reputationAwarded: reputationDelta > 0 ? reputationDelta : 0,
        updatedAt: now,
      });

      if (newStatus === 'accepted') {
        await updateEngagement(eng.id, { acceptedCount: eng.acceptedCount + 1 });
      }

      await insertTriageEvent({
        id: randomUUID(),
        submissionId: sub.id,
        engagementId: sub.engagementId,
        action: body.action,
        actor,
        justification: body.justification,
        timestamp: now,
      });

      if (reputationDelta !== 0) {
        await insertReputationEvent({
          architectId: sub.architectId,
          submissionId: sub.id,
          delta: reputationDelta,
          reason: `${body.action} — BIS ${sub.businessImpactScore}`,
          createdAt: now,
        });
        // Update architect reputation score
        const profile = await getArchitectProfile(sub.architectId);
        if (profile) {
          await upsertArchitectProfile({
            ...profile,
            reputationScore: Math.max(0, profile.reputationScore + reputationDelta),
          });
        }
      }

      await updateArchitectStats(sub.architectId);

      await appendArenaAuditEvent({
        eventType: `submission.${body.action}`,
        entityId: sub.id,
        entityType: 'arena_submission',
        actor,
        payload: {
          engagementId: sub.engagementId,
          architectId: sub.architectId,
          action: body.action,
          justification: body.justification,
          reputationDelta,
        },
      });

      const updated = await getSubmission(sub.id);
      logger.info({ id: sub.id, action: body.action }, '[crisis-arena] submission triaged');
      sendSuccess(res, updated ?? sub);
    } catch (err) {
      handleRouteError(res, err, 'Failed to triage submission');
    }
  },
);

// POST /crisis-arena/submissions/:id/award
router.post(
  '/crisis-arena/submissions/:id/award',
  authMiddleware({ required: true }),
  validateBody(awardSchema),
  async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        sendUnauthorized(res);
        return;
      }
      const sub = await getSubmission(req.params.id as string);
      if (!sub) {
        sendNotFound(res, 'Submission');
        return;
      }
      // Ownership check
      const eng = await getEngagement(sub.engagementId);
      const requesterId = callerUserId(req);
      if (!eng || (eng.ownerId !== 0 && eng.ownerId !== requesterId)) {
        sendForbidden(res, 'Only the engagement owner may award payouts');
        return;
      }
      if (!['accepted', 'graduated'].includes(sub.status)) {
        sendBadRequest(res, 'Can only award accepted or graduated submissions');
        return;
      }

      const body = req.body as z.infer<typeof awardSchema>;
      const actor = callerEmail(req);
      const now = new Date().toISOString();

      await updateSubmission(sub.id, { payoutAwarded: body.payoutAmount, updatedAt: now });
      await insertTriageEvent({
        id: randomUUID(),
        submissionId: sub.id,
        engagementId: sub.engagementId,
        action: 'award',
        actor,
        justification: body.note ?? 'Payout awarded',
        payoutAmount: body.payoutAmount,
        timestamp: now,
      });

      await appendArenaAuditEvent({
        eventType: 'submission.awarded',
        entityId: sub.id,
        entityType: 'arena_submission',
        actor,
        payload: { payoutAmount: body.payoutAmount, note: body.note },
      });

      const updated = await getSubmission(sub.id);
      logger.info({ id: sub.id, amount: body.payoutAmount }, '[crisis-arena] payout recorded');
      sendSuccess(res, updated ?? sub);
    } catch (err) {
      handleRouteError(res, err, 'Failed to award payout');
    }
  },
);

// POST /crisis-arena/submissions/:id/graduate
router.post(
  '/crisis-arena/submissions/:id/graduate',
  authMiddleware({ required: true }),
  async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        sendUnauthorized(res);
        return;
      }
      const sub = await getSubmission(req.params.id as string);
      if (!sub) {
        sendNotFound(res, 'Submission');
        return;
      }
      // Ownership check
      const eng = await getEngagement(sub.engagementId);
      const requesterId = callerUserId(req);
      if (!eng || (eng.ownerId !== 0 && eng.ownerId !== requesterId)) {
        sendForbidden(res, 'Only the engagement owner may graduate submissions');
        return;
      }
      if (sub.status !== 'accepted') {
        sendBadRequest(res, 'Only accepted submissions can be graduated');
        return;
      }

      const actor = callerEmail(req);
      const now = new Date().toISOString();

      const incidentId = `INC-${new Date().getFullYear()}-ARENA-${sub.id.slice(-4).toUpperCase()}`;
      const nowDate = new Date(now);
      await db
        .insert(sentraIncidentsTable)
        .values({
          id: incidentId,
          title: `[Crisis Arena] ${sub.title}`,
          description: `${sub.narrative}\n\n--- Kill Chain ---\n${sub.killChain.map((s) => `${s.phase}: ${s.technique} — ${s.description}`).join('\n')}`,
          severity:
            sub.businessImpactScore >= 80
              ? 'critical'
              : sub.businessImpactScore >= 60
                ? 'high'
                : 'medium',
          status: 'open',
          mitreStage: sub.killChain[0]?.phase ?? 'Initial Access',
          detectedAt: nowDate,
          updatedAt: nowDate,
          affectedAssets: [],
          tags: ['crisis-arena', sub.archetype],
          timeline: [
            {
              id: randomUUID(),
              type: 'system',
              message: `Tabletop exercise graduated from Crisis Arena submission ${sub.id} (BIS: ${sub.businessImpactScore})`,
              actor: 'Crisis Arena',
              timestamp: now,
            },
          ],
        })
        .onConflictDoNothing();

      await updateSubmission(sub.id, {
        status: 'graduated',
        graduatedIncidentId: incidentId,
        updatedAt: now,
      });
      await insertTriageEvent({
        id: randomUUID(),
        submissionId: sub.id,
        engagementId: sub.engagementId,
        action: 'graduate',
        actor,
        justification: `Graduated to tabletop exercise ${incidentId}`,
        timestamp: now,
      });

      await appendArenaAuditEvent({
        eventType: 'submission.graduated',
        entityId: sub.id,
        entityType: 'arena_submission',
        actor,
        payload: { incidentId, architectId: sub.architectId, score: sub.businessImpactScore },
      });

      logger.info({ id: sub.id, incidentId }, '[crisis-arena] submission graduated to tabletop');
      sendSuccess(res, {
        submission: { ...sub, status: 'graduated', graduatedIncidentId: incidentId },
        incidentId,
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to graduate submission');
    }
  },
);

// ─── Scoring endpoint ─────────────────────────────────────────────────────────

// POST /crisis-arena/score
router.post(
  '/crisis-arena/score',
  authMiddleware({ required: false }),
  validateBody(scoreSchema),
  async (req: Request, res: Response) => {
    try {
      const body = req.body as z.infer<typeof scoreSchema>;
      const score = computeBusinessImpactScore(
        body.impactEstimate,
        body.archetype as ThreatArchetype,
      );

      const breakdown = {
        revenueComponent: Math.min(40, (body.impactEstimate.revenueAtRiskUsd / 1_000_000) * 4),
        rtoComponent: Math.min(20, (body.impactEstimate.rtoBreach / 60) * 2),
        rpoComponent: Math.min(15, (body.impactEstimate.rpoBreach / 60) * 1.5),
        regulatoryComponent: Math.min(
          15,
          (body.impactEstimate.regulatoryExposureUsd / 500_000) * 3.75,
        ),
        blastRadiusComponent: Math.min(10, body.impactEstimate.blastRadiusDomains.length * 2.5),
      };

      // Record every scoring computation in the canonical Proof Chain for audit
      await appendArenaAuditEvent({
        eventType: 'score.computed',
        entityId: `score-${Date.now()}`,
        entityType: 'arena_bis_score',
        actor: callerEmail(req) ?? 'anonymous',
        payload: {
          score,
          archetype: body.archetype,
          breakdown,
          impactEstimate: body.impactEstimate,
        },
      });

      sendSuccess(res, {
        businessImpactScore: score,
        breakdown,
        archetype: body.archetype,
        tier: score >= 80 ? 'critical' : score >= 60 ? 'high' : score >= 40 ? 'medium' : 'low',
        estimatedReputation: computeReputationDelta(score, 'accept'),
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to compute score');
    }
  },
);

// ─── Arena summary ─────────────────────────────────────────────────────────────

// GET /crisis-arena/summary
router.get('/crisis-arena/summary', publicLimiter, async (_req: Request, res: Response) => {
  try {
    const profiles = await listPublicProfiles();
    const allEngagements = await listEngagements();
    const openEngagements = allEngagements.filter((e) => ['open', 'accepting'].includes(e.status));
    const totalImpactUsd = profiles.reduce((sum, p) => sum + p.totalImpactUsd, 0);
    const totalAccepted = profiles.reduce((sum, p) => sum + p.acceptedCount, 0);
    const topProfile = profiles[0];

    sendSuccess(res, {
      totalArchitects: profiles.length,
      totalImpactUsd,
      totalAccepted,
      openEngagements: openEngagements.length,
      pendingSubmissions: 0,
      topArchitect: topProfile?.handle ?? null,
    });
  } catch (err) {
    handleRouteError(res, err, 'Failed to get summary');
  }
});

export default router;
