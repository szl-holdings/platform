export function Footer() {
  return (
    <footer className="bg-[#080c11] border-t border-white/5 py-12 lg:py-14">
      <div className="max-w-6xl mx-auto px-6 lg:px-12">
        <div className="grid md:grid-cols-12 gap-10">
          <div className="md:col-span-4">
            <h3 className="text-[17px] font-semibold text-white tracking-tight mb-1">
              Stephen Lutar
            </h3>
            <p className="text-[9px] tracking-[0.28em] uppercase text-[#7ba3d4]/40 font-medium mb-5">
              Founder & CEO, SZL Holdings
            </p>
            <p className="text-[13px] text-white/25 font-light leading-relaxed max-w-xs">
              Builder of enterprise infrastructure, AI platforms, and founder-led teams.
              London, UK.
            </p>
          </div>

          <div className="md:col-span-3">
            <h4 className="text-[10px] font-medium tracking-[0.22em] uppercase text-white/25 mb-4">
              Portfolio
            </h4>
            <ul className="space-y-2.5">
              {[
                { label: "SZL Holdings", href: "/szl-holdings/" },
                { label: "Vessels", href: "/vessels/" },
                { label: "INCA", href: "/inca/" },
                { label: "Carlota Jo", href: "/carlota-jo/" },
                { label: "Dreamscape", href: "/dreamscape/" },
              ].map((item) => (
                <li key={item.label}>
                  <a
                    href={item.href}
                    className="text-[13px] text-white/22 hover:text-white/55 transition-colors font-light"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-2">
            <h4 className="text-[10px] font-medium tracking-[0.22em] uppercase text-white/25 mb-4">
              Navigation
            </h4>
            <ul className="space-y-2.5">
              {[
                { label: "Work", href: "#work" },
                { label: "About", href: "#about" },
                { label: "Capabilities", href: "#capabilities" },
                { label: "Thinking", href: "#thinking" },
                { label: "Contact", href: "#contact" },
              ].map((item) => (
                <li key={item.label}>
                  <a href={item.href} className="text-[13px] text-white/22 hover:text-white/55 transition-colors font-light">
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-3">
            <h4 className="text-[10px] font-medium tracking-[0.22em] uppercase text-white/25 mb-4">
              Contact
            </h4>
            <p className="text-[13px] text-white/22 font-light mb-2">hello@stephenlutar.com</p>
            <p className="text-[13px] text-white/22 font-light">London, UK</p>
          </div>
        </div>

        <div className="mt-10 pt-7 border-t border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <p className="text-[11px] text-white/15 tracking-wider">
            &copy; {new Date().getFullYear()} Stephen Lutar. All rights reserved.
          </p>
          <p className="text-[11px] text-white/12 tracking-wider">
            Part of SZL Holdings
          </p>
        </div>
      </div>
    </footer>
  );
}
