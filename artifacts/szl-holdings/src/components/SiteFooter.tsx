import { Link } from "wouter";

const VENTURES_LINKS = [
  { label: "Lyte", href: "/ventures/lyte" },
  { label: "Vessels", href: "/ventures/vessels" },
  { label: "Firestorm", href: "/ventures/firestorm" },
  { label: "INCA", href: "/ventures/inca" },
  { label: "Terra", href: "/ventures/terra" },
  { label: "Dreamscape", href: "/ventures/dreamscape" },
  { label: "Carlota Jo", href: "/ventures/carlota-jo" },
  { label: "Evolve MSP", href: "/ventures/msp" },
];

const COMPANY_LINKS = [
  { label: "Portfolio", href: "/portfolio" },
  { label: "Founder", href: "/founder" },
  { label: "Insights", href: "/insights" },
  { label: "Changelog", href: "/changelog" },
  { label: "Roadmap", href: "/roadmap" },
];

const CONTACT_LINKS = [
  { label: "Investor Inquiry", href: "/contact?type=investor" },
  { label: "Client / Demo", href: "/contact?type=client" },
  { label: "Partnership", href: "/contact?type=partner" },
  { label: "Recruiting", href: "/contact?type=recruiter" },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-szl-border bg-szl-bg-secondary py-14">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-szl-primary flex items-center justify-center">
                <span className="text-white font-bold text-xs font-[var(--font-display)]">SZL</span>
              </div>
              <span className="font-[var(--font-display)] font-semibold text-szl-text text-[15px]">
                SZL Holdings
              </span>
            </div>
            <p className="text-szl-text-secondary text-sm leading-relaxed max-w-xs mb-3">
              A venture and operating ecosystem building premium command systems, observability products, and high-trust service brands.
            </p>
            <p className="text-szl-text-muted text-xs">Washington, D.C. · London · Singapore</p>
            <p className="text-szl-text-muted text-xs mt-1">inquiries@szlholdings.com</p>
          </div>

          <div>
            <h4 className="font-[var(--font-display)] font-semibold text-szl-text text-xs uppercase tracking-wider mb-4">Ventures</h4>
            <ul className="space-y-2.5">
              {VENTURES_LINKS.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-szl-text-secondary text-sm hover:text-szl-text transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-[var(--font-display)] font-semibold text-szl-text text-xs uppercase tracking-wider mb-4">Company</h4>
            <ul className="space-y-2.5">
              {COMPANY_LINKS.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-szl-text-secondary text-sm hover:text-szl-text transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-[var(--font-display)] font-semibold text-szl-text text-xs uppercase tracking-wider mb-4">Connect</h4>
            <ul className="space-y-2.5">
              {CONTACT_LINKS.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-szl-text-secondary text-sm hover:text-szl-text transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t border-szl-border flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-szl-text-muted text-xs">
            &copy; {new Date().getFullYear()} SZL Holdings. All rights reserved.
          </p>
          <p className="text-szl-text-muted text-xs">
            The 6 Lenses of Business Observability · Signal · Impact · Anticipation · Topology · Posture · Velocity
          </p>
        </div>
      </div>
    </footer>
  );
}
