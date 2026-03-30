import { Link } from "wouter";

const PLATFORMS_LINKS = [
  { label: "Alloy", href: "/alloy/" },
  { label: "Lyte", href: "/lyte-command-center/" },
  { label: "Vessels", href: "/vessels/" },
];

const SERVICES_LINKS = [
  { label: "Carlota Jo", href: "/carlota-jo/" },
];

const COMPANY_LINKS = [
  { label: "Founder", href: "/founder" },
  { label: "Contact", href: "/contact" },
  { label: "Insights", href: "/insights" },
];

const SOCIAL_LINKS = [
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/company/szlholdings",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
      </svg>
    ),
  },
  {
    label: "X / Twitter",
    href: "https://x.com/szlholdings",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
    ),
  },
  {
    label: "Instagram",
    href: "https://www.instagram.com/szlholdings",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
      </svg>
    ),
  },
  {
    label: "YouTube",
    href: "https://www.youtube.com/@szlholdings",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
      </svg>
    ),
  },
];

export function SiteFooter() {
  return (
    <footer style={{ borderTop: "1px solid var(--color-szl-border)", background: "var(--color-szl-base)", padding: "3.5rem 0 2.5rem" }}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">
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
              SZL Holdings builds premium command systems across observability, operations, and high-trust execution.
            </p>
            <p style={{ color: "var(--color-szl-text-faint)", fontSize: "0.75rem", fontFamily: "var(--font-mono)", letterSpacing: "0.04em" }}>
              Washington, D.C. · London · Singapore
            </p>
            <p style={{ color: "var(--color-szl-text-faint)", fontSize: "0.75rem", fontFamily: "var(--font-mono)", marginTop: "0.25rem" }}>
              inquiries@szlholdings.com
            </p>
            <div className="flex items-center gap-3 mt-4">
              {SOCIAL_LINKS.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={link.label}
                  title={link.label}
                  style={{
                    color: "var(--color-szl-text-faint)",
                    transition: "color 0.2s ease",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "0.25rem",
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
              Platforms
            </h4>
            <ul className="space-y-2.5">
              {PLATFORMS_LINKS.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    style={{ fontSize: "0.875rem", color: "var(--color-szl-text-secondary)", transition: "color 0.2s ease", display: "block" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--color-szl-text)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--color-szl-text-secondary)"; }}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 style={{ fontFamily: "var(--font-mono)", fontWeight: 600, color: "var(--color-szl-text)", fontSize: "0.625rem", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "1rem" }}>
              Services
            </h4>
            <ul className="space-y-2.5">
              {SERVICES_LINKS.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    style={{ fontSize: "0.875rem", color: "var(--color-szl-text-secondary)", transition: "color 0.2s ease", display: "block" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--color-szl-text)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--color-szl-text-secondary)"; }}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 style={{ fontFamily: "var(--font-mono)", fontWeight: 600, color: "var(--color-szl-text)", fontSize: "0.625rem", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "1rem" }}>
              Company
            </h4>
            <ul className="space-y-2.5">
              {COMPANY_LINKS.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    style={{ fontSize: "0.875rem", color: "var(--color-szl-text-secondary)", transition: "color 0.2s ease", display: "block" }}
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

        <div style={{ paddingTop: "1.5rem", borderTop: "1px solid var(--color-szl-border)", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <p style={{ color: "var(--color-szl-text-faint)", fontSize: "0.75rem", fontFamily: "var(--font-mono)" }}>
              &copy; {new Date().getFullYear()} SZL Holdings. All rights reserved.
            </p>
            <p style={{ color: "var(--color-szl-text-faint)", fontSize: "0.75rem", fontFamily: "var(--font-mono)", letterSpacing: "0.05em" }}>
              Structured ventures for modern systems, services, and execution.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
