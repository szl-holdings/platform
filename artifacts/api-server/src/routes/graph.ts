import { Router, type IRouter, type Request, type Response } from "express";
import { sendSuccess, sendBadRequest, handleRouteError } from "../lib/api-response";
import { authMiddleware } from "../middlewares/auth";
import {
  queryNodes,
  getNodeById,
  searchNodes,
  queryEdges,
  CstQueryFiltersSchema,
  CstRelationshipFiltersSchema,
  CstSearchParamsSchema,
} from "@szl-holdings/constellation";

const router: IRouter = Router();

router.use(authMiddleware({ required: false }));

router.get("/graph/entities", async (req: Request, res: Response) => {
  try {
    const parsed = CstQueryFiltersSchema.safeParse({
      domain: req.query.domain,
      entityType: req.query.entityType,
      sensitivityTier: req.query.sensitivityTier,
      isActive: req.query.isActive !== undefined ? req.query.isActive !== "false" : undefined,
      minConfidence: req.query.minConfidence ? Number(req.query.minConfidence) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : 50,
      offset: req.query.offset ? Number(req.query.offset) : 0,
    });

    if (!parsed.success) {
      return sendBadRequest(res, "Invalid query parameters", { errors: parsed.error.flatten() });
    }

    const result = await queryNodes(parsed.data);
    return sendSuccess(res, result);
  } catch (err) {
    return handleRouteError(res, err, "GET /graph/entities");
  }
});

router.get("/graph/entities/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const node = await getNodeById(id);
    if (!node) {
      return res.status(404).json({ error: "Entity not found", id });
    }
    return sendSuccess(res, { node });
  } catch (err) {
    return handleRouteError(res, err, "GET /graph/entities/:id");
  }
});

router.get("/graph/search", async (req: Request, res: Response) => {
  try {
    const parsed = CstSearchParamsSchema.safeParse({
      q: req.query.q,
      domain: req.query.domain,
      entityType: req.query.entityType,
      limit: req.query.limit ? Number(req.query.limit) : 20,
    });

    if (!parsed.success) {
      return sendBadRequest(res, "Invalid search parameters", { errors: parsed.error.flatten() });
    }

    const nodes = await searchNodes(parsed.data);
    return sendSuccess(res, { nodes, count: nodes.length });
  } catch (err) {
    return handleRouteError(res, err, "GET /graph/search");
  }
});

router.get("/graph/relationships", async (req: Request, res: Response) => {
  try {
    const parsed = CstRelationshipFiltersSchema.safeParse({
      fromNodeId: req.query.fromNodeId,
      toNodeId: req.query.toNodeId,
      relationshipType: req.query.relationshipType,
      active: req.query.active !== undefined ? req.query.active !== "false" : undefined,
      minConfidence: req.query.minConfidence ? Number(req.query.minConfidence) : undefined,
      includeEvidence: req.query.includeEvidence === "true",
      limit: req.query.limit ? Number(req.query.limit) : 50,
      offset: req.query.offset ? Number(req.query.offset) : 0,
    });

    if (!parsed.success) {
      return sendBadRequest(res, "Invalid query parameters", { errors: parsed.error.flatten() });
    }

    const result = await queryEdges(parsed.data);
    return sendSuccess(res, result);
  } catch (err) {
    return handleRouteError(res, err, "GET /graph/relationships");
  }
});

export default router;
