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

router.post("/holdings/inquiries", (req, res) => {
  const { name, email, subject, message, company } = req.body || {};
  const errors: string[] = [];
  if (!name || typeof name !== "string" || !name.trim()) errors.push("Name is required");
  if (!email || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push("Valid email is required");
  if (!subject || typeof subject !== "string" || !subject.trim()) errors.push("Subject is required");
  if (!message || typeof message !== "string" || message.trim().length < 10) errors.push("Message must be at least 10 characters");
  if (company != null && typeof company !== "string") errors.push("Company must be a string");
  if (errors.length > 0) {
    res.status(400).json({ error: "Validation failed", details: errors });
    return;
  }
  const companyValue = typeof company === "string" ? company.trim() : null;
  console.log(`[holdings] New inquiry received - subject: ${subject}`);
  res.status(201).json({
    success: true,
    data: {
      id: `inq_${Date.now()}`,
      name: name.trim(),
      email: email.trim(),
      company: companyValue || null,
      subject: subject.trim(),
      message: message.trim(),
      receivedAt: new Date().toISOString(),
    },
  });
});

export default router;
