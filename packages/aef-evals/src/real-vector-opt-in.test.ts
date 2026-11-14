import { describe, expect, it, vi } from 'vitest';
import {
  loadRealVectorBackendModule,
  REAL_VECTOR_OPT_IN_ENV,
  realVectorEvalsEnabled,
} from './real-vector-opt-in.js';

describe('real-vector evaluation opt-in', () => {
  it('does not load the backend without the exact opt-in', async () => {
    for (const value of [undefined, '', '0', 'true', ' 1', '1 ']) {
      const loader = vi.fn(async () => ({ loaded: true }));
      const environment = value === undefined ? {} : { [REAL_VECTOR_OPT_IN_ENV]: value };

      await expect(loadRealVectorBackendModule(loader, environment)).resolves.toBeNull();
      expect(loader).not.toHaveBeenCalled();
      expect(realVectorEvalsEnabled(environment)).toBe(false);
    }
  });

  it('loads the backend only for literal opt-in value 1', async () => {
    const backendModule = { loaded: true };
    const loader = vi.fn(async () => backendModule);
    const environment = { [REAL_VECTOR_OPT_IN_ENV]: '1' };

    await expect(loadRealVectorBackendModule(loader, environment)).resolves.toBe(backendModule);
    expect(loader).toHaveBeenCalledOnce();
    expect(realVectorEvalsEnabled(environment)).toBe(true);
  });
});
