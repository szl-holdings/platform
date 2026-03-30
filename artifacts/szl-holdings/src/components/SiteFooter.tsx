import { Link } from "wouter";

const PLATFORMS_LINKS = [
  { label: "Alloy", href: "/alloy/" },
  { label: "Lyte", href: "/lyte-command-center/" },
  { label: "Vessels", href: "/vessels/" },
  { label: "Rosie", href: "/msp/" },
  { label: "Beacon", href: "/terra/" },
  { label: "INCA", href: "/inca/" },
  { label: "Aegis", href: "/readiness-report/" },
  { label: "Firestorm", href: "/firestorm/" },
];

const SERVICES_LINKS = [
  { label: "Carlota Jo", href: "/carlota-jo/" },
];

const COMPANY_LINKS = [
  { label: "Founder", href: "/founder" },
  { label: "Contact", href: "/contact" },
  { label: "Insights", href: "/insights" },
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
              ONE ECOSYSTEM · ONE OPERATING PHILOSOPHY · MULTIPLE COMMAND SURFACES
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
