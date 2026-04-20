import type { IRouter } from 'express';
import { register as registerActions } from './actions.js';
import { register as registerMonitoring, startSyncScheduler } from './monitoring.js';
import { register as registerPlaybooks } from './playbooks.js';
import { register as registerProviders } from './providers.js';

export { startSyncScheduler };

export function register(router: IRouter): void {
  registerProviders(router);
  registerActions(router);
  registerPlaybooks(router);
  registerMonitoring(router);
}
