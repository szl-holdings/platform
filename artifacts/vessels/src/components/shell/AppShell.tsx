import { useEffect, useState, type ReactNode } from 'react';
import { ChevronDown, ChevronRight, Menu, Ship, X } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { cn } from '@szl-holdings/shared-ui/utils';
import type { SidebarNavSection } from '@szl-holdings/shared-ui/design-system';

const BASE = (import.meta.env.BASE_URL ?? '/').replace(/\/$/, '');

function isItemActive(href: string | undefined, location: string): boolean {
  if (!href) return false;
  const full = `${BASE}${href}`;
  return location === full || location === href || location.startsWith(full + '/') || location.startsWith(href + '/');
}

function NavItem({
  href,
  label,
  icon,
  badge,
  onNavigate,
}: {
  href: string;
  label: string;
  icon?: ReactNode;
  badge?: string | number;
  onNavigate?: () => void;
}) {
  const [location] = useLocation();
  const active = isItemActive(href, location);
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={cn(
        'flex items-center gap-2.5 px-3 py-1.5 rounded text-[12.5px] transition-colors',
        active
          ? 'bg-[#c9b787]/[0.10] text-[#d4c598] font-medium'
          : 'text-[#8a8a8a] hover:bg-white/[0.03] hover:text-[#f5f5f5]',
      )}
    >
      {icon && (
        <span className={cn('flex items-center justify-center', active ? 'opacity-100' : 'opacity-50')}>
          {icon}
        </span>
      )}
      <span className="flex-1 truncate">{label}</span>
      {badge && (
        <span
          className="text-[8.5px] font-mono uppercase tracking-wider px-1 py-0.5 rounded"
          style={{ background: 'rgba(201,183,135,0.16)', color: '#c9b787' }}
        >
          {badge}
        </span>
      )}
    </Link>
  );
}

function SectionGroup({
  section,
  defaultOpen,
  onNavigate,
}: {
  section: SidebarNavSection;
  defaultOpen: boolean;
  onNavigate?: () => void;
}) {
  const [location] = useLocation();
  const hasActiveChild = section.items.some((item) => isItemActive(item.href, location));
  const [isOpen, setIsOpen] = useState(defaultOpen || hasActiveChild);

  useEffect(() => {
    if (hasActiveChild) setIsOpen(true);
  }, [hasActiveChild, location]);

  return (
    <div className="mb-1">
      <button
        type="button"
        onClick={() => setIsOpen((p) => !p)}
        className={cn(
          'flex items-center gap-1.5 w-full text-left px-3 mt-4 mb-1 transition-colors cursor-pointer',
          'text-[10px] font-medium uppercase',
          hasActiveChild ? 'text-[#c9b787]/80' : 'text-[#5e5e5e] hover:text-[#8a8a8a]',
        )}
        style={{ fontFamily: 'var(--font-mono, monospace)', letterSpacing: '0.16em' }}
      >
        {isOpen ? <ChevronDown className="w-2.5 h-2.5 shrink-0" /> : <ChevronRight className="w-2.5 h-2.5 shrink-0" />}
        {section.label}
      </button>
      {isOpen && (
        <nav className="flex flex-col gap-px">
          {section.items.map((item) => (
            <NavItem
              key={item.id}
              href={item.href ?? '#'}
              label={item.label}
              icon={item.icon}
              badge={item.badge}
              onNavigate={onNavigate}
            />
          ))}
        </nav>
      )}
    </div>
  );
}

export interface VesselsSidebarProps {
  sections: SidebarNavSection[];
  footer?: ReactNode;
  onMobileClose?: () => void;
}

export function VesselsSidebar({ sections, footer, onMobileClose }: VesselsSidebarProps) {
  return (
    <aside
      className="w-60 shrink-0 flex flex-col h-[calc(100vh-3.5rem)] sticky top-14 overflow-y-auto"
      style={{
        borderRight: '1px solid rgba(255,255,255,0.06)',
        background: '#0c0c0c',
      }}
    >
      <div className="px-2 py-3 flex-1">
        {sections.map((s, i) => (
          <SectionGroup key={s.id} section={s} defaultOpen={i < 2} onNavigate={onMobileClose} />
        ))}
      </div>
      {footer && (
        <div className="px-3 py-3 border-t border-white/[0.05] shrink-0">{footer}</div>
      )}
    </aside>
  );
}

export interface VesselsTopBarProps {
  rightSlot?: ReactNode;
  onMobileToggle?: () => void;
}

export function VesselsTopBar({ rightSlot, onMobileToggle }: VesselsTopBarProps) {
  return (
    <header
      className="h-14 flex items-center justify-between px-5 shrink-0 z-30 sticky top-0"
      style={{
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(10,10,10,0.94)',
        backdropFilter: 'blur(8px)',
      }}
    >
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onMobileToggle}
          className="md:hidden p-1.5 rounded text-[#8a8a8a] hover:text-[#f5f5f5] hover:bg-white/[0.04] transition-colors"
          aria-label="Toggle navigation"
        >
          <Menu className="w-4 h-4" />
        </button>
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded flex items-center justify-center shrink-0"
            style={{
              background: 'rgba(201,183,135,0.08)',
              border: '1px solid rgba(201,183,135,0.16)',
            }}
          >
            <Ship className="w-3.5 h-3.5" style={{ color: '#c9b787' }} />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span
              className="font-display font-semibold text-[15px] tracking-tight text-[#f5f5f5]"
            >
              Vessels
            </span>
            <span
              className="hidden md:inline text-[10px] uppercase font-mono"
              style={{ color: '#c9b787', opacity: 0.55, letterSpacing: '0.16em' }}
            >
              Maritime Intelligence
            </span>
          </div>
        </Link>
      </div>
      <div className="flex items-center gap-3">
        {rightSlot}
        <span
          className="hidden md:flex items-center gap-1.5"
          style={{ color: '#6e6e6e' }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full bg-[#c9b787] animate-pulse"
            aria-hidden="true"
          />
          <span
            className="text-[10px] font-mono uppercase"
            style={{ letterSpacing: '0.14em' }}
          >
            Governed Environment
          </span>
        </span>
      </div>
    </header>
  );
}

export interface AppShellProps {
  topbar?: ReactNode;
  sidebar: ReactNode;
  children: ReactNode;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function AppShell({ topbar, sidebar, children, mobileOpen = false, onMobileClose }: AppShellProps) {
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: '#0a0a0a', color: '#f5f5f5' }}
    >
      {topbar}
      <div className="flex flex-1 min-h-0">
        <div className="hidden md:block">{sidebar}</div>
        {mobileOpen && (
          <div className="md:hidden fixed inset-0 z-40 flex">
            <div className="absolute inset-0 bg-black/60" onClick={onMobileClose} aria-hidden="true" />
            <div className="relative z-50">
              {sidebar}
              <button
                type="button"
                onClick={onMobileClose}
                className="absolute top-3 right-3 p-1.5 rounded text-[#8a8a8a] hover:text-[#f5f5f5] hover:bg-white/[0.04]"
                aria-label="Close navigation"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
        <main
          id="main-content"
          tabIndex={-1}
          className="flex-1 min-w-0 flex flex-col relative overflow-auto"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
