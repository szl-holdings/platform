import { type IRouter, Router } from 'express';
import { register as registerAssetsCases } from './assets-cases.js';
import { register as registerCrud } from './crud.js';
import { register as registerIncidentsAlerts } from './incidents-alerts.js';
import { register as registerLive } from './live.js';
import { register as registerAdversaryEmulation } from './adversary-emulation.js';

export function register(router: IRouter): void {
  registerCrud(router);
  registerIncidentsAlerts(router);
  registerLive(router);
  registerAssetsCases(router);
  registerAdversaryEmulation(router);
}

const router = Router();
register(router);
export default router;
