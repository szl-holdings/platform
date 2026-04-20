import { createContext, type ReactNode, useContext, useState } from 'react';

export type UserRole = 'exec' | 'ops' | 'compliance' | 'maintenance';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

interface AuthContextType {
  user: AuthUser;
  setRole: (role: UserRole) => void;
  isAuthenticated: boolean;
}

const roleProfiles: Record<UserRole, { name: string; email: string }> = {
  exec: { name: 'Sarah Chen', email: 's.chen@szlholdings.com' },
  ops: { name: 'Marcus Rodriguez', email: 'm.rodriguez@szlholdings.com' },
  compliance: { name: 'Aiko Tanaka', email: 'a.tanaka@szlholdings.com' },
  maintenance: { name: 'Erik Johansson', email: 'e.johansson@szlholdings.com' },
};

const roleLabels: Record<UserRole, string> = {
  exec: 'Executive',
  ops: 'Operations',
  compliance: 'Compliance',
  maintenance: 'Maintenance',
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<UserRole>('exec');

  const user: AuthUser = {
    id: `user-${role}`,
    ...roleProfiles[role],
    role,
  };

  return (
    <AuthContext.Provider value={{ user, setRole, isAuthenticated: true }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function useHasAccess(allowedRoles: UserRole[]) {
  const { user } = useAuth();
  return allowedRoles.includes(user.role);
}

export { roleLabels };
