import { useBiometricLock } from './BiometricLockContext';

export type { BiometricLockContextValue } from './BiometricLockContext';

export function useBiometric() {
  return useBiometricLock();
}
