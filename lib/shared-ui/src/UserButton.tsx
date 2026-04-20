import type { AuthUser } from '@szl-holdings/replit-auth-web';
import { useAuth } from '@szl-holdings/replit-auth-web';

export type { AuthUser };

interface UserButtonProps {
  className?: string;
  showName?: boolean;
}

export function UserButton({ className = '', showName = false }: UserButtonProps) {
  const { user, isLoading, isAuthenticated, login, logout } = useAuth();

  if (isLoading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <button
        onClick={login}
        className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors ${className}`}
      >
        Sign In
      </button>
    );
  }

  const displayName = user.displayName || user.name || user.username || 'User';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {showName && (
        <span className="text-sm font-medium text-foreground hidden sm:block">{displayName}</span>
      )}
      <button
        onClick={logout}
        className="flex items-center gap-1.5 px-2 py-1 text-xs rounded-md bg-muted hover:bg-muted/80 text-muted-foreground transition-colors"
        title={`Signed in as ${displayName}`}
      >
        {user.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt={displayName}
            className="w-6 h-6 rounded-full object-cover"
          />
        ) : (
          <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium text-primary">
            {initial}
          </div>
        )}
        <span className="hidden sm:block">Sign out</span>
      </button>
    </div>
  );
}

export { useAuth };
