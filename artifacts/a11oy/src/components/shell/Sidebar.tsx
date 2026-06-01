import { Link, useLocation } from 'wouter';
import { LayoutGrid, Palette, Mic2, Component, Rocket, ShieldCheck } from 'lucide-react';
import { cn } from '@szl-holdings/design-system';

const BASE = (import.meta.env.BASE_URL ?? '/a11oy/').replace(/\/$/, '');

const navItems = [
  { id: 'atlas', name: 'Atlas', icon: LayoutGrid, path: '/atlas' },
  { id: 'tokens', name: 'Tokens', icon: Palette, path: '/tokens' },
  { id: 'voice', name: 'Voice', icon: Mic2, path: '/voice' },
  { id: 'library', name: 'Library', icon: Component, path: '/library' },
  { id: 'releases', name: 'Releases', icon: Rocket, path: '/releases' },
  { id: 'audit', name: 'Audit', icon: ShieldCheck, path: '/audit' }
];

export function Sidebar() {
  const [location] = useLocation();

  return (
    <aside className="w-64 border-r border-[var(--color-a11oy-border)] bg-[var(--color-a11oy-deep)] shrink-0 flex flex-col h-[calc(100vh-3.5rem)] sticky top-14">
      <div className="p-4 flex-1">
        <div className="text-[10px] font-mono uppercase tracking-widest text-[var(--color-a11oy-text-ghost)] mb-4 px-2">
          Orchestration
        </div>
        <nav className="flex flex-col gap-1">
          {navItems.map(item => {
            const fullPath = `${BASE}${item.path}`;
            const isActive = location === fullPath || (location === BASE && item.id === 'atlas');
            
            return (
              <Link 
                key={item.id} 
                href={fullPath}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                  isActive 
                    ? "bg-[var(--color-a11oy-surface)] text-[var(--color-a11oy-blue)] font-medium" 
                    : "text-[var(--color-a11oy-text-sub)] hover:bg-[var(--color-a11oy-surface)] hover:text-[var(--color-a11oy-text)]"
                )}
              >
                <item.icon className={cn("w-4 h-4", isActive ? "opacity-100" : "opacity-60")} />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="p-4 border-t border-[var(--color-a11oy-border)] text-xs text-[var(--color-a11oy-text-ghost)]">
        <div>v4.2.0-rc.1</div>
        <div>System nominal</div>
      </div>
    </aside>
  );
}
