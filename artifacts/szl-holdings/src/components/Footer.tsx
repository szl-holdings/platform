import siteData from "@/data/site.json";
import portfolioData from "@/data/portfolio.json";

export function Footer() {
  const { footer, company } = siteData;

  return (
    <footer className="border-t border-szl-border bg-szl-bg-secondary py-12">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-md bg-szl-primary flex items-center justify-center">
                <span className="text-white font-bold text-xs">S</span>
              </div>
              <span className="font-[var(--font-display)] font-semibold text-szl-text text-[15px]">
                {company.name}
              </span>
            </div>
            <p className="text-szl-text-secondary text-sm leading-relaxed max-w-xs">
              {company.tagline}
            </p>
            <p className="text-szl-text-muted text-xs mt-3">{company.headquarters}</p>
          </div>

          <div>
            <h4 className="font-[var(--font-display)] font-semibold text-szl-text text-xs uppercase tracking-wider mb-4">{footer.sections.portfolio}</h4>
            <ul className="space-y-2.5">
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
            <h4 className="font-[var(--font-display)] font-semibold text-szl-text text-xs uppercase tracking-wider mb-4">{footer.sections.connect}</h4>
            <ul className="space-y-2.5">
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

        <div className="pt-6 border-t border-szl-border flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-szl-text-muted text-xs">
            &copy; {new Date().getFullYear()} {company.name}. {footer.rightsReserved}
          </p>
          <p className="text-szl-text-muted text-xs">
            {company.email}
          </p>
        </div>
      </div>
    </footer>
  );
}
