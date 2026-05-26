import { describe, it, expect } from 'vitest';
import {
  __testables as t,
} from '../../scripts/refresh-leaderboards-helpers';

describe('refresh-leaderboards helpers', () => {
  describe('extractNextData', () => {
    it('parses the JSON blob from a __NEXT_DATA__ script', () => {
      const html =
        '<html><body><script id="__NEXT_DATA__" type="application/json">{"foo":42,"bar":["a"]}</script></body></html>';
      expect(t.extractNextData(html)).toEqual({ foo: 42, bar: ['a'] });
    });

    it('returns null when the marker is absent', () => {
      expect(t.extractNextData('<html></html>')).toBeNull();
    });

    it('returns null when the JSON is malformed instead of throwing', () => {
      const html = '<script id="__NEXT_DATA__">{not json}</script>';
      expect(t.extractNextData(html)).toBeNull();
    });
  });

  describe('findLeaderboardArray', () => {
    it('finds the first array of {model, score}-shaped rows', () => {
      const root = {
        nested: {
          rows: [
            { model: 'A', score: 0.9 },
            { model: 'B', score: 0.8 },
            { model: 'C', score: 0.7 },
          ],
        },
      };
      const out = t.findLeaderboardArray(root, ['model'], ['score']);
      expect(out).toEqual([
        { model: 'A', resolved: 0.9 },
        { model: 'B', resolved: 0.8 },
        { model: 'C', resolved: 0.7 },
      ]);
    });

    it('returns null when no suitable array exists', () => {
      expect(t.findLeaderboardArray({ x: 1 }, ['model'], ['score'])).toBeNull();
    });

    it('rejects arrays where required keys are missing on any row', () => {
      const root = {
        rows: [
          { model: 'A', score: 0.9 },
          { model: 'B' },
          { model: 'C', score: 0.7 },
        ],
      };
      expect(t.findLeaderboardArray(root, ['model'], ['score'])).toBeNull();
    });
  });

  describe('normaliseEntries', () => {
    it('clamps percent-valued scores into [0,1] and sorts desc', () => {
      const out = t.normaliseEntries(
        [
          { model: 'A', resolved: 85 }, // percentage
          { model: 'B', resolved: 0.92 }, // fraction
          { model: 'C', resolved: 0.5 },
        ],
        10,
      );
      expect(out[0]).toEqual({ model: 'B', resolved: 0.92 });
      expect(out[1]).toEqual({ model: 'A', resolved: 0.85 });
      expect(out[2]).toEqual({ model: 'C', resolved: 0.5 });
    });

    it('drops entries with missing or out-of-range values', () => {
      const out = t.normaliseEntries(
        [
          { model: 'good', resolved: 0.9 },
          { model: 'nan', resolved: Number.NaN },
          { model: '', resolved: 0.5 },
          { model: 'too-big', resolved: 250 },
        ],
        10,
      );
      expect(out).toEqual([{ model: 'good', resolved: 0.9 }]);
    });

    it('de-duplicates by model name, keeping the highest score', () => {
      const out = t.normaliseEntries(
        [
          { model: 'X', resolved: 0.5 },
          { model: 'X', resolved: 0.9 },
          { model: 'Y', resolved: 0.7 },
        ],
        10,
      );
      expect(out).toEqual([
        { model: 'X', resolved: 0.9 },
        { model: 'Y', resolved: 0.7 },
      ]);
    });

    it('truncates to topN', () => {
      const out = t.normaliseEntries(
        Array.from({ length: 20 }, (_, i) => ({ model: `M${i}`, resolved: 0.5 + i / 100 })),
        5,
      );
      expect(out).toHaveLength(5);
      expect(out[0].model).toBe('M19');
    });
  });

  describe('shouldSkipWrite', () => {
    const entries = [
      { model: 'A', resolved: 0.9 },
      { model: 'B', resolved: 0.8 },
    ];

    it('returns false when there is no existing snapshot', () => {
      expect(
        t.shouldSkipWrite({
          existingEntries: undefined,
          existingDate: undefined,
          nextEntries: entries,
          today: '2026-05-26',
        }),
      ).toBe(false);
    });

    it('returns false when entries match but the existing date is stale', () => {
      // Regression: previously this returned "unchanged" and never bumped
      // snapshotTakenAt, so a quiet leaderboard would silently look stale
      // forever. The refresher exists to prevent exactly that.
      expect(
        t.shouldSkipWrite({
          existingEntries: entries,
          existingDate: '2026-01-01',
          nextEntries: entries,
          today: '2026-05-26',
        }),
      ).toBe(false);
    });

    it('returns false when the date is current but entries changed', () => {
      expect(
        t.shouldSkipWrite({
          existingEntries: entries,
          existingDate: '2026-05-26',
          nextEntries: [{ model: 'A', resolved: 0.95 }, { model: 'B', resolved: 0.8 }],
          today: '2026-05-26',
        }),
      ).toBe(false);
    });

    it('returns true only when entries match AND existing date is already today (or newer)', () => {
      expect(
        t.shouldSkipWrite({
          existingEntries: entries,
          existingDate: '2026-05-26',
          nextEntries: entries,
          today: '2026-05-26',
        }),
      ).toBe(true);
      expect(
        t.shouldSkipWrite({
          existingEntries: entries,
          existingDate: '2026-06-01',
          nextEntries: entries,
          today: '2026-05-26',
        }),
      ).toBe(true);
    });
  });
});
