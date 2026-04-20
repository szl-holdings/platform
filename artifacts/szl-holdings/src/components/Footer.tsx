import { aboutSzlParagraph, copyrightLine } from '@szl-holdings/brand-registry';
import { Link } from 'wouter';

const nav = [
  { label: 'Ecosystem', href: '/ecosystem', external: false },
  { label: 'Alloy', href: '/alloy/', external: true },
  { label: 'Lyte', href: '/command/operations/', external: true },
  { label: 'Vessels', href: '/vessels/', external: true },
  { label: 'Trust', href: '/trust', external: false },
  { label: 'Status', href: '/status', external: false },
  { label: 'Leadership', href: '/leadership', external: false },
  { label: 'Founder', href: '/founder', external: false },
  { label: 'Contact', href: '/contact', external: false },
];

const legal = [
  { label: 'Privacy', href: '/contact' },
  { label: 'Terms', href: '/contact' },
];

export function Footer() {
  return (
    <footer
      style={{
        background: 'hsl(210,12%,4%)',
        borderTop: '1px solid hsla(0,0%,100%,0.05)',
        padding: '3.5rem 0 2rem',
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-8 mb-10">
          <div>
            <Link
              href="/"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.625rem',
                textDecoration: 'none',
                marginBottom: '0.875rem',
              }}
            >
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '6px',
                  background: 'linear-gradient(135deg, hsl(210,12%,24%), hsl(210,10%,18%))',
                  border: '1px solid hsla(0,0%,100%,0.10)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <span
                  style={{
                    color: 'hsl(38,12%,94%)',
                    fontWeight: '700',
                    fontSize: '9px',
                    letterSpacing: '-0.02em',
                  }}
                >
                  SZL
                </span>
              </div>
              <span
                style={{
                  color: 'hsl(38,12%,88%)',
                  fontWeight: '600',
                  fontSize: '13px',
                  letterSpacing: '-0.01em',
                }}
              >
                SZL Holdings
              </span>
            </Link>
            <p
              style={{
                fontSize: '12px',
                lineHeight: '1.6',
                color: 'hsl(210,5%,44%)',
                maxWidth: '22rem',
              }}
            >
              {aboutSzlParagraph()}
            </p>
          </div>

          <nav style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem 1.5rem' }}>
            {nav.map((item) => {
              if (item.external) {
                return (
                  <a
                    key={item.label}
                    href={item.href}
                    style={{
                      color: 'hsl(210,5%,50%)',
                      fontSize: '12.5px',
                      textDecoration: 'none',
                      transition: 'color 0.16s ease',
                    }}
                    onMouseEnter={(e) =>
                      ((e.currentTarget as HTMLElement).style.color = 'hsl(38,12%,88%)')
                    }
                    onMouseLeave={(e) =>
                      ((e.currentTarget as HTMLElement).style.color = 'hsl(210,5%,50%)')
                    }
                  >
                    {item.label}
                  </a>
                );
              }
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  style={{
                    color: 'hsl(210,5%,50%)',
                    fontSize: '12.5px',
                    textDecoration: 'none',
                    transition: 'color 0.16s ease',
                  }}
                  onMouseEnter={(e) =>
                    ((e.currentTarget as HTMLElement).style.color = 'hsl(38,12%,88%)')
                  }
                  onMouseLeave={(e) =>
                    ((e.currentTarget as HTMLElement).style.color = 'hsl(210,5%,50%)')
                  }
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div
          style={{ height: '1px', background: 'hsla(0,0%,100%,0.05)', marginBottom: '1.5rem' }}
        />

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <p style={{ fontSize: '11.5px', color: 'hsl(210,5%,38%)' }}>{copyrightLine()}</p>
          <div style={{ display: 'flex', gap: '1.25rem' }}>
            {legal.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                style={{
                  color: 'hsl(210,5%,38%)',
                  fontSize: '11.5px',
                  textDecoration: 'none',
                  transition: 'color 0.16s ease',
                }}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLElement).style.color = 'hsl(210,5%,58%)')
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLElement).style.color = 'hsl(210,5%,38%)')
                }
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
