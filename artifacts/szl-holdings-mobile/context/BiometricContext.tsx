import { useBiometricLock } from "./BiometricLockContext";
export type { BiometricLockContextValue } from "./BiometricLockContext";

export function useBiometric() {
  const ctx = useBiometricLock();
  return {
    ...ctx,
    unlock: async (): Promise<boolean> => {
      return ctx.setBiometricPreference(true).then(() => true).catch(() => false);
    },
  };
}
