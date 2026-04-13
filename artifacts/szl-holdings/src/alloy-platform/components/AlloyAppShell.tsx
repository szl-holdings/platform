import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useUser, useClerk } from "../clerk-stub";
import { 
  MessageSquare, Users, GitBranch, Image, Share2, 
  Shield, Code2, User, LogOut, Menu, X, Search
} from "lucide-react";
import { AlloyCommandPalette } from "./AlloyCommandPalette";
import { cn } from "@szl-holdings/shared-ui/utils";

const NAV_GROUPS = [
  {
    title: "Core",
    items: [
      { label: "Chat", icon: MessageSquare, href: "/app/chat" },
      { label: "Agents", icon: Users, href: "/app/agents" },
      { label: "Workflows", icon: GitBranch, href: "/app/workflows" },
      { label: "Multimodal", icon: Image, href: "/app/multimodal" },
    ]
  },
  {
    title: "Platform",
    items: [
      { label: "Connectors", icon: Share2, href: "/app/connectors" },
      { label: "Governance", icon: Shield, href: "/app/governance" },
    ]
  },
  {
    title: "Developer",
    items: [
      { label: "Developer Portal", icon: Code2, href: "/app/developer" },
    ]
  }
];

export function AlloyAppShell({ children, title }: { children: React.ReactNode, title: string }) {
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const { user } = useUser();
  const { signOut } = useClerk();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCmdOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden text-slate-200 bg-[#080c14] font-sans">
      <AlloyCommandPalette isOpen={cmdOpen} onClose={() => setCmdOpen(false)} />

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/60 md:hidden" 
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 border-r border-slate-800 bg-[#0b101a] transition-transform duration-200 md:relative md:translate-x-0 flex flex-col",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex h-14 items-center justify-between px-4 border-b border-slate-800">
          <Link href="/app/chat" className="flex items-center gap-2 text-white font-semibold">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-[#4B8BDB] text-white">
              <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <span>Alloy</span>
          </Link>
          <button className="md:hidden text-slate-400 hover:text-white" onClick={() => setSidebarOpen(false)}>
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
          {NAV_GROUPS.map((group) => (
            <div key={group.title}>
              <div className="px-3 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {group.title}
              </div>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const isActive = location.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                        isActive 
                          ? "bg-[#4B8BDB]/10 text-[#4B8BDB]" 
                          : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
                      )}
                    >
                      <item.icon size={16} className={isActive ? "text-[#4B8BDB]" : "text-slate-500"} />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="p-3 border-t border-slate-800">
          <Link
            href="/app/account"
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
              location.startsWith("/app/account")
                ? "bg-[#4B8BDB]/10 text-[#4B8BDB]"
                : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
            )}
          >
            <User size={16} />
            Account
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#080c14]">
        <header className="h-14 flex items-center justify-between px-4 border-b border-slate-800 bg-[#080c14]/80 backdrop-blur z-30">
          <div className="flex items-center gap-3">
            <button className="md:hidden text-slate-400 hover:text-white" onClick={() => setSidebarOpen(true)}>
              <Menu size={20} />
            </button>
            <h1 className="text-sm font-semibold text-slate-200">{title}</h1>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => setCmdOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 text-xs text-slate-400 bg-slate-900 border border-slate-800 rounded-md hover:bg-slate-800 transition-colors"
            >
              <Search size={14} />
              <span className="hidden sm:inline">Search...</span>
              <kbd className="hidden sm:inline-flex items-center gap-1 font-mono text-[10px] bg-slate-800 px-1.5 py-0.5 rounded">
                <span className="text-xs">⌘</span>K
              </kbd>
            </button>

            <div className="flex items-center gap-3">
              <div className="h-7 w-7 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700 overflow-hidden">
                {user?.imageUrl ? (
                  <img src={user.imageUrl} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  <User size={14} className="text-slate-400" />
                )}
              </div>
              <button onClick={() => signOut()} className="text-slate-500 hover:text-slate-300 transition-colors" aria-label="Sign out">
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </header>
        
        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
