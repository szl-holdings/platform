import siteData from "@/data/site.json";
import portfolioData from "@/data/portfolio.json";

export function Footer() {
  const { footer, company } = siteData;

  return (
    <footer className="border-t border-szl-border bg-szl-bg py-12">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-szl-primary to-szl-accent flex items-center justify-center">
                <span className="text-white font-bold text-xs">S</span>
              </div>
              <span className="font-[var(--font-display)] font-bold text-szl-text">
                {company.name}
              </span>
            </div>
            <p className="text-szl-text-secondary text-sm leading-relaxed">
              {company.description}
            </p>
          </div>

          <div>
            <h4 className="font-[var(--font-display)] font-semibold text-szl-text text-sm mb-4">{footer.sections.portfolio}</h4>
            <ul className="space-y-2">
              {portfolioData.map((item) => (
                <li key={item.id}>
                  <a
                    href={item.link}
                    className="text-szl-text-secondary text-sm hover:text-szl-text transition-colors"
                  >
                    {item.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-[var(--font-display)] font-semibold text-szl-text text-sm mb-4">{footer.sections.company}</h4>
            <ul className="space-y-2">
              {footer.companyLinks.map((item) => (
                <li key={item.label}>
                  <a
                    href={item.href}
                    className="text-szl-text-secondary text-sm hover:text-szl-text transition-colors"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-[var(--font-display)] font-semibold text-szl-text text-sm mb-4">{footer.sections.connect}</h4>
            <ul className="space-y-2">
              <li>
                <a href="#contact" className="text-szl-text-secondary text-sm hover:text-szl-text transition-colors">
                  {footer.contactUsLabel}
                </a>
              </li>
              <li>
                <span className="text-szl-text-muted text-sm">{company.email}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-szl-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-szl-text-muted text-xs">
            &copy; {new Date().getFullYear()} {company.name}. {footer.rightsReserved}
          </p>
          <p className="text-szl-text-muted text-xs">
            {company.tagline}
          </p>
        </div>
      </div>
    </footer>
  );
}
