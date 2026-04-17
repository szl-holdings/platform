import { useState, useEffect, useCallback } from "react";
import { Switch, Route } from "wouter";
import Constellation from "@/pages/Constellation";
import Shell from "./components/Shell";
import TodaysBrief from "./pages/TodaysBrief";
import Library from "./pages/Library";
import ConfidenceDashboard from "./pages/ConfidenceDashboard";
import CustomBrief from "./pages/CustomBrief";
import DissentChannel from "./pages/DissentChannel";
import Settings from "./pages/Settings";
import BriefingDetail from "./pages/BriefingDetail";
import SystemHealth from "./pages/SystemHealth";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") || "/pulse";

interface AuthUser {
  id: string | number;
  displayName?: string | null;
  email?: string | null;
}

function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/user", { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<{ user: AuthUser | null }>;
      })
      .then((data) => {
        if (!cancelled) {
          setUser(data.user ?? null);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setUser(null);
          setIsLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, []);

  const login = useCallback(() => {
    const base = import.meta.env.BASE_URL?.replace(/\/+$/, "") || "/pulse";
    window.location.href = `/api/login?returnTo=${encodeURIComponent(base + "/")}`;
  }, []);

  return { user, isLoading, isAuthenticated: !!user, login };
}

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isLoading, isAuthenticated, login } = useAuth();

  if (isLoading) {
    return (
      <div style={{
        minHeight: "100vh", background: "#0a0b0d",
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "rgba(255,255,255,0.4)", fontSize: "0.875rem",
      }}>
        Authenticating…
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div style={{
        minHeight: "100vh", background: "#0a0b0d",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <div style={{ textAlign: "center", maxWidth: 400, padding: "2rem" }}>
          <div style={{
            fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.12em",
            textTransform: "uppercase", color: "#c8a84b", marginBottom: 12,
          }}>
            PULSE · AI EXECUTIVE BRIEFING
          </div>
          <h2 style={{ color: "rgba(255,255,255,0.9)", fontSize: "1.4rem", fontWeight: 500, marginBottom: "0.5rem" }}>
            Authentication Required
          </h2>
          <p style={{ color: "rgba(255,255,255,0.45)", marginBottom: "1.5rem", fontSize: "0.875rem", lineHeight: 1.6 }}>
            Sign in to access today's executive brief and intelligence dashboard.
          </p>
          <button
            onClick={login}
            style={{
              padding: "0.625rem 1.75rem",
              background: "rgba(200,168,75,0.12)",
              color: "#c8a84b",
              border: "1px solid rgba(200,168,75,0.35)",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "0.875rem",
              fontWeight: 500,
            }}
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <RequireAuth>
      <Shell>
        <Switch>
          <Route path={`${BASE}/`} component={TodaysBrief} />
          <Route path={`${BASE}`} component={TodaysBrief} />
          <Route path={`${BASE}/library`} component={Library} />
          <Route path={`${BASE}/library/:id`} component={BriefingDetail} />
          <Route path={`${BASE}/confidence`} component={ConfidenceDashboard} />
          <Route path={`${BASE}/custom`} component={CustomBrief} />
          <Route path={`${BASE}/dissent`} component={DissentChannel} />
          <Route path={`${BASE}/system`} component={SystemHealth} />
          <Route path={`${BASE}/settings`} component={Settings} />
          <Route path={`${BASE}/constellation`} component={Constellation} />
          <Route component={TodaysBrief} />
        </Switch>
      </Shell>
    </RequireAuth>
  );
}
