import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../api-fetch';

export interface EntitlementResult {
  granted: boolean;
  source: 'override' | 'subscription' | 'admin_bypass' | 'none';
  featureKey: string;
  plan?: string | null;
}

async function fetchEntitlement(featureKey: string, orgId?: number): Promise<EntitlementResult> {
  const params = new URLSearchParams({ featureKey });
  if (orgId != null) params.set('orgId', String(orgId));
  const res = await apiFetch<EntitlementResult>(`/api/billing/entitlements/check?${params}`);
  return res;
}

export function useEntitlement(featureKey: string, orgId?: number) {
  const query = useQuery({
    queryKey: ['entitlement', featureKey, orgId],
    queryFn: () => fetchEntitlement(featureKey, orgId),
    staleTime: 60_000,
    retry: 1,
  });

  return {
    granted: query.data?.granted ?? false,
    source: query.data?.source ?? 'none',
    plan: query.data?.plan ?? null,
    isLoading: query.isLoading,
    error: query.error,
  };
}

export function useAdminBypass(roles?: string[]): boolean {
  if (!roles) return false;
  return roles.includes('super_admin') || roles.includes('admin');
}
