import { Link, useLocation } from "wouter";
import { cn } from "@workspace/shared-ui/utils";
import { ReactNode, useState } from "react";
import { Sparkles, Film, Megaphone, Mic2, Palette, FolderOpen, Calendar, BarChart3, Eye, Image, Menu, X, Bell, Layers } from "lucide-react";

const NAV_SECTIONS = [
  {
    title: "Studio",
    items: [
      { href: "/", label: "Campaign Hub", icon: FolderOpen },
      { href: "/brand-voice", label: "Brand Voice Engine", icon: Sparkles },
      { href: "/ai-studio", label: "AI Studio", icon: Film },
    ],
  },
  {
    title: "Production",
    items: [
      { href: "/content-calendar", label: "Content Calendar", icon: Calendar },
      { href: "/motion-graphics", label: "Motion Graphics", icon: Layers },
      { href: "/voice-studio", label: "Voice Studio", icon: Mic2 },
      { href: "/social-assets", label: "Social Assets", icon: Image },
    ],
  },
  {
    title: "Intelligence",
    items: [
      { href: "/content-guides", label: "Content Guides", icon: Eye },
      { href: "/generator-tools", label: "Generator Tools", icon: Megaphone },
      { href: "/aurora-gallery", label: "Aurora Gallery", icon: Palette },
    ],
  },
];

export function AlloyIntelligenceLayout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-full overflow-hidden">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-10 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <aside className={cn(
        "border-r flex flex-col shrink-0 z-20 transition-transform duration-200",
        "fixed md:relative inset-y-0 left-0 w-56",
        sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
      )} style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(8,6,18,0.97)" }}>
        <div className="h-14 flex items-center px-4 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg shadow-lg" style={{ background: "linear-gradient(135deg, #ec4899, #8b5cf6)", boxShadow: "0 0 12px rgba(236,72,153,0.35)" }}>
              <Film className="w-4 h-4 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-sm tracking-wide text-white leading-none">Dreamscape</span>
              <span className="text-[9px] uppercase tracking-widest leading-none mt-0.5" style={{ color: "#ec4899" }}>Creative Studio</span>
            </div>
          </div>
        </div>

        <nav className="px-2 py-3 flex-1 flex flex-col gap-3 overflow-y-auto">
          {NAV_SECTIONS.map((section) => (
            <div key={section.title}>
              <p className="text-[9px] font-medium uppercase tracking-widest mb-1.5 px-3" style={{ color: "rgba(255,255,255,0.25)" }}>{section.title}</p>
              <div className="flex flex-col gap-0.5">
                {section.items.map((item) => {
                  const isActive = item.href === "/" ? location === "/" : location.startsWith(item.href);
                  return (
                    <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)} className={cn(
                      "flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 group relative",
                      isActive ? "text-pink-400" : "text-slate-400 hover:text-white hover:bg-white/5"
                    )} style={{ background: isActive ? "rgba(236,72,153,0.08)" : undefined }}>
                      {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-r-full" style={{ background: "#ec4899" }} />}
                      <item.icon className={cn("w-3.5 h-3.5 shrink-0", isActive ? "text-pink-400" : "text-slate-500 group-hover:text-slate-300")} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-3 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          <div className="flex items-center gap-2 text-[10px] mb-2" style={{ color: "rgba(255,255,255,0.3)" }}>
            <Sparkles className="w-3 h-3" />
            <span>SZL Holdings · Creative</span>
          </div>
          <div className="flex gap-1 flex-wrap">
            <a href="/alloy/" className="text-[9px] px-1.5 py-0.5 rounded font-medium hover:opacity-80" style={{ color: "#00d4ff", background: "rgba(0,212,255,0.1)", border: "1px solid rgba(0,212,255,0.2)" }}>ALLOY</a>
            <a href="/lyte-command-center/" className="text-[9px] px-1.5 py-0.5 rounded font-medium hover:opacity-80" style={{ color: "#f59e0b", background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)" }}>LYTE</a>
            <a href="/" className="text-[9px] px-1.5 py-0.5 rounded font-medium hover:opacity-80" style={{ color: "#94a3b8", background: "rgba(148,163,184,0.1)", border: "1px solid rgba(148,163,184,0.2)" }}>SZL</a>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-12 border-b flex items-center justify-between px-4 md:px-6 shrink-0" style={{ borderColor: "rgba(255,255,255,0.05)", background: "rgba(8,6,18,0.85)", backdropFilter: "blur(8px)" }}>
          <div className="flex items-center gap-3 text-xs font-mono">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden p-1.5 rounded-lg hover:bg-white/5 transition-colors mr-2"
              style={{ color: "rgba(255,255,255,0.5)" }}
              aria-label="Toggle sidebar"
            >
              {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse hidden sm:block" style={{ background: "#ec4899" }} />
            <span className="hidden sm:block" style={{ color: "#ec4899" }}>4 Active Campaigns</span>
            <span className="hidden sm:block" style={{ color: "rgba(255,255,255,0.15)" }}>·</span>
            <span style={{ color: "#10b981" }}>2 In Production</span>
            <span className="hidden sm:block" style={{ color: "rgba(255,255,255,0.15)" }}>·</span>
            <span className="hidden sm:block" style={{ color: "#f59e0b" }}>1 Pending Review</span>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative p-1.5 rounded-lg hover:bg-white/5 transition-colors" style={{ color: "rgba(255,255,255,0.4)" }}>
              <Bell className="w-4 h-4" />
            </button>
            <div className="h-5 w-px hidden sm:block" style={{ background: "rgba(255,255,255,0.08)" }} />
            <div className="hidden sm:flex items-center gap-2">
              <div className="text-right">
                <div className="text-xs font-medium text-white">Stephen Lutar</div>
                <div className="text-[10px]" style={{ color: "rgba(236,72,153,0.7)" }}>Creative Director</div>
              </div>
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border" style={{ background: "linear-gradient(135deg, #ec4899, #8b5cf6)", borderColor: "rgba(255,255,255,0.1)" }}>SL</div>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-4 md:p-6" style={{ background: "linear-gradient(180deg, #080614 0%, #0a0818 100%)" }}>
          {children}
        </main>
      </div>
    </div>
  );
}
