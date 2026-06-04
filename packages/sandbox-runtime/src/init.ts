/**
 * Sandbox Runtime — Portable Tool Mesh Initialisation Guard
 *
 * `ensureSandboxToolsRegistered()` provides a lazy, idempotent registration
 * entry point that works in ANY execution context — api-server boot, substrate
 * stage pipelines, test suites, or CLI tools — without requiring that callers
 * know which context performed the initial bootstrap.
 *
 * Behaviour:
 *  - First call: registers all sandbox tools in the Tool Mesh gateway and
 *    registry, then records the registration as complete.
 *  - Subsequent calls: return immediately (no-op).
 *  - On failure: throws a descriptive `SandboxToolRegistrationError` so that
 *    callers fail fast with a clear error rather than silently operating with
 *    unregistered tools.
 *
 * This module replaces the api-server-only bootstrap for substrate and other
 * runtime execution contexts that invoke SandboxAgent directly.
 */

export class SandboxToolRegistrationError extends Error {
  constructor(cause: unknown) {
    const message =
      cause instanceof Error
        ? `Sandbox Tool Mesh registration failed: ${cause.message}`
        : `Sandbox Tool Mesh registration failed: ${String(cause)}`;
    super(message);
    this.name = 'SandboxToolRegistrationError';
    if (cause instanceof Error && cause.stack) {
      this.stack = `${this.stack}\nCaused by: ${cause.stack}`;
    }
  }
}

let _registered = false;
let _registrationPromise: Promise<void> | null = null;

/**
 * Ensure sandbox tools are registered in the Tool Mesh gateway and registry.
 *
 * Safe to call from any execution context (api-server, substrate, test, CLI).
 * Concurrent calls coalesce onto a single registration attempt.
 *
 * @throws SandboxToolRegistrationError if registration fails.
 */
export async function ensureSandboxToolsRegistered(): Promise<void> {
  if (_registered) return;

  if (_registrationPromise) {
    return _registrationPromise;
  }

  _registrationPromise = (async () => {
    try {
      const { defaultGateway, defaultToolRegistry } = await import('@workspace/tool-mesh');
      const { registerSandboxTools } = await import('./tool-registrations.js');
      registerSandboxTools(defaultGateway, defaultToolRegistry);
      _registered = true;
    } catch (err) {
      _registrationPromise = null;
      throw new SandboxToolRegistrationError(err);
    }
  })();

  return _registrationPromise;
}

/**
 * Returns true if sandbox tools have been successfully registered.
 * Useful for health-check endpoints and diagnostics.
 */
export function isSandboxToolsRegistered(): boolean {
  return _registered;
}

/**
 * Reset registration state. For use in tests only.
 * @internal
 */
export function _resetSandboxToolsRegistration(): void {
  _registered = false;
  _registrationPromise = null;
}
