/**
 * Canonical policy registry for `evaluate()`.
 *
 * The values are loaded from `artifacts/a11oy/src/data/runtimePolicies.json`
 * — the SAME file the A11oy artifact UI reads when rendering the
 * operations / policy fabric. There is one source of truth; this module
 * is a thin TS adapter that normalizes the JSON into the runtime's
 * `EvaluatePolicy` shape and exposes `resolvePolicy(vertical, action)`.
 *
 * If you change a threshold or add a force-deny rule, edit the JSON file
 * — do NOT hardcode values here.
 */
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// Locate the canonical fabric file from the A11oy artifact. We resolve
// relative to THIS module's URL so the path works whether the runtime
// runs from `src/` (vite/tsx) or from compiled `dist/`.
const __thisDir = dirname(fileURLToPath(import.meta.url));
const FABRIC_PATH = resolve(
  __thisDir,
  // From either `packages/a11oy-runtime/src/` or `packages/a11oy-runtime/dist/`,
  // climb to repo root then into the A11oy artifact's data directory.
  '../../../artifacts/a11oy/src/data/runtimePolicies.json',
);
const policyFabric: unknown = JSON.parse(readFileSync(FABRIC_PATH, 'utf8'));

export type Vertical =
  | 'vessels'
  | 'terra'
  | 'counsel'
  | 'carlota-jo'
  | 'sentra'
  | 'a11oy'
  | 'conduit'
  | 'firestorm'
  | 'platform'
  | 'szl-holdings';

export type ActionKind = 'read' | 'write' | 'execute';

export interface EvaluatePolicy {
  id: string;
  /** Λ ≥ allowThreshold → allow. */
  allowThreshold: number;
  /** Λ ≥ escalateThreshold (and < allowThreshold) → escalate. */
  escalateThreshold: number;
  /** Routing target when verdict is `escalate`. */
  escalateTo: string;
  /** Hard deny regardless of Λ (e.g. data-purge in compliance verticals). */
  forceDeny?: boolean;
  /** Human-readable reason surfaced on deny. */
  denyReason?: string;
}

interface PolicyFabricFile {
  verticals: Vertical[];
  actionKinds: ActionKind[];
  actionClassification: Partial<Record<ActionKind, string[]>>;
  defaults: Record<ActionKind, { allowThreshold: number; escalateThreshold: number; escalateTo: string }>;
  overrides: Partial<Record<Vertical, Partial<Record<ActionKind, Partial<EvaluatePolicy>>>>>;
  forceDeny: Array<{ vertical?: Vertical; pattern: string; flags?: string; reason: string }>;
}

const FABRIC = policyFabric as unknown as PolicyFabricFile;

export const ALL_VERTICALS: ReadonlyArray<Vertical> = FABRIC.verticals;
export const ALL_ACTION_KINDS: ReadonlyArray<ActionKind> = FABRIC.actionKinds;

const EXECUTE_HINTS = FABRIC.actionClassification.execute ?? [];
const WRITE_HINTS = FABRIC.actionClassification.write ?? [];

function classifyAction(action: string): ActionKind {
  const a = action.toLowerCase();
  if (EXECUTE_HINTS.some((h) => a.includes(h))) return 'execute';
  if (WRITE_HINTS.some((h) => a.includes(h))) return 'write';
  return 'read';
}

const FORCE_DENY: Array<{ vertical?: Vertical; pattern: RegExp; reason: string }> = FABRIC.forceDeny.map(
  (r) => ({
    ...(r.vertical ? { vertical: r.vertical } : {}),
    pattern: new RegExp(r.pattern, r.flags ?? ''),
    reason: r.reason,
  }),
);

export function resolvePolicy(vertical: Vertical, action: string): EvaluatePolicy {
  const kind = classifyAction(action);
  const base = FABRIC.defaults[kind];
  const override = FABRIC.overrides[vertical]?.[kind] ?? {};
  const merged: EvaluatePolicy = {
    id: `${vertical}.${kind}`,
    allowThreshold: override.allowThreshold ?? base.allowThreshold,
    escalateThreshold: override.escalateThreshold ?? base.escalateThreshold,
    escalateTo: override.escalateTo ?? base.escalateTo,
  };

  for (const rule of FORCE_DENY) {
    if (rule.vertical && rule.vertical !== vertical) continue;
    if (rule.pattern.test(action)) {
      return { ...merged, forceDeny: true, denyReason: rule.reason };
    }
  }
  return merged;
}
