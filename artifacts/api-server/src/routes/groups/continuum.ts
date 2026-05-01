/** Stub for continuum group — placeholder until full implementation lands. */
import type { IRouter } from 'express';

export function register(_router: IRouter): void {
  // No routes registered yet. Subroute handlers (e.g. continuum-policy-compiler)
  // are wired separately via lazyMatch in routes/index.ts.
}
