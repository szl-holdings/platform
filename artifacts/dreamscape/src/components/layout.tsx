import * as React from "react";
import { Link, useLocation } from "wouter";
import { LayoutDashboard, Film, Video, Search, Bell, Settings, Sparkles, Calendar, Image, BookOpen, Wand2, Palette, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "./ui";
import { useState } from "react";
import { UserButton } from "@workspace/shared-ui/UserButton";

const navItems = [
  { name: "Workspace", href: "/", icon: LayoutDashboard },
  { name: "Campaigns", href: "/campaigns", icon: Film },
  { name: "AI Studio", href: "/ai-studio", icon: Sparkles },
  { name: "Content Calendar", href: "/content-calendar", icon: Calendar },
  { name: "Social Assets", href: "/social-assets", icon: Image },
  { name: "Aurora Gallery", href: "/aurora", icon: Palette },
  { name: "Generator Tools", href: "/generators", icon: Wand2 },
  { name: "Content Library", href: "/content-guides", icon: BookOpen },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-background flex w-full overflow-hidden text-foreground">
      {/* Sidebar */}
      <aside className={cn(
        "border-r border-border bg-card/60 backdrop-blur-xl flex flex-col justify-between hidden md:flex shrink-0 transition-all duration-300",
        collapsed ? "w-16" : "w-60"
      )}>
        <div>
          <div className={cn("h-16 flex items-center border-b border-border/50", collapsed ? "justify-center px-3" : "px-5")}>
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-violet-500 via-pink-500 to-amber-400 flex items-center justify-center shadow-lg shrink-0">
                <Video className="w-4 h-4 text-white" />
              </div>
              {!collapsed && (
                <div className="flex flex-col min-w-0">
                  <span className="font-display font-bold text-sm tracking-wide text-foreground leading-none truncate">Dreamscape</span>
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground/60 leading-none mt-0.5">Creative Studio</span>
                </div>
              )}
            </div>
          </div>

          <nav className={cn("py-4 space-y-0.5", collapsed ? "px-2" : "px-3")}>
            {navItems.map(item => {
              const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
              return (
                <Link key={item.name} href={item.href} className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 group",
                  collapsed && "justify-center px-2",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                )}>
                  <item.icon className={cn("w-4 h-4 shrink-0", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                  {!collapsed && item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        <div>
          <div className="px-3 pb-2">
            <div className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg", collapsed && "justify-center px-2")}>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              {!collapsed && <span className="text-[10px] text-emerald-400 font-medium">All Systems Live</span>}
            </div>
          </div>
          <div className="p-3 border-t border-border/50">
            <UserButton showName={!collapsed} className="w-full" />
          </div>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full p-3 border-t border-border/50 text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top Header */}
        <header className="h-14 border-b border-border bg-background/80 backdrop-blur-md flex items-center justify-between px-6 shrink-0 z-10 sticky top-0">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative w-64 max-w-sm">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search campaigns, assets..."
                className="w-full bg-muted/50 border border-border/50 rounded-lg pl-8 pr-4 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all text-foreground placeholder:text-muted-foreground"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="text-muted-foreground hover:text-primary transition-colors relative">
              <Bell className="w-4.5 h-4.5" />
              <span className="absolute top-0 right-0 w-1.5 h-1.5 bg-primary rounded-full"></span>
            </button>
            <button className="text-muted-foreground hover:text-foreground transition-colors">
              <Settings className="w-4.5 h-4.5" />
            </button>
          </div>
        </header>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
