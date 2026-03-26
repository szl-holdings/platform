import { Router, type IRouter } from "express";
import { holdingsMockProvider, createProvider, type DataProvider, type HoldingsVenture } from "@workspace/services";

const router: IRouter = Router();

const liveProvider: DataProvider<HoldingsVenture> = {
  mode: "live",
  async getAll() { return []; },
  async getById() { return null; },
  async search() { return []; },
};

const provider = createProvider("holdings", holdingsMockProvider, liveProvider);

router.get("/holdings/health", (_req, res) => {
  res.json({
    service: "holdings",
    status: "ok",
    providerMode: provider.mode,
    timestamp: new Date().toISOString(),
  });
});

router.get("/holdings/ventures", async (_req, res) => {
  const data = await provider.getAll();
  res.json({
    data,
    meta: { page: 1, limit: 25, total: data.length },
  });
});

router.get("/holdings/ventures/:id", async (req, res) => {
  const venture = await provider.getById(req.params.id);
  if (!venture) {
    res.status(404).json({ error: "Venture not found" });
    return;
  }
  res.json({ data: venture });
});

router.get("/holdings/search", async (req, res) => {
  const query = (req.query.q as string) || "";
  const results = await provider.search(query);
  res.json({
    data: results,
    meta: { page: 1, limit: 25, total: results.length },
  });
});

export default router;
