import portfolioData from "@/data/portfolio.json";

export function Footer() {
  return (
    <footer className="border-t border-szl-border bg-szl-bg py-16">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-10 mb-16">
          <div className="col-span-2">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-6 h-6 border border-szl-accent/40 flex items-center justify-center">
                <span className="text-szl-accent font-[var(--font-display)] text-sm">S</span>
              </div>
              <span className="font-[var(--font-display)] text-szl-text text-[15px] tracking-wide">SZL Holdings</span>
            </div>
            <p className="text-szl-text-muted text-sm leading-relaxed max-w-xs font-light">
              A vertically-integrated technology holding company deploying capital across six frontier platforms.
            </p>
            <p className="text-szl-text-muted text-xs mt-4 font-light">Washington, D.C. · London · Singapore</p>
          </div>

          <div>
            <h4 className="text-szl-text-muted text-[10px] font-medium uppercase tracking-[0.2em] mb-5">Ventures</h4>
            <ul className="space-y-3">
              {portfolioData.slice(0, 5).map((item) => (
                <li key={item.id}>
                  <a
                    href={item.link}
                    className="text-szl-text-secondary text-sm hover:text-szl-text transition-colors font-light"
                  >
                    {item.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-szl-text-muted text-[10px] font-medium uppercase tracking-[0.2em] mb-5">Insights</h4>
            <ul className="space-y-3">
              <li>
                <a href="/insights" className="text-szl-text-secondary text-sm hover:text-szl-text transition-colors font-light">
                  All Articles
                </a>
              </li>
              <li>
                <a href="/insights/state-of-the-ecosystem-2026" className="text-szl-text-secondary text-sm hover:text-szl-text transition-colors font-light">
                  Annual Letter
                </a>
              </li>
              <li>
                <a href="/thesis" className="text-szl-text-secondary text-sm hover:text-szl-text transition-colors font-light">
                  Investment Thesis
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-szl-text-muted text-[10px] font-medium uppercase tracking-[0.2em] mb-5">Connect</h4>
            <ul className="space-y-3">
              <li>
                <a href="#contact" className="text-szl-text-secondary text-sm hover:text-szl-text transition-colors font-light">
                  Contact
                </a>
              </li>
              <li>
                <span className="text-szl-text-muted text-sm font-light">inquiries@szlholdings.com</span>
              </li>
              <li>
                <a href="/ir" className="text-szl-text-secondary text-sm hover:text-szl-text transition-colors font-light">
                  Investor Relations
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-szl-border flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-szl-text-muted text-xs font-light">
            &copy; {new Date().getFullYear()} SZL Holdings. All rights reserved.
          </p>
          <p className="text-szl-text-muted text-xs font-light">
            inquiries@szlholdings.com
          </p>
        </div>
      </div>
    </footer>
  );
}
