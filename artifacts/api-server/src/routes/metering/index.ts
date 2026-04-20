import type { IRouter } from 'express';
import { register as registerAnalytics } from './analytics.js';
import { register as registerBilling } from './billing.js';
import { register as registerEvents } from './events.js';
import { register as registerRateCards } from './rate-cards.js';

export function register(router: IRouter): void {
  registerEvents(router);
  registerRateCards(router);
  registerBilling(router);
  registerAnalytics(router);
}
