import { Bell, Search, Menu, Shield } from "lucide-react";
import { CLIENT } from "@/data/mock";

interface TopBarProps {
  title: string;
  subtitle?: string;
  onMenuClick?: () => void;
}

export function TopBar({ title, subtitle, onMenuClick }: TopBarProps) {
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });

  return (
    <header className="forge-topbar flex items-center gap-4 px-6 py-3.5 sticky top-0 z-30">
      <button
        className="lg:hidden forge-btn-ghost p-1.5"
        onClick={onMenuClick}
        aria-label="Toggle sidebar"
      >
        <Menu className="w-5 h-5" />
      </button>

      <div className="flex-1 min-w-0">
        <h1 className="text-lg font-700 leading-tight truncate" style={{ color: "var(--color-forge-text)", fontFamily: "var(--font-display)" }}>{title}</h1>
        {subtitle && (
          <p className="text-xs mt-0.5 truncate" style={{ color: "var(--color-forge-text-muted)" }}>{subtitle}</p>
        )}
      </div>

      <div className="hidden md:flex items-center gap-1.5">
        <Shield className="w-3 h-3" style={{ color: "var(--color-forge-success)" }} />
        <span className="text-xs" style={{ color: "var(--color-forge-text-muted)" }}>Secure Session</span>
      </div>

      <div className="text-xs hidden lg:block" style={{ color: "var(--color-forge-text-faint)", fontFamily: "var(--font-mono)" }}>
        {dateStr}
      </div>

      <div className="flex items-center gap-2">
        <button className="forge-btn-ghost p-2" aria-label="Search">
          <Search className="w-4 h-4" />
        </button>
        <button className="forge-btn-ghost p-2 relative" aria-label="Notifications">
          <Bell className="w-4 h-4" />
          <span
            className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full"
            style={{ background: "var(--color-forge-primary)" }}
          />
        </button>
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-700 cursor-pointer"
          style={{ background: "var(--color-forge-gold)", fontFamily: "var(--font-display)" }}
        >
          {CLIENT.avatarInitials}
        </div>
      </div>
    </header>
  );
}
