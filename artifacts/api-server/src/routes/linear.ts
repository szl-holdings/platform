import { Router, type IRouter, type Request, type Response } from "express";
import { authMiddleware } from "../middlewares/auth";
import {
  sendCreated,
  sendBadRequest,
  sendError,
  handleRouteError,
} from "../lib/api-response";
import { jsonObjectBodySchema, validateBody } from "../lib/validation";
import { logger } from "../lib/logger";
import { createLinearIssue, isLinearConfigured, type LinearPriority } from "../services/linear-connector";

const router: IRouter = Router();

const VALID_PRIORITIES = new Set<number>([0, 1, 2, 3, 4]);

router.post(
  "/linear/create-ticket",
  authMiddleware({ required: false }),
  validateBody(jsonObjectBodySchema),
  async (req: Request, res: Response) => {
    try {
      if (!isLinearConfigured()) {
        sendError(
          res,
          "Linear connector is not configured in this environment",
          503,
          "LINEAR_NOT_CONFIGURED",
        );
        return;
      }

      const body = req.body as {
        title?: string;
        description?: string;
        priority?: number;
        assigneeName?: string;
        teamKey?: string;
      };

      if (!body.title || typeof body.title !== "string" || body.title.trim().length === 0) {
        sendBadRequest(res, "title is required");
        return;
      }

      const priority =
        typeof body.priority === "number" && VALID_PRIORITIES.has(body.priority)
          ? (body.priority as LinearPriority)
          : undefined;

      const issue = await createLinearIssue({
        title: body.title.trim(),
        description: body.description,
        priority,
        assigneeName: body.assigneeName,
        teamKey: body.teamKey,
      });

      logger.info(
        { identifier: issue.identifier, url: issue.url, team: issue.team.key },
        "linear: issue created",
      );

      sendCreated(res, {
        id: issue.id,
        identifier: issue.identifier,
        url: issue.url,
        title: issue.title,
        priority: issue.priority,
        team: issue.team,
        assignee: issue.assignee,
        createdAt: issue.createdAt,
      });
    } catch (err) {
      const message = (err as Error).message ?? "";
      if (message.includes("not authorized") || message.includes("not available")) {
        sendError(res, message, 503, "LINEAR_NOT_CONNECTED");
        return;
      }
      handleRouteError(res, err, "Failed to create Linear issue");
    }
  },
);

export default router;
