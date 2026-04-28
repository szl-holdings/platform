/**
 * Eval Registry API Routes
 *
 * Open Evaluation Layer — central registry for benchmarks, results,
 * verification tokens, and community PR submissions.
 *
 * Endpoints:
 *   GET  /eval-registry/benchmarks                         — list benchmarks
 *   GET  /eval-registry/benchmarks/:benchmarkId            — get benchmark
 *   GET  /eval-registry/benchmarks/:benchmarkId/leaderboard — leaderboard for benchmark×task
 *   GET  /eval-registry/benchmarks/:benchmarkId/results    — all results for a benchmark
 *   GET  /eval-registry/entities/:entityId/results         — results for an entity
 *   GET  /eval-registry/results/:resultId                  — get single result
 *   POST /eval-registry/results                            — submit a result (or batch)
 *   POST /eval-registry/results/:resultId/verify           — request sandboxed re-run
 *   GET  /eval-registry/submissions                        — list community PR submissions
 *   POST /eval-registry/submissions                        — open a community PR
 *   PATCH /eval-registry/submissions/:id/accept            — accept PR (admin)
 *   PATCH /eval-registry/submissions/:id/reject            — reject PR (admin)
 *   GET  /eval-registry/benchmarks/:benchmarkId/tasks      — list tasks in a benchmark
 */

import { evalRegistryRepository } from '@szl-holdings/db-repository/eval-registry';
import {
  EVAL_BADGE_STATE_ENUM,
  EvalResultsYamlSchema,
  EvalSubmissionRequestSchema,
  EvalVerificationRequestSchema,
} from '@szl-holdings/shared-contracts/eval-types';
import { type IRouter, type Request, type Response, Router } from 'express';
import { handleRouteError, sendCreated, sendSuccess } from '../lib/api-response';
import { runEvalVerification } from '../lib/eval-engine.js';
import { authMiddleware } from '../middlewares/auth';

const router: IRouter = Router();

// ─── Benchmarks ───────────────────────────────────────────────────────────────

/**
 * GET /eval-registry/benchmarks
 * List all benchmarks visible to the caller.
 */
router.get('/eval-registry/benchmarks', authMiddleware(), async (req: Request, res: Response) => {
  try {
    const domain = req.query.domain ? String(req.query.domain) : undefined;
    const isCrossCutting =
      req.query.cross_cutting !== undefined
        ? req.query.cross_cutting === 'true'
        : undefined;
    const orgId = (req as unknown as { orgId?: number }).orgId ?? null;

    const benchmarks = await evalRegistryRepository.listBenchmarks({
      domain,
      isCrossCutting,
      orgId,
      limit: 200,
    });
    sendSuccess(res, { benchmarks, total: benchmarks.length });
  } catch (err) {
    handleRouteError(res, err, 'Failed to list benchmarks');
  }
});

/**
 * GET /eval-registry/benchmarks/:benchmarkId
 * Get a single benchmark by its stable id.
 */
router.get(
  '/eval-registry/benchmarks/:benchmarkId',
  authMiddleware(),
  async (req: Request, res: Response) => {
    try {
      const { benchmarkId } = req.params;
      const orgId = (req as unknown as { orgId?: number }).orgId ?? null;
      const benchmark = await evalRegistryRepository.findBenchmarkByBenchmarkId(
        benchmarkId,
        orgId,
      );
      if (!benchmark) {
        res.status(404).json({ error: 'Benchmark not found', benchmarkId });
        return;
      }
      sendSuccess(res, { benchmark });
    } catch (err) {
      handleRouteError(res, err, 'Failed to get benchmark');
    }
  },
);

/**
 * GET /eval-registry/benchmarks/:benchmarkId/tasks
 * List tasks defined within a benchmark.
 */
router.get(
  '/eval-registry/benchmarks/:benchmarkId/tasks',
  authMiddleware(),
  async (req: Request, res: Response) => {
    try {
      const { benchmarkId } = req.params;
      const orgId = (req as unknown as { orgId?: number }).orgId ?? null;
      const benchmark = await evalRegistryRepository.findBenchmarkByBenchmarkId(
        benchmarkId,
        orgId,
      );
      if (!benchmark) {
        res.status(404).json({ error: 'Benchmark not found', benchmarkId });
        return;
      }
      const tasks = (benchmark.tasks ?? []) as unknown[];
      sendSuccess(res, { benchmarkId, tasks, total: tasks.length });
    } catch (err) {
      handleRouteError(res, err, 'Failed to get benchmark tasks');
    }
  },
);

/**
 * GET /eval-registry/benchmarks/:benchmarkId/leaderboard
 * Returns ranked leaderboard entries for a benchmark×task combination.
 */
router.get(
  '/eval-registry/benchmarks/:benchmarkId/leaderboard',
  authMiddleware(),
  async (req: Request, res: Response) => {
    try {
      const { benchmarkId } = req.params;
      const taskId = req.query.task_id ? String(req.query.task_id) : undefined;
      const higherIsBetter = req.query.higher_is_better !== 'false';
      const limitRaw = Number(req.query.limit ?? 50);
      const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(limitRaw, 200) : 50;
      const orgId = (req as unknown as { orgId?: number }).orgId ?? null;
      const badgeStatesRaw = req.query.badge_states
        ? String(req.query.badge_states).split(',')
        : undefined;
      const badgeStates = badgeStatesRaw?.filter((s) =>
        (EVAL_BADGE_STATE_ENUM as readonly string[]).includes(s),
      );

      if (badgeStatesRaw !== undefined && (badgeStates?.length ?? 0) === 0) {
        res.status(400).json({
          error: 'badge_states contains no valid values',
          valid: EVAL_BADGE_STATE_ENUM,
        });
        return;
      }

      if (!taskId) {
        // Return per-task leaderboard summaries when no taskId specified
        const benchmark = await evalRegistryRepository.findBenchmarkByBenchmarkId(
          benchmarkId,
          orgId,
        );
        if (!benchmark) {
          res.status(404).json({ error: 'Benchmark not found', benchmarkId });
          return;
        }
        const tasks = (benchmark.tasks ?? []) as Array<{
          taskId: string;
          higherIsBetter?: boolean;
        }>;
        const leaderboards = await Promise.all(
          tasks.map((task) =>
            evalRegistryRepository.leaderboard({
              benchmarkId,
              taskId: task.taskId,
              orgId,
              higherIsBetter: task.higherIsBetter ?? true,
              limit: 10,
              badgeStates,
            }),
          ),
        );
        const result = tasks.map((task, i) => ({ task, entries: leaderboards[i] }));
        sendSuccess(res, { benchmarkId, leaderboards: result });
        return;
      }

      const entries = await evalRegistryRepository.leaderboard({
        benchmarkId,
        taskId,
        orgId,
        higherIsBetter,
        limit,
        badgeStates,
      });
      sendSuccess(res, {
        benchmarkId,
        taskId,
        total: entries.length,
        entries,
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to get leaderboard');
    }
  },
);

// ─── Results ──────────────────────────────────────────────────────────────────

/**
 * GET /eval-registry/benchmarks/:benchmarkId/results
 * List all results stored for a benchmark, with optional filters for task,
 * badge state, and org. Scoped to the caller's org for non-platform admins.
 */
router.get(
  '/eval-registry/benchmarks/:benchmarkId/results',
  authMiddleware(),
  async (req: Request, res: Response) => {
    try {
      const { benchmarkId } = req.params;
      const taskId = req.query.task_id ? String(req.query.task_id) : undefined;
      const badgeState = req.query.badge_state ? String(req.query.badge_state) : undefined;
      const limitRaw = Number(req.query.limit ?? 200);
      const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(limitRaw, 500) : 200;

      if (badgeState && !(EVAL_BADGE_STATE_ENUM as readonly string[]).includes(badgeState)) {
        res.status(400).json({ error: 'Invalid badge_state', valid: EVAL_BADGE_STATE_ENUM });
        return;
      }

      const user = (req as unknown as { user?: { roles?: string[] } }).user;
      const isPlatformAdmin =
        user?.roles?.includes('super_admin') || user?.roles?.includes('platform_admin');
      const orgId = (req as unknown as { orgId?: number }).orgId ?? null;

      const results = await evalRegistryRepository.listResultsForBenchmark({
        benchmarkId,
        taskId,
        orgId: isPlatformAdmin ? undefined : orgId,
        badgeState,
        limit,
      });

      sendSuccess(res, { benchmarkId, total: results.length, results });
    } catch (err) {
      handleRouteError(res, err, 'Failed to list benchmark results');
    }
  },
);

/**
 * GET /eval-registry/entities/:entityId/results
 * List all results for an entity (agent, model, workflow, etc.).
 */
router.get(
  '/eval-registry/entities/:entityId/results',
  authMiddleware(),
  async (req: Request, res: Response) => {
    try {
      const { entityId } = req.params;
      const orgId = (req as unknown as { orgId?: number }).orgId ?? null;
      const badgeState = req.query.badge_state ? String(req.query.badge_state) : undefined;
      const limitRaw = Number(req.query.limit ?? 100);
      const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(limitRaw, 500) : 100;

      const results = await evalRegistryRepository.listResultsForEntity({
        entityId,
        orgId,
        badgeState,
        limit,
      });
      sendSuccess(res, { entityId, results, total: results.length });
    } catch (err) {
      handleRouteError(res, err, 'Failed to list results for entity');
    }
  },
);

/**
 * GET /eval-registry/results/:resultId
 * Get a single result by UUID.
 * Scoped to the caller's org — platform results (orgId=null) are visible to all.
 * Only super_admin and platform_admin bypass org scoping; org-level admin is still org-scoped.
 */
router.get(
  '/eval-registry/results/:resultId',
  authMiddleware(),
  async (req: Request, res: Response) => {
    try {
      const { resultId } = req.params;
      const user = (req as unknown as { user?: { roles?: string[] } }).user;
      const isPlatformAdmin =
        user?.roles?.includes('super_admin') || user?.roles?.includes('platform_admin');
      const orgId = (req as unknown as { orgId?: number }).orgId ?? null;

      const result = isPlatformAdmin
        ? await evalRegistryRepository.findResultById(resultId)
        : await evalRegistryRepository.findResultByIdForOrg(resultId, orgId);

      if (!result) {
        res.status(404).json({ error: 'Result not found', resultId });
        return;
      }
      sendSuccess(res, { result });
    } catch (err) {
      handleRouteError(res, err, 'Failed to get result');
    }
  },
);

/**
 * POST /eval-registry/results
 * Submit one or more eval results. Accepts the full eval_results.yaml payload.
 * Results are inserted with badge_state = 'community' by default.
 * If a verifyToken is provided, a verification job is queued immediately.
 */
router.post('/eval-registry/results', authMiddleware(), async (req: Request, res: Response) => {
  try {
    const parsed = EvalResultsYamlSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: 'Invalid eval_results payload',
        details: parsed.error.flatten(),
      });
      return;
    }

    const yaml = parsed.data;
    const orgId = (req as unknown as { orgId?: number }).orgId ?? null;
    const submittedBy =
      (req as unknown as { user?: { email?: string; id?: string } }).user?.email ?? 'api';

    // Fetch benchmark name for denormalization
    const benchmarkNames = new Map<string, string>();
    for (const entry of yaml.results) {
      if (!benchmarkNames.has(entry.datasetId)) {
        const bm = await evalRegistryRepository.findBenchmarkByBenchmarkId(entry.datasetId, orgId);
        benchmarkNames.set(entry.datasetId, bm?.name ?? entry.datasetId);
      }
    }

    const rows = yaml.results.map((entry) => ({
      benchmarkId: entry.datasetId,
      benchmarkName: benchmarkNames.get(entry.datasetId) ?? entry.datasetId,
      taskId: entry.taskId,
      entityId: yaml.entityId,
      entityLabel: yaml.entityLabel,
      entityType: yaml.entityType,
      domain: yaml.domain,
      metric: entry.metric,
      value: String(entry.value),
      unit: entry.unit ?? null,
      higherIsBetter: entry.higherIsBetter ?? true,
      numericValue: typeof entry.value === 'number' ? String(entry.value) : null,
      evaluationFramework: entry.evaluationFramework ?? null,
      badgeState: 'community' as const,
      verifyToken: entry.verifyToken ?? null,
      evalDate: entry.date ?? null,
      sourceUrl: entry.sourceUrl ?? null,
      notes: entry.notes ?? null,
      tags: entry.tags ?? [],
      rawYaml: yaml as unknown as Record<string, unknown>,
      submittedBy,
      orgId,
    }));

    const inserted = await evalRegistryRepository.insertResults(rows);

    // Queue verification for entries that include a verifyToken
    const toVerify = inserted.filter((r) => r.verifyToken);
    const verificationJobs = await Promise.allSettled(
      toVerify.map(async (r) => {
        try {
          await queueVerification(r.id, r.verifyToken!, orgId);
        } catch {
          // Non-blocking — verification is best-effort
        }
      }),
    );
    const verificationQueued = verificationJobs.filter((j) => j.status === 'fulfilled').length;

    sendCreated(res, {
      inserted: inserted.length,
      verificationQueued,
      results: inserted,
    });
  } catch (err) {
    handleRouteError(res, err, 'Failed to submit eval results');
  }
});

// ─── Verification ─────────────────────────────────────────────────────────────

/**
 * POST /eval-registry/results/:resultId/verify
 * Request a sandboxed re-run of a result to promote it from community → verified.
 */
router.post(
  '/eval-registry/results/:resultId/verify',
  authMiddleware(),
  async (req: Request, res: Response) => {
    try {
      const { resultId } = req.params;
      const user = (req as unknown as { user?: { roles?: string[] } }).user;
      // Only super_admin and platform_admin bypass org scoping; org-level admin is org-scoped.
      const isPlatformAdmin =
        user?.roles?.includes('super_admin') || user?.roles?.includes('platform_admin');
      const orgId = (req as unknown as { orgId?: number }).orgId ?? null;

      const result = isPlatformAdmin
        ? await evalRegistryRepository.findResultById(resultId)
        : await evalRegistryRepository.findResultByIdForOrg(resultId, orgId);

      if (!result) {
        res.status(404).json({ error: 'Result not found', resultId });
        return;
      }

      const parsed = EvalVerificationRequestSchema.safeParse({
        resultId,
        verifyToken: req.body.verifyToken ?? result.verifyToken,
        executorConfig: req.body.executorConfig,
      });
      if (!parsed.success) {
        res.status(400).json({ error: 'Invalid verification request', details: parsed.error.flatten() });
        return;
      }

      const { verifyToken, executorConfig } = parsed.data;
      if (!verifyToken) {
        res.status(400).json({ error: 'verifyToken is required to initiate verification' });
        return;
      }

      const token = await evalRegistryRepository.insertVerificationToken({
        resultId,
        verifyToken,
        status: 'pending',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });

      // Run verification asynchronously
      runEvalVerification({
        resultId,
        verifyTokenId: token.id,
        verifyToken,
        result,
        executorConfig,
      }).catch(() => {
        // Non-blocking — verification job will update token status independently
      });

      sendCreated(res, {
        message: 'Verification job queued',
        verificationTokenId: token.id,
        resultId,
        status: 'pending',
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to request verification');
    }
  },
);

// ─── Community Submissions ────────────────────────────────────────────────────

/**
 * GET /eval-registry/submissions
 * List community PR submissions for the current org.
 */
router.get(
  '/eval-registry/submissions',
  authMiddleware(),
  async (req: Request, res: Response) => {
    try {
      const orgId = (req as unknown as { orgId?: number }).orgId ?? null;
      const status = req.query.status ? String(req.query.status) : undefined;
      const submittedBy = req.query.submitted_by ? String(req.query.submitted_by) : undefined;
      const limitRaw = Number(req.query.limit ?? 50);
      const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(limitRaw, 200) : 50;

      const submissions = await evalRegistryRepository.listSubmissions({
        status,
        orgId,
        submittedBy,
        limit,
      });
      sendSuccess(res, { submissions, total: submissions.length });
    } catch (err) {
      handleRouteError(res, err, 'Failed to list submissions');
    }
  },
);

/**
 * POST /eval-registry/submissions
 * Open a community PR for a set of eval results.
 * Validates the payload, persists the submission, and optionally opens a GitHub PR.
 */
router.post(
  '/eval-registry/submissions',
  authMiddleware(),
  async (req: Request, res: Response) => {
    try {
      const parsed = EvalSubmissionRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          error: 'Invalid submission payload',
          details: parsed.error.flatten(),
        });
        return;
      }

      const { yaml, prDescription, branchSuggestion } = parsed.data;
      const orgId = (req as unknown as { orgId?: number }).orgId ?? null;
      const submittedBy =
        (req as unknown as { user?: { email?: string; id?: string } }).user?.email ?? 'api';

      const title = `[eval] ${yaml.entityLabel} — ${yaml.entityType} on ${yaml.domain}`;
      const branchName =
        branchSuggestion ??
        `eval/${yaml.entityId.replace(/[^a-z0-9-]/gi, '-').toLowerCase()}-${Date.now()}`;

      const submission = await evalRegistryRepository.insertSubmission({
        title,
        status: 'open',
        yamlPayload: yaml as unknown as Record<string, unknown>,
        prDescription: prDescription ?? null,
        branchName,
        submittedBy,
        orgId,
      });

      // Attempt to open GitHub PR asynchronously (non-blocking)
      openGithubPr(submission.id, yaml, branchName, prDescription, submittedBy).catch(() => {});

      sendCreated(res, {
        submissionId: submission.id,
        title,
        status: 'open',
        branchName,
        message: 'Community submission created. A GitHub PR will be opened shortly.',
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to create submission');
    }
  },
);

/**
 * PATCH /eval-registry/submissions/:id/accept
 * Accept a community PR submission (admin-only).
 * Promotes all results from community → leaderboard and creates DB rows.
 */
router.patch(
  '/eval-registry/submissions/:id/accept',
  authMiddleware(),
  async (req: Request, res: Response) => {
    const user = (req as unknown as { user?: { roles?: string[] } }).user;
    if (
      !user?.roles?.includes('super_admin') &&
      !user?.roles?.includes('admin') &&
      !user?.roles?.includes('platform_admin')
    ) {
      res.status(403).json({ error: 'Admin role required' });
      return;
    }
    try {
      const { id } = req.params;
      // Platform admins (super_admin/platform_admin) may operate across all orgs.
      // Org-level admins are limited to their own org's submissions.
      const isPlatformAdmin =
        user?.roles?.includes('super_admin') || user?.roles?.includes('platform_admin');
      const callerOrgId = (req as unknown as { orgId?: number }).orgId ?? null;

      const submission = isPlatformAdmin
        ? await evalRegistryRepository.findSubmissionById(id)
        : await evalRegistryRepository.findSubmissionByIdForOrg(id, callerOrgId);

      if (!submission) {
        res.status(404).json({ error: 'Submission not found', id });
        return;
      }
      if (submission.status !== 'open') {
        res.status(409).json({
          error: 'Submission is not open',
          status: submission.status,
        });
        return;
      }

      const reviewedBy =
        (req as unknown as { user?: { email?: string } }).user?.email ?? 'admin';
      const reviewNotes = req.body.reviewNotes ? String(req.body.reviewNotes) : null;

      // Use the submission's orgId as the source of truth for data ownership.
      // This prevents cross-tenant re-homing when an admin operates in a different org context.
      const resultOrgId = submission.orgId;

      // Parse the stored YAML and insert results as community state.
      // Verification is queued asynchronously for entries that carry a verifyToken;
      // badge promotion to `verified` (and then leaderboard) happens once the
      // sandbox re-run passes — matching the community → verified → leaderboard flow.
      const yaml = EvalResultsYamlSchema.parse(submission.yamlPayload);
      const rows = yaml.results.map((entry) => ({
        benchmarkId: entry.datasetId,
        taskId: entry.taskId,
        entityId: yaml.entityId,
        entityLabel: yaml.entityLabel,
        entityType: yaml.entityType,
        domain: yaml.domain,
        metric: entry.metric,
        value: String(entry.value),
        unit: entry.unit ?? null,
        higherIsBetter: entry.higherIsBetter ?? true,
        numericValue: typeof entry.value === 'number' ? String(entry.value) : null,
        evaluationFramework: entry.evaluationFramework ?? null,
        badgeState: 'community' as const,
        verifyToken: entry.verifyToken ?? null,
        evalDate: entry.date ?? null,
        sourceUrl: entry.sourceUrl ?? null,
        notes: entry.notes ?? null,
        tags: entry.tags ?? [],
        rawYaml: yaml as unknown as Record<string, unknown>,
        submittedBy: submission.submittedBy,
        submissionId: submission.id,
        orgId: resultOrgId,
      }));

      const inserted = await evalRegistryRepository.insertResults(rows);

      // Queue asynchronous verification for every result that carries a verifyToken.
      // Failures are intentionally fire-and-forget — the admin can retry via
      // POST /eval-registry/results/:id/verify.
      setImmediate(() => {
        for (const result of inserted) {
          if (!result.verifyToken) continue;
          evalRegistryRepository
            .insertVerificationToken({
              resultId: result.id,
              verifyToken: result.verifyToken,
              status: 'pending',
              expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
            })
            .then((token) =>
              runEvalVerification({
                resultId: result.id,
                verifyToken: result.verifyToken!,
                verifyTokenId: token.id,
                result,
              }),
            )
            .catch((err: unknown) => {
              console.error('[eval-registry] Background verification failed for result', result.id, err);
            });
        }
      });

      await evalRegistryRepository.updateSubmission(id, {
        status: 'merged',
        reviewedBy,
        reviewNotes,
        reviewedAt: new Date(),
        resultCount: inserted.length,
      });

      sendSuccess(res, {
        submissionId: id,
        status: 'merged',
        resultCount: inserted.length,
        results: inserted,
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to accept submission');
    }
  },
);

/**
 * PATCH /eval-registry/submissions/:id/reject
 * Reject a community PR submission (admin-only).
 */
router.patch(
  '/eval-registry/submissions/:id/reject',
  authMiddleware(),
  async (req: Request, res: Response) => {
    const user = (req as unknown as { user?: { roles?: string[] } }).user;
    if (
      !user?.roles?.includes('super_admin') &&
      !user?.roles?.includes('admin') &&
      !user?.roles?.includes('platform_admin')
    ) {
      res.status(403).json({ error: 'Admin role required' });
      return;
    }
    try {
      const { id } = req.params;
      // Platform admins (super_admin/platform_admin) may reject any org's submission.
      // Org-level admins are limited to their own org's submissions.
      const isPlatformAdmin =
        user?.roles?.includes('super_admin') || user?.roles?.includes('platform_admin');
      const callerOrgId = (req as unknown as { orgId?: number }).orgId ?? null;

      const submission = isPlatformAdmin
        ? await evalRegistryRepository.findSubmissionById(id)
        : await evalRegistryRepository.findSubmissionByIdForOrg(id, callerOrgId);

      if (!submission) {
        res.status(404).json({ error: 'Submission not found', id });
        return;
      }
      if (submission.status !== 'open') {
        res.status(409).json({ error: 'Submission is not open', status: submission.status });
        return;
      }

      const reviewedBy =
        (req as unknown as { user?: { email?: string } }).user?.email ?? 'admin';
      const reviewNotes = req.body.reviewNotes ? String(req.body.reviewNotes) : null;

      await evalRegistryRepository.updateSubmission(id, {
        status: 'rejected',
        reviewedBy,
        reviewNotes,
        reviewedAt: new Date(),
      });

      sendSuccess(res, { submissionId: id, status: 'rejected' });
    } catch (err) {
      handleRouteError(res, err, 'Failed to reject submission');
    }
  },
);

export default router;

// ─── Helpers (non-blocking side effects) ─────────────────────────────────────

async function queueVerification(
  resultId: string,
  verifyToken: string,
  orgId: number | null,
): Promise<void> {
  await evalRegistryRepository.insertVerificationToken({
    resultId,
    verifyToken,
    status: 'pending',
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  });
  runEvalVerification({
    resultId,
    verifyToken,
    result: await evalRegistryRepository.findResultById(resultId),
    executorConfig: {},
  }).catch(() => {});
}

async function openGithubPr(
  submissionId: string,
  yaml: unknown,
  branchName: string,
  prDescription: string | undefined,
  submittedBy: string,
): Promise<void> {
  try {
    const { Octokit } = await import('@octokit/rest');
    const env = await import('@szl-holdings/env').then((m) => m.getEnv());

    const token =
      (env as unknown as { GITHUB_TOKEN?: string }).GITHUB_TOKEN ??
      (env as unknown as { GITHUB_APP_TOKEN?: string }).GITHUB_APP_TOKEN;
    const owner = (env as unknown as { GITHUB_ORG?: string }).GITHUB_ORG ?? 'szl-holdings';
    const repo =
      (env as unknown as { GITHUB_EVAL_REPO?: string }).GITHUB_EVAL_REPO ?? 'eval-results';

    if (!token) return;

    const octokit = new Octokit({ auth: token });

    // Get default branch SHA
    const { data: repoData } = await octokit.repos.get({ owner, repo });
    const defaultBranch = repoData.default_branch;
    const {
      data: { commit },
    } = await octokit.repos.getBranch({ owner, repo, branch: defaultBranch });
    const baseSha = commit.sha;

    // Create branch
    await octokit.git.createRef({
      owner,
      repo,
      ref: `refs/heads/${branchName}`,
      sha: baseSha,
    });

    // Serialize payload as canonical YAML and commit to .eval_results/
    const { stringify: yamlStringify } = await import('yaml');
    const yamlContent = yamlStringify(yaml, { lineWidth: 0 });
    const content = Buffer.from(yamlContent).toString('base64');
    // File name: <entity-id-slug>-<yyyy-mm-dd>.yaml (stable and human-readable)
    const yamlPayload = yaml as { entityId?: string };
    const entitySlug = (yamlPayload.entityId ?? submissionId)
      .replace(/[^a-z0-9-]/gi, '-')
      .toLowerCase()
      .slice(0, 64);
    const dateSlug = new Date().toISOString().slice(0, 10);
    const filePath = `.eval_results/${entitySlug}-${dateSlug}.yaml`;
    await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path: filePath,
      message: `feat(eval): add results for ${entitySlug} [${dateSlug}] [submitted by ${submittedBy}]`,
      content,
      branch: branchName,
    });

    // Open PR
    const { data: pr } = await octokit.pulls.create({
      owner,
      repo,
      title: `[eval] Community submission — ${submissionId}`,
      body: prDescription ?? `Eval results submitted via platform API by ${submittedBy}.`,
      head: branchName,
      base: defaultBranch,
    });

    // Update submission with PR number and URL
    await evalRegistryRepository.updateSubmission(submissionId, {
      githubPrNumber: pr.number,
      githubPrUrl: pr.html_url,
    });
  } catch {
    // Non-fatal — submission is persisted; PR is best-effort
  }
}
