import { type IRouter, type Request, type Response, Router } from 'express';
import { handleRouteError } from '../lib/api-response';
import { authMiddleware } from '../middlewares/auth';
import { computeStatus } from '../services/infrastructure-service';

const router: IRouter = Router();

router.get(
  '/infrastructure/status',
  authMiddleware({ required: false }),
  (_req: Request, res: Response) => {
    try {
      res.json(computeStatus());
    } catch (err) {
      handleRouteError(res, err, 'Failed to fetch infrastructure status');
    }
  },
);

export default router;
