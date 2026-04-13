import { Router, type Request, type Response } from "express";
import { authMiddleware } from "../middlewares/auth";
import { logger } from "../lib/logger";
import {
  createPromptTemplate,
  updatePromptTemplate,
  rollbackPromptTemplate,
  listPromptTemplates,
  getPromptTemplate,
  getPromptVersions,
  deletePromptTemplate,
  createPromptABTest,
  resolvePromptForRender,
  recordPromptOutcome,
  getPromptTestResults,
  listPromptABTests,
  getVersionPerformance,
  renderPromptTemplate,
  ensurePromptPipelineTables,
} from "../lib/prompt-pipeline";

const router = Router();

router.use(authMiddleware());

ensurePromptPipelineTables().catch(err => logger.warn({ err }, "ensurePromptPipelineTables failed (non-fatal)"));

function str(v: unknown): string { return String(v ?? ""); }
function optStr(v: unknown): string | undefined { return v != null ? String(v) : undefined; }

// ─── Templates CRUD ───────────────────────────────────────────────────────────

router.get("/templates", async (req: Request, res: Response): Promise<void> => {
  try {
    const domain = optStr(req.query["domain"]);
    const taskType = optStr(req.query["taskType"]);
    const status = optStr(req.query["status"]);
    const templates = await listPromptTemplates(domain, taskType, status);
    res.json({ templates, count: templates.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/templates/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const id = str(req.params["id"]);
    const template = await getPromptTemplate(id);
    if (!template) { res.status(404).json({ error: "Template not found" }); return; }
    res.json({ template });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/templates", async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, domain, taskType, systemPrompt, userPromptTemplate, variables, metadata } = req.body;
    if (!name || !systemPrompt) {
      res.status(400).json({ error: "name and systemPrompt are required" });
      return;
    }
    const template = await createPromptTemplate({
      name,
      domain,
      taskType,
      systemPrompt,
      userPromptTemplate: userPromptTemplate ?? "",
      variables,
      metadata,
      createdBy: (req as any).user?.email,
    });
    res.status(201).json({ template });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.patch("/templates/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const id = str(req.params["id"]);
    const { systemPrompt, userPromptTemplate, variables, status, changeNote } = req.body;
    const updated = await updatePromptTemplate(id, {
      systemPrompt,
      userPromptTemplate,
      variables,
      status,
      changeNote,
      createdBy: (req as any).user?.email,
    });
    if (!updated) { res.status(404).json({ error: "Template not found" }); return; }
    res.json({ template: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/templates/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const id = str(req.params["id"]);
    const ok = await deletePromptTemplate(id);
    res.json({ success: ok, id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Version History ──────────────────────────────────────────────────────────

router.get("/templates/:id/versions", async (req: Request, res: Response): Promise<void> => {
  try {
    const id = str(req.params["id"]);
    const versions = await getPromptVersions(id);
    res.json({ templateId: id, versions, count: versions.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/templates/:id/rollback", async (req: Request, res: Response): Promise<void> => {
  try {
    const id = str(req.params["id"]);
    const { version } = req.body as { version?: number };
    if (!version) { res.status(400).json({ error: "version required" }); return; }
    const rolled = await rollbackPromptTemplate(id, version);
    if (!rolled) { res.status(404).json({ error: "Template or version not found" }); return; }
    res.json({ template: rolled, rolledBackTo: version });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Template Rendering ───────────────────────────────────────────────────────

router.post("/templates/:id/render", async (req: Request, res: Response): Promise<void> => {
  try {
    const id = str(req.params["id"]);
    const { variables } = req.body as { variables?: Record<string, unknown> };
    const template = await getPromptTemplate(id);
    if (!template) { res.status(404).json({ error: "Template not found" }); return; }
    const rendered = renderPromptTemplate(template, variables ?? {});
    res.json({ templateId: id, version: template.version, ...rendered });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/templates/:id/resolve", async (req: Request, res: Response): Promise<void> => {
  try {
    const id = str(req.params["id"]);
    const { variables } = req.body as { variables?: Record<string, unknown> };
    const result = await resolvePromptForRender(id, variables ?? {});
    if (!result) { res.status(404).json({ error: "Template not found" }); return; }
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Performance ──────────────────────────────────────────────────────────────

router.get("/templates/:id/performance", async (req: Request, res: Response): Promise<void> => {
  try {
    const id = str(req.params["id"]);
    const performance = await getVersionPerformance(id);
    res.json({ templateId: id, performance });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/templates/:id/outcome", async (req: Request, res: Response): Promise<void> => {
  try {
    const id = str(req.params["id"]);
    const { version, qualityScore, latencyMs, success, testId, variant } = req.body as {
      version?: number;
      qualityScore?: number;
      latencyMs?: number;
      success?: boolean;
      testId?: string;
      variant?: "A" | "B";
    };
    if (!version || qualityScore == null) {
      res.status(400).json({ error: "version and qualityScore are required" });
      return;
    }
    await recordPromptOutcome(id, version, qualityScore, latencyMs ?? 0, success !== false, testId, variant);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── A/B Tests ────────────────────────────────────────────────────────────────

router.get("/ab-tests", async (req: Request, res: Response): Promise<void> => {
  try {
    const templateId = optStr(req.query["templateId"]);
    const tests = await listPromptABTests(templateId);
    res.json({ tests, count: tests.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/ab-tests", async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, templateId, versionA, versionB, weightA, domain, taskType, metric } = req.body;
    if (!name || !templateId || !versionA || !versionB) {
      res.status(400).json({ error: "name, templateId, versionA, versionB required" });
      return;
    }
    const test = await createPromptABTest({ name, templateId, versionA, versionB, weightA, domain, taskType, metric });
    res.status(201).json({ test });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/ab-tests/:testId/results", async (req: Request, res: Response): Promise<void> => {
  try {
    const testId = str(req.params["testId"]);
    const results = await getPromptTestResults(testId);
    if (!results) { res.status(404).json({ error: "No results yet" }); return; }
    res.json({ testId, results });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
