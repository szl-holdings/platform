import { Link } from "wouter";

const SITE_LINKS = [
  { label: "Platform", href: "/platform" },
  { label: "Design Partners", href: "/design-partners" },
  { label: "Trust", href: "/trust" },
  { label: "Investors", href: "/investors" },
];

const PLATFORM_LINKS = [
  { label: "Lyte", href: "/lyte-command-center/", desc: "Business Observability" },
  { label: "Vessels", href: "/vessels/", desc: "Maritime Intelligence" },
  { label: "Aegis", href: "/firestorm/", desc: "Defense & Intelligence" },
  { label: "Terra", href: "/terra/", desc: "Real Estate Intelligence" },
  { label: "Carlota Jo", href: "/carlota-jo/", desc: "Private Advisory" },
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
              Operational risk surfaces before it becomes a revenue problem. Lyte + Alloy is the starting point.
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
              Site
            </h4>
            <ul className="space-y-2">
              {SITE_LINKS.map((link) => (
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
              Platforms
            </h4>
            <ul className="space-y-2">
              {PLATFORM_LINKS.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    style={{ fontSize: "0.8125rem", color: "var(--color-szl-text-secondary)", transition: "color 0.2s ease", display: "block" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--color-szl-text)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--color-szl-text-secondary)"; }}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div style={{ paddingTop: "1.5rem", borderTop: "1px solid var(--color-szl-border)", display: "flex", flexWrap: "wrap", gap: "0.75rem", alignItems: "center", justifyContent: "space-between" }}>
          <p style={{ color: "var(--color-szl-text-faint)", fontSize: "0.75rem", fontFamily: "var(--font-mono)" }}>
            &copy; {new Date().getFullYear()} SZL Holdings. All rights reserved.
          </p>
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
          </div>
        </div>
      </div>
    </footer>
  );
}
