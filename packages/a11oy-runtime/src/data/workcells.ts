import type { Workcell } from '../types/index.js';

export type OperationalSourceState =
  | 'REAL'
  | 'DEMO'
  | 'UNAVAILABLE'
  | 'DEGRADED'
  | 'BLOCKED'
  | 'ROADMAP';

interface OperationalWorkcellSourceBase {
  readonly state: OperationalSourceState;
  readonly records: readonly Workcell[];
  readonly reason: string;
}

export interface ObservedWorkcellSource extends OperationalWorkcellSourceBase {
  readonly state: 'REAL' | 'DEMO' | 'DEGRADED';
  readonly source: string;
  readonly observedAt: string;
}

export interface EmptyWorkcellSource extends OperationalWorkcellSourceBase {
  readonly state: 'UNAVAILABLE' | 'BLOCKED' | 'ROADMAP';
  readonly records: readonly [];
  readonly source: null;
  readonly observedAt: null;
}

export type OperationalWorkcellSource = ObservedWorkcellSource | EmptyWorkcellSource;

/**
 * Production workcells must come from a current, authenticated operational
 * source. The repository does not currently provide one, so this registry
 * fails closed instead of exporting deterministic sample executions.
 */
export const OPERATIONAL_WORKCELLS: readonly [] = Object.freeze([]) as readonly [];

export const WORKCELL_SOURCE: EmptyWorkcellSource = Object.freeze({
  state: 'UNAVAILABLE',
  records: OPERATIONAL_WORKCELLS,
  source: null,
  observedAt: null,
  reason:
    'No operational workcell repository or authenticated read route is configured for @workspace/a11oy-runtime.',
});

export const WORKCELL_MAP: Readonly<Record<string, Workcell | undefined>> = Object.freeze({});

export function getOperationalWorkcells(): OperationalWorkcellSource {
  return WORKCELL_SOURCE;
}
