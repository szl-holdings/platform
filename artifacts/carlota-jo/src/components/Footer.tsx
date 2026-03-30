export default function Footer() {
  return (
    <footer className="bg-stone-50 border-t border-stone-200 py-16 lg:py-20">
      <div className="max-w-7xl mx-auto px-6 lg:px-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
          <div className="md:col-span-4">
            <h3 className="font-serif text-2xl font-light text-ink-900 mb-1.5">
              Carlota Jo
            </h3>
            <p className="text-[10px] tracking-[0.3em] uppercase text-warm-gold font-medium mb-5">
              Strategic Advisory
            </p>
            <p className="text-sm text-ink-500 leading-relaxed max-w-xs font-light">
              Rigorous strategy. Proprietary frameworks. Measurable outcomes for the world's most consequential organizations.
            </p>
          </div>

          <div className="md:col-span-2">
            <h4 className="text-[10px] font-medium tracking-[0.2em] uppercase text-stone-400 mb-5">
              Practice Areas
            </h4>
            <ul className="space-y-3">
              {[
                "Strategic Advisory",
                "Portfolio Optimization",
                "Technology Transformation",
                "Risk & Compliance",
                "Growth Strategy",
                "M&A Advisory",
              ].map((s) => (
                <li key={s}>
                  <span className="text-sm text-ink-500 hover:text-ink-900 transition-colors cursor-default font-light">
                    {s}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-2">
            <h4 className="text-[10px] font-medium tracking-[0.2em] uppercase text-stone-400 mb-5">
              Firm
            </h4>
            <ul className="space-y-3 text-sm text-ink-500 font-light">
              <li className="hover:text-ink-900 transition-colors cursor-default">About</li>
              <li className="hover:text-ink-900 transition-colors cursor-default">Perspectives</li>
              <li className="hover:text-ink-900 transition-colors cursor-default">Careers</li>
              <li className="hover:text-ink-900 transition-colors cursor-default">Press</li>
            </ul>
          </div>

          <div className="md:col-span-4">
            <h4 className="text-[10px] font-medium tracking-[0.2em] uppercase text-stone-400 mb-5">
              Contact
            </h4>
            <ul className="space-y-3 text-sm text-ink-500 font-light">
              <li className="hover:text-ink-900 transition-colors">inquiries@carlotajo.com</li>
              <li>+1 (212) 555-0184</li>
              <li className="leading-relaxed text-stone-400">
                280 Park Avenue, 38th Floor<br />
                New York, NY 10017
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[11px] text-stone-400 tracking-wider font-light">
            &copy; {new Date().getFullYear()} Carlota Jo Consulting. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            {["Privacy Policy", "Terms of Engagement", "NDA Request"].map((link) => (
              <span key={link} className="text-[11px] text-stone-400 tracking-wider hover:text-ink-500 transition-colors cursor-pointer font-light">
                {link}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
