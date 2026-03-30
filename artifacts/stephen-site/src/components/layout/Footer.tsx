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
            <p className="text-white/40 max-w-sm mb-8 leading-relaxed font-light text-[13px]">
              Clarity for modern execution. Builder of enterprise infrastructure, AI platforms, and founder-led teams.
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
