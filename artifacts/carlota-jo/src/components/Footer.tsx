import { Link } from "wouter";

const practiceLinks = [
  { label: "Services", href: "/services" },
  { label: "Approach", href: "/approach" },
  { label: "Private inquiry", href: "/inquiries" },
  { label: "Client Portal", href: "/client-portal" },
];

const ecosystemLinks = [
  { label: "SZL Holdings", href: "/" },
  { label: "Alloy", href: "/alloy/" },
  { label: "Lyte", href: "/lyte-command-center/" },
  { label: "Vessels", href: "/vessels/" },
  { label: "INCA", href: "/inca/" },
  { label: "Stephen Site", href: "/stephen/" },
];

const legalLinks = [
  { label: "Privacy", href: "/legal/privacy" },
  { label: "Terms", href: "/legal/terms" },
];

export default function Footer() {
  return (
    <footer className="bg-[#06080c] border-t border-[#f5f0e8]/5 py-14 lg:py-16">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
          <div className="md:col-span-4">
            <div className="mb-5">
              <h3
                className="text-[18px] font-light text-[#f5f0e8] leading-none"
                style={{ fontFamily: "Georgia, 'Palatino Linotype', serif" }}
              >
                Carlota Jo
              </h3>
              <p className="text-[9px] tracking-[0.3em] uppercase text-[#c8a96a]/45 font-medium mt-1">
                Consulting
              </p>
            </div>
            <p className="text-[13px] text-[#f5f0e8]/28 leading-relaxed max-w-xs font-light">
              Boutique strategic consulting for founder-led businesses. Brand strategy, growth architecture, and executive advisory — conducted with discretion and depth.
            </p>
          </div>

          <div className="md:col-span-3">
            <h4 className="text-[10px] font-medium tracking-[0.22em] uppercase text-[#f5f0e8]/28 mb-4">
              Practice
            </h4>
            <ul className="space-y-2.5">
              {practiceLinks.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-[13px] text-[#f5f0e8]/22 hover:text-[#f5f0e8]/55 transition-colors font-light">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-2">
            <h4 className="text-[10px] font-medium tracking-[0.22em] uppercase text-[#f5f0e8]/28 mb-4">
              Ecosystem
            </h4>
            <ul className="space-y-2.5">
              {ecosystemLinks.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="text-[13px] text-[#f5f0e8]/22 hover:text-[#f5f0e8]/55 transition-colors font-light">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-3">
            <h4 className="text-[10px] font-medium tracking-[0.22em] uppercase text-[#f5f0e8]/28 mb-4">
              Contact
            </h4>
            <ul className="space-y-2.5 text-[13px] text-[#f5f0e8]/22 font-light">
              <li>inquiries@carlotajo.com</li>
              <li className="leading-relaxed">London &nbsp;·&nbsp; New York</li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-7 border-t border-[#f5f0e8]/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <p className="text-[11px] text-[#f5f0e8]/15 tracking-wider">
            &copy; {new Date().getFullYear()} Carlota Jo Consulting. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            {legalLinks.map((link) => (
              <Link key={link.label} href={link.href} className="text-[11px] text-[#f5f0e8]/15 tracking-wider hover:text-[#f5f0e8]/32 transition-colors">
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
