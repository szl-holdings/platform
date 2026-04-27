import { getProduct, subsidiaryCopyrightLine } from '@szl-holdings/brand-registry';
import { useTranslation } from 'react-i18next';
import { Link } from 'wouter';

const ecosystemLinks = [
  { label: 'SZL Holdings', href: '/' },
  { label: 'Lyte', href: '/command/operations/' },
  { label: 'Vessels', href: '/vessels/' },
  { label: 'Terra', href: '/terra/' },
];

export default function Footer() {
  const { t } = useTranslation();

  const serviceLinks = [
    { label: t('hero.areas.residenceOps'), href: '/services' },
    { label: t('hero.areas.propertyCoord'), href: '/services' },
    { label: t('hero.areas.householdSystems'), href: '/services' },
    { label: t('hero.areas.vendorManagement'), href: '/services' },
    { label: t('hero.areas.lifestyleAdmin'), href: '/services' },
    { label: t('hero.areas.specialProjects'), href: '/services' },
  ];

  const aboutLinks = [
    { label: t('nav.whoWeServe'), href: '/who-we-serve' },
    { label: t('nav.howWeWork'), href: '/engagements' },
    { label: t('nav.about'), href: '/founder' },
    { label: t('nav.requestConsultation'), href: '/contact' },
  ];

  const legalLinks = [
    { label: t('footer.privacy'), href: '/legal/privacy' },
    { label: t('footer.terms'), href: '/legal/terms' },
  ];

  return (
    <footer
      className="py-14 lg:py-16"
      style={{ background: 'var(--color-stone-50)', borderTop: '1px solid var(--color-stone-200)' }}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
          <div className="md:col-span-5">
            <div className="mb-5">
              <h3
                className="text-[18px] font-light leading-none"
                style={{
                  fontFamily: "Georgia, 'Palatino Linotype', serif",
                  color: 'var(--color-ink-900)',
                }}
              >
                Carlota Jo
              </h3>
              <p
                className="text-[9px] tracking-[0.3em] uppercase font-medium mt-1"
                style={{ color: 'var(--color-stone-600)' }}
              >
                {t('footer.consulting')}
              </p>
            </div>
            <p
              className="text-[13px] leading-relaxed max-w-xs font-light"
              style={{ color: 'var(--color-ink-500)' }}
            >
              Private advisory and operational support for high-net-worth families and residences.
              Conducted with absolute discretion, a single point of contact, and an uncompromising
              standard of execution.
            </p>
            <div className="mt-6">
              <Link
                href="/contact"
                className="inline-block px-5 py-2.5 text-[12px] font-medium tracking-[0.08em] transition-colors"
                style={{ color: 'var(--color-ink-900)', background: 'var(--color-gold-light)' }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.opacity = '0.85';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.opacity = '1';
                }}
              >
                {t('nav.requestConsultation')}
              </Link>
            </div>
          </div>

          <div className="md:col-span-2">
            <h4
              className="text-[10px] font-medium tracking-[0.22em] uppercase mb-4"
              style={{ color: 'var(--color-stone-600)' }}
            >
              {t('nav.services')}
            </h4>
            <ul className="space-y-2.5">
              {serviceLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-[13px] font-light transition-colors"
                    style={{ color: 'var(--color-ink-500)', textDecoration: 'none' }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.color = 'var(--color-ink-900)';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.color = 'var(--color-ink-500)';
                    }}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-2">
            <h4
              className="text-[10px] font-medium tracking-[0.22em] uppercase mb-4"
              style={{ color: 'var(--color-stone-600)' }}
            >
              About
            </h4>
            <ul className="space-y-2.5">
              {aboutLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-[13px] font-light transition-colors"
                    style={{ color: 'var(--color-ink-500)', textDecoration: 'none' }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.color = 'var(--color-ink-900)';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.color = 'var(--color-ink-500)';
                    }}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-2">
            <h4
              className="text-[10px] font-medium tracking-[0.22em] uppercase mb-4"
              style={{ color: 'var(--color-stone-600)' }}
            >
              Ecosystem
            </h4>
            <ul className="space-y-2.5">
              {ecosystemLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-[13px] font-light transition-colors"
                    style={{ color: 'var(--color-ink-500)', textDecoration: 'none' }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.color = 'var(--color-ink-900)';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.color = 'var(--color-ink-500)';
                    }}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-2">
            <h4
              className="text-[10px] font-medium tracking-[0.22em] uppercase mb-4"
              style={{ color: 'var(--color-stone-600)' }}
            >
              {t('footer.contact')}
            </h4>
            <ul
              className="space-y-2.5 text-[13px] font-light"
              style={{ color: 'var(--color-ink-500)' }}
            >
              <li>{t('common.email')}</li>
              <li className="leading-relaxed">{t('common.locations')}</li>
              <li>
                <Link
                  href="/contact"
                  className="text-[12px] font-light transition-colors"
                  style={{ color: 'var(--color-stone-600)', textDecoration: 'none' }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.color = 'var(--color-ink-900)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.color = 'var(--color-stone-600)';
                  }}
                >
                  {t('footer.requestConsultation')}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div
          className="mt-12 pt-7 border-t flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
          style={{ borderColor: 'var(--color-stone-200)' }}
        >
          <p className="text-[11px] tracking-wider" style={{ color: 'var(--color-stone-600)' }}>
            {subsidiaryCopyrightLine(getProduct('carlota-jo')?.name ?? 'Carlota Jo')}
          </p>
          <div className="flex items-center gap-6">
            <a
              href="https://x.com/szlholdings"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] tracking-wider transition-colors"
              style={{ color: 'var(--color-stone-600)', textDecoration: 'none' }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.color = 'var(--color-ink-600)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.color = 'var(--color-stone-600)';
              }}
            >
              X
            </a>
            <a
              href="https://linkedin.com/company/szlholdings"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] tracking-wider transition-colors"
              style={{ color: 'var(--color-stone-600)', textDecoration: 'none' }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.color = 'var(--color-ink-600)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.color = 'var(--color-stone-600)';
              }}
            >
              LinkedIn
            </a>
            {legalLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-[11px] tracking-wider transition-colors"
                style={{ color: 'var(--color-stone-600)', textDecoration: 'none' }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.color = 'var(--color-ink-600)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.color = 'var(--color-stone-600)';
                }}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
