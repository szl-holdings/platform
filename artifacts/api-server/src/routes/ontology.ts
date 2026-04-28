import { Router, type IRouter } from 'express';
import { z } from 'zod';
import {
  ENTITY_KINDS,
  entityKindSchema,
  entityUri,
  isUri,
  neighbors,
  registerEdge,
  registerEntity,
  resolveEntity,
  uriSchema,
} from '@workspace/ontology';
import { authMiddleware, isElevatedUser } from '../middlewares/auth';
import {
  handleRouteError,
  sendBadRequest,
  sendCreated,
  sendNotFound,
  sendSuccess,
  sendUnauthorized,
} from '../lib/api-response';
import { validateBody, validateQuery } from '../lib/validation';

const router: IRouter = Router();

router.use('/ontology', authMiddleware());

function orgScopeFor(req: Express.Request): number[] | null {
  const user = (req as any).user;
  if (!user) return [];
  if (isElevatedUser(user)) return null;
  return user.orgs.map((o: { orgId: number }) => o.orgId);
}

const resolveQuerySchema = z.object({
  uri: uriSchema,
});

router.get('/resolve', validateQuery(resolveQuerySchema), async (req, res) => {
  try {
    const uri = String(req.query.uri);
    const scope = orgScopeFor(req);
    const entity = await resolveEntity(uri, { orgScope: scope });
    if (!entity) {
      sendNotFound(res, 'Entity not registered');
      return;
    }
    sendSuccess(res, { entity });
  } catch (err) {
    handleRouteError(res, err);
  }
});

const neighborsQuerySchema = z.object({
  uri: uriSchema,
  limit: z.coerce.number().int().min(1).max(200).optional(),
});

router.get('/neighbors', validateQuery(neighborsQuerySchema), async (req, res) => {
  try {
    const uri = String(req.query.uri);
    const limit = req.query.limit ? Number(req.query.limit) : undefined;
    const scope = orgScopeFor(req);
    const entity = await resolveEntity(uri, { orgScope: scope });
    if (!entity) {
      sendNotFound(res, 'Entity not registered');
      return;
    }
    const links = await neighbors(uri, { orgScope: scope, limit });
    sendSuccess(res, { entity, neighbors: links });
  } catch (err) {
    handleRouteError(res, err);
  }
});

const registerEntityBody = z.object({
  kind: entityKindSchema,
  namespace: z.string().regex(/^[a-z0-9_-]+$/),
  identifier: z.union([z.string(), z.number()]),
  orgId: z.number().int().nullable().optional(),
  sourceTable: z.string().min(1),
  sourceId: z.union([z.string(), z.number()]),
  displayName: z.string().min(1),
  attributes: z.record(z.unknown()).optional().nullable(),
});

router.post('/register', validateBody(registerEntityBody), async (req, res) => {
  try {
    const user = (req as any).user;
    if (!user || !isElevatedUser(user)) {
      sendUnauthorized(res, 'Elevated role required to register ontology entities');
      return;
    }
    const entity = await registerEntity(req.body);
    sendCreated(res, { entity });
  } catch (err) {
    handleRouteError(res, err);
  }
});

const registerEdgeBody = z.object({
  fromUri: uriSchema,
  toUri: uriSchema,
  relation: z.string().min(1).max(64),
  orgId: z.number().int().nullable().optional(),
  attributes: z.record(z.unknown()).optional().nullable(),
});

router.post('/edges', validateBody(registerEdgeBody), async (req, res) => {
  try {
    const user = (req as any).user;
    if (!user || !isElevatedUser(user)) {
      sendUnauthorized(res, 'Elevated role required to register ontology edges');
      return;
    }
    const edge = await registerEdge(req.body);
    sendCreated(res, { edge });
  } catch (err) {
    handleRouteError(res, err);
  }
});

router.get('/kinds', async (_req, res) => {
  sendSuccess(res, { kinds: ENTITY_KINDS });
});

export default router;
