// Deeper coverage for @szl-holdings/design-system — the 100+ file design
// language used by every authenticated cockpit surface. We do not attempt to
// import the full barrel (it pulls react/jsx/css) but exercise the
// framework-agnostic core: design tokens, the cn() className helper, and the
// Continuum→ProofEnvelope bridge that wires runtime contracts to UI states.
import { describe, expect, it } from 'vitest';

import { color } from '../../packages/design-system/src/tokens/index.ts';
import { spacing } from '../../packages/design-system/src/tokens/spacing.ts';
import { v } from '../../packages/design-system/src/tokens/vars.ts';
import { cn } from '../../packages/design-system/src/utils.ts';
import {
  ledgerEntriesToEvidence,
  runStateToFreshnessLevel,
  runStatusToPolicyState,
} from '../../packages/design-system/src/continuum-bridge.ts';

describe('design-system / tokens', () => {
  it('color palette is the AEEP v3 warm-light defaults', () => {
    expect(color.bg.base).toMatch(/^#[0-9A-Fa-f]{6}$/);
    expect(color.text.primary).toMatch(/^#[0-9A-Fa-f]{6}$/);
    // Gold is the canonical primary accent.
    expect(color.border.focus.toLowerCase()).toBe('#c9b787');
  });

  it('spacing scale is the documented 8px progression', () => {
    expect(spacing[0]).toBe('0px');
    expect(spacing[1]).toBe('8px');
    expect(spacing[2]).toBe('16px');
    expect(spacing[4]).toBe('32px');
    expect(spacing[8]).toBe('64px');
  });

  it('CSS-variable bindings reference gi-* custom properties', () => {
    expect(v.bgBase).toBe('var(--gi-bg-base)');
    expect(v.textPrimary).toBe('var(--gi-text-primary)');
    expect(v.accentGold).toBe('var(--gi-accent-gold)');
    expect(v.stateBlocked).toBe('var(--gi-state-blocked)');
  });
});

describe('design-system / cn() className helper', () => {
  it('joins strings', () => {
    expect(cn('a', 'b', 'c')).toBe('a b c');
  });

  it('drops falsy values', () => {
    expect(cn('a', false, null, undefined, 0, 'b')).toBe('a b');
  });

  it('honors twMerge conflict resolution (last writer wins)', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4');
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
  });
});

describe('design-system / continuum-bridge', () => {
  it('maps RunStatus → PolicyState', () => {
    expect(runStatusToPolicyState('awaiting-approval' as never)).toBe('requires-approval');
    expect(runStatusToPolicyState('failed' as never)).toBe('blocked');
    expect(runStatusToPolicyState('rolled-back' as never)).toBe('blocked');
    expect(runStatusToPolicyState('running' as never)).toBe('allowed');
    expect(runStatusToPolicyState('succeeded' as never)).toBe('allowed');
  });

  it('runStateToFreshnessLevel buckets by age', () => {
    const now = Date.now();
    const fresh = { updatedAt: new Date(now - 60_000).toISOString() } as never;
    const aging = { updatedAt: new Date(now - 10 * 60_000).toISOString() } as never;
    const stale = { updatedAt: new Date(now - 4 * 60 * 60_000).toISOString() } as never;
    const unknown = { updatedAt: 'not a date' } as never;
    expect(runStateToFreshnessLevel(fresh)).toBe('fresh');
    expect(runStateToFreshnessLevel(aging)).toBe('aging');
    expect(runStateToFreshnessLevel(stale)).toBe('stale');
    expect(runStateToFreshnessLevel(unknown)).toBe('unknown');
  });

  it('ledgerEntriesToEvidence filters to tool-call + approval entries', () => {
    const entries = [
      { entryId: '1', type: 'tool-call', description: 'fetch', timestamp: 't1', metadata: {} },
      { entryId: '2', type: 'approval', description: 'sign-off', timestamp: 't2', metadata: { summary: 'ok' } },
      { entryId: '3', type: 'note', description: 'skip', timestamp: 't3', metadata: {} },
    ] as never[];
    const evidence = ledgerEntriesToEvidence(entries);
    expect(evidence).toHaveLength(2);
    expect(evidence.map((e) => e.id)).toEqual(['1', '2']);
    expect(evidence[1].type).toBe('user');
    expect(evidence[1].excerpt).toBe('ok');
  });
});
