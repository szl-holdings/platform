/**
 * Brand-name regression tests
 *
 * Guards against accidental drift of product display names that have been
 * formally rebranded. These are pure config-import assertions — no DB, no
 * network, no mocks required.
 *
 * Context:
 *   - Task #1439 renamed "Counsel AI Research" → "AI Research Lab" (2026-04-23).
 *     The slug, route path, and appSlug remain "inca" — only display names changed.
 *   - If a future edit reverts the display name back to an Counsel-branded string,
 *     this test will catch it immediately.
 */

import { describe, it, expect } from 'vitest';
import { PLATFORM_APPS } from '@szl-holdings/platform-registry';

describe('brand-name regressions', () => {
  describe('inca / AI Research Lab', () => {
    const incaApp = PLATFORM_APPS.find((a) => a.slug === 'inca');

    it('has a registered entry for the inca slug', () => {
      expect(incaApp).toBeDefined();
    });

    it('display name is "AI Research Lab" — not the deprecated Counsel brand', () => {
      expect(incaApp?.name).toBe('AI Research Lab');
    });

    it('does not contain the deprecated "Counsel" string in the display name', () => {
      expect(incaApp?.name).not.toMatch(/Counsel/i);
    });
  });
});
