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
  { label: "Case Studies", href: "/insights" },
  { label: "Insights", href: "/insights" },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-szl-border bg-szl-bg-secondary py-14">
      <div className="max-w-7xl mx-auto px-6">
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
              SZL Holdings builds premium command systems across observability, operations, and high-trust execution.
            </p>
            <p className="text-szl-text-muted text-xs">Washington, D.C. · London · Singapore</p>
            <p className="text-szl-text-muted text-xs mt-1">inquiries@szlholdings.com</p>
          </div>

          <div>
            <h4 className="font-[var(--font-display)] font-semibold text-szl-text text-xs uppercase tracking-wider mb-4">Platforms</h4>
            <ul className="space-y-2.5">
              {PLATFORMS_LINKS.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="text-szl-text-secondary text-sm hover:text-szl-text transition-colors">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-[var(--font-display)] font-semibold text-szl-text text-xs uppercase tracking-wider mb-4">Services</h4>
            <ul className="space-y-2.5">
              {SERVICES_LINKS.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="text-szl-text-secondary text-sm hover:text-szl-text transition-colors">
                    {link.label}
                  </a>
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
        </div>

        <div className="pt-6 border-t border-szl-border flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-szl-text-muted text-xs">
            &copy; {new Date().getFullYear()} SZL Holdings. All rights reserved.
          </p>
          <p className="text-szl-text-muted text-xs">
            One ecosystem. One operating philosophy. Multiple command surfaces.
          </p>
        </div>
      </div>
    </footer>
  );
}
