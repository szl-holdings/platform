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

// Demo token storage key — stores the validated PIN so each demo API call can
// send it in x-demo-token. The PIN is never embedded in the client bundle or URL;
// it is entered via a form modal and sent to the server for validation first.
const DEMO_TOKEN_KEY = "pulse-demo-token";
// Demo mode is only available in non-production builds (import.meta.env.DEV).
const DEMO_ALLOWED = import.meta.env.DEV || import.meta.env.VITE_DEMO_ALLOWED === "true";

interface AuthUser {
  id: string | number;
  displayName?: string | null;
  email?: string | null;
}

function isDemoActive(): boolean {
  if (!DEMO_ALLOWED) return false;
  return !!sessionStorage.getItem(DEMO_TOKEN_KEY);
}

function clearDemoSession(): void {
  sessionStorage.removeItem(DEMO_TOKEN_KEY);
}

async function verifyAndStoreDemoPin(pin: string): Promise<boolean> {
  try {
    const res = await fetch("/api/pulse/demo/verify", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ pin }),
    });
    const data = (await res.json()) as { valid?: boolean };
    if (data.valid) {
      sessionStorage.setItem(DEMO_TOKEN_KEY, pin);
      return true;
    }
  } catch {
    // network failure — treat as invalid
  }
  return false;
}

const DEMO_USER: AuthUser = {
  id: "demo",
  displayName: "Demo Viewer",
  email: "demo@szlholdings.com",
};

function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const activateDemo = useCallback(() => {
    setUser(DEMO_USER);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (isDemoActive()) {
      setUser(DEMO_USER);
      setIsLoading(false);
      return;
    }
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

  return { user, isLoading, isAuthenticated: !!user, login, activateDemo };
}

function PinModal({ onSuccess }: { onSuccess: () => void }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    const ok = await verifyAndStoreDemoPin(pin);
    setSubmitting(false);
    if (ok) {
      // Remove ?demo from the URL so the PIN never appears in history
      const url = new URL(window.location.href);
      url.searchParams.delete("demo");
      window.history.replaceState({}, "", url.toString());
      onSuccess();
    } else {
      setError("Invalid access code. Please try again.");
      setPin("");
    }
  };

  return (
    <div style={{
      minHeight: "100vh", background: "#0a0b0d",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <form onSubmit={handleSubmit} style={{ textAlign: "center", maxWidth: 360, padding: "2rem" }}>
        <div style={{
          fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.12em",
          textTransform: "uppercase", color: "#c8a84b", marginBottom: 12,
        }}>
          PULSE · DEMO ACCESS
        </div>
        <h2 style={{ color: "rgba(255,255,255,0.9)", fontSize: "1.3rem", fontWeight: 500, marginBottom: "0.5rem" }}>
          Enter Access Code
        </h2>
        <p style={{ color: "rgba(255,255,255,0.4)", marginBottom: "1.5rem", fontSize: "0.825rem", lineHeight: 1.6 }}>
          Enter your demo access code to view the investor briefing.
        </p>
        <input
          type="password"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          placeholder="Access code"
          autoFocus
          style={{
            width: "100%", padding: "0.625rem 0.875rem",
            background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.9)",
            border: "1px solid rgba(255,255,255,0.12)", borderRadius: "6px",
            fontSize: "0.875rem", marginBottom: "0.75rem", boxSizing: "border-box",
            outline: "none",
          }}
        />
        {error && <p style={{ color: "#ef4444", fontSize: "0.8rem", marginBottom: "0.75rem" }}>{error}</p>}
        <button
          type="submit"
          disabled={submitting || !pin}
          style={{
            width: "100%", padding: "0.625rem 1.75rem",
            background: "rgba(200,168,75,0.12)", color: "#c8a84b",
            border: "1px solid rgba(200,168,75,0.35)", borderRadius: "6px",
            cursor: submitting ? "not-allowed" : "pointer",
            fontSize: "0.875rem", fontWeight: 500,
          }}
        >
          {submitting ? "Verifying…" : "Enter Demo"}
        </button>
      </form>
    </div>
  );
}

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isLoading, isAuthenticated, login, activateDemo } = useAuth();
  const [showPinModal, setShowPinModal] = useState(() => {
    if (!DEMO_ALLOWED) return false;
    const params = new URLSearchParams(window.location.search);
    return params.has("demo") && !isDemoActive();
  });

  if (showPinModal) {
    return <PinModal onSuccess={() => { setShowPinModal(false); activateDemo(); }} />;
  }

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
