/**
 * @workspace/lutar-formulas — canonical TypeScript port of the
 * SZL/Lutar formula corpus.
 *
 * This package consolidates formulas previously scattered across:
 *   - papers/paper-01-lutar-omega-formalism.tex   (L_Ω hierarchy)
 *   - papers/paper-09-propeller-sota-routing.tex  (Propeller P_Λ)
 *   - papers/paper-10-ultra-routing-xi-unification.tex (Ξ unification)
 *   - vendor/ouroboros-py/ouroboros/invariant.py  (Λ, Λ₅)
 *   - attached_assets/Pasted-…A11OY-CHAT-ULTRA…           (Ξ + arbitrage)
 *
 * It exposes one ergonomic surface for every artifact (Sentra, A11oy,
 * Rosie, Counsel, etc.) so scoring, routing, and proof emission share a
 * single source of truth.
 *
 * Authored by Stephen P. Lutar Jr. <stephen@szlholdings.com> / SZL Consulting Ltd. CC BY 4.0.
 */
export * from './lutar.js';
export * from './omega.js';
export * from './propeller.js';
export * from './arbitrage.js';
export * from './xi.js';
export * from './router.js';
