import { Router, type IRouter } from "express";
import { db, projectsTable, insertProjectSchema } from "@szl-holdings/db";
import { eq, desc } from "drizzle-orm";
import { sendSuccess, sendCreated, sendNotFound, sendBadRequest, sendNoContent, sendError, handleRouteError } from "../lib/api-response";
import { authMiddleware, requireRole, parseIdParam } from "../middlewares/auth";

const router: IRouter = Router();

const validStatuses = ["active", "completed", "on-hold", "archived"] as const;

function serializeProject(p: typeof projectsTable.$inferSelect) {
  return {
    id: p.id,
    name: p.name,
    description: p.description,
    status: p.status,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}

router.get("/projects", authMiddleware({ required: false }), async (req, res) => {
  try {
    const projects = await db
      .select()
      .from(projectsTable)
      .orderBy(desc(projectsTable.createdAt));

    sendSuccess(res, projects.map(serializeProject));
  } catch (err) {
    req.log?.error({ err }, "Failed to list projects");
    handleRouteError(res, err, "Failed to list projects");
  }
});

router.post("/projects", authMiddleware(), requireRole("ops", "super_admin"), async (req, res) => {
  try {
    const body = insertProjectSchema.parse(req.body);
    const [project] = await db
      .insert(projectsTable)
      .values({
        name: body.name,
        description: body.description ?? null,
        status: body.status ?? "active",
      })
      .returning();

    sendCreated(res, serializeProject(project));
  } catch (err: unknown) {
    if (err && typeof err === "object" && "issues" in err) {
      sendBadRequest(res, "Invalid project data");
      return;
    }
    req.log?.error({ err }, "Failed to create project");
    handleRouteError(res, err, "Failed to create project");
  }
});

router.get("/projects/:id", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [project] = await db
      .select()
      .from(projectsTable)
      .where(eq(projectsTable.id, id));

    if (!project) {
      sendNotFound(res, "Project");
      return;
    }

    sendSuccess(res, serializeProject(project));
  } catch (err) {
    req.log?.error({ err }, "Failed to get project");
    handleRouteError(res, err, "Failed to get project");
  }
});

router.patch("/projects/:id", authMiddleware(), requireRole("ops", "super_admin"), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const { name, description, status } = req.body;
    if (name !== undefined && (typeof name !== "string" || name.trim().length === 0)) {
      sendBadRequest(res, "Name must be a non-empty string");
      return;
    }
    if (status !== undefined && !validStatuses.includes(status)) {
      sendBadRequest(res, `Status must be one of: ${validStatuses.join(", ")}`);
      return;
    }
    if (description !== undefined && typeof description !== "string") {
      sendBadRequest(res, "Description must be a string");
      return;
    }
    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description;
    if (status !== undefined) updateData.status = status;

    const [project] = await db
      .update(projectsTable)
      .set(updateData)
      .where(eq(projectsTable.id, id))
      .returning();

    if (!project) {
      sendNotFound(res, "Project");
      return;
    }

    sendSuccess(res, serializeProject(project));
  } catch (err) {
    req.log?.error({ err }, "Failed to update project");
    handleRouteError(res, err, "Failed to update project");
  }
});

router.delete("/projects/:id", authMiddleware(), requireRole("ops", "super_admin"), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [project] = await db
      .delete(projectsTable)
      .where(eq(projectsTable.id, id))
      .returning();

    if (!project) {
      sendNotFound(res, "Project");
      return;
    }

    sendNoContent(res);
  } catch (err) {
    req.log?.error({ err }, "Failed to delete project");
    handleRouteError(res, err, "Failed to delete project");
  }
});

export default router;
