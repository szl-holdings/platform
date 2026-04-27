import { useState } from "react";
import { m } from "framer-motion";
import { Link } from "wouter";
import { Mail, CheckCircle2, XCircle, KeyRound } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";
import { apiRequest } from "@/lib/api";

type State = "idle" | "submitting" | "success" | "error";

export default function ForgotPasswordPage() {
  const __pageMeta = usePageMeta({
    title: "Forgot password — SZL Holdings",
    description: "Request a password reset link for your SZL Holdings account.",
    canonical: "https://szlholdings.com/forgot-password",
  });

  const [email, setEmail] = useState("");
  const [state, setState] = useState<State>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg("");

    if (!email.trim()) {
      setErrorMsg("Please enter your email address.");
      return;
    }

    setState("submitting");
    try {
      await apiRequest("POST", "/api/user/password-reset", { email: email.trim().toLowerCase() });
      setState("success");
    } catch (err: unknown) {
      const raw = err instanceof Error ? err.message : "";
      const match = raw.match(/\d+: (.*)/s);
      let msg = match?.[1] ?? raw;
      try { msg = JSON.parse(msg)?.error || JSON.parse(msg)?.message || msg; } catch { /* not JSON */ }
      setErrorMsg(msg || "Something went wrong. Please try again.");
      setState("error");
    }
  }

  const isSubmitting = state === "submitting";

  return (
    <>
      {__pageMeta}
      <div style={{ minHeight: "100vh", background: "hsl(214,16%,4%)", color: "hsl(38,8%,95%)" }}>
        <SiteNav />
        <main id="main-content">
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
                  Forgot your password?
                </h1>
                <p style={{ fontSize: "0.9375rem", lineHeight: 1.65, color: "var(--color-szl-text-secondary)", marginBottom: "2rem" }}>
                  Enter your email address and we'll send you a link to reset your password.
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
                        Check your email
                      </p>
                      <p style={{ fontSize: "0.875rem", color: "var(--color-szl-text-secondary)", marginBottom: "1.25rem" }}>
                        If an account exists for <strong style={{ color: "hsl(38,8%,88%)" }}>{email}</strong>, you'll receive a reset link shortly.
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
                ) : (
                  <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                      <label htmlFor="reset-email" style={{ fontSize: "0.8125rem", fontWeight: 500, color: "hsl(38,8%,80%)" }}>
                        Email address
                      </label>
                      <div style={{ position: "relative" }}>
                        <span style={{
                          position: "absolute", left: "0.875rem", top: "50%", transform: "translateY(-50%)",
                          color: "var(--color-szl-text-faint)", pointerEvents: "none",
                        }}>
                          <Mail size={15} />
                        </span>
                        <input
                          id="reset-email"
                          type="email"
                          value={email}
                          onChange={e => setEmail(e.target.value)}
                          placeholder="you@example.com"
                          required
                          autoComplete="email"
                          autoFocus
                          disabled={isSubmitting}
                          style={{
                            width: "100%", boxSizing: "border-box",
                            padding: "0.625rem 0.875rem 0.625rem 2.375rem",
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
                      disabled={isSubmitting || !email.trim()}
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
                      {isSubmitting ? "Sending reset link…" : "Send reset link"}
                    </button>

                    <p style={{ textAlign: "center", fontSize: "0.8125rem", color: "var(--color-szl-text-faint)", margin: 0 }}>
                      Remember your password?{" "}
                      <Link
                        href="/"
                        style={{ color: "hsl(192,72%,52%)", textDecoration: "none", fontWeight: 500 }}
                      >
                        Back to sign in
                      </Link>
                    </p>
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
