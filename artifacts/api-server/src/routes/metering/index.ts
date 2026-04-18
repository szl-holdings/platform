import { type IRouter } from "express";
import { register as registerEvents } from "./events.js";
import { register as registerRateCards } from "./rate-cards.js";
import { register as registerBilling } from "./billing.js";
import { register as registerAnalytics } from "./analytics.js";

export function register(router: IRouter): void {
  registerEvents(router);
  registerRateCards(router);
  registerBilling(router);
  registerAnalytics(router);
}
