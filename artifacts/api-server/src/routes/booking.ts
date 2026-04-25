import { carlotaReservationsTable, db } from '@szl-holdings/db';
import { desc, eq } from 'drizzle-orm';
import { type IRouter, Router } from 'express';
import { listQuerySchema, validateQuery } from '../lib/validation.js';
import { authMiddleware } from '../middlewares/auth';

const router: IRouter = Router();

/* -----------------------------------------------------------------------
 * Booking admin routes — require authentication.
 * -----------------------------------------------------------------------*/

router.use('/booking', authMiddleware());

router.get('/booking/health', (_req, res) => {
  res.json({
    service: 'booking',
    status: 'ok',
    providerMode: 'live',
    timestamp: new Date().toISOString(),
  });
});

router.get('/booking/appointments', async (_req, res) => {
  const data = await db
    .select()
    .from(carlotaReservationsTable)
    .orderBy(desc(carlotaReservationsTable.createdAt));
  res.json({
    data: data.map(mapReservation),
    meta: { page: 1, limit: 25, total: data.length },
  });
});

router.get('/booking/appointments/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id)) {
    res.status(400).json({ error: 'Invalid ID' });
    return;
  }
  const [row] = await db
    .select()
    .from(carlotaReservationsTable)
    .where(eq(carlotaReservationsTable.id, id));
  if (!row) {
    res.status(404).json({ error: 'Appointment not found' });
    return;
  }
  res.json({ data: mapReservation(row) });
});

router.get('/booking/search', validateQuery(listQuerySchema), async (req, res) => {
  const query = (req.query.q as string) || '';
  const { ilike, or } = await import('drizzle-orm');
  const results = query
    ? await db
        .select()
        .from(carlotaReservationsTable)
        .where(
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
    status: (row.status === 'canceled' ? 'cancelled' : row.status) as
      | 'confirmed'
      | 'pending'
      | 'cancelled'
      | 'completed',
    advisor: 'Carlota J. Méndez',
    notes: row.notes ?? '',
  };
}

export default router;
