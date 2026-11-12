export const REAL_VECTOR_OPT_IN_ENV = 'AEF_EVALS_REQUIRE_REAL' as const;

type Environment = Readonly<Record<string, string | undefined>>;

/** Real model loading is disabled unless the caller explicitly requires it. */
export function realVectorEvalsEnabled(environment: Environment = process.env): boolean {
  return environment[REAL_VECTOR_OPT_IN_ENV] === '1';
}

/**
 * Keep the vector-worker module—and therefore its model transport—outside the
 * default test path. The loader is never invoked without the exact opt-in.
 */
export async function loadRealVectorBackendModule<T>(
  loader: () => Promise<T>,
  environment: Environment = process.env,
): Promise<T | null> {
  if (!realVectorEvalsEnabled(environment)) return null;
  return loader();
}
