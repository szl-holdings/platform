import { useState } from "react";
import { Link } from "wouter";
import { analytics } from "@/lib/analytics";

const FOOTER_COLS = [
  {
    heading: "Products",
    links: [
      { label: "Ecosystem", href: "/ecosystem" },
      { label: "Alloy", href: "/alloy-fabric" },
      { label: "Lyte", href: "/lyte" },
      { label: "Vessels", href: "/products/vessels" },
      { label: "Carlota Jo", href: "/services/carlota-jo" },
    ],
  },
  {
    heading: "Platform",
    links: [
      { label: "Platform Overview", href: "/platform" },
      { label: "Architecture", href: "/architecture" },
      { label: "How It Works", href: "/how-it-works" },
      { label: "Request Demo", href: "/demo" },
    ],
  },
  {
    heading: "Trust",
    links: [
      { label: "Trust Center", href: "/trust" },
      { label: "Security", href: "/trust/security" },
      { label: "AI Governance", href: "/trust/ai" },
      { label: "Governance", href: "/trust/governance" },
    ],
  },
  {
    heading: "Investors",
    links: [
      { label: "Investor Relations", href: "/investor-relations" },
      { label: "Investor Story", href: "/investor-story" },
      { label: "Operating Doctrine", href: "/operating-doctrine" },
      { label: "Capital Arsenal", href: "/capital-arsenal" },
    ],
  },
  {
    heading: "Resources",
    links: [
      { label: "Insights", href: "/insights" },
      { label: "Case Studies", href: "/case-studies" },
      { label: "FAQ", href: "/faq" },
      { label: "Public Roadmap", href: "/roadmap" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "About SZL Holdings", href: "/company" },
      { label: "Founder", href: "/founder" },
      { label: "Design Partners", href: "/design-partner" },
      { label: "Contact", href: "/contact" },
    ],
  },
];

const LEGAL_LINKS = [
  { label: "Privacy", href: "/legal/privacy" },
  { label: "Terms", href: "/legal/terms" },
  { label: "Acceptable Use", href: "/legal/acceptable-use" },
  { label: "Security Disclosure", href: "/trust/security" },
];

const VERSION = "v2026.1";

const SOCIAL_LINKS = [
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/company/szlholdings",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    ),
  },
  {
    label: "X / Twitter",
    href: "https://x.com/szlholdings",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    label: "Medium",
    href: "https://medium.com/@stephen_38454",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M13.54 12a6.8 6.8 0 01-6.77 6.82A6.8 6.8 0 010 12a6.8 6.8 0 016.77-6.82A6.8 6.8 0 0113.54 12zM20.96 12c0 3.54-1.51 6.42-3.38 6.42-1.87 0-3.39-2.88-3.39-6.42s1.52-6.42 3.39-6.42 3.38 2.88 3.38 6.42M24 12c0 3.17-.53 5.75-1.19 5.75-.66 0-1.19-2.58-1.19-5.75s.53-5.75 1.19-5.75C23.47 6.25 24 8.83 24 12z" />
      </svg>
    ),
  },
  {
    label: "Substack",
    href: "https://szlholdings.substack.com",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M22.539 8.242H1.46V5.406h21.08v2.836zM1.46 10.812V24L12 18.11 22.54 24V10.812H1.46zM22.54 0H1.46v2.836h21.08V0z" />
      </svg>
    ),
  },
];

function FooterNewsletter() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@")) return;
    setStatus("submitting");
    try {
      const res = await fetch("/api/contact/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "general",
          name: email.split("@")[0],
          email,
          message: "Newsletter subscription via footer.",
          app: "szl-holdings",
          metadata: { source: "footer-newsletter" },
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error ?? "Subscription failed");
      }
      setStatus("success");
      analytics.emailCapture("footer");
      analytics.newsletterSubscribe("footer");
      try { localStorage.setItem("szl_newsletter_subscribed", "true"); } catch {}
    } catch {
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <p style={{ fontSize: "0.75rem", color: "hsl(145,60%,46%)", marginBottom: "0.5rem" }}>
        Subscribed. We'll send analysis when it's worth reading.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ marginBottom: "0.5rem" }}>
      <p style={{ fontSize: "0.6875rem", fontFamily: "var(--font-mono)", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-szl-text-faint)", marginBottom: "0.5rem" }}>
        Strategic Analysis
      </p>
      <div style={{ display: "flex", gap: "0.375rem" }}>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="your@email.com"
          required
          style={{
            flex: 1,
            padding: "0.4375rem 0.625rem",
            background: "hsla(214,12%,8%,0.72)",
            border: "1px solid hsla(0,0%,100%,0.1)",
            borderRadius: "0.375rem",
            fontSize: "0.75rem",
            color: "hsl(38,8%,92%)",
            outline: "none",
            minWidth: 0,
          }}
        />
        <button
          type="submit"
          disabled={status === "submitting"}
          style={{
            padding: "0.4375rem 0.75rem",
            background: "hsla(192,72%,48%,0.15)",
            border: "1px solid hsla(192,72%,48%,0.3)",
            borderRadius: "0.375rem",
            color: "hsl(192,72%,60%)",
            fontSize: "0.6875rem",
            fontWeight: 600,
            cursor: status === "submitting" ? "not-allowed" : "pointer",
            whiteSpace: "nowrap",
          }}
        >
          {status === "submitting" ? "…" : "Subscribe"}
        </button>
      </div>
      {status === "error" && (
        <p style={{ fontSize: "0.6875rem", color: "hsl(0,72%,60%)", marginTop: "0.25rem" }}>
          Could not subscribe. Try again.
        </p>
      )}
    </form>
  );
}

export function SiteFooter() {
  return (
    <footer style={{ borderTop: "1px solid var(--color-szl-border)", background: "hsl(210,12%,4%)", padding: "4rem 0 2rem" }}>
      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>

        {/* Top: Brand + columns */}
        <div style={{ display: "grid", gridTemplateColumns: "1.4fr repeat(6, 1fr)", gap: "2rem", marginBottom: "3rem" }} className="grid-cols-2 sm:grid-cols-3 lg:grid-cols-[1.4fr_repeat(6,1fr)]">

          {/* Brand column */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
              <div
                style={{
                  width: "28px", height: "28px",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  borderRadius: "0.25rem",
                  background: "linear-gradient(135deg, var(--color-szl-accent) 0%, hsl(38,45%,42%) 100%)",
                  flexShrink: 0,
                }}
              >
                <span style={{ color: "hsl(214,16%,4%)", fontWeight: 700, fontSize: "0.5625rem", fontFamily: "var(--font-display)" }}>SZL</span>
              </div>
              <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, color: "var(--color-szl-text)", fontSize: "0.875rem", letterSpacing: "-0.02em" }}>
                SZL Holdings
              </span>
            </div>
            <p style={{ color: "var(--color-szl-text-secondary)", fontSize: "0.8125rem", lineHeight: 1.65, maxWidth: "16rem", marginBottom: "1rem" }}>
              Business observability with explainable execution. Lyte is the commercial wedge. Alloy is the fabric beneath it.
            </p>
            <p style={{ color: "var(--color-szl-text-faint)", fontSize: "0.6875rem", fontFamily: "var(--font-mono)", letterSpacing: "0.04em", marginBottom: "0.2rem" }}>
              Washington, D.C. · London · Singapore
            </p>
            <p style={{ color: "var(--color-szl-text-faint)", fontSize: "0.6875rem", fontFamily: "var(--font-mono)", marginBottom: "1rem" }}>
              hello@szlholdings.com
            </p>
            <FooterNewsletter />
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginTop: "1rem" }}>
              {SOCIAL_LINKS.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={link.label}
                  title={link.label}
                  style={{
                    color: "var(--color-szl-text-faint)", transition: "color 0.2s ease",
                    display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "0.25rem",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--color-szl-text-secondary)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--color-szl-text-faint)"; }}
                >
                  {link.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Nav columns */}
          {FOOTER_COLS.map((col) => (
            <div key={col.heading}>
              <h4 style={{
                fontFamily: "var(--font-mono)",
                fontWeight: 600,
                color: "var(--color-szl-text-faint)",
                fontSize: "0.5625rem",
                textTransform: "uppercase",
                letterSpacing: "0.12em",
                marginBottom: "0.875rem",
              }}>
                {col.heading}
              </h4>
              <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      style={{ fontSize: "0.8125rem", color: "var(--color-szl-text-secondary)", transition: "color 0.18s ease", display: "block", textDecoration: "none" }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--color-szl-text)"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--color-szl-text-secondary)"; }}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div style={{
          paddingTop: "1.5rem",
          borderTop: "1px solid var(--color-szl-border)",
          display: "flex",
          flexWrap: "wrap",
          gap: "1rem",
          alignItems: "center",
          justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", alignItems: "center" }}>
            <p style={{ color: "var(--color-szl-text-faint)", fontSize: "0.6875rem", fontFamily: "var(--font-mono)", marginRight: "0.5rem" }}>
              &copy; {new Date().getFullYear()} SZL Holdings
            </p>
            <span style={{ color: "var(--color-szl-text-faint)", fontSize: "0.6875rem", fontFamily: "var(--font-mono)", opacity: 0.5 }}>·</span>
            <p style={{ color: "var(--color-szl-text-faint)", fontSize: "0.6875rem", fontFamily: "var(--font-mono)", opacity: 0.65 }}>
              Stephen Lutar, Founder
            </p>
            <span style={{ color: "var(--color-szl-text-faint)", fontSize: "0.6875rem", fontFamily: "var(--font-mono)", opacity: 0.5 }}>·</span>
            <p style={{ color: "var(--color-szl-text-faint)", fontSize: "0.6875rem", fontFamily: "var(--font-mono)", opacity: 0.5 }}>
              {VERSION}
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
            {LEGAL_LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                style={{ color: "var(--color-szl-text-faint)", fontSize: "0.6875rem", fontFamily: "var(--font-mono)", textDecoration: "none", transition: "color 0.18s ease" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--color-szl-text-secondary)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--color-szl-text-faint)"; }}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
