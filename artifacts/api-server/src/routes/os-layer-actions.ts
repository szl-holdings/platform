import {
  db,
  osRecommendationsTable,
} from '@szl-holdings/db';
import { eq } from 'drizzle-orm';
import { Router } from 'express';
import {
  handleRouteError,
  sendSuccess,
  sendNotFound,
  sendBadRequest,
} from '../lib/api-response';

const router = Router();

router.post('/v1/os/recommendations/:recId/action', async (req, res) => {
  try {
    const { recId } = req.params;
    const { action, justification } = req.body as {
      action: string;
      justification?: string;
    };

    const statusMap: Record<string, string> = {
      approve: 'approved',
      reject: 'rejected',
      escalate: 'escalated',
      rollback: 'rolled_back',
      defer: 'pending',
    };

    const newStatus = statusMap[action];
    if (!newStatus) {
      return sendBadRequest(res, `Invalid action: ${action}`);
    }

    const [existing] = await db
      .select()
      .from(osRecommendationsTable)
      .where(eq(osRecommendationsTable.recId, recId))
      .limit(1);

    if (!existing) {
      return sendNotFound(res, 'Recommendation');
    }

    const updatedData = {
      ...(existing.data as Record<string, unknown>),
      status: newStatus,
      ...(justification ? { justification } : {}),
      actionedAt: new Date().toISOString(),
    };

    await db
      .update(osRecommendationsTable)
      .set({
        status: newStatus,
        data: updatedData,
        updatedAt: new Date(),
      })
      .where(eq(osRecommendationsTable.recId, recId));

    sendSuccess(res, updatedData);
  } catch (err) {
    handleRouteError(res, err, 'Failed to action recommendation');
  }
});

export default router;
