import { digestObject, newId } from './canonical.js';
import { StateNativeError, assertStateNative } from './errors.js';
import type {
  CognitiveEpochLease,
  CognitiveEpochRecord,
  CognitiveEpochSpec,
  EpochValidationCheck,
} from './types.js';

export interface CognitiveEpochManagerConfig {
  readonly clock?: () => Date;
}

function specDigest(spec: CognitiveEpochSpec): string {
  return digestObject({ schema: 'szl.cognitive-epoch-spec/v1', ...spec });
}

function freezeRecord(record: CognitiveEpochRecord): CognitiveEpochRecord {
  return Object.freeze({
    ...record,
    validationChecks: Object.freeze(record.validationChecks.map((check) => Object.freeze({ ...check }))),
  });
}

export class CognitiveEpochManager {
  readonly #clock: () => Date;
  readonly #records = new Map<string, CognitiveEpochRecord>();
  readonly #specDigests = new Map<string, string>();
  readonly #activeByTenantRoute = new Map<string, string>();

  public constructor(config: CognitiveEpochManagerConfig = {}) {
    this.#clock = config.clock ?? (() => new Date());
  }

  public prepare(spec: CognitiveEpochSpec): CognitiveEpochRecord {
    this.#validateSpec(spec);
    const digest = specDigest(spec);
    const existing = this.#records.get(spec.epochId);
    if (existing) {
      if (this.#specDigests.get(spec.epochId) !== digest) {
        throw new StateNativeError(
          'DIVERGENT_REPLAY',
          'The cognitive epoch identifier was already used for a different specification.',
          { epochId: spec.epochId },
        );
      }
      return existing;
    }

    const record = freezeRecord({
      ...spec,
      state: 'PREPARED',
      validationChecks: Object.freeze([]),
      leaseCount: 0,
    });
    this.#records.set(spec.epochId, record);
    this.#specDigests.set(spec.epochId, digest);
    return record;
  }

  public validate(epochId: string, checks: readonly EpochValidationCheck[]): CognitiveEpochRecord {
    assertStateNative(checks.length > 0, 'INVALID_INPUT', 'At least one epoch validation check is required.');
    const current = this.require(epochId);
    if (current.state !== 'PREPARED') {
      throw new StateNativeError(
        'INVALID_TRANSITION',
        `Cognitive epoch ${epochId} cannot be validated from ${current.state}.`,
      );
    }

    const normalizedChecks = Object.freeze(checks.map((check) => Object.freeze({ ...check })));
    const state = normalizedChecks.every((check) => check.passed) ? 'VALIDATED' : 'REJECTED';
    const next = freezeRecord({ ...current, state, validationChecks: normalizedChecks });
    this.#records.set(epochId, next);
    return next;
  }

  public activate(epochId: string): CognitiveEpochRecord {
    const current = this.require(epochId);
    if (current.state !== 'VALIDATED') {
      throw new StateNativeError(
        'INVALID_TRANSITION',
        `Cognitive epoch ${epochId} cannot be activated from ${current.state}.`,
      );
    }

    const routeKey = this.#routeKey(current.tenantId, current.route);
    const priorId = this.#activeByTenantRoute.get(routeKey);
    if (priorId && priorId !== epochId) {
      const prior = this.require(priorId);
      const draining = freezeRecord({
        ...prior,
        state: prior.leaseCount === 0 ? 'RETIRED' : 'DRAINING',
        retiredAt: prior.leaseCount === 0 ? this.#clock().toISOString() : undefined,
      });
      this.#records.set(priorId, draining);
    }

    const next = freezeRecord({
      ...current,
      state: 'ACTIVE',
      activatedAt: this.#clock().toISOString(),
    });
    this.#records.set(epochId, next);
    this.#activeByTenantRoute.set(routeKey, epochId);
    return next;
  }

  public drain(epochId: string): CognitiveEpochRecord {
    const current = this.require(epochId);
    if (current.state !== 'ACTIVE') {
      throw new StateNativeError(
        'INVALID_TRANSITION',
        `Cognitive epoch ${epochId} cannot drain from ${current.state}.`,
      );
    }

    const state = current.leaseCount === 0 ? 'RETIRED' : 'DRAINING';
    const next = freezeRecord({
      ...current,
      state,
      retiredAt: state === 'RETIRED' ? this.#clock().toISOString() : undefined,
    });
    this.#records.set(epochId, next);
    this.#activeByTenantRoute.delete(this.#routeKey(current.tenantId, current.route));
    return next;
  }

  public rollback(activeEpochId: string, targetEpochId: string, reason: string): CognitiveEpochRecord {
    assertStateNative(reason.trim().length > 0, 'INVALID_INPUT', 'Rollback reason must not be empty.');
    const active = this.require(activeEpochId);
    const target = this.require(targetEpochId);
    if (active.state !== 'ACTIVE') {
      throw new StateNativeError('INVALID_TRANSITION', 'Only an active cognitive epoch can be rolled back.');
    }
    if (active.tenantId !== target.tenantId || active.route !== target.route) {
      throw new StateNativeError(
        'INVALID_INPUT',
        'Rollback target must belong to the same tenant and route as the active epoch.',
      );
    }
    if (target.state !== 'VALIDATED' && target.state !== 'RETIRED') {
      throw new StateNativeError(
        'INVALID_TRANSITION',
        `Rollback target ${targetEpochId} is not validated or retired.`,
      );
    }
    if (active.leaseCount > 0) {
      throw new StateNativeError(
        'INVALID_TRANSITION',
        'An active epoch with outstanding leases must drain before rollback.',
        { activeEpochId, leaseCount: active.leaseCount },
      );
    }

    const now = this.#clock().toISOString();
    const rolledBack = freezeRecord({
      ...active,
      state: 'ROLLED_BACK',
      retiredAt: now,
      rollbackReason: reason,
    });
    const restored = freezeRecord({
      ...target,
      state: 'ACTIVE',
      activatedAt: now,
      retiredAt: undefined,
      rollbackReason: undefined,
    });
    this.#records.set(activeEpochId, rolledBack);
    this.#records.set(targetEpochId, restored);
    this.#activeByTenantRoute.set(this.#routeKey(active.tenantId, active.route), targetEpochId);
    return restored;
  }

  public pin(tenantId: string, route: string, expectedEpochId?: string): CognitiveEpochLease {
    const routeKey = this.#routeKey(tenantId, route);
    const epochId = this.#activeByTenantRoute.get(routeKey);
    if (!epochId) {
      throw new StateNativeError('EPOCH_NOT_ACTIVE', 'No active cognitive epoch exists for this route.', {
        tenantId,
        route,
      });
    }
    if (expectedEpochId && expectedEpochId !== epochId) {
      throw new StateNativeError('EPOCH_NOT_ACTIVE', 'The requested cognitive epoch is not active.', {
        tenantId,
        route,
        expectedEpochId,
        activeEpochId: epochId,
      });
    }

    const current = this.require(epochId);
    if (current.state !== 'ACTIVE') {
      throw new StateNativeError('EPOCH_NOT_ACTIVE', 'Cognitive epoch is no longer active.', { epochId });
    }
    const pinned = freezeRecord({ ...current, leaseCount: current.leaseCount + 1 });
    this.#records.set(epochId, pinned);

    const leaseId = newId('lease');
    let released = false;
    return Object.freeze({
      leaseId,
      epoch: pinned,
      release: () => {
        if (released) {
          return;
        }
        released = true;
        this.#release(epochId);
      },
    });
  }

  public get(epochId: string): CognitiveEpochRecord | undefined {
    return this.#records.get(epochId);
  }

  public require(epochId: string): CognitiveEpochRecord {
    const record = this.#records.get(epochId);
    if (!record) {
      throw new StateNativeError('NOT_FOUND', 'Cognitive epoch was not found.', { epochId });
    }
    return record;
  }

  public active(tenantId: string, route: string): CognitiveEpochRecord | undefined {
    const epochId = this.#activeByTenantRoute.get(this.#routeKey(tenantId, route));
    return epochId ? this.#records.get(epochId) : undefined;
  }

  public list(tenantId?: string): readonly CognitiveEpochRecord[] {
    return Object.freeze(
      [...this.#records.values()]
        .filter((record) => tenantId === undefined || record.tenantId === tenantId)
        .sort((left, right) => left.createdAt.localeCompare(right.createdAt)),
    );
  }

  #release(epochId: string): void {
    const current = this.require(epochId);
    assertStateNative(current.leaseCount > 0, 'INVALID_TRANSITION', 'Epoch lease count underflow.');
    const leaseCount = current.leaseCount - 1;
    const retires = current.state === 'DRAINING' && leaseCount === 0;
    const next = freezeRecord({
      ...current,
      leaseCount,
      state: retires ? 'RETIRED' : current.state,
      retiredAt: retires ? this.#clock().toISOString() : current.retiredAt,
    });
    this.#records.set(epochId, next);
  }

  #routeKey(tenantId: string, route: string): string {
    return `${tenantId}:${route}`;
  }

  #validateSpec(spec: CognitiveEpochSpec): void {
    for (const [field, value] of Object.entries(spec)) {
      assertStateNative(
        typeof value === 'string' && value.trim().length > 0,
        'INVALID_INPUT',
        `Cognitive epoch field ${field} must not be empty.`,
      );
    }
    assertStateNative(
      Number.isFinite(Date.parse(spec.createdAt)),
      'INVALID_INPUT',
      'Cognitive epoch createdAt must be an ISO-8601 timestamp.',
    );
  }
}
