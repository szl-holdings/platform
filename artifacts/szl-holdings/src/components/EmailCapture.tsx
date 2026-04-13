import { useState, useEffect, useCallback } from "react";
import { m, AnimatePresence } from "framer-motion";
import { X, Mail, ArrowRight, CheckCircle } from "lucide-react";
import { analytics } from "@/lib/analytics";

function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function submitEmail(email: string, source: string) {
  const res = await fetch("/api/contact/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "newsletter",
      name: email.split("@")[0],
      email,
      app: "szl-holdings",
      message: `Email capture: ${source}`,
      metadata: { source },
    }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as { message?: string }).message || "Submission failed");
  }
  return res.json();
}

// ─── Exit Intent Popup ────────────────────────────────────────────────────────

interface ExitIntentPopupProps {
  onDismiss?: () => void;
}

export function ExitIntentPopup({ onDismiss }: ExitIntentPopupProps) {
  const [visible, setVisible] = useState(false);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const dismiss = useCallback(() => {
    setVisible(false);
    try { localStorage.setItem("szl_exit_popup_dismissed", "true"); } catch {}
    onDismiss?.();
  }, [onDismiss]);

  useEffect(() => {
    try {
      if (localStorage.getItem("szl_exit_popup_dismissed") === "true") return;
      if (localStorage.getItem("szl_newsletter_subscribed") === "true") return;
    } catch {}

    let triggered = false;
    const handleMouseLeave = (e: MouseEvent) => {
      if (triggered || e.clientY > 50) return;
      triggered = true;
      setTimeout(() => {
        setVisible(true);
        analytics.exitIntentShown();
      }, 200);
    };

    const timer = setTimeout(() => {
      document.addEventListener("mouseleave", handleMouseLeave);
    }, 8000);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEmail(email)) {
      setErrorMsg("Please enter a valid email.");
      setStatus("error");
      return;
    }
    setStatus("submitting");
    setErrorMsg("");
    try {
      await submitEmail(email, "exit-intent-popup");
      setStatus("success");
      analytics.emailCapture("exit-intent-popup");
      analytics.newsletterSubscribe("exit-intent-popup");
      try { localStorage.setItem("szl_newsletter_subscribed", "true"); } catch {}
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong.");
    }
  };

  return (
    <AnimatePresence>
      {visible && (
        <>
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={dismiss}
            style={{ position: "fixed", inset: 0, background: "hsla(0,0%,0%,0.6)", backdropFilter: "blur(4px)", zIndex: 9990 }}
            aria-hidden="true"
          />
          <m.div
            initial={{ opacity: 0, y: 32, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            role="dialog"
            aria-modal="true"
            aria-label="Subscribe to SZL Insights"
            style={{
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              zIndex: 9991,
              width: "clamp(300px, 90vw, 480px)",
              background: "hsl(214,14%,6%)",
              border: "1px solid hsla(0,0%,100%,0.1)",
              borderRadius: "1.25rem",
              padding: "2rem",
              boxShadow: "0 32px 80px hsla(0,0%,0%,0.7)",
            }}
          >
            <button
              onClick={dismiss}
              aria-label="Close"
              style={{
                position: "absolute", top: "1rem", right: "1rem",
                background: "none", border: "none", cursor: "pointer",
                color: "hsl(214,7%,50%)", padding: "0.25rem", borderRadius: "0.25rem",
              }}
            >
              <X size={16} />
            </button>

            {status === "success" ? (
              <div style={{ textAlign: "center", padding: "1rem 0" }}>
                <div style={{ width: 48, height: 48, borderRadius: "50%", background: "hsla(145,60%,46%,0.12)", border: "1px solid hsla(145,60%,46%,0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem" }}>
                  <CheckCircle size={22} color="hsl(145,60%,46%)" />
                </div>
                <h2 style={{ fontSize: "1.125rem", fontWeight: 600, color: "hsl(38,8%,92%)", marginBottom: "0.5rem" }}>You're in.</h2>
                <p style={{ fontSize: "0.875rem", color: "hsl(214,7%,55%)", lineHeight: 1.6, marginBottom: "1.25rem" }}>
                  We'll send you analysis when it's worth reading — no digest, no filler.
                </p>
                <button
                  onClick={dismiss}
                  style={{ padding: "0.625rem 1.5rem", background: "hsl(192,72%,48%)", border: "none", borderRadius: "0.5rem", color: "hsl(214,16%,4%)", fontWeight: 600, fontSize: "0.875rem", cursor: "pointer" }}
                >
                  Continue reading
                </button>
              </div>
            ) : (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.25rem" }}>
                  <div style={{ width: 36, height: 36, borderRadius: "0.625rem", background: "hsla(192,72%,48%,0.12)", border: "1px solid hsla(192,72%,48%,0.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Mail size={16} color="hsl(192,72%,48%)" />
                  </div>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.625rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "hsl(192,72%,48%)" }}>
                    SZL Insights
                  </span>
                </div>

                <h2 style={{ fontSize: "1.375rem", fontWeight: 600, letterSpacing: "-0.02em", color: "hsl(38,8%,92%)", lineHeight: 1.25, marginBottom: "0.625rem" }}>
                  Before you go — get the analysis.
                </h2>
                <p style={{ fontSize: "0.875rem", color: "hsl(214,7%,55%)", lineHeight: 1.65, marginBottom: "1.5rem" }}>
                  Founder-written thinking on business observability, operational AI, and the SZL thesis. Published when it's worth reading.
                </p>

                <form onSubmit={handleSubmit} noValidate>
                  <label htmlFor="exit-popup-email" style={{ display: "block", fontSize: "0.75rem", fontWeight: 500, color: "hsl(214,7%,60%)", marginBottom: "0.375rem" }}>
                    Email address
                  </label>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <input
                      id="exit-popup-email"
                      type="email"
                      value={email}
                      onChange={e => { setEmail(e.target.value); if (status === "error") { setStatus("idle"); setErrorMsg(""); } }}
                      placeholder="you@company.com"
                      disabled={status === "submitting"}
                      aria-invalid={status === "error"}
                      aria-describedby={errorMsg ? "exit-email-error" : undefined}
                      style={{
                        flex: 1,
                        padding: "0.625rem 0.875rem",
                        background: "hsla(0,0%,100%,0.06)",
                        border: `1px solid ${status === "error" ? "hsla(0,72%,60%,0.6)" : "hsla(0,0%,100%,0.12)"}`,
                        borderRadius: "0.5rem",
                        color: "hsl(38,8%,92%)",
                        fontSize: "0.875rem",
                        outline: "none",
                      }}
                      onFocus={e => { (e.currentTarget as HTMLElement).style.borderColor = "hsla(192,72%,48%,0.6)"; }}
                      onBlur={e => { (e.currentTarget as HTMLElement).style.borderColor = status === "error" ? "hsla(0,72%,60%,0.6)" : "hsla(0,0%,100%,0.12)"; }}
                    />
                    <button
                      type="submit"
                      disabled={status === "submitting"}
                      style={{
                        padding: "0.625rem 1rem",
                        background: "hsl(192,72%,48%)",
                        border: "none",
                        borderRadius: "0.5rem",
                        color: "hsl(214,16%,4%)",
                        fontWeight: 600,
                        fontSize: "0.8125rem",
                        cursor: status === "submitting" ? "not-allowed" : "pointer",
                        opacity: status === "submitting" ? 0.7 : 1,
                        display: "flex", alignItems: "center", gap: "0.375rem",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {status === "submitting" ? "Sending…" : <>Subscribe <ArrowRight size={13} /></>}
                    </button>
                  </div>
                  {errorMsg && <p id="exit-email-error" role="alert" style={{ fontSize: "0.75rem", color: "hsl(0,72%,68%)", marginTop: "0.375rem" }}>{errorMsg}</p>}
                  <p style={{ fontSize: "0.6875rem", color: "hsl(214,7%,40%)", marginTop: "0.75rem" }}>
                    No spam. No digest. Unsubscribe anytime.
                  </p>
                </form>

                <button
                  onClick={dismiss}
                  style={{ background: "none", border: "none", cursor: "pointer", fontSize: "0.75rem", color: "hsl(214,7%,40%)", marginTop: "0.75rem", padding: 0 }}
                >
                  No thanks, continue without subscribing
                </button>
              </>
            )}
          </m.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── Inline Article CTA ───────────────────────────────────────────────────────

interface InlineEmailCTAProps {
  title?: string;
  description?: string;
  source?: string;
}

export function InlineEmailCTA({
  title = "Get analysis like this in your inbox.",
  description = "Founder-written perspectives on business observability, AI, and the SZL thesis. Published when it's worth reading.",
  source = "inline-article-cta",
}: InlineEmailCTAProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEmail(email)) {
      setErrorMsg("Please enter a valid email.");
      setStatus("error");
      return;
    }
    setStatus("submitting");
    setErrorMsg("");
    try {
      await submitEmail(email, source);
      setStatus("success");
      analytics.emailCapture(source);
      analytics.newsletterSubscribe(source);
      try { localStorage.setItem("szl_newsletter_subscribed", "true"); } catch {}
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong.");
    }
  };

  return (
    <div style={{
      padding: "2rem",
      borderRadius: "0.875rem",
      background: "hsla(192,72%,48%,0.04)",
      border: "1px solid hsla(192,72%,48%,0.18)",
      margin: "2rem 0",
    }}>
      {status === "success" ? (
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <CheckCircle size={20} color="hsl(145,60%,46%)" />
          <div>
            <p style={{ fontSize: "0.9375rem", fontWeight: 600, color: "hsl(38,8%,92%)", margin: 0 }}>You're subscribed.</p>
            <p style={{ fontSize: "0.8125rem", color: "hsl(214,7%,55%)", margin: "0.125rem 0 0" }}>We'll send you analysis when it's worth reading.</p>
          </div>
        </div>
      ) : (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
            <Mail size={14} color="hsl(192,72%,48%)" />
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.625rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "hsl(192,72%,48%)" }}>SZL Insights</span>
          </div>
          <h3 style={{ fontSize: "1rem", fontWeight: 600, letterSpacing: "-0.015em", color: "hsl(38,8%,92%)", marginBottom: "0.375rem" }}>{title}</h3>
          <p style={{ fontSize: "0.8125rem", color: "hsl(214,7%,55%)", lineHeight: 1.65, marginBottom: "1.125rem" }}>{description}</p>
          <form onSubmit={handleSubmit} noValidate>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              <input
                type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); if (status === "error") { setStatus("idle"); setErrorMsg(""); } }}
                placeholder="you@company.com"
                disabled={status === "submitting"}
                aria-label="Email address"
                style={{
                  flex: "1 1 200px",
                  padding: "0.5625rem 0.875rem",
                  background: "hsla(0,0%,100%,0.06)",
                  border: `1px solid ${status === "error" ? "hsla(0,72%,60%,0.6)" : "hsla(0,0%,100%,0.12)"}`,
                  borderRadius: "0.375rem",
                  color: "hsl(38,8%,92%)",
                  fontSize: "0.875rem",
                  outline: "none",
                }}
                onFocus={e => { (e.currentTarget as HTMLElement).style.borderColor = "hsla(192,72%,48%,0.6)"; }}
                onBlur={e => { (e.currentTarget as HTMLElement).style.borderColor = status === "error" ? "hsla(0,72%,60%,0.6)" : "hsla(0,0%,100%,0.12)"; }}
              />
              <button
                type="submit"
                disabled={status === "submitting"}
                style={{
                  padding: "0.5625rem 1rem",
                  background: "hsl(192,72%,48%)",
                  border: "none",
                  borderRadius: "0.375rem",
                  color: "hsl(214,16%,4%)",
                  fontWeight: 600,
                  fontSize: "0.8125rem",
                  cursor: status === "submitting" ? "not-allowed" : "pointer",
                  opacity: status === "submitting" ? 0.7 : 1,
                  whiteSpace: "nowrap",
                  display: "flex", alignItems: "center", gap: "0.375rem",
                }}
              >
                {status === "submitting" ? "Sending…" : <>Subscribe <ArrowRight size={13} /></>}
              </button>
            </div>
            {errorMsg && <p role="alert" style={{ fontSize: "0.75rem", color: "hsl(0,72%,68%)", marginTop: "0.375rem" }}>{errorMsg}</p>}
          </form>
        </>
      )}
    </div>
  );
}

// ─── Post-Demo Prompt ─────────────────────────────────────────────────────────

interface PostDemoPromptProps {
  show: boolean;
  onDismiss: () => void;
}

export function PostDemoPrompt({ show, onDismiss }: PostDemoPromptProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEmail(email)) return;
    setStatus("submitting");
    try {
      await submitEmail(email, "post-demo-prompt");
      setStatus("success");
      analytics.emailCapture("post-demo-prompt");
      analytics.newsletterSubscribe("post-demo-prompt");
    } catch {
      setStatus("error");
    }
  };

  return (
    <AnimatePresence>
      {show && (
        <m.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          style={{
            position: "fixed",
            bottom: "5.5rem",
            right: "1.5rem",
            zIndex: 9980,
            width: "clamp(280px, 85vw, 340px)",
            background: "hsl(214,14%,6%)",
            border: "1px solid hsla(192,72%,48%,0.25)",
            borderRadius: "0.875rem",
            padding: "1.25rem",
            boxShadow: "0 12px 40px hsla(0,0%,0%,0.5)",
          }}
        >
          <button
            onClick={onDismiss}
            style={{ position: "absolute", top: "0.75rem", right: "0.75rem", background: "none", border: "none", cursor: "pointer", color: "hsl(214,7%,50%)" }}
            aria-label="Dismiss"
          >
            <X size={14} />
          </button>

          {status === "success" ? (
            <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
              <CheckCircle size={18} color="hsl(145,60%,46%)" />
              <div>
                <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "hsl(38,8%,92%)", margin: 0 }}>Got it. We'll be in touch.</p>
                <p style={{ fontSize: "0.75rem", color: "hsl(214,7%,55%)", margin: "0.125rem 0 0" }}>Expect a follow-up from the team.</p>
              </div>
            </div>
          ) : (
            <>
              <p style={{ fontSize: "0.6875rem", fontFamily: "var(--font-mono)", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "hsl(192,72%,48%)", marginBottom: "0.5rem" }}>
                Liked the demo?
              </p>
              <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "hsl(38,8%,92%)", marginBottom: "0.375rem" }}>
                Get updates as we build.
              </p>
              <p style={{ fontSize: "0.75rem", color: "hsl(214,7%,55%)", lineHeight: 1.6, marginBottom: "0.875rem" }}>
                We're in design-partner stage. Drop your email and we'll reach out when we're ready to bring you in.
              </p>
              <form onSubmit={handleSubmit} noValidate>
                <div style={{ display: "flex", gap: "0.375rem" }}>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    disabled={status === "submitting"}
                    aria-label="Email address"
                    style={{
                      flex: 1,
                      padding: "0.5rem 0.75rem",
                      background: "hsla(0,0%,100%,0.06)",
                      border: "1px solid hsla(0,0%,100%,0.12)",
                      borderRadius: "0.375rem",
                      color: "hsl(38,8%,92%)",
                      fontSize: "0.8125rem",
                      outline: "none",
                    }}
                    onFocus={e => { (e.currentTarget as HTMLElement).style.borderColor = "hsla(192,72%,48%,0.5)"; }}
                    onBlur={e => { (e.currentTarget as HTMLElement).style.borderColor = "hsla(0,0%,100%,0.12)"; }}
                  />
                  <button
                    type="submit"
                    disabled={!email.trim() || status === "submitting"}
                    style={{
                      padding: "0.5rem 0.75rem",
                      background: "hsl(192,72%,48%)",
                      border: "none",
                      borderRadius: "0.375rem",
                      color: "hsl(214,16%,4%)",
                      fontWeight: 600,
                      fontSize: "0.75rem",
                      cursor: "pointer",
                    }}
                  >
                    {status === "submitting" ? "…" : "Join"}
                  </button>
                </div>
              </form>
            </>
          )}
        </m.div>
      )}
    </AnimatePresence>
  );
}
