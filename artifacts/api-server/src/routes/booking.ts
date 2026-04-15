import { Router, type IRouter } from "express";
import { authMiddleware } from "../middlewares/auth";
import { db, carlotaReservationsTable } from "@szl-holdings/db";
import { desc, eq, ilike, or } from "drizzle-orm";

const router: IRouter = Router();

router.use(authMiddleware());

router.get("/booking/health", (_req, res) => {
  res.json({
    service: "booking",
    status: "ok",
    providerMode: "live",
    timestamp: new Date().toISOString(),
  });
});

router.get("/booking/appointments", async (_req, res) => {
  const data = await db.select().from(carlotaReservationsTable).orderBy(desc(carlotaReservationsTable.createdAt));
  res.json({
    data: data.map(mapReservation),
    meta: { page: 1, limit: 25, total: data.length },
  });
});

router.get("/booking/appointments/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }
  const [row] = await db.select().from(carlotaReservationsTable).where(eq(carlotaReservationsTable.id, id));
  if (!row) {
    res.status(404).json({ error: "Appointment not found" });
    return;
  }
  res.json({ data: mapReservation(row) });
});

router.get("/booking/search", async (req, res) => {
  const query = (req.query.q as string) || "";
  const results = query
    ? await db.select().from(carlotaReservationsTable).where(
        or(
          ilike(carlotaReservationsTable.name, `%${query}%`),
          ilike(carlotaReservationsTable.service, `%${query}%`),
          ilike(carlotaReservationsTable.email, `%${query}%`),
        ),
      )
    : await db.select().from(carlotaReservationsTable);
  res.json({
    data: results.map(mapReservation),
    meta: { page: 1, limit: 25, total: results.length },
  });
});

function mapReservation(row: typeof carlotaReservationsTable.$inferSelect) {
  return {
    id: String(row.id),
    clientName: row.name,
    clientEmail: row.email,
    service: row.service,
    date: row.date,
    time: row.time,
    duration: 60,
    status: (row.status === "canceled" ? "cancelled" : row.status) as "confirmed" | "pending" | "cancelled" | "completed",
    advisor: "Carlota J. Méndez",
    notes: row.notes ?? "",
  };
}

export default router;
