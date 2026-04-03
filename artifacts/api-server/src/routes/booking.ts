import { Router, type IRouter } from "express";
import { bookingMockProvider, createProvider, type DataProvider, type BookingAppointment } from "@szl-holdings/services";

const router: IRouter = Router();

const liveProvider: DataProvider<BookingAppointment> = {
  mode: "live",
  async getAll() { return []; },
  async getById() { return null; },
  async search() { return []; },
};

const provider = createProvider("booking", bookingMockProvider, liveProvider);

router.get("/booking/health", (_req, res) => {
  res.json({
    service: "booking",
    status: "ok",
    providerMode: provider.mode,
    timestamp: new Date().toISOString(),
  });
});

router.get("/booking/appointments", async (_req, res) => {
  const data = await provider.getAll();
  res.json({
    data,
    meta: { page: 1, limit: 25, total: data.length },
  });
});

router.get("/booking/appointments/:id", async (req, res) => {
  const appointment = await provider.getById(req.params.id);
  if (!appointment) {
    res.status(404).json({ error: "Appointment not found" });
    return;
  }
  res.json({ data: appointment });
});

router.get("/booking/search", async (req, res) => {
  const query = (req.query.q as string) || "";
  const results = await provider.search(query);
  res.json({
    data: results,
    meta: { page: 1, limit: 25, total: results.length },
  });
});

export default router;
