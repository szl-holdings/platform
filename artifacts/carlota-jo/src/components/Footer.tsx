export default function Footer() {
  return (
    <footer className="bg-navy-950 border-t border-gold-500/8 py-20">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="md:col-span-1">
            <h3 className="font-serif text-2xl font-semibold text-cream-50 mb-2">
              Carlota Jo
            </h3>
            <p className="text-[10px] tracking-[0.3em] uppercase text-gold-400/40 font-medium mb-5">
              Strategic Advisory
            </p>
            <p className="text-sm text-cream-300/35 leading-relaxed max-w-xs font-light">
              Rigorous strategy. Proprietary frameworks. Measurable outcomes for the world's most consequential organizations.
            </p>
          </div>
          <div>
            <h4 className="text-[11px] font-medium tracking-[0.2em] uppercase text-gold-400/60 mb-5">
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
                  <span className="text-sm text-cream-300/40 hover:text-cream-100 transition-colors cursor-default font-light">
                    {s}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-[11px] font-medium tracking-[0.2em] uppercase text-gold-400/60 mb-5">
              Firm
            </h4>
            <ul className="space-y-3 text-sm text-cream-300/40 font-light">
              <li>About</li>
              <li>Leadership</li>
              <li>Careers</li>
              <li>Insights</li>
              <li>Press</li>
            </ul>
          </div>
          <div>
            <h4 className="text-[11px] font-medium tracking-[0.2em] uppercase text-gold-400/60 mb-5">
              Contact
            </h4>
            <ul className="space-y-3 text-sm text-cream-300/40 font-light">
              <li>inquiries@carlotajo.com</li>
              <li>+1 (212) 555-0184</li>
              <li className="leading-relaxed">280 Park Avenue, 38th Floor<br />New York, NY 10017</li>
            </ul>
          </div>
        </div>
        <div className="mt-20 pt-8 border-t border-gold-500/5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[11px] text-cream-300/20 tracking-wider">
            &copy; {new Date().getFullYear()} Carlota Jo Consulting. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <span className="text-[11px] text-cream-300/20 tracking-wider">Privacy Policy</span>
            <span className="text-[11px] text-cream-300/20 tracking-wider">Terms of Engagement</span>
            <span className="text-[11px] text-cream-300/20 tracking-wider">NDA Request</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
