import * as React from "react";
import { Link, useLocation } from "wouter";
import { LayoutDashboard, Film, Video, Mic, FolderOpen, Search, Bell, Settings, Server, Wifi, WifiOff, Sparkles, Activity, Calendar, Image, BookOpen, Wand2, Palette, Users } from "lucide-react";
import { cn } from "./ui";

function DemoModeBanner() {
  return null;
}

function IntegrationStatusFooter() {
  return (
    <div className="px-6 pb-2 space-y-2">
      <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</div>
      <div className="flex flex-wrap gap-1">
        <span className="inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400">
          <Wifi className="w-2.5 h-2.5" /> All Systems Live
        </span>
      </div>
    </div>
  );
}

const navItems = [
  { name: "Workspace", href: "/", icon: LayoutDashboard },
  { name: "Campaigns", href: "/campaigns", icon: Film },
  { name: "Global Assets", href: "/assets", icon: FolderOpen },
  { name: "Voices", href: "/voice", icon: Mic },
  { name: "AI Studio", href: "/ai-studio", icon: Sparkles },
  { name: "Observability", href: "/observability", icon: Activity },
  { name: "Content Calendar", href: "/content-calendar", icon: Calendar },
  { name: "Social Assets", href: "/social-assets", icon: Image },
  { name: "Content Library", href: "/content-guides", icon: BookOpen },
  { name: "Generator Tools", href: "/generators", icon: Wand2 },
  { name: "Aurora Gallery", href: "/aurora", icon: Palette },
  { name: "Brand Voice Engine", href: "/brand-voice", icon: Mic },
  { name: "Voice Studio", href: "/voice-studio", icon: Search },
  { name: "Motion Graphics", href: "/motion-graphics", icon: Film },
  { name: "Collab Workspace", href: "/collab", icon: Users },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="min-h-screen bg-background flex w-full overflow-hidden text-foreground">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card/50 backdrop-blur-xl flex flex-col justify-between hidden md:flex shrink-0">
        <div>
          <div className="h-16 flex items-center px-6 border-b border-border/50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary via-amber-400 to-amber-300 flex items-center justify-center shadow-lg shadow-primary/30 cinematic-glow">
                <Video className="w-4 h-4 text-primary-foreground" />
              </div>
              <div className="flex flex-col">
                <span className="font-display font-bold text-base tracking-[0.2em] text-foreground leading-none">DREAMSCAPE</span>
                <span className="text-[9px] uppercase tracking-[0.3em] text-muted-foreground/60 leading-none mt-0.5">Creative Engine</span>
              </div>
            </div>
          </div>
          
          <nav className="p-4 space-y-1">
            {navItems.map(item => {
              const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
              return (
                <Link key={item.name} href={item.href} className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 group",
                  isActive 
                    ? "bg-primary/10 text-primary" 
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}>
                  <item.icon className={cn("w-4 h-4", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        <IntegrationStatusFooter />
        <div className="p-4 border-t border-border/50">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-muted border border-border flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-muted-foreground">SJ</span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium leading-none">Sarah Jenkins</span>
              <span className="text-xs text-muted-foreground mt-1">Creative Director</span>
            </div>
          </div>
        </div>
        <div className="p-4 border-t border-border/50">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Video className="w-3 h-3" />
            <span>SZL Holdings Platform</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <DemoModeBanner />
        {/* Top Header */}
        <header className="h-16 border-b border-border bg-background/80 backdrop-blur-md flex items-center justify-between px-6 shrink-0 z-10 sticky top-0">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative w-64 md:w-96">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Search campaigns, scripts, assets..." 
                className="w-full bg-muted/50 border border-border/50 rounded-full pl-9 pr-4 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-foreground placeholder:text-muted-foreground"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="text-muted-foreground hover:text-primary transition-colors relative">
              <Bell className="w-5 h-5" />
              <span className="absolute 1 top-0 right-0 w-2 h-2 bg-primary rounded-full"></span>
            </button>
            <button className="text-muted-foreground hover:text-foreground transition-colors">
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </header>
        
        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
