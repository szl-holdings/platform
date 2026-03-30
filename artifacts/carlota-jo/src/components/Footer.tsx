export default function Footer() {
  return (
    <footer className="bg-navy-950 border-t border-cream-200/5 py-16 lg:py-20">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
          <div className="md:col-span-4">
            <h3 className="font-serif text-2xl font-semibold text-cream-50 mb-1.5">
              Carlota Jo
            </h3>
            <p className="text-[10px] tracking-[0.3em] uppercase text-gold-400/50 font-medium mb-5">
              Strategic Advisory
            </p>
            <p className="text-sm text-cream-300/30 leading-relaxed max-w-xs font-light">
              Rigorous strategy. Proprietary frameworks. Measurable outcomes for
              the world's most consequential organizations.
            </p>
          </div>
          <div className="md:col-span-2">
            <h4 className="text-[11px] font-medium tracking-[0.15em] uppercase text-cream-200/40 mb-5">
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
                  <span className="text-sm text-cream-300/25 hover:text-cream-100 transition-colors cursor-default font-light">
                    {s}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div className="md:col-span-2">
            <h4 className="text-[11px] font-medium tracking-[0.15em] uppercase text-cream-200/40 mb-5">
              Firm
            </h4>
            <ul className="space-y-3 text-sm text-cream-300/25 font-light">
              <li>About</li>
              <li>Leadership</li>
              <li>Careers</li>
              <li>Perspectives</li>
              <li>Press</li>
            </ul>
          </div>
          <div className="md:col-span-4">
            <h4 className="text-[11px] font-medium tracking-[0.15em] uppercase text-cream-200/40 mb-5">
              Contact
            </h4>
            <ul className="space-y-3 text-sm text-cream-300/25 font-light">
              <li>inquiries@carlotajo.com</li>
              <li>+1 (212) 555-0184</li>
              <li className="leading-relaxed">
                280 Park Avenue, 38th Floor
                <br />
                New York, NY 10017
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-16 pt-8 border-t border-cream-200/5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[11px] text-cream-300/15 tracking-wider">
            &copy; {new Date().getFullYear()} Carlota Jo Consulting. All rights
            reserved.
          </p>
          <div className="flex items-center gap-6">
            <span className="text-[11px] text-cream-300/15 tracking-wider hover:text-cream-300/30 transition-colors cursor-pointer">
              Privacy Policy
            </span>
            <span className="text-[11px] text-cream-300/15 tracking-wider hover:text-cream-300/30 transition-colors cursor-pointer">
              Terms of Engagement
            </span>
            <span className="text-[11px] text-cream-300/15 tracking-wider hover:text-cream-300/30 transition-colors cursor-pointer">
              NDA Request
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
