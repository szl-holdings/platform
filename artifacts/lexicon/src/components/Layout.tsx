import type { ReactNode } from 'react';
import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Scale, GitCompare, HelpCircle, Grid3X3, GitBranch, Code2, Menu, X, ExternalLink } from 'lucide-react';
import { TOTAL_LICENSES, HF_LICENSES, BEYOND_HF_LICENSES } from '@/data/licenses';

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, '') || '/lexicon';

const NAV_ITEMS = [
  { href: `${BASE}/`, label: 'Catalog', icon: Scale, id: 'nav-catalog' },
  { href: `${BASE}/compare`, label: 'Compare', icon: GitCompare, id: 'nav-compare' },
  { href: `${BASE}/recommender`, label: 'Recommender', icon: HelpCircle, id: 'nav-recommender' },
  { href: `${BASE}/matrix`, label: 'Matrix', icon: Grid3X3, id: 'nav-matrix' },
  { href: `${BASE}/families`, label: 'Family Trees', icon: GitBranch, id: 'nav-families' },
  { href: `${BASE}/api`, label: 'API', icon: Code2, id: 'nav-api' },
];

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-lexicon-surface font-sans">
      {/* Disclaimer Banner */}
      <div className="bg-lexicon-amber/10 border-b border-lexicon-amber/20 px-4 py-2 text-center text-xs font-medium tracking-wide text-lexicon-amber">
        For informational purposes only — not legal advice. Always consult a qualified attorney for licensing decisions.
      </div>

      {/* Navigation */}
      <header className="bg-lexicon-surface-raised border-b border-lexicon-border sticky top-0 z-50">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 flex items-center h-14 gap-6">
          {/* Logo */}
          <Link href={`${BASE}/`} className="flex items-center gap-2.5 shrink-0 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lexicon-blue rounded" data-testid="nav-logo">
            <div className="bg-lexicon-blue/10 p-1.5 rounded-md group-hover:bg-lexicon-blue/20 transition-colors">
              <Scale size={18} className="text-lexicon-blue" />
            </div>
            <span className="font-bold text-sm tracking-widest text-lexicon-text uppercase">Lexicon</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1.5 flex-1" aria-label="Main navigation">
            {NAV_ITEMS.map(({ href, label, icon: Icon, id }) => {
              const isActive = location === href || (href !== `${BASE}/` && location.startsWith(href));
              return (
                <Link key={href} href={href} data-testid={id}>
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer
                    ${isActive 
                      ? 'bg-lexicon-blue/15 text-lexicon-blue' 
                      : 'text-lexicon-text-muted hover:text-lexicon-text hover:bg-lexicon-surface-raised-hover'
                    }`}
                  >
                    <Icon size={14} className={isActive ? "text-lexicon-blue" : "opacity-70"} />
                    {label}
                  </div>
                </Link>
              );
            })}
          </nav>

          {/* Stats */}
          <div className="hidden lg:flex items-center gap-4 text-xs text-lexicon-text-muted shrink-0 bg-lexicon-surface px-3 py-1.5 rounded-full border border-lexicon-border">
            <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-lexicon-green"></span><strong className="text-lexicon-text font-semibold">{HF_LICENSES.length}</strong> on HF</span>
            <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-lexicon-purple"></span><strong className="text-lexicon-text font-semibold">+{BEYOND_HF_LICENSES.length}</strong> beyond</span>
          </div>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
            data-testid="button-mobile-menu"
            className="md:hidden ml-auto p-2 text-lexicon-text-muted hover:text-lexicon-text rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lexicon-blue"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile nav */}
        {mobileOpen && (
          <div className="md:hidden bg-lexicon-surface-raised border-t border-lexicon-border px-4 py-3 space-y-1 animate-fade-in" data-testid="mobile-menu">
            {NAV_ITEMS.map(({ href, label, icon: Icon, id }) => {
              const isActive = location === href || (href !== `${BASE}/` && location.startsWith(href));
              return (
                <Link key={href} href={href} onClick={() => setMobileOpen(false)} data-testid={`${id}-mobile`}>
                  <div className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors cursor-pointer
                    ${isActive 
                      ? 'bg-lexicon-blue/15 text-lexicon-blue' 
                      : 'text-lexicon-text hover:bg-lexicon-surface-raised-hover'
                    }`}
                  >
                    <Icon size={16} className={isActive ? "text-lexicon-blue" : "text-lexicon-text-muted"} />
                    {label}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </header>

      {/* Main content */}
      <main id="main-content" className="flex-1 w-full">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-lexicon-surface-raised border-t border-lexicon-border py-8 mt-auto">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="bg-lexicon-blue/10 p-1.5 rounded">
              <Scale size={16} className="text-lexicon-blue" />
            </div>
            <div>
              <span className="font-bold text-sm text-lexicon-text uppercase tracking-widest">Lexicon</span>
              <span className="text-lexicon-text-muted text-xs ml-2 hidden sm:inline-block">— License Intelligence Catalog</span>
            </div>
          </div>
          
          <div className="text-xs text-lexicon-text-muted text-center md:text-left max-w-md">
            {TOTAL_LICENSES} licenses cataloged ({HF_LICENSES.length} on Hugging Face + {BEYOND_HF_LICENSES.length} beyond).<br />
            For informational purposes only. Not legal advice.
          </div>
          
          <div className="flex flex-wrap justify-center gap-6 text-xs font-medium text-lexicon-text-muted">
            <a href="https://huggingface.co/docs/hub/repositories-licenses" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-lexicon-blue transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-lexicon-blue rounded px-1" data-testid="link-hf-ref">
              HF Reference <ExternalLink size={12} />
            </a>
            <a href="https://spdx.org/licenses/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-lexicon-blue transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-lexicon-blue rounded px-1" data-testid="link-spdx">
              SPDX <ExternalLink size={12} />
            </a>
            <Link href={`${BASE}/api`} data-testid="link-api">
              <span className="hover:text-lexicon-blue transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-lexicon-blue rounded px-1">Public API</span>
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
