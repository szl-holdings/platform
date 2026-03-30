const portfolioLinks = [
  { label: "Vessels", href: "/vessels/" },
  { label: "INCA", href: "/inca/" },
  { label: "Carlota Jo", href: "/carlota-jo/" },
  { label: "Firestorm", href: "/firestorm/" },
  { label: "Dreamscape", href: "/dreamscape/" },
  { label: "Terra", href: "/terra/" },
];

const companyLinks = [
  { label: "Portfolio", href: "#portfolio" },
  { label: "Thesis", href: "#thesis" },
  { label: "Roadmap", href: "#milestones" },
  { label: "Insights", href: "/insights" },
  { label: "Contact", href: "#contact" },
];

export function Footer() {
  return (
    <footer className="py-12 lg:py-16 bg-white border-t border-neutral-100">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-10">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-7 h-7 rounded bg-[hsl(215,45%,30%)] flex items-center justify-center">
                <span className="text-white font-bold text-[11px]" style={{ fontFamily: "system-ui" }}>S</span>
              </div>
              <span className="font-semibold text-[14px] text-neutral-900 tracking-tight">SZL Holdings</span>
            </div>
            <p className="text-neutral-500 text-[13.5px] leading-relaxed max-w-xs mb-3">
              Strategic technology portfolio. Building at the intersection of maritime intelligence,
              AI, advisory, and enterprise operations.
            </p>
            <p className="text-neutral-400 text-[12px]">Washington, D.C. · London · Singapore</p>
          </div>

          <div>
            <h4 className="text-[11px] font-semibold text-neutral-400 uppercase tracking-[0.1em] mb-4">Portfolio</h4>
            <ul className="space-y-2.5">
              {portfolioLinks.map((l) => (
                <li key={l.label}>
                  <a href={l.href} className="text-neutral-500 text-[13px] hover:text-neutral-900 transition-colors duration-200">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-[11px] font-semibold text-neutral-400 uppercase tracking-[0.1em] mb-4">Company</h4>
            <ul className="space-y-2.5">
              {companyLinks.map((l) => (
                <li key={l.label}>
                  <a href={l.href} className="text-neutral-500 text-[13px] hover:text-neutral-900 transition-colors duration-200">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t border-neutral-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-neutral-400 text-[12px]">
            &copy; {new Date().getFullYear()} SZL Holdings. All rights reserved.
          </p>
          <p className="text-neutral-400 text-[12px]">inquiries@szlholdings.com</p>
        </div>
      </div>
    </footer>
  );
}
