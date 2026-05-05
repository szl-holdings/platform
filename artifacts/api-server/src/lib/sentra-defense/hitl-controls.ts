/**
 * HITL (Human-in-the-Loop) Controls
 *
 * Manages per-category auto-execute vs require-approval toggles,
 * a global kill switch, and per-action overrides.
 *
 * State is in-memory with a seed of safe defaults. The operator
 * console reads and writes via the defense routes.
 */

import { logger } from '../logger.js';

export type ActionCategory =
  | 'block'
  | 'revoke'
  | 'rotate'
  | 'quarantine'
  | 'tarpit'
  | 'poison_response'
  | 'counter_move';

export interface CategoryControl {
  category: ActionCategory;
  autoExecute: boolean;
  requireApproval: boolean;
  enabled: boolean;
  description: string;
}

export interface HitlState {
  globalKillSwitch: boolean;
  categories: Record<ActionCategory, CategoryControl>;
  perActionOverrides: Record<string, boolean>;
  lastUpdatedAt: string;
  lastUpdatedBy: string;
}

const DEFAULT_CATEGORIES: Record<ActionCategory, CategoryControl> = {
  block: {
    category: 'block',
    autoExecute: false,
    requireApproval: true,
    enabled: true,
    description: 'IP deny-listing enforced by api-server middleware',
  },
  revoke: {
    category: 'revoke',
    autoExecute: false,
    requireApproval: true,
    enabled: true,
    description: 'Session revocation',
  },
  rotate: {
    category: 'rotate',
    autoExecute: false,
    requireApproval: true,
    enabled: true,
    description: 'Token rotation triggers',
  },
  quarantine: {
    category: 'quarantine',
    autoExecute: false,
    requireApproval: true,
    enabled: true,
    description: 'Account quarantine',
  },
  tarpit: {
    category: 'tarpit',
    autoExecute: true,
    requireApproval: false,
    enabled: true,
    description: 'Slow-roll responses to confirmed attackers',
  },
  poison_response: {
    category: 'poison_response',
    autoExecute: false,
    requireApproval: true,
    enabled: true,
    description: 'Response rewriting with plausible-but-fake data',
  },
  counter_move: {
    category: 'counter_move',
    autoExecute: false,
    requireApproval: true,
    enabled: true,
    description: 'Sentinel counter-move actions against attacker automation',
  },
};

let _state: HitlState = {
  globalKillSwitch: false,
  categories: { ...DEFAULT_CATEGORIES },
  perActionOverrides: {},
  lastUpdatedAt: new Date().toISOString(),
  lastUpdatedBy: 'system',
};

export function getHitlState(): HitlState {
  return { ..._state, categories: { ..._state.categories } };
}

export function isActionAllowed(
  category: ActionCategory,
  actionId?: string,
): { allowed: boolean; requiresApproval: boolean; reason: string } {
  if (_state.globalKillSwitch) {
    return { allowed: false, requiresApproval: false, reason: 'Global kill switch is active' };
  }

  const cat = _state.categories[category];
  if (!cat || !cat.enabled) {
    return { allowed: false, requiresApproval: false, reason: `Category "${category}" is disabled` };
  }

  if (actionId && actionId in _state.perActionOverrides) {
    const override = _state.perActionOverrides[actionId];
    return {
      allowed: override ?? false,
      requiresApproval: false,
      reason: `Per-action override: ${override ? 'allowed' : 'blocked'}`,
    };
  }

  return {
    allowed: true,
    requiresApproval: cat.requireApproval,
    reason: cat.autoExecute ? 'Auto-execute enabled' : 'Requires operator approval',
  };
}

export function updateCategory(
  category: ActionCategory,
  patch: Partial<Pick<CategoryControl, 'autoExecute' | 'requireApproval' | 'enabled'>>,
  updatedBy = 'operator',
): void {
  if (!(category in _state.categories)) return;
  _state = {
    ..._state,
    categories: {
      ..._state.categories,
      [category]: { ..._state.categories[category]!, ...patch },
    },
    lastUpdatedAt: new Date().toISOString(),
    lastUpdatedBy: updatedBy,
  };
  logger.info({ category, patch, updatedBy }, '[HITL] category control updated');
}

export function setGlobalKillSwitch(active: boolean, updatedBy = 'operator'): void {
  _state = {
    ..._state,
    globalKillSwitch: active,
    lastUpdatedAt: new Date().toISOString(),
    lastUpdatedBy: updatedBy,
  };
  logger.warn({ active, updatedBy }, '[HITL] global kill switch toggled');
}

export function setPerActionOverride(actionId: string, allowed: boolean, updatedBy = 'operator'): void {
  _state = {
    ..._state,
    perActionOverrides: { ..._state.perActionOverrides, [actionId]: allowed },
    lastUpdatedAt: new Date().toISOString(),
    lastUpdatedBy: updatedBy,
  };
  logger.info({ actionId, allowed, updatedBy }, '[HITL] per-action override set');
}

export function clearPerActionOverride(actionId: string): void {
  const { [actionId]: _removed, ...rest } = _state.perActionOverrides;
  _state = { ..._state, perActionOverrides: rest };
}
