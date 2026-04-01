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
 * Supports ?demo=true or ?view=app query params to bypass auth for demo mode.
 */
export function PrivateAppGuard({
  children,
  appName = "this application",
  accentColor = "#4B8BDB",
  loadingColor,
}: PrivateAppGuardProps) {
  const { isLoading, isAuthenticated, login } = useAuth();
  const params = new URLSearchParams(window.location.search);
  const isDemoMode = params.get("demo") === "true" || params.get("view") === "app";

  const color = loadingColor ?? accentColor;

  if (isDemoMode) {
    return <>{children}</>;
  }

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
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={accentColor} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
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
