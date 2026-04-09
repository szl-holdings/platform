import { Link } from "wouter";

const navLinks = [
  { label: "Work", href: "/work" },
  { label: "Thesis", href: "/thesis" },
  { label: "Writing", href: "/writing" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
  { label: "Downloads", href: "/downloads" },
];

const ecosystemLinks = [
  { label: "SZL Holdings", href: "/" },
  { label: "Lyte", href: "/lyte-command-center/" },
  { label: "Vessels", href: "/vessels/" },
  { label: "Aegis", href: "/firestorm/" },
  { label: "Terra", href: "/terra/" },
  { label: "Carlota Jo", href: "/carlota-jo/" },
];

const legalLinks = [
  { label: "Privacy", href: "/legal/privacy" },
  { label: "Terms", href: "/legal/terms" },
];

export function Footer() {
  return (
    <footer className="bg-[#080c11] border-t border-white/5 pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-16">
          <div className="md:col-span-4">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-[#4a6fa5] flex items-center justify-center">
                <span className="font-serif font-bold text-white text-lg">SL</span>
              </div>
              <span className="font-serif font-semibold text-2xl text-white">Stephen Lutar</span>
            </div>
            <p className="text-[9px] tracking-[0.28em] uppercase text-[#7ba3d4]/40 font-medium mb-5">
              Founder & CEO, SZL Holdings
            </p>
            <p className="text-[13px] text-white/25 font-light leading-relaxed max-w-xs">
              Builder-operator behind 16 live applications, 446 database tables, and 1,618+ API endpoints. One compounding architecture.
            </p>
          </div>

          <div className="md:col-span-2">
            <h4 className="text-[10px] font-medium tracking-[0.22em] uppercase text-white/25 mb-4">Navigation</h4>
            <ul className="space-y-2.5">
              {navLinks.map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className="text-[13px] text-white/22 hover:text-white/55 transition-colors font-light">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-3">
            <h4 className="text-[10px] font-medium tracking-[0.22em] uppercase text-white/25 mb-4">Portfolio</h4>
            <ul className="space-y-2.5">
              {ecosystemLinks.map((item) => (
                <li key={item.label}>
                  <a href={item.href} className="text-[13px] text-white/22 hover:text-white/55 transition-colors font-light">
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-3">
            <h4 className="text-[10px] font-medium tracking-[0.22em] uppercase text-white/25 mb-4">Contact</h4>
            <p className="text-[13px] text-white/22 font-light mb-2">inquiries@szlholdings.com</p>
            <div className="space-y-2">
              <a href="https://linkedin.com/in/stephenlutar" target="_blank" rel="noopener noreferrer" className="text-[13px] text-white/22 hover:text-white/55 transition-colors font-light block">LinkedIn</a>
              <a href="https://x.com/szlholdings" target="_blank" rel="noopener noreferrer" className="text-[13px] text-white/22 hover:text-white/55 transition-colors font-light block">X / Twitter</a>
              <a href="https://medium.com/@stephen_38454" target="_blank" rel="noopener noreferrer" className="text-[13px] text-white/22 hover:text-white/55 transition-colors font-light block">Medium</a>
              <a href="https://szlholdings.substack.com" target="_blank" rel="noopener noreferrer" className="text-[13px] text-white/22 hover:text-white/55 transition-colors font-light block">Substack</a>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-7 border-t border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <p className="text-[11px] text-white/15 tracking-wider">
            &copy; {new Date().getFullYear()} Stephen Lutar. All rights reserved.
          </p>
          <div className="flex items-center gap-5">
            {legalLinks.map((link) => (
              <Link key={link.label} href={link.href} className="text-[11px] text-white/15 tracking-wider hover:text-white/35 transition-colors">
                {link.label}
              </Link>
            ))}
            <span className="text-[11px] text-white/12 tracking-wider">Part of SZL Holdings</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
