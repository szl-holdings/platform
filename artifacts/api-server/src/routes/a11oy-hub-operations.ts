import { Router, type Request, type Response } from 'express';
import { handleRouteError, sendSuccess, sendBadRequest } from '../lib/api-response.js';
import { authMiddleware } from '../middlewares/auth.js';
import {
  isValidModelSort,
  isValidDatasetSort,
  isValidBucketAction,
  isValidSpaceAction,
  isValidSpaceSdk,
  isValidRepoType,
} from '../a11oy/runtime/hub-client.js';
import {
  governedSearchModels,
  governedSearchDatasets,
  governedDownloadModel,
  governedUploadModel,
  governedManageBucket,
  governedManageSpace,
  listGovernedOperations,
  getHubCostDashboard,
} from '../a11oy/runtime/hub-operations.js';

const router = Router();
const requireAuth = authMiddleware({ required: true });

interface AuthUser {
  id?: string;
  email?: string;
  orgs?: Array<{ orgSlug: string }>;
}

interface InternalAgentRequest extends Request {
  isInternalAgent?: boolean;
}

function extractIdentity(req: Request): { agentId: string; tenantId: string } {
  const user = req.user as AuthUser | undefined;
  const isInternal = (req as InternalAgentRequest).isInternalAgent === true;

  const headerAgentId = typeof req.headers['x-agent-id'] === 'string' ? req.headers['x-agent-id'] : undefined;
  const headerTenantId = typeof req.headers['x-tenant-id'] === 'string' ? req.headers['x-tenant-id'] : undefined;

  const agentId = (isInternal ? headerAgentId : undefined) ?? user?.id ?? 'anonymous';
  const tenantId = (isInternal ? headerTenantId : undefined) ?? user?.orgs?.[0]?.orgSlug ?? 'default';
  return { agentId, tenantId };
}

router.get('/a11oy/hub-operations', requireAuth, async (req: Request, res: Response) => {
  try {
    const { agentId, tenantId } = extractIdentity(req);
    const limitParam = req.query.limit;
    const limit = typeof limitParam === 'string' && /^\d+$/.test(limitParam) ? Number(limitParam) : 50;
    const ops = listGovernedOperations({ limit, agentId, tenantId });
    sendSuccess(res, { operations: ops, total: ops.length });
  } catch (err) {
    handleRouteError(res, err, 'Failed to list hub operations');
  }
});

router.get('/a11oy/hub-operations/costs', requireAuth, async (req: Request, res: Response) => {
  try {
    const { agentId, tenantId } = extractIdentity(req);
    const dashboard = getHubCostDashboard({ agentId, tenantId });
    sendSuccess(res, dashboard);
  } catch (err) {
    handleRouteError(res, err, 'Failed to get hub cost dashboard');
  }
});

router.post('/a11oy/hub-operations/search-models', requireAuth, async (req: Request, res: Response) => {
  try {
    const body = req.body as Record<string, unknown>;
    const search = typeof body.search === 'string' ? body.search : undefined;
    const task = typeof body.task === 'string' ? body.task : undefined;
    const library = typeof body.library === 'string' ? body.library : undefined;
    const license = typeof body.license === 'string' ? body.license : undefined;
    const sort = isValidModelSort(body.sort) ? body.sort : undefined;
    const limit = typeof body.limit === 'number' && Number.isFinite(body.limit) ? Math.min(Math.max(1, body.limit), 100) : 20;
    const maxParameters = typeof body.maxParameters === 'string' ? body.maxParameters : undefined;

    const identity = extractIdentity(req);
    const result = await governedSearchModels(
      { search, task, library, license, sort, limit, maxParameters },
      identity,
    );
    sendSuccess(res, result);
  } catch (err) {
    handleRouteError(res, err, 'Governed model search failed');
  }
});

router.post('/a11oy/hub-operations/search-datasets', requireAuth, async (req: Request, res: Response) => {
  try {
    const body = req.body as Record<string, unknown>;
    const search = typeof body.search === 'string' ? body.search : undefined;
    const task = typeof body.task === 'string' ? body.task : undefined;
    const sort = isValidDatasetSort(body.sort) ? body.sort : undefined;
    const limit = typeof body.limit === 'number' && Number.isFinite(body.limit) ? Math.min(Math.max(1, body.limit), 100) : 20;

    const identity = extractIdentity(req);
    const result = await governedSearchDatasets(
      { search, task, sort, limit },
      identity,
    );
    sendSuccess(res, result);
  } catch (err) {
    handleRouteError(res, err, 'Governed dataset search failed');
  }
});

router.post('/a11oy/hub-operations/download-model', requireAuth, async (req: Request, res: Response) => {
  try {
    const body = req.body as Record<string, unknown>;
    if (typeof body.modelId !== 'string' || !body.modelId) return sendBadRequest(res, "'modelId' is required and must be a string");

    const revision = typeof body.revision === 'string' ? body.revision : undefined;
    const files = Array.isArray(body.files) ? body.files.filter((f): f is string => typeof f === 'string') : undefined;
    const purpose = typeof body.purpose === 'string' ? body.purpose : undefined;

    const identity = extractIdentity(req);
    const result = await governedDownloadModel(
      { modelId: body.modelId, revision, files, purpose },
      identity,
    );
    sendSuccess(res, result);
  } catch (err) {
    handleRouteError(res, err, 'Governed model download failed');
  }
});

router.post('/a11oy/hub-operations/upload-model', requireAuth, async (req: Request, res: Response) => {
  try {
    const body = req.body as Record<string, unknown>;
    if (typeof body.repoId !== 'string' || !body.repoId) return sendBadRequest(res, "'repoId' is required and must be a string");

    const repoType = isValidRepoType(body.repoType) ? body.repoType : undefined;
    const files = Array.isArray(body.files)
      ? body.files.filter((f): f is { path: string; content: string } =>
          typeof f === 'object' && f !== null && typeof (f as Record<string, unknown>).path === 'string' && typeof (f as Record<string, unknown>).content === 'string')
      : [];
    const commitMessage = typeof body.commitMessage === 'string' ? body.commitMessage : undefined;
    const purpose = typeof body.purpose === 'string' ? body.purpose : undefined;

    const identity = extractIdentity(req);
    const result = await governedUploadModel(
      { repoId: body.repoId, repoType, files, commitMessage, purpose },
      identity,
    );
    sendSuccess(res, result);
  } catch (err) {
    handleRouteError(res, err, 'Governed model upload failed');
  }
});

router.post('/a11oy/hub-operations/manage-bucket', requireAuth, async (req: Request, res: Response) => {
  try {
    const body = req.body as Record<string, unknown>;
    if (!isValidBucketAction(body.action)) return sendBadRequest(res, "'action' must be one of: create, list, delete, get");

    const bucketName = typeof body.bucketName === 'string' ? body.bucketName : undefined;
    const prefix = typeof body.prefix === 'string' ? body.prefix : undefined;

    const identity = extractIdentity(req);
    const result = await governedManageBucket(
      { action: body.action, bucketName, prefix },
      identity,
    );
    sendSuccess(res, result);
  } catch (err) {
    handleRouteError(res, err, 'Governed bucket management failed');
  }
});

router.post('/a11oy/hub-operations/manage-space', requireAuth, async (req: Request, res: Response) => {
  try {
    const body = req.body as Record<string, unknown>;
    if (!isValidSpaceAction(body.action)) return sendBadRequest(res, "'action' must be one of: create, list, get, restart, pause");

    const spaceId = typeof body.spaceId === 'string' ? body.spaceId : undefined;
    const sdk = isValidSpaceSdk(body.sdk) ? body.sdk : undefined;
    const hardware = typeof body.hardware === 'string' ? body.hardware : undefined;
    const isPrivate = typeof body.private === 'boolean' ? body.private : false;

    const identity = extractIdentity(req);
    const result = await governedManageSpace(
      { action: body.action, spaceId, sdk, hardware, private: isPrivate },
      identity,
    );
    sendSuccess(res, result);
  } catch (err) {
    handleRouteError(res, err, 'Governed space management failed');
  }
});

export default router;
