import { useAuth } from '@szl-holdings/replit-auth-web';
import type { ReactNode } from 'react';

export interface AuthGateProps {
  children?: ReactNode;
  title?: string;
  description?: string;
  onAuth?: () => void | Promise<void>;
  fallback?: ReactNode;
}

export default function AuthGate({
  children,
  title,
  description,
  onAuth,
  fallback,
}: AuthGateProps) {
  const { isLoading, isAuthenticated, login } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    if (fallback) return <>{fallback}</>;
    const handleAuth = onAuth ?? login;
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8">
        {title && <h2 className="text-2xl font-bold mb-2">{title}</h2>}
        {description && <p className="text-muted-foreground mb-6">{description}</p>}
        <button
          onClick={handleAuth}
          className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          Sign In
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
