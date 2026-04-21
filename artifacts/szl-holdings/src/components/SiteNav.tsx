import { useAuth } from '@szl-holdings/replit-auth-web';
import { UserButton } from '@szl-holdings/shared-ui/UserButton';
import { useRole } from '@szl-holdings/shared-ui/use-role';
import { AnimatePresence, m } from 'framer-motion';
import { ChevronDown, Menu, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { analytics } from '@/lib/analytics';
import { cn } from '@/lib/utils';

/**
 * Institutional navigation — 6 top-level items.
 * Lower-priority applications are demoted behind Solutions.
 */
const NAV_ITEMS = [
  {
    label: 'Platform',
    href: '/platform',
    children: [
      { label: 'Platform Overview', href: '/platform', note: 'Governed decision operating system' },
      { label: 'Governed Intelligence', href: '/governed-cockpit', note: 'Proof envelope cockpit' },
      { label: 'KORA', href: '/lyte', note: 'Operational nerve center' },
      {
        label: 'Lyte · Decision Theater',
        href: '/lyte/decision-theater',
        note: 'Governed decision flow',
      },
      {
        label: 'Lyte · Signal Fusion',
        href: '/lyte/signal-fusion',
        note: 'Cross-domain signal aggregation',
      },
      {
        label: 'Lyte · Health & Freshness',
        href: '/lyte/health-freshness',
        note: 'Connector freshness & data health',
      },
      {
        label: 'Lyte · Decision Schemas',
        href: '/lyte/decision-schemas',
        note: 'Reusable schema library',
      },
      {
        label: 'Lyte · Governance Posture',
        href: '/lyte/governance-posture',
        note: 'CISO-grade policy dashboard',
      },
      { label: 'FORGE', href: '/alloy-fabric', note: 'Governance execution fabric' },
      { label: 'APEX', href: 'https://cortex.szlholdings.com', note: 'Mobile command' },
      { label: 'Command Portal', href: '/command/', note: 'Ecosystem overview' },
      { label: 'Business State', href: '/business-state', note: 'Enterprise business overview' },
    ],
  },
  {
    label: 'Solutions',
    href: '/solutions',
    children: [
      { label: 'Domain Packs Overview', href: '/solutions', note: 'Governed vertical extensions' },
      { label: 'PARAGON', href: '/solutions/aegis', note: 'Defense & intelligence  ·  Beta' },
      { label: 'SEXTANT', href: '/solutions/vessels', note: 'Maritime intelligence  ·  Beta' },
      { label: 'DOMAINE', href: '/solutions/terra', note: 'Real estate intelligence  ·  Beta' },
      {
        label: 'Counsel',
        href: '/counsel',
        note: 'Legal operations  ·  Beta',
      },
      { label: 'Carlota Jo', href: '/carlota-jo/', note: 'Private advisory  ·  Beta' },
    ],
  },
  {
    label: 'Trust',
    href: '/trust',
    children: [
      { label: 'Trust Center', href: '/trust', note: 'Full diligence index' },
      { label: 'Security Posture', href: '/trust/security', note: 'Controls and isolation model' },
      { label: 'AI Governance', href: '/trust/ai', note: 'Human-in-the-loop accountability' },
      { label: 'Executive Brief', href: '/trust/diligence/executive', note: 'ROI and oversight — for buyers' },
      { label: 'Technical Brief', href: '/trust/diligence/technical', note: 'Architecture and integration depth' },
      { label: 'Investor Brief', href: '/trust/diligence/investor', note: 'Moat and defensibility' },
    ],
  },
  {
    label: 'Architecture',
    href: '/architecture',
    children: [
      { label: 'Architecture Overview', href: '/architecture', note: 'Three-tier platform design' },
      { label: 'Proof Chain', href: '/docs/proof-chain', note: 'Immutable audit record design' },
      { label: 'Outcome Graph', href: '/docs/outcome-graph', note: 'Decision lifecycle and consequence' },
      { label: 'Covenant Policy', href: '/docs/covenant-policy', note: 'Governance rules engine' },
      { label: 'Simulation Engine', href: '/docs/simulation', note: 'Probabilistic risk modeling' },
      { label: 'Technical Proof', href: '/technical-proof', note: 'Build evidence for evaluators' },
    ],
  },
  {
    label: 'Company',
    href: '/company',
    children: [
      { label: 'About SZL Holdings', href: '/company', note: 'Mission and thesis' },
      { label: 'Founder', href: '/founder', note: 'Stephen Lutar' },
      { label: 'Investor Relations', href: '/investor', note: 'Series A diligence materials' },
      { label: 'Design Partners', href: '/design-partner', note: 'Work with us during beta' },
      { label: 'Operating Doctrine', href: '/operating-doctrine', note: 'How we build' },
      { label: 'Insights', href: '/insights', note: 'Analysis and commentary' },
    ],
  },
  {
    label: 'Contact',
    href: '/contact',
    children: null,
  },
];

const NAV_LINKS_MOBILE = [
  { label: 'Request a Demo', href: '/demo', primary: true },
  { label: 'Design Partners', href: '/design-partner', primary: true },
  { label: 'Investor Relations', href: '/investor', primary: true },
  { label: '— Platform —', href: '/platform', primary: false, section: true },
  { label: 'Platform Overview', href: '/platform', primary: false },
  { label: 'Governed Intelligence', href: '/governed-cockpit', primary: false },
  { label: 'KORA', href: '/lyte', primary: false },
  { label: 'Lyte · Decision Theater', href: '/lyte/decision-theater', primary: false },
  { label: 'Lyte · Signal Fusion', href: '/lyte/signal-fusion', primary: false },
  { label: 'Lyte · Decision Schemas', href: '/lyte/decision-schemas', primary: false },
  { label: 'Lyte · Governance Posture', href: '/lyte/governance-posture', primary: false },
  { label: 'FORGE', href: '/alloy-fabric', primary: false },
  { label: 'APEX', href: 'https://cortex.szlholdings.com', primary: false },
  { label: 'Command Portal', href: '/command/', primary: false },
  { label: 'Business State', href: '/business-state', primary: false },
  { label: '— Primitives —', href: '/architecture', primary: false, section: true },
  { label: 'Architecture', href: '/architecture', primary: false },
  { label: 'Outcome Graph', href: '/docs/outcome-graph', primary: false },
  { label: 'Proof Chain', href: '/docs/proof-chain', primary: false },
  { label: 'Covenant Policy', href: '/docs/covenant-policy', primary: false },
  { label: 'Simulation', href: '/docs/simulation', primary: false },
  { label: '— Domain Packs —', href: '/solutions', primary: false, section: true },
  { label: 'Domain Packs Overview', href: '/solutions', primary: false },
  { label: 'PARAGON', href: '/solutions/aegis', primary: false },
  { label: 'SEXTANT', href: '/solutions/vessels', primary: false },
  { label: 'DOMAINE', href: '/solutions/terra', primary: false },
  { label: 'Counsel', href: '/counsel', primary: false },
  { label: 'Carlota Jo', href: '/carlota-jo/', primary: false },
  { label: '— Proof —', href: '/product-readiness', primary: false, section: true },
  { label: 'Product Readiness Matrix', href: '/product-readiness', primary: false },
  { label: 'Trust Center Status', href: '/trust-center/status', primary: false },
  { label: 'Technical Proof', href: '/technical-proof', primary: false },
  { label: 'Changelog Highlights', href: '/changelog-highlights', primary: false },
  { label: 'Full Changelog', href: '/changelog', primary: false },
  { label: '— Trust & Company —', href: '/trust', primary: false, section: true },
  { label: 'Trust Center', href: '/trust', primary: false },
  { label: 'Executive Brief', href: '/trust/diligence/executive', primary: false },
  { label: 'Technical Brief', href: '/trust/diligence/technical', primary: false },
  { label: 'Security Brief', href: '/trust/diligence/security', primary: false },
  { label: 'Investor Brief', href: '/trust/diligence/investor', primary: false },
  { label: 'Security', href: '/trust/security', primary: false },
  { label: 'Documentation', href: '/docs', primary: false },
  { label: 'Insights', href: '/insights', primary: false },
  { label: 'About SZL Holdings', href: '/company', primary: false },
  { label: 'Contact', href: '/contact', primary: false },
];

export function SiteNav() {
  const [open, setOpen] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [location] = useLocation();
  const { isAuthenticated } = useAuth();
  const { role } = useRole();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setOpen(null);
  }, [location]);

  useEffect(() => {
    if (mobileOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  return (
    <>
      <header
        className={cn('szl-site-nav', scrolled && 'szl-site-nav--scrolled')}
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
          height: '3.5rem',
          background: scrolled ? 'hsla(214,16%,4%,0.96)' : 'transparent',
          backdropFilter: scrolled ? 'blur(12px)' : 'none',
          borderBottom: scrolled ? '1px solid hsla(0,0%,100%,0.055)' : '1px solid transparent',
          transition: 'background 0.2s, backdrop-filter 0.2s, border-color 0.2s',
        }}
      >
        <div style={{ maxWidth: '80rem', margin: '0 auto', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 var(--space-content-x)' }}>

          <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.9375rem', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--gi-text-primary)', fontFamily: 'var(--font-display)' }}>SZL Holdings</span>
          </Link>

          <nav style={{ display: 'flex', alignItems: 'center', gap: '0.125rem' }} role="navigation" aria-label="Main navigation" className="szl-desktop-nav">
            {NAV_ITEMS.map(item => (
              <div
                key={item.label}
                style={{ position: 'relative' }}
                onMouseEnter={() => item.children && setOpen(item.label)}
                onMouseLeave={() => setOpen(null)}
              >
                {item.children ? (
                  <button
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.25rem',
                      padding: '0.375rem 0.625rem',
                      fontSize: '0.8125rem', fontWeight: 500,
                      color: open === item.label ? 'var(--gi-text-primary)' : 'var(--gi-text-secondary)',
                      background: 'transparent', border: 'none', cursor: 'pointer',
                      borderRadius: 'var(--radius-sm)', transition: 'color 0.15s',
                    }}
                    aria-expanded={open === item.label}
                    aria-haspopup="true"
                  >
                    {item.label}
                    <ChevronDown size={13} style={{ transition: 'transform 0.15s', transform: open === item.label ? 'rotate(-180deg)' : 'none' }} />
                  </button>
                ) : (
                  <Link
                    href={item.href}
                    style={{ padding: '0.375rem 0.625rem', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--gi-text-secondary)', textDecoration: 'none', borderRadius: 'var(--radius-sm)', display: 'block', transition: 'color 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'var(--gi-text-primary)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--gi-text-secondary)')}
                  >
                    {item.label}
                  </Link>
                )}

                <AnimatePresence>
                  {open === item.label && item.children && (
                    <m.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 6 }}
                      transition={{ duration: 0.15 }}
                      style={{
                        position: 'absolute', top: 'calc(100% + 0.5rem)', left: '50%', transform: 'translateX(-50%)',
                        minWidth: '18rem', background: 'hsla(214,16%,6%,0.98)', border: '1px solid hsla(0,0%,100%,0.08)',
                        borderRadius: 'var(--radius-lg)', boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                        backdropFilter: 'blur(16px)', overflow: 'hidden', padding: '0.375rem',
                      }}
                    >
                      {item.children.map(child => (
                        <Link
                          key={child.href}
                          href={child.href}
                          onClick={() => { setOpen(null); analytics.track('nav_click', { item: child.label }); }}
                          style={{ display: 'block', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-md)', textDecoration: 'none', transition: 'background 0.12s' }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'hsla(0,0%,100%,0.055)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        >
                          <p style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--gi-text-primary)', margin: '0 0 0.125rem' }}>{child.label}</p>
                          {child.note && (
                            <p style={{ fontSize: '0.6875rem', color: 'var(--gi-text-muted)', margin: 0 }}>{child.note}</p>
                          )}
                        </Link>
                      ))}
                    </m.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </nav>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            {isAuthenticated ? (
              <UserButton />
            ) : (
              <>
                <Link href="/login" style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--gi-text-secondary)', textDecoration: 'none', padding: '0.375rem 0.625rem' }} className="szl-desktop-nav">
                  Sign in
                </Link>
                <Link
                  href="/demo"
                  onClick={() => analytics.track('cta_click', { location: 'nav', label: 'Request Demo' })}
                  style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#ffffff', background: '#1e6abf', padding: '0.4375rem 0.875rem', borderRadius: 'var(--radius-md)', textDecoration: 'none', transition: 'opacity 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
                  onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                >
                  Request Demo
                </Link>
              </>
            )}

            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="szl-mobile-toggle"
              style={{ padding: '0.375rem', background: 'transparent', border: 'none', color: 'var(--gi-text-secondary)', cursor: 'pointer' }}
              aria-label={mobileOpen ? 'Close navigation' : 'Open navigation'}
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {mobileOpen && (
          <m.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.22 }}
            style={{
              position: 'fixed', inset: 0, zIndex: 99, background: 'hsla(214,16%,4%,0.99)',
              backdropFilter: 'blur(12px)', overflowY: 'auto', paddingTop: '4rem', paddingBottom: '2rem',
            }}
            role="dialog"
            aria-modal="true"
            aria-label="Mobile navigation"
          >
            <div style={{ padding: '0 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.125rem' }}>
              {NAV_LINKS_MOBILE.map((item, i) => {
                const isSection = 'section' in item && item.section;
                const isPrimary = 'primary' in item && item.primary;
                return (
                  <Link
                    key={`${item.href}-${i}`}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    style={{
                      padding: isSection ? '1rem 0 0.25rem' : '0.625rem 0',
                      fontSize: isSection ? '0.6875rem' : '1rem',
                      fontWeight: isSection ? 700 : isPrimary ? 600 : 400,
                      letterSpacing: isSection ? '0.1em' : 'normal',
                      textTransform: isSection ? 'uppercase' : 'none',
                      color: isSection ? 'var(--gi-text-muted)' : isPrimary ? 'var(--gi-accent-blue)' : 'var(--gi-text-secondary)',
                      textDecoration: 'none',
                      borderBottom: isSection ? '1px solid hsla(0,0%,100%,0.055)' : 'none',
                      display: 'block',
                    }}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </m.div>
        )}
      </AnimatePresence>

      <style>{`
        @media (max-width: 768px) {
          .szl-desktop-nav { display: none !important; }
          .szl-mobile-toggle { display: flex !important; }
        }
        @media (min-width: 769px) {
          .szl-mobile-toggle { display: none !important; }
        }
      `}</style>
    </>
  );
}
