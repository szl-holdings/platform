/**
 * SZL Holdings · Ouroboros Gauß axis (operational port).
 *
 * Operational integration of @workspace/ouroboros-gauss primitives 17
 * (least-squares network adjustment) and 20 (residual goodness-of-fit)
 * into the api-server. The math primitives (Theoria combinationis 1823;
 * Theoria motus 1809) are public-domain Gauß; the SZL contribution is
 * the operational endpoint, the closure-axis mapping into the SIGIL
 * envelope, and the Zod-validated public API surface.
 */
export * from './least-squares.js';
export * from './residual-fit.js';
