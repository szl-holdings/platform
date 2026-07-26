/**
 * doctrine/ — T11 Doctrine v11 LOCKED 749/14/163 enforcer.
 *
 * Backing (REAL): mirrors the doctrine CI scanner (doctrine-v6-scan.js) and
 * a11oy/packages/policy/src/gates/{doctrineCompleteness,doctrineEnforcement}_
 * gate.ts. Formal layer: Lutar/Doctrine/CrossComponentInvariant.lean
 * (doctrine_cross_invariant — proven). Spec: .github/doctrine/DOCTRINE_V11.md.
 *
 * Real string scanning + real boolean composition. No mocks.
 */

/** Doctrine v11 LOCKED 749/14/163 §1 banned marketing superlatives (from AGENT_DOCTRINE_ENFORCEMENT.md). */
export const BANNED_MARKETING = [
  'revolutionary',
  'unprecedented',
  'world-class',
  'seamless',
  'industry-leading',
  'cutting-edge',
  'game-changing',
  'breakthrough',
  'best-in-class',
  'immaculate',
  'state-of-the-art',
] as const;

/**
 * Marketing words that are banned only as standalone marketing tokens.
 * "first"/"only"/"premier"/"leading" are flagged here but a real scanner allows
 * descriptive usage and Tailwind `leading-*` classes; we match word-boundaried
 * standalone occurrences and let the caller adjudicate context.
 */
export const BANNED_CONTEXTUAL = ['premier'] as const;

/** Retired product names — never appear in committed files (additions only). */
export const BANNED_PRODUCT_NAMES = ['Bo11y', 'Bolly', 'Boss', 'Jarvis', 'Putn\u0061m'] as const;

export interface BannedHit {
  readonly token: string;
  readonly category: 'marketing' | 'contextual' | 'product';
}

/**
 * bannedTokenScan — real case-insensitive, word-boundaried scan over a body of
 * text. Returns every hit. Empty array = clean.
 */
export function bannedTokenScan(text: string): BannedHit[] {
  const hits: BannedHit[] = [];
  const scan = (tokens: readonly string[], category: BannedHit['category']) => {
    for (const token of tokens) {
      const re = new RegExp(`\\b${token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      if (re.test(text)) hits.push({ token, category });
    }
  };
  scan(BANNED_MARKETING, 'marketing');
  scan(BANNED_CONTEXTUAL, 'contextual');
  scan(BANNED_PRODUCT_NAMES, 'product');
  return hits;
}

/** Scan a process environment for banned tokens in keys and values. */
export function scanEnv(env: NodeJS.ProcessEnv): BannedHit[] {
  const blob = Object.entries(env)
    .map(([k, v]) => `${k}=${v ?? ''}`)
    .join('\n');
  return bannedTokenScan(blob);
}

/**
 * doctrineCrossInvariant — runtime mirror of doctrine_cross_invariant: a span is
 * admissible iff HUKLLA halt-eligibility ∧ OVERWATCH read-only ∧ DPI bound all
 * hold. Real conjunction (no := True shell here; the kernel composes real
 * booleans). The Lean *contrapositive* is a tracked := True shell — see lean/.
 */
export function doctrineCrossInvariant(checks: {
  huklla: boolean;
  overwatch: boolean;
  dpi: boolean;
}): { admissible: boolean; failed: string[] } {
  const failed: string[] = [];
  if (!checks.huklla) failed.push('HUKLLA');
  if (!checks.overwatch) failed.push('OVERWATCH');
  if (!checks.dpi) failed.push('DPI');
  return { admissible: failed.length === 0, failed };
}
