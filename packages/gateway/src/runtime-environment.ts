const VALID_RUNTIME_MODES = new Set(['local-dev', 'internal-preview', 'demo', 'production']);

function normalized(value: string | undefined): string | undefined {
  const result = value?.trim().toLowerCase();
  return result ? result : undefined;
}

/**
 * Resolve the gateway's production safety boundary.
 *
 * This mirrors the platform runtime contract while keeping this standalone
 * reference core independent of an undeclared workspace-package dependency.
 * Any production marker dominates a conflicting development/test marker, and
 * an invalid explicit RUNTIME_MODE is always fatal.
 */
export function isProductionRuntime(env: NodeJS.ProcessEnv = process.env): boolean {
  const runtimeMode = normalized(env.RUNTIME_MODE);
  if (runtimeMode && !VALID_RUNTIME_MODES.has(runtimeMode)) {
    throw new Error(
      `Invalid RUNTIME_MODE ${JSON.stringify(env.RUNTIME_MODE)}; expected one of ${[
        ...VALID_RUNTIME_MODES,
      ].join(', ')}`,
    );
  }

  return ['RUNTIME_MODE', 'APP_ENV', 'NODE_ENV', 'SZL_ENV'].some((name) => {
    const value = normalized(env[name]);
    return value === 'production' || value === 'prod';
  });
}

export function isDevelopmentOrTestRuntime(env: NodeJS.ProcessEnv = process.env): boolean {
  if (isProductionRuntime(env)) return false;
  return ['RUNTIME_MODE', 'APP_ENV', 'NODE_ENV', 'SZL_ENV'].some((name) => {
    const value = normalized(env[name]);
    return value === 'local-dev' || value === 'dev' || value === 'development' || value === 'test';
  });
}
