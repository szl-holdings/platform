export const DEMO_MODE: boolean = true;

export function assertDemoSafe(operation: string): void {
  if (DEMO_MODE) {
    throw new DemoModeError(operation);
  }
}

export class DemoModeError extends Error {
  readonly operation: string;

  constructor(operation: string) {
    super(
      `[A11oy Demo Mode] Operation "${operation}" is blocked. ` +
        'This is a read-only demo environment. Mutating operations are disabled until Phase 2 runtime.',
    );
    this.name = 'DemoModeError';
    this.operation = operation;
  }
}

export function isDemoMode(): boolean {
  return DEMO_MODE;
}

export function getDemoModeContext() {
  return {
    enabled: DEMO_MODE,
    phase: 'Phase 1 — Foundation',
    blockedOperations: [
      'approve_action',
      'execute_action',
      'run_workcell',
      'update_policy',
      'delete_signal',
      'write_proof',
    ],
    message: 'Mutating endpoints are wired as stubs. Phase 2 runtime will activate them.',
  };
}
