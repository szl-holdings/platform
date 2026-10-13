const VALID_RUNTIME_MODES = new Set(['local-dev', 'internal-preview', 'demo', 'production']);

function normalized(value: string | undefined): string | undefined {
  const result = value?.trim().toLowerCase();
  return result ? result : undefined;
}

/**
 * Resolve the platform production safety boundary.
 *
 * Any production marker dominates conflicting development/test markers. This
 * deliberately favors a safe HOLD over a fail-open interpretation of mixed
 * deployment configuration. RUNTIME_MODE is validated because it is the
 * platform's explicit mode selector.
 */
export function isProductionRuntime(
  env: NodeJS.ProcessEnv = process.env,
  serviceMarkerNames: readonly string[] = [],
): boolean {
  const runtimeMode = normalized(env.RUNTIME_MODE);
  if (runtimeMode && !VALID_RUNTIME_MODES.has(runtimeMode)) {
    throw new Error(
      `Invalid RUNTIME_MODE ${JSON.stringify(env.RUNTIME_MODE)}; expected one of ${[
        ...VALID_RUNTIME_MODES,
      ].join(', ')}`,
    );
  }

  return ['RUNTIME_MODE', 'APP_ENV', 'NODE_ENV', 'SZL_ENV', ...serviceMarkerNames].some(
    (name) => normalized(env[name]) === 'production' || normalized(env[name]) === 'prod',
  );
}

export function isDevelopmentOrTestRuntime(
  env: NodeJS.ProcessEnv = process.env,
  serviceMarkerNames: readonly string[] = [],
): boolean {
  if (isProductionRuntime(env, serviceMarkerNames)) return false;
  return ['RUNTIME_MODE', 'APP_ENV', 'NODE_ENV', 'SZL_ENV', ...serviceMarkerNames].some((name) => {
    const value = normalized(env[name]);
    return value === 'local-dev' || value === 'dev' || value === 'development' || value === 'test';
  });
}
