import express, { type NextFunction, type Request, type Response } from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockTriggerLearningJob = vi.fn();
const mockRunLearningCalibration = vi.fn();
const mockGetActiveDomains = vi.fn();
const mockListLearningJobs = vi.fn();

vi.mock('@szl-holdings/outcome-graph', () => ({
  triggerLearningJob: (...args: unknown[]) => mockTriggerLearningJob(...args),
  runLearningCalibration: (...args: unknown[]) => mockRunLearningCalibration(...args),
  getActiveDomains: (...args: unknown[]) => mockGetActiveDomains(...args),
  listLearningJobs: (...args: unknown[]) => mockListLearningJobs(...args),
  recordRecommendation: vi.fn(),
  recordDecision: vi.fn(),
  recordOutcome: vi.fn(),
  getOutcomeById: vi.fn(),
  getOutcomeStats: vi.fn().mockResolvedValue([]),
  listOutcomes: vi.fn().mockResolvedValue([]),
}));

vi.mock('@szl-holdings/observability', () => ({
  serverTelemetry: {
    recordAuthFailure: vi.fn(),
    recordRequest: vi.fn(),
    recordError: vi.fn(),
    recordLatency: vi.fn(),
    recordMutation: vi.fn(),
  },
}));

vi.mock('@szl-holdings/db', () => {
  const stubTable = {};
  return new Proxy(
    {
      db: {
        select: () => ({ from: () => ({ where: () => ({ limit: () => Promise.resolve([]) }), orderBy: () => ({ limit: () => Promise.resolve([]) }) }) }),
        insert: () => ({ values: () => ({ returning: () => Promise.resolve([]) }) }),
        update: () => ({ set: () => ({ where: () => ({ returning: () => Promise.resolve([]) }) }) }),
      },
    } as Record<string, unknown>,
    {
      get(t, p) {
        return p in t ? t[p as string] : stubTable;
      },
    },
  );
});

vi.mock('@szl-holdings/forge-runtime', () => ({
  agentExecutionRuntime: {
    registerAgent: vi.fn(),
  },
  agentScheduler: {
    register: vi.fn(),
    runAgent: vi.fn(),
    startDurableMode: vi.fn(),
  },
  seedDefaultSchedules: vi.fn().mockResolvedValue(undefined),
  AgentScheduler: class {},
}));

vi.mock('../lib/guardian-engine', () => ({
  publishGuardianDecisionEvent: vi.fn(),
}));

vi.mock('../lib/terra-covenant-store', () => ({
  evaluateAllCovenants: vi.fn().mockResolvedValue([]),
  listOrgIdsWithCovenants: vi.fn().mockResolvedValue([]),
  recordCovenantEvaluation: vi.fn(),
  seedCovenantsFromDistress: vi.fn().mockResolvedValue(0),
}));

vi.mock('@workspace/guardian', () => ({
  computeApprovalExpiresAt: vi.fn().mockReturnValue(new Date()),
}));

vi.mock('../jobs/atlas-compaction', () => ({
  runAtlasCompaction: vi.fn().mockResolvedValue({ compacted: 0 }),
}));

vi.mock('../jobs/terra-owner-enrichment', () => ({
  resolveDistressOwnerNames: vi.fn().mockResolvedValue({ resolved: 0 }),
}));

vi.mock('../jobs/backup-restore-drill', () => ({
  runBackupRestoreDrill: vi.fn().mockResolvedValue({ status: 'ok' }),
}));

vi.mock('../lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), debug: vi.fn(), error: vi.fn() },
}));

let authUser: { id: number; role: string; orgId?: number } | null = null;

vi.mock('../middlewares/auth', () => ({
  authMiddleware:
    () =>
    (req: Request, _res: Response, next: NextFunction): void => {
      if (authUser) {
        (req as any).user = authUser;
      }
      next();
    },
  requireRole:
    (...roles: string[]) =>
    (req: Request, res: Response, next: NextFunction): void => {
      const user = (req as any).user;
      if (!user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      if (!roles.includes(user.role)) {
        res.status(403).json({ error: 'Forbidden' });
        return;
      }
      next();
    },
}));

describe('Outcome Graph Calibration — runScheduledCalibration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('triggers and runs calibration for each active domain from DB', async () => {
    mockGetActiveDomains.mockResolvedValue(['maritime', 'security']);
    mockTriggerLearningJob.mockImplementation(async (params: { domain: string }) => ({
      id: 100,
      domain: params.domain,
      status: 'pending',
    }));
    mockRunLearningCalibration.mockResolvedValue({ id: 100, status: 'completed' });

    const { runScheduledCalibration } = await import('../lib/agent-scheduler');
    const result = await runScheduledCalibration();

    expect(mockGetActiveDomains).toHaveBeenCalledTimes(1);
    expect(mockTriggerLearningJob).toHaveBeenCalledTimes(2);
    expect(mockTriggerLearningJob).toHaveBeenCalledWith({
      domain: 'maritime',
      jobType: 'confidence_calibration',
      triggeredBy: 'scheduler',
    });
    expect(mockTriggerLearningJob).toHaveBeenCalledWith({
      domain: 'security',
      jobType: 'confidence_calibration',
      triggeredBy: 'scheduler',
    });
    expect(mockRunLearningCalibration).toHaveBeenCalledTimes(2);
    expect(result.domainResults).toEqual({
      maritime: 'completed',
      security: 'completed',
    });
    expect(result.skipped).toBeUndefined();
  });

  it('returns skipped when no active domains exist', async () => {
    mockGetActiveDomains.mockResolvedValue([]);

    const { runScheduledCalibration } = await import('../lib/agent-scheduler');
    const result = await runScheduledCalibration();

    expect(result).toEqual({ domainResults: {}, skipped: true });
    expect(mockTriggerLearningJob).not.toHaveBeenCalled();
    expect(mockRunLearningCalibration).not.toHaveBeenCalled();
  });

  it('isolates per-domain failures without stopping remaining domains', async () => {
    mockGetActiveDomains.mockResolvedValue(['maritime', 'security', 'general']);
    mockTriggerLearningJob.mockImplementation(async (params: { domain: string }) => {
      if (params.domain === 'security') throw new Error('DB connection lost');
      return { id: 42, domain: params.domain, status: 'pending' };
    });
    mockRunLearningCalibration.mockResolvedValue({ id: 42, status: 'completed' });

    const { runScheduledCalibration } = await import('../lib/agent-scheduler');
    const result = await runScheduledCalibration();

    expect(result.domainResults).toEqual({
      maritime: 'completed',
      security: 'failed',
      general: 'completed',
    });
    expect(mockRunLearningCalibration).toHaveBeenCalledTimes(2);
  });

  it('marks domain failed when runLearningCalibration throws', async () => {
    mockGetActiveDomains.mockResolvedValue(['analytics']);
    mockTriggerLearningJob.mockResolvedValue({ id: 99, domain: 'analytics', status: 'pending' });
    mockRunLearningCalibration.mockRejectedValue(new Error('timeout'));

    const { runScheduledCalibration } = await import('../lib/agent-scheduler');
    const result = await runScheduledCalibration();

    expect(result.domainResults).toEqual({ analytics: 'failed' });
  });
});

describe('GET /outcome-graph/learning-jobs — system job visibility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authUser = { id: 1, role: 'admin', orgId: 5 };
  });

  it('passes includeSystemJobs: true so scheduler-created jobs are visible', async () => {
    const systemJob = { id: 1, orgId: null, domain: 'maritime', status: 'completed', triggeredBy: 'scheduler' };
    const orgJob = { id: 2, orgId: 5, domain: 'security', status: 'completed', triggeredBy: 'admin@co.com' };
    mockListLearningJobs.mockResolvedValue([systemJob, orgJob]);

    const outcomeGraphRouter = (await import('../routes/outcome-graph')).default;
    const app = express();
    app.use(express.json());
    app.use(outcomeGraphRouter);

    const res = await request(app).get('/outcome-graph/learning-jobs');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(2);

    expect(mockListLearningJobs).toHaveBeenCalledWith(
      expect.objectContaining({ includeSystemJobs: true }),
    );
  });

  it('returns both system (orgId=null) and org-scoped jobs', async () => {
    const systemJob = { id: 10, orgId: null, domain: 'general', status: 'completed', triggeredBy: 'scheduler' };
    const orgJob = { id: 11, orgId: 5, domain: 'general', status: 'completed', triggeredBy: 'user' };
    mockListLearningJobs.mockResolvedValue([systemJob, orgJob]);

    const outcomeGraphRouter = (await import('../routes/outcome-graph')).default;
    const app = express();
    app.use(express.json());
    app.use(outcomeGraphRouter);

    const res = await request(app).get('/outcome-graph/learning-jobs');

    expect(res.body.data[0].orgId).toBeNull();
    expect(res.body.data[1].orgId).toBe(5);
  });
});
