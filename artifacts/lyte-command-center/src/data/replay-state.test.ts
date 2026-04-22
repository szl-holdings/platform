/**
 * Tests for the Decision Replay step-through state machine.
 * See decision-replay.tsx for the React-side wiring.
 */
import { describe, expect, it } from 'vitest';
import {
  effectiveRevealed,
  INITIAL_REPLAY_STATE,
  isReplayMode,
  pauseReplay,
  resetReplay,
  resumeReplay,
  skipToEnd,
  startReplay,
  stepBack,
  stepForward,
  tick,
} from './replay-state';

const TOTAL = 5;

describe('replay-state — initial', () => {
  it('starts not in replay mode', () => {
    expect(isReplayMode(INITIAL_REPLAY_STATE)).toBe(false);
    expect(INITIAL_REPLAY_STATE.playing).toBe(false);
    expect(INITIAL_REPLAY_STATE.revealedCount).toBeNull();
  });

  it('treats all events as revealed when not in replay mode', () => {
    expect(effectiveRevealed(INITIAL_REPLAY_STATE, TOTAL)).toBe(TOTAL);
  });
});

describe('replay-state — start / pause / resume', () => {
  it('startReplay enters replay mode at cursor 0 and begins playing', () => {
    const next = startReplay();
    expect(isReplayMode(next)).toBe(true);
    expect(next.revealedCount).toBe(0);
    expect(next.playing).toBe(true);
    expect(effectiveRevealed(next, TOTAL)).toBe(0);
  });

  it('pauseReplay halts playback but preserves the cursor', () => {
    const playing = { revealedCount: 2, playing: true };
    const next = pauseReplay(playing);
    expect(next.playing).toBe(false);
    expect(next.revealedCount).toBe(2);
    expect(isReplayMode(next)).toBe(true);
  });

  it('resumeReplay re-enables playback when not at end', () => {
    const next = resumeReplay({ revealedCount: 2, playing: false }, TOTAL);
    expect(next.playing).toBe(true);
    expect(next.revealedCount).toBe(2);
  });

  it('resumeReplay refuses to play once cursor is at the end', () => {
    const next = resumeReplay({ revealedCount: TOTAL, playing: false }, TOTAL);
    expect(next.playing).toBe(false);
  });
});

describe('replay-state — stepForward', () => {
  it('advances the cursor by one', () => {
    const next = stepForward({ revealedCount: 2, playing: false }, TOTAL);
    expect(next.revealedCount).toBe(3);
  });

  it('clamps at totalEvents (cannot go past the end)', () => {
    const next = stepForward({ revealedCount: TOTAL, playing: false }, TOTAL);
    expect(next.revealedCount).toBe(TOTAL);
  });

  it('treats null cursor as 0 (so first step yields 1)', () => {
    const next = stepForward({ revealedCount: null, playing: false }, TOTAL);
    expect(next.revealedCount).toBe(1);
  });
});

describe('replay-state — stepBack', () => {
  it('moves the cursor back by one', () => {
    const next = stepBack({ revealedCount: 2, playing: false });
    expect(next.revealedCount).toBe(1);
  });

  it('clamps at 0 (cannot go negative)', () => {
    const next = stepBack({ revealedCount: 0, playing: false });
    expect(next.revealedCount).toBe(0);
  });

  it('treats null cursor as 0', () => {
    const next = stepBack({ revealedCount: null, playing: false });
    expect(next.revealedCount).toBe(0);
  });
});

describe('replay-state — skipToEnd / reset', () => {
  it('skipToEnd jumps cursor to total and stops playback', () => {
    const next = skipToEnd({ revealedCount: 2, playing: true }, TOTAL);
    expect(next.revealedCount).toBe(TOTAL);
    expect(next.playing).toBe(false);
  });

  it('resetReplay returns to initial (exits replay mode)', () => {
    const next = resetReplay();
    expect(next).toEqual(INITIAL_REPLAY_STATE);
    expect(isReplayMode(next)).toBe(false);
  });
});

describe('replay-state — tick (auto-play)', () => {
  it('advances the cursor each tick while not at end', () => {
    const next = tick({ revealedCount: 1, playing: true }, TOTAL);
    expect(next.revealedCount).toBe(2);
    expect(next.playing).toBe(true);
  });

  it('stops playback automatically once it reaches the end', () => {
    const next = tick({ revealedCount: TOTAL - 1, playing: true }, TOTAL);
    expect(next.revealedCount).toBe(TOTAL);
    expect(next.playing).toBe(false);
  });

  it('does not exceed totalEvents even if state is somehow past end', () => {
    const next = tick({ revealedCount: TOTAL + 5, playing: true }, TOTAL);
    expect(next.revealedCount).toBe(TOTAL);
    expect(next.playing).toBe(false);
  });

  it('treats null cursor as 0', () => {
    const next = tick({ revealedCount: null, playing: true }, TOTAL);
    expect(next.revealedCount).toBe(1);
  });
});

describe('replay-state — full lifecycle', () => {
  it('start → tick × N → auto-stops at end', () => {
    let s = startReplay();
    expect(s.revealedCount).toBe(0);
    for (let i = 0; i < TOTAL; i++) {
      s = tick(s, TOTAL);
    }
    expect(s.revealedCount).toBe(TOTAL);
    expect(s.playing).toBe(false);
  });

  it('start → pause → step back → resume continues from cursor', () => {
    let s = startReplay();
    s = tick(s, TOTAL); // 1
    s = tick(s, TOTAL); // 2
    s = pauseReplay(s);
    s = stepBack(s); // 1
    expect(s.revealedCount).toBe(1);
    expect(s.playing).toBe(false);
    s = resumeReplay(s, TOTAL);
    expect(s.playing).toBe(true);
    expect(s.revealedCount).toBe(1);
  });

  it('reset from any state returns to initial', () => {
    const playing = { revealedCount: 3, playing: true };
    expect(resetReplay()).toEqual(INITIAL_REPLAY_STATE);
    expect(resetReplay()).not.toEqual(playing);
  });
});
