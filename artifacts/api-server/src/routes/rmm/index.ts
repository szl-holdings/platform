import { type IRouter } from "express";
import { register as registerProviders } from "./providers.js";
import { register as registerActions } from "./actions.js";
import { register as registerPlaybooks } from "./playbooks.js";
import { register as registerMonitoring } from "./monitoring.js";
import { startSyncScheduler } from "./shared.js";

export { startSyncScheduler };

export function register(router: IRouter): void {
  registerProviders(router);
  registerActions(router);
  registerPlaybooks(router);
  registerMonitoring(router);
}
