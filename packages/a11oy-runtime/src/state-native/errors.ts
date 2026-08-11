export type StateNativeErrorCode =
  | 'NOT_FOUND'
  | 'TENANT_MISMATCH'
  | 'EXPIRED'
  | 'REVOKED'
  | 'QUARANTINED'
  | 'SHREDDED'
  | 'POLICY_MISMATCH'
  | 'REUSE_DENIED'
  | 'COMPATIBILITY_MISMATCH'
  | 'DIVERGENT_REPLAY'
  | 'INVALID_INPUT'
  | 'INVALID_TRANSITION'
  | 'EPOCH_NOT_ACTIVE'
  | 'POLICY_BLOCKED'
  | 'APPROVAL_REQUIRED'
  | 'BUDGET_EXCEEDED'
  | 'VERIFICATION_FAILED'
  | 'RECEIPT_WRITE_FAILED'
  | 'INDETERMINATE'
  | 'ALREADY_IN_FLIGHT'
  | 'SIGNATURE_INVALID';

export class StateNativeError extends Error {
  public readonly code: StateNativeErrorCode;
  public readonly details?: Readonly<Record<string, unknown>>;

  public constructor(
    code: StateNativeErrorCode,
    message: string,
    details?: Readonly<Record<string, unknown>>,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = 'StateNativeError';
    this.code = code;
    this.details = details;
  }
}

export function assertStateNative(
  condition: unknown,
  code: StateNativeErrorCode,
  message: string,
  details?: Readonly<Record<string, unknown>>,
): asserts condition {
  if (!condition) {
    throw new StateNativeError(code, message, details);
  }
}
