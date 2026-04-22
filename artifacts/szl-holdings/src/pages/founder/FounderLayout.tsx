import { AnimatePresence, m } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { type ReactNode, useState } from 'react';
import { Link, useLocation } from 'wouter';

const NAV_LINKS = [
  { href: '/founder/doctrine', label: 'Doctrine' },
  { href: '/founder/essays', label: 'Essays' },
  { href: '/founder/architecture', label: 'Architecture' },
  { href: '/founder/case-studies', label: 'Case Studies' },
  { href: '/founder/press', label: 'Proof' },
  { href: '/founder/design-partner', label: 'Design Partner' },
  { href: '/founder/contact', label: 'Contact' },
];

export function FounderLayout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const _isHome = location === '/founder' || location === '/founder/';

  return (
    <div
      className="min-h-screen"
      style={{
        background: 'hsl(214, 18%, 3%)',
        color: 'hsl(38, 8%, 95%)',
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      }}
    >
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          borderBottom: '1px solid hsla(0,0%,100%,0.055)',
          background: 'hsla(214, 18%, 3%, 0.92)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '0 clamp(1.5rem, 5vw, 3rem)',
            height: '64px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '2rem',
          }}
        >
          <Link href="/founder">
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.625rem',
                textDecoration: 'none',
                cursor: 'pointer',
              }}
            >
              <span
                style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  background: 'hsl(38, 52%, 58%)',
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontFamily: "'Space Grotesk', system-ui, sans-serif",
                  fontWeight: 600,
                  fontSize: '0.9375rem',
                  letterSpacing: '-0.01em',
                  color: 'hsl(38, 8%, 95%)',
                }}
              >
                Stephen Lutar
              </span>
            </span>
          </Link>

          <nav
            style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}
            className="hidden-mobile"
          >
            {NAV_LINKS.map((link) => {
              const active = location === link.href || location.startsWith(`${link.href}/`);
              return (
                <Link key={link.href} href={link.href}>
                  <span
                    style={{
                      padding: '0.375rem 0.75rem',
                      borderRadius: '6px',
                      fontSize: '0.8125rem',
                      fontWeight: active ? 500 : 400,
                      color: active ? 'hsl(38, 8%, 95%)' : 'hsl(214, 6%, 57%)',
                      textDecoration: 'none',
                      cursor: 'pointer',
                      transition: 'color 0.15s',
                      background: active ? 'hsla(0,0%,100%,0.055)' : 'transparent',
                    }}
                  >
                    {link.label}
                  </span>
                </Link>
              );
            })}
          </nav>

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'hsl(214, 6%, 57%)',
              padding: '0.375rem',
              display: 'none',
            }}
            className="show-mobile"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <AnimatePresence>
          {mobileOpen && (
            <m.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={{
                overflow: 'hidden',
                borderTop: '1px solid hsla(0,0%,100%,0.055)',
                background: 'hsl(214, 16%, 4%)',
              }}
            >
              <div style={{ padding: '0.75rem 1.5rem 1rem' }}>
                {NAV_LINKS.map((link) => (
                  <Link key={link.href} href={link.href} onClick={() => setMobileOpen(false)}>
                    <div
                      style={{
                        padding: '0.625rem 0',
                        fontSize: '0.9375rem',
                        color: 'hsl(214, 6%, 57%)',
                        borderBottom: '1px solid hsla(0,0%,100%,0.04)',
                        cursor: 'pointer',
                      }}
                    >
                      {link.label}
                    </div>
                  </Link>
                ))}
              </div>
            </m.div>
          )}
        </AnimatePresence>
      </header>

      <main>
        <m.div
          key={location}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        >
          {children}
        </m.div>
      </main>

      <footer
        style={{
          borderTop: '1px solid hsla(0,0%,100%,0.055)',
          marginTop: '6rem',
          padding: '3rem clamp(1.5rem, 5vw, 3rem)',
        }}
      >
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div>
            <div
              style={{
                fontFamily: "'Space Grotesk', system-ui, sans-serif",
                fontWeight: 600,
                fontSize: '0.875rem',
                color: 'hsl(38, 8%, 95%)',
                marginBottom: '0.25rem',
              }}
            >
              Stephen Lutar
            </div>
            <div style={{ fontSize: '0.8125rem', color: 'hsl(214, 6%, 57%)' }}>
              Founder & CEO, SZL Holdings
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              gap: '1.5rem',
              flexWrap: 'wrap',
              alignItems: 'center',
            }}
          >
            <a
              href="https://linkedin.com/in/stephen-l-279315240"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: '0.8125rem',
                color: 'hsl(214, 6%, 57%)',
                textDecoration: 'none',
              }}
            >
              LinkedIn
            </a>
            <Link href="/">
              <span
                style={{
                  fontSize: '0.8125rem',
                  color: 'hsl(214, 6%, 57%)',
                  cursor: 'pointer',
                }}
              >
                SZL Holdings ↗
              </span>
            </Link>
            <span style={{ fontSize: '0.8125rem', color: 'hsl(214, 6%, 55%)' }}>
              © {new Date().getFullYear()} SZL Holdings Ltd
            </span>
          </div>
        </div>
      </footer>

      <style>{`
        @media (max-width: 768px) {
          .hidden-mobile { display: none !important; }
          .show-mobile { display: block !important; }
        }
        @media (min-width: 769px) {
          .show-mobile { display: none !important; }
        }
      `}</style>
    </div>
  );
}
