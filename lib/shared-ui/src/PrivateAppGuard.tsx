import { ReactNode } from "react";
import { useAuth } from "@workspace/replit-auth-web";

export interface PrivateAppGuardProps {
  children: ReactNode;
  appName?: string;
  accentColor?: string;
  loadingColor?: string;
}

/**
 * Wraps an entire private app with authentication enforcement.
 * Unauthenticated users see a styled sign-in prompt instead of the app.
 * Used in /app/* surfaces: Alloy, Lyte, Terra, Vessels dashboard, etc.
 */
export function PrivateAppGuard({
  children,
  appName = "this application",
  accentColor = "#00d4ff",
  loadingColor,
}: PrivateAppGuardProps) {
  const { isLoading, isAuthenticated, login } = useAuth();

  const color = loadingColor ?? accentColor;

  if (isLoading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          background: "#080c14",
        }}
      >
        <div
          style={{
            width: 24,
            height: 24,
            border: `2px solid ${color}40`,
            borderTopColor: color,
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
          }}
        />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          background: "#080c14",
          gap: 24,
          padding: "0 24px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: "50%",
            background: `${accentColor}20`,
            border: `1px solid ${accentColor}40`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 24,
          }}
        >
          🔐
        </div>
        <div>
          <h2
            style={{
              fontSize: 20,
              fontWeight: 600,
              color: "#e2e8f0",
              margin: "0 0 8px 0",
              fontFamily: "inherit",
            }}
          >
            Authentication required
          </h2>
          <p
            style={{
              fontSize: 14,
              color: "#94a3b8",
              margin: 0,
              maxWidth: 360,
            }}
          >
            Sign in to access {appName}.
          </p>
        </div>
        <button
          onClick={login}
          style={{
            padding: "10px 28px",
            background: `${accentColor}20`,
            border: `1px solid ${accentColor}60`,
            borderRadius: 8,
            color: accentColor,
            fontSize: 14,
            fontWeight: 500,
            cursor: "pointer",
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = `${accentColor}35`;
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = `${accentColor}20`;
          }}
        >
          Sign in
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
