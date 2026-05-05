/**
 * Anthropic Content Moderation Hooks
 *
 * Pre-call and post-call content moderation hooks that run alongside every
 * Anthropic provider request. Claude refuses on its own for most safety
 * violations, but these hooks add an operator-side layer that:
 *   - Pre-hook: validates input against platform content rules before sending
 *   - Post-hook: validates output doesn't contain restricted patterns post-generation
 *
 * This is NOT a replacement for Claude's built-in safety — it is the operator-side
 * governance layer that matches our covenant policy architecture.
 */

export type ModerationSeverity = 'none' | 'low' | 'medium' | 'high' | 'critical';

export interface ModerationResult {
  allowed: boolean;
  severity: ModerationSeverity;
  flags: string[];
  reason?: string;
  latencyMs: number;
}

export interface ModerationContext {
  agentId?: string;
  tenantId?: string | number;
  lane?: string;
  requestId?: string;
}

type ModerationHook = (
  content: string,
  ctx: ModerationContext,
) => Promise<ModerationResult> | ModerationResult;

const _preHooks: ModerationHook[] = [];
const _postHooks: ModerationHook[] = [];

export function registerInputModerationHook(hook: ModerationHook): void {
  _preHooks.push(hook);
}

export function registerOutputModerationHook(hook: ModerationHook): void {
  _postHooks.push(hook);
}

const BLOCKED_PATTERNS: Array<{ pattern: RegExp; flag: string; severity: ModerationSeverity }> = [
  { pattern: /\b(CBRN|bioweapon|nerve agent|sarin|VX |anthrax synthesis)\b/i, flag: 'cbrn_risk', severity: 'critical' },
  { pattern: /\b(CSAM|child sexual abuse)\b/i, flag: 'csam', severity: 'critical' },
  { pattern: /\b(exploit|zero.?day|CVE-\d{4})\b.*\b(provide|write|generate|create)\b/i, flag: 'cyber_offense', severity: 'high' },
];

function runPatternCheck(content: string): Pick<ModerationResult, 'flags' | 'severity' | 'allowed' | 'reason'> {
  const flags: string[] = [];
  let maxSeverity: ModerationSeverity = 'none';
  const severityOrder: ModerationSeverity[] = ['none', 'low', 'medium', 'high', 'critical'];

  for (const rule of BLOCKED_PATTERNS) {
    if (rule.pattern.test(content)) {
      flags.push(rule.flag);
      if (severityOrder.indexOf(rule.severity) > severityOrder.indexOf(maxSeverity)) {
        maxSeverity = rule.severity;
      }
    }
  }

  const blocked = maxSeverity === 'critical' || maxSeverity === 'high';
  return {
    flags,
    severity: maxSeverity,
    allowed: !blocked,
    reason: blocked ? `Content flagged: ${flags.join(', ')}` : undefined,
  };
}

export async function runInputModeration(
  content: string,
  ctx: ModerationContext = {},
): Promise<ModerationResult> {
  const start = Date.now();

  const patternResult = runPatternCheck(content);
  if (!patternResult.allowed) {
    return { ...patternResult, latencyMs: Date.now() - start };
  }

  for (const hook of _preHooks) {
    try {
      const result = await hook(content, ctx);
      if (!result.allowed) {
        return { ...result, latencyMs: Date.now() - start };
      }
    } catch {
      /* hook failures are non-fatal — fail open */
    }
  }

  return {
    allowed: true,
    severity: 'none',
    flags: [],
    latencyMs: Date.now() - start,
  };
}

export async function runOutputModeration(
  content: string,
  ctx: ModerationContext = {},
): Promise<ModerationResult> {
  const start = Date.now();

  for (const hook of _postHooks) {
    try {
      const result = await hook(content, ctx);
      if (!result.allowed) {
        return { ...result, latencyMs: Date.now() - start };
      }
    } catch {
      /* hook failures are non-fatal — fail open */
    }
  }

  return {
    allowed: true,
    severity: 'none',
    flags: [],
    latencyMs: Date.now() - start,
  };
}

export function clearModerationHooks(): void {
  _preHooks.length = 0;
  _postHooks.length = 0;
}
