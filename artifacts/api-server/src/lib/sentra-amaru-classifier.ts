/**
 * Sentra detector framework → Amaru cortex classification / enrichment.
 *
 * Per the detector framework spec (`AMARU_HOOK`), the framework used to
 * trust the detector-emitted severity verbatim. This module is the
 * cortex pass that re-scores and tags each finding before it reaches
 * the alerts/queue surface and before the A11oy handoff fires.
 *
 * Doctrine: Amaru is read-only (R0513 OVERWATCH). We pull adversary
 * context from the sidecar via the GET-only `/overwatch/snapshot` and
 * `/tripwires` surfaces, then apply deterministic rules in-process. We
 * never POST to the cortex from here.
 *
 * If the sidecar is unreachable we degrade gracefully: findings keep
 * their detector-emitted severity and are tagged
 * `mode: 'amaru-unavailable'` so reviewers can see the pass ran (and
 * why it was a no-op).
 */
import type {
  Finding,
  FindingSeverity,
} from '@szl-holdings/sentra-detector-sdk';
import { HANDOFF_RANK } from '@szl-holdings/sentra-detector-sdk';
import { logger } from './logger';

export type AmaruClassificationMode =
  | 'amaru-cortex'
  | 'amaru-unavailable'
  | 'amaru-disabled';

export interface AmaruClassification {
  mode: AmaruClassificationMode;
  /** Short human-readable reason for the (non-)override. */
  reason: string;
  /** Adversary tags inherited from active Amaru tripwires / overwatch. */
  adversaryTags?: string[];
  /** Raw signals used by the rule pass, surfaced for the trace view. */
  signals?: Record<string, unknown>;
  /** Number of severity steps bumped (positive = up, negative = down). */
  bumpedSteps?: number;
}

export interface ClassifiedFinding {
  /** The finding AFTER cortex override (mutated severity/score). */
  finding: Finding;
  classifiedAt: string;
  /** Set only when the cortex actually changed severity/score. */
  originalSeverity?: FindingSeverity;
  originalScoreBps?: number;
  classification: AmaruClassification;
}

const SEVERITY_ORDER: readonly FindingSeverity[] = [
  'info',
  'low',
  'medium',
  'high',
  'critical',
] as const;

function bumpSeverity(s: FindingSeverity, steps: number): FindingSeverity {
  const idx = SEVERITY_ORDER.indexOf(s);
  const next = Math.max(
    0,
    Math.min(SEVERITY_ORDER.length - 1, idx + steps),
  );
  return SEVERITY_ORDER[next] as FindingSeverity;
}

/**
 * Score is stored as basis-points (0..10_000); bump it in lockstep with
 * the severity so the queue view's numeric rank stays consistent with
 * the categorical label. We clamp to [0, 1].
 */
function bumpScore(score: number, steps: number): number {
  // Each severity step ≈ 0.15 — enough that the queue re-sorts, small
  // enough that a 1-step bump from `medium` doesn't pin to 1.0.
  const next = score + steps * 0.15;
  return Math.max(0, Math.min(1, next));
}

interface AmaruTripwire {
  id?: string;
  technique?: string;
  attackTechnique?: string;
  attackTechniques?: string[];
  status?: string;
  state?: string;
  armed?: boolean;
  adversary?: string;
  tag?: string;
  tags?: string[];
}

interface AmaruOverwatchSnapshot {
  alertLevel?: string;
  alert_level?: string;
  adversaries?: Array<{ id?: string; tag?: string; techniques?: string[] }>;
  activeAdversaries?: string[];
  techniques?: string[];
}

interface AmaruContext {
  tripwires: AmaruTripwire[];
  overwatch: AmaruOverwatchSnapshot | null;
}

const DEFAULT_AMARU_BASE =
  process.env.AMARU_BASE_URL ??
  `http://127.0.0.1:${process.env.AMARU_PORT ?? '6810'}`;

async function fetchJson<T>(url: string, timeoutMs: number): Promise<T | null> {
  try {
    const r = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!r.ok) return null;
    return (await r.json()) as T;
  } catch {
    return null;
  }
}

export async function fetchAmaruContext(
  baseUrl: string = DEFAULT_AMARU_BASE,
  timeoutMs = 1_500,
): Promise<AmaruContext | null> {
  const [tripwiresRaw, overwatch] = await Promise.all([
    fetchJson<{ tripwires?: AmaruTripwire[] } | AmaruTripwire[]>(
      `${baseUrl}/tripwires`,
      timeoutMs,
    ),
    fetchJson<AmaruOverwatchSnapshot>(
      `${baseUrl}/overwatch/snapshot`,
      timeoutMs,
    ),
  ]);
  if (tripwiresRaw === null && overwatch === null) return null;
  const tripwires = Array.isArray(tripwiresRaw)
    ? tripwiresRaw
    : (tripwiresRaw?.tripwires ?? []);
  return { tripwires: tripwires ?? [], overwatch: overwatch ?? null };
}

function isArmed(tw: AmaruTripwire): boolean {
  if (tw.armed === true) return true;
  const s = (tw.status ?? tw.state ?? '').toString().toLowerCase();
  return s === 'armed' || s === 'active' || s === 'triggered' || s === 'tripped';
}

function tripwireTechniques(tw: AmaruTripwire): string[] {
  const out = new Set<string>();
  if (tw.technique) out.add(tw.technique);
  if (tw.attackTechnique) out.add(tw.attackTechnique);
  for (const t of tw.attackTechniques ?? []) out.add(t);
  return Array.from(out);
}

function adversariesFromOverwatch(ow: AmaruOverwatchSnapshot | null): string[] {
  if (!ow) return [];
  const tags = new Set<string>();
  for (const a of ow.adversaries ?? []) {
    if (a.tag) tags.add(a.tag);
    if (a.id) tags.add(a.id);
  }
  for (const t of ow.activeAdversaries ?? []) tags.add(t);
  return Array.from(tags);
}

function overwatchTechniques(ow: AmaruOverwatchSnapshot | null): string[] {
  if (!ow) return [];
  const out = new Set<string>(ow.techniques ?? []);
  for (const a of ow.adversaries ?? []) {
    for (const t of a.techniques ?? []) out.add(t);
  }
  return Array.from(out);
}

function alertLevelBump(ow: AmaruOverwatchSnapshot | null): number {
  const lvl = (ow?.alertLevel ?? ow?.alert_level ?? '').toString().toLowerCase();
  if (lvl === 'red' || lvl === 'critical') return 1;
  return 0;
}

/** Classify a single finding given an Amaru context snapshot. */
export function classifyFindingWithContext(
  finding: Finding,
  ctx: AmaruContext | null,
): ClassifiedFinding {
  const classifiedAt = new Date().toISOString();
  if (!ctx) {
    return {
      finding,
      classifiedAt,
      classification: {
        mode: 'amaru-unavailable',
        reason: 'Amaru cortex sidecar did not respond; keeping detector severity.',
      },
    };
  }

  const findingTechniques = new Set(finding.attackTechniques ?? []);
  const armedTripwires = ctx.tripwires.filter(isArmed);

  const matchingTripwires = armedTripwires.filter((tw) =>
    tripwireTechniques(tw).some((t) => findingTechniques.has(t)),
  );

  const adversaryTags = new Set<string>();
  for (const tw of matchingTripwires) {
    if (tw.adversary) adversaryTags.add(tw.adversary);
    if (tw.tag) adversaryTags.add(tw.tag);
    for (const t of tw.tags ?? []) adversaryTags.add(t);
  }
  const owTechniques = new Set(overwatchTechniques(ctx.overwatch));
  const techniqueInOverwatch = Array.from(findingTechniques).some((t) =>
    owTechniques.has(t),
  );
  if (techniqueInOverwatch) {
    for (const t of adversariesFromOverwatch(ctx.overwatch)) {
      adversaryTags.add(t);
    }
  }

  let steps = 0;
  const reasons: string[] = [];
  if (matchingTripwires.length > 0) {
    steps += 1;
    reasons.push(
      `${matchingTripwires.length} armed tripwire(s) match attack technique`,
    );
  }
  if (techniqueInOverwatch) {
    steps += 1;
    reasons.push('technique observed in active OVERWATCH window');
  }
  const lvlBump = alertLevelBump(ctx.overwatch);
  if (lvlBump > 0) {
    steps += lvlBump;
    reasons.push('OVERWATCH alert level elevated');
  }
  // Cap at +2 — we don't want a chain of weak signals to leap from
  // info → critical in one pass.
  steps = Math.min(steps, 2);

  if (steps === 0) {
    return {
      finding: { ...finding },
      classifiedAt,
      classification: {
        mode: 'amaru-cortex',
        reason:
          adversaryTags.size > 0
            ? 'No bump; enriched with adversary context.'
            : 'No bump; no active Amaru signals match this finding.',
        adversaryTags: Array.from(adversaryTags),
        signals: {
          armedTripwireCount: armedTripwires.length,
          matchingTripwireCount: matchingTripwires.length,
          techniqueInOverwatch,
          overwatchAlertLevel:
            ctx.overwatch?.alertLevel ?? ctx.overwatch?.alert_level ?? null,
        },
        bumpedSteps: 0,
      },
    };
  }

  const newSeverity = bumpSeverity(finding.severity, steps);
  const newScore = bumpScore(finding.score, steps);
  const overridden =
    HANDOFF_RANK[newSeverity] !== HANDOFF_RANK[finding.severity] ||
    newScore !== finding.score;
  return {
    finding: {
      ...finding,
      severity: newSeverity,
      score: newScore,
    },
    classifiedAt,
    ...(overridden
      ? {
          originalSeverity: finding.severity,
          originalScoreBps: Math.round(finding.score * 10_000),
        }
      : {}),
    classification: {
      mode: 'amaru-cortex',
      reason: reasons.join('; '),
      adversaryTags: Array.from(adversaryTags),
      signals: {
        armedTripwireCount: armedTripwires.length,
        matchingTripwireCount: matchingTripwires.length,
        techniqueInOverwatch,
        overwatchAlertLevel:
          ctx.overwatch?.alertLevel ?? ctx.overwatch?.alert_level ?? null,
      },
      bumpedSteps: steps,
    },
  };
}

export interface ClassifyOptions {
  /** Override the sidecar URL (tests). */
  baseUrl?: string;
  /** Inject a pre-fetched context (tests). */
  context?: AmaruContext | null;
  /** Set to `false` to skip the pass entirely (returns 'amaru-disabled'). */
  enabled?: boolean;
  timeoutMs?: number;
}

/**
 * Classify every finding in a detector run. Returns a parallel array of
 * `ClassifiedFinding`s; ordering matches the input.
 */
export async function classifyFindings(
  findings: Finding[],
  opts: ClassifyOptions = {},
): Promise<ClassifiedFinding[]> {
  if (findings.length === 0) return [];
  const enabled =
    opts.enabled ??
    (process.env.SENTRA_AMARU_CLASSIFY_DISABLED !== '1' &&
      process.env.SENTRA_AMARU_CLASSIFY_DISABLED !== 'true');
  if (!enabled) {
    const ts = new Date().toISOString();
    return findings.map((f) => ({
      finding: f,
      classifiedAt: ts,
      classification: {
        mode: 'amaru-disabled' as const,
        reason:
          'Cortex classification pass disabled via SENTRA_AMARU_CLASSIFY_DISABLED.',
      },
    }));
  }
  let ctx: AmaruContext | null;
  if (opts.context !== undefined) {
    ctx = opts.context;
  } else {
    ctx = await fetchAmaruContext(opts.baseUrl, opts.timeoutMs);
    if (ctx === null) {
      logger.debug(
        { findingCount: findings.length },
        '[sentra-amaru-classifier] cortex sidecar unavailable; degrading to no-op pass',
      );
    }
  }
  return findings.map((f) => classifyFindingWithContext(f, ctx));
}
