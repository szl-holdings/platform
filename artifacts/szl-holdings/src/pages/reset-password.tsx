import { useState, useEffect } from "react";
import { m } from "framer-motion";
import { Link } from "wouter";
import { Eye, EyeOff, KeyRound, CheckCircle2, XCircle } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";
import { apiRequest } from "@/lib/api";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get("token");
}

type State = "idle" | "submitting" | "success" | "error";

export default function ResetPasswordPage() {
  const __pageMeta = usePageMeta({
    title: "Reset your password — SZL Holdings",
    description: "Set a new password for your SZL Holdings account.",
    canonical: "https://szlholdings.com/reset-password",
  });

  const token = getToken();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [state, setState] = useState<State>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!token) {
      setErrorMsg("No reset token found. Please request a new password reset link.");
      setState("error");
    }
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg("");

    if (password.length < 8) {
      setErrorMsg("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setErrorMsg("Passwords do not match.");
      return;
    }

    setState("submitting");
    try {
      await apiRequest("POST", "/api/user/password-reset/confirm", { token, newPassword: password });
      setState("success");
    } catch (err: unknown) {
      const raw = err instanceof Error ? err.message : "";
      const match = raw.match(/\d+: (.*)/s);
      let msg = match?.[1] ?? raw;
      try { msg = JSON.parse(msg)?.error || JSON.parse(msg)?.message || msg; } catch { /* not JSON */ }
      setErrorMsg(msg || "That link is invalid or has expired. Please request a new one.");
      setState("error");
    }
  }

  const isSubmitting = state === "submitting";

  return (
    <>
      {__pageMeta}
      <div style={{ minHeight: "100vh", background: "hsl(214,16%,4%)", color: "hsl(38,8%,95%)" }}>
        <SiteNav />
        <main id="main-content" >
          <section style={{ paddingTop: "var(--space-hero-pt)", paddingBottom: "clamp(4rem,8vw,6rem)" }}>
            <div style={{ maxWidth: "480px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
              <m.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45 }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "1.5rem" }}>
                  <span style={{
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    width: "2.25rem", height: "2.25rem",
                    background: "hsla(192,72%,48%,0.12)",
                    borderRadius: "0.5rem",
                    border: "1px solid hsla(192,72%,48%,0.2)",
                  }}>
                    <KeyRound size={16} style={{ color: "hsl(192,72%,48%)" }} />
                  </span>
                  <p style={{ fontSize: "0.6875rem", fontFamily: "var(--font-mono)", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-szl-text-faint)", margin: 0 }}>
                    Password reset
                  </p>
                </div>
  
                <h1 style={{ fontSize: "clamp(1.5rem,3vw,2rem)", fontWeight: 600, letterSpacing: "-0.02em", lineHeight: 1.15, marginBottom: "0.5rem", color: "hsl(38,8%,94%)" }}>
                  Set a new password
                </h1>
                <p style={{ fontSize: "0.9375rem", lineHeight: 1.65, color: "var(--color-szl-text-secondary)", marginBottom: "2rem" }}>
                  Choose a strong password with at least 8 characters. All active sessions will be signed out.
                </p>
  
                {state === "success" ? (
                  <m.div
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.35 }}
                    style={{
                      display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem",
                      padding: "2.5rem 2rem",
                      background: "hsla(142,72%,40%,0.08)",
                      border: "1px solid hsla(142,72%,40%,0.2)",
                      borderRadius: "0.75rem",
                      textAlign: "center",
                    }}
                  >
                    <CheckCircle2 size={36} style={{ color: "hsl(142,72%,48%)" }} />
                    <div>
                      <p style={{ fontWeight: 600, fontSize: "1rem", color: "hsl(38,8%,94%)", marginBottom: "0.375rem" }}>
                        Password updated
                      </p>
                      <p style={{ fontSize: "0.875rem", color: "var(--color-szl-text-secondary)", marginBottom: "1.25rem" }}>
                        Your password has been reset. All other sessions have been signed out.
                      </p>
                      <Link
                        href="/"
                        style={{
                          display: "inline-flex", alignItems: "center",
                          padding: "0.625rem 1.25rem",
                          background: "hsl(192,72%,48%)",
                          color: "hsl(214,18%,4%)",
                          borderRadius: "0.375rem",
                          fontSize: "0.875rem", fontWeight: 600,
                          textDecoration: "none",
                        }}
                      >
                        Back to homepage
                      </Link>
                    </div>
                  </m.div>
                ) : state === "error" && !token ? (
                  <div style={{
                    display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "0.75rem",
                    padding: "1.25rem 1.5rem",
                    background: "hsla(0,72%,50%,0.08)",
                    border: "1px solid hsla(0,72%,50%,0.2)",
                    borderRadius: "0.75rem",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <XCircle size={18} style={{ color: "hsl(0,72%,55%)", flexShrink: 0 }} />
                      <p style={{ fontSize: "0.875rem", color: "hsl(38,8%,88%)", fontWeight: 500, margin: 0 }}>
                        Missing reset token
                      </p>
                    </div>
                    <p style={{ fontSize: "0.8125rem", color: "var(--color-szl-text-secondary)", margin: 0 }}>
                      {errorMsg}
                    </p>
                    <Link
                      href="/settings"
                      style={{
                        fontSize: "0.8125rem", fontWeight: 500,
                        color: "hsl(192,72%,52%)",
                        textDecoration: "none",
                      }}
                    >
                      Request a new password reset link →
                    </Link>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                      <label htmlFor="new-password" style={{ fontSize: "0.8125rem", fontWeight: 500, color: "hsl(38,8%,80%)" }}>
                        New password
                      </label>
                      <div style={{ position: "relative" }}>
                        <input
                          id="new-password"
                          type={showPw ? "text" : "password"}
                          value={password}
                          onChange={e => setPassword(e.target.value)}
                          placeholder="At least 8 characters"
                          required
                          minLength={8}
                          autoComplete="new-password"
                          disabled={isSubmitting}
                          style={{
                            width: "100%", boxSizing: "border-box",
                            padding: "0.625rem 2.75rem 0.625rem 0.875rem",
                            background: "hsla(0,0%,100%,0.04)",
                            border: "1px solid var(--color-szl-border-hover)",
                            borderRadius: "0.375rem",
                            color: "hsl(38,8%,94%)",
                            fontSize: "0.9375rem",
                            outline: "none",
                            transition: "border-color 0.18s",
                          }}
                          onFocus={e => { e.currentTarget.style.borderColor = "hsl(192,72%,48%)"; }}
                          onBlur={e => { e.currentTarget.style.borderColor = "var(--color-szl-border-hover)"; }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPw(v => !v)}
                          tabIndex={-1}
                          style={{
                            position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)",
                            background: "none", border: "none", cursor: "pointer", padding: 0,
                            color: "var(--color-szl-text-faint)",
                          }}
                          aria-label={showPw ? "Hide password" : "Show password"}
                        >
                          {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
  
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                      <label htmlFor="confirm-password" style={{ fontSize: "0.8125rem", fontWeight: 500, color: "hsl(38,8%,80%)" }}>
                        Confirm password
                      </label>
                      <div style={{ position: "relative" }}>
                        <input
                          id="confirm-password"
                          type={showConfirm ? "text" : "password"}
                          value={confirm}
                          onChange={e => setConfirm(e.target.value)}
                          placeholder="Re-enter your password"
                          required
                          autoComplete="new-password"
                          disabled={isSubmitting}
                          style={{
                            width: "100%", boxSizing: "border-box",
                            padding: "0.625rem 2.75rem 0.625rem 0.875rem",
                            background: "hsla(0,0%,100%,0.04)",
                            border: "1px solid var(--color-szl-border-hover)",
                            borderRadius: "0.375rem",
                            color: "hsl(38,8%,94%)",
                            fontSize: "0.9375rem",
                            outline: "none",
                            transition: "border-color 0.18s",
                          }}
                          onFocus={e => { e.currentTarget.style.borderColor = "hsl(192,72%,48%)"; }}
                          onBlur={e => { e.currentTarget.style.borderColor = "var(--color-szl-border-hover)"; }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirm(v => !v)}
                          tabIndex={-1}
                          style={{
                            position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)",
                            background: "none", border: "none", cursor: "pointer", padding: 0,
                            color: "var(--color-szl-text-faint)",
                          }}
                          aria-label={showConfirm ? "Hide password" : "Show password"}
                        >
                          {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
  
                    {errorMsg && (
                      <div style={{
                        display: "flex", alignItems: "flex-start", gap: "0.5rem",
                        padding: "0.75rem 1rem",
                        background: "hsla(0,72%,50%,0.08)",
                        border: "1px solid hsla(0,72%,50%,0.2)",
                        borderRadius: "0.375rem",
                      }}>
                        <XCircle size={15} style={{ color: "hsl(0,72%,55%)", flexShrink: 0, marginTop: "1px" }} />
                        <p style={{ fontSize: "0.8125rem", color: "hsl(38,8%,88%)", margin: 0 }}>{errorMsg}</p>
                      </div>
                    )}
  
                    <button
                      type="submit"
                      disabled={isSubmitting || !password || !confirm}
                      style={{
                        padding: "0.75rem 1.5rem",
                        background: isSubmitting ? "hsla(192,72%,48%,0.5)" : "hsl(192,72%,48%)",
                        color: "hsl(214,18%,4%)",
                        border: "none",
                        borderRadius: "0.375rem",
                        fontSize: "0.9375rem",
                        fontWeight: 600,
                        cursor: isSubmitting ? "not-allowed" : "pointer",
                        transition: "background 0.18s",
                      }}
                    >
                      {isSubmitting ? "Updating password…" : "Set new password"}
                    </button>
                  </form>
                )}
              </m.div>
            </div>
          </section>
        </main>
        <SiteFooter />
      </div>
        </>
  );
}
