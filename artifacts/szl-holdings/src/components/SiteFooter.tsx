import { Link } from "wouter";

const PRODUCT_LINKS = [
  { label: "Lyte — Command Surface", href: "/lyte" },
  { label: "Alloy — Execution Fabric", href: "/alloy-fabric" },
  { label: "PRISM Counsel", href: "/solutions/prism-counsel" },
  { label: "Terra", href: "/solutions/terra" },
  { label: "Vessels", href: "/solutions/vessels" },
  { label: "Aegis", href: "/solutions/aegis" },
  { label: "Carlota Jo", href: "/carlota-jo/" },
];

const COMPANY_LINKS = [
  { label: "Platform Overview", href: "/platform" },
  { label: "Architecture", href: "/architecture" },
  { label: "How It Works", href: "/how-it-works" },
  { label: "Design Partners", href: "/design-partner" },
  { label: "Investors", href: "/investors" },
  { label: "Trust Center", href: "/trust" },
  { label: "Docs", href: "/docs" },
  { label: "Contact", href: "/contact" },
];

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
    label: "GitHub",
    href: "https://github.com/szl-holdings",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
      </svg>
    ),
  },
];

export function SiteFooter() {
  return (
    <footer style={{ borderTop: "1px solid var(--color-szl-border)", background: "hsl(210,12%,4%)", padding: "4rem 0 2.5rem" }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div
                className="w-8 h-8 flex items-center justify-center rounded-sm"
                style={{ background: "linear-gradient(135deg, var(--color-szl-accent) 0%, hsla(38, 55%, 45%, 1) 100%)" }}
              >
                <span style={{ color: "hsl(214, 16%, 4%)", fontWeight: 700, fontSize: "0.6875rem", fontFamily: "var(--font-display)" }}>SZL</span>
              </div>
              <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, color: "var(--color-szl-text)", fontSize: "0.9375rem", letterSpacing: "-0.02em" }}>
                SZL Holdings
              </span>
            </div>
            <p style={{ color: "var(--color-szl-text-secondary)", fontSize: "0.875rem", lineHeight: 1.65, maxWidth: "18rem", marginBottom: "0.75rem" }}>
              One intelligence and action architecture with distinct vertical operating systems.
            </p>
            <p style={{ color: "var(--color-szl-text-faint)", fontSize: "0.75rem", fontFamily: "var(--font-mono)", letterSpacing: "0.04em", marginBottom: "0.2rem" }}>
              Washington, D.C. · London · Singapore
            </p>
            <p style={{ color: "var(--color-szl-text-faint)", fontSize: "0.75rem", fontFamily: "var(--font-mono)" }}>
              hello@szlholdings.com
            </p>
            <div className="flex items-center gap-3 mt-5">
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

          <div>
            <h4 style={{ fontFamily: "var(--font-mono)", fontWeight: 600, color: "var(--color-szl-text)", fontSize: "0.625rem", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "1rem" }}>
              Products
            </h4>
            <ul className="space-y-2">
              {PRODUCT_LINKS.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    style={{ fontSize: "0.8125rem", color: "var(--color-szl-text-secondary)", transition: "color 0.2s ease", display: "block" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--color-szl-text)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--color-szl-text-secondary)"; }}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 style={{ fontFamily: "var(--font-mono)", fontWeight: 600, color: "var(--color-szl-text)", fontSize: "0.625rem", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "1rem" }}>
              Company
            </h4>
            <ul className="space-y-2">
              {COMPANY_LINKS.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    style={{ fontSize: "0.8125rem", color: "var(--color-szl-text-secondary)", transition: "color 0.2s ease", display: "block" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--color-szl-text)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--color-szl-text-secondary)"; }}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div style={{ paddingTop: "1.5rem", borderTop: "1px solid var(--color-szl-border)", display: "flex", flexWrap: "wrap", gap: "0.75rem", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <p style={{ color: "var(--color-szl-text-faint)", fontSize: "0.75rem", fontFamily: "var(--font-mono)" }}>
              &copy; {new Date().getFullYear()} SZL Holdings. All rights reserved.
            </p>
            <p style={{ color: "var(--color-szl-text-faint)", fontSize: "0.6875rem", fontFamily: "var(--font-mono)", marginTop: "0.25rem", opacity: 0.7 }}>
              SZL Holdings · Stephen Lutar, Founder &amp; Officer · Proprietary platform ecosystem
            </p>
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            <Link
              href="/legal/privacy"
              style={{ color: "var(--color-szl-text-faint)", fontSize: "0.75rem", fontFamily: "var(--font-mono)", textDecoration: "none", transition: "color 0.18s ease" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--color-szl-text-secondary)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--color-szl-text-faint)"; }}
            >
              Privacy
            </Link>
            <Link
              href="/legal/terms"
              style={{ color: "var(--color-szl-text-faint)", fontSize: "0.75rem", fontFamily: "var(--font-mono)", textDecoration: "none", transition: "color 0.18s ease" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--color-szl-text-secondary)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--color-szl-text-faint)"; }}
            >
              Terms
            </Link>
            <Link
              href="/accessibility"
              style={{ color: "var(--color-szl-text-faint)", fontSize: "0.75rem", fontFamily: "var(--font-mono)", textDecoration: "none", transition: "color 0.18s ease" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--color-szl-text-secondary)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--color-szl-text-faint)"; }}
            >
              Accessibility
            </Link>
            <Link
              href="/trust"
              style={{ color: "var(--color-szl-text-faint)", fontSize: "0.75rem", fontFamily: "var(--font-mono)", textDecoration: "none", transition: "color 0.18s ease" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--color-szl-text-secondary)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--color-szl-text-faint)"; }}
            >
              Trust
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
