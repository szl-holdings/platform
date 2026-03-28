export default function Footer() {
  return (
    <footer className="bg-navy-950 border-t border-gold-500/10 py-16">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div>
            <h3 className="font-serif text-2xl font-semibold text-cream-50 mb-4">
              Carlota Jo
            </h3>
            <p className="text-sm text-cream-300/60 leading-relaxed max-w-xs">
              Rigorous strategy. Measurable outcomes.
            </p>
          </div>
          <div>
            <h4 className="text-xs font-medium tracking-widest uppercase text-gold-400 mb-4">
              Services
            </h4>
            <ul className="space-y-2.5">
              {[
                "Strategic Advisory",
                "Portfolio Optimization",
                "Technology Transformation",
                "Risk & Compliance",
                "Growth Strategy",
                "M&A Advisory",
              ].map((s) => (
                <li key={s}>
                  <span className="text-sm text-cream-300/50 hover:text-cream-100 transition-colors cursor-default">
                    {s}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-medium tracking-widest uppercase text-gold-400 mb-4">
              Contact
            </h4>
            <ul className="space-y-2.5 text-sm text-cream-300/50">
              <li>inquiries@carlotajo.com</li>
              <li>+1 (212) 555-0184</li>
              <li>280 Park Avenue, 38th Floor</li>
              <li>New York, NY 10017</li>
            </ul>
          </div>
        </div>
        <div className="mt-16 pt-8 border-t border-gold-500/5 text-center">
          <p className="text-xs text-cream-300/30 tracking-wide">
            &copy; {new Date().getFullYear()} Carlota Jo Consulting. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
