import React from 'react';
import { Link, useLocation } from 'wouter';
import { cn } from '@/lib/utils';
import {
  Activity,
  Brain,
  Cable,
  Cpu,
  Database,
  Eye,
  FlaskConical,
  FolderSync,
  History,
  Layers,
  LayoutTemplate,
  Settings,
  Menu,
  Gauge,
  Shield,
  Sparkles,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';

const navItems = [
  { name: 'Dashboard', href: '/', icon: Activity },
  { name: 'Compute', href: '/compute', icon: Cpu },
  { name: 'Connections', href: '/connections', icon: Cable },
  { name: 'Syncs', href: '/syncs', icon: FolderSync },
  { name: 'Runs', href: '/runs', icon: History },
  { name: 'Templates', href: '/templates', icon: LayoutTemplate },
  { name: 'Settings', href: '/settings', icon: Settings },
  { name: 'Admin Usage', href: '/admin/usage', icon: Gauge },
];

const sovereignItems = [
  { name: 'AI Hub', href: '/sovereign-ai-hub', icon: Shield },
  { name: 'Model Fleet', href: '/sovereign-ai-hub/model-fleet', icon: Layers },
  { name: 'Inference', href: '/sovereign-ai-hub/inference', icon: Eye },
  { name: 'Distillery', href: '/sovereign-ai-hub/distillery', icon: FlaskConical },
  { name: 'PRAXIS', href: '/sovereign-ai-hub/praxis', icon: Sparkles },
  { name: 'Data Estate', href: '/sovereign-ai-hub/data-estate', icon: Database },
  { name: 'Cognitive', href: '/sovereign-ai-hub/cognitive', icon: Brain },
];

const externalNavItems = [
  { name: 'A11oy Advisor', href: '/intelligence/', icon: Sparkles },
];

function NavLink({ item, isActive, collapsed }: { item: { name: string; href: string; icon: React.ComponentType<{ className?: string }> }; isActive: boolean; collapsed: boolean }) {
  return (
    <Link
      href={item.href}
      aria-label={collapsed ? item.name : undefined}
      aria-current={isActive ? 'page' : undefined}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-150 text-[13px] font-medium",
        isActive
          ? "bg-[#1a1a1a] text-[#c9b787]"
          : "text-[#8a8a8a] hover:bg-[#141414] hover:text-[#f5f5f5]"
      )}
    >
      <item.icon className={cn("w-[18px] h-[18px] shrink-0", isActive ? "text-[#c9b787]" : "text-[#666]")} aria-hidden="true" />
      {!collapsed && <span>{item.name}</span>}
    </Link>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);

  const breadcrumb = location === '/' ? 'Dashboard' : location.split('/').filter(Boolean).map(s => s.charAt(0).toUpperCase() + s.slice(1).replace(/-/g, ' ')).join(' / ');

  return (
    <div className="flex h-screen w-full overflow-hidden" style={{ background: '#0a0a0a', color: '#f5f5f5' }}>
      <aside
        className={cn(
          "flex flex-col border-r border-[rgba(255,255,255,0.06)] transition-all duration-300 z-10 shrink-0",
          isSidebarOpen ? "w-60" : "w-16"
        )}
        style={{ background: '#0e0e0e' }}
      >
        <div className="flex h-14 items-center justify-between px-4 border-b border-[rgba(255,255,255,0.06)]">
          {isSidebarOpen && (
            <Link href="/" className="flex items-center gap-2.5 font-display font-bold text-base tracking-tight">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center border border-[rgba(201,183,135,0.3)]" style={{ background: 'rgba(201,183,135,0.08)' }}>
                <span className="font-mono text-[11px] font-bold text-[#c9b787]">A</span>
              </div>
              <span className="text-[#f5f5f5]">Amaru</span>
            </Link>
          )}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            aria-label={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            aria-expanded={isSidebarOpen}
            className="p-1.5 rounded-lg hover:bg-[#1a1a1a] text-[#666] hover:text-[#f5f5f5] transition-colors"
          >
            <Menu className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <nav aria-label="Main navigation" className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {isSidebarOpen && (
            <p className="px-3 pt-1 pb-2 text-[10px] font-mono uppercase tracking-[0.18em] text-[#555]">
              Conduit Core
            </p>
          )}
          {navItems.map((item) => {
            const isActive = location === item.href || (item.href !== '/' && location.startsWith(item.href));
            return <NavLink key={item.name} item={item} isActive={isActive} collapsed={!isSidebarOpen} />;
          })}

          <div className="my-3 mx-3 h-px bg-[rgba(255,255,255,0.04)]" />

          {isSidebarOpen && (
            <p className="px-3 pt-1 pb-2 text-[10px] font-mono uppercase tracking-[0.18em] text-[#555]">
              Sovereign AI Hub
            </p>
          )}
          {sovereignItems.map((item) => {
            const isActive = location === item.href || (location.startsWith(item.href) && item.href !== '/sovereign-ai-hub');
            return <NavLink key={item.name} item={item} isActive={isActive} collapsed={!isSidebarOpen} />;
          })}

          <div className="my-3 mx-3 h-px bg-[rgba(255,255,255,0.04)]" />

          {isSidebarOpen && (
            <p className="px-3 pt-1 pb-2 text-[10px] font-mono uppercase tracking-[0.18em] text-[#555]">
              Cross-Platform
            </p>
          )}
          {externalNavItems.map((item) => (
            <a
              key={item.name}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={!isSidebarOpen ? item.name : undefined}
              className="flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-150 text-[13px] font-medium text-[#8a8a8a] hover:bg-[#141414] hover:text-[#f5f5f5]"
            >
              <item.icon className="w-[18px] h-[18px] shrink-0 text-[#666]" aria-hidden="true" />
              {isSidebarOpen && (
                <span className="flex-1 flex items-center justify-between">
                  {item.name}
                  <ExternalLink className="w-3 h-3 opacity-40" />
                </span>
              )}
            </a>
          ))}
        </nav>

        <div className="p-3 border-t border-[rgba(255,255,255,0.06)]">
          {isSidebarOpen ? (
            <div className="flex items-center gap-3 px-1">
              <div className="w-8 h-8 rounded-full flex items-center justify-center font-mono font-bold text-[10px] border border-[rgba(255,255,255,0.08)] text-[#c9b787]" style={{ background: 'rgba(201,183,135,0.08)' }}>
                OP
              </div>
              <div className="flex flex-col">
                <span className="text-[13px] font-medium text-[#f5f5f5] leading-none">Operator</span>
                <span className="text-[11px] text-[#666] mt-0.5">SZL System</span>
              </div>
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full flex items-center justify-center font-mono font-bold text-[10px] border border-[rgba(255,255,255,0.08)] text-[#c9b787] mx-auto" style={{ background: 'rgba(201,183,135,0.08)' }} title="Operator">
              OP
            </div>
          )}
        </div>
      </aside>

      <main id="main-content" tabIndex={-1} className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <header className="h-14 flex items-center px-6 border-b border-[rgba(255,255,255,0.06)] shrink-0 justify-between glass-panel">
           <div className="flex items-center gap-2 text-[13px] text-[#8a8a8a]">
              <span className="text-[#f5f5f5] font-medium">{breadcrumb}</span>
           </div>
           <div className="flex items-center gap-5">
              <div className="flex items-center gap-2 text-[10px] font-mono tracking-[0.15em] uppercase text-[#666]">
                 <span className="w-1.5 h-1.5 rounded-full bg-[#5a8a6e]" style={{ boxShadow: '0 0 6px rgba(90,138,110,0.5)' }}></span>
                 Governed Environment
              </div>
           </div>
        </header>
        <div className="flex-1 overflow-y-auto scroll-smooth" style={{ background: '#0a0a0a' }}>
          <div className="max-w-7xl mx-auto w-full animate-fade-in-up p-6">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
