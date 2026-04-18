import { type IRouter } from "express";
import { register as registerCrud } from "./crud.js";
import { register as registerIncidentsAlerts } from "./incidents-alerts.js";
import { register as registerLive } from "./live.js";
import { register as registerAssetsCases } from "./assets-cases.js";

export function register(router: IRouter): void {
  registerCrud(router);
  registerIncidentsAlerts(router);
  registerLive(router);
  registerAssetsCases(router);
}
