import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@szl-holdings/replit-auth-web";

export type AppRole = "admin" | "investor" | "security" | "operator" | "viewer";

export interface UserRoles {
  roles: AppRole[];
  isAdmin: boolean;
  isInvestor: boolean;
  isSecurity: boolean;
  isOperator: boolean;
  hasRole: (role: AppRole) => boolean;
}

const DEFAULT_ROLES: UserRoles = {
  roles: [],
  isAdmin: false,
  isInvestor: false,
  isSecurity: false,
  isOperator: false,
  hasRole: () => false,
};

/**
 * Hook for checking the current user's roles.
 * Fetches roles from the API server and provides convenience flags.
 * Falls back to empty roles on error (defensive).
 *
 * Role enforcement also happens server-side — this is UI-layer only.
 */
export function useRole(): UserRoles & { isLoading: boolean } {
  const { isAuthenticated } = useAuth();

  const { data: roles = [], isLoading } = useQuery<AppRole[]>({
    queryKey: ["user-roles"],
    queryFn: async () => {
      const apiBase = "/api";
      const res = await fetch(`${apiBase}/auth/roles`, {
        credentials: "include",
      });
      if (!res.ok) return [];
      const json = await res.json() as { roles?: AppRole[] };
      return json.roles ?? [];
    },
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const hasRole = (role: AppRole) => roles.includes(role);

  return {
    isLoading,
    roles,
    isAdmin: hasRole("admin"),
    isInvestor: hasRole("investor"),
    isSecurity: hasRole("security"),
    isOperator: hasRole("operator"),
    hasRole,
  };
}

/**
 * Simple component to gate content by role.
 * Renders children only if the user has the required role(s).
 */
export function RoleGate({
  requires,
  children,
  fallback = null,
}: {
  requires: AppRole | AppRole[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const { isLoading, hasRole } = useRole();

  if (isLoading) return null;

  const required = Array.isArray(requires) ? requires : [requires];
  const allowed = required.some(hasRole);

  return allowed ? <>{children}</> : <>{fallback}</>;
}
