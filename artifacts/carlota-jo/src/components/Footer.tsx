import { Link } from "wouter";

const serviceLinks = [
  { label: "Residence Operations", href: "/services" },
  { label: "Property Coordination", href: "/services" },
  { label: "Household Systems", href: "/services" },
  { label: "Vendor Coordination", href: "/services" },
  { label: "Lifestyle Support", href: "/services" },
  { label: "Special Projects", href: "/services" },
];

const aboutLinks = [
  { label: "Who We Serve", href: "/who-we-serve" },
  { label: "About Carlota Jo", href: "/founder" },
  { label: "Request Consultation", href: "/contact" },
  { label: "Client Portal", href: "/client-portal" },
];

const ecosystemLinks = [
  { label: "SZL Holdings", href: "/szl-holdings/" },
  { label: "Alloy", href: "/alloy/" },
  { label: "Lyte", href: "/lyte-command-center/" },
  { label: "Vessels", href: "/vessels/" },
];

const legalLinks = [
  { label: "Privacy", href: "/legal/privacy" },
  { label: "Terms", href: "/legal/terms" },
];

export default function Footer() {
  return (
    <footer className="py-14 lg:py-16" style={{ background: "var(--color-stone-50)", borderTop: "1px solid var(--color-stone-200)" }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
          <div className="md:col-span-5">
            <div className="mb-5">
              <h3
                className="text-[18px] font-light leading-none"
                style={{ fontFamily: "Georgia, 'Palatino Linotype', serif", color: "var(--color-ink-900)" }}
              >
                Carlota Jo
              </h3>
              <p className="text-[9px] tracking-[0.3em] uppercase font-medium mt-1" style={{ color: "var(--color-gold)", opacity: 0.7 }}>
                Consulting
              </p>
            </div>
            <p className="text-[13px] leading-relaxed max-w-xs font-light" style={{ color: "var(--color-ink-500)" }}>
              Private advisory and operational support for high-net-worth families and residences. Conducted with absolute discretion, a single point of contact, and an uncompromising standard of execution.
            </p>
            <div className="mt-6">
              <Link
                href="/contact"
                className="inline-block px-5 py-2.5 text-[12px] font-medium tracking-[0.08em] transition-colors"
                style={{ color: "var(--color-cream)", background: "var(--color-gold)" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--color-gold-light)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--color-gold)"; }}
              >
                Request a Confidential Consultation
              </Link>
            </div>
          </div>

          <div className="md:col-span-2">
            <h4 className="text-[10px] font-medium tracking-[0.22em] uppercase mb-4" style={{ color: "var(--color-stone-400)" }}>
              Services
            </h4>
            <ul className="space-y-2.5">
              {serviceLinks.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-[13px] font-light transition-colors" style={{ color: "var(--color-ink-500)", textDecoration: "none" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--color-ink-900)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--color-ink-500)"; }}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-2">
            <h4 className="text-[10px] font-medium tracking-[0.22em] uppercase mb-4" style={{ color: "var(--color-stone-400)" }}>
              About
            </h4>
            <ul className="space-y-2.5">
              {aboutLinks.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-[13px] font-light transition-colors" style={{ color: "var(--color-ink-500)", textDecoration: "none" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--color-ink-900)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--color-ink-500)"; }}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-2">
            <h4 className="text-[10px] font-medium tracking-[0.22em] uppercase mb-4" style={{ color: "var(--color-stone-400)" }}>
              Ecosystem
            </h4>
            <ul className="space-y-2.5">
              {ecosystemLinks.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="text-[13px] font-light transition-colors" style={{ color: "var(--color-ink-500)", textDecoration: "none" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--color-ink-900)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--color-ink-500)"; }}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-2">
            <h4 className="text-[10px] font-medium tracking-[0.22em] uppercase mb-4" style={{ color: "var(--color-stone-400)" }}>
              Contact
            </h4>
            <ul className="space-y-2.5 text-[13px] font-light" style={{ color: "var(--color-ink-500)" }}>
              <li>inquiries@carlotajo.com</li>
              <li className="leading-relaxed">London · New York</li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-7 border-t flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4" style={{ borderColor: "var(--color-stone-200)" }}>
          <p className="text-[11px] tracking-wider" style={{ color: "var(--color-stone-400)" }}>
            &copy; {new Date().getFullYear()} Carlota Jo Consulting. A SZL Holdings company. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            {legalLinks.map((link) => (
              <Link key={link.label} href={link.href} className="text-[11px] tracking-wider transition-colors" style={{ color: "var(--color-stone-400)", textDecoration: "none" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--color-ink-600)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--color-stone-400)"; }}
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
