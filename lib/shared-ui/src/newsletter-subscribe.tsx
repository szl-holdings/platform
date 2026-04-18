import { useState } from "react";

export type NewsletterSubscribeVariant = "inline" | "compact" | "banner";

export interface NewsletterSubscribeProps {
  utmSource: string;
  variant?: NewsletterSubscribeVariant;
  accentColor?: string;
  heading?: string;
  subheading?: string;
  className?: string;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

const API_BASE = "/api";

export function NewsletterSubscribe({
  utmSource,
  variant = "inline",
  accentColor,
  heading,
  subheading,
  className = "",
}: NewsletterSubscribeProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const gold = accentColor ?? "hsl(38, 52%, 58%)";
  const goldMuted = `hsla(38, 52%, 58%, 0.12)`;
  const goldBorder = `hsla(38, 52%, 58%, 0.22)`;
  const textFaint = "hsla(0, 0%, 100%, 0.35)";
  const textSecondary = "hsla(0, 0%, 100%, 0.6)";
  const surface = "hsla(214, 12%, 10%, 0.75)";
  const border = "hsla(0, 0%, 100%, 0.08)";

  const defaultHeading =
    variant === "compact"
      ? "Subscribe to SZL Command"
      : "Stay ahead with SZL Command";
  const defaultSubheading =
    variant === "compact"
      ? "Intelligence delivered to your inbox."
      : "Weekly intelligence briefings on governed AI, portfolio operations, and domain insights — direct to your inbox.";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg("");

    if (!isValidEmail(email)) {
      setErrorMsg("Please enter a valid email address.");
      return;
    }

    setStatus("loading");

    try {
      const res = await fetch(`${API_BASE}/newsletter/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), utm_source: utmSource }),
      });

      if (res.ok) {
        setStatus("success");
        setEmail("");
      } else {
        const data = await res.json().catch(() => ({}));
        setErrorMsg((data as { message?: string }).message ?? "Something went wrong. Please try again.");
        setStatus("error");
      }
    } catch {
      setErrorMsg("Unable to subscribe right now. Please try again later.");
      setStatus("error");
    }
  }

  if (variant === "banner") {
    return (
      <div
        className={className}
        style={{
          background: `linear-gradient(135deg, hsla(38,52%,18%,0.55) 0%, hsla(214,14%,8%,0.9) 100%)`,
          border: `1px solid ${goldBorder}`,
          borderRadius: "0.5rem",
          padding: "2rem 2.5rem",
          display: "flex",
          flexDirection: "column",
          gap: "1.25rem",
        }}
      >
        <div>
          <p
            style={{
              fontFamily: "var(--font-mono, monospace)",
              fontSize: "0.5625rem",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: gold,
              marginBottom: "0.5rem",
            }}
          >
            SZL Command Newsletter
          </p>
          <h3
            style={{
              fontFamily: "var(--font-display, sans-serif)",
              fontWeight: 600,
              fontSize: "1.25rem",
              color: "hsl(38,8%,95%)",
              letterSpacing: "-0.02em",
              margin: 0,
              lineHeight: 1.3,
            }}
          >
            {heading ?? defaultHeading}
          </h3>
          <p style={{ color: textSecondary, fontSize: "0.8125rem", marginTop: "0.375rem", lineHeight: 1.6 }}>
            {subheading ?? defaultSubheading}
          </p>
        </div>
        <SubscribeForm
          email={email}
          setEmail={setEmail}
          status={status}
          errorMsg={errorMsg}
          handleSubmit={handleSubmit}
          gold={gold}
          goldMuted={goldMuted}
          goldBorder={goldBorder}
          textFaint={textFaint}
          textSecondary={textSecondary}
          compact={false}
        />
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <div className={className} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        <div>
          <p
            style={{
              fontFamily: "var(--font-mono, monospace)",
              fontSize: "0.5rem",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: gold,
              marginBottom: "0.3rem",
            }}
          >
            SZL Command Newsletter
          </p>
          <p style={{ color: textSecondary, fontSize: "0.8125rem", lineHeight: 1.5 }}>
            {heading ?? defaultHeading}
          </p>
          <p style={{ color: textFaint, fontSize: "0.6875rem", lineHeight: 1.5, marginTop: "0.2rem" }}>
            {subheading ?? defaultSubheading}
          </p>
        </div>
        <SubscribeForm
          email={email}
          setEmail={setEmail}
          status={status}
          errorMsg={errorMsg}
          handleSubmit={handleSubmit}
          gold={gold}
          goldMuted={goldMuted}
          goldBorder={goldBorder}
          textFaint={textFaint}
          textSecondary={textSecondary}
          compact={true}
        />
      </div>
    );
  }

  return (
    <div
      className={className}
      style={{
        background: surface,
        border: `1px solid ${border}`,
        borderRadius: "0.5rem",
        padding: "2.5rem",
        display: "flex",
        flexDirection: "column",
        gap: "1.5rem",
        maxWidth: "560px",
        margin: "0 auto",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <p
          style={{
            fontFamily: "var(--font-mono, monospace)",
            fontSize: "0.5625rem",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: gold,
            marginBottom: "0.75rem",
          }}
        >
          SZL Command Newsletter
        </p>
        <h3
          style={{
            fontFamily: "var(--font-display, sans-serif)",
            fontWeight: 600,
            fontSize: "1.375rem",
            color: "hsl(38,8%,95%)",
            letterSpacing: "-0.02em",
            margin: "0 0 0.5rem",
            lineHeight: 1.3,
          }}
        >
          {heading ?? defaultHeading}
        </h3>
        <p style={{ color: textSecondary, fontSize: "0.875rem", lineHeight: 1.65 }}>
          {subheading ?? defaultSubheading}
        </p>
      </div>
      <SubscribeForm
        email={email}
        setEmail={setEmail}
        status={status}
        errorMsg={errorMsg}
        handleSubmit={handleSubmit}
        gold={gold}
        goldMuted={goldMuted}
        goldBorder={goldBorder}
        textFaint={textFaint}
        textSecondary={textSecondary}
        compact={false}
      />
    </div>
  );
}

interface SubscribeFormProps {
  email: string;
  setEmail: (v: string) => void;
  status: "idle" | "loading" | "success" | "error";
  errorMsg: string;
  handleSubmit: (e: React.FormEvent) => void;
  gold: string;
  goldMuted: string;
  goldBorder: string;
  textFaint: string;
  textSecondary: string;
  compact: boolean;
}

function SubscribeForm({
  email,
  setEmail,
  status,
  errorMsg,
  handleSubmit,
  gold,
  goldMuted,
  goldBorder,
  textFaint,
  textSecondary,
  compact,
}: SubscribeFormProps) {
  if (status === "success") {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.625rem",
          padding: compact ? "0.625rem 0.875rem" : "0.875rem 1.25rem",
          background: "hsla(140,60%,40%,0.10)",
          border: "1px solid hsla(140,60%,40%,0.22)",
          borderRadius: "0.375rem",
        }}
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ color: "hsl(140,60%,52%)", flexShrink: 0 }}>
          <path d="M13.5 4.5L6.5 11.5L3 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <p style={{ color: "hsl(140,60%,52%)", fontSize: compact ? "0.75rem" : "0.8125rem", margin: 0 }}>
          You're subscribed. Check your inbox to confirm.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: compact ? "nowrap" : "wrap" }}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          required
          disabled={status === "loading"}
          style={{
            flex: 1,
            minWidth: 0,
            padding: compact ? "0.5rem 0.75rem" : "0.625rem 0.875rem",
            background: "hsla(214,14%,6%,0.8)",
            border: `1px solid ${goldBorder}`,
            borderRadius: "0.25rem",
            color: "hsl(38,8%,95%)",
            fontSize: compact ? "0.75rem" : "0.8125rem",
            outline: "none",
            fontFamily: "inherit",
            transition: "border-color 0.18s ease",
          }}
          onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = gold; }}
          onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = goldBorder; }}
        />
        <button
          type="submit"
          disabled={status === "loading" || !email.trim()}
          style={{
            padding: compact ? "0.5rem 1rem" : "0.625rem 1.25rem",
            background: status === "loading" ? goldMuted : gold,
            border: `1px solid ${gold}`,
            borderRadius: "0.25rem",
            color: "hsl(214,16%,6%)",
            fontWeight: 600,
            fontSize: compact ? "0.6875rem" : "0.75rem",
            fontFamily: "var(--font-mono, monospace)",
            letterSpacing: "0.04em",
            cursor: status === "loading" ? "not-allowed" : "pointer",
            whiteSpace: "nowrap",
            transition: "background 0.18s ease, opacity 0.18s ease",
            opacity: status === "loading" || !email.trim() ? 0.7 : 1,
          }}
          onMouseEnter={(e) => {
            if (status !== "loading") {
              (e.currentTarget as HTMLButtonElement).style.background = "hsl(38,55%,66%)";
            }
          }}
          onMouseLeave={(e) => {
            if (status !== "loading") {
              (e.currentTarget as HTMLButtonElement).style.background = gold;
            }
          }}
        >
          {status === "loading" ? "Subscribing…" : "Subscribe"}
        </button>
      </div>
      {errorMsg && (
        <p style={{ color: "hsl(0,72%,62%)", fontSize: "0.6875rem", margin: 0 }}>{errorMsg}</p>
      )}
      <p style={{ color: textFaint, fontSize: "0.6rem", letterSpacing: "0.03em", margin: 0 }}>
        No spam. Unsubscribe any time.{" "}
        <a
          href="https://szlholdings.substack.com"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: textSecondary, textDecoration: "none" }}
        >
          szlholdings.substack.com
        </a>
      </p>
    </form>
  );
}
