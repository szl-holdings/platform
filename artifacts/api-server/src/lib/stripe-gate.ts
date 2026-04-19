/**
 * Centralized Stripe live-mode gate.
 *
 * All Stripe-mutating routes MUST pass through requireStripeLive before
 * executing any Stripe SDK call.  This enforces two invariants:
 *
 *   1. live_stripe_billing_enabled flag is ON           → live billing active
 *   2. STRIPE_SECRET_KEY starts with "sk_live_"         → real key present
 *
 * When the flag is OFF the middleware short-circuits with a structured demo
 * response so the calling route never executes. When the flag is ON but the
 * key is absent or is a test-mode key the middleware fails closed with a
 * 503 error — there is no silent fallback to demo mode.
 *
 * Routes that already have their own `if (!services.stripe.isLive)` demo
 * branches retain those branches as belt-and-suspenders guards; they become
 * unreachable in normal operation once this middleware is applied.
 */

import type { Request, Response, NextFunction } from "express";
import { isFlagEnabled } from "./platform-flags";
import { logger } from "./logger";

function sendJson(res: Response, status: number, body: object): void {
  res.status(status).json(body);
}

export async function requireStripeLive(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const enabled = await isFlagEnabled("live_stripe_billing_enabled");

    if (!enabled) {
      logger.debug({ path: req.path }, "[stripe-gate] live_stripe_billing_enabled is OFF — returning demo response");
      sendJson(res, 200, {
        demo: true,
        sessionId: `demo_session_${Date.now()}`,
        url: null,
        message:
          "Demo mode: live_stripe_billing_enabled flag is OFF. Enable the flag and configure STRIPE_SECRET_KEY (sk_live_*) to activate live payments.",
      });
      return;
    }

    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      logger.error({ path: req.path }, "[stripe-gate] live_stripe_billing_enabled is ON but STRIPE_SECRET_KEY is not set");
      sendJson(res, 503, {
        error: "STRIPE_SECRET_KEY is not configured. Set a sk_live_* key to enable live billing.",
        code: "STRIPE_KEY_MISSING",
      });
      return;
    }

    if (!key.startsWith("sk_live_")) {
      logger.error({ path: req.path }, "[stripe-gate] live_stripe_billing_enabled is ON but STRIPE_SECRET_KEY is a test-mode key");
      sendJson(res, 503, {
        error:
          "live_stripe_billing_enabled is ON but STRIPE_SECRET_KEY is not a live-mode key (sk_live_*). Deactivate the flag or supply a live key.",
        code: "STRIPE_KEY_NOT_LIVE",
      });
      return;
    }

    next();
  } catch (err) {
    logger.error({ err }, "[stripe-gate] Failed to evaluate Stripe live gate — failing closed");
    sendJson(res, 503, {
      error: "Billing gate evaluation failed. Please try again.",
      code: "STRIPE_GATE_ERROR",
    });
  }
}
