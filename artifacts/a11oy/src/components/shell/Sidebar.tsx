import { Link, useLocation } from 'wouter';
import { LayoutGrid, Palette, Mic2, Component, Rocket, ShieldCheck, Infinity, Archive, Beaker, Sparkles, Sigma, MessageSquare, Search, DollarSign, Brain, Gauge } from 'lucide-react';
import { cn } from '@szl-holdings/design-system';

const BASE = (import.meta.env.BASE_URL ?? '/a11oy/').replace(/\/$/, '');

const navItems = [
  { id: 'atlas', name: 'Atlas', icon: LayoutGrid, path: '/atlas' },
  { id: 'tokens', name: 'Tokens', icon: Palette, path: '/tokens' },
  { id: 'voice', name: 'Voice', icon: Mic2, path: '/voice' },
  { id: 'library', name: 'Library', icon: Component, path: '/library' },
  { id: 'releases', name: 'Releases', icon: Rocket, path: '/releases' },
  { id: 'audit', name: 'Audit', icon: ShieldCheck, path: '/audit' },
  { id: 'andean', name: 'Andean Loop', icon: Infinity, path: '/andean-orchestration' },
  { id: 'archive', name: 'Portfolio Archive', icon: Archive, path: '/portfolio-archive' },
];

const decisionIntelligenceItems = [
  { id: 'di-overview', name: 'Command Overview', icon: Gauge, path: '/intelligence' },
  { id: 'di-deep-dive', name: 'Entity Deep Dive', icon: Search, path: '/intelligence/deep-dive' },
  { id: 'di-roi-lens', name: 'ROI Lens', icon: DollarSign, path: '/intelligence/roi-lens' },
  { id: 'di-propeller', name: 'Propeller Drive', icon: Brain, path: '/fabric/decisions' },
];

const intelligenceItems = [
  { id: 'chat', name: 'Chat', icon: MessageSquare, path: '/chat' },
  { id: 'sigil', name: 'SIGIL', icon: Sigma, path: '/sigil' },
  { id: 'lab', name: 'A11oy Lab', icon: Beaker, path: '/lab' },
];

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[11px] font-medium uppercase tracking-wider text-[var(--color-a11oy-text-ghost)] mt-7 mb-2 px-3 first:mt-0">
      {children}
    </div>
  );
}

export function Sidebar() {
  const [location] = useLocation();

  const renderNavItem = (item: { id: string; name: string; icon: React.ElementType; path: string }) => {
    const fullPath = `${BASE}${item.path}`;
    const isActive = location === fullPath || (location === BASE && item.id === 'atlas') || location.startsWith(fullPath + '/');

    return (
      <Link
        key={item.id}
        href={fullPath}
        className={cn(
          "flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] transition-colors",
          isActive
            ? "bg-[var(--color-a11oy-gold-soft)] text-[var(--color-a11oy-gold-dim)] font-medium"
            : "text-[var(--color-a11oy-text-sub)] hover:bg-[var(--color-a11oy-overlay)] hover:text-[var(--color-a11oy-text)]"
        )}
      >
        <item.icon className={cn("w-4 h-4", isActive ? "opacity-100" : "opacity-50")} />
        {item.name}
      </Link>
    );
  };

  return (
    <aside className="w-60 border-r border-[var(--color-a11oy-border-subtle)] bg-[var(--color-a11oy-surface)] shrink-0 flex flex-col h-[calc(100vh-3.5rem)] sticky top-14 overflow-y-auto">
      <div className="px-3 py-4 flex-1">
        <SectionHeader>Orchestration</SectionHeader>
        <nav className="flex flex-col gap-0.5">
          {navItems.map(renderNavItem)}
        </nav>

        <SectionHeader>Decision Intelligence</SectionHeader>
        <nav className="flex flex-col gap-0.5">
          {decisionIntelligenceItems.map(renderNavItem)}
        </nav>

        <SectionHeader>Intelligence</SectionHeader>
        <nav className="flex flex-col gap-0.5">
          {intelligenceItems.map(renderNavItem)}
        </nav>
      </div>
      <div className="px-4 py-3 border-t border-[var(--color-a11oy-border-subtle)] text-xs text-[var(--color-a11oy-text-ghost)]">
        <div>v4.2.0-rc.1</div>
        <div className="text-[var(--color-a11oy-success)]">System nominal</div>
      </div>
    </aside>
  );
}
