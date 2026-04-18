import { type IRouter } from "express";
import { register as registerContentCrud } from "./content-crud.js";
import { register as registerPublishing } from "./publishing.js";
import { register as registerPlatformAnalytics } from "./platform-analytics.js";

export function register(router: IRouter): void {
  registerContentCrud(router);
  registerPublishing(router);
  registerPlatformAnalytics(router);
}
