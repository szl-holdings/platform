import React from 'react';
import { Link, useLocation } from 'wouter';
import { cn } from '@/lib/utils';
import {
  Activity,
  Cable,
  FolderSync,
  History,
  LayoutTemplate,
  Settings,
  Menu,
} from 'lucide-react';

const navItems = [
  { name: 'Dashboard', href: '/', icon: Activity },
  { name: 'Connections', href: '/connections', icon: Cable },
  { name: 'Syncs', href: '/syncs', icon: FolderSync },
  { name: 'Runs', href: '/runs', icon: History },
  { name: 'Templates', href: '/templates', icon: LayoutTemplate },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);

  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden">
      {/* Sidebar */}
      <aside
        className={cn(
          "flex flex-col border-r border-border bg-card transition-all duration-300 z-10",
          isSidebarOpen ? "w-64" : "w-16"
        )}
      >
        <div className="flex h-14 items-center justify-between px-4 border-b border-border">
          {isSidebarOpen && (
            <Link href="/" className="flex items-center gap-2 font-display font-bold text-lg text-primary tracking-tight">
              <div className="w-6 h-6 rounded bg-primary/20 flex items-center justify-center border border-primary/50">
                <Cable className="w-4 h-4 text-primary" />
              </div>
              CONDUIT
            </Link>
          )}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            aria-label={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            aria-expanded={isSidebarOpen}
            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors mx-auto"
          >
            <Menu className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <nav aria-label="Main navigation" className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
          {navItems.map((item) => {
            const isActive = location === item.href || (item.href !== '/' && location.startsWith(item.href));
            return (
              <Link
                key={item.name}
                href={item.href}
                aria-label={!isSidebarOpen ? item.name : undefined}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md transition-colors font-medium text-sm",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className={cn("w-5 h-5 shrink-0", isActive ? "text-primary" : "text-muted-foreground")} aria-hidden="true" />
                {isSidebarOpen && <span>{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border">
          {isSidebarOpen ? (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center font-bold text-xs border border-border">
                OP
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold leading-none">Operator</span>
                <span className="text-xs text-muted-foreground">SZL System</span>
              </div>
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center font-bold text-xs border border-border mx-auto" title="Operator">
              OP
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main id="main-content" tabIndex={-1} className="flex-1 flex flex-col min-w-0 overflow-hidden relative" style={{ outline: 'none' }}>
        <header className="h-14 flex items-center px-6 border-b border-border bg-card/50 backdrop-blur shrink-0 justify-between">
           <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <span className="text-foreground capitalize">{location.split('/')[1] || 'Dashboard'}</span>
           </div>
           <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
                 <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse-dot"></span>
                 SYSTEM ONLINE
              </div>
           </div>
        </header>
        <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
          <div className="max-w-7xl mx-auto w-full animate-fade-in-up">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
