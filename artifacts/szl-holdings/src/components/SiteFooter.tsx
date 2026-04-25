import { brand, copyrightLineShort } from '@szl-holdings/brand-registry';
import { NewsletterSubscribe } from '@szl-holdings/shared-ui/newsletter-subscribe';
import { Link } from 'wouter';

const FOOTER_COLS = [
  {
    heading: 'Platform',
    links: [
      { label: 'Platform Overview', href: '/platform' },
      { label: 'Lyte — Command', href: '/lyte' },
      { label: 'Counsel — Execution', href: '/alloy-fabric' },
      { label: 'APEX — Mobile', href: 'https://cortex.szlholdings.com' },
      { label: 'Architecture', href: '/architecture' },
    ],
  },
  {
    heading: 'Solutions',
    links: [
      { label: 'Aegis — Security', href: '/solutions/aegis' },
      { label: 'Vessels — Maritime', href: '/solutions/vessels' },
      { label: 'Terra — Real Estate', href: '/solutions/terra' },
      { label: 'Counsel — Legal', href: '/counsel' },
    ],
  },
  {
    heading: 'Trust & Proof',
    links: [
      { label: 'Trust Center', href: '/trust' },
      { label: 'Trust Center Status', href: '/trust-center/status' },
      { label: 'Product Readiness', href: '/product-readiness' },
      { label: 'Technical Proof', href: '/technical-proof' },
      { label: 'Changelog Highlights', href: '/changelog-highlights' },
      { label: 'Full Changelog', href: '/changelog' },
      { label: 'Security', href: '/trust/security' },
      { label: 'AI Governance', href: '/trust/ai' },
    ],
  },
  {
    heading: 'Docs',
    links: [
      { label: 'Documentation', href: '/docs' },
      { label: 'Control Plane', href: '/docs/control-plane' },
      { label: 'Proof Chain', href: '/docs/proof-chain' },
      { label: 'Model Mesh', href: '/docs/model-mesh' },
    ],
  },
  {
    heading: 'Resources',
    links: [
      { label: 'Insights', href: '/insights' },
      { label: 'Case Studies', href: '/case-studies' },
      { label: 'FAQ', href: '/faq' },
      { label: 'Public Roadmap', href: '/roadmap' },
    ],
  },
  {
    heading: 'Company',
    links: [
      { label: 'About SZL Holdings', href: '/company' },
      { label: 'Leadership', href: '/leadership' },
      { label: 'Founder', href: '/founder' },
      { label: 'Design Partners', href: '/design-partner' },
      { label: 'Contact', href: '/contact' },
    ],
  },
];

const LEGAL_LINKS = [
  { label: 'Privacy', href: '/legal/privacy' },
  { label: 'Terms', href: '/legal/terms' },
  { label: 'Acceptable Use', href: '/legal/acceptable-use' },
  { label: 'Security Disclosure', href: '/trust/security' },
];

const VERSION = 'v2026.1';

const SOCIAL_LINKS = [
  {
    label: 'LinkedIn',
    href: 'https://www.linkedin.com/company/szlholdings',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    ),
  },
  {
    label: 'X / Twitter',
    href: 'https://x.com/szlholdings',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    label: 'Medium',
    href: 'https://medium.com/@stephen_38454',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M13.54 12a6.8 6.8 0 01-6.77 6.82A6.8 6.8 0 010 12a6.8 6.8 0 016.77-6.82A6.8 6.8 0 0113.54 12zM20.96 12c0 3.54-1.51 6.42-3.38 6.42-1.87 0-3.39-2.88-3.39-6.42s1.52-6.42 3.39-6.42 3.38 2.88 3.38 6.42M24 12c0 3.17-.53 5.75-1.19 5.75-.66 0-1.19-2.58-1.19-5.75s.53-5.75 1.19-5.75C23.47 6.25 24 8.83 24 12z" />
      </svg>
    ),
  },
  {
    label: 'Substack',
    href: 'https://szlholdings.substack.com',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M22.539 8.242H1.46V5.406h21.08v2.836zM1.46 10.812V24L12 18.11 22.54 24V10.812H1.46zM22.54 0H1.46v2.836h21.08V0z" />
      </svg>
    ),
  },
];

export function SiteFooter() {
  return (
    <footer
      style={{
        borderTop: '1px solid var(--color-szl-border)',
        background: 'hsl(210,12%,4%)',
        padding: '4rem 0 2rem',
      }}
    >
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 var(--space-content-x)' }}>
        {/* Top: Brand + columns */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1.4fr repeat(6, 1fr)',
            gap: '2rem',
            marginBottom: '3rem',
          }}
          className="grid-cols-2 sm:grid-cols-3 lg:grid-cols-[1.4fr_repeat(6,1fr)]"
        >
          {/* Brand column */}
          <div>
            <div
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}
            >
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '0.25rem',
                  background:
                    'linear-gradient(135deg, var(--color-szl-accent) 0%, hsl(38,45%,42%) 100%)',
                  flexShrink: 0,
                }}
              >
                <span
                  style={{
                    color: 'hsl(214,16%,4%)',
                    fontWeight: 700,
                    fontSize: '0.5625rem',
                    fontFamily: 'var(--font-display)',
                  }}
                >
                  SZL
                </span>
              </div>
              <span
                style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 600,
                  color: 'var(--color-szl-text)',
                  fontSize: '0.875rem',
                  letterSpacing: '-0.02em',
                }}
              >
                SZL Holdings
              </span>
            </div>
            <p
              style={{
                color: 'var(--color-szl-text-secondary)',
                fontSize: '0.8125rem',
                lineHeight: 1.65,
                maxWidth: '16rem',
                marginBottom: '1rem',
              }}
            >
              {brand.boilerplate.governancePhilosophy}
            </p>
            <p
              style={{
                color: 'var(--color-szl-text-faint)',
                fontSize: '0.6875rem',
                fontFamily: 'var(--font-mono)',
                letterSpacing: '0.04em',
                marginBottom: '0.2rem',
              }}
            >
              Washington, D.C. · London · Singapore
            </p>
            <p
              style={{
                color: 'var(--color-szl-text-faint)',
                fontSize: '0.6875rem',
                fontFamily: 'var(--font-mono)',
                marginBottom: '1rem',
              }}
            >
              hello@szlholdings.com
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {SOCIAL_LINKS.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={link.label}
                  title={link.label}
                  style={{
                    color: 'var(--color-szl-text-faint)',
                    transition: 'color 0.2s ease',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0.25rem',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.color =
                      'var(--color-szl-text-secondary)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.color = 'var(--color-szl-text-faint)';
                  }}
                >
                  {link.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Nav columns */}
          {FOOTER_COLS.map((col) => (
            <div key={col.heading}>
              <h4
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 600,
                  color: 'var(--color-szl-text-faint)',
                  fontSize: '0.5625rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.12em',
                  marginBottom: '0.875rem',
                }}
              >
                {col.heading}
              </h4>
              <ul
                style={{
                  listStyle: 'none',
                  margin: 0,
                  padding: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.4rem',
                }}
              >
                {col.links.map((link) => {
                  const isExternal = link.href.startsWith('http');
                  const linkStyle = {
                    fontSize: '0.8125rem',
                    color: 'var(--color-szl-text-secondary)',
                    transition: 'color 0.18s ease',
                    display: 'block',
                    textDecoration: 'none',
                  };
                  const onEnter = (e: React.MouseEvent) => {
                    (e.currentTarget as HTMLElement).style.color = 'var(--color-szl-text)';
                  };
                  const onLeave = (e: React.MouseEvent) => {
                    (e.currentTarget as HTMLElement).style.color =
                      'var(--color-szl-text-secondary)';
                  };
                  return (
                    <li key={link.label}>
                      {isExternal ? (
                        <a
                          href={link.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={linkStyle}
                          onMouseEnter={onEnter}
                          onMouseLeave={onLeave}
                        >
                          {link.label}
                        </a>
                      ) : (
                        <Link
                          href={link.href}
                          style={linkStyle}
                          onMouseEnter={onEnter}
                          onMouseLeave={onLeave}
                        >
                          {link.label}
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        {/* Newsletter subscribe */}
        <div
          style={{
            marginBottom: '3rem',
            paddingBottom: '2.5rem',
            borderBottom: '1px solid var(--color-szl-border)',
          }}
        >
          <NewsletterSubscribe
            variant="compact"
            utmSource="szl-holdings"
            heading="Stay ahead with SZL Command"
            subheading="Weekly intelligence briefings on governed AI, portfolio operations, and domain insights."
          />
        </div>

        {/* Bottom bar */}
        <div
          style={{
            paddingTop: '1.5rem',
            borderTop: '1px solid var(--color-szl-border)',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '1rem',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
            <p
              style={{
                color: 'var(--color-szl-text-faint)',
                fontSize: '0.6875rem',
                fontFamily: 'var(--font-mono)',
                marginRight: '0.5rem',
              }}
            >
              {copyrightLineShort()}
            </p>
            <span
              aria-hidden="true"
              style={{
                color: 'var(--color-szl-text-faint)',
                fontSize: '0.6875rem',
                fontFamily: 'var(--font-mono)',
                opacity: 0.5,
              }}
            >
              ·
            </span>
            <p
              style={{
                color: 'var(--color-szl-text-faint)',
                fontSize: '0.6875rem',
                fontFamily: 'var(--font-mono)',
              }}
            >
              Stephen Lutar, Founder
            </p>
            <span
              aria-hidden="true"
              style={{
                color: 'var(--color-szl-text-faint)',
                fontSize: '0.6875rem',
                fontFamily: 'var(--font-mono)',
                opacity: 0.5,
              }}
            >
              ·
            </span>
            <p
              style={{
                color: 'var(--color-szl-text-faint)',
                fontSize: '0.6875rem',
                fontFamily: 'var(--font-mono)',
              }}
            >
              {VERSION}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            {LEGAL_LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                style={{
                  color: 'var(--color-szl-text-faint)',
                  fontSize: '0.6875rem',
                  fontFamily: 'var(--font-mono)',
                  textDecoration: 'none',
                  transition: 'color 0.18s ease',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.color = 'var(--color-szl-text-secondary)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.color = 'var(--color-szl-text-faint)';
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
