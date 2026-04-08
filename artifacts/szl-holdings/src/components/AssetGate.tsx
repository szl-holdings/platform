import { useState, useRef } from "react";
import { m, AnimatePresence } from "framer-motion";
import { ArrowRight, X, Download, Lock, CheckCircle2, Shield } from "lucide-react";
import type { VisitorType } from "@/hooks/useNarrativeRouter";

interface AssetGateProps {
  assetTitle: string;
  assetDescription: string;
  assetType: "gated" | "downloadable";
  visitorType?: VisitorType;
  onSuccess?: (email: string) => void;
  onClose?: () => void;
  nextHref?: string;
  children: React.ReactNode;
}

type GateStatus = "idle" | "open" | "submitting" | "success";

export function AssetGate({
  assetTitle,
  assetDescription,
  assetType,
  visitorType,
  onSuccess,
  onClose,
  nextHref = "/contact",
  children,
}: AssetGateProps) {
  const [status, setStatus] = useState<GateStatus>("idle");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [firm, setFirm] = useState("");
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleOpen = () => {
    setStatus("open");
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleClose = () => {
    setStatus("idle");
    onClose?.();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email || !email.includes("@")) {
      setError("A valid email address is required.");
      return;
    }
    setStatus("submitting");

    try {
      const res = await fetch("/api/contact/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "asset_request",
          app: "szl-holdings",
          name: name.trim() || "Anonymous",
          email,
          company: firm.trim() || undefined,
          message: `Asset request: ${assetTitle}`,
          metadata: {
            asset: assetTitle,
            assetType,
            visitorType,
            source: window.location.pathname,
          },
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError((data as { message?: string }).message || "Submission failed. Please try again.");
        setStatus("open");
        return;
      }
    } catch {
      setError("Network error. Please check your connection and try again.");
      setStatus("open");
      return;
    }

    setStatus("success");
    onSuccess?.(email);
  };

  const accentColor = assetType === "gated" ? "hsl(38,72%,58%)" : "hsl(145,60%,46%)";
  const accentRgb = assetType === "gated" ? "212,160,84" : "58,168,90";

  return (
    <>
      <span onClick={handleOpen} style={{ cursor: "pointer" }}>
        {children}
      </span>

      <AnimatePresence>
        {(status === "open" || status === "submitting" || status === "success") && (
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 9999,
              background: "hsla(214,16%,4%,0.85)",
              backdropFilter: "blur(8px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "1.5rem",
            }}
            onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
          >
            <m.div
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 8 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              style={{
                width: "100%",
                maxWidth: "440px",
                borderRadius: "1rem",
                background: "hsl(214,16%,6%)",
                border: `1px solid rgba(${accentRgb}, 0.22)`,
                padding: "2rem",
                position: "relative",
              }}
            >
              <button
                onClick={handleClose}
                style={{
                  position: "absolute", top: "1rem", right: "1rem",
                  width: "28px", height: "28px",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  borderRadius: "0.375rem",
                  background: "hsla(0,0%,100%,0.05)",
                  border: "1px solid hsla(0,0%,100%,0.08)",
                  cursor: "pointer",
                  color: "hsl(214,7%,55%)",
                }}
              >
                <X size={13} />
              </button>

              {status === "success" ? (
                <div style={{ textAlign: "center", padding: "1rem 0" }}>
                  <div style={{
                    width: "48px", height: "48px", borderRadius: "50%",
                    background: `rgba(${accentRgb}, 0.12)`,
                    border: `1px solid rgba(${accentRgb}, 0.28)`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    margin: "0 auto 1.25rem",
                  }}>
                    <CheckCircle2 size={22} style={{ color: accentColor }} />
                  </div>
                  <h3 style={{ fontSize: "1.125rem", fontWeight: 600, letterSpacing: "-0.018em", marginBottom: "0.5rem" }}>Request received.</h3>
                  <p style={{ fontSize: "0.875rem", lineHeight: 1.65, color: "hsl(214,7%,58%)", marginBottom: "1.5rem" }}>
                    We'll respond within one business day. All requests go directly to the founder — no automated sequences.
                  </p>
                  <a
                    href={nextHref}
                    style={{
                      display: "inline-flex", alignItems: "center", gap: "0.375rem",
                      padding: "0.625rem 1.25rem",
                      background: `rgba(${accentRgb}, 0.12)`,
                      border: `1px solid rgba(${accentRgb}, 0.28)`,
                      borderRadius: "0.375rem",
                      fontSize: "0.875rem", fontWeight: 600,
                      color: accentColor,
                      textDecoration: "none",
                    }}
                  >
                    See more materials <ArrowRight size={13} />
                  </a>
                </div>
              ) : (
                <>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "1.25rem" }}>
                    <div style={{
                      width: "36px", height: "36px",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      borderRadius: "0.5rem",
                      background: `rgba(${accentRgb}, 0.10)`,
                      border: `1px solid rgba(${accentRgb}, 0.22)`,
                      flexShrink: 0,
                    }}>
                      {assetType === "gated" ? (
                        <Lock size={15} style={{ color: accentColor }} />
                      ) : (
                        <Download size={15} style={{ color: accentColor }} />
                      )}
                    </div>
                    <div>
                      <p style={{ fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.10em", textTransform: "uppercase", color: accentColor, fontFamily: "var(--font-mono)" }}>
                        {assetType === "gated" ? "Gated asset" : "Download request"}
                      </p>
                      <h3 style={{ fontSize: "1rem", fontWeight: 600, letterSpacing: "-0.015em", color: "hsl(38,8%,92%)", marginTop: "0.1rem" }}>
                        {assetTitle}
                      </h3>
                    </div>
                  </div>

                  <p style={{ fontSize: "0.875rem", lineHeight: 1.65, color: "hsl(214,7%,60%)", marginBottom: "1.5rem" }}>
                    {assetDescription}
                  </p>

                  <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "0.6875rem", fontWeight: 600, color: "hsl(214,7%,50%)", marginBottom: "0.375rem", letterSpacing: "0.06em" }}>
                        Work email *
                      </label>
                      <input
                        ref={inputRef}
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@company.com"
                        style={{
                          width: "100%",
                          padding: "0.625rem 0.875rem",
                          background: "hsla(0,0%,100%,0.04)",
                          border: "1px solid hsla(0,0%,100%,0.10)",
                          borderRadius: "0.375rem",
                          fontSize: "0.875rem",
                          color: "hsl(38,8%,92%)",
                          outline: "none",
                          boxSizing: "border-box",
                        }}
                        onFocus={(e) => { (e.target as HTMLElement).style.borderColor = `rgba(${accentRgb}, 0.4)`; }}
                        onBlur={(e) => { (e.target as HTMLElement).style.borderColor = "hsla(0,0%,100%,0.10)"; }}
                      />
                    </div>
                    <div style={{ display: "grid", gap: "0.5rem", gridTemplateColumns: "1fr 1fr" }}>
                      <div>
                        <label style={{ display: "block", fontSize: "0.6875rem", fontWeight: 600, color: "hsl(214,7%,50%)", marginBottom: "0.375rem", letterSpacing: "0.06em" }}>
                          Name
                        </label>
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Your name"
                          style={{
                            width: "100%",
                            padding: "0.625rem 0.875rem",
                            background: "hsla(0,0%,100%,0.04)",
                            border: "1px solid hsla(0,0%,100%,0.10)",
                            borderRadius: "0.375rem",
                            fontSize: "0.875rem",
                            color: "hsl(38,8%,92%)",
                            outline: "none",
                            boxSizing: "border-box",
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: "0.6875rem", fontWeight: 600, color: "hsl(214,7%,50%)", marginBottom: "0.375rem", letterSpacing: "0.06em" }}>
                          Firm / Company
                        </label>
                        <input
                          type="text"
                          value={firm}
                          onChange={(e) => setFirm(e.target.value)}
                          placeholder="Optional"
                          style={{
                            width: "100%",
                            padding: "0.625rem 0.875rem",
                            background: "hsla(0,0%,100%,0.04)",
                            border: "1px solid hsla(0,0%,100%,0.10)",
                            borderRadius: "0.375rem",
                            fontSize: "0.875rem",
                            color: "hsl(38,8%,92%)",
                            outline: "none",
                            boxSizing: "border-box",
                          }}
                        />
                      </div>
                    </div>

                    {error && (
                      <p style={{ fontSize: "0.8125rem", color: "hsl(0,72%,60%)" }}>{error}</p>
                    )}

                    <button
                      type="submit"
                      disabled={status === "submitting"}
                      style={{
                        display: "flex", alignItems: "center", justifyContent: "center", gap: "0.375rem",
                        padding: "0.75rem 1.25rem",
                        background: accentColor,
                        color: "hsl(214,18%,4%)",
                        border: "none",
                        borderRadius: "0.375rem",
                        fontSize: "0.875rem", fontWeight: 600,
                        cursor: status === "submitting" ? "not-allowed" : "pointer",
                        opacity: status === "submitting" ? 0.75 : 1,
                        transition: "opacity 0.18s ease",
                      }}
                    >
                      {status === "submitting" ? "Sending request…" : `Request ${assetType === "gated" ? "access" : "download"}`}
                      {status !== "submitting" && <ArrowRight size={14} />}
                    </button>

                    <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
                      <Shield size={11} style={{ color: "hsl(214,7%,40%)" }} />
                      <p style={{ fontSize: "0.6875rem", color: "hsl(214,7%,42%)", lineHeight: 1.5 }}>
                        Requests go directly to the founder. No automated sequences. Response within 1 business day.
                      </p>
                    </div>
                  </form>
                </>
              )}
            </m.div>
          </m.div>
        )}
      </AnimatePresence>
    </>
  );
}
