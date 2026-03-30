import { Link } from "wouter";

const practiceLinks = [
  { label: "Services", href: "/services" },
  { label: "Approach", href: "/approach" },
  { label: "Private inquiry", href: "/inquiries" },
  { label: "Client Portal", href: "/client-portal" },
];

const legalLinks = [
  { label: "Privacy", href: "/legal/privacy" },
  { label: "Terms", href: "/legal/terms" },
];

export default function Footer() {
  return (
    <footer className="bg-stone-100 border-t border-stone-200 py-14 lg:py-16">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
          <div className="md:col-span-5">
            <div className="mb-5">
              <h3
                className="text-[18px] font-light text-ink-900 leading-none"
                style={{ fontFamily: "var(--font-serif)" }}
              >
                Carlota Jo
              </h3>
              <p className="text-[9px] tracking-[0.3em] uppercase text-gold/60 font-medium mt-1">
                Consulting
              </p>
            </div>
            <p className="text-[13px] text-ink-400 leading-relaxed max-w-xs font-light">
              High-trust operational and residence support for demanding principals.
            </p>
          </div>

          <div className="md:col-span-3">
            <h4 className="text-[10px] font-medium tracking-[0.22em] uppercase text-ink-400 mb-4">
              Practice
            </h4>
            <ul className="space-y-2.5">
              {practiceLinks.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-[13px] text-ink-400 hover:text-ink-900 transition-colors font-light">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-4">
            <h4 className="text-[10px] font-medium tracking-[0.22em] uppercase text-ink-400 mb-4">
              Contact
            </h4>
            <ul className="space-y-2.5 text-[13px] text-ink-400 font-light">
              <li>inquiries@carlotajo.com</li>
              <li className="leading-relaxed">London · New York</li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-7 border-t border-stone-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <p className="text-[11px] text-ink-400/60 tracking-wider">
            &copy; {new Date().getFullYear()} Carlota Jo Consulting. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            {legalLinks.map((link) => (
              <Link key={link.label} href={link.href} className="text-[11px] text-ink-400/60 tracking-wider hover:text-ink-600 transition-colors">
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
