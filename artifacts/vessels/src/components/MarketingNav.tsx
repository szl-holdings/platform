import { ChevronRight, Menu, Ship, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useLocation } from 'wouter';

const navLinks = [
  { label: 'Platform', href: '/platform' },
  { label: 'Capabilities', href: '/capabilities' },
  { label: 'Use Cases', href: '/use-cases' },
  { label: 'Security', href: '/security' },
  { label: 'Pricing', href: '/pricing' },
];

export function MarketingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [location] = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 32);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => setMobileOpen(false), [location]);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-[#060e1a]/95 backdrop-blur-md border-b border-sky-500/10' : 'bg-transparent'
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 h-[60px] flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center">
            <Ship className="w-4 h-4 text-sky-400" />
          </div>
          <span className="font-bold text-[14px] text-sky-50 tracking-tight">Vessels</span>
        </Link>

        <div className="hidden md:flex items-center gap-7">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-[13px] font-medium transition-colors duration-200 ${
                location === link.href ? 'text-sky-300' : 'text-sky-300/50 hover:text-sky-200'
              }`}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/sign-in"
            className="text-[13px] font-medium text-sky-300/40 hover:text-sky-200 transition-colors"
          >
            Sign In
          </Link>
          <a
            href="./dashboard?demo=true"
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] font-semibold text-[#060e1a] bg-sky-400 hover:bg-sky-300 transition-colors"
          >
            Try Demo <ChevronRight size={13} />
          </a>
        </div>

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden text-sky-300/50 hover:text-sky-200 transition-colors"
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden bg-[#060e1a]/97 border-b border-sky-500/10">
          <div className="px-6 py-5 flex flex-col gap-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="text-sky-200 text-[15px] font-medium hover:text-sky-100 transition-colors"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/sign-in"
              onClick={() => setMobileOpen(false)}
              className="text-sky-300/50 text-[15px]"
            >
              Sign In
            </Link>
            <Link
              href="/demo"
              onClick={() => setMobileOpen(false)}
              className="mt-1 px-5 py-3 rounded-lg text-[13px] font-semibold text-[#060e1a] bg-sky-400 text-center"
            >
              Request a private demo
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
