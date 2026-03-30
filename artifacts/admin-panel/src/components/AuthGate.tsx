import { ReactNode } from "react";

export interface AuthGateProps {
  children?: ReactNode;
  title?: string;
  description?: string;
  onAuth?: () => void | Promise<void>;
}

export default function AuthGate({ children, title, description, onAuth }: AuthGateProps) {
  if (children) return <>{children}</>;

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8">
      {title && <h2 className="text-2xl font-bold mb-2">{title}</h2>}
      {description && <p className="text-muted-foreground mb-6">{description}</p>}
      {onAuth && (
        <button
          onClick={onAuth}
          className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          Sign In
        </button>
      )}
    </div>
  );
}
