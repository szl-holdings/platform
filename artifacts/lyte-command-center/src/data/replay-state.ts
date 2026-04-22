/**
 * Decision Replay step-through state machine.
 *
 * Pure functions extracted from decision-replay.tsx so the step-through
 * semantics (reveal count clamping, reset, tick auto-stop) can be unit-tested
 * independently of the React component.
 */

export interface ReplayState {
  revealedCount: number | null;
  playing: boolean;
}

export const INITIAL_REPLAY_STATE: ReplayState = {
  revealedCount: null,
  playing: false,
};

/** True when the user has entered replay mode (revealedCount is non-null). */
export function isReplayMode(state: ReplayState): boolean {
  return state.revealedCount !== null;
}

/**
 * Effective revealed count for rendering. When not in replay mode, all events
 * are considered revealed (mirrors the component's `currentRevealed` derived
 * value).
 */
export function effectiveRevealed(state: ReplayState, totalEvents: number): number {
  return state.revealedCount ?? totalEvents;
}

/** Begin a new replay from event 0, auto-playing. */
export function startReplay(): ReplayState {
  return { revealedCount: 0, playing: true };
}

/** Pause auto-play; preserves the reveal cursor. */
export function pauseReplay(state: ReplayState): ReplayState {
  return { ...state, playing: false };
}

/** Resume auto-play from the current cursor. No-op once we've reached the end. */
export function resumeReplay(state: ReplayState, totalEvents: number): ReplayState {
  const cursor = state.revealedCount ?? 0;
  if (cursor >= totalEvents) return { ...state, playing: false };
  return { ...state, playing: true };
}

/** Advance the reveal cursor by 1, clamped to totalEvents. */
export function stepForward(state: ReplayState, totalEvents: number): ReplayState {
  const next = Math.min((state.revealedCount ?? 0) + 1, totalEvents);
  return { ...state, revealedCount: next };
}

/** Move the reveal cursor back by 1, clamped to 0. */
export function stepBack(state: ReplayState): ReplayState {
  const next = Math.max((state.revealedCount ?? 0) - 1, 0);
  return { ...state, revealedCount: next };
}

/** Jump cursor to the end and stop playback. */
export function skipToEnd(_state: ReplayState, totalEvents: number): ReplayState {
  return { revealedCount: totalEvents, playing: false };
}

/** Exit replay mode entirely — cursor returns to "all revealed", playback off. */
export function resetReplay(): ReplayState {
  return INITIAL_REPLAY_STATE;
}

/**
 * Auto-play tick. Advances cursor and stops playback once the end is reached.
 * Mirrors the setInterval body in decision-replay.tsx.
 */
export function tick(state: ReplayState, totalEvents: number): ReplayState {
  const next = (state.revealedCount ?? 0) + 1;
  if (next >= totalEvents) {
    return { revealedCount: totalEvents, playing: false };
  }
  return { ...state, revealedCount: next };
}
