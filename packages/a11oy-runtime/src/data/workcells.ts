import type { Workcell } from '../types/index.js';

export interface UnavailableWorkcellSource {
  readonly state: 'UNAVAILABLE';
  readonly records: readonly Workcell[];
  readonly source: null;
  readonly observedAt: null;
  readonly reason: string;
}

/**
 * Production workcells must come from a current, authenticated operational
 * source. The repository does not currently provide one, so this registry
 * fails closed instead of exporting deterministic sample executions.
 */
export const OPERATIONAL_WORKCELLS: readonly Workcell[] = Object.freeze([]);

export const WORKCELL_SOURCE: UnavailableWorkcellSource = Object.freeze({
  state: 'UNAVAILABLE',
  records: OPERATIONAL_WORKCELLS,
  source: null,
  observedAt: null,
  reason:
    'No operational workcell repository or authenticated read route is configured for @workspace/a11oy-runtime.',
});

export const WORKCELL_MAP: Readonly<Record<string, Workcell | undefined>> = Object.freeze({});

export function getOperationalWorkcells(): UnavailableWorkcellSource {
  return WORKCELL_SOURCE;
}
