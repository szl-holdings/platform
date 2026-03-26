import { Router, type IRouter } from "express";
import { incaMockProvider, createProvider, type DataProvider, type IncaModel } from "@workspace/services";

const router: IRouter = Router();

const liveProvider: DataProvider<IncaModel> = {
  mode: "live",
  async getAll() { return []; },
  async getById() { return null; },
  async search() { return []; },
};

const provider = createProvider("inca", incaMockProvider, liveProvider);

router.get("/inca/health", (_req, res) => {
  res.json({
    service: "inca",
    status: "ok",
    providerMode: provider.mode,
    timestamp: new Date().toISOString(),
  });
});

router.get("/inca/models", async (_req, res) => {
  const data = await provider.getAll();
  res.json({
    data,
    meta: { page: 1, limit: 25, total: data.length },
  });
});

router.get("/inca/models/:id", async (req, res) => {
  const model = await provider.getById(req.params.id);
  if (!model) {
    res.status(404).json({ error: "Model not found" });
    return;
  }
  res.json({ data: model });
});

router.get("/inca/search", async (req, res) => {
  const query = (req.query.q as string) || "";
  const results = await provider.search(query);
  res.json({
    data: results,
    meta: { page: 1, limit: 25, total: results.length },
  });
});

export default router;
